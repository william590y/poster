#!/usr/bin/env python3
"""Build screens.json + overlays from cands.json, analysis.json, OCR and the hand-curated picks.json.
picks.json: {id: {"phrases": [..1-3 exact visible phrases..], optional "kind","tags","lyric","text","outlet","date","note","quality_adj"}}"""
import json, os, sys, re, difflib, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont
Image.MAX_IMAGE_PIXELS = None
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lib import *
from meta import *
from tagger import tags_for_text

OUT = '/home/user/hyperplane-teaser/research/rev2'
OV = OUT + '/screens/overlays'
os.makedirs(OV, exist_ok=True)

cands = {c['id']: c for c in json.load(open(HERE + '/cands.json'))}
ana = json.load(open(HERE + '/analysis.json'))
picks = json.load(open(HERE + '/picks.json'))

_FOLD = str.maketrans({'i': 'l', '1': 'l', '0': 'o'})
def diff_note(text, matched, ocr=None):
    """character-level diff of alnum streams (OCR-confusable glyphs i/l/1/0/o folded, so "AI" read as "Al" is not
    reported) -> short notes listing real differences; a long unmatched tail means the text runs past the visible crop."""
    a0, b0 = alnum(text), alnum(matched)
    a, b = a0.translate(_FOLD), b0.translate(_FOLD)
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    notes = []
    for op, i0, i1, j0, j1 in sm.get_opcodes():
        if op == 'equal': continue
        if op == 'delete' and (i1 - i0) >= 25 and i1 >= len(a) - 3:
            tail = text[-int((i1 - i0) * 1.4):]
            r = best_locate(tail, ocr) if ocr else None
            if r and r['score'] >= 0.9: continue          # tail is visible, only OCR reading order broke the span
            notes.append(f"last {i1 - i0} chars of text not located by OCR (cropped out of the screenshot, or an OCR miss)")
        elif op == 'delete' and (i1 - i0) >= 25 and i0 <= 3:
            notes.append(f"first {i1 - i0} chars of text not visible in the screenshot")
        else:
            if max(i1 - i0, j1 - j0) <= 1 and not (a0[i0:i1] + b0[j0:j1]).isdigit() and not any(ch.isdigit() for ch in a0[i0:i1] + b0[j0:j1]):
                continue                                   # single-letter OCR noise (e.g. I/l/t), not a content difference
            notes.append(f"text '{a0[i0:i1][:30]}' vs ocr '{b0[j0:j1][:30]}'")
    return notes

def quality_of(c, hl, ocr_score, kind):
    W = c['w']
    hs = []
    for h in hl:
        for b in h['boxes']:
            hs.append((b[3] - b[1] - 6))
    if not hs: return 1, 0.0
    hmed = float(np.median(hs)) * 800.0 / W
    q = 5 if hmed >= 50 else 4 if hmed >= 36 else 3 if hmed >= 26 else 2 if hmed >= 17 else 1
    up = 800.0 / W
    if up > 1.6: q -= 1            # blurry when upscaled to 800
    if ocr_score < 0.75: q -= 1
    return max(1, min(5, q)), hmed

recs = []
fails = []
for oid, p in picks.items():
    c = cands[oid]; a = ana[oid]; ocr = load_ocr(oid)
    d = c.get('deck') or {}; m = c.get('man') or {}
    text = p.get('text') or a['text']
    kind = p.get('kind') or a['kind']
    date = p.get('date') or m.get('date') or d.get('date') or None
    outlet = p.get('outlet') or m.get('outlet') or d.get('outlet')
    url = p.get('url') or m.get('url') or d.get('url')
    hl = []
    for ph in p['phrases']:
        r = best_locate(ph, ocr)
        if not r or r['score'] < 0.8:
            fails.append((oid, ph, r and (r['score'], r['matched']))); continue
        hl.append(dict(phrase=ph, boxes=r['boxes'], match=r['score'], ocr=r['matched']))
    chk = a['chk'] or {}
    if p.get('text') and p['text'] != a['text']:
        _t = p['text'][:300]
        _r = best_locate(_t, ocr)
        chk = dict(score=_r['score'], matched=_r['matched'][:200]) if _r else dict(score=0.0)
    notes = []
    if chk and chk.get('matched') and text:
        t = text if len(text) <= 300 else text[:300]
        dn = diff_note(t, chk['matched'], ocr)
        if dn: notes.extend(dn[:3])
    if p.get('note'): notes.append(p['note'])
    q, hmed = quality_of(c, hl, chk.get('score', 0), kind)
    q = max(1, min(5, q + p.get('quality_adj', 0)))
    yr = int(date[:4]) if date and date[:4].isdigit() else None
    rec = dict(id=oid, path=c['path'], w=c['w'], h=c['h'], kind=kind, outlet=outlet, date=date, url=url,
               text=text, tags=(p.get('tags') or tags_for_text(text + ' ' + (m.get('headline') or '')))[:6], lyric=p.get('lyric') or a['lyric'][:3], year=yr, quality=q,
               highlights=[dict(phrase=h['phrase'], boxes=h['boxes']) for h in hl])
    au = m.get('author')
    if au: rec['author'] = (au if len(au) <= 90 else au[:87] + '...')
    rec['ocr_check'] = dict(score=chk.get('score'), highlight_scores=[h['match'] for h in hl], line_px_at_800=round(hmed, 1),
                            note='; '.join(notes) if notes else 'ok')
    if d.get('slide'): rec['slide'] = d['slide']
    rec['source'] = c['src']
    recs.append(rec)

recs.sort(key=lambda r: r['id'])
META = dict(
    generated='2026-10-10', count=len(recs),
    coords='All boxes are [x0,y0,x1,y1] in source pixels of `path` (w x h). One box per text line of the phrase, 3 px padding, from tesseract word boxes (psm 3 and 6, plus an inverted pass for dark images; images narrower than 1000 px were OCR-upscaled 2-3x and the boxes mapped back).',
    quality='1-5, legibility when the image is shown 700-900 px wide on a phone: median OCR line height of the highlighted phrase at 800 px display width: >=50 px = 5, >=36 = 4, >=26 = 3, >=17 = 2, else 1; minus 1 if the source needs more than 1.6x upscaling to reach 800 px, minus 1 if OCR confirms less than 75% of the text. 5 = big display type, 4 = comfortable, 3 = legible, 2 = barely legible (crop/zoom advised), 1 = unreadable.',
    ocr_check='score = how much of `text` (first 300 chars) the OCR confirms (1.0 = all). note = real differences between the verified text and the OCR (single-letter noise such as I/l is ignored); highlight_scores = OCR match score per highlight phrase; line_px_at_800 = median highlight line height at 800 px width.',
    lyric='keys of research/long/lyrics/*.json the screenshot fits (best first); tags are topic tags.',
    source='deck-images.json (William deck) + assets/research/*/manifest.json (verified headline text, outlet, date, url); images are real screenshots, never re-typeset.',
)
json.dump(dict(meta=META, items=recs), open(OUT + '/screens.json', 'w'), ensure_ascii=False, indent=1)
print('records', len(recs), 'failures', len(fails))
for f in fails: print('FAIL', f)

# overlays
try:
    FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 28)
except Exception:
    FONT = ImageFont.load_default()
for r in recs:
    src = Image.open(r['path'])
    if src.mode in ('RGBA', 'LA', 'P'):
        src = src.convert('RGBA'); bg = Image.new('RGBA', src.size, (255, 255, 255, 255)); bg.alpha_composite(src); src = bg
    im = src.convert('RGB')
    W, H = im.size
    # shrink first (cheap), then draw at output scale
    tw = 900 if W > 900 else W
    s = tw / W
    im = im.resize((tw, max(1, int(H * s))), Image.LANCZOS)
    dr = ImageDraw.Draw(im, 'RGBA')
    lw = 3
    for k, h in enumerate(r['highlights']):
        for bi, b in enumerate(h['boxes']):
            x0, y0, x1, y1 = [v * s for v in b]
            dr.rectangle([x0, y0, x1, y1], fill=(255, 0, 0, 36), outline=(255, 0, 0, 255), width=lw)
        if len(r['highlights']) > 1 and h['boxes']:
            x0, y0 = h['boxes'][0][0] * s, h['boxes'][0][1] * s
            dr.rectangle([x0, max(0, y0 - 18), x0 + 16, max(0, y0 - 18) + 18], fill=(255, 0, 0, 255))
            dr.text((x0 + 3, max(0, y0 - 18) + 1), str(k + 1), fill=(255, 255, 255, 255), font=ImageFont.load_default())
    im.save(f"{OV}/{r['id']}.jpg", 'JPEG', quality=80)
keep = {r['id'] + '.jpg' for r in recs}
for f in os.listdir(OV):
    if f not in keep: os.remove(os.path.join(OV, f))
print('overlays', len(recs))
