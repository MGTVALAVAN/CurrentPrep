import sys
from PIL import Image
import numpy as np

def print_ascii(img_path):
    img = Image.open(img_path).convert("RGBA")
    # Resize to a very small size for console, e.g., width 80
    aspect = img.height / img.width
    new_w = 80
    new_h = int(aspect * new_w * 0.5) # 0.5 because terminal chars are twice as tall as wide
    img = img.resize((new_w, new_h))
    
    arr = np.array(img)
    alpha = arr[:, :, 3]
    
    chars = " .:-=+*#%@"
    for y in range(new_h):
        line = ""
        for x in range(new_w):
            a = alpha[y, x]
            # map 0-255 to 0-9
            idx = int((a / 255.0) * 9)
            line += chars[idx]
        print(line)

print("--- GLOBE ---")
print_ascii("public/images/logo_globe.png")
print("--- TEXT ---")
print_ascii("public/images/logo_text.png")
