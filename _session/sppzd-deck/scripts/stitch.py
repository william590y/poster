import sys
from PIL import Image
out=sys.argv[1]; ims=[Image.open(p).convert('RGB') for p in sys.argv[2:]]
w=max(i.width for i in ims); gap=14
h=sum(i.height for i in ims)+gap*(len(ims)-1)
c=Image.new('RGB',(w,h),'white'); y=0
for i in ims:
    c.paste(i,(0,y)); y+=i.height+gap
c.save(out); print(out,c.size)
