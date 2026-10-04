// Slides that are built from first principles (no research assets needed).
const { HEX, W, H, MX, A } = require('./lib');
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
    ['I', 'The Acceleration', 'Money, compute, capabilities & work', 5.9],
    ['II', 'Inside the Machine', 'Latent reasoning, self-improvement', 4.95],
    ['III', 'The Alignment Problem', 'Theory, rogue agents, loss of control', 4.0],
    ['IV', 'The World', 'War, misuse, open weights, model welfare', 3.05],
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
    ], { x: lx, y: p.y - 0.78, w: 4.2, h: 0.72, align: 'right', valign: 'bottom' });
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

async function explosionSlide(d) {
  const s = d.slide('Content');
  s.addText('INSIDE THE MACHINE · RECURSIVE SELF-IMPROVEMENT · 1', { placeholder: 'kicker' });
  s.addText('The intelligence explosion', { placeholder: 'title' });
  const q = d.text(s, [
    { text: '“', options: { fontSize: 30, color: d.S.red, bold: true, fontFace: 'Cambria' } },
    { text: '…an ultraintelligent machine could design even better machines; there would then unquestionably be an ‘intelligence explosion,’ and the intelligence of man would be left far behind. Thus the first ultraintelligent machine is the last invention that man need ever make, provided that the machine is docile enough to tell us how to keep it under control.”', options: { fontSize: 19, color: d.S.txt, italic: true, fontFace: 'Cambria', breakLine: true, paraSpaceAfter: 10 } },
    { text: '— I. J. Good, 1965', options: { fontSize: 13, color: d.S.muted } },
  ], { x: MX, y: 1.9, w: 5.6, h: 4.4, valign: 'middle' });
  // loop diagram
  const cx = 9.7, cy = 4.0, r = 1.5;
  const steps = [['FaRobot', 'AI does AI research'], ['FaMicrochip', 'Better AI'], ['FaBolt', 'Faster research'], ['FaRedoAlt', 'Even better AI']];
  const g = [];
  // animated loop (tools/make_loop_gif.py): dashed ring + clockwise arrows + a pulse that laps faster each time; drawn on the
  // matching crop of the slide background, so it sits seamlessly under the native nodes/labels
  const ring = d.name('ringgif');
  const HALF = 2.05;
  s.addImage({ path: A('art', 'loop_explosion.gif'), x: cx - HALF, y: cy - HALF, w: 2 * HALF, h: 2 * HALF, objectName: ring });
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
    // labels sit outside the ring: above/below for top/bottom nodes, beside for left/right nodes
    const side = Math.cos(a) > 0.5 ? 'right' : Math.cos(a) < -0.5 ? 'left' : 'center';
    const lw = side === 'center' ? 1.9 : side === 'left' ? 1.5 : 1.05;
    const lx = side === 'center' ? nx - lw / 2 : side === 'left' ? nx - 0.5 - lw : nx + 0.5;
    const ly = side === 'center' ? (Math.sin(a) < 0 ? ny - 0.85 : ny + 0.47) : ny - 0.19;
    nn.push(d.text(s, steps[i][1], { x: lx, y: ly, w: lw, h: 0.38, fontSize: 14, bold: true, color: d.S.txt, align: side === 'center' ? 'center' : side === 'left' ? 'right' : 'left', valign: 'middle' }));
    nodes.push(nn);
  }
  const cIcon = d.name('cicon');
  s.addImage({ data: await icon('FaTachometerAlt', '#E5383B'), x: cx - 0.3, y: cy - 0.55, w: 0.6, h: 0.6, objectName: cIcon });
  const cText = d.text(s, 'each lap faster', { x: cx - 1, y: cy + 0.12, w: 2, h: 0.35, fontSize: 13, color: d.S.muted, align: 'center', valign: 'middle' });
  const center = [cIcon, cText];
  d.animate(s, [q], { auto: true });
  d.animate(s, [ring, ...nodes[0]], { effect: 'fade' });
  nodes.slice(1).forEach(n => d.animate(s, n, { auto: true, effect: 'fade', after: 250 }));
  d.animate(s, center, { auto: true, effect: 'zoom', after: 250 });
  d.source(s, 'Good, I. J. (1965). Speculations Concerning the First Ultraintelligent Machine. Advances in Computers 6, pp. 31–88.');
  s.addNotes('Good wrote this in 1965. The caveat at the end is the whole field of AI safety in one clause. Full passage: “Let an ultraintelligent machine be defined as a machine that can far surpass all the intellectual activities of any man however clever. Since the design of machines is one of these intellectual activities, an ultraintelligent machine could design even better machines; …” Source: Good, I. J. (1965), Speculations Concerning the First Ultraintelligent Machine, Advances in Computers 6 (quoted at https://en.wikipedia.org/wiki/I._J._Good).');
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
    const x = MX + i * (cw + 0.3), y = 1.9;
    const g = [];
    g.push(d.card(s, { x, y, w: cw, h: 3.75 }));
    const c = d.name('c');
    s.addShape(d.pres.shapes.OVAL, { x: x + 0.3, y: y + 0.35, w: 0.9, h: 0.9, fill: { color: '2A0C0E' }, line: { color: HEX.red, width: 1 }, objectName: c });
    g.push(c);
    const im = d.name('im');
    s.addImage({ data: await icon(items[i][0], '#E5383B'), x: x + 0.52, y: y + 0.57, w: 0.46, h: 0.46, objectName: im });
    g.push(im);
    g.push(d.text(s, items[i][1], { x: x + 0.3, y: y + 1.4, w: cw - 0.5, h: 0.45, fontSize: 21, bold: true, color: d.S.txt, fontFace: 'Arial' }));
    g.push(d.text(s, items[i][2], { x: x + 0.3, y: y + 1.95, w: cw - 0.5, h: 1.7, fontSize: 17, color: d.S.muted, valign: 'top' }));
    groups.push(g);
  }
  const bottom = d.text(s, [
    { text: 'The window is not closed. ', options: { bold: true, color: d.S.txt } },
    { text: 'But it is closing at the speed of the curve you have just seen.', options: { color: d.S.muted } },
  ], { x: MX, y: 5.95, w: W - 2 * MX, h: 0.55, fontSize: 21 });
  groups.forEach((g, i) => d.animate(s, g, { auto: true, effect: 'rise', after: i ? 100 : 200 }));
  d.animate(s, [bottom], { effect: 'fade' });
  s.addNotes('End on agency: there is real work to do, and it needs people. Callbacks — Interpretability: the chain-of-thought slides ("AI is learning to think without words", "Too much AI thinking for any human to read") and the refusal direction ("Refusal lives in one direction"). Control: OpenAI\'s pause ("OpenAI hit the brakes on its top models") and the agents that built heartbeats to detect their shutdown. Alignment: specification gaming ("It\'s already happening in miniature", "Frontier models find the loopholes too"). Governance: the US–China AI incident channel, the safety-staff firings and the mathematicians\' advisory group on pacing releases. The window line is a judgment, not a finding: the deck shows the speed of the curve, not how much time is left.');
  return s;
}

function closingSlide(d, { agents = 'dozens of' } = {}) {
  const s = d.slide('Closing', { transition: 'fadeBlack' });
  const a = d.text(s, 'ONE MORE THING', { x: MX, y: 2.0, w: W - 2 * MX, h: 0.4, fontSize: 14, bold: true, color: d.S.red, charSpacing: 6, align: 'center' });
  const b = d.text(s, 'This presentation was made by an AI.', { x: MX, y: 2.55, w: W - 2 * MX, h: 0.9, fontSize: 40, bold: true, color: d.S.txt, align: 'center', fontFace: 'Arial' });
  const c = d.text(s, `It was researched, written and designed by Claude — ${agents} AI agents working in parallel from a one-page outline and a few images its author supplied — while its author watched.`, { x: 1.8, y: 3.6, w: W - 3.6, h: 1.0, fontSize: 18, color: d.S.txt, align: 'center' });
  const e = d.text(s, 'Thank you. Sleep well.', { x: MX, y: 5.2, w: W - 2 * MX, h: 0.5, fontSize: 22, italic: true, color: d.S.txt, align: 'center', fontFace: 'Cambria' });
  d.animate(s, [a], { auto: true, dur: 800 });
  d.animate(s, [b], { effect: 'fade', dur: 900 });
  d.animate(s, [c], { auto: true, effect: 'fade', after: 400, dur: 900 });
  d.animate(s, [e], { effect: 'fade', dur: 1200 });
  s.addNotes('Pause after the reveal. Let the room sit with it. The agent count is from the build logs: over 200 Claude agent sessions did the research (finding the articles, clips and data), the slide building and the independent reviews. Some visuals came with the original outline and are credited as such; every headline is a real article and every number is sourced in the notes.');
  return s;
}

module.exports = { titleSlide, agendaSlide, sectionSlide, explosionSlide, whatNowSlide, closingSlide, curvePt };
