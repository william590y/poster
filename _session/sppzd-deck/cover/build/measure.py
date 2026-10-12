import sys, os
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import render
render.build_page(sys.argv[1], os.path.join(render.HERE, '_page.html'))
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width':1920,'height':1080})
    pg.goto('file://' + os.path.join(render.HERE, '_page.html')); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(200)
    r = pg.evaluate('''() => [...document.querySelectorAll('section > h1, section > p')].map(e => {
        const b = e.getBoundingClientRect(); const rg = document.createRange(); rg.selectNodeContents(e); const rs = [...rg.getClientRects()];
        const w = Math.max(...rs.map(q => q.right)) - b.left;
        return [e.tagName, Math.round(b.top), Math.round(b.bottom), Math.round(w), rs.length, e.textContent.slice(0, 30)]; })''')
    for x in r: print(x)
    # natural widths
    print(pg.evaluate('''() => { const c = document.createElement('span'); c.style.cssText = "position:absolute;white-space:nowrap;font-family:'Source Serif 4';font-size:88px;font-weight:600"; document.body.appendChild(c);
       const out = {}; for (const s of ['Self-Play Pretraining', 'Self-Play Pretraining with', 'with Zero Data', 'Self-Play Pretraining with Zero Data']) { c.textContent = s; out[s] = c.getBoundingClientRect().width; } return out; }'''))
    b.close()
