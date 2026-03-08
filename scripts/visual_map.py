from PIL import Image
import numpy as np

img = Image.open('public/images/logo.png').convert('RGB')
arr = np.array(img)
dist = np.abs(arr - 255).sum(axis=2)
col_max = dist.max(axis=0)

lines = []
for x in range(0, img.width, 10):
    val = max(col_max[x:x+10])
    lines.append('#' if val > 20 else ' ')

print("".join(lines))
