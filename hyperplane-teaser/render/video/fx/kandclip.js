/* fx/kandclip.js  [INTEGRATOR]  footage inside a logo piece: the Kandinsky discs as windows onto the news
 * =================================================================================================================
 * BUILD.md REVISION 2 wants footage or an image in every frame (except the cover hold) and, from the UPDATE, the logo's shapes
 * as "containers for the news (circles and squares as clip masks and frames)". This type plays prepared footage INSIDE a piece of
 * a `kand` item (builder A) through its fill hook, so the footage moves with the piece's own choreography (orbits, jumps, the
 * burst out of the black hole) and is clipped to its outline (builder D's liquid edge from a `fluid` item included). When the kand
 * item settles for the final hold the fill crossfades to the exact flat cover colour (kandinsky.js), so the cover still matches.
 *
 * TYPE "kandclip": {id, t0, t1, item (the kand id), piece ("pink" | "blue" | "black" | "teal" | "core" | "square" ...),
 *   "prep": "clip" + src | "broll": id, in, speed, grade, srcFocus/srcZoom | crop, frame {cx, cy, r} (the extraction size only:
 *   2r = the piece's diameter in frame px; add "oversample" for the zoom), zoom [z0, z1] (slow push over the life, 1.0-1.12),
 *   tint (a multiply colour over the footage; default the piece's own colour; false = none), tintK (0..1, 0.45),
 *   blend ("multiply" default as above | "screen": for dark footage, screened over the flat piece colour at screenK (0.9), so the
 *   disc keeps its hue),
 *   fadeIn (s, 0.12: the flat piece colour first, then the footage), out (time ref: the footage fades back to the flat colour
 *   there, over fadeOut s (0.2); default t1), freeze (assembler, rev2 long/short: a time ref; from then on the picture holds on
 *   the frame shown at that moment, e.g. a speaker's face held past a camera cut in the source until the piece changes)}.
 * Register it BEFORE any `fluid` item of the same kand item (EDL order): the first fill hook of a piece wins, so the footage
 * replaces the marbling on that piece while it plays; fluid's wobbling outline still applies.
 * For the check tools a transparent DOM box over the piece is declared as imagery (coverage.py), opacity = the footage's.
 * Determinism: the frame shown is a pure function of t (seq.frameAt); the hook draws from scratch every frame.
 */
(function () {
'use strict';
const { clamp, lerp, pr, el } = HP.u, E = HP.ease, EPS = HP.EPS;

// local time of the picture: frozen from d.freeze on (the frame shown at that moment holds)
const picLt = (it, t) => (it.freeze !== undefined ? Math.min(t, it.freeze) : t) - it.t0;
function fill(it, ctx, P, t, info) {
  const d = it.d, lt = picLt(it, t);
  const img = it.seq.now(it.seq.frameAt(lt, d.speed || 1));
  const u = footU(it, t);
  const box = P.kind === 'circle' ? [P.c[0] - P.r, P.c[1] - P.r, 2 * P.r, 2 * P.r] : [P.home[0] - (P.hh || 60), P.home[1] - (P.hh || 60), 2 * (P.hh || 60), 2 * (P.hh || 60)];
  const A = ctx.globalAlpha;
  // the piece's own flat colour underneath (shows while the footage fades in or out)
  ctx.fillStyle = info.color; ctx.fillRect(box[0] - 40, box[1] - 40, box[2] + 80, box[3] + 80);
  if (!img || u <= 0) return true;
  const Z = d.zoom || [1.0, 1.1], z = lerp(Z[0], Z[1], E.ioSine(clamp(it.life(t))));
  const iw = img.naturalWidth, ih = img.naturalHeight, k = Math.max(box[2] / iw, box[3] / ih) * z;
  const w = iw * k, h = ih * k, cx = box[0] + box[2] / 2, cy = box[1] + box[3] / 2;
  if (d.blend === 'screen') {   // dark footage: screened over the piece colour, so the disc keeps its hue and the footage's light shows
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = A * u * (d.screenK ?? 0.9);
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = A;
    return true;
  }
  ctx.globalAlpha = A * u;
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  if (d.tint !== false) {
    ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = A * u * (d.tintK ?? 0.45);
    ctx.fillStyle = d.tint || info.color; ctx.fillRect(box[0] - 40, box[1] - 40, box[2] + 80, box[3] + 80);
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.globalAlpha = A;
  return true;
}
function footU(it, t) {
  const d = it.d, fi = d.fadeIn ?? 0.12, fo = d.fadeOut ?? 0.2;
  return clamp(pr(t, it.t0, fi)) * (1 - clamp(pr(t, it.out - fo, fo)));
}

HP.register('kandclip', {
  ownMotion: true,
  build(it) {
    const d = it.d;
    if (!d.item || !d.piece) throw new Error(`kandclip ${it.id}: needs "item" (a kand id) and "piece"`);
    it.seq = HP.assets.frames('cache/' + (d.frames || it.id));
    it.out = d.out !== undefined ? HP.T(d.out) : it.t1;
    if (d.freeze !== undefined) it.freeze = HP.T(d.freeze);
    it.mk = el('div', '', it.el, { position: 'absolute', left: '0px', top: '0px', width: '10px', height: '10px', opacity: 0, borderRadius: '50%' });
    it.imagery(it.mk);
    const K = HP.lib.kandinsky;
    if (!K || !K.hook) throw new Error(`kandclip ${it.id}: fx/kandinsky.js is not loaded`);
    it.hook = K.hook({ item: d.item, pieces: [d.piece], t0: it.t0, t1: it.t1, fill: (ctx, P, t, info) => fill(it, ctx, P, t, info) });
    it.mark(it.t0, 'kandclip');
  },
  async load(it) { await it.seq.ready; },
  async prepare(it, t) { if (it.active(t) && it.seq.meta) await it.seq.prepare(it.seq.frameAt(picLt(it, t), it.d.speed || 1)); },
  draw(it, t) {
    // the imagery marker: the piece's current box (frame px), visible while the footage is
    const g = HP.lib.kandinsky.geom(it.d.item, it.d.piece, t), P = HP.lib.kandinsky.poses(it.d.item, t);
    const op = P && P[it.d.piece] ? clamp(P[it.d.piece].op ?? 1) : 0;
    const kd = HP.lib.kandinsky.items.find(k => k.id === it.d.item);
    const live = kd && t >= kd.t0 - EPS && t < kd.t1 - EPS;
    if (!g || !live) { it.mk.style.opacity = 0; return; }
    Object.assign(it.mk.style, { left: (g.cx - g.w / 2).toFixed(1) + 'px', top: (g.cy - g.h / 2).toFixed(1) + 'px', width: Math.max(1, g.w).toFixed(1) + 'px', height: Math.max(1, g.h).toFixed(1) + 'px',
      opacity: (footU(it, t) * op).toFixed(3) });
  },
  texts() { return []; },
});
HP.lib.kandclip = { fill, footU };
})();
