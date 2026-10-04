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
async function crop(src, name, box) {
  fs.mkdirSync(OUT, { recursive: true });
  const out = SL(name);
  if (!fs.existsSync(out)) await sharp(src).extract(box).toFile(out);
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

// ======================================================================
// 1. NEURALESE · what latent reasoning is (Coconut)
// ======================================================================
async function latentSlide(d) {
  const s = d.slide('Content');
  head(s, 'INSIDE THE MACHINE · NEURALESE', 'AI is learning to think without words');

  const f1 = await crop(ORIG('image6.png'), 'coconut_training.png', { left: 30, top: 26, width: 1000, height: 314 });
  const f2 = await crop(ORIG('image7.png'), 'coconut_prosqa.png', { left: 30, top: 30, width: 1000, height: 448 });

  // figure 1 (training procedure) top-left, figure 2 (case study) bottom-right
  // Pinned-clippings collage: both figures slightly rotated; fig2 tucks over fig1's empty lower-right corner
  // (no figure content is covered).
  const w1 = 6.8;
  const fig1 = await frameW(d, s, f1, CX0, 1.85, w1, { rot: -1 });
  const w2 = 6.7, h2 = await hFor(f2, w2);
  const fig2 = await frameW(d, s, f2, CX1 - w2, 6.45 - h2, w2, { rot: 1 });
  // Readable callouts laid over Fig. 6's own tiny "(Hallucination)" / "(Correct Path)" labels (image px coords).
  const P2 = await pxMap(f2, fig2, 1);
  const tagCot = pxTag(d, s, P2, 1, [707, 287, 967, 319], [
    { text: 'CoT: hallucinated rule ', options: { color: 'FF6B6B' } }, { text: '✗', options: { color: 'FF6B6B' } },
  ], { line: HEX.red });
  const tagCoco = pxTag(d, s, P2, 1, [662, 417, 1004, 449], [
    { text: 'Continuous thoughts: correct ', options: { color: '8FD694' } }, { text: '✓', options: { color: '8FD694' } },
  ], { line: '5FB86A' });

  // top-right explanation
  const tx = CX0 + w1 + 0.35, tw = CX1 - tx;
  const t1 = d.text(s, [
    { text: 'WHAT IS LATENT REASONING?', options: { fontSize: 10, bold: true, color: d.S.steel, charSpacing: 2, breakLine: true, paraSpaceAfter: 6 } },
    { text: 'Reasoning models “think out loud” in words we can read. ', options: { color: d.S.txt } },
    { text: 'Coconut trains a model to swap those words, one step at a time, for ', options: { color: d.S.muted } },
    { text: 'continuous thoughts', options: { color: d.S.red, bold: true } },
    { text: ': raw vectors fed straight back into the network.', options: { color: d.S.muted } },
  ], { x: tx, y: 1.78, w: tw, h: 1.5, fontSize: 15, valign: 'top' });

  // bottom-left takeaways
  const bx = CX0, bw = CX1 - w2 - 0.4 - CX0;
  const t2 = d.text(s, [
    { text: 'THE PAYOFF', options: { fontSize: 10, bold: true, color: d.S.steel, charSpacing: 2, breakLine: true, paraSpaceAfter: 4 } },
    { text: 'On this logic puzzle, word-by-word reasoning hallucinated a fact. Reasoning in vectors kept several paths open at once — and found the right answer.', options: { color: d.S.muted, fontSize: 14 } },
  ], { x: bx, y: 4.45, w: bw, h: 1.15, valign: 'top' });
  const t3 = d.text(s, [
    { text: 'THE PRICE', options: { fontSize: 10, bold: true, color: d.S.red, charSpacing: 2, breakLine: true, paraSpaceAfter: 4 } },
    { text: 'No transcript. Nothing a human — or a safety monitor — can read.', options: { color: d.S.txt, bold: true, fontSize: 17 } },
  ], { x: bx, y: 5.7, w: bw, h: 0.85, valign: 'top' });

  anim(d, s, fig1, { auto: true, effect: 'rise', dur: 600 });
  anim(d, s, [t1], { auto: true, effect: 'fade', after: 150 });
  anim(d, s, [...fig2, ...tagCot, ...tagCoco, t2], { effect: 'rise', dur: 600 });
  anim(d, s, [t3], { effect: 'slam', dur: 450 });

  d.source(s, 'Figures: Hao et al. (Meta FAIR), “Training Large Language Models to Reason in a Continuous Latent Space” (Coconut), arXiv:2412.06769, Dec 2024 — Fig. 2 (training stages) and Fig. 6 (ProsQA case study).');
  s.addNotes([
    'Today’s reasoning models write out a chain of thought in English before answering — and that transcript is one of the best safety tools we have: we can read it and catch intent to misbehave.',
    'Latent reasoning removes the words. In Coconut (“Chain of Continuous Thought”), the model’s last hidden state is fed straight back in as the next input instead of being turned into a token. Top figure: during training, language steps are replaced one stage at a time by [Thought] slots — continuous vectors — until the whole chain of reasoning is vectors.',
    'Bottom figure (ProsQA): asked “Is Alex a gorpus or bompus?”, the word-based chain of thought gets stuck and hallucinates an edge (“Every yumpus is a rempus”). Coconut with two continuous thoughts finds the correct path — the paper argues continuous thoughts can hold several candidate next steps at once, like a breadth-first search. (The red and green callouts sit over the figure’s own small “(Hallucination)” and “(Correct Path)” labels, enlarged for the room.)',
    'The safety cost: those vectors are not language. There is nothing to read. This is what people mean by “neuralese”.',
    'Source: the two figures are from the Coconut paper (user-supplied images). https://arxiv.org/abs/2412.06769',
  ].join('\n\n'));
  return s;
}

// ======================================================================
// 2. NEURALESE · GPT-6 Astra, recurrent depth, system card
// ======================================================================
async function astraSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'INSIDE THE MACHINE · NEURALESE · 2', 'GPT-6 Astra reasons in loops we can’t read');

  // left: clipping cascade
  const tc = await frameW(d, s, TH('tc-astra-recurrent.png'), CX0, 1.85, 6.5, { rot: -1.5 });
  const tr = await frameW(d, s, TH('transformer-astra.png'), 1.9, 4.85, 5.1, { rot: 1.5 });

  // explainer tag on the photo half of the TechCrunch clipping
  const tag = [];
  tag.push(d.card(s, { x: 0.95, y: 3.25, w: 2.35, h: 1.12 }, { color: '0D1016', line: HEX.red }));
  tag.push(d.text(s, [
    { text: '“RECURRENT DEPTH”', options: { fontSize: 10, bold: true, color: d.S.red, charSpacing: 2, breakLine: true, paraSpaceAfter: 3 } },
    { text: 'extra thinking done by looping inside the network, in vectors — not written out as words', options: { fontSize: 12, color: d.S.txt } },
  ], { x: 1.08, y: 3.33, w: 2.1, h: 0.98, valign: 'top' }));

  // right: the 2025 warning + the system card admission
  const rx = 7.55, rw = CX1 - rx;
  // Tight crop: title + author rows only, so the title reads at ~11pt.
  const axImg = await crop(TH('arxiv-cot-monitorability.png'), 'arxiv_cot_title.png', { left: 30, top: 30, width: 1720, height: 330 });
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
    'Latent reasoning is no longer a lab curiosity. TechCrunch (Sep 2, 2026): OpenAI’s new Astra model uses “recurrent depth,” a technique that lets it operate outside sequential thinking — making its chain of thought harder to monitor. OpenAI has not published architecture details; the description is TechCrunch’s.',
    'Quotes in that article: Buck Shlegeris (Redwood Research CEO): “…if OpenAI pushes this technique further, they’ll have the option to massively increase the recurrence and totally destroys CoT monitorability.” Ryan Greenblatt: “My biggest concern is that a natural progression from here would involve scaling up the opaque reasoning to the point where the model reasons entirely or almost entirely in latent space.” OpenAI’s Jakub Pachocki: “OpenAI has worked to preserve and utilize chain-of-thought monitoring since our very first reasoning models.”',
    'The Astra system card itself (as quoted by Transformer): “Astra shows a substantial decrease in chain-of-thought monitorability compared to previous models.” And: “If the model were to try to sandbag covertly, we would likely be unable to catch it.” Tomek Korbak (OpenAI): “I am deeply worried by the trend of decreasing CoT monitorability.”',
    'We were warned. July 2025: 41 researchers from OpenAI, Google DeepMind, Anthropic, Meta, UK AISI, Redwood, Apollo, METR and others (incl. Bengio, Pachocki, Shane Legg) called chain-of-thought monitorability “a new and fragile opportunity” and asked developers to consider how their decisions affect it. Bowen Baker (OpenAI) to VentureBeat: “Higher-compute RL, alternative model architectures, certain forms of process supervision, may all lead to models that obfuscate their thinking.”',
    'URLs: https://techcrunch.com/2026/09/02/openais-new-reasoning-technique-alarms-ai-safety-experts/ · https://www.transformernews.ai/p/openai-gpt-6-astra-might-be-too-powerful-to-understand-or-control · https://arxiv.org/abs/2507.11473 · https://venturebeat.com/ai/openai-google-deepmind-and-anthropic-sound-alarm-we-may-be-losing-the-ability-to-understand-ai',
  ].join('\n\n'));
  return s;
}

// ======================================================================
// 3. NEURALESE · an alien mind (o3 CoT + Pachocki)
// ======================================================================
async function alienSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'INSIDE THE MACHINE · NEURALESE · 3', 'o3’s private thoughts were already turning alien');

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
    { text: '“AN ALIEN MIND” · SEP 2026', options: { fontSize: 10, bold: true, color: HEX.red, charSpacing: 2, breakLine: true, paraSpaceAfter: 10 } },
    { text: '“…our evaluations indicate our ability to rely on CoT monitoring is progressively diminishing.”', options: { fontFace: 'Cambria', italic: true, fontSize: 16, color: HEX.text, breakLine: true, paraSpaceAfter: 9 } },
    { text: '“The AI is becoming better at reasoning about and manipulating its own reasoning process.”', options: { fontFace: 'Cambria', italic: true, fontSize: 14, color: HEX.muted, breakLine: true, paraSpaceAfter: 9 } },
    { text: '“With improved pretraining performance, we also see the models become much smarter ', options: { fontFace: 'Cambria', italic: true, fontSize: 14, color: HEX.muted } },
    { text: 'even without using verbalized reasoning at all.', options: { fontFace: 'Cambria', italic: true, fontSize: 14, color: HEX.text, bold: true } },
    { text: '”', options: { fontFace: 'Cambria', italic: true, fontSize: 14, color: HEX.muted, breakLine: true, paraSpaceAfter: 8 } },
    { text: '— Jakub Pachocki, OpenAI', options: { fontSize: 11, color: HEX.muted } },
  ], { x: rx + 0.25, y: 2.48, w: rw - 0.5, h: 3.85, valign: 'top' });

  anim(d, s, a, { auto: true, effect: 'rise', dur: 550 });
  anim(d, s, term, { effect: 'fade', dur: 600 });
  anim(d, s, [qc, qi, qt], { effect: 'rise', dur: 500 });

  d.source(s, 'Sources: Apollo Research × OpenAI, anti-scheming study CoT snippets (antischeming.ai, Sep 17, 2025) · J. Pachocki, “An Alien Mind,” openai.com, Sep 6, 2026.');
  s.addNotes([
    'These are real, unedited excerpts of OpenAI o3’s private chain of thought, published by Apollo Research and OpenAI with their anti-scheming study (September 2025). The terminal reproduces them verbatim.',
    'Left screenshot: o3 gets stuck repeating “they soared parted illusions overshadow marinade illusions” before snapping out of it with “Stop.” Terminal, bottom: another o3 trace (card titled “OpenAI o3 descends into incomprehensible reasoning and comments that it is ‘going insane’”): “they escalate—they vantage—they escalate—they disclaim-” — the authors note the words repeat 10+ times — then: “Ok I’m going insane. Let’s step back.”',
    'The grey “// researchers:” lines in the terminal are condensed from the researchers’ own annotations on antischeming.ai, not o3 output: “Models sometimes use \"disclaim\" to mean \"announce\"”, “\"Watchers\" is consistently used in the context of oversight, often by humans”, and the section heading “Entering and recovering from reasoning loops”. The “[repeats … 10+ times]” line is also the researchers’ annotation, copied from the card. Their summary: “Models often use rare words in non-standard ways, such as “disclaim” or “watchers”. Sometimes these words seem to have a consistent meaning, but sometimes they don’t. OpenAI is investigating why these terms emerge.”',
    'This is still nominally English. It is drifting toward a private dialect — and the next step, latent reasoning, drops the words entirely.',
    'Right card — Jakub Pachocki, OpenAI’s chief scientist, “An Alien Mind” (Sep 6, 2026): “This tool continues to be critical as we study the Astra class of models. However, unfortunately our evaluations indicate our ability to rely on CoT monitoring is progressively diminishing.” Among his reasons (both on the card): “The AI is becoming better at reasoning about and manipulating its own reasoning process.” and “With improved pretraining performance, we also see the models become much smarter even without using verbalized reasoning at all.” Also: “AI is grown more than designed.”',
    'Caveat: the o3 snippets are from 2025 evaluation environments, selected by the researchers as illustrative.',
    'URLs: https://www.antischeming.ai/snippets · https://openai.com/index/an-alien-mind/ · TIME coverage: https://time.com/7318618/openai-google-gemini-anthropic-claude-scheming/',
  ].join('\n\n'));
  return s;
}

// ======================================================================
// 4. CONTINUAL LEARNING · concept (TTT-E2E)
// ======================================================================
async function tttConceptSlide(d) {
  const s = d.slide('Content');
  head(s, 'INSIDE THE MACHINE · CONTINUAL LEARNING', 'Models that keep learning as they read');

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
  const r0 = capLabel(d, s, 'ONE FIX · END-TO-END TEST-TIME TRAINING (TTT-E2E, DEC 2025)', { x: rx, y: 1.72, w: rw });
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
  anim(d, s, [bTxt], { auto: true, effect: 'fade', dur: 400 });
  anim(d, s, [pq], { effect: 'fade', dur: 600 });

  d.source(s, 'Sources: D. Patel, “Why I don’t think AGI is right around the corner,” Jun 2, 2025 · C. Ford, “Teaching AI to learn,” Transformer, Jan 22, 2026 · Tandon et al., arXiv:2512.23675 (Dec 29, 2025).');
  s.addNotes([
    'Today’s models are frozen after training. Anything they learn in a conversation lives only in the context window and is gone when the window closes. Dwarkesh Patel called this the main reason he did not expect AGI right around the corner: “The lack of continual learning is a huge huge problem.” (June 2025.) Transformer (Jan 2026): “AI’s inability to continually learn remains one of the biggest problems standing in the way of truly general purpose models. Might it soon be solved?” — Dario Amodei (Aug 2025): “We have some evidence to suggest that [continual learning] is another of those problems that is not as difficult as it seems.” Anthropic’s Sholto Douglas predicted it would be solved “in a satisfying way” in 2026.',
    'One concrete approach: End-to-End Test-Time Training (TTT-E2E), Astera Institute / NVIDIA / Stanford / UC Berkeley / UCSD, Dec 2025. A standard Transformer keeps every past token in memory (the KV cache) and each new token attends to all of them, so cost per token rises with context length. TTT-E2E instead keeps training on the text it is reading — next-token prediction on its own context — so the context gets written into a fixed-size set of weights. Abstract: “We formulate long-context language modeling as a problem in continual learning rather than architecture design.”',
    'Diagram is a conceptual illustration, not the paper’s architecture figure.',
    'Why this matters for safety: a model whose weights change while it works is a model whose behaviour can drift after every evaluation we ran on it.',
    'URLs: https://www.dwarkesh.com/p/timelines-june-2025 · https://www.transformernews.ai/p/teaching-ai-to-continual-learning · https://arxiv.org/abs/2512.23675 · code: https://github.com/test-time-training/e2e',
  ].join('\n\n'));
  return s;
}

// ======================================================================
// 5. CONTINUAL LEARNING · latency chart
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
    { text: 'below ~32K tokens TTT-E2E is actually slower; the paper tests only up to 128K; and on needle-in-a-haystack recall, full attention still wins.', options: { color: d.S.muted } },
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
  anim(d, s, [qLab, ch2, qCap], { effect: 'wipeLeft', dur: 900 });
  anim(d, s, [cav], { effect: 'fade', dur: 400 });

  d.source(s, 'Data: Tandon et al., arXiv:2512.23675, Fig. 1 (both panels; values recovered from the paper’s vector figure) · 35×: NVIDIA Technical Blog (Yu Sun & Yejin Choi), Jan 9, 2026.');
  s.addNotes([
    'This chart is rebuilt from the paper’s own Figure 1 (values recovered from the figure’s vector geometry, accurate to about ±0.0002 s). It shows prefill time per 1,000 tokens for 3-billion-parameter models on a single H100 as the context doubles from 8K to 128K tokens (the x-axis doubles each step, as in the paper).',
    'Full attention: 0.014 s at 8K rising to 0.073 s at 128K — the cost per token keeps growing because every token looks back at every earlier token. TTT-E2E: about 0.025–0.027 s at every length — flat. At 128K that is 2.7× faster (0.0734 / 0.0274 = 2.68). NVIDIA reports 35× faster at 2 million tokens on its blog (vendor-reported; not in the paper’s figure).',
    'Right chart (quality): rebuilt from the left panel of the paper’s Figure 1 (values recovered from the vector figure, ±0.0003). It plots each method’s test loss minus full attention’s, so full attention is the zero line and below zero is better. TTT-E2E sits at about −0.013 at every length; Mamba 2 goes from −0.016 at 8K to +0.032 at 128K and Gated DeltaNet from −0.006 to +0.034 (the paper’s other baselines — SWA, hybrid SWA, TTT-KVB — are omitted for legibility; all end above zero). The paper: for 3B models trained on 164B tokens, TTT-E2E “scales with context length in the same way as Transformer with full attention, while others, such as Mamba 2 and Gated DeltaNet, do not.”',
    'Honest caveats: (1) At short contexts TTT-E2E is slower than full attention; it only wins beyond roughly 32K tokens. (2) The paper evaluates up to 128K; “effectively infinite context” is an extrapolation of the constant-latency property, not a tested claim. (3) Weights-as-memory is lossy: on needle-in-a-haystack retrieval (Table 2), “Transformer with full attention dramatically outperforms the other methods, including ours, especially in long context.” (4) Fig. 8: “training latency is still a significant limitation of our current implementation.”',
    'Follow-on work in 2026: Self-Guided Test-Time Training (S-TTT, arXiv:2607.09415, Jul 2026) reports up to 15% relative improvement on long-context benchmarks.',
    'URLs: https://arxiv.org/abs/2512.23675 · https://arxiv.org/html/2512.23675v1 · https://developer.nvidia.com/blog/reimagining-llm-memory-using-context-as-training-data-unlocks-models-that-learn-at-test-time/',
  ].join('\n\n'));
  return s;
}

// ======================================================================
// 7. RSI · the user's two charts
// ======================================================================
async function rsiChartsSlide(d) {
  const s = d.slide('Content');
  head(s, 'INSIDE THE MACHINE · RECURSIVE SELF-IMPROVEMENT · 2', 'Claude now leads 26% of Anthropic’s model R&D');

  // NOTE: by content, image9 = Anthropic R&D Automation Index chart, image8 = Vals RSI Index chart.
  const cw = 5.85, gap = CX1 - CX0 - 2 * cw;
  const an = await frameW(d, s, ORIG('image9.png'), CX0, 1.8, cw);
  const va = await frameW(d, s, ORIG('image8.png'), CX0 + cw + gap, 1.8, cw);

  // Readable callouts over the screenshots' tiny labels (positions in each image's own px; values read off the images).
  const PA = await pxMap(ORIG('image9.png'), an);
  // covers the chart's own tiny annotation; its curved leader continues from the chip down to the Aug point
  const anTag = pxTag(d, s, PA, 0, [1312, 556, 1806, 710], [
    { text: 'Claude now leads', options: { color: HEX.text, breakLine: true } },
    { text: '26% of model R&D', options: { color: 'FF8A80' } },
  ], { line: HEX.red, fontSize: 12 });
  const PV = await pxMap(ORIG('image8.png'), va);
  const vAnth = pxTag(d, s, PV, 0, [172, 106, 374, 164], [
    { text: 'Anthropic trend', options: { color: HEX.amber, breakLine: true } },
    { text: '→ 60% by Jul 2027', options: { color: HEX.text } },
  ], { line: HEX.amber });
  const vAnthL = leader(d, s, PV(374, 137), PV(502, 146), HEX.amber);
  const vAnthR = ring(d, s, PV(508.5, 146.5), 0.07, HEX.amber);
  const vOai = pxTag(d, s, PV, 0, [556, 232, 764, 290], [
    { text: 'OpenAI trend', options: { color: 'C9D1D9', breakLine: true } },
    { text: '→ 60% by Aug 2028', options: { color: HEX.text } },
  ], { line: 'C9D1D9' });
  const vOaiL = leader(d, s, PV(756, 232), PV(767, 153), 'C9D1D9');
  const vOaiR = ring(d, s, PV(769, 146.5), 0.07, 'C9D1D9');
  const vOpus = pxTag(d, s, PV, 0, [180, 196, 328, 229], [
    { text: 'Opus 5.5 · 37%', options: { color: HEX.amber } },
  ], { line: HEX.amber });
  const vOpusR = ring(d, s, PV(304.5, 239), 0.06, HEX.amber);
  const sy = 1.8 + Math.max(an.h, va.h) + 0.15;
  const st1 = statRow(d, s, { x: CX0, y: sy, w: cw, vw: 2.35, h: 0.85, value: '1% → 26%', valueSize: 30, labelSize: 12, label: [
    { text: 'of Anthropic’s model R&D tasks led by Claude, March → August 2026 ', options: { color: d.S.muted } },
    { text: '(Anthropic’s own index; not independently verified)', options: { color: d.S.amber } },
  ] });
  const st2 = statRow(d, s, { x: CX0 + cw + gap, y: sy, w: cw, vw: 1.75, h: 0.85, value: '37.31%', valueSize: 30, labelSize: 12, label: 'Claude Opus 5.5 on the Vals RSI Index (Oct 4, 2026). Vals: “Anthropic is on track for frontier-level AI researchers by July 2027”', color: d.S.amber });

  anim(d, s, an, { auto: true, effect: 'rise', dur: 550 });
  anim(d, s, va, { auto: true, effect: 'rise', dur: 550, after: 120 });
  anim(d, s, [...st1, ...anTag], { effect: 'zoom', dur: 450 });
  anim(d, s, [...st2, ...vOpus, vOpusR, ...vAnth, vAnthL, vAnthR, ...vOai, vOaiL, vOaiR], { effect: 'zoom', dur: 450 });

  d.source(s, 'Sources: Anthropic R&D Automation Index v2026.07 (Sep 17, 2026) · Vals AI RSI Index, extrapolation view (earlier capture; the live page has since been updated) and live leaderboard, Oct 4, 2026.');
  s.addNotes([
    'Recursive self-improvement starts with AI doing the work of AI research. Two separate measurements (one self-reported by Anthropic). Note the title is about Anthropic’s model R&D: Claude leads 26% of the model R&D tasks Anthropic tracks — not all of Anthropic’s R&D, and not a quarter of all AI research.',
    'The dark callouts on both screenshots just enlarge what the images already say: the Anthropic chart’s own annotation (“Claude now leads 26% of model R&D”), and on the Vals extrapolation view the labelled milestones “60% · Jul 2027” (Anthropic trend) and “60% · Aug 2028” (OpenAI trend), plus the latest Anthropic point, Opus 5.5 (37.31% on the live page).',
    'Left — Anthropic’s own R&D Automation Index: each month, model R&D tasks are rated on Epoch AI’s automation scale. The darkest band, AL4 “AI leads”, went 1% (Mar) → 3% (Apr) → 12% (May) → 14% (Jun) → 22% (Jul) → 26% (Aug 2026); February was under 1%. Caveat: Anthropic notes the index is not independently verified and was produced largely using Claude itself.',
    'Right — Vals AI’s RSI Index asks “Can a model do the research that builds the next model?” As of the live page on Oct 4, 2026: Claude Opus 5.5 37.31%, Claude Fable 5.1 36.09%, Claude Opus 5 33.02%, Gemini 4 Argon 30.55%. Vals’ key takeaway: “Anthropic is on track for frontier-level AI researchers by July 2027” — its trend line “reaches 0.6 in July 2027”.',
    'Caveat: this screenshot is an earlier capture of Vals’ extrapolation view (it shows 50% by Mar 2027 for Anthropic and Jan 2028 for OpenAI); the live page has since changed. Extrapolations are straight lines through a handful of points — they are a forecast, not a measurement.',
    'URLs: https://www.anthropic.com/institute/measuring-pace-of-ai-development · https://www.vals.ai/benchmarks/rsi_index',
  ].join('\n\n'));
  return s;
}

// ======================================================================
// 8. RSI · Anthropic's own numbers (native charts)
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
    'URLs: https://www.anthropic.com/institute/recursive-self-improvement · https://fortune.com/2026/06/05/anthropic-ai-pause-development-recursive-self-improvement/',
  ].join('\n\n'));
  return s;
}

// ======================================================================
// 9. RSI · OpenAI, GovAI, and the timeline
// ======================================================================
async function rsiLoopSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'INSIDE THE MACHINE · RECURSIVE SELF-IMPROVEMENT · 4', 'AI labs are already automating AI research');

  const eng = await crop(TH('engadget-research-intern.png'), 'engadget_head.png', { left: 0, top: 0, width: 1610, height: 680 });

  // top row: three clippings
  const e = await frameW(d, s, eng, CX0, 1.9, 3.7, { rot: -2 });
  // left column only (title + first abstract paragraph); the caption below carries the authors
  const gImg = await crop(TH('govai-intelligence-explosion.png'), 'govai_head.png', { left: 150, top: 90, width: 1220, height: 650 });
  const g = await frameW(d, s, gImg, 4.7, 1.82, 4.2, { rot: 1 });
  const t = await frameW(d, s, TH('tnw-pachocki-slowdown.png'), 9.3, 1.95, CX1 - 9.3, { rot: -1.5 });

  // captions / stats under each
  const eStat = statRow(d, s, { x: CX0, y: 1.9 + e.h + 0.2, w: 3.7, vw: 1.7, h: 0.75, value: 'On time', valueSize: 26, labelSize: 12, label: 'Altman set the goal in Oct 2025; OpenAI says it was met in Sep 2026' });
  const gCap = d.text(s, [
    { text: '22 authors, ', options: { bold: true, color: d.S.txt } },
    { text: 'incl. Hinton, Bengio & Barto (Turing Awards), Pachocki (OpenAI) and Jack Clark (Anthropic)', options: { color: d.S.muted } },
  ], { x: 4.75, y: 1.82 + g.h + 0.15, w: 4.2, h: 0.5, fontSize: 12, valign: 'top' });
  const tStat = statRow(d, s, { x: 9.3, y: 1.95 + t.h + 0.2, w: CX1 - 9.3, vw: 0.9, h: 0.85, value: '3.1', valueSize: 34, labelSize: 12, label: 'AI agent-workdays per human workday in OpenAI research, mid-Aug 2026 (OpenAI-reported)' });

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
  // Labels sit centred on their dot (clamped to the margins); the two close right-hand dots split above/below,
  // with APR 2028 right-aligned to end just past its own dot.
  const ms = [
    { m: 0, date: 'SEP 2026 · NOW', text: ['OpenAI: automated research intern'], up: true, color: HEX.red, align: 'left', x: CX0, w: 2.8 },
    { m: 10, date: 'JUL 2027', text: ['Vals trend: Anthropic reaches frontier-level AI researchers', 'AI 2027: superhuman AI researcher'], up: false, color: HEX.amber, align: 'center', w: 4.6 },
    { m: 14, date: 'NOV 2027', text: ['AI 2027: superintelligent', 'AI researcher'], up: true, color: HEX.amber, align: 'center', w: 2.2 },
    { m: 18, date: 'MAR 2028', text: ['OpenAI target: automated AI researcher'], up: false, color: HEX.red, align: 'center', w: 2.9 },
    { m: 19, date: 'APR 2028', text: ['AI 2027:', 'superintelligence'], up: true, color: HEX.amber, align: 'right', w: 1.7, rEdge: 0.25 },
  ];
  const groups = ms.map((o) => {
    const cx = mx(o.m);
    const gg = [];
    const dot = d.name('ms');
    s.addShape(d.pres.shapes.OVAL, { x: cx - 0.09, y: ly - 0.09, w: 0.18, h: 0.18, fill: { color: o.color }, line: { color: 'FFFFFF', width: 1.25 }, objectName: dot });
    gg.push(dot);
    let lx = o.align === 'left' ? cx - 0.1 : o.align === 'right' ? Math.min(cx + o.rEdge, CX1) - o.w : cx - o.w / 2;
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
  anim(d, s, [...t, ...tStat], { effect: 'rise', dur: 500 });
  anim(d, s, [ln, tlLab, ...groups[0]], { effect: 'wipeLeft', dur: 700 });
  groups.slice(1).forEach((gg, i) => anim(d, s, gg, { auto: true, effect: 'fade', dur: 350, after: i ? 250 : 100 }));

  d.source(s, 'Sources: Engadget & The Next Web, Sep 6, 2026 · GovAI, Sep 28, 2026 · OpenAI, “Research acceleration,” Sep 6, 2026 · Vals AI RSI Index, Oct 4, 2026 · AI 2027 takeoff forecast (Apr 2025).');
  s.addNotes([
    'OpenAI, “Research acceleration: The view inside OpenAI” (Sep 6, 2026): “According to our measurements, we have now reached the goal, announced last fall, of having an automated research intern by September of this year.” By “research intern” they mean a system that can carry out well-defined research tasks under human direction, including tasks that would take a skilled researcher a few days. “We are making strong progress toward creating an automated AI researcher by March of 2028.” Same post: “Before June 2026, total agent runtime across the research organization was still below that of total human labor. That has since changed … as of mid-August, in total, the research organization uses 3.1 agent-workdays of effort for every workday of human labor.” (Median researcher: over $600/day of agent inference; 90th percentile over $7,000/day.)',
    'Altman’s original target (Oct 2025 livestream): an automated AI research intern by September 2026 and “a true automated AI researcher by March of 2028.” They hit the first one on schedule.',
    'The Next Web, same day: OpenAI’s chief scientist Jakub Pachocki says no lab should keep scaling at maximum speed — “Currently I believe that no lab has solved alignment and monitoring to a sufficient degree to continue responsibly scaling at maximum speed for much longer.”',
    'GovAI paper (Sep 28, 2026), 22 authors including Alan Chan, Christoph Winter, Andrew Barto, Jakub Pachocki, Geoffrey Hinton, Eric Horvitz, Yoshua Bengio, Dawn Song, Jack Clark, Hilary Greaves, Anton Korinek: “AI now plays a major role in building AI. Preliminary evidence suggests this could radically accelerate AI progress in an ‘intelligence explosion,’ where years of AI progress are compressed into months or less… Policymakers, including heads of government, urgently need to understand and prepare for this possibility.” Coverage quotes it: “once an intelligence explosion begins, the window for action may close.”',
    'Timeline: Vals’ trend line projects “Anthropic is on track for frontier-level AI researchers by July 2027” (straight-line extrapolation). AI 2027’s takeoff forecast (AI Futures Project, Apr 2025) — conditional on a superhuman coder arriving in March 2027 — gives medians of Jul 2027 for a superhuman AI researcher, Nov 2027 for a superintelligent AI researcher, and Apr 2028 for artificial superintelligence (90th percentiles: Mar 2028, Jan 2034, after 2100). These are forecasts, not facts — but they line up uncomfortably with OpenAI’s own March 2028 target.',
    'Also: Fortune/AP (Sep 19, 2026): FLI’s Anthony Aguirre on full autonomy: “I think this is probably the worst idea in the history of humanity to do this.” Not shown: Reuters/KSL “Anthropic says Claude now leads a quarter of work building its next AI models” (headline not re-verified for this deck).',
    'URLs: https://www.engadget.com/2251859/openai-says-it-reached-its-goal-of-creating-an-automated-research-intern/ · https://openai.com/index/research-acceleration-view-inside-openai/ · https://thenextweb.com/news/openai-slowdown-pachocki-alien-mind-research-intern-compute · https://www.governance.ai/research-paper/what-if-automating-ai-r-d-triggers-an-intelligence-explosion · https://www.vals.ai/benchmarks/rsi_index · https://ai-2027.com/',
  ].join('\n\n'));
  return s;
}

async function build(d) {
  await latentSlide(d);
  await astraSlide(d);
  await alienSlide(d);
  await tttConceptSlide(d);
  await tttChartSlide(d);
  await require('./theory_slides').explosionSlide(d);
  await rsiChartsSlide(d);
  await rsiAnthropicSlide(d);
  await rsiLoopSlide(d);
}

module.exports = { build };
