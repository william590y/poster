/* fx/charts.js  [BUILDER B]  animated hand-drawn graphs, drawn on the beat (+ the shared builder-B kit)
 * =================================================================================================================
 * BUILD.md REVISION 2: "animated graphs drawn on the beat, e.g. data-centre build-outs ('a really good one')"; style.md 4.2
 * (pencil-in, boil on twos), 4.6 (rough.js charts). Data comes from research/rev2/graphs.json (cited) by id, or inline.
 *
 * ITEM chart (documented in edl/README.md, "Builder B"):
 *   graph: "<id>" in research/rev2/graphs.json (fallback research/rev2/graphs.stand-in.json) and/or inline fields
 *   (inline wins): kind line | bar | step | scatter, series [{name, color, points [[x, y] | {x, y, label}]}] or data
 *   [{label, value}], title, source, unit; plot box x, y, w, h; xAxis / yAxis {min, max, log, ticks, label, fmt};
 *   grow (beats spec: one data step per beat), axesAt, titleAt, sourceAt; annotate [{at, i, text, dx, dy}];
 *   counter {x, y, size, fmt}; ground cream | dark | none (+ card {...}); prep "image" + src + frame + zoom + imgCaption
 *   (a photo / satellite view behind or beside the graph: cache/<id>/image.jpg); labels / labelText; splats; rings; drift.
 *   Full field list: edl/README.md "Builder B".
 * KIT (HP.lib.charts.kit, used by equations.js and netviz.js too): times(spec, n, t0, per), roll(it, opts) (word-by-word
 *   text roll-out), pencil options, drawOn(opts, len, p), ellipseLen, marker(ctx, ...), arrow(rc, ...), splat(ctx, spec, lt),
 *   box(it, x, y, w, h) (a tight canvas), fmt(v, f), seed(...).
 * RULES: t-pure (everything a function of t and the EDL); randomness from HP.hash(item id, element, HP.boil(t) % 3);
 *   facts (numbers, labels, the source line) are DOM text, never painted over; data only from cited files.
 */
(function () {
'use strict';
const { clamp, lerp, pr, el } = HP.u, E = HP.ease;
const BEAT = 0.4839, EIGHTH = BEAT / 2;

// ============================================================ the builder-B kit (HP.lib.charts.kit)
const K = {};
K.seed = (...k) => (HP.hash(...k) % 2147483646) + 1;
// event times for n things: [refs] | beats spec ("hb:a..b" or {from, to, every, where, skip}) | {at, per} | one ref (start; per
// spacing) | undefined (t0 + k * per). Short lists are extended with their last spacing.
K.times = (spec, n, t0, per = EIGHTH) => {
  let ts;
  const isBeats = s => (typeof s === 'string' && /^hb:-?[\d.]+\.\.-?[\d.]+$/.test(s)) || (s && typeof s === 'object' && !Array.isArray(s) && s.from !== undefined);
  if (Array.isArray(spec)) ts = spec.map(x => HP.T(x));
  else if (isBeats(spec)) ts = HP.fxTimes({ on: spec }).times;
  else if (spec && typeof spec === 'object' && spec.at !== undefined) { const a = HP.T(spec.at), p = spec.per ?? per; ts = Array.from({ length: n }, (_, k) => a + k * p); }
  else if (spec !== undefined && spec !== null) { const a = HP.T(spec); ts = Array.from({ length: n }, (_, k) => a + k * per); }
  else ts = Array.from({ length: n }, (_, k) => t0 + k * per);
  while (ts.length < n) { const L = ts.length; ts.push(L === 0 ? t0 : L === 1 ? ts[0] + per : ts[L - 1] + (ts[L - 1] - ts[L - 2])); }
  return ts.slice(0, n);
};
// pencil (style.md 4.2): rough options; colour by ground
K.pencil = (ink, w = 5) => ({ stroke: ink, strokeWidth: w, roughness: 1.1, bowing: 0.9, maxRandomnessOffset: 2.2, curveFitting: 0.95 });
// reveal the first fraction p of every rough stroke pass (len ~ 1.1 x the path length)
K.drawOn = (o, len, p) => p >= 1 ? o : { ...o, strokeLineDash: [Math.max(0.01, len * p), len * 3 + 9999], strokeLineDashOffset: 0 };
K.ellipseLen = (rx, ry) => Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
K.polyLen = P => { let s = 0; for (let i = 1; i < P.length; i++) s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return s; };
// the first fraction u of a polyline (by length)
K.polyCut = (P, u) => {
  if (u >= 1 || P.length < 2) return P.slice(); if (u <= 0) return [P[0], P[0]];
  const L = K.polyLen(P) * u, out = [P[0]]; let s = 0;
  for (let i = 1; i < P.length; i++) {
    const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    if (s + d >= L) { const f = d > 0 ? (L - s) / d : 0; out.push([lerp(P[i - 1][0], P[i][0], f), lerp(P[i - 1][1], P[i][1], f)]); return out; }
    s += d; out.push(P[i]);
  }
  return out;
};
// a marker (highlighter) sweep: one perfect-freehand pass L->R, multiply, alpha .85 (style.md 4.1), the first fraction p
K.marker = (ctx, x0, y, x1, h, p, color = HP.COL.yellow, key = 'mk') => {
  if (p <= 0) return;
  const n = 24, pts = [], r = HP.rng(key);
  for (let k = 0; k <= n; k++) { const f = k / n; pts.push([lerp(x0, x1, f), y + (r() - 0.5) * h * 0.08 + Math.sin(f * 3.1) * h * 0.04, k === 0 ? 0.8 : k === n ? 0.7 : 1]); }
  const cut = pts.slice(0, Math.max(2, Math.ceil((n + 1) * clamp(p))));
  const out = HP.lib.freehand.getStroke(cut, { size: h, thinning: 0.15, smoothing: 0.5, streamline: 0.3, simulatePressure: false, last: p >= 1, start: { cap: false }, end: { cap: false } });
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.85; ctx.fillStyle = color; ctx.fill(HP.lib.freehand.path2d(out)); ctx.restore();
};
// a pencil arrow from (x0, y0) to (x1, y1) with a bow, drawn on to fraction p; head appears at the end
K.arrow = (rc, x0, y0, x1, y1, p, o, bow = 0.18) => {
  if (p <= 0) return;
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0;
  const cx = mx - dy * bow, cy = my + dx * bow, P = [];
  for (let k = 0; k <= 16; k++) { const f = k / 16; P.push([(1 - f) * (1 - f) * x0 + 2 * (1 - f) * f * cx + f * f * x1, (1 - f) * (1 - f) * y0 + 2 * (1 - f) * f * cy + f * f * y1]); }
  const cut = K.polyCut(P, E.oCub(clamp(p / 0.8)));
  if (cut.length >= 2) rc.curve(cut, o);
  if (p > 0.8) {
    const q = clamp((p - 0.8) / 0.2), a = Math.atan2(y1 - P[14][1], x1 - P[14][0]), L = 30 * q;
    rc.linearPath([[x1 - L * Math.cos(a - 0.45), y1 - L * Math.sin(a - 0.45)], [x1, y1], [x1 - L * Math.cos(a + 0.45), y1 - L * Math.sin(a + 0.45)]], o);
  }
};
// paint splat: builder A's HP.lib.paint.splat(ctx, {x, y, r, color, seed}, lt) (style.md 4.3); keep it behind facts
K.splat = (ctx, s, lt) => { if (HP.lib.paint && HP.lib.paint.splat && lt >= 0) HP.lib.paint.splat(ctx, s, lt); };
// a tight canvas in the item's layer (frame coordinates: call c.begin() at the start of draw)
K.box = (it, x, y, w, h, parent, css) => {
  const cv = el('canvas', '', parent || it.el, { position: 'absolute', left: Math.floor(x) + 'px', top: Math.floor(y) + 'px', width: Math.ceil(w) + 'px', height: Math.ceil(h) + 'px', ...(css || {}) });
  cv.width = Math.ceil(w); cv.height = Math.ceil(h);
  const ctx = cv.getContext('2d'), X = Math.floor(x), Y = Math.floor(y);
  return { cv, ctx, x: X, y: Y, begin() { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.setTransform(1, 0, 0, 1, -X, -Y); return ctx; } };
};
// number formatting: f = {prefix, suffix, dec, pow10 (10^n as superscript), sep (thousands)} | "pow10"
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
K.fmt = (v, f = {}) => {
  if (f === 'pow10' || f.pow10) { const e = Math.round(Math.log10(v)); return (f.prefix || '') + '10^' + e + (f.suffix || ''); }
  const dec = f.dec ?? (Math.abs(v) < 10 && v % 1 ? 1 : 0);
  let s = Math.abs(v).toFixed(dec);
  if (f.sep !== false) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (v < 0 ? '−' : '') + (f.prefix || '') + s + (f.suffix || '');
};
// put a formatted number into a DOM node: "10^26" becomes 10 with a real superscript (Plex Mono lacks most superscript digits)
K.setNum = (node, txt) => {
  const m = String(txt).match(/^(.*?)10\^(-?\d+)(.*)$/);
  if (!m) { if (node.textContent !== txt) node.textContent = txt; return; }
  const h = `${HP.u.esc(m[1])}10<sup style="font-size:.64em;vertical-align:.62em;line-height:0">${m[2].replace('-', '−')}</sup>${HP.u.esc(m[3])}`;
  if (node.innerHTML !== h) node.innerHTML = h;
};
// word-by-word roll-out (never a dumped paragraph): o = {text, x, y, w, font {family, weight, size, style}, color, align,
// lh, upper, tracking, at (times spec, see K.times), per (s per word), style drop | rise | pop | slam | type, parent, z,
// hl: "exact phrase", hlAt, hlColor}. Returns {words, height, width, draw(t)}.
K.roll = (it, o) => {
  const F = { family: "'IBM Plex Mono', monospace", weight: 500, size: 34, style: 'normal', ...(o.font || {}) };
  const font = HP.text.font(F), tr = o.tracking || 0, lh = o.lh ?? F.size * 1.18;
  const text = o.upper ? String(o.text).toUpperCase() : String(o.text);
  const Wd = o.w ?? 900;
  const L = HP.text.wrap(text, F, Wd, { lh, tracking: tr, balance: o.balance ?? false });
  const ws = L.lines.flatMap(ln => ln.words.map(w => ({ ...w, y: ln.y, lw: ln.w })));
  const times = K.times(o.at, ws.length, it.t0, o.per ?? EIGHTH);
  const par = o.parent || it.el;
  const words = ws.map((w, k) => {
    const dx = o.align === 'center' ? (Wd - w.lw) / 2 : o.align === 'right' ? Wd - w.lw : 0;
    const x = (o.x ?? 60) + dx + w.x, y = (o.y ?? 900) + w.y;
    const s = el('span', '', par, { position: 'absolute', left: x + 'px', top: y + 'px', font, lineHeight: lh + 'px', color: o.color || HP.COL.ink, whiteSpace: 'pre', letterSpacing: tr ? tr + 'px' : 'normal', transformOrigin: '50% 60%', opacity: 0, zIndex: o.z ?? 2 });
    s.textContent = w.w;
    if (o.mark !== false) it.mark(times[k], o.markAs || 'word');
    return { el: s, at: times[k], x, y, width: w.width, i: k };
  });
  let bars = null, hlAt = null;
  if (o.hl) {
    const hw = HP.text.words(o.upper ? o.hl.toUpperCase() : o.hl), toks = words.map(w => w.el.textContent);
    const k0 = toks.findIndex((_, i) => hw.every((h, j) => toks[i + j] === h));
    if (k0 < 0) HP.WARN.push(`${it.id}: highlight "${o.hl}" not found verbatim in "${text}"`);
    else {
      hlAt = o.hlAt !== undefined ? HP.T(o.hlAt) : words[k0 + hw.length - 1].at + EIGHTH;
      it.mark(hlAt, 'highlight');
      const byLine = {};
      for (const w of words.slice(k0, k0 + hw.length)) (byLine[w.y] = byLine[w.y] || []).push(w);
      bars = Object.values(byLine).map(g => ({ x0: g[0].x - 10, x1: g[g.length - 1].x + g[g.length - 1].width + 10, y: g[0].y + lh * 0.52 }));
      const x0 = Math.min(...bars.map(b => b.x0)) - 30, x1 = Math.max(...bars.map(b => b.x1)) + 30, y0 = Math.min(...bars.map(b => b.y)) - lh, y1 = Math.max(...bars.map(b => b.y)) + lh;
      o._hlBox = K.box(it, x0, y0, x1 - x0, y1 - y0, par, { zIndex: 1 });
    }
  }
  const st = o.style || 'drop';
  return {
    words, height: L.height, width: L.width, lh, hlAt, end: times[times.length - 1] ?? it.t0,
    draw(t, op = 1) {
      for (const w of words) {
        if (t < w.at - HP.EPS) { w.el.style.opacity = 0; continue; }
        const u = pr(t, w.at, st === 'slam' ? 0.16 : 0.14);
        let tf = '';
        if (st === 'drop') tf = `translateY(${lerp(-22, 0, E.oBack(u, 2.2)).toFixed(2)}px)`;
        else if (st === 'rise') tf = `translateY(${lerp(24, 0, E.oCub(u)).toFixed(2)}px)`;
        else if (st === 'pop') tf = `scale(${lerp(1.45, 1, E.oBack(u, 2.4)).toFixed(4)})`;
        else if (st === 'slam') tf = `scale(${lerp(1.7, 1, E.oCub(u)).toFixed(4)})`;
        w.el.style.opacity = (st === 'type' ? 1 : clamp(u * 3)) * op;
        w.el.style.transform = tf;
      }
      if (bars && o._hlBox) {
        const ctx = o._hlBox.begin();
        bars.forEach((b, k) => K.marker(ctx, b.x0, b.y, b.x1, lh * 0.82, E.oCub(pr(t, hlAt + k * 0.08, EIGHTH)), o.hlColor || HP.COL.yellow, it.id + ':hl' + k));
      }
    },
  };
};
K.inkOf = it => (it.d.ground === 'dark' || (!it.d.ground && it.theme !== 'light')) ? HP.COL.cream : HP.COL.ink;

// ============================================================ graph data (research/rev2/graphs.json by id; inline fields win)
const GFILES = ['research/rev2/graphs.json', 'research/rev2/graphs.stand-in.json'];
// does a research file exist? (checked on the folder listing render.py serves, so missing files make no 404 noise)
const LISTS = new Map();
K.exists = async f => {
  const dir = f.slice(0, f.lastIndexOf('/') + 1), name = f.slice(f.lastIndexOf('/') + 1);
  let p = LISTS.get(dir);
  if (!p) { p = fetch(HP.url(dir), { cache: 'no-store' }).then(r => r.ok ? r.text() : null, () => null); LISTS.set(dir, p); }
  const L = await p; return L === null ? true : L.includes(`href="${name}"`);
};
async function findGraph(id) {
  for (const f of GFILES) {
    let j = null;
    if (!(await K.exists(f))) continue;
    try { j = await HP.assets.json(f); } catch (e) { continue; }
    const list = Array.isArray(j) ? j : Array.isArray(j.items) ? j.items : Array.isArray(j.graphs) ? j.graphs : Array.isArray(j.charts) ? j.charts : Object.entries(j).filter(([k, v]) => v && typeof v === 'object').map(([k, v]) => ({ id: k, ...v }));
    const g = list.find(x => x && (x.id === id || x.key === id));
    if (g) return { g, file: f };
  }
  return null;
}
const toNum = x => {
  if (typeof x === 'number') return x;
  const m = String(x).match(/^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/);   // YYYY, YYYY-MM, YYYY-MM-DD -> fractional year
  if (m) return +m[1] + (m[2] ? (+m[2] - 1) / 12 : 0) + (m[3] ? (+m[3] - 1) / 365 : 0);
  const q = String(x).match(/^(\d{4})\s*Q([1-4])$/i); if (q) return +q[1] + (+q[2] - 1) / 4 + 0.125;
  const n = parseFloat(x); return isNaN(n) ? null : n;
};
// research/rev2/graphs.json schema (integrator, rev2): {x: [labels], x_iso (exact dates when x_type is "date"), x_type,
// series: [{name, values (null = no value), projected}], point_labels, highlight {x, label}, log_y, projected_from_index,
// kind "area"} -> the series/points form below. Points keep their label (point_labels, or the category name), the highlight
// becomes the solid "hi" point, a projected series is drawn dashed. Per-point projections (projected_from_index) are flagged
// "proj" on the points but NOT drawn differently yet: don't chart such a graph without saying "guided"/"planned" in the EDL.
function fromResearch(g) {
  if (!g || !Array.isArray(g.x) || !Array.isArray(g.series) || !g.series.some(s => Array.isArray(s.values))) return g;
  const xs = g.x_type === 'date' && Array.isArray(g.x_iso) && g.x_iso.length === g.x.length ? g.x_iso : g.x;
  const out = { ...g };
  delete out.x;
  out.series = g.series.map(s => ({ name: s.name, color: s.color, dash: s.projected ? [14, 10] : s.dash, area: g.kind === 'area' || s.area,
    points: (s.values || []).map((v, k) => (v === null || v === undefined) ? null : { x: xs[k], y: +v,
      // categories: the axis shows the x label; the point's name (point_labels) stays a note, so it never becomes the category
      ...(g.x_type === 'category' ? { label: g.x[k], note: g.point_labels ? g.point_labels[k] : undefined } : { label: g.point_labels ? g.point_labels[k] : undefined }),
      ...(g.highlight && g.highlight.x === g.x[k] ? { hi: true } : {}),
      ...((s.projected || (g.projected_from_index !== undefined && k >= g.projected_from_index)) ? { proj: true } : {}) }).filter(Boolean) }));
  if (g.kind === 'area') out.kind = 'line';
  if (g.log_y && out.log === undefined) { out.log = true; out.yAxis = { fmt: 'pow10', ...(g.yAxis || {}) }; }
  if (g.x_type === 'date') out.dateX = true;   // x ticks on whole years (build2)
  return out;
}
function normSeries(g) {
  const S = [];
  const pushPts = (name, color, arr, extra) => {
    const pts = arr.map((p, k) => {
      if (Array.isArray(p)) return { x: p[0], y: +p[1], label: p[2] };
      if (p && typeof p === 'object') return { x: p.x ?? p.date ?? p.year ?? p.label ?? k, y: +(p.y ?? p.value ?? p.v), label: p.label ?? p.name, note: p.note, ...('hi' in p ? { hi: p.hi } : {}) };
      return { x: k, y: +p };
    });
    S.push({ name, color, pts, ...(extra || {}) });
  };
  if (Array.isArray(g.series)) g.series.forEach(s => pushPts(s.name || s.label, s.color, s.points || s.data || s.values || [], { dash: s.dash, area: s.area }));
  else if (Array.isArray(g.data)) pushPts(g.name, g.color, g.data);
  else if (Array.isArray(g.points)) pushPts(g.name, g.color, g.points);
  else if (Array.isArray(g.x) && Array.isArray(g.y)) pushPts(g.name, g.color, g.x.map((x, k) => [x, g.y[k]]));
  return S;
}

// nice linear ticks
function niceTicks(a, b, n = 4) {
  const span = b - a, step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0))), f = step0 / mag;
  const step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag, out = [];
  for (let v = Math.ceil(a / step - 1e-9) * step; v <= b + 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}

HP.register('chart', {
  async load(it) {
    const d = it.d;
    let g = {};
    if (d.graph) {
      const r = await findGraph(d.graph);
      if (!r) HP.WARN.push(`chart ${it.id}: graph "${d.graph}" not found in ${GFILES.join(' or ')}`);
      else { g = fromResearch(r.g); it.gfile = r.file; if (/stand-in/.test(r.file)) HP.INFO.push(`chart ${it.id}: data from ${r.file} (STAND-IN)`); }
    }
    it.g = { ...g, ...d };
    for (const k of ['series', 'data', 'points']) if (d[k] === undefined && g[k] !== undefined) it.g[k] = g[k];
    it.build2();
  },
  build(it) {
    const d = it.d;
    it.el.style.isolation = 'isolate';   // keep child z-indexes inside this item (EDL order decides stacking)
    it.wrap = el('div', '', it.el, { position: 'absolute', left: 0, top: 0, width: HP.W + 'px', height: HP.H + 'px', transformOrigin: `${(d.x ?? 120) + (d.w ?? 820) / 2}px ${(d.y ?? 700) + (d.h ?? 600) / 2}px` });
    // image / footage behind or beside the graph (prep_clips.py "prep": "image" -> cache/<id>/image.jpg)
    if (d.prep === 'image' || d.image) {
      const f = d.frame || { x: 0, y: 0, w: HP.W, h: HP.H };
      it.imgBox = el('div', '', it.wrap, { position: 'absolute', left: f.x + 'px', top: f.y + 'px', width: f.w + 'px', height: f.h + 'px', overflow: 'hidden', transform: f.rot ? `rotate(${f.rot}deg)` : '', zIndex: 0 });
      it.img = el('img', '', it.imgBox, { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover', transformOrigin: '50% 50%', opacity: d.imgOpacity ?? 1 });
      it.imagery(it.img);
      if (d.imgShade) it.shade = el('div', '', it.imgBox, { position: 'absolute', inset: 0, background: d.imgShade });
    }
    it.cvs = it.canvas(); it.cvs.cv.style.zIndex = 1; it.wrap.appendChild(it.cvs.cv);
    it.build2 = () => build2(it);
  },
  layout(it) {},
  async prepare(it, t) {},
  draw(it, t) { draw(it, t); },
  texts(it) {
    const g = it.g || it.d, out = [];
    if (g.title) out.push({ text: g.title, reveal: 'words', role: 'main' });
    if (g.source) out.push({ text: g.source, reveal: 'words', role: 'meta' });
    for (const a of (it.d.annotate || [])) out.push({ text: a.text, reveal: 'words', role: 'main' });
    return out;
  },
});

function build2(it) {
  const d = it.d, g = it.g;
  if (it.img) { const src = `cache/${d.frames || it.id}/image.jpg`; it.img.src = src; HP.assets.track(it.img.decode().catch(() => HP.WARN.push(`chart ${it.id}: image ${src} not prepared (run prep_clips.py ${HP.EDL_NAME})`))); }
  const kind = it.kind = g.kind || (g.data && !g.series ? 'bar' : 'line');
  const S = it.S = normSeries(g);
  if (!S.length || !S[0].pts.length) { HP.WARN.push(`chart ${it.id}: no data`); S.push({ pts: [] }); }
  const ink = it.ink = d.ink || K.inkOf(it);
  const P = it.P = { x: d.x ?? 120, y: d.y ?? 700, w: d.w ?? 820, h: d.h ?? 600 };
  const xa = it.xa = { ...(g.xAxis || {}), ...(d.xAxis || {}) }, ya = it.ya = { ...(g.yAxis || {}), ...(d.yAxis || {}) };
  if (g.log && ya.log === undefined) ya.log = true;
  // x mapping: categories (bars, or non-numeric x) by index; numbers / dates linear
  const all = S.flatMap(s => s.pts);
  it.cat = kind === 'bar' || all.some(p => toNum(p.x) === null);
  if (it.cat) {
    const cats = [...new Set(S[0].pts.map(p => String(p.label ?? p.x)))];
    it.cats = cats; for (const s of S) for (const p of s.pts) p.xn = cats.indexOf(String(p.label ?? p.x));
    it.X = xn => P.x + (xn + 0.5) * P.w / cats.length;
  } else {
    for (const s of S) for (const p of s.pts) p.xn = toNum(p.x);
    const xs = all.map(p => p.xn), x0 = xa.min !== undefined ? toNum(xa.min) : Math.min(...xs), x1 = xa.max !== undefined ? toNum(xa.max) : Math.max(...xs);
    it.xr = [x0, x1]; it.X = xn => P.x + (xn - x0) / Math.max(1e-9, x1 - x0) * P.w;
  }
  const ys = all.map(p => p.y).filter(v => isFinite(v));
  if (ya.log) {
    const lo = ya.min ?? Math.pow(10, Math.floor(Math.log10(Math.min(...ys)))), hi = ya.max ?? Math.pow(10, Math.ceil(Math.log10(Math.max(...ys)) + 0.15));
    it.yr = [lo, hi]; it.Y = v => P.y + P.h - (Math.log10(Math.max(v, lo * 1e-3)) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo)) * P.h;
    it.yt = ya.ticks || (() => { const o = [], step = ya.every || Math.max(1, Math.round((Math.log10(hi) - Math.log10(lo)) / 4)); for (let e = Math.log10(lo); e <= Math.log10(hi) + 1e-9; e += step) o.push(Math.pow(10, e)); return o; })();
  } else {
    const lo = ya.min ?? 0, hi = ya.max ?? Math.max(...ys) * 1.18;   // headroom so the overshoot reads (style.md 4.6)
    it.yr = [lo, hi]; it.Y = v => P.y + P.h - (v - lo) / Math.max(1e-9, hi - lo) * P.h;
    it.yt = ya.ticks || niceTicks(lo, hi, ya.n || 4).filter(v => v > lo);
  }
  it.xt = it.cat ? [] : (xa.ticks ? xa.ticks.map(toNum) : niceTicks(it.xr[0], it.xr[1], xa.n || 4));
  if (!it.cat && !xa.ticks && g.dateX) {   // research dates (integrator): one tick per whole year, never two "2025"s
    const y0 = Math.ceil(it.xr[0] - 1e-9), y1 = Math.floor(it.xr[1] + 1e-9), step = Math.max(1, Math.ceil((y1 - y0 + 1) / 6));
    it.xt = []; for (let y = y0; y <= y1; y += step) it.xt.push(y);
  }
  // timeline: axes, grid, title; one data step per grow time; annotations; source
  const n = Math.max(...S.map(s => s.pts.length));
  it.grow = K.times(d.grow, n, it.t0 + BEAT, BEAT);
  it.grow.forEach((x, k) => it.mark(x, kind === 'bar' ? 'bar' : 'point'));
  it.axesAt = HP.T(d.axesAt, Math.min(it.t0, it.grow[0] - BEAT));
  it.mark(it.axesAt, 'axes');
  it.gridAt = it.yt.map((_, k) => it.axesAt + 0.2 + k * (d.gridPer ?? EIGHTH / 2));
  // DOM text: title, tick labels, value labels, source
  const meta = d.metaPx ?? 30;
  if (g.title) it.title = K.roll(it, { text: g.title, x: d.titleX ?? P.x - 30, y: d.titleY ?? P.y - (d.titleGap ?? 210), w: d.titleW ?? Math.min(960, P.w + 60), parent: it.wrap,
    font: { family: "'Newsreader', serif", weight: 600, size: d.titlePx ?? 60 }, lh: (d.titlePx ?? 60) * 1.08, color: ink, at: d.titleAt ?? it.t0, per: d.titlePer ?? EIGHTH, style: 'drop', hl: d.titleHl, hlAt: d.titleHlAt, hlColor: d.titleHlColor });
  if (g.subtitle || g.unit) it.sub = K.roll(it, { text: g.subtitle || g.unit, x: d.titleX ?? P.x - 30, y: (d.titleY ?? P.y - (d.titleGap ?? 210)) + (it.title ? it.title.height + 8 : 0), w: P.w + 60, parent: it.wrap,
    font: { weight: 500, size: d.subPx ?? 32 }, upper: true, tracking: 1, color: ink, at: d.subAt ?? (it.title ? it.title.end + EIGHTH : it.t0), per: d.subPer ?? EIGHTH / 2, style: 'rise', markAs: 'meta' });
  const lab = (txt, css) => { const s = el('div', '', it.wrap, { position: 'absolute', font: `500 ${meta}px 'IBM Plex Mono', monospace`, color: ink, whiteSpace: 'nowrap', opacity: 0, zIndex: 2, ...css }); K.setNum(s, txt); return s; };
  it.ytl = it.yt.map(v => lab(K.fmt(v, ya.fmt || {}), { left: (P.x - 16) + 'px', top: (it.Y(v) - meta * 0.62) + 'px', transform: 'translateX(-100%)' }));
  it.xtl = it.xt.map(v => lab(xa.fmt ? K.fmt(v, xa.fmt) : String(Math.round(v)), { left: it.X(v) + 'px', top: (P.y + P.h + 18) + 'px', transform: 'translateX(-50%)' }));
  if (it.cat) it.ctl = it.cats.map((c, k) => lab(c, { left: it.X(k) + 'px', top: (P.y + P.h + 18) + 'px', transform: 'translateX(-50%)', textAlign: 'center' }));
  // yAxis.labelIn (polisher): the unit sits inside the plot, just right of the axis top, instead of above it (clear of a subtitle)
  if (ya.label) it.ylab = ya.labelIn ? lab(ya.label, { left: (P.x + 16) + 'px', top: (P.y - meta * 0.4) + 'px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', fontSize: (ya.labelPx ?? meta) + 'px' })
    : lab(ya.label, { left: (P.x - 16) + 'px', top: (P.y - meta * 2.1) + 'px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', transform: 'translateX(-30%)' });
  // value labels (bars: all; line: d.labels "all" | "last" | [indices]) and the big counter
  const lv = d.labels ?? (kind === 'bar' ? 'all' : 'last');
  it.vlab = S[0].pts.map((p, k) => (lv === 'all' || (Array.isArray(lv) && lv.includes(k)) || (lv === 'last' && k === S[0].pts.length - 1))
    ? lab('', { font: `700 ${d.valuePx ?? 38}px 'IBM Plex Mono', monospace`, transform: 'translate(-50%, -100%)' }) : null);
  if (d.counter) {
    const c = d.counter;
    it.counter = el('div', '', it.wrap, { position: 'absolute', left: c.x + 'px', top: c.y + 'px', font: `700 ${c.size ?? 120}px 'Unbounded', sans-serif`, color: c.color || ink, whiteSpace: 'nowrap', zIndex: 3, transformOrigin: '0 50%' });
    if (c.label) { it.counterLab = el('div', '', it.wrap, { position: 'absolute', left: c.x + 'px', top: (c.y + (c.size ?? 120) * 1.25) + 'px', font: `600 ${meta + 2}px 'IBM Plex Mono', monospace`, color: c.color || ink, textTransform: 'uppercase', letterSpacing: '1px', zIndex: 3 }); it.counterLab.textContent = c.label; }
  }
  // annotations: arrow + pencil circle at a data point, callout rolled out word by word
  it.ann = (d.annotate || []).map((a, k) => {
    const at = HP.T(a.at, it.grow[a.i ?? n - 1] + BEAT), p = S[a.s ?? 0].pts[a.i ?? n - 1];
    const px = it.X(p.xn), py = it.Y(p.y), tx = px + (a.dx ?? -260), ty = py + (a.dy ?? -220);
    it.mark(at, 'annotate');
    const R = K.roll(it, { text: a.text, x: tx - (a.w ?? 420) / 2, y: ty - (a.lines ?? 1) * 50 - 20, w: a.w ?? 420, align: 'center', parent: it.wrap,
      font: { family: "'Newsreader', serif", weight: 600, size: a.px ?? 46, style: a.italic ? 'italic' : 'normal' }, color: a.color || ink,
      at: at + (a.lead ?? 0.12), per: a.per ?? EIGHTH / 2, style: 'pop', hl: a.hl, hlAt: a.hlAt, hlColor: a.hlColor });
    // the callout's text block sits above (tx, ty); the arrow runs from just under it to the point
    R.words.forEach(w => { w.el.style.top = (parseFloat(w.el.style.top) - R.height + (a.lines ?? 1) * 50 + 20) + 'px'; });
    return { a, at, px, py, tx, ty: ty + 14, R };
  });
  if (d.imgCaption && it.imgBox) {   // a mono caption under the photo/footage (what it is, who, when)
    const c = typeof d.imgCaption === 'string' ? { text: d.imgCaption } : d.imgCaption, f = d.frame || {};
    it.imgCap = K.roll(it, { text: c.text, x: c.x ?? (f.x ?? 0) + 20, y: c.y ?? (f.y ?? 0) + (f.h ?? 600) + 14, w: c.w ?? Math.min(960, (f.w ?? 1000) - 40), parent: it.wrap,
      font: { weight: 600, size: c.px ?? 28 }, upper: true, tracking: 0.5, color: c.color || (it.theme === 'light' ? HP.COL.ink : HP.COL.cream), at: c.at ?? it.t0, per: EIGHTH / 2, style: 'rise', markAs: 'meta' });
  }
  if (g.source) it.src = K.roll(it, { text: g.source, x: d.sourceX ?? P.x - 30, y: d.sourceY ?? P.y + P.h + 90, w: d.sourceW ?? Math.min(960, P.w + 60), parent: it.wrap,
    font: { weight: 500, size: d.sourcePx ?? 28 }, upper: true, tracking: 0.5, lh: (d.sourcePx ?? 28) * 1.3, color: d.sourceColor || ink,
    at: d.sourceAt ?? (it.grow[n - 1] + BEAT), per: d.sourcePer ?? EIGHTH / 2, style: 'rise', markAs: 'meta' });
  // named-point labels: greedy placement (above, below, left, right of the point) avoiding every label placed before
  it.lblBelow = []; it.lblPos = [];
  if (d.labelText) {
    const p0 = S[0].pts, boxes = [], px = d.valuePx ?? 38, pad = 6;
    const hit = (b) => boxes.some(q => b.x0 < q.x1 + pad && b.x1 > q.x0 - pad && b.y0 < q.y1 + pad && b.y1 > q.y0 - pad);
    for (let k = 0; k < p0.length; k++) {
      const x = it.X(p0[k].xn), y = it.Y(p0[k].y), w = String(p0[k].label ?? '').length * px * 0.62, h = px * 1.15;
      const cand = [['up', x - w / 2, y - 26 - h], ['down', x - w / 2, y + 30], ['left', x - 26 - w, y - h / 2], ['right', x + 26, y - h / 2], ['upleft', x - w, y - 26 - h], ['upright', x, y - 26 - h]]
        .map(([k2, x0, y0]) => ({ k: k2, x0: Math.max(P.x - 140, Math.min(x0, P.x + P.w + 60 - w)), y0 }));
      const pick = cand.find(c => !hit({ x0: c.x0, x1: c.x0 + w, y0: c.y0, y1: c.y0 + h })) || cand[0];
      boxes.push({ x0: pick.x0, x1: pick.x0 + w, y0: pick.y0, y1: pick.y0 + h }); boxes.push({ x0: x - 16, x1: x + 16, y0: y - 16, y1: y + 16 });
      it.lblPos.push({ x: pick.x0, y: pick.y0 }); it.lblBelow.push(pick.k === 'down');
    }
  }
  it.splatAt = d.splats === false ? [] : it.grow.map((x, k) => ({ x, k })).filter(({ x }) => { const bi = HP.beatAt(x), r = Math.round(bi); return Math.abs(bi - r) < 0.05 && ((r % 4 + 4) % 4 === 0); });
  it.kickT = it.grow.slice();
  // polisher: payoffs for check/coverage.py (the last data point, each annotation, the source line must land >= a read before t1)
  it.payoffs = () => [{ what: 'last data point', at: it.grow[n - 1] + 0.2 }, ...it.ann.map(A => ({ what: `annotation "${A.a.text}"`, at: A.R.end + 0.16 })),
    ...(it.src ? [{ what: 'source line', at: it.src.end + 0.14 }] : [])];
}

function draw(it, t) {
  const d = it.d, P = it.P, ink = it.ink, S = it.S, kind = it.kind;
  const ctx = it.cvs.ctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, HP.W, HP.H);
  const boil = HP.boil(t, d.boil ?? 2) % 3;
  const rc = HP.lib.rough.canvas(it.cvs.cv, it.id + ':' + boil);
  // whole-graph motion: slow push-in + a kick on every data beat (the newest point/bar lands)
  let kick = 1;
  for (const x of it.kickT) { if (t < x - HP.EPS) continue; const u = pr(t, x, 0.18); if (u < 1) kick = Math.max(kick, lerp(d.kick ?? 1.018, 1, E.oCub(u))); }
  const drift = lerp(1, d.drift ?? 1.035, E.ioSine(it.life(t)));
  it.wrap.style.transform = `scale(${(kick * drift).toFixed(4)}) rotate(${(Math.sin(t * 0.9) * (d.sway ?? 0.35)).toFixed(3)}deg)`;
  if (it.img) {
    const Z = d.zoom || [1.0, 1.1], u = E.ioSine(it.life(t)), su = pr(t, it.t0, 0.2);
    it.img.style.transform = `scale(${(lerp(Z[0], Z[1], u) * lerp(d.imgSlam ?? 1.14, 1, E.oCub(su))).toFixed(4)})`;
    it.imgBox.style.opacity = d.imgEnter === 'cut' ? 1 : clamp(su * 4);
  }
  // ground card (cream paper or ink) behind the plot: painted in on the axes beat, pencil border boils
  if (d.card !== false && d.ground !== 'none') {
    const C = { x: P.x - 150, y: P.y - (d.titleGap ?? 210) - 40, w: P.w + 210, h: P.h + (d.titleGap ?? 210) + 210, ...(d.card || {}) };
    const u = E.oBack(pr(t, it.axesAt - 0.12, 0.2), 1.6);
    if (u > 0) {
      const fill = C.color || (ink === HP.COL.ink ? '#FBF6EC' : '#0E0D12');   // paper white on the cream ground
      ctx.save(); ctx.globalAlpha = C.opacity ?? (it.img ? 0.9 : 1);
      ctx.translate(C.x + C.w / 2, C.y + C.h / 2); ctx.rotate((C.rot ?? -0.6) * Math.PI / 180); ctx.scale(u, u);
      ctx.fillStyle = fill; ctx.fillRect(-C.w / 2, -C.h / 2, C.w, C.h);
      ctx.restore();
      const rcs = { ...K.pencil(ink, 3), roughness: 1.6 };
      rc.rectangle(C.x + 4, C.y + 4, C.w - 8, C.h - 8, K.drawOn(rcs, 2 * (C.w + C.h) * 1.1, pr(t, it.axesAt, 0.35)));
    }
  }
  // axes and gridlines, penciled in
  const pa = pr(t, it.axesAt, 0.3), pb = pr(t, it.axesAt + 0.1, 0.3);
  const ax = { ...K.pencil(ink, 4.5), bowing: 1.1 };
  if (pa > 0) rc.line(P.x, P.y + P.h, P.x, P.y - 10, K.drawOn(ax, P.h * 1.15, pa));
  if (pb > 0) rc.line(P.x, P.y + P.h, P.x + P.w + 10, P.y + P.h, K.drawOn(ax, P.w * 1.15, pb));
  const gridCol = ink === HP.COL.ink ? 'rgba(21,19,31,.28)' : 'rgba(242,235,221,.30)';
  it.yt.forEach((v, k) => {
    const u = pr(t, it.gridAt[k], 0.22), y = it.Y(v);
    if (u > 0) rc.line(P.x, y, P.x + P.w, y, K.drawOn({ stroke: gridCol, strokeWidth: 2, roughness: 1.6, bowing: 2 }, P.w * 1.15, u));
    it.ytl[k].style.opacity = clamp(u * 3);
  });
  it.xtl.forEach((l, k) => { l.style.opacity = clamp(pb * 2 - k * 0.15); });
  if (it.ylab) it.ylab.style.opacity = pa;
  // data
  const ser = { line: drawLine, step: drawLine, scatter: drawLine, bar: drawBars }[kind] || drawLine;
  S.forEach((s, si) => ser(it, t, rc, ctx, s, si));
  // counter: the newest value, ticking up over 6 frames
  if (it.counter) {
    const pts = S[0].pts; let k = -1; for (let i = 0; i < pts.length; i++) if (t >= it.grow[i] - HP.EPS) k = i;
    if (k < 0) it.counter.style.opacity = 0;
    else {
      const u = pr(t, it.grow[k], 0.2), v0 = k > 0 ? pts[k - 1].y : (d.counter.from ?? 0), v = lerp(v0, pts[k].y, E.oCub(u));
      K.setNum(it.counter, K.fmt(v, d.counter.fmt || it.ya.fmt || {}));
      it.counter.style.opacity = 1; it.counter.style.transform = `scale(${lerp(1.12, 1, E.oCub(pr(t, it.grow[k], 0.16))).toFixed(4)})`;
      if (it.counterLab) it.counterLab.style.opacity = 1;
    }
  }
  // annotations
  for (const A of it.ann) {
    const pa2 = pr(t, A.at, 0.32);
    if (pa2 > 0) {
      const o = { ...K.pencil(A.a.color || ink, 5) };
      K.arrow(rc, A.tx, A.ty, A.px + (A.tx < A.px ? -22 : 22), A.py + (A.ty < A.py ? -22 : 22), pa2, o, A.a.bow ?? 0.2);
      const pc = pr(t, A.at + 0.1, 0.36);
      if (pc > 0) { const r = A.a.r ?? 40; rc.ellipse(A.px, A.py, r * 2.3, r * 2, K.drawOn({ ...K.pencil(A.a.circle || HP.COL.red, 5.5), roughness: 1.4 }, K.ellipseLen(r * 1.15, r) * 1.25, pc)); }
    }
    A.R.draw(t);
  }
  if (it.title) it.title.draw(t);
  if (it.sub) it.sub.draw(t);
  if (it.src) it.src.draw(t);
  if (it.imgCap) it.imgCap.draw(t);
}

function ptsUpTo(it, s, t) {   // visible polyline (with the growing head) and how many points have landed
  const P = s.pts.map((p, k) => [it.X(p.xn), it.Y(p.y)]), G = it.grow, step = it.kind === 'step';
  let landed = 0; for (let k = 0; k < P.length; k++) if (t >= G[k] - HP.EPS) landed = k + 1;
  const vis = [];
  for (let k = 0; k < landed; k++) { if (step && k > 0) vis.push([P[k][0], P[k - 1][1]]); vis.push(P[k]); }
  // the head travels to the next point during the beat before it lands (it arrives ON the beat)
  if (landed > 0 && landed < P.length && it.kind !== 'scatter') {
    const k = landed, segDur = Math.min(0.8 * (G[k] - G[k - 1]), 0.4), u = E.ioCub(pr(t, G[k] - segDur, segDur));
    if (u > 0) {
      if (step) { const mid = [P[k][0], P[k - 1][1]]; vis.push(u < 0.6 ? [lerp(P[k - 1][0], mid[0], u / 0.6), mid[1]] : mid); if (u >= 0.6) vis.push([mid[0], lerp(mid[1], P[k][1], (u - 0.6) / 0.4)]); }
      else vis.push([lerp(P[k - 1][0], P[k][0], u), lerp(P[k - 1][1], P[k][1], u)]);
    }
  }
  return { P, vis, landed };
}

function drawLine(it, t, rc, ctx, s, si) {
  const d = it.d, ink = it.ink, col = s.color || d.color || [HP.COL.pink, HP.COL.blue, HP.COL.teal][si % 3];
  const { P, vis, landed } = ptsUpTo(it, s, t);
  if (it.kind !== 'scatter' && vis.length >= 2) {
    if (s.area || d.area) {
      const poly = [...vis, [vis[vis.length - 1][0], it.P.y + it.P.h], [vis[0][0], it.P.y + it.P.h]];
      rc.polygon(poly, { stroke: 'none', fill: col, fillStyle: 'hachure', hachureAngle: -41, hachureGap: 11, fillWeight: 3, roughness: 1.2, seed: K.seed(it.id, 'area', si, HP.boil(t) % 3) });
    }
    rc.linearPath(vis, { stroke: col, strokeWidth: d.lineW ?? 7, roughness: 1.15, bowing: 0.8, seed: K.seed(it.id, 'line', si, HP.boil(t) % 3), disableMultiStroke: false });
  }
  for (let k = 0; k < landed; k++) {
    const lt = t - it.grow[k], u = E.oBack(pr(lt, 0, 0.2), 2.6), [x, y] = P[k];
    const hi = s.pts[k].hi || (d.hi !== undefined && d.hi === k);
    if (si === 0 && it.splatAt.some(q => q.k === k)) K.splat(ctx, { x: x + 6, y: y + (d.splatDy ?? 46), r: d.splatR ?? 32, dir: Math.PI / 2, sats: 26, drips: 2, color: d.splatColor || col, seed: it.id + ':sp' + k }, lt);
    if (lt < 0.34 && d.rings !== false) { const q = pr(lt, 0, 0.34), rr = lerp(18, 74, E.oCub(q)); ctx.save(); ctx.globalAlpha = (1 - q) * 0.9; ctx.strokeStyle = col; ctx.lineWidth = lerp(7, 1.5, q); ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.stroke(); ctx.restore(); }
    const r = (hi ? 22 : 15) * u;
    if (r > 0.5) rc.circle(x, y, 2 * r, { fill: hi ? HP.COL.yellow : col, fillStyle: 'solid', stroke: ink, strokeWidth: 3, roughness: 0.8, seed: K.seed(it.id, 'pt', si, k, HP.boil(t) % 3) });
    const L = it.vlab[k];
    if (si === 0 && L) {
      // polisher: a value label centred over a point at the y axis would print over the tick labels ("40(237"): keep its left
      // edge inside the plot (Plex Mono advance 0.6 em; the final value's width)
      const hw = String(K.fmt(s.pts[k].y, d.valueFmt || it.ya.fmt || {})).length * (d.valuePx ?? 38) * 0.31;
      L.style.left = (d.labelText ? x : Math.max(x, it.P.x + 10 + hw)) + 'px'; L.style.top = (y - 26) + 'px'; L.style.opacity = clamp(lt / 0.06);
      const v0 = k > 0 ? s.pts[k - 1].y : 0;
      K.setNum(L, d.labelText ? String(s.pts[k].label ?? '') : K.fmt(lerp(v0, s.pts[k].y, E.oCub(pr(lt, 0, 0.2))), d.valueFmt || it.ya.fmt || {}));
      if (d.labelText) {
        const q = it.lblPos[k];
        L.style.left = q.x.toFixed(1) + 'px'; L.style.top = q.y.toFixed(1) + 'px'; L.style.transformOrigin = '50% 50%';
        L.style.transform = `scale(${lerp(1.3, 1, E.oBack(pr(lt, 0, 0.18), 2)).toFixed(3)})`;
      }
    }
  }
  if (si === 0) for (let k = landed; k < it.vlab.length; k++) if (it.vlab[k]) it.vlab[k].style.opacity = 0;
}

function drawBars(it, t, rc, ctx, s, si) {
  const d = it.d, P = it.P, ink = it.ink, n = s.pts.length, bw = P.w / n * (d.barW ?? 0.62);
  const base = it.ya.log ? it.yr[0] : Math.max(it.yr[0], 0);
  s.pts.forEach((p, k) => {
    const g = it.grow[k], lt = t - g;
    const lab = it.ctl ? it.ctl[k] : null;
    if (lab) lab.style.opacity = lt >= -HP.EPS ? 1 : 0;
    const L = it.vlab[k];
    if (lt < -HP.EPS) { if (L) L.style.opacity = 0; return; }
    const u = E.oBack(clamp(lt / 0.28), 1.25), x = it.X(p.xn) - bw / 2, y0 = it.Y(base), y1 = it.Y(p.y), h = (y0 - y1) * u;
    const hi = p.hi || d.hi === k, col = p.color || s.color || d.color || HP.COL.pink;
    if ((k === n - 1 || hi) && d.splats !== false) K.splat(ctx, { x: x + bw / 2, y: y0 - h * 0.45, r: d.splatR ?? 44, dir: -Math.PI / 2, sats: 30, drips: 2, color: d.splatColor || HP.COL.yellow, seed: it.id + ':sp' + k }, lt);
    if (h > 1) rc.rectangle(x, y0 - h, bw, h, { fill: col, fillStyle: hi ? 'solid' : 'hachure', hachureAngle: -41, hachureGap: 8, fillWeight: 3.4, stroke: ink, strokeWidth: 3.6, roughness: 1.35, bowing: 1.5, seed: K.seed(it.id, 'bar', k, HP.boil(t) % 3) });
    if (L) {
      L.style.left = (x + bw / 2) + 'px'; L.style.top = (y0 - h - 12) + 'px'; L.style.opacity = clamp(lt / 0.06);
      K.setNum(L, K.fmt(p.y * E.oCub(clamp(lt / 0.2)), d.valueFmt || it.ya.fmt || {}));
    }
  });
}

HP.lib.charts = { kit: K, normSeries, niceTicks, findGraph, toNum };
})();
