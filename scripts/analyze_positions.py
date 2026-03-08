import numpy as np
from PIL import Image

def analyze():
    img = Image.open('public/images/logo.png').convert('RGBA')
    arr = np.array(img)
    a = arr[:,:,3]
    h, w = a.shape
    col = a.sum(axis=0)
    
    start = -1
    for x in range(w):
        if col[x] > 500 and start == -1:
            start = x
        elif col[x] <= 500 and start != -1:
            end = x
            if end - start > 10:
                print(f"Component from {start} to {end} (width: {end-start})")
            start = -1
            
    if start != -1:
        print(f"Component from {start} to {w} (width: {w-start})")

analyze()
