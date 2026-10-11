"""Render an animation page (default anim.html; set PAGE=teaser.html for another page in this folder). Usage:
  python3 frames.py sheet t1 t2 ...    -> contact sheet of the given times (sheet.png)
  python3 frames.py all [fps]          -> frames/00000.png ... for the whole duration"""
import sys, os, threading, functools, pathlib
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).parent.parent.resolve()   # render/ (fonts live in render/node_modules)
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(root)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
url = f"http://127.0.0.1:{srv.server_address[1]}/video/{os.environ.get('PAGE', 'anim.html')}"
here = pathlib.Path(__file__).parent

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1080, "height": 1920})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(url)
    try:
        pg.wait_for_function("window.__ok === true || !!window.__err", timeout=30000)
    except Exception as e:
        print("WAIT FAILED")
    print("page err:", pg.evaluate("window.__err || null"))
    for e in errs: print("ERR", e)
    clip = {"x": 0, "y": 0, "width": 1080, "height": 1920}
    if sys.argv[1] == "sheet":
        from PIL import Image, ImageDraw
        times = [float(x) for x in sys.argv[2:]]
        thumbs = []
        for t in times:
            pg.evaluate(f"render({t})")
            pg.screenshot(path=str(here / "_f.png"), clip=clip)
            im = Image.open(here / "_f.png").convert("RGB").resize((270, 480), Image.LANCZOS)
            ImageDraw.Draw(im).text((8, 6), f"{t:.2f}s", fill=(200, 0, 0))
            thumbs.append(im)
        cols = 6; rows = (len(thumbs) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * 280, rows * 490), (40, 40, 40))
        for i, im in enumerate(thumbs): sheet.paste(im, ((i % cols) * 280 + 5, (i // cols) * 490 + 5))
        sheet.save(here / "sheet.png"); print("sheet.png", len(thumbs))
    else:
        fps = int(sys.argv[2]) if len(sys.argv) > 2 else 30
        dur = pg.evaluate("window.DURATION")
        out = here / "frames"; out.mkdir(exist_ok=True)
        n = int(round(dur * fps))
        for i in range(n):
            pg.evaluate(f"render({i / fps + 1 / fps})")
            pg.screenshot(path=str(out / f"{i:05d}.png"), clip=clip)
        print("frames", n)
    for e in errs: print("ERR", e)
    b.close()
srv.shutdown()
