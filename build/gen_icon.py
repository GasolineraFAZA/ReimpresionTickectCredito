from PIL import Image, ImageDraw, ImageFont
import os

SIZE = 512
img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# Fondo redondeado naranja (degradado simple: relleno sólido)
margin = 24
radius = 110
orange = (234, 88, 12, 255)   # orange-600
d.rounded_rectangle(
    [margin, margin, SIZE - margin, SIZE - margin],
    radius=radius,
    fill=orange
)

# Texto "P+"
text = "P+"
# Buscar una fuente bold del sistema
font = None
for path in [
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/segoeuib.ttf",
    "C:/Windows/Fonts/Arial.ttf",
]:
    if os.path.exists(path):
        font = ImageFont.truetype(path, 280)
        break
if font is None:
    font = ImageFont.load_default()

bbox = d.textbbox((0, 0), text, font=font)
tw = bbox[2] - bbox[0]
th = bbox[3] - bbox[1]
tx = (SIZE - tw) / 2 - bbox[0]
ty = (SIZE - th) / 2 - bbox[1]
d.text((tx, ty), text, font=font, fill=(255, 255, 255, 255))

base = os.path.dirname(os.path.abspath(__file__))

# PNG
png_path = os.path.join(base, "icon.png")
img.save(png_path, "PNG")

# ICO (multi-tamaño)
ico_path = os.path.join(base, "icon.ico")
img.save(ico_path, "ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])

# Copia a resources
res_path = os.path.join(base, "..", "resources", "icon.png")
img.save(res_path, "PNG")

print("OK:", png_path, ico_path, res_path)
