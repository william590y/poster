// THE ACCELERATION · capabilities: METR horizon, benchmark graveyard, HLE, creative work, video, mathematics in crisis.
// Sources: assets/research/capabilities/manifest.json (verified items, datasets, facts),
//          assets/research/openweights/manifest.json (video item), user originals image4.png / image5.png.
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { HEX, MX, A, imgSize, fit } = require('./lib');

const R = (f) => A('research', 'capabilities', f);
const OW = (f) => A('research', 'openweights', f);
const ORIG = (f) => A('original', f);
const OUT = A('slides', 'capabilities');
const MAN = JSON.parse(fs.readFileSync(R('manifest.json'), 'utf8'));
const DS = Object.fromEntries(MAN.datasets.map((x) => [x.id, x]));
const LIGHT = 'C9D1D9';
const CW = 12.13; // content width
const KICK = 'THE ACCELERATION';

// ---------------------------------------------------------------- helpers
async function crop(src, name, { l, t, w, h }) {
  fs.mkdirSync(OUT, { recursive: true });
  const out = path.join(OUT, name);
  await sharp(src).extract({ left: l, top: t, width: w, height: h }).toFile(out);
  return out;
}

// Transparent-to-dark gradient PNG (darkest top-left), used as an overlay above a full-bleed photo.
async function scrim(name, wpx, hpx, { max = 0.62 } = {}) {
  fs.mkdirSync(OUT, { recursive: true });
  const out = path.join(OUT, name);
  const buf = Buffer.alloc(wpx * hpx * 4);
  for (let y = 0; y < hpx; y++) {
    for (let x = 0; x < wpx; x++) {
      const a = max * Math.pow(1 - y / hpx, 1.4) * (1 - 0.5 * x / wpx);
      const i = (y * wpx + x) * 4;
      buf[i] = 10; buf[i + 1] = 12; buf[i + 2] = 16; buf[i + 3] = Math.round(a * 255);
    }
  }
  await sharp(buf, { raw: { width: wpx, height: hpx, channels: 4 } }).png().toFile(out);
  return out;
}

function label(d, s, text, x, y, w, { color, h = 0.28, align = 'left' } = {}) {
  return d.text(s, text, { x, y, w, h, fontSize: 10, bold: true, color: color || d.S.steel, charSpacing: 2, valign: 'bottom', align });
}

function line(d, s, x1, y1, x2, y2, { color = HEX.text, width = 2, dash = 'solid', arrow = false } = {}) {
  const n = d.name('ln');
  s.addShape(d.pres.shapes.LINE, {
    x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.max(Math.abs(x2 - x1), 0.001), h: Math.max(Math.abs(y2 - y1), 0.001),
    flipH: x2 < x1, flipV: y2 < y1,
    line: { color, width, dashType: dash, endArrowType: arrow ? 'triangle' : undefined }, objectName: n,
  });
  return n;
}

// Small dark chip with white caps text, laid over a photo/figure.
function chip(d, s, text, x, y, w, { h = 0.3, color = 'FFFFFF', fill = '0A0C10', transparency = 18, fontSize = 10, charSpacing = 1 } = {}) {
  const b = d.name('chip');
  s.addShape(d.pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: fill, transparency }, line: { color: fill, width: 0, transparency: 100 }, objectName: b });
  const t = d.text(s, text, { x: x + 0.1, y, w: w - 0.2, h, fontSize, bold: true, color, charSpacing, valign: 'middle' });
  return [b, t];
}

// Outlet tab pinned to a (rotated) clipping: sits just outside the given edge, overlapping only the white frame border.
// g = image geometry from d.frame (frame = g grown by pad); corner: 'tl' | 'tr' | 'bl' | 'br'.
function outletTab(d, s, g, text, corner, rot = 0, { pad = 0.06, h = 0.24, inset = 0.14 } = {}) {
  const w = text.length * 0.083 + 0.24;
  const FW = g.w + 2 * pad, FH = g.h + 2 * pad;
  const cx = g.x + g.w / 2, cy = g.y + g.h / 2;
  const lx = corner[1] === 'r' ? FW / 2 - inset - w / 2 : -FW / 2 + inset + w / 2;
  const ly = corner[0] === 't' ? -FH / 2 - h / 2 + pad : FH / 2 + h / 2 - pad;
  const th = rot * Math.PI / 180;
  const px = cx + lx * Math.cos(th) - ly * Math.sin(th), py = cy + lx * Math.sin(th) + ly * Math.cos(th);
  const box = { x: px - w / 2, y: py - h / 2, w, h };
  const b = d.name('tab');
  s.addShape(d.pres.shapes.RECTANGLE, { ...box, rotate: rot, fill: { color: '2F3644' }, line: { color: '2F3644', width: 0 }, objectName: b });
  const t = d.text(s, text, { ...box, rotate: rot, fontSize: 10, bold: true, color: 'FFFFFF', charSpacing: 1, align: 'center', valign: 'middle' });
  return [b, t];
}

// The user's 2×2 heron image (assets/original/image4.png) without the tiny caption strip under each drawing:
// [left, top, width, height] of each drawing in the source, then its [x, y] in the recomposed grid (same 5-px grey gutters).
const HERON_TILES = [[5, 5, 516, 387, 5, 5], [526, 5, 516, 387, 526, 5], [5, 441, 516, 386, 5, 397], [526, 441, 516, 386, 526, 397]];
async function heronGrid() {
  fs.mkdirSync(OUT, { recursive: true });
  const out = path.join(OUT, 'heron-grid.png');
  const src = ORIG('image4.png');
  const tiles = await Promise.all(HERON_TILES.map(async ([l, t, w, h, x, y]) => ({ input: await sharp(src).extract({ left: l, top: t, width: w, height: h }).toBuffer(), left: x, top: y })));
  await sharp({ create: { width: 1047, height: 788, channels: 3, background: { r: 231, g: 231, b: 231 } } }).composite(tiles).png().toFile(out);
  return out;
}

const decYear = (iso) => {
  const [y, m, dd] = iso.split('-').map(Number);
  const start = Date.UTC(y, 0, 1), end = Date.UTC(y + 1, 0, 1);
  return y + (Date.UTC(y, m - 1, dd) - start) / (end - start);
};

// Running best of a dataset series at each quarter end ('YYYY-Qn' list) — null before the first data point.
function quarterBest(ds, quarters, si = 0) {
  return quarters.map(([yr, q]) => {
    const end = `${yr}-${String(q * 3).padStart(2, '0')}-31`;
    let best = null;
    ds.labels.forEach((lab, i) => {
      const v = ds.series[si].values[i];
      if (lab <= end && v !== null && v !== undefined) best = best === null ? v : Math.max(best, v);
    });
    return best;
  });
}
function quarters(from, to) { // [y,q] inclusive
  const out = [];
  let [y, q] = from;
  while (y < to[0] || (y === to[0] && q <= to[1])) { out.push([y, q]); q += 1; if (q > 4) { q = 1; y += 1; } }
  return out;
}

// ---------------------------------------------------------------- 1. METR time horizon
// Precise p50 values from METR's benchmark_results_1_1.yaml (the manifest dataset's source; manifest rounds to 0.1 min).
const METR = [
  ['GPT-2', '2019-02-14', 0.054, true], ['GPT-3', '2020-05-28', 0.144, true], ['GPT-3.5', '2022-03-15', 0.599, true],
  ['GPT-4', '2023-03-14', 3.987, true], ['GPT-4 (Nov 2023)', '2023-11-06', 4.045, true], ['Claude 3 Opus', '2024-03-04', 3.952, false],
  ['GPT-4 Turbo', '2024-04-09', 3.733, false], ['GPT-4o', '2024-05-13', 6.991, true], ['Claude 3.5 Sonnet (Jun)', '2024-06-20', 11.395, true],
  ['o1-preview', '2024-09-12', 20.327, true], ['Claude 3.5 Sonnet (Oct)', '2024-10-22', 20.523, true], ['o1', '2024-12-05', 38.832, true],
  ['Claude 3.7 Sonnet', '2025-02-24', 60.389, true], ['o3', '2025-04-16', 119.733, true], ['Claude Opus 4', '2025-05-22', 100.366, false],
  ['Claude Opus 4.1', '2025-08-05', 100.472, false], ['GPT-5', '2025-08-07', 203.013, true], ['Gemini 3 Pro', '2025-11-18', 224.326, true],
  ['GPT-5.1-Codex-Max', '2025-11-19', 223.715, false], ['Claude Opus 4.5', '2025-11-24', 292.995, true], ['GPT-5.2 (high)', '2025-12-11', 352.249, true],
  ['Claude Opus 4.6', '2026-02-05', 718.807, true], ['GPT-5.3 Codex', '2026-02-05', 349.531, false], ['Gemini 3.1 Pro', '2026-02-19', 384.147, false],
  ['GPT-5.4', '2026-03-05', 341.735, false], ['Claude Mythos Preview (early)', '2026-04-07', 1044.78, true],
];

async function metrSlide(d) {
  const s = d.slide('Content');
  s.addText(`${KICK} · CAPABILITIES · 1`, { placeholder: 'kicker' });
  s.addText('AI’s task horizon doubles every ~4 months', { placeholder: 'title' });

  // chart geometry (manual inner plot area so overlays line up with the data)
  const box = { x: MX, y: 2.02, w: 8.35, h: 4.45 };
  const L = { x: 0.1, y: 0.03, w: 0.875, h: 0.855 };
  const P = { x: box.x + L.x * box.w, y: box.y + L.y * box.h, w: L.w * box.w, h: L.h * box.h };
  const X0 = 2019, X1 = 2026.75, Y0 = 1 / 60, Y1 = 2400;
  const px = (yr) => P.x + (yr - X0) / (X1 - X0) * P.w;
  const py = (min) => P.y + (1 - (Math.log10(min) - Math.log10(Y0)) / (Math.log10(Y1) - Math.log10(Y0))) * P.h;

  const head = label(d, s, 'HOW LONG A TASK (IN HUMAN-EXPERT TIME) AI AGENTS FINISH 50% OF THE TIME · LOG SCALE', MX, 1.7, box.w);

  // unreliable zone (> 16 hrs)
  const zone = d.name('zone');
  s.addShape(d.pres.shapes.RECTANGLE, { x: P.x, y: P.y, w: P.w, h: py(960) - P.y, fill: { color: HEX.steel, transparency: 86 }, line: { color: HEX.steel, width: 0.5, dashType: 'dash', transparency: 40 }, objectName: zone });
  const zoneT = d.text(s, 'Above 16 hrs: METR says its task suite can’t measure reliably', { x: P.x + 0.15, y: P.y + 0.02, w: 4.2, h: py(960) - P.y - 0.04, fontSize: 10, italic: true, color: d.S.muted, valign: 'middle' });

  // custom gridlines + y labels
  const ticks = [[1 / 60, '1 sec'], [1 / 6, '10 sec'], [1, '1 min'], [10, '10 min'], [60, '1 hour'], [240, '4 hours'], [960, '16 hours']];
  const axis = [head, zone, zoneT];
  for (const [v, t] of ticks) {
    axis.push(line(d, s, P.x, py(v), P.x + P.w, py(v), { color: HEX.line, width: 0.75 }));
    axis.push(d.text(s, t, { x: box.x, y: py(v) - 0.13, w: P.x - box.x - 0.08, h: 0.26, fontSize: 10, color: d.S.muted, align: 'right', valign: 'middle' }));
  }
  // legend: empty bottom-right of the plot, between the 10-sec and 1-sec gridlines
  axis.push(d.text(s, [
    { text: '● ', options: { color: d.S.red } }, { text: 'state of the art at release     ', options: { color: d.S.muted } },
    { text: '● ', options: { color: '6B7383' } }, { text: 'other models', options: { color: d.S.muted } },
  ], { x: P.x + P.w - 3.6, y: (py(10 / 60) + py(1 / 60)) / 2 - 0.13, w: 3.55, h: 0.26, fontSize: 10.5, align: 'right', valign: 'middle' }));

  // native scatter: frontier (red) vs other (steel)
  const xs = METR.map((m) => +decYear(m[1]).toFixed(3));
  const ch = d.chart(s, 'scatter', [
    { name: 'Release date', values: xs },
    { name: 'Frontier model at release', values: METR.map((m) => (m[3] ? m[2] : null)) },
    { name: 'Other model', values: METR.map((m) => (m[3] ? null : m[2])) },
  ], box, {
    layout: L, chartColors: [HEX.red, '6B7383'], lineSize: 0, lineDataSymbol: 'circle', lineDataSymbolSize: 9,
    lineDataSymbolLineColor: '0A0C10', lineDataSymbolLineSize: 0.75,
    valAxisLogScaleBase: 10, valAxisMinVal: Y0, valAxisMaxVal: Y1, valAxisHidden: true,
    catAxisMinVal: X0, catAxisMaxVal: X1, catAxisMajorUnit: 1, valAxisLabelFormatCode: '0',
    valGridLine: { style: 'none' }, catGridLine: { style: 'none' }, showLegend: false,
    catAxisLabelColor: HEX.muted, catAxisLabelFontSize: 11, catAxisLineShow: true, catAxisLineColor: HEX.steel,
  });

  // METR trend since 2023: slope = doubling every 128.7 days, through the centroid of frontier points (2023+, ≤16 h)
  const slope = Math.log10(2) / (128.744 / 365.25);
  const fitPts = METR.filter((m) => m[3] && m[1] >= '2023-01-01' && m[2] <= 960);
  const mx = fitPts.reduce((a, m) => a + decYear(m[1]), 0) / fitPts.length;
  const my = fitPts.reduce((a, m) => a + Math.log10(m[2]), 0) / fitPts.length;
  const at = (yr) => 10 ** (my + slope * (yr - mx));
  const t0 = 2023.35, t1 = 2026.5;
  const trend = line(d, s, px(t0), py(at(t0)), px(t1), py(at(t1)), { color: HEX.amber, width: 2, dash: 'dash' });
  const trendT = d.text(s, 'trend since 2023:\ndoubling every ~129 days', { x: px(2025.25) + 0.12, y: py(at(2025.25)) + 0.05, w: 2.1, h: 0.45, fontSize: 11, bold: true, color: d.S.amber, valign: 'top' });

  // point labels
  const lab = (name, txt, side = 'r', dy = 0, dx = 0) => {
    const m = METR.find((r) => r[0] === name);
    const x = px(decYear(m[1])) + dx, y = py(m[2]);
    const w = 2.4;
    return d.text(s, txt, side === 'r'
      ? { x: x + 0.12, y: y - 0.14 + dy, w, h: 0.28, fontSize: 11, color: d.S.txt, valign: 'middle' }
      : { x: x - 0.12 - w, y: y - 0.14 + dy, w, h: 0.28, fontSize: 11, color: d.S.txt, valign: 'middle', align: 'right' });
  };
  const pl = [
    lab('GPT-2', 'GPT-2 · 3 sec'), lab('GPT-3', 'GPT-3 · 9 sec'), lab('GPT-3.5', 'GPT-3.5 · 36 sec'),
    lab('GPT-4', 'GPT-4 · 4 min', 'l'), lab('o1', 'o1 · 39 min', 'l', 0, -0.2), lab('o3', 'o3 · 2 hrs', 'l'),
    lab('Claude Opus 4.6', 'Claude Opus 4.6 · 12 hrs', 'l'),
    lab('Claude Mythos Preview (early)', 'Claude Mythos Preview · ~17 hrs', 'l', -0.1),
  ];

  // right column
  const rx = 9.3, rw = 12.73 - rx;
  const st1 = d.stat(s, { x: rx, y: 1.72, w: rw, value: '~129 days', valueSize: 44, color: d.S.red, label: 'doubling time of the task length frontier agents can finish (METR fit, 2023 onward)', labelSize: 13 });
  const st2 = d.stat(s, { x: rx, y: 3.3, w: rw, value: '4 min → 17 hrs', valueSize: 30, color: d.S.txt, label: 'GPT-4 (Mar 2023) → Claude Mythos Preview (Apr 2026)', labelSize: 13 });
  const mit = await d.frame(s, await crop(R('mittr-misunderstood-graph.png'), 'mittr-head.png', { l: 100, t: 380, w: 1600, h: 655 }), { x: rx, y: 4.72, w: rw, h: 1.55 }, { rot: 1.5, align: 'left' });

  d.animate(s, [...axis, { name: ch, effect: 'wipeLeft', dur: 1600 }], { auto: true, effect: 'fade', dur: 500 });
  d.animate(s, pl, { auto: true, effect: 'fade', stagger: 90, dur: 350, after: 100 });
  d.animate(s, [{ name: trend, effect: 'wipeLeft', dur: 900 }, trendT], { auto: true, effect: 'fade', after: 150 });
  d.animate(s, st1, { effect: 'rise' });
  d.animate(s, st2, { effect: 'rise' });
  d.animate(s, mit, { effect: 'fade' });
  d.source(s, 'Data: METR, Time Horizon 1.1 (benchmark_results_1_1.yaml, page updated May 8, 2026), 50%-success horizon by model release date · MIT Technology Review, Feb 5, 2026.');
  s.addNotes([
    'MESSAGE: the length of real software tasks AI agents can complete on their own is growing exponentially — roughly doubling every four months.',
    'What the chart shows: METR times how long each task takes skilled human experts, then finds the task length at which a model succeeds 50% of the time. GPT-2 (2019) managed ~3-second tasks; GPT-4 (Mar 2023) ~4 minutes; o3 (Apr 2025) ~2 hours; Claude Opus 4.6 (Feb 2026) ~12 hours; Claude Mythos Preview (early, Apr 2026) ~17 hours (1,044.8 min; 95% CI ~8.5–55 h).',
    'Doubling time: METR\'s fit from 2023 onward is 128.7 days (CI 104–158 days); all-time 187.8 days. The dashed amber line is drawn with METR\'s 128.7-day slope through the centroid of frontier points since 2023 (illustrative; METR\'s own regression excludes points above 16 h).',
    'Red dots = models METR flags as state of the art at release; grey = other models. Values are METR\'s p50 estimates from https://metr.org/assets/benchmark_results_1_1.yaml ; official chart: https://metr.org/time-horizons/',
    'CAVEATS (say them): METR itself says "Measurements above 16 hrs are unreliable with our current task suite" — Mythos sits in that zone. The 50% horizon is not "the AI can work for 17 hours"; at 80% success the horizons are much shorter (Mythos ~3 h). METR has not published horizons for GPT-6 Astra, Claude Fable 5/5.1 or Opus 5.5. Its pre-deployment eval of GPT-5.6 Sol (Jun 26, 2026) gave ~11.3 h (CI 5–40 h) with a notably high cheating rate counted as failure: https://metr.org/blog/2026-06-26-gpt-5-6-sol/',
    'MIT Technology Review (Grace Huckins, Feb 5, 2026), "This is the most misunderstood graph in AI": https://www.technologyreview.com/2026/02/05/1132254/this-is-the-most-misunderstood-graph-in-ai/ — use it to show we are not over-reading the curve: the trend is real, the interpretation needs care.',
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 2. benchmark graveyard
async function graveyardSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  s.addText(`${KICK} · CAPABILITIES · 2`, { placeholder: 'kicker' });
  s.addText('Benchmarks built to last years now die in months', { placeholder: 'title' });

  const tiles = [
    { name: 'FrontierMath Tier 4', desc: 'research-level math', from: '0%', to: '100%', when: 'Jan 2025 → Sep 29, 2026 (GPT-6.1 Sol)', note: 'problems written by top mathematicians' },
    { name: 'ARC-AGI-3', desc: 'novel interactive puzzles', from: '<1%', to: '62.7%', when: 'Mar 2026 launch → Sep 2026 (GPT-6 Astra)', note: '99.9% with a different (provider-adapter) harness' },
    { name: 'ARC-AGI-2', desc: 'abstract visual puzzles', from: '0.8%', to: '95%', when: 'o1-mini (2024) → GPT-6 Astra (Sep 2026)', note: 'at a cost of $1.12 per task' },
    { name: 'ARC-AGI-1', desc: 'abstract visual puzzles', from: '18%', to: '98.5%', when: 'o1-preview (Sep 2024) → Claude Fable 5 (Jun 2026)', note: 'effectively saturated since Feb 2026' },
    { name: 'GPQA Diamond', desc: 'PhD-level science Q&A', from: '36%', to: '96%', when: 'GPT-4 (Mar 2023) → GPT-6 Astra (Sep 2026)', note: 'PhD experts score ~65–70%' },
    { name: 'SWE-bench Verified', desc: 'real GitHub issues', from: '31%', to: '83.5%', when: 'GPT-4o (Nov 2024) → Claude Opus 4.7 (Apr 2026)', note: 'Epoch stopped adding frontier runs after Apr 2026' },
  ];
  const tw = 3.33, th = 1.42, gx = 0.24, gy = 0.2, x0 = MX, y0 = 1.75;
  const groups = [];
  const tile = (t, x, y, w) => {
    const g = [d.card(s, { x, y, w, h: th })];
    g.push(d.text(s, [
      { text: t.name, options: { bold: true, color: d.S.txt, fontSize: 14 } },
      { text: `   ${t.desc}`, options: { color: d.S.muted, fontSize: 10 } },
    ], { x: x + 0.16, y: y + 0.08, w: w - 0.3, h: 0.3, valign: 'middle' }));
    g.push(d.text(s, [
      { text: t.from, options: { color: d.S.muted, fontSize: 26, bold: true } },
      { text: '  →  ', options: { color: d.S.steel, fontSize: 20, bold: true } },
      { text: t.to, options: { color: d.S.red, fontSize: 26, bold: true } },
    ], { x: x + 0.16, y: y + 0.38, w: w - 0.3, h: 0.5, valign: 'middle', fontFace: 'Arial' }));
    g.push(d.text(s, t.when, { x: x + 0.16, y: y + 0.9, w: w - 0.3, h: 0.22, fontSize: 10.5, color: d.S.txt, valign: 'middle' }));
    if (t.note) g.push(d.text(s, t.note, { x: x + 0.16, y: y + 1.12, w: w - 0.3, h: 0.22, fontSize: 10, italic: true, color: d.S.amber, valign: 'middle' }));
    return g;
  };
  tiles.forEach((t, i) => {
    const c = i % 2, r = Math.floor(i / 2);
    groups.push(tile(t, x0 + c * (tw + gx), y0 + r * (th + gy), tw));
  });

  // right: convergence chart (quarter-end running best) + ECI tile
  const rx = x0 + 2 * tw + gx + 0.32, rw = 12.73 - rx;
  const Q = quarters([2023, 1], [2026, 3]);
  const qlab = Q.map(([y, q]) => (q === 1 ? String(y) : ''));
  const series = [
    ['FrontierMath Tier 4', 'frontiermath-t4-sota'], ['ARC-AGI-3', 'arc-agi-3-sota'], ['ARC-AGI-2', 'arc-agi-2-sota-over-time'],
    ['ARC-AGI-1', 'arc-agi-1-sota-over-time'], ['GPQA Diamond', 'gpqa-diamond-sota'],
  ].map(([nm, id]) => ({ name: nm, labels: qlab, values: quarterBest(DS[id], Q) }));
  const lab = label(d, s, 'BEST SCORE TO DATE (%) · BY MODEL RELEASE QUARTER', rx, 1.7, rw);
  const ch = d.chart(s, 'line', series, { x: rx - 0.05, y: 1.98, w: rw + 0.05, h: 2.98 }, {
    chartColors: [HEX.red, HEX.amber, HEX.blue, HEX.teal, LIGHT], lineSize: 2.25, lineDataSymbol: 'none',
    valAxisMinVal: 0, valAxisMaxVal: 100, valAxisMajorUnit: 25, legendPos: 't', legendFontSize: 10, catAxisLabelRotate: 0,
  });
  const eci = tile({ name: 'Epoch Capabilities Index', desc: 'built to outlive saturated tests', from: '126', to: '167', when: 'GPT-4 (Mar 2023) → Claude Opus 5.5 (Sep 2026)', note: 'composite of many benchmarks (GPT-5 = 150)' }, rx, y0 + 2 * (th + gy), rw);

  groups.forEach((g, i) => d.animate(s, g, { auto: true, effect: 'rise', dur: 450, after: i === 0 ? 200 : 60 }));
  d.animate(s, [lab, { name: ch, effect: 'wipeLeft', dur: 1400 }], { effect: 'fade' });
  d.animate(s, eci, { effect: 'rise' });
  d.source(s, 'Data: Epoch AI Benchmarking Hub (CC-BY, downloaded Oct 4, 2026) · ARC Prize Foundation leaderboard (Oct 4, 2026). Best verified score by model release date.');
  s.addNotes([
    'MESSAGE: benchmarks that were designed to last years are being saturated in months. Each tile: best score near launch (or two years ago) → best score today.',
    'FrontierMath Tier 4 (research-level problems written by professional mathematicians): 0% (o3-mini, Jan 2025) → 100% (GPT-6.1 Sol, run Sep 29, 2026; Tier 4 v2). Epoch AI benchmark_data.zip, frontiermath_tier_4_v2.csv. (Older v1 file topped out at 47.9%.)',
    'ARC-AGI-3 (interactive, novel environments; humans solve 100%) launched Mar 25, 2026 with every frontier model below 1%. Six months later: GPT-6 Astra (Max) 62.7% on the standard harness; GPT-6 Astra (High) 99.9% with the "Provider Adapter" harness — a different, provider-built harness, so not like-for-like. GPT-6.1 Sol: 52.7% standard / 96.2% adapter. Runs cost thousands of dollars (GPT-6 Astra Max ≈ $26.1K). https://arcprize.org/leaderboard',
    'ARC-AGI-2: 0.8% (o1-mini) → 95.0% (GPT-6 Astra Max, $1.12/task). ARC-AGI-1: 18% (o1-preview, Sep 2024) → 98.5% (Claude Fable 5, Jun 2026); effectively saturated since Feb 2026.',
    'GPQA Diamond (PhD-level science questions): 35.7% (GPT-4, Mar 2023) → 95.8% (GPT-6 Astra). Expert human baseline ~65–70% per the original GPQA paper.',
    'SWE-bench Verified (real GitHub issues): 31% (GPT-4o, Nov 2024) → 83.5% (Claude Opus 4.7, Apr 2026) in Epoch\'s runs; Epoch stopped adding frontier runs after Opus 4.7 as labs moved to harder suites (SWE-bench Pro etc.).',
    'Epoch Capabilities Index (ECI): a composite designed to allow "comparisons between models even over timespans long enough for single benchmarks to reach saturation." 125.9 (GPT-4, Mar 2023) → 167.3 (Claude Opus 5.5, Sep 22, 2026); GPT-5 = 150 reference. https://epoch.ai/eci',
    'Chart: running best score at each quarter end by model release date, from the same Epoch/ARC Prize series. Note "release date" is the model\'s release, not when it was tested (e.g. ARC-AGI-2 was published in 2025 and older models were scored retroactively). Data: https://epoch.ai/data/benchmark_data.zip',
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 3. Humanity's Last Exam
async function hleSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  s.addText(`${KICK} · CAPABILITIES · 3`, { placeholder: 'kicker' });
  s.addText('Humanity’s Last Exam: 4.6% → 54.8% in two years', { placeholder: 'title' });

  const Q = quarters([2024, 3], [2026, 3]);
  const qlab = Q.map(([y, q]) => `Q${q} ’${String(y).slice(2)}`);
  const vals = quarterBest(DS['hle-sota-over-time'], Q);
  const cw = 6.45;
  const lab = label(d, s, 'HLE · BEST SCORE TO DATE (%) · BY MODEL RELEASE QUARTER', MX, 1.7, cw);
  const ch = d.chart(s, 'bar', [{ name: 'Best score', labels: qlab, values: vals }], { x: MX - 0.05, y: 1.98, w: cw + 0.05, h: 2.98 }, {
    barDir: 'col', chartColors: [...vals.slice(0, -1).map(() => '6B7383'), HEX.red], barGapWidthPct: 45,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0.0', dataLabelFontSize: 12, dataLabelFontBold: true,
    valAxisMinVal: 0, valAxisMaxVal: 70, valAxisMajorUnit: 10, valAxisHidden: true, valGridLine: { style: 'none' }, showLegend: false,
  });
  const ann = d.text(s, [
    { text: 'GPT-6 Astra', options: { bold: true, color: d.S.red, breakLine: true } },
    { text: 'Sep 2026 · ±1.9 pts', options: { color: d.S.muted } },
  ], { x: MX + cw - 2.55, y: 2.0, w: 1.75, h: 0.48, fontSize: 11, align: 'right', valign: 'top' });

  // right column: the billing + official leaderboard
  const rx = 7.5, rw = 12.73 - rx;
  // same label style and y as the chart label on the left, so the two column heads line up
  const billLab = label(d, s, 'BILLED AT LAUNCH, JAN 2025', rx, 1.7, rw);
  const bill = d.text(s, [
    { text: '“designed to be the last academic exam of its kind for AI”', options: { fontSize: 19, italic: true, color: d.S.txt, fontFace: 'Cambria', breakLine: true } },
    { text: 'Center for AI Safety & Scale AI · frontier models then scored <10%', options: { fontSize: 11, color: d.S.muted } },
  ], { x: rx, y: 2.02, w: rw, h: 0.95, valign: 'top' });
  const lbLab = label(d, s, 'OFFICIAL LEADERBOARD · TOP TWO · OCT 4, 2026', rx, 3.12, rw);
  // top two rows, full bar width (cutting the bars would make them look equal); rank badges dropped
  const lb = await d.frame(s, await crop(R('scale-hle-leaderboard.png'), 'hle-leaderboard-top2.png', { l: 100, t: 118, w: 885, h: 200 }), { x: rx, y: 3.42, w: rw, h: 1.45 }, { align: 'left' });

  // bottom band: the organizers' own note, verbatim — one contiguous paragraph of the "Update September 17, 2026" entry
  const nc = await crop(R('scale-hle-rolling-noise-ceiling.png'), 'hle-noise-ceiling-para.png', { l: 30, t: 292, w: 1340, h: 150 });
  const bandY = 5.15;
  const ncLab = d.text(s, [
    { text: 'Sep 17, 2026: ', options: { bold: true, color: d.S.red } },
    { text: 'the organizers prepare a replacement for when models “hit the noise ceiling”', options: { bold: true, color: d.S.txt } },
  ], { x: MX, y: bandY, w: 3.6, h: 1.36, fontSize: 15, valign: 'middle' });
  const ncF = await d.frame(s, nc, { x: 4.4, y: bandY, w: 12.73 - 4.4, h: 1.38 }, { align: 'right' });

  d.animate(s, [lab, { name: ch, effect: 'wipeLeft', dur: 1400 }], { auto: true, effect: 'fade' });
  d.animate(s, [ann], { auto: true, effect: 'fade', after: 100 });
  d.animate(s, [billLab, bill], { effect: 'fade' });
  d.animate(s, [lbLab, ...lb], { effect: 'fade' });
  d.animate(s, [ncLab, ...ncF], { effect: 'rise' });
  d.source(s, 'Data: Epoch AI Benchmarking Hub (hle_external.csv, CC-BY) · Scale AI / CAIS HLE leaderboard, labs.scale.com (accessed Oct 4, 2026; update of Sep 17, 2026).');
  s.addNotes([
    'MESSAGE: even the test designed to be the last one is falling fast — and its organizers are already preparing a replacement.',
    'Humanity\'s Last Exam (HLE) launched in January 2025 from the Center for AI Safety and Scale AI, "designed to be the last academic exam of its kind for AI": ~2,500 expert-written questions across many fields. Frontier models then scored under 10%.',
    'Chart: best score to date by model release quarter (Epoch AI hle_external.csv). Sep 2024 Gemini 1.5 Pro 002: 4.6% (scored retroactively); o1 (Dec 2024) 8.0%; Gemini 2.5 Pro (Mar 2025) 18.2%; GPT-5 (Aug 2025) 25.3%; Gemini 3 Pro (Nov 2025) 37.5%; Gemini 3.1 Pro (Feb 2026) 46.4%; Fable 5.1 (xhigh) 46.5%; GPT 6 Astra (Sep 2026) 54.8%.',
    'Official leaderboard (labs.scale.com/leaderboard/humanitys_last_exam, Oct 4, 2026): GPT 6 Astra 54.80 ±1.94; Fable 5.1 (xhigh) 46.50; gemini-3.1-pro-preview 46.44; Gemini 3.8 Flash 44.52; gpt-5.4-pro 44.32. Other setups differ: Wikipedia (citing Artificial Analysis, Sep 22, 2026) lists text-only scores of Claude Opus 5.5 61.4%, Gemini 4 Argon 57.1%, GPT-6 Astra 54.7%.',
    'Verbatim (Scale/CAIS leaderboard, "Update September 17, 2026"): "The goal of HLE-Rolling is to provide a seamless migration path for researchers in the future once frontier models begin to hit the noise ceiling on the original HLE dataset." HLE-Rolling is a continually updated fork of HLE.',
    'CAVEAT: I have found no major-outlet headline declaring HLE "saturated" — it is not saturated yet (≈55%). The point is the speed, and that the organizers are planning for the end.',
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 4. creative hero (image5)
async function heroSlide(d) {
  const s = d.slide('Blank', { transition: 'fade' });
  const img = await crop(ORIG('image5.png'), 'palace-hero.png', { l: 0, t: 30, w: 2348, h: 1226 });
  const nat = await imgSize(img);
  const W = 13.333, h = W * nat.h / nat.w;
  const im = d.name('hero');
  s.addImage({ path: img, x: 0, y: 0, w: W, h, objectName: im });
  // soft dark scrim over the sky (a separate overlay, the image itself is untouched) so the deck's red kicker reads
  const scr = d.name('scrim');
  s.addImage({ path: await scrim('hero-scrim.png', 1600, 400, { max: 0.72 }), x: 0, y: 0, w: W, h: 3.33, objectName: scr });
  // kicker + title at exactly the Content layout's placeholder geometry (text boxes so they can be animated)
  const k = d.text(s, `${KICK} · CREATIVITY · 1`, { x: MX, y: 0.42, w: 9, h: 0.3, fontSize: 12, bold: true, color: d.S.red, charSpacing: 4, valign: 'top' });
  const t = d.text(s, 'This is not a photograph', { x: MX, y: 0.72, w: W - 2 * MX, h: 0.75, fontSize: 36, bold: true, color: d.S.txt, fontFace: 'Arial', valign: 'middle' });
  const c = d.text(s, 'San Francisco’s Palace of Fine Arts, recreated as a photoreal 3-D scene in Blender by GPT-6 Astra.', { x: MX, y: 1.6, w: 4.55, h: 0.95, fontSize: 16, color: 'E6EAF2', valign: 'top' });
  const src = d.text(s, 'Shared on r/singularity, 2026', { x: MX, y: 2.55, w: 4.5, h: 0.3, fontSize: 11, italic: true, color: 'B8C2D6' });
  d.animate(s, [im], { auto: true, effect: 'fade', dur: 1400 });
  // the image sits alone until the presenter clicks; the caption follows the title automatically
  d.animate(s, [scr, k, t], { effect: 'fade', dur: 700 });
  d.animate(s, [c, src], { auto: true, effect: 'fade', dur: 600, after: 500 });
  s.addNotes([
    'The slide opens on the image alone. Let it sit for a moment. Ask: "Photo or render?"',
    'Then CLICK to reveal the title ("This is not a photograph"; the caption follows automatically): this is a photoreal 3-D recreation of San Francisco\'s Palace of Fine Arts built in Blender by GPT-6 Astra (OpenAI\'s model released Sep 3–4, 2026), as shared on Reddit\'s r/singularity.',
    'Source: the user\'s original image (assets/original/image5.png, from r/singularity). The original Reddit post URL could not be re-located during research, so describe it as "shared on r/singularity" and avoid claiming details of the workflow beyond "built in Blender by GPT-6 Astra".',
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 5. creative collage
async function creativeSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  s.addText(`${KICK} · CREATIVITY · 2`, { placeholder: 'kicker' });
  s.addText('Machines now draw, design and build worlds', { placeholder: 'title' });

  // three columns with equal 0.45" gutters, spanning the full content width; the fact sheet's width is set by its height
  const top = 1.78, G = 0.45, W1 = 4.33, W2 = 3.9, W3 = CW - W1 - W2 - 2 * G;
  const x2 = MX + W1 + G, x3 = x2 + W2 + G;

  // col 1: heron progression (user original, its tiny caption strips cropped off) + Register headline
  const hfile = await heronGrid();
  const hnat = await imgSize(hfile);
  const heron = await d.frame(s, hfile, { x: MX, y: top, w: W1, h: W1 * hnat.h / hnat.w }, { border: false, pad: 0 });
  const hg = heron.geom, hs = hg.w / hnat.w;
  const badges = HERON_TILES.flatMap(([, , , , cx, cy], i) => {
    const b = d.name('badge');
    const bx = hg.x + cx * hs + 0.07, by = hg.y + cy * hs + 0.07;
    s.addShape(d.pres.shapes.RECTANGLE, { x: bx, y: by, w: 0.26, h: 0.26, fill: { color: '161A22' }, line: { color: '161A22', width: 0 }, objectName: b });
    return [b, d.text(s, String(i + 1), { x: bx, y: by, w: 0.26, h: 0.26, fontSize: 11, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' })];
  });
  const hc = chip(d, s, 'PENCIL DRAWINGS BY A MODEL · ROUNDS 1 → 4', hg.x, hg.y + hg.h + 0.06, hg.w, { h: 0.28, fill: '161A22', transparency: 0, fontSize: 10 });
  const reg = await d.frame(s, await crop(R('register-genie-gamedev.png'), 'register-genie.png', { l: 28, t: 6, w: 2010, h: 348 }), { x: MX, y: 5.68, w: W1, h: 0.8 }, { rot: -1.5, align: 'left' });

  // col 2: GPT Image 2.5 cow (public domain) + Genie 3 world
  const cow = await d.frame(s, R('commons-gptimage25-cow-ufo.png'), { x: x2, y: top, w: W2, h: W2 * 960 / 1280 }, { border: false, pad: 0 });
  const cg = cow.geom;
  const cc = d.text(s, [
    { text: 'GPT Image 2.5 · Sep 2026 · ', options: { bold: true, color: d.S.txt } },
    { text: 'prompt: “1960’s art of cow getting abducted by UFO in midwest”', options: { color: d.S.muted } },
  ], { x: cg.x, y: cg.y + cg.h + 0.05, w: cg.w, h: 0.4, fontSize: 10.5, valign: 'top' });
  // a wide strip of the generated world (temple ruin, vines, palms) above the page's wordmark — no page text or buttons;
  // shown smaller than its source and contrast-stretched to undo the page's dark scrim
  const gfile = path.join(OUT, 'genie3-world.png');
  await sharp(R('gdm-genie3-hero.png')).extract({ left: 560, top: 60, width: 1760, height: 507 }).resize({ width: 1170 })
    .normalise({ lower: 1, upper: 99 }).sharpen({ sigma: 0.8 }).toFile(gfile);
  const gnat = await imgSize(gfile);
  const gy = cg.y + cg.h + 0.05 + 0.4 + 0.18;
  const genie = await d.frame(s, gfile, { x: x2, y: gy, w: W2, h: W2 * gnat.h / gnat.w }, { border: false, pad: 0 });
  const gg = genie.geom;
  const gc = chip(d, s, 'GENIE 3 · A PROMPT BECOMES A WORLD', gg.x + 0.08, gg.y + gg.h - 0.08 - 0.27, 3.08, { h: 0.27, fontSize: 10 }); // over the foliage

  // col 3: Hercules fact sheet (public domain) + zoom on panel 12 (Cerberus)
  const HERC = R('commons-chatgpt-hercules-factsheet.png');
  const herc = await d.frame(s, HERC, { x: x3, y: top, w: W3, h: W3 * 1357 / 960 }, { border: false, pad: 0 });
  const kg = herc.geom;
  const kcap = d.text(s, [
    { text: 'ChatGPT · Sep 2026 · ', options: { bold: true, color: d.S.txt } },
    { text: 'prompt: “Create a fact sheet on the twelve labours of Hercules”', options: { color: d.S.muted } },
  ], { x: kg.x, y: kg.y + kg.h + 0.05, w: kg.w, h: 0.4, fontSize: 10.5, valign: 'top' });
  const zb = { l: 730, t: 932, w: 190, h: 176 }; // panel 12 artwork only (below the "12" badge), in the 960×1357 source
  const ks = kg.w / 960;
  const p12 = d.name('p12');
  s.addShape(d.pres.shapes.RECTANGLE, { x: kg.x + zb.l * ks, y: kg.y + zb.t * ks, w: zb.w * ks, h: zb.h * ks, fill: { color: 'FFFFFF', transparency: 100 }, line: { color: HEX.red, width: 2 }, objectName: p12 });
  const zw = 1.5, zh = (zw - 0.1) * zb.h / zb.w + 0.1;
  const zoom = await d.frame(s, await crop(HERC, 'hercules-cerberus.png', zb), { x: kg.x + 0.1, y: kg.y + kg.h - zh - 0.62, w: zw, h: zh }, { pad: 0.05, frameColor: HEX.red });
  const zg = zoom.geom;
  // inside the fact sheet's width, so the column gutter stays clear
  const kc = chip(d, s, 'SPOT THE ERROR: FOUR-HEADED CERBERUS', kg.x + 0.05, zg.y + zg.h + 0.05, kg.w - 0.1, { h: 0.3, fontSize: 10, fill: HEX.red, transparency: 0, charSpacing: 0 });

  d.animate(s, [...heron, ...badges, ...hc], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, [...cow, cc], { effect: 'fade' });
  d.animate(s, [...herc, kcap], { effect: 'fade' });
  d.animate(s, [p12, ...zoom, ...kc], { effect: 'zoom', dur: 450 });
  d.animate(s, [...genie, ...gc], { effect: 'fade' });
  d.animate(s, [...reg], { effect: 'slam', dur: 450 });
  d.source(s, 'Images: user original (heron) · Wikimedia Commons, public domain (GPT Image 2.5 and ChatGPT, Sep 2026) · Google DeepMind, Genie 3 page (Oct 2026) · The Register, Jan 29, 2026.');
  s.addNotes([
    'MESSAGE: creative work — drawing, illustration, design, video, music, playable 3-D worlds — is no longer a human-only domain.',
    'Heron (user original, assets/original/image4.png): four successive pencil drawings made by a model iteratively refining its own technique ("Final 1" → "Final 4"; the labelled error falls from 6.34 to 3.37 as it adds close-up passes and tone-following pressure). On the slide the tiny caption strip under each drawing is cropped off and replaced by the numbers 1–4 (= Final 1–4); say the error figures aloud if useful.',
    'Cow: generated with GPT Image 2.5 (ChatGPT Images 2.5, released Sep 8, 2026) from the 10-word prompt "1960\'s art of cow getting abducted by UFO in midwest". Wikimedia Commons, uploaded by Karl432 to show progress in image generation; license: public domain (CC0 + PD-algorithm tags on the Commons file page, checked Oct 4, 2026). https://commons.wikimedia.org/wiki/File:1960%27s_art_of_cow_getting_abducted_by_UFO_in_midwest_(GPT_Image_2.5_September_2026).png',
    'Hercules fact sheet: generated from the one-line prompt "Create a fact sheet on the twelve labours of Hercules" (ChatGPT, Sep 2026; the Commons file page lists the author field as "GPT Image 2.5", but the manifest only records ChatGPT, so say "ChatGPT"). Fully designed, legible text — but note the error: the "three-headed Cerberus" has four heads (red inset = panel 12 enlarged from the same image). Wikimedia Commons, public domain (CC0 + PD-algorithm tags, checked Oct 4, 2026). https://commons.wikimedia.org/wiki/File:AI_generated_fact_sheet_on_the_Twelve_labours_of_Hercules_(ChatGPT_September_2026).png . Related: TechCrunch, Apr 21, 2026, "ChatGPT\'s new Images 2.0 model is surprisingly good at generating text."',
    'Genie 3 (Google DeepMind world model; a strip of the official page\'s hero frame, cropped above the page\'s wordmark and contrast-stretched to offset the page\'s dark overlay, https://deepmind.google/models/genie/): turns prompts into explorable worlds; public "Project Genie" access launched Jan 29, 2026. The Register, Brandon Vigliarolo, Jan 29, 2026: "Google\'s Project Genie could put even more game developers out of work" — https://www.theregister.com/software/2026/01/29/googles-project-genie-turns-prompts-into-interactive-worlds/4186526 . (Bloomberg, Jan 30: "Unity, Video Game Stocks Fall as Google\'s AI Tool Sparks Fears" — headline via Wikipedia citation only.)',
    'Not shown (space) — music: Variety, Corbin Bolies, Sep 18, 2026: "Sony Music, Universal Music Group Sue Suno Over Label-Backed Model: \'Fruit of the Same Poisoned Tree\'" (Suno v6 released Sep 9, 2026). https://variety.com/2026/music/news/sony-music-universal-music-sue-suno-label-backed-model-1236866921/',
    'Video: Google\'s 2026 video model is Gemini Omni ("Create anything from any input – starting with video"; Gemini Omni 1.1 Flash, Aug 2026): https://deepmind.google/models/gemini-omni/ . Note OpenAI\'s Sora — the 2024 showpiece — was shut down in 2026 (app closed Apr 26, API Sep 24), so do not cite Sora as current.',
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 6. video
async function videoSlide(d) {
  const s = d.slide('Content', { transition: 'fadeBlack' });
  s.addText(`${KICK} · INTERLUDE`, { placeholder: 'kicker' });
  s.addText('“i’m upping my p(doom)”', { placeholder: 'title' });
  // the original hand-drawn version (orange Claude creature), with a play button added so the cover reads as a video
  const cover = path.join(OUT, 'pdoom-cover.jpg');
  const play = '<svg width="1280" height="720"><circle cx="640" cy="360" r="74" fill="#0A0C10" fill-opacity="0.78" stroke="#FFFFFF" stroke-width="5"/>'
    + '<polygon points="615,320 615,400 685,360" fill="#FFFFFF"/></svg>';
  await sharp(OW('yt-8j-hR4fJywU.jpg')).resize(1280, 720, { fit: 'cover' }).composite([{ input: Buffer.from(play) }]).jpeg({ quality: 90 }).toFile(cover);
  const link = 'https://www.youtube.com/watch?v=8j-hR4fJywU';
  const vw = 8.2;
  const v = await d.video(s, { link, embed: 'https://www.youtube.com/embed/8j-hR4fJywU', cover, box: { x: MX, y: 1.8, w: vw, h: vw * 9 / 16 } });
  const vg = v.geom;
  // clickable citation in the source-line slot
  const cap = d.text(s, [
    { text: '►  ', options: { color: d.S.red, bold: true } },
    { text: '“Claude Pop – I\'m Upping My P(Doom)” — OtherReality · YouTube · 2:37', options: { color: d.S.muted, hyperlink: { url: link } } },
  ], { x: MX, y: 6.62, w: CW, h: 0.32, fontSize: 11, valign: 'bottom' });
  // revealed after the video has played: who made it (the creator's claim, quoted verbatim from the repo description)
  const rx = vg.x + vg.w + 0.45, rw = 12.73 - rx;
  const card = d.card(s, { x: rx, y: vg.y, w: rw, h: vg.h });
  const who = d.text(s, [
    { text: 'WHO MADE IT', options: { fontSize: 11, bold: true, color: d.S.red, charSpacing: 3, breakLine: true, paraSpaceAfter: 10 } },
    { text: '“Source code for the ', options: { fontSize: 22, italic: true, color: d.S.txt, fontFace: 'Cambria' } },
    { text: 'Claude Opus 5.5', options: { fontSize: 22, italic: true, bold: true, color: d.S.red, fontFace: 'Cambria' } },
    { text: ' music video”', options: { fontSize: 22, italic: true, color: d.S.txt, fontFace: 'Cambria', breakLine: true, paraSpaceAfter: 10 } },
    { text: '— the creator’s GitHub repo (JohnHeibel/PDoomVideo): the video is written and rendered in code', options: { fontSize: 12, color: d.S.muted } },
  ], { x: rx + 0.25, y: vg.y + 0.2, w: rw - 0.5, h: vg.h - 0.4, valign: 'middle' });
  d.animate(s, [v[0]], { auto: true, effect: 'fade', dur: 1200 });
  d.animate(s, [cap], { auto: true, effect: 'fade', dur: 600, after: 100 });
  d.animate(s, [card, who], { effect: 'fade', dur: 600 });
  s.addNotes([
    'Play it (2:37). Let the audience sit with it — no explanation beforehand. (Cover = the video\'s own YouTube thumbnail — the original hand-drawn version with the orange Claude creature — with a play button added.)',
    'AFTER IT ENDS, click to reveal who made it, and say it: the creator\'s GitHub repo (github.com/JohnHeibel/PDoomVideo) describes itself as "Source code for the Claude Opus 5.5 music video" — a whole music video, written and rendered in code by an AI model. That is why it sits in the capabilities section. Present it as the creator\'s claim (we have not independently audited the repo history).',
    'Video: "Claude Pop - I\'m Upping My P(Doom)" by OtherReality (@thisotherreality), YouTube, 2:37 — the original hand-drawn upload. https://www.youtube.com/watch?v=8j-hR4fJywU (title and channel confirmed via YouTube oEmbed; upload date not captured because YouTube rate-limited our requests). A later, more widely shared kinetic-type version exists: "i\'m upping my p(doom)" by mexicat (Sep 27, 2026) https://www.youtube.com/watch?v=5EoO5413dBY',
    'Background (Q&A): the song: lyrics by osmarks on a verse/chorus by MusicPerson (Udio, Nov 2024); audio is the "Claude-Pop" Suno version posted by deckard (@slimer48484), Sep 2026. The most viral copy (on X) reportedly reached ~2.77M views.',
    'If the embed does not play (offline / no YouTube access), click the ► link in the source line at the bottom of the slide.',
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 7. Navier–Stokes: the result
async function navierSlide(d) {
  const s = d.slide('Content', { transition: 'fadeBlack' });
  s.addText(`${KICK} · MATHEMATICS IN CRISIS · 1`, { placeholder: 'kicker' });
  s.addText('A Millennium Prize Problem, apparently settled', { placeholder: 'title' });

  // zoom on the title + author line ("OPENAI") sits ABOVE the page, so it covers nothing; the connector runs only
  // through the page's blank top margin. Column width solves zoom + 0.3 gap + full page = 1.78 → 6.5.
  const PAPER = R('openai-navier-stokes-paper-p1.png');
  const zb = { l: 330, t: 140, w: 615, h: 125 };
  const colW = (4.72 - 0.3 - 0.1 - 0.12 + 0.1 * zb.h / zb.w + 0.12 * 1650 / 1275) / (zb.h / zb.w + 1650 / 1275);
  const zh = (colW - 0.1) * zb.h / zb.w + 0.1;
  const zoom = await d.frame(s, await crop(PAPER, 'ns-paper-title.png', zb), { x: MX, y: 1.78, w: colW, h: zh }, { pad: 0.05, frameColor: HEX.red });
  const paper = await d.frame(s, PAPER, { x: MX, y: 1.78 + zh + 0.3, w: colW, h: 6.5 - (1.78 + zh + 0.3) }, { align: 'left' });
  const pg = paper.geom;
  const sc = pg.w / 1275;
  const hl = d.name('hl');
  s.addShape(d.pres.shapes.RECTANGLE, { x: pg.x + zb.l * sc, y: pg.y + zb.t * sc, w: zb.w * sc, h: zb.h * sc, fill: { color: 'FFFFFF', transparency: 100 }, line: { color: HEX.red, width: 1.5 }, objectName: hl });
  const zl = line(d, s, pg.x + (zb.l + zb.w / 2) * sc, pg.y + zb.t * sc, pg.x + (zb.l + zb.w / 2) * sc, zoom.geom.y + zoom.geom.h + 0.05, { color: HEX.red, width: 1.5 });
  const rx = pg.x + pg.w + 0.45, rw = 12.73 - rx;
  const fig = await d.frame(s, await crop(R('openai-navier-stokes-fig1-blowup.png'), 'ns-fig1.png', { l: 50, t: 8, w: 1580, h: 690 }), { x: rx, y: 1.78, w: 5.05, h: 1.95 }, { align: 'left' });
  const fg = fig.geom;
  const figCap = d.text(s, 'Figure 1 of the proof: the swirling core shrinks while its speed grows without bound — a singularity in finite time', { x: fg.x, y: fg.y + fg.h + 0.06, w: fg.w, h: 0.42, fontSize: 10.5, italic: true, color: d.S.muted, valign: 'top' });
  const qx = fg.x + fg.w + 0.3, qw = 12.73 - qx;
  const quote = d.text(s, [
    { text: 'OPENAI, SEP 8, 2026', options: { fontSize: 10, bold: true, color: d.S.steel, charSpacing: 2, breakLine: true } },
    { text: '“we used an internal model that is ', options: { fontSize: 17, italic: true, color: d.S.txt, fontFace: 'Cambria' } },
    // explicit break so "GPT-6 Astra" stays on one line (Caladea is metric-compatible with Cambria)
    { text: 'significantly more capable than', options: { fontSize: 17, italic: true, bold: true, color: d.S.red, fontFace: 'Cambria', breakLine: true } },
    { text: 'GPT-6 Astra', options: { fontSize: 17, italic: true, bold: true, color: d.S.red, fontFace: 'Cambria' } },
    { text: '”', options: { fontSize: 17, italic: true, color: d.S.txt, fontFace: 'Cambria' } },
  ], { x: qx, y: 1.78, w: qw, h: fg.h, valign: 'middle' });

  // stats row — OpenAI's own figures labelled as such (the 166 pages are the PDF itself; the Lean version is OpenAI's claim).
  // Local stat (value + 2-line label box) so the label box ends before the cards below.
  const sy = Math.max(4.4, fg.y + fg.h + 0.06 + 0.42 + 0.25), sw = (rw - 0.3 * 3) / 4, vh = 28 / 72 * 1.15;
  const stats = [
    ['10,000+', 'AI agents, per OpenAI'], ['88 hrs', 'to crack it, per OpenAI'],
    ['166', 'page proof (Lean version too, per OpenAI)'], ['~$15M', 'compute burned (Aaronson’s estimate)'],
  ].map(([v, l], i) => {
    const x = rx + i * (sw + 0.3);
    return [
      d.text(s, v, { x, y: sy, w: sw, h: vh, fontSize: 28, bold: true, color: i === 0 ? d.S.red : d.S.txt, fontFace: 'Arial', valign: 'bottom' }),
      d.text(s, l, { x, y: sy + vh + 0.05, w: sw, h: 0.42, fontSize: 12, color: d.S.muted, valign: 'top' }),
    ];
  });

  // framing strip
  const fy = sy + vh + 0.05 + 0.42 + 0.25, fh = 6.52 - fy, fw = (rw - 0.25) / 2;
  const proved = [d.card(s, { x: rx, y: fy, w: fw, h: fh })];
  proved.push(d.text(s, [
    { text: 'THE RESULT  ', options: { bold: true, color: d.S.teal, fontSize: 11, charSpacing: 2 } },
    { text: 'With a smooth external force, a 3-D flow starting at rest can blow up in finite time — Fefferman’s (C) and (D).', options: { color: d.S.txt, fontSize: 14 } },
  ], { x: rx + 0.15, y: fy + 0.05, w: fw - 0.3, h: fh - 0.1, valign: 'middle' }));
  const open = [d.card(s, { x: rx + fw + 0.25, y: fy, w: fw, h: fh })];
  open.push(d.text(s, [
    { text: 'STILL OPEN  ', options: { bold: true, color: d.S.amber, fontSize: 11, charSpacing: 2 } },
    { text: 'The unforced case. Clay Institute: “apparently settled”; verification “deliberately unhurried”; no prize awarded.', options: { color: d.S.txt, fontSize: 14 } },
  ], { x: rx + fw + 0.4, y: fy + 0.05, w: fw - 0.3, h: fh - 0.1, valign: 'middle' }));

  d.animate(s, paper, { auto: true, effect: 'fade', dur: 700 });
  d.animate(s, [hl, zl, ...zoom], { auto: true, effect: 'zoom', dur: 450, after: 100 });
  d.animate(s, [...fig, figCap], { auto: true, effect: 'fade', dur: 700, after: 150 });
  d.animate(s, [quote], { effect: 'fade' });
  stats.forEach((st, i) => d.animate(s, st, i === 0 ? { effect: 'zoom', dur: 400 } : { auto: true, effect: 'zoom', dur: 400, after: 150 }));
  d.animate(s, proved, { effect: 'fade' });
  d.animate(s, open, { effect: 'fade' });
  d.source(s, 'Sources: OpenAI, “Finite Time Blowup for Navier–Stokes” (166 pp., Sep 8, 2026) and announcement · Clay Mathematics Institute, Sep 11, 2026 · Scott Aaronson, Shtetl-Optimized, Sep 15, 2026.');
  s.addNotes([
    'MESSAGE: a Millennium Prize Problem — one of the seven hardest open problems in mathematics, with a $1M prize — has (apparently) been settled by an AI system. Be precise about what was proved.',
    'OpenAI, Sep 8, 2026, "On the Navier–Stokes Millennium Prize Problem": "This proof, produced by an internal OpenAI system, shows that the dynamics of the Navier-Stokes equations for fluid motion can develop a singularity in finite time." Same page: "To solve the Navier–Stokes problem, we used an internal model that is significantly more capable than GPT‑6 Astra. We believe it is important to inform the world about the pace of AI progress and what to expect from upcoming models." https://openai.com/index/navier-stokes-solution/',
    'The paper (author line: "OPENAI"), 166 pages: "For every positive viscosity, we construct a solution of the three-dimensional incompressible Navier–Stokes equations that starts from rest and develops unbounded velocity in finite time while maintaining uniformly bounded kinetic energy." It states this establishes alternative (C) of Fefferman\'s problem statement, and via compact support also alternative (D) on the torus. https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf',
    'Scale — OPENAI\'S OWN FIGURES, say so: 10,000+ AI agents, 88 hours, ~2.7 million messages, a 166-page proof plus a Lean formalization (as reported by the Guardian — "Company behind ChatGPT says 10,000 of its AI systems cracked the Navier-Stokes problem in 88 hours" — and BBC "OpenAI says it cracked 90-year-old maths problem in 88 hours"; also Wikipedia "Navier–Stokes priority controversy"). The 166-page length is confirmed by the PDF itself. Compute: Scott Aaronson estimates OpenAI burned "at least ~$15 million", and notes the proof "probably hasn\'t yet been read and understood by any human." https://scottaaronson.blog/?p=10062',
    'WHAT IS NOT SETTLED: this is the FORCED case — the construction uses a smooth external force chosen deliberately. The unforced problem (no external force; alternatives A/B or an unforced blowup) remains open. The Clay Mathematics Institute (Sep 11): "CMI shares in the excitement of the global mathematical community as we contemplate the announcement that the Navier-Stokes problem has apparently been settled" and "The process is deliberately unhurried, but we will provide updates." No prize has been awarded; OpenAI says it will not claim it. https://www.claymath.org/news/navier-stokes-announcement/',
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 8. Navier–Stokes: the headlines
async function headlinesSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  s.addText(`${KICK} · MATHEMATICS IN CRISIS · 2`, { placeholder: 'kicker' });
  s.addText('Front-page news — and a fight over credit', { placeholder: 'title' });

  const C = [
    ['bbc', 'bbc-navier-stokes.png', { l: 0, t: 0, w: 1660, h: 690 }],
    ['guardian', 'guardian-navier-stokes.png', { l: 34, t: 342, w: 1460, h: 425 }],
    ['quanta', 'quanta-navier-stokes.png', { l: 100, t: 55, w: 1500, h: 480 }],
    ['verge', 'verge-navier-chill.png', { l: 20, t: 22, w: 1720, h: 250 }],
    ['fortune', 'fortune-navier-stokes.png', { l: 77, t: 0, w: 1210, h: 770 }], // incl. byline + date
    ['techcrunch', 'techcrunch-navier-fought-dirty.png', { l: 1101, t: 520, w: 1395, h: 640 }],
    ['wired', 'wired-strogatz-terrified.png', { l: 30, t: 30, w: 1010, h: 440 }],
  ];
  const F = {};
  for (const [k, f, b] of C) F[k] = await crop(R(f), `ns-${k}.png`, b);
  // three columns of pinned clippings; each gets an outlet tab sitting just outside its edge (covers only the white border)
  const col = [MX, 4.68, 8.76], w = 3.95;
  const clip = async (file, box, rot, tabText, corner, opts = {}) => {
    const g = await d.frame(s, file, box, { rot, ...opts });
    return [...g, ...outletTab(d, s, g.geom, tabText, corner, rot)];
  };
  const n = [];
  n.push(await clip(F.bbc, { x: col[0], y: 1.78, w, h: 1.7 }, -2, 'BBC NEWS · SEP 8', 'br', { align: 'left' }));
  n.push(await clip(F.quanta, { x: col[1], y: 1.8, w, h: 1.35 }, 1.5, 'QUANTA MAGAZINE · SEP 8', 'tr'));
  n.push(await clip(F.guardian, { x: col[2], y: 1.8, w: 3.97, h: 1.25 }, -1, 'THE GUARDIAN · SEP 8', 'bl'));
  n.push(await clip(F.verge, { x: col[1] - 0.05, y: 3.42, w: w + 0.1, h: 0.62 }, -1.2, 'THE VERGE · SEP 9', 'br'));
  n.push(await clip(F.fortune, { x: col[0] + 0.05, y: 3.85, w: w - 0.1, h: 2.45 }, 1.2, 'FORTUNE · SEP 8', 'br'));
  n.push(await clip(F.wired, { x: col[2], y: 3.53, w: 3.97, h: 1.42 }, 1.5, 'WIRED · SEP 12', 'tr')); // clear of the Guardian tab
  n.push(await clip(F.techcrunch, { x: col[1] + 0.2, y: 4.38, w: w - 0.4, h: 1.92 }, 2, 'TECHCRUNCH · SEP 8', 'br'));

  // credit dispute, from Buckmaster's own (verified) Mastodon post
  const dy = 5.24;
  const mh = await d.frame(s, await crop(R('buckmaster-mastodon-scoop.png'), 'buckmaster-header.png', { l: 25, t: 25, w: 660, h: 110 }), { x: col[2], y: dy, w: 2.6, h: 0.46 }, { align: 'left', pad: 0.05 });
  const mg = mh.geom;
  const mlab = d.text(s, [
    { text: 'THE DISPUTE', options: { bold: true, color: d.S.red, charSpacing: 2, breakLine: true } },
    { text: 'MASTODON · SEP 8', options: { bold: true, color: d.S.steel, charSpacing: 1 } },
  ], { x: mg.x + mg.w + 0.2, y: mg.y - 0.05, w: 12.73 - (mg.x + mg.w + 0.2), h: mg.h + 0.1, fontSize: 10, valign: 'middle' });
  const strip = d.text(s, [
    { text: 'NYU’s Tristan Buckmaster accuses OpenAI of using customer data: ', options: { color: d.S.txt } },
    { text: '“Is it ethical to use customer\'s data to try to scoop their customer?”', options: { color: d.S.txt, italic: true, bold: true } },
  ], { x: col[2], y: mg.y + mg.h + 0.12, w: 3.97, h: 6.52 - (mg.y + mg.h + 0.12), fontSize: 14, valign: 'top' });

  n.forEach((g, i) => d.animate(s, g, { auto: true, effect: 'slam', dur: 380, after: i === 0 ? 150 : 90 }));
  d.animate(s, [...mh, mlab, strip], { effect: 'fade' });
  d.source(s, 'BBC News, Quanta Magazine, The Guardian, Fortune, TechCrunch (Sep 8, 2026) · The Verge (Sep 9) · WIRED (Sep 12) · Tristan Buckmaster on Mastodon (Sep 8).');
  s.addNotes([
    'MESSAGE: this was front-page news worldwide — and immediately contested.',
    'BBC News (Kali Hays, Sep 8): "OpenAI says it cracked 90-year-old maths problem in 88 hours" https://www.bbc.co.uk/news/articles/cy7zygy3rl2o',
    'The Guardian (Ian Sample & Dan Milmo, Sep 8): "OpenAI claims to have solved maths problem that stumped humans for decades" — "Company behind ChatGPT says 10,000 of its AI systems cracked the Navier-Stokes problem in 88 hours" https://www.theguardian.com/science/2026/sep/08/openai-claims-to-have-solved-maths-problem-that-stumped-humans-for-decades',
    'Quanta (Konstantin Kakaes, Sep 8): "AI Has Solved One of Math\'s $1 Million Millennium Prize Problems" — "…But the massive result is not without controversy." https://www.quantamagazine.org/ai-has-solved-one-of-maths-1-million-millennium-prize-problems-20260908/',
    'The Verge (Robert Hart, Sep 9): "OpenAI\'s sly mathematical breakthrough sends a chill through academia" https://www.theverge.com/ai-artificial-intelligence/992953/openai-math-millennium-prize-navier-stokes',
    'Fortune (Jeremy Kahn, Sep 8): "OpenAI says it cracked one of math\'s grand challenges. But there are troubling questions about how they did it—and what it means for us all" https://fortune.com/2026/09/08/openai-says-it-cracked-navier-stokes-math-grand-challenge-buckmaster-accusation-cheating-intimidation-tao-lament/',
    'TechCrunch (Russell Brandom, Sep 8): "OpenAI fought dirty on career-making math problem, says NYU mathematician" https://techcrunch.com/2026/09/08/openai-fought-dirty-on-career-making-math-problem-says-nyu-mathematician/',
    'WIRED (Isabella Ward, Sep 12): "\'I\'m Really Terrified\': A Mathematician Grapples With AI\'s Recent Breakthroughs" — lede: "Steven Strogatz starts to cry when he talks about the artificial-intelligence-driven breakthroughs in his field over the past week." Strogatz: "I think the year 2026 is going to be remembered as either an annus mirabilis or annus horribilis for mathematics." https://www.wired.com/story/mathematician-steven-strogatz-grapples-with-ai-recent-breakthroughs/',
    'THE CREDIT DISPUTE (verified primary source only): Tristan Buckmaster (NYU), Mastodon, Sep 8, 2026, quoting OpenAI — "Since August 28 we have been training a new internal model that has exhibited unprecedented performance in our benchmarks, including mathematics. This model’s training is ongoing and its performance continues to improve." — and adding: "Note that they are openly admitting they used training data from a period after we found our result. Is it ethical to use customer\'s data to try to scoop their customer?" i.e. he accuses OpenAI of using his team\'s data as an OpenAI customer. https://mastodon.social/@tristanbuckmaster/117236471352470303 . TechCrunch\'s headline on the slide ("OpenAI fought dirty on career-making math problem, says NYU mathematician") is the same dispute.',
    'Do NOT go beyond this on stage: the fuller back-story (who else was involved, what OpenAI says in response) is only in the Wikipedia article "Navier–Stokes priority controversy" and has not been verified for this talk. If asked, say the details are contested and point people to the coverage (Fortune, TechCrunch). No prize has been awarded, and OpenAI says it will not claim it (Clay Institute item).',
    'Unverified (not shown): NYT "An N.Y.U. Mathematician Clashed With OpenAI Over a $1 Million Proof"; WaPo "He was close to a huge math breakthrough. Then he got scooped by AI."; Telegraph "OpenAI accused of threatening professor…" — titles known only from Wikipedia citations.',
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 9. mathematicians react (Sep 3 – Oct 1): blog quotes
async function aftermathSlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  s.addText(`${KICK} · MATHEMATICS IN CRISIS · 3`, { placeholder: 'kicker' });
  s.addText('Mathematicians react: “forevermore dethroned”', { placeholder: 'title' });

  const cw = (CW - 0.3) / 2, chh = 2.28, gy = 0.25;
  const cards = [
    {
      shots: [[R('aaronson-title.png'), 'aaronson-title-crop.png', { l: 26, t: 26, w: 1370, h: 139 }, 0.5]], // title + first line of the post
      quote: [['“…update on the fact that '], ['the wild prophecies have come true', 1], ['.”', 0, 1], ['“…human mathematicians are '], ['forevermore dethroned', 1], [' as the main theorem-proving entities on planet earth.”']],
      who: 'Scott Aaronson · Shtetl-Optimized · Sep 15, 2026',
    },
    {
      // title + "Posted on <date> by xenaproject" byline of each post
      shots: [[R('buzzard-flt-title.png'), 'buzzard-flt-crop.png', { l: 28, t: 34, w: 712, h: 112 }, 0.53],
        [R('buzzard-title.png'), 'buzzard-grieve-crop.png', { l: 28, t: 34, w: 565, h: 112 }, 0.53]],
      quote: [['“I was given £1M to run my project over 5 years; '], ['Anthropic took only 11 days', 1], [' but I do wonder if they spent more money…”', 0, 1],
        ['“A post-doc I know told me that they were '], ['considering leaving mathematical research', 1], [' because of what it was about to become.”']],
      size: 14,
      who: 'Kevin Buzzard · Xena blog · Sep 4 & Oct 1, 2026',
    },
    {
      shots: [[R('tao-mastodon-stripmining.png'), 'tao-header-crop.png', { l: 26, t: 26, w: 420, h: 106 }, 0.5]],
      quote: [['“…the indiscriminate automated '], ['strip-mining of open problems', 1], [' for solutions '], ['may destroy the ecosystem', 1], [' from which the next generation of mathematical techniques, problems, and practitioners would have developed…”']],
      who: 'Terence Tao on Mathstodon, after Hugo Duminil-Copin · Sep 3, 2026',
    },
    {
      shots: [[R('mathandai-declaration.png'), 'mathandai-title-crop.png', { l: 70, t: 96, w: 1010, h: 310 }, 0.78]],
      quote: [['“The goals of the AI companies and the goals of the mathematical community are '], ['severely misaligned', 1], ['.”']],
      who: 'Joint declaration of two dozen+ Fields Medalists, incl. Terence Tao · Sep 11, 2026',
    },
  ];
  const groups = [];
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const x = MX + (i % 2) * (cw + 0.3), y = 1.75 + Math.floor(i / 2) * (chh + gy);
    const g = [d.card(s, { x, y, w: cw, h: chh })];
    let sx = x + 0.2;
    const sy = y + 0.18;
    let shotH = 0;
    for (const [src, nm, b, hh] of c.shots) {
      const f = await crop(src, nm, b);
      const fr = await d.frame(s, f, { x: sx, y: sy, w: cw - 0.4 - (sx - x - 0.2), h: hh }, { align: 'left', pad: 0.05 });
      g.push(...fr);
      sx = fr.geom.x + fr.geom.w + 0.25;
      shotH = Math.max(shotH, hh);
    }
    const qy = sy + shotH + 0.12;
    const runs = c.quote.map(([t, em, br]) => ({ text: t, options: em === 2 ? { italic: false, fontFace: 'Calibri', fontSize: 12, color: d.S.muted } : { bold: em === 1, color: em === 1 ? d.S.red : d.S.txt, breakLine: !!br } }));
    g.push(d.text(s, runs, { x: x + 0.22, y: qy, w: cw - 0.44, h: y + chh - 0.42 - qy, fontSize: c.size || 15, italic: true, color: d.S.txt, fontFace: 'Cambria', valign: 'middle', fit: 'shrink' }));
    g.push(d.text(s, c.who, { x: x + 0.22, y: y + chh - 0.38, w: cw - 0.44, h: 0.28, fontSize: 11, color: d.S.muted, valign: 'middle' }));
    groups.push(g);
  }
  groups.forEach((g, i) => d.animate(s, g, i === 0 ? { auto: true, effect: 'rise', dur: 500 } : { effect: 'rise', dur: 500 }));
  d.source(s, 'Sources: scottaaronson.blog/?p=10062 · xenaproject.wordpress.com (Sep 4 & Oct 1, 2026) · mathstodon.xyz/@tao (Sep 3, 2026) · mathandai.org (Sep 11, 2026).');
  s.addNotes([
    'MESSAGE: the people at the top of the field are saying, in public, that something fundamental has changed — some with awe, many with grief. These span Sep 3 – Oct 1, 2026 (the prime-gaps race, Anthropic\'s Lean proof of FLT, then Navier–Stokes), not reactions to Navier–Stokes alone — note the dates on the cards.',
    'Scott Aaronson, "The Age of Wonders and Terrors", Shtetl-Optimized, Sep 15, 2026 (https://scottaaronson.blog/?p=10062). Opens with the 2006-era skeptic\'s line: "…we\'ll see major math problems getting solved by AIs—even the Clay Millennium Problems. That will be the time to panic! Wake me up when that happens!" — then: "update on the fact that the wild prophecies have come true." Also: "it seems safe to say that human mathematicians are forevermore dethroned as the main theorem-proving entities on planet earth." And: "It seems to me that the Singularity has already started; it\'s just wildly unevenly distributed." And: "By any accounting that doesn\'t stack the deck, Eliezer Yudkowsky was right about what the greatest challenge facing civilization in our lifetimes was going to be, and you and I were wrong about it."',
    'Kevin Buzzard, "FLT: Anthropic has beaten me to it", Xena, Sep 4, 2026 (https://xenaproject.wordpress.com/2026/09/04/flt-anthropic-has-beaten-me-to-it/): an Anthropic internal model, using the prove2.me platform, formalized a complete proof of Fermat\'s Last Theorem in Lean — the last item on Freek Wiedijk\'s 20-year-old list of 100 formalization challenges; over 13.4 million lines, ~20× mathlib\'s compile time. "I was given £1M to run my project over 5 years; Anthropic took only 11 days but I do wonder if they spent more money…"',
    'Kevin Buzzard, "To grieve, or not to grieve?", Xena, Oct 1, 2026 (NOTE: the title is not "Should we grieve?") https://xenaproject.wordpress.com/2026/10/01/to-grieve-or-not-to-grieve/ — its opening paragraph (visible in the verified title screenshot, buzzard-title.png) says: "I personally am extremely excited about the future of our field. However it is becoming clear to me that my views are not shared by everyone in the community: indeed, many of my colleagues seem to be upset." He then frames colleagues\' reactions through the stages of grief: a fluids faculty member called the Navier–Stokes news "extremely depressing"; a post-doc was "considering leaving mathematical research because of what it was about to become"; a PhD student whose lemma ChatGPT one-shotted "wonder[ed] what the point of it all was."',
    'Terence Tao, Mathstodon, Sep 3, 2026 (https://mathstodon.xyz/@tao/117204930249967695), relaying Hugo Duminil-Copin (Proofs and Prompts, "Care for a little more AI?", Aug 30): "As Hugo Duminil-Copin wrote recently at proofsandprompts.com/2026/08/3… , the indiscriminate automated strip-mining of open problems for solutions may destroy the ecosystem…, similarly to how using excavators to dig out treasures from an archeological site destroys the rich historical context". Tao continues in the same post (visible in the verified screenshot, tao-mastodon-stripmining.png): "It may become necessary to declare certain classes of mathematical problems off-limits to automated solvers, in order to preserve their broader value to the mathematical ecosystem (for instance, through the training of future mathematicians)." The sentence is Tao\'s, introduced with "As Hugo Duminil-Copin wrote recently at proofsandprompts.com…" (no quotation marks): credit the idea to Duminil-Copin (Proofs and Prompts, Aug 30) and the words to Tao. (Checked Oct 4, 2026: the strip-mining / excavator wording does not appear in Duminil-Copin\'s post itself — https://proofsandprompts.com/2026/08/30/care-for-a-little-more-ai/ — so do not quote it as his.) Same day he described "the unedifying spectacle of no fewer than three separate AI companies" racing to announce improvements on the bounded-prime-gaps result (https://mathstodon.xyz/@tao/117208619314517025). NOTE: the AI posts on Tao\'s blog (e.g. "After Math", Sep 12) are guest posts; Tao\'s own words are these Mathstodon posts.',
    '"A Severe Misalignment of AI in Mathematics", mathandai.org, Sep 11, 2026: "…the push by AI companies to solve mathematical problems as a benchmark is detrimental to the science of mathematics, and to the mathematical community. The goals of the AI companies and the goals of the mathematical community are severely misaligned." Signatory count varies by source — Tao\'s post says 25 Fields Medalists, The Economist 24, Wikipedia 28, and mathandai.org listed 27 as of Oct 4 — hence "two dozen+". Economist: "Top mathematicians are outraged by OpenAI\'s methods" (Sep 11).',
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 10. VibeMathed + Mathathon
async function vibemathedSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  s.addText(`${KICK} · MATHEMATICS IN CRISIS · 4`, { placeholder: 'kicker' });
  s.addText('Hundreds of open problems fall — and a backlash', { placeholder: 'title' });

  const lw = 6.75;
  const st1 = d.stat(s, { x: MX, y: 1.68, w: 3.0, value: '755', valueSize: 54, color: d.S.red, label: 'problems tracked as solved with AI\n(514 fully resolved, 159 Lean-verified)', labelSize: 12 });
  const st2 = d.stat(s, { x: MX + 3.35, y: 1.68, w: 3.35, value: '11,425', valueSize: 54, color: d.S.txt, label: 'combined years those problems had been open (VibeMathed’s tally, incl. partial results)', labelSize: 12 });

  // monthly chart (stacked: fully resolved + partial/candidate)
  const ds = DS['vibemathed-ai-solved-by-month'];
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const labs = ds.labels.map((l, i) => { const [y, m] = l.split('-'); if (i % 2) return ''; return `${mon[+m - 1]}${i === 0 || m === '01' ? ` ’${y.slice(2)}` : ''}${i === ds.labels.length - 1 ? '*' : ''}`; });
  const all = ds.series[0].values, res = ds.series[1].values;
  const box = { x: MX - 0.05, y: 3.68, w: lw + 0.05, h: 2.8 };
  const L = { x: 0.07, y: 0.12, w: 0.9, h: 0.72 };
  const lab = label(d, s, 'AI-SOLVED PROBLEM ENTRIES PER MONTH · VIBEMATHED · *PARTIAL MONTH', MX, 3.4, lw);
  const ch = d.chart(s, 'bar', [
    { name: 'Fully resolved', labels: labs, values: res },
    { name: 'Partial / candidate', labels: labs, values: all.map((v, i) => v - res[i]) },
  ], box, {
    layout: L, barDir: 'col', barGrouping: 'stacked', chartColors: [HEX.red, '6B7383'], barGapWidthPct: 35,
    valAxisMinVal: 0, valAxisMaxVal: 250, valAxisMajorUnit: 50, legendPos: 't', legendFontSize: 10, catAxisLabelRotate: 0,
    valAxisLabelFontSize: 10, catAxisLabelFontSize: 10,
  });
  // annotate July 2026 peak and the partial September
  const P = { x: box.x + L.x * box.w, y: box.y + L.y * box.h, w: L.w * box.w, h: L.h * box.h };
  const bx = (i) => P.x + (i + 0.5) * P.w / labs.length;
  const byv = (v) => P.y + (1 - v / 250) * P.h;
  const jul = ds.labels.indexOf('2026-07');
  const pk = d.text(s, [
    { text: '223 entries in July 2026 ', options: { bold: true, color: d.S.txt } },
    { text: '(166 fully resolved)', options: { bold: true, color: d.S.red } },
  ], { x: bx(jul) - 3.55, y: byv(223) - 0.12, w: 3.35, h: 0.26, fontSize: 11, align: 'right', valign: 'middle' });
  const pkl = line(d, s, bx(jul) - 0.18, byv(223) + 0.01, bx(jul) - 0.08, byv(223) + 0.01, { color: HEX.text, width: 1 });

  // right: the backlash
  const rx = MX + lw + 0.45, rw = 12.73 - rx;
  const blab = label(d, s, 'THE BACKLASH · CALTECH “MATHATHON”', rx, 1.7, rw);
  const tnw = await d.frame(s, await crop(R('tnw-mathathon.png'), 'tnw-mathathon-crop.png', { l: 64, t: 77, w: 2432, h: 633 }), { x: rx, y: 2.05, w: rw, h: 1.5 }, { rot: -1.2 });
  const yah = await d.frame(s, await crop(R('yahoo-mathathon.png'), 'yahoo-mathathon-crop.png', { l: 20, t: 8, w: 1530, h: 390 }), { x: rx + 0.3, y: 3.78, w: rw - 0.6, h: 1.38 }, { rot: 1.2 });
  const letter = d.text(s, [
    { text: '“To put it bluntly, AI companies are engaging in research misconduct.”', options: { italic: true, fontFace: 'Cambria', fontSize: 15, color: d.S.txt, breakLine: true } },
    { text: 'Open letter signed by 771 mathematicians, Sep 10, 2026', options: { fontSize: 11, color: d.S.muted } },
  ], { x: rx, y: 5.45, w: rw, h: 1.0, valign: 'top' });

  d.animate(s, st1, { auto: true, effect: 'zoom', dur: 450 });
  d.animate(s, st2, { auto: true, effect: 'zoom', dur: 450, after: 150 });
  d.animate(s, [lab, { name: ch, effect: 'wipeLeft', dur: 1300 }], { auto: true, effect: 'fade', after: 150 });
  d.animate(s, [pk, pkl], { auto: true, effect: 'fade', after: 100 });
  d.animate(s, [blab, ...tnw], { effect: 'slam', dur: 420 });
  d.animate(s, yah, { auto: true, effect: 'slam', dur: 420, after: 200 });
  d.animate(s, [letter], { effect: 'fade' });
  d.source(s, 'Data: VibeMathed public dataset (vibemathed.com, CC BY 4.0, Oct 4, 2026) · The Next Web, Sep 14, 2026 · Yahoo News, Sep 10, 2026 · Proofs and Prompts open letter, Sep 10, 2026.');
  s.addNotes([
    'MESSAGE: AI is now clearing out mathematics\' backlog of open problems at industrial scale — and mathematicians are pushing back.',
    'VibeMathed ("Math problems solved with AI", community tracker, https://vibemathed.com/ , data via vibemathed.com/api/dataset, CC BY 4.0, generated Oct 4, 2026): 755 tracked problems, 514 fully resolved, 159 Lean-verified; the tracker says the problems had been open a combined 11,425 years "before AI closed them" — but that tally covers all 755 entries, including the 241 partial/candidate results AI did not fully close, so the slide calls it VibeMathed\'s tally, incl. partial results. Roughly 490 of the tracked entries are dated July–September 2026 alone. Oldest problem cracked: posed in 1849 (prime gaps). 87 of the 1,220 problems on erdosproblems.com now have a fully resolved AI entry (7.1%).',
    'Chart: entries by month of solution — red = fully resolved, grey = partial or candidate results. July 2026: 223 entries (166 fully resolved). September 2026 is a partial month (submission lag). By vendor (entries can count for several): OpenAI 420, Anthropic 109, agent systems 52, Harmonic 40, Google DeepMind 36.',
    'CAVEATS: a volunteer-run tracker; "solved with AI" ranges from fully autonomous to AI-assisted; "years open" counts each problem from when it was posed. Significance varies enormously — most are modest problems, a few are major (e.g. the Navier–Stokes forced case, the Jacobian conjecture disproof).',
    'The Next Web (Sep 14): "\'Slop mathematics\': OpenAI walks away from a Caltech AI maths contest" — "An open letter signed by 771 mathematicians pushed OpenAI out of a student-run AI maths contest at Caltech. It calls the format slop mathematics. Anthropic\'s $1m is still in, and the event is going ahead. Then 25 Fields Medallists published a second letter." https://thenextweb.com/news/openai-withdraws-caltech-mathathon-slop-mathematics-fields-medallists',
    'Yahoo News (syndicated; page metadata references Business Insider), Truman Dickerson, Sep 10: "OpenAI pulls out of Caltech math hackathon after mathematicians issue open letter criticizing AI math \'slop\'" https://www.yahoo.com/news/us/articles/openai-pulls-caltech-math-hackathon-224644789.html',
    'Open letter (Proofs and Prompts, Sep 10, 771 signatories, current and former Caltech mathematicians): "To put it bluntly, AI companies are engaging in research misconduct." and "Participants will quickly create AI-generated mathematics in an accelerated environment, while the real work of verification will then be displaced onto the mathematical community." https://proofsandprompts.com/2026/09/10/open-letter-about-the-mathathon/ . The original Mathathon: 40 hours, $2M in AI credits from OpenAI and Anthropic, Oct 30. A Sep 28 joint statement redesigned it as "Old Problems, New Proofs" (Nov 13–15) without proprietary-lab sponsorship.',
    'Related: arXiv now limits each submitter to two submissions a month amid exponential submission growth (Tao blog, Oct 1, 2026).',
  ].join('\n\n'));
  return s;
}

async function build(d) {
  await metrSlide(d);
  await graveyardSlide(d);
  await hleSlide(d);
  await heroSlide(d);
  await creativeSlide(d);
  await videoSlide(d);
  await navierSlide(d);
  await headlinesSlide(d);
  await aftermathSlide(d);
  await vibemathedSlide(d);
}

module.exports = { build };
