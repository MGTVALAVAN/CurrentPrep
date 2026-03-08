import sys
from PIL import Image
import numpy as np

def split_logo(input_path, out_globe, out_text):
    img = Image.open(input_path).convert("RGBA")
    arr = np.array(img)
    
    a = arr[:, :, 3]
    h, w = a.shape
    
    # Sum of alpha values along columns
    col_sums = a.sum(axis=0)
    
    # The image has a globe on left, text on right.
    # Find the largest gap of empty columns in the middle.
    
    split_x = 900
    
    print(f"Splitting at x={split_x} out of width={w}")
    
    # Crop globe
    globe = Image.fromarray(arr[:, :split_x])
    # Crop text
    text = Image.fromarray(arr[:, split_x:])
    
    # Apply bounding box crop to both
    def tighten(im):
        im_arr = np.array(im)
        alpha = im_arr[:, :, 3]
        coords = np.argwhere(alpha > 10)
        if len(coords) == 0:
            return im
        y0, x0 = coords.min(axis=0)
        y1, x1 = coords.max(axis=0) + 1
        return im.crop((x0, y0, x1, y1))
        
    tighten(globe).save(out_globe)
    tighten(text).save(out_text)
    print("Saved globe and text parts")

if __name__ == "__main__":
    split_logo("public/images/logo_cropped.png", "public/images/logo_globe.png", "public/images/logo_text.png")
