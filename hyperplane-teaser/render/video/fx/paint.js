/* fx/paint.js  [BUILDER A]  handmade, skeuomorphic texture: paint, splatter, pencil, ink, paper
 * =================================================================================================================
 * BUILD.md REVISION 2 ("Handmade, skeuomorphic texture"): things PAINTED STROKE BY STROKE, paint splatter ("upping my p(doom)"),
 * things penciled in with line boil on twos. Recipes and parameters: research/rev2/style.md 4.1-4.5 (ported from the tested
 * research/rev2/style/proto/paint.js). Everything is a pure function of (item/stroke key, time): randomness comes from HP.rng
 * keys, boil from HP.boil(t), finished strokes/splats are baked once with HP.memo (keys carry everything that determines them).
 *
 * EXPORTS  HP.lib.paint  (other modules call these; signatures are stable, extend don't break)
 *   colour   col(name|hex), mix(a, b, k), shade(c, k), tint(c, k), rgba(c, a), PAL (cover nine + night)
 *   brush    makeStroke(pts, opts) -> S; drawStroke(ctx, S, p, {alpha, mask, body, from}); strokeAt(ctx, S, p, key, opts) (bakes when
 *            p >= 1); bakeStroke(key, S, {scale}); zigzag(rect, W, opts); stroke(ctx, spec, u) (the stub's signature, kept)
 *   shapes   shapePlan(shape, opts); paintShape(ctx, shape, u, opts); bakeShape(key, shape, opts, scale) -> {cv, x0, y0, scale};
 *            drawBaked(ctx, baked). shape = {kind: 'circle', cx, cy, r} | {kind: 'band', x0, y0, x1, y1, w} | {kind: 'poly', pts} |
 *            {kind: 'rect', x, y, w, h, rot} | {kind: 'path', path (Path2D | svg d), bbox: [x, y, w, h]} | {kind: 'line', pts, w}
 *   reveal   revealPlan(rect, opts) / drawReveal(ctx, plan, lt, drawContent, opts): a real screenshot painted in through 3 zig-zag
 *            bristle passes (0.36 s); the content pixels are never altered (mask only). highlight(ctx, spec, u) (marker pass).
 *   splat    makeSplat(spec), drawSplat(ctx, S, age, {cull}), splat(ctx, spec, age) (stub signature, kept)
 *   pencil   pencil(ctx, shapes, {key, t, color, alpha, width, boil, tooth}); shapes [{kind: line|underline|circle|ellipse|rect|
 *            arrow|scribble|curve|path|cross|star|hatch|check, ..., p (0..1 drawn on)}]; boilSeed(base, frame); PENCIL
 *   ink      installInkFilter(); bleed(key, w, h, drawFn, {id, halo}) -> baked canvas; makeStamp(spec); stamp(ctx, spec, age, {cull})
 *   paper    paperTile({seed, grain, mottle, fibres}) (1296x2304, memo); applyPaper(ctx, tile, {mode, alpha, dx, dy})
 *   wipe     wipe(ctx, spec, u, {out}) brush-wipe bands (3-5 bands, -8 deg; style.md 4.7)
 *   letters  hershey(text, {font, size}) -> glyph strokes in px with real pen order (fx/paint-hershey.json, loaded on demand)
 *
 * ITEM TYPES (edl/README.md "Builder A"): splat, stroke, paintshape, pencil, inkstamp, paper, brushwipe, brushtext.
 * Paint items draw into the shared canvas HP.shared('paint') (place it with {"type": "layer", "id": "paint"}) unless
 * "layer": "own" (a canvas in the item's own layer) or another shared name. Every beat event is marked (item.mark).
 */
(function () {
'use strict';
const { clamp, lerp, pr, smooth, el } = HP.u, E = HP.ease;
const W = HP.W, H = HP.H, EPS = HP.EPS;
const COL = HP.COL, NIGHT = '#0E0D12';
const PAL = { ...COL, night: NIGHT, ground: NIGHT, paper: '#FBF7EE', black: COL.ink, white: '#FBF7EE' };
const col = c => (c && PAL[c]) || c || COL.ink;

// ============================================================ colour helpers
function hex2rgb(h) { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function rgb2hex(r, g, b) { return '#' + [r, g, b].map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join(''); }
function mix(a, b, k) { const A = hex2rgb(col(a)), B = hex2rgb(col(b)); return rgb2hex(lerp(A[0], B[0], k), lerp(A[1], B[1], k), lerp(A[2], B[2], k)); }
const shade = (c, k) => mix(c, '#000000', k), tint = (c, k) => mix(c, '#ffffff', k);
function rgba(c, a) { const [r, g, b] = hex2rgb(col(c)); return `rgba(${r},${g},${b},${a})`; }

// ============================================================ seeded helpers (numeric, fast; keys may be strings)
const seedOf = k => typeof k === 'number' ? (k >>> 0) : HP.hash(String(k));
const rngOf = k => HP.u.mulberry32(seedOf(k));
function hash1(i, seed) { let h = (i * 374761393 + seed * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function noise1(x, seed = 0) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash1(i, seed), hash1(i + 1, seed), u) * 2 - 1; }   // -1..1
function gauss(r) { return Math.sqrt(-2 * Math.log(1 - r() * .999)) * Math.cos(6.283 * r()); }
const MEMO = (k, fn) => HP.memo('paint|' + k, fn);

// scratch canvases (reused; always cleared before use, so frames stay independent)
const SCR = [];
function scratch(k, w, h) {
  w = Math.max(1, Math.ceil(w)); h = Math.max(1, Math.ceil(h));
  let c = SCR[k];
  if (!c || c.width < w || c.height < h) { c = SCR[k] = HP.offscreen(Math.max(w, c ? c.width : 0), Math.max(h, c ? c.height : 0)); }
  const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none';
  x.clearRect(0, 0, c.width, c.height);
  return x;
}

// ============================================================ bristle brush (style.md 4.1)
function catmull(pts, step) {
  if (pts.length < 2) return pts.slice();
  const P = [pts[0], ...pts, pts[pts.length - 1]], out = [];
  for (let i = 1; i < P.length - 2; i++) {
    const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
    const n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
                0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  out.push(pts[pts.length - 1]); return out;
}
// makeStroke(pts, {width 70, dry .35, gaps .45, pressure [.8, 1, .4], thinning .5, streamline .42, smoothing .5, wet .55,
//   jitter 1.1, seed, color, spacing 3, shadeVar .11, body .82, bristles}) -> S (geometry only; draw with drawStroke)
function makeStroke(pts, o = {}) {
  const { width = 70, dry = .35, gaps = .45, pressure = [.8, 1, .4], thinning = .5, streamline = .42, smoothing = .5,
    wet = .55, jitter = 1.1, spacing = 3, shadeVar = .11, body = .82 } = o;
  const color = col(o.color || 'yellow');
  const bristles = o.bristles || Math.max(16, Math.min(56, Math.round(width / 3.2)));
  const R = rngOf(o.seed ?? JSON.stringify(pts).slice(0, 120));
  const C = catmull(pts, Math.max(1, spacing * (o.unit || 1))), N = C.length;
  const L = [0]; for (let i = 1; i < N; i++) L.push(L[i - 1] + Math.hypot(C[i][0] - C[i - 1][0], C[i][1] - C[i - 1][1]));
  const total = L[N - 1] || 1;
  const prs = L.map(s => { const u = s / total; return u < .15 ? lerp(pressure[0], pressure[1], smooth(u / .15)) : u > .8 ? lerp(pressure[1], pressure[2], smooth((u - .8) / .2)) : pressure[1]; });
  const size = body * width / (2 * (0.5 - thinning * (0.5 - 1)));
  const half = prs.map(p => (size / body) * (0.5 - thinning * (0.5 - p)));
  const T = C.map((c, i) => { const a = C[Math.max(0, i - 1)], b = C[Math.min(N - 1, i + 1)]; let tx = b[0] - a[0], ty = b[1] - a[1]; const m = Math.hypot(tx, ty) || 1; return [tx / m, ty / m]; });
  const bw = (width / bristles) * 1.35, U = o.unit || 1;    // unit: user units per px (hair noise periods are in px)
  const B = [];
  for (let k = 0; k < bristles; k++) {
    const u = (k + .5) / bristles * 2 - 1, outer = Math.abs(u);
    const budget = 1 - dry * Math.pow(outer, 1.4) * (.45 + .55 * R());
    const lum = (R() - .5) * 2 * shadeVar;
    const c = lum > 0 ? tint(color, lum) : shade(color, -lum);
    const baseA = .62 + .33 * R(), gseed = Math.floor(R() * 1e6), wseed = Math.floor(R() * 1e6);
    const P2 = [];
    for (let i = 0; i < N; i++) {
      const s = L[i] / total;
      const wob = noise1(L[i] / (70 * U), wseed) * jitter * bw * .55, off = u * half[i] + wob;
      let a = baseA * clamp((budget - s) / .12, 0, 1);
      const g = noise1(L[i] / (34 * U), gseed), thr = 1 - gaps * (.35 + .65 * outer) * .9;
      a *= 1 - .88 * smooth(clamp((g - thr) / .12 + .5));
      if (s < .04) a = Math.max(a, baseA * .9);
      P2.push([C[i][0] - T[i][1] * off, C[i][1] + T[i][0] * off, a]);
    }
    B.push({ col: c, pts: P2, w: bw * (.8 + .5 * R()) });
  }
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const c of C) { x0 = Math.min(x0, c[0]); y0 = Math.min(y0, c[1]); x1 = Math.max(x1, c[0]); y1 = Math.max(y1, c[1]); }
  const m = width * .75 + 4 * U;
  return { C, L, total, pr: prs, half, size, B, color, unit: U, bbox: [x0 - m, y0 - m, x1 - x0 + 2 * m, y1 - y0 + 2 * m],
    o: { thinning, streamline, smoothing, wet, width, body } };
}
function silhouette(S, n0, n1, last) {
  const pts = []; for (let i = n0; i < n1; i++) pts.push([S.C[i][0], S.C[i][1], S.pr[i]]);
  return HP.lib.freehand.getStroke(pts, { size: S.size, thinning: S.o.thinning, smoothing: S.o.smoothing, streamline: S.o.streamline,
    simulatePressure: false, last, start: { cap: false, taper: 0 }, end: { cap: false, taper: 0 } });
}
function polyPath(poly) { const p = new Path2D(); if (!poly.length) return p; p.moveTo(poly[0][0], poly[0][1]); for (let i = 1; i < poly.length; i++) p.lineTo(poly[i][0], poly[i][1]); p.closePath(); return p; }
// drawStroke(ctx, S, p): the first fraction p of the stroke ({from: f} starts at fraction f: a tail being torn away)
function drawStroke(ctx, S, p, { alpha = 1, mask = false, body = .5, from = 0 } = {}) {
  p = clamp(p); if (p <= 0 || from >= p) return;
  const N = S.C.length, n1 = Math.max(2, Math.floor(1 + p * (N - 1))), n0 = Math.min(n1 - 2, Math.floor(clamp(from) * (N - 1)));
  if (n1 - n0 < 2) return;
  const out = silhouette(S, n0, n1, p >= 1), sil = polyPath(out);
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const A0 = ctx.globalAlpha;
  ctx.globalAlpha = A0 * alpha * (mask ? 1 : body); ctx.fillStyle = mask ? '#fff' : S.color; ctx.fill(sil);
  const buckets = 6;
  for (const b of S.B) {
    let i = n0;
    while (i < n1) {
      const q = Math.round(b.pts[i][2] * buckets); let j = i;
      while (j + 1 < n1 && Math.round(b.pts[j + 1][2] * buckets) === q) j++;
      if (q > 0 && j > i) {
        ctx.beginPath(); ctx.moveTo(b.pts[i][0], b.pts[i][1]); for (let k = i + 1; k <= j; k++) ctx.lineTo(b.pts[k][0], b.pts[k][1]);
        ctx.lineWidth = b.w; ctx.globalAlpha = A0 * alpha * (mask ? Math.min(1, q / buckets * 1.2) : q / buckets); ctx.strokeStyle = mask ? '#fff' : b.col; ctx.stroke();
      }
      i = j + 1;
    }
  }
  if (!mask && S.o.wet > 0 && out.length > 4) {
    const m = out.length >> 1;
    const side = arr => { const q = new Path2D(); arr.forEach((pt, i) => i ? q.lineTo(pt[0], pt[1]) : q.moveTo(pt[0], pt[1])); return q; };
    ctx.save(); ctx.clip(sil); ctx.globalAlpha = A0 * alpha * S.o.wet * .42; ctx.strokeStyle = shade(S.color, .36);
    ctx.lineWidth = Math.max(3 * (S.unit || 1), S.o.width * .08); ctx.lineJoin = 'round';
    ctx.stroke(side(out.slice(0, m))); ctx.stroke(side(out.slice(m))); ctx.restore();
  }
  ctx.restore();
}
// bake a finished stroke into a tight bitmap once (scale = bitmap px per user unit)
function bakeStroke(key, S, o = {}) {
  const scale = o.scale || 1;
  return MEMO('stroke|' + key + '|' + scale + '|' + (o.alpha ?? 1) + '|' + (o.body ?? .5), () => {
    const [x0, y0, w, h] = S.bbox, cv = HP.offscreen(w * scale, h * scale), c = cv.getContext('2d');
    c.setTransform(scale, 0, 0, scale, -x0 * scale, -y0 * scale); drawStroke(c, S, 1, o);
    return { cv, x0, y0, scale };
  });
}
function drawBaked(ctx, b, alpha = 1) {
  if (!b) return; const A = ctx.globalAlpha; ctx.globalAlpha = A * alpha;
  ctx.drawImage(b.cv, b.x0, b.y0, b.cv.width / b.scale, b.cv.height / b.scale); ctx.globalAlpha = A;
}
// draw progress p; when finished (p >= 1, from 0) draw the baked bitmap (identical pixels, ~1 ms)
function strokeAt(ctx, S, p, key, o = {}) {
  if (p <= 0) return;
  if (p >= 1 && !(o.from > 0) && key && !o.mask) {
    const tr = ctx.getTransform(), sc = Math.hypot(tr.a, tr.b) || 1;
    drawBaked(ctx, bakeStroke(key, S, { ...o, scale: clamp(Math.round(sc * 4) / 4, .25, 2) }));   // quantised: a drifting scale must not re-bake
    return;
  }
  drawStroke(ctx, S, p, o);
}
// zig-zag rows covering a rect (boustrophedon, reading order)
function zigzag(rect, brushW, { angle = -4, overlap = .22, pad = 60, seed = 1, bow = .12 } = {}) {
  const R = rngOf('zz|' + seed); const [x, y, w, h] = rect; const rows = Math.max(1, Math.ceil(h / (brushW * (1 - overlap))));
  const out = [], a = angle * Math.PI / 180;
  for (let r = 0; r < rows; r++) {
    const cy = y + (rows === 1 ? h / 2 : (r + .5) * h / rows), dir = r % 2 ? -1 : 1;
    const x0 = x - pad, x1 = x + w + pad, mid = (x0 + x1) / 2, bo = (R() - .5) * 2 * bow * brushW * 2;
    const f = t => { const xx = lerp(x0, x1, t); return [xx, cy + (xx - mid) * Math.tan(a) + Math.sin(t * Math.PI) * bo + (R() - .5) * 3]; };
    const pts = [f(0), f(.33), f(.66), f(1)]; if (dir < 0) pts.reverse(); out.push(pts);
  }
  return out;
}
// the stub's signature, kept: spec {points, width, color, dry, gaps, ...}, u = progress
function stroke(ctx, s, u) {
  const key = s.key || s.id || JSON.stringify(s.points).slice(0, 80);
  const S = MEMO('mk|' + key + '|' + (s.width || 60) + (s.color || ''), () => makeStroke(s.points, { width: s.width || 60, color: s.color, seed: key, dry: s.dry, gaps: s.gaps, wet: s.wet, pressure: s.pressure, thinning: s.thinning }));
  strokeAt(ctx, S, u, key, { alpha: s.alpha ?? 1 });
}
// highlighter pass (style.md 4.1): {x0, x1, y, h (cap height x 1.1), angle, color (yellow), alpha (.85), key}; multiply, behind-ink look
function highlight(ctx, s, u) {
  if (u <= 0) return;
  const key = s.key || `${s.x0},${s.x1},${s.y}`, w = s.h || 56, a = (s.angle || 0) * Math.PI / 180, ov = s.over ?? 20;
  const S = MEMO('hl|' + key + '|' + w, () => {
    const x0 = s.x0 - ov, x1 = s.x1 + ov, dy = Math.tan(a) * (x1 - x0);
    return makeStroke([[x0, s.y], [lerp(x0, x1, .5), s.y + dy / 2 - 2], [x1, s.y + dy]], { width: w, color: s.color || 'yellow', seed: key, dry: .3, gaps: .35, pressure: [.8, 1, .7] });
  });
  ctx.save(); ctx.globalCompositeOperation = s.blend || 'multiply'; strokeAt(ctx, S, u, 'hl|' + key + '|' + w, { alpha: s.alpha ?? .85 }); ctx.restore();
}

// ============================================================ painted reveal of real content (style.md 4.1; the pixels are never altered)
function revealPlan(rect, o = {}) {
  const key = o.key || rect.map(v => Math.round(v)).join(',');
  return MEMO('reveal|' + key + '|' + JSON.stringify(o), () => {
    const width = o.width ?? 92, color = o.color ?? 'pink', pass = o.pass ?? 0.17, gap = o.gap ?? 0.07, md = o.maskDelay ?? 0.05, pad = o.pad ?? 60;
    const [x, y, w, h] = rect;
    const paths = zigzag([x, y - 20, w, h + 40], width, { seed: key, angle: o.angle ?? -3, overlap: o.overlap ?? .22, pad });
    const under = paths.map((pts, i) => ({ S: makeStroke(pts, { width, color, seed: key + 'u' + i, dry: .4, gaps: .5 }), t0: i * gap, dur: pass, key: key + 'u' + i }));
    const mask = paths.map((pts, i) => ({ S: makeStroke(pts, { width: width * (o.maskK ?? .78), color: '#ffffff', seed: key + 'm' + i, dry: .25, gaps: .25 }), t0: i * gap + md, dur: pass }));
    return { rect, under, mask, end: Math.max(...mask.map(s => s.t0 + s.dur)), key, pad: pad + width };
  });
}
// drawContent(ctx) draws the content in the same user units; o.under (true) draws the colour passes under it
function drawReveal(ctx, plan, lt, drawContent, o = {}) {
  if (lt < 0) return;
  const ease = o.ease || E.oQuad;
  if (o.under !== false) plan.under.forEach(s => strokeAt(ctx, s.S, ease(clamp((lt - s.t0) / s.dur)), s.key, { alpha: o.alpha ?? .92 }));
  if (lt >= plan.end) { drawContent(ctx); return; }
  const [x, y, w, h] = plan.rect, pad = plan.pad, bx = x - pad, by = y - pad, bw = w + 2 * pad, bh = h + 2 * pad;
  const m = scratch(0, bw, bh), c = scratch(1, bw, bh);
  m.setTransform(1, 0, 0, 1, -bx, -by); plan.mask.forEach(s => drawStroke(m, s.S, ease(clamp((lt - s.t0) / s.dur)), { mask: true }));
  c.setTransform(1, 0, 0, 1, -bx, -by); drawContent(c);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'destination-in'; c.drawImage(m.canvas, 0, 0); c.globalCompositeOperation = 'source-over';
  ctx.drawImage(c.canvas, 0, 0, bw, bh, bx, by, bw, bh);
}

// ============================================================ painting a shape on, stroke by stroke (style.md 4.1 "painted discs and bands")
function wobblyCircle(cx, cy, r, seed) {
  const p = new Path2D(), ph = (seedOf(seed) % 1000) / 159;
  for (let i = 0; i <= 72; i++) { const th = i / 72 * 2 * Math.PI, rr = r * (1 + .018 * Math.sin(th * 5 + ph) + .012 * Math.sin(th * 11 + 2 * ph)); const x = cx + Math.cos(th) * rr, y = cy + Math.sin(th) * rr; i ? p.lineTo(x, y) : p.moveTo(x, y); }
  p.closePath(); return p;
}
function toPath(d) { return d instanceof Path2D ? d : new Path2D(d); }
function polyBBox(pts) { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); const x0 = Math.min(...xs), y0 = Math.min(...ys); return [x0, y0, Math.max(...xs) - x0, Math.max(...ys) - y0]; }
function rectPts(s) { const a = (s.rot || 0) * Math.PI / 180, c = Math.cos(a), si = Math.sin(a), cx = s.x + s.w / 2, cy = s.y + s.h / 2; return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => [cx + (u * s.w / 2) * c - (v * s.h / 2) * si, cy + (u * s.w / 2) * si + (v * s.h / 2) * c]); }
// a plan: strokes with time windows [a, b] inside u = 0..1, a clip path, an under-fill. opts: {color, style ('swirl' | 'passes'),
// angle, width, dry, gaps, under (0..1 alpha of the flat fill at u = 1), unit (user units per px), key}
function shapePlan(shape, o = {}) {
  const key = o.key || JSON.stringify(shape).slice(0, 160);
  return MEMO('plan|' + key + '|' + JSON.stringify(o).slice(0, 200), () => {
    const color = col(o.color || shape.color || 'pink'), U = o.unit || 1, sd = k => key + '|' + k;
    const plan = { strokes: [], clip: null, under: null, bbox: null, color };
    const add = (pts, opts, a, b) => plan.strokes.push({ S: makeStroke(pts, { color, unit: U, seed: sd(plan.strokes.length), ...opts }), a, b, key: sd('s' + plan.strokes.length) });
    const k = shape.kind;
    if (k === 'circle') {
      const { cx, cy, r } = shape, R = rngOf(sd('c')), style = o.style || 'swirl';
      plan.clip = wobblyCircle(cx, cy, r, key); plan.under = { path: plan.clip, alpha: o.under ?? .9 }; plan.bbox = [cx - r, cy - r, 2 * r, 2 * r];
      if (style === 'passes') {
        const bw = r * .62, rows = zigzag([cx - r, cy - r, 2 * r, 2 * r], bw, { angle: o.angle ?? -18, pad: 40 * U, seed: sd('z'), overlap: .3, bow: .06 });
        rows.forEach((pts, i) => add(pts, { width: bw, dry: .15, gaps: .2, wet: .12, pressure: [1, 1, 1], thinning: .05 }, i * .7 / rows.length, i * .7 / rows.length + .42));
      } else {   // swirl: two broad loops of the brush round the disc (outer, then inner), then a dab across the middle
        const dir = R() < .5 ? 1 : -1, th0 = R() * 2 * Math.PI;
        const ring = (rad, turns, n) => { const pts = []; for (let i = 0; i <= n; i++) { const th = th0 + dir * turns * 2 * Math.PI * i / n; const rr = rad * (1 + .06 * Math.sin(i * 1.3 + th0)); pts.push([cx + Math.cos(th) * rr, cy + Math.sin(th) * rr]); } return pts; };
        add(ring(r * .64, 1.12, 24), { width: r * .98, dry: .16, gaps: .2, wet: .1, pressure: [.9, 1, .8], thinning: .15, shadeVar: .07 }, 0, .66);
        add(ring(r * .22, 1.0, 12), { width: r * .7, dry: .2, gaps: .22, wet: .08, pressure: [.9, 1, .8], thinning: .2, shadeVar: .07 }, .45, .9);
        const a = th0 + Math.PI * .3; add([[cx - Math.cos(a) * r * .6, cy - Math.sin(a) * r * .6], [cx, cy + r * .03], [cx + Math.cos(a) * r * .6, cy + Math.sin(a) * r * .6]], { width: r * .42, dry: .35, gaps: .35, wet: .08, pressure: [.8, 1, .4], shadeVar: .09 }, .74, 1);
      }
    } else if (k === 'band') {
      const { x0, y0, x1, y1, w } = shape;
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, nx = -(y1 - y0), ny = x1 - x0, nn = Math.hypot(nx, ny) || 1, bow = (o.bow ?? .003) * nn;
      add([[x0, y0], [lerp(x0, mx, .5) + nx / nn * bow, lerp(y0, my, .5) + ny / nn * bow], [mx, my], [lerp(mx, x1, .5) - nx / nn * bow, lerp(my, y1, .5) - ny / nn * bow], [x1, y1]],
        { width: w * (o.widthK ?? 1.15), dry: .22, gaps: .3, pressure: [.95, 1, .9], thinning: .15, wet: .45 }, 0, 1);
      plan.bbox = polyBBox([[x0, y0 - w], [x1, y1 + w]]);
      if (o.clip) { plan.clip = toPath(o.clip); }
    } else if (k === 'line') {
      const pts = shape.pts || [[shape.x0, shape.y0], [shape.x1, shape.y1]];
      add(pts, { width: (shape.w || 12) * (o.widthK ?? 1.5), dry: o.dry ?? .1, gaps: o.gaps ?? .15, pressure: [.85, 1, .7], thinning: .3, wet: .2, bristles: 16 }, 0, 1);
      plan.bbox = polyBBox(pts);
    } else {   // rect | poly | path: parallel passes clipped to the shape
      let pts = null;
      if (k === 'rect') pts = rectPts(shape); else if (k === 'poly') pts = shape.pts;
      plan.clip = pts ? polyPath(pts) : toPath(shape.path);
      plan.bbox = pts ? polyBBox(pts) : shape.bbox;
      plan.under = { path: plan.clip, alpha: o.under ?? .8 };
      const [bx, by, bw0, bh0] = plan.bbox, bw = o.width || Math.max(18 * U, Math.min(bw0, bh0) * .55);
      const rows = zigzag([bx, by, bw0, bh0], bw, { angle: o.angle ?? -18, pad: 30 * U, seed: sd('z'), overlap: .28, bow: .05 });
      const n = rows.length;
      rows.forEach((p, i) => add(p, { width: bw, dry: o.dry ?? .15, gaps: o.gaps ?? .22, wet: .15, pressure: [1, 1, .85], thinning: .08 }, n > 1 ? i * .65 / (n - 1) : 0, n > 1 ? i * .65 / (n - 1) + .35 : 1));
    }
    return plan;
  });
}
// paintShape(ctx, shape, u, opts): u 0..1 painted on (opts.ease per stroke: oQuad); the flat under-fill grows in behind the strokes
function paintShape(ctx, shape, u, o = {}) {
  if (u <= 0) return;
  const plan = shapePlan(shape, o), ease = o.ease || E.oQuad;
  ctx.save();
  if (plan.clip) ctx.clip(plan.clip);
  if (plan.under && plan.under.alpha > 0) { const a = plan.under.alpha * smooth(clamp((u - .25) / .75)); if (a > 0) { ctx.globalAlpha *= a; ctx.fillStyle = plan.color; ctx.fill(plan.under.path); ctx.globalAlpha /= a; } }
  for (const s of plan.strokes) { const p = clamp((u - s.a) / Math.max(1e-3, s.b - s.a)); if (p > 0) (u >= 1 ? drawStroke : drawStroke)(ctx, s.S, ease(p), { alpha: o.alpha ?? 1 }); }
  ctx.restore();
}
// bake a finished painted shape (scale = bitmap px per user unit)
function bakeShape(key, shape, o = {}, scale = 1) {
  return MEMO('shape|' + key + '|' + scale + '|' + JSON.stringify(o).slice(0, 200), () => {
    const plan = shapePlan(shape, { ...o, key }), [bx, by, bw, bh] = plan.bbox, m = (o.width || 0) + 40 * (o.unit || 1);
    const x0 = bx - m, y0 = by - m, cv = HP.offscreen((bw + 2 * m) * scale, (bh + 2 * m) * scale), c = cv.getContext('2d');
    c.setTransform(scale, 0, 0, scale, -x0 * scale, -y0 * scale); paintShape(c, shape, 1, { ...o, key });
    return { cv, x0, y0, scale };
  });
}

// ============================================================ splatter (style.md 4.3)
// spec {x, y, R | r (core radius), dir (radians; or dirDeg), color, seed, sats (46), spikes (9), drips (3), spread (.55)}
function makeSplat(s) {
  const key = 'splat|' + (s.key ?? s.seed ?? s.id ?? `${s.x},${s.y}`) + '|' + (s.R ?? s.r) + '|' + (s.color || '') + (s.noCore ? '|nc' : '');
  return MEMO(key, () => {
    const r = rngOf(key), R = s.R ?? s.r ?? 130, dir = s.dir ?? (s.dirDeg !== undefined ? s.dirDeg * Math.PI / 180 : -Math.PI / 2);
    const sats = s.sats ?? 46, spikes = s.spikes ?? 9, drips = s.drips ?? 3, spread = s.spread ?? .55, color = col(s.color || 'pink');
    const ph = [r() * 6.28, r() * 6.28, r() * 6.28];
    const sp = []; for (let i = 0; i < spikes; i++) { const a = r() < .65 ? dir + (r() - .5) * 2.2 : r() * 6.283; sp.push({ a, amp: (.22 + r() * .5), sig: .05 + r() * .05, bulb: .045 + r() * .05 }); }
    const rad = th => { let v = 1 + .13 * Math.sin(3 * th + ph[0]) + .08 * Math.sin(5 * th + ph[1]) + .05 * Math.sin(9 * th + ph[2]);
      for (const q of sp) { const d = Math.atan2(Math.sin(th - q.a), Math.cos(th - q.a)); v += q.amp * Math.exp(-(d * d) / (2 * q.sig * q.sig)); } return v * R; };
    const satl = [];
    for (let i = 0; i < sats; i++) {
      const rr = R * Math.min(s.satMax ?? .17, .035 + .2 * Math.pow(r(), 2.4)), dist = R * (1.25 + -Math.log(1 - r() * .96) * .95);
      const ang = r() < .72 ? dir + gauss(r) * spread : r() * 6.283;
      satl.push({ ang, dist, r: rr, delay: dist / R * .012, kill: r() });
    }
    const dr = []; for (let i = 0; i < drips; i++) { const a = Math.PI / 2 + (r() - .5) * 1.5; dr.push({ a, w: R * (.07 + r() * .07), len: R * (.9 + r() * 1.7), t0: .2 + r() * .35, dur: .9 + r() * .9 }); }
    const N = 150, prof = []; for (let i = 0; i <= N; i++) prof.push(rad(i / N * 2 * Math.PI));
    return { x: s.x, y: s.y, R, dir, color, rad, prof, satl, dr, sp, rim: shade(color, .22), noRim: s.rim === false, noCore: !!s.noCore };
  });
}
// age (s) since the impact frame; cull 0..1 removes droplets one by one (random order), shrinks and notches the core and dries it to a
// stain (alpha .4); cull 1..2 the stain (the core only) fades away: the residue (callers: residueAt(t, start))
function drawSplat(ctx, S, age, { cull = 0, alpha = 1 } = {}) {
  if (age < 0 || cull >= 2) return; const { x, y, R } = S, res = clamp(cull - 1); cull = clamp(cull);
  ctx.save(); ctx.globalAlpha *= alpha * (1 - .6 * smooth(cull)) * (1 - res); ctx.fillStyle = S.color; ctx.strokeStyle = S.rim; ctx.lineJoin = 'round';
  const k = age < .075 ? lerp(.35, 1.08, E.oQuad(age / .075)) : age < .14 ? lerp(1.08, 1, smooth((age - .075) / .065)) : 1, kk = 1 - cull * .1;
  const N = S.prof.length - 1; ctx.beginPath();
  for (let i = 0; i <= N; i++) { const th = i / N * 6.2832, rr = S.prof[i] * k * kk * (1 - cull * .15 * (noise1(th * 3, 5) * .5 + .5)); const px = x + Math.cos(th) * rr, py = y + Math.sin(th) * rr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.closePath();
  if (S.noCore) ctx.beginPath(); else ctx.fill();   // noCore: a spray of droplets only (8th-note accents)
  if (!S.noRim && !S.noCore) { ctx.lineWidth = Math.max(2, R * .035); const A = ctx.globalAlpha; ctx.globalAlpha = A * .45; ctx.stroke(); ctx.globalAlpha = A; }
  if (!S.noCore && cull < 1) for (const s of S.sp) { const tipR = S.rad(s.a) * k * kk; ctx.beginPath(); ctx.arc(x + Math.cos(s.a) * tipR * .965, y + Math.sin(s.a) * tipR * .965, R * s.bulb * (1 - cull * .5), 0, 7); ctx.fill(); }
  for (const d of (S.noCore || cull >= 1 ? [] : S.dr)) {
    const p = E.oQuad(clamp((age - d.t0) / d.dur)); if (p <= 0) continue;
    const sx = x + Math.cos(d.a) * S.rad(d.a) * .86, sy = y + Math.sin(d.a) * S.rad(d.a) * .86, len = d.len * p * (1 - cull * .3);
    ctx.beginPath(); ctx.moveTo(sx - d.w / 2, sy); ctx.lineTo(sx - d.w * .38, sy + len); ctx.arc(sx, sy + len, d.w * .62, Math.PI, 0, true); ctx.lineTo(sx + d.w / 2, sy); ctx.closePath(); ctx.fill();
  }
  for (const s of S.satl) {
    if (s.kill < cull) continue; const f = E.oCub(clamp((age - s.delay) / .11)); if (f <= 0) continue;
    const d = s.dist * f, px = x + Math.cos(s.ang) * d, py = y + Math.sin(s.ang) * d, e = 1 + .9 * (s.dist / R) * (1 - f);
    ctx.save(); ctx.translate(px, py); ctx.rotate(s.ang); ctx.beginPath(); ctx.ellipse(0, 0, s.r * e, s.r * (1 / Math.sqrt(e) * .98 + .02), 0, 0, 7); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}
// the stub's signature, kept: splat(ctx, {x, y, r, color, seed | id, ...}, age)
function splat(ctx, s, age, o = {}) { drawSplat(ctx, makeSplat(s), age, o); }

// ============================================================ pencil, rough.js, boil on twos (style.md 4.2)
const PENCIL = { roughness: 1.1, bowing: .9, strokeWidth: 5.5, maxRandomnessOffset: 2.4, disableMultiStroke: false, curveFitting: .95 };
// boil: a new drawing every `hold` frames, cycling `variants` drawings (A A B B C C)
function boilSeed(base, frame, { hold = 2, variants = 3 } = {}) { return (seedOf(base) % 1000003) + (Math.floor(frame / hold) % variants) * 101 + 1; }
function toothTile() {
  return MEMO('tooth', () => {
    const n = 192, c = HP.offscreen(n, n), x = c.getContext('2d'), im = x.createImageData(n, n), R = rngOf('tooth'), cover = .3;
    for (let i = 0; i < n * n; i++) { const v = R() * .6 + R() * .4; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = 255; im.data[i * 4 + 3] = v < cover ? 255 * (1 - v / cover) * .95 + 40 : 0; }
    x.putImageData(im, 0, 0); return c;
  });
}
const RC = new WeakMap();
function roughOn(cv) { let r = RC.get(cv); if (!r) { r = HP.lib.rough.raw.canvas(cv); RC.set(cv, r); } return r; }
function lenOf(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
// one pencil shape into a rough canvas: s.p = drawn-on fraction (strokeLineDash), o = base options with the seed
function pencilShape(rc, s, o) {
  const p = clamp(s.p ?? 1); if (p <= 0) return;
  const dash = len => p >= 1 ? {} : { strokeLineDash: [Math.max(.01, len * 1.12 * p), 99999] };
  const q = { ...o, ...(s.opts || {}) };
  switch (s.kind) {
    case 'line': rc.line(s.x0, s.y0, s.x1, s.y1, { ...q, ...dash(Math.hypot(s.x1 - s.x0, s.y1 - s.y0)) }); break;
    case 'underline': { const sag = s.sag ?? 8, pts = [[s.x0, s.y], [lerp(s.x0, s.x1, .5), s.y + sag], [s.x1, s.y - sag * .4]]; rc.curve(pts, { ...q, ...dash(lenOf(pts)) }); break; }
    case 'circle': rc.ellipse(s.cx, s.cy, 2 * s.r * (s.k ?? 1.06), 2 * s.r * (s.k2 ?? .94), { ...q, ...dash(2 * Math.PI * s.r * 1.1) }); break;
    case 'ellipse': rc.ellipse(s.cx, s.cy, s.w, s.h, { ...q, ...dash(Math.PI * (s.w + s.h) / 2 * 1.1) }); break;
    case 'rect': rc.rectangle(s.x, s.y, s.w, s.h, { ...q, ...dash(2 * (s.w + s.h)) }); break;
    case 'curve': rc.curve(s.pts, { ...q, ...dash(lenOf(s.pts)) }); break;
    case 'path': rc.path(s.d, { ...q, ...dash(s.len || 1000) }); break;
    case 'arrow': {   // shaft first (70%), then the two barbs
      const a = Math.atan2(s.y1 - s.y0, s.x1 - s.x0), hd = s.head ?? 34, ps = clamp(p / .7), ph = clamp((p - .7) / .3);
      rc.line(s.x0, s.y0, s.x0 + (s.x1 - s.x0), s.y0 + (s.y1 - s.y0), { ...q, ...(ps >= 1 ? {} : { strokeLineDash: [Math.max(.01, Math.hypot(s.x1 - s.x0, s.y1 - s.y0) * 1.12 * ps), 99999] }) });
      if (ph > 0) for (const sg of [-1, 1]) { const b = a + Math.PI + sg * .45; rc.line(s.x1, s.y1, s.x1 + Math.cos(b) * hd * ph, s.y1 + Math.sin(b) * hd * ph, q); }
      break;
    }
    case 'scribble': {   // a loose zig-zag scribble filling a box
      const R = rngOf('scr|' + (s.key || `${s.cx},${s.cy}`)), n = s.n ?? 7, pts = [];
      for (let i = 0; i <= n; i++) pts.push([s.cx - s.w / 2 + s.w * i / n + (R() - .5) * s.w * .08, s.cy + (i % 2 ? -1 : 1) * s.h / 2 * (.7 + .3 * R())]);
      rc.curve(pts, { ...q, ...dash(lenOf(pts)) }); break;
    }
    case 'cross': { const r = s.r ?? 30, p1 = clamp(p * 2), p2 = clamp(p * 2 - 1); if (p1 > 0) rc.line(s.cx - r, s.cy - r, s.cx - r + 2 * r * p1, s.cy - r + 2 * r * p1, q); if (p2 > 0) rc.line(s.cx + r, s.cy - r, s.cx + r - 2 * r * p2, s.cy - r + 2 * r * p2, q); break; }
    case 'check': { const r = s.r ?? 30, p1 = clamp(p * 3), p2 = clamp(p * 1.5 - .5); if (p1 > 0) rc.line(s.cx - r, s.cy, s.cx - r + r * .6 * p1, s.cy + r * .6 * p1, q); if (p2 > 0) rc.line(s.cx - r * .4, s.cy + r * .6, s.cx - r * .4 + r * 1.4 * p2, s.cy + r * .6 - r * 1.6 * p2, q); break; }
    case 'star': { const n = s.n ?? 3, r = s.r ?? 30; for (let i = 0; i < n; i++) { const pp = clamp(p * n - i); if (pp <= 0) break; const a = i * Math.PI / n + (s.rot || 0); rc.line(s.cx - Math.cos(a) * r, s.cy - Math.sin(a) * r, s.cx - Math.cos(a) * r + 2 * Math.cos(a) * r * pp, s.cy - Math.sin(a) * r + 2 * Math.sin(a) * r * pp, q); } break; }
    case 'hatch': {   // short parallel strokes across a box, drawn one by one
      const n = s.n ?? Math.max(3, Math.round(s.w / (s.gap ?? 22))), a = (s.angle ?? 60) * Math.PI / 180;
      for (let i = 0; i < n; i++) { const pp = clamp(p * n - i); if (pp <= 0) break; const x = s.x + (i + .5) * s.w / n, dx = Math.cos(a) * s.h / 2, dy = Math.sin(a) * s.h / 2; rc.line(x - dx, s.y + s.h / 2 - dy, x - dx + 2 * dx * pp, s.y + s.h / 2 - dy + 2 * dy * pp, q); }
      break;
    }
  }
}
// pencil(ctx, shapes, {key, t (for the boil), color (#2A2832), alpha (.92), width (5.5), boil (2 = on twos; 0 = still), tooth (true), roughness})
// Draws through a full-frame scratch (with ctx's transform) so the graphite tooth knocks out only the pencil lines.
function pencilBox(s) {   // a generous bounding box of a pencil shape in its user units
  const m = 40;
  switch (s.kind) {
    case 'line': case 'arrow': return [Math.min(s.x0, s.x1) - m, Math.min(s.y0, s.y1) - m, Math.abs(s.x1 - s.x0) + 2 * m, Math.abs(s.y1 - s.y0) + 2 * m];
    case 'underline': return [Math.min(s.x0, s.x1) - m, s.y - m - (s.sag ?? 8), Math.abs(s.x1 - s.x0) + 2 * m, 2 * m + 2 * (s.sag ?? 8)];
    case 'circle': return [s.cx - s.r * 1.2 - m, s.cy - s.r * 1.2 - m, s.r * 2.4 + 2 * m, s.r * 2.4 + 2 * m];
    case 'ellipse': case 'scribble': return [s.cx - s.w * .6 - m, s.cy - s.h * .6 - m, s.w * 1.2 + 2 * m, s.h * 1.2 + 2 * m];
    case 'rect': case 'hatch': return [s.x - m, s.y - m, s.w + 2 * m, s.h + 2 * m];
    case 'curve': { const xs = s.pts.map(p => p[0]), ys = s.pts.map(p => p[1]); return [Math.min(...xs) - m, Math.min(...ys) - m, Math.max(...xs) - Math.min(...xs) + 2 * m, Math.max(...ys) - Math.min(...ys) + 2 * m]; }
    case 'cross': case 'check': case 'star': { const r = (s.r ?? 30) * 1.3 + m; return [s.cx - r, s.cy - r, 2 * r, 2 * r]; }
  }
  return null;
}
function pencil(ctx, shapes, o = {}) {
  if (!shapes.some(s => (s.p ?? 1) > 0)) return;
  const tr = ctx.getTransform();
  // the device-space box all shapes fall in (a full frame for paths); the scratch, tooth and copy only touch that box
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const s of shapes) { const b = pencilBox(s); if (!b) { x0 = 0; y0 = 0; x1 = W; y1 = H; break; }
    for (const [px, py] of [[b[0], b[1]], [b[0] + b[2], b[1]], [b[0], b[1] + b[3]], [b[0] + b[2], b[1] + b[3]]]) { const q = tr.transformPoint(new DOMPoint(px, py)); x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y); } }
  x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(W, Math.ceil(x1)); y1 = Math.min(H, Math.ceil(y1));
  if (x1 <= x0 || y1 <= y0) return;
  const bw = x1 - x0, bh = y1 - y0, sc = scratch(2, bw, bh); sc.setTransform(new DOMMatrix().translate(-x0, -y0).multiply(tr));
  const rc = roughOn(sc.canvas), fr = HP.frameNo(o.t ?? HP.t ?? 0);
  shapes.forEach((s, i) => {
    const seed = o.boil === 0 ? (seedOf((o.key || 'pencil') + '|' + i) % 1000003) + 1 : boilSeed((o.key || 'pencil') + '|' + i, fr, { hold: o.boil || 2 });
    pencilShape(rc, s, { ...PENCIL, stroke: col(s.color || o.color || '#2A2832'), strokeWidth: s.width ?? o.width ?? PENCIL.strokeWidth, roughness: s.roughness ?? o.roughness ?? PENCIL.roughness,
      maxRandomnessOffset: o.jitter ?? PENCIL.maxRandomnessOffset, seed });
  });
  if (o.tooth !== false) { sc.setTransform(1, 0, 0, 1, -x0 % 192, -y0 % 192); sc.globalCompositeOperation = 'destination-out'; sc.fillStyle = sc.createPattern(toothTile(), 'repeat'); sc.fillRect(x0 % 192, y0 % 192, bw, bh); sc.globalCompositeOperation = 'source-over'; }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha *= (o.alpha ?? .92); ctx.drawImage(sc.canvas, 0, 0, bw, bh, x0, y0, bw, bh); ctx.restore();
}

// ============================================================ ink bleed and ink stamps (style.md 4.4)
function installInkFilter() {
  if (document.getElementById('inkbleed-lg')) return;
  const f = (id, { freq, disp, blur, slope, icpt, seed }) => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="3" seed="${seed}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="${disp}" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="${blur}" result="b"/>
    <feComponentTransfer in="b"><feFuncA type="linear" slope="${slope}" intercept="${icpt}"/></feComponentTransfer></filter>`;
  const s = document.createElementNS(HP.u.NS, 'svg'); s.setAttribute('width', 0); s.setAttribute('height', 0); s.style.position = 'absolute';
  s.innerHTML = f('inkbleed-lg', { freq: .03, disp: 3.4, blur: 1.2, slope: 11, icpt: -4.0, seed: 3 }) + f('inkbleed-md', { freq: .05, disp: 2.0, blur: .9, slope: 9, icpt: -3.0, seed: 5 }) +
    f('inkbleed-stamp', { freq: .045, disp: 6, blur: 1.1, slope: 10, icpt: -3.6, seed: 9 }) +
    `<filter id="inkbleed-halo" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6"/></filter>`;
  document.body.appendChild(s);
}
// bake drawFn(ctx) (in a w x h box) through the bleed filter once; returns the canvas (draw it with drawImage every frame)
function bleed(key, w, h, drawFn, { id = 'inkbleed-lg', halo = .16 } = {}) {
  return MEMO('bleed|' + key + '|' + id + '|' + halo, () => {
    installInkFilter();
    const o = HP.offscreen(w, h), oc = o.getContext('2d'); drawFn(oc);
    const c = HP.offscreen(w, h), x = c.getContext('2d');
    if (halo > 0) { x.filter = 'url(#inkbleed-halo)'; x.globalAlpha = halo; x.drawImage(o, 0, 0); }
    x.filter = `url(#${id})`; x.globalAlpha = 1; x.drawImage(o, 0, 0); x.filter = 'none';
    return c;
  });
}
// a rubber stamp: {glyph: 'nabla' | 'ring' | 'disc' | 'square' | 'checker' | 'cross' | 'triangle' | 'star' | 'arrow' | 'text', text, size (px), color, key}
function makeStamp(s) {
  const size = s.size || 120, key = 'stamp|' + (s.key || '') + '|' + (s.glyph || 'nabla') + '|' + (s.text || '') + '|' + size + '|' + (s.color || '');
  return MEMO(key, () => {
    const m = Math.round(size * .35), w = s.glyph === 'text' ? Math.ceil(HP.text.measure(s.text || '', `700 ${size * .42}px 'IBM Plex Mono'`) + size * .7) : size;
    const cw = w + 2 * m, ch = size + 2 * m, color = col(s.color || 'ink');
    const out = bleed(key, cw, ch, c => {
      c.translate(m, m); c.fillStyle = color; c.strokeStyle = color; const z = size, lw = z * .11;
      c.lineWidth = lw; c.lineJoin = 'miter';
      const g = s.glyph || 'nabla';
      if (g === 'nabla') { c.beginPath(); c.moveTo(lw, z * .12); c.lineTo(z - lw, z * .12); c.lineTo(z / 2, z * .9); c.closePath(); c.stroke(); }
      else if (g === 'triangle') { c.beginPath(); c.moveTo(0, z * .12); c.lineTo(z, z * .12); c.lineTo(z / 2, z * .92); c.closePath(); c.fill(); }
      else if (g === 'ring') { c.beginPath(); c.arc(z / 2, z / 2, z / 2 - lw, 0, 7); c.lineWidth = lw * 1.5; c.stroke(); c.beginPath(); c.arc(z / 2, z / 2, z * .16, 0, 7); c.fill(); }
      else if (g === 'disc') { c.beginPath(); c.arc(z / 2, z / 2, z / 2, 0, 7); c.fill(); }
      else if (g === 'square') { c.fillRect(z * .1, z * .1, z * .8, z * .8); }
      else if (g === 'checker') { const q = z / 4; for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) if ((r + k) % 2 === 0) c.fillRect(k * q, r * q, q * .96, q * .96); }
      else if (g === 'cross') { c.lineWidth = lw * 1.6; c.lineCap = 'butt'; c.beginPath(); c.moveTo(z * .12, z * .12); c.lineTo(z * .88, z * .88); c.moveTo(z * .88, z * .12); c.lineTo(z * .12, z * .88); c.stroke(); }
      else if (g === 'star') { c.lineWidth = lw * 1.2; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(z / 2 - Math.cos(a) * z * .45, z / 2 - Math.sin(a) * z * .45); c.lineTo(z / 2 + Math.cos(a) * z * .45, z / 2 + Math.sin(a) * z * .45); c.stroke(); } }
      else if (g === 'arrow') { c.lineWidth = lw * 1.3; c.beginPath(); c.moveTo(z * .1, z * .9); c.lineTo(z * .85, z * .15); c.stroke(); c.beginPath(); c.moveTo(z * .9, z * .1); c.lineTo(z * .45, z * .16); c.lineTo(z * .84, z * .55); c.closePath(); c.fill(); }
      else if (g === 'text') { c.lineWidth = lw * .55; c.strokeRect(lw / 2, z * .12, w - lw, z * .76); c.font = `700 ${z * .42}px 'IBM Plex Mono'`; c.textBaseline = 'middle'; c.fillText(String(s.text || '').toUpperCase(), z * .35, z * .52); }
      // speckle: ink that did not take (the rubber's texture)
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'destination-out'; c.fillStyle = c.createPattern(toothTile(), 'repeat'); c.globalAlpha = .55; c.fillRect(0, 0, cw, ch);
      const R = rngOf(key); c.globalAlpha = 1; for (let i = 0; i < 26; i++) { c.beginPath(); c.ellipse(R() * cw, R() * ch, 1 + R() * size * .05, 1 + R() * size * .025, R() * 3, 0, 7); c.fill(); }
    }, { id: 'inkbleed-stamp', halo: 0 });
    return { cv: out, w: cw, h: ch };
  });
}
// stamp(ctx, {x, y (centre), rot (deg), ...glyph spec}, age): lands with a 2-frame squash (1.28 -> .96 -> 1), lifts with cull
function stamp(ctx, s, age, { cull = 0, alpha = .92 } = {}) {
  if (age < 0 || cull >= 1) return;
  const S = makeStamp(s), f = age * HP.FPS, k = f < 1 ? 1.28 : f < 2 ? .96 : 1;
  ctx.save(); ctx.translate(s.x, s.y); ctx.rotate((s.rot || 0) * Math.PI / 180); ctx.scale(k, k);
  ctx.globalAlpha *= alpha * (1 - cull) * (f < 1 ? .8 : 1); ctx.drawImage(S.cv, -S.w / 2, -S.h / 2); ctx.restore();
}

// ============================================================ paper grain (style.md 4.5): a neutral grey tile for soft-light / screen
function paperTile({ seed = 7, grain = 44, mottle = 12, fibres = 140, w = Math.round(W * 1.2), h = Math.round(H * 1.2) } = {}) {
  return MEMO(`paper|${seed}|${grain}|${mottle}|${fibres}|${w}x${h}`, () => {
    const c = HP.offscreen(w, h), x = c.getContext('2d'), R = rngOf('paper|' + seed);
    const cloud = (gw, gh, amp) => { const s = HP.offscreen(gw, gh), sx = s.getContext('2d'), im = sx.createImageData(gw, gh);
      for (let i = 0; i < gw * gh; i++) { const v = 128 + (R() + R() + R() - 1.5) * amp * 1.6; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
      sx.putImageData(im, 0, 0); return s; };
    x.fillStyle = '#808080'; x.fillRect(0, 0, w, h); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(cloud(Math.ceil(w / 90), Math.ceil(h / 90), mottle), 0, 0, w, h);
    x.globalAlpha = .5; x.drawImage(cloud(Math.ceil(w / 28), Math.ceil(h / 28), mottle * .7), 0, 0, w, h); x.globalAlpha = 1;
    const im = x.getImageData(0, 0, w, h), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const n = (R() + R() + R() - 1.5) * grain * 1.15; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    x.putImageData(im, 0, 0);
    x.lineCap = 'round';
    for (let i = 0; i < fibres; i++) {
      const px = R() * w, py = R() * h, a = R() * Math.PI * 2, l = 8 + R() * 26, bend = (R() - .5) * 8;
      x.strokeStyle = R() < .55 ? 'rgba(255,255,255,0.35)' : 'rgba(40,30,20,0.22)'; x.lineWidth = .6 + R() * .7;
      x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l / 2 + bend, py + Math.sin(a) * l / 2 + bend, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
    }
    return c;
  });
}
function applyPaper(ctx, tile, { mode = 'soft-light', alpha = 1, dx = 0, dy = 0 } = {}) { ctx.save(); ctx.globalCompositeOperation = mode; ctx.globalAlpha = alpha; ctx.drawImage(tile, dx, dy); ctx.restore(); }

// ============================================================ brush wipe (style.md 1.2 / 4.7): n tilted bands of strokes cross the frame
// spec {n (4), angle (-8), colors (['pink', 'violet']), key, dir (1 = left to right)}; u 0..1 = in; {out: v} tears the bands away (0..1)
function wipePlan(s) {
  const key = 'wipe|' + (s.key || '') + '|' + (s.n || 4) + '|' + (s.angle ?? -8) + '|' + JSON.stringify(s.colors || '');
  return MEMO(key, () => {
    const n = s.n || 4, a = (s.angle ?? -8) * Math.PI / 180, bw = 1.2 * H / n, cols = [].concat(s.colors || ['pink', 'violet']), R = rngOf(key), dir = s.dir || 1;
    const out = [];
    for (let i = 0; i < n; i++) {
      const cy = (i + .5) * H / n + (R() - .5) * 30, x0 = dir > 0 ? -200 : W + 200, x1 = dir > 0 ? W + 200 : -200;
      const pts = [0, .33, .66, 1].map(f => { const x = lerp(x0, x1, f); return [x, cy - (x - W / 2) * Math.tan(a) + Math.sin(f * Math.PI) * (R() - .5) * 60]; });
      out.push({ S: makeStroke(pts, { width: bw, color: cols[i % cols.length], seed: key + i, dry: .3, gaps: .35, wet: .5, pressure: [.95, 1, .85], thinning: .1, bristles: 56 }), d: i * .12 + R() * .06, key: key + i });
    }
    return out;
  });
}
function wipe(ctx, s, u, { out = 0 } = {}) {
  const P = wipePlan(s), ease = E.ioCub;
  for (const b of P) {
    const p = ease(clamp((u - b.d) / (1 - .5))), f = out > 0 ? ease(clamp((out - b.d) / (1 - .5))) : 0;
    if (p > 0 && f < 1) (f > 0 ? drawStroke(ctx, b.S, p, { from: f, body: 1 }) : strokeAt(ctx, b.S, p, b.key, { body: 1 }));
    if (p > 0 && f <= 0) { ctx.save(); ctx.globalAlpha *= clamp((p - .6) / .4); ctx.restore(); }
  }
}

// ============================================================ Hershey single-stroke script (real pen order) for brush lettering
let HERSHEY = null;
async function loadHershey() { if (!HERSHEY) HERSHEY = await HP.assets.json('fx/paint-hershey.json'); return HERSHEY; }
// hershey(text, {font: 'scripts', size: px cap-to-baseline height, x, y (baseline-left), order: 'glyph' | 'word'}) ->
// {strokes: [{pts, glyph, len}], width}. order 'glyph' (default): each glyph's main stroke, then its dot / crossbar, glyph by glyph
// (legible at once: "brutal" never reads "brulal"); 'word': natural handwriting, every main stroke first, dots and crossbars last.
function hershey(text, o = {}) {
  if (!HERSHEY) throw new Error('HP.lib.paint.hershey: await HP.lib.paint.loadHershey() in load() first');
  const F = HERSHEY.fonts[o.font || 'scripts'], k = (o.size || 200) / (F.base - F.cap), x0 = o.x || 0, y0 = o.y || 0, byGlyph = (o.order || 'glyph') === 'glyph';
  let x = 0; const main = [], late = [];
  for (const ch of text) {
    const g = F.glyphs[ch] || F.glyphs[' ']; const [l, r, strokes] = g; const gx = x - l;
    const S = strokes.map(s => s.map(([px, py]) => [x0 + (gx + px) * k, y0 + (py - F.base) * k]));
    if (S.length) {
      const lens = S.map(lenOf), big = lens.indexOf(Math.max(...lens)), idx = [big, ...S.map((_, i) => i).filter(i => i !== big)];
      for (const i of idx) (byGlyph || i === big || lens[i] > lens[big] * .6 ? main : late).push({ pts: S[i], glyph: ch, len: lens[i] });
    }
    x += r - l;
  }
  return { strokes: main.concat(late), width: x * k };
}

HP.lib.paint = { PAL, col, mix, shade, tint, rgba, hex2rgb, noise1, rngOf, seedOf, scratch,
  makeStroke, drawStroke, strokeAt, bakeStroke, drawBaked, zigzag, stroke, highlight, revealPlan, drawReveal,
  shapePlan, paintShape, bakeShape, wobblyCircle, makeSplat, drawSplat, splat,
  PENCIL, boilSeed, pencil, pencilShape, toothTile, installInkFilter, bleed, makeStamp, stamp,
  paperTile, applyPaper, wipePlan, wipe, loadHershey, hershey, lenOf };

// ============================================================ items
// the drawing surface of a paint item: the shared 'paint' canvas (default), "layer": "own" (its own canvas), or another shared name
function surface(it) {
  const L = it.d.layer || 'paint';
  if (L === 'own') { if (!it._own) it._own = it.canvas(); const c = it._own.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); return c; }
  return HP.shared(L).ctx;
}
// opacity of a shared-canvas item: its enter/exit envelope (the layer div's opacity does not reach a shared canvas)
function envOp(it, t) { return it.ownMotion ? 1 : HP.envelope(it, t).op; }
// "cull": {"at", "dur" (0.27), "residue" (0.5)} -> 0..2: droplets vanish one by one (0..1; never a whole-splat opacity fade,
// style.md 4.3), then the dried stain left behind fades (1..2)
function cullAt(it, t) {
  const c = it.d.cull; let a, d, r;
  if (!c) { if (!it.d.cullDur) return 0; a = it.t1 - it.d.cullDur - (it.d.residue ?? .5); d = it.d.cullDur; r = it.d.residue ?? .5; }
  else { a = HP.T(c.at ?? c); d = c.dur ?? .27; r = c.residue ?? .5; }
  return pr(t, a, d) + pr(t, a + d, r);
}
// beat-track splats: cull over .27 s from `at`, then the residue fades over .45 s
HP.lib.paint.residueAt = (t, at, dur = .27, res = .45) => pr(t, at, dur) + pr(t, at + dur, res);
const finalFade = t => { const fh = HP.EDL && HP.EDL.finalHold; if (!fh) return 1; const a = HP.T(fh[0]); return 1 - pr(t, a - .3, .3); };   // paint fades out over the 0.3 s before the cover hold

// splat {at | t0, t1, x, y, r, color, dir (deg; -90 = up), sats, spikes, drips, spread, satMax, cull: {at, dur} | cullDur, layer}
HP.register('splat', {
  ownMotion: true,
  build(it) { it.at = HP.T(it.d.at ?? it.d.t0); if (it.d.t0 === undefined) it.t0 = it.at; it.mark(it.at, 'splat'); },
  draw(it, t) {
    const d = it.d;
    splat(surface(it), { key: it.id, x: d.x ?? 540, y: d.y ?? 960, r: d.r ?? 130, color: d.color, dirDeg: d.dir ?? -90, sats: d.sats, spikes: d.spikes, drips: d.drips, spread: d.spread, satMax: d.satMax }, t - it.at, { cull: cullAt(it, t), alpha: finalFade(t) });
  },
});
// stroke {t0, t1, at (t0), dur (0.36), points, width, color, ease (oQuad | ioCub | lin), dry, gaps, wet, pressure, thinning, alpha,
//   blend ('multiply' for a highlighter), out: {at, dur} (the tail tears away)}
HP.register('stroke', {
  ownMotion: true,
  build(it) {
    const d = it.d; it.at = HP.T(d.at ?? d.t0); it.dur = d.dur ?? .36;
    it.S = makeStroke(d.points, { width: d.width || 60, color: d.color, seed: it.id, dry: d.dry, gaps: d.gaps, wet: d.wet, pressure: d.pressure, thinning: d.thinning });
    it.ease = E[d.ease || 'oQuad'] || E.oQuad; it.mark(it.at, 'stroke');
    if (d.out) it.out = { at: HP.T(d.out.at ?? d.out), dur: d.out.dur ?? .2 };
  },
  draw(it, t) {
    const ctx = surface(it), p = it.ease(pr(t, it.at, it.dur)), f = it.out ? E.ioCub(pr(t, it.out.at, it.out.dur)) : 0;
    if (it.d.blend) { ctx.save(); ctx.globalCompositeOperation = it.d.blend; }
    const A = (it.d.alpha ?? 1) * envOp(it, t) * finalFade(t);
    if (f > 0) drawStroke(ctx, it.S, p, { alpha: A, from: f }); else strokeAt(ctx, it.S, p, it.id, { alpha: A });
    if (it.d.blend) ctx.restore();
  },
  texts() { return []; },
});
// paintshape {t0, t1, at (t0), dur (0.36), shape: {kind: circle|band|rect|poly|line, ...}, color, style ('swirl' | 'passes'), angle, under}
HP.register('paintshape', {
  ownMotion: true,
  build(it) { const d = it.d; it.at = HP.T(d.at ?? d.t0); it.dur = d.dur ?? .36; it.mark(it.at, 'paint'); },
  draw(it, t) {
    const d = it.d, u = pr(t, it.at, it.dur), ctx = surface(it), o = { key: it.id, color: d.color, style: d.style, angle: d.angle, under: d.under };
    const A = envOp(it, t) * finalFade(t); if (A <= 0) return;
    ctx.save(); ctx.globalAlpha *= A;
    if (u >= 1) drawBaked(ctx, bakeShape(it.id, d.shape, o, 1)); else paintShape(ctx, d.shape, u, o);
    ctx.restore();
  },
});
// pencil {t0, t1, shapes: [{kind, ..., at, dur (0.3)}], color, width, alpha, boil (2), layer}: drawn on in order, boiling on twos
HP.register('pencil', {
  ownMotion: true,
  build(it) { it.sh = (it.d.shapes || []).map((s, i) => ({ ...s, _at: HP.T(s.at ?? it.d.t0 ?? 0) + (s.at === undefined ? i * .12 : 0), _dur: s.dur ?? .3 })); for (const s of it.sh) it.mark(s._at, 'pencil'); },
  draw(it, t) {
    const A = envOp(it, t) * finalFade(t); if (A <= 0) return;
    pencil(surface(it), it.sh.map(s => ({ ...s, p: E.ioQuad(pr(t, s._at, s._dur)) })), { key: it.id, t, color: it.d.color, width: it.d.width, alpha: (it.d.alpha ?? .92) * A, boil: it.d.boil, roughness: it.d.roughness });
  },
});
// inkstamp {at, t1, x, y, size, glyph (nabla|ring|disc|square|checker|cross|triangle|star|arrow|text), text, color, rot, cull}
HP.register('inkstamp', {
  ownMotion: true,
  build(it) { it.at = HP.T(it.d.at ?? it.d.t0); if (it.d.t0 === undefined) it.t0 = it.at; it.mark(it.at, 'stamp'); },
  draw(it, t) { const d = it.d; stamp(surface(it), { ...d, key: it.id }, t - it.at, { cull: cullAt(it, t), alpha: (d.alpha ?? .92) * finalFade(t) }); },
  texts(it) { return it.d.glyph === 'text' && it.d.text ? [{ text: it.d.text, reveal: 'none', role: 'meta' }] : []; },
});
// paper {t0, t1, mode: 'auto' | 'light' | 'dark', alpha, grain, mottle, fibres, seed, boil (2), overlay (false)}: the paper tooth
// (style.md 4.5), shifted every 2 frames. The soft-light (light ground) / screen 0.07 (dark ground) blends of the recipe are baked
// into RGBA tiles drawn with normal blending (a DOM mix-blend-mode cost ~125 ms a frame in software compositing; this costs ~0).
// It stacks where it sits in the EDL (put it UNDER real screenshots and footage: no grain on the facts, style.md 6), or set
// "overlay": true for the whole frame. Gone over the 0.3 s before EDL.finalHold.
function paperRGBA(tile, dark) {
  return MEMO('paperRGBA|' + tile.width + 'x' + tile.height + '|' + (dark ? 'd' : 'l'), () => {
    const c = HP.offscreen(tile.width, tile.height), x = c.getContext('2d'), src = tile.getContext('2d').getImageData(0, 0, tile.width, tile.height).data;
    const im = x.createImageData(tile.width, tile.height), d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      const g = src[i] / 255, v = g - .5;
      if (dark) { d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(255 * clamp(.07 * g * 1.1)); }   // screen 0.07 on the dark ground
      else if (v >= 0) { d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(255 * clamp(v * 2 * .26)); }   // soft-light lighten on cream
      else { d[i] = d[i + 1] = d[i + 2] = 0; d[i + 3] = Math.round(255 * clamp(-v * 2 * .05)); }                  // soft-light darken on cream
    }
    x.putImageData(im, 0, 0); return c;
  });
}
HP.register('paper', {
  ownMotion: true,
  build(it) {
    const d = it.d; it.tile = paperTile({ seed: d.seed ?? 7, grain: d.grain ?? 44, mottle: d.mottle ?? 12, fibres: d.fibres ?? 140 });
    it.cvs = ['l', 'd'].map(k => { const c = el('canvas', '', it.el, { position: 'absolute', left: 0, top: 0, width: it.tile.width + 'px', height: it.tile.height + 'px', display: 'none' });
      c.width = it.tile.width; c.height = it.tile.height; c.getContext('2d').drawImage(paperRGBA(it.tile, k === 'd'), 0, 0); return c; });
  },
  draw(it, t) {
    const d = it.d, th = d.mode === 'light' || d.mode === 'dark' ? d.mode : HP.themeAt(t), dark = th === 'dark', fr = HP.boil(t, d.boil || 2);
    const a = (d.alpha ?? 1) * finalFade(t) * HP.envelope(it, t).op, cv = it.cvs[dark ? 1 : 0];
    it.cvs[dark ? 0 : 1].style.display = 'none'; cv.style.display = a > .005 ? '' : 'none'; cv.style.opacity = a.toFixed(3);
    const mx = 40, dx = -Math.round(mx + HP.rand(it.id, 'x', fr) * (it.tile.width - W - 2 * mx)), dy = -Math.round(mx + HP.rand(it.id, 'y', fr) * (it.tile.height - H - 2 * mx));
    cv.style.transform = `translate(${dx}px,${dy}px)`;
  },
});
// brushwipe {at, dur (in, 0.14), hold (0.1), outDur (0.17), keep (false: tears away; true: the frame stays painted, a flat fill of
//   the first colour settles in behind the bands), flatAt (keep: when the bristle texture dries off to the flat fill, over 0.5 s;
//   default: the 0.3 s before EDL.finalHold), dryTo (.3: the texture's strength once dry), colors, n, angle, dir}: painted bands
HP.register('brushwipe', {
  ownMotion: true,
  build(it) { const d = it.d; it.at = HP.T(d.at ?? d.t0); it.dur = d.dur ?? .14; it.mark(it.at, 'wipe'); if (d.flatAt !== undefined) it.flatAt = HP.T(d.flatAt); },
  draw(it, t) {
    const d = it.d, u = pr(t, it.at, it.dur), o = d.keep ? 0 : pr(t, it.at + it.dur + (d.hold ?? .1), d.outDur ?? .17);
    if (u <= 0) return;
    const ctx = surface(it);
    ctx.save(); ctx.globalAlpha *= envOp(it, t);
    const fill = d.keep ? smooth(pr(t, it.at + it.dur * .7, d.settle ?? .25)) : 0;
    if (fill > 0) { ctx.save(); ctx.globalAlpha *= fill; ctx.fillStyle = col([].concat(d.colors || ['cream'])[0]); ctx.fillRect(-40, -40, W + 80, H + 80); ctx.restore(); }
    const tex = d.keep ? (it.flatAt !== undefined ? 1 - smooth(pr(t, it.flatAt, .5)) : finalFade(t)) * (1 - (d.dryTo === undefined ? .7 : 1 - d.dryTo) * smooth(pr(t, it.at + it.dur + .15, .6))) : 1;   // the bristle texture dries down to dryTo (.3) after landing
    if (tex > 0) { ctx.globalAlpha *= tex; wipe(ctx, { key: it.id, n: d.n, angle: d.angle, colors: d.colors, dir: d.dir }, u, { out: o }); }
    ctx.restore();
  },
});

// ============================================================ brushtext: words painted stroke by stroke (Hershey script, real pen order)
// in sync with the sung words. {t0, t1, text ("it's brutal out here"), words: "hits" (song/hits.json words.brutal_out_here, or the
// matching run of hits.words; BUILD.md times as the fallback) | [{w, at, dur}], place: [{x, y (baseline-left), size (px), rot (deg),
// color, width (brush px)}] per word, font ('scripts' | 'cursive'), brush {dry, gaps, wet, k (width / size, .12)}, splat {word (1),
// color, r, dx, dy, dir} (a burst on that word's onset), drift (.035: slow push over the life), lead (0: no anticipation)}
const BRUTAL_FALLBACK = [{ w: "it's", s: 71.94, e: 72.52 }, { w: 'brutal', s: 72.52, e: 72.72 }, { w: 'out', s: 72.72, e: 73.04 }, { w: 'here', s: 73.04, e: 73.64 }];
const norm = s => String(s).toLowerCase().replace(/[’']/g, "'").replace(/[^a-z']/g, '');
function sungWords(target) {   // [{w, s, e}] in song seconds for the target words, from song/hits.json
  const raw = HP.hits.raw || {}, W0 = raw.words;
  const pick = L => (L || []).map(x => ({ w: x.w ?? x.word ?? x.text, s: x.s ?? x.start ?? x.t0 ?? x.t, e: x.e ?? x.end ?? x.t1 }));
  let L = null;
  if (W0 && !Array.isArray(W0)) L = pick(W0.brutal_out_here || W0.brutal || W0.god_its_brutal_out_here);
  else if (Array.isArray(W0)) L = pick(W0);
  if (L) {
    const tw = target.map(norm), seq = L.filter(x => x.w && isFinite(x.s));
    for (let i = 0; i + tw.length <= seq.length; i++) if (tw.every((w, k) => norm(seq[i + k].w) === w)) return { src: HP.hits.src, words: seq.slice(i, i + tw.length) };
  }
  return { src: 'BUILD.md (fallback)', words: BRUTAL_FALLBACK.filter(x => target.map(norm).includes(norm(x.w))) };
}
HP.lib.paint.sungWords = sungWords;
const BT_PLACE = [   // the default composition for "it's brutal out here" (dark ground): one word per line, big, -8 deg
  { x: 150, y: 640, size: 175, rot: -8, color: 'yellow' }, { x: 84, y: 960, size: 280, rot: -8, color: 'cream' },
  { x: 330, y: 1190, size: 200, rot: -8, color: 'yellow' }, { x: 300, y: 1450, size: 250, rot: -8, color: 'cream' }];
HP.register('brushtext', {
  ownMotion: true,
  async load(it) {
    await loadHershey();
    const d = it.d, words = String(d.text || "it's brutal out here").split(/\s+/);
    let timing;
    if (Array.isArray(d.words)) timing = d.words.map(x => ({ w: x.w, at: HP.T(x.at), dur: x.dur }));
    else { const r = sungWords(words); it.src = r.src; timing = r.words.map(x => ({ w: x.w, at: HP.editAt(x.s), end: HP.editAt(x.e) })); }
    if (timing.length !== words.length) HP.WARN.push(`brushtext ${it.id}: found ${timing.length} sung words for "${words.join(' ')}"`);
    const B = d.brush || {}, lead = d.lead ?? 0;
    it.W = words.map((w, i) => {
      const P = { ...(BT_PLACE[i] || BT_PLACE[BT_PLACE.length - 1]), ...((d.place || [])[i] || {}) }, tm = timing[i] || timing[timing.length - 1];
      const last = !timing[i + 1], next = last ? (tm.end ?? tm.at + .5) : timing[i + 1].at;
      // polisher: place[i].lead / place[i].dur override one word's anticipation and painting time (e.g. "here" finished early
      // enough to be read before the burst)
      const dur = P.dur ?? tm.dur ?? clamp((next - tm.at) + (last ? 0 : .14), .24, .55), at = tm.at - (P.lead ?? lead);   // the last word is finished when its singing ends
      const g = hershey(w, { font: d.font || 'scripts', size: P.size, x: 0, y: 0, order: d.order });
      const width = P.width ?? P.size * (B.k ?? .12), total = g.strokes.reduce((a, s) => a + s.len + 18, 0);
      let acc = 0;
      const strokes = g.strokes.map((s, k) => {
        const a = acc / total; acc += s.len + 18; const b = (acc - 18) / total;
        const sw = s.len < P.size * .25 ? width * .8 : width, U = P.under || d.under;   // polisher: under {color, k}: a darker, wider stroke under each stroke (legible on a splat)
        return { S: makeStroke(s.pts, { width: sw, color: P.color, seed: `${it.id}|${i}|${k}`, dry: B.dry ?? .22, gaps: B.gaps ?? .28, wet: B.wet ?? .35, pressure: [.75, 1, .45], thinning: .45, jitter: .9 }), a, b, key: `${it.id}|${i}|${k}`,
          U: U ? makeStroke(s.pts, { width: sw * (U.k ?? 1.5), color: U.color || 'ink', seed: `${it.id}|${i}|${k}|u`, dry: .06, gaps: .05, wet: .2, pressure: [.75, 1, .45], thinning: .4, jitter: .9 }) : null };
      });
      it.mark(at, 'word');
      return { w, P, at, dur, strokes, width: g.width };
    });
    if (d.splat !== false) {
      const sp = { word: 1, color: 'pink', r: 230, ...(d.splat || {}) }, Wd = it.W[sp.word];
      if (Wd) { const a = Wd.P.rot * Math.PI / 180, cx = Wd.P.x + Math.cos(a) * Wd.width / 2 + (sp.dx ?? 0), cy = Wd.P.y + Math.sin(a) * Wd.width / 2 - Wd.P.size * .3 + (sp.dy ?? 0);
        it.sp = { at: Wd.at, s: { key: it.id + '|splat', x: cx, y: cy, r: sp.r, color: sp.color, dirDeg: sp.dir ?? -25, sats: sp.sats ?? 64, spikes: sp.spikes ?? 11, drips: sp.drips ?? 3, spread: .9 },
          s2: sp.second === false ? null : { key: it.id + '|splat2', x: cx + 300, y: cy - 180, r: sp.r * .38, color: sp.color2 || 'orange', dirDeg: -40, sats: 26, spikes: 8, drips: 1, spread: 1.1 } };
        it.mark(Wd.at, 'splat'); }
    }
    // the words as DOM text for the checks (transparent; the paint is the picture)
    it.dom = it.W.map(Wd => { const e = el('div', 'abs', it.el, { left: Wd.P.x + 'px', top: (Wd.P.y - Wd.P.size) + 'px', font: `400 ${Math.round(Wd.P.size * .8)}px 'Newsreader'`, color: 'transparent', whiteSpace: 'nowrap', display: 'none' }); e.textContent = Wd.w; return e; });
    it.cv = it.canvas();
  },
  draw(it, t) {
    const ctx = it.cv.ctx; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
    const d = it.d, A = HP.envelope(it, t).op * finalFade(t); if (A <= 0) return;
    const z = 1 + (d.drift ?? .035) * E.ioSine(it.life(t)), O = d.origin || [540, 1000];
    ctx.setTransform(z, 0, 0, z, O[0] * (1 - z), O[1] * (1 - z)); ctx.globalAlpha = A;
    if (it.sp) {   // polisher: splat.dimTo (1) / dimAfter (s, .25): the burst drops to dimTo once it has landed, so the words read over it
      const sp = d.splat || {}, ka = lerp(1, sp.dimTo ?? 1, smooth(pr(t, it.sp.at + (sp.dimAfter ?? .25), .3)));
      drawSplat(ctx, makeSplat(it.sp.s), t - it.sp.at, { alpha: ka }); if (it.sp.s2) drawSplat(ctx, makeSplat(it.sp.s2), t - it.sp.at - .07, { alpha: ka });
      ctx.globalAlpha = A;
    }
    it.W.forEach((Wd, i) => {
      const u = pr(t, Wd.at, Wd.dur); it.dom[i].style.display = u > 0 ? '' : 'none'; if (u <= 0) return;
      const land = t - (Wd.at + Wd.dur), bump = land >= 0 ? 1 + .05 * Math.exp(-land / .07) : 1;
      ctx.save(); ctx.translate(Wd.P.x, Wd.P.y); ctx.rotate(Wd.P.rot * Math.PI / 180);
      if (bump !== 1) { ctx.translate(Wd.width / 2, -Wd.P.size * .3); ctx.scale(bump, bump); ctx.translate(-Wd.width / 2, Wd.P.size * .3); }
      for (const s of Wd.strokes) { const p = clamp((u - s.a) / Math.max(1e-3, s.b - s.a)); if (p > 0 && s.U) strokeAt(ctx, s.U, E.ioQuad(p), s.key + '|u'); }
      for (const s of Wd.strokes) { const p = clamp((u - s.a) / Math.max(1e-3, s.b - s.a)); if (p > 0) strokeAt(ctx, s.S, E.ioQuad(p), s.key); }
      ctx.restore();
    });
  },
  texts(it) { return [{ text: String(it.d.text || "it's brutal out here"), reveal: 'stroke', role: 'main' }]; },
});
})();
