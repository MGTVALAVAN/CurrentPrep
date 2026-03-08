from PIL import Image
import sys

def remove_background(input_path, output_path):
    img = Image.open(input_path)
    img = img.convert("RGBA")
    
    datas = img.getdata()
    newData = []
    
    for item in datas:
        # Check if the pixel is white or very close to white (high RGB values)
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0)) # Make it transparent
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python remove_bg.py <input> <output>")
        sys.exit(1)
    remove_background(sys.argv[1], sys.argv[2])
