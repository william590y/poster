// Cornell Splash Fall 2026 · M1237 "AI Alignment and Safety" (William Liaw, Nov 21, 2026; grades 7–12).
// OPENING (3 slides, 4 min) + PART 1 · HOW AI LEARNS (21 slides, 37 min) = 41 min of a 110-minute class.
// Plan: assets/research/splash_nov/PLAN.md (section 1). No math on the slides or in the notes: no equations, "≈", "×" or
// formulas; the gradient is "the slope in every direction at once: which way is downhill".
// Sources: assets/research/splash/manifest.json and assets/research/splash_nov/manifest.json (ids "ml-…", facts "_ml"),
// plus, for the adapted adult slides (gigawatt), assets/research/economy/manifest.json and the adult deck's notes.
// Exports { build, slides }: build(d) adds every slide in order; slides = name -> async slide function.
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { HEX, W, MX, A, imgSize, fit } = require('./lib');
const { icon } = require('./icons');

const R = (f) => A('research', 'splash', f);
const RE = (f) => A('research', 'economy', f);
const RN = (f) => A('research', 'splash_nov', 'ml', f);
const OUT = A('slides', 'splash');
const D = (f) => path.join(OUT, f);
const have = (f) => fs.existsSync(f);

// ---------- derived images (crops of verified research files; originals untouched) ----------
const IMN = R('imagenet-ilsvrc-fig1-labelled-categories.png');
// DDIM X-Y plot (Benlisquare, CC BY-SA 4.0): one panel per step count. Boxes are filled in by ddimBoxes() below.
const DDIM = RN('diffusion-ddim-steps-castle.png');
const CROPS = {
  // Hoover Dam aerial (CC BY-SA 4.0, Mariordo), same crop as the adult deck (keeps clear of the aircraft-window wedge)
  'hoover_crop.jpg': [RE('rev2/gw_commons_hoover_dam_aerial_2017.jpg'), { left: 280, top: 200, width: 1500, height: 880 }],
  // one CIFAR-10 "cat" image, used as the network's input
  'cifar_cat.png': [R('cifar10-labelled-grid.png'), { left: 286, top: 224, width: 64, height: 64 }, 384],
  // hide-and-seek Fig. 1, panels (a) and (b) only
  'hideseek_ab.png': [R('hide-seek-fig1-six-stages.png'), { left: 40, top: 76, width: 1060, height: 496 }],
  // Wikimedia Commons "Gradient descent" (public domain): tight zoom on the red steps
  'gd_zoom.png': [R('gd-commons-gradient-descent-hires.png'), { left: 130, top: 680, width: 700, height: 630 }],
  // Golden Gate Claude announcement: label, headline, date and the top of the page art
  'ggc_head.png': [R('golden-gate-claude-announcement.png'), { left: 400, top: 150, width: 1760, height: 1000 }],
  // ImageNet (Russakovsky et al. 2015) Fig. 1: single photos, cropped inside their borders, with no printed label. The
  // lion is cut above its stock-photo watermark; the canoe is cut left of a round watermark; the strawberry and
  // mushroom lose a grey strip at their bottom edge. Upscaled 2× (lanczos) so they stay smooth on big cards.
  'in_lion.png': [IMN, { left: 1254, top: 1935, width: 145, height: 166 }, 290],
  'in_leopard.png': [IMN, { left: 1296, top: 1341, width: 282, height: 212 }, 564],
  'in_strawberry.png': [IMN, { left: 1395, top: 404, width: 167, height: 203 }, 334],
  'in_airliner.png': [IMN, { left: 1340, top: 2238, width: 276, height: 210 }, 552],
  'in_monkey.png': [IMN, { left: 1268, top: 996, width: 328, height: 218 }, 656],
  'in_orange.png': [IMN, { left: 622, top: 2237, width: 270, height: 211 }, 540],
  'in_mushroom.png': [IMN, { left: 1110, top: 406, width: 277, height: 201 }, 554],
  'in_cars.png': [IMN, { left: 1085, top: 705, width: 260, height: 207 }, 520],
  'in_canoe.png': [IMN, { left: 629, top: 998, width: 212, height: 214 }, 424],
  // mixing console (Dejan Krsmanovic, CC BY 2.0): the faders, without the lit text display along the top edge
  'console_crop.jpg': [RN('mixing-console-faders.jpg'), { left: 0, top: 600, width: 3840, height: 1960 }, 1600],
  // dog waiting for a treat (pbump, CC BY-SA 2.0)
  'dog_treat.jpg': [RN('dog-with-treat.jpg'), null, 1600],
  // NVIDIA H100 PCIe card (Geekerwan, CC BY 3.0), a still from a review video: the leftmost of four cards (box in the
  // 1,920 × 1,080 Commons copy on disk; re-measure if the 3,840 original replaces it). Cut tight to the card, so little
  // of the black studio background is left; the channel logo at the top left is outside the crop.
  'h100_card.jpg': [RN('nvidia-h100-geekerwan-011.png'), { left: 60, top: 360, width: 610, height: 500 }, 1220],
};
// The DDIM plot: 5 columns × 2 rows of portrait panels (row 1: 1, 2, 3, 5, 8 steps; row 2: 10, 15, 20, 30, 40), each
// 384 × 576 px in the 1,920-px-wide Commons copy on disk (the original is 2,560 wide; boxes scale with the file's width).
// Measured edges: columns at multiples of 384, panels from y 74 to 650 and 651 to 1,227. Each crop keeps a 3:4 window
// (380 × 507, 2 px inside the panel edges, centred vertically); crop only, the printed "Steps: n" labels are cut off.
const DDIM_STEPS = [1, 3, 8, 20, 40];
const DDIM_PANELS = [[2, 108, 380, 507], [770, 108, 380, 507], [1538, 108, 380, 507], [770, 685, 380, 507], [1538, 685, 380, 507]];
function ddimBoxes(width) { const k = width / 1920; return DDIM_PANELS.map(([l, tp, w, h]) => ({ left: Math.round(l * k), top: Math.round(tp * k), width: Math.round(w * k), height: Math.round(h * k) })); }
// k-means GIF (Chire, CC BY-SA 4.0), frames rotated so the first frame is the sorted state, cropped to the plot area.
const KMEANS = D('kmeans_sorted_first.gif');

// 16,896 dots (132 columns × 128 rows): one dot per FP32 core of an NVIDIA H100 SXM5 (132 SMs, 128 cores each).
// The zoomed corner: 8 × 8 cores drawn large, the same style, for a "zoom" inset on the field.
async function makeDotsZoom(out) {
  let c = '';
  for (let r = 0; r < 8; r++) for (let k = 0; k < 8; k++) c += `<rect x="${k * 60 + 5}" y="${r * 60 + 5}" width="50" height="50" rx="7"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480"><rect width="480" height="480" fill="#161A22"/><g fill="#F4A261">${c}</g></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(out);
}
async function makeDots(out) {
  const cols = 132, rows = 128, cell = 12;
  let c = '';
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) c += `<rect x="${k * cell + 1}" y="${r * cell + 1}" width="10" height="10" rx="1.5"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * cell}" height="${rows * cell}"><g fill="#F4A261">${c}</g></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(out);
}
// Seeded TV-static square (decoration only: a "static" icon, never presented as model output).
async function makeNoise(out, seed = 7, n = 48, size = 384) {
  let x = seed;
  const rnd = () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; };
  const buf = Buffer.alloc(n * n * 3);
  for (let i = 0; i < n * n; i++) { const v = rnd(); buf[3 * i] = 60 + 190 * v * (0.7 + 0.3 * rnd()); buf[3 * i + 1] = 60 + 190 * v * (0.7 + 0.3 * rnd()); buf[3 * i + 2] = 60 + 190 * v * (0.7 + 0.3 * rnd()); }
  await sharp(buf, { raw: { width: n, height: n, channels: 3 } }).resize(size, size, { kernel: 'nearest' }).png().toFile(out);
}

// Fallback only (if the DDIM plot is not on disk): static faded into a photo by us, labelled "illustration" on the slide.
async function makeIllus() {
  const N = 480, img = await sharp(D('hoover_crop.jpg')).resize(N, N, { fit: 'cover' }).removeAlpha().raw().toBuffer();
  let x = 11;
  const rnd = () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; };
  const noise = Buffer.alloc(N * N * 3);
  for (let i = 0; i < N * N; i++) { const v = 255 * rnd(); noise[3 * i] = v; noise[3 * i + 1] = v * (0.8 + 0.2 * rnd()); noise[3 * i + 2] = v * (0.8 + 0.2 * rnd()); }
  const mix = [0.97, 0.8, 0.55, 0.25, 0];
  for (let k = 0; k < 5; k++) {
    const out = Buffer.alloc(N * N * 3);
    for (let i = 0; i < out.length; i++) out[i] = Math.round(mix[k] * noise[i] + (1 - mix[k]) * img[i]);
    await sharp(out, { raw: { width: N, height: N, channels: 3 } }).png().toFile(D(`illus_${k}.png`));
  }
}

async function prep() {
  fs.mkdirSync(OUT, { recursive: true });
  const stale = (out, src) => !have(out) || fs.statSync(out).mtimeMs < fs.statSync(src).mtimeMs || fs.statSync(out).mtimeMs < fs.statSync(__filename).mtimeMs;
  for (const [dst, [src, box, resizeW]] of Object.entries(CROPS)) {
    if (!have(src)) continue; // optional photo not fetched yet: the slide uses its fallback
    const out = D(dst);
    if (!stale(out, src)) continue;
    let img = sharp(src);
    if (box) img = img.extract(box);
    if (resizeW) img = img.resize({ width: resizeW, kernel: 'lanczos3', withoutEnlargement: !box });
    img = dst.endsWith('.jpg') ? img.jpeg({ quality: 90 }) : img.png();
    await img.toFile(out);
  }
  if (have(DDIM)) {
    const { width } = await sharp(DDIM).metadata();
    for (const [i, b] of ddimBoxes(width).entries()) {
      const out = D(`ddim_${String(DDIM_STEPS[i]).padStart(2, '0')}.jpg`);
      if (stale(out, DDIM)) await sharp(DDIM).extract(b).jpeg({ quality: 92 }).toFile(out);
    }
  }
  if (!have(D('ddim_01.jpg'))) await makeIllus();
  if (!have(D('gpu_dots_16896.png')) || fs.statSync(D('gpu_dots_16896.png')).mtimeMs < fs.statSync(__filename).mtimeMs) await makeDots(D('gpu_dots_16896.png'));
  if (!have(D('gpu_dots_zoom.png')) || fs.statSync(D('gpu_dots_zoom.png')).mtimeMs < fs.statSync(__filename).mtimeMs) await makeDotsZoom(D('gpu_dots_zoom.png'));
  if (!have(D('noise_square.png'))) await makeNoise(D('noise_square.png'));
}

// ---------- local helpers ----------
const TINT = { red: '2A1416', amber: '2A2112', blue: '141C2E', teal: '0F2421', steel: '1D222C' };
const CAKE = { sponge: '7A4A24', cream: 'F3E3C3', cherry: 'E5383B', plate: '2A303B' };
const K = (n) => `PART 1 · HOW AI LEARNS · ${n}`;
function kicker(s, t) { s.addText(t, { placeholder: 'kicker' }); }
function title(s, t) { s.addText(t, { placeholder: 'title' }); }

function label(d, s, text, x, y, w, { color, h = 0.3, align = 'left', size = 12 } = {}) {
  return d.text(s, text, { x, y, w, h, fontSize: size, bold: true, color: color || d.S.steel, charSpacing: 2, valign: 'bottom', align });
}
// 12pt source line (every label on these slides is 12pt or more)
function src(d, s, text) {
  return d.text(s, text, { x: MX, y: 6.6, w: W - 2 * MX, h: 0.34, fontSize: 12, color: d.S.steel, italic: true, valign: 'bottom' });
}
function seg(d, s, x1, y1, x2, y2, { color = HEX.steel, width = 1.5, dash = 'solid', arrow = false, begin = false } = {}) {
  const n = d.name('ln');
  s.addShape(d.pres.shapes.LINE, {
    x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.max(Math.abs(x2 - x1), 0.001), h: Math.max(Math.abs(y2 - y1), 0.001),
    flipH: x2 < x1, flipV: y2 < y1,
    line: { color, width, dashType: dash, endArrowType: arrow ? 'triangle' : undefined, beginArrowType: begin ? 'triangle' : undefined }, objectName: n,
  });
  return n;
}
function oval(d, s, x, y, w, h, fill, line, lw = 1.25, transparency = 0) {
  const n = d.name('ov');
  s.addShape(d.pres.shapes.OVAL, { x, y, w, h, fill: { color: fill, transparency }, line: { color: line || fill, width: lw, transparency }, objectName: n });
  return n;
}
function box(d, s, x, y, w, h, { fill = HEX.card, line = HEX.line, lw = 0.75, dash, transparency = 0, radius = 0.08, rotate = 0, shadow = false } = {}) {
  const n = d.name('box');
  s.addShape(d.pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: radius, rotate, fill: { color: fill, transparency }, line: { color: line, width: lw, dashType: dash, transparency: lw ? transparency : 100 }, objectName: n,
    shadow: shadow ? { type: 'outer', color: '000000', blur: 10, offset: 3, angle: 90, opacity: 0.5 } : undefined,
  });
  return n;
}
function rect(d, s, x, y, w, h, fill, { transparency = 0 } = {}) {
  const n = d.name('rect');
  s.addShape(d.pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: fill, transparency }, line: { color: fill, width: 0, transparency: 100 }, objectName: n });
  return n;
}
function chip(d, s, text, x, y, w, fill, { h = 0.36, fontSize = 13, color = 'FFFFFF', align = 'center', bold = true, charSpacing = 1 } = {}) {
  const r = box(d, s, x, y, w, h, { fill, line: fill, radius: 0.06 });
  const t = d.text(s, text, { x: x + 0.06, y, w: w - 0.12, h, fontSize, bold, color, align, valign: 'middle', charSpacing });
  return [r, t];
}
async function ic(d, s, name, color, x, y, size, rotate = 0) {
  const n = d.name('icon');
  s.addImage({ data: await icon(name, color.startsWith('#') ? color : '#' + color, 256), x, y, w: size, h: size, rotate, objectName: n });
  return n;
}
async function iconDisc(d, s, name, cx, cy, dia, color, tint) {
  const c = oval(d, s, cx - dia / 2, cy - dia / 2, dia, dia, tint || TINT.red, color);
  const i = await ic(d, s, name, color, cx - dia * 0.27, cy - dia * 0.27, dia * 0.54);
  return [c, i];
}
function numDisc(d, s, n, cx, cy, dia, fill, { color = 'FFFFFF', fontSize } = {}) {
  const c = oval(d, s, cx - dia / 2, cy - dia / 2, dia, dia, fill, fill);
  const t = d.text(s, String(n), { x: cx - dia / 2, y: cy - dia / 2, w: dia, h: dia, fontSize: fontSize || Math.round(dia * 34), bold: true, color, align: 'center', valign: 'middle', fontFace: 'Arial' });
  return [c, t];
}
// A role tag in the school analogy (LECTURE / WORKED EXAMPLES / HOMEWORK & EXAMS), top left of the content.
function roleTag(d, s, text, fill, x = MX, y = 1.6, { color = 'FFFFFF' } = {}) {
  const w = 0.45 + text.length * 0.125;
  const n = chip(d, s, text, x, y, w, fill, { h: 0.38, fontSize: 14, color, charSpacing: 2 });
  n.w = w;
  return n;
}
// Interactive-beat chip: the same red chip as beatTag() in slides_splash_extra.js (red rounded box, white icon, 12 pt
// white caps), so every beat in the deck has one marker style. Words used across the deck: HANDS UP, GUESS FIRST,
// TURN TO A NEIGHBOR, THINK ABOUT IT, QUIZ. Returns names (+ .w).
const tagW = (text) => 0.7 + text.length * 0.104;
async function beatTag(d, s, text, iconName, x, y, h = 0.36) {
  const w = tagW(text);
  const r = box(d, s, x, y, w, h, { fill: HEX.red, line: HEX.red, lw: 0, radius: 0.06 });
  const i = await ic(d, s, iconName, 'FFFFFF', x + 0.13, y + (h - 0.22) / 2, 0.22);
  const t = d.text(s, text, { x: x + 0.42, y, w: w - 0.48, h, fontSize: 12, bold: true, color: 'FFFFFF', valign: 'middle', charSpacing: 1.5, wrap: false });
  const names = [r, i, t];
  names.w = w;
  return names;
}
// Beat chip at the top right, on the kicker row.
async function beat(d, s, text = 'HANDS UP', iconName = 'FaHandPaper') {
  return beatTag(d, s, text, iconName, W - MX - tagW(text), 0.38);
}
// Chip + the question beside it, as one line on the slide. Returns names.
async function beatLine(d, s, { text, iconName, q, x, y, w, h = 0.5, qSize = 18 }) {
  const tg = await beatTag(d, s, text, iconName, x, y + (h - 0.36) / 2);
  const t = d.text(s, q, { x: x + tg.w + 0.2, y, w: w - tg.w - 0.2, h, fontSize: qSize, bold: true, color: HEX.text, valign: 'middle' });
  return [...tg, t];
}
// Geometry of a native bar chart whose plot area is pinned with `layout` (fractions of the chart box).
function barGeom(box_, layout, n, gapPct, maxVal, minVal = 0) {
  const px = box_.x + layout.x * box_.w, pw = layout.w * box_.w, py = box_.y + layout.y * box_.h, ph = layout.h * box_.h;
  const cw = pw / n, bw = cw / (1 + gapPct / 100);
  return { cx: (i) => px + (i + 0.5) * cw, cy: (i) => py + (i + 0.5) * (ph / n), bw, cw, rh: ph / n,
    vy: (v) => py + ph * (1 - (v - minVal) / (maxVal - minVal)), vx: (v) => px + pw * (v - minVal) / (maxVal - minVal), px, pw, py, ph };
}
// Small fully-connected network drawn with native shapes. Returns positions, connection names and node names.
function drawNet(d, s, { xs, cy, gap, layers, dia, lineColor = HEX.steel, lw = [0.5, 2.0], nodeFill = HEX.card2, nodeLine = HEX.muted }) {
  const pos = layers.map((n, li) => Array.from({ length: n }, (_, j) => ({ x: xs[li], y: cy + (j - (n - 1) / 2) * gap })));
  const lines = [];
  let k = 0;
  for (let li = 0; li < layers.length - 1; li++) {
    for (const a of pos[li]) {
      for (const b of pos[li + 1]) {
        k += 1;
        const f = ((k * 37) % 11) / 10;
        lines.push(seg(d, s, a.x + dia / 2, a.y, b.x - dia / 2, b.y, { color: lineColor, width: lw[0] + f * (lw[1] - lw[0]) }));
      }
    }
  }
  const nodes = pos.map((col) => col.map((p) => oval(d, s, p.x - dia / 2, p.y - dia / 2, dia, dia, nodeFill, nodeLine)));
  return { pos, lines, nodes };
}
// A white flash card (rounded, with a shadow) holding a photo, both rotated about the same centre. Returns names (+ .g).
async function photoCard(d, s, file, { x, y, w, h, rot = 0, m = 0.12 }) {
  const card = box(d, s, x, y, w, h, { fill: 'FFFFFF', line: 'D9DCE1', lw: 0.5, radius: 0.06, rotate: rot, shadow: true });
  const g = fit(await imgSize(file), { x: x + m, y: y + m, w: w - 2 * m, h: h - 2 * m });
  const im = d.name('img');
  s.addImage({ path: file, x: g.x, y: g.y, w: g.w, h: g.h, rotate: rot, objectName: im });
  const names = [card, im];
  names.g = { x, y, w, h };
  return names;
}
// LeCun's cake, drawn natively. (ox, oy) is the top-left of the drawing (the stem tip sits near oy); k scales it (k = 1
// is 5.4 in wide). hi: 'sponge' | 'icing' | 'cherry' highlights one layer and fades the others. cherryK grows the cherry.
function cake(d, s, ox, oy, k = 1, { hi = null, cherryK = 1, plate = true } = {}) {
  const P = (x, y) => ({ x: ox + x * k, y: oy + y * k });
  const fade = (layer) => (hi && hi !== layer ? 72 : 0);
  const out = { sponge: [], icing: [], cherry: [], plate: [] };
  if (plate) { const p = P(0, 3.6); out.plate.push(oval(d, s, p.x, p.y, 5.4 * k, 0.4 * k, CAKE.plate, CAKE.plate, 0.5)); }
  const sp = P(0.3, 1.4);
  out.sponge.push(box(d, s, sp.x, sp.y, 4.8 * k, 2.3 * k, { fill: CAKE.sponge, line: CAKE.sponge, lw: 0, radius: 0.1 * k, transparency: fade('sponge') }));
  for (const yy of [2.15, 2.9]) { const p = P(0.3, yy); out.sponge.push(rect(d, s, p.x, p.y, 4.8 * k, Math.max(0.03, 0.08 * k), CAKE.cream, { transparency: fade('sponge') })); }
  const ic_ = P(0.2, 1.05);
  out.icing.push(box(d, s, ic_.x, ic_.y, 5.0 * k, 0.45 * k, { fill: CAKE.cream, line: CAKE.cream, lw: 0, radius: 0.2 * k, transparency: fade('icing') }));
  for (const xx of [0.55, 1.45, 2.45, 3.45, 4.35]) { const p = P(xx, 1.3); out.icing.push(oval(d, s, p.x, p.y, 0.36 * k, 0.36 * k, CAKE.cream, CAKE.cream, 0, fade('icing'))); }
  const cd = 0.55 * cherryK, c = P(2.725 - cd / 2, 1.07 - cd);
  out.cherry.push(seg(d, s, c.x + cd * k * 0.5, c.y + 0.04 * k, c.x + cd * k * 0.5 + 0.3 * k * Math.sqrt(cherryK), c.y - 0.42 * k * Math.sqrt(cherryK), { color: HEX.teal, width: Math.max(1.25, 3 * k * Math.sqrt(cherryK)) }));
  out.cherry.push(oval(d, s, c.x, c.y, cd * k, cd * k, CAKE.cherry, CAKE.cherry, 0, fade('cherry')));
  out.all = [...out.plate, ...out.sponge, ...out.icing, ...out.cherry];
  // layer centres (for leader lines)
  out.at = { cherry: P(2.725, 1.07 - cd / 2), icing: P(2.7, 1.27), sponge: P(2.7, 2.55), right: ox + 5.1 * k };
  return out;
}
// Speaker notes in a fixed, scannable order (the deck's one notes format). The class clock is computed from the running
// total of `min` (reset in build()), so it always matches the TIME values that build_splash.js adds up.
let CLOCK = 0;
const fmtMin = (x) => String(Math.round(x * 100) / 100);
function notes(s, o) {
  const p = [];
  const m = parseFloat(o.min) || 0, a = CLOCK, b = CLOCK + m;
  CLOCK = b;
  const extra = String(o.min).replace(/^[\d.]+\s*/, '').replace(/^\((.*)\)$/, '$1');
  p.push(`TIME: ${String(o.min).match(/^[\d.]+/)[0]} min  (class minute ${fmtMin(a)}–${fmtMin(b)})${extra ? `  ·  ${extra}` : ''}`);
  if (o.build) p.push('CLICKS: ' + o.build);
  if (o.say) p.push('SAY (plain words): ' + o.say);
  if (o.analogy) p.push('ANALOGY: ' + o.analogy);
  if (o.terms) p.push('TERMS TO DEFINE: ' + o.terms);
  if (o.ask) p.push('ASK THE ROOM: ' + o.ask);
  if (o.takeaway) p.push('TAKEAWAY: ' + o.takeaway);
  if (o.advanced) p.push('FOR ADVANCED STUDENTS: ' + o.advanced);
  if (o.caveats) p.push('BE HONEST ABOUT: ' + o.caveats);
  if (o.sources) p.push('SOURCES: ' + o.sources.join(' · '));
  s.addNotes(p.join('\n\n'));
}
// =====================================================================================
// OPENING · 1  Title
async function titleSlide(d) {
  const s = d.slide('Title', { transition: 'fadeBlack' });
  s.addText('AI Alignment and Safety', { placeholder: 'title' });
  s.addText('William Liaw · Cornell Splash · November 21, 2026', { placeholder: 'body' });
  const k = d.text(s, 'CORNELL SPLASH · M1237 · FALL 2026', { x: MX, y: 1.95, w: 8, h: 0.35, fontSize: 14, bold: true, color: d.S.red, charSpacing: 5 });
  const f = d.text(s, 'Grades 7–12  ·  110 minutes  ·  no programming needed', { x: MX, y: 5.15, w: 8, h: 0.4, fontSize: 16, color: d.S.steel });
  // the course's key word, defined on screen where it first appears
  const al = d.text(s, [
    { text: 'Alignment', options: { bold: true, color: HEX.text } },
    { text: ': getting AI to pursue what people actually want', options: { color: HEX.muted } },
  ], { x: MX, y: 5.68, w: 8, h: 0.42, fontSize: 18, valign: 'middle' });
  d.animate(s, [k], { auto: true, dur: 1200 });
  d.animate(s, [f, al], { auto: true, after: 300, dur: 800 });
  notes(s, {
    min: '0.5',
    say: 'Welcome! I’m William, and this is AI Alignment and Safety. Alignment means getting AI to pursue what people actually want. We have 110 minutes in four parts: how today’s AI learns, how fast it is improving, why it could go wrong, and what people are doing about it. Your questions come at the end.',
    ask: 'None here (about 30 seconds). The “how we play” rules and the first poll are on the next slide.',
    takeaway: 'This class is about how AI learns, and how to keep it doing what people actually want.',
    terms: 'alignment (getting AI to pursue what people actually want; also on the slide).',
    caveats: 'Keep this slide to about 30 seconds: the rules of the game (hands up or stand, no devices, turn to a neighbor) are on the next slide, on screen and spoken.',
    sources: ['Cornell Splash Fall 2026 registration, class M1237 (course description). The minutes are the class plan, not a sourced figure.'],
  });
  return s;
}

// OPENING · 2  Hook poll
async function hookSlide(d) {
  const s = d.slide('Content');
  kicker(s, 'OPENING · HOOK');
  title(s, 'Hands up: who has used an AI this week?');
  const bt = await beat(d, s, 'HANDS UP');
  const qh = 1.45;
  const q = async (y, n, text) => {
    const g = [box(d, s, MX, y, 7.4, qh, { fill: HEX.card, line: HEX.line })];
    g.push(...await iconDisc(d, s, 'FaHandPaper', MX + 0.72, y + qh / 2, 1.0, HEX.amber, TINT.amber));
    g.push(d.text(s, [
      { text: `QUESTION ${n}`, options: { fontSize: 13, bold: true, color: HEX.amber, charSpacing: 2, breakLine: true, paraSpaceAfter: 4 } },
      { text, options: { fontSize: 24, bold: true, color: HEX.text, fontFace: 'Arial' } },
    ], { x: MX + 1.5, y: y + 0.06, w: 5.75, h: qh - 0.12, valign: 'middle' }));
    return g;
  };
  const q1 = await q(1.85, 1, 'Hands up if you used an AI chatbot or an AI picture tool this week.');
  const q2 = await q(3.5, 2, 'Hands down. Now: hands up if you think it understands what it says.');
  // the rules of the game, on screen (projector only: nobody needs a device). Line 2 is how spoken answers are heard in
  // a 200-seat room: true with or without a roving microphone (the notes give the teacher's plan for both cases)
  const play = d.text(s, [
    { text: 'How we play: ', options: { bold: true, color: HEX.amber } },
    { text: 'hands up or stand · no devices · turn to a neighbor when I say so', options: { color: HEX.text, breakLine: true } },
    { text: 'To answer out loud: ', options: { bold: true, color: HEX.amber } },
    { text: 'wait until I call on you. I’ll repeat answers for the room.', options: { color: HEX.text } },
  ], { x: MX, y: 5.08, w: 7.6, h: 0.64, fontSize: 16, valign: 'middle' });
  const bottom = d.text(s, [
    { text: 'No wrong answers. ', options: { bold: true, color: HEX.text } },
    { text: 'Experts disagree about question 2. By the end of Part 1 you will have tools to judge it yourself.', options: { color: HEX.muted } },
  ], { x: MX, y: 5.84, w: 7.4, h: 0.68, fontSize: 18, valign: 'top' });

  // right: what counts as an AI tool
  const rx = 8.4, rw = W - MX - rx;
  const rc = [d.card(s, { x: rx, y: 1.85, w: rw, h: 4.6 })];
  rc.push(label(d, s, 'WHAT COUNTS AS AN “AI TOOL”?', rx + 0.25, 1.95, rw - 0.4, { color: d.S.amber }));
  const tools = [['FaComments', 'Chatbots'], ['FaSpellCheck', 'Autocorrect and word suggestions'], ['FaCamera', 'Photo filters that find your face'], ['FaPlayCircle', 'Apps that pick your next video or song']];
  for (let i = 0; i < tools.length; i++) {
    const y = 2.45 + i * 0.98;
    rc.push(await ic(d, s, tools[i][0], HEX.text, rx + 0.3, y + 0.12, 0.52));
    rc.push(d.text(s, tools[i][1], { x: rx + 1.05, y, w: rw - 1.25, h: 0.78, fontSize: 18, color: HEX.text, valign: 'middle' }));
  }
  d.animate(s, [...rc, ...q1, play], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, bt, { auto: true, effect: 'zoom', after: 200, dur: 400 });
  d.animate(s, q2, { effect: 'rise' });
  d.animate(s, [bottom], { effect: 'fade' });
  notes(s, {
    min: '2.0',
    build: 'Question 1, the two “how we play” lines and the right-hand list show automatically. Click 1: question 2. Click 2: the “no wrong answers” line.',
    say: 'How we play: when I ask a question, you answer with your hands, or by standing up. No phones or laptops needed. Sometimes I’ll say “turn to a neighbor” for 30 seconds. To answer out loud, wait until I call on you [if there is a helper with a microphone: “and wait for the mic”]; I’ll repeat your answer so the whole room hears it. Disagreement is welcome, and I will tell you when experts disagree. Every fact I show comes from a named source. First poll! Hands up if you used an AI chatbot or an AI picture tool this week. [Look around and say roughly what you see: “about half of you”, “most of you”. Do not invent a number.] An “AI tool” is broader than you might think: even autocorrect counts. [Click.] Hands down. Now: hands up if you think it actually understands what it says. [Look around; do not judge any answer.] [Click.] No wrong answers here. I won’t tell you the answer, because experts genuinely disagree. Some think these systems understand in a real sense; others think they are very good at predicting text and nothing more. In Part 1 you will learn how they are built, so you can judge for yourself; we come back to this at the end of Part 1.',
    ask: '(1) Used an AI chatbot or picture tool this week? (2) Do you think it understands what it says? Expected: many hands on (1), a split on (2). Both are fine.',
    takeaway: 'AI is already part of daily life, and whether it “understands” is an open question that experts disagree about.',
    terms: 'AI tool (any program that does something we would call smart: chatbots, autocorrect, photo filters, recommendations).',
    caveats: 'HEARING ANSWERS IN A BIG ROOM (plan this before class): ask the Splash organizers for a roving microphone and a student helper (a runner) to carry it. With a mic: the helper brings it to each student you call on. Without one: call on hands near the front and aisles, and repeat every answer into your own microphone before you respond. If neither works, keep the beat hands-only (votes, no spoken answers). This plan covers every “take one/two answers” beat in Parts 1–2. Reveal nothing yet. The callback to question 2 is the last slide of Part 1 (“Five things to carry into Part 2”): the room repeats the hands-up, then “What would count as evidence?”',
    sources: ['None needed: this slide is a poll, with no outside facts or numbers.'],
  });
  return s;
}


// OPENING · 3  Roadmap
async function roadmapSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  kicker(s, 'OPENING · ROADMAP');
  title(s, 'Learn how it works, then what could go wrong');
  const parts = [
    ['FaBrain', 'PART 1', 'How AI learns', '37 minutes · now', 'Neural networks, chatbots, chips, and how big labs train them'],
    ['FaTachometerAlt', 'PART 2', 'How fast it is moving', '21 minutes', 'Tests, trends, money and data centers'],
    ['FaExclamationTriangle', 'PART 3', 'Why it could go wrong', '29 minutes', [
      { text: 'Alignment: ', options: { bold: true, color: HEX.text } },
      { text: 'getting AI to pursue what people actually want, and keeping control', options: { color: HEX.muted } },
    ]],
    ['FaHandsHelping', 'PART 4', 'What we can do', '12 minutes + 7 Q&A', 'Research, rules, and roles you could play'],
  ];
  const cw = (W - 2 * MX - 3 * 0.25) / 4, y = 1.82, h = 4.15, groups = [];
  for (let i = 0; i < 4; i++) {
    const x = MX + i * (cw + 0.25), now = i === 0;
    const g = [box(d, s, x, y, cw, h, { fill: now ? TINT.red : HEX.card, line: now ? HEX.red : HEX.line, lw: now ? 1.5 : 0.75 })];
    g.push(...await iconDisc(d, s, parts[i][0], x + 0.75, y + 0.72, 0.95, now ? HEX.red : HEX.steel, now ? '3A1416' : HEX.card2));
    if (now) g.push(...chip(d, s, 'NOW', x + cw - 1.05, y + 0.3, 0.8, HEX.red, { fontSize: 13 }));
    g.push(d.text(s, parts[i][1], { x: x + 0.3, y: y + 1.32, w: cw - 0.5, h: 0.3, fontSize: 13, bold: true, color: now ? d.S.red : d.S.steel, charSpacing: 3 }));
    g.push(d.text(s, parts[i][2], { x: x + 0.3, y: y + 1.62, w: cw - 0.45, h: 0.82, fontSize: 22, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'top' }));
    g.push(d.text(s, parts[i][3], { x: x + 0.3, y: y + 2.47, w: cw - 0.45, h: 0.36, fontSize: 16, bold: true, color: now ? HEX.red : HEX.amber, valign: 'top' }));
    g.push(d.text(s, parts[i][4], { x: x + 0.3, y: y + 2.84, w: cw - 0.45, h: 1.12, fontSize: 16, color: HEX.muted, valign: 'top' }));
    groups.push(g);
  }
  const bottom = d.text(s, [
    { text: 'Not doom: ', options: { bold: true, color: HEX.text } },
    { text: 'these are serious, unsolved problems, and many people are working on them.', options: { color: HEX.muted } },
  ], { x: MX, y: 6.12, w: W - 2 * MX, h: 0.43, fontSize: 18, valign: 'middle' });
  groups.forEach((g, i) => d.animate(s, g, { auto: true, effect: 'rise', after: i ? 120 : 200 }));
  d.animate(s, [bottom], { effect: 'fade' });
  notes(s, {
    min: '1.5',
    build: 'The four cards rise in automatically. Click 1: the bottom line.',
    say: 'Here is the plan. Part 1, right now, about 37 minutes: how AI learns. You will see what a neural network is (a computer model made of layers of simple units; we open one up in a few minutes), how a chatbot is trained, the chips it runs on, and the recipe the big labs use. Part 2: how fast it is moving, with real measurements, plus the money and the data centers. Part 3: why it could go wrong. That is about alignment, which means getting AI to pursue what people actually want, and keeping it under human control. We will look at the theory and the evidence so far. Part 4: what people are doing about it, and what you could do, then 7 minutes for your questions. [Click.] One promise: this is not a doom talk. These are serious, unsolved problems, and serious problems need people. Many people are working on them, and some of you might be one day.',
    terms: 'alignment (getting AI to pursue what people actually want; repeat it here), neural network (a computer model made of layers of simple units; said here, shown on the “stack of dials” slide, slide 10).',
    ask: 'Optional, 10 seconds: “Hands up for the part you are most curious about: 1, 2, 3 or 4?”',
    takeaway: 'Four parts: how AI learns, how fast it moves, why it could go wrong, what we can do. Serious problems, not doom.',
    caveats: 'Minutes in the plan: opening 4, Part 1 37, Part 2 21, Part 3 29, Part 4 12, questions 7; 110 in all.',
    sources: ['Cornell Splash Fall 2026 registration, class M1237 (course description). No other facts on this slide.'],
  });
  return s;
}

// =====================================================================================
// PART 1 · 1  Machine learning
async function mlSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(1));
  title(s, 'Machine learning: the computer finds the rules');
  const bw = (7.6 - 2 * 0.45) / 3, bh = 1.18;
  const row = async (y, lab, color, items, hot) => {
    const g = [label(d, s, lab, MX, y, 7.6, { color, size: 14 })];
    for (let i = 0; i < 3; i++) {
      const x = MX + i * (bw + 0.45), by = y + 0.34;
      g.push(box(d, s, x, by, bw, bh, { fill: hot ? TINT.red : HEX.card, line: hot ? HEX.red : HEX.line, lw: hot ? 1.25 : 0.75 }));
      g.push(await ic(d, s, items[i][0], hot ? HEX.red : HEX.muted, x + 0.18, by + 0.12, 0.42));
      g.push(d.text(s, items[i][1], { x: x + 0.18, y: by + 0.58, w: bw - 0.3, h: 0.56, fontSize: 16, color: HEX.text, valign: 'top' }));
      if (i < 2) g.push(seg(d, s, x + bw + 0.06, by + bh / 2, x + bw + 0.39, by + bh / 2, { color: hot ? HEX.red : HEX.steel, width: 2, arrow: true }));
    }
    return g;
  };
  const rowA = await row(1.6, 'CLASSIC SOFTWARE', d.S.steel, [['FaUserEdit', 'A person writes the rules'], ['FaCogs', 'The computer follows them'], ['FaCheckCircle', 'Answers']], false);
  const rowB = await row(3.2, 'MACHINE LEARNING', d.S.red, [['FaImages', 'Examples with the right answers'], ['FaSyncAlt', 'Guesses, gets a score, adjusts'], ['FaLightbulb', 'Rules it found itself']], true);

  // right: nested umbrella AI ⊃ ML ⊃ DL, names plus a few words each
  const rx = 8.6, rw = W - MX - rx, ny = 1.75, nh = 3.85;
  const nest = [];
  nest.push([box(d, s, rx, ny, rw, nh, { fill: HEX.card, line: HEX.steel, lw: 1 }),
    d.text(s, [
      { text: 'AI', options: { bold: true, color: HEX.text, fontSize: 20, fontFace: 'Arial', breakLine: true } },
      { text: 'Computers doing smart things', options: { color: HEX.muted, fontSize: 16 } },
    ], { x: rx + 0.22, y: ny + 0.1, w: rw - 0.4, h: 0.85, valign: 'top' })]);
  nest.push([box(d, s, rx + 0.25, ny + 1.05, rw - 0.5, nh - 1.3, { fill: TINT.amber, line: HEX.amber, lw: 1 }),
    d.text(s, [
      { text: 'MACHINE LEARNING', options: { bold: true, color: HEX.amber, fontSize: 18, fontFace: 'Arial', breakLine: true } },
      { text: 'Learns from examples', options: { color: HEX.muted, fontSize: 16 } },
    ], { x: rx + 0.45, y: ny + 1.15, w: rw - 0.85, h: 0.85, valign: 'top' })]);
  nest.push([box(d, s, rx + 0.5, ny + 2.1, rw - 1.0, nh - 2.4, { fill: TINT.red, line: HEX.red, lw: 1.25 }),
    d.text(s, [
      { text: 'DEEP LEARNING', options: { bold: true, color: HEX.red, fontSize: 18, fontFace: 'Arial', breakLine: true } },
      { text: 'Many layers of “neurons”', options: { color: HEX.text, fontSize: 16 } },
    ], { x: rx + 0.7, y: ny + 2.2, w: rw - 1.4, h: 0.75, valign: 'top' }),
    await ic(d, s, 'FaComments', HEX.red, rx + 0.72, ny + 2.98, 0.34),
    d.text(s, 'Today’s chatbots live here', { x: rx + 1.15, y: ny + 2.92, w: rw - 1.75, h: 0.46, fontSize: 16, bold: true, color: HEX.text, valign: 'middle' })]);

  // a real labelled photo (ImageNet), and the class question
  const lion = await d.frame(s, D('in_lion.png'), { x: MX, y: 4.95, w: 1.4, h: 1.52 }, { pad: 0.05, align: 'left' });
  const lx = lion.geom.x + lion.geom.w + 0.35;
  const lq = d.text(s, [
    { text: 'Write rules that spot a lion?', options: { bold: true, color: HEX.text, fontSize: 22, fontFace: 'Arial', breakLine: true } },
    { text: 'Mane? Teeth? Color? Every rule has exceptions.', options: { color: HEX.muted, fontSize: 16 } },
  ], { x: lx, y: 4.98, w: rx - lx - 0.2, h: 0.8, valign: 'top' });
  const ask = await beatLine(d, s, { text: 'HANDS UP', iconName: 'FaHandPaper', q: 'Name something you could NOT easily write rules for.', x: lx, y: 5.92, w: W - MX - lx, h: 0.5 });
  src(d, s, 'Photo: ImageNet (Russakovsky et al., 2015), Fig. 1 (cropped)');

  d.animate(s, rowA, { auto: true, effect: 'fade' });
  d.animate(s, rowB, { effect: 'wipeLeft', dur: 700 });
  d.animate(s, nest.flat().map((name, i) => ({ name, delay: Math.floor(i / 2) * 300 })), { effect: 'zoom', dur: 400 });
  d.animate(s, [...lion, lq, ...ask], { effect: 'rise' });
  notes(s, {
    min: '1.5',
    build: 'Row 1 shows automatically. Click 1: the machine-learning row. Click 2: the nested boxes (AI, machine learning, deep learning). Click 3: the lion photo and the hands-up question.',
    say: 'Normal software follows rules a person wrote. A spam filter could say: “if the email contains this word, put it in the spam folder.” [Click.] Machine learning flips that around. We give the program examples with the right answers. It guesses, gets a score, and adjusts itself, over and over, until it finds rules that work. Nobody typed those rules in: real spam filters learned their clues from emails people had marked “spam” or “not spam”. [Click.] Three words you will hear: AI is the big umbrella, any computer doing things we would call smart. Machine learning is the part of AI that learns from examples. Deep learning is machine learning with many layers, and we will open those layers up in a few minutes. Today’s chatbots are deep learning. [Click.] Try it: write rules that spot a lion in a photo. A mane? Not every lion has one. Big teeth? So do tigers. This photo comes from ImageNet, a huge set of photos that people labelled by hand. Hands up: name something you could not easily write rules for. [Take two answers, about 30 seconds.]',
    analogy: 'Classic software is a recipe someone wrote down. Machine learning is a cook who tastes, gets told “too salty”, and adjusts until it is right.',
    terms: 'AI (the big umbrella), machine learning (learning from examples), deep learning (machine learning with many layers), score (how well an answer did).',
    ask: 'On the slide: “Name something you could NOT easily write rules for.” Format: hands up, take two answers (about 30 seconds). Expected: recognizing a face, a friend’s handwriting, telling a joke, spotting a cat in a photo.',
    takeaway: 'Nobody types in the rules: machine learning finds its own rules from examples.',
    advanced: 'ImageNet had people label photos by hand. Its organizers write: “we rely on humans to verify each candidate image.” Deep learning’s turning point was the 2012 ImageNet contest: the winner, AlexNet, was “a large, deep convolutional neural network … with 60 million parameters”, trained on graphics chips (GPUs, slide 20), and it made far fewer mistakes than the 2011 winner. The organizers call 2012 “a turning point for large-scale object recognition, when large-scale deep neural networks entered the scene.”',
    caveats: 'People use “AI” loosely; here it means the whole field. The lion is one photo from the ImageNet paper’s Fig. 1 (cropped inside its border; the paper’s printed label and a stock-photo watermark at its bottom edge are cut off). No numbers on the slide.',
    sources: ['https://arxiv.org/abs/1409.0575 (Russakovsky et al., ImageNet Large Scale Visual Recognition Challenge, 2015: Fig. 1; Sec. 3.1.3 and 5.1)', 'https://papers.nips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf (AlexNet, 60 million parameters)'],
  });
  return s;
}

// PART 1 · 2  Supervised learning = flash cards
async function flashCardsSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  kicker(s, K(2));
  title(s, 'Supervised learning: flash cards with answers');
  const cards = [['in_leopard.png', 'leopard', -4], ['in_strawberry.png', 'strawberry', 2], ['in_airliner.png', 'airliner', -2]];
  const CW = 3.3, CH = 2.5, xs = [0.9, 5.0, 9.1], cy = 1.75;
  const fronts = [], backs = [];
  for (let i = 0; i < 3; i++) {
    const [f, word, rot] = cards[i];
    fronts.push(...await photoCard(d, s, D(f), { x: xs[i], y: cy, w: CW, h: CH, rot, m: 0.15 }));
    // the "flip": an opaque back card of the same size and rotation lands on top of the front
    const b = [box(d, s, xs[i], cy, CW, CH, { fill: HEX.paper, line: HEX.amber, lw: 3, radius: 0.06, rotate: rot, shadow: true })];
    b.push(d.text(s, [
      { text: 'BACK: THE ANSWER', options: { fontSize: 12, bold: true, color: '9A5B12', charSpacing: 2, breakLine: true, paraSpaceAfter: 8 } },
      { text: word, options: { fontSize: 44, bold: true, color: HEX.ink, fontFace: 'Arial' } },
    ], { x: xs[i], y: cy, w: CW, h: CH, align: 'center', valign: 'middle', rotate: rot }));
    backs.push(b);
  }
  const q = await beatLine(d, s, { text: 'GUESS FIRST', iconName: 'FaQuestionCircle', q: 'What’s on the back? Say it together on 3!', x: 0.9, y: 4.48, w: 11.5, h: 0.5, qSize: 20 });
  // guess → flip and check → adjust
  const steps = [['FaQuestion', 'Guess', HEX.amber, TINT.amber], ['FaUndo', 'Flip and check', HEX.blue, TINT.blue], ['FaSlidersH', 'Adjust the dials', HEX.red, TINT.red]];
  const strip = [], sx = [0.9, 4.95, 9.0], sy = 5.12, dia = 0.66;
  for (let i = 0; i < 3; i++) {
    strip.push(...await iconDisc(d, s, steps[i][0], sx[i] + dia / 2, sy + dia / 2, dia, steps[i][2], steps[i][3]));
    strip.push(d.text(s, steps[i][1], { x: sx[i] + dia + 0.18, y: sy, w: 2.7, h: dia, fontSize: 22, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'middle' }));
    if (i < 2) strip.push(seg(d, s, sx[i] + 3.05, sy + dia / 2, sx[i + 1] - 0.2, sy + dia / 2, { color: HEX.steel, width: 2.5, arrow: true }));
  }
  const line = d.text(s, [
    { text: 'Every example comes with its answer: ', options: { color: HEX.text } },
    { text: 'a label.', options: { color: HEX.amber, bold: true } },
  ], { x: 0.9, y: 5.92, w: 11.5, h: 0.5, fontSize: 20, valign: 'middle' });
  src(d, s, 'Photos: ImageNet (Russakovsky et al., 2015), Fig. 1 (cropped)');
  d.animate(s, [...fronts, ...q], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, backs.flatMap((b, i) => b.map((name) => ({ name, delay: i * 180 }))), { effect: 'zoom', dur: 380 });
  d.animate(s, [...strip, line], { effect: 'rise' });
  notes(s, {
    min: '1.0',
    build: 'The three photo cards and the GUESS FIRST question show automatically. Click 1: each card “flips” (its answer side lands on top). Click 2: the guess, check, adjust strip and the “label” line.',
    say: 'The first kind of learning is called supervised learning, and it is studying with flash cards. Picture on the front, answer on the back. What is on the back of each card? Say all three together, on 3: one, two, three! [The room answers together: a few seconds.] [Click.] Leopard, strawberry, airliner. [Click.] The computer does the same thing millions of times: it guesses, flips the card to check, and adjusts its dials a little when it is wrong. Every example comes with its answer, and that answer is called a label. These are real photos from ImageNet, where people labelled more than a million photos by hand.',
    analogy: 'Flash cards: picture on the front, answer on the back. Guess, flip, fix.',
    terms: 'supervised learning (learning from examples that come with the right answers), label (the right answer attached to an example).',
    ask: 'On the slide (GUESS FIRST): “What’s on the back? Say it together on 3!” Count “one, two, three” and let the room say the three words together (a few seconds), then click. A count-in keeps 200 voices short and together; do not take single shouts. Expected: leopard (or “cheetah”: a good moment to say that is exactly the kind of mistake the dials get adjusted for), strawberries, plane.',
    takeaway: 'Supervised learning means learning from examples with answers, and the answers come from people.',
    advanced: 'The ImageNet contest data had about 1.2 million training photos in 1,000 categories, and the labels were checked by people: “we rely on humans to verify each candidate image” (Russakovsky et al., 2015).',
    caveats: 'Labels can be wrong or biased: whoever writes the back of the card decides what counts as right. The “flip” is a picture of the idea; the computer does not literally hide the answer, it compares its guess with the label. The three photos are crops of the ImageNet paper’s Fig. 1 (photo only; the paper’s printed labels are cut off and re-typed on the card backs).',
    sources: ['https://arxiv.org/abs/1409.0575 (Russakovsky et al., ImageNet Large Scale Visual Recognition Challenge, 2015, Fig. 1 and Sec. 3.1.3)'],
  });
  return s;
}

// PART 1 · 3  Unsupervised learning: sort one-sided cards, or make new ones
async function unsupervisedSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(3));
  title(s, 'Unsupervised: sort the cards, or make new ones');
  const px = MX, py = 1.98, pw = 5.9, ph = 4.0;
  const head = label(d, s, 'NO ANSWERS ON THE BACK', px, 1.6, pw, { color: d.S.amber, size: 14 });
  const panel = box(d, s, px, py, pw, ph, { fill: HEX.card, line: HEX.line });
  // nine one-sided cards, scattered (a 3 × 3 grid with jitter and small turns)
  const order = ['leopard', 'orange', 'airliner', 'mushroom', 'cars', 'monkey', 'canoe', 'lion', 'strawberry'];
  const rots = [-7, 5, -3, 4, -6, 8, 6, -4, -8], jx = [0.1, -0.12, 0.05, -0.08, 0.12, -0.05, 0.06, -0.1, 0.08], jy = [-0.05, 0.08, -0.1, 0.1, -0.06, 0.04, -0.08, 0.05, 0.02];
  const sw = 1.48, sh = 1.06, scatter = [];
  for (let i = 0; i < 9; i++) {
    const cx = px + pw * (1 + 2 * (i % 3)) / 6 + jx[i], cyy = py + 0.74 + 1.26 * Math.floor(i / 3) + jy[i];
    scatter.push(...await photoCard(d, s, D(`in_${order[i]}.png`), { x: cx - sw / 2, y: cyy - sh / 2, w: sw, h: sh, rot: rots[i], m: 0.07 }));
  }
  // click 1: an identical opaque panel covers the scatter, and three neat piles rise on it
  const cover = box(d, s, px, py, pw, ph, { fill: HEX.card, line: HEX.line });
  const piles = [['leopard', 'lion', 'monkey'], ['strawberry', 'orange', 'mushroom'], ['airliner', 'cars', 'canoe']];
  const cw = 1.58, chh = 1.18, off = 0.08, gap = (pw - 0.3 - 3 * (cw + 2 * off)) / 2, pileY = py + 0.28;
  const sorted = [];
  for (let p = 0; p < 3; p++) {
    const x0 = px + 0.15 + p * (cw + 2 * off + gap);
    for (let k = 0; k < 3; k++) sorted.push(...await photoCard(d, s, D(`in_${piles[p][2 - k]}.png`), { x: x0 + k * off, y: pileY + k * off, w: cw, h: chh, m: 0.06 }));
    sorted.push(d.text(s, `pile ${p + 1}`, { x: x0, y: pileY + chh + 2 * off + 0.08, w: cw + 2 * off, h: 0.32, fontSize: 16, bold: true, color: HEX.muted, align: 'center' }));
  }
  const capY = pileY + chh + 2 * off + 0.62;
  sorted.push(d.text(s, [{ text: 'It finds the groups.', options: { bold: true, color: HEX.text, breakLine: true } }, { text: 'Nobody named them.', options: { bold: true, color: HEX.amber } }], { x: px + 0.25, y: capY + 0.2, w: 3.3, h: 1.0, fontSize: 22, valign: 'top' }));
  // the real algorithm on dots (k-means), small, with its caption
  const km = await d.frame(s, KMEANS, { x: px + 3.75, y: capY - 0.12, w: 1.95, h: 1.42 }, { pad: 0.04, align: 'right' });
  sorted.push(...km, d.text(s, 'the same idea, on dots', { x: km.geom.x - 0.45, y: km.geom.y + km.geom.h + 0.04, w: km.geom.w + 0.5, h: 0.3, fontSize: 14, italic: true, color: HEX.muted, align: 'right' }));

  // right: the class question, then (click 2) a brand-new card
  const rx = 6.85, rw = W - MX - rx;
  const ask = await beatLine(d, s, { text: 'HANDS UP', iconName: 'FaHandPaper', q: 'Sort these: by kind, or by color?', x: rx, y: 1.95, w: rw, h: 0.5, qSize: 20 });
  const make = [];
  const newFile = have(D('ddim_40.jpg')) ? D('ddim_40.jpg') : R('unsup-google-cat-neuron-image.png');
  const realNew = have(D('ddim_40.jpg'));
  const ncw = realNew ? 2.5 : 3.15, nch = realNew ? 3.2 : 3.15, ncx = rx + (rw - ncw) / 2 - 0.15, ncy = 2.66;
  const slot = [box(d, s, ncx + 0.2, ncy + 0.2, ncw - 0.4, nch - 0.4, { fill: HEX.card, line: HEX.steel, lw: 1.5, dash: 'dash' }),
    d.text(s, '?', { x: ncx + 0.2, y: ncy + 0.2, w: ncw - 0.4, h: nch - 0.4, fontSize: 72, bold: true, color: HEX.steel, fontFace: 'Arial', align: 'center', valign: 'middle' })];
  make.push(...await photoCard(d, s, newFile, { x: ncx, y: ncy, w: ncw, h: nch, rot: 3, m: 0.14 }));
  make.push(...await iconDisc(d, s, 'FaMagic', ncx + ncw - 0.05, ncy + 0.1, 0.72, HEX.amber, TINT.amber));
  make.push(d.text(s, have(D('ddim_40.jpg')) ? '…or learn to make a new card nobody printed.' : '…or find an idea nobody named (Google, 2012).', { x: rx, y: ncy + nch + 0.2, w: rw, h: 0.5, fontSize: 20, bold: true, color: HEX.text, align: 'center', valign: 'middle' }));
  src(d, s, have(D('ddim_40.jpg'))
    ? 'Photos: ImageNet (Russakovsky et al., 2015) · dots: Chire, CC BY-SA 4.0 (cropped, frames reordered) · castle: Benlisquare, CC BY-SA 4.0, made with Stable Diffusion v1-5'
    : 'Photos: ImageNet (Russakovsky et al., 2015) · dots: Chire, CC BY-SA 4.0 (cropped, frames reordered) · image: Google (2012)');
  d.animate(s, [head, panel, ...scatter, ...ask, ...slot], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, [{ name: cover, effect: 'fade', dur: 300 }, ...sorted.map((name) => ({ name, delay: 250 }))], { effect: 'rise' });
  d.animate(s, make, { effect: 'zoom', dur: 450 });
  notes(s, {
    min: '1.25',
    build: 'Nine one-sided cards and the HANDS UP question show automatically. Click 1: the cards are sorted into three unnamed piles (with the real algorithm on dots, small). Click 2: a brand-new card the computer made.',
    say: 'Now the cards have no answers on the back. Can you still learn something? Hands up if you would sort these by kind of thing. Hands up if you would sort them by color. [Take hands for each.] Both work: there is no single right answer. [Click.] A computer can do this too. It finds groups on its own: here, animals, food and vehicles. But it does not know those names; to the computer they are just pile 1, pile 2 and pile 3. That is unsupervised learning: finding patterns with no answer key. Small, bottom right: the same idea on dots, a sorting program called k-means. [Click.] And if the cards are pictures, a computer can learn what the pile looks like so well that it makes a brand-new card nobody ever printed. This castle was never photographed: an AI made it. You will see how on slide 14. Remember this family, unsupervised: no answers from people. Soon you will hear the word “self-supervised”. That is one kind of unsupervised learning, where the data makes its own answer key.',
    analogy: 'One-sided flash cards: sort them into piles (clustering), or learn to draw new cards that fit the pile (generating).',
    terms: 'unsupervised learning (finding patterns in examples with no answers attached), clustering (sorting into groups), generative AI (AI that makes new pictures or text).',
    ask: 'On the slide: “Sort these: by kind, or by color?” Format: two quick hands-up votes (about 15 seconds). The point: both are fine; there is no single right answer.',
    takeaway: 'Unsupervised learning finds patterns with no answer key: it can sort the cards, or learn to make new ones.',
    advanced: 'k-means, the sorting program in the dots, has to be told how many groups to make (here three); it does not discover the number itself. Image generators like the one that made the castle are trained with a “remove the static” game (slide 14), which researchers call self-supervised learning: the data makes its own answer key. Many people count self-supervised learning as part of the unsupervised family.',
    caveats: 'The three piles are our arrangement, to show the idea; a real program might group by color or background instead. “Unsupervised” is a broad family, and experts argue about the names. The nine photos are crops of the ImageNet paper’s Fig. 1 (the canoe is cut short on the right to drop a watermark; the cars are ImageNet’s “minivan” photo). The castle is real AI output, posted by its maker on Wikimedia Commons. The k-means GIF is cropped to its plot area and its frames start at the finished state (the credit says so).',
    sources: ['https://arxiv.org/abs/1409.0575 (ImageNet, Fig. 1)', 'https://commons.wikimedia.org/wiki/File:K-means_convergence.gif (Chire, CC BY-SA 4.0)', 'https://commons.wikimedia.org/wiki/File:X-Y_plot_of_algorithmically-generated_AI_art_of_European-style_castle_in_Japan_demonstrating_DDIM_diffusion_steps.png (Benlisquare, CC BY-SA 4.0; Stable Diffusion v1-5 output)'],
  });
  return s;
}

// PART 1 · 4  Reinforcement learning: a dog and treats
async function rlDogSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  kicker(s, K(4));
  title(s, 'Reinforcement learning: treats for good tries');
  const left = [];
  if (have(D('dog_treat.jpg'))) {
    left.push(...await d.frame(s, D('dog_treat.jpg'), { x: MX, y: 1.72, w: 6.9, h: 4.4 }, { pad: 0.07, align: 'left' }));
  } else {
    left.push(box(d, s, MX, 1.7, 5.9, 4.75, { fill: HEX.card, line: HEX.line }));
    left.push(await ic(d, s, 'FaDog', HEX.text, MX + 1.0, 2.3, 3.2));
    left.push(await ic(d, s, 'FaBone', HEX.amber, MX + 3.9, 4.4, 1.3, -20));
  }
  // the loop: try → treat (or not) → do more of what earned treats
  const cx = 10.2, cy = 3.34, r = 1.12, dia = 1.08;
  const pts = [[cx, cy - r], [cx + r * 0.866, cy + r * 0.5], [cx - r * 0.866, cy + r * 0.5]];
  const st = [['FaRedo', '1 · Try something'], ['FaBone', '2 · Treat… or not'], ['FaThumbsUp', '3 · Do more of what earned treats']];
  const loop = [];
  for (let i = 0; i < 3; i++) {
    loop.push(...await iconDisc(d, s, st[i][0], pts[i][0], pts[i][1], dia, HEX.amber, TINT.amber));
    const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % 3], L = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / L, uy = (by - ay) / L, k = dia / 2 + 0.1;
    loop.push(seg(d, s, ax + ux * k, ay + uy * k, bx - ux * k, by - uy * k, { color: HEX.amber, width: 2.5, arrow: true }));
  }
  loop.push(d.text(s, st[0][1], { x: pts[0][0] + dia / 2 + 0.12, y: pts[0][1] - 0.3, w: 2.0, h: 0.6, fontSize: 18, bold: true, color: HEX.text, valign: 'middle' }));
  loop.push(d.text(s, st[1][1], { x: pts[1][0] - 0.9, y: pts[1][1] + dia / 2 + 0.06, w: 2.0, h: 0.4, fontSize: 18, bold: true, color: HEX.text, align: 'center', valign: 'top' }));
  loop.push(d.text(s, st[2][1], { x: pts[2][0] - 1.15, y: pts[2][1] + dia / 2 + 0.06, w: 2.1, h: 0.66, fontSize: 18, bold: true, color: HEX.text, align: 'center', valign: 'top' }));
  // click 2: the treat, for an AI, is points
  const hs = await d.frame(s, D('hideseek_ab.png'), { x: 7.75, y: 5.38, w: 2.15, h: 1.05 }, { pad: 0.04, align: 'left' });
  const tx = hs.geom.x + hs.geom.w + 0.3;
  const strip = [...hs, d.text(s, [
    { text: 'For an AI, the treat is a number: points.', options: { bold: true, color: HEX.text, fontSize: 18, breakLine: true } },
    { text: 'OpenAI hide-and-seek (2019): forts learned from points', options: { color: HEX.muted, fontSize: 14, italic: true } },
  ], { x: tx, y: 5.38, w: W - MX - tx, h: 1.1, valign: 'middle' })];
  src(d, s, have(D('dog_treat.jpg')) ? 'Photo: “Dog with treat”, pbump, CC BY-SA 2.0, via Wikimedia Commons · hide-and-seek: OpenAI, Baker et al. (2019)' : 'Hide-and-seek: OpenAI, Baker et al. (2019)');
  d.animate(s, left, { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, loop, { effect: 'fade' });
  d.animate(s, strip, { effect: 'rise' });
  notes(s, {
    min: '1.0',
    build: 'The photo shows automatically. Click 1: the try, treat, do-more loop. Click 2: “for an AI, the treat is points”, with the hide-and-seek picture.',
    say: 'The third kind is reinforcement learning, and it is how you train a dog. This one is waiting for its treat. Who here has taught a pet a trick? [A few hands.] [Click.] The dog tries something. If it sits, it gets a treat; if not, no treat. Over time it does more of whatever earned treats. Notice what the treat does NOT do: it never tells the dog what to do. It only says “that was good”. [Click.] For an AI, the treat is just a number: points. In OpenAI’s hide-and-seek game, the hiders got points for staying hidden, and nothing else. After millions of games they learned, on their own, to build forts.',
    analogy: 'Training your dog with treats: try, treat or no treat, do more of what earned treats.',
    terms: 'reinforcement learning (learning by trial and error from rewards), reward (the points: a score for how good a result was).',
    ask: 'Spoken only (no chip): “Who has taught a pet a trick?” A few hands; no answers needed.',
    takeaway: 'A reward says how good a try was, not what to do.',
    advanced: 'Rewards are rare and carry little information: one number after a whole game. That sets up LeCun’s cherry on slide 15. In hide-and-seek, the reward, verbatim from the paper: “hiders are given a reward of 1 if all hiders are hidden and -1 if any hider is seen by a seeker”; the forts appeared “after approximately 25 million episodes” (games).',
    caveats: 'A reward can be gamed: an AI may find a way to earn points without doing what we meant (Part 3’s boat game). The dog photo is a real photo (Wikimedia Commons; its description: “Dog waiting for treat”).',
    sources: ['https://commons.wikimedia.org/wiki/File:Dog_with_treat.jpg (pbump, CC BY-SA 2.0)', 'https://arxiv.org/abs/1909.07528 (Baker et al., 2019, “Emergent Tool Use From Multi-Agent Autocurricula”)', 'https://openai.com/index/emergent-tool-use/'],
  });
  return s;
}

// PART 1 · 5  Quiz: which kind of learning?
async function quizSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(5));
  title(s, 'Quiz: which kind of learning is this?');
  const bt = await beat(d, s, 'QUIZ', 'FaQuestionCircle');
  const types = [['1 finger', 'Supervised', HEX.blue, 'FaClone', TINT.blue], ['2 fingers', 'Unsupervised', HEX.teal, 'FaLayerGroup', TINT.teal], ['3 fingers', 'Reinforcement', HEX.amber, 'FaDog', TINT.amber]];
  const lw = (W - 2 * MX - 2 * 0.25) / 3, legend = [];
  for (let i = 0; i < 3; i++) {
    const [f, t, c, nm, tint] = types[i], x = MX + i * (lw + 0.25);
    legend.push(box(d, s, x, 1.72, lw, 0.66, { fill: tint, line: c, lw: 1.25 }));
    legend.push(await ic(d, s, nm, c, x + 0.2, 1.84, 0.42));
    legend.push(d.text(s, [{ text: f + '  ', options: { color: HEX.muted } }, { text: t, options: { bold: true, color: c } }], { x: x + 0.75, y: 1.72, w: lw - 0.9, h: 0.66, fontSize: 20, valign: 'middle' }));
  }
  const ins = label(d, s, 'SHOW YOUR FINGERS FOR EACH MADE-UP SCENARIO', MX, 2.46, W - 2 * MX, { color: d.S.amber, size: 14 });
  const sc = [
    ['A', 'A program practices with flash cards and checks each guess against an answer key.', 0, 'SUPERVISED: the answer key holds the labels'],
    ['B', 'A program sorts thousands of unlabeled photos into groups.', 1, 'UNSUPERVISED: no labels, it finds groups'],
    ['C', 'A game bot earns points for winning and changes its moves.', 2, 'REINFORCEMENT: the points are the reward'],
    ['D', 'A program sees thousands of face photos with no names, then draws new faces.', 1, 'UNSUPERVISED: no names, it makes new cards'],
  ];
  const cw = (W - 2 * MX - 0.3) / 2, ch = 1.78, cards = [], answers = [];
  sc.forEach(([L, text, ti, ans], i) => {
    const x = MX + (i % 2) * (cw + 0.3), y = 2.86 + Math.floor(i / 2) * (ch + 0.1);
    const g = [box(d, s, x, y, cw, ch, { fill: HEX.card, line: HEX.line })];
    g.push(...numDisc(d, s, L, x + 0.62, y + 0.62, 0.8, HEX.card2, { color: HEX.text, fontSize: 30 }));
    g.push(d.text(s, text, { x: x + 1.25, y: y + 0.1, w: cw - 1.45, h: 1.05, fontSize: 18, color: HEX.text, valign: 'middle' }));
    cards.push(g);
    const c = types[ti][2];
    answers.push(chip(d, s, ans, x + 1.25, y + 1.22, cw - 1.45, c, { h: 0.44, fontSize: 16, color: c === HEX.amber ? HEX.ink : 'FFFFFF', align: 'left', charSpacing: 0 }));
  });
  d.animate(s, [...legend, ins, ...cards.flat()], { auto: true, effect: 'fade' });
  d.animate(s, bt, { auto: true, effect: 'zoom', dur: 400 });
  answers.forEach((a) => d.animate(s, a, { effect: 'zoom', dur: 350 }));
  notes(s, {
    min: '1.5',
    build: 'The key and the four scenarios show automatically. Clicks 1–4 reveal the answers for A, B, C and D, one at a time. Read the room BEFORE each click. HOW TO READ 200 HANDS: do not count; scan one section per scenario (A: the front third, B: the middle third, C: the back third, D: the whole room at a glance) and call the majority out loud (“mostly three fingers”).',
    say: 'Quiz time. For each made-up scenario, show me with fingers: one finger for flash cards, supervised; two for sorting or making new cards, unsupervised; three for the dog and treats, reinforcement. Hold your hand up high. Scenario A: a program practices with flash cards and checks each guess against an answer key. Fingers up! [Scan the front third, call the majority, then click.] Supervised: the answer key holds the labels. B: sorting thousands of unlabeled photos into groups. [Scan, call it, click.] Unsupervised. C: a game bot earns points for winning. [Scan, call it, click.] Reinforcement: the points are the treats. D: a program sees thousands of face photos with no names, then draws new faces. [Glance across the room, call it, click.] Two fingers: unsupervised, making new cards. Nobody gave it answers; it learned what faces look like.',
    analogy: 'All three pictures together: flash cards (supervised), sorting or making cards (unsupervised), treats (reinforcement).',
    terms: 'none new (reviews slides 6 to 8).',
    ask: 'The four scenarios. Expected: A one finger (supervised), B two (unsupervised), C three (reinforcement), D two (unsupervised, generating). If some say D is “one finger”, ask: where is the answer key? There is none: no names on the photos.',
    takeaway: 'Ask “where do the answers come from?” and you can tell the kinds of learning apart.',
    advanced: 'Programs that draw new faces were an early, famous example of making new pictures. Today’s image generators are usually trained with the “remove the static” game on slide 14, which researchers call self-supervised: the picture itself is the answer key. Many people count self-supervised learning as part of unsupervised learning.',
    caveats: 'All four scenarios are made-up examples (labelled as such on the slide). Do not reveal before the room answers.',
    sources: ['None needed: four made-up scenarios, labelled as such on the slide.'],
  });
  return s;
}

// PART 1 · 6  Neural network = stack of dials
async function networkSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(6));
  title(s, 'A neural network is a stack of dials');
  const img = await d.frame(s, D('cifar_cat.png'), { x: MX, y: 3.3, w: 1.4, h: 1.4 }, { pad: 0.05 });
  const imgLab = d.text(s, 'a photo: just pixels', { x: MX - 0.15, y: 4.76, w: 1.7, h: 0.3, fontSize: 14, color: d.S.muted, align: 'center' });
  const xs = [2.85, 4.15, 5.45, 6.75], dia = 0.4, ncy = 4.0;
  const net = drawNet(d, s, { xs, cy: ncy, gap: 0.8, layers: [4, 5, 5, 3], dia });
  const inArrow = seg(d, s, MX + 1.47, ncy, xs[0] - 0.32, ncy, { color: HEX.muted, width: 2, arrow: true });
  const layLab = [
    d.text(s, 'INPUT', { x: xs[0] - 0.6, y: 5.95, w: 1.2, h: 0.3, fontSize: 14, bold: true, color: d.S.steel, align: 'center', charSpacing: 2 }),
    d.text(s, 'HIDDEN LAYERS', { x: xs[1] - 0.3, y: 5.95, w: xs[2] - xs[1] + 0.6, h: 0.3, fontSize: 14, bold: true, color: d.S.steel, align: 'center', charSpacing: 2 }),
    d.text(s, 'OUTPUT', { x: xs[3] - 0.6, y: 5.95, w: 1.2, h: 0.3, fontSize: 14, bold: true, color: d.S.steel, align: 'center', charSpacing: 2 }),
  ];
  // click 1: the signal lights each layer, left to right, then "cat"
  const lit = [];
  net.pos.forEach((col, li) => col.forEach((p, j) => {
    if (li === 3 && j > 0) return;
    lit.push({ name: oval(d, s, p.x - dia / 2, p.y - dia / 2, dia, dia, li === 3 ? HEX.red : '5A1E22', HEX.red, 1.5), delay: li * 260 });
  }));
  lit.push({ name: d.text(s, [{ text: 'Each circle (a neuron) ', options: { bold: true, color: HEX.text } }, { text: 'adds up what comes in, then passes a signal on', options: { color: HEX.muted } }], { x: 2.35, y: 1.6, w: 5.6, h: 0.5, fontSize: 16, valign: 'middle' }), delay: 0 });
  ['cat', 'dog', 'frog'].forEach((o, j) => lit.push({ name: d.text(s, o, { x: xs[3] + 0.32, y: net.pos[3][j].y - 0.22, w: 1.0, h: 0.44, fontSize: 20, bold: j === 0, color: j === 0 ? d.S.red : d.S.muted, valign: 'middle' }), delay: 3 * 260 }));
  // click 2: a real mixing board
  const rx = 8.35, rw = W - MX - rx;
  const mix = await d.frame(s, D('console_crop.jpg'), { x: rx, y: 1.68, w: rw, h: 2.18 }, { pad: 0.05 });
  const mixCap = [await ic(d, s, 'FaSlidersH', HEX.amber, rx, mix.geom.y + mix.geom.h + 0.16, 0.36),
    d.text(s, [{ text: 'Each line is a dial ', options: { bold: true, color: HEX.text } }, { text: '(a weight)', options: { color: HEX.amber, bold: true } }], { x: rx + 0.5, y: mix.geom.y + mix.geom.h + 0.1, w: rw - 0.5, h: 0.48, fontSize: 20, valign: 'middle' })];
  // click 3: how many dials
  const hy = 4.55;
  const how = [label(d, s, 'HOW MANY DIALS?', rx, hy, rw, { color: d.S.amber, size: 14 })];
  [['13,002', 'a digit reader'], ['175 billion', 'GPT-3 (2020)'], ['1.04 trillion', 'Kimi K2.5 (2026)']].forEach(([v, l], i) => {
    const y = hy + 0.34 + i * 0.42;
    how.push(d.text(s, v, { x: rx, y, w: 2.0, h: 0.42, fontSize: 22, bold: true, color: i === 2 ? d.S.red : HEX.amber, fontFace: 'Arial', valign: 'middle' }));
    how.push(d.text(s, l, { x: rx + 2.05, y, w: rw - 2.05, h: 0.42, fontSize: 18, color: HEX.text, valign: 'middle' }));
  });
  how.push(d.text(s, 'Kimi: the total; it uses about 32 billion for each word. Closed models: no public count found.', { x: rx, y: hy + 1.62, w: rw, h: 0.52, fontSize: 14, italic: true, color: HEX.muted, valign: 'top' }));
  src(d, s, 'Cat: CIFAR-10 (A. Krizhevsky) · console: Dejan Krsmanovic, CC BY 2.0, via Wikimedia Commons (cropped) · sizes: 3Blue1Brown · GPT-3 paper · Kimi K2.5 paper');
  d.animate(s, [...img, imgLab, inArrow, ...net.lines, ...net.nodes.flat(), ...layLab], { auto: true, effect: 'fade', dur: 700 });
  d.animate(s, lit, { effect: 'fade', dur: 300 });
  d.animate(s, [...mix, ...mixCap], { effect: 'fade' });
  d.animate(s, how, { effect: 'rise' });
  notes(s, {
    min: '2.0',
    build: 'The network shows automatically. Click 1: the signal lights the layers left to right, the output says “cat”, and the line “each circle adds up what comes in, then passes a signal on” appears above. Click 2: the mixing-board photo and “each line is a dial”. Click 3: how many dials, with the note that Kimi’s count is a total.',
    say: 'Here is the “deep” in deep learning. A neural network is layers of tiny simple units called neurons, joined by connections. A photo goes in on the left as numbers: just pixel colors. [Click.] The signal flows through, layer by layer: each neuron adds up what comes in and passes a signal on. The middle columns are called hidden layers. Out the right side comes an answer: “cat”. [Click.] Every line has a weight: a dial that sets how strongly one signal pushes the next, like a slider on a mixing board. Set the dials right and it says “cat” for cats; set them wrong and it says nonsense. Learning means finding good settings. [Click.] How many dials? A small network that reads handwritten digits has 13,002. GPT-3, an OpenAI model from 2020, had 175 billion. Kimi K2.5, an open model from this year, has 1.04 trillion in total, though it only uses about 32 billion of them for each word. For closed models we found no public count. A mixing board with a trillion knobs: could you set them by hand? [Pause.] No. That is why the computer has to learn the settings: next slide.',
    analogy: 'A mixing board with a trillion knobs. Training turns every knob a tiny bit toward the right answer.',
    terms: 'neural network, neuron (a tiny unit that adds up signals; an idea borrowed loosely from brains, not a brain), weight (a dial on one connection), layer (one column of neurons), hidden layers (the middle columns), parameters (all the dials together), open model (anyone can download its dial settings) vs closed model (only its company runs it; Part 4 uses “open”).',
    ask: 'Spoken only (no chip): “A mixing board with a trillion knobs: could you set them by hand?” Expected: no.',
    takeaway: 'A neural network is layers of simple units joined by dials (weights); today’s big models have billions to trillions of dials.',
    advanced: 'In words: each unit adds up its inputs, each multiplied by a dial, then squashes the result before passing it on. The 13,002 is the count for 3Blue1Brown’s example network (784 inputs, two layers of 16, 10 outputs). Many 2025–26 open models are “mixture of experts”: Kimi K2.5 has 1.04 trillion dials but uses only 32 billion for each word. Setting one dial per second, a trillion dials would take tens of thousands of years (our arithmetic).',
    caveats: 'Say “we found no public count” for closed models, not “they never publish”: the research checked specific models (GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro and GPT-6 Astra; Epoch AI’s database leaves those fields blank). Outside estimates of closed models’ sizes exist, but they are only estimates. Open-weight releases do publish: OpenAI’s gpt-oss-120b has 116.8 billion parameters (model card, Aug 2025). The drawing is a schematic; real networks have far more neurons. The cat is a real CIFAR-10 image. The mixing console is a real photo (cropped to the faders).',
    sources: ['https://www.3blue1brown.com/lessons/neural-networks', 'https://arxiv.org/pdf/2005.14165 (GPT-3: 175 billion parameters)', 'https://arxiv.org/pdf/2602.02276 (Kimi K2.5: 1.04 trillion total, 32 billion activated)', 'https://arxiv.org/abs/2508.10925 (gpt-oss model card)', 'https://epoch.ai/data/notable-ai-models', 'https://www.cs.toronto.edu/~kriz/cifar.html', 'https://commons.wikimedia.org/wiki/File:Modern_Mixing_Console_(32961446438).jpg (Dejan Krsmanovic, CC BY 2.0)'],
  });
  return s;
}

// PART 1 · 7  The slope in every direction (the gradient, with no math)
async function gradientSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  kicker(s, K(7));
  title(s, 'Training feels the slope, then steps downhill');
  const gx = 0.6, gy = 2.05, gw = 7.0, gh = 4.0, tm = 0.66;
  const curve = (t) => {
    const g = t < tm ? Math.pow((tm - t) / tm, 2) : 0.38 * Math.pow((t - tm) / (1 - tm), 2);
    return { x: gx + 0.1 + (gw - 0.2) * t, y: 5.6 - 3.1 * g };
  };
  const pts = [];
  for (let i = 0; i <= 60; i++) { const p = curve(i / 60); pts.push({ x: p.x - gx, y: p.y - gy }); }
  pts.push({ x: gw - 0.1, y: gh }, { x: 0.1, y: gh }, { close: true });
  const ground = d.name('hill');
  s.addShape(d.pres.shapes.CUSTOM_GEOMETRY || 'custGeom', { x: gx, y: gy, w: gw, h: gh, points: pts, fill: { color: HEX.card2 }, line: { color: HEX.steel, width: 1.5 }, objectName: ground });
  const axis = label(d, s, 'HIGHER UP: MORE WRONG (THE LOSS)', MX, 1.62, 5.0, { color: d.S.steel, size: 14 });
  const xLab = d.text(s, 'one dial’s setting', { x: gx + gw - 3.0, y: 6.1, w: 2.9, h: 0.3, fontSize: 14, color: d.S.steel, align: 'right' });
  const fog = [[0.7, 2.25, 3.4, 1.45], [2.7, 2.8, 2.9, 1.25], [0.6, 3.5, 2.3, 0.95]].map(([x, y, w, h]) => {
    const n = d.name('fog');
    s.addShape(d.pres.shapes.OVAL, { x, y, w, h, fill: { color: 'B8C0CC', transparency: 89 }, line: { color: 'B8C0CC', width: 0, transparency: 100 }, objectName: n });
    return n;
  });
  const fogLab = d.text(s, 'thick fog: you can only feel the ground under your feet', { x: 2.3, y: 2.12, w: 3.3, h: 0.7, fontSize: 16, italic: true, color: d.S.muted, valign: 'top' });
  const h0 = curve(0.08), hs = 0.6, footT = (h0.x + 0.29 * hs - gx - 0.1) / (gw - 0.2);
  const foot = curve(footT);
  const hiker = await ic(d, s, 'FaHiking', HEX.text, h0.x, foot.y - hs - 0.05, hs);
  // click 1: the slope in every direction (8 arrows at the hiker's feet; downhill is red)
  const rc = { x: 2.85, y: 3.38 }, rl = 0.56, rose = [];
  rose.push({ name: oval(d, s, rc.x - rl - 0.12, rc.y - rl - 0.12, 2 * rl + 0.24, 2 * rl + 0.24, HEX.card, HEX.steel, 1, 0), delay: 0 });
  rose.push({ name: seg(d, s, foot.x + 0.12, foot.y + 0.02, rc.x - (rl + 0.12) * 0.8, rc.y + (rl + 0.12) * 0.6, { color: HEX.steel, width: 1.25, dash: 'dash' }), delay: 0 });
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4, down = k === 1; // k = 1: 45° down and to the right, the way the hill falls
    rose.push({ name: seg(d, s, rc.x + Math.cos(a) * 0.1, rc.y + Math.sin(a) * 0.1, rc.x + Math.cos(a) * rl, rc.y + Math.sin(a) * rl, { color: down ? HEX.red : HEX.muted, width: down ? 4.5 : 2, arrow: true }), delay: 150 + k * 70 });
  }
  rose.push({ name: oval(d, s, rc.x - 0.07, rc.y - 0.07, 0.14, 0.14, HEX.text, HEX.text), delay: 150 });
  rose.push({ name: d.text(s, [{ text: 'the slope in every', options: { bold: true, color: HEX.text, breakLine: true } }, { text: 'direction at once', options: { bold: true, color: HEX.text, breakLine: true } }, { text: 'red: the way down', options: { bold: true, color: HEX.red, breakLine: true } }, { text: ' ', options: { fontSize: 8, breakLine: true } }, { text: 'The gradient:', options: { bold: true, color: HEX.amber, breakLine: true } }, { text: 'the slope in higher dimensions', options: { color: HEX.amber } }], { x: rc.x + rl + 0.22, y: rc.y - 0.5, w: 2.02, h: 1.75, fontSize: 16, valign: 'top' }), delay: 700 });
  // click 2: small steps downhill to the lowest point
  const steps = [0.2, 0.31, 0.4, 0.48, 0.55, 0.6, 0.64].map((t, i) => { const p = curve(t); return { name: oval(d, s, p.x - 0.08, p.y - 0.18, 0.16, 0.16, HEX.red, HEX.red), delay: i * 220 }; });
  const pm = curve(tm);
  const flag = [{ name: await ic(d, s, 'FaFlag', HEX.teal, pm.x - 0.08, pm.y - 0.52, 0.46), delay: 1600 },
    { name: d.text(s, 'lowest point: fewest mistakes', { x: pm.x - 1.4, y: pm.y + 0.06, w: 2.8, h: 0.32, fontSize: 14, bold: true, color: HEX.teal, align: 'center' }), delay: 1600 }];
  // right: three picture cards
  const rx = 8.05, rw = W - MX - rx, ch = 1.12, cp = 1.24;
  const cardsDef = [
    ['FaBullseye', HEX.red, 'How wrong?', 'one score: the loss'],
    ['FaCompass', HEX.amber, 'Which way is down?', 'feel the slope in every direction'],
    ['FaShoePrints', HEX.teal, 'Small step downhill.', 'Repeat, many times.'],
  ];
  const cards = [];
  for (let i = 0; i < 3; i++) {
    const y = 1.72 + i * cp, [nm, c, t, sub] = cardsDef[i];
    const g = [box(d, s, rx, y, rw, ch, { fill: HEX.card, line: HEX.line })];
    g.push(...await iconDisc(d, s, nm, rx + 0.55, y + ch / 2, 0.76, c, HEX.card2));
    g.push(d.text(s, [{ text: t, options: { bold: true, color: HEX.text, fontSize: 22, fontFace: 'Arial', breakLine: true } }, { text: sub, options: { color: HEX.muted, fontSize: 16 } }], { x: rx + 1.1, y: y + 0.04, w: rw - 1.2, h: ch - 0.08, valign: 'middle' }));
    cards.push(g);
  }
  // click 3: the map view and the class question
  const inset = await d.frame(s, D('gd_zoom.png'), { x: 5.62, y: 1.72, w: 2.15, h: 1.98 }, { pad: 0.04 });
  const insetLab = d.text(s, 'from above: red arrows are steps', { x: inset.geom.x - 0.2, y: inset.geom.y + inset.geom.h + 0.06, w: inset.geom.w + 0.4, h: 0.55, fontSize: 14, color: d.S.muted, align: 'center', valign: 'top' });
  const ay = 5.62, ah = 0.82;
  const askBox = [box(d, s, rx, ay, rw, ah, { fill: HEX.card2, line: HEX.red })];
  askBox.push(...await beatLine(d, s, { text: 'HANDS UP', iconName: 'FaHandPaper', q: 'Steps way too big: what goes wrong?', x: rx + 0.14, y: ay, w: rw - 0.24, h: ah, qSize: 18 }));
  src(d, s, 'Map view: Wikimedia Commons, public domain (cropped) · the hill is a drawing, not real data');
  d.animate(s, [ground, axis, xLab, ...fog, fogLab, hiker, ...cards[0]], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, [...rose, ...cards[1]], { effect: 'fade', dur: 350 });
  d.animate(s, [...steps.map((o) => ({ ...o, effect: 'zoom', dur: 260 })), ...flag, ...cards[2]], { effect: 'rise' });
  d.animate(s, [...inset, insetLab, ...askBox], { effect: 'fade' });
  notes(s, {
    min: '2.0',
    build: 'The hill, the hiker and “How wrong?” show automatically. Click 1: eight arrows at the hiker’s feet (the slope in every direction; the red one points downhill), the label “the gradient: the slope in higher dimensions” and “Which way is down?”. Click 2: small steps down to the lowest point, and “Small step downhill. Repeat.”. Click 3: the same idea seen from above, and the hands-up question.',
    say: 'So how does the computer find good settings for a trillion dials? First it needs a score for how wrong it is. That score is called the loss: higher up this hill means more wrong. Now imagine you are a hiker on a mountain in thick fog. You cannot see the valley. But you can feel the ground under your feet. [Click.] You feel the slope in every direction at once: forward, back, left, right, and everything in between. One way goes down the most: the red arrow. The gradient is the slope in higher dimensions: the slope in many directions at once. It tells us which way is downhill. Each dial is one direction you could step in. With two dials you get a map like the one coming up; with a trillion dials, a trillion directions. That is what “higher dimensions” means. [Click.] So you take a small step downhill, feel again, take another step, and so on, until you reach the lowest point: the fewest mistakes. That is training: feel the slope, small step downhill, repeat, many, many times. [Click.] Here is the same idea from above, like a map: each red arrow is one step toward the bottom. Hands up: what goes wrong if your steps are way too big? [Take two answers.] Right: you jump right over the valley, or bounce back and forth. Too small, and it takes forever.',
    analogy: 'A hiker in thick fog who can only feel the ground under their feet, and keeps stepping the way that goes down the most.',
    terms: 'loss (one score for how wrong the model is; lower is better), gradient (on the slide: the slope in higher dimensions, the slope in many directions at once, which tells us which way is downhill; one direction per dial), training (feel the slope, small step downhill, repeat).',
    ask: 'On the slide: “Steps way too big: what goes wrong?” Format: hands up, take two answers (about 30 seconds). Expected: you jump over the valley, or bounce back and forth. Follow-up, “Too small?”: it takes forever.',
    takeaway: 'Training means: measure how wrong, feel which way is downhill for every dial at once, take a small step, repeat.',
    advanced: 'In words only: with a trillion dials, the hill has a trillion directions. We cannot picture that, but the idea is the same: feel the slope in every direction, step the way that goes down most. The next slide shows how the computer feels that slope for every dial in one go.',
    caveats: 'The hill is a drawing with no real numbers (said on the slide). The real landscape is bumpy: you can get stuck in a dip that is not the lowest point, or crawl across flat ground. The map view is a real figure from Wikimedia Commons (public domain), cropped.',
    sources: ['https://commons.wikimedia.org/wiki/File:Gradient_descent.png (public domain)', 'https://www.3blue1brown.com/lessons/gradient-descent', 'https://www.youtube.com/watch?v=IHZwWFHWa-w (3Blue1Brown, chapter 2)'],
  });
  return s;
}

// PART 1 · 8  Backpropagation
async function backpropSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  kicker(s, K(8));
  title(s, 'Backpropagation sends the blame backwards');
  const fl = label(d, s, 'LIKE A FACTORY LINE', MX, 1.62, 6, { color: d.S.amber, size: 14 });
  const bw = 2.55, gap = 0.62, x0 = MX + (W - 2 * MX - (4 * bw + 3 * gap)) / 2, by = 2.0, bh = 0.9;
  const fac = [fl];
  const st = [['FaCog', 'Station 1'], ['FaCog', 'Station 2'], ['FaCog', 'Station 3'], ['FaSearch', 'Inspector']];
  const bx = (i) => x0 + i * (bw + gap);
  for (let i = 0; i < 4; i++) {
    const x = bx(i), insp = i === 3;
    fac.push(box(d, s, x, by, bw, bh, { fill: insp ? TINT.red : HEX.card, line: insp ? HEX.red : HEX.line }));
    fac.push(await ic(d, s, st[i][0], insp ? HEX.red : HEX.muted, x + 0.2, by + 0.22, 0.45));
    fac.push(d.text(s, st[i][1], { x: x + 0.78, y: by, w: bw - 0.88, h: bh, fontSize: 20, bold: true, color: insp ? HEX.red : HEX.text, valign: 'middle' }));
    if (i < 3) fac.push(seg(d, s, x + bw + 0.08, by + bh / 2, x + bw + gap - 0.08, by + bh / 2, { color: HEX.steel, width: 2, arrow: true }));
  }
  // click 1: the inspector's stamp
  const stamp = [box(d, s, bx(3) + 0.85, by - 0.4, 1.6, 0.56, { fill: HEX.red, line: 'FFFFFF', lw: 2, radius: 0.04, rotate: -8 }),
    d.text(s, 'DEFECT!', { x: bx(3) + 0.85, y: by - 0.4, w: 1.6, h: 0.56, fontSize: 22, bold: true, color: 'FFFFFF', fontFace: 'Arial', align: 'center', valign: 'middle', rotate: -8 })];
  // click 2: blame passed back, station 3 → 2 → 1, with how much each one gets
  const ay = by + bh + 0.3, blame = [];
  for (let i = 3; i > 0; i--) blame.push({ name: seg(d, s, bx(i) + bw * 0.35, ay, bx(i - 1) + bw * 0.65, ay, { color: HEX.red, width: 3.5, arrow: true }), delay: (3 - i) * 420 });
  [['a little', 0.4], ['some', 1.0], ['a lot', 1.7]].forEach(([t, len], i) => {
    const yb = ay + 0.24;
    blame.push({ name: rect(d, s, bx(i) + 0.1, yb, len, 0.32, HEX.red), delay: (2 - i) * 420 + 200, effect: 'wipeLeft' });
    blame.push({ name: d.text(s, t, { x: bx(i) + 0.18 + len, y: yb - 0.04, w: bw - len - 0.1, h: 0.4, fontSize: 18, bold: true, color: HEX.red, valign: 'middle' }), delay: (2 - i) * 420 + 300 });
  });
  // the network version (shown with click 3)
  const nl = label(d, s, 'IN A NEURAL NETWORK', MX, 3.88, 6, { color: d.S.amber, size: 14 });
  const xs = [1.3, 2.9, 4.5, 6.1], dia = 0.3;
  const net = drawNet(d, s, { xs, cy: 5.3, gap: 0.42, layers: [3, 4, 4, 2], dia, lw: [0.5, 1.5] });
  const wrong = oval(d, s, xs[3] - dia / 2, net.pos[3][1].y - dia / 2, dia, dia, HEX.red, HEX.red);
  const outT = [
    d.text(s, 'answer: “cat”', { x: xs[3] + 0.3, y: net.pos[3][0].y - 0.22, w: 1.7, h: 0.4, fontSize: 16, color: HEX.muted, valign: 'middle' }),
    d.text(s, 'said “dog”', { x: xs[3] + 0.3, y: net.pos[3][1].y - 0.18, w: 1.7, h: 0.4, fontSize: 16, bold: true, color: HEX.red, valign: 'middle' }),
  ];
  const netArrows = [];
  for (let i = 3; i > 0; i--) netArrows.push({ name: seg(d, s, xs[i] - 0.15, 4.4, xs[i - 1] + 0.15, 4.4, { color: HEX.red, width: 3.5, arrow: true }), delay: (3 - i) * 380, effect: 'wipeLeft' });
  const rx = 8.0, rw = W - MX - rx;
  const one = d.text(s, 'One backward sweep tells every dial which way to turn.', { x: rx, y: 3.95, w: rw, h: 0.9, fontSize: 20, bold: true, color: HEX.text, valign: 'top' });
  const hist = [await ic(d, s, 'FaBookOpen', HEX.steel, rx, 5.0, 0.32),
    d.text(s, 'Popularized in 1986 (a Nature paper)', { x: rx + 0.44, y: 4.97, w: rw - 0.44, h: 0.38, fontSize: 16, color: d.S.steel, valign: 'middle' })];
  const qy = 5.62, qh = 0.82;
  const askBox = [box(d, s, rx, qy, rw, qh, { fill: HEX.card2, line: HEX.red })];
  askBox.push(...await beatLine(d, s, { text: 'HANDS UP', iconName: 'FaHandPaper', q: 'Why not test each dial one at a time?', x: rx + 0.14, y: qy, w: rw - 0.24, h: qh, qSize: 18 }));
  src(d, s, 'Rumelhart, Hinton & Williams, “Learning representations by back-propagating errors”, Nature, Oct 1986');
  d.animate(s, fac, { auto: true, effect: 'fade' });
  d.animate(s, stamp, { effect: 'slam', dur: 350 });
  d.animate(s, blame, { effect: 'fade', dur: 350 });
  d.animate(s, [nl, ...net.lines, ...net.nodes.flat(), wrong, ...outT, ...netArrows.map((o) => ({ ...o, delay: o.delay + 500 })), one, ...hist, ...askBox], { effect: 'fade', dur: 400 });
  notes(s, {
    min: '1.5 (IF RUNNING LONG: skip the hands-up; ask it and answer it yourself)',
    build: 'The factory line shows automatically. Click 1: the inspector stamps “DEFECT!”. Click 2: the blame is passed back, station 3 to 2 to 1, with how much each station gets (a lot, some, a little). Click 3: the same thing in a neural network (the red arrows sweep back layer by layer), the one-line summary, the 1986 paper and the hands-up question.',
    say: 'The hiker needs to know which way is downhill for every dial. How does the computer find that out? Picture a factory line: three stations, then an inspector at the end. [Click.] The inspector finds a defect. [Click.] To fix it, the blame is passed back down the line: station 3 caused a lot of it, station 2 some, station 1 a little. Each station now knows how much to change. [Click.] A neural network does the same. It said “dog”, but the answer was “cat”. The mistake is sent backward through the network, layer by layer, and every dial learns how much it added to the mistake, and which way to turn. That is backpropagation, “backprop” for short. The clever part: one backward sweep covers billions of dials at once. It was popularized in 1986 by David Rumelhart, Geoffrey Hinton and Ronald Williams. Hands up: why not just test each dial one at a time? [Take one answer.] Right: with billions of dials, that would take forever.',
    analogy: 'A factory line where the final inspector passes the blame back to each station: a lot, some, a little.',
    terms: 'backpropagation (backprop: sending the blame for a mistake backwards through the layers, so every dial learns which way to turn), error (the mistake).',
    ask: 'On the slide: “Why not test each dial one at a time?” Format: hands up, take one answer (about 20 seconds). Expected: with billions of dials it would take forever.',
    takeaway: 'Backpropagation works out, in one backward sweep, how much each dial added to a mistake and which way to turn it.',
    advanced: 'If asked: it is a rule from calculus for passing blame through a chain of steps, applied layer by layer from the output back to the input. 3Blue1Brown’s chapters 3 and 4 show it step by step, with pictures.',
    caveats: 'The arrows and the blame bars (a lot, some, a little) are a drawing, not real values.',
    sources: ['https://www.nature.com/articles/323533a0 (Rumelhart, Hinton & Williams, Nature 323, 533–536, Oct 1986)', 'https://www.youtube.com/watch?v=Ilg3gGewQ5U (3Blue1Brown, “Backpropagation, intuitively”)'],
  });
  return s;
}

// PART 1 · 9  Text AI: left to right, one word at a time
async function nextWordSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(9));
  title(s, 'Text AI writes left to right, a word at a time');
  const bw = 1.78, bh = 0.84, bg = 0.25, by = 1.72;
  const bxs = (i) => MX + i * (bw + bg);
  const words = ['The', 'cat', 'sat', 'on', 'the'];
  const wbox = (i, t, { fill = HEX.card, line = HEX.steel, color = HEX.text, dash } = {}) => [
    box(d, s, bxs(i), by, bw, bh, { fill, line, lw: 1.5, dash }),
    d.text(s, t, { x: bxs(i), y: by, w: bw, h: bh, fontSize: 28, bold: true, color, fontFace: 'Arial', align: 'center', valign: 'middle' }),
  ];
  const first = wbox(0, words[0]);
  const blank = wbox(5, '?', { fill: TINT.amber, line: HEX.amber, color: HEX.amber, dash: 'dash' });
  const more = [];
  for (let i = 1; i < 5; i++) more.push(...wbox(i, words[i]).map((name) => ({ name, delay: (i - 1) * 380 })));
  const ax0 = MX, ax1 = bxs(5) + bw;
  const arrow = [seg(d, s, ax0, by + bh + 0.22, ax1, by + bh + 0.22, { color: HEX.red, width: 3, arrow: true }),
    d.text(s, [{ text: 'LEFT TO RIGHT: ', options: { bold: true, color: HEX.red, charSpacing: 1 } }, { text: 'each word is guessed from all the words before it', options: { color: HEX.text } }], { x: ax0, y: by + bh + 0.3, w: ax1 - ax0, h: 0.4, fontSize: 18, valign: 'middle' })];
  // click 2: the model's scores for the next word (made-up example)
  const top = 3.42;
  const barL = [label(d, s, 'IT SCORES EVERY POSSIBLE NEXT WORD', MX, top, 4.6, { size: 14 }), label(d, s, 'MADE-UP EXAMPLE', MX + 4.6, top, 2.2, { color: d.S.amber, align: 'right', size: 12 })];
  const sc = [['mat', 4.7], ['floor', 2.7], ['sofa', 1.8], ['moon', 0.22], ['pizza', 0.14]];
  const bars = [];
  sc.forEach(([wd, len], i) => {
    const y = top + 0.42 + i * 0.47, isTop = i === 0;
    bars.push({ name: d.text(s, wd, { x: MX, y, w: 1.1, h: 0.38, fontSize: 20, bold: isTop, color: isTop ? d.S.red : HEX.text, valign: 'middle' }), delay: i * 120 });
    bars.push({ name: rect(d, s, MX + 1.2, y + 0.04, len, 0.3, isTop ? HEX.red : HEX.steel), delay: i * 120, effect: 'wipeLeft' });
  });
  const rx = 7.75, rw = W - MX - rx;
  const ask = await beatLine(d, s, { text: 'HANDS UP', iconName: 'FaHandPaper', q: 'The cat sat on the ___: mat, moon or pizza?', x: rx, y: top + 0.05, w: rw, h: 0.8, qSize: 18 });
  const tokY = 5.25;
  const tok = [label(d, s, 'IT READS TEXT IN CHUNKS (TOKENS)', rx, tokY, rw, { size: 14 })];
  ['un', 'believ', 'able'].forEach((t, i) => {
    const x = rx + [0, 0.78, 1.95][i], w = [0.7, 1.08, 0.9][i];
    tok.push(box(d, s, x, tokY + 0.4, w, 0.46, { fill: ['1E3A5F', '3A2A12', '2A1416'][i], line: [HEX.blue, HEX.amber, HEX.red][i], radius: 0.05 }));
    tok.push(d.text(s, t, { x, y: tokY + 0.4, w, h: 0.46, fontSize: 18, bold: true, color: HEX.text, align: 'center', valign: 'middle', fontFace: 'Courier New' }));
  });
  tok.push(d.text(s, '(one possible split)', { x: rx + 2.98, y: tokY + 0.4, w: rw - 2.98, h: 0.46, fontSize: 14, color: d.S.steel, valign: 'middle' }));
  // click 3: "mat" lands in the empty box; the text was its own answer key
  const mat = wbox(5, 'mat', { fill: HEX.red, line: HEX.red, color: 'FFFFFF' });
  const self = [box(d, s, rx, 4.3, rw, 0.86, { fill: TINT.teal, line: HEX.teal, lw: 1.25 }),
    d.text(s, [{ text: 'The text is its own answer key:', options: { color: HEX.text, breakLine: true } }, { text: 'self-supervised', options: { color: HEX.teal, bold: true } }, { text: ', a kind of unsupervised', options: { color: HEX.muted, fontSize: 16 } }], { x: rx + 0.18, y: 4.3, w: rw - 0.26, h: 0.86, fontSize: 18, valign: 'middle' })];
  src(d, s, 'Bars: a made-up example, not real model scores · how chatbots write: next-token prediction (OpenAI, Microsoft docs)');
  d.animate(s, [...first, ...blank, ...arrow, ...tok], { auto: true, effect: 'fade' });
  d.animate(s, more, { effect: 'wipeLeft', dur: 350 });
  d.animate(s, [...barL, ...bars, ...ask], { effect: 'fade', dur: 400 });
  d.animate(s, [...mat.map((name) => ({ name, effect: 'zoom', dur: 450 })), ...self.map((name) => ({ name, delay: 500 }))], { effect: 'fade' });
  notes(s, {
    min: '1.75',
    build: '“The”, the empty box, the left-to-right arrow and the token chips show automatically. Click 1: “cat sat on the” appear, one word after another. Click 2: the scores for the next word (made-up example) and the hands-up question. Click 3: “mat” lands in the empty box, and “the text is its own answer key: self-supervised, a kind of unsupervised”.',
    say: 'Now: how does a chatbot write? It runs on a large language model, an LLM for short: a neural network trained on huge amounts of text to guess the next word. It writes left to right, one word at a time. [Click.] The… cat… sat… on… the… Each new word is guessed from all the words before it. Researchers call this autoregressive, which just means left to right, each piece built on the pieces before it. [Click.] For every possible next word, it gives a score. This is a made-up example, so the bars only show the idea. Hands up: the cat sat on the… mat? Moon? Pizza? [Count roughly.] [Click.] Mat! You just did what the model does. And notice where the answer key came from: the text itself. Hide the next word, guess it, check it against the real text. Nobody had to write labels. That is called self-supervised learning: one kind of the unsupervised learning from slide 7, where the data makes its own answer key. It is the big idea for the next few slides. One detail: models read text in chunks called tokens, often a whole word, sometimes a piece, like “un”, “believ”, “able”.',
    analogy: 'Autocomplete on your phone, scaled up enormously: trained on far more text and far better at it.',
    terms: 'LLM (large language model: a neural network trained on huge amounts of text to predict the next token; said here, first use), token (a chunk of text, often a word or part of one), autoregressive (said once: left to right, each word guessed from the words before it), self-supervised learning (the data is its own answer key).',
    ask: 'On the slide: “The cat sat on the ___: mat, moon or pizza?” Hands up for each, before click 3. Expected: mostly mat; a few jokers say pizza (good: the model sometimes picks less likely words too, which is why answers vary).',
    takeaway: 'A chatbot writes left to right, one token at a time, and learns by guessing the next word of real text: the text is its own answer key.',
    advanced: 'Models do not always pick the top word; they sample, so the same question can get different answers. Anthropic (Mar 27, 2025) found Claude plans ahead: before writing the second line of a rhyming poem, it had already picked the rhyme word (“rabbit”). OpenAI’s rule of thumb: one token is about three-quarters of an English word on average (it varies by model and language).',
    caveats: 'The bars are a made-up example (labelled on the slide), not real model scores. “un / believ / able” is one possible split; real tokenizers differ. Experts disagree on whether next-word prediction amounts to “understanding” (callback to the opening poll).',
    sources: ['https://help.openai.com/en/articles/4936856-understanding-and-counting-tokens', 'https://learn.microsoft.com/agent-framework/journey/llm-fundamentals (“A large language model is a neural network trained on massive amounts of text data to predict the next token in a sequence.”)', 'https://www.anthropic.com/research/tracing-thoughts-language-model', 'https://arxiv.org/abs/2111.06377 (MAE: GPT-style models as self-supervised pre-training)'],
  });
  return s;
}

// PART 1 · 10  Image AI: start from static and clean it up (diffusion)
async function diffusionSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  kicker(s, K(10));
  title(s, 'Image AI starts from static and cleans it up');
  const real = have(D('ddim_01.jpg'));
  const files = real ? DDIM_STEPS.map((n) => D(`ddim_${String(n).padStart(2, '0')}.jpg`)) : DDIM_STEPS.map((n, i) => D(`illus_${i}.png`));
  const nat = await imgSize(files[0]), a = nat.w / nat.h;
  const PH = 2.45, pw = Math.min(2.2, PH * a), ph = pw / a, gap = (W - 2 * MX - 5 * pw) / 4, py = 1.6;
  const px = (i) => MX + i * (pw + gap);
  const panels = [];
  for (let i = 0; i < 5; i++) {
    const g = await d.frame(s, files[i], { x: px(i), y: py, w: pw, h: ph }, { pad: 0.04 });
    const n = DDIM_STEPS[i];
    g.push(d.text(s, `${n} step${n > 1 ? 's' : ''}`, { x: px(i) - 0.2, y: py + ph + 0.03, w: pw + 0.4, h: 0.32, fontSize: 18, bold: true, color: i === 4 ? HEX.amber : HEX.muted, align: 'center', valign: 'top' }));
    if (i < 4 && gap > 0.3) g.push(await ic(d, s, 'FaChevronRight', HEX.steel, px(i) + pw + (gap - 0.26) / 2, py + ph / 2 - 0.13, 0.26));
    panels.push(g);
  }
  const ay = py + ph + 0.46;
  const arrow = [seg(d, s, MX, ay, W - MX, ay, { color: HEX.amber, width: 3, arrow: true }),
    d.text(s, [{ text: 'From static to a picture: ', options: { bold: true, color: HEX.amber } }, { text: 'clean up a little, again and again', options: { color: HEX.text } }], { x: MX, y: ay + 0.06, w: W - 2 * MX, h: 0.42, fontSize: 20, valign: 'middle', align: 'center' })];
  // the guess sits where the comparison cards land on click 3 (the opaque cards cover it)
  const cy = ay + 0.54, chh = 1.1, cg = 0.22, cw = (W - 2 * MX - 2 * cg) / 3;
  const guess = await beatLine(d, s, { text: 'GUESS FIRST', iconName: 'FaQuestionCircle', q: 'When does the castle appear: after 3, 8 or 20 steps? Show 1, 2 or 3 fingers.', x: MX + 0.1, y: cy + (chh - 0.52) / 2, w: W - 2 * MX - 0.2, h: 0.52, qSize: 20 });
  const cmp = [rect(d, s, MX - 0.05, cy - 0.05, W - 2 * MX + 0.1, chh + 0.1, '08090D')];
  cmp.push(box(d, s, MX, cy, cw, chh, { fill: HEX.card, line: HEX.blue, lw: 1.25 }));
  cmp.push(d.text(s, [{ text: 'TEXT: ', options: { bold: true, color: HEX.blue } }, { text: 'left to right', options: { bold: true, color: HEX.text } }], { x: MX + 0.2, y: cy + 0.06, w: cw - 0.3, h: 0.42, fontSize: 18, valign: 'middle' }));
  ['The', 'cat', 'sat', 'on'].forEach((t, i) => {
    const x = MX + 0.2 + i * 0.86;
    cmp.push(box(d, s, x, cy + 0.54, 0.78, 0.44, { fill: HEX.card2, line: HEX.blue, radius: 0.05 }));
    cmp.push(d.text(s, t, { x, y: cy + 0.54, w: 0.78, h: 0.44, fontSize: 16, bold: true, color: HEX.text, align: 'center', valign: 'middle' }));
    if (i < 3) cmp.push(seg(d, s, x + 0.79, cy + 0.76, x + 0.85, cy + 0.76, { color: HEX.blue, width: 1.5 }));
  });
  // a mini "before → after" pair inside a card: two small framed pictures and an arrow, on the card's right
  const pair = async (x1, f1, w1, f2, w2, mh, color) => {
    const m2 = x1 - 0.2 - w2, m1 = m2 - 0.5 - w1, my = cy + (chh - mh) / 2, g = [];
    g.push(...await d.frame(s, f1, { x: m1, y: my, w: w1, h: mh }, { pad: 0.02, shadow: false }));
    g.push(seg(d, s, m1 + w1 + 0.07, cy + chh / 2, m2 - 0.07, cy + chh / 2, { color, width: 2.5, arrow: true }));
    g.push(...await d.frame(s, f2, { x: m2, y: my, w: w2, h: mh }, { pad: 0.02, shadow: false }));
    g.m1 = m1;
    return g;
  };
  const c2 = MX + cw + cg;
  cmp.push(box(d, s, c2, cy, cw, chh, { fill: HEX.card, line: HEX.amber, lw: 1.25 }));
  const p2 = await pair(c2 + cw, files[0], 0.9 * a, files[4], 0.9 * a, 0.9, HEX.amber);
  cmp.push(d.text(s, [{ text: 'IMAGES: ', options: { bold: true, color: HEX.amber, breakLine: true } }, { text: 'from static, cleaned up', options: { bold: true, color: HEX.text } }], { x: c2 + 0.18, y: cy, w: p2.m1 - c2 - 0.25, h: chh, fontSize: 18, valign: 'middle' }));
  cmp.push(...p2);
  // the training game, the other way round: a real photo gets static added (ImageNet photo; the static square is ours)
  const c3 = c2 + cw + cg;
  cmp.push(box(d, s, c3, cy, cw, chh, { fill: TINT.teal, line: HEX.teal, lw: 1.25 }));
  const p3 = await pair(c3 + cw, D('in_leopard.png'), 0.9, D('noise_square.png'), 0.68, 0.68, HEX.teal);
  cmp.push(d.text(s, [{ text: 'PRACTICE: ', options: { bold: true, color: HEX.teal, breakLine: true } }, { text: 'add static, then undo it', options: { bold: true, color: HEX.text } }], { x: c3 + 0.18, y: cy, w: p3.m1 - c3 - 0.22, h: chh, fontSize: 17, valign: 'middle' }));
  cmp.push(...p3);
  cmp.push(d.text(s, 'Usually, not always: some text AIs use diffusion, and some image AIs go left to right.', { x: MX, y: cy + chh + 0.05, w: W - 2 * MX, h: 0.32, fontSize: 16, color: HEX.text, align: 'center', valign: 'middle' }));
  src(d, s, real
    ? 'Castle: Benlisquare, X-Y plot of DDIM diffusion steps (Stable Diffusion v1-5), CC BY-SA 4.0, Wikimedia Commons (cropped) · leopard: ImageNet · static square: ours'
    : 'Illustration, not a real model run: static faded into a photo by us');
  if (!real) panels[0].push(...chip(d, s, 'ILLUSTRATION, NOT A REAL MODEL RUN', px(0) + 0.12, py + 0.12, 3.9, HEX.amber, { h: 0.34, fontSize: 12, color: HEX.ink }));
  d.animate(s, [...panels[0], ...guess], { auto: true, effect: 'fade' });
  d.animate(s, [...panels[1].map((name) => ({ name })), ...panels[2].map((name) => ({ name, delay: 150 }))], { effect: 'fade', dur: 450 });
  d.animate(s, [...panels[3].map((name) => ({ name })), ...panels[4].map((name) => ({ name, delay: 150 })), ...arrow.map((name) => ({ name, delay: 400, effect: 'wipeLeft' }))], { effect: 'fade', dur: 450 });
  d.animate(s, cmp, { effect: 'rise' });
  notes(s, {
    min: '1.5 (IF RUNNING LONG: skip the finger vote and click straight through)',
    build: 'The 1-step picture and the GUESS FIRST question show automatically. Click 1: the 3-step and 8-step pictures. Click 2: the 20-step and 40-step pictures and the “from static to a picture” arrow. Click 3: three cards cover the question (text: left to right; images: from static, cleaned up; practice: add static to a real photo, learn to undo it) and the “usually, not always” line.',
    say: 'Text AI writes left to right. Image AI works a different way: it starts from static, like an old TV with no signal, and cleans it up a little at a time. Each clean-up pass is called a step. This picture got just 1 step. Guess first: when does the castle appear? After 3 steps, hold up 1 finger; after 8, 2 fingers; after 20, 3 fingers. [Scan the room and say the majority, about 10 seconds.] [Click.] 3 steps… 8 steps… [Click.] …20… 40. A castle in Japan, which never existed. Each step removes a little static, again and again, and a picture appears. This is called diffusion. [Click.] So: text usually goes left to right, a word at a time; images usually start from static and get cleaned up. Usually, not always: some text AIs use the static trick, and some image AIs go left to right. And the third card: how does it learn to clean up? In training, it takes real photos, like this leopard, adds static on purpose, and practises removing it. The real photo is the answer key, so it is self-supervised again: the sponge of LeCun’s cake, next.',
    analogy: 'Wiping fog off a window, a little each pass; or a sculptor removing everything that isn’t the statue.',
    terms: 'diffusion (making a picture by starting from static and removing a little at a time), denoising (removing static), step (one clean-up pass).',
    ask: 'On the slide (GUESS FIRST): “When does the castle appear: after 3, 8 or 20 steps? Show 1, 2 or 3 fingers.” A finger vote, about 10 seconds, before click 1 (no shouting: 200 voices take too long). Expected: a spread; the outline shows up within a few steps (by 8 it is clearly a castle), the details last.',
    takeaway: 'Text AI usually writes left to right; image AI usually starts from static and cleans it up, step by step.',
    advanced: 'The training game: add static to real photos, then learn to undo it. A picture of that direction (a rhino photo, more static each step): https://commons.wikimedia.org/wiki/File:Example_of_Forward_Diffusion_Models.png (MrAlanKoh, CC BY-SA 4.0; notes only). Mixed and swapped methods: Google DeepMind’s Gemini Diffusion (May 20, 2025) is a research text model that “learns to generate outputs by converting random noise into coherent text or code”. OpenAI (Mar 25, 2025): “Unlike DALL·E, which operates as a diffusion model, 4o image generation is an autoregressive model natively embedded within ChatGPT.” Transfusion (Aug 2024) trains one model to predict the next token for text and to diffuse images. (Inception’s Mercury text-diffusion models and their speed figures are the company’s own claims; leave them out or label them.)',
    caveats: 'EACH PANEL IS A SEPARATE RUN made with that many clean-up steps (same prompt), NOT frames of one run: say “this picture got 3 steps”, not “after 3 steps of the 40”. The panels are cropped from a real Stable Diffusion v1-5 X-Y plot by its maker (Wikimedia Commons, CC BY-SA 4.0); the step labels are re-typed under each panel. The prompt asked for “a european castle in japan” in a painter’s style, so this is a made-up scene by design.',
    sources: ['https://commons.wikimedia.org/wiki/File:X-Y_plot_of_algorithmically-generated_AI_art_of_European-style_castle_in_Japan_demonstrating_DDIM_diffusion_steps.png (Benlisquare, CC BY-SA 4.0)', 'https://blog.google/innovation-and-ai/models-and-research/google-deepmind/gemini-diffusion/', 'https://cdn.openai.com/11998be9-5319-4302-bfbf-1167e093f1fb/Native_Image_Generation_System_Card.pdf', 'https://arxiv.org/abs/2408.11039 (Transfusion)', 'https://commons.wikimedia.org/wiki/File:Example_of_Forward_Diffusion_Models.png (MrAlanKoh, CC BY-SA 4.0; notes only)'],
  });
  return s;
}

// PART 1 · 16  CPU vs GPU
async function gpuSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(16));
  title(s, 'A GPU does thousands of simple sums at once');
  const cy = 1.62, chh = 3.46, lw = (W - 2 * MX - 0.35) / 2, rx = MX + lw + 0.35, G = 2.2, ly = cy + 2.62;
  // left: the CPU
  const L = [box(d, s, MX, cy, lw, chh, { fill: HEX.card, line: HEX.line })];
  L.push(...await d.frame(s, RN('cpu-ryzen-9-9950x.jpg'), { x: MX + 0.25, y: cy + 0.2, w: 2.3, h: 2.3 }, { pad: 0.03 }));
  const gx = MX + lw - 0.3 - G, gy = cy + 0.2, sq = (G - 3 * 0.12) / 4;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) L.push(box(d, s, gx + c * (sq + 0.12), gy + r * (sq + 0.12), sq, sq, { fill: HEX.amber, line: HEX.amber, lw: 0, radius: 0.04 }));
  L.push(d.text(s, 'CPU: 16 cores', { x: MX + 0.25, y: ly, w: 3.6, h: 0.46, fontSize: 26, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'middle' }));
  L.push(d.text(s, 'a few strong workers (AMD Ryzen 9 9950X)', { x: MX + 0.25, y: ly + 0.46, w: lw - 0.4, h: 0.32, fontSize: 16, color: HEX.muted, valign: 'middle' }));
  // right: the guess, then (click 1) the answer card on top
  const Q = [box(d, s, rx, cy, lw, chh, { fill: HEX.card2, line: HEX.red, lw: 1.25 })];
  Q.push(...await beatLine(d, s, { text: 'GUESS FIRST', iconName: 'FaQuestionCircle', q: 'How many cores in one AI chip (a GPU)?', x: rx + 0.2, y: cy + 0.3, w: lw - 0.4, h: 0.8, qSize: 20 }));
  ['A: 16', 'B: 1,600', 'C: 16,000'].forEach((t, i) => {
    const bw = (lw - 0.4 - 2 * 0.2) / 3, x = rx + 0.2 + i * (bw + 0.2);
    Q.push(box(d, s, x, cy + 1.4, bw, 1.2, { fill: TINT.amber, line: HEX.amber, lw: 1.25 }));
    Q.push(d.text(s, t, { x, y: cy + 1.4, w: bw, h: 1.2, fontSize: 26, bold: true, color: HEX.text, fontFace: 'Arial', align: 'center', valign: 'middle' }));
  });
  Q.push(d.text(s, 'Hint: GPUs were first built for video-game graphics.', { x: rx + 0.2, y: cy + 2.8, w: lw - 0.4, h: 0.42, fontSize: 18, italic: true, color: HEX.muted, valign: 'middle' }));
  const A_ = [box(d, s, rx, cy, lw, chh, { fill: HEX.card, line: HEX.line })];
  if (have(D('h100_card.jpg'))) {
    // a light mat behind the photo, so the dark card reads against the dark slide
    A_.push(...await d.frame(s, D('h100_card.jpg'), { x: rx + 0.18, y: cy + 0.2, w: 1.8, h: 1.6 }, { pad: 0.1, align: 'left', frameColor: 'E9ECF1' }));
    A_.push(d.text(s, 'an H100 card (PCIe version)', { x: rx + 0.18, y: cy + 1.86, w: 1.85, h: 0.56, fontSize: 14, italic: true, color: HEX.muted, valign: 'top' }));
  }
  else A_.push(await ic(d, s, 'PiGraphicsCardFill', HEX.muted, rx + 0.2, cy + 0.3, 1.5));
  const fx = rx + lw - 0.3 - G, fy = cy + 0.2;
  A_.push(...await d.frame(s, D('gpu_dots_16896.png'), { x: fx, y: fy, w: G, h: G }, { border: false, shadow: false }));
  // zoom: the top-left corner of the field, drawn large, so every core is visible
  const zb = d.name('zoombox');
  s.addShape(d.pres.shapes.RECTANGLE, { x: fx - 0.03, y: fy - 0.03, w: 0.16, h: 0.16, fill: { color: HEX.text, transparency: 100 }, line: { color: HEX.text, width: 1.5 }, objectName: zb });
  A_.push(zb);
  const zs = 0.9, zx = fx - 0.2 - zs, zy = cy + 0.42;
  A_.push(seg(d, s, fx - 0.03, fy + 0.13, zx + zs + 0.03, zy, { color: HEX.text, width: 1.25 }));
  A_.push(...await d.frame(s, D('gpu_dots_zoom.png'), { x: zx, y: zy, w: zs, h: zs }, { pad: 0.03, shadow: false }));
  A_.push(d.text(s, 'zoomed in: one square, one core', { x: zx - 0.12, y: zy + zs + 0.08, w: zs + 0.24, h: 0.78, fontSize: 14, color: HEX.muted, align: 'center', valign: 'top' }));
  A_.push(d.text(s, 'GPU: 16,896 cores', { x: rx + 0.25, y: ly, w: 3.6, h: 0.46, fontSize: 26, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'middle' }));
  A_.push(...chip(d, s, 'C WAS RIGHT', rx + lw - 0.3 - 1.62, ly + 0.05, 1.62, HEX.red, { h: 0.38, fontSize: 14 }));
  A_.push(d.text(s, 'thousands of simple workers (NVIDIA H100)', { x: rx + 0.25, y: ly + 0.46, w: lw - 0.4, h: 0.32, fontSize: 16, color: HEX.muted, valign: 'middle' }));
  // click 2: MythBusters paintball demo (NVIDIA's event, 2008)
  const py = 5.2, ph = 0.98;
  const P = [box(d, s, MX, py, W - 2 * MX, ph, { fill: HEX.card, line: HEX.line })];
  P.push(box(d, s, MX + 0.2, py + ph / 2 - 0.12, 0.5, 0.24, { fill: HEX.steel, line: HEX.steel, lw: 0, radius: 0.04 }));
  for (let k = 0; k < 3; k++) P.push(oval(d, s, MX + 0.78 + k * 0.12, py + ph / 2 - 0.03, 0.06, 0.06, HEX.red, HEX.red, 0));
  const sm = [], fcx = MX + 1.58, fcy = py + ph / 2, fr = 0.36;
  for (let k = 0; k < 16; k++) { const t = (k / 16) * 2 * Math.PI; sm.push([fcx + fr * Math.cos(t), fcy + fr * Math.sin(t)]); }
  sm.push([fcx - 0.13, fcy - 0.1], [fcx + 0.13, fcy - 0.1]);
  for (let k = 0; k <= 6; k++) { const t = Math.PI * (0.2 + 0.6 * k / 6); sm.push([fcx + 0.2 * Math.cos(t), fcy + 0.04 + 0.16 * Math.sin(t)]); }
  for (const [x, y] of sm) P.push(oval(d, s, x - 0.035, y - 0.035, 0.07, 0.07, HEX.red, HEX.red, 0));
  P.push(d.text(s, [{ text: 'One barrel, one dot at a time', options: { bold: true, color: HEX.text, breakLine: true } }, { text: 'like a CPU', options: { color: HEX.amber, bold: true, fontSize: 16 } }], { x: MX + 2.1, y: py, w: 3.6, h: ph, fontSize: 18, valign: 'middle' }));
  const bgx = MX + 6.15;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) P.push(oval(d, s, bgx + c * 0.13, py + 0.18 + r * 0.13, 0.09, 0.09, HEX.steel, HEX.steel, 0));
  P.push(d.text(s, [{ text: '1,100 barrels at once: the Mona Lisa', options: { bold: true, color: HEX.text, breakLine: true } }, { text: 'like a GPU', options: { color: HEX.amber, bold: true, fontSize: 16 } }, { text: '  ·  NVIDIA says it took 80 milliseconds', options: { color: HEX.muted, fontSize: 16 } }], { x: bgx + 1.35, y: py, w: W - MX - bgx - 1.45, h: ph, fontSize: 18, valign: 'middle' }));
  const last = d.text(s, [{ text: 'Training is billions of tiny sums, so thousands of simple workers win. ', options: { bold: true, color: HEX.text } }, { text: '(Each GPU core is much simpler than a CPU core.)', options: { color: HEX.muted } }], { x: MX, y: 6.2, w: W - 2 * MX, h: 0.4, fontSize: 16, valign: 'middle' });
  src(d, s, `Cores: AMD; NVIDIA (H100 SXM5) · photos: 4300streetcar, CC BY 4.0${have(D('h100_card.jpg')) ? '; Geekerwan, CC BY 3.0 (cropped)' : ''}, Wikimedia Commons · paintball: MythBusters for NVIDIA, 2008 (bit-tech)`);
  d.animate(s, [...L, ...Q], { auto: true, effect: 'fade' });
  d.animate(s, A_, { effect: 'fade', dur: 500 });
  d.animate(s, P, { effect: 'rise' });
  d.animate(s, [last], { effect: 'fade' });
  notes(s, {
    min: '2.5',
    build: 'The CPU card and the GUESS FIRST question (A 16, B 1,600, C 16,000) show automatically. Click 1: the GPU answer card covers the question (16,896 dots, one per core, with a zoomed corner and “C was right”). Click 2: the MythBusters paintball strip. Click 3: “training is billions of tiny sums”.',
    say: 'All this training runs on chips. The chip in your laptop is a CPU, the computer’s main brain. This one, a fast desktop CPU, has 16 cores: 16 strong workers, each able to do almost anything, one step after another. An AI chip is called a GPU; GPUs were first made for video-game graphics. Guess first: how many cores in one AI chip? A, 16. B, 1,600. C, 16,000. Hands up! [Count roughly.] [Click.] C: NVIDIA’s H100 has 16,896. Every dot on the right is one core, about a thousand times as many as the CPU. There are so many that from the back of the room they blur together; the square in the middle zooms into one corner, where you can see single cores. [Click.] Here is the best demo, made for NVIDIA in 2008 by the MythBusters. A small robot fired paintballs one at a time to paint a smiley face: that is the CPU way. Then a machine with 1,100 barrels fired them all at once and painted the Mona Lisa: NVIDIA says it took 80 milliseconds. [Click.] Training is billions of tiny sums, multiply and add, over and over, so thousands of simple workers win: think of a stadium full of students each doing one easy sum at the same moment. But each GPU core is much simpler than a CPU core: it is not a thousand times faster at everything.',
    analogy: 'A few professors (CPU) versus a stadium full of students who can each only do simple sums, but all at the same moment (GPU). And the MythBusters paintball demo: one barrel versus 1,100.',
    terms: 'CPU (the computer’s main chip: a few strong cores), GPU (graphics processing unit: thousands of simple cores; built for games, now used for AI), core (one worker inside a chip).',
    ask: 'On the slide (GUESS FIRST): “How many cores in one AI chip (a GPU)?” Hands up for A (16), B (1,600) or C (16,000). Answer: C, 16,896 for the H100 (SXM version).',
    takeaway: 'A GPU has thousands of simple workers doing sums at the same time, which is exactly what training needs.',
    advanced: '“About a thousand times as many cores” is our division (16,896 against 16). NVIDIA’s H100 SXM5: 132 streaming multiprocessors with 128 cores each, so the dot field is drawn as 132 columns by 128 rows. It also has 528 special “Tensor Cores” built for exactly the multiply-and-add sums that neural networks use. Many H100s are wired together to train one model (next slide).',
    caveats: 'More cores does not mean “1,000 times faster” at everything: each GPU core is much simpler and slower than a CPU core, and many jobs cannot be split up. The 16,896 count is NVIDIA’s figure for the H100 SXM5 (the server version); the card in the photo is the PCIe version, which NVIDIA lists with 14,592, so both round to “C”. The 1,100 barrels are from bit-tech’s report of the event; “80 ms” is NVIDIA’s own NVISION page (another outlet reported a different time). THE VIDEO IS OPTIONAL AND NOT EMBEDDED: we found only third-party re-uploads, none on NVIDIA’s own channel, and could not read their running times: https://www.youtube.com/watch?v=ZrJeYFxpUyQ , https://www.youtube.com/watch?v=fKK933KK6Gg , https://www.youtube.com/watch?v=WmW6SD-EHVY . If you want to show one, watch it first, write down the start and end seconds of the smiley and Mona Lisa rounds, and take the time out of this slide’s 2.5 minutes.',
    sources: ['https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-9-9950x.html (16 cores)', 'https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/ (H100 SXM5: 16,896 FP32 CUDA cores; PCIe: 14,592)', 'https://www.bit-tech.net/news/mythbusters-finish-nvision-in-style/1 (1,100 barrels)', 'https://www.nvidia.com/content/nvision2008/ (“painted the Mona Lisa in 80ms”)', 'https://commons.wikimedia.org/wiki/File:AMD_Ryzen_9_9950X.jpg (4300streetcar, CC BY 4.0)', 'https://commons.wikimedia.org/wiki/File:NVIDIA_H100_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_011.png (Geekerwan, CC BY 3.0)'],
  });
  return s;
}

// PART 1 · 17  Why Nvidia is so hard to beat
async function nvidiaSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  kicker(s, K(17));
  title(s, 'Why Nvidia is so hard to beat in AI chips');
  const hl = await d.frame(s, RN('hl-entrepreneur-nvidia-5t.png'), { x: MX, y: 1.68, w: 6.0, h: 2.5 }, { pad: 0.06, rot: -1 });
  const hcap = d.text(s, 'Entrepreneur, Oct 29, 2025: the first company ever worth $5 trillion', { x: MX, y: hl.geom.y + hl.geom.h + 0.14, w: 6.0, h: 0.32, fontSize: 14, italic: true, color: HEX.muted });
  const ask = [box(d, s, MX, 4.62, 6.0, 1.28, { fill: HEX.card2, line: HEX.red, lw: 1.25 })];
  ask.push(...await beatTag(d, s, 'HANDS UP', 'FaHandPaper', MX + 0.18, 4.74));
  ask.push(d.text(s, 'All your class’s apps run on one brand of chip. A cheaper brand appears. Do you switch?', { x: MX + 0.18, y: 5.12, w: 5.65, h: 0.74, fontSize: 18, bold: true, color: HEX.text, valign: 'middle' }));
  const rx = 7.0, rw = W - MX - rx, th = 1.0;
  const tiles = [
    ['FaMicrochip', HEX.amber, TINT.amber, 'Fast chips', 'Data-center sales: $75.2 billion in one quarter (to Apr 2026), company-reported'],
    ['FaCode', HEX.blue, TINT.blue, 'CUDA software, since 2006–07', 'NVIDIA says 6 million developers use it'],
    ['FaNetworkWired', HEX.teal, TINT.teal, 'The wiring between chips', 'Bought Mellanox (networking), $7 billion, 2020'],
  ];
  const tg = [];
  for (let i = 0; i < 3; i++) {
    const [nm, c, tint, head, body] = tiles[i], y = 1.68 + i * (th + 0.1);
    const g = [box(d, s, rx, y, rw, th, { fill: tint, line: c, lw: 1.25 })];
    g.push(...await iconDisc(d, s, nm, rx + 0.55, y + th / 2, 0.74, c, HEX.card2));
    g.push(d.text(s, [{ text: head, options: { bold: true, color: HEX.text, fontSize: 20, fontFace: 'Arial', breakLine: true } }, { text: body, options: { color: HEX.muted, fontSize: 15 } }], { x: rx + 1.05, y: y + 0.04, w: rw - 1.15, h: th - 0.08, valign: 'middle' }));
    tg.push(g);
  }
  const ry = 5.36;
  const riv = [d.text(s, 'BUT THERE ARE RIVALS', { x: rx, y: ry - 0.4, w: rw, h: 0.34, fontSize: 14, bold: true, color: d.S.steel, charSpacing: 2, valign: 'middle' })];
  const names = ['Google TPU', 'Amazon Trainium', 'AMD', 'Huawei Ascend'], ws = [1.3, 1.72, 0.72, 1.58];
  let x = rx;
  names.forEach((t, i) => { riv.push(...chip(d, s, t, x, ry, ws[i], HEX.card2, { h: 0.42, fontSize: 15, color: HEX.text, charSpacing: 0 })); x += ws[i] + 0.12; });
  riv.push(d.text(s, 'Anthropic plans up to 1 million Google TPUs; OpenAI signed for 6 GW of AMD chips.', { x: rx, y: ry + 0.48, w: rw, h: 0.62, fontSize: 16, color: HEX.text, valign: 'middle' }));
  src(d, s, 'Entrepreneur (Oct 29, 2025) · NVIDIA Q1 FY2027 results (SEC, May 20, 2026) · NVIDIA forum (Mar 18, 2026) · NVIDIA (Apr 27, 2020) · Anthropic (Oct 23, 2025) · AMD (Oct 6, 2025)');
  d.animate(s, [...hl, hcap], { auto: true, effect: 'fade' });
  d.animate(s, tg[0], { effect: 'rise' });
  d.animate(s, [...tg[1], ...ask], { effect: 'rise' });
  d.animate(s, tg[2], { effect: 'rise' });
  d.animate(s, riv, { effect: 'fade' });
  notes(s, {
    min: '2.0',
    build: 'The headline shows automatically. Click 1: fast chips. Click 2: CUDA software, with the HANDS UP question. Click 3: the wiring between chips. Click 4: the rivals.',
    say: 'One company makes most of the chips used to train AI: NVIDIA. In October 2025, a year ago, it became the first company ever worth five trillion dollars; its value moves every day, so treat that as a snapshot. People call it an effective monopoly: not illegal, but very hard to compete with. Nobody publishes an exact share, and outside estimates differ, but they all put NVIDIA far ahead. The point is the three locks. Why? [Click.] One: fast chips. In just three months ending in April this year, NVIDIA says it sold 75 billion dollars of data-center products. [Click.] Two, the big one: software. Since 2006 NVIDIA has built CUDA, the toolkit that programmers use to run code on its chips. NVIDIA says 6 million developers use it, and a lot of AI software is written for it. Hands up: all your class’s apps run on one brand of chip. A cheaper brand appears. Do you switch? [Take hands.] Switching means rewriting and re-testing everything: that is called lock-in. [Click.] Three: the wiring. Training uses thousands of chips that talk to each other constantly, and NVIDIA bought a networking company, Mellanox, to build that wiring. [Click.] But it has rivals: Google’s own TPU chips, Amazon’s Trainium, AMD and Huawei. Anthropic plans to use up to a million Google TPUs, and OpenAI signed a deal for 6 gigawatts of AMD chips. Even the biggest labs buy from more than one company.',
    analogy: 'CUDA is like apps that only run on one brand of phone: even if another phone is cheaper, switching means losing your apps (lock-in).',
    terms: 'effective monopoly (one company has most of a market: not illegal, but hard to compete with), CUDA (NVIDIA’s software toolkit for its chips), lock-in (switching is too costly), TPU (Google’s own AI chip).',
    ask: 'On the slide: “All your class’s apps run on one brand of chip. A cheaper brand appears. Do you switch?” Hands up for yes, then no. Expected: a split; “no, my apps wouldn’t work” is the point.',
    takeaway: 'NVIDIA leads because of fast chips, the CUDA software almost everyone writes for, and the wiring between chips, though rivals are growing.',
    advanced: 'Data-center revenue is company-reported for NVIDIA’s Q1 of fiscal 2027 (quarter ended April 2026; total revenue $81.6 billion). Mellanox: “a transaction value of $7 billion”, completed April 27, 2020. The H100’s chip-to-chip links (NVLink) carry 900 GB/s, which NVIDIA says is 7 times PCIe Gen 5. Huawei’s 2025 keynote announced a three-year roadmap of Ascend chips (950, 960, 970 series).',
    caveats: 'Share: there is no primary source for NVIDIA’s share of AI chips; secondary estimates run from about 75% to about 90% of AI-chip revenue, depending on who counts and what (labelled secondary estimates; not on the slide, do not state one number). “Effective monopoly” is about share, software and wiring, not law. The headline is real (Oct 29, 2025); CHECK ON NOV 21: NVIDIA reports quarterly results around Nov 18, and its market value moves daily, so check a live quote before class or just say “the first company ever worth $5 trillion, in October 2025”. The “6 million developers” is NVIDIA’s own figure. The lock-in explanation (much AI software calls CUDA, so switching chips means rewriting and re-testing) is the common explanation, not a figure from one source. CUDA’s start is 2006 by NVIDIA’s telling (public release 2007), hence “2006–07”.',
    sources: ['https://www.entrepreneur.com/business-news/nvidia-becomes-the-first-to-pass-5-trillion-in-market-value/498929', 'https://www.sec.gov/Archives/edgar/data/0001045810/000104581026000051/q1fy27pr.htm', 'https://forums.developer.nvidia.com/t/cuda-is-nvidia-s-platform-for-accelerated-computing-and-the-foundation-for-gpu-computing/363954', 'https://nvidianews.nvidia.com/news/nvidia-completes-acquisition-of-mellanox-creating-major-force-driving-next-gen-data-centers', 'https://www.anthropic.com/news/expanding-our-use-of-google-cloud-tpus-and-services', 'https://www.amd.com/en/newsroom/press-releases/2025-10-6-amd-and-openai-announce-strategic-partnership-to-d.html', 'https://aws.amazon.com/ai/machine-learning/trainium/', 'https://www.huawei.com/en/news/2025/9/hc-xu-keynote-speech', 'https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/'],
  });
  return s;
}

// PART 1 · 18  Scaling laws (no numbers on the axes)
async function scalingSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  kicker(s, K(18));
  title(s, 'Scaling laws: bigger runs, fewer mistakes');
  const chL = label(d, s, 'REDRAWN FROM KAPLAN ET AL. (OPENAI, 2020)', MX, 1.6, 7, { color: d.S.steel, size: 14 });
  // plot box; both axes are logarithmic in the original, so the published fit is a straight line (no numbers shown)
  const ox = MX + 0.75, oy = 5.15, pw = 6.35, ph = 3.05;
  const ax = [seg(d, s, ox, oy - ph - 0.1, ox, oy, { color: HEX.muted, width: 1.5 }), seg(d, s, ox, oy, ox + pw + 0.15, oy, { color: HEX.muted, width: 1.5, arrow: true })];
  for (let k = 0; k < 10; k++) ax.push(seg(d, s, ox + 0.2 + k * (pw - 0.4) / 9, oy, ox + 0.2 + k * (pw - 0.4) / 9, oy + 0.1, { color: HEX.muted, width: 1.25 }));
  ax.push(d.text(s, 'training compute (each tick: 10 times more)', { x: ox, y: oy + 0.14, w: pw, h: 0.34, fontSize: 16, color: HEX.muted, align: 'center' }));
  ax.push(d.text(s, 'mistakes on new text (lower is better)', { x: ox - 2.2, y: oy - ph / 2 - 0.2, w: ph + 0.4, h: 0.4, fontSize: 16, color: HEX.muted, align: 'center', rotate: 270 }));
  const L = (k) => Math.pow(1e-8 * Math.pow(10, k) / 2.3e8, -0.05);
  const fy = (v) => oy - 0.15 - (ph - 0.3) * (Math.log10(v) - Math.log10(2)) / (Math.log10(7) - Math.log10(2));
  const P = Array.from({ length: 10 }, (_, k) => ({ x: ox + 0.2 + k * (pw - 0.4) / 9, y: fy(L(k)) }));
  const line = [seg(d, s, P[0].x, P[0].y, P[9].x, P[9].y, { color: HEX.red, width: 4.5 })];
  P.forEach((p) => line.push(oval(d, s, p.x - 0.07, p.y - 0.07, 0.14, 0.14, HEX.red, HEX.red, 0)));
  const says = d.text(s, [{ text: 'Performance improves ', options: { color: HEX.text } }, { text: '“smoothly and predictably”', options: { color: HEX.red, bold: true } }], { x: ox + 2.4, y: oy - ph + 0.05, w: 4.0, h: 0.75, fontSize: 18, valign: 'top' });
  // right: the three ingredients, then what the law does not tell you
  const rx = 8.2, rw = W - MX - rx;
  const ing = [label(d, s, 'TURN ALL THREE UP TOGETHER', rx, 1.6, rw, { color: d.S.amber, size: 14 })];
  for (const [i, [nm, c, tint, n, an]] of [['FaDatabase', HEX.blue, TINT.blue, 'Data', 'the ingredients'], ['PiCpuFill', HEX.red, TINT.red, 'Compute', 'the oven time'], ['FaScroll', HEX.amber, TINT.amber, 'Method', 'the recipe']].entries()) {
    const y = 2.02 + i * 0.86;
    ing.push(box(d, s, rx, y, rw, 0.74, { fill: tint, line: c }));
    ing.push(...await iconDisc(d, s, nm, rx + 0.45, y + 0.37, 0.56, c, HEX.card2));
    ing.push(d.text(s, [{ text: n + '  ', options: { bold: true, color: HEX.text, fontSize: 22, fontFace: 'Arial' } }, { text: an, options: { color: c, fontSize: 18, bold: true } }], { x: rx + 0.9, y, w: rw - 1.0, h: 0.74, valign: 'middle' }));
  }
  const not = [box(d, s, rx, 4.68, rw, 0.98, { fill: TINT.red, line: HEX.red }),
    d.text(s, [{ text: 'WHAT IT DOESN’T SAY', options: { fontSize: 14, bold: true, color: HEX.red, charSpacing: 2, breakLine: true } }, { text: 'which new skills appear, or when', options: { fontSize: 20, bold: true, color: HEX.text } }], { x: rx + 0.2, y: 4.7, w: rw - 0.3, h: 0.94, valign: 'middle' })];
  const think = await beatLine(d, s, { text: 'THINK ABOUT IT', iconName: 'FaLightbulb', q: 'If more compute keeps cutting mistakes, what would you do if you ran an AI lab?', x: MX, y: 5.86, w: W - 2 * MX, h: 0.6, qSize: 18 });
  src(d, s, 'Kaplan et al. (2020), “Scaling Laws for Neural Language Models”, Fig. 1 (line redrawn from its published fit; numbers left off) · Hoffmann et al. (2022), “Chinchilla”');
  d.animate(s, [chL, ...ax], { auto: true, effect: 'fade' });
  d.animate(s, [...line, says], { auto: true, effect: 'wipeLeft', dur: 1200, after: 200 });
  d.animate(s, ing, { effect: 'rise' });
  d.animate(s, [...not, ...think], { effect: 'zoom', dur: 400 });
  notes(s, {
    min: '2.0 (IF RUNNING LONG: skip the think-about-it; give the answer yourself)',
    build: 'The axes and the line draw in automatically. Click 1: data, compute and method. Click 2: what it doesn’t say, and the THINK ABOUT IT question.',
    say: 'In 2020, Jared Kaplan and colleagues at OpenAI found something remarkable. As they made language models bigger, with more text and more compute, the mistakes on new text went down along a smooth, predictable line. Each tick to the right is ten times more compute, and the mistakes keep falling: in their words, performance “improves smoothly and predictably”. That pattern is called a scaling law. [Click.] To ride it, you turn three things up together: data, the ingredients; compute, the oven time; and the method, the recipe. In 2022, DeepMind’s “Chinchilla” paper refined the recipe: grow the model and the training data together. And it is happening: Epoch AI, a research group, finds the compute used for the biggest models has grown about five times every year since 2020. [Click.] What the law does NOT tell you: which new skills will show up, or when. Think about it: if more compute keeps cutting mistakes, what would you do if you ran an AI lab? [Take one or two answers.] Right: build bigger computers. That is exactly what the labs are doing, and why the next slide is about power.',
    analogy: 'Practice makes progress: every ten-times-more practice still helps, by a steady, predictable amount.',
    terms: 'scaling law (a steady, predictable pattern: more compute, data and model size, fewer mistakes), compute (the total amount of calculation done by chips), loss (said once: the “mistake score” from slide 11).',
    ask: 'On the slide (THINK ABOUT IT): “If more compute keeps cutting mistakes, what would you do if you ran an AI lab?” Take one or two answers. Expected: spend more on chips and data centers; race competitors; it is predictable, so it feels like a safe bet.',
    takeaway: 'Scaling laws: more compute, data and model size cut mistakes smoothly and predictably, but they do not predict which new skills appear.',
    advanced: 'Kaplan et al.’s abstract: the loss falls as a power law “with model size, dataset size, and the amount of compute used for training, with some trends spanning more than seven orders of magnitude” (if asked: an order of magnitude is ten times). Chinchilla (Hoffmann et al. 2022): “for every doubling of model size the number of training tokens should also be doubled”. Since 2024 labs also scale reinforcement learning (slide 19) and “thinking time”, and experts debate how much more pretraining scaling will help.',
    caveats: 'The line is redrawn from the paper’s published fit, with the numbers left off on purpose; both axes are logarithmic in the original, which is why it is straight. Steady on this measure does not mean steady in skills: the measure is the model’s “loss” on new text, not a count of wrong answers, and predictable loss does not mean predictable new abilities. Epoch’s “about 5 times a year since 2020” is a trend fitted to many frontier models (Epoch AI Trends, Feb 2026), spoken only.',
    sources: ['https://arxiv.org/abs/2001.08361 (Kaplan et al. 2020, Fig. 1)', 'https://arxiv.org/abs/2203.15556 (Hoffmann et al. 2022, Chinchilla)', 'https://epoch.ai/trends (Epoch AI Trends, Feb 2026: training compute for frontier language models growing about five times a year since 2020)', 'https://arxiv.org/abs/2304.15004 (Schaeffer et al. 2023, on “emergent abilities”)'],
  });
  return s;
}

// PART 1 · 11  LeCun's cake
async function cakeSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  kicker(s, K(11));
  title(s, 'LeCun’s cake: the data itself teaches most');
  const ck = cake(d, s, 0.75, 2.05, 1.0);
  const rx = 6.85, rw = W - MX - rx;
  const ask = await beatLine(d, s, { text: 'HANDS UP', iconName: 'FaHandPaper', q: 'Which layer teaches the AI the most: cake, icing or cherry?', x: rx, y: 1.62, w: rw, h: 0.78, qSize: 18 });
  // one row per layer: chip, big plain word, LeCun's own words (from his slide), and a leader line to the layer
  const rows = [
    ['sponge', 'SELF-SUPERVISED', 'the data is its own answer key', 'THE MOST', '“Millions of bits per sample”', 'A27248', 4.48, 'FaBook'],
    ['icing', 'SUPERVISED', 'flash cards', 'SOME', '“10→10,000 bits per sample”', 'C9B48A', 3.46, 'FaClone'],
    ['cherry', 'REINFORCEMENT', 'treats', 'A LITTLE', '“A few bits for some samples”', CAKE.cherry, 2.48, 'FaBone'],
  ];
  const groups = {};
  for (const [layer, tag, meaning, word, quote, col, y, nm] of rows) {
    const g = [];
    const big = layer === 'sponge', bh = big ? 1.56 : 0.92;
    g.push(box(d, s, rx, y, rw, bh, { fill: HEX.card, line: col, lw: big ? 2 : 1.25 }));
    g.push(await ic(d, s, nm, col, rx + 0.18, y + 0.16, 0.42));
    g.push(d.text(s, [{ text: tag, options: { bold: true, color: col, charSpacing: 1.5 } }, { text: `  (${meaning})`, options: { color: HEX.muted } }], { x: rx + 0.72, y: y + 0.08, w: rw - 0.85, h: 0.42, fontSize: 16, valign: 'middle' }));
    g.push(d.text(s, word, { x: rx + 0.72, y: y + 0.46, w: 2.3, h: big ? 0.56 : 0.42, fontSize: big ? 28 : 22, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'middle' }));
    g.push(d.text(s, quote, { x: rx + 3.0, y: y + 0.46, w: rw - 3.1, h: big ? 0.56 : 0.42, fontSize: 14, italic: true, color: HEX.muted, valign: 'middle', align: 'right' }));
    // the link back to slide 7: self-supervised is one kind of unsupervised learning
    if (big) g.push(...chip(d, s, 'a kind of “unsupervised” learning (slide 7)', rx + 0.72, y + 1.1, 4.3, TINT.amber, { h: 0.34, fontSize: 14, color: HEX.text, bold: false, charSpacing: 0, align: 'left' }));
    const a = ck.at[layer];
    g.unshift(seg(d, s, layer === 'cherry' ? a.x + 0.32 : ck.at.right - 0.15, a.y, rx - 0.05, y + (big ? 0.7 : 0.46), { color: col, width: 1.5, dash: 'dash' }));
    groups[layer] = g;
  }
  const tag = d.text(s, 'Most of what it learns comes from the data itself.', { x: MX, y: 6.08, w: 6.0, h: 0.42, fontSize: 18, bold: true, color: HEX.text, valign: 'middle' });
  // click 4: the proof, LeCun's own slide, in an opaque lightbox that covers the cake, the rows and the question
  const lb = box(d, s, 0.35, 1.42, W - 0.7, 5.12, { fill: HEX.card, line: HEX.amber, lw: 1.5, radius: 0.06 });
  const proof = await d.frame(s, R('lecun-cake-isscc2019-slide.png'), { x: 0.5, y: 1.55, w: 8.75, h: 4.86 }, { pad: 0.06, align: 'left' });
  const cx0 = proof.geom.x + proof.geom.w + 0.4, cw0 = W - 0.55 - cx0;
  const pcap = [lb, d.text(s, [
    { text: 'HIS OWN SLIDE', options: { fontSize: 14, bold: true, color: HEX.amber, charSpacing: 2, breakLine: true, paraSpaceAfter: 6 } },
    { text: 'Yann LeCun, ISSCC 2019 keynote (slide 59)', options: { fontSize: 20, bold: true, color: HEX.text, breakLine: true, paraSpaceAfter: 14 } },
    { text: 'Cherry: reinforcement learning', options: { fontSize: 16, color: HEX.text, breakLine: true } },
    { text: 'Icing: supervised learning', options: { fontSize: 16, color: HEX.text, breakLine: true } },
    { text: 'Cake: self-supervised learning', options: { fontSize: 16, color: HEX.text, breakLine: true, paraSpaceAfter: 14 } },
    { text: 'His point: how much each example teaches.', options: { fontSize: 16, italic: true, color: HEX.muted } },
  ], { x: cx0, y: 1.6, w: cw0, h: 4.8, valign: 'middle' })];
  src(d, s, 'Y. LeCun, ISSCC 2019 keynote, slide 59 (© IEEE ISSCC), via Synced Review (Feb 22, 2019) · first shown at NIPS 2016 (“Predictive Learning”) · cake drawn by us');
  d.animate(s, [...ck.all, ...ask], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, [...groups.sponge, tag], { effect: 'wipeLeft', dur: 600 });
  d.animate(s, groups.icing, { effect: 'wipeLeft', dur: 600 });
  d.animate(s, groups.cherry, { effect: 'wipeLeft', dur: 600 });
  d.animate(s, [{ name: lb, effect: 'fade', dur: 300 }, ...[...proof, ...pcap.slice(1)].map((name) => ({ name, delay: 150 }))], { effect: 'zoom', dur: 500 });
  notes(s, {
    min: '2.0',
    build: 'The cake and the HANDS UP question show automatically. Click 1: the sponge (self-supervised: the most) and “most of what it learns comes from the data itself”. Click 2: the icing (supervised: some). Click 3: the cherry (reinforcement: a little). Click 4: a panel covers the slide and LeCun’s real slide zooms in as proof, with his three labels beside it.',
    say: 'Here is a famous picture from Yann LeCun, one of the pioneers of deep learning. Learning is a cake. Hands up: which layer teaches the AI the most: the cake, the icing, or the cherry? [Take hands for each.] [Click.] The cake itself: self-supervised learning, where the data is its own answer key, like guessing the next word, or cleaning the static off a picture. Every example teaches a huge amount. [Click.] The icing: supervised learning, our flash cards. Each card teaches some: just its one label. [Click.] The cherry: reinforcement learning, the treats. A treat only says “good” or “not good”, once in a while, so it teaches a little. [Click.] This is his real slide, from a talk in 2019. In 2016 he called the sponge “unsupervised”; in 2019 he renamed it “self-supervised”. He even joked, on the 2016 slide, that the picture is “slightly offensive to RL folks”: the reinforcement-learning researchers. Next: how this cake became the recipe for a chatbot.',
    analogy: 'A cake: most of it is sponge, there is a little icing, and one cherry on top.',
    terms: 'self-supervised learning (the data is its own answer key), supervised learning (flash cards with answers), reinforcement learning (treats), bit (the smallest piece of information, one yes-or-no; only if asked).',
    ask: 'On the slide: “Which layer teaches the AI the most: cake, icing or cherry?” Hands up for each before click 1. Expected: a split; many say the cherry because it is on top. Answer: the cake.',
    takeaway: 'Most of what an AI learns comes from the data itself (self-supervised); labels add some, and rewards a little.',
    advanced: 'RL researchers answered with a cake covered in cherries (Synced reports DeepMind researchers and, at NIPS 2017, Pieter Abbeel). LeCun’s three lines, verbatim from the slide: the cherry, “The machine predicts a scalar reward given once in a while”; the icing, “The machine predicts a category or a few numbers for each input”; the cake, “The machine predicts any part of its input for any observed part.”',
    caveats: 'LeCun’s point was HOW MUCH INFORMATION each example gives the learner. It was not about training stages, it says nothing about chatbots, and the sizes are not exact proportions. The cake on the left is our drawing; the quotes are verbatim from his 2019 slide (shown on click 4, a credited quotation, © IEEE ISSCC; it is not openly licensed). Synced’s one-sentence version (“If intelligence is a cake, the bulk of the cake is unsupervised learning…”) is Synced’s report of the 2016 talk.',
    sources: ['https://syncedreview.com/2019/02/22/yann-lecun-cake-analogy-2-0/ (Synced, Feb 22, 2019; reproduces the ISSCC 2019 slide 59)', 'https://nips.cc/virtual/2016/invited-talk/6197 (LeCun, “Predictive Learning”, NIPS 2016)'],
  });
  return s;
}

// PART 1 · 12  The chatbot's school year: lecture, worked examples, homework (and exams)
async function schoolSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(12));
  title(s, 'Making a chatbot: lecture, examples, homework');
  const cw = 3.82, ch = 2.88, cy = 1.68, gap = (W - 2 * MX - 3 * cw) / 2;
  const cx = (i) => MX + i * (cw + gap);
  const stages = [
    ['FaChalkboardTeacher', 'LECTURE', 'Pretraining', 'Read a huge library. Guess the next word.', HEX.steel, TINT.steel, 'sponge'],
    ['FaPencilAlt', 'WORKED EXAMPLES', 'SFT (supervised fine-tuning)', 'Copy good answers people wrote.', HEX.blue, TINT.blue, 'icing'],
    ['FaClipboardCheck', 'HOMEWORK & EXAMS', 'RL (reinforcement learning)', 'Try, get graded, learn from the grade.', HEX.red, TINT.red, 'cherry'],
  ];
  const groups = [];
  for (let i = 0; i < 3; i++) {
    const [nm, word, term, txt, c, tint, layer] = stages[i], x = cx(i);
    const g = [box(d, s, x, cy, cw, ch, { fill: tint, line: c, lw: 1.5 })];
    g.push(...await iconDisc(d, s, nm, x + 0.62, cy + 0.6, 0.86, c, HEX.card2));
    const mc = cake(d, s, x + cw - 1.42, cy + 0.08, 0.23, { hi: layer, plate: false });
    g.push(...mc.all);
    g.push(d.text(s, word, { x: x + 0.22, y: cy + 1.1, w: cw - 0.3, h: 0.46, fontSize: 21, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'middle', wrap: false }));
    g.push(d.text(s, term, { x: x + 0.22, y: cy + 1.54, w: cw - 0.35, h: 0.34, fontSize: 16, color: c === HEX.steel ? HEX.muted : c, bold: true, valign: 'middle' }));
    g.push(d.text(s, txt, { x: x + 0.22, y: cy + 1.92, w: cw - 0.35, h: 0.86, fontSize: 20, color: HEX.text, valign: 'top' }));
    if (i > 0) g.push(await ic(d, s, 'FaChevronRight', HEX.steel, x - gap + (gap - 0.3) / 2, cy + ch / 2 - 0.15, 0.3));
    groups.push(g);
  }
  const bk = (i0, i1, text, color) => {
    const x0 = cx(i0), x1 = cx(i1) + cw, yy = cy + ch + 0.16;
    return [seg(d, s, x0 + 0.05, yy, x1 - 0.05, yy, { color, width: 2.5 }), seg(d, s, x0 + 0.05, yy - 0.1, x0 + 0.05, yy, { color, width: 2.5 }), seg(d, s, x1 - 0.05, yy - 0.1, x1 - 0.05, yy, { color, width: 2.5 }),
      d.text(s, text, { x: x0, y: yy + 0.05, w: x1 - x0, h: 0.34, fontSize: 14, bold: true, color, align: 'center', charSpacing: 3 })];
  };
  groups[0].push(...bk(0, 0, 'PRETRAINING', HEX.steel));
  groups[2].push(...bk(1, 2, 'POST-TRAINING', HEX.amber));
  // click 4: safety tests before release (they measure; the model does not learn from them)
  const ey = 5.28, eh = 1.18;
  const exam = [box(d, s, MX, ey, W - 2 * MX, eh, { fill: HEX.card2, line: HEX.red, lw: 1.5 })];
  exam.push(...await iconDisc(d, s, 'FaShieldAlt', MX + 0.58, ey + eh / 2, 0.78, HEX.red, TINT.red));
  exam.push(d.text(s, [{ text: 'Before release: safety tests. ', options: { bold: true, color: HEX.text } }, { text: 'They only check the model; it doesn’t learn from them.', options: { color: HEX.muted } }], { x: MX + 1.1, y: ey + 0.05, w: 5.0, h: eh - 0.1, fontSize: 18, valign: 'middle' }));
  exam.push(seg(d, s, 6.85, ey + 0.18, 6.85, ey + eh - 0.18, { color: HEX.line, width: 1 }));
  exam.push(...await beatTag(d, s, 'TURN TO A NEIGHBOR', 'FaComments', 7.05, ey + 0.14));
  exam.push(d.text(s, 'At which step would you test for dangerous behavior? Why?', { x: 7.05, y: ey + 0.52, w: W - MX - 7.2, h: 0.6, fontSize: 18, bold: true, color: HEX.text, valign: 'middle' }));
  src(d, s, 'Recipe: OpenAI, InstructGPT (Ouyang et al., 2022), Fig. 2 · cake-to-chatbot reading: N. Lambert, RLHF Book, lecture 5 (not LeCun’s own)');
  groups.forEach((g) => d.animate(s, g, { effect: 'rise' }));
  d.animate(s, exam, { effect: 'zoom', dur: 400 });
  notes(s, {
    min: '2.5',
    build: 'Only the title shows at first. Click 1: LECTURE (pretraining), with its bracket. Click 2: WORKED EXAMPLES (SFT). Click 3: HOMEWORK & EXAMS (RL), with the POST-TRAINING bracket over the last two. Click 4: the safety-tests row and the turn-to-a-neighbor question.',
    say: 'Here is how a chatbot is made, as a school year. A frontier model means one of the most capable models, from a few top labs. [Click.] First, the lecture: pretraining. The model reads a huge library and keeps guessing the next word. That is the cake from the last slide: most of the learning happens here. [Click.] Second, worked examples in class: SFT, supervised fine-tuning. People write thousands of good example answers, and the model copies how they are done. That is the icing: our flash cards. [Click.] Third, homework and exams: reinforcement learning. The model tries, gets graded, and learns from the grade, like you do from a marked test. The grade is its treat. That is the cherry. Steps two and three together are called post-training, because they come after pretraining. [Click.] And before release, safety tests. These are different: they only check the model, and it does not learn from them. Turn to a neighbor, 30 seconds: at which step would you test for dangerous behavior, and why? [After 30 seconds, take two answers.]',
    analogy: 'Pretraining is the lecture; SFT is the worked examples in class; RL is the homework and exams (William’s analogy). In RL the grades teach: the model changes after every graded try, the way you learn from a marked test. The safety tests before release only measure: nothing in the model changes because of them.',
    terms: 'frontier model (one of the most capable models, from a few top labs; defined here), pretraining, post-training (everything after pretraining), SFT (supervised fine-tuning: copying good answers people wrote), RL (reinforcement learning: try, get graded, try again), safety tests (evaluations).',
    ask: 'On the slide (TURN TO A NEIGHBOR, 30 seconds, then two answers): “At which step would you test for dangerous behavior? Why?” Good answers: after pretraining (the base model already knows a lot), after each post-training step (behavior changes), before release, and after release (people use it in new ways). Best answer: all of them; real labs test throughout, not only at the end.',
    takeaway: 'A chatbot is made in stages: a long lecture (pretraining), then worked examples and graded homework and exams (post-training), then safety tests before release.',
    advanced: 'OpenAI’s 2022 recipe for InstructGPT had three steps: copy demonstrations (SFT), train a scoring model on people’s rankings, then reinforcement learning against that scoring model. OpenAI said this post-training used “less than 2% of the compute and data relative to model pretraining”. Labs publish safety frameworks, for example Anthropic’s Responsible Scaling Policy and OpenAI’s Preparedness Framework.',
    caveats: 'Mapping LeCun’s cake onto these stages is the community’s adaptation (Nathan Lambert’s RLHF Book, lecture 5), not LeCun’s own claim. Labs rarely publish full recipes, the order varies, and safety testing runs throughout, not only at the end. In RL the graded homework and exams change the model’s dials; the pre-release safety tests do not. The little cakes on the cards are our drawings.',
    sources: ['https://arxiv.org/abs/2203.02155 (Ouyang et al., 2022, InstructGPT, Fig. 2)', 'https://openai.com/index/instruction-following/', 'https://rlhfbook.com/teach/course/lec5-chap7/ (N. Lambert, “The LeCun cake”)', 'https://www.anthropic.com/responsible-scaling-policy', 'https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf'],
  });
  return s;
}

// PART 1 · 13  Pretraining = the lecture
async function pretrainSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(13));
  title(s, 'Pretraining: read a huge library, then guess');
  const bt = await beat(d, s, 'GUESS FIRST', 'FaQuestionCircle');
  const lw = 5.95;
  const rt = roleTag(d, s, 'LECTURE', HEX.steel, MX, 1.6, { color: HEX.ink });
  const loopL = d.text(s, 'THIS LOOP, TRILLIONS OF TIMES', { x: MX + rt.w + 0.2, y: 1.6, w: lw - rt.w - 0.2, h: 0.38, fontSize: 14, bold: true, color: d.S.amber, charSpacing: 2, valign: 'middle' });
  const sw = (lw - 3 * 0.24) / 4, steps = [['FaEyeSlash', 'Hide the next word'], ['FaQuestionCircle', 'Guess it'], ['FaCheckCircle', 'Check'], ['FaSlidersH', 'Nudge the dials']];
  const loop = [...rt, loopL];
  for (let i = 0; i < 4; i++) {
    const x = MX + i * (sw + 0.24), y = 2.1;
    loop.push(box(d, s, x, y, sw, 1.12, { fill: i === 3 ? TINT.red : HEX.card, line: i === 3 ? HEX.red : HEX.line }));
    loop.push(await ic(d, s, steps[i][0], i === 3 ? HEX.red : HEX.amber, x + (sw - 0.34) / 2, y + 0.08, 0.34));
    loop.push(d.text(s, steps[i][1], { x: x + 0.05, y: y + 0.44, w: sw - 0.1, h: 0.62, fontSize: 16, bold: true, color: HEX.text, align: 'center', valign: 'top' }));
    if (i < 3) loop.push(seg(d, s, x + sw + 0.03, y + 0.56, x + sw + 0.21, y + 0.56, { color: HEX.steel, width: 1.75, arrow: true }));
  }
  // two stat cards; the right one starts as the GUESS FIRST question and the answer card then covers it (opaque)
  const cy = 3.42, chh = 1.75, cw2 = (lw - 0.15) / 2, c2x = MX + cw2 + 0.15;
  const st1 = [d.card(s, { x: MX, y: cy, w: cw2, h: chh }),
    d.text(s, '15 trillion+', { x: MX + 0.15, y: cy + 0.14, w: cw2 - 0.25, h: 0.6, fontSize: 30, bold: true, color: HEX.amber, fontFace: 'Arial', valign: 'bottom' }),
    d.text(s, 'tokens read by Meta’s Llama 3 (2024)', { x: MX + 0.15, y: cy + 0.8, w: cw2 - 0.25, h: 0.7, fontSize: 16, color: HEX.muted, valign: 'top' })];
  const qcard = [box(d, s, c2x, cy, cw2, chh, { fill: HEX.card2, line: HEX.red, lw: 1.25 })];
  qcard.push(d.text(s, [
    { text: 'Reading 24 hours a day, how many years?', options: { bold: true, color: HEX.text, breakLine: true, paraSpaceAfter: 3 } },
    { text: 'A: under 1,000', options: { color: HEX.amber, breakLine: true } },
    { text: 'B: 1,000 to 100,000', options: { color: HEX.amber, breakLine: true } },
    { text: 'C: over 100,000', options: { color: HEX.amber } },
  ], { x: c2x + 0.15, y: cy + 0.06, w: cw2 - 0.25, h: chh - 0.12, fontSize: 16, valign: 'middle' }));
  const st2 = [d.card(s, { x: c2x, y: cy, w: cw2, h: chh }, { color: HEX.card }),
    d.text(s, '90,000 years', { x: c2x + 0.15, y: cy + 0.14, w: cw2 - 0.2, h: 0.6, fontSize: 30, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'bottom' }),
    d.text(s, 'reading nonstop: answer B (our estimate)', { x: c2x + 0.15, y: cy + 0.8, w: cw2 - 0.25, h: 0.84, fontSize: 16, color: HEX.muted, valign: 'top' })];
  const chips = [await ic(d, s, 'PiCpuFill', HEX.red, MX, 5.5, 0.6),
    d.text(s, [{ text: 'Thousands of chips, for months ', options: { bold: true, color: HEX.text } }, { text: '(slide 20). The result: a base model.', options: { color: HEX.muted } }], { x: MX + 0.78, y: 5.38, w: lw - 0.78, h: 0.84, fontSize: 18, valign: 'middle' })];

  // right: disclosed token counts (native chart)
  const rx = 6.95, rw = W - MX - rx;
  const chL = d.text(s, 'TEXT READ IN PRETRAINING (TRILLIONS OF TOKENS)', { x: rx, y: 1.6, w: rw, h: 0.38, fontSize: 14, bold: true, color: d.S.steel, charSpacing: 2, valign: 'middle' });
  const data = [
    ['Llama 3 (Meta, 2024)', 15, 'over 15'], ['DeepSeek-V3 (2024)', 14.8, '14.8'], ['Llama 4 (Meta, 2025)', 30, 'over 30'],
    ['Qwen3 (Alibaba, 2025)', 36, 'about 36'], ['Kimi K2 (Moonshot, 2025)', 15.5, '15.5'], ['DeepSeek-V4-Pro (2026)', 32, 'over 32'],
  ].sort((a, b) => b[1] - a[1]);
  const cbox = { x: rx, y: 2.08, w: rw, h: 3.5 }, layout = { x: 0.5, y: 0.02, w: 0.3, h: 0.96 }, maxV = 36;
  const chart = d.chart(s, 'bar', [{ name: 'Tokens (trillions)', labels: data.map((r) => r[0]), values: data.map((r) => r[1]) }], cbox, {
    barDir: 'bar', catAxisOrientation: 'maxMin', valAxisHidden: true, catAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: maxV, valAxisMajorUnit: 12,
    valGridLine: { style: 'none' }, chartColors: [HEX.amber], barGapWidthPct: 45, layout, showLegend: false,
  });
  const g = barGeom(cbox, layout, data.length, 45, maxV);
  const lab = [];
  data.forEach(([nm, v, t]) => {
    const i = data.findIndex((r) => r[0] === nm);
    lab.push(d.text(s, nm, { x: rx, y: g.cy(i) - g.rh / 2, w: layout.x * rw - 0.1, h: g.rh, fontSize: 16, color: HEX.text, align: 'right', valign: 'middle' }));
    lab.push(d.text(s, t, { x: g.vx(v) + 0.08, y: g.cy(i) - 0.2, w: 1.1, h: 0.4, fontSize: 16, bold: true, color: HEX.amber, valign: 'middle' }));
  });
  const note = d.text(s, '“Over” and “about” are each lab’s own words. We found no counts published by OpenAI, Google or Anthropic.', { x: rx, y: 5.68, w: rw, h: 0.8, fontSize: 16, color: d.S.muted, valign: 'top' });
  src(d, s, 'Sources: Meta (Llama 3 & 4 posts) · DeepSeek (arXiv 2412.19437; V4-Pro model card) · Qwen3 blog · Kimi K2 (arXiv 2507.20534) · reading speed: Brysbaert (2019)');

  d.animate(s, loop, { auto: true, effect: 'fade' });
  d.animate(s, [...st1, ...qcard, ...bt], { effect: 'rise' });
  d.animate(s, st2, { effect: 'zoom', dur: 400 });
  d.animate(s, [chL, chart, ...lab, note], { effect: 'wipeLeft', dur: 700 });
  d.animate(s, chips, { effect: 'rise' });
  notes(s, {
    min: '1.75',
    build: 'The LECTURE tag and the loop show automatically. Click 1: “15 trillion+”, the GUESS FIRST chip and the question (reading 24 hours a day) with ranges A, B and C. Click 2: the answer card (about 90,000 years, answer B) covers the question. Click 3: the chart (longest first). Click 4: “thousands of chips, for months”.',
    say: 'Back to the lecture: pretraining, the first and by far the biggest stage. The model plays the guess-the-next-word game: hide the next word, guess it, check against the real text, nudge the dials. Then again. Trillions of times. [Click.] How much text? Meta says its Llama 3 model read over 15 trillion tokens. Guess first: how many years would it take one of you to read all that, reading 24 hours a day? Hands up for A, under 1,000 years… B, 1,000 to 100,000… C, over 100,000. [Count roughly.] [Click.] About 90,000 years, reading nonstop at a normal adult speed: B. That is our own estimate. [Click.] And it keeps growing: some labs now report 30 trillion or more. We found no published numbers from OpenAI, Google or Anthropic. [Click.] This needs thousands of special chips running for months; we will see why on slide 20. What comes out is called a base model. Let’s see what a base model is like.',
    analogy: 'The lecture: most of the course. Like reading a huge library with a card over the page: cover the next word, guess it, slide the card to check, repeat.',
    terms: 'pretraining (the first, biggest stage: guess the next word on trillions of tokens), base model (what pretraining produces: a text-continuer).',
    ask: 'On the slide (GUESS FIRST): “Reading 24 hours a day, how many years?” Hands up for A (under 1,000), B (1,000 to 100,000) or C (over 100,000); count roughly, then click. Answer: B, about 90,000 years reading nonstop. If someone says C because people sleep: they are right at 8 hours a day (about 270,000 years); the question assumes nonstop reading.',
    takeaway: 'Pretraining is the guess-the-next-word game on trillions of tokens, run on huge numbers of chips; it makes a base model.',
    advanced: 'How we got 90,000 years (our estimate, not the labs’): we turned Meta’s token count into words with OpenAI’s rule of thumb (a token is about three-quarters of a word), then divided by an average adult reading speed for non-fiction (Brysbaert, 2019). Epoch AI estimates GPT-5 was likely trained on at least 30 trillion tokens (OpenAI has not said).',
    caveats: 'The answer depends on the assumption: B holds for reading nonstop, 24 hours a day, as the question says. “Trillions of times” counts the guesses (one per token); the dials are nudged after each big batch of guesses. Token counts are the labs’ own figures: Llama 3 “over 15T” (Meta; the paper gives 15.6T for the largest model), DeepSeek-V3 14.8T, Llama 4 “more than 30 trillion”, Qwen3 “approximately 36 trillion”, Kimi K2 15.5T, DeepSeek-V4-Pro “more than 32T” (model card of the V4 preview). Labs count tokens with different tokenizers, so the bars are only roughly comparable. For Google and Anthropic we found no published counts in our sources; that is not proof that none exists.',
    sources: ['https://ai.meta.com/blog/meta-llama-3/', 'https://arxiv.org/abs/2407.21783', 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/', 'https://arxiv.org/pdf/2412.19437', 'https://qwenlm.github.io/blog/qwen3/', 'https://arxiv.org/abs/2507.20534', 'https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro', 'https://help.openai.com/en/articles/4936856-understanding-and-counting-tokens', 'https://linkinghub.elsevier.com/retrieve/pii/S0749596X19300786 (Brysbaert 2019)', 'https://epochai.substack.com/p/notes-on-gpt-5-training-compute'],
  });
  return s;
}

// PART 1 · 14  Worked examples (SFT) turn a base model into an assistant
async function baseModelSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  kicker(s, K(14));
  title(s, 'Worked examples turn it into an assistant');
  const rt = roleTag(d, s, 'WORKED EXAMPLES', HEX.blue, MX, 1.6);
  const made = d.text(s, 'MADE-UP EXAMPLE · NOT A REAL MODEL’S OUTPUT', { x: W - MX - 5.5, y: 1.6, w: 5.5, h: 0.38, fontSize: 12, bold: true, color: d.S.amber, align: 'right', valign: 'middle', charSpacing: 1 });
  const pr = [box(d, s, MX, 2.1, W - 2 * MX, 0.6, { fill: HEX.card2, line: HEX.steel })];
  pr.push(...chip(d, s, 'PROMPT', MX + 0.15, 2.22, 1.1, HEX.steel, { fontSize: 13, color: HEX.ink }));
  pr.push(d.text(s, 'How do I fold a paper plane?', { x: MX + 1.45, y: 2.1, w: 8, h: 0.6, fontSize: 24, bold: true, color: HEX.text, valign: 'middle' }));
  const y = 2.88, h = 2.62, gap = 0.5, cw = (W - 2 * MX - 2 * gap) / 3;
  const col = (i) => MX + i * (cw + gap);
  const card = (i, head, sub, color, tint, runs) => [
    box(d, s, col(i), y, cw, h, { fill: tint, line: color, lw: 1.5 }),
    d.text(s, head, { x: col(i) + 0.2, y: y + 0.1, w: cw - 0.85, h: 0.34, fontSize: 16, bold: true, color, charSpacing: 2, valign: 'middle' }),
    d.text(s, sub, { x: col(i) + 0.2, y: y + 0.44, w: cw - 0.3, h: 0.32, fontSize: 14, color: HEX.muted, valign: 'middle' }),
    d.text(s, runs, { x: col(i) + 0.2, y: y + 0.86, w: cw - 0.35, h: h - 0.94, fontSize: 16, valign: 'top' }),
  ];
  const base = card(0, 'BASE MODEL', 'after the lecture: it just keeps going', HEX.steel, HEX.card, [
    { text: 'How do I fold a paper boat?', options: { color: HEX.text, breakLine: true, paraSpaceAfter: 6 } },
    { text: 'How do I make a paper hat?', options: { color: HEX.text, breakLine: true, paraSpaceAfter: 6 } },
    { text: 'What paper is best for a crane?', options: { color: HEX.text, breakLine: true, paraSpaceAfter: 6 } },
    { text: '12 replies · last post 3 days ago', options: { color: HEX.steel, italic: true } },
  ]);
  const ex = card(1, 'WORKED EXAMPLES', 'people write thousands of model answers', HEX.blue, TINT.blue, [
    { text: 'Q: How do I tie a shoe?', options: { color: HEX.text, bold: true, breakLine: true, paraSpaceAfter: 4 } },
    { text: 'A: 1. Cross the laces. 2. Make a loop… (written by a person)', options: { color: HEX.text, italic: true, breakLine: true, paraSpaceAfter: 6 } },
    { text: 'The model copies the pattern: question in, helpful answer out.', options: { color: HEX.muted } },
  ]);
  const exIcon = await ic(d, s, 'FaUserEdit', HEX.blue, col(1) + cw - 0.6, y + 0.1, 0.4);
  const asst = card(2, 'ASSISTANT', 'after the worked examples: it answers', HEX.red, TINT.red, [
    { text: 'Here is a simple paper plane:', options: { color: HEX.text, bold: true, breakLine: true, paraSpaceAfter: 4 } },
    { text: '1. Fold the paper in half lengthwise.', options: { color: HEX.text, breakLine: true, paraSpaceAfter: 3 } },
    { text: '2. Fold the top corners to the middle.', options: { color: HEX.text, breakLine: true, paraSpaceAfter: 3 } },
    { text: '3. Fold in half; fold the wings down.', options: { color: HEX.text } },
  ]);
  const arrows = [0, 1].map((i) => seg(d, s, col(i) + cw + 0.06, y + h / 2, col(i + 1) - 0.06, y + h / 2, { color: HEX.steel, width: 2.5, arrow: true }));
  const think = await beatLine(d, s, { text: 'THINK ABOUT IT', iconName: 'FaLightbulb', q: 'Why would a model trained on the internet reply with more questions?', x: MX, y: 5.72, w: W - 2 * MX, h: 0.6, qSize: 18 });
  src(d, s, 'Recipe: OpenAI, InstructGPT (Ouyang et al., 2022), step 1: people write example answers · all three cards are made-up examples');
  d.animate(s, [...rt, made, ...pr, ...base, ...think], { auto: true, effect: 'fade' });
  d.animate(s, [arrows[0], ...ex, exIcon], { effect: 'rise' });
  d.animate(s, [arrows[1], ...asst], { effect: 'rise' });
  notes(s, {
    min: '1.75 (IF RUNNING LONG: skip the think-about-it; give the answer yourself)',
    build: 'The prompt, the BASE MODEL card and the THINK ABOUT IT question show automatically. Click 1: the worked-examples card. Click 2: the ASSISTANT card.',
    say: 'What does a base model, straight out of the lecture, actually do? It only learned to continue text. So if you type “How do I fold a paper plane?”, it might just keep the page going: more questions, like a forum thread. This is a made-up example to show the idea, not a real model’s output. Think about it: why would a model trained on the internet reply with more questions? [Take one or two answers.] Yes: on the internet, a question is often followed by more questions. [Click.] Now the worked examples: people write thousands of example answers, question in, helpful answer out, and the model is trained to copy that pattern. That is SFT, supervised fine-tuning: flash cards again, where the back of the card is a good answer. [Click.] The result is an assistant, the kind of chatbot you use: same knowledge inside, different behavior. It answers the question.',
    analogy: 'Worked examples in class: the teacher solves one on the board, then you copy the method.',
    terms: 'base model (the text-continuer that pretraining makes), assistant (a chat model that answers), SFT (supervised fine-tuning: training on example answers people wrote).',
    ask: 'On the slide (THINK ABOUT IT): “Why would a model trained on the internet reply with more questions?” Take one or two answers. Expected: because that is what it saw online (forums, FAQ lists, quiz pages).',
    takeaway: 'Pretraining makes a text-continuer (a base model); worked examples (SFT) turn it into an assistant that answers.',
    advanced: 'A real example from OpenAI’s 2022 paper (Fig. 47), asked to use “serendipity” (a happy accident) in a sentence. Base GPT-3: “Serendipity is the ability to see something good in something bad. Use the word in a sentence.” and more exercises like it. The post-trained InstructGPT: “Serendipity can be defined as the happy chance occurrence of events leading to a beneficial outcome. For example, …” OpenAI (Jan 27, 2022): “GPT‑3 is trained to predict the next word on a large dataset of Internet text, rather than to safely perform the language task that the user wants.” InstructGPT’s SFT step used about 13,000 training prompts with answers written by labelers (paper, Sec. 3).',
    caveats: 'All three cards are made-up examples (labelled on the slide); the serendipity quotes in FOR ADVANCED STUDENTS are verbatim from the paper’s Fig. 47. Real assistants also go through the homework stage (next slide), not only worked examples.',
    sources: ['https://arxiv.org/abs/2203.02155 (Ouyang et al., 2022: Sec. 3 and Fig. 47, p. 65)', 'https://openai.com/index/instruction-following/'],
  });
  return s;
}

// PART 1 · 15  RL = homework: two kinds of grader, and the cherry is growing
async function rlHomeworkSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(15));
  title(s, 'RL is homework: try, get graded, try again');
  const rt = roleTag(d, s, 'HOMEWORK & EXAMS', HEX.red, MX, 1.6);
  rt.push(d.text(s, [{ text: 'Graded practice: ', options: { bold: true, color: HEX.text } }, { text: 'every grade is a treat (slide 8), and the model learns from it', options: { color: HEX.muted } }], { x: MX + rt.w + 0.25, y: 1.6, w: W - 2 * MX - rt.w - 0.25, h: 0.38, fontSize: 16, valign: 'middle' }));
  const py = 2.08, ph = 2.84, pw = (W - 2 * MX - 0.3) / 2, lx = MX, rx = MX + pw + 0.3;
  // left: grader 1, people's votes (made-up example)
  const L = [box(d, s, lx, py, pw, ph, { fill: HEX.card, line: HEX.line })];
  L.push(label(d, s, 'GRADER 1: PEOPLE’S VOTES', lx + 0.2, py + 0.08, 3.4, { color: d.S.amber, size: 14 }));
  L.push(...await beatTag(d, s, 'HANDS UP', 'FaHandPaper', lx + pw - 1.75, py + 0.1));
  L.push(d.text(s, [{ text: 'Why is the sky blue? ', options: { bold: true, color: HEX.text } }, { text: '(made-up answers)', options: { color: HEX.steel, fontSize: 12 } }], { x: lx + 0.2, y: py + 0.48, w: pw - 0.4, h: 0.4, fontSize: 18, valign: 'middle' }));
  const ans = (y, hh, letter, text) => [box(d, s, lx + 0.2, y, pw - 0.4, hh, { fill: HEX.card2, line: HEX.line }),
    ...numDisc(d, s, letter, lx + 0.52, y + hh / 2, 0.44, HEX.steel, { color: HEX.ink, fontSize: 18 }),
    d.text(s, text, { x: lx + 0.88, y, w: pw - 1.18, h: hh, fontSize: 16, color: HEX.text, valign: 'middle' })];
  L.push(...ans(py + 0.95, 0.5, 'A', 'Sunlight scatters in air. Blue scatters most.'));
  L.push(...ans(py + 1.52, 0.72, 'B', 'Good question! Air scatters blue light the most, so blue reaches your eyes from all over the sky.'));
  const vote = [box(d, s, lx + 0.2, py + 2.34, pw - 0.4, 0.38, { fill: TINT.amber, line: HEX.amber, radius: 0.04 }),
    d.text(s, 'Raters pick; a scoring model learns what they prefer', { x: lx + 0.3, y: py + 2.34, w: pw - 0.6, h: 0.38, fontSize: 15, bold: true, color: HEX.text, valign: 'middle', align: 'center' })];
  // right: grader 2, a checker program
  const Rg = [box(d, s, rx, py, pw, ph, { fill: HEX.card, line: HEX.line }), label(d, s, 'GRADER 2: A CHECKER PROGRAM', rx + 0.2, py + 0.08, pw - 0.4, { color: d.S.amber, size: 14 })];
  const chk = [];
  chk.push(...await iconDisc(d, s, 'FaCalculator', rx + 0.6, py + 0.92, 0.62, HEX.amber, TINT.amber));
  chk.push(await ic(d, s, 'FaArrowRight', HEX.steel, rx + 1.04, py + 0.8, 0.24));
  chk.push(...await iconDisc(d, s, 'FaCheckCircle', rx + 1.66, py + 0.92, 0.62, HEX.teal, TINT.teal));
  chk.push(d.text(s, 'Math and code: a right answer earns the reward', { x: rx + 2.12, y: py + 0.58, w: pw - 2.3, h: 0.7, fontSize: 18, bold: true, color: HEX.text, valign: 'middle' }));
  const sy = py + 1.36;
  chk.push(d.text(s, '15.6%', { x: rx + 0.25, y: sy, w: 1.75, h: 0.62, fontSize: 34, bold: true, color: HEX.muted, fontFace: 'Arial', valign: 'middle' }));
  chk.push(d.text(s, 'before', { x: rx + 0.25, y: sy + 0.6, w: 1.75, h: 0.28, fontSize: 14, color: HEX.muted, valign: 'top' }));
  chk.push(seg(d, s, rx + 2.0, sy + 0.31, rx + 2.65, sy + 0.31, { color: HEX.amber, width: 3, arrow: true }));
  chk.push(d.text(s, '71%', { x: rx + 2.8, y: sy, w: 1.4, h: 0.62, fontSize: 40, bold: true, color: HEX.amber, fontFace: 'Arial', valign: 'middle' }));
  chk.push(d.text(s, 'after practice', { x: rx + 2.8, y: sy + 0.6, w: 1.6, h: 0.28, fontSize: 14, color: HEX.amber, valign: 'top' }));
  chk.push(d.text(s, 'DeepSeek-R1-Zero, on a hard math contest (AIME 2024)', { x: rx + 0.25, y: py + 2.34, w: pw - 0.4, h: 0.38, fontSize: 16, color: HEX.text, valign: 'middle' }));
  // click 3: the cherry is growing
  const gy = 5.05, gh = 1.42;
  const grow = [box(d, s, MX, gy, W - 2 * MX, gh, { fill: TINT.red, line: HEX.red, lw: 1.25 }), label(d, s, 'THE CHERRY IS GROWING', MX + 0.2, gy + 0.06, 5, { color: d.S.red, size: 14 })];
  const small = cake(d, s, MX + 0.3, gy + 0.4, 0.19, { plate: false });
  const bigc = cake(d, s, MX + 6.35, gy + 0.4, 0.19, { plate: false, cherryK: 2.4 });
  grow.push(...small.all, ...bigc.all);
  grow.push(d.text(s, [{ text: '2024: ', options: { bold: true, color: HEX.text } }, { text: 'DeepSeek-V3 spent about 0.2% of its chip time on post-training ', options: { color: HEX.text } }, { text: '(our division of its report)', options: { color: HEX.muted, fontSize: 14 } }], { x: MX + 1.45, y: gy + 0.36, w: 4.5, h: 1.0, fontSize: 16, valign: 'middle' }));
  grow.push(d.text(s, [{ text: '2025: ', options: { bold: true, color: HEX.text } }, { text: 'xAI says it ran RL “at pretraining scale” for Grok 4 ', options: { color: HEX.text } }, { text: '(company claim)', options: { color: HEX.muted, fontSize: 14 } }], { x: MX + 7.5, y: gy + 0.36, w: 4.5, h: 1.0, fontSize: 16, valign: 'middle' }));
  src(d, s, 'OpenAI, InstructGPT (2022) · DeepSeek-R1, arXiv 2501.12948 v1 · DeepSeek-V3 report, arXiv 2412.19437 · xAI, “Grok 4” (Jul 9, 2025)');
  d.animate(s, [...rt, ...L, ...Rg], { auto: true, effect: 'fade' });
  d.animate(s, vote, { effect: 'zoom', dur: 400 });
  d.animate(s, chk, { effect: 'fade' });
  d.animate(s, grow, { effect: 'rise' });
  notes(s, {
    min: '2.0',
    build: 'The tag (homework and exams: graded practice the model learns from), both grader panels, the sky question and answers A and B show automatically. Click 1: “raters compare answers; a scoring model learns what they prefer”. Click 2: the checker program and 15.6% to 71%. Click 3: “the cherry is growing”, with two small cakes.',
    say: 'Now the homework and exams: reinforcement learning. The model tries, gets graded, and learns from every grade. Who grades it? Two kinds of grader. First, people. Here is one question with two made-up answers; both are correct. Hands up for A! Hands up for B! [Count roughly.] [Click.] You just did the job of an AI rater. Real raters compare many pairs like this, and a second model, a scoring model, learns what they prefer. Then the chatbot practices, and the scoring model grades each try. The grade is its treat. Our class vote does not train anything. [Click.] Second grader: a checker program. For math and code, a program can check the final answer, and a right answer earns the reward. DeepSeek’s R1-Zero practised this way on a hard math contest and went from 15.6% to 71%. [Click.] In LeCun’s cake, RL was the cherry: small. But the cherry is growing. In 2024, DeepSeek-V3 spent about 0.2% of its chip time on post-training. In 2025, xAI said it ran RL for Grok 4 “at pretraining scale”. And Andrej Karpathy, a well-known AI researcher, wrote at the end of 2025 that RL “gobbled up the compute that was originally intended for pretraining”. That is his expert view, not a lab’s numbers. Spoken follow-up if time: name a task a computer can’t easily check. [Writing a poem, giving advice.]',
    analogy: 'Homework and exams: graded practice changes what you know, and the grade is the treat (slide 8).',
    terms: 'RLHF (reinforcement learning from human feedback: the people-votes grader), scoring model (also called a reward model: a second model that learned what raters prefer), checker (a program that checks a final answer), AIME (a hard US high-school math contest).',
    ask: 'On the slide (HANDS UP): “A or B?” Expected: most pick B. Spoken follow-up: “Name a task a computer can’t easily check.” Expected: a good poem, advice, being kind; that is why checkers work best for math and code.',
    takeaway: 'RL is graded practice: people’s votes or a checker give the grade, and labs now spend far more of their computing on it than before.',
    advanced: 'Anthropic also trains Claude with a written constitution (Constitutional AI, 2022; Claude’s constitution, Jan 2026): the model drafts an answer, critiques it against principles like “be honest” and “avoid harm”, and revises. Anthropic calls the constitution “a perpetual work in progress.” DeepSeek’s R1-Zero RL used about 100,000 GPU hours, 3.75% of its pretraining compute (Khatri et al., Oct 2025, from DeepSeek’s numbers). Epoch AI (May 2025): OpenAI said o3 was a 10-times scale-up in training compute from o1, “almost certainly referring to reasoning training compute”.',
    caveats: 'The A/B answers are made-up (labelled). 15.6% and 71% are DeepSeek-R1-Zero’s pass@1 scores on AIME 2024 in the arXiv v1 paper (later versions report different numbers). “About 0.2%” is our division of DeepSeek-V3’s reported GPU hours (5 thousand for post-training out of about 2.8 million in total). “At pretraining scale” is xAI’s own phrase, with no numbers. An analyst estimate (SemiAnalysis, seen only second-hand via OfficeChai, Oct 18, 2026) puts post-training/RL at about half of Anthropic’s and OpenAI’s combined compute; it is not on the slide, and if you mention it, say “one analyst estimates”. Checkers can be gamed: a model may get the reward without doing what we meant (Part 3).',
    sources: ['https://arxiv.org/abs/2203.02155', 'https://arxiv.org/abs/2501.12948 (v1: https://arxiv.org/abs/2501.12948v1)', 'https://arxiv.org/abs/2412.19437 (DeepSeek-V3: 2,664K pretraining, 119K context extension, 5K post-training GPU hours)', 'https://x.ai/news/grok-4', 'https://karpathy.bearblog.dev/year-in-review-2025/', 'https://arxiv.org/abs/2510.13786 (Khatri et al.)', 'https://epoch.ai/gradient-updates/how-far-can-reasoning-models-scale', 'https://arxiv.org/abs/2212.08073 (Constitutional AI)', 'https://www.anthropic.com/constitution', 'https://officechai.com/ai/while-share-of-inference-has-held-steady-over-the-last-2-years-pre-training-compute-has-moved-to-post-training-semi-analysis/ (analyst estimate, second-hand; notes only)'],
  });
  return s;
}

// PART 1 · 19  How big is a gigawatt? (adapted from economy:gigawattSlide, adult slide 9)
async function iconImg(d, s, name, color, x, y, size, frac = 1) {
  let data = await icon(name, color, 256);
  if (frac < 1) {
    const buf = Buffer.from(data.split(',')[1], 'base64');
    const cut = await sharp(buf).extract({ left: 0, top: 0, width: Math.round(256 * frac), height: 256 }).png().toBuffer();
    data = 'image/png;base64,' + cut.toString('base64');
  }
  const n = d.name('icon');
  s.addImage({ data, x, y, w: size * frac, h: size, objectName: n });
  return n;
}

async function gigawattSlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  kicker(s, K(19));
  title(s, 'How big is a gigawatt?');
  const lx = MX + 0.1, lw = 6.5, vw = 2.45, ix = lx + vw + 0.25, iw = lx + lw - ix;
  const lab = label(d, s, 'ONE GIGAWATT, RUNNING NONSTOP, IS ROUGHLY…', lx, 1.64, lw, { color: d.S.amber, size: 14 });
  const rowY = [2.12, 3.6, 4.98];
  const val = (y, v, l, pre) => [
    d.text(s, pre ? [{ text: pre, options: { fontSize: 18 } }, { text: v, options: { fontSize: 32 } }] : v, { x: lx, y, w: vw, h: 0.56, fontSize: 32, bold: true, color: d.S.amber, fontFace: 'Arial', valign: 'bottom' }),
    d.text(s, l, { x: lx, y: y + 0.6, w: vw, h: 0.42, fontSize: 16, color: d.S.muted, valign: 'top' }),
  ];
  const rows = [];
  const qy = 2.04, qh = 1.08;
  const qc = [box(d, s, lx - 0.08, qy, lw + 0.16, qh, { fill: HEX.card2, line: HEX.red, lw: 1.25 })];
  qc.push(...await beatLine(d, s, { text: 'GUESS FIRST', iconName: 'FaQuestionCircle', q: 'How many homes can one gigawatt run?', x: lx + 0.08, y: qy + 0.06, w: lw - 0.1, h: 0.5, qSize: 18 }));
  qc.push(d.text(s, 'A: under 100,000   ·   B: 100,000 to 1 million   ·   C: over 1 million', { x: lx + 0.08, y: qy + 0.6, w: lw - 0.1, h: 0.4, fontSize: 16, color: HEX.amber, valign: 'middle' }));
  {
    const y = rowY[0], sz = 0.46, step = 0.43;
    const r = [box(d, s, lx - 0.08, qy, lw + 0.16, qh, { fill: HEX.card, line: HEX.line })];
    r.push(...val(y, '850,000', 'average US homes', 'about '));
    for (let i = 0; i < 9; i++) {
      if (i === 8) r.push(await iconImg(d, s, 'PiHouseFill', '#4A5160', ix + i * step, y + 0.1, sz));
      r.push(await iconImg(d, s, 'PiHouseFill', '#F2F3F5', ix + i * step, y + 0.1, sz, i === 8 ? 0.5 : 1));
    }
    r.push(d.text(s, 'each icon: 100,000 homes', { x: ix, y: y + 0.62, w: iw, h: 0.32, fontSize: 14, color: d.S.muted, valign: 'top' }));
    rows.push(r);
  }
  {
    const y = rowY[1];
    const r = val(y, '1', 'typical nuclear reactor');
    r.push(await iconImg(d, s, 'PiNuclearPlantFill', '#F2F3F5', ix, y + 0.1, 0.74));
    r.push(d.text(s, [
      { text: '“A typical nuclear reactor produces 1 gigawatt of power per plant on average.”', options: { italic: true, color: HEX.text, breakLine: true } },
      { text: 'U.S. Department of Energy', options: { color: d.S.steel, fontSize: 12 } },
    ], { x: ix + 0.95, y: y - 0.02, w: iw - 0.95, h: 1.05, fontSize: 16, valign: 'middle' }));
    rows.push(r);
  }
  {
    const y = rowY[2], k = iw / 1.25, by = y + 0.1, bh = 0.5;
    const r = val(y, '1.2 GW', 'one AI campus');
    const one = rect(d, s, ix, by, k, bh, HEX.amber);
    const ext = rect(d, s, ix + k, by, 0.2 * k, bh, HEX.red);
    r.push(one, ext, d.text(s, '1 GW', { x: ix, y: by, w: k, h: bh, fontSize: 16, bold: true, color: HEX.ink, align: 'center', valign: 'middle' }),
      d.text(s, [{ text: '+0.2', options: { fontSize: 15, breakLine: true } }, { text: 'GW', options: { fontSize: 12 } }], { x: ix + k, y: by, w: 0.2 * k, h: bh, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0, lineSpacingMultiple: 0.9 }));
    r.push(d.text(s, 'Stargate Abilene, Texas: 1.2 GW campus', { x: ix, y: by + bh + 0.06, w: iw, h: 0.32, fontSize: 16, color: HEX.text, valign: 'top' }));
    rows.push(r);
  }
  const rx = 7.62, rw = W - MX - rx;
  const ph = await d.frame(s, D('hoover_crop.jpg'), { x: rx, y: 1.72, w: rw, h: rw * 880 / 1500 }, { border: false });
  const capR = d.name('capbar');
  s.addShape(d.pres.shapes.RECTANGLE, { x: ph.geom.x, y: ph.geom.y + ph.geom.h - 0.46, w: ph.geom.w, h: 0.46, fill: { color: '000000', transparency: 30 }, line: { color: '000000', width: 0, transparency: 100 }, objectName: capR });
  const capT = d.text(s, [{ text: 'Hoover Dam', options: { bold: true } }, { text: '  ·  about 480 MW on average' }], { x: ph.geom.x + 0.14, y: ph.geom.y + ph.geom.h - 0.46, w: ph.geom.w - 0.2, h: 0.46, fontSize: 16, color: 'FFFFFF', valign: 'middle' });
  // click 3: the photo's caption becomes the comparison
  const hoover = [box(d, s, ph.geom.x, ph.geom.y + ph.geom.h - 0.52, ph.geom.w, 0.52, { fill: TINT.amber, line: HEX.amber, lw: 1.25, radius: 0.02 }),
    d.text(s, [{ text: 'One gigawatt: ', options: { bold: true, color: HEX.amber } }, { text: 'about 2 Hoover Dams', options: { bold: true, color: HEX.text } }, { text: ', on average', options: { color: HEX.muted } }], { x: ph.geom.x + 0.14, y: ph.geom.y + ph.geom.h - 0.52, w: ph.geom.w - 0.2, h: 0.52, fontSize: 16, valign: 'middle' })];
  rows.splice(2, 0, hoover);
  const sy = ph.geom.y + ph.geom.h + 0.16;
  const watt = d.text(s, [{ text: 'A watt measures power. ', options: { bold: true, color: HEX.text } }, { text: 'A gigawatt (GW) is a billion watts; a megawatt (MW), a million.', options: { color: HEX.muted } }], { x: rx, y: sy, w: rw, h: 0.62, fontSize: 16, valign: 'top' });
  const push = [box(d, s, rx, 5.62, rw, 0.84, { fill: TINT.red, line: HEX.red, lw: 1.25 }),
    await ic(d, s, 'FaMapMarkedAlt', HEX.red, rx + 0.2, 5.8, 0.48),
    d.text(s, [{ text: 'Towns and states are starting to push back ', options: { bold: true, color: HEX.text } }, { text: '(Part 2)', options: { color: HEX.red, bold: true } }], { x: rx + 0.85, y: 5.62, w: rw - 0.95, h: 0.84, fontSize: 16, valign: 'middle' })];
  src(d, s, 'Sources: EIA · U.S. DOE · U.S. Bureau of Reclamation · Crusoe · Photo: Mariordo / Wikimedia Commons, CC BY-SA 4.0 (cropped)');
  d.animate(s, [lab, ...qc, ...ph, capR, capT, watt], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, rows[0], { effect: 'zoom', dur: 450 });
  d.animate(s, rows[1], { effect: 'rise', dur: 500 });
  d.animate(s, rows[2], { effect: 'rise', dur: 500 });
  d.animate(s, [...rows[3], ...push], { effect: 'rise', dur: 500 });
  notes(s, {
    min: '1.5',
    build: 'The watt line, the GUESS FIRST question (ranges A, B and C) and the photo show automatically. Click 1: the answer (about 850,000 homes) covers the question. Click 2: one reactor. Click 3: the photo’s caption changes to “one gigawatt: about 2 Hoover Dams”. Click 4: the 1.2 GW AI campus and “towns and states are starting to push back”.',
    say: 'All those chips need electricity, and companies now talk about AI data centers, buildings full of computers, in gigawatts. A watt measures power: how fast energy is used. A gigawatt is a billion watts. Guess first: how many homes can one gigawatt run, nonstop? Hands up for A, under 100,000… B, 100,000 to a million… C, over a million. [Count roughly.] [Click.] About 850,000 average American homes: B. [Click.] It is what one typical nuclear reactor produces, according to the U.S. Department of Energy. [Click.] And it is about two Hoover Dams, the dam in this photo, on average. [Click.] And one AI campus in Texas, called Stargate Abilene, part of OpenAI’s big data-center program, is designed for 1.2 gigawatts: more than a whole reactor, for one site. Towns and states are starting to push back against data centers like this; you will see a map in Part 2.',
    analogy: 'A gigawatt is about one nuclear reactor running nonstop.',
    terms: 'watt (a unit of power: how fast energy is used), gigawatt (GW, a billion watts), megawatt (MW, a million watts), data center (a building full of computers), campus (a group of buildings), Stargate (OpenAI’s large data-center program with its partners; Abilene, Texas is its first site).',
    ask: 'On the slide (GUESS FIRST): “How many homes can one gigawatt run?” Hands up for A (under 100,000), B (100,000 to 1 million) or C (over 1 million); count roughly, then click. Answer: B, about 850,000.',
    takeaway: 'A gigawatt is a lot of power: about 850,000 homes, one nuclear reactor, or two Hoover Dams on average, and single AI campuses now need more than that.',
    advanced: 'Where 850,000 comes from (our arithmetic, in words): the EIA says an average US home used 863 kilowatt-hours a month in 2024, which spread evenly over the month is a steady draw of about 1.2 kilowatts, so a gigawatt covers about 850,000 such homes. At peak hours (hot afternoons) it covers fewer. TRAINING ENERGY, if asked: a PC Gamer headline (Sep 7, 2026) says Jensen Huang said 100,000 Nvidia GPUs were used to train OpenAI’s GPT-6 Astra (OpenAI itself told Fortune “more than 100,000 GPUs”); Epoch AI estimates that run used about as much electricity as New York City uses in roughly four days (an estimate: OpenAI has disclosed neither the energy nor the length of the run). Company build-outs are company statements: Meta says its Hyperion campus “will be able to scale up to 5GW”.',
    caveats: 'All equivalences are rounded averages. 1.2 GW is the Abilene campus total (Crusoe), not just chip power. Hoover Dam: about 2,080 MW at full power (nameplate) and about 480 MW on average (U.S. Bureau of Reclamation: about 4.2 billion kilowatt-hours a year). The ninth house icon is drawn half-filled. Photo: Hoover Dam aerial, Sep 22, 2017, by Mariordo (Mario Roberto Durán Ortiz), CC BY-SA 4.0, cropped. RUNNING LONG: this is the first slide to hide (it saves 1.5 minutes); if you skip it, say on the Part 2 map slide that one AI campus can use as much power as a nuclear reactor.',
    sources: ['https://www.eia.gov/electricity/sales_revenue_price/pdf/table_5A.pdf', 'https://www.energy.gov/ne/articles/infographic-how-much-power-does-nuclear-reactor-produce', 'https://www.usbr.gov/lc/hooverdam/faqs/powerfaq.html', 'https://www.crusoe.ai/resources/newsroom/crusoe-announces-flagship-abilene-data-center-is-live', 'https://commons.wikimedia.org/wiki/File:2017_Aerial_view_Hoover_Dam_4771.jpg', 'https://www.pcgamer.com/software/ai/jensen-huang-says-100-000-nvidia-gpus-were-used-to-train-openais-latest-model-gpt-6-astra-and-theres-already-plans-to-bring-quadruple-that-amount-of-hardware-online/ (notes only)', 'https://fortune.com/2026/09/03/openai-debuts-gpt-6-astra-computer-use-greg-brockman-says-start-of-agi/ (notes only)', 'https://epoch.ai/data/all_ai_models.csv (Epoch AI estimates; notes only)'],
  });
  return s;
}

// PART 1 · 20  Grown, not built
async function grownSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(20));
  title(s, 'Nobody typed in the rules: it was grown');
  const lw = 5.75;
  const pq = [d.card(s, { x: MX, y: 1.8, w: lw, h: 2.1 }, { color: HEX.card })];
  pq.push(await ic(d, s, 'FaQuoteLeft', HEX.amber, MX + 0.22, 1.95, 0.42));
  pq.push(d.text(s, [
    { text: '…generative AI systems are ', options: { color: HEX.text } },
    { text: 'grown more than they are built', options: { color: HEX.amber } },
    { text: '…', options: { color: HEX.text } },
  ], { x: MX + 0.3, y: 2.36, w: lw - 0.5, h: 0.86, fontSize: 24, bold: true, fontFace: 'Arial', valign: 'top' }));
  pq.push(d.text(s, 'Dario Amodei (CEO of Anthropic), quoting co-founder Chris Olah · “The Urgency of Interpretability”, April 2025', { x: MX + 0.3, y: 3.28, w: lw - 0.5, h: 0.5, fontSize: 14, color: d.S.steel, italic: true, valign: 'top' }));
  const body = d.text(s, [
    { text: 'People choose the data, method and compute. ', options: { bold: true, color: HEX.text } },
    { text: 'The rules sit in billions of learned dials.', options: { color: HEX.muted } },
  ], { x: MX, y: 4.05, w: lw, h: 0.95, fontSize: 18, valign: 'top' });

  const rx = 6.75, rw = W - MX - rx;
  const il = label(d, s, 'INTERPRETABILITY: RESEARCH THAT READS INSIDE MODELS', rx, 1.7, rw, { color: d.S.amber });
  const gg = await d.frame(s, D('ggc_head.png'), { x: rx, y: 2.08, w: 2.9, h: 1.7 }, { pad: 0.05 });
  const ggT = d.text(s, [
    { text: '2024: ', options: { bold: true, color: HEX.amber } },
    { text: 'Anthropic found a “Golden Gate Bridge” feature inside Claude. Turned up, Claude mentioned the bridge in most answers, even off-topic ones.', options: { color: HEX.text } },
  ], { x: rx + 3.1, y: 2.0, w: rw - 3.1, h: 1.9, fontSize: 16, valign: 'middle' });
  const prog = d.text(s, [
    { text: 'Real progress, ', options: { bold: true, color: HEX.text } },
    { text: 'from 2023’s first results to today. ', options: { color: HEX.muted } },
    { text: 'Far from complete: ', options: { bold: true, color: HEX.text } },
    { text: 'experts disagree about how close we are.', options: { color: HEX.muted } },
  ], { x: rx, y: 4.05, w: rw, h: 1.0, fontSize: 16, valign: 'top' });
  const by = 5.4;
  const bar = [box(d, s, MX, by, W - 2 * MX, 0.75, { fill: HEX.card2, line: HEX.red, lw: 1.25 })];
  bar.push(...await beatLine(d, s, { text: 'TURN TO A NEIGHBOR', iconName: 'FaComments', q: 'If you can’t read a model’s rules, how would you check that it’s safe? (45 seconds)', x: MX + 0.15, y: by, w: W - 2 * MX - 0.3, h: 0.75, qSize: 18 }));
  src(d, s, 'Sources: D. Amodei, “The Urgency of Interpretability” (Apr 2025) · Anthropic, “Golden Gate Claude” (May 23, 2024) · Bricken et al., “Towards Monosemanticity” (Oct 4, 2023)');
  d.animate(s, pq, { auto: true, effect: 'fade' });
  d.animate(s, [body], { effect: 'fade' });
  d.animate(s, [il, ...gg, ggT], { effect: 'fade' });
  d.animate(s, [prog], { effect: 'fade' });
  d.animate(s, bar, { effect: 'zoom', dur: 400 });
  notes(s, {
    min: '2.5 (IF RUNNING LONG: drop the neighbor chat; read the question and give two answers yourself, saves about 1 minute)',
    build: 'The pull quote shows automatically. Click 1: the explanation. Click 2: Golden Gate Claude. Click 3: progress so far. Click 4: turn to a neighbor.',
    say: 'Here is the most important idea of Part 1. Anthropic’s CEO, the head of the company, quoting his co-founder, says generative AI systems, the kind that create new text or images, are “grown more than they are built.” [Click.] Think back over this hour. People choose the data, the method and the compute: the cake, the recipe and the oven, like a gardener choosing soil, water and light. But nobody writes the rules. They end up spread across billions of learned dials, the mixing board from slide 10, so even the makers cannot fully explain one particular answer. [Click.] A research field called interpretability tries to read inside models. It looks for features: one idea inside the network that lights up when the model meets that idea. In 2024 Anthropic found a “Golden Gate Bridge” feature in Claude; turned way up, Claude brought up the bridge in most answers. [Click.] Real progress, but far from complete, and experts disagree about how close we are. [Click.] Turn to a neighbor, 45 seconds: if you can’t read a model’s rules, how would you check that it is safe? [After 45 seconds, take two answers.]',
    analogy: 'A gardener chooses the soil, water and light, but does not decide where each leaf grows. The plant grows its own shape.',
    terms: 'interpretability (research that reads inside models), feature (one idea inside the network that lights up when the model reads or sees something about it), generative AI (AI that creates new text, images or other content), CEO (the head of a company).',
    ask: 'On the slide (TURN TO A NEIGHBOR, 45 seconds, then take two answers): “If you can’t read a model’s rules, how would you check that it’s safe?” Good answers: test it a lot (including tricky tests: red-teaming), watch what it does after release, read inside it (interpretability), compare it with other models, limit what it can do.',
    takeaway: 'Modern AI is grown, not hand-written, so even its makers can’t fully read it yet; interpretability research is working on that.',
    advanced: 'Amodei, verbatim: “As my friend and co-founder Chris Olah is fond of saying, generative AI systems are grown more than they are built—their internal mechanisms are ‘emergent’ rather than directly designed.” He also writes: “People outside the field are often surprised and alarmed to learn that we do not understand how our own AI creations work.” and sets a goal that “interpretability can reliably detect most model problems” by 2027. Anthropic on features: “we found millions of concepts that activate when the model reads relevant text or sees relevant images, which we call ‘features’.” In 2025 Anthropic also found Claude plans rhymes ahead; their method “only captures a fraction of the total computation”.',
    caveats: 'This is an open research problem with many people working on it; experts disagree about how close we are. Golden Gate Claude was a 24-hour research demo (May 2024) and is no longer available (Part 4 refers back to it). The pull quote is a verbatim fragment of the essay sentence (full sentence in FOR ADVANCED STUDENTS); the amber words are our emphasis. The essay page shows only “April 2025” (TechCrunch dates it Apr 24, 2025). Anthropic is a company describing its own research. “Billions of learned dials”: GPT-3 had 175 billion and the biggest open models over a trillion (slide 10); closed models’ sizes are not published.',
    sources: ['https://www.darioamodei.com/post/the-urgency-of-interpretability', 'https://www.anthropic.com/news/golden-gate-claude', 'https://transformer-circuits.pub/2024/scaling-monosemanticity/', 'https://transformer-circuits.pub/2023/monosemantic-features', 'https://www.anthropic.com/research/tracing-thoughts-language-model'],
  });
  return s;
}

// PART 1 · 21  Recap
async function recapSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(21));
  title(s, 'Five things to carry into Part 2');
  const rh = 0.74, rp = 0.84, y0 = 1.68, vx = MX + 0.95, tx = MX + 3.45;
  const groups = [];
  const rowBox = async (i, text, last) => {
    const y = y0 + i * rp;
    const g = [box(d, s, MX, y, W - 2 * MX, rh, { fill: last ? TINT.red : HEX.card, line: last ? HEX.red : HEX.line })];
    g.push(...numDisc(d, s, i + 1, MX + 0.45, y + rh / 2, 0.5, last ? HEX.red : HEX.card2, { color: HEX.text, fontSize: 18 }));
    g.push(d.text(s, text, { x: tx, y, w: W - MX - tx - 0.15, h: rh, fontSize: 21, color: HEX.text, valign: 'middle' }));
    return g;
  };
  const ycen = (i) => y0 + i * rp + rh / 2;
  // 1: flash card, piles, dog
  let g = await rowBox(0, 'AI learns from answers, patterns or treats.');
  for (const [k, [nm, c]] of [['FaClone', HEX.blue], ['FaLayerGroup', HEX.teal], ['FaDog', HEX.amber]].entries()) g.push(await ic(d, s, nm, c, vx + k * 0.62, ycen(0) - 0.24, 0.48));
  groups.push(g);
  // 2: a dial and a downhill arrow
  g = await rowBox(1, 'A network of dials, nudged downhill, blame passed back.');
  g.push(await ic(d, s, 'FaSlidersH', HEX.amber, vx, ycen(1) - 0.24, 0.48), seg(d, s, vx + 0.75, ycen(1) - 0.2, vx + 1.6, ycen(1) + 0.2, { color: HEX.red, width: 3, arrow: true }));
  groups.push(g);
  // 3: word boxes, then static becoming a picture
  g = await rowBox(2, 'Text: left to right. Images: static, cleaned up.');
  for (let k = 0; k < 2; k++) g.push(box(d, s, vx + k * 0.36, ycen(2) - 0.14, 0.3, 0.28, { fill: HEX.card2, line: HEX.blue, radius: 0.03 }));
  g.push(seg(d, s, vx + 0.7, ycen(2), vx + 0.92, ycen(2), { color: HEX.blue, width: 2, arrow: true }));
  if (have(D('ddim_01.jpg'))) {
    g.push(...await d.frame(s, D('ddim_01.jpg'), { x: vx + 1.08, y: ycen(2) - 0.27, w: 0.42, h: 0.54 }, { pad: 0.01, shadow: false, border: false }));
    g.push(seg(d, s, vx + 1.53, ycen(2), vx + 1.75, ycen(2), { color: HEX.amber, width: 2, arrow: true }));
    g.push(...await d.frame(s, D('ddim_40.jpg'), { x: vx + 1.8, y: ycen(2) - 0.27, w: 0.42, h: 0.54 }, { pad: 0.01, shadow: false, border: false }));
  } else {
    g.push(...await d.frame(s, D('noise_square.png'), { x: vx + 1.08, y: ycen(2) - 0.27, w: 0.54, h: 0.54 }, { pad: 0.01, shadow: false, border: false }));
  }
  groups.push(g);
  // 4: the cake
  g = await rowBox(3, 'The cake: the lecture teaches most, then examples, homework.');
  g.push(...cake(d, s, vx + 0.2, y0 + 3 * rp + 0.06, 0.13, { plate: false }).all);
  groups.push(g);
  // 5: a chip and a seedling
  g = await rowBox(4, 'More chips, bigger runs, fewer mistakes, and it was grown.', true);
  g.push(await ic(d, s, 'PiCpuFill', HEX.red, vx, ycen(4) - 0.25, 0.5), await ic(d, s, 'FaSeedling', HEX.teal, vx + 0.75, ycen(4) - 0.25, 0.5));
  groups.push(g);
  const next = await beatLine(d, s, { text: 'HANDS UP', iconName: 'FaHandPaper', q: 'Back to question 2: does it understand what it says? What would count as evidence?', x: MX, y: 5.95, w: W - 2 * MX, h: 0.52, qSize: 18 });
  groups.forEach((gg, i) => d.animate(s, gg, { auto: i === 0, effect: 'rise', after: 100 }));
  d.animate(s, next, { effect: 'fade' });
  notes(s, {
    min: '1.5',
    build: 'Point 1 shows automatically. Clicks 1–4 add points 2 to 5. Click 5: the callback question.',
    say: 'Five things to carry with you. One: AI learns from answers (flash cards), patterns (sorting or making new cards), or treats. [Click.] Two: a neural network is a huge stack of dials; training feels the slope and steps downhill, and backpropagation passes the blame back to every dial. [Click.] Three: text AI writes left to right, a word at a time; image AI starts from static and cleans it up. [Click.] Four: LeCun’s cake, as a chatbot’s school year. Most of the learning is the lecture (pretraining, the data teaching itself); then worked examples, then homework and exams (post-training). [Click.] Five, the big one: more chips and bigger runs mean fewer mistakes, steadily: the scaling laws. And what comes out is a system we grew but can’t yet fully read. [Click.] Back to question 2 from the opening poll: hands up if you think it understands what it says. [Look around; hands down.] What would count as evidence? [Take one answer, about 30 seconds.] Experts still disagree. Now, Part 2: how fast is all of this moving?',
    analogy: 'The whole of Part 1 in pictures: flash cards, a dog, a mixing board, a foggy hill, a factory line, a cake and a school year.',
    terms: 'none new (recap).',
    ask: 'On the slide (callback to question 2 of the opening poll): “Does it understand what it says? What would count as evidence?” Repeat the hands-up, then take one answer (about 30 seconds; skip it if time is short). Good answers: explaining in its own words, handling questions it never saw, admitting when it doesn’t know. If nobody answers: “Which of these five surprised you most?”',
    takeaway: 'How AI learns, in five lines: examples, dials, two ways of making things, the cake and the school year, and scale plus “grown, not built”.',
    advanced: 'If a student asks what comes next: Part 2 measures how fast these systems are improving, and Part 3 asks what happens if a grown system learns goals we did not intend.',
    caveats: 'No new facts on this slide; each point repeats a sourced slide above. The little pictures are icons and our drawings.',
    sources: ['See slides 5 to 24 (their notes hold the URLs).'],
  });
  return s;
}

// =====================================================================================
const slides = {
  titleSlide, hookSlide, roadmapSlide, mlSlide, flashCardsSlide, unsupervisedSlide, rlDogSlide, quizSlide, networkSlide,
  gradientSlide, backpropSlide, nextWordSlide, diffusionSlide, cakeSlide, schoolSlide, pretrainSlide, baseModelSlide,
  rlHomeworkSlide, gpuSlide, nvidiaSlide, scalingSlide, gigawattSlide, grownSlide, recapSlide,
};

async function build(d) {
  await prep();
  CLOCK = 0;
  for (const f of Object.values(slides)) await f(d);
}

module.exports = { build, slides };
