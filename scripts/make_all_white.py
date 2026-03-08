from PIL import Image
import numpy as np
import sys

def convert_all_to_white():
    img = Image.open('public/images/logo_text.png').convert('RGBA')
    arr = np.array(img)
    # arr is HxWx4 (R,G,B,A). 
    # Let's make all pixels that have some alpha into pure white, preserving alpha.
    
    r = arr[:,:,0]
    g = arr[:,:,1]
    b = arr[:,:,2]
    a = arr[:,:,3]
    
    # Where alpha > 10, make RGB white (255)
    mask = a > 10
    
    r[mask] = 255
    g[mask] = 255
    b[mask] = 255
    
    # Save back
    out = Image.fromarray(arr)
    out.save('public/images/logo_text_white.png')
    print("Created logo_text_white.png with ALL white text!")

try:
    convert_all_to_white()
except Exception as e:
    print(e)
