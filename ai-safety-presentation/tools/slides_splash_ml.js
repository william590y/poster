// Cornell Splash Fall 2026 · M1237 "AI Alignment and Safety" (William Liaw, Nov 21, 2026; grades 7–12).
// OPENING (3 slides, 4 min) + PART 1 · HOW AI LEARNS (19 slides, 36 min) = 40 min of a 110-minute class.
// Sources: assets/research/splash/manifest.json (verified items/facts/datasets) and, for the three adapted adult slides
// (economy:abilene/gigawatt/training), assets/research/economy/manifest.json + the adult deck's notes.
// Exports { build, slides }: build(d) adds every slide in order; slides = name -> async slide function.
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { HEX, W, MX, A } = require('./lib');
const { icon } = require('./icons');

const R = (f) => A('research', 'splash', f);
const RE = (f) => A('research', 'economy', f);
const OUT = A('slides', 'splash');
const D = (f) => path.join(OUT, f);

// ---------- derived images (crops of verified research files; originals untouched) ----------
const CROPS = {
  // PC Gamer headline + byline (breadcrumb and dek dropped), same crop as the adult deck
  'pcgamer_astra_head.png': [RE('rev2/gw_pcgamer_astra_100k_gpus.png'), { left: 0, top: 95, width: 1270, height: 690 }],
  // Hoover Dam aerial (CC BY-SA 4.0, Mariordo), same crop as the adult deck (keeps clear of the aircraft-window wedge)
  'hoover_crop.jpg': [RE('rev2/gw_commons_hoover_dam_aerial_2017.jpg'), { left: 280, top: 120, width: 1500, height: 1000 }],
  // CIFAR-10 sample table: three labeled rows (cat, deer, dog) x three images, so the labels read at room scale
  'cifar_rows3.png': [R('cifar10-labelled-grid.png'), { left: 0, top: 216, width: 428, height: 220 }],
  // one CIFAR-10 "cat" image, used as the network's input
  'cifar_cat.png': [R('cifar10-labelled-grid.png'), { left: 286, top: 224, width: 64, height: 64 }, 384],
  // hide-and-seek Fig. 1, panels (a) and (b) only: the figure's small panel titles are cropped off and replaced by
  // 12 pt captions on the slide
  'hideseek_ab.png': [R('hide-seek-fig1-six-stages.png'), { left: 40, top: 76, width: 1060, height: 496 }],
  // MAE Fig. 2: two triplets (masked | reconstruction | original), bird and French horn
  'mae_two.png': [R('selfsup-mae-masked-reconstruction-fig2.png'), { left: 1046, top: 12, width: 500, height: 346 }],
  // Wikimedia Commons "Gradient descent" (public domain): tight zoom on the red steps x0–x4 and the center, so the
  // arrows fill the inset and read at room scale (crop only; the image is otherwise unchanged)
  'gd_zoom.png': [R('gd-commons-gradient-descent-hires.png'), { left: 130, top: 680, width: 700, height: 630 }],
  // Golden Gate Claude announcement: label, headline, date and the top of the page art
  'ggc_head.png': [R('golden-gate-claude-announcement.png'), { left: 400, top: 150, width: 1760, height: 1000 }],
  // Claude's constitution page: scroll icon, title and subtitle (crop of the 2560x1600 capture)
  'constitution_head.png': [R('constitution-screenshot.png'), { left: 690, top: 190, width: 1180, height: 640 }],
};
// k-means GIF (Chire, CC BY-SA 4.0) with its 15 frames rotated (14, 0, 1, …, 13): the same loop, but the first frame
// (the one a PDF or LibreOffice shows) is the final sorted state. It loops in PowerPoint. It is also cropped to the plot
// area (x 51–637, y 0–552 of the 637×619 original), which removes the axis tick labels and the "Iteration #n" stamp
// (too small to read in a big room) and one outlying point at the bottom edge; the clusters are unchanged. Made once with:
//   gifsicle --unoptimize clustering-kmeans-convergence.gif '#14' '#0-13' > rot.gif
//   gifsicle --crop 51,0-637,552 rot.gif | gifsicle -O3 > kmeans_sorted_first.gif
// The slide credit says "cropped, frame order changed" (CC BY-SA asks for modifications to be indicated).
const KMEANS = D('kmeans_sorted_first.gif');

async function prep() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [dst, [src, box, resizeW]] of Object.entries(CROPS)) {
    const out = D(dst);
    if (fs.existsSync(out) && fs.statSync(out).mtimeMs > fs.statSync(src).mtimeMs && fs.statSync(out).mtimeMs > fs.statSync(__filename).mtimeMs) continue;
    let img = sharp(src).extract(box);
    if (resizeW) img = img.resize({ width: resizeW, kernel: 'lanczos3' });
    img = dst.endsWith('.jpg') ? img.jpeg({ quality: 92 }) : img.png();
    await img.toFile(out);
  }
}

// ---------- local helpers ----------
const TINT = { red: '2A1416', amber: '2A2112', blue: '141C2E', teal: '0F2421', steel: '1D222C' };
const K = (n) => `PART 1 · HOW AI LEARNS · ${n}`;
function kicker(s, t) { s.addText(t, { placeholder: 'kicker' }); }
function title(s, t) { s.addText(t, { placeholder: 'title' }); }

function label(d, s, text, x, y, w, { color, h = 0.3, align = 'left', size = 12 } = {}) {
  return d.text(s, text, { x, y, w, h, fontSize: size, bold: true, color: color || d.S.steel, charSpacing: 2, valign: 'bottom', align });
}
// 12pt source line (new slides keep every label at 12pt or more)
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
function oval(d, s, x, y, w, h, fill, line, lw = 1.25) {
  const n = d.name('ov');
  s.addShape(d.pres.shapes.OVAL, { x, y, w, h, fill: { color: fill }, line: { color: line || fill, width: lw }, objectName: n });
  return n;
}
function box(d, s, x, y, w, h, { fill = HEX.card, line = HEX.line, lw = 0.75, dash, transparency = 0, radius = 0.08 } = {}) {
  const n = d.name('box');
  s.addShape(d.pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: radius, fill: { color: fill, transparency }, line: { color: line, width: lw, dashType: dash }, objectName: n });
  return n;
}
function chip(d, s, text, x, y, w, fill, { h = 0.36, fontSize = 13, color = 'FFFFFF', align = 'center', bold = true, charSpacing = 1 } = {}) {
  const r = box(d, s, x, y, w, h, { fill, line: fill, radius: 0.06 });
  const t = d.text(s, text, { x: x + 0.06, y, w: w - 0.12, h, fontSize, bold, color, align, valign: 'middle', charSpacing });
  return [r, t];
}
async function ic(d, s, name, color, x, y, size) {
  const n = d.name('icon');
  s.addImage({ data: await icon(name, color.startsWith('#') ? color : '#' + color, 256), x, y, w: size, h: size, objectName: n });
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
// Speaker notes in a fixed, scannable order. The class clock is computed from the running total of `min` (reset in
// build()), so it always matches the TIME values that build_splash.js adds up for the run of show.
let CLOCK = 0;
const fmtMin = (x) => String(Math.round(x * 100) / 100);
function notes(s, o) {
  const p = [];
  const m = parseFloat(o.min) || 0, a = CLOCK, b = CLOCK + m;
  CLOCK = b;
  const extra = String(o.min).replace(/^[\d.]+\s*/, '').replace(/^\((.*)\)$/, '$1'); // e.g. '1.0 (OPTIONAL: …)'
  p.push(`TIME: ${String(o.min).match(/^[\d.]+/)[0]} min  (class minute ${fmtMin(a)}–${fmtMin(b)})${extra ? `  ·  ${extra}` : ''}`);
  if (o.build) p.push('CLICKS: ' + o.build);
  if (o.say) p.push('SAY: ' + o.say);
  if (o.analogy) p.push('ANALOGY: ' + o.analogy);
  if (o.ask) p.push('ASK THE CLASS: ' + o.ask);
  if (o.takeaway) p.push('TAKEAWAY: ' + o.takeaway);
  if (o.advanced) p.push('FOR ADVANCED STUDENTS: ' + o.advanced);
  if (o.terms) p.push('TERMS DEFINED HERE: ' + o.terms);
  if (o.caveats) p.push('HONEST CAVEATS: ' + o.caveats);
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
    { text: ' = getting AI to pursue what people actually want', options: { color: HEX.muted } },
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
    say: 'How we play: when I ask a question, you answer with your hands, or by standing up. No phones or laptops needed. Sometimes I’ll say “turn to a neighbor” for 30 seconds. To answer out loud, wait until I call on you [if there is a helper with a microphone: “and wait for the mic”]; I’ll repeat your answer so the whole room hears it. Disagreement is welcome, and I will tell you when experts disagree. Every fact I show comes from a named source. First poll! Hands up if you used an AI chatbot or an AI picture tool this week. [Look around and say roughly what you see: “about half of you”, “most of you”. Do not invent a number.] An “AI tool” is broader than you might think: even autocorrect counts. [Click.] Hands down. Now: hands up if you think it actually understands what it says. [Look around; do not judge any answer.] I won’t tell you the answer, because experts genuinely disagree. Some think these systems understand in a real sense; others think they are very good at predicting text and nothing more. In Part 1 you will learn how they are built, so you can judge for yourself; we come back to this at the end of Part 1.',
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
    ['FaBrain', 'PART 1', 'How AI learns', '36 minutes · now', 'Neural networks, chatbots, and how big labs train them'],
    ['FaTachometerAlt', 'PART 2', 'How fast it is moving', '20 minutes', 'The evidence: tests, tasks and trends'],
    ['FaExclamationTriangle', 'PART 3', 'Why it could go wrong', '30 minutes', [
      { text: 'Alignment: ', options: { bold: true, color: HEX.text } },
      { text: 'getting AI to pursue what people actually want, and keeping control', options: { color: HEX.muted } },
    ]],
    ['FaHandsHelping', 'PART 4', 'What we can do', '12 minutes + 8 Q&A', 'Research, rules, and roles you could play'],
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
    build: 'The four cards rise in automatically. Click: the bottom line.',
    say: 'Here is the plan. Part 1, right now: how AI learns. You will see what a neural network is (a computer model made of layers of simple units; we open one up in a few minutes), how a chatbot is trained, and the recipe the big labs use. Part 2: how fast it is moving, with real measurements. Part 3: why it could go wrong. That is about alignment, which means getting AI to pursue what people actually want, and keeping it under human control. We will look at the theory and the evidence so far. Part 4: what people are doing about it, and what you could do. [Click.] One promise: this is not a doom talk. These are serious, unsolved problems, and serious problems need people. Many people are working on them, and some of you might be one day.',
    ask: 'Optional, 10 seconds: “Hands up for the part you are most curious about: 1, 2, 3 or 4?”',
    takeaway: 'Four parts: how AI learns, how fast it moves, why it could go wrong, what we can do. Serious problems, not doom.',
    terms: 'alignment (getting AI to pursue what people actually want; repeat it here), neural network (a computer model made of layers of simple units; said here, shown on the “stack of dials” slide).',
    caveats: 'Minutes: opening 4 + Part 1 36 + Part 2 20 + Part 3 30 + Part 4 12 + Q&A 8 = 110.',
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
  const bw = (7.6 - 2 * 0.45) / 3, bh = 1.25;
  const row = async (y, lab, color, items, hot) => {
    const g = [label(d, s, lab, MX, y, 7.6, { color })];
    for (let i = 0; i < 3; i++) {
      const x = MX + i * (bw + 0.45), by = y + 0.32;
      g.push(box(d, s, x, by, bw, bh, { fill: hot ? TINT.red : HEX.card, line: hot ? HEX.red : HEX.line, lw: hot ? 1.25 : 0.75 }));
      g.push(await ic(d, s, items[i][0], hot ? HEX.red : HEX.muted, x + 0.18, by + 0.12, 0.42));
      g.push(d.text(s, items[i][1], { x: x + 0.18, y: by + 0.6, w: bw - 0.3, h: 0.6, fontSize: 16, color: HEX.text, valign: 'top' }));
      if (i < 2) g.push(seg(d, s, x + bw + 0.06, by + bh / 2, x + bw + 0.39, by + bh / 2, { color: hot ? HEX.red : HEX.steel, width: 2, arrow: true }));
    }
    return g;
  };
  const rowA = await row(1.7, 'CLASSIC SOFTWARE', d.S.steel, [['FaUserEdit', 'A person writes the rules'], ['FaCogs', 'The computer follows them exactly'], ['FaCheckCircle', 'Answers']], false);
  const rowB = await row(3.4, 'MACHINE LEARNING', d.S.red, [['FaImages', 'Examples with the right answers'], ['FaSyncAlt', 'Guesses, gets a score, adjusts itself'], ['FaLightbulb', 'Rules it found by itself']], true);
  // spam-filter example
  const sy = 5.1;
  const spam = [d.card(s, { x: MX, y: sy, w: 7.6, h: 0.8 })];
  spam.push(await ic(d, s, 'FaEnvelope', HEX.amber, MX + 0.2, sy + 0.17, 0.46));
  spam.push(d.text(s, [
    { text: 'Example: a spam filter. ', options: { bold: true, color: HEX.amber } },
    { text: 'People marked emails “spam” or “not spam”; the filter learned the clues itself. Nobody typed in the rules.', options: { color: HEX.text } },
  ], { x: MX + 0.85, y: sy + 0.02, w: 6.6, h: 0.76, fontSize: 16, valign: 'middle' }));
  // the class question, on the slide
  const ask = await beatLine(d, s, { text: 'HANDS UP', iconName: 'FaHandPaper', q: 'Name something you could NOT easily write rules for. (Two answers)', x: MX, y: 6.0, w: W - 2 * MX, h: 0.5 });

  // right: nested umbrella AI ⊃ ML ⊃ DL
  const rx = 8.6, rw = W - MX - rx;
  const nest = [];
  nest.push([box(d, s, rx, 1.85, rw, 4.05, { fill: HEX.card, line: HEX.steel, lw: 1 }),
    d.text(s, [
      { text: 'ARTIFICIAL INTELLIGENCE (AI)', options: { bold: true, color: HEX.text, fontSize: 15, charSpacing: 1, breakLine: true, paraSpaceAfter: 2 } },
      { text: 'The big umbrella: computers doing things we would call smart', options: { color: HEX.muted, fontSize: 16 } },
    ], { x: rx + 0.22, y: 1.95, w: rw - 0.4, h: 0.92, valign: 'top' })]);
  nest.push([box(d, s, rx + 0.25, 2.98, rw - 0.5, 2.67, { fill: TINT.amber, line: HEX.amber, lw: 1 }),
    d.text(s, [
      { text: 'MACHINE LEARNING', options: { bold: true, color: HEX.amber, fontSize: 15, charSpacing: 1, breakLine: true, paraSpaceAfter: 2 } },
      { text: 'Learns from examples', options: { color: HEX.muted, fontSize: 16 } },
    ], { x: rx + 0.45, y: 3.08, w: rw - 0.85, h: 0.85, valign: 'top' })]);
  nest.push([box(d, s, rx + 0.5, 4.05, rw - 1.0, 1.35, { fill: TINT.red, line: HEX.red, lw: 1.25 }),
    d.text(s, [
      { text: 'DEEP LEARNING', options: { bold: true, color: HEX.red, fontSize: 15, charSpacing: 1, breakLine: true, paraSpaceAfter: 2 } },
      { text: 'Machine learning with many layers of “neurons”', options: { color: HEX.text, fontSize: 16 } },
    ], { x: rx + 0.7, y: 4.13, w: rw - 1.4, h: 1.2, valign: 'top' })]);

  d.animate(s, rowA, { auto: true, effect: 'fade' });
  d.animate(s, rowB, { effect: 'wipeLeft', dur: 700 });
  d.animate(s, spam, { effect: 'rise' });
  d.animate(s, nest.flat().map((name, i) => ({ name, delay: Math.floor(i / 2) * 300 })), { effect: 'zoom', dur: 400 });
  d.animate(s, ask, { effect: 'zoom', dur: 400 });
  notes(s, {
    min: '2.0',
    build: 'Row 1 shows automatically. Click 1: the machine-learning row. Click 2: the spam example. Click 3: the nested boxes. Click 4: the hands-up question.',
    say: 'Normal software follows rules a person wrote: “if the email contains this word, put it in the spam folder.” [Click.] Machine learning flips that around. We give the program examples with the right answers, plus a score for how well it did. It guesses, gets scored, and adjusts itself, over and over, until it finds rules that work. Nobody typed those rules in. [Click.] A spam filter is a classic example: people marked emails “spam” or “not spam”, and the filter worked out the clues by itself. [Click.] Three words you will hear: AI is the big umbrella, any computer doing things we would call smart. Machine learning is the part of AI that learns from examples. Deep learning is machine learning with many layers, and we will see what those layers are in a few minutes. Today’s chatbots are deep learning. [Click.] Hands up: name something you could not easily write rules for. [Take two answers, about 30 seconds.]',
    analogy: 'Classic software is a recipe someone wrote down. Machine learning is a cook who tastes, gets told “too salty”, and adjusts until it is right.',
    ask: 'On the slide: “Name something you could NOT easily write rules for.” Format: hands up, take two answers (about 30 seconds). Expected: recognizing a face, a friend’s handwriting, telling a joke, spotting a cat in a photo.',
    takeaway: 'Machine learning finds its own rules from examples; deep learning is machine learning with many layers.',
    advanced: 'Deep learning’s turning point was the 2012 ImageNet contest. The winner (AlexNet) was “a large, deep convolutional neural network … with 60 million parameters”, trained on GPUs; its top-5 error of 16.4% beat the 2011 winner’s 25.8% (top-5 error: the right label is not among the model’s five best guesses). The contest’s organizers call 2012 “a turning point for large-scale object recognition, when large-scale deep neural networks entered the scene.” ImageNet’s labels were checked by people: “we rely on humans to verify each candidate image.”',
    terms: 'machine learning, AI, deep learning, score (how well an answer did).',
    caveats: 'People use “AI” loosely; here it means the whole field. No numbers on the slide itself (the advanced note has sourced figures).',
    sources: ['https://arxiv.org/abs/1409.0575 (Russakovsky et al., ImageNet Large Scale Visual Recognition Challenge, Sec. 5.1 and 3.1.3)', 'https://papers.nips.cc/paper_files/paper/2012/file/c399862d3b9d6b76c8436e924a68c45b-Paper.pdf (AlexNet, 60 million parameters)'],
  });
  return s;
}

// PART 1 · 2  Three ways to learn (+ self-supervised)
async function learningTypesSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  kicker(s, K(2));
  title(s, 'Three classic ways to learn, plus a fourth');
  const cw = (W - 2 * MX - 3 * 0.25) / 4, y = 1.8, h = 4.68;
  const cols = [
    { tag: 'SUPERVISED', color: HEX.blue, tint: TINT.blue, img: D('cifar_rows3.png'), an: 'Flashcards with the answers on the back', de: 'Every example comes with the right answer (a label).', fb: 'labels people wrote' },
    { tag: 'UNSUPERVISED', color: HEX.teal, tint: TINT.teal, img: KMEANS, an: 'A big pile with no labels', de: 'The program finds groups on its own.', fb: 'patterns in the data' },
    { tag: 'REINFORCEMENT', color: HEX.amber, tint: TINT.amber, img: D('hideseek_ab.png'), an: 'Trial, error and points', de: 'Like training a pet with treats. A reward is points for a good result.', fb: 'a reward (points)' },
    { tag: 'SELF-SUPERVISED', color: HEX.red, tint: TINT.red, img: D('mae_two.png'), an: 'The data hides its own answer', de: 'Hide a piece and guess it. For chatbots, the piece is the next word.', fb: 'the hidden piece itself' },
  ];
  const groups = [];
  for (let i = 0; i < 4; i++) {
    const c = cols[i], x = MX + i * (cw + 0.25);
    const g = [box(d, s, x, y, cw, h, { fill: i === 3 ? c.tint : HEX.card, line: i === 3 ? c.color : HEX.line, lw: i === 3 ? 1.25 : 0.75, dash: i === 3 ? 'dash' : undefined })];
    g.push(...chip(d, s, c.tag, x + 0.15, y + 0.15, cw - 0.3, c.color, { fontSize: 14, color: c.color === HEX.amber ? HEX.ink : 'FFFFFF', charSpacing: 2 }));
    if (i === 3) {
      // MAE triplets: label the three columns (masked input | the model's guess | the real photo)
      const fr = await d.frame(s, c.img, { x: x + 0.12, y: y + 0.6, w: cw - 0.24, h: 1.4 }, { pad: 0.04 });
      g.push(...fr);
      ['masked', 'guess', 'real'].forEach((t, k) => g.push(d.text(s, t, { x: fr.geom.x + k * fr.geom.w / 3 - 0.05, y: y + 2.02, w: fr.geom.w / 3 + 0.1, h: 0.26, fontSize: 12, bold: true, color: c.color, align: 'center', valign: 'top' })));
    } else if (i === 2) {
      // hide-and-seek panels (a) and (b), their titles cropped off and relabelled at 12 pt, like the MAE triplet
      const fr = await d.frame(s, c.img, { x: x + 0.12, y: y + 0.6, w: cw - 0.24, h: 1.4 }, { pad: 0.04 });
      g.push(...fr);
      // panel (a) spans 0.9–47.3% of the crop's width, panel (b) 52.8–99.1%
      [['(a) chasing', 0.009, 0.473], ['(b) fort building', 0.528, 0.991]].forEach(([t, a, b]) => {
        const cx = fr.geom.x + fr.geom.w * (a + b) / 2;
        g.push(d.text(s, t, { x: cx - 0.68, y: y + 2.02, w: 1.36, h: 0.26, fontSize: 12, bold: true, color: c.color, align: 'center', valign: 'top' }));
      });
    } else {
      g.push(...await d.frame(s, c.img, { x: x + 0.12, y: y + 0.62, w: cw - 0.24, h: 1.66 }, { pad: 0.04 }));
    }
    // title bottom-anchored just above the body, whatever its line count
    g.push(d.text(s, c.an, { x: x + 0.18, y: y + 2.3, w: cw - 0.3, h: 0.66, fontSize: 17, bold: true, color: HEX.text, valign: 'bottom' }));
    g.push(d.text(s, c.de, { x: x + 0.18, y: y + 3.0, w: cw - 0.3, h: 0.86, fontSize: 16, color: HEX.muted, valign: 'top' }));
    g.push(d.text(s, [
      { text: 'FEEDBACK COMES FROM', options: { fontSize: 12, bold: true, color: HEX.steel, charSpacing: 1, breakLine: true } },
      { text: c.fb, options: { fontSize: 16, bold: true, color: c.color } },
    ], { x: x + 0.18, y: y + 3.98, w: cw - 0.3, h: 0.6, valign: 'top' }));
    groups.push(g);
  }
  src(d, s, 'CIFAR-10 (Krizhevsky) · k-means GIF: Chire, Wikimedia Commons, CC BY-SA 4.0 (cropped, frame order changed) · hide-and-seek: OpenAI, Baker et al. 2019 · MAE: He et al. 2021');
  d.animate(s, groups[0], { auto: true, effect: 'rise' });
  for (let i = 1; i < 4; i++) d.animate(s, groups[i], { effect: 'rise' });
  notes(s, {
    min: '2.0',
    build: 'Supervised shows automatically; each click adds the next column.',
    say: 'Three classic ways to learn, and they differ in where the feedback comes from. SUPERVISED: like flashcards with the answers on the back. These are real pictures from CIFAR-10, a dataset (a big collection of examples) of small labeled photos, each with a label like “cat” or “dog”. [Click.] UNSUPERVISED: a big pile with no labels. Nobody told this program which dot belongs to which group; we only told it to make three groups. [Click.] REINFORCEMENT: trial, error and points, like training a pet with treats. In OpenAI’s hide-and-seek game, the hiders got a point when all of them stayed hidden, and lost a point when a seeker spotted any of them. After about 25 million games the hiders learned to build forts. [Click.] And a fourth way, SELF-SUPERVISED: the data hides its own answer. Here a program saw a photo mostly blanked out (left), guessed the missing parts (middle), and checked against the real photo (right). Nobody had to label anything. Chatbots use the next-word version: guess the next word, then check it against the real text. [Ask the room, hands up:] Which of these do you use when you study with flashcards? [Expected: supervised.]',
    analogy: 'Supervised = flashcards. Unsupervised = sorting a pile of mixed-up socks without being told the pairs. Reinforcement = a pet learning tricks for treats. Self-supervised = a fill-in-the-blank quiz you can make from any book.',
    ask: '“Which of these do you use when you study with flashcards?” Spoken at the end of the SAY (not on the slide; the quiz on the next slide is the main beat). Hands up for each kind; expected: supervised.',
    takeaway: 'The kinds of learning differ in where the feedback comes from: labels, patterns, rewards, or the data itself.',
    advanced: 'CIFAR-10 has 60,000 small labeled photos. Hide-and-seek, later: after 380 million games the seekers learned to “surf” a box over to the hiders’ shelter. The hide-and-seek reward was +1 for the hiders when all were hidden and −1 when any was seen. k-means is told how many groups to make (here k = 3); it does not discover the number by itself. Many people lump self-supervised learning under unsupervised, and experts argue about the names; what matters is where the feedback comes from. Yann LeCun’s famous “cake” (2016, renamed 2019): self-supervised learning is the cake (millions of bits of feedback per example), supervised learning the icing, reinforcement learning the cherry (a few bits). AlphaGo (2016) used both supervised learning from expert games and reinforcement learning from self-play.',
    terms: 'dataset (a big collection of examples), supervised learning, label, unsupervised learning, reinforcement learning, reward, self-supervised learning.',
    caveats: 'Hide-and-seek reward, verbatim from the paper: “hiders are given a reward of 1 if all hiders are hidden and -1 if any hider is seen by a seeker”. Timeline, from the paper: forts (shelters) “after approximately 25 million episodes”; box surfing, the seekers’ later trick, “after 380 million total episodes of training”. So “hundreds of millions of games” is true of box surfing, not of forts. The CIFAR-10 size is from its home page. The k-means GIF is cropped to its plot area (axis numbers, the “Iteration” counter and one outlying dot at the bottom edge removed) and its frames start at the finished state; the credit line says so.',
    sources: ['https://www.cs.toronto.edu/~kriz/cifar.html', 'https://commons.wikimedia.org/wiki/File:K-means_convergence.gif', 'https://arxiv.org/abs/1909.07528', 'https://arxiv.org/abs/2111.06377', 'https://syncedreview.com/2019/02/22/yann-lecun-cake-analogy-2-0/'],
  });
  return s;
}

// PART 1 · 3  Quiz: which kind of learning?
async function quizSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(3));
  title(s, 'Quiz: which kind of learning is this?');
  const bt = await beat(d, s, 'QUIZ', 'FaQuestionCircle');
  const types = [['1 finger', 'Supervised', HEX.blue], ['2 fingers', 'Unsupervised', HEX.teal], ['3 fingers', 'Reinforcement', HEX.amber], ['4 fingers', 'Self-supervised', HEX.red]];
  const lw = (W - 2 * MX - 3 * 0.2) / 4, legend = [];
  types.forEach(([f, t, c], i) => {
    const x = MX + i * (lw + 0.2);
    legend.push(box(d, s, x, 1.78, lw, 0.52, { fill: HEX.card2, line: c, lw: 1.25 }));
    legend.push(d.text(s, [{ text: f + '  ', options: { color: HEX.muted } }, { text: t, options: { bold: true, color: c } }], { x: x + 0.15, y: 1.78, w: lw - 0.3, h: 0.52, fontSize: 18, align: 'center', valign: 'middle' }));
  });
  const ins = label(d, s, 'SHOW YOUR FINGERS FOR EACH MADE-UP SCENARIO', MX, 2.36, W - 2 * MX, { color: d.S.amber });
  const sc = [
    ['A', 'A program practices with flashcards and checks each guess against an answer key.', 0, 'SUPERVISED: the answer key = labels'],
    ['B', 'A program sorts thousands of unlabeled photos into groups.', 1, 'UNSUPERVISED: no labels, it finds groups'],
    ['C', 'A game bot earns points for winning and changes its moves.', 2, 'REINFORCEMENT: points = the reward'],
    ['D', 'A program reads the start of a sentence and learns to guess the next word.', 3, 'SELF-SUPERVISED: the real next word = key'],
  ];
  const cw = (W - 2 * MX - 0.3) / 2, ch = 1.8, cards = [], answers = [];
  sc.forEach(([L, text, ti, ans], i) => {
    const x = MX + (i % 2) * (cw + 0.3), y = 2.8 + Math.floor(i / 2) * (ch + 0.12);
    const g = [box(d, s, x, y, cw, ch, { fill: HEX.card, line: HEX.line })];
    g.push(...numDisc(d, s, L, x + 0.62, y + 0.62, 0.8, HEX.card2, { color: HEX.text, fontSize: 30 }));
    g.push(d.text(s, text, { x: x + 1.25, y: y + 0.12, w: cw - 1.45, h: 1.05, fontSize: 18, color: HEX.text, valign: 'middle' }));
    cards.push(g);
    const c = types[ti][2];
    answers.push(chip(d, s, ans, x + 1.25, y + 1.25, cw - 1.45, c, { h: 0.44, fontSize: 16, color: c === HEX.amber ? HEX.ink : 'FFFFFF', align: 'left', charSpacing: 0 }));
  });
  d.animate(s, [...legend, ins, ...cards.flat()], { auto: true, effect: 'fade' });
  d.animate(s, bt, { auto: true, effect: 'zoom', dur: 400 });
  answers.forEach((a) => d.animate(s, a, { effect: 'zoom', dur: 350 }));
  notes(s, {
    min: '2.0',
    build: 'Scenarios show automatically. Clicks 1–4 reveal the answers for A, B, C, D one at a time. Read the room BEFORE each click. HOW TO READ 200 HANDS: do not count every hand; scan one section per scenario (A: the front third, B: the middle third, C: the back third, D: the whole room at a glance) and call the majority you see out loud (“mostly three fingers”).',
    say: 'Quiz time. For each made-up scenario, show me with fingers: one finger supervised, two unsupervised, three reinforcement, four self-supervised. Hold your hand up high so I can see it. Scenario A: a program practices with flashcards and checks each guess against an answer key. Fingers up! [Scan the front third, call the majority, then click.] Supervised: the answer key holds the labels. B: sorting thousands of unlabeled photos into groups. [Scan the middle third, call it, click.] Unsupervised. C: a game bot earns points for winning. [Scan the back third, call it, click.] Reinforcement, the points are the reward. D: a program reads the start of a sentence and learns to guess the next word from the words before it. [Glance across the whole room, call it, click.] Self-supervised! The answer key is the real next word, which the text already contains. Remember D: it is how the chatbots you use were first trained, by predicting the next word. It is the next big idea.',
    ask: 'The four scenarios. Expected: A 1 finger (supervised), B 2 (unsupervised), C 3 (reinforcement), D 4 (self-supervised). If many say D is “unsupervised”, that is a reasonable answer: many people group self-supervised under unsupervised. What matters is that the feedback comes from the data itself.',
    takeaway: 'Ask “where does the feedback come from?” and you can tell the kinds of learning apart.',
    advanced: 'Two flavors of self-supervised language models: masked-word models (BERT, 2018) guess a hidden word from the words on both sides; GPT-style chatbots predict the next word from the words before it (“autoregressive”). The MAE paper puts both under one idea: “they remove a portion of the data and learn to predict the removed content.”',
    terms: 'none new (reviews the previous slide).',
    caveats: 'All four scenarios are made-up examples, labeled as such on the slide. Do not reveal before the count.',
    sources: ['https://arxiv.org/pdf/2111.06377 (He et al. 2021, MAE, Introduction: GPT and BERT as self-supervised pre-training)'],
  });
  return s;
}

// PART 1 · 4  Neural network = stack of dials
async function networkSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(4));
  title(s, 'A neural network is a stack of dials');
  // input picture
  const img = await d.frame(s, D('cifar_cat.png'), { x: MX, y: 3.15, w: 1.35, h: 1.35 }, { pad: 0.05 });
  const imgLab = d.text(s, 'a photo: just pixels', { x: MX - 0.1, y: 4.55, w: 1.6, h: 0.3, fontSize: 12, color: d.S.muted, align: 'center' });
  const xs = [2.6, 4.0, 5.4, 6.8], dia = 0.36;
  const net = drawNet(d, s, { xs, cy: 3.82, gap: 0.72, layers: [4, 5, 5, 3], dia });
  const inArrow = seg(d, s, MX + 1.42, 3.82, xs[0] - 0.3, 3.82, { color: HEX.muted, width: 2, arrow: true });
  // output: highlight "cat"
  const outs = ['cat', 'dog', 'frog'];
  const outNames = [];
  const catNode = oval(d, s, xs[3] - dia / 2, net.pos[3][0].y - dia / 2, dia, dia, HEX.red, HEX.red);
  outs.forEach((o, j) => outNames.push(d.text(s, o, { x: xs[3] + 0.3, y: net.pos[3][j].y - 0.2, w: 0.9, h: 0.4, fontSize: 18, bold: j === 0, color: j === 0 ? d.S.red : d.S.muted, valign: 'middle' })));
  const layLab = [
    d.text(s, 'INPUT', { x: xs[0] - 0.6, y: 5.55, w: 1.2, h: 0.28, fontSize: 12, bold: true, color: d.S.steel, align: 'center', charSpacing: 2 }),
    d.text(s, 'HIDDEN LAYERS', { x: xs[1] - 0.3, y: 5.55, w: xs[2] - xs[1] + 0.6, h: 0.28, fontSize: 12, bold: true, color: d.S.steel, align: 'center', charSpacing: 2 }),
    d.text(s, 'OUTPUT', { x: xs[3] - 0.6, y: 5.55, w: 1.2, h: 0.28, fontSize: 12, bold: true, color: d.S.steel, align: 'center', charSpacing: 2 }),
  ];
  const dial = [await ic(d, s, 'FaSlidersH', HEX.amber, MX, 6.0, 0.42)];
  dial.push(d.text(s, [
    { text: 'Each line is a weight: ', options: { bold: true, color: HEX.amber } },
    { text: 'a dial that sets how strongly one signal pushes the next. Like a mixing board with many knobs.', options: { color: HEX.text } },
  ], { x: MX + 0.6, y: 5.92, w: 7.0, h: 0.6, fontSize: 16, valign: 'middle' }));

  // right: definitions + how many dials
  const rx = 8.3, rw = W - MX - rx;
  const card = d.card(s, { x: rx, y: 1.8, w: rw, h: 4.68 });
  const defs = d.text(s, [
    { text: 'Neuron: ', options: { bold: true, color: HEX.text } }, { text: 'a tiny unit that adds up signals.', options: { color: HEX.muted, breakLine: true, paraSpaceAfter: 6 } },
    { text: 'Weight: ', options: { bold: true, color: HEX.text } }, { text: 'a dial on each connection.', options: { color: HEX.muted, breakLine: true, paraSpaceAfter: 6 } },
    { text: 'Layer: ', options: { bold: true, color: HEX.text } }, { text: 'one column of neurons.', options: { color: HEX.muted, breakLine: true, paraSpaceAfter: 6 } },
    { text: 'Parameters: ', options: { bold: true, color: HEX.text } }, { text: 'all the dials together.', options: { color: HEX.muted, breakLine: true, paraSpaceAfter: 6 } },
    { text: 'Open model: ', options: { bold: true, color: HEX.text } }, { text: 'anyone can download its dials. ', options: { color: HEX.muted } },
    { text: 'Closed: ', options: { bold: true, color: HEX.text } }, { text: 'only its company runs it.', options: { color: HEX.muted } },
  ], { x: rx + 0.22, y: 1.92, w: rw - 0.4, h: 2.1, fontSize: 16, valign: 'top' });
  const howLab = label(d, s, 'HOW MANY DIALS?', rx + 0.22, 4.06, rw - 0.4, { color: d.S.amber });
  // row 4 says only what the research found: no public count for the closed models checked (GPT-4o, Claude 3.5 Sonnet,
  // Gemini 1.5 Pro, GPT-6 Astra; Epoch AI leaves those fields blank)
  const rows = [['13,002', 'a digit-reading network'], ['175 billion', 'OpenAI’s GPT-3 (2020)'], ['1.04 trillion', 'Kimi K2.5 (open, 2026)'], ['no count found', 'closed models, like GPT-6 Astra']];
  const how = [howLab];
  rows.forEach(([v, l], i) => {
    const y = 4.42 + i * 0.44, h = i === 3 ? 0.62 : 0.4;
    how.push(d.text(s, v, { x: rx + 0.22, y, w: 1.5, h: i === 3 ? 0.4 : h, fontSize: 16, bold: true, color: i === 3 ? d.S.steel : HEX.amber, valign: 'middle' }));
    how.push(d.text(s, l, { x: rx + 1.75, y: i === 3 ? y + 0.04 : y, w: rw - 1.9, h, fontSize: 16, color: HEX.muted, valign: i === 3 ? 'top' : 'middle' }));
  });

  src(d, s, 'Image: CIFAR-10 (A. Krizhevsky) · Sizes: 3Blue1Brown · GPT-3 paper (OpenAI, 2020) · Kimi K2.5 paper (Moonshot AI, 2026)');
  d.animate(s, [...img, imgLab, inArrow, ...net.lines, ...net.nodes.flat(), ...layLab], { auto: true, effect: 'fade', dur: 700 });
  d.animate(s, [catNode, ...outNames], { effect: 'fade' });
  d.animate(s, dial, { effect: 'rise' });
  d.animate(s, [card, defs], { effect: 'fade' });
  d.animate(s, how, { effect: 'rise' });
  notes(s, {
    min: '2.25',
    build: 'The network shows automatically. Click 1: the output lights up “cat”. Click 2: the dial explanation. Click 3: the definitions (including open and closed models). Click 4: how many dials.',
    say: 'Here is the “deep” in deep learning. A neural network is layers of tiny simple units called neurons, joined by connections. A photo goes in on the left as numbers (just pixel colors). Each neuron adds up the signals coming into it and passes a signal on. The middle columns are called hidden layers. [Click.] Out the right side comes an answer, here “cat”. [Click.] Every line has a weight: a dial that sets how strongly one signal pushes the next, like a knob on a mixing board. Set the knobs right and it says “cat” for cats; set them wrong and it talks nonsense. Learning means finding good settings. [Click.] A neuron is an idea borrowed loosely from brains; it is not a brain. Parameters means all the dials together. Anyone can download an open model’s dial settings; a closed model is run only by its company. [Click.] How many? A small network that reads handwritten digits has 13,002. GPT-3, an OpenAI language model from 2020, had 175 billion. Kimi K2.5, an open model from this year, has 1.04 trillion: setting one dial per second would take about 33,000 years. For closed models like GPT-6 Astra, we found no public count. [Ask the room, hands up:] If you had a mixing board with a billion knobs, could you set them by hand? [Expected: no. That is why the computer has to learn the settings, next slide.]',

    analogy: 'A mixing board with billions of knobs. Training = turning every knob a tiny bit toward the right answer.',
    ask: '“If you had a mixing board with a billion knobs, could you set them by hand?” Spoken at the end of the SAY (not on the slide). Hands up for yes, then no. Expected: no, which is why the computer has to learn the settings (next slide).',
    takeaway: 'A neural network is layers of simple units joined by dials (weights); today’s big models have billions to trillions of dials.',
    advanced: 'Each neuron computes a weighted sum of its inputs plus a bias, then passes it through a nonlinear function (an “activation function”). 3Blue1Brown’s network: 784 inputs, two hidden layers of 16, 10 outputs: 784×16+16 + 16×16+16 + 16×10+10 = 13,002 weights and biases. Many 2025–26 open models are “mixture of experts”: Kimi K2.5 has 1.04 trillion parameters but uses only 32 billion for each token. Some open models are bigger still: DeepSeek-V4-Pro (2026, weights on Hugging Face under the MIT license, per its model card) lists 1.6 trillion total parameters, 49 billion active, in its model card (the developer’s own figure). Separately (these are not known to be open models): Alibaba says Qwen3.8-Max has 2.4 trillion parameters (vendor claim via ForkLog; openness not checked). Decrypt reports 2.1 trillion for xAI’s Grok 4.7 (press report, no technical source; openness not checked). Arithmetic: 1.04 trillion seconds ÷ 31.6 million seconds per year ≈ 33,000 years.',
    terms: 'neural network, neuron, weight, layer, hidden layers (the middle columns, between input and output), parameter, input, output, open model (its weights, the dial settings, are published so anyone can download and run it), closed model (only the company runs it; both on the slide), GPT-3 (an OpenAI language model from 2020; said in the SAY).',
    caveats: 'Outside estimates of closed models’ sizes exist, but they are only estimates. The drawing is a schematic (real networks have far more neurons). The input picture is a real CIFAR-10 image. A neuron is an idea borrowed loosely from brains; it is not a brain. Say “we found no public count” for closed models, not “they never publish”: the research checked specific models (below), not every model. Open-weight releases are different: OpenAI published gpt-oss-120b at 116.8 billion total parameters, 5.1 billion active (model card, arXiv 2508.10925, Aug 2025). No public parameter count was found for GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro or GPT-6 Astra (checked; Epoch AI’s model database leaves those fields blank; see the manifest not_found list), so no number is given for them. Sizes are claimed for some other flagships: Alibaba’s 2.4 trillion for Qwen3.8-Max is a vendor claim, and Decrypt’s 2.1 trillion for Grok 4.7 is a press report with no technical source; whether either is open was not checked. All sizes here are the developers’ published claims.',
    sources: ['https://www.3blue1brown.com/lessons/neural-networks', 'https://www.youtube.com/watch?v=aircAruvnKk (3Blue1Brown, “But what is a neural network?”)', 'https://arxiv.org/pdf/2005.14165 (GPT-3: 175 billion parameters)', 'https://arxiv.org/pdf/2602.02276 (Kimi K2.5: 1.04 trillion total, 32 billion activated)', 'https://arxiv.org/abs/2508.10925 (OpenAI, gpt-oss-120b & gpt-oss-20b model card: 116.8B total, 5.1B active)', 'https://epoch.ai/data/notable-ai-models', 'https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro (1.6T total, 49B activated; MIT license)', 'https://forklog.com/en/news/alibaba-launches-qwen3-8-max-with-2-4-trillion-parameters (Alibaba’s claim, Aug 3, 2026)', 'https://decrypt.co/378824/xai-launches-grok-4-7 (Decrypt, Sep 21, 2026)', 'https://www.cs.toronto.edu/~kriz/cifar.html'],
  });
  return s;
}

// PART 1 · 5  Gradient descent
async function gradientSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  kicker(s, K(5));
  title(s, 'Learning = measure the mistake, then nudge');
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
  const axis = label(d, s, 'HOW WRONG (THE LOSS) · HIGHER = MORE WRONG', MX, 1.7, 4.85, { color: d.S.steel });
  const xLab = d.text(s, 'one dial’s setting  →', { x: gx + gw - 3.0, y: 6.08, w: 2.9, h: 0.3, fontSize: 12, color: d.S.steel, align: 'right' });
  const fog = [[0.7, 2.25, 3.4, 1.45], [2.7, 2.8, 2.9, 1.25], [0.6, 3.5, 2.3, 0.95]].map(([x, y, w, h]) => {
    const n = d.name('fog');
    s.addShape(d.pres.shapes.OVAL, { x, y, w, h, fill: { color: 'B8C0CC', transparency: 89 }, line: { color: 'B8C0CC', width: 0, transparency: 100 }, objectName: n });
    return n;
  });
  const fogLab = d.text(s, 'thick fog: you can only feel the slope under your feet', { x: 2.05, y: 2.3, w: 3.4, h: 0.7, fontSize: 16, italic: true, color: d.S.muted, valign: 'top' });
  // hiker: its back foot (29–43% of the icon's width, at the bottom) stands on the slope; the curve drops away to the
  // right, so the backpack, the front foot and the stick all sit above the outline
  const h0 = curve(0.08), hs = 0.6, footT = (h0.x + 0.29 * hs - gx - 0.1) / (gw - 0.2);
  const hiker = await ic(d, s, 'FaHiking', HEX.text, h0.x, curve(footT).y - hs - 0.05, hs);
  const steps = [0.2, 0.31, 0.4, 0.48, 0.55, 0.6, 0.64].map((t) => { const p = curve(t); return oval(d, s, p.x - 0.07, p.y - 0.16, 0.14, 0.14, HEX.red, HEX.red); });
  const pm = curve(tm);
  const flag = [await ic(d, s, 'FaFlag', HEX.teal, pm.x - 0.08, pm.y - 0.52, 0.46),
    d.text(s, 'lowest loss', { x: pm.x - 0.9, y: pm.y + 0.08, w: 1.8, h: 0.32, fontSize: 14, bold: true, color: HEX.teal, align: 'center' })];
  // map-view inset (public-domain Commons figure, cropped tight on the steps); caption below it, above the hill outline
  const inset = await d.frame(s, D('gd_zoom.png'), { x: 5.55, y: 1.72, w: 2.38, h: 2.18 }, { pad: 0.04 });
  const insetLab = d.text(s, 'Seen from above: each red arrow is one step', { x: inset.geom.x - 0.1, y: inset.geom.y + inset.geom.h + 0.1, w: inset.geom.w + 0.2, h: 0.48, fontSize: 14, color: d.S.muted, align: 'center', valign: 'top' });

  // right: four definitions + the class question
  const rx = 8.1, rw = W - MX - rx;
  const defs = [
    ['FaBullseye', HEX.red, 'Loss', 'one score for how wrong an answer is. Lower is better.'],
    ['FaCompass', HEX.amber, 'Gradient', 'for each dial, the uphill direction. We step the opposite way.'],
    ['FaShoePrints', HEX.teal, 'Learning rate', 'how big each step is.'],
    ['FaRedoAlt', HEX.blue, 'Training (gradient descent)', 'measure, then nudge, then repeat, many times.'],
  ];
  const dg = [];
  // cards about 1 in tall, so an 18 pt title plus two 16 pt body lines clear the borders
  const ch = 0.99, cp = 1.04;
  for (let i = 0; i < 4; i++) {
    const y = 1.72 + i * cp, [nm, c, t, txt] = defs[i];
    const g = [box(d, s, rx, y, rw, ch, { fill: HEX.card, line: HEX.line })];
    g.push(...await iconDisc(d, s, nm, rx + 0.46, y + ch / 2, 0.6, c, HEX.card2));
    g.push(d.text(s, [{ text: t, options: { bold: true, color: HEX.text, fontSize: 18, breakLine: true } }, { text: txt, options: { color: HEX.muted, fontSize: 16 } }], { x: rx + 0.9, y: y + 0.03, w: rw - 1.0, h: ch - 0.06, valign: 'middle' }));
    dg.push(g);
  }
  const ay = 5.92, ah = 0.62;
  const askBox = [box(d, s, rx, ay, rw, ah, { fill: HEX.card2, line: HEX.red })];
  askBox.push(...await beatLine(d, s, { text: 'HANDS UP', iconName: 'FaHandPaper', q: 'Steps way too big: what goes wrong?', x: rx + 0.14, y: ay, w: rw - 0.24, h: ah, qSize: 16 }));
  d.animate(s, [ground, axis, xLab, ...fog, fogLab, hiker, ...dg[0]], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, [...steps.map((name, i) => ({ name, delay: i * 260 })), ...dg[1], ...dg[2]], { effect: 'zoom', dur: 300 });
  d.animate(s, askBox, { effect: 'zoom', dur: 400 });
  d.animate(s, [...flag, ...dg[3]], { effect: 'rise' });
  d.animate(s, [...inset, insetLab], { effect: 'fade' });
  notes(s, {
    min: '2.0',
    build: 'The hill, the hiker and “Loss” show automatically. Click 1: the steps downhill (with “Gradient” and “Learning rate”). Click 2: the hands-up question. Click 3: the lowest point (with “Training (gradient descent)”). Click 4: the map view from above.',
    say: 'So how does the computer find good settings for billions of dials? First it needs a way to measure the mistake. That score is called the loss: one number for how wrong an answer is, and lower is better. Now imagine you are a hiker on a mountain in thick fog. You cannot see the valley, but you can feel which way the ground slopes under your feet. [Click.] So you take a small step downhill, feel again, take another step, and so on. That is gradient descent. The gradient points uphill, the way that makes the loss grow fastest. Each dial steps the opposite way, which makes the loss smaller. The learning rate is the size of each step. [Click.] Hands up: what goes wrong if your steps are way too big? [Take two answers.] Right: you jump over the valley or bounce back and forth. Too small, and it takes forever. [Click.] Repeat that many, many times and you end up near the bottom: low loss. That repetition is training. [Click.] Here is the same idea seen from above, like a map: each red arrow is one step toward the middle.',
    analogy: 'Walking downhill in thick fog, feeling the slope with your feet (a common teaching picture for gradient descent).',
    ask: 'On the slide: “Steps way too big: what goes wrong?” Format: hands up, take two answers (about 30 seconds). Expected: you jump right over the valley, or bounce back and forth. Follow-up “Too small?”: it takes forever.',
    takeaway: 'Training = measure the loss, then nudge every dial a little in the direction that lowers it, many, many times.',
    advanced: 'With a billion dials the “hill” lives in a billion dimensions, so we cannot picture it, but the math is the same: take a small step opposite the gradient. Gradient descent can get stuck in a dip that is not the lowest point (a “local minimum”) or slow down on flat ground (a “saddle point”).',
    terms: 'loss, gradient descent, gradient, learning rate (step size), training.',
    caveats: 'The hill drawing is a schematic with no real numbers. The map view is a real figure (Wikimedia Commons, public domain; credit in SOURCES).',
    sources: ['https://en.wikipedia.org/wiki/Gradient_descent', 'https://commons.wikimedia.org/wiki/File:Gradient_descent.png (public domain)', 'https://www.3blue1brown.com/lessons/gradient-descent', 'https://www.youtube.com/watch?v=IHZwWFHWa-w (3Blue1Brown, “Gradient descent, how neural networks learn”)'],
  });
  return s;
}

// PART 1 · 6  Backpropagation
async function backpropSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  kicker(s, K(6));
  title(s, 'Backpropagation sends the blame backwards');
  // factory analogy
  const fl = label(d, s, 'LIKE A FACTORY LINE', MX, 1.7, 6, { color: d.S.amber });
  const bw = 2.55, gap = 0.62, x0 = MX + (W - 2 * MX - (4 * bw + 3 * gap)) / 2, by = 2.08, bh = 0.95;
  const fac = [fl];
  const st = [['FaCog', 'Station 1'], ['FaCog', 'Station 2'], ['FaCog', 'Station 3'], ['FaSearch', 'Inspector: “Defect!”']];
  for (let i = 0; i < 4; i++) {
    const x = x0 + i * (bw + gap), insp = i === 3;
    fac.push(box(d, s, x, by, bw, bh, { fill: insp ? TINT.red : HEX.card, line: insp ? HEX.red : HEX.line }));
    fac.push(await ic(d, s, st[i][0], insp ? HEX.red : HEX.muted, x + 0.2, by + 0.25, 0.45));
    fac.push(d.text(s, st[i][1], { x: x + 0.78, y: by, w: bw - 0.88, h: bh, fontSize: 18, bold: true, color: insp ? HEX.red : HEX.text, valign: 'middle' }));
    if (i < 3) fac.push(seg(d, s, x + bw + 0.08, by + bh / 2, x + bw + gap - 0.08, by + bh / 2, { color: HEX.steel, width: 2, arrow: true }));
  }
  const back = [seg(d, s, x0 + 3 * (bw + gap) + bw / 2, by + bh + 0.28, x0 + bw / 2, by + bh + 0.28, { color: HEX.red, width: 3, arrow: true })];
  back.push(d.text(s, 'trace the defect back: how much did each station add to it?', { x: x0, y: by + bh + 0.36, w: 4 * bw + 3 * gap, h: 0.36, fontSize: 16, bold: true, color: HEX.red, align: 'center' }));

  // network version
  const nl = label(d, s, 'IN A NEURAL NETWORK', MX, 3.8, 6, { color: d.S.amber });
  const xs = [1.25, 2.85, 4.45, 6.05], dia = 0.28;
  const net = drawNet(d, s, { xs, cy: 5.14, gap: 0.42, layers: [3, 4, 4, 2], dia, lw: [0.5, 1.5] });
  // top output = "cat", as on the network slide; the lit (wrong) node is the lower one, "dog"
  const wrong = oval(d, s, xs[3] - dia / 2, net.pos[3][1].y - dia / 2, dia, dia, HEX.red, HEX.red);
  const outT = [
    d.text(s, 'answer: “cat”', { x: xs[3] + 0.3, y: net.pos[3][0].y - 0.2, w: 1.6, h: 0.4, fontSize: 16, color: HEX.muted, valign: 'middle' }),
    d.text(s, 'said “dog”', { x: xs[3] + 0.3, y: net.pos[3][1].y - 0.2, w: 1.6, h: 0.4, fontSize: 16, bold: true, color: HEX.red, valign: 'middle' }),
  ];
  const arrows = [];
  for (let i = 3; i > 0; i--) arrows.push(seg(d, s, xs[i] - 0.15, 4.26, xs[i - 1] + 0.15, 4.26, { color: HEX.red, width: 3.5, arrow: true }));
  const blame = d.text(s, 'blame flows backward, layer by layer', { x: xs[0], y: 5.98, w: xs[3] - xs[0], h: 0.34, fontSize: 16, italic: true, color: d.S.red, align: 'center' });
  const rx = 8.0, rw = W - MX - rx;
  const expl = d.text(s, [
    { text: 'Backpropagation: ', options: { bold: true, color: HEX.text } },
    { text: 'after a wrong answer, the error is traced backward through each layer to find how much each dial added to it.', options: { color: HEX.muted, breakLine: true, paraSpaceAfter: 8 } },
    { text: 'One backward sweep covers billions of dials.', options: { color: HEX.text } },
  ], { x: rx, y: 3.95, w: rw, h: 1.5, fontSize: 16, valign: 'top' });
  const hist = [await ic(d, s, 'FaBookOpen', HEX.steel, rx, 5.48, 0.32),
    d.text(s, 'Popularized in 1986 (a Nature paper)', { x: rx + 0.44, y: 5.45, w: rw - 0.44, h: 0.38, fontSize: 16, color: d.S.steel, valign: 'middle' })];
  // the class question, on the slide
  const ay = 5.92, ah = 0.6;
  const askBox = [box(d, s, rx, ay, rw, ah, { fill: HEX.card2, line: HEX.red })];
  askBox.push(...await beatLine(d, s, { text: 'HANDS UP', iconName: 'FaHandPaper', q: 'Why not test each dial one at a time?', x: rx + 0.14, y: ay, w: rw - 0.24, h: ah, qSize: 16 }));

  src(d, s, 'Rumelhart, Hinton & Williams, “Learning representations by back-propagating errors”, Nature, Oct 1986');
  d.animate(s, fac, { auto: true, effect: 'fade' });
  d.animate(s, back, { effect: 'wipeLeft', dur: 700 });
  d.animate(s, [nl, ...net.lines, ...net.nodes.flat(), wrong, ...outT], { effect: 'fade' });
  d.animate(s, [...arrows.map((name, i) => ({ name, delay: i * 350 })), blame], { effect: 'wipeLeft', dur: 350 });
  d.animate(s, [expl, ...hist], { effect: 'fade' });
  d.animate(s, askBox, { effect: 'zoom', dur: 400 });
  notes(s, {
    min: '1.75',
    build: 'The factory line shows automatically. Click 1: the red arrow back. Click 2: the network gets a wrong answer. Click 3: blame flows backward. Click 4: the explanation and history. Click 5: the hands-up question.',
    say: 'Gradient descent needs to know which way to turn each dial. How? Picture a factory line: three stations, then an inspector at the end who finds a defect. [Click.] To fix it, the inspector traces the defect back: how much did station 3 add, how much station 2, how much station 1? [Click.] A neural network does the same thing. It said “dog”, but the answer was “cat”. [Click.] The error gets sent backward through the network, layer by layer, working out how much each dial contributed to the mistake. That is backpropagation, “back-prop” for short. Then gradient descent nudges every dial a little in the helpful direction. [Click.] The clever part is speed: it works out the blame for billions of dials in one backward sweep. It was popularized in 1986 by David Rumelhart, Geoffrey Hinton and Ronald Williams. [Click.] Hands up: why not just test each dial one at a time? [Take one answer.] Right: with billions of dials, that would take forever.',
    analogy: 'A factory line where the final inspector traces a defect back to each station.',
    ask: 'On the slide: “Why not test each dial one at a time?” Format: hands up, take one answer (about 20 seconds). Expected: one dial at a time would take forever with billions of dials.',
    takeaway: 'Backpropagation works out how much each dial added to a mistake; gradient descent then nudges the dials.',
    advanced: 'Backprop is the chain rule from calculus applied layer by layer: the derivative of the loss is passed backward “one layer at a time, from the output layer to the input layer” (Wikipedia). 3Blue1Brown chapters 3–4 show it step by step.',
    terms: 'backpropagation (backprop), error.',
    caveats: 'The arrows are a schematic, not real blame values.',
    sources: ['https://www.nature.com/articles/323533a0 (Rumelhart, Hinton & Williams, “Learning representations by back-propagating errors”, Nature 323, 533–536, Oct 1986)', 'https://en.wikipedia.org/wiki/Backpropagation', 'https://www.youtube.com/watch?v=Ilg3gGewQ5U (3Blue1Brown, “Backpropagation, intuitively”)'],
  });
  return s;
}

// PART 1 · 7  Next-word guesser
async function nextWordSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(7));
  title(s, 'An LLM is a very good next-word guesser');
  const bt = await beat(d, s, 'HANDS UP');
  const lw = 6.9;
  const prompt = [d.card(s, { x: MX, y: 1.82, w: lw, h: 1.0 }),
    d.text(s, [{ text: 'The cat sat on the ', options: { color: HEX.text } }, { text: '____', options: { color: HEX.amber } }], { x: MX + 0.3, y: 1.82, w: lw - 0.5, h: 1.0, fontSize: 34, bold: true, fontFace: 'Arial', valign: 'middle' })];
  const opts = [];
  ['A · mat', 'B · moon', 'C · pizza'].forEach((t, i) => {
    const x = MX + i * 2.3;
    opts.push(box(d, s, x, 3.0, 2.05, 0.55, { fill: HEX.card2, line: HEX.amber, lw: 1.25 }));
    opts.push(d.text(s, t, { x, y: 3.0, w: 2.05, h: 0.55, fontSize: 20, bold: true, color: HEX.text, align: 'center', valign: 'middle' }));
  });
  const barL = [label(d, s, 'IT SCORES POSSIBLE NEXT WORDS (5 SHOWN)', MX, 3.72, 5.0), label(d, s, 'MADE-UP EXAMPLE', MX + lw - 1.85, 3.72, 1.85, { color: d.S.amber, align: 'right' })];
  const words = [['mat', 4.7], ['floor', 2.7], ['sofa', 1.8], ['moon', 0.22], ['pizza', 0.14]];
  const bars = [];
  words.forEach(([wd, len], i) => {
    const y = 4.12 + i * 0.47, top = i === 0;
    bars.push(d.text(s, wd, { x: MX, y, w: 1.1, h: 0.36, fontSize: 18, bold: top, color: top ? d.S.red : HEX.text, valign: 'middle' }));
    const n = d.name('bar');
    s.addShape(d.pres.shapes.RECTANGLE, { x: MX + 1.2, y: y + 0.03, w: len, h: 0.3, fill: { color: top ? HEX.red : HEX.steel }, line: { color: top ? HEX.red : HEX.steel, width: 0 }, objectName: n });
    bars.push(n);
  });
  const picked = d.text(s, '← picked', { x: MX + 1.2 + 4.7 + 0.1, y: 4.12, w: 1.0, h: 0.36, fontSize: 16, bold: true, color: d.S.red, valign: 'middle' });

  // right: the loop + definitions
  const rx = 7.95, rw = W - MX - rx;
  const loopL = label(d, s, 'THEN IT REPEATS, ONE WORD AT A TIME', rx, 1.7, rw, { color: d.S.amber });
  const loop = [loopL];
  ['Score every possible next word', 'Pick one (usually a high scorer)', 'Add it to the text', 'Repeat from step 1'].forEach((t, i) => {
    const y = 2.02 + i * 0.45;
    loop.push(...numDisc(d, s, i + 1, rx + 0.2, y + 0.2, 0.38, i === 3 ? HEX.red : HEX.card2, { color: HEX.text, fontSize: 14 }));
    loop.push(d.text(s, t, { x: rx + 0.55, y, w: rw - 0.55, h: 0.4, fontSize: 16, color: HEX.text, valign: 'middle' }));
  });
  const defCard = d.card(s, { x: rx, y: 3.92, w: rw, h: 1.98 });
  const defs = d.text(s, [
    { text: 'LLM ', options: { bold: true, color: HEX.text } }, { text: '(large language model): a neural network trained on huge amounts of text to predict the next token.', options: { color: HEX.muted, breakLine: true, paraSpaceAfter: 5 } },
    { text: 'Token: ', options: { bold: true, color: HEX.text } }, { text: 'a chunk of text, often a word or part of one:', options: { color: HEX.muted } },
  ], { x: rx + 0.18, y: 3.98, w: rw - 0.3, h: 1.45, fontSize: 16, valign: 'top' });
  const tok = [];
  ['un', 'believ', 'able'].forEach((t, i) => {
    const x = rx + 0.18 + [0, 0.62, 1.55][i], w = [0.55, 0.86, 0.72][i];
    tok.push(box(d, s, x, 5.44, w, 0.38, { fill: ['1E3A5F', '3A2A12', '2A1416'][i], line: [HEX.blue, HEX.amber, HEX.red][i], radius: 0.05 }));
    tok.push(d.text(s, t, { x, y: 5.44, w, h: 0.38, fontSize: 16, bold: true, color: HEX.text, align: 'center', valign: 'middle', fontFace: 'Courier New' }));
  });
  tok.push(d.text(s, '(one possible split)', { x: rx + 2.58, y: 5.44, w: rw - 2.62, h: 0.38, fontSize: 12, color: d.S.steel, valign: 'middle' }));
  const honest = d.text(s, [{ text: 'Surprise: ', options: { bold: true, color: HEX.amber } }, { text: 'this simple goal gives surprisingly capable results. Nobody fully knows why yet.', options: { color: HEX.text } }], { x: rx, y: 5.96, w: rw, h: 0.54, fontSize: 16, valign: 'middle' });

  d.animate(s, [...prompt, ...opts], { auto: true, effect: 'fade' });
  d.animate(s, bt, { auto: true, effect: 'zoom', dur: 400 });
  d.animate(s, [...barL, ...bars.map((name, i) => ({ name, delay: Math.floor(i / 2) * 150 }))], { effect: 'wipeLeft', dur: 600 });
  d.animate(s, [picked], { effect: 'zoom', dur: 300 });
  d.animate(s, loop, { effect: 'rise' });
  d.animate(s, [defCard, defs, ...tok], { effect: 'fade' });
  d.animate(s, [honest], { effect: 'fade' });
  notes(s, {
    min: '2.25',
    build: 'The sentence and the three options show automatically. Click 1: the scores (bars). Click 2: “picked”. Click 3: the loop. Click 4: definitions. Click 5: the honest surprise.',
    say: 'Chatbots run on a large language model, an LLM for short. Let’s play the game it plays. “The cat sat on the …” Hands up for mat! Moon? Pizza? [Count roughly.] Most of you said mat. You just did what a large language model does. [Click.] The model gives every possible next word a score. This is a made-up example, so the bars only show the idea: “mat” scores high, “floor” and “sofa” a bit lower, “moon” and “pizza” almost nothing. [Click.] It picks one, usually a high scorer. [Click.] Then it adds that word to the text and does it again for the next word, and the next, one word at a time. That is how every answer you have ever got from a chatbot was written. [Click.] So an LLM, a large language model, is a neural network trained on huge amounts of text to predict the next token. A token is a chunk of text: often a whole word, sometimes a piece, like “un”, “believ”, “able”. [Click.] And here is the honest surprise: such a simple goal produces surprisingly capable behavior, like writing code (computer instructions) or solving math problems, and nobody fully understands why yet. Keep that in mind for later.',
    analogy: 'Autocomplete on your phone, but trained on far more text and far better at it.',
    ask: '“The cat sat on the ___: mat, moon or pizza?” Expected: mostly mat; a few jokers say pizza (good: the model sometimes picks less likely words too, which is why answers vary).',
    takeaway: 'A chatbot writes one token at a time, each time picking from scores for every possible next token.',
    advanced: 'Models usually do not always pick the single top word; they sample, so the same question can get different answers. Anthropic (Mar 27, 2025): “How does a system trained to predict the next word in a sequence learn to calculate, say, 36+59…” Their research found Claude plans ahead: before writing the second line of a rhyming poem, it had already picked the rhyme word (“rabbit”). OpenAI: 1 token is about three-quarters of an English word on average (an estimate that varies by model and language).',
    terms: 'LLM (large language model), token, next-token prediction.',
    caveats: 'The bars are a made-up example (labeled on the slide), not real model scores. “un / believ / able” is one possible split: real tokenizers differ, and a given model may split this word differently. Experts disagree on whether next-word prediction amounts to “understanding” (callback to the hook).',
    sources: ['https://help.openai.com/en/articles/4936856-understanding-and-counting-tokens', 'https://learn.microsoft.com/agent-framework/journey/llm-fundamentals (“A large language model is a neural network trained on massive amounts of text data to predict the next token in a sequence.”)', 'https://en.wikipedia.org/wiki/Large_language_model', 'https://www.anthropic.com/research/tracing-thoughts-language-model'],
  });
  return s;
}

// PART 1 · 8  Pretraining
async function pretrainSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(8));
  title(s, 'Pretraining: read a huge library, then guess');
  const bt = await beat(d, s, 'GUESS FIRST', 'FaQuestionCircle');
  const lw = 5.95;
  const loopL = label(d, s, 'PRETRAINING = THIS LOOP, TRILLIONS OF TIMES', MX, 1.7, lw, { color: d.S.amber });
  const sw = (lw - 3 * 0.24) / 4, steps = [['FaEyeSlash', 'Hide the next word'], ['FaQuestionCircle', 'Guess it'], ['FaCheckCircle', 'Check'], ['FaSlidersH', 'Nudge the dials']];
  const loop = [loopL];
  for (let i = 0; i < 4; i++) {
    const x = MX + i * (sw + 0.24), y = 2.06;
    // 1.12 in tall, so a two-line 16 pt label clears the bottom border
    loop.push(box(d, s, x, y, sw, 1.12, { fill: i === 3 ? TINT.red : HEX.card, line: i === 3 ? HEX.red : HEX.line }));
    loop.push(await ic(d, s, steps[i][0], i === 3 ? HEX.red : HEX.amber, x + (sw - 0.34) / 2, y + 0.08, 0.34));
    loop.push(d.text(s, steps[i][1], { x: x + 0.05, y: y + 0.44, w: sw - 0.1, h: 0.62, fontSize: 16, bold: true, color: HEX.text, align: 'center', valign: 'top' }));
    if (i < 3) loop.push(seg(d, s, x + sw + 0.03, y + 0.56, x + sw + 0.21, y + 0.56, { color: HEX.steel, width: 1.75, arrow: true }));
  }
  loop.push(d.text(s, 'nudge = gradient descent + backpropagation', { x: MX, y: 3.2, w: lw, h: 0.28, fontSize: 16, color: d.S.muted, italic: true, valign: 'middle' }));
  // two stat cards; the right one starts as the GUESS FIRST question with hands-up ranges, and the answer card then
  // covers it (opaque)
  const cy = 3.54, chh = 1.6, cw2 = (lw - 0.15) / 2, c2x = MX + cw2 + 0.15;
  const st1 = [d.card(s, { x: MX, y: cy, w: cw2, h: chh }),
    d.text(s, '15 trillion+', { x: MX + 0.15, y: cy + 0.14, w: cw2 - 0.25, h: 0.56, fontSize: 30, bold: true, color: HEX.amber, fontFace: 'Arial', valign: 'bottom' }),
    d.text(s, 'tokens read by Meta’s Llama 3 (2024)', { x: MX + 0.15, y: cy + 0.74, w: cw2 - 0.25, h: 0.62, fontSize: 16, color: HEX.muted, valign: 'top' })];
  const qcard = [box(d, s, c2x, cy, cw2, chh, { fill: HEX.card2, line: HEX.red, lw: 1.25 })];
  qcard.push(d.text(s, [
    // the 24-hours-a-day assumption is in the question: at 8 hours a day the answer would be C (notes)
    { text: 'Reading 24 hours a day, how many years?', options: { bold: true, color: HEX.text, breakLine: true, paraSpaceAfter: 3 } },
    { text: 'A: under 1,000', options: { color: HEX.amber, breakLine: true } },
    { text: 'B: 1,000 to 100,000', options: { color: HEX.amber, breakLine: true } },
    { text: 'C: over 100,000', options: { color: HEX.amber } },
  ], { x: c2x + 0.15, y: cy + 0.06, w: cw2 - 0.25, h: chh - 0.12, fontSize: 16, valign: 'middle' }));
  const st2 = [d.card(s, { x: c2x, y: cy, w: cw2, h: chh }, { color: HEX.card }),
    d.text(s, [{ text: '≈ ', options: { fontSize: 22 } }, { text: '90,000 years', options: { fontSize: 28 } }], { x: c2x + 0.15, y: cy + 0.14, w: cw2 - 0.2, h: 0.56, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'bottom' }),
    d.text(s, 'Answer B: reading nonstop, 24 hours a day (our arithmetic)', { x: c2x + 0.15, y: cy + 0.72, w: cw2 - 0.25, h: 0.84, fontSize: 16, color: HEX.muted, valign: 'top' })];
  const gy = 5.26, gh = 1.24;
  const gpu = [d.card(s, { x: MX, y: gy, w: lw, h: gh })];
  // a chip with pins on all four sides (FaMicrochip read as a phone or battery at this size)
  gpu.push(await ic(d, s, 'PiCpuFill', HEX.red, MX + 0.2, gy + (gh - 0.5) / 2, 0.5));
  gpu.push(d.text(s, [
    { text: 'Thousands of GPUs, for weeks or months. ', options: { bold: true, color: HEX.text } },
    { text: 'A GPU is a chip built for AI math. OpenAI’s newest model, GPT-6 Astra: 100,000+ GPUs (OpenAI, via Fortune). The result: a base model.', options: { color: HEX.muted } },
  ], { x: MX + 0.88, y: gy + 0.04, w: lw - 1.0, h: gh - 0.08, fontSize: 16, valign: 'middle' }));

  // right: disclosed token counts (native chart)
  const rx = 6.95, rw = W - MX - rx;
  const chL = label(d, s, 'TEXT READ IN PRETRAINING (TRILLIONS OF TOKENS)', rx, 1.7, rw, { color: d.S.steel });
  // sorted longest first, so the comparison reads top to bottom
  const data = [
    ['Llama 3 (Meta, 2024)', 15, '15T+'], ['DeepSeek-V3 (2024)', 14.8, '14.8T'], ['Llama 4 (Meta, 2025)', 30, '30T+'],
    ['Qwen3 (Alibaba, 2025)', 36, '≈36T'], ['Kimi K2 (Moonshot, 2025)', 15.5, '15.5T'], ['DeepSeek-V4-Pro (2026 preview)', 32, '32T+'],
  ].sort((a, b) => b[1] - a[1]);
  const cbox = { x: rx, y: 2.05, w: rw, h: 3.45 }, layout = { x: 0.54, y: 0.02, w: 0.34, h: 0.96 }, maxV = 40;
  const chart = d.chart(s, 'bar', [{ name: 'Tokens (trillions)', labels: data.map((r) => r[0]), values: data.map((r) => r[1]) }], cbox, {
    barDir: 'bar', catAxisOrientation: 'maxMin', valAxisHidden: true, catAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: maxV, valAxisMajorUnit: 10,
    valGridLine: { style: 'none' }, chartColors: [HEX.amber], barGapWidthPct: 45, layout, showLegend: false,
  });
  const g = barGeom(cbox, layout, data.length, 45, maxV);
  const lab = [];
  data.forEach(([nm, v, t], i) => {
    lab.push(d.text(s, nm, { x: rx, y: g.cy(i) - g.rh / 2, w: layout.x * rw - 0.1, h: g.rh, fontSize: 16, color: HEX.text, align: 'right', valign: 'middle' }));
    lab.push(d.text(s, t, { x: g.vx(v) + 0.06, y: g.cy(i) - 0.2, w: 0.75, h: 0.4, fontSize: 16, bold: true, color: HEX.amber, valign: 'middle' }));
  });
  const note = d.text(s, '“+” and “≈” are each lab’s own wording. OpenAI has not disclosed its counts; we found none published for Google or Anthropic.', { x: rx, y: 5.6, w: rw, h: 0.9, fontSize: 16, color: d.S.muted, valign: 'top' });
  src(d, s, 'Sources: Meta (Llama 3 & 4 posts) · DeepSeek (arXiv 2412.19437; V4-Pro model card) · Qwen3 blog · Kimi K2 (arXiv 2507.20534) · Fortune, Sep 3, 2026');

  d.animate(s, loop, { auto: true, effect: 'fade' });
  d.animate(s, [...st1, ...qcard, ...bt], { effect: 'rise' });
  d.animate(s, st2, { effect: 'zoom', dur: 400 });
  d.animate(s, [chL, chart, ...lab, note], { effect: 'wipeLeft', dur: 700 });
  d.animate(s, gpu, { effect: 'rise' });
  notes(s, {
    min: '2.25',
    build: 'The loop shows automatically. Click 1: “15 trillion+”, the GUESS FIRST chip and the question (reading 24 hours a day) with ranges A/B/C. Click 2: the answer card (≈ 90,000 years, answer B) covers the question. Click 3: the chart (longest first). Click 4: the GPU box.',
    say: 'Pretraining is the first and by far the biggest stage of making a chatbot. The model plays the guess-the-next-word game we just played, over and over: it reads the words so far, guesses the next word, checks the guess against the real text, and nudges the dials with gradient descent and backpropagation. Then again. Trillions of times. [Click.] How much text? Meta says its Llama 3 model read over 15 trillion tokens. Guess first: how many years would it take one of you to read all that text, reading 24 hours a day? Hands up for A, under 1,000 years… B, 1,000 to 100,000… C, over 100,000. [Count roughly.] [Click.] Reading at a normal adult speed, nonstop, day and night: about 90,000 years, so B. That is our own arithmetic, explained in the notes. [Click.] And it keeps growing: some labs now report 30 trillion or more; Qwen3 is the longest bar. OpenAI has not said how much its newest models read, and we found no published numbers for Google’s or Anthropic’s models. [Click.] This needs enormous computers: thousands of GPUs, chips built for AI math, running for weeks or months. OpenAI said its newest model, GPT-6 Astra, was trained on more than 100,000 of them. What comes out of pretraining is called a base model. Let’s see what that is like.',
    analogy: 'Reading a huge library with a card over the page: cover up the next word, guess it, slide the card to check, and repeat.',
    ask: 'On the slide (GUESS FIRST): “Reading 24 hours a day, how many years?” Hands up for A (under 1,000), B (1,000 to 100,000) or C (over 100,000); count roughly, then click. Answer: B, about 90,000 years reading nonstop. If someone says C because people sleep: they are right for 8 hours a day (about 270,000 years); the question assumes nonstop reading.',
    takeaway: 'Pretraining = the guess-the-next-word game on trillions of tokens, run on huge numbers of chips; it makes a base model.',
    advanced: 'ARITHMETIC (ours, not the labs’): 15 trillion tokens × 0.75 words per token (OpenAI’s rule of thumb, “1 token is approximately three-quarters of a word”; an estimate, and Llama’s tokenizer differs) = 11.25 trillion words. ÷ 238 words per minute (Brysbaert 2019, average adult silent reading of non-fiction) = about 47 billion minutes ≈ 788 million hours ≈ 90,000 years at 24 hours a day (about 270,000 years at 8 hours a day). Epoch AI estimates GPT-5 was likely trained on at least 30 trillion tokens (OpenAI has not said). Epoch AI assumed about 90 days for GPT-6 Astra’s run; OpenAI has not disclosed the duration.',
    terms: 'pretraining, GPU (a chip built for AI math), base model.',
    caveats: 'THE GUESS DEPENDS ON THE ASSUMPTION: answer B holds for reading nonstop, 24 hours a day, as the question on the slide says. At 8 hours a day the answer is about 270,000 years (C). “Trillions of times” counts the guesses (one per token); the dials are nudged after each big batch of guesses, so there are far fewer nudges than guesses. Token counts are the labs’ own figures: Llama 3 “over 15T” (Meta; the paper gives 15.6T for the 405B model), DeepSeek-V3 14.8T, Llama 4 “more than 30 trillion”, Qwen3 “approximately 36 trillion”, Kimi K2 15.5T, DeepSeek-V4-Pro “more than 32T” (model card of the V4 preview release). Different labs count tokens with different tokenizers, so the bars are only roughly comparable. OpenAI has not disclosed token counts (Epoch AI on GPT-5). For Google and Anthropic we found no published counts in our sources; that is not proof that none exists, so do not say “they refuse to disclose”. “More than 100,000 GPUs” is OpenAI’s Aidan Clark to Fortune (Sep 3, 2026).',
    sources: ['https://ai.meta.com/blog/meta-llama-3/', 'https://arxiv.org/abs/2407.21783', 'https://ai.meta.com/blog/llama-4-multimodal-intelligence/', 'https://arxiv.org/pdf/2412.19437', 'https://qwenlm.github.io/blog/qwen3/', 'https://arxiv.org/abs/2507.20534', 'https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro', 'https://help.openai.com/en/articles/4936856-understanding-and-counting-tokens', 'https://linkinghub.elsevier.com/retrieve/pii/S0749596X19300786 (Brysbaert 2019)', 'https://epochai.substack.com/p/notes-on-gpt-5-training-compute', 'https://fortune.com/2026/09/03/openai-debuts-gpt-6-astra-computer-use-greg-brockman-says-start-of-agi/', 'https://epoch.ai/data/all_ai_models.csv'],
  });
  return s;
}

// PART 1 · 9  Base model vs assistant
async function baseModelSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  kicker(s, K(9));
  title(s, 'A base model just continues the text');
  const pr = [box(d, s, MX, 1.8, W - 2 * MX, 0.6, { fill: HEX.card2, line: HEX.steel })];
  pr.push(...chip(d, s, 'PROMPT', MX + 0.15, 1.92, 1.1, HEX.steel, { fontSize: 13, color: HEX.ink }));
  pr.push(d.text(s, 'How do I fold a paper plane?', { x: MX + 1.45, y: 1.8, w: 6, h: 0.6, fontSize: 22, bold: true, color: HEX.text, valign: 'middle' }));
  pr.push(d.text(s, 'MADE-UP EXAMPLE · NOT A REAL MODEL’S OUTPUT', { x: W - MX - 5.3, y: 1.8, w: 5.15, h: 0.6, fontSize: 12, bold: true, color: d.S.amber, align: 'right', valign: 'middle', charSpacing: 1 }));
  const cw = (W - 2 * MX - 0.3) / 2, cy = 2.52, ch = 2.08;
  const card = (x, head, sub, color, tint, runs) => [
    box(d, s, x, cy, cw, ch, { fill: tint, line: color, lw: 1.25 }),
    d.text(s, [{ text: head, options: { bold: true, color, charSpacing: 2 } }, { text: '  ·  ' + sub, options: { color: HEX.muted } }], { x: x + 0.22, y: cy + 0.08, w: cw - 0.3, h: 0.4, fontSize: 14, valign: 'middle' }),
    d.text(s, runs, { x: x + 0.22, y: cy + 0.5, w: cw - 0.4, h: ch - 0.56, fontSize: 16, valign: 'top' }),
  ];
  const base = card(MX, 'BASE MODEL', 'after pretraining: it keeps the text going', HEX.steel, HEX.card, [
    { text: 'How do I fold a paper boat?', options: { color: HEX.text, breakLine: true, paraSpaceAfter: 6 } },
    { text: 'How do I make a paper hat?', options: { color: HEX.text, breakLine: true, paraSpaceAfter: 6 } },
    { text: 'What is the best paper for a crane?', options: { color: HEX.text, breakLine: true, paraSpaceAfter: 6 } },
    { text: '12 replies · last post 3 days ago', options: { color: HEX.steel, italic: true } },
  ]);
  const asst = card(MX + cw + 0.3, 'ASSISTANT', 'after post-training (extra teaching): it answers', HEX.red, TINT.red, [
    { text: 'Here is a simple paper plane:', options: { color: HEX.text, bold: true, breakLine: true, paraSpaceAfter: 4 } },
    { text: '1. Fold the paper in half the long way, then unfold.', options: { color: HEX.text, breakLine: true, paraSpaceAfter: 3 } },
    { text: '2. Fold the top corners in to the middle line.', options: { color: HEX.text, breakLine: true, paraSpaceAfter: 3 } },
    { text: '3. Fold the new slanted edges to the middle again.', options: { color: HEX.text, breakLine: true, paraSpaceAfter: 3 } },
    { text: '4. Fold it in half, then fold each wing down.', options: { color: HEX.text } },
  ]);
  const think = await beatLine(d, s, { text: 'THINK ABOUT IT', iconName: 'FaLightbulb', q: 'Why would a model trained on the internet reply with more questions?', x: MX, y: cy + ch + 0.1, w: W - 2 * MX, h: 0.48, qSize: 18 });
  const ry = 5.36;
  const real = [label(d, s, 'A REAL EXAMPLE (OPENAI, 2022): ASKED TO USE “SERENDIPITY” (A HAPPY ACCIDENT) IN A SENTENCE', MX, ry - 0.02, W - 2 * MX, { color: d.S.amber })];
  real.push(d.text(s, [{ text: 'GPT-3 (base): ', options: { bold: true, color: HEX.text } }, { text: '“Serendipity is the ability to see something good in something bad. Use the word in a sentence.” …and more of the same.', options: { color: HEX.text, italic: true } }], { x: MX, y: ry + 0.31, w: cw, h: 0.82, fontSize: 16, valign: 'top' }));
  real.push(d.text(s, [{ text: 'InstructGPT (assistant): ', options: { bold: true, color: HEX.text } }, { text: '“Serendipity can be defined as the happy chance occurrence of events leading to a beneficial outcome. For example, …”', options: { color: HEX.text, italic: true } }], { x: MX + cw + 0.3, y: ry + 0.31, w: cw, h: 0.82, fontSize: 16, valign: 'top' }));
  src(d, s, 'Real example: Ouyang et al. (2022), “Training language models to follow instructions with human feedback”, Fig. 47 (OpenAI)');
  d.animate(s, pr, { auto: true, effect: 'fade' });
  d.animate(s, base, { effect: 'rise' });
  d.animate(s, think, { effect: 'zoom', dur: 400 });
  d.animate(s, asst, { effect: 'rise' });
  d.animate(s, real, { effect: 'fade' });
  notes(s, {
    min: '1.75',
    build: 'The prompt shows automatically. Click 1: the base model. Click 2: the THINK ABOUT IT question. Click 3: the assistant. Click 4: the real example from the paper.',
    say: 'What does a base model, straight out of pretraining, actually do? Remember, it only learned to continue text. So if you type “How do I fold a paper plane?” … [Click.] … it might just keep the page going: more questions, like a forum thread. This is a made-up example to show the idea. It is not a real model’s output. [Click.] Think about it: why would a model trained on the internet reply with more questions? [Take one or two answers.] Yes: on the internet a question is often followed by more questions. [Click.] An assistant, the kind of chatbot you use, actually answers the question, step by step. Same knowledge inside, different behavior. What turns one into the other is called post-training: extra teaching after pretraining. [Click.] And this really happens. In OpenAI’s 2022 paper, base GPT-3 was asked to use “serendipity”, which means a happy accident, in a sentence. It wrote more exercises of the same kind. The post-trained version, InstructGPT, answered.',
    analogy: 'A base model is like a friend who has read the whole library but, when you ask a question, just keeps reading aloud from wherever the page leads. Post-training teaches them to answer you.',
    ask: 'On the slide (THINK ABOUT IT): “Why would a model trained on the internet reply with more questions?” Take one or two answers. Expected: because that is what it saw online (forums, FAQ lists, quiz pages).',
    takeaway: 'Pretraining makes a text-continuer (a base model); post-training turns it into an assistant that answers.',
    advanced: 'OpenAI (Jan 27, 2022): “GPT‑3 is trained to predict the next word on a large dataset of Internet text, rather than to safely perform the language task that the user wants.” The paper notes its example prompts are cherry-picked (outputs are not), and that GPT-3 was sampled at a slightly different temperature.',
    terms: 'base model, assistant (chat model), post-training (extra teaching after pretraining; next slide), serendipity (a happy accident; glossed on the slide).',
    caveats: 'The paper-plane continuations are a made-up example, labeled on the slide. The serendipity quotes are verbatim from Fig. 47 of the InstructGPT paper (GPT-3 175B vs InstructGPT 175B).',
    sources: ['https://arxiv.org/abs/2203.02155 (Fig. 47, p. 65)', 'https://openai.com/index/instruction-following/'],
  });
  return s;
}

// PART 1 · 10  Post-training (SFT + RLHF)
async function postTrainSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(10));
  title(s, 'Post-training makes it an assistant');
  const bt = await beat(d, s, 'HANDS UP');
  const lw = 5.55;
  const top = [label(d, s, 'WHICH IS BETTER: A OR B?', MX, 1.7, lw - 2.2, { color: d.S.amber }), label(d, s, 'MADE-UP EXAMPLE', MX + lw - 2.2, 1.7, 2.2, { color: d.S.steel, align: 'right' })];
  top.push(box(d, s, MX, 2.08, lw, 0.6, { fill: HEX.card2, line: HEX.steel }));
  top.push(d.text(s, 'Why is the sky blue?', { x: MX + 0.2, y: 2.08, w: lw - 0.3, h: 0.6, fontSize: 20, bold: true, color: HEX.text, valign: 'middle' }));
  const ans = (y, h, L, text) => [box(d, s, MX, y, lw, h, { fill: HEX.card, line: HEX.line }),
    ...numDisc(d, s, L, MX + 0.42, y + h / 2, 0.55, HEX.card2, { color: HEX.text, fontSize: 20 }),
    d.text(s, text, { x: MX + 0.85, y: y + 0.08, w: lw - 1.0, h: h - 0.16, fontSize: 16, color: HEX.text, valign: 'middle' })];
  const a = ans(2.82, 0.85, 'A', 'Sunlight scatters in air. Blue scatters most.');
  const b = ans(3.8, 1.42, 'B', 'Good question! Sunlight is a mix of colors. Air scatters blue light more than red, so blue light reaches your eyes from all over the sky.');
  const rev = [box(d, s, MX, 5.4, lw, 1.07, { fill: TINT.red, line: HEX.red, lw: 1.25 }),
    d.text(s, [{ text: 'Raters’ votes are the training signal. ', options: { bold: true, color: HEX.text } }, { text: 'Real raters compare many answer pairs like this one. (Our class vote trains nothing.)', options: { color: HEX.muted } }], { x: MX + 0.2, y: 5.42, w: lw - 0.35, h: 1.03, fontSize: 16, valign: 'middle' })];

  // right: OpenAI's three-step recipe, redrawn natively (adapted from Ouyang et al. 2022, Fig. 2)
  const rx = 6.5, rw = W - MX - rx;
  const figL = label(d, s, 'OPENAI’S RECIPE FOR INSTRUCTGPT (2022)', rx, 1.7, rw, { color: d.S.steel });
  const gap3 = 0.32, bw = (rw - 2 * gap3) / 3, by = 2.08, bh = 3.32;
  const steps = [
    ['SFT', 'supervised fine-tuning', 'FaUserEdit', 'Copy answers people wrote', HEX.blue, '= SUPERVISED LEARNING'],
    ['REWARD MODEL', 'a second model that scores answers', 'FaSortAmountDown', 'Learns which answers people prefer', HEX.amber, '= LEARNS FROM RANKINGS'],
    ['RLHF', 'reinforcement learning from human feedback', 'FaTrophy', 'Practice to earn a higher score', HEX.red, '= REINFORCEMENT LEARNING'],
  ];
  const diag = [figL], fill = [];
  for (let i = 0; i < steps.length; i++) {
    const [hd, sub, nm, txt, c, kind] = steps[i], x = rx + i * (bw + gap3);
    // no step numbers here: the frontier-pipeline slide that follows keeps the only numbered steps in this section
    diag.push(box(d, s, x, by, bw, bh, { fill: HEX.card, line: c, lw: 1.25 }));
    diag.push(await ic(d, s, nm, c, x + 0.14, by + 0.14, 0.44));
    diag.push(d.text(s, hd, { x: x + 0.12, y: by + 0.68, w: bw - 0.2, h: 0.32, fontSize: 16, bold: true, color: c, valign: 'top' }));
    if (i < 2) diag.push(seg(d, s, x + bw + 0.04, by + 0.36, x + bw + gap3 - 0.04, by + 0.36, { color: HEX.steel, width: 2, arrow: true }));
    fill.push([
      d.text(s, sub, { x: x + 0.12, y: by + 1.02, w: bw - 0.2, h: 0.82, fontSize: 16, color: HEX.muted, valign: 'top' }),
      d.text(s, txt, { x: x + 0.12, y: by + 1.95, w: bw - 0.2, h: 0.84, fontSize: 16, bold: true, color: HEX.text, valign: 'top' }),
      d.text(s, kind, { x: x + 0.12, y: by + 2.84, w: bw - 0.2, h: 0.42, fontSize: 12, bold: true, color: c, charSpacing: 0.5, valign: 'top' }),
    ]);
  }
  const post = d.text(s, [{ text: 'Post-training ', options: { bold: true, color: HEX.text } }, { text: '= all three, because they come after pretraining.', options: { color: HEX.muted } }], { x: rx, y: 5.55, w: rw, h: 0.9, fontSize: 16, valign: 'top' });
  src(d, s, 'Diagram adapted from Ouyang et al. (2022), “Training language models to follow instructions with human feedback”, Fig. 2 (OpenAI)');
  d.animate(s, [...top, ...a, ...b], { auto: true, effect: 'fade' });
  d.animate(s, bt, { auto: true, effect: 'zoom', dur: 400 });
  d.animate(s, rev, { effect: 'zoom', dur: 400 });
  d.animate(s, diag, { effect: 'fade' });
  fill.forEach((f, i) => d.animate(s, i === 2 ? [...f, post] : f, { effect: 'rise' }));
  notes(s, {
    min: '2.0',
    build: 'The question and both answers show automatically. Click 1: “raters’ votes are the training signal”. Click 2: the three-part diagram (boxes, icons and headers). Clicks 3–5: what happens in each part (the “post-training” line comes with the third).',
    say: 'Here is one question with two made-up answers. Both are correct. A is short and a bit cold. B is clear and friendly. Hands up for A! Hands up for B! [Count roughly.] [Click.] Congratulations: you just did the job of an AI rater. Votes like yours, from real raters, become the training signal: they compare many pairs of answers like this. Our class vote does not train anything. [Click.] Here is OpenAI’s three-part recipe from 2022, redrawn from their paper, for InstructGPT, an early assistant model. [Click.] The first part is SFT, supervised fine-tuning: people write ideal answers to example prompts, and the model copies them. That is the supervised learning from earlier, flashcards with answers. [Click.] The second part: people rank several answers from best to worst, and a second model, the reward model, learns to predict which answers people prefer. [Click.] The third part is RLHF, reinforcement learning from human feedback: the chatbot practices answering, the reward model scores each answer, and the chatbot is tuned to earn higher scores. That is the reinforcement learning from earlier, with points as treats. All of this is called post-training, because it comes after pretraining.',
    analogy: 'Pretraining is reading the whole library. Post-training is a coach: first showing good examples (SFT), then scoring your practice answers (RLHF).',
    ask: '“A or B?” Expected: most pick B. Follow-up: “Who might a rater disagree with?” Expected: people from other places, ages or opinions; some prefer short answers.',
    takeaway: 'Post-training = copy good examples (SFT), learn what people prefer (reward model), then practice for a higher score (RLHF).',
    advanced: 'In the InstructGPT paper, raters preferred the 1.3-billion-parameter InstructGPT over the 175-billion-parameter GPT-3, “despite having over 100x fewer parameters”. OpenAI said this post-training used “less than 2% of the compute and data relative to model pretraining”. The paper also reports an “alignment tax”: some tasks got slightly worse.',
    terms: 'post-training, fine-tuning (extra training on a smaller, chosen set of examples), SFT (supervised fine-tuning), reward model, RLHF (reinforcement learning from human feedback), rater.',
    caveats: 'Raters disagree and have biases, and “whose preferences?” is an open question; the paper itself says “more work is needed to study how these models perform on broader groups of users, and how they perform on inputs where humans disagree about the desired behavior.” The A/B answers are made-up examples (labeled). The diagram is our simplified redraw of the paper’s Fig. 2, without its step numbers so they do not clash with the numbered pipeline steps two slides later (the paper’s third step uses an algorithm called PPO; its labelers rank outputs “from best to worst”).',
    sources: ['https://arxiv.org/abs/2203.02155 (Ouyang et al. 2022, InstructGPT; Fig. 2 on p. 3)', 'https://openai.com/index/instruction-following/'],
  });
  return s;
}

// PART 1 · 11  Constitutions + checkable rewards
async function rewardsSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(11));
  title(s, 'Checkable rewards teach models to write steps');
  const cw = (W - 2 * MX - 0.35) / 2, y = 1.8, h = 4.05;
  // left: constitution
  const lx = MX;
  const L = [box(d, s, lx, y, cw, h, { fill: HEX.card, line: HEX.line })];
  L.push(...chip(d, s, 'A CONSTITUTION', lx + 0.2, y + 0.18, 2.3, HEX.blue, { fontSize: 14, charSpacing: 2 }));
  // both three-box rows sit at the same height (y + 0.62), so the two panels line up across the slide
  const bw3 = (cw - 0.4 - 2 * 0.32) / 3, by = y + 0.62, bh3 = 0.86;
  ['Draft an answer', 'Critique it using the principles', 'Revise it'].forEach((t, i) => {
    const x = lx + 0.2 + i * (bw3 + 0.32);
    L.push(box(d, s, x, by, bw3, bh3, { fill: HEX.card2, line: HEX.blue }));
    L.push(d.text(s, t, { x: x + 0.06, y: by, w: bw3 - 0.12, h: bh3, fontSize: 16, bold: true, color: HEX.text, align: 'center', valign: 'middle' }));
    if (i < 2) L.push(seg(d, s, x + bw3 + 0.04, by + bh3 / 2, x + bw3 + 0.28, by + bh3 / 2, { color: HEX.blue, width: 2, arrow: true }));
  });
  L.push(d.text(s, [
    { text: 'A constitution is a written set of principles, ', options: { bold: true, color: HEX.text } },
    { text: 'like “be honest” and “avoid harm”. The revised answers train the model (Constitutional AI, Anthropic, 2022).', options: { color: HEX.muted } },
  ], { x: lx + 0.2, y: y + 1.56, w: cw - 0.4, h: 0.86, fontSize: 16, valign: 'top' }));
  // a real page, in place of the old priority list (the list is in the notes)
  const cfr = await d.frame(s, D('constitution_head.png'), { x: lx + 0.2, y: y + 2.5, w: 2.55, h: 1.38 }, { pad: 0.05, align: 'left' });
  L.push(...cfr);
  L.push(d.text(s, [
    { text: 'Claude’s constitution (Anthropic, Jan 2026)', options: { bold: true, color: HEX.text, breakLine: true, paraSpaceAfter: 4 } },
    { text: 'Anthropic calls it “a perpetual work in progress.”', options: { color: HEX.muted, italic: true } },
  ], { x: cfr.geom.x + cfr.geom.w + 0.25, y: y + 2.5, w: lx + cw - 0.2 - (cfr.geom.x + cfr.geom.w + 0.25), h: 1.38, fontSize: 16, valign: 'middle' }));

  // right: verifiable rewards
  const rx = MX + cw + 0.35;
  const Rg = [box(d, s, rx, y, cw, h, { fill: TINT.amber, line: HEX.amber, lw: 1.25 })];
  Rg.push(...chip(d, s, 'CHECKABLE REWARDS', rx + 0.2, y + 0.18, 2.75, HEX.amber, { fontSize: 14, color: HEX.ink, charSpacing: 2 }));
  ['Model writes its steps', 'A program checks it', 'Right answer = reward'].forEach((t, i) => {
    const x = rx + 0.2 + i * (bw3 + 0.32), yy = y + 0.62;
    Rg.push(box(d, s, x, yy, bw3, bh3, { fill: HEX.card2, line: HEX.amber }));
    Rg.push(d.text(s, t, { x: x + 0.06, y: yy, w: bw3 - 0.12, h: bh3, fontSize: 16, bold: true, color: HEX.text, align: 'center', valign: 'middle' }));
    if (i < 2) Rg.push(seg(d, s, x + bw3 + 0.04, yy + bh3 / 2, x + bw3 + 0.28, yy + bh3 / 2, { color: HEX.amber, width: 2, arrow: true }));
  });
  Rg.push(d.text(s, 'Works for math and code (computer instructions). Result: “reasoning models” that write out steps first.', { x: rx + 0.2, y: y + 1.56, w: cw - 0.4, h: 0.56, fontSize: 16, color: HEX.muted, valign: 'top' }));
  // the stat block lines up with the constitution page on the left (y + 2.5 to y + 3.88). The model's “Wait, wait”
  // words are now a read-aloud in the notes (one idea fewer on a crowded slide)
  const stat = [d.text(s, '15.6% → 71%', { x: rx + 0.2, y: y + 2.5, w: cw - 0.4, h: 0.62, fontSize: 36, bold: true, color: HEX.amber, fontFace: 'Arial', valign: 'bottom' }),
    d.text(s, 'DeepSeek-R1-Zero on AIME 2024, a hard US high-school math contest: before vs. after this practice', { x: rx + 0.2, y: y + 3.18, w: cw - 0.4, h: 0.7, fontSize: 16, color: HEX.muted, valign: 'top' })];
  // the class question, on the slide
  const sy = 5.95;
  const ask = [box(d, s, MX, sy, W - 2 * MX, 0.55, { fill: HEX.card2, line: HEX.red, lw: 1.25 })];
  ask.push(...await beatLine(d, s, { text: 'HANDS UP', iconName: 'FaHandPaper', q: 'Raise a hand to name a task where a computer can’t easily check the answer.', x: MX + 0.15, y: sy, w: W - 2 * MX - 0.3, h: 0.55, qSize: 18 }));
  src(d, s, 'Bai et al. (2022), Constitutional AI (Anthropic) · Anthropic, Claude’s constitution (Jan 22, 2026; page capture) · DeepSeek-AI (2025), DeepSeek-R1, arXiv 2501.12948');
  d.animate(s, L, { auto: true, effect: 'fade' });
  d.animate(s, Rg, { effect: 'fade' });
  d.animate(s, ask, { effect: 'zoom', dur: 400 });
  d.animate(s, stat, { effect: 'zoom', dur: 400 });
  notes(s, {
    min: '1.75',
    build: 'The constitution side (with the real constitution page) shows automatically. Click 1: checkable rewards. Click 2: the hands-up question. Click 3: the 15.6% → 71% result. (The model’s “Wait, wait” words are read aloud, not shown.)',
    say: 'Two newer tricks in post-training. First, a constitution: a written set of principles, like “be honest” and “avoid harm”. The model writes a draft, critiques it against the principles, and revises it, and the revised answers train it. Anthropic publishes the one it uses for Claude. [Click.] Second, checkable rewards. For math and code, which means computer instructions, a simple program can check the final answer. A right answer earns a reward: reinforcement learning again. [Click.] Raise a hand to name a task where a computer can’t easily check the answer. [Call on two; repeat each answer.] Right, that is why this works best for math and code. [Click.] The surprise: the model learns, on its own, to write out its steps first. These are “reasoning models”. DeepSeek’s R1-Zero went from 15.6% to 71% on a hard math contest from this practice alone. But writing out steps is not the same as understanding. [Read aloud, from the paper’s Table 3:] Here are its own words mid-problem: “Wait, wait. Wait. That’s an aha moment I can flag here.”',
    analogy: 'Constitution = a class code of conduct you check your own work against. Checkable rewards = a math worksheet with an answer key: you only get the point if the final answer matches.',
    ask: 'On the slide: “Raise a hand to name a task where a computer can’t easily check the answer.” Format: hands up, call on two (repeat each answer for the room). Expected: writing a good poem, giving advice, being kind. That is why checkable rewards work best for math and code.',
    takeaway: 'Models can also learn from written principles (constitutions) and from automatically checked answers, which produced today’s reasoning models.',
    advanced: 'CLAUDE’S CONSTITUTION (Jan 2026), if a student asks: when its priorities seem to conflict, Claude should “generally prioritize” them in this order: broadly safe (in Anthropic’s words, “not undermining appropriate human mechanisms to oversee AI during the current phase of development”), broadly ethical (being honest, acting on good values, avoiding harmful actions), compliant with Anthropic’s guidelines, then genuinely helpful (benefiting the people it works with). Anthropic calls the document “a perpetual work in progress”. DeepSeek (Jan 22, 2025): “the reasoning abilities of LLMs can be incentivized through pure reinforcement learning (RL), obviating the need for human-labeled reasoning trajectories.” For math, “the model is required to provide the final answer in a specified format (e.g., within a box), enabling reliable rule-based verification of correctness.” With majority voting R1-Zero reached 86.7%. OpenAI’s o1 (Sep 2024) was an earlier reasoning model; OpenAI says o1 “consistently improves with more reinforcement learning (train-time compute) and with more time spent thinking (test-time compute).”',
    terms: 'constitution, Constitutional AI, code (computer instructions), reinforcement learning with verifiable (checkable) rewards, reasoning model, AIME (a US high-school math contest).',
    caveats: '“Reasoning” here means writing out steps before answering, not proof of understanding. Checkers can be gamed: a model may find ways to get the reward without doing what we meant (Part 3). The 15.6% and 71.0% are pass@1 scores on AIME 2024 from the arXiv v1 paper. The constitution page in the picture is a real capture of anthropic.com/constitution (cropped); the priority order (advanced note) is Anthropic’s own document, and applies “in cases of apparent conflict”. The “Wait, wait” line (read aloud; not on the slide) is verbatim from Table 3 of the arXiv v1 paper (an intermediate R1-Zero; a single transcript, not a measured result); the next line in the table reads “Let’s reevaluate this step-by-step to identify if the correct sum can be ⋯”.',
    sources: ['https://arxiv.org/abs/2212.08073 (Bai et al. 2022, Constitutional AI)', 'https://www.anthropic.com/news/claude-new-constitution', 'https://www.anthropic.com/constitution', 'https://arxiv.org/abs/2501.12948 (DeepSeek-R1; Table 3 “aha moment” in https://arxiv.org/html/2501.12948v1)', 'https://openai.com/index/learning-to-reason-with-llms/'],
  });
  return s;
}

// PART 1 · 12  The frontier pipeline
async function pipelineSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(12));
  title(s, 'How a frontier model is made, step by step');
  const top = d.text(s, 'FRONTIER MODEL = ONE OF THE MOST CAPABLE MODELS · THESE STEPS ARE GENERIC: LABS RARELY PUBLISH FULL RECIPES', { x: MX, y: 1.66, w: W - 2 * MX, h: 0.3, fontSize: 12, bold: true, color: d.S.steel, charSpacing: 1, valign: 'bottom' });
  const n = 6, gap = 0.16, cw = (W - 2 * MX - (n - 1) * gap) / n, y = 2.06, h = 3.4, LH = 0.27;
  // [icon, step, what happens, a real figure, color, [name, what, figure] line counts at 16 pt in this column width]
  const st = [
    ['FaDatabase', 'Collect and filter data', 'Books, websites, code; junk removed', 'Llama 4: 30 trillion+ tokens', HEX.steel, [2, 3, 3]],
    ['FaBookOpen', 'Pretraining', 'Guess the next word, trillions of times', 'GPT-6 Astra: 100,000+ GPUs', HEX.steel, [1, 3, 2]],
    ['FaChalkboardTeacher', 'SFT (supervised fine-tuning)', 'Copy answers people wrote', 'InstructGPT (2022): under 2% of pretraining’s compute and data', HEX.amber, [2, 2, 4]],
    ['FaThumbsUp', 'Preference training', 'RLHF and constitutions', 'Raters compare answer pairs', HEX.amber, [2, 2, 2]],
    ['FaCheckDouble', 'Reinforcement learning on checkable tasks', 'Math and code with answer checkers', 'R1-Zero: 15.6% → 71% on a math contest', HEX.amber, [3, 2, 3]],
    ['FaShieldAlt', 'Safety testing and release', 'Red-teaming (experts try to make it fail)', 'GPT-5: 5,000+ hours of red-teaming', HEX.red, [2, 3, 3]],
  ];
  const cols = [];
  for (let i = 0; i < n; i++) {
    const [nm, name, what, big, c, [, wl, bl]] = st[i], x = MX + i * (cw + gap), last = i === n - 1;
    const g = [box(d, s, x, y, cw, h, { fill: last ? TINT.red : HEX.card, line: last ? HEX.red : HEX.line, lw: last ? 1.5 : 0.75 })];
    g.push(...numDisc(d, s, i + 1, x + 0.38, y + 0.38, 0.5, c, { color: c === HEX.amber ? HEX.ink : 'FFFFFF', fontSize: 17 }));
    g.push(await ic(d, s, nm, c, x + cw - 0.6, y + 0.17, 0.42));
    g.push(d.text(s, name, { x: x + 0.1, y: y + 0.7, w: cw - 0.16, h: 0.82, fontSize: 16, bold: true, color: HEX.text, valign: 'top' }));
    g.push(d.text(s, what, { x: x + 0.1, y: y + 1.55, w: cw - 0.16, h: wl * LH + 0.06, fontSize: 16, color: HEX.muted, valign: 'top' }));
    const bh = bl * LH + 0.06;
    g.push(d.text(s, big, { x: x + 0.1, y: y + h - 0.08 - bh, w: cw - 0.16, h: bh, fontSize: 16, bold: true, color: c === HEX.steel ? HEX.text : c, valign: 'bottom' }));
    if (i < n - 1) g.push(seg(d, s, x + cw - 0.02, y + 0.38, x + cw + gap + 0.02, y + 0.38, { color: HEX.steel, width: 1.5, arrow: true }));
    cols.push(g);
  }
  const bk = (i0, i1, text, color) => {
    const x0 = MX + i0 * (cw + gap), x1 = MX + i1 * (cw + gap) + cw, yy = y + h + 0.12;
    return [seg(d, s, x0 + 0.05, yy, x1 - 0.05, yy, { color, width: 2 }),
      d.text(s, text, { x: x0, y: yy + 0.04, w: x1 - x0, h: 0.3, fontSize: 12, bold: true, color, align: 'center', charSpacing: 2 })];
  };
  const brackets = [...bk(0, 1, 'PRETRAINING', HEX.steel), ...bk(2, 4, 'POST-TRAINING', HEX.amber), ...bk(5, 5, 'TESTING', HEX.red)];
  const by = 5.98;
  const bar = [box(d, s, MX, by, W - 2 * MX, 0.52, { fill: HEX.card2, line: HEX.red, lw: 1.25 })];
  bar.push(...await beatLine(d, s, { text: 'TURN TO A NEIGHBOR', iconName: 'FaComments', q: 'At which step would you test for dangerous behavior? Why? (30 seconds)', x: MX + 0.15, y: by, w: W - 2 * MX - 0.3, h: 0.52, qSize: 18 }));
  src(d, s, 'Sources: Meta (Llama 4) · OpenAI via Fortune (Sep 3, 2026) · OpenAI, InstructGPT (2022) · DeepSeek-R1 (arXiv 2501.12948) · OpenAI GPT-5 system card (Aug 2025)');
  d.animate(s, [top], { auto: true });
  cols.forEach((g, i) => d.animate(s, g, { auto: i === 0, effect: 'rise', after: 100 }));
  d.animate(s, brackets, { effect: 'fade' });
  d.animate(s, bar, { effect: 'zoom', dur: 400 });
  notes(s, {
    min: '2.0',
    build: 'Step 1 shows automatically; each click adds the next step (2–6). Click 6: the PRETRAINING / POST-TRAINING / TESTING brackets. Click 7: the turn-and-talk question.',
    say: 'Let’s put the whole recipe together. A frontier model means one of the most capable models, from a few top labs. Step 1: collect and filter data: books, websites, code, with junk removed. [Click.] Step 2: pretraining, the giant guess-the-next-word game. That gives the base model. [Click.] Step 3: SFT, supervised fine-tuning: copying example answers people wrote. [Click.] Step 4: preference training, which means teaching the model which answers people prefer: RLHF, reinforcement learning from human feedback, and constitutions. [Click.] Step 5: reinforcement learning on checkable tasks like math and code. [Click.] Step 6: safety testing and release, including red-teaming, where experts try hard to make the model misbehave. [Click.] Steps 1–2 are pretraining, 3–5 post-training, 6 testing. [Click.] Now turn to a neighbor for 30 seconds: at which step would you test for dangerous behavior, and why? [After 30 seconds, take two volunteers.]',
    analogy: 'Building a car: gather materials, build the engine (pretraining), tune it for real roads (post-training), then crash-test it before selling it (safety testing).',
    takeaway: 'A frontier model is made in stages: data, pretraining, several kinds of post-training, then safety testing (which really runs throughout).',
    ask: 'On the slide (TURN TO A NEIGHBOR, 30 seconds, then two volunteers): “At which step would you test for dangerous behavior?” Good answers: after pretraining, because the base model already knows a lot; after each post-training step, because behavior changes; before release; after release, because people use it in new ways. Best answer: all of them. Real labs test throughout, not only at the end.',
    advanced: 'Labs publish safety frameworks: Anthropic’s Responsible Scaling Policy says reaching certain capability thresholds “requires us to upgrade our safeguards”; OpenAI’s Preparedness Framework (v2, Apr 2025): “We do not deploy models that reach a High capability threshold until the associated risks that they pose are sufficiently minimized”; Google DeepMind’s Frontier Safety Framework (v3.1, Apr 2026) defines “Critical Capability Levels”. Anthropic admitted in Feb 2026: “The science of model evaluation isn’t well-developed enough to provide dispositive answers.”',
    terms: 'frontier model, preference training (teaching the model which answers people prefer), red-teaming (experts try to make a model misbehave), dangerous-capability tests, staged release, monitoring.',
    caveats: 'The stages are generic: labs rarely publish full recipes (Meta’s Llama 3 paper and DeepSeek’s V3 and R1 reports give a lot of detail, such as token counts; for OpenAI, Google and Anthropic we found no published token counts, as on the pretraining slide), and the order varies; safety testing runs throughout, not only at the end; and no one can yet fully verify that a model is safe (Part 3). Figures: Llama 4 “more than 30 trillion tokens” (Meta); GPT-6 Astra “more than 100,000 GPUs” (OpenAI via Fortune); InstructGPT post-training used “less than 2% of the compute and data relative to model pretraining” (OpenAI, 2022, labeled with its year on the slide; newer models may use much more for RL, which OpenAI does not quantify); R1-Zero AIME 2024 pass@1 15.6% → 71.0% (DeepSeek); GPT-5 red-teaming, verbatim: “more than 5,000 hours of work from over 400 external testers and experts” (OpenAI system card, Aug 2025). Step 6 also covers tests for dangerous abilities, releasing in stages, and monitoring after launch (say this only if asked).',
    sources: ['https://ai.meta.com/blog/llama-4-multimodal-intelligence/', 'https://fortune.com/2026/09/03/openai-debuts-gpt-6-astra-computer-use-greg-brockman-says-start-of-agi/', 'https://openai.com/index/instruction-following/', 'https://arxiv.org/abs/2501.12948', 'https://cdn.openai.com/gpt-5-system-card.pdf', 'https://www.anthropic.com/responsible-scaling-policy', 'https://anthropic.com/news/responsible-scaling-policy-v3', 'https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf', 'https://deepmind.google/frontier-safety/'],
  });
  return s;
}

// PART 1 · 13  Data, compute, method
async function ingredientsSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(13));
  title(s, 'Three ingredients: data, compute and method');
  const lw = 5.6;
  const ing = [
    ['FaDatabase', HEX.blue, TINT.blue, 'Data', 'the ingredients', 'Text, images and code to learn from.'],
    ['PiCpuFill', HEX.red, TINT.red, 'Compute', 'the oven time', 'The total math done by chips. It costs time and electricity.'],
    ['FaScroll', HEX.amber, TINT.amber, 'Method', 'the recipe', 'Model designs and training tricks, like the steps you just saw.'],
  ];
  const rows = [];
  for (let i = 0; i < 3; i++) {
    const [nm, c, tint, name, an, de] = ing[i], y = 1.85 + i * 1.32;
    const g = [box(d, s, MX, y, lw, 1.2, { fill: HEX.card, line: HEX.line })];
    g.push(...await iconDisc(d, s, nm, MX + 0.62, y + 0.6, 0.88, c, tint));
    g.push(d.text(s, [{ text: name, options: { bold: true, color: HEX.text, fontSize: 22, fontFace: 'Arial' } }, { text: '  =  ' + an, options: { bold: true, color: c, fontSize: 18, breakLine: true } }, { text: de, options: { color: HEX.muted, fontSize: 16 } }], { x: MX + 1.25, y: y + 0.05, w: lw - 1.38, h: 1.1, valign: 'middle' }));
    rows.push(g);
  }
  const vote = await beatLine(d, s, { text: 'HANDS UP', iconName: 'FaHandPaper', q: 'Which ingredient is hardest to keep growing?', x: MX, y: 5.86, w: lw, h: 0.62, qSize: 16 });
  // right: compute of landmark models on a log scale, drawn as DOTS (a native line chart with no line): on a log axis a
  // bar's length would not show its size (GPT-6 Astra's bar would be only ~1.5× GPT-3's for ~3,200× the compute). Each
  // dot's height is log10(FLOP ÷ AlexNet's) + 1, so AlexNet sits on the 1× gridline; the left axis labels every second
  // gridline in "× AlexNet". Two series only so the last dot can be red.
  const rx = 6.6, rw = W - MX - rx;
  const chL = label(d, s, 'TRAINING COMPUTE · EPOCH AI ESTIMATES', rx, 1.7, rw, { color: d.S.steel });
  const sub = d.text(s, 'Log scale: each gridline up = 10× more math. Labels compare with AlexNet (2012) = 1×.', { x: rx, y: 2.0, w: rw, h: 0.56, fontSize: 16, color: d.S.muted, italic: true, valign: 'top' });
  const pts = [['AlexNet', '2012', 4.7e17, '1× (base)', 'reads images'], ['Transformer', '2017', 7.4245248e18, '16×', 'LLM design'], ['GPT-3', '2020', 3.14e23, '670,000×', ''], ['GPT-4', '2023', 2.1e25, '45 million×', ''], ['GPT-6 Astra', '2026', 1.0001e27, '≈ 2 billion×', '']];
  const vals = pts.map((p) => +(Math.log10(p[2] / 4.7e17) + 1).toFixed(3));
  const cbox = { x: rx, y: 2.6, w: rw, h: 2.42 }, layout = { x: 0.17, y: 0.14, w: 0.81, h: 0.84 }, maxV = 11, dotPt = 15;
  const last = vals.length - 1;
  const chart = d.chart(s, 'line', [
    { name: 'earlier models', labels: pts.map((p) => p[0]), values: vals.map((v, i) => (i < last ? v : '')) },
    { name: 'GPT-6 Astra', labels: pts.map((p) => p[0]), values: vals.map((v, i) => (i === last ? v : '')) },
  ], cbox, {
    valAxisHidden: true, catAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: maxV, valAxisMajorUnit: 1,
    chartColors: [HEX.steel, HEX.red], lineSize: 0, lineDataSymbol: 'circle', lineDataSymbolSize: dotPt, layout, showLegend: false,
  });
  // same geometry as a 5-category bar chart: category centers and value heights
  const g = barGeom(cbox, layout, pts.length, 55, maxV);
  const dotR = dotPt / 72 / 2;
  const labs = [];
  ['1×', '100×', '10,000×', '1 million×', '100 million×', '10 billion×'].forEach((t, k) => {
    labs.push(d.text(s, t, { x: rx, y: g.vy(1 + 2 * k) - 0.14, w: layout.x * rw - 0.08, h: 0.28, fontSize: 12, color: d.S.steel, align: 'right', valign: 'middle' }));
  });
  pts.forEach(([nm, yr, , t, gl], i) => {
    labs.push(d.text(s, t, { x: g.cx(i) - 0.75, y: g.vy(vals[i]) - dotR - 0.36, w: 1.5, h: 0.32, fontSize: 16, bold: true, color: i === last ? d.S.red : HEX.text, align: 'center', valign: 'bottom' }));
    const runs = [{ text: nm, options: { bold: true, color: HEX.text, breakLine: true } }, { text: yr, options: { color: HEX.muted, breakLine: !!gl } }];
    if (gl) runs.push({ text: gl, options: { color: HEX.muted, italic: true } });
    labs.push(d.text(s, runs, { x: g.cx(i) - 0.62, y: g.py + g.ph + 0.04, w: 1.24, h: 0.62, fontSize: 12, align: 'center', valign: 'top' }));
  });
  // Epoch's fitted trend vs. what the two landmark dots imply (they differ; the notes explain why)
  const note = d.text(s, [
    { text: 'Epoch AI’s trend across many models: about 5× more each year since 2020 (range 4× to 6×). ', options: { color: HEX.text } },
    { text: 'GPT-3 → GPT-6 Astra alone: about 3.6× a year (our arithmetic).', options: { color: HEX.muted } },
  ], { x: rx, y: 5.7, w: rw, h: 0.82, fontSize: 16, valign: 'top' });
  src(d, s, 'Data: Epoch AI model database (estimates, in FLOP = single math steps; OpenAI has not disclosed GPT-6 Astra’s) · Epoch AI Trends, Feb 2026 · ratios: our division');
  d.animate(s, rows[0], { auto: true, effect: 'rise' });
  d.animate(s, rows[1], { effect: 'rise' });
  d.animate(s, rows[2], { effect: 'rise' });
  d.animate(s, [chL, sub, chart, ...labs], { effect: 'wipeLeft', dur: 800 });
  d.animate(s, [note], { effect: 'fade' });
  d.animate(s, vote, { effect: 'zoom', dur: 400 });
  notes(s, {
    min: '1.5',
    build: 'Data shows automatically. Click 1: compute. Click 2: method. Click 3: the chart. Click 4: the trend sentence and what the two dots alone give (no line is drawn: the dots are not evenly spaced in time). Click 5: the hands-up vote.',
    say: 'Why has AI improved so fast? Think of baking a cake. Data is the ingredients: text, images and code to learn from. [Click.] Compute is the oven time: the total math done by chips. [Click.] Method is the recipe: model designs and training tricks. [Click.] Each dot is one landmark model, on a log scale: each gridline up means ten times more math. AlexNet, a 2012 breakthrough at recognizing images, is 1×. The Transformer, in 2017, is the design behind today’s LLMs. GPT-3 used about 670,000 times AlexNet’s math; GPT-6 Astra, an estimated 2 billion times. [Click.] Epoch AI, a research group that tracks this, fits a trend to many models: about five times more compute every year since 2020. Our two dots alone give about 3.6 times a year: single models sit above or below a trend. [Click.] Quick vote: which ingredient is hardest to keep growing? Hands up for data… compute… method. [Count roughly.] Experts disagree too. Next: scaling laws.',
    analogy: 'Baking: ingredients (data), oven time (compute) and a recipe (method). A bigger cake needs all three to grow together.',
    ask: 'On the slide: “Which ingredient is hardest to keep growing?” Format: a three-way hands-up vote (data / compute / method), about 20 seconds. Possible reasons: data (we may run out of good human text), compute (costs money and electricity), method (needs new ideas). All are reasonable; experts disagree.',
    takeaway: 'AI improves through more data, more compute and better methods; compute has grown by billions of times since 2012.',
    advanced: 'Compute is measured in FLOP (floating-point operations: single additions or multiplications). Epoch estimates (log scale): AlexNet 4.7e17 FLOP (“Confident”), the original Transformer 7.4e18 (“Confident”), GPT-3 3.14e23 (“Confident”), GPT-4 2.1e25 (“Likely”, within about 10×), GPT-6 Astra 1.0e27 (“Likely”; Epoch’s interval about 5e26–2e27). Dot heights show log10(FLOP ÷ AlexNet’s FLOP) on a log axis, with AlexNet on the 1× gridline; the left axis labels every second gridline. Dots, not bars: on a log scale a bar’s length does not show its size (GPT-6 Astra’s bar would be only about 1.5× as tall as GPT-3’s, for about 3,200× the compute). Ratios are our division: 7.4e18/4.7e17 ≈ 16; 3.14e23/4.7e17 ≈ 670,000; 2.1e25/4.7e17 ≈ 45 million; 1e27/4.7e17 ≈ 2.1 billion. GROWTH RATES, RECONCILED: Epoch’s “5× per year since 2020” (90% range 4–6×) is a trend fitted to many frontier language models, not the slope between two dots (no trend line is drawn on the chart, because its dots are not evenly spaced in time). Our two landmark dots (shown on the slide as “about 3.6× a year, our arithmetic”), GPT-3 (May 2020) to GPT-6 Astra (Sep 2026), give 1e27 ÷ 3.14e23 ≈ 3,200× in about 6.3 years, roughly 3.6× per year (our arithmetic); single models sit above or below a trend line. Epoch’s older study (May 2024) found about 4.1× per year for notable models and 5.3× for frontier models from 2010 to May 2024: different sets of models and years. Rich Sutton’s “The Bitter Lesson” (2019): “general methods that leverage computation are ultimately the most effective, and by a large margin.”',
    terms: 'data, compute (the total math done by chips), FLOP (floating-point operation: one single addition or multiplication; on the source line), chip (a computer chip such as a GPU), method, log scale (each step up the axis multiplies by 10), Transformer (the 2017 design behind today’s LLMs).',
    caveats: 'All compute figures are Epoch AI estimates (labeled on the slide); labs rarely disclose them. GPT-6 Astra’s estimate is based on “at least 100,000 GB200s” over an assumed 90 days.',
    sources: ['https://epoch.ai/data/all_ai_models.csv', 'https://epoch.ai/data/ai-models', 'https://epoch.ai/trends (“Training compute for frontier language models has been growing at 5× per year since 2020”, updated Feb 5, 2026)', 'https://epoch.ai/blog/training-compute-of-frontier-ai-models-grows-by-4-5x-per-year', 'https://epoch.ai/blog/training-compute-of-frontier-ai-models (4.1× notable, 5.3× frontier, 2010–May 2024)', 'https://www.youtube.com/watch?v=wjZofJX0v4M (3Blue1Brown, “Transformers, the tech behind LLMs”)', 'https://arxiv.org/abs/1409.0575 (AlexNet won ImageNet 2012)', 'http://www.incompleteideas.net/IncIdeas/BitterLesson.html'],
  });
  return s;
}

// PART 1 · 14  Scaling laws
async function scalingSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  kicker(s, K(14));
  title(s, 'Scaling laws: bigger runs, steadily lower loss');
  const lw = 7.2;
  const chL = label(d, s, 'LOSS ON NEW TEXT vs. COMPUTE · REDRAWN FROM KAPLAN ET AL. (2020)', MX, 1.7, lw, { color: d.S.steel });
  // Kaplan et al. Fig. 1 fit: L = (C / 2.3e8)^-0.050, C in PF-days, drawn from 1e-8 to 1e1 (most of the figure's range).
  // Both axes are logarithmic, as in the original, so the power law is a straight line.
  const cats = ['1×', '10×', '100×', '1k×', '10k×', '100k×', '1M×', '10M×', '100M×', '1B×'];
  const vals = cats.map((_, k) => +Math.pow(1e-8 * Math.pow(10, k) / 2.3e8, -0.05).toFixed(3));
  const chart = d.chart(s, 'line', [{ name: 'test loss (fit)', labels: cats, values: vals }], { x: MX, y: 2.0, w: lw, h: 4.1 }, {
    valAxisMinVal: 2, valAxisMaxVal: 7, valAxisLogScaleBase: 10, valAxisHidden: true, lineDataSymbol: 'circle', lineDataSymbolSize: 8,
    chartColors: [HEX.red], lineSize: 4, catAxisLabelFontSize: 13, showLegend: false, valGridLine: { style: 'none' },
    showValAxisTitle: true, valAxisTitle: 'loss on new text (lower = better)', valAxisTitleFontSize: 13,
    showCatAxisTitle: true, catAxisTitle: 'training compute (1× = smallest run shown; each step = 10× more)', catAxisTitleFontSize: 13,
  });
  const call = d.text(s, [{ text: 'Each 10× more compute', options: { bold: true, color: HEX.text, breakLine: true } }, { text: '→ about 11% lower loss', options: { bold: true, color: HEX.red } }], { x: MX + 3.9, y: 2.25, w: 3.2, h: 0.75, fontSize: 18, valign: 'top' });
  // the tick labels' k / M / B, spelled out under the axis title
  const kmb = d.text(s, 'k = thousand  ·  M = million  ·  B = billion', { x: MX + 0.6, y: 6.1, w: lw - 0.6, h: 0.3, fontSize: 13, color: d.S.muted, align: 'center', valign: 'top' });
  const callNote = d.text(s, '(our arithmetic from the paper’s fit)', { x: MX + 3.9, y: 3.02, w: 3.2, h: 0.34, fontSize: 16, color: d.S.muted, italic: true });

  // right: what it does / doesn't say + the class question
  const rx = 8.2, rw = W - MX - rx;
  const says = [box(d, s, rx, 1.8, rw, 1.3, { fill: TINT.teal, line: HEX.teal }),
    d.text(s, [{ text: 'WHAT IT SAYS', options: { fontSize: 12, bold: true, color: HEX.teal, charSpacing: 2, breakLine: true, paraSpaceAfter: 2 } }, { text: 'Loss falls smoothly and predictably as model size, data and compute grow (Kaplan et al., 2020).', options: { fontSize: 16, color: HEX.text } }], { x: rx + 0.18, y: 1.88, w: rw - 0.3, h: 1.16, valign: 'top' })];
  const not = [box(d, s, rx, 3.32, rw, 1.35, { fill: TINT.red, line: HEX.red }),
    d.text(s, [{ text: 'WHAT IT DOESN’T SAY', options: { fontSize: 12, bold: true, color: HEX.red, charSpacing: 2, breakLine: true, paraSpaceAfter: 2 } },
      { text: 'Which new skills will appear. And 10× compute is a steady, modest gain, not a 10× smarter model.', options: { fontSize: 16, color: HEX.text } }], { x: rx + 0.18, y: 3.4, w: rw - 0.3, h: 1.2, valign: 'top' })];
  const q = [box(d, s, rx, 4.97, rw, 1.3, { fill: HEX.card2, line: HEX.red, lw: 1.25 })];
  q.push(...await beatTag(d, s, 'THINK ABOUT IT', 'FaLightbulb', rx + 0.18, 5.09));
  q.push(d.text(s, 'If 10× compute gives about 11% lower loss, why do labs keep spending more?', { x: rx + 0.18, y: 5.52, w: rw - 0.3, h: 0.7, fontSize: 16, bold: true, color: HEX.text, valign: 'top' }));
  src(d, s, 'Kaplan et al. (2020), Scaling Laws for Neural Language Models, Fig. 1 (line redrawn from its fit; log scale on both axes, as in the original) · Hoffmann et al. (2022), “Chinchilla”');
  d.animate(s, [chL, chart, kmb], { auto: true, effect: 'wipeLeft', dur: 1200 });
  d.animate(s, [call, callNote], { effect: 'zoom', dur: 400 });
  d.animate(s, says, { effect: 'rise' });
  d.animate(s, not, { effect: 'rise' });
  d.animate(s, q, { effect: 'zoom', dur: 400 });
  notes(s, {
    min: '2.0',
    build: 'The line draws in automatically. Click 1: “each 10× → about 11% lower loss”. Click 2: what it says. Click 3: what it doesn’t say. Click 4: the THINK ABOUT IT question.',
    say: 'In 2020, Jared Kaplan and colleagues at OpenAI found something remarkable. As they made language models bigger, with more text and more compute, the loss on new text, meaning how wrong the model is, went down along a smooth, predictable line, redrawn here from their paper. That pattern has a name: a scaling law. Each step to the right is ten times more compute; k means thousand, M million and B billion. [Click.] Notice the gains: each 10× more compute cut the loss by about 11%. Steady, but modest. Careful: 11% lower loss is not 11% fewer mistakes. [Click.] So the lesson: as model size, data and compute grow, the loss falls predictably. That is why labs spend billions: they can roughly predict what a bigger run buys. In 2022, DeepMind’s “Chinchilla” paper refined this: grow the model and the training data equally. [Click.] What it does NOT tell you: which new skills will show up. And ten times more compute does not mean a ten-times-smarter model. [Click.] Think about it: if ten times the compute only gives about 11% lower loss, why do labs keep spending more? [Take one or two answers.]',
    analogy: 'Like practicing free throws: the first hours help a lot, and each extra ten-times-more practice still helps, but by a steady, smaller amount.',
    ask: 'On the slide (THINK ABOUT IT): “If 10× compute gives about 11% lower loss, why do labs keep spending more?” Take one or two answers. Expected: small drops in loss can unlock big new abilities; competition; it is predictable, so it feels like a safe bet.',
    takeaway: 'Scaling laws: more compute, data and model size lower the loss smoothly and predictably, but they do not predict which new skills appear.',
    advanced: 'Kaplan et al. abstract: “The loss scales as a power-law with model size, dataset size, and the amount of compute used for training, with some trends spanning more than seven orders of magnitude.” Kaplan’s Fig. 1 caption: “For optimal performance all three factors must be scaled up in tandem”, while its abstract says compute-efficient training means “very large models on a relatively modest amount of data”; Chinchilla’s equal-scaling rule came in 2022. Fit: L = (C/2.3×10⁸)^−0.050 (C in petaflop-days, the figure’s legend; Eq. 1.3 gives 3.1×10⁸). 10^−0.05 ≈ 0.891, so each 10× compute → about 11% lower loss (our arithmetic). Chinchilla (Hoffmann et al. 2022): “for every doubling of model size the number of training tokens should also be doubled”; Chinchilla (70B parameters, 1.4T tokens) beat the 280B Gopher with the same compute. A 2024 replication (Besiroglu et al.) found one of Chinchilla’s three methods inconsistent with the other two. Schaeffer et al. (2023) argued some “emergent abilities” are partly an artifact of how they are measured. Since 2024 labs also scale reinforcement learning and “thinking time”, and experts debate how much more pretraining scaling will help.',
    terms: 'scaling law, loss on new text (how wrong the model is on text it never saw, the “test loss”), compute.',
    caveats: 'The line is redrawn from the paper’s published fit (no new numbers) from 10⁻⁸ to 10 petaflop-days, a subset of the figure’s range: the figure’s axis starts at 10⁻⁹, where the fit (about 7.4) runs off the top of its 2–7 loss axis. Both axes are logarithmic, as in the original, so the fit is a straight line. The y-axis values are hidden because loss units mean little to students. The x-axis labels count from the smallest run shown (1× = 10⁻⁸ petaflop-days). “Loss” is cross-entropy, not a percent of wrong answers, so “11% lower loss” is not “11% fewer mistakes”. “About 11%” is our arithmetic from the exponent 0.050. Predictable loss does not mean predictable new skills. The original chart is Fig. 1 (left panel) on p. 3 of the paper, if a student asks to see it.',
    sources: ['https://arxiv.org/abs/2001.08361 (Kaplan et al. 2020, Fig. 1 p. 3)', 'https://arxiv.org/abs/2203.15556 (Hoffmann et al. 2022, Chinchilla)', 'https://arxiv.org/abs/2404.10102 (Chinchilla replication)', 'https://arxiv.org/abs/2304.15004 (Schaeffer et al. 2023)', 'https://openai.com/index/learning-to-reason-with-llms/'],
  });
  return s;
}

// =====================================================================================
// PART 1 · 16  Training electricity (adapted from economy:trainingSlide, adult slide 10)
function tag(d, s, text, x, y, fill) {
  const r = d.name('tag');
  const w = 0.2 + text.length * 0.13;
  s.addShape(d.pres.shapes.RECTANGLE, { x, y, w, h: 0.4, fill: { color: fill }, line: { color: fill, width: 0 }, objectName: r });
  const t = d.text(s, text, { x, y, w, h: 0.4, fontSize: 14, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', charSpacing: 2 });
  return [r, t];
}

async function trainingEnergySlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  kicker(s, K(16));
  // the estimate label is in the title: the 3.7 days rests on Epoch AI's assumed 90-day run and 232.7 MW (not disclosed)
  title(s, 'Est.: training GPT-6 Astra ≈ 4 days of NYC power');
  const bt = await beat(d, s, 'GUESS FIRST', 'FaQuestionCircle');
  // left: the headline + the guess
  const lw = 4.15;
  const clip = await d.frame(s, D('pcgamer_astra_head.png'), { x: MX, y: 1.82, w: lw, h: 2.3 }, { rot: -1.5, pad: 0.06 });
  const qy = 4.42, qh = 2.05;
  const quiz = [box(d, s, MX, qy, lw, qh, { fill: TINT.amber, line: HEX.amber, lw: 1.25 })];
  quiz.push(d.text(s, 'How many times more electricity than GPT-3’s training (2020)?', { x: MX + 0.18, y: qy + 0.08, w: lw - 0.3, h: 0.58, fontSize: 16, bold: true, color: HEX.text, valign: 'top' }));
  ['A · 3×', 'B · 30×', 'C · 300×'].forEach((t, i) => {
    const x = MX + 0.18 + i * 1.3;
    quiz.push(box(d, s, x, qy + 0.72, 1.18, 0.5, { fill: HEX.card2, line: HEX.amber }));
    quiz.push(d.text(s, t, { x, y: qy + 0.72, w: 1.18, h: 0.5, fontSize: 18, bold: true, color: HEX.text, align: 'center', valign: 'middle' }));
  });
  const ans = [d.text(s, '≈ 280×', { x: MX + 0.18, y: qy + 1.3, w: 1.6, h: 0.65, fontSize: 32, bold: true, color: d.S.red, fontFace: 'Arial', valign: 'middle' }),
    d.text(s, '1.8 → 503 GWh, Epoch AI estimates', { x: MX + 1.8, y: qy + 1.3, w: lw - 1.9, h: 0.65, fontSize: 16, color: HEX.text, valign: 'middle' })];

  // right: one week of NYC electricity + trend tiles
  const rx = 5.15, rw = W - MX - rx;
  const lab1 = label(d, s, 'OPENAI HAS NOT DISCLOSED THE ENERGY · EPOCH AI ESTIMATES', rx, 1.7, rw, { color: d.S.steel });
  const lab2 = label(d, s, 'ONE WEEK OF NEW YORK CITY’S ELECTRICITY  =  961 GWh', rx, 2.05, rw, { color: d.S.amber });
  const by = 2.42, bh = 0.68, gap = 0.05, bw = (rw - 6 * gap) / 7, dx = (i) => rx + i * (bw + gap);
  const week = [];
  for (let i = 0; i < 7; i++) {
    const n = d.name('day');
    s.addShape(d.pres.shapes.RECTANGLE, { x: dx(i), y: by, w: bw, h: bh, fill: { color: HEX.card }, line: { color: HEX.steel, width: 0.75 }, objectName: n });
    week.push(n, d.text(s, `day ${i + 1}`, { x: dx(i), y: by + bh + 0.03, w: bw, h: 0.26, fontSize: 12, color: d.S.steel, align: 'center', valign: 'top' }));
  }
  const astraDays = 3.66, segs = [];
  for (let i = 0; i < Math.ceil(astraDays); i++) {
    const n = d.name('fill'), f = Math.min(1, astraDays - i);
    s.addShape(d.pres.shapes.RECTANGLE, { x: dx(i), y: by, w: f * bw, h: bh, fill: { color: HEX.red }, line: { color: HEX.red, width: 0.75 }, objectName: n });
    segs.push(n);
  }
  const fillT = d.text(s, [{ text: 'GPT-6 Astra’s training ≈ 3.7 days ', options: { bold: true, color: HEX.red } }, { text: 'of NYC’s electricity use', options: { color: HEX.text } }],
    { x: rx, y: by + bh + 0.32, w: rw, h: 0.34, fontSize: 16, valign: 'middle' });
  // range: Epoch's compute interval for Astra (5e26–2e27 FLOP, central 1e27) scales 3.66 days to 1.8–7.3 days (our
  // arithmetic); the bar ends at day 7, so the right end is an arrow ("past day 7")
  const wy = by + bh + 0.86, w0 = rx + 1.83 * (bw + gap), w1 = rx + 7 * (bw + gap) - gap;
  const whisk = [seg(d, s, w0, wy, w1, wy, { color: HEX.muted, width: 1.25, arrow: true }), seg(d, s, w0, wy - 0.07, w0, wy + 0.07, { color: HEX.muted, width: 1.25 })];
  whisk.push(d.text(s, 'range ≈ 2 to 7+ days: our arithmetic from Epoch AI’s compute range', { x: w0, y: wy + 0.06, w: w1 - w0, h: 0.28, fontSize: 12, color: d.S.muted, align: 'center', valign: 'top' }));

  const lab3 = label(d, s, 'ALL RUNS ON ONE YARDSTICK: NYC TIME TO USE EACH RUN’S ELECTRICITY', rx, 4.36, rw);
  // the not-training-time caveat sits above the tiles, in white
  const caveat = d.text(s, 'These are not training times: Epoch assumes Astra trained for about 90 days.', { x: rx, y: 4.7, w: rw, h: 0.34, fontSize: 16, color: HEX.text, valign: 'middle' });
  const ty = 5.12, th = 1.1, ag = 0.12, cw = (rw - 3 * ag) / 4;
  const trend = [['GPT-3', '2020', '~19 min'], ['GPT-4', '2023', '~8 hours'], ['Grok 3', '2025', '~1.7 days'], ['GPT-6 Astra', '2026', '~3.7 days']];
  const tgroups = [];
  trend.forEach(([m, yr, v], i) => {
    const x = rx + i * (cw + ag), g = [d.card(s, { x, y: ty, w: cw, h: th })];
    g.push(d.text(s, [{ text: m, options: { bold: true, color: HEX.text, breakLine: true } }, { text: yr, options: { color: HEX.muted } }], { x: x + 0.12, y: ty + 0.05, w: cw - 0.16, h: 0.58, fontSize: 16, valign: 'top' }));
    g.push(d.text(s, v, { x: x + 0.12, y: ty + 0.64, w: cw - 0.16, h: 0.42, fontSize: 20, bold: true, color: i === 3 ? d.S.red : HEX.text, fontFace: 'Arial', valign: 'middle' }));
    if (i < 3) g.push(d.text(s, '›', { x: x + cw, y: ty, w: ag, h: th, fontSize: 20, color: d.S.steel, align: 'center', valign: 'middle' }));
    tgroups.push(g);
  });
  // the 2030 forecast (a power figure, not a time) is in the notes only
  src(d, s, 'Sources: PC Gamer, Sep 7, 2026 · Fortune, Sep 3 · Epoch AI model database (estimates) · NYISO 2026 Gold Book (Zone J) · arithmetic in notes');

  d.animate(s, clip, { auto: true, effect: 'slam', dur: 450 });
  d.animate(s, [...quiz, ...bt], { auto: true, effect: 'fade', after: 200 });
  d.animate(s, ans, { effect: 'zoom', dur: 400 });
  d.animate(s, [lab1, lab2, ...week], { effect: 'fade', dur: 400 });
  d.animate(s, [...segs.map((name, i) => ({ name, delay: i * 340, dur: i < 3 ? 340 : 230 })), { name: fillT, delay: 1300, dur: 400, effect: 'fade' }], { auto: true, effect: 'wipeLeft', after: 150 });
  d.animate(s, whisk, { effect: 'fade' });
  d.animate(s, [lab3, caveat, ...tgroups.flatMap((g, i) => g.map((name) => ({ name, delay: i * 220 })))], { effect: 'rise' });
  notes(s, {
    min: '2.0',
    build: 'The headline and the guess show automatically. Click 1: the answer (≈ 280×). Click 2: one week of NYC electricity, then GPT-6 Astra fills in. Click 3: the range. Click 4: all four runs on the same yardstick (the three earlier runs plus GPT-6 Astra), with the “not training times” line.',
    say: 'All that compute needs electricity. This PC Gamer headline says 100,000 Nvidia chips trained OpenAI’s newest model, GPT-6 Astra; OpenAI itself told Fortune “more than 100,000 GPUs”. Guess first: how many times more electricity did its training use than GPT-3’s, back in 2020? A: 3 times. B: 30 times. C: 300 times. Hands up! [Count roughly.] [Click.] About 280 times: roughly 1.8 gigawatt-hours for GPT-3 versus about 503 for GPT-6 Astra. These are Epoch AI estimates, because OpenAI has not said. So C was closest. [Click.] How much is 503 gigawatt-hours? Here is one week of all of New York City’s electricity. Astra’s training used as much as the city uses in about four days. [Click.] It is an estimate, so the honest range is about 2 to 7 days, maybe a bit more. [Click.] A training run is one complete training of a model, from start to finish. Here are earlier record runs on the same yardstick: GPT-3, about 19 minutes of the city’s electricity; GPT-4, about 8 hours; Grok 3, about 1.7 days. Careful: these are not training times. Epoch assumes Astra’s training itself took about 90 days.',
    analogy: 'Measure each run in “New York City time”: how long the whole city takes to use the same electricity.',
    ask: 'On the slide (GUESS FIRST): “How many times more electricity than GPT-3’s training (2020)?” Hands up for A (3×), B (30×) or C (300×). Expected: many pick B; the answer is about 280×, closest to C. Follow-up if time: “Who pays for this electricity, and where does it come from?” (open question).',
    takeaway: 'Frontier training runs now use as much electricity as a big city does in days, and the trend is still rising.',
    advanced: 'PC Gamer (Sep 7, 2026) reported that Nvidia’s Jensen Huang said 100,000 Nvidia GPUs were used to train GPT-6 Astra (the headline on the slide). ARITHMETIC (Epoch AI power draw × Epoch training time; NYC = NYISO Zone J, 50,104 GWh in 2025 = 5.72 GWh per hour = 137.3 GWh per day, 961 GWh per week): GPT-3 5.1 MW × 355 h = 1.81 GWh ≈ 19 minutes of NYC; GPT-4 19.9 MW × 2,280 h = 45.5 GWh ≈ 8 hours; Grok 3 110 MW × 2,160 h = 237.5 GWh ≈ 1.7 days; GPT-6 Astra 232.7 MW × 2,160 h (Epoch’s assumed 90 days) = 502.6 GWh ≈ 3.66 days. 502.6 ÷ 1.81 ≈ 280. Range for Astra (our arithmetic): Epoch’s compute interval for Astra is about 5e26 to 2e27 FLOP around its 1e27 central estimate, i.e. 0.5× to 2×; at the same 232.7 MW, that scales 3.66 days to about 1.8 to 7.3 days (this assumes the energy scales with the compute, as a shorter or longer run on the same chips would). FORECAST (moved off the slide; a power figure, not a time): Epoch AI and the Electric Power Research Institute (EPRI) (Aug 11, 2025): training power has grown about 2.2× a year and “the largest individual frontier training runs in 2030 will likely draw 4-16 gigawatts (GW) of power”. It cannot sit in the row of times without an assumed run length, which no source gives for 2030.',
    terms: 'GPU (a chip built for AI math), training run (one full training of a model, start to finish; said in the SAY), GWh (gigawatt-hour: 1 gigawatt for 1 hour, a unit of energy; defined on the previous slide), EPRI (Electric Power Research Institute; notes only).',
    caveats: 'The title says “Est.” because the 3.7 days is an Epoch AI estimate (its assumed 90-day run × its 232.7 MW power estimate); OpenAI has disclosed neither. Say “about 4 days” (range about 2 to 7, the top end a little past 7: our arithmetic gives 1.8 to 7.3, hence the arrow and “7+” on the slide), never “a week”: a week overstates it by about 2×. The days are an amount of electricity, not a duration: the training itself took about 90 days (Epoch’s assumption). All four tiles are Epoch AI estimates, not company disclosures, and cover pretraining only. OpenAI said “more than 100,000 GPUs” (Aidan Clark to Fortune, Sep 3, 2026). The Jensen Huang line comes from PC Gamer’s headline and summary (the article body could not be loaded), so attribute it to PC Gamer’s report (“this PC Gamer headline says”), as the script does. The 90-day duration is Epoch’s assumption. The 2030 line is a forecast.',
    sources: ['https://www.pcgamer.com/software/ai/jensen-huang-says-100-000-nvidia-gpus-were-used-to-train-openais-latest-model-gpt-6-astra-and-theres-already-plans-to-bring-quadruple-that-amount-of-hardware-online/', 'https://fortune.com/2026/09/03/openai-debuts-gpt-6-astra-computer-use-greg-brockman-says-start-of-agi/', 'https://epoch.ai/data/all_ai_models.csv', 'https://epoch.ai/data/ai-models-documentation/estimation', 'https://www.nyiso.com/documents/20142/2226333/2026-Gold-Book-Public.pdf', 'https://epoch.ai/publications/power-demands-of-frontier-ai-training'],
  });
  return s;
}

// PART 1 · 15  How big is a gigawatt? (adapted from economy:gigawattSlide, adult slide 9). Comes BEFORE the
// training-energy slide, so watts, megawatts and gigawatt-hours are explained before they are used.
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
  kicker(s, K(15));
  title(s, 'How big is a gigawatt?');
  // the left column starts 0.1 in inside the margin, so the row-1 card (0.08 in wider on each side) stays inside it
  const lx = MX + 0.1, lw = 6.5, vw = 2.45, ix = lx + vw + 0.25, iw = lx + lw - ix;
  const lab = label(d, s, 'ONE GIGAWATT, RUNNING NONSTOP, IS ROUGHLY…', lx, 1.64, lw, { color: d.S.amber });
  const rowY = [2.12, 3.24, 4.34, 5.46];
  const val = (y, v, l) => [
    d.text(s, v, { x: lx, y, w: vw, h: 0.56, fontSize: 32, bold: true, color: d.S.amber, fontFace: 'Arial', valign: 'bottom' }),
    d.text(s, l, { x: lx, y: y + 0.6, w: vw, h: 0.42, fontSize: 16, color: d.S.muted, valign: 'top' }),
  ];
  const rows = [];
  // GUESS FIRST: the question card sits where row 1 goes; row 1 then appears on an opaque card that covers it
  const qy = 2.04, qh = 1.08;
  const qc = [box(d, s, lx - 0.08, qy, lw + 0.16, qh, { fill: HEX.card2, line: HEX.red, lw: 1.25 })];
  qc.push(...await beatLine(d, s, { text: 'GUESS FIRST', iconName: 'FaQuestionCircle', q: 'How many homes can one gigawatt run?', x: lx + 0.08, y: qy + 0.06, w: lw - 0.1, h: 0.5, qSize: 18 }));
  qc.push(d.text(s, 'A: under 100,000   ·   B: 100,000 to 1 million   ·   C: over 1 million', { x: lx + 0.08, y: qy + 0.6, w: lw - 0.1, h: 0.4, fontSize: 16, color: HEX.amber, valign: 'middle' }));
  {
    const y = rowY[0], sz = 0.46, step = 0.43;
    const r = [box(d, s, lx - 0.08, qy, lw + 0.16, qh, { fill: HEX.card, line: HEX.line })];
    r.push(...val(y, '≈ 850,000', 'average US homes'));
    for (let i = 0; i < 9; i++) {
      if (i === 8) r.push(await iconImg(d, s, 'PiHouseFill', '#4A5160', ix + i * step, y + 0.1, sz)); // faded full house behind the half
      r.push(await iconImg(d, s, 'PiHouseFill', '#F2F3F5', ix + i * step, y + 0.1, sz, i === 8 ? 0.5 : 1));
    }
    r.push(d.text(s, 'each icon = 100,000 homes (the last one is half)', { x: ix, y: y + 0.64, w: iw, h: 0.3, fontSize: 12, color: d.S.steel, valign: 'top' }));
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
    const y = rowY[2];
    const r = val(y, '≈ 2', 'Hoover Dams, on average');
    r.push(await iconImg(d, s, 'GiDam', '#F2F3F5', ix, y + 0.12, 0.7));
    r.push(await iconImg(d, s, 'GiDam', '#F2F3F5', ix + 0.8, y + 0.12, 0.7));
    r.push(d.text(s, 'Hoover Dam: about 480 megawatts (MW) on average, 2,080 MW at full power', { x: ix + 1.65, y: y - 0.02, w: iw - 1.65, h: 1.05, fontSize: 16, color: d.S.muted, valign: 'middle' }));
    rows.push(r);
  }
  {
    // bar 0.5 in tall so the red 0.2 GW segment can carry its unit on a second line
    const y = rowY[3], k = iw / 1.25, by = y + 0.1, bh = 0.5;
    const r = val(y, '1.2 GW', 'one AI campus');
    const one = d.name('bar');
    s.addShape(d.pres.shapes.RECTANGLE, { x: ix, y: by, w: k, h: bh, fill: { color: HEX.amber }, line: { color: HEX.amber, width: 0.75 }, objectName: one });
    const ext = d.name('bar');
    s.addShape(d.pres.shapes.RECTANGLE, { x: ix + k, y: by, w: 0.2 * k, h: bh, fill: { color: HEX.red }, line: { color: HEX.red, width: 0.75 }, objectName: ext });
    r.push(one, ext, d.text(s, '1 GW', { x: ix, y: by, w: k, h: bh, fontSize: 16, bold: true, color: HEX.ink, align: 'center', valign: 'middle' }),
      d.text(s, [{ text: '+0.2', options: { fontSize: 15, breakLine: true } }, { text: 'GW', options: { fontSize: 12 } }], { x: ix + k, y: by, w: 0.2 * k, h: bh, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0, lineSpacingMultiple: 0.9 }));
    r.push(d.text(s, 'Stargate Abilene, Texas: 1.2 GW campus', { x: ix, y: by + bh + 0.06, w: iw, h: 0.32, fontSize: 16, color: HEX.text, valign: 'top' }));
    rows.push(r);
  }
  const rx = 7.62, rw = W - MX - rx;
  const ph = await d.frame(s, D('hoover_crop.jpg'), { x: rx, y: 1.78, w: rw, h: rw / 1.5 }, { border: false });
  const capR = d.name('capbar');
  s.addShape(d.pres.shapes.RECTANGLE, { x: ph.geom.x, y: ph.geom.y + ph.geom.h - 0.46, w: ph.geom.w, h: 0.46, fill: { color: '000000', transparency: 30 }, line: { color: '000000', width: 0, transparency: 100 }, objectName: capR });
  const capT = d.text(s, [{ text: 'Hoover Dam', options: { bold: true } }, { text: '  ·  2,080 MW max  ·  ~480 MW average' }], { x: ph.geom.x + 0.14, y: ph.geom.y + ph.geom.h - 0.46, w: ph.geom.w - 0.2, h: 0.46, fontSize: 16, color: 'FFFFFF', valign: 'middle' });
  const sy = ph.geom.y + ph.geom.h + 0.16;
  const watt = d.text(s, [{ text: 'A watt measures power: ', options: { bold: true, color: HEX.text } }, { text: 'how fast energy is used. A gigawatt (GW) is 1 billion watts; a megawatt (MW) is 1 million. ', options: { color: HEX.muted } }, { text: 'Energy = power × time: ', options: { bold: true, color: HEX.text } }, { text: '1 GW for 1 hour is 1 gigawatt-hour (GWh).', options: { color: HEX.muted } }], { x: rx, y: sy, w: rw, h: 6.52 - sy, fontSize: 16, valign: 'top' });
  src(d, s, 'Sources: EIA · U.S. DOE · U.S. Bureau of Reclamation · Crusoe · Photo: Mariordo / Wikimedia Commons, CC BY-SA 4.0 (cropped)');
  // the unit is defined on screen before the guess: the watt paragraph shows on entry
  d.animate(s, [lab, ...qc, ...ph, capR, capT, watt], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, rows[0], { effect: 'zoom', dur: 450 });
  for (let i = 1; i < 4; i++) d.animate(s, rows[i], { effect: 'rise', dur: 500 });
  notes(s, {
    min: '1.5',
    build: 'The watt definition, the GUESS FIRST question (ranges A/B/C) and the photo show automatically. Click 1: the answer (≈ 850,000 homes) covers the question. Click 2: one reactor. Click 3: two Hoover Dams. Click 4: the 1.2 GW AI campus.',
    say: 'AI training happens in data centers, buildings full of computers, and companies now talk about them in gigawatts. First, the unit, on the right: a watt measures power, how fast energy is used. A gigawatt is a billion watts, and a megawatt is a million. Energy is power times time: one gigawatt for one hour is one gigawatt-hour. Guess first: how many homes can one gigawatt run, nonstop? Hands up for A, under 100,000… B, 100,000 to a million… C, over a million. [Count roughly.] [Click.] About 850,000 average American homes: B. [Click.] It is what one typical nuclear reactor produces, according to the U.S. Department of Energy. [Click.] It is about two Hoover Dams, the dam in the photo, which averages about 480 megawatts. [Click.] And one AI campus, a group of data-center buildings in Texas called Stargate Abilene (Stargate is OpenAI’s big data-center program), is designed for 1.2 gigawatts: more than a reactor, for one site. Next: a training run in gigawatt-hours.',
    analogy: 'Power is like the speed water flows out of a tap; energy is how much water fills the bucket. Power × time = energy.',
    ask: 'On the slide (GUESS FIRST): “How many homes can one gigawatt run?” Hands up for A (under 100,000), B (100,000 to 1 million) or C (over 1 million); count roughly, then click. Answer: B, about 850,000, a whole big city’s worth of homes.',
    takeaway: 'A gigawatt is a lot of power: about 850,000 homes, one nuclear reactor, or two Hoover Dams on average.',
    advanced: 'Homes: EIA says the average US residential customer used 863 kWh per month in 2024 → 10,356 kWh a year → an average draw of about 1.18 kW; 1 GW ÷ 1.18 kW ≈ 846,000. “Homes” is an average: at peak hours (hot afternoons) a gigawatt covers fewer. Hoover Dam: nameplate capacity “about 2,080 megawatts”, average generation about 4.2 billion kWh a year ÷ 8,760 h ≈ 480 MW (U.S. Bureau of Reclamation). Company build-out figures are company statements: Meta says its Hyperion campus “will be able to scale up to 5GW”; Anthropic’s deal with Amazon is for “up to 5 gigawatts (GW) of capacity”.',
    terms: 'watt (a unit of power), gigawatt (GW, 1 billion watts), megawatt (MW, 1 million watts), energy = power × time, gigawatt-hour (GWh: 1 GW for 1 hour), data center (a building full of computers), campus (a group of buildings), Stargate (the name of OpenAI’s large data-center project with its partners; Abilene, Texas is its first site).',
    caveats: 'All equivalences are rounded averages. 1.2 GW is the Abilene campus total (Crusoe), not just chip power. Photo: Hoover Dam aerial, 22 Sep 2017, by Mariordo (Mario Roberto Durán Ortiz), CC BY-SA 4.0, cropped. The ninth house icon is drawn half-filled over a faded outline: 8.5 icons = 850,000 homes. Extra comparison if asked: a gigawatt is about 10 million 100-watt light bulbs (arithmetic: 1,000,000,000 W ÷ 100 W). The EIA and Hoover Dam figures were re-checked against the EIA table and the USBR FAQ on Oct 10, 2026 (recorded in assets/research/splash/manifest.json).',
    sources: ['https://www.eia.gov/electricity/sales_revenue_price/pdf/table_5A.pdf', 'https://www.energy.gov/ne/articles/infographic-how-much-power-does-nuclear-reactor-produce', 'https://www.usbr.gov/lc/hooverdam/faqs/powerfaq.html', 'https://www.crusoe.ai/resources/newsroom/crusoe-announces-flagship-abilene-data-center-is-live', 'https://www.anthropic.com/news/anthropic-amazon-compute', 'https://commons.wikimedia.org/wiki/File:2017_Aerial_view_Hoover_Dam_4771.jpg'],
  });
  return s;
}

// PART 1 · 17  Stargate Abilene (adapted from economy:abileneSlide, adult slide 8) — OPTIONAL
async function abileneSlide(d) {
  const s = d.slide('Content', { transition: 'pushLeft' });
  // no number in the kicker: the slide is optional, so skipping it leaves Part 1 numbered 16 → 17 with no gap
  kicker(s, 'PART 1 · HOW AI LEARNS · OPTIONAL');
  // the 2 (June 2025) is our count from the image, so the title says so; Epoch's text says only that Building 1 was close to finished
  title(s, '2 roofed buildings → 8 in 13 months (our count)');
  const gap = 0.5, iw = (W - 2 * MX - gap) / 2, ih = iw * 720 / 1280, y0 = 1.76;
  const before = await d.frame(s, RE('epoch_sat_stargate_abilene_2025-06.png'), { x: MX, y: y0, w: iw, h: ih }, { border: false });
  const t1 = tag(d, s, 'JUNE 2025', before.geom.x + 0.15, before.geom.y + 0.15, '1D222C');
  const after = await d.frame(s, RE('epoch_sat_stargate_abilene_2026-07.png'), { x: MX + iw + gap, y: y0, w: iw, h: ih }, { border: false });
  const t2 = tag(d, s, 'JULY 2026', after.geom.x + 0.15, after.geom.y + 0.15, HEX.red);
  const arrow = d.name('arrow');
  s.addShape(d.pres.shapes.RIGHT_ARROW, { x: MX + iw + 0.1, y: y0 + ih / 2 - 0.16, w: gap - 0.2, h: 0.32, fill: { color: HEX.red }, line: { color: HEX.red, width: 0 }, objectName: arrow });
  const key = d.text(s, 'Roofed = walls and roof are up; a roofed building may or may not be running yet. Outlines: Epoch AI’s markings of the same 8 buildings.', { x: MX, y: y0 + ih + 0.02, w: W - 2 * MX, h: 0.3, fontSize: 14, color: d.S.muted, italic: true, valign: 'top' });
  const by = y0 + ih + 0.32, cw3 = (W - 2 * MX - 0.6) / 3;
  const st = (x, v, l, color) => [
    d.text(s, v, { x, y: by, w: cw3, h: 0.62, fontSize: 36, bold: true, color, fontFace: 'Arial', valign: 'bottom' }),
    d.text(s, l, { x, y: by + 0.66, w: cw3, h: 0.6, fontSize: 16, color: d.S.muted, valign: 'top' }),
  ];
  // "2 roofed" in June 2025 is our count from the image (the two northern buildings have complete roofs); Epoch's own
  // text for that date says only "Building 1 looks close to finishing construction". "Roofed" for all 8 is Epoch's July 2026 wording.
  const st1 = st(MX, '2 → 8', 'roofed buildings, June 2025 → July 2026 (our count from the images)', HEX.text);
  const st2 = st(MX + cw3 + 0.3, '1.2 GW', 'power for the whole campus, not just the chips', HEX.red);
  const who = d.text(s, [{ text: 'Abilene, Texas. ', options: { bold: true, color: HEX.text } }, { text: 'Built by Crusoe for Oracle and OpenAI, starting June 2024. Epoch AI estimates 4 buildings were running by mid-2026.', options: { color: d.S.muted } }], { x: MX + 2 * (cw3 + 0.3), y: by + 0.05, w: cw3, h: 1.2, fontSize: 16, valign: 'top' });
  src(d, s, 'Satellite imagery © Airbus DS via Epoch AI (annotations by Epoch AI) · Crusoe newsroom, Sep 30, 2025');
  d.animate(s, [...before, ...t1, key], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, [arrow], { effect: 'wipeLeft', dur: 400 });
  d.animate(s, [...after, ...t2], { auto: true, effect: 'fade', dur: 1200 });
  d.animate(s, st1, { auto: true, effect: 'rise', after: 200 });
  d.animate(s, [...st2, who], { effect: 'rise' });
  notes(s, {
    min: '1.0 (OPTIONAL: the planned cut if running late; the saved minute is a buffer, and the next slide keeps its full 2.5 minutes)',
    build: 'June 2025 shows automatically. Click 1: the arrow, then July 2026 and “2 → 8” appear automatically. Click 2: 1.2 GW and who built it.',
    say: 'Here is that Abilene campus from space: same place, same scale, 13 months apart. In June 2025 we count two buildings with roofs, at the top; Epoch AI, the research group from before, said the first was close to finishing. [Click.] By July 2026, all eight had roofs. A roofed building may or may not be running yet: Epoch estimates four were running by then. Each building is designed to hold tens of thousands of AI chips. [Click.] The whole campus is designed for 1.2 gigawatts. Crusoe built it for Oracle and OpenAI, as part of Stargate, OpenAI’s big data-center program.',
    ask: 'OPTIONAL, only if there is time (it is not on the slide): “What would your town need to supply a building like this?” Expected: electricity, water for cooling, land, workers, roads.',
    takeaway: 'AI training happens in real buildings that take land, power and time to build, and they are going up fast.',
    advanced: 'Epoch AI estimates for the site (Oct 2026): about 421 MW of IT (chip and server) power today, projected 843 MW by late 2026. 1.2 GW is total campus power; IT power is lower, so don’t confuse them. Chips per building: Epoch AI writes that 3 months was “enough time to ram to 50,000 GB200s in Building 1”. (Crusoe’s report says each building is designed for “up to 50,000 NVIDIA GB200 NVL72s”, but an NVL72 is a 72-GPU rack, so read literally that would be 3.6 million GPUs; read it as about 50,000 GPUs per building, as Epoch does.)',
    terms: 'data center (a building full of computers), campus (a group of buildings), roofed (walls and roof up; it may or may not be running yet; on the slide), Stargate (the name of OpenAI’s large data-center project with its partners; Abilene, Texas is its first site).',
    caveats: 'Imagery © Airbus DS via Epoch AI; the outlines are Epoch AI’s annotations (its page gives no color legend, so the slide does not explain the colors). “2 roofed” in June 2025 is our own count from the image (the two northern buildings show complete roofs); Epoch’s text for that date says only “Building 1 looks close to finishing construction”. The rest follows Epoch’s timeline: Sep 26, 2025 Building 1 fully operational; Dec 24, 2025 Building 2; May 23, 2026 Buildings 3 and 4 “estimated to be operational”; Jul 28, 2026 “Buildings 5-8 are structurally complete and roofed but not yet confirmed operational (fit-out ongoing)”; Buildings 5–8 projected operational Nov 1, 2026. So say “roofed”, not “finished” or “done”: in July 2026 four of the eight roofed buildings were running (an Epoch estimate). Say “we count two”, not “two were done”, for June 2025. The script dropped the line that Epoch expects this site to host OpenAI’s largest compute cluster (kept here if asked). Epoch’s page says Abilene is “expected to host OpenAI’s largest compute cluster”; it does not mention any model, and OpenAI itself says only “our Stargate site in Texas”, so do not tie a particular model to this site. VIDEO (link only, not on the slide; 42 minutes, too long for class): Bloomberg Originals, “Inside OpenAI’s Stargate Megafactory with Sam Altman | The Circuit”, https://www.youtube.com/watch?v=GhIJs4zbH0o',
    sources: ['https://epoch.ai/data/ai-data-centers/directory/openai-stargate-abilene (timeline, loaded Oct 10, 2026)', 'https://www.crusoe.ai/resources/newsroom/crusoe-announces-flagship-abilene-data-center-is-live', 'https://cdn.prod.website-files.com/6855c1aa175582ee23e0aa19/68710273a71bb7c11049ba28_Crusoe_Impact_Report_2024.pdf#page=19 (50,000 GB200 NVL72s per building)'],
  });
  return s;
}

// PART 1 · 18  Grown, not built
async function grownSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(17));
  title(s, 'Nobody typed in the rules: it was grown');
  const lw = 5.75;
  // pull quote (verbatim fragment of the essay; the key words in amber)
  // the card hugs the two-line quote and its attribution (no dead space); the body below lines up with the right
  // column's “Real progress” line at y 4.05
  const pq = [d.card(s, { x: MX, y: 1.8, w: lw, h: 2.1 }, { color: HEX.card })];
  pq.push(await ic(d, s, 'FaQuoteLeft', HEX.amber, MX + 0.22, 1.95, 0.42));
  pq.push(d.text(s, [
    { text: '…generative AI systems are ', options: { color: HEX.text } },
    { text: 'grown more than they are built', options: { color: HEX.amber } },
    { text: '…', options: { color: HEX.text } },
  ], { x: MX + 0.3, y: 2.36, w: lw - 0.5, h: 0.86, fontSize: 24, bold: true, fontFace: 'Arial', valign: 'top' }));
  pq.push(d.text(s, 'Dario Amodei (CEO of Anthropic), quoting co-founder Chris Olah · “The Urgency of Interpretability”, April 2025', { x: MX + 0.3, y: 3.28, w: lw - 0.5, h: 0.5, fontSize: 14, color: d.S.steel, italic: true, valign: 'top' }));
  const body = d.text(s, [
    { text: 'Engineers choose the data, the method and the compute. ', options: { bold: true, color: HEX.text } },
    { text: 'Nobody writes the individual rules. They sit in billions of learned dials, so even the makers can’t fully explain one answer.', options: { color: HEX.muted } },
  ], { x: MX, y: 4.05, w: lw, h: 1.08, fontSize: 16, valign: 'top' });

  const rx = 6.75, rw = W - MX - rx;
  const il = label(d, s, 'INTERPRETABILITY = RESEARCH THAT READS INSIDE MODELS', rx, 1.7, rw, { color: d.S.amber });
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
  const by = 5.4; // the shorter quote card lifts the columns, so the bar moves up to keep even gaps
  const bar = [box(d, s, MX, by, W - 2 * MX, 0.75, { fill: HEX.card2, line: HEX.red, lw: 1.25 })];
  bar.push(...await beatLine(d, s, { text: 'TURN TO A NEIGHBOR', iconName: 'FaComments', q: 'If you can’t read a model’s rules, how would you check that it’s safe? (45 seconds)', x: MX + 0.15, y: by, w: W - 2 * MX - 0.3, h: 0.75, qSize: 18 }));
  src(d, s, 'Sources: D. Amodei, “The Urgency of Interpretability” (Apr 2025) · Anthropic, “Golden Gate Claude” (May 23, 2024) · Bricken et al., “Towards Monosemanticity” (Oct 4, 2023)');
  d.animate(s, pq, { auto: true, effect: 'fade' });
  d.animate(s, [body], { effect: 'fade' });
  d.animate(s, [il, ...gg, ggT], { effect: 'fade' });
  d.animate(s, [prog], { effect: 'fade' });
  d.animate(s, bar, { effect: 'zoom', dur: 400 });
  notes(s, {
    min: '2.5',
    build: 'The pull quote shows automatically. Click 1: the explanation. Click 2: Golden Gate Claude. Click 3: progress so far. Click 4: turn to a neighbor.',
    say: 'Here is the most important idea of Part 1. Anthropic’s CEO, the head of the company, quoting his co-founder, says generative AI systems, the kind that create new text or images, are “grown more than they are built.” [Click.] Engineers choose the data, the method and the compute, like a gardener choosing soil, water and light. But nobody writes the individual rules. They end up spread across billions of learned dials, so even the makers cannot fully explain one particular answer. [Click.] A research field called interpretability tries to read inside models. It looks for features: a feature is one idea inside the network that lights up when the model meets that idea. In 2024 Anthropic found a “Golden Gate Bridge” feature in Claude; turned way up, Claude brought up the bridge in most answers. [Click.] Real progress, but far from complete, and experts disagree about how close we are. [Click.] Turn to a neighbor, 45 seconds: if you can’t read a model’s rules, how would you check that it is safe? [After 45 s, take two answers.]',
    analogy: 'A gardener chooses the soil, water and light, but does not decide where each leaf grows. The plant grows its own shape.',
    ask: 'On the slide (TURN TO A NEIGHBOR, 45 seconds, then take two answers): “If you can’t read a model’s rules, how would you check that it’s safe?” Good answers: test it a lot (including tricky tests: red-teaming), watch what it does after release, read inside it (interpretability), compare it with other models, limit what it can do. (The callback to the opening poll is now on the next slide.)',
    takeaway: 'Modern AI is grown, not hand-written, so even its makers can’t fully read it yet; interpretability research is working on that.',
    advanced: 'Amodei, verbatim: “As my friend and co-founder Chris Olah is fond of saying, generative AI systems are grown more than they are built—their internal mechanisms are ‘emergent’ rather than directly designed.” He also writes: “People outside the field are often surprised and alarmed to learn that we do not understand how our own AI creations work.” and sets a goal that “interpretability can reliably detect most model problems” by 2027. Anthropic on features: “we found millions of concepts that activate when the model reads relevant text or sees relevant images, which we call ‘features’.” Towards Monosemanticity (Oct 4, 2023): “Using a sparse autoencoder, we extract a large number of interpretable features from a one-layer transformer.” In 2025 Anthropic also found Claude plans rhymes ahead (it picks “rabbit” before writing the line); their method “only captures a fraction of the total computation”.',
    terms: 'interpretability, feature (one concept inside the network that lights up when the model reads or sees something about it), generative AI (AI that creates new text, images or other content; chatbots are one kind), CEO (the head of a company).',
    caveats: 'This is an open research problem with many people working on it; experts disagree about how close we are. Golden Gate Claude was a 24-hour research demo (May 2024) and is no longer available (Part 4 refers back to it). The pull quote is a verbatim fragment of the essay sentence (full sentence in the advanced note); the amber words are our emphasis. The essay page shows only “April 2025” (TechCrunch dates it Apr 24, 2025). Anthropic is a company describing its own research. TIMING: if running late, skip the optional Abilene slide before this one; its minute is a buffer, and this slide keeps its full 2.5 minutes.',
    sources: ['https://www.darioamodei.com/post/the-urgency-of-interpretability', 'https://www.anthropic.com/news/golden-gate-claude', 'https://transformer-circuits.pub/2024/scaling-monosemanticity/', 'https://transformer-circuits.pub/2023/monosemantic-features', 'https://www.anthropic.com/research/tracing-thoughts-language-model'],
  });
  return s;
}

// PART 1 · 19  Recap
async function recapSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(18));
  title(s, 'Five things to carry into Part 2');
  const items = [
    ['FaChalkboardTeacher', 'Machine learning means learning from examples, not hand-typed rules.'],
    ['FaSlidersH', 'Neural networks are huge stacks of dials, nudged to do better after each mistake.'],
    ['FaComments', 'LLMs predict the next token. Pretraining makes a base model; post-training makes an assistant.'],
    ['FaChartLine', 'More data, compute and better methods bring steady gains, and bigger power needs.'],
    ['FaSeedling', 'We grew these systems, and we can’t yet fully read them.'],
  ];
  const groups = [];
  for (let i = 0; i < items.length; i++) {
    const y = 1.82 + i * 0.86, last = i === 4;
    const g = [box(d, s, MX, y, W - 2 * MX, 0.74, { fill: last ? TINT.red : HEX.card, line: last ? HEX.red : HEX.line })];
    g.push(...numDisc(d, s, i + 1, MX + 0.45, y + 0.37, 0.52, last ? HEX.red : HEX.card2, { color: HEX.text, fontSize: 18 }));
    g.push(await ic(d, s, items[i][0], last ? HEX.red : HEX.amber, MX + 0.95, y + 0.17, 0.4));
    g.push(d.text(s, items[i][1], { x: MX + 1.55, y, w: W - 2 * MX - 1.7, h: 0.74, fontSize: 19, color: HEX.text, valign: 'middle' }));
    groups.push(g);
  }
  const next = await beatLine(d, s, { text: 'HANDS UP', iconName: 'FaHandPaper', q: 'Back to question 2: does it understand what it says? What would count as evidence?', x: MX, y: 6.08, w: W - 2 * MX, h: 0.44, qSize: 18 });
  groups.forEach((g, i) => d.animate(s, g, { auto: i === 0, effect: 'rise', after: 100 }));
  d.animate(s, next, { effect: 'fade' });
  notes(s, {
    min: '1.5',
    build: 'Point 1 shows automatically; each click adds the next point. Last click: the callback question.',
    say: 'Five things to carry with you. One: machine learning means learning from examples, not hand-typed rules. [Click.] Two: neural networks are huge stacks of dials. Backpropagation works out how much each dial should change, and gradient descent does the nudging. [Click.] Three: LLMs predict the next token; pretraining makes a base model, and post-training turns it into an assistant. [Click.] Four: more data, more compute and better methods bring steady gains, and bigger power needs. [Click.] Five, the big one: we grew these systems, and we can’t yet fully read them. [Click.] Back to question 2 from the opening poll: hands up if you think it understands what it says. [Look around; hands down.] What would count as evidence? [Take one answer, about 30 seconds.] Experts still disagree. Now, Part 2: how fast is all of this moving?',
    ask: 'On the slide (callback to question 2 of the opening poll): “Does it understand what it says? What would count as evidence?” Repeat the hands-up (up, then down), then take one answer (about 30 seconds; skip the answer if time is short). Good answers: explaining in its own words, handling questions it never saw, admitting when it doesn’t know. Experts still disagree. If nobody answers: “Which of these five surprised you most?”',
    takeaway: 'How AI learns, in five lines: examples, dials, next-token prediction, scale, and “grown, not built”.',
    terms: 'none new (recap).',
    caveats: 'No new facts on this slide; each point repeats a sourced slide above.',
    sources: ['See the five slides recapped: Machine learning, A neural network is a stack of dials, Backpropagation, Pretraining and Post-training, Scaling laws, and Nobody typed in the rules (their notes hold the URLs).'],
  });
  return s;
}

// =====================================================================================
const slides = {
  titleSlide, hookSlide, roadmapSlide, mlSlide, learningTypesSlide, quizSlide, networkSlide, gradientSlide, backpropSlide,
  nextWordSlide, pretrainSlide, baseModelSlide, postTrainSlide, rewardsSlide, pipelineSlide, ingredientsSlide, scalingSlide,
  gigawattSlide, trainingEnergySlide, abileneSlide, grownSlide, recapSlide,
};

async function build(d) {
  await prep();
  CLOCK = 0;
  for (const f of Object.values(slides)) await f(d);
}

module.exports = { build, slides };
