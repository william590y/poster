#!/usr/bin/env python3
"""Build the candidate list for the real-screenshot library.
Deck images (deck-images.json) + headline/screenshot/quote images from assets/research/*/manifest.json.
Writes cands.json next to this script."""
import json, glob, os, hashlib, re, sys
from PIL import Image

AS = '/home/user/poster/ai-safety-presentation/assets/'
HERE = os.path.dirname(os.path.abspath(__file__))
deck = json.load(open('/home/user/hyperplane-teaser/research/long/deck-images.json'))['images']

# manifest index: id -> list of (group, item)
man_by_id, man_items = {}, []
for m in sorted(glob.glob(AS + 'research/*/manifest.json')):
    g = m.split('/')[-2]
    for it in json.load(open(m))['items']:
        man_by_id.setdefault(it['id'], []).append((g, it))
        man_items.append((g, it))

def sha(p):
    h = hashlib.sha1()
    with open(p, 'rb') as f:
        h.update(f.read())
    return h.hexdigest()

def mk_id(rel):
    r = re.sub(r'^(slides|research)/', '', rel)
    r = re.sub(r'\.[A-Za-z0-9]+$', '', r)
    r = r.replace('/', '-').replace(' ', '_')
    return r

cands, used_ids, hashes, mids, paths = [], set(), {}, set(), set()
def add(rec):
    base = rec['id']; n = 2
    while rec['id'] in used_ids:
        rec['id'] = f'{base}-{n}'; n += 1
    used_ids.add(rec['id'])
    cands.append(rec)

for i in deck:
    p = i['path']
    rel = p.split('assets/')[1]
    if not os.path.exists(p):
        print('MISSING deck', p); continue
    im = Image.open(p)
    mi = None
    if i.get('manifest_id') and i['manifest_id'] in man_by_id:
        opts = man_by_id[i['manifest_id']]
        base = os.path.basename(i.get('source') or '')
        mi = next((it for g, it in opts if it.get('file') and os.path.basename(it['file']) == base), opts[0][1])
    rec = dict(id=mk_id(rel), path=p, rel=rel, w=im.size[0], h=im.size[1], src='deck',
               deck={k: i.get(k) for k in ('kind', 'shows', 'outlet', 'date', 'url', 'slide', 'slides', 'source', 'manifest_id')},
               man=mi)
    add(rec)
    hashes[sha(p)] = rec['id']; paths.add(os.path.realpath(p))
    if i.get('manifest_id'): mids.add(i['manifest_id'])

extra_skip = {'dup': 0, 'type': 0, 'noimg': 0, 'small': 0, 'old_lowq': 0}
for g, it in man_items:
    if it['type'] not in ('headline', 'screenshot', 'quote'): extra_skip['type'] += 1; continue
    if not it.get('file'): continue
    p = os.path.realpath(AS + 'research/' + g + '/' + it['file'])
    if not p.lower().endswith(('.png', '.jpg', '.jpeg')) or not os.path.exists(p): extra_skip['noimg'] += 1; continue
    if p in paths or it['id'] in mids: extra_skip['dup'] += 1; continue
    h = sha(p)
    if h in hashes: extra_skip['dup'] += 1; continue
    im = Image.open(p)
    if im.size[0] < 400 or im.size[1] < 40: extra_skip['small'] += 1; continue
    yr = (it.get('date') or '')[:4]
    if (it.get('quality') or 0) < 4 and yr < '2024': extra_skip['old_lowq'] += 1; continue
    rel = 'research/' + g + '/' + it['file']
    rec = dict(id=mk_id(rel), path=p, rel=rel, w=im.size[0], h=im.size[1], src='research', deck=None, man=it, group=g)
    add(rec); hashes[h] = rec['id']; paths.add(p)
print('candidates', len(cands), 'deck', sum(1 for c in cands if c['src'] == 'deck'), 'extra skip', extra_skip)
json.dump(cands, open(HERE + '/cands.json', 'w'), ensure_ascii=False, indent=0)
