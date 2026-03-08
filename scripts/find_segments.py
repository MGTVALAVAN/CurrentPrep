from PIL import Image
import numpy as np

img = Image.open('public/images/logo.png').convert('RGB')
arr = np.array(img)
w = arr.shape[1]

# Let's check a narrow strip through the middle where text is likely to be
strip = arr[400:600, :]
dist = np.abs(strip - 255).sum(axis=2)
has_content = dist.max(axis=0) > 50

# print segments of content in this horizontal cross-section
start = -1
for x in range(w):
    if has_content[x] and start == -1:
        start = x
    elif not has_content[x] and start != -1:
        if x - start > 5:
            print(f"Content from {start} to {x} (width {x-start})")
        start = -1

if start != -1:
    print(f"Content from {start} to {w}")
