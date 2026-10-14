/* fx/equations.js  [BUILDER B]  equations dropped on the beat, drawn stroke by stroke (e.g. the GRPO objective)
 * =================================================================================================================
 * BUILD.md REVISION 2: "equations dropped on the beat (e.g. the GRPO objective)"; "Equations are exact from the cited paper".
 * TeX comes from research/rev2/equations.json (research, verified) or research/rev2/equations-extra.json (builder B: forward
 * pass, BP1-BP4, the update rule, attention; verified against Nielsen 2015 / Vaswani 2017) by id ("ref"), or inline ("tex").
 * MathJax (vendored) typesets it to SVG at load; every glyph is a <path>.
 *
 * ITEM equation (documented in edl/README.md, "Builder B"):
 *   ref | tex; form (tex | latex | stacked | short | <name>_latex); x, y | cx, cy; px (em size, 48), maxW (960: shrinks px
 *   to fit), color (ink on cream, cream on dark); drop (the beat it lands; default t0); mode pencil | chalk | slam | drop |
 *   terms; dur (pencil drawing time); rows (times: each row of a multi-row equation starts on its own beat); terms [{tex |
 *   from, at}]; hl [{tex | from ("highlight", "extra:0"), at, style marker | circle | underline | box, color, ink}];
 *   label {text, at, ...} | "text" (rolled out word by word above); cite {text?, at} | "text" | false (default: the
 *   entry's cite, rolled out below); card {color, pad, rot}; pulse (times: bump + jump to a new tilt + a flash walking
 *   along the equation); drift, sway, float (continuous motion); splat {x, y, r, color, dir} (on the drop).
 * HOW IT DRAWS (all a function of t): two copies of the SVG. The "pen" copy has fill none and a pencil stroke revealed with
 *   stroke-dashoffset (pathLength 1) glyph by glyph in TeX (reading) order, and boils on twos (a CSS turbulence-displacement
 *   filter whose seed cycles A A B B C C). The "ink" copy fills each glyph shortly after its outline is drawn, starting a
 *   little bold and soft (a fading stroke halo) so the ink seems to soak in. Sub-terms are wrapped in \class{...} before
 *   typesetting (the maths is unchanged), which gives a <g> per term for highlights and term-by-term assembly.
 * EXPORTS: HP.lib.equations = {find(ref), typeset(tex, opts), glyphs(svg)} (netviz.js uses typeset for small labels).
 */
(function () {
'use strict';
const { clamp, lerp, pr, el, sv } = HP.u, E = HP.ease;
const BEAT = 0.4839, EIGHTH = BEAT / 2;
const K = () => HP.lib.charts.kit;

// ---- equation files: the research file wins over extras and the stand-in
const EFILES = ['research/rev2/equations.json', 'research/rev2/equations-extra.json', 'research/rev3/equations-rev3.json'];   // rev3: grpo-grad (appendix A.1.6); K.exists skips a missing file
async function find(ref) {
  for (const f of EFILES) {
    let j = null;
    if (!(await K().exists(f))) continue;
    try { j = await HP.assets.json(f); } catch (e) { continue; }
    if (!j) continue;
    const list = Array.isArray(j) ? j : Array.isArray(j.equations) ? j.equations : Object.entries(j).filter(([, v]) => v && typeof v === 'object' && (v.tex || v.latex)).map(([k, v]) => ({ id: k, ...v }));
    const q = list.find(x => x && (x.id === ref || x.key === ref || x.name === ref));
    if (q) return { e: q, file: f };
  }
  return null;
}
// wrap exact TeX substrings in \class{name}{...} (brace-balanced substrings only; the maths is unchanged)
function wrapClass(tex, sub, name) {
  const i = tex.indexOf(sub);
  if (i < 0) return null;
  return tex.slice(0, i) + `\\class{${name}}{${sub}}` + tex.slice(i + sub.length);
}
async function typeset(tex, o = {}) {
  await HP.lib.mathjax.load();
  let m = HP.lib.mathjax.svg(tex, { px: o.px || 48 });
  m.px = o.px || 48;
  if (o.maxW && m.w > o.maxW) { const px = (o.px || 48) * o.maxW / m.w; m = HP.lib.mathjax.svg(tex, { px }); m.px = px; }
  return m;
}
const glyphs = svg => Array.from(svg.querySelectorAll('path, rect'));
const mixHex = (a, b, k) => { const A = a.replace('#', ''), B = b.replace('#', ''); const c = i => Math.round(lerp(parseInt(A.slice(i, i + 2), 16), parseInt(B.slice(i, i + 2), 16), k)); return `rgb(${c(0)},${c(2)},${c(4)})`; };

// ---- shared SVG filters (boil on twos: 3 seeds; chalk grain)
let DEFS = null;
function defs() {
  if (DEFS) return DEFS;
  const s = sv('svg', { width: 0, height: 0, style: 'position:absolute;width:0;height:0' }, document.body);
  const d = sv('defs', {}, s);
  for (let k = 0; k < 3; k++) {
    const f = sv('filter', { id: `hpeq-boil${k}`, x: '-5%', y: '-10%', width: '110%', height: '120%' }, d);
    sv('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.035', numOctaves: 2, seed: 11 + k * 37, result: 'n' }, f);
    sv('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 2.6, xChannelSelector: 'R', yChannelSelector: 'G' }, f);
  }
  for (let k = 0; k < 3; k++) {   // chalk: grainy alpha + boil
    const f = sv('filter', { id: `hpeq-chalk${k}`, x: '-5%', y: '-10%', width: '110%', height: '120%' }, d);
    sv('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.035', numOctaves: 2, seed: 5 + k * 29, result: 'n' }, f);
    sv('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 3, xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' }, f);
    sv('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.9', numOctaves: 1, seed: 3 + k * 13, result: 'g' }, f);
    sv('feColorMatrix', { in: 'g', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.75', result: 'ga' }, f);
    sv('feComposite', { in: 'd', in2: 'ga', operator: 'in' }, f);
  }
  DEFS = s; return s;
}

HP.register('equation', {
  build(it) {
    const d = it.d;
    it.el.style.isolation = 'isolate';   // keep child z-indexes inside this item (EDL order decides stacking)
    it.drop = HP.T(d.drop ?? d.at, it.t0);
    it.mark(it.drop, 'eq');
    it.mode = d.mode || 'pencil';
    it.col = d.color || (it.theme === 'light' ? HP.COL.ink : HP.COL.cream);
    it.wrap = el('div', '', it.el, { position: 'absolute', left: 0, top: 0, width: HP.W + 'px', height: HP.H + 'px' });
    it.box = el('div', '', it.wrap, { position: 'absolute', transformOrigin: '50% 50%', color: it.col, zIndex: 3 });
    defs();
  },
  async load(it) {
    const d = it.d;
    let tex = d.tex, meta = null;
    if (d.ref) {
      const r = await find(d.ref);
      if (!r) { HP.WARN.push(`equation ${it.id}: ref "${d.ref}" not in ${EFILES.join(', ')}`); tex = tex || '?'; }
      else {
        meta = r.e; it.efile = r.file;
        // "form": which field of the research entry: tex (default: the portrait-stacked form when the paper's is too wide,
        // else latex) | latex (the paper's own layout) | stacked | short (a labelled sub-expression) | any <name>_latex field
        const F = d.form, pick = F ? (r.e[F] ?? r.e[F + '_latex'] ?? (F === 'stacked' ? r.e.latex_stacked : undefined)) : undefined;
        if (F && pick === undefined) HP.WARN.push(`equation ${it.id}: "${d.ref}" has no form "${F}"`);
        if (!tex) tex = pick ?? r.e.tex ?? r.e.latex;
        if (/stand-in/.test(r.file)) HP.INFO.push(`equation ${it.id}: TeX from ${r.file} (STAND-IN)`);
      }
    }
    // hl / terms entries may name the research file's sub-terms: {from: "highlight"} (highlight_latex) or {from: "extra:0"}
    const fromMeta = h => {
      if (!h.from || h.tex || !meta) return h;
      const m = String(h.from).match(/^extra:(\d+)$/);
      const x = h.from === 'highlight' ? meta.highlight_latex : m ? (meta.extra_highlights || [])[+m[1]]?.latex : meta[h.from] ?? meta[h.from + '_latex'];
      if (x === undefined) HP.WARN.push(`equation ${it.id}: no sub-term "${h.from}" in "${d.ref}"`);
      return { ...h, tex: x ?? '' };
    };
    it.meta = meta; it.tex0 = tex;
    // wrap highlight / term substrings in \class (the substring must occur verbatim in the TeX)
    it.hl = (d.hl || []).map((h, k) => ({ ...fromMeta(h), cls: `hpq-${it.id}-h${k}` }));
    it.terms = (d.terms || []).map((h, k) => ({ ...fromMeta(h), cls: `hpq-${it.id}-t${k}` }));
    for (const h of [...it.terms, ...it.hl]) {
      const w = wrapClass(tex, h.tex, h.cls);
      if (w === null) { HP.WARN.push(`equation ${it.id}: sub-term "${h.tex}" not found verbatim in the TeX`); h.missing = true; } else tex = w;
    }
    it.m = await typeset(tex, { px: d.px || 48, maxW: d.maxW ?? 960 });
    const pxNow = it.pxNow = it.m.px || (d.px || 48);
    if (it.m.h / Math.max(1, (tex.match(/\\\\/g) || []).length + 1) < 38 * 1.2) HP.INFO.push(`equation ${it.id}: typeset small (em ${pxNow.toFixed(0)} px); check legibility`);
    it.ink = it.m.svg; it.pen = it.ink.cloneNode(true);
    if (it.mode === 'paint') {   // a raster of the finished equation, revealed through builder A's bristle-brush mask
      const c = it.ink.cloneNode(true); c.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); c.setAttribute('color', it.col);
      const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(c));
      try { await img.decode(); it.raster = img; } catch (e) { HP.WARN.push(`equation ${it.id}: could not rasterise for mode paint`); }
    }
    for (const s of [it.ink, it.pen]) Object.assign(s.style, { position: 'absolute', left: 0, top: 0, overflow: 'visible' });
    it.box.appendChild(it.ink); it.box.appendChild(it.pen);
    it.gi = glyphs(it.ink); it.gp = glyphs(it.pen);
    it.tf0 = it.gi.map(g => g.getAttribute('transform') || '');   // MathJax positions some glyphs with their own transform: keep it
    for (const g of it.gi) { g.setAttribute('fill-opacity', 0); }
    for (const g of it.gp) { g.setAttribute('fill', 'none'); g.setAttribute('pathLength', 1); g.setAttribute('stroke-dasharray', '1 2'); g.setAttribute('stroke-dashoffset', 1); g.setAttribute('stroke-linejoin', 'round'); g.setAttribute('stroke-linecap', 'round'); }
    // label (above) and citation (below), rolled out word by word
    const lab = typeof d.label === 'string' ? { text: d.label } : d.label;
    const metaCite = meta && (meta.cite || (meta.source && (typeof meta.source === 'string' ? meta.source : [meta.source.authors, meta.source.year, meta.source.title, meta.source.eq && 'eq. ' + String(meta.source.eq).replace(/[()]/g, '')].filter(Boolean).join(', '))));
    let cite = d.cite === false ? null : d.cite === true || d.cite === undefined ? metaCite : d.cite;
    if (cite && typeof cite === 'string') cite = { text: cite };
    if (cite && !cite.text) cite = metaCite ? { ...cite, text: metaCite } : null;
    if (!cite && d.cite !== false) HP.WARN.push(`equation ${it.id}: no citation line (equations need their source on screen)`);
    it.labO = lab || null; it.citeO = cite || null;
  },
  layout(it) {
    const d = it.d, w = it.m.w, h = it.m.h;
    const x = d.cx !== undefined ? d.cx - w / 2 : (d.x ?? 60), y = d.cy !== undefined ? d.cy - h / 2 : (d.y ?? 800);
    it.X = x; it.Y = y;
    Object.assign(it.box.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
    // glyph geometry (frame px), stroke width in each glyph's user units, reading order = TeX (DOM) order
    const br = it.box.getBoundingClientRect();
    const sw = (d.penW ?? (it.mode === 'chalk' ? 3.2 : 2.4));
    it.G = it.gp.map((g, k) => {
      const r = g.getBoundingClientRect(), bb = g.getBBox();
      const s = bb.width > 0 ? r.width / bb.width : (bb.height > 0 ? r.height / bb.height : 1);
      g.setAttribute('stroke-width', (sw / Math.max(1e-6, s)).toFixed(2));
      it.gi[k].setAttribute('stroke-width', 0);
      return { x: r.left - br.left + x, y: r.top - br.top + y, w: r.width, h: r.height, s, cx: r.left - br.left + x + r.width / 2, cy: r.top - br.top + y + r.height / 2 };
    });
    const n = it.G.length;
    // timing: the pen draws glyph k over [a_k, a_k + gd]; the ink fills it from a_k + 0.75 gd
    const dur = d.dur ?? Math.min(0.012 * n + 0.6, 2.6);
    const gd = d.glyphDur ?? Math.min(0.28, Math.max(0.12, dur * 0.25));
    it.gd = gd;
    const term = new Map();   // glyph -> term index (mode terms)
    it.terms.forEach((T0, k) => { if (T0.missing) return; const g = it.ink.querySelector('.' + CSS.escape(T0.cls)); T0.at = HP.T(T0.at, it.drop + k * BEAT); it.mark(T0.at, 'term'); if (g) for (const p of glyphs(g)) term.set(it.gi.indexOf(p), k); });
    // "rows" (beats spec or list): each row of a multi-row equation (gathered / aligned) starts on its own beat and is drawn
    // over "rowDur" (default: until the next row's beat); row 0 starts at drop unless the spec says otherwise
    let rowOf = null, rowT = null;
    if (d.rows) {
      const trs = Array.from(it.pen.querySelectorAll('g[data-mml-node="mtr"]'));
      rowT = Array.isArray(d.rows) ? d.rows.map(x => HP.T(x)) : HP.fxTimes({ on: d.rows }).times;
      rowOf = it.gp.map(g => { const i = trs.findIndex(r => r.contains(g)); return i < 0 ? 0 : i; });
      rowT.forEach(x => it.mark(x, 'row'));
    }
    it.A = it.G.map((g, k) => {
      if (it.mode === 'terms') return term.has(k) ? it.terms[term.get(k)].at : it.drop;
      if (it.mode === 'slam' || it.mode === 'paint') return it.drop;
      if (it.mode === 'drop') return (it.t0 < it.drop - 0.2 ? it.drop - 0.22 : it.drop) + k * (d.per ?? 0.012);   // lands ON the beat when the item starts early enough
      if (rowOf) {
        const r = rowOf[k], idx = rowOf.map((q, i) => q === r ? i : -1).filter(i => i >= 0), j = idx.indexOf(k);
        const r0 = rowT[Math.min(r, rowT.length - 1)], r1 = rowT[r + 1] ?? (r0 + (d.rowDur ?? BEAT * 2));
        const rd = d.rowDur ?? Math.max(0.15, (r1 - r0) * 0.85);
        return r0 + (idx.length > 1 ? j / (idx.length - 1) : 0) * Math.max(0, rd - gd);
      }
      return it.drop + (n > 1 ? k / (n - 1) : 0) * Math.max(0, dur - gd);
    });
    it.drawEnd = Math.max(...it.A) + gd + 0.2;
    // term boxes for highlights (frame px)
    for (const H0 of it.hl) {
      H0.at = HP.T(H0.at, it.drawEnd + BEAT);
      it.mark(H0.at, 'highlight');
      const g = H0.missing ? null : it.ink.querySelector('.' + CSS.escape(H0.cls));
      if (g) { const r = g.getBoundingClientRect(); H0.box = { x: r.left - br.left + x, y: r.top - br.top + y, w: r.width, h: r.height }; H0.gl = glyphs(g).map(p => it.gi.indexOf(p)); }
    }
    if (it.mode === 'paint' && HP.lib.paint && HP.lib.paint.revealPlan) {
      const P = d.paint || {};
      it.plan = HP.lib.paint.revealPlan([x, y, w, h], { key: it.id + ':paint', width: P.width ?? Math.max(70, Math.min(120, h / 2.2)), color: P.color ?? 'yellow', pass: P.pass ?? 0.17, gap: P.gap ?? 0.07 });
      it.paintCv = it.canvas({ zIndex: 2 }); it.wrap.insertBefore(it.paintCv.cv, it.box);
      it.drawEnd = it.drop + it.plan.end + 0.1;
    } else if (it.mode === 'paint') { HP.WARN.push(`equation ${it.id}: mode paint needs HP.lib.paint.revealPlan (builder A); falling back to slam`); it.mode = 'slam'; }
    // canvases: under (marker, card) and over (pencil circles); tight around the equation
    const pad = 140;
    it.under = K().box(it, x - pad, y - pad, w + 2 * pad, h + 2 * pad, it.wrap, { zIndex: 1 });
    it.over = K().box(it, x - pad, y - pad, w + 2 * pad, h + 2 * pad, it.wrap, { zIndex: 4 });
    // label above, cite below
    const ink = it.col;
    if (it.labO) {
      const L = it.labO, F = { family: "'Newsreader', serif", weight: 600, size: 54, style: 'italic', ...(L.font || {}) };
      const tw = Math.min(880, Math.max(w, 700));
      it.lab = K().roll(it, { text: L.text, x: L.x ?? (d.cx !== undefined ? d.cx - tw / 2 : x), y: L.y ?? (y - (L.gap ?? 40) - F.size * 1.1 * (L.lines ?? 1)), w: L.w ?? tw, align: L.align ?? (d.cx !== undefined ? 'center' : 'left'),
        font: F, color: L.color || ink, at: L.at ?? it.drop, per: L.per ?? EIGHTH, style: L.style || 'drop', parent: it.wrap, hl: L.hl, hlAt: L.hlAt, hlColor: L.hlColor, bg: L.bg });   // fixer r1: label.bg
      if (L.y === undefined && it.lab.height > F.size * 1.2 * (L.lines ?? 1)) for (const q of it.lab.words) q.el.style.top = (parseFloat(q.el.style.top) - (it.lab.height - F.size * 1.18 * (L.lines ?? 1))) + 'px';
    }
    if (it.citeO) {
      const C = it.citeO, tw = Math.min(860, Math.max(w, 700));   // narrower than the frame: the drift/jump must not push it out of the safe zone
      it.cite = K().roll(it, { text: C.text, x: C.x ?? (d.cx !== undefined ? d.cx - tw / 2 : x), y: C.y ?? (y + h + (C.gap ?? 44)), w: C.w ?? tw, align: C.align ?? (d.cx !== undefined ? 'center' : 'left'),
        font: { weight: 500, size: C.px ?? 30 }, upper: true, tracking: 0.5, lh: (C.px ?? 30) * 1.3, color: C.color || ink, at: C.at ?? (it.drawEnd), per: C.per ?? EIGHTH / 2, style: 'rise', parent: it.wrap, markAs: 'meta', bg: C.bg });   // fixer r1: cite.bg (a chip)
    }
    it.nChunk = Math.max(3, Math.min(8, Math.round(it.G.length / 8)));
    it.pulses = !d.pulse ? [] : Array.isArray(d.pulse) ? d.pulse.map(x => HP.T(x)) : HP.fxTimes({ on: d.pulse }).times;
    it.pulses.forEach(x => it.mark(x, 'pulse'));
  },
  draw(it, t) {
    const d = it.d, n = it.G.length, gd = it.gd, mode = it.mode;
    // whole-equation motion: the landing (slam/drop overshoot), beat pulses, slow push-in
    let sc = 1, ty = 0, rot = 0;
    const lu = pr(t, it.drop, 0.2);
    if (mode === 'slam') sc *= lerp(d.slam ?? 1.16, 1, E.oBack(lu, 2.2));
    else if (mode === 'paint') sc *= lerp(1.04, 1, E.oCub(pr(t, it.drop, 0.35)));
    else if (mode === 'pencil' || mode === 'chalk') sc *= lerp(1.05, 1, E.oCub(pr(t, it.drop, 0.3)));
    for (const x of it.pulses) { if (t < x - HP.EPS) continue; const u = pr(t, x, 0.16); if (u < 1) sc *= lerp(d.pulseAmt ?? 1.035, 1, E.oCub(u)); }
    // "jump" (default with pulses): the tilt flips to a new held pose on each pulse beat (Kandinsky: objects jump, then hold)
    let jump = 0;
    if (d.jump !== false && it.pulses.length) { let prev = 0; it.pulses.forEach((x, k) => { if (t < x - HP.EPS) return; const to = (k % 2 ? -1 : 1) * (d.jumpDeg ?? 1.3); jump = lerp(prev, to, E.oBack(pr(t, x, 0.2), 2.2)); prev = to; }); }
    sc *= lerp(1, d.drift ?? 1.05, E.ioSine(it.life(t)));
    rot = (d.rot ?? 0) + jump + Math.sin((t - it.t0) * 1.3) * (d.sway ?? 0.35);
    // a handheld float (smooth noise, a few px) so the held equation never freezes between beats
    const fl = d.float ?? 1, fx = (HP.noise1(it.id + 'fx', t * 0.9) - 0.5) * 9 * fl, fy = (HP.noise1(it.id + 'fy', t * 0.8) - 0.5) * 7 * fl;
    it.wrap.style.transformOrigin = `${it.X + it.m.w / 2}px ${it.Y + it.m.h / 2}px`;
    it.wrap.style.transform = `translate(${fx.toFixed(2)}px,${(ty + fy).toFixed(2)}px) rotate(${rot.toFixed(3)}deg) scale(${sc.toFixed(4)})`;
    it.box.style.opacity = t >= Math.min(...it.A) - HP.EPS ? 1 : 0;
    // glyphs
    const boil = HP.boil(t, d.boil ?? 2) % 3;
    const fillCol = it.col;
    for (let k = 0; k < n; k++) {
      const a = it.A[k], gp = it.gp[k], gi = it.gi[k];
      let pen = 0, ink = 0;
      if (mode === 'slam') { pen = 1; ink = t >= a - HP.EPS ? 1 : 0; }
      else if (mode === 'paint') { pen = 1; ink = t >= it.drawEnd - 0.1 - HP.EPS ? 1 : 0; }
      else if (mode === 'drop' || mode === 'terms') { pen = 1; ink = pr(t, a, 0.06); }
      else { pen = E.ioSine(pr(t, a, gd)); ink = pr(t, a + gd * 0.75, d.fillDur ?? 0.16); }
      gp.setAttribute('stroke-dashoffset', (1 - pen).toFixed(4));
      gp.style.visibility = pen > 0 && t >= a - HP.EPS ? 'visible' : 'hidden';
      // ink soaks in: a soft bold halo that tightens as the fill comes up
      gi.setAttribute('fill-opacity', (mode === 'chalk' ? 0.92 : 1) * clamp(ink * 1.4));
      if (ink > 0 && ink < 1 && mode !== 'slam') {
        const g = it.G[k], halo = (d.bleed ?? 3.2) * (1 - E.oCub(ink));
        gi.setAttribute('stroke', fillCol); gi.setAttribute('stroke-opacity', (0.55 * (1 - ink)).toFixed(3)); gi.setAttribute('stroke-width', (halo / g.s).toFixed(2));
      } else if (gi.getAttribute('stroke-width') !== '0') gi.setAttribute('stroke-width', 0);
      // drop: each glyph falls into place (lands at a + 0.22)
      if (mode === 'drop' || mode === 'terms') {
        const u = mode === 'drop' ? pr(t, a, 0.22) : 1, dy = lerp(-120, 0, E.oBack(u, 1.8));
        const tf = (it.tf0[k] + (u < 1 ? ` translate(0 ${(-dy / it.G[k].s).toFixed(1)})` : '')).trim();
        if ((gi.getAttribute('transform') || '') !== tf) { if (tf) { gi.setAttribute('transform', tf); gp.setAttribute('transform', tf); } else { gi.removeAttribute('transform'); gp.removeAttribute('transform'); } }
        if (u <= 0) { gi.setAttribute('fill-opacity', 0); gp.style.visibility = 'hidden'; }
      }
    }
    // terms: each sub-term group pops in on its beat (scale about its centre)
    if (mode === 'terms') for (const T0 of it.terms) {
      if (T0.missing) continue;
      for (const svg of [it.ink, it.pen]) {
        const g = svg.querySelector('.' + CSS.escape(T0.cls)); if (!g) continue;
        const u = pr(t, T0.at, 0.2);
        g.style.transformBox = 'fill-box'; g.style.transformOrigin = '50% 50%';
        g.style.opacity = t >= T0.at - HP.EPS ? 1 : 0;
        g.style.transform = u < 1 ? `scale(${lerp(1.5, 1, E.oBack(u, 2.4)).toFixed(4)})` : '';
      }
    }
    // pen layer: pencil grey on cream / cream chalk on dark, boiling on twos; it settles to a faint double line
    const settle = 1 - 0.65 * pr(t, it.drawEnd, 0.4);
    it.pen.style.color = d.penColor || (mode === 'chalk' ? HP.COL.cream : (it.theme === 'light' ? '#2A2832' : '#E8E1D2'));
    // the boil filter is the expensive part (software SVG filter): it runs while the pencil is drawing and for 0.4 s after,
    // then the pencil layer goes (the ink copy carries the equation) unless "boilRest": true keeps it boiling
    if (mode === 'paint' && it.paintCv) {   // bristle passes in the paint colour, the equation revealed through the mask, ON the beat
      const c = it.paintCv.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, HP.W, HP.H);
      const lt = t - it.drop, done = t >= it.drawEnd - 0.1 - HP.EPS;
      HP.lib.paint.drawReveal(c, it.plan, lt, done || !it.raster ? () => {} : cx => cx.drawImage(it.raster, it.X, it.Y, it.m.w, it.m.h));
    }
    const penOn = mode !== 'paint' && (d.boilRest || t < it.drawEnd + 0.4 || mode === 'chalk');
    it.pen.style.opacity = !penOn ? 0 : (mode === 'slam' || mode === 'drop' || mode === 'terms') ? 0.55 * (1 - pr(t, it.drawEnd, 0.4)) : settle;
    it.pen.style.filter = penOn ? `url(#hpeq-${mode === 'chalk' ? 'chalk' : 'boil'}${boil})` : 'none';
    it.pen.style.visibility = penOn ? 'visible' : 'hidden';
    if (mode === 'chalk') it.ink.style.filter = `url(#hpeq-chalk${boil})`;
    // under: card + marker sweeps; over: pencil circles / underlines / boxes
    const cu = it.under.begin(), co = it.over.begin();
    if (d.card) {
      const C = d.card, pad = C.pad ?? 50, u = E.oBack(pr(t, it.drop - (C.lead ?? 0.12), 0.2), 1.5);
      if (u > 0) {
        cu.save(); cu.translate(it.X + it.m.w / 2, it.Y + it.m.h / 2); cu.rotate((C.rot ?? -1.2) * Math.PI / 180); cu.scale(u, u);
        cu.fillStyle = C.color || (it.theme === 'light' ? '#FBF6EC' : '#1C1A26'); cu.fillRect(-it.m.w / 2 - pad, -it.m.h / 2 - pad, it.m.w + 2 * pad, it.m.h + 2 * pad); cu.restore();
      }
    }
    const rc = HP.lib.rough.canvas(it.over.cv, it.id + ':' + boil);
    for (const H0 of it.hl) {
      if (!H0.box) continue;
      const B = H0.box, st = H0.style || 'circle', col = H0.color || (st === 'marker' ? HP.COL.yellow : HP.COL.red);
      if (st === 'marker') { const em = it.pxNow * 1.05, mh = Math.min(B.h * 1.05, em), my = B.h > em ? B.y + B.h / 2 : B.y + B.h / 2; K().marker(cu, B.x - 14, my, B.x + B.w + 14, mh, E.oCub(pr(t, H0.at, EIGHTH)), col, it.id + ':mk' + H0.cls); }
      else if (st === 'underline') { const u = pr(t, H0.at, 0.2); if (u > 0) rc.line(B.x - 10, B.y + B.h + 12, B.x + B.w + 10, B.y + B.h + 8, K().drawOn({ ...K().pencil(col, H0.width ?? 6) }, (B.w + 20) * 1.15, u)); }
      else if (st === 'box') { const u = pr(t, H0.at, 0.35); if (u > 0) rc.rectangle(B.x - 16, B.y - 14, B.w + 32, B.h + 28, K().drawOn({ ...K().pencil(col, 5.5), roughness: 1.5 }, 2 * (B.w + B.h + 60) * 1.1, u)); }
      else { const u = pr(t, H0.at, 0.4), rx = B.w / 2 + (H0.padX ?? 30), ry = B.h / 2 + (H0.padY ?? 26); if (u > 0) rc.ellipse(B.x + B.w / 2, B.y + B.h / 2, 2 * rx, 2 * ry, K().drawOn({ ...K().pencil(col, H0.width ?? 6), roughness: 1.5, bowing: 1.2 }, K().ellipseLen(rx, ry) * 1.3, u)); }   // fixer r1: width, padX/padY
      // the term's ink turns to the emphasis colour on the beat
    }
    {
      const fillOf = new Array(n).fill('currentColor');
      // pulse beats: a chunk of the equation (reading order) flashes the accent colour and decays, walking along per beat
      const nC = it.nChunk, acc = d.flashColor || (it.theme === 'light' ? HP.COL.pink : HP.COL.yellow);
      it.pulses.forEach((P, pi) => {
        const u = (t - P) / 0.3; if (u < 0 || u >= 1 || d.flash === false) return;
        const c = pi % nC, k0 = Math.floor(c * n / nC), k1 = Math.floor((c + 1) * n / nC), f = 1 - E.oCub(u);
        for (let k = k0; k < k1; k++) fillOf[k] = mixHex(it.col, acc, f);
      });
      for (const H0 of it.hl) if (H0.ink && H0.gl && t >= H0.at - HP.EPS) for (const k of H0.gl) if (k >= 0) fillOf[k] = H0.ink;
      for (let k = 0; k < n; k++) if (it.gi[k].getAttribute('fill') !== fillOf[k]) it.gi[k].setAttribute('fill', fillOf[k]);
    }
    if (d.splat) {   // a full-frame canvas of its own, behind the equation (keep it off the text: x, y, r in the EDL)
      if (!it.splatCv) { it.splatCv = it.canvas({ zIndex: 0 }); it.wrap.insertBefore(it.splatCv.cv, it.wrap.firstChild); }
      const c = it.splatCv.ctx, S = d.splat; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, HP.W, HP.H);
      K().splat(c, { x: S.x ?? it.X + it.m.w * 0.85, y: S.y ?? it.Y - 120, r: S.r ?? 70, dir: S.dir, color: S.color || HP.COL.pink, seed: it.id + ':splat' }, t - HP.T(S.at, it.drop));
    }
    if (it.lab) it.lab.draw(t);
    if (it.cite) it.cite.draw(t);
  },
  texts(it) {
    const out = [{ text: it.d.tex || it.d.ref || '', reveal: 'stroke', role: 'main' }];
    if (it.labO) out.push({ text: it.labO.text, reveal: 'words', role: 'main' });
    if (it.citeO) out.push({ text: it.citeO.text, reveal: 'words', role: 'meta' });
    return out;
  },
});
HP.lib.equations = { find, typeset, glyphs, wrapClass };
})();
