#!/usr/bin/env python3
"""Run tesseract (TSV, --psm 3 and 6) on every candidate and store word boxes (source px).
Images narrower than 1000 px are upscaled 2-3x first; very wide ones (>2600 px) are shrunk.
Dark images (mean luminance < 120) also get an inverted pass (runs named psm3i / psm6i).
Usage: ocr.py [--workers N] [--only id1,id2] [--force]
Output: /home/user/hyperplane-teaser/research/rev2/screens/ocr/<id>.json"""
import json, os, sys, subprocess, tempfile, time, argparse
from multiprocessing import Pool
from PIL import Image, ImageOps
Image.MAX_IMAGE_PIXELS = None
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = '/home/user/hyperplane-teaser/research/rev2/screens/ocr'
TMP = HERE + '/tmp'
os.makedirs(OUT, exist_ok=True); os.makedirs(TMP, exist_ok=True)

def prep(path):
    im = Image.open(path)
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA')
        a = np.asarray(im)[:, :, 3]
        bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
        # if the picture is mostly transparent white-on-clear text, flatten on dark instead
        rgb = np.asarray(im)[:, :, :3].astype(float).mean(axis=2)
        vis = a > 20
        if vis.sum() and rgb[vis].mean() > 200 and (a < 20).mean() > 0.3:
            bg = Image.new('RGBA', im.size, (0, 0, 0, 255))
        bg.alpha_composite(im); im = bg
    im = im.convert('L')
    return im

def scale_for(w):
    if w < 500: return 3.0
    if w < 1000: return 2.0
    if w > 2600: return 2000.0 / w
    return 1.0

def run_tess(img_path, psm):
    env = {**os.environ, 'OMP_THREAD_LIMIT': '1'}
    r = subprocess.run(['tesseract', img_path, 'stdout', '--psm', str(psm), 'tsv'], capture_output=True, text=True, env=env)
    return r.stdout

def parse(tsv, s):
    words = []
    for ln in tsv.splitlines()[1:]:
        c = ln.split('\t')
        if len(c) < 12 or c[0] != '5': continue
        t = c[11].strip()
        if not t: continue
        try: conf = float(c[10])
        except: continue
        if conf < 0: continue
        x, y, w, h = [int(v) for v in c[6:10]]
        words.append([t, round(conf, 1), int(round(x / s)), int(round(y / s)), int(round((x + w) / s)), int(round((y + h) / s)), f'{c[2]}.{c[3]}.{c[4]}'])
    return words

def do(c):
    oid, path = c['id'], c['path']
    outp = f'{OUT}/{oid}.json'
    try:
        g = prep(path)
        W, H = g.size
        s = scale_for(W)
        gi = g.resize((max(1, int(W * s)), max(1, int(H * s))), Image.LANCZOS) if abs(s - 1) > 1e-6 else g
        # pad a little border (helps tesseract at the edges)
        gi = ImageOps.expand(gi, border=12, fill=int(np.asarray(gi)[0:3, :].mean()))
        pad = 12
        mean = float(np.asarray(gi).mean())
        variants = [('', gi)]
        if mean < 120: variants.append(('i', ImageOps.invert(gi)))
        runs = {}
        for tag, im in variants:
            tp = f'{TMP}/{oid}{tag}.png'
            im.save(tp)
            for psm in (3, 6):
                tsv = run_tess(tp, psm)
                words = parse(tsv, s)
                # remove border offset
                for w_ in words:
                    for k in (2, 3, 4, 5):
                        w_[k] = int(round(w_[k] - pad / s))
                runs[f'psm{psm}{tag}'] = words
            os.remove(tp)
        json.dump(dict(id=oid, w=W, h=H, scale=s, mean_lum=round(mean, 1), runs=runs), open(outp, 'w'), ensure_ascii=False)
        return oid, True, sum(len(v) for v in runs.values())
    except Exception as e:
        return oid, False, repr(e)

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--workers', type=int, default=2)
    ap.add_argument('--only', default='')
    ap.add_argument('--force', action='store_true')
    a = ap.parse_args()
    cands = json.load(open(HERE + '/cands.json'))
    if a.only: cands = [c for c in cands if c['id'] in set(a.only.split(','))]
    if not a.force: cands = [c for c in cands if not os.path.exists(f"{OUT}/{c['id']}.json")]
    print('to do', len(cands), flush=True)
    t0 = time.time(); n = 0; bad = []
    with Pool(a.workers) as p:
        for oid, ok, info in p.imap_unordered(do, cands, chunksize=2):
            n += 1
            if not ok: bad.append((oid, info)); print('FAIL', oid, info, flush=True)
            if n % 25 == 0: print(n, 'done', round(time.time() - t0), 's', flush=True)
    print('finished', n, 'failures', len(bad), round(time.time() - t0), 's', flush=True)
