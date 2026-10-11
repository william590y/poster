import sys, json, pathlib, threading, functools, time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).resolve().parent
class Q(SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
    def end_headers(self):
        self.send_header('Cache-Control','no-store'); super().end_headers()
srv = ThreadingHTTPServer(('127.0.0.1',0), functools.partial(Q, directory=str(HERE)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
spec = json.load(open(sys.argv[1])); outdir = pathlib.Path(sys.argv[2]); outdir.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(ignore_default_args=["--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width":1080,"height":1920}, device_scale_factor=1)
    errs=[]
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.goto(f"http://127.0.0.1:{srv.server_address[1]}/lab.html")
    try:
        pg.wait_for_function("window.__ok === true", timeout=20000)
    except Exception:
        print('PAGE ERRORS:', errs); b.close(); sys.exit(1)
    tests=[("reveal",[0.2]),("brush",[]),("brushmotion",[]),("splat",[0.1]),("splat",[1.5]),("chart",[2,{"grow":1}]),("pencil",[2,0.65]),("kand",[0.5]),("frame",[0.9]),("papertest",[])]
    for n,a in tests:
        print(n, a, "%.1f ms/frame"%pg.evaluate("([n,a]) => window.timed(n,a,15)", [n,a]))
    print("bake+draw bleed (bake ms, per-frame drawImage ms):", pg.evaluate("() => window.timedBake(10)"))
    b.close()
