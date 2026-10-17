import sys, os, numpy as np
from PIL import Image
d = sys.argv[1]
files = sorted(os.listdir(d))
prev = None; groups = []; cur = []
for f in files:
    a = np.asarray(Image.open(os.path.join(d, f)).convert('L'), dtype=np.int16)
    if prev is not None and np.abs(a - prev).mean() > 6:
        groups.append(cur); cur = []
    cur.append(f); prev = a
groups.append(cur)
print(len(groups))
print('sizes', sorted(len(g) for g in groups)[:15], sorted(len(g) for g in groups)[-10:])
with open('groups.txt', 'w') as o:
    for g in groups: o.write(' '.join(g) + '\n')
