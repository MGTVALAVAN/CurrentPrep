from PIL import Image
import numpy as np

def run():
    img = Image.open('public/images/logo.png').convert('RGB')
    arr = np.array(img)
    # the image height is 986. Let's look at the center vertically.
    # The text should be horizontally placed.
    # We want to find a vertical gap between the globe and the word "Current".
    # Wait, the word "C" might overlap horizontally with the globe?
    # Let's check vertical columns between x=800 and x=1000.
    dist = np.abs(arr[:, 800:1000] - 255).sum(axis=2)
    col_max = dist.max(axis=0)
    
    for x in range(200):
        print(f"x={800+x}: {'#' if col_max[x] > 50 else '.'}")

    
try:
    run()
except Exception as e:
    print(e)
