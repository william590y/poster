/* fx/singularity.js  [BUILDER D]  the self-improvement loop -> the singularity (black hole) -> the burst
 * =================================================================================================================
 * BUILD.md REVISION 2 ("William's later ideas"): "a ring of nodes with a glowing pulse circling, each lap faster than the last ...
 * Lock the laps to the music: 2 bars, 1 bar, 2 beats, 1 beat, 8ths. Then the loop COLLAPSES INTO A BLACK HOLE (the singularity):
 * an accretion-disk swirl, the frame warped around it (lensing), and everything on screen (shapes, screenshots, vectors)
 * spiralling in ... the logo bursts back out of the black hole and reassembles into the cover."
 * Source of the loop: William's deck, theory_slides.explosionSlide (nodes "AI does AI research", "Better AI", "Faster research",
 * "Even better AI"; centre "each lap faster"), the Splash slide's title "AI that builds better AI", the I. J. Good (1965) quote,
 * and tools/make_loop_gif.py (dashed ring, clockwise arrows, a comet whose tail grows with its speed, nodes glowing as it passes).
 *
 * TYPES (edl/README.md, "Builder D"):
 *   loop       the loop: {c, r, nodes, build, laps, title, center, quote, collapse, palette...}
 *   blackhole  the singularity: {c, r: [[time, px], ...], disk, lens, darken, swallow, collapse, linger, burst}
 * The black hole's hole, disk and photon ring are drawn on a canvas ABOVE #cam (unlensed); the lensing is an SVG displacement
 * map on #cam (feDisplacementMap; ~200 ms a frame while it is on, so it is on only while the hole is open); DOM items spiral in
 * through transforms composed onto their layers in a 'post' hook; kand pieces through builder A's kandinsky hook (xf).
 * EXPORTS HP.lib.singularity = {lapPlan, spiral, holeAt(t), items}
 */
(function () {
'use strict';
const { clamp, lerp, pr, smooth, el, sv } = HP.u, E = HP.ease;
const W = HP.W, H = HP.H, EPS = HP.EPS, COL = HP.COL, D2R = Math.PI / 180, TAU = 2 * Math.PI;
const BP = () => HP.hits.period || 0.4839;
const PL = () => HP.lib.paint;
const NIGHT = '#0E0D12', CREAM = '#F2EBDD', INK = '#15131F';
const colOf = c => c === 'cream' ? CREAM : c === 'night' ? NIGHT : (COL[c] || c);
function ST(v, d = NaN) { if (v === undefined || v === null) return d; try { const x = HP.T(v); return isFinite(x) ? x : d; } catch (e) { return d; } }

// ============================================================ beat-locked laps
// laps: [[beats per lap, count], ...] from a start beat; -> [{b0, len}] in beats, plus each node pass {t, node, lap}
function lapPlan(from, laps, nodes = 4) {
  const L = []; let b = from;
  for (const [len, n] of laps) for (let k = 0; k < (n || 1); k++) { L.push({ b0: b, len }); b += len; }
  const passes = [];
  L.forEach((l, k) => { for (let j = 0; j < nodes; j++) { const bb = l.b0 + l.len * j / nodes; let t; try { t = HP.beat(bb); } catch (e) { continue; } passes.push({ t, node: j, lap: k, b: bb, len: l.len }); } });
  return { laps: L, passes, end: b };
}
// pulse angle (radians, 0 = top, clockwise) at beat position b: node to node, eased when a segment is a beat or longer (it lands
// ON the node, on the beat), linear when faster; null before the first lap; after the last lap it keeps the last speed
function lapAngle(plan, b) {
  const L = plan.laps; if (!L.length || b < L[0].b0) return null;
  let k = L.findIndex(l => b < l.b0 + l.len);
  if (k < 0) { const l = L[L.length - 1]; const extra = (b - (l.b0 + l.len)) / l.len; return { a: TAU * (L.length + extra), k: L.length - 1 + Math.floor(extra), len: l.len }; }
  const l = L[k], f = (b - l.b0) / l.len, seg = l.len / 4, j = Math.floor(f * 4), g = f * 4 - j;
  const e = seg >= .99 ? E.ioSine(g) * .85 + g * .15 : g;
  return { a: TAU * (k + (j + e) / 4), k, len: l.len };
}

// ============================================================ the spiral-in (shared by DOM layers, kand pieces and the loop)
// p: a point (frame px) of the thing falling in, Hc: the hole, v: 0..1 progress -> {M: DOMMatrix (frame px), op}
function spiral(Hc, p, v, o = {}) {
  const w = (o.ease === 'quad' ? E.iQuad : E.iCub)(clamp(v)), s = Math.pow(1 - w, o.sPow ?? 1.25), th = (o.turns ?? 1.1) * 360 * Math.pow(w, 1.15) * (o.dir ?? 1);
  const phi = Math.atan2(p[1] - Hc[1], p[0] - Hc[0]) / D2R, k = (o.stretch ?? .9) * 4 * w * (1 - w);
  const M = new DOMMatrix().translate(Hc[0], Hc[1]).rotate(th).scale(Math.max(1e-4, s)).translate(-Hc[0], -Hc[1])
    .translate(p[0], p[1]).rotate(phi).scale(1 + k, 1 - k * .45).rotate(-phi).translate(-p[0], -p[1]);
  return { M, op: 1 - smooth(clamp((w - .8) / .2)), s, th, w };
}

// ============================================================ a tiny word roll-out, painted on the item's canvas
// (CSS-scaled DOM text re-rasters differently depending on the frames rendered before it, so the visible words are canvas
// text; the same words sit in the DOM, transparent and untransformed, so coverage.py can read them)
function rollText(parent, o) {
  const font = HP.text.font(o.font), size = o.font.size || 40, pad = o.chip ? [16, 10, 12] : [0, 0, 0];
  const text = o.upper ? String(o.text).toUpperCase() : String(o.text);
  const wr = HP.text.wrap(text, o.font, o.w - 2 * pad[0], { lh: size * (o.lh || 1.12), tracking: o.tracking || 0 });
  const box = el('div', '', parent, { position: 'absolute', left: o.x + 'px', top: o.y + 'px', width: o.w + 'px', font, color: 'transparent', lineHeight: (o.lh || 1.12), textAlign: o.align || 'left' });
  const spans = text.split(/\s+/).filter(Boolean).map((w, i, A) => { const sp = el('span', '', box); sp.textContent = w; if (i < A.length - 1) box.appendChild(document.createTextNode(' ')); return sp; });
  const W0 = o.chip ? Math.min(o.w, wr.width + 2 * pad[0]) : o.w, X0 = o.align === 'center' ? o.x + (o.w - W0) / 2 : o.x;
  const words = [];
  wr.lines.forEach(L => { const off = o.align === 'center' ? (W0 - 2 * pad[0] - L.w) / 2 : 0; for (const q of L.words) words.push({ w: q.w, x: X0 + pad[0] + off + q.x, y: o.y + pad[1] + L.y + size * .9, width: q.width }); });
  const times = o.times && o.times.length ? o.times : words.map((_, i) => o.at + i * (o.per ?? .06));
  const chipRect = [X0, o.y, W0, wr.height + pad[1] + pad[2]];
  return {
    box, spans, words, times, end: times[times.length - 1] ?? o.at, chipRect, text,
    // dom(t): reveal state of the DOM copy; draw(ctx, t, {alpha, flash}): the visible version in the current ctx transform
    dom(t, op = 1) { spans.forEach((sp, i) => { sp.style.visibility = t >= times[Math.min(i, times.length - 1)] - EPS ? 'visible' : 'hidden'; }); box.style.opacity = String(clamp(op)); },
    draw(ctx, t, q = {}) {
      const al = q.alpha ?? 1; if (al <= .003 || t < times[0] - EPS) return;
      ctx.save(); ctx.globalAlpha = al;
      if (o.chip) { const [x, y, w, h] = chipRect, u = E.oBack(pr(t, times[0] - .04, .16), 2);
        ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(u, u); ctx.translate(-(x + w / 2), -(y + h / 2));
        ctx.fillStyle = 'rgba(21,19,31,.85)'; ctx.fillRect(x, y + 6, w, h); ctx.fillStyle = q.flash ? COL.yellow : o.chip; ctx.fillRect(x, y, w, h); ctx.restore(); }
      ctx.font = font; ctx.fillStyle = o.color || INK; ctx.textBaseline = 'alphabetic';
      words.forEach((wd, i) => { const at = times[Math.min(i, times.length - 1)]; if (t < at - EPS) return; const u = pr(t, at, .14), k = u < 1 ? lerp(1.25, 1, E.oBack(u)) : 1, dy = u < 1 ? 14 * (1 - E.oCub(u)) : 0;
        ctx.globalAlpha = al * clamp(u * 3); const cx = wd.x + wd.width / 2, cy = wd.y - size * .3;
        ctx.save(); ctx.translate(cx, cy + dy); ctx.scale(k, k); ctx.fillText(wd.w, -wd.width / 2, size * .3); ctx.restore(); });
      ctx.restore();
    },
  };
}
function beatTimes(from, n, step) { const b0 = HP.beatAt(from), out = []; let x = Math.ceil(b0 / step - 1e-4) * step; for (let k = 0; k < n; k++, x += step) { let t; try { t = HP.beat(x); } catch (e) { t = (out[out.length - 1] ?? from) + step * BP(); } out.push(t); } return out; }

// ============================================================ hand-drawn icons (rough.js, boiling on twos), unit box [-1, 1]
function icon(rc, kind, x, y, s, col, key) {
  const o = { stroke: col, strokeWidth: Math.max(3, s * .1), roughness: 1.1, bowing: .8, fill: undefined };
  const P = (a, b) => [x + a * s, y + b * s];
  const L = (a, b, c, d) => rc.line(...P(a, b), ...P(c, d), o);
  switch (kind) {
    case 'robot': rc.rectangle(...P(-.7, -.45), 1.4 * s, 1.05 * s, o); rc.circle(...P(-.3, .02), .32 * s, o); rc.circle(...P(.3, .02), .32 * s, o); L(-.3, .38, .3, .38); L(0, -.45, 0, -.78); rc.circle(...P(0, -.86), .18 * s, o); L(-.7, 0, -.9, 0); L(.7, 0, .9, 0); break;
    case 'chip': rc.rectangle(...P(-.55, -.55), 1.1 * s, 1.1 * s, o); rc.rectangle(...P(-.25, -.25), .5 * s, .5 * s, o); for (const q of [-.32, 0, .32]) { L(q, -.55, q, -.85); L(q, .55, q, .85); L(-.55, q, -.85, q); L(.55, q, .85, q); } break;
    case 'bolt': rc.polygon([P(.18, -.92), P(-.48, .12), P(-.04, .12), P(-.22, .92), P(.48, -.16), P(.04, -.16)], o); break;
    case 'redo': { const pts = []; for (let i = 0; i <= 20; i++) { const a = (-50 + i * 280 / 20) * D2R; pts.push(P(Math.cos(a) * .62, Math.sin(a) * .62)); } rc.curve(pts, o); const e = pts[pts.length - 1], a = (230) * D2R; rc.line(e[0], e[1], e[0] + Math.cos(a - .9) * .4 * s, e[1] + Math.sin(a - .9) * .4 * s, o); rc.line(e[0], e[1], e[0] + Math.cos(a + .5) * .4 * s, e[1] + Math.sin(a + .5) * .4 * s, o); break; }
    case 'gauge': { const pts = []; for (let i = 0; i <= 16; i++) { const a = (150 + i * 240 / 16) * D2R; pts.push(P(Math.cos(a), Math.sin(a))); } rc.curve(pts, o); for (let i = 0; i <= 6; i++) { const a = (150 + i * 40) * D2R; L(Math.cos(a) * .78, Math.sin(a) * .78, Math.cos(a) * .98, Math.sin(a) * .98); } break; }
  }
}

// ============================================================ LOOP
// {t0, t1, c [540, 861], r (300), nodeR (78), nodes [{label, icon, color}] (the deck's four), build: time (ring painted on over a
//  beat, nodes pop on the following 8ths), laps {from, plan: [[beats, count], ...]} (default [[8,1],[4,2],[2,2],[1,4],[.5,8]] =
//  2 bars, 1 bar x2, 2 beats x2, 1 beat x4, 8ths x8 = 28 beats), title {text, y, at}, center {text, at}, quote {text, cite, y,
//  at}, collapse {at, dur, turns} (the ring spirals into c), ring colour, comet colours, labelChip (paper colour)}
const DECK_NODES = [
  { label: 'AI does AI research', icon: 'robot', color: 'pink' }, { label: 'Better AI', icon: 'chip', color: 'blue' },
  { label: 'Faster research', icon: 'bolt', color: 'orange' }, { label: 'Even better AI', icon: 'redo', color: 'teal' }];
HP.register('loop', {
  ownMotion: true,
  build(it) {
    const d = it.d;
    it.c = d.c || [540, 861]; it.r = d.r ?? 300; it.nr = d.nodeR ?? 78;
    it.nodes = (d.nodes || DECK_NODES).map((n, j) => ({ ...DECK_NODES[j % 4], ...n }));
    it.buildAt = ST(d.build, it.t0);
    it.nodeAt = beatTimes(it.buildAt + .01, it.nodes.length, .5).map((x, j) => d.nodeTimes ? ST(d.nodeTimes[j]) : x);
    it.nodeAt.forEach(x => it.mark(x, 'node'));
    const lp = d.laps || {};
    it.plan = lapPlan(HP.beatAt(ST(lp.from, it.buildAt)), lp.plan || [[8, 1], [4, 2], [2, 2], [1, 4], [.5, 8]], it.nodes.length);
    it.plan.passes.forEach(p => { if (p.len >= .99 || p.node === 0) it.mark(p.t, p.node === 0 ? 'lap' : 'pass'); });
    it.collapse = d.collapse ? { at: ST(d.collapse.at), dur: d.collapse.dur ?? 1.5 * BP(), turns: d.collapse.turns ?? 1.4 } : null;
    it.cv = it.canvas();
    // DOM text: labels on paper chips next to their nodes, title, centre line, quote (all rolled out word by word)
    it.text = [];
    const lab = { family: "'Newsreader', serif", weight: 600, size: d.labelPx ?? 44 };
    it.labels = it.nodes.map((n, j) => {
      const a = -Math.PI / 2 + j * TAU / it.nodes.length, nx = it.c[0] + it.r * Math.cos(a), ny = it.c[1] + it.r * Math.sin(a);
      const wr = HP.text.wrap(n.label, lab, 300, { balance: true }), w = Math.ceil(wr.width) + 34, h = wr.lines.length * lab.size * 1.12 + 22;
      let x, y; const side = Math.round(Math.cos(a) * 2) / 2, vert = Math.round(Math.sin(a));
      // fixer r1: a node's label may sit on a chosen side (labelSide: [per node] 'left' | 'right' | 'above' | 'below' | null = auto),
      // e.g. beside the bottom node instead of under the ring, where the facts below need the room
      const ls = (d.labelSide || [])[j] || n.labelSide;
      if (ls === 'left' || ls === 'right') { x = ls === 'left' ? Math.max(66, nx - it.nr - 22 - w) : Math.min(1014 - w, nx + it.nr + 22); y = ny - h / 2; }
      else if (ls === 'above') { x = nx - w / 2; y = ny - it.nr - 26 - h; }
      else if (ls === 'below') { x = nx - w / 2; y = ny + it.nr + 26; }
      else if (vert < 0) { x = nx - w / 2; y = ny - it.nr - 26 - h; } else if (vert > 0) { x = nx - w / 2; y = ny + it.nr + 26; }
      else if (side > 0) { x = Math.min(1014 - w, nx - w / 2 + 40); y = ny - it.nr - 26 - h; } else { x = Math.max(66, nx - w / 2 - 40); y = ny + it.nr + 26; }
      const R = rollText(it.el, { text: n.label, x, y, w, font: lab, color: INK, chip: d.labelChip ?? '#FBF7EE', align: 'center', times: beatTimes(it.nodeAt[j] + .01, HP.text.words(n.label).length, .25) });
      R.node = [nx, ny]; it.text.push({ text: n.label, reveal: 'words', role: 'main' }); return R;
    });
    if (d.title !== false) { const T0 = typeof d.title === 'object' ? d.title : { text: d.title }; it.title = rollText(it.el, { text: T0.text || 'AI that builds better AI', x: 60, y: T0.y ?? 250, w: 960, align: 'center', font: { family: "'Newsreader', serif", weight: 600, style: 'italic', size: T0.px ?? 88 }, color: T0.color || INK, times: beatTimes(ST(T0.at, it.t0) + .01, 5, .5) }); it.text.push({ text: it.title.text, reveal: 'words', role: 'main' }); }
    if (d.center !== false) { const C0 = typeof d.center === 'object' ? d.center : { text: d.center }; it.center = rollText(it.el, { text: C0.text || 'each lap faster', x: it.c[0] - 200, y: it.c[1] + 30, w: 400, align: 'center', font: { family: "'IBM Plex Mono', monospace", weight: 600, size: C0.px ?? 38 }, upper: true, color: C0.color || INK, times: beatTimes(ST(C0.at, it.nodeAt[it.nodeAt.length - 1]) + .01, 3, .5) }); it.text.push({ text: 'each lap faster', reveal: 'words', role: 'main' }); }
    if (d.quote) {
      const Q = d.quote, qa = ST(Q.at, it.t0 + 4 * BP()), n = HP.text.words(Q.text).length;
      it.quote = rollText(it.el, { text: Q.text, x: Q.x ?? 70, y: Q.y ?? 1440, w: Q.w ?? 940, font: { family: "'Newsreader', serif", weight: 500, style: 'italic', size: Q.px ?? 46 }, color: Q.color || INK, times: beatTimes(qa + .01, n, Q.step ?? .5) });
      it.cite = rollText(it.el, { text: Q.cite || '— I. J. Good, 1965', x: 70, y: (Q.y ?? 1440) + (Q.citeDy ?? 190), w: 940, font: { family: "'IBM Plex Mono', monospace", weight: 600, size: 32 }, upper: true, color: COL.red, times: beatTimes(it.quote.end + .02, 4, .5) });
      it.text.push({ text: Q.text, reveal: 'words', role: 'main' }, { text: Q.cite || '— I. J. Good, 1965', reveal: 'words', role: 'meta' });
    }
    HP.lib.singularity.items.push(it);
  },
  async load(it) {
    // the painted ring (one bristle stroke round the circle, clockwise from the top) and the node discs, baked
    const P = PL(), pts = []; for (let i = 0; i <= 64; i++) { const a = -Math.PI / 2 + i / 64 * TAU; pts.push([it.c[0] + Math.cos(a) * it.r, it.c[1] + Math.sin(a) * it.r]); }
    it.ring = P.makeStroke(pts, { width: it.d.ringW ?? 30, color: it.d.ring || 'pink', seed: it.id + '|ring', dry: .25, gaps: .3, wet: .4, pressure: [.9, 1, .9], thinning: .15 });
  },
  draw(it, t) { drawLoop(it, t); },
  texts(it) { return it.text; },
});
function nodePose(it, j, t) {
  const n = it.nodes.length, a0 = -Math.PI / 2 + j * TAU / n;
  let r = it.r, a = a0, s = 1;
  const pop = it.nodeAt[j], ps = t < pop - EPS ? 0 : E.oBack(pr(t, pop, .22), 2.2);
  s *= ps;
  if (it.collapse) { const u = pr(t, it.collapse.at + j * .03, it.collapse.dur), w = E.iCub(u); r *= Math.pow(1 - w, 1.2); a += it.collapse.turns * TAU * Math.pow(w, 1.3); s *= 1 - w; }
  return { x: it.c[0] + Math.cos(a) * r, y: it.c[1] + Math.sin(a) * r, s, a };
}
function drawLoop(it, t) {
  const ctx = it.cv.ctx, d = it.d, P = PL(), c = it.c;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H); ctx.globalAlpha = 1;
  const cu = it.collapse ? E.iCub(pr(t, it.collapse.at, it.collapse.dur)) : 0;
  const rr = it.r * Math.pow(1 - cu, 1.2), spin = it.collapse ? it.collapse.turns * 360 * Math.pow(cu, 1.3) : 0;
  const b = HP.beatAt(t), st = lapAngle(it.plan, b), speed = st ? 1 / st.len : 0;   // laps per beat
  // the ring: painted on over the first beat, then it swirls in as a whole while collapsing
  const ringP = E.ioCub(pr(t, it.buildAt, d.ringDur ?? BP()));
  if (ringP > 0 && cu < 1) {
    ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(spin * D2R); ctx.scale(Math.max(1e-3, 1 - cu), Math.max(1e-3, 1 - cu)); ctx.translate(-c[0], -c[1]);
    P.strokeAt(ctx, it.ring, ringP, it.id + '|ring', { alpha: 1 });
    // clockwise chevrons between the nodes (pencil, boiling on twos)
    if (ringP >= 1) {
      const rc = HP.lib.rough.canvas(it.cv.cv, it.id + '|chev|' + HP.boil(t)), n = it.nodes.length;
      for (let j = 0; j < n; j++) { const a = -Math.PI / 2 + (j + .5) * TAU / n, x = c[0] + Math.cos(a) * it.r, y = c[1] + Math.sin(a) * it.r, ta = a + Math.PI / 2, s = 26;
        rc.linearPath([[x - Math.cos(ta - .6) * s, y - Math.sin(ta - .6) * s], [x, y], [x - Math.cos(ta + .6) * s, y - Math.sin(ta + .6) * s]], { stroke: INK, strokeWidth: 6, roughness: 1, bowing: .5 }); }
    }
    ctx.restore();
  }
  // the comet: head on the ring, a tail that grows with the speed; glow; when it laps in 8ths the whole ring burns
  if (st && cu < .98) {
    const a = st.a + spin * D2R - Math.PI / 2, tail = Math.min(5.6, (d.tailBase ?? .6) + (d.tailK ?? 1.1) * Math.pow(speed, .85)), N = 56, cols = [COL.orange, COL.red];   // fixer r1: tailBase/tailK (a third of the ring at the slowest lap)
    const cw = it.d.cometW ?? 34;
    ctx.save(); ctx.lineCap = 'round';
    for (let k = N - 1; k >= 0; k--) {   // the tail: ink edge, red -> orange body, a white-hot core line
      const f = k / N, a1 = a - tail * f, a2 = a - tail * (f + 1 / N), w = cw * (1 - f) + 4, al = Math.pow(1 - f, 1.2);
      ctx.beginPath(); ctx.arc(c[0], c[1], rr, a2, a1 + .002);
      ctx.strokeStyle = INK; ctx.globalAlpha = al * .55; ctx.lineWidth = w + 7; ctx.stroke();
      ctx.strokeStyle = P.mix(cols[0], cols[1], f); ctx.globalAlpha = al; ctx.lineWidth = w; ctx.stroke();
      ctx.strokeStyle = '#FFF4DE'; ctx.globalAlpha = al * .9; ctx.lineWidth = Math.max(2, w * .28); ctx.stroke();
    }
    const hx = c[0] + Math.cos(a) * rr, hy = c[1] + Math.sin(a) * rr, gr = 120 + 40 * Math.min(1, speed / 2), g = ctx.createRadialGradient(hx, hy, 0, hx, hy, gr);
    g.addColorStop(0, 'rgba(255,252,240,1)'); g.addColorStop(.14, 'rgba(255,224,130,1)'); g.addColorStop(.32, 'rgba(255,74,28,.55)'); g.addColorStop(1, 'rgba(255,74,28,0)');
    ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(hx - gr, hy - gr, 2 * gr, 2 * gr);
    ctx.fillStyle = '#FFFDF6'; ctx.beginPath(); ctx.arc(hx, hy, 13, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // fixer r1 (lapShock): every lap (the comet passing the top node) sends a shock ring out from the loop and a tick mark flashes
  // on the ring, so each faster lap is counted by the eye, not only by the gauge
  if (d.lapShock && cu < .9) {
    const laps = it.plan.passes.filter(p => p.node === 0 && p.t <= t + EPS);
    laps.slice(-3).forEach(p => {
      const u = (t - p.t) / (d.lapShockDur ?? .38); if (u < 0 || u >= 1) return;
      const k = laps.indexOf(p) + 1, R = rr * (1 + .55 * E.oCub(u)), al = Math.pow(1 - u, 1.4);
      ctx.save(); ctx.lineCap = 'round';
      ctx.strokeStyle = INK; ctx.globalAlpha = al * .5; ctx.lineWidth = 14 * (1 - u) + 3; ctx.beginPath(); ctx.arc(c[0], c[1], R, 0, TAU); ctx.stroke();
      ctx.strokeStyle = P.mix(COL.orange, COL.yellow, Math.min(1, k / 10)); ctx.globalAlpha = al; ctx.lineWidth = 9 * (1 - u) + 2; ctx.beginPath(); ctx.arc(c[0], c[1], R, 0, TAU); ctx.stroke();
      const ty = c[1] - rr; ctx.strokeStyle = INK; ctx.globalAlpha = Math.min(1, al * 1.5); ctx.lineWidth = 8;   // the tick at the top
      ctx.beginPath(); ctx.moveTo(c[0], ty - 34 - 30 * E.oCub(u)); ctx.lineTo(c[0], ty - 70 - 30 * E.oCub(u)); ctx.stroke();
      ctx.restore();
    });
  }
  // nodes: painted discs (baked), a hand-drawn icon, a bump + ring burst + label flash when the comet passes
  const rc = HP.lib.rough.canvas(it.cv.cv, it.id + '|icon|' + HP.boil(t));
  it.nodes.forEach((n, j) => {
    const q = nodePose(it, j, t); if (q.s <= .01) { it.labels[j].dom(t, 0); return; }
    let last = -1e9; for (const p of it.plan.passes) { if (p.node !== j) continue; if (p.t <= t + EPS) last = p.t; else break; }
    const dt = t - last, fl = dt >= 0 && dt < .5 ? Math.exp(-dt / .09) : 0;
    const R = it.nr * q.s * (1 + .2 * fl), col = colOf(n.color);
    ctx.save(); ctx.translate(q.x, q.y);
    ctx.drawImage(discTex(col), -R, -R, 2 * R, 2 * R);
    ctx.restore();
    if (fl > .02) { ctx.save(); ctx.strokeStyle = COL.orange; ctx.globalAlpha = fl; ctx.lineWidth = 8 * fl + 2; ctx.beginPath(); ctx.arc(q.x, q.y, R + 14 + 70 * (1 - fl), 0, TAU); ctx.stroke(); ctx.restore(); }
    if (q.s > .3) icon(rc, n.icon, q.x, q.y, R * .5, n.color === 'yellow' ? INK : CREAM, it.id + j);
    // the label follows its node (collapse) and flashes
    const L = it.labels[j], la = cu > 0 ? clamp(1 - cu * 1.4) : 1;
    L.dom(t, la);
    ctx.save(); ctx.translate(q.x, q.y); const ks = Math.min(1, q.s) * (1 + .08 * fl); ctx.scale(ks, ks); ctx.translate(-L.node[0], -L.node[1]);
    L.draw(ctx, t, { alpha: la, flash: fl > .25 }); ctx.restore();
  });
  // centre: a hand-drawn gauge whose needle steps up a notch every lap, and "each lap faster"
  if (it.center) {
    const k = st ? Math.min(st.k, 8) : -1, ns = it.nodeAt[it.nodeAt.length - 1], gp = E.oBack(pr(t, ns, .3)) * (1 - cu);
    if (gp > .01) {
      const gx = c[0], gy = c[1] - 40, gs = 70 * gp;
      ctx.save(); ctx.translate(gx, gy); ctx.rotate(spin * D2R); ctx.translate(-gx, -gy);
      icon(rc, 'gauge', gx, gy, gs, INK, it.id + 'g');
      const lastLap = it.plan.passes.filter(p => p.node === 0 && p.t <= t + EPS).pop(), kick = lastLap ? E.oBack(pr(t, lastLap.t, .18), 2.5) : 1;
      const na = (150 + 30 * Math.max(0, k) * (k >= 0 ? kick : 0) + (k > 0 ? 30 * (k - 1) * (1 - kick) * 0 : 0) + 4 * Math.sin(t * 41) * (speed > 1 ? 1 : 0)) * D2R;
      ctx.strokeStyle = COL.red; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(na) * gs * .85, gy + Math.sin(na) * gs * .85); ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(gx, gy, 9 * gp, 0, TAU); ctx.fill();
      ctx.restore();
    }
    const ca = cu > 0 ? clamp(1 - cu * 2) : 1; it.center.dom(t, ca);
    ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(spin * D2R); ctx.scale(Math.max(1e-3, 1 - cu), Math.max(1e-3, 1 - cu)); ctx.translate(-c[0], -c[1]); it.center.draw(ctx, t, { alpha: ca }); ctx.restore();
  }
  for (const R of [it.title, it.quote, it.cite]) if (R) { const a = cu > 0 ? clamp(1 - cu * 1.6) : 1; R.dom(t, a); R.draw(ctx, t, { alpha: a }); }
}
// a painted disc texture per colour (bristle swirl, baked once)
function discTex(col) {
  return HP.memo('sing|disc|' + col, () => {
    const S = 220, cv = HP.offscreen(S, S), x = cv.getContext('2d');
    x.translate(S / 2, S / 2); x.fillStyle = col; x.beginPath(); x.arc(0, 0, S * .45, 0, TAU); x.fill();
    const P = PL(); P.paintShape(x, { kind: 'circle', cx: 0, cy: 0, r: S * .47 }, 1, { color: col, style: 'swirl', key: 'sing|disc|' + col });
    x.globalCompositeOperation = 'destination-in'; x.beginPath(); x.arc(0, 0, S * .5, 0, TAU); x.fill();
    return cv;
  });
}

// ============================================================ BLACKHOLE
// {t0, t1, c [540, 861], r: [[time, px], ...] (horizon radius keyframes, eased between; 0 = closed), disk {scale 3.4, colors, arms 8,
//  spin (turns/s at its fastest)}, lens {k (Einstein radius / horizon, 1.7), extent (lens radius / horizon, 7)} | false,
//  darken {from, to} (the light drains: a dark disc grows from the hole to the whole frame; it lasts until the burst),
//  swallow {from, to, items: [ids] | "all", keep: [ids], turns, dir} (DOM layers and kand pieces spiral in), collapse {at, dur}
//  (the hole snaps shut with a flash), linger (true: a tiny ring breathing on the beats until the burst), burst {at, rings, debris,
//  colors, flash} (shockwave rings and paint debris from the point; the kand "assemble" preset flies the logo out of it)}
const SING = HP.lib.singularity = { lapPlan, lapAngle, spiral, items: [], holes: [] };
let LENS = null;
function lensFilter() {
  if (LENS) return LENS;
  // the displacement field of a point lens: sample at x - thetaE^2 / |x| (capped at the Einstein radius), windowed to 0 at the edge
  const M = 256, RHO0 = 1.7 / 7, cv = HP.offscreen(M, M), x = cv.getContext('2d'), im = x.createImageData(M, M);
  for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) {
    const u = (i + .5) / M * 2 - 1, v = (j + .5) / M * 2 - 1, r = Math.hypot(u, v) + 1e-9, w = r >= 1 ? 0 : Math.pow(1 - r * r, 2);
    const f = Math.min(RHO0 / r, 1) * w, k = (j * M + i) * 4;
    im.data[k] = Math.round(clamp(127.5 + 127.5 * (-u / r) * f, 0, 255)); im.data[k + 1] = Math.round(clamp(127.5 + 127.5 * (-v / r) * f, 0, 255)); im.data[k + 2] = 128; im.data[k + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  const url = cv.toDataURL('image/png');
  const svg = sv('svg', { width: 0, height: 0, style: 'position:absolute;left:0;top:0' }, document.body);
  svg.innerHTML = `<filter id="hp-lens" x="0" y="0" width="${W}" height="${H}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">` +
    `<feFlood flood-color="rgb(128,128,128)" result="n"/><feImage href="${url}" x="0" y="0" width="10" height="10" preserveAspectRatio="none" result="i"/>` +
    `<feMerge result="m"><feMergeNode in="n"/><feMergeNode in="i"/></feMerge><feDisplacementMap in="SourceGraphic" in2="m" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter>`;
  LENS = { url, img: svg.querySelector('feImage'), map: svg.querySelector('feDisplacementMap'), ready: null };
  const pre = new Image(); pre.src = url; LENS.ready = HP.assets.track(pre.decode().catch(() => null));
  return LENS;
}
function keyed(list, dflt) {   // [[time, value], ...] -> f(t), smooth between keys
  const K = (list || []).map(([a, v]) => [ST(a), v]).filter(k => isFinite(k[0])).sort((p, q) => p[0] - q[0]);
  if (!K.length) return () => dflt;
  return t => { if (t <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (t < K[i][0]) { const u = (t - K[i - 1][0]) / (K[i][0] - K[i - 1][0]); return lerp(K[i - 1][1], K[i][1], E.ioSine(u)); } return K[K.length - 1][1]; };
}
HP.register('blackhole', {
  ownMotion: true,
  build(it) {
    const d = it.d;
    it.c = d.c || [540, 861];
    it.rAt = keyed(d.r, 0);
    it.disk = { scale: 3.4, arms: 8, spin: 1.6, colors: ['violet', 'blue', 'pink', 'orange', 'violet', 'yellow', 'blue', 'pink'], ...(d.disk || {}) };
    it.lens = d.lens === false ? null : { k: 1.7, extent: 7, ...(d.lens || {}) };
    it.darken = d.darken ? { a: ST(d.darken.from), b: ST(d.darken.to) } : null;
    it.collapse = d.collapse ? { at: ST(d.collapse.at), dur: d.collapse.dur ?? .16, pinch: d.collapse.pinch || null } : null;
    it.burst = d.burst ? { at: ST(d.burst.at), rings: 3, debris: 70, colors: ['cream', 'yellow', 'pink', 'orange', 'teal', 'blue'], ...d.burst } : null;
    if (it.burst) { it.burst.at = ST(d.burst.at); it.mark(it.burst.at, 'burst'); if (d.burst.flash !== false) HP.flash(it.burst.at, d.burst.flash ?? .9, d.burst.flashDecay ?? .045, '#FFF8EC'); if (d.burst.punch) HP.lib.transitions.camPunch(it.burst.at, d.burst.punch, .18); HP.cam.hit(it.burst.at, d.burst.shake ?? 14, .16); }
    if (it.collapse) { it.mark(it.collapse.at, 'collapse'); if (d.collapse.flash !== false) HP.flash(it.collapse.at + it.collapse.dur, d.collapse.flash ?? .6, d.collapse.flashDecay ?? .04, '#FFF3E0'); if (d.collapse.punch) HP.lib.transitions.camPunch(it.collapse.at + it.collapse.dur, d.collapse.punch, .2); HP.cam.hit(it.collapse.at + it.collapse.dur, d.collapse.shake ?? 10, .12); }
    it.sw = d.swallow ? { a: ST(d.swallow.from), b: ST(d.swallow.to), items: d.swallow.items || 'all', keep: d.swallow.keep || [], turns: d.swallow.turns ?? 1.1, dir: d.swallow.dir ?? 1 } : null;
    // fixer r2: swallow.seq [{items: [ids], at, dur (beats, 0.9), turns (1.2)}]: these items fall in one group at a time (a card per
    // beat) along an inward spiral to ~5 % scale (quadratic ease: they visibly turn from the first frames), with two ghost copies
    // trailing on the spiral (motion blur); every other item keeps the distance rule
    if (it.sw) { it.sw.seq = (d.swallow.seq || []).map(g => ({ items: g.items, a: ST(g.at), d: (g.dur ?? .9) * BP(), turns: g.turns ?? 1.2, ghosts: g.ghosts ?? 2 })).filter(g => isFinite(g.a));
      it.sw.grp = id => it.sw.seq.find(g => g.items.includes(id)) || null; for (const g of it.sw.seq) it.mark(g.a, 'swallow-card'); }
    if (it.sw) { it.mark(it.sw.a, 'swallow'); }
    // the disk surges on every beat while the hole is open (marked for beatcheck)
    { const K = (d.r || []).map(k => ST(k[0])).filter(isFinite); if (K.length) for (const x of HP.beatsIn(Math.min(...K), it.collapse ? it.collapse.at : it.t1)) it.mark(x.t, 'disk'); }
    // canvases: base (in the item's layer: the darkness, the linger ring) and top (above #cam, unlensed: hole, disk, burst)
    it.base = it.canvas();
    const host = el('div', 'bh-top', null, { position: 'absolute', inset: 0, pointerEvents: 'none' });
    HP.layers.stage.insertBefore(host, HP.layers.fx);
    it.topHost = it.attach(host);
    const cv = el('canvas', '', host, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px' }); cv.width = W; cv.height = H;
    it.top = { cv, ctx: cv.getContext('2d') };
    if (it.lens) lensFilter();
    SING.holes.push(it);
    // kand pieces spiral in through builder A's hook (pose in frame px): every kand item that exists before the swallow ends
    if (it.sw && HP.lib.kandinsky) HP.on('built', () => {
      for (const k of HP.lib.kandinsky.items) {
        if (k.t0 >= it.sw.b - EPS || it.sw.keep.includes(k.id) || (it.sw.items !== 'all' && !it.sw.items.includes(k.id))) continue;
        HP.lib.kandinsky.hook({ item: k.id, t0: it.sw.a, t1: it.sw.b + 1, xf: (piece, t, q) => {
          const v = swallowU(it, [q.x, q.y], t); if (v <= 0) return q;
          const S = spiral(it.c, [q.x, q.y], v, { turns: it.sw.turns, dir: it.sw.dir }), p2 = S.M.transformPoint(new DOMPoint(q.x, q.y));
          return { ...q, x: p2.x, y: p2.y, rot: q.rot + S.th, sx: q.sx * S.s, sy: q.sy * S.s, op: q.op * S.op };
        } });
      }
    });
  },
  async load(it) { if (it.lens) await LENS.ready; diskTex(it); },
  layout(it) {
    // where each swallowable DOM item sits (its rect centre), measured once at layout (pure: same every run)
    it.anchor = new Map();
    for (const o of HP.ITEMS) {
      if (o === it || ['color', 'layer', 'paper', 'kand', 'loop', 'blackhole', 'brushwipe'].includes(o.type)) continue;
      const r = HP.lib.transitions ? HP.lib.transitions.itemRect(o) : [0, 0, W, H];
      let c = [r[0] + r[2] / 2, r[1] + r[3] / 2];
      if (r[2] >= W && r[3] >= H) { const kids = [...o.el.querySelectorAll('img,canvas,svg,div')].map(e => e.getBoundingClientRect()).filter(q => q.width > 20 && q.height > 20 && q.width * q.height < W * H * .8);
        if (kids.length) { const x0 = Math.min(...kids.map(q => q.left)), y0 = Math.min(...kids.map(q => q.top)), x1 = Math.max(...kids.map(q => q.right)), y1 = Math.max(...kids.map(q => q.bottom)); c = [(x0 + x1) / 2, (y0 + y1) / 2]; } }
      it.anchor.set(o, c);
    }
  },
  draw(it, t) { drawHole(it, t); },
});
// progress 0..1 of something at point p falling in: the near ones first, everything inside by swallow.to
function swallowU(it, p, t) {
  const S = it.sw; if (!S || t < S.a - EPS) return 0;
  const d = Math.hypot(p[0] - it.c[0], p[1] - it.c[1]), k = clamp(d / 1100), a = S.a + (S.b - S.a) * .42 * k, b = S.b - (S.b - S.a) * .12 * (1 - k);
  return clamp((t - a) / Math.max(.05, b - a));
}
// DOM layers spiral in (post hook: after every item has drawn and core has set its layer transform)
HP.on('post', t => {
  let lensOn = false;
  for (const it of SING.holes) {
    if (!it.active(t)) continue;
    if (it.sw && t >= it.sw.a - EPS) {
      for (const [o, c] of it.anchor) {
        if (!o.shown || o.t0 >= it.sw.b - EPS || it.sw.keep.includes(o.id) || (it.sw.items !== 'all' && !it.sw.items.includes(o.id))) continue;
        const G = it.sw.grp(o.id), v = G ? clamp((t - G.a) / G.d) : swallowU(it, c, t); if (v <= 0) continue;
        const so = G ? { turns: G.turns, dir: it.sw.dir, ease: 'quad', sPow: 1.6 } : { turns: it.sw.turns, dir: it.sw.dir };
        const S = spiral(it.c, c, v, so);
        // a fresh copy of the layer takes the spiral (see transitions.js: no raster state carried between frames)
        const e = HP.lib.transitions.swapLayer(o.el);
        const T0 = (() => { const m = (e.style.transformOrigin || '').match(/(-?[\d.]+)px\s+(-?[\d.]+)px/); return m ? [+m[1], +m[2]] : [540, 960]; })();
        const css = M => { const Q = new DOMMatrix().translate(-T0[0], -T0[1]).multiply(M).translate(T0[0], T0[1]); return `matrix(${[Q.a, Q.b, Q.c, Q.d, Q.e, Q.f].map(x => +x.toFixed(5)).join(',')}) `; };
        const base = e.style.transform || '', op0 = e.style.opacity === '' ? 1 : parseFloat(e.style.opacity);
        // ghosts (fixer r2): earlier positions on the spiral, fading (deterministic motion blur), under the card
        if (G && v < 1) for (let k = G.ghosts; k >= 1; k--) {
          const vg = v - k * .07; if (vg <= 0) continue;
          const Sg = spiral(it.c, c, vg, so), gc = HP.lib.transitions.cloneLayer(e, e.previousSibling || e);
          gc.style.transform = css(Sg.M) + base; gc.style.opacity = String(clamp(op0 * Sg.op * .3 / k));
        }
        e.style.transform = css(S.M) + base;
        e.style.opacity = String(clamp(op0 * S.op));
      }
    }
    // the lens: on while the hole is open
    if (it.lens) {
      const r = holeR(it, t);
      if (r > 1.5) {
        const thE = it.lens.k * r, Rl = it.lens.extent * r;
        LENS.img.setAttribute('x', (it.c[0] - Rl).toFixed(2)); LENS.img.setAttribute('y', (it.c[1] - Rl).toFixed(2));
        LENS.img.setAttribute('width', (2 * Rl).toFixed(2)); LENS.img.setAttribute('height', (2 * Rl).toFixed(2));
        LENS.map.setAttribute('scale', (2 * thE).toFixed(2));
        lensOn = true;
      }
    }
  }
  const want = lensOn ? 'url(#hp-lens)' : '';
  if (HP.layers.cam.style.filter !== want) HP.layers.cam.style.filter = want;
});
function holeR(it, t) {
  let r = it.rAt(t);
  if (it.collapse) r *= 1 - E.iCub(pr(t, it.collapse.at, it.collapse.dur));
  return Math.max(0, r);
}
// the accretion disk: bristle-brush spiral arms in the cover's colours, painted once into a texture
function diskTex(it) {
  const D = it.disk;
  return HP.memo('sing|disk|' + it.id + '|' + JSON.stringify(D), () => {
    const S = 1100, cv = HP.offscreen(S, S), x = cv.getContext('2d'), P = PL(), R = HP.rng('disk', it.id), C = S / 2;
    x.fillStyle = 'rgba(28,14,52,.55)'; x.beginPath(); x.arc(C, C, S * .48, 0, TAU); x.fill();
    const arm = (k, w, col, alpha, r0, r1, turns) => {
      const a0 = k * TAU / D.arms + R() * .4, pts = [];
      for (let i = 0; i <= 40; i++) { const f = i / 40, r = lerp(r1, r0, f), a = a0 + turns * TAU * Math.pow(f, 1.25); pts.push([C + Math.cos(a) * r * S / 2, C + Math.sin(a) * r * S / 2]); }
      const St = P.makeStroke(pts, { width: w, color: colOf(col), seed: `disk|${it.id}|${k}|${w}`, dry: .35, gaps: .4, wet: .45, pressure: [.6, 1, .5], thinning: .5 });
      x.globalAlpha = alpha; P.drawStroke(x, St, 1, { body: .7 });
    };
    for (let k = 0; k < D.arms; k++) arm(k, 120 + R() * 40, D.colors[k % D.colors.length], .92, .3, .97, .85 + R() * .2);
    for (let k = 0; k < D.arms; k++) arm(k + .5, 34, k % 2 ? 'cream' : 'yellow', .55, .28, .9, 1.0);
    x.globalAlpha = 1;
    // fade the outer edge and burn the inner edge toward white-hot
    x.globalCompositeOperation = 'destination-in';
    const g = x.createRadialGradient(C, C, S * .12, C, C, S * .5); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.6, 'rgba(0,0,0,.95)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    x.globalCompositeOperation = 'source-over';
    const h = x.createRadialGradient(C, C, S * .1, C, C, S * .26); h.addColorStop(0, 'rgba(255,236,200,.9)'); h.addColorStop(1, 'rgba(255,120,60,0)');
    x.fillStyle = h; x.fillRect(0, 0, S, S);
    return cv;
  });
}
function spinAt(it, t) {   // disk angle: accelerating spin plus a surge on every beat
  const t0 = it.t0, dt = Math.max(0, t - t0), sp = it.disk.spin;
  const b = HP.beatAt(t), fb = Math.floor(b);
  return TAU * (.25 * dt + sp * .04 * dt * dt * dt) + .45 * (fb + E.oExpo(b - fb));
}
function drawHole(it, t) {
  const B = it.base.ctx, T = it.top.ctx, c = it.c;
  B.setTransform(1, 0, 0, 1, 0, 0); B.clearRect(0, 0, W, H); T.setTransform(1, 0, 0, 1, 0, 0); T.clearRect(0, 0, W, H);
  it.topHost.style.transform = HP.cam.css(t);   // the top layer moves with the camera
  const burstAt = it.burst ? it.burst.at : 1e9, r = holeR(it, t), b = HP.beatAt(t), ph = b - Math.floor(b);
  // the darkness: a disc of night grows from the hole with a ragged spiral edge (base canvas: under the content)
  if (it.darken && t < burstAt - EPS) {
    const u = E.iCub(pr(t, it.darken.a, it.darken.b - it.darken.a)), R0 = lerp(0, 1250, u);
    if (R0 > 1) {
      const n = 120, sa = spinAt(it, t), path = new Path2D();
      for (let i = 0; i <= n; i++) { const a = i / n * TAU, rr = R0 * (1 + .07 * Math.sin(5 * a + sa * 2) + .04 * Math.sin(11 * a - sa * 3)) * (u < 1 ? 1 : 1.5); i ? path.lineTo(c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr) : path.moveTo(c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr); }
      B.fillStyle = NIGHT; B.fill(path);
      B.lineWidth = 26; B.strokeStyle = PL().rgba(COL.violet, .55 * (1 - u * .7)); B.stroke(path);
      // swirling dust inside the dark, surging on the beats
      B.save(); B.clip(path); B.lineCap = 'round';
      const rg = HP.rng('dust', it.id);
      for (let k = 0; k < 70; k++) { const a0 = rg() * TAU, d0 = 120 + rg() * 1100, sp = .6 + rg(), a = a0 + spinAt(it, t) * sp * 220 / d0, len = .12 + .2 * rg();
        B.strokeStyle = PL().rgba([COL.violet, COL.blue, COL.pink, CREAM][k % 4], .18 + .2 * rg()); B.lineWidth = 2 + 3 * rg();
        B.beginPath(); B.arc(c[0], c[1], d0, a, a + len); B.stroke(); }
      B.restore();
    }
  }
  // after the collapse: a tiny ring breathing on the beats (until the burst)
  if (it.collapse && t >= it.collapse.at + it.collapse.dur && t < burstAt && it.d.linger !== false) {
    const k = Math.exp(-ph / .18), rr = 10 + 10 * k;
    B.save(); B.strokeStyle = PL().rgba(COL.orange, .35 + .5 * k); B.lineWidth = 3 + 3 * k; B.beginPath(); B.arc(c[0], c[1], rr, 0, TAU); B.stroke();
    B.fillStyle = '#050407'; B.beginPath(); B.arc(c[0], c[1], rr * .7, 0, TAU); B.fill(); B.restore();
  }
  // the hole: gravity well, accretion disk (two layers, differential rotation), infalling streaks, photon ring, horizon
  if (r > .5) {
    const sa = spinAt(it, t), Rd = r * it.disk.scale, tex = diskTex(it);
    const well = T.createRadialGradient(c[0], c[1], r, c[0], c[1], Rd * 1.6); well.addColorStop(0, 'rgba(8,6,14,.65)'); well.addColorStop(1, 'rgba(8,6,14,0)');
    T.fillStyle = well; T.fillRect(c[0] - Rd * 1.7, c[1] - Rd * 1.7, Rd * 3.4, Rd * 3.4);
    for (const [sc, k, al] of [[1, 1, .95], [.62, 1.9, .8]]) { T.save(); T.translate(c[0], c[1]); T.rotate(sa * k); T.globalAlpha = al; T.drawImage(tex, -Rd * sc, -Rd * sc, 2 * Rd * sc, 2 * Rd * sc); T.restore(); }
    // infalling streaks (log spirals; each one reborn at the rim when it reaches the hole)
    T.save(); T.lineCap = 'round';
    const rg = HP.rng('infall', it.id), N = 90;
    for (let k = 0; k < N; k++) {
      const a0 = rg() * TAU, rate = .55 + rg() * .8, off = rg(), w = 2 + 4 * rg(), col = [CREAM, COL.yellow, COL.pink, COL.orange, COL.violet][k % 5];
      const phs = ((t - it.t0) * rate + off) % 1, pos = f => { const rr = r * 1.05 + (Rd * 1.5 - r) * Math.pow(1 - f, 1.6), a = a0 + 2.2 * TAU * f * f; return [c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]; };
      const p1 = pos(phs), p0 = pos(Math.max(0, phs - .07));
      T.globalAlpha = clamp(phs * 6) * clamp((1 - phs) * 8) * .9; T.strokeStyle = col; T.lineWidth = w;
      T.beginPath(); T.moveTo(p0[0], p0[1]); T.lineTo(p1[0], p1[1]); T.stroke();
    }
    T.restore();
    // photon ring (flickers on 16ths) and the event horizon
    const fl = .75 + .25 * Math.sin(HP.frameNo(t) * 2.1);
    T.save();
    for (const [w, a, col] of [[22, .18, COL.orange], [10, .45, '#FFD27A'], [3.5, .95 * fl, '#FFF4DE']]) { T.strokeStyle = col; T.globalAlpha = a; T.lineWidth = w; T.beginPath(); T.arc(c[0], c[1], r * 1.07, 0, TAU); T.stroke(); }
    T.globalAlpha = 1; T.fillStyle = '#050407'; T.beginPath(); T.arc(c[0], c[1], r, 0, TAU); T.fill();
    T.restore();
  }
  // the collapse: an Einstein ring flash snapping inward
  if (it.collapse) {
    const u = pr(t, it.collapse.at, it.collapse.dur + .25);
    if (u > 0 && u < 1) { const rr = lerp(it.rAt(it.collapse.at) * 2.2, 2, E.oExpo(u)); T.save(); T.strokeStyle = '#FFF4DE'; T.globalAlpha = 1 - u; T.lineWidth = 18 * (1 - u) + 2; T.beginPath(); T.arc(c[0], c[1], rr, 0, TAU); T.stroke(); T.restore(); }
    // polisher: collapse.pinch {glow (s), ring (s), flecks (n), colors}: the hole pinches to a white-hot point (a glow that flares
    // and cools to orange), a shockwave ring runs out to the frame edge, and a spray of paint flecks flies out of the point
    const Pn = it.collapse.pinch, pt = t - (it.collapse.at + it.collapse.dur);
    if (Pn && pt >= -EPS) {
      T.save();
      const gl = Pn.glow ?? .55, ga = Math.exp(-pt / (gl * .45));
      if (pt < gl * 3 && ga > .01) {
        const R1 = lerp(220, 70, E.oCub(pr(pt, 0, gl))), g = T.createRadialGradient(c[0], c[1], 0, c[0], c[1], R1);
        g.addColorStop(0, `rgba(255,255,255,${ga})`); g.addColorStop(.18, `rgba(255,246,214,${ga})`); g.addColorStop(.45, `rgba(255,190,90,${.6 * ga})`); g.addColorStop(1, 'rgba(255,74,28,0)');
        T.fillStyle = g; T.fillRect(c[0] - R1, c[1] - R1, 2 * R1, 2 * R1);
      }
      const rd = Pn.ring ?? .5;
      if (pt < rd) { const q = pr(pt, 0, rd), rr = lerp(10, 1400, E.oCub(q)); T.strokeStyle = '#FFF4DE'; T.globalAlpha = (1 - q) * .95; T.lineWidth = lerp(34, 3, q); T.beginPath(); T.arc(c[0], c[1], rr, 0, TAU); T.stroke();
        T.strokeStyle = COL.orange; T.globalAlpha = (1 - q) * .6; T.lineWidth = lerp(14, 2, q); T.beginPath(); T.arc(c[0], c[1], rr * .86, 0, TAU); T.stroke(); }
      const nf = Pn.flecks ?? 48, cols = (Pn.colors || ['cream', 'yellow', 'pink', 'orange']).map(colOf), rg = HP.rng('pinch', it.id);
      T.lineCap = 'round';
      for (let k = 0; k < nf; k++) {
        const a = rg() * TAU, v = 500 + 1300 * rg(), sz = 4 + 12 * rg(), life = .45 + .55 * rg(), col = cols[k % cols.length];
        if (pt > life) continue;
        const dist = v * .4 * (1 - Math.exp(-pt / .4)), x = c[0] + Math.cos(a) * dist, y = c[1] + Math.sin(a) * dist + 420 * pt * pt;
        T.globalAlpha = clamp((life - pt) / .15); T.fillStyle = col; T.strokeStyle = col; T.lineWidth = sz * .7;
        T.beginPath(); T.moveTo(c[0] + Math.cos(a) * dist * .86, c[1] + Math.sin(a) * dist * .86); T.lineTo(x, y); T.stroke();
        T.beginPath(); T.ellipse(x, y, sz * .75, sz * .5, a, 0, TAU); T.fill();
      }
      T.restore();
    }
  }
  // the burst: shockwave rings and paint debris flying out of the point
  if (it.burst && t >= burstAt - EPS) {
    const lt = t - burstAt, Bu = it.burst, cols = Bu.colors.map(colOf);
    T.save(); T.lineCap = 'round';
    for (let k = 0; k < Bu.rings; k++) { const s = lt - k * .05; if (s <= 0) continue; const rr = 2400 * (1 - Math.exp(-s / .35)), a = Math.exp(-s / .28); if (a < .02) continue;
      T.strokeStyle = cols[k % cols.length]; T.globalAlpha = a; T.lineWidth = 60 * a + 4; T.beginPath(); T.arc(c[0], c[1], rr, 0, TAU); T.stroke(); }
    const rg = HP.rng('debris', it.id);
    for (let k = 0; k < Bu.debris; k++) {
      const a = rg() * TAU, v = 900 + 1900 * rg(), sz = 5 + 16 * rg(), col = cols[k % cols.length], life = .35 + .5 * rg();
      if (lt > life) continue;
      const dist = v * .32 * (1 - Math.exp(-lt / .32)), x = c[0] + Math.cos(a) * dist, y = c[1] + Math.sin(a) * dist + 300 * lt * lt;
      const x0 = c[0] + Math.cos(a) * dist * .82, y0 = c[1] + Math.sin(a) * dist * .82;
      T.globalAlpha = 1; T.strokeStyle = col; T.fillStyle = col; T.lineWidth = sz * .8;
      T.beginPath(); T.moveTo(x0, y0); T.lineTo(x, y); T.stroke(); T.beginPath(); T.arc(x, y, sz * .6, 0, TAU); T.fill();
    }
    T.restore();
  }
}
SING.holeAt = (t) => { const it = SING.holes.find(h => h.active(t)); return it ? { c: it.c, r: holeR(it, t) } : null; };
})();
