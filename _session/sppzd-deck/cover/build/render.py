#!/usr/bin/env python3
"""Local preview harness for the s1-title slide.

Renders the <section> at 1920x1080 with the deck's three Google fonts (downloaded woff2 files served from disk),
turns the <x-embed> into <iframe sandbox="allow-scripts" srcdoc=...> at the same box, and drives the embed's
clock deterministically through its window.__t hook (seconds on the animation timeline).

usage: render.py SLIDE OUTDIR still T [name]
       render.py SLIDE OUTDIR frames T0 T1 N
       render.py SLIDE OUTDIR video T0 SECONDS FPS
"""
import html, os, re, subprocess, sys, shutil
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, 'fonts')
RESET = """
html,body{margin:0;padding:0;background:#000}
section{position:relative;width:1920px;height:1080px;box-sizing:border-box;overflow:hidden}
section *{margin:0;box-sizing:border-box}
h1{font-size:96px;font-weight:600;line-height:1.1} h2{font-size:64px;font-weight:600;line-height:1.15}
h3{font-size:44px;font-weight:600;line-height:1.2} p{font-size:32px;line-height:1.4}
aside{display:none}
"""


def font_css():
    css = open(os.path.join(FONTS, 'fonts.css')).read()
    urls = [u.strip() for u in open(os.path.join(FONTS, 'urls.txt'))]
    import hashlib
    for u in urls:
        f = hashlib.md5((u + '\n').encode()).hexdigest()[:12] + '.woff2'
        css = css.replace(u, 'fonts/' + f)
    return css


def build_page(slide_path, out_html):
    s = open(slide_path, encoding='utf-8').read()
    m = re.search(r'<x-embed style="([^"]*)">([\s\S]*?)</x-embed>', s)
    if m:
        style, content = m.group(1), m.group(2)
        iframe = ('<iframe sandbox="allow-scripts" title="embed" srcdoc="%s" style="%s;border:0;background:transparent"></iframe>'
                  % (html.escape(content, quote=True), style))
        s = s[:m.start()] + iframe + s[m.end():]
    page = ('<!doctype html><html><head><meta charset="utf-8"><style>%s</style><style>%s</style></head><body>%s</body></html>'
            % (font_css(), RESET, s))
    open(out_html, 'w', encoding='utf-8').write(page)


def main():
    slide, outdir, mode = sys.argv[1], sys.argv[2], sys.argv[3]
    os.makedirs(outdir, exist_ok=True)
    page_html = os.path.join(HERE, '_page.html')
    build_page(slide, page_html)
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--force-color-profile=srgb', '--font-render-hinting=none'])
        pg = b.new_page(viewport={'width': 1920, 'height': 1080}, device_scale_factor=1)
        logs = []
        pg.on('console', lambda m: logs.append(m.text))
        pg.on('pageerror', lambda e: logs.append('PAGEERROR ' + str(e)))
        pg.goto('file://' + page_html)
        pg.evaluate('document.fonts.ready')
        pg.wait_for_timeout(300)
        fr = [f for f in pg.frames if f != pg.main_frame]
        emb = fr[0] if fr else None

        def shot(t, path):
            if emb:
                emb.evaluate('t => { self.__t = t; return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }', t)
            pg.screenshot(path=path, clip={'x': 0, 'y': 0, 'width': 1920, 'height': 1080})

        if mode == 'still':
            t = float(sys.argv[4]); name = sys.argv[5] if len(sys.argv) > 5 else 'still.png'
            shot(t, os.path.join(outdir, name))
        elif mode == 'first':
            # no clock hook: the embed's own first frame, as an export would capture it
            pg.screenshot(path=os.path.join(outdir, sys.argv[4] if len(sys.argv) > 4 else 'first.png'))
        elif mode == 'frames':
            t0, t1, n = float(sys.argv[4]), float(sys.argv[5]), int(sys.argv[6])
            for i in range(n):
                t = t0 + (t1 - t0) * i / max(1, n - 1)
                shot(t, os.path.join(outdir, 'f%02d_t%06.2f.png' % (i, t)))
        elif mode == 'list':
            for i, t in enumerate(sys.argv[4:]):
                shot(float(t), os.path.join(outdir, 'f%02d_t%06.2f.png' % (i, float(t))))
        elif mode == 'video':
            t0, secs, fps = float(sys.argv[4]), float(sys.argv[5]), int(sys.argv[6])
            tmp = os.path.join(HERE, '_vid'); shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
            for i in range(int(secs * fps)):
                shot(t0 + i / fps, os.path.join(tmp, 'v%05d.png' % i))
            out = os.path.join(outdir, 'cover-preview.mp4')
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', os.path.join(tmp, 'v%05d.png'),
                            '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], check=True)
            shutil.rmtree(tmp)
            print('video', out, os.path.getsize(out))
        for l in logs:
            print('console:', l)
        b.close()


if __name__ == '__main__':
    main()
