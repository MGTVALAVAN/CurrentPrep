from PIL import Image
import numpy as np

def run():
    img = Image.open('public/images/logo.png').convert('RGB')
    img.thumbnail((80, 40))
    arr = np.array(img)
    dist = np.abs(arr - 255).sum(axis=2)
    for y in range(dist.shape[0]):
        line = ""
        for x in range(dist.shape[1]):
            line += '#' if dist[y, x] > 50 else '.'
        print(line)
try:
    run()
except Exception as e:
    print(e)
