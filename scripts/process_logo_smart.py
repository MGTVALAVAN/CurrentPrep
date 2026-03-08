import sys
from PIL import Image
import numpy as np

def process_smart_alpha(input_path, output_dark, output_light):
    # Open image
    img = Image.open(input_path).convert("RGBA")
    arr = np.array(img, dtype=np.float32)
    
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]
    a = arr[:, :, 3]
    
    # Calculate difference from pure white (255, 255, 255)
    # Background is white, so higher difference means it's part of the logo
    diff_r = 255 - r
    diff_g = 255 - g
    diff_b = 255 - b
    
    # Max difference from white determines the opacity (alpha)
    # The darker/more colored a pixel is, the more opaque it should be
    max_diff = np.maximum(np.maximum(diff_r, diff_g), diff_b)
    
    # Create the new alpha channel
    new_a = np.clip(max_diff, 0, 255) * (a / 255.0)
    
    # To recover the original colors assuming it was blended with a white background:
    # C_original = 255 - (255 - C_blended) / (Alpha / 255)
    # Where Alpha is max_diff / 255
    alpha_norm = new_a / 255.0
    
    epsilon = 1e-6 # prevent division by zero
    
    new_r = 255 - (255 - r) / (alpha_norm + epsilon)
    new_g = 255 - (255 - g) / (alpha_norm + epsilon)
    new_b = 255 - (255 - b) / (alpha_norm + epsilon)
    
    # Clip values to 0-255 range
    new_r = np.clip(new_r, 0, 255)
    new_g = np.clip(new_g, 0, 255)
    new_b = np.clip(new_b, 0, 255)
    
    # Determine which pixels are the "text" by checking if the original pixel was dark and low saturation
    # We want to invert these pixels for dark mode
    luminance = 0.299 * r + 0.587 * g + 0.114 * b
    max_rgb = np.maximum(np.maximum(r, g), b)
    min_rgb = np.minimum(np.minimum(r, g), b)
    saturation = max_rgb - min_rgb
    
    # Mask for dark text (dark gray/black)
    text_mask = (luminance < 120) & (saturation < 30)
    
    dark_r = np.where(text_mask, 255, new_r)
    dark_g = np.where(text_mask, 255, new_g)
    dark_b = np.where(text_mask, 255, new_b)
    
    # Text stays dark for light mode (original colors)
    light_r = np.where(text_mask, new_r, new_r)
    light_g = np.where(text_mask, new_g, new_g)
    light_b = np.where(text_mask, new_b, new_b)
    
    # Combine back to an image array
    out_dark = np.stack([dark_r, dark_g, dark_b, new_a], axis=2).astype(np.uint8)
    out_light = np.stack([light_r, light_g, light_b, new_a], axis=2).astype(np.uint8)
    
    Image.fromarray(out_dark).save(output_dark, "PNG")
    Image.fromarray(out_light).save(output_light, "PNG")
    print(f"Saved {output_dark} and {output_light}")

if __name__ == "__main__":
    process_smart_alpha("public/images/logo.png", "public/images/logo_dark.png", "public/images/logo_light.png")
