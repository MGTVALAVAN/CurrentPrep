from PIL import Image
import numpy as np

globe = Image.open('public/images/logo_globe.png')
print("Globe size:", globe.size)
# print ASCII to see if it has 'Current' text in it
w, h = globe.size
globe.thumbnail((100, 50))
arr = np.array(globe)
a = arr[:,:,3]
chars = " .:-=+*#%@"
print("--- GLOBE ASCII ---")
for y in range(a.shape[0]):
    line = ""
    for x in range(a.shape[1]):
        val = int((a[y,x] / 255.0) * 9)
        line += chars[val]
    print(line)

text = Image.open('public/images/logo_text_white.png')
print("Text size:", text.size)
text.thumbnail((100, 50))
arr2 = np.array(text)
a2 = arr2[:,:,3]
print("--- TEXT ASCII ---")
for y in range(a2.shape[0]):
    line = ""
    for x in range(a2.shape[1]):
        val = int((a2[y,x] / 255.0) * 9)
        line += chars[val]
    print(line)
