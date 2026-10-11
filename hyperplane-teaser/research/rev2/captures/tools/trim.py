#!/usr/bin/env python3
"""Trim uniform blank rows (white/page background) off the bottom of the captures, keeping a 16 px (2x) margin.
Only pixels are removed (no edits). Records trim in _meta/<id>.json."""
import json, os, sys
import numpy as np
from PIL import Image
CAP='/home/user/hyperplane-teaser/research/rev2/captures'
for f in sorted(os.listdir(CAP)):
    if not f.endswith('.png'): continue
    oid=f[:-4]; mp=f'{CAP}/_meta/{oid}.json'
    if not os.path.exists(mp): continue
    m=json.load(open(mp))
    if m.get('trimmed') is not None: continue
    im=Image.open(f'{CAP}/{f}').convert('RGB'); a=np.asarray(im).astype(int)
    H=a.shape[0]
    bg=a[-1,:,:].mean(axis=0)  # last row colour
    row_var=a.reshape(H,-1,3).std(axis=1).max(axis=1)
    row_dev=np.abs(a-bg).max(axis=(1,2))
    last=H-1
    while last>0 and row_dev[last]<6: last-=1
    newH=min(H,last+1+16)
    if H-newH>=24:
        im.crop((0,0,im.size[0],newH)).save(f'{CAP}/{f}')
        m['trimmed']=H-newH; m['crop_css'][3]=m['crop_css'][3]-(H-newH)/2
        print('trimmed',oid,H,'->',newH)
    else: m['trimmed']=0
    json.dump(m,open(mp,'w'),ensure_ascii=False,indent=1)
