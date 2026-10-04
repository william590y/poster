// Slides that are built from first principles (no research assets needed).
const { HEX, W, H, MX } = require('./lib');
const { icon } = require('./icons');

// Position on the exponential curve drawn in assets/art/bg_exp.png (t in [0,1]).
function curvePt(t) {
  const x = 200 + t * 3700, y = 2000 - 1950 * (Math.exp(5.2 * t) - 1) / (Math.exp(5.2) - 1);
  return { x: x / 3840 * W, y: y / 2160 * H };
}

// Parameter t at which the curve reaches height y (inches).
function tForY(yIn) {
  const f = (2000 - yIn / H * 2160) / 1950;
  return Math.log(1 + f * (Math.exp(5.2) - 1)) / 5.2;
}

function titleSlide(d) {
  const s = d.slide('Title', { transition: 'fadeBlack' });
  s.addText('AI Safety and Existential Risk', { placeholder: 'title' });
  s.addText('William Liaw', { placeholder: 'body' });
  const k = d.text(s, 'A TALK ABOUT THE MOST IMPORTANT PROBLEM OF OUR TIME', { x: MX, y: 1.95, w: 8, h: 0.35, fontSize: 12, bold: true, color: d.S.red, charSpacing: 5 });
  d.animate(s, [k], { auto: true, effect: 'fade', dur: 1200 });
  s.addNotes('Open slowly. Everything in this talk is real: every headline is a real article, every chart is real data.');
  return s;
}

function agendaSlide(d) {
  const s = d.slide('Exp');
  s.addText('ROADMAP', { placeholder: 'kicker' });
  s.addText('Where we are going', { placeholder: 'title' });
  const acts = [
    ['I', 'The Acceleration', 'Money, compute & capabilities', 5.9],
    ['II', 'Inside the Machine', 'Latent reasoning, continual learning, RSI', 4.95],
    ['III', 'The Alignment Problem', 'Theory, rogue agents, loss of control', 4.0],
    ['IV', 'The World', 'War, rivalry, misuse, open weights', 3.05],
    ['V', 'Coda', 'What now?', 2.1],
  ];
  const names = [];
  acts.forEach(([num, title, sub, yRow], i) => {
    const p = curvePt(tForY(yRow));
    const dot = d.name('dot');
    s.addShape(d.pres.shapes.OVAL, { x: p.x - 0.11, y: p.y - 0.11, w: 0.22, h: 0.22, fill: { color: HEX.red }, line: { color: 'FFFFFF', width: 1.5 }, objectName: dot });
    const lx = p.x - 4.45;
    const t1 = d.text(s, [
      { text: `ACT ${num}   `, options: { color: d.S.red, bold: true, fontSize: 11, charSpacing: 3 } },
      { text: title, options: { color: d.S.txt, bold: true, fontSize: 20, fontFace: 'Arial', breakLine: true } },
      { text: sub, options: { color: d.S.muted, fontSize: 13 } },
    ], { x: lx, y: p.y - 0.4, w: 4.2, h: 0.8, align: 'right', valign: 'middle' });
    names.push([dot, t1]);
  });
  const intro = d.text(s, [
    { text: 'Five acts. One curve.', options: { bold: true, color: d.S.txt, fontSize: 22, fontFace: 'Arial', breakLine: true } },
    { text: 'Each part of this talk sits a little further up the exponential — and the stakes rise with it.', options: { color: d.S.muted, fontSize: 15 } },
  ], { x: MX, y: 2.0, w: 4.4, h: 1.4, valign: 'top' });
  d.animate(s, [intro], { auto: true });
  names.forEach((n, i) => d.animate(s, n, { auto: true, effect: 'rise', dur: 450, after: i === 0 ? 200 : 120 }));
  s.addNotes('The structure follows the curve: each act is further up the exponential.');
  return s;
}

function sectionSlide(d, { num, title, body, notes }) {
  const s = d.slide('Section', { transition: 'fadeBlack' });
  s.addText(`ACT ${num}`, { placeholder: 'kicker' });
  s.addText(title, { placeholder: 'title' });
  if (body) s.addText(body, { placeholder: 'body' });
  if (notes) s.addNotes(notes);
  return s;
}

async function orthogonalitySlide(d) {
  const s = d.slide('Content');
  s.addText('THEORY · 1', { placeholder: 'kicker' });
  s.addText('The orthogonality thesis', { placeholder: 'title' });
  // quote
  const q = d.text(s, [
    { text: '“', options: { fontSize: 60, color: d.S.red, bold: true, fontFace: 'Cambria', breakLine: true } },
    { text: 'Intelligence and final goals are orthogonal: more or less any level of intelligence could in principle be combined with more or less any final goal.', options: { fontSize: 20, color: d.S.txt, italic: true, fontFace: 'Cambria', breakLine: true } },
    { text: '— Nick Bostrom, “The Superintelligent Will” (2012)', options: { fontSize: 12, color: d.S.muted } },
  ], { x: MX, y: 1.7, w: 5.6, h: 3.0, valign: 'top' });
  const take = d.text(s, [
    { text: 'Being smart is not the same as being good. ', options: { bold: true, color: d.S.txt, breakLine: true } },
    { text: 'Capability tells you nothing about what a system wants. Nothing about “getting smarter” pulls a mind toward human values.', options: { color: d.S.muted } },
  ], { x: MX, y: 4.85, w: 5.6, h: 1.3, fontSize: 15, valign: 'top' });

  // plot: intelligence (x) vs goals (rows)
  const px = 7.15, py = 1.85, pw = 5.55, ph = 4.3;
  const plot = [];
  plot.push(d.card(s, { x: px - 0.1, y: py - 0.15, w: pw + 0.25, h: ph + 0.75 }, { color: '10141B' }));
  const rows = ['Human flourishing', 'Predict the next token', 'Win at chess', 'Maximize paperclips'];
  const rowH = ph / rows.length;
  const axisX = px + 1.85;
  rows.forEach((r, i) => {
    const y = py + i * rowH;
    plot.push(d.text(s, r, { x: px, y: y + rowH / 2 - 0.2, w: 1.75, h: 0.4, fontSize: 11, color: d.S.muted, align: 'right', valign: 'middle' }));
    const ln = d.name('grid');
    s.addShape(d.pres.shapes.LINE, { x: axisX, y: y + rowH / 2, w: pw - 1.95, h: 0, line: { color: HEX.line, width: 0.75, dashType: 'dash' }, objectName: ln });
    plot.push(ln);
  });
  const ax = d.name('axis');
  s.addShape(d.pres.shapes.LINE, { x: axisX, y: py + ph + 0.05, w: pw - 1.95, h: 0, line: { color: HEX.steel, width: 1.25, endArrowType: 'triangle' }, objectName: ax });
  plot.push(ax);
  plot.push(d.text(s, 'INTELLIGENCE  →', { x: axisX, y: py + ph + 0.12, w: pw - 1.95, h: 0.3, fontSize: 10, bold: true, color: d.S.steel, charSpacing: 3, align: 'right' }));
  // dots: [row, xFrac, label?, hot?]
  const pts = [[0, 0.12], [0, 0.55], [1, 0.25], [1, 0.62], [2, 0.08], [2, 0.4], [2, 0.8], [3, 0.18], [3, 0.5], [0, 0.96, true], [3, 0.96, true]];
  const dots = pts.map(([r, f, hot]) => {
    const n = d.name('pt');
    const cx = axisX + 0.15 + f * (pw - 2.3), cy = py + r * rowH + rowH / 2;
    const sz = hot ? 0.3 : 0.17;
    s.addShape(d.pres.shapes.OVAL, { x: cx - sz / 2, y: cy - sz / 2, w: sz, h: sz, fill: { color: hot ? HEX.red : HEX.steel }, line: { color: hot ? 'FFFFFF' : HEX.steel, width: hot ? 1.5 : 0 }, objectName: n });
    return { n, hot, cx, cy };
  });
  const lab = d.text(s, 'superintelligent\npaperclip maximizer', { x: axisX + pw - 3.95, y: py + 3 * rowH + rowH / 2 - 0.85, w: 1.85, h: 0.55, fontSize: 10, bold: true, color: d.S.red, align: 'right', valign: 'bottom' });
  const lab2 = d.text(s, 'what we hope for', { x: axisX + pw - 3.95, y: py + rowH / 2 + 0.2, w: 1.85, h: 0.3, fontSize: 10, bold: true, color: d.S.txt, align: 'right' });

  d.animate(s, plot, { auto: true, effect: 'fade' });
  d.animate(s, dots.filter(x => !x.hot).map(x => x.n), { auto: true, effect: 'zoom', stagger: 70, dur: 300 });
  d.animate(s, [dots.filter(x => x.hot)[0].n, lab2], { effect: 'zoom' });
  d.animate(s, [dots.filter(x => x.hot)[1].n, lab], { effect: 'zoom' });
  d.animate(s, [take], { effect: 'fade' });
  d.source(s, 'Bostrom, N. (2012). The Superintelligent Will: Motivation and Instrumental Rationality in Advanced Artificial Agents. Minds and Machines 22(2).');
  s.addNotes('Every combination on this chart is possible. The paperclip maximizer is not stupid — it is extremely intelligent, and wants something we do not.');
  return s;
}

async function convergenceSlide(d) {
  const s = d.slide('Content');
  s.addText('THEORY · 2', { placeholder: 'kicker' });
  s.addText('Instrumental convergence: the basic AI drives', { placeholder: 'title' });
  const cx = W / 2, cy = 3.95;
  // hub
  const hub = d.name('hub');
  s.addShape(d.pres.shapes.OVAL, { x: cx - 1.05, y: cy - 1.05, w: 2.1, h: 2.1, fill: { color: '2A0C0E' }, line: { color: HEX.red, width: 2 }, objectName: hub });
  const hubT = d.text(s, [{ text: 'ANY', options: { fontSize: 12, color: d.S.red, bold: true, charSpacing: 3, breakLine: true } }, { text: 'final goal', options: { fontSize: 20, bold: true, color: d.S.txt } }], { x: cx - 1.0, y: cy - 0.6, w: 2.0, h: 1.2, align: 'center', valign: 'middle' });
  const drives = [
    ['FaShieldAlt', 'Self-preservation', 'It can’t achieve its goal if it is switched off.', -1, -1],
    ['FaLock', 'Goal-content integrity', 'It resists having its goal changed — by anyone.', 1, -1],
    ['FaCoins', 'Resource acquisition', 'More compute, money and influence help with almost any goal.', -1, 1],
    ['FaBrain', 'Cognitive enhancement', 'Getting smarter makes it better at everything else.', 1, 1],
  ];
  const cw = 4.1, ch = 1.45;
  const groups = [];
  for (const [ic, t, sub, sx, sy] of drives) {
    const x = sx < 0 ? MX + 0.1 : W - MX - 0.1 - cw;
    const y = sy < 0 ? 1.75 : 4.75;
    const g = [];
    g.push(d.card(s, { x, y, w: cw, h: ch }));
    const ci = d.name('ic');
    s.addShape(d.pres.shapes.OVAL, { x: x + 0.25, y: y + 0.3, w: 0.8, h: 0.8, fill: { color: '2A0C0E' }, line: { color: HEX.red, width: 1 }, objectName: ci });
    g.push(ci);
    const im = d.name('icimg');
    s.addImage({ data: await icon(ic, '#E5383B'), x: x + 0.45, y: y + 0.5, w: 0.4, h: 0.4, objectName: im });
    g.push(im);
    g.push(d.text(s, [{ text: t, options: { bold: true, fontSize: 17, color: d.S.txt, breakLine: true, fontFace: 'Arial' } }, { text: sub, options: { fontSize: 13, color: d.S.muted } }], { x: x + 1.25, y: y + 0.18, w: cw - 1.45, h: ch - 0.36, valign: 'middle' }));
    // connector
    const ln = d.name('conn');
    const x1 = sx < 0 ? x + cw : x, y1 = y + ch / 2;
    const x2 = cx + sx * 0.78, y2 = cy + sy * 0.78;
    s.addShape(d.pres.shapes.LINE, { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1), flipH: (x2 < x1) !== (y2 < y1), line: { color: HEX.red, width: 1.25, dashType: 'dash' }, objectName: ln });
    g.unshift(ln);
    groups.push(g);
  }
  const quote = d.text(s, [
    { text: '“You can’t fetch the coffee if you’re dead.”', options: { italic: true, fontFace: 'Cambria', fontSize: 18, color: d.S.txt } },
    { text: '   — Stuart Russell', options: { fontSize: 12, color: d.S.muted } },
  ], { x: MX, y: 6.3, w: W - 2 * MX, h: 0.4, align: 'center' });
  d.animate(s, [hub, hubT], { auto: true, effect: 'zoom' });
  groups.forEach(g => d.animate(s, g, { effect: 'fade' }));
  d.animate(s, [quote], { effect: 'fade' });
  d.source(s, 'Omohundro, S. (2008). The Basic AI Drives. AGI-08 · Bostrom, N. (2014). Superintelligence, ch. 7 · Russell, S. (2019). Human Compatible.', { y: 6.75 });
  s.addNotes('These are not programmed in. They fall out of almost any objective, because they are useful for almost any objective. This is why “just don’t give it bad goals” is not enough.');
  return s;
}

async function explosionSlide(d) {
  const s = d.slide('Content');
  s.addText('THEORY · 3', { placeholder: 'kicker' });
  s.addText('The intelligence explosion', { placeholder: 'title' });
  const q = d.text(s, [
    { text: '“', options: { fontSize: 54, color: d.S.red, bold: true, fontFace: 'Cambria', breakLine: true } },
    { text: 'An ultraintelligent machine could design even better machines; there would then unquestionably be an ‘intelligence explosion,’ and the intelligence of man would be left far behind. Thus the first ultraintelligent machine is the last invention that man need ever make, provided that the machine is docile enough to tell us how to keep it under control.', options: { fontSize: 17, color: d.S.txt, italic: true, fontFace: 'Cambria', breakLine: true } },
    { text: '— I. J. Good, 1965', options: { fontSize: 12, color: d.S.muted } },
  ], { x: MX, y: 1.65, w: 6.1, h: 4.6, valign: 'top' });
  // loop diagram
  const cx = 9.85, cy = 4.0, r = 1.75;
  const steps = [['FaRobot', 'AI does AI research'], ['FaMicrochip', 'Better AI'], ['FaBolt', 'Faster research'], ['FaRedoAlt', 'Even better AI']];
  const g = [];
  const ring = d.name('ring');
  s.addShape(d.pres.shapes.OVAL, { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r, fill: { color: HEX.bg, transparency: 100 }, line: { color: HEX.red, width: 2, dashType: 'dash' }, objectName: ring });
  const nodes = [];
  for (let i = 0; i < steps.length; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 2;
    const nx = cx + r * Math.cos(a), ny = cy + r * Math.sin(a);
    const nn = [];
    const c = d.name('node');
    s.addShape(d.pres.shapes.OVAL, { x: nx - 0.42, y: ny - 0.42, w: 0.84, h: 0.84, fill: { color: '2A0C0E' }, line: { color: HEX.red, width: 1.5 }, objectName: c });
    nn.push(c);
    const im = d.name('nimg');
    s.addImage({ data: await icon(steps[i][0], '#FF6B6B'), x: nx - 0.2, y: ny - 0.2, w: 0.4, h: 0.4, objectName: im });
    nn.push(im);
    const lw = 1.9;
    const lx = nx - lw / 2;
    const ly = Math.sin(a) < -0.5 ? ny - 0.85 : ny + 0.47;
    nn.push(d.text(s, steps[i][1], { x: lx, y: ly, w: lw, h: 0.38, fontSize: 14, bold: true, color: d.S.txt, align: 'center', valign: 'middle' }));
    nodes.push(nn);
  }
  const center = d.text(s, [{ text: '×', options: { fontSize: 40, bold: true, color: d.S.red, breakLine: true } }, { text: 'each lap faster', options: { fontSize: 12, color: d.S.muted } }], { x: cx - 1, y: cy - 0.6, w: 2, h: 1.2, align: 'center', valign: 'middle' });
  d.animate(s, [q], { auto: true });
  d.animate(s, [ring, ...nodes[0]], { effect: 'fade' });
  nodes.slice(1).forEach(n => d.animate(s, n, { auto: true, effect: 'fade', after: 250 }));
  d.animate(s, [center], { auto: true, effect: 'zoom', after: 250 });
  d.source(s, 'Good, I. J. (1965). Speculations Concerning the First Ultraintelligent Machine. Advances in Computers 6.');
  s.addNotes('Good wrote this in 1965. The caveat at the end is the whole field of AI safety in one clause.');
  return s;
}

async function whatNowSlide(d) {
  const s = d.slide('Content');
  s.addText('CODA', { placeholder: 'kicker' });
  s.addText('So what do we do?', { placeholder: 'title' });
  const items = [
    ['FaEye', 'Interpretability', 'Read the mind before we trust it: find the circuits behind deception, refusal, and goals.'],
    ['FaHandPaper', 'Control', 'Assume alignment might fail: monitor, sandbox, and keep the ability to shut systems down.'],
    ['FaBullseye', 'Alignment', 'Make systems that actually want what we want — robustly, not just on the training set.'],
    ['FaBalanceScale', 'Governance', 'Compute oversight, mandatory evaluations, liability, and international coordination.'],
  ];
  const cw = (W - 2 * MX - 3 * 0.3) / 4;
  const groups = [];
  for (let i = 0; i < items.length; i++) {
    const x = MX + i * (cw + 0.3), y = 1.95;
    const g = [];
    g.push(d.card(s, { x, y, w: cw, h: 3.6 }));
    const c = d.name('c');
    s.addShape(d.pres.shapes.OVAL, { x: x + 0.3, y: y + 0.35, w: 0.9, h: 0.9, fill: { color: '2A0C0E' }, line: { color: HEX.red, width: 1 }, objectName: c });
    g.push(c);
    const im = d.name('im');
    s.addImage({ data: await icon(items[i][0], '#E5383B'), x: x + 0.52, y: y + 0.57, w: 0.46, h: 0.46, objectName: im });
    g.push(im);
    g.push(d.text(s, items[i][1], { x: x + 0.3, y: y + 1.45, w: cw - 0.6, h: 0.45, fontSize: 19, bold: true, color: d.S.txt, fontFace: 'Arial' }));
    g.push(d.text(s, items[i][2], { x: x + 0.3, y: y + 1.95, w: cw - 0.6, h: 1.5, fontSize: 14, color: d.S.muted, valign: 'top' }));
    groups.push(g);
  }
  const bottom = d.text(s, [
    { text: 'The window is not closed. ', options: { bold: true, color: d.S.txt } },
    { text: 'But it is closing at the speed of the curve you have seen all talk.', options: { color: d.S.muted } },
  ], { x: MX, y: 5.85, w: W - 2 * MX, h: 0.5, fontSize: 18 });
  groups.forEach((g, i) => d.animate(s, g, { auto: true, effect: 'rise', after: i ? 100 : 200 }));
  d.animate(s, [bottom], { effect: 'fade' });
  s.addNotes('End on agency: there is real work to do, and it needs people.');
  return s;
}

function closingSlide(d, { agents = 8 } = {}) {
  const s = d.slide('Closing', { transition: 'fadeBlack' });
  const a = d.text(s, 'ONE MORE THING', { x: MX, y: 2.0, w: W - 2 * MX, h: 0.4, fontSize: 14, bold: true, color: d.S.red, charSpacing: 6, align: 'center' });
  const b = d.text(s, 'This presentation was made by an AI.', { x: MX, y: 2.55, w: W - 2 * MX, h: 0.9, fontSize: 40, bold: true, color: d.S.txt, align: 'center', fontFace: 'Arial' });
  const c = d.text(s, `Every headline was found, every chart was built and every slide was designed by Claude — ${agents} AI agents working in parallel from a one-page outline — while its author watched.`, { x: 1.8, y: 3.6, w: W - 3.6, h: 1.0, fontSize: 18, color: d.S.muted, align: 'center' });
  const e = d.text(s, 'Thank you. Sleep well.', { x: MX, y: 5.2, w: W - 2 * MX, h: 0.5, fontSize: 22, italic: true, color: d.S.txt, align: 'center', fontFace: 'Cambria' });
  d.animate(s, [a], { auto: true, dur: 800 });
  d.animate(s, [b], { effect: 'fade', dur: 900 });
  d.animate(s, [c], { auto: true, effect: 'fade', after: 400, dur: 900 });
  d.animate(s, [e], { effect: 'fade', dur: 1200 });
  s.addNotes('Pause after the reveal. Let the room sit with it.');
  return s;
}

module.exports = { titleSlide, agendaSlide, sectionSlide, orthogonalitySlide, convergenceSlide, explosionSlide, whatNowSlide, closingSlide, curvePt };
