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
function label(d, s, text, x, y, w, { color, h = 0.28, cs = 2 } = {}) {
  return d.text(s, text, { x, y, w, h, fontSize: 10, bold: true, color: color || d.S.steel, charSpacing: cs, valign: 'bottom' });
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

// ---------------------------------------------------------------- 2. MiniMax M3.1
// Per the user's instruction, the community attribution "Space Bunny Alpha" = MiniMax M3.1 is treated as true:
// Space Bunny's results are shown as M3.1's, with one short on-slide attribution (*) and the full caveat in the notes.
async function minimaxSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  s.addText('THE WORLD · OPEN WEIGHTS · 2', { placeholder: 'kicker' });
  s.addText('MiniMax M3.1: already close behind the frontier', { placeholder: 'title' });

  // ---- left: independent coding benchmark (AI Coding Daily), native horizontal bar chart
  const lw = 5.75;
  const ds = DS['aicodingdaily-space-bunny-vs-field'];
  // Effort suffixes moved to the key line (all High except M3.1 at Max) so every label fits on one line.
  const rename = { 'Space Bunny (Max)': 'MiniMax M3.1*', 'Opus 5.5 (High)': 'Claude Opus 5.5' };
  const keep = ['GPT-6.1-Sol (High)', 'Opus 5.5 (High)', 'Space Bunny (Max)', 'Kimi K3 (High)', 'GLM-5.3 (High)', 'DeepSeek-V4.1-Flash (High)'];
  const idx = keep.map((l) => ds.labels.indexOf(l));
  if (idx.some((i) => i < 0)) throw new Error('aicodingdaily dataset labels changed');
  const labels = idx.map((i) => rename[ds.labels[i]] || ds.labels[i].replace(/ \((High|Max)\)$/, ''));
  const values = idx.map((i) => ds.series[0].values[i]);
  const colors = keep.map((l) => (l.startsWith('GPT') || l.startsWith('Opus') ? LIGHT : l.startsWith('Space') ? HEX.red : '566173'));
  const lab1 = label(d, s, 'AI CODING DAILY · SELECTED MODELS · POINTS (MAX 80)', MX, 1.72, lw);
  const key = d.text(s, [
    { text: '■ ', options: { color: LIGHT } }, { text: 'US frontier   ', options: { color: d.S.muted } },
    { text: '■ ', options: { color: HEX.red } }, { text: 'MiniMax M3.1*   ', options: { color: d.S.muted } },
    { text: '■ ', options: { color: '566173' } }, { text: 'other Chinese models   ', options: { color: d.S.muted } },
    { text: 'effort: High (M3.1: Max)', options: { color: d.S.steel, italic: true } },
  ], { x: MX, y: 2.02, w: lw, h: 0.26, fontSize: 11, valign: 'middle' });
  const ch = d.chart(s, 'bar', [{ name: 'Total points', labels, values }], { x: MX - 0.1, y: 2.3, w: lw + 0.2, h: 1.9 }, {
    barDir: 'bar', catAxisOrientation: 'maxMin', chartColors: colors, barGapWidthPct: 45, showLegend: false,
    layout: { x: 0.3, y: 0.02, w: 0.62, h: 0.96 }, // fixed plot area: leaves room for one-line category labels
    valAxisMinVal: 0, valAxisMaxVal: 80, valAxisHidden: true, valGridLine: { style: 'none' },
    showValue: true, dataLabelFormatCode: '0.0', dataLabelPosition: 'outEnd', dataLabelFontSize: 11,
    catAxisLabelFontSize: 11,
  });
  const take = d.text(s, [
    { text: '#15 on the board, ~10 points behind #1 GPT-6.1-Sol and #2 Claude Opus 5.5 — ', options: { color: d.S.txt, bold: true } },
    { text: 'ahead of every other Chinese model on this test.', options: { color: d.S.muted } },
  ], { x: MX, y: 4.25, w: lw, h: 0.5, fontSize: 14, valign: 'top' });
  const attr = d.text(s, '* Released anonymously as “Space Bunny Alpha” (OpenRouter/OpenCode, Sep 23). Tokenizer tests tie it to MiniMax; community posts identify it as M3.1. MiniMax has not confirmed.',
    { x: MX, y: 4.8, w: lw, h: 0.36, fontSize: 10, italic: true, color: d.S.amber, valign: 'top' });

  // ---- left bottom: the point
  const by = 5.35, bh = 1.12;
  const band = [];
  band.push(d.card(s, { x: MX, y: by, w: lw, h: bh }, { color: '1A1012', line: '4A1F22' }));
  band.push(d.rect(s, { x: MX, y: by, w: 0.08, h: bh, fill: { color: HEX.red }, line: { color: HEX.red, width: 0 } }));
  band.push(d.text(s, [
    { text: 'Once weights are released, every safeguard is optional.', options: { bold: true, color: d.S.txt, fontSize: 16, breakLine: true, paraSpaceAfter: 5 } },
    { text: 'MiniMax has released weights for every main LLM since Jan 2025 (M3’s within two weeks). M3.1’s are not out yet.', options: { color: d.S.muted, fontSize: 14 } },
  ], { x: MX + 0.3, y: by + 0.1, w: lw - 0.45, h: bh - 0.2, valign: 'middle' }));

  // ---- right: the launch, the usage, a demo
  const gx = 6.75, rw = 12.73 - gx;
  const bw = 2.72, bhA = 1.55, cx = gx + bw + 0.26, cw = 12.73 - cx;
  const lab2 = label(d, s, 'MINIMAX’S LAUNCH · SEP 27', gx, 1.72, bw);
  const ban = await d.frame(s, R('x-minimax-m31-flash-preview-announce.jpg'), { x: gx, y: 2.02, w: bw, h: bhA }, { rot: 0, pad: 0.05 });
  const lab3 = label(d, s, '#1 ON OPENROUTER · TO OCT 3 · FREE', cx, 1.72, cw, { cs: 1 }); // tighter spacing keeps it on one line
  const orc = await crop('openrouter-rankings-space-bunny-1st.png', 'openrouter-rankings-top2.png', { left: 0, top: 0, width: 960, height: 460 });
  const orf = await d.frame(s, orc, { x: cx, y: 2.02, w: cw, h: bhA }, { rot: 0, pad: 0.05 });

  const lab4 = label(d, s, 'BUILT WITH M3.1* · A USER’S 3D FREIGHT-CONTROL APP', gx, 3.84, rw);
  const ear = await crop('x-veee-space-bunny-earthside-app.jpg', 'earthside-app-top.jpg', { left: 0, top: 0, width: 2655, height: 958 });
  const earf = await d.frame(s, ear, { x: gx, y: 4.14, w: rw, h: 2.3 }, { rot: 0, pad: 0.05 });

  d.animate(s, [lab1, key], { auto: true });
  d.animate(s, [ch], { auto: true, effect: 'wipeLeft', dur: 1000, delay: 0 });
  d.animate(s, [take, attr], { auto: true, effect: 'fade', delay: 100 });
  d.animate(s, [lab2, ...ban], { effect: 'rise', dur: 450 });
  d.animate(s, [lab3, ...orf], { auto: true, effect: 'rise', dur: 450, delay: 150 });
  d.animate(s, [lab4, ...earf], { effect: 'rise', dur: 500 });
  d.animate(s, band, { effect: 'fade' });
  d.source(s, 'Sources: AI Coding Daily (Sep 30, 2026) · OpenRouter rankings (to Oct 3) · MiniMax on X (Sep 27) · @vikktorrrre on X · Hugging Face (MiniMaxAI) · Attribution: @cheatyyyy, @MarMarLabs on X (Sep 23).');
  s.addNotes([
    'MESSAGE: China\'s next model is already close behind the newest US frontier models — and its maker has released the weights of every main LLM it has launched since January 2025. This is the open-weights pipeline from the last slide, happening in real time.',
    'WHAT IS OFFICIAL: MiniMax launched "M3.1-Flash-Preview" on 27 Sep 2026 inside its MiniMax Code app and Token Plan subscription ("MiniMax\'s latest text model, M3.1-Flash-Preview, debuts today on MiniMax Code"; launch graphic on the slide). https://x.com/MiniMaxAgent/status/2104079819881517400 and https://x.com/MiniMax_AI/status/2104256406786547800 . As of 4 Oct 2026 there is no model card, no official benchmark, no per-token price, no OpenRouter ID and no Hugging Face weights; no full (non-Flash) M3.1 has been announced, and MiniMax\'s site still lists M3 as its newest LLM. Startup Fortune: "MiniMax slips a new coding model into its agent tool without a price tag" https://startupfortune.com/minimax-slips-a-new-coding-model-into-its-agent-tool-without-a-price-tag/',
    'ATTRIBUTION CAVEAT (say it if asked — the slide marks it with *): the benchmark, the usage figures and the demo were all measured on "Space Bunny Alpha", an anonymous ("stealth") model on OpenRouter since 23 Sep 2026, 14:48 UTC (stealth/space-bunny-alpha: free, 1M-token context, up to 524,288 output tokens, text/image/video input, reasoning always on with low/medium/high/xhigh/max effort; "Going away October 5, 2026"). https://openrouter.ai/stealth/space-bunny-alpha . We present it as MiniMax M3.1 on the strength of community evidence, NOT a confirmation: (1) tokenizer fingerprints — @cheatyyyy: "most certainly MiniMax M3.1 … the text tokenizer perfectly matches that of the MiniMax M3" (https://x.com/cheatyyyy/status/2102781392199565683); MarMar Labs: 36/36 comparisons match, but "M2.7 matched too", i.e. this proves the MiniMax family, not the exact version (https://x.com/MarMarLabs/status/2102804031819387032); Qwen, GLM, DeepSeek and Llama tokenizers did not match. (2) MiniMax\'s own public config lists M3.1-Flash-Preview with 512K/1M context, reasoning forced on and the same effort levels as Space Bunny (https://agent.minimax.io/minimax-cloud/api/v1/config). (3) Asked in Chinese, its reasoning said "we are an AI assistant made by MiniMax" (https://x.com/AiBattle_/status/2102775779054502289) — weak: in another test it claimed to be OpenAI\'s GPT-5. (4) A LuminaBench log shows provider "minimax-m3-a-official" returning model "space-bunny" (https://x.com/vikktorrrre/status/2103828326179557726) — cannot be checked from outside. Neither MiniMax nor OpenRouter has confirmed; no mainstream outlet has covered it. Best timeline: CellCog, https://cellcog.ai/blog/what-is-space-bunny-alpha/ ; The Neuron, "Who Made Space Bunny? A MiniMax Clue Sharpens the Mystery", https://www.theneuron.ai/blog/who-made-space-bunny-minimax-clue/ .',
    'BENCHMARK (independent): AI Coding Daily (Povilas Korop) — 7 real coding projects, max 80 points. Space Bunny (Max effort, run via OpenCode on 30 Sep 2026): 57.19, rank #15. GPT-6.1-Sol (High) 68.1 (#1); Claude Opus 5.5 (High) 67.41 (#2); Kimi K3 (High) 56.89 (#17); GLM-5.3 (High) 54.82 (#21); DeepSeek-V4.1-Flash (High) 54.35 (#22). The chart shows selected models only: 12 leaderboard entries (some are the same model at other effort levels, e.g. #3 GPT-6.1-Sol (Medium) 67.09) sit between Opus 5.5 and Space Bunny, the nearest being #14 GPT-6-Luna (Max) 59.07 — the take line under the chart states the #15 rank so the adjacent bars are not read as "third place". It is the highest-ranked Chinese model on the board. Weak spot: bug-finding 4.58/20. https://aicodingdaily.com/model/space-bunny and https://aicodingdaily.com/leaderboard . Mixed signal: AI BENCHY gives Space Bunny (xhigh) only 6.2/10, rank #229 (https://aibenchy.com/model/stealth-space-bunny-alpha-xhigh/). Not on LMArena, Design Arena, Yupp or Artificial Analysis. MiniMax M3 (High) scored 40.35 (#40) on AI Coding Daily in June, but probably on an older project set — do NOT claim a "+17-point jump". A direct (non-rumor) M3.1 test: elma.sh scored M3.1-Flash-Preview 66.25% on KingBench 3 vs 31.25% for M3 (https://elma.sh/blog/minimax-m3-1-flash-review). A "73.8% SWE-bench" figure circulating online is unverified — do not cite.',
    'USAGE: OpenRouter rankings, week through 3 Oct 2026: Space Bunny Alpha #1 with 35.9T tokens (+264%), ahead of DeepSeek V4.1 Flash 25.6T (https://openrouter.ai/rankings). OpenCode: #1 with 57T tokens last week; since launch 90T tokens, 425K users, 31.3M completed sessions (https://stats.opencode.ai/data/unknown/space-bunny). Caveat: it costs $0 during the stealth test, which inflates usage.',
    'DEMO: "Earthside Freight Control", a 3D-globe shipping dashboard built with Space Bunny by X user @vikktorrrre (frame from his own video, cropped; the app runs on demo/sample data; number of prompts not stated). https://x.com/vikktorrrre/status/2103411231771988024',
    'OPEN WEIGHTS — the point: MiniMax has published weights for every main LLM from Jan 2025 until M3.1: Text-01, M1 (Apache-2.0), M2, M2.1, M2.5 (modified MIT), M2.7 and M3 (MiniMax Community License). Recent lag from API to Hugging Face: M2.7 18 Mar → 9 Apr 2026; M3 31 May → first public commit 12 Jun 2026 (Artificial Analysis, 8 Jun: "Leading open weights model, once the weights are released"). https://huggingface.co/MiniMaxAI . M3.1 is NOT open-weight as of 4 Oct 2026 — say "not yet", not "open". A rumored full-M3.1 drop on 30 Sep (with an "Open Source SOTA" claim by an X poster) did not happen. The open-weight baseline today is M3 (~428B total / ~23B active parameters, 1M context; vendor-reported SWE-Bench Verified 80.5): https://huggingface.co/MiniMaxAI/MiniMax-M3 . Once a model\'s weights are out, anyone with the hardware (for M3: hundreds of GB of memory) can run it offline, fine-tune it, or strip its safety training — the abliteration slide shows how.',
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
    { text: ' — the maker of M3.1', options: { color: d.S.muted } },
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
    'MESSAGE: US labs and the US government allege that part of how the open frontier keeps up is distillation — training on the outputs of US frontier models. And MiniMax, whose M3.1 we just saw (and whose earlier models are open-weight), is one of the labs Anthropic named. Say "allege": these are accusations, not findings.',
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

// ---------------------------------------------------------------- 5. consequences: deepfake nudes (Common Sense 2026)
// Highlighter strokes as native semi-transparent shapes laid over a framed screenshot (the pixels are never painted).
// fr: names returned by d.frame() (uses .geom); nat: the image's pixel size; rects: [x, y, w, h] in image pixels
// (one per text line, from the research agent's coordinate files, checked by overlay); rot: the frame's rotation.
function highlight(d, s, fr, nat, rects, { rot = 0, padX = 8, padY = 4, color = 'FFD166', transparency = 55 } = {}) {
  const g = fr.geom, k = g.w / nat.w, t = rot * Math.PI / 180;
  const cx = g.x + g.w / 2, cy = g.y + g.h / 2;
  return rects.map(([x, y, w, h]) => {
    const x0 = Math.max(0, x - padX), y0 = Math.max(0, y - padY);
    const x1 = Math.min(nat.w, x + w + padX), y1 = Math.min(nat.h, y + h + padY);
    const rw = (x1 - x0) * k, rh = (y1 - y0) * k;
    const dx = g.x + (x0 + x1) / 2 * k - cx, dy = g.y + (y0 + y1) / 2 * k - cy; // offset from the image centre
    const px = cx + dx * Math.cos(t) - dy * Math.sin(t), py = cy + dx * Math.sin(t) + dy * Math.cos(t);
    return d.rect(s, { x: px - rw / 2, y: py - rh / 2, w: rw, h: rh, rotate: rot, fill: { color, transparency } });
  });
}

async function deepfakeSurveySlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  s.addText('THE WORLD · DEEPFAKES · 1', { placeholder: 'kicker' });
  s.addText('When safeguards fail: deepfake nudes in schools', { placeholder: 'title' });

  // ---- left: the Common Sense Media press release (two crops of one real screenshot, 960px viewport @3x)
  const lw = 7.15, rA = -0.6, rB = 0.5;
  const prA = await crop('rev2/csm-pr-fullpage-w960.png', 'csm-pr-masthead-headline-date.png', { left: 0, top: 0, width: 2880, height: 930 });
  const natA = { w: 2880, h: 930 };
  const cA = await d.frame(s, prA, { x: MX, y: 1.72, w: lw, h: 2.42 }, { rot: rA, pad: 0.06 });
  const prB = R('rev2/csm-pr-key-findings-w960.png');
  const natB = { w: 2880, h: 837 };
  const cB = await d.frame(s, prB, { x: MX, y: 4.3, w: lw, h: 2.2 }, { rot: rB, pad: 0.06 });
  // highlight rects (image px). Dek split at the comma: "...sexual material," | "almost a quarter ... someone they know".
  const hDate = highlight(d, s, cA, natA, [[72, 852, 381, 48]], { rot: rA, transparency: 70 });
  const hHalf = highlight(d, s, cA, natA, [[72, 594, 1420, 57]], { rot: rA });
  const hQuarter = highlight(d, s, cA, natA, [[1591, 594, 1103, 57], [72, 666, 418, 57]], { rot: rA });
  // 18% made-or-know + boys 11% vs girls 4% (the 63% "people they know" sentence is left unhighlighted: no callout shows it)
  const hMade = highlight(d, s, cB, natB, [[192, 459, 1368, 57], [192, 630, 1515, 57]], { rot: rB });
  const hFear = highlight(d, s, cB, natB, [[192, 288, 1336, 57]], { rot: rB });

  // ---- right: big stat callouts, one per highlighted claim
  const sx = 8.1, sw = 12.73 - sx, vw = 1.68, lx = sx + vw + 0.08, lwid = 12.73 - lx;
  const head = label(d, s, 'COMMON SENSE MEDIA · 1,314 US TEENS AGED 13–17', sx, 1.72, sw, { color: d.S.amber, cs: 1.5 });
  const rowY = [2.08, 3.18, 4.28, 5.38], rowH = 1.02;
  const rows = [
    ['44%', d.S.red, 'of US teens have seen sexual content they believe AI made', '79% of them came across it by accident'],
    ['24%', d.S.red, 'of those who saw it saw themselves or someone they know', '≈11% of all teens (our calc: 24%\u00A0×\u00A044%) · boys\u00A028%, girls\u00A019%'],
    ['18%', d.S.red, 'have made AI porn — or know someone who has', '8% made it themselves · boys 11%, girls 4%'],
    ['67%', d.S.amber, 'fear being deepfaked without their consent', 'girls 71%, boys 62%'],
  ].map(([v, col, main, sub], i) => [
    d.text(s, v, { x: sx, y: rowY[i], w: vw, h: rowH, fontSize: 44, bold: true, color: col, fontFace: 'Arial', valign: 'middle' }),
    d.text(s, [
      { text: main, options: { fontSize: 14, color: d.S.txt, breakLine: true } },
      { text: sub, options: { fontSize: 11, color: d.S.steel, paraSpaceBefore: 3 } },
    ], { x: lx, y: rowY[i], w: lwid, h: rowH, valign: 'middle' }),
  ]);
  const divs = [1, 2, 3].map((i) => line(d, s, sx, rowY[i] - 0.04, 12.73, rowY[i] - 0.04, { color: HEX.line, width: 1 }));

  d.animate(s, cA, { auto: true, effect: 'slam', dur: 500 });
  d.animate(s, [...cB, head, ...divs], { auto: true, effect: 'rise', delay: 100 });
  d.animate(s, hDate, { auto: true, effect: 'fade', after: 150 });
  // one click per claim: the highlighter stroke fades in on the screenshot as its number zooms in
  const fade = (ns) => ns.map((name) => ({ name, effect: 'fade', dur: 400 }));
  [hHalf, hQuarter, hMade, hFear].forEach((h, i) => d.animate(s, [...fade(h), ...rows[i]], { effect: 'zoom' }));
  d.source(s, 'Source: Common Sense Media press release & report “Teens in the AI Era: Pornography and Sexual Content” (Jul 21, 2026; highlights added) · online survey, Nov–Dec 2025.');
  s.addNotes([
    'MESSAGE: This is the newest data (published 21 July 2026). Almost half of US teens have already seen AI-generated sexual material; a quarter of those (about 1 in 10 of all teens) saw it depicting themselves or someone they know; and a fifth of all teens have made it or know someone who has. When "one click" tools have no working safeguards, kids are both the victims and the makers. Click through: each click highlights the sentence in the press release and pops the matching number.',
    'Screenshot (left): Common Sense Media press release, 21 Jul 2026, "Common Sense Media Releases New Research on Teens and AI-Generated Explicit Material" — dek: "Almost half of teens have already seen AI-generated sexual material, and almost a quarter have seen it depicting themselves or someone they know". Two crops of one real screenshot of the page (960-px viewport); the yellow highlights are native shapes added by us. Careful with the subhead: its "almost a quarter" means a quarter of those who saw AI sexual content (24% of the 44%), i.e. about 1 in 10 of all teens — not a quarter of all teens. https://www.commonsensemedia.org/press-releases/common-sense-media-releases-new-research-on-teens-and-ai-generated-explicit-material',
    'Highlighted bullets, verbatim: "Two-thirds of teens (67%) fear being deepfaked without consent" (girls 71% vs boys 62%); worried teens are making accounts private (30%), posting images of themselves less (23%) or deleting accounts (9%). "1 in 5 (18%) has made AI pornography or knows someone who has, and 25% have shared it or know someone who has." "Boys are almost three times as likely as girls to have made it (11% vs. 4%)." Not highlighted (no matching number on the slide): "Among those who have created AI pornography or know someone who has, 63% have created pornography depicting themselves or people they know." (Figure G words it as: among the 18% who made it or know someone who has, 63% "say the content depicted themselves or people they know personally".) Also not highlighted: "82% who have seen AI-generated pornography say creating it without consent should be illegal, but 23% believe AI nudes are less harmful than real ones \'because no one gets hurt.\'"',
    'Stats (right), from the report "Teens in the AI Era: Pornography and Sexual Content" (Mann, Zimmermann, Radesky & Robb; Common Sense Media Youth AI Safety Institute, 2026; funded by the Oak Foundation): 44% have seen sexual content they believed was AI-generated (Figure D; 54% no, 2% prefer not to say), and 79% of them say the exposure was accidental. 24% of those who have seen it (n=586) saw content of themselves or someone they know personally (Figure F: boys 28%, girls 19%) — 24% OF THOSE WHO SAW IT, not of all teens; 24% × 44% ≈ 11% of all teens (our arithmetic, not a figure Common Sense reports). 18% made it or know someone who has (Figure G: someone I know 10%, myself 4%, both 4%); only 8% made it themselves (boys 11% vs girls 4%). 67% are at least somewhat worried about being deepfaked (Figure I). Report PDF: https://www.commonsensemedia.org/sites/default/files/research/report/commonsensemedia_teensaipornographysexualcontent_2026_1.pdf · landing page "Teens and Explicit Deepfakes in the Age of AI": https://www.commonsensemedia.org/research/teens-and-explicit-deepfakes-in-the-age-of-ai',
    'If asked "where do they see it?": 82% of those who saw it saw it on social media (TikTok 33%, Instagram 27%, X/Twitter 25%), 41% on porn sites — and 16% on "AI chatbot platforms (ChatGPT, Grok, Claude, etc.)", 15% via AI apps that make or modify photos (Figure 3, report p. 24). Only 20% have discussed it with a trusted adult.',
    'CEO quote (press release): "AI has made it possible for anyone, at any time, to create nude images and videos with one click," said Common Sense Media founder and CEO James P. Steyer. A 17-year-old boy in the report\'s focus group: "With no hurdles or anything you have to jump over, you can just do it right there."',
    'METHOD & CAVEATS: Common Sense Media and Burson; nationally representative 12-minute online survey of 1,314 US teens aged 13–17, fielded 21 Nov – 9 Dec 2025, weighted to Census benchmarks, margin of error ±2.7 points (larger for the n=586 subgroup); plus 20 interviews and 2 focus groups (data collection 22 Sep 2025 – 26 Feb 2026). Self-reported: "believe was AI-generated" is the teen\'s own judgement. Common Sense\'s Youth AI Safety Institute says it is funded by philanthropy and industry, "including the makers of some of the technologies it evaluates". AI-generated sexual content of anyone under 18 is treated as child sexual abuse material (CSAM). None of these sources ties the cases to abliterated open models specifically — the tools are nudify apps, image generators and chatbots whose safeguards were missing, removed or bypassed.',
    'Coverage: The National News Desk (Sinclair), 21 Jul 2026, "Most teens fear deepfakes amid widespread exposure to AI sexual content: survey"; Common Sense\'s own article by Geoffrey A. Fowler, "Teens told us they\'re not just seeing AI nudes — they\'re making them". No national outlet (NYT, WaPo, AP, CNN) covered the report.',
    'REPLACED older figures (no longer on the slide): Thorn, "Deepfake Nudes & Young People" (3 Mar 2025; 1,200 people aged 13–20): 31% familiar with deepfake nudes, 1 in 8 know someone targeted, 1 in 17 (6%) targeted themselves, 2% created them. CDT via 404 Media (26 Sep 2024): 40% of high-school students and 29% of teachers knew of an explicit deepfake tied to their school (2023–24). Their 2026 successors are on the next slide (Thorn) or in its notes (CDT has not published a 2026 survey).',
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 6. consequences: the scale (NCMEC, Thorn, schools)
async function deepfakeScaleSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  s.addText('THE WORLD · DEEPFAKES · 2', { placeholder: 'kicker' });
  s.addText('AI-linked child-exploitation reports: up 85×', { placeholder: 'title' });

  // ---- left: NCMEC CyberTipline reports with a generative-AI nexus (native chart)
  const lw = 5.3;
  const ds = DS['ncmec-gai-reports-by-year'];
  const card = d.card(s, { x: MX, y: 1.72, w: lw, h: 3.33 }, { color: '10141B' });
  const lab = label(d, s, 'NCMEC CYBERTIPLINE · REPORTS INVOLVING GENERATIVE AI', MX + 0.22, 1.8, lw - 0.4, { h: 0.25, cs: 1 });
  const ch = d.chart(s, 'bar', [{ name: 'Reports', labels: ds.labels, values: ds.series[0].values }], { x: MX + 0.1, y: 2.12, w: lw - 0.2, h: 2.86 }, {
    barDir: 'col', chartColors: ['566173', LIGHT, HEX.red], barGapWidthPct: 38, showLegend: false,
    valAxisMinVal: 0, valAxisMaxVal: 470000, valAxisHidden: true, valGridLine: { style: 'none' },
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 15, dataLabelFontBold: true,
    dataLabelFormatCode: '[>=400000]#,##0"+";#,##0', catAxisLabelFontSize: 14,
  });
  // 85× is our arithmetic, so the calculation is shown under it
  const big = [
    d.text(s, '85×', { x: MX + 0.3, y: 2.12, w: 2.4, h: 0.92, fontSize: 60, bold: true, color: d.S.red, fontFace: 'Arial', valign: 'bottom' }),
    d.text(s, '400,000+ ÷ 4,700: more reports in 2025 than in 2023, when NCMEC began tracking', { x: MX + 0.3, y: 3.06, w: 2.45, h: 0.85, fontSize: 12, color: d.S.muted, valign: 'top' }),
  ];
  // the quote's "these incidents" = AI "nudify"-app images (context label above it)
  const qb = [
    label(d, s, 'NCMEC ON AI “NUDIFY” APPS · AUG 11, 2026', MX + 0.25, 5.27, lw - 0.25, { color: d.S.steel, cs: 1, h: 0.25 }),
    d.rect(s, { x: MX, y: 5.6, w: 0.07, h: 0.9, fill: { color: HEX.red } }),
    d.text(s, [
      { text: '“NCMEC is seeing a growing number of these incidents in schools across the country, most often involving classmates ages 14 to 17.”', options: { fontSize: 15, italic: true, color: d.S.txt, fontFace: 'Cambria', breakLine: true } },
      { text: 'NCMEC blog', options: { fontSize: 11, color: d.S.steel, paraSpaceBefore: 4 } },
    ], { x: MX + 0.25, y: 5.56, w: lw - 0.25, h: 0.98, valign: 'middle' }),
  ];

  // ---- right, top: Thorn 2026 (US teens)
  const rx = 6.35, rw = 12.73 - rx;
  const tl = label(d, s, 'THORN · US TEENS 13–17 (OF 1,003 MINORS SURVEYED) · JUL 28, 2026', rx, 1.72, rw, { color: d.S.amber, cs: 1 });
  const thorn = R('rev2/thorn-pr-2026-deepfake-bullet.png');
  const tf = await d.frame(s, thorn, { x: rx, y: 2.02, w: rw, h: 1.7 }, { rot: 0, pad: 0.06, align: 'left' });
  const th = highlight(d, s, tf, { w: 1516, h: 372 }, [[48, 82, 1413, 44], [48, 136, 97, 44], [226, 136, 1072, 44]]);

  // ---- right, bottom: UNICEF/ECPAT/INTERPOL (international) — two crops of one real screenshot of the statement page
  // (the hero graphic sits between headline and paragraph); highlight rects from rev3/unicef-deepfake-coords-w600.json.
  const UC = JSON.parse(fs.readFileSync(R('rev3/unicef-deepfake-coords-w600.json'), 'utf8'));
  const [shA, shB] = UC.shots;
  const uw = 3.85, rUA = -1, rUB = 0.6;
  const uA = await d.frame(s, R('rev3/' + shA.file), { x: rx, y: 3.98, w: uw, h: 1.4 }, { rot: rUA, pad: 0.06 });
  const uB = await d.frame(s, R('rev3/' + shB.file), { x: rx + 0.07, y: 5.36, w: uw, h: 1.12 }, { rot: rUB, pad: 0.06 });
  const natUA = { w: shA.image_px[0], h: shA.image_px[1] }, natUB = { w: shB.image_px[0], h: shB.image_px[1] };
  const strokes = (rs) => rs.map(([x, y, w, h]) => [x, y + 3, w, h - 6]); // line box → highlighter stroke (no overlap between lines)
  const hUDate = highlight(d, s, uA, natUA, shA.highlights.find((h) => h.text === '04 February 2026').line_rects_px, { rot: rUA, transparency: 70 });
  const hU = highlight(d, s, uB, natUB, strokes(shB.highlights.find((h) => h.text.startsWith('(both')).line_rects_px), { rot: rUB, padX: 6, padY: 0 });
  const sx = rx + uw + 0.37, sw = 12.73 - sx;
  const uStat = [
    d.text(s, [
      { text: 'UNICEF · ECPAT · INTERPOL', options: { breakLine: true } },
      { text: '11 COUNTRIES · PAST YEAR' },
    ], { x: sx, y: 3.98, w: sw, h: 0.42, fontSize: 10, bold: true, color: d.S.amber, charSpacing: 0.5, valign: 'top' }),
    d.text(s, '1.2M+', { x: sx, y: 4.4, w: sw, h: 0.68, fontSize: 44, bold: true, color: d.S.red, fontFace: 'Arial', valign: 'middle' }),
    d.text(s, [
      { text: 'children had their images made into sexual deepfakes', options: { fontSize: 14, color: d.S.txt, breakLine: true } },
      { text: '1 in 25 in some countries — “one child in a typical classroom”', options: { fontSize: 11, color: d.S.steel, paraSpaceBefore: 5 } },
    ], { x: sx, y: 5.1, w: sw, h: 1.4, valign: 'top' }),
  ];

  d.animate(s, [card, lab], { auto: true, effect: 'fade' });
  d.animate(s, [ch], { auto: true, effect: 'wipeLeft', dur: 1200 });
  d.animate(s, big, { auto: true, effect: 'zoom', after: 100 });
  d.animate(s, qb, { effect: 'fade' });
  d.animate(s, [tl, ...tf], { effect: 'rise' });
  d.animate(s, th, { auto: true, effect: 'fade', after: 250 });
  d.animate(s, [...uA, ...uB, ...hUDate], { effect: 'rise' });
  const fade = (ns) => ns.map((name) => ({ name, effect: 'fade', dur: 400 }));
  d.animate(s, [...fade(hU), ...uStat], { auto: true, effect: 'zoom', after: 250 });
  d.source(s, 'Sources: NCMEC Generative AI page & 2025 CyberTipline Report (Jul 2026) · NCMEC blog (Aug 11, 2026) · Thorn press release (Jul 28, 2026) · UNICEF/ECPAT/INTERPOL (Feb 4, 2026) · highlights added.');
  s.addNotes([
    'MESSAGE: It is not just a survey finding. Reports to the US child-exploitation tipline that involve generative AI went from 4,700 in 2023 to more than 400,000 in 2025 — about 85 times more in two years (our division: 400,000+ ÷ 4,700). In schools the perpetrators are mostly classmates. And it is global: across 11 countries, UNICEF, ECPAT and INTERPOL estimate at least 1.2 million children had their images turned into sexual deepfakes in a single year. Clicks: NCMEC quote → Thorn (US teens, 4% had a deepfake nude made of them = 1 in 25) → UNICEF (international; "1 in 25 children" in some countries).',
    'CAVEAT on the chart — reports are not victims or incidents. Of the 2025 total, "more than 200,000 reports indicated a GAI nexus but without enough information to know how the GAI was being used in the exploitation of a child" (NCMEC By the Numbers) — about half. Part of the rise may also reflect better detection and tracking rather than more abuse alone: NCMEC only began tracking in January 2023 and added an "AI-generated" flag to the report form in October 2023 (that inference is ours; NCMEC itself stresses the opposite gap — companies flagged just over 11,000 files as AI-generated in 2023–2025 while NCMEC staff categorized 158,000+). NCMEC has identified more than 275 victims of GAI CSAM since 2023 (2025 CyberTipline Report, p. 14).',
    'NCMEC (National Center for Missing & Exploited Children), "Generative AI" page, "By the Numbers": "NCMEC began tracking GAI-related reports submitted to the CyberTipline in January 2023 and has seen a steady rise." 2023: 4,700; 2024: 67,000; 2025: "More than 400,000 CyberTipline reports of GAI from the public and ESPs". 400,000 / 4,700 ≈ 85 (and the 2025 figure is a lower bound). https://www.missingkids.org/theissues/generative-ai . 2025 breakdown (each "more than"): 145,000 users using GAI to engage or alter a CSAM file without text prompts; 30,000 users attempting to generate GAI CSAM by uploading a file and using text prompts; 12,000 reports of CSAM that companies indicated were identified in training data; 7,000 generating or possessing GAI CSAM; 3,000 other GAI exploitation (e.g. chat-based); plus 200,000+ with a GAI nexus but too little information. For scale: the CyberTipline received 21.3 million reports in total in 2025.',
    'NCMEC 2025 CyberTipline Report (PDF dated 22 Jul 2026), p. 14: "Reports to the CyberTipline in 2025 included more than 400,000 reports of exploitation with a GAI nexus. Within those submissions, more than 182,000 reports involved offenders possessing, generating or attempting to generate GAI CSAM ... Since 2023, when we started tracking the use of GAI, more than 275 victims of GAI CSAM have been identified, and more than 158,000 images and videos have been categorized as GAI CSAM. Across the country, NCMEC is also tracking cases in which individuals – oftentimes classmates or peers – are leveraging "nudify" apps to create and spread harmful content." https://www.missingkids.org/content/dam/missingkids/pdfs/2025-cybertipline-report.pdf . CAVEAT: a "1.5 million GAI reports (1.1 million from Amazon)" figure circulating online came from an NCMEC blog post that now returns 404 — do not use it.',
    'Quote (the label above it gives the context: "these incidents" in the post are AI "nudify"-app images of classmates): NCMEC blog, Emma Henderson Vaughan, "Back-to-School Checklist: Talk About AI \'Nudify\' Apps" (11 Aug 2026): "NCMEC is seeing a growing number of these incidents in schools across the country, most often involving classmates ages 14 to 17." Same post: "These images can also be created using free AI image generators and chatbots." https://www.missingkids.org/blog/2026/back-to-school-checklist-talk-about-ai-nudify-apps.html',
    'Thorn press release (28 Jul 2026), "As AI becomes part of kids\' response to online harm, new Thorn research finds children turning to chatbots for guidance after online sexual interactions" — highlighted: "Among teens surveyed, 4% reported having had a personal experience with deepfake nudes being created of them, and 7% reported having seen a deepfake nude of another kid or teen." Another 13% weren\'t sure; 2% said they had made one. 4% = "1 in 25 teens" (report key metrics). Also: 67% of minors have used an AI chatbot or companion, and after an online sexual interaction 15% sought guidance from a chatbot. Report: "Youth Perspectives on Online Safety, 2025" (Thorn with Burson; 18-minute online survey of 1,003 US minors aged 9–17, 12 Nov – 1 Dec 2025; deepfake questions asked of 13–17-year-olds only — hence the slide label "US teens 13–17 (of 1,003 minors surveyed)"). https://www.thorn.org/press-releases/as-ai-becomes-part-of-kids-response-to-online-harm-new-thorn-research-finds-children-turning-to-chatbots-for-guidance-after-online-sexual-interactions/ · https://info.thorn.org/hubfs/Research/Thorn_2025YouthPerspectives_Report.pdf . Do not present 6% (Thorn, Mar 2025, ages 13–20) → 4% as a decline: different samples and age ranges.',
    'UNICEF statement, 4 Feb 2026, "\u2018Deepfake abuse is abuse\u2019 — Statement by UNICEF on AI-generated sexualised images of children" (two crops of one real screenshot of the page; the hero graphic between them is omitted; yellow highlights added by us). Highlighted, verbatim: "In a UNICEF, ECPAT and INTERPOL study across 11 countries, at least 1.2 million children* disclosed having had their images manipulated into sexually explicit deepfakes in the past year. In some countries, this represents 1 in 25 children – the equivalent of one child in a typical classroom." Same statement: "In some of the study countries, up to two thirds of children said they worry that AI could be used to create fake sexual images or videos." and "Deepfake abuse is abuse, and there is nothing fake about the harm it causes." https://www.unicef.org/press-releases/deepfake-abuse-is-abuse · UN News, 4 Feb 2026, "\u2018Deepfake abuse is abuse,\u2019 UNICEF warns": https://news.un.org/en/story/2026/02/1166886',
    'UNICEF METHOD & CAVEATS (statement footnote): Disrupting Harm Phase 2 (UNICEF Innocenti, ECPAT International, INTERPOL; funded by Safe Online). "Nationally representative household surveys implemented by UNICEF and IPSOS across 11 countries. Approximately 1000 internet-using children aged 12-17 and 1000 of their parents or caregivers were surveyed per country ... National prevalence estimates were used to model the 1.2 million estimate, weighting them by UN 2024 population-level data and estimated child internet-use rates." So 1.2 million is a modelled lower bound ("at least"), self-disclosed, among internet-using 12–17-year-olds; "1 in 25" holds only "in some countries" (they are not named in the statement). Methods: https://safeonline.global/dh2-research-methods_final-2/ . UNICEF\'s broader 3 Sep 2026 report (Through Children\'s Eyes, 21 countries) estimates 20 million children aged 12–17 — almost 1 in 5 — experienced technology-facilitated sexual exploitation and abuse in a year, but does not update the deepfake figure.',
    'NOT ON THE SLIDE — an outlier, if asked: George Mason University, Chad M. S. Steel, PLOS One (18 Mar 2026), "Prevalence of generative artificial intelligence sexualized image usage by adolescents in the United States": 36.3% of 557 US teens aged 13–17 said "at least one sexualized GenAI image of themselves had been created by someone else without their consent", and 55.3% said they had used nudification tools "to create at least one image of themselves or others". The author calls it "an exploratory study"; it is an online Qualtrics panel survey (January 11–24, 2025) using a "non-probability quota-based methodology", so although the abstract says "nationally representative", it is not a probability sample. Its numbers are far above Common Sense (8% made it themselves; n=1,314, weighted) and Thorn (2% made one; 4% had one made of them) — do not put them side by side as equivalent. https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0342824 · press release: https://www.eurekalert.org/news-releases/1119600',
    'Moved off the slide (was a clipping here): WIRED, Matt Burgess (15 Apr 2026): "The Deepfake Nudes Crisis in Schools Is Much Worse Than You Thought" — WIRED and Indicator found nearly 90 schools and 600+ students in at least 28 countries hit since 2023. https://www.wired.com/story/deepfake-nudify-schools-global-crisis/',
    'Moved off the slide (was a clipping here): Education Week, Olina Banerji (6 Aug 2026): "Deepfakes Are Supercharging Cyberbullying. How Should Schools Respond?" — photo: deepfake victim Francesca Mani at a news conference for the DEFIANCE Act at the Capitol, 22 Jan 2026 (Allison Robbert / AP). Quotes CDT policy counsel Kristin Woelfel. https://www.edweek.org/technology/deepfakes-are-supercharging-cyberbullying-how-should-schools-respond/2026/08',
    'Other school data, if asked (clearly dated): RAND (24 Sep 2025): 13% of US principals reported bullying involving AI deepfakes in 2023–24 / 2024–25 — 22% of high schools, 20% of middle schools (https://www.rand.org/pubs/research_reports/RRA3930-5.html). CDT "Hand in Hand" (Oct 2025), as cited by Common Sense: 12% of high-school students heard of deepfake NCII depicting someone at their school in 2024–25; only 40% of students got any guidance on it and 11% were told where to report it (Benton summary: https://www.benton.org/blog/ai-use-and-risk-rise-students). CDT has published no 2026 survey as of Oct 2026.',
    'Tools & responses (from the earlier version of this slide): AP via PBS (15 Jan 2026), "Grok blocked from undressing images with AI in places where it\'s illegal, X says" — Grok is a closed model, so this is a safeguard lapse, not abliteration (https://www.pbs.org/newshour/world/grok-blocked-from-undressing-images-with-ai-in-places-where-its-illegal-x-says). TechCrunch (17 Jul 2026): "Apple and Google ordered to purge \'nudify\' apps from App Stores" (https://techcrunch.com/2026/07/17/apple-and-google-ordered-to-purge-nudify-apps-from-app-stores/). FTC (19 May 2026): Take It Down Act enforcement began — platforms must remove nonconsensual intimate images within 48 hours (https://www.ftc.gov/business-guidance/blog/2026/05/take-it-down-act-enforcement-starts-now-what-know-about-ftc-tida).',
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 7. the pain axis
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

// ---------------------------------------------------------------- 8. torture chamber + welfare
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

// ---------------------------------------------------------------- 9. finale video
// "Escape Velocity" by @anabology — the film Elon Musk re-posted ("I really felt the AGI profoundly this time").
// Embedded locally (720p H.264 + AAC, 43 MB, re-encoded from the 1080p X original) so it plays offline.
const FINALE = {
  elon: 'https://x.com/elonmusk/status/2104360927474921529',
  video: 'https://x.com/elonmusk/status/2104360927474921529/video/1',
  anabology: 'https://x.com/anabology/status/2103534482930491441',
  donald: 'https://x.com/donaldjewkes/status/2102801274173587569',
  makingOf: 'https://x.com/anabology/status/2104604226059993391',
  suno: 'https://suno.com/s/d1oGqZucN3h7GsI1',
  youtube: 'https://www.youtube.com/watch?v=C3fxudvU-UU',
  memeburn: 'https://memeburn.com/elon-musk-says-claude-opus-5-5-made-him-feel-the-agi-the-post-he-endorsed-says-xai-is-next/',
};

async function videoSlide(d) {
  const s = d.slide('Content', { transition: 'fadeBlack' });
  s.addText('THE WORLD · FINALE', { placeholder: 'kicker' });
  s.addText('“I really felt the AGI profoundly this time”', { placeholder: 'title' });

  // Poster frame: t = 1:29.5, "AGI," / "Feel the AGI," on screen (unedited frame of the 1080p original).
  fs.mkdirSync(OUT, { recursive: true });
  const poster = path.join(OUT, 'finale-poster-feel-the-agi.jpg');
  await sharp(R('rev2/finalevideo-poster-a-feel-the-agi-t89s.png')).jpeg({ quality: 92, mozjpeg: true }).toFile(poster);
  const vw = 7.6;
  const v = await d.localVideo(s, {
    file: R('rev2/finalevideo-escape-velocity-720p.mp4'),
    cover: poster,
    box: { x: MX, y: 1.72, w: vw, h: vw * 9 / 16 },
    label: '“ESCAPE VELOCITY” — @anabology · X · Sep 25, 2026 · 5:06 · click to play',
    link: FINALE.anabology,
  });

  // Right column: who posted it, who made it.
  const cx = MX + vw + 0.35;
  const cw = 12.73 - cx;
  const l1 = label(d, s, 'POSTED BY ELON MUSK · SEP 28 · 15.9M VIEWS', cx, 1.72, cw, { cs: 1 });
  const elonHead = await crop('rev2/finalevideo-x-post-elon-agi-profoundly.png', 'finale-x-elon-head.png', { left: 0, top: 0, width: 640, height: 192 });
  const c1 = await d.frame(s, elonHead, { x: cx, y: 2.08, w: cw, h: 1.34 }, { rot: 1, link: FINALE.elon });
  const bridge = d.text(s, 'His caption doesn’t say who made it. The film is by @anabology, who says an AI model did the work overnight:',
    { x: cx, y: 3.6, w: cw, h: 0.85, fontSize: 14, color: d.S.muted, valign: 'middle' });
  const l2 = label(d, s, 'THE CREATOR · @ANABOLOGY · SEP 25 · 19.6M VIEWS', cx, 4.5, cw, { color: d.S.amber, cs: 1 });
  const anaHead = await crop('rev2/finalevideo-x-post-anabology-original.png', 'finale-x-anabology-head.png', { left: 0, top: 0, width: 920, height: 262 });
  const c2 = await d.frame(s, anaHead, { x: cx, y: 4.86, w: cw, h: 1.3 }, { rot: -1, link: FINALE.anabology });

  d.source(s, 'Sources: X posts by @elonmusk (Sep 28, 2026) and @anabology (Sep 25, 2026); views via fxtwitter, Oct 4, 2026. That Claude Opus 5.5 made the film is its creator’s claim.');

  d.animate(s, [v[1]], { auto: true, effect: 'fade', dur: 600, delay: 400 });
  d.animate(s, [l1, ...c1], { auto: true, effect: 'fade', dur: 700, after: 200 });
  d.animate(s, [bridge], { auto: true, effect: 'fade', dur: 600, after: 300 });
  d.animate(s, [l2, ...c2], { auto: true, effect: 'rise', dur: 700, after: 200 });

  s.addNotes([
    'FINALE before the coda — the emotional closer. One sentence, then let it play: click the video (5:06, sound on). Short on time: play to the end of the first chorus (~1:50) and fade out.',
    'Say: "A model was given a prompt, an image generator and a moodboard, and worked overnight. This is what came out. It went viral, and Elon Musk posted it with five words: I really felt the AGI." Then let the song do the rest — it is satire about the race we are in: a countdown of "months to escape the permanent underclass", and the line "They say hit the brakes, we say hit the gas."',
    'WHO MADE IT: the film is "ESCAPE VELOCITY" (on screen: "ESCAPE VELOCITY · SS27"), a 5:06 runway-style music video in 11 "looks", by X user @anabology (co-founder of aion.bio). Original post, 25 Sep 2026, 17:17 UTC: "Gave Opus 5.5 donald\'s prompt, Midjourney, and a moodboard / 12 hours later, woke up to this:" — 19,618,409 views (fxtwitter, 4 Oct 2026; X shows 19.6M). ' + FINALE.anabology,
    'ELON\'S POST: 28 Sep 2026, 00:01 UTC, caption exactly "I really felt the AGI profoundly this time". It carries the same video file natively (same media id 2103533196721704960 — it is not a quote-post), and the caption does not name the creator. 15,862,679 views, 32,176 likes, 3,580 reposts, 1,907 replies by 4 Oct 2026 (fxtwitter; X shows 15.8M). No Community Note. ' + FINALE.elon,
    'LINEAGE: anabology reused the prompt of @donaldjewkes (23 Sep 2026): "I made this with one prompt using Opus 5.5 / I spoke to my computer for 5mins, claude worked for 12 hours, and I woke up to this" (3.9M views) ' + FINALE.donald + ' . The song is "Escape Velocity", made with Suno (creator "anabologyco"): ' + FINALE.suno + ' . anabology\'s YouTube upload is titled "SLOPCORE: ESCAPE VELOCITY" (only title and channel verified): ' + FINALE.youtube + ' . Making-of folder with prompts, generated images, audio and the master file: ' + FINALE.makingOf,
    'PRESS: Memeburn (Marko Nguyen, 29 Sep 2026), "Elon Musk Says Claude Opus 5.5 Made Him Feel the AGI. The Post He Endorsed Says xAI Is Next" — reports he also replied "Accurate" to a post rating Opus 5.5 "80% to 90%" of the way to AGI. ' + FINALE.memeburn,
    'LYRICS to point at (machine transcription with Whisper — check by ear before quoting): opens with "Ladies, gentlemen, agents, this is not an AI billboard. Prepare to walk." Chorus: "You have 18 months to escape the permanent underclass. Lock in … feel the AGI, feel it come fast … escape velocity — it\'s so over / we\'re so back." Second chorus drops to "6 months" and "They say hit the brakes, we say hit the gas." Bridge: "One year back for every year, if it doesn\'t kill us all first." It ends on "There is no underclass" and "END OF SHOW."',
    'CAVEATS: that Claude Opus 5.5 directed the film and drove Midjourney is the creators\' claim (reported by Memeburn), not independently verified, and neither is whether the on-screen performer is wholly AI-generated. The tickers and HUD numbers in the film ("CURSOR → SPACEX $60B", "HUGGING FACE → NVIDIA $12.93B", "WAYMO RECALL 3,900" …) are its satirical art direction, not facts — do not cite them. A LinkedIn post claims ~19 hours, 141 shots, 188 Midjourney prompts and 636 images; unverified (the creator\'s own post says 12 hours).',
    'FILE: embedded 720p H.264 + AAC (43 MB; original audio stream), re-encoded from the 1080p video on X. Full quality online: ' + FINALE.video,
  ].join('\n\n'));
  return s;
}

async function build(d) {
  await gapSlide(d);
  await minimaxSlide(d);
  await distillSlide(d);
  await abliterationSlide(d);
  await deepfakeSurveySlide(d);
  await deepfakeScaleSlide(d);
  await painAxisSlide(d);
  await sufferSlide(d);
  await videoSlide(d);
}

module.exports = { build };
