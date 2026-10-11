/* Legacy item types (render/video/fx/legacy.js): everything the r1-r7 short and long cuts use, moved out of teaser.html
 * unchanged in behaviour (rev2 refactor; check/regress.py compares stills against the pre-refactor engine).
 * Types: clip, caption, quote, headline, text, logo, stamp, color, grain, vignette, image, shape, band, ticker, pullquote, voice.
 * Reusable pieces for other modules are exported on HP.lib.legacy: FrameBox, frameRect, boxMotion, textMotion, setText,
 * markHL, buildWords, revealWords, buildStamp, buildSource, dirVec, logoPiece, LOGOS (logo items), BANDS (band items by id).
 * Do not edit for rev2 work: add new behaviour in your own module (fx/<module>.js) instead.
 */
(function () {
'use strict';
const { clamp, lerp, pr, el, sv, setA, esc, $, mulberry32, EPS, NS } = HP.u;
const { oCub, iCub, ioCub, oBack, oExpo } = HP.ease;
const { Item, T, gridAt, envOf } = HP;
const W = HP.W, H = HP.H;
const LAYOUT = HP.LAYOUT, ITEMS = HP.ITEMS, WARN = HP.WARN, INFO = HP.INFO;
const LOGOS = [], BANDS = {};   // logo items (their pieces seed frames: enter {style: "morph", from: "logo:square"}) and plane bands by id

// the engine's default layout for these types (EDL.layout overrides, shallow)
HP.layoutDefaults({
  // r2: stamps sit below the Reels/TikTok header zone (top 250 px); secondary mono lines 38 px, stamp names 40 px
  stamp: { x: 60, y: 300 }, meta: 38, name: 40,
  clipBox: { x: 0, y: 330, w: 1080, h: 940 },
  // text columns stop at x = 960: the Reels/TikTok button rail covers roughly x > 960 in the lower half
  caption: { x: 60, w: 900, gap: 40, size: 56, lh: 1.2, reveal: 'words' },
  quote: { x: 60, w: 900, cy: 900, size: 66, lh: 1.17, per: 0.07, bigSize: 300 },
  headline: { x: 60, w: 900, cy: 900, size: 62, lh: 1.07, invert: 0.067, slam: 0.14 },
  stack: { y0: 340, y1: 1560, gap: 56, dim: 0.55, align: 'center' },
  text: { y: 900, font: "'Newsreader', serif", weight: 400, italic: true, size: 120, color: '#FFFFFF' },
});

// ============================================================ shared blocks: stamp, caption, source line
// ============================================================ shared blocks: stamp, caption, source line
function buildStamp(parent, s, L) {
  if (!s) return null;
  const st = el('div', 'stamp', parent, { left: (s.x ?? L.stamp.x) + 'px', top: (s.y ?? L.stamp.y) + 'px' });
  if (s.year) {
    const yr = el('div', 'yr', st); yr.textContent = s.year;
    // r3 "yrPx": a smaller year chip (padding scales with it), e.g. the short's montage stamps that sit between the header and the clip box
    if (s.yrPx) { const k = s.yrPx / 58; Object.assign(yr.style, { fontSize: s.yrPx + 'px', padding: `${(15 * k).toFixed(1)}px ${(20 * k).toFixed(1)}px ${(13 * k).toFixed(1)}px` }); }
  }
  const who = el('div', 'who', st);
  if (s.w) who.style.maxWidth = s.w + 'px';   // r5: a long role line wraps under the name instead of running off the frame
  if (s.name) el('div', 'nm', who).textContent = s.name;
  if (s.role) { const r = el('div', 'rl', who); r.textContent = s.role; if (s.roleColor) r.style.color = s.roleColor; }   // fixer r2: roleColor (opt-in)
  return st;
}
// words: [{"w": "NO", "t": local s} | {"w": ..., "s": source s}]; hl: substring(s) to mark red; reveal: "words" | "all"
// hlKeep (r4): a highlighted phrase never breaks across lines (its inner spaces are non-breaking)
function buildWords(box, text, words, hl, hlKeep) {
  const toks = words ? words.map(w => ({ ...w })) : text.split(/\s+/).filter(Boolean).map(w => ({ w }));
  const up = toks.map(x => x.w.toUpperCase());
  const mark = new Array(toks.length).fill(false);
  for (const h of [].concat(hl || [])) {
    const hw = h.toUpperCase().split(/\s+/).filter(Boolean);
    const norm = s => s.replace(/[^\w%']/g, '');
    for (let i = 0; i + hw.length <= up.length; i++) {
      if (hw.every((x, j) => norm(up[i + j]) === norm(x))) { for (let j = 0; j < hw.length; j++) mark[i + j] = true; break; }
    }
  }
  toks.forEach((tk, i) => {
    const sp = el('span', 'w', box);
    const joinNext = mark[i] && mark[i + 1];
    sp.textContent = tk.w + (joinNext ? (hlKeep ? '\u00a0' : ' ') : '');
    if (mark[i]) { sp.classList.add('hl'); const a = !mark[i - 1], b = !mark[i + 1]; sp.classList.add(a && b ? 'solo' : a ? 'first' : b ? 'last' : 'mid'); }
    tk.el = sp;
    if (!joinNext && i < toks.length - 1) box.appendChild(document.createTextNode(' '));
  });
  return toks;
}
// mode "dim": every word is on screen from the start at 0.22 and lights up as it is spoken; dimHl (r4) sets the not-yet-spoken
// level of highlighted words (e.g. 0.8, so a hook phrase reads on the first frame); dimOp (r5) that of the other words
// mode "sweep" (rev2 polisher, opt-in): like "dim" (unspoken words at dimOp, default 0.14; highlighted ones at dimHl, default 0.3,
// with NO red chip yet), but each spoken word ramps up over 0.07 s and a highlighted word's red chip is swept on left to right
// across it from the moment it is spoken (over 0.12 s, or up to the next word), so the marker fires with the voice
function revealWords(toks, lt, mode, dimHl, dimOp) {
  if (mode === 'sweep') {
    toks.forEach((tk, i) => {
      const on = tk.lt === undefined || lt >= tk.lt - EPS, hl = tk.el.classList.contains('hl');
      tk.el.style.opacity = on ? lerp(0.45, 1, pr(lt, tk.lt ?? -1, 0.07)).toFixed(3) : (hl ? (dimHl ?? 0.3) : (dimOp ?? 0.14));
      if (!hl) return;
      const nx = toks[i + 1] && toks[i + 1].lt !== undefined ? toks[i + 1].lt - (tk.lt ?? 0) : 0.12;
      const u = on ? HP.ease.oQuad(pr(lt, tk.lt ?? -1, clamp(nx, 0.05, 0.12))) : 0, P = (u * 100).toFixed(1);
      tk.el.style.background = u <= 0 ? 'transparent' : u >= 1 ? '' : `linear-gradient(90deg, var(--red) ${P}%, transparent ${P}%)`;
      const cl = tk.el.classList, sh = [];
      if ((cl.contains('first') || cl.contains('solo')) && u > 0) sh.push('-0.14em 0 0 var(--red)');
      if ((cl.contains('last') || cl.contains('solo')) && u >= 1) sh.push('0.14em 0 0 var(--red)');
      tk.el.style.boxShadow = sh.join(', ') || 'none';
    });
    return;
  }
  for (const tk of toks) {
    const on = mode === 'all' || tk.lt === undefined || lt >= tk.lt - EPS;
    if (mode === 'dim') { tk.el.style.opacity = on ? 1 : (dimHl !== undefined && tk.el.classList.contains('hl') ? dimHl : (dimOp ?? 0.22)); continue; }
    const u = on ? pr(lt, tk.lt ?? -1, 0.07) : 0;
    tk.el.style.opacity = on ? (0.35 + 0.65 * u) : 0;
  }
}

// spoken caption under a clip box: red rule + mono words (revealed as spoken). toLocal(word) -> item-local seconds
function buildCaption(parent, cap, box, toLocal) {
  const C = { ...LAYOUT.caption, ...cap };
  const y = C.y ?? (box.y + box.h + C.gap);
  const rule = el('div', 'rule', parent, { left: C.x + 'px', top: y + 'px', width: '72px' });
  const capEl = el('div', 'cap' + (C.serif ? ' serif' : ''), parent, { left: C.x + 'px', top: (y + 30) + 'px', width: C.w + 'px', fontSize: C.size + 'px', lineHeight: C.lh });
  const toks = buildWords(capEl, cap.text, cap.words, cap.hl, C.hlKeep);
  for (const tk of toks) tk.lt = toLocal(tk);
  return { cap: capEl, toks, reveal: C.reveal || 'words', dimHl: C.dimHl, dimOp: C.dimOp, rule, capX: C.x, capY: y };
}
// r5 "dimRest" (headline, ticker): the text outside the exact highlight spans is set at this opacity, so the eye lands on the
// highlighted phrase while the full verbatim headline stays on screen
function dimRestText(box, op) {
  if (op === undefined || op === null) return;
  for (const n of Array.from(box.childNodes)) {
    if (n.nodeType !== 3 || !n.textContent.trim()) continue;
    const s = document.createElement('span'); s.className = 'rest'; s.style.opacity = op; s.textContent = n.textContent; box.replaceChild(s, n);
  }
}

// ============================================================ long-cut helpers: highlights, frames, motion
// markHL: verbatim text with exact substrings (hl: string or list) wrapped in <span class="hl">; nothing is reworded
function markHL(text, hl) {
  const spans = [];
  for (const h of [].concat(hl || [])) { const i = text.indexOf(h); if (i >= 0) spans.push([i, i + h.length]); else WARN.push(`highlight "${h}" not found in "${text.slice(0, 40)}…"`); }
  spans.sort((a, b) => a[0] - b[0]);
  let out = '', k = 0;
  for (const [a, b] of spans) { if (a < k) continue; out += esc(text.slice(k, a)) + '<span class="hl">' + esc(text.slice(a, b)) + '</span>'; k = b; }
  return out + esc(text.slice(k));
}
// a frame spec: {shape: "circle"|"square"|"rect", x, y, w, h} or {cx, cy, r} (circle) or {cx, cy, w, h};
// ring (colour), ringW (px), fill (colour behind the content), radius (corner px), rot (deg)
function frameRect(f) {
  if (f.r !== undefined) return { x: f.cx - f.r, y: f.cy - f.r, w: 2 * f.r, h: 2 * f.r };
  const w = f.w, h = f.h ?? f.w;
  return f.cx !== undefined ? { x: f.cx - w / 2, y: f.cy - h / 2, w, h } : { x: f.x, y: f.y, w, h };
}
function dirVec(from, dist) {
  const R = 22 * Math.PI / 180;
  const m = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1], axis: [Math.cos(R), -Math.sin(R)], axisback: [-Math.cos(R), Math.sin(R)] };
  const v = Array.isArray(from) ? from : (m[from] || m.left), n = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / n * dist, v[1] / n * dist];
}
// geometry of a logo piece in frame px: "logo:square" (first logo item) or "<logo item id>:pink"
function logoPiece(spec) {
  if (!spec) return null;
  const [id, name] = spec.includes(':') ? spec.split(':') : ['logo', spec];
  const L = (id === 'logo' ? LOGOS[0] : LOGOS.find(l => l.id === id)) || LOGOS[0];
  return L && L.geom ? L.geom[name] || null : null;
}
class FrameBox {
  constructor(parent, f) {
    this.f = f; const R = this.R = frameRect(f);
    this.round = f.shape === 'circle' ? 1 : 0;
    this.wrap = el('div', 'fbox', parent, { left: R.x + 'px', top: R.y + 'px', width: R.w + 'px', height: R.h + 'px' });
    this.inner = el('div', 'fin', this.wrap, { background: f.fill || 'transparent' });
    this.rw = f.ring ? (f.ringW ?? 12) : 0;
    if (f.ring) this.ring = el('div', 'fring', this.wrap, { left: -this.rw + 'px', top: -this.rw + 'px', width: (R.w + 2 * this.rw) + 'px', height: (R.h + 2 * this.rw) + 'px', border: `${this.rw}px solid ${f.ring}` });
    this.tint = el('div', 'ftint', this.inner);
    this.setRound(this.round);
  }
  setRound(r) {
    const base = this.f.radius || 0;
    this.inner.style.borderRadius = r > 0 ? `${r * 50}%` : base + 'px';
    if (this.ring) this.ring.style.borderRadius = r > 0 ? `${r * 50}%` : (base ? base + this.rw : 0) + 'px';
  }
  add(node) { this.inner.insertBefore(node, this.tint); return node; }
  // r3: change the frame's rect (a card that grows to fit new content, e.g. ShapeItem "resize")
  setRect(R) {
    Object.assign(this.wrap.style, { left: R.x + 'px', top: R.y + 'px', width: R.w + 'px', height: R.h + 'px' });
    if (this.ring) Object.assign(this.ring.style, { width: (R.w + 2 * this.rw) + 'px', height: (R.h + 2 * this.rw) + 'px' });
    this.R = R;
  }
  apply(m) {
    this.wrap.style.transform = `translate(${m.dx.toFixed(2)}px,${m.dy.toFixed(2)}px) rotate(${m.rot.toFixed(3)}deg) scale(${m.sx.toFixed(4)},${m.sy.toFixed(4)})`;
    this.wrap.style.opacity = m.op;
    this.tint.style.opacity = m.tint; if (m.tintCol) this.tint.style.background = m.tintCol;
    this.setRound(m.round ?? this.round);
  }
}
// motion of a frame (or any box) from the item's enter/exit: morph from a logo piece, pop, slam, fly, fade; exit collapse, fly, fade
function boxMotion(it, t, R, rot0 = 0, round0 = 0, zoom = 1) {
  const lt = t - it.t0, rt = it.t1 - t, en = it.enter, ex = it.exit;
  const m = { dx: 0, dy: 0, sx: 1, sy: 1, rot: rot0, op: 1, tint: 0, tintCol: null, round: round0 };
  switch (en.style) {
    case 'morph': {
      const G = logoPiece(en.from); if (!G) break;
      const u0 = pr(lt - (en.delay || 0), 0, en.dur ?? 0.26), u = oCub(u0), cx = R.x + R.w / 2, cy = R.y + R.h / 2;
      m.dx = lerp(G.cx - cx, 0, u); m.dy = lerp(G.cy - cy, 0, u);
      m.sx = lerp(G.w / R.w, 1, u); m.sy = lerp(G.h / R.h, 1, u);
      m.rot = lerp(G.rot, rot0, u); m.round = lerp(G.round, round0, u);
      m.tint = 1 - clamp((u0 - 0.45) / 0.4); m.tintCol = G.color; break;
    }
    case 'pop': { const s = oBack(pr(lt, 0, en.dur ?? 0.3), 1.7); m.sx = m.sy = s; break; }
    case 'slam': { const s = lerp(1.18, 1, oCub(pr(lt, 0, en.dur ?? 0.16))); m.sx = m.sy = s; break; }
    case 'fly': { const [vx, vy] = dirVec(en.from || 'left', en.dist ?? 1500), k = 1 - oBack(pr(lt, 0, en.dur ?? 0.3), 1.15); m.dx += vx * k; m.dy += vy * k; m.rot += (en.spin || 0) * k; break; }
    case 'fade': m.op *= pr(lt, 0, en.dur ?? 0.2); break;
    case 'flicker': m.op *= [1, 0.2, 1][Math.floor(lt * HP.FPS + EPS)] ?? 1; break;
  }
  m.sx *= zoom; m.sy *= zoom;   // a slow grow over the item's life (shapes' "zoom"); exits start from it
  switch (ex.style) {
    case 'collapse': { const u = 1 - pr(rt, 0, ex.dur ?? 0.3), s = 1 - ioCub(u); m.sx *= s; m.sy *= s; m.rot += (ex.spin ?? 40) * u; break; }
    case 'fly': { const [vx, vy] = dirVec(ex.to || 'right', ex.dist ?? 1500), u = iCub(1 - pr(rt, 0, ex.dur ?? 0.3)); m.dx += vx * u; m.dy += vy * u; m.rot += (ex.spin || 0) * u; break; }
    case 'fade': m.op *= pr(rt, 0, ex.dur ?? 0.2); break;
    case 'push': { const u = 1 - pr(rt, 0, ex.dur ?? 0.12); m.sx *= lerp(1, 1.08, iCub(u)); m.sy *= lerp(1, 1.08, iCub(u)); m.op *= 1 - u; break; }
    case 'morph': {   // r2: the frame shrinks into a logo piece (position, size, rotation, roundness) and ends exactly on it
      const G = logoPiece(ex.to); if (!G) break;
      const u = oCub(1 - pr(rt, 0, ex.dur ?? 0.3)), cx = R.x + R.w / 2, cy = R.y + R.h / 2;
      m.dx = lerp(m.dx, G.cx - cx, u); m.dy = lerp(m.dy, G.cy - cy, u);
      m.sx = lerp(m.sx, G.w / R.w, u); m.sy = lerp(m.sy, G.h / R.h, u);
      m.rot = lerp(m.rot, G.rot, u); m.round = lerp(m.round, G.round, u); break;
    }
  }
  return m;
}
// text that accompanies a frame (stamps, attributions): rises in after `delay`, leaves with the frame's exit
function textMotion(it, t, delay = 0.06) {
  const lt = t - it.t0 - delay, rt = it.t1 - t, ex = it.exit;
  const instant = ['cut', 'slam', 'flicker'].includes(it.enter.style);   // text lands with the frame
  let op = instant ? 1 : clamp(pr(lt, 0, 0.12));
  let ty = instant ? 0 : lerp(26, 0, oCub(pr(lt, 0, 0.22)));
  if (ex.style === 'collapse' || ex.style === 'fly' || ex.style === 'fade') op *= pr(rt - (ex.dur ?? 0.3) * 0.5, 0, 0.1);
  if (ex.style === 'push') op *= pr(rt, 0, ex.dur ?? 0.12);
  return { op, ty };
}
function setText(e, m) { if (!e) return; e.style.opacity = m.op; e.style.transform = m.ty ? `translateY(${m.ty.toFixed(2)}px)` : ''; }
// attribution line under a frame or headline: red square, OUTLET, · date (or a free "source" string)
function buildSource(parent, d, css) {
  if (!d.outlet && !d.source) return null;
  const s = el('div', 'fsrc', parent, css); el('i', '', s);
  const box = el('div', '', s);
  if (d.outlet) { const b = el('b', '', box); b.textContent = d.outlet; }
  if (d.date) { const sp = el('span', '', box); sp.textContent = (d.outlet ? ' · ' : '') + d.date; }
  if (d.source) { const sp = el('span', '', box); sp.textContent = (d.outlet || d.date ? ' · ' : '') + d.source; }
  return s;
}

// ------------------------------------------------------------ color: a plain full-frame fill
class ColorItem extends Item { constructor(d) { super(d); if (!d.bg) el('div', 'bg', this.el, { background: d.color || '#000' }); } }

// ------------------------------------------------------------ stamp: just the year/name row (e.g. over a headline stack)
class StampItem extends Item { constructor(d) { super(d); buildStamp(this.el, d.stamp || d, LAYOUT); } }

// ------------------------------------------------------------ clip: pre-extracted frames (prep_clips.py) + caption
class ClipItem extends Item {
  constructor(d) {
    super(d);
    // "frame": the clip plays inside a shape (circle/square mask from the broken logo); its box is the frame's rect
    const L = LAYOUT, b = this.box = d.frame ? frameRect(d.frame) : { ...L.clipBox, ...(d.box || {}) };
    this.speed = d.speed || 1; this.in = d.in;
    if (d.frame) {
      this.ownMotion = true; this.fb = new FrameBox(this.el, d.frame);
      this.cv = this.fb.add(el('canvas', 'clip'));
    } else this.cv = el('canvas', 'clip', this.el, { left: b.x + 'px', top: b.y + 'px', width: b.w + 'px', height: b.h + 'px' });
    this.cv.width = Math.round(b.w); this.cv.height = Math.round(b.h); this.ctx = this.cv.getContext('2d');
    this.ctx.imageSmoothingQuality = 'high';
    HP.markImagery(this.cv, this.id);   // rev2: coverage.py counts it as footage
    this.stampEl = buildStamp(this.el, d.stamp, L);
    if (d.caption && d.caption.text) Object.assign(this, buildCaption(this.el, d.caption, b, w => w.t !== undefined ? w.t : w.s !== undefined ? (w.s - this.in) / this.speed : undefined));
    if (this.toks) for (const tk of this.toks) if (tk.lt !== undefined) HP.mark(this.t0 + tk.lt, this.id, 'word');
    // r7 "sub" {text, size (40), w, gap (16), color}: a small serif line under the caption, above the source, for words that are
    // NOT heard (e.g. how the speaker's sentence goes on after the audio stops); never word-lit, so it does not read as a subtitle
    if (d.sub && d.sub.text) {
      const S = d.sub;
      this.subEl = el('div', 'csub', this.el, { left: LAYOUT.caption.x + 'px', width: (S.w || (d.caption && d.caption.w) || LAYOUT.caption.w) + 'px', fontSize: (S.size || 40) + 'px' });
      if (S.color) this.subEl.style.color = S.color;
      this.subEl.textContent = S.text;
    }
    if (d.source) this.srcEl = el('div', 'src', this.el, { left: LAYOUT.caption.x + 'px' }), this.srcEl.textContent = d.source;
    this.base = `cache/${d.frames || this.id}/`;
    this.imgs = new Map();
    this.zoom = d.zoom || [1, 1];
    this.focus = d.focus || [0.5, 0.45];
    // r5 "punch": [{at: <time>, z: 1.03, dur: 0.08}] quick punch-ins on a word (they multiply the slow zoom and stay);
    // "freeze": <time>: the picture holds on the frame at that moment (e.g. after the last heard word of a trimmed line)
    this.punch = (d.punch || []).map(p => ({ t: T(p.at), z: p.z ?? 1.03, dur: p.dur ?? 0.08 }));
    for (const p of this.punch) HP.mark(p.t, this.id, 'punch');
    this.freezeLt = d.freeze !== undefined ? T(d.freeze) - this.t0 : undefined;
    // r6 (short) "zoomEase": the slow push's curve over the item's life, "io" (default: ease in-out, so the first and last
    // moments barely move), "out" (moves from frame 0 and settles) or "lin". "snap" {z (1.08), dur (0.25)}: the picture starts
    // z times larger on the item's first frame and settles to the push over dur (a snap-in hit on a cut). Opt-in: no change without.
    this.zoomEase = { io: ioCub, out: oCub, lin: u => u }[d.zoomEase || 'io'] || ioCub;
    this.snap = d.snap ? { z: d.snap.z ?? 1.08, dur: d.snap.dur ?? 0.25 } : null;
  }
  async load() {
    try { this.meta = await (await fetch(this.base + 'meta.json', { cache: 'no-store' })).json(); }
    catch (e) { this.meta = null; WARN.push(`clip ${this.id}: no frames in ${this.base} (run prep_clips.py)`); }
  }
  layout() {
    let below = this.cap ? this.cap.offsetTop + this.cap.offsetHeight : null;
    if (this.subEl && below !== null) { this.subEl.style.top = (below + (this.d.sub.gap ?? 16)) + 'px'; below = this.subEl.offsetTop + this.subEl.offsetHeight; }
    if (this.srcEl && below !== null) this.srcEl.style.top = (below + 18) + 'px';
    else if (this.srcEl) this.srcEl.style.top = (this.box.y + this.box.h + 30) + 'px';
  }
  frameNo(lt) {
    if (this.freezeLt !== undefined) lt = Math.min(lt, this.freezeLt);
    return clamp(Math.floor(lt * HP.FPS * this.speed + EPS) + 1, 1, this.meta ? this.meta.count : 1);
  }
  img(n) {
    let p = this.imgs.get(n);
    if (!p) {
      const im = new Image(); im.src = this.base + String(n).padStart(5, '0') + '.jpg';
      p = im.decode().then(() => im, () => null); p.im = im; this.imgs.set(n, p);
      if (this.imgs.size > 24) { const k = this.imgs.keys().next().value; this.imgs.delete(k); }
    }
    return p;
  }
  async prepare(t) {
    if (!this.meta || !this.active(t)) return;
    const n = this.frameNo(t - this.t0);
    for (let k = 1; k <= 3; k++) if (n + k <= this.meta.count) this.img(n + k);
    this.cur = await this.img(n); this.curN = n;
  }
  draw(t, lt) {
    const c = this.ctx, b = this.box;
    if (this.fb) {
      this.fb.apply(boxMotion(this, t, b, this.d.frame.rot || 0, this.fb.round));
      const tm = textMotion(this, t, this.d.textDelay ?? 0.08);
      setText(this.stampEl, tm); setText(this.srcEl, tm); setText(this.subEl, tm); if (this.cap) setText(this.cap, tm);
    }
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#16151b'; c.fillRect(0, 0, b.w, b.h);
    let im = (this.curN === this.frameNo(lt)) ? this.cur : null;
    if (!im && this.meta) { const p = this.imgs.get(this.frameNo(lt)); im = p && p.im && p.im.complete ? p.im : null; }
    if (im) {
      const u = clamp(lt / Math.max(0.01, this.t1 - this.t0));
      let z = lerp(this.zoom[0], this.zoom[1], this.zoomEase(u));
      if (this.snap) z *= lerp(this.snap.z, 1, oCub(pr(lt, 0, this.snap.dur)));
      for (const p of this.punch) if (t >= p.t - EPS) z *= lerp(1, p.z, oCub(pr(t, p.t, p.dur)));
      const fx = this.focus[0] * b.w, fy = this.focus[1] * b.h;
      c.setTransform(z, 0, 0, z, fx - fx * z, fy - fy * z);
      c.drawImage(im, 0, 0, b.w, b.h);
      c.setTransform(1, 0, 0, 1, 0, 0);
    } else if (!this.meta) {
      c.fillStyle = '#d0006f'; c.font = "600 34px 'IBM Plex Mono'"; c.fillText(`NO FRAMES: ${this.id}`, 40, 80);
    }
    if (this.toks) revealWords(this.toks, lt, this.reveal, this.dimHl, this.dimOp);
  }
}

// ------------------------------------------------------------ caption: a spoken caption spanning several clip items
// words: [{"w": "SO", "at": <time>}] in edit time (any time reference); sits under LAYOUT.clipBox unless "y" is given
class CaptionItem extends Item {
  constructor(d) {
    super(d);
    Object.assign(this, buildCaption(this.el, d, { ...LAYOUT.clipBox, ...(d.box || {}) }, w => w.at !== undefined ? T(w.at) - this.t0 : undefined));
    for (const tk of this.toks) if (tk.lt !== undefined) HP.mark(this.t0 + tk.lt, this.id, 'word');
    if (d.source) this.srcEl = el('div', 'src', this.el, { left: LAYOUT.caption.x + 'px' }), this.srcEl.textContent = d.source;
  }
  layout() {
    if (!this.srcEl) return;
    // r4 "srcInline": the source line sits on the red rule's line, right of it, and the caption starts under it (saves a row,
    // e.g. the short's closing caption, which must end above the cover art)
    if (this.d.srcInline) {
      const sh = this.srcEl.offsetHeight;
      Object.assign(this.srcEl.style, { left: (this.capX + 72 + 20) + 'px', top: Math.round(this.capY + 4 - sh / 2) + 'px' });
      this.cap.style.top = Math.round(this.capY + 4 + sh / 2 + (this.d.srcGap ?? 14)) + 'px';
      return;
    }
    this.srcEl.style.top = (this.cap.offsetTop + this.cap.offsetHeight + (this.d.srcGap ?? 18)) + 'px';
  }
  draw(t, lt) { revealWords(this.toks, lt, this.reveal, this.dimHl, this.dimOp); }
}

// ------------------------------------------------------------ quote: a card for quotes with no usable footage
class QuoteItem extends Item {
  constructor(d) {
    super(d);
    const L = LAYOUT, C = { ...L.quote, ...(d.style || {}) };
    this.C = C;
    buildStamp(this.el, d.stamp, L);
    this.wrap = el('div', 'abs', this.el, { left: C.x + 'px', width: C.w + 'px' });
    if (d.big) { this.big = el('div', 'big', this.wrap, { position: 'relative', fontSize: (d.bigSize || C.bigSize) + 'px', marginBottom: '26px' }); this.big.innerHTML = esc(d.big).replace(/%/g, '<span style="color:var(--red)">%</span>'); }
    el('div', 'rule', this.wrap, { position: 'relative', width: '72px', marginBottom: '22px' });
    this.cap = el('div', 'cap', this.wrap, { position: 'relative', fontSize: (d.size || C.size) + 'px', lineHeight: C.lh });
    // parts: [{"text": "...", "at": time}] lets a quote land in pieces (e.g. a punchline on the next bar)
    const parts = d.parts || [{ text: d.text, at: d.t0 }];
    this.toks = [];
    parts.forEach((p, pi) => {
      const sp = el('span', '', this.cap);
      const toks = buildWords(sp, p.text, null, d.hl);
      const at = T(p.at, this.t0) - this.t0, per = p.per ?? d.per ?? C.per;
      toks.forEach((tk, i) => tk.lt = at + i * per);
      this.toks.push(...toks);
      if (pi < parts.length - 1) this.cap.appendChild(document.createTextNode(' '));
    });
    if (d.source) { this.srcEl = el('div', 'src', this.wrap, { position: 'relative', marginTop: '30px' }); this.srcEl.textContent = d.source; }
  }
  layout() { const C = this.C, h = this.wrap.offsetHeight; this.wrap.style.top = Math.round(C.cy - h / 2) + 'px'; }
  draw(t, lt) { revealWords(this.toks, lt, this.d.reveal || 'words'); }
}

// ------------------------------------------------------------ headline: serif headline + mono attribution; stackable
class HeadlineItem extends Item {
  constructor(d) {
    super(d);
    const C = this.C = { ...LAYOUT.headline, ...(d.style || {}) };
    this.blk = el('div', 'hlb', this.el, { left: C.x + 'px', width: C.w + 'px' });
    this.ht = el('div', 'ht', this.blk, { fontSize: (d.size || C.size) + 'px', lineHeight: C.lh });
    if (d.hl) this.ht.innerHTML = markHL(d.text, d.hl); else this.ht.textContent = d.text;
    dimRestText(this.ht, d.dimRest);
    const a = el('div', 'ha', this.blk); el('i', '', a);
    const o = el('b', '', a); o.style.fontWeight = 600; o.textContent = d.outlet;
    const dt = el('span', '', a); dt.textContent = '· ' + d.date;
    this.stack = d.stack || null;
    // r3 "hlAt" (time ref): the highlight wipes on at that moment (over hlWipe s) instead of landing with the headline;
    // "zoom" [z0, z1]: a slow push-in over the item's life, around the block's centre
    this.hlAt = d.hlAt !== undefined ? T(d.hlAt) : null; this.hlWipe = d.hlWipe ?? 0.18;
    if (this.hlAt !== null) HP.mark(this.hlAt, this.id, 'highlight');
    this.hlEls = Array.from(this.ht.querySelectorAll('.hl'));
    this.zoom = d.zoom || null;
  }
  layout() {
    // items in one stack share a column: laid out once, top to bottom, centred in the stack's region
    if (!this.stack) { this.blk.style.top = Math.round(this.C.cy - this.blk.offsetHeight / 2) + 'px'; return; }
    const mates = ITEMS.filter(x => x instanceof HeadlineItem && x.stack === this.stack);
    if (mates[0] !== this) return;
    const S = { ...LAYOUT.stack, ...((HP.EDL.stacks || {})[this.stack] || {}) };
    const hs = mates.map(m => m.blk.offsetHeight), tot = hs.reduce((a, b) => a + b, 0) + S.gap * (mates.length - 1);
    let y = S.align === 'top' ? S.y0 : Math.round(S.y0 + (S.y1 - S.y0 - tot) / 2);
    mates.forEach((m, i) => { m.blk.style.top = y + 'px'; y += hs[i] + S.gap; m.dimTo = S.dim; });
  }
  draw(t, lt) {
    const inv = lt < (this.d.invert ?? this.C.invert) - EPS;
    this.blk.classList.toggle('inv', inv);
    const u = pr(lt, 0, this.C.slam);
    const z = this.zoom ? lerp(this.zoom[0], this.zoom[1], oCub(clamp(lt / Math.max(0.01, this.t1 - this.t0)))) : 1;   // same curve as a shape's zoom
    this.blk.style.transform = `scale(${(lerp(1.07, 1, oCub(u)) * z).toFixed(4)})`;
    this.blk.style.transformOrigin = this.zoom ? '50% 50%' : '0 50%';
    if (this.hlAt !== null) {   // the red chip wipes left to right; before it the words sit in the headline's own colour
      const w = oCub(pr(t, this.hlAt, this.hlWipe));
      for (const e of this.hlEls) {
        e.style.background = w > 0 ? `linear-gradient(var(--red), var(--red)) no-repeat 0 0 / ${(w * 100).toFixed(1)}% 100%` : 'none';
        // r6 (short): on the 2-frame inverted landing (ink on paper) the not-yet-wiped words take the headline's ink; they were
        // the highlight's white, i.e. invisible on the paper
        e.style.color = w > 0.5 ? '#fff' : (inv ? 'inherit' : '');
      }
    }
    let dim = 1;
    if (this.stack) {
      for (const m of ITEMS) if (m !== this && m instanceof HeadlineItem && m.stack === this.stack && m.t0 > this.t0 && t >= m.t0 - EPS)
        dim = Math.min(dim, lerp(1, this.dimTo ?? 0.5, pr(t, m.t0, 0.1)));
    }
    this.blk.style.opacity = dim;
  }
}

// ------------------------------------------------------------ text: free text, optionally landing word by word
class TextItem extends Item {
  constructor(d) {
    super(d);
    const C = this.C = { ...LAYOUT.text, ...(d.style || {}) };
    this.box = el('div', 'txt', this.el, {
      top: C.y + 'px', fontFamily: C.font, fontWeight: C.weight, fontStyle: C.italic ? 'italic' : 'normal', fontSize: C.size + 'px',
      color: C.color, letterSpacing: C.tracking || 'normal', textTransform: C.upper ? 'uppercase' : 'none', lineHeight: 1
    });
    const words = d.words || d.text.split(' ').map(w => ({ w }));
    this.toks = words.map((w, i) => {
      const sp = el('span', 'w', this.box); sp.textContent = w.w;
      if (i < words.length - 1) this.box.appendChild(document.createTextNode(' '));
      return { el: sp, at: w.at !== undefined ? T(w.at) : this.t0, how: w.how || C.land || 'drop' };
    });
    for (const tk of this.toks) HP.mark(tk.at, this.id, 'word');
  }
  draw(t) {
    for (const tk of this.toks) {
      const u = pr(t, tk.at, 0.12);
      if (t < tk.at - EPS) { tk.el.style.opacity = 0; continue; }
      if (tk.how === 'cut') { tk.el.style.opacity = 1; tk.el.style.transform = ''; continue; }
      tk.el.style.opacity = clamp(u * 3);
      tk.el.style.transform = `translateY(${lerp(-22, 0, oBack(u, 2.2)).toFixed(2)}px)`;
    }
  }
}

// ------------------------------------------------------------ fx: grain and vignette (in the overlay layer, not shaken)
class GrainItem extends Item {
  // opacity: strength; size: grain particle size in px (bigger = softer, cheaper to encode); hold: frames per grain pattern
  constructor(d) { d.overlay = true; super(d); if (!GRAIN.length) GRAIN = makeGrain(); this.el.remove(); this.g = $('grain'); this.op = d.opacity ?? 0.05; this.blend = d.blend || 'normal'; this.size = d.size ?? 2; this.hold = d.hold ?? 2; }
  frame(t) {
    const on = this.active(t);
    if (!on) { if (this.g.dataset.owner === this.id) { this.g.style.display = 'none'; this.g.dataset.owner = ''; } return; }
    const k = Math.floor(Math.floor(t * HP.FPS + EPS) / this.hold), r = mulberry32(k * 7919 + 13), S = 256 * this.size;
    Object.assign(this.g.style, { display: 'block', opacity: this.op, mixBlendMode: this.blend, backgroundImage: `url(${GRAIN[k % GRAIN.length]})`,
      backgroundSize: `${S}px ${S}px`, imageRendering: 'pixelated', backgroundPosition: `${Math.floor(r() * S)}px ${Math.floor(r() * S)}px` });
    this.g.dataset.owner = this.id;
  }
}
class VignetteItem extends Item {
  constructor(d) { d.overlay = true; super(d); this.el.remove(); this.v = $('vig'); }
  frame(t) {
    const on = this.active(t);
    if (on) { this.v.style.display = 'block'; this.v.style.opacity = this.d.opacity ?? 1; this.v.dataset.owner = this.id; }
    else if (this.v.dataset.owner === this.id) { this.v.style.display = 'none'; this.v.dataset.owner = ''; }
  }
}
let GRAIN = [];
function makeGrain(n = 6, size = 256) {
  const out = [], r = mulberry32(1234);
  for (let k = 0; k < n; k++) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const x = c.getContext('2d'), im = x.createImageData(size, size);
    for (let i = 0; i < size * size; i++) { const v = Math.floor(128 + (r() + r() + r() - 1.5) * 150); im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = clamp(v, 0, 255); im.data[i * 4 + 3] = 255; }
    x.putImageData(im, 0, 0); out.push(c.toDataURL('image/png'));
  }
  return out;
}

// ------------------------------------------------------------ image: a still (deck screenshot, photo) inside a frame
// prep_clips.py crops/grades the source into cache/<id>/image.jpg at the frame's size (see "fit": cover | contain | width)
class ImageItem extends Item {
  constructor(d) {
    super(d); this.ownMotion = true;
    const f = d.frame || { x: 60, y: 360, w: 960, h: 600 };
    this.fb = new FrameBox(this.el, f); this.R = this.fb.R;
    this.img = this.fb.add(el('img', '')); HP.markImagery(this.img, this.id);
    this.zoom = d.zoom || [1, 1]; this.focus = d.focus || [0.5, 0.5]; this.pan = d.pan || null;
    this.stampEl = buildStamp(this.el, d.stamp, LAYOUT);
    const sp = d.srcPos || {}, rw = f.ring ? (f.ringW ?? 12) : 0, sx = sp.x ?? Math.max(60, this.R.x);
    this.srcEl = buildSource(this.el, d, { left: sx + 'px', top: (sp.y ?? (this.R.y + this.R.h + rw + 26)) + 'px', width: (sp.w ?? Math.min(900, 1020 - sx)) + 'px' });
  }
  async load() {
    const base = `cache/${this.d.frames || this.id}/`;
    try { this.meta = await (await fetch(base + 'meta.json', { cache: 'no-store' })).json(); }
    catch (e) { this.meta = null; WARN.push(`image ${this.id}: not prepared in ${base} (run prep_clips.py)`); return; }
    this.img.src = base + 'image.jpg';
    try { await this.img.decode(); } catch (e) { WARN.push(`image ${this.id}: could not decode ${base}image.jpg`); }
    if (this.meta.fit === 'width') Object.assign(this.img.style, { height: (this.R.w * this.meta.h / this.meta.w) + 'px' });
  }
  draw(t, lt) {
    this.fb.apply(boxMotion(this, t, this.R, (this.d.frame || {}).rot || 0, this.fb.round));
    const u = ioCub(clamp(lt / Math.max(0.01, this.t1 - this.t0))), z = lerp(this.zoom[0], this.zoom[1], u);
    let ty = 0;
    if (this.pan && this.meta && this.meta.fit === 'width') { const ih = this.R.w * this.meta.h / this.meta.w; ty = -(ih - this.R.h) * lerp(this.pan[0], this.pan[1], u); }
    this.img.style.transformOrigin = `${this.focus[0] * 100}% ${this.focus[1] * 100}%`;
    this.img.style.transform = (ty ? `translateY(${ty.toFixed(2)}px) ` : '') + (z !== 1 ? `scale(${z.toFixed(4)})` : '');
    const tm = textMotion(this, t, this.d.textDelay ?? 0.08); setText(this.stampEl, tm); setText(this.srcEl, tm);
  }
}

// ------------------------------------------------------------ shape: an empty frame (ring, disc or square in the logo palette)
class ShapeItem extends Item {
  constructor(d) {
    super(d); this.ownMotion = true; this.fb = new FrameBox(this.el, d.frame);
    // r3 "resize": {at, dur, frame: {...}}: the card grows (or shrinks) to a new rect at `at`, with a small overshoot
    if (d.resize) { this.R0 = this.fb.R; this.R1 = frameRect({ ...d.frame, ...d.resize.frame }); this.rsAt = T(d.resize.at); this.rsDur = d.resize.dur ?? 0.16; }
  }
  draw(t, lt) {
    // r2 "zoom" [z0, z1]: a slow grow over the item's life (until its exit starts), e.g. a held disc that keeps moving
    const Z = this.d.zoom, hold = Math.max(0.01, this.t1 - this.t0 - (this.exit.style === 'cut' ? 0 : (this.exit.dur ?? 0.3)));
    const z = Z ? lerp(Z[0], Z[1], oCub(clamp(lt / hold))) : 1;
    if (this.R1) {
      const u = oBack(pr(t, this.rsAt, this.rsDur), 1.4), A = this.R0, B = this.R1;
      this.fb.setRect({ x: lerp(A.x, B.x, u), y: lerp(A.y, B.y, u), w: lerp(A.w, B.w, u), h: lerp(A.h, B.h, u) });
    }
    this.fb.apply(boxMotion(this, t, this.fb.R, this.d.frame.rot || 0, this.fb.round, z));
  }
}

// ------------------------------------------------------------ band: the logo's yellow plane band, re-used as a 22 deg ticker
const BAND_DEFAULT = { cx: 540, cy: 1290, h: 270, angle: -22, len: 1900, color: '#F2C300', edge: '#15131F', edgeW: 9 };
class BandShape {
  constructor(parent, B) {
    this.B = B;
    this.div = el('div', 'band', parent, { left: (B.cx - B.len / 2) + 'px', top: (B.cy - B.h / 2) + 'px', width: B.len + 'px', height: B.h + 'px', background: B.color });
    if (B.edge) el('div', '', this.div, { position: 'absolute', left: 0, right: 0, top: 0, height: B.edgeW + 'px', background: B.edge });
  }
  // enter: morph (from the logo's band), slide (along the band), slam (thickens), grow; exit: slide, collapse, fade
  motion(it, t) {
    const lt = t - it.t0, rt = it.t1 - t, en = it.enter, ex = it.exit, B = this.B;
    const m = { dx: 0, dy: 0, along: 0, sl: 1, th: 1, op: 1 };
    switch (en.style) {
      case 'morph': {
        const G = logoPiece(en.from || 'logo:band'); if (!G) break;
        const u = oCub(pr(lt - (en.delay || 0), 0, en.dur ?? 0.26));
        m.dx = lerp(G.cx - B.cx, 0, u); m.dy = lerp(G.cy - B.cy, 0, u); m.sl = lerp(G.w / B.len, 1, u); m.th = lerp(G.h / B.h, 1, u); break;
      }
      case 'slide': { const side = en.from === 'right' ? 1 : -1; m.along = side * (B.len + 200) * (1 - oCub(pr(lt, 0, en.dur ?? 0.22))); break; }
      case 'slam': m.th = lerp(0.45, 1, oBack(pr(lt, 0, en.dur ?? 0.2), 2.6)); break;
      case 'grow': m.th = oBack(pr(lt, 0, en.dur ?? 0.24), 2.0); break;
      case 'fade': m.op *= pr(lt, 0, en.dur ?? 0.2); break;
    }
    switch (ex.style) {
      case 'slide': { const side = ex.to === 'left' ? -1 : 1; m.along += side * (B.len + 200) * iCub(1 - pr(rt, 0, ex.dur ?? 0.24)); break; }
      case 'collapse': m.th *= 1 - ioCub(1 - pr(rt, 0, ex.dur ?? 0.24)); break;
      case 'fade': m.op *= pr(rt, 0, ex.dur ?? 0.2); break;
    }
    return m;
  }
  apply(m) {
    this.div.style.transform = `translate(${m.dx.toFixed(2)}px,${m.dy.toFixed(2)}px) rotate(${this.B.angle}deg) translate(${m.along.toFixed(2)}px,0) scale(${m.sl.toFixed(4)},${m.th.toFixed(4)})`;
    this.div.style.opacity = m.op;
  }
}
class BandItem extends Item {
  constructor(d) { super(d); this.ownMotion = true; this.shape = new BandShape(this.el, { ...BAND_DEFAULT, ...(d.band || {}) }); BANDS[this.id] = this; }
  draw(t) { this.shape.apply(this.shape.motion(this, t)); }
}

// ------------------------------------------------------------ ticker: a headline set inside a band (its own, or a shared "band" item)
class TickerItem extends Item {
  constructor(d) {
    super(d); this.ownMotion = true;
    if (typeof d.band === 'string') this.bandRef = d.band;
    else this.own = new BandShape(this.el, { ...BAND_DEFAULT, ...(d.band || {}) });
    this.C = { w: 860, size: 58, pad: 30, along: 0, across: 0, drift: 0, invert: 0.067, ...(d.style || {}) };
    this.ov = el('div', 'tko', this.el);
    this.box = el('div', 'tkr', this.el, { width: this.C.w + 'px' });
    this.tt = el('div', 'tt', this.box, { fontSize: (d.size || this.C.size) + 'px' });
    this.tt.innerHTML = markHL(d.text, d.hl);
    dimRestText(this.tt, d.dimRest);
    // outlet + date: one straight mono line above the band's left half (style.labelX / labelGap / labelY override)
    this.lab = el('div', 'tkl', this.el);
    if (this.C.labelStack) {   // r4: outlet over date, a compact block that hugs the band's top edge (not read as a nearby photo's credit)
      this.lab.classList.add('stk');
      const l1 = el('div', 'l1', this.lab); el('i', '', l1); el('b', '', l1).textContent = d.outlet;
      el('span', 'l2', this.lab).textContent = d.date;
    } else { el('i', '', this.lab); el('b', '', this.lab).textContent = d.outlet; el('span', '', this.lab).textContent = '· ' + d.date; }
  }
  bandShape() { return this.own || (BANDS[this.bandRef] && BANDS[this.bandRef].shape); }
  layout() {
    const S = this.bandShape(); if (!S) { WARN.push(`ticker ${this.id}: no band "${this.bandRef}"`); return; }
    const B = S.B, C = this.C;
    let fs = this.d.size || C.size;   // shrink to fit the band's thickness
    while (this.box.offsetHeight > B.h - 2 * C.pad && fs > 30) { fs -= 2; this.tt.style.fontSize = fs + 'px'; }
    if (fs !== (this.d.size || C.size)) INFO.push(`ticker ${this.id}: text set at ${fs}px to fit the band`);
    const bw = this.box.offsetWidth, bh = this.box.offsetHeight;
    Object.assign(this.box.style, { left: (B.cx - bw / 2) + 'px', top: (B.cy - bh / 2) + 'px' });
    Object.assign(this.ov.style, { left: (B.cx - B.len / 2) + 'px', top: (B.cy - B.h / 2) + 'px', width: B.len + 'px', height: B.h + 'px' });
    // label: its bottom-right corner sits just above the band's top edge (the edge rises to the right at 22 deg)
    const lx = C.labelX ?? 60, lw = this.lab.offsetWidth, lh = this.lab.offsetHeight, A = -B.angle * Math.PI / 180;
    const edge = x => B.cy - Math.tan(A) * (x - B.cx) - (B.h / 2) / Math.cos(A);
    const ly = C.labelY ?? Math.round(edge(lx + lw) - (C.labelGap ?? 16) - lh);
    Object.assign(this.lab.style, { left: lx + 'px', top: ly + 'px' });
    this.labBox = { x: lx, y: ly, w: lw, h: lh };
  }
  draw(t, lt) {
    const S = this.bandShape(); if (!S) return;
    let m;
    if (this.own) { m = S.motion(this, t); S.apply(m); }
    else { const b = BANDS[this.bandRef]; m = S.motion(b, t); }
    const C = this.C, B = S.B, u = pr(lt, 0, 0.14), sc = lerp(1.06, 1, oCub(u));
    // the 2-frame ink flash only when the band is already in place (a shared band, or an own band that slams/cuts in)
    const flashOK = !this.own || ['cut', 'slam'].includes(this.enter.style);
    const inv = flashOK && lt < (this.d.invert ?? C.invert) - EPS;
    this.box.classList.toggle('inv', inv); this.ov.style.display = inv ? 'block' : 'none';
    const drift = C.drift ? lerp(C.drift / 2, -C.drift / 2, clamp(lt / Math.max(0.01, this.t1 - this.t0))) : 0;
    const base = `translate(${m.dx.toFixed(2)}px,${m.dy.toFixed(2)}px) rotate(${B.angle}deg) translate(${(m.along).toFixed(2)}px,0)`;
    this.ov.style.transform = base + ` scale(${m.sl.toFixed(4)},${m.th.toFixed(4)})`;
    this.box.style.transform = base + ` translate(${(C.along + drift).toFixed(2)}px,${C.across}px) scale(${sc.toFixed(4)},${(sc * m.th).toFixed(4)})`;
    this.box.style.opacity = m.op;
    // the straight label rides in with the ticker and leaves as the band slides/collapses away
    const away = clamp(1 - Math.abs(m.along) / 420) * clamp((m.th - 0.3) / 0.4) * m.op;
    const exU = this.own ? 1 : pr(this.t1 - t, 0, 0.06);
    this.lab.style.opacity = (away * clamp(pr(lt, 0, 0.1)) * exU).toFixed(3);
    this.lab.style.transform = `translateY(${lerp(14, 0, oCub(pr(lt, 0, 0.16))).toFixed(2)}px)`;
  }
}

// ------------------------------------------------------------ pullquote: verbatim words styled as a quote (not a subtitle) + name + year
// Used for muted clips (their words) and for cards with no footage. Optional big figure, label, source line and a frame behind.
class PullquoteItem extends Item {
  constructor(d) {
    super(d); this.ownMotion = true;
    if (d.frame) this.fb = new FrameBox(this.el, d.frame);
    // r5 "stamp": the cut's header stamp row (year chip, name, role at layout.stamp), like every other sourced item; it rises in
    // with the quote and leaves with it
    this.stampEl = buildStamp(this.el, d.stamp, LAYOUT);
    const C = this.C = { x: 60, w: 900, size: 64, lh: 1.1, align: 'left', ...(d.style || {}) };
    this.wrap = el('div', 'pq' + (C.align === 'center' ? ' center' : ''), this.el, { left: C.x + 'px', width: C.w + 'px' });
    if (d.label) { const lb = el('div', 'lab', this.wrap); lb.textContent = d.label; if (C.labSize) lb.style.fontSize = C.labSize + 'px'; }
    if (d.big) {
      const b = el('div', 'pbig' + (C.bigMono ? ' bmono' : ''), this.wrap, { fontSize: (d.bigSize || 200) + 'px' });
      const k = d.bigDim ? d.big.indexOf(d.bigDim) : -1;
      b.innerHTML = k >= 0 ? esc(d.big.slice(0, k)) + '<em>' + esc(d.bigDim) + '</em>' + esc(d.big.slice(k + d.bigDim.length)) : esc(d.big);
    }
    if (d.rule !== false && !d.big) el('div', 'prule', this.wrap);
    if (d.text) { this.q = el('div', 'pqt' + (d.upright ? ' up' : '') + (C.mono ? ' pmono' : '') + (C.pre ? ' pre' : ''), this.wrap, { fontSize: (d.size || C.size) + 'px', lineHeight: C.lh }); this.q.innerHTML = markHL(d.text, d.hl); }
    if (d.name || d.year) {
      const a = el('div', 'pa', this.wrap);
      if (d.year) el('span', 'yr', a).textContent = d.year;
      if (d.name) el('span', 'nm', a).textContent = d.name;
      if (d.role) el('span', 'rl', a).textContent = d.role;
    }
    if (d.source) el('div', 'ps', this.wrap).textContent = d.source;
    // on a filled tile: style.color (text + name), bigColor, bigDimColor, hlColor, dimColor (role/source lines)
    const W_ = this.wrap, set = (sel, prop, v) => { if (v) W_.querySelectorAll(sel).forEach(e => e.style[prop] = v); };
    set('.pqt, .pa', 'color', C.color); set('.pbig', 'color', C.bigColor); set('.pbig em', 'color', C.bigDimColor);
    set('.pqt .hl', 'color', C.hlColor); set('.pa .rl, .ps', 'color', C.dimColor); set('.lab', 'color', C.labColor);
    if (C.hlBg) W_.querySelectorAll('.pqt .hl').forEach(e => Object.assign(e.style, { background: C.hlBg, padding: '0 0.07em' }));   // a chip, e.g. cream on ink on a filled tile
    // long r6 "hlAt" (time ref): the highlight lands at that moment instead of with the quote (a beat-locked event inside a long
    // hold); before it the words sit in the quote's own colour. A chip highlight (dark ground, or style.hlBg) wipes on left to
    // right over hlWipe s (0.18), as a headline's does; a text-only highlight (light ground) changes colour at hlAt. Opt-in.
    this.hlAt = d.hlAt !== undefined && this.q ? T(d.hlAt) : null; this.hlWipe = d.hlWipe ?? 0.18;
    if (this.hlAt !== null) HP.mark(this.hlAt, this.id, 'highlight');
    if (this.hlAt !== null) {
      this.hlEls = Array.from(this.q.querySelectorAll('.hl'));
      this.hlChip = C.hlBg || (this.theme === 'light' ? null : 'var(--red)');
      this.hlCol = C.hlColor || (this.hlChip ? '#fff' : 'var(--red)');
    }
  }
  layout() { const C = this.C, h = this.wrap.offsetHeight; this.wrap.style.top = Math.round(C.y !== undefined ? C.y : (C.cy ?? 900) - h / 2) + 'px'; this.h = h; }
  draw(t, lt) {
    if (this.fb) this.fb.apply(boxMotion(this, t, this.fb.R, this.d.frame.rot || 0, this.fb.round));
    if (this.hlEls) {   // r6 "hlAt" (see the constructor)
      const w = oCub(pr(t, this.hlAt, this.hlWipe));
      for (const e of this.hlEls) {
        if (this.hlChip) e.style.background = w > 0 ? `linear-gradient(${this.hlChip}, ${this.hlChip}) no-repeat 0 0 / ${(w * 100).toFixed(1)}% 100%` : 'none';
        e.style.color = w > 0.5 ? this.hlCol : 'inherit';
      }
    }
    const delay = this.d.textDelay ?? (this.fb ? 0.1 : 0), ex = this.exit;
    const tm = textMotion(this, t, delay);
    setText(this.stampEl, tm);
    const sc = this.enter.style === 'slam' ? lerp(1.08, 1, oCub(pr(lt, 0, 0.16))) : 1;
    let op = tm.op, xf = `translateY(${tm.ty.toFixed(2)}px) scale(${sc.toFixed(4)})`, org = this.C.align === 'center' ? '50% 50%' : '0 50%';
    if (ex.style === 'collapse') {   // the text shrinks and spins with its frame (same curve as boxMotion), instead of leaving first
      const u = 1 - pr(this.t1 - t, 0, ex.dur ?? 0.3), s = 1 - ioCub(u);
      op = textMotion({ t0: this.t0, t1: this.t1, enter: this.enter, exit: { style: 'cut' } }, t, delay).op * clamp(s / 0.15);
      if (u > 0) { xf += ` rotate(${((ex.spin ?? 40) * u).toFixed(3)}deg) scale(${s.toFixed(4)})`; org = '50% 50%'; }
    }
    this.wrap.style.opacity = op;
    this.wrap.style.transformOrigin = org;
    this.wrap.style.transform = xf;
  }
}

// ------------------------------------------------------------ voice: clip speech with no picture of its own (heard over other items)
// Read by mix.py like a clip's "audio" window: source second audio.in plays at edit time "at". The page draws nothing.
class VoiceItem extends Item {
  constructor(d) { super(d); this.el.remove(); }
  frame() {}
}

// ============================================================ logo: the Kandinsky formation (ported from anim.html)
// Geometry is the cover's (render/hp/kand_e.html, 1500-unit cover space). The whole cover (art + wordmark + kicker) sits in
// one group scaled to the frame, so the final frame is the cover's composition. Part timings come from "cues" in beats of the
// item's grid (beat 0 = the item's "beat0" index in that grid); any cue may instead be an absolute time string ("riff:3").
// mode "form" (default): points -> plane -> shapes -> wordmark -> kicker. "break": the pieces blow apart (some are hidden at
// that moment because frames morph out of them). mode "assemble": the scattered pieces fly back in and land on beats.
const LOGO_CUES = {
  plane: 0, dots: 0, pink: 1, black: 1.5, core: 2, sort: 2, smallO: 2.5, blue: 3, teal: 3.5, square: 4, target: 4.5,
  arc: 5, normal: 5.5, margin: 5.75, chk: 6, nabla: 7, wordmark: 8, tilt: 9, kicker: 10
};
const LOGO_HITS = [{ beat: 0, amp: 26 }, { beat: 4, amp: 9 }, { beat: 7, amp: 6 }, { beat: 8, amp: 22 }, { beat: 9, amp: 7 }, { beat: 12, amp: 8 }];
const LOGO_FLASHES = [{ beat: 0, opacity: 0.8, decay: 0.05 }, { beat: 8, opacity: 0.22, decay: 0.05 }];
const LOGO_ASSEMBLE = {
  plane: 0, sort: 0, pink: 0.5, black: 0.75, core: 1, blue: 1, smallO: 1.5, teal: 1.5, square: 1.75, target: 2,
  arc: 2, normal: 2.25, margin: 2.25, chk: 2.5, nabla: 2.75, wordmark: 3, tilt: 3.5, kicker: 4
};
const LOGO_ASSEMBLE_HITS = [{ beat: 0, amp: 24 }, { beat: 1, amp: 7 }, { beat: 2, amp: 7 }, { beat: 3, amp: 20 }, { beat: 4, amp: 8 }];
const LOGO_ASSEMBLE_FLASHES = [{ beat: 0, opacity: 0.5, decay: 0.05 }, { beat: 3, opacity: 0.2, decay: 0.05 }];
const LOGO_FLY = ['margin', 'normal', 'pink', 'black', 'core', 'smallO', 'arc', 'chk', 'nabla', 'blue', 'teal', 'square', 'target'];
const COL = HP.COL;

class LogoItem extends Item {
  constructor(d) {
    d.bg = d.bg || COL.cream;
    super(d);
    this.grid = d.grid; this.beat0 = d.beat0 || 0;
    this.mode = d.mode || 'form';
    const A = this.mode === 'assemble';
    const cues = { ...(A ? LOGO_ASSEMBLE : LOGO_CUES), ...(d.cues || {}) };
    this.c = {};
    for (const k in cues) this.c[k] = this.bt(cues[k]);
    this.fly = {}; this.flyDur = d.flyDur ?? 0.22;
    if (A) {   // assembling pieces arrive fully formed (no pop-in): their cue is the landing time of their flight
      for (const k of LOGO_FLY) { this.fly[k] = this.c[k]; this.c[k] = -1e9; }
      this.c.dots = d.dotsAt !== undefined ? T(Array.isArray(d.dotsAt) ? d.dotsAt[0] : d.dotsAt) : this.t0;
    }
    this.dotStagger = d.dotStagger ?? (A ? 0.11 : 0.02);
    // dotsAt may be a list of times (one per data point, e.g. on the words of a sung line); dotScale = their size before sorting
    this.dotT = Array.isArray(d.dotsAt) ? d.dotsAt.map(x => T(x)) : null;
    if (this.dotT) this.c.dots = this.dotT[0];
    this.dotScale = d.dotScale ?? 2.6;
    // slam: parts that land fully formed on their cue frame (e.g. ["plane", "pink", "black"] on the downbeat)
    // slamFrom: one scale for every slammed part, or {part: scale} (r2: the riff's first hits land big, e.g. {"core": 2.2})
    this.slam = new Set(d.slam || []); this.slamDur = d.slamDur ?? 0.1; this.slamFrom = d.slamFrom ?? 1.3;
    // r5 "wmFrom": the wordmark's slam scale on its hit frame (1.32 default; 1.1 keeps the whole word inside the frame)
    this.wmFrom = d.wmFrom ?? 1.32;
    // assemble: pieces in cutIn appear at home on their cue with no flight (e.g. a held disc morphs into "black" first)
    this.cutIn = new Set(d.cutIn || []);
    for (const h of (d.hits || (A ? LOGO_ASSEMBLE_HITS : LOGO_HITS))) HP.cam.hit(this.bt(h.beat), h.amp, h.decay);
    for (const f of (d.flashes || (A ? LOGO_ASSEMBLE_FLASHES : LOGO_FLASHES))) HP.flash(this.bt(f.beat), f.opacity, f.decay, f.color);
    // whole-art kick pulse on beats (scale around the art's middle); accents are bigger
    const P = d.pulse || (A ? { from: 3, to: 14, amp: 0.008, accents: { 3: 2.2, 4: 1.5, 8: 1.4, 12: 1.4 } } : { from: 1, to: 15, amp: 0.009, accents: { 8: 2.2, 12: 1.6, 15: 1.8 } });
    this.kicks = [];
    for (let b = P.from; b <= P.to; b++) this.kicks.push({ t: this.bt(b), a: P.amp * ((P.accents || {})[b] || 1) });
    // r4 "rehits": [{beat, parts: [...], scale (1.16), dur (0.14)}]: beat-locked bumps of single pieces during a hold, so the
    // formed logo keeps moving on the beat (form mode; "dots" = all six data points). "push": {from, to, z: [z0, z1]}: a slow
    // push-in on the whole cover between two beats (or time refs), e.g. through the hold before a break.
    this.rehits = (d.rehits || []).map(r => ({ t: this.bt(r.beat), s: r.scale ?? 1.16, dur: r.dur ?? 0.14,
      parts: [].concat(...(r.parts || []).map(k => k === 'dots' ? [0, 1, 2, 3, 4, 5].map(i => 'dot' + i) : [k])) }));
    this.push = d.push ? { t0: this.bt(d.push.from), t1: this.bt(d.push.to), z: d.push.z || [1, 1.03] } : null;
    for (const k in this.c) if (this.c[k] > -1e8) HP.mark(this.c[k], this.id, 'cue:' + k);
    for (const k in this.fly) HP.mark(this.fly[k], this.id, 'land:' + k);
    for (const k of this.kicks) HP.mark(k.t, this.id, 'pulse');
    for (const r of this.rehits) HP.mark(r.t, this.id, 'rehit');
    this.L = { y: 400, scale: 0.72, ...(d.layout || {}) };
    const B = d.break;
    // bgDelay: the cream holds this long after the break starts (the wordmark leaves first), then fades over bgFade (0 = a cut)
    this.brk = B ? { at: T(B.at), dur: B.dur ?? 0.4, stagger: B.stagger ?? 0.012, hide: B.hide || [], hideAt: T(B.hideAt ?? B.at), bgFade: B.bgFade ?? 0.18, bgDelay: B.bgDelay ?? 0, dist: B.dist ?? 1700, lead: B.lead ?? 0 } : null;
    if (B && (B.hit ?? 14)) HP.cam.hit(this.brk.at, B.hit ?? 14, 0.12);
    if (B) HP.mark(this.brk.at, this.id, 'break');
    this.flyDist = (B && B.dist) || d.flyDist || 1700;
    this.bgEl = this.el.querySelector('.bg');
    this.svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, style: 'position:absolute;left:0;top:0;overflow:visible' }, this.el);
    LOGOS.push(this);
  }
  bt(v) { // beat number (relative to beat0) or absolute time reference
    if (typeof v === 'number') return this.grid ? gridAt(this.grid, this.beat0 + v) : this.t0 + v * (this.d.beat || 0.4839);
    return T(v);
  }
  async load() { this.WMP = await (await fetch('wordmark_parts.json')).json(); }
  layout() {
    const s = this.svg, C = COL, L = this.L;
    const cover = this.cover = sv('g', { transform: `translate(${(W - 1500 * L.scale) / 2},${L.y}) scale(${L.scale})` }, s);
    const pulseG = this.pulseG = sv('g', {}, cover);
    const art = sv('g', {}, pulseG);
    const G = this.G = {};
    const grp = (n, p = art) => (G[n] = sv('g', {}, p));      // one group per piece, so pieces can fly
    const mk = (tag, a, p) => sv(tag, a, p);
    const RAD = 22 * Math.PI / 180, K = Math.tan(RAD), TV = 120 / Math.cos(RAD), BOT = 1000;
    const topY = x => BOT - TV - K * x, botY = x => BOT - K * x;
    const nrm = [Math.sin(RAD), Math.cos(RAD)];
    Object.assign(this, { TV, topY, botY, XL: -60, XR: 1560 });
    const P = this.P = {};
    // draw order matches the cover: lines under shapes, the plane on top
    P.margin = mk('line', { x1: 1180, y1: botY(1180) + 75, x2: 1400, y2: botY(1400) + 75, stroke: C.ink, 'stroke-width': 5 }, grp('margin'));
    const s0 = [470 + nrm[0] * 40, botY(470) + nrm[1] * 40];
    P.normal = mk('line', { x1: s0[0], y1: s0[1], x2: s0[0] + nrm[0] * 150, y2: s0[1] + nrm[1] * 150, stroke: C.ink, 'stroke-width': 12 }, grp('normal'));
    P.pink = mk('circle', { cx: 430, cy: 390, r: 240, fill: C.pink }, grp('pink'));
    P.black = mk('circle', { cx: 340, cy: 300, r: 188, fill: C.ink }, grp('black'));
    P.core = mk('circle', { cx: 465, cy: 425, r: 74, fill: C.orange }, grp('core'));
    P.smallO = mk('circle', { cx: 700, cy: 230, r: 30, fill: C.orange }, grp('smallO'));
    P.arc = mk('path', { d: 'M 760 340 A 90 90 0 0 1 940 340', fill: 'none', stroke: C.ink, 'stroke-width': 12 }, grp('arc'));
    const chkG = grp('chk');
    P.chk = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { if ((r + c) % 2) continue; P.chk.push({ el: mk('rect', { x: -18, y: -18, width: 36, height: 36, fill: C.ink }, chkG), r, c }); }
    P.nabla = mk('polygon', { fill: C.red }, grp('nabla'));
    this.NX = 1320; this.NTIP = topY(1320) - 67; this.NWD = 125; this.NHT = 108;
    P.blue = mk('circle', { cx: 1080, cy: 815, r: 170, fill: C.blue }, grp('blue'));
    P.teal = mk('circle', { cx: 928, cy: 775, r: 60, fill: C.teal }, grp('teal'));
    P.square = mk('rect', { x: -54, y: -54, width: 108, height: 108, fill: C.teal }, grp('square'));
    const tgG = grp('target');
    P.tg = [mk('circle', { cx: 1350, cy: 680, r: 56, fill: C.violet }, tgG), mk('circle', { cx: 1350, cy: 680, r: 37, fill: C.cream }, tgG), mk('circle', { cx: 1350, cy: 680, r: 19, fill: C.violet }, tgG)];
    // data points: they burst out scattered on the downbeat, then the plane sorts them into their classes
    P.dots = [
      { fin: [190, 643, 13], start: [560, 700], col: C.orange, cls: 0 }, { fin: [760, 777, 10], start: [300, 360], col: C.blue, cls: 1 },
      { fin: [245, 685, 18], start: [1150, 520], col: C.orange, cls: 0 }, { fin: [800, 806, 18], start: [980, 330], col: C.blue, cls: 1 },
      { fin: [292, 631, 10], start: [820, 250], col: C.orange, cls: 0 }, { fin: [835, 880, 10], start: [420, 860], col: C.blue, cls: 1 },
    ].map((o, i) => ({ ...o, el: mk('circle', { r: 0, fill: o.col }, grp('dot' + i)) }));
    const bandG = grp('band');
    P.band = mk('polygon', { fill: C.yellow }, bandG);
    P.edge = mk('line', { stroke: C.ink, 'stroke-width': 12 }, bandG);
    // wordmark (cover placement: left 142.3, top 1059.2, width 1215.3 in cover units; font units, baseline at y = 0)
    const WMP = this.WMP, ws = 1215.3 / WMP.width;
    this.wmT = { x: 142.3, base: 1059.2 + WMP.asc * ws, s: ws, cx: 142.3 + 1215.3 / 2, cy: 1059.2 + 214.5 / 2 };
    P.wm = mk('g', {}, grp('wm', pulseG));
    P.wmIn = mk('g', { transform: `translate(${this.wmT.x},${this.wmT.base}) scale(${ws})` }, P.wm);
    mk('path', { d: WMP.body, fill: C.ink }, P.wmIn);
    P.bar = mk('path', { d: WMP.bar, fill: C.ink }, P.wmIn);
    // kicker: measured on brand/hyperplane-cover-3000.png (kand_e.html at 2x): ∇ box 38x33 at x 381.4, text from x 434.8, 34px, glyph pitch 26.15
    P.kick = mk('g', {}, grp('kick', pulseG));
    mk('path', { d: 'M0 0H64L32 56Z M15 5H57L36 41.75Z', fill: C.red, 'fill-rule': 'evenodd', transform: `translate(${381.4 + (38 - 64 * 33 / 56) / 2},1335.5) scale(${33 / 56})` }, P.kick);
    const kt = mk('text', { x: 434.8, y: 1364.85, 'font-family': 'IBM Plex Mono', 'font-weight': 500, 'font-size': 34, 'letter-spacing': 5.75, fill: C.ink }, P.kick);
    kt.textContent = 'A CORNELL GRADIENT PODCAST';
    // each piece's home (cover units), its flight vector (out from the art's middle) and its geometry in frame px (for morphs)
    const Hm = this.home = {
      margin: [1290, botY(1290) + 75], normal: [s0[0] + nrm[0] * 75, s0[1] + nrm[1] * 75], pink: [430, 390], black: [340, 300], core: [465, 425],
      smallO: [700, 230], arc: [850, 300], chk: [1100, 270], nabla: [1320, this.NTIP - this.NHT / 2], blue: [1080, 815], teal: [928, 775],
      square: [690, 890], target: [1350, 680], band: [750, (topY(750) + botY(750)) / 2], wm: [this.wmT.cx, this.wmT.cy], kick: [748, 1352]
    };
    P.dots.forEach((o, i) => { Hm['dot' + i] = [o.fin[0], o.fin[1]]; });
    const rnd = mulberry32(77);
    this.flyv = {};
    for (const k in Hm) {
      let vx = Hm[k][0] - 750, vy = Hm[k][1] - 600;
      if (k === 'wm' || k === 'kick') { vx = 0; vy = 1; }
      if (k === 'band') { vx = Math.cos(RAD); vy = -Math.sin(RAD); }
      const n = Math.hypot(vx, vy) || 1;
      this.flyv[k] = { vx: vx / n, vy: vy / n, spin: (k === 'band' || k === 'wm' || k === 'kick') ? 0 : (rnd() * 2 - 1) * 170 };
    }
    const ox = (W - 1500 * L.scale) / 2, sc = L.scale, X = x => ox + sc * x, Y = y => L.y + sc * y;
    const circ = (x, y, r, color) => ({ cx: X(x), cy: Y(y), w: 2 * r * sc, h: 2 * r * sc, rot: 0, round: 1, color });
    const box = (x, y, w, h, rot, color) => ({ cx: X(x), cy: Y(y), w: w * sc, h: h * sc, rot, round: 0, color });
    this.geom = {
      band: box(750, Hm.band[1], 1620 / Math.cos(RAD), 120, -22, C.yellow), square: box(690, 890, 108, 108, 15, C.teal),
      pink: circ(430, 390, 240, C.pink), black: circ(340, 300, 188, C.ink), core: circ(465, 425, 74, C.orange), smallO: circ(700, 230, 30, C.orange),
      blue: circ(1080, 815, 170, C.blue), teal: circ(928, 775, 60, C.teal), target: circ(1350, 680, 56, C.violet),
      chk: box(1100, 270, 144, 144, -22, C.ink), nabla: box(1320, Hm.nabla[1], 125, 108, 0, C.red), wm: box(Hm.wm[0], Hm.wm[1], 1215.3, 214.5, 0, C.ink)
    };
  }
  flightXf(k, v) {
    const f = this.flyv[k], [hx, hy] = this.home[k], D = this.flyDist;
    return `translate(${(f.vx * D * v).toFixed(2)},${(f.vy * D * v).toFixed(2)}) rotate(${(f.spin * v).toFixed(2)},${hx},${hy})`;
  }
  pulse(t) {
    let p = 0;
    for (const k of this.kicks) if (t >= k.t - EPS) p = Math.max(p, k.a * Math.exp(-(t - k.t) / 0.085));
    return p;
  }
  bumpXf(k, s) { const [hx, hy] = this.home[k]; return `translate(${hx},${hy}) scale(${s.toFixed(4)}) translate(${-hx},${-hy})`; }
  draw(t) {
    const P = this.P, c = this.c, C = COL, { topY, TV, XL, XR } = this;
    const draw = (e, u, len) => setA(e, { 'stroke-dasharray': `${len} ${len}`, 'stroke-dashoffset': len * (1 - u) });
    const a = this.pulse(t), cx = 750, cy = 640;
    let zp = 1;
    if (this.push) { const Pu = this.push; zp = lerp(Pu.z[0], Pu.z[1], ioCub(clamp((t - Pu.t0) / Math.max(0.01, Pu.t1 - Pu.t0)))); }
    setA(this.pulseG, { transform: `translate(${cx},${cy}) scale(${((1 + a) * zp).toFixed(5)}) translate(${-cx},${-cy})` });
    // r4 rehits: the strongest bump in progress per piece (form mode); the break below keeps it until a piece starts to fly
    const rh = {};
    if (this.mode !== 'assemble' && this.rehits.length) {
      for (const r of this.rehits) {
        if (t < r.t - EPS) continue; const u = pr(t, r.t, r.dur); if (u >= 1) continue;
        const s = lerp(r.s, 1, oCub(u)); for (const k of r.parts) rh[k] = Math.max(rh[k] || 1, s);
      }
      for (const k in this.G) if (this.home[k]) setA(this.G[k], { transform: rh[k] ? this.bumpXf(k, rh[k]) : '' });
    }

    // the plane slams in on the downbeat: band already most of the way there, overshoots, settles; the edge snaps across
    let u = pr(t, c.plane, 0.2);
    const SF = this.slamFrom, sf = k => typeof SF === 'object' ? (SF[k] ?? 1.3) : SF;
    const on = t >= c.plane - EPS, SL = this.slam, sl = (k) => lerp(sf(k), 1, oCub(pr(t, c[k], this.slamDur)));
    // slam: full thickness (and more) on the hit frame, settling in slamDur; otherwise it thickens with an overshoot
    const h = on ? (SL.has('plane') ? TV * lerp(1.45, 1, oCub(pr(t, c.plane, this.slamDur))) : TV * lerp(0.5, 1, oBack(u, 2.6))) : 0;
    setA(P.band, { points: `${XL},${topY(XL)} ${XR},${topY(XR)} ${XR},${topY(XR) + h} ${XL},${topY(XL) + h}`, opacity: on ? 1 : 0 });
    const ue = on ? (SL.has('plane') ? 1 : lerp(0.62, 1, oExpo(pr(t, c.plane, 0.07)))) : 0, xe = lerp(XL, XR, ue);
    setA(P.edge, { x1: XL, y1: topY(XL), x2: xe, y2: topY(xe), opacity: on ? 1 : 0 });

    // data points
    P.dots.forEach((o, i) => {
      const t0 = this.dotT ? (this.dotT[i] ?? this.dotT[this.dotT.length - 1]) : c.dots + i * this.dotStagger, p = pr(t, t0, 0.2), so = pr(t, c.sort + o.cls * 0.06, 0.5);
      const big = lerp(this.dotScale, 1, oCub(so));
      setA(o.el, { cx: lerp(o.start[0], o.fin[0], oBack(so, 1.4)), cy: lerp(o.start[1], o.fin[1], oBack(so, 1.4)), r: t >= t0 - EPS ? o.fin[2] * big * oBack(p) : 0 });
    });

    // warm class
    setA(P.pink, { r: SL.has('pink') ? (t >= c.pink - EPS ? 240 * sl('pink') : 0) : 240 * oBack(pr(t, c.pink, 0.3)) });
    u = oCub(pr(t, c.black, 0.24));
    if (SL.has('black')) setA(P.black, { cx: 340, cy: 300, r: 188 * (t >= c.black - EPS ? sl('black') : 0), opacity: t >= c.black - EPS ? 1 : 0 });
    else setA(P.black, { cx: lerp(-260, 340, u), cy: lerp(-300, 300, u), opacity: t >= c.black - EPS ? 1 : 0 });
    setA(P.core, { r: SL.has('core') ? (t >= c.core - EPS ? 74 * sl('core') : 0) : 74 * oBack(pr(t, c.core, 0.28)) });
    setA(P.smallO, { r: SL.has('smallO') ? (t >= c.smallO - EPS ? 30 * sl('smallO') : 0) : 30 * oBack(pr(t, c.smallO, 0.26), 3) });
    // cool class
    u = oBack(pr(t, c.blue, 0.36), 1.3);
    if (SL.has('blue')) setA(P.blue, { cy: 815, r: t >= c.blue - EPS ? 170 * sl('blue') : 0, opacity: t >= c.blue - EPS ? 1 : 0 });
    else setA(P.blue, { cy: lerp(2300, 815, u), opacity: t >= c.blue - EPS ? 1 : 0 });
    setA(P.teal, { r: SL.has('teal') ? (t >= c.teal - EPS ? 60 * sl('teal') : 0) : 60 * oBack(pr(t, c.teal, 0.28)) });
    u = pr(t, c.square, 0.36);
    setA(P.square, { transform: `translate(690,890) rotate(${lerp(-165, 15, oBack(u, 1.2))}) scale(${oBack(u)})` });
    const TGR = [56, 37, 19];
    P.tg.forEach((e, i) => setA(e, { r: TGR[i] * oBack(pr(t, c.target + i * 0.06, 0.24)) }));
    // line work draws on
    draw(P.arc, ioCub(pr(t, c.arc, 0.34)), 283);
    draw(P.normal, oCub(pr(t, c.normal, 0.24)), 150);
    draw(P.margin, oCub(pr(t, c.margin, 0.24)), 238);
    // checkerboard flips in square by square, then the ∇ drops in
    P.chk.forEach((q, i) => {
      const uq = pr(t, c.chk + i * 0.055, 0.18), x = (q.c - 1.5) * 36, y = (q.r - 1.5) * 36;
      setA(q.el, { transform: `translate(1100,270) rotate(-22) translate(${x},${y}) rotate(${lerp(90, 0, oCub(uq))}) scale(${oBack(uq)})` });
    });
    u = pr(t, c.nabla, 0.3);
    const dy = lerp(-760, 0, oBack(u, 1.6)), { NX, NTIP, NWD, NHT } = this;
    setA(P.nabla, { points: `${NX - NWD / 2},${NTIP - NHT + dy} ${NX + NWD / 2},${NTIP - NHT + dy} ${NX},${NTIP + dy}`, opacity: t >= c.nabla - EPS ? 1 : 0 });

    // wordmark slams in, the H crossbar tilts to the plane's angle, then the kicker
    const wt = this.wmT;
    u = pr(t, c.wordmark, 0.24);
    const ws = lerp(this.wmFrom, 1, oBack(u, 1.5));   // slam: fully there on the hit frame, overshoots down, settles
    setA(P.wm, { transform: `translate(${wt.cx},${wt.cy}) scale(${ws}) translate(${-wt.cx},${-wt.cy})`, opacity: t >= c.wordmark - EPS ? 1 : 0 });
    const tilt = -22 * oBack(pr(t, c.tilt, 0.3), 2.2);
    const bc = this.WMP.barC;
    setA(P.bar, { transform: `translate(${bc[0]},${bc[1]}) skewY(${tilt}) translate(${-bc[0]},${-bc[1]})` });
    u = oCub(pr(t, c.kicker, 0.32));
    setA(P.kick, { transform: `translate(0,${lerp(36, 0, u)})`, opacity: u });

    // break apart: every piece blows out from the art's middle; hidden pieces become the frames that morph out of them
    if (this.brk) {
      const B = this.brk; let i = 0;
      const INK = ['wm', 'kick', 'black', 'chk', 'arc', 'normal', 'margin'];   // ink pieces vanish early (they ghost on a dark ground)
      for (const k of ['wm', 'kick', ...Object.keys(this.G).filter(k => k !== 'wm' && k !== 'kick')]) {
        const g = this.G[k];
        if (B.hide.includes(k)) { setA(g, { opacity: t >= B.hideAt - EPS ? 0 : 1 }); continue; }
        const v = oCub(pr(t, B.at + (k === 'wm' || k === 'kick' ? 0 : B.lead) + (i++) * B.stagger, B.dur));   // an explosion: fastest at the start; the wordmark and kicker leave first
        setA(g, { transform: v > 0 ? this.flightXf(k, v) : (rh[k] ? this.bumpXf(k, rh[k]) : ''), opacity: INK.includes(k) ? 1 - pr(v, 0.05, 0.35) : 1 - pr(v, 0.8, 0.2) });
      }
      if (this.bgEl) this.bgEl.style.opacity = 1 - pr(t, B.at + B.bgDelay, B.bgFade);   // bgFade 0 = hard cut to the ground below
    }
    // assemble: the pieces fly back in (fully formed) and land on their beats with a small bump
    if (this.mode === 'assemble') {
      const FL = this.flyDur;
      for (const k of LOGO_FLY) {
        const cue = this.fly[k], g = this.G[k], [hx, hy] = this.home[k];
        if (this.cutIn.has(k)) { setA(g, { opacity: t >= cue - EPS ? 1 : 0, transform: '' }); continue; }
        if (t < cue - FL - EPS) { setA(g, { opacity: 0, transform: '' }); continue; }
        const v = 1 - oCub(pr(t, cue - FL, FL));
        const bump = t >= cue - EPS ? lerp(1.12, 1, oCub(pr(t, cue, 0.16))) : 1;
        setA(g, { opacity: 1, transform: this.flightXf(k, v) + (bump !== 1 ? ` translate(${hx},${hy}) scale(${bump.toFixed(4)}) translate(${-hx},${-hy})` : '') });
      }
    }
  }
}

// ============================================================ coverage.py metadata (no effect on pictures): imagery and texts
const words = s => String(s || '').split(/\s+/).filter(Boolean).length;
const capReveal = c => (c && c.reveal === 'all') ? 'none' : 'words';
ClipItem.prototype.texts = function () { const d = this.d, o = []; if (d.caption && d.caption.text) o.push({ text: d.caption.text, reveal: capReveal({ ...LAYOUT.caption, ...d.caption }), role: 'main' }); if (d.sub && d.sub.text) o.push({ text: d.sub.text, reveal: 'none', role: 'main' }); if (d.source) o.push({ text: d.source, reveal: 'none', role: 'meta' }); if (d.stamp) o.push({ text: [d.stamp.year, d.stamp.name, d.stamp.role].filter(Boolean).join(' '), reveal: 'none', role: 'meta' }); return o; };
CaptionItem.prototype.texts = function () { const d = this.d, o = [{ text: d.text, reveal: capReveal({ ...LAYOUT.caption, ...d }), role: 'main' }]; if (d.source) o.push({ text: d.source, reveal: 'none', role: 'meta' }); return o; };
QuoteItem.prototype.texts = function () { const d = this.d, o = [{ text: d.parts ? d.parts.map(p => p.text).join(' ') : d.text, reveal: d.reveal === 'all' ? 'none' : 'words', role: 'main' }]; if (d.source) o.push({ text: d.source, reveal: 'none', role: 'meta' }); return o; };
HeadlineItem.prototype.texts = function () { const d = this.d; return [{ text: d.text, reveal: d.hlAt !== undefined ? 'highlight' : 'none', role: 'main' }, { text: `${d.outlet} · ${d.date}`, reveal: 'none', role: 'meta' }]; };
TextItem.prototype.texts = function () { const d = this.d, ws = d.words || []; const timed = new Set(ws.map(w => JSON.stringify(w.at ?? null))).size > 1; return [{ text: d.text || ws.map(w => w.w).join(' '), reveal: timed ? 'words' : 'none', role: 'main' }]; };
TickerItem.prototype.texts = function () { const d = this.d; return [{ text: d.text, reveal: 'none', role: 'main' }, { text: `${d.outlet} · ${d.date}`, reveal: 'none', role: 'meta' }]; };
PullquoteItem.prototype.texts = function () { const d = this.d, o = []; if (d.text) o.push({ text: d.text, reveal: d.hlAt !== undefined ? 'highlight' : 'none', role: 'main' }); if (d.big) o.push({ text: d.big, reveal: 'none', role: 'main' }); if (d.label) o.push({ text: d.label, reveal: 'none', role: 'meta' }); if (d.name || d.year) o.push({ text: [d.year, d.name, d.role].filter(Boolean).join(' '), reveal: 'none', role: 'meta' }); if (d.source) o.push({ text: d.source, reveal: 'none', role: 'meta' }); return o; };
StampItem.prototype.texts = function () { const s = this.d.stamp || this.d; return [{ text: [s.year, s.name, s.role].filter(Boolean).join(' '), reveal: 'none', role: 'meta' }]; };
ImageItem.prototype.texts = function () { const d = this.d, o = []; if (d.outlet || d.source) o.push({ text: [d.outlet, d.date, d.source].filter(Boolean).join(' · '), reveal: 'none', role: 'meta' }); return o; };

// ============================================================ register
const TYPES = {
  clip: ClipItem, caption: CaptionItem, quote: QuoteItem, headline: HeadlineItem, text: TextItem, logo: LogoItem, stamp: StampItem, color: ColorItem,
  grain: GrainItem, vignette: VignetteItem,
  image: ImageItem, shape: ShapeItem, band: BandItem, ticker: TickerItem, pullquote: PullquoteItem, voice: VoiceItem
};
for (const k in TYPES) HP.register(k, TYPES[k]);
HP.lib.legacy = { FrameBox, frameRect, boxMotion, textMotion, setText, markHL, buildWords, revealWords, buildStamp, buildSource, dirVec, logoPiece, LOGOS, BANDS, COL, TYPES };
})();
