#!/usr/bin/env python3
"""Make an emailable review copy of the Splash deck (under ~25 MB): the same slides, notes and animations, with the
looping GIF clips cut to a third of their size at 6 fps / 64 colours, and large PNG/JPEG images resized to <= 1600 px
(PNGs quantized to 256 colours). Present from the full deck; this copy is for reviewers (e.g. splashcornell@gmail.com).

  python3 tools/make_review_copy.py [IN.pptx] [OUT.pptx]
  (default: AI_Alignment_and_Safety_Splash.pptx -> build/splash/AI_Alignment_and_Safety_Splash_REVIEW-COPY.pptx)
"""
import os, sys, glob, shutil, zipfile, tempfile, subprocess
from PIL import Image

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
        elif size > 300_000 and f.lower().endswith(('.png', '.jpg', '.jpeg')):
            im = Image.open(f); im.load()
            if im.width > 1600:
                im = im.resize((1600, round(im.height * 1600 / im.width)), Image.LANCZOS)
            if f.lower().endswith('.png'):
                q = im.convert('RGBA').quantize(256, method=Image.Quantize.FASTOCTREE) if im.mode in ('RGBA', 'LA', 'P') else im.convert('RGB').quantize(256)
                q.save(f, optimize=True)
            else:
                im.convert('RGB').save(f, quality=75, optimize=True)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        for n in names:
            z.write(os.path.join(tmp, n), n)
    print(f'{out}: {os.path.getsize(out) / 1e6:.1f} MB (from {os.path.getsize(src) / 1e6:.1f} MB)')
finally:
    shutil.rmtree(tmp, ignore_errors=True)
