#!/usr/bin/env python3
"""Capture masthead + headline + dek of real pages with Playwright (Chromium), 1200x1000 @2x.
Usage: cap.py targets.json [--only id1,id2] [--maxprio N] [--out DIR] [--workers 1]
Writes DIR/<id>.png and DIR/_meta/<id>.json (page title, og:title, h1, status, crop, notes)."""
import json, os, sys, re, time, argparse, subprocess, hashlib, base64
from playwright.sync_api import sync_playwright

OUT = '/home/user/hyperplane-teaser/research/rev2/captures'
CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
PROXY = os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy')

def spki_pins(path):
    pems = re.findall(r'-----BEGIN CERTIFICATE-----.+?-----END CERTIFICATE-----', open(path).read(), re.S)
    pins = []
    for pem in pems:
        pub = subprocess.run(['openssl', 'x509', '-pubkey', '-noout'], input=pem.encode(), capture_output=True).stdout
        der = subprocess.run(['openssl', 'pkey', '-pubin', '-outform', 'der'], input=pub, capture_output=True).stdout
        pins.append(base64.b64encode(hashlib.sha256(der).digest()).decode())
    return ','.join(pins)

ACCEPT_RX = r'^(accept( all)?( cookies)?|accept and continue|accept & continue|agree|i agree|agree and (continue|close|proceed)|agree & (continue|close|proceed)|allow all( cookies)?|allow( cookies)?|got it|ok|okay|i understand|i accept|yes,? i.?m happy|continue|consent|accept all & visit the site|accept all and continue|close|no thanks|no, thanks|not now|maybe later|dismiss|skip|reject all|decline|continue without accepting)$'

JS_CLICK = """(rxs) => {
  const deepAll = (root) => { const out = []; const rec = r => { for (const el of r.querySelectorAll('*')) { out.push(el); if (el.shadowRoot) rec(el.shadowRoot); } }; rec(root); return out; };
  const rx = new RegExp(rxs, 'i');
  const out = [];
  const cands = deepAll(document).filter(e => e.matches && e.matches('button, a[role=button], [role=button], input[type=button], input[type=submit], a.button, a.btn, a[class*=accept], a[class*=consent], a[id*=accept], div[class*=accept], a[class*=cmpbtn], span[class*=cmpbtn]'));
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 8 && r.height > 8 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.1; };
  const inBanner = el => { let e = el; for (let i = 0; i < 14 && e; i++, e = e.parentElement || (e.getRootNode && e.getRootNode().host)) { const s = getComputedStyle(e); if (s.position === 'fixed' || s.position === 'sticky' || s.position === 'absolute') return true; const id = (e.id||'') + ' ' + (typeof e.className==='string'?e.className:''); if (/cookie|consent|gdpr|privacy|cmp|onetrust|didomi|truste|usercentrics|osano|sp_message|qc-cmp|banner|modal|dialog|popup|overlay|notice/i.test(id) || e.getAttribute('role') === 'dialog') return true; } return false; };
  const pri = t => /^(accept|agree|i agree|allow|got it|i accept|ok|okay|i understand|yes)/i.test(t) ? 0 : /^(close|no thanks|no, thanks|not now|maybe later|dismiss|skip)/i.test(t) ? 1 : 2;
  let list = [];
  for (const el of cands) {
    if (!vis(el)) continue;
    let t = (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().replace(/\\s+/g, ' ');
    if (!t || t.length > 40) { const al = (el.getAttribute('aria-label')||'').trim(); if (al && al.length <= 40) t = al; else continue; }
    if (!rx.test(t)) continue;
    if (!inBanner(el)) continue;
    list.push([pri(t), t, el]);
  }
  list.sort((a, b) => a[0] - b[0]);
  for (const [p, t, el] of list.slice(0, 2)) { try { el.click(); out.push(t); } catch (e) {} }
  return out;
}"""

JS_HIDE = """(opts) => {
  opts = opts || {};
  const deepAll = (root) => { const out = []; const rec = r => { for (const el of r.querySelectorAll('*')) { out.push(el); if (el.shadowRoot) rec(el.shadowRoot); } }; rec(root); return out; };
  const vw = innerWidth, vh = innerHeight;
  const h1s = [...document.querySelectorAll('h1')];
  const hide = []; let adsHidden = 0;
  const kill = /cmpwrapper|cmpbox|cmp_|cookie|consent|gdpr|onetrust|didomi|truste|usercentrics|osano|cookiebot|termly|iubenda|sp_message|sp-message|qc-cmp|cmp-|-cmp|paywall|newsletter|subscribe|subscription|signup|sign-up|login-wall|registration|modal|popup|pop-up|overlay|interstitial|adblock|ad-block|survey|backdrop|scrim|lightbox|toast|snackbar|privacy-banner|push-notif|notification-bar|app-banner|smart-banner|piano|tp-modal|tp-backdrop/i;
  const strong = /cmpwrapper|cmpbox|cmp_|cookie|consent|gdpr|onetrust|didomi|truste|usercentrics|osano|cookiebot|termly|iubenda|sp_message|sp-message|qc-cmp|privacy-banner|app-banner|smart-banner|tp-modal|tp-backdrop|adblock/i;
  const adre = /(^|[\s_-])(ad|ads|advert|advertisement|adslot|ad-slot|adunit|ad-unit|billboard|leaderboard|dfp|banner-ad|sticky-ad|google-ad|gpt-ad)([\s_-]|$)/i;
  const hdre = /(^|[\s_-])(header|masthead|navbar|nav-bar|topbar|site-nav|main-nav|global-nav|site-header)([\s_-]|$)/i;
  const all = deepAll(document.body);
  for (const el of all) {
    const s = getComputedStyle(el);
    if (s.display === 'none') continue;
    // tailwind-style arbitrary variants ([:has(.paywall)] etc.) are not identifiers: strip them
    const raw = (el.id || '') + ' ' + (typeof el.className === 'string' ? el.className : '') + ' ' + (el.getAttribute('role')||'') + ' ' + (el.getAttribute('aria-label')||'');
    const id = raw.replace(/\S*\[[^\]]*\]\S*/g, ' ').replace(/\s+/g, ' ');
    const r = el.getBoundingClientRect();
    if (h1s.some(h => el.contains(h))) continue;
    const pos = s.position;
    const isHeaderLike = el.tagName === 'HEADER' || el.tagName === 'NAV' || el.getAttribute('role') === 'banner' || hdre.test(id);
    const hasNav = !!(el.querySelector && el.querySelector('nav, header, h1, article, main'));
    if (!opts.keepAds && !isHeaderLike && adre.test(id) && r.height > 50 && !hasNav && el.tagName !== 'BODY') { hide.push(el); adsHidden++; continue; }
    if (pos === 'fixed' || pos === 'sticky') {
      const area = r.width * r.height;
      if (pos === 'fixed' && (area > 0.3 * vw * vh || kill.test(id) || r.top > 150 || (r.bottom > vh - 5 && r.height > 20)) && !(isHeaderLike && r.top <= 5 && r.height < 160 && !strong.test(id))) hide.push(el);
      else if (pos === 'sticky' && kill.test(id) && !isHeaderLike && !hasNav) hide.push(el);
    } else if (pos === 'absolute' && r.width * r.height > 0.3 * vw * vh && kill.test(id) && !isHeaderLike && !hasNav) {
      hide.push(el);
    } else if (strong.test(id) && !isHeaderLike && r.height > 30 && !hasNav && s.display !== 'inline') hide.push(el);
  }
  for (const el of hide) { el.style.setProperty('display', 'none', 'important'); const h = el.getRootNode && el.getRootNode().host; if (h && !/BODY|HTML/.test(h.tagName) && getComputedStyle(h).position !== 'static') h.style.setProperty('display', 'none', 'important'); }
  window.__adsHidden = adsHidden;
  window.__hiddenDetail = hide.slice(0, 80).map(e => { const r = e.getBoundingClientRect(); const p = getComputedStyle(e).position; return [e.tagName, (e.id||'').slice(0,40), (typeof e.className==='string'?e.className:'').replace(/\\s+/g,' ').slice(0,60), p, Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; });
  for (const e of [document.documentElement, document.body]) { e.style.setProperty('overflow', 'visible', 'important'); e.style.setProperty('position', 'static', 'important'); e.style.removeProperty('height'); e.classList.remove('modal-open', 'no-scroll', 'noscroll', 'overflow-hidden', 'sp-message-open', 'ot-no-scroll'); }
  return hide.length;
}"""

JS_INFO = """(expected) => {
  const norm = s => (s||'').toLowerCase().replace(/[\\u2018\\u2019']/g,"'").replace(/[\\u201c\\u201d"]/g,'"').replace(/[^a-z0-9]+/g,' ').trim();
  const exp = norm(expected);
  const toks = new Set(exp.split(' ').filter(t => t.length > 2));
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 20 && r.height > 8 && s.visibility !== 'hidden' && s.display !== 'none'; };
  let hs = [...document.querySelectorAll('h1')].filter(vis);
  if (!hs.length) hs = [...document.querySelectorAll('[class*=headline], [class*=title], [itemprop=headline], h2')].filter(vis);
  const score = el => { const t = norm(el.innerText).split(' ').filter(x => x.length > 2); if (!t.length) return 0; let n = 0; for (const x of t) if (toks.has(x)) n++; return n / Math.max(t.length, toks.size || 1); };
  hs.sort((a, b) => (score(b) - score(a)) || (parseFloat(getComputedStyle(b).fontSize) - parseFloat(getComputedStyle(a).fontSize)));
  let h = hs[0] || null;
  if (!h || score(h) < 0.5) {
    const key = exp.slice(0, 28);
    let best = null, ba = 1e12;
    for (const el of document.querySelectorAll('body *')) {
      if (/SCRIPT|STYLE|NOSCRIPT|META|LINK|TITLE/.test(el.tagName)) continue;
      const t = norm(el.innerText || '');
      if (!t || t.indexOf(key) < 0 || t.length < exp.length * 0.85 || t.length > exp.length * 1.6 + 30) continue;
      const r = el.getBoundingClientRect(); if (r.width < 40 || r.height < 12) continue;
      const a = r.width * r.height;
      if (a < ba) { ba = a; best = el; }
    }
    if (best) h = best;
  }
  const meta = n => { const m = document.querySelector('meta[property="' + n + '"], meta[name="' + n + '"]'); return m ? m.content : null; };
  const info = { title: document.title, og_title: meta('og:title'), twitter_title: meta('twitter:title'), og_site: meta('og:site_name'), published: meta('article:published_time') || meta('og:article:published_time') || meta('datePublished') || meta('date') || meta('pubdate'), author_meta: meta('author') || meta('article:author'), canonical: (document.querySelector('link[rel=canonical]')||{}).href || null, h1_count: hs.length };
  if (!h) return info;
  const r = h.getBoundingClientRect();
  info.h1 = h.innerText.trim().replace(/\\s+/g, ' ');
  info.h1_box = [r.left + scrollX, r.top + scrollY, r.right + scrollX, r.bottom + scrollY];
  info.h1_font = getComputedStyle(h).fontSize;
  // dek + byline: text nodes just below the headline, contiguous within 70 px gaps, max 300 px below
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const rows = [];
  let n;
  while ((n = tw.nextNode())) {
    const t = n.textContent.trim();
    if (t.length < 2) continue;
    const p = n.parentElement; if (!p) continue;
    const tag = p.tagName; if (/SCRIPT|STYLE|NOSCRIPT|TEMPLATE/.test(tag)) continue;
    const s = getComputedStyle(p); if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) continue;
    let capt = false; for (let a = p, k = 0; a && k < 5; a = a.parentElement, k++) { if (/^(FIGCAPTION|FIGURE)$/.test(a.tagName) || /caption|credit/i.test(typeof a.className === 'string' ? a.className : '')) { capt = true; break; } }
    if (capt) continue;
    const rg = document.createRange(); rg.selectNodeContents(n);
    const rr = rg.getBoundingClientRect();
    if (rr.width < 4 || rr.height < 6) continue;
    const top = rr.top + scrollY, bot = rr.bottom + scrollY;
    if (top < info.h1_box[3] - 6 || top > info.h1_box[3] + 300) continue;
    if (rr.left + scrollX > info.h1_box[2] + 20 || rr.right + scrollX < info.h1_box[0] - 20) { if (rr.right + scrollX < info.h1_box[0] - 150 || rr.left + scrollX > info.h1_box[2] + 150) continue; }
    rows.push([top, bot, t.slice(0, 80), n.textContent.trim().length]);
  }
  rows.sort((a, b) => a[0] - b[0]);
  let bottom = info.h1_box[3], kept = [];
  for (const [top, bot, t, plen] of rows) { if (top - bottom > 70) break; if (plen > 230 && top > info.h1_box[3] + 30) break; if (bot > bottom) bottom = bot; kept.push(t); }
  info.below_bottom = bottom; info.below_text = kept.slice(0, 12);
  // image/figure directly below that would be a hero: bound the crop above it
  const figs = [...document.querySelectorAll('img, picture, video, figure')].filter(e => { const q = e.getBoundingClientRect(); return q.width > 300 && q.height > 150 && q.top + scrollY >= info.h1_box[3] - 5; }).map(e => e.getBoundingClientRect().top + scrollY).sort((a, b) => a - b);
  info.hero_top = figs.length ? figs[0] : null;
  // header bottom
  const hd = document.querySelector('header, [role=banner], .site-header, #header, #masthead');
  info.header_bottom = hd ? hd.getBoundingClientRect().bottom + scrollY : null;
  info.doc_w = document.documentElement.scrollWidth;
  return info;
}"""

BLOCK_RX = re.compile(r'just a moment|attention required|access denied|are you (a )?(robot|human)|verify you are|captcha|403 forbidden|page not found|^\s*404|error 40\d|unusual traffic|security check|enable (js|javascript)|bot detection|request blocked', re.I)

def settle(page, ms=2500):
    try: page.wait_for_load_state('networkidle', timeout=7000)
    except Exception: pass
    page.wait_for_timeout(ms)

def dismiss(page, notes):
    for rnd in range(3):
        got = []
        try: got += page.evaluate(JS_CLICK, ACCEPT_RX)
        except Exception: pass
        for fr in page.frames[1:]:
            try:
                if re.search(r'consent|cmp|privacy|sourcepoint|sp_message|onetrust|didomi|trustarc|truste|cookie|gdpr|usercentrics|quantcast|cookielaw|osano|cookiebot', fr.url, re.I):
                    got += fr.evaluate(JS_CLICK, ACCEPT_RX)
            except Exception: pass
        if got: notes.append('clicked:' + '|'.join(got))
        page.wait_for_timeout(900)
        if not got: break

def capture(browser, t, out, force=False):
    tid = t['id']
    meta = dict(id=tid, url=t['url'], expected=t['expected'], notes=[])
    png = f'{out}/{tid}.png'
    ctx = browser.new_context(viewport={'width': 1200, 'height': 1000}, device_scale_factor=2, user_agent=UA, locale='en-US', timezone_id='America/New_York', color_scheme='light')
    page = ctx.new_page()
    try:
        resp = page.goto(t['url'], timeout=45000, wait_until='domcontentloaded')
        meta['status'] = resp.status if resp else None
        meta['final_url'] = page.url
        settle(page, 2500)
        title = page.title()
        meta['title0'] = title
        if (resp and resp.status >= 400) or BLOCK_RX.search(title or ''):
            meta['ok'] = False; meta['error'] = f'blocked or error: status {meta["status"]} title {title!r}'
            return meta
        dismiss(page, meta['notes'])
        hidden = page.evaluate(JS_HIDE, dict(keepAds=bool(t.get('keepads'))))
        if hidden: meta['notes'].append(f'hid {hidden} overlay element(s)')
        try: meta['hidden_detail'] = page.evaluate('window.__hiddenDetail')
        except Exception: pass
        page.evaluate('window.scrollTo(0,0)')
        page.wait_for_timeout(600)
        # second pass (late banners)
        dismiss(page, meta['notes'])
        hidden2 = page.evaluate(JS_HIDE, dict(keepAds=bool(t.get('keepads'))))
        if hidden2: meta['notes'].append(f'hid {hidden2} more')
        page.evaluate('window.scrollTo(0,0)')
        page.wait_for_timeout(500)
        info = page.evaluate(JS_INFO, t['expected'])
        meta.update(info)
        # crop
        if 'h1_box' not in info:
            # no headline element: fall back to the first screen top
            y0, y1 = 0, 520
            meta['notes'].append('no h1 found; cropped to top 520 px')
        else:
            hb = info['h1_box']
            bottom = max(info.get('below_bottom') or hb[3], hb[3])
            if info.get('hero_top') and info['hero_top'] > hb[3] and bottom > info['hero_top']:
                bottom = info['hero_top']
            bottom = min(bottom, hb[3] + 300)
            y1 = bottom + 18
            if info.get('hero_top') and info['hero_top'] > hb[3]: y1 = min(y1, info['hero_top'] - 4)
            y0 = 0
            if y1 > 1250:
                y0 = max(0, hb[1] - 150)
                meta['notes'].append('headline is low on the page; masthead not included')
            y1 = min(y1, y0 + 1250)
        if t.get('y0') is not None:
            y0 = t['y0']; meta['notes'].append(f'crop starts at css y={y0} (the area above it, masthead, hero image, empty ad slot or video player, is not included)')
            if t.get('crop_h') is None: y1 = max(y1, y0 + 200)
        if t.get('bottom_selector'):
            bs = page.evaluate("(s)=>{const e=document.querySelector(s); if(!e) return null; const r=e.getBoundingClientRect(); return r.bottom+scrollY}", t['bottom_selector'])
            if bs: y1 = bs + 14; meta['notes'].append(f"crop ends below {t['bottom_selector']}")
        if t.get('crop_h'): y1 = y0 + t['crop_h']
        meta['masthead_included'] = (y0 == 0) or bool(t.get('masthead_ok'))
        # horizontal: full width (masthead is full width)
        cx0 = t.get('x0', 0); cx1 = t.get('x1', 1200)
        clip = dict(x=cx0, y=y0, width=cx1 - cx0, height=max(120, y1 - y0))
        meta['crop_css'] = [clip['x'], clip['y'], clip['width'], clip['height']]
        if clip['y'] + clip['height'] <= 1000:
            page.screenshot(path=png, clip=clip, type='png')
        else:
            cdp = ctx.new_cdp_session(page)
            r = cdp.send('Page.captureScreenshot', {'format': 'png', 'captureBeyondViewport': True, 'fromSurface': True,
                         'clip': {'x': clip['x'], 'y': clip['y'], 'width': clip['width'], 'height': clip['height'], 'scale': 2}})
            open(png, 'wb').write(base64.b64decode(r['data']))
            meta['notes'].append('captured beyond the first viewport (CDP captureBeyondViewport)')
        meta['ok'] = True
        meta['png'] = png
        meta['final_url'] = page.url
    except Exception as e:
        meta['ok'] = False; meta['error'] = repr(e)[:300]
    finally:
        try: ctx.close()
        except Exception: pass
    return meta

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('targets')
    ap.add_argument('--only', default='')
    ap.add_argument('--maxprio', type=int, default=9)
    ap.add_argument('--out', default=OUT)
    ap.add_argument('--skip-done', action='store_true')
    ap.add_argument('--child', action='store_true')
    a = ap.parse_args()
    T = json.load(open(a.targets))
    if a.only: T = [t for t in T if t['id'] in set(a.only.split(','))]
    T = [t for t in T if t.get('prio', 1) <= a.maxprio]
    os.makedirs(a.out + '/_meta', exist_ok=True)
    if not a.child:
        for t in T:
            mp = f"{a.out}/_meta/{t['id']}.json"
            if a.skip_done and os.path.exists(mp): continue
            t0 = time.time()
            try:
                r = subprocess.run([sys.executable, __file__, a.targets, '--only', t['id'], '--out', a.out, '--child'], capture_output=True, text=True, timeout=100)
                print(r.stdout.strip() or r.stderr.strip()[-300:], flush=True)
            except subprocess.TimeoutExpired:
                json.dump(dict(id=t['id'], url=t['url'], ok=False, error='hard timeout 100 s (page hung)'), open(mp, 'w'))
                print('FAIL', t['id'], 'hard timeout', flush=True)
        sys.exit(0)
    pins = spki_pins('/root/.ccr/agent-proxy-ca.crt')
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME, headless=True, proxy={'server': PROXY} if PROXY else None,
                              args=['--ignore-certificate-errors-spki-list=' + pins, '--disable-blink-features=AutomationControlled', '--no-sandbox'])
        for t in T:
            mp = f"{a.out}/_meta/{t['id']}.json"
            if a.skip_done and os.path.exists(mp) and json.load(open(mp)).get('ok') is not None: continue
            t0 = time.time()
            m = capture(b, t, a.out)
            json.dump(m, open(mp, 'w'), ensure_ascii=False, indent=1)
            print(('OK  ' if m.get('ok') else 'FAIL'), t['id'], round(time.time() - t0, 1), 's', (m.get('h1') or m.get('error') or '')[:100], '|', ';'.join(m.get('notes', []))[:120], flush=True)
        b.close()
