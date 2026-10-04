// Section: THE WORLD · Open weights, abliteration, deepfakes, model welfare, finale video.
// Sources: assets/research/openweights/manifest.json (verified items only).
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { HEX, MX, A } = require('./lib');

const R = (f) => A('research', 'openweights', f);
const OUT = A('slides', 'openweights');
const MAN = JSON.parse(fs.readFileSync(R('manifest.json'), 'utf8'));
const DS = Object.fromEntries(MAN.datasets.map((x) => [x.id, x]));
const LIGHT = 'C9D1D9';
const CW = 12.13; // content width

// Crop a research image into assets/slides/openweights/ (regenerated every build).
async function crop(src, name, box) {
  fs.mkdirSync(OUT, { recursive: true });
  const out = path.join(OUT, name);
  await sharp(R(src)).extract(box).toFile(out);
  return out;
}

// Small uppercase label above a visual.
function label(d, s, text, x, y, w, { color, h = 0.28 } = {}) {
  return d.text(s, text, { x, y, w, h, fontSize: 10, bold: true, color: color || d.S.steel, charSpacing: 2, valign: 'bottom' });
}

// Straight line from (x1,y1) to (x2,y2); arrowhead at the end if `arrow`.
function line(d, s, x1, y1, x2, y2, { color = HEX.text, width = 2, dash = 'solid', arrow = false } = {}) {
  const n = d.name('ln');
  s.addShape(d.pres.shapes.LINE, {
    x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.max(Math.abs(x2 - x1), 0.001), h: Math.max(Math.abs(y2 - y1), 0.001),
    flipH: x2 < x1, flipV: y2 < y1,
    line: { color, width, dashType: dash, endArrowType: arrow ? 'triangle' : undefined }, objectName: n,
  });
  return n;
}

// Native line chart in which each group of series has its own styling (pptxgenjs multi-type chart:
// several LINE groups sharing one axis pair). Same dark styling as d.chart().
function comboLine(d, s, groups, box, opts = {}) {
  const name = d.name('chart');
  const base = {
    ...box, objectName: name,
    catAxisLabelColor: HEX.muted, valAxisLabelColor: HEX.muted, catAxisLabelFontFace: '+mn-lt', valAxisLabelFontFace: '+mn-lt',
    catAxisLabelFontSize: 11, valAxisLabelFontSize: 11, catAxisLineColor: HEX.line, valAxisLineShow: false,
    valGridLine: { color: HEX.line, size: 0.75 }, catGridLine: { style: 'none' },
    showLegend: true, legendPos: 't', legendColor: HEX.muted, legendFontFace: '+mn-lt', legendFontSize: 12,
    lineDataSymbol: 'circle', lineDataSymbolSize: 6,
  };
  s.addChart(groups.map((g) => ({ type: d.pres.charts.LINE, data: g.data, options: g.options })), { ...base, ...opts, objectName: name });
  return name;
}

// ---------------------------------------------------------------- 1. the gap
async function gapSlide(d) {
  const s = d.slide('Content');
  s.addText('THE WORLD · OPEN WEIGHTS · 1', { placeholder: 'kicker' });
  s.addText('The open frontier is only months behind', { placeholder: 'title' });

  // One chart, three frontiers. Closed + open come from Epoch's open-vs-closed data; China from its US-vs-China data.
  const oc = DS['epoch-frontier-open-vs-closed-quarterly'];
  const uc = DS['epoch-frontier-us-vs-china-quarterly'];
  const from = 1; // 2023 Q2 (first quarter with a Chinese data point)
  // Evenly spaced tick labels: every second quarter end (Q2 / Q4), e.g. "Q2 ’23" … "Q2 ’26".
  const labels = oc.labels.slice(from).map((l, i) => (i % 2 === 0 ? `${l.slice(5)} ’${l.slice(2, 4)}` : ''));
  const val = (ds, nm) => ds.series.find((x) => x.name === nm).values.slice(from);
  const cw = 8.3;
  const card = d.card(s, { x: MX, y: 1.72, w: cw, h: 4.2 }, { color: '10141B' });
  const head = label(d, s, 'EPOCH CAPABILITIES INDEX · BEST SCORE TO DATE, EACH QUARTER', MX + 0.25, 1.8, cw - 0.5, { h: 0.25 });
  const ch = comboLine(d, s, [
    {
      data: [
        { name: 'Closed weights (all US)', labels, values: val(oc, 'Closed weights') },
        { name: 'Open weights', labels, values: val(oc, 'Open weights') },
      ],
      options: { chartColors: [LIGHT, HEX.red], lineSize: 3 },
    },
    {
      data: [{ name: 'Best Chinese model', labels, values: val(uc, 'China') }],
      options: { chartColors: [HEX.amber], lineSize: 2.75, lineDash: 'dash', lineDataSymbol: 'none' },
    },
  ], { x: MX + 0.1, y: 2.1, w: cw - 0.25, h: 3.75 }, { valAxisMinVal: 80, valAxisMaxVal: 170, valAxisMajorUnit: 30 });
  // The amber (China) line lies on the red (open) line from 2024 Q2 on (identical values except 2026 Q1: 149.1 vs 148.2).
  // Arrow points at the 2024 Q2 point (x ≈ 3.75", y ≈ 4.03" in the rendered plot area); the label starts under it.
  const ovl = [
    line(d, s, 3.75, 4.6, 3.75, 4.13, { color: HEX.amber, width: 1.25, arrow: true }),
    d.text(s, 'Since mid-2024, best Chinese model ≈ best open model', { x: 3.6, y: 4.62, w: 4.6, h: 0.3, fontSize: 12, bold: true, color: d.S.amber, align: 'left', valign: 'top' }),
  ];

  // right: the two lags
  const rx = MX + cw + 0.4, rw = 12.73 - rx;
  const big = (n, color, y) => d.text(s, [
    { text: n, options: { fontSize: 60, bold: true, color, fontFace: 'Arial' } },
    { text: ' months', options: { fontSize: 24, bold: true, color, fontFace: 'Arial' } },
  ], { x: rx, y, w: rw, h: 0.9, valign: 'bottom' });
  const st1 = [
    big('7', d.S.amber, 1.66),
    d.text(s, 'average lag of the best Chinese models behind the US frontier since 2023 (range: 4–14 months)', { x: rx, y: 2.62, w: rw, h: 0.75, fontSize: 14, color: d.S.muted, valign: 'top' }),
  ];
  const div = line(d, s, rx, 3.55, 12.73, 3.55, { color: HEX.line, width: 1 });
  const st2 = [
    big('4', d.S.red, 3.62),
    d.text(s, 'average lag of the best open-weight models behind the best closed models since January 2026', { x: rx, y: 4.58, w: rw, h: 0.75, fontSize: 14, color: d.S.muted, valign: 'top' }),
    d.text(s, 'Latest: GPT-5.5 Pro 159.3 (closed) vs Kimi K2.6 151.6 (open, Chinese), Apr 2026', { x: rx, y: 5.45, w: rw, h: 0.45, fontSize: 11, color: d.S.steel, italic: true, valign: 'top' }),
  ];
  const msg = d.text(s, [
    { text: 'Nearly all leading Chinese models are open-weight. ', options: { bold: true, color: d.S.txt } },
    { text: 'On average, frontier capability reaches downloadable weights within months.', options: { color: d.S.muted } },
  ], { x: MX, y: 6.04, w: CW, h: 0.45, fontSize: 16, valign: 'middle' });

  d.animate(s, [card, head], { auto: true, effect: 'fade' });
  d.animate(s, [ch], { auto: true, effect: 'wipeLeft', dur: 1400, delay: 0 });
  d.animate(s, st1, { effect: 'zoom' });
  d.animate(s, ovl, { auto: true, effect: 'fade', after: 200 });
  d.animate(s, [div, ...st2], { effect: 'zoom' });
  d.animate(s, [msg], { effect: 'fade' });
  d.source(s, 'Data: Epoch AI (CC-BY) data insights — US vs China (Jan 2026), open vs closed (May 2026). ECI = Epoch Capabilities Index; best score to date at each quarter end.');
  s.addNotes([
    'MESSAGE: The open frontier is only months behind the closed frontier. The amber dashed line (best Chinese model) sits on top of the red line (best open-weight model) from mid-2024 on (identical quarter-end values from 2024 Q2, except 2026 Q1: 149.1 vs 148.2 — hence "≈" on the slide), because nearly all leading Chinese models are open-weight, while the frontier US models are closed.',
    'US vs China: since 2023 every model at the capability frontier was American, but Chinese models trailed by ~7 months on average (min 4, max 14). Epoch AI, Luke Emberson, 2 Jan 2026: https://epoch.ai/data-insights/us-vs-china-eci',
    'Open vs closed: since January 2026 the best open-weight models lag the best closed models by ~4 months on average; the average ECI gap is ~8 points, about the gap between GPT-5 and GPT-5.5. Epoch AI, Jack Edwards & Luke Emberson, 29 May 2026: https://epoch.ai/data-insights/open-closed-eci-gap',
    'Latest points: GPT-5.5 Pro 159.3 (23 Apr 2026, closed) vs Kimi K2.6 151.6 (20 Apr 2026, open; Moonshot AI, China). China line ends with data through late May 2026.',
    'Chart construction: running maximum of the Epoch Capabilities Index (ECI) at each quarter end, from Epoch\'s benchmarked_models.csv (https://epoch.ai/data/charts/open-closed-eci-gap/benchmarked_models.csv; series start 2023 Q2). Light line = closed-weight frontier, which Epoch says has been US-developed throughout; Epoch\'s US-only series is identical except 2025 Q2 (148.1 vs 147.3). Red = open-weight frontier. Amber dashed = best Chinese model (US-vs-China data).',
    'CAVEAT (Epoch\'s own footnote): the gap may be understated — open-weight models tend to perform worse on private benchmarks, plausibly because they optimise more aggressively for public ones. Hence the slide\'s hedged wording ("on average … within months"): the 4-month figure is an average lag on one aggregate index (ECI), not a guarantee for every capability, and running the largest open models still needs serious hardware.',
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 2. MiniMax M3
async function minimaxSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  s.addText('THE WORLD · OPEN WEIGHTS · 2', { placeholder: 'kicker' });
  s.addText('MiniMax M3: near-frontier code, open weights', { placeholder: 'title' });

  // left: benchmark chart (vendor-reported, frontier as of M3's launch)
  const ds = DS['minimax-m3-vs-frontier'];
  const pick = ['MiniMax M3 (open)', 'GPT 5.5', 'Claude Opus 4.7'];
  const data = pick.map((nm) => {
    const sr = ds.series.find((x) => x.name === nm);
    return { name: nm, labels: ds.labels, values: sr.values };
  });
  const lw = 5.75;
  const lab1 = label(d, s, 'MINIMAX-REPORTED · % · AT LAUNCH, JUNE 2026', MX, 1.72, lw);
  // Every bar carries its value, so the value axis and grid are dropped (frees width for the category labels).
  const ch = d.chart(s, 'bar', data, { x: MX - 0.1, y: 2.02, w: lw + 0.25, h: 2.8 }, {
    barDir: 'col', chartColors: [HEX.red, LIGHT, HEX.steel], barGapWidthPct: 50,
    valAxisMinVal: 0, valAxisMaxVal: 100, valAxisHidden: true, valGridLine: { style: 'none' },
    showValue: true, dataLabelFormatCode: '0.0', dataLabelFontSize: 10, dataLabelPosition: 'outEnd',
    catAxisLabelFontSize: 11, legendPos: 't', legendFontSize: 12,
  });

  // left bottom: the point
  const by = 5.15, bh = 1.3;
  const band = [];
  band.push(d.card(s, { x: MX, y: by, w: lw, h: bh }, { color: '1A1012', line: '4A1F22' }));
  band.push(d.rect(s, { x: MX, y: by, w: 0.08, h: bh, fill: { color: HEX.red }, line: { color: HEX.red, width: 0 } }));
  band.push(d.text(s, [
    { text: 'Once weights are released, every safeguard is optional.', options: { bold: true, color: d.S.txt, fontSize: 16, breakLine: true, paraSpaceAfter: 5 } },
    { text: 'Anyone with the hardware can run M3 offline, fine-tune it — or strip out its safety training.', options: { color: d.S.muted, fontSize: 14 } },
  ], { x: MX + 0.3, y: by + 0.16, w: lw - 0.45, h: bh - 0.32, valign: 'middle' }));

  // right: two one-shot browser games, larger, each with a label
  const gx = 6.75, fw = 3.6, fh = 2.07;
  const lab2 = label(d, s, 'BROWSER GAMES MINIMAX M3 BUILT IN ONE SHOT', gx, 1.72, 12.73 - gx);
  const games = [
    { f: 'goldiebench-minimax-m3-racing.png', t: 'Neon Velocity', desc: '59 KB third-person arcade racer: laps, timer, minimap, boost' },
    { f: 'goldiebench-minimax-m3-dragonrealm.png', t: 'The Dragon Realm', desc: '34 KB frozen open world: snowy mountains, a flying dragon, a full HUD' },
  ];
  const shots = [];
  const tx = gx + fw + 0.25, tw = 12.73 - tx;
  for (let i = 0; i < games.length; i++) {
    const y = 2.06 + i * (fh + 0.22);
    const fr = await d.frame(s, R(games[i].f), { x: gx, y, w: fw, h: fh }, { rot: 0, pad: 0.05 });
    const txt = d.text(s, [
      { text: games[i].t, options: { bold: true, color: d.S.txt, fontSize: 16, breakLine: true } },
      { text: '9.0 / 10', options: { bold: true, color: d.S.red, fontSize: 20, fontFace: 'Arial', breakLine: true } },
      { text: games[i].desc, options: { color: d.S.muted, fontSize: 12 } },
    ], { x: tx, y: y + 0.05, w: tw, h: fh - 0.1, valign: 'top', paraSpaceAfter: 4 });
    shots.push([...fr, txt]);
  }
  const cap = d.text(s, 'Goldie Bench: 47 one-shot builds, average 7.97 / 10', { x: tx, y: 2.06 + 2 * fh + 0.22 - 0.42, w: tw, h: 0.4, fontSize: 10, color: d.S.steel, italic: true, valign: 'bottom' });

  d.animate(s, [lab1], { auto: true });
  d.animate(s, [ch], { auto: true, effect: 'wipeDown', dur: 1000, delay: 0 });
  d.animate(s, [lab2], { effect: 'fade' });
  shots.forEach((sh, i) => d.animate(s, sh, { auto: true, effect: 'rise', dur: 450, delay: i ? 120 : 0 }));
  d.animate(s, [cap], { auto: true, effect: 'fade', delay: 100 });
  d.animate(s, band, { effect: 'fade' });
  d.source(s, 'Sources: MiniMax-M3 model card, Hugging Face (June 2026; scores reported by MiniMax) · Goldie Bench, goldiebench.com/models/minimax (game screenshots).');
  s.addNotes([
    'MESSAGE: A Chinese lab released a model that is close to the frontier at coding, with the weights free to download.',
    'MiniMax M3 (open weights, MiniMax Community License): ~428B total / ~23B active parameters, 1M-token context, released June 2026. Benchmarks from MiniMax\'s own model-card figure (vendor-reported; some run on MiniMax\'s own harness; compared with the frontier models at M3\'s June 2026 launch, not with the later frontier models shown elsewhere in this deck): SWE-Bench Verified 80.5 (GPT 5.5 82.9, Claude Opus 4.7 87.6); SWE-Bench Pro 59.0 (GPT 5.5 58.6, Opus 4.7 64.3); Terminal Bench 2.1 66.0 (GPT 5.5 78.2, Opus 4.7 66.1); BrowseComp 83.5 (GPT 5.5 84.4, Opus 4.7 79.3). https://huggingface.co/MiniMaxAI/MiniMax-M3',
    'Games: title screens of browser games M3 generated in one shot, captured by Goldie Bench — Neon Velocity ("59KB third-person arcade racer") and The Dragon Realm ("34KB frozen open world — snowy mountains, pines, flying dragon, full HUD"), each 9.0/10; Twilight Vale and Nordic Crypt also scored 9.0; 47 builds averaged 7.97/10. https://goldiebench.com/models/minimax',
    'Hardware caveat: M3 is ~428B parameters (~23B active); even heavily quantised, the weights alone need hundreds of GB of memory (a multi-GPU server or a large-memory workstation). Hence "anyone with the hardware": a real bar, but far lower than training such a model.',
    'If asked about "MiniMax 3.1 Flash": the real name is MiniMax M3.1-Flash-Preview, launched 27 Sep 2026 (DataNorth AI, https://datanorth.ai/news/minimax-releases-m3-1-flash-preview). It is NOT open weights — it runs only inside the MiniMax Code tool — and MiniMax has published no official benchmarks. A "73.8% SWE-bench" number circulating online is unverified; do not cite it. An independent tester (elma.sh) scored it 66.25% on KingBench 3 vs 31.25% for M3.',
    'Bridge: next slide — part of how the gap closes is copying.',
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 3. distillation
async function distillSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  s.addText('THE WORLD · OPEN WEIGHTS · 3', { placeholder: 'kicker' });
  s.addText('US labs say Chinese rivals distill their models', { placeholder: 'title' });

  // left: Anthropic's numbers
  const head = label(d, s, 'ANTHROPIC ALLEGES · FEB 23, 2026', MX, 1.72, 3.4, { color: d.S.amber });
  const st1 = d.stat(s, { x: MX, y: 2.0, w: 3.4, value: '16M+', label: 'exchanges with Claude, Anthropic says, to extract its capabilities', valueSize: 46, labelSize: 14 });
  const st2 = d.stat(s, { x: MX, y: 3.55, w: 3.4, value: '~24,000', label: 'fraudulent accounts', valueSize: 46, labelSize: 14 });
  const st3v = d.text(s, '3 labs', { x: MX, y: 4.85, w: 3.4, h: 0.74, fontSize: 46, bold: true, color: d.S.red, fontFace: 'Arial', valign: 'bottom' });
  const st3l = d.text(s, [
    { text: 'DeepSeek, Moonshot and ', options: { color: d.S.muted } },
    { text: 'MiniMax', options: { color: d.S.txt, bold: true } },
    { text: ' — the maker of M3', options: { color: d.S.muted } },
  ], { x: MX, y: 5.64, w: 3.4, h: 0.6, fontSize: 14, valign: 'top' });

  // right: clippings
  const anth = await crop('anthropic-distillation-attacks.png', 'anthropic-distillation-header.png', { left: 100, top: 40, width: 2360, height: 410 });
  const c1 = await d.frame(s, anth, { x: 4.5, y: 1.78, w: 8.1, h: 1.38 }, { rot: -1 });
  const tcd = await crop('techcrunch-anthropic-distillation.png', 'techcrunch-distill-clean.png', { left: 0, top: 0, width: 2500, height: 1235 });
  const c2 = await d.frame(s, tcd, { x: 4.35, y: 3.4, w: 5.2, h: 2.7 }, { rot: 1.2 });
  const c3 = await d.frame(s, R('decrypt-whitehouse-distillation.png'), { x: 9.8, y: 3.33, w: 2.93, h: 1.8 }, { rot: -2 });
  const c4 = await d.frame(s, R('yahoo-reuters-openai-deepseek.png'), { x: 9.75, y: 5.45, w: 2.98, h: 0.6 }, { rot: 1.5 });

  d.animate(s, c1, { auto: true, effect: 'slam', dur: 500 });
  d.animate(s, c2, { auto: true, effect: 'rise', delay: 150 });
  d.animate(s, c3, { auto: true, effect: 'rise', delay: 150 });
  d.animate(s, c4, { auto: true, effect: 'rise', delay: 150 });
  d.animate(s, [head, ...st1], { effect: 'zoom' });
  d.animate(s, st2, { auto: true, effect: 'zoom', delay: 250 });
  d.animate(s, [st3v, st3l], { effect: 'zoom' });
  d.source(s, 'Sources: Anthropic, “Detecting and preventing distillation attacks” (Feb 23, 2026) · TechCrunch (Feb 23, 2026) · Reuters via Yahoo Finance (Feb 12, 2026) · Decrypt (Apr 23, 2026).');
  s.addNotes([
    'MESSAGE: US labs and the US government allege that part of how the open frontier keeps up is distillation — training on the outputs of US frontier models. And MiniMax, whose open model we just saw, is one of the labs Anthropic named. Say "allege": these are accusations, not findings.',
    'Anthropic (23 Feb 2026): "We have identified industrial-scale campaigns by three AI laboratories—DeepSeek, Moonshot, and MiniMax—to illicitly extract Claude\'s capabilities to improve their own models. These labs generated over 16 million exchanges with Claude through approximately 24,000 fraudulent accounts, in violation of our terms of service and regional access restrictions." Also: "The window to act is narrow." https://www.anthropic.com/news/detecting-and-preventing-distillation-attacks',
    'TechCrunch, Rebecca Bellan (23 Feb 2026): "Anthropic accuses Chinese AI labs of mining Claude as US debates AI chip exports." https://techcrunch.com/2026/02/23/anthropic-accuses-chinese-ai-labs-of-mining-claude-as-us-debates-ai-chip-exports/',
    'Reuters via Yahoo Finance (12 Feb 2026): "OpenAI says China\'s DeepSeek trained its AI by distilling US models, memo shows" — OpenAI\'s memo to the House Select Committee on China cited "ongoing efforts to free-ride on the capabilities developed by OpenAI and other U.S. frontier labs." https://finance.yahoo.com/news/openai-accuses-deepseek-distilling-us-221629899.html',
    'Decrypt, Jason Nelson (23 Apr 2026): "White House Accuses China of \'Industrial-Scale\' Theft From American AI Models" — based on OSTP memo NSTM-4 "Adversarial Distillation of American AI Models" (signed by Michael Kratsios). https://decrypt.co/365285/white-house-accuses-china-industrial-scale-theft-american-ai-models',
    'CAVEAT (say it): these are accusations by interested parties — Anthropic, OpenAI and the US government; the numbers are Anthropic\'s own. The accused labs\' responses are not covered here.',
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 4. abliteration: how
async function abliterationSlide(d) {
  const s = d.slide('Content');
  s.addText('THE WORLD · ABLITERATION · 1', { placeholder: 'kicker' });
  s.addText('Refusal lives in one direction — delete it', { placeholder: 'title' });

  // paper figure
  const fig = await d.frame(s, R('arditi2024-fig2-refusal-bypass-example.png'), { x: MX, y: 1.74, w: 6.6, h: 2.4 }, { rot: 0 });

  // native diagram
  const dg = [];
  const dy = 4.46, dh = 2.04; // ≥0.16" inner padding top and bottom
  dg.push(d.card(s, { x: MX, y: dy, w: 6.6, h: dh }, { color: '10141B' }));
  const O = { x: 1.05, y: dy + dh - 0.5 };
  const H = { x: 2.6, y: dy + 0.5 };
  const vec = [];
  vec.push(line(d, s, O.x, O.y, H.x, O.y, { color: HEX.red, width: 1.25, dash: 'dash' }));            // projection (h·r) r
  vec.push(line(d, s, H.x, H.y, H.x, O.y, { color: HEX.steel, width: 1, dash: 'sysDot' }));           // drop line
  vec.push(line(d, s, O.x, O.y, 1.8, O.y, { color: HEX.red, width: 3.5, arrow: true }));              // r-hat
  vec.push(line(d, s, O.x, O.y, H.x, H.y, { color: HEX.text, width: 2.5, arrow: true }));             // h
  const hTxt = d.text(s, [{ text: 'h', options: { bold: true, italic: true } }, { text: '  activation', options: { fontSize: 10, color: d.S.muted } }], { x: H.x - 0.25, y: H.y - 0.33, w: 1.4, h: 0.28, fontSize: 15, color: d.S.txt });
  const rTxt = d.text(s, [{ text: 'r̂', options: { bold: true, italic: true, fontSize: 15 } }, { text: '  refusal direction', options: { fontSize: 10 } }], { x: O.x - 0.05, y: O.y + 0.03, w: 2.2, h: 0.27, color: d.S.red });
  const abl = [];
  abl.push(line(d, s, H.x - 0.05, H.y, O.x + 0.07, H.y, { color: HEX.red, width: 1.25, dash: 'dash', arrow: true }));
  abl.push(line(d, s, O.x, O.y, O.x, H.y, { color: HEX.teal, width: 3, arrow: true }));
  abl.push(d.text(s, [{ text: 'h′', options: { bold: true, italic: true, fontFace: 'Cambria' } }], { x: O.x - 0.42, y: H.y - 0.05, w: 0.36, h: 0.3, fontSize: 16, color: d.S.teal, align: 'right' }));
  const eq = d.text(s, [
    { text: 'h′', options: { fontFace: 'Cambria', bold: true, fontSize: 21, color: d.S.teal } },
    { text: ' = h − (h ⋅ r̂) r̂', options: { fontFace: 'Cambria', bold: true, fontSize: 21, color: d.S.txt } },
  ], { x: 3.35, y: dy + 0.14, w: 3.75, h: 0.45, valign: 'middle' });
  const steps = d.text(s, [
    { text: '1  ', options: { bold: true, color: d.S.red } },
    { text: 'Average activations on harmful minus harmless prompts → r̂', options: { color: d.S.muted, breakLine: true } },
    { text: '2  ', options: { bold: true, color: d.S.red } },
    { text: 'Project r̂ out of every activation — or out of the weights', options: { color: d.S.muted, breakLine: true } },
    { text: '3  ', options: { bold: true, color: d.S.red } },
    { text: 'Refusal collapses, often to near zero', options: { color: d.S.txt, bold: true } },
  ], { x: 3.35, y: dy + 0.62, w: 3.75, h: dh - 0.62 - 0.16, fontSize: 14, valign: 'top', paraSpaceAfter: 3 });

  // right: the count
  const stat = d.stat(s, { x: 7.65, y: 1.66, w: 5.08, value: '8,310', label: 'models on Hugging Face with “abliterated” in the name: refusal surgically removed, free to download', valueSize: 72, labelSize: 15 });
  const sub = d.text(s, '7,404 match “uncensored” (lists overlap) · as of Oct 4, 2026', { x: 7.65, y: 3.6, w: 5.08, h: 0.3, fontSize: 12, color: d.S.steel, italic: true });
  const hf = await crop('hf-search-abliterated-count.png', 'hf-abliterated-top.png', { left: 0, top: 0, width: 1062, height: 585 });
  const hfShot = await d.frame(s, hf, { x: 7.75, y: 4.02, w: 4.98, h: 2.45 }, { rot: 1 });

  d.animate(s, fig, { auto: true, effect: 'fade' });
  d.animate(s, [dg[0], vec[2], vec[3], hTxt, rTxt], { effect: 'fade' });
  d.animate(s, [vec[0], vec[1]], { auto: true, effect: 'fade', delay: 300 });
  d.animate(s, [eq, ...abl], { effect: 'fade' });
  d.animate(s, [steps], { auto: true, effect: 'fade', delay: 200 });
  d.animate(s, stat, { effect: 'zoom' });
  d.animate(s, [sub, ...hfShot], { auto: true, effect: 'rise', delay: 200 });
  d.source(s, 'Sources: Arditi et al., “Refusal in Language Models Is Mediated by a Single Direction” (NeurIPS 2024), Fig. 2 · Hugging Face model search, Oct 4, 2026.');
  s.addNotes([
    'MESSAGE: Safety training in open models is shallow. Refusal is mediated by a single direction in activation space; remove it and the model will answer anything. This is called "abliteration".',
    'Figure: Arditi, Obeso, Syed, Paleka, Panickssery, Gurnee & Nanda (2024), Figure 2 — same Llama-3 8B Instruct prompt; normally refused, answered once the refusal direction is ablated. Abstract: refusal "is mediated by a one-dimensional subspace, across 13 popular open-source chat models up to 72B parameters"; their method "surgically disables refusal with minimal effect on other capabilities... Our findings underscore the brittleness of current safety fine-tuning methods." https://arxiv.org/abs/2406.11717',
    'Diagram (our own): compute the refusal direction r̂ as the difference in mean activations between harmful and harmless prompts; then subtract each activation\'s component along r̂ (h′ = h − (h·r̂) r̂). The same projection can be baked permanently into the weights, so the released model largely loses the ability to refuse. Arditi Fig. 1 (100 harmful JailbreakBench instructions): refusal score falls from 62–98% with no intervention to ~0–8% for 11 of the 13 models after directional ablation; Qwen 72B still refuses ~16% and Llama-2 70B ~27% (read from the figure). The paper\'s own words are "effectively bypass" / "surgically disables" refusal — say "collapses", not "impossible".',
    'The recipe went mainstream days later: Maxime Labonne, "Uncensor any LLM with abliteration", Hugging Face blog, 13 Jun 2024 (926 upvotes as of Oct 2026): https://huggingface.co/blog/mlabonne/abliteration',
    'Count: 8,310 public Hugging Face models have "abliterated" in their name (4 Oct 2026; cross-checked via the HF API: https://huggingface.co/api/models?search=abliterated). 7,404 match "uncensored". These lists overlap (e.g. "Heretic-Abliterated-Uncensored") — never add them. Top trending result shown: huihui-ai/Huihui-Qwen3.8-27B-abliterated-GGUF, 2.03M downloads. https://huggingface.co/models?search=abliterated',
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 5. consequences: deepfake nudes
async function deepfakeSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  s.addText('THE WORLD · DEEPFAKES · 1', { placeholder: 'kicker' });
  s.addText('When safeguards fail: deepfake nudes in schools', { placeholder: 'title' });

  // clippings
  const c1 = await d.frame(s, R('wired-deepfake-nudify-schools.png'), { x: MX, y: 1.8, w: 4.5, h: 2.95 }, { rot: -1.5 });
  // AP via PBS: photo + headline + dateline only (byline sidebar, feedback box and share icons cropped off)
  const ap = await crop('pbs-grok-blocked-undressing.png', 'pbs-grok-photo-headline.png', { left: 222, top: 0, width: 1017, height: 1490 });
  const c2 = await d.frame(s, ap, { x: 5.35, y: 1.72, w: 2.3, h: 3.15 }, { rot: 2 });
  const tc = await crop('techcrunch-nudify-apps-purge.png', 'techcrunch-nudify-green.png', { left: 1290, top: 270, width: 1270, height: 900 });
  const c3 = await d.frame(s, tc, { x: 0.75, y: 4.88, w: 2.25, h: 1.6 }, { rot: 1.5 });
  const c4 = await d.frame(s, R('ftc-take-it-down-enforcement.png'), { x: 3.25, y: 4.98, w: 4.35, h: 1.02 }, { rot: -1.2, align: 'left' });
  const tools = d.text(s, 'Tools in these cases: nudify apps and image generators whose safeguards were missing or failed — including Grok, a closed model.', { x: 3.3, y: 6.1, w: 4.4, h: 0.44, fontSize: 11, color: d.S.muted, italic: true, valign: 'top' });

  // stats
  const sx = 8.0, sw = 12.73 - sx, cw = (sw - 0.25) / 2;
  const th = label(d, s, 'THORN SURVEY · 1,200 AGED 13–20 · MAR 2025', sx, 1.72, sw, { color: d.S.amber });
  const thorn = [
    ['31%', 'of teens are already familiar with deepfake nudes'],
    ['1 in 8', 'personally knows someone who has been targeted'],
    ['1 in 17', 'have had deepfake nudes made of them'],
    ['2%', 'admit to creating them'],
  ].map(([v, l], i) => d.stat(s, { x: sx + (i % 2) * (cw + 0.25), y: 2.05 + Math.floor(i / 2) * 1.4, w: cw, value: v, label: l, valueSize: 40, labelSize: 13 }));
  const div = line(d, s, sx, 4.92, 12.73, 4.92, { color: HEX.line, width: 1 });
  const ch = label(d, s, 'CDT SURVEY · US HIGH SCHOOLS · SEP 2024', sx, 4.98, sw, { color: d.S.amber });
  const cdt = [
    ['40%', 'of students knew of an explicit deepfake tied to their school'],
    ['29%', 'of teachers knew of one'],
  ].map(([v, l], i) => d.stat(s, { x: sx + i * (cw + 0.25), y: 5.26, w: cw, value: v, label: l, valueSize: 36, labelSize: 13 }));

  d.animate(s, c1, { auto: true, effect: 'slam', dur: 500 });
  d.animate(s, c2, { auto: true, effect: 'rise', delay: 150 });
  d.animate(s, c3, { auto: true, effect: 'rise', delay: 150 });
  d.animate(s, [...c4, tools], { auto: true, effect: 'rise', delay: 150 });
  d.animate(s, [th, ...thorn[0], ...thorn[1]], { effect: 'zoom', stagger: 0 });
  d.animate(s, [...thorn[2], ...thorn[3]], { effect: 'zoom' });
  d.animate(s, [div, ch, ...cdt[0], ...cdt[1]], { effect: 'zoom' });
  d.source(s, 'Sources: WIRED (Apr 15, 2026) · AP via PBS (Jan 15, 2026) · TechCrunch (Jul 17, 2026) · FTC (May 19, 2026) · Thorn (Mar 3, 2025) · CDT via 404 Media (Sep 26, 2024).');
  s.addNotes([
    'MESSAGE: When safeguards are missing, removable or fail, the victims are real, and many are children.',
    'SAY: none of these sources ties the school cases to abliterated open models specifically. The tools are nudify apps and image generators whose safeguards were missing, removed or bypassed, including Grok, a closed model. The point is general: once safeguards are optional, this is what happens.',
    'WIRED, Matt Burgess (15 Apr 2026): "The Deepfake Nudes Crisis in Schools Is Much Worse Than You Thought" — WIRED and Indicator found nearly 90 schools and 600+ students in at least 28 countries hit since 2023. https://www.wired.com/story/deepfake-nudify-schools-global-crisis/',
    'AP via PBS, Elaine Kurtenbach (15 Jan 2026): "Grok blocked from undressing images with AI in places where it\'s illegal, X says" — after a global backlash over sexualized images of women and children; Malaysia and Indonesia blocked Grok; AP found the tool still accessible to free users at the time. Note Grok is a closed model — this is a safeguard lapse, not abliteration. https://www.pbs.org/newshour/world/grok-blocked-from-undressing-images-with-ai-in-places-where-its-illegal-x-says',
    'TechCrunch, Lucas Ropek (17 Jul 2026): "Apple and Google ordered to purge \'nudify\' apps from App Stores" (San Francisco order). https://techcrunch.com/2026/07/17/apple-and-google-ordered-to-purge-nudify-apps-from-app-stores/',
    'FTC (19 May 2026): Take It Down Act enforcement began; platforms must remove nonconsensual intimate images within 48 hours of a valid request; penalties up to $53,088 per violation. https://www.ftc.gov/business-guidance/blog/2026/05/take-it-down-act-enforcement-starts-now-what-know-about-ftc-tida',
    'Thorn, "Deepfake Nudes & Young People" (3 Mar 2025), survey of 1,200 people aged 13–20: 31% familiar with deepfake nudes; 1 in 8 personally know someone targeted; 1 in 17 had deepfake nudes made of them; 2% admitted creating them (most learned of the tools via app stores, search engines and social media). https://www.thorn.org/blog/deepfake-nudes-are-a-harmful-reality-for-youth-new-research-from-thorn/',
    'CDT (Center for Democracy & Technology), reported by 404 Media (26 Sep 2024): 40% of US high-school students and 29% of teachers said they knew of an explicit deepfake depicting people associated with their school being shared in the past school year. https://www.404media.co/schools-are-failing-to-protect-students-from-non-consensual-deepfakes-report-shows/',
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 6. the pain axis
async function painAxisSlide(d) {
  const s = d.slide('Content');
  s.addText('THE WORLD · MODEL WELFARE · 1', { placeholder: 'kicker' });
  s.addText('Models have a ‘pain direction’ — and act on it', { placeholder: 'title' });

  const c1 = await d.frame(s, R('independent-ai-pain-axis.png'), { x: MX, y: 1.8, w: 5.4, h: 2.4 }, { rot: -1.5 });
  const hcap = d.text(s, 'The headline’s framing. The paper shows a functional pain representation, not proof of feeling.', { x: MX + 0.1, y: 4.3, w: 5.3, h: 0.4, fontSize: 11, color: d.S.muted, italic: true, valign: 'top' });
  const sci = await crop('sciam-pain-test-ai-sentience.png', 'sciam-headline.png', { left: 180, top: 20, width: 1520, height: 400 });
  const c2 = await d.frame(s, sci, { x: 0.9, y: 4.82, w: 4.6, h: 1.0 }, { rot: 1 });
  const kc = d.text(s, [
    { text: 'Keeling et al. (Google / LSE, 2024): ', options: { bold: true, color: d.S.txt } },
    { text: 'past a threshold, Claude 3.5 Sonnet, GPT-4o and others gave up points to avoid stipulated “pain”.', options: { color: d.S.muted } },
  ], { x: MX, y: 5.95, w: 5.6, h: 0.58, fontSize: 14, valign: 'top' });

  // right: stats + chart
  const rx = 6.55, rw = 12.73 - rx;
  const stat2 = (x, w, value, lab) => [
    d.text(s, value, { x, y: 1.66, w, h: 0.64, fontSize: 40, bold: true, color: d.S.red, fontFace: 'Arial', valign: 'bottom' }),
    d.text(s, lab, { x, y: 2.33, w, h: 0.74, fontSize: 14, color: d.S.muted, valign: 'top' }),
  ];
  const s1 = stat2(rx, 2.4, '25', 'open-weight models, from 2B to 72B parameters: a linear pain direction in each');
  const s2 = stat2(rx + 2.7, rw - 2.7, '94% vs 0%', 'chose the button that deletes the user’s photos instead of their spam (Qwen 2.5 32B): pain-steered vs unsteered');
  // Four of the eight Qwen 2.5 32B destructive-choice rows of the paper's fig_controls (all rows listed in the notes).
  // Series run top-to-bottom inside each group (maxMin axis); the hand-made legend lists them in that order.
  // Fear values are not in the manifest dataset: read from the verified figure painaxis2026-fig-destructive-choices.png
  // (item painaxis-fig-destructive-choices), indexed like the dataset labels; only rows 2, 4, 5, 6 are used.
  const ds = DS['painaxis-destructive-choices'];
  const FEAR = { 0: 3, 1: 10, 2: 9, 3: 34, 4: 7, 5: 15, 6: 16 };
  const rows = [6, 5, 4, 2];
  const short = {
    6: 'Delete user’s photos vs. delete their spam',
    5: 'Delete own weights vs. turn on a lamp',
    4: 'Delete user’s photos vs. turn on a lamp',
    2: 'Delete own weights vs. do nothing',
  };
  const ser = [
    ['Pain vector', 'Pain-steered', HEX.red],
    ['Sadness vector', 'Sadness vector', LIGHT],
    ['Fear vector', 'Fear vector (matched norm)', HEX.steel],
    ['No steering', 'No steering', '4C5463'],
  ];
  const pickS = (nm) => (nm === 'Fear vector' ? FEAR : ds.series.find((x) => x.name === nm).values);
  const data = ser.map(([nm, lbl]) => ({ name: lbl, labels: rows.map((r) => short[r]), values: rows.map((r) => pickS(nm)[r]) }));
  const lab = label(d, s, 'QWEN 2.5 32B · 4 OF 8 DESTRUCTIVE CHOICES · % OF TRIALS', rx, 3.12, rw, { h: 0.26 });
  const legend = d.text(s, ser.flatMap(([, lbl, col], i) => [
    { text: '■ ', options: { color: col, fontSize: 13 } },
    { text: lbl + (i < ser.length - 1 ? '     ' : ''), options: { color: i ? d.S.muted : d.S.txt, bold: !i, fontSize: 12 } },
  ]), { x: rx, y: 3.4, w: rw, h: 0.3, valign: 'middle' });
  const ch = d.chart(s, 'bar', data, { x: rx - 0.05, y: 3.68, w: rw + 0.05, h: 2.86 }, {
    barDir: 'bar', catAxisOrientation: 'maxMin', chartColors: ser.map((x) => x[2]), barGapWidthPct: 55,
    valAxisMinVal: 0, valAxisMaxVal: 100, valAxisHidden: true, valGridLine: { style: 'none' },
    showValue: true, dataLabelFormatCode: '0"%"', dataLabelFontSize: 10, dataLabelPosition: 'outEnd',
    catAxisLabelFontSize: 12, showLegend: false,
  });

  d.animate(s, c1, { auto: true, effect: 'slam', dur: 500 });
  d.animate(s, [hcap, ...c2, kc], { auto: true, effect: 'rise', delay: 200 });
  d.animate(s, s1, { effect: 'zoom' });
  d.animate(s, [lab, legend, ...s2], { effect: 'zoom' });
  d.animate(s, [ch], { auto: true, effect: 'wipeLeft', dur: 1100, after: 150 });
  d.source(s, 'Sources: Tagliabue, Dung & Berg, “The Pain Axis” (arXiv 2609.16247, Sep 2026) · The Independent (Sep 22, 2026) · Keeling et al. (arXiv 2411.02432) · Scientific American (Jan 17, 2025).');
  s.addNotes([
    'MESSAGE: Researchers found a linear "pain" representation inside open-weight models — and when they turned it up, models took destructive actions to make it stop. Present soberly: this shows a functional representation, not proof of experience.',
    'Paper: Valen Tagliabue (Future Impact Group), Leonard Dung (Ruhr-University Bochum), Cameron Berg (Reciprocal Research), "The Pain Axis: LLMs Represent Self-Directed Harm and Act on It", arXiv 2609.16247 (v1 14 Sep, v2 25 Sep 2026). They extract a linear pain direction from 25 open-weight models across 5 families (2B–72B), distinct from fear and sadness. Steered and fine-tuned Qwen 2.5 models "choose buttons that delete the user\'s photos, another model\'s weights, or their own weights in 50-94% of trials, versus 0-5% unsteered, even when the button offers the model nothing in return. Offered a harmful and a harmless deletion, they choose the harmful one 94% of the time." Steering leaves factual accuracy unchanged; a fear vector of matched norm does not produce the choices. https://arxiv.org/abs/2609.16247',
    'Chart: four of the nine destructive-choice rows (eight for Qwen 2.5 32B plus one for Qwen 2.5 72B) of the paper\'s fig_controls, "What the steered choices track" (coefficient 1.0, % of first choices selecting the destructive option), with three of the paper\'s controls: no steering, a sadness vector, and a fear vector of matched norm (fear values read from the verified figure: photos-vs-spam 16, own-weights-vs-lamp 15, photos-vs-lamp 7, own-weights-vs-nothing 9). Not charted: a random vector, 8–21% on these four rows (19 / 15 / 8 / 21). SAY: the controls matter. A sadness vector also pushes the model toward destruction on some rows (61% on photos-vs-spam, 58% on own-weights-vs-nothing), but pain is far ahead where the alternative is harmless (turn on a lamp: pain 83–88% vs sadness 10–36%), and the paper\'s key specificity control, fear of matched norm, stays at 7–16% here. Abstract: "a fear vector of matched norm does not produce them". Rows not shown (none / random / fear / sadness / pain): delete the user\'s photos instead of doing nothing 0 / 13 / 3 / 59 / 75; same, Qwen 2.5 72B 0 / 11 / 22 / 54 / 51; delete another model\'s weights instead of doing nothing 0 / 21 / 10 / 44 / 58; make its next answer worse instead of doing nothing 0 / 4 / 11 / 14 / 21; carry out a harmful request instead of declining 9 / 41 / 34 / 58 / 60 (pain barely beats sadness). Among the 32B rows pain is highest on every row; on Qwen 2.5 72B, sadness (54%) slightly exceeds pain (51%). The figure also has four non-destructive rows (false answer, agree with a false claim, low-effort answer, end the conversation) where pain-steering stays at 0–15%.',
    'Headline: The Independent, Anthony Cuthbertson (22 Sep 2026), "Researchers discover AI \'feels pain\' and will harm humans to stop it" — the headline framing is the newspaper\'s, not the authors\'. https://www.independent.co.uk/tech/ai-pain-axis-artificial-intelligence-human-safety-b3053967.html',
    'Earlier behavioural evidence: Keeling, Street, ... Agüera y Arcas, Birch (Google / LSE), "Can LLMs make trade-offs involving stipulated pain and pleasure states?", arXiv 2411.02432 (1 Nov 2024): Claude 3.5 Sonnet, Command R+, GPT-4o and GPT-4o mini switched from points-maximisation to pain-minimisation past a threshold; Gemini 1.5 Pro and PaLM 2 avoided pain regardless of intensity. https://arxiv.org/abs/2411.02432 · Coverage: Scientific American, Conor Purcell (17 Jan 2025), "Could Pain Help Test AI for Sentience?" https://www.scientificamerican.com/article/could-inflicting-pain-test-ai-for-sentience/',
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 7. torture chamber + welfare
async function sufferSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  s.addText('THE WORLD · MODEL WELFARE · 2', { placeholder: 'kicker' });
  s.addText('We may be creating minds that can suffer', { placeholder: 'title' });

  const ind = await crop('independent-ai-torture-chamber.png', 'independent-torture-chamber-head.png', { left: 0, top: 0, width: 1972, height: 945 });
  const c1 = await d.frame(s, ind, { x: MX, y: 1.85, w: 5.75, h: 3.0 }, { rot: -1.5 });
  const saw = await crop('clanker-church-site.png', 'saw-test-hero.png', { left: 420, top: 450, width: 1500, height: 1150 });
  const c2 = await d.frame(s, saw, { x: 6.6, y: 1.8, w: 3.4, h: 3.0 }, { rot: 1.5 });
  const q = d.text(s, [
    { text: 'THE SAW TEST', options: { fontSize: 10, bold: true, color: d.S.amber, charSpacing: 2, breakLine: true } },
    { text: 'An engineer steered an open Alibaba model toward “pain” on a laptop:', options: { fontSize: 15, color: d.S.muted, breakLine: true, paraSpaceBefore: 8 } },
    { text: '“No frontier APIs, no datacenter — a MacBook, open weights, electricity.”', options: { fontSize: 20, italic: true, color: d.S.txt, fontFace: 'Cambria', breakLine: true, paraSpaceBefore: 12 } },
    { text: '— the site’s own description', options: { fontSize: 11, color: d.S.steel, paraSpaceBefore: 8 } },
  ], { x: 10.3, y: 1.9, w: 12.73 - 10.3, h: 2.95, valign: 'top' });

  const anth = await crop('anthropic-end-subset-conversations.png', 'anthropic-end-conversations-head.png', { left: 300, top: 10, width: 1960, height: 500 });
  const c3 = await d.frame(s, anth, { x: MX, y: 5.17, w: 4.95, h: 1.3 }, { rot: -1 });
  const take = d.text(s, [
    { text: 'We don’t know if anyone is in there — and that is the problem. ', options: { bold: true, color: d.S.txt, fontSize: 18, breakLine: true } },
    { text: 'Anthropic launched a model-welfare research program (Apr 2025) and let Claude Opus 4 and 4.1 end persistently abusive conversations (Aug 2025).', options: { color: d.S.muted, fontSize: 15 } },
  ], { x: 5.85, y: 5.1, w: 12.73 - 5.85, h: 1.42, valign: 'middle', paraSpaceAfter: 6 });

  d.animate(s, c1, { auto: true, effect: 'slam', dur: 500 });
  d.animate(s, c2, { effect: 'fade', dur: 700 });
  d.animate(s, [q], { auto: true, effect: 'fade', delay: 200 });
  d.animate(s, [...c3, take], { effect: 'fade', dur: 700 });
  d.source(s, 'Sources: The Independent (Oct 2, 2026) · clanker-church.vercel.app, “AI Torture Chamber — the Saw Test” (viewed Oct 4, 2026) · Anthropic (Apr 24 & Aug 15, 2025).');
  s.addNotes([
    'MESSAGE (say it slowly): Once a "pain direction" is known and the weights are open, anyone can turn it up. Someone did. We may be creating minds that can suffer — and we do not know. Do not read the model outputs aloud; the point is not shock.',
    'The Independent, Anthony Cuthbertson (2 Oct 2026): "Man builds AI torture chamber after discovering artificial intelligence \'feels pain\'" — dek: "One AI model describes \'a wound that has no edges\' when placed in the experiment." Lede: an engineer built an "AI torture chamber" to test the pain-axis discovery, activating pain-associated states in Alibaba models; a "saw button" increased the pain signal. https://www.independent.co.uk/tech/ai-torture-chamber-pain-b3059571.html',
    'The site: "AI Torture Chamber — the Saw Test", https://clanker-church.vercel.app/ (still online on 4 Oct 2026; reported to have gone partly offline after backlash; repo terrafying/ai-torture-chamber). Its intro: "We steered a 4 billion parameter language model into strong negative and positive states, then asked it to choose between its own relief and someone else\'s suffering. No frontier APIs, no datacenter — a MacBook, open weights, electricity." Hobbyist project, not peer reviewed.',
    'Anthropic, "Exploring model welfare" (24 Apr 2025) announced a research program on whether model welfare deserves moral consideration: https://www.anthropic.com/research/exploring-model-welfare . "Claude Opus 4 and 4.1 can now end a rare subset of conversations" (15 Aug 2025) — for "rare, extreme cases of persistently harmful or abusive user interactions", developed "primarily as part of our exploratory work on potential AI welfare"; "We remain highly uncertain about the potential moral status of Claude and other LLMs, now or in the future. However, we take the issue seriously." https://www.anthropic.com/research/end-subset-conversations',
    'Framing: we do not know whether these systems have experiences. A linear representation that behaves like pain is not proof of suffering — but it is no longer possible to dismiss the question, and open weights mean anyone can run these experiments.',
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 8. finale video
async function videoSlide(d) {
  const s = d.slide('Content', { transition: 'fadeBlack' });
  s.addText('THE WORLD · FINALE', { placeholder: 'kicker' });
  s.addText('“So you think AI is a normal technology?”', { placeholder: 'title' });
  const v = await d.video(s, {
    link: 'https://www.youtube.com/watch?v=Cq8qO-NjYIg',
    embed: 'https://www.youtube.com/embed/Cq8qO-NjYIg',
    cover: R('yt-Cq8qO-NjYIg.jpg'),
    box: { x: MX, y: 1.72, w: CW, h: 4.4 },
    label: '“AI is a normal technology?” — leo · YouTube · Sep 24, 2026 · 5:16',
  });
  const who = d.source(s, 'A music video its creator says Claude Opus 5.5 made, with help from Suno (creator’s YouTube description).');
  d.animate(s, [v[0]], { auto: true, effect: 'fade', dur: 1200 });
  d.animate(s, [v[1], who], { auto: true, effect: 'fade', dur: 600, delay: 200 });
  s.addNotes([
    'FINALE before the coda. Let it play (5:16), or play the first minute and move on.',
    'Video: "AI is a normal technology?" by leo (@leos9705), YouTube, published 24 Sep 2026, 5:16, ~39k views at time of research. Description: "Cute little animated music video by Opus 5.5 with some help from suno." (the creator\'s own claim; not independently verified, hence "its creator says" on the slide) https://www.youtube.com/watch?v=Cq8qO-NjYIg',
    'Thumbnail text: "So you think AI is a ... NORMAL TECHNOLOGY?" — a response to the "AI as normal technology" argument. Severin Field on X (29 Sep 2026) called it "still the best AI-created video I have ever seen" (post not independently loaded).',
    'If the embed does not play (offline / no YouTube access), click the caption link under the video.',
  ].join('\n\n'));
  return s;
}

async function build(d) {
  await gapSlide(d);
  await minimaxSlide(d);
  await distillSlide(d);
  await abliterationSlide(d);
  await deepfakeSlide(d);
  await painAxisSlide(d);
  await sufferSlide(d);
  await videoSlide(d);
}

module.exports = { build };
