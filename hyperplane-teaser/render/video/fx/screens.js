/* fx/screens.js  [BUILDER C]  real headline screenshots piled on the beat; images and footage in every frame
 * =================================================================================================================
 * BUILD.md REVISION 2: "Real screenshots of headlines, as in William's deck ... Highlight or roll out the relevant words on the
 * real screenshot (OCR-located). Dump several headline screenshots into a frame on the beats, overlapping slightly, then
 * emphasize one phrase with a highlighter or bold at the end: AI should feel overwhelming in its speed."; "Images or related
 * video footage in every frame". Style: research/rev2/style.md 4.1 (painted reveal, highlighter), 4.2 (pencil), 6 (stagger one
 * per beat, rotated 2-6 deg, overlapping <= 15% of height, only the top-most phrase emphasised at the end).
 *
 * TYPES (documented in edl/README.md, "Builder C"):
 *   screens  a pile of real screenshots (records of research/rev2/screens.json | captures.json | screens.stand-in.json by id),
 *            landing on beats (slam | drop | flip | slide | paint), seeded jitter, paper card + shadow, a marker sweep over each
 *            shot's OCR phrase, older shots dim and blur as new ones land, a push-in to the final phrase, an end-of-bar emphasis
 *            (lift | circle | underline | marker), outlet + date chips typed on, and a beat-locked exit (scatter | sweep | ...).
 *   panel    an image or muted b-roll clip in a Kandinsky mask (circle | square | triangle | band | rect | blob) with Ken Burns
 *            drift and a painted (bristle) or pencil frame drawn on; iris / paint / pop entries; beat pulses; a credit chip.
 *   screen   one screenshot (the stub's single card: kept for old test EDLs).
 *   broll    full-box footage (the stub, with Ken Burns).
 * PREP: python3 render/video/prep_clips.py <edl> copies the shots to cache/screens/ (pixels untouched) and extracts panel/broll
 *   footage ("prep": "clip") and panel stills ("prep": "image").
 * EXPORTS: HP.lib.screens = {catalog, record, fileOf, shotGeom, poseAt}.
 * RULES: the screenshot pixels are never altered (crop, scale, rotate only; the marker multiplies over the phrase, behind the
 *   ink); footage is shown as it is (no keying, no recolouring); attribution in DOM text; t-pure; every image decode-awaited.
 */
(function () {
'use strict';
const { clamp, lerp, pr, el, EPS } = HP.u, E = HP.ease;
const W = HP.W, H = HP.H, COL = HP.COL, INK = '#15131F', CREAM = '#F2EBDD', PAPER = '#FBF7EE', NIGHT = '#0E0D12';
const paint = () => HP.lib.paint || null;
const TX = () => HP.lib.text;
const BP = () => (HP.hits && HP.hits.period) || 0.4839;

// ============================================================ catalog (research/rev2) and prepared files (cache/screens)
const CAT = { recs: new Map(), files: {}, ready: null, src: [] };
function catalog() {
  if (CAT.ready) return CAT.ready;
  CAT.ready = (async () => {
    const dir = await fetch('/research/rev2/', { cache: 'no-store' }).then(r => r.ok ? r.text() : '', () => '');
    const has = f => dir.includes(`href="${f}"`);
    for (const f of ['screens.stand-in.json', 'captures.json', 'screens.json']) {   // later files win
      if (!has(f)) continue;
      const j = await HP.assets.json('research/rev2/' + f).catch(() => null);
      for (const r of (j && j.items) || []) CAT.recs.set(r.id, { ...r, _from: f });
      CAT.src.push(f);
    }
    for (const f of ['screens.verify.even.json', 'screens.verify.odd.json']) {
      if (!has(f)) continue;
      const j = await HP.assets.json('research/rev2/' + f).catch(() => null);
      for (const r of (j && j.items) || []) { const o = CAT.recs.get(r.id); if (o && o._from === 'screens.json') CAT.recs.set(r.id, { ...o, ...r }); }
    }
    CAT.files = await fetch('cache/screens/index.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : {}, () => ({}));
    if (!CAT.src.includes('screens.json')) HP.INFO.push(`screens: research/rev2/screens.json not there yet; using ${CAT.src.join(' + ') || 'nothing'} (STAND-IN records, unverified)`);
  })();
  return CAT.ready;
}
const record = id => CAT.recs.get(id) || null;
const fileOf = id => CAT.files[id] ? 'cache/screens/' + CAT.files[id].file : null;

// ============================================================ geometry helpers
const toRect = c => !c ? null : Array.isArray(c) ? { x: c[0], y: c[1], w: c[2] - c[0], h: c[3] - c[1] } : c.x0 !== undefined ? { x: c.x0, y: c.y0, w: c.x1 - c.x0, h: c.y1 - c.y0 } : { x: c.x, y: c.y, w: c.w, h: c.h };
// a shot's highlight boxes (source px): hl = index | phrase (substring match) | {boxes} | [[x0,y0,x1,y1], ...] | false
function hlBoxes(rec, hl) {
  if (hl === false || hl === null) return null;
  const H_ = (rec && rec.highlights) || [];
  if (Array.isArray(hl) && Array.isArray(hl[0])) return hl;
  if (hl && typeof hl === 'object' && hl.boxes) return hl.boxes;
  if (typeof hl === 'string') { const f = H_.find(h => h.phrase === hl) || H_.find(h => h.phrase && h.phrase.toLowerCase().includes(hl.toLowerCase())); return f ? f.boxes : null; }
  const f = H_[typeof hl === 'number' ? hl : 0]; return f ? f.boxes : null;
}
// fixer r1: the ink-free room around an OCR box (record px), measured on the screenshot's own pixels: how far a lifted slip, an
// underline or a marker may reach before it covers a neighbouring word (or leaves the crop). {l, r, t, b} in record px.
function inkRoom(s, b) {
  return HP.memo(`scr|room|${s.id}|${s.crop.x},${s.crop.y},${s.crop.w},${s.crop.h}|${b.x},${b.y},${b.w},${b.h}`, () => {
    const M = 140, X0 = Math.max(s.crop.x, Math.floor(b.x - M)), X1 = Math.min(s.crop.x + s.crop.w, Math.ceil(b.x + b.w + M));
    const Y0 = Math.max(s.crop.y, Math.floor(b.y - M)), Y1 = Math.min(s.crop.y + s.crop.h, Math.ceil(b.y + b.h + M));
    const w = Math.max(1, X1 - X0), h = Math.max(1, Y1 - Y0), c = HP.offscreen(w, h), x = c.getContext('2d', { willReadFrequently: true });
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
    x.drawImage(s.img, X0 * s.fk, Y0 * s.fk, w * s.fk, h * s.fk, 0, 0, w, h);
    const D = x.getImageData(0, 0, w, h).data, L = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) L[i] = 0.299 * D[4 * i] + 0.587 * D[4 * i + 1] + 0.114 * D[4 * i + 2];
    const hist = new Uint32Array(256); for (let i = 0; i < L.length; i++) hist[L[i] | 0]++;
    let acc = 0, bg = 255; for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= L.length / 2) { bg = v; break; } }
    const ink = (px, py) => Math.abs(L[py * w + px] - bg) > 70;
    const bx0 = Math.round(b.x - X0), bx1 = Math.round(b.x + b.w - X0), by0 = Math.round(b.y - Y0), by1 = Math.round(b.y + b.h - Y0);
    const ry0 = Math.max(0, Math.round(by0 + 0.2 * b.h)), ry1 = Math.min(h - 1, Math.round(by0 + 0.8 * b.h));
    const rx0 = Math.max(0, Math.round(bx0 + 0.04 * b.w)), rx1 = Math.min(w - 1, Math.round(bx0 + 0.96 * b.w));
    const colInk = px => { let n = 0; for (let py = ry0; py <= ry1; py++) if (ink(px, py) && ++n >= 2) return true; return false; };
    const rowInk = py => { let n = 0; for (let px = rx0; px <= rx1; px++) if (ink(px, py) && ++n >= 3) return true; return false; };
    let l = bx0, r = w - bx1, t = by0, bo = h - by1;
    for (let px = bx0 - 1; px >= 0; px--) if (colInk(px)) { l = bx0 - 1 - px; break; }
    for (let px = bx1; px < w; px++) if (colInk(px)) { r = px - bx1; break; }
    for (let py = by0 - 1; py >= 0; py--) if (rowInk(py)) { t = by0 - 1 - py; break; }
    for (let py = by1; py < h; py++) if (rowInk(py)) { bo = py - by1; break; }
    return { l: Math.max(0, l), r: Math.max(0, r), t: Math.max(0, t), b: Math.max(0, bo) };
  });
}
// high-quality downscale once (progressive halving), memoised: the card bitmap at bake width bw
function bake(key, img, crop, bw, bh) {
  return HP.memo('scr|bake|' + key + '|' + bw, () => {
    let src = img, sx = crop.x, sy = crop.y, sw = crop.w, sh = crop.h;
    while (sw > bw * 2.2) {   // halve until within 2.2x of the target
      const c = HP.offscreen(sw / 2, sh / 2), x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
      x.drawImage(src, sx, sy, sw, sh, 0, 0, c.width, c.height); src = c; sx = 0; sy = 0; sw = c.width; sh = c.height;
    }
    const c = HP.offscreen(bw, bh), x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, bw, bh);   // transparent PNGs sit on white paper
    x.drawImage(src, sx, sy, sw, sh, 0, 0, bw, bh);
    return c;
  });
}
function blurred(key, cv, px) {
  return HP.memo('scr|blur|' + key + '|' + cv.width + '|' + px, () => {
    const c = HP.offscreen(cv.width, cv.height), x = c.getContext('2d'); x.filter = `blur(${px}px)`; x.drawImage(cv, 0, 0); x.filter = 'none'; return c;
  });
}
function shadowSprite(w, h, blur = 26, alpha = 0.5) {
  const key = `scr|shadow|${Math.round(w)}|${Math.round(h)}|${blur}|${alpha}`;
  return HP.memo(key, () => {
    const b = blur * 2, c = HP.offscreen(w + 2 * b, h + 2 * b), x = c.getContext('2d');
    x.shadowColor = `rgba(8,6,14,${alpha})`; x.shadowBlur = blur; x.shadowOffsetX = 10000; x.fillStyle = '#000';
    x.fillRect(b - 10000, b, w, h); return { c, b };
  });
}
// paper edge: a slightly irregular quadrilateral outline (seeded), so the card reads as a cut-out print
function paperPath(key, w, h, pad) {
  return HP.memo('scr|paper|' + key + '|' + Math.round(w) + '|' + Math.round(h) + '|' + pad, () => {
    const R = HP.rng('paper', key), p = new Path2D(), n = 7, x0 = -w / 2 - pad, y0 = -h / 2 - pad, x1 = w / 2 + pad, y1 = h / 2 + pad, j = () => (R() - 0.5) * 2.4;
    p.moveTo(x0 + j(), y0 + j());
    for (let i = 1; i <= n; i++) p.lineTo(lerp(x0, x1, i / n) + j(), y0 + j());
    for (let i = 1; i <= n; i++) p.lineTo(x1 + j(), lerp(y0, y1, i / n) + j());
    for (let i = 1; i <= n; i++) p.lineTo(lerp(x1, x0, i / n) + j(), y1 + j());
    for (let i = 1; i < n; i++) p.lineTo(x0 + j(), lerp(y1, y0, i / n) + j());
    p.closePath(); return p;
  });
}
const mat = (m) => `matrix(${[m.a, m.b, m.c, m.d, m.e, m.f].map(v => v.toFixed(4)).join(',')})`;

// ============================================================ the pile
const ENTRY = { slam: { lead: 0.1, dur: 0.14 }, drop: { lead: 0.16, dur: 0.24 }, flip: { lead: 0.12, dur: 0.24 }, slide: { lead: 0.12, dur: 0.2 }, paint: { lead: 1 / 30, dur: 0.36 }, cut: { lead: 0, dur: 0 } };
// pose of a shot at t (card-local transform pieces relative to its rest pose) during its entry
function entryPose(s, t) {
  const p = { dx: 0, dy: 0, sc: 1, sy: 1, rot: 0, op: 1, lift: 0, shade: 0, vis: t >= s.start - EPS };
  if (!p.vis) return p;
  const u = pr(t, s.start, s.edur);
  if (u >= 1) return p;
  switch (s.entry) {
    case 'slam': p.sc = lerp(1.55, 1, E.oCub(u)); p.rot = lerp(s.side * 7, 0, E.oCub(u)); p.op = clamp(u * 5); p.lift = 1 - E.oCub(u); break;
    case 'drop': p.dy = lerp(-360, 0, E.oBack(u, 1.5)); p.rot = lerp(-s.side * 12, 0, E.oCub(u)); p.op = clamp(u * 6); p.lift = 1 - u; break;
    case 'flip': { const a = lerp(Math.PI / 2, 0, E.oBack(u, 1.8)); p.sy = Math.max(0.02, Math.cos(a)); p.shade = Math.sin(Math.abs(a)) * 0.55; p.sc = lerp(1.12, 1, u); p.lift = 1 - u; break; }
    case 'slide': p.dx = lerp(s.side * 1250, 0, E.oExpo(u)); p.rot = lerp(s.side * 10, 0, E.oCub(u)); p.lift = 1 - u; break;
  }
  return p;
}
HP.register('screens', {
  ownMotion: true,
  build(it) {
    const d = it.d;
    const { cv, ctx } = it.canvas(); it.cv = cv; it.ctx = ctx; it.imagery(cv);
    it.chips = el('div', 'scr-chips', it.el, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px' });
    it.shotsD = (d.shots || []).map(s => typeof s === 'string' ? { id: s } : { ...s });
    // land times: explicit "at" per shot, else one per entry of "on" (beats spec), else one per beat from t0
    const onT = d.on ? HP.fxTimes({ on: d.on, id: it.id }).times : null;
    it.shotsD.forEach((s, k) => { s.land = s.at !== undefined ? HP.T(s.at) : onT ? (onT[k] ?? onT[onT.length - 1] + (k - onT.length + 1) * BP()) : it.t0 + k * BP(); });
    for (const s of it.shotsD) it.mark(s.land, 'land');
    it.dark = it.theme !== 'light';
  },
  async load(it) {
    await catalog();
    const d = it.d;
    for (const s of it.shotsD) {
      s.rec = record(s.id);
      const f = s.src || fileOf(s.id);
      if (!f) { HP.WARN.push(`screens ${it.id}: no image for shot "${s.id}" (run prep_clips.py ${HP.EDL_NAME}; is it in screens.json / captures.json / screens.stand-in.json?)`); continue; }
      s.img = await HP.assets.image(f);
      if (!s.rec && !s.w0) HP.WARN.push(`screens ${it.id}: shot "${s.id}" has no catalog record (no outlet/date/highlights)`);
    }
    it.shots = it.shotsD.filter(s => s.img);
    if (!it.shots.length) return;
    // geometry: source crop (record px), display size, scale file px per record px
    for (const s of it.shots) {
      const rw = (s.rec && s.rec.w) || s.img.naturalWidth, rh = (s.rec && s.rec.h) || s.img.naturalHeight;
      s.fk = s.img.naturalWidth / rw;
      // integrator: captures.json records carry a research-picked focus_crop (masthead-free headline + byline); used unless the
      // shot gives its own crop ("crop": false = the whole page)
      s.crop = toRect(s.crop) || (s.crop !== false && s.rec && s.rec.focus_crop ? toRect(s.rec.focus_crop) : null) || { x: 0, y: 0, w: rw, h: rh };
      s.boxes = (hlBoxes(s.rec, s.hl ?? 0) || []).map(b => toRect(b));
    }
    layoutPile(it);
    // per-shot timing, entries, camera, marks
    const ent = d.entry || 'slam', seq = Array.isArray(ent) ? ent : null;
    it.shots.forEach((s, k) => {
      s.idx = k; s.entry = s.entry || (seq ? seq[k % seq.length] : ent);
      const e = ENTRY[s.entry] || ENTRY.slam; s.edur = s.dur ?? e.dur; s.start = s.land - (s.lead ?? e.lead);
      s.side = HP.rand(it.id, 'side', k) < 0.5 ? -1 : 1;
      s.hlAt = s.boxes.length && s.hl !== false ? (s.hlAt !== undefined ? HP.T(s.hlAt) : s.land + (s.entry === 'paint' ? 1 : (d.hlDelay ?? 0.5)) * BP()) : null;
      if (s.hlAt !== null) it.mark(s.hlAt, 'highlight');
      if (d.cam !== false && s.cam !== false) {
        const a = d.camAmt ?? 1;
        if (s.entry === 'slam') { HP.cam.punch(s.land, 0.028 * a, 0.12); HP.cam.hit(s.land, 6 * a, 0.09); }
        else if (s.entry === 'drop') { HP.cam.jolt(s.land, 0, 14 * a, 0.1); HP.cam.hit(s.land, 4 * a, 0.08); }
        else if (s.entry === 'flip') HP.cam.spin(s.land, 1.2 * s.side * a, 0.14);
        else if (s.entry === 'slide') HP.cam.jolt(s.land, -s.side * 16 * a, 0, 0.1);
      }
      // chip: outlet · date (typed on at landing)
      if (d.label !== false && s.label !== false) {
        const r = s.rec || {}, txt = typeof s.label === 'string' ? s.label : [r.outlet, TX().fmtDate(r.date)].filter(Boolean).join(' · ');
        if (txt) { s.chipTxt = txt; s.chipO = { size: d.chipSize ?? 34, bg: it.dark ? CREAM : INK, color: it.dark ? INK : CREAM, dot: COL.red }; s.chip = TX().chip(it.chips, txt, { ...s.chipO, ghost: true }); }
      }
      if (s.entry === 'paint' && paint()) s.plan = paint().revealPlan([-s.w / 2, -s.h / 2, s.w, s.h], { key: `${it.id}|${s.id}|rv`, color: s.revealColor || (it.dark ? 'pink' : 'yellow'), width: 92 });
    });
    // fixer r3 "chipFit": on a pile faster than a card a beat, each chip types fast enough to be complete (year included) well
    // before the next card lands (>= 60 cps; done within 60 % of the gap, at most 0.3 s); "chips": "all" keeps every landed card's
    // chip (under the cards above it), not only the newest one's, so no card is left without its outlet and date
    { const lands = it.shots.map(s => s.land).sort((a, b) => a - b);
      for (const s of it.shots) {
        if (!s.chipTxt) continue;
        const nx = lands.find(x => x > s.land + 1e-3), gap = nx !== undefined ? nx - s.land : 0.6;
        s.chipCps = d.chipFit === false ? 60 : Math.max(60, s.chipTxt.length / Math.max(0.08, Math.min(0.3, 0.6 * gap) - 0.06));
        s.chipDone = s.land + 0.06 + s.chipTxt.length / s.chipCps; s.chipNext = nx;
      } }
    it.stamps = () => it.shots.filter(s => s.chipTxt).map(s => ({ shot: s.id, text: s.chipTxt, land: s.land, done: s.chipDone, next: s.chipNext ?? null, all: d.chips === 'all' }));
    // push-in and emphasis (default: on the last shot's phrase, the beat after the last landing)
    const last = it.shots[it.shots.length - 1];
    const ref = (o, k) => it.shots[(o && o.shot !== undefined) ? (o.shot < 0 ? it.shots.length + o.shot : o.shot) : k] || last;
    if (d.push !== false) {
      const P = d.push || {}; it.push = { s: ref(P, it.shots.length - 1), at: HP.T(P.at, last.land + BP()), dur: P.dur ?? 0.42, z: P.z ?? 1.42, to: P.to || [540, 880] };
      it.mark(it.push.at, 'push');
      if (d.cam !== false) HP.cam.punch(it.push.at, 0.02, 0.1);
    }
    // assembler (rev2): a shot's own "marks": [{hl (index | phrase | boxes), style, at, color, dur}] are extra emphases on a SECOND
    // phrase of that shot (an emph entry may carry "hl" the same way); they draw in the shot's (pushed, lifted) frame
    const extra = []; it.shots.forEach((s, k) => { for (const m of (s.marks || [])) extra.push({ ...m, shot: k }); });
    it.emph = (d.emph === false ? [] : [].concat(d.emph || [{ style: 'lift' }, { style: 'circle', off: 0.5 }])).concat(extra).map((e0, k) => {
      const e = typeof e0 === 'string' ? { style: e0 } : { ...e0 };
      e.s = ref(e, it.shots.length - 1);
      if (e.s && e.hl !== undefined) { e.boxes = (hlBoxes(e.s.rec, e.hl) || []).map(b => toRect(b)); if (!e.boxes.length) HP.WARN.push(`screens ${it.id}: emph hl ${JSON.stringify(e.hl)} not found on ${e.s.id}`); }
      e.at = e.at !== undefined ? HP.T(e.at) : (it.push ? it.push.at : last.land + BP()) + (e.off ?? 0) * BP();
      e.dur = e.dur ?? ({ circle: 0.42, underline: 0.22, marker: 0.24, lift: 0.22, box: 0.36 }[e.style] ?? 0.3);
      e.color = e.color || (e.style === 'marker' ? (it.dark ? COL.pink : COL.pink) : COL.red);
      e.key = `${it.id}|emph${k}`;
      it.mark(e.at, 'emph:' + e.style);
      return e;
    }).filter(e => e.s && (e.boxes || e.s.boxes).length);
    // assembler (rev2): payoffs for check/coverage.py: the pile's end-of-bar emphases (lift, pencil marks, second marker) on its lead
    // phrase are complete at these times (the per-shot marker sweeps are landing accents on a pile meant to overwhelm: not counted)
    it.payoffs = () => it.emph.map(e => ({ what: `emph ${e.style} ${e.s.id}`, at: e.at + e.dur }));
    // exit
    const X = typeof d.out === 'string' ? { style: d.out } : { style: 'scatter', ...(d.out || {}) };
    it.out = { ...X, dur: X.dur ?? 0.3 }; it.out.at = X.at !== undefined ? HP.T(X.at) : it.t1 - it.out.dur;
    if (it.out.style !== 'cut') it.mark(it.out.at, 'out:' + it.out.style);
    it.pulse = d.pulse ? HP.fxTimes({ on: d.pulse, id: it.id }).times : null;
    for (const b of (it.pulse || [])) it.mark(b, 'pulse');
  },
  layout(it) { for (const s of (it.shots || [])) if (s.chip) { const B = TX().chipBitmap(s.chipTxt, s.chipO); s.chipW = B.w; s.chipH = B.h; } },
  draw(it, t) {
    const c = it.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
    if (!it.shots || !it.shots.length) return;
    const d = it.d, PM = pileMatrix(it, t), P = paint();
    const ground = it.dark ? NIGHT : CREAM;
    const top = it.shots.filter(s => t >= s.land - EPS).pop();
    // fixer r3 (coverage.py): the pile's canvas counts as imagery only once a card has landed
    if (top) it.cv.dataset.hpImg = it.id; else delete it.cv.dataset.hpImg;
    const outU = it.out.style === 'cut' ? 0 : pr(t, it.out.at, it.out.dur);
    // fixer r3 "chips": "all": an older card keeps its chip unless a newer landed card's chip sits on it (no half-hidden double
    // print): the chips' anchors (each card's lower-left corner) this frame
    if (d.chips === 'all') for (const s of it.shots) {
      s._anc = null; if (!s.chipTxt || t < s.land - EPS) continue;
      const ep = entryPose(s, t), ex = exitPose(it, s, outU);
      const M = PM.multiply(new DOMMatrix().translate(s.cx + ep.dx + ex.dx, s.cy + ep.dy + ex.dy).rotate(s.rot + ep.rot + ex.rot).scale(ep.sc * ex.sc, ep.sc * ep.sy * ex.sc));
      s._anc = M.transformPoint(new DOMPoint(-s.w / 2 - s.pad, s.h / 2 + s.pad + 10));
    }
    const chipHidden = (s) => it.shots.some(o => o.idx > s.idx && o._anc && s._anc && Math.abs(o._anc.y - s._anc.y) < 80 && Math.abs(o._anc.x - s._anc.x) < 0.5 * Math.max(o.chipW || 300, s.chipW || 300));
    for (const s of it.shots) {
      const ep = entryPose(s, t);
      if (!ep.vis) { if (s.chip) s.chip.style.display = 'none'; continue; }
      // newer shots landed: dim + blur this one
      let newer = 0; for (const o of it.shots) if (o.idx > s.idx) newer += E.oQuad(pr(t, o.land, 0.12));
      if (it.push && s !== it.push.s) newer += 1.2 * E.oQuad(pr(t, it.push.at, it.push.dur));
      const ex = exitPose(it, s, outU);
      const M = PM.multiply(new DOMMatrix().translate(s.cx + ep.dx + ex.dx, s.cy + ep.dy + ex.dy).rotate(s.rot + ep.rot + ex.rot).scale(ep.sc * ex.sc, ep.sc * ep.sy * ex.sc));
      const op = ep.op * ex.op;
      if (op <= 0.003) { if (s.chip) s.chip.style.display = 'none'; continue; }
      c.setTransform(M); c.globalAlpha = op;
      // shadow (lifted while flying in), paper, picture
      const lift = ep.lift, sh = shadowSprite(s.w + 2 * s.pad, s.h + 2 * s.pad, 22 + lift * 18, 0.42 + lift * 0.1);
      c.drawImage(sh.c, -s.w / 2 - s.pad - sh.b + 6 + lift * 26, -s.h / 2 - s.pad - sh.b + 12 + lift * 40);
      const bitmap = bake(`${s.id}|${s.crop.x},${s.crop.y},${s.crop.w},${s.crop.h}`, s.img, { x: s.crop.x * s.fk, y: s.crop.y * s.fk, w: s.crop.w * s.fk, h: s.crop.h * s.fk }, s.bw, s.bh);
      const drawCard = (x) => { x.fillStyle = PAPER; x.fill(paperPath(s.id, s.w, s.h, s.pad)); x.drawImage(bitmap, -s.w / 2, -s.h / 2, s.w, s.h); };
      if (s.entry === 'paint' && s.plan && P) P.drawReveal(c, s.plan, t - s.start, drawCard, { alpha: 0.9 });   // the colour passes stay as a painted rim
      else drawCard(c);
      // the marker over this shot's phrase (multiply: the paper turns yellow, the ink stays)
      c.save(); c.beginPath(); c.rect(-s.w / 2, -s.h / 2, s.w, s.h); c.clip();   // fixer r1: markers never run off the card
      if (s.hlAt !== null && t >= s.hlAt - EPS && P) markBoxes(c, s, t, s.hlAt, { color: s.hlColor || COL.yellow, dur: 0.24, key: `${it.id}|${s.id}|hl` });
      const lifted = it.emph.some(m => m.s === s && m.style === 'lift' && !m.boxes && t >= m.at - EPS);
      for (const e of it.emph) if (e.s === s && e.style === 'marker' && t >= e.at - EPS && P && !(lifted && !e.boxes)) markBoxes(c, emphShot(s, e), t, e.at, { color: e.color, dur: e.dur, key: e.key, h: e.boxes ? 1.18 : 0.5, yK: e.boxes ? 0.55 : 0.86 });
      c.restore();
      if (ep.shade > 0.01) { c.fillStyle = `rgba(14,13,18,${ep.shade.toFixed(3)})`; c.fill(paperPath(s.id, s.w, s.h, s.pad)); }
      // dim + blur when buried
      const nb = clamp(newer);
      if (nb > 0.01) {
        c.globalAlpha = op * nb * 0.9; c.drawImage(blurred(s.id + '|' + s.crop.x + ',' + s.crop.y, bitmap, 3), -s.w / 2, -s.h / 2, s.w, s.h);
        c.globalAlpha = op * Math.min(d.dim ?? 0.42, 0.2 * newer + 0.12 * nb); c.fillStyle = ground; c.fill(paperPath(s.id, s.w, s.h, s.pad));
      }
      c.globalAlpha = op;
      // emphasis (lift, pencil)
      for (const e of it.emph) if (e.s === s && t >= e.at - EPS && e.style !== 'marker') drawEmph(c, it, emphShot(s, e), e, t, M);
      c.globalAlpha = 1;
      // chip at the card's lower-left corner, for the newest shot (and the emphasised one at the end)
      if (s.chip) {
        const keep = s === top || (d.chips === 'all' && !chipHidden(s)) || (it.emph.length && it.emph[0].s === s && t >= it.emph[0].at - EPS);
        if (!keep || t < s.land - EPS) { s.chip.style.display = 'none'; continue; }
        let CM = M.multiply(new DOMMatrix().translate(-s.w / 2 - s.pad, s.h / 2 + s.pad + 10).scale(1 / Math.max(0.5, ep.sc * ex.sc)));
        // fixer r1: when the slot under the card is below the safe zone (safeFit would push the chip up over the headline), it
        // goes above the card's top-left corner instead
        if (chipBox(CM, s.chipW, s.chipH)[3] > 1570) { const CT = M.multiply(new DOMMatrix().translate(-s.w / 2 - s.pad, -s.h / 2 - s.pad - 10).scale(1 / Math.max(0.5, ep.sc * ex.sc)).translate(0, -s.chipH)); if (chipBox(CT, s.chipW, s.chipH)[1] >= 254) CM = CT; }
        safeFit(CM, s.chipW, s.chipH);
        Object.assign(s.chip.style, { display: 'block', transform: mat(CM) });
        const tx = TX().typed(s.chipTxt, t, s.land + 0.06, s.chipCps || 60);
        if (tx) { c.setTransform(CM); c.globalAlpha = op * (1 - outU); c.drawImage(TX().chipBitmap(tx, s.chipO).cv, 0, 0); c.globalAlpha = 1; }
      }
    }
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
  },
  texts(it) { return (it.shots || []).filter(s => s.chip).map(s => ({ text: s.chip.textContent, reveal: 'chars', role: 'meta' })); },
});
// the shot as an emphasis sees it: its own boxes, or the emph entry's second phrase (assembler, rev2)
const emphShot = (s, e) => e.boxes ? Object.assign(Object.create(s), { boxes: e.boxes }) : s;
const chipBox = (M, w, h) => { const P = [[0, 0], [w, 0], [0, h], [w, h]].map(([x, y]) => M.transformPoint(new DOMPoint(x, y))); return [Math.min(...P.map(p => p.x)), Math.min(...P.map(p => p.y)), Math.max(...P.map(p => p.x)), Math.max(...P.map(p => p.y))]; };
// keep a w x h box drawn with matrix M inside the text-safe zone (x 64-1010, y 254-1570; x <= 926 where it reaches below y 1000,
// the Reels/TikTok button rail): shrink it if needed, then shift it (edits M in place)
function safeFit(M, w, h) {
  const box = () => { const P = [[0, 0], [w, 0], [0, h], [w, h]].map(([x, y]) => M.transformPoint(new DOMPoint(x, y))); return [Math.min(...P.map(p => p.x)), Math.min(...P.map(p => p.y)), Math.max(...P.map(p => p.x)), Math.max(...P.map(p => p.y))]; };
  let [x0, y0, x1, y1] = box();
  const xMax = () => (y1 > 1000 ? 926 : 1010), maxW = xMax() - 64;
  if (x1 - x0 > maxW) { const k = maxW / (x1 - x0); M.a *= k; M.b *= k; M.c *= k; M.d *= k; [x0, y0, x1, y1] = box(); }
  const dx = x0 < 64 ? 64 - x0 : x1 > xMax() ? xMax() - x1 : 0, dy = y0 < 254 ? 254 - y0 : y1 > 1570 ? 1570 - y1 : 0;
  M.e += dx; M.f += dy;
  if (dy) { [x0, y0, x1, y1] = box(); if (x1 > xMax()) M.e += xMax() - x1; }
  return M;
}
// marker strokes over a shot's OCR boxes (card-local units), swept line by line
function markBoxes(c, s, t, at, o) {
  const P = paint();
  s.boxes.forEach((b, i) => {
    const u = pr(t, at + i * o.dur * 0.6, o.dur); if (u <= 0) return;
    const x0 = (b.x - s.crop.x) * s.ks - s.w / 2, x1 = (b.x + b.w - s.crop.x) * s.ks - s.w / 2, yc = (b.y + b.h * (o.yK ?? 0.55) - s.crop.y) * s.ks - s.h / 2;
    P.highlight(c, { key: `${o.key}|${i}|${Math.round(s.ks * 1000)}`, x0, x1, y: yc, h: b.h * s.ks * (o.h ?? 1.12), angle: -0.6, color: o.color, alpha: 0.85, over: 6, blend: 'multiply' }, E.oQuad(u));
  });
}
function phraseRect(s) {   // union of the boxes, card-local
  const xs0 = s.boxes.map(b => (b.x - s.crop.x) * s.ks - s.w / 2), xs1 = s.boxes.map(b => (b.x + b.w - s.crop.x) * s.ks - s.w / 2);
  const ys0 = s.boxes.map(b => (b.y - s.crop.y) * s.ks - s.h / 2), ys1 = s.boxes.map(b => (b.y + b.h - s.crop.y) * s.ks - s.h / 2);
  return { x0: Math.min(...xs0), x1: Math.max(...xs1), y0: Math.min(...ys0), y1: Math.max(...ys1) };
}
// fixer r1: per-phrase lift geometry (card-local px): one scale for every line of the phrase, limited by the ink-free room (and the
// card's edge) around each line; each slip shifts off its nearer neighbour. kmax = the room, kb = the resting lift (pulse kicks to kmax)
function liftGeom(s, e) {
  return HP.memo(`scr|liftg|${e.key}|${s.id}|${Math.round(s.ks * 1e4)}|${s.boxes.map(b => [b.x, b.y, b.w, b.h].join(',')).join(';')}`, () => {
    const rows = s.boxes.map(b => {
      const R = inkRoom(s, b), w = b.w * s.ks, h = b.h * s.ks;
      const cardL = (b.x - s.crop.x) * s.ks, cardR = (s.crop.x + s.crop.w - b.x - b.w) * s.ks + s.pad - 4;
      const cardT = (b.y - s.crop.y) * s.ks + s.pad - 4, cardB = (s.crop.y + s.crop.h - b.y - b.h) * s.ks + s.pad - 4;
      const aL = Math.min(R.l * s.ks - 2, cardL + s.pad - 4), aR = Math.min(R.r * s.ks - 2, cardR), aT = Math.min(R.t * s.ks - 2, cardT), aB = Math.min(R.b * s.ks - 2, cardB);
      const p = clamp(Math.min(aL, aR, aT, aB), 2, 8);
      const x0 = (b.x - s.crop.x) * s.ks - s.w / 2, y0 = (b.y - s.crop.y) * s.ks - s.h / 2;
      return { b, w, h, p, aL, aR, aT, aB, cx: x0 + w / 2, cy: y0 + h / 2,
        kx: (w + Math.max(0, aL) + Math.max(0, aR)) / (w + 2 * p), ky: (h + Math.max(0, aT) + Math.max(0, aB)) / (h + 2 * p) };
    });
    const kmax = Math.max(1, Math.min(e.scale ?? 1.14, ...rows.map(r => Math.min(r.kx, r.ky))));
    for (const r of rows) {
      const fit = (k, half, aLo, aHi, len) => { const ext = k * (len / 2 + r.p) - len / 2, oLo = ext - aLo, oHi = ext - aHi; return oLo > 0 && oHi <= 0 ? Math.min(oLo, -oHi) : oHi > 0 && oLo <= 0 ? -Math.min(oHi, -oLo) : 0; };
      r.dx = k => fit(k, 0, r.aL, r.aR, r.w);
      r.dy = k => fit(k, 0, r.aT, r.aB, r.h);
    }
    return { rows, kmax, kb: 1 + (kmax - 1) * 0.8 };
  });
}
// the y of a pencil underline under a box: in the gap to the next line of ink, never through it
function underY(s, b) {
  const R = inkRoom(s, b), gap = R.b * s.ks;
  return (b.y + b.h - s.crop.y) * s.ks - s.h / 2 + clamp(gap * 0.45, 3, 10);
}
function drawEmph(c, it, s, e, t, M) {
  const P = paint(), R = phraseRect(s), u = pr(t, e.at, e.dur);
  if (e.style === 'lift') {   // the phrase's own pixels lifted off the page (scaled copy on a paper slip, shadow): bold without retyping
    // fixer r1: the slips grow only into the ink-free room around each line (inkRoom), with one scale for the whole phrase, shifted
    // off a near neighbour, clipped to the card: they never cover a word outside the phrase ('of', 'So') or leave the card. The rest
    // of the card dims a little under them, so the phrase reads as lifted even where there is little room to grow.
    const G = liftGeom(s, e), kick = (e.kick ?? 0.5) * pulseAmp(it, t);
    const k = lerp(1, G.kb, E.oCub(u)) + (G.kmax - G.kb) * kick;
    c.save();
    c.beginPath(); c.rect(-s.w / 2 - s.pad, -s.h / 2 - s.pad, s.w + 2 * s.pad, s.h + 2 * s.pad); c.clip();
    c.fillStyle = `rgba(14,13,18,${(0.18 * E.oQuad(u)).toFixed(3)})`; c.fill(paperPath(s.id, s.w, s.h, s.pad));
    const marks = it.emph.filter(m => m.s && m.s.id === s.id && m.style === 'marker' && !m.boxes && t >= m.at - EPS);
    G.rows.forEach((g, i) => {
      const { b, w, h, p, cx, cy } = g, ox = lerp(0, g.dx(k), 1), oy = g.dy(k) - 3 * E.oCub(u);
      c.save(); c.translate(cx + ox, cy + oy); c.scale(k, k); c.rotate((HP.rand(e.key, i) - 0.5) * 0.008 * u);
      const sh = shadowSprite(w + 2 * p, h + 2 * p, 12, 0.36 * u);
      c.drawImage(sh.c, -w / 2 - p - sh.b + 2, -h / 2 - p - sh.b + 5);
      c.fillStyle = '#ffffff'; c.fillRect(-w / 2 - p, -h / 2 - p, w + 2 * p, h + 2 * p);
      const fk = s.fk, img = s.img;
      c.drawImage(img, b.x * fk - p / s.ks * fk, b.y * fk - p / s.ks * fk, (b.w + 2 * p / s.ks) * fk, (b.h + 2 * p / s.ks) * fk, -w / 2 - p, -h / 2 - p, w + 2 * p, h + 2 * p);
      c.save(); c.beginPath(); c.rect(-w / 2 - p, -h / 2 - p, w + 2 * p, h + 2 * p); c.clip();   // markers stay on the slip
      if (s.hlAt !== null) paint().highlight(c, { key: `${e.key}|lift${i}|${Math.round(s.ks * 1000)}`, x0: -w / 2, x1: w / 2, y: h * 0.05, h: h * 1.12, angle: -0.5, color: s.hlColor || COL.yellow, alpha: 0.85, over: 6, blend: 'multiply' }, 1);
      for (const m of marks) {   // a later marker pass (e.g. the pink second pass) lands on the lifted copy, not under it
        const um = pr(t, m.at + i * m.dur * 0.6, m.dur); if (um <= 0) continue;
        paint().highlight(c, { key: `${m.key}|lift${i}|${Math.round(s.ks * 1000)}`, x0: -w / 2, x1: w / 2, y: h * 0.1, h: h * 0.62, angle: -0.5, color: m.color, alpha: 0.8, over: 6, blend: 'multiply' }, E.oQuad(um));
      }
      c.restore();
      c.restore();
    });
    c.restore();
    return;
  }
  if (!P) return;
  const p = E.ioQuad(u), sh = [];
  const multi = s.boxes.length > 1 || (R.x1 - R.x0) > 0.8 * s.w;   // fixer r1: an ellipse round two full lines cuts through the words beside them
  if (e.style === 'circle' && !multi) sh.push({ kind: 'ellipse', cx: (R.x0 + R.x1) / 2, cy: (R.y0 + R.y1) / 2, w: (R.x1 - R.x0) * 1.06 + 48, h: (R.y1 - R.y0) * 1.25 + 30, p });
  else if (e.style === 'underline' || e.style === 'circle') s.boxes.forEach((b, i) => { const x0 = (b.x - s.crop.x) * s.ks - s.w / 2, x1 = x0 + b.w * s.ks, y = underY(s, b); sh.push({ kind: 'underline', x0: Math.max(x0 - 6, -s.w / 2), x1: Math.min(x1 + 8, s.w / 2), y, sag: 5, p: clamp(p * s.boxes.length - i) }); });
  else if (e.style === 'box') sh.push({ kind: 'rect', x: R.x0 - 18, y: R.y0 - 12, w: R.x1 - R.x0 + 36, h: R.y1 - R.y0 + 24, p });
  else return;
  P.pencil(c, sh, { key: e.key, t, color: e.color, width: e.width ?? 7, alpha: 0.95 });
}
function pulseAmp(it, t) { let a = 0; for (const b of (it.pulse || [])) { if (t < b - EPS) break; a = Math.max(a, Math.exp(-(t - b) / 0.1)); } return a < 0.01 ? 0 : a; }
// auto layout: "stack" (top to bottom, overlapping ~12%, alternating tilt and offset) | "scatter" (around a centre) | explicit x/y
function layoutPile(it) {
  const d = it.d, S = it.shots, R = { x0: 60, y0: 300, x1: 1020, y1: 1480, ...(d.region || {}) }, n = S.length;
  const J = { x: 46, y: 18, rot: 4.5, ...(d.jitter || {}) };
  const ov = d.overlap ?? 0.12, wDefault = d.w ?? 900;
  for (const s of S) { s.w = s.w0 || s.width || wDefault; s.h = s.w * s.crop.h / s.crop.w; }
  const mode = d.layout || 'stack';
  if (mode === 'stack') {
    // keep every shot legible when it lands (>= minK of its width, default 0.86); when they do not fit with the default overlap,
    // the overlap grows (up to maxOverlap 0.4): the newest shot is always whole and on top, older ones are dimmed anyway
    const avail = R.y1 - R.y0, hs = () => S.map(s => s.h), need = (o) => { const h = hs(); return h.reduce((a, x) => a + x, 0) - o * h.slice(1).reduce((a, x) => a + x, 0); };
    let o = ov;
    if (need(o) > avail) { const h = hs(), tot = h.reduce((a, x) => a + x, 0), rest = h.slice(1).reduce((a, x) => a + x, 0); o = Math.min(d.maxOverlap ?? 0.4, rest ? (tot - avail) / rest : 0); }
    if (need(o) > avail) { const k = Math.max(d.minK ?? 0.86, avail / need(o)); for (const s of S) { s.w *= k; s.h = s.w * s.crop.h / s.crop.w; } }
    let y = R.y0 + Math.max(0, (avail - need(o)) / 2);
    S.forEach((s, i) => {
      const r = HP.rng(it.id, 'lay', i), side = i % 2 ? 1 : -1;
      s.cx = s.x ?? clamp((R.x0 + R.x1) / 2 + side * (r() * 0.6 + 0.4) * J.x, R.x0 + s.w / 2 - 30, R.x1 - s.w / 2 + 30);
      s.cy = s.y ?? (y + s.h / 2 + (r() - 0.5) * J.y);
      s.rot = s.rot ?? side * (2 + r() * (J.rot - 2));
      y += s.h * (1 - o);
    });
  } else {
    const C = d.center || [540, 880];
    S.forEach((s, i) => { const r = HP.rng(it.id, 'lay', i); s.cx = s.x ?? C[0] + (r() - 0.5) * 2 * (J.x * 2.5); s.cy = s.y ?? C[1] + (r() - 0.5) * 2 * (J.y * 10); s.rot = s.rot ?? (r() - 0.5) * 2 * J.rot; });
  }
  for (const s of S) {
    s.cx += s.dx || 0; s.cy += s.dy || 0;   // fixer r3: a shot's own nudge after the layout (e.g. off a card's highlighted phrase)
    s.ks = s.w / s.crop.w; s.pad = s.pad ?? (d.pad ?? 10);
    s.bw = Math.round(Math.min(s.crop.w * s.fk, s.w * (d.bake ?? 1.6))); s.bh = Math.round(s.bw * s.crop.h / s.crop.w);
  }
}
// the pile's frame transform: push-in to the emphasised phrase, slow drift, beat pulses
function pileMatrix(it, t) {
  const d = it.d, life = it.life(t), C = [540, 900];
  let m = new DOMMatrix();
  const dz = d.drift ?? 0.035, z = 1 + dz * E.ioSine(life);
  let k = z;
  let rot = 0;
  if (it.pulse) it.pulse.forEach((b, i) => { if (t < b - EPS) return; const a = Math.exp(-(t - b) / 0.09); if (a > 0.01) { k *= 1 + (d.pulseAmt ?? 0.02) * a; rot += (i % 2 ? 1 : -1) * (d.pulseRot ?? 1.4) * a; } });
  m = m.translate(C[0], C[1]).rotate(rot).scale(k).translate(-C[0], -C[1]);
  const P = it.push;
  if (P && t >= P.at - EPS) {
    const u = E.ioCub(pr(t, P.at, P.dur)), s = P.s, R = phraseRect(s);
    const pt = new DOMMatrix().translate(s.cx, s.cy).rotate(s.rot).transformPoint(new DOMPoint((R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2));
    // keep the zoomed card inside the frame: cap the zoom so the phrase (plus margin) fits 960 px
    const pw = (R.x1 - R.x0) + 80;
    // fixer r1: and the whole card (plus a margin for the drift) fits the frame width, shifted sideways so neither edge leaves it
    const rr = Math.abs(s.rot) * Math.PI / 180, hw = (s.w / 2 + s.pad) * Math.cos(rr) + (s.h / 2 + s.pad) * Math.sin(rr);
    const zmax = it.d.push && it.d.push.overflow ? Math.max(1, Math.min(P.z, 940 / pw)) : Math.max(1, Math.min(P.z, 940 / pw, 960 / (2 * hw)));
    const zf = zmax, cxF = P.to[0] + zf * (s.cx - pt.x), fixX = cxF - zf * hw < 60 ? 60 - (cxF - zf * hw) : cxF + zf * hw > 1020 ? 1020 - (cxF + zf * hw) : 0;
    const zz = lerp(1, zmax, u), ax = lerp(pt.x, P.to[0] + fixX, u), ay = lerp(pt.y, P.to[1], u);
    m = m.multiply(new DOMMatrix().translate(ax, ay).scale(zz).translate(-pt.x, -pt.y));
  }
  return m;
}
function exitPose(it, s, u) {
  const r = { dx: 0, dy: 0, rot: 0, sc: 1, op: 1 };
  if (u <= 0) return r;
  const X = it.out, n = it.shots.length, k = s.idx, uu = clamp((u - (n - 1 - k) * 0.06) / (1 - Math.min(0.5, (n - 1) * 0.06)));
  const R = HP.rng(it.id, 'out', k);
  switch (X.style) {
    case 'scatter': { const a = R() * Math.PI * 2, dist = 2600 * E.iCub(uu); r.dx = Math.cos(a) * dist; r.dy = Math.sin(a) * dist; r.rot = (R() - 0.5) * 120 * uu; break; }
    case 'sweep': r.dx = -1400 * E.iCub(uu); r.rot = -8 * uu; break;
    case 'drop': r.dy = 1700 * E.iQuad(uu); r.rot = (R() - 0.5) * 60 * uu; break;
    case 'collapse': r.sc = 1 - E.ioCub(u); r.rot = 30 * u; break;
    case 'fade': r.op = 1 - u; break;
  }
  return r;
}

// ============================================================ panel: footage or a still in a Kandinsky mask
const panelLt = (it, t) => (it.d.freeze !== undefined ? Math.min(t, it._frz ?? (it._frz = HP.T(it.d.freeze))) : t) - it.t0;
const d0 = it => String(it.d.credit);
function maskPath(shape, w, h, key, t, o = {}) {
  const p = new Path2D(), R = Math.min(w, h) / 2;
  switch (shape) {
    case 'circle': p.arc(0, 0, R, 0, Math.PI * 2); break;
    case 'blob': {   // liquid edge (seeded, slowly moving)
      const ph = HP.rand(key, 'ph') * 10;
      for (let i = 0; i <= 96; i++) { const a = i / 96 * Math.PI * 2, rr = R * (1 + 0.035 * Math.sin(3 * a + ph + t * 1.3) + 0.022 * Math.sin(5 * a - ph * 1.7 - t * 2.1) + 0.012 * Math.sin(9 * a + t * 3.1)); const x = Math.cos(a) * rr, y = Math.sin(a) * rr; i ? p.lineTo(x, y) : p.moveTo(x, y); }
      p.closePath(); break;
    }
    case 'triangle': { const r = R * 1.15; for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 3; const x = Math.cos(a) * r, y = Math.sin(a) * r + r * 0.18; i ? p.lineTo(x, y) : p.moveTo(x, y); } p.closePath(); break; }
    case 'square': p.rect(-R, -R, 2 * R, 2 * R); break;
    default: p.rect(-w / 2, -h / 2, w, h);   // rect, band
  }
  return p;
}
function outlinePts(shape, w, h, key) {   // a closed outline for the painted / pencil frame (slight overshoot, seeded start)
  const R = Math.min(w, h) / 2, a0 = HP.rand(key, 'a0') * Math.PI * 2, pts = [];
  if (shape === 'circle' || shape === 'blob') { for (let i = 0; i <= 52; i++) { const a = a0 + i / 48 * Math.PI * 2; pts.push([Math.cos(a) * R, Math.sin(a) * R]); } return pts; }
  let V;
  if (shape === 'triangle') { const r = R * 1.15; V = [0, 1, 2].map(i => { const a = -Math.PI / 2 + i * 2 * Math.PI / 3; return [Math.cos(a) * r, Math.sin(a) * r + r * 0.18]; }); }
  else if (shape === 'square') V = [[-R, -R], [R, -R], [R, R], [-R, R]];
  else V = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
  const n = V.length;
  for (let i = 0; i <= n; i++) { const A = V[i % n], B = V[(i + 1) % n]; for (let k = 0; k < 6; k++) pts.push([lerp(A[0], B[0], k / 6), lerp(A[1], B[1], k / 6)]); }
  pts.push(V[1]);
  return pts;
}
HP.register('panel', {
  ownMotion: true,
  build(it) {
    const d = it.d, f = d.frame || {};
    it.shape = d.shape || f.shape || 'circle';
    it.cx = f.cx ?? (f.x !== undefined ? f.x + f.w / 2 : 540); it.cy = f.cy ?? (f.y !== undefined ? f.y + (f.h ?? f.w) / 2 : 900);
    it.w = f.r !== undefined ? 2 * f.r : (f.w ?? 600); it.h = f.r !== undefined ? 2 * f.r : (f.h ?? f.w ?? 600);
    it.rot = d.rot ?? f.rot ?? 0;
    const diag = Math.hypot(it.w, it.h) * (it.shape === 'triangle' ? 1.25 : 1) + 120;
    it.M = diag / 2;
    it.cv = el('canvas', '', it.el, { position: 'absolute', left: (it.cx - it.M) + 'px', top: (it.cy - it.M) + 'px', width: (2 * it.M) + 'px', height: (2 * it.M) + 'px' });
    it.cv.width = it.cv.height = Math.ceil(2 * it.M); it.ctx = it.cv.getContext('2d'); it.imagery(it.cv);
    const prep = d.prep || (d.src && /\.(png|jpe?g|webp)$/i.test(d.src) ? 'image' : 'clip');
    it.still = prep === 'image';
    if (!it.still) it.seq = HP.assets.frames('cache/' + (d.frames || it.id));
    it.en = typeof d.entry === 'string' ? { style: d.entry } : { style: 'iris', ...(d.entry || {}) };
    it.en.at = HP.T(it.en.at, it.t0); it.en.dur = it.en.dur ?? (it.en.style === 'paint' ? 0.36 : 0.3);
    it.mark(it.en.at, 'panel:' + it.en.style);
    it.ex = typeof d.out === 'string' ? { style: d.out } : { style: 'iris', ...(d.out || {}) };
    it.ex.dur = it.ex.dur ?? 0.24; it.ex.at = HP.T(it.ex.at, it.t1 - it.ex.dur);
    it.pulse = d.pulse ? HP.fxTimes({ on: d.pulse, id: it.id }).times : null;
    for (const b of (it.pulse || [])) it.mark(b, 'pulse');
    it.border = d.border ?? 'paint';
    it.bcol = d.color || (it.theme === 'light' ? INK : COL.yellow);
    if (d.credit) {
      it.creditO = { size: d.creditSize ?? 30, bg: it.theme === 'light' ? INK : CREAM, color: it.theme === 'light' ? CREAM : INK };   // fixer r1: creditSize
      it.credit = TX().chip(it.el, d.credit, { ...it.creditO, ghost: true });
      it.creditCv = el('canvas', '', it.el, { position: 'absolute' }); it.creditX = it.creditCv.getContext('2d');
    }
  },
  async load(it) {
    if (it.still) { it.img = await HP.assets.image(it.d.image || ('cache/' + (it.d.frames || it.id) + '/image.jpg')); }
    else await it.seq.ready;
  },
  layout(it) {
    if (!it.credit) return;
    const B = TX().chipBitmap(d0(it), it.creditO), ext = it.shape === 'triangle' ? it.h * 0.62 : it.shape === 'band' ? (it.w * Math.abs(Math.sin(it.rot * Math.PI / 180)) + it.h) / 2 : it.h / 2;
    let y = it.cy + ext + 18;
    if (y + B.h > 1570) y = it.cy - ext - 18 - B.h;   // no room below the mask: above it
    y = clamp(y, 254, 1570 - B.h);
    if (it.d.creditAt) { it.creditPos = [clamp(it.d.creditAt[0], 64, 1010 - B.w), clamp(it.d.creditAt[1], 254, 1570 - B.h)]; }
    else
    it.creditPos = [clamp(it.cx - it.w / 2, 64, (y + B.h > 1000 ? 926 : 1010) - B.w), y];
    Object.assign(it.creditCv.style, { left: it.creditPos[0] + 'px', top: it.creditPos[1] + 'px', width: B.w + 'px', height: B.h + 'px' }); it.creditCv.width = B.w; it.creditCv.height = B.h;
  },
  // assembler (rev2): "freeze" (time ref): from then on the footage holds its frame (Ken Burns, pulses and the border keep moving)
  async prepare(it, t) { if (!it.still && it.active(t) && it.seq.meta) await it.seq.prepare(it.seq.frameAt(panelLt(it, t), it.d.speed || 1)); },
  draw(it, t) {
    const d = it.d, c = it.ctx, M = it.M; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, it.cv.width, it.cv.height);
    const img = it.still ? it.img : it.seq.now(it.seq.frameAt(panelLt(it, t), d.speed || 1));
    // motion: entry, exit, pulses, a slow spin
    let sc = 1, rot = it.rot + (d.spin || 0) * it.life(t), op = 1;
    const ue = pr(t, it.en.at - (it.en.style === 'paint' ? 1 / 30 : 0.05), it.en.dur);
    if (it.en.style === 'iris') sc *= E.oBack(ue, 1.8);
    else if (it.en.style === 'pop') sc *= lerp(0.3, 1, E.oBack(ue, 2.4));
    else if (it.en.style === 'slam') { sc *= lerp(1.5, 1, E.oCub(ue)); op *= clamp(ue * 5); }
    else if (it.en.style === 'fade') op *= E.ioSine(ue);   // fixer r2: a ghosted full-frame layer fades in
    const ux = pr(t, it.ex.at, it.ex.dur);
    if (ux > 0) { if (it.ex.style === 'iris' || it.ex.style === 'collapse') { sc *= 1 - E.iCub(ux); if (it.ex.style === 'collapse') rot += 60 * ux; } else if (it.ex.style === 'fade') op *= 1 - ux; }
    if (it.pulse) for (const b of it.pulse) { if (t < b - EPS) break; const a = Math.exp(-(t - b) / 0.1); if (a > 0.01) sc *= 1 + (d.pulseAmt ?? 0.035) * a; }
    if (sc <= 0.002 || op <= 0.002) { if (it.credit) it.credit.style.display = 'none'; return; }
    c.setTransform(new DOMMatrix().translate(M, M).rotate(rot).scale(sc));
    c.globalAlpha = op;
    const path = maskPath(it.shape, it.w, it.h, it.id, t);
    // Ken Burns: zoom z0 -> z1 and a pan over the item's life (the footage stays upright: counter-rotate the picture)
    const kb = { z: [1.0, 1.14], pan: [0, 0], ...(d.kb || {}) }, life = it.life(t), kz = lerp(kb.z[0], kb.z[1], E.ioSine(life));
    const drawPic = (x) => {
      if (!img) { x.fillStyle = '#26232e'; x.fill(path); return; }
      x.save(); x.clip(path);
      const up = d.upright === false ? 0 : rot * Math.PI / 180;   // footage stays upright inside a rotated mask
      x.rotate(-up);
      const ca = Math.abs(Math.cos(up)), sa = Math.abs(Math.sin(up)), mw = it.w * (it.shape === 'triangle' ? 1.25 : 1), mh = it.h * (it.shape === 'triangle' ? 1.25 : 1);
      const bw = mw * ca + mh * sa, bh = mw * sa + mh * ca, fit = Math.max(bw / img.width, bh / img.height) * kz;
      const sw = img.width * fit, sh2 = img.height * fit;
      x.drawImage(img, -sw / 2 + kb.pan[0] * E.ioSine(life), -sh2 / 2 + kb.pan[1] * E.ioSine(life), sw, sh2);
      x.restore();
    };
    const P = paint();
    if (it.en.style === 'paint' && P && t < it.en.at + it.en.dur + 0.1) {
      // painted in stroke by stroke, inside the mask (the colour passes show first, the picture follows through the brush mask)
      const plan = P.revealPlan([-it.w / 2, -it.h / 2, it.w, it.h], { key: it.id + '|rv', color: d.revealColor || 'pink', width: Math.max(92, Math.min(it.w, it.h) / 4) });
      c.save(); c.clip(path); P.drawReveal(c, plan, t - it.en.at + 1 / 30, drawPic, { alpha: 0.9 }); c.restore();
    } else drawPic(c);
    // frame: painted bristle ring (drawn on) or pencil (boiling)
    const bp = E.oQuad(pr(t, it.en.at + (d.borderDelay ?? 0.06), d.borderDur ?? 0.34));
    if (P && bp > 0 && it.border !== 'none') {
      const pts = outlinePts(it.shape, it.w, it.h, it.id);
      if (it.border === 'paint' || it.border === 'both') {
        const bw = d.borderW ?? 26, key = `${it.id}|ring|${bw}`;
        const S = HP.memo('scr|ring|' + key, () => P.makeStroke(pts, { width: bw, color: it.bcol, seed: key, dry: 0.35, gaps: 0.35, pressure: [0.9, 1, 0.7] }));
        P.strokeAt(c, S, bp, key, { alpha: 0.96 });
      }
      if (it.border === 'pencil' || it.border === 'both') {
        const sh = it.shape === 'circle' || it.shape === 'blob' ? [{ kind: 'ellipse', cx: 0, cy: 0, w: it.w * 1.04, h: it.h * 1.03, p: bp }] : [{ kind: 'curve', pts: pts.filter((_, i) => i % 3 === 0).concat([pts[pts.length - 1]]), p: bp }];
        P.pencil(c, sh, { key: it.id + '|pen', t, color: d.pencilColor || (it.theme === 'light' ? '#2A2832' : CREAM), width: 6 });
      }
    }
    c.globalAlpha = 1;
    if (it.credit) {
      const on = t >= it.en.at + 0.2 - EPS && (1 - ux) * op > 0.01 && (it.d.creditUntil === undefined || t < HP.T(it.d.creditUntil) - EPS), x = it.creditX;   // fixer r3: creditUntil
      Object.assign(it.credit.style, { display: on ? 'block' : 'none', left: it.creditPos[0] + 'px', top: it.creditPos[1] + 'px' });
      x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, it.creditCv.width, it.creditCv.height);
      const tx = on ? TX().typed(d0(it), t, it.en.at + 0.2, it.d.creditCps ?? 50) : '';   // fixer r3: creditCps
      if (tx) { x.globalAlpha = op * (1 - ux); x.drawImage(TX().chipBitmap(tx, it.creditO).cv, 0, 0); x.globalAlpha = 1; }
    }
  },
  texts(it) { return it.credit ? [{ text: it.d.credit, reveal: 'chars', role: 'meta' }] : []; },
});

// ============================================================ screen (one card; the stub, kept for old test EDLs)
HP.register('screen', {
  ownMotion: true,
  build(it) {
    const d = it.d;
    it.card = el('div', '', it.el, { position: 'absolute', left: (d.x ?? 80) + 'px', top: (d.y ?? 500) + 'px', width: (d.w ?? 920) + 'px', transformOrigin: '50% 50%', boxShadow: '0 18px 40px rgba(0,0,0,0.35)' });
    it.img = el('img', '', it.card, { display: 'block', width: '100%' });
    it.imagery(it.img);
    it.hls = (d.hl || []).map(h => { const b = el('div', '', it.card, { position: 'absolute', background: h.color || HP.COL.yellow, mixBlendMode: 'multiply', transformOrigin: '0 50%' }); return { ...h, el: b, at: HP.T(h.at) }; });
    for (const h of it.hls) it.mark(h.at, 'highlight');
    if (d.source) { it.srcEl = el('div', '', it.el, { position: 'absolute', left: (d.x ?? 80) + 'px', font: "500 30px 'IBM Plex Mono', monospace", letterSpacing: '0.06em', textTransform: 'uppercase', color: d.ink || HP.COL.ink }); it.srcEl.textContent = d.source; }
  },
  async load(it) {
    const im = await HP.assets.image(it.d.src);
    if (im) { it.img.src = im.src; await it.img.decode().catch(() => {}); it.nat = [im.naturalWidth, im.naturalHeight]; }
  },
  layout(it) {
    const d = it.d, k = (d.w ?? 920) / (it.nat ? it.nat[0] : 1);
    for (const h of it.hls) Object.assign(h.el.style, { left: (h.x * k) + 'px', top: (h.y * k) + 'px', width: (h.w * k) + 'px', height: (h.h * k) + 'px' });
    if (it.srcEl) it.srcEl.style.top = ((d.y ?? 500) + (it.nat ? it.nat[1] * k : 0) + 24) + 'px';
  },
  draw(it, t) {
    const d = it.d, u = pr(t, it.t0, d.drop ?? 0.16), s = lerp(1.3, 1, E.oCub(u));
    const r = (d.rot ?? (HP.rand(it.id, 'rot') * 8 - 4)) * (1 + 0.6 * (1 - E.oCub(u)));
    it.card.style.transform = `rotate(${r.toFixed(3)}deg) scale(${s.toFixed(4)})`;
    it.card.style.opacity = clamp(u * 4);
    for (const h of it.hls) h.el.style.transform = `scaleX(${E.oCub(pr(t, h.at, 0.24)).toFixed(4)})`;
    if (it.srcEl) it.srcEl.style.opacity = clamp((t - it.t0 - 0.15) / 0.1);
  },
  texts(it) { return it.d.source ? [{ text: it.d.source, reveal: 'none', role: 'meta' }] : []; },
});

// ============================================================ broll: full-box footage with a Ken Burns drift
HP.register('broll', {
  build(it) {
    const d = it.d, b = it.box = d.box || { x: 0, y: 330, w: 1080, h: 940 };
    it.cv = el('canvas', '', it.el, { position: 'absolute', left: b.x + 'px', top: b.y + 'px', width: b.w + 'px', height: b.h + 'px' });
    it.cv.width = b.w; it.cv.height = b.h; it.ctx = it.cv.getContext('2d'); it.imagery(it.cv);
    it.seq = HP.assets.frames('cache/' + (d.frames || it.id));
  },
  async prepare(it, t) { if (it.active(t) && it.seq.meta) await it.seq.prepare(it.seq.frameAt(t - it.t0, it.d.speed || 1)); },
  draw(it, t) {
    const im = it.seq.now(it.seq.frameAt(t - it.t0, it.d.speed || 1)), c = it.ctx, b = it.box;
    c.fillStyle = '#16151b'; c.fillRect(0, 0, b.w, b.h);
    if (!im) return;
    const kb = { z: [1.0, 1.08], pan: [0, 0], ...(it.d.kb || {}) }, u = E.ioSine(it.life(t)), z = lerp(kb.z[0], kb.z[1], u);
    const w = b.w * z, h = b.h * z;
    c.drawImage(im, (b.w - w) / 2 + kb.pan[0] * u, (b.h - h) / 2 + kb.pan[1] * u, w, h);
  },
});

HP.lib.screens = { catalog, record, fileOf, hlBoxes, phraseRect, pileMatrix, entryPose };
})();
