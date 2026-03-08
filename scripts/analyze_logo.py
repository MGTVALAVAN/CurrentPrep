import numpy as np
from PIL import Image

def analyze_logo(input_path):
    img = Image.open(input_path).convert("RGBA")
    arr = np.array(img)
    a = arr[:, :, 3]
    h, w = a.shape
    col_sums = a.sum(axis=0)
    
    # print columns with sum > 1000
    is_solid = col_sums > 1000
    
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
        
analyze_logo("public/images/logo_cropped.png")
