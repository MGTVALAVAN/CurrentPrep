from PIL import Image
img = Image.open('public/images/logo.png')
# Let's crop the globe from the left.
# Assuming the globe is around x=0 to x=600? Let's check size.
globe = img.crop((100, 100, 700, 800))
globe.save('scripts/test_globe.png')

text = img.crop((900, 300, 1800, 800))
text.save('scripts/test_text.png')
print("Cropped tests")
