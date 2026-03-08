import numpy as np
from PIL import Image

img = Image.open('public/images/logo.png').convert('RGBA')
arr = np.array(img)
a = arr[:,:,3]
# 'Current' starts at x=900? Let's check where 'Current' actually is!
col = a.sum(axis=0)

start = -1
for x in range(len(col)):
    if col[x] > 500 and start == -1:
        start = x
    elif col[x] <= 500 and start != -1:
        if x - start > 10:
            print(f"Component from {start} to {x}")
        start = -1

