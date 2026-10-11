/* fx/fluid.js  [BUILDER D]  fluid logo colour: marbled, flowing fills and liquid edges that settle to the exact cover
 * =================================================================================================================
 * BUILD.md REVISION 2 ("William's later ideas"): "The logo's shapes are not flat. Their colours swirl and flow inside each shape
 * (marbling, domain-warped flow, liquid paint), staying in each shape's hue family. Their boundaries wobble organically, like
 * liquid edges. Everything settles to the exact flat cover colours and edges for the final hold, so the last frame still
 * matches the cover."
 *
 * TYPE "fluid" (edl/README.md, "Builder D"): {t0, t1, item (the kand item), pieces (default every fillable piece: the discs with
 *   r >= 25, the band, the square, the triangle), flow (speed, 1), swirl (1), wobble (edge amplitude in cover units, 7), ripple
 *   (a wave round each edge on every beat, 1), scale (pattern scale, 1), calm {from, to} (flow and wobble ease down; default the
 *   2 beats before the kand item's settle), palettes {piece: [base, light, deep, accent, vein]} overrides}
 * HOW: builder A's kandinsky hooks: fill(ctx, piece, t, info) draws this frame's marbled texture of the piece into its clipped
 * outline; outline(piece, t, info) returns the wobbling edge. The textures are rendered once per frame for all pieces by one
 * small WebGL2 fragment shader (domain-warped fbm marbling, integer hashes: deterministic on SwiftShader) into an atlas canvas
 * (one viewport per piece; the band gets a long strip); ~10-30 ms. The kand item crossfades the fill to the flat cover colour
 * while it settles and stops calling the hooks at settle 1, so the hold is the exact cover (check/coverdiff.py).
 * Without WebGL2 the fill falls back to canvas sine-marbling (INFO).
 * EXPORTS HP.lib.fluid = {PAL, atlas, wobblePath}
 */
(function () {
'use strict';
const { clamp, lerp, pr, smooth } = HP.u, E = HP.ease;
const COL = HP.COL, TAU = 2 * Math.PI, EPS = HP.EPS, D2R = Math.PI / 180;
const BP = () => HP.hits.period || 0.4839;

// hue families (base, light, deep, accent, vein) per cover colour; all from the cover palette and its tints/shades
const PAL = {
  pink: ['#FF2E88', '#FF8CC2', '#C2106A', '#FF4A1C', '#FFE3EE'],
  ink: ['#15131F', '#2B2650', '#0B0A12', '#4A2FA8', '#3A3560'],
  orange: ['#FF4A1C', '#FF9A4A', '#C8300E', '#F2C300', '#FFE1C8'],
  blue: ['#2346FF', '#6C86FF', '#1428B8', '#7B3FF2', '#DDE3FF'],
  teal: ['#00B8A9', '#5FE0D3', '#007F76', '#2346FF', '#DCFFF9'],
  yellow: ['#F2C300', '#FFE066', '#D29A00', '#FF4A1C', '#FFF6CC'],
  red: ['#B31B1B', '#E04646', '#7E0E0E', '#FF4A1C', '#FFD9D0'],
  violet: ['#7B3FF2', '#A982FF', '#4F1FB8', '#FF2E88', '#EEE4FF'],
};
const hex = h => { const s = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16) / 255); };

// ============================================================ the shader atlas
const VS = `#version 300 es
in vec2 aP; out vec2 vUv; void main() { vUv = aP * .5 + .5; gl_Position = vec4(aP, 0., 1.); }`;
const FS = `#version 300 es
precision highp float; precision highp int;
in vec2 vUv; out vec4 o;
uniform float uT, uSeed, uAsp, uSwirl, uScale, uFlat, uAmp;
uniform vec3 uC0, uC1, uC2, uC3, uC4;
uint h2(uvec2 v) { v = v * 1664525u + 1013904223u; v.x += v.y * 1664525u; v.y += v.x * 1664525u; v ^= v >> 16u; v.x += v.y * 1664525u; v.y += v.x * 1664525u; v ^= v >> 16u; return v.x ^ v.y; }
float hash(vec2 p) { return float(h2(uvec2(ivec2(floor(p)) + 32768)) & 0xffffffu) / 16777215.; }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
float fbm(vec2 p) { float a = .5, s = 0.; mat2 R = mat2(.8, .6, -.6, .8); for (int k = 0; k < 4; k++) { s += a * vnoise(p); p = R * p * 2.03 + 17.1; a *= .5; } return s; }
void main() {
  vec2 p = (vUv - .5) * 2.; p.x *= uAsp;
  float r = length(p / vec2(uAsp, 1.));
  float a = uSwirl * (1. - smoothstep(0., 1.15, r)) * (1.6 + .4 * sin(uT * .7 + uSeed));
  float ca = cos(a), sa = sin(a); p = mat2(ca, sa, -sa, ca) * p;
  vec2 P = p * 1.7 * uScale + uSeed * 7.31;
  vec2 q = vec2(fbm(P + vec2(0., .23 * uT)), fbm(P + vec2(5.2, 1.3) - .19 * uT));
  vec2 s = vec2(fbm(P + 3.2 * q + vec2(1.7, 9.2) + .31 * uT), fbm(P + 3.2 * q + vec2(8.3, 2.8) - .27 * uT));
  float v = fbm(P + 3.6 * s + .11 * uT);
  float bands = .5 + .5 * sin(10.5 * v + 5. * s.x + uT * .9);
  vec3 c = mix(uC2, uC0, smoothstep(.22, .55, v));
  c = mix(c, uC1, smoothstep(.55, .85, v) * .9);
  c = mix(c, uC3, smoothstep(.62, .95, s.y) * .45);
  c = mix(c, uC4, pow(bands, 9.) * .55);
  c = mix(uC0, c, uAmp);
  o = vec4(mix(c, uC0, uFlat), 1.);
}`;
let GL = null;
function glInit() {
  if (GL !== null) return GL;
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512;
  const gl = cv.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false, alpha: false });
  if (!gl) { HP.INFO.push('fluid: no WebGL2, canvas fallback'); GL = false; return GL; }
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('fluid shader: ' + gl.getShaderInfoLog(s)); return s; };
  const pg = gl.createProgram(); gl.attachShader(pg, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pg, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pg);
  if (!gl.getProgramParameter(pg, gl.LINK_STATUS)) throw new Error('fluid program: ' + gl.getProgramInfoLog(pg));
  gl.useProgram(pg);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pg, 'aP'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; for (const n of ['uT', 'uSeed', 'uAsp', 'uSwirl', 'uScale', 'uFlat', 'uAmp', 'uC0', 'uC1', 'uC2', 'uC3', 'uC4']) U[n] = gl.getUniformLocation(pg, n);
  GL = { cv, gl, U };
  return GL;
}

// ============================================================ geometry of the fillable pieces (cover units)
const RAD = 22 * D2R, KT = Math.tan(RAD), TV = 120 / Math.cos(RAD), BOT = 1000, XL = -60, XR = 1560;
const topY = x => BOT - TV - KT * x;
function pieceBox(P) {   // [x, y, w, h] (cover units) the texture is stretched over (a little larger than the piece)
  if (P.kind === 'circle') return [P.c[0] - P.r * 1.12, P.c[1] - P.r * 1.12, P.r * 2.24, P.r * 2.24];
  if (P.kind === 'band') return [XL - 40, topY(XR) - 60, XR - XL + 80, topY(XL) + TV - topY(XR) + 120];
  return [P.home[0] - 90, P.home[1] - 90, 180, 180];
}
// slots in the 1024x512 atlas: the band a long strip, the rest 160x160 tiles
function slots(names) {
  const out = {}; let x = 0, y = 96;
  for (const n of names) {
    if (n === 'band') { out[n] = [0, 0, 1024, 96]; continue; }
    if (x + 160 > 1024) { x = 0; y += 160; }
    out[n] = [x, y, 160, 160]; x += 160;
  }
  return out;
}

// liquid edges: radial wobble for discs, normal displacement along the edges of the band, square and triangle
function wob(seed, s, t, A, rip) {   // s: position along the edge (radians round a disc, or a normalised length)
  return A * (.55 * Math.sin(3 * s + 1.3 * t + seed) + .35 * Math.sin(5 * s - 1.9 * t + seed * 1.7) + .22 * Math.sin(8 * s + 2.7 * t + seed * 2.3)) + rip;
}
function rippleAt(t, s, amp) {   // a wave round the edge on every beat
  if (!amp) return 0; const b = HP.beatAt(t), f = b - Math.floor(b), front = f * 2.4;
  return amp * Math.exp(-f / .35) * Math.sin(6 * (s - front * TAU * .5));
}
function polyEdge(path, pts, closed, seed, t, A, rip, K) {   // K: per-edge amplitude factors (default 1)
  // pts: corners (cover units); every edge subdivided and pushed along its outward normal
  const n = pts.length, all = [];
  let cx = 0, cy = 0; pts.forEach(p => { cx += p[0]; cy += p[1]; }); cx /= n; cy /= n;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(4, Math.round(L / 14));
    let nx = (b[1] - a[1]) / L, ny = -(b[0] - a[0]) / L; const dx = (a[0] + b[0]) / 2 - cx, dy = (a[1] + b[1]) / 2 - cy; if (nx * dx + ny * dy < 0) { nx = -nx; ny = -ny; }
    for (let k = 0; k < m; k++) {
      const u = k / m, x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u), taper = Math.sin(Math.PI * u);   // corners stay put
      const s = (i + u) / n * TAU, d = wob(seed + i, s * (L / 120), t, A, rippleAt(t, s, rip)) * taper * (K ? K[i] : 1);
      all.push([x + nx * d, y + ny * d]);
    }
  }
  all.forEach((p, i) => i ? path.lineTo(p[0], p[1]) : path.moveTo(p[0], p[1]));
  if (closed) path.closePath();
}
function wobblePath(P, t, A, rip, seed) {
  const p = new Path2D();
  if (P.kind === 'circle') {
    const N = Math.max(48, Math.round(P.r * .6));
    for (let i = 0; i <= N; i++) { const s = i / N * TAU, rr = P.r + wob(seed, s, t, A * Math.min(1, P.r / 120), rippleAt(t, s, rip)); const x = P.c[0] + Math.cos(s) * rr, y = P.c[1] + Math.sin(s) * rr; i ? p.lineTo(x, y) : p.moveTo(x, y); }
    p.closePath(); return p;
  }
  if (P.kind === 'band') { polyEdge(p, [[XL, topY(XL)], [XR, topY(XR)], [XR, topY(XR) + TV], [XL, topY(XL) + TV]], true, seed, t, A, rip, [0, 0, 1.3, 0]); return p; }   // the top edge stays under the ink rule
  if (P.kind === 'square') { const a = 15 * D2R, c = Math.cos(a), s = Math.sin(a); polyEdge(p, [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => [690 + (u * 54) * c - (v * 54) * s, 890 + (u * 54) * s + (v * 54) * c]), true, seed, t, A * .6, rip * .6); return p; }
  if (P.kind === 'nabla') { const NX = 1320, NTIP = topY(1320) - 67, NWD = 125, NHT = 108; polyEdge(p, [[NX - NWD / 2, NTIP - NHT], [NX + NWD / 2, NTIP - NHT], [NX, NTIP]], true, seed, t, A * .6, rip * .6); return p; }
  return null;
}

// ============================================================ the item
const FILLABLE = P => (P.kind === 'circle' && P.r >= 25) || ['band', 'square', 'nabla'].includes(P.kind);
HP.register('fluid', {
  build(it) {
    const d = it.d;
    it.o = { flow: 1, swirl: 1, wobble: 7, ripple: 1, scale: 1, ...d };
    HP.on('built', () => {
      const K = HP.lib.kandinsky; if (!K) { HP.WARN.push(`fluid ${it.id}: no fx/kandinsky.js`); return; }
      const kd = K.items.find(k => k.id === d.item); if (!kd) { HP.WARN.push(`fluid ${it.id}: no kand item "${d.item}"`); return; }
      it.kand = kd;
      it.names = (d.pieces || kd.names).filter(n => K.PIECES[n] && FILLABLE(K.PIECES[n]) && kd.names.includes(n));
      it.slot = slots(it.names);
      const S = kd.settle ? kd.settle.at : it.t1;
      it.calm = d.calm ? { a: HP.T(d.calm.from), b: HP.T(d.calm.to) } : { a: S - 2 * BP(), b: S };
      it.seed = {}; it.names.forEach((n, i) => { it.seed[n] = (HP.hash('fluid', it.id, n) % 1000) / 97; });
      K.hook({ item: d.item, pieces: it.names, t0: it.t0, t1: it.t1,
        fill: (ctx, P, t, info) => fill(it, ctx, P, t, info),
        outline: (P, t, info) => { const A = amp(it, t) * (1 - info.settle); if (A < .05) return null; return wobblePath(P, flowT(it, t), it.o.wobble * A, it.o.ripple * 4 * A, it.seed[P.name]); } });
      for (const x of HP.beatsIn(it.t0, it.calm.a)) it.mark(x.t, 'ripple');
    });
  },
  draw() {},
});
function amp(it, t) { return 1 - smooth(pr(t, it.calm.a, it.calm.b - it.calm.a)) * .85; }   // 1 -> .15 through the calm, kand's settle does the rest
function flowT(it, t) {   // the flow's clock: steady, with a surge on every beat (pure in t)
  const b = HP.beatAt(t), fb = Math.floor(b);
  return it.o.flow * ((t - it.t0) * 1.1 + .55 * (fb + E.oExpo(b - fb)));
}
// render every piece's texture for this frame into the atlas (once per frame)
function atlas(it, t) {
  const fn = HP.frameNo(t);
  if (it._fn === fn) return it._atlas;
  it._fn = fn;
  const G = glInit(); if (!G) { it._atlas = null; return null; }
  const { gl, U } = G, A = amp(it, t), T = flowT(it, t);
  for (const n of it.names) {
    const P = HP.lib.kandinsky.PIECES[n], s = it.slot[n], pal = palOf(it, P, it._col && it._col[n]), bx = pieceBox(P);
    gl.viewport(s[0], 512 - s[1] - s[3], s[2], s[3]);
    gl.uniform1f(U.uT, T + it.seed[n]); gl.uniform1f(U.uSeed, it.seed[n]); gl.uniform1f(U.uAsp, bx[2] / bx[3]);
    gl.uniform1f(U.uSwirl, it.o.swirl * (P.kind === 'band' ? .15 : 1.2) * A); gl.uniform1f(U.uScale, it.o.scale * (P.kind === 'band' ? .55 : P.r ? clamp(P.r / 150, .6, 1.3) : .8));
    gl.uniform1f(U.uFlat, 0); gl.uniform1f(U.uAmp, A);
    ['uC0', 'uC1', 'uC2', 'uC3', 'uC4'].forEach((u, k) => gl.uniform3fv(U[u], hex(pal[k])));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  it._atlas = G.cv;
  return G.cv;
}
// the hue family: an override, else the family whose base is the piece's colour this frame (ink pieces turn cream on dark)
function palOf(it, P, col) {
  if (it.o.palettes && it.o.palettes[P.name]) return it.o.palettes[P.name];
  if (col) { const k = Object.keys(PAL).find(f => PAL[f][0].toLowerCase() === String(col).toLowerCase()); if (k) return PAL[k]; }
  return PAL[P.col] || PAL.pink;
}
function fill(it, ctx, P, t, info) {
  (it._col || (it._col = {}))[P.name] = info.color;
  const bx = pieceBox(P), cv = atlas(it, t);
  if (cv) { const s = it.slot[P.name]; ctx.drawImage(cv, s[0], s[1], s[2], s[3], bx[0], bx[1], bx[2], bx[3]); return true; }
  // fallback: canvas marbling (flat base + flowing sine veins in the hue family)
  const pal = palOf(it, P, info.color), T = flowT(it, t);
  ctx.fillStyle = pal[0]; ctx.fillRect(bx[0], bx[1], bx[2], bx[3]);
  ctx.lineWidth = bx[3] * .06; ctx.lineCap = 'round';
  for (let k = 0; k < 9; k++) { ctx.strokeStyle = pal[1 + k % 4]; ctx.globalAlpha *= 1; ctx.beginPath();
    for (let i = 0; i <= 24; i++) { const u = i / 24, x = bx[0] + u * bx[2], y = bx[1] + (k + .5) / 9 * bx[3] + Math.sin(u * 6 + T + k) * bx[3] * .06; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
  return true;
}
HP.lib.fluid = { PAL, atlas, wobblePath, glInit };
})();
