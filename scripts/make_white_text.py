import sys
from PIL import Image
import numpy as np

def make_white_text(img_path, out_path):
    img = Image.open(img_path).convert("RGBA")
    arr = np.array(img, dtype=np.float32)
    
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]
    a = arr[:, :, 3]
    
    luminance = 0.299 * r + 0.587 * g + 0.114 * b
    max_rgb = np.maximum(np.maximum(r, g), b)
    min_rgb = np.minimum(np.minimum(r, g), b)
    saturation = max_rgb - min_rgb
    
    # We want text that is dark to become white
    # The user's logo has black text 'urrent', 'AS', 'rep'.
    # And colored caps 'C', 'I', 'P'
    # By changing dark pixels to white, we get white text with colored caps
    
    mask = (luminance < 150) & (saturation < 50)
    
    new_r = np.where(mask, 255, r)
    new_g = np.where(mask, 255, g)
    new_b = np.where(mask, 255, b)
    
    out = np.stack([new_r, new_g, new_b, a], axis=2).astype(np.uint8)
    Image.fromarray(out).save(out_path, "PNG")

if __name__ == "__main__":
    make_white_text(sys.argv[1], sys.argv[2])
