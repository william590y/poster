#!/usr/bin/env python3
"""Make an emailable review copy of the Splash deck (under ~25 MB): the same slides, notes and animations, with the
looping GIF clips cut to a third of their size at 6 fps / 64 colours, and PNG/JPEG images over 100 KB resized to
<= 1280 px (PNGs quantized to 256 colours, JPEGs at quality 70). Nov 6, 2026: the 160-slide deck made a 23.7 MB copy at
the old settings (1600 px, only images over 300 KB), too close to email limits once attachments are encoded, so the
thresholds were lowered; only this copy is affected, never the real deck. Present from the full deck; this copy is for reviewers (e.g. splashcornell@gmail.com).

  python3 tools/make_review_copy.py [IN.pptx] [OUT.pptx]
  (default: AI_Alignment_and_Safety_Splash.pptx -> build/splash/AI_Alignment_and_Safety_Splash_REVIEW-COPY.pptx)
"""
import os, sys, glob, shutil, zipfile, tempfile, subprocess
from PIL import Image
import numpy as np

here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, 'AI_Alignment_and_Safety_Splash.pptx')
out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(here, 'build', 'splash', 'AI_Alignment_and_Safety_Splash_REVIEW-COPY.pptx')
tmp = tempfile.mkdtemp(prefix='review-copy-')
try:
    with zipfile.ZipFile(src) as z:
        names = z.namelist()
        z.extractall(tmp)
    media = os.path.join(tmp, 'ppt', 'media')
    for f in sorted(glob.glob(os.path.join(media, '*'))):
        size = os.path.getsize(f)
        if f.lower().endswith('.gif') and size > 1_500_000:
            t = f + '.small.gif'
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', f, '-vf',
                            'fps=6,scale=iw/3:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=64[p];[b][p]paletteuse=dither=bayer:bayer_scale=3',
                            '-loop', '0', t], check=True)
            os.replace(t, f)
        elif size > 100_000 and f.lower().endswith(('.png', '.jpg', '.jpeg')):
            im = Image.open(f); im.load()
            if im.width > 1280:
                im = im.resize((1280, round(im.height * 1280 / im.width)), Image.LANCZOS)
            if f.lower().endswith('.png'):
                q = im.convert('RGBA').quantize(256, method=Image.Quantize.FASTOCTREE) if im.mode in ('RGBA', 'LA', 'P') else im.convert('RGB').quantize(256)
                # 256 colours can drop a small, rare colour (a thin coloured outline on a photo turned another colour):
                # if more than 0.02% of the pixels move by a lot, keep the picture in full colour (resized only)
                a = np.asarray(im.convert('RGB'), dtype=np.int16)
                b = np.asarray(q.convert('RGB'), dtype=np.int16)
                if (np.abs(a - b).max(axis=2) > 64).mean() > 0.0002:
                    q = im if im.width <= 960 else im.resize((960, round(im.height * 960 / im.width)), Image.LANCZOS)
                q.save(f, optimize=True)
            else:
                im.convert('RGB').save(f, quality=70, optimize=True)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        for n in names:
            if n.endswith('/'):
                continue   # no folder entries (some cloud drives fail to open a .pptx that has them)
            z.write(os.path.join(tmp, n), n)
    print(f'{out}: {os.path.getsize(out) / 1e6:.1f} MB (from {os.path.getsize(src) / 1e6:.1f} MB)')
finally:
    shutil.rmtree(tmp, ignore_errors=True)
