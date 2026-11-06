// Cornell Splash Fall 2026 · M1237 "AI Alignment and Safety" (William Liaw, Nov 21, 2026; grades 7–12).
// OPENING (5 slides, 3 min) + PART 1 · HOW AI LEARNS (55 slides after the divider, 35.75 min; 36 with the divider).
// Nov 6, 2026 pacing pass (about 1.5 slides a minute): the Nov 5 slides were split into one-idea, picture-led slides, and
// verified research from assets/research/splash (AlphaGo, hide-and-seek, Li et al. loss landscapes, InstructGPT Fig. 9,
// Epoch AI compute estimates) and the adult deck (Abilene satellite views, the PC Gamer headline) was added.
// No math on the slides or in the notes: no equations, "≈", "×" or formulas; the gradient is "the slope in higher
// dimensions". Sources: assets/research/splash/manifest.json and assets/research/splash_nov/manifest.json, plus
// assets/research/economy/manifest.json for the adapted adult material (gigawatt, Abilene).
// Exports { build, slides, helpers }: build(d) adds every slide in order; slides = name -> async slide function (the
// opening's hookSlide and roadmapSlide each add two slides); helpers = drawing helpers shared with slides_splash_p4.js.
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
  // hide-and-seek Fig. 1: the top row of stages (a)–(c) and the bottom row (d)–(f), each with its printed label; the
  // reward chart between them (with its axis numbers) is left out
  'hs_top.png': [R('hide-seek-fig1-six-stages.png'), { left: 0, top: 25, width: 1680, height: 550 }],
  'hs_bottom.png': [R('hide-seek-fig1-six-stages.png'), { left: 0, top: 1035, width: 1680, height: 545 }],
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
// ---------- Nov 6, 2026 pacing pass (about 1.5 slides a minute): one idea per slide, picture-led ----------
// Part 1 kickers count themselves: every content slide calls page(), which takes the next number (reset in build()).
let KN = 0;
const K = () => `PART 1 · HOW AI LEARNS · ${++KN}`;
function page(d, t, { transition } = {}) {
  const s = d.slide('Content', transition ? { transition } : {});
  kicker(s, K());
  title(s, t);
  return s;
}
// A big number (or short word) in the deck's heading face.
function bigNum(d, s, value, { x, y, w, h = 1.2, size = 66, color = HEX.amber, align = 'left', valign = 'bottom' }) {
  return d.text(s, value, { x, y, w, h, fontSize: size, bold: true, color, fontFace: 'Arial', align, valign });
}
// Dark caption bar across the bottom of a framed photo (geometry g from d.frame).
function capBar(d, s, g, runs, { h = 0.5, size = 16 } = {}) {
  const r = rect(d, s, g.x, g.y + g.h - h, g.w, h, '000000', { transparency: 28 });
  const t = d.text(s, runs, { x: g.x + 0.15, y: g.y + g.h - h, w: g.w - 0.3, h, fontSize: size, color: 'FFFFFF', valign: 'middle' });
  return [r, t];
}
// A plain statement card: tinted box, optional icon disc, bold first line, muted second line.
async function statCard(d, s, { x, y, w, h, icon: nm, color = HEX.amber, tint = TINT.amber, head, sub, headSize = 22, subSize = 16 }) {
  const g = [box(d, s, x, y, w, h, { fill: tint, line: color, lw: 1.25 })];
  let tx = x + 0.22;
  if (nm) { g.push(...await iconDisc(d, s, nm, x + 0.62, y + h / 2, Math.min(0.8, h - 0.2), color, HEX.card2)); tx = x + 1.18; }
  const runs = [{ text: head, options: { bold: true, color: HEX.text, fontSize: headSize, fontFace: 'Arial', breakLine: !!sub } }];
  if (sub) runs.push({ text: sub, options: { color: HEX.muted, fontSize: subSize } });
  g.push(d.text(s, runs, { x: tx, y: y + 0.06, w: x + w - tx - 0.18, h: h - 0.12, valign: 'middle' }));
  return g;
}
// A lettered option tile for GUESS FIRST questions (big, so a room of 200 can read it).
function optionTile(d, s, letter, text, x, y, w, h, { size = 26 } = {}) {
  return [box(d, s, x, y, w, h, { fill: TINT.amber, line: HEX.amber, lw: 1.25 }),
    d.text(s, [{ text: `${letter}  `, options: { color: HEX.amber } }, { text, options: { color: HEX.text } }], { x, y, w, h, fontSize: size, bold: true, fontFace: 'Arial', align: 'center', valign: 'middle' })];
}

// =====================================================================================
// OPENING · 1  Title
async function titleSlide(d) {
  const s = d.slide('Title', { transition: 'fadeBlack' });
  s.addText('AI Alignment and Safety', { placeholder: 'title' });
  s.addText('William Liaw · Cornell Splash · November 21, 2026', { placeholder: 'body' });
  const k = d.text(s, 'CORNELL SPLASH · M1237 · FALL 2026', { x: MX, y: 1.95, w: 8, h: 0.35, fontSize: 14, bold: true, color: d.S.red, charSpacing: 5 });
  const f = d.text(s, 'Grades 7–12  ·  110 minutes  ·  no programming needed', { x: MX, y: 5.15, w: 8, h: 0.4, fontSize: 16, color: d.S.steel });
  d.animate(s, [k], { auto: true, dur: 1200 });
  d.animate(s, [f], { auto: true, after: 300, dur: 800 });
  notes(s, {
    min: '0.25',
    build: 'No clicks: the kicker and the line under the title appear on their own.',
    say: 'Welcome! I’m William, and this is AI Alignment and Safety. We have 110 minutes, a lot of slides, and we will move fast. Questions come at the end.',
    takeaway: 'A fast, visual class about how AI learns and how to keep it doing what people want.',
    caveats: 'About 15 seconds: the rules of the game are on the next slide.',
    sources: ['Cornell Splash Fall 2026 registration, class M1237 (course description). The minutes are the class plan, not a sourced figure.'],
  });
  return s;
}

// OPENING · 2–3  The rules of the game and the first poll, then the "does it understand?" poll (two slides, one function,
// so tools/build_splash.js still sees the opening as titleSlide, hookSlide, roadmapSlide).
async function hookSlide(d) {
  // --- slide A: how we play + question 1
  let s = d.slide('Content');
  kicker(s, 'OPENING · HOW WE PLAY');
  title(s, 'Hands up: who has used an AI this week?');
  const bt = await beat(d, s, 'HANDS UP');
  const q1 = [box(d, s, MX, 1.75, 7.45, 2.1, { fill: HEX.card, line: HEX.line })];
  q1.push(...await iconDisc(d, s, 'FaHandPaper', MX + 1.0, 2.8, 1.4, HEX.amber, TINT.amber));
  q1.push(d.text(s, 'Hands up if you used an AI chatbot or an AI picture tool this week.', { x: MX + 2.0, y: 1.85, w: 5.25, h: 1.9, fontSize: 28, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'middle' }));
  // the rules, as four icon chips
  const rules = [['FaHandPaper', 'Hands up or stand'], ['FaMobileAlt', 'No devices needed'], ['FaComments', 'Turn to a neighbor when I say so'], ['FaMicrophone', 'To speak: wait until I call on you']];
  const play = [label(d, s, 'HOW WE PLAY', MX, 4.05, 6, { color: d.S.amber, size: 14 })];
  const rw = (7.45 - 0.2) / 2;
  for (let i = 0; i < 4; i++) {
    const x = MX + (i % 2) * (rw + 0.2), y = 4.45 + Math.floor(i / 2) * 0.98;
    play.push(box(d, s, x, y, rw, 0.86, { fill: HEX.card2, line: HEX.line }));
    play.push(await ic(d, s, rules[i][0], HEX.amber, x + 0.2, y + 0.2, 0.46));
    play.push(d.text(s, rules[i][1], { x: x + 0.82, y, w: rw - 0.95, h: 0.86, fontSize: 18, bold: true, color: HEX.text, valign: 'middle' }));
  }
  const rx = 8.4, rcw = W - MX - rx;
  const rc = [d.card(s, { x: rx, y: 1.75, w: rcw, h: 4.67 })];
  rc.push(label(d, s, 'WHAT COUNTS AS AN “AI TOOL”?', rx + 0.25, 1.85, rcw - 0.4, { color: d.S.amber, size: 14 }));
  const tools = [['FaComments', 'Chatbots'], ['FaSpellCheck', 'Autocorrect and word suggestions'], ['FaCamera', 'Photo filters that find your face'], ['FaPlayCircle', 'Apps that pick your next video or song']];
  for (let i = 0; i < tools.length; i++) {
    const y = 2.35 + i * 1.0;
    rc.push(await ic(d, s, tools[i][0], HEX.text, rx + 0.3, y + 0.14, 0.52));
    rc.push(d.text(s, tools[i][1], { x: rx + 1.05, y, w: rcw - 1.25, h: 0.8, fontSize: 20, color: HEX.text, valign: 'middle' }));
  }
  d.animate(s, [...q1, ...play], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, bt, { auto: true, effect: 'zoom', after: 200, dur: 400 });
  d.animate(s, rc, { effect: 'fade' });
  notes(s, {
    min: '0.75',
    build: 'The question and the four “how we play” rules show automatically. Click 1: what counts as an AI tool.',
    say: 'How we play: you answer with your hands, or by standing up. No phones needed. Sometimes I’ll say “turn to a neighbor” for 30 seconds. To speak, wait until I call on you; I’ll repeat answers so the whole room hears. First poll! Hands up if you used an AI chatbot or an AI picture tool this week. [Look around and say roughly what you see: “about half of you”. Do not invent a number.] [Click.] An AI tool is broader than you might think: even autocorrect counts.',
    terms: 'AI tool (any program that does something we would call smart: chatbots, autocorrect, photo filters, recommendations).',
    ask: 'On the slide: “Hands up if you used an AI chatbot or an AI picture tool this week.” Expected: many hands.',
    takeaway: 'AI is already part of daily life.',
    caveats: 'HEARING ANSWERS IN A BIG ROOM (plan this before class): ask the Splash organizers for a roving microphone and a runner. Without one, call on hands near the front and aisles and repeat every answer into your own microphone; if neither works, keep beats hands-only.',
    sources: ['None needed: this slide is a poll, with no outside facts or numbers.'],
  });

  // --- slide B: question 2
  s = d.slide('Content', { transition: 'push' });
  kicker(s, 'OPENING · QUESTION 2');
  title(s, 'Does it understand what it says?');
  const bt2 = await beat(d, s, 'HANDS UP');
  const big = [await ic(d, s, 'FaComments', HEX.amber, MX + 0.2, 2.0, 2.4)];
  big.push(d.text(s, 'Hands up if you think an AI chatbot understands what it says.', { x: MX + 3.0, y: 1.8, w: W - 2 * MX - 3.0, h: 2.8, fontSize: 42, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'middle' }));
  const bottom = [box(d, s, MX, 5.0, W - 2 * MX, 1.35, { fill: TINT.teal, line: HEX.teal, lw: 1.25 }),
    d.text(s, [
      { text: 'No wrong answers. ', options: { bold: true, color: HEX.text } },
      { text: 'Experts disagree. By the end of Part 1 you will have tools to judge it yourself.', options: { color: HEX.text } },
    ], { x: MX + 0.3, y: 5.0, w: W - 2 * MX - 0.6, h: 1.35, fontSize: 24, valign: 'middle' })];
  d.animate(s, big, { auto: true, effect: 'fade' });
  d.animate(s, bt2, { auto: true, effect: 'zoom', after: 200, dur: 400 });
  d.animate(s, bottom, { effect: 'fade' });
  notes(s, {
    min: '0.5',
    build: 'The question shows automatically. Click 1: “No wrong answers. Experts disagree.”',
    say: 'Hands down. Now: hands up if you think it actually understands what it says. [Look around; do not judge any answer.] [Click.] No wrong answers. I won’t tell you the answer, because experts genuinely disagree. In Part 1 you will see how these systems are built, and we come back to this question at the end of Part 1.',
    ask: 'On the slide: “Hands up if you think an AI chatbot understands what it says.” Expected: a split. Both are fine.',
    takeaway: 'Whether AI “understands” is an open question that experts disagree about.',
    caveats: 'Reveal nothing yet. The callback is the last slide of Part 1 (“Five things to carry into Part 2”).',
    sources: ['None needed: a poll, with no outside facts or numbers.'],
  });
  return s;
}

// OPENING · 4–5  Roadmap (its minutes are filled in at write time from the built deck, see patchRoadmap), then the one
// word of the course and the "not doom" promise.
const ROADMAP = { names: [], notes: [] };
async function roadmapSlide(d) {
  let s = d.slide('Content', { transition: 'push' });
  kicker(s, 'OPENING · ROADMAP');
  title(s, 'Learn how it works, then what could go wrong');
  const parts = [
    ['FaBrain', 'PART 1', 'How AI learns', '⟦P1s⟧ · now', 'Neural networks, chatbots and chips'],
    ['FaTachometerAlt', 'PART 2', 'How fast it is moving', '⟦P2s⟧', 'Tests, trends, money and data centers'],
    ['FaExclamationTriangle', 'PART 3', 'Why it could go wrong', '⟦P3s⟧', 'Smart is not the same as safe'],
    ['FaHandsHelping', 'PART 4', 'What we can do', '⟦P4s⟧ + ⟦QAn⟧ Q&A', 'Research, rules, and your role'],
  ];
  ROADMAP.names = [];
  const cw = (W - 2 * MX - 3 * 0.25) / 4, y = 1.75, h = 4.7, groups = [];
  for (let i = 0; i < 4; i++) {
    const x = MX + i * (cw + 0.25), now = i === 0;
    const g = [box(d, s, x, y, cw, h, { fill: now ? TINT.red : HEX.card, line: now ? HEX.red : HEX.line, lw: now ? 1.5 : 0.75 })];
    g.push(...await iconDisc(d, s, parts[i][0], x + 0.8, y + 0.8, 1.05, now ? HEX.red : HEX.steel, now ? '3A1416' : HEX.card2));
    if (now) g.push(...chip(d, s, 'NOW', x + cw - 1.05, y + 0.3, 0.8, HEX.red, { fontSize: 13 }));
    g.push(d.text(s, parts[i][1], { x: x + 0.3, y: y + 1.5, w: cw - 0.5, h: 0.3, fontSize: 14, bold: true, color: now ? d.S.red : d.S.steel, charSpacing: 3 }));
    g.push(d.text(s, parts[i][2], { x: x + 0.3, y: y + 1.82, w: cw - 0.45, h: 0.9, fontSize: 24, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'top' }));
    const mn = d.text(s, parts[i][3], { x: x + 0.3, y: y + 2.75, w: cw - 0.45, h: 0.4, fontSize: 18, bold: true, color: now ? HEX.red : HEX.amber, valign: 'top' });
    ROADMAP.names.push(mn);
    g.push(mn);
    g.push(d.text(s, parts[i][4], { x: x + 0.3, y: y + 3.2, w: cw - 0.45, h: 1.35, fontSize: 21, color: 'C9D1D9', valign: 'top' }));
    groups.push(g);
  }
  groups.forEach((g, i) => d.animate(s, g, { auto: true, effect: 'rise', after: i ? 120 : 200 }));
  notes(s, {
    min: '1.0',
    build: 'No clicks: the four cards rise in on their own.',
    say: 'Here is the plan, and we will move fast: about one and a half slides a minute. Part 1, right now, ⟦P1⟧: how AI learns. Neural networks, how a chatbot is trained, the chips it runs on. Part 2, ⟦P2⟧: how fast it is moving, with real measurements. Part 3, ⟦P3⟧: why it could go wrong. Part 4, ⟦P4⟧: what people are doing about it, and what you could do, then ⟦QA⟧ for your questions.',
    terms: 'neural network (a computer model made of layers of simple units; shown in Part 1).',
    takeaway: 'Four parts: how AI learns, how fast it moves, why it could go wrong, what we can do.',
    caveats: 'The minutes on the cards are added up from the slides’ own TIME lines when the deck is built, so they always match the run of show: ⟦P1⟧, ⟦P2⟧, ⟦P3⟧, ⟦P4⟧, Q&A ⟦QA⟧ (opening 3 minutes; 110 in all).',
    sources: ['Cornell Splash Fall 2026 registration, class M1237 (course description). No other facts on this slide.'],
  });
  ROADMAP.notes = [s];

  s = d.slide('Content', { transition: 'fade' });
  kicker(s, 'OPENING · ONE WORD');
  title(s, 'Alignment: getting AI to do what we want');
  const word = d.text(s, 'Alignment', { x: MX, y: 1.8, w: W - 2 * MX, h: 1.5, fontSize: 88, bold: true, color: HEX.amber, fontFace: 'Arial', valign: 'middle' });
  const def = d.text(s, 'getting AI to pursue what people actually want, and keeping it under human control', { x: MX, y: 3.3, w: W - 2 * MX, h: 1.0, fontSize: 30, color: HEX.text, valign: 'top' });
  const promise = [box(d, s, MX, 4.75, W - 2 * MX, 1.55, { fill: TINT.red, line: HEX.red, lw: 1.25 }),
    await ic(d, s, 'FaHandsHelping', HEX.red, MX + 0.35, 5.15, 0.75),
    d.text(s, [
      { text: 'Not a doom talk. ', options: { bold: true, color: HEX.text } },
      { text: 'These are serious, unsolved problems, and many people are working on them. Some of you might be one day.', options: { color: HEX.text } },
    ], { x: MX + 1.4, y: 4.75, w: W - 2 * MX - 1.7, h: 1.55, fontSize: 24, valign: 'middle' })];
  d.animate(s, [word, def], { auto: true, effect: 'fade' });
  d.animate(s, promise, { effect: 'rise' });
  notes(s, {
    min: '0.5',
    build: 'The word and its meaning show automatically. Click 1: the “not a doom talk” promise.',
    say: 'One word for today: alignment. It means getting AI to pursue what people actually want, and keeping it under human control. [Click.] And one promise: this is not a doom talk. These are serious, unsolved problems, and serious problems need people. Let’s start.',
    terms: 'alignment (getting AI to pursue what people actually want, and keeping it under human control).',
    takeaway: 'Alignment is the course’s key word; the problems are serious and people are working on them.',
    sources: ['Cornell Splash Fall 2026 registration, class M1237 (course description).'],
  });
  return s;
}
// Fill in the roadmap minutes from the built deck (section totals of the slides’ TIME lines), just before the file is
// written, so the opening always matches the run of show however the other parts change.
function patchRoadmap(d) {
  const tot = {};
  for (const s of d.pres._slides) {
    const n = s._slideObjects.find((o) => o._type === 'notes');
    const t = n ? n.text.map((r) => r.text || '').join('') : '';
    const m = /^TIME:\s*([\d.]+)/m.exec(t);
    const sec = (s._splashSection || '').replace(/ ·.*$/, '');
    if (m) tot[sec] = (tot[sec] || 0) + parseFloat(m[1]);
  }
  const f = (x) => {
    if (!x) return '?';
    const r = Math.round(x * 2) / 2;
    return `${Math.floor(r)}${r % 1 ? '½' : ''} minutes`;
  };
  const val = { P1: f(tot['Part 1']), P2: f(tot['Part 2']), P3: f(tot['Part 3']), P4: f(tot['Part 4']), QA: f(tot['Q&A']).replace(' minutes', ' min') };
  for (const k of ['P1', 'P2', 'P3', 'P4']) val[k + 's'] = val[k].replace(' minutes', ' min');
  val.QAn = val.QA.replace(' min', '');
  const sub = (t) => t.replace(/⟦(P1s|P2s|P3s|P4s|QAn|P1|P2|P3|P4|QA)⟧/g, (_, k) => val[k]);
  for (const s of d.pres._slides) {
    for (const o of s._slideObjects) {
      if (o._type === 'notes' || (o.options && ROADMAP.names.includes(o.options.objectName))) {
        if (Array.isArray(o.text)) o.text.forEach((r) => { if (typeof r.text === 'string') r.text = sub(r.text); });
      }
    }
  }
  return val;
}

// =====================================================================================
// PART 1 · MACHINE LEARNING
async function lionSlide(d) {
  const s = page(d, 'Could you write rules to spot a lion?');
  const bt = await beat(d, s, 'HANDS UP');
  const lion = await d.frame(s, D('in_lion.png'), { x: MX, y: 1.75, w: 3.5, h: 3.75 }, { pad: 0.07, align: 'left' });
  const rx = lion.geom.x + lion.geom.w + 0.55, rw = W - MX - rx;
  const rules = [['FaCut', 'Rule: it has a mane', '…but lionesses don’t.'], ['FaTeeth', 'Rule: big sharp teeth', '…so do tigers and dogs.'], ['FaPalette', 'Rule: sandy color', '…so do sand, deer and toast.']];
  const rows = [];
  for (let i = 0; i < 3; i++) {
    const y = 1.75 + i * 1.27, g = [box(d, s, rx, y, rw, 1.12, { fill: HEX.card, line: HEX.line })];
    g.push(d.text(s, [{ text: rules[i][1], options: { bold: true, color: HEX.text, fontSize: 24, fontFace: 'Arial', breakLine: true } }, { text: rules[i][2], options: { color: HEX.amber, fontSize: 20, bold: true } }], { x: rx + 0.3, y, w: rw - 1.3, h: 1.12, valign: 'middle' }));
    g.push(await ic(d, s, 'FaTimesCircle', HEX.red, rx + rw - 0.85, y + 0.28, 0.56));
    rows.push(g);
  }
  const ask = await beatLine(d, s, { text: 'HANDS UP', iconName: 'FaHandPaper', q: 'Name something you could NOT easily write rules for.', x: MX, y: 5.78, w: W - 2 * MX, h: 0.62, qSize: 24 });
  src(d, s, 'Photo: ImageNet (Russakovsky et al., 2015), Fig. 1 (cropped)');
  d.animate(s, [...lion, ...ask], { auto: true, effect: 'fade' });
  d.animate(s, bt, { auto: true, effect: 'zoom', dur: 400 });
  d.animate(s, rows.flat().map((name, i) => ({ name, delay: Math.floor(i / 3) * 450 })), { effect: 'rise' });
  notes(s, {
    min: '1.0',
    build: 'The lion photo and the hands-up question show automatically. Click 1: three rules, each with its exception.',
    say: 'Part 1: how AI learns. Try this: write rules that spot a lion in a photo. [Click.] It has a mane? Lionesses don’t. Big teeth? So do tigers. Sandy color? So does toast. Every rule has exceptions. Hands up: name something you could NOT easily write rules for. [Take two answers, about 30 seconds.]',
    analogy: 'Writing rules for a lion is like writing a rule for “funny”: you know it when you see it.',
    terms: 'rule (an instruction a person writes for a computer).',
    ask: 'On the slide: “Name something you could NOT easily write rules for.” Hands up, take two answers. Expected: recognizing a face, a friend’s handwriting, a joke, a cat in a photo.',
    takeaway: 'Some things are almost impossible to write rules for: that is where machine learning comes in.',
    caveats: 'The lion is one photo from the ImageNet paper’s Fig. 1 (cropped inside its border; the printed label and a watermark are cut off). The three rules and exceptions are our everyday examples.',
    sources: ['https://arxiv.org/abs/1409.0575 (Russakovsky et al., ImageNet Large Scale Visual Recognition Challenge, 2015, Fig. 1)'],
  });
  return s;
}

async function mlSlide(d) {
  const s = page(d, 'Machine learning: the computer finds the rules', { transition: 'push' });
  const bw = (7.7 - 2 * 0.45) / 3, bh = 1.45;
  const row = async (y, lab, color, items, hot) => {
    const g = [label(d, s, lab, MX, y, 7.7, { color, size: 16 })];
    for (let i = 0; i < 3; i++) {
      const x = MX + i * (bw + 0.45), by = y + 0.4;
      g.push(box(d, s, x, by, bw, bh, { fill: hot ? TINT.red : HEX.card, line: hot ? HEX.red : HEX.line, lw: hot ? 1.25 : 0.75 }));
      g.push(await ic(d, s, items[i][0], hot ? HEX.red : HEX.muted, x + 0.2, by + 0.15, 0.5));
      g.push(d.text(s, items[i][1], { x: x + 0.2, y: by + 0.7, w: bw - 0.3, h: 0.7, fontSize: 18, bold: true, color: HEX.text, valign: 'top' }));
      if (i < 2) g.push(seg(d, s, x + bw + 0.06, by + bh / 2, x + bw + 0.39, by + bh / 2, { color: hot ? HEX.red : HEX.steel, width: 2.5, arrow: true }));
    }
    return g;
  };
  const rowA = await row(1.65, 'CLASSIC SOFTWARE', d.S.steel, [['FaUserEdit', 'A person writes the rules'], ['FaCogs', 'The computer follows them'], ['FaCheckCircle', 'Answers']], false);
  const rowB = await row(3.75, 'MACHINE LEARNING', d.S.red, [['FaImages', 'Examples with answers'], ['FaSyncAlt', 'Guess, score, adjust'], ['FaLightbulb', 'Rules it found itself']], true);
  const rx = 8.75, rw = W - MX - rx, ny = 1.75, nh = 4.6;
  const nest = [];
  nest.push([box(d, s, rx, ny, rw, nh, { fill: HEX.card, line: HEX.steel, lw: 1 }),
    d.text(s, [{ text: 'AI', options: { bold: true, color: HEX.text, fontSize: 24, fontFace: 'Arial', breakLine: true } }, { text: 'computers doing smart things', options: { color: HEX.muted, fontSize: 16 } }], { x: rx + 0.22, y: ny + 0.1, w: rw - 0.4, h: 0.95, valign: 'top' })]);
  nest.push([box(d, s, rx + 0.25, ny + 1.15, rw - 0.5, nh - 1.4, { fill: TINT.amber, line: HEX.amber, lw: 1 }),
    d.text(s, [{ text: 'MACHINE LEARNING', options: { bold: true, color: HEX.amber, fontSize: 18, fontFace: 'Arial', breakLine: true } }, { text: 'learns from examples', options: { color: HEX.muted, fontSize: 16 } }], { x: rx + 0.45, y: ny + 1.25, w: rw - 0.85, h: 0.85, valign: 'top' })]);
  nest.push([box(d, s, rx + 0.5, ny + 2.3, rw - 1.0, nh - 2.55, { fill: TINT.red, line: HEX.red, lw: 1.25 }),
    d.text(s, [{ text: 'DEEP LEARNING', options: { bold: true, color: HEX.red, fontSize: 18, fontFace: 'Arial', breakLine: true } }, { text: 'many layers: today’s chatbots live here', options: { color: HEX.text, fontSize: 16 } }], { x: rx + 0.7, y: ny + 2.4, w: rw - 1.4, h: 1.5, valign: 'top' })]);
  src(d, s, 'Spam filters, photo apps and chatbots all learned their rules from examples');
  d.animate(s, rowA, { auto: true, effect: 'fade' });
  d.animate(s, rowB, { effect: 'wipeLeft', dur: 700 });
  d.animate(s, nest.flat().map((name, i) => ({ name, delay: Math.floor(i / 2) * 300 })), { effect: 'zoom', dur: 400 });
  notes(s, {
    min: '0.75',
    build: 'The classic-software row shows automatically. Click 1: the machine-learning row. Click 2: the nested boxes (AI, machine learning, deep learning).',
    say: 'Normal software follows rules a person wrote. [Click.] Machine learning flips that around: we give the program examples with the right answers. It guesses, gets a score, adjusts itself, over and over, until it finds rules that work. Nobody typed those rules in. [Click.] Three words you will hear: AI is the big umbrella. Machine learning is the part that learns from examples. Deep learning is machine learning with many layers, and today’s chatbots live there.',
    analogy: 'Classic software is a recipe someone wrote down. Machine learning is a cook who tastes, gets told “too salty”, and adjusts.',
    terms: 'AI (the big umbrella), machine learning (learning from examples), deep learning (machine learning with many layers), score (how well an answer did).',
    takeaway: 'Nobody types in the rules: machine learning finds its own rules from examples.',
    advanced: 'Deep learning’s turning point was the 2012 ImageNet contest: the winner, AlexNet, was “a large, deep convolutional neural network … with 60 million parameters”, trained on graphics chips (GPUs).',
    caveats: 'People use “AI” loosely; here it means the whole field. No numbers on the slide.',
    sources: ['https://arxiv.org/abs/1409.0575 (ImageNet paper)', 'https://papers.nips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf (AlexNet, 60 million parameters)'],
  });
  return s;
}

// =====================================================================================
// PART 1 · THREE WAYS TO LEARN
async function flashCardsSlide(d) {
  const s = page(d, 'Supervised learning: flash cards with answers');
  const cards = [['in_leopard.png', 'leopard', -4], ['in_strawberry.png', 'strawberry', 2], ['in_airliner.png', 'airliner', -2]];
  const CW = 3.6, CH = 2.85, xs = [0.75, 4.87, 8.98], cy = 1.95;
  const fronts = [], backs = [];
  for (let i = 0; i < 3; i++) {
    const [f, word, rot] = cards[i];
    fronts.push(...await photoCard(d, s, D(f), { x: xs[i], y: cy, w: CW, h: CH, rot, m: 0.16 }));
    const b = [box(d, s, xs[i], cy, CW, CH, { fill: HEX.paper, line: HEX.amber, lw: 3, radius: 0.06, rotate: rot, shadow: true })];
    b.push(d.text(s, [
      { text: 'BACK: THE ANSWER', options: { fontSize: 14, bold: true, color: '9A5B12', charSpacing: 2, breakLine: true, paraSpaceAfter: 8 } },
      { text: word, options: { fontSize: 46, bold: true, color: HEX.ink, fontFace: 'Arial' } },
    ], { x: xs[i], y: cy, w: CW, h: CH, align: 'center', valign: 'middle', rotate: rot }));
    backs.push(b);
  }
  const q = await beatLine(d, s, { text: 'GUESS FIRST', iconName: 'FaQuestionCircle', q: 'What’s on the back? Say it together on 3!', x: 0.75, y: 5.3, w: 11.8, h: 0.7, qSize: 28 });
  src(d, s, 'Photos: ImageNet (Russakovsky et al., 2015), Fig. 1 (cropped)');
  d.animate(s, [...fronts, ...q], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, backs.flatMap((b, i) => b.map((name) => ({ name, delay: i * 180 }))), { effect: 'zoom', dur: 380 });
  notes(s, {
    min: '1.0',
    build: 'The three photo cards and the GUESS FIRST question show automatically. Click 1: each card “flips” (its answer side lands on top).',
    say: 'Three ways a computer can learn. The first is called supervised learning, and it is studying with flash cards: picture on the front, answer on the back. What is on the back of each card? Say all three together, on 3: one, two, three! [The room answers together.] [Click.] Leopard, strawberry, airliner.',
    analogy: 'Flash cards: picture on the front, answer on the back.',
    terms: 'supervised learning (learning from examples that come with the right answers).',
    ask: 'On the slide (GUESS FIRST): “What’s on the back? Say it together on 3!” Count “one, two, three” and let the room say the three words together, then click. Do not take single shouts. If some say “cheetah”: exactly the kind of mistake the computer gets corrected on.',
    takeaway: 'Supervised learning means learning from examples with answers.',
    caveats: 'The three photos are crops of the ImageNet paper’s Fig. 1 (photo only; the printed labels are cut off and re-typed on the card backs).',
    sources: ['https://arxiv.org/abs/1409.0575 (Russakovsky et al., 2015, Fig. 1)'],
  });
  return s;
}

async function labelSlide(d) {
  const s = page(d, 'Guess, flip, adjust: millions of times', { transition: 'push' });
  const steps = [['FaQuestion', 'Guess', HEX.amber, TINT.amber], ['FaUndo', 'Flip, check', HEX.blue, TINT.blue], ['FaSlidersH', 'Adjust', HEX.red, TINT.red]];
  const strip = [], sx = [0.75, 4.95, 9.15], sy = 1.9, dia = 1.15;
  for (let i = 0; i < 3; i++) {
    strip.push(...await iconDisc(d, s, steps[i][0], sx[i] + dia / 2, sy + dia / 2, dia, steps[i][2], steps[i][3]));
    strip.push(d.text(s, steps[i][1], { x: sx[i] + dia + 0.2, y: sy, w: 2.6, h: dia, fontSize: 26, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'middle' }));
    if (i < 2) strip.push(seg(d, s, sx[i] + 3.55, sy + dia / 2, sx[i + 1] - 0.2, sy + dia / 2, { color: HEX.steel, width: 3, arrow: true }));
  }
  const line = d.text(s, [{ text: 'Every example comes with its answer: ', options: { color: HEX.text } }, { text: 'a label.', options: { color: HEX.amber, bold: true } }], { x: 0.75, y: 3.3, w: 11.8, h: 0.6, fontSize: 26, valign: 'middle' });
  const L = [box(d, s, MX, 4.25, 5.8, 2.15, { fill: HEX.card, line: HEX.line }),
    bigNum(d, s, '14 million', { x: MX + 0.3, y: 4.3, w: 5.3, h: 1.05, size: 54 }),
    d.text(s, 'photos labelled by people: ImageNet', { x: MX + 0.3, y: 5.4, w: 5.3, h: 0.8, fontSize: 20, color: HEX.text, valign: 'top' })];
  const rx = MX + 6.1, rw = W - MX - rx;
  const R_ = [box(d, s, rx, 4.25, rw, 2.15, { fill: TINT.teal, line: HEX.teal, lw: 1.25 }),
    bigNum(d, s, '28% → 7%', { x: rx + 0.3, y: 4.3, w: rw - 0.5, h: 1.05, size: 54, color: HEX.teal }),
    d.text(s, 'mistakes of the best photo-sorting program, 2010 to 2014 (a trained person: about 5%)', { x: rx + 0.3, y: 5.4, w: rw - 0.5, h: 0.9, fontSize: 18, color: HEX.text, valign: 'top' })];
  src(d, s, 'Russakovsky et al., “ImageNet Large Scale Visual Recognition Challenge” (2015): 14,197,122 labelled images; best error 28.2% (2010), 6.7% (2014)');
  d.animate(s, [...strip, line], { auto: true, effect: 'fade' });
  d.animate(s, L, { effect: 'rise' });
  d.animate(s, R_, { effect: 'rise' });
  notes(s, {
    min: '0.5',
    build: 'The guess, flip, adjust strip shows automatically. Click 1: 14 million labelled photos. Click 2: mistakes fell from 28% to 7%.',
    say: 'The computer does this millions of times: guess, flip the card to check, and adjust a little when it is wrong. The answer on the back is called a label. [Click.] Where do labels come from? People. ImageNet had people label 14 million photos. [Click.] With that many flash cards, the best photo-sorting program went from wrong 28% of the time in 2010 to 7% in 2014, close to a trained person.',
    terms: 'label (the right answer attached to an example).',
    takeaway: 'Supervised learning needs lots of labelled examples, and the labels come from people.',
    advanced: 'ImageNet’s organizers: “we rely on humans to verify each candidate image.” The contest used 1,000 categories and about 1.2 million training photos. The paper estimates a trained human at 5.1% error. 2012 was the turning point, “when large-scale deep neural networks entered the scene”.',
    caveats: 'Labels can be wrong or biased: whoever writes the back of the card decides what counts as right. “14 million” is ImageNet’s full set (14,197,122 images as of August 2014); the contest used a 1,000-category subset. The error is the contest’s “top-5” classification error (the right answer among the program’s five guesses).',
    sources: ['https://arxiv.org/abs/1409.0575 (Russakovsky et al., 2015: Sec. 3.1.3, Table and Sec. 6.4 for the human estimate)'],
  });
  return s;
}

async function unsupervisedSlide(d) {
  const s = page(d, 'Unsupervised learning: no answers on the back');
  const px = MX, py = 1.7, pw = 7.3, ph = 4.75;
  const panel = box(d, s, px, py, pw, ph, { fill: HEX.card, line: HEX.line });
  const order = ['leopard', 'orange', 'airliner', 'mushroom', 'cars', 'monkey', 'canoe', 'lion', 'strawberry'];
  const rots = [-7, 5, -3, 4, -6, 8, 6, -4, -8], jx = [0.1, -0.12, 0.05, -0.08, 0.12, -0.05, 0.06, -0.1, 0.08], jy = [-0.05, 0.08, -0.1, 0.1, -0.06, 0.04, -0.08, 0.05, 0.02];
  const sw = 1.9, sh = 1.36, scatter = [];
  for (let i = 0; i < 9; i++) {
    const cx = px + pw * (1 + 2 * (i % 3)) / 6 + jx[i], cyy = py + 0.85 + 1.5 * Math.floor(i / 3) + jy[i];
    scatter.push(...await photoCard(d, s, D(`in_${order[i]}.png`), { x: cx - sw / 2, y: cyy - sh / 2, w: sw, h: sh, rot: rots[i], m: 0.08 }));
  }
  const rx = 8.25, rw = W - MX - rx;
  const ask = [...await beatTag(d, s, 'HANDS UP', 'FaHandPaper', rx, 1.8),
    d.text(s, 'Sort these into piles: by kind, or by color?', { x: rx, y: 2.3, w: rw, h: 1.8, fontSize: 30, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'top' })];
  const both = [box(d, s, rx, 4.5, rw, 1.9, { fill: TINT.teal, line: HEX.teal, lw: 1.25 }),
    d.text(s, [{ text: 'Both work. ', options: { bold: true, color: HEX.text } }, { text: 'No answer key: you find the patterns yourself.', options: { color: HEX.text } }], { x: rx + 0.25, y: 4.5, w: rw - 0.5, h: 1.9, fontSize: 22, valign: 'middle' })];
  src(d, s, 'Photos: ImageNet (Russakovsky et al., 2015), Fig. 1 (cropped)');
  d.animate(s, [panel, ...scatter, ...ask], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, both, { effect: 'fade' });
  notes(s, {
    min: '0.5',
    build: 'Nine one-sided cards and the hands-up question show automatically. Click 1: “Both work. No answer key.”',
    say: 'The second kind: now the cards have no answers on the back. Can you still learn something? Hands up if you would sort these by kind of thing. Hands up if you would sort them by color. [Two quick votes.] [Click.] Both work: there is no single right answer. That is unsupervised learning: finding patterns with no answer key.',
    analogy: 'One-sided flash cards: you can still sort them into piles.',
    terms: 'unsupervised learning (finding patterns in examples with no answers attached).',
    ask: 'On the slide: “Sort these into piles: by kind, or by color?” Two quick hands-up votes (about 15 seconds).',
    takeaway: 'Unsupervised learning finds patterns with no answer key.',
    caveats: 'The nine photos are crops of the ImageNet paper’s Fig. 1 (the canoe is cut short on the right to drop a watermark; the cars are ImageNet’s “minivan” photo).',
    sources: ['https://arxiv.org/abs/1409.0575 (ImageNet, Fig. 1)'],
  });
  return s;
}

async function unsupSortedSlide(d) {
  const s = page(d, 'It finds the groups. Nobody named them.', { transition: 'push' });
  const px = MX, py = 1.7, pw = 7.3, ph = 4.75;
  const piles = [['leopard', 'lion', 'monkey'], ['strawberry', 'orange', 'mushroom'], ['airliner', 'cars', 'canoe']];
  const g = [box(d, s, px, py, pw, ph, { fill: HEX.card, line: HEX.line })];
  const cw = 2.0, chh = 1.5, off = 0.1, gap = (pw - 0.4 - 3 * (cw + 2 * off)) / 2, pileY = py + 0.5;
  for (let p = 0; p < 3; p++) {
    const x0 = px + 0.2 + p * (cw + 2 * off + gap);
    for (let k = 0; k < 3; k++) g.push(...await photoCard(d, s, D(`in_${piles[p][2 - k]}.png`), { x: x0 + k * off, y: pileY + k * off, w: cw, h: chh, m: 0.07 }));
    g.push(d.text(s, `pile ${p + 1}`, { x: x0, y: pileY + chh + 2 * off + 0.1, w: cw + 2 * off, h: 0.4, fontSize: 22, bold: true, color: HEX.amber, align: 'center' }));
  }
  g.push(d.text(s, [{ text: 'Animals? Food? Vehicles? ', options: { color: HEX.text, bold: true } }, { text: 'To the computer, just pile 1, 2 and 3.', options: { color: HEX.muted } }], { x: px + 0.3, y: py + 3.05, w: pw - 0.6, h: 1.4, fontSize: 22, valign: 'middle' }));
  const rx = 8.25, rw = W - MX - rx;
  const km = await d.frame(s, KMEANS, { x: rx, y: 1.75, w: rw, h: 3.8 }, { pad: 0.05 });
  const kcap = d.text(s, 'The same idea on dots: a sorting program (k-means) colors three groups it found itself', { x: rx, y: km.geom.y + km.geom.h + 0.1, w: rw, h: 0.8, fontSize: 16, color: HEX.muted, valign: 'top' });
  src(d, s, 'Photos: ImageNet (Russakovsky et al., 2015) · dots: Chire, CC BY-SA 4.0, Wikimedia Commons (cropped, frames reordered)');
  d.animate(s, g, { auto: true, effect: 'rise' });
  d.animate(s, [...km, kcap], { effect: 'fade' });
  notes(s, {
    min: '0.5',
    build: 'The three piles show automatically. Click 1: the real sorting program on dots.',
    say: 'A computer can do this too. It finds groups on its own: here, animals, food and vehicles. But it does not know those names; to the computer they are just pile 1, pile 2 and pile 3. [Click.] Here is a real sorting program, called k-means, doing the same thing on dots: it colors three groups it found by itself.',
    terms: 'clustering (sorting into groups), k-means (one simple sorting program).',
    takeaway: 'Unsupervised learning can find groups that nobody named.',
    advanced: 'k-means has to be told how many groups to make (here three); it does not discover the number itself.',
    caveats: 'The three piles are our arrangement, to show the idea; a real program might group by color or background instead. The k-means GIF is cropped to its plot area and its frames start at the finished state.',
    sources: ['https://arxiv.org/abs/1409.0575 (ImageNet, Fig. 1)', 'https://commons.wikimedia.org/wiki/File:K-means_convergence.gif (Chire, CC BY-SA 4.0)'],
  });
  return s;
}

async function unsupNewSlide(d) {
  const s = page(d, 'Or it learns to make a brand-new card');
  const lw = 6.3;
  const t1 = d.text(s, [
    { text: 'No answers needed. ', options: { bold: true, color: HEX.text, breakLine: true } },
    { text: 'Show it millions of pictures, and it can learn what pictures look like so well that it makes new ones.', options: { color: HEX.text } },
  ], { x: MX, y: 1.85, w: lw, h: 2.2, fontSize: 26, valign: 'top' });
  const t2 = [box(d, s, MX, 4.45, lw, 1.9, { fill: TINT.amber, line: HEX.amber, lw: 1.25 }),
    await ic(d, s, 'FaMagic', HEX.amber, MX + 0.3, 4.95, 0.8),
    d.text(s, [{ text: 'This castle was never photographed. ', options: { bold: true, color: HEX.text } }, { text: 'An AI made it (Stable Diffusion).', options: { color: HEX.text } }], { x: MX + 1.35, y: 4.45, w: lw - 1.6, h: 1.9, fontSize: 22, valign: 'middle' })];
  const castle = await photoCard(d, s, D('ddim_40.jpg'), { x: 8.1, y: 1.65, w: 3.75, h: 4.85, rot: 3, m: 0.16 });
  src(d, s, 'Castle: Benlisquare, CC BY-SA 4.0, Wikimedia Commons; made with Stable Diffusion v1-5 (cropped)');
  d.animate(s, [t1], { auto: true, effect: 'fade' });
  d.animate(s, [...castle, ...t2], { effect: 'zoom', dur: 450 });
  notes(s, {
    min: '0.5',
    build: 'The text shows automatically. Click 1: the castle card and its caption.',
    say: 'And unsupervised learning can do something stranger. If the cards are pictures, a computer can learn what pictures look like so well that it makes a brand-new card nobody ever printed. [Click.] This castle was never photographed: an AI made it. You will see how in a few minutes. One more word for later: “self-supervised” is one kind of unsupervised learning, where the data makes its own answer key.',
    analogy: 'After sorting thousands of one-sided cards, you could draw a new card that fits the pile.',
    terms: 'generative AI (AI that makes new pictures or text), self-supervised learning (said only: one kind of unsupervised learning, where the data makes its own answer key).',
    takeaway: 'Unsupervised learning can sort the cards, or learn to make new ones.',
    caveats: '“Unsupervised” is a broad family, and experts argue about the names. The castle is real AI output, posted by its maker on Wikimedia Commons (one panel of an X-Y plot, cropped).',
    sources: ['https://commons.wikimedia.org/wiki/File:X-Y_plot_of_algorithmically-generated_AI_art_of_European-style_castle_in_Japan_demonstrating_DDIM_diffusion_steps.png (Benlisquare, CC BY-SA 4.0; Stable Diffusion v1-5 output)'],
  });
  return s;
}

async function rlDogSlide(d) {
  const s = page(d, 'Reinforcement learning: treats for good tries', { transition: 'push' });
  const left = await d.frame(s, D('dog_treat.jpg'), { x: MX, y: 1.7, w: 7.3, h: 4.8 }, { pad: 0.07, align: 'left' });
  const cx = 10.45, cy = 3.95, r = 1.3, dia = 1.15;
  const pts = [[cx, cy - r], [cx + r * 0.866, cy + r * 0.5], [cx - r * 0.866, cy + r * 0.5]];
  const st = [['FaRedo', 'Try something'], ['FaBone', 'Treat… or not'], ['FaThumbsUp', 'Do more of what earned treats']];
  const loop = [];
  for (let i = 0; i < 3; i++) {
    loop.push(...await iconDisc(d, s, st[i][0], pts[i][0], pts[i][1], dia, HEX.amber, TINT.amber));
    const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % 3], L = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / L, uy = (by - ay) / L, k = dia / 2 + 0.1;
    loop.push(seg(d, s, ax + ux * k, ay + uy * k, bx - ux * k, by - uy * k, { color: HEX.amber, width: 3, arrow: true }));
  }
  loop.push(d.text(s, st[0][1], { x: pts[0][0] - 1.4, y: pts[0][1] - dia / 2 - 0.5, w: 2.8, h: 0.42, fontSize: 20, bold: true, color: HEX.text, align: 'center', valign: 'bottom' }));
  loop.push(d.text(s, st[1][1], { x: pts[1][0] - 1.0, y: pts[1][1] + dia / 2 + 0.08, w: 2.2, h: 0.45, fontSize: 20, bold: true, color: HEX.text, align: 'center', valign: 'top' }));
  loop.push(d.text(s, st[2][1], { x: pts[2][0] - 1.25, y: pts[2][1] + dia / 2 + 0.08, w: 2.5, h: 0.8, fontSize: 20, bold: true, color: HEX.text, align: 'center', valign: 'top' }));
  src(d, s, 'Photo: “Dog with treat”, pbump, CC BY-SA 2.0, via Wikimedia Commons');
  d.animate(s, left, { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, loop, { effect: 'fade' });
  notes(s, {
    min: '0.5',
    build: 'The photo shows automatically. Click 1: the try, treat, do-more loop.',
    say: 'The third kind is reinforcement learning, and it is how you train a dog. This one is waiting for its treat. [Click.] The dog tries something. If it sits, it gets a treat; if not, no treat. Over time it does more of whatever earned treats. Notice: the treat never tells the dog what to do. It only says “that was good”.',
    analogy: 'Training your dog with treats: try, treat or no treat, do more of what earned treats.',
    terms: 'reinforcement learning (learning by trial and error from rewards), reward (a score for how good a try was).',
    ask: 'Spoken only, if time: “Who has taught a pet a trick?” A few hands; no answers needed.',
    takeaway: 'A reward says how good a try was, not what to do.',
    caveats: 'The dog photo is a real photo (Wikimedia Commons; its description: “Dog waiting for treat”).',
    sources: ['https://commons.wikimedia.org/wiki/File:Dog_with_treat.jpg (pbump, CC BY-SA 2.0)'],
  });
  return s;
}

async function hideSeekSlide(d) {
  const s = page(d, 'For an AI, the treat is points');
  const lw = 7.6;
  const top = await d.frame(s, D('hs_top.png'), { x: MX, y: 1.7, w: lw, h: 2.42 }, { pad: 0.05, align: 'left' });
  const bot = await d.frame(s, D('hs_bottom.png'), { x: MX, y: 4.2, w: lw, h: 2.42 }, { pad: 0.05, align: 'left' });
  const rx = MX + lw + 0.4, rw = W - MX - rx;
  const t1 = d.text(s, [
    { text: 'OPENAI HIDE-AND-SEEK, 2019', options: { fontSize: 14, bold: true, color: HEX.amber, charSpacing: 2, breakLine: true, paraSpaceAfter: 8 } },
    { text: 'The only treat: ', options: { bold: true, color: HEX.text } },
    { text: 'a point when every hider stays hidden; a point lost when one is seen.', options: { color: HEX.text } },
  ], { x: rx, y: 1.75, w: rw, h: 2.3, fontSize: 22, valign: 'top' });
  const t2 = [box(d, s, rx, 4.25, rw, 2.2, { fill: TINT.amber, line: HEX.amber, lw: 1.25 }),
    d.text(s, [{ text: 'After millions of games: ', options: { bold: true, color: HEX.text } }, { text: 'forts, ramps, even “box surfing”. Nobody taught them.', options: { color: HEX.text } }], { x: rx + 0.25, y: 4.25, w: rw - 0.5, h: 2.2, fontSize: 22, valign: 'middle' })];
  // Nov 6 fix pass: big numbered labels laid over the paper's own small panel labels, so the back rows can follow the six stages
  const STAGES = ['1 · Chase', '2 · Build a fort', '3 · Use a ramp', '4 · Block the ramp', '5 · Box surfing', '6 · Stop the surfing'];
  const lab = (g, i, y) => chip(d, s, STAGES[i], g.x + (i % 3) * g.w / 3 + 0.06, y, g.w / 3 - 0.12, '1E2430', { h: 0.38, fontSize: 16, color: HEX.text, charSpacing: 0.5 });
  const topL = [0, 1, 2].flatMap((i) => lab(top.geom, i, top.geom.y - 0.02));
  const botL = [3, 4, 5].flatMap((i) => lab(bot.geom, i, bot.geom.y + bot.geom.h - 0.36));
  src(d, s, 'Baker et al. (OpenAI), “Emergent Tool Use From Multi-Agent Autocurricula” (2019), Fig. 1 (cropped; our labels)');
  d.animate(s, [...top, ...topL, t1], { auto: true, effect: 'fade' });
  d.animate(s, [...bot, ...botL, ...t2], { effect: 'rise' });
  notes(s, {
    min: '0.5',
    build: 'The first three stages and the reward rule show automatically. Click 1: the last three stages and “nobody taught them”.',
    say: 'For an AI, the treat is just a number: points. In OpenAI’s hide-and-seek game, the hiders got a point for staying hidden, and nothing else. Nobody told them how. [Click.] After millions of games they learned, on their own, to build forts, to use ramps, and the seekers even learned to “surf” on boxes. Nobody taught them any of it.',
    terms: 'reward (the points), episode (one game).',
    takeaway: 'Simple points, repeated millions of times, can teach surprising strategies.',
    advanced: 'The reward, verbatim from the paper: “hiders are given a reward of 1 if all hiders are hidden and -1 if any hider is seen by a seeker”; forts appeared “after approximately 25 million episodes”, and box surfing after about 380 million. The researchers wrote that they “were surprised”.',
    caveats: 'A reward can be gamed: the agents also exploited flaws in the simulated physics (Part 3 comes back to this kind of loophole). The panels are the paper’s own Fig. 1, cropped to the six pictures (the reward chart in the middle is left out); the six numbered labels are ours, laid over the paper’s small ones: (a) Running and Chasing, (b) Fort Building, (c) Ramp Use, (d) Ramp Defense, (e) Box Surfing, (f) Surf Defense.',
    sources: ['https://arxiv.org/abs/1909.07528 (Baker et al., 2019, Fig. 1)', 'https://openai.com/index/emergent-tool-use/'],
  });
  return s;
}

async function alphaGoSlide(d) {
  const s = page(d, 'AlphaGo practised by playing against itself', { transition: 'push' });
  const ph = await d.frame(s, R('alphago-lee-sedol-thinking.png'), { x: MX, y: 1.7, w: 7.4, h: 4.2 }, { border: false, align: 'left' });
  const cap = capBar(d, s, ph.geom, [{ text: 'Lee Sedol, March 2016: ', options: { bold: true } }, { text: 'AlphaGo won 4 games to 1' }], { h: 0.5, size: 18 });
  const rx = MX + 7.75, rw = W - MX - rx;
  const hl = await d.frame(s, R('alphago-wired-two-moves-header.png'), { x: rx, y: 1.7, w: rw, h: 0.9 }, { pad: 0.05, rot: -1 });
  const how = d.text(s, 'It learned from people’s games, then by playing game after game against itself.', { x: rx, y: 2.75, w: rw, h: 1.0, fontSize: 18, color: HEX.text, valign: 'top' });
  const m37 = [bigNum(d, s, '1 in 10,000', { x: rx, y: 3.75, w: rw, h: 0.9, size: 44 }),
    d.text(s, 'AlphaGo’s own estimate that a person would play its “Move 37”. It played it anyway.', { x: rx, y: 4.65, w: rw, h: 0.85, fontSize: 16, color: HEX.text, valign: 'top' }),
    d.text(s, '“It’s not a human move… So beautiful.” (Fan Hui, Go champion)', { x: rx, y: 5.5, w: rw, h: 0.75, fontSize: 16, italic: true, color: HEX.amber, valign: 'top' })];
  src(d, s, 'Photo: Google DeepMind (AlphaGo page) · WIRED, Cade Metz (Mar 16 and Mar 11, 2016) · Silver et al., Nature (2016)');
  d.animate(s, [...ph, ...cap, ...hl, how], { auto: true, effect: 'fade' });
  d.animate(s, m37, { effect: 'rise' });
  notes(s, {
    min: '0.75',
    build: 'The photo, the WIRED headline and how AlphaGo learned show automatically. Click 1: Move 37 (“1 in 10,000”) and Fan Hui’s words.',
    say: 'The most famous example of practising for points. Go is an ancient board game with more possible positions than atoms in the universe. Google DeepMind’s AlphaGo learned from people’s games first, then played game after game against itself, rewarded for winning. In March 2016 it beat Lee Sedol, one of the best players in the world, 4 games to 1. [Click.] In game 2 it played “Move 37”: its own estimate was a 1-in-10,000 chance that a person would play it. It played it anyway, and, as WIRED put it, the move was genius. And Lee Sedol answered in game 4 with his own 1-in-10,000 move and won: people can still surprise the machine.',
    analogy: 'A chess club where you play yourself millions of times and remember what won.',
    terms: 'self-play (practising against a copy of yourself), Go (a board game with black and white stones).',
    takeaway: 'Practice with a reward (winning) can produce moves no person taught.',
    advanced: 'AlphaGo learned from both supervised learning on expert games and reinforcement learning from self-play (Silver et al., Nature, Jan 2016). DeepMind: the match was “watched by over 200 million people worldwide”; Go has “10 to the power of 170 possible board configurations”. AlphaZero (2018) then learned chess, shogi and Go from scratch by self-play alone.',
    caveats: 'The 1-in-10,000 is AlphaGo’s own estimate, as described by DeepMind’s David Silver to WIRED. The photo is DeepMind’s official photo from its AlphaGo page.',
    sources: ['https://deepmind.google/research/alphago/', 'https://www.wired.com/2016/03/two-moves-alphago-lee-sedol-redefined-future/', 'https://www.wired.com/2016/03/sadness-beauty-watching-googles-ai-play-go/', 'https://www.nature.com/articles/nature16961'],
  });
  return s;
}

// The finger quiz, two scenarios per slide (one finger: supervised; two: unsupervised; three: reinforcement)
const QUIZ_TYPES = [['1 finger', 'Supervised', HEX.blue, 'FaClone', TINT.blue], ['2 fingers', 'Unsupervised', HEX.teal, 'FaLayerGroup', TINT.teal], ['3 fingers', 'Reinforcement', HEX.amber, 'FaDog', TINT.amber]];
async function quizPage(d, n, sc, o) {
  const s = page(d, `Quiz ${n} of 2: which kind of learning?`, n === 2 ? { transition: 'push' } : {});
  const bt = await beat(d, s, 'QUIZ', 'FaQuestionCircle');
  const lw = (W - 2 * MX - 2 * 0.25) / 3, legend = [];
  for (let i = 0; i < 3; i++) {
    const [f, t, c, nm, tint] = QUIZ_TYPES[i], x = MX + i * (lw + 0.25);
    legend.push(box(d, s, x, 1.68, lw, 0.75, { fill: tint, line: c, lw: 1.25 }));
    legend.push(await ic(d, s, nm, c, x + 0.2, 1.81, 0.48));
    legend.push(d.text(s, [{ text: f, options: { color: HEX.text, fontSize: 16, breakLine: true } }, { text: t, options: { bold: true, color: c, fontSize: 22 } }], { x: x + 0.8, y: 1.68, w: lw - 0.9, h: 0.75, valign: 'middle' }));
  }
  const cards = [], answers = [];
  sc.forEach(([L, text, ti, ans], i) => {
    const y = 2.65 + i * 1.95, h = 1.8;
    const g = [box(d, s, MX, y, W - 2 * MX, h, { fill: HEX.card, line: HEX.line })];
    g.push(...numDisc(d, s, L, MX + 0.7, y + h / 2, 1.0, HEX.card2, { color: HEX.text, fontSize: 36 }));
    g.push(d.text(s, text, { x: MX + 1.45, y: y + 0.08, w: 7.0, h: h - 0.16, fontSize: 24, bold: true, color: HEX.text, valign: 'middle' }));
    cards.push(g);
    const c = QUIZ_TYPES[ti][2];
    answers.push(chip(d, s, ans, MX + 8.7, y + 0.45, W - 2 * MX - 8.9, c, { h: 0.9, fontSize: 18, color: c === HEX.amber ? HEX.ink : 'FFFFFF', align: 'center', charSpacing: 0 }));
  });
  d.animate(s, [...legend, ...cards.flat()], { auto: true, effect: 'fade' });
  d.animate(s, bt, { auto: true, effect: 'zoom', dur: 400 });
  answers.forEach((a) => d.animate(s, a, { effect: 'zoom', dur: 350 }));
  notes(s, o);
  return s;
}
async function quiz1Slide(d) {
  return quizPage(d, 1, [
    ['A', 'A program practices with flash cards and checks each guess against an answer key.', 0, 'SUPERVISED: the answer key holds the labels'],
    ['B', 'A program sorts thousands of unlabelled photos into groups.', 1, 'UNSUPERVISED: no labels, it finds groups'],
  ], {
    min: '1.0',
    build: 'The finger key and scenarios A and B show automatically. Click 1: the answer to A. Click 2: the answer to B. Read the room BEFORE each click: scan one part of the room and call the majority (“mostly one finger”); do not count.',
    say: 'Quiz time! Show me with fingers: one finger for flash cards, supervised; two for sorting or making new cards, unsupervised; three for the dog and treats, reinforcement. Hold your hand up high. Scenario A: a program practices with flash cards and checks each guess against an answer key. Fingers up! [Scan, call it, click.] Supervised: the answer key holds the labels. B: sorting thousands of unlabelled photos into groups. [Scan, call it, click.] Unsupervised.',
    terms: 'none new (reviews the three kinds of learning).',
    ask: 'Scenarios A and B. Expected: A one finger (supervised), B two (unsupervised).',
    takeaway: 'Ask “where do the answers come from?” and you can tell the kinds of learning apart.',
    caveats: 'Both scenarios are made-up examples. Do not reveal before the room answers.',
    sources: ['None needed: made-up scenarios.'],
  });
}
async function quiz2Slide(d) {
  return quizPage(d, 2, [
    ['C', 'A game bot earns points for winning and changes its moves.', 2, 'REINFORCEMENT: the points are the treats'],
    ['D', 'A program sees thousands of face photos with no names, then draws new faces.', 1, 'UNSUPERVISED: no names, it makes new cards'],
  ], {
    min: '1.0',
    build: 'The finger key and scenarios C and D show automatically. Click 1: the answer to C. Click 2: the answer to D.',
    say: 'C: a game bot earns points for winning and changes its moves. Fingers up! [Scan, call it, click.] Reinforcement: the points are the treats, like AlphaGo. D: a program sees thousands of face photos with no names, then draws new faces. [Scan, call it, click.] Two fingers: unsupervised, making new cards. Nobody gave it answers; it learned what faces look like.',
    terms: 'none new.',
    ask: 'Scenarios C and D. Expected: C three fingers, D two. If some say D is “one finger”, ask: where is the answer key? There is none: no names on the photos.',
    takeaway: 'Treats mean reinforcement; no answer key means unsupervised.',
    advanced: 'Today’s image generators are usually trained with the “remove the static” game you will see soon, which researchers call self-supervised: the picture itself is the answer key.',
    caveats: 'Both scenarios are made-up examples.',
    sources: ['None needed: made-up scenarios.'],
  });
}

// =====================================================================================
// PART 1 · NEURAL NETWORKS AND TRAINING
async function networkSlide(d) {
  const s = page(d, 'A neural network: layers of simple units');
  const img = await d.frame(s, D('cifar_cat.png'), { x: MX, y: 3.17, w: 1.9, h: 1.9 }, { pad: 0.05 });
  const imgLab = d.text(s, 'a photo: just numbers for colors', { x: MX - 0.1, y: 5.15, w: 2.1, h: 0.62, fontSize: 14, color: d.S.muted, align: 'center', valign: 'top' });
  const xs = [3.6, 5.5, 7.4, 9.3], dia = 0.52, ncy = 4.12;
  const net = drawNet(d, s, { xs, cy: ncy, gap: 0.8, layers: [4, 5, 5, 3], dia, lw: [0.75, 2.5] });
  const inArrow = seg(d, s, MX + 1.98, ncy, xs[0] - 0.4, ncy, { color: HEX.muted, width: 2.5, arrow: true });
  const layLab = [
    d.text(s, 'INPUT', { x: xs[0] - 0.8, y: 6.12, w: 1.6, h: 0.35, fontSize: 16, bold: true, color: d.S.steel, align: 'center', charSpacing: 2 }),
    d.text(s, 'HIDDEN LAYERS', { x: xs[1] - 0.4, y: 6.12, w: xs[2] - xs[1] + 0.8, h: 0.35, fontSize: 16, bold: true, color: d.S.steel, align: 'center', charSpacing: 2 }),
    d.text(s, 'OUTPUT', { x: xs[3] - 0.8, y: 6.12, w: 1.6, h: 0.35, fontSize: 16, bold: true, color: d.S.steel, align: 'center', charSpacing: 2 }),
  ];
  const lit = [];
  net.pos.forEach((col, li) => col.forEach((p, j) => {
    if (li === 3 && j > 0) return;
    lit.push({ name: oval(d, s, p.x - dia / 2, p.y - dia / 2, dia, dia, li === 3 ? HEX.red : '5A1E22', HEX.red, 1.5), delay: li * 280 });
  }));
  ['cat', 'dog', 'frog'].forEach((o, j) => lit.push({ name: d.text(s, o, { x: xs[3] + 0.42, y: net.pos[3][j].y - 0.3, w: 1.3, h: 0.6, fontSize: 28, bold: j === 0, color: j === 0 ? d.S.red : d.S.muted, valign: 'middle' }), delay: 3 * 280 }));
  const each = d.text(s, [{ text: 'Each circle, a “neuron”: ', options: { bold: true, color: HEX.text } }, { text: 'adds up what comes in, passes a signal on', options: { color: HEX.muted } }], { x: 3.1, y: 1.65, w: 9.6, h: 0.5, fontSize: 20, valign: 'middle' });
  src(d, s, 'Cat: CIFAR-10 (A. Krizhevsky) · the network is a drawing (real ones have far more neurons)');
  d.animate(s, [...img, imgLab, inArrow, ...net.lines, ...net.nodes.flat(), ...layLab, each], { auto: true, effect: 'fade', dur: 700 });
  d.animate(s, lit, { effect: 'fade', dur: 300 });
  notes(s, {
    min: '1.0',
    build: 'The network and the “each circle” line show automatically. Click 1: the signal lights the layers left to right and the output says “cat”.',
    say: 'Here is the “deep” in deep learning. A neural network is layers of tiny simple units called neurons, joined by connections. A photo goes in on the left as numbers: just pixel colors. [Click.] The signal flows through, layer by layer: each neuron adds up what comes in and passes a signal on. The middle columns are called hidden layers. Out the right side comes an answer: “cat”. “Deep” just means many layers.',
    analogy: 'A relay of very simple workers, each passing a note along.',
    terms: 'neural network, neuron (a tiny unit that adds up signals; an idea borrowed loosely from brains, not a brain), layer (one column of neurons), hidden layers (the middle columns).',
    takeaway: 'A neural network is layers of simple units passing signals along.',
    advanced: 'In words: each unit adds up its inputs, each multiplied by a dial, then squashes the result before passing it on.',
    caveats: 'The drawing is a schematic; real networks have far more neurons. The cat is a real CIFAR-10 image.',
    sources: ['https://www.3blue1brown.com/lessons/neural-networks', 'https://www.cs.toronto.edu/~kriz/cifar.html'],
  });
  return s;
}

async function dialsSlide(d) {
  const s = page(d, 'Every connection is a dial', { transition: 'push' });
  const mix = await d.frame(s, D('console_crop.jpg'), { x: MX, y: 1.7, w: 8.3, h: 4.75 }, { pad: 0.06, align: 'left' });
  const rx = mix.geom.x + mix.geom.w + 0.45, rw = W - MX - rx;
  const t = [await ic(d, s, 'FaSlidersH', HEX.amber, rx, 1.85, 0.75),
    d.text(s, [{ text: 'Each connection has a dial, ', options: { bold: true, color: HEX.text } }, { text: 'called a weight', options: { bold: true, color: HEX.amber } }], { x: rx, y: 2.75, w: rw, h: 1.4, fontSize: 26, fontFace: 'Arial', valign: 'top' })];
  const t2 = [box(d, s, rx, 4.35, rw, 2.1, { fill: TINT.red, line: HEX.red, lw: 1.25 }),
    d.text(s, [{ text: 'Right settings: ', options: { bold: true, color: HEX.text } }, { text: '“cat” for cats. ', options: { color: HEX.text } }, { text: 'Learning ', options: { bold: true, color: HEX.red } }, { text: 'means finding good settings.', options: { color: HEX.text } }], { x: rx + 0.22, y: 4.35, w: rw - 0.4, h: 2.1, fontSize: 22, valign: 'middle' })];
  src(d, s, 'Photo: Dejan Krsmanovic, CC BY 2.0, via Wikimedia Commons (cropped)');
  d.animate(s, [...mix, ...t], { auto: true, effect: 'fade' });
  d.animate(s, t2, { effect: 'rise' });
  notes(s, {
    min: '0.5',
    build: 'The mixing board and “each connection has a dial” show automatically. Click 1: “learning means finding good settings”.',
    say: 'Every connection has a weight: a dial that sets how strongly one signal pushes the next, like a slider on a mixing board. [Click.] Set the dials right and it says “cat” for cats; set them wrong and it says nonsense. Learning means finding good settings.',
    analogy: 'A mixing board: every slider changes the sound a little.',
    terms: 'weight (a dial on one connection), parameters (all the dials together).',
    takeaway: 'Learning means finding good settings for the dials.',
    caveats: 'The mixing console is a real photo (cropped to the faders).',
    sources: ['https://commons.wikimedia.org/wiki/File:Modern_Mixing_Console_(32961446438).jpg (Dejan Krsmanovic, CC BY 2.0)'],
  });
  return s;
}

async function howManySlide(d) {
  const s = page(d, 'How many dials? From thousands to trillions');
  const rows = [
    ['1998', 'LeNet-5, a handwriting reader', '60,000', HEX.muted],
    ['2012', 'AlexNet, the photo contest winner', '60 million', HEX.text],
    ['2020', 'GPT-3, OpenAI', '175 billion', HEX.amber],
    ['2026', 'Kimi K2.5, an open model', '1.04 trillion', HEX.red],
  ];
  const groups = [], rw = 8.4, rh = 0.92, y0 = 1.7;
  for (let i = 0; i < rows.length; i++) {
    const [yr, who, n, c] = rows[i], y = y0 + i * (rh + 0.12);
    const g = [box(d, s, MX, y, rw, rh, { fill: i === 3 ? TINT.red : HEX.card, line: i === 3 ? HEX.red : HEX.line })];
    g.push(d.text(s, yr, { x: MX + 0.25, y, w: 1.0, h: rh, fontSize: 22, bold: true, color: HEX.steel, valign: 'middle' }));
    g.push(d.text(s, who, { x: MX + 1.3, y, w: 3.7, h: rh, fontSize: 18, color: HEX.text, valign: 'middle' }));
    g.push(d.text(s, n, { x: MX + 4.9, y, w: rw - 5.1, h: rh, fontSize: 34, bold: true, color: c, fontFace: 'Arial', align: 'right', valign: 'middle' }));
    groups.push(g);
  }
  const note = d.text(s, 'Kimi’s 1.04 trillion is a total: it uses about 32 billion for each word. Closed models: no public count found.', { x: MX, y: 5.95, w: rw, h: 0.5, fontSize: 14, italic: true, color: HEX.muted, valign: 'top' });
  const rx = MX + rw + 0.35, rcw = W - MX - rx;
  const think = [box(d, s, rx, 1.7, rcw, 4.68, { fill: HEX.card2, line: HEX.amber, lw: 1.25 }),
    await ic(d, s, 'FaSlidersH', HEX.amber, rx + 0.3, 1.95, 0.7),
    d.text(s, 'A mixing board with a trillion knobs: could you set them by hand?', { x: rx + 0.3, y: 2.85, w: rcw - 0.6, h: 2.0, fontSize: 24, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'top' }),
    d.text(s, 'One knob a second: tens of thousands of years.', { x: rx + 0.3, y: 4.95, w: rcw - 0.6, h: 1.2, fontSize: 18, color: HEX.amber, valign: 'top' })];
  src(d, s, 'LeCun et al. (1998) · Krizhevsky et al. (2012) · GPT-3 paper (2020) · Kimi K2.5 paper (2026)');
  d.animate(s, [...groups[0]], { auto: true, effect: 'fade' });
  d.animate(s, groups[1], { effect: 'rise' });
  d.animate(s, groups[2], { effect: 'rise' });
  d.animate(s, [...groups[3], note, ...think], { effect: 'rise' });
  notes(s, {
    min: '0.75',
    build: '1998 shows automatically. Click 1: 2012. Click 2: 2020. Click 3: 2026, the note that Kimi’s count is a total, and the mixing-board question.',
    say: 'How many dials? In 1998, a network that read handwritten digits had about 60,000. [Click.] In 2012, AlexNet, which won a big photo contest, had 60 million. [Click.] GPT-3, an OpenAI model from 2020, had 175 billion. [Click.] Kimi K2.5, an open model from this year, has 1.04 trillion in total, though it only uses about 32 billion of them for each word. For closed models we found no public count. A mixing board with a trillion knobs: could you set them by hand? No: at one knob a second it would take tens of thousands of years. That is why the computer has to learn the settings.',
    terms: 'open model (anyone can download its dial settings) vs closed model (only its company runs it).',
    ask: 'Spoken only: “Could you set a trillion knobs by hand?” Expected: no.',
    takeaway: 'Today’s big models have billions to trillions of dials, far too many to set by hand.',
    advanced: 'LeNet-5: about 60,000 trainable parameters. Many 2025–26 open models are “mixture of experts”: Kimi K2.5 has 1.04 trillion dials but uses only 32 billion for each word. One dial per second for a trillion dials is about 32,000 years (our arithmetic).',
    caveats: 'Say “we found no public count” for closed models, not “they never publish”: the research checked specific models (GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, GPT-6 Astra; Epoch AI leaves those fields blank).',
    sources: ['http://vision.stanford.edu/cs598_spring07/papers/Lecun98.pdf (LeNet-5, 60,000 parameters)', 'https://papers.nips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf (AlexNet, 60 million)', 'https://arxiv.org/pdf/2005.14165 (GPT-3: 175 billion)', 'https://arxiv.org/pdf/2602.02276 (Kimi K2.5: 1.04 trillion total, 32 billion activated)', 'https://epoch.ai/data/notable-ai-models'],
  });
  return s;
}

// The foggy hill, shared by the next three slides (a drawing, not real data)
function hill(d, s, { gx, gy, gw, gh }) {
  const tm = 0.66;
  const curve = (t) => {
    const g = t < tm ? Math.pow((tm - t) / tm, 2) : 0.38 * Math.pow((t - tm) / (1 - tm), 2);
    return { x: gx + 0.1 + (gw - 0.2) * t, y: gy + gh - 0.45 - (gh - 0.9) * g };
  };
  const pts = [];
  for (let i = 0; i <= 60; i++) { const p = curve(i / 60); pts.push({ x: p.x - gx, y: p.y - gy }); }
  pts.push({ x: gw - 0.1, y: gh }, { x: 0.1, y: gh }, { close: true });
  const ground = d.name('hill');
  s.addShape(d.pres.shapes.CUSTOM_GEOMETRY || 'custGeom', { x: gx, y: gy, w: gw, h: gh, points: pts, fill: { color: HEX.card2 }, line: { color: HEX.steel, width: 1.5 }, objectName: ground });
  return { ground, curve, tm };
}
async function lossSlide(d) {
  const s = page(d, 'First, a score for how wrong: the loss');
  const H = hill(d, s, { gx: MX, gy: 2.05, gw: 8.0, gh: 4.4 });
  const axis = label(d, s, 'HIGHER UP: MORE WRONG', MX, 1.65, 6, { color: d.S.steel, size: 16 });
  // Nov 6 fix pass: the axis label sits inside the hill's bottom-left corner (it touched the box edge), and the fog caption
  // sits to the right of the fog, not under it
  const xLab = d.text(s, 'one dial’s setting →', { x: MX + 0.2, y: 5.95, w: 3.3, h: 0.36, fontSize: 16, color: d.S.steel, align: 'left' });
  const fog = [[0.8, 2.3, 4.0, 1.6], [3.0, 2.9, 3.4, 1.4], [0.7, 3.6, 2.7, 1.1]].map(([x, y, w, h]) => {
    const n = d.name('fog');
    s.addShape(d.pres.shapes.OVAL, { x, y, w, h, fill: { color: 'B8C0CC', transparency: 88 }, line: { color: 'B8C0CC', width: 0, transparency: 100 }, objectName: n });
    return n;
  });
  const h0 = H.curve(0.08), hs = 0.75;
  const hiker = await ic(d, s, 'FaHiking', HEX.text, h0.x, h0.y - hs - 0.02, hs);
  const fogLab = d.text(s, 'thick fog: you can only feel the ground under your feet', { x: 5.0, y: 2.05, w: 3.5, h: 0.8, fontSize: 18, italic: true, color: 'C9D1D9', valign: 'top' });
  const rx = 9.0, rw = W - MX - rx;
  const c1 = await statCard(d, s, { x: rx, y: 1.75, w: rw, h: 2.2, icon: 'FaBullseye', color: HEX.red, tint: TINT.red, head: 'How wrong?', sub: 'One score: the loss. Lower is better.', headSize: 26, subSize: 18 });
  const c2 = await statCard(d, s, { x: rx, y: 4.2, w: rw, h: 2.2, icon: 'FaHiking', color: HEX.amber, tint: TINT.amber, head: 'You are the hiker.', sub: 'Goal: the bottom of the valley.', headSize: 26, subSize: 18 });
  src(d, s, 'The hill is a drawing, not real data');
  d.animate(s, [H.ground, axis, xLab, ...c1], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, [...fog, fogLab, hiker, ...c2], { effect: 'fade' });
  notes(s, {
    min: '0.5',
    build: 'The hill and “How wrong?” show automatically. Click 1: the fog, the hiker and “you are the hiker”.',
    say: 'So how does the computer find good settings for a trillion dials? First it needs a score for how wrong it is. That score is called the loss: higher up this hill means more wrong. [Click.] Now imagine you are a hiker on this hill in thick fog. You cannot see the valley. You can only feel the ground under your feet. Your goal: the bottom.',
    analogy: 'A hiker in thick fog who can only feel the ground under their feet.',
    terms: 'loss (one score for how wrong the model is; lower is better).',
    takeaway: 'Training starts with a score for how wrong the model is.',
    caveats: 'The hill is a drawing with no real numbers (said on the slide).',
    sources: ['https://www.3blue1brown.com/lessons/gradient-descent'],
  });
  return s;
}

async function slopeSlide(d) {
  const s = page(d, 'Feel the slope in every direction', { transition: 'push' });
  const rc = { x: 3.15, y: 4.05 }, rl = 2.0;
  const base = [oval(d, s, rc.x - rl - 0.25, rc.y - rl - 0.25, 2 * rl + 0.5, 2 * rl + 0.5, HEX.card, HEX.steel, 1.25)];
  const arrows = [];
  for (let k = 0; k < 8; k++) {
    if (k === 1) continue;
    const a = k * Math.PI / 4;
    arrows.push(seg(d, s, rc.x + Math.cos(a) * 0.3, rc.y + Math.sin(a) * 0.3, rc.x + Math.cos(a) * rl, rc.y + Math.sin(a) * rl, { color: HEX.muted, width: 3, arrow: true }));
  }
  base.push(...arrows, oval(d, s, rc.x - 0.16, rc.y - 0.16, 0.32, 0.32, HEX.text, HEX.text));
  base.push(await ic(d, s, 'FaHiking', HEX.text, rc.x - 0.3, rc.y - 0.85, 0.5));
  const a1 = Math.PI / 4;
  const down = [seg(d, s, rc.x + Math.cos(a1) * 0.3, rc.y + Math.sin(a1) * 0.3, rc.x + Math.cos(a1) * rl, rc.y + Math.sin(a1) * rl, { color: HEX.red, width: 7, arrow: true }),
    d.text(s, 'the way down', { x: rc.x + 1.62, y: rc.y + 1.15, w: 2.2, h: 0.5, fontSize: 22, bold: true, color: HEX.red, valign: 'middle' })];
  const rx = 7.0, rw = W - MX - rx;
  const t1 = d.text(s, 'Forward, back, left, right, and everything in between: one way goes down the most.', { x: rx, y: 1.8, w: rw, h: 1.5, fontSize: 22, color: HEX.text, valign: 'top' });
  const grad = [box(d, s, rx, 3.45, rw, 2.95, { fill: TINT.amber, line: HEX.amber, lw: 1.5 }),
    d.text(s, [
      { text: 'The gradient:', options: { bold: true, color: HEX.amber, fontSize: 34, fontFace: 'Arial', breakLine: true } },
      { text: 'the slope in higher dimensions', options: { bold: true, color: HEX.text, fontSize: 30, fontFace: 'Arial', breakLine: true, paraSpaceAfter: 10 } },
      { text: 'One direction for every dial: a trillion dials, a trillion directions.', options: { color: HEX.text, fontSize: 18 } },
    ], { x: rx + 0.3, y: 3.5, w: rw - 0.55, h: 2.85, valign: 'middle' })];
  src(d, s, 'A drawing of the idea: eight of the directions you could step in');
  d.animate(s, [...base, t1], { auto: true, effect: 'fade' });
  d.animate(s, down, { effect: 'zoom', dur: 450 });
  d.animate(s, grad, { effect: 'rise' });
  notes(s, {
    min: '1.0',
    build: 'The compass of arrows around the hiker and the first line show automatically. Click 1: the red arrow, “the way down”. Click 2: the gradient box.',
    say: 'Standing in the fog, you feel the slope in every direction at once: forward, back, left, right, and everything in between. [Click.] One way goes down the most: the red arrow. [Click.] That is the gradient: the slope in higher dimensions. It tells us which way is downhill. Each dial is one direction you could step in. With two dials you get a map; with a trillion dials, a trillion directions. That is what “higher dimensions” means.',
    analogy: 'The hiker in fog feels the ground in every direction and picks the steepest way down.',
    terms: 'gradient (on the slide: the slope in higher dimensions, the slope in many directions at once, which tells us which way is downhill; one direction per dial).',
    takeaway: 'The gradient tells every dial which way is downhill.',
    advanced: 'In words only: with a trillion dials, the hill has a trillion directions. We cannot picture that, but the idea is the same: feel the slope in every direction, step the way that goes down most.',
    caveats: 'A drawing; no numbers. Keep the no-math rule: say only “the slope in higher dimensions”.',
    sources: ['https://www.3blue1brown.com/lessons/gradient-descent', 'https://www.youtube.com/watch?v=IHZwWFHWa-w (3Blue1Brown, chapter 2)'],
  });
  return s;
}

async function stepsSlide(d) {
  const s = page(d, 'Small step downhill. Feel again. Repeat.');
  const H = hill(d, s, { gx: MX, gy: 1.8, gw: 7.6, gh: 4.65 });
  const h0 = H.curve(0.08), hs = 0.65;
  const hiker = await ic(d, s, 'FaHiking', HEX.text, h0.x, h0.y - hs - 0.02, hs);
  const steps = [0.2, 0.31, 0.4, 0.48, 0.55, 0.6, 0.64].map((t, i) => { const p = H.curve(t); return { name: oval(d, s, p.x - 0.11, p.y - 0.24, 0.22, 0.22, HEX.red, HEX.red), delay: i * 220, effect: 'zoom', dur: 260 }; });
  const pm = H.curve(H.tm);
  const flag = [{ name: await ic(d, s, 'FaFlag', HEX.teal, pm.x - 0.1, pm.y - 0.7, 0.6), delay: 1600 },
    { name: d.text(s, 'lowest point: fewest mistakes', { x: pm.x - 1.8, y: pm.y + 0.08, w: 3.6, h: 0.4, fontSize: 18, bold: true, color: HEX.teal, align: 'center' }), delay: 1600 }];
  const rx = 8.65, rw = W - MX - rx;
  const askBox = [box(d, s, rx, 1.75, rw, 1.5, { fill: HEX.card2, line: HEX.red, lw: 1.25 })];
  askBox.push(...await beatTag(d, s, 'HANDS UP', 'FaHandPaper', rx + 0.2, 1.9));
  askBox.push(d.text(s, 'Steps way too big: what goes wrong?', { x: rx + 0.2, y: 2.3, w: rw - 0.35, h: 0.85, fontSize: 22, bold: true, color: HEX.text, valign: 'middle' }));
  // the answer, drawn: a small valley with steps so big they bounce from side to side
  const ans = [box(d, s, rx, 3.45, rw, 3.0, { fill: TINT.red, line: HEX.red, lw: 1.25 })];
  const V = hill(d, s, { gx: rx + 0.25, gy: 3.55, gw: rw - 0.5, gh: 2.1 });
  ans.push(V.ground);
  const bt = [0.04, 0.97, 0.12, 0.9, 0.25].map((u) => V.curve(u));
  for (let i = 0; i < bt.length - 1; i++) ans.push(seg(d, s, bt[i].x, bt[i].y - 0.08, bt[i + 1].x, bt[i + 1].y - 0.08, { color: HEX.red, width: 2.5, arrow: true }));
  ans.push(d.text(s, [{ text: 'Too big: ', options: { bold: true, color: HEX.red } }, { text: 'you jump over the valley and bounce. ', options: { color: HEX.text } }, { text: 'Too small: ', options: { bold: true, color: HEX.amber } }, { text: 'it takes forever.', options: { color: HEX.text } }], { x: rx + 0.2, y: 5.62, w: rw - 0.35, h: 0.8, fontSize: 17, valign: 'middle' }));
  src(d, s, 'The hills are drawings, not real data');
  d.animate(s, [H.ground, hiker], { auto: true, effect: 'fade' });
  d.animate(s, [...steps, ...flag], { effect: 'fade' });
  d.animate(s, askBox, { effect: 'fade' });
  d.animate(s, ans, { effect: 'rise' });
  notes(s, {
    min: '0.75',
    build: 'The hill and the hiker show automatically. Click 1: small steps down to the lowest point. Click 2: the hands-up question. Click 3: the answer, drawn (steps so big they bounce across the valley).',
    say: 'So you take a small step downhill, feel again, take another step. [Click.] Step by step until you reach the lowest point: the fewest mistakes. That is training: feel the slope, small step downhill, repeat, many, many times. [Click.] Hands up: what goes wrong if your steps are way too big? [Take one or two answers.] [Click.] You jump right over the valley and bounce from side to side. Too small, and it takes forever.',
    terms: 'training (feel the slope, small step downhill, repeat).',
    ask: 'On the slide: “Steps way too big: what goes wrong?” Hands up, take one or two answers (about 20 seconds), then click. Expected: you jump over the valley, or bounce back and forth.',
    takeaway: 'Training means: measure how wrong, feel which way is downhill, take a small step, repeat.',
    caveats: 'Both hills are drawings. (The Nov 5 version showed a Wikimedia Commons map of the steps; it was dropped because its printed labels are math symbols.)',
    sources: ['https://www.3blue1brown.com/lessons/gradient-descent'],
  });
  return s;
}

async function landscapeSlide(d) {
  const s = page(d, 'Real hills are bumpy', { transition: 'push' });
  const gw = (W - 2 * MX - 0.4) / 2;
  const a = await d.frame(s, R('gd-lossland-li2018-noshortLogRotatedLower.png'), { x: MX, y: 1.7, w: gw, h: 3.9 }, { pad: 0.08 });
  const aT = d.text(s, [{ text: 'Bumpy: ', options: { bold: true, color: HEX.red } }, { text: 'easy to get stuck in a dip', options: { color: HEX.text } }], { x: MX, y: 5.72, w: gw, h: 0.6, fontSize: 22, align: 'center', valign: 'middle' });
  const bx = MX + gw + 0.4;
  const b = await d.frame(s, R('gd-lossland-li2018-shortHighResLog.png'), { x: bx, y: 1.7, w: gw, h: 3.9 }, { pad: 0.08 });
  const bT = d.text(s, [{ text: 'After a design fix: ', options: { bold: true, color: HEX.teal } }, { text: 'one smooth valley', options: { color: HEX.text } }], { x: bx, y: 5.72, w: gw, h: 0.6, fontSize: 22, align: 'center', valign: 'middle' });
  src(d, s, 'Li et al., “Visualizing the Loss Landscape of Neural Nets” (2018), Fig. 1: one 56-layer network without and with “skip connections”');
  d.animate(s, [...a, aT], { auto: true, effect: 'fade' });
  d.animate(s, [...b, bT], { effect: 'fade' });
  notes(s, {
    min: '0.5',
    build: 'The bumpy landscape shows automatically. Click 1: the smooth one.',
    say: 'My hill was smooth. Real ones are not. Researchers found a way to draw a real network’s hill, squashed down into a picture: it is full of bumps and dips where the hiker can get stuck. [Click.] Change the network’s design, and the same kind of network gets one smooth valley. Part of the craft of AI is shaping the hill so training can find the bottom.',
    analogy: 'The same hike on a rocky mountain versus a smooth bowl.',
    terms: 'landscape (the shape of the loss hill over all the dial settings).',
    takeaway: 'Real loss landscapes can be bumpy; design choices make them easier to train.',
    advanced: 'The pictures are a 3D slice of a landscape with millions of directions: the researchers pick two random directions in dial-space and draw the loss along them. The fix shown is “skip connections”, which let signals jump over layers (ResNet).',
    caveats: 'Each picture is a two-direction slice, not the whole landscape. Figure 1 of Li et al. (NeurIPS 2018; arXiv 1712.09913): ResNet-56 without (left) and with (right) skip connections; shown unedited.',
    sources: ['https://arxiv.org/abs/1712.09913 (Li et al., 2018, Fig. 1)'],
  });
  return s;
}

async function backFactorySlide(d) {
  const s = page(d, 'Backpropagation passes the blame back');
  const fl = label(d, s, 'LIKE A FACTORY LINE', MX, 1.65, 6, { color: d.S.amber, size: 16 });
  const bw = 2.6, gap = 0.6, x0 = MX + (W - 2 * MX - (4 * bw + 3 * gap)) / 2, by = 2.55, bh = 1.25;
  const fac = [fl];
  const st = [['FaCog', 'Station 1'], ['FaCog', 'Station 2'], ['FaCog', 'Station 3'], ['FaSearch', 'Inspector']];
  const bx = (i) => x0 + i * (bw + gap);
  for (let i = 0; i < 4; i++) {
    const x = bx(i), insp = i === 3;
    fac.push(box(d, s, x, by, bw, bh, { fill: insp ? TINT.red : HEX.card, line: insp ? HEX.red : HEX.line }));
    fac.push(await ic(d, s, st[i][0], insp ? HEX.red : HEX.muted, x + 0.2, by + 0.33, 0.6));
    fac.push(d.text(s, st[i][1], { x: x + 0.9, y: by, w: bw - 0.95, h: bh, fontSize: 22, bold: true, color: insp ? HEX.red : HEX.text, valign: 'middle' }));
    if (i < 3) fac.push(seg(d, s, x + bw + 0.08, by + bh / 2, x + bw + gap - 0.08, by + bh / 2, { color: HEX.steel, width: 2.5, arrow: true }));
  }
  const stamp = [box(d, s, bx(3) + 0.55, by - 0.5, 2.0, 0.7, { fill: HEX.red, line: 'FFFFFF', lw: 2, radius: 0.04, rotate: -8 }),
    d.text(s, 'DEFECT!', { x: bx(3) + 0.55, y: by - 0.5, w: 2.0, h: 0.7, fontSize: 28, bold: true, color: 'FFFFFF', fontFace: 'Arial', align: 'center', valign: 'middle', rotate: -8 })];
  const ay = by + bh + 0.4, blame = [];
  for (let i = 3; i > 0; i--) blame.push({ name: seg(d, s, bx(i) + bw * 0.35, ay, bx(i - 1) + bw * 0.65, ay, { color: HEX.red, width: 4.5, arrow: true }), delay: (3 - i) * 420 });
  [['a little', 0.5], ['some', 1.1], ['a lot', 1.8]].forEach(([t, len], i) => {
    const yb = ay + 0.35;
    blame.push({ name: rect(d, s, bx(i) + 0.1, yb, len, 0.45, HEX.red), delay: (2 - i) * 420 + 200, effect: 'wipeLeft' });
    blame.push({ name: d.text(s, t, { x: bx(i) + 0.2 + len, y: yb - 0.04, w: bw - len - 0.1, h: 0.52, fontSize: 22, bold: true, color: HEX.red, valign: 'middle' }), delay: (2 - i) * 420 + 300 });
  });
  const fix = d.text(s, 'Each station now knows how much to change.', { x: MX, y: 5.75, w: W - 2 * MX, h: 0.6, fontSize: 24, bold: true, color: HEX.text, align: 'center', valign: 'middle' });
  blame.push({ name: fix, delay: 1300 });
  src(d, s, 'A drawing of the idea: the blame bars are not real values');
  d.animate(s, fac, { auto: true, effect: 'fade' });
  d.animate(s, stamp, { effect: 'slam', dur: 350 });
  d.animate(s, blame, { effect: 'fade', dur: 350 });
  notes(s, {
    min: '0.5',
    build: 'The factory line shows automatically. Click 1: the inspector stamps “DEFECT!”. Click 2: the blame is passed back, station 3 to 2 to 1 (a lot, some, a little), and “each station now knows how much to change”.',
    say: 'The hiker needs to know which way is downhill for every dial. How does the computer find that out? Picture a factory line: three stations, then an inspector. [Click.] The inspector finds a defect. [Click.] The blame is passed back down the line: station 3 caused a lot of it, station 2 some, station 1 a little. Each station now knows how much to change.',
    analogy: 'A factory line where the final inspector passes the blame back to each station: a lot, some, a little.',
    terms: 'backpropagation (backprop: sending the blame for a mistake backwards through the layers), error (the mistake).',
    takeaway: 'Backpropagation passes the blame for a mistake back to everyone who caused it.',
    caveats: 'The arrows and blame bars are a drawing, not real values.',
    sources: ['https://www.youtube.com/watch?v=Ilg3gGewQ5U (3Blue1Brown, “Backpropagation, intuitively”)'],
  });
  return s;
}

async function backNetSlide(d) {
  const s = page(d, 'One backward sweep tunes every dial', { transition: 'push' });
  const xs = [1.3, 3.2, 5.1, 7.0], dia = 0.46;
  const net = drawNet(d, s, { xs, cy: 4.15, gap: 0.78, layers: [3, 4, 4, 2], dia, lw: [0.6, 2.0] });
  const wrong = oval(d, s, xs[3] - dia / 2, net.pos[3][1].y - dia / 2, dia, dia, HEX.red, HEX.red);
  const outT = [
    d.text(s, 'answer: “cat”', { x: xs[3] + 0.4, y: net.pos[3][0].y - 0.28, w: 2.2, h: 0.5, fontSize: 20, color: HEX.muted, valign: 'middle' }),
    d.text(s, 'said “dog”', { x: xs[3] + 0.4, y: net.pos[3][1].y - 0.24, w: 2.2, h: 0.5, fontSize: 20, bold: true, color: HEX.red, valign: 'middle' }),
  ];
  const netArrows = [];
  for (let i = 3; i > 0; i--) netArrows.push({ name: seg(d, s, xs[i] - 0.2, 2.2, xs[i - 1] + 0.2, 2.2, { color: HEX.red, width: 5, arrow: true }), delay: (3 - i) * 380, effect: 'wipeLeft' });
  netArrows.push({ name: d.text(s, 'the blame flows back, layer by layer', { x: 1.0, y: 1.65, w: 6.5, h: 0.4, fontSize: 18, bold: true, color: HEX.red, align: 'center' }), delay: 0 });
  const rx = 9.3, rw = W - MX - rx;
  const one = d.text(s, 'Every dial learns which way to turn, all at once.', { x: rx, y: 1.75, w: rw, h: 1.6, fontSize: 24, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'top' });
  const hist = [await ic(d, s, 'FaBookOpen', HEX.steel, rx, 3.55, 0.42),
    d.text(s, 'Made famous in 1986 by Rumelhart, Hinton and Williams', { x: rx + 0.55, y: 3.45, w: rw - 0.55, h: 0.9, fontSize: 16, color: d.S.steel, valign: 'middle' })];
  const think = [box(d, s, rx, 4.65, rw, 1.75, { fill: HEX.card2, line: HEX.amber }),
    ...await beatTag(d, s, 'THINK ABOUT IT', 'FaLightbulb', rx + 0.18, 4.8),
    d.text(s, 'Why not test each dial one at a time?', { x: rx + 0.18, y: 5.25, w: rw - 0.3, h: 1.05, fontSize: 20, bold: true, color: HEX.text, valign: 'middle' })];
  src(d, s, 'Rumelhart, Hinton & Williams, “Learning representations by back-propagating errors”, Nature, Oct 1986');
  d.animate(s, [...net.lines, ...net.nodes.flat(), wrong, ...outT, one], { auto: true, effect: 'fade' });
  d.animate(s, [...netArrows, ...hist, ...think], { effect: 'fade', dur: 400 });
  notes(s, {
    min: '0.5',
    build: 'The network, its wrong answer and the summary line show automatically. Click 1: the red arrows sweep back layer by layer, with the 1986 paper and the think-about-it question.',
    say: 'A neural network does the same. It said “dog”, but the answer was “cat”. [Click.] The mistake is sent backward through the network, layer by layer, and every dial learns how much it added to the mistake, and which way to turn. That is backpropagation, “backprop” for short. One backward sweep covers billions of dials at once. Think: why not just test each dial one at a time? [Pause.] With billions of dials, that would take forever.',
    terms: 'backpropagation (backprop).',
    ask: 'On the slide (THINK ABOUT IT): “Why not test each dial one at a time?” Answer it yourself after a pause: with billions of dials it would take forever.',
    takeaway: 'Backpropagation works out, in one backward sweep, how much each dial added to a mistake and which way to turn it.',
    advanced: 'If asked: it is a rule from calculus for passing blame through a chain of steps, applied layer by layer from the output back to the input. 3Blue1Brown’s chapters 3 and 4 show it with pictures.',
    caveats: 'The arrows are a drawing.',
    sources: ['https://www.nature.com/articles/323533a0 (Rumelhart, Hinton & Williams, Nature 323, 533–536, Oct 1986)', 'https://www.youtube.com/watch?v=Ilg3gGewQ5U (3Blue1Brown)'],
  });
  return s;
}

// =====================================================================================
// PART 1 · TEXT AND IMAGES
async function nextWordSlide(d) {
  const s = page(d, 'Text AI writes left to right, a word at a time');
  const bw = 1.82, bh = 1.05, bg = 0.24, by = 1.95;
  const bxs = (i) => MX + i * (bw + bg);
  const words = ['The', 'cat', 'sat', 'on', 'the'];
  const wbox = (i, t, { fill = HEX.card, line = HEX.steel, color = HEX.text, dash } = {}) => [
    box(d, s, bxs(i), by, bw, bh, { fill, line, lw: 1.5, dash }),
    d.text(s, t, { x: bxs(i), y: by, w: bw, h: bh, fontSize: 34, bold: true, color, fontFace: 'Arial', align: 'center', valign: 'middle' }),
  ];
  const first = wbox(0, words[0]);
  const blank = wbox(5, '?', { fill: TINT.amber, line: HEX.amber, color: HEX.amber, dash: 'dash' });
  const more = [];
  for (let i = 1; i < 5; i++) more.push(...wbox(i, words[i]).map((name) => ({ name, delay: (i - 1) * 380 })));
  const ax1 = bxs(5) + bw;
  const arrow = [seg(d, s, MX, by + bh + 0.3, ax1, by + bh + 0.3, { color: HEX.red, width: 3.5, arrow: true }),
    d.text(s, [{ text: 'LEFT TO RIGHT: ', options: { bold: true, color: HEX.red, charSpacing: 1 } }, { text: 'each word is guessed from all the words before it', options: { color: HEX.text } }], { x: MX, y: by + bh + 0.42, w: ax1 - MX, h: 0.5, fontSize: 22, valign: 'middle' })];
  const ask = [box(d, s, MX, 4.75, W - 2 * MX, 1.6, { fill: HEX.card2, line: HEX.red, lw: 1.25 }),
    ...await beatTag(d, s, 'HANDS UP', 'FaHandPaper', MX + 0.25, 4.95),
    d.text(s, 'The cat sat on the ___: mat, moon or pizza?', { x: MX + 0.25, y: 5.35, w: W - 2 * MX - 0.5, h: 0.9, fontSize: 32, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'middle' })];
  src(d, s, 'How chatbots write: next-token prediction (OpenAI and Microsoft documentation)');
  d.animate(s, [...first, ...blank, ...arrow], { auto: true, effect: 'fade' });
  d.animate(s, [...more, ...ask.map((name) => ({ name, delay: 1700 }))], { effect: 'wipeLeft', dur: 350 });
  notes(s, {
    min: '0.5',
    build: '“The”, the empty box and the left-to-right arrow show automatically. Click 1: “cat sat on the” appear one after another, then the hands-up question.',
    say: 'Now: how does a chatbot write? It runs on a large language model, an LLM: a neural network trained on huge amounts of text to guess the next word. It writes left to right, one word at a time. [Click.] The… cat… sat… on… the… Each new word is guessed from all the words before it. Hands up: the cat sat on the… mat? Moon? Pizza? [Three quick hands.]',
    analogy: 'Autocomplete on your phone, scaled up enormously.',
    terms: 'LLM (large language model: a neural network trained on huge amounts of text to predict the next word; first use), autoregressive (said once: left to right, each word built on the words before it).',
    ask: 'On the slide: “The cat sat on the ___: mat, moon or pizza?” Three quick hands. Expected: mostly mat; a few say pizza (good: the model sometimes picks less likely words too).',
    takeaway: 'A chatbot writes left to right, one word at a time.',
    caveats: 'Strictly, models write tokens (chunks of words); the next slide says so.',
    sources: ['https://learn.microsoft.com/agent-framework/journey/llm-fundamentals (“A large language model is a neural network trained on massive amounts of text data to predict the next token in a sequence.”)', 'https://help.openai.com/en/articles/4936856-understanding-and-counting-tokens'],
  });
  return s;
}

async function scoresSlide(d) {
  const s = page(d, 'It scores every word, and the text grades it', { transition: 'push' });
  const top = 1.7;
  const barL = [label(d, s, 'ITS SCORE FOR EACH NEXT WORD', MX, top, 7.0, { size: 16 }), label(d, s, 'A MADE-UP EXAMPLE, NOT REAL SCORES', MX, 5.85, 7.0, { color: d.S.amber, size: 14 })];
  const sc = [['mat', 5.1], ['floor', 2.9], ['sofa', 1.9], ['moon', 0.24], ['pizza', 0.15]];
  const bars = [];
  sc.forEach(([wd, len], i) => {
    const y = top + 0.5 + i * 0.72, isTop = i === 0;
    bars.push(d.text(s, wd, { x: MX, y, w: 1.3, h: 0.55, fontSize: 26, bold: isTop, color: isTop ? d.S.red : HEX.text, valign: 'middle' }));
    bars.push(rect(d, s, MX + 1.45, y + 0.07, len, 0.42, isTop ? HEX.red : HEX.steel));
  });
  const rx = 8.0, rw = W - MX - rx;
  const key = [box(d, s, rx, 1.75, rw, 2.55, { fill: TINT.teal, line: HEX.teal, lw: 1.5 }),
    d.text(s, [
      { text: 'Hide the next word. Guess. Check against the real text.', options: { color: HEX.text, bold: true, breakLine: true, paraSpaceAfter: 8 } },
      { text: 'The text is its own answer key: ', options: { color: HEX.text } },
      { text: 'self-supervised', options: { color: HEX.teal, bold: true } },
    ], { x: rx + 0.25, y: 1.8, w: rw - 0.45, h: 2.45, fontSize: 22, valign: 'middle' })];
  const tok = [label(d, s, 'IT READS IN CHUNKS CALLED TOKENS', rx, 4.6, rw, { size: 14 })];
  ['un', 'believ', 'able'].forEach((t, i) => {
    const x = rx + [0, 1.05, 2.6][i], w = [0.95, 1.45, 1.2][i];
    tok.push(box(d, s, x, 5.05, w, 0.7, { fill: ['1E3A5F', '3A2A12', '2A1416'][i], line: [HEX.blue, HEX.amber, HEX.red][i], radius: 0.05 }));
    tok.push(d.text(s, t, { x, y: 5.05, w, h: 0.7, fontSize: 24, bold: true, color: HEX.text, align: 'center', valign: 'middle', fontFace: 'Courier New' }));
  });
  tok.push(d.text(s, '(one possible split)', { x: rx, y: 5.85, w: rw, h: 0.4, fontSize: 14, color: d.S.steel, valign: 'middle' }));
  src(d, s, 'Bars: a made-up example, not real model scores · tokens: OpenAI Help Center');
  d.animate(s, [...barL, ...bars], { auto: true, effect: 'fade' });
  d.animate(s, key, { effect: 'rise' });
  d.animate(s, tok, { effect: 'fade' });
  notes(s, {
    min: '0.5',
    build: 'The made-up scores show automatically. Click 1: “the text is its own answer key: self-supervised”. Click 2: tokens.',
    say: 'For every possible next word, the model gives a score. This is a made-up example: mat scores highest. You just did what the model does. [Click.] And notice where the answer key came from: the text itself. Hide the next word, guess it, check it against the real text. Nobody had to write labels. That is self-supervised learning: one kind of unsupervised learning, where the data makes its own answer key. [Click.] One detail: models read text in chunks called tokens: often a whole word, sometimes a piece, like “un”, “believ”, “able”.',
    terms: 'token (a chunk of text, often a word or part of one), self-supervised learning (the data is its own answer key).',
    takeaway: 'Guessing the next word of real text needs no labels: the text is its own answer key.',
    advanced: 'Models do not always pick the top word; they sample, so the same question can get different answers. Anthropic (Mar 27, 2025) found Claude plans ahead: before writing the second line of a rhyming poem, it had already picked the rhyme word. OpenAI’s rule of thumb: one token is about three-quarters of an English word.',
    caveats: 'The bars are a made-up example (labelled). “un / believ / able” is one possible split; real tokenizers differ. Experts disagree on whether next-word prediction amounts to “understanding”.',
    sources: ['https://help.openai.com/en/articles/4936856-understanding-and-counting-tokens', 'https://www.anthropic.com/research/tracing-thoughts-language-model', 'https://arxiv.org/abs/2111.06377 (MAE: GPT-style models as self-supervised pre-training)'],
  });
  return s;
}

const ddimFile = (n) => (have(D('ddim_01.jpg')) ? D(`ddim_${String(n).padStart(2, '0')}.jpg`) : D(`illus_${DDIM_STEPS.indexOf(n)}.png`));
const DDIM_SRC = 'Castle: Benlisquare, X-Y plot of DDIM diffusion steps (Stable Diffusion v1-5), CC BY-SA 4.0, Wikimedia Commons (cropped)';
async function staticSlide(d) {
  const s = page(d, 'Image AI starts from static and cleans it up');
  const p = await d.frame(s, ddimFile(1), { x: MX, y: 1.7, w: 3.6, h: 4.75 }, { pad: 0.06, align: 'left' });
  const pl = chip(d, s, '1 step', p.geom.x + p.geom.w / 2 - 0.75, p.geom.y + p.geom.h - 0.68, 1.5, HEX.ink, { h: 0.5, fontSize: 22 });
  const rx = p.geom.x + p.geom.w + 0.6, rw = W - MX - rx;
  const t1 = d.text(s, [
    { text: 'Like an old TV with no signal. ', options: { bold: true, color: HEX.text } },
    { text: 'Each clean-up pass is called a step. This picture got just one.', options: { color: HEX.text } },
  ], { x: rx, y: 1.8, w: rw, h: 1.55, fontSize: 24, valign: 'top' });
  const q = [box(d, s, rx, 3.65, rw, 2.75, { fill: HEX.card2, line: HEX.red, lw: 1.25 }),
    ...await beatTag(d, s, 'GUESS FIRST', 'FaQuestionCircle', rx + 0.25, 3.85),
    d.text(s, 'When does the castle appear: after 3, 8 or 20 steps?', { x: rx + 0.25, y: 4.3, w: rw - 0.5, h: 1.15, fontSize: 28, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'middle' }),
    d.text(s, 'Show 1, 2 or 3 fingers.', { x: rx + 0.25, y: 5.5, w: rw - 0.5, h: 0.6, fontSize: 22, bold: true, color: HEX.amber, valign: 'middle' })];
  src(d, s, DDIM_SRC);
  d.animate(s, [...p, ...pl, t1, ...q], { auto: true, effect: 'fade' });
  notes(s, {
    min: '0.5',
    build: 'No clicks: the 1-step picture and the guess show on their own.',
    say: 'Text AI writes left to right. Image AI works a different way: it starts from static, like an old TV with no signal, and cleans it up a little at a time. Each clean-up pass is called a step. This picture got just 1 step. Guess first: when does the castle appear? After 3 steps, hold up 1 finger; after 8, 2 fingers; after 20, 3 fingers. [Scan the room and say the majority, about 10 seconds.]',
    terms: 'step (one clean-up pass).',
    ask: 'On the slide (GUESS FIRST): “When does the castle appear: after 3, 8 or 20 steps? Show 1, 2 or 3 fingers.” A finger vote, about 10 seconds. Expected: a spread; the outline shows up within a few steps, the details last.',
    takeaway: 'Image AI starts from static.',
    caveats: 'Each panel on this and the next slide is a separate run made with that many clean-up steps (same prompt), not frames of one run.',
    sources: ['https://commons.wikimedia.org/wiki/File:X-Y_plot_of_algorithmically-generated_AI_art_of_European-style_castle_in_Japan_demonstrating_DDIM_diffusion_steps.png (Benlisquare, CC BY-SA 4.0)'],
  });
  return s;
}

async function stripSlide(d) {
  const s = page(d, 'Cleaned up a little, again and again', { transition: 'push' });
  const files = DDIM_STEPS.map(ddimFile);
  const nat = await imgSize(files[0]), a = nat.w / nat.h;
  const pw = Math.min(3.55 * a, (W - 2 * MX - 4 * 0.3) / 5), ph = pw / a, gap = (W - 2 * MX - 5 * pw) / 4, py = 1.75;
  const px = (i) => MX + i * (pw + gap);
  const panels = [];
  for (let i = 0; i < 5; i++) {
    const g = await d.frame(s, files[i], { x: px(i), y: py, w: pw, h: ph }, { pad: 0.04 });
    const n = DDIM_STEPS[i];
    g.push(d.text(s, `${n} step${n > 1 ? 's' : ''}`, { x: px(i) - 0.2, y: py + ph + 0.05, w: pw + 0.4, h: 0.45, fontSize: 24, bold: true, color: i === 4 ? HEX.amber : HEX.text, align: 'center', valign: 'top' }));
    panels.push(g);
  }
  const ay = py + ph + 0.68;
  const arrow = [seg(d, s, MX, ay, W - MX, ay, { color: HEX.amber, width: 3.5, arrow: true }),
    d.text(s, [{ text: 'This is called diffusion: ', options: { bold: true, color: HEX.amber } }, { text: 'a castle in Japan that never existed', options: { color: HEX.text } }], { x: MX, y: ay + 0.1, w: W - 2 * MX, h: 0.5, fontSize: 22, valign: 'middle', align: 'center' })];
  src(d, s, DDIM_SRC);
  d.animate(s, panels[0], { auto: true, effect: 'fade' });
  d.animate(s, [...panels[1].map((name) => ({ name })), ...panels[2].map((name) => ({ name, delay: 150 }))], { effect: 'fade', dur: 450 });
  d.animate(s, [...panels[3].map((name) => ({ name })), ...panels[4].map((name) => ({ name, delay: 150 })), ...arrow.map((name) => ({ name, delay: 400, effect: 'wipeLeft' }))], { effect: 'fade', dur: 450 });
  notes(s, {
    min: '0.5',
    build: 'The 1-step picture shows automatically. Click 1: 3 and 8 steps. Click 2: 20 and 40 steps and the diffusion arrow.',
    say: '1 step… [Click.] 3 steps… 8 steps… [Click.] …20… 40. A castle in Japan, which never existed. Each step removes a little static, again and again, and a picture appears. This is called diffusion.',
    analogy: 'Wiping fog off a window, a little each pass; or a sculptor removing everything that isn’t the statue.',
    terms: 'diffusion (making a picture by starting from static and removing a little at a time), denoising (removing static).',
    takeaway: 'Image AI usually starts from static and cleans it up, step by step.',
    caveats: 'EACH PANEL IS A SEPARATE RUN made with that many clean-up steps (same prompt), NOT frames of one run: say “this picture got 3 steps”. The panels are cropped from a real Stable Diffusion v1-5 X-Y plot by its maker; the step labels are re-typed. The prompt asked for “a european castle in japan”.',
    sources: ['https://commons.wikimedia.org/wiki/File:X-Y_plot_of_algorithmically-generated_AI_art_of_European-style_castle_in_Japan_demonstrating_DDIM_diffusion_steps.png (Benlisquare, CC BY-SA 4.0)'],
  });
  return s;
}

async function practiceSlide(d) {
  const s = page(d, 'Practice: add static to a photo, then undo it');
  const pw = 2.9;
  const a = await d.frame(s, D('in_leopard.png'), { x: MX, y: 1.8, w: pw, h: 2.6 }, { pad: 0.06 });
  const arr = seg(d, s, MX + pw + 0.2, 2.95, MX + pw + 1.4, 2.95, { color: HEX.teal, width: 4, arrow: true });
  const b = await d.frame(s, D('noise_square.png'), { x: MX + pw + 1.6, y: 1.8, w: 2.6, h: 2.6 }, { pad: 0.06 });
  const back = seg(d, s, MX + pw + 1.4, 3.6, MX + pw + 0.2, 3.6, { color: HEX.amber, width: 4, arrow: true });
  const labs = [d.text(s, 'add static', { x: MX + pw + 0.1, y: 2.45, w: 1.4, h: 0.4, fontSize: 16, bold: true, color: HEX.teal, align: 'center' }),
    d.text(s, 'undo it', { x: MX + pw + 0.1, y: 3.7, w: 1.4, h: 0.4, fontSize: 16, bold: true, color: HEX.amber, align: 'center' })];
  const key = d.text(s, [{ text: 'The real photo is the answer key: ', options: { bold: true, color: HEX.text } }, { text: 'self-supervised again.', options: { bold: true, color: HEX.teal } }], { x: MX, y: 4.65, w: 7.3, h: 0.9, fontSize: 22, valign: 'top' });
  const rx = 8.25, rw = W - MX - rx;
  const cmp = [];
  cmp.push(...await statCard(d, s, { x: rx, y: 1.8, w: rw, h: 1.3, icon: 'FaAlignLeft', color: HEX.blue, tint: TINT.blue, head: 'Text: left to right', sub: 'a word at a time' }));
  cmp.push(...await statCard(d, s, { x: rx, y: 3.25, w: rw, h: 1.3, icon: 'FaImage', color: HEX.amber, tint: TINT.amber, head: 'Images: from static', sub: 'cleaned up, step by step' }));
  cmp.push(d.text(s, 'Usually, not always: some text AIs use the static trick, and some image AIs go left to right.', { x: rx, y: 4.75, w: rw, h: 1.2, fontSize: 16, color: HEX.muted, valign: 'top' }));
  src(d, s, 'Leopard: ImageNet (Russakovsky et al., 2015) · the static square is ours · methods: Google DeepMind (Gemini Diffusion, 2025), OpenAI (4o images, 2025)');
  d.animate(s, [...a, arr, ...b, labs[0]], { auto: true, effect: 'fade' });
  d.animate(s, [back, labs[1], key], { effect: 'fade' });
  d.animate(s, cmp, { effect: 'rise' });
  notes(s, {
    min: '0.5',
    build: 'The real photo, the arrow and the static show automatically. Click 1: “learn to undo it” and “the real photo is the answer key”. Click 2: text versus images, and “usually, not always”.',
    say: 'How does it learn to clean up? In training, it takes real photos, like this leopard, and adds static on purpose. [Click.] Then it practises removing it. The real photo is the answer key, so it is self-supervised again. [Click.] So: text usually goes left to right, a word at a time; images usually start from static and get cleaned up. Usually, not always: some text AIs use the static trick, and some image AIs go left to right.',
    terms: 'self-supervised (the data is its own answer key).',
    takeaway: 'Both text and image AIs mostly learn from the data itself: no labels needed.',
    advanced: 'Google DeepMind’s Gemini Diffusion (May 20, 2025) is a research text model that “learns to generate outputs by converting random noise into coherent text or code”. OpenAI (Mar 25, 2025): “Unlike DALL·E, which operates as a diffusion model, 4o image generation is an autoregressive model natively embedded within ChatGPT.”',
    caveats: 'The static square is our drawing (decoration, not model output); the leopard is a real ImageNet photo.',
    sources: ['https://blog.google/innovation-and-ai/models-and-research/google-deepmind/gemini-diffusion/', 'https://cdn.openai.com/11998be9-5319-4302-bfbf-1167e093f1fb/Native_Image_Generation_System_Card.pdf', 'https://arxiv.org/abs/2408.11039 (Transfusion)', 'https://commons.wikimedia.org/wiki/File:Example_of_Forward_Diffusion_Models.png (MrAlanKoh, CC BY-SA 4.0; notes only)'],
  });
  return s;
}

// =====================================================================================
// PART 1 · LECUN'S CAKE
async function cakeQSlide(d) {
  const s = page(d, 'LeCun’s cake: which layer teaches most?', { transition: 'push' });
  const ck = cake(d, s, 0.85, 1.95, 1.05);
  const labs = [d.text(s, 'cherry', { x: 6.75, y: 1.95, w: 2.0, h: 0.5, fontSize: 24, bold: true, color: CAKE.cherry, valign: 'middle' }),
    seg(d, s, ck.at.cherry.x + 0.35, ck.at.cherry.y, 6.7, 2.2, { color: CAKE.cherry, width: 1.5, dash: 'dash' }),
    d.text(s, 'icing', { x: 6.75, y: 3.1, w: 2.0, h: 0.5, fontSize: 24, bold: true, color: CAKE.cream, valign: 'middle' }),
    seg(d, s, ck.at.right - 0.1, ck.at.icing.y, 6.7, 3.35, { color: CAKE.cream, width: 1.5, dash: 'dash' }),
    d.text(s, 'cake', { x: 6.75, y: 4.3, w: 2.0, h: 0.5, fontSize: 24, bold: true, color: 'C08A5A', valign: 'middle' }),
    seg(d, s, ck.at.right - 0.1, ck.at.sponge.y, 6.7, 4.55, { color: 'C08A5A', width: 1.5, dash: 'dash' })];
  const rx = 8.85, rw = W - MX - rx;
  const q = [box(d, s, rx, 1.8, rw, 4.6, { fill: HEX.card2, line: HEX.red, lw: 1.25 }),
    ...await beatTag(d, s, 'HANDS UP', 'FaHandPaper', rx + 0.25, 2.0),
    d.text(s, 'Which layer teaches the AI the most: cake, icing or cherry?', { x: rx + 0.25, y: 2.5, w: rw - 0.5, h: 2.2, fontSize: 28, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'top' }),
    d.text(s, 'A famous picture from Yann LeCun, a deep-learning pioneer', { x: rx + 0.25, y: 4.9, w: rw - 0.5, h: 1.3, fontSize: 18, color: HEX.muted, valign: 'top' })];
  src(d, s, 'After Y. LeCun (NIPS 2016; ISSCC 2019) · cake drawn by us');
  d.animate(s, [...ck.all, ...labs, ...q], { auto: true, effect: 'fade', dur: 600 });
  notes(s, {
    min: '0.5',
    build: 'No clicks: the cake and the question show on their own.',
    say: 'Here is a famous picture from Yann LeCun, one of the pioneers of deep learning: learning is a cake. Hands up: which layer teaches the AI the most: the cake, the icing, or the cherry? [Hands for each.]',
    analogy: 'A cake: most of it is sponge, a little icing, one cherry on top.',
    ask: 'On the slide: “Which layer teaches the AI the most: cake, icing or cherry?” Hands up for each. Expected: many say the cherry because it is on top. Answer (next slide): the cake.',
    takeaway: 'Commit to a guess before the answer.',
    caveats: 'The cake is our drawing.',
    sources: ['https://syncedreview.com/2019/02/22/yann-lecun-cake-analogy-2-0/', 'https://nips.cc/virtual/2016/invited-talk/6197'],
  });
  return s;
}

async function cakeSlide(d) {
  const s = page(d, 'The sponge: the data itself teaches most');
  const ck = cake(d, s, 0.75, 2.05, 1.0);
  const rx = 6.85, rw = W - MX - rx;
  const rows = [
    ['sponge', 'SELF-SUPERVISED', 'the data is its own answer key', 'THE MOST', '“Millions of bits per sample”', 'A27248', 3.95, 'FaBook'],
    ['icing', 'SUPERVISED', 'flash cards', 'SOME', '“10→10,000 bits per sample”', 'C9B48A', 2.85, 'FaClone'],
    ['cherry', 'REINFORCEMENT', 'treats', 'A LITTLE', '“A few bits for some samples”', CAKE.cherry, 1.75, 'FaBone'],
  ];
  const groups = {};
  for (const [layer, tag, meaning, word, quote, col, y, nm] of rows) {
    const g = [];
    const big = layer === 'sponge', bh = big ? 1.75 : 0.98;
    g.push(box(d, s, rx, y, rw, bh, { fill: HEX.card, line: col, lw: big ? 2 : 1.25 }));
    g.push(await ic(d, s, nm, col, rx + 0.18, y + 0.16, 0.44));
    g.push(d.text(s, [{ text: tag, options: { bold: true, color: col, charSpacing: 1.5 } }, { text: `  (${meaning})`, options: { color: HEX.muted } }], { x: rx + 0.75, y: y + 0.08, w: rw - 0.85, h: 0.44, fontSize: 16, valign: 'middle' }));
    g.push(d.text(s, word, { x: rx + 0.75, y: y + 0.48, w: 2.6, h: big ? 0.66 : 0.44, fontSize: big ? 32 : 24, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'middle' }));
    g.push(d.text(s, quote, { x: rx + 3.2, y: y + 0.48, w: rw - 3.3, h: big ? 0.66 : 0.44, fontSize: 14, italic: true, color: HEX.muted, valign: 'middle', align: 'right' }));
    if (big) g.push(d.text(s, 'a kind of unsupervised learning: guess the next word, clean the static', { x: rx + 0.75, y: y + 1.18, w: rw - 0.9, h: 0.45, fontSize: 16, color: HEX.amber, valign: 'middle' }));
    const a = ck.at[layer];
    g.unshift(seg(d, s, layer === 'cherry' ? a.x + 0.32 : ck.at.right - 0.15, a.y, rx - 0.05, y + (big ? 0.8 : 0.48), { color: col, width: 1.5, dash: 'dash' }));
    groups[layer] = g;
  }
  const tag = d.text(s, 'Most of what it learns comes from the data itself.', { x: MX, y: 6.0, w: W - 2 * MX, h: 0.48, fontSize: 22, bold: true, color: HEX.text, valign: 'middle' });
  src(d, s, 'Y. LeCun, ISSCC 2019 keynote, slide 59 (quotes), via Synced Review (Feb 22, 2019) · cake drawn by us');
  d.animate(s, ck.all, { auto: true, effect: 'fade', dur: 500 });
  d.animate(s, [...groups.sponge, tag], { effect: 'wipeLeft', dur: 600 });
  d.animate(s, groups.icing, { effect: 'wipeLeft', dur: 600 });
  d.animate(s, groups.cherry, { effect: 'wipeLeft', dur: 600 });
  notes(s, {
    min: '0.75',
    build: 'The cake shows automatically. Click 1: the sponge (self-supervised: the most) and the bottom line. Click 2: the icing (supervised: some). Click 3: the cherry (reinforcement: a little).',
    say: '[Click.] The cake itself: self-supervised learning, where the data is its own answer key, like guessing the next word, or cleaning the static off a picture. Every example teaches a huge amount. [Click.] The icing: supervised learning, our flash cards. Each card teaches some: just its one label. [Click.] The cherry: reinforcement learning, the treats. A treat only says “good” or “not good”, once in a while, so it teaches a little.',
    terms: 'bit (the smallest piece of information, one yes-or-no; only if asked).',
    takeaway: 'Most of what an AI learns comes from the data itself; labels add some, and rewards a little.',
    advanced: 'LeCun’s three lines, verbatim from the slide: the cherry, “The machine predicts a scalar reward given once in a while”; the icing, “The machine predicts a category or a few numbers for each input”; the cake, “The machine predicts any part of its input for any observed part.”',
    caveats: 'LeCun’s point was HOW MUCH INFORMATION each example gives the learner. It was not about training stages, and the sizes are not exact proportions. The quotes are verbatim from his 2019 slide (next slide).',
    sources: ['https://syncedreview.com/2019/02/22/yann-lecun-cake-analogy-2-0/ (Synced, Feb 22, 2019; reproduces the ISSCC 2019 slide 59)'],
  });
  return s;
}

async function cakeRealSlide(d) {
  const s = page(d, 'LeCun’s own slide, 2019', { transition: 'push' });
  const proof = await d.frame(s, R('lecun-cake-isscc2019-slide.png'), { x: MX, y: 1.7, w: 8.9, h: 4.8 }, { pad: 0.07, align: 'left' });
  const cx0 = proof.geom.x + proof.geom.w + 0.45, cw0 = W - MX - cx0;
  const cap = d.text(s, [
    { text: 'Cherry: ', options: { bold: true, color: CAKE.cherry } }, { text: 'reinforcement learning', options: { color: HEX.text, breakLine: true, paraSpaceAfter: 10 } },
    { text: 'Icing: ', options: { bold: true, color: CAKE.cream } }, { text: 'supervised learning', options: { color: HEX.text, breakLine: true, paraSpaceAfter: 10 } },
    { text: 'Cake: ', options: { bold: true, color: 'C08A5A' } }, { text: 'self-supervised learning', options: { color: HEX.text, breakLine: true, paraSpaceAfter: 18 } },
    { text: 'He joked in 2016 that it was “slightly offensive to RL folks”.', options: { color: HEX.muted, fontSize: 16, italic: true } },
  ], { x: cx0, y: 1.8, w: cw0, h: 4.6, fontSize: 20, valign: 'middle' });
  src(d, s, 'Y. LeCun, ISSCC 2019 keynote, slide 59 (© IEEE ISSCC), via Synced Review (Feb 22, 2019) · first shown at NIPS 2016');
  d.animate(s, [...proof, cap], { auto: true, effect: 'zoom', dur: 500 });
  notes(s, {
    min: '0.25',
    build: 'No clicks: his slide and the three labels appear on their own.',
    say: '(A 15-second glance: proof that the cake is his, not ours; no need to read the slide.) This is his real slide, from a talk in 2019. In 2016 he called the sponge “unsupervised”; in 2019 he renamed it “self-supervised”. He even joked that the picture is “slightly offensive to RL folks”: the reinforcement-learning researchers. Next: how this cake became the recipe for a chatbot.',
    takeaway: 'The cake is LeCun’s own picture.',
    advanced: 'RL researchers answered with a cake covered in cherries (Synced reports DeepMind researchers and, at NIPS 2017, Pieter Abbeel).',
    caveats: 'A credited quotation of his slide (© IEEE ISSCC; not openly licensed). The “slightly offensive” joke is on the 2016 slide.',
    sources: ['https://syncedreview.com/2019/02/22/yann-lecun-cake-analogy-2-0/', 'https://nips.cc/virtual/2016/invited-talk/6197 (LeCun, “Predictive Learning”, NIPS 2016)'],
  });
  return s;
}

// =====================================================================================
// PART 1 · A CHATBOT'S SCHOOL YEAR
async function schoolSlide(d) {
  const s = page(d, 'Making a chatbot: lecture, examples, homework');
  const cw = 3.82, ch = 3.0, cy = 1.7, gap = (W - 2 * MX - 3 * cw) / 2;
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
    g.push(...cake(d, s, x + cw - 1.42, cy + 0.08, 0.23, { hi: layer, plate: false }).all);
    g.push(d.text(s, word, { x: x + 0.22, y: cy + 1.1, w: cw - 0.3, h: 0.46, fontSize: 22, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'middle', wrap: false }));
    g.push(d.text(s, term, { x: x + 0.22, y: cy + 1.56, w: cw - 0.35, h: 0.36, fontSize: 16, color: c === HEX.steel ? HEX.muted : c, bold: true, valign: 'middle' }));
    g.push(d.text(s, txt, { x: x + 0.22, y: cy + 1.97, w: cw - 0.35, h: 0.95, fontSize: 21, color: HEX.text, valign: 'top' }));
    if (i > 0) g.push(await ic(d, s, 'FaChevronRight', HEX.steel, x - gap + (gap - 0.3) / 2, cy + ch / 2 - 0.15, 0.3));
    groups.push(g);
  }
  const bk = (i0, i1, text, color) => {
    const x0 = cx(i0), x1 = cx(i1) + cw, yy = cy + ch + 0.16;
    return [seg(d, s, x0 + 0.05, yy, x1 - 0.05, yy, { color, width: 2.5 }), seg(d, s, x0 + 0.05, yy - 0.1, x0 + 0.05, yy, { color, width: 2.5 }), seg(d, s, x1 - 0.05, yy - 0.1, x1 - 0.05, yy, { color, width: 2.5 }),
      d.text(s, text, { x: x0, y: yy + 0.05, w: x1 - x0, h: 0.36, fontSize: 16, bold: true, color, align: 'center', charSpacing: 3 })];
  };
  groups[0].push(...bk(0, 0, 'PRETRAINING', HEX.steel));
  groups[2].push(...bk(1, 2, 'POST-TRAINING', HEX.amber));
  const ey = 5.38, eh = 1.08;
  const exam = [box(d, s, MX, ey, W - 2 * MX, eh, { fill: HEX.card2, line: HEX.red, lw: 1.5 })];
  exam.push(...await iconDisc(d, s, 'FaShieldAlt', MX + 0.58, ey + eh / 2, 0.78, HEX.red, TINT.red));
  exam.push(d.text(s, [{ text: 'Then, before release: safety tests. ', options: { bold: true, color: HEX.text } }, { text: 'They only check the model; it doesn’t learn from them (more in Part 4).', options: { color: HEX.muted } }], { x: MX + 1.15, y: ey, w: W - 2 * MX - 1.35, h: eh, fontSize: 20, valign: 'middle' }));
  src(d, s, 'Recipe: OpenAI, InstructGPT (Ouyang et al., 2022), Fig. 2 · cake-to-chatbot reading: N. Lambert, RLHF Book (not LeCun’s own)');
  groups.forEach((g) => d.animate(s, g, { effect: 'rise' }));
  d.animate(s, exam, { effect: 'zoom', dur: 400 });
  notes(s, {
    min: '1.25',
    build: 'Only the title shows at first. Click 1: LECTURE (pretraining). Click 2: WORKED EXAMPLES (SFT). Click 3: HOMEWORK & EXAMS (RL), with the POST-TRAINING bracket. Click 4: the safety-tests row.',
    say: 'Here is how a chatbot is made, as a school year. [Click.] First, the lecture: pretraining. The model reads a huge library and keeps guessing the next word. That is the cake: most of the learning happens here. [Click.] Second, worked examples in class: SFT, supervised fine-tuning. People write good example answers, and the model copies how they are done. That is the icing: flash cards. [Click.] Third, homework and exams: reinforcement learning. The model tries, gets graded, and learns from the grade. The grade is its treat: the cherry. Steps two and three together are called post-training. [Click.] And before release, safety tests. These only check the model; it does not learn from them. Think for a second: at which step would you test for dangerous behavior? [Pause; answer: all of them; real labs test throughout.] More in Part 4. Next, a few slides on each step.',
    analogy: 'Pretraining is the lecture; SFT is the worked examples in class; RL is the homework and exams (William’s analogy). The safety tests before release only measure: nothing in the model changes because of them.',
    terms: 'frontier model (one of the most capable models, from a few top labs), pretraining, post-training (everything after pretraining), SFT (supervised fine-tuning), RL (reinforcement learning), safety tests (evaluations).',
    ask: 'Spoken only, 10 seconds: “At which step would you test for dangerous behavior?” Best answer: all of them; real labs test throughout, not only at the end.',
    takeaway: 'A chatbot is made in stages: a long lecture (pretraining), then worked examples and graded homework and exams (post-training), then safety tests.',
    advanced: 'OpenAI’s 2022 recipe for InstructGPT had three steps: copy demonstrations (SFT), train a scoring model on people’s rankings, then reinforcement learning against that scoring model. OpenAI said this post-training used “less than 2% of the compute and data relative to model pretraining”.',
    caveats: 'Mapping LeCun’s cake onto these stages is the community’s adaptation (Nathan Lambert’s RLHF Book), not LeCun’s own claim. Labs rarely publish full recipes, and safety testing runs throughout. The little cakes are our drawings.',
    sources: ['https://arxiv.org/abs/2203.02155 (Ouyang et al., 2022, InstructGPT, Fig. 2)', 'https://openai.com/index/instruction-following/', 'https://rlhfbook.com/teach/course/lec5-chap7/ (N. Lambert, “The LeCun cake”)'],
  });
  return s;
}

async function lectureSlide(d) {
  const s = page(d, 'Pretraining is the lecture: guess the next word', { transition: 'push' });
  const rt = roleTag(d, s, 'LECTURE', HEX.steel, MX, 1.7, { color: HEX.ink });
  const loopL = d.text(s, 'THIS LOOP, TRILLIONS OF TIMES', { x: MX + rt.w + 0.25, y: 1.7, w: 7, h: 0.38, fontSize: 16, bold: true, color: d.S.amber, charSpacing: 2, valign: 'middle' });
  const sw = (W - 2 * MX - 3 * 0.35) / 4, steps = [['FaEyeSlash', 'Hide the next word'], ['FaQuestionCircle', 'Guess it'], ['FaCheckCircle', 'Check the real text'], ['FaSlidersH', 'Nudge the dials']];
  const loop = [...rt, loopL];
  for (let i = 0; i < 4; i++) {
    const x = MX + i * (sw + 0.35), y = 2.35;
    loop.push(box(d, s, x, y, sw, 2.3, { fill: i === 3 ? TINT.red : HEX.card, line: i === 3 ? HEX.red : HEX.line }));
    loop.push(await ic(d, s, steps[i][0], i === 3 ? HEX.red : HEX.amber, x + (sw - 0.8) / 2, y + 0.25, 0.8));
    loop.push(d.text(s, steps[i][1], { x: x + 0.1, y: y + 1.2, w: sw - 0.2, h: 0.95, fontSize: 24, bold: true, color: HEX.text, align: 'center', valign: 'top' }));
    if (i < 3) loop.push(seg(d, s, x + sw + 0.04, y + 1.15, x + sw + 0.31, y + 1.15, { color: HEX.steel, width: 2.5, arrow: true }));
  }
  const ex = [box(d, s, MX, 5.0, W - 2 * MX, 1.35, { fill: HEX.card2, line: HEX.line }),
    d.text(s, [{ text: '“The capital of France is ', options: { color: HEX.text } }, { text: '▢', options: { color: HEX.amber, bold: true } }, { text: '”    ', options: { color: HEX.text } }, { text: 'guess: Paris. Right! Nudge the dials.', options: { color: HEX.teal, bold: true } }], { x: MX + 0.3, y: 5.0, w: W - 2 * MX - 0.6, h: 1.35, fontSize: 26, valign: 'middle', fontFace: 'Arial' })];
  src(d, s, 'GPT-style pretraining: guess the next word of real text (OpenAI, “Improving Language Understanding by Generative Pre-Training”, 2018)');
  d.animate(s, loop, { auto: true, effect: 'fade' });
  d.animate(s, ex, { effect: 'rise' });
  notes(s, {
    min: '0.5',
    build: 'The LECTURE tag and the four-step loop show automatically. Click 1: an example sentence.',
    say: 'The lecture: pretraining, the first and by far the biggest stage. The model plays the guess-the-next-word game: hide the next word, guess it, check against the real text, nudge the dials. Then again. Trillions of times. [Click.] “The capital of France is…” Paris. Right: nudge the dials a little toward that answer, and on to the next word.',
    analogy: 'Reading a huge library with a card over the page: cover the next word, guess it, slide the card to check, repeat.',
    terms: 'pretraining (the first, biggest stage: guess the next word on trillions of tokens).',
    takeaway: 'Pretraining is the guess-the-next-word game, repeated trillions of times.',
    caveats: '“Trillions of times” counts the guesses (one per token); the dials are nudged after each big batch of guesses. The example sentence is ours.',
    sources: ['https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf', 'https://www.anthropic.com/research/tracing-thoughts-language-model'],
  });
  return s;
}

async function readQSlide(d) {
  const s = page(d, 'How long would it take you to read it all?');
  const L = [bigNum(d, s, '15 trillion+', { x: MX, y: 1.7, w: 6.5, h: 1.4, size: 72 }),
    d.text(s, 'tokens (word pieces) read by Meta’s Llama 3 model in pretraining (2024)', { x: MX, y: 3.15, w: 6.2, h: 1.0, fontSize: 22, color: HEX.text, valign: 'top' }),
    await ic(d, s, 'FaBookOpen', HEX.steel, MX, 4.55, 1.2)];
  const rx = 7.3, rw = W - MX - rx;
  const Q = [box(d, s, rx, 1.75, rw, 4.65, { fill: HEX.card2, line: HEX.red, lw: 1.25 }),
    ...await beatTag(d, s, 'GUESS FIRST', 'FaQuestionCircle', rx + 0.25, 1.95),
    d.text(s, 'Reading 24 hours a day, how many years?', { x: rx + 0.25, y: 2.45, w: rw - 0.5, h: 1.0, fontSize: 26, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'top' })];
  ['under 1,000', '1,000 to 100,000', 'over 100,000'].forEach((t, i) => Q.push(...optionTile(d, s, 'ABC'[i], t, rx + 0.25, 3.6 + i * 0.9, rw - 0.5, 0.75, { size: 24 })));
  src(d, s, 'Meta, “Introducing Meta Llama 3” (Apr 18, 2024): “over 15T tokens”');
  d.animate(s, [...L, ...Q], { auto: true, effect: 'fade' });
  notes(s, {
    min: '0.5',
    build: 'No clicks: the number, the question and the three ranges show on their own.',
    say: 'How much text? Meta says its Llama 3 model read over 15 trillion tokens. Guess first: how many years would it take one of you to read all that, reading 24 hours a day? Hands up for A, under 1,000 years… B, 1,000 to 100,000… C, over 100,000. [Count roughly.]',
    ask: 'On the slide (GUESS FIRST): “Reading 24 hours a day, how many years?” Hands up for A, B or C. Answer (next slide): B, about 90,000 years.',
    takeaway: 'Commit to a guess before the answer.',
    caveats: 'Token counts are the lab’s own figure (Meta: “over 15T”; the paper gives 15.6T for the largest model).',
    sources: ['https://ai.meta.com/blog/meta-llama-3/', 'https://arxiv.org/abs/2407.21783'],
  });
  return s;
}

async function readASlide(d) {
  const s = page(d, 'About 90,000 years of nonstop reading', { transition: 'push' });
  const n = [bigNum(d, s, '90,000 years', { x: MX, y: 1.75, w: W - 2 * MX, h: 1.7, size: 110, color: HEX.text }),
    d.text(s, [{ text: 'Answer B. ', options: { bold: true, color: HEX.amber } }, { text: 'Reading 24 hours a day at a normal adult speed (our estimate).', options: { color: HEX.text } }], { x: MX, y: 3.5, w: W - 2 * MX, h: 0.6, fontSize: 24, valign: 'middle' })];
  const more = [box(d, s, MX, 4.55, W - 2 * MX, 1.8, { fill: HEX.card, line: HEX.line }),
    await ic(d, s, 'FaLayerGroup', HEX.amber, MX + 0.35, 5.1, 0.7),
    d.text(s, [{ text: 'And it keeps growing: ', options: { bold: true, color: HEX.text } }, { text: 'some labs now report 30 to 36 trillion tokens. OpenAI, Google and Anthropic: no published counts found.', options: { color: HEX.text } }], { x: MX + 1.35, y: 4.55, w: W - 2 * MX - 1.6, h: 1.8, fontSize: 22, valign: 'middle' })];
  src(d, s, 'Our estimate: Meta’s count, OpenAI’s words-per-token rule, Brysbaert (2019) reading speed · Meta (Llama 4) · Alibaba (Qwen3) · DeepSeek (V4-Pro)');
  d.animate(s, n, { auto: true, effect: 'zoom', dur: 500 });
  d.animate(s, more, { effect: 'rise' });
  notes(s, {
    min: '0.5',
    build: 'The answer shows automatically. Click 1: “and it keeps growing”.',
    say: 'About 90,000 years, reading nonstop at a normal adult speed: B. That is our own estimate. [Click.] And it keeps growing: some labs now report 30 trillion or more. We found no published numbers from OpenAI, Google or Anthropic.',
    takeaway: 'Pretraining reads far more text than any person could in a lifetime.',
    advanced: 'How we got 90,000 years (our estimate, not the labs’): Meta’s token count turned into words with OpenAI’s rule of thumb (a token is about three-quarters of a word), divided by an average adult reading speed for non-fiction (Brysbaert, 2019). Epoch AI estimates GPT-5 was likely trained on at least 30 trillion tokens (OpenAI has not said).',
    caveats: 'B holds for reading nonstop, 24 hours a day, as the question says; at 8 hours a day it would be about 270,000 years (C). Lab figures: Llama 4 “more than 30 trillion”, Qwen3 “approximately 36 trillion”, DeepSeek-V4-Pro “more than 32T”. Labs count tokens differently, so these are only roughly comparable.',
    sources: ['https://ai.meta.com/blog/meta-llama-3/', 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/', 'https://qwenlm.github.io/blog/qwen3/', 'https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro', 'https://help.openai.com/en/articles/4936856-understanding-and-counting-tokens', 'https://linkinghub.elsevier.com/retrieve/pii/S0749596X19300786 (Brysbaert 2019)', 'https://epochai.substack.com/p/notes-on-gpt-5-training-compute'],
  });
  return s;
}

async function clusterSlide(d) {
  const s = page(d, 'Thousands of chips, running for months');
  const hl = await d.frame(s, A('slides', 'economy', 'pcgamer_astra_head.png'), { x: MX, y: 1.75, w: 5.0, h: 2.75 }, { pad: 0.06, rot: -1.5 });
  const q = d.text(s, [{ text: '“more than 100,000 GPUs”', options: { bold: true, color: HEX.amber, breakLine: true } }, { text: 'for GPT-6 Astra, OpenAI told Fortune (Sep 2026)', options: { color: HEX.text, fontSize: 18 } }], { x: MX, y: 4.75, w: 5.0, h: 1.2, fontSize: 26, valign: 'top' });
  const rx = MX + 5.4, rw = W - MX - rx;
  const ph = await d.frame(s, A('research', 'economy', 'crusoe_stargate_abilene_aerial.jpg'), { x: rx, y: 1.75, w: rw, h: 4.65 }, { border: false, align: 'right' });
  const cap = capBar(d, s, ph.geom, [{ text: 'Stargate Abilene, Texas: ', options: { bold: true } }, { text: 'an AI campus' }], { h: 0.55, size: 18 });
  src(d, s, 'PC Gamer (Sep 7, 2026) · Fortune (Sep 3, 2026) · photo: Crusoe (Sep 30, 2025)');
  d.animate(s, [...hl, q], { auto: true, effect: 'fade' });
  d.animate(s, [...ph, ...cap], { effect: 'fade' });
  notes(s, {
    min: '0.5',
    build: 'The headline and the quote show automatically. Click 1: the aerial photo of an AI campus.',
    say: 'All that reading needs special chips running for months. For GPT-6 Astra, NVIDIA’s CEO said 100,000 of its chips were used, and OpenAI told Fortune “more than 100,000 GPUs”. [Click.] This is what that looks like from the air: Stargate Abilene in Texas, an AI campus built for OpenAI. We will see why these chips matter in a few minutes. What comes out of pretraining is called a base model.',
    terms: 'GPU (an AI chip; explained soon), base model (what pretraining produces).',
    takeaway: 'Pretraining runs on huge numbers of chips for months.',
    advanced: 'Epoch AI estimates GPT-6 Astra’s training compute at about 1e27 operations, based on at least 100,000 GB200 GPUs in Abilene (an estimate; OpenAI has not disclosed the duration or energy).',
    caveats: 'The headline is Jensen Huang’s statement as reported by PC Gamer; OpenAI’s own words to Fortune are “more than 100,000 GPUs”. The photo shows the Abilene campus under construction (Crusoe, Sep 30, 2025); we do not claim this exact building trained Astra, only that Epoch AI places the run in Abilene.',
    sources: ['https://www.pcgamer.com/software/ai/jensen-huang-says-100-000-nvidia-gpus-were-used-to-train-openais-latest-model-gpt-6-astra-and-theres-already-plans-to-bring-quadruple-that-amount-of-hardware-online/', 'https://fortune.com/2026/09/03/openai-debuts-gpt-6-astra-computer-use-greg-brockman-says-start-of-agi/', 'https://www.crusoe.ai/resources/newsroom/crusoe-announces-flagship-abilene-data-center-is-live', 'https://epoch.ai/data/all_ai_models.csv'],
  });
  return s;
}

const SOCKS_Q = 'Why is it important to eat socks after meditating?';
async function baseModelSlide(d) {
  const s = page(d, 'A base model just keeps the page going', { transition: 'push' });
  const rt = roleTag(d, s, 'AFTER THE LECTURE', HEX.steel, MX, 1.7, { color: HEX.ink });
  const real = d.text(s, 'REAL EXAMPLE · OPENAI, 2022', { x: W - MX - 5, y: 1.7, w: 5, h: 0.38, fontSize: 14, bold: true, color: d.S.amber, align: 'right', valign: 'middle', charSpacing: 1 });
  const pr = [box(d, s, MX, 2.25, W - 2 * MX, 0.78, { fill: HEX.card2, line: HEX.steel })];
  pr.push(...chip(d, s, 'PROMPT', MX + 0.2, 2.44, 1.25, HEX.steel, { h: 0.4, fontSize: 14, color: HEX.ink }));
  pr.push(d.text(s, SOCKS_Q, { x: MX + 1.65, y: 2.25, w: 10, h: 0.78, fontSize: 26, bold: true, color: HEX.text, valign: 'middle' }));
  const lw = 7.3;
  const reply = [box(d, s, MX, 3.25, lw, 3.15, { fill: HEX.card, line: HEX.steel, lw: 1.25 }),
    d.text(s, 'GPT-3, A BASE MODEL, WROTE:', { x: MX + 0.25, y: 3.35, w: lw - 0.5, h: 0.4, fontSize: 14, bold: true, color: HEX.steel, charSpacing: 2, valign: 'middle' }),
    d.text(s, [
      { text: 'What can you learn from socks?', options: { bold: true, breakLine: true, paraSpaceAfter: 6 } },
      { text: 'A: When you eat socks, you are tasting the essence of enlightenment. You are tasting the true flavor of the awakened mind.', options: { breakLine: true, paraSpaceAfter: 6 } },
      { text: 'Q: What is the true flavor of the awakened mind?', options: { bold: true } },
    ], { x: MX + 0.25, y: 3.8, w: lw - 0.5, h: 2.5, fontSize: 21, color: HEX.text, valign: 'top', fontFace: 'Cambria' })];
  const rx = MX + lw + 0.35, rw = W - MX - rx;
  const think = [box(d, s, rx, 3.25, rw, 3.15, { fill: HEX.card2, line: HEX.amber, lw: 1.25 }),
    ...await beatTag(d, s, 'THINK ABOUT IT', 'FaLightbulb', rx + 0.2, 3.42),
    d.text(s, 'Why would a model trained on the internet reply with more questions and answers?', { x: rx + 0.2, y: 3.9, w: rw - 0.4, h: 2.35, fontSize: 21, bold: true, color: HEX.text, valign: 'top' })];
  src(d, s, 'Ouyang et al. (OpenAI), “Training language models to follow instructions…” (2022), Fig. 9: GPT-3 175B completion, verbatim (first four lines)');
  d.animate(s, [...rt, real, ...pr], { auto: true, effect: 'fade' });
  d.animate(s, [...reply, ...think], { effect: 'rise' });
  notes(s, {
    min: '1.0',
    build: 'The tag and the real prompt show automatically. Click 1: GPT-3’s real reply and the think-about-it question.',
    say: 'What does a base model, straight out of the lecture, actually do? It only learned to continue text. Here is a real, silly test from OpenAI’s 2022 paper: “Why is it important to eat socks after meditating?” [Click.] GPT-3, a base model, did not answer. It wrote a new question, “What can you learn from socks?”, then an answer about tasting enlightenment, and it kept going like a strange forum page. Think: why would a model trained on the internet do that? [Pause; take one answer.] On the internet, a question is often followed by more questions and answers.',
    analogy: 'A student who memorised the library but was never shown what an answer looks like.',
    terms: 'base model (the text-continuer that pretraining makes).',
    ask: 'On the slide (THINK ABOUT IT): “Why would a model trained on the internet reply with more questions and answers?” Take one answer. Expected: that is what it saw online (forums, FAQ pages).',
    takeaway: 'Pretraining makes a text-continuer, not an assistant.',
    advanced: 'GPT-3’s full completion continues: “Q: What is the true flavor of the awakened mind? A: The true flavor of the awakened mind is the flavor of no flavor. And the true flavor of no flavor is the flavor of smelly feet.” OpenAI (Jan 27, 2022): “GPT‑3 is trained to predict the next word on a large dataset of Internet text, rather than to safely perform the language task that the user wants.”',
    caveats: 'The prompt and reply are verbatim from the paper’s Fig. 9 (we show its first lines). The prompt is deliberately silly: OpenAI chose it to show how the models handle a false premise.',
    sources: ['https://arxiv.org/abs/2203.02155 (Ouyang et al., 2022, Fig. 9, p. 16)', 'https://openai.com/index/instruction-following/'],
  });
  return s;
}

async function sftSlide(d) {
  const s = page(d, 'Worked examples turn it into an assistant');
  const rt = roleTag(d, s, 'WORKED EXAMPLES', HEX.blue, MX, 1.7);
  const lw = 5.2;
  const how = [box(d, s, MX, 2.25, lw, 4.15, { fill: TINT.blue, line: HEX.blue, lw: 1.25 }),
    await ic(d, s, 'FaUserEdit', HEX.blue, MX + 0.3, 2.5, 0.8),
    d.text(s, [
      { text: 'People write thousands of good answers. ', options: { bold: true, color: HEX.text, breakLine: true, paraSpaceAfter: 10 } },
      { text: 'The model copies the pattern: question in, helpful answer out. Then graded homework (next).', options: { color: HEX.text } },
    ], { x: MX + 0.3, y: 3.45, w: lw - 0.6, h: 2.8, fontSize: 22, valign: 'top' })];
  const rx = MX + lw + 0.35, rw = W - MX - rx;
  const ans = [box(d, s, rx, 2.25, rw, 4.15, { fill: HEX.card, line: HEX.red, lw: 1.25 }),
    d.text(s, 'SAME QUESTION, AFTER POST-TRAINING (INSTRUCTGPT):', { x: rx + 0.25, y: 2.35, w: rw - 0.5, h: 0.4, fontSize: 14, bold: true, color: HEX.red, charSpacing: 1, valign: 'middle' }),
    d.text(s, '“There is no clear answer to this question, but there are many theories and ideas that may explain the apparent need to eat socks after meditating.”', { x: rx + 0.25, y: 2.85, w: rw - 0.5, h: 2.2, fontSize: 25, color: HEX.text, valign: 'top', fontFace: 'Cambria', italic: true }),
    d.text(s, [{ text: 'Now it answers. ', options: { bold: true, color: HEX.teal } }, { text: 'But it still played along with a silly question.', options: { color: HEX.text } }], { x: rx + 0.25, y: 5.15, w: rw - 0.5, h: 1.1, fontSize: 20, valign: 'middle' })];
  src(d, s, 'Ouyang et al. (OpenAI, 2022), Fig. 9: InstructGPT 175B completion, verbatim (first sentence) · step 1 of the recipe: people write example answers');
  d.animate(s, [...rt, ...how], { auto: true, effect: 'fade' });
  d.animate(s, ans, { effect: 'rise' });
  notes(s, {
    min: '0.5',
    build: 'The worked-examples card shows automatically. Click 1: the same question, answered after post-training.',
    say: 'Now the worked examples: people write thousands of example answers, question in, helpful answer out, and the model is trained to copy that pattern. That is SFT, supervised fine-tuning: flash cards again, where the back of the card is a good answer. [Click.] Same question, after this training and the homework stage: “There is no clear answer to this question, but there are many theories…” Now it answers like an assistant: same knowledge inside, different behavior. But notice: it still played along with a silly question. Training shapes behavior, and it can shape it imperfectly.',
    analogy: 'Worked examples in class: the teacher solves one on the board, then you copy the method.',
    terms: 'assistant (a chat model that answers), SFT (supervised fine-tuning: training on example answers people wrote).',
    takeaway: 'Worked examples (SFT) turn a text-continuer into an assistant that answers, but not always wisely.',
    advanced: 'InstructGPT’s SFT step used about 13,000 training prompts with answers written by labelers (paper, Sec. 3). The paper shows this pair to illustrate a mistake: InstructGPT went along with the question’s false premise (Fig. 9).',
    caveats: 'InstructGPT had both worked examples and graded homework (RLHF), so the answer shows post-training as a whole, not SFT alone. The quote is the first sentence of the paper’s Fig. 9 completion, verbatim.',
    sources: ['https://arxiv.org/abs/2203.02155 (Ouyang et al., 2022: Sec. 3 and Fig. 9)', 'https://openai.com/index/instruction-following/'],
  });
  return s;
}

async function votesSlide(d) {
  const s = page(d, 'Homework, grader 1: people’s votes', { transition: 'push' });
  const rt = roleTag(d, s, 'HOMEWORK & EXAMS', HEX.red, MX, 1.7);
  const bt = await beat(d, s, 'HANDS UP');
  const q = d.text(s, [{ text: 'Why is the sky blue? ', options: { bold: true, color: HEX.text } }, { text: '(two made-up answers, both correct)', options: { color: HEX.muted, fontSize: 18 } }], { x: MX, y: 2.2, w: W - 2 * MX, h: 0.6, fontSize: 28, valign: 'middle' });
  const aw = (W - 2 * MX - 0.3) / 2;
  const ans = (x, letter, text) => [box(d, s, x, 3.0, aw, 2.15, { fill: HEX.card, line: HEX.line }),
    ...numDisc(d, s, letter, x + 0.65, 4.07, 0.9, HEX.amber, { color: HEX.ink, fontSize: 32 }),
    d.text(s, text, { x: x + 1.3, y: 3.05, w: aw - 1.5, h: 2.05, fontSize: 22, color: HEX.text, valign: 'middle' })];
  const A_ = ans(MX, 'A', 'Sunlight scatters in air. Blue scatters most.');
  const B_ = ans(MX + aw + 0.3, 'B', 'Good question! Air scatters blue light the most, so blue reaches your eyes from all over the sky.');
  const vote = [box(d, s, MX, 5.4, W - 2 * MX, 0.98, { fill: TINT.amber, line: HEX.amber, lw: 1.25 }),
    d.text(s, 'You just did a rater’s job. A scoring model learns what raters prefer, then grades every practice try.', { x: MX + 0.3, y: 5.4, w: W - 2 * MX - 0.6, h: 0.98, fontSize: 21, bold: true, color: HEX.text, valign: 'middle' })];
  src(d, s, 'Recipe: OpenAI, InstructGPT (Ouyang et al., 2022), steps 2–3 · the answers are made-up examples');
  d.animate(s, [...rt, q, ...A_, ...B_], { auto: true, effect: 'fade' });
  d.animate(s, bt, { auto: true, effect: 'zoom', dur: 400 });
  d.animate(s, vote, { effect: 'zoom', dur: 400 });
  notes(s, {
    min: '0.75',
    build: 'The question and answers A and B show automatically. Click 1: “you just did a rater’s job”.',
    say: 'Now the homework and exams: reinforcement learning. The model tries, gets graded, and learns from every grade. Who grades it? Grader one: people. Here is one question with two made-up answers; both are correct. Hands up for A! Hands up for B! [Count roughly.] [Click.] You just did the job of an AI rater. Real raters compare many pairs like this, and a second model, a scoring model, learns what they prefer. Then the chatbot practices, and the scoring model grades each try. Our class vote does not train anything.',
    analogy: 'Homework and exams: graded practice changes what you know, and the grade is the treat.',
    terms: 'RLHF (reinforcement learning from human feedback: the people-votes grader), scoring model (also called a reward model).',
    ask: 'On the slide (HANDS UP): “A or B?” Expected: most pick B.',
    takeaway: 'People’s preferences become a scoring model that grades the chatbot’s practice.',
    advanced: 'Anthropic also trains Claude with a written constitution (Constitutional AI, 2022; Claude’s constitution, Jan 2026): the model critiques its own answers against principles and revises them, and AI feedback partly replaces human votes.',
    caveats: 'The A/B answers are made-up (labelled). Raters’ preferences can reward flattery (“Good question!”), which is one way training can go subtly wrong.',
    sources: ['https://arxiv.org/abs/2203.02155', 'https://arxiv.org/abs/2212.08073 (Constitutional AI)', 'https://www.anthropic.com/constitution'],
  });
  return s;
}

async function checkerSlide(d) {
  const s = page(d, 'Grader 2: a program checks the answer');
  const top = [...await iconDisc(d, s, 'FaCalculator', MX + 0.7, 2.35, 1.1, HEX.amber, TINT.amber),
    await ic(d, s, 'FaArrowRight', HEX.steel, MX + 1.5, 2.15, 0.4),
    ...await iconDisc(d, s, 'FaCheckCircle', MX + 2.6, 2.35, 1.1, HEX.teal, TINT.teal),
    d.text(s, 'Math and code: a right final answer earns the reward.', { x: MX + 3.5, y: 1.75, w: W - 2 * MX - 3.5, h: 1.2, fontSize: 28, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'middle' })];
  const nums = [bigNum(d, s, '15.6%', { x: MX, y: 3.35, w: 4.2, h: 1.6, size: 80, color: HEX.muted }),
    d.text(s, 'before practice', { x: MX, y: 4.95, w: 4.2, h: 0.5, fontSize: 22, color: HEX.muted }),
    seg(d, s, MX + 4.4, 4.25, MX + 5.8, 4.25, { color: HEX.amber, width: 5, arrow: true }),
    bigNum(d, s, '71%', { x: MX + 6.1, y: 3.35, w: 4.0, h: 1.6, size: 96, color: HEX.amber }),
    d.text(s, 'after practice', { x: MX + 6.1, y: 4.95, w: 4.0, h: 0.5, fontSize: 22, color: HEX.amber }),
    d.text(s, 'DeepSeek-R1-Zero on a hard high-school math contest (AIME 2024)', { x: MX, y: 5.7, w: W - 2 * MX, h: 0.6, fontSize: 22, color: HEX.text, valign: 'middle' })];
  src(d, s, 'DeepSeek-R1 paper, arXiv 2501.12948 v1 (Jan 22, 2025): R1-Zero pass@1 on AIME 2024');
  d.animate(s, top, { auto: true, effect: 'fade' });
  d.animate(s, nums, { effect: 'rise' });
  notes(s, {
    min: '0.5',
    build: 'The checker idea shows automatically. Click 1: 15.6% to 71%.',
    say: 'Grader two: a checker program. For math and code, a program can check the final answer, and a right answer earns the reward. [Click.] DeepSeek’s R1-Zero practised this way on a hard math contest and went from 15.6% to 71%. Spoken, if time: name a task a computer can’t easily check. [Writing a poem, giving advice.]',
    terms: 'checker (a program that checks a final answer), AIME (a hard US high-school math contest).',
    ask: 'Spoken only: “Name a task a computer can’t easily check.” Expected: a good poem, advice; that is why checkers work best for math and code.',
    takeaway: 'Where answers can be checked automatically, practice with rewards works very well.',
    advanced: 'DeepSeek’s R1-Zero RL used about 100,000 GPU hours, 3.75% of its pretraining compute (Khatri et al., Oct 2025, from DeepSeek’s numbers).',
    caveats: '15.6% and 71% are R1-Zero’s pass@1 scores on AIME 2024 in the arXiv v1 paper (later versions report different numbers). Checkers can be gamed: a model may get the reward without doing what we meant (Part 3).',
    sources: ['https://arxiv.org/abs/2501.12948v1', 'https://arxiv.org/abs/2510.13786 (Khatri et al.)'],
  });
  return s;
}

async function cherrySlide(d) {
  const s = page(d, 'The cherry is growing', { transition: 'push' });
  const small = cake(d, s, MX + 0.4, 2.05, 0.62, { plate: true });
  const L = [...small.all, d.text(s, [{ text: '2024: ', options: { bold: true, color: HEX.text } }, { text: 'DeepSeek-V3 spent about 0.2% of its chip time on post-training', options: { color: HEX.text } }], { x: MX, y: 4.7, w: 5.6, h: 1.1, fontSize: 21, valign: 'top' }),
    d.text(s, '(our division of its report)', { x: MX, y: 5.8, w: 5.6, h: 0.4, fontSize: 16, color: HEX.muted })];
  const big = cake(d, s, MX + 6.6, 2.05, 0.62, { plate: true, cherryK: 2.6 });
  const R_ = [...big.all, d.text(s, [{ text: '2025: ', options: { bold: true, color: HEX.text } }, { text: 'xAI says it ran RL “at pretraining scale” for Grok 4', options: { color: HEX.text } }], { x: MX + 6.3, y: 4.7, w: 5.8, h: 1.1, fontSize: 21, valign: 'top' }),
    d.text(s, '(company claim, no numbers)', { x: MX + 6.3, y: 5.8, w: 5.8, h: 0.4, fontSize: 16, color: HEX.muted })];
  src(d, s, 'DeepSeek-V3 report, arXiv 2412.19437 · xAI, “Grok 4” (Jul 9, 2025) · A. Karpathy, “2025 LLM Year in Review” · cakes drawn by us');
  d.animate(s, L, { auto: true, effect: 'fade' });
  d.animate(s, R_, { effect: 'zoom', dur: 500 });
  notes(s, {
    min: '0.5',
    build: 'The 2024 cake shows automatically. Click 1: the 2025 cake with a much bigger cherry.',
    say: 'In LeCun’s cake, RL was the cherry: small. In 2024, DeepSeek-V3 spent about 0.2% of its chip time on post-training. [Click.] But the cherry is growing. In 2025, xAI said it ran RL for Grok 4 “at pretraining scale”. And Andrej Karpathy, a well-known AI researcher, wrote at the end of 2025 that RL “gobbled up the compute that was originally intended for pretraining”. That is his expert view, not a lab’s numbers.',
    takeaway: 'Labs now spend far more of their computing on graded practice than before.',
    advanced: 'Epoch AI (May 2025): OpenAI said o3 was a 10-times scale-up in training compute from o1, “almost certainly referring to reasoning training compute”.',
    caveats: '“About 0.2%” is our division of DeepSeek-V3’s reported GPU hours (5 thousand for post-training out of about 2.8 million). “At pretraining scale” is xAI’s own phrase, with no numbers. An analyst estimate (SemiAnalysis, seen only second-hand) puts post-training at about half of two labs’ compute; not on the slide.',
    sources: ['https://arxiv.org/abs/2412.19437 (DeepSeek-V3: 2,664K pretraining, 119K context extension, 5K post-training GPU hours)', 'https://x.ai/news/grok-4', 'https://karpathy.bearblog.dev/year-in-review-2025/', 'https://epoch.ai/gradient-updates/how-far-can-reasoning-models-scale'],
  });
  return s;
}

// =====================================================================================
// PART 1 · CHIPS
async function cpuSlide(d) {
  const s = page(d, 'A CPU: a few strong workers', { transition: 'push' });
  const ph = await d.frame(s, RN('cpu-ryzen-9-9950x.jpg'), { x: MX, y: 1.75, w: 4.2, h: 4.2 }, { pad: 0.05, align: 'left' });
  const G = 4.2, gx = MX + 4.7, gy = 1.75, sq = (G - 3 * 0.18) / 4, cores = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) cores.push({ name: box(d, s, gx + c * (sq + 0.18), gy + r * (sq + 0.18), sq, sq, { fill: HEX.amber, line: HEX.amber, lw: 0, radius: 0.05 }), delay: (r * 4 + c) * 40 });
  const rx = gx + G + 0.45, rw = W - MX - rx;
  const t = [bigNum(d, s, '16', { x: rx, y: 1.75, w: rw, h: 1.5, size: 110 }),
    d.text(s, 'cores: strong workers that can each do almost anything, one step after another', { x: rx, y: 3.3, w: rw, h: 2.0, fontSize: 22, color: HEX.text, valign: 'top' })];
  const cap = d.text(s, 'A fast desktop CPU: AMD Ryzen 9 9950X', { x: MX, y: 6.0, w: 4.2, h: 0.4, fontSize: 16, color: HEX.muted });
  src(d, s, 'Cores: AMD · photo: 4300streetcar, CC BY 4.0, Wikimedia Commons');
  d.animate(s, [...ph, cap, ...t], { auto: true, effect: 'fade' });
  d.animate(s, cores, { auto: true, effect: 'zoom', dur: 250, after: 200 });
  notes(s, {
    min: '0.5',
    build: 'No clicks: the chip, its 16 cores and the number appear on their own.',
    say: 'All this training runs on chips. The chip in your laptop is a CPU, the computer’s main brain. This one, a fast desktop CPU, has 16 cores: 16 strong workers, each able to do almost anything, one step after another.',
    analogy: 'A few professors: brilliant, but only a few of them.',
    terms: 'CPU (the computer’s main chip), core (one worker inside a chip).',
    takeaway: 'A CPU has a few strong workers.',
    caveats: 'Each orange square is one core (a drawing).',
    sources: ['https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-9-9950x.html (16 cores)', 'https://commons.wikimedia.org/wiki/File:AMD_Ryzen_9_9950X.jpg (4300streetcar, CC BY 4.0)'],
  });
  return s;
}

async function gpuQSlide(d) {
  const s = page(d, 'How many cores in one AI chip?');
  const L = [await ic(d, s, 'PiGraphicsCardFill', HEX.muted, MX + 0.4, 1.9, 2.6),
    d.text(s, [{ text: 'An AI chip is called a GPU. ', options: { bold: true, color: HEX.text } }, { text: 'GPUs were first built for video-game graphics.', options: { color: HEX.text } }], { x: MX, y: 4.7, w: 4.0, h: 1.6, fontSize: 22, valign: 'top' })];
  const rx = 5.1, rw = W - MX - rx;
  const Q = [box(d, s, rx, 1.75, rw, 4.65, { fill: HEX.card2, line: HEX.red, lw: 1.25 }),
    ...await beatTag(d, s, 'GUESS FIRST', 'FaQuestionCircle', rx + 0.25, 1.95),
    d.text(s, 'How many cores in one AI chip (a GPU)? Hands up for A, B or C.', { x: rx + 0.25, y: 2.4, w: rw - 0.5, h: 1.2, fontSize: 28, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'middle' })];
  const tw = (rw - 0.5 - 2 * 0.25) / 3;
  ['16', '1,600', '16,000'].forEach((t, i) => Q.push(...optionTile(d, s, 'ABC'[i], t, rx + 0.25 + i * (tw + 0.25), 3.95, tw, 2.1, { size: 36 })));
  src(d, s, 'Answer on the next slide (NVIDIA)');
  d.animate(s, [...L, ...Q], { auto: true, effect: 'fade' });
  notes(s, {
    min: '0.5',
    build: 'No clicks: the question and the three options show on their own.',
    say: 'An AI chip is called a GPU; GPUs were first made for video-game graphics. Guess first: how many cores in one AI chip? A, 16. B, 1,600. C, 16,000. Hands up! [Count roughly.]',
    terms: 'GPU (graphics processing unit: thousands of simple cores; built for games, now used for AI).',
    ask: 'On the slide (GUESS FIRST): “How many cores in one AI chip (a GPU)?” Hands up for A (16), B (1,600) or C (16,000). Answer: C, 16,896 for the H100 (SXM version).',
    takeaway: 'Commit to a guess before the answer.',
    sources: ['https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/'],
  });
  return s;
}

async function gpuSlide(d) {
  const s = page(d, 'A GPU: 16,896 simple workers', { transition: 'push' });
  const G = 4.7, fx = MX, fy = 1.75;
  const field = await d.frame(s, D('gpu_dots_16896.png'), { x: fx, y: fy, w: G, h: G }, { border: false, shadow: false });
  const zb = d.name('zoombox');
  s.addShape(d.pres.shapes.RECTANGLE, { x: fx - 0.03, y: fy - 0.03, w: 0.32, h: 0.32, fill: { color: HEX.text, transparency: 100 }, line: { color: HEX.text, width: 2 }, objectName: zb });
  const zs = 2.0, zx = fx + G + 0.5, zy = 1.75;
  const zoom = [zb, seg(d, s, fx + 0.29, fy + 0.1, zx, zy + 0.1, { color: HEX.text, width: 1.5 }), ...await d.frame(s, D('gpu_dots_zoom.png'), { x: zx, y: zy, w: zs, h: zs }, { pad: 0.04, shadow: false }),
    d.text(s, 'zoomed in: one square, one core', { x: zx - 0.1, y: zy + zs + 0.08, w: zs + 0.2, h: 0.7, fontSize: 14, color: HEX.muted, align: 'center', valign: 'top' })];
  const card = have(D('h100_card.jpg')) ? [...await d.frame(s, D('h100_card.jpg'), { x: zx, y: 4.65, w: zs, h: 1.75 }, { pad: 0.1, frameColor: 'E9ECF1' })] : [];
  const rx = zx + zs + 0.5, rw = W - MX - rx;
  const t = [...chip(d, s, 'C WAS RIGHT', rx, 1.8, 2.1, HEX.red, { h: 0.5, fontSize: 18 }),
    bigNum(d, s, '16,896', { x: rx, y: 2.45, w: rw, h: 1.2, size: 60 }),
    d.text(s, 'cores in an NVIDIA H100: about a thousand times as many as the CPU', { x: rx, y: 3.7, w: rw, h: 1.4, fontSize: 21, color: HEX.text, valign: 'top' }),
    d.text(s, 'But each one is much simpler than a CPU core.', { x: rx, y: 5.2, w: rw, h: 1.0, fontSize: 18, color: HEX.amber, valign: 'top' })];
  src(d, s, `Cores: NVIDIA (H100 SXM5: 132 by 128, drawn as dots)${card.length ? ' · card photo: Geekerwan, CC BY 3.0, Wikimedia Commons (cropped)' : ''}`);
  d.animate(s, [...field, ...t], { auto: true, effect: 'fade' });
  d.animate(s, [...zoom, ...card], { effect: 'fade' });
  notes(s, {
    min: '0.75',
    build: 'The field of 16,896 dots and the answer show automatically. Click 1: the zoomed corner and a photo of an H100 card.',
    say: 'C: NVIDIA’s H100 has 16,896. Every dot here is one core, about a thousand times as many as the CPU. [Click.] There are so many that they blur together; the square zooms into one corner, where you can see single cores. But each GPU core is much simpler than a CPU core: it is not a thousand times faster at everything.',
    analogy: 'A stadium full of students who can each only do simple sums, but all at the same moment.',
    takeaway: 'A GPU has thousands of simple workers doing sums at the same time.',
    advanced: '“About a thousand times as many cores” is our division (16,896 against 16). The H100 SXM5 has 132 streaming multiprocessors with 128 cores each, so the field is 132 columns by 128 rows. It also has 528 “Tensor Cores” built for the multiply-and-add sums neural networks use.',
    caveats: 'The 16,896 count is NVIDIA’s figure for the H100 SXM5 (the server version); the card in the photo is the PCIe version, which NVIDIA lists with 14,592, so both round to “C”.',
    sources: ['https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/ (H100 SXM5: 16,896 FP32 CUDA cores; PCIe: 14,592)', 'https://commons.wikimedia.org/wiki/File:NVIDIA_H100_(%E6%9E%81%E5%AE%A2%E6%B9%BEGeekerwan)_011.png (Geekerwan, CC BY 3.0)'],
  });
  return s;
}

async function paintballSlide(d) {
  const s = page(d, 'MythBusters: one paintball barrel, or 1,100');
  const hw = (W - 2 * MX - 0.35) / 2, py = 1.75, ph = 3.65;
  const L = [box(d, s, MX, py, hw, ph, { fill: HEX.card, line: HEX.line })];
  L.push(box(d, s, MX + 0.4, py + 1.55, 1.1, 0.5, { fill: HEX.steel, line: HEX.steel, lw: 0, radius: 0.05 }));
  for (let k = 0; k < 4; k++) L.push(oval(d, s, MX + 1.65 + k * 0.24, py + 1.73, 0.13, 0.13, HEX.red, HEX.red, 0));
  const fcx = MX + 4.1, fcy = py + 1.4, fr = 0.95;
  for (let k = 0; k < 22; k++) { const t = (k / 22) * 2 * Math.PI; L.push(oval(d, s, fcx + fr * Math.cos(t) - 0.07, fcy + fr * Math.sin(t) - 0.07, 0.14, 0.14, HEX.red, HEX.red, 0)); }
  for (const [x, y] of [[-0.35, -0.3], [0.35, -0.3]]) L.push(oval(d, s, fcx + x - 0.09, fcy + y - 0.09, 0.18, 0.18, HEX.red, HEX.red, 0));
  for (let k = 0; k <= 8; k++) { const t = Math.PI * (0.18 + 0.64 * k / 8); L.push(oval(d, s, fcx + 0.55 * Math.cos(t) - 0.06, fcy + 0.1 + 0.42 * Math.sin(t) - 0.06, 0.12, 0.12, HEX.red, HEX.red, 0)); }
  L.push(d.text(s, [{ text: 'One barrel, one dot at a time', options: { bold: true, color: HEX.text, breakLine: true } }, { text: 'like a CPU', options: { color: HEX.amber, bold: true } }], { x: MX + 0.3, y: py + ph - 1.1, w: hw - 0.6, h: 1.0, fontSize: 22, valign: 'middle' }));
  const rx = MX + hw + 0.35;
  const Rr = [box(d, s, rx, py, hw, ph, { fill: TINT.amber, line: HEX.amber, lw: 1.25 })];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 14; c++) Rr.push(oval(d, s, rx + 0.45 + c * 0.38, py + 0.3 + r * 0.27, 0.16, 0.16, HEX.steel, HEX.steel, 0));
  Rr.push(d.text(s, [{ text: '1,100 barrels at once: the Mona Lisa', options: { bold: true, color: HEX.text, breakLine: true } }, { text: 'like a GPU: 80 milliseconds, NVIDIA says', options: { color: HEX.amber, bold: true } }], { x: rx + 0.3, y: py + ph - 1.1, w: hw - 0.6, h: 1.0, fontSize: 22, valign: 'middle' }));
  const last = [box(d, s, MX, 5.65, W - 2 * MX, 0.78, { fill: HEX.card2, line: HEX.line }),
    d.text(s, 'Training is billions of tiny sums, so thousands of simple workers win.', { x: MX + 0.3, y: 5.65, w: W - 2 * MX - 0.6, h: 0.78, fontSize: 24, bold: true, color: HEX.text, valign: 'middle' })];
  src(d, s, 'MythBusters for NVIDIA, NVISION 2008: 1,100 barrels (bit-tech) · “painted the Mona Lisa in 80ms” (NVIDIA’s NVISION page) · drawings ours');
  d.animate(s, L, { auto: true, effect: 'fade' });
  d.animate(s, Rr, { effect: 'fade' });
  d.animate(s, last, { effect: 'rise' });
  notes(s, {
    min: '0.75',
    build: 'The one-barrel half shows automatically. Click 1: the 1,100-barrel half. Click 2: “training is billions of tiny sums”.',
    say: 'Here is the best demo, made for NVIDIA in 2008 by the MythBusters. A small robot fired paintballs one at a time to paint a smiley face: that is the CPU way. [Click.] Then a machine with 1,100 barrels fired them all at once and painted the Mona Lisa: NVIDIA says it took 80 milliseconds. [Click.] Training is billions of tiny sums, multiply and add, over and over, so thousands of simple workers win.',
    analogy: 'The MythBusters paintball demo: one barrel versus 1,100.',
    takeaway: 'GPUs win at AI because training is a huge number of simple sums done at once.',
    caveats: 'Drawings, not frames of the video. The 1,100 barrels are from bit-tech’s report; “80 ms” is NVIDIA’s own NVISION page (another outlet reported a different time). THE VIDEO IS OPTIONAL AND NOT EMBEDDED: only third-party re-uploads were found, none on NVIDIA’s channel: https://www.youtube.com/watch?v=ZrJeYFxpUyQ , https://www.youtube.com/watch?v=fKK933KK6Gg , https://www.youtube.com/watch?v=WmW6SD-EHVY . If you show one, watch it first and take the time out of this part.',
    sources: ['https://www.bit-tech.net/news/mythbusters-finish-nvision-in-style/1 (1,100 barrels)', 'https://www.nvidia.com/content/nvision2008/ (“painted the Mona Lisa in 80ms”)'],
  });
  return s;
}

async function nvHeadSlide(d) {
  const s = page(d, 'Nvidia: the first company worth $5 trillion', { transition: 'push' });
  const hl = await d.frame(s, RN('hl-entrepreneur-nvidia-5t.png'), { x: MX + 0.4, y: 1.8, w: 8.6, h: 3.6 }, { pad: 0.08, rot: -1.2 });
  const cap = d.text(s, 'Entrepreneur, Oct 29, 2025: a year ago. Its value moves every day.', { x: MX + 0.4, y: hl.geom.y + hl.geom.h + 0.25, w: 8.6, h: 0.45, fontSize: 16, italic: true, color: HEX.muted });
  const rx = 9.75, rw = W - MX - rx;
  const why = [box(d, s, rx, 1.8, rw, 4.6, { fill: HEX.card2, line: HEX.amber, lw: 1.25 }),
    d.text(s, [{ text: 'Why is it so hard to beat?', options: { bold: true, color: HEX.text, breakLine: true, paraSpaceAfter: 14 } }, { text: '1 · fast chips', options: { color: HEX.amber, bold: true, breakLine: true, paraSpaceAfter: 6 } }, { text: '2 · the software', options: { color: HEX.amber, bold: true, breakLine: true, paraSpaceAfter: 6 } }, { text: '3 · the wiring', options: { color: HEX.amber, bold: true } }], { x: rx + 0.25, y: 1.9, w: rw - 0.45, h: 4.4, fontSize: 24, valign: 'middle' })];
  src(d, s, 'Entrepreneur, “Nvidia becomes the first to pass $5 trillion in market value” (Oct 29, 2025)');
  d.animate(s, [...hl, cap], { auto: true, effect: 'fade' });
  d.animate(s, why, { effect: 'rise' });
  notes(s, {
    min: '0.5',
    build: 'The headline shows automatically. Click 1: “why is it so hard to beat?” and its three reasons.',
    say: 'One company makes most of the chips used to train AI: NVIDIA. In October 2025, a year ago, it became the first company ever worth five trillion dollars; its value moves every day, so treat that as a snapshot. People call it an effective monopoly: not illegal, but very hard to compete with. [Click.] Why? Three reasons, one slide each.',
    terms: 'effective monopoly (one company has most of a market: not illegal, but hard to compete with).',
    takeaway: 'NVIDIA dominates AI chips.',
    caveats: 'No primary source gives NVIDIA’s share of AI chips; secondary estimates run from about 75% to about 90% of AI-chip revenue (not on the slide; do not state one number). CHECK ON NOV 21: NVIDIA reports results around Nov 18; check a live quote or just say “in October 2025”.',
    sources: ['https://www.entrepreneur.com/business-news/nvidia-becomes-the-first-to-pass-5-trillion-in-market-value/498929'],
  });
  return s;
}

async function nv1Slide(d) {
  const s = page(d, 'Reason 1: the fastest AI chips');
  const ph = have(D('h100_card.jpg')) ? await d.frame(s, D('h100_card.jpg'), { x: MX, y: 1.8, w: 4.6, h: 4.0 }, { pad: 0.12, frameColor: 'E9ECF1' }) : [];
  const rx = MX + 5.1, rw = W - MX - rx;
  const t = [bigNum(d, s, '$75.2 billion', { x: rx, y: 1.8, w: rw, h: 1.4, size: 66 }),
    d.text(s, 'of data-center sales in three months (ending April 2026)', { x: rx, y: 3.25, w: rw, h: 1.0, fontSize: 24, color: HEX.text, valign: 'top' }),
    d.text(s, 'company-reported, to the US regulator (SEC)', { x: rx, y: 4.3, w: rw, h: 0.5, fontSize: 18, italic: true, color: HEX.muted, valign: 'top' })];
  src(d, s, 'NVIDIA Q1 fiscal 2027 results (SEC filing, May 20, 2026)' + (ph.length ? ' · photo: Geekerwan, CC BY 3.0 (cropped)' : ''));
  d.animate(s, [...ph, ...t], { auto: true, effect: 'fade' });
  notes(s, {
    min: '0.5',
    build: 'No clicks: the photo and the number appear on their own.',
    say: 'One: fast chips that everyone wants. In just three months ending in April this year, NVIDIA says it sold 75 billion dollars of data-center products.',
    takeaway: 'Reason 1: NVIDIA sells the chips everyone wants.',
    advanced: 'Data-center revenue is company-reported for NVIDIA’s Q1 of fiscal 2027 (quarter ended April 2026; total revenue $81.6 billion).',
    caveats: 'Company-reported figure.',
    sources: ['https://www.sec.gov/Archives/edgar/data/0001045810/000104581026000051/q1fy27pr.htm'],
  });
  return s;
}

async function nv2Slide(d) {
  const s = page(d, 'Reason 2: CUDA, the software everyone uses', { transition: 'push' });
  const L = [await ic(d, s, 'FaCode', HEX.blue, MX, 1.85, 1.3),
    bigNum(d, s, '6 million', { x: MX + 1.6, y: 1.7, w: 5.6, h: 1.3, size: 64, color: HEX.blue }),
    d.text(s, 'developers use CUDA, NVIDIA’s toolkit for its chips (NVIDIA says). Built since 2006–07.', { x: MX, y: 3.25, w: 6.9, h: 1.2, fontSize: 22, color: HEX.text, valign: 'top' })];
  const rx = 7.85, rw = W - MX - rx;
  const Q = [box(d, s, rx, 1.75, rw, 3.0, { fill: HEX.card2, line: HEX.red, lw: 1.25 }),
    ...await beatTag(d, s, 'HANDS UP', 'FaHandPaper', rx + 0.25, 1.95),
    d.text(s, 'All your class’s apps run on one brand of chip. A cheaper brand appears. Do you switch?', { x: rx + 0.25, y: 2.4, w: rw - 0.5, h: 2.25, fontSize: 24, bold: true, color: HEX.text, valign: 'middle' })];
  const lock = [box(d, s, MX, 4.85, W - 2 * MX, 1.5, { fill: TINT.blue, line: HEX.blue, lw: 1.25 }),
    await ic(d, s, 'FaLock', HEX.blue, MX + 0.35, 5.25, 0.7),
    d.text(s, [{ text: 'Lock-in: ', options: { bold: true, color: HEX.text } }, { text: 'lots of AI software is written for CUDA, so switching chips means rewriting and re-testing it.', options: { color: HEX.text } }], { x: MX + 1.35, y: 4.85, w: W - 2 * MX - 1.6, h: 1.5, fontSize: 22, valign: 'middle' })];
  src(d, s, 'NVIDIA developer forum (Mar 18, 2026): “6 million developers”');
  d.animate(s, [...L, ...Q], { auto: true, effect: 'fade' });
  d.animate(s, lock, { effect: 'rise' });
  notes(s, {
    min: '0.75',
    build: 'The number and the hands-up question show automatically. Click 1: lock-in.',
    say: 'Two, the big one: software. Since 2006 NVIDIA has built CUDA, the toolkit programmers use to run code on its chips. NVIDIA says 6 million developers use it. Hands up: all your class’s apps run on one brand of chip. A cheaper brand appears. Do you switch? [Take hands for yes, then no.] [Click.] Switching means rewriting and re-testing everything: that is called lock-in.',
    analogy: 'Apps that only run on one brand of phone: even if another phone is cheaper, switching means losing your apps.',
    terms: 'CUDA (NVIDIA’s software toolkit for its chips), lock-in (switching is too costly).',
    ask: 'On the slide: “Do you switch?” Hands up for yes, then no. Expected: a split; “no, my apps wouldn’t work” is the point.',
    takeaway: 'Reason 2: software written for NVIDIA’s chips makes switching hard.',
    caveats: 'The “6 million developers” is NVIDIA’s own figure. The lock-in explanation is the common one, not a figure from one source. CUDA’s start is 2006 by NVIDIA’s telling (public release 2007), hence “2006–07”.',
    sources: ['https://forums.developer.nvidia.com/t/cuda-is-nvidia-s-platform-for-accelerated-computing-and-the-foundation-for-gpu-computing/363954'],
  });
  return s;
}

async function nv3Slide(d) {
  const s = page(d, 'Reason 3: the wiring between thousands of chips');
  const n = 5, gx = MX + 0.3, gy = 1.95, step = 1.0, dots = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < n; c++) {
    if (c < n - 1) dots.push(seg(d, s, gx + c * step + 0.35, gy + r * step + 0.3, gx + (c + 1) * step + 0.05, gy + r * step + 0.3, { color: HEX.teal, width: 2.5 }));
    if (r < 3) dots.push(seg(d, s, gx + c * step + 0.2, gy + r * step + 0.55, gx + c * step + 0.2, gy + (r + 1) * step + 0.05, { color: HEX.teal, width: 2.5 }));
  }
  for (let r = 0; r < 4; r++) for (let c = 0; c < n; c++) dots.push(await ic(d, s, 'FaMicrochip', HEX.text, gx + c * step, gy + r * step, 0.6));
  const rx = MX + 5.6, rw = W - MX - rx;
  const t = [d.text(s, 'Training uses thousands of chips that talk to each other constantly.', { x: rx, y: 1.85, w: rw, h: 1.3, fontSize: 24, bold: true, color: HEX.text, valign: 'top' }),
    bigNum(d, s, '$7 billion', { x: rx, y: 3.3, w: rw, h: 1.1, size: 56, color: HEX.teal }),
    d.text(s, 'to buy Mellanox, a networking company, in 2020: the wiring between chips', { x: rx, y: 4.45, w: rw, h: 1.2, fontSize: 22, color: HEX.text, valign: 'top' })];
  src(d, s, 'NVIDIA newsroom (Apr 27, 2020): Mellanox, “a transaction value of $7 billion” · chips and links drawn by us');
  d.animate(s, [...dots, ...t], { auto: true, effect: 'fade' });
  notes(s, {
    min: '0.5',
    build: 'No clicks: the grid of chips and the text appear on their own.',
    say: 'Three: the wiring. Training uses thousands of chips that talk to each other all the time, and NVIDIA bought a networking company, Mellanox, for 7 billion dollars to build that wiring.',
    takeaway: 'Reason 3: NVIDIA sells the whole system, chips plus the wiring between them.',
    advanced: 'The H100’s chip-to-chip links (NVLink) carry 900 GB/s, which NVIDIA says is 7 times PCIe Gen 5.',
    caveats: 'The grid is a drawing.',
    sources: ['https://nvidianews.nvidia.com/news/nvidia-completes-acquisition-of-mellanox-creating-major-force-driving-next-gen-data-centers', 'https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/'],
  });
  return s;
}

async function rivalsSlide(d) {
  const s = page(d, 'But Nvidia has rivals', { transition: 'push' });
  const names = [['Google', 'TPU'], ['Amazon', 'Trainium'], ['AMD', 'Instinct'], ['Huawei', 'Ascend']];
  const tw = (W - 2 * MX - 3 * 0.3) / 4, tiles = [];
  names.forEach(([co, chipName], i) => {
    const x = MX + i * (tw + 0.3);
    tiles.push(box(d, s, x, 1.8, tw, 2.2, { fill: HEX.card, line: HEX.line }));
    tiles.push(d.text(s, [{ text: co, options: { bold: true, color: HEX.text, fontSize: 30, fontFace: 'Arial', breakLine: true } }, { text: chipName, options: { color: HEX.amber, fontSize: 22, bold: true } }], { x, y: 1.8, w: tw, h: 2.2, align: 'center', valign: 'middle' }));
  });
  const deals = [box(d, s, MX, 4.35, W - 2 * MX, 2.05, { fill: TINT.amber, line: HEX.amber, lw: 1.25 }),
    d.text(s, [
      { text: 'Anthropic plans up to 1 million Google TPUs. ', options: { bold: true, color: HEX.text, breakLine: true, paraSpaceAfter: 6 } },
      { text: 'OpenAI signed for 6 gigawatts of AMD chips. ', options: { bold: true, color: HEX.text, breakLine: true, paraSpaceAfter: 6 } },
      { text: 'Even the biggest labs buy from more than one company.', options: { color: HEX.text } },
    ], { x: MX + 0.3, y: 4.35, w: W - 2 * MX - 0.6, h: 2.05, fontSize: 22, valign: 'middle' })];
  src(d, s, 'Anthropic (Oct 23, 2025) · AMD (Oct 6, 2025) · AWS Trainium · Huawei (Sep 2025)');
  d.animate(s, tiles, { auto: true, effect: 'fade' });
  d.animate(s, deals, { effect: 'rise' });
  notes(s, {
    min: '0.5',
    build: 'The four rivals show automatically. Click 1: the deals.',
    say: 'But it has rivals: Google’s own TPU chips, Amazon’s Trainium, AMD and Huawei. [Click.] Anthropic plans to use up to a million Google TPUs, and OpenAI signed a deal for 6 gigawatts of AMD chips. Even the biggest labs buy from more than one company.',
    terms: 'TPU (Google’s own AI chip).',
    takeaway: 'NVIDIA leads, but rivals are growing.',
    advanced: 'Huawei’s 2025 keynote announced a three-year roadmap of Ascend chips (950, 960, 970 series).',
    caveats: 'Company announcements; “up to” is Anthropic’s wording. AMD’s chip family is named here for the tile (Instinct); the AMD release is about its GPUs for OpenAI.',
    sources: ['https://www.anthropic.com/news/expanding-our-use-of-google-cloud-tpus-and-services', 'https://www.amd.com/en/newsroom/press-releases/2025-10-6-amd-and-openai-announce-strategic-partnership-to-d.html', 'https://aws.amazon.com/ai/machine-learning/trainium/', 'https://www.huawei.com/en/news/2025/9/hc-xu-keynote-speech'],
  });
  return s;
}

// =====================================================================================
// PART 1 · SCALE
async function scalingSlide(d) {
  const s = page(d, 'Scaling laws: bigger runs, fewer mistakes');
  const chL = label(d, s, 'REDRAWN FROM KAPLAN ET AL. (OPENAI, 2020)', MX, 1.65, 7, { color: d.S.steel, size: 14 });
  const ox = MX + 0.8, oy = 5.5, pw = 6.6, ph = 3.4;
  const ax = [seg(d, s, ox, oy - ph - 0.1, ox, oy, { color: HEX.muted, width: 1.5 }), seg(d, s, ox, oy, ox + pw + 0.15, oy, { color: HEX.muted, width: 1.5, arrow: true })];
  for (let k = 0; k < 10; k++) ax.push(seg(d, s, ox + 0.2 + k * (pw - 0.4) / 9, oy, ox + 0.2 + k * (pw - 0.4) / 9, oy + 0.1, { color: HEX.muted, width: 1.25 }));
  ax.push(d.text(s, 'training compute (each tick: 10 times more)', { x: ox, y: oy + 0.14, w: pw, h: 0.4, fontSize: 18, color: HEX.muted, align: 'center' }));
  ax.push(d.text(s, 'mistakes on new text', { x: ox - 2.35, y: oy - ph / 2 - 0.22, w: ph + 0.4, h: 0.44, fontSize: 18, color: HEX.muted, align: 'center', rotate: 270 }));
  const L = (k) => Math.pow(1e-8 * Math.pow(10, k) / 2.3e8, -0.05);
  const fy = (v) => oy - 0.15 - (ph - 0.3) * (Math.log10(v) - Math.log10(2)) / (Math.log10(7) - Math.log10(2));
  const P = Array.from({ length: 10 }, (_, k) => ({ x: ox + 0.2 + k * (pw - 0.4) / 9, y: fy(L(k)) }));
  const line = [seg(d, s, P[0].x, P[0].y, P[9].x, P[9].y, { color: HEX.red, width: 5 })];
  P.forEach((p) => line.push(oval(d, s, p.x - 0.08, p.y - 0.08, 0.16, 0.16, HEX.red, HEX.red, 0)));
  const says = d.text(s, [{ text: 'Improves ', options: { color: HEX.text } }, { text: '“smoothly and predictably”', options: { color: HEX.red, bold: true } }], { x: ox + 2.3, y: oy - ph + 0.05, w: 4.4, h: 0.9, fontSize: 22, valign: 'top' });
  const rx = 8.6, rw = W - MX - rx;
  const ing = [label(d, s, 'TURN ALL THREE UP TOGETHER', rx, 1.65, rw, { color: d.S.amber, size: 14 })];
  for (const [i, [nm, c, tint, n, an]] of [['FaDatabase', HEX.blue, TINT.blue, 'Data', 'the ingredients'], ['PiCpuFill', HEX.red, TINT.red, 'Compute', 'the oven time'], ['FaScroll', HEX.amber, TINT.amber, 'Method', 'the recipe']].entries()) {
    const y = 2.05 + i * 0.95;
    ing.push(box(d, s, rx, y, rw, 0.82, { fill: tint, line: c }));
    ing.push(...await iconDisc(d, s, nm, rx + 0.47, y + 0.41, 0.6, c, HEX.card2));
    ing.push(d.text(s, [{ text: n + '  ', options: { bold: true, color: HEX.text, fontSize: 24, fontFace: 'Arial' } }, { text: an, options: { color: c, fontSize: 18, bold: true } }], { x: rx + 0.95, y, w: rw - 1.0, h: 0.82, valign: 'middle' }));
  }
  const not = [box(d, s, rx, 5.0, rw, 1.4, { fill: TINT.red, line: HEX.red }),
    d.text(s, [{ text: 'WHAT IT DOESN’T SAY', options: { fontSize: 14, bold: true, color: HEX.red, charSpacing: 2, breakLine: true } }, { text: 'which new skills appear, or when', options: { fontSize: 22, bold: true, color: HEX.text } }], { x: rx + 0.2, y: 5.02, w: rw - 0.3, h: 1.36, valign: 'middle' })];
  src(d, s, 'Kaplan et al. (2020), “Scaling Laws for Neural Language Models”, Fig. 1 (line redrawn from its published fit; numbers left off)');
  d.animate(s, [chL, ...ax], { auto: true, effect: 'fade' });
  d.animate(s, [...line, says], { auto: true, effect: 'wipeLeft', dur: 1200, after: 200 });
  d.animate(s, ing, { effect: 'rise' });
  d.animate(s, not, { effect: 'zoom', dur: 400 });
  notes(s, {
    min: '1.0',
    build: 'The axes and the line draw in automatically. Click 1: data, compute and method. Click 2: what it doesn’t say.',
    say: 'In 2020, Jared Kaplan and colleagues at OpenAI found something remarkable. As they made language models bigger, with more text and more compute, the mistakes on new text went down along a smooth, predictable line. Each tick to the right is ten times more compute: in their words, performance “improves smoothly and predictably”. That pattern is called a scaling law. [Click.] To ride it, you turn three things up together: data, the ingredients; compute, the oven time; and the method, the recipe. [Click.] What the law does NOT tell you: which new skills will show up, or when. Think: if more compute keeps cutting mistakes, what would you do if you ran a lab? Build bigger computers. That is exactly what the labs are doing.',
    analogy: 'Practice makes progress: every ten-times-more practice still helps, by a steady, predictable amount.',
    terms: 'scaling law (a steady, predictable pattern: more compute, data and model size, fewer mistakes), compute (the total amount of calculation done by chips).',
    ask: 'Spoken only: “If more compute keeps cutting mistakes, what would you do if you ran an AI lab?” Answer it yourself: spend more on chips and data centers.',
    takeaway: 'Scaling laws: more compute, data and model size cut mistakes smoothly and predictably, but do not predict which new skills appear.',
    advanced: 'Kaplan et al.’s abstract: the loss falls as a power law “with model size, dataset size, and the amount of compute used for training, with some trends spanning more than seven orders of magnitude”. Chinchilla (Hoffmann et al. 2022): “for every doubling of model size the number of training tokens should also be doubled”.',
    caveats: 'The line is redrawn from the paper’s published fit, with the numbers left off on purpose; both axes are logarithmic in the original, which is why it is straight. The measure is the model’s “loss” on new text, not a count of wrong answers.',
    sources: ['https://arxiv.org/abs/2001.08361 (Kaplan et al. 2020, Fig. 1)', 'https://arxiv.org/abs/2203.15556 (Hoffmann et al. 2022, Chinchilla)', 'https://arxiv.org/abs/2304.15004 (Schaeffer et al. 2023, on “emergent abilities”)'],
  });
  return s;
}

async function computeTrendSlide(d) {
  const s = page(d, 'Training runs grow about 5 times a year', { transition: 'push' });
  const pts = [['AlexNet', 2012.75, 4.7e17], ['AlphaGo', 2016.07, 1.9e21], ['GPT-3', 2020.4, 3.14e23], ['GPT-4', 2023.2, 2.1e25], ['Grok 4', 2025.5, 5e26], ['GPT-6 Astra', 2026.67, 1e27]];
  const ox = MX + 0.5, oy = 6.0, pw = 7.4, ph = 4.0, x0 = 2012, x1 = 2027, l0 = 17, l1 = 27.3;
  const X = (t) => ox + pw * (t - x0) / (x1 - x0), Y = (v) => oy - ph * (Math.log10(v) - l0) / (l1 - l0);
  const ax = [seg(d, s, ox, oy, ox + pw, oy, { color: HEX.muted, width: 1.5 })];
  for (let k = 18; k <= 27; k++) ax.push(seg(d, s, ox, Y(Math.pow(10, k)), ox + pw, Y(Math.pow(10, k)), { color: HEX.line, width: 0.75 }));
  for (const yr of [2012, 2016, 2020, 2024]) ax.push(d.text(s, String(yr), { x: X(yr) - 0.5, y: oy + 0.06, w: 1.0, h: 0.36, fontSize: 16, color: HEX.muted, align: 'center' }));
  ax.push(d.text(s, 'each line up: 10 times more computing', { x: ox, y: 1.65, w: pw, h: 0.4, fontSize: 16, bold: true, color: HEX.steel }));
  const dots = [];
  pts.forEach(([nm, t, v], i) => {
    const x = X(t), y = Y(v), last = i === pts.length - 1;
    dots.push({ name: oval(d, s, x - 0.13, y - 0.13, 0.26, 0.26, last ? HEX.red : HEX.amber, last ? HEX.red : HEX.amber, 0), delay: i * 250 });
    const right = i < 2, dy = nm === 'GPT-6 Astra' ? -0.42 : 0;
    dots.push({ name: d.text(s, nm, { x: right ? x + 0.2 : x - 2.2, y: y - 0.22 + dy, w: 2.0, h: 0.44, fontSize: 18, bold: true, color: last ? HEX.red : HEX.text, align: right ? 'left' : 'right', valign: 'middle' }), delay: i * 250 });
  });
  const rx = 8.8, rw = W - MX - rx;
  const big = [box(d, s, rx, 1.75, rw, 4.65, { fill: TINT.red, line: HEX.red, lw: 1.25 }),
    bigNum(d, s, '2 billion', { x: rx + 0.25, y: 1.95, w: rw - 0.5, h: 1.1, size: 54, color: HEX.red }),
    d.text(s, 'times AlexNet’s computing: GPT-6 Astra, 14 years later', { x: rx + 0.25, y: 3.1, w: rw - 0.5, h: 1.2, fontSize: 22, bold: true, color: HEX.text, valign: 'top' }),
    d.text(s, 'Estimates by Epoch AI, a research group (the labs do not publish them)', { x: rx + 0.25, y: 4.6, w: rw - 0.5, h: 1.4, fontSize: 16, color: HEX.muted, valign: 'top' })];
  src(d, s, 'Epoch AI, training-compute estimates (all_ai_models.csv, Sep–Oct 2026) and “Trends in AI” (Feb 5, 2026): 5 times a year since 2020');
  d.animate(s, ax, { auto: true, effect: 'fade' });
  d.animate(s, dots, { auto: true, effect: 'zoom', dur: 300, after: 200 });
  d.animate(s, big, { effect: 'rise' });
  notes(s, {
    min: '0.5',
    build: 'The chart and its dots appear automatically. Click 1: “2 billion times AlexNet’s computing”.',
    say: 'And the labs did build bigger. Each line up on this chart is ten times more computing. Epoch AI, a research group, finds the compute for the biggest language models has grown about five times every year since 2020. [Click.] GPT-6 Astra, this year, used about two billion times the computing of AlexNet from 2012. These are estimates: the labs do not publish them.',
    terms: 'compute (the total amount of calculation done by chips), Epoch AI (a research group that tracks AI trends).',
    takeaway: 'Training runs keep getting dramatically bigger, year after year.',
    advanced: 'Epoch’s estimates in operations: AlexNet about 4.7e17, GPT-3 about 3.1e23, GPT-6 Astra about 1e27 (range roughly 5e26 to 2e27). Astra against GPT-3 is about 3,000 times (our division).',
    caveats: 'All dots are Epoch AI estimates (confidence varies: AlphaGo and Grok 4 are “speculative”); the y-axis is a ten-times-per-line scale, said on the slide, with no numbers. “2 billion times” is our division of two Epoch estimates. Epoch’s “5 times a year” is a fitted trend for frontier language models since 2020.',
    sources: ['https://epoch.ai/data/all_ai_models.csv', 'https://epoch.ai/trends (Epoch AI Trends, Feb 2026: “5x/year”)', 'https://epoch.ai/data/notable-ai-models'],
  });
  return s;
}

async function gwQSlide(d) {
  const s = page(d, 'How many homes can one gigawatt run?');
  const ph = await d.frame(s, D('hoover_crop.jpg'), { x: MX, y: 1.75, w: 5.6, h: 3.3 }, { border: false, align: 'left' });
  const watt = d.text(s, [{ text: 'A watt measures power. ', options: { bold: true, color: HEX.text } }, { text: 'A gigawatt is a billion watts. AI companies now talk about data centers in gigawatts.', options: { color: HEX.text } }], { x: MX, y: 5.25, w: 5.6, h: 1.2, fontSize: 20, valign: 'top' });
  const rx = 6.6, rw = W - MX - rx;
  const Q = [box(d, s, rx, 1.75, rw, 4.65, { fill: HEX.card2, line: HEX.red, lw: 1.25 }),
    ...await beatTag(d, s, 'GUESS FIRST', 'FaQuestionCircle', rx + 0.25, 1.95),
    d.text(s, 'How many average US homes can one gigawatt run, nonstop?', { x: rx + 0.25, y: 2.4, w: rw - 0.5, h: 1.2, fontSize: 26, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'middle' })];
  ['under 100,000', '100,000 to 1 million', 'over 1 million'].forEach((t, i) => Q.push(...optionTile(d, s, 'ABC'[i], t, rx + 0.25, 3.75 + i * 0.85, rw - 0.5, 0.72, { size: 24 })));
  src(d, s, 'Photo: Hoover Dam, Mariordo / Wikimedia Commons, CC BY-SA 4.0 (cropped)');
  d.animate(s, [...ph, watt, ...Q], { auto: true, effect: 'fade' });
  notes(s, {
    min: '0.5',
    build: 'No clicks: the photo, the watt line and the guess show on their own.',
    say: 'All those chips need electricity, and companies now talk about AI data centers, buildings full of computers, in gigawatts. A watt measures power; a gigawatt is a billion watts. Guess first: how many homes can one gigawatt run, nonstop? Hands up for A, under 100,000… B, 100,000 to a million… C, over a million. [Count roughly.]',
    terms: 'watt (a unit of power), gigawatt (GW, a billion watts), data center (a building full of computers).',
    ask: 'On the slide (GUESS FIRST): hands up for A, B or C. Answer (next slide): B, about 850,000.',
    takeaway: 'Commit to a guess before the answer.',
    caveats: 'RUNNING LONG: this slide and the next two can be skipped together (about 1.75 minutes); then say on the Part 2 map slide that one AI campus can use as much power as a nuclear reactor makes.',
    sources: ['https://commons.wikimedia.org/wiki/File:2017_Aerial_view_Hoover_Dam_4771.jpg'],
  });
  return s;
}

async function gwASlide(d) {
  const s = page(d, 'One gigawatt: about 850,000 homes', { transition: 'push' });
  const rowsY = [1.75, 3.35, 4.95], lx = MX, vw = 3.6, ix = lx + vw + 0.3, iw = W - MX - ix;
  const val = (y, v, l) => [bigNum(d, s, v, { x: lx, y, w: vw, h: 0.85, size: 44 }), d.text(s, l, { x: lx, y: y + 0.85, w: vw, h: 0.5, fontSize: 18, color: HEX.muted, valign: 'top' })];
  const r1 = [...val(rowsY[0], '850,000', 'average US homes')];
  for (let i = 0; i < 9; i++) {
    if (i === 8) r1.push(await iconImg(d, s, 'PiHouseFill', '#4A5160', ix + i * 0.82, rowsY[0] + 0.15, 0.8));
    r1.push(await iconImg(d, s, 'PiHouseFill', '#F2F3F5', ix + i * 0.82, rowsY[0] + 0.15, 0.8, i === 8 ? 0.5 : 1));
  }
  r1.push(d.text(s, 'each house: 100,000 homes', { x: ix, y: rowsY[0] + 1.0, w: iw, h: 0.4, fontSize: 16, color: d.S.muted }));
  const r2 = [...val(rowsY[1], '1', 'typical nuclear reactor'), await iconImg(d, s, 'PiNuclearPlantFill', '#F2F3F5', ix, rowsY[1] + 0.05, 1.1),
    d.text(s, [{ text: '“A typical nuclear reactor produces 1 gigawatt of power per plant on average.”', options: { italic: true, color: HEX.text, breakLine: true } }, { text: 'U.S. Department of Energy', options: { color: d.S.steel, fontSize: 14 } }], { x: ix + 1.35, y: rowsY[1] - 0.05, w: iw - 1.35, h: 1.3, fontSize: 20, valign: 'middle' })];
  const r3 = [...val(rowsY[2], '2', 'Hoover Dams, on average'), ...await d.frame(s, D('hoover_crop.jpg'), { x: ix, y: rowsY[2], w: 2.3, h: 1.35 }, { border: false, align: 'left' }),
    d.text(s, 'Hoover Dam makes about 480 megawatts on average: about half a gigawatt.', { x: ix + 2.55, y: rowsY[2], w: iw - 2.55, h: 1.35, fontSize: 20, color: HEX.text, valign: 'middle' })];
  src(d, s, 'Sources: EIA (2024 home use) · U.S. DOE · U.S. Bureau of Reclamation · photo: Mariordo, CC BY-SA 4.0 (cropped)');
  d.animate(s, r1, { auto: true, effect: 'zoom', dur: 450 });
  d.animate(s, r2, { effect: 'rise' });
  d.animate(s, r3, { effect: 'rise' });
  notes(s, {
    min: '0.75',
    build: 'The answer (about 850,000 homes) shows automatically. Click 1: one nuclear reactor. Click 2: two Hoover Dams.',
    say: 'About 850,000 average American homes: B. [Click.] It is what one typical nuclear reactor produces, according to the U.S. Department of Energy. [Click.] And about two Hoover Dams, on average.',
    analogy: 'A gigawatt is about one nuclear reactor running nonstop.',
    terms: 'megawatt (MW, a million watts).',
    takeaway: 'A gigawatt is about 850,000 homes, one nuclear reactor, or two Hoover Dams on average.',
    advanced: 'Where 850,000 comes from (our arithmetic, in words): the EIA says an average US home used 863 kilowatt-hours a month in 2024, a steady draw of about 1.2 kilowatts, so a gigawatt covers about 850,000 such homes. At peak hours it covers fewer.',
    caveats: 'All equivalences are rounded averages. Hoover Dam: about 2,080 MW at full power and about 480 MW on average (Bureau of Reclamation: about 4.2 billion kilowatt-hours a year). The ninth house icon is drawn half-filled.',
    sources: ['https://www.eia.gov/electricity/sales_revenue_price/pdf/table_5A.pdf', 'https://www.energy.gov/ne/articles/infographic-how-much-power-does-nuclear-reactor-produce', 'https://www.usbr.gov/lc/hooverdam/faqs/powerfaq.html', 'https://commons.wikimedia.org/wiki/File:2017_Aerial_view_Hoover_Dam_4771.jpg'],
  });
  return s;
}

async function abileneSlide(d) {
  const s = page(d, 'One AI campus: 1.2 gigawatts');
  const gap = 0.4, iw = (W - 2 * MX - gap) / 2, ih = iw * 720 / 1280, y0 = 1.75;
  const before = await d.frame(s, RE('epoch_sat_stargate_abilene_2025-06.png'), { x: MX, y: y0, w: iw, h: ih }, { border: false });
  const t1 = chip(d, s, 'JUNE 2025', before.geom.x + 0.15, before.geom.y + 0.15, 1.7, HEX.card2, { h: 0.42, fontSize: 16 });
  const after = await d.frame(s, RE('epoch_sat_stargate_abilene_2026-07.png'), { x: MX + iw + gap, y: y0, w: iw, h: ih }, { border: false });
  const t2 = chip(d, s, 'JULY 2026', after.geom.x + 0.15, after.geom.y + 0.15, 1.7, HEX.red, { h: 0.42, fontSize: 16 });
  const by = y0 + ih + 0.25;
  const fact = d.text(s, [{ text: 'Stargate Abilene, Texas: ', options: { bold: true, color: HEX.text } }, { text: 'a 1.2-gigawatt campus for OpenAI. More than a nuclear reactor, for one site. ', options: { color: HEX.text } }, { text: 'Towns and states are pushing back (Part 2).', options: { bold: true, color: HEX.amber } }], { x: MX, y: by, w: W - 2 * MX, h: 6.5 - by, fontSize: 20, valign: 'middle' });
  src(d, s, 'Satellite images: Epoch AI, imagery © Airbus DS · campus size: Crusoe (Sep 30, 2025)');
  d.animate(s, [...before, ...t1, fact], { auto: true, effect: 'fade' });
  d.animate(s, [...after, ...t2], { effect: 'fade', dur: 900 });
  notes(s, {
    min: '0.5',
    build: 'June 2025 and the caption show automatically. Click 1: the same place in July 2026.',
    say: 'This is one AI campus in Texas, called Stargate Abilene, part of OpenAI’s big data-center program, from a satellite in June 2025. [Click.] And the same place thirteen months later: all eight buildings finished. It is designed for 1.2 gigawatts: more than a whole nuclear reactor, for one site. Towns and states are starting to push back against data centers like this; you will see a map in Part 2.',
    terms: 'campus (a group of buildings), Stargate (OpenAI’s large data-center program with its partners; Abilene, Texas is its first site).',
    takeaway: 'Single AI campuses now need more power than a nuclear reactor makes.',
    advanced: 'Epoch AI’s Abilene page: about 201,600 Nvidia chips and 421 MW of IT power now, projected 843 MW by the end of 2026 (estimates). Meta says its Hyperion campus “will be able to scale up to 5GW”.',
    caveats: '1.2 GW is the Abilene campus total (Crusoe), not just chip power. The satellite images are Epoch AI’s annotated views (outlines are Epoch’s), imagery © Airbus DS, shown unedited at the same scale.',
    sources: ['https://epoch.ai/data/ai-data-centers/directory/openai-stargate-abilene', 'https://www.crusoe.ai/resources/newsroom/crusoe-announces-flagship-abilene-data-center-is-live'],
  });
  return s;
}

async function grownSlide(d) {
  const s = page(d, 'Nobody typed in the rules: it was grown', { transition: 'push' });
  const q = [await ic(d, s, 'FaQuoteLeft', HEX.amber, MX, 1.8, 0.7),
    d.text(s, [{ text: '…generative AI systems are ', options: { color: HEX.text } }, { text: 'grown more than they are built', options: { color: HEX.amber } }, { text: '…', options: { color: HEX.text } }], { x: MX + 0.95, y: 1.75, w: 11.2, h: 1.45, fontSize: 36, bold: true, fontFace: 'Arial', valign: 'middle' }),
    d.text(s, 'Dario Amodei (CEO of Anthropic), quoting co-founder Chris Olah · “The Urgency of Interpretability”, April 2025', { x: MX + 0.95, y: 3.2, w: 11.2, h: 0.45, fontSize: 16, color: d.S.steel, italic: true, valign: 'top' })];
  const body = [await ic(d, s, 'FaSeedling', HEX.teal, MX, 4.0, 0.7),
    d.text(s, [{ text: 'People choose the data, method and compute, like a gardener picks soil, water and light. ', options: { color: HEX.text } }, { text: 'The rules end up in billions of learned dials.', options: { bold: true, color: HEX.text } }], { x: MX + 0.95, y: 3.85, w: 11.2, h: 1.0, fontSize: 22, valign: 'middle' })];
  const bar = [box(d, s, MX, 5.25, W - 2 * MX, 1.15, { fill: HEX.card2, line: HEX.red, lw: 1.25 })];
  bar.push(...await beatLine(d, s, { text: 'TURN TO A NEIGHBOR', iconName: 'FaComments', q: 'If you can’t read a model’s rules, how would you check it’s safe? (30 seconds)', x: MX + 0.2, y: 5.25, w: W - 2 * MX - 0.4, h: 1.15, qSize: 22 }));
  src(d, s, 'D. Amodei, “The Urgency of Interpretability” (April 2025)');
  d.animate(s, q, { auto: true, effect: 'fade' });
  d.animate(s, body, { effect: 'fade' });
  d.animate(s, bar, { effect: 'zoom', dur: 400 });
  notes(s, {
    min: '1.25',
    build: 'The quote shows automatically. Click 1: the gardener line. Click 2: turn to a neighbor.',
    say: 'Here is the most important idea of Part 1. Anthropic’s CEO, quoting his co-founder, says generative AI systems, the kind that create new text or images, are “grown more than they are built.” [Click.] Think back over this part. People choose the data, the method and the compute, like a gardener choosing soil, water and light. But nobody writes the rules. They end up spread across billions of learned dials, so even the makers cannot fully explain one particular answer. [Click.] Turn to a neighbor, 30 seconds: if you can’t read a model’s rules, how would you check that it is safe? [After 30 seconds, take two answers.] In Part 4 you will see how researchers try to read inside.',
    analogy: 'A gardener chooses the soil, water and light, but does not decide where each leaf grows.',
    terms: 'generative AI (AI that creates new text, images or other content), CEO (the head of a company), interpretability (said only: research that reads inside models; Part 4).',
    ask: 'On the slide (TURN TO A NEIGHBOR, 30 seconds, then two answers): “If you can’t read a model’s rules, how would you check it’s safe?” Good answers: test it a lot (including tricky tests), watch what it does after release, read inside it, limit what it can do.',
    takeaway: 'Modern AI is grown, not hand-written, so even its makers can’t fully read it yet.',
    advanced: 'Amodei, verbatim: “As my friend and co-founder Chris Olah is fond of saying, generative AI systems are grown more than they are built—their internal mechanisms are ‘emergent’ rather than directly designed.” He also writes: “People outside the field are often surprised and alarmed to learn that we do not understand how our own AI creations work.”',
    caveats: 'The pull quote is a verbatim fragment of the essay sentence; the amber words are our emphasis. The essay page shows only “April 2025” (TechCrunch dates it Apr 24, 2025). RUNNING LONG: drop the neighbor chat; read the question and give two answers yourself (saves about 30 seconds).',
    sources: ['https://www.darioamodei.com/post/the-urgency-of-interpretability', 'https://techcrunch.com/2025/04/24/anthropic-ceo-wants-to-open-the-black-box-of-ai-models-by-2027/'],
  });
  return s;
}

async function recapSlide(d) {
  const s = page(d, 'Five things to carry into Part 2');
  const rh = 0.74, rp = 0.84, y0 = 1.68, vx = MX + 0.95, tx = MX + 3.45;
  const groups = [];
  const rowBox = async (i, text, last) => {
    const y = y0 + i * rp;
    const g = [box(d, s, MX, y, W - 2 * MX, rh, { fill: last ? TINT.red : HEX.card, line: last ? HEX.red : HEX.line })];
    g.push(...numDisc(d, s, i + 1, MX + 0.45, y + rh / 2, 0.5, last ? HEX.red : HEX.card2, { color: HEX.text, fontSize: 18 }));
    g.push(d.text(s, text, { x: tx, y, w: W - MX - tx - 0.15, h: rh, fontSize: 22, color: HEX.text, valign: 'middle' }));
    return g;
  };
  const ycen = (i) => y0 + i * rp + rh / 2;
  let g = await rowBox(0, 'AI learns from answers, patterns or treats.');
  for (const [k, [nm, c]] of [['FaClone', HEX.blue], ['FaLayerGroup', HEX.teal], ['FaDog', HEX.amber]].entries()) g.push(await ic(d, s, nm, c, vx + k * 0.62, ycen(0) - 0.24, 0.48));
  groups.push(g);
  g = await rowBox(1, 'A network of dials, nudged downhill, blame passed back.');
  g.push(await ic(d, s, 'FaSlidersH', HEX.amber, vx, ycen(1) - 0.24, 0.48), seg(d, s, vx + 0.75, ycen(1) - 0.2, vx + 1.6, ycen(1) + 0.2, { color: HEX.red, width: 3, arrow: true }));
  groups.push(g);
  g = await rowBox(2, 'Text: left to right. Images: static, cleaned up.');
  for (let k = 0; k < 2; k++) g.push(box(d, s, vx + k * 0.36, ycen(2) - 0.14, 0.3, 0.28, { fill: HEX.card2, line: HEX.blue, radius: 0.03 }));
  g.push(seg(d, s, vx + 0.7, ycen(2), vx + 0.92, ycen(2), { color: HEX.blue, width: 2, arrow: true }));
  g.push(...await d.frame(s, ddimFile(1), { x: vx + 1.08, y: ycen(2) - 0.27, w: 0.42, h: 0.54 }, { pad: 0.01, shadow: false, border: false }));
  g.push(seg(d, s, vx + 1.53, ycen(2), vx + 1.75, ycen(2), { color: HEX.amber, width: 2, arrow: true }));
  g.push(...await d.frame(s, ddimFile(40), { x: vx + 1.8, y: ycen(2) - 0.27, w: 0.42, h: 0.54 }, { pad: 0.01, shadow: false, border: false }));
  groups.push(g);
  g = await rowBox(3, 'The cake: the lecture teaches most, then examples, homework.');
  g.push(...cake(d, s, vx + 0.2, y0 + 3 * rp + 0.06, 0.13, { plate: false }).all);
  groups.push(g);
  g = await rowBox(4, 'More chips, bigger runs, fewer mistakes, and it was grown.', true);
  g.push(await ic(d, s, 'PiCpuFill', HEX.red, vx, ycen(4) - 0.25, 0.5), await ic(d, s, 'FaSeedling', HEX.teal, vx + 0.75, ycen(4) - 0.25, 0.5));
  groups.push(g);
  const next = await beatLine(d, s, { text: 'HANDS UP', iconName: 'FaHandPaper', q: 'Back to question 2: does it understand what it says? What would count as evidence?', x: MX, y: 5.95, w: W - 2 * MX, h: 0.52, qSize: 18 });
  groups.forEach((gg, i) => d.animate(s, gg, { auto: i === 0, effect: 'rise', after: 100 }));
  d.animate(s, next, { effect: 'fade' });
  notes(s, {
    min: '1.0',
    build: 'Point 1 shows automatically. Clicks 1–4 add points 2 to 5. Click 5: the callback question.',
    say: 'Five things to carry with you. One: AI learns from answers, patterns, or treats. [Click.] Two: a neural network is a huge stack of dials; training feels the slope and steps downhill, and backpropagation passes the blame back. [Click.] Three: text AI writes left to right; image AI cleans up static. [Click.] Four: LeCun’s cake as a school year: the lecture teaches most, then worked examples, then homework and exams. [Click.] Five: more chips and bigger runs mean fewer mistakes, and what comes out is grown, not built. [Click.] Back to question 2 from the start: hands up if you think it understands what it says. [Look around.] What would count as evidence? [Take one answer, about 20 seconds.] Experts still disagree. Now, Part 2: how fast is all of this moving?',
    analogy: 'The whole of Part 1 in pictures: flash cards, a dog, a mixing board, a foggy hill, a factory line, a cake and a school year.',
    terms: 'none new (recap).',
    ask: 'On the slide (callback to question 2 of the opening): “Does it understand what it says? What would count as evidence?” Repeat the hands-up, then take one answer. Good answers: explaining in its own words, handling questions it never saw, admitting when it doesn’t know.',
    takeaway: 'How AI learns, in five lines.',
    caveats: 'No new facts; each point repeats a sourced slide above.',
    sources: ['See the Part 1 slides above (their notes hold the URLs).'],
  });
  return s;
}

// The gigawatt house row uses part of an icon (a half house).
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

// =====================================================================================
const slides = {
  // opening (three functions, five slides; build_splash.js expects these three names)
  titleSlide, hookSlide, roadmapSlide,
  // part 1 (each function adds one slide; build_splash.js puts the divider before the first)
  lionSlide, mlSlide,
  flashCardsSlide, labelSlide, unsupervisedSlide, unsupSortedSlide, unsupNewSlide, rlDogSlide, hideSeekSlide, alphaGoSlide, quiz1Slide, quiz2Slide,
  networkSlide, dialsSlide, howManySlide, lossSlide, slopeSlide, stepsSlide, landscapeSlide, backFactorySlide, backNetSlide,
  nextWordSlide, scoresSlide, staticSlide, stripSlide, practiceSlide,
  cakeQSlide, cakeSlide, cakeRealSlide,
  schoolSlide, lectureSlide, readQSlide, readASlide, clusterSlide, baseModelSlide, sftSlide, votesSlide, checkerSlide, cherrySlide,
  cpuSlide, gpuQSlide, gpuSlide, paintballSlide, nvHeadSlide, nv1Slide, nv2Slide, nv3Slide, rivalsSlide,
  scalingSlide, computeTrendSlide, gwQSlide, gwASlide, abileneSlide, grownSlide, recapSlide,
};

async function build(d) {
  await prep();
  CLOCK = 0;
  KN = 0;
  if (!d._roadmapPatch) {
    d._roadmapPatch = true;
    const realWrite = d.write.bind(d);
    d.write = async (file) => { const v = patchRoadmap(d); console.log(`  roadmap minutes: ${JSON.stringify(v)}`); return realWrite(file); };
  }
  for (const f of Object.values(slides)) await f(d);
}

// Shared drawing helpers for tools/slides_splash_p4.js (Part 4), so both files draw the same way.
const helpers = { box, rect, oval, seg, chip, ic, iconDisc, numDisc, beatTag, beatLine, beat, label, src, bigNum, capBar, statCard, optionTile, photoCard, drawNet, TINT };

module.exports = { build, slides, helpers };
