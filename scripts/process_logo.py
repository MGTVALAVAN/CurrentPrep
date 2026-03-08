import sys
from PIL import Image

def process_logo(input_path, output_light, output_dark):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    light_img = Image.new("RGBA", (width, height))
    dark_img = Image.new("RGBA", (width, height))
    
    pixels = img.load()
    light_pixels = light_img.load()
    dark_pixels = dark_img.load()
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Grayscale / lightness
            l = int(0.299 * r + 0.587 * g + 0.114 * b)
            # Saturation approximation
            sat = max(r, g, b) - min(r, g, b)
            
            # 1. Background removal (White / Light gray with low saturation)
            # We want to smoothly fade out the drop shadow.
            if sat < 30 and l > 200:
                # Fully transparent for pure white
                if l >= 245:
                    alpha = 0
                else:
                    # Fade shadow: map 200-245 to 255-0
                    alpha = int(255 * (245 - l) / 45.0)
                
                # Use dark shadow color for light mode, light shadow for dark mode?
                # Actually shadow on dark mode looks bad. Let's just remove shadow completely.
                light_pixels[x, y] = (0, 0, 0, 0)
                dark_pixels[x, y] = (0, 0, 0, 0)
            
            # 2. Shadow removal more aggressively
            elif sat < 15 and l > 150:
                light_pixels[x, y] = (0, 0, 0, 0)
                dark_pixels[x, y] = (0, 0, 0, 0)

            # 3. Text color inversion (Dark gray/black with low saturation)
            elif sat < 40 and l < 100:
                # Keep as is for light mode
                light_pixels[x, y] = (r, g, b, a)
                # Invert for dark mode (make it white/light gray)
                # target lightness ~ 220
                dark_pixels[x, y] = (220, 220, 220, a)
            
            # 4. Colorful logo parts (preserve)
            else:
                light_pixels[x, y] = (r, g, b, a)
                dark_pixels[x, y] = (r, g, b, a)
                
    light_img.save(output_light, "PNG")
    dark_img.save(output_dark, "PNG")
    print("Processed logos created.")

if __name__ == "__main__":
    process_logo("public/images/logo.png", "public/images/logo_light.png", "public/images/logo_dark.png")
