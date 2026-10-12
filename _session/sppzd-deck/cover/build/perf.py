import os, sys
from playwright.sync_api import sync_playwright
H = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(H, 'bf.js')).read() + open(os.path.join(H, 'main.js')).read() + '\nself.FR = fr; self.ST = st;'
page = os.path.join(H, '_perf.html')
open(page, 'w').write('<!doctype html><body style="margin:0"><script>' + src + '</script></body>')
with sync_playwright() as p:
    b = p.chromium.launch()
    for dpr in (1, 2):
        pg = b.new_page(viewport={'width': 1920, 'height': 1080}, device_scale_factor=dpr)
        pg.goto('file://' + page); pg.wait_for_timeout(300)
        r = pg.evaluate('''() => { const ts = []; for (let k = 0; k < 3; k++) { const t0 = performance.now(); for (let i = 0; i < 240; i++) FR(27.2 + i * 0.05 + k * 12); ts.push((performance.now() - t0) / 240); }
            const c = document.querySelectorAll('canvas')[1].getContext('2d'); c.getImageData(0, 0, 1, 1);
            const t1 = performance.now(); ST(); const st = performance.now() - t1; return {perFrameMs: ts.map(x => +x.toFixed(2)), staticMs: +st.toFixed(1)}; }''')
        init = pg.evaluate('performance.getEntriesByType("navigation")[0].domContentLoadedEventEnd')
        print('dpr', dpr, r, 'DOMContentLoaded ms', round(init))
    b.close()
