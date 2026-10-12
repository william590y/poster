import sys, glob, os
from PIL import Image, ImageDraw, ImageFont
files = sorted(glob.glob(os.path.join(sys.argv[1], 'f*.png')))
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 4
tw, th = 640, 360
rows = (len(files) + cols - 1) // cols
sh = Image.new('RGB', (cols * tw + (cols + 1) * 8, rows * (th + 34) + 8), (10, 14, 18))
d = ImageDraw.Draw(sh)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 20)
except Exception: font = None
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((tw, th), Image.LANCZOS)
    x, y = 8 + (i % cols) * (tw + 8), 8 + (i // cols) * (th + 34)
    sh.paste(im, (x, y)); d.text((x + 4, y + th + 6), os.path.basename(f)[:-4], fill=(200, 210, 205), font=font)
sh.save(sys.argv[2]); print(sys.argv[2], sh.size)
