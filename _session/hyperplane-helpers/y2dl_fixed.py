"""Download a YouTube video through y2mate.gs in a headless browser.
Usage: python3 y2dl.py <youtube-url> <out-file> [mp4|mp3]"""
import sys, pathlib, time
from playwright.sync_api import sync_playwright

url, out, fmt = sys.argv[1], pathlib.Path(sys.argv[2]), (sys.argv[3] if len(sys.argv) > 3 else "mp4")
out.parent.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
                          proxy={"server": "http://127.0.0.1:44705"})
    ctx = b.new_context(accept_downloads=True, user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36")
    ctx.on("page", lambda pp: None)
    pg = ctx.new_page()
    pg.goto("https://y2mate.gs/", timeout=60000)
    if fmt == "mp4":
        pg.click("button:has-text('MP4')")
    pg.fill("#link", url)
    pg.click("button[type=submit]")
    # wait for conversion (progress text then a Download button)
    pg.wait_for_selector("button.download:not([disabled])", state="visible", timeout=600000)
    title = pg.inner_text("body")[:300].replace("\n", " | ")
    print("page:", title)
    for attempt in range(3):
        try:
            with pg.expect_download(timeout=900000) as dl:
                pg.click("button.download")
            d = dl.value
            d.save_as(str(out))
            print("saved", out, out.stat().st_size, "suggested:", d.suggested_filename)
            break
        except Exception as e:
            print("attempt", attempt, "failed:", str(e)[:200])
            # an ad popup may have eaten the click: close extra pages and retry
            for extra in ctx.pages[1:]:
                extra.close()
            time.sleep(2)
    b.close()
