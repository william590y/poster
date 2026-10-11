/* Hyperplane engine core (render/video/fx/core.js)
 * =================================================================================================================
 * teaser.html loads this file, then the modules listed in fx/index.json (in order), then the EDL (?edl=<name>).
 * Page contract (unchanged): window.render(t), window.renderAsync(t), window.DURATION, window.__ok / window.__err.
 *
 * Everything shared lives on the global HP (documented in edl/README.md, "Modules"):
 *   HP.u          math + DOM helpers (clamp, lerp, pr, smooth, el, sv, setA, esc, $, mulberry32, EPS, NS)
 *   HP.ease       easings (lin, iQuad, oQuad, ioQuad, iCub, oCub, ioCub, oBack, oExpo, iExpo, oElastic, oSine, ioSine)
 *   HP.hash/rng/rand/noise1/pick/frameNo/boil   seeded randomness keyed by strings (NEVER Math.random) and frame helpers
 *   HP.T(ref)     time references: number | "grid:i[+-off]" | "hb:i" (beat i of song/hits.json) | "song:s" | {at, off}
 *   HP.beat(i), HP.beatsIn(t0, t1, opts), HP.beatAt(t), HP.songAt(t), HP.editAt(s), HP.sectionAt(t), HP.vocalAt(t)
 *   HP.cam        global camera stack: hit (shake), punch (zoom), spin (rotate), jolt (push), add(fn) (continuous)
 *   HP.flash(t, opacity, decay, color)
 *   HP.register(type, spec | class), HP.registerFX(name, fn | spec), HP.Item (base class), HP.on(hook, fn)
 *   HP.layers     stage, cam, fx, top; HP.shared(name, kind) = one shared full-frame canvas / svg
 *   HP.text       measure / wrap / fit (canvas metrics, after fonts load)
 *   HP.assets     image / json / text / svg / frames (decode-awaited; renderAsync waits for prepare())
 *   HP.memo(key, fn), HP.offscreen(w, h)   pure caches (bake finished strokes once) and scratch canvases
 *   HP.lib        vendored libraries: rough, freehand, mathjax (+ HP.lib.<module> for builders' own helpers)
 *   HP.mark(t, id, what)   declare a scheduled visual event (beatcheck.py reads these)
 *   HP.markImagery(el)     declare an element as footage/image (coverage.py reads these)
 * Determinism: render(t) may depend only on t and the EDL. Math.random is trapped (WARN, and seeded per frame).
 */
(function () {
'use strict';
const HP = window.HP = window.HP || {};
const Q = new URLSearchParams(location.search);
const EPS = 1e-6, NS = 'http://www.w3.org/2000/svg', W = 1080, H = 1920;

// ============================================================ math, easing, DOM helpers
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const pr = (t, t0, d) => d <= 0 ? (t >= t0 ? 1 : 0) : clamp((t - t0) / d);   // progress of t through [t0, t0 + d]
const smooth = u => u * u * (3 - 2 * u);
const ease = {
  lin: u => u,
  iQuad: u => u * u, oQuad: u => 1 - (1 - u) * (1 - u), ioQuad: u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2,
  iCub: u => u * u * u, oCub: u => 1 - Math.pow(1 - u, 3), ioCub: u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2,
  oBack: (u, s = 1.9) => 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2),
  oExpo: u => u >= 1 ? 1 : 1 - Math.pow(2, -10 * u), iExpo: u => u <= 0 ? 0 : Math.pow(2, 10 * u - 10),
  oElastic: (u, p = 0.3) => u <= 0 ? 0 : u >= 1 ? 1 : Math.pow(2, -10 * u) * Math.sin((u - p / 4) * 2 * Math.PI / p) + 1,
  oSine: u => Math.sin(u * Math.PI / 2), ioSine: u => -(Math.cos(Math.PI * u) - 1) / 2,
  smooth,
};
const $ = id => document.getElementById(id);
function el(tag, cls, parent, css) { const e = document.createElement(tag); if (cls) e.className = cls; if (css) Object.assign(e.style, css); if (parent) parent.appendChild(e); return e; }
function sv(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
const setA = (e, a) => { for (const k in a) e.setAttribute(k, a[k]); };
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
HP.u = { clamp, lerp, pr, smooth, el, sv, setA, esc, $, mulberry32, EPS, NS };
HP.ease = ease;
HP.W = W; HP.H = H; HP.FPS = 30; HP.EPS = EPS;
HP.Q = Q;
HP.EDL_NAME = Q.get('edl') || 'short';
HP.DEBUG = Q.get('debug') === '1'; HP.GUIDES = Q.get('guides') === '1';
// the cover palette (brand/hyperplane-cover-3000.png, render/hp/kand_e.html)
HP.COL = { ink: '#15131F', cream: '#F2EBDD', pink: '#FF2E88', orange: '#FF4A1C', red: '#B31B1B', blue: '#2346FF', teal: '#00B8A9', violet: '#7B3FF2', yellow: '#F2C300' };

// ============================================================ seeded randomness (keyed by strings: item ids, beat indices)
function hash32(str) {   // FNV-1a + murmur3 finalizer
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}
HP.hash = (...keys) => hash32(keys.map(String).join('␟'));           // HP.hash('splat', item.id, beat) -> uint32
HP.rng = (...keys) => mulberry32(HP.hash(...keys));                        // a generator: const r = HP.rng(id, i); r(), r()...
HP.rand = (...keys) => mulberry32(HP.hash(...keys))();                     // one float in [0, 1)
HP.range = (a, b, ...keys) => lerp(a, b, HP.rand(...keys));
HP.pick = (arr, ...keys) => arr[Math.floor(HP.rand(...keys) * arr.length) % arr.length];
HP.noise1 = (key, x) => { const i = Math.floor(x), f = x - i; return lerp(HP.rand(key, i), HP.rand(key, i + 1), smooth(f)); };   // smooth value noise, 0..1
HP.frameNo = t => Math.floor(t * HP.FPS + EPS);                            // the frame t falls in
HP.boil = (t, on = 2) => Math.floor(HP.frameNo(t) / on);                  // line boil: a new seed every `on` frames ("on twos")

// Math.random trap: during render(t) it is reseeded from the frame number, so stray calls stay frame-pure, and a WARN is
// raised (render.py video refuses to run with warnings). Outside render (setup) it is seeded from a fixed key (INFO only).
let RND = mulberry32(12345), IN_RENDER = false, RND_WARNED = false;
const realRandom = Math.random;
Math.random = function () {
  if (!RND_WARNED) {
    RND_WARNED = true;
    const where = (new Error().stack || '').split('\n').slice(2, 4).join(' | ');
    (IN_RENDER ? WARN : INFO).push(`Math.random() called ${IN_RENDER ? 'inside render(t)' : 'during setup'} (use HP.rng / HP.rand keyed by ids): ${where}`);
  }
  return RND();
};
HP._realRandom = realRandom;

// ============================================================ state (objects are filled in place at setup; never reassigned)
const ITEMS = HP.ITEMS = [], WARN = HP.WARN = [], INFO = HP.INFO = [];   // WARN blocks render.py video; INFO is printed only
const GRIDS = HP.GRIDS = {}, LAYOUT = HP.LAYOUT = {}, LOOK = HP.LOOK = {};
const LAYOUT_DEFAULTS = {};
HP.layoutDefaults = obj => Object.assign(LAYOUT_DEFAULTS, obj);          // modules add their LAYOUT defaults (EDL.layout wins)
HP.EDL = null;

// ============================================================ time references
// A time is a number (edit seconds), "grid:index" (fractional index interpolates; "riff:8.5" = the 8th after beat 8),
// "grid:index+0.05" / "-0.05" (offset s), {"at": <time>, "off": s}; and (rev2) "hb:<i>" = beat i of song/hits.json
// (i = 0 at the drop, song 19.232; prelude beats negative; "hb:8.5" = the 8th note after beat 8) and "song:<s>" = song second s,
// both mapped to edit time through the EDL's song segments (song.segments) or audio.songStart. A grid named hb/song wins.
function buildGrid(g) {
  if (Array.isArray(g)) return g.slice();
  const out = [], k0 = g.start || 0, tol = g.tol ?? 0.03;
  for (let i = 0; i < g.count; i++) {
    let x = g.origin + (k0 + i) * g.period;
    if (g.snap) { let best = null; for (const s of g.snap) if (Math.abs(s - x) <= tol && (best === null || Math.abs(s - x) < Math.abs(best - x))) best = s; if (best !== null) x = best; }
    out.push(+x.toFixed(4));
  }
  return out;
}
function gridAt(name, idx) {
  const g = GRIDS[name]; if (!g) throw new Error(`unknown beat grid "${name}"`);
  const at = k => k < 0 ? g[0] + k * (g[1] - g[0]) : k >= g.length ? g[g.length - 1] + (k - g.length + 1) * (g[g.length - 1] - g[g.length - 2]) : g[k];
  const i = Math.floor(idx + EPS), f = idx - i;
  return f > EPS ? lerp(at(i), at(i + 1), f) : at(i);
}
const TRE = /^([A-Za-z_][\w-]*):(-?[\d.]+)([+-][\d.]+)?$/;
function T(v, dflt) {
  if (v === undefined || v === null) return dflt;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const m = v.match(TRE);
    if (!m) { const n = parseFloat(v); if (!isNaN(n)) return n; throw new Error(`bad time "${v}"`); }
    const x = parseFloat(m[2]), off = m[3] ? parseFloat(m[3]) : 0;
    if (!GRIDS[m[1]] && m[1] === 'hb') return beatTime(x) + off;
    if (!GRIDS[m[1]] && m[1] === 'song') return editAt(x) + off;
    return gridAt(m[1], x) + off;
  }
  if (typeof v === 'object') return T(v.at) + (v.off || 0);
  throw new Error(`bad time ${JSON.stringify(v)}`);
}
HP.T = T; HP.gridAt = gridAt; HP.buildGrid = buildGrid;

// ---- song <-> edit time. EDL "song": {segments: [{in_s, out_s, at}]} (mixer form, spliced cuts) wins over audio.songStart.
let SEGS = null, SONG0 = 0;
function initSong(edl) {
  SONG0 = (edl.audio && edl.audio.songStart) ?? 0;
  const sg = edl.song && edl.song.segments;
  SEGS = null;
  if (sg && sg.length) { let at = 0; SEGS = sg.map(s => { at = T(s.at, at); const r = { at, in_s: s.in_s, out_s: s.out_s }; at += s.out_s - s.in_s; return r; }); }
}
function songAt(e) {   // edit -> song seconds
  if (SEGS) { for (let k = SEGS.length - 1; k >= 0; k--) if (e >= SEGS[k].at - 1e-9) return e - SEGS[k].at + SEGS[k].in_s; return e - SEGS[0].at + SEGS[0].in_s; }
  return e + SONG0;
}
function editAt(s, strict = true) {   // song -> edit seconds (NaN, or an error when strict, inside a cut of a spliced song)
  if (SEGS) {
    for (const g of SEGS) if (s >= g.in_s - 1e-6 && s <= g.out_s + 1e-6) return g.at + s - g.in_s;
    if (s < SEGS[0].in_s) return SEGS[0].at + s - SEGS[0].in_s;
    const L = SEGS[SEGS.length - 1]; if (s > L.out_s) return L.at + s - L.in_s;
    if (strict) throw new Error(`song ${s.toFixed(3)} s falls in a cut of the song (segments ${SEGS.map(g => g.in_s + '-' + g.out_s).join(', ')})`);
    return NaN;
  }
  return s - SONG0;
}
HP.songAt = songAt; HP.editAt = editAt;

// ---- song/hits.json: beats with flags (kick, snare, hat, accent, vocal...), beat 0 = the drop (song 19.232), prelude negative
const DEFAULT_SECTIONS = [   // song seconds (song/bars.json bar lines); hits.json "sections" overrides
  { name: 'mv-prelude', s0: 0, s1: 6.10 }, { name: 'prelude', s0: 6.10, s1: 18.25 }, { name: 'breath', s0: 18.25, s1: 19.232 },
  { name: 'riff', s0: 19.232, s1: 26.982 }, { name: 'verse1', s0: 26.982, s1: 42.493 }, { name: 'chorus', s0: 42.493, s1: 57.98 },
  { name: 'refrain', s0: 57.98, s1: 71.564 }, { name: 'god', s0: 71.564, s1: 73.445 }, { name: 'instrumental', s0: 73.445, s1: 80.68 },
  { name: 'verse2', s0: 80.68, s1: 1e9 },
];
const HITS = HP.hits = { ok: false, src: null, raw: null, list: [], byI: new Map(), min: 0, max: -1, period: 0.4839, drop: 19.232, vocals: [], words: [], sections: DEFAULT_SECTIONS };
function normHits(j, src) {
  const arr = j.beats || j.grid || [];
  let L = arr.map(b => typeof b === 'number' ? { t: b } : { ...b, t: b.t ?? b.song ?? b.time ?? b.s });
  const drop = j.drop ?? j.drop_s ?? 19.232;
  if (!L.length || L.some(b => (b.i ?? b.index ?? b.beat) === undefined || typeof (b.i ?? b.index ?? b.beat) !== 'number')) {
    let k0 = 0, best = 1e9; L.forEach((b, k) => { if (Math.abs(b.t - drop) < best) { best = Math.abs(b.t - drop); k0 = k; } });
    L.forEach((b, k) => { b.i = k - k0; });
  } else L.forEach(b => { b.i = b.i ?? b.index ?? b.beat; });
  L.sort((a, b) => a.i - b.i);
  HITS.list = L; HITS.byI = new Map(L.map(b => [b.i, b]));
  HITS.min = L.length ? L[0].i : 0; HITS.max = L.length ? L[L.length - 1].i : -1;
  const d = []; for (let k = 1; k < L.length; k++) if (L[k].i - L[k - 1].i === 1) d.push(L[k].t - L[k - 1].t);
  d.sort((a, b) => a - b);
  HITS.period = j.period ?? j.beat_s ?? (d.length ? d[d.length >> 1] : 0.4839);
  HITS.drop = drop;
  const iv = j.vocal_intervals || j.vocals || [];
  HITS.vocals = iv.map(v => Array.isArray(v) ? [v[0], v[1]] : [v.s ?? v.start ?? v.t0, v.e ?? v.end ?? v.t1]);
  HITS.words = j.words || j.brutal_words || j.refined_words || [];
  HITS.sections = (j.sections || DEFAULT_SECTIONS).map(s => ({ name: s.name, s0: s.s0 ?? s.start ?? s.t0, s1: s.s1 ?? s.end ?? s.t1 }));
  HITS.raw = j; HITS.src = src; HITS.ok = true;
}
function songOfBeat(i) {   // song seconds of integer beat i (extrapolates with the period outside the measured list)
  const b = HITS.byI.get(i); if (b) return b.t;
  if (!HITS.list.length) return HITS.drop + i * HITS.period;
  if (i < HITS.min) return HITS.byI.get(HITS.min).t + (i - HITS.min) * HITS.period;
  if (i > HITS.max) return HITS.byI.get(HITS.max).t + (i - HITS.max) * HITS.period;
  let a = i - 1; while (!HITS.byI.has(a)) a--; let c = i + 1; while (!HITS.byI.has(c)) c++;
  return lerp(HITS.byI.get(a).t, HITS.byI.get(c).t, (i - a) / (c - a));
}
function beatSong(x) { const i = Math.floor(x + EPS), f = x - i; return f > EPS ? lerp(songOfBeat(i), songOfBeat(i + 1), f) : songOfBeat(i); }
function beatTime(x) { return editAt(beatSong(x)); }
HP.beat = beatTime;                     // edit seconds of beat x (fractional = between beats); throws inside a song cut
HP.beatSong = beatSong;                 // song seconds of beat x
HP.beatInfo = i => HITS.byI.get(i) || null;   // the beat's flags as in hits.json ({i, t, kick, snare, hat, accent, vocal, ...})
function beatAtSong(s) {                // fractional beat index at song second s
  const L = HITS.list;
  if (!L.length) return (s - HITS.drop) / HITS.period;
  if (s <= L[0].t) return L[0].i + (s - L[0].t) / HITS.period;
  if (s >= L[L.length - 1].t) return L[L.length - 1].i + (s - L[L.length - 1].t) / HITS.period;
  let lo = 0, hi = L.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m].t <= s) lo = m; else hi = m; }
  return L[lo].i + (L[hi].i - L[lo].i) * (s - L[lo].t) / (L[hi].t - L[lo].t);
}
HP.beatAt = t => beatAtSong(songAt(t));          // fractional beat index at edit time t (phase = x - floor(x))
// beats inside [t0, t1) in edit time that the cut actually plays. opts: {step: 1 | 0.5 | 0.25 (subdivisions, flagged sub: true),
// where: 'snare' | ['kick', 'accent'] | fn(beat) (any flag true), from / to (beat indices)}. Returns [{i, t, song, section, ...flags}].
HP.beatsIn = (t0 = -1e9, t1 = 1e9, opts = {}) => {
  const step = opts.step || 1, out = [];
  const where = typeof opts.where === 'function' ? opts.where : opts.where ? (b => [].concat(opts.where).some(k => b[k])) : null;
  const lo = opts.from ?? (HITS.list.length ? HITS.min : -64), hi = opts.to ?? (HITS.list.length ? HITS.max : 200);
  const n = Math.round((hi - lo) / step);
  for (let k = 0; k <= n; k++) {
    const x = +(lo + k * step).toFixed(6), whole = Math.abs(x - Math.round(x)) < EPS;
    const s = beatSong(x), e = editAt(s, false);
    if (isNaN(e) || e < t0 - EPS || e >= t1 - EPS) continue;
    const info = whole ? (HITS.byI.get(Math.round(x)) || { i: x }) : { i: x, sub: true };
    const b = { ...info, i: x, t: e, song: s, section: sectionAtSong(s) };
    if (where && !where(b)) continue;
    out.push(b);
  }
  return out;
};
function sectionAtSong(s) { for (const q of HITS.sections) if (s >= q.s0 - EPS && s < q.s1 - EPS) return q.name; return ''; }
HP.sectionAt = t => sectionAtSong(songAt(t));
HP.vocalAt = t => { const s = songAt(t); return HITS.vocals.some(([a, b]) => s >= a && s < b); };

// theme ranges: EDL.themes = [{"t0", "t1", "theme": "light" | "dark"}]
function themeAt(t) {
  for (const s of (HP.EDL.themes || [])) if (t >= T(s.t0) - EPS && t < T(s.t1, 1e9) - EPS) return s.theme;
  return 'dark';
}
HP.themeAt = themeAt;

// ============================================================ schedule marks (what beatcheck.py counts as "something on the beat")
const SCHED = HP.SCHED = [];
HP.mark = (t, id = '', what = '') => { if (typeof t === 'number' && isFinite(t)) SCHED.push({ t: +t.toFixed(4), id, what }); };

// ============================================================ camera stack (global; the #cam layer) and flashes
// hit:   the legacy shake (decaying 23/19 Hz wobble, px).     punch: zoom impulse (+amount, decays).
// spin:  rotation impulse (deg, decays).                     jolt:  translation impulse (px, decays).
// add(fn): a continuous source fn(t) -> {dx, dy, rot, zoom}  (e.g. a slow push or a sway; must be t-pure).
// The camera covers the frame on rotation (zoom >= the cover scale) unless EDL.camera.cover === false.
const CAM = { hits: [], imps: [], srcs: [], cover: true, promote: false };
function impulse(t, t0, decay) { if (t < t0 - EPS) return 0; const a = Math.exp(-(t - t0) / decay); return a < 1e-3 ? 0 : a; }
HP.cam = {
  hit(t, amp, decay = 0.11) { if (amp > 0) { CAM.hits.push({ t, amp, decay }); HP.mark(t, 'cam', 'hit'); } },
  punch(t, amount = 0.05, decay = 0.12) { CAM.imps.push({ t, k: 'zoom', a: amount, decay }); HP.mark(t, 'cam', 'punch'); },
  spin(t, deg = 2, decay = 0.15) { CAM.imps.push({ t, k: 'rot', a: deg, decay }); HP.mark(t, 'cam', 'spin'); },
  jolt(t, dx = 0, dy = 0, decay = 0.1) { CAM.imps.push({ t, k: 'xy', a: 1, dx, dy, decay }); HP.mark(t, 'cam', 'jolt'); },
  add(fn) { CAM.srcs.push(fn); },
  shake(t) {
    let dx = 0, dy = 0;
    for (const h of CAM.hits) {
      if (t < h.t - EPS) continue;
      const a = h.amp * Math.exp(-(t - h.t) / h.decay);
      if (a < 0.05) continue;
      dx += a * Math.sin(2 * Math.PI * 23 * (t - h.t) + h.t * 7.1);
      dy += a * Math.cos(2 * Math.PI * 19 * (t - h.t) + h.t * 3.3);
    }
    return [dx, dy];
  },
  at(t) {
    const [sx, sy] = HP.cam.shake(t);
    const c = { dx: sx, dy: sy, rot: 0, zoom: 1 };
    for (const q of CAM.imps) {
      const a = impulse(t, q.t, q.decay); if (!a) continue;
      if (q.k === 'zoom') c.zoom *= 1 + q.a * a; else if (q.k === 'rot') c.rot += q.a * a; else { c.dx += q.dx * a; c.dy += q.dy * a; }
    }
    for (const f of CAM.srcs) {
      const r = f(t); if (!r) continue;
      c.dx += r.dx || 0; c.dy += r.dy || 0; c.rot += r.rot || 0; if (r.zoom) c.zoom *= r.zoom;
    }
    if (CAM.cover && c.rot) {
      const a = Math.abs(c.rot) * Math.PI / 180, co = Math.cos(a), si = Math.sin(a);
      c.zoom = Math.max(c.zoom, co + si * H / W, co + si * W / H);
    }
    return c;
  },
  css(t) {
    const c = HP.cam.at(t);
    // integrator (rev2): with HP.cam.promote, a zoom within 2e-4 of 1 (0.2 px at the frame edge) and a rotation under 0.01 deg
    // count as none (the leftovers of decaying impulses), so those frames composite as a plain translation
    if (CAM.promote && Math.abs(c.zoom - 1) < 2e-4 && Math.abs(c.rot) < 0.01) { c.zoom = 1; c.rot = 0; }
    if (!c.rot && c.zoom === 1) return (c.dx || c.dy) ? `translate(${c.dx.toFixed(2)}px,${c.dy.toFixed(2)}px)` : '';
    return `translate(${c.dx.toFixed(2)}px,${c.dy.toFixed(2)}px) rotate(${c.rot.toFixed(3)}deg) scale(${c.zoom.toFixed(5)})`;
  },
  // Camera promotion (integrator, rev2). A promoted #cam (will-change: transform) renders camera zooms and rotations ~1.6x faster
  // than a plain one, but Chromium keeps a promoted layer's raster scale (and its descendants' composited state) from earlier
  // frames, so a frame's pixels depended on the frames rendered before it (regress.py det on test-singularity: mean up to 2.4,
  // screenshot cards and their DOM text rastered at a stale scale). So renderAsync(t) starts every frame of a promoted camera by
  // dropping #cam's compositor layers (display: none for two animation frames), and the frame is rastered from scratch at its own
  // scale: render order no longer matters, at ~+40-80 ms a frame. Modules ask for it with HP.cam.promote() (beatfx does when an EDL
  // has a beat track); legacy EDLs never promote and render exactly as before. ?camreset=0 turns the reset off (measuring only).
  promote() { if (!CAM.promote) { CAM.promote = true; HP.css('#cam { will-change: transform; }'); } },
  promoted() { return CAM.promote; },
  apply(t) { HP.layers.cam.style.transform = HP.cam.css(t); },
};
const FLASHES = [];
HP.flash = (t, opacity = 0.8, decay = 0.12, color = '#FFFFFF') => { FLASHES.push({ t, opacity, decay, color }); HP.mark(t, 'flash', 'flash'); };
function flashAt(t) {
  let op = 0, col = '#FFFFFF';
  for (const f of FLASHES) {
    if (t < f.t - EPS) continue;
    const o = f.opacity * Math.exp(-(t - f.t) / f.decay);
    if (o > op) { op = o; col = f.color; }
  }
  return [op < 0.01 ? 0 : op, col];
}

// ============================================================ enter / exit envelopes (shared by every item)
// enter/exit: "cut" | "fade" | "flicker" | "slam" | "rise" | "drop", or {"style": ..., "dur": s}; exit also "push"
function envOf(spec, dflt) { if (!spec) return { style: dflt, dur: null }; return typeof spec === 'string' ? { style: spec, dur: null } : { ...spec, style: spec.style || dflt, dur: spec.dur ?? null }; }
function envelope(it, t) {
  const { oCub, oBack, iCub } = ease;
  const r = { op: 1, sc: 1, tx: 0, ty: 0 };
  const en = it.enter, ex = it.exit, lt = t - it.t0, rt = it.t1 - t;
  const kf = Math.floor(lt * HP.FPS + EPS);           // frames since the item began
  switch (en.style) {
    case 'fade': r.op *= pr(lt, 0, en.dur ?? 0.2); break;
    case 'flicker': r.op *= [1, 0.2, 1][kf] ?? 1; break;
    case 'slam': { const u = pr(lt, 0, en.dur ?? 0.16); r.sc *= lerp(1.14, 1, oCub(u)); break; }
    case 'rise': { const u = oCub(pr(lt, 0, en.dur ?? 0.25)); r.ty += lerp(46, 0, u); r.op *= u; break; }
    case 'drop': { const u = pr(lt, 0, en.dur ?? 0.2); r.ty += lerp(-60, 0, oBack(u, 2)); r.op *= clamp(u * 4); break; }
  }
  const kr = Math.floor(rt * HP.FPS + EPS);           // frames left
  switch (ex.style) {
    case 'fade': r.op *= pr(rt, 0, ex.dur ?? 0.2); break;
    case 'flicker': r.op *= [0.12, 1, 0.45][kr] ?? 1; break;
    case 'push': { const u = 1 - pr(rt, 0, ex.dur ?? 0.12); r.sc *= lerp(1, 1.08, iCub(u)); r.op *= 1 - u; break; }
  }
  return r;
}
HP.envOf = envOf; HP.envelope = envelope;

// ============================================================ item base
// Every EDL item becomes an Item: t0/t1 (any time ref), enter/exit envelopes on its layer div (this.el), theme, bg, hit,
// shakes, kicks, flash, z, overlay (the unshaken #fx layer), debug label. Subclass it (HP.register(type, Class)) or register
// a spec object (HP.register(type, {build, load, layout, prepare, draw, texts})), which core wraps in a SpecItem.
class Item {
  constructor(d) {
    this.d = d; this.id = d.id || `${d.type}${ITEMS.length}`; this.type = d.type;
    this.t0 = T(d.t0, 0); this.t1 = T(d.t1, this.t0 + (d.dur || 1));
    this.enter = envOf(d.enter, 'cut'); this.exit = envOf(d.exit, 'cut');
    this.el = el('div', 'layer', d.overlay ? $('fx') : $('cam'));
    this.el.dataset.id = this.id;
    // theme: "light" (ink text, for the cream ground) or "dark"; default from EDL.themes by the item's t0
    this.theme = d.theme || themeAt(this.t0);
    if (this.theme === 'light') this.el.classList.add('light');
    if (d.z !== undefined) this.el.style.zIndex = d.z;
    // secondary mono lines (attribution, role, source, labels) and stamp names: px, from the item or EDL.layout (meta 38, name 40)
    const meta = d.meta ?? LAYOUT.meta, name = d.name_px ?? LAYOUT.name;
    if (meta) this.el.style.setProperty('--meta', meta + 'px');
    if (name) this.el.style.setProperty('--name', name + 'px');
    if (d.bg) el('div', 'bg', this.el, { background: d.bg });
    if (d.hit) HP.cam.hit(this.t0, d.hit.amp ?? d.hit, d.hit.decay);
    // r3 "shakes": [{at, amp, decay}] extra camera hits inside the item's life (a beat-locked event during a long hold)
    for (const h of (d.shakes || [])) HP.cam.hit(T(h.at), h.amp ?? 8, h.decay);
    // r6 (long) "kicks": [{at, s (1.02), dur (0.16)}] beat-locked scale bumps of the WHOLE item; "kickOrigin" [x, y] px
    if (d.kicks) { this.kicks = d.kicks.map(k => ({ t: T(k.at), s: k.s ?? 1.02, dur: k.dur ?? 0.16 })); for (const k of this.kicks) HP.mark(k.t, this.id, 'kick'); }
    if (d.flash) HP.flash(this.t0, d.flash.opacity ?? 0.8, d.flash.decay ?? 0.12, d.flash.color);
    HP.mark(this.t0, this.id, 'in');
    if (HP.DEBUG) { const b = el('div', 'dbg' + (d.verified === false ? ' bad' : ''), this.el, { top: '1820px' }); b.textContent = `${this.id} ${this.t0.toFixed(2)}-${this.t1.toFixed(2)}${d.verified === false ? '  UNVERIFIED' : ''}`; }
  }
  async load() {}
  layout() {}
  active(t) { return t >= this.t0 - EPS && t < this.t1 - EPS; }
  async prepare(t) {}
  frame(t) {
    if (!this.active(t)) {
      if (this.shown) { this.el.style.display = 'none'; this.shown = false; if (this._att) for (const n of this._att) n.style.display = 'none'; }
      return;
    }
    if (!this.shown) { this.el.style.display = 'block'; this.shown = true; if (this._att) for (const n of this._att) n.style.display = ''; }
    // items with frames/bands animate their own parts (morph, pop, fly, collapse...): the whole layer only fades
    const e = this.ownMotion ? { op: 1, sc: 1, tx: 0, ty: 0 } : envelope(this, t);
    this.el.style.opacity = e.op;
    if (this.kicks) {   // r6: the strongest beat kick in progress multiplies the layer's scale
      let k = 1;
      for (const q of this.kicks) { if (t < q.t - EPS) continue; const u = pr(t, q.t, q.dur); if (u < 1) k = Math.max(k, lerp(q.s, 1, ease.oCub(u))); }
      e.sc *= k;
      const O = this.d.kickOrigin; if (O) this.el.style.transformOrigin = `${O[0]}px ${O[1]}px`;
    }
    this.el.style.transform = (e.sc !== 1 || e.tx || e.ty) ? `translate(${e.tx}px,${e.ty}px) scale(${e.sc})` : '';
    if (this._att) for (const n of this._att) n.style.opacity = e.op;
    this.draw(t, t - this.t0);
  }
  draw(t, lt) {}
  // ---- helpers for module items
  lt(t) { return t - this.t0; }
  life(t) { return clamp((t - this.t0) / Math.max(1e-3, this.t1 - this.t0)); }   // 0..1 over the item's life
  canvas(css) {   // a full-frame 2D canvas in this item's layer (clear and redraw it in draw(): frames must be independent)
    const cv = el('canvas', '', this.el, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px', ...(css || {}) });
    cv.width = W; cv.height = H; return { cv, ctx: cv.getContext('2d') };
  }
  svg(attrs) { return sv('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, style: 'position:absolute;left:0;top:0;overflow:visible', ...(attrs || {}) }, this.el); }
  // a node outside this.el (e.g. a <g> in a shared svg) that should show/hide and fade with this item
  attach(node) { (this._att || (this._att = [])).push(node); node.style.display = 'none'; return node; }
  mark(t, what = '') { HP.mark(typeof t === 'number' ? t : T(t), this.id, what); }
  imagery(node) { return HP.markImagery(node, this.id); }
  // texts on screen, for coverage.py: [{text, reveal: 'words' | 'chars' | 'highlight' | 'stroke' | 'none' | ..., role: 'main' | 'meta'}]
  texts() { return []; }
}
HP.Item = Item;

// ============================================================ registry
const TYPES = HP.TYPES = {}, FXS = HP.FXS = {}, SPEC_OF = {};
class SpecItem extends Item {
  constructor(d, spec) {
    if (spec.overlay) d.overlay = true;
    super(d);
    this.spec = spec;
    if (spec.ownMotion) this.ownMotion = true;
    if (spec.build) spec.build(this, HP);
  }
  async load() { if (this.spec.load) await this.spec.load(this, HP); }
  layout() { if (this.spec.layout) this.spec.layout(this, HP); }
  async prepare(t) { if (this.spec.prepare) await this.spec.prepare(this, t, HP); }
  draw(t) { if (this.spec.draw) this.spec.draw(this, t, HP); }
  texts() { return this.spec.texts ? this.spec.texts(this, HP) : []; }
}
HP.SpecItem = SpecItem;
// HP.register('splat', {build(item, ctx), draw(item, t, ctx), load?, layout?, prepare?, texts?, ownMotion?, overlay?, imagery?})
// or HP.register('splat', class extends HP.Item {...}). A later registration of the same type replaces the earlier (INFO).
HP.register = (type, impl) => {
  if (TYPES[type]) INFO.push(`type "${type}" re-registered by a later module`);
  if (typeof impl === 'function') TYPES[type] = impl;
  else { SPEC_OF[type] = impl; TYPES[type] = class extends SpecItem { constructor(d) { super(d, impl); } }; }
};
// HP.registerFX('punch', fn(ev, ctx)) or {build(ev, ctx), draw(ev, t, ctx)}: an EDL "fx" event; ev.times = its edit times
HP.registerFX = (name, impl) => {
  if (FXS[name]) INFO.push(`fx "${name}" re-registered by a later module`);
  FXS[name] = typeof impl === 'function' ? { build: impl } : impl;
};
const HOOKS = { setup: [], built: [], ready: [], frame: [], post: [] };
// hooks: setup (EDL loaded, before items), built (items constructed), ready (after load+layout), frame(t) (before items draw),
// post(t) (after items and fx draw). All must be t-pure.
HP.on = (hook, fn) => { (HOOKS[hook] || (HOOKS[hook] = [])).push(fn); };

// ---- FX events: EDL "fx": [{"fx": "punch", "at": "hb:4"} | {"fx": ..., "on": <beats>}, ...]
// on: ["hb:0", 3.2, ...] | "hb:0..31" (inclusive) | {"from": "hb:0", "to": "hb:31", "every": 1 | 0.5, "where": "snare" | [...], "skip": [i]}
// An "on" given in beats also fills ev.beats ([{i, t, song, section, ...flags}]).
const FXEV = [];
function fxTimes(ev) {
  if (ev.at !== undefined) return { times: [T(ev.at)], beats: null };
  const on = ev.on;
  if (Array.isArray(on)) return { times: on.map(x => T(x)), beats: null };
  let from, to, every = 1, where = null, skip = [];
  if (typeof on === 'string') {
    const m = on.match(/^hb:(-?[\d.]+)\.\.(-?[\d.]+)$/); if (!m) throw new Error(`fx ${ev.id || ev.fx}: bad "on" ${on}`);
    from = +m[1]; to = +m[2];
  } else if (on && typeof on === 'object') {
    const bi = v => typeof v === 'string' && v.startsWith('hb:') ? parseFloat(v.slice(3)) : v;
    from = bi(on.from); to = bi(on.to); every = on.every || 1; where = on.where || null; skip = on.skip || [];
  } else throw new Error(`fx ${ev.id || ev.fx}: needs "at" or "on"`);
  const beats = HP.beatsIn(-1e9, 1e9, { from, to, step: every, where }).filter(b => !skip.includes(b.i));
  return { times: beats.map(b => b.t), beats };
}
HP.fxTimes = fxTimes;

// ============================================================ layers
// #stage > #cam (camera transform; item layers in EDL order) | #fx (overlays, unshaken: grain, vignette) | #flash | #top (guides)
// Shared full-frame layers: HP.shared('paint') (2D canvas, cleared before every frame) or HP.shared('ink', 'svg').
// They stack where a {"type": "layer", "id": "paint"} item sits in the EDL; undeclared ones go on top of #cam.
const SHARED = HP.SHARED = {};
let SHARED_LATE = false;
HP.layers = {};
HP.shared = (name, kind = 'canvas', opts = {}) => {
  let L = SHARED[name];
  if (L) return L;
  L = SHARED[name] = { name, kind, clear: opts.clear !== false };
  if (kind === 'canvas') {
    L.el = L.cv = el('canvas', 'shared', null, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px', pointerEvents: 'none' });
    L.cv.width = W; L.cv.height = H; L.ctx = L.cv.getContext('2d');
  } else {
    L.el = L.svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, style: 'position:absolute;left:0;top:0;overflow:visible;pointer-events:none' });
  }
  L.el.dataset.shared = name;
  if (SHARED_LATE && HP.layers.cam) HP.layers.cam.appendChild(L.el);   // first asked for after setup: on top of #cam
  return L;
};
HP.register('layer', class LayerItem extends Item {
  constructor(d) { d.t0 = d.t0 ?? 0; d.t1 = d.t1 ?? 1e9; super(d); this.L = HP.shared(d.id, d.kind || 'canvas', d); this.el.appendChild(this.L.el); }
});

// ============================================================ text measure / wrap (canvas metrics; fonts are loaded before items build)
const MC = document.createElement('canvas').getContext('2d');
const MCACHE = new Map();
HP.text = {
  // {family: "'Newsreader', serif", weight: 500, size: 64, style: 'italic'} -> CSS font string
  font(f) { return typeof f === 'string' ? f : `${f.style || 'normal'} ${f.weight || 400} ${f.size || 16}px ${f.family || "'IBM Plex Mono', monospace"}`; },
  measure(str, font, tracking = 0) {   // advance width in px (tracking in px per glyph)
    const F = HP.text.font(font), k = F + '|' + tracking + '|' + str;
    let w = MCACHE.get(k);
    if (w === undefined) { MC.font = F; w = MC.measureText(str).width + tracking * [...str].length; MCACHE.set(k, w); }
    return w;
  },
  // greedy wrap; opts {lh (px line height, default 1.15 * size), tracking, balance (equalise line widths, same line count)}
  // -> {lines: [{text, w, y, words: [{w: word, x, width, i}]}], width, height}
  wrap(str, font, maxW, opts = {}) {
    const F = HP.text.font(font), size = typeof font === 'object' ? (font.size || 16) : parseFloat(String(F).match(/(\d+(?:\.\d+)?)px/)?.[1] || 16);
    const lh = opts.lh ?? size * 1.15, tr = opts.tracking || 0, words = String(str).split(/\s+/).filter(Boolean);
    const sp = HP.text.measure(' ', F, tr);
    const run = (limit) => {
      const lines = []; let cur = [], x = 0;
      words.forEach((w, i) => {
        const ww = HP.text.measure(w, F, tr);
        if (cur.length && x + sp + ww > limit + 0.01) { lines.push(cur); cur = []; x = 0; }
        cur.push({ w, x: cur.length ? x + sp : 0, width: ww, i }); x = (cur.length > 1 ? x + sp : 0) + ww;
      });
      if (cur.length) lines.push(cur);
      return lines;
    };
    let L = run(maxW);
    if (opts.balance && L.length > 1) {
      let lo = 0, hi = maxW;
      for (let k = 0; k < 18; k++) { const m = (lo + hi) / 2; if (run(m).length > L.length) lo = m; else hi = m; }
      L = run(hi);
    }
    const lines = L.map((ws, k) => ({ text: ws.map(q => q.w).join(' '), w: ws.length ? ws[ws.length - 1].x + ws[ws.length - 1].width : 0, y: k * lh, words: ws }));
    return { lines, width: Math.max(0, ...lines.map(l => l.w)), height: lines.length * lh, lh };
  },
  // the largest size (<= font.size) at which str fits maxW x maxH (lines wrap); returns {size, wrap}
  fit(str, font, maxW, maxH, opts = {}) {
    let s = font.size || 64;
    for (; s > (opts.min || 12); s -= 1) { const r = HP.text.wrap(str, { ...font, size: s }, maxW, { ...opts, lh: opts.lhK ? s * opts.lhK : undefined }); if (r.height <= maxH && r.width <= maxW + 0.5) return { size: s, wrap: r }; }
    return { size: s, wrap: HP.text.wrap(str, { ...font, size: s }, maxW, opts) };
  },
  words(str) { return String(str).split(/\s+/).filter(Boolean); },
};

// ============================================================ assets (decode-awaited). Paths: relative to render/video/
// (e.g. "cache/<id>/image.jpg"), or project-rooted "song/...", "research/...", "brand/..." (render.py serves those prefixes).
const PENDING = [];
HP.url = p => /^(\/|https?:|data:|blob:)/.test(p) ? p : /^(song|research|brand)\//.test(p) ? '/' + p : p;
const IMGS = new Map(), JSONS = new Map(), TEXTS = new Map();
HP.assets = {
  image(src) {   // -> Promise<HTMLImageElement | null> (decoded); draw with HP.assets.imageNow(src)
    const u = HP.url(src); let p = IMGS.get(u);
    if (!p) {
      const im = new Image(); im.src = u;
      p = im.decode().then(() => im, () => { WARN.push(`image ${src}: could not load/decode`); return null; });
      p.im = im; IMGS.set(u, p); PENDING.push(p);
    }
    return p;
  },
  imageNow(src) { const p = IMGS.get(HP.url(src)); return p && p.im && p.im.complete && p.im.naturalWidth ? p.im : null; },
  json(src) { const u = HP.url(src); let p = JSONS.get(u); if (!p) { p = fetch(u, { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error(`${src}: HTTP ${r.status}`); return r.json(); }); JSONS.set(u, p); PENDING.push(p.catch(() => null)); } return p; },
  text(src) { const u = HP.url(src); let p = TEXTS.get(u); if (!p) { p = fetch(u, { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error(`${src}: HTTP ${r.status}`); return r.text(); }); TEXTS.set(u, p); PENDING.push(p.catch(() => null)); } return p; },
  async svg(src) { const s = await HP.assets.text(src); const doc = new DOMParser().parseFromString(s, 'image/svg+xml'); return document.importNode(doc.documentElement, true); },
  // a pre-extracted frame sequence (prep_clips.py: cache/<folder>/00001.jpg..., meta.json). seq.get(n) -> Promise<img>,
  // seq.now(n) -> decoded img or null, seq.frameAt(lt, speed) -> 1-based frame number at item-local time lt
  frames(folder) {
    const base = folder.endsWith('/') ? folder : folder + '/';
    const seq = { base, meta: null, imgs: new Map(), keep: 24 };
    seq.ready = HP.assets.json(base + 'meta.json').then(m => (seq.meta = m), () => { WARN.push(`frames ${base}: no meta.json (run prep_clips.py)`); return null; });
    seq.count = () => seq.meta ? seq.meta.count : 0;
    seq.frameAt = (lt, speed = 1) => clamp(Math.floor(lt * HP.FPS * speed + EPS) + 1, 1, Math.max(1, seq.count()));
    seq.get = n => {
      let p = seq.imgs.get(n);
      if (!p) {
        const im = new Image(); im.src = HP.url(base + String(n).padStart(5, '0') + '.jpg');
        p = im.decode().then(() => im, () => null); p.im = im; seq.imgs.set(n, p);
        if (seq.imgs.size > seq.keep) seq.imgs.delete(seq.imgs.keys().next().value);
      }
      return p;
    };
    seq.now = n => { const p = seq.imgs.get(n); return p && p.im && p.im.complete && p.im.naturalWidth ? p.im : null; };
    seq.prepare = async (n, ahead = 3) => { for (let k = 1; k <= ahead; k++) if (n + k <= seq.count()) seq.get(n + k); return seq.get(n); };
    return seq;
  },
  track(p) { PENDING.push(p); return p; },
  async wait() { let n = 0; while (n !== PENDING.length) { n = PENDING.length; await Promise.all(PENDING.slice()); } },
};
HP.markImagery = (node, id = 1) => { if (node && node.dataset) node.dataset.hpImg = id; return node; };
// pure caches (style.md: bake finished strokes, bled words, landed splats once). The value must depend ONLY on the key
// (put the item id, the stroke index, the boil step... in it), never on which frames were rendered before.
const MEMO = new Map();
HP.memo = (key, fn) => { let v = MEMO.get(key); if (v === undefined) { v = fn(); MEMO.set(key, v); } return v; };
HP.offscreen = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

// ============================================================ vendored libraries (fx/index.json "vendor"); HP.lib.<module> for builders
const LIBSRC = {}, LIBP = {};
HP.lib = {
  // load a vendored script once (HP.lib.load('mathjax')); eager ones are loaded before the EDL
  load(name) {
    if (LIBP[name]) return LIBP[name];
    const v = LIBSRC[name]; if (!v) return Promise.reject(new Error(`unknown vendor lib "${name}"`));
    if (v.pre) v.pre();
    LIBP[name] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = v.src; s.onload = res; s.onerror = () => rej(new Error(`could not load ${v.src}`)); document.head.appendChild(s); })
      .then(() => v.post ? v.post() : null);
    return LIBP[name];
  },
};
// rough.js: seeded wrappers (rough falls back to Math.random without a seed). HP.lib.rough.canvas(cv, key) / .svg(svgEl, key) /
// .generator(key); every shape gets options.seed = HP.hash(key) unless one is given. HP.lib.rough.raw is the library itself.
function seededRough(raw) {
  const wrap = (obj, key) => new Proxy(obj, { get(o, p) { const f = o[p]; if (typeof f !== 'function') return f;
    return (...a) => { const last = a[a.length - 1], isOpt = last && typeof last === 'object' && !Array.isArray(last) && !(last instanceof Node);
      if (isOpt) { if (!last.seed) a[a.length - 1] = { ...last, seed: (HP.hash(key, p, JSON.stringify(a.slice(0, -1)).slice(0, 200)) % 2147483646) + 1 }; }
      else if (['line', 'rectangle', 'ellipse', 'circle', 'linearPath', 'polygon', 'arc', 'curve', 'path'].includes(p)) a.push({ seed: (HP.hash(key, p, JSON.stringify(a).slice(0, 200)) % 2147483646) + 1 });
      return f.apply(o, a); }; } });
  return {
    raw,
    canvas: (cv, key = 'rough') => wrap(raw.canvas(cv), key),
    svg: (svgEl, key = 'rough') => wrap(raw.svg(svgEl), key),
    generator: (key = 'rough') => wrap(raw.generator(), key),
  };
}
const VENDOR_HOOKS = {
  rough: { post() { HP.lib.rough = seededRough(window.rough); } },
  freehand: { post() { const F = window.PerfectFreehand; HP.lib.freehand = { getStroke: F.getStroke, getStrokePoints: F.getStrokePoints, getStrokeOutlinePoints: F.getStrokeOutlinePoints,
    // outline points -> SVG path data / canvas Path2D (closed, quadratic-smoothed)
    toPath(pts) { if (!pts.length) return ''; const d = pts.reduce((acc, [x0, y0], i, arr) => { const [x1, y1] = arr[(i + 1) % arr.length]; acc.push(x0.toFixed(2), y0.toFixed(2), ((x0 + x1) / 2).toFixed(2), ((y0 + y1) / 2).toFixed(2)); return acc; }, ['M', ...pts[0].map(v => v.toFixed(2)), 'Q']); d.push('Z'); return d.join(' '); },
    path2d(pts) { return new Path2D(HP.lib.freehand.toPath(pts)); } }; } },
  mathjax: {
    pre() { window.MathJax = { loader: { load: [] }, startup: { typeset: false }, options: { enableMenu: false }, svg: { fontCache: 'none' }, tex: { packages: { '[+]': ['ams'] } } }; },
    async post() {
      await window.MathJax.startup.promise;
      // HP.lib.mathjax.svg(tex, {px: 64 (em size), display: true, color}) -> {svg (SVGElement, px-sized), w, h, baseline}
      HP.lib.mathjax.svg = (tex, o = {}) => {
        const px = o.px || 64;
        const node = window.MathJax.tex2svg(tex, { display: o.display !== false, em: px, ex: px / 2, containerWidth: 80 * px });
        const s = node.querySelector('svg');
        const vb = s.getAttribute('viewBox').split(/\s+/).map(Number), k = px / 1000;
        const w = vb[2] * k, h = vb[3] * k, base = (vb[3] + vb[1]) * k;   // viewBox y0 is negative (above the baseline)
        s.setAttribute('width', w.toFixed(2)); s.setAttribute('height', h.toFixed(2));
        s.removeAttribute('style'); s.setAttribute('style', 'overflow:visible');
        if (o.color) s.setAttribute('color', o.color);
        return { svg: s, w, h, baseline: h - base };
      };
    }
  },
};
HP.lib.mathjax = { load: () => HP.lib.load('mathjax'), svg() { throw new Error('HP.lib.mathjax: call await HP.lib.mathjax.load() first (in your item load())'); } };

// ============================================================ module loader
async function loadCSS(href) { await new Promise((res, rej) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.onload = res; l.onerror = () => rej(new Error(`could not load ${href}`)); document.head.appendChild(l); }); }
async function loadJS(src) { await new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error(`could not load ${src}`)); document.head.appendChild(s); }); }
HP.loadCSS = loadCSS;
HP.css = text => { const s = document.createElement('style'); s.textContent = text; document.head.appendChild(s); return s; };

// ============================================================ render
let FXDRAW = [];
function render(t) {
  IN_RENDER = true; RND = mulberry32(HP.hash('frame', HP.frameNo(t)));
  try {
    HP.t = t;
    for (const k in SHARED) { const L = SHARED[k]; if (L.kind === 'canvas' && L.clear) { L.ctx.setTransform(1, 0, 0, 1, 0, 0); L.ctx.globalAlpha = 1; L.ctx.globalCompositeOperation = 'source-over'; L.ctx.clearRect(0, 0, W, H); } }
    for (const f of HOOKS.frame) f(t);
    HP.cam.apply(t);
    for (const it of ITEMS) it.frame(t);
    for (const [ev, spec] of FXDRAW) spec.draw(ev, t, HP);
    for (const f of HOOKS.post) f(t);
    const [fo, fc] = flashAt(t);
    HP.layers.flash.style.opacity = fo; HP.layers.flash.style.background = fc;
  } finally { IN_RENDER = false; }
}
const CAMRESET = new URLSearchParams(location.search).get('camreset') !== '0';
const twoFrames = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
async function renderAsync(t) {
  if (CAM.promote && CAMRESET) {   // see HP.cam.promote: no compositor history carried into this frame
    const c = HP.layers.cam; c.style.display = 'none'; await twoFrames(); c.style.display = '';
  }
  await Promise.all(ITEMS.map(it => it.prepare(t)));
  render(t);
}
HP.render = render; HP.renderAsync = renderAsync;
window.render = render; window.renderAsync = renderAsync;

// ============================================================ probes for the check tools (render/video/check/)
function effOpacity(e) {
  let op = 1;
  for (let n = e; n && n !== HP.layers.stage; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
    op *= parseFloat(cs.opacity);
    if (op < 0.01) return 0;
  }
  return op;
}
function clipRect(e, r) {   // intersect with every overflow-clipping ancestor and the frame
  let x0 = r.left, y0 = r.top, x1 = r.right, y1 = r.bottom;
  for (let n = e.parentElement; n && n !== HP.layers.stage; n = n.parentElement) {
    if (getComputedStyle(n).overflow === 'visible') continue;
    const q = n.getBoundingClientRect(); x0 = Math.max(x0, q.left); y0 = Math.max(y0, q.top); x1 = Math.min(x1, q.right); y1 = Math.min(y1, q.bottom);
  }
  x0 = Math.max(x0, 0); y0 = Math.max(y0, 0); x1 = Math.min(x1, W); y1 = Math.min(y1, H);
  return x1 > x0 && y1 > y0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
}
const itemOf = n => { for (let e = n; e; e = e.parentElement) if (e.dataset && e.dataset.id) return e.dataset.id; return ''; };
HP.probe = {
  // render frame t and report visible imagery ([data-hp-img]) and visible text runs
  frame(t, opts = {}) {
    render(t);
    const img = [];
    for (const e of document.querySelectorAll('#stage [data-hp-img]')) {
      const op = effOpacity(e); if (op < 0.05) continue;
      const r = clipRect(e, e.getBoundingClientRect()); if (!r) continue;
      img.push({ id: e.dataset.hpImg === '1' ? itemOf(e) : e.dataset.hpImg, op: +op.toFixed(3), area: Math.round(r.w * r.h), rect: [r.x, r.y, r.w, r.h].map(Math.round) });
    }
    const txt = [];
    if (opts.texts !== false) {
      const tw = document.createTreeWalker(HP.layers.stage, NodeFilter.SHOW_TEXT);
      const rg = document.createRange();
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        const s = n.textContent; if (!s.trim()) continue;
        const pe = n.parentElement; if (!pe || pe.closest('#top') || pe.closest('style,script')) continue;
        const op = effOpacity(pe); if (op < 0.05) continue;
        rg.selectNodeContents(n);
        let rs = Array.from(rg.getClientRects()).filter(r => r.width > 0.5 && r.height > 0.5);
        if (!rs.length && pe instanceof SVGElement) rs = [pe.getBoundingClientRect()].filter(r => r.width > 0.5 && r.height > 0.5);
        if (!rs.length) continue;
        const x0 = Math.min(...rs.map(r => r.left)), y0 = Math.min(...rs.map(r => r.top)), x1 = Math.max(...rs.map(r => r.right)), y1 = Math.max(...rs.map(r => r.bottom));
        if (x1 < 0 || y1 < 0 || x0 > W || y0 > H) continue;
        txt.push({ id: itemOf(pe), text: s.trim(), op: +op.toFixed(3), rect: [x0, y0, x1 - x0, y1 - y0].map(Math.round) });
      }
    }
    return { t, img, txt };
  },
  items() {   // static: every item's declared texts and reveal modes, and (polisher) its payoffs: [{what, at}] = the edit times its
    // rolled-out texts, marks, annotations... are complete (an item may define payoffs(); coverage.py checks each lands >= a read
    // time before the item ends)
    // assembler: readEnd = when the item stops being readable: the impact of its first outgoing transition (it stays visible, being
    // folded / shattered / zoomed, until the window ends), else t1
    return ITEMS.map(it => ({ id: it.id, type: it.type, t0: +it.t0.toFixed(4), t1: +Math.min(it.t1, 1e6).toFixed(4), texts: it.texts(),
      readEnd: +Math.min(it._trOutAt ? Math.min(...it._trOutAt) : it.t1, 1e6).toFixed(4),
      payoffs: (it.payoffs ? it.payoffs() : []).filter(p => isFinite(p.at)).map(p => ({ what: String(p.what), at: +p.at.toFixed(4) })) }));
  },
};
window.__probe = HP.probe;

// ============================================================ setup
window.__ready = (async () => {
  const st = HP.layers.stage = $('stage');
  HP.layers.cam = $('cam'); HP.layers.fx = $('fx'); HP.layers.flash = $('flash'); HP.layers.top = $('top');
  // modules (fx/index.json): {"vendor": {name: {src, eager}}, "modules": ["legacy.css", "legacy.js", ...]}
  const idx = await (await fetch('fx/index.json', { cache: 'no-store' })).json();
  for (const k in (idx.vendor || {})) LIBSRC[k] = { ...idx.vendor[k], ...(VENDOR_HOOKS[k] || {}) };
  for (const k in LIBSRC) if (LIBSRC[k].eager) await HP.lib.load(k);
  for (const m of idx.modules || []) { const p = 'fx/' + m; if (m.endsWith('.css')) await loadCSS(p); else await loadJS(p); }

  const EDL = HP.EDL = await (await fetch(`edl/${HP.EDL_NAME}.json`, { cache: 'no-store' })).json();
  HP.FPS = EDL.fps || 30;
  Object.assign(LOOK, { ground: '#0E0D12', red: '#B31B1B', dim: '#9A96A8', ...(EDL.look || {}) });
  st.style.setProperty('--ground', LOOK.ground); st.style.setProperty('--red', LOOK.red); st.style.setProperty('--dim', LOOK.dim);
  Object.assign(LAYOUT, LAYOUT_DEFAULTS, EDL.layout || {});
  for (const k in (EDL.grids || {})) GRIDS[k] = buildGrid(EDL.grids[k]);
  initSong(EDL);
  // song/hits.json (or EDL.hits); the stand-in only while the real file is missing (checked on the folder listing: no 404 noise)
  const songDir = await fetch('/song/', { cache: 'no-store' }).then(r => r.ok ? r.text() : '', () => '');
  const has = f => songDir.includes(`href="${f}"`);
  for (const p of [EDL.hits, has('hits.json') && 'song/hits.json', has('hits.stand-in.json') && 'song/hits.stand-in.json'].filter(Boolean)) {
    try { const r = await fetch(HP.url(p), { cache: 'no-store' }); if (!r.ok) continue; normHits(await r.json(), p); break; } catch (e) { /* next */ }
  }
  if (!HITS.ok) INFO.push('no song/hits.json: hb: beats fall back to drop 19.232 + i * 0.4839');
  else if (/stand-in/.test(HITS.src)) INFO.push(`hb: beats from ${HITS.src} (STAND-IN until song/hits.json exists)`);
  if (EDL.camera && EDL.camera.cover === false) CAM.cover = false;
  // fonts first, so modules can measure text in build()
  const FONTS = ["600 56px 'IBM Plex Mono'", "700 60px 'IBM Plex Mono'", "500 34px 'IBM Plex Mono'", "500 56px 'Newsreader'", "italic 400 120px 'Newsreader'",
    "600 160px 'Newsreader'", "italic 400 64px 'Newsreader'", "600 24px 'IBM Plex Mono'", "400 40px 'IBM Plex Mono'", "700 80px 'Unbounded'", ...(HP.FONTS || [])];
  for (const f of FONTS) await document.fonts.load(f);
  await document.fonts.ready;
  for (const f of HOOKS.setup) await f(EDL);

  for (const d of EDL.items) {
    if (d.enabled === false) continue;
    // long r6 "skipIn": [edl names] skips the item in those EDLs only
    if (Array.isArray(d.skipIn) && d.skipIn.includes(HP.EDL_NAME)) continue;
    const C = TYPES[d.type]; if (!C) throw new Error(`unknown item type "${d.type}" (${d.id})`);
    ITEMS.push(new C(d));
  }
  // shared layers nobody placed with a "layer" item go on top of the camera layer
  for (const k in SHARED) if (!SHARED[k].el.parentNode) HP.layers.cam.appendChild(SHARED[k].el);
  SHARED_LATE = true;
  for (const ev of (EDL.fx || [])) {
    if (ev.enabled === false || (Array.isArray(ev.skipIn) && ev.skipIn.includes(HP.EDL_NAME))) continue;   // assembler: skipIn as for items
    const spec = FXS[ev.fx]; if (!spec) throw new Error(`unknown fx "${ev.fx}"`);
    const r = fxTimes(ev); ev.times = r.times; ev.beats = r.beats;
    for (const x of ev.times) HP.mark(x, ev.id || ev.fx, 'fx:' + ev.fx);
    if (spec.build) spec.build(ev, HP);
    if (spec.draw) FXDRAW.push([ev, spec]);
    FXEV.push(ev);
  }
  for (const f of HOOKS.built) await f();
  await Promise.all(ITEMS.map(it => it.load()));
  await HP.assets.wait();
  await document.fonts.ready;
  // measure with everything displayed, then hide again
  for (const it of ITEMS) it.el.style.display = 'block';
  for (const it of ITEMS) it.layout();
  for (const it of ITEMS) { it.el.style.display = 'none'; it.shown = false; }
  for (const f of HOOKS.ready) await f();
  if (HP.GUIDES) {
    const g = (css) => el('div', 'guide', HP.layers.top, css);
    g({ left: '60px', top: '250px', width: '954px', height: '1324px' });     // text-safe box (approx. Reels/TikTok)
    g({ left: '960px', top: '1000px', width: '114px', height: '914px', borderColor: 'rgba(255,60,120,.8)' });   // right button rail
  }
  window.DURATION = EDL.duration ?? Math.max(...ITEMS.map(i => i.t1));
  window.__items = ITEMS.map(i => ({ id: i.id, type: i.type, t0: +i.t0.toFixed(4), t1: +i.t1.toFixed(4), verified: i.d.verified !== false }));
  window.__grids = GRIDS; window.__warn = WARN; window.__info = INFO;
  window.__sched = () => SCHED.slice().sort((a, b) => a.t - b.t);
  window.__beats = (step = 1, t0 = 0, t1 = window.DURATION) => HP.beatsIn(t0, t1, { step }).map(b => ({ i: b.i, t: +b.t.toFixed(4), song: +b.song.toFixed(4), section: b.section,
    flags: Object.keys(b).filter(k => b[k] === true) }));
  window.__hits = { src: HITS.src, ok: HITS.ok, period: HITS.period, vocals: HITS.vocals };
  await renderAsync(0);
  window.__ok = true;
  return true;
})().catch(e => { window.__err = String(e && e.stack || e); console.error(window.__err); });
})();
