/* fx/text.js  [BUILDER C]  text that is never dumped: roll-outs, karaoke captions, dynamic highlights
 * =================================================================================================================
 * BUILD.md REVISION 2: "Text is never dumped as a paragraph. Roll it out (word by word, like the Bostrom quote) and/or highlight
 * it dynamically (marker sweep, bold-on, pencil underline/circle), or both, so the viewer's eye is led around. Speech captions
 * light up word by word as spoken." Style: research/rev2/style.md 4.1 (highlighter), 4.2 (pencil, boil on twos), 6 (legibility).
 *
 * TYPES (documented in edl/README.md, "Builder C"):
 *   words     a free text block rolled out (any font), with marks           {text, x, y, w, font, color, align, roll, marks, ...}
 *   quoteroll a verbatim quote card: words roll out, then name + year + source type on   {text, name, year, role, source, ...}
 *   karaoke   a speech caption: every word faint, lit as it is spoken                   {words: [{w, at}] | speech, ...}
 *   + an opt-in upgrade of the legacy text types (headline, quote, pullquote, caption, ticker, stamp, image/shape labels):
 *     on by default in rev2 EDLs (a beat track, fx events or "rev": 2) or with EDL "rollout": {...defaults} ("rollout": false =
 *     off); per item "roll" (false | mode | {...}) and "marks" ([...]) work with or without it. The r1-r7 EDLs render as before.
 * ROLL (any of the above; "roll": "words" | {...}):
 *   mode   "words" (default) | "chars" (typewriter) | "lines" | "karaoke" | "none"
 *   timing at: [refs per word] | on: beats spec (one word per beat/8th: "hb:16..23", {from, to, every}) | per: s (+ from) |
 *          rate: words per beat (default 2 = on 8ths, beat-locked from "from", default the item's t0) | cps (chars, chars/s)
 *   entry  "pop" (default) | "slide" | "rise" | "drop" | "slam" | "ink" (bleed in) | "type" | "fade" | "cut"; dur (s)
 *   dim    karaoke: opacity of words not yet spoken (0.3); lit: colour of the word being spoken
 *   drift  {z: 0.03, y: 0} slow push over the item's life (every item moves); pulse: beats spec -> a small kick per beat
 *   out    {at, per, style: "drop" | "fade" | "blow"} words leave one by one
 * MARKS ("marks": [{phrase | words: [i, j], at, style, color, dur, ...}]), drawn stroke by stroke, never covering the words:
 *   marker (translucent highlighter swept L->R behind the phrase; multiply on light grounds, ink words on dark) | paint (a
 *   heavier bristle stroke) | bold (weight animates up; the line reflows) | color | underline | circle | box | strike | arrow |
 *   scribble (pencil via HP.lib.paint.pencil: rough.js double stroke + graphite tooth, boiling on twos).
 * EXPORTS: HP.lib.text = {Run, DomRun, TypeRun, wrapFor, wordTimes, entry, resolvePhrase, fmtDate, chip, chipBitmap, typed}.
 * RULES: word spans are DOM text (coverage.py reads them); every main text > 4 words declares a reveal; t-pure (no state
 *   between frames; marker strokes come from HP.lib.paint and are memoised per key).
 */
(function () {
'use strict';
const { clamp, lerp, pr, el, EPS } = HP.u, E = HP.ease;
const COL = HP.COL, INK = '#15131F', CREAM = '#F2EBDD', ONDARK = '#F5F2EA', GRAPHITE = '#2A2832';
const paint = () => HP.lib.paint || null;
const BP = () => HP.hits && HP.hits.period ? HP.hits.period : 0.4839;

// ============================================================ times
// beat-safe: HP.beat throws inside a cut of a spliced song; fall back to the period from the nearest playable beat
function beatT(x) { try { return HP.beat(x); } catch (e) { return NaN; } }
function padTimes(a, n, step) { const out = a.slice(0, n); while (out.length < n) out.push((out.length ? out[out.length - 1] : 0) + step); return out; }
// n edit times for n units (words, chars, lines) from a roll spec R; t0 = default start; id for fx specs
function wordTimes(n, R, t0, id) {
  if (n <= 0) return [];
  if (Array.isArray(R.at)) return padTimes(R.at.map(x => HP.T(x)), n, R.per ?? 0.12);
  if (R.on) return padTimes(HP.fxTimes({ on: R.on, id }).times, n, (R.per ?? BP() / 2));
  const from = HP.T(R.from, t0);
  if (R.per !== undefined) return Array.from({ length: n }, (_, k) => from + k * R.per);
  // fit (s): the whole roll must take at most this long: 8ths -> 16ths -> an even fraction of a beat
  let step = 1 / (R.rate ?? 2);
  if (R.fit && (n - 1) * step * BP() > R.fit) step = Math.min(step, 0.25);
  if (R.fit && (n - 1) * step * BP() > R.fit) step = R.fit / ((n - 1) * BP());
  const snap = Math.max(step, 0.25), b0 = HP.beatAt(from), x0 = Math.ceil(b0 / snap - 1e-4) * snap;   // start on the grid (16ths at the finest)
  const out = [];
  for (let k = 0; k < n; k++) { const t = beatT(x0 + k * step); out.push(isNaN(t) ? (out.length ? out[out.length - 1] + step * BP() : from) : t); }
  return out;
}

// ============================================================ entries (per word): returns {op, tx, ty, sc, blur, chars}
const ENTRY_DUR = { pop: 0.16, slide: 0.18, rise: 0.2, drop: 0.2, slam: 0.12, ink: 0.2, type: 0.12, fade: 0.15, cut: 0 };
function entry(style, u, k = 0) {
  const r = { op: 1, tx: 0, ty: 0, sc: 1, blur: 0 };
  if (u >= 1) return r;
  switch (style) {
    case 'pop': r.sc = lerp(0.45, 1, E.oBack(u, 2.6)); r.op = clamp(u * 4); break;
    case 'slide': r.tx = lerp(-46, 0, E.oExpo(u)); r.op = clamp(u * 3); break;
    case 'rise': r.ty = lerp(34, 0, E.oCub(u)); r.op = clamp(u * 2.5); break;
    case 'drop': r.ty = lerp(-64, 0, E.oBack(u, 2)); r.op = clamp(u * 4); r.sc = lerp(1.06, 1, u); break;
    case 'slam': r.sc = lerp(1.9, 1, E.oCub(u)); r.op = clamp(u * 6); break;
    case 'ink': r.op = clamp(u * 2.2); r.blur = (1 - E.oCub(u)) * 6; r.sc = lerp(1.1, 1, E.oCub(u)); break;
    case 'fade': r.op = E.oQuad(u); break;
    case 'type': case 'cut': default: r.op = u > 0 ? 1 : 0;
  }
  return r;
}

// ============================================================ helpers
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
function fmtDate(iso) {   // "2026-09-09" -> "SEP 9, 2026"; anything else passes through
  const m = String(iso || '').match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (!m) return String(iso || '');
  return m[3] ? `${MON[+m[2] - 1]} ${+m[3]}, ${m[1]}` : `${MON[+m[2] - 1]} ${m[1]}`;
}
const normTok = s => String(s).toLowerCase().replace(/[’‘]/g, "'").replace(/[^\w%$'.-]/g, '').replace(/^['.]+|['.]+$/g, '');
// [i0, i1] (inclusive word indices) of an exact phrase in a word list; null + WARN when not found
function resolvePhrase(words, m, who) {
  if (Array.isArray(m.words)) return [m.words[0], m.words[1] ?? m.words[0]];
  if (m.phrase === undefined) return [0, words.length - 1];
  const hw = HP.text.words(m.phrase).map(normTok), toks = words.map(normTok);
  for (let i = 0; i + hw.length <= toks.length; i++) if (hw.every((h, j) => toks[i + j] === h)) return [i, i + hw.length - 1];
  HP.WARN.push(`${who}: mark phrase "${m.phrase}" not found verbatim`);
  return null;
}
const fontObj = (f, dflt) => ({ family: "'Newsreader', serif", weight: 500, size: 72, style: 'normal', ...(dflt || {}), ...(f || {}) });
const isDark = it => it.theme !== 'light';
function markDefaults(it, m) {
  const dark = isDark(it);
  switch (m.style || 'marker') {
    case 'marker': return { color: COL.yellow, dur: 0.24 };
    case 'paint': return { color: dark ? COL.pink : COL.pink, dur: 0.2 };
    case 'underline': return { color: dark ? CREAM : COL.red, dur: 0.2 };
    case 'circle': case 'box': return { color: dark ? COL.pink : COL.red, dur: 0.4 };
    case 'strike': return { color: dark ? COL.pink : COL.red, dur: 0.18 };
    case 'arrow': return { color: dark ? CREAM : GRAPHITE, dur: 0.3 };
    case 'scribble': return { color: dark ? COL.pink : COL.red, dur: 0.3 };
    case 'bold': return { color: null, dur: 0.2 };
    case 'color': return { color: dark ? COL.yellow : COL.red, dur: 0.12 };
  }
  return { color: COL.yellow, dur: 0.24 };
}
// a small mono chip ("BBC NEWS · SEP 9, 2026"). chip() = the DOM version (o.ghost: transparent, kept only for the checks, while
// chipBitmap() paints the visible pixels: DOM text inside the promoted, scaled #cam layer rasterises at a history-dependent
// scale, a canvas bitmap does not). typed(full, t, at, cps) = the typewriter's visible prefix (+ caret) at t.
function chip(parent, text, o = {}) {
  const g = o.ghost;
  const c = el('div', 'tx-chip', parent, { position: 'absolute', left: (o.x ?? 0) + 'px', top: (o.y ?? 0) + 'px', font: `600 ${o.size ?? 34}px 'IBM Plex Mono', monospace`,
    letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', color: g ? 'transparent' : (o.color ?? CREAM), background: g ? 'transparent' : (o.bg ?? INK), padding: '8px 14px 7px', lineHeight: 1.1,
    transformOrigin: '0 0' });
  if (o.dot !== false) el('i', '', c, { display: 'inline-block', width: '0.42em', height: '0.42em', background: g ? 'transparent' : (o.dot || COL.red), marginRight: '0.5em', verticalAlign: '0.08em' });
  el('span', '', c).textContent = text;
  return c;
}
function typed(full, t, at, cps = 40, caret = true) {
  if (t < at - EPS) return '';
  const k = Math.floor((t - at) * cps + EPS);
  return k >= full.length ? full : full.slice(0, k) + (caret ? '\u258C' : '');
}
function chipBitmap(text, o = {}) {
  const size = o.size ?? 34, up = String(text).toUpperCase(), bg = o.bg ?? INK, fg = o.color ?? CREAM, dot = o.dot === false ? null : (o.dot || COL.red);
  return HP.memo(`chip|${up}|${size}|${bg}|${fg}|${dot}`, () => {
    const F = `600 ${size}px 'IBM Plex Mono', monospace`, ls = 0.06 * size, padX = 14, padT = 8, padB = 7, lh = size * 1.1;
    const dw = dot ? size * 0.92 : 0, tw = HP.text.measure(up, F, ls), w = Math.ceil(padX * 2 + dw + tw), h = Math.ceil(padT + padB + lh);
    const cv = HP.offscreen(w, h), x = cv.getContext('2d');
    x.fillStyle = bg; x.fillRect(0, 0, w, h);
    if (dot) { x.fillStyle = dot; x.fillRect(padX, padT + lh / 2 - size * 0.21 - size * 0.04, size * 0.42, size * 0.42); }
    x.font = F; x.letterSpacing = ls + 'px'; x.fillStyle = fg; x.textBaseline = 'middle'; x.fillText(up, padX + dw, padT + lh / 2 + size * 0.04);
    return { cv, w, h };
  });
}

// ============================================================ TypeRun: typewriter over existing DOM (nested text nodes kept)
class TypeRun {
  // els: elements whose text is typed on from `at` at `cps` chars/s (a caret while typing); a child element whose text is still
  // empty is hidden (so a year chip's red box does not show before its digits)
  constructor(els, at, o = {}) {
    this.at = at; this.cps = o.cps ?? 34; this.caret = o.caret !== false;
    this.nodes = [];
    for (const e of [].concat(els).filter(Boolean)) {
      const tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
      for (let n = tw.nextNode(); n; n = tw.nextNode()) if (n.data.length) this.nodes.push({ n, full: n.data, p: n.parentElement !== e ? n.parentElement : null });
    }
    this.total = this.nodes.reduce((a, x) => a + x.full.length, 0);
    this.end = this.at + this.total / this.cps;
  }
  draw(t) {
    let k = t < this.at - EPS ? 0 : Math.floor((t - this.at) * this.cps + EPS), placed = false;
    const done = k >= this.total, typing = t >= this.at - EPS && !done;
    for (const x of this.nodes) {
      const n = clamp(k, 0, x.full.length); k -= x.full.length;
      let s = x.full.slice(0, n);
      if (this.caret && typing && !placed && n < x.full.length) { s += '\u258C'; placed = true; }
      if (x.n.data !== s) x.n.data = s;
      if (x.p) x.p.style.visibility = s.length ? '' : 'hidden';
    }
  }
}

// the layout a Run will use (bold marks widen their words: wrap a little narrower so the reflowed line still fits the block)
function wrapFor(d, F, W, lh, tr = 0) {
  const text = d.upper ? String(d.text).toUpperCase() : String(d.text);
  const boldW = Math.max(0, ...(d.marks || []).filter(m => m.style === 'bold' && m.phrase).map(m => HP.text.measure(d.upper ? String(m.phrase).toUpperCase() : m.phrase, F, tr) * 0.1 + 8));
  return HP.text.wrap(text, F, W - boldW, { lh, tracking: tr, balance: d.balance ?? true });
}
// ============================================================ Run: a text block laid out by canvas metrics, one span per word
// d: {text, x, y, w, font, color, align, lh (px), lhK, upper, tracking (px), balance, roll, marks}; o: {key, parent, z}
class Run {
  constructor(it, d, o = {}) {
    this.it = it; this.d = d; this.key = o.key || it.id;
    const F = this.F = fontObj(d.font, o.font);
    this.lh = d.lh ?? F.size * (d.lhK ?? 1.12);
    const text = this.text = d.upper ? String(d.text).toUpperCase() : String(d.text);
    this.tr = d.tracking || 0;
    this.W = d.w ?? 900; this.x = d.x ?? 60; this.y = d.y ?? 900;
    const L = this.L = wrapFor(d, F, this.W, this.lh, this.tr);
    this.H = L.height;
    const align = d.align || 'left';
    this.color = d.color || (isDark(it) ? ONDARK : INK);
    const parent = o.parent || it.el;
    this.box = el('div', 'tx-run', parent, { position: 'absolute', left: this.x + 'px', top: this.y + 'px', width: this.W + 'px', height: this.H + 'px' });
    this.M = 110;
    this.font = HP.text.font(F);
    this.words = [];
    L.lines.forEach((ln, li) => {
      const dx = align === 'center' ? (this.W - ln.w) / 2 : align === 'right' ? this.W - ln.w : 0;
      ln.dx = dx;
      for (const w of ln.words) {
        const s = el('span', 'tx-w', null, { position: 'absolute', left: (dx + w.x) + 'px', top: ln.y + 'px', font: this.font, lineHeight: this.lh + 'px', color: this.color,
          whiteSpace: 'pre', letterSpacing: this.tr ? this.tr + 'px' : 'normal', transformOrigin: '50% 60%' });
        s.textContent = w.w;
        const first = w === ln.words[0], last = w === ln.words[ln.words.length - 1];
        // rev3 fixer: roll.popFrom 'left' (opt-in) anchors each word's karaoke pop at its left edge, so a word growing in never
        // crowds the word before it (a roll-out with dim 0 has nothing visible to its right yet)
        const ox = (d.roll && d.roll.popFrom === 'left') || (align === 'left' && first) ? 0 : align === 'right' && last ? w.width : w.width / 2;
        s.style.transformOrigin = `${ox.toFixed(1)}px 50%`;
        this.words.push({ el: s, w: w.w, x: dx + w.x, y: ln.y, width: w.width, line: li, i: this.words.length, ox });
      }
    });
    this.lines = L.lines;
    // roll
    const R = this.R = typeof d.roll === 'string' ? { mode: d.roll } : { ...(o.roll || {}), ...(d.roll || {}) };
    if (R.mode === undefined) R.mode = o.mode || 'words';
    this.mode = R.mode; this.entryStyle = R.entry || (this.mode === 'chars' ? 'type' : 'pop'); this.edur = R.dur ?? ENTRY_DUR[this.entryStyle] ?? 0.16;
    const t0 = o.t0 ?? it.t0;
    if (this.mode === 'chars') {
      this.cps = R.cps ?? 30; this.cAt = HP.T(R.from, t0); let c = 0;
      for (const w of this.words) { w.c0 = c; c += w.w.length + 1; w.at = this.cAt + w.c0 / this.cps; }
      this.cEnd = this.cAt + c / this.cps;
      this.caret = el('div', '', null, { position: 'absolute', width: Math.max(4, F.size * 0.09) + 'px', height: (F.size * 0.9) + 'px', background: R.caretColor || COL.red });
    } else if (this.mode === 'lines') {
      const lt = wordTimes(L.lines.length, R, t0, this.key);
      for (const w of this.words) w.at = lt[w.line];
      L.lines.forEach((ln, i) => { if (ln.words.length > 4) HP.INFO.push(`${this.key}: line ${i + 1} has ${ln.words.length} words revealed at once (lines mode)`); });
    } else if (this.mode === 'karaoke') {
      const ts = d.wordsAt || wordTimes(this.words.length, R, t0, this.key);
      this.words.forEach((w, k) => { w.at = ts[k]; w.next = ts[k + 1] ?? (ts[k] + 0.5); });
      this.dim = R.dim ?? 0.3; this.lit = R.lit || (isDark(it) ? COL.yellow : COL.red);
    } else if (this.mode === 'none' || this.mode === 'all') {
      for (const w of this.words) w.at = t0;
    } else {
      const ts = d.wordsAt || wordTimes(this.words.length, R, t0, this.key);
      this.words.forEach((w, k) => { w.at = ts[k]; });
    }
    for (const w of this.words) if (this.mode !== 'none' && this.mode !== 'all') it.mark(w.at, 'word');
    this.end = Math.max(...this.words.map(w => w.at)) + this.edur;
    if (R.out) { const ot = HP.T(R.out.at); const per = R.out.per ?? 0.04; this.words.forEach((w, k) => { w.outAt = ot + k * per; }); this.outStyle = R.out.style || 'drop'; this.outDur = R.out.dur ?? 0.2; }
    this.drift = R.drift === false ? null : { z: 0.03, y: 0, x: 0, ...(R.drift || {}) };
    this.pulse = R.pulse ? HP.fxTimes({ on: R.pulse, id: this.key }).times : null;
    // marks
    this.marks = [];
    (d.marks || []).forEach((m, mi) => this.addMark(m, mi));
    if (d.hl) this.addMark({ phrase: d.hl, at: d.hlAt, style: d.hlStyle || 'marker', color: d.hlColor }, 'hl');
    // DOM order: under canvas, words, caret, over canvas
    const needUnder = this.marks.some(m => m.style === 'marker' || m.style === 'paint');
    const needOver = this.marks.some(m => !['marker', 'paint', 'bold', 'color'].includes(m.style));
    const mk = (z) => { const c = el('canvas', '', this.box, { position: 'absolute', left: -this.M + 'px', top: -this.M + 'px', width: (this.W + 2 * this.M) + 'px', height: (this.H + 2 * this.M) + 'px', pointerEvents: 'none', transformOrigin: align === 'left' ? `${this.M}px 50%` : align === 'right' ? `${this.W + this.M}px 50%` : '50% 50%' }); c.width = this.W + 2 * this.M; c.height = this.H + 2 * this.M; return { cv: c, ctx: c.getContext('2d') }; };
    if (needUnder) { this.under = mk(); if (!isDark(it)) this.under.cv.style.mixBlendMode = 'multiply'; }
    for (const w of this.words) this.box.appendChild(w.el);
    if (this.caret) this.box.appendChild(this.caret);
    if (needOver) this.over = mk();
  }
  addMark(m0, mi) {
    const m = { ...markDefaults(this.it, m0), ...m0 };
    const r = resolvePhrase(this.words.map(w => w.w), m, this.key);
    if (!r) return;
    m.i0 = r[0]; m.i1 = r[1]; m.style = m.style || 'marker';
    // a mark never lands before its words are in (it waits for the phrase's last word)
    m.at = Math.max(m.at !== undefined ? HP.T(m.at) : (this.words[m.i1].at ?? this.it.t0) + 0.24, (this.words[m.i1].at ?? -1e9) + this.edur * 0.6);
    m.until = m.until !== undefined ? HP.T(m.until) : 1e9;
    m.key = `${this.key}|m${mi}`;
    m.segs = this.segsOf(m.i0, m.i1);
    this.it.mark(m.at, 'mark:' + m.style);
    this.marks.push(m);
  }
  // per line: [{x0, x1, y (line top), line, w0, w1}] in block coords
  segsOf(i0, i1) {
    const by = new Map();
    for (let k = i0; k <= i1; k++) { const w = this.words[k]; const s = by.get(w.line) || { x0: w.x, x1: w.x + w.width, y: w.y, line: w.line, w0: k, w1: k }; s.x0 = Math.min(s.x0, w.x); s.x1 = Math.max(s.x1, w.x + w.width); s.w1 = k; by.set(w.line, s); }
    return [...by.values()];
  }
  // bold: extra advance of each word at time t (weight interpolation; the line reflows)
  boldAt(t) {
    const out = new Float64Array(this.words.length);
    for (const m of this.marks) {
      if (m.style !== 'bold' || t < m.at - EPS || t >= m.until) continue;
      const u = E.oBack(pr(t, m.at, m.dur), 1.6), w1 = m.weight ?? 800, w0 = this.F.weight || 400;
      const wt = Math.round(lerp(w0, w1, clamp(u, 0, 1.15)) / 10) * 10;
      for (let k = m.i0; k <= m.i1; k++) {
        const w = this.words[k], F2 = { ...this.F, weight: wt };
        out[k] = HP.text.measure(w.w, F2, this.tr) - w.width;
        w._wt = wt;
      }
    }
    return out;
  }
  draw(t) {
    const it = this.it, life = it.life(t), dr = this.drift;
    // block-level motion, applied per element about the block centre (no transform on the box: keeps multiply blending)
    let S = 1, DX = 0, DY = 0;
    if (dr) { const u = E.ioSine(life); S *= 1 + dr.z * u; DX += (dr.x || 0) * u; DY += (dr.y || 0) * u; }
    if (this.pulse) for (const pt of this.pulse) { if (t < pt - EPS) break; const a = Math.exp(-(t - pt) / 0.09); if (a > 0.01) S *= 1 + 0.018 * a; }
    const al = this.d.align || 'left', CX = al === 'left' ? 0 : al === 'right' ? this.W : this.W / 2, CY = this.H / 2;   // left text never drifts left of x
    const xf = (x, y) => [CX + (x - CX) * S + DX, CY + (y - CY) * S + DY];
    const extra = this.marks.some(m => m.style === 'bold') ? this.boldAt(t) : null;
    // line reflow for bold words
    const shift = new Float64Array(this.words.length);
    if (extra) {
      const lineExtra = new Map();
      for (const w of this.words) { const e0 = lineExtra.get(w.line) || 0; shift[w.i] = e0; lineExtra.set(w.line, e0 + extra[w.i]); }
      const al = this.d.align || 'left';
      if (al !== 'left') for (const w of this.words) shift[w.i] -= (lineExtra.get(w.line) || 0) * (al === 'center' ? 0.5 : 1);
    }
    const colorAt = (w) => {
      let c = this.color;
      for (const m of this.marks) {
        if (w.i < m.i0 || w.i > m.i1 || t < m.at - EPS || t >= m.until) continue;
        if (m.style === 'color') c = m.color;
        else if ((m.style === 'marker' || m.style === 'paint') && isDark(this.it)) {   // the sweep passes the word: ink on the marker
          const seg = m.segs.find(s => s.line === w.line), si = m.segs.indexOf(seg);
          const ut = pr(t, m.at + si * m.dur * 0.6, m.dur), xs = lerp(seg.x0 - 20, seg.x1 + 20, E.oQuad(ut));
          if (xs >= w.x + w.width * 0.45) c = m.ink || INK;
        }
      }
      return c;
    };
    for (const w of this.words) {
      const e = w.el;
      if (this.mode === 'karaoke') {
        const lit = t >= w.at - EPS, u = pr(t, w.at, 0.14);
        const [cx, cy] = xf(w.x + w.ox + shift[w.i], w.y + this.lh / 2);
        const sc = (lit ? lerp(this.R.popScale ?? 1.16, 1, E.oCub(u)) : 1) * S;   // rev3 fixer: roll.popScale (opt-in, default 1.16)
        e.style.opacity = lit ? 1 : this.dim;
        e.style.transform = `translate(${(cx - w.x - w.ox).toFixed(2)}px,${(cy - w.y - this.lh / 2).toFixed(2)}px) scale(${sc.toFixed(4)})`;
        e.style.color = lit && t < w.next - EPS ? this.lit : colorAt(w);
        continue;
      }
      if (t < w.at - EPS) { e.style.opacity = 0; continue; }
      let r;
      if (this.mode === 'chars') {
        const n = clamp(Math.floor((t - this.cAt) * this.cps + EPS) - w.c0, 0, w.w.length);
        const s = w.w.slice(0, n); if (e.textContent !== s) e.textContent = s;
        r = { op: n > 0 ? 1 : 0, tx: 0, ty: 0, sc: 1, blur: 0 };
      } else if (this.mode === 'lines') r = entry(this.entryStyle === 'pop' ? 'rise' : this.entryStyle, pr(t, w.at, this.edur));
      else r = entry(this.mode === 'none' || this.mode === 'all' ? 'cut' : this.entryStyle, pr(t, w.at, this.edur));
      if (w.outAt !== undefined && t >= w.outAt - EPS) {
        const u = pr(t, w.outAt, this.outDur);
        if (this.outStyle === 'fade') r.op *= 1 - u;
        else if (this.outStyle === 'blow') { r.op *= (1 - u) * (1 - u); r.sc *= lerp(1, 1.6, E.iCub(u)); r.blur += 6 * u; }
        else { r.ty += lerp(0, 140, E.iCub(u)); r.op *= 1 - E.iCub(u); }
      }
      const [cx, cy] = xf(w.x + w.ox + shift[w.i], w.y + this.lh / 2);
      e.style.opacity = r.op.toFixed(3);
      e.style.transform = `translate(${(cx - w.x - w.ox + r.tx).toFixed(2)}px,${(cy - w.y - this.lh / 2 + r.ty).toFixed(2)}px) scale(${(r.sc * S).toFixed(4)})`;
      if (extra) e.style.fontWeight = String(extra[w.i] ? w._wt : (this.F.weight || 400));
      // blur as a text-shadow on faded glyphs, never a CSS filter: a filter promotes the span to its own layer and the text then
      // rasterises differently for the rest of the page's life (history-dependent pixels, regress.py det)
      const col = colorAt(w);
      if (r.blur > 0.05 && paint()) { e.style.color = paint().rgba(col, clamp(1 - r.blur / 3).toFixed(3)); e.style.textShadow = `0 0 ${(r.blur * 1.6).toFixed(1)}px ${col}`; }
      else { e.style.color = col; e.style.textShadow = ''; }
    }
    if (this.caret) {
      const k = Math.floor((t - this.cAt) * this.cps + EPS), typing = t >= this.cAt - EPS && t < this.cEnd + 0.45;
      const blink = Math.floor(HP.beatAt(t) * 2) % 2 === 0 || t < this.cEnd;
      let cw = null;
      for (const w of this.words) if (k >= w.c0) cw = w;
      if (cw && typing && blink) {
        const n = clamp(k - cw.c0, 0, cw.w.length), x = cw.x + HP.text.measure(cw.w.slice(0, n), this.F, this.tr) + 3;
        const [cx, cy] = xf(x, cw.y + this.lh / 2);
        Object.assign(this.caret.style, { display: 'block', left: (cx).toFixed(2) + 'px', top: (cy - this.F.size * 0.45).toFixed(2) + 'px' });
      } else this.caret.style.display = 'none';
    }
    this.drawMarks(t, S, DX, DY, shift, extra || new Float64Array(this.words.length));
  }
  drawMarks(t, S, DX, DY, shift, adv) {
    const P = paint(), M = this.M;
    for (const c of [this.under, this.over]) {
      if (!c) continue;
      c.ctx.setTransform(1, 0, 0, 1, 0, 0); c.ctx.clearRect(0, 0, c.cv.width, c.cv.height);
      c.cv.style.transform = (S !== 1 || DX || DY) ? `translate(${DX.toFixed(2)}px,${DY.toFixed(2)}px) scale(${S.toFixed(4)})` : '';
    }
    if (!P) return;
    const F = this.F, lh = this.lh, cap = F.size * 0.74;
    for (const m of this.marks) {
      if (t < m.at - EPS || t >= m.until) continue;
      const segs = m.segs.map(s => { const L = this.words[s.w1]; return { ...s, x0: s.x0 + shift[s.w0], x1: L.x + L.width + shift[s.w1] + adv[s.w1] }; });
      const yMid = s => s.y + lh * (m.yK ?? 0.56);
      if (m.style === 'marker' || m.style === 'paint') {
        const c = this.under.ctx; c.setTransform(1, 0, 0, 1, M, M);
        if (isDark(this.it)) c.globalCompositeOperation = 'source-over';
        segs.forEach((s, si) => {
          const u = pr(t, m.at + si * m.dur * 0.6, m.dur); if (u <= 0) return;
          P.highlight(c, { key: `${m.key}|${si}`, x0: s.x0, x1: s.x1, y: yMid(s), h: (m.h ?? (m.style === 'paint' ? 1.25 : 1.02)) * cap, angle: m.angle ?? -1.2, color: m.color, alpha: m.alpha ?? (isDark(this.it) ? 0.95 : 0.85),
            over: m.over ?? 16, blend: isDark(this.it) ? 'source-over' : 'multiply' }, E.oQuad(u));
        });
        continue;
      }
      if (m.style === 'bold' || m.style === 'color') continue;
      const c = this.over.ctx; c.setTransform(1, 0, 0, 1, M, M);
      const p = E.ioQuad(pr(t, m.at, m.dur)), shapes = [];
      const x0 = Math.min(...segs.map(s => s.x0)), x1 = Math.max(...segs.map(s => s.x1)), y0 = Math.min(...segs.map(s => s.y)), y1 = Math.max(...segs.map(s => s.y)) + lh;
      switch (m.style) {
        case 'underline': segs.forEach((s, si) => shapes.push({ kind: 'underline', x0: s.x0 - 6, x1: s.x1 + 10, y: s.y + lh * (m.yK ?? 0.93), sag: 7, p: clamp(p * segs.length - si) })); break;
        case 'strike': segs.forEach((s, si) => shapes.push({ kind: 'line', x0: s.x0 - 10, y0: yMid(s) + 4, x1: s.x1 + 10, y1: yMid(s) - 6, p: clamp(p * segs.length - si) })); break;
        case 'circle': shapes.push({ kind: 'ellipse', cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 + lh * 0.04, w: (x1 - x0) * 1.12 + 50, h: (y1 - y0) * 1.25 + 26, p }); break;
        case 'box': shapes.push({ kind: 'rect', x: x0 - 16, y: y0 + lh * 0.04, w: x1 - x0 + 32, h: y1 - y0, p }); break;
        case 'scribble': segs.forEach((s, si) => shapes.push({ kind: 'scribble', cx: (s.x0 + s.x1) / 2, cy: yMid(s), w: s.x1 - s.x0, h: cap * 0.7, n: Math.max(5, Math.round((s.x1 - s.x0) / 26)), key: m.key + si, p: clamp(p * segs.length - si) })); break;
        case 'arrow': { const fx = m.from || [-150, 130], s = segs[0]; shapes.push({ kind: 'arrow', x0: s.x0 + fx[0], y0: s.y + lh + fx[1], x1: s.x0 - 8, y1: s.y + lh * 0.8, head: 30, p }); break; }
      }
      P.pencil(c, shapes, { key: m.key, t, color: m.color, width: m.width ?? 6, alpha: m.alpha ?? 0.95 });
    }
  }
  texts() { return [{ text: this.text, reveal: this.mode === 'none' || this.mode === 'all' ? (this.marks.length ? 'highlight' : 'none') : this.mode, role: 'main' }]; }
}

// ============================================================ DomRun: roll-out + marks on existing DOM text (legacy types)
// root: element whose text nodes are split into word spans (inline-block), or toks: [{el}] already one span per word
class DomRun {
  constructor(it, o) {
    this.it = it; this.key = o.key || it.id; this.root = o.root; this.hostEl = o.host || null;
    this.marksOnly = !!o.marksOnly;   // polisher: draw only the marks; the host type reveals its own words (e.g. a clip caption's sweep)
    this.words = o.toks ? o.toks.map(tk => ({ el: tk.el, w: tk.el.textContent.trim(), lt: tk.lt })) : DomRun.split(o.root);
    if (!this.marksOnly) for (const w of this.words) { w.el.style.display = 'inline-block'; w.el.style.transformOrigin = '50% 60%'; }
    this.words.forEach((w, i) => { w.i = i; });
    const R = this.R = { ...(o.roll || {}) };
    this.mode = R.mode || 'words'; this.entryStyle = R.entry || 'pop'; this.edur = R.dur ?? ENTRY_DUR[this.entryStyle] ?? 0.16;
    const t0 = o.t0 ?? it.t0;
    if (this.mode === 'none') { this.entryStyle = 'cut'; this.words.forEach(w => { w.at = t0; }); }
    else if (o.times) this.words.forEach((w, k) => { w.at = o.times[k]; });
    else if (this.mode === 'karaoke' || o.toks && this.words.every(w => w.lt !== undefined) && !R.rate && !R.on && !R.at && !R.per) this.words.forEach(w => { w.at = it.t0 + (w.lt ?? 0); });
    else { const ts = wordTimes(this.words.length, R, t0, this.key); this.words.forEach((w, k) => { w.at = ts[k]; }); }
    if (this.mode === 'karaoke') { this.dim = R.dim ?? 0.3; this.lit = R.lit || (isDark(it) ? COL.yellow : COL.red); this.words.forEach((w, k) => { w.next = this.words[k + 1] ? this.words[k + 1].at : w.at + 0.5; }); }
    for (const w of this.words) it.mark(w.at, 'word');
    // chip highlights (legacy .hl spans): shown once their first word is in
    this.chips = [];
    for (const w of this.words) { const h = w.el.parentElement && w.el.parentElement.closest('.hl'); if (h && o.root && o.root.contains(h)) { let c = this.chips.find(x => x.el === h); if (!c) this.chips.push(c = { el: h, at: w.at, words: [] }); c.at = Math.min(c.at, w.at); c.words.push(w); } }
    this.noWipe = it.d.hlAt === undefined;   // legacy "hlAt" chips are wiped on by the legacy draw: leave those alone
    this.marks = (o.marks || []).map((m0, mi) => {
      const m = { ...markDefaults(it, m0), ...m0 }, r = resolvePhrase(this.words.map(w => w.w), m, this.key);
      if (!r) return null;
      m.i0 = r[0]; m.i1 = r[1]; m.style = m.style || 'marker'; m.key = `${this.key}|dm${mi}`;
      m.at = this.marksOnly && m.at !== undefined ? HP.T(m.at) : Math.max(m.at !== undefined ? HP.T(m.at) : this.words[m.i1].at + 0.24, this.words[m.i1].at + this.edur * 0.6); m.until = m.until !== undefined ? HP.T(m.until) : 1e9;
      it.mark(m.at, 'mark:' + m.style);
      return m;
    }).filter(Boolean);
    this.end = Math.max(...this.words.map(w => w.at), it.t0) + this.edur;
    this.text = this.words.map(w => w.w).join(' ');
  }
  static split(root) {
    const out = [], nodes = [];
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) if (n.data.trim()) nodes.push(n);
    for (const n of nodes) {
      const frag = document.createDocumentFragment();
      for (const part of n.data.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); continue; }
        const s = document.createElement('span'); s.className = 'rw'; s.textContent = part; frag.appendChild(s); out.push({ el: s, w: part });
      }
      n.parentNode.replaceChild(frag, n);
    }
    return out;
  }
  // after layout (displayed, untransformed): word rects relative to the canvas host; canvases for marks
  measure() {
    for (const w of this.words) w.col0 = getComputedStyle(w.el).color;
    // a filled chip (red .hl background) spanning several words: paint it per word, so it grows with the roll-out instead of
    // showing an empty red box where the next words will land
    if (this.noWipe) for (const c of this.chips) {
      const bg = getComputedStyle(c.el).backgroundColor;
      if (!bg || bg === 'transparent' || /rgba\(.*,\s*0\)$/.test(bg) || c.words.length < 2) continue;
      c.perWord = bg; c.el.style.background = 'transparent'; c.el.style.boxShadow = 'none';
      c.words.forEach((w, k) => { w.chipBg = bg; w.chipNext = c.words[k + 1] || null; });
    }
    if (!this.marks.length) return;
    const host = this.host = this.hostEl || this.root || this.words[0].el.parentElement;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.style.isolation = 'isolate';
    const hr = host.getBoundingClientRect(), M = this.M = 110;
    for (const w of this.words) { const r = w.el.getBoundingClientRect(); w.x = r.left - hr.left; w.y = r.top - hr.top; w.width = r.width; w.h = r.height; }
    const mk = (first) => { const c = el('canvas', '', null, { position: 'absolute', left: -M + 'px', top: -M + 'px', width: (hr.width + 2 * M) + 'px', height: (hr.height + 2 * M) + 'px', pointerEvents: 'none', zIndex: first ? -1 : 2 });
      c.width = Math.ceil(hr.width + 2 * M); c.height = Math.ceil(hr.height + 2 * M); first ? host.insertBefore(c, host.firstChild) : host.appendChild(c); return { cv: c, ctx: c.getContext('2d') }; };
    if (this.marks.some(m => m.style === 'marker' || m.style === 'paint')) { this.under = mk(true); if (!isDark(this.it)) this.under.cv.style.mixBlendMode = 'multiply'; }
    if (this.marks.some(m => !['marker', 'paint', 'bold', 'color'].includes(m.style))) this.over = mk(false);
    for (const m of this.marks) {
      const by = new Map();
      for (let k = m.i0; k <= m.i1; k++) { const w = this.words[k], key = Math.round(w.y / 4); const s = by.get(key) || { x0: w.x, x1: w.x + w.width, y: w.y, h: w.h }; s.x0 = Math.min(s.x0, w.x); s.x1 = Math.max(s.x1, w.x + w.width); s.h = Math.max(s.h, w.h); by.set(key, s); }
      m.segs = [...by.values()];
      m.fs = parseFloat(getComputedStyle(this.words[m.i0].el).fontSize) || 60;
    }
  }
  draw(t) {
    for (const w of (this.marksOnly ? [] : this.words)) {
      const e = w.el;
      if (this.mode === 'karaoke') {
        const lit = t >= w.at - EPS, u = pr(t, w.at, 0.14);
        e.style.opacity = lit ? 1 : this.dim;
        e.style.transform = lit && u < 1 ? `scale(${lerp(1.14, 1, E.oCub(u)).toFixed(4)})` : '';
        const onChip = w.chipBg || e.classList.contains('hl') || (e.parentElement && e.parentElement.closest('.hl'));
        e.style.color = lit && t < w.next - EPS && !onChip ? this.lit : '';   // words on a red chip keep their own colour
        continue;
      }
      if (t < w.at - EPS) { e.style.opacity = 0; continue; }
      const r = entry(this.entryStyle, pr(t, w.at, this.edur));
      e.style.opacity = r.op.toFixed(3);
      e.style.transform = (r.tx || r.ty || r.sc !== 1) ? `translate(${r.tx.toFixed(2)}px,${r.ty.toFixed(2)}px) scale(${r.sc.toFixed(4)})` : '';
      if (r.blur > 0.05 && w.col0) { e.style.color = 'transparent'; e.style.textShadow = `0 0 ${(r.blur * 1.6).toFixed(1)}px ${w.col0}`; }   // no CSS filter (see Run)
      else if (w.col0 && e.style.color === 'transparent') { e.style.color = ''; e.style.textShadow = ''; }
    }
    for (const c of (this.marksOnly ? [] : this.chips)) {
      if (!c.perWord) { c.el.style.opacity = t >= c.at - EPS ? 1 : 0; continue; }
      for (const w of c.words) {
        const on = t >= w.at - EPS || this.mode === 'karaoke', nx = w.chipNext && (t >= w.chipNext.at - EPS || this.mode === 'karaoke');
        w.el.style.background = on ? w.chipBg : 'transparent';
        w.el.style.boxShadow = on && nx ? `0.3em 0 0 ${w.chipBg}` : 'none';   // bridges the space to the next word once it is in
      }
    }
    // DOM marks: bold = text-stroke thickening + a kick (no reflow); color
    for (const m of this.marks) {
      if (m.style !== 'bold' && m.style !== 'color') continue;
      const on = t >= m.at - EPS && t < m.until, u = pr(t, m.at, m.dur);
      for (let k = m.i0; k <= m.i1; k++) {
        const e = this.words[k].el;
        if (m.style === 'color') { e.style.color = on ? m.color : ''; continue; }
        e.style.webkitTextStroke = on ? `${(0.032 * clamp(E.oBack(u, 1.6), 0, 1.2)).toFixed(4)}em currentColor` : '';
        if (on && u < 1 && this.mode !== 'karaoke') e.style.transform = `scale(${lerp(1.12, 1, E.oCub(u)).toFixed(4)})`;
      }
    }
    const P = paint(); if (!P || !this.host) return;
    for (const c of [this.under, this.over]) if (c) { c.ctx.setTransform(1, 0, 0, 1, 0, 0); c.ctx.clearRect(0, 0, c.cv.width, c.cv.height); }
    const M = this.M;
    for (const m of this.marks) {
      if (t < m.at - EPS || t >= m.until || !m.segs) continue;
      const cap = m.fs * 0.74;
      if (m.style === 'marker' || m.style === 'paint') {
        const c = this.under.ctx; c.setTransform(1, 0, 0, 1, M, M);
        m.segs.forEach((s, si) => { const u = pr(t, m.at + si * m.dur * 0.6, m.dur); if (u > 0) P.highlight(c, { key: `${m.key}|${si}`, x0: s.x0, x1: s.x1, y: s.y + s.h * 0.55, h: (m.style === 'paint' ? 1.25 : 1.02) * cap, angle: -1.2, color: m.color, alpha: isDark(this.it) ? 0.95 : 0.85, over: 14, blend: 'source-over' }, E.oQuad(u)); });
        if (isDark(this.it)) for (let k = m.i0; k <= m.i1; k++) { const w = this.words[k], si = m.segs.findIndex(s => Math.abs(s.y - w.y) < 6); const s = m.segs[si] || m.segs[0]; const u = pr(t, m.at + Math.max(0, si) * m.dur * 0.6, m.dur); if (lerp(s.x0 - 20, s.x1 + 20, E.oQuad(u)) >= w.x + w.width * 0.45) w.el.style.color = m.ink || INK; }
        continue;
      }
      if (m.style === 'bold' || m.style === 'color') continue;
      const c = this.over.ctx; c.setTransform(1, 0, 0, 1, M, M);
      const p = E.ioQuad(pr(t, m.at, m.dur)), S = m.segs, sh = [];
      const x0 = Math.min(...S.map(s => s.x0)), x1 = Math.max(...S.map(s => s.x1)), y0 = Math.min(...S.map(s => s.y)), y1 = Math.max(...S.map(s => s.y + s.h));
      if (m.style === 'underline') S.forEach((s, si) => sh.push({ kind: 'underline', x0: s.x0 - 6, x1: s.x1 + 10, y: s.y + s.h * 0.92, sag: 7, p: clamp(p * S.length - si) }));
      else if (m.style === 'strike') S.forEach((s, si) => sh.push({ kind: 'line', x0: s.x0 - 10, y0: s.y + s.h * 0.58, x1: s.x1 + 10, y1: s.y + s.h * 0.5, p: clamp(p * S.length - si) }));
      else if (m.style === 'circle') sh.push({ kind: 'ellipse', cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: (x1 - x0) * 1.12 + 50, h: (y1 - y0) * 1.2 + 24, p });
      else if (m.style === 'box') sh.push({ kind: 'rect', x: x0 - 14, y: y0, w: x1 - x0 + 28, h: y1 - y0, p });
      else if (m.style === 'arrow') { const fx = m.from || [-150, 130]; sh.push({ kind: 'arrow', x0: S[0].x0 + fx[0], y0: S[0].y + S[0].h + fx[1], x1: S[0].x0 - 8, y1: S[0].y + S[0].h * 0.8, head: 30, p }); }
      else if (m.style === 'scribble') S.forEach((s, si) => sh.push({ kind: 'scribble', cx: (s.x0 + s.x1) / 2, cy: s.y + s.h * 0.55, w: s.x1 - s.x0, h: cap * 0.7, key: m.key + si, p: clamp(p * S.length - si) }));
      P.pencil(c, sh, { key: m.key, t, color: m.color, width: m.width ?? 6, alpha: 0.95 });
    }
  }
}

HP.lib.text = { Run, DomRun, TypeRun, wrapFor, wordTimes, entry, resolvePhrase, fmtDate, chip, chipBitmap, typed, ENTRY_DUR };

// ============================================================ items
// words: a free text block. Fields: text, x, y, w, font {family, weight, size, style}, color, align, lh, lhK, upper, tracking,
// balance, roll, marks; the stub's at / on / per / hl / hlAt / hlColor still work.
HP.register('words', {
  build(it) {
    const d = it.d, R = typeof d.roll === 'string' ? { mode: d.roll } : { ...(d.roll || {}) };
    if (d.at && !R.at) R.at = d.at; if (d.on && !R.on) R.on = d.on; if (d.per !== undefined && R.per === undefined) R.per = d.per;
    it.run = new Run(it, { ...d, roll: R });
  },
  draw(it, t) { it.run.draw(t); },
  texts(it) { return it.run.texts(); },
});

// quoteroll: {text (verbatim, "…" at cuts), name, year, role, source, x (60), y | cy (900), w (900), font, color, roll, marks,
// metaAt (time: name/year/source type on; default right after the last word), rule (true)}
HP.register('quoteroll', {
  build(it) {
    const d = it.d, dark = isDark(it);
    const F = fontObj(d.font, { family: "'Newsreader', serif", weight: 400, style: 'italic', size: 70 });
    const w = d.w ?? 900, x = d.x ?? 60, lh = d.lh ?? F.size * 1.1;
    const wrap = wrapFor(d, F, w, lh);
    const metaH = (d.name || d.year ? 70 : 0) + (d.source ? 56 : 0), ruleH = d.rule === false ? 0 : 36;
    const y = d.y ?? Math.round((d.cy ?? 900) - (wrap.height + metaH + ruleH) / 2);
    if (d.rule !== false) it.rule = el('div', '', it.el, { position: 'absolute', left: x + 'px', top: y + 'px', width: '72px', height: '8px', background: d.ruleColor || COL.red, transformOrigin: '0 50%' });
    it.run = new Run(it, { ...d, font: F, x, y: y + ruleH, w, lh, roll: typeof d.roll === 'string' ? { mode: d.roll } : d.roll }, { key: it.id });
    const my = y + ruleH + wrap.height + 26;
    it.meta = el('div', '', it.el, { position: 'absolute', left: x + 'px', top: my + 'px', width: w + 'px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 16px',
      font: "600 38px/1.15 'IBM Plex Mono', monospace", letterSpacing: '0.05em', textTransform: 'uppercase', color: dark ? ONDARK : INK });
    if (d.year) el('span', '', it.meta, { background: COL.red, color: '#fff', fontWeight: 700, padding: '7px 11px 6px' }).textContent = d.year;
    if (d.name) el('span', '', it.meta).textContent = d.name;
    if (d.role) el('span', '', it.meta, { fontWeight: 500, color: dark ? '#9A96A8' : '#4F4A5C' }).textContent = d.role;
    if (d.source) { it.src = el('div', '', it.el, { position: 'absolute', left: x + 'px', top: (my + 64) + 'px', width: w + 'px', font: "500 34px/1.3 'IBM Plex Mono', monospace", letterSpacing: '0.04em', textTransform: 'uppercase', color: dark ? '#9A96A8' : '#4F4A5C' }); it.src.textContent = d.source; }
    const metaAt = d.metaAt !== undefined ? HP.T(d.metaAt) : it.run.end + 0.05;
    it.typer = new TypeRun([it.meta, it.src], metaAt, { cps: d.cps ?? 40 });
    it.mark(metaAt, 'meta');
  },
  draw(it, t) {
    if (it.rule) it.rule.style.transform = `scaleX(${E.oCub(pr(t, it.t0, 0.2)).toFixed(4)})`;
    it.run.draw(t); it.typer.draw(t);
  },
  texts(it) { const r = it.run.texts(); if (it.d.name) r.push({ text: [it.d.year, it.d.name, it.d.role].filter(Boolean).join(' '), reveal: 'chars', role: 'meta' }); if (it.d.source) r.push({ text: it.d.source, reveal: 'chars', role: 'meta' }); return r; },
});

// karaoke: a speech caption. words: [{w, at}] (edit time refs) | speech: {words: [{w, s}] (source s), in (source s at "at"), at
// (edit time of the clip's in-point)} | text + roll. Layout like the legacy caption: red rule, mono caps (style.serif: italic serif),
// x (60), y (top of the rule; default under LAYOUT.clipBox), w (900), size (54). name/year: a stamp line typed on after.
HP.register('karaoke', {
  build(it) {
    const d = it.d, dark = isDark(it), box = { ...(HP.LAYOUT.clipBox || { x: 0, y: 330, w: 1080, h: 940 }), ...(d.box || {}) };
    let toks = d.words;
    if (!toks && d.speech) { const S = d.speech, at = HP.T(S.at, it.t0) - (d.lead ?? 0); toks = S.words.map(w => ({ w: w.w, at: at + (w.s - S.in) })); }   // fixer r1: lead (s) lights each word a little ahead of the audio
    const text = toks ? toks.map(w => String(w.w).trim()).join(' ') : d.text;
    const serif = d.style && d.style.serif;
    const F = fontObj(d.font, serif ? { family: "'Newsreader', serif", style: 'italic', weight: 400, size: d.size ?? 62 } : { family: "'IBM Plex Mono', monospace", weight: 600, size: d.size ?? 54 });
    const x = d.x ?? 60, y = d.y ?? (box.y + box.h + 40), w = d.w ?? 900;
    // fixer r1: plate {color, pad}: a dark plate behind the caption block (legible over 3D slabs and paint splats)
    if (d.plate) { const Pl = typeof d.plate === 'string' ? { color: d.plate } : d.plate; it.plate = el('div', '', it.el, { position: 'absolute', left: (x - (Pl.pad ?? 20)) + 'px', top: (y - (Pl.pad ?? 20)) + 'px', width: (w + 2 * (Pl.pad ?? 20)) + 'px', height: '10px', background: Pl.color || 'rgba(14,13,18,0.86)', transformOrigin: '0 0' }); }
    it.rule = el('div', '', it.el, { position: 'absolute', left: x + 'px', top: y + 'px', width: '72px', height: '8px', background: COL.red, transformOrigin: '0 50%' });
    const R = typeof d.roll === 'string' ? { mode: d.roll } : { mode: 'karaoke', ...(d.roll || {}) };
    it.run = new Run(it, { ...d, text, font: F, x, y: y + 30, w, upper: !serif, tracking: serif ? 0 : 1, wordsAt: toks ? toks.map(q => HP.T(q.at)) : undefined, roll: R }, { key: it.id });
    if (d.name || d.year) {
      it.meta = el('div', '', it.el, { position: 'absolute', left: x + 'px', top: (y + 30 + it.run.H + (d.metaGap ?? 22)) + 'px', font: `600 ${d.metaPx ?? 38}px/1.15 'IBM Plex Mono', monospace`, letterSpacing: '0.05em', textTransform: 'uppercase', color: dark ? '#9A96A8' : '#4F4A5C', whiteSpace: 'nowrap' });
      it.meta.textContent = [d.name, d.year].filter(Boolean).join(' · ');
      if (d.metaWrap) Object.assign(it.meta.style, { whiteSpace: 'normal', width: w + 'px' });   // fixer r1: the attribution wraps in the caption's column
      it.typer = new TypeRun([it.meta], HP.T(d.metaAt, it.t0 + 0.05), { cps: d.metaCps ?? 40 });
    }
    if (it.plate) { const Pl = typeof d.plate === 'string' ? {} : d.plate, pad = Pl.pad ?? 20, mp = d.metaPx ?? 38, metaW0 = it.meta ? it.meta.textContent.length * mp * 0.65 : 0, metaW = d.metaWrap ? Math.min(w, metaW0) : metaW0, metaH = it.meta ? (d.metaGap ?? 22) + mp * 1.15 * (d.metaWrap ? Math.ceil(metaW0 / w) : 1) : 0; it.plate.style.height = (30 + it.run.H + metaH + 2 * pad) + 'px'; it.plate.style.width = (Math.max(w, metaW) + 2 * pad) + 'px'; }
  },
  draw(it, t) { if (it.plate) { const u = E.oCub(pr(t, it.t0, 0.14)); it.plate.style.transform = `scaleY(${u.toFixed(4)})`; } it.rule.style.transform = `scaleX(${E.oCub(pr(t, it.t0, 0.2)).toFixed(4)})`; it.run.draw(t); if (it.typer) it.typer.draw(t); },
  texts(it) { const r = it.run.texts(); if (it.meta) r.push({ text: it.meta.textContent, reveal: 'chars', role: 'meta' }); return r; },
});

// ============================================================ the legacy text types, rolled out (opt-in)
// EDL "rollout": {mode, rate, entry, types: [...], meta: true (type the attribution lines on)} sets the defaults; item "roll":
// false | "words" | {...} and "marks": [...] per item. Applied after the items are built (hook "built").
const RETRO = ['headline', 'quote', 'pullquote', 'caption', 'ticker', 'stamp', 'image', 'shape', 'clip'];
function retro(it, G) {
  const d = it.d, R0 = { ...(G || { mode: d.roll ? 'words' : 'none', rate: 2, entry: 'pop' }), ...(d.roll && typeof d.roll === 'object' ? d.roll : typeof d.roll === 'string' ? { mode: d.roll } : {}) };
  const on = d.roll !== false && (G || d.roll || d.marks);
  if (!on) return;
  const runs = [], types = [], key = it.id, T0 = HP.T(R0.from, it.t0 + (d.textDelay ?? 0));
  if (R0.fit === undefined) R0.fit = Math.max(0.5, (it.t1 - T0) * (R0.fitK ?? 0.4));   // the words are all in by 40% of the item's life
  const add = (o) => { const r = new DomRun(it, { key: key + '|' + runs.length, roll: R0, marks: runs.length ? [] : d.marks, ...o }); runs.push(r); return r; };
  const meta = (els, at) => { els = els.filter(Boolean); if (els.length && R0.meta !== false) types.push(new TypeRun(els, at, { cps: R0.cps ?? 40 })); };
  const $$ = s => Array.from(it.el.querySelectorAll(s));
  switch (it.type) {
    case 'headline': { const r = add({ root: it.ht, t0: T0 }); meta([it.blk.querySelector('.ha')], it.t0 + 0.06); break; }
    case 'ticker': { add({ root: it.tt, t0: T0 }); meta([it.lab], it.t0 + 0.06); break; }
    case 'pullquote': { if (it.q) { const r = add({ root: it.q, t0: T0 }); meta($$('.pq .pa, .pq .ps'), r.end + 0.04); } meta($$('.stamp .nm, .stamp .rl'), it.t0); break; }
    case 'quote': {
      if (it.toks && it.toks.length) {
        const parts = d.parts || [{ text: d.text, at: d.t0 }]; let k = 0; const times = [];
        for (const p of parts) { const n = HP.text.words(p.text).length; const ts = wordTimes(n, R0, HP.T(p.at, it.t0), key); times.push(...ts); k += n; }
        const r = add({ toks: it.toks, host: it.cap, times: R0.mode === 'none' ? null : times.slice(0, it.toks.length) }); meta([it.srcEl], r.end + 0.04);
      }
      meta($$('.stamp .nm, .stamp .rl'), it.t0); break;
    }
    case 'caption': { if (it.toks && it.toks.length) add({ toks: it.toks, host: it.cap, roll: { ...R0, mode: R0.mode === 'none' ? 'none' : 'karaoke', ...(d.roll && typeof d.roll === 'object' ? d.roll : {}) } }); meta([it.srcEl], it.t0 + 0.1); break; }
    case 'stamp': meta($$('.stamp .nm, .stamp .rl'), it.t0); break;
    case 'clip': {   // integrator: a clip's r7 "sub" line (the words NOT heard) rolls out on 16ths once the last heard word is in
      // polisher: caption "marks" (pencil underline / circle / marker on the spoken words, at their own times; the caption's own
      // reveal still lights the words); sub "roll" ({rate: 8} = 32nds) and "marks" (e.g. a marker on the baseline's number)
      if (d.caption && d.caption.marks && it.toks && it.toks.length) add({ toks: it.toks, host: it.cap, marksOnly: true, roll: { mode: 'karaoke' }, marks: d.caption.marks });
      if (it.subEl) {
        const W = (d.caption && d.caption.words) || [], last = W.length ? W[W.length - 1] : null;
        const tl = last ? (last.s !== undefined ? (last.s - (d.in || 0)) / (d.speed || 1) : (last.t ?? 0)) : 0;
        add({ root: it.subEl, t0: it.t0 + tl + 0.12, roll: { ...R0, rate: 4, fit: undefined, ...((d.sub && d.sub.roll) || {}) }, marks: (d.sub && d.sub.marks) || [] });
      }
      break;
    }
    case 'image': case 'shape': meta($$('.fsrc, .lab, .pa, .ps'), it.t0 + 0.12); break;
  }
  if (!runs.length && !types.length) return;
  it._rollRuns = runs; it._rollTypes = types;
  // polisher: when each rolled-out text and each mark is complete (coverage.py "payoff": a clip's sub line, a caption's marks...)
  const pay0 = it.payoffs ? it.payoffs.bind(it) : () => [];
  it.payoffs = () => [...pay0(), ...runs.flatMap(r => [...(r.marksOnly ? [] : [{ what: `${it.type} roll "${r.text.slice(0, 48)}"`, at: r.end }]),
    ...r.marks.map(m => ({ what: `${m.style} mark on "${r.words.slice(m.i0, m.i1 + 1).map(w => w.w).join(' ').slice(0, 40)}"`, at: m.at + (m.dur || 0) }))])];
  const draw0 = it.draw.bind(it), layout0 = it.layout.bind(it), texts0 = it.texts.bind(it);
  it.layout = function () { layout0(); for (const r of runs) r.measure(); };
  it.draw = function (t, lt) { draw0(t, lt); for (const r of runs) r.draw(t); for (const y of types) y.draw(t); };
  // the legacy declarations, with the reveal each text now has (main texts rolled out, meta lines typed on)
  const norm = x => String(x || '').replace(/\s+/g, ' ').trim().toLowerCase();
  it.texts = function () {
    const out = texts0().map(x => {
      const r = runs.find(r => norm(r.text) === norm(x.text));
      if (r) return { ...x, reveal: r.mode === 'none' ? (r.marks.length ? 'highlight' : 'none') : r.mode === 'karaoke' ? 'karaoke' : 'words' };
      return x.role === 'meta' && types.length ? { ...x, reveal: 'chars' } : x;
    });
    for (const r of runs) if (!out.some(x => norm(x.text) === norm(r.text))) out.push({ text: r.text, reveal: r.mode === 'none' ? 'none' : r.mode === 'karaoke' ? 'karaoke' : 'words', role: 'main' });
    return out;
  };
}
HP.on('built', () => {
  // on by default in rev2 EDLs (a beat track, fx events or "rev": 2); "rollout": false turns it off, an object sets the defaults
  const E0 = HP.EDL || {}, rev2 = (E0.rev ?? 0) >= 2 || !!(E0.beatfx && E0.beatfx.length) || !!(E0.fx && E0.fx.length);
  const on = E0.rollout === false ? false : (E0.rollout !== undefined || rev2);
  const G = on ? { mode: 'words', rate: 2, entry: 'pop', ...(typeof E0.rollout === 'object' ? E0.rollout : {}) } : null;
  for (const it of HP.ITEMS) {
    if (!RETRO.includes(it.type)) continue;
    const useG = G && (!G.types || G.types.includes(it.type));
    if (!useG && !it.d.roll && !it.d.marks) continue;
    retro(it, useG ? G : null);
  }
});
})();
