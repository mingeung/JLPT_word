// 동기화 코드별 진행 기록 저장소 (Upstash Redis REST API 사용)
// GET  /api/progress?id=CODE  → { state, words, updatedAt } 또는 404
// PUT  /api/progress?id=CODE  ← { state, words, updatedAt }

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const MAX_BYTES = 200 * 1024;

async function redis(command) {
  const res = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`redis ${res.status}`);
  return (await res.json()).result;
}

module.exports = async (req, res) => {
  // 로컬 index.html(file://)에서도 쓸 수 있게 허용
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (!URL_ || !TOKEN) return res.status(500).json({ error: 'Redis가 연결되지 않았어요' });

  const id = String(req.query.id || '');
  if (!/^[A-Z0-9]{12}$/.test(id)) return res.status(400).json({ error: '잘못된 코드' });
  const key = `progress:${id}`;

  try {
    if (req.method === 'GET') {
      const raw = await redis(['GET', key]);
      if (!raw) return res.status(404).json({ error: '기록 없음' });
      return res.status(200).json(JSON.parse(raw));
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || typeof body.state !== 'object' || typeof body.updatedAt !== 'number') {
        return res.status(400).json({ error: '잘못된 데이터' });
      }
      const data = JSON.stringify({ state: body.state, words: body.words || null, updatedAt: body.updatedAt });
      if (Buffer.byteLength(data) > MAX_BYTES) return res.status(413).json({ error: '데이터가 너무 커요' });

      // 서버에 더 최근 기록이 있으면 덮어쓰지 않음
      const prev = await redis(['GET', key]);
      if (prev && JSON.parse(prev).updatedAt > body.updatedAt) {
        return res.status(409).json(JSON.parse(prev));
      }
      await redis(['SET', key, data]);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: '허용되지 않는 요청' });
  } catch (e) {
    return res.status(502).json({ error: '저장소 오류' });
  }
};
