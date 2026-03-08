import numpy as np
from PIL import Image
import sys

def analyze(input_path):
    print("ANALYZING:", input_path)
    img = Image.open(input_path).convert("RGBA")
    arr = np.array(img)
    a = arr[:, :, 3]
    h, w = a.shape
    col_sums = a.sum(axis=0)
    
    is_solid = col_sums > 500
    
    components = []
    current_start = -1
    for i in range(w):
        if is_solid[i] and current_start == -1:
            current_start = i
        elif not is_solid[i] and current_start != -1:
            components.append((current_start, i))
            current_start = -1
            
    if current_start != -1:
        components.append((current_start, w))
        
    for idx, (s, e) in enumerate(components):
        print(f"Component {idx}: start={s}, end={e}, width={e-s}")

analyze("public/images/logo_globe.png")
analyze("public/images/logo_text_white.png")
