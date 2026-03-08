import numpy as np
from PIL import Image

img = Image.open('public/images/logo_text_white.png')
arr = np.array(img)
a = arr[:,:,3]
right_half = a[:, a.shape[1]//2 :]
print("Right half min alpha:", right_half.min())
print("Right half max alpha:", right_half.max())
print("Right half mean alpha:", right_half.mean())

left_half = a[:, : a.shape[1]//2]
print("Left half min alpha:", left_half.min())
print("Left half max alpha:", left_half.max())
print("Left half mean alpha:", left_half.mean())

# also check RGB of transparent pixels
r = arr[:,:,0]
mask = (a == 0)
print("Transparent pixels mean R:", r[mask].mean())
