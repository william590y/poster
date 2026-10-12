#!/usr/bin/env python3
"""Build rev2/captures.json (screens.json schema) from captures/*.png + _meta + ocr + phrases.json (hand-picked highlights).
phrases.json: {id: {"phrases": [...], optional "tags","lyric","kind","text","note","quality_adj","drop":true}}"""
import json, os, sys, re, difflib
import numpy as np
from PIL import Image, ImageDraw, ImageFont
Image.MAX_IMAGE_PIXELS = None
sys.path.insert(0, '/home/user/hyperplane-teaser/research/rev2/screens/tools')
from lib import *            # alnum, words_of, best_locate, load_ocr (OCR_DIR overridden below)
import lib
from tagger import tags_for_text

REV2 = '/home/user/hyperplane-teaser/research/rev2'
CAP = REV2 + '/captures'
lib.OCR_DIR = CAP + '/ocr'
HERE = os.path.dirname(os.path.abspath(__file__))
targets = {t['id']: t for t in json.load(open(HERE + '/targets.json'))}
phr = json.load(open(HERE + '/phrases.json'))

def load_ocr_c(oid):
    p = f'{CAP}/ocr/{oid}.json'
    return json.load(open(p)) if os.path.exists(p) else None

_FOLD = str.maketrans({'i': 'l', '1': 'l', '0': 'o'})
def diff_note(text, matched):
    a0, b0 = alnum(text), alnum(matched)
    a, b = a0.translate(_FOLD), b0.translate(_FOLD)
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    notes = []
    for op, i0, i1, j0, j1 in sm.get_opcodes():
        if op == 'equal': continue
        if max(i1 - i0, j1 - j0) <= 1 and not any(ch.isdigit() for ch in a0[i0:i1] + b0[j0:j1]): continue
        notes.append(f"text '{a0[i0:i1][:30]}' vs ocr '{b0[j0:j1][:30]}'")
    return notes

def sim(a, b):
    return difflib.SequenceMatcher(None, ' '.join(words_of(a)), ' '.join(words_of(b)), autojunk=False).ratio()

def strip_site(t):
    t = t or ''
    return re.split(r'\s+[|–—]\s+|\s+-\s+(?=[A-Z][\w .&]+$)', t)[0].strip()

def quality_of(W, hl, ocr_score):
    hs = [(b[3] - b[1] - 6) for h in hl for b in h['boxes']]
    if not hs: return 1, 0.0
    hmed = float(np.median(hs)) * 800.0 / W
    q = 5 if hmed >= 50 else 4 if hmed >= 36 else 3 if hmed >= 26 else 2 if hmed >= 17 else 1
    if ocr_score < 0.75: q -= 1
    return max(1, min(5, q)), hmed

import difflib as _dl
def refined_boxes(words, w0, w1, phrase, W, H, pad=3):
    P = alnum(phrase)
    ptoks = [alnum(t) for t in re.findall(r"[A-Za-z0-9$%&<>']+", norm_chars(phrase)) if alnum(t)]
    keep = []
    for k in range(w0, w1 + 1):
        t = words[k][0]; a = alnum(t)
        if not a: continue
        ok = (a in P) or any(_dl.SequenceMatcher(None, a, pt).ratio() >= 0.72 for pt in ptoks)
        if ok: keep.append(words[k])
    if not keep: return None
    lines = {}
    for w in keep: lines.setdefault(w[6], []).append(w)
    out = []
    for lid, ws in lines.items():
        ws = sorted(ws, key=lambda w: w[2])
        cl = [[ws[0]]]
        for w in ws[1:]:
            h = max(8, cl[-1][-1][5] - cl[-1][-1][3])
            if w[2] - cl[-1][-1][4] > 2.5 * h: cl.append([w])
            else: cl[-1].append(w)
        for c in cl:
            x0 = min(w[2] for w in c) - pad; y0 = min(w[3] for w in c) - pad; x1 = max(w[4] for w in c) + pad; y1 = max(w[5] for w in c) + pad
            out.append([int(max(0, x0)), int(max(0, y0)), int(min(W, x1)), int(min(H, y1))])
    out.sort(key=lambda b: (b[1] // 12, b[0]))
    return out

recs, fails = [], []
for oid, t in targets.items():
    mp = f'{CAP}/_meta/{oid}.json'
    if not os.path.exists(mp): continue
    m = json.load(open(mp))
    if not m.get('ok'): continue
    p = phr.get(oid)
    if not p or p.get('drop'): fails.append((oid, 'no phrases / dropped')); continue
    ocr = load_ocr_c(oid)
    png = f'{CAP}/{oid}.png'
    im0 = Image.open(png); W, H = im0.size
    h1 = m.get('h1')
    expected = t['expected']
    sh1 = sim(h1, expected) if h1 else 0.0
    cands = [x for x in (m.get('og_title'), m.get('twitter_title'), strip_site(m.get('title')), strip_site(m.get('title0'))) if x]
    stit = max([sim(c, expected) for c in cands] or [0.0])
    h1_extends = bool(h1) and ' '.join(words_of(h1)).startswith(' '.join(words_of(expected))) and len(h1) > len(expected)
    text = p.get('text') or (h1 if (h1 and (sh1 >= 0.8 or h1_extends)) else expected)
    if h1_extends and sh1 < 0.8: p = dict(p, note=((p.get('note') + '; ') if p.get('note') else '') + 'candidate text was a truncated headline; the visible full h1 is used')
    r = best_locate(text[:300], ocr) if ocr else None
    chk = dict(score=r['score'], matched=r['matched'][:200]) if r else dict(score=0.0)
    hl = []
    for ph in p['phrases']:
        rr = best_locate(ph, ocr)
        if not rr or rr['score'] < 0.8:
            fails.append((oid, ph, rr and (rr['score'], rr['matched']))); continue
        bx = refined_boxes(ocr['runs'][rr['run']], rr['w0'], rr['w1'], ph, ocr['w'], ocr['h']) or rr['boxes']
        hl.append(dict(phrase=ph, boxes=bx, match=rr['score'], ocr=rr['matched']))
    if not hl: fails.append((oid, 'no highlight located')); continue
    notes = []
    if chk.get('matched'):
        notes += diff_note(text[:300], chk['matched'])[:3]
    if p.get('skip_h1'):
        sh1 = None
        _a = ' '.join(words_of(text))[:70]; _b = ' '.join(words_of(m.get('title') or ''))
        stit = 1.0 if _a and _a in _b else None
        notes.append('post page: text read from the screenshot (OCR-checked); ' + ('the page <title> contains the same post text' if stit else 'the page <title> is generic'))
    elif sh1 < 0.8 and not h1_extends: notes.append(f'visible h1 differs from the candidate text (sim {sh1:.2f}): h1 = {h1!r}')
    if stit is not None and stit < 0.8: notes.append(f'page <title>/og:title differs from the headline (sim {stit:.2f}): title = {m.get("title")!r}, og = {m.get("og_title")!r}')
    if p.get('note'): notes.append(p['note'])
    q, hmed = quality_of(W, hl, chk.get('score', 0))
    q = max(1, min(5, q + p.get('quality_adj', 0)))
    date = t['date']
    yr = int(date[:4]) if date[:4].isdigit() else None
    cu = m.get('crop_css') or [0, 0, 1200, H / 2]
    hb = None if p.get('skip_h1') else m.get('h1_box')
    rec = dict(id=oid, path=png, w=W, h=H, kind=p.get('kind') or t['kind'], outlet=t['outlet'], date=date,
               url=m.get('final_url') or t['url'], text=text,
               tags=(p.get('tags') or tags_for_text(text))[:6], lyric=p.get('lyric') or t['lyric'], year=yr, quality=q,
               highlights=[dict(phrase=h['phrase'], boxes=h['boxes']) for h in hl])
    if t.get('author'): rec['author'] = t['author']
    rec['ocr_check'] = dict(score=chk.get('score'), highlight_scores=[h['match'] for h in hl], line_px_at_800=round(hmed, 1),
                            note='; '.join(notes) if notes else 'ok')
    rec['verify'] = dict(candidate_text=expected, visible_h1=h1, h1_match=(round(sh1, 3) if sh1 is not None else None), page_title=m.get('title'), og_title=m.get('og_title'),
                         title_match=(round(stit, 3) if stit is not None else None), published_meta=m.get('published'), http_status=m.get('status'),
                         masthead_included=m.get('masthead_included'), consent_handling='; '.join(m.get('notes', [])) or 'none needed')
    if hb:
        # headline box in capture pixels (the crop starts at css y0, 2x device scale)
        y0 = cu[1]
        rec['headline_box'] = [int(hb[0] * 2), int((hb[1] - y0) * 2), int(hb[2] * 2), int((hb[3] - y0) * 2)]
    if hb:
        y0c = cu[1]; x0c = cu[0]
        bb = m.get('below_bottom') or hb[3]
        fx0 = max(0, int((hb[0] - x0c) * 2 - 40)); fy0 = max(0, int((hb[1] - y0c) * 2 - 30))
        fx1 = min(W, int(max((hb[2] - x0c) * 2, max(b[2] for h in hl for b in h['boxes'])) + 40)); fy1 = min(H, int((bb - y0c) * 2 + 24))
        rec['focus_crop'] = [fx0, fy0, fx1, max(fy1, fy0 + 60)]
        fw = max(1, fx1 - fx0)
        hs2 = [(b[3] - b[1] - 6) for h in hl for b in h['boxes']]
        hm2 = float(np.median(hs2)) * 800.0 / fw if hs2 else 0.0
        rec['quality_at_focus'] = 5 if hm2 >= 50 else 4 if hm2 >= 36 else 3 if hm2 >= 26 else 2 if hm2 >= 17 else 1
        rec['ocr_check']['line_px_at_800_focus'] = round(hm2, 1)
    rec['captured'] = f"{t['url']} on 2026-10-10"
    rec['source'] = 'capture'
    recs.append(rec)

recs.sort(key=lambda r: r['id'])
META = dict(
    generated='2026-10-10', count=len(recs),
    coords='Same as screens.json: all boxes are [x0,y0,x1,y1] in source pixels of `path` (w x h = 2400 x crop height; the page was captured at 1200 css px wide, deviceScaleFactor 2). One box per text line of the phrase, 3 px padding, from tesseract word boxes (psm 3 and 6, inverted pass for dark images). `headline_box` = the page h1 element box in the same pixels.',
    capture='Playwright + Chromium (chrome-linux 1194), viewport 1200x1000, deviceScaleFactor 2, taken 2026-10-10 through the session proxy. Cookie/consent banners dismissed by clicking an accept/close button where one was found; remaining fixed overlays (and empty ad slots) hidden with CSS. Cropped to the masthead + headline + dek/byline region; no pixels were edited or re-typeset.',
    quality='1-5 as in screens.json (median OCR line height of the highlighted phrase at 800 px display width; minus 1 if OCR confirms less than 75% of the text).',
    ocr_check='as in screens.json; `verify` adds the visible h1 and the page <title>/og:title compared with the candidate headline (similarity 0-1).',
    lyric='keys of research/long/lyrics/*.json the capture fits (best first).',
    source='research/long/lyrics/*.json candidates (headline/article/post) and research/verify headlines that had no screenshot in the deck.',
    skipped='see captures.skipped.json for pages that were not captured and why.',
)
json.dump(dict(meta=META, items=recs), open(REV2 + '/captures.json', 'w'), ensure_ascii=False, indent=1)
print('records', len(recs), 'fails', len(fails))
for f in fails: print('FAIL', f)

# overlays for review
OV = CAP + '/overlays'; os.makedirs(OV, exist_ok=True)
for r in recs:
    im = Image.open(r['path']).convert('RGB'); W, H = im.size
    tw = 900; s = tw / W
    im = im.resize((tw, max(1, int(H * s))), Image.LANCZOS)
    dr = ImageDraw.Draw(im, 'RGBA')
    for h in r['highlights']:
        for b in h['boxes']:
            x0, y0, x1, y1 = [v * s for v in b]
            dr.rectangle([x0, y0, x1, y1], fill=(255, 0, 0, 40), outline=(255, 0, 0, 255), width=3)
    im.save(f"{OV}/{r['id']}.jpg", 'JPEG', quality=80)
keep = {r['id'] + '.jpg' for r in recs}
for f in os.listdir(OV):
    if f not in keep: os.remove(os.path.join(OV, f))
