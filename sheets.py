import os
from PIL import Image
groups = [l.split() for l in open('groups.txt')]
picks = [g[len(g)//2] for g in groups]
os.makedirs('sheets', exist_ok=True)
W, H = Image.open('f2/' + picks[0]).size
C, R = 5, 4
for s in range(0, len(picks), C*R):
    sheet = Image.new('RGB', (W*C, H*R), 'white')
    for i, f in enumerate(picks[s:s+C*R]):
        sheet.paste(Image.open('f2/' + f), ((i % C)*W, (i//C)*H))
    sheet.save(f'sheets/s{s//(C*R):03d}.jpg', quality=88)
print(len(picks), W, H)
