import numpy as np
from PIL import Image

def find_text():
    print("Loading logo_text.png...")
    img = Image.open('public/images/logo_text.png').convert('RGBA')
    arr = np.array(img)
    a = arr[:,:,3]
    h, w = a.shape
    col = a.sum(axis=0)
    
    components = []
    start = -1
    for x in range(w):
        if col[x] > 500 and start == -1:
            start = x
        elif col[x] <= 500 and start != -1:
            if x - start > 10:
                components.append((start, x))
            start = -1
            
    if start != -1:
        if w - start > 10:
            components.append((start, w))
            
    print("Found text components in logo_text.png at X coordinates:", components)
    
    print("Loading logo_globe.png...")
    img2 = Image.open('public/images/logo_globe.png').convert('RGBA')
    arr2 = np.array(img2)
    a2 = arr2[:,:,3]
    h2, w2 = a2.shape
    col2 = a2.sum(axis=0)
    
    components2 = []
    start2 = -1
    for x in range(w2):
        if col2[x] > 500 and start2 == -1:
            start2 = x
        elif col2[x] <= 500 and start2 != -1:
            if x - start2 > 10:
                components2.append((start2, x))
            start2 = -1
            
    if start2 != -1:
        if w2 - start2 > 10:
            components2.append((start2, w2))
            
    print("Found components in logo_globe.png at X coordinates:", components2)

try:
    find_text()
except Exception as e:
    print(e)
