import json, os, sys, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
from PIL import Image
OUT = '/home/user/hyperplane-teaser/research/rev2'
j = json.load(open(OUT + '/screens.json'))
items = j['items']
valid_lyr = {os.path.basename(f)[:-5] for f in glob.glob('/home/user/hyperplane-teaser/research/long/lyrics/*.json')}
req = ['id', 'path', 'w', 'h', 'kind', 'outlet', 'date', 'url', 'text', 'tags', 'lyric', 'year', 'quality', 'highlights']
errs = []
ids = [r['id'] for r in items]
assert ids == sorted(ids), 'not sorted'
assert len(set(ids)) == len(ids), 'dup ids'
for r in items:
    for k in req:
        if k not in r or r[k] in (None, '', []) and k not in ('lyric',): errs.append((r['id'], 'missing ' + k))
    if r['kind'] not in ('headline', 'post', 'article', 'paper', 'figure'): errs.append((r['id'], 'kind'))
    if not (1 <= r['quality'] <= 5): errs.append((r['id'], 'quality'))
    if not os.path.exists(r['path']): errs.append((r['id'], 'path'))
    else:
        im = Image.open(r['path'])
        if im.size != (r['w'], r['h']): errs.append((r['id'], 'size', im.size))
    for l in r['lyric']:
        if l not in valid_lyr: errs.append((r['id'], 'lyric ' + l))
    if not (1 <= len(r['highlights']) <= 3): errs.append((r['id'], 'n highlights'))
    ocr = load_ocr(r['id'])
    if not ocr: errs.append((r['id'], 'no ocr')); continue
    for h in r['highlights']:
        b = best_locate(h['phrase'], ocr)
        if not b or b['score'] < 0.8: errs.append((r['id'], 'phrase not in OCR', h['phrase']))
        for bx in h['boxes']:
            if not (0 <= bx[0] < bx[2] <= r['w'] and 0 <= bx[1] < bx[3] <= r['h']): errs.append((r['id'], 'box oob', bx))
    ov = f"{OUT}/screens/overlays/{r['id']}.jpg"
    if not os.path.exists(ov): errs.append((r['id'], 'no overlay'))
    else:
        o = Image.open(ov)
        if o.size[0] > 900 or o.format != 'JPEG': errs.append((r['id'], 'overlay', o.size, o.format))
nov = len(glob.glob(OUT + '/screens/overlays/*.jpg')); nocr = len(glob.glob(OUT + '/screens/ocr/*.json'))
print('items', len(items), 'overlays', nov, 'ocr files', nocr, 'errors', len(errs))
for e in errs[:30]: print(e)
