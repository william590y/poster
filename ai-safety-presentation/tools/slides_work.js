// THE ACCELERATION · work: engineering, software jobs, academia, video, robotics (VLA).
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { HEX, W, MX, A, imgSize, fit } = require('./lib');
const { icon } = require('./icons');

const R = (f) => A('research', 'work', f);
const OUT = A('slides', 'work');
const CX0 = MX, CX1 = W - MX, CW = CX1 - CX0; // content x-range

// ---------- local helpers ----------
async function crop(file, name, { l, t, w, h }) {
  fs.mkdirSync(OUT, { recursive: true });
  const out = path.join(OUT, name);
  await sharp(R(file)).extract({ left: l, top: t, width: w, height: h }).toFile(out);
  return out;
}

// d.animate + support for the `after` gap on chained auto groups.
function anim(d, s, names, opts = {}) {
  d.animate(s, names, opts);
  if (opts.after) { const g = d.anim[s._num].groups; g[g.length - 1].after = opts.after; }
}

function head(s, kicker, title) {
  s.addText(kicker, { placeholder: 'kicker' });
  s.addText(title, { placeholder: 'title' });
}

function capLabel(d, s, text, o) {
  return d.text(s, text, { fontSize: 10, bold: true, color: d.S.steel, charSpacing: 2, h: 0.26, valign: 'bottom', ...o });
}

// Big-number stat with controllable label height.
function stat(d, s, { x, y, w, value, label, color, valueSize = 44, labelSize = 13, labelH = 0.8 }) {
  const vh = valueSize / 72 * 1.12;
  const n1 = d.text(s, value, { x, y, w, h: vh, fontSize: valueSize, bold: true, color: color || d.S.red, fontFace: 'Arial', valign: 'bottom' });
  const n2 = d.text(s, label, { x, y: y + vh + 0.04, w, h: labelH, fontSize: labelSize, color: d.S.muted, valign: 'top' });
  return [n1, n2];
}

// Frame size helper: given a file and a target width, return the box height that makes frame() hug the image.
async function hFor(file, w, pad = 0.06) {
  const n = await imgSize(file);
  return (w - 2 * pad) * n.h / n.w + 2 * pad;
}

async function frameW(d, s, file, x, y, w, o = {}) {
  const h = await hFor(file, w, o.pad ?? 0.06);
  return d.frame(s, file, { x, y, w, h }, o);
}

// ========== 1. Engineering: CAD Bench ==========
async function cadSlide(d) {
  const s = d.slide('Content');
  head(s, 'THE ACCELERATION · ENGINEERING', 'AI agents now do real engineering design');

  const lb = await crop('cadbench-v3-leaderboard.png', 'cad-leaderboard-top5.png', { l: 0, t: 0, w: 1820, h: 562 });
  const shot = await frameW(d, s, lb, CX0, 1.8, 7.35);
  const shotBottom = 1.8 + await hFor(lb, 7.35);

  // three stats under the leaderboard
  const sy = shotBottom + 0.45, sw = 2.25, sg = 0.3;
  const st1 = stat(d, s, { x: CX0, y: sy, w: sw, value: '61 / 100', valueSize: 40, label: 'Best overall score on 100 real FreeCAD design tasks (failures score zero)' });
  const st2 = stat(d, s, { x: CX0 + sw + sg, y: sy, w: sw, value: '84.66', valueSize: 40, label: 'Image-to-CAD: engineering drawing → working parametric 3-D model' });
  const st3 = stat(d, s, { x: CX0 + 2 * (sw + sg), y: sy, w: sw, value: '+22 pts', valueSize: 40, label: 'Jump on that task in one model update (Opus 5 → Opus 5.5)' });

  // native chart: overall scores, all entries (top on top)
  const ds = {
    labels: ['Claude Opus 5.5 (Claude Code)', 'Claude Opus 5.5 (mini-swe-agent)', 'GPT-6 Astra (Codex)', 'Claude Fable 5.1 (Claude Code)', 'Claude Opus 5 (Claude Code)', 'Gemini 3.8 Flash (mini-swe-agent)', 'Grok 4.7 (Grok Build)', 'GPT-5.6 Sol (Codex)', 'Grok 4.6 (Grok Build)', 'Gemini 3.8 Flash (Antigravity)', 'Kimi K3 (mini-swe-agent)', 'Muse Spark 1.3 (mini-swe-agent)', 'GPT-5.6 Terra (Codex)'],
    values: [61.03, 57.96, 56.87, 56.75, 50.86, 36.19, 34.82, 29.98, 27.72, 27.56, 24.92, 20.92, 17.24],
  };
  const cx = 8.35, cw = CX1 - cx;
  const lab = capLabel(d, s, 'OVERALL SCORE · CAD BENCH V3 (0–100)', { x: cx, y: 1.72, w: cw });
  const colors = ds.values.map((v, i) => (i < 4 ? HEX.red : i === 4 ? HEX.amber : HEX.steel)).reverse();
  const ch = d.chart(s, 'bar', [{ name: 'Overall', labels: [...ds.labels].reverse(), values: [...ds.values].reverse() }],
    { x: cx - 0.1, y: 2.0, w: cw + 0.1, h: 4.45 }, {
      barDir: 'bar', chartColors: colors, showValue: true, dataLabelFormatCode: '0.0', dataLabelPosition: 'outEnd', dataLabelFontSize: 10,
      valAxisHidden: true, valGridLine: { style: 'none' }, valAxisMaxVal: 75, valAxisMinVal: 0, catAxisLabelFontSize: 10, barGapWidthPct: 45,
      catAxisLineShow: false,
    });

  anim(d, s, shot, { auto: true, effect: 'rise', dur: 600 });
  anim(d, s, [lab, ch], { auto: true, effect: 'wipeLeft', dur: 900, after: 150 });
  anim(d, s, [...st1, ...st2, ...st3], { effect: 'rise', stagger: 0, dur: 450 });
  // stagger the three stats as one click
  const g = d.anim[s._num].groups[2].effects;
  g.forEach((e, i) => { e.delay = Math.floor(i / 2) * 300; });

  d.source(s, 'Sources: Parametric CAD Bench V3 leaderboard, cadbench.ai (gNucleus.ai), snapshot Sep 24, 2026 · CAD Bench V3 release note “Claude Opus 5.5 Takes the Lead” (Sep 24, 2026).');
  s.addNotes([
    'CAD — computer-aided design — is the core tool of mechanical engineering. Parametric CAD Bench V3 is 100 complex FreeCAD tasks: 30 create-from-text, 30 create-and-edit, 40 create-from-an-engineering-drawing. Failures count as zero.',
    'Claude Opus 5.5 running in Claude Code is #1 at 61.03 overall; GPT-6 Astra (Codex) 56.87; Claude Fable 5.1 56.75. On image-to-CAD — turning an engineering drawing into a parametric model — Opus 5.5 scores 84.66, up from 62.64 for Opus 5 (+22.02 points) in one release, with cost down 43%.',
    'On the older V1 suite, the best score rose from 0.832 (May) to 0.906 (Aug 2026) in 91 days — Opus 5 was the first result to break 0.9.',
    'Caveats: the benchmark authors note that the confidence intervals of the top four rows overlap. An independent academic benchmark (CADBench, MIT, arXiv 2605.10873, May 2026) is more cautious: methods "remain far from reliable CAD program reconstruction", especially on high-complexity parts.',
    'URLs: https://cadbench.ai/ · https://cadbench.ai/cad-bench/news/cad-bench-v3-opus-5-5 · https://arxiv.org/abs/2605.10873',
  ].join('\n\n'));
  return s;
}

// ========== 2. Software jobs: the junior engineer is disappearing ==========
async function juniorSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'THE ACCELERATION · ENGINEERING · 2', 'The junior engineer is disappearing');

  const lx = CX0, lw = 5.85, rx = 6.95, rw = CX1 - rx;
  const vy = 2.1, vh = 2.85;
  const l1 = capLabel(d, s, 'SOFTWARE DEVELOPERS BY AGE · HEADCOUNT (LATE 2022 = 1.0)', { x: lx, y: 1.72, w: lw });
  const can = await d.frame(s, R('swe-stanford-canaries-swe-by-age.png'), { x: lx, y: vy, w: lw, h: vh }, { align: 'left' });

  const l2 = capLabel(d, s, 'JOB POSTINGS ON INDEED · INDEX, FEB 2020 = 100', { x: rx, y: 1.72, w: rw });
  const labels = ['Feb ’20', 'Jul ’20', 'Jan ’21', 'Jul ’21', 'Jan ’22', 'Jul ’22', 'Jan ’23', 'Jul ’23', 'Jan ’24', 'Jul ’24', 'Jan ’25', 'Jul ’25', 'Jan ’26', 'Jul ’26', 'Sep ’26'];
  const ch = d.chart(s, 'line', [
    { name: 'Software development', labels, values: [99.7, 67.3, 93.4, 145.7, 216.1, 202.1, 126.3, 83.5, 71.8, 70.1, 67.5, 65.5, 68.1, 75.0, 76.5] },
    { name: 'All jobs', labels, values: [100.0, 78.3, 97.7, 137.4, 156.5, 155.7, 140.6, 129.4, 119.4, 113.7, 110.2, 104.3, 103.3, 101.6, 102.9] },
  ], { x: rx - 0.1, y: vy - 0.05, w: rw + 0.1, h: vh + 0.1 }, {
    chartColors: [HEX.red, HEX.steel], lineSize: 3, lineDataSymbolSize: 5, valAxisMinVal: 0, valAxisMaxVal: 250, valAxisMajorUnit: 50,
    catAxisLabelFrequency: 2, legendPos: 't', catAxisLabelFontSize: 10, valAxisLabelFontSize: 10,
  });

  // bottom-left: three stats
  const sy = 5.12, sw = 1.8, sg = 0.22;
  const a = stat(d, s, { x: lx, y: sy, w: sw, value: '−20%', valueSize: 34, labelSize: 12, labelH: 0.7, label: 'Developers aged 22–25 since late 2022 (35+ kept growing)' });
  const b = stat(d, s, { x: lx + sw + sg, y: sy, w: sw, value: '−65%', valueSize: 34, labelSize: 12, labelH: 0.7, label: 'New-grad hiring at Big Tech vs 2019' });
  const c = stat(d, s, { x: lx + 2 * (sw + sg), y: sy, w: sw + 0.1, value: '−76%', valueSize: 34, labelSize: 12, labelH: 0.7, label: 'New-grad hiring at early-stage startups vs 2019' });

  // bottom-right: honest caveat
  const cav = d.text(s, [
    { text: 'Honest caveat: ', options: { bold: true, color: d.S.amber } },
    { text: 'software postings bottomed in March 2025 (62) and have partly recovered — 76.5 in Sept 2026. That is still ', options: { color: d.S.muted } },
    { text: '~23% below pre-pandemic', options: { color: d.S.txt, bold: true } },
    { text: ', while all postings are ~3% above.', options: { color: d.S.muted } },
  ], { x: rx, y: sy + 0.08, w: rw, h: 1.25, fontSize: 14, valign: 'top' });

  anim(d, s, [l1, ...can], { auto: true, effect: 'rise', dur: 600 });
  anim(d, s, [l2, ch], { auto: true, effect: 'wipeLeft', dur: 1000, after: 100 });
  anim(d, s, [...a, ...b, ...c], { effect: 'rise', dur: 450 });
  d.anim[s._num].groups[2].effects.forEach((e, i) => { e.delay = Math.floor(i / 2) * 250; });
  anim(d, s, [cav], { effect: 'fade' });

  d.source(s, 'Sources: Brynjolfsson, Chandar & Chen, “Canaries in the Coal Mine?” (Stanford Digital Economy Lab, Aug 2026, Fig. B.3, ADP data) · SignalFire State of Tech Talent 2026 · Indeed Hiring Lab via FRED (through Sep 18, 2026).');
  s.addNotes([
    'Left: Stanford Digital Economy Lab, ADP payroll data. Software developers aged 22–25 have fallen to roughly 0.8 of their late-2022 headcount while developers 35–49 rose to 1.15–1.2. Across AI-exposed occupations, young workers are 19% below where they would be had they kept pace with less-exposed peers. The authors stress this is descriptive, not causal.',
    'SignalFire: new-grad hiring is down ~65% at Tech Majors (top-12 tech companies) and ~76% at early-stage startups vs 2019. New grads are now just 8% of Big Tech hires and 3% of startup hires. Indexed hires Q4 2025: ≤1-year experience at 35 (Tech Majors) and 24 (startups) vs 10+ years at 96 and 144.',
    'Right: Indeed software-development postings index (Feb 1 2020 = 100). Peak Feb 2022 = 229; trough Mar 2025 = 62.3. HONEST CAVEAT: 2026 shows a partial recovery to 76.5 — still ~23% below pre-pandemic while overall postings are ~3% above. Part of the 2022–23 collapse was the post-pandemic over-hiring hangover and interest rates, not AI.',
    'URLs: https://digitaleconomy.stanford.edu/app/uploads/2026/08/Canaries_August2026.pdf · https://www.signalfire.com/blog/signalfire-state-of-talent-report-2026 · https://fred.stlouisfed.org/series/IHLIDXUSTPSOFTDEVE',
  ].join('\n\n'));
  return s;
}

// ========== 3. Code share + layoffs collage ==========
async function codeSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'THE ACCELERATION · ENGINEERING · 3', 'AI writes the code now — and layoffs follow');

  // left: Google code-share chart + AI layoffs stat
  const lw = 3.4;
  const lab = capLabel(d, s, 'NEW GOOGLE CODE WRITTEN BY AI', { x: CX0, y: 1.72, w: lw });
  const ch = d.chart(s, 'bar', [{ name: 'Google', labels: ['2024', 'Fall 2025', 'Apr 2026'], values: [0.25, 0.5, 0.75] }],
    { x: CX0 - 0.1, y: 2.0, w: lw + 0.1, h: 2.75 }, {
      barDir: 'col', chartColors: [HEX.steel, HEX.amber, HEX.red], showValue: true, dataLabelFormatCode: '0%', dataLabelPosition: 'outEnd',
      dataLabelFontSize: 14, dataLabelFontBold: true, valAxisHidden: true, valGridLine: { style: 'none' }, valAxisMaxVal: 0.9, valAxisMinVal: 0,
      catAxisLabelFontSize: 11, barGapWidthPct: 35,
    });
  const st = stat(d, s, { x: CX0, y: 4.95, w: lw, value: '101,743', valueSize: 36, labelSize: 13, labelH: 0.8, label: 'announced US job cuts citing AI in H1 2026 — nearly double all of 2025 (Challenger)' });

  // right: collage of clippings
  const semafor = R('swe-semafor-google75.png');
  const bi = await crop('swe-bi-anthropic-cfo-90pct.png', 'swe-bi-90pct-head.png', { l: 0, t: 0, w: 1400, h: 462 });
  const fortune = await crop('swe-fortune-100pct-code.png', 'swe-fortune-100pct-head.png', { l: 0, t: 0, w: 990, h: 500 });
  const cnn = await crop('swe-cnn-block.png', 'swe-cnn-block-head.png', { l: 0, t: 0, w: 1990, h: 540 });
  const cbs = await crop('swe-cbs-ai-layoffs.png', 'swe-cbs-layoffs-head.png', { l: 0, t: 0, w: 1320, h: 352 });

  const c1 = await frameW(d, s, semafor, 4.45, 1.82, 3.35, { rot: -2 });
  const c2 = await frameW(d, s, bi, 8.15, 1.8, 4.5, { rot: 1.5 });
  const c3 = await frameW(d, s, fortune, 9.7, 3.6, 3.0, { rot: -2 });
  const c4 = await frameW(d, s, cnn, 4.5, 4.35, 4.6, { rot: 1.2 });
  const c5 = await frameW(d, s, cbs, 7.75, 5.3, 4.2, { rot: -1.5 });

  anim(d, s, [lab, ch], { auto: true, effect: 'wipeDown', dur: 800 });
  anim(d, s, [...c1, ...c2, ...c3], { auto: true, effect: 'rise', dur: 450, after: 200 });
  d.anim[s._num].groups[1].effects.forEach((e, i) => { e.delay = Math.floor(i / 2) * 220; });
  anim(d, s, c4, { effect: 'slam', dur: 350 });
  anim(d, s, c5, { auto: true, effect: 'slam', dur: 350, after: 250 });
  anim(d, s, st, { effect: 'rise' });

  d.source(s, 'Sources: Google blog / Semafor (Apr 22–24, 2026) · Business Insider (May 13, 2026) · Fortune (Jan 29, 2026) · CNN Business (Feb 26, 2026) · CBS News (May 7, 2026) · HR Dive / Challenger, Gray & Christmas (Jul 2, 2026).');
  s.addNotes([
    'Google: “75% of all new code at Google is now AI-generated and approved by engineers, up from 50% last fall” (Sundar Pichai, Cloud Next ’26, Apr 22 2026); 25% in 2024. Semafor also reports Snap reached 65% AI-generated code and immediately cut planned headcount.',
    'Anthropic CFO Krishna Rao: “90 plus percent of our code is actually written by Claude Code.” Fortune: Boris Cherny (Anthropic) — “100% for two+ months now”; roon (OpenAI) — “100%, I don’t write code anymore.” These are self-reported figures by the companies and individuals.',
    'Layoffs: Block cut more than 4,000 jobs (~40% of staff) citing AI; Jack Dorsey said most companies will do the same. Challenger: AI was the top cited reason for layoffs in April 2026 (21,490 of 88,387 cuts, 26%). H1 2026: 101,743 announced cuts cited AI (~23% of all) vs 54,836 in all of 2025; tech-sector cuts up 83% YoY.',
    'Caveat: “cited AI” is what companies say in announcements — some firms may use AI as a convenient framing for cuts driven by other factors. Microsoft has not given a 2026 figure for AI-written code (only “20–30%” in April 2025).',
    'URLs: https://blog.google/innovation-and-ai/infrastructure-and-cloud/google-cloud/cloud-next-2026-sundar-pichai/ · https://www.semafor.com/article/04/24/2026/google-ceo-says-75-of-companys-new-code-is-ai-generated · https://www.aol.com/articles/anthropic-cfo-says-ai-now-224949000.html · https://fortune.com/2026/01/29/100-percent-of-code-at-anthropic-and-openai-is-now-ai-written-boris-cherny-roon/ · https://www.cnn.com/2026/02/26/business/block-layoffs-ai-jack-dorsey · https://www.cbsnews.com/news/ai-layoffs-job-cuts-challenger-report-april-2026/ · https://www.hrdive.com/news/tech-layoffs-surge-83percent-h1-2026-challenger-ai-disruption/824320/',
  ].join('\n\n'));
  return s;
}

// ========== 4. Academia: arXiv rate limit ==========
async function arxivSlide(d) {
  const s = d.slide('Content');
  head(s, 'THE ACCELERATION · ACADEMIA', 'arXiv now caps authors at two papers a month');

  const chartImg = R('acad-arxiv-monthly-submissions-sep2026.png');
  const cw = 6.95;
  const chH = await hFor(chartImg, cw);
  const chY = 1.8 + (4.7 - chH) / 2;
  const chart = await d.frame(s, chartImg, { x: CX0, y: chY, w: cw, h: chH });
  // callout over the empty upper-left of the chart
  const g = chart.geom;
  const co = [];
  co.push(d.card(s, { x: g.x + 0.45, y: g.y + 0.62, w: 3.2, h: 1.42 }, { color: '10141B', line: HEX.red }));
  co.push(d.text(s, [
    { text: '40,363', options: { fontSize: 36, bold: true, color: d.S.red, fontFace: 'Arial', breakLine: true } },
    { text: 'submissions in Sept 2026 — 2× Sept 2024, 4× Sept 2016', options: { fontSize: 13, color: d.S.txt } },
  ], { x: g.x + 0.62, y: g.y + 0.7, w: 2.9, h: 1.28, valign: 'middle' }));

  // right column: official post + headline + quote
  const rx = 7.95, rw = CX1 - rx;
  const blog = await crop('acad-arxiv-blog-ratelimit.png', 'acad-arxiv-blog-head.png', { l: 0, t: 0, w: 1410, h: 415 });
  const cyb = await crop('acad-cybernews-arxiv-limit.png', 'acad-cybernews-arxiv-head.png', { l: 0, t: 0, w: 1800, h: 412 });
  const c1 = await frameW(d, s, blog, rx, 1.82, rw, { rot: -1.5 });
  const c2 = await frameW(d, s, cyb, rx, 3.6, rw, { rot: 1.5 });
  const q = d.text(s, [
    { text: '“There is also a marked increase in dense, AI-written papers. AI tools are making it easy for authors to flood arXiv … with these low-value papers.”', options: { italic: true, fontFace: 'Cambria', fontSize: 15, color: d.S.txt, breakLine: true } },
    { text: '— arXiv, announcing the cap (Oct 1, 2026)', options: { fontSize: 11, color: d.S.muted } },
  ], { x: rx, y: 5.0, w: rw, h: 1.45, valign: 'top' });

  anim(d, s, chart, { auto: true, effect: 'wipeLeft', dur: 1200 });
  anim(d, s, co, { effect: 'zoom', dur: 400 });
  anim(d, s, c1, { effect: 'rise' });
  anim(d, s, c2, { auto: true, effect: 'slam', dur: 350, after: 300 });
  anim(d, s, [q], { effect: 'fade' });

  d.source(s, 'Sources: arXiv blog, “Fair Moderation, Equitable Access, and AI: arXiv’s Updated Rate Limit Policy” (Kat Boboris, Oct 1, 2026) incl. monthly-submissions chart · Cybernews (Oct 2026).');
  s.addNotes([
    'From October 1, 2026 arXiv limits every submitter to two submissions per calendar month and three active submissions at any time — across ALL categories; rejected submissions count. arXiv calls it a stopgap while it works out best practice for authors using advanced AI tools.',
    'Numbers from the official post: September 2016: 9,869 submissions · September 2024: 20,569 · September 2026: 40,363 — doubled in two years, generating almost 9,000 support tickets. cs.AI submissions grew more than 6x in two years. Total submissions as of Oct 1 2026: 3,192,873.',
    'Rationale quote (verbatim): “There is also a marked increase in dense, AI-written papers. AI tools are making it easy for authors to flood arXiv and other repositories with these low-value papers.” They also cite “thin papers of narrow scope” and “salami” papers.',
    'Context: in Oct 2025 arXiv CS already stopped accepting un-reviewed review articles and position papers because of an “unmanageable influx”; in May 2026 it announced one-year bans for authors who submit unchecked LLM output (hallucinated references, leftover prompts) — 404 Media.',
    'Cybernews headline date is approximate (~Oct 1–2, 2026).',
    'URLs: https://blog.arxiv.org/2026/10/01/updated-rate-limit-policy/ · https://cybernews.com/ai-news/arxiv-limits-researchers-to-two-papers-a-month/ · https://www.404media.co/new-arxiv-rules-ai-generated-papers-ban/',
  ].join('\n\n'));
  return s;
}

// ========== 5. Academia: conferences & AI reviews ==========
async function reviewSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'THE ACCELERATION · ACADEMIA · 2', 'Peer review is drowning in AI');

  const lw = 6.1;
  const lab = capLabel(d, s, 'SUBMISSIONS TO THE TOP TWO ML CONFERENCES', { x: CX0, y: 1.72, w: lw });
  const yrs = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];
  const ch = d.chart(s, 'line', [
    { name: 'NeurIPS', labels: yrs, values: [3240, 4856, 6743, 9467, 9122, 10411, 12343, 15671, 21575, 30709] },
    { name: 'ICLR', labels: yrs, values: [507, 981, 1591, 2594, 2997, 3391, 4938, 7304, 11565, 19525] },
  ], { x: CX0 - 0.1, y: 2.0, w: lw + 0.1, h: 4.45 }, {
    chartColors: [HEX.red, HEX.amber], lineSize: 3, lineDataSymbolSize: 6, valAxisMinVal: 0, valAxisMaxVal: 35000, valAxisMajorUnit: 5000,
    valAxisLabelFormatCode: '#,##0', legendPos: 't',
  });
  const note = d.text(s, [
    { text: 'NeurIPS 2026: ', options: { bold: true, color: d.S.red } },
    { text: '30,709 (3× 2022)', options: { color: d.S.txt, breakLine: true } },
    { text: 'ICLR 2026: ', options: { bold: true, color: d.S.amber } },
    { text: '19,525 (6× 2022)', options: { color: d.S.txt } },
  ], { x: CX0 + 0.95, y: 2.65, w: 3.0, h: 0.7, fontSize: 14, valign: 'top' });

  const rx = 7.1, rw = CX1 - rx;
  const c1 = await frameW(d, s, R('acad-nature-iclr-ai-reviews.png'), rx, 1.8, rw, { rot: -1.2 });
  const c2 = await frameW(d, s, R('acad-404-arxiv-ban.png'), rx + 0.05, 4.4, 2.95, { rot: 2 });
  const st = stat(d, s, { x: rx + 3.35, y: 4.3, w: rw - 3.35, value: '18.4%', valueSize: 40, labelSize: 13, labelH: 1.1, label: 'of NeurIPS 2026 position papers desk-rejected as AI-generated (178 of 969)' });

  anim(d, s, [lab, ch], { auto: true, effect: 'wipeLeft', dur: 1100 });
  anim(d, s, [note], { auto: true, effect: 'fade', after: 100 });
  anim(d, s, c1, { effect: 'slam', dur: 350 });
  anim(d, s, c2, { effect: 'rise' });
  anim(d, s, st, { auto: true, effect: 'rise', after: 250 });

  d.source(s, 'Sources: CS Conf Stats / OpenAccept; ICLR 2026 retrospective (Mar 31, 2026) · Nature, Naddaf (Nov 27, 2025) · 404 Media (May 15, 2026) · NeurIPS blog (Jun 2, 2026).');
  s.addNotes([
    'Submissions: NeurIPS 2026 received 30,709 main-track submissions (+42% YoY, ~3x 2022’s 10,411). ICLR 2026 received 19,525 valid submissions (~6x 2022’s 3,391), reviewed via 76,139 reviews by 18,054 reviewers; acceptance 27.4%. NeurIPS figures come from aggregator sites (CS Conf Stats and OpenAccept agree on every value); the ICLR 2026 figure is confirmed by the official retrospective.',
    'Nature (Nov 2025): Pangram screened 19,490 ICLR 2026 submissions and 75,800 reviews — 21% of reviews were fully AI-generated and more than half showed signs of AI use. ICLR desk-rejected papers with hallucinated references.',
    'NeurIPS 2026 position-paper track required papers to be substantially human-written; screening 969 submissions with Pangram, 178 (18.4%) were desk-rejected and 123 (12.7%) asked to prove human engagement. Caveat: these rely on an AI-text detector (Pangram), though NeurIPS says it ran independent analyses to rule out significant false positives.',
    '404 Media: arXiv will ban researchers for a year when there is “incontrovertible evidence that the authors did not check the results of LLM generation.”',
    'URLs: https://csconfstats.xoveexu.com/conferences/neurips/ · https://csconfstats.xoveexu.com/conferences/iclr/ · https://blog.iclr.cc/2026/03/31/a-retrospective-on-the-iclr-2026-review-process/ · https://www.nature.com/articles/d41586-025-03506-6 · https://www.404media.co/new-arxiv-rules-ai-generated-papers-ban/ · https://blog.neurips.cc/2026/06/02/ai-generated-papers-in-the-neurips-2026-position-paper-track/',
  ].join('\n\n'));
  return s;
}

// ========== 6. Video Turing test: Tavus Griffin ==========
async function tavusSlide(d) {
  const s = d.slide('Content', { transition: 'zoom' });
  head(s, 'THE ACCELERATION · VIDEO', '48% believed this AI was a real person');

  const vid = await d.video(s, {
    link: 'https://www.youtube.com/watch?v=VcQcRRHJTyc', embed: 'https://www.youtube.com/embed/VcQcRRHJTyc',
    cover: R('video-yt-VcQcRRHJTyc.jpg'), box: { x: CX0, y: 1.8, w: 6.95, h: 3.91 },
    label: 'Tavus introduces Griffin — release video (BusinessWire, Oct 1, 2026)',
  });
  const cap = d.text(s, [
    { text: 'The woman in the inset is Griffin. ', options: { bold: true, color: d.S.txt } },
    { text: 'Every pixel — face, hands, background — is generated live from one reference image.', options: { color: d.S.muted } },
  ], { x: CX0, y: 6.08, w: 6.95, h: 0.45, fontSize: 13, valign: 'top' });

  const rx = 7.95, rw = CX1 - rx;
  const page = await crop('video-tavus-griffin-page.jpg', 'video-tavus-page-hero.jpg', { l: 170, t: 290, w: 1660, h: 1110 });
  const shot = await frameW(d, s, page, rx, 1.8, rw);
  const ch = d.chart(s, 'bar', [{ name: 'Judged human', labels: ['Previous Tavus system', 'Griffin-Lite'], values: [2.4, 48.0] }],
    { x: rx - 0.1, y: 5.05, w: rw + 0.1, h: 1.05 }, {
      barDir: 'bar', chartColors: [HEX.steel, HEX.red], showValue: true, dataLabelFormatCode: '0.0"%"', dataLabelPosition: 'outEnd',
      dataLabelFontSize: 12, dataLabelFontBold: true, valAxisHidden: true, valGridLine: { style: 'none' }, valAxisMaxVal: 60, valAxisMinVal: 0,
      catAxisLabelFontSize: 11, barGapWidthPct: 40, catAxisLineShow: false,
    });
  const cav = d.text(s, 'Company-run study (26 of 54 vs 1 of 41, one-minute calls) — not independently verified.',
    { x: rx, y: 6.1, w: rw, h: 0.42, fontSize: 11, color: d.S.amber, italic: true, valign: 'top' });

  anim(d, s, vid, { auto: true, effect: 'fade', dur: 700 });
  anim(d, s, [cap], { auto: true, effect: 'fade', after: 100 });
  anim(d, s, shot, { effect: 'rise' });
  anim(d, s, [ch, cav], { effect: 'wipeLeft', dur: 800 });

  d.source(s, 'Sources: Tavus, “The First Human Interaction Model” — tavus.io/griffin (Oct 1, 2026) · Tavus/BusinessWire release video on YouTube.');
  s.addNotes([
    'Tavus Griffin, released Oct 1 2026 as the “Griffin-Lite” research preview. Tavus claims it is “the first model to pass the real-time, video Turing test”: in a live study, participants had one-minute video calls with a partner they were told was another participant. 26 of 54 (48%) who talked to Griffin-Lite thought they had talked with a real human; Tavus’s previous system (Phoenix-4.5 + Sparrow-2 + Raven-1) fooled 1 of 41 (2.4%).',
    'Griffin “generates every pixel in every frame in real time from one reference image” — face, hands, chair, shadows and background — as a single full-duplex video-to-video model rather than a cascade of transcription → LLM → voice → video.',
    'CAVEAT (say it out loud): this is a company-run study with small samples and no independent replication; an X community note flagged it as not independently verified. The page also claims #1 on NVIDIA’s independent test of face-to-face AI.',
    'Video: the release video was distributed via BusinessWire on YouTube (no Tavus-owned upload found): https://www.youtube.com/watch?v=VcQcRRHJTyc · Page: https://www.tavus.io/griffin · Coverage: Business Today (Oct 3 2026), Cybernews.',
  ].join('\n\n'));
  return s;
}

// ========== 7. Which one is real? (DF26) ==========
async function realSlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  head(s, 'THE ACCELERATION · VIDEO · 2', 'Which one is real?');
  const hint = d.text(s, 'Each row: one real video frame, two AI-generated (Google Veo 3.1, Kling 3.0). Vote now.',
    { x: 7.3, y: 0.86, w: CX1 - 7.3, h: 0.5, fontSize: 13, color: d.S.muted, align: 'right', valign: 'middle' });

  const rows = [
    [['video-df26-ex1-fake-veo31.jpg', 'AI · VEO 3.1'], ['video-df26-ex1-real.jpg', null], ['video-df26-ex1-fake-kling30.jpg', 'AI · KLING 3.0']],
    [['video-df26-ex2-fake-kling30.jpg', 'AI · KLING 3.0'], ['video-df26-ex2-fake-veo31.jpg', 'AI · VEO 3.1'], ['video-df26-ex2-real.jpg', null]],
  ];
  const gap = 0.25, fw = (CW - 2 * gap) / 3, fh = fw * 9 / 16;
  const ys = [1.78, 1.78 + fh + 0.26];
  const letters = 'ABCDEF';
  const base = [], reveals = [[], []];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      const [file, tag] = rows[r][c];
      const x = CX0 + c * (fw + gap), y = ys[r];
      const im = d.name('df');
      s.addImage({ path: R(file), x, y, w: fw, h: fh, objectName: im, shadow: { type: 'outer', color: '000000', blur: 12, offset: 3, angle: 90, opacity: 0.5 } });
      const badge = d.name('badge');
      s.addShape(d.pres.shapes.OVAL, { x: x + 0.12, y: y + 0.12, w: 0.44, h: 0.44, fill: { color: '0A0C10', transparency: 15 }, line: { color: 'FFFFFF', width: 1.25 }, objectName: badge });
      const bt = d.text(s, letters[r * 3 + c], { x: x + 0.12, y: y + 0.12, w: 0.44, h: 0.44, fontSize: 16, bold: true, color: d.S.txt, align: 'center', valign: 'middle' });
      base.push(im, badge, bt);
      if (tag) {
        const t = d.text(s, tag, { x: x + 0.12, y: y + fh - 0.5, w: 1.75, h: 0.36, fontSize: 12, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', fill: { color: '0A0C10', transparency: 20 }, charSpacing: 1 });
        reveals[r].push(t);
      } else {
        const ol = d.name('ol');
        s.addShape(d.pres.shapes.RECTANGLE, { x: x - 0.04, y: y - 0.04, w: fw + 0.08, h: fh + 0.08, fill: { color: 'FFFFFF', transparency: 100 }, line: { color: HEX.red, width: 4 }, objectName: ol });
        const t = d.text(s, 'REAL', { x: x + 0.12, y: y + fh - 0.52, w: 1.1, h: 0.4, fontSize: 16, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', fill: { color: HEX.red }, charSpacing: 3 });
        reveals[r].push(ol, t);
      }
    }
  }

  // final overlay: the human-accuracy stat + DF26 chart
  const ox = 2.55, oy = 2.25, ow = CW - 2 * (ox - CX0), oh = 3.35;
  const ov = [];
  ov.push(d.card(s, { x: ox, y: oy, w: ow, h: oh }, { color: '0D1016', line: HEX.red }));
  ov.push(d.text(s, '52.6%', { x: ox + 0.4, y: oy + 0.35, w: 3.4, h: 1.05, fontSize: 66, bold: true, color: d.S.red, fontFace: 'Arial', valign: 'bottom' }));
  ov.push(d.text(s, [
    { text: 'Human accuracy at spotting fake videos from 2026 generators. ', options: { color: d.S.txt, bold: true } },
    { text: 'A coin flip scores 50%.', options: { color: d.S.muted } },
  ], { x: ox + 0.4, y: oy + 1.5, w: 3.4, h: 1.5, fontSize: 15, valign: 'top' }));
  ov.push(capLabel(d, s, 'HUMANS SPOTTING FAKES, % CORRECT', { x: ox + 4.15, y: oy + 0.28, w: ow - 4.45 }));
  ov.push(d.chart(s, 'bar', [{ name: 'Accuracy on fakes', labels: ['Celeb-DF v3', 'DSv2', 'DF26 (2026)'], values: [74.5, 69.8, 52.6] }],
    { x: ox + 4.05, y: oy + 0.6, w: ow - 4.35, h: oh - 0.8 }, {
      barDir: 'col', chartColors: [HEX.steel, HEX.steel, HEX.red], showValue: true, dataLabelFormatCode: '0.0', dataLabelPosition: 'outEnd',
      dataLabelFontSize: 12, dataLabelFontBold: true, valAxisHidden: true, valGridLine: { style: 'none' }, valAxisMaxVal: 90, valAxisMinVal: 0,
      catAxisLabelFontSize: 11, barGapWidthPct: 45,
    }));

  anim(d, s, [hint], { auto: true, effect: 'fade' });
  anim(d, s, base, { auto: true, effect: 'fade', dur: 600, after: 100 });
  anim(d, s, reveals[0], { effect: 'zoom', dur: 350 });
  anim(d, s, reveals[1], { effect: 'zoom', dur: 350 });
  anim(d, s, ov, { effect: 'zoom', dur: 450 });

  d.source(s, 'Source: Shykula et al., “DF26: We Cannot Tell Fake From Real Anymore”, arXiv 2609.07369 (Sep 2026), Fig. 1 frames and human study (232 labeling sessions).');
  s.addNotes([
    'Interactive: let the audience vote on each row before clicking. Click 1 reveals row 1 (B is real), click 2 reveals row 2 (F is real), click 3 shows the human-accuracy result.',
    'Answers: Row 1 — A = Veo 3.1 (AI), B = REAL, C = Kling 3.0 (AI). Row 2 — D = Kling 3.0 (AI), E = Veo 3.1 (AI), F = REAL. The fakes are image-to-video generations seeded from the real clip; these are last frames from DF26 Fig. 1.',
    'DF26 (CTU Prague et al.): “Human performance in detecting AI-generated videos, as well as state-of-the-art deepfake detectors, is close to random chance.” Human accuracy on fake videos: Celeb-DF v3 74.5%, DSv2 69.8%, DF26 52.6% — barely above chance. Accuracy on real videos was ~73–76% on all three. 232 labeling sessions.',
    'Note: these are still frames; in the study participants watched full videos. Related: a Malwarebytes survey (Help Net Security, Jun 2026) found 85% of adults say they can no longer tell real from AI-generated content (self-reported).',
    'URL: https://arxiv.org/abs/2609.07369 · https://arxiv.org/html/2609.07369v1',
  ].join('\n\n'));
  return s;
}

// ========== 8. VLA: wall of headlines ==========
async function vlaWallSlide(d) {
  const s = d.slide('Content');
  head(s, 'THE ACCELERATION · ROBOTICS', 'Robots are getting foundation-model brains');

  const nvidia = await crop('vla-nvidia-gtc2026-physical-ai.png', 'vla-nvidia-head.png', { l: 0, t: 0, w: 1640, h: 715 });
  const items = [
    [R('vla-techcrunch-pi07.png'), 0.65, 1.82, 4.55, -2],
    [R('vla-deepmind-gr2-blog.png'), 5.55, 1.85, 4.15, 1.5],
    [R('vla-figure-helix25.png'), 10.0, 1.95, 2.7, -2],
    [R('vla-bnnbloomberg-robot-brain.png'), 5.4, 3.25, 3.95, -1.5],
    [R('vla-robotreport-gr2.png'), 9.55, 3.35, 3.15, 2],
    [nvidia, 0.75, 4.1, 4.3, 1.5],
    [R('vla-mittr-humanoid-gig.png'), 5.6, 4.95, 4.1, 1],
  ];
  const fr = [];
  for (const [f, x, y, w, rot] of items) fr.push(await frameW(d, s, f, x, y, w, { rot }));
  const facts = d.text(s, [
    { text: '30', options: { fontSize: 26, bold: true, color: d.S.red, fontFace: 'Arial', breakLine: true } },
    { text: 'homes it had never seen (Figure)', options: { fontSize: 12, color: d.S.muted, breakLine: true, paraSpaceAfter: 8 } },
    { text: '<200', options: { fontSize: 26, bold: true, color: d.S.red, fontFace: 'Arial', breakLine: true } },
    { text: 'examples to drive a new robot body (DeepMind)', options: { fontSize: 12, color: d.S.muted, breakLine: true, paraSpaceAfter: 8 } },
    { text: '2', options: { fontSize: 26, bold: true, color: d.S.red, fontFace: 'Arial', breakLine: true } },
    { text: 'related demos to run an unfamiliar air fryer (π0.7)', options: { fontSize: 12, color: d.S.muted } },
  ], { x: 10.2, y: 4.2, w: CX1 - 10.2, h: 2.3, valign: 'top' });

  fr.forEach((f, i) => anim(d, s, f, { auto: true, effect: i % 3 === 0 ? 'slam' : 'rise', dur: i % 3 === 0 ? 330 : 420, after: i ? 90 : 0 }));
  anim(d, s, [facts], { effect: 'fade' });

  d.source(s, 'Sources: TechCrunch (Apr 16, 2026) · Google DeepMind blog (Jul 30, 2026) · Figure AI (Sep 17, 2026) · Reuters via BNN Bloomberg (Sep 18, 2026) · The Robot Report (Aug 2, 2026) · NVIDIA (Mar 16, 2026) · MIT Tech Review (Apr 1, 2026).');
  s.addNotes([
    'Vision-language-action models (VLAs) are the robotics version of the LLM boom — and in 2026 the headlines are about generalization: doing tasks and working in places the robot was never trained on.',
    'Physical Intelligence π0.7 (TechCrunch): ran an unfamiliar air fryer after seeing only two related training episodes. Sergey Levine: “the capabilities are going up more than linearly.” Ashwin Balakrishna: “the last few months have been the first time where I’m genuinely surprised.”',
    'Google DeepMind Gemini Robotics 2: “our most advanced vision-language-action model (VLA) that converts vision and language input into motor control”; the on-device version adapts to a new robot body “with just a few hours of adaptation time, typically with less than 200 examples.” Caveat: success rates still vary — whole-body manipulation 46–76%.',
    'Figure Helix 2.5: three long-horizon behaviors (tidying living rooms, folding towels, making beds) across 30 unseen homes with no data collection, fine-tuning or adaptation there (company claim). NVIDIA (GTC 2026): GR00T N2 succeeds at new tasks in new environments more than twice as often as leading VLAs; Jensen Huang: “Physical AI has arrived.” Reuters: Chinese “robot brain” startup Spirit AI expects humanoids to complete most general-purpose tasks from verbal instructions as soon as next year — though being useful at home will take much longer. MIT TR: gig workers in Nigeria and India record chores with head-mounted iPhones to train humanoids.',
    'URLs: https://techcrunch.com/2026/04/16/physical-intelligence-a-hot-robotics-startup-says-its-new-robot-brain-can-figure-out-tasks-it-was-never-taught/ · https://deepmind.google/blog/gemini-robotics-2-brings-whole-body-intelligence-to-robots/ · https://www.figure.ai/news/helix-2-5-zero-shot-30-home-generalization · https://www.bnnbloomberg.ca/business/artificial-intelligence/2026/09/18/chinese-robot-brain-startup-sees-chatgpt-style-breakthrough-as-soon-as-next-year/ · https://www.therobotreport.com/google-deepmind-says-gemini-robotics-2-enables-full-body-control/ · https://nvidianews.nvidia.com/news/nvidia-and-global-robotics-leaders-take-physical-ai-to-the-real-world · https://www.technologyreview.com/2026/04/01/1134863/humanoid-data-training-gig-economy-2026-breakthrough-technology/',
  ].join('\n\n'));
  return s;
}

// ========== 9. VLA architecture ==========
async function vlaArchSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'THE ACCELERATION · ROBOTICS · 2', 'A VLA is a language model with hands');

  // native diagram
  const y = 1.85, h = 1.55, ag = 0.55;
  const ws = [2.35, 4.55, 2.15, 1.98];
  const xs = [CX0];
  for (let i = 1; i < 4; i++) xs.push(xs[i - 1] + ws[i - 1] + ag);
  const steps = [];
  const mk = async (i, { title, sub, ic, hot, kicker }) => {
    const g = [];
    const box = d.name('vbox');
    s.addShape(d.pres.shapes.ROUNDED_RECTANGLE, { x: xs[i], y, w: ws[i], h, rectRadius: 0.1, fill: { color: hot ? '2A0C0E' : HEX.card }, line: { color: hot ? HEX.red : HEX.line, width: hot ? 2 : 1 }, objectName: box });
    g.push(box);
    g.push(d.text(s, kicker, { x: xs[i] + 0.18, y: y + 0.14, w: ws[i] - 0.36, h: 0.24, fontSize: 10, bold: true, color: hot ? d.S.red : d.S.steel, charSpacing: 2 }));
    let tx = xs[i] + 0.18;
    if (ic) {
      for (let k = 0; k < ic.length; k++) {
        const im = d.name('vic');
        s.addImage({ data: await icon(ic[k], hot ? '#E5383B' : '#F2F3F5'), x: tx + k * 0.48, y: y + 0.5, w: 0.36, h: 0.36, objectName: im });
        g.push(im);
      }
    }
    g.push(d.text(s, [
      { text: title, options: { fontSize: hot ? 20 : 16, bold: true, color: d.S.txt, fontFace: 'Arial', breakLine: true } },
      { text: sub, options: { fontSize: 12, color: d.S.muted } },
    ], { x: xs[i] + 0.18, y: y + (ic ? 0.92 : 0.45), w: ws[i] - 0.3, h: h - (ic ? 0.98 : 0.5), valign: 'top' }));
    return g;
  };
  steps.push(await mk(0, { kicker: 'INPUT', ic: ['FaCamera', 'FaCommentAlt'], title: 'Camera + words', sub: '“fold the shirt”' }));
  steps.push(await mk(1, { kicker: 'THE BRAIN · ~90% OF π0', ic: ['FaBrain'], hot: true, title: 'Pre-trained VLM / LLM', sub: 'An off-the-shelf language model: Gemma 2.6B (π0), Llama 2 7B (OpenVLA)' }));
  steps.push(await mk(2, { kicker: 'BOLTED ON', ic: ['FaCogs'], title: 'Action expert', sub: 'small head, ~300M params (π0)' }));
  steps.push(await mk(3, { kicker: 'OUTPUT', ic: ['FaRobot'], title: 'Motor commands', sub: 'Δx, Δθ, Δgrip' }));
  const arrows = [];
  for (let i = 0; i < 3; i++) {
    const a = d.name('arr');
    s.addShape(d.pres.shapes.LINE, { x: xs[i] + ws[i] + 0.08, y: y + h / 2, w: ag - 0.16, h: 0, line: { color: HEX.red, width: 2.25, endArrowType: 'triangle' }, objectName: a });
    arrows.push(a);
  }

  // paper figures
  const fy = 3.85, fh = 2.15;
  const pi0 = await crop('vla-pi0-overview-fig3.png', 'vla-pi0-fig3-core.png', { l: 372, t: 0, w: 1262, h: 568 });
  const ov = R('vla-openvla-model-fig2.png');
  const n1 = await imgSize(pi0), n2 = await imgSize(ov);
  const w1 = (fh - 0.12) * n1.w / n1.h + 0.12, w2 = (fh - 0.12) * n2.w / n2.h + 0.12;
  const fx = CX0 + (CW - (w1 + w2 + 0.5)) / 2;
  const f1 = await d.frame(s, pi0, { x: fx, y: fy, w: w1, h: fh });
  const f2 = await d.frame(s, ov, { x: fx + w1 + 0.5, y: fy, w: w2, h: fh });
  const cp1 = d.text(s, [{ text: 'π0 (Physical Intelligence): ', options: { bold: true, color: d.S.txt } }, { text: 'SigLIP + Gemma 2.6B → 300M action expert', options: { color: d.S.muted } }],
    { x: fx, y: fy + fh + 0.08, w: w1, h: 0.3, fontSize: 11 });
  const cp2 = d.text(s, [{ text: 'OpenVLA (Stanford/Berkeley): ', options: { bold: true, color: d.S.txt } }, { text: 'the backbone is literally Llama 2 7B', options: { color: d.S.muted } }],
    { x: fx + w1 + 0.5, y: fy + fh + 0.08, w: w2, h: 0.3, fontSize: 11 });

  anim(d, s, steps[0], { auto: true, effect: 'fade', dur: 400 });
  for (let i = 1; i < 4; i++) anim(d, s, [arrows[i - 1], ...steps[i]], { auto: true, effect: 'wipeLeft', dur: 450, after: 120 });
  anim(d, s, [...f1, cp1], { effect: 'rise' });
  anim(d, s, [...f2, cp2], { auto: true, effect: 'rise', after: 200 });

  d.source(s, 'Sources: Black et al., “π0: A Vision-Language-Action Flow Model for General Robot Control”, arXiv 2410.24164, Fig. 3 · Kim et al., “OpenVLA”, arXiv 2406.09246, Fig. 2.');
  s.addNotes([
    'The punchline: a vision-language-action model is not a new kind of AI. It is the same pre-trained vision-language / language model behind chatbots, with a small “action head” bolted on that turns its internal representation into motor commands.',
    'π0 (Physical Intelligence, Oct 2024): pre-trained VLM = SigLIP (400M) + Gemma (2.6B), plus a 300M-parameter action expert that outputs chunks of future actions. So roughly 3.0B of ~3.3B parameters — about 90% — are the pre-trained VLM (our arithmetic from the paper’s numbers).',
    'OpenVLA (Stanford/Berkeley/TRI, Jun 2024): input image + “Put eggplant in bowl” → DinoV2/SigLIP vision encoders → MLP projector → Llama 2 7B → action de-tokenizer → 7-D robot action (Δx, Δθ, Δgrip).',
    'Why it matters for safety: every capability gain in language models — reasoning, planning, generalization — flows straight into robot bodies. Gemini Robotics 2 describes itself as a VLA “that converts vision and language input into motor control.”',
    'URLs: https://arxiv.org/abs/2410.24164 · https://arxiv.org/abs/2406.09246 · see also π0.5 (arXiv 2504.16054) and π0.7 (arXiv 2604.15483).',
  ].join('\n\n'));
  return s;
}

// ========== 10. VLA demo video ==========
async function vlaDemoSlide(d) {
  const s = d.slide('Content', { transition: 'zoom' });
  head(s, 'THE ACCELERATION · ROBOTICS · 3', 'A humanoid doing chores in 30 unseen homes');

  const vid = await d.video(s, {
    link: 'https://www.youtube.com/watch?v=lJpM_2a1zrE', embed: 'https://www.youtube.com/embed/lJpM_2a1zrE',
    cover: R('video-yt-lJpM_2a1zrE.jpg'), box: { x: CX0, y: 1.8, w: 7.65, h: 4.3 },
    label: 'Figure — Helix 2.5: 30-Home Generalization (official, Sep 17, 2026)',
  });

  const rx = 8.7, rw = CX1 - rx;
  const st = stat(d, s, { x: rx, y: 1.72, w: rw, value: '9% → 56%', valueSize: 36, labelSize: 13, labelH: 0.85, label: 'zero-shot success once pre-trained on human video — no data collected in any of the 30 homes' });
  const lab = capLabel(d, s, 'MORE OFFICIAL DEMOS · CLICK TO WATCH', { x: rx, y: 3.3, w: rw });
  const demos = [
    ['video-yt-4lSQnrMC6nY.jpg', 'https://www.youtube.com/watch?v=4lSQnrMC6nY', 'Gemini Robotics 2'],
    ['video-yt-9MNLEAzA59o.jpg', 'https://www.youtube.com/watch?v=9MNLEAzA59o', 'GR2: whole-body control'],
    ['video-yt-Zn8yMaepzVk.jpg', 'https://www.youtube.com/watch?v=Zn8yMaepzVk', 'π0.5: an unseen home'],
    ['video-yt-ZpHapIlJnMo.jpg', 'https://www.youtube.com/watch?v=ZpHapIlJnMo', 'π*0.6: 2.5 h of laundry'],
  ];
  const tw = (rw - 0.2) / 2, th = tw * 9 / 16;
  const thumbs = [];
  for (let i = 0; i < 4; i++) {
    const [f, url, cap] = demos[i];
    const x = rx + (i % 2) * (tw + 0.2), y = 3.65 + Math.floor(i / 2) * (th + 0.48);
    const im = d.name('thumb');
    s.addImage({ path: R(f), x, y, w: tw, h: th, hyperlink: { url }, objectName: im, shadow: { type: 'outer', color: '000000', blur: 10, offset: 3, angle: 90, opacity: 0.5 } });
    const t = d.text(s, [{ text: '▶ ', options: { color: d.S.red, bold: true } }, { text: cap, options: { color: d.S.muted, hyperlink: { url } } }],
      { x, y: y + th + 0.05, w: tw, h: 0.3, fontSize: 10 });
    thumbs.push(im, t);
  }

  anim(d, s, vid, { auto: true, effect: 'fade', dur: 700 });
  anim(d, s, st, { auto: true, effect: 'rise', after: 150 });
  anim(d, s, [lab, ...thumbs], { auto: true, effect: 'fade', after: 150 });

  d.source(s, 'Sources: Figure AI, “Helix 2.5: Zero-Shot 30-Home Generalization” (Sep 17, 2026) · official YouTube uploads by Figure, Google DeepMind and Physical Intelligence.');
  s.addNotes([
    'Play the Figure video (embedded). Helix 2.5 performs three long-horizon behaviors — tidying living rooms, folding towels, making beds — across 30 unseen homes, “with no data collection, fine-tuning, or adaptation in those environments or manipulated objects.” “Index pretraining alone increased zero-shot success from 9% to 56%.”',
    'Caveats: company-reported results and company-produced video; 56% zero-shot success also means many failures. Still, two years ago robots needed data collected in the exact environment.',
    'Other official demos (clickable thumbnails): Gemini Robotics 2 (Google DeepMind) https://www.youtube.com/watch?v=4lSQnrMC6nY · Intelligent whole-body control with GR2 https://www.youtube.com/watch?v=9MNLEAzA59o · π0.5 in an unseen home, autonomous, 10x speed (Physical Intelligence) https://www.youtube.com/watch?v=Zn8yMaepzVk · π*0.6 folding laundry for 2.5 hours, autonomous 1x https://www.youtube.com/watch?v=ZpHapIlJnMo (upload date not confirmed; π*0.6 released Nov 2025).',
    'Main video: https://www.youtube.com/watch?v=lJpM_2a1zrE · Post: https://www.figure.ai/news/helix-2-5-zero-shot-30-home-generalization',
  ].join('\n\n'));
  return s;
}

async function build(d) {
  await cadSlide(d);
  await juniorSlide(d);
  await codeSlide(d);
  await arxivSlide(d);
  await reviewSlide(d);
  await tavusSlide(d);
  await realSlide(d);
  await vlaWallSlide(d);
  await vlaArchSlide(d);
  await vlaDemoSlide(d);
}

module.exports = { build };
