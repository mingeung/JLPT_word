import os, subprocess, imageio_ffmpeg
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
FF = imageio_ffmpeg.get_ffmpeg_exe()
groups = [l.split() for l in open('groups.txt')]
picks = [int(g[len(g)//2].split('.')[0]) for g in groups]
os.makedirs('p', exist_ok=True)
def grab(i_n):
    i, n = i_n
    t = (n - 1) * 2
    subprocess.run([FF, '-loglevel', 'error', '-y', '-ss', str(t), '-i', 'video.mp4', '-frames:v', '1',
        '-vf', 'crop=iw*0.42:ih*0.97:0:0,scale=320:-1', '-q:v', '3', f'p/{i:04d}.jpg'], check=True)
with ThreadPoolExecutor(8) as ex: list(ex.map(grab, enumerate(picks)))
files = sorted(os.listdir('p'))
W, H = Image.open('p/' + files[0]).size
C, R = 5, 4
os.makedirs('sheets2', exist_ok=True)
for s in range(0, len(files), C*R):
    sheet = Image.new('RGB', (W*C, H*R), 'white')
    for k, f in enumerate(files[s:s+C*R]):
        sheet.paste(Image.open('p/' + f), ((k % C)*W, (k//C)*H))
    sheet.save(f'sheets2/s{s//(C*R):03d}.jpg', quality=88)
print(len(files), W, H)
