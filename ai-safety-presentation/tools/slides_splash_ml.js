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
  // CIFAR-10 sample table: six labelled rows x six images
  'cifar_rows.png': [R('cifar10-labelled-grid.png'), { left: 0, top: 0, width: 640, height: 436 }],
  // one CIFAR-10 "cat" image, used as the network's input
  'cifar_cat.png': [R('cifar10-labelled-grid.png'), { left: 286, top: 224, width: 64, height: 64 }, 384],
  // hide-and-seek Fig. 1, panels (a) and (b) with their titles
  'hideseek_ab.png': [R('hide-seek-fig1-six-stages.png'), { left: 40, top: 0, width: 1060, height: 575 }],
  // MAE Fig. 2: one column of three triplets (masked | reconstruction | original)
  'mae_column.png': [R('selfsup-mae-masked-reconstruction-fig2.png'), { left: 1046, top: 12, width: 500, height: 528 }],
  // DeepSeek-R1 Table 3: the "Wait, wait. Wait." lines
  'r1_aha.png': [R('r1-aha-moment-table3.png'), { left: 222, top: 412, width: 1160, height: 136 }],
  // Golden Gate Claude announcement: label, headline, date and the top of the page art
  'ggc_head.png': [R('golden-gate-claude-announcement.png'), { left: 400, top: 150, width: 1760, height: 1000 }],
  // Amodei essay: the "grown more than they are built" passage
  'amodei_grown.png': [R('inside-grown-essay-passage.png'), { left: 0, top: 575, width: 1160, height: 450 }],
  // Kaplan et al. 2020 Fig. 1, left panel (test loss vs compute)
  'kaplan_compute.png': [R('kaplan-fig1.png'), { left: 0, top: 0, width: 432, height: 380 }],
};

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
// Interactive-beat marker, top right (beside the kicker): amber pill with an icon.
async function beat(d, s, text = 'HANDS UP', iconName = 'FaHandPaper') {
  const w = 0.7 + text.length * 0.118, x = W - MX - w, y = 0.32, h = 0.42;
  const r = box(d, s, x, y, w, h, { fill: HEX.amber, line: HEX.amber, radius: 0.2 });
  const i = await ic(d, s, iconName, '#15171C', x + 0.15, y + 0.08, 0.26);
  const t = d.text(s, text, { x: x + 0.5, y, w: w - 0.56, h, fontSize: 13, bold: true, color: HEX.ink, valign: 'middle', charSpacing: 2 });
  return [r, i, t];
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
// Speaker notes in a fixed, scannable order.
function notes(s, o) {
  const p = [];
  p.push(`TIME: ${o.min} min${o.clock ? `  (class minute ${o.clock})` : ''}`);
  if (o.build) p.push('CLICKS: ' + o.build);
  if (o.say) p.push('SAY: ' + o.say);
  if (o.analogy) p.push('ANALOGY: ' + o.analogy);
  if (o.ask) p.push('ASK THE CLASS: ' + o.ask);
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
  d.animate(s, [k], { auto: true, dur: 1200 });
  d.animate(s, [f], { auto: true, after: 300, dur: 800 });
  notes(s, {
    min: '0.5', clock: '0–0.5',
    say: 'Welcome! I’m William, and this is AI Alignment and Safety. We have 110 minutes in four parts: first how today’s AI actually learns (about 36 minutes), then how fast it is improving, then why it could go wrong, and finally what people are doing about it, with time for your questions at the end. How we play: when I ask a question, you answer with your hands (or by standing up). No phones or laptops needed. Sometimes I’ll say “turn to a neighbour” for 30 seconds. Disagreement is welcome. Experts disagree about a lot of this, and I will tell you when they do. Every number on these slides comes from a named source; the links are in these notes.',
    terms: 'none yet.',
  });
  return s;
}

// OPENING · 2  Hook poll
async function hookSlide(d) {
  const s = d.slide('Content');
  kicker(s, 'OPENING · HOOK');
  title(s, 'Hands up: who has used an AI this week?');
  const bt = await beat(d, s, 'HANDS UP');
  const q = async (y, n, text) => {
    const g = [box(d, s, MX, y, 7.4, 1.65, { fill: HEX.card, line: HEX.line })];
    g.push(...await iconDisc(d, s, 'FaHandPaper', MX + 0.72, y + 0.82, 1.0, HEX.amber, TINT.amber));
    g.push(d.text(s, [
      { text: `QUESTION ${n}`, options: { fontSize: 13, bold: true, color: HEX.amber, charSpacing: 2, breakLine: true, paraSpaceAfter: 4 } },
      { text, options: { fontSize: 24, bold: true, color: HEX.text, fontFace: 'Arial' } },
    ], { x: MX + 1.5, y: y + 0.1, w: 5.75, h: 1.45, valign: 'middle' }));
    return g;
  };
  const q1 = await q(1.85, 1, 'Hands up if you used an AI chatbot or an AI picture tool this week.');
  const q2 = await q(3.75, 2, 'Keep your hand up if you think it understands what it says.');
  const bottom = d.text(s, [
    { text: 'No wrong answers. ', options: { bold: true, color: HEX.text } },
    { text: 'Experts disagree about question 2. By the end of Part 1 you will have tools to judge it yourself.', options: { color: HEX.muted } },
  ], { x: MX, y: 5.68, w: 7.4, h: 0.8, fontSize: 18, valign: 'top' });

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
  d.animate(s, [...rc, ...q1], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, bt, { auto: true, effect: 'zoom', after: 200, dur: 400 });
  d.animate(s, q2, { effect: 'rise' });
  d.animate(s, [bottom], { effect: 'fade' });
  notes(s, {
    min: '2.0', clock: '0.5–2.5',
    build: 'Question 1 and the right-hand list show automatically. Click 1: question 2. Click 2: the “no wrong answers” line.',
    say: 'First, a quick poll. Hands up if you used an AI chatbot or an AI picture tool this week. [Look around and say roughly what you see: “about half of you”, “most of you”. Do not invent a number.] An “AI tool” is broader than you might think: chatbots, autocorrect on your phone, the photo filter that finds your face, the app that picks your next video. [Click.] Now, keep your hand up if you think it actually understands what it says. [Look around; do not judge any answer.] Interesting! I am not going to tell you the answer, because experts genuinely disagree about this one. Some think these systems understand in a real sense; others think they are very good at predicting text and nothing more. In the next 36 minutes you will learn how they are built, so you can judge for yourself. We will come back to this question at the end of Part 1.',
    ask: '(1) Used an AI chatbot or picture tool this week? (2) Do you think it understands what it says? Expected: many hands on (1), a split on (2). Both are fine.',
    terms: 'AI tool (any program that does something we would call smart: chatbots, autocorrect, photo filters, recommendations).',
    caveats: 'Reveal nothing yet. The callback is the last part-1 beat (“Nobody typed in the rules: it was grown”): “What would count as evidence that it understands?”',
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
    ['FaExclamationTriangle', 'PART 3', 'Why it could go wrong', '30 minutes', 'Goals, loopholes, and keeping control'],
    ['FaHandsHelping', 'PART 4', 'What we can do', '20 minutes (8 for Q&A)', 'Research, rules, and roles you could play'],
  ];
  const cw = (W - 2 * MX - 3 * 0.25) / 4, y = 1.82, h = 4.0, groups = [];
  for (let i = 0; i < 4; i++) {
    const x = MX + i * (cw + 0.25), now = i === 0;
    const g = [box(d, s, x, y, cw, h, { fill: now ? TINT.red : HEX.card, line: now ? HEX.red : HEX.line, lw: now ? 1.5 : 0.75 })];
    g.push(...await iconDisc(d, s, parts[i][0], x + 0.75, y + 0.72, 0.95, now ? HEX.red : HEX.steel, now ? '3A1416' : HEX.card2));
    if (now) g.push(...chip(d, s, 'NOW', x + cw - 1.05, y + 0.3, 0.8, HEX.red, { fontSize: 13 }));
    g.push(d.text(s, parts[i][1], { x: x + 0.3, y: y + 1.32, w: cw - 0.5, h: 0.3, fontSize: 13, bold: true, color: now ? d.S.red : d.S.steel, charSpacing: 3 }));
    g.push(d.text(s, parts[i][2], { x: x + 0.3, y: y + 1.62, w: cw - 0.45, h: 0.82, fontSize: 22, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'top' }));
    g.push(d.text(s, parts[i][3], { x: x + 0.3, y: y + 2.47, w: cw - 0.45, h: 0.36, fontSize: 16, bold: true, color: now ? HEX.red : HEX.amber, valign: 'top' }));
    g.push(d.text(s, parts[i][4], { x: x + 0.3, y: y + 2.88, w: cw - 0.45, h: 1.05, fontSize: 16, color: HEX.muted, valign: 'top' }));
    groups.push(g);
  }
  const bottom = d.text(s, [
    { text: 'Not doom: ', options: { bold: true, color: HEX.text } },
    { text: 'these are serious, unsolved problems, and many people are working on them.', options: { color: HEX.muted } },
  ], { x: MX, y: 5.98, w: W - 2 * MX, h: 0.5, fontSize: 18, valign: 'middle' });
  groups.forEach((g, i) => d.animate(s, g, { auto: true, effect: 'rise', after: i ? 120 : 200 }));
  d.animate(s, [bottom], { effect: 'fade' });
  notes(s, {
    min: '1.5', clock: '2.5–4',
    build: 'The four cards rise in automatically. Click: the bottom line.',
    say: 'Here is the plan. Part 1, right now: how AI learns. You will see what a neural network is, how a chatbot is trained, and the recipe the big labs use. Part 2: how fast it is moving, with real measurements. Part 3: why it could go wrong. That is the theory of keeping AI aligned with human goals and under human control, and the evidence so far. Part 4: what people are doing about it, and what you could do. [Click.] One promise: this is not a doom talk. These are serious, unsolved problems, and serious problems need people. Many people are working on them, and some of you might be one day.',
    caveats: 'Part names for 2–4 follow the other part planners (“How fast is AI moving?”, “Why it could go wrong”, “What we can do”); rename here if the lead changes them. Minutes: opening 4 + Part 1 36 + Part 2 20 + Part 3 30 + Part 4 20 (12 content + 8 Q&A) = 110.',
  });
  return s;
}

// =====================================================================================
// PART 1 · 1  Machine learning
async function mlSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(1));
  title(s, 'Machine learning: the computer finds the rules');
  const bw = (7.6 - 2 * 0.45) / 3, bh = 1.45;
  const row = async (y, lab, color, items, hot) => {
    const g = [label(d, s, lab, MX, y, 7.6, { color })];
    for (let i = 0; i < 3; i++) {
      const x = MX + i * (bw + 0.45), by = y + 0.32;
      g.push(box(d, s, x, by, bw, bh, { fill: hot ? TINT.red : HEX.card, line: hot ? HEX.red : HEX.line, lw: hot ? 1.25 : 0.75 }));
      g.push(await ic(d, s, items[i][0], hot ? HEX.red : HEX.muted, x + 0.18, by + 0.16, 0.42));
      g.push(d.text(s, items[i][1], { x: x + 0.18, y: by + 0.64, w: bw - 0.3, h: 0.76, fontSize: 16, color: HEX.text, valign: 'top' }));
      if (i < 2) g.push(seg(d, s, x + bw + 0.06, by + bh / 2, x + bw + 0.39, by + bh / 2, { color: hot ? HEX.red : HEX.steel, width: 2, arrow: true }));
    }
    return g;
  };
  const rowA = await row(1.7, 'CLASSIC SOFTWARE', d.S.steel, [['FaUserEdit', 'A person writes the rules'], ['FaCogs', 'The computer follows them exactly'], ['FaCheckCircle', 'Answers']], false);
  const rowB = await row(3.6, 'MACHINE LEARNING', d.S.red, [['FaImages', 'Examples with the right answers'], ['FaSyncAlt', 'Guesses, gets a score, adjusts itself'], ['FaLightbulb', 'Rules it found by itself']], true);
  // spam-filter example
  const sy = 5.55;
  const spam = [d.card(s, { x: MX, y: sy, w: 7.6, h: 0.9 })];
  spam.push(await ic(d, s, 'FaEnvelope', HEX.amber, MX + 0.2, sy + 0.22, 0.46));
  spam.push(d.text(s, [
    { text: 'Example: a spam filter. ', options: { bold: true, color: HEX.amber } },
    { text: 'People marked emails “spam” or “not spam”; the filter learned the clues itself. Nobody typed in the rules.', options: { color: HEX.text } },
  ], { x: MX + 0.85, y: sy + 0.05, w: 6.6, h: 0.8, fontSize: 16, valign: 'middle' }));

  // right: nested umbrella AI ⊃ ML ⊃ DL
  const rx = 8.6, rw = W - MX - rx;
  const nest = [];
  nest.push([box(d, s, rx, 1.85, rw, 4.6, { fill: HEX.card, line: HEX.steel, lw: 1 }),
    d.text(s, [
      { text: 'ARTIFICIAL INTELLIGENCE (AI)', options: { bold: true, color: HEX.text, fontSize: 15, charSpacing: 1, breakLine: true, paraSpaceAfter: 2 } },
      { text: 'The big umbrella: computers doing things we would call smart', options: { color: HEX.muted, fontSize: 16 } },
    ], { x: rx + 0.22, y: 1.95, w: rw - 0.4, h: 0.95, valign: 'top' })]);
  nest.push([box(d, s, rx + 0.25, 3.0, rw - 0.5, 3.25, { fill: TINT.amber, line: HEX.amber, lw: 1 }),
    d.text(s, [
      { text: 'MACHINE LEARNING', options: { bold: true, color: HEX.amber, fontSize: 15, charSpacing: 1, breakLine: true, paraSpaceAfter: 2 } },
      { text: 'Learns from examples (this slide)', options: { color: HEX.muted, fontSize: 16 } },
    ], { x: rx + 0.45, y: 3.1, w: rw - 0.85, h: 0.85, valign: 'top' })]);
  nest.push([box(d, s, rx + 0.5, 4.15, rw - 1.0, 1.85, { fill: TINT.red, line: HEX.red, lw: 1.25 }),
    d.text(s, [
      { text: 'DEEP LEARNING', options: { bold: true, color: HEX.red, fontSize: 15, charSpacing: 1, breakLine: true, paraSpaceAfter: 2 } },
      { text: 'Machine learning with many layers of “neurons” (coming up)', options: { color: HEX.text, fontSize: 16 } },
    ], { x: rx + 0.7, y: 4.25, w: rw - 1.4, h: 1.65, valign: 'top' })]);

  d.animate(s, rowA, { auto: true, effect: 'fade' });
  d.animate(s, rowB, { effect: 'wipeLeft', dur: 700 });
  d.animate(s, spam, { effect: 'rise' });
  d.animate(s, nest.flat().map((name, i) => ({ name, delay: Math.floor(i / 2) * 300 })), { effect: 'zoom', dur: 400 });
  notes(s, {
    min: '1.5', clock: '4–5.5',
    build: 'Row 1 shows automatically. Click 1: the machine-learning row. Click 2: the spam example. Click 3: the nested boxes.',
    say: 'Normal software follows rules a person wrote: “if the email contains this word, put it in the spam folder.” [Click.] Machine learning flips that around. We give the program examples with the right answers, plus a score for how well it did. It guesses, gets scored, and adjusts itself, over and over, until it finds rules that work. Nobody typed those rules in. [Click.] A spam filter is a classic example: people marked emails “spam” or “not spam”, and the filter worked out the clues by itself. [Click.] Three words you will hear: AI is the big umbrella, any computer doing things we would call smart. Machine learning is the part of AI that learns from examples. Deep learning is machine learning with many layers, and we will see what those layers are in a few minutes. Today’s chatbots are deep learning.',
    analogy: 'Classic software is a recipe someone wrote down. Machine learning is a cook who tastes, gets told “too salty”, and adjusts until it is right.',
    ask: '“Can you think of something you could not easily write rules for?” Expected: recognising a face, a friend’s handwriting, telling a joke, spotting a cat in a photo.',
    terms: 'machine learning, AI, deep learning, score (how well an answer did).',
    caveats: 'People use “AI” loosely; here it means the whole field. No numbers on this slide.',
  });
  return s;
}

// PART 1 · 2  Three ways to learn (+ self-supervised)
async function learningTypesSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  kicker(s, K(2));
  title(s, 'Three ways a machine can learn');
  const cw = (W - 2 * MX - 3 * 0.25) / 4, y = 1.8, h = 4.68;
  const cols = [
    { tag: 'SUPERVISED', color: HEX.blue, tint: TINT.blue, img: D('cifar_rows.png'), an: 'Flashcards with the answers on the back', de: 'Every example comes with the right answer (a label).', fb: 'labels people wrote' },
    { tag: 'UNSUPERVISED', color: HEX.teal, tint: TINT.teal, img: R('clustering-kmeans-convergence.gif'), an: 'A big pile with no labels', de: 'The program finds groups on its own.', fb: 'patterns in the data' },
    { tag: 'REINFORCEMENT', color: HEX.amber, tint: TINT.amber, img: D('hideseek_ab.png'), an: 'Trial, error and points', de: 'Like training a pet with treats. A reward is points for a good result.', fb: 'a reward (points)' },
    { tag: 'SELF-SUPERVISED', color: HEX.red, tint: TINT.red, img: D('mae_column.png'), an: 'The data hides its own answer', de: 'Hide a piece, guess it, then check. Chatbots learn this way.', fb: 'the hidden piece itself' },
  ];
  const groups = [];
  for (let i = 0; i < 4; i++) {
    const c = cols[i], x = MX + i * (cw + 0.25);
    const g = [box(d, s, x, y, cw, h, { fill: i === 3 ? c.tint : HEX.card, line: i === 3 ? c.color : HEX.line, lw: i === 3 ? 1.25 : 0.75, dash: i === 3 ? 'dash' : undefined })];
    g.push(...chip(d, s, c.tag, x + 0.15, y + 0.15, cw - 0.3, c.color, { fontSize: 14, color: c.color === HEX.amber ? HEX.ink : 'FFFFFF', charSpacing: 2 }));
    g.push(...await d.frame(s, c.img, { x: x + 0.12, y: y + 0.62, w: cw - 0.24, h: 1.66 }, { pad: 0.04 }));
    g.push(d.text(s, c.an, { x: x + 0.18, y: y + 2.38, w: cw - 0.3, h: 0.62, fontSize: 17, bold: true, color: HEX.text, valign: 'top' }));
    g.push(d.text(s, c.de, { x: x + 0.18, y: y + 3.0, w: cw - 0.3, h: 0.86, fontSize: 16, color: HEX.muted, valign: 'top' }));
    g.push(d.text(s, [
      { text: 'FEEDBACK COMES FROM', options: { fontSize: 12, bold: true, color: HEX.steel, charSpacing: 1, breakLine: true } },
      { text: c.fb, options: { fontSize: 16, bold: true, color: c.color } },
    ], { x: x + 0.18, y: y + 3.98, w: cw - 0.3, h: 0.6, valign: 'top' }));
    groups.push(g);
  }
  src(d, s, 'Images: CIFAR-10 (A. Krizhevsky) · k-means GIF: Chire, Wikimedia Commons, CC BY-SA 4.0 · Baker et al. 2019 (OpenAI) · He et al. 2021 (MAE)');
  d.animate(s, groups[0], { auto: true, effect: 'rise' });
  for (let i = 1; i < 4; i++) d.animate(s, groups[i], { effect: 'rise' });
  notes(s, {
    min: '2.0', clock: '5.5–7.5',
    build: 'Supervised shows automatically; each click adds the next column.',
    say: 'There are three classic ways a machine can learn, and they differ in where the feedback comes from. SUPERVISED: like flashcards with the answers on the back. These are real pictures from a famous dataset called CIFAR-10: 60,000 small photos, each with a label like “cat” or “truck”. [Click.] UNSUPERVISED: a big pile with no labels at all. The program finds groups by itself. In this animation nobody told it which dot belongs where; it sorts them into three groups. [Click.] REINFORCEMENT: trial, error and points, like training a pet with treats. A reward is just points for a good result. In OpenAI’s hide-and-seek game, the hiders got +1 point when all of them were hidden and −1 when one was seen, and over millions of games they learned to build forts. [Click.] And a fourth way, SELF-SUPERVISED: the data hides its own answer. Here a program saw a photo with most of it blanked out, guessed the missing parts, and then checked against the real photo. Nobody had to label anything. This is how chatbots learn: hide a word, guess it, check.',
    analogy: 'Supervised = flashcards. Unsupervised = sorting a pile of mixed-up socks without being told the pairs. Reinforcement = a pet learning tricks for treats. Self-supervised = a fill-in-the-blank quiz you can make from any book.',
    ask: '“Which one do you use when you study with flashcards?” Expected: supervised.',
    advanced: 'Many people lump self-supervised learning under unsupervised, and experts argue about the names; what matters is where the feedback comes from. Yann LeCun’s famous “cake” (2016, renamed 2019): self-supervised learning is the cake (millions of bits of feedback per example), supervised learning the icing, reinforcement learning the cherry (a few bits). AlphaGo (2016) used both supervised learning from expert games and reinforcement learning from self-play.',
    terms: 'supervised learning, label, unsupervised learning, reinforcement learning, reward, self-supervised learning.',
    caveats: 'The hide-and-seek reward (+1 all hidden / −1 if seen) and the CIFAR-10 size are from the sources below. The k-means GIF animates in PowerPoint; a PDF shows its first frame. Credit: Chire, CC BY-SA 4.0.',
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
  const ins = label(d, s, 'SHOW YOUR FINGERS (OR STAND IN THAT CORNER) FOR EACH MADE-UP SCENARIO', MX, 2.36, W - 2 * MX, { color: d.S.amber });
  const sc = [
    ['A', 'A program practises with flashcards and checks each guess against an answer key.', 0, 'SUPERVISED: the answer key = labels'],
    ['B', 'A program sorts thousands of unlabelled photos into groups.', 1, 'UNSUPERVISED: no labels, it finds groups'],
    ['C', 'A game bot earns points for winning and changes its moves.', 2, 'REINFORCEMENT: points = the reward'],
    ['D', 'A program hides one word in a sentence and learns to guess it from the words around it.', 3, 'SELF-SUPERVISED: the hidden word = key'],
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
    min: '2.0', clock: '7.5–9.5 (beat at about minute 8)',
    build: 'Scenarios show automatically. Clicks 1–4 reveal the answers for A, B, C, D one at a time. Count the fingers BEFORE each click.',
    say: 'Quiz time. For each made-up scenario, show me with fingers: one finger supervised, two unsupervised, three reinforcement, four self-supervised. (Or, if there is room, point to four corners of the room and have people stand in one.) Scenario A: a program practises with flashcards and checks each guess against an answer key. Fingers up! [Count roughly, then click.] Supervised: the answer key holds the labels. B: sorting thousands of unlabelled photos into groups. [Count, click.] Unsupervised. C: a game bot earns points for winning. [Count, click.] Reinforcement, the points are the reward. D: hide one word and guess it from the words around it. [Count, click.] Self-supervised! The answer key is the hidden word itself. Remember D: it is exactly how the chatbots you use were first trained, and it is the next big idea.',
    ask: 'The four scenarios. Expected: A 1 finger (supervised), B 2 (unsupervised), C 3 (reinforcement), D 4 (self-supervised). If many say D is “unsupervised”, that is a reasonable answer: many people group self-supervised under unsupervised. What matters is that the feedback comes from the data itself.',
    terms: 'none new (reviews the previous slide).',
    caveats: 'All four scenarios are made-up examples, labelled as such on the slide. Do not reveal before the count.',
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
    { text: 'Neuron: ', options: { bold: true, color: HEX.text } }, { text: 'a tiny unit that adds up the signals coming in. The idea is borrowed loosely from brains; it is not a brain.', options: { color: HEX.muted, breakLine: true, paraSpaceAfter: 6 } },
    { text: 'Weight: ', options: { bold: true, color: HEX.text } }, { text: 'a dial on each connection.', options: { color: HEX.muted, breakLine: true, paraSpaceAfter: 6 } },
    { text: 'Layer: ', options: { bold: true, color: HEX.text } }, { text: 'one column of neurons.', options: { color: HEX.muted, breakLine: true, paraSpaceAfter: 6 } },
    { text: 'Parameters: ', options: { bold: true, color: HEX.text } }, { text: 'all the dials together.', options: { color: HEX.muted } },
  ], { x: rx + 0.22, y: 1.92, w: rw - 0.4, h: 2.45, fontSize: 16, valign: 'top' });
  const howLab = label(d, s, 'HOW MANY DIALS?', rx + 0.22, 4.12, rw - 0.4, { color: d.S.amber });
  const rows = [['13,002', 'a digit-reading network'], ['175 billion', 'GPT-3 (2020)'], ['1.04 trillion', 'Kimi K2.5 (open, 2026)'], ['not disclosed', 'the biggest closed models']];
  const how = [howLab];
  rows.forEach(([v, l], i) => {
    const y = 4.5 + i * 0.47;
    how.push(d.text(s, v, { x: rx + 0.22, y, w: 1.5, h: 0.42, fontSize: 16, bold: true, color: i === 3 ? d.S.steel : HEX.amber, valign: 'middle' }));
    how.push(d.text(s, l, { x: rx + 1.75, y, w: rw - 1.9, h: 0.42, fontSize: 16, color: HEX.muted, valign: 'middle' }));
  });

  d.animate(s, [...img, imgLab, inArrow, ...net.lines, ...net.nodes.flat(), ...layLab], { auto: true, effect: 'fade', dur: 700 });
  d.animate(s, [catNode, ...outNames], { effect: 'fade' });
  d.animate(s, dial, { effect: 'rise' });
  d.animate(s, [card, defs], { effect: 'fade' });
  d.animate(s, how, { effect: 'rise' });
  notes(s, {
    min: '2.0', clock: '9.5–11.5',
    build: 'The network shows automatically. Click 1: the output lights up “cat”. Click 2: the dial explanation. Click 3: the definitions. Click 4: how many dials.',
    say: 'Here is the “deep” in deep learning. A neural network is layers of tiny simple units called neurons, joined by connections. A photo goes in on the left as numbers (just pixel colours). Each neuron adds up the signals coming into it and passes a signal on. [Click.] Out the right side comes an answer, here “cat”. [Click.] Every line has a weight: a dial that sets how strongly one signal pushes the next. Think of a mixing board in a music studio with a huge number of knobs. Set all the knobs right and the network says “cat” for cats and “dog” for dogs. Set them wrong and it talks nonsense. Learning just means finding good knob settings. [Click.] A neuron is a loose idea borrowed from brains; it is not a brain. A layer is one column of neurons. Parameters means all the dials together. [Click.] How many? A small network that reads handwritten digits, from the 3Blue1Brown videos, has 13,002. GPT-3, in 2020, had 175 billion. The biggest open model with a published number, Kimi K2.5 from this year, has 1.04 trillion. The biggest closed models, like the newest ChatGPT, Claude and Gemini models, do not say. Outside estimates exist, but they are only estimates.',
    analogy: 'A mixing board with billions of knobs. Training = turning every knob a tiny bit toward the right answer.',
    ask: '“If you had a mixing board with a billion knobs, could you set them by hand?” Expected: no, which is why the computer has to learn the settings (next slide).',
    advanced: 'Each neuron computes a weighted sum of its inputs plus a bias, then passes it through a nonlinear function (an “activation function”). 3Blue1Brown’s network: 784 inputs, two hidden layers of 16, 10 outputs: 784×16+16 + 16×16+16 + 16×10+10 = 13,002 weights and biases. Many 2025–26 open models are “mixture of experts”: Kimi K2.5 has 1.04 trillion parameters but uses only 32 billion for each token.',
    terms: 'neural network, neuron, weight, layer, parameter, input, output.',
    caveats: 'The drawing is a schematic (real networks have far more neurons). The input picture is a real CIFAR-10 image. Frontier closed-model sizes are undisclosed; Epoch AI leaves GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro and GPT-6 Astra blank, so no number is given for them.',
    sources: ['https://www.3blue1brown.com/lessons/neural-networks', 'https://www.youtube.com/watch?v=aircAruvnKk (3Blue1Brown, “But what is a neural network?”)', 'https://arxiv.org/pdf/2005.14165 (GPT-3: 175 billion parameters)', 'https://arxiv.org/pdf/2602.02276 (Kimi K2.5: 1.04 trillion total, 32 billion activated)', 'https://epoch.ai/data/notable-ai-models', 'https://www.cs.toronto.edu/~kriz/cifar.html'],
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
  const axis = label(d, s, 'HOW WRONG (THE LOSS) · HIGHER = MORE WRONG', MX, 1.7, 5.2, { color: d.S.steel });
  const xLab = d.text(s, 'one dial’s setting  →', { x: gx + gw - 3.0, y: 6.08, w: 2.9, h: 0.3, fontSize: 12, color: d.S.steel, align: 'right' });
  const fog = [[0.7, 2.25, 3.4, 1.45], [2.7, 2.8, 2.9, 1.25], [0.6, 3.5, 2.3, 0.95]].map(([x, y, w, h]) => {
    const n = d.name('fog');
    s.addShape(d.pres.shapes.OVAL, { x, y, w, h, fill: { color: 'B8C0CC', transparency: 89 }, line: { color: 'B8C0CC', width: 0, transparency: 100 }, objectName: n });
    return n;
  });
  const fogLab = d.text(s, 'thick fog: you can only feel the slope under your feet', { x: 2.35, y: 2.3, w: 3.4, h: 0.5, fontSize: 13, italic: true, color: d.S.muted });
  const h0 = curve(0.08);
  const hiker = await ic(d, s, 'FaHiking', HEX.text, h0.x - 0.3, h0.y - 0.62, 0.6);
  const steps = [0.2, 0.31, 0.4, 0.48, 0.55, 0.6, 0.64].map((t) => { const p = curve(t); return oval(d, s, p.x - 0.07, p.y - 0.16, 0.14, 0.14, HEX.red, HEX.red); });
  const pm = curve(tm);
  const flag = [await ic(d, s, 'FaFlag', HEX.teal, pm.x - 0.08, pm.y - 0.52, 0.46),
    d.text(s, 'lowest error', { x: pm.x - 0.9, y: pm.y + 0.08, w: 1.8, h: 0.32, fontSize: 14, bold: true, color: HEX.teal, align: 'center' })];
  // map-view inset (public-domain Commons figure)
  const inset = await d.frame(s, R('gd-commons-gradient-descent-hires.png'), { x: 5.95, y: 1.82, w: 1.6, h: 1.9 }, { pad: 0.04 });
  const insetLab = d.text(s, 'Seen from above: each red arrow is one step', { x: 5.75, y: 3.76, w: 2.0, h: 0.46, fontSize: 12, color: d.S.muted, align: 'center', valign: 'top' });

  // right: four definitions
  const rx = 8.05, rw = W - MX - rx;
  const defs = [
    ['FaBullseye', HEX.red, 'Loss', 'one score for how wrong an answer is. Lower is better.'],
    ['FaArrowDown', HEX.amber, 'Gradient', 'for each dial, which way is downhill.'],
    ['FaShoePrints', HEX.teal, 'Learning rate', 'how big each step is.'],
    ['FaRedoAlt', HEX.blue, 'Training', 'measure, nudge, repeat: millions of times.'],
  ];
  const dg = [];
  for (let i = 0; i < 4; i++) {
    const y = 1.85 + i * 1.15, [nm, c, t, txt] = defs[i];
    const g = [box(d, s, rx, y, rw, 1.02, { fill: HEX.card, line: HEX.line })];
    g.push(...await iconDisc(d, s, nm, rx + 0.5, y + 0.51, 0.66, c, HEX.card2));
    g.push(d.text(s, [{ text: t, options: { bold: true, color: HEX.text, fontSize: 18, breakLine: true } }, { text: txt, options: { color: HEX.muted, fontSize: 16 } }], { x: rx + 1.0, y: y + 0.06, w: rw - 1.15, h: 0.9, valign: 'middle' }));
    dg.push(g);
  }
  d.animate(s, [ground, axis, xLab, ...fog, fogLab, hiker, ...dg[0]], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, [...steps.map((name, i) => ({ name, delay: i * 260 })), ...dg[1], ...dg[2]], { effect: 'zoom', dur: 300 });
  d.animate(s, [...flag, ...dg[3]], { effect: 'rise' });
  d.animate(s, [...inset, insetLab], { effect: 'fade' });
  notes(s, {
    min: '2.0', clock: '11.5–13.5',
    build: 'The hill, the hiker and “Loss” show automatically. Click 1: the steps downhill (with “Gradient” and “Learning rate”). Click 2: the lowest point (with “Training”). Click 3: the map view from above.',
    say: 'So how does the computer find good settings for billions of dials? First it needs a way to measure the mistake. That score is called the loss: one number for how wrong an answer is, and lower is better. Now imagine you are a hiker on a mountain in thick fog. You cannot see the valley, but you can feel which way the ground slopes under your feet. [Click.] So you take a small step downhill, feel again, take another step, and so on. That is gradient descent. The gradient tells each dial which way is “downhill”, meaning which way makes the loss smaller. The learning rate is the size of each step: too big and you overshoot, too small and it takes forever. [Click.] Repeat millions of times and you end up near the bottom: low error. That repetition is training. [Click.] Here is the same idea seen from above, like a map: each red arrow is one step towards the middle.',
    analogy: 'Walking downhill in thick fog, feeling the slope with your feet (the standard picture; Wikipedia’s gradient descent article uses the same one).',
    ask: '“What goes wrong if your steps are way too big?” Expected: you jump right over the valley, or bounce back and forth. “Too small?” Expected: it takes forever.',
    advanced: 'With a billion dials the “hill” lives in a billion dimensions, so we cannot picture it, but the maths is the same: take a small step opposite the gradient. Gradient descent can get stuck in a dip that is not the lowest point (a “local minimum”) or slow down on flat ground (a “saddle point”).',
    terms: 'loss, gradient descent, gradient, learning rate (step size), training.',
    caveats: 'The hill drawing is a schematic with no real numbers. The map-view figure is the public-domain Wikimedia Commons “Gradient descent” image.',
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
  const back = [seg(d, s, x0 + 3 * (bw + gap) + 0.4, by + bh + 0.28, x0 + 0.4, by + bh + 0.28, { color: HEX.red, width: 3, arrow: true })];
  back.push(d.text(s, 'trace the defect back: how much did each station add to it?', { x: x0, y: by + bh + 0.36, w: 4 * bw + 3 * gap, h: 0.36, fontSize: 16, bold: true, color: HEX.red, align: 'center' }));

  // network version
  const nl = label(d, s, 'IN A NEURAL NETWORK', MX, 3.8, 6, { color: d.S.amber });
  const xs = [1.25, 2.85, 4.45, 6.05], dia = 0.28;
  const net = drawNet(d, s, { xs, cy: 5.14, gap: 0.42, layers: [3, 4, 4, 2], dia, lw: [0.5, 1.5] });
  const wrong = oval(d, s, xs[3] - dia / 2, net.pos[3][0].y - dia / 2, dia, dia, HEX.red, HEX.red);
  const outT = d.text(s, [{ text: 'said “dog”', options: { bold: true, color: HEX.red, breakLine: true } }, { text: 'answer: “cat”', options: { color: HEX.muted } }], { x: xs[3] + 0.3, y: net.pos[3][0].y - 0.38, w: 1.6, h: 0.75, fontSize: 16, valign: 'middle' });
  const arrows = [];
  for (let i = 3; i > 0; i--) arrows.push(seg(d, s, xs[i] - 0.15, 4.26, xs[i - 1] + 0.15, 4.26, { color: HEX.red, width: 3.5, arrow: true }));
  const blame = d.text(s, 'blame flows backward, layer by layer', { x: xs[0], y: 6.0, w: xs[3] - xs[0], h: 0.32, fontSize: 14, italic: true, color: d.S.red, align: 'center' });
  const rx = 8.0, rw = W - MX - rx;
  const expl = d.text(s, [
    { text: 'Backpropagation: ', options: { bold: true, color: HEX.text } },
    { text: 'after a wrong answer, the error is traced backward through each layer to find how much each dial added to it. Then gradient descent nudges every dial a little.', options: { color: HEX.muted, breakLine: true, paraSpaceAfter: 8 } },
    { text: 'It works out the blame for billions of dials at once, fast enough to train huge networks.', options: { color: HEX.text } },
  ], { x: rx, y: 4.0, w: rw, h: 1.95, fontSize: 16, valign: 'top' });
  const hist = [await ic(d, s, 'FaBookOpen', HEX.steel, rx, 6.06, 0.36),
    d.text(s, 'Popularised in 1986 by Rumelhart, Hinton and Williams (Nature).', { x: rx + 0.48, y: 5.98, w: rw - 0.48, h: 0.52, fontSize: 14, color: d.S.steel, valign: 'middle' })];

  d.animate(s, fac, { auto: true, effect: 'fade' });
  d.animate(s, back, { effect: 'wipeLeft', dur: 700 });
  d.animate(s, [nl, ...net.lines, ...net.nodes.flat(), wrong, outT], { effect: 'fade' });
  d.animate(s, [...arrows.map((name, i) => ({ name, delay: i * 350 })), blame], { effect: 'wipeLeft', dur: 350 });
  d.animate(s, [expl, ...hist], { effect: 'fade' });
  notes(s, {
    min: '1.5', clock: '13.5–15',
    build: 'The factory line shows automatically. Click 1: the red arrow back. Click 2: the network gets a wrong answer. Click 3: blame flows backward. Click 4: the explanation and history.',
    say: 'Gradient descent needs to know which way to turn each dial. With billions of dials, how do we find out? Picture a factory line: three stations, then an inspector at the end who finds a defect. [Click.] To fix it, the inspector traces the defect back: how much did station 3 add, how much station 2, how much station 1? [Click.] A neural network does the same thing. It said “dog”, but the answer was “cat”. [Click.] The error gets sent backward through the network, layer by layer, working out how much each dial contributed to the mistake. That is backpropagation, “back-prop” for short. Then gradient descent nudges every dial a little in the helpful direction. [Click.] The clever part is speed: it works out the blame for billions of dials in one backward sweep. It was popularised in 1986 by David Rumelhart, Geoffrey Hinton and Ronald Williams.',
    analogy: 'A factory line where the final inspector traces a defect back to each station.',
    ask: '“Why go backward instead of testing each dial one at a time?” Expected: one dial at a time would take forever with billions of dials.',
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
  const barL = [label(d, s, 'IT SCORES EVERY POSSIBLE NEXT WORD', MX, 3.72, 4.6), label(d, s, 'MADE-UP EXAMPLE', MX + lw - 2.4, 3.72, 2.4, { color: d.S.amber, align: 'right' })];
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
    min: '2.5', clock: '15–17.5 (beat at about minute 16)',
    build: 'The sentence and the three options show automatically. Click 1: the scores (bars). Click 2: “picked”. Click 3: the loop. Click 4: definitions. Click 5: the honest surprise.',
    say: 'Let’s play the game a chatbot plays. “The cat sat on the …” Hands up for mat! Moon? Pizza? [Count roughly.] Most of you said mat. You just did what a large language model does. [Click.] The model gives every possible next word a score. This is a made-up example, so the bars only show the idea: “mat” scores high, “floor” and “sofa” a bit lower, “moon” and “pizza” almost nothing. [Click.] It picks one, usually a high scorer. [Click.] Then it adds that word to the text and does it again for the next word, and the next, one word at a time. That is how every answer you have ever got from a chatbot was written. [Click.] So an LLM, a large language model, is a neural network trained on huge amounts of text to predict the next token. A token is a chunk of text: often a whole word, sometimes a piece, like “un”, “believ”, “able”. [Click.] And here is the honest surprise: such a simple goal produces surprisingly capable behaviour, like writing code or solving maths problems, and nobody fully understands why yet. Keep that in mind for later.',
    analogy: 'Autocomplete on your phone, but trained on far more text and far better at it.',
    ask: '“The cat sat on the ___: mat, moon or pizza?” Expected: mostly mat; a few jokers say pizza (good: the model sometimes picks less likely words too, which is why answers vary).',
    advanced: 'Models usually do not always pick the single top word; they sample, so the same question can get different answers. Anthropic (Mar 27, 2025): “How does a system trained to predict the next word in a sequence learn to calculate, say, 36+59…” Their research found Claude plans ahead: before writing the second line of a rhyming poem, it had already picked the rhyme word (“rabbit”). OpenAI: 1 token is about three-quarters of an English word on average (an estimate that varies by model and language).',
    terms: 'LLM (large language model), token, next-token prediction.',
    caveats: 'The bars are a made-up example (labelled on the slide), not real model scores. “un / believ / able” is one possible split: real tokenizers differ, and a given model may split this word differently. Experts disagree on whether next-word prediction amounts to “understanding” (callback to the hook).',
    sources: ['https://help.openai.com/en/articles/4936856-understanding-and-counting-tokens', 'https://learn.microsoft.com/agent-framework/journey/llm-fundamentals (“A large language model is a neural network trained on massive amounts of text data to predict the next token in a sequence.”)', 'https://en.wikipedia.org/wiki/Large_language_model', 'https://www.anthropic.com/research/tracing-thoughts-language-model'],
  });
  return s;
}

// PART 1 · 8  Pretraining
async function pretrainSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(8));
  title(s, 'Pretraining: read a huge library, then guess');
  const lw = 5.95;
  const loopL = label(d, s, 'PRETRAINING = THIS LOOP, TRILLIONS OF TIMES', MX, 1.7, lw, { color: d.S.amber });
  const sw = (lw - 3 * 0.24) / 4, steps = [['FaEyeSlash', 'Hide a word'], ['FaQuestionCircle', 'Guess it'], ['FaCheckCircle', 'Check'], ['FaSlidersH', 'Nudge the dials']];
  const loop = [loopL];
  for (let i = 0; i < 4; i++) {
    const x = MX + i * (sw + 0.24), y = 2.08;
    loop.push(box(d, s, x, y, sw, 1.1, { fill: i === 3 ? TINT.red : HEX.card, line: i === 3 ? HEX.red : HEX.line }));
    loop.push(await ic(d, s, steps[i][0], i === 3 ? HEX.red : HEX.amber, x + (sw - 0.38) / 2, y + 0.12, 0.38));
    loop.push(d.text(s, steps[i][1], { x: x + 0.05, y: y + 0.52, w: sw - 0.1, h: 0.54, fontSize: 16, bold: true, color: HEX.text, align: 'center', valign: 'top' }));
    if (i < 3) loop.push(seg(d, s, x + sw + 0.03, y + 0.55, x + sw + 0.21, y + 0.55, { color: HEX.steel, width: 1.75, arrow: true }));
  }
  loop.push(d.text(s, 'nudge = gradient descent + backpropagation', { x: MX, y: 3.22, w: lw, h: 0.3, fontSize: 13, color: d.S.muted, italic: true }));
  const st1 = [d.text(s, '15 trillion+', { x: MX, y: 3.6, w: 2.8, h: 0.6, fontSize: 30, bold: true, color: HEX.amber, fontFace: 'Arial', valign: 'bottom' }),
    d.text(s, 'tokens read by Meta’s Llama 3 (2024)', { x: MX, y: 4.24, w: 2.7, h: 0.6, fontSize: 16, color: HEX.muted, valign: 'top' })];
  const st2 = [d.text(s, [{ text: '≈ ', options: { fontSize: 24 } }, { text: '90,000 years', options: { fontSize: 30 } }], { x: MX + 2.85, y: 3.6, w: 3.15, h: 0.6, bold: true, color: HEX.text, fontFace: 'Arial', valign: 'bottom' }),
    d.text(s, 'for one person reading nonstop (our arithmetic)', { x: MX + 2.85, y: 4.24, w: 3.1, h: 0.6, fontSize: 16, color: HEX.muted, valign: 'top' })];
  const gy = 5.05;
  const gpu = [d.card(s, { x: MX, y: gy, w: lw, h: 1.42 })];
  gpu.push(await ic(d, s, 'FaMicrochip', HEX.red, MX + 0.2, gy + 0.22, 0.5));
  gpu.push(d.text(s, [
    { text: 'Thousands of GPUs, for weeks or months. ', options: { bold: true, color: HEX.text } },
    { text: 'A GPU is a chip built for AI maths. OpenAI trained GPT-6 Astra on more than 100,000. The result: a base model.', options: { color: HEX.muted } },
  ], { x: MX + 0.88, y: gy + 0.08, w: lw - 1.0, h: 1.26, fontSize: 16, valign: 'middle' }));

  // right: disclosed token counts (native chart)
  const rx = 6.95, rw = W - MX - rx;
  const chL = label(d, s, 'TEXT READ IN PRETRAINING (TRILLIONS OF TOKENS)', rx, 1.7, rw, { color: d.S.steel });
  const data = [
    ['Llama 3 (Meta, 2024)', 15, '15T+'], ['DeepSeek-V3 (2024)', 14.8, '14.8T'], ['Llama 4 (Meta, 2025)', 30, '30T+'],
    ['Qwen3 (Alibaba, 2025)', 36, '≈36T'], ['Kimi K2 (Moonshot, 2025)', 15.5, '15.5T'], ['DeepSeek-V4-Pro (2026)', 32, '32T+'],
  ];
  const cbox = { x: rx, y: 2.05, w: rw, h: 3.55 }, layout = { x: 0.43, y: 0.02, w: 0.47, h: 0.96 }, maxV = 40;
  const chart = d.chart(s, 'bar', [{ name: 'Tokens (trillions)', labels: data.map((r) => r[0]), values: data.map((r) => r[1]) }], cbox, {
    barDir: 'bar', catAxisOrientation: 'maxMin', valAxisHidden: true, catAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: maxV, valAxisMajorUnit: 10,
    valGridLine: { style: 'none' }, chartColors: [HEX.amber], barGapWidthPct: 45, layout, showLegend: false,
  });
  const g = barGeom(cbox, layout, data.length, 45, maxV);
  const lab = [];
  data.forEach(([nm, v, t], i) => {
    lab.push(d.text(s, nm, { x: rx, y: g.cy(i) - 0.2, w: layout.x * rw - 0.1, h: 0.4, fontSize: 14, color: HEX.text, align: 'right', valign: 'middle' }));
    lab.push(d.text(s, t, { x: g.vx(v) + 0.06, y: g.cy(i) - 0.2, w: 0.85, h: 0.4, fontSize: 15, bold: true, color: HEX.amber, valign: 'middle' }));
  });
  const note = d.text(s, '“+” and “≈” follow each lab’s own wording (“over”, “more than”, “approximately”). OpenAI, Google and Anthropic do not disclose theirs.', { x: rx, y: 5.7, w: rw, h: 0.75, fontSize: 14, color: d.S.muted, valign: 'top' });
  src(d, s, 'Sources: Meta (Llama 3 & 4 posts) · DeepSeek (arXiv 2412.19437; V4-Pro model card) · Qwen3 blog · Kimi K2 (arXiv 2507.20534) · Fortune, Sep 3, 2026');

  d.animate(s, loop, { auto: true, effect: 'fade' });
  d.animate(s, [...st1, ...st2], { effect: 'rise' });
  d.animate(s, [chL, chart, ...lab, note], { effect: 'wipeLeft', dur: 700 });
  d.animate(s, gpu, { effect: 'rise' });
  notes(s, {
    min: '2.5', clock: '17.5–20',
    build: 'The loop shows automatically. Click 1: the two big numbers. Click 2: the chart. Click 3: the GPU box.',
    say: 'Pretraining is the first and by far the biggest stage of making a chatbot. The model plays the fill-in-the-blank game we just played, over and over: hide a word, guess it, check, and nudge the dials with gradient descent and backpropagation. Then again. Trillions of times. [Click.] How much text? Meta says its Llama 3 model read over 15 trillion tokens. If one person read that much at a normal adult reading speed, nonstop, day and night, it would take about 90,000 years. That is our own arithmetic, explained below. [Click.] And it keeps growing: some labs now report 30 trillion or more. The companies behind ChatGPT, Gemini and Claude do not say how much their models read. [Click.] This needs enormous computers: thousands of GPUs, chips built for AI maths, running for weeks or months. OpenAI said its newest model, GPT-6 Astra, was trained on more than 100,000 of them. What comes out of pretraining is called a base model. Let’s see what that is like.',
    analogy: 'Reading a huge library with a pencil, covering up one word at a time and guessing it, then checking.',
    ask: '“How long would it take you to read 15 trillion tokens?” Let them guess (a lifetime? a thousand years?). Answer: about 90,000 years reading nonstop.',
    advanced: 'ARITHMETIC (ours, not the labs’): 15 trillion tokens × 0.75 words per token (OpenAI’s rule of thumb, “1 token is approximately three-quarters of a word”; an estimate, and Llama’s tokenizer differs) = 11.25 trillion words. ÷ 238 words per minute (Brysbaert 2019, average adult silent reading of non-fiction) = about 47 billion minutes ≈ 788 million hours ≈ 90,000 years at 24 hours a day (about 270,000 years at 8 hours a day). Epoch AI estimates GPT-5 was likely trained on at least 30 trillion tokens (OpenAI has not said). Epoch AI assumed about 90 days for GPT-6 Astra’s run; OpenAI has not disclosed the duration.',
    terms: 'pretraining, GPU (a chip built for AI maths), base model.',
    caveats: 'Token counts are the labs’ own figures: Llama 3 “over 15T” (Meta; the paper gives 15.6T for the 405B model), DeepSeek-V3 14.8T, Llama 4 “more than 30 trillion”, Qwen3 “approximately 36 trillion”, Kimi K2 15.5T, DeepSeek-V4-Pro “more than 32T” (model card). Different labs count tokens with different tokenizers, so the bars are only roughly comparable. “More than 100,000 GPUs” is OpenAI’s Aidan Clark to Fortune (Sep 3, 2026).',
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
  const cw = (W - 2 * MX - 0.3) / 2, cy = 2.55, ch = 2.45;
  const card = (x, head, sub, color, tint, runs) => [
    box(d, s, x, cy, cw, ch, { fill: tint, line: color, lw: 1.25 }),
    d.text(s, [{ text: head, options: { bold: true, color, charSpacing: 2 } }, { text: '  ·  ' + sub, options: { color: HEX.muted } }], { x: x + 0.22, y: cy + 0.1, w: cw - 0.4, h: 0.4, fontSize: 14, valign: 'middle' }),
    d.text(s, runs, { x: x + 0.22, y: cy + 0.55, w: cw - 0.4, h: ch - 0.65, fontSize: 16, valign: 'top' }),
  ];
  const base = card(MX, 'BASE MODEL', 'after pretraining: it keeps the text going', HEX.steel, HEX.card, [
    { text: 'How do I fold a paper boat?', options: { color: HEX.text, breakLine: true, paraSpaceAfter: 6 } },
    { text: 'How do I make a paper hat?', options: { color: HEX.text, breakLine: true, paraSpaceAfter: 6 } },
    { text: 'What is the best paper for a crane?', options: { color: HEX.text, breakLine: true, paraSpaceAfter: 6 } },
    { text: '12 replies · last post 3 days ago', options: { color: HEX.steel, italic: true } },
  ]);
  const asst = card(MX + cw + 0.3, 'ASSISTANT', 'after post-training: it answers', HEX.red, TINT.red, [
    { text: 'Here is a simple dart plane:', options: { color: HEX.text, bold: true, breakLine: true, paraSpaceAfter: 4 } },
    { text: '1. Fold the paper in half the long way, then unfold.', options: { color: HEX.text, breakLine: true, paraSpaceAfter: 3 } },
    { text: '2. Fold the top corners in to the middle line.', options: { color: HEX.text, breakLine: true, paraSpaceAfter: 3 } },
    { text: '3. Fold the new slanted edges to the middle again.', options: { color: HEX.text, breakLine: true, paraSpaceAfter: 3 } },
    { text: '4. Fold it in half, then fold each wing down.', options: { color: HEX.text } },
  ]);
  const ry = 5.22;
  const real = [label(d, s, 'A REAL EXAMPLE (OPENAI, 2022): ASKED TO USE “SERENDIPITY” IN A SENTENCE', MX, ry - 0.02, W - 2 * MX, { color: d.S.amber })];
  real.push(d.text(s, [{ text: 'GPT-3 (base): ', options: { bold: true, color: HEX.text } }, { text: '“Serendipity is the ability to see something good in something bad. Use the word in a sentence.” …and more of the same.', options: { color: HEX.muted, italic: true } }], { x: MX, y: ry + 0.33, w: cw, h: 0.82, fontSize: 16, valign: 'top' }));
  real.push(d.text(s, [{ text: 'InstructGPT (assistant): ', options: { bold: true, color: HEX.text } }, { text: '“Serendipity can be defined as the happy chance occurrence of events leading to a beneficial outcome. For example, …”', options: { color: HEX.muted, italic: true } }], { x: MX + cw + 0.3, y: ry + 0.33, w: cw, h: 0.82, fontSize: 16, valign: 'top' }));
  src(d, s, 'Real example: Ouyang et al. (2022), “Training language models to follow instructions with human feedback”, Fig. 47 (OpenAI)');
  d.animate(s, pr, { auto: true, effect: 'fade' });
  d.animate(s, base, { effect: 'rise' });
  d.animate(s, asst, { effect: 'rise' });
  d.animate(s, real, { effect: 'fade' });
  notes(s, {
    min: '2.0', clock: '20–22',
    build: 'The prompt shows automatically. Click 1: the base model. Click 2: the assistant. Click 3: the real example from the paper.',
    say: 'What does a base model, straight out of pretraining, actually do? Remember, it only learned to continue text. So if you type “How do I fold a paper plane?” … [Click.] … it might just keep the page going: more questions, like a forum thread, because on the internet a question is often followed by more questions. This is a made-up example to show the idea. It is not a real model’s output. [Click.] An assistant, the kind of chatbot you use, actually answers the question, step by step. Same knowledge inside, different behaviour. What turns one into the other is called post-training. [Click.] And this really happens. In OpenAI’s 2022 paper, base GPT-3 was asked to use “serendipity” in a sentence. It wrote more exercises of the same kind. The post-trained version, InstructGPT, answered.',
    analogy: 'A base model is like a friend who has read the whole library but, when you ask a question, just keeps reading aloud from wherever the page leads. Post-training teaches them to answer you.',
    ask: '“Why would a model trained on the internet answer a question with more questions?” Expected: because that is what it saw online (forums, FAQ lists, quiz pages).',
    advanced: 'OpenAI (Jan 27, 2022): “GPT‑3 is trained to predict the next word on a large dataset of Internet text, rather than to safely perform the language task that the user wants.” The paper notes its example prompts are cherry-picked (outputs are not), and that GPT-3 was sampled at a slightly different temperature.',
    terms: 'base model, assistant (chat model), post-training (preview).',
    caveats: 'The paper-plane continuations are a made-up example, labelled on the slide. The serendipity quotes are verbatim from Fig. 47 of the InstructGPT paper (GPT-3 175B vs InstructGPT 175B).',
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
  const b = ans(3.8, 1.42, 'B', 'Good question! Sunlight is a mix of colours. Air scatters blue light more than red, so blue light reaches your eyes from all over the sky.');
  const rev = [box(d, s, MX, 5.4, lw, 1.07, { fill: TINT.red, line: HEX.red, lw: 1.25 }),
    d.text(s, [{ text: 'Your vote is the training signal. ', options: { bold: true, color: HEX.text } }, { text: 'Real raters compare many answer pairs like this one.', options: { color: HEX.muted } }], { x: MX + 0.2, y: 5.42, w: lw - 0.35, h: 1.03, fontSize: 16, valign: 'middle' })];

  // right: OpenAI's own three-step diagram
  const rx = 6.5, rw = W - MX - rx;
  const fig = await d.frame(s, R('instructgpt-fig2.png'), { x: rx, y: 1.72, w: rw, h: 3.7 }, { pad: 0.06 });
  const g = fig.geom, tw = g.w / 3;
  const steps = [['1 · SFT', 'Copy answers people wrote', HEX.blue], ['2 · REWARD MODEL', 'Learns what people prefer', HEX.amber], ['3 · RLHF', 'Practise to earn a higher score', HEX.red]];
  const cap = [];
  steps.forEach(([t, txt, c], i) => {
    const x = g.x + i * tw;
    cap.push(d.text(s, [{ text: t, options: { bold: true, color: c, fontSize: 14, charSpacing: 1, breakLine: true } }, { text: txt, options: { color: HEX.text, fontSize: 16 } }], { x: x + 0.05, y: g.y + g.h + 0.12, w: tw - 0.12, h: 0.8, valign: 'top' }));
  });
  src(d, s, 'Diagram: Ouyang et al. (2022), “Training language models to follow instructions with human feedback”, Fig. 2 (OpenAI)');
  d.animate(s, [...top, ...a, ...b], { auto: true, effect: 'fade' });
  d.animate(s, bt, { auto: true, effect: 'zoom', dur: 400 });
  d.animate(s, rev, { effect: 'zoom', dur: 400 });
  d.animate(s, fig, { effect: 'fade' });
  cap.forEach((c) => d.animate(s, [c], { effect: 'rise' }));
  notes(s, {
    min: '2.0', clock: '22–24 (beat at about minute 23)',
    build: 'The question and both answers show automatically. Click 1: “your vote is the training signal”. Click 2: OpenAI’s diagram. Clicks 3–5: the three steps.',
    say: 'Here is one question with two made-up answers. Both are correct. A is short and a bit cold. B is clear and friendly. Hands up for A! Hands up for B! [Count roughly.] [Click.] Congratulations: you just did the job of an AI rater. Votes like yours become the training signal. Real raters compare many pairs of answers like this. [Click.] This is OpenAI’s own diagram from 2022, showing how it trained InstructGPT, an early assistant model. [Click.] Step 1 is SFT, supervised fine-tuning: people write example conversations and the model copies them. That is the supervised learning from earlier, flashcards with answers. [Click.] Step 2: people rank several answers from best to worst, and a second model, the reward model, learns to predict which answers people prefer. [Click.] Step 3 is RLHF, reinforcement learning from human feedback: the chatbot practises answering, the reward model scores each answer, and the chatbot is tuned to earn higher scores. That is the reinforcement learning from earlier, with points as treats. All of this is called post-training, because it comes after pretraining.',
    analogy: 'Pretraining is reading the whole library. Post-training is a coach: first showing good examples (SFT), then scoring your practice answers (RLHF).',
    ask: '“A or B?” Expected: most pick B. Follow-up: “Who might a rater disagree with?” Expected: people from other places, ages or opinions; some prefer short answers.',
    advanced: 'In the InstructGPT paper, raters preferred the 1.3-billion-parameter InstructGPT over the 175-billion-parameter GPT-3, “despite having over 100x fewer parameters”. OpenAI said this post-training used “less than 2% of the compute and data relative to model pretraining”. The paper also reports an “alignment tax”: some tasks got slightly worse.',
    terms: 'post-training, fine-tuning (extra training on a smaller, chosen set of examples), SFT (supervised fine-tuning), reward model, RLHF (reinforcement learning from human feedback), rater.',
    caveats: 'Raters disagree and have biases, and “whose preferences?” is an open question; the paper itself says “more work is needed to study how these models perform on broader groups of users, and how they perform on inputs where humans disagree about the desired behavior.” The A/B answers are made-up examples (labelled).',
    sources: ['https://arxiv.org/abs/2203.02155 (Ouyang et al. 2022, InstructGPT; Fig. 2 on p. 3)', 'https://openai.com/index/instruction-following/'],
  });
  return s;
}

// PART 1 · 11  Constitutions + checkable rewards
async function rewardsSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(11));
  title(s, 'Checkable rewards teach models to reason');
  const cw = (W - 2 * MX - 0.35) / 2, y = 1.8, h = 4.68;
  // left: constitution
  const lx = MX;
  const L = [box(d, s, lx, y, cw, h, { fill: HEX.card, line: HEX.line })];
  L.push(...chip(d, s, 'A CONSTITUTION', lx + 0.2, y + 0.18, 2.3, HEX.blue, { fontSize: 14, charSpacing: 2 }));
  L.push(d.text(s, [{ text: 'A short written list of principles, ', options: { bold: true, color: HEX.text } }, { text: 'like “be honest” and “avoid harm”.', options: { color: HEX.muted } }], { x: lx + 0.2, y: y + 0.65, w: cw - 0.4, h: 0.62, fontSize: 16, valign: 'top' }));
  const bw3 = (cw - 0.4 - 2 * 0.32) / 3, by = y + 1.38;
  ['Draft an answer', 'Critique it using the principles', 'Revise it'].forEach((t, i) => {
    const x = lx + 0.2 + i * (bw3 + 0.32);
    L.push(box(d, s, x, by, bw3, 1.0, { fill: HEX.card2, line: HEX.blue }));
    L.push(d.text(s, t, { x: x + 0.06, y: by, w: bw3 - 0.12, h: 1.0, fontSize: 16, bold: true, color: HEX.text, align: 'center', valign: 'middle' }));
    if (i < 2) L.push(seg(d, s, x + bw3 + 0.04, by + 0.5, x + bw3 + 0.28, by + 0.5, { color: HEX.blue, width: 2, arrow: true }));
  });
  L.push(d.text(s, 'The revised answers train the model. (Constitutional AI, Anthropic, 2022)', { x: lx + 0.2, y: by + 1.08, w: cw - 0.4, h: 0.6, fontSize: 16, color: HEX.muted, valign: 'top' }));
  L.push(d.text(s, [
    { text: 'TODAY · CLAUDE’S CONSTITUTION (2026) RANKS ITS PRIORITIES', options: { fontSize: 12, bold: true, color: HEX.blue, charSpacing: 1, breakLine: true, paraSpaceAfter: 4 } },
    { text: 'broadly safe → broadly ethical → follows Anthropic’s guidelines → genuinely helpful', options: { fontSize: 16, color: HEX.text } },
  ], { x: lx + 0.2, y: y + 3.25, w: cw - 0.4, h: 1.3, valign: 'top' }));

  // right: verifiable rewards
  const rx = MX + cw + 0.35;
  const Rg = [box(d, s, rx, y, cw, h, { fill: TINT.amber, line: HEX.amber, lw: 1.25 })];
  Rg.push(...chip(d, s, 'CHECKABLE REWARDS', rx + 0.2, y + 0.18, 2.75, HEX.amber, { fontSize: 14, color: HEX.ink, charSpacing: 2 }));
  ['Model writes its steps', 'A program checks the final answer', 'Right answer = reward'].forEach((t, i) => {
    const x = rx + 0.2 + i * (bw3 + 0.32), yy = y + 0.68;
    Rg.push(box(d, s, x, yy, bw3, 1.0, { fill: HEX.card2, line: HEX.amber }));
    Rg.push(d.text(s, t, { x: x + 0.06, y: yy, w: bw3 - 0.12, h: 1.0, fontSize: 16, bold: true, color: HEX.text, align: 'center', valign: 'middle' }));
    if (i < 2) Rg.push(seg(d, s, x + bw3 + 0.04, yy + 0.5, x + bw3 + 0.28, yy + 0.5, { color: HEX.amber, width: 2, arrow: true }));
  });
  Rg.push(d.text(s, 'Works for maths and code, where answers can be checked. Result: “reasoning models” that write out steps first.', { x: rx + 0.2, y: y + 1.78, w: cw - 0.4, h: 0.62, fontSize: 16, color: HEX.muted, valign: 'top' }));
  const stat = [d.text(s, '15.6% → 71%', { x: rx + 0.2, y: y + 2.42, w: 3.2, h: 0.6, fontSize: 34, bold: true, color: HEX.amber, fontFace: 'Arial', valign: 'bottom' }),
    d.text(s, 'DeepSeek-R1-Zero on a hard maths contest (AIME 2024), before vs. after this practice', { x: rx + 3.4, y: y + 2.42, w: cw - 3.6, h: 0.72, fontSize: 14, color: HEX.muted, valign: 'middle' })];
  const clip = await d.frame(s, D('r1_aha.png'), { x: rx + 0.2, y: y + 3.22, w: cw - 0.4, h: 0.95 }, { pad: 0.05 });
  const clipL = d.text(s, 'The model’s own words, mid-problem (DeepSeek, 2025)', { x: rx + 0.2, y: y + 4.2, w: cw - 0.4, h: 0.3, fontSize: 12, color: d.S.steel, italic: true });
  src(d, s, 'Bai et al. (2022), Constitutional AI (Anthropic) · Anthropic, “Claude’s new constitution” (Jan 22, 2026) · DeepSeek-AI (2025), DeepSeek-R1, arXiv 2501.12948');
  d.animate(s, L, { auto: true, effect: 'fade' });
  d.animate(s, Rg, { effect: 'fade' });
  d.animate(s, stat, { effect: 'zoom', dur: 400 });
  d.animate(s, [...clip, clipL], { effect: 'rise' });
  notes(s, {
    min: '2.5', clock: '24–26.5',
    build: 'The constitution side shows automatically. Click 1: checkable rewards. Click 2: the 15.6% → 71% result. Click 3: the model’s own “Wait, wait” words.',
    say: 'Two newer tricks in post-training. First, a constitution: a short written list of principles, like “be honest” and “avoid harm”. In Anthropic’s 2022 method, Constitutional AI, the model writes a draft, critiques its own draft against the principles, and revises it. Those revised answers are then used to train it, so far fewer human labels are needed. Today Claude’s constitution even ranks its priorities: broadly safe first, then broadly ethical, then following Anthropic’s guidelines, then genuinely helpful. [Click.] Second, checkable rewards. For maths and code, a simple program can check whether the final answer is right. A right answer earns a reward, which is reinforcement learning again. Something surprising happens: the model learns, on its own, to write out its steps before answering. That gives us “reasoning models”. [Click.] DeepSeek’s R1-Zero went from 15.6% to 71% on a hard American maths contest, just from this kind of practice. [Click.] And here are the model’s own words in the middle of a problem: “Wait, wait. Wait. That’s an aha moment I can flag here.” Then it re-checks its work.',
    analogy: 'Constitution = a class code of conduct you check your own work against. Checkable rewards = a maths worksheet with an answer key: you only get the point if the final answer matches.',
    ask: '“Can you think of a task where a computer could NOT easily check the answer?” Expected: writing a good poem, giving advice, being kind. That is why checkable rewards work best for maths and code.',
    advanced: 'DeepSeek (Jan 22, 2025): “the reasoning abilities of LLMs can be incentivized through pure reinforcement learning (RL), obviating the need for human-labeled reasoning trajectories.” For maths, “the model is required to provide the final answer in a specified format (e.g., within a box), enabling reliable rule-based verification of correctness.” With majority voting R1-Zero reached 86.7%. OpenAI’s o1 (Sep 2024) was an earlier reasoning model; OpenAI says o1 “consistently improves with more reinforcement learning (train-time compute) and with more time spent thinking (test-time compute).”',
    terms: 'constitution, Constitutional AI, reinforcement learning with verifiable (checkable) rewards, reasoning model, AIME (a US high-school maths contest).',
    caveats: '“Reasoning” here means writing out steps before answering, not proof of understanding. Checkers can be gamed: a model may find ways to get the reward without doing what we meant (Part 3). The 15.6% and 71.0% are pass@1 scores on AIME 2024 from the arXiv v1 paper. The constitution priority order is Anthropic’s own document, which calls itself “a perpetual work in progress”.',
    sources: ['https://arxiv.org/abs/2212.08073 (Bai et al. 2022, Constitutional AI)', 'https://www.anthropic.com/news/claude-new-constitution', 'https://www.anthropic.com/constitution', 'https://arxiv.org/abs/2501.12948 (DeepSeek-R1; Table 3 “aha moment” in https://arxiv.org/html/2501.12948v1)', 'https://openai.com/index/learning-to-reason-with-llms/'],
  });
  return s;
}

// PART 1 · 12  The frontier pipeline
async function pipelineSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(12));
  title(s, 'How a frontier model is made, step by step');
  const bt = await beat(d, s, 'TURN & TALK', 'FaUserFriends');
  const top = d.text(s, 'FRONTIER MODEL = ONE OF THE MOST CAPABLE MODELS · THESE STEPS ARE GENERIC: LABS DON’T PUBLISH RECIPES', { x: MX, y: 1.66, w: W - 2 * MX, h: 0.3, fontSize: 12, bold: true, color: d.S.steel, charSpacing: 1, valign: 'bottom' });
  const n = 6, gap = 0.16, cw = (W - 2 * MX - (n - 1) * gap) / n, y = 2.06, h = 3.4;
  const st = [
    ['FaDatabase', 'Collect and filter data', 'Books, websites, code; remove junk', 'Llama 4: more than 30 trillion tokens', HEX.steel],
    ['FaBookOpen', 'Pretraining', 'Guess the next word, trillions of times', 'GPT-6 Astra: 100,000+ GPUs', HEX.steel],
    ['FaChalkboardTeacher', 'SFT', 'Copy example answers people wrote', 'InstructGPT’s post-training: under 2% of pretraining’s compute', HEX.amber],
    ['FaThumbsUp', 'Preference training', 'RLHF and constitutions', 'Raters compare answer pairs', HEX.amber],
    ['FaCheckDouble', 'RL on checkable tasks', 'Maths and code with answer checkers', 'R1-Zero: 15.6% → 71% on AIME 2024', HEX.amber],
    ['FaShieldAlt', 'Safety testing and release', 'Red-teaming, danger tests, staged release, monitoring', 'GPT-5: 5,000+ hours of red-teaming', HEX.red],
  ];
  const cols = [];
  for (let i = 0; i < n; i++) {
    const [nm, name, what, big, c] = st[i], x = MX + i * (cw + gap), last = i === n - 1;
    const g = [box(d, s, x, y, cw, h, { fill: last ? TINT.red : HEX.card, line: last ? HEX.red : HEX.line, lw: last ? 1.5 : 0.75 })];
    g.push(...numDisc(d, s, i + 1, x + 0.38, y + 0.38, 0.5, c, { color: c === HEX.amber ? HEX.ink : 'FFFFFF', fontSize: 17 }));
    g.push(await ic(d, s, nm, c, x + cw - 0.6, y + 0.17, 0.42));
    g.push(d.text(s, name, { x: x + 0.12, y: y + 0.72, w: cw - 0.2, h: 0.62, fontSize: 16, bold: true, color: HEX.text, valign: 'top' }));
    g.push(d.text(s, what, { x: x + 0.12, y: y + 1.36, w: cw - 0.2, h: 1.05, fontSize: 16, color: HEX.muted, valign: 'top' }));
    g.push(d.text(s, big, { x: x + 0.12, y: y + 2.6, w: cw - 0.2, h: 0.75, fontSize: 12, bold: true, color: c === HEX.steel ? HEX.muted : c, valign: 'top' }));
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
  const bar = [box(d, s, MX, by, W - 2 * MX, 0.52, { fill: TINT.amber, line: HEX.amber, lw: 1.25 })];
  bar.push(await ic(d, s, 'FaUserFriends', HEX.amber, MX + 0.18, by + 0.09, 0.34));
  bar.push(d.text(s, [{ text: 'Turn to a neighbour (30 s): ', options: { bold: true, color: HEX.amber } }, { text: 'at which step would you test for dangerous behaviour? Why?', options: { bold: true, color: HEX.text } }], { x: MX + 0.65, y: by, w: W - 2 * MX - 0.8, h: 0.52, fontSize: 18, valign: 'middle' }));
  d.animate(s, [top], { auto: true });
  cols.forEach((g, i) => d.animate(s, g, { auto: i === 0, effect: 'rise', after: 100 }));
  d.animate(s, brackets, { effect: 'fade' });
  d.animate(s, [...bar, ...bt], { effect: 'zoom', dur: 400 });
  notes(s, {
    min: '2.5', clock: '26.5–29 (beat at about minute 28)',
    build: 'Step 1 shows automatically; each click adds the next step (2–6). Click 6: the PRETRAINING / POST-TRAINING / TESTING brackets. Click 7: the turn-and-talk question.',
    say: 'Let’s put the whole recipe together. A frontier model means one of the most capable models, from a few top labs. Step 1: collect and filter data: books, websites, code, with junk removed. [Click.] Step 2: pretraining, the giant fill-in-the-blank game. That gives the base model. [Click.] Step 3: SFT, copying example answers people wrote. [Click.] Step 4: preference training, RLHF and constitutions. [Click.] Step 5: reinforcement learning on checkable tasks like maths and code. [Click.] Step 6: safety testing and release. That includes red-teaming, where experts try hard to make the model misbehave; tests for dangerous abilities; releasing carefully in stages; and monitoring after launch. [Click.] Steps 1–2 are pretraining, 3–5 post-training, 6 testing. [Click.] Now turn to a neighbour for 30 seconds: at which step would you test for dangerous behaviour, and why? [After 30 seconds, take two volunteers.]',
    analogy: 'Building a car: gather materials, build the engine (pretraining), tune it for real roads (post-training), then crash-test it before selling it (safety testing).',
    ask: '“At which step would you test for dangerous behaviour?” Good answers: after pretraining, because the base model already knows a lot; after each post-training step, because behaviour changes; before release; after release, because people use it in new ways. Best answer: all of them. Real labs test throughout, not only at the end.',
    advanced: 'Labs publish safety frameworks: Anthropic’s Responsible Scaling Policy says reaching certain capability thresholds “requires us to upgrade our safeguards”; OpenAI’s Preparedness Framework (v2, Apr 2025): “We do not deploy models that reach a High capability threshold until the associated risks that they pose are sufficiently minimized”; Google DeepMind’s Frontier Safety Framework (v3.1, Apr 2026) defines “Critical Capability Levels”. Anthropic admitted in Feb 2026: “The science of model evaluation isn’t well-developed enough to provide dispositive answers.”',
    terms: 'frontier model, red-teaming (experts try to make a model misbehave), dangerous-capability tests, staged release, monitoring.',
    caveats: 'The stages are generic: labs do not publish full recipes and their order varies; safety testing runs throughout, not only at the end; and no one can yet fully verify that a model is safe (Part 3). Figures: Llama 4 “more than 30 trillion tokens” (Meta); GPT-6 Astra “more than 100,000 GPUs” (OpenAI via Fortune); InstructGPT post-training used “less than 2% of the compute and data relative to model pretraining” (OpenAI, 2022; newer models may use much more for RL, which OpenAI does not quantify); R1-Zero AIME 2024 pass@1 15.6% → 71.0% (DeepSeek); GPT-5 “more than 400 external testers and experts did over 5,000 hours of red-team work” (OpenAI system card, Aug 2025).',
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
    ['FaMicrochip', HEX.red, TINT.red, 'Compute', 'the oven time', 'The total maths done by chips. It costs time and electricity.'],
    ['FaScroll', HEX.amber, TINT.amber, 'Method', 'the recipe', 'Model designs and training tricks, like the steps you just saw.'],
  ];
  const rows = [];
  for (let i = 0; i < 3; i++) {
    const [nm, c, tint, name, an, de] = ing[i], y = 1.85 + i * 1.57;
    const g = [box(d, s, MX, y, lw, 1.42, { fill: HEX.card, line: HEX.line })];
    g.push(...await iconDisc(d, s, nm, MX + 0.65, y + 0.71, 0.95, c, tint));
    g.push(d.text(s, [{ text: name, options: { bold: true, color: HEX.text, fontSize: 22, fontFace: 'Arial' } }, { text: '  =  ' + an, options: { bold: true, color: c, fontSize: 18, breakLine: true } }, { text: de, options: { color: HEX.muted, fontSize: 16 } }], { x: MX + 1.35, y: y + 0.08, w: lw - 1.5, h: 1.26, valign: 'middle' }));
    rows.push(g);
  }
  // right: compute of landmark models, log scale (bar height = number of zeros)
  const rx = 6.6, rw = W - MX - rx;
  const chL = label(d, s, 'TRAINING COMPUTE · EPOCH AI ESTIMATES', rx, 1.7, rw, { color: d.S.steel });
  const sub = d.text(s, 'Each gridline = 10× more maths', { x: rx, y: 2.0, w: rw, h: 0.3, fontSize: 13, color: d.S.muted, italic: true });
  const pts = [['AlexNet', '2012', 4.7e17, '1×'], ['Transformer', '2017', 7.4245248e18, '16×'], ['GPT-3', '2020', 3.14e23, '670,000×'], ['GPT-4', '2023', 2.1e25, '45 million×'], ['GPT-6 Astra', '2026', 1.0001e27, '≈ 2 billion×']];
  const vals = pts.map((p) => +(Math.log10(p[2]) - 16).toFixed(3));
  const cbox = { x: rx, y: 2.3, w: rw, h: 3.2 }, layout = { x: 0.04, y: 0.12, w: 0.94, h: 0.82 }, maxV = 12;
  const chart = d.chart(s, 'bar', [{ name: 'log10(FLOP) − 16', labels: pts.map((p) => p[0]), values: vals }], cbox, {
    barDir: 'col', valAxisHidden: true, catAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: maxV, valAxisMajorUnit: 1,
    chartColors: [HEX.steel, HEX.steel, HEX.steel, HEX.steel, HEX.red], barGapWidthPct: 55, layout, showLegend: false,
  });
  const g = barGeom(cbox, layout, pts.length, 55, maxV);
  const labs = [];
  pts.forEach(([nm, yr, , t], i) => {
    labs.push(d.text(s, t, { x: g.cx(i) - 0.75, y: g.vy(vals[i]) - 0.36, w: 1.5, h: 0.32, fontSize: 14, bold: true, color: i === 4 ? d.S.red : HEX.text, align: 'center', valign: 'bottom' }));
    labs.push(d.text(s, [{ text: nm, options: { bold: true, color: HEX.text, breakLine: true } }, { text: yr, options: { color: HEX.muted } }], { x: g.cx(i) - 0.65, y: g.py + g.ph + 0.04, w: 1.3, h: 0.5, fontSize: 12, align: 'center', valign: 'top' }));
  });
  const note = d.text(s, [{ text: 'Frontier training compute has grown about 5× per year since 2020 ', options: { color: HEX.text } }, { text: '(Epoch AI estimate).', options: { color: HEX.muted } }], { x: rx, y: 5.96, w: rw, h: 0.54, fontSize: 16, valign: 'middle' });
  src(d, s, 'Data: Epoch AI, AI models database (estimates; GPT-6 Astra ≈ 1e27 FLOP, OpenAI has not disclosed) · Epoch AI Trends, Feb 2026 · ratios are our division');
  d.animate(s, rows[0], { auto: true, effect: 'rise' });
  d.animate(s, rows[1], { effect: 'rise' });
  d.animate(s, rows[2], { effect: 'rise' });
  d.animate(s, [chL, sub, chart, ...labs], { effect: 'wipeLeft', dur: 800 });
  d.animate(s, [note], { effect: 'fade' });
  notes(s, {
    min: '1.5', clock: '29–30.5',
    build: 'Data shows automatically. Click 1: compute. Click 2: method. Click 3: the chart. Click 4: the growth line.',
    say: 'Why has AI improved so fast? Think of baking a cake. You need ingredients: that is data, the text, images and code to learn from. [Click.] You need oven time: that is compute, the total amount of maths done by chips, which costs time and electricity. [Click.] And you need a good recipe: that is method, the model designs and training tricks, like everything we just covered. [Click.] Compute has grown the most dramatically. Each bar here is one landmark model, and each gridline means ten times more maths. AlexNet in 2012 was a breakthrough image recogniser. GPT-3 used about 670,000 times more maths. The newest, GPT-6 Astra, is estimated at about 2 billion times AlexNet. [Click.] Epoch AI, a research group that tracks this, estimates frontier training compute has grown about five times every year since 2020. That brings us to scaling laws.',
    analogy: 'Baking: ingredients (data), oven time (compute) and a recipe (method). A bigger cake needs all three to grow together.',
    ask: '“Which ingredient do you think is hardest to keep growing?” Possible answers: data (we may run out of good human text), compute (costs money and electricity), method (needs new ideas). All are reasonable; experts disagree.',
    advanced: 'Compute is measured in FLOP (floating-point operations: single additions or multiplications). Epoch estimates (log scale): AlexNet 4.7e17 FLOP (“Confident”), the original Transformer 7.4e18 (“Confident”), GPT-3 3.14e23 (“Confident”), GPT-4 2.1e25 (“Likely”, within about 10×), GPT-6 Astra 1.0e27 (“Likely”; Epoch’s interval about 5e26–2e27). Bar heights show log10(FLOP) − 16, which is a log scale. Ratios are our division: 7.4e18/4.7e17 ≈ 16; 3.14e23/4.7e17 ≈ 670,000; 2.1e25/4.7e17 ≈ 45 million; 1e27/4.7e17 ≈ 2.1 billion. Epoch: about 4.1× per year for notable models from 2010 to May 2024. Rich Sutton’s “The Bitter Lesson” (2019): “general methods that leverage computation are ultimately the most effective, and by a large margin.”',
    terms: 'data, compute (the total maths done by chips), chip (a computer chip such as a GPU), method.',
    caveats: 'All compute figures are Epoch AI estimates (labelled on the slide); labs rarely disclose them. GPT-6 Astra’s estimate is based on “at least 100,000 GB200s” over an assumed 90 days.',
    sources: ['https://epoch.ai/data/all_ai_models.csv', 'https://epoch.ai/data/ai-models', 'https://epoch.ai/trends (“Training compute for frontier language models has been growing at 5× per year since 2020”, updated Feb 5, 2026)', 'https://epoch.ai/blog/training-compute-of-frontier-ai-models-grows-by-4-5x-per-year', 'http://www.incompleteideas.net/IncIdeas/BitterLesson.html'],
  });
  return s;
}

// PART 1 · 14  Scaling laws
async function scalingSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  kicker(s, K(14));
  title(s, 'Scaling laws: bigger runs get steadily better');
  const lw = 7.2;
  const chL = label(d, s, 'ERROR ON TEST TEXT vs. COMPUTE · REDRAWN FROM KAPLAN ET AL. (2020)', MX, 1.7, lw, { color: d.S.steel });
  // Kaplan et al. Fig. 1 fit: L = (C / 2.3e8)^-0.050, C in PF-days, drawn from 1e-8 to 1e1 (the figure's range)
  const cats = ['1×', '10×', '100×', '1,000×', '10k×', '100k×', '1M×', '10M×', '100M×', '1B×'];
  const vals = cats.map((_, k) => +Math.pow(1e-8 * Math.pow(10, k) / 2.3e8, -0.05).toFixed(3));
  const chart = d.chart(s, 'line', [{ name: 'test loss (fit)', labels: cats, values: vals }], { x: MX, y: 2.0, w: lw, h: 4.1 }, {
    valAxisMinVal: 2, valAxisMaxVal: 7, valAxisMajorUnit: 1, valAxisHidden: true, lineSmooth: true, lineDataSymbol: 'circle', lineDataSymbolSize: 8,
    chartColors: [HEX.red], lineSize: 4, catAxisLabelFontSize: 13, showLegend: false,
    showValAxisTitle: true, valAxisTitle: 'error (lower = better)', valAxisTitleFontSize: 13,
    showCatAxisTitle: true, catAxisTitle: 'compute used for training (each step = 10× more)', catAxisTitleFontSize: 13,
  });
  const call = d.text(s, [{ text: 'Each 10× more compute', options: { bold: true, color: HEX.text, breakLine: true } }, { text: '→ about 11% less error', options: { bold: true, color: HEX.red } }], { x: MX + 3.9, y: 2.25, w: 3.1, h: 0.75, fontSize: 18, valign: 'top' });
  const callNote = d.text(s, '(our arithmetic from the paper’s fitted curve)', { x: MX + 3.9, y: 3.0, w: 3.1, h: 0.3, fontSize: 12, color: d.S.muted, italic: true });

  // right: the original figure + what it does / doesn't say
  const rx = 8.2, rw = W - MX - rx;
  const fig = await d.frame(s, D('kaplan_compute.png'), { x: rx, y: 1.75, w: 2.1, h: 1.9 }, { pad: 0.05 });
  const figL = d.text(s, 'The original chart (Kaplan et al., 2020). Each blue line is one model learning.', { x: rx + 2.25, y: 1.8, w: rw - 2.25, h: 1.8, fontSize: 14, color: d.S.muted, valign: 'middle' });
  const says = [box(d, s, rx, 3.85, rw, 1.17, { fill: TINT.teal, line: HEX.teal }),
    d.text(s, [{ text: 'WHAT IT SAYS', options: { fontSize: 12, bold: true, color: HEX.teal, charSpacing: 2, breakLine: true, paraSpaceAfter: 2 } }, { text: 'Grow data, model size and compute together, and error falls smoothly and predictably.', options: { fontSize: 16, color: HEX.text } }], { x: rx + 0.18, y: 3.9, w: rw - 0.3, h: 1.07, valign: 'top' })];
  const not = [box(d, s, rx, 5.15, rw, 1.32, { fill: TINT.red, line: HEX.red }),
    d.text(s, [{ text: 'WHAT IT DOESN’T SAY', options: { fontSize: 12, bold: true, color: HEX.red, charSpacing: 2, breakLine: true, paraSpaceAfter: 2 } },
      { text: 'Which new skills will appear. And 10× compute is a steady, modest gain, not a 10× smarter model.', options: { fontSize: 16, color: HEX.text } }], { x: rx + 0.18, y: 5.2, w: rw - 0.3, h: 1.22, valign: 'top' })];
  src(d, s, 'Kaplan et al. (2020), Scaling Laws for Neural Language Models, Fig. 1 (line redrawn from its fit) · Hoffmann et al. (2022), “Chinchilla”');
  d.animate(s, [chL, chart], { auto: true, effect: 'wipeLeft', dur: 1200 });
  d.animate(s, [call, callNote], { effect: 'zoom', dur: 400 });
  d.animate(s, [...fig, figL], { effect: 'fade' });
  d.animate(s, says, { effect: 'rise' });
  d.animate(s, not, { effect: 'rise' });
  notes(s, {
    min: '2.0', clock: '30.5–32.5',
    build: 'The curve draws in automatically. Click 1: “each 10× → about 11% less error”. Click 2: the original chart. Click 3: what it says. Click 4: what it doesn’t say.',
    say: 'In 2020, researchers at OpenAI, Jared Kaplan and colleagues, found something remarkable. When they made language models bigger, gave them more text and more compute, the error on new test text went down along a smooth, predictable curve. This line is redrawn from their paper. Each step to the right is ten times more compute. [Click.] Notice the gains: each 10× more compute cut the error by about 11%. Steady, but modest. [Click.] Here is their original chart, so you can see it is real. [Click.] So the lesson: grow data, model size and compute together, and the error falls predictably. That is why labs spend billions: they can roughly predict what a bigger run buys. In 2022 DeepMind’s “Chinchilla” paper refined the recipe: for the best result, grow the model and the training data equally. Double one, double the other. [Click.] What it does NOT tell you: which new skills will show up. And ten times more compute does not mean a ten-times-smarter model.',
    analogy: 'Like practising free throws: the first hours help a lot, and each extra ten-times-more practice still helps, but by a steady, smaller amount.',
    ask: '“If 10× compute gives about 11% less error, why do labs keep spending more?” Expected: small error drops can unlock big new abilities; competition; it is predictable, so it feels like a safe bet.',
    advanced: 'Kaplan et al. abstract: “The loss scales as a power-law with model size, dataset size, and the amount of compute used for training, with some trends spanning more than seven orders of magnitude.” Fit: L = (C/2.3×10⁸)^−0.050 (C in petaflop-days, the figure’s legend; Eq. 1.3 gives 3.1×10⁸). 10^−0.05 ≈ 0.891, so each 10× compute → about 11% lower loss (our arithmetic). Chinchilla (Hoffmann et al. 2022): “for every doubling of model size the number of training tokens should also be doubled”; Chinchilla (70B parameters, 1.4T tokens) beat the 280B Gopher with the same compute. A 2024 replication (Besiroglu et al.) found one of Chinchilla’s three methods inconsistent with the other two. Schaeffer et al. (2023) argued some “emergent abilities” are partly an artefact of how they are measured. Since 2024 labs also scale reinforcement learning and “thinking time”, and experts debate how much more pretraining scaling will help.',
    terms: 'scaling law, test error (loss on text the model never saw), compute.',
    caveats: 'The curve is redrawn from the paper’s published fit over the figure’s range (no new numbers); the y-axis values are hidden because the loss units are not meaningful to students. “About 11%” is our arithmetic from the exponent 0.050. Predictable error does not mean predictable new skills.',
    sources: ['https://arxiv.org/abs/2001.08361 (Kaplan et al. 2020, Fig. 1 p. 3)', 'https://arxiv.org/abs/2203.15556 (Hoffmann et al. 2022, Chinchilla)', 'https://arxiv.org/abs/2404.10102 (Chinchilla replication)', 'https://arxiv.org/abs/2304.15004 (Schaeffer et al. 2023)', 'https://openai.com/index/learning-to-reason-with-llms/'],
  });
  return s;
}

// =====================================================================================
// PART 1 · 15  Training electricity (adapted from economy:trainingSlide, adult slide 10)
function tag(d, s, text, x, y, fill) {
  const r = d.name('tag');
  const w = 0.2 + text.length * 0.13;
  s.addShape(d.pres.shapes.RECTANGLE, { x, y, w, h: 0.4, fill: { color: fill }, line: { color: fill, width: 0 }, objectName: r });
  const t = d.text(s, text, { x, y, w, h: 0.4, fontSize: 14, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', charSpacing: 2 });
  return [r, t];
}

async function trainingEnergySlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  kicker(s, K(15));
  title(s, 'One training run ≈ 3–4 days of NYC electricity');
  const bt = await beat(d, s, 'HANDS UP');
  // left: the headline + the guess
  const lw = 4.15;
  const clip = await d.frame(s, D('pcgamer_astra_head.png'), { x: MX, y: 1.82, w: lw, h: 2.3 }, { rot: -1.5, pad: 0.06 });
  const qy = 4.42, qh = 2.05;
  const quiz = [box(d, s, MX, qy, lw, qh, { fill: TINT.amber, line: HEX.amber, lw: 1.25 })];
  quiz.push(d.text(s, 'GUESS: HOW MANY TIMES MORE ELECTRICITY THAN GPT-3’S TRAINING (2020)?', { x: MX + 0.18, y: qy + 0.1, w: lw - 0.3, h: 0.55, fontSize: 12, bold: true, color: HEX.amber, charSpacing: 1, valign: 'top' }));
  ['A · 3×', 'B · 30×', 'C · 300×'].forEach((t, i) => {
    const x = MX + 0.18 + i * 1.3;
    quiz.push(box(d, s, x, qy + 0.72, 1.18, 0.5, { fill: HEX.card2, line: HEX.amber }));
    quiz.push(d.text(s, t, { x, y: qy + 0.72, w: 1.18, h: 0.5, fontSize: 18, bold: true, color: HEX.text, align: 'center', valign: 'middle' }));
  });
  const ans = [d.text(s, '≈ 280×', { x: MX + 0.18, y: qy + 1.3, w: 1.75, h: 0.65, fontSize: 32, bold: true, color: d.S.red, fontFace: 'Arial', valign: 'middle' }),
    d.text(s, '≈ 1.8 GWh → ≈ 503 GWh (Epoch AI estimates)', { x: MX + 1.95, y: qy + 1.3, w: lw - 2.1, h: 0.65, fontSize: 14, color: HEX.text, valign: 'middle' })];

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
  const fillT = d.text(s, [{ text: '▲ GPT-6 Astra’s training run ≈ 3.7 days ', options: { bold: true, color: HEX.red } }, { text: 'of NYC’s electricity', options: { color: HEX.text } }],
    { x: rx, y: by + bh + 0.32, w: rw, h: 0.34, fontSize: 16, valign: 'middle' });
  const wy = by + bh + 0.86, w0 = rx + 2.16 * (bw + gap), w1 = rx + 6.14 * (bw + gap);
  const whisk = [seg(d, s, w0, wy, w1, wy, { color: HEX.muted, width: 1.25 }), seg(d, s, w0, wy - 0.07, w0, wy + 0.07, { color: HEX.muted, width: 1.25 }), seg(d, s, w1, wy - 0.07, w1, wy + 0.07, { color: HEX.muted, width: 1.25 })];
  whisk.push(d.text(s, 'plausible range ≈ 2–6 days', { x: w0, y: wy + 0.06, w: w1 - w0, h: 0.28, fontSize: 12, color: d.S.muted, align: 'center', valign: 'top' }));

  const lab3 = label(d, s, 'SAME YARDSTICK, EARLIER RECORD RUNS', rx, 4.36, rw);
  const ty = 4.72, th = 1.18, ag = 0.12, cw = 1.38;
  const trend = [['GPT-3 · 2020', '~19 min'], ['GPT-4 · 2023', '~8 hours'], ['Grok 3 · 2025', '~1.7 days'], ['GPT-6 Astra · 2026', '~3.7 days']];
  const tgroups = [];
  trend.forEach(([m, v], i) => {
    const x = rx + i * (cw + ag), g = [d.card(s, { x, y: ty, w: cw, h: th })];
    g.push(d.text(s, m, { x: x + 0.1, y: ty + 0.08, w: cw - 0.16, h: 0.5, fontSize: 13, color: d.S.muted, valign: 'top' }));
    g.push(d.text(s, v, { x: x + 0.1, y: ty + 0.62, w: cw - 0.12, h: 0.48, fontSize: 18, bold: true, color: i === 3 ? d.S.red : HEX.text, fontFace: 'Arial', valign: 'middle' }));
    if (i < 3) g.push(d.text(s, '›', { x: x + cw, y: ty, w: ag, h: th, fontSize: 20, color: d.S.steel, align: 'center', valign: 'middle' }));
    tgroups.push(g);
  });
  const fx = rx + 4 * (cw + ag), fw = W - MX - fx;
  const fut = [d.card(s, { x: fx, y: ty, w: fw, h: th }, { color: '2A1416', line: HEX.red })];
  fut.push(d.text(s, '2030 · FORECAST', { x: fx + 0.1, y: ty + 0.08, w: fw - 0.2, h: 0.28, fontSize: 12, bold: true, color: d.S.red, charSpacing: 1, valign: 'top' }));
  fut.push(d.text(s, '4–16 GW', { x: fx + 0.1, y: ty + 0.36, w: fw - 0.2, h: 0.42, fontSize: 20, bold: true, color: d.S.red, fontFace: 'Arial', valign: 'middle' }));
  fut.push(d.text(s, 'for one run', { x: fx + 0.1, y: ty + 0.8, w: fw - 0.16, h: 0.3, fontSize: 12, color: HEX.text, valign: 'top' }));
  const caveat = d.text(s, 'Each tile: how long NYC takes to use that run’s electricity, not how long the run took.', { x: rx, y: 5.95, w: rw, h: 0.55, fontSize: 16, color: d.S.muted, valign: 'middle' });
  src(d, s, 'Sources: PC Gamer, Sep 7, 2026 · Fortune, Sep 3 · Epoch AI model database & Epoch AI/EPRI (Aug 2025) · NYISO 2026 Gold Book (Zone J) · arithmetic in notes');

  d.animate(s, clip, { auto: true, effect: 'slam', dur: 450 });
  d.animate(s, [...quiz, ...bt], { auto: true, effect: 'fade', after: 200 });
  d.animate(s, ans, { effect: 'zoom', dur: 400 });
  d.animate(s, [lab1, lab2, ...week], { effect: 'fade', dur: 400 });
  d.animate(s, [...segs.map((name, i) => ({ name, delay: i * 340, dur: i < 3 ? 340 : 230 })), { name: fillT, delay: 1300, dur: 400, effect: 'fade' }], { auto: true, effect: 'wipeLeft', after: 150 });
  d.animate(s, whisk, { effect: 'fade' });
  d.animate(s, [lab3, ...tgroups.flatMap((g, i) => g.map((name) => ({ name, delay: i * 220 }))), caveat], { effect: 'rise' });
  d.animate(s, fut, { effect: 'zoom', dur: 450 });
  notes(s, {
    min: '2.0', clock: '32.5–34.5 (beat at about minute 33)',
    build: 'The headline and the guess show automatically. Click 1: the answer (≈ 280×). Click 2: one week of NYC electricity, then GPT-6 Astra fills in. Click 3: the plausible range. Click 4: earlier runs on the same yardstick. Click 5: the 2030 forecast.',
    say: 'All that compute needs electricity. In September, Nvidia’s boss Jensen Huang said 100,000 Nvidia chips were used to train OpenAI’s newest model, GPT-6 Astra. Guess: how many times more electricity did its training use than GPT-3’s, back in 2020? A: 3 times. B: 30 times. C: 300 times. Hands up! [Count roughly.] [Click.] About 280 times: roughly 1.8 gigawatt-hours for GPT-3 versus about 503 for GPT-6 Astra. These are estimates by Epoch AI, because OpenAI has not said. So C was closest. [Click.] How much is 503 gigawatt-hours? Here is one week of all of New York City’s electricity. GPT-6 Astra’s training run equals about three to four days of it. [Click.] Because it is an estimate, the honest range is about 2 to 6 days. [Click.] And the same yardstick for earlier record runs: GPT-3, about 19 minutes of New York City’s electricity; GPT-4, about 8 hours; Grok 3, about 1.7 days. Careful: these tiles show how long the city would take to use the same amount of electricity, not how long training took. [Click.] Epoch AI forecasts that by 2030 the biggest single training runs may draw 4 to 16 gigawatts. That is a forecast, not a fact.',
    analogy: 'Measure each run in “New York City time”: how long the whole city takes to use the same electricity.',
    ask: 'The A/B/C guess. Expected: many pick B (30×); the answer is about 280×, closest to C. Follow-up: “Who pays for this electricity, and where does it come from?” (open question).',
    advanced: 'ARITHMETIC (Epoch AI power draw × Epoch training time; NYC = NYISO Zone J, 50,104 GWh in 2025 = 5.72 GWh per hour = 137.3 GWh per day, 961 GWh per week): GPT-3 5.1 MW × 355 h = 1.81 GWh ≈ 19 minutes of NYC; GPT-4 19.9 MW × 2,280 h = 45.5 GWh ≈ 8 hours; Grok 3 110 MW × 2,160 h = 237.5 GWh ≈ 1.7 days; GPT-6 Astra 232.7 MW × 2,160 h (Epoch’s assumed 90 days) = 502.6 GWh ≈ 3.66 days. 502.6 ÷ 1.81 ≈ 280. Plausible range for Astra: 206 MW × 60 days = 297 GWh (2.2 days) to 292.7 MW × 120 days = 843 GWh (6.1 days). Epoch AI/EPRI (Aug 11, 2025): training power has grown about 2.2× a year and “the largest individual frontier training runs in 2030 will likely draw 4-16 gigawatts (GW) of power”.',
    terms: 'GPU (a chip built for AI maths), training run (one full training of a model), GWh (gigawatt-hour: a million kilowatt-hours, a unit of energy).',
    caveats: 'Say “3 to 4 days”, never “a week”: the adult deck’s notes show “a week of NYC’s electricity” overstates it by about 2×. All four tiles are Epoch AI estimates, not company disclosures, and cover pretraining only. OpenAI said “more than 100,000 GPUs” (Aidan Clark to Fortune, Sep 3, 2026); the 90-day duration is Epoch’s assumption. The 2030 tile is a forecast.',
    sources: ['https://www.pcgamer.com/software/ai/jensen-huang-says-100-000-nvidia-gpus-were-used-to-train-openais-latest-model-gpt-6-astra-and-theres-already-plans-to-bring-quadruple-that-amount-of-hardware-online/', 'https://fortune.com/2026/09/03/openai-debuts-gpt-6-astra-computer-use-greg-brockman-says-start-of-agi/', 'https://epoch.ai/data/all_ai_models.csv', 'https://epoch.ai/data/ai-models-documentation/estimation', 'https://www.nyiso.com/documents/20142/2226333/2026-Gold-Book-Public.pdf', 'https://epoch.ai/publications/power-demands-of-frontier-ai-training'],
  });
  return s;
}

// PART 1 · 16  How big is a gigawatt? (adapted from economy:gigawattSlide, adult slide 9)
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
  kicker(s, K(16));
  title(s, 'How big is a gigawatt?');
  const lx = MX, lw = 6.6, vw = 2.45, ix = lx + vw + 0.25, iw = lx + lw - ix;
  const lab = label(d, s, 'ONE GIGAWATT, RUNNING NONSTOP, IS ROUGHLY…', lx, 1.7, lw, { color: d.S.amber });
  const rowY = [2.1, 3.22, 4.34, 5.46];
  const val = (y, v, l) => [
    d.text(s, v, { x: lx, y, w: vw, h: 0.56, fontSize: 32, bold: true, color: d.S.amber, fontFace: 'Arial', valign: 'bottom' }),
    d.text(s, l, { x: lx, y: y + 0.6, w: vw, h: 0.42, fontSize: 16, color: d.S.muted, valign: 'top' }),
  ];
  const rows = [];
  {
    const y = rowY[0], sz = 0.46, step = 0.43;
    const r = val(y, '≈ 850,000', 'average US homes');
    for (let i = 0; i < 9; i++) r.push(await iconImg(d, s, 'PiHouseFill', '#F2F3F5', ix + i * step, y + 0.1, sz, i === 8 ? 0.5 : 1));
    r.push(d.text(s, 'each icon = 100,000 homes', { x: ix, y: y + 0.64, w: iw, h: 0.3, fontSize: 12, color: d.S.steel, valign: 'top' }));
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
    r.push(await iconImg(d, s, 'LuDam', '#F2F3F5', ix, y + 0.12, 0.7));
    r.push(await iconImg(d, s, 'LuDam', '#F2F3F5', ix + 0.8, y + 0.12, 0.7));
    r.push(d.text(s, 'Hoover Dam makes about 480 MW on average (2,080 MW flat out)', { x: ix + 1.65, y: y - 0.02, w: iw - 1.65, h: 1.05, fontSize: 16, color: d.S.muted, valign: 'middle' }));
    rows.push(r);
  }
  {
    const y = rowY[3], k = iw / 1.25, by = y + 0.12, bh = 0.42;
    const r = val(y, '1.2 GW', 'one AI campus');
    const one = d.name('bar');
    s.addShape(d.pres.shapes.RECTANGLE, { x: ix, y: by, w: k, h: bh, fill: { color: HEX.amber }, line: { color: HEX.amber, width: 0.75 }, objectName: one });
    const ext = d.name('bar');
    s.addShape(d.pres.shapes.RECTANGLE, { x: ix + k, y: by, w: 0.2 * k, h: bh, fill: { color: HEX.red }, line: { color: HEX.red, width: 0.75 }, objectName: ext });
    r.push(one, ext, d.text(s, '1 GW', { x: ix, y: by, w: k, h: bh, fontSize: 16, bold: true, color: HEX.ink, align: 'center', valign: 'middle' }));
    r.push(d.text(s, 'Stargate Abilene: 1.2 GW campus', { x: ix, y: by + bh + 0.06, w: iw, h: 0.32, fontSize: 16, color: HEX.text, valign: 'top' }));
    rows.push(r);
  }
  const rx = 7.62, rw = W - MX - rx;
  const ph = await d.frame(s, D('hoover_crop.jpg'), { x: rx, y: 1.78, w: rw, h: rw / 1.5 }, { border: false });
  const capR = d.name('capbar');
  s.addShape(d.pres.shapes.RECTANGLE, { x: ph.geom.x, y: ph.geom.y + ph.geom.h - 0.46, w: ph.geom.w, h: 0.46, fill: { color: '000000', transparency: 30 }, line: { color: '000000', width: 0, transparency: 100 }, objectName: capR });
  const capT = d.text(s, [{ text: 'Hoover Dam', options: { bold: true } }, { text: '  ·  2,080 MW max  ·  ~480 MW on average' }], { x: ph.geom.x + 0.14, y: ph.geom.y + ph.geom.h - 0.46, w: ph.geom.w - 0.28, h: 0.46, fontSize: 14, color: 'FFFFFF', valign: 'middle' });
  const sy = ph.geom.y + ph.geom.h + 0.22;
  const watt = d.text(s, [{ text: 'A watt measures power: ', options: { bold: true, color: HEX.text } }, { text: 'how fast energy is used. A gigawatt is 1 billion watts, or about 10 million 100-watt light bulbs.', options: { color: HEX.muted } }], { x: rx, y: sy, w: rw, h: 6.5 - sy, fontSize: 16, valign: 'top' });
  src(d, s, 'Sources: EIA · U.S. DOE · U.S. Bureau of Reclamation · Crusoe · Photo: Mariordo / Wikimedia Commons, CC BY-SA 4.0 (cropped)');
  d.animate(s, [lab, ...rows[0], ...ph, capR, capT], { auto: true, effect: 'fade', dur: 600 });
  for (let i = 1; i < 4; i++) d.animate(s, rows[i], { effect: 'rise', dur: 500 });
  d.animate(s, [watt], { effect: 'fade' });
  notes(s, {
    min: '1.5', clock: '34.5–36',
    build: 'Homes and the photo show automatically. Click 1: one reactor. Click 2: two Hoover Dams. Click 3: the 1.2 GW AI campus. Click 4: what a watt is.',
    say: 'AI companies now talk about data centres in gigawatts. What does that mean? One gigawatt, running nonstop, is about what 850,000 average American homes use. [Click.] It is what one typical nuclear reactor produces, according to the U.S. Department of Energy. [Click.] It is about two Hoover Dams. That is the giant dam in the photo, on average, since it makes about 480 megawatts most of the time. [Click.] And one AI campus being built in Abilene, Texas, called Stargate Abilene, is a 1.2-gigawatt campus. More than a nuclear reactor’s worth of power, for one site. [Click.] One quick science point: a watt measures power, how fast energy is used. A gigawatt is a billion watts. Energy is power times time, which is why the last slide used gigawatt-hours.',
    analogy: 'Power is like the speed water flows out of a tap; energy is how much water fills the bucket. Power × time = energy.',
    ask: '“How many of your homes would one gigawatt run?” Expected: about 850,000, so a whole big city’s worth of homes.',
    advanced: 'Homes: EIA says the average US residential customer used 863 kWh per month in 2024 → 10,356 kWh a year → an average draw of about 1.18 kW; 1 GW ÷ 1.18 kW ≈ 846,000. “Homes” is an average: at peak hours (hot afternoons) a gigawatt covers fewer. Hoover Dam: nameplate capacity “about 2,080 megawatts”, average generation about 4.2 billion kWh a year ÷ 8,760 h ≈ 480 MW (U.S. Bureau of Reclamation). Company build-out figures are company statements: Meta says its Hyperion campus “will be able to scale up to 5GW”; Anthropic’s deal with Amazon is for “up to 5 gigawatts (GW) of capacity”.',
    terms: 'watt (a unit of power), gigawatt (1 billion watts), megawatt (1 million watts), energy = power × time.',
    caveats: 'All equivalences are rounded averages. 1.2 GW is the Abilene campus total (Crusoe), not just chip power. Photo: Hoover Dam aerial, 22 Sep 2017, by Mariordo (Mario Roberto Durán Ortiz), CC BY-SA 4.0, cropped. The light-bulb line is arithmetic (1,000,000,000 W ÷ 100 W).',
    sources: ['https://www.eia.gov/electricity/sales_revenue_price/pdf/table_5A.pdf', 'https://www.energy.gov/ne/articles/infographic-how-much-power-does-nuclear-reactor-produce', 'https://www.usbr.gov/lc/hooverdam/faqs/powerfaq.html', 'https://www.crusoe.ai/resources/newsroom/crusoe-announces-flagship-abilene-data-center-is-live', 'https://www.anthropic.com/news/anthropic-amazon-compute', 'https://commons.wikimedia.org/wiki/File:2017_Aerial_view_Hoover_Dam_4771.jpg'],
  });
  return s;
}

// PART 1 · 17  Stargate Abilene (adapted from economy:abileneSlide, adult slide 8) — OPTIONAL
async function abileneSlide(d) {
  const s = d.slide('Content', { transition: 'pushLeft' });
  kicker(s, K(17));
  title(s, '2 buildings became 8 in 13 months');
  const gap = 0.5, iw = (W - 2 * MX - gap) / 2, ih = iw * 720 / 1280, y0 = 1.76;
  const before = await d.frame(s, RE('epoch_sat_stargate_abilene_2025-06.png'), { x: MX, y: y0, w: iw, h: ih }, { border: false });
  const t1 = tag(d, s, 'JUNE 2025', before.geom.x + 0.15, before.geom.y + 0.15, '1D222C');
  const after = await d.frame(s, RE('epoch_sat_stargate_abilene_2026-07.png'), { x: MX + iw + gap, y: y0, w: iw, h: ih }, { border: false });
  const t2 = tag(d, s, 'JULY 2026', after.geom.x + 0.15, after.geom.y + 0.15, HEX.red);
  const arrow = d.name('arrow');
  s.addShape(d.pres.shapes.RIGHT_ARROW, { x: MX + iw + 0.1, y: y0 + ih / 2 - 0.16, w: gap - 0.2, h: 0.32, fill: { color: HEX.red }, line: { color: HEX.red, width: 0 }, objectName: arrow });
  const by = y0 + ih + 0.28, cw3 = (W - 2 * MX - 0.6) / 3;
  const st = (x, v, l, color) => [
    d.text(s, v, { x, y: by, w: cw3, h: 0.62, fontSize: 36, bold: true, color, fontFace: 'Arial', valign: 'bottom' }),
    d.text(s, l, { x, y: by + 0.66, w: cw3, h: 0.6, fontSize: 16, color: d.S.muted, valign: 'top' }),
  ];
  const st1 = st(MX, '2 → 8', 'buildings finished: June 2025 vs. July 2026', HEX.text);
  const st2 = st(MX + cw3 + 0.3, '1.2 GW', 'power for the whole campus, not just the chips', HEX.red);
  const who = d.text(s, [{ text: 'Abilene, Texas. ', options: { bold: true, color: HEX.text } }, { text: 'Built by the developer Crusoe for Oracle and OpenAI. Construction began in June 2024.', options: { color: d.S.muted } }], { x: MX + 2 * (cw3 + 0.3), y: by + 0.05, w: cw3, h: 1.2, fontSize: 16, valign: 'top' });
  src(d, s, 'Satellite imagery © Airbus DS via Epoch AI (annotations by Epoch AI) · Crusoe newsroom, Sep 30, 2025');
  d.animate(s, [...before, ...t1], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, [arrow], { effect: 'wipeLeft', dur: 400 });
  d.animate(s, [...after, ...t2], { auto: true, effect: 'fade', dur: 1200 });
  d.animate(s, st1, { auto: true, effect: 'rise', after: 200 });
  d.animate(s, [...st2, who], { effect: 'rise' });
  notes(s, {
    min: '1.0 (OPTIONAL: cut first if running late; give its minute to the scaling-laws slide)', clock: '36–37',
    build: 'June 2025 shows automatically. Click 1: the arrow, then July 2026 and “2 → 8” appear automatically. Click 2: 1.2 GW and who built it.',
    say: 'Here is what that looks like from space. Same place, same scale, 13 months apart. In June 2025, two buildings were finished. [Click.] By July 2026, all eight. Each of those buildings is full of AI chips. The whole campus is designed for 1.2 gigawatts. It was built by a company called Crusoe for Oracle and OpenAI. This is where GPT-6 Astra was trained, according to Epoch AI and press reports.',
    ask: '“What would your town need to supply a building like this?” Expected: electricity, water for cooling, land, workers, roads.',
    advanced: 'Epoch AI estimates for the site (Oct 2026): about 421 MW of IT (chip and server) power today, projected 843 MW by late 2026. 1.2 GW is total campus power; IT power is lower, so don’t confuse them.',
    terms: 'data centre (a building full of computers), campus (a group of buildings).',
    caveats: 'Imagery © Airbus DS via Epoch AI; the coloured outlines are Epoch AI’s annotations. OpenAI itself says only “our Stargate site in Texas”; linking Astra to Abilene is Epoch’s and the press’s attribution. VIDEO (link only, not on the slide; 42 minutes, too long for class): Bloomberg Originals, “Inside OpenAI’s Stargate Megafactory with Sam Altman | The Circuit”, https://www.youtube.com/watch?v=GhIJs4zbH0o',
    sources: ['https://epoch.ai/data/ai-data-centers/directory/openai-stargate-abilene', 'https://www.crusoe.ai/resources/newsroom/crusoe-announces-flagship-abilene-data-center-is-live'],
  });
  return s;
}

// PART 1 · 18  Grown, not built
async function grownSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(18));
  title(s, 'Nobody typed in the rules: it was grown');
  const bt = await beat(d, s, 'TURN & TALK', 'FaUserFriends');
  const lw = 5.75;
  const clip = await d.frame(s, D('amodei_grown.png'), { x: MX, y: 1.8, w: lw, h: 2.3 }, { pad: 0.07, frameColor: 'F1EEE7' });
  const cg = clip.geom;
  // native highlight over "grown more than they are built" (source px: line 1 x≈888–1078, y≈80–122; line 2 x≈0–292, y≈145–187)
  const sx = cg.w / 1160, sy = cg.h / 450;
  const hl = [[888, 78, 1080, 124], [0, 143, 296, 189]].map(([x0, y0, x1, y1]) => {
    const n = d.name('hl');
    s.addShape(d.pres.shapes.RECTANGLE, { x: cg.x + x0 * sx, y: cg.y + y0 * sy, w: (x1 - x0) * sx, h: (y1 - y0) * sy, fill: { color: HEX.amber, transparency: 62 }, line: { color: HEX.amber, width: 0, transparency: 100 }, objectName: n });
    return n;
  });
  const clipL = d.text(s, 'Dario Amodei (CEO of Anthropic), “The Urgency of Interpretability”, April 2025', { x: MX, y: cg.y + cg.h + 0.12, w: lw, h: 0.3, fontSize: 12, color: d.S.steel, italic: true });
  const body = d.text(s, [
    { text: 'Engineers choose the data, the method and the compute. ', options: { bold: true, color: HEX.text } },
    { text: 'Nobody writes the individual rules. They sit in billions of learned dials, so even the makers can’t fully explain one answer.', options: { color: HEX.muted } },
  ], { x: MX, y: 4.62, w: lw, h: 1.0, fontSize: 16, valign: 'top' });

  const rx = 6.75, rw = W - MX - rx;
  const il = label(d, s, 'INTERPRETABILITY = RESEARCH THAT READS INSIDE MODELS', rx, 1.7, rw, { color: d.S.amber });
  const gg = await d.frame(s, D('ggc_head.png'), { x: rx, y: 2.08, w: 2.9, h: 1.7 }, { pad: 0.05 });
  const ggT = d.text(s, [
    { text: '2024: ', options: { bold: true, color: HEX.amber } },
    { text: 'Anthropic found a “Golden Gate Bridge” feature inside Claude. Turned up, Claude mentioned the bridge in most answers, even off-topic ones.', options: { color: HEX.text } },
  ], { x: rx + 3.1, y: 2.0, w: rw - 3.1, h: 1.9, fontSize: 16, valign: 'middle' });
  const prog = d.text(s, [
    { text: 'Real progress, ', options: { bold: true, color: HEX.text } },
    { text: 'from 2023’s “Towards Monosemanticity” to today. ', options: { color: HEX.muted } },
    { text: 'Far from complete: ', options: { bold: true, color: HEX.text } },
    { text: 'experts disagree about how close we are.', options: { color: HEX.muted } },
  ], { x: rx, y: 4.05, w: rw, h: 1.0, fontSize: 16, valign: 'top' });
  const by = 5.72;
  const bar = [box(d, s, MX, by, W - 2 * MX, 0.75, { fill: TINT.amber, line: HEX.amber, lw: 1.25 })];
  bar.push(await ic(d, s, 'FaUserFriends', HEX.amber, MX + 0.2, by + 0.18, 0.4));
  bar.push(d.text(s, [{ text: 'Think, pair, share (45 s): ', options: { bold: true, color: HEX.amber } }, { text: 'if you can’t read a model’s rules, how would you check that it’s safe?', options: { bold: true, color: HEX.text } }], { x: MX + 0.75, y: by, w: W - 2 * MX - 0.9, h: 0.75, fontSize: 18, valign: 'middle' }));
  src(d, s, 'Sources: D. Amodei, “The Urgency of Interpretability” (Apr 2025) · Anthropic, “Golden Gate Claude” (May 23, 2024) · Bricken et al., “Towards Monosemanticity” (Oct 4, 2023)');
  d.animate(s, [...clip, clipL], { auto: true, effect: 'fade' });
  d.animate(s, hl, { auto: true, effect: 'wipeLeft', after: 300, dur: 700 });
  d.animate(s, [body], { effect: 'fade' });
  d.animate(s, [il, ...gg, ggT], { effect: 'fade' });
  d.animate(s, [prog], { effect: 'fade' });
  d.animate(s, [...bar, ...bt], { effect: 'zoom', dur: 400 });
  notes(s, {
    min: '2.0', clock: '37–39 (beat at about minute 38)',
    build: 'The essay clipping shows and its key words highlight automatically. Click 1: the explanation. Click 2: Golden Gate Claude. Click 3: progress so far. Click 4: think-pair-share.',
    say: 'Here is the most important idea of Part 1. The CEO of Anthropic, the company that makes Claude, wrote this last year, quoting his co-founder Chris Olah: AI systems are “grown more than they are built.” [Click.] Engineers choose the data, the method and the compute, like a gardener choosing soil, water and sunlight. But nobody writes the individual rules. Those end up spread across billions of learned dials. So even the people who made a model cannot fully explain why it gave one particular answer. [Click.] There is a whole research field trying to read inside models. It is called interpretability. One famous result: in 2024 Anthropic found a feature inside Claude that lights up for the Golden Gate Bridge. When they turned that feature way up, Claude started mentioning the bridge in most of its answers, even off-topic ones. They let the public try it for 24 hours. [Click.] So there is real progress. But we are far from being able to read everything inside a model, and experts disagree about how close we are. [Click.] Think, pair, share, 45 seconds: if you can’t read a model’s rules, how would you check that it is safe? [After 45 s, take two or three answers.] And, back to our very first question: what would count as evidence that an AI understands what it says? [Take one or two answers.] Part 2 is how fast all this is moving. Part 3 is why “grown, not built” makes keeping AI aligned with human goals hard.',
    analogy: 'A gardener chooses the soil, water and light, but does not decide where each leaf grows. The plant grows its own shape.',
    ask: '(1) “How would you check that a model is safe if you can’t read its rules?” Good answers: test it a lot (including tricky tests: red-teaming), watch what it does after release, read inside it (interpretability), compare it with other models, limit what it can do. (2) Callback to the hook: “What would count as evidence that it understands?” Good answers: explaining in its own words, handling questions it never saw, admitting when it doesn’t know. Experts still disagree.',
    advanced: 'Amodei, verbatim: “As my friend and co-founder Chris Olah is fond of saying, generative AI systems are grown more than they are built—their internal mechanisms are ‘emergent’ rather than directly designed.” He also writes: “People outside the field are often surprised and alarmed to learn that we do not understand how our own AI creations work.” and sets a goal that “interpretability can reliably detect most model problems” by 2027. Anthropic on features: “we found millions of concepts that activate when the model reads relevant text or sees relevant images, which we call ‘features’.” Towards Monosemanticity (Oct 4, 2023): “Using a sparse autoencoder, we extract a large number of interpretable features from a one-layer transformer.” In 2025 Anthropic also found Claude plans rhymes ahead (it picks “rabbit” before writing the line); their method “only captures a fraction of the total computation”.',
    terms: 'interpretability, feature (one concept inside the network that lights up when the model reads or sees something about it).',
    caveats: 'This is an open research problem with many people working on it; experts disagree about how close we are. Golden Gate Claude was a 24-hour research demo (May 2024) and is no longer available. The amber highlight is a native overlay; the clipping itself is unedited. The essay page shows only “April 2025” (TechCrunch dates it Apr 24, 2025). Anthropic is a company describing its own research.',
    sources: ['https://www.darioamodei.com/post/the-urgency-of-interpretability', 'https://www.anthropic.com/news/golden-gate-claude', 'https://transformer-circuits.pub/2024/scaling-monosemanticity/', 'https://transformer-circuits.pub/2023/monosemantic-features', 'https://www.anthropic.com/research/tracing-thoughts-language-model'],
  });
  return s;
}

// PART 1 · 19  Recap
async function recapSlide(d) {
  const s = d.slide('Content');
  kicker(s, K(19));
  title(s, 'Five things to carry into Part 2');
  const items = [
    ['FaChalkboardTeacher', 'Machine learning means learning from examples, not hand-typed rules.'],
    ['FaSlidersH', 'Neural networks are dials, nudged by gradient descent and backpropagation.'],
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
  const next = d.text(s, [{ text: 'One question, then Part 2: ', options: { bold: true, color: HEX.amber } }, { text: 'how fast is AI moving?', options: { color: HEX.text } }], { x: MX, y: 6.12, w: W - 2 * MX, h: 0.38, fontSize: 18, valign: 'middle' });
  groups.forEach((g, i) => d.animate(s, g, { auto: i === 0, effect: 'rise', after: 100 }));
  d.animate(s, [next], { effect: 'fade' });
  notes(s, {
    min: '1.0', clock: '39–40',
    build: 'Point 1 shows automatically; each click adds the next point. Last click: the bridge to Part 2.',
    say: 'Five things to carry with you. One: machine learning means learning from examples, not hand-typed rules. [Click.] Two: neural networks are huge stacks of dials, nudged by gradient descent and backpropagation. [Click.] Three: LLMs predict the next token; pretraining makes a base model, and post-training turns it into an assistant. [Click.] Four: more data, more compute and better methods bring steady gains, and bigger power needs. [Click.] Five, the big one: we grew these systems, and we can’t yet fully read them. [Click.] I’ll take one question, and then Part 2: how fast is all of this moving?',
    ask: 'Take ONE question (keep it to a minute). If none: “Which of these five surprised you most?”',
    terms: 'none new (recap).',
    caveats: 'No new content on this slide.',
  });
  return s;
}

// =====================================================================================
const slides = {
  titleSlide, hookSlide, roadmapSlide, mlSlide, learningTypesSlide, quizSlide, networkSlide, gradientSlide, backpropSlide,
  nextWordSlide, pretrainSlide, baseModelSlide, postTrainSlide, rewardsSlide, pipelineSlide, ingredientsSlide, scalingSlide,
  trainingEnergySlide, gigawattSlide, abileneSlide, grownSlide, recapSlide,
};

async function build(d) {
  await prep();
  for (const f of Object.values(slides)) await f(d);
}

module.exports = { build, slides };
