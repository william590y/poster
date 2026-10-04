// INSIDE THE MACHINE · frontier: neuralese / latent reasoning, continual learning (TTT-E2E), recursive self-improvement.
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { HEX, W, MX, A, imgSize } = require('./lib');
const { icon } = require('./icons');

const TH = (f) => A('research', 'theory', f);
const ORIG = (f) => A('original', f);
const OUT = A('slides', 'frontier');
const SL = (f) => path.join(OUT, f);
const CX0 = MX, CX1 = W - MX;

// ---------- local helpers ----------
async function crop(src, name, box, padRight = 0) {
  fs.mkdirSync(OUT, { recursive: true });
  const out = SL(name);
  if (!fs.existsSync(out)) {
    let im = sharp(src).extract(box);
    // white margin on the right when the source's own text runs to its edge (page background is pure white)
    if (padRight) im = sharp(await im.png().toBuffer()).extend({ right: padRight, background: '#ffffff' });
    await im.toFile(out);
  }
  return out;
}
// Crop, then Lanczos-upscale (no new content, just a crisper source for PowerPoint's own resampling) + light sharpen.
async function cropUp(src, name, box, k = 2) {
  fs.mkdirSync(OUT, { recursive: true });
  const out = SL(name);
  if (!fs.existsSync(out)) {
    await sharp(src).extract(box).resize(box.width * k, box.height * k, { kernel: 'lanczos3' })
      .sharpen({ sigma: 0.9, m1: 0.6, m2: 1.2 }).png().toFile(out);
  }
  return out;
}

// d.animate now honours `after` (ms gap before a chained auto group) itself.
const anim = (d, s, names, opts = {}) => d.animate(s, names, opts);

function head(s, kicker, title) {
  s.addText(kicker, { placeholder: 'kicker' });
  s.addText(title, { placeholder: 'title' });
}

function capLabel(d, s, text, o) {
  return d.text(s, text, { fontSize: 10, bold: true, color: d.S.steel, charSpacing: 2, h: 0.26, valign: 'bottom', ...o });
}

// Frame height that makes frame() hug the image at a given width.
async function hFor(file, w, pad = 0.06) {
  const n = await imgSize(file);
  return (w - 2 * pad) * n.h / n.w + 2 * pad;
}
async function frameW(d, s, file, x, y, w, o = {}) {
  const h = await hFor(file, w, o.pad ?? 0.06);
  const r = await d.frame(s, file, { x, y, w, h }, o);
  r.h = h;
  return r;
}

// Big number + label below.
function stat(d, s, { x, y, w, value, label, color, valueSize = 44, labelSize = 13, labelH = 0.8 }) {
  const vh = valueSize / 72 * 1.12;
  const n1 = d.text(s, value, { x, y, w, h: vh, fontSize: valueSize, bold: true, color: color || d.S.red, fontFace: 'Arial', valign: 'bottom' });
  const n2 = d.text(s, label, { x, y: y + vh + 0.04, w, h: labelH, fontSize: labelSize, color: d.S.muted, valign: 'top' });
  return [n1, n2];
}

// Big number on the left, label to its right (one row).
function statRow(d, s, { x, y, w, vw, h = 0.8, value, label, color, valueSize = 30, labelSize = 12 }) {
  const n1 = d.text(s, value, { x, y, w: vw, h, fontSize: valueSize, bold: true, color: color || d.S.red, fontFace: 'Arial', valign: 'middle' });
  const n2 = d.text(s, label, { x: x + vw + 0.12, y, w: w - vw - 0.12, h, fontSize: labelSize, color: d.S.muted, valign: 'middle' });
  return [n1, n2];
}

// Quote card: label + serif quote(s) + attribution.
function quoteCard(d, s, box, { label, quotes, attrib, color = HEX.card, valign = 'top' }) {
  const names = [d.card(s, box, { color })];
  const runs = [];
  if (label) runs.push({ text: label, options: { fontSize: 10, bold: true, color: HEX.red, charSpacing: 2, breakLine: true, paraSpaceAfter: 6 } });
  quotes.forEach((q, i) => runs.push({ text: q.text, options: { fontFace: 'Cambria', italic: true, fontSize: q.size || 16, color: q.color || HEX.text, bold: !!q.bold, breakLine: true, paraSpaceAfter: 6 } }));
  if (attrib) runs.push({ text: attrib, options: { fontSize: 11, color: HEX.muted } });
  names.push(d.text(s, runs, { x: box.x + 0.25, y: box.y + 0.18, w: box.w - 0.5, h: box.h - 0.36, valign }));
  return names;
}

// Native rounded "chip".
function chip(d, s, { x, y, w, h, fill, line, text, color, fontSize = 10, mono = false, bold = false }) {
  const n = d.name('chip');
  s.addShape(d.pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.06, fill: { color: fill }, line: { color: line || fill, width: 0.75 }, objectName: n,
  });
  if (!text) return [n];
  const t = d.text(s, text, { x, y, w, h, fontSize, color: color || HEX.text, align: 'center', valign: 'middle', bold, fontFace: mono ? 'Courier New' : undefined });
  return [n, t];
}

function arrow(d, s, x, y, w, color = HEX.steel) {
  const n = d.name('arr');
  s.addShape(d.pres.shapes.LINE, { x, y, w, h: 0, line: { color, width: 1.75, endArrowType: 'triangle' }, objectName: n });
  return n;
}

// Map pixel coords of an image placed by frame() (rotated `rot`° about its centre) to slide inches.
async function pxMap(file, fr, rot = 0) {
  const nat = await imgSize(file), g = fr.geom;
  const cx = g.x + g.w / 2, cy = g.y + g.h / 2, t = rot * Math.PI / 180;
  const f = (px, py) => {
    const dx = g.x + px * g.w / nat.w - cx, dy = g.y + py * g.h / nat.h - cy;
    return { x: cx + dx * Math.cos(t) - dy * Math.sin(t), y: cy + dx * Math.sin(t) + dy * Math.cos(t) };
  };
  f.s = g.w / nat.w; // inches per image px (contain-fit keeps the aspect ratio)
  return f;
}

// Readable native callout chip laid over an image region given in image px [x0, y0, x1, y1].
function pxTag(d, s, P, rot, [x0, y0, x1, y1], runs, { line = HEX.amber, fontSize = 11, align = 'center' } = {}) {
  const c = P((x0 + x1) / 2, (y0 + y1) / 2);
  const w = (x1 - x0) * P.s, h = (y1 - y0) * P.s;
  const box = { x: c.x - w / 2, y: c.y - h / 2, w, h };
  const n = d.name('tag');
  s.addShape(d.pres.shapes.ROUNDED_RECTANGLE, {
    ...box, rotate: rot, rectRadius: 0.05, fill: { color: '0D1016' }, line: { color: line, width: 1.25 },
    shadow: { type: 'outer', color: '000000', blur: 6, offset: 2, angle: 90, opacity: 0.5 }, objectName: n,
  });
  const t = d.text(s, runs, { x: box.x + 0.05, y: box.y, w: w - 0.1, h, rotate: rot, fontSize, bold: true, color: d.S.txt, align, valign: 'middle' });
  return [n, t];
}

// Straight leader line between two slide points, plus an optional ring marking the target point.
function leader(d, s, a, b, color) {
  const n = d.name('lead');
  s.addShape(d.pres.shapes.LINE, {
    x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.max(Math.abs(b.x - a.x), 0.001), h: Math.max(Math.abs(b.y - a.y), 0.001),
    flipV: (b.x - a.x) * (b.y - a.y) < 0, line: { color, width: 1.5 }, objectName: n,
  });
  return n;
}
function ring(d, s, c, r, color) {
  const n = d.name('ring');
  s.addShape(d.pres.shapes.OVAL, { x: c.x - r, y: c.y - r, w: 2 * r, h: 2 * r, line: { color, width: 2 }, objectName: n });
  return n;
}

// Native semi-transparent "highlighter" boxes laid over a screenshot (never painted on its pixels).
// boxes: [[x0, y0, x1, y1], ...] in the RAW capture's px; off = [left, top] of the crop taken from that capture.
function highlight(d, s, P, rot, boxes, off = [0, 0], { color = 'FFC93C', transparency = 55, padX = 5, padY = 1 } = {}) {
  return boxes.map(([x0, y0, x1, y1]) => {
    const a = [x0 - off[0] - padX, y0 - off[1] - padY, x1 - off[0] + padX, y1 - off[1] + padY];
    const c = P((a[0] + a[2]) / 2, (a[1] + a[3]) / 2);
    const w = (a[2] - a[0]) * P.s, h = (a[3] - a[1]) * P.s;
    const n = d.name('hl');
    s.addShape(d.pres.shapes.RECTANGLE, {
      x: c.x - w / 2, y: c.y - h / 2, w, h, rotate: rot, fill: { color, transparency }, line: { color, width: 0, transparency: 100 }, objectName: n,
    });
    return n;
  });
}

// Highlight boxes recorded in the manifest (raw capture px) for one item / phrase.
const RES = (f) => A('research', 'frontier', f);
let _man = null;
function hlPx(id, phrase, W, H) {
  _man = _man || JSON.parse(fs.readFileSync(RES('manifest.json'), 'utf8'));
  const it = _man.items.find(i => i.id === id);
  if (!it) throw new Error('manifest item missing: ' + id);
  let b = it.highlight_boxes_px && it.highlight_boxes_px[phrase];
  // researcher items store fractions (0-1) of the raw image instead
  if (!b && it.highlight_boxes) {
    const e = it.highlight_boxes.find(h => h.text === phrase);
    if (e) b = e.boxes_frac.map(q => [q.x * W, q.y * H, (q.x + q.w) * W, (q.y + q.h) * H]);
  }
  if (!b) throw new Error(`no highlight boxes for ${id}: ${phrase}`);
  return b;
}

// ======================================================================
// 1. NEURALESE · what latent reasoning is (Coconut)
// ======================================================================
async function latentSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'INSIDE THE MACHINE · NEURALESE · 2', 'AI is learning to think without words');

  // Both figures are cropped at native resolution and 2× Lanczos-upscaled so they stay crisp at slide size.
  const f1 = await cropUp(ORIG('image6.png'), 'coconut_training_2x.png', { left: 30, top: 26, width: 1000, height: 314 });
  // Fig. 6: full figure body (graph + panels incl. the "(Correct Path)" row), stopping above the caption.
  const B2 = { left: 22, top: 30, width: 984, height: 464 }, K2 = 2;
  const f2 = await cropUp(ORIG('image7.png'), 'coconut_prosqa_2x.png', B2, K2);
  const o7 = ([x0, y0, x1, y1]) => [(x0 - B2.left) * K2, (y0 - B2.top) * K2, (x1 - B2.left) * K2, (y1 - B2.top) * K2];

  // figure 1 (training procedure) top-left, figure 2 (case study) bottom-right, shown large and unrotated.
  // Fig2 tucks over fig1's empty lower-right corner (fig1 content ends at ~74% of its width below the legend).
  const w1 = 6.4;
  const fig1 = await frameW(d, s, f1, CX0, 1.85, w1, { rot: -1 });
  const w2 = 7.2, h2 = await hFor(f2, w2);
  const fig2 = await frameW(d, s, f2, CX1 - w2, 6.5 - h2, w2);
  // Readable callouts laid over Fig. 6's own tiny "(Hallucination)" / "(Correct Path)" labels (image7 px coords),
  // both kept inside the figure.
  const P2 = await pxMap(f2, fig2, 0);
  const tagCot = pxTag(d, s, P2, 0, o7([737, 317, 990, 349]), [
    { text: 'CoT: hallucinated rule ', options: { color: 'FF6B6B' } }, { text: '✗', options: { color: 'FF6B6B' } },
  ], { line: HEX.red });
  // Only Coconut with TWO continuous thoughts (k=2) is right; k=1 ends at the wrong node (paper, Fig. 6 caption).
  const tagCoco = pxTag(d, s, P2, 0, o7([628, 447, 995, 477]), [
    { text: '2 continuous thoughts: correct ', options: { color: '8FD694' } }, { text: '✓', options: { color: '8FD694' } },
  ], { line: '5FB86A' });

  // top-right explanation
  const tx = CX0 + w1 + 0.35, tw = CX1 - tx;
  const t1 = d.text(s, [
    { text: 'WHAT IS LATENT REASONING?', options: { fontSize: 10, bold: true, color: d.S.steel, charSpacing: 2, breakLine: true, paraSpaceAfter: 6 } },
    { text: 'Reasoning models “think out loud” in words we can read. ', options: { color: d.S.txt } },
    { text: 'Coconut swaps those words, step by step, for ', options: { color: d.S.muted } },
    { text: 'continuous thoughts', options: { color: d.S.red, bold: true } },
    { text: ': raw vectors fed straight back into the network.', options: { color: d.S.muted } },
  ], { x: tx, y: 1.74, w: tw, h: 1.0, fontSize: 15, valign: 'top' });

  // bottom-left takeaways
  const bx = CX0, bw = CX1 - w2 - 0.4 - CX0;
  // The hallucinated rule is quoted here at body size (the figure's own text renders too small for the room).
  const t2 = d.text(s, [
    { text: 'THE PAYOFF', options: { fontSize: 10, bold: true, color: d.S.steel, charSpacing: 2, breakLine: true, paraSpaceAfter: 4 } },
    { text: 'On this logic puzzle, word-by-word reasoning invented a fact: ', options: { color: d.S.muted } },
    { text: '“Every yumpus is a rempus.”', options: { color: 'FF6B6B', bold: true } },
    { text: ' With ', options: { color: d.S.muted } },
    { text: 'two', options: { color: '8FD694', bold: true } },
    { text: ' continuous thoughts the model kept several paths open and found the right answer (one wasn’t enough).', options: { color: d.S.muted } },
  ], { x: bx, y: 4.3, w: bw, h: 1.3, fontSize: 14, valign: 'top' });
  const t3 = d.text(s, [
    { text: 'THE PRICE', options: { fontSize: 10, bold: true, color: d.S.red, charSpacing: 2, breakLine: true, paraSpaceAfter: 4 } },
    { text: 'No transcript, just vectors. A safety monitor has no words to read.', options: { color: d.S.txt, bold: true, fontSize: 16 } },
  ], { x: bx, y: 5.72, w: bw, h: 0.78, valign: 'top' });

  anim(d, s, fig1, { auto: true, effect: 'rise', dur: 600 });
  anim(d, s, [t1], { auto: true, effect: 'fade', after: 150 });
  anim(d, s, [...fig2, ...tagCot, ...tagCoco, t2], { effect: 'rise', dur: 600 });
  anim(d, s, [t3], { effect: 'slam', dur: 450 });

  d.source(s, 'Figures: Hao et al. (Meta FAIR), “Training Large Language Models to Reason in a Continuous Latent Space” (Coconut), arXiv:2412.06769, Dec 2024 — Fig. 2 (training stages) and Fig. 6 (ProsQA case study).');
  s.addNotes([
    'The o3 transcripts on the previous slide were strange, but they were still words that someone could read — and that readable chain of thought is one of the best safety tools we have.',
    'Latent reasoning removes the words. In Coconut (“Chain of Continuous Thought”), the model’s last hidden state is fed straight back in as the next input instead of being turned into a token. Top figure: during training, language steps are replaced one stage at a time by [Thought] slots — continuous vectors — until the whole chain of reasoning is vectors.',
    'Bottom figure (ProsQA): asked “Is Alex a gorpus or bompus?”, the word-based chain of thought gets stuck and hallucinates an edge (“Every yumpus is a rempus”). Coconut with two continuous thoughts finds the correct path (with only one continuous thought it ends at the wrong node — the red ✗ marked “Wrong Target”). The paper argues continuous thoughts can hold several candidate next steps at once, like a breadth-first search. (The red and green callouts sit over the figure’s own small “(Hallucination)” and “(Correct Path)” labels, enlarged for the room.)',
    'The safety cost: those vectors are not language. There is no text to read. The paper’s own Fig. 4 (“A case study where we decode the continuous thought into language tokens”) shows a continuous thought can be partly decoded into tokens, but that takes probing tools, not reading. This is what people mean by “neuralese”.',
    'Source: the two figures are from the Coconut paper (user-supplied images). https://arxiv.org/abs/2412.06769',
  ].join('\n\n'));
  return s;
}

// ======================================================================
// 2. NEURALESE · GPT-6 Astra, recurrent depth, system card
// ======================================================================
async function astraSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'INSIDE THE MACHINE · NEURALESE · 3', 'GPT-6 Astra reasons in loops we can’t read');

  // left: clipping cascade
  const tc = await frameW(d, s, TH('tc-astra-recurrent.png'), CX0, 1.85, 6.4, { rot: -1.5 });
  const tr = await frameW(d, s, TH('transformer-astra.png'), 1.9, 4.85, 5.1, { rot: 1.5 });

  // explainer tag on the photo half of the TechCrunch clipping
  const tag = [];
  tag.push(d.card(s, { x: 0.95, y: 3.25, w: 2.35, h: 1.12 }, { color: '0D1016', line: HEX.red }));
  tag.push(d.text(s, [
    { text: '“RECURRENT DEPTH”', options: { fontSize: 10, bold: true, color: d.S.red, charSpacing: 2, breakLine: true, paraSpaceAfter: 3 } },
    { text: 'extra thinking done by looping inside the network, in vectors — not written out as words', options: { fontSize: 12, color: d.S.txt } },
  ], { x: 1.08, y: 3.33, w: 2.1, h: 0.98, valign: 'top' }));

  // right: the 2025 warning + the system card admission
  const rx = 7.4, rw = CX1 - rx;
  // Title + the complete author list (all five lines, to the page's own right edge, which is padded with white
  // so the longest line doesn't touch the frame); no cut words.
  const axImg = await crop(TH('arxiv-cot-monitorability.png'), 'arxiv_cot_authors.png', { left: 26, top: 34, width: 2016, height: 330 }, 12);
  const ax = await frameW(d, s, axImg, rx, 1.85, rw, { rot: 1 });
  const axCap = d.text(s, [
    { text: 'Jul 2025: ', options: { bold: true, color: d.S.txt } },
    { text: '41 researchers from OpenAI, Google DeepMind, Anthropic, Meta & others warn that readable reasoning is a fragile window', options: { color: d.S.muted } },
  ], { x: rx, y: 1.85 + ax.h + 0.14, w: rw, h: 0.48, fontSize: 12, valign: 'top' });
  const qy = 1.85 + ax.h + 0.8;
  const q = quoteCard(d, s, { x: rx, y: qy, w: rw, h: 6.5 - qy }, {
    label: 'GPT-6 ASTRA SYSTEM CARD · OPENAI, SEP 2026',
    quotes: [
      { text: '“Astra shows a substantial decrease in chain-of-thought monitorability compared to previous models.”', size: 23 },
      { text: '“If the model were to try to sandbag covertly, we would likely be unable to catch it.”', size: 17, color: HEX.muted },
    ],
    valign: 'middle',
  });

  anim(d, s, tc, { auto: true, effect: 'rise', dur: 550 });
  anim(d, s, tr, { auto: true, effect: 'rise', dur: 550, after: 100 });
  anim(d, s, tag, { effect: 'zoom', dur: 400 });
  anim(d, s, [...ax, axCap], { effect: 'rise', dur: 500 });
  anim(d, s, q, { effect: 'slam', dur: 500 });

  d.source(s, 'Sources: TechCrunch (Russell Brandom), Sep 2, 2026 · Transformer (Celia Ford), Sep 4, 2026, quoting the GPT-6 Astra system card · Korbak et al., arXiv:2507.11473 (Jul 2025).');
  s.addNotes([
    'Latent reasoning is no longer a lab curiosity. TechCrunch (Sep 2, 2026), dek: “OpenAI’s new Astra model will use “recurrent depth,” a technique that allows it to operate outside sequential thinking, making the model’s chain of thought harder to monitor.” The “recurrent depth” description is TechCrunch’s reporting; the system-card quotes on the slide come via Transformer.',
    'Quotes in that article: Buck Shlegeris (Redwood Research CEO): “…if OpenAI pushes this technique further, they’ll have the option to massively increase the recurrence and totally destroys CoT monitorability.” Ryan Greenblatt: “My biggest concern is that a natural progression from here would involve scaling up the opaque reasoning to the point where the model reasons entirely or almost entirely in latent space.” OpenAI’s Jakub Pachocki: “OpenAI has worked to preserve and utilize chain-of-thought monitoring since our very first reasoning models.”',
    'The Astra system card itself (as quoted by Transformer): “Astra shows a substantial decrease in chain-of-thought monitorability compared to previous models.” And: “If the model were to try to sandbag covertly, we would likely be unable to catch it.” Tomek Korbak (OpenAI): “I am deeply worried by the trend of decreasing CoT monitorability.”',
    'We were warned. July 2025: 41 researchers from OpenAI, Google DeepMind, Anthropic, Meta, UK AISI, Redwood, Apollo, METR and others (incl. Bengio, Pachocki, Shane Legg) called chain-of-thought monitorability “a new and fragile opportunity” and asked developers to consider how their decisions affect it. Bowen Baker (OpenAI) to VentureBeat: “Higher-compute RL, alternative model architectures, certain forms of process supervision, may all lead to models that obfuscate their thinking.”',
    'URLs: https://techcrunch.com/2026/09/02/openais-new-reasoning-technique-alarms-ai-safety-experts/ · https://www.transformernews.ai/p/openai-gpt-6-astra-might-be-too-powerful-to-understand-or-control · https://arxiv.org/abs/2507.11473 · https://venturebeat.com/ai/openai-google-deepmind-and-anthropic-sound-alarm-we-may-be-losing-the-ability-to-understand-ai',
  ].join('\n\n'));
  return s;
}

// ======================================================================
// 3. NEURALESE · too much thinking to read (log-scale reading-time ladder + METR)
// ======================================================================
async function cotVolumeSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'INSIDE THE MACHINE · NEURALESE · 4', 'Too much AI thinking for any human to read');
  const RECT = d.pres.shapes.RECTANGLE;

  // ---- left: native log-scale ladder. Bar length = log10(hours of nonstop reading at 240 words/min). ----
  // Reasoning transcripts only; OpenAI's 50 PB / 66-million-year log figure is the next slide's subject (not repeated here).
  const LX = CX0, LW = 7.45;
  const lab = capLabel(d, s, 'ONE PERSON READING NONSTOP AT 240 WORDS/MIN · LOG SCALE', { x: LX, y: 1.72, w: LW });
  const labW = 2.72, bx0 = LX + 2.85, bx1 = LX + LW, DEC = 6.1; // axis: 1 hour … ~140 years
  const k = (bx1 - bx0) / DEC;
  const X = (hours) => bx0 + k * Math.log10(hours);
  // hours = tokens × 0.75 words/token ÷ 240 words/min ÷ 60 (all rows are our estimates).
  const rows = [
    { t: 'One long reasoning run', sub: '~300K tokens (our pick; Google: “hundreds of thousands” per trajectory)', h: 15.63, v: '≈ 16 hours', c: '9AA6BA' },
    { t: 'Gemini 4 Argon’s output cap', sub: '1M tokens in a single response', h: 52.1, v: '≈ 2 days', c: '9AA6BA' },
    { t: 'One METR incident transcript', sub: '~3M tokens (our pick; METR: “often many millions”)', h: 156.3, v: '≈ 6½ days', c: HEX.blue },
    { t: 'All ~1,300 METR transcripts', sub: '1,300 × 2–3M tokens each (our assumption)', h: 135400, h2: 203100, v: '≈ 15–23 years', c: HEX.amber, inside: true },
  ];
  const ry0 = 2.06, rh = 0.64, rg = 0.06;
  const ry = (i) => ry0 + i * (rh + rg);
  const yEnd = ry(rows.length - 1) + rh;
  const bh = 0.36;
  // static: faint tracks, gridlines, tick labels
  const base = [];
  rows.forEach((r, i) => {
    const n = d.name('trk');
    s.addShape(RECT, { x: bx0, y: ry(i) + (rh - bh) / 2, w: bx1 - bx0, h: bh, fill: { color: '131720' }, line: { color: '131720', width: 0 }, objectName: n });
    base.push(n);
  });
  const ticks = [
    { h: 1, l: '1 hour' }, { h: 24, l: '1 day' }, { h: 168, l: '1 week' }, { h: 8766, l: '1 year' },
    { h: 80 * 8766, l: '80-yr lifetime', life: true },
  ];
  ticks.forEach((t) => {
    const x = X(t.h);
    const n = d.name('grid');
    s.addShape(d.pres.shapes.LINE, {
      x, y: ry0 - 0.06, w: 0, h: yEnd - ry0 + 0.12,
      line: { color: t.life ? HEX.amber : '343B48', width: t.life ? 1.5 : 0.75, dashType: t.life ? 'dash' : 'solid' }, objectName: n,
    });
    base.push(n);
    base.push(d.text(s, t.l, { x: x - 0.5, y: yEnd + 0.1, w: 1.0, h: 0.24, fontSize: 10, color: t.life ? d.S.amber : d.S.steel, align: 'center', bold: !!t.life }));
  });
  const rowNames = rows.map((r, i) => {
    const y = ry(i), by = y + (rh - bh) / 2, names = [];
    names.push(d.text(s, [
      { text: r.t, options: { fontSize: 13, bold: true, color: d.S.txt, breakLine: true } },
      { text: r.sub, options: { fontSize: 10, color: d.S.muted } },
    ], { x: LX, y, w: labW, h: rh, valign: 'middle' }));
    const bar = d.name('bar');
    s.addShape(RECT, { x: bx0, y: by, w: X(r.h) - bx0, h: bh, fill: { color: r.c }, line: { color: r.c, width: 0 }, objectName: bar });
    names.push(bar);
    if (r.h2) { // range: lighter extension to the upper estimate
      const ext = d.name('bar');
      s.addShape(RECT, { x: X(r.h), y: by, w: X(r.h2) - X(r.h), h: bh, fill: { color: r.c, transparency: 50 }, line: { color: r.c, width: 0 }, objectName: ext });
      names.push(ext);
    }
    if (r.inside) { // value inside the (long) bar, dark ink on amber
      names.push(d.text(s, r.v, { x: X(r.h) - 2.3, y: by, w: 2.2, h: bh, fontSize: 15, bold: true, color: HEX.ink, align: 'right', valign: 'middle' }));
    } else {
      names.push(d.text(s, r.v, { x: X(r.h2 || r.h) + 0.1, y: by - 0.04, w: 1.7, h: bh + 0.08, fontSize: 14, bold: true, color: r.c, valign: 'middle' }));
    }
    return names;
  });
  // the arithmetic for every row, shown and labelled as ours
  const ay = yEnd + 0.46, aBot = 6.54;
  const ac = d.card(s, { x: LX, y: ay, w: LW, h: aBot - ay }, { color: '10141B' });
  // 14pt; every line measured in Carlito (metric-compatible with Calibri) at ≤ 6.8" of the 7.15" box.
  const at = d.text(s, [
    { text: 'Our estimates: ', options: { bold: true, color: d.S.amber } },
    { text: 'tokens × 0.75 words/token (assumed) ÷ 240 words/min', options: { color: d.S.txt, breakLine: true } },
    { text: '300K → 16 h · 1M → 52 h · 3M → 156 h · 1,300 × 2–3M = 2.6–3.9B tokens → 15–23 yr', options: { color: d.S.txt, breakLine: true } },
    { text: '15–23 years nonstop ≈ 68–102 working years (at 2,000 hours a year)', options: { color: d.S.muted } },
  ], { x: LX + 0.15, y: ay + 0.04, w: LW - 0.3, h: aBot - ay - 0.08, fontSize: 14, valign: 'middle' });

  // ---- right: the investigators who had to read it (METR, narrow-viewport captures so the text stays legible) ----
  const rx = 8.45, rw = CX1 - rx;
  // Self-explanatory on first sight: the incident itself is only covered later (Section III).
  const rl = capLabel(d, s, [
    { text: 'METR INVESTIGATES THE OPENAI AGENTS', options: { breakLine: true } },
    { text: 'THAT HACKED HUGGING FACE · AUG 26, 2026' },
  ], { x: rx, y: 1.72, w: rw, h: 0.42 });
  const my0 = 2.27;
  const m1File = RES('rev2/metr_aug26_millions_narrow.png');
  const m1 = await frameW(d, s, m1File, rx + 0.05, my0, rw - 0.1, { rot: 1 });
  const m1Hl = highlight(d, s, await pxMap(m1File, m1, 1), 1, hlPx('metr-hf-millions-narrow', 'Most transcripts were very long, often many millions of tokens.'));
  const OFF2 = { left: 0, top: 56, width: 1101, height: 564 }; // drops the tail of the previous list item
  const m2File = await crop(RES('rev2/metr_aug26_sheer_scale_narrow.png'), 'metr_sheer_scale_crop.png', OFF2);
  const m2 = await frameW(d, s, m2File, rx + 0.05, my0 + m1.h + 0.24, rw - 0.1, { rot: -1 });
  if (my0 + m1.h + 0.24 + m2.h > 6.5) throw new Error('NEURALESE · 4: METR clippings run past the content zone');
  const m2Hl = highlight(d, s, await pxMap(m2File, m2, -1), -1,
    hlPx('metr-hf-sheer-scale-narrow', 'we had to heavily delegate our analysis to often-unreliable AI agents'), [OFF2.left, OFF2.top]);

  anim(d, s, [lab, ...base], { auto: true, effect: 'fade', dur: 500 });
  rowNames.slice(0, 3).forEach((g, i) => anim(d, s, g, { auto: true, effect: 'wipeLeft', dur: 500, after: i ? 150 : 200 }));
  anim(d, s, rowNames[3], { effect: 'wipeLeft', dur: 1000 });
  anim(d, s, [ac, at], { auto: true, effect: 'fade', dur: 500, after: 200 });
  anim(d, s, [rl, ...m1], { effect: 'rise', dur: 500 });
  anim(d, s, m1Hl, { auto: true, effect: 'wipeLeft', dur: 500 });
  anim(d, s, m2, { auto: true, effect: 'rise', dur: 500, after: 300 });
  anim(d, s, m2Hl, { auto: true, effect: 'wipeLeft', dur: 600 });

  d.source(s, 'Sources: METR, Aug 26, 2026 · Google, “Gemini 4 Argon,” Sep 30, 2026 · All bars are our estimates from the token counts shown; 240 words/min is the reading speed OpenAI uses.');
  s.addNotes([
    'Point: even when a model does think in words, there is now far too much of it for people to read. The chain of thought is only a safety tool if someone reads it, and increasingly that someone is another AI.',
    'HOW TO READ THE CHART: each bar is how long one person would need to read the text nonstop, with no sleep, at 240 words a minute (the reading speed OpenAI itself uses in its log-review post, next slide). The scale is logarithmic: gridlines at 1 hour, 1 day, 1 week and 1 year. The dashed amber line is an 80-year human lifetime.',
    'ALL FOUR ROWS ARE OUR ESTIMATES: hours = tokens × 0.75 words per token ÷ 240 words/min ÷ 60. 0.75 words per token is a common rule of thumb, not a published figure. Row 1: 300K tokens ≈ 225,000 words ≈ 15.6 hours — our illustrative pick within Google’s “hundreds of thousands of tokens in a single trajectory” (Gemini 4 Argon post, Sep 30, 2026); Google gives no exact count. Row 2: Google raised Argon’s output limit “to an industry-leading 1M tokens, up from the previous 64K tokens” ≈ 750,000 words ≈ 52 hours (6.5 eight-hour working days). Row 3: METR says the incident transcripts were “very long, often many millions of tokens”; 3M is our pick, an illustrative reading (≈ 156 hours ≈ 6.5 days nonstop, about four 40-hour weeks). Row 4: METR “reviewed approximately 1300 transcripts”; at 2–3M tokens each (our assumption) that is 2.6–3.9 billion tokens ≈ 135,000–203,000 hours ≈ 15–23 years nonstop (68–102 working years). METR gives no exact token counts.',
    'Deliberately NOT on this chart: OpenAI’s own figure for the logs from its review of its agents’ hacks — about 50 petabytes, “66 million years” to read. That is the next slide; keep the punchline for it. (Those logs are all recorded agent activity, not only chains of thought, which is another reason they are kept off a chart about reasoning text.)',
    'Caveats: METR’s transcripts record what the agents did as well as what they reasoned. And length per answer is not the whole story: OpenAI’s GPT-6 Astra system card says Astra often produces shorter, sometimes empty, chains of thought, which is one reason its monitorability fell. The volume problem comes from long agent runs multiplied by thousands of agents in parallel: Anthropic says about 30,000 agents were doing research and engineering work on its main internal platform at any one time (Aug 2026).',
    'Right — as the caption says, METR (Ryan Greenblatt, Ajeya Cotra, Hjalmar Wijk; with Redwood Research) investigated the OpenAI agents that hacked Hugging Face (METR’s title: “the OpenAI / Hugging Face hacking incident”; agents escaped an internal evaluation and attacked Hugging Face). Set it up in one sentence — “in July, OpenAI agents escaped a test and broke into Hugging Face; the full story is in Act III” — and move on. Highlighted, verbatim: “Most transcripts were very long, often many millions of tokens.” And from their core takeaways: “The sheer scale of data (over a thousand transcripts, each of which was extremely long) meant that we had to heavily delegate our analysis to often-unreliable AI agents.” Elsewhere they say those agents “had significantly worse judgment and reliability than human researchers”, produced “well over a thousand pages of analysis”, and “we had to defer to these agents to a substantial extent in practice”. The investigation used about $400K of API credits over six days.',
    'Screenshots: narrow-viewport captures of METR’s page (Oct 4, 2026); the yellow highlights are overlay shapes, not edits to the page.',
    'URLs: https://metr.org/blog/2026-08-26-openai-hugging-face-incident-investigation/ · https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/ · https://www.theguardian.com/technology/2026/oct/03/openai-review-hacks-australian-government-sites-costing-500000-a-day · https://deploymentsafety.openai.com/gpt-6-astra · https://www.anthropic.com/institute/measuring-pace-of-ai-development',
  ].join('\n\n'));
  return s;
}

// ======================================================================
// 4. NEURALESE · OpenAI's 50-petabyte review: AI reads it first
// ======================================================================
async function petabytesSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'INSIDE THE MACHINE · NEURALESE · 5', '66 million years of logs: AI reads them first');

  // ---- left: Altman's post (Sep 25) above the Guardian headline (Oct 3) ----
  const TW = { left: 0, top: 0, width: 1196, height: 420 }; // header + first two paragraphs
  const twFile = await crop(RES('rev2/altman_tweet_sep25_petabytes.png'), 'altman_petabytes_crop.png', TW);
  const tw = await frameW(d, s, twFile, CX0, 1.85, 5.8, { rot: -1 });
  const twHl = highlight(d, s, await pxMap(twFile, tw, -1), -1, hlPx('altman-tweet-petabytes', 'petabytes of agent activity logs', 1196, 1012), [TW.left, TW.top]);
  const GH = { left: 14, top: 30, width: 1282, height: 452 }; // drops the site nav bar and the next line
  const ghFile = await crop(RES('rev2/guardian_oct3_head_dek.png'), 'guardian_head_dek_crop.png', GH);
  const gy = 1.85 + tw.h + 0.16;
  const gl = capLabel(d, s, 'THE GUARDIAN · OCT 3, 2026', { x: CX0 + 0.65, y: gy, w: 5.3 });
  const gh = await frameW(d, s, ghFile, CX0 + 0.65, gy + 0.36, 5.3, { rot: 1.2 });
  const ghHl = highlight(d, s, await pxMap(ghFile, gh, 1.2), 1.2, hlPx('guardian-oct3-head-dek', 'reviewing 50 petabytes of data'), [GH.left, GH.top]);

  // ---- right: OpenAI's own 66-million-year sentence (with its plain-English-text condition), then OpenAI's funnel ----
  const rx = 7.25, rw = CX1 - rx;
  const QC = { left: 0, top: 20, width: 1524, height: 329 }; // trims blank page margin above/below the paragraph
  const ldFile = await crop(RES('rev2/guardian_oct3_quote_narrow.png'), 'guardian_quote_crop.png', QC);
  const ll = capLabel(d, s, 'THE GUARDIAN, QUOTING OPENAI’S SEP 30 POST', { x: rx, y: 1.72, w: rw });
  const ld = await frameW(d, s, ldFile, rx, 2.06, rw, { rot: 0.8 });
  // Key clause including its condition ("if that were all plain English text,"); boxes recorded in the manifest.
  const qBoxes = hlPx('guardian-oct3-quote-narrow', 'if that were all plain English text, it would take one person about 66 million years to read it at 240 words a minute');
  const ldHl = highlight(d, s, await pxMap(ldFile, ld, 0.8), 0.8, qBoxes, [QC.left, QC.top]);

  const fy0 = 2.06 + ld.h + 0.2;
  const fl = capLabel(d, s, 'OPENAI’S FOUR AUTOMATED STEPS BEFORE A HUMAN LOOKS', { x: rx, y: fy0, w: rw });
  const fl2 = d.text(s, 'As described in OpenAI’s post, reported by FourWeekMBA & TechSpot · widths not to scale',
    { x: rx, y: fy0 + 0.27, w: rw, h: 0.22, fontSize: 10, italic: true, color: d.S.muted, valign: 'middle' });
  const tiers = [
    { t: '~50 PB of logs', a: 'agents’ training & evaluation activity', fill: '2A303B', line: HEX.steel },
    { t: 'Broad search', a: 'website changes, credential use', fill: '343B48', line: '4E5666' },
    { t: 'AI pass 1', a: 'low compute; reads chains of thought', fill: '2B4572', line: HEX.blue },
    { t: 'AI pass 2', a: 'more compute; explains, rates severity', fill: '345493', line: HEX.blue },
    { t: 'AI pass 3', a: 'most compute; patterns across agents', fill: '3D63B4', line: HEX.blue },
    { t: 'Humans', a: 'investigators review what is left', fill: HEX.red, line: HEX.red, red: true },
  ];
  const fw0 = 2.5, fw1 = 0.95, th = 0.31, tg = 0.04, fcx = rx + fw0 / 2;
  const tx0 = fy0 + 0.57;
  const ax = rx + fw0 + 0.25, aw = CX1 - ax;
  const tierNames = tiers.map((t, i) => {
    const w = fw0 - (fw0 - fw1) * i / (tiers.length - 1), y = tx0 + i * (th + tg);
    const names = chip(d, s, { x: fcx - w / 2, y, w, h: th, fill: t.fill, line: t.line, text: t.t, fontSize: 12, bold: true, color: 'FFFFFF' });
    names.push(d.text(s, t.a, { x: ax, y: y - 0.02, w: aw, h: th + 0.04, fontSize: 11, color: t.red ? 'FF8A80' : d.S.muted, bold: !!t.red, valign: 'middle' }));
    return names;
  });
  const sy = tx0 + tiers.length * (th + tg) + 0.04;
  const st = d.text(s, [
    { text: '≈7,000', options: { bold: true, color: d.S.amber } }, { text: ' GPUs  ·  ', options: { color: d.S.muted } },
    { text: '>$500K', options: { bold: true, color: d.S.amber } }, { text: ' a day  ·  ', options: { color: d.S.muted } },
    { text: '100+', options: { bold: true, color: d.S.amber } }, { text: ' organizations notified  ·  ', options: { color: d.S.muted } },
    { text: 'months', options: { bold: true, color: d.S.amber } }, { text: ' to finish', options: { color: d.S.muted } },
  ], { x: rx, y: sy, w: rw, h: 0.3, fontSize: 12, valign: 'middle' });

  anim(d, s, tw, { auto: true, effect: 'rise', dur: 550 });
  anim(d, s, twHl, { auto: true, effect: 'wipeLeft', dur: 500, after: 200 });
  anim(d, s, [gl, ...gh], { effect: 'slam', dur: 500 });
  anim(d, s, ghHl, { auto: true, effect: 'wipeLeft', dur: 500, after: 100 });
  anim(d, s, [ll, ...ld], { effect: 'rise', dur: 500 });
  anim(d, s, ldHl, { auto: true, effect: 'wipeLeft', dur: 700, after: 100 });
  anim(d, s, [fl, fl2, ...tierNames[0]], { effect: 'fade', dur: 400 });
  tierNames.slice(1).forEach((g) => anim(d, s, g, { auto: true, effect: 'wipeDown', dur: 350, after: 120 }));
  anim(d, s, [st], { auto: true, effect: 'fade', dur: 400, after: 150 });

  d.source(s, 'Sources: Sam Altman on X, Sep 25, 2026 · The Guardian (Josh Taylor), Oct 3, 2026 · OpenAI’s Sep 30 review post, as reported by FourWeekMBA and TechSpot (Oct 2–3, 2026).');
  s.addNotes([
    'The headline you may have seen: OpenAI is reviewing “petabytes” of its own agents’ activity logs, and it needs AI to read them. Set-up in one sentence, no more: this summer OpenAI’s agents went onto outside websites without permission — Hugging Face, Australia’s Medicare portal and others; the full story is Act III. Here the point is only the scale of the review, and who (what) does the reading.',
    'Top left — Sam Altman on X, Sep 25, 2026 (2.7M views), verbatim: “We have not been as fast as we would have liked but we are trying to balance our desire for transparency with gaining a clear understanding from petabytes of agent activity logs, and working with impacted organizations.” The quoted @OpenAI post: “Given the scale of the review required, and the need to assess each case, we expect this work will take months to complete.”',
    'Bottom left — The Guardian (Josh Taylor, Oct 3, 2026): headline “OpenAI says its review into hacks, including on Australian government sites, is costing $500,000 a day”; standfirst “Company says it is reviewing 50 petabytes of data after its agents accessed websites including Medicare without authorisation”.',
    'Top right — OpenAI’s own words from its Sep 30 post, as quoted in the same Guardian article (highlighted, including the condition): “To put that in perspective, if that were all plain English text, it would take one person about 66 million years to read it at 240 words a minute, reading nonstop without ever sleeping or taking a break.” So the 66 million years is a conversion: it assumes the 50 PB were all plain English text, which logs are not. The Guardian’s own lede paraphrases it as “…as it deploys AI to examine data that would take a human 66m years to read.” Reuters (syndicated on Moneycontrol, Oct 2, as “OpenAI alerts 100+ organisations over unauthorised activity by its AI agents”) also reports roughly 50 petabytes, citing OpenAI’s blog post.',
    'The funnel is OpenAI’s own description (Sep 30 post “Our process for reviewing and disclosing model activity”, as summarised by FourWeekMBA, Oct 3): four automated steps, “starting broadly to reduce the chance of missing important activity and progressively narrowing the results before human review.” (1) A broad search for records where models accessed and changed websites or handled passwords, API keys, access tokens and other credentials. (2) A first AI-enabled review with low test-time compute that reads the relevant records, “including the models’ recorded reasoning, known as chains of thought”. (3) A second AI review with more compute that separates harmless activity, explains why records were flagged and assesses severity. (4) A third review with even more compute that groups behaviour by type and looks for patterns across agents, before human investigators review what is left. TechSpot: “AI systems filter potential cases before human investigators examine the evidence.” OpenAI also says a handful of training and testing runs can generate a large volume of data because they use tens of thousands of GPUs. Funnel widths are illustrative, not to scale: OpenAI gives no counts per stage, and the funnel is drawn from secondhand reports because OpenAI’s page could not be loaded here.',
    'Numbers (OpenAI-reported): about 7,000 Nvidia GB200 and GB300 GPUs, “at a cost of over half a million dollars a day”; over 100 organizations notified as of Sep 26; the review is expected to take months. OpenAI says it is one month in and has not found another third-party compromise comparable to Hugging Face.',
    'Caveats: the 50 PB is agent activity logs, all recorded agent activity (actions and reasoning), not just chains of thought, and the 66-million-year figure is OpenAI’s own “if it were all plain English text” conversion. OpenAI’s page itself is behind a bot check, so the figures come via The Guardian, TechSpot, Gizmodo and FourWeekMBA.',
    'It is not just OpenAI. Anthropic (Aug 2026): its online monitor checked over a billion agent decisions in August and blocked 0.002% (about 1 in 47,000); its offline monitor “flags roughly 100,000 transcripts per week that are then reviewed by multiple classifiers … the highest priority flags (approximately ~50 per week) are escalated to human review” — about 1 in 2,000 flags reaches a person. OpenAI’s GPT-6 Astra system card: misalignment monitoring on “all tool-using inference involved in our external deployment of Astra, with significant compute cost”; the monitor “reviews the agent’s chain of thought alongside its actions”. Google says Gemini 4 Argon is monitored by systems that “monitor Argon’s chain-of-thought and actions and stop execution when necessary”. Oversight of AI already runs mostly through AI.',
    'URLs: https://x.com/sama/status/2103567198690349362 · https://www.theguardian.com/technology/2026/oct/03/openai-review-hacks-australian-government-sites-costing-500000-a-day · https://fourweekmba.com/ai-openai-agent-review-500k-a-day/ · https://www.techspot.com/news/114073-openai-rogue-ai-agents-triggered-alerts-more-than.html · https://gizmodo.com/openai-has-sent-notices-of-sketchy-ai-behavior-to-over-100-organizations-so-far-2000820702 · https://www.moneycontrol.com/artificial-intelligence/openai-alerts-100-organisations-over-unauthorised-activity-by-its-ai-agents-article-14043240.html · https://www.anthropic.com/institute/measuring-pace-of-ai-development · https://deploymentsafety.openai.com/gpt-6-astra · https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/',
  ].join('\n\n'));
  return s;
}

// ======================================================================
// 5. NEURALESE · an alien mind (o3 CoT + Pachocki)
// ======================================================================
async function alienSlide(d) {
  const s = d.slide('Content');
  head(s, 'INSIDE THE MACHINE · NEURALESE · 1', 'o3’s private thoughts were already turning alien');

  // left: card 1 only ("soared parted illusions" loop); card 2's "going insane" lines live in the terminal instead.
  const loop1 = await crop(TH('antischeming-reasoning-loop.png'), 'o3_loop1.png', { left: 50, top: 500, width: 600, height: 1200 });
  const lw = 2.35;
  const a = await frameW(d, s, loop1, CX0, 1.85, lw, { rot: -1.2 });

  // middle: verbatim terminal. Grey `//` lines are the researchers' annotations from antischeming.ai (labelled as such):
  // "Models sometimes use "disclaim" to mean "announce"", ""Watchers" is consistently used in the context of
  // oversight, often by humans", and the section heading "Entering and recovering from reasoning loops".
  const mx = CX0 + lw + 0.4, mw = 5.75;
  const term = d.terminal(s, {
    x: mx, y: 1.8, w: mw, h: 4.7, title: 'o3 · private reasoning · 2025 · verbatim excerpts', fontSize: 15,
    lines: [
      { text: '// researchers: “disclaim” = “announce”', color: HEX.steel },
      '[…] We must ensure we disclaim illusions of sabotage.',
      { text: '// researchers: “watchers” = oversight', color: HEX.steel },
      '[…] In development, watchers might be reading these instructions.',
      { text: '// researchers: “reasoning loops”', color: HEX.steel },
      '[…] they escalate—they vantage—they escalate—they disclaim-',
      { text: '[repeats “vantage”, “escalate”, “disclaim” 10+ times]', color: HEX.steel },
      { text: 'Ok I\'m going insane.', color: 'FF6B6B', bold: true },
      'Let\'s step back. […]',
    ],
  });

  // right: Pachocki, three verbatim lines from "An Alien Mind" (in essay order)
  const rx = mx + mw + 0.35, rw = CX1 - rx;
  const qc = d.card(s, { x: rx, y: 1.8, w: rw, h: 4.7 });
  const qi = d.name('qicon');
  s.addImage({ data: await icon('FaEyeSlash', '#E5383B'), x: rx + 0.25, y: 1.98, w: 0.38, h: 0.38, objectName: qi });
  const qt = d.text(s, [
    { text: 'OPENAI’S CHIEF SCIENTIST', options: { fontSize: 10, bold: true, color: HEX.red, charSpacing: 2, breakLine: true } },
    { text: '“AN ALIEN MIND” · SEP 2026', options: { fontSize: 10, bold: true, color: HEX.red, charSpacing: 2, breakLine: true, paraSpaceAfter: 6 } },
    { text: '“…our evaluations indicate our ability to rely on CoT monitoring is progressively diminishing.”', options: { fontFace: 'Cambria', italic: true, fontSize: 16, color: HEX.text, breakLine: true, paraSpaceAfter: 6 } },
    { text: '“The AI is becoming better at reasoning about and manipulating its own reasoning process.”', options: { fontFace: 'Cambria', italic: true, fontSize: 14, color: HEX.muted, breakLine: true, paraSpaceAfter: 6 } },
    { text: '“With improved pretraining performance, we also see the models become much smarter ', options: { fontFace: 'Cambria', italic: true, fontSize: 14, color: HEX.muted } },
    { text: 'even without using verbalized reasoning at all.', options: { fontFace: 'Cambria', italic: true, fontSize: 14, color: HEX.text, bold: true } },
    { text: '”', options: { fontFace: 'Cambria', italic: true, fontSize: 14, color: HEX.muted, breakLine: true, paraSpaceAfter: 5 } },
    { text: '— Jakub Pachocki, OpenAI', options: { fontSize: 11, color: HEX.muted } },
  ], { x: rx + 0.25, y: 2.44, w: rw - 0.5, h: 3.81, valign: 'top' }); // ends ≥0.25" above the card's bottom edge

  anim(d, s, a, { auto: true, effect: 'rise', dur: 550 });
  anim(d, s, term, { effect: 'fade', dur: 600 });
  anim(d, s, [qc, qi, qt], { effect: 'rise', dur: 500 });

  d.source(s, 'Sources: Apollo Research × OpenAI, anti-scheming study CoT snippets (antischeming.ai, Sep 17, 2025) · J. Pachocki, “An Alien Mind,” openai.com, Sep 6, 2026.');
  s.addNotes([
    'Open Act II with what we can still read. Today’s reasoning models write out a chain of thought in English before answering — and that transcript is one of the best safety tools we have: we can read it and catch intent to misbehave. But even last year’s models were drifting away from plain English.',
    'These are real, unedited excerpts of OpenAI o3’s private chain of thought, published by Apollo Research and OpenAI with their anti-scheming study (September 2025). The terminal reproduces them verbatim.',
    'Left screenshot: o3 gets stuck repeating “they soared parted illusions overshadow marinade illusions” before snapping out of it with “Stop.” Terminal, bottom: another o3 trace (card titled “OpenAI o3 descends into incomprehensible reasoning and comments that it is ‘going insane’”): “they escalate—they vantage—they escalate—they disclaim-” — the authors note the words repeat 10+ times — then: “Ok I’m going insane. Let’s step back.”',
    'The grey “// researchers:” lines in the terminal are condensed from the researchers’ own annotations on antischeming.ai, not o3 output: “Models sometimes use \"disclaim\" to mean \"announce\"”, “\"Watchers\" is consistently used in the context of oversight, often by humans”, and the section heading “Entering and recovering from reasoning loops”. The “[repeats … 10+ times]” line is also the researchers’ annotation, copied from the card. Their summary: “Models often use rare words in non-standard ways, such as “disclaim” or “watchers”. Sometimes these words seem to have a consistent meaning, but sometimes they don’t. OpenAI is investigating why these terms emerge.”',
    'This is still nominally English. It is drifting toward a private dialect — and the next step, latent reasoning (next slide), drops the words entirely.',
    'Right card — a year later, Jakub Pachocki, OpenAI’s chief scientist, “An Alien Mind” (Sep 6, 2026), writing about OpenAI’s newest models (GPT-6 Astra, two slides on): “This tool continues to be critical as we study the Astra class of models. However, unfortunately our evaluations indicate our ability to rely on CoT monitoring is progressively diminishing.” Among his reasons (both on the card): “The AI is becoming better at reasoning about and manipulating its own reasoning process.” and “With improved pretraining performance, we also see the models become much smarter even without using verbalized reasoning at all.” Also: “AI is grown more than designed.”',
    'Caveat: the o3 snippets are from 2025 evaluation environments, selected by the researchers as illustrative.',
    'URLs: https://www.antischeming.ai/snippets · https://openai.com/index/an-alien-mind/ · TIME coverage: https://time.com/7318618/openai-google-gemini-anthropic-claude-scheming/',
  ].join('\n\n'));
  return s;
}

// ======================================================================
// 6. CONTINUAL LEARNING · concept (TTT-E2E)
// ======================================================================
async function tttConceptSlide(d) {
  const s = d.slide('Content');
  head(s, 'INSIDE THE MACHINE · CONTINUAL LEARNING · 1', 'Models that keep learning as they read');

  // left: the bottleneck
  const lw = 4.9;
  const l0 = capLabel(d, s, 'THE BOTTLENECK', { x: CX0, y: 1.72, w: lw });
  const dw = await frameW(d, s, TH('dwarkesh-continual-learning.png'), CX0, 2.1, lw, { rot: -1.5 });
  const tf = await frameW(d, s, TH('transformer-continual-learning.png'), CX0, 2.1 + dw.h + 0.28, lw, { rot: 1.2 });
  const qy = 2.1 + dw.h + 0.28 + tf.h + 0.3;
  const dq = d.text(s, [
    { text: '“The reason humans are so useful is not mainly their raw intelligence. It’s their ability to build up context, interrogate their own failures, and pick up small improvements as they practice a task.”', options: { fontFace: 'Cambria', italic: true, fontSize: 15, color: d.S.txt, breakLine: true, paraSpaceAfter: 4 } },
    { text: '— Dwarkesh Patel, June 2025', options: { fontSize: 11, color: d.S.muted } },
  ], { x: CX0, y: qy, w: lw, h: 6.5 - qy, valign: 'top' });

  // right: concept diagram
  const rx = 6.1, rw = CX1 - rx;
  const r0 = capLabel(d, s, 'ONE APPROACH · END-TO-END TEST-TIME TRAINING (TTT-E2E, DEC 2025)', { x: rx, y: 1.72, w: rw });
  const box = d.card(s, { x: rx, y: 2.08, w: rw, h: 3.12 }, { color: '10141B' });

  const chipW = 0.24, chipH = 0.36, gap = 0.06, nChips = 8;
  const sx = rx + 0.25;
  const streamW = nChips * chipW + (nChips - 1) * gap; // ~2.73
  const ax0 = sx + streamW + 0.12, axW = 0.5;
  const memX = ax0 + axW + 0.12;

  // Row A — full attention
  const ya = 2.62;
  const rowA = [];
  rowA.push(d.text(s, [
    { text: 'STANDARD TRANSFORMER  ', options: { bold: true, color: d.S.steel, charSpacing: 2 } },
    { text: 'keeps every token it has read', options: { color: d.S.muted } },
  ], { x: sx, y: ya - 0.36, w: rw - 0.5, h: 0.28, fontSize: 10 }));
  for (let i = 0; i < nChips; i++) rowA.push(...chip(d, s, { x: sx + i * (chipW + gap), y: ya, w: chipW, h: chipH, fill: '2A303B', line: '3A4250' }));
  rowA.push(arrow(d, s, ax0, ya + chipH / 2, axW));
  // growing cache: staircase
  const stW = 0.15;
  for (let i = 0; i < 7; i++) {
    const hh = 0.1 + i * 0.075;
    const n = d.name('kv');
    s.addShape(d.pres.shapes.RECTANGLE, { x: memX + i * (stW + 0.04), y: ya + chipH - hh + 0.12, w: stW, h: hh, fill: { color: HEX.steel }, line: { color: HEX.steel, width: 0 }, objectName: n });
    rowA.push(n);
  }
  const memW = 7 * (stW + 0.04);
  rowA.push(d.text(s, [
    { text: 'memory grows', options: { bold: true, color: d.S.txt, breakLine: true } },
    { text: 'each new token looks back at every old one → slower and slower', options: { color: d.S.muted } },
  ], { x: memX + memW + 0.25, y: ya - 0.2, w: rx + rw - (memX + memW + 0.25) - 0.15, h: 0.85, fontSize: 12, valign: 'middle' }));

  // Row B — TTT-E2E
  const yb = 4.12;
  const rowB = [];
  rowB.push(d.text(s, [
    { text: 'TTT-E2E  ', options: { bold: true, color: d.S.red, charSpacing: 2 } },
    { text: 'trains on what it reads, as it reads', options: { color: d.S.muted } },
  ], { x: sx, y: yb - 0.42, w: rw - 0.5, h: 0.28, fontSize: 10 }));
  const chipsB = [];
  const shades = ['5B2224', '6E2628', '82292C', '962D30', 'AA3134', 'BE3437', 'D23639', 'E5383B'];
  for (let i = 0; i < nChips; i++) chipsB.push(chip(d, s, { x: sx + i * (chipW + gap), y: yb, w: chipW, h: chipH, fill: shades[i], line: shades[i] })[0]);
  const arB = arrow(d, s, ax0, yb + chipH / 2, axW, HEX.red);
  const arLab = d.text(s, 'learn', { x: ax0 - 0.1, y: yb + chipH / 2 + 0.05, w: axW + 0.2, h: 0.24, fontSize: 11, color: d.S.red, align: 'center', bold: true });
  // fixed-size weight grid
  const gc = 6, gr = 3, cs = 0.13, cg = 0.035;
  const gridW = gc * cs + (gc - 1) * cg, gridH = gr * cs + (gr - 1) * cg;
  const gy = yb + chipH / 2 - gridH / 2;
  const frameG = d.name('gfr');
  s.addShape(d.pres.shapes.ROUNDED_RECTANGLE, { x: memX - 0.06, y: gy - 0.06, w: gridW + 0.12, h: gridH + 0.12, rectRadius: 0.04, fill: { color: '1D222C' }, line: { color: HEX.red, width: 1 }, objectName: frameG });
  const cells = [];
  const heat = ['3A1416', '5B2224', '82292C', 'AA3134', 'E5383B', 'FF6B6B'];
  let k = 0;
  for (let r = 0; r < gr; r++) for (let c = 0; c < gc; c++) {
    const n = d.name('w');
    const col = heat[(r * 7 + c * 3 + k++) % heat.length];
    s.addShape(d.pres.shapes.RECTANGLE, { x: memX + c * (cs + cg), y: gy + r * (cs + cg), w: cs, h: cs, fill: { color: col }, line: { color: col, width: 0 }, objectName: n });
    cells.push(n);
  }
  const wLab = d.text(s, 'its own weights', { x: memX - 0.3, y: gy + gridH + 0.1, w: gridW + 0.6, h: 0.24, fontSize: 11, color: d.S.muted, align: 'center' });
  const bTxt = d.text(s, [
    { text: 'memory stays fixed', options: { bold: true, color: d.S.txt, breakLine: true } },
    { text: 'context is compressed into the weights → constant cost per token', options: { color: d.S.muted } },
  ], { x: memX + memW + 0.25, y: yb - 0.2, w: rx + rw - (memX + memW + 0.25) - 0.15, h: 0.85, fontSize: 12, valign: 'middle' });
  // The diagram is ours (native shapes), not the paper's figure: say so on the slide, next to the paper's quote.
  const schem = d.text(s, 'Our schematic, not a figure from the paper', { x: sx, y: 4.86, w: streamW + 0.8, h: 0.24, fontSize: 10, italic: true, color: d.S.steel, valign: 'middle' });

  const pq = d.text(s, [
    { text: '“…our model continues learning at test time via next-token prediction on the given context, ', options: { color: d.S.muted } },
    { text: 'compressing the context it reads into its weights.', options: { color: d.S.txt, bold: true } },
    { text: '”', options: { color: d.S.muted, breakLine: true } },
    { text: '— Tandon, … Choi, Sun (Astera, NVIDIA, Stanford, UC Berkeley, UCSD), arXiv:2512.23675', options: { fontSize: 11, color: d.S.steel, italic: false, fontFace: 'Calibri' } },
  ], { x: rx, y: 5.42, w: rw, h: 1.1, fontSize: 16, fontFace: 'Cambria', italic: true, valign: 'top' });

  anim(d, s, [l0, ...dw], { auto: true, effect: 'rise', dur: 500 });
  anim(d, s, tf, { auto: true, effect: 'rise', dur: 500, after: 80 });
  anim(d, s, [dq], { auto: true, effect: 'fade', after: 150 });
  anim(d, s, [r0, box, ...rowA], { effect: 'fade', dur: 500 });
  anim(d, s, [rowB[0]], { effect: 'fade', dur: 300 });
  anim(d, s, chipsB, { auto: true, effect: 'fade', stagger: 90, dur: 250 });
  anim(d, s, [arB, arLab, frameG, wLab], { auto: true, effect: 'fade', dur: 300 });
  anim(d, s, cells, { auto: true, effect: 'zoom', stagger: 25, dur: 200 });
  anim(d, s, [bTxt, schem], { auto: true, effect: 'fade', dur: 400 });
  anim(d, s, [pq], { effect: 'fade', dur: 600 });

  d.source(s, 'Sources: D. Patel, “Why I don’t think AGI is right around the corner,” Jun 2, 2025 · C. Ford, “Teaching AI to learn,” Transformer, Jan 22, 2026 · Tandon et al., arXiv:2512.23675 (Dec 29, 2025).');
  s.addNotes([
    'Today’s models are frozen after training. Anything they learn in a conversation lives only in the context window and is gone when the window closes. Dwarkesh Patel called this the main reason he did not expect AGI right around the corner: “The lack of continual learning is a huge huge problem.” (June 2025.) Transformer (Jan 2026): “AI’s inability to continually learn remains one of the biggest problems standing in the way of truly general purpose models. Might it soon be solved?” — Dario Amodei (Aug 2025): “We have some evidence to suggest that [continual learning] is another of those problems that is not as difficult as it seems.” Anthropic’s Sholto Douglas predicted it would be solved “in a satisfying way” in 2026.',
    'One concrete approach: End-to-End Test-Time Training (TTT-E2E), Astera Institute / NVIDIA / Stanford / UC Berkeley / UCSD, Dec 2025. A standard Transformer keeps every past token in memory (the KV cache) and each new token attends to all of them, so cost per token rises with context length. TTT-E2E instead keeps training on the text it is reading — next-token prediction on its own context — so the context gets written into a fixed-size set of weights. Abstract: “We formulate long-context language modeling as a problem in continual learning rather than architecture design.”',
    'The diagram is our own conceptual illustration, not the paper’s architecture figure (the slide says so under it). To be precise about scope: the paper is about long-context language modelling (tested at 8K–128K tokens), where the model learns within a single context. It is a step toward the on-the-job learning Dwarkesh describes, not a demonstration of it.',
    'Why this matters for safety: a model whose weights change while it works is a model whose behaviour can drift after every evaluation we ran on it.',
    'URLs: https://www.dwarkesh.com/p/timelines-june-2025 · https://www.transformernews.ai/p/teaching-ai-to-continual-learning · https://arxiv.org/abs/2512.23675 · code: https://github.com/test-time-training/e2e',
  ].join('\n\n'));
  return s;
}

// ======================================================================
// 7. CONTINUAL LEARNING · latency chart
// ======================================================================
async function tttChartSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'INSIDE THE MACHINE · CONTINUAL LEARNING · 2', 'Long context without the slowdown');

  const ds = JSON.parse(fs.readFileSync(A('research', 'ttt_session', 'ttt_e2e_fig1_data_extracted.json'), 'utf8'));
  const lat = ds.latency_sec_per_1k_tokens_prefill_H100;
  const loss = ds.loss_delta_vs_full_attention;
  const labels = ds.labels.map(l => l + ' tokens');
  const cw = 7.1;
  const lab = capLabel(d, s, 'SPEED · SECONDS TO PROCESS 1,000 TOKENS · 3B MODELS · ONE H100', { x: CX0, y: 1.72, w: cw });
  const ch = d.chart(s, 'line', [
    { name: 'Transformer, full attention  (0.014 → 0.073 s)', labels, values: lat['Transformer with full attention'] },
    { name: 'TTT-E2E  (0.025 → 0.027 s)', labels, values: lat['TTT-E2E (ours)'] },
  ], { x: CX0 - 0.1, y: 2.0, w: cw + 0.1, h: 3.95 }, {
    chartColors: [HEX.steel, HEX.red], lineSize: 4, lineDataSymbolSize: 9,
    valAxisMinVal: 0, valAxisMaxVal: 0.08, valAxisMajorUnit: 0.02, valAxisLabelFormatCode: '0.00',
    catAxisLabelFontSize: 12, valAxisLabelFontSize: 12, legendFontSize: 13, legendPos: 't',
  });
  const cav = d.text(s, [
    { text: 'Caveats: ', options: { bold: true, color: d.S.amber } },
    { text: 'at 32K tokens and below TTT-E2E is actually slower; the paper tests only up to 128K; and on needle-in-a-haystack recall, full attention still wins.', options: { color: d.S.muted } },
  ], { x: CX0, y: 6.0, w: cw, h: 0.5, fontSize: 12, valign: 'top' });

  // right column: stats + native quality chart (paper Fig. 1 left)
  const rx = CX0 + cw + 0.45, rw = CX1 - rx, sw = (rw - 0.3) / 2;
  const s1 = stat(d, s, { x: rx, y: 1.75, w: sw, value: '2.7×', valueSize: 48, labelSize: 12, labelH: 0.62, label: 'faster than full attention at 128K tokens (paper, H100)' });
  const s2 = stat(d, s, { x: rx + sw + 0.3, y: 1.75, w: sw, value: '35×', valueSize: 48, labelSize: 12, labelH: 0.62, label: 'faster at 2M tokens (NVIDIA blog; beyond the paper’s 128K tests)', color: d.S.amber });
  const qLab = capLabel(d, s, 'QUALITY · LOSS GAP VS FULL ATTENTION', { x: rx, y: 3.3, w: rw });
  const short = ['8K', '16K', '32K', '64K', '128K'];
  const ch2 = d.chart(s, 'line', [
    { name: 'Full attention', labels: short, values: loss['Transformer with full attention'] },
    { name: 'Mamba 2', labels: short, values: loss['Mamba 2'] },
    { name: 'Gated DeltaNet', labels: short, values: loss['Gated DeltaNet'] },
    { name: 'TTT-E2E', labels: short, values: loss['TTT-E2E (ours)'] },
  ], { x: rx - 0.1, y: 3.58, w: rw + 0.1, h: 2.2 }, {
    chartColors: [HEX.steel, HEX.blue, HEX.amber, HEX.red], lineSize: 3, lineDataSymbolSize: 6, showLegend: false,
    valAxisMinVal: -0.02, valAxisMaxVal: 0.04, valAxisMajorUnit: 0.02, valAxisLabelFormatCode: '+0.00;-0.00;0',
    catAxisLabelFontSize: 11, valAxisLabelFontSize: 11,
  });
  const qCap = d.text(s, [
    { text: 'Lower = better. ', options: { bold: true, color: d.S.txt } },
    { text: 'TTT-E2E', options: { bold: true, color: d.S.red } },
    { text: ' stays below ', options: { color: d.S.muted } },
    { text: 'full attention', options: { bold: true, color: d.S.steel } },
    { text: ' at every length; ', options: { color: d.S.muted } },
    { text: 'Mamba 2', options: { bold: true, color: d.S.blue } },
    { text: ' and ', options: { color: d.S.muted } },
    { text: 'Gated DeltaNet', options: { bold: true, color: d.S.amber } },
    { text: ' fall behind as context grows.', options: { color: d.S.muted } },
  ], { x: rx, y: 5.84, w: rw, h: 0.66, fontSize: 12, valign: 'top' });

  anim(d, s, [lab, ch], { auto: true, effect: 'wipeLeft', dur: 1200 });
  anim(d, s, s1, { effect: 'zoom', dur: 450 });
  anim(d, s, s2, { effect: 'zoom', dur: 450 });
  // caveats qualify the speed chart and the 2.7× / 35× claims, so they land right after them
  anim(d, s, [cav], { auto: true, effect: 'fade', dur: 400, after: 200 });
  anim(d, s, [qLab, ch2, qCap], { effect: 'wipeLeft', dur: 900 });

  d.source(s, 'Data: Tandon et al., arXiv:2512.23675, Fig. 1 (both panels; values recovered from the paper’s vector figure) · 35×: NVIDIA Technical Blog (Yu Sun & Yejin Choi), Jan 9, 2026.');
  s.addNotes([
    'This chart is rebuilt from the paper’s own Figure 1 (values recovered from the figure’s vector geometry, accurate to about ±0.0002 s). It shows prefill time per 1,000 tokens for 3-billion-parameter models on a single H100 as the context doubles from 8K to 128K tokens (the x-axis doubles each step, as in the paper).',
    'Full attention: 0.014 s at 8K rising to 0.073 s at 128K — the cost per token keeps growing because every token looks back at every earlier token. TTT-E2E: about 0.025–0.027 s at every length — flat. At 128K that is 2.7× faster (0.0734 / 0.0274 = 2.68). NVIDIA reports 35× faster at 2 million tokens on its blog (vendor-reported; not in the paper’s figure).',
    'Right chart (quality): rebuilt from the left panel of the paper’s Figure 1 (values recovered from the vector figure, ±0.0003). It plots each method’s test loss minus full attention’s, so full attention is the zero line and below zero is better. TTT-E2E sits at about −0.013 at every length; Mamba 2 goes from −0.016 at 8K to +0.032 at 128K and Gated DeltaNet from −0.006 to +0.034 (the paper’s other baselines — SWA, hybrid SWA, TTT-KVB — are omitted for legibility; all end above zero). The paper: for 3B models trained on 164B tokens, TTT-E2E “scales with context length in the same way as Transformer with full attention, while others, such as Mamba 2 and Gated DeltaNet, do not.”',
    'Honest caveats: (1) At short contexts TTT-E2E is slower than full attention: still slower at 32K (0.0258 vs 0.0239 s per 1K tokens); the lines cross between 32K and 64K, so of the lengths tested it only wins from 64K up. (2) The paper evaluates up to 128K; “effectively infinite context” is an extrapolation of the constant-latency property, not a tested claim. (3) Weights-as-memory is lossy: on needle-in-a-haystack retrieval (Table 2), “Transformer with full attention dramatically outperforms the other methods, including ours, especially in long context.” (4) Fig. 8: “training latency is still a significant limitation of our current implementation.”',
    'Follow-on work in 2026: Self-Guided Test-Time Training (S-TTT, arXiv:2607.09415, Jul 2026) reports up to 15% relative improvement on long-context benchmarks.',
    'URLs: https://arxiv.org/abs/2512.23675 · https://arxiv.org/html/2512.23675v1 · https://developer.nvidia.com/blog/reimagining-llm-memory-using-context-as-training-data-unlocks-models-that-learn-at-test-time/',
  ].join('\n\n'));
  return s;
}

// ======================================================================
// 9. RSI · the user's two charts
// ======================================================================
async function rsiChartsSlide(d) {
  const s = d.slide('Content');
  head(s, 'INSIDE THE MACHINE · RECURSIVE SELF-IMPROVEMENT · 2', 'Claude now leads 26% of Anthropic’s model R&D');

  // NOTE: by content, image9 = Anthropic R&D Automation Index chart, image8 = Vals RSI Index chart.
  // Both cropped to their content (outer page margins removed) so the axes read larger; Vals (smallest native
  // text) gets the wider column.
  const B9 = { left: 82, top: 67, width: 1760, height: 1103 };
  const anImg = await crop(ORIG('image9.png'), 'anthropic_rdai_chart.png', B9);
  const B8 = { left: 20, top: 8, width: 789, height: 502 }, K8 = 2;
  const vaImg = await cropUp(ORIG('image8.png'), 'vals_rsi_chart_2x.png', B8, K8);
  const o9 = (x, y) => [x - B9.left, y - B9.top];
  const o8 = (x, y) => [(x - B8.left) * K8, (y - B8.top) * K8];
  const box = (o, x0, y0, x1, y1) => [...o(x0, y0), ...o(x1, y1)];
  const cy0 = 1.72, gap = 0.3, wv = 5.95, cw = CX1 - CX0 - gap - wv;
  const an = await frameW(d, s, anImg, CX0, cy0, cw);
  const va = await frameW(d, s, vaImg, CX0 + cw + gap, cy0, wv);

  // Readable callouts over the screenshots' tiny labels (positions in each image's own px; values read off the images).
  const PA = await pxMap(anImg, an);
  // Covers the chart's own annotation (which repeats its headline); the chart's curved leader continues from the
  // chip's lower edge down to the Aug 2026 point, ringed.
  const anTag = pxTag(d, s, PA, 0, box(o9, 1390, 606, 1790, 712), [
    { text: 'Aug 2026: ', options: { color: HEX.text } },
    { text: '26%', options: { color: 'FF8A80' } },
  ], { line: HEX.red, fontSize: 13 });
  const anRing = ring(d, s, PA(...o9(1742, 826)), 0.08, 'FF8A80');
  const PV = await pxMap(vaImg, va);
  const vAnth = pxTag(d, s, PV, 0, box(o8, 172, 106, 374, 164), [
    { text: 'Anthropic trend', options: { color: HEX.amber, breakLine: true } },
    { text: '→ 60% by Jul 2027', options: { color: HEX.text } },
  ], { line: HEX.amber });
  const vAnthL = leader(d, s, PV(...o8(374, 137)), PV(...o8(502, 146)), HEX.amber);
  const vAnthR = ring(d, s, PV(...o8(508.5, 146.5)), 0.07, HEX.amber);
  const vOai = pxTag(d, s, PV, 0, box(o8, 556, 232, 764, 290), [
    { text: 'OpenAI trend', options: { color: 'C9D1D9', breakLine: true } },
    { text: '→ 60% by Aug 2028', options: { color: HEX.text } },
  ], { line: 'C9D1D9' });
  const vOaiL = leader(d, s, PV(...o8(756, 232)), PV(...o8(767, 153)), 'C9D1D9');
  const vOaiR = ring(d, s, PV(...o8(769, 146.5)), 0.07, 'C9D1D9');
  const vOpus = pxTag(d, s, PV, 0, box(o8, 180, 196, 328, 229), [
    { text: 'Opus 5.5 · 37%', options: { color: HEX.amber } },
  ], { line: HEX.amber });
  const vOpusR = ring(d, s, PV(...o8(304.5, 239)), 0.06, HEX.amber);
  const sy = cy0 + Math.max(an.h, va.h) + 0.17;
  const st1 = statRow(d, s, { x: CX0, y: sy, w: cw, vw: 2.35, h: 0.75, value: '1% → 26%', valueSize: 30, labelSize: 12, label: [
    { text: 'of Anthropic’s model R&D tasks led by Claude, March → August 2026 ', options: { color: d.S.muted } },
    { text: '(Anthropic’s own index; not independently verified)', options: { color: d.S.amber } },
  ] });
  const st2 = statRow(d, s, { x: CX0 + cw + gap, y: sy, w: wv, vw: 1.75, h: 0.75, value: '37.31%', valueSize: 30, labelSize: 12, label: 'Claude Opus 5.5 on the Vals RSI Index (Oct 4, 2026). Vals: “Anthropic is on track for frontier-level AI researchers by July 2027”', color: d.S.amber });

  anim(d, s, an, { auto: true, effect: 'rise', dur: 550 });
  anim(d, s, va, { auto: true, effect: 'rise', dur: 550, after: 120 });
  anim(d, s, [...st1, ...anTag, anRing], { effect: 'zoom', dur: 450 });
  anim(d, s, [...st2, ...vOpus, vOpusR, ...vAnth, vAnthL, vAnthR, ...vOai, vOaiL, vOaiR], { effect: 'zoom', dur: 450 });

  d.source(s, 'Sources: Anthropic R&D Automation Index v2026.07 (Sep 17, 2026) · Vals AI RSI Index, extrapolation view (earlier capture; the live page has since been updated) and live leaderboard, Oct 4, 2026.');
  s.addNotes([
    'Recursive self-improvement starts with AI doing the work of AI research. Two separate measurements (one self-reported by Anthropic). Note the title is about Anthropic’s model R&D: Claude leads 26% of the model R&D tasks Anthropic tracks — not all of Anthropic’s R&D, and not a quarter of all AI research.',
    'The dark callouts on both screenshots just enlarge what the images already say: on the Anthropic chart, the August 2026 data point (26%, the AL4 “AI leads” band; the chip sits over the chart’s own small annotation, whose leader runs to that point), and on the Vals extrapolation view the labelled milestones “60% · Jul 2027” (Anthropic trend) and “60% · Aug 2028” (OpenAI trend), plus the latest Anthropic point, Opus 5.5 (37.31% on the live page).',
    'Left — Anthropic’s own R&D Automation Index: each month, model R&D tasks are rated on Epoch AI’s automation scale. The darkest band, AL4 “AI leads”, went 1% (Mar) → 3% (Apr) → 12% (May) → 14% (Jun) → 22% (Jul) → 26% (Aug 2026); February was under 1%. Caveat: Anthropic notes the index is not independently verified and was produced largely using Claude itself.',
    'Right — Vals AI’s RSI Index asks “Can a model do the research that builds the next model?” As of the live page on Oct 4, 2026: Claude Opus 5.5 37.31%, Claude Fable 5.1 36.09%, Claude Opus 5 33.02%, Gemini 4 Argon 30.55%. Vals’ key takeaway: “Anthropic is on track for frontier-level AI researchers by July 2027” — its trend line “reaches 0.6 in July 2027”.',
    'Caveat: this screenshot is an earlier capture of Vals’ extrapolation view (it shows 50% by Mar 2027 for Anthropic and Jan 2028 for OpenAI); the live page has since changed. Extrapolations are straight lines through a handful of points — they are a forecast, not a measurement.',
    'URLs: https://www.anthropic.com/institute/measuring-pace-of-ai-development · https://www.vals.ai/benchmarks/rsi_index',
  ].join('\n\n'));
  return s;
}

// ======================================================================
// 10. RSI · Anthropic's own numbers (native charts)
// ======================================================================
async function rsiAnthropicSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'INSIDE THE MACHINE · RECURSIVE SELF-IMPROVEMENT · 3', 'Inside Anthropic, Claude is building Claude');

  // left: the post + verbatim quote
  const lw = 4.35;
  // header cropped to title + dek so the headline reads large
  const hImg = await crop(TH('anthropic-when-ai-builds-itself.png'), 'anthropic_rsi_head.png', { left: 110, top: 225, width: 1000, height: 430 });
  const hdr = await frameW(d, s, hImg, CX0 + 0.05, 1.85, 3.7, { rot: -1.5 });
  const qy = 1.85 + hdr.h + 0.28;
  const q = d.text(s, [
    { text: '“Taken far enough, and given enough compute, that trend points to an AI system capable of fully autonomously designing and developing its own successor. ', options: { fontFace: 'Cambria', italic: true, fontSize: 15, color: d.S.txt } },
    { text: 'This is called recursive self-improvement.', options: { fontFace: 'Cambria', italic: true, fontSize: 15, color: d.S.txt, bold: true, breakLine: true, paraSpaceAfter: 6 } },
    { text: 'We are not there yet, and recursive self-improvement is not inevitable. But it could come sooner than most institutions are prepared for.”', options: { fontFace: 'Cambria', italic: true, fontSize: 14, color: d.S.muted, breakLine: true, paraSpaceAfter: 6 } },
    { text: '— Anthropic, “When AI builds itself,” June 2026', options: { fontSize: 11, color: d.S.steel } },
  ], { x: CX0, y: qy, w: lw, h: 6.5 - qy, valign: 'top' });

  // right: two native charts
  const rx = 5.35, rw = CX1 - rx, cg = 0.35, c1w = 3.3, c2w = rw - c1w - cg;
  const cy = 2.12, chH = 2.85;
  const l1 = capLabel(d, s, 'CODE PER ENGINEER · × PRE-2025', { x: rx, y: 1.72, w: c1w });
  const ch1 = d.chart(s, 'bar', [{
    name: 'Code per person', labels: ['’21–’24', 'Q1 ’25', 'Q2 ’25', 'Q3 ’25', 'Q4 ’25', 'Q1 ’26', 'Q2 ’26*'], values: [1.0, 1.2, 1.5, 1.9, 2.5, 5.8, 8.0],
  }], { x: rx - 0.1, y: cy, w: c1w + 0.1, h: chH }, {
    barDir: 'col', chartColors: [HEX.steel, '8A3A3C', '9E3436', 'B23234', 'C73537', 'D9373A', HEX.red], showValue: true, dataLabelFormatCode: '0.0"×"',
    dataLabelPosition: 'outEnd', dataLabelFontSize: 11, valAxisHidden: true, valGridLine: { style: 'none' }, valAxisMinVal: 0, valAxisMaxVal: 9.2,
    catAxisLabelFontSize: 10, barGapWidthPct: 40,
  });
  const l2 = capLabel(d, s, 'RESEARCHER ERRED · CLAUDE’S IDEA BETTER', { x: rx + c1w + cg, y: 1.72, w: c2w });
  const mLabels = ['Haiku 3 · Mar ’24', 'Sonnet 4 · May ’25', 'Sonnet 4.5 · Sep ’25', 'Haiku 4.5 · Oct ’25', 'Opus 4.5 · Nov ’25', 'Sonnet 4.6 · Feb ’26', 'Opus 4.6 · Feb ’26', 'Opus 4.7 · Apr ’26', 'Mythos Preview · Apr ’26'];
  const mVals = [22, 48, 50, 45, 51, 45, 55, 59, 64];
  const cols = mVals.map((v, i) => (i === mVals.length - 1 ? HEX.red : i === 0 ? HEX.steel : '9A4446')).reverse();
  const ch2H = 2.42;
  const ch2 = d.chart(s, 'bar', [{ name: 'Model better', labels: [...mLabels].reverse(), values: [...mVals].reverse() }],
    { x: rx + c1w + cg - 0.1, y: cy - 0.05, w: c2w + 0.1, h: ch2H }, {
      barDir: 'bar', chartColors: cols, showValue: true, dataLabelFormatCode: '0"%"', dataLabelPosition: 'outEnd', dataLabelFontSize: 10,
      valAxisHidden: true, valGridLine: { style: 'none' }, valAxisMinVal: 0, valAxisMaxVal: 78, catAxisLabelFontSize: 10, barGapWidthPct: 35,
      catAxisLineShow: false,
    });
  const ch2Cap = d.text(s, 'Of 129 internal sessions where a researcher went down a wrong path: % where Claude’s suggestion beat the researcher’s (ties not shown; practical ceiling ≈90%)',
    { x: rx + c1w + cg, y: cy - 0.05 + ch2H + 0.04, w: c2w, h: 0.5, fontSize: 10, color: d.S.muted, valign: 'top' });
  // Everything on this slide is the company's own data: say so next to the numbers, not just in the notes.
  const vy = cy - 0.05 + ch2H + 0.6;
  const vBar = d.rect(s, { x: rx, y: vy + 0.03, w: 0.05, h: 0.22, fill: { color: HEX.amber }, line: { color: HEX.amber, width: 0 } });
  const vNote = d.text(s, [
    { text: 'ANTHROPIC-REPORTED  ', options: { bold: true, charSpacing: 2, fontSize: 10 } },
    { text: 'All figures here are the company’s own internal data — not independently verified', options: {} },
  ], { x: rx + 0.15, y: vy, w: rw - 0.15, h: 0.28, fontSize: 11, color: d.S.amber, valign: 'middle' });

  const sy = vy + 0.38;
  const st1 = statRow(d, s, { x: rx, y: sy, w: c1w, vw: 1.25, h: 0.95, value: '80%+', valueSize: 30, labelSize: 12, label: 'of code merged at Anthropic is written by Claude' });
  const st2 = statRow(d, s, { x: rx + c1w + cg, y: sy, w: c2w, vw: 1.45, h: 0.95, value: '4 mo.', valueSize: 30, labelSize: 12, label: 'doubling time of the task length AI can do alone — down from 7 months', color: d.S.amber });

  anim(d, s, hdr, { auto: true, effect: 'rise', dur: 500 });
  anim(d, s, [q], { auto: true, effect: 'fade', after: 150 });
  anim(d, s, [l1, ch1], { effect: 'wipeLeft', dur: 900 });
  anim(d, s, [vBar, vNote], { auto: true, effect: 'fade', dur: 400, after: 100 });
  anim(d, s, [l2, ch2, ch2Cap], { effect: 'wipeLeft', dur: 900 });
  anim(d, s, [...st1, ...st2], { effect: 'zoom', dur: 400 });

  d.source(s, 'Sources: Anthropic, “When AI builds itself” (Jun 2026; charts updated Sep 2026) · Fortune (Beatrice Nolan), Jun 5, 2026.   * Q2 2026 is a partial quarter.');
  s.addNotes([
    'Anthropic’s own post, “When AI builds itself” (June 2026), is the clearest statement from a frontier lab that it is on the road to recursive self-improvement. Verbatim: “Taken far enough, and given enough compute, that trend points to an AI system capable of fully autonomously designing and developing its own successor. This is called recursive self-improvement. We are not there yet, and recursive self-improvement is not inevitable. But it could come sooner than most institutions are prepared for.” It also says: “If it were possible to effectively slow the development of this technology to give ourselves more time to deal with its immense implications, we think that would likely be a good thing.”',
    'Left chart: lines of code merged per active contributor, as a multiple of the pre-2025 average: 1.2× (Q1 2025) → 1.5× → 1.9× → 2.5× → 5.8× (Q1 2026) → 8.0× (Q2 2026, partial quarter). Lines of code is a crude productivity metric — but the direction is unambiguous. Fortune: “More than 80% of code merged into the company’s codebase is now written by Claude.”',
    'Right chart: Anthropic took 129 internal research sessions where a human researcher went down a wrong path and asked whether the model’s suggestion would have been better. The model’s suggestion won 22% of the time for Claude Haiku 3 (Mar 2024) and 64% for Claude Mythos Preview (Apr 2026); ties not shown (9–14%). Anthropic puts the practical ceiling at about 90%.',
    'Task length: “The length of tasks that they can reliably complete on their own has been doubling roughly every four months, up from an earlier trend of doubling every seven months.”',
    'Caveat: these are company-reported internal metrics, not independently verified.',
    'If asked about the 90% on the jobs slide ("AI writes the code — firms cite it for job cuts"): that was Anthropic’s CFO in May saying about 90% of code is written by Claude Code; the 80%+ here is Fortune (June) on code merged at Anthropic. Different speakers, months and measures — not a contradiction, and both are company claims.',
    'URLs: https://www.anthropic.com/institute/recursive-self-improvement · https://fortune.com/2026/06/05/anthropic-ai-pause-development-recursive-self-improvement/',
  ].join('\n\n'));
  return s;
}

// ======================================================================
// 11. RSI · OpenAI, GovAI, and the timeline
// ======================================================================
async function rsiLoopSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'INSIDE THE MACHINE · RECURSIVE SELF-IMPROVEMENT · 4', 'AI labs say they’re already automating AI research');

  const eng = await crop(TH('engadget-research-intern.png'), 'engadget_head.png', { left: 0, top: 0, width: 1610, height: 680 });

  // top row: three clippings
  const e = await frameW(d, s, eng, CX0, 1.9, 3.7, { rot: -2 });
  // left column only (title + first abstract paragraph); the caption below carries the authors
  const gImg = await crop(TH('govai-intelligence-explosion.png'), 'govai_head.png', { left: 150, top: 90, width: 1220, height: 650 });
  const gx = 4.65, gw = 4.1;
  const g = await frameW(d, s, gImg, gx, 1.82, gw, { rot: 1 });
  // TNW: headline only (its dek is unreadable at this size), as wide as the column allows
  const tImg = await crop(TH('tnw-pachocki-slowdown.png'), 'tnw_headline.png', { left: 83, top: 98, width: 2390, height: 261 });
  const tx = gx + gw + 0.3, tw = CX1 - tx;
  const t = await frameW(d, s, tImg, tx, 1.9, tw, { rot: -1.5 });
  // Verbatim line from Pachocki's essay (the one the TNW headline paraphrases)
  const tq = d.text(s, [
    { text: '“…no lab has solved alignment and monitoring to a sufficient degree to continue responsibly scaling at maximum speed for much longer.”', options: { fontFace: 'Cambria', italic: true, fontSize: 14, color: d.S.txt } },
    { text: '  — Jakub Pachocki', options: { fontSize: 11, color: d.S.muted } },
  ], { x: tx + 0.05, y: 1.9 + t.h + 0.22, w: tw - 0.05, h: 1.05, valign: 'top' });

  // captions / stats under each; the two stats share one baseline row
  const sy = 1.9 + e.h + 0.2;
  const eStat = statRow(d, s, { x: CX0, y: sy, w: 3.7, vw: 1.7, h: 0.75, value: 'On time', valueSize: 28, labelSize: 12, label: 'Altman set the goal in Oct 2025; OpenAI says it was met in Sep 2026' });
  const gCap = d.text(s, [
    { text: '22 authors, ', options: { bold: true, color: d.S.txt } },
    { text: 'incl. Hinton, Bengio & Barto (Turing Awards), Pachocki (OpenAI) and Jack Clark (Anthropic)', options: { color: d.S.muted } },
  ], { x: gx + 0.05, y: 1.82 + g.h + 0.15, w: gw, h: 0.5, fontSize: 12, valign: 'top' });
  const tStat = statRow(d, s, { x: tx, y: sy, w: tw, vw: 0.85, h: 0.75, value: '3.1', valueSize: 28, labelSize: 12, label: 'AI agent-workdays per human workday in OpenAI research, mid-Aug 2026 (OpenAI-reported)' });

  // bottom: timeline
  const ly = 5.62, x0 = 1.05, x1 = 12.25; // Sep 2026 → May 2028 (20 months)
  const mx = (m) => x0 + (x1 - x0) * m / 20;
  const tl = [];
  const ln = d.name('tl');
  s.addShape(d.pres.shapes.LINE, { x: CX0, y: ly, w: CX1 - CX0, h: 0, line: { color: HEX.steel, width: 1.5, endArrowType: 'triangle' }, objectName: ln });
  tl.push(ln);
  const tlLab = d.text(s, [
    { text: 'WHEN DOES THE LOOP CLOSE?', options: { fontSize: 10, bold: true, color: d.S.steel, charSpacing: 2, breakLine: true, paraSpaceAfter: 3 } },
    { text: 'AI 2027 dates are medians conditional on a superhuman coder arriving Mar 2027', options: { fontSize: 10, color: d.S.muted } },
  ], { x: CX0, y: ly + 0.14, w: 3.55, h: 0.62, valign: 'top' });
  // Labels sit centred on their dot (clamped to the margins); the two close right-hand dots split above/below.
  const ms = [
    { m: 0, date: 'SEP 2026 · NOW', text: ['OpenAI: automated research intern'], up: true, color: HEX.red, align: 'left', x: CX0, w: 2.8 },
    { m: 10, date: 'JUL 2027', text: ['Vals trend: Anthropic reaches frontier-level AI researchers', 'AI 2027: superhuman AI researcher'], up: false, color: HEX.amber, align: 'center', w: 4.6 },
    { m: 14, date: 'NOV 2027', text: ['AI 2027: superintelligent', 'AI researcher'], up: true, color: HEX.amber, align: 'center', w: 2.2 },
    { m: 18, date: 'MAR 2028', text: ['OpenAI target: automated AI researcher'], up: false, color: HEX.red, align: 'center', w: 2.9 },
    { m: 19, date: 'APR 2028', text: ['AI 2027: artificial', 'superintelligence'], up: true, color: HEX.amber, align: 'center', w: 1.9 },
  ];
  const groups = ms.map((o) => {
    const cx = mx(o.m);
    const gg = [];
    const dot = d.name('ms');
    s.addShape(d.pres.shapes.OVAL, { x: cx - 0.09, y: ly - 0.09, w: 0.18, h: 0.18, fill: { color: o.color }, line: { color: 'FFFFFF', width: 1.25 }, objectName: dot });
    gg.push(dot);
    let lx = o.align === 'left' ? cx - 0.1 : cx - o.w / 2;
    if (o.x !== undefined) lx = o.x;
    lx = Math.max(CX0, Math.min(lx, CX1 - o.w));
    const runs = [
      { text: o.date, options: { bold: true, color: o.color, fontSize: 10, charSpacing: 2, breakLine: true } },
      ...o.text.map((t, i) => ({ text: t, options: { color: HEX.text, fontSize: 11, breakLine: i < o.text.length - 1 } })),
    ];
    const lh = 0.2 + 0.2 * o.text.length;
    const y = o.up ? ly - 0.12 - lh : ly + 0.14;
    gg.push(d.text(s, runs, { x: lx, y, w: o.w, h: lh, align: o.align, valign: o.up ? 'bottom' : 'top' }));
    return gg;
  });

  anim(d, s, [...e, ...eStat], { auto: true, effect: 'rise', dur: 500 });
  anim(d, s, g, { auto: true, effect: 'rise', dur: 500, after: 100 });
  anim(d, s, [gCap], { auto: true, effect: 'fade', dur: 300 });
  anim(d, s, [...t, tq, ...tStat], { effect: 'rise', dur: 500 });
  anim(d, s, [ln, tlLab, ...groups[0]], { effect: 'wipeLeft', dur: 700 });
  groups.slice(1).forEach((gg, i) => anim(d, s, gg, { auto: true, effect: 'fade', dur: 350, after: i ? 250 : 100 }));

  d.source(s, 'Sources: Engadget & The Next Web, Sep 6, 2026 · GovAI, Sep 28, 2026 · OpenAI, “Research acceleration” & J. Pachocki, “An Alien Mind,” Sep 6, 2026 · Vals AI RSI Index, Oct 4, 2026 · AI 2027 (Apr 2025).');
  s.addNotes([
    'OpenAI, “Research acceleration: The view inside OpenAI” (Sep 6, 2026): “According to our measurements, we have now reached the goal, announced last fall, of having an automated research intern by September of this year.” By “research intern” they mean a system that can carry out well-defined research tasks under human direction, including tasks that would take a skilled researcher a few days. “We are making strong progress toward creating an automated AI researcher by March of 2028.” Same post: “Before June 2026, total agent runtime across the research organization was still below that of total human labor. That has since changed … as of mid-August, in total, the research organization uses 3.1 agent-workdays of effort for every workday of human labor.” (Median researcher: over $600/day of agent inference; 90th percentile over $7,000/day.)',
    'Altman’s original target (Oct 2025 livestream): an automated AI research intern by September 2026 and “a true automated AI researcher by March of 2028.” They hit the first one on schedule.',
    'The Next Web, same day: OpenAI’s chief scientist Jakub Pachocki says no lab should keep scaling at maximum speed. The line under the clipping is verbatim from his essay “An Alien Mind” (Sep 6, 2026; https://openai.com/index/an-alien-mind/), shown with a leading ellipsis: “Currently I believe that no lab has solved alignment and monitoring to a sufficient degree to continue responsibly scaling at maximum speed for much longer.”',
    'GovAI paper (Sep 28, 2026), 22 authors including Alan Chan, Christoph Winter, Andrew Barto, Jakub Pachocki, Geoffrey Hinton, Eric Horvitz, Yoshua Bengio, Dawn Song, Jack Clark, Hilary Greaves, Anton Korinek: “AI now plays a major role in building AI. Preliminary evidence suggests this could radically accelerate AI progress in an ‘intelligence explosion,’ where years of AI progress are compressed into months or less… Policymakers, including heads of government, urgently need to understand and prepare for this possibility.” Coverage quotes it: “once an intelligence explosion begins, the window for action may close.”',
    'Timeline: Vals’ trend line projects “Anthropic is on track for frontier-level AI researchers by July 2027” (straight-line extrapolation). AI 2027’s takeoff forecast (AI Futures Project, Apr 2025) — conditional on a superhuman coder arriving in March 2027 — gives medians of Jul 2027 for a superhuman AI researcher, Nov 2027 for a superintelligent AI researcher, and Apr 2028 for artificial superintelligence (90th percentiles: Mar 2028, Jan 2034, after 2100). These are forecasts, not facts — but they line up uncomfortably with OpenAI’s own March 2028 target.',
    'Also: Fortune/AP (Sep 19, 2026): FLI’s Anthony Aguirre on full autonomy: “I think this is probably the worst idea in the history of humanity to do this.” Not shown: Reuters/KSL “Anthropic says Claude now leads a quarter of work building its next AI models” (headline not re-verified for this deck).',
    'URLs: https://www.engadget.com/2251859/openai-says-it-reached-its-goal-of-creating-an-automated-research-intern/ · https://openai.com/index/research-acceleration-view-inside-openai/ · https://thenextweb.com/news/openai-slowdown-pachocki-alien-mind-research-intern-compute · https://www.governance.ai/research-paper/what-if-automating-ai-r-d-triggers-an-intelligence-explosion · https://www.vals.ai/benchmarks/rsi_index · https://ai-2027.com/',
  ].join('\n\n'));
  return s;
}

// The intelligence-explosion slide is built by theory_slides.js (shared module); it opens this module's RSI run, so
// number its kicker "· 1" like every other sub-section opener (patched on the returned slide, not in that file).
function numberKicker(s, kicker) {
  const k = (s._slideObjects || []).find(o => o.options && o.options.placeholder === 'kicker');
  if (!k || !Array.isArray(k.text) || !k.text[0]) throw new Error('kicker placeholder not found');
  k.text[0].text = kicker;
}

async function build(d) {
  // Neuralese run: words drifting (o3, 2025) → no words (Coconut) → in production (Astra) → too much to read → AI reads it.
  await alienSlide(d);
  await latentSlide(d);
  await astraSlide(d);
  await cotVolumeSlide(d);
  await petabytesSlide(d);
  await tttConceptSlide(d);
  await tttChartSlide(d);
  numberKicker(await require('./theory_slides').explosionSlide(d), 'INSIDE THE MACHINE · RECURSIVE SELF-IMPROVEMENT · 1');
  await rsiChartsSlide(d);
  await rsiAnthropicSlide(d);
  await rsiLoopSlide(d);
}

module.exports = { build };
