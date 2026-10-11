/* fx/kandinsky.js  [BUILDER A]  the logo's pieces as performers: painted on, orbiting, jumping, the river, the superposition
 * =================================================================================================================
 * BUILD.md REVISION 2: the logo's circles orbit each other, objects rotate or jump on the beat, the hyperplane becomes a river with
 * vectors swimming through it, a flashy superposition of vectors, shapes painted stroke by stroke; the logo forms on the riff,
 * breaks apart into frames for the news at verse 1, and reassembles into the exact cover (brand/hyperplane-cover-3000.png).
 * Recipes: research/rev2/style.md 4.1 (painted discs and bands), 4.7 (orbits stepping 45 deg per beat with a held pose, kicks,
 * band swing, checker 90 deg per bar, never a continuous screensaver spin).
 *
 * TYPE "kand" (one item = the whole cover as a cast of pieces; geometry identical to the legacy "logo" item, so the settled frame
 * IS the cover). Fields (edl/README.md "Builder A"):
 *   layout {y: 400, scale: 0.72}   the cover's placement (the final hold uses y 400, scale 0.72 like logo-re)
 *   preset {name: "riff" | "assemble" | "hold", from: "hb:0", ...}   a ready beat choreography (cues + moves), merged under:
 *   cues {piece: time | {at, style, dur, from, dist, scale}}   when and how each piece appears (style paint | pop | slam | drop |
 *        flip | spinin | draw | fly | cut); also "dots", "sort", "tilt" (crossbar), "kick" (kicker). Pieces without a cue are
 *        there from t0. Pieces: band, pink, black, core, smallO, blue, teal, square, target, arc, chk, nabla, normal, margin,
 *        d0..d5 (data points), wm (wordmark), kick (kicker).
 *   moves [{move, ...}]   orbit | spin | jump | pulse | bump | swing | scatter | recolor | river | superpose | whip | push |
 *        break | (see MOVES below for each one's fields)
 *   look "paint" (default: big pieces painted with bristle strokes) | "flat";  ink "ink" | "cream" | "auto" (cream on dark themes)
 *   settle {at, dur (0.3)}   everything eases to the exact flat cover (default: the 0.3 s before EDL.finalHold, if any)
 *   pieces ["band", ...]   only these pieces exist (default: all)
 * EXPORTS HP.lib.kandinsky:
 *   PIECES (cover-unit geometry), preset(name, opts), items (live kand items), geom(itemId, piece, t?) (frame px box),
 *   hook({item, pieces, t0, t1, xf, fill, outline, art}) -> handle   <- builder D's entry points (see "HOOKS" below)
 *   impulse(t, kind, amp)   beat effects from fx/beatfx.js ("jump", "burst", "spin") on every kand item active at t
 * Frames can morph out of kand pieces like logo pieces: legacy enter {"style": "morph", "from": "<kand id>:pink"}.
 */
(function () {
'use strict';
const { clamp, lerp, pr, smooth, sv, setA, el } = HP.u, E = HP.ease;
const W = HP.W, H = HP.H, EPS = HP.EPS, COL = HP.COL, D2R = Math.PI / 180;
const PL = () => HP.lib.paint;
const BP = () => HP.hits.period || 0.4839;

// ============================================================ cover geometry (cover units: the 1500-unit square; = legacy logo)
const RAD = 22 * D2R, KT = Math.tan(RAD), TV = 120 / Math.cos(RAD), BOT = 1000;
const topY = x => BOT - TV - KT * x, botY = x => BOT - KT * x;
const NRM = [Math.sin(RAD), Math.cos(RAD)], XL = -60, XR = 1560;
const S0 = [470 + NRM[0] * 40, botY(470) + NRM[1] * 40];
const NX = 1320, NTIP = topY(1320) - 67, NWD = 125, NHT = 108;
const ART_C = [750, 640];
const BAND_U = [Math.cos(RAD), -Math.sin(RAD)], BAND_N = [Math.sin(RAD), Math.cos(RAD)];   // along the band (rising right), across (down)
const BAND_C = [750, topY(750) + TV / 2];
const DOTS = [
  { fin: [190, 643, 13], start: [560, 700], col: 'orange' }, { fin: [760, 777, 10], start: [300, 360], col: 'blue' },
  { fin: [245, 685, 18], start: [1150, 520], col: 'orange' }, { fin: [800, 806, 18], start: [980, 330], col: 'blue' },
  { fin: [292, 631, 10], start: [820, 250], col: 'orange' }, { fin: [835, 880, 10], start: [420, 860], col: 'blue' }];
const PIECES = {};
function def(name, o) { PIECES[name] = { name, ...o, home: o.home || o.c }; }
def('margin', { kind: 'line', col: 'ink', a: [1180, botY(1180) + 75], b: [1400, botY(1400) + 75], w: 5, home: [1290, botY(1290) + 75], hh: 10 });
def('normal', { kind: 'line', col: 'ink', a: S0, b: [S0[0] + NRM[0] * 150, S0[1] + NRM[1] * 150], w: 12, home: [S0[0] + NRM[0] * 75, S0[1] + NRM[1] * 75], hh: 70 });
def('pink', { kind: 'circle', col: 'pink', c: [430, 390], r: 240 });
def('black', { kind: 'circle', col: 'ink', c: [340, 300], r: 188 });
def('core', { kind: 'circle', col: 'orange', c: [465, 425], r: 74 });
def('smallO', { kind: 'circle', col: 'orange', c: [700, 230], r: 30 });
def('arc', { kind: 'arc', col: 'ink', c: [850, 340], rr: 90, w: 12, home: [850, 295], hh: 50 });
def('chk', { kind: 'chk', col: 'ink', home: [1100, 270], hh: 72 });
def('nabla', { kind: 'nabla', col: 'red', home: [NX, NTIP - NHT / 2], hh: 54 });
def('blue', { kind: 'circle', col: 'blue', c: [1080, 815], r: 170 });
def('teal', { kind: 'circle', col: 'teal', c: [928, 775], r: 60 });
def('square', { kind: 'square', col: 'teal', home: [690, 890], s: 108, rot: 15, hh: 60 });
def('target', { kind: 'target', col: 'violet', home: [1350, 680], hh: 56 });
DOTS.forEach((d, i) => def('d' + i, { kind: 'circle', col: d.col, c: [d.fin[0], d.fin[1]], r: d.fin[2], dot: i }));
def('band', { kind: 'band', col: 'yellow', home: BAND_C, hh: 60 });
def('wm', { kind: 'wm', col: 'ink', home: [142.3 + 1215.3 / 2, 1059.2 + 214.5 / 2], hh: 107 });
def('kick', { kind: 'kick', col: 'ink', home: [748, 1352], hh: 20 });
for (const k in PIECES) { const p = PIECES[k]; if (p.r && !p.hh) p.hh = p.r; }
const ORDER = ['margin', 'normal', 'pink', 'black', 'core', 'smallO', 'arc', 'chk', 'nabla', 'blue', 'teal', 'square', 'target', 'd0', 'd1', 'd2', 'd3', 'd4', 'd5', 'band', 'wm', 'kick'];
const INK = new Set(['black', 'chk', 'arc', 'normal', 'margin', 'wm', 'kick']);
const PAINTABLE = new Set(['circle', 'band', 'line', 'arc', 'square', 'wm']);
// each piece's flight vector for break / fly-in (out from the art's middle; legacy flyv, seeded the same way)
const FLYV = (() => { const r = HP.u.mulberry32(77), o = {}; for (const k of ORDER) { const h = PIECES[k].home; let vx = h[0] - 750, vy = h[1] - 600;
  if (k === 'wm' || k === 'kick') { vx = 0; vy = 1; } if (k === 'band') { vx = Math.cos(RAD); vy = -Math.sin(RAD); }
  const n = Math.hypot(vx, vy) || 1; o[k] = { vx: vx / n, vy: vy / n, spin: (k === 'band' || k === 'wm' || k === 'kick') ? 0 : (r() * 2 - 1) * 170 }; } return o; })();

// ============================================================ beat helpers
// times that may fall inside a cut of a spliced song (the short's riff is cut at song 26.477): dropped / defaulted, never fatal
function ST(v, dflt = NaN) { if (v === undefined || v === null) return dflt; try { const x = HP.T(v); return isFinite(x) ? x : dflt; } catch (e) { return dflt; } }
function onTimes(on) {
  if (on === undefined || on === null) return [];
  if (typeof on === 'number' || (typeof on === 'string' && !/\.\./.test(on))) return [ST(on)].filter(isFinite);
  if (Array.isArray(on)) return on.map(x => ST(x)).filter(isFinite).sort((a, b) => a - b);
  return HP.fxTimes({ on }).times;
}
function lastStep(t, T) { let n = 0, last = -1e9; for (const x of T) { if (t >= x - EPS) { n++; last = x; } else break; } return { n, last }; }
const lerpMatrix = (A, B, u) => new DOMMatrix(['a', 'b', 'c', 'd', 'e', 'f'].map(k => lerp(A[k], B[k], u)));
const lerp2 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
const sel = (spec, all) => spec === undefined || spec === 'all' || spec === '*' ? all : [].concat(spec).filter(k => all.includes(k));
const pos = (P, k) => [PIECES[k].home[0] + P[k].dx, PIECES[k].home[1] + P[k].dy];
function rot2(v, a) { const c = Math.cos(a), s = Math.sin(a); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; }

// ============================================================ MOVES (compiled at build; apply(t, P, it) edits the poses in place)
// every move takes "pieces" (a list, or "all"); beat lists "on": "hb:4..11" | ["hb:4", ...] | {from, to, every, where, skip}
const MOVES = {
  // two-body (or n-body) orbit about the pieces' common centre (weights r^2), or about another piece ("around"), stepping
  // stepDeg (45) per beat with an overshoot, then holding (style.md 4.7). k multiplies the step (-2 = twice as fast, reversed).
  orbit(m, it) {
    const T = onTimes(m.on), step = (m.stepDeg ?? 45) * (m.k ?? 1) * D2R, dur = (m.dur ?? .6) * BP(), ps = sel(m.pieces || ['pink', 'black'], it.names);
    T.forEach(x => it.mark(x, 'orbit'));
    return (t, P) => {
      const { n, last } = lastStep(t, T); if (!n) return;
      const th = step * (n - 1 + E.oBack(clamp((t - last) / dur), m.overshoot ?? 2.2));
      let c;
      if (m.around) c = pos(P, m.around);
      else { let sx = 0, sy = 0, sw = 0; for (const k of ps) { const w = Math.pow(PIECES[k].r || 40, 2), q = pos(P, k); sx += q[0] * w; sy += q[1] * w; sw += w; } c = [sx / sw, sy / sw]; }
      for (const k of ps) { const q = pos(P, k), v = [q[0] - c[0], q[1] - c[1]], r = rot2(v, th); P[k].dx += r[0] - v[0]; P[k].dy += r[1] - v[1]; if (m.turn !== false) P[k].rot += th / D2R; }
    };
  },
  // spin each piece about its own centre, deg (90) per step, held between steps
  spin(m, it) {
    const T = onTimes(m.on), dur = (m.dur ?? .5) * BP(), ps = sel(m.pieces, it.names), ease = E[m.ease || 'ioCub'];
    T.forEach(x => it.mark(x, 'spin'));
    return (t, P) => { const { n, last } = lastStep(t, T); if (!n) return; const a = (m.deg ?? 90) * (n - 1 + ease(clamp((t - last) / dur))); for (const k of ps) P[k].rot += a * (m.alt && PIECES[k].dot !== undefined && PIECES[k].dot % 2 ? -1 : 1); };
  },
  // jump: airborne for air (.7) beats, LANDING on each beat with a squash (pivot at the piece's bottom); stagger (s) per piece
  jump(m, it) {
    const T = onTimes(m.on), ps = sel(m.pieces, it.names), A = (m.air ?? .7) * BP(), h = m.h ?? 90, sq = m.squash ?? .22, st = m.stagger ?? 0;
    T.forEach(x => it.mark(x, 'jump'));
    return (t, P) => ps.forEach((k, j) => {
      const off = j * st;
      for (const x0 of T) {
        const x = x0 + off, pre = .07, post = .14;
        if (t < x - A - pre - EPS || t >= x + post) continue;
        const p = P[k], hh = PIECES[k].hh || 40;
        let sy = 1, sx = 1, dy = 0;
        if (t < x - A) { const f = (t - (x - A - pre)) / pre; sy = 1 - sq * .6 * Math.sin(Math.PI * f); }
        else if (t < x) { const g = (t - (x - A)) / A, v = Math.abs(1 - 2 * g); dy = -h * 4 * g * (1 - g); sy = 1 + .2 * v; sx = 1 - .1 * v; }
        else { const f = (t - x) / post; sy = 1 - sq * Math.sin(Math.PI * f) * (1 - f * .3); sx = 1 + sq * .7 * Math.sin(Math.PI * f); }
        sx = 1 + (sx - 1) * (m.stretch ?? 1); sy = 1 + (sy - 1) * (m.stretch ?? 1);
        p.dy += dy + hh * (1 - sy); p.sx *= sx; p.sy *= sy;
        break;
      }
    });
  },
  // pulse: scale kicks 1 + amp exp(-f / decay) on each step (amp .07, decay .3 beat); "accents": {beatIndex: k}
  pulse(m, it) {
    const T = onTimes(m.on), ps = sel(m.pieces, it.names), dec = (m.decay ?? .3) * BP();
    const acc = {}; if (m.accents) { const B = HP.fxTimes({ on: m.on }).beats || []; B.forEach((b, i) => { if (m.accents[b.i] !== undefined) acc[i] = m.accents[b.i]; }); }
    T.forEach(x => it.mark(x, 'pulse'));
    return (t, P) => { const { n, last } = lastStep(t, T); if (!n) return; const s = 1 + (m.amp ?? .07) * (acc[n - 1] ?? 1) * Math.exp(-(t - last) / dec); for (const k of ps) { P[k].sx *= s; P[k].sy *= s; } };
  },
  // bump: the legacy rehit (scale 1.16 -> 1 over dur .14 s) on single pieces
  bump(m, it) {
    const T = onTimes(m.on), ps = sel(m.pieces, it.names), d = m.dur ?? .14, sc = m.scale ?? 1.16;
    T.forEach(x => it.mark(x, 'bump'));
    return (t, P) => { let s = 1; for (const x of T) { if (t < x - EPS) break; const u = pr(t, x, d); if (u < 1) s = Math.max(s, lerp(sc, 1, E.oCub(u))); } if (s !== 1) for (const k of ps) { P[k].sx *= s; P[k].sy *= s; } };
  },
  // swing: rot += amp sin(2 pi beat / period) between from and to (fades in/out over 0.25 s): the band's +-3 deg over 2 bars
  swing(m, it) {
    const ps = sel(m.pieces || ['band'], it.names), a = ST(m.from, it.t0), b = ST(m.to, it.t1);
    return (t, P) => { const env = smooth(pr(t, a, .25)) * (1 - smooth(pr(t, b - .25, .25))); if (env <= 0) return; const v = (m.amp ?? 3) * Math.sin(2 * Math.PI * HP.beatAt(t) / (m.period ?? 8)) * env; for (const k of ps) P[k].rot += v; };
  },
  // scatter: pieces leave home to seeded offsets (amp 160 cover units, rot 40 deg) at "at" (oBack over dur .25 s), return at "back"
  scatter(m, it) {
    const ps = sel(m.pieces, it.names), a = ST(m.at, 1e9), b = ST(m.back, 1e9), d = m.dur ?? .25;
    it.mark(a, 'scatter'); if (b < 1e8) it.mark(b, 'gather');
    return (t, P) => { const u = E.oBack(pr(t, a, d), 1.6) * (1 - E.oBack(pr(t, b, d), 1.4)); if (Math.abs(u) < 1e-4) return;
      for (const k of ps) { const r = HP.rng(it.id, 'scatter', m.at, k); const ang = r() * 2 * Math.PI, A = (m.amp ?? 160) * (.5 + r()); P[k].dx += Math.cos(ang) * A * u; P[k].dy += Math.sin(ang) * A * u; P[k].rot += (r() - .5) * 2 * (m.rot ?? 40) * u; } };
  },
  // recolor: on each step the pieces take the next colour of "cycle" (palette names); back to their own after "to"
  recolor(m, it) {
    const T = onTimes(m.on), ps = sel(m.pieces, it.names), cyc = m.cycle || ['pink', 'blue', 'yellow', 'teal'], end = ST(m.to, 1e9);
    T.forEach(x => it.mark(x, 'recolor'));
    return (t, P) => { if (t >= end) return; const { n } = lastStep(t, T); if (!n) return; ps.forEach((k, j) => { P[k].col = cyc[(n - 1 + j) % cyc.length]; }); };
  },
  // whip: the whole art spins deg (360) over dur (1 beat) from "at" (ease ioCub): a whip pan of the composition
  whip(m, it) { const a = ST(m.at, 1e9), d = (m.dur ?? 1) * BP(); it.mark(a, 'whip'); it.artMoves.push(t => ({ rot: (m.deg ?? 360) * E.ioCub(pr(t, a, d)) })); return null; },
  // push: the whole art zooms z[0] -> z[1] between from and to (slow push-in through a hold)
  push(m, it) { const a = ST(m.from, it.t0), b = ST(m.to, it.t1), z = m.z || [1, 1.05]; it.artMoves.push(t => ({ sc: lerp(z[0], z[1], E.ioSine(pr(t, a, Math.max(.01, b - a)))) })); return null; },
  // breathe: the whole art pushes in 1 -> 1 + amp over each `period` beats (4 = a bar) and snaps back on the downbeat:
  // motion between the beats that makes every downbeat a cut-like change
  breathe(m, it) {
    const a = ST(m.from, it.t0), b = ST(m.to, it.t1), b0 = HP.beatAt(a), per = m.period ?? 4;
    it.artMoves.push(t => { if (t < a - EPS || t >= b) return null; const ph = ((HP.beatAt(t) - b0) / per) % 1; return { sc: 1 + (m.amp ?? .035) * E.ioSine(clamp(ph)) }; });
    return null;
  },
  // reframe: beat-cut camera shots on the art: shots [{at, zoom (1.4), focus: piece | [x, y] cover units (default the art's
  // middle), rot (deg), to: [x, y] frame px where the focus lands (540, 860)}]; each shot snaps in over snap (0.1 s, oExpo)
  reframe(m, it) {
    const shots = (m.shots || []).map(s => ({ ...s, at: ST(s.at) })).filter(s => isFinite(s.at)).sort((x, y) => x.at - y.at);
    shots.forEach(s => it.mark(s.at, 'reframe'));
    const snap = m.snap ?? .1, fr = s => {
      const P = s._P, f = s.focus === undefined ? ART_C : Array.isArray(s.focus) ? s.focus : pos(P, s.focus);
      const to = s.to || [540, 860]; return { z: s.zoom ?? 1, f, c: [(to[0] - it.ox) / it.sc, (to[1] - it.oy) / it.sc], rot: s.rot || 0, wide: s.zoom === undefined || s.zoom === 1 };
    };
    it.artMoves.push((t, P) => {
      if (!shots.length || t < shots[0].at - EPS) return null;
      let k = 0; while (k + 1 < shots.length && t >= shots[k + 1].at - EPS) k++;
      shots[k]._P = P; const B = fr(shots[k]);
      const A = k > 0 ? (shots[k - 1]._P = P, fr(shots[k - 1])) : { z: 1, f: ART_C, c: ART_C, rot: 0 };
      const u = E.oExpo(pr(t, shots[k].at, snap)), z = lerp(A.z, B.z, u), rot = lerp(A.rot, B.rot, u);
      const f = B.wide ? lerp2(A.f, ART_C, u) : A.z === 1 && !k ? B.f : lerp2(A.f, B.f, u), c = B.wide ? lerp2(A.c, ART_C, u) : A.z === 1 && !k ? B.c : lerp2(A.c, B.c, u);
      return { m: new DOMMatrix().translate(c[0], c[1]).rotate(rot).scale(z, z).translate(-f[0], -f[1]) };
    });
    return null;
  },
  // art pulse: the whole composition kicks (scale about the art's middle) on steps; amp .012, accents {beatIndex: k}
  artpulse(m, it) {
    const T = onTimes(m.on), dec = (m.decay ?? .18) * BP(); const acc = {};
    if (m.accents) { const B = HP.fxTimes({ on: m.on }).beats || []; B.forEach((b, i) => { if (m.accents[b.i] !== undefined) acc[i] = m.accents[b.i]; }); }
    T.forEach(x => it.mark(x, 'pulse'));
    it.artMoves.push(t => { const { n, last } = lastStep(t, T); return n ? { sc: 1 + (m.amp ?? .012) * (acc[n - 1] ?? 1) * Math.exp(-(t - last) / dec) } : null; });
    return null;
  },
  // break: the pieces blow out from the art's middle (mode "out", dist 1700, spin) or spiral into a point (mode "implode", to [x, y]
  // cover units, default the art's middle); stagger per piece; "hide": pieces that vanish at hideAt (frames morph out of them)
  break(m, it) {
    const a = ST(m.at, 1e9), d = m.dur ?? .4, stg = m.stagger ?? .012, hide = m.hide || [], hideAt = ST(m.hideAt ?? m.at, 1e9), dist = m.dist ?? 1700, lead = m.lead ?? 0;
    const mode = m.mode || 'out', to = m.to || ART_C, darkInk = m.inkFade ?? true;
    it.mark(a, 'break'); if (it.breakAt === undefined) it.breakAt = hideAt - 1e-3;   // frames morph out of the pieces' poses at this moment
    const order = ['wm', 'kick', ...ORDER.filter(k => k !== 'wm' && k !== 'kick')].filter(k => it.names.includes(k));
    return (t, P) => {
      order.forEach((k, i) => {
        const p = P[k];
        if (hide.includes(k)) { if (t >= hideAt - EPS) p.op = 0; return; }
        const t0 = a + (k === 'wm' || k === 'kick' ? 0 : lead) + i * stg;
        if (mode === 'implode') {
          const v = E.iCub(pr(t, t0, d)); if (v <= 0) return;
          const q = pos(P, k), r = rot2([q[0] - to[0], q[1] - to[1]], v * (m.swirl ?? 300) * D2R);
          p.dx += (to[0] + r[0] * (1 - v)) - q[0]; p.dy += (to[1] + r[1] * (1 - v)) - q[1]; p.sx *= 1 - v * .92; p.sy *= 1 - v * .92; p.rot += v * (m.swirl ?? 300);
          if (v >= 1) p.op = 0;
        } else {
          const v = E.oCub(pr(t, t0, d)); if (v <= 0) return; const f = FLYV[k];
          p.dx += f.vx * dist * v; p.dy += f.vy * dist * v; p.rot += f.spin * v;
          p.op *= (darkInk && INK.has(k)) ? 1 - pr(v, .05, .35) : 1 - pr(v, .8, .2);
        }
      });
    };
  },
  // fixer r2: thicken: the band widens across its own axis (not along it) to k x its cover thickness at "at" (oBack over dur 0.3 s),
  // back to 1 at "back" (default never); the river inside keeps its vectors' proportions and spreads its lanes with the band
  thicken(m, it) {
    const a = ST(m.at, 1e9), b = ST(m.back, 1e9), d = m.dur ?? .3, k = m.k ?? 2.6;
    it.mark(a, 'thicken');
    return (t, P) => { if (!P.band) return; const u = E.oBack(pr(t, a, d), 1.4) * (1 - E.ioCub(pr(t, b, d))); if (Math.abs(u) < 1e-4) return; P.band.thick = (P.band.thick || 1) * (1 + (k - 1) * u); };
  },
  // fixer r2: grow: pieces scale up to "scale" (and shift by dx, dy cover units) at "from" (oBack over dur 0.25 s), hold, and come
  // back to home at "to" (ioCub over dur): a footage disc made big enough to read while it carries a speaker
  grow(m, it) {
    const a = ST(m.from, 1e9), b = ST(m.to, 1e9), d = m.dur ?? .25, ps = sel(m.pieces, it.names), sc = m.scale ?? 1.5;
    it.mark(a, 'grow');
    return (t, P) => { const u = E.oBack(pr(t, a, d), 1.6) * (1 - E.ioCub(pr(t, b, d))); if (Math.abs(u) < 1e-4) return;
      for (const k of ps) { const s = 1 + (sc - 1) * u; P[k].sx *= s; P[k].sy *= s; P[k].dx += (m.dx || 0) * u; P[k].dy += (m.dy || 0) * u; } };
  },
  // river / superpose: overlays drawn by the item (the band flows with vectors swimming in it; the superposition burst)
  river(m, it) { const a = ST(m.from ?? m.at, it.t0), b = ST(m.to, it.t1); it.overlays.push({ kind: 'river', m, a, b }); onTimes({ from: Math.ceil(HP.beatAt(a) - 1e-6), to: Math.floor(HP.beatAt(b) - 1e-6) }).forEach(x => it.mark(x, 'river')); return null; },
  superpose(m, it) { const a = ST(m.at, 1e9), b = ST(m.to, a + 1.5); it.overlays.push({ kind: 'superpose', m, a, b }); it.mark(a, 'superpose'); return null; },
};
HP.lib.kandinsky = { PIECES, ORDER, MOVES, BAND_U, BAND_N, BAND_C, topY, botY, items: [], hooks: [], impulses: [] };

// ============================================================ HOOKS (builder D): per-shape fill/outline override, per-piece transform
// HP.lib.kandinsky.hook({item: "<kand id>" | "*", pieces: [...] | "*", t0, t1 (time refs; default always),
//   xf(piece, t, pose) -> pose            pose in FRAME px: {x, y (piece centre), rot (deg), sx, sy, op}; return a changed copy
//   fill(ctx, piece, t, info) -> true     ctx is in cover units with the piece's transform, clipped to its outline; paint the
//                                         inside (marbling...) and return true to replace the flat/painted fill
//   outline(piece, t, info) -> Path2D     the piece's outline in cover units (a wobbly edge); used for the fill and the clip
//   art(t, info) -> DOMMatrix             a frame-px matrix applied to the WHOLE item (pieces, river, superposition), e.g. the
//                                         lensing swirl of a black hole; info = {item, settle, G (the item's own matrix)}
// }) -> handle (handle.off() removes it). info = {name, kind, color, path, bbox, home, settle (0..1), sc, item}. While the item
// settles (settle 0 -> 1) the result is blended back to the exact cover; at settle 1 hooks are not called.
HP.lib.kandinsky.hook = h => {
  const H0 = { ...h, a: h.t0 !== undefined ? HP.T(h.t0) : -1e9, b: h.t1 !== undefined ? HP.T(h.t1) : 1e9 };
  HP.lib.kandinsky.hooks.push(H0); H0.off = () => { const L = HP.lib.kandinsky.hooks, i = L.indexOf(H0); if (i >= 0) L.splice(i, 1); }; return H0;
};
const hooksFor = (it, name, t) => HP.lib.kandinsky.hooks.filter(h => (h.item === undefined || h.item === '*' || h.item === it.id) && t >= h.a - EPS && t < h.b - EPS &&
  (h.pieces === undefined || h.pieces === '*' || [].concat(h.pieces).includes(name)));
// impulses from beat effects (fx/beatfx.js): kind "jump" (every piece hops), "burst" (pieces kick out and spring back), "spin"
HP.lib.kandinsky.impulse = (t, kind = 'jump', amp = 1) => { HP.lib.kandinsky.impulses.push({ t, kind, amp }); return HP.lib.kandinsky.items.some(it => t >= it.t0 && t < it.t1); };
function applyImpulses(it, t, P) {
  for (const q of HP.lib.kandinsky.impulses) {
    if (t < q.t - .12 || t > q.t + .6 || q.t < it.t0 || q.t >= it.t1) continue;
    const f = t - q.t;
    if (q.kind === 'jump') {   // every piece lifts ON the beat (the beat frame shows the stretch) and lands 0.3 s later
      for (const k of it.names) { const p = P[k], hh = PIECES[k].hh || 40; if (f < 0) continue; const g = f / .3; if (g >= 1.25) continue;
        const dy = g < 1 ? -42 * q.amp * 4 * g * (1 - g) * (1 + (HP.rand(it.id, k, q.t) - .5) * .6) : 0, s = g < .2 ? 1 + .14 * q.amp * (1 - g / .2) : g >= 1 ? 1 - .12 * q.amp * Math.sin(Math.PI * (g - 1) / .25) : 1;
        p.dy += dy + hh * (1 - s); p.sy *= s; p.sx *= 2 - s; }
    } else if (q.kind === 'burst') {
      if (f < 0) continue; const a = q.amp * 60 * Math.exp(-f / .12) * Math.cos(f * 26);
      for (const k of it.names) { const fv = FLYV[k]; P[k].dx += fv.vx * a; P[k].dy += fv.vy * a; }
    } else if (q.kind === 'spin') {
      if (f < 0) continue; const a = q.amp * 25 * Math.exp(-f / .15);
      for (const k of it.names) if (!['band', 'wm', 'kick'].includes(k)) P[k].rot += a * (PIECES[k].dot !== undefined || HP.rand(it.id, k) < .5 ? -1 : 1);
    }
  }
}

// ============================================================ presets: ready beat choreographies (cues + moves) from a beat index
function bref(b0, x) { return 'hb:' + +(b0 + x).toFixed(4); }
// polisher: an EDL override object for a preset move: numeric from / to / at are beats from the preset's start
function rel(o, B) { if (!o || typeof o !== 'object') return {}; const r = { ...o }; for (const k of ['from', 'to', 'at']) if (typeof r[k] === 'number') r[k] = B(r[k]); return r; }
const PRESETS = {
  // the drop riff (16 beats): painted on piece by piece on beats and 8ths, then orbits, jumps, spins, the wordmark painted on bar 3,
  // the river on beats 10-15, the superposition burst on bar 4, every beat carrying a pose change
  riff(o) {
    const b = o.from ?? 0, B = x => bref(b, x);
    const cues = {
      band: { at: B(0), style: 'paint', dur: .14, lead: 2 / 30 }, dots: B(0), sort: B(2),
      pink: { at: B(0.5), style: 'paint', dur: .3 }, black: { at: B(1), style: 'paint', dur: .26 }, core: { at: B(1.5), style: 'paint', dur: .2 },
      blue: { at: B(2), style: 'paint', dur: .3 }, teal: { at: B(2.5), style: 'paint', dur: .2 }, smallO: { at: B(2.5), style: 'pop', dur: .2 },
      square: { at: B(3), style: 'spinin', dur: .3 }, target: { at: B(3.5), style: 'pop', dur: .24 }, arc: { at: B(3.5), style: 'draw', dur: .3 },
      chk: { at: B(4), style: 'flip', dur: .18 }, nabla: { at: B(4.5), style: 'drop', dur: .3 }, normal: { at: B(5), style: 'draw', dur: .2 },
      margin: { at: B(5.5), style: 'draw', dur: .2 }, wm: { at: B(8), style: 'paint', dur: .32 }, tilt: B(9), kick: { at: B(10), style: 'rise', dur: .3 },
    };
    const moves = [
      { move: 'orbit', pieces: ['pink', 'black'], on: `hb:${b + 4}..${b + 11}`, stepDeg: 45 },
      { move: 'orbit', pieces: ['core'], around: 'black', on: `hb:${b + 4}..${b + 11}`, stepDeg: 45, k: -2 },
      { move: 'orbit', pieces: ['teal'], around: 'blue', on: { from: b + 4.5, to: b + 11.5, every: 1 }, stepDeg: 45 },
      { move: 'jump', pieces: ['d0', 'd1', 'd2', 'd3', 'd4', 'd5'], on: [B(6), B(7), B(13), B(14)], h: 70, stagger: .03 },
      { move: 'jump', pieces: ['smallO', 'target'], on: [B(9), B(11), B(15)], h: 110, stagger: .06 },
      { move: 'jump', pieces: ['blue'], on: [B(12.5)], h: 60, squash: .18 },
      { move: 'spin', pieces: ['square'], on: [B(6), B(10), B(14)], deg: 90 },
      { move: 'spin', pieces: ['chk'], on: [B(7), B(11), B(15)], deg: 90 },
      { move: 'spin', pieces: ['nabla'], on: [B(8), B(12)], deg: 120 },
      { move: 'bump', pieces: ['arc', 'normal', 'margin'], on: [B(9), B(13)], scale: 1.25 },
      { move: 'swing', pieces: ['band'], from: B(6), to: B(16), amp: 3, period: 8 },
      // polisher: o.river / o.superpose override the move's fields (from / to / at as beats from the preset's start)
      { move: 'river', from: B(10), to: B(16), ...rel(o.river, B) },
      { move: 'superpose', at: B(12), to: B(15.75), n: 7, ...rel(o.superpose, B) },
      { move: 'artpulse', on: `hb:${b}..${b + 15}`, amp: .012, accents: { [b]: 3, [b + 4]: 2, [b + 8]: 2.4, [b + 12]: 2 } },
      { move: 'breathe', from: B(0), to: B(16), amp: .03, period: 4 },
      { move: 'bump', pieces: ['d0', 'd2', 'd4', 'smallO'], on: [B(4.5), B(5.5), B(8.5), B(10.5), B(12.5)], scale: 1.6, dur: .16 },
      { move: 'bump', pieces: ['d1', 'd3', 'd5', 'teal'], on: [B(6.5), B(7.5), B(9.5), B(11.5), B(13.5)], scale: 1.6, dur: .16 },
      { move: 'reframe', shots: o.reframe === false ? [] : Array.isArray(o.reframe) ? o.reframe.map(x => rel(x, B)) : [
        { at: B(5), zoom: 1.55, focus: 'black', to: [470, 760] }, { at: B(6), zoom: 1.4, focus: 'blue', to: [620, 980] }, { at: B(7), zoom: 1 },
        { at: B(13), zoom: 1.5, focus: [430, 360], to: [540, 820], rot: -4 }, { at: B(14), zoom: 1.25, focus: [900, 700], to: [560, 900], rot: 3 }, { at: B(15), zoom: 1 }] },
    ];
    return { cues, moves };
  },
  // reassembly: the pieces burst out of a point ("from", cover units; default the art's middle: the black hole) and land on 8ths,
  // the wordmark on beat 4, the crossbar tilts on 5, the kicker rises on 6; pulses until hold (beats)
  assemble(o) {
    const b = o.from ?? 0, B = x => bref(b, x), F = o.point || 'center', fd = o.flyDur ?? .28, fly = (x, extra) => ({ at: B(x), style: 'fly', from: F, dur: fd, ...(extra || {}) });
    const cues = {
      band: { at: B(0), style: 'slam', dur: .12, scale: 1.3 }, dots: B(0), sort: B(1),
      pink: fly(.5), black: fly(.5), core: fly(1), blue: fly(1), smallO: fly(1.5), teal: fly(1.5), square: fly(2), target: fly(2),
      arc: fly(2.5), normal: fly(2.5), margin: fly(2.5), chk: fly(3), nabla: fly(3.25),
      wm: { at: B(4), style: 'slam', dur: .24, scale: 1.32 }, tilt: B(5), kick: { at: B(6), style: 'rise', dur: .32 },
    };
    const hold = o.hold ?? 12;
    const moves = [
      { move: 'artpulse', on: `hb:${b + 3}..${b + hold}`, amp: .008, accents: { [b + 4]: 2.2, [b + 8]: 1.6 } },
      { move: 'bump', pieces: ['teal', 'square', 'd0', 'd2', 'd4'], on: [B(7), B(9), B(11)], scale: 1.3 },
      { move: 'bump', pieces: ['smallO', 'core', 'd1', 'd3', 'd5'], on: [B(7.5), B(9.5), B(11.5)], scale: 1.35 },
      { move: 'bump', pieces: ['blue', 'target'], on: [B(8), B(10)], scale: 1.12 },
      { move: 'push', from: B(6), to: B(hold), z: [1, 1.025] },
    ];
    return { cues, moves };
  },
  hold() { return { cues: {}, moves: [] }; },
};
HP.lib.kandinsky.preset = (name, o = {}) => { const f = PRESETS[name]; if (!f) throw new Error(`kand: unknown preset "${name}"`); return f(o); };
HP.lib.kandinsky.PRESETS = PRESETS;

// ============================================================ the item
// a cue's "lead" (s; default 1 frame for paint/draw, style.md 4.1: the stroke's head crosses the frame ON the beat) starts it early
function cueOf(v, dflt, lead) {
  if (v === undefined || v === null) return null;
  const c = typeof v === 'string' || typeof v === 'number' ? { at: ST(v), style: dflt } : { ...v, at: ST(v.at), style: v.style || dflt };
  if (!isFinite(c.at)) return null;   // a cue inside a cut of the song: the piece is simply there
  const L = c.lead ?? ((c.style === 'paint' || c.style === 'draw') ? (lead ?? 1) / HP.FPS : 0);
  c.beat = c.at; c.at -= L; return c;
}

HP.register('kand', {
  ownMotion: true,
  build(it) {
    const d = it.d;
    it.L = { y: 400, scale: .72, ...(d.layout || {}) };
    it.sc = it.L.scale; it.ox = (W - 1500 * it.sc) / 2; it.oy = it.L.y;
    it.names = (d.pieces || ORDER).filter(k => PIECES[k]);
    const pre = d.preset ? HP.lib.kandinsky.preset(d.preset.name || d.preset, { ...d.preset, from: d.preset.from !== undefined ? HP.beatAt(HP.T(d.preset.from)) : HP.beatAt(it.t0) }) : { cues: {}, moves: [] };
    const cues = { ...pre.cues, ...(d.cues || {}) };
    it.cue = {};
    for (const k in cues) it.cue[k] = cueOf(cues[k], d.style || 'paint', d.lead);
    for (const k in it.cue) if (it.cue[k]) it.mark(it.cue[k].beat, 'cue:' + k);
    it.look = d.look || 'paint';
    it.artMoves = []; it.overlays = [];
    it.moves = [...pre.moves.filter(m => !(d.drop || []).includes(m.move)), ...(d.moves || [])].map(m => { const f = MOVES[m.move]; if (!f) throw new Error(`kand ${it.id}: unknown move "${m.move}"`); return f(m, it); }).filter(Boolean);
    // settle: the exact flat cover (explicit, or the 0.3 s before EDL.finalHold when the hold falls inside this item)
    const fh = HP.EDL.finalHold, S = d.settle;
    if (S) it.settle = { at: HP.T(S.at ?? S), dur: S.dur ?? .3 };
    else if (fh && HP.T(fh[0]) > it.t0 && HP.T(fh[0]) <= it.t1 + EPS) it.settle = { at: HP.T(fh[0]) - .3, dur: .3 };
    it.cv = it.canvas();
    HP.lib.kandinsky.items.push(it);
    // frames can morph out of kand pieces (legacy FrameBox: {"enter": {"style": "morph", "from": "<id>:pink"}})
    if (HP.lib.legacy && HP.lib.legacy.LOGOS) HP.lib.legacy.LOGOS.push({ id: it.id, get geom() { return it.geomAll(); } });
    it.geomAll = () => HP.memo('kand|geomAll|' + it.id + '|' + it.breakAt, () => { const o = {}; for (const k of ['band', 'square', 'pink', 'black', 'core', 'smallO', 'blue', 'teal', 'target', 'chk', 'nabla', 'wm']) o[k] = geomOf(it, k, it.breakAt); return o; });
  },
  async load(it) {
    const WMP = it.WMP = await HP.assets.json('wordmark_parts.json'), ws = 1215.3 / WMP.width;
    const wmT = it.wmT = { x: 142.3, base: 1059.2 + WMP.asc * ws, s: ws };
    const M = new DOMMatrix([ws, 0, 0, ws, wmT.x, wmT.base]);
    it.wmBody = new Path2D(); it.wmBody.addPath(new Path2D(WMP.body), M);
    it.wmBar = new Path2D(); it.wmBar.addPath(new Path2D(WMP.bar), M);
    it.barC = [wmT.x + WMP.barC[0] * ws, wmT.base + WMP.barC[1] * ws];
    // the kicker stays SVG text (exactly the legacy logo's, so the cover hold matches and the checks can read it)
    it.svgK = it.svg(); const g = it.kickG = sv('g', {}, it.svgK);
    sv('path', { d: 'M0 0H64L32 56Z M15 5H57L36 41.75Z', fill: COL.red, 'fill-rule': 'evenodd', transform: `translate(${381.4 + (38 - 64 * 33 / 56) / 2},1335.5) scale(${33 / 56})` }, g);
    const kt = sv('text', { x: 435.4, y: 1364.85, 'font-family': 'IBM Plex Mono', 'font-weight': 500, 'font-size': 34, 'letter-spacing': 6.1, fill: COL.ink, 'text-rendering': 'geometricPrecision' }, g);   // geometricPrecision: Chrome otherwise rounds the scaled font size (24.48 -> 24 px) and the kicker comes out 4% narrow; x 435.4 and letter-spacing 6.1 are fitted to the glyph positions on brand/hyperplane-cover-3000.png (pitch 26.50 units, least squares over 23 glyphs)
    kt.textContent = 'A CORNELL GRADIENT PODCAST'; it.kickT = kt;
  },
  draw(it, t) { drawKand(it, t); },
  texts(it) { return it.names.includes('kick') ? [{ text: 'A CORNELL GRADIENT PODCAST', reveal: 'none', role: 'meta' }] : []; },
});

// ---------------------------------------------------------------- per-frame state
function settleAt(it, t) { return it.settle ? smooth(pr(t, it.settle.at, it.settle.dur)) : 0; }
function inkCol(it, t) { const i = it.d.ink || 'ink'; return i === 'auto' ? (HP.themeAt(t) === 'dark' ? COL.cream : COL.ink) : (COL[i] || i); }
function poses(it, t) {
  const P = {};
  for (const k of it.names) P[k] = { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, op: 1, u: 1, col: null, x: {} };
  for (const k of it.names) applyCue(it, k, P[k], t);
  for (const m of it.moves) m(t, P, it);
  applyImpulses(it, t, P);
  return P;
}
function applyCue(it, k, p, t) {
  const def = PIECES[k], c = it.cue[k];
  if (def.dot !== undefined) {   // data points: burst out scattered (big) on "dots", the plane sorts them home on "sort"
    const cd = it.cue.dots, cs = it.cue.sort, D = DOTS[def.dot];
    if (cd) { const t0 = cd.at + def.dot * .02; if (t < t0 - EPS) { p.op = 0; return; } const s = E.oBack(pr(t, t0, .2)); p.sx *= s; p.sy *= s; }
    if (cs) { const so = pr(t, cs.at + (D.col === 'blue' ? .06 : 0), .5), k2 = E.oBack(so, 1.4), big = lerp(it.d.dotScale ?? 2.6, 1, E.oCub(so)); p.dx += (D.start[0] - D.fin[0]) * (1 - k2); p.dy += (D.start[1] - D.fin[1]) * (1 - k2); p.sx *= big; p.sy *= big; }
    return;
  }
  if (!c) return;
  const u = pr(t, c.at, c.dur ?? .3);
  switch (c.style) {
    case 'cut': if (t < c.at - EPS) p.op = 0; break;
    case 'paint': if (t < c.at - EPS) { p.op = 0; break; } p.u = PAINTABLE.has(def.kind) ? u : 1; if (!PAINTABLE.has(def.kind)) { const s = E.oBack(u); p.sx *= s; p.sy *= s; } break;
    case 'draw': if (t < c.at - EPS) { p.op = 0; break; } p.u = u; p.draw = true; break;
    case 'pop': { if (t < c.at - EPS) { p.op = 0; break; } const s = E.oBack(u, c.k ?? 1.9); p.sx *= s; p.sy *= s; p.x.rings = true; break; }
    case 'slam': { if (t < c.at - EPS) { p.op = 0; break; } const s = lerp(c.scale ?? 1.3, 1, E.oCub(pr(t, c.at, c.dur ?? .1))); p.sx *= s; p.sy *= s; break; }
    case 'drop': { if (t < c.at - EPS) { p.op = 0; break; } p.dy += lerp(-760, 0, E.oBack(u, 1.6)); break; }
    case 'spinin': { if (t < c.at - EPS) { p.op = 0; break; } p.rot += lerp(-180, 0, E.oBack(u, 1.2)); const s = E.oBack(u); p.sx *= s; p.sy *= s; break; }
    case 'flip': { if (t < c.at - EPS) { p.op = 0; break; } p.x.flip = c; break; }
    case 'rise': { const v = E.oCub(u); p.dy += lerp(36, 0, v); p.op *= v; break; }
    case 'fly': {
      const fd = c.dur ?? .28, v = 1 - E.oCub(pr(t, c.at - fd, fd));
      if (t < c.at - fd - EPS) { p.op = 0; break; }
      const h = def.home, from = c.from || 'out';
      if (from === 'out') { const f = FLYV[k], D = c.dist ?? 1700; p.dx += f.vx * D * v; p.dy += f.vy * D * v; p.rot += f.spin * v; }
      else { const Q = from === 'center' ? ART_C : from; p.dx += (Q[0] - h[0]) * v; p.dy += (Q[1] - h[1]) * v; const s = lerp(1, .12, v); p.sx *= s; p.sy *= s; p.rot += (FLYV[k].spin >= 0 ? 1 : -1) * 300 * v; }
      if (t >= c.at - EPS) { const b = lerp(1.14, 1, E.oCub(pr(t, c.at, .16))); p.sx *= b; p.sy *= b; }
      break;
    }
  }
}
// the global art matrix (cover units -> frame px): layout, then the art moves (whip spin, push, pulse) about the art's middle
function artMatrix(it, t, s, P) {
  let rot = 0, sc = 1, X = null;
  for (const f of it.artMoves) { const r = f(t, P); if (!r) continue; if (r.rot) rot += r.rot; if (r.sc) sc *= r.sc; if (r.m) X = X ? X.multiply(r.m) : r.m; }
  rot *= 1 - s; sc = lerp(sc, 1, s);
  const M = new DOMMatrix([it.sc, 0, 0, it.sc, it.ox, it.oy]);
  if (X && s < 1) { const I = new DOMMatrix(); M.multiplySelf(s > 0 ? new DOMMatrix([0, 1, 2, 3, 4, 5].map(i => lerp(['a', 'b', 'c', 'd', 'e', 'f'].map(k => X[k])[i], ['a', 'b', 'c', 'd', 'e', 'f'].map(k => I[k])[i], s))) : X); }
  if (rot || sc !== 1) M.translateSelf(ART_C[0], ART_C[1]).rotateSelf(rot).scaleSelf(sc, sc).translateSelf(-ART_C[0], -ART_C[1]);
  return M;
}
function pieceMatrix(G, k, p) {
  const h = PIECES[k].home, M = G.translate(h[0] + p.dx, h[1] + p.dy);
  if (p.rot) M.rotateSelf(p.rot); if (p.sx !== 1 || p.sy !== 1) M.scaleSelf(p.sx, p.sy);
  if (p.thick && p.thick !== 1) M.rotateSelf(-22).scaleSelf(1, p.thick).rotateSelf(22);   // fixer r2: thicken (across the band)
  return M.translateSelf(-h[0], -h[1]);
}
// geometry in frame px (legacy geom format) of a piece's current pose (t given) or its home
function geomOf(it, k, t) {
  const def = PIECES[k]; if (!def) return null;
  const P = t !== undefined ? poses(it, t) : null, p = P && P[k] ? P[k] : { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1 };
  const G = new DOMMatrix([it.sc, 0, 0, it.sc, it.ox, it.oy]), c = G.transformPoint(new DOMPoint(def.home[0] + p.dx, def.home[1] + p.dy));
  const col = COL[def.col] || def.col, s = it.sc;
  const box = (w, h, rot, round) => ({ cx: c.x, cy: c.y, w: w * s * p.sx, h: h * s * p.sy, rot: rot + p.rot, round, color: col });
  switch (def.kind) {
    case 'circle': return box(2 * def.r, 2 * def.r, 0, 1);
    case 'band': return box(1620 / Math.cos(RAD), 120 * (p.thick || 1), -22, 0);
    case 'square': return box(108, 108, 15, 0);
    case 'target': return box(112, 112, 0, 1);
    case 'chk': return box(144, 144, -22, 0);
    case 'nabla': return box(NWD, NHT, 0, 0);
    case 'wm': return box(1215.3, 214.5, 0, 0);
    default: return box(def.hh * 2, def.hh * 2, 0, 0);
  }
}
HP.lib.kandinsky.geom = (id, k, t) => { const it = HP.lib.kandinsky.items.find(i => i.id === id); return it ? geomOf(it, k, t) : null; };
HP.lib.kandinsky.poses = (id, t) => { const it = HP.lib.kandinsky.items.find(i => i.id === id); return it ? poses(it, t) : null; };

// ---------------------------------------------------------------- piece outlines (cover units, absolute) and painted shapes
function outlineOf(it, k) {
  return HP.memo('kand|path|' + k, () => {
    const d = PIECES[k], p = new Path2D();
    switch (d.kind) {
      case 'circle': p.arc(d.c[0], d.c[1], d.r, 0, 2 * Math.PI); break;
      case 'square': p.addPath((() => { const q = new Path2D(); q.rect(-54, -54, 108, 108); return q; })(), new DOMMatrix().translate(690, 890).rotate(15)); break;
      case 'nabla': p.moveTo(NX - NWD / 2, NTIP - NHT); p.lineTo(NX + NWD / 2, NTIP - NHT); p.lineTo(NX, NTIP); p.closePath(); break;
      case 'band': p.moveTo(XL, topY(XL)); p.lineTo(XR, topY(XR)); p.lineTo(XR, topY(XR) + TV); p.lineTo(XL, topY(XL) + TV); p.closePath(); break;
      case 'target': p.arc(1350, 680, 56, 0, 2 * Math.PI); break;
      case 'chk': for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { if ((r + c) % 2) continue; const q = new Path2D(); q.rect(-18, -18, 36, 36); p.addPath(q, new DOMMatrix().translate(1100, 270).rotate(-22).translate((c - 1.5) * 36, (r - 1.5) * 36)); } break;
      default: { const h = d.home; p.rect(h[0] - 60, h[1] - 60, 120, 120); }
    }
    return p;
  });
}
function paintShapeOf(it, k) {
  const d = PIECES[k];
  switch (d.kind) {
    case 'circle': return { shape: { kind: 'circle', cx: d.c[0], cy: d.c[1], r: d.r }, o: { style: d.r > 120 ? 'swirl' : 'swirl' } };
    case 'band': return { shape: { kind: 'band', x0: XL - 140, y0: topY(XL - 140) + TV / 2, x1: XR + 140, y1: topY(XR + 140) + TV / 2, w: 120 }, o: {} };
    case 'line': return { shape: { kind: 'line', pts: [d.a, d.b], w: d.w }, o: { widthK: 1.3 } };
    case 'arc': { const pts = []; for (let i = 0; i <= 12; i++) { const a = Math.PI + Math.PI * i / 12; pts.push([d.c[0] + Math.cos(a) * d.rr, d.c[1] + Math.sin(a) * d.rr]); } return { shape: { kind: 'line', pts, w: d.w }, o: { widthK: 1.25 } }; }
    case 'square': return { shape: { kind: 'rect', x: 636, y: 836, w: 108, h: 108, rot: 15 }, o: { angle: -18 } };
    case 'wm': return { shape: { kind: 'path', path: it.wmBody, bbox: [142.3, 1059.2, 1215.3, 214.5] }, o: { angle: -22, width: 150, under: .92 } };
  }
  return null;
}
const EDGE = { shape: { kind: 'line', pts: [[XL - 20, topY(XL - 20)], [XR + 20, topY(XR + 20)]], w: 12 }, o: { widthK: 1.25, dry: .05, gaps: .08 } };
// draw a piece's painted body: live strokes while painting (u < 1), the baked bitmap after
function drawPainted(it, ctx, k, color, u, alpha, spec) {
  const S = spec || paintShapeOf(it, k); if (!S) return false;
  const o = { ...S.o, color, unit: 1 / it.sc, key: `kand|${k}|${color}${spec ? '|x' : ''}` };
  ctx.save(); ctx.globalAlpha *= alpha;
  if (u >= 1) PL().drawBaked(ctx, PL().bakeShape(o.key, S.shape, o, it.sc)); else PL().paintShape(ctx, S.shape, u, o);
  ctx.restore(); return true;
}
function drawLineFlat(ctx, a, b, w, color, u = 1) {
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(lerp(a[0], b[0], u), lerp(a[1], b[1], u)); ctx.lineWidth = w; ctx.lineCap = 'butt'; ctx.strokeStyle = color; ctx.stroke();
}
// the flat (cover) body of a piece; st = pose (flip states, draw-on u, band edge, tilt)
function drawFlat(it, ctx, k, color, p, t, outline) {
  const d = PIECES[k]; ctx.fillStyle = color;
  switch (d.kind) {
    case 'circle': case 'nabla': case 'square': ctx.fill(outline || outlineOf(it, k)); break;
    case 'line': drawLineFlat(ctx, d.a, d.b, d.w, color, p.draw ? E.oCub(p.u) : 1); break;
    case 'arc': { const u = p.draw ? E.ioCub(p.u) : 1; ctx.beginPath(); ctx.arc(d.c[0], d.c[1], d.rr, Math.PI, Math.PI + Math.PI * u); ctx.lineWidth = d.w; ctx.lineCap = 'butt'; ctx.strokeStyle = color; ctx.stroke(); break; }
    case 'target': { const R = [56, 37, 19], C = [color, COL.cream, color]; R.forEach((r, i) => { const s = p.x.rings ? E.oBack(clamp((p.ringU ?? 1) - i * .25)) : 1; ctx.beginPath(); ctx.arc(1350, 680, r * Math.max(0, s), 0, 7); ctx.fillStyle = C[i]; ctx.fill(); }); break; }
    case 'chk': {
      const F = p.x.flip; let i = 0;
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { if ((r + c) % 2) continue;
        const uq = F ? pr(t, F.at + i * .055, F.dur ?? .18) : 1; i++; if (uq <= 0) continue;
        ctx.save(); const M = ctx.getTransform().translate(1100, 270).rotate(-22).translate((c - 1.5) * 36, (r - 1.5) * 36).rotate(lerp(90, 0, E.oCub(uq))).scale(E.oBack(uq)); ctx.setTransform(M); ctx.fillRect(-18, -18, 36, 36); ctx.restore(); }
      break;
    }
    case 'band': ctx.fill(outline || outlineOf(it, k)); break;
    case 'wm': ctx.fill(it.wmBody); break;
  }
}
function barTilt(it, t, s) { const c = it.cue.tilt; const v = c ? -22 * E.oBack(pr(t, c.at, .3), 2.2) : -22; return lerp(v, -22, s); }

// ---------------------------------------------------------------- draw the frame
function drawKand(it, t) {
  const ctx = it.cv.ctx; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H); ctx.globalAlpha = 1;
  const s = settleAt(it, t), P = poses(it, t), ink = inkCol(it, t);
  let G = artMatrix(it, t, s, P);
  if (s < 1) for (const h of HP.lib.kandinsky.hooks) if (h.art && (h.item === undefined || h.item === '*' || h.item === it.id) && t >= h.a - EPS && t < h.b - EPS) {
    const M = h.art(t, { item: it, settle: s, G }); if (M) G = (s > 0 ? lerpMatrix(M, new DOMMatrix(), s) : M).multiply(G);   // builder D: the whole item in frame px
  }
  const look = it.look === 'paint' ? 1 - s : 0;
  for (const k of it.names) {
    const p = P[k];
    // settle: every pose eases back to the cover
    if (s > 0) { if (p.thick) p.thick = lerp(p.thick, 1, s); p.dx *= 1 - s; p.dy *= 1 - s; p.rot *= 1 - s; p.sx = lerp(p.sx, 1, s); p.sy = lerp(p.sy, 1, s); p.op = lerp(p.op, 1, s); p.u = lerp(p.u, 1, s); if (s >= 1) { p.col = null; p.x = {}; p.draw = false; } }
    if (p.op <= 0.001 || p.sx === 0 || p.sy === 0) { if (k === 'kick') it.kickG.style.display = 'none'; continue; }
    const def = PIECES[k], color = p.col ? (COL[p.col] || p.col) : (INK.has(k) ? ink : COL[def.col]);
    let M = pieceMatrix(G, k, p);
    const hk = s < 1 ? hooksFor(it, k, t) : [];
    for (const h of hk) if (h.xf) {   // builder D's per-piece transform, in frame px about the piece centre
      const c = M.transformPoint(new DOMPoint(def.home[0], def.home[1])), q = { x: c.x, y: c.y, rot: p.rot, sx: p.sx, sy: p.sy, op: p.op };
      const r = h.xf(def, t, { ...q }) || q, f = 1 - s;
      const x2 = lerp(q.x, r.x ?? q.x, f), y2 = lerp(q.y, r.y ?? q.y, f), dr = ((r.rot ?? q.rot) - q.rot) * f, ksx = lerp(1, (r.sx ?? q.sx) / (q.sx || 1), f), ksy = lerp(1, (r.sy ?? q.sy) / (q.sy || 1), f);
      M = new DOMMatrix().translate(x2, y2).rotate(dr).scale(ksx, ksy).translate(-q.x, -q.y).multiply(M); p.op = lerp(p.op, r.op ?? p.op, f);
    }
    if (k === 'kick') { drawKicker(it, M, p, s); continue; }
    ctx.setTransform(M); ctx.globalAlpha = clamp(p.op);
    if (k === 'wm') { drawWordmark(it, ctx, color, p, t, s, look); continue; }
    if (p.x.rings) p.ringU = it.cue[k] ? pr(t, it.cue[k].at, (it.cue[k].dur ?? .24) * 1.6) : 1;
    // fills: builder D's fill hook, else painted (crossfading to flat while settling), else flat
    const info = { name: k, kind: def.kind, color, home: def.home, settle: s, sc: it.sc, item: it, path: null };
    let outline = null; for (const h of hk) if (h.outline) { const o = h.outline(def, t, { ...info, path: outlineOf(it, k) }); if (o) outline = o; }
    let filled = false;
    const fh = hk.find(h => h.fill);
    if (fh && ['circle', 'square', 'nabla', 'band', 'target'].includes(def.kind)) {
      ctx.save(); ctx.clip(outline || outlineOf(it, k)); ctx.globalAlpha = clamp(p.op) * (1 - s);
      filled = !!fh.fill(ctx, def, t, { ...info, path: outline || outlineOf(it, k) }); ctx.restore();
      if (filled && s > 0) { ctx.globalAlpha = clamp(p.op) * s; drawFlat(it, ctx, k, color, p, t, null); }
    }
    if (!filled) {
      const paintable = PAINTABLE.has(def.kind) && look > 0 && !(def.kind === 'circle' && def.r < 25);
      if (paintable && !(p.draw && p.u < 1 && def.kind !== 'line' && def.kind !== 'arc')) {
        if (s > 0) { ctx.globalAlpha = clamp(p.op) * s; drawFlat(it, ctx, k, color, { ...p, draw: false }, t, outline); }
        ctx.globalAlpha = clamp(p.op);
        drawPainted(it, ctx, k, color, p.u, look);
      } else drawFlat(it, ctx, k, color, p, t, outline);
    }
    if (k === 'band') drawBandExtras(it, ctx, P, t, s, look, ink, p);
  }
  // overlays on top of the pieces (the superposition burst); the river is drawn with the band
  for (const ov of it.overlays) if (ov.kind === 'superpose' && t >= ov.a - EPS && t < ov.b + .3) { ctx.setTransform(G); ctx.globalAlpha = 1 - s; drawSuperpose(it, ctx, ov, P, t, ink); }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
}
function drawWordmark(it, ctx, color, p, t, s, look) {
  const c = it.cue.wm, u = c && c.style === 'paint' ? p.u : 1;
  const tilt = barTilt(it, t, s), bc = it.barC;
  const bar = () => { ctx.save(); const M = ctx.getTransform().translate(bc[0], bc[1]).skewY(tilt).translate(-bc[0], -bc[1]); ctx.setTransform(M); ctx.fillStyle = color; ctx.fill(it.wmBar); ctx.restore(); };
  if (look > 0) {
    if (s > 0) { const A = ctx.globalAlpha; ctx.globalAlpha = A * s; ctx.fillStyle = color; ctx.fill(it.wmBody); bar(); ctx.globalAlpha = A; }
    const A = ctx.globalAlpha; drawPainted(it, ctx, 'wm', color, u, look);
    ctx.globalAlpha = A * look * clamp(u * 1.6 - .5); bar(); ctx.globalAlpha = A;
  } else { ctx.fillStyle = color; ctx.fill(it.wmBody); bar(); }
}
function drawKicker(it, M, p, s) {
  const g = it.kickG; g.style.display = '';
  setA(g, { transform: `matrix(${M.a},${M.b},${M.c},${M.d},${M.e},${M.f})`, opacity: clamp(p.op).toFixed(3) });
}

// ---------------------------------------------------------------- the band's edge rule, and the river (flow + swimming vectors)
function drawBandExtras(it, ctx, P, t, s, look, ink, p) {
  const c = it.cue.band, ue = c ? (c.style === 'paint' ? E.oExpo(pr(t, c.at + .04, .12)) : (c.style === 'slam' ? 1 : lerp(.62, 1, E.oExpo(pr(t, c.at, .07))))) : 1;
  if (ue > 0) {
    if (look > 0 && ue >= 1 && s < 1) { if (s > 0) { const A = ctx.globalAlpha; ctx.globalAlpha = A * s; drawLineFlat(ctx, [XL, topY(XL)], [XR, topY(XR)], 12, ink); ctx.globalAlpha = A; } drawPainted(it, ctx, 'band', ink, 1, look, EDGE); }
    else if (look > 0 && ue < 1) drawPainted(it, ctx, 'band', ink, ue, look, EDGE);
    else drawLineFlat(ctx, [XL, topY(XL)], [XR, topY(XR)], 12, ink, ue);
  }
  for (const ov of it.overlays) if (ov.kind === 'river' && t >= ov.a - EPS && t < ov.b + .3) drawRiver(it, ctx, ov, t, s, ink, p);
}
// river fields (move "river"): from, to, flow (140 cover units a beat), streaks (54), vectors (7), colors, and (polisher, opt-in)
// size (1: vector length/width/head multiplier), trail (0: comet trail length in vector lengths, fading), stagger (0: beats
// between vector entries, e.g. 0.5 = one vector joins the school on every 8th), lanes (70: spread across the band), flowK (1:
// streak width/alpha multiplier), ripple (0: number of sine ripple lines flowing along the band, so it reads as water)
function drawRiver(it, ctx, ov, t, s, ink, bp) {
  const m = ov.m, env = smooth(pr(t, ov.a, .25)) * (1 - smooth(pr(t, ov.b, .3))) * (1 - s); if (env <= 0) return;
  // fixer r2: a thickened band (move "thicken"): clip to the wide band, then draw in the band's un-thickened matrix with every
  // across-the-band offset (lanes, streaks, ripples, the leap) spread by the thickness, so the vectors keep their shape
  const TH = bp && bp.thick ? bp.thick : 1;
  let M0 = null; if (TH !== 1) { const h = PIECES.band.home; M0 = ctx.getTransform().translate(h[0], h[1]).rotate(-22).scale(1, 1 / TH).rotate(22).translate(-h[0], -h[1]); }
  const b = HP.beatAt(t), fb = Math.floor(b), fr = b - fb, per = m.flow ?? 140;
  const F = per * (fb + .55 * E.oExpo(fr) + .45 * fr);            // surges on every beat, keeps gliding between
  const U = BAND_U, N = BAND_N, C = BAND_C, Lh = 1050, fk = m.flowK ?? 1;
  const at = (sAl, q) => [C[0] + U[0] * sAl + N[0] * q, C[1] + U[1] * sAl + N[1] * q];
  const wrap = x => ((x + Lh) % (2 * Lh) + 2 * Lh) % (2 * Lh) - Lh;
  ctx.save(); ctx.clip(outlineOf(it, 'band')); if (M0) ctx.setTransform(M0);
  const R = HP.rng(it.id, 'river'), n = Math.round((m.streaks ?? 54) * Math.sqrt(TH));
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const q = (R() - .5) * 108 * TH, len = 40 + R() * 200, k = .7 + R() * .8, x0 = R() * 2 * Lh, kind = R();
    const sA = wrap(x0 + F * k), col = kind < .45 ? `rgba(242,235,221,${Math.min(1, .75 * fk)})` : kind < .8 ? PL().rgba(PL().shade(COL.yellow, .28), Math.min(1, .55 * fk)) : PL().rgba(COL.orange, Math.min(1, .35 * fk));
    ctx.strokeStyle = col; ctx.globalAlpha = env * (s < 1 ? 1 : 0); ctx.lineWidth = (kind < .45 ? 2.5 + R() * 2 : 3 + R() * 4) * fk;
    ctx.beginPath(); for (let j = 0; j <= 6; j++) { const sj = sA - len * j / 6, qq = q + 4 * Math.sin(sj / 55 + b * Math.PI); const pt = at(sj, qq); j ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1]); } ctx.stroke();
  }
  // ripples: long sine lines across the band's width that travel with the current (water, not a stripe)
  const nr = m.ripple ?? 0;
  for (let i = 0; i < nr; i++) {
    const q0 = (-44 + 88 * (i + .5) / nr) * TH, ph = F * (.9 + .25 * (i % 3)) / 60, amp = 7 + 3 * (i % 2);
    ctx.globalAlpha = env * (s < 1 ? 1 : 0) * (i % 2 ? .5 : .7); ctx.strokeStyle = i % 2 ? PL().rgba(PL().shade(COL.yellow, .35), .9) : 'rgba(250,246,236,.95)'; ctx.lineWidth = 3.2 * fk;
    ctx.beginPath(); for (let j = 0; j <= 84; j++) { const sj = -Lh + j * 2 * Lh / 84, qq = q0 + amp * Math.sin(sj / 38 - ph + i * 1.7); const pt = at(sj, qq); j ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1]); } ctx.stroke();
  }
  ctx.restore();
  const Mb = ctx.getTransform(); if (M0) ctx.setTransform(M0);
  // swimming vectors: arrows riding the current (tails wiggling on 8ths); one leaps out of the river on each beat
  const nv = m.vectors ?? 7, cols = m.colors || ['ink', 'pink', 'blue', 'cream', 'violet', 'orange', 'ink'], sz = m.size ?? 1, lanes = m.lanes ?? 70, trail = m.trail ?? 0, stg = (m.stagger ?? 0) * BP();
  for (let j = 0; j < nv; j++) {
    const r = HP.rng(it.id, 'vec', j), lane = (r() - .5) * lanes * TH, len = (80 + r() * 50) * sz, k = 1.15 + r() * .6, x0 = r() * 2 * Lh, w = (9 + r() * 4) * sz;
    const ja = ov.a + j * stg, pop = stg > 0 ? E.oBack(pr(t, ja, .16), 2.2) : 1; if (pop <= 0) continue;
    let sA = wrap(x0 + F * k), q = lane, tilt = 0;
    const leapB = j + nv * Math.floor((fb - j) / nv);   // vector j leaps on beats j, j + nv, ... (one per beat across the school)
    if (fb === leapB) { const g = fr; q -= 150 * sz * 4 * g * (1 - g); tilt = -40 * (1 - 2 * g); }
    const col = COL[cols[j % cols.length]] || cols[j % cols.length], c2 = col === COL.cream && ink === COL.cream ? COL.ink : col;
    const pts = []; const segs = 8;
    for (let i = 0; i <= segs; i++) { const f = i / segs, wig = 10 * sz * Math.sin(2 * Math.PI * (2 * b) - i * .9) * f; const a = tilt * D2R; const ds = -len * f * pop; pts.push(at(sA + ds * Math.cos(a), q + ds * Math.sin(a) + wig)); }
    if (trail > 0 && fb !== leapB) {   // comet trail: the path just swum, thinning and fading behind the tail
      const tl = trail * len, nseg = 10, tail = pts[segs];
      ctx.lineCap = 'round';
      for (let i = 0; i < nseg; i++) {
        const f0 = i / nseg, f1 = (i + 1) / nseg, p0 = at(sA - len * pop - tl * f0, q + 6 * sz * Math.sin(2 * Math.PI * b - f0 * 3)), p1 = at(sA - len * pop - tl * f1, q + 6 * sz * Math.sin(2 * Math.PI * b - f1 * 3));
        ctx.globalAlpha = env * pop * .55 * (1 - f0); ctx.strokeStyle = c2; ctx.lineWidth = w * (1 - .85 * f0);
        ctx.beginPath(); ctx.moveTo(i ? p0[0] : tail[0], i ? p0[1] : tail[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
      }
    }
    ctx.globalAlpha = env; ctx.strokeStyle = c2; ctx.fillStyle = c2; ctx.lineWidth = w * pop; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach((pt, i) => i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])); ctx.stroke();
    const h0 = pts[0], h1 = pts[1], ang = Math.atan2(h0[1] - h1[1], h0[0] - h1[0]), hs = w * 2.6 * pop;
    if (sz > 1.2) {   // an ink keyline under big heads, so pink/orange heads read on the yellow band
      ctx.save(); ctx.globalAlpha = env * .9; ctx.strokeStyle = c2 === COL.ink ? '#F7F1E3' : COL.ink; ctx.lineWidth = 5 * sz / 2; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(h0[0] + Math.cos(ang) * hs * .9, h0[1] + Math.sin(ang) * hs * .9); ctx.lineTo(h0[0] + Math.cos(ang + 2.4) * hs, h0[1] + Math.sin(ang + 2.4) * hs); ctx.lineTo(h0[0] + Math.cos(ang - 2.4) * hs, h0[1] + Math.sin(ang - 2.4) * hs); ctx.closePath(); ctx.stroke(); ctx.restore();
      ctx.fillStyle = c2;
    }
    ctx.beginPath(); ctx.moveTo(h0[0] + Math.cos(ang) * hs * .9, h0[1] + Math.sin(ang) * hs * .9); ctx.lineTo(h0[0] + Math.cos(ang + 2.4) * hs, h0[1] + Math.sin(ang + 2.4) * hs); ctx.lineTo(h0[0] + Math.cos(ang - 2.4) * hs, h0[1] + Math.sin(ang - 2.4) * hs); ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.setTransform(Mb);
}

// ---------------------------------------------------------------- the superposition burst: n feature vectors in 2 dimensions
// (more features than dimensions, "Toy Models of Superposition"), bursting out on the beat, lighting up in turn on 16ths, with an
// interference shimmer (two ring sets beating against each other) inside a boiling pencil circle. Fields: at, to, n (7), r (330),
// center ("pair" = the pink/black pair's centre, or [x, y] cover units), every (0.25 beat per flash), colors
function drawSuperpose(it, ctx, ov, P, t, ink) {
  const m = ov.m, n = m.n ?? 7, R = m.r ?? 330, every = (m.every ?? .25) * BP();
  let c = m.center;
  if (!c || c === 'pair') { const a = pos(P, 'pink'), b = pos(P, 'black'), wa = 240 * 240, wb = 188 * 188; c = it.names.includes('pink') ? [(a[0] * wa + b[0] * wb) / (wa + wb), (a[1] * wa + b[1] * wb) / (wa + wb)] : ART_C; }
  const out = E.iExpo(pr(t, ov.b, .22)), env = 1 - out; if (env <= 0) return;
  const lt = t - ov.a, bb = HP.beatAt(t), rot0 = (m.turn ?? 360 / n / 2) * Math.floor(bb) * D2R + .15 * lt;
  let cols = (m.colors || ['pink', 'blue', 'teal', 'orange', 'violet', 'yellow', 'red']).map(x => COL[x] || x);
  const lit = Math.floor(lt / every) % n, fl = (lt % every) / every;
  // fixer r2: "flash": for 2 frames on every beat every vector takes the next colours of the cycle, thicker, with a bright ring;
  // "reach": the vectors run past the unit circle (x reach), fanning out toward the frame edges
  const fb = Math.floor(bb + 1e-6), onFlash = m.flash && lt > .05 && (t - HP.beat(fb)) < 2 / HP.FPS + EPS && (t - HP.beat(fb)) >= -EPS;
  if (onFlash) cols = cols.map((_, k) => cols[(k + fb) % cols.length]);
  const reach = m.reach ?? 1;
  // interference shimmer
  const sh = smooth(pr(lt, 0, .2)) * env;
  if (sh > 0) {
    ctx.save(); ctx.beginPath(); ctx.arc(c[0], c[1], R * 1.04, 0, 7); ctx.clip();
    ctx.lineWidth = 3.2; ctx.strokeStyle = ink === COL.cream ? 'rgba(242,235,221,.5)' : 'rgba(21,19,31,.5)';
    const ph = HP.boil(t) * 1.7, off = 26 + 10 * Math.sin(ph);
    for (const sgn of [-1, 1]) { const cx = c[0] + sgn * Math.cos(ph * .6) * off, cy = c[1] + sgn * Math.sin(ph * .6) * off;
      ctx.globalAlpha = .38 * sh; for (let rr = 10 + (ph * 3) % 15; rr < R * 1.5; rr += 15) { ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 7); ctx.stroke(); } }
    ctx.restore();
  }
  // the unit circle in pencil (boiling on twos)
  PL().pencil(ctx, [{ kind: 'circle', cx: c[0], cy: c[1], r: R, p: E.ioCub(pr(lt, 0, .3)) * env, width: 5.5 / it.sc, color: ink === COL.cream ? '#F2EBDD' : '#2A2832' }], { key: it.id + '|sup', t, alpha: .9, jitter: 2.4 / it.sc });
  // the feature vectors
  ctx.lineCap = 'round';
  for (let k = 0; k < n; k++) {
    const u = E.oBack(pr(lt, k * .025, .22), 1.8) * env, a = rot0 + k * 2 * Math.PI / n, isLit = k === lit && lt > .2;
    if (u <= 0) continue;
    const L = R * u * reach * (isLit ? 1.08 + .1 * Math.exp(-fl * 4) : 1) * (onFlash ? 1.06 : 1), x = c[0] + Math.cos(a) * L, y = c[1] + Math.sin(a) * L, w = (isLit ? 20 : 11) * (m.wK ?? 1) * (onFlash ? 1.5 : 1);
    ctx.globalAlpha = lt > .2 && !isLit && !onFlash ? .55 : 1; ctx.strokeStyle = cols[k % cols.length]; ctx.fillStyle = cols[k % cols.length]; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(x - Math.cos(a) * w * 1.5, y - Math.sin(a) * w * 1.5); ctx.stroke();
    const hs = w * 2.4; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * hs * .5, y + Math.sin(a) * hs * .5); ctx.lineTo(x + Math.cos(a + 2.5) * hs, y + Math.sin(a + 2.5) * hs); ctx.lineTo(x + Math.cos(a - 2.5) * hs, y + Math.sin(a - 2.5) * hs); ctx.closePath(); ctx.fill();
    if (isLit) { ctx.globalAlpha = .9 * Math.exp(-fl * 2.5); ctx.beginPath(); ctx.arc(x, y, 30 + 40 * fl, 0, 7); ctx.lineWidth = 6; ctx.stroke(); }
  }
  if (onFlash) { ctx.globalAlpha = .85; ctx.strokeStyle = cols[0]; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(c[0], c[1], R * 1.02, 0, 7); ctx.stroke(); ctx.strokeStyle = '#FFF8EA'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(c[0], c[1], R * 1.02, 0, 7); ctx.stroke(); }
  ctx.globalAlpha = 1; ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(c[0], c[1], 16 * env, 0, 7); ctx.fill();
}

// ============================================================ "kandhook": a demo of builder D's hooks (and a test of them)
// {t0, t1, item (kand id), pieces, fill: 'stripes' (marbling stand-in), wobble (cover units; a liquid edge), swirl: [x, y] frame px
//  (pieces spiral toward the point: a black-hole stand-in), artSpin: [x, y] frame px (the whole item turns and shrinks about it)}: D replaces this with fx/fluid.js and fx/singularity.js.
HP.register('kandhook', {
  build(it) {
    const d = it.d, L = HP.lib.kandinsky;
    L.hook({ item: d.item, pieces: d.pieces, t0: it.t0, t1: it.t1,
      fill: d.fill === 'stripes' ? (ctx, piece, t, info) => { const [bx, by] = piece.c || piece.home, r = piece.r || 120, ph = (t - it.t0) * 90;
        ctx.fillStyle = info.color; ctx.fillRect(bx - r * 1.5, by - r * 1.5, r * 3, r * 3);
        ctx.strokeStyle = 'rgba(242,235,221,.35)'; ctx.lineWidth = r * .09;
        for (let k = -6; k <= 6; k++) { ctx.beginPath(); for (let i = 0; i <= 24; i++) { const x = bx - r * 1.4 + i * r * 2.8 / 24, y = by + k * r * .22 + Math.sin(i * .5 + ph * .05 + k) * r * .08; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
        return true; } : undefined,
      outline: d.wobble ? (piece, t, info) => { if (piece.kind !== 'circle') return null; const p = new Path2D(), r = piece.r, [cx, cy] = piece.c, w = d.wobble * (1 - info.settle);
        for (let i = 0; i <= 64; i++) { const a = i / 64 * 2 * Math.PI, rr = r + w * Math.sin(5 * a + t * 6) + w * .6 * Math.sin(3 * a - t * 4); i ? p.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : p.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
        p.closePath(); return p; } : undefined,
      xf: d.swirl ? (piece, t, q) => { const u = E.iCub(pr(t, it.t0, it.t1 - it.t0)), [X, Y] = d.swirl, a = u * 4, vx = q.x - X, vy = q.y - Y, c = Math.cos(a), s = Math.sin(a), k = 1 - u;
        return { ...q, x: X + (vx * c - vy * s) * k, y: Y + (vx * s + vy * c) * k, rot: q.rot + u * 300, sx: q.sx * (1 - .9 * u), sy: q.sy * (1 - .9 * u) }; } : undefined,
      art: d.artSpin ? (t, info) => { const u = E.ioCub(pr(t, it.t0, it.t1 - it.t0)), [X, Y] = d.artSpin; return new DOMMatrix().translate(X, Y).rotate(u * 120).scale(1 - .5 * u).translate(-X, -Y); } : undefined });
  },
  draw() {},
});

// ============================================================ the stub "orbit" type (kept: plain discs orbiting a centre)
const DISCS = { pink: [172, 'pink'], black: [135, 'ink'], core: [53, 'orange'], blue: [122, 'blue'], teal: [43, 'teal'], smallO: [22, 'orange'] };
HP.register('orbit', {
  ownMotion: true,
  build(it) {
    const d = it.d; it.svgEl = it.svg();
    it.pieces = (d.pieces || ['pink', 'black', 'blue']).map(p => typeof p === 'string' ? { r: DISCS[p][0], color: COL[DISCS[p][1]] } : p);
    it.discs = it.pieces.map(p => sv('circle', { r: p.r, fill: p.color }, it.svgEl));
    it.steps = onTimes(d.steps || { from: 0, to: 15 }).filter(x => x >= it.t0 - EPS && x < it.t1);
    for (const x of it.steps) it.mark(x, 'orbit-step');
  },
  draw(it, t) {
    const d = it.d, n = it.pieces.length, step = (d.stepDeg ?? 45) * D2R, { n: k, last } = lastStep(t, it.steps);
    const ang = (k - 1 + E.oBack(pr(t, last, .29), 2.2)) * step * (k ? 1 : 0);
    it.discs.forEach((c, i) => { const a = ang + i * 2 * Math.PI / n, R = d.radius ?? 260; setA(c, { cx: (d.cx ?? 540) + R * Math.cos(a), cy: (d.cy ?? 900) + R * Math.sin(a) * .8 }); });
  },
});
})();
