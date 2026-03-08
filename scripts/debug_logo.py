from PIL import Image
import sys
img = Image.open('public/images/logo.png')
print(img.size)
img.thumbnail((120, 60))
chars = " .:-=+*#%@"
alpha = img.convert('RGBA').split()[-1]
for y in range(img.height):
    line = ""
    for x in range(img.width):
        a = alpha.getpixel((x, y))
        idx = int((a / 255.0) * 9)
        line += chars[idx]
    print(line)
