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
    for s in spec:
        ms = pg.evaluate("([n,a]) => window.scene(n, ...a)", [s['name'], s.get('args',[])])
        # warm repeat timing
        ms2 = pg.evaluate("([n,a]) => window.scene(n, ...a)", [s['name'], s.get('args',[])])
        pg.locator('#c').screenshot(path=str(outdir/s['out']))
        print(s['out'], 'first %.0f ms, repeat %.0f ms'%(ms,ms2))
    for e in errs: print('console:', e)
    b.close()
