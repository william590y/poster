// Capture a real screenshot of a web page (e.g. a news headline) through the session proxy.
// Usage: node tools/shot.js <url> <out.png> [--selector "css"] [--full] [--width 1280] [--height 900]
//                           [--wait 3000] [--clip x,y,w,h] [--scroll 0] [--dark]
// Prints JSON {ok, title, out, finalUrl}. The proxy CA is trusted via SPKI pinning (no TLS bypass).
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright'));
const SPKI = 'PS48cX347wDVcRynzq+DFqswl2PLNE1sG6uQvxMCOS0=,KnP1OnzHv/y42eRQmbGwoYTHcSJF448m6CU5mdngwKk=';
const argv = process.argv.slice(2);
const url = argv[0], out = argv[1];
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
(async () => {
  const b = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    proxy: { server: 'http://127.0.0.1:35627' },
    args: ['--ignore-certificate-errors-spki-list=' + SPKI, '--disable-blink-features=AutomationControlled'],
  });
  const ctx = await b.newContext({
    viewport: { width: +opt('width', 1280), height: +opt('height', 900) },
    deviceScaleFactor: 2,
    colorScheme: opt('dark', false) ? 'dark' : 'light',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    locale: 'en-US',
  });
  const p = await ctx.newPage();
  await p.goto(url, { timeout: 60000, waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(+opt('wait', 3500));
  // Best-effort removal of cookie banners / popups / sticky overlays.
  await p.evaluate(() => {
    const kill = /cookie|consent|gdpr|onetrust|didomi|cmp|paywall|newsletter|subscribe-modal|modal|popup|overlay|banner-ad|tp-modal|piano/i;
    document.querySelectorAll('body *').forEach(el => {
      const s = getComputedStyle(el);
      const id = (el.id || '') + ' ' + (typeof el.className === 'string' ? el.className : '');
      if ((s.position === 'fixed' || s.position === 'sticky') && (kill.test(id) || +s.zIndex > 100)) el.remove();
    });
    document.documentElement.style.overflow = 'auto'; document.body.style.overflow = 'auto';
  }).catch(() => {});
  const scroll = +opt('scroll', 0); if (scroll) { await p.evaluate(y => window.scrollTo(0, y), scroll); await p.waitForTimeout(800); }
  const title = await p.title();
  const sel = opt('selector', null), clip = opt('clip', null);
  if (sel) await p.locator(sel).first().screenshot({ path: out });
  else if (clip) { const [x, y, w, h] = clip.split(',').map(Number); await p.screenshot({ path: out, clip: { x, y, width: w, height: h } }); }
  else await p.screenshot({ path: out, fullPage: !!opt('full', false) });
  console.log(JSON.stringify({ ok: true, title, out, finalUrl: p.url() }));
  await b.close();
})().catch(e => { console.log(JSON.stringify({ ok: false, error: e.message.split('\n')[0] })); process.exit(1); });
