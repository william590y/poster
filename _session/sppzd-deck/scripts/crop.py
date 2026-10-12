import sys
from PIL import Image
# usage: crop.py src out x0 y0 x1 y1 [scale]  coords in displayed px (scale default 1.375)
src,out=sys.argv[1],sys.argv[2]
x0,y0,x1,y1=[float(v) for v in sys.argv[3:7]]
s=float(sys.argv[7]) if len(sys.argv)>7 else 2125/1546
im=Image.open(src).convert('RGB')
box=tuple(int(round(v*s)) for v in (x0,y0,x1,y1))
c=im.crop(box)
c.save(out)
print(out,c.size,'page size',im.size)
