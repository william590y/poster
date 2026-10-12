"""Probe y2mate.gs with a headless browser: submit a YouTube URL, dump the resulting page and buttons.
Usage: python3 y2probe.py <youtube-url> <outdir>"""
import sys, pathlib, time, json
from playwright.sync_api import sync_playwright

url, outdir = sys.argv[1], pathlib.Path(sys.argv[2])
outdir.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", proxy={"server": "http://127.0.0.1:42301"})
    ctx = b.new_context(accept_downloads=True, user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36")
    pg = ctx.new_page()
    reqs = []
    pg.on("request", lambda r: reqs.append(f"{r.method} {r.url[:200]}"))
    pg.on("popup", lambda pp: pp.close())
    pg.goto("https://y2mate.gs/", timeout=60000)
    pg.fill("#link", url)
    pg.keyboard.press("Enter")
    time.sleep(12)
    pg.screenshot(path=str(outdir / "after_submit.png"), full_page=True)
    (outdir / "after_submit.html").write_text(pg.content())
    btns = pg.eval_on_selector_all("button, a", "els => els.map(e => [e.tagName, (e.innerText||'').trim().slice(0,60), e.getAttribute('href'), e.id, e.className]).filter(x => x[1] || x[2])")
    (outdir / "buttons.json").write_text(json.dumps(btns, indent=1))
    (outdir / "requests.txt").write_text("\n".join(reqs))
    print(json.dumps(btns[:60], indent=0)[:4000])
    b.close()
