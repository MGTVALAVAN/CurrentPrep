import sys
from PIL import Image
import numpy as np

def crop_transparent(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    arr = np.array(img)
    
    # alpha channel
    a = arr[:, :, 3]
    
    coords = np.argwhere(a > 10)
    if len(coords) == 0:
        print("Empty image")
        return
        
    y0, x0 = coords.min(axis=0)
    y1, x1 = coords.max(axis=0) + 1
    
    # Add a small padding
    pad = 10
    y0 = max(0, y0 - pad)
    x0 = max(0, x0 - pad)
    y1 = min(arr.shape[0], y1 + pad)
    x1 = min(arr.shape[1], x1 + pad)
    
    cropped = img.crop((x0, y0, x1, y1))
    cropped.save(output_path, "PNG")
    print(f"Cropped and saved to {output_path}")

if __name__ == "__main__":
    crop_transparent(sys.argv[1], sys.argv[2])
