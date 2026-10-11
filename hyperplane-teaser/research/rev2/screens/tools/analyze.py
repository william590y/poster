#!/usr/bin/env python3
"""Per-candidate analysis: text cross-check vs OCR, legibility metrics, tags, lyric keys.
Writes analysis.json (id -> dict) next to this script."""
import json, os, sys, re, difflib
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
from meta import *

HERE = os.path.dirname(os.path.abspath(__file__))
cands = json.load(open(HERE + '/cands.json'))

def tok_close(a, b):
    if a == b: return True
    if len(a) >= 5 and len(b) >= 5: return difflib.SequenceMatcher(None, a, b).ratio() >= 0.8
    return False

def best_run(ocr):
    best, bn = None, -1
    for name, words in ocr['runs'].items():
        n = sum(1 for w in words if w[1] >= 70 and len(alnum(w[0])) >= 2)
        if n > bn: best, bn = name, n
    return best, bn

def heights(words, minconf=70):
    hs = [w[5] - w[3] for w in words if w[1] >= minconf and len(alnum(w[0])) >= 3 and (w[5] - w[3]) >= 6]
    return hs

out = {}
for c in cands:
    oid = c['id']
    ocr = load_ocr(oid)
    if not ocr: continue
    text, dek, head, q = text_for(c)
    kind = derive_kind(c)
    run, nconf = best_run(ocr)
    words = ocr['runs'][run]
    hs = heights(words)
    W = ocr['w']
    disp = 800.0 / W
    h80 = float(np.percentile(hs, 80)) * disp if hs else 0.0
    hmed = float(np.median(hs)) * disp if hs else 0.0
    info = dict(id=oid, run=run, nconf=nconf, h80=round(h80, 1), hmed=round(hmed, 1), kind=kind)
    # text check
    chk = None
    # choose between headline and dek as the primary text: whichever the OCR confirms better
    alt = None
    if text and dek and dek != text and kind != 'post':
        r1 = best_locate(text[:300], ocr); r2 = best_locate(dek[:300], ocr)
        s1 = r1['score'] if r1 else 0; s2 = r2['score'] if r2 else 0
        if s2 > s1 + 0.15:
            alt = text; text = dek
    if text:
        t = text if len(text) <= 300 else text[:300]
        r = best_locate(t, ocr)
        if r:
            span = words[r['w0']:r['w1'] + 1] if r['run'] == run else ocr['runs'][r['run']][r['w0']:r['w1'] + 1]
            ttoks = [x for x in words_of(t) if len(x) >= 3]
            otoks = [alnum(w[0]) for w in span if w[1] >= 75 and len(alnum(w[0])) >= 3]
            otoks_all = [alnum(w[0]) for w in span]
            miss_t = [x for x in ttoks if not any(tok_close(alnum(x), o) for o in otoks_all)]
            extra_o = [o for o in otoks if not any(tok_close(alnum(x), o) for x in ttoks)]
            chk = dict(score=r['score'], run=r['run'], matched=r['matched'][:200], text_not_in_ocr=miss_t[:8], ocr_not_in_text=extra_o[:8], full=len(text) <= 300)
        else:
            chk = dict(score=0.0)
    info['chk'] = chk
    info['text'] = text; info['dek'] = dek; info['text_alt'] = alt
    info['tags'] = tags_for(c, text, dek)
    info['lyric'] = lyrics_for(c, text, dek, info['tags'])
    out[oid] = info
json.dump(out, open(HERE + '/analysis.json', 'w'), ensure_ascii=False)
print('analysed', len(out))
