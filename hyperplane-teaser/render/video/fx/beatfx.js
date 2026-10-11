/* fx/beatfx.js  [BUILDER A]  beat effects: "something visually striking on EVERY beat"
 * =================================================================================================================
 * BUILD.md REVISION 2: something striking on every beat (bar downbeats bigger, 8ths for small things), gentler but alive in the
 * prelude. research/rev2/style.md 3 (the beat hierarchy), 4.3 (splat sizes per beat weight), 6 (no shake/splat in the 0.4 s a new
 * headline must be read; nothing on the final cover hold).
 *
 * 1) The BEAT TRACK (EDL top level "beatfx": [...], or an "fx" entry {"fx": "beatfx", "on": ..., ...}):
 *    {"id", "from": "hb:0", "to": "hb:31", "pattern": "riff" | "verse" | "chorus" | "refrain" | "prelude" | "god" | "outro" | "calm",
 *     "intensity": 1, "eighths": false (also act on the 8ths: droplets, pencil ticks), "layer": "paint" (shared canvas for the drawn
 *     effects), "zones": [[x, y, w, h], ...] (where drawn effects may land; default the frame margins), "calm": "auto" | false |
 *     [[t0, t1], ...] (auto: the 0.4 s after a headline/screen/quote/chart/equation/caption item enters), "skip": [beat indices],
 *     "map": {role: {"vis": [[effect, weight], ...], "cam": [[effect, weight], ...]}} (override a pattern's roles), "no": [effects]}
 *    Every beat in range gets a ROLE from song/hits.json (bar downbeat, crash = accented downbeat, backbeat = snare, fill = the last
 *    beat of a 4-bar phrase or a "fill" flag, beat, off = the 8th between; vocalOn / vocalOff when the vocal starts / stops) and
 *    from its role two effects: one VISIBLE (drawn or full-frame: guaranteed on every beat) and one CAMERA move. Choices are seeded
 *    by the track id and beat index, weighted per pattern, and never repeat the previous beat's effect in the same slot.
 * 2) Effects (usable alone too, as EDL "fx" entries {"fx": name, "at" | "on", ...params}):
 *    visible: splat (bar-sized), splatS (beat-sized), droplets (8th spray), stamp (ink stamp), scribble (pencil, boils on twos),
 *             tick (a small pencil mark), grain (grain burst), tint (palette colour flash), invert (1-frame colour flip), flash,
 *             jump (the kand pieces hop; else a camera jolt), burst (kand pieces kick out and spring back)
 *    camera:  punch (zoom impulse), shake, snap (rotate snap), spin (rotation impulse), jolt (push), zoom (anticipating zoom pulse)
 * Marks every scheduled effect (HP.mark(t, track id, 'beatfx:<effect>')) for check/beatcheck.py.
 * EXPORTS HP.lib.beatfx = {isBar, roleOf, PATTERNS, EFFECTS, plan(track) -> [{i, t, role, vis, cam}], tracks}
 */
(function () {
'use strict';
const { clamp, lerp, pr, el } = HP.u, E = HP.ease;
const W = HP.W, H = HP.H, EPS = HP.EPS, COL = HP.COL;
const PL = () => HP.lib.paint;
const BP = () => HP.hits.period || 0.4839;
const mod = (a, n) => ((a % n) + n) % n;
const isBar = b => b && Math.abs(b.i - Math.round(b.i)) < 1e-6 && (b.beat_in_bar !== undefined ? b.beat_in_bar === 0 : mod(Math.round(b.i), 4) === 0);
const each = (ev, fn) => ev.times.forEach((t, k) => fn(t, ev.beats ? ev.beats[k] : null, k));

// ============================================================ roles
function roleOf(b, prev) {
  if (b.sub || Math.abs(b.i - Math.round(b.i)) > 1e-6) return 'off';
  const raw = HP.hits.raw || {}, s = b.song ?? HP.beatSong(b.i), i = Math.round(b.i);
  const bar = b.downbeat ?? isBar(b);
  const crash = b.crash || (raw.crashes || []).some(c => Math.abs(c - s) < .04);
  const fill = b.fill === true || (Array.isArray(raw.fills) ? raw.fills.some(([a, e]) => s >= a - .02 && s < e + .02) : mod(i, 16) === 15);
  if (b.pulse !== undefined) return b.pulse >= .7 ? 'bar' : b.pulse >= .35 ? 'beat' : 'off';   // prelude pulse events
  if (crash) return 'crash';
  if (bar) return 'bar';
  if (fill) return 'fill';
  if (b.snare) return 'backbeat';
  return 'beat';
}

// ============================================================ patterns: role -> weighted visible effects and camera moves
const P = (vis, cam) => ({ vis, cam });
const PATTERNS = {
  riff: {
    crash: P([['splat', 4], ['invert', 2]], [['shake', 3], ['punch', 2]]),
    bar: P([['splat', 5], ['invert', 1]], [['shake', 3], ['punch', 2]]),
    backbeat: P([['splatS', 3], ['stamp', 3], ['jump', 3], ['tint', 1]], [['snap', 3], ['punch', 2], ['jolt', 1]]),
    beat: P([['scribble', 3], ['jump', 2], ['grain', 1], ['droplets', 2], ['burst', 1]], [['punch', 3], ['zoom', 2], ['jolt', 1]]),
    fill: P([['grain', 2], ['tint', 2], ['burst', 2]], [['spin', 3], ['shake', 1]]),
    off: P([['droplets', 4], ['tick', 1]], []),
    vocalOn: P([['flash', 1]], []),
  },
  verse: {   // darker, a notch lower: ink/cream splats, stamps, pencil
    crash: P([['splat', 3], ['flash', 2]], [['shake', 2], ['punch', 2]]),
    bar: P([['splat', 3], ['stamp', 2], ['flash', 1]], [['shake', 2], ['punch', 2]]),
    backbeat: P([['stamp', 3], ['scribble', 2], ['splatS', 2]], [['snap', 2], ['punch', 2]]),
    beat: P([['scribble', 3], ['tick', 2], ['grain', 2], ['droplets', 1]], [['punch', 3], ['zoom', 1]]),
    fill: P([['grain', 2], ['tint', 1]], [['spin', 2]]),
    off: P([['tick', 2], ['droplets', 1]], []),
  },
  chorus: {
    crash: P([['splat', 4], ['invert', 2], ['tint', 1]], [['shake', 3], ['punch', 2]]),
    bar: P([['splat', 5], ['tint', 1]], [['shake', 3], ['punch', 2]]),
    backbeat: P([['splatS', 3], ['jump', 2], ['stamp', 2], ['tint', 1]], [['snap', 3], ['punch', 2]]),
    beat: P([['droplets', 2], ['scribble', 2], ['jump', 2], ['grain', 1]], [['punch', 3], ['zoom', 2], ['jolt', 1]]),
    fill: P([['tint', 2], ['grain', 2], ['burst', 1]], [['spin', 2], ['shake', 1]]),
    off: P([['droplets', 2], ['tick', 1]], []),
    vocalOn: P([['flash', 1]], []),
  },
  prelude: {   // the gentle intro pulse (~0.49 s, swelling from ~15 s): soft blooms, grain, pencil marks, ink stamps, tiny zoom pulses;
    // no shake/splat. Polisher: the drawn accents are pencil scribbles and stamps (110-190 px), not only 1-2 px-looking ticks
    crash: P([['flash', 2], ['stamp', 1], ['scribble', 1]], [['punch', 1]]),
    bar: P([['flash', 2], ['scribble', 2], ['stamp', 1]], [['punch', 2], ['zoom', 1]]),
    backbeat: P([['scribble', 2], ['stamp', 1], ['tick', 1]], [['punch', 2]]),
    beat: P([['tick', 2], ['scribble', 2], ['grain', 1]], [['zoom', 1], ['punch', 1]]),
    fill: P([['scribble', 2], ['grain', 1]], [['zoom', 1]]),
    off: P([['tick', 1]], []),
  },
  god: {   // "God, it's brutal out here": sparse, dramatic
    crash: P([['invert', 2], ['flash', 2]], [['shake', 2]]),
    bar: P([['flash', 2], ['invert', 1]], [['shake', 2], ['punch', 1]]),
    backbeat: P([['grain', 2], ['flash', 1]], [['punch', 2]]),
    beat: P([['grain', 2], ['tick', 1]], [['punch', 2]]),
    fill: P([['grain', 1]], [['spin', 1]]),
    off: P([['tick', 1]], []),
  },
  outro: {   // the instrumental with the logo reassembling: the pieces themselves move; splats stay in the margins
    crash: P([['splat', 3], ['flash', 1]], [['shake', 2], ['punch', 2]]),
    bar: P([['splat', 3], ['burst', 2]], [['shake', 2], ['punch', 2]]),
    backbeat: P([['jump', 3], ['splatS', 2], ['droplets', 1]], [['punch', 2], ['snap', 1]]),
    beat: P([['droplets', 2], ['jump', 2], ['tick', 1]], [['punch', 2], ['zoom', 1]]),
    fill: P([['burst', 2], ['grain', 1]], [['spin', 1]]),
    off: P([['droplets', 1]], []),
  },
  calm: {   // while a fact is being read: grain and margin ticks only, a small zoom pulse
    crash: P([['grain', 2], ['tick', 1]], [['punch', 1]]), bar: P([['grain', 2], ['tick', 1]], [['punch', 1]]),
    backbeat: P([['tick', 2], ['grain', 1]], [['punch', 1]]), beat: P([['tick', 2], ['grain', 1]], [['punch', 1]]),
    fill: P([['grain', 1]], [['punch', 1]]), off: P([['tick', 1]], []),
  },
};
PATTERNS.refrain = PATTERNS.chorus;
const CALM_OK = new Set(['grain', 'tick', 'punch', 'zoom', 'flash']);
const FOOTAGE_TYPES = new Set(['clip', 'image', 'screen', 'screens', 'broll', 'pile', 'headline', 'quote', 'pullquote', 'chart', 'equation']);
const factOnScreen = t => HP.ITEMS.some(it => FOOTAGE_TYPES.has(it.type) && t >= it.t0 - EPS && t < it.t1 - EPS);
const FACT_TYPES = new Set(['headline', 'screen', 'screens', 'pile', 'quote', 'pullquote', 'caption', 'ticker', 'chart', 'equation', 'words', 'image', 'karaoke', 'highlight']);

// ============================================================ camera impulses with a visibility cut-off (t-pure HP.cam.add sources)
function camImpulse(t, kind, amt, decay) {
  const cut = kind === 'zoom' ? .35 / 960 : .04, life = decay * Math.log(Math.abs(amt) / cut);
  if (!(life > 0)) return;
  HP.cam.add(x => { if (x < t - EPS || x > t + life) return null; const a = amt * Math.exp(-(x - t) / decay); return kind === 'zoom' ? { zoom: 1 + a } : { rot: a }; });
}
HP.lib.camImpulse = camImpulse;

// ============================================================ drawn effects (scheduled at build, drawn in the 'post' hook)
const DRAW = [];          // {t0, t1, layer, draw(ctx, t)}
const OVER = [];          // full-frame overlays: {t0, t1, kind: 'grain' | 'tint' | 'invert', amp, color}
const ZONES = [[40, 150, 1000, 210], [40, 1590, 1000, 260], [10, 420, 170, 1080], [900, 420, 170, 1080]];
// a seeded point in the zones, away from the "avoid" rects (and the wordmark/kicker of any kand item) by at least `pad` px
function spot(key, zones, avoid, pad = 40) {
  const Z = zones || ZONES, r = HP.rng('beatfx-spot', key), A = [...(avoid || []), ...autoAvoid()];
  let best = null, bd = -1;
  for (let k = 0; k < 12; k++) {
    const z = Z[Math.floor(r() * Z.length) % Z.length], p = [z[0] + r() * z[2], z[1] + r() * z[3]];
    let d = 1e9; for (const [ax, ay, aw, ah] of A) { const dx = Math.max(ax - p[0], 0, p[0] - ax - aw), dy = Math.max(ay - p[1], 0, p[1] - ay - ah); d = Math.min(d, Math.hypot(dx, dy)); }
    if (d >= pad) return p; if (d > bd) { bd = d; best = p; }
  }
  return best;
}
let AUTO = null;
function autoAvoid() {   // every kand item's pieces at home (frame px; not the full-bleed band) and its wordmark + kicker: splats and stamps
  if (AUTO) return AUTO; AUTO = [];   // land around the logo, never on the type
  for (const it of ((HP.lib.kandinsky && HP.lib.kandinsky.items) || [])) {
    if (it.d.avoid === false) continue;
    for (const k of ['pink', 'black', 'blue', 'teal', 'core', 'smallO', 'square', 'target', 'chk', 'nabla']) { const g = HP.lib.kandinsky.geom(it.id, k); if (g) AUTO.push([g.cx - g.w / 2, g.cy - g.h / 2, g.w, g.h]); }
    const g = HP.lib.kandinsky.geom(it.id, 'wm'); if (g) AUTO.push([g.cx - g.w / 2 - 20, g.cy - g.h / 2 - 30, g.w + 40, g.h + 150]);
  }
  return AUTO;
}
const dark = t => HP.themeAt(t) === 'dark';
function palette(t, kind) {
  if (dark(t)) return kind === 'ink' ? ['cream', 'yellow', 'pink'] : ['pink', 'yellow', 'teal', 'orange', 'cream'];
  return kind === 'ink' ? ['ink', 'red', 'blue'] : kind === 'small' ? ['pink', 'orange', 'blue', 'yellow', 'ink'] : ['pink', 'orange', 'blue', 'yellow'];
}
function fadeHold(t) { const fh = HP.EDL.finalHold; if (!fh) return 1; return 1 - pr(t, HP.T(fh[0]) - .3, .3); }
function inHold(t) { const fh = HP.EDL.finalHold; return fh ? t >= HP.T(fh[0]) - .3 - EPS : false; }

// ---- each effect: fn(t, o) where o = {key, amp (intensity x role weight), role, zones, layer, b (beat)}; returns true if it fires
const EFFECTS = {
  // camera. Zoom and rotation go through HP.cam.add sources that switch off once the move is below a visible size (0.35 px at the
  // frame edge, 0.04 deg): core's impulses keep a sub-pixel scale/rotation alive for ~a beat, and a rotated or scaled #cam layer is
  // resampled in software on every frame (measured: +200 ms a frame while any rotation is live)
  punch(t, o) { camImpulse(t, 'zoom', .035 * o.amp, .1); HP.mark(t, 'cam', 'punch'); return true; },
  shake(t, o) { HP.cam.hit(t, 8 * o.amp, .1); return true; },
  snap(t, o) { camImpulse(t, 'rot', (HP.rand(o.key, 'snap') < .5 ? -1 : 1) * 1.6 * o.amp, .07); HP.mark(t, 'cam', 'snap'); return true; },
  spin(t, o) { camImpulse(t, 'rot', (HP.rand(o.key, 'spin') < .5 ? -1 : 1) * 3.2 * o.amp, .16); HP.mark(t, 'cam', 'spin'); return true; },
  jolt(t, o) { const a = HP.rand(o.key, 'jolt') * 2 * Math.PI; HP.cam.jolt(t, Math.cos(a) * 16 * o.amp, Math.sin(a) * 16 * o.amp, .09); return true; },
  zoom(t, o) {   // anticipation: the frame eases in over the 8th before the beat, then snaps back on it
    const a = t - BP() / 2, k = .025 * o.amp;
    HP.cam.add(x => (x >= a && x < t + .1) ? { zoom: x < t ? 1 + k * E.iCub(pr(x, a, t - a)) : 1 + k * (1 - E.oExpo(pr(x, t, .1))) } : null);
    HP.mark(t, 'cam', 'zoom'); return true;
  },
  flash(t, o) { HP.flash(t, (o.role === 'bar' || o.role === 'crash' ? .5 : .28) * Math.min(1.3, o.amp), .06, dark(t) ? '#FFFFFF' : '#FFFFFF'); return true; },
  // full-frame overlays (unshaken, #fx)
  grain(t, o) {   // a grain burst on the ground (the paint layer, so under real screenshots and footage: no grain on the facts)
    const amp = Math.min(1, .8 * o.amp);
    DRAW.push({ t0: t, t1: t + .16, layer: o.layer, draw: (ctx, x) => { const f = (x - t) * HP.FPS, a = amp * Math.exp(-f / 1.6) * fadeHold(x); if (a < .02) return;
      ctx.save(); ctx.globalAlpha = a; ctx.imageSmoothingEnabled = false; ctx.drawImage(grainTile(HP.frameNo(x) % 4, dark(x)), 0, 0, W, H); ctx.restore(); } });
    return true;
  },
  tint(t, o) { OVER.push({ t0: t, t1: t + .12, kind: 'tint', amp: Math.min(.6, .38 * o.amp), color: COL[HP.pick(['pink', 'blue', 'yellow', 'teal'], o.key, 'tint')] }); return true; },
  invert(t, o) { OVER.push({ t0: t, t1: t + 2 / HP.FPS + EPS, kind: 'invert', amp: 1 }); return true; },
  // drawn on the paint layer
  splat(t, o, small) {
    const big = !small, R = (big ? lerp(150, 190, HP.rand(o.key, 'R')) : lerp(60, 100, HP.rand(o.key, 'R'))) * Math.min(1.1, o.amp), [x, y] = spot(o.key, o.zones, o.avoid, R * .8);
    const cols = palette(t, big ? 'splat' : 'small').filter(c => c !== o.lastCol), color = HP.pick(cols, o.key, 'c'); o.lastCol = color;
    const dir = Math.atan2(y - 960, x - 540) + (HP.rand(o.key, 'd') - .5) * .8;
    // fixer r2: the silhouette varies per splat (spiky flick, round dripping blot, wide spray), so no two read as the same stamp
    const v = HP.rand(o.key, 'shape'), sk = v < .33 ? 'flick' : v < .66 ? 'blot' : 'spray';
    const S = { key: 'bfx|' + o.key, x, y, r: R * (sk === 'spray' ? .8 : 1), color, dir, sats: (big ? 56 : 28) * (sk === 'spray' ? 1.6 : 1), spikes: sk === 'flick' ? (big ? 14 : 11) : sk === 'blot' ? 5 : 8,
      drips: sk === 'blot' ? (big ? 5 : 2) : sk === 'flick' ? 1 : 0, spread: sk === 'spray' ? 1.25 : sk === 'flick' ? .55 : .8, satMax: sk === 'spray' ? .2 : .15 };
    const life = (big ? 4 : 2.5) * BP();
    DRAW.push({ t0: t, t1: t + life + .75, layer: o.layer, draw: (ctx, x2) => PL().splat(ctx, S, x2 - t, { cull: PL().residueAt(x2, t + life), alpha: fadeHold(x2) }) });
    return true;
  },
  splatS(t, o) { return EFFECTS.splat(t, o, true); },
  droplets(t, o) {
    const [x, y] = spot(o.key, o.zones, o.avoid), color = HP.pick(palette(t, 'splat'), o.key, 'c');
    const S = { key: 'bfxd|' + o.key, x, y, r: 95 * Math.min(1.2, o.amp), color, dir: Math.atan2(y - 960, x - 540), sats: 18, spikes: 0, drips: 0, spread: 1.1, noCore: true, satMax: .26 };
    DRAW.push({ t0: t, t1: t + 2 * BP() + .2, layer: o.layer, draw: (ctx, x2) => PL().splat(ctx, S, x2 - t, { cull: pr(x2, t + 2 * BP(), .2), alpha: fadeHold(x2) }) });
    return true;
  },
  stamp(t, o) {
    // polisher: no plain 'disc' (a grey ink disc beside a chart or card read as a stray logo piece / a glitch)
    const [x, y] = spot(o.key, o.zones, o.avoid), g = HP.pick(['nabla', 'ring', 'checker', 'cross', 'triangle', 'star', 'arrow', 'square'], o.key, 'g');
    const color = HP.pick(palette(t, 'ink'), o.key, 'c'), size = lerp(90, 150, HP.rand(o.key, 's')) * clamp(o.amp, .75, 1.2), rot = (HP.rand(o.key, 'r') - .5) * 26;
    // polisher: a stamp lands whole inside the frame (a disc stamp cut in half at the edge read as a glitch)
    const m = size * .75, xs = clamp(x, m, W - m), ys = clamp(y, m, H - m);
    const S = { key: 'bfxs|' + o.key, x: xs, y: ys, glyph: g, size: Math.round(size), color, rot }, life = 3 * BP();
    DRAW.push({ t0: t, t1: t + life + .12, layer: o.layer, draw: (ctx, x2) => PL().stamp(ctx, S, x2 - t, { cull: pr(x2, t + life, .1), alpha: .92 * fadeHold(x2) }) });
    return true;
  },
  scribble(t, o) {
    const [x, y] = spot(o.key, o.zones, o.avoid), kind = HP.pick(['scribble', 'circle', 'arrow', 'star', 'hatch', 'underline', 'cross'], o.key, 'k'), s = lerp(110, 190, HP.rand(o.key, 's'));
    const a = HP.rand(o.key, 'a') * 2 * Math.PI, sh = { kind, key: o.key, cx: x, cy: y, r: s / 2, w: s, h: s * .4, n: 7, x: x - s / 2, y: y - s * .3,
      x0: x - Math.cos(a) * s / 2, y0: y - Math.sin(a) * s / 2, x1: x + Math.cos(a) * s / 2, y1: y + Math.sin(a) * s / 2, gap: 20, angle: 60, sag: 10 };
    if (kind === 'underline') { sh.x0 = x - s / 2; sh.x1 = x + s / 2; sh.y = y; }
    const life = 2 * BP(), dur = Math.min(.24, BP() / 2);
    DRAW.push({ t0: t - 1 / HP.FPS, t1: t + life, layer: o.layer, draw: (ctx, x2) => PL().pencil(ctx, [{ ...sh, p: E.oQuad(pr(x2, t - 1 / HP.FPS, dur)) }], { key: 'bfxp|' + o.key, t: x2, color: dark(x2) ? '#F2EBDD' : '#2A2832', width: lerp(3.5, 10, HP.rand(o.key, 'pw')), alpha: lerp(.7, .95, HP.rand(o.key, 'pa')) * fadeHold(x2) }) });
    return true;
  },
  tick(t, o) {
    const [x, y] = spot(o.key, o.zones, o.avoid), kind = HP.pick(['star', 'cross', 'check', 'underline'], o.key, 'k'), s = lerp(56, 88, HP.rand(o.key, 's'));   // polisher: was 34-56 px
    const sh = { kind, cx: x, cy: y, r: s / 2, n: 3, x0: x - s, x1: x + s, y };
    DRAW.push({ t0: t - 1 / HP.FPS, t1: t + BP(), layer: o.layer, draw: (ctx, x2) => PL().pencil(ctx, [{ ...sh, p: E.oQuad(pr(x2, t - 1 / HP.FPS, .12)) }], { key: 'bfxt|' + o.key, t: x2, color: dark(x2) ? '#F2EBDD' : '#2A2832', width: lerp(4.5, 12, HP.rand(o.key, 'pw')), alpha: lerp(.72, .95, HP.rand(o.key, 'pa')) * fadeHold(x2) }) });
    return true;
  },
  // the Kandinsky pieces themselves (fx/kandinsky.js); without an active kand item: a camera jolt / punch (and not counted visible)
  jump(t, o) { const L = HP.lib.kandinsky; if (L && L.impulse(t, 'jump', Math.min(1.3, o.amp))) { HP.mark(t, 'beatfx', 'kand-jump'); return true; } HP.cam.jolt(t, 0, -16 * o.amp, .1); return false; },
  burst(t, o) { const L = HP.lib.kandinsky; if (L && L.impulse(t, 'burst', Math.min(1.3, o.amp))) { HP.mark(t, 'beatfx', 'kand-burst'); return true; } HP.cam.punch(t, .05 * o.amp, .1); return false; },
};
const VISIBLE = new Set(['splat', 'splatS', 'droplets', 'stamp', 'scribble', 'tick', 'grain', 'tint', 'invert', 'flash', 'jump', 'burst']);
const ROLE_AMP = { crash: 1.3, bar: 1.2, backbeat: 1, beat: .85, fill: 1, off: .7 };

// ============================================================ the track planner
function weighted(list, key, exclude) {
  const L = list.filter(([e]) => !exclude.has(e)); const use = L.length ? L : list;
  const tot = use.reduce((a, [, w]) => a + w, 0); let r = HP.rand(key) * tot;
  for (const [e, w] of use) { r -= w; if (r <= 0) return e; } return use[use.length - 1][0];
}
function calmRanges(track) {
  if (track.calm === false) return [];
  if (Array.isArray(track.calm)) return track.calm.map(([a, b]) => [HP.T(a), HP.T(b)]);
  return HP.ITEMS.filter(it => FACT_TYPES.has(it.type)).map(it => [it.t0 - EPS, it.t0 + .4]);
}
const TRACKS = [];
// plan(track) -> [{i, t, role, vis, cam}]; with fire = true it schedules the effects
function plan(track, fire) {
  const id = track.id || `beatfx${TRACKS.length}`, pat0 = PATTERNS[track.pattern || 'riff'] || PATTERNS.riff;
  const bi = v => typeof v === 'string' && v.startsWith('hb:') ? parseFloat(v.slice(3)) : (typeof v === 'number' ? v : HP.beatAt(HP.T(v)));
  let beats = track.beats;
  if (!beats && track.grid === 'pulse') {   // the prelude's swell peaks (hits.json prelude_pulse: there is no tempo-locked pulse there)
    const a = track.from !== undefined ? HP.T(track.from) : -1e9, z = track.to !== undefined ? HP.T(track.to) : 1e9;
    beats = ((HP.hits.raw || {}).prelude_pulse || []).map((q, k) => ({ i: 'p' + k, t: HP.editAt(q.t, false), song: q.t, pulse: q.s ?? 1 })).filter(b => isFinite(b.t) && b.t >= a - EPS && b.t <= z + EPS);
  }
  if (!beats) {
    const from = track.from !== undefined ? Math.ceil(bi(track.from) - 1e-6) : Math.ceil(HP.beatAt(0)), to = track.to !== undefined ? bi(track.to) : HP.beatAt(window.DURATION || 1e3);
    beats = HP.beatsIn(-1e9, 1e9, { from, to, step: track.eighths ? .5 : 1 });
  }
  const skip = new Set(track.skip || []), no = new Set(track.no || []), calm = calmRanges(track), out = [];
  const amp = track.intensity ?? 1, zones = track.zones, layer = track.layer || 'paint';
  let prevVis = '', prevCam = '', prevB = null;
  const st = { lastCol: null };
  for (const b of beats) {
    if (skip.has(b.i) || inHold(b.t)) { prevB = b; continue; }
    const role = roleOf(b, prevB), isCalm = calm.some(([a, c]) => b.t >= a && b.t < c);
    const pat = isCalm ? PATTERNS.calm : pat0, R = { ...(pat[role] || pat.beat || P([], [])), ...((track.map || {})[role] || {}) };
    const key = `${id}|${b.i}`, exV = new Set([prevVis, ...no]), exC = new Set([prevCam, ...no]);
    let vis = R.vis && R.vis.length ? weighted(R.vis.filter(([e]) => !no.has(e)).length ? R.vis.filter(([e]) => !no.has(e)) : R.vis, key + '|v', exV) : null;
    const cam = R.cam && R.cam.length ? weighted(R.cam, key + '|c', exC) : null;
    const o = { key, amp: amp * (ROLE_AMP[role] || 1) * (track.pattern === 'prelude' ? .6 : 1) * (b.pulse !== undefined ? .5 + .5 * b.pulse : 1), role, zones, avoid: track.avoid, layer, b, get lastCol() { return st.lastCol; }, set lastCol(v) { st.lastCol = v; } };
    if (fire) {
      let ok = false;
      if ((vis === 'tint' || vis === 'invert') && factOnScreen(b.t)) vis = 'flash';   // a colour flip / tint never recolours footage or a fact
      if (vis) { ok = EFFECTS[vis](b.t, o); if (ok) HP.mark(b.t, id, 'beatfx:' + vis); }
      if (!ok) {   // the visible effect could not fire here (no kand item for a jump): fall back to a drawn one
        const alt = weighted((isCalm ? [['grain', 1], ['tick', 1]] : [['droplets', 2], ['grain', 1], ['tick', 1]]).filter(([e]) => e !== prevVis), key + '|alt', new Set());
        EFFECTS[alt](b.t, o); HP.mark(b.t, id, 'beatfx:' + alt); vis = alt;
      }
      if (cam) { EFFECTS[cam](b.t, o); HP.mark(b.t, id, 'beatfx:' + cam); }
      if ((role === 'bar' || role === 'crash') && !isCalm && !['flash', 'invert', 'tint'].includes(vis) && track.barFlash !== false && pat0 !== PATTERNS.prelude) { HP.flash(b.t, .2 * Math.min(1.3, amp), .05); HP.mark(b.t, id, 'beatfx:barflash'); }
      // vocal entries get an extra accent (patterns with a vocalOn role)
      if (prevB && b.vocal && !prevB.vocal && pat.vocalOn && !isCalm) { const e = weighted(pat.vocalOn.vis, key + '|vo', new Set([vis])); if (e) { EFFECTS[e](b.t + EPS, { ...o, key: key + '|vo' }); HP.mark(b.t, id, 'beatfx:vocalOn:' + e); } }
      if (prevB && !b.vocal && prevB.vocal && !isCalm) { EFFECTS.grain(b.t, { ...o, key: key + '|voff' }); }
    }
    out.push({ i: b.i, t: +b.t.toFixed(4), role, vis, cam, calm: isCalm });
    prevVis = vis || prevVis; prevCam = cam || prevCam; prevB = b;
  }
  return out;
}
// EDL top-level "beatfx" tracks are planned once the items exist (so "calm": "auto" can see the headline items)
// Camera zoom/rotation on #cam made Chromium repaint every layer (+250 ms a frame, measured on test-paint); promoting #cam to its own
// compositor layer makes those frames ~190 ms. Applied only when an EDL uses beat tracks, so the legacy EDLs render exactly as
// before (a candidate for teaser.html itself: see edl/README.md "Builder A").
let PROMOTED = false;
// integrator: core now promotes #cam per frame, only while the camera is a pure translation (HP.cam.promote, fx/core.js), so
// zoom/rotation frames no longer depend on the frames rendered before them
function promoteCam() { if (!PROMOTED) { PROMOTED = true; HP.cam.promote(); } }
HP.on('built', () => {
  // assembler (rev2): a track's "skipIn": [edl names] skips it in those EDLs, as for items
  for (const tr of (HP.EDL.beatfx || [])) { if (tr.enabled === false || (Array.isArray(tr.skipIn) && tr.skipIn.includes(HP.EDL_NAME))) continue; const p = plan(tr, true); TRACKS.push({ track: tr, plan: p }); promoteCam(); }
  if (DRAW.length) for (const L of new Set(DRAW.map(d => d.layer))) HP.shared(L);
});
// the same track as an "fx" entry: {"fx": "beatfx", "on": "hb:0..31", "pattern": ..., ...}
HP.registerFX('beatfx', { build(ev) { promoteCam(); const p = plan({ ...ev, beats: ev.beats || ev.times.map(t => ({ i: HP.beatAt(t), t, song: HP.songAt(t) })) }, true); TRACKS.push({ track: ev, plan: p }); if (DRAW.length) for (const L of new Set(DRAW.map(d => d.layer))) HP.shared(L); } });

// ---- the overlays (in #fx: unshaken) and the drawn effects, every frame
let OV = null;
function overlays() {
  if (OV) return OV;
  const fx = HP.layers.fx;
  const tint = el('div', '', fx, { position: 'absolute', inset: 0, opacity: 0, display: 'none' });
  const inv = el('div', '', fx, { position: 'absolute', inset: 0, background: '#FFFFFF', mixBlendMode: 'difference', display: 'none' });
  return (OV = { tint, inv });
}
function grainTile(k, dk) {   // speckle: white and ink grains with alpha (normal blend), half resolution, 4 variants
  return HP.memo('beatfx|grain|' + k + '|' + !!dk, () => { const c = HP.offscreen(W / 2, H / 2), x = c.getContext('2d'), im = x.createImageData(W / 2, H / 2), r = HP.rng('grain', k);
    for (let i = 0; i < im.data.length; i += 4) { const v = (r() + r() - 1); const w = v > 0; im.data[i] = im.data[i + 1] = im.data[i + 2] = w ? 255 : 21; im.data[i + 3] = Math.round(255 * Math.min(1, Math.abs(v) * (dk ? (w ? .55 : .1) : (w ? .45 : .6)))); }
    x.putImageData(im, 0, 0); return c; });
}
// fixer r2: EDL "paintMask": [{layer ('paint'), from, to, rect: [x, y, w, h], feather (px, 60)}]: after everything has painted into
// a shared paint canvas (items, then the beat tracks), the rect is erased from it with soft top/bottom edges, so splats and stamps
// never sit under the type of that band (e.g. the riff's wordmark, kicker and credit line on clean cream)
let MASKS = null;
function paintMasks(t) {
  if (!MASKS) MASKS = (HP.EDL.paintMask || []).map(m => ({ ...m, a: HP.T(m.from ?? 0), b: HP.T(m.to ?? 1e9), layer: m.layer || 'paint' }));
  for (const m of MASKS) {
    if (t < m.a - EPS || t >= m.b - EPS) continue;
    const L = HP.shared(m.layer); if (!L || !L.ctx) continue;
    const c = L.ctx, [x, y, w, h] = m.rect, f = m.feather ?? 60, g = c.createLinearGradient(0, y - f, 0, y + h + f);
    const k0 = f / (h + 2 * f), k1 = 1 - k0;
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(k0, 'rgba(0,0,0,1)'); g.addColorStop(k1, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'destination-out'; c.fillStyle = g; c.fillRect(x, y - f, w, h + 2 * f); c.restore();
  }
}
HP.on('post', t => {
  for (const d of DRAW) if (t >= d.t0 - EPS && t < d.t1) d.draw(HP.shared(d.layer).ctx, t);
  paintMasks(t);
  if (!OVER.length) return;
  const O = overlays();
  let ta = 0, tc = '', iv = false;
  for (const q of OVER) {
    if (t < q.t0 - EPS || t >= q.t1) continue;
    const f = (t - q.t0) * HP.FPS;
    if (q.kind === 'tint') { const a = q.amp * Math.exp(-f / 1.3); if (a > ta) { ta = a; tc = q.color; } }
    else if (q.kind === 'invert') iv = f < 1 + EPS ? true : iv;
  }
  ta *= fadeHold(t);
  if (ta > .01) { O.tint.style.display = ''; O.tint.style.background = tc; O.tint.style.mixBlendMode = dark(t) ? 'screen' : 'multiply'; O.tint.style.opacity = ta.toFixed(3); } else O.tint.style.display = 'none';
  O.inv.style.display = iv && !inHold(t) ? '' : 'none';
});

// ============================================================ single effects as EDL "fx" entries (the stubs' four, plus every effect)
HP.registerFX('punch', { build(ev) { each(ev, (t, b) => HP.cam.punch(t, (isBar(b) ? (ev.bar ?? 2 * (ev.amount ?? 0.04)) : (ev.amount ?? 0.04)), ev.decay ?? 0.12)); } });
HP.registerFX('shake', { build(ev) { each(ev, (t, b) => HP.cam.hit(t, (ev.amp ?? 8) * (isBar(b) ? (ev.barK ?? 1.6) : 1), ev.decay ?? 0.11)); } });
HP.registerFX('spin', { build(ev) { each(ev, (t, b, k) => HP.cam.spin(t, (ev.deg ?? 1.5) * ((ev.alt ?? true) && k % 2 ? -1 : 1), ev.decay ?? 0.15)); } });
HP.registerFX('flash', { build(ev) { each(ev, (t) => HP.flash(t, ev.opacity ?? 0.5, ev.decay ?? 0.08, ev.color || '#FFFFFF')); } });
for (const name of ['snap', 'jolt', 'zoom', 'grain', 'tint', 'invert', 'splat', 'splatS', 'droplets', 'stamp', 'scribble', 'tick', 'jump', 'burst'])
  HP.registerFX(name, { build(ev) { each(ev, (t, b, k) => EFFECTS[name](t, { key: `${ev.id || name}|${k}`, amp: ev.intensity ?? 1, role: b ? roleOf(b) : 'beat', zones: ev.zones, layer: ev.layer || 'paint', b })); if (DRAW.length) HP.shared(ev.layer || 'paint'); } });

HP.lib.beatfx = { isBar, roleOf, PATTERNS, EFFECTS, VISIBLE, plan: tr => plan(tr, false), tracks: TRACKS, ZONES };
})();
