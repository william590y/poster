/* fx/transitions.js  [BUILDER D]  beat-locked transitions between items and sections
 * =================================================================================================================
 * BUILD.md REVISION 2 ("William's later ideas"): "folding, zooming or illumination, or shattering into pieces or particles. Feel
 * free to be creative ... Use them often: most item changes should be a transition, not a cut."
 *
 * EDL (edl/README.md, "Builder D"):
 *   top level "transitions": [{id, at, dur (beats, 1), type, out: [item ids], in: [item ids], lead (0..1), ...params}]
 *   per item  "enterFx": type | {type, dur, lead, at, ...}   (a transition with in: [this item], anchored on its t0)
 *             "exitFx":  type | {type, ...}                  (out: [this item], anchored on its t1)
 *   `at` is the beat the transition's impact lands on; the window is [at - lead * D, at + (1 - lead) * D], D = dur beats.
 *   The outgoing items stay visible until the window ends and the incoming ones become visible when it starts (their own t0/t1
 *   are not changed, so footage and speech cues keep their timing); their cut-side envelope (exit of out, enter of in) is set to
 *   "cut" (keepEnv: true keeps it). Types: fold, zoomthrough, whip, illuminate, shatter, particles, paintwipe, iris, pageturn.
 *
 * HOW: a 'post' hook (after every item has drawn the frame) composes transforms, clip-paths and opacity onto the item layers,
 * clones layers where one layer must become several pieces (fold flap, shards, page strips, whip ghosts: the clone's canvases
 * are copied from this frame's pixels, so a clone is exactly the frame), reorders the outgoing layer above the incoming one when
 * it must leave on top, and draws light, paint, rims and particles on an overlay canvas placed just above the pair. A 'frame'
 * hook undoes all of it before the next frame draws, so every frame is a pure function of t (no state carried between frames).
 * Cost: CSS filters on full-frame layers are expensive here (60-150 ms each) and are not used; clones cost ~5 ms each.
 *
 * EXPORTS HP.lib.transitions = {list, TYPES, register(name, spec), add(spec), project, voronoi, itemRect, ...}
 */
(function () {
'use strict';
const { clamp, lerp, pr, smooth, el } = HP.u, E = HP.ease;
const W = HP.W, H = HP.H, EPS = HP.EPS, COL = HP.COL, D2R = Math.PI / 180;
const BP = () => HP.hits.period || 0.4839;
const PL = () => HP.lib.paint;
const NIGHT = '#0E0D12', PAPER = '#FBF7EE';
const hexA = (c, a) => PL() ? PL().rgba(c, a) : c;

// ============================================================ per-frame bookkeeping (undone in the 'frame' hook)
const S = { list: [], touched: [], clones: [], moved: new Set(), pool: [], canon: new Map(), canonList: [], stand: new Map() };
function setStyle(e, prop, v) { S.touched.push([e, prop, e.style[prop]]); e.style[prop] = v; }
function prefix(e, str) { if (str) setStyle(e, 'transform', str + ' ' + (e.style.transform || '')); }
function mulOpacity(e, k) { const o = e.style.opacity === '' ? 1 : parseFloat(e.style.opacity); setStyle(e, 'opacity', String(clamp(o * k))); }
function restore() {
  for (let i = S.touched.length - 1; i >= 0; i--) { const [e, p, v] = S.touched[i]; e.style[p] = v; }
  S.touched.length = 0;
  for (const c of S.clones) c.remove();
  S.clones.length = 0; S.stand.clear();
  if (S.moved.size) {
    const L = [...S.moved].sort((a, b) => S.canon.get(b) - S.canon.get(a));
    for (const e of L) {
      const i = S.canon.get(e); let next = null;
      for (let k = i + 1; k < S.canonList.length; k++) if (S.canonList[k].parentNode === e.parentNode) { next = S.canonList[k]; break; }
      e.parentNode.insertBefore(e, next);
    }
    S.moved.clear();
  }
  for (const p of S.pool) if (p.on) { p.on = false; p.cv.style.display = 'none'; p.cv.style.mixBlendMode = ''; }
}
// the layer's stand-in for this frame: a fresh copy of it (or of the copy an earlier transition/swallow already made this frame,
// so effects chain: an item that is the "in" of one transition and the "out" of the next), the original hidden
function swapLayer(e) {
  const cur = S.stand.get(e) || e, vis = cur === e ? 'visible' : (cur.style.visibility || 'visible'), c = cloneLayer(cur);
  setStyle(cur, 'visibility', 'hidden'); c.style.visibility = vis;   // an earlier stand-in hidden by its transition stays hidden
  S.stand.set(e, c); return c;
}
function moveAfter(e, ref) { if (!S.canon.has(e)) return; S.moved.add(e); ref.parentNode.insertBefore(e, ref.nextSibling); }
// a deep copy of a layer as it is THIS frame (canvases copied pixel for pixel), inserted right after `after` (default: the source)
function cloneLayer(src, after) {
  const c = src.cloneNode(true);
  const a = src.querySelectorAll('canvas'), b = c.querySelectorAll('canvas');
  a.forEach((x, i) => { const y = b[i]; if (!y || !x.width || !x.height) return; y.width = x.width; y.height = x.height; try { y.getContext('2d').drawImage(x, 0, 0); } catch (e) { /* tainted / lost context: leave empty */ } });
  c.dataset.trClone = '1';
  const ref = after || src; ref.parentNode.insertBefore(c, ref.nextSibling);
  S.clones.push(c);
  return c;
}
// a full-frame ground inside a layer (its first child): a transparent card layer becomes an opaque "frame" that folds, slides,
// shatters or opens through an iris as a whole; it takes the layer's clip-path and transform with it
function groundIn(e, color) {
  // z-index -1 inside an isolated layer: under the layer's own (possibly non-positioned) content, above the layers below it
  const g = el('div', 'tr-ground', null, { position: 'absolute', left: '-40px', top: '-40px', width: (W + 80) + 'px', height: (H + 80) + 'px', background: color, zIndex: -1 });
  setStyle(e, 'isolation', 'isolate');
  e.insertBefore(g, e.firstChild); S.clones.push(g); return g;
}
// overlay canvases (a small pool; each active transition borrows one, placed just above its layers)
function overlay(k) {
  let p = S.pool[k];
  if (!p) { const cv = el('canvas', 'tr-ovl', HP.layers.cam, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px', pointerEvents: 'none', display: 'none' }); cv.width = W; cv.height = H; p = S.pool[k] = { cv, ctx: cv.getContext('2d'), on: false }; }
  if (!p.on) { p.on = true; p.cv.style.display = ''; const c = p.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, W, H); }
  return p;
}

// camera zoom impulse that switches off once it is below 0.35 px at the frame edge (core's HP.cam.punch keeps a sub-pixel scale
// alive for ~a beat, and a near-identity scale on #cam re-rasters the frame differently depending on the frames before it)
function camPunch(t, amt, decay = .12) {
  const cut = .35 / 960, life = decay * Math.log(Math.abs(amt) / cut); if (!(life > 0)) return;
  HP.cam.add(x => (x < t - EPS || x > t + life) ? null : { zoom: 1 + amt * Math.exp(-(x - t) / decay) });
  HP.mark(t, 'cam', 'punch');
}
// ============================================================ geometry helpers
// transform-origin of a layer (core: 540 960, or an item's kickOrigin)
function originOf(e) { const o = e.style.transformOrigin; if (o) { const m = o.match(/(-?[\d.]+)px\s+(-?[\d.]+)px/); if (m) return [+m[1], +m[2]]; } return [540, 960]; }
// CSS prefix for "R about frame point O, then perspective P about the frame centre", composed AFTER the layer's own transform
function about(e, O, R, P) {
  const T0 = originOf(e), dx = O[0] - T0[0], dy = O[1] - T0[1];
  return `${P ? `perspective(${P}px) ` : ''}translate(${dx.toFixed(2)}px,${dy.toFixed(2)}px) ${R} translate(${(-dx).toFixed(2)}px,${(-dy).toFixed(2)}px)`;
}
// 3D point ops matching CSS: rotateX/Y/Z (deg) and the perspective projection about the frame centre
function rotP(p, axis, deg) {
  const a = deg * D2R, c = Math.cos(a), s = Math.sin(a), [x, y, z] = p;
  if (axis === 'y') return [x * c + z * s, y, -x * s + z * c];
  if (axis === 'x') return [x, y * c - z * s, y * s + z * c];
  return [x * c - y * s, x * s + y * c, z];
}
function project(p, P, C = [540, 960]) { const k = P ? P / (P - p[2]) : 1; return [C[0] + (p[0] - C[0]) * k, C[1] + (p[1] - C[1]) * k, p[2]]; }
// the rect an item occupies: params.rect, else its EDL frame/box/x,y,w,h, else the full frame
function itemRect(it, p = {}) {
  if (p.rect) return p.rect;
  const d = it ? it.d : {}, f = d.frame || d.box || d.panel;
  if (f && f.w !== undefined) return [f.x ?? (f.cx !== undefined ? f.cx - f.w / 2 : 0), f.y ?? (f.cy !== undefined ? f.cy - (f.h ?? f.w) / 2 : 0), f.w, f.h ?? f.w];
  if (f && f.r !== undefined) return [f.cx - f.r, f.cy - f.r, 2 * f.r, 2 * f.r];
  if (d.x !== undefined && d.w !== undefined) return [d.x, d.y ?? 0, d.w, d.h ?? (d.font && d.font.size ? d.font.size * 3 : 400)];
  return [0, 0, W, H];
}
const rectC = r => [r[0] + r[2] / 2, r[1] + r[3] / 2];
const polyStr = pts => 'polygon(' + pts.map(q => `${q[0].toFixed(1)}px ${q[1].toFixed(1)}px`).join(',') + ')';
function circlePath(cx, cy, r) { return `M${(cx - r).toFixed(1)} ${cy.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0Z`; }
function polyPath(pts) { return 'M' + pts.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L') + 'Z'; }
// clip-path in a layer's LOCAL coordinates for a shape given in frame px (layers are full-frame with core transform ~identity)
function clipPathD(e, d, evenodd) { setStyle(e, 'clipPath', `path(${evenodd ? 'evenodd, ' : ''}'${d}')`); }

// Voronoi cells of seeds inside a rect (half-plane clipping; N is small)
function clipHalf(poly, a, b, c) {   // keep a*x + b*y <= c
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length], fp = a * P[0] + b * P[1] - c, fq = a * Q[0] + b * Q[1] - c;
    if (fp <= 0) out.push(P);
    if ((fp < 0) !== (fq < 0) && fp !== fq) { const k = fp / (fp - fq); out.push([P[0] + (Q[0] - P[0]) * k, P[1] + (Q[1] - P[1]) * k]); }
  }
  return out;
}
function voronoi(key, rect, n, focus) {
  return HP.memo('tr|vor|' + key + '|' + rect.map(Math.round).join(',') + '|' + n + '|' + (focus || []).map(Math.round).join(','), () => {
    const r = HP.rng('vor', key), [x, y, w, h] = rect, seeds = [];
    // denser near the impact point: half the seeds in a disc around it
    for (let i = 0; i < n; i++) {
      if (focus && i < n * .45) { const a = r() * 2 * Math.PI, rr = Math.sqrt(r()) * Math.min(w, h) * .32; seeds.push([clamp(focus[0] + Math.cos(a) * rr, x + 4, x + w - 4), clamp(focus[1] + Math.sin(a) * rr, y + 4, y + h - 4)]); }
      else seeds.push([x + r() * w, y + r() * h]);
    }
    const box = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    return seeds.map((s, i) => {
      let poly = box;
      for (let j = 0; j < n && poly.length; j++) { if (j === i) continue; const q = seeds[j], a = q[0] - s[0], b = q[1] - s[1], c = (q[0] * q[0] + q[1] * q[1] - s[0] * s[0] - s[1] * s[1]) / 2; poly = clipHalf(poly, a, b, c); }
      let cx = 0, cy = 0; poly.forEach(p => { cx += p[0]; cy += p[1]; }); cx /= poly.length || 1; cy /= poly.length || 1;
      return { poly, c: [cx, cy], seed: s, i };
    }).filter(c => c.poly.length >= 3);
  });
}

// colours of a layer's main picture (its largest canvas or img) sampled on a grid, for particles; null when there is none
const SAMP = HP.offscreen(64, 64), SAMPX = SAMP.getContext('2d', { willReadFrequently: true });
function sampler(e) {
  let best = null, ba = 0;
  for (const n of e.querySelectorAll('canvas,img')) { const r = n.getBoundingClientRect(), a = r.width * r.height; if (a > ba && a > 2000) { ba = a; best = { n, r }; } }
  if (!best) return null;
  const { n, r } = best, gw = 48, gh = Math.max(8, Math.min(64, Math.round(48 * r.height / Math.max(1, r.width))));
  SAMPX.setTransform(1, 0, 0, 1, 0, 0); SAMPX.clearRect(0, 0, 64, 64);
  try { SAMPX.drawImage(n, 0, 0, gw, gh); } catch (e2) { return null; }
  let D; try { D = SAMPX.getImageData(0, 0, gw, gh).data; } catch (e2) { return null; }
  return (x, y) => { const u = (x - r.left) / r.width, v = (y - r.top) / r.height; if (u < 0 || u > 1 || v < 0 || v > 1) return null; const i = (Math.min(gh - 1, Math.floor(v * gh)) * gw + Math.min(gw - 1, Math.floor(u * gw))) * 4; return D[i + 3] < 40 ? null : `rgb(${D[i]},${D[i + 1]},${D[i + 2]})`; };
}

// ============================================================ registry of transition types
// spec: {dur (beats), lead (impact fraction), order: 'out-top' | null, defaults, apply(tr, t, u, X)}
const TYPES = {};
function register(name, spec) { TYPES[name] = spec; }

// ============================================================ compile (hook 'built': items exist, nothing loaded yet)
function ids(v) { return v === undefined || v === null ? [] : [].concat(v); }
function compile(spec, k) {
  const type = TYPES[spec.type];
  if (!type) throw new Error(`transition ${spec.id || k}: unknown type "${spec.type}" (${Object.keys(TYPES).join(', ')})`);
  const find = id => { const it = HP.ITEMS.find(i => i.id === id); if (!it) HP.WARN.push(`transition ${spec.id || k}: no item "${id}"`); return it; };
  const outs = ids(spec.out).map(find).filter(Boolean), ins = ids(spec.in).map(find).filter(Boolean);
  let at; try { at = HP.T(spec.at); } catch (e) { HP.INFO.push(`transition ${spec.id || k}: ${e.message} (dropped)`); return null; }
  if (!isFinite(at)) return null;
  const D = (spec.dur ?? type.dur ?? 1) * BP(), lead = spec.lead ?? type.lead ?? .5, a = at - lead * D, b = a + D;
  const tr = { id: spec.id || `tr${k}-${spec.type}`, type, name: spec.type, at, a, b, D, lead, outs, ins, p: { ...(type.defaults || {}), ...spec } };
  HP.mark(at, tr.id, 'transition:' + spec.type);
  if (tr.p.flash) HP.flash(at, tr.p.flash.opacity ?? tr.p.flash, tr.p.flash.decay ?? .1, tr.p.flash.color || '#FFFFFF');
  if (tr.p.punch) camPunch(at, tr.p.punch, .14);
  if (tr.p.shake) HP.cam.hit(at, tr.p.shake, .1);
  for (const it of outs) { (it._trOut || (it._trOut = [])).push(b); if (!tr.p.keepEnv) it.exit = { style: 'cut', dur: null }; }
  for (const it of ins) { (it._trIn || (it._trIn = [])).push(a); if (!tr.p.keepEnv) it.enter = { style: 'cut', dur: null }; }
  if (type.build) type.build(tr);
  return tr;
}
// visibility: an "in" item shows from the earliest window start, an "out" item until the latest window end (its t0/t1 untouched)
function patchVisibility(it) {
  const a = it._trIn ? Math.min(...it._trIn) : it.t0, b = it._trOut ? Math.max(...it._trOut) : it.t1;
  it._eff = [a, b];
  it.active = t => t >= it._eff[0] - EPS && t < it._eff[1] - EPS;
}
HP.on('built', () => {
  const specs = [...(HP.EDL.transitions || [])];
  for (const it of HP.ITEMS) {
    const d = it.d;
    for (const [key, role, anchor] of [['enterFx', 'in', 't0'], ['exitFx', 'out', 't1']]) {
      if (!d[key]) continue;
      const f = typeof d[key] === 'string' ? { type: d[key] } : { ...d[key] };
      specs.push({ id: `${it.id}-${key}`, at: f.at ?? it[anchor], ...f, [role]: [it.id] });
    }
  }
  // assembler (rev2): an entry's "skipIn": [edl names] skips it in those EDLs, as for items
  specs.forEach((s, k) => { if (s.enabled === false || (Array.isArray(s.skipIn) && s.skipIn.includes(HP.EDL_NAME))) return; const tr = compile(s, k); if (tr) S.list.push(tr); });
  for (const it of HP.ITEMS) if (it._trIn || it._trOut) patchVisibility(it);
  S.list.sort((x, y) => x.a - y.a);
});
HP.on('ready', () => {
  S.canonList = [...HP.layers.cam.children, ...HP.layers.fx.children];
  S.canonList.forEach((e, i) => S.canon.set(e, i));
});
HP.on('frame', () => restore());
HP.on('post', t => {
  let k = 0;
  for (const tr of S.list) {
    if (t < tr.a - EPS || t >= tr.b - EPS) continue;
    const outs = tr.outs.filter(it => it.shown).map(it => it.el), ins = tr.ins.filter(it => it.shown).map(it => it.el);
    if (!outs.length && !ins.length) continue;
    const X = { outs, ins, k: k++, tops: [], u: (t - tr.a) / tr.D, t, tr };
    // the outgoing layer leaves on top of the incoming one
    const order = typeof tr.type.order === 'function' ? tr.type.order(tr) : tr.type.order;
    if (order === 'out-top' && outs.length && ins.length) {
      const after = (x, y) => !!(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING);   // y comes after x
      let ref = ins.reduce((m, e) => after(m, e) ? e : m, ins[0]);
      for (const e of outs) if (after(e, ref)) { moveAfter(e, ref); ref = e; }
    }
    // work on fresh copies of the layers (made from this frame's pixels), never on the layers themselves: a layer that was
    // scaled or rotated in an earlier frame keeps Chromium raster state that would make this frame depend on render order
    X.outs = outs.map(swapLayer); X.ins = ins.map(swapLayer);
    X.ovl = () => { if (!X._o) X._o = overlay(X.k); return X._o.ctx; };
    // grounds: the frame colour under the content of the layers this type moves as whole frames (param ground: colour | false)
    const gcol = tr.p.ground === false ? null : (typeof tr.p.ground === 'string' ? (COL[tr.p.ground] || tr.p.ground) : (HP.LOOK.ground || NIGHT));
    const gwho = typeof tr.type.ground === 'function' ? tr.type.ground(tr) : (tr.type.ground || []);
    // only the bottom-most layer of a group gets the ground (a ground in an upper layer would hide the layers under it)
    const bottom = L => L.reduce((m, e) => (e.compareDocumentPosition(m) & Node.DOCUMENT_POSITION_FOLLOWING) ? e : m, L[0]);
    if (gcol) { if (gwho.includes('out') && X.outs.length) groundIn(bottom(X.outs), gcol); if (gwho.includes('in') && X.ins.length) groundIn(bottom(X.ins), gcol); }
    X.clone = (e, after) => { const c = cloneLayer(e, after); X.tops.push(c); return c; };
    tr.type.apply(tr, t, X.u, X);
    // the overlay sits right above the topmost involved layer (clones included)
    if (X._o) {
      const all = [...X.outs, ...X.ins, ...X.tops];
      const top = all.reduce((m, e) => (m.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING) ? e : m, all[0]);
      top.parentNode.insertBefore(X._o.cv, top.nextSibling);
    }
  }
});

// ============================================================ drawing helpers for overlays
function speedLines(ctx, c, n, key, u, o = {}) {   // radial streaks around point c (zoom lines), alpha by u
  const r = HP.rng('sl', key, HP.boil(HP.t, 2));
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = r() * 2 * Math.PI, r0 = (o.r0 ?? 260) + r() * 300, len = (o.len ?? 420) * (.4 + r()) * u, w = (o.w ?? 5) * (.4 + r());
    ctx.strokeStyle = hexA(o.colors ? o.colors[i % o.colors.length] : '#F2EBDD', (o.alpha ?? .7) * u);
    ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(c[0] + Math.cos(a) * r0, c[1] + Math.sin(a) * r0); ctx.lineTo(c[0] + Math.cos(a) * (r0 + len), c[1] + Math.sin(a) * (r0 + len)); ctx.stroke();
  }
  ctx.restore();
}
function hStreaks(ctx, n, key, u, dir, o = {}) {   // horizontal whip streaks
  const r = HP.rng('hs', key, HP.boil(HP.t, 1));
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const y = r() * H, len = (200 + r() * 700) * u, x = r() * W, w = 2 + r() * 10 * u;
    ctx.strokeStyle = hexA(o.colors ? o.colors[i % o.colors.length] : '#F2EBDD', (o.alpha ?? .55) * u * (.3 + .7 * r()));
    ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - dir * len, y + (r() - .5) * 6); ctx.stroke();
  }
  ctx.restore();
}
// a painted-looking ring (three passes: colour, darker inner rim, cream hairlines), wobbling on twos
function paintRing(ctx, cx, cy, r, w, color, key, alpha = 1) {
  if (r <= 0 || w <= 0) return;
  const R = HP.rng('ring', key, HP.boil(HP.t, 2)), wob = (k, a) => 1 + .012 * Math.sin(a * 3 + k * 1.7 + R() * .6) + .008 * Math.sin(a * 7 + k);
  const ring = (rr, ww, col, al, k) => {
    ctx.beginPath();
    for (let i = 0; i <= 96; i++) { const a = i / 96 * 2 * Math.PI, q = rr * wob(k, a); i ? ctx.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q) : ctx.moveTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); }
    ctx.closePath(); ctx.strokeStyle = col; ctx.globalAlpha = alpha * al; ctx.lineWidth = ww; ctx.stroke();
  };
  ctx.save();
  ring(r, w, color, 1, 1);
  ring(r - w * .32, w * .3, PL() ? PL().shade(color, .3) : color, .8, 2);
  ctx.setLineDash([60 + R() * 90, 30 + R() * 50]); ring(r + w * .18, Math.max(1.5, w * .07), '#F2EBDD', .55, 3); ctx.setLineDash([]);
  ctx.restore();
}

// ============================================================ TYPES
// ---------------------------------------------------------------- fold: origami fold-away (out) and unfold-in (in)
// params: axis 'v' (vertical crease, flap = right half) | 'h' (horizontal crease, flap = bottom half), crease (px; default the
// rect's middle), mode 'both' (out folds away, then in unfolds) | 'away' (out folds away, in already underneath) | 'in' (in
// unfolds over out), persp (1700), back (paper colour of the back), fly (the folded packet flies off: true)
register('fold', {
  dur: 1.25, lead: .5, order: tr => tr.p.mode === 'in' ? null : 'out-top', ground: ['out', 'in'], defaults: { axis: 'v', mode: 'both', persp: 2200, back: null, fly: true },
  apply(tr, t, u, X) {
    const p = tr.p, h = tr.lead, V = p.axis !== 'h';
    const back = p.back ? (COL[p.back] || p.back) : HP.pick([COL.pink, COL.teal, COL.yellow, COL.orange, COL.blue], 'foldback', tr.id);
    const R = p.rect === 'item' ? itemRect((tr.outs[0] || tr.ins[0])) : (p.rect || [0, 0, W, H]), cr = p.crease ?? (V ? R[0] + R[2] / 2 : R[1] + R[3] / 2);
    const ctx = X.ovl();
    // a flap's projected corners (frame px) for angle th (deg; 0 = flat, 180 = folded over), with the packet's offset
    const flapQuad = (th, off) => {
      const pts = V ? [[cr, R[1]], [R[0] + R[2], R[1]], [R[0] + R[2], R[1] + R[3]], [cr, R[1] + R[3]]] : [[R[0], cr], [R[0] + R[2], cr], [R[0] + R[2], R[1] + R[3]], [R[0], R[1] + R[3]]];
      return pts.map(q => { let v = V ? [q[0] - cr, 0, 0] : [0, q[1] - cr, 0]; v = rotP(v, V ? 'y' : 'x', V ? -th : th); const P3 = V ? [cr + v[0] + off[0], q[1] + off[1], v[2]] : [q[0] + off[0], cr + v[1] + off[1], v[2]]; return project(P3, p.persp); });
    };
    const fold = (els, th, off, rot, alpha, isIn) => {   // one layer folded at th, its packet moved by off/rot
      const keepClip = V ? `inset(0px ${(W - cr).toFixed(1)}px 0px 0px)` : `inset(0px 0px ${(H - cr).toFixed(1)}px 0px)`;
      const flapClip = V ? `inset(0px 0px 0px ${cr.toFixed(1)}px)` : `inset(${cr.toFixed(1)}px 0px 0px 0px)`;
      const pk = (off[0] || off[1] || rot) ? `translate(${off[0].toFixed(1)}px,${off[1].toFixed(1)}px) rotate(${rot.toFixed(2)}deg)` : '';
      const O = V ? [cr, R[1] + R[3] / 2] : [R[0] + R[2] / 2, cr];
      for (const e of els) {
        if (th <= .01 && !pk) { mulOpacity(e, alpha); continue; }
        const f = X.clone(e);
        setStyle(e, 'clipPath', keepClip); if (pk) prefix(e, about(e, O, pk)); mulOpacity(e, alpha);
        f.style.clipPath = flapClip; f.style.backfaceVisibility = 'hidden';
        f.style.transform = about(f, O, (pk ? pk + ' ' : '') + (V ? `rotateY(${(-th).toFixed(2)}deg)` : `rotateX(${th.toFixed(2)}deg)`), p.persp) + ' ' + (f.style.transform || '');
        f.style.opacity = String(clamp((parseFloat(f.style.opacity) || 1) * alpha));
      }
      // lighting: the flap darkens as it turns away; its back is paper, lit from the top-left; a crease line; a cast shadow
      const q = flapQuad(th, [0, 0]), M = new DOMMatrix().translate(O[0], O[1]).translate(off[0], off[1]).rotate(rot).translate(-O[0], -O[1]);
      const qq = q.map(z => { const w = M.transformPoint(new DOMPoint(z[0], z[1])); return [w.x, w.y]; });
      ctx.save(); ctx.globalAlpha = alpha;
      const path = () => { ctx.beginPath(); qq.forEach((z, i) => i ? ctx.lineTo(z[0], z[1]) : ctx.moveTo(z[0], z[1])); ctx.closePath(); };
      if (th > 90) {   // the back of the paper, on top of the kept half
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 30 * Math.sin(th * D2R) + 6; ctx.shadowOffsetX = V ? -10 : 0; ctx.shadowOffsetY = V ? 6 : -10;
        path(); ctx.fillStyle = back; ctx.fill(); ctx.restore();
        const g = ctx.createLinearGradient(qq[0][0], qq[0][1], qq[2][0], qq[2][1]); const sh = .45 * Math.sin(th * D2R);
        g.addColorStop(0, `rgba(21,19,31,${(sh * .4).toFixed(3)})`); g.addColorStop(1, `rgba(21,19,31,${sh.toFixed(3)})`);
        path(); ctx.fillStyle = g; ctx.fill();
        // paper fibre lines on the back (boil on twos)
        const r = HP.rng('fold', tr.id, HP.boil(t, 2)); ctx.save(); path(); ctx.clip(); ctx.strokeStyle = 'rgba(21,19,31,.07)'; ctx.lineWidth = 2;
        for (let i = 0; i < 14; i++) { const y = lerp(qq[0][1], qq[3][1], r()), x = lerp(qq[0][0], qq[1][0], r()); ctx.beginPath(); ctx.moveTo(x - 200, y); ctx.lineTo(x + 200, y + (r() - .5) * 10); ctx.stroke(); }
        ctx.restore();
      } else if (th > .5) {   // shading on the flap's face: a sheen as it lifts toward the light, darker edge-on
        const sn = Math.sin(th * D2R), g2 = ctx.createLinearGradient(qq[0][0], qq[0][1], qq[1][0], qq[1][1]);
        g2.addColorStop(0, `rgba(255,252,240,${(.28 * sn * (1 - sn * .6)).toFixed(3)})`); g2.addColorStop(1, `rgba(14,13,18,${(.32 * sn * sn).toFixed(3)})`);
        path(); ctx.fillStyle = g2; ctx.fill();
        // the flap's cast shadow onto the kept half
        const s = Math.sin(th * D2R) * .35;
        const g = V ? ctx.createLinearGradient(cr, 0, cr - 220 * Math.sin(th * D2R), 0) : ctx.createLinearGradient(0, cr, 0, cr - 220 * Math.sin(th * D2R));
        g.addColorStop(0, `rgba(14,13,18,${s.toFixed(3)})`); g.addColorStop(1, 'rgba(14,13,18,0)');
        ctx.fillStyle = g; ctx.save(); ctx.translate(off[0], off[1]); if (V) ctx.fillRect(cr - 240, R[1], 240, R[3]); else ctx.fillRect(R[0], cr - 240, R[2], 240); ctx.restore();
      }
      if (th > .5) { path(); ctx.strokeStyle = 'rgba(21,19,31,.38)'; ctx.lineWidth = 2.5; ctx.stroke(); }
      // the crease: a dark fold line with a light edge
      if (th > .5) {
        const a0 = M.transformPoint(new DOMPoint(V ? cr : R[0], V ? R[1] : cr)), a1 = M.transformPoint(new DOMPoint(V ? cr : R[0] + R[2], V ? R[1] + R[3] : cr));
        ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(14,13,18,.6)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(a0.x, a0.y); ctx.lineTo(a1.x, a1.y); ctx.stroke();
        ctx.strokeStyle = 'rgba(251,247,238,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a0.x + (V ? 3 : 0), a0.y + (V ? 0 : 3)); ctx.lineTo(a1.x + (V ? 3 : 0), a1.y + (V ? 0 : 3)); ctx.stroke();
      }
      ctx.restore();
    };
    const mode = p.mode;
    if (mode === 'away' || mode === 'both') {
      // out: the flap folds over (0 -> 180) up to the impact; then the half-size packet flies off (both: over the ground)
      const v = E.ioCub(clamp(u / (mode === 'both' ? h * .78 : .7))), th = 180 * v;
      const f = p.fly ? E.iCub(clamp((u - (mode === 'both' ? h * .62 : .62)) / (mode === 'both' ? h * .45 : .3))) : 0;
      const off = V ? [-f * (cr - R[0] + 260), -f * 140] : [-f * 160, -f * (cr - R[1] + 300)], rot = -f * 24;
      if (X.outs.length && f < 1) fold(X.outs, th, off, rot, 1, false);
      else for (const e of X.outs) setStyle(e, 'visibility', 'hidden');
      if (mode === 'both') for (const e of X.ins) if (u < h) setStyle(e, 'visibility', 'hidden');
    }
    if ((mode === 'in' || mode === 'both') && X.ins.length) {
      // in: starts folded (back up) and opens 180 -> 0 with a little overshoot, landing just after the impact
      const v = mode === 'both' ? clamp((u - h) / (1 - h)) : clamp(u / h), th = 180 * (1 - E.oBack(v, 1.3));
      if (mode === 'in' || u >= h) fold(X.ins, clamp(th, -12, 180), [0, 0], 0, 1, true);
    }
  },
});

// assembler (rev2): focus may name a chart point, {"item": <chart id>, "point": k, "series": 0}: the frame px of that data point
// (charts.js it.X / it.Y) with the chart's own slow drift at the window start; resolved once per transition (pure)
function focusOf(tr) {
  const f = tr.p.focus;
  if (!f || Array.isArray(f)) return f || null;
  if (tr._focus) return tr._focus;
  const it = HP.ITEMS.find(i => i.id === f.item), S = it && it.S && it.S[f.series || 0], q = S && S.pts && S.pts[f.point ?? S.pts.length - 1];
  if (!q || !it.X || !it.Y) { HP.INFO.push(`transition ${tr.id}: focus ${JSON.stringify(f)} is not a chart point (using the out item's centre)`); return (tr._focus = null); }
  const d = it.d, ox = (d.x ?? 120) + (d.w ?? 820) / 2, oy = (d.y ?? 700) + (d.h ?? 600) / 2, k = lerp(1, d.drift ?? 1.035, E.ioSine(it.life(tr.a)));
  return (tr._focus = [ox + (it.X(q.xn) - ox) * k + (f.dx || 0), oy + (it.Y(q.y) - oy) * k + (f.dy || 0)]);
}
// ---------------------------------------------------------------- zoomthrough: push into a detail of the outgoing frame
// params: focus [x, y] frame px (default: the centre of the out item's rect), r (detail radius px, 120), shape 'circle' | 'rect',
// rim (colour of the portal ring: 'pink'), lines (speed lines: true)
register('zoomthrough', {
  dur: 1.5, lead: .62, ground: ['in'], defaults: { r: 120, shape: 'circle', rim: 'pink', lines: true },
  apply(tr, t, u, X) {
    const p = tr.p, C = [540, 960];
    const F = focusOf(tr) || rectC(itemRect(tr.outs[0], p)), r = p.r, Zf = 540 / r;
    // zoom path: slow start, fast through the impact, settling (log-space ease); the focus drifts to the frame centre
    const z = Math.pow(Zf, E.ioCub(clamp(u / .92))), w = E.ioSine(clamp(u / .92));
    const sf = [lerp(F[0], C[0], w), lerp(F[1], C[1], w)], c = [F[0] - (sf[0] - C[0]) / z, F[1] - (sf[1] - C[1]) / z];
    const view = new DOMMatrix().translate(C[0], C[1]).scale(z).translate(-c[0], -c[1]);
    const toCss = (e, M) => { const T0 = originOf(e), Q = new DOMMatrix().translate(-T0[0], -T0[1]).multiply(M).translate(T0[0], T0[1]); prefix(e, `matrix(${[Q.a, Q.b, Q.c, Q.d, Q.e, Q.f].map(v => +v.toFixed(5)).join(',')})`); };
    for (const e of X.outs) { toCss(e, view); if (u > .93) setStyle(e, 'visibility', 'hidden'); }
    const inM = view.multiply(new DOMMatrix().translate(F[0], F[1]).scale(1 / Zf).translate(-C[0], -C[1]));
    // the incoming frame sits inside the detail (clipped to it), and the clip opens to the full frame at the end
    const open = E.oCub(clamp((u - .78) / .22)), rr = lerp(540, 1110, open);
    for (const e of X.ins) {
      toCss(e, inM);
      if (p.shape === 'rect') { const k = rr / 540, hw = 540 * k, hh = Math.min(960, 540 * k * 1.15) + 960 * open; setStyle(e, 'clipPath', `inset(${Math.max(0, 960 - hh).toFixed(1)}px ${Math.max(0, 540 - hw).toFixed(1)}px)`); }
      else clipPathD(e, circlePath(540, 960, rr));
    }
    const ctx = X.ovl(), s = inM.transformPoint(new DOMPoint(540, 960)), rs = rr * Math.hypot(inM.a, inM.b);
    // the portal rim (a painted Kandinsky ring around the detail), fading as it passes the frame edge
    if (open < 1 && X.ins.length) paintRing(ctx, s.x, s.y, rs + 8, Math.max(10, 18 * Math.min(4, z / 2)), COL[p.rim] || p.rim, tr.id, 1 - open);
    if (p.lines !== false) speedLines(ctx, [s.x, s.y], 46, tr.id, Math.sin(Math.PI * clamp(u / .95)) * .9, { r0: rs + 40, len: 520, colors: ['#F2EBDD', COL.yellow, '#F2EBDD', COL.pink] });
  },
});

// ---------------------------------------------------------------- whip: whip pan (dir 1 = to the left) or spin zoom, ghost blur
// params: mode 'pan' | 'spin', dir (1 | -1), dist (1500 px), deg (spin: 120), ghosts (3), streaks (true)
register('whip', {
  dur: 1, lead: .5, ground: ['out', 'in'], defaults: { mode: 'pan', dir: 1, dist: 1500, deg: 110, ghosts: 3, streaks: true },
  apply(tr, t, u, X) {
    const p = tr.p, h = tr.lead, dir = p.dir || 1, n = p.ghosts ?? 3;
    // position along the whip: out accelerates away (0 -> 1), in decelerates in (-1 -> 0); velocity peaks at the impact
    const outPos = v => { const x = clamp(v / h); return .25 * x * x * x + .75 * E.iExpo(x); }, inPos = v => { const x = clamp((v - h) / (1 - h)); return -(1 - (.25 * (1 - Math.pow(1 - x, 3)) + .75 * E.oExpo(x))); };
    const dt = .028 / tr.D;   // ghost spacing (~1 frame)
    const xf = (pos, e) => {
      if (p.mode === 'spin') { const a = pos * p.deg * dir, s = 1 + Math.abs(pos) * .9; return about(e, [540, 960], `rotate(${a.toFixed(2)}deg) scale(${s.toFixed(4)})`); }
      return `translateX(${(-pos * p.dist * dir).toFixed(1)}px) skewX(${(pos * 9 * dir * (1 - Math.abs(pos)) * 4).toFixed(2)}deg)`;
    };
    const layer = (els, posF, live) => {
      if (!live) { for (const e of els) setStyle(e, 'visibility', 'hidden'); return; }
      const v0 = posF(u);
      for (const e of els) {
        // ghosts: earlier positions along the path, fading (deterministic motion blur)
        for (let g = n; g >= 1; g--) { const pv = posF(u - g * dt * (1 + Math.abs(v0) * 3)); if (Math.abs(pv - v0) < .004) continue; const c = X.clone(e, e.previousSibling || e); c.style.transform = xf(pv, c) + ' ' + (c.style.transform || ''); c.style.opacity = String(clamp((parseFloat(c.style.opacity) || 1) * .32 / g)); }
        prefix(e, xf(v0, e));
      }
    };
    layer(X.outs, outPos, u < h);
    layer(X.ins, inPos, u >= h);
    const ctx = X.ovl(), sp = Math.exp(-Math.pow((u - h) / .16, 2));
    if (p.streaks !== false) { if (p.mode === 'spin') speedLines(ctx, [540, 960], 60, tr.id, sp, { r0: 120, len: 900, w: 7 }); else hStreaks(ctx, 70, tr.id, sp, dir, { colors: ['#F2EBDD', COL.yellow, '#F2EBDD', COL.pink, COL.teal] }); }
  },
});

// ---------------------------------------------------------------- illuminate: light sweep -> bloom flash -> light leak
// params: colors (leak colours ['orange', 'pink', 'yellow']), sweep (true), angle (deg of the sweep band, 22 = the plane's angle)
register('illuminate', {
  dur: 1, lead: .5, defaults: { colors: ['orange', 'pink', 'yellow'], sweep: true, angle: 22 },
  apply(tr, t, u, X) {
    const p = tr.p, h = tr.lead, ctx = X.ovl();
    for (const e of X.outs) if (u >= h) setStyle(e, 'visibility', 'hidden');
    for (const e of X.ins) if (u < h) setStyle(e, 'visibility', 'hidden');
    const cols = p.colors.map(c => COL[c] || c), bloom = u < h ? E.iCub(clamp((u - h * .45) / (h * .55))) : Math.exp(-(u - h) / .16);
    ctx.save();
    // the sweep: a soft band of light crossing the outgoing frame along the plane's angle
    if (p.sweep !== false && u < h) {
      const s = E.ioSine(clamp(u / h)), a = -p.angle * D2R, nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2);
      const d = lerp(-1300, 1300, s), cx = 540 + nx * d, cy = 960 + ny * d, wband = 260 + 600 * s;
      const g = ctx.createLinearGradient(cx - nx * wband, cy - ny * wband, cx + nx * wband, cy + ny * wband);
      g.addColorStop(0, 'rgba(255,240,210,0)'); g.addColorStop(.42, `rgba(255,236,200,${(.35 + .3 * s).toFixed(3)})`); g.addColorStop(.5, `rgba(255,252,240,${(.6 + .3 * s).toFixed(3)})`); g.addColorStop(.58, `rgba(255,214,120,${(.3 + .3 * s).toFixed(3)})`); g.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    // light leak blobs from the corners, in the cover's warm colours
    const leak = u < h ? E.iQuad(clamp(u / h)) : Math.exp(-(u - h) / .3);
    const r = HP.rng('leak', tr.id);
    for (let i = 0; i < 3; i++) {
      const corner = [[r() * 300, r() * 500], [W - r() * 300, H * (.3 + r() * .4)], [r() * W, H - r() * 300]][i], drift = (u - h) * 260;
      const x = corner[0] + (i === 1 ? -drift : drift), y = corner[1] + (i === 2 ? -drift : drift * .5), R0 = 700 + 300 * r();
      const g = ctx.createRadialGradient(x, y, 0, x, y, R0);
      g.addColorStop(0, hexA(cols[i % cols.length], .62 * leak)); g.addColorStop(.5, hexA(cols[i % cols.length], .22 * leak)); g.addColorStop(1, hexA(cols[i % cols.length], 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    // the bloom: the frame blows out to warm paper white on the impact, then clears onto the incoming frame
    if (bloom > .003) {
      const g = ctx.createRadialGradient(540, 900, 0, 540, 900, 1300);
      g.addColorStop(0, `rgba(255,250,238,${clamp(bloom * 1.15).toFixed(3)})`); g.addColorStop(.6, `rgba(255,238,214,${clamp(bloom).toFixed(3)})`); g.addColorStop(1, `rgba(255,214,170,${clamp(bloom * .9).toFixed(3)})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // anamorphic streak through the middle
      ctx.globalAlpha = clamp(bloom * 1.2) * .8; ctx.fillStyle = '#FFF7E8'; ctx.fillRect(0, 930, W, 14 + 40 * bloom); ctx.globalAlpha = 1;
    }
    ctx.restore();
  },
});

// ---------------------------------------------------------------- shatter: Voronoi shards that crack on the beat and fly/fall
// params: n (16 shards), impact [x, y] (default the out rect's centre, nudged), speed (1700 px/s), gravity (4200 px/s^2),
// spin (deg/s 380), tumble (deg/s 520), persp (1600), edge (cream edge line: true), cracks (true)
register('shatter', {
  dur: 1.5, lead: .12, order: 'out-top', ground: ['out'], defaults: { n: 16, speed: 1600, gravity: 4200, spin: 380, tumble: 520, persp: 1600, edge: true, cracks: true },
  apply(tr, t, u, X) {
    const p = tr.p, h = tr.lead, R = p.rect === 'item' ? itemRect(tr.outs[0]) : (p.rect || [0, 0, W, H]), c0 = rectC(p.rect ? R : itemRect(tr.outs[0]));
    const I = p.impact || [c0[0] + R[2] * .08, c0[1] - R[3] * .06];
    const cells = voronoi(tr.id, R, p.n, I), ctx = X.ovl();
    const pre = clamp(u / h);
    if (u < h) {   // cracks race out from the impact point along the cell edges
      if (p.cracks !== false) {
        ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const reach = Math.max(R[2], R[3]) * E.oQuad(pre);
        for (const cl of cells) for (let i = 0; i < cl.poly.length; i++) {
          const a = cl.poly[i], b = cl.poly[(i + 1) % cl.poly.length], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          if (Math.hypot(m[0] - I[0], m[1] - I[1]) > reach) continue;
          ctx.strokeStyle = 'rgba(251,247,238,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        }
        ctx.restore();
      }
      return;
    }
    // shards: clones of the out layer clipped to each cell, flying out from the impact with spin, tumble and gravity
    const lt = (u - h) * tr.D;
    // assembler (rev2): the shards ARE the outgoing frames' footage/screenshots: when an out layer carries declared imagery the
    // overlay is declared too (coverage.py), as particles does; the clones keep their own data-hp-img markers as well
    if (X.outs.some(e => e.querySelector('[data-hp-img]'))) HP.markImagery(ctx.canvas, tr.id);
    for (const e of X.outs) {
      setStyle(e, 'visibility', 'hidden');
      for (const cl of cells) {
        const r = HP.rng('shard', tr.id, cl.i), v = [cl.c[0] - I[0], cl.c[1] - I[1]], d = Math.hypot(v[0], v[1]) || 1;
        const sp = p.speed * (.45 + r()) * (1.25 - Math.min(1, d / 900) * .5), delay = Math.min(.06, d / 9000);
        const tt = Math.max(0, lt - delay), vx = v[0] / d * sp, vy = v[1] / d * sp - 600 * r();
        const dx = vx * tt, dy = vy * tt + .5 * p.gravity * tt * tt, rz = (r() - .5) * 2 * p.spin * tt, rx = (r() - .5) * 2 * p.tumble * tt, ry = (r() - .5) * 2 * p.tumble * tt;
        const c = X.clone(e);
        c.style.visibility = 'visible';
        c.style.clipPath = polyStr(cl.poly);
        c.style.transform = about(c, cl.c, `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) rotateX(${rx.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg) rotate(${rz.toFixed(1)}deg)`, p.persp) + ' ' + (c.style.transform || '');
        // shading: a face turned away from the light darkens; an edge catches it
        const tilt = Math.abs(Math.sin(rx * D2R)) * .5 + Math.abs(Math.sin(ry * D2R)) * .5;
        const sh = el('div', '', c, { position: 'absolute', inset: 0, clipPath: polyStr(cl.poly), background: `rgba(40,24,30,${(tilt * .34).toFixed(3)})` });
        if (p.edge !== false) { const s = HP.u.sv('svg', { width: W, height: H, style: 'position:absolute;left:0;top:0;overflow:visible' }, c); HP.u.sv('polygon', { points: cl.poly.map(q => q.join(',')).join(' '), fill: 'none', stroke: '#FBF7EE', 'stroke-width': 3, 'stroke-opacity': (.4 + .5 * (1 - tilt)).toFixed(2) }, s); }
        void sh;
      }
    }
    // a white crack flash at the impact, then a few paint chips
    const fl = Math.exp(-lt / .06);
    if (fl > .02) { const g = ctx.createRadialGradient(I[0], I[1], 0, I[0], I[1], 420); g.addColorStop(0, `rgba(255,252,244,${fl.toFixed(3)})`); g.addColorStop(1, 'rgba(255,252,244,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  },
});

// ---------------------------------------------------------------- particles: halftone -> paint particles that swirl -> re-form
// params: grid (cell px, 44), swirl (turns, .6), colors (fallback palette when the layer has no picture), trail (true)
register('particles', {
  dur: 2, lead: .5, ground: ['in'], defaults: { grid: 44, swirl: .55, colors: ['pink', 'yellow', 'teal', 'orange', 'blue', 'cream'], trail: true },
  apply(tr, t, u, X) {
    const p = tr.p, h = tr.lead, g = p.grid, ctx = X.ovl();
    // integrator: the particles ARE the two frames' pixels (sampled colours) while both layers are hidden mid-swirl, so the
    // overlay is declared as imagery for coverage.py (it only exists inside this transition's window)
    HP.markImagery(ctx.canvas, tr.id);
    const Ro = itemRect(tr.outs[0], p), Ri = itemRect(tr.ins[0] || tr.outs[0], p.rectIn ? { rect: p.rectIn } : {});
    const grid = (R) => HP.memo(`tr|pgrid|${R.map(Math.round).join(',')}|${g}`, () => { const out = []; const nx = Math.max(1, Math.round(R[2] / g)), ny = Math.max(1, Math.round(R[3] / g)); for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) out.push([R[0] + (i + .5) * R[2] / nx, R[1] + (j + .5) * R[3] / ny]); return { pts: out, cw: R[2] / nx, ch: R[3] / ny }; });
    const A = grid(Ro), B = grid(Ri), N = Math.max(A.pts.length, B.pts.length);
    const cover = Math.hypot(A.cw, A.ch) / 2 + 1;
    // phase 1 (0 .. .4h): the outgoing frame breaks into a halftone (dots shrinking); phase 2: dots leave as paint particles
    const p1 = clamp(u / (h * .45)), leave = clamp((u - h * .3) / (h * .7)), arrive = clamp((u - h) / ((1 - h) * .75)), reform = clamp((u - h - (1 - h) * .45) / ((1 - h) * .55));
    for (const e of X.outs) {
      if (leave >= 1) { setStyle(e, 'visibility', 'hidden'); continue; }
      const rr = lerp(cover, Math.min(A.cw, A.ch) * .42, E.oCub(p1)) * (1 - E.iCub(leave));
      if (u > 0.001) clipPathD(e, A.pts.map(q => circlePath(q[0], q[1], Math.max(.5, rr))).join(''));
    }
    for (const e of X.ins) {
      if (reform <= 0) { setStyle(e, 'visibility', 'hidden'); continue; }
      if (reform < 1) { const rr = lerp(Math.min(B.cw, B.ch) * .2, Math.hypot(B.cw, B.ch) / 2 + 1, E.ioCub(reform)); clipPathD(e, B.pts.map(q => circlePath(q[0], q[1], rr)).join('')); }
    }
    if (leave <= 0 || reform >= 1) return;
    // particles: from a halftone dot of the out to a dot of the in, swirling round the middle on the way
    const so = X.outs.length ? sampler(X.outs[0]) : null, si = X.ins.length && arrive > 0 ? sampler(X.ins[0]) : null;
    const pal = p.colors.map(c => c === 'cream' ? '#F2EBDD' : (COL[c] || c)), C = [(rectC(Ro)[0] + rectC(Ri)[0]) / 2, (rectC(Ro)[1] + rectC(Ri)[1]) / 2];
    const pos = (k, v) => {   // v: 0 = at its out dot, 1 = at its in dot; polar flight round C (a swirl), flung outward mid-way
      const r = HP.rng('pt', tr.id, k), a0 = A.pts[k % A.pts.length], b0 = B.pts[(k * 7919) % B.pts.length];
      const w = E.ioCub(clamp(v)), ra = Math.hypot(a0[0] - C[0], a0[1] - C[1]), rb = Math.hypot(b0[0] - C[0], b0[1] - C[1]);
      const ta = Math.atan2(a0[1] - C[1], a0[0] - C[0]); let tb = Math.atan2(b0[1] - C[1], b0[0] - C[0]);
      while (tb - ta > Math.PI) tb -= 2 * Math.PI; while (tb - ta < -Math.PI) tb += 2 * Math.PI;
      const turns = p.swirl * (.7 + .6 * r()), th = lerp(ta, tb + turns * 2 * Math.PI, w), rr = lerp(ra, rb, w) * (1 + (.35 + .5 * r()) * Math.sin(Math.PI * w)) + 120 * Math.sin(Math.PI * w);
      return [C[0] + Math.cos(th) * rr, C[1] + Math.sin(th) * rr];
    };
    const prog = k => { const r = HP.rand('ptd', tr.id, k); return clamp((leave - r * .35) / .65) * .5 + arrive * .5; };
    ctx.save(); ctx.lineCap = 'round';
    const dv = .035;
    for (let k = 0; k < N; k++) {
      const v = prog(k); if (v <= 0) continue;
      const q = pos(k, v), q0 = pos(k, v - dv), r = HP.rng('ptc', tr.id, k);
      const a0 = A.pts[k % A.pts.length], b0 = B.pts[(k * 7919) % B.pts.length];
      const cOut = (so && so(a0[0], a0[1])) || pal[k % pal.length], cIn = (si && si(b0[0], b0[1])) || pal[(k + 3) % pal.length];
      const col = arrive > .5 && v > .75 ? cIn : cOut;
      const sz = Math.min(A.cw, A.ch) * .42 * lerp(1, .55, Math.sin(Math.PI * v)) * (.75 + .5 * r()) * (1 - reform);
      if (sz < .6) continue;
      ctx.fillStyle = col; ctx.strokeStyle = col;
      if (p.trail !== false && Math.hypot(q[0] - q0[0], q[1] - q0[1]) > 3) { ctx.globalAlpha = .45; ctx.lineWidth = sz * 1.1; ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(q[0], q[1], sz, 0, 2 * Math.PI); ctx.fill();
      if (r() < .3) { ctx.beginPath(); ctx.arc(q[0] + (r() - .5) * sz * 2.2, q[1] + (r() - .5) * sz * 2.2, sz * .35, 0, 2 * Math.PI); ctx.fill(); }   // a satellite droplet
    }
    ctx.restore();
  },
});

// ---------------------------------------------------------------- paintwipe: bristle bands paint over (the cut hides under them)
// and tear away; style 'cover' (default; HP.lib.paint.wipe) | 'matte' (the incoming frame is revealed through the strokes)
// params: n (4 bands), angle (-8), colors (['pink', 'violet']), dir (1)
register('paintwipe', {
  dur: 1, lead: .45, ground: tr => tr.p.style === 'matte' ? ['in'] : [], defaults: { n: 4, angle: -8, colors: ['pink', 'violet'], dir: 1, style: 'cover' },
  apply(tr, t, u, X) {
    const p = tr.p, h = tr.lead, ctx = X.ovl(), spec = { key: tr.id, n: p.n, angle: p.angle, colors: p.colors, dir: p.dir };
    if (p.style === 'matte') {
      // the incoming frame painted in through the bands' silhouettes; the bands' bristles drawn over the edges
      for (const e of X.outs) if (u >= 1) setStyle(e, 'visibility', 'hidden');
      const plan = PL().wipePlan(spec), v = clamp(u / .9), polys = [];
      for (const b of plan) { const q = E.ioCub(clamp((v - b.d) / .5)); if (q <= 0) continue; const S2 = b.S, n1 = Math.max(2, Math.floor(1 + q * (S2.C.length - 1)));
        const pts = S2.C.slice(0, n1).map((c, i) => [c[0], c[1], S2.pr[i]]); const o = HP.lib.freehand.getStroke(pts, { size: S2.size, thinning: S2.o.thinning, smoothing: S2.o.smoothing, streamline: S2.o.streamline, simulatePressure: false, last: q >= 1 });
        if (o.length > 2) polys.push(polyPath(o)); }
      for (const e of X.ins) { if (!polys.length) setStyle(e, 'visibility', 'hidden'); else if (v < 1) clipPathD(e, polys.join(''), false); }
      ctx.save(); ctx.globalAlpha = .55 * (1 - clamp((u - .8) / .2)); PL().wipe(ctx, spec, v, { out: 0 }); ctx.restore();
      return;
    }
    for (const e of X.outs) if (u >= h) setStyle(e, 'visibility', 'hidden');
    for (const e of X.ins) if (u < h) setStyle(e, 'visibility', 'hidden');
    PL().wipe(ctx, spec, clamp(u / h * 1.02), { out: u > h ? clamp((u - h) / (1 - h)) : 0 });
  },
});

// ---------------------------------------------------------------- iris: through a Kandinsky shape
// params: shape 'circle' | 'square' | 'nabla' | 'band' | 'ring', at point c [x, y] (default the in rect's centre), mode 'open'
// (the incoming frame opens out of the shape) | 'close' (the outgoing frame closes into it, revealing what is under),
// rim colour (shape default: circle pink, square teal, nabla red, band yellow), spin (deg over the window), pair (true: the
// cover's offset second disc chases the rim)
register('iris', {
  dur: 1, lead: .3, order: tr => tr.p.mode === 'close' ? 'out-top' : null, ground: tr => tr.p.mode === 'close' ? ['out'] : ['in'], defaults: { shape: 'circle', mode: 'open', spin: 90, pair: true },
  apply(tr, t, u, X) {
    const p = tr.p, shape = p.shape, close = p.mode === 'close';
    const tgt = close ? tr.outs[0] : (tr.ins[0] || tr.outs[0]), Cc = p.c || p.center || rectC(itemRect(tgt, p));
    const rim = COL[p.rim] || p.rim || { circle: COL.pink, ring: COL.pink, square: COL.teal, nabla: COL.red, band: COL.yellow }[shape] || COL.pink;
    const far = Math.max(Math.hypot(Cc[0], Cc[1]), Math.hypot(W - Cc[0], Cc[1]), Math.hypot(Cc[0], H - Cc[1]), Math.hypot(W - Cc[0], H - Cc[1])) + 40;
    const v = close ? 1 - E.iCub(u) : E.oCub(clamp(u / .85)), s = v * far * (shape === 'band' ? 1.1 : 1), rot = (close ? -1 : 1) * p.spin * (1 - v);
    const pathOf = (sz) => {
      if (shape === 'square') { const a = (15 + rot) * D2R, pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => [Cc[0] + (x * Math.cos(a) - y * Math.sin(a)) * sz, Cc[1] + (x * Math.sin(a) + y * Math.cos(a)) * sz]); return polyPath(pts); }
      if (shape === 'nabla') { const a = rot * D2R, pts = [[-1.15, -.66], [1.15, -.66], [0, 1.33]].map(([x, y]) => [Cc[0] + (x * Math.cos(a) - y * Math.sin(a)) * sz, Cc[1] + (x * Math.sin(a) + y * Math.cos(a)) * sz]); return polyPath(pts); }
      if (shape === 'band') { const a = -22 * D2R, L = 2400, hw = sz * .62, c = Math.cos(a), sn = Math.sin(a), nx = -sn, ny = c; return polyPath([[Cc[0] - c * L + nx * hw, Cc[1] - sn * L + ny * hw], [Cc[0] + c * L + nx * hw, Cc[1] + sn * L + ny * hw], [Cc[0] + c * L - nx * hw, Cc[1] + sn * L - ny * hw], [Cc[0] - c * L - nx * hw, Cc[1] - sn * L - ny * hw]]); }
      return circlePath(Cc[0], Cc[1], Math.max(.5, sz));
    };
    if (close) { for (const e of X.outs) clipPathD(e, pathOf(s)); }
    else { for (const e of X.ins) { if (s <= .5) setStyle(e, 'visibility', 'hidden'); else if (v < 1) clipPathD(e, pathOf(s)); } for (const e of X.outs) if (u >= .85) setStyle(e, 'visibility', 'hidden'); }
    if ((close && u >= .995) || (!close && v >= 1)) return;
    const ctx = X.ovl(), w = 22 + 26 * Math.sin(Math.PI * clamp(v)), fade = close ? clamp(u * 6) : 1;
    ctx.save(); ctx.lineJoin = 'round';
    if (shape === 'circle' || shape === 'ring') {
      paintRing(ctx, Cc[0], Cc[1], s + w * .4, w, rim, tr.id, fade);
      if (p.pair !== false) { const a = (rot + 40) * D2R, off = s * .18, s2 = s * .62; paintRing(ctx, Cc[0] + Math.cos(a) * off, Cc[1] + Math.sin(a) * off, s2, w * .55, COL.ink === rim ? COL.pink : '#15131F', tr.id + 'b', fade * .9); }
    } else {
      ctx.lineWidth = w; ctx.strokeStyle = rim; ctx.globalAlpha = fade; ctx.stroke(new Path2D(pathOf(s + w * .4)));
      ctx.lineWidth = w * .28; ctx.strokeStyle = '#15131F'; ctx.globalAlpha = .7 * fade; ctx.stroke(new Path2D(pathOf(s - w * .1)));
    }
    ctx.restore();
  },
});

// ---------------------------------------------------------------- pageturn: the outgoing page turns over a hinge with a curl
// params: hinge 'left' (default) | 'right', strips (6), curl (deg of extra bend at mid-turn, 55), persp (1500), back (paper)
register('pageturn', {
  dur: 1.5, lead: .6, order: 'out-top', ground: ['out'], defaults: { hinge: 'left', strips: 6, curl: 55, persp: 3200, back: PAPER },
  apply(tr, t, u, X) {
    const p = tr.p, R = p.rect === 'item' ? itemRect(tr.outs[0]) : (p.rect || [0, 0, W, H]), K = p.strips, sgn = p.hinge === 'right' ? -1 : 1;
    const x0 = sgn > 0 ? R[0] : R[0] + R[2], sw = R[2] / K;
    const th = 180 * E.ioCub(clamp(u / .95)), bend = p.curl * Math.sin(Math.PI * clamp(u / .95));
    const ctx = X.ovl();
    // chain of strips: strip k turns by th + bend * k / K about the far edge of strip k - 1 (a page curling as it turns)
    const ang = k => -(th + bend * (k + .5) / K) * sgn;
    const backs = [];
    for (const e of X.outs) {
      setStyle(e, 'visibility', 'hidden');
      let hinge = [x0, 0, 0], dir = [sgn, 0, 0];
      for (let k = 0; k < K; k++) {
        const a = ang(k) * D2R, c = Math.cos(a), s = Math.sin(a);
        const d = [sgn * c, 0, -sgn * s];   // rotateY(a) of (sgn, 0, 0)
        const xs = x0 + sgn * k * sw;      // the strip's flat position
        // CSS: translate the strip so its near edge sits on the hinge, then rotateY about that edge
        const c2 = X.clone(e, e); c2.style.visibility = 'visible'; c2.style.backfaceVisibility = 'hidden';
        c2.style.clipPath = sgn > 0 ? `inset(0px ${(W - xs - sw - .8).toFixed(1)}px 0px ${xs.toFixed(1)}px)` : `inset(0px ${(W - xs).toFixed(1)}px 0px ${(xs - sw - .8).toFixed(1)}px)`;
        const T0 = originOf(c2), dx = hinge[0] - xs, dz = hinge[2];
        c2.style.transform = `perspective(${p.persp}px) translate3d(${(hinge[0] - T0[0]).toFixed(2)}px,${(-T0[1]).toFixed(2)}px,${dz.toFixed(2)}px) rotateY(${ang(k).toFixed(2)}deg) translate(${(T0[0] - xs).toFixed(2)}px,${T0[1].toFixed(2)}px) ` + (c2.style.transform || '');
        void dx;
        // the strip's 4 corners for the back side / shading
        const corner = (fx, y) => { const v = [hinge[0] + d[0] * fx * sw, y, hinge[2] + d[2] * fx * sw]; return project(v, p.persp); };
        const q = [corner(0, R[1]), corner(1, R[1]), corner(1, R[1] + R[3]), corner(0, R[1] + R[3])];
        const facing = Math.cos(a) > 0;
        backs.push({ q, facing, shade: Math.abs(Math.sin(a)), z: hinge[2] });
        hinge = [hinge[0] + d[0] * sw, 0, hinge[2] + d[2] * sw];
        void dir;
      }
    }
    // shadow the page casts on what is underneath, then the paper backs of strips turned past 90 degrees, shading on the fronts
    const shw = Math.sin(th * D2R);
    if (shw > .01) { const g = ctx.createLinearGradient(x0, 0, x0 + sgn * R[2] * .7 * (1 - th / 180 * .85), 0); g.addColorStop(0, `rgba(14,13,18,${(.3 * shw * shw).toFixed(3)})`); g.addColorStop(1, 'rgba(14,13,18,0)'); ctx.fillStyle = g; ctx.fillRect(Math.min(x0, x0 + sgn * R[2]), R[1], R[2], R[3]); }
    backs.sort((x, y) => x.z - y.z);
    for (const b of backs) {
      ctx.beginPath(); b.q.forEach((z, i) => i ? ctx.lineTo(z[0], z[1]) : ctx.moveTo(z[0], z[1])); ctx.closePath();
      if (!b.facing) { ctx.fillStyle = p.back; ctx.fill(); ctx.fillStyle = `rgba(21,19,31,${(.08 + .32 * (1 - b.shade)).toFixed(3)})`; ctx.fill(); }
      else { ctx.fillStyle = `rgba(14,13,18,${(.5 * b.shade).toFixed(3)})`; ctx.fill(); }
    }
  },
});

HP.lib.transitions = { list: S.list, TYPES, register, camPunch, project, rotP, about, voronoi, itemRect, cloneLayer, swapLayer, setStyle, paintRing, speedLines, circlePath, polyPath,
  add(spec) { const tr = compile(spec, S.list.length); if (tr) { S.list.push(tr); S.list.sort((x, y) => x.a - y.a); } return tr; } };
})();
