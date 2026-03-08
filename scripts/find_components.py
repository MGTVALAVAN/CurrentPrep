import numpy as np
from PIL import Image

def find_components():
    img = Image.open('public/images/logo.png').convert('RGB')
    arr = np.array(img)
    # White is [255, 255, 255]. Let's compute distance from white.
    dist = np.abs(arr - 255).sum(axis=2)
    # column is considered "has content" if max distance from white is > 50
    has_content = dist.max(axis=0) > 50
    
    components = []
    start = -1
    for x in range(len(has_content)):
        if has_content[x] and start == -1:
            start = x
        elif not has_content[x] and start != -1:
            if x - start > 10:
                components.append((start, x))
            start = -1
            
    if start != -1:
        if len(has_content) - start > 10:
            components.append((start, len(has_content)))
            
    for idx, (s, e) in enumerate(components):
        print(f"Component {idx}: start={s}, end={e}, width={e-s}")
    
try:
    find_components()
except Exception as e:
    print(e)
