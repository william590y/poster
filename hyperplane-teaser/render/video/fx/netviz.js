/* fx/netviz.js  [BUILDER B]  neural-net visual candy: inference, backprop, attention, and a 3D transformer fly-through
 * =================================================================================================================
 * William: "some animation of a neural net or some other architecture doing backprop or inference too as visual candy (and
 * any relevant equations)"; "There are gorgeous 3D animations online of transformers or resnets we can emulate for this."
 * Looks emulated (never copied): Brendan Bycroft's LLM visualization (bbycroft.net/llm: a vertical tower of translucent
 * matrix slabs, weight cells and activation cells, flow ribbons, black label tags, a camera flying along), 3Blue1Brown's
 * DL1/DL3/DL5/DL6 (an MNIST digit becoming a column of neurons, edges coloured by sign and weighted by size, backprop as
 * arrows flowing back, the Q/K attention grid of glowing dots, an LLM as stacked glowing slabs), Denis Dmitriev's 3D MNIST
 * fly-throughs (layers as planes of neurons, synapse clouds, the digit lighting up), ResNet block diagrams (skip arcs over
 * blocks). All in the cover palette, with pencil outlines that boil on twos and paint splats on the downbeats.
 *
 * ITEM net (documented in edl/README.md, "Builder B"):
 *   kind "mlp"        a real tiny sigmoid MLP (144-16-16-10, seeded weights) reading a digit. Inference: activations flow
 *                     forward one layer per beat ("infer": beats spec); backprop: the error flows back in orange/red
 *                     one layer per beat ("backprop": beats spec, output -> input), the weights update ("update": time;
 *                     edges thicken/thin by the real gradient step), then an optional second pass ("infer2") shows the
 *                     corrected prediction. Drawn in 3D perspective on a 2D canvas (hand-rolled projection).
 *   kind "attention"  tokens in a row, attention arcs whose weights flicker head by head on the beats ("heads": beats spec),
 *                     the causal Q/K grid of glowing dots, and the next token predicted ("predictAt").
 *   kind "tower"      the hero: a 3D transformer (three.js WebGL, deterministic): token columns, the residual stream as a
 *                     yellow river, attention heads fanning out, MLP slabs, skip arcs over every block, the forward pass
 *                     lighting block by block on the beats ("infer"), backprop sweeping back ("backprop"), a camera flying
 *                     down the tower, pencil outlines and paint splats on top.
 *   common: t0, t1, ground (dark | cream | none), cam {yaw, pitch, dist, fov, orbit, target}, labels (true), splats (true).
 * EXPORTS: HP.lib.netviz = {mlp (the tiny network maths), project helpers, THREE (after load)}.
 * RULES: t-pure (the network is computed once at build; drawing is a function of t); seeds from the item id.
 */
(function () {
'use strict';
const { clamp, lerp, pr, el } = HP.u, E = HP.ease;
const BEAT = 0.4839, EIGHTH = BEAT / 2;
const KIT = () => HP.lib.charts.kit;
const C = HP.COL, NIGHT = '#0E0D12';

// ============================================================ helpers
const hexRGB = h => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
const mixRGB = (a, b, k) => { const A = hexRGB(a), B = hexRGB(b); return `rgb(${Math.round(lerp(A[0], B[0], k))},${Math.round(lerp(A[1], B[1], k))},${Math.round(lerp(A[2], B[2], k))})`; };
const rgba = (h, a) => { const A = hexRGB(h); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; };
const sig = z => 1 / (1 + Math.exp(-z));
// beat-stepped progress: times T[0..n-1] -> fractional index (k + eased progress toward T[k+1]); arrives ON each beat
function stepped(t, T, move = 0.6, ease = E.ioCub) {
  if (!T.length || t < T[0]) return -1;
  for (let k = T.length - 1; k >= 0; k--) if (t >= T[k] - HP.EPS) {
    if (k === T.length - 1) return k;
    const span = T[k + 1] - T[k], u = pr(t, T[k + 1] - span * move, span * move);
    return k + ease(u);
  }
  return -1;
}
// times from a spec, or [] when absent
const timesOf = (spec, n, t0, per = BEAT) => spec === undefined || spec === null ? [] : KIT().times(spec, n, t0, per);

// ---- a small perspective camera (hand-rolled projection for the canvas versions)
function camera(o) {
  const yaw = (o.yaw ?? 35) * Math.PI / 180, pitch = (o.pitch ?? 18) * Math.PI / 180, dist = o.dist ?? 16, T = o.target || [0, 0, 0];
  const pos = [T[0] + dist * Math.cos(pitch) * Math.sin(yaw), T[1] + dist * Math.sin(pitch), T[2] + dist * Math.cos(pitch) * Math.cos(yaw)];
  const f = norm(sub(T, pos)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f);
  const roll = (o.roll ?? 0) * Math.PI / 180, cr = Math.cos(roll), sr = Math.sin(roll);
  const R = [r[0] * cr + u[0] * sr, r[1] * cr + u[1] * sr, r[2] * cr + u[2] * sr], U = [u[0] * cr - r[0] * sr, u[1] * cr - r[1] * sr, u[2] * cr - r[2] * sr];
  const focal = (HP.H / 2) / Math.tan(((o.fov ?? 40) * Math.PI / 180) / 2) * (o.zoom ?? 1);
  const cx = o.cx ?? HP.W / 2, cy = o.cy ?? HP.H / 2;
  return {
    pos, project(p) { const d = sub(p, pos), z = dot(d, f); const k = focal / Math.max(0.05, z); return { x: cx + dot(d, R) * k, y: cy - dot(d, U) * k, s: k, z }; },
  };
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
// pencil-ish circle: two passes of a noisy loop (cheap; boils with the seed)
function pcircle(ctx, x, y, r, seed, lw, col) {
  const R = HP.rng('pc', seed);
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round';
  for (let pass = 0; pass < 2; pass++) {
    const n = 12, a0 = R() * 6.28, ov = 0.15 + R() * 0.3, jr = r * 0.06 + 0.6;
    ctx.beginPath();
    for (let k = 0; k <= n; k++) { const a = a0 + (k / n) * (6.283 + ov), rr = r + (R() - 0.5) * jr * 2; const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke();
  }
  ctx.restore();
}
// pencil-ish line: a slightly bowed quadratic with seeded offsets
function pline(ctx, x0, y0, x1, y1, seed, amp = 1.5) {
  const R = HP.rng('pl', seed), mx = (x0 + x1) / 2 + (R() - 0.5) * amp * 2, my = (y0 + y1) / 2 + (R() - 0.5) * amp * 2;
  ctx.moveTo(x0 + (R() - 0.5) * amp, y0 + (R() - 0.5) * amp); ctx.quadraticCurveTo(mx, my, x1 + (R() - 0.5) * amp, y1 + (R() - 0.5) * amp);
}

// ============================================================ the tiny MLP (real maths, Nielsen ch. 1-2 notation)
// sizes [144, 16, 16, 10]; sigmoid; quadratic cost; one gradient-descent step w -> w - eta dC/dw (BP1-BP4)
function digitBitmap(ch, n, font) {
  return HP.memo('digit|' + ch + '|' + n + '|' + font, () => {
    const S = 64, c = HP.offscreen(S, S), x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, S, S); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = font || "italic 600 60px 'Newsreader', serif"; x.fillText(ch, S / 2, S / 2 + 3);
    const d = x.getImageData(0, 0, S, S).data, out = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      let s = 0, m = 0; const x0 = Math.floor(i * S / n), x1 = Math.floor((i + 1) * S / n), y0 = Math.floor(j * S / n), y1 = Math.floor((j + 1) * S / n);
      for (let y = y0; y < y1; y++) for (let xx = x0; xx < x1; xx++) { s += d[(y * S + xx) * 4]; m++; }
      out.push(Math.min(1, s / m / 255 * 1.6));
    }
    return out;
  });
}
function buildMLP(key, sizes, input, target, wrong, eta) {
  const R = HP.rng('mlp', key), gauss = () => { let u = 0; for (let k = 0; k < 6; k++) u += R(); return (u - 3) / Math.sqrt(0.5); };
  const W = [], B = [];
  for (let l = 1; l < sizes.length; l++) {
    const w = []; for (let j = 0; j < sizes[l]; j++) { const row = []; for (let k = 0; k < sizes[l - 1]; k++) row.push(gauss() / Math.sqrt(sizes[l - 1]) * 2.2); w.push(row); }
    W.push(w); B.push(Array.from({ length: sizes[l] }, () => gauss() * 0.4));
  }
  const fwd = (W, B) => { const A = [input.slice()], Z = [null]; for (let l = 0; l < W.length; l++) { const z = W[l].map((row, j) => row.reduce((s, w, k) => s + w * A[l][k], B[l][j])); Z.push(z); A.push(z.map(sig)); } return { A, Z }; };
  // tilt the output biases so the first pass is (honestly) wrong: the net says `wrong`
  let f = fwd(W, B);
  { const o = f.Z[f.Z.length - 1], L = B.length - 1; const zt = Math.max(...o) + 0.9; B[L][wrong] += zt - o[wrong]; B[L][target] -= 1.2; f = fwd(W, B); }
  const y = Array.from({ length: sizes[sizes.length - 1] }, (_, j) => j === target ? 1 : 0);
  const back = (W, f) => {   // BP1, BP2 (deltas), BP4 (weight gradients), BP3 (bias gradients)
    const L = W.length, D = new Array(L + 1);
    D[L] = f.A[L].map((a, j) => (a - y[j]) * a * (1 - a));
    for (let l = L - 1; l >= 1; l--) D[l] = f.A[l].map((a, j) => W[l].reduce((s, row, i) => s + row[j] * D[l + 1][i], 0) * a * (1 - a));
    const GW = W.map((w, l) => w.map((row, j) => row.map((_, k) => f.A[l][k] * D[l + 1][j])));
    return { D, GW };
  };
  const g = back(W, f);
  // one step; grow eta until the corrected net says `target` (it is a cartoon of one step, with the real gradient direction)
  let e = eta, W2, B2, f2;
  for (let tries = 0; tries < 12; tries++, e *= 1.6) {
    W2 = W.map((w, l) => w.map((row, j) => row.map((v, k) => v - e * g.GW[l][j][k])));
    B2 = B.map((b, l) => b.map((v, j) => v - e * g.D[l + 1][j]));
    f2 = fwd(W2, B2);
    const o = f2.A[f2.A.length - 1]; if (o.indexOf(Math.max(...o)) === target) break;
  }
  return { sizes, W, B, A: f.A, D: g.D, GW: g.GW, W2, A2: f2.A, eta: e, target, wrong };
}

// ============================================================ kind "mlp"
function buildMlpItem(it) {
  const d = it.d;
  it.ink = d.ground === 'cream' ? C.ink : C.cream;
  const n0 = d.grid ?? 12, sizes = [n0 * n0, 16, 16, 10];
  const target = d.digit ?? 3, wrong = d.wrong ?? 8;
  it.inp = digitBitmap(String(target), n0, d.digitFont);
  it.net = HP.memo('net|' + it.id, () => buildMLP(it.id, sizes, it.inp, target, wrong, d.eta ?? 4));
  // world layout. flow "right" (default, 3Blue1Brown-style): the input digit is a plate of pixels facing the camera on
  // the left, the hidden layers are 4 x 4 grids in the y-z plane, the output a column of 10 on the right.
  // flow "down": layers are horizontal plates stacked down the y axis (Denis Dmitriev-style).
  const gap = d.layerGap ?? (d.flow === 'down' ? 3.4 : 1.9), P = [], sp0 = d.pixel ?? 0.25;
  it.flow = d.flow || 'right';
  if (it.flow === 'down') {
    const grid = (n, g, sp, y) => Array.from({ length: n }, (_, k) => [((k % g) - (g - 1) / 2) * sp, y, (Math.floor(k / g) - (Math.ceil(n / g) - 1) / 2) * sp]);
    P.push(grid(sizes[0], n0, sp0, 1.5 * gap)); P.push(grid(16, 4, 1.05, 0.5 * gap)); P.push(grid(16, 4, 1.05, -0.5 * gap));
    P.push(Array.from({ length: 10 }, (_, k) => [(k - 4.5) * 0.78, -1.5 * gap, 0]));
  } else {
    const X = l => (l - 1.5) * gap;
    P.push(Array.from({ length: sizes[0] }, (_, k) => [X(0) + ((k % n0) - (n0 - 1) / 2) * sp0 - 0.6, ((n0 - 1) / 2 - Math.floor(k / n0)) * sp0, 0]));
    const grid = (l) => Array.from({ length: 16 }, (_, k) => [X(l), (1.5 - Math.floor(k / 4)) * 0.92, ((k % 4) - 1.5) * 0.92]);
    P.push(grid(1)); P.push(grid(2));
    P.push(Array.from({ length: 10 }, (_, k) => [X(3), (4.5 - k) * 0.5, 0]));
  }
  it.P = P;
  // visible edges: the K strongest |w a| into each node (input edges from lit pixels mostly)
  const Kin = d.edges ?? 7, N = it.net; it.E = [];
  for (let l = 1; l < sizes.length; l++) for (let j = 0; j < sizes[l]; j++) {
    const cand = N.W[l - 1][j].map((w, k) => ({ k, w, s: Math.abs(w) * (0.15 + N.A[l - 1][k]) }));
    cand.sort((a, b) => b.s - a.s);
    for (const c of cand.slice(0, Kin)) it.E.push({ l, j, k: c.k, w: c.w, gw: N.GW[l - 1][j][c.k], w2: N.W2[l - 1][j][c.k] });
  }
  const gmax = Math.max(...it.E.map(e => Math.abs(e.gw))) || 1;
  for (const e of it.E) e.g = e.gw / gmax;   // normalised gradient, -1..1
  // timelines (beats specs)
  it.Ti = timesOf(d.infer, sizes.length, it.t0 + BEAT);          // layer l lit at Ti[l] (Ti[0] = the input)
  it.Tb = timesOf(d.backprop, sizes.length - 1, 1e9);              // Tb[0] = output error, Tb[k] = layer L-k deltas
  it.Tu = d.update !== undefined ? HP.T(d.update) : (it.Tb.length ? it.Tb[it.Tb.length - 1] + BEAT : 1e9);
  it.T2 = timesOf(d.infer2, sizes.length, 1e9);
  it.Tw = d.pulseOn ? HP.fxTimes({ on: d.pulseOn }).times : [];
  it.Tw.forEach(x => it.mark(x, 'wave'));
  [...it.Ti, ...it.Tb, ...it.T2].forEach(x => it.mark(x, 'layer'));
  if (it.Tu < 1e8) it.mark(it.Tu, 'update');
  it.cvs = it.canvas(); it.imagery(it.cvs.cv);   // the animated network is the picture of the frame (declared as imagery)
  // DOM labels: layer names, output digits, the prediction
  const mono = (txt, px, css) => { const s = el('div', '', it.el, { position: 'absolute', font: `600 ${px}px 'IBM Plex Mono', monospace`, color: it.ink, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0, zIndex: 3, ...css }); s.textContent = txt; return s; };
  it.digitLab = Array.from({ length: 10 }, (_, k) => mono(String(k), 30, { transform: 'translate(-50%, 0)' }));
  const LN = d.layerNames || ['input: 144 pixels', 'hidden', 'hidden', 'output'];
  it.layerLab = LN.map(s => mono(s, 26, { transform: 'translate(-100%, -50%)' }));
  it.pred = el('div', '', it.el, { position: 'absolute', font: "700 120px 'Unbounded', sans-serif", color: C.orange, opacity: 0, zIndex: 4, transformOrigin: '0 50%' });
  it.predSub = mono('', 30, {});
  it.splats = [];
  if (d.splats !== false) for (const x of [...it.Ti, ...it.Tb, ...it.T2]) { const b = HP.beatAt(x), r = Math.round(b); if (Math.abs(b - r) < 0.05 && ((r % 4) + 4) % 4 === 0) it.splats.push(x); }
}
function mlpCam(it, t) {
  const d = it.d, c = d.cam || {}, life = it.life(t);
  // the camera keeps orbiting (alive between beats) and steps a little on each layer beat
  // each layer beat steps the orbit (a held pose between beats, eased into the next): 3 deg, 6 on bar downbeats
  let steps = 0; for (const x of [...it.Ti, ...it.Tb, ...it.T2]) { if (t < x - 0.3) continue; const r = Math.round(HP.beatAt(x)), big = ((r % 4) + 4) % 4 === 0 ? 2 : 1; steps += big * E.oBack(pr(t, x - 0.3, 0.3), 1.6); }
  let kick = 0; for (const x of [...it.Ti, ...it.Tb, ...it.T2]) { if (t < x - HP.EPS) continue; const u = pr(t, x, 0.25); if (u < 1) kick = Math.max(kick, 1 - E.oCub(u)); }
  const right = it.flow !== 'down';
  return camera({ yaw: (c.yaw ?? (right ? -22 : 32)) + (c.orbit ?? 24) * (life - 0.5) + steps * (c.step ?? 2.2) - 8, pitch: c.pitch ?? (right ? 9 : 30), dist: (c.dist ?? 21) * (1 - 0.025 * kick), fov: c.fov ?? 38,
    target: c.target || [0, 0, 0], cy: c.cy ?? 1180, cx: c.cx ?? 540, roll: (c.roll ?? 0) + Math.sin(t * 0.8) * 0.6 });
}
function drawMlp(it, t) {
  const d = it.d, N = it.net, ctx = it.cvs.ctx, cam = mlpCam(it, t), ink = it.ink, dark = ink === C.cream;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, HP.W, HP.H);
  const boil = HP.boil(t) % 3;
  // splats behind everything, at the layer that fires on the downbeat
  for (const x of it.splats) {
    let l = it.Ti.indexOf(x); if (l < 0) { const b = it.Tb.indexOf(x); l = b >= 0 ? N.sizes.length - 1 - b : it.T2.indexOf(x); }
    const c = it.P[Math.max(0, l)].reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0]).map(v => v / it.P[Math.max(0, l)].length);
    // position from the camera AT the splat's beat, so it stays put while the camera moves on (and is history-free:
    // HP.lib.paint.makeSplat memoises the shape and its position by the seed key)
    const q = mlpCam(it, x).project(c), below = it.flow !== 'down';
    const sx = Math.round(below ? q.x + 40 : q.x + 260), sy = Math.round(below ? q.y + (d.splatDy ?? 360) : q.y + 30);
    KIT().splat(ctx, { x: sx, y: sy, key: `${it.id}:sp${x.toFixed(3)}@${sx},${sy}`, r: d.splatR ?? 60, dir: below ? Math.PI / 2 : 0.3, color: it.Tb.includes(x) ? C.orange : (dark ? C.pink : C.yellow), seed: it.id + ':sp' + x.toFixed(3), sats: 30, drips: 2 }, t - x);
  }
  // phase values
  const fi = stepped(t, it.Ti, 0.55), fb = stepped(t, it.Tb, 0.55), f2 = stepped(t, it.T2, 0.55);
  const upd = E.ioCub(pr(t, it.Tu, 0.35));
  const second = f2 >= 0;
  const A = second ? N.A2 : N.A;
  const litF = second ? f2 : fi;                      // layer l lit when litF >= l
  const L = N.sizes.length - 1;
  // project all nodes
  const Q = it.P.map(layer => layer.map(p => cam.project(p)));
  // ---- edges (behind nodes): sign colour, |w| width; forward pulses; backward (orange) pulses; weight update
  const posC = dark ? C.teal : C.blue, negC = C.pink;
  ctx.lineCap = 'round';
  for (let ei = 0; ei < it.E.length; ei++) {
    const e = it.E[ei], a = Q[e.l - 1][e.k], b = Q[e.l][e.j];
    const w = lerp(e.w, e.w2, upd), lit = litF >= e.l - 1 + 0.001 ? clamp((litF - (e.l - 1)) * 1.5) : 0;
    let fl = 0; for (const P of it.Tw) if (t >= P && t < P + 0.2) fl = Math.max(fl, 1 - (t - P) / 0.2);
    const base = 0.10 + 0.22 * Math.min(1, Math.abs(w)) + 0.35 * fl;
    const al = base + lit * 0.35 * A[e.l - 1][e.k];
    const grad = fb >= 0 ? clamp(fb - (L - e.l) + 0.2) : 0;     // the error has reached this edge's layer
    const col = grad > 0 && upd < 1 ? mixRGB(w > 0 ? posC : negC, C.orange, grad * 0.85 * Math.min(1, Math.abs(e.g) * 2.5)) : (w > 0 ? posC : negC);
    ctx.strokeStyle = col.startsWith('#') ? rgba(col, al) : col.replace('rgb', 'rgba').replace(')', `,${al})`);
    // the update: edges thicken where the step grows |w|, thin where it shrinks; a flash on the update beat
    const flash = upd > 0 && upd < 1 ? Math.sin(upd * Math.PI) * Math.abs(e.g) * 3 : 0;
    ctx.lineWidth = Math.max(0.6, (0.7 + 2.6 * Math.min(1.4, Math.abs(w))) * Math.min(1.4, (a.s + b.s) / 2 / 80) + flash);
    ctx.beginPath(); pline(ctx, a.x, a.y, b.x, b.y, it.id + ei + ':' + boil, 1.2); ctx.stroke();
  }
  // forward pulses: dots travel from layer l-1 to l, arriving on the beat when l lights
  const pulse = (T, from, to, colr, list, backward) => {
    for (let l = 1; l <= L; l++) {
      const Tl = backward ? T[L - l + 1] : T[l]; if (Tl === undefined) continue;
      const tr = Math.min(0.42, (backward ? (T[L - l + 1] - (T[L - l] ?? T[L - l + 1] - BEAT)) : (T[l] - T[l - 1])) * 0.85);
      const u = pr(t, Tl - tr, tr); if (u <= 0 || u >= 1) continue;
      for (const e of it.E) {
        if (e.l !== l) continue;
        const a = Q[l - 1][e.k], b = Q[l][e.j], s = backward ? Math.abs(e.g) : Math.abs(e.w) * N.A[l - 1][e.k];
        if (s < 0.08) continue;
        const v = backward ? 1 - E.ioSine(u) : E.ioSine(u), x = lerp(a.x, b.x, v), y = lerp(a.y, b.y, v), r = (3.5 + 6 * Math.min(1, s)) * Math.min(1.5, a.s / 90);
        ctx.fillStyle = rgba(colr, 0.22); ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, 7); ctx.fill();
        ctx.fillStyle = rgba(colr, 0.55 + 0.45 * Math.min(1, s)); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      }
    }
  };
  // idle flow between the beats: faint dots keep streaming along the strongest edges (forward, or backward while the error
  // flows), so no frame is ever still
  if (d.idle !== false && litF >= 0) {
    const bw = fb >= 0 && upd < 1, colr = bw ? C.orange : (dark ? C.cream : C.ink);
    for (let ei = 0; ei < it.E.length; ei += 2) {
      const e = it.E[ei]; if (litF < e.l && !bw) continue;
      const a = Q[e.l - 1][e.k], b = Q[e.l][e.j], ph = (HP.rand(it.id, 'idle', ei) + (bw ? -1 : 1) * t * (0.9 + 0.6 * HP.rand(it.id, 'sp', ei))) % 1;
      const v = ph < 0 ? ph + 1 : ph, x = lerp(a.x, b.x, v), y = lerp(a.y, b.y, v);
      ctx.fillStyle = rgba(colr, 0.55); ctx.beginPath(); ctx.arc(x, y, 2.8 * Math.min(1.5, a.s / 90), 0, 7); ctx.fill();
    }
  }
  for (const P of it.Tw) {
    const u = (t - P) / (BEAT * 0.9); if (u < 0 || u > 1) continue;
    for (const e of it.E) {
      const f = clamp(u * L - (e.l - 1)); if (f <= 0 || f >= 1) continue;
      const a = Q[e.l - 1][e.k], b = Q[e.l][e.j], s2 = Math.abs(e.w2) * A[e.l - 1][e.k]; if (s2 < 0.1) continue;
      ctx.fillStyle = rgba(dark ? C.yellow : C.orange, 0.85); ctx.beginPath(); ctx.arc(lerp(a.x, b.x, f), lerp(a.y, b.y, f), (3 + 4 * Math.min(1, s2)) * Math.min(1.5, a.s / 90), 0, 7); ctx.fill();
    }
  }
  if (!second) pulse(it.Ti, 0, 0, dark ? C.yellow : C.orange, null, false);
  pulse(it.Tb, 0, 0, C.red === ink ? C.orange : C.orange, null, true);
  if (second) pulse(it.T2, 0, 0, dark ? C.yellow : C.orange, null, false);
  // ---- nodes, back to front
  const order = [];
  Q.forEach((layer, l) => layer.forEach((q, k) => order.push({ l, k, q })));
  order.sort((a, b) => b.q.z - a.q.z);
  for (const o of order) {
    const { l, k, q } = o, act = A[l][k];
    const lit = litF >= l ? clamp((litF - l) * 3 + 1) * 0 + (litF >= l - 0.001 ? 1 : 0) : 0;
    let pop = (() => { const T = second ? it.T2 : it.Ti; if (T[l] === undefined || t < T[l]) return 0; const u = pr(t, T[l], 0.22); return u < 1 ? 1 - E.oCub(u) : 0; })();
    for (const P of it.Tw) { const arr = P + BEAT * 0.9 * l / L; if (l > 0 && t >= arr && t < arr + 0.2) pop = Math.max(pop, (1 - (t - arr) / 0.2) * act); }
    const delta = fb >= 0 && l >= 1 && fb >= L - l - 0.001 && upd < 1 ? Math.min(1, Math.abs(N.D[l][k]) * 18) : 0;
    let r = (l === 0 ? 0.16 : l === L ? 0.3 : 0.26) * q.s * (1 + 0.35 * pop);
    if (l === 0) {   // the input plate: pixel squares, lit by the digit (they pop in a sweep on the input beat)
      const T0 = (second ? it.T2 : it.Ti)[0], sw = T0 === undefined ? 0 : pr(t, T0 + (k % 12) * 0.012, 0.18), pp = sw > 0 && sw < 1 ? Math.sin(sw * Math.PI) : 0;
      const v = Math.min(1, it.inp[k] * (lit ? 1 : 0.25) * (1 + 0.8 * pp) + 0.25 * pp);
      ctx.fillStyle = mixRGB(dark ? '#1C1A26' : '#E6DECF', pp > 0.3 && it.inp[k] > 0.3 ? C.yellow : (dark ? C.cream : C.ink), v); const s = (d.pixel ?? 0.25) * 0.47 * q.s * (1 + 0.35 * pp);
      if (it.flow === 'down') ctx.fillRect(q.x - s, q.y - s * 0.5, 2 * s, s); else ctx.fillRect(q.x - s, q.y - s, 2 * s, 2 * s);
      continue;
    }
    const fill = lit ? mixRGB(dark ? '#1C1A26' : '#FBF6EC', dark ? C.yellow : C.blue, act) : (dark ? '#1C1A26' : '#FBF6EC');
    ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, 7); ctx.fill();
    if (delta > 0) { const br = 1 + 0.18 * Math.sin(t * 13 + k * 1.7 + l); ctx.fillStyle = rgba(C.orange, 0.25 + 0.6 * delta); ctx.beginPath(); ctx.arc(q.x, q.y, r * (1.25 + 0.4 * delta) * br, 0, 7); ctx.fill(); ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(q.x, q.y, r * 0.8, 0, 7); ctx.fill(); }
    pcircle(ctx, q.x, q.y, r, it.id + l + ':' + k + ':' + boil, Math.max(1.5, q.s * 0.035), delta > 0 ? C.red : ink);
  }
  // ---- labels
  const lab = (node, x, y, op) => { node.style.left = x.toFixed(1) + 'px'; node.style.top = y.toFixed(1) + 'px'; node.style.opacity = op; };
  const show = HP.T(d.labelsAt, it.t0), lo = clamp((t - show) / 0.2);
  const right = it.flow !== 'down';
  it.layerLab.forEach((n, l) => {
    const xs = Q[l].map(q => q.x), ys = Q[l].map(q => q.y), op = d.labels === false ? 0 : lo * (l === 0 || litF >= l || t >= show + l * EIGHTH ? 1 : 0);
    if (right) {
      const hw = (n._w ??= HP.text.measure(n.textContent.toUpperCase(), "600 26px 'IBM Plex Mono'") + n.textContent.length) / 2;
      lab(n, clamp((Math.min(...xs) + Math.max(...xs)) / 2, 64 + hw, 926 - hw), Math.max(...ys) + (l === 0 ? 34 : 60), op); n.style.transform = 'translate(-50%, 0)';
    }
    else lab(n, Math.min(...xs) - 26, (Math.min(...ys) + Math.max(...ys)) / 2, op);
  });
  it.digitLab.forEach((n, k) => { const q = Q[L][k]; if (right) { lab(n, q.x + q.s * 0.32, q.y - q.s * 0.2, lo); n.style.transform = 'translate(0, -20%)'; } else lab(n, q.x, q.y + q.s * 0.42, lo); n.style.color = litF >= L && A[L][k] === Math.max(...A[L]) ? (second ? C.teal : C.orange) : ink; });
  // the prediction: the argmax digit and its activation, slammed on the output beat
  const Tout = second ? it.T2[L] : it.Ti[L];
  if (Tout !== undefined && t >= Tout - HP.EPS) {
    const o = A[L], kmax = o.indexOf(Math.max(...o)), u = pr(t, Tout, 0.18), q = right ? Q[L][0] : Q[L][9];
    const px = d.predPos ? d.predPos[0] : right ? Math.min(800, q.x - 60) : Math.min(860, q.x + 70), py = d.predPos ? d.predPos[1] : right ? q.y - 250 : q.y - 80;
    it.pred.textContent = String(kmax); it.pred.style.color = second ? C.teal : C.orange;
    lab(it.pred, px, py, 1); it.pred.style.transform = `scale(${lerp(1.6, 1, E.oBack(u, 2)).toFixed(3)})`;
    it.predSub.textContent = second ? `✓ ${Math.round(o[kmax] * 100)}%` : `? ${Math.round(o[kmax] * 100)}%`;
    lab(it.predSub, px + 4, py + 150, clamp((t - Tout - 0.1) / 0.1));
    if (fb >= 0 && !second) { it.predSub.textContent = `✗ target: ${N.target}`; it.predSub.style.color = C.orange; } else it.predSub.style.color = ink;
  } else { it.pred.style.opacity = 0; it.predSub.style.opacity = 0; }
}

// ============================================================ kind "attention" (2D, handmade)
function buildAttn(it) {
  const d = it.d;
  it.ink = d.ground === 'cream' ? C.ink : C.cream;
  it.tokens = d.tokens || ['AI', 'that', 'builds', 'better'];
  it.next = d.next || 'AI';
  const n = it.tokens.length, H = d.nHeads ?? 4;
  it.headCol = [C.pink, C.blue, C.teal, C.yellow, C.orange, C.violet].slice(0, H);
  // seeded causal attention weights per head: softmax over j <= i
  it.Wt = Array.from({ length: H }, (_, h) => Array.from({ length: n }, (_, i) => {
    const R = HP.rng(it.id, 'att', h, i), s = Array.from({ length: i + 1 }, () => R() * 3.2);
    if (h === 0 && i > 0) s[i - 1] += 1.5;           // a "previous token" head
    if (h === 1) s[0] += 1.8;                       // a "first token" head
    const m = Math.max(...s), e = s.map(v => Math.exp(v - m)), z = e.reduce((a, b) => a + b, 0); return e.map(v => v / z);
  }));
  it.Th = timesOf(d.heads, H * (d.rounds ?? 1), it.t0 + BEAT);
  it.Th.forEach(x => it.mark(x, 'head'));
  it.Tp = d.predictAt !== undefined ? HP.T(d.predictAt) : (it.Th.length ? it.Th[it.Th.length - 1] + BEAT : it.t1 - 1);
  it.mark(it.Tp, 'predict');
  it.Tt = timesOf(d.tokensAt ?? { at: it.t0, per: EIGHTH / 2 }, n, it.t0, EIGHTH / 2);
  it.Tt.forEach(x => it.mark(x, 'token'));
  it.cvs = it.canvas(); it.imagery(it.cvs.cv);
  const F = { family: "'Newsreader', serif", weight: 600, size: d.tokenPx ?? 60 };
  const ws = it.tokens.map(s => HP.text.measure(s, F)), gap = 46, total = ws.reduce((a, b) => a + b, 0) + gap * n + (HP.text.measure(it.next, F) + 50);
  let x = (HP.W - Math.min(total, 1000)) / 2 + 10; const y = d.rowY ?? 1180;
  it.box = it.tokens.map((s, k) => { const w = ws[k] + 34; const b = { x, y, w, h: F.size * 1.4, cx: x + w / 2 }; x += w + gap - 22; return b; });
  const wn = HP.text.measure(it.next, F) + 34; it.nbox = { x, y, w: wn, h: F.size * 1.4, cx: x + wn / 2 };
  it.tokEl = it.tokens.map((s, k) => { const e = el('div', '', it.el, { position: 'absolute', left: (it.box[k].x + 17) + 'px', top: (y + F.size * 0.12) + 'px', font: HP.text.font(F), color: it.ink, zIndex: 3, opacity: 0, transformOrigin: '50% 60%' }); e.textContent = s; return e; });
  it.nextEl = el('div', '', it.el, { position: 'absolute', left: (it.nbox.x + 17) + 'px', top: (y + F.size * 0.12) + 'px', font: HP.text.font(F), color: it.ink, zIndex: 3, opacity: 0, transformOrigin: '50% 60%' });
  it.nextEl.textContent = it.next;
  it.headLab = el('div', '', it.el, { position: 'absolute', left: '60px', top: (y + 220) + 'px', font: "600 30px 'IBM Plex Mono', monospace", color: it.ink, textTransform: 'uppercase', letterSpacing: '1px', zIndex: 3 });
}
function drawAttn(it, t) {
  const d = it.d, ctx = it.cvs.ctx, ink = it.ink, n = it.tokens.length, H = it.headCol.length;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, HP.W, HP.H);
  const boil = HP.boil(t) % 3, rc = HP.lib.rough.canvas(it.cvs.cv, it.id + ':' + boil);
  // which head is showing: the latest head beat; its arcs flicker in on the beat
  let h = -1, hu = 0; for (let k = 0; k < it.Th.length; k++) if (t >= it.Th[k] - HP.EPS) { h = k % H; hu = pr(t, it.Th[k], 0.3); }
  // token boxes (painted in on 16ths)
  for (let k = 0; k <= n; k++) {
    const B = k < n ? it.box[k] : it.nbox, at = k < n ? it.Tt[k] : it.Tp, u = pr(t, at, 0.16);
    if (u <= 0) { (k < n ? it.tokEl[k] : it.nextEl).style.opacity = 0; continue; }
    const fill = k < n ? (ink === C.ink ? '#FBF6EC' : '#1C1A26') : C.pink;
    rc.rectangle(B.x, B.y, B.w, B.h, { fill, fillStyle: 'solid', stroke: k < n ? ink : C.pink, strokeWidth: 3.5, roughness: 1.3, seed: KIT().seed(it.id, 'box', k, boil) });
    const e = k < n ? it.tokEl[k] : it.nextEl; e.style.opacity = clamp(u * 3); e.style.transform = `scale(${lerp(1.4, 1, E.oBack(u, 2)).toFixed(3)})`;
  }
  // arcs: from each query token i to every key j <= i, weight = attention; the current head bright, the others ghosted
  const arc = (i, j, w, col, a) => {
    const x0 = it.box[i].cx, x1 = it.box[j].cx, y0 = it.box[0].y - 8, span = Math.abs(x1 - x0), hgt = 60 + span * 0.55;
    ctx.strokeStyle = rgba(col, a); ctx.lineWidth = 1.5 + 16 * w; ctx.lineCap = 'round';
    ctx.beginPath();
    if (i === j) { ctx.arc(x0, y0 - 34, 30, 0.75 * Math.PI, 2.25 * Math.PI); }
    else { const R = HP.rng(it.id, 'arc', i, j, boil); ctx.moveTo(x0 + (R() - .5) * 3, y0); ctx.bezierCurveTo(x0 + (R() - .5) * 6, y0 - hgt, x1 + (R() - .5) * 6, y0 - hgt, x1 + (R() - .5) * 3, y0); }
    ctx.stroke();
  };
  if (h >= 0) {
    for (let hh = 0; hh < H; hh++) {
      if (hh === h) continue;
      for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) if (t >= it.Tt[i]) arc(i, j, it.Wt[hh][i][j] * 0.5, it.headCol[hh], 0.12);
    }
    const flick = 0.75 + 0.25 * Math.sin(t * 40 + h);   // a quick flicker as the head switches on
    for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
      const w = it.Wt[h][i][j], u = E.oCub(clamp(hu * 1.6 - (i - j) * 0.12));
      arc(i, j, w * u, it.headCol[h], (0.35 + 0.6 * w) * (hu < 0.4 ? flick : 1));
    }
    it.headLab.textContent = `attention head ${h + 1} of ${H}`;
    it.headLab.style.color = it.headCol[h] === C.yellow && ink === C.ink ? ink : it.headCol[h];
    it.headLab.style.opacity = 1;
  } else it.headLab.style.opacity = 0;
  // the Q/K grid under the row: glowing dots, causal (lower triangle), the current head's weights
  const g0 = { x: (HP.W - n * 92) / 2 + 30, y: it.box[0].y + 330, s: 92 };
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const cx = g0.x + j * g0.s + g0.s / 2, cy = g0.y + i * g0.s + g0.s / 2;
    ctx.strokeStyle = rgba(ink, 0.25); ctx.lineWidth = 1.5; ctx.strokeRect(cx - g0.s / 2, cy - g0.s / 2, g0.s, g0.s);
    if (j > i || h < 0) continue;
    const w = it.Wt[h][i][j] * E.oCub(clamp(hu * 2)), r = 6 + 34 * Math.sqrt(w);
    ctx.fillStyle = rgba(it.headCol[h], 0.25 + 0.75 * w); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
  }
  // the prediction
  if (t >= it.Tp - HP.EPS) {
    const u = pr(t, it.Tp, 0.2);
    if (d.splats !== false) KIT().splat(ctx, { x: Math.min(940, it.nbox.cx + 40), y: it.nbox.y - 190, r: 56, dir: -1.2, color: C.yellow, seed: it.id + ':pred', sats: 26, drips: 1 }, t - it.Tp);
    rc.ellipse(it.nbox.cx, it.nbox.y + it.nbox.h / 2, it.nbox.w + 46, it.nbox.h + 40, KIT().drawOn({ ...KIT().pencil(C.red, 5.5), roughness: 1.5 }, KIT().ellipseLen(it.nbox.w / 2 + 23, it.nbox.h / 2 + 20) * 1.3, pr(t, it.Tp + 0.12, 0.35)));
  }
}

// ============================================================ kind "tower" (3D, three.js WebGL)
// Layout (world units; flow DOWN the y axis, as in Bycroft's tower): T token columns across x, C channels along z.
// Per block l: an attention block (H head slabs that fan out about the river's axis) and an MLP slab, each with a skip arc
// out of the river and back in below it; the river (residual stream) is a yellow translucent band down the whole tower.
function towerLayout(d) {
  const T = (d.tokens || ['AI', 'that', 'builds', 'better']).length, L = d.blocks ?? 3, H = d.nHeads ?? 4;
  const cell = d.cell ?? 0.85, wR = T * cell, gap = d.blockGap ?? 7.5;
  const Y = { embed: 0 }, blocks = [];
  for (let l = 0; l < L; l++) { const y0 = -4.5 - l * gap; blocks.push({ l, attnY: y0, mlpY: y0 - gap * 0.5 }); }
  Y.out = -4.5 - L * gap - 1.2;
  return { T, L, H, cell, wR, gap, blocks, Y };
}
function cellTexture(THREE, w, h) {
  const data = new Uint8Array(w * h * 4); const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true; tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const RGB = h => hexRGB(h);
function fillCells(tex, w, h, fn, key) {   // fn(i, j) -> [r, g, b, a] 0..255; key: everything the content depends on (skip if same)
  if (key !== undefined && tex.userData.key === key) return;
  tex.userData.key = key;
  const D = tex.image.data;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const c = fn(i, j), o = (j * w + i) * 4; D[o] = c[0]; D[o + 1] = c[1]; D[o + 2] = c[2]; D[o + 3] = c[3] ?? 255; }
  tex.needsUpdate = true;
}
async function loadTower(it) {
  await HP.lib.load('three');
  const THREE = HP.lib.netviz.THREE = window.THREE;
  const d = it.d, Lo = it.Lo = towerLayout(d);
  // canvases: splats (behind), WebGL (transparent), pencil overlay (front)
  it.back = it.canvas(); it.gl = el('canvas', '', it.el, { position: 'absolute', left: 0, top: 0, width: HP.W + 'px', height: HP.H + 'px' });
  it.front = it.canvas();
  let R;
  try { R = new THREE.WebGLRenderer({ canvas: it.gl, antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: true, powerPreference: 'high-performance' }); }
  catch (e) { HP.WARN.push(`net ${it.id}: WebGL unavailable (${e.message}); the 3D tower cannot render`); it.noGL = true; return; }
  // SwiftShader is fill-rate bound: render the 3D at glScale (0.5 = 540x960, ~4x cheaper) and let CSS scale it up; the
  // pencil overlay, splats and labels stay full resolution, so the frame still reads crisp
  R.setPixelRatio(d.glScale ?? 0.5); R.setSize(HP.W, HP.H, false); R.setClearColor(0x000000, 0);
  it.gl.style.width = HP.W + 'px'; it.gl.style.height = HP.H + 'px';
  it.R = R; it.imagery(it.gl);
  const S = it.scene = new THREE.Scene();
  S.fog = new THREE.Fog(new THREE.Color(d.ground === 'cream' ? C.cream : NIGHT), 26, 95);
  it.cam3 = new THREE.PerspectiveCamera(d.cam?.fov ?? 42, HP.W / HP.H, 0.1, 200);
  const add = o => { S.add(o); return o; };
  const mats = [];
  const basic = (o) => { const m = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, ...o }); mats.push(m); return m; };
  // ---- the river (residual stream): a long vertical band, stripes flowing with t (texture offset)
  const top = 2.2, bot = Lo.Y.out - 2;
  const stripeTex = (() => { const n = 64, c = HP.offscreen(4, n), x = c.getContext('2d'); for (let k = 0; k < n; k++) { const v = 0.55 + 0.45 * Math.pow(Math.sin(k / n * Math.PI * 4) * 0.5 + 0.5, 3); x.fillStyle = `rgba(242,195,0,${v})`; x.fillRect(0, k, 4, 1); } const tx = new THREE.CanvasTexture(c); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.colorSpace = THREE.SRGBColorSpace; return tx; })();
  stripeTex.repeat.set(1, (top - bot) / 3);
  const river = add(new THREE.Mesh(new THREE.PlaneGeometry(Lo.wR + 0.5, top - bot), basic({ map: stripeTex, opacity: 0.55, color: 0xffffff })));
  river.position.set(0, (top + bot) / 2, -0.01); river.rotation.y = 0;
  it.river = river; it.stripe = stripeTex;
  // river edges (ink rule like the cover band)
  const ruleM = new THREE.LineBasicMaterial({ color: new THREE.Color(C.yellow), transparent: true, opacity: 0.9 });
  for (const sx of [-1, 1]) { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(sx * (Lo.wR / 2 + 0.25), top, 0), new THREE.Vector3(sx * (Lo.wR / 2 + 0.25), bot, 0)]); add(new THREE.Line(g, ruleM)); }
  // ---- token columns at the top: T columns of C cells (an embedding vector each), cells along z
  const Cn = 12;
  it.tokTex = cellTexture(THREE, Lo.T, Cn);
  const emb = add(new THREE.Mesh(new THREE.BoxGeometry(Lo.wR, 0.5, Cn * 0.32), [basic({ color: 0x444455, opacity: 0.4 }), basic({ color: 0x444455, opacity: 0.4 }), basic({ map: it.tokTex, opacity: 0.95 }), basic({ map: it.tokTex, opacity: 0.95 }), basic({ color: 0x444455, opacity: 0.4 }), basic({ color: 0x444455, opacity: 0.4 })]));
  emb.position.set(0, Lo.Y.embed, Cn * 0.16); it.emb = emb;
  // ---- blocks
  it.blk = Lo.blocks.map((b, l) => {
    const o = { l };
    // attention: H head slabs (Q K V packed as cells) hinged on the river's axis, fanned by angle
    // heads: H slabs hinged at their lower-left corner, fanned like a hand of cards (rotation in their own plane), a little
    // apart in depth, turned toward the camera
    o.headRoot = add(new THREE.Group()); o.headRoot.position.set(Lo.wR / 2 + 0.7, b.attnY - 1.0, 0.2); o.headRoot.rotation.y = -0.5;
    o.heads = Array.from({ length: Lo.H }, (_, h) => {
      const tex = cellTexture(THREE, 8, 8), g = new THREE.Group();
      const slab = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.0, 0.05), basic({ map: tex, opacity: 0.9 }));
      slab.position.set(1.3, 1.0, 0); g.add(slab);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(slab.geometry), new THREE.LineBasicMaterial({ color: new THREE.Color([C.pink, C.blue, C.teal, C.yellow][h % 4]), transparent: true, opacity: 0.9 }));
      edges.position.copy(slab.position); g.add(edges);
      g.position.set(0, 0, -h * 0.28); o.headRoot.add(g);
      return { g, slab, tex, edges, h };
    });
    // attention output projection: a slab on the left of the river
    o.attnOut = add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 1.8), basic({ color: new THREE.Color(C.blue), opacity: 0.18 })));
    o.attnOut.position.set(-(Lo.wR / 2 + 1.6), b.attnY - 0.9, 0);
    o.attnOutE = add(new THREE.LineSegments(new THREE.EdgesGeometry(o.attnOut.geometry), new THREE.LineBasicMaterial({ color: new THREE.Color(C.cream), transparent: true, opacity: 0.35 })));
    o.attnOutE.position.copy(o.attnOut.position);
    // MLP: a wide slab of weight cells (4x expansion), to the left, with an activation strip
    o.mlpTex = cellTexture(THREE, 16, 6);
    o.mlp = add(new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.5, 2.0), [basic({ color: 0x2346ff, opacity: 0.18 }), basic({ color: 0x2346ff, opacity: 0.18 }), basic({ map: o.mlpTex, opacity: 0.9 }), basic({ map: o.mlpTex, opacity: 0.9 }), basic({ map: o.mlpTex, opacity: 0.9 }), basic({ map: o.mlpTex, opacity: 0.9 })]));
    o.mlp.position.set(-(Lo.wR / 2 + 2.8), b.mlpY, 0);
    o.mlpE = add(new THREE.LineSegments(new THREE.EdgesGeometry(o.mlp.geometry), new THREE.LineBasicMaterial({ color: new THREE.Color(C.cream), transparent: true, opacity: 0.45 })));
    o.mlpE.position.copy(o.mlp.position);
    // skip arcs: out of the river above each sub-block, over it (toward the camera), back in below
    const arc = (y0, y1, outZ, col) => {
      const crv = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, y0, 0.1), new THREE.Vector3(0, (y0 + y1) / 2, outZ), new THREE.Vector3(0, y1, 0.1));
      const tube = add(new THREE.Mesh(new THREE.TubeGeometry(crv, 40, 0.06, 6, false), basic({ color: new THREE.Color(col), opacity: 0.55 })));
      const head = add(new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), basic({ color: new THREE.Color(col), opacity: 0 })));
      return { crv, tube, head };
    };
    o.skipA = arc(b.attnY + 1.1, b.attnY - 1.9, 3.2, C.cream);
    o.skipM = arc(b.mlpY + 1.1, b.mlpY - 1.6, 3.6, C.cream);
    // glows (additive sprites) for the forward / backward flashes
    o.glow = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(THREE), color: new THREE.Color(C.yellow), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })));
    o.glow.position.set(0, (b.attnY + b.mlpY) / 2, 0.5); o.glow.scale.set(9, 9, 1);
    return o;
  });
  // ---- output: logits row + the predicted token
  it.outTex = cellTexture(THREE, 12, 1);
  it.out = add(new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.5, 0.5), basic({ map: it.outTex, opacity: 0.95 })));
  it.out.position.set(0, Lo.Y.out, 0);
  // the next-token probabilities: 12 bars standing on the logits row (the predicted token's bar tall and pink)
  it.bars = add(new THREE.InstancedMesh(new THREE.BoxGeometry(0.36, 1, 0.36), basic({ color: 0xffffff, opacity: 0.95 }), 12));
  it.barP = Array.from({ length: 12 }, (_, i) => i === 4 ? 1 : 0.08 + 0.3 * Math.pow(HP.rand(it.id, 'logit', i), 2));
  for (let i = 0; i < 12; i++) it.bars.setColorAt(i, new THREE.Color(i === 4 ? C.pink : C.cream));
  // ---- particles swimming down the river (vectors): instanced small boxes
  const NP = d.particles ?? 90;
  it.parts = add(new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.34, 0.08), basic({ color: new THREE.Color(C.cream), opacity: 0.9 }), NP));
  it.partSeed = Array.from({ length: NP }, (_, k) => { const r = HP.rng(it.id, 'p', k); return { x: (r() - 0.5) * (Lo.wR + 0.3), z: (r() - 0.5) * 0.6 + 0.15, ph: r(), sp: 0.6 + r() * 0.8 }; });
  it.mats = mats; it.THREE = THREE;
  it.top = top; it.bot = bot;
  // DOM tags (Bycroft-style labels, our palette): token words above the columns, block tags, the prediction
  const tag = (txt, css) => { const s = el('div', '', it.el, { position: 'absolute', font: "600 26px 'IBM Plex Mono', monospace", color: NIGHT, background: C.cream, padding: '3px 10px', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap', opacity: 0, zIndex: 3, transform: 'translate(-50%, -50%)', ...css }); s.textContent = txt; return s; };
  it.tokTags = (d.tokens || ['AI', 'that', 'builds', 'better']).map(s => tag(s, { font: "600 44px 'Newsreader', serif", textTransform: 'none', background: 'transparent', color: C.cream, letterSpacing: '0' }));
  it.blkTags = it.blk.map((o, l) => ({ attn: tag(`attention · ${Lo.H} heads`), mlp: tag('MLP'), res: tag('residual stream', { background: C.yellow }) }));
  it.predTag = el('div', '', it.el, { position: 'absolute', font: "700 96px 'Unbounded', sans-serif", color: C.pink, opacity: 0, zIndex: 4, transform: 'translate(-50%, -50%)' });
  it.predTag.textContent = d.next || 'AI';
}
function glowTex(THREE) {
  return HP.memo('glowTex', () => { const n = 128, c = HP.offscreen(n, n), x = c.getContext('2d'), g = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, n, n); const t = new THREE.CanvasTexture(c); return t; });
}
function buildTower(it) {
  const d = it.d, Lo = towerLayout(d);
  it.Ti = timesOf(d.infer, Lo.L * 2 + 2, it.t0 + BEAT);       // 0: embed, 1..2L: attn/mlp of each block, 2L+1: output
  it.Tb = timesOf(d.backprop, Lo.L * 2 + 1, 1e9);              // output, then mlp/attn back up the tower
  it.Th = timesOf(d.heads, 0, 0);
  [...it.Ti, ...it.Tb].forEach(x => it.mark(x, 'block'));
  it.splats = [];
  if (d.splats !== false) for (const x of [...it.Ti, ...it.Tb]) { const b = HP.beatAt(x), r = Math.round(b); if (Math.abs(b - r) < 0.05 && ((r % 4) + 4) % 4 === 0) it.splats.push(x); }
}
// stage s (0 embed, 1..2L sub-blocks, 2L+1 output) -> its world y
function stageY(Lo, s) { if (s <= 0) return Lo.Y.embed; if (s > Lo.L * 2) return Lo.Y.out; const b = Lo.blocks[Math.floor((s - 1) / 2)]; return (s - 1) % 2 === 0 ? b.attnY : b.mlpY; }
// the tower camera at time t (also used to place splats where the camera was on their beat)
function towerCam(it, t, cam) {
  const d = it.d, Lo = it.Lo, THREE = it.THREE, L2 = Lo.L * 2 + 1;
  const fi = stepped(t, it.Ti, 0.6), fb = stepped(t, it.Tb, 0.6);
  const back = fb >= 0;
  // stage position of the "wavefront": forward goes 0 -> 2L+1, backprop goes 2L+1 -> 0
  const wave = back ? L2 - fb : Math.max(fi, -0.6);
  // flies down the tower with the wavefront (and back up for backprop), 3/4 view, orbiting a little
  const c = d.cam || {}, life = it.life(t);
  const yW = lerp(stageY(Lo, Math.floor(clamp(wave, 0, L2))), stageY(Lo, Math.ceil(clamp(wave, 0, L2))), wave - Math.floor(wave));
  // after "wideAt" the camera pulls back over the whole tower
  const wide = d.wideAt !== undefined ? E.ioCub(pr(t, HP.T(d.wideAt), c.wideDur ?? 0.9)) : 0;
  const yaw = ((c.yaw ?? 34) + (c.orbit ?? 26) * Math.sin(life * Math.PI * 0.9) + wide * (c.wideYaw ?? 18)) * Math.PI / 180, pitch = lerp(c.pitch ?? 18, c.widePitch ?? 12, wide) * Math.PI / 180;
  const dist = lerp(c.dist ?? 17, c.wideDist ?? (Math.abs(Lo.Y.out) * 0.95 + 6), wide);
  // the camera swings to the sub-block that is firing: right for attention (the heads), left for the MLP
  const sideOf = s => s <= 0 || s > Lo.L * 2 ? 0 : ((s - 1) % 2 === 0 ? (c.attnX ?? 2.2) : (c.mlpX ?? -2.6));
  const wv = clamp(wave, 0, L2), w0 = Math.floor(wv), w1 = Math.min(L2, w0 + 1), side = lerp(sideOf(w0), sideOf(w1), E.ioSine(wv - w0));
  const tgt = new THREE.Vector3(lerp((c.tx ?? 0) + side, -0.2, wide), lerp(yW - (c.lead ?? 1.2), Lo.Y.out / 2, wide), 0);
  let kick = 0; for (const x of [...it.Ti, ...it.Tb]) { if (t < x - HP.EPS) continue; const u = pr(t, x, 0.3); if (u < 1) kick = Math.max(kick, 1 - E.oCub(u)); }
  cam.fov = (c.fov ?? 42) * (1 - 0.04 * kick); cam.updateProjectionMatrix();
  cam.position.set(tgt.x + dist * Math.cos(pitch) * Math.sin(yaw), tgt.y + dist * Math.sin(pitch) + 2.2 * (1 - wide), tgt.z + dist * Math.cos(pitch) * Math.cos(yaw));
  cam.up.set(Math.sin((c.roll ?? -4) * Math.PI / 180), 1, 0); cam.lookAt(tgt);
  cam.updateMatrixWorld();
  return { fi, fb, back, wave, wide };
}
function drawTower(it, t) {
  if (it.noGL || !it.R) return;
  const d = it.d, Lo = it.Lo, THREE = it.THREE, L2 = Lo.L * 2 + 1;
  const { fi, fb, back, wave, wide } = towerCam(it, t, it.cam3);
  const cam = it.cam3;
  // ---- river: stripes flow down (forward) or up, orange during backprop
  it.stripe.offset.y = (back ? -1 : 1) * t * 0.9;
  it.river.material.color.set(back ? new THREE.Color(0xffffff).lerp(new THREE.Color(C.orange), 0.55) : new THREE.Color(0xffffff));
  // particles: vectors swimming with the flow
  const m4 = new THREE.Matrix4(), span = it.top - it.bot;
  it.partSeed.forEach((p, k) => {
    let u = (p.ph + (back ? -1 : 1) * t * p.sp * 0.35) % 1; if (u < 0) u += 1;
    const y = it.top - u * span; m4.makeTranslation(p.x, y, p.z); it.parts.setMatrixAt(k, m4);
  });
  it.parts.instanceMatrix.needsUpdate = true;
  it.parts.material.color.set(back ? new THREE.Color(C.orange) : new THREE.Color(C.cream));
  // ---- token embedding cells: lit at stage 0
  const lit0 = clamp(fi + 0.999);
  fillCells(it.tokTex, Lo.T, 12, (i, j) => { const v = HP.rand(it.id, 'emb', i, j); const base = RGB(v > 0.5 ? C.teal : C.pink); const k = 0.25 + 0.75 * lit0 * (0.4 + 0.6 * v); return [base[0] * k, base[1] * k, base[2] * k, 255]; }, lit0.toFixed(3));
  // ---- blocks
  const headSpread = (l) => { // heads fan out when the block's attention fires (and stay fanned), close on backprop
    const s = 1 + 2 * l, u = fi >= s - 0.5 ? E.oBack(clamp((fi - (s - 0.5)) / 0.5), 1.6) : 0;
    return u;
  };
  // which head is flickering: cycles on 8ths while the block is active
  it.blk.forEach((o, l) => {
    const sA = 1 + 2 * l, sM = 2 + 2 * l;
    const onA = back ? 1 : clamp(fi - sA + 1), onM = back ? 1 : clamp(fi - sM + 1);
    const hotA = Math.max(0, 1 - Math.abs(wave - sA) * 1.4), hotM = Math.max(0, 1 - Math.abs(wave - sM) * 1.4);
    // backprop: a block flashes orange as the gradient wave passes it, then shows its updated weights
    const gA = back ? hotA : 0, gM = back ? hotM : 0, updA = back && wave < sA ? 1 : 0, updM = back && wave < sM ? 1 : 0;
    const spread = headSpread(l);
    const fan = (d.fan ?? 26) * spread;
    const cur = Math.floor(Math.max(0, (t - (it.Ti[sA] ?? 0)) / EIGHTH)) % Lo.H;
    o.heads.forEach((hd, h) => {
      hd.g.rotation.z = ((Lo.H - 1 - h) * fan / (Lo.H - 1) * 1.6 - 8 * spread) * Math.PI / 180;
      hd.g.position.z = -h * (0.28 + 0.3 * spread);
      const col = RGB([C.pink, C.blue, C.teal, C.yellow][h % 4]), act = onA * (h === cur && hotA > 0.05 ? 1 : 0.55), gcol = RGB(C.orange);
      fillCells(hd.tex, 8, 8, (i, j) => {
        if (i > j) return [30, 28, 40, 140];       // causal mask (upper triangle dark)
        const w = HP.rand(it.id, 'att', l, h, i, j, updA ? 'u' : '', Math.floor(t / EIGHTH) % 4);
        const k = 0.18 + 0.82 * act * w;
        return [lerp(col[0], gcol[0], gA) * k, lerp(col[1], gcol[1], gA) * k, lerp(col[2], gcol[2], gA) * k, 230];
      }, [act.toFixed(3), gA.toFixed(3), updA, Math.floor(t / EIGHTH) % 4].join('|'));
      hd.edges.material.opacity = 0.35 + 0.65 * (h === cur ? hotA : 0) + 0.2 * onA;
    });
    const B0 = RGB(C.blue), T0 = RGB(C.teal), O0 = RGB(C.orange), R0 = RGB(C.red);
    fillCells(o.mlpTex, 16, 6, (i, j) => {
      const v = HP.rand(it.id, 'mlp', l, i, j, updM ? 'u' : ''), isAct = j === 2 || j === 3;
      const k = isAct ? 0.15 + 0.85 * onM * v : 0.25 + 0.5 * v * (0.4 + 0.6 * onM) + 0.25 * updM * HP.rand(it.id, 'sp', l, i, j, Math.floor(t * 15));
      const a = isAct ? T0 : B0, b = isAct ? R0 : O0;
      return [lerp(a[0], b[0], gM) * k, lerp(a[1], b[1], gM) * k, lerp(a[2], b[2], gM) * k, 235];
    }, [onM.toFixed(3), gM.toFixed(3), updM, updM ? Math.floor(t * 15) : 0].join('|'));
    o.attnOut.material.opacity = 0.12 + 0.3 * onA; o.attnOut.material.color.set(new THREE.Color(C.blue).lerp(new THREE.Color(C.orange), gA));
    // skip arcs: the pulse rides the arc as the wavefront passes the sub-block
    for (const [sk, s] of [[o.skipA, sA], [o.skipM, sM]]) {
      const u = back ? clamp(s + 0.5 - wave) : clamp(wave - (s - 0.5));
      sk.tube.material.opacity = 0.25 + 0.5 * (u > 0 && u < 1 ? 1 : u >= 1 ? 0.5 : 0);
      sk.tube.material.color.set(new THREE.Color(back && u > 0 && u < 1 ? C.orange : C.cream));
      const p = sk.crv.getPoint(back ? 1 - E.ioSine(u) : E.ioSine(u)); sk.head.position.copy(p);
      sk.head.material.opacity = u > 0.02 && u < 0.98 ? 1 : 0; sk.head.material.color.set(new THREE.Color(back ? C.orange : C.yellow));
    }
    const hot = Math.max(hotA, hotM);
    o.glow.material.opacity = 0.75 * hot; o.glow.material.color.set(new THREE.Color(back ? C.orange : C.yellow));
  });
  // output logits: lit at the last stage; the prediction tag
  const onO = back ? 1 : clamp((t - (it.Ti[L2] ?? 1e9)) / 0.3);
  fillCells(it.outTex, 12, 1, (i) => { const v = i === 4 ? 1 : HP.rand(it.id, 'logit', i) * 0.45; const cc = RGB(i === 4 ? C.pink : C.cream); const k = 0.15 + 0.85 * onO * v; return [cc[0] * k, cc[1] * k, cc[2] * k, 255]; }, onO.toFixed(3));
  { const m = new THREE.Matrix4(), u = E.oBack(clamp(onO * 1.0), 1.4);
    for (let i = 0; i < 12; i++) { const h = Math.max(0.001, it.barP[i] * 3.2 * u); m.makeScale(1, h, 1); m.setPosition((i - 5.5) * 0.43, Lo.Y.out + 0.25 + h / 2, 0); it.bars.setMatrixAt(i, m); }
    it.bars.instanceMatrix.needsUpdate = true; if (it.bars.instanceColor) it.bars.instanceColor.needsUpdate = true; }
  it.R.render(it.scene, cam);
  // ---- 2D: splats behind, pencil outlines + tags in front (projected)
  const prj = (x, y, z) => { const v = new THREE.Vector3(x, y, z).project(cam); return { x: (v.x + 1) / 2 * HP.W, y: (1 - v.y) / 2 * HP.H, ok: v.z < 1 }; };
  const bk = it.back.ctx; bk.setTransform(1, 0, 0, 1, 0, 0); bk.clearRect(0, 0, HP.W, HP.H);
  for (const x of it.splats) {
    const isB = it.Tb.includes(x), s = isB ? L2 - it.Tb.indexOf(x) : it.Ti.indexOf(x);
    if (!it.camS) it.camS = new THREE.PerspectiveCamera(42, HP.W / HP.H, 0.1, 200);
    towerCam(it, x, it.camS);
    const v = new THREE.Vector3(-(Lo.wR / 2 + 6), stageY(Lo, clamp(s, 0, L2)) - 1.5, -1).project(it.camS);
    if (v.z >= 1) continue;
    const sx = Math.round(clamp((v.x + 1) / 2 * HP.W, 90, 990)), sy = Math.round(clamp((1 - v.y) / 2 * HP.H, 300, 1600));
    KIT().splat(bk, { x: sx, y: sy, key: `${it.id}:sp${x.toFixed(3)}@${sx},${sy}`, r: d.splatR ?? 95, dir: Math.PI * 0.8, color: isB ? C.orange : C.pink, sats: 40, drips: 2 }, t - x);
  }
  const fr = it.front.ctx; fr.setTransform(1, 0, 0, 1, 0, 0); fr.clearRect(0, 0, HP.W, HP.H);
  const boil = HP.boil(t) % 3, rc = HP.lib.rough.canvas(it.front.cv, it.id + ':' + boil);
  const pen = { stroke: rgba(C.cream, 0.85), strokeWidth: 2.6, roughness: 1.2, bowing: 0.8, maxRandomnessOffset: 2 };
  const boxLines = (mesh, alpha) => {   // the 12 edges of a box mesh, projected and penciled
    const g = mesh.geometry.parameters, hw = g.width / 2, hh = g.height / 2, hd = g.depth / 2, P = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) { const v = new THREE.Vector3(sx * hw, sy * hh, sz * hd); mesh.localToWorld(v); P.push(prj(v.x, v.y, v.z)); }
    if (P.some(p => !p.ok)) return;
    const E2 = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    for (const [a, b] of E2) rc.line(P[a].x, P[a].y, P[b].x, P[b].y, { ...pen, stroke: rgba(C.cream, alpha) });
  };
  it.scene.updateMatrixWorld();
  it.blk.forEach((o, l) => { boxLines(o.mlp, 0.75); boxLines(o.attnOut, 0.5); for (const hd of o.heads) boxLines(hd.slab, 0.35); });
  boxLines(it.emb, 0.8);
  // tags
  // tags follow the 3D but fade out near the edges of the Reels/TikTok safe zone (x 60-1014, y 250-1574, right rail)
  const place = (node, q, op) => {
    if (!q.ok) { node.style.opacity = 0; return; }
    const inY = Math.min(clamp((q.y - 270) / 60), clamp((1554 - q.y) / 60)), inX = Math.min(clamp((q.x - 140) / 60), clamp(((q.y > 960 ? 850 : 934) - q.x) / 60));
    node.style.left = q.x.toFixed(1) + 'px'; node.style.top = q.y.toFixed(1) + 'px'; node.style.opacity = (op * Math.min(inX, inY)).toFixed(3);
  };
  const lo = clamp((t - it.t0) / 0.2) * (d.labels === false ? 0 : 1) * (1 - wide);
  it.tokTags.forEach((n, i) => place(n, prj((i - (Lo.T - 1) / 2) * Lo.cell, Lo.Y.embed + 0.9, 1.6), lo));
  it.blkTags.forEach((tg, l) => {
    const b = Lo.blocks[l];
    { const q = prj(Lo.wR / 2 + 1.6, b.attnY + 1.5, 0); q.x = Math.min(q.x, 860); place(tg.attn, q, lo * (fi >= 2 * l + 0.5 || back ? 1 : 0.0)); }
    place(tg.mlp, prj(-(Lo.wR / 2 + 2.8), b.mlpY + 1.15, 1.0), lo * (fi >= 2 * l + 1.5 || back ? 1 : 0.0));
    place(tg.res, prj(0, b.attnY + 2.4, 0.3), l === 0 ? clamp((t - it.t0) / 0.2) : 0);
    tg.attn.style.background = back ? C.orange : C.cream; tg.mlp.style.background = back ? C.orange : C.cream;
  });
  const Tout = it.Ti[L2];
  if (Tout !== undefined && t >= Tout - HP.EPS && !back) { const u = pr(t, Tout, 0.2); place(it.predTag, prj((4 - 5.5) * 0.43, Lo.Y.out + 3.9, 0.2), 1); it.predTag.style.transform = `translate(-50%, -50%) scale(${lerp(1.7, 1, E.oBack(u, 2)).toFixed(3)})`; }
  else it.predTag.style.opacity = 0;
}

// ============================================================ the item
HP.register('net', {
  build(it) {
    it.el.style.isolation = 'isolate';
    const k = it.d.kind || 'mlp';
    it.kind = k;
    if (it.d.ground && it.d.ground !== 'none') el('div', '', it.el, { position: 'absolute', inset: 0, background: it.d.ground === 'cream' ? C.cream : NIGHT });
    if (k === 'mlp') buildMlpItem(it);
    else if (k === 'attention') buildAttn(it);
    else if (k === 'tower') buildTower(it);
    else HP.WARN.push(`net ${it.id}: unknown kind "${k}"`);
  },
  async load(it) { if (it.kind === 'tower') await loadTower(it); },
  draw(it, t) {
    if (it.kind === 'mlp') drawMlp(it, t);
    else if (it.kind === 'attention') drawAttn(it, t);
    else if (it.kind === 'tower') drawTower(it, t);
  },
  texts(it) {
    if (it.kind === 'attention') return [{ text: (it.tokens || []).join(' '), reveal: 'words', role: 'main' }];
    return [];
  },
});
HP.lib.netviz = { buildMLP, digitBitmap, camera, stepped, pcircle, pline, THREE: null };
})();
