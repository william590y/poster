#!/usr/bin/env python3
"""OCR the captured PNGs (tesseract TSV, psm 3 and 6, inverted pass for dark images) -> captures/ocr/<id>.json
Same run format as rev2/screens/ocr (words = [text, conf, x0, y0, x1, y1, line]).
Usage: ocrcap.py [--only id,id] [--force]"""
import json, os, sys, subprocess, argparse, tempfile
from PIL import Image, ImageOps
import numpy as np
Image.MAX_IMAGE_PIXELS = None

CAP = '/home/user/hyperplane-teaser/research/rev2/captures'
OUT = CAP + '/ocr'
os.makedirs(OUT, exist_ok=True)
TMP = '/tmp/claude-0/-home-user/a99e0376-0534-5e3e-8b47-ccbc03821dfd/scratchpad/rev2cap/tmp'
os.makedirs(TMP, exist_ok=True)

def run_tess(p, psm):
    env = {**os.environ, 'OMP_THREAD_LIMIT': '1'}
    return subprocess.run(['tesseract', p, 'stdout', '--psm', str(psm), 'tsv'], capture_output=True, text=True, env=env).stdout

def parse(tsv, pad):
    words = []
    for ln in tsv.splitlines()[1:]:
        c = ln.split('\t')
        if len(c) < 12 or c[0] != '5': continue
        t = c[11].strip()
        if not t: continue
        try: conf = float(c[10])
        except Exception: continue
        if conf < 0: continue
        x, y, w, h = [int(v) for v in c[6:10]]
        words.append([t, round(conf, 1), x - pad, y - pad, x + w - pad, y + h - pad, f'{c[2]}.{c[3]}.{c[4]}'])
    return words

def do(oid):
    png = f'{CAP}/{oid}.png'
    im = Image.open(png).convert('RGB')
    W, H = im.size
    g = im.convert('L')
    pad = 12
    gi = ImageOps.expand(g, border=pad, fill=int(np.asarray(g)[0:3, :].mean()))
    mean = float(np.asarray(gi).mean())
    variants = [('', gi)]
    if mean < 140: variants.append(('i', ImageOps.invert(gi)))
    # a second inverted pass helps on pages with a dark masthead over a light body
    runs = {}
    for tag, img in variants:
        tp = f'{TMP}/{oid}{tag}.png'
        img.save(tp)
        for psm in (3, 6):
            runs[f'psm{psm}{tag}'] = parse(run_tess(tp, psm), pad)
        os.remove(tp)
    # extra passes on the headline region (2x upscaled; normal and inverted), for white-on-image and multi-column layouts
    mp = f'{CAP}/_meta/{oid}.json'
    try: m = json.load(open(mp))
    except Exception: m = {}
    hb = m.get('h1_box'); cc = m.get('crop_css')
    if hb and cc:
        x0c, y0c = cc[0], cc[1]
        X0 = int(max(0, (hb[0] - x0c) * 2 - 40)); X1 = int(min(W, (hb[2] - x0c) * 2 + 200))
        Y0 = int(max(0, (hb[1] - y0c) * 2 - 30)); Y1 = int(min(H, (hb[3] - y0c) * 2 + 300))
        if X1 - X0 > 100 and Y1 - Y0 > 40:
            try: fpx = float(str(m.get('h1_font', '30px'))[:-2]) * 2
            except Exception: fpx = 60.0
            sc = max(0.4, min(2.0, 64.0 / max(fpx, 1)))
            reg = g.crop((X0, Y0, X1, Y1))
            reg = reg.resize((int(reg.size[0] * sc), int(reg.size[1] * sc)), Image.LANCZOS)
            reg = ImageOps.expand(reg, border=24, fill=int(np.asarray(reg)[0:3, :].mean()))
            for tag, img in (('h', reg), ('hi', ImageOps.invert(reg))):
                tp = f'{TMP}/{oid}{tag}.png'; img.save(tp)
                ws = parse(run_tess(tp, 6), 24)
                for w_ in ws:
                    w_[2] = int(round(w_[2] / sc)) + X0; w_[4] = int(round(w_[4] / sc)) + X0
                    w_[3] = int(round(w_[3] / sc)) + Y0; w_[5] = int(round(w_[5] / sc)) + Y0
                runs['psm6' + tag] = ws
                os.remove(tp)
    json.dump(dict(id=oid, w=W, h=H, scale=1.0, mean_lum=round(mean, 1), runs=runs), open(f'{OUT}/{oid}.json', 'w'), ensure_ascii=False)
    return sum(len(v) for v in runs.values())

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', default='')
    ap.add_argument('--force', action='store_true')
    a = ap.parse_args()
    ids = [f[:-4] for f in sorted(os.listdir(CAP)) if f.endswith('.png')]
    if a.only: ids = [i for i in ids if i in set(a.only.split(','))]
    for i in ids:
        if not a.force and os.path.exists(f'{OUT}/{i}.json') and os.path.getmtime(f'{OUT}/{i}.json') > os.path.getmtime(f'{CAP}/{i}.png'): continue
        print(i, do(i), flush=True)
