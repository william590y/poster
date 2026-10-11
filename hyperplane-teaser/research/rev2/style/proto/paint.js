// paint.js: reference implementation of the Hyperplane rev2 "handmade" look.
// Canvas 2D, deterministic (everything is a pure function of seed + time), 1080x1920 design space.
// Deps: perfect-freehand 1.2.3 (silhouettes), roughjs 4.6.6 (pencil / chart linework).
// Every parameter below is the value that was tuned by eye in research/rev2/style/proto/stills/*.
import { getStroke } from './node_modules/perfect-freehand/dist/esm/index.mjs';
import rough from './node_modules/roughjs/bundled/rough.esm.js';
export { rough };

export const PAL = {
  cream: '#F2EBDD', ink: '#15131F', night: '#0E0D12',
  yellow: '#F2C300', pink: '#FF2E88', blue: '#2346FF', teal: '#00B8A9', orange: '#FF4A1C', red: '#B31B1B', violet: '#7B3FF2',
};

// ---------- tiny utils ----------
export function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeOutCubic = t => 1 - Math.pow(1 - clamp(t), 3);
export const easeOutQuad = t => 1 - (1 - clamp(t)) * (1 - clamp(t));
export const easeInOutCubic = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeOutBack = (t, s = 1.70158) => { t = clamp(t) - 1; return t * t * ((s + 1) * t + s) + 1; };
export function hex2rgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
export function rgb2hex(r, g, b) { return '#' + [r, g, b].map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join(''); }
export function mix(a, b, k) { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(lerp(A[0], B[0], k), lerp(A[1], B[1], k), lerp(A[2], B[2], k)); }
export function shade(c, k) { return mix(c, '#000000', k); }           // k 0..1 toward black
export function tint(c, k) { return mix(c, '#ffffff', k); }            // k 0..1 toward white
export function rgba(c, a) { const [r, g, b] = hex2rgb(c); return `rgba(${r},${g},${b},${a})`; }
// smooth 1-D value noise (deterministic by integer seed)
function hash1(i, seed) { let h = (i * 374761393 + seed * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
export function noise1(x, seed = 0) { const i = Math.floor(x), f = x - i; const u = f * f * (3 - 2 * f); return lerp(hash1(i, seed), hash1(i + 1, seed), u) * 2 - 1; }

// ---------- paper ----------
// Neutral-grey tile (128 = no change) meant for 'soft-light' (light grounds) or 'screen' (dark grounds).
//  grain  : per-pixel sd in 0..255 grey levels (fine tooth)          default 44  (20 is invisible, 60 is noisy after H.264)
//  mottle : low-frequency cloud sd (paper unevenness)                default 12
//  fibres : count of short pale/dark fibres                          default 140
export function makePaper(w, h, { seed = 7, grain = 44, mottle = 12, fibres = 140 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  const R = rng(seed);
  // mottle: two octaves of random grid, bilinear-upscaled by the canvas
  const cloud = (gw, gh, amp) => {
    const s = document.createElement('canvas'); s.width = gw; s.height = gh; const sx = s.getContext('2d'); const im = sx.createImageData(gw, gh);
    for (let i = 0; i < gw * gh; i++) { const v = 128 + (R() + R() + R() - 1.5) * amp * 1.6; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
    sx.putImageData(im, 0, 0); return s;
  };
  x.fillStyle = '#808080'; x.fillRect(0, 0, w, h);
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  x.globalAlpha = 1; x.drawImage(cloud(Math.ceil(w / 90), Math.ceil(h / 90), mottle), 0, 0, w, h);
  x.globalAlpha = .5; x.drawImage(cloud(Math.ceil(w / 28), Math.ceil(h / 28), mottle * .7), 0, 0, w, h);
  x.globalAlpha = 1;
  // fine grain
  const im = x.getImageData(0, 0, w, h), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const n = (R() + R() + R() - 1.5) * grain * 1.15; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  x.putImageData(im, 0, 0);
  // fibres
  x.lineCap = 'round';
  for (let i = 0; i < fibres; i++) {
    const px = R() * w, py = R() * h, a = R() * Math.PI * 2, l = 8 + R() * 26, bend = (R() - .5) * 8;
    x.strokeStyle = R() < .55 ? 'rgba(255,255,255,0.35)' : 'rgba(40,30,20,0.22)'; x.lineWidth = .6 + R() * .7;
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l / 2 + bend, py + Math.sin(a) * l / 2 + bend, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
  return c;
}
// Lay the paper over a finished frame. light grounds: soft-light 1.0; dark grounds: screen 0.07.
// Make the tile ~120% of the frame and pass dx,dy = -rand*(tile-frame) every 2nd frame so the tooth boils with the linework.
export function applyPaper(ctx, tile, { mode = 'soft-light', alpha = 1, dx = 0, dy = 0 } = {}) {
  ctx.save(); ctx.globalCompositeOperation = mode; ctx.globalAlpha = alpha;
  ctx.drawImage(tile, dx, dy); ctx.restore();
}

// ---------- bristle brush ----------
function catmull(pts, step) { // Catmull-Rom resample, ~step px between points
  const P = [pts[0], ...pts, pts[pts.length - 1]]; const out = [];
  for (let i = 1; i < P.length - 2; i++) {
    const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
    const segLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]); const n = Math.max(2, Math.ceil(segLen / step));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
                0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  out.push(pts[pts.length - 1]); return out;
}

// Build a stroke (all geometry precomputed; draw with drawStroke(ctx, S, p)).
//  width     brush width px at full pressure                        default 70   (1080 px frame: 40..140)
//  bristles  number of bristle hairs (default width/3.2, 16..56)     hair width = width/bristles*1.35  (~4 px)
//  dry       0..1 how early outer bristles run out of pigment        default .35  (0 = wet/solid, .6 = very dry)
//  gaps      0..1 density of dry-brush gaps inside the stroke        default .45
//  pressure  [start, peak, end]  pressure keyframes                  default [.38, 1, .5]
//  thinning  perfect-freehand thinning (width follows pressure)      default .5
//  streamline, smoothing  perfect-freehand                           default .42, .5
//  wet       wet-edge darkening 0..1                                 default .55
//  jitter    lateral wobble of each bristle (fraction of bristle w)  default 1.2
export function makeStroke(pts, o = {}) {
  const { width = 70, dry = .35, gaps = .45, pressure = [.8, 1, .4], thinning = .5, streamline = .42, smoothing = .5,
    wet = .55, jitter = 1.1, seed = 1, color = '#F2C300', spacing = 3, shadeVar = .11, body = .82 } = o;
  const bristles = o.bristles || Math.max(16, Math.min(56, Math.round(width / 3.2)));
  const R = rng(seed);
  const C = catmull(pts, spacing); const N = C.length;
  const L = [0]; for (let i = 1; i < N; i++) L.push(L[i - 1] + Math.hypot(C[i][0] - C[i - 1][0], C[i][1] - C[i - 1][1]));
  const total = L[N - 1] || 1;
  const pr = L.map(s => { const u = s / total; return u < .15 ? lerp(pressure[0], pressure[1], smooth(u / .15)) : u > .8 ? lerp(pressure[1], pressure[2], smooth((u - .8) / .2)) : pressure[1]; });
  const size = body * width / (2 * (0.5 - thinning * (0.5 - 1)));          // silhouette = `body` x nominal width; hairs reach 100% so the edge is ragged
  const half = pr.map(p => (size / body) * (0.5 - thinning * (0.5 - p)));  // nominal half width at each sample (perfect-freehand formula)
  const T = C.map((c, i) => { const a = C[Math.max(0, i - 1)], b = C[Math.min(N - 1, i + 1)]; let tx = b[0] - a[0], ty = b[1] - a[1]; const m = Math.hypot(tx, ty) || 1; return [tx / m, ty / m]; });
  const bw = (width / bristles) * 1.35;
  const B = [];
  for (let k = 0; k < bristles; k++) {
    const u = (k + .5) / bristles * 2 - 1;                                  // -1..1 across the brush
    const outer = Math.abs(u);
    const budget = 1 - dry * Math.pow(outer, 1.4) * (.45 + .55 * R());     // outer bristles run dry first
    const lum = (R() - .5) * 2 * shadeVar;
    const col = lum > 0 ? tint(color, lum) : shade(color, -lum);
    const baseA = .62 + .33 * R();
    const gseed = Math.floor(R() * 1e6), wseed = Math.floor(R() * 1e6);
    const pts2 = [];
    for (let i = 0; i < N; i++) {
      const s = L[i] / total;
      const wob = noise1(L[i] / 70, wseed) * jitter * bw * .55;
      const off = u * half[i] + wob;
      const x = C[i][0] - T[i][1] * off, y = C[i][1] + T[i][0] * off;
      let a = baseA;
      // ink supply running out at the tail: fades over the last 12% before this bristle's budget, then stops
      a *= clamp((budget - s) / .12, 0, 1);
      // dry-brush gaps: noise above a threshold drops the hair to 12% alpha (outer bristles gap far more than inner ones)
      const g = noise1(L[i] / 34, gseed); const thr = 1 - gaps * (.35 + .65 * outer) * .9;
      a *= 1 - .88 * smooth((g - thr) / .12 + .5);
      // the first 4% of the stroke is always loaded (paint-load at the touch-down)
      if (s < .04) a = Math.max(a, baseA * .9);
      pts2.push([x, y, a, half[i]]);
    }
    B.push({ col, pts: pts2, w: bw * (.8 + .5 * R()) });
  }
  return { C, L, total, pr, half, size, B, color, o: { thinning, streamline, smoothing, wet, width, body }, T };
}

function silhouette(S, nPts, last) {
  const pts = []; for (let i = 0; i < nPts; i++) pts.push([S.C[i][0], S.C[i][1], S.pr[i]]);
  const out = getStroke(pts, { size: S.size, thinning: S.o.thinning, smoothing: S.o.smoothing, streamline: S.o.streamline, simulatePressure: false, last, start: { cap: false, taper: 0 }, end: { cap: false, taper: 0 } });
  return out;
}
function polyPath(poly) { const p = new Path2D(); if (!poly.length) return p; p.moveTo(poly[0][0], poly[0][1]); for (let i = 1; i < poly.length; i++) p.lineTo(poly[i][0], poly[i][1]); p.closePath(); return p; }

// Draw the first fraction p (0..1) of the stroke. alpha scales the whole stroke. mask=true -> opaque white mask for revealing content.
export function drawStroke(ctx, S, p, { alpha = 1, mask = false, body = .5 } = {}) {
  p = clamp(p); if (p <= 0) return;
  const n = Math.max(2, Math.floor(1 + p * (S.C.length - 1)));
  const sil = polyPath(silhouette(S, n, p >= 1));
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // 1. wet body (the pigment film under the hairs)
  ctx.globalAlpha = alpha * (mask ? 1 : body); ctx.fillStyle = mask ? '#fff' : S.color; ctx.fill(sil);
  // 2. bristle hairs
  const buckets = 6;
  for (const b of S.B) {
    let i = 0;
    while (i < n) {
      const a = b.pts[i][2]; const q = Math.round(a * buckets); let j = i;
      while (j + 1 < n && Math.round(b.pts[j + 1][2] * buckets) === q) j++;
      if (q > 0 && j > i) {
        ctx.beginPath(); ctx.moveTo(b.pts[i][0], b.pts[i][1]); for (let k = i + 1; k <= j; k++) ctx.lineTo(b.pts[k][0], b.pts[k][1]);
        ctx.lineWidth = b.w; ctx.globalAlpha = alpha * (mask ? Math.min(1, q / buckets * 1.2) : q / buckets); ctx.strokeStyle = mask ? '#fff' : b.col; ctx.stroke();
      }
      i = j + 1;
    }
  }
  // 3. wet-edge darkening along the two long sides only (the outline is [left side..., right side...]; stroke each half as an open path)
  if (!mask && S.o.wet > 0) {
    const out = silhouette(S, n, p >= 1); const m = out.length >> 1;
    const side = (arr) => { const q = new Path2D(); arr.forEach((pt, i) => i ? q.lineTo(pt[0], pt[1]) : q.moveTo(pt[0], pt[1])); return q; };
    ctx.save(); ctx.clip(sil); ctx.globalAlpha = alpha * S.o.wet * .42; ctx.strokeStyle = shade(S.color, .36); ctx.lineWidth = Math.max(3, S.o.width * .08); ctx.lineJoin = 'round';
    ctx.stroke(side(out.slice(0, m))); ctx.stroke(side(out.slice(m))); ctx.restore();
  }
  ctx.restore();
}

// Zig-zag coverage of a rectangle with horizontal (or tilted) passes; returns centrelines.
export function zigzag(rect, brushW, { angle = -4, overlap = .22, pad = 60, seed = 1, bow = .12 } = {}) {
  const R = rng(seed); const [x, y, w, h] = rect; const rows = Math.max(1, Math.ceil(h / (brushW * (1 - overlap))));
  const out = []; const a = angle * Math.PI / 180;
  for (let r = 0; r < rows; r++) {
    const cy = y + (rows === 1 ? h / 2 : (r + .5) * h / rows); const dir = r % 2 ? -1 : 1;
    const x0 = x - pad, x1 = x + w + pad; const mid = (x0 + x1) / 2; const bo = (R() - .5) * 2 * bow * brushW * 2;
    const f = t => { const xx = lerp(x0, x1, t); return [xx, cy + (xx - mid) * Math.tan(a) + Math.sin(t * Math.PI) * bo + (R() - .5) * 3]; };
    const pts = [f(0), f(.33), f(.66), f(1)]; if (dir < 0) pts.reverse(); out.push(pts);
  }
  return out;
}

// Reveal arbitrary content through a set of strokes.
//  drawContent(ctx) paints the content; strokes = [{S, t0, dur}]; t = seconds
export function paintReveal(ctx, drawContent, strokes, t, scratch, { ease = easeOutQuad } = {}) {
  const [mc, cc] = scratch; mc.getContext('2d').clearRect(0, 0, mc.width, mc.height); cc.getContext('2d').clearRect(0, 0, cc.width, cc.height);
  const m = mc.getContext('2d'); for (const s of strokes) drawStroke(m, s.S, ease((t - s.t0) / s.dur), { mask: true });
  const c = cc.getContext('2d'); drawContent(c); c.globalCompositeOperation = 'destination-in'; c.drawImage(mc, 0, 0); c.globalCompositeOperation = 'source-over';
  ctx.drawImage(cc, 0, 0);
}

// ---------- paint splatter ----------
//  R       core radius px                                   (60..220)
//  dir     main spray direction (radians, canvas coords)
//  sats    satellite droplet count                          (30..70)
//  spikes  radial fingers on the core                       (7..12)
//  drips   number of drips                                  (0..4)
//  spread  angular sd of satellites around dir (rad)        (.45 directional, 1.2 near-radial)
export function makeSplat({ x, y, R = 130, dir = -Math.PI / 2, color = '#FF2E88', seed = 1, sats = 46, spikes = 9, drips = 3, spread = .55, stretch = .45, rimColor = null } = {}) {
  const r = rng(seed);
  const ph = [r() * 6.28, r() * 6.28, r() * 6.28];
  const sp = []; for (let i = 0; i < spikes; i++) { const a = r() < .65 ? dir + (r() - .5) * 2.2 : r() * 6.283; sp.push({ a, amp: (.22 + r() * .5), sig: .05 + r() * .05, bulb: .045 + r() * .05 }); }
  const rad = th => { let v = 1 + .13 * Math.sin(3 * th + ph[0]) + .08 * Math.sin(5 * th + ph[1]) + .05 * Math.sin(9 * th + ph[2]);
    for (const s of sp) { let d = Math.atan2(Math.sin(th - s.a), Math.cos(th - s.a)); v += s.amp * Math.exp(-(d * d) / (2 * s.sig * s.sig)); } return v * R; };
  const satl = [];
  for (let i = 0; i < sats; i++) {
    const rr = R * (.035 + .2 * Math.pow(r(), 2.4));                          // power-law sizes: many tiny, few big
    const dist = R * (1.25 + -Math.log(1 - r() * .96) * .95);                  // exponential fall-off with distance
    const ang = r() < .72 ? dir + gauss(r) * spread : r() * 6.283;
    satl.push({ ang, dist, r: rr, delay: dist / R * .012, kill: r() });
  }
  const dr = [];
  for (let i = 0; i < drips; i++) { const a = Math.PI / 2 + (r() - .5) * 1.5; dr.push({ a, w: R * (.07 + r() * .07), len: R * (.9 + r() * 1.7), t0: .2 + r() * .35, dur: .9 + r() * .9 }); }
  return { x, y, R, dir, color, rad, satl, dr, sp, rim: rimColor || shade(color, .22) };
}
function gauss(r) { return Math.sqrt(-2 * Math.log(1 - r() * .999)) * Math.cos(6.283 * r()); }

// age in seconds from the impact frame. cull 0..1 dissolves the splat (random droplets first, core last).
export function drawSplat(ctx, S, age, { cull = 0 } = {}) {
  if (age < 0) return; const { x, y, R } = S;
  ctx.save(); ctx.fillStyle = S.color; ctx.strokeStyle = S.rim; ctx.lineJoin = 'round';
  // core: scale 0.35 -> 1.08 (frame 1-2) -> 1.0 (frame 4)
  // impact frame 0: 35%; frame 1: ~80%; frame 2: 108%; frame 3-4: 100%  (age .033 s / frame at 30 fps)
  const k = age < .075 ? lerp(.35, 1.08, easeOutQuad(age / .075)) : age < .14 ? lerp(1.08, 1, smooth((age - .075) / .065)) : 1; const kk = 1 - cull * .1;
  const N = 150; ctx.beginPath();
  for (let i = 0; i <= N; i++) { const th = i / N * 6.2832; const rr = S.rad(th) * k * kk * (1 - cull * .15 * (noise1(th * 3, 5) * .5 + .5)); const px = x + Math.cos(th) * rr, py = y + Math.sin(th) * rr; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
  ctx.closePath(); ctx.fill(); ctx.lineWidth = Math.max(2, R * .035); ctx.globalAlpha = .45; ctx.stroke(); ctx.globalAlpha = 1;
  // bulbs at the finger tips (surface tension pinches a drop off the end of each finger)
  for (const s of S.sp) { const tipR = S.rad(s.a) * k * kk; const bx = x + Math.cos(s.a) * tipR * .965, by = y + Math.sin(s.a) * tipR * .965; ctx.beginPath(); ctx.arc(bx, by, R * s.bulb * (1 - cull * .5), 0, 7); ctx.fill(); }
  // drips (viscous: fast start, slows)
  for (const d of S.dr) {
    const p = easeOutQuad((age - d.t0) / d.dur); if (p <= 0) continue; const sx = x + Math.cos(d.a) * S.rad(d.a) * .86, sy = y + Math.sin(d.a) * S.rad(d.a) * .86; const len = d.len * p;
    ctx.beginPath(); ctx.moveTo(sx - d.w / 2, sy); ctx.lineTo(sx - d.w * .38, sy + len); ctx.arc(sx, sy + len, d.w * .62, Math.PI, 0, true); ctx.lineTo(sx + d.w / 2, sy); ctx.closePath(); ctx.fill();
  }
  // satellites
  for (const s of S.satl) {
    if (s.kill < cull) continue; const f = easeOutCubic((age - s.delay) / .11); if (f <= 0) continue;
    const d = s.dist * f; const px = x + Math.cos(s.ang) * d, py = y + Math.sin(s.ang) * d;
    const el = 1 + (S.satl.length ? .45 : 0) * (s.dist / R) * (1 - f) * 2.0; // stretched along the flight line while moving
    ctx.save(); ctx.translate(px, py); ctx.rotate(s.ang); ctx.beginPath(); ctx.ellipse(0, 0, s.r * el, s.r * (1 / Math.sqrt(el) * .98 + .02), 0, 0, 7); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}

// ---------- ink bleed ----------
// SVG filters used through ctx.filter = 'url(#id)'. Size the bleed to the type: displacement ~3.5% of the cap height.
//   'inkbleed-lg'  display type >= 80 px   disp 3.4  blur 1.2  slope 11  icpt -4.0   (ragged, bloated, still crisp)
//   'inkbleed-md'  40..80 px               disp 2.0  blur .9   slope  9  icpt -3.0
//   no filter below 40 px: keep captions and attributions legible (use only the halo, grow it from 0 to .12)
export function installInkFilter() {
  if (document.getElementById('inkbleed-lg')) return;
  const f = (id, { freq, disp, blur, slope, icpt, seed }) => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="3" seed="${seed}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="${disp}" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="${blur}" result="b"/>
    <feComponentTransfer in="b"><feFuncA type="linear" slope="${slope}" intercept="${icpt}"/></feComponentTransfer></filter>`;
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('width', 0); s.setAttribute('height', 0); s.style.position = 'absolute';
  s.innerHTML = f('inkbleed-lg', { freq: .03, disp: 3.4, blur: 1.2, slope: 11, icpt: -4.0, seed: 3 }) + f('inkbleed-md', { freq: .05, disp: 2.0, blur: .9, slope: 9, icpt: -3.0, seed: 5 }) +
    `<filter id="inkbleed-halo" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6"/></filter>`;
  document.body.appendChild(s);
}
// grow in [0,1]: the bleed spreads over ~6 frames (blur 2 px -> 0, halo 0 -> `halo`)
export function drawBled(ctx, drawFn, grow = 1, { id = 'inkbleed-lg', halo = .16 } = {}) {
  const w = ctx.canvas.width, h = ctx.canvas.height; const o = document.createElement('canvas'); o.width = w; o.height = h; const oc = o.getContext('2d'); drawFn(oc);
  ctx.save();
  if (halo > 0) { ctx.filter = 'url(#inkbleed-halo)'; ctx.globalAlpha = halo * grow; ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(o, 0, 0); }
  ctx.filter = grow >= 1 ? `url(#${id})` : `url(#${id}) blur(${((1 - grow) * 2).toFixed(2)}px)`; ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(o, 0, 0);
  ctx.restore();
}

// ---------- pencil / rough.js line boil ----------
// Boil on twos: seed index changes every 2 frames, cycling through 3 variants (A B C A B C ...) = 15 drawings/s at 30 fps.
export function boilSeed(base, frame, { hold = 2, variants = 3 } = {}) { return base + (Math.floor(frame / hold) % variants) * 101; }
// Pencil style: graphite colour, two passes, grain knocked out of the line with the paper tile.
export const PENCIL = { roughness: 1.1, bowing: .9, strokeWidth: 5.5, maxRandomnessOffset: 2.4, disableMultiStroke: false, curveFitting: .95 };
// Graphite tooth: an alpha speckle mask; destination-out of it breaks the line up like pencil on cold-press paper.
export function makeTooth(w, h, { seed = 11, cover = .3 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); const im = x.createImageData(w, h); const R = rng(seed);
  for (let i = 0; i < w * h; i++) { const v = R() * .6 + R() * .4; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = 255; im.data[i * 4 + 3] = v < cover ? 255 * (1 - v / cover) * .95 + 40 : 0; }
  x.putImageData(im, 0, 0); return c;
}
export function penciled(ctx, tooth, draw, { color = '#2A2832', alpha = .92 } = {}) { // draw(rc, optsBase)
  const o = document.createElement('canvas'); o.width = ctx.canvas.width; o.height = ctx.canvas.height; const oc = o.getContext('2d');
  const rc = rough.canvas(o); draw(rc, { stroke: color, ...PENCIL });
  oc.globalCompositeOperation = 'destination-out'; oc.drawImage(tooth, 0, 0); oc.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(o, 0, 0); ctx.restore();
}

// Bake display type with the bleed filter once (tight bbox), then drawImage it every frame (the SVG filter costs ~100+ ms at full frame).
export function bakeBled(w, h, drawFn, { id = 'inkbleed-lg', halo = .16 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); drawBled(x, drawFn, 1, { id, halo }); return c;
}
