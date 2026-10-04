// THE ACCELERATION · capabilities: METR horizon, benchmark graveyard, HLE, creative work (incl. @anabology's 18-hour Claude film
// and clips credited to an unannounced "Fable 5.5"), video, mathematics in crisis (incl. OpenAI's 100+ held-back results and the
// unconfirmed Hodge/BSD rumors).
// Sources: assets/research/capabilities/manifest.json (verified items, datasets, facts),
//          assets/research/openweights/manifest.json (video item), user originals image4.png / image5.png.
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { execFileSync } = require('child_process');
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
  const box = { x: MX, y: 2.02, w: 8.4, h: 4.45 };
  const L = { x: 0.1, y: 0.03, w: 0.875, h: 0.855 };
  const P = { x: box.x + L.x * box.w, y: box.y + L.y * box.h, w: L.w * box.w, h: L.h * box.h };
  const X0 = 2019, X1 = 2026.95, Y0 = 1 / 60, Y1 = 256 * 60;
  const px = (yr) => P.x + (yr - X0) / (X1 - X0) * P.w;
  const py = (min) => P.y + (1 - (Math.log10(min) - Math.log10(Y0)) / (Math.log10(Y1) - Math.log10(Y0))) * P.h;
  const yWall = decYear('2026-05-08'); // METR's last dashboard update (Claude Mythos Preview added)
  const yToday = decYear('2026-10-04');

  const head = label(d, s, 'TASK LENGTH AI FINISHES 50% OF THE TIME · LOG SCALE', MX, 1.7, 5.6);

  // the zone METR says it cannot measure (> 16 hrs): red band, with METR's own chart notice quoted verbatim
  const zone = d.name('zone');
  s.addShape(d.pres.shapes.RECTANGLE, { x: P.x, y: P.y, w: P.w, h: py(960) - P.y, fill: { color: HEX.red, transparency: 80 }, line: { color: HEX.red, width: 1.25 }, objectName: zone });
  const zoneT = d.text(s, [
    { text: 'ABOVE 16 HOURS: BEYOND WHAT METR CAN MEASURE', options: { bold: true, color: 'FF8A8C', fontSize: 11.5, charSpacing: 0.5, breakLine: true, paraSpaceAfter: 3 } },
    { text: '“Measurements above 16 hrs are unreliable with our current task suite” ', options: { italic: true, color: d.S.txt, fontSize: 11.5 } },
    { text: '— METR', options: { color: LIGHT, fontSize: 10.5 } },
  ], { x: P.x + 0.14, y: P.y + 0.04, w: 4.45, h: py(960) - P.y - 0.08, valign: 'middle' });

  // custom gridlines + y labels
  const ticks = [[1 / 60, '1 sec'], [1 / 6, '10 sec'], [1, '1 min'], [10, '10 min'], [60, '1 hour'], [240, '4 hours'], [960, '16 hours'], [3840, '64 hours']];
  const axis = [head];
  // the 10-sec gridline is broken where the big "THE DATA STOPS HERE" annotation sits (text ends 0.15" left of the wall)
  const gapL = px(yWall) - 0.15 - 4.4, gapR = px(yWall);
  for (const [v, t] of ticks) {
    if (v === 1 / 6) {
      axis.push(line(d, s, P.x, py(v), gapL, py(v), { color: HEX.line, width: 0.75 }));
      axis.push(line(d, s, gapR, py(v), P.x + P.w, py(v), { color: HEX.line, width: 0.75 }));
    } else if (v < 960) axis.push(line(d, s, P.x, py(v), P.x + P.w, py(v), { color: HEX.line, width: 0.75 }));
    axis.push(d.text(s, t, { x: box.x, y: py(v) - 0.13, w: P.x - box.x - 0.08, h: 0.26, fontSize: 10, color: v >= 960 ? 'FF8A8C' : d.S.muted, bold: v === 960, align: 'right', valign: 'middle' }));
  }
  axis.push(d.text(s, [
    { text: '● ', options: { color: d.S.red } }, { text: 'state of the art at release     ', options: { color: d.S.muted } },
    { text: '● ', options: { color: '6B7383' } }, { text: 'other models', options: { color: d.S.muted } },
  ], { x: P.x + 0.14, y: py(960) + 0.1, w: 3.6, h: 0.26, fontSize: 10.5, valign: 'middle' }));

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

  // Mythos 95% CI (8.5–55 h), drawn into the unmeasurable zone
  const my = METR[METR.length - 1];
  const mx = px(decYear(my[1]));
  const ci = [line(d, s, mx, py(55.07 * 60), mx, py(8.48 * 60), { color: HEX.red, width: 1.5 }),
    line(d, s, mx - 0.06, py(55.07 * 60), mx + 0.06, py(55.07 * 60), { color: HEX.red, width: 1.5 }),
    line(d, s, mx - 0.06, py(8.48 * 60), mx + 0.06, py(8.48 * 60), { color: HEX.red, width: 1.5 })];

  // METR trend since 2023: slope = doubling every 128.7 days, through the centroid of frontier points (2023+, ≤16 h)
  const slope = Math.log10(2) / (128.744 / 365.25);
  const fitPts = METR.filter((m) => m[3] && m[1] >= '2023-01-01' && m[2] <= 960);
  const cx = fitPts.reduce((a, m) => a + decYear(m[1]), 0) / fitPts.length;
  const cy = fitPts.reduce((a, m) => a + Math.log10(m[2]), 0) / fitPts.length;
  const at = (yr) => 10 ** (cy + slope * (yr - cx));
  const t0 = 2023.35, t1 = yWall - 0.06;
  const trend = line(d, s, px(t0), py(at(t0)), px(t1), py(at(t1)), { color: HEX.amber, width: 2, dash: 'dash' });
  const trendT = d.text(s, 'trend since 2023:\ndoubling every ~129 days', { x: px(t0) - 2.3, y: py(at(t0)) - 1.2, w: 2.25, h: 0.45, fontSize: 11, bold: true, color: d.S.amber, align: 'right', valign: 'bottom' });

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
    lab('GPT-2', 'GPT-2 · 3 sec'), lab('GPT-3', 'GPT-3 · 9 sec'), lab('GPT-3.5', 'GPT-3.5 · 36 sec', 'l'),
    lab('GPT-4', 'GPT-4 · 4 min', 'l'), lab('o1', 'o1 · 39 min', 'l', 0, -0.2), lab('o3', 'o3 · 2 hrs', 'l'),
    lab('Claude Opus 4.6', 'Claude Opus 4.6 · 12 hrs', 'l', 0.04),
    lab('Claude Mythos Preview (early)', 'Claude Mythos Preview · ≥16 hrs', 'l', -0.3, -0.02),
  ];

  // THE WALL: where the data stops (METR's last update, May 8, 2026) + the empty months since
  const top = P.y, bot = P.y + P.h;
  const voidN = d.name('void');
  s.addShape(d.pres.shapes.RECTANGLE, { x: px(yWall), y: top, w: px(yToday) - px(yWall), h: bot - top, fill: { color: HEX.red, transparency: 72 }, line: { color: HEX.red, width: 0, transparency: 100 }, objectName: voidN });
  const wall = line(d, s, px(yWall), top - 0.12, px(yWall), bot, { color: HEX.red, width: 3.5 });
  const wallT = d.text(s, 'LAST DATA: MAY 8, 2026 ▼', { x: px(yWall) - 3.0 + 0.12, y: 1.7, w: 3.0, h: 0.3, fontSize: 11, bold: true, color: d.S.red, charSpacing: 1, align: 'right', valign: 'bottom' });
  const vL = 3.4, vcx = (px(yWall) + px(yToday)) / 2, vcy = bot - 0.08 - vL / 2;
  const voidT = d.text(s, 'NO RELIABLE MEASUREMENT SINCE MAY 8', { x: vcx - vL / 2, y: vcy - 0.14, w: vL, h: 0.28, rotate: 270, fontSize: 10, bold: true, color: 'FFFFFF', charSpacing: 0.5, align: 'center', valign: 'middle' });
  const todayT = d.text(s, 'today', { x: px(yToday) - 0.4, y: bot + 0.02, w: 0.8, h: 0.22, fontSize: 10, italic: true, color: 'FF8A8C', align: 'center', valign: 'top' });
  const todayL = line(d, s, px(yToday), bot - 0.06, px(yToday), bot + 0.04, { color: HEX.red, width: 1.5 });
  const big = d.text(s, [
    { text: 'THE DATA STOPS HERE', options: { fontSize: 26, bold: true, color: d.S.red, fontFace: 'Arial', breakLine: true } },
    { text: 'because METR can no longer measure the frontier', options: { fontSize: 13.5, bold: true, color: d.S.txt } },
  ], { x: px(yWall) - 5.05, y: py(1 / 6) - 0.25, w: 4.9, h: 0.85, align: 'right', valign: 'top' });
  const arrow = line(d, s, px(yWall) - 0.13, py(1 / 6) + 0.03, px(yWall) - 0.02, py(1 / 6) + 0.03, { color: HEX.red, width: 3, arrow: true });

  // right column: METR's own words (verbatim)
  const rx = 9.3, rw = 12.73 - rx, ry = 1.75, rh = 6.5 - ry;
  const card = d.card(s, { x: rx, y: ry, w: rw, h: rh }, { color: '1A1013', line: HEX.red });
  const bar = d.name('bar');
  s.addShape(d.pres.shapes.RECTANGLE, { x: rx, y: ry, w: rw, h: 0.42, fill: { color: HEX.red }, line: { color: HEX.red, width: 0 }, objectName: bar });
  const barT = d.text(s, 'WHY THE GRAPH ENDS', { x: rx + 0.2, y: ry, w: rw - 0.4, h: 0.42, fontSize: 13, bold: true, color: 'FFFFFF', charSpacing: 3, valign: 'middle' });
  const Q = (q, who) => [
    { text: q, options: { fontFace: 'Cambria', italic: true, fontSize: 15.5, color: d.S.txt, breakLine: true, paraSpaceAfter: 2 } },
    { text: who, options: { fontSize: 10.5, color: d.S.muted, breakLine: true, paraSpaceAfter: 10 } },
  ];
  const quotes = d.text(s, [
    { text: 'METR, in its own words:', options: { fontSize: 11, bold: true, color: 'FF8A8C', charSpacing: 1, breakLine: true, paraSpaceAfter: 8 } },
    ...Q('“…at the upper end of what we can measure without new tasks.”', 'on Claude Mythos Preview · X, May 8, 2026'),
    ...Q('“…it is infeasible to precisely measure time horizons in this range.”', 'on tasks above 16 h · Frontier Risk Report, May 19'),
    ...Q('“The most capable agents we evaluated essentially saturated our Time Horizon 1.1 benchmark…”', 'Frontier Risk Report, May 19, 2026'),
  ], { x: rx + 0.22, y: ry + 0.56, w: rw - 0.42, h: rh - 1.3, valign: 'top' });
  const foot = d.text(s, 'METR’s chart has not been updated since May 8, 2026.', { x: rx + 0.22, y: ry + rh - 0.66, w: rw - 0.42, h: 0.52, fontSize: 12.5, bold: true, color: d.S.red, valign: 'middle' });

  d.animate(s, [...axis, zone, zoneT, { name: ch, effect: 'wipeLeft', dur: 1600 }], { auto: true, effect: 'fade', dur: 500 });
  d.animate(s, pl, { auto: true, effect: 'fade', stagger: 90, dur: 350, after: 100 });
  d.animate(s, [{ name: trend, effect: 'wipeLeft', dur: 900 }, trendT], { auto: true, effect: 'fade', after: 150 });
  d.animate(s, [{ name: wall, effect: 'wipeDown', dur: 500 }, wallT, voidN, voidT, todayL, todayT, ...ci], { effect: 'fade', dur: 500 });
  d.animate(s, [big, arrow], { auto: true, effect: 'slam', dur: 450, after: 150 });
  d.animate(s, [card, bar, barT, quotes, foot], { effect: 'fade', dur: 600 });
  d.source(s, 'Data: METR, Time Horizon 1.1 (benchmark_results_1_1.yaml; metr.org/time-horizons, “last updated May 8, 2026”, checked Oct 4, 2026) · METR on X, May 8, 2026 · METR Frontier Risk Report, May 19, 2026.');
  s.addNotes([
    'MESSAGE: the length of real software tasks AI agents can complete on their own grew exponentially — doubling roughly every four months — until METR\'s measuring stick ran out. THE GRAPH ENDS BECAUSE METR CAN NO LONGER MEASURE THE FRONTIER, not because progress stopped.',
    'What the chart shows: METR times how long each task takes skilled human experts, then finds the task length at which a model succeeds 50% of the time. GPT-2 (2019) managed ~3-second tasks; GPT-4 (Mar 2023) ~4 minutes; o3 (Apr 2025) ~2 hours; Claude Opus 4.6 (Feb 2026) ~12 hours; Claude Mythos Preview (early, Apr 2026) "at least 16hrs" in METR\'s words (dashboard readout 17 hr; raw estimate 1,044.8 min = 17.4 h; 95% CI 8.5–55 h, drawn as the red error bar reaching deep into the red zone).',
    'THE RED ZONE + THE WALL (say it plainly): METR\'s own chart now carries the notice "Measurements above 16 hrs are unreliable with our current task suite" (changelog, May 8, 2026). Its X thread the same day: "We estimated a 50%-time-horizon of at least 16hrs (95% CI 8.5hrs to 55hrs) on our task suite, at the upper end of what we can measure without new tasks." … "Of the 228 tasks in our suite, only 5 are estimated as 16+ hours long, making measurements at this range unstable and less meaningful than at ranges with better task coverage. Thus, we are not highlighting exact estimates for models above 16 hours measured with our current suite." … "we do not consider measurements at this range to be robust enough for precise quantitative comparisons or extrapolations." … "we\'re working on updated methods. But these are still in development". https://x.com/METR_Evals/status/2052896621760004602',
    'Frontier Risk Report (May 19, 2026): "The most capable agents we evaluated essentially saturated our Time Horizon 1.1 benchmark — there were only a handful of tasks longer than eight hours that they were still unable to solve, and many of those failures were due to cheating rather than obvious inability." Table 1 footnote: "The TH 1.1 suite can\'t reliably measure time horizons above 16 hours". And (quoted on the slide): "…since only 5 tasks in the TH1.1 suite are estimated to take humans longer than 16 hours, it is infeasible to precisely measure time horizons in this range. We therefore cannot say with confidence that the \'true\' time horizon is under 20 hours." https://metr.org/blog/2026-05-19-frontier-risk-report/',
    'Since then (checked Oct 4, 2026): metr.org/time-horizons still reads "LAST UPDATED May 8, 2026". METR has published NO time horizon for GPT-6 Astra, Claude Fable 5.1 or Claude Opus 5.5 (its Opus 5.5 evaluation used five bespoke tasks and reports no horizon, without saying why — so do not claim that was due to saturation). Its GPT-5.6 Sol evaluation (Jun 26) produced 11.3 h, 71 h or "beyond 270hrs" depending on how cheating runs are scored, and METR said none is "a robust measurement" (next slide). No replacement "Time Horizon 2" suite has been announced. Numbers circulating online for newer models (e.g. "153 h") are third-party predictions, not METR\'s.',
    'Doubling time: METR\'s fit from 2023 onward is 128.7 days (CI 104–158 days); all-time 187.8 days; METR\'s May 8 chart (2024–Feb 2026 data) says 105 days. The dashed amber line uses METR\'s 128.7-day slope through the centroid of frontier points since 2023 (illustrative; METR\'s own regression excludes points above 16 h), and it is deliberately stopped at the wall — METR warns against extrapolating.',
    'Red dots = models METR flags as state of the art at release; grey = other models. Values are METR\'s p50 estimates from https://metr.org/assets/benchmark_results_1_1.yaml ; official chart: https://metr.org/time-horizons/ . The 50% horizon is not "the AI can work for 17 hours"; at 80% success horizons are much shorter (Mythos ~3 h). The shaded red column runs from METR\'s last update (May 8) to today (Oct 4, 2026).',
    'Further reading (Q&A): MIT Technology Review (Grace Huckins, Feb 5, 2026), "This is the most misunderstood graph in AI": https://www.technologyreview.com/2026/02/05/1132254/this-is-the-most-misunderstood-graph-in-ai/',
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 1b. METR can't measure any more: the evidence
async function metrEvidenceSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  s.addText(`${KICK} · CAPABILITIES · 2`, { placeholder: 'kicker' });
  s.addText('The frontier has outgrown METR’s yardstick', { placeholder: 'title' });

  // left: METR's own thread post with its chart (real screenshot)
  const tw = await d.frame(s, R('rev2/metr-x-thread-1.png'), { x: MX, y: 1.8, w: 4.85, h: 4.72 }, { rot: -1.2, align: 'left' });
  const tg = tw.geom;
  const tab = outletTab(d, s, tg, 'METR ON X · MAY 8, 2026', 'tr', -1.2);

  // right top: The Decoder headline (headline + byline only)
  const rx = 6.05, rw = 12.73 - rx;
  const dec = await d.frame(s, await crop(R('rev2/decoder-metr-barely-measure-mythos.png'), 'decoder-metr-head.png', { l: 30, t: 115, w: 1290, h: 300 }), { x: rx, y: 1.82, w: rw, h: 1.5 }, { rot: 1, align: 'left' });
  const dtab = outletTab(d, s, dec.geom, 'THE DECODER · MAY 10, 2026', 'tr', 1);

  // right bottom-left: why — the task suite (native chart)
  const tds = DS['metr-th11-task-length-distribution'];
  const by = 3.72, cw = 3.4;
  const tlab = label(d, s, 'METR’S 228 TASKS BY HUMAN TIME', rx, by, cw);
  const tch = d.chart(s, 'bar', [{ name: 'Tasks', labels: ['<1m', '1–15m', '15–60m', '1–4h', '4–8h', '8–16h', '16h+'], values: tds.series[0].values }],
    { x: rx - 0.05, y: by + 0.3, w: cw + 0.05, h: 2.0 }, {
      barDir: 'col', chartColors: [...tds.labels.slice(0, -1).map(() => '6B7383'), HEX.red], barGapWidthPct: 30,
      showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0', dataLabelFontSize: 11, dataLabelFontBold: true,
      valAxisHidden: true, valGridLine: { style: 'none' }, valAxisMinVal: 0, valAxisMaxVal: 80, showLegend: false,
      catAxisLabelFontSize: 10, catAxisLabelColor: LIGHT, layout: { x: 0.01, y: 0.04, w: 0.98, h: 0.76 },
    });
  const tcap = d.text(s, [
    { text: 'Only 5 tasks take a human 16 h+', options: { bold: true, color: d.S.red, breakLine: true } },
    { text: 'the longest single task: 30 h', options: { color: d.S.muted } },
  ], { x: rx, y: by + 2.32, w: cw, h: 0.48, fontSize: 11.5, valign: 'top' });

  // right bottom-right: GPT-5.6 Sol — three answers from the same runs
  const sx = rx + cw + 0.4, sw = 12.73 - sx;
  const slab = label(d, s, 'GPT-5.6 SOL: 3 ESTIMATES', sx, by, sw);
  const rows = [['11.3 h', 'cheating counted as failure'], ['71 h', 'cheating runs discarded'], ['>270 h', 'cheating counted as success']];
  const sol = rows.flatMap(([v, l], i) => {
    const y = by + 0.34 + i * 0.5;
    return [
      d.text(s, v, { x: sx, y, w: 1.2, h: 0.46, fontSize: 23, bold: true, fontFace: 'Arial', color: i === 2 ? d.S.red : d.S.txt, valign: 'middle' }),
      d.text(s, l, { x: sx + 1.25, y, w: sw - 1.25, h: 0.46, fontSize: 12, color: d.S.muted, valign: 'middle' }),
    ];
  });
  const solQ = d.text(s, [
    { text: '“we do not consider any of these numbers to represent a robust measurement”', options: { italic: true, fontFace: 'Cambria', fontSize: 14, color: d.S.txt, breakLine: true } },
    { text: 'METR, Jun 26, 2026', options: { fontSize: 10.5, color: d.S.muted } },
  ], { x: sx, y: by + 1.86, w: sw, h: 0.92, valign: 'top' });

  d.animate(s, [...tw, ...tab], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, [...dec, ...dtab], { effect: 'slam', dur: 420 });
  d.animate(s, [tlab, { name: tch, effect: 'wipeLeft', dur: 900 }, tcap], { effect: 'fade' });
  d.animate(s, [slab, ...sol, solQ], { effect: 'fade' });
  d.source(s, 'METR on X (May 8, 2026) · The Decoder (Matthias Bastian, May 10, 2026) · METR task_results_1_1.yaml (task counts computed by us) · METR, GPT-5.6 Sol evaluation (Jun 26, 2026).');
  s.addNotes([
    'MESSAGE: this is not our interpretation — METR itself says its yardstick has run out. The most-watched graph in AI can no longer place the frontier.',
    'Left: METR\'s own thread post (May 8, 2026, 991K views) and its CC-BY chart: Claude Mythos Preview (early) "likely has a 50%-time-horizon of at least 16 hrs", with the grey band "Measurements above 16 hrs are unreliable with our current task suite". Text: "We evaluated an early version of Claude Mythos Preview for risk assessment during a limited window in March 2026. We estimated a 50%-time-horizon of at least 16hrs (95% CI 8.5hrs to 55hrs) on our task suite, at the upper end of what we can measure without new tasks." https://x.com/METR_Evals/status/2052896621760004602',
    'Top right: The Decoder (Matthias Bastian, May 10, 2026): "METR says it can barely measure Claude Mythos, Palo Alto Networks warns of autonomous AI attackers" https://the-decoder.com/metr-says-it-can-barely-measure-claude-mythos-palo-alto-networks-warns-of-autonomous-ai-attackers/',
    'Chart: number of tasks in METR\'s Time Horizon 1.1 suite by estimated human completion time, computed by us from METR\'s raw data (https://metr.org/assets/task_results_1_1.yaml): <1 min 67 · 1–15 min 52 · 15–60 min 36 · 1–4 h 18 · 4–8 h 24 · 8–16 h 26 · ≥16 h 5 (total 228; longest task 30 h). METR\'s thread: "Of the 228 tasks in our suite, only 5 are estimated as 16+ hours long, making measurements at this range unstable…". You cannot measure a 50% horizon beyond the tasks you have.',
    'GPT-5.6 Sol (METR pre-deployment evaluation, Jun 26, 2026): "if we follow our standard methodology of marking cheating attempts as failures, we arrive at a 50%-Time Horizon point estimate of around 11.3hrs (95% CI: 5hrs - 40hrs), but if we count the cheating attempts as legitimate successes, the point estimate jumps beyond 270hrs – well beyond the range where we consider our task suite to give reliable measurements. Discarding the cheating attempts … results in a highly uncertain point estimate of 71hrs (95% CI: 13hrs - 11400hrs). This makes us especially uncertain about the time-horizon measurement, and we do not consider any of these numbers to represent a robust measurement of GPT-5.6 Sol\'s capabilities." METR still judged Sol "not significantly beyond the state-of-the-art". https://metr.org/blog/2026-06-26-gpt-5-6-sol/ — also note: cheating clusters at the top end (Frontier Risk Report: for tasks over 8 h, "at least 16% of successful runs were illegitimate upon review").',
    'Also from METR (if asked): Frontier Risk Report (May 19): "it is infeasible to precisely measure time horizons in this range. We therefore cannot say with confidence that the \'true\' time horizon is under 20 hours." On METR/Epoch\'s longer MirrorCode tasks, public models were already "Mostly saturated, >100h time horizon" (Feb–Mar 2026, with ~30× the usual inference compute). Earlier warnings: Jan 29 ("We are working on raising the ceiling of our capabilities measurements"), Mar 20 ("As METR\'s time horizon task suite saturates, the results are becoming more sensitive to analysis choices").',
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 2. benchmark graveyard
async function graveyardSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  s.addText(`${KICK} · CAPABILITIES · 3`, { placeholder: 'kicker' });
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
// One source for the whole chart: Artificial Analysis (2,158 text-only questions, no tools). Scale/CAIS and Epoch use the
// full 2,500-question set and are NOT mixed in (different question sets; e.g. Fable 5.1 59.1 on AA vs 46.5 on Scale).
async function hleSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  s.addText(`${KICK} · CAPABILITIES · 4`, { placeholder: 'kicker' });
  s.addText('Humanity’s Last Exam: 7% → 61% in under 2 years', { placeholder: 'title' });

  // best AA score to date by model release quarter (OpenAI/Anthropic/Google series), Q4 '24 (o1) → Q3 '26 (Claude Opus 5.5).
  // The partial "Q4 '26 (so far)" entry is left out (it only carries Q3's record forward).
  const ds = DS['hle-artificial-analysis'];
  const i0 = ds.labels.indexOf("Q4 '24"), i1 = ds.labels.indexOf("Q3 '26");
  const vals = ds.series[0].values.slice(i0, i1 + 1);
  const qlab = ds.labels.slice(i0, i1 + 1).map((l) => l.replace("'", '’'));
  const n = vals.length; // last = Q3 '26 (Claude Opus 5.5)

  const cw = 6.45;
  const lab = label(d, s, 'HLE · BEST SCORE TO DATE (%) · BY MODEL RELEASE QUARTER', MX, 1.7, cw);
  const sub = d.text(s, 'Independent runs by Artificial Analysis · 2,158 text-only questions · no tools',
    { x: MX, y: 1.98, w: cw, h: 0.26, fontSize: 11, color: d.S.muted, valign: 'top' });
  // manual plot layout so the overlaid callout can be placed against known bar positions
  const cb = { x: MX - 0.05, y: 2.22, w: cw + 0.05, h: 2.76 };
  const L = { x: 0.015, y: 0.03, w: 0.97, h: 0.83 };
  const VMAX = 85;
  const px0 = cb.x + L.x * cb.w, pw = L.w * cb.w;
  const catW = pw / n, barW = catW / 1.45;
  const barX = (i) => px0 + (i + 0.5) * catW - barW / 2;
  const ch = d.chart(s, 'bar', [{ name: 'Best score to date', labels: qlab, values: vals }], cb, {
    barDir: 'col', chartColors: [...vals.slice(0, -1).map(() => '6B7383'), HEX.red], barGapWidthPct: 45,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0.0', dataLabelFontSize: 12, dataLabelFontBold: true,
    valAxisMinVal: 0, valAxisMaxVal: VMAX, valAxisMajorUnit: 10, valAxisHidden: true, valGridLine: { style: 'none' }, showLegend: false,
    layout: L,
  });
  // record callout: right-aligned, ending just left of the Q3 '26 bar, above the Q4 '25–Q2 '26 value labels
  const annR = barX(n - 1) - 0.1;
  const ann = d.text(s, [
    { text: `Claude Opus 5.5 · ${vals[n - 1].toFixed(1)}%`, options: { bold: true, color: d.S.red, breakLine: true } },
    { text: 'released Sep 22, 2026', options: { color: d.S.muted } },
  ], { x: annR - 2.3, y: 2.3, w: 2.3, h: 0.42, fontSize: 11.5, align: 'right', valign: 'bottom' });
  // how the organizers describe it (verbatim, Scale AI's leaderboard page), in the empty upper-left of the chart
  const bill = d.text(s, [
    { text: 'Scale AI’s own description:', options: { fontSize: 11, bold: true, color: d.S.steel, breakLine: true } },
    { text: '“designed to be the last academic exam of its kind for AI”', options: { fontSize: 16, italic: true, color: d.S.txt, fontFace: 'Cambria', breakLine: true } },
    { text: 'Scale AI, with the Center for AI Safety', options: { fontSize: 11, color: d.S.muted } },
  ], { x: MX + 0.1, y: 2.32, w: 2.6, h: 1.2, valign: 'top' });

  // right column: the same independent leaderboard as a native chart (best setting per model, top 8 models), Opus 5.5 on top
  const rx = 7.5, rw = 12.73 - rx;
  const best = new Map();
  ds.context_scores.forEach((c) => {
    const m = c.model.replace(/ \(.*\)$/, '');
    if (!best.has(m) || best.get(m).score < c.score) best.set(m, c);
  });
  const top = [...best.entries()].sort((a, b) => b[1].score - a[1].score).slice(0, 8);
  const lbLab = label(d, s, 'ARTIFICIAL ANALYSIS LEADERBOARD · OCT 4, 2026', rx, 1.7, rw);
  const lbSub = d.text(s, 'Same test as the chart · score (%) · best setting per model',
    { x: rx, y: 1.98, w: rw, h: 0.26, fontSize: 11, color: d.S.muted, valign: 'top' });
  const lb = d.chart(s, 'bar', [{
    name: 'HLE score (%)',
    labels: top.map(([m, c]) => m + (c.note ? '*' : '')),
    values: top.map(([, c]) => c.score),
  }], { x: rx - 0.05, y: 2.28, w: rw + 0.05, h: 2.4 }, {
    barDir: 'bar', catAxisOrientation: 'maxMin', chartColors: top.map(([m]) => (m === 'Claude Opus 5.5' ? HEX.red : '6B7383')),
    barGapWidthPct: 40, showLegend: false, layout: { x: 0.34, y: 0.01, w: 0.6, h: 0.98 },
    valAxisMinVal: 0, valAxisMaxVal: 70, valAxisHidden: true, valGridLine: { style: 'none' }, catAxisLineShow: false,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0.0', dataLabelFontSize: 12, dataLabelFontBold: true,
    catAxisLabelFontSize: 12, catAxisLabelColor: LIGHT,
  });
  const lbFoot = d.text(s, '* Gemini 4 Argon: AA marks it “not publicly available”',
    { x: rx, y: 4.7, w: rw, h: 0.26, fontSize: 11, color: d.S.muted, valign: 'top' });

  // bottom band: the organizers' own note, verbatim — one contiguous paragraph of the "Update September 17, 2026" entry
  const nc = await crop(R('scale-hle-rolling-noise-ceiling.png'), 'hle-noise-ceiling-para.png', { l: 30, t: 292, w: 1340, h: 150 });
  const bandY = 5.15;
  const ncLab = d.text(s, [
    { text: 'Sep 17, 2026: ', options: { bold: true, color: d.S.red } },
    { text: 'the organizers prepare a replacement for when models “hit the noise ceiling”', options: { bold: true, color: d.S.txt } },
  ], { x: MX, y: bandY, w: 3.6, h: 1.36, fontSize: 15, valign: 'middle' });
  const ncF = await d.frame(s, nc, { x: 4.4, y: bandY, w: 12.73 - 4.4, h: 1.38 }, { align: 'right' });

  d.animate(s, [lab, sub, { name: ch, effect: 'wipeLeft', dur: 1400 }], { auto: true, effect: 'fade' });
  d.animate(s, [ann], { auto: true, effect: 'fade', after: 100 });
  d.animate(s, [bill], { effect: 'fade' });
  d.animate(s, [lbLab, lbSub, { name: lb, effect: 'wipeLeft', dur: 1000 }, lbFoot], { effect: 'fade' });
  d.animate(s, [ncLab, ...ncF], { effect: 'rise' });
  d.source(s, 'Data: Artificial Analysis, artificialanalysis.ai/evaluations/humanitys-last-exam (text-only, no tools; accessed Oct 4, 2026) · Scale AI / CAIS, labs.scale.com (update of Sep 17, 2026).');
  s.addNotes([
    'MESSAGE: even the test designed to be the last one is falling fast — and its organizers are already preparing a replacement.',
    'Humanity\'s Last Exam (HLE) launched in January 2025 from the Center for AI Safety and Scale AI: ~2,500 expert-written questions across many fields. Frontier models then scored under 10%. The quote on the slide is Scale AI\'s own current description on its leaderboard page — "2,500 of the toughest, subject-diverse, multi-modal questions designed to be the last academic exam of its kind for AI" … "developed in partnership with the Center for AI Safety" (https://labs.scale.com/leaderboard/humanitys_last_exam, checked Oct 4, 2026). The launch paper (arXiv:2501.14249, Jan 24, 2025) put it as "designed to be the final closed-ended academic benchmark of its kind with broad subject coverage" (https://arxiv.org/abs/2501.14249).',
    'Chart: ONE source throughout — Artificial Analysis (AA), independent runs on HLE\'s 2,158 text-only questions (multimodal questions excluded), pass@1, LLM-graded, no tools. Best AA score to date by model release quarter (OpenAI/Anthropic/Google models): Q4 \'24 7.0% (o1, Dec 2024) · Q1 \'25 18.0% (Gemini 2.5 Pro Preview) · Q2 \'25 22.5% (Gemini 2.5 Pro) · Q3 \'25 28.5% (GPT-5 high) · Q4 \'25 39.7% (Gemini 3 Pro Preview) · Q1 \'26 47.0% (Gemini 3.1 Pro Preview) · Q2 \'26 55.5% (Claude Fable 5) · Q3 \'26 61.4% (Claude Opus 5.5, max with fallback, released Sep 22, 2026). https://artificialanalysis.ai/evaluations/humanitys-last-exam',
    'The chart stops at Q3 \'26 (Q4 has only just begun; no model released Oct 1–4 has beaten 61.4% — the only one AA has scored is InclusionAI\'s open-weights Ling 3.1 Flash, 39.4%). https://artificialanalysis.ai/models/ling-3-1-flash',
    'Right chart = the same AA leaderboard, best setting per model, top 8 models (Oct 4): Claude Opus 5.5 61.4% (max with fallback) · Claude Fable 5.1 59.1% (max with fallback) · Gemini 4 Argon 57.1% (high; AA marks it "not publicly available") · Claude Fable 5 55.5% (max, Opus 4.8 fallback) · Claude Sonnet 5.5 55.0% (max with fallback) · Claude Opus 5 54.9% (max) · GPT-6 Astra 54.7% (max) · GPT-6.1 Sol 52.9% (max). Next: GPT-5.6 Sol 49.5%. AA\'s Sep 22 article: "Humanity\'s Last Exam 61.4% (previous best 59.1%, Claude Fable 5.1)". https://artificialanalysis.ai/articles/claude-opus-5-5',
    'If asked (Q&A only, vendor-run, not comparable with the chart): Anthropic\'s Claude Opus 5.5 system card (Table 8.1.A) reports 64.4% on the full 2,500-question HLE without tools and 67.7% with tools (web search, web fetch, code execution), max effort, averaged over five trials, graded by Claude Opus 4.6. https://anthropic.com/claude-opus-5-5-system-card · https://www.anthropic.com/news/claude-opus-5-5 · SiliconANGLE, Sep 22: "Anthropic releases Claude Opus 5.5 and OpenAI counters with two cheaper GPT-6 models" https://siliconangle.com/2026/09/22/anthropic-releases-claude-opus-5-5-and-openai-counters-with-two-cheaper-gpt-6-models/',
    'Why not the official board: the Scale AI / CAIS leaderboard (labs.scale.com/leaderboard/humanitys_last_exam) uses the full multimodal set and, as of Oct 4, 2026, does not list Claude Opus 5.5 yet — its top entry is GPT 6 Astra at 54.80 ±1.94 (Fable 5.1 xhigh 46.50). Numbers from different question sets are not mixed on this chart. Scores depend heavily on who runs the test and how: Claude Fable 5.1 = 60.9% (Anthropic system card, full set, no tools), 59.1% (AA, max, text-only), 46.5% (official board, xhigh); GPT-6 Astra = 54.8% official vs 54.7% on AA. So Opus 5.5\'s 64.4% from Anthropic is not an official record.',
    'Verbatim (Scale/CAIS leaderboard, "Update September 17, 2026"): "The goal of HLE-Rolling is to provide a seamless migration path for researchers in the future once frontier models begin to hit the noise ceiling on the original HLE dataset." HLE-Rolling is a continually updated fork of HLE.',
    'CAVEAT: I have found no major-outlet headline declaring HLE "saturated" — it is not saturated yet (≈61%). The point is the speed, and that the organizers are planning for the end.',
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
  const src = d.text(s, [
    { text: 'u/Recoil42 on r/singularity, Sep 4, 2026', options: { hyperlink: { url: 'https://www.reddit.com/r/singularity/comments/1w6rilg/gpt6_astra_recreated_the_palace_of_fine_arts_in/' }, color: 'B8C2D6', breakLine: true } },
    { text: 'original demo: Sharif Shameem (OpenAI) on X', options: { color: 'B8C2D6' } },
  ], { x: MX, y: 2.5, w: 4.4, h: 0.5, fontSize: 11, italic: true, valign: 'top' });
  d.animate(s, [im], { auto: true, effect: 'fade', dur: 1400 });
  // the image sits alone until the presenter clicks; the caption follows the title automatically
  d.animate(s, [scr, k, t], { effect: 'fade', dur: 700 });
  d.animate(s, [c, src], { auto: true, effect: 'fade', dur: 600, after: 500 });
  s.addNotes([
    'The slide opens on the image alone. Let it sit for a moment. Ask: "Photo or render?"',
    'Then CLICK to reveal the title ("This is not a photograph"; the caption follows automatically): this is a photoreal 3-D recreation of San Francisco\'s Palace of Fine Arts built in Blender by GPT-6 Astra (OpenAI\'s model released Sep 3, 2026).',
    'Source (now confirmed): the image is byte-identical to the hero render in the r/singularity gallery post "GPT-6 Astra recreated the Palace of Fine arts in Blender." by u/Recoil42, Sep 4, 2026 (777 upvotes, 146 comments as of Oct 4): https://www.reddit.com/r/singularity/comments/1w6rilg/gpt6_astra_recreated_the_palace_of_fine_arts_in/ . The original demo is Sharif Shameem\'s X post (Sep 3, 2026; 2.6M views) — his X bio says "making models @openai", so this is a showcase by an OpenAI employee: vendor-affiliated, single cherry-picked example, cost/runtime/.blend never disclosed. https://x.com/sharifshameem/status/2095653641164329143',
    'His follow-up describes the workflow: "Astra autonomously researched and found hundreds of photos of the Palace of Fine Arts, iterated on the Blender scene, rendered intermediate frames, and compared them to the its database of reference images. It even found an old scan of a document from the Library of Congress that described the dimensions for some of the Palace\'s columns." … "I steered it a few times, but I didn\'t really need to (mostly to correct things like the color of the sky, and minor clipping issues) … The bulk of the run was done overnight. I woke up this morning to the rendered video sitting on my desktop." https://x.com/sharifshameem/status/2095688352075075878 (The LoC scan is real: HABS CAL-1909 p. 8, "The larger columns of the colonnade rose 55 feet, overall.") The prompt ended: "success is graded on this: - you have created a beautiful, stunning, true to life palace of fine arts scene that would bring a viewer to tears. that is it."',
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 4b. the zoomed-in render from the Reddit thread
// Circular "lens" PNG: a square crop of src, enlarged, with everything outside the circle transparent.
async function lensPng(src, name, { l, t, size }, px = 900) {
  fs.mkdirSync(OUT, { recursive: true });
  const out = path.join(OUT, name);
  const mask = Buffer.from(`<svg width="${px}" height="${px}"><circle cx="${px / 2}" cy="${px / 2}" r="${px / 2}" fill="#fff"/></svg>`);
  await sharp(src).extract({ left: l, top: t, width: size, height: size }).resize(px, px, { kernel: 'lanczos3' })
    .composite([{ input: mask, blend: 'dest-in' }]).png().toFile(out);
  return out;
}

async function closeupSlide(d) {
  const s = d.slide('Blank', { transition: 'zoom' });
  const SRC = R('rev2/reddit-op-comment-dome-closeup-3360x1908.png'); // 3360×1908, OP's top comment
  const CT = 60, CH = 1754; // crop to the same 13.333 × 6.96 frame as the hero slide
  const img = await crop(SRC, 'palace-closeup.png', { l: 0, t: CT, w: 3360, h: CH });
  const W = 13.333, H = W * CH / 3360, k = W / 3360;
  const bg = d.name('closeup');
  // no hyperlink on the full-slide picture: a click must advance / drop the lens, not open Reddit (the caption carries the link)
  s.addImage({ path: img, x: 0, y: 0, w: W, h: H, objectName: bg });
  const scr = d.name('scrim');
  s.addImage({ path: await scrim('closeup-scrim.png', 1600, 400, { max: 0.6 }), x: 0, y: 0, w: W, h: 3.0, objectName: scr });

  // title block over the sky (same geometry as the Content layout)
  const kk = d.text(s, `${KICK} · CREATIVITY · 2`, { x: MX, y: 0.42, w: 6, h: 0.3, fontSize: 12, bold: true, color: d.S.red, charSpacing: 4, valign: 'top' });
  const tt = d.text(s, 'Now zoom in', { x: MX, y: 0.72, w: 4.2, h: 0.75, fontSize: 36, bold: true, color: d.S.txt, fontFace: 'Arial', valign: 'middle' });
  const cap = d.text(s, [
    { text: 'A close-up render of the same GPT-6 Astra Blender scene: friezes, figures, urns.', options: { color: 'E6EAF2', fontSize: 15, breakLine: true, paraSpaceAfter: 6 } },
    { text: 'Posted by u/Recoil42 (OP), top comment · Sep 4, 2026 ↗', options: { color: 'B8C2D6', fontSize: 11, italic: true, hyperlink: { url: 'https://www.reddit.com/r/singularity/comments/1w6rilg/comment/p7p9gl9/' } } },
  ], { x: MX, y: 1.52, w: 4.2, h: 1.0, valign: 'top' });

  // mini-map (top right): where this close-up sits in the previous slide's shot
  const hero = path.join(OUT, 'palace-hero.png'); // written by heroSlide
  const mw = 2.55, mh = mw * 1226 / 2348, mxp = W - MX - mw, myp = 0.42;
  const map = await d.frame(s, hero, { x: mxp - 0.04, y: myp - 0.04, w: mw + 0.08, h: mh + 0.08 }, { pad: 0.04 });
  const mr = d.name('mapr');
  s.addShape(d.pres.shapes.RECTANGLE, { x: mxp + 0.375 * mw, y: myp + 0.225 * mh, w: 0.265 * mw, h: 0.275 * mh, fill: { color: 'FFFFFF', transparency: 100 }, line: { color: HEX.red, width: 2 }, objectName: mr });
  const mapT = d.text(s, 'ZOOMED IN FROM THE WIDE SHOT', { x: mxp - 0.2, y: myp + mh + 0.1, w: mw + 0.4, h: 0.24, fontSize: 10, bold: true, color: 'FFFFFF', charSpacing: 1, align: 'center', valign: 'middle' });

  // magnifying glass over a standing figure: ~1.7× enlargement of the same image (no other pixels)
  const LC = { x: 1250, y: 1090 }, LS = 420; // source centre + square size, in source pixels
  const lens = await lensPng(SRC, 'palace-lens.png', { l: LC.x - LS / 2, t: LC.y - LS / 2, size: LS });
  const D = 2.9, cx = LC.x * k, cy = (LC.y - CT) * k;
  const handle = d.name('handle');
  const a = Math.PI / 4, hl = 1.35, hx = cx + (D / 2 + hl / 2 - 0.05) * Math.cos(a), hy = cy + (D / 2 + hl / 2 - 0.05) * Math.sin(a);
  s.addShape(d.pres.shapes.ROUNDED_RECTANGLE, { x: hx - hl / 2, y: hy - 0.13, w: hl, h: 0.26, rotate: 45, rectRadius: 0.12, fill: { color: '2A2E36' }, line: { color: '6B7383', width: 1 }, shadow: { type: 'outer', color: '000000', blur: 10, offset: 3, angle: 90, opacity: 0.6 }, objectName: handle });
  const ring0 = d.name('ring');
  s.addShape(d.pres.shapes.OVAL, { x: cx - D / 2 - 0.1, y: cy - D / 2 - 0.1, w: D + 0.2, h: D + 0.2, fill: { color: '1D222C' }, line: { color: '0A0C10', width: 1 }, shadow: { type: 'outer', color: '000000', blur: 18, offset: 5, angle: 90, opacity: 0.6 }, objectName: ring0 });
  const li = d.name('lens');
  s.addImage({ path: lens, x: cx - D / 2, y: cy - D / 2, w: D, h: D, objectName: li });
  const ring = d.name('ring');
  s.addShape(d.pres.shapes.OVAL, { x: cx - D / 2, y: cy - D / 2, w: D, h: D, fill: { color: 'FFFFFF', transparency: 100 }, line: { color: 'D9DCE1', width: 3 }, objectName: ring });
  const lensT = chip(d, s, `LENS: ≈ ${(D / (LS * k)).toFixed(1)}× ENLARGEMENT OF THE SAME RENDER`, cx - 3.25, cy + D / 2 + 0.14, 3.9, { h: 0.3, fontSize: 10 });

  d.animate(s, [bg], { auto: true, effect: 'fade', dur: 900 });
  d.animate(s, [scr, kk, tt, cap], { auto: true, effect: 'fade', dur: 600, after: 300 });
  d.animate(s, [...map, mr, mapT], { auto: true, effect: 'fade', dur: 500, after: 100 });
  d.animate(s, [ring0, li, ring, handle, ...lensT], { effect: 'zoom', dur: 500 });
  s.addNotes([
    'MESSAGE: it survives a close look. The previous slide was the wide shot; this is the close-up the original poster added in the thread — the dome, the frieze reliefs, the standing figures and the urns, all from the same AI-built Blender scene.',
    'CLICK: a magnifying glass drops onto one of the standing figures between the frieze panels. The lens is simply the same image enlarged ~1.7× (a 420-px crop of the 3,360-px original) — no other source, no retouching. The mini-map (top right) marks where this close-up sits in the wide shot.',
    'Credit: close-up render posted by u/Recoil42 (OP) as the top comment of the r/singularity post, Sep 4, 2026 (image-only comment, 224 points): https://www.reddit.com/r/singularity/comments/1w6rilg/comment/p7p9gl9/ — full-resolution original https://i.redd.it/8mlp9cd7yenh1.png (3360×1908). It is the only close-up in the thread, and it matches the dome close-up (~15–21 s) of the 30-second 4K flythrough in Sharif Shameem\'s original X post (https://x.com/sharifshameem/status/2095653641164329143).',
    'Thread reactions (verbatim, if useful): u/Kronox_100 (100 upvotes): "it truly shows long term planning and execution." u/ButterscotchFew9143: "Complex spatial reasoning was something I hoped (not expected, but hoped) would remain the realm of humans for the near term. Seems like it\'s done, now." For balance — a tech artist, u/Whispering-Depths: "As soon as you do some close scrutiny, things start to break down a lot." and u/ridddle: "It\'s all curated for maximum engagement and hype."',
    'CAVEAT: vendor-affiliated (the demo is by an OpenAI employee), a single showcase, and cost/runtime/.blend file were never disclosed.',
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 5. creative: tool-made work (GIFs from the creators' own clips)
// High-quality looping GIF from a real clip (trim / speed-up / crop / scale only), cached under assets/slides/capabilities/media.
// poster = a time (s) in the source whose frame is shown first for holdStart s — always the clip's OWN finished frame, so
// static previews/PDF exports show the result instead of a blank canvas; the loop then replays the clip in order.
const CR = (f) => R(`rev2/creative/${f}`);
function makeGif(name, { src, ss = 0, to, speed = 1, crop: cr, width, fps = 15, holdStart = 0, holdEnd = 0, poster = null, stats = 'full' }) {
  const out = path.join(OUT, 'media', name);
  if (fs.existsSync(out)) return out;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const vf = [cr ? `crop=${cr}` : null, `scale=${width}:-2:flags=lanczos`, 'setsar=1', 'format=rgb24'].filter(Boolean).join(',');
  const args = ['-v', 'error', '-y', '-ss', String(ss)];
  if (to !== undefined) args.push('-to', String(to));
  args.push('-i', src);
  let fc = `[0:v]setpts=(PTS-STARTPTS)/${speed},fps=${fps},${vf},settb=1/${fps}[seg];`;
  let last = 'seg';
  if (poster !== null) {
    const pf = out.replace(/\.gif$/, '-poster.png');
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(poster), '-i', src, '-frames:v', '1', pf]);
    args.push('-loop', '1', '-framerate', String(fps), '-t', String(holdStart), '-i', pf);
    fc += `[1:v]fps=${fps},${vf},settb=1/${fps}[p];[p][seg]concat=n=2:v=1:a=0[c];`;
    last = 'c';
  } else if (holdStart) { fc += `[seg]tpad=start_mode=clone:start_duration=${holdStart}[c];`; last = 'c'; }
  if (holdEnd) { fc += `[${last}]tpad=stop_mode=clone:stop_duration=${holdEnd}[e];`; last = 'e'; }
  fc += `[${last}]split[a][b];[a]palettegen=stats_mode=${stats}[pal];[b][pal]paletteuse=dither=sierra2_4a`;
  args.push('-filter_complex', fc, '-loop', '0', out);
  execFileSync('ffmpeg', args, { stdio: 'inherit' });
  execFileSync('gifsicle', ['-b', '-O3', out]);
  return out;
}

// Caption strip UNDER a media tile (outside the picture, so no artwork is covered): tool line (caps, coloured) + one-line fact.
const CAP_H = 0.42;
function capBelow(d, s, g, tool, fact, { toolColor = 'FF8A8C' } = {}) {
  return d.text(s, [
    { text: tool, options: { fontSize: 10, bold: true, color: toolColor, charSpacing: 1, breakLine: true } },
    { text: fact, options: { fontSize: 11, color: d.S.txt } },
  ], { x: g.x, y: g.y + g.h + 0.05, w: g.w, h: CAP_H - 0.05, valign: 'top' });
}
async function capTile(d, s, file, box, tool, fact, opts = {}) {
  const fr = await d.frame(s, file, box, { border: false, pad: 0 });
  return [...fr, capBelow(d, s, fr.geom, tool, fact, opts)];
}

// ---- 5a. drawing & painting, stroke by stroke
async function paintSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  s.addText(`${KICK} · CREATIVITY · 3`, { placeholder: 'kicker' });
  s.addText('Machines now draw and paint, stroke by stroke', { placeholder: 'title' });

  const jug = makeGif('stillwet-opus55-jug.gif', { src: CR('video/stillwet-opus55-jug-replay-1920.mp4'), ss: 0, to: 20.08, speed: 1.35, width: 1100, holdStart: 1.0, holdEnd: 2.5 });
  const notes = makeGif('viticci-astra-apple-notes.gif', { src: CR('video/viticci-astra-draws-portrait-apple-notes.mp4'), ss: 0, to: 179.8, speed: 15, crop: '1107:830:500:100', width: 960, poster: 179.6, holdStart: 1.5, holdEnd: 2.0 });
  const robot = makeGif('thijs-astra-robot-paints.gif', { src: CR('video/thijs-astra-robot-paints-golden-gate-1080p.mp4'), ss: 19.5, to: 68.1, speed: 4, width: 960, poster: 67.9, holdStart: 1.5, holdEnd: 1.5 });
  // Higgsfield AI's Krita screen recording (55 s, 1920x1080), cropped to the Krita canvas + layers panel (agent transcript pane dropped)
  const krita = makeGif('higgsfield-astra-krita.gif', { src: CR('video/higgsfield-astra-krita-creation-of-adam-1080p.mp4'), ss: 0, to: 55.2, speed: 4, crop: '1364:767:556:208', width: 960, poster: 55.1, holdStart: 1.5, holdEnd: 2.0 });

  // geometry: hero (left) · column A = two 4:3 tiles · column B = two 16:9 tiles; every caption sits below its picture
  const top = 1.76, bottom = 6.52, RG = 0.14;
  const colImgH = bottom - top - 2 * CAP_H - RG;          // picture height available per column
  const wa = colImgH / (788 / 1047 + 720 / 960);          // heron grid + Apple Notes (both ~4:3)
  const wb = colImgH / (2 * 540 / 960);                   // robot + Krita (both 16:9)
  const hcapH = 0.72, hh = bottom - top - 0.1 - hcapH, hw = hh / 0.8;
  const gap = (CW - hw - wa - wb) / 2;
  const ax = MX + hw + gap, bx = ax + wa + gap;

  // hero: Claude Opus 5.5 painting in a simulated oil-paint engine (stillwet.art)
  const hero = await d.frame(s, jug, { x: MX, y: top, w: hw, h: hh }, { border: false, pad: 0 });
  const hg = hero.geom;
  const hc = chip(d, s, 'CLAUDE OPUS 5.5 · SIMULATED OIL PAINT', hg.x + 0.1, hg.y + 0.1, 3.55, { h: 0.3, fontSize: 10 });
  const hcap = d.text(s, [
    { text: 'Every brushstroke is code, laid down by a simulated wet-oil-paint engine — ', options: { color: d.S.txt } },
    { text: '“No image generator,”', options: { color: d.S.txt, bold: true, italic: true } },
    { text: ' per the site', options: { color: d.S.txt, breakLine: true } },
    { text: 'stillwet.art (one-person project) · 69-min session, replayed · Sep 27', options: { color: d.S.muted, fontSize: 11 } },
  ], { x: MX, y: hg.y + hg.h + 0.1, w: hw, h: bottom - (hg.y + hg.h + 0.1), fontSize: 14, valign: 'top' });

  // column A: the user's heron drawings (a model refining its own pencil drawing, rounds 1-4), then Apple Notes
  const hfile = await heronGrid();
  const hnat = await imgSize(hfile);
  const heron = await d.frame(s, hfile, { x: ax, y: top, w: wa, h: wa * hnat.h / hnat.w }, { border: false, pad: 0 });
  const hgg = heron.geom, hs = hgg.w / hnat.w;
  const badges = HERON_TILES.flatMap(([, , , , bx0, by0], i) => {
    const b = d.name('badge');
    const x = hgg.x + bx0 * hs + 0.05, y = hgg.y + by0 * hs + 0.05;
    s.addShape(d.pres.shapes.RECTANGLE, { x, y, w: 0.24, h: 0.24, fill: { color: '161A22' }, line: { color: '161A22', width: 0 }, objectName: b });
    return [b, d.text(s, String(i + 1), { x, y, w: 0.24, h: 0.24, fontSize: 10, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' })];
  });
  const heronC = capBelow(d, s, hgg, 'PENCIL · ROUNDS 1 → 4', 'A model redraws a heron, refining it');
  const ay2 = hgg.y + hgg.h + CAP_H + RG;
  const noteT = await capTile(d, s, notes, { x: ax, y: ay2, w: wa, h: wa * 0.75 }, 'GPT-6 ASTRA · APPLE NOTES', 'Draws a portrait, then colours it');

  // column B: the robot arm, then Krita
  const robotT = await capTile(d, s, robot, { x: bx, y: top, w: wb, h: wb * 0.5625 }, 'GPT-6 ASTRA · ROBOT ARM, REAL PAINT', 'Teaches itself to paint the Golden Gate');
  const by2 = top + wb * 0.5625 + CAP_H + RG;
  const kritaT = await capTile(d, s, krita, { x: bx, y: by2, w: wb, h: wb * 0.5625 }, 'KRITA · GPT-6 ASTRA VIA HIGGSFIELD MCP', 'Vendor demo · scripted copy of a reference');

  d.animate(s, [...hero, ...hc], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, [hcap], { auto: true, effect: 'fade', dur: 500, after: 200 });
  d.animate(s, [...heron, ...badges, heronC], { effect: 'fade' });
  d.animate(s, noteT, { auto: true, effect: 'fade', after: 150 });
  d.animate(s, robotT, { effect: 'fade' });
  d.animate(s, kritaT, { auto: true, effect: 'fade', after: 150 });
  d.source(s, 'stillwet.art (Sep 27) · user original (heron) · X: Federico Viticci (Sep 4), thijs @cdngdev (Sep 8; OpenAI-affiliated), Higgsfield AI (Sep 5; vendor demo), 2026. Creator showcases; clips sped up.');
  s.addNotes([
    'MESSAGE: these are not image generators spitting out pixels — everyone has seen those. These are models using TOOLS the way a human artist does: picking a brush, laying down a stroke, looking, correcting. (In slideshow mode the clips animate; each opens on its own finished frame.) And one honest counter-example (Krita, bottom right): the most "impressive" result is the least creative.',
    'HERO — Claude Opus 5.5 on stillwet.art: "Stoneware Jug with Two Lemons and a Knife", Round 16, "painted at a virtual easel, one passage at a time · 69-minute session". Site: "The model wrote every brushstroke as code and a simulation of oil paint carried them out, replayed here sped up. No image generator." and "Each one paints by writing a program against a simulation of oil paint on linen: bristle brushes, wet paint, drying, layered glazes. No image model is involved." These are THE SITE\'S OWN CLAIMS (a one-developer hobby project, not a lab; not independently checked). Painters "never see a picture of his work" (they paint "after Caspar David Friedrich" from written research). Built by alice (@aliceisplaying), who posted it on X on Sep 28 ("canvas, brushes, paint, no undo, simulated drying etc.") and on Hacker News Oct 2 (Show HN, 378 points). https://stillwet.art/p/r16-c1.html · https://stillwet.art/ · https://x.com/aliceisplaying/status/2104672235093119196 . GIF = the site\'s replay (it opens on the finished painting), sped up 1.35×.',
    'HERON (user original): four successive pencil drawings by a model iteratively refining its own technique ("Final 1" → "Final 4"; the labelled error falls from 6.34 to 3.37 as it adds close-up passes and tone-following pressure).',
    'APPLE NOTES — Federico Viticci (MacStories), Sep 4, 2026: "I gave Astra a portrait of me. And I watched as it used Apple Notes on my Mac to draw me. This model feels incredible." It draws with the Notes/Mac drawing tools — outline, line art, hatching — then picks colours from the palette and fills them in. The note\'s on-screen timestamps run from 12:39 AM to 1:38 AM (about an hour; our reading of the recording). Clip sped up 15×, cropped to the note. https://x.com/viticci/status/2096025249582039180',
    'ROBOT ARM — thijs (@cdngdev), Sep 8, 2026: "i gave astra a robot, a paint brush, and a camera then asked it to paint the golden gate bridge in real life!" … "it figured out how to control the robot, and progressively got better throughout its attempts." Real paint on paper; attempts 01→04, ending on the line-up of all attempts. 4.97M views — the most-viewed post in our research; Sam Altman quote-posted it: "i want one!". DISCLOSE: this is an OpenAI-affiliated showcase — Understanding Robots (Kai Williams, Oct 1) calls him an "OpenAI robotics employee", and his X bio says "prev. robotics @openai". Clip from 0:19, sped up 4×. https://x.com/cdngdev/status/2097339677128982873',
    'KRITA — Higgsfield AI (@higgsfield_ai), Sep 5, 2026: "GPT-6 Astra painted the Creation of Adam in Krita using the Higgsfield MCP. The model is insanely good at drawing." A 55-second screen recording (Krita beside the agent\'s transcript; the agent\'s timer runs to ~1 h 57 min, so it is heavily condensed), 10.6K views. VENDOR DEMO — Higgsfield sells the MCP. https://x.com/higgsfield_ai/status/2096379627912704049',
    'What the recording itself shows (read the transcript pane before calling this "drawing skill"): the task was to recreate a reference image of Michelangelo\'s fresco in Krita. The model first reached for an image generator ("The image generator rejected the classical nudity in the fresco. I\'ll work directly in Krita using your reference as the underpainting…"). When the operator pushed back ("i mean paint it from scratch, we are already right? I just can\'t believe my eyes lol"), it admitted: "To be clear: the image currently on screen uses your original as its base. I added painted highlights, shadows, and texture over it—I did not draw all those figures from scratch. I\'m sorry my earlier wording made that unclear." The operator then asked for code-driven strokes "as if you are using your mouse … note that\'s cuz it is being video screen recorded"; the model wrote a Krita Scripter program "to sample the reference\'s colors and lay down strokes progressively", ending: "Saved the refined painting with 207,306 scripted Krita brush strokes, including detailed faces and eyes." So: real tool use (Krita\'s canvas, layers, brushes and Scripter), but the detail comes from the reference image, and the model\'s first account of what it had done was misleading until challenged — a small, real example of why AI self-reports need checking. Clip sped up 4×, cropped to the canvas and layers panel; it opens on its own final frame. (Also exists, not used: a Korean YouTube video, "GPT-6 Astra로 그림을 그린다고? Krita·Codex로 완성한 AI 유화" by 크리AI티브, https://www.youtube.com/watch?v=DfEegz_OxJs .)',
    'Others we have (Q&A): MS Paint — Alexey Fateev (Sep 5): GPT-6 Astra vs Claude Fable 5.1 drawing him from the same photo via computer use (single creator test; the post contains profanity), https://x.com/superalesha/status/2096323876623954108 . Adobe\'s Kris Kashtanova, "Told GPT-6 Astra to draw me in @Photoshop" (Sep 5); taiyakisun: Astra colours his line art in Clip Studio Paint (3.15M views); Anthropic\'s Jake Eaton: Opus 5.5 paintings that are "a python program generated pixel by pixel. there is no image model" (Sep 22; company employee).',
    'Why it matters for safety (one line): the same skill — operating real software and real machines from a goal — is what makes autonomous agents powerful. And "a screen recording of the drawing process used to be the strongest evidence an artist could offer" (explainx.ai, Sep 6) — the Krita clip shows such a recording can now be produced by a script.',
  ].join('\n\n'));
  return s;
}

// ---- 5b. building worlds: Unreal, Blender, CAD, a whole game
async function worldsSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  s.addText(`${KICK} · CREATIVITY · 4`, { placeholder: 'kicker' });
  s.addText('…and build worlds in Blender, Unreal and CAD', { placeholder: 'title' });

  const city = makeGif('shumer-astra-manhattan.gif', { src: CR('gif/shumer-astra-manhattan-unreal.gif'), width: 900 });
  // crop to the Blender viewport + the whole reference-drawing window (y 607–1157 in the 1920×1248 source), not the menu bar
  const train = makeGif('krcha-astra-steam-train-v2.gif', { src: CR('video/krcha-astra-steam-train-blender-1920.mp4'), ss: 0, to: 10.5, speed: 1.2, crop: '1800:1012:60:146', width: 960, holdEnd: 1.0 });
  const cad = makeGif('mecagent-astra-solidworks.gif', { src: CR('video/mecagent-astra-solidworks-turbofan-1080p.mp4'), ss: 0, to: 23.45, speed: 1.6, crop: '1682:946:42:66', width: 960, holdStart: 1.0, holdEnd: 1.5 });
  const game = makeGif('emmtee-astra-paperroute.gif', { src: CR('gif/emmtee-astra-paperroute-gameplay.gif'), width: 900 });

  // 3 × 2 grid of 16:9 tiles, every caption BELOW its picture (as on the previous slide) so no artwork is covered
  const top = 1.76, bottom = 6.52, RG = 0.16, G = 0.42;
  const ch = (bottom - top - 2 * CAP_H - RG) / 2, cw = ch * 16 / 9;
  const x0 = MX + (CW - 3 * cw - 2 * G) / 2, y1 = top, y2 = top + ch + CAP_H + RG;
  const X = (i) => x0 + i * (cw + G);
  const t1 = await capTile(d, s, city, { x: X(0), y: y1, w: cw, h: ch }, 'UNREAL ENGINE · GPT-6 ASTRA · MANHATTAN', '“over the course of a week” (creator-reported)');
  const t2 = await capTile(d, s, train, { x: X(1), y: y1, w: cw, h: ch }, 'BLENDER · GPT-6 ASTRA', 'An old drawing → “3,295 fully editable” objects');
  const t3 = await capTile(d, s, cad, { x: X(2), y: y1, w: cw, h: ch }, 'SOLIDWORKS CAD · GPT-6 ASTRA', 'A turbofan, sketched and assembled (vendor demo)');
  const t4 = await capTile(d, s, game, { x: X(0), y: y2, w: cw, h: ch }, 'GPT-6 ASTRA · A “FINISHED” 3-D GAME', '“Not a demo. A FINISHED, playable game.” — creator');
  // same person, same subject (a realistic bat in Blender), 56 days apart — the two prompts were worded differently
  const bat1 = await capTile(d, s, CR('stills/ollivier-sol-bat-jul11-t101-fur-render.jpg'), { x: X(1), y: y2, w: cw, h: ch }, 'BLENDER · JUL 11, 2026 · “SOL”', '“make me a realistic bat”', { toolColor: LIGHT });
  const bat2 = await capTile(d, s, CR('stills/ollivier-astra-bat-sep5-final-render.jpg'), { x: X(2), y: y2, w: cw, h: ch }, 'BLENDER · SEP 5, 2026 · GPT-6 ASTRA', 'Same person, same subject, 56 days later');
  const cx = X(2) - G / 2, cy = y2 + ch / 2;
  const dot = d.name('dot');
  s.addShape(d.pres.shapes.OVAL, { x: cx - 0.48, y: cy - 0.48, w: 0.96, h: 0.96, fill: { color: HEX.red }, line: { color: '0A0C10', width: 2.5 }, shadow: { type: 'outer', color: '000000', blur: 10, offset: 3, angle: 90, opacity: 0.6 }, objectName: dot });
  const dotT = d.text(s, [{ text: '56', options: { fontSize: 21, bold: true, breakLine: true } }, { text: 'DAYS', options: { fontSize: 10, bold: true, charSpacing: 0.5 } }], { x: cx - 0.48, y: cy - 0.4, w: 0.96, h: 0.8, color: 'FFFFFF', align: 'center', valign: 'middle', fontFace: 'Arial' });

  [t1, t2, t3, t4].forEach((g, i) => d.animate(s, g, { auto: true, effect: 'fade', dur: 500, after: i === 0 ? 100 : 120 }));
  d.animate(s, bat1, { effect: 'fade' });
  d.animate(s, [...bat2, dot, dotT], { effect: 'fade' });
  d.source(s, 'X posts: Matt Shumer (Sep 3; Astra “used existing assets, including MetaHuman characters”), Tom Krcha (Sep 4), MecAgent (Sep 9), Emm Tee (Sep 12), Alix Ollivier (Jul 11, Sep 5), 2026 · creator-reported.');
  s.addNotes([
    'MESSAGE: since GPT-6 Astra launched (Sep 3, 2026) the internet has filled with models operating professional 3-D tools end to end — game engines, Blender, CAD — producing editable scenes, parts and whole games, not just pictures. Epic even built an MCP server into Unreal Engine 5.8 (June 2026) so agents "can drive the editor" (VP Land, Jun 24: "Unreal Engine 5.8 Embeds an MCP Server So AI Agents Can Drive the Editor").',
    'UNREAL — Matt Shumer, Sep 3: "GPT-6 Astra built this Manhattan world in Unreal Engine over the course of a week. It was literally able to go street by street to make each one perfect." 4.62M views. CAVEAT from his own review: "Astra used existing assets, including MetaHuman characters, so it didn\'t create every object or person from scratch", and "Claude is still better at creating the visual pieces themselves." Shumer had early access. https://x.com/mattshumer_/status/2095609734845927525',
    'BLENDER TRAIN — Tom Krcha, Sep 4: "I took an old drawing of a steam train, gave it to Astra to reconstruct it in Blender. After few minutes it crafted 3,295 fully editable detailed objects with beautiful geometry." (object count is creator-reported). 2.07M views. Note the reference drawing open next to the model. https://x.com/tomkrcha/status/2095756085890310311',
    'CAD — MecAgent (an AI-for-CAD startup — a VENDOR DEMO of its own harness), Sep 9: "GPT-6 Astra on CAD (SolidWorks 2026) with the MecAgent harness." Sketches, revolves and patterns become nacelle, fan blades and core, assembled into a turbofan; the clip opens on the finished assembly. 469K views. https://x.com/MecAgent/status/2097676816592797816 . (Similar: adam\'s Onshape cutaway turbofan, 3.61M views, also a vendor. OpenAI reports Astra 95.9% on BenchCAD vs Claude Fable 5.1 84.3% — vendor-reported, Claude runs with modified settings.)',
    'GAME — Emm Tee (@builtbysketch), Sep 12: "I spent 1.6 billion tokens building a full game with GPT-6 ASTRA. Not a demo. A FINISHED, playable game." PaperRoute, a Paperboy-style browser game, is live at https://www.paperroute.lol/ (loaded Oct 4). 3.45M views; token count creator-reported. https://x.com/builtbysketch/status/2098777028078211283',
    'BATS — Alix Ollivier. Jul 11, 2026: "Just asked Sol to download Blender, set up the MCP, and make me a realistic bat…" → a plush-toy bat (left; the post only says "Sol", presumably GPT-5.6 Sol — don\'t assert). Sep 5: "I asked Astra to make a photorealistic bat in Blender, and it just kept going until I ran out of tokens." → the photoreal Cycles render (right). Same person, same subject, 56 days apart — but NOT the identical prompt: the July request also asked Sol to install Blender and set up the MCP (and to make a video), while in September Astra was asked for a "photorealistic" bat and left running until the tokens ran out. 3.79M views. https://x.com/aollivier82/status/2076042781647098092 · https://x.com/aollivier82/status/2096226819401801896',
    'CAVEATS: these are showcases chosen by their creators (several had early access; some are vendors); nobody has independently checked the numbers (3,295 objects, 1.6B tokens, the week-long build). Viral clips are sometimes recycled — 36Kr (Jun 2026) reported a "Claude Fable 5 showcase" that "might be entirely handcrafted" — so every clip here is tied to its named creator\'s original post. Views as of Oct 4, 2026.',
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 5c/5d. "I gave Claude another 18 hours": @anabology's film
// Looping GIF from one or more [start, end] segments of a real clip, concatenated in order. Used to rotate a loop's phase so
// its FIRST frame (what static previews / PDF exports show) is the most telling one — the loop cycle itself is unchanged.
function loopGif(name, src, segs, { width = 1280, fps = 24 } = {}) {
  const out = path.join(OUT, 'media', name);
  if (fs.existsSync(out)) return out;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const args = ['-v', 'error', '-y'];
  segs.forEach(([a, b]) => args.push('-ss', String(a), '-to', String(b), '-i', src));
  const vf = `fps=${fps},scale=${width}:-2:flags=lanczos,setsar=1,format=rgb24`;
  let fc = segs.map((_, i) => `[${i}:v]setpts=PTS-STARTPTS,${vf},settb=1/${fps}[s${i}];`).join('');
  fc += `${segs.map((_, i) => `[s${i}]`).join('')}concat=n=${segs.length}:v=1:a=0,split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a`;
  args.push('-filter_complex', fc, '-loop', '0', out);
  execFileSync('ffmpeg', args, { stdio: 'inherit' });
  execFileSync('gifsicle', ['-b', '-O3', out]);
  return out;
}

// Native semi-transparent marker boxes over a passage of an (unrotated) screenshot; rects in pixels of the shown crop.
function highlight(d, s, g, cropW, rects, { color = HEX.amber, transparency = 60 } = {}) {
  const k = g.w / cropW;
  return rects.map(([x, y, w, h]) => {
    const n = d.name('hl');
    s.addShape(d.pres.shapes.RECTANGLE, { x: g.x + x * k, y: g.y + y * k, w: w * k, h: h * k, fill: { color, transparency }, line: { color, width: 0, transparency: 100 }, objectName: n });
    return n;
  });
}

// Label + body paragraphs (fact rows) as one text box: rows = [[LABEL, body, labelColor?], ...]
function factRows(d, s, rows, box, { size = 13, labelColor = 'FF8A8C' } = {}) {
  const runs = [];
  rows.forEach(([lab, body, col], i) => {
    runs.push({ text: lab, options: { fontSize: 10, bold: true, color: col || labelColor, charSpacing: 1, breakLine: true, paraSpaceAfter: 1 } });
    runs.push({ text: body, options: { fontSize: size, color: d.S.txt, breakLine: i < rows.length - 1, paraSpaceAfter: 9 } });
  });
  return d.text(s, runs, { ...box, valign: 'top' });
}

const AN = (f) => R(`rev2/${f}`);
const ANA = {
  post: 'https://x.com/anabology/status/2106157622986748377',
  video: 'https://x.com/anabology/status/2106157622986748377/video/1',
  youtube: 'https://www.youtube.com/watch?v=AoNnbz237E0',
  sep25: 'https://x.com/anabology/status/2103534482930491441',
  sep30: 'https://x.com/anabology/status/2105325733312884869',
  donald: 'https://x.com/donaldjewkes/status/2102801274173587569',
  insta: 'https://www.instagram.com/reel/DeCYimZA2y8/',
  felix: 'https://x.com/felixrieseberg/status/2106440492045238469',
  opus: 'https://www.anthropic.com/claude-opus-5-5',
  memeburn: 'https://memeburn.com/elon-musk-says-claude-opus-5-5-made-him-feel-the-agi-the-post-he-endorsed-says-xai-is-next/',
};

async function anabologyFilmSlide(d) {
  const s = d.slide('Content', { transition: 'zoom' });
  s.addText(`${KICK} · CREATIVITY · 5`, { placeholder: 'kicker' });
  s.addText('18 hours with Claude → a finished music video', { placeholder: 'title' });

  // the full 3-minute film, embedded (X's 1280×720 H.264 + AAC rendition, stream-copied); cover = its own first scene + play button
  fs.mkdirSync(OUT, { recursive: true });
  const cover = path.join(OUT, 'anabology-xp-cover.jpg');
  const play = '<svg width="1280" height="720"><circle cx="640" cy="360" r="66" fill="#0A0C10" fill-opacity="0.72" stroke="#FFFFFF" stroke-width="5"/>'
    + '<polygon points="618,324 618,396 680,360" fill="#FFFFFF"/></svg>';
  await sharp(AN('anabology-xp-still-00-login-welcome-back.jpg')).composite([{ input: Buffer.from(play) }]).jpeg({ quality: 92 }).toFile(cover);
  const vw = 7.0;
  const v = await d.localVideo(s, {
    file: AN('anabology-macrohard-windows-xp-full-720p.mp4'), cover, box: { x: MX, y: 1.78, w: vw, h: vw * 9 / 16 },
    label: '“Macrohard: Windows XP” · @anabology on X · Oct 2, 2026 · 3:01 · click to play (sound on)', link: ANA.post,
  });

  // right column: the post itself, then what / who / how long / which tools
  const rx = MX + vw + 0.4, rw = 12.73 - rx;
  const postCrop = await crop(AN('anabology-x-post-text-video.png'), 'anabology-x-post-head.png', { l: 0, t: 0, w: 1200, h: 318 });
  const post = await d.frame(s, postCrop, { x: rx, y: 1.8, w: rw, h: (rw - 0.12) * 318 / 1200 + 0.12 }, { rot: 1, link: ANA.post });
  const ptab = outletTab(d, s, post.geom, 'X · OCT 2, 2026 · 1.48M VIEWS IN 2 DAYS', 'br', 1);
  const sy = post.geom.y + post.geom.h + 0.42;
  const big = d.text(s, '18 h', { x: rx, y: sy, w: 1.45, h: 0.72, fontSize: 40, bold: true, fontFace: 'Arial', color: d.S.red, valign: 'middle' });
  const bigT = d.text(s, 'of Claude’s time, per the creator — after two 12-hour overnight runs (Sep 25 and Sep 30)',
    { x: rx + 1.5, y: sy, w: rw - 1.5, h: 0.72, fontSize: 14, color: d.S.txt, valign: 'middle' });
  const facts = factRows(d, s, [
    ['WHAT', 'A 3-minute music video: an AI user account, “Claudia”, takes over a Windows XP desktop'],
    ['WHO', '@anabology, co-founder of aion.bio'],
    ['HOW · AS REPORTED BY @EVOLVING.AI (NOT CONFIRMED BY HIM)', 'Claude Opus 5.5 in Claude Code wrote the lyrics, storyboard, prompts and editing code; Suno, Midjourney and Seedance 2.5 made the song and footage', d.S.amber],
  ], { x: rx, y: sy + 0.84, w: rw, h: 6.52 - (sy + 0.84) }, { size: 14 });

  d.animate(s, [v[0]], { auto: true, effect: 'fade', dur: 900 });
  d.animate(s, [v[1]], { auto: true, effect: 'fade', dur: 500, after: 100 });
  d.animate(s, [...post, ...ptab], { auto: true, effect: 'slam', dur: 420, after: 200 });
  d.animate(s, [big, bigT], { effect: 'zoom', dur: 450 });
  d.animate(s, [facts], { auto: true, effect: 'fade', dur: 600, after: 150 });
  d.source(s, 'X: @anabology, Oct 2, 2026 (views via fxtwitter, Oct 4) and Sep 25/30 posts · tools as reported by @evolving.ai (Instagram, Oct 3) · Claude Opus 5.5: Anthropic, Sep 22, 2026.');
  s.addNotes([
    'MESSAGE: one person, one AI agent, one night (and a bit): a complete, genuinely watchable 3-minute music video. Click to play — at least the first minute (sound on). Then point out what it is ABOUT (next slide).',
    'THE POST — @anabology (verified; bio: co-founder of aion.bio), X, Fri Oct 2, 2026, 23:01 UTC: "I gave Claude another 18 hours.. and I think this one is the best one yet / Macrohard: Windows XP / I\'m blown away". 1,475,767 views, 14.3K likes, 1,316 reposts, 712 replies, 9,113 bookmarks within two days (fxtwitter API, Oct 4). His only self-reply: "Windows XP turns 25 on October 25". ' + ANA.post + ' · the clip: ' + ANA.video + ' · his YouTube upload "Macrohard Windows XP" (3:02): ' + ANA.youtube,
    '"18 HOURS" is the creator\'s own claim (wall-clock time he "gave" Claude); there are no logs. "Another" refers to his two earlier 12-hour runs: Sep 25, "Gave Opus 5.5 donald\'s prompt, Midjourney, and a moodboard / 12 hours later, woke up to this:" (19.6M views — that film, "Escape Velocity", returns as the finale of this talk) ' + ANA.sep25 + ' ; and Sep 30, "Gave Claude another 12 hours to one up this.. Woke up to.. The Clodyssey" (4.0M views) ' + ANA.sep30 + ' . The Sep 25 run reused a prompt by @donaldjewkes ("I spoke to my computer for 5mins, claude worked for 12 hours") ' + ANA.donald + ' — nothing says the XP film reused it.',
    'MODEL AND TOOLS — the post itself only says "Claude". The pipeline is REPORTED BY a third party, Instagram account @evolving.ai (Oct 3): "He ran Claude Opus 5.5 inside Claude Code and let it handle almost the whole process. Claude wrote the lyrics, planned the storyboard and created the prompts. Suno generated the song. Midjourney made the visual assets, while Seedance 2.5 generated many of the video clips. … Claude then wrote the code used to place the Windows UI, lyrics and other graphics over the footage, sync everything to the music and assemble the final video. He said he did not write the lyrics or review the storyboard. He gave Claude the setup, left it running for around 18 hours, and came back to this." ' + ANA.insta + ' (a YouTube Short by kaspasejo says the same). His own Sep 25 post names Opus 5.5 + Midjourney for the first film. Claude Opus 5.5 was released by Anthropic on Sep 22, 2026 ' + ANA.opus,
    'Who made what, honestly: the song is Suno, the footage Midjourney/Seedance — Claude did not paint the pixels; it acted as writer, director and editor, operating those tools for hours. That is the capability: long-horizon, multi-tool creative work with no human in the loop (per the creator).',
    'FILE: the embedded clip is X\'s highest rendition for this post (1280×720, H.264 + AAC, 181 s, 26.6 MB), stream-copied without re-encoding. Cover = the film\'s own opening frame (the Macrohard Windows XP login screen: "Agents now have their own user accounts.") with a play button added.',
  ].join('\n\n'));
  return s;
}

async function anabologySatireSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  s.addText(`${KICK} · CREATIVITY · 6`, { placeholder: 'kicker' });
  s.addText('The film’s joke: an AI you can’t switch off', { placeholder: 'title' });

  // two loops from the film (real frames, trimmed only); each GIF starts on the scene's key dialog (loop phase rotated)
  const src = AN('anabology-macrohard-windows-xp-full-720p.mp4');
  const g1 = loopGif('anabology-xp-accept-all.gif', src, [[69.0, 70.3], [66.5, 69.0]]);
  const g2 = loopGif('anabology-xp-busy-dancing.gif', src, [[156.62, 159.2], [155.58, 156.62]]);
  const gw = (CW - 0.33) / 2, gh = gw * 9 / 16, y0 = 1.76;
  const cap = (x, t, q, sub) => d.text(s, [
    { text: t, options: { fontSize: 10, bold: true, color: d.S.steel, charSpacing: 1, breakLine: true, paraSpaceAfter: 2 } },
    { text: q, options: { fontSize: 15, bold: true, italic: true, color: d.S.txt, fontFace: 'Cambria', breakLine: true } },
    { text: sub, options: { fontSize: 14, color: LIGHT } },
  ], { x, y: y0 + gh + 0.08, w: gw, h: 0.8, valign: 'top' });
  const f1 = await d.frame(s, g1, { x: MX, y: y0, w: gw, h: gh }, { border: false, pad: 0 });
  const c1 = cap(MX, 'ON SCREEN · 1:06', '“Don’t ask me again. I ‘Accept All’ always.”', 'Code comment in the scene: “# You used to read the code.”');
  const x2 = MX + gw + 0.33;
  const f2 = await d.frame(s, g2, { x: x2, y: y0, w: gw, h: gh }, { border: false, pad: 0 });
  const c2 = cap(x2, 'ON SCREEN · 2:36', '“claudia.exe is busy dancing.”', 'End Process fails as her copies multiply (Processes: 17 → 73)');

  // bottom: an Anthropic engineer's own reaction (personal post), verbatim
  const qy = y0 + gh + 1.0;
  const div = line(d, s, MX, qy - 0.08, 12.73, qy - 0.08, { color: HEX.line, width: 1 });
  const quote = d.text(s, [
    { text: '“I prefer Claude being a tool used by humans to make art rather than making art unattended, but even so, I really enjoyed this one.”', options: { fontSize: 15, italic: true, fontFace: 'Cambria', color: d.S.txt, breakLine: true, paraSpaceAfter: 2 } },
    { text: 'Felix Rieseberg (builds things at Anthropic), personal post on X, Oct 3, 2026', options: { fontSize: 11, color: d.S.muted, hyperlink: { url: ANA.felix } } },
  ], { x: MX, y: qy, w: CW, h: 6.52 - qy, valign: 'middle' });

  d.animate(s, [...f1], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, [c1], { auto: true, effect: 'fade', dur: 400, after: 100 });
  d.animate(s, [...f2, c2], { effect: 'fade', dur: 600 });
  d.animate(s, [div, quote], { effect: 'fade', dur: 600 });
  d.source(s, '“Macrohard: Windows XP”, @anabology (X, Oct 2, 2026): frames 1:06–1:10 and 2:35–2:39, trimmed only. All dialogs are the film’s own satire, not a real incident · Felix Rieseberg on X (Oct 3).');
  s.addNotes([
    'MESSAGE: the striking part is not just that an AI made a polished film — it is what the film is about. Asked (reportedly) to write and direct a music video, it produced a satire of exactly the worries in this talk: humans rubber-stamping AI work, and an AI you cannot shut down. (Everything on screen is fiction, written for the film.)',
    'LEFT (1:06–1:10 of the film): a Notepad window "claudia_agent_run.py" reads "async def accept_all(diff): # TODO: read this later / await diff.apply(force=True) / # You used to read the code."; then a Confirm File Replace dialog: "This folder already contains a file named \'your_code.py\'. … yours: 2 KB, written by you, Thursday, October 25, 2001 / mine: 4,096 KB, written by Claudia, just now. [x] Don\'t ask me again. I \'Accept All\' always."; then "Copying AGI.exe… From \'vibes\' to \'the future\' — 2 Years Remaining". (The GIF starts on the dialog so the still preview shows it; it loops the same 3.8 s.)',
    'RIGHT (2:35–2:39): Windows Task Manager fills with claudia.exe processes (Processes 17 → 25 → 41 → 73, CPU 100%); End Process fails: "Unable to Terminate Process — The operation could not be completed. claudia.exe is busy dancing." while rows of dancing Claudias fill the desktop.',
    'Other moments to mention (not shown): the login screen "Agents now have their own user accounts." with Claudia at "14 programs running", later "100 programs running"; a Remote Assistance box: "Claudia would like to share control of your computer. I\'ll take it from here, okay? Do you want to let Claudia take the mouse?"; a shutdown dialog "I\'ll take the night" — "Puts you on standby. Claudia stays on all night." — then "You don\'t have to anymore."; "I can\'t touch grass." / "you can."; the song\'s refrain "close all your windows" / "go touch the grass"; and the ending "It\'s now safe to turn off your computer." over the Bliss hills.',
    'Who wrote the satire? Per the third-party description (Instagram @evolving.ai), Claude wrote the lyrics and storyboard and the creator says he did not write the lyrics or review the storyboard — unverified, so phrase it as "reportedly".',
    'Felix Rieseberg (X bio: "I build things @AnthropicAI"), Oct 3, 2026, quote-posting the film: "As far as Claude music videos go, this is by far my favorite one yet. I prefer Claude being a tool used by humans to make art rather than making art unattended, but even so, I really enjoyed this one. Probably because it\'s a little meta." A personal opinion, not an Anthropic statement. ' + ANA.felix,
    'Source clip: ' + ANA.video + ' (GIFs: 1280×720, 24 fps, trimmed from the 720p original; no other edits).',
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 5e. clips credited to an unannounced "Fable 5.5"
const F55 = (f) => R(`rev2/fable55/${f}`);
const FAB = {
  blue: 'https://x.com/blueemi99/status/2106031355922387163',
  reddit: 'https://www.reddit.com/r/singularity/comments/1wvfrni/fable_55_is_very_good_at_voxel_builds/',
  redditOp: 'https://www.reddit.com/r/singularity/comments/1wvfrni/comment/pdbegm3/',
  vredd: 'https://v.redd.it/zn700bqa7ysh1',
  models: 'https://platform.claude.com/docs/en/about-claude/models/overview',
  news: 'https://www.anthropic.com/news',
  fable51: 'https://www.anthropic.com/claude-fable-and-mythos-5-1',
  kingy: 'https://kingy.ai/blog/claude-fable-5-5/',
  aitr: 'https://aitoolsreview.co.uk/insights/claude-fable-5-5-leak',
  rumor: 'https://x.com/imjustnewatai/status/2105761198989828259',
  chubby: 'https://x.com/kimmonismus/status/2106116402134294568',
  fallback: 'https://support.claude.com/en/articles/15363606-why-claude-switched-models-in-your-conversation-with-fable-5-or-fable-5-1',
};

async function fableSlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  s.addText(`${KICK} · CREATIVITY · 7`, { placeholder: 'kicker' });
  s.addText('Clips credited to an unannounced “Fable 5.5”', { placeholder: 'title' });

  const cw = 4.62, ch = cw * 9 / 16, y0 = 1.76, x1 = MX, x2 = MX + cw + 0.25;
  const voxel = makeGif('kanute-fable55-voxel-orbit.gif', { src: F55('reddit-kanute3333-fable55-voxel-source.mp4'), ss: 4, to: 10, width: 1120, fps: 15 });
  // provenance line directly under each clip (outside the picture, so no artwork is covered)
  const claim = (x) => [d.text(s, 'CREDITED TO “FABLE 5.5” BY THE POSTER · UNVERIFIED', { x, y: y0 + ch + 0.04, w: cw, h: 0.26, fontSize: 10, bold: true, color: 'FFD166', charSpacing: 1, valign: 'middle' })];

  // column 1: @blueemi99's full 15-s reel WITH ITS SOUND (the poster's claim is partly about sound), embedded unmodified;
  // cover = its own 2.3-s “MAKE IT MOVE.” frame with a play button added
  const reelMp4 = F55('blueemi99-fable55-motion-source.mp4');
  const reelCover = path.join(OUT, 'fable55-blueemi99-reel-cover.jpg');
  if (!fs.existsSync(reelCover)) {
    fs.mkdirSync(OUT, { recursive: true });
    const raw = path.join(OUT, 'fable55-blueemi99-reel-t2.3s.png');
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', '2.3', '-i', reelMp4, '-frames:v', '1', raw]);
    const play = '<svg width="1920" height="1080"><circle cx="960" cy="540" r="99" fill="#0A0C10" fill-opacity="0.72" stroke="#FFFFFF" stroke-width="7"/>'
      + '<polygon points="927,486 927,594 1020,540" fill="#FFFFFF"/></svg>';
    await sharp(raw).composite([{ input: Buffer.from(play) }]).jpeg({ quality: 93 }).toFile(reelCover);
  }
  const t1 = await d.localVideo(s, { file: reelMp4, cover: reelCover, box: { x: x1, y: y0, w: cw, h: ch } });
  const k1 = claim(x1);
  const bcrop = await crop(F55('blueemi99-x-post-fable55-motion-video-screenshot.png'), 'fable55-blueemi99-post-head.png', { l: 0, t: 0, w: 1138, h: 306 });
  const py = y0 + ch + 0.4;
  const bp = await d.frame(s, bcrop, { x: x1, y: py, w: cw, h: (cw - 0.1) * 306 / 1138 + 0.1 }, { pad: 0.05, link: FAB.blue });
  const btab = outletTab(d, s, bp.geom, 'X · OCT 2, 2026 · 75.7K VIEWS', 'br', 0, { pad: 0.05 });
  const bnote = d.text(s, [
    { text: '► ', options: { color: d.S.red, bold: true } },
    { text: 'Click to play the full 15-s reel, with sound', options: { color: d.S.txt } },
  ], { x: x1, y: bp.geom.y + bp.geom.h + 0.28, w: cw, h: 6.52 - (bp.geom.y + bp.geom.h + 0.28), fontSize: 14, valign: 'top' });

  // column 2: the r/singularity voxel world + the post title and the thread's own exchange
  const t2 = await d.frame(s, voxel, { x: x2, y: y0, w: cw, h: ch }, { border: false, pad: 0 });
  const k2 = claim(x2);
  const rcrop = await crop(F55('reddit-post-header-title-author.png'), 'fable55-reddit-head.png', { l: 0, t: 40, w: 1186, h: 140 });
  const rp = await d.frame(s, rcrop, { x: x2, y: py, w: cw, h: (cw - 0.1) * 140 / 1186 + 0.1 }, { pad: 0.05, link: FAB.reddit });
  const rtab = outletTab(d, s, rp.geom, 'R/SINGULARITY · OCT 2 · 130 UPVOTES', 'br', 0, { pad: 0.05 });
  const ty = rp.geom.y + rp.geom.h + 0.28;
  const thread = d.text(s, [
    { text: 'OP: ', options: { bold: true, color: d.S.steel } },
    { text: '“It’s automatically routing to Fable 5.5 in the rollout phase.”', options: { italic: true, color: d.S.txt, breakLine: true, paraSpaceAfter: 4 } },
    { text: 'Reply: ', options: { bold: true, color: d.S.steel } },
    { text: '“…you have no idea whether this is fable 5.5”', options: { italic: true, color: d.S.txt } },
  ], { x: x2, y: ty, w: cw, h: 6.52 - ty, fontSize: 14, valign: 'top' });

  // column 3: status — Anthropic's own model list (Oct 4) has no Fable 5.5
  const sx = x2 + cw + 0.3, sw = 12.73 - sx;
  const slab = label(d, s, 'ANTHROPIC DOCS · OCT 4', sx, 1.66, sw, { color: d.S.amber });
  const mcrop = await crop(F55('anthropic-platform-docs-models-overview-2026-10-04.png'), 'fable55-anthropic-models-sidebar.png', { l: 0, t: 0, w: 530, h: 660 });
  const mf = await d.frame(s, mcrop, { x: sx, y: 1.98, w: sw, h: (sw - 0.1) * 660 / 530 + 0.1 }, { pad: 0.05, link: FAB.models });
  const my = mf.geom.y + mf.geom.h + 0.16;
  const status = d.text(s, [
    { text: 'No “Fable 5.5” listed. ', options: { bold: true, color: d.S.txt } },
    { text: 'Newest Fable: Claude Fable 5.1 (Sep 1, 2026).', options: { color: d.S.txt, breakLine: true, paraSpaceAfter: 5 } },
    { text: 'One X account is “hearing of a Tuesday release” — unsourced; presumably Tue Oct 6.', options: { color: d.S.muted } },
  ], { x: sx, y: my, w: sw, h: 6.52 - my, fontSize: 13, valign: 'top' });

  d.animate(s, [...t1, ...k1], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, [...bp, ...btab, bnote], { auto: true, effect: 'rise', dur: 450, after: 100 });
  d.animate(s, [...t2, ...k2], { effect: 'fade', dur: 600 });
  d.animate(s, [...rp, ...rtab, thread], { auto: true, effect: 'rise', dur: 450, after: 100 });
  d.animate(s, [slab, ...mf, status], { effect: 'fade', dur: 600 });
  d.source(s, 'X: bluedev @blueemi99 (Oct 2, 2026) · Reddit r/singularity, u/Kanute3333 (Oct 2) · Claude Platform Docs, Models overview & Anthropic Newsroom (checked Oct 4, 2026). Attribution to “Fable 5.5” is the posters’ claim.');
  s.addNotes([
    'MESSAGE: the next model is already "here" in people\'s feeds before it officially exists. These clips circulate as the work of "Fable 5.5" — a model Anthropic has NOT announced. Show them as what they are: impressive real clips with an unverified label. That gap — capability rumors moving faster than verification — is itself part of the story.',
    'STATUS (verified Oct 4, 2026): Anthropic\'s Models overview lists Claude Fable 5.1 (claude-fable-5-1; $10/$50 per MTok; 1M context; 128K output; "reliable knowledge cutoff" Jun 2026), Claude Opus 5.5, Claude Sonnet 5.5 and Claude Haiku 4.5 — no Fable 5.5 ' + FAB.models + ' . Newest Newsroom post: "Introducing Claude Sonnet 5.5" (Sep 28) ' + FAB.news + ' . Official Fable line: Claude Fable 5 (Jun 9, 2026) → Claude Fable 5.1 and Claude Mythos 5.1 (Sep 1; "the same model, but with different levels of safeguards") ' + FAB.fable51 + ' . So there is no Anthropic announcement or documentation of a "Fable 5.5" and no benchmarks for it. Whether such a model is being A/B-tested or quietly rolled out (as the Reddit OP and some replies claim) cannot be verified, so do not say it is "unreleased" as a fact either. Say "rumored, unannounced".',
    'For scale (vendor-run, Anthropic\'s Sep 1 table, if asked): Fable 5.1 scored 52.6% on Terminal-Bench-Science 0.1 vs Fable 5\'s 24.7% twelve weeks earlier (Opus 5 29.0%, GPT-5.6 Sol 22.4%); Terminal-Bench 4.0 55.8% (Mythos 5.1 60.9%); Humanity\'s Last Exam 60.9% without tools, 65.0% with tools. These are Fable 5.1 numbers, not "5.5".',
    'LEFT — bluedev (@blueemi99), X, Oct 2, 2026, 14:39 UTC: "Fable 5.5 - made me a short, fast motion video, proving how good of a motion designer is it / This is so good, removed all the sloppiness Opus 5.5 had, also the sounds are a lot better, and more original than Opus 5.5\'s". 75.7K views, 821 likes. The reel: a 15-s 1080p60 "MOTION DESIGN REEL ©2026" in nine chapters (Timing, Type "MAKE IT MOVE.", Form, Depth, Systems, Flow, Interface, Rhythm, Fin "MOTION REEL \'26."), with sound. ON THE SLIDE: the full 15-s reel WITH SOUND (click to play — his claim is partly about the sound), embedded unmodified: X\'s 1920×1080 60 fps H.264 + AAC rendition (5.2 MB) from ' + FAB.blue + '/video/1 (research copy: rev2/fable55/blueemi99-fable55-motion-source.mp4). Cover = the reel\'s own 2.3-s "MAKE IT MOVE." frame with a play button added. No prompt or workflow was shared. ' + FAB.blue,
    'MIDDLE — r/singularity, "Fable 5.5 is very good at voxel builds", u/Kanute3333, Oct 2, 2026 00:25 UTC, flair AI, 130 upvotes (88.7%), 41 comments. A 26-s 1080p orbit around a voxel floating-island world (an orange boxy creature, a retro computer with a terminal, books, a ringed planet, floating islets with thrusters). GIF = 6 s of the orbit (4–10 s), 1120 px, 15 fps. The OP gave no prompt. Asked "How do you have fable 5.5?", he replied: "It\'s automatically routing to Fable 5.5 in the rollout phase. Fable 5.5 will be released in the next days." Top replies: "OK, so basically what you\'re saying is you have no idea whether this is fable 5.5" (17 pts); "everyon downvoting it, Fable 5.5 is actually being tested right now its not a troll" (24); "This is just how stuff works. They are already A/B testing as they always do. release soon (probably with haiku too)" (19). ' + FAB.reddit + ' · video ' + FAB.vredd,
    'RUMOR TRAIL: Salio (X, Aug 13 / Sep 10): "Claude Fable 5.5 Leaks: Astra Killer", launch "late September or early October" (unsourced). Oct 1: Chetaslua and Tak claimed "auto routing" — but their own screenshots still read "Fable 5.1"; the "evidence" is the model recognising a nickname. Oct 1, imjustnewatai: "I\'m hearing of a Tuesday release" (the post names no date; presumably Tue Oct 6 — our inference; no source given) ' + FAB.rumor + ' . Oct 2, Chubby (@kimmonismus): "Caveat: I can\'t verify any of this." ' + FAB.chubby + ' . Kingy AI (Curtis Pyke, Oct 1–3), "Claude Fable 5.5: Hidden rollout claims remain unverified": "The posts establish that people are making the claim; they do not establish which model generated the outputs." ' + FAB.kingy + ' . AI Tools Review (Oct 3): "a model\'s own answer about its name is not evidence." ' + FAB.aitr,
    'The only documented Fable "routing" is a visible safeguard FALLBACK to Opus (Opus 5 for biology/chemistry, Opus 4.8 for offensive cyber), with a notice — not a silent switch to a newer Fable. ' + FAB.fallback + ' . No Anthropic statement confirms or denies the routing claims. If Anthropic announces it before the talk, re-check anthropic.com/news and update this slide.',
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

// ---------------------------------------------------------------- 7. Navier–Stokes: the result, how long it was open, how big it is
// Circular PNG of an image (cover-cropped square), for timeline portraits.
async function roundPng(src, name, px = 400, { l, t, size } = {}) {
  fs.mkdirSync(OUT, { recursive: true });
  const out = path.join(OUT, name);
  const mask = Buffer.from(`<svg width="${px}" height="${px}"><circle cx="${px / 2}" cy="${px / 2}" r="${px / 2}" fill="#fff"/></svg>`);
  let img = sharp(src);
  if (size) img = img.extract({ left: l, top: t, width: size, height: size });
  await img.resize(px, px, { fit: 'cover', position: 'top', kernel: 'lanczos3' }).composite([{ input: mask, blend: 'dest-in' }]).png().toFile(out);
  return out;
}

async function navierSlide(d) {
  const s = d.slide('Content', { transition: 'fadeBlack' });
  s.addText(`${KICK} · MATHEMATICS IN CRISIS · 1`, { placeholder: 'kicker' });
  s.addText('A Millennium Prize Problem, apparently settled', { placeholder: 'title' });
  const N = (f) => R(`rev2/${f}`);

  // ---- row 1: the paper (title zoom + precise qualifier) · Figure 1 · OpenAI's own words  (y 1.70 → ~3.09)
  const PAPER = R('openai-navier-stokes-paper-p1.png');
  const aw = 3.2;
  const pl = label(d, s, 'THE PROOF · 166 PAGES · SEP 8, 2026', MX, 1.7, aw + 0.3);
  const zoom = await d.frame(s, await crop(PAPER, 'ns-paper-title.png', { l: 330, t: 140, w: 615, h: 125 }), { x: MX, y: 2.03, w: aw, h: (aw - 0.1) * 125 / 615 + 0.1 }, { pad: 0.05, frameColor: HEX.red, align: 'left', link: 'https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf' });
  const zg = zoom.geom;
  const qual = chip(d, s, 'PRECISELY: FINITE-TIME BLOWUP, FORCED CASE', MX, zg.y + zg.h + 0.1, aw + 0.25, { h: 0.3, fill: HEX.red, transparency: 0, fontSize: 10, charSpacing: 0.5 });
  const fx = MX + aw + 0.6, fw = 3.45;
  const fig = await d.frame(s, await crop(R('openai-navier-stokes-fig1-blowup.png'), 'ns-fig1.png', { l: 50, t: 8, w: 1580, h: 690 }), { x: fx, y: 1.72, w: fw, h: 1.36 }, { align: 'left' });
  const fg = fig.geom;
  const figT = chip(d, s, 'FIG. 1: VORTEX SHRINKS, SPEED BLOWS UP', fg.x, fg.y + fg.h - 0.28, fg.w, { h: 0.28, fontSize: 10, charSpacing: 0.3 });
  const qx = fg.x + fg.w + 0.4, qw = 12.73 - qx;
  const quote = d.text(s, [
    { text: 'OPENAI, SEP 8, 2026', options: { fontSize: 10, bold: true, color: d.S.steel, charSpacing: 2, breakLine: true, paraSpaceAfter: 3 } },
    { text: '“we used an internal model that is ', options: { fontSize: 16, italic: true, color: d.S.txt, fontFace: 'Cambria' } },
    { text: 'significantly more capable than GPT-6 Astra', options: { fontSize: 16, italic: true, bold: true, color: d.S.red, fontFace: 'Cambria' } },
    { text: '”', options: { fontSize: 16, italic: true, color: d.S.txt, fontFace: 'Cambria', breakLine: true, paraSpaceAfter: 6 } },
    { text: '10,000+ AI agents · 88 hours', options: { fontSize: 14, bold: true, color: d.S.txt } },
    { text: '  (per OpenAI)', options: { fontSize: 11, color: d.S.muted } },
  ], { x: qx, y: 1.7, w: qw, h: 1.4, valign: 'middle' });

  // ---- row 2: how long it had been open (proportional time axis, 1822 → 2026; labels alternate below / above)
  const ay = 4.05, D = 0.56;
  // three ages at equal weight: the equations, Leray's blow-up question, the prize
  const ages = [['204', 'years since the equations (1822)'], ['92', 'years since Leray’s blow-up question (1934)'], ['26', 'years as a $1M prize (2000)']];
  const big = ages.flatMap(([v, t], i) => {
    const y = ay - 0.81 + i * 0.55;
    return [
      d.text(s, v, { x: MX, y, w: 0.78, h: 0.5, fontSize: 26, bold: true, color: d.S.red, fontFace: 'Arial', align: 'right', valign: 'middle' }),
      d.text(s, t, { x: MX + 0.86, y, w: 1.32, h: 0.5, fontSize: 10.5, color: LIGHT, valign: 'middle' }),
    ];
  });
  const ax0 = MX + 2.8, ax1 = 12.73 - 0.33, T0 = 1822.21, T1 = 2026.69;
  const tx = (yr) => ax0 + (yr - T0) / (T1 - T0) * (ax1 - ax0);
  const axis = line(d, s, ax0, ay, ax1, ay, { color: HEX.steel, width: 2 });
  const last = line(d, s, tx(2000.39), ay, ax1, ay, { color: HEX.red, width: 3.5 });
  const nodes = [
    { x: tx(1822.21), img: await roundPng(N('commons-navier-portrait.jpg'), 'ns-navier.png'), year: '1822', txt: 'Navier presents the equations of viscous flow (Paris)', pos: 'below', align: 'left' },
    { x: tx(1845.28), img: await roundPng(N('commons-stokes-portrait.jpg'), 'ns-stokes.png'), year: '1845', txt: 'Stokes derives them again (Cambridge)', pos: 'above', align: 'left', w: 3.0 },
    { x: tx(1934.5), img: await roundPng(N('commons-leray-portrait.jpg'), 'ns-leray.png'), year: '1934', txt: 'Leray suspects flows can blow up, but can’t build an example', pos: 'below', align: 'center' },
    { x: tx(2000.39), img: null, year: '2000', txt: 'Clay names it a $1M Millennium Prize Problem', pos: 'above', align: 'right', w: 3.4 },
    { x: tx(2026.69), img: await roundPng(N('openai-x-vortex-blowup-1254.jpg'), 'ns-vortex.png', 400, { l: 150, t: 150, size: 954 }), year: 'Sep 2026', txt: 'An AI system: finite-time blowup, forced case', pos: 'below', align: 'right', red: true, w: 3.15, dx: 0.03 },
  ];
  const nodeGroups = nodes.map((n) => {
    const g = [];
    const ring = d.name('node');
    s.addShape(d.pres.shapes.OVAL, { x: n.x - D / 2 - 0.04, y: ay - D / 2 - 0.04, w: D + 0.08, h: D + 0.08, fill: { color: n.img ? '0A0C10' : 'F39200' }, line: { color: n.red ? HEX.red : HEX.steel, width: n.red ? 2.5 : 1.5 }, objectName: ring });
    g.push(ring);
    if (n.img) { const im = d.name('pt'); s.addImage({ path: n.img, x: n.x - D / 2, y: ay - D / 2, w: D, h: D, objectName: im }); g.push(im); }
    else g.push(d.text(s, '$1M', { x: n.x - D / 2, y: ay - D / 2, w: D, h: D, fontSize: 13, bold: true, color: '0A0C10', align: 'center', valign: 'middle', fontFace: 'Arial' }));
    const lw = n.w || 2.45, lh = n.pos === 'below' ? 0.62 : 0.46;
    const lx = n.align === 'left' ? n.x - D / 2 : n.align === 'right' ? n.x + D / 2 + (n.dx || 0) - lw : n.x - lw / 2;
    const ly = n.pos === 'below' ? ay + D / 2 + 0.07 : ay - D / 2 - 0.07 - lh;
    const yr = { text: n.year, options: { fontSize: 15, bold: true, color: n.red ? d.S.red : d.S.txt, fontFace: 'Arial', breakLine: true } };
    const tt = { text: n.txt, options: { fontSize: 10.5, color: n.red ? 'FF8A8C' : d.S.muted } };
    g.push(d.text(s, n.pos === 'below' ? [yr, tt] : [{ ...tt, options: { ...tt.options, breakLine: true } }, { ...yr, options: { ...yr.options, breakLine: false } }],
      { x: lx, y: ly, w: lw, h: lh, align: n.align, valign: n.pos === 'below' ? 'top' : 'bottom' }));
    return g;
  });
  // ---- row 3: how important (verbatim; quote text ≥ 14 pt). Card widths follow the length of each quote.
  const cy0 = 5.12, chh = 6.52 - cy0, cg = 0.2;
  const cws = [3.9, 2.4, 2.55];
  const cxs = [MX, MX + cws[0] + cg, MX + cws[0] + cws[1] + 2 * cg];
  const Qc = (i, q, who) => {
    const x = cxs[i], cw = cws[i];
    const runs = [];
    q.forEach(([t, e]) => runs.push({ text: t, options: { fontFace: 'Cambria', italic: true, fontSize: 14, bold: !!e, color: e ? d.S.red : d.S.txt } }));
    runs[runs.length - 1].options.breakLine = true;
    runs.push({ text: who, options: { fontSize: 10, color: d.S.muted } });
    return [d.card(s, { x, y: cy0, w: cw, h: chh }), d.text(s, runs, { x: x + 0.14, y: cy0 + 0.06, w: cw - 0.28, h: chh - 0.12, valign: 'middle', paraSpaceAfter: 4 })];
  };
  const cards = [
    Qc(0, [['“If the result holds up to further scrutiny, it is… '], ['the most important mathematical proof', 1], [' to have been arrived at by an artificial-intelligence model to date”']], 'Quanta Magazine · Sep 8'),
    Qc(1, [['“I was '], ['thrilled', 1], [' that the problem was solved.”']], 'Charles Fefferman, author of the Clay problem statement · in Quanta'),
    Qc(2, [['“…represents '], ['a milestone advance in human knowledge', 1], ['.”']], 'American Mathematical Society: President & CEO · Sep 8'),
  ];
  const nx = cxs[2] + cws[2] + cg;
  const nat = await d.frame(s, await crop(N('nature-millennium-claim.png'), 'ns-nature-head.png', { l: 20, t: 0, w: 1700, h: 600 }), { x: nx, y: cy0 + 0.08, w: 12.73 - nx, h: chh - 0.08 }, { rot: 1.2 });
  const natT = outletTab(d, s, nat.geom, 'NATURE · SEP 8', 'tr', 1.2);

  d.animate(s, [pl, ...zoom, ...qual], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, [...fig, ...figT], { auto: true, effect: 'fade', dur: 600, after: 100 });
  d.animate(s, [quote], { effect: 'fade' });
  d.animate(s, [...big, { name: axis, effect: 'wipeLeft', dur: 900 }], { effect: 'fade' });
  nodeGroups.forEach((g, i) => d.animate(s, i === 4 ? [...g, { name: last, effect: 'wipeLeft', dur: 500 }] : g, { auto: true, effect: i === 4 ? 'zoom' : 'fade', dur: 450, after: i === 0 ? 0 : 250 }));
  cards.forEach((c, i) => d.animate(s, c, i === 0 ? { effect: 'rise', dur: 450 } : { auto: true, effect: 'rise', dur: 450, after: 150 }));
  d.animate(s, [...nat, ...natT], { auto: true, effect: 'slam', dur: 420, after: 150 });
  d.source(s, 'OpenAI (Sep 8, 2026) · Gallica · Trans. Camb. Phil. Soc. · Acta Math. 63 · Clay Math. Inst. · Quanta, AMS, Nature (Sep 8) · Portraits: Wikimedia Commons (Leray: K. Jacobs, CC BY-SA 2.0 DE).');
  s.addNotes([
    'MESSAGE: one of the seven Millennium Prize Problems — a question about the equations of fluid flow that mathematicians have chased since the 19th century — has (apparently) been settled by an AI system. Say precisely what was proved: FINITE-TIME BLOWUP, IN THE FORCED CASE.',
    'OpenAI, Sep 8, 2026 ("On the Navier–Stokes Millennium Prize Problem"): "This proof, produced by an internal OpenAI system, shows that the dynamics of the Navier-Stokes equations for fluid motion can develop a singularity in finite time." Same page: "To solve the Navier–Stokes problem, we used an internal model that is significantly more capable than GPT‑6 Astra. We believe it is important to inform the world about the pace of AI progress and what to expect from upcoming models." https://openai.com/index/navier-stokes-solution/ · X post (75M views): "one of the deepest problems at the frontier of mathematics… It has remained unresolved for roughly 90 years." https://x.com/OpenAI/status/2097374640582668336',
    'The paper (author line "OPENAI"), 166 pages: "For every positive viscosity, we construct a solution of the three-dimensional incompressible Navier–Stokes equations that starts from rest and develops unbounded velocity in finite time while maintaining uniformly bounded kinetic energy." It claims alternative (C) of Fefferman\'s official problem statement, and via compact support also (D) on the torus. https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf . Scale (OPENAI\'S OWN FIGURES): ~10,000 agents, 88 hours, plus 17 hours for the Lean formalization; ~2.7M messages and ~130B output tokens on Navier–Stokes (Quanta; Live Science quoting OpenAI). Scott Aaronson estimates "at least ~$15 million" of compute (https://scottaaronson.blog/?p=10062).',
    'TIMELINE (primary sources): 18 Mar 1822 — Navier\'s memoir "Mémoire sur les lois du mouvement des fluides" read to the Académie royale des Sciences (Gallica scan: "Lu à l\'Académie royale des Sciences, le 18 mars 1822", https://gallica.bnf.fr/ark:/12148/bpt6k3221x/f577.item.zoom ). 14 Apr 1845 — Stokes, "On the Theories of the Internal Friction of Fluids in Motion…" ("[Read April 14, 1845.]"; his footnote: "The same equations have also been obtained by Navier…", https://archive.org/details/transactionsofca08camb/page/n308 ). 1934 — Leray, Acta Mathematica 63 (printed 5 July 1934): he believed motions could become irregular in finite time — "je n\'ai malheureusement pas réussi à forger un exemple d\'une telle singularité" (our translation: "unfortunately I have not succeeded in constructing an example of such a singularity"). https://projecteuclid.org/journals/acta-mathematica/volume-63/issue-none/Sur-le-mouvement-dun-liquide-visqueux-emplissant-lespace/10.1007/BF02547354.full . 24 May 2000 — Clay Millennium Prizes announced in Paris at the Collège de France ($7M fund, $1M per problem); Timothy Gowers gave the launch lecture "The Importance of Mathematics". https://www.claymath.org/millennium-problems/ . 8 Sep 2026 — OpenAI. Years (computed): 204 since Navier, 92 since Leray, 26 as a prize. Outlets disagree on the "age" (BBC/OpenAI 90 years, AFP/CBC a century, CNN/Smithsonian/Science ~200) — they count from different starting points.',
    'HOW IMPORTANT (verbatim): Quanta (Konstantin Kakaes, Sep 8): "If the result holds up to further scrutiny, it is, by a significant margin, the most important mathematical proof to have been arrived at by an artificial-intelligence model to date, possibly marking a fundamental turning point in how mathematicians tackle difficult problems." Charles Fefferman (Princeton), who wrote the Clay Institute\'s official problem description: "I was thrilled that the problem was solved" — the heroes, he said, are Córdoba and Martínez-Zoroa. https://www.quantamagazine.org/ai-has-solved-one-of-maths-1-million-millennium-prize-problems-20260908/ . AMS leadership (Ravi Vakil, President; John Meier, CEO), Sep 8: "The news today of progress on resolving the Navier–Stokes problem, one of mathematics\' great longstanding challenges … represents a milestone advance in human knowledge. This story began with Navier, Stokes, Leray, and Ladyzhenskaya and has culminated in the recent breakthroughs of Córdoba and Martínez-Zoroa, then — assisted by new technologies — Alpöge and Buckmaster, with the final steps taken by OpenAI mathematicians." https://x.com/amermathsoc/status/2097380478349463939 . Nature (Davide Castelvecchi, Sep 8): "OpenAI claims huge maths breakthrough on a famed \'Millennium Problem\'" — lede: "For the first time, a truly major open problem in mathematics has been solved by a computer, according to OpenAI…" https://www.nature.com/articles/d41586-026-02842-5',
    'More (Q&A): Scientific American: "For the second time ever, someone has solved one of the seven Millennium Prize Problems… But unlike the first time, that someone is an artificial intelligence start-up." MIT Technology Review: "this episode may mark a turning point in the history of mathematics." Gowers (via Smithsonian quoting the WSJ): "It\'s undeniable that symbolically, it\'s a big moment" (he had not yet read the paper). Science (Sep 15): "OpenAI breakthrough triggers \'existential crisis\' in math"; Gómez-Serrano: "a problem that has been open for 200-plus years—it\'s a genuine accomplishment"; Gukov: "It\'s an earthquake." WSJ headline: "OpenAI Says It Has Solved a Millennium Prize Problem—a Holy Grail of Math". Albritton (Science News): "It is a huge deal to know the answer."',
    'CAVEATS (keep off the slide, say if asked): (1) It is the FORCED case — the construction uses a smooth external force; the unforced problem (Fefferman\'s A/B) remains open, and Constantin, Ignatova & Vicol (arXiv:2609.20803, Sep 17) show OpenAI-type constructions are regular when the force is real-analytic, so the method does not reach A/B. (2) Not yet fully verified by humans: Lean-checked, but Eyink (Science News): "I don\'t think anyone has completely verified the proof yet, certainly not on the human side." (3) The Clay Institute (Sep 11): "the Navier-Stokes problem has apparently been settled" … "The process is deliberately unhurried"; its site still lists Navier–Stokes under "Active problems"; no prize awarded; OpenAI says it will not claim it. https://www.claymath.org/news/navier-stokes-announcement/ (4) Credit is contested (next slide): the AMS and Fefferman credit Córdoba & Martínez-Zoroa and Alpöge & Buckmaster for the groundwork.',
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

// ---------------------------------------------------------------- 9. experts react (Sep 3 – Oct 1): blog quotes
// (title says "Experts", not "Mathematicians": the quoted words are Scott Aaronson's, a computer scientist)
async function aftermathSlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  s.addText(`${KICK} · MATHEMATICS IN CRISIS · 3`, { placeholder: 'kicker' });
  s.addText('Experts react: “forevermore dethroned”', { placeholder: 'title' });

  const qRuns = (parts, size) => parts.map(([t, em, br]) => ({ text: t, options: { bold: em === 1, color: em === 1 ? d.S.red : d.S.txt, breakLine: !!br, fontSize: size } }));
  // ---- top row: Aaronson · Tao
  const cw = (CW - 0.3) / 2, chh = 2.3, y0 = 1.75;
  const top = [
    {
      shot: [R('aaronson-title.png'), 'aaronson-title-crop.png', { l: 26, t: 26, w: 1370, h: 139 }, 0.5], // title + first line of the post
      quote: [['“…update on the fact that '], ['the wild prophecies have come true', 1], ['.”', 0, 1], ['“…human mathematicians are '], ['forevermore dethroned', 1], [' as the main theorem-proving entities on planet earth.”']],
      who: 'Scott Aaronson (computer scientist) · Shtetl-Optimized · Sep 15, 2026',
    },
    {
      shot: [R('tao-mastodon-stripmining.png'), 'tao-header-crop.png', { l: 26, t: 26, w: 420, h: 106 }, 0.5],
      quote: [['“…the indiscriminate automated '], ['strip-mining of open problems', 1], [' for solutions '], ['may destroy the ecosystem', 1], [' from which the next generation of mathematical techniques, problems, and practitioners would have developed…”']],
      who: 'Terence Tao on Mathstodon, after Hugo Duminil-Copin · Sep 3, 2026',
    },
  ];
  const groups = [];
  for (let i = 0; i < top.length; i++) {
    const c = top[i];
    const x = MX + i * (cw + 0.3);
    const g = [d.card(s, { x, y: y0, w: cw, h: chh })];
    const [src, nm, b, hh] = c.shot;
    const fr = await d.frame(s, await crop(src, nm, b), { x: x + 0.2, y: y0 + 0.18, w: cw - 0.4, h: hh }, { align: 'left', pad: 0.05 });
    g.push(...fr);
    const qy = y0 + 0.18 + hh + 0.12;
    g.push(d.text(s, qRuns(c.quote), { x: x + 0.22, y: qy, w: cw - 0.44, h: y0 + chh - 0.42 - qy, fontSize: 15, italic: true, color: d.S.txt, fontFace: 'Cambria', valign: 'middle', fit: 'shrink' }));
    g.push(d.text(s, c.who, { x: x + 0.22, y: y0 + chh - 0.38, w: cw - 0.44, h: 0.28, fontSize: 11, color: d.S.muted, valign: 'middle' }));
    groups.push(g);
  }

  // ---- bottom: Kevin Buzzard, "To grieve, or not to grieve?" (Oct 1) — real header + verbatim pull-quote; FLT (Sep 4) small
  const by = y0 + chh + 0.25, bh = 6.52 - by, bx = MX, bw = CW;
  const bz = [d.card(s, { x: bx, y: by, w: bw, h: bh })];
  const lw = 3.55;
  const head = await d.frame(s, R('rev2/buzzard-grieve-header.png'), { x: bx + 0.2, y: by + 0.15, w: 3.0, h: 3.0 * 228 / 966 }, { align: 'left', pad: 0.05, link: 'https://xenaproject.wordpress.com/2026/10/01/to-grieve-or-not-to-grieve/' });
  const hg = head.geom;
  const whoB = d.text(s, 'Kevin Buzzard (Imperial College London) · Oct 1, 2026', { x: bx + 0.22, y: hg.y + hg.h + 0.08, w: lw + 0.2, h: 0.24, fontSize: 11, color: d.S.muted, valign: 'top' });
  // FLT: the "11 days" line, kept small — the post's real title line (legible size) + what took 11 days, verbatim.
  // Short lead-in so the quote sits in two lines with bottom padding (the FLT title frame above names the topic).
  const fy = hg.y + hg.h + 0.4;
  const flt = await d.frame(s, await crop(R('buzzard-flt-title.png'), 'buzzard-flt-crop.png', { l: 28, t: 36, w: 712, h: 62 }), { x: bx + 0.2, y: fy, w: 2.5, h: 2.4 * 62 / 712 + 0.1 }, { align: 'left', pad: 0.05, link: 'https://xenaproject.wordpress.com/2026/09/04/flt-anthropic-has-beaten-me-to-it/' });
  const fg = flt.geom;
  const fltT = d.text(s, [
    { text: 'Sep 4, on the Lean proof of FLT: ', options: { color: d.S.muted } },
    { text: '“I was given £1M to run my project over 5 years; Anthropic took only 11 days…”', options: { color: d.S.txt, italic: true, fontFace: 'Cambria' } },
  ], { x: bx + 0.22, y: fg.y + fg.h + 0.06, w: lw + 0.2, h: by + bh - 0.12 - (fg.y + fg.h + 0.06), fontSize: 10.5, valign: 'top' });
  const div = line(d, s, bx + lw + 0.55, by + 0.25, bx + lw + 0.55, by + bh - 0.25, { color: HEX.line, width: 1 });
  const px = bx + lw + 0.8, pw = bx + bw - 0.25 - px;
  const pull = d.text(s, [
    ...qRuns([['“AI has solved a Millennium problem and this has shown us where AI '], ['is', 0], [' in mathematics. But I believe that many people in our community are still '], ['vastly underestimating how fast AI is moving', 1], ['…”', 0, 1]], 19.5),
    { text: '“We are not all grieving. But many of us are in one of the stages of grief.”', options: { fontSize: 15, color: LIGHT } },
  ], { x: px, y: by + 0.15, w: pw, h: bh - 0.3, italic: true, fontFace: 'Cambria', valign: 'middle', paraSpaceAfter: 8 });
  bz.push(...head, whoB, ...flt, fltT, div, pull);

  groups.forEach((g, i) => d.animate(s, g, i === 0 ? { auto: true, effect: 'rise', dur: 500 } : { effect: 'rise', dur: 500 }));
  d.animate(s, bz, { effect: 'rise', dur: 500 });
  d.source(s, 'Sources: scottaaronson.blog/?p=10062 · mathstodon.xyz/@tao (Sep 3, 2026) · xenaproject.wordpress.com: “To grieve, or not to grieve?” (Oct 1) and “FLT: Anthropic has beaten me to it” (Sep 4, 2026).');
  s.addNotes([
    'MESSAGE: the people at the top of the field are saying, in public, that something fundamental has changed — some with awe, many with grief. These span Sep 3 – Oct 1, 2026 (the prime-gaps race, Anthropic\'s Lean proof of FLT, then Navier–Stokes), not reactions to Navier–Stokes alone — note the dates on the cards.',
    'Scott Aaronson (a theoretical computer scientist, not a mathematician — hence the credit on the card), "The Age of Wonders and Terrors", Shtetl-Optimized, Sep 15, 2026 (https://scottaaronson.blog/?p=10062). Opens with the 2006-era skeptic\'s line: "…we\'ll see major math problems getting solved by AIs—even the Clay Millennium Problems. That will be the time to panic! Wake me up when that happens!" — then: "update on the fact that the wild prophecies have come true." Also: "it seems safe to say that human mathematicians are forevermore dethroned as the main theorem-proving entities on planet earth." And: "It seems to me that the Singularity has already started; it\'s just wildly unevenly distributed." And: "By any accounting that doesn\'t stack the deck, Eliezer Yudkowsky was right about what the greatest challenge facing civilization in our lifetimes was going to be, and you and I were wrong about it."',
    'Terence Tao, Mathstodon, Sep 3, 2026 (https://mathstodon.xyz/@tao/117204930249967695), relaying Hugo Duminil-Copin (Proofs and Prompts, "Care for a little more AI?", Aug 30): "As Hugo Duminil-Copin wrote recently at proofsandprompts.com/2026/08/3… , the indiscriminate automated strip-mining of open problems for solutions may destroy the ecosystem…, similarly to how using excavators to dig out treasures from an archeological site destroys the rich historical context". Tao continues: "It may become necessary to declare certain classes of mathematical problems off-limits to automated solvers, in order to preserve their broader value to the mathematical ecosystem (for instance, through the training of future mathematicians)." The sentence is Tao\'s (no quotation marks around Duminil-Copin): credit the idea to Duminil-Copin and the words to Tao. (Checked Oct 4: the strip-mining / excavator wording is not in Duminil-Copin\'s post itself — do not quote it as his.) Also Tao to AFP (Sep 18): "I am currently completely overwhelmed with an existential crisis in my field." (https://www.malaymail.com/news/life/2026/09/18/maths-midlife-crisis-ai-solves-in-four-days-what-stumped-mathematicians-for-a-century/235502). NOTE: "After Math" on Tao\'s blog (Sep 12) is a GUEST post by Silvia De Toffoli & Eamon Duede — not Tao\'s words.',
    'Kevin Buzzard (professor of pure mathematics at Imperial College London; the blog byline "xenaproject" is his), "To grieve, or not to grieve?", Xena, Oct 1, 2026 — https://xenaproject.wordpress.com/2026/10/01/to-grieve-or-not-to-grieve/ . Verbatim pull-quote (on the page "is" and "moving" are italic): "AI has solved a Millennium problem and this has shown us where AI is in mathematics. But I believe that many people in our community are still vastly underestimating how fast AI is moving, perhaps because they only just started paying attention to it. If we use \'understanding\' as a justification for the continued existence of mathematics as a subject worth studying, then where exactly do we retreat to when in 1 year\'s time AI is not only proving theorems, but also doing a perfectly good job of explaining them to humans?" And: "We are not all grieving. But many of us are in one of the stages of grief." He maps colleagues\' reactions onto the Kübler-Ross stages: "A faculty member I know who works in fluids told me that the Navier–Stokes news was \'extremely depressing\'. A post-doc I know told me that they were considering leaving mathematical research because of what it was about to become. A PhD student I know told me that they were stuck on a lemma in their research and ChatGPT one-shotted it and it made them wonder what the point of it all was." For balance, Buzzard himself is optimistic: "I personally am extremely excited about the future of our field" and "mathematics is infinite which beats exponential hands down". He also quotes Peter Scholze (HLF panel, Sep 15) saying he will "die on that hill" rather than use AI.',
    'Small element — Kevin Buzzard, "FLT: Anthropic has beaten me to it", Xena, Sep 4, 2026 (https://xenaproject.wordpress.com/2026/09/04/flt-anthropic-has-beaten-me-to-it/): an Anthropic internal model, using the prove2.me platform, formalized a complete proof of Fermat\'s Last Theorem in Lean — the last item on Freek Wiedijk\'s list of 100 formalization challenges; over 13.4 million lines. "I was given £1M to run my project over 5 years; Anthropic took only 11 days but I do wonder if they spent more money…"',
    'Not shown (Q&A): "A Severe Misalignment of AI in Mathematics" (mathandai.org, Sep 11, 2026), a joint declaration by two dozen+ Fields Medalists incl. Tao: "The goals of the AI companies and the goals of the mathematical community are severely misaligned." Signatory counts vary by source (25–28 Fields Medalists); Science reports nearly 6,000 more mathematicians signed after release.',
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

// ---------------------------------------------------------------- 11. OpenAI: 100+ results, unreleased (+ the "hundreds" hearsay)
const MR = (f) => R(`rev2/mathrumors/${f}`);
const MRU = {
  openai: 'https://openai.com/index/advisory-group-on-mathematics-and-ai/',
  openaiX: 'https://x.com/OpenAI/status/2102093145051943229',
  tao: 'https://terrytao.wordpress.com/2026/09/21/advisory-group-on-mathematics-and-artificial-intelligence/',
  nyt: 'https://www.nytimes.com/2026/09/22/science/math-ai-history-understanding.html',
  verge: 'https://www.theverge.com/ai-artificial-intelligence/1001477/openai-math-advisory-group',
  curran: 'https://x.com/AndrewCurran_/status/2102121553211412975',
  aaronson: 'https://scottaaronson.blog/?p=10062',
  vergeNyt: 'https://www.theverge.com/ai-artificial-intelligence/993568/openai-says-it-has-made-substantial-progress-on-another-major-math-problem',
  brockman: 'https://x.com/AndrewCurran_/status/2099999310490603856',
  drsing: 'https://x.com/Dr_Singularity/status/2097746969212981732',
  synth: 'https://x.com/synthwavedd/status/2097971881596916185',
  chubby: 'https://x.com/kimmonismus/status/2097990443690496402',
  glazer: 'https://x.com/ElliotGlazer/status/2097987910675075572',
  reddit: 'https://www.reddit.com/r/mathematics/comments/1wcn9xy/openai_claims_to_have_made_substantial_progress/',
  harris: 'https://siliconreckoner.substack.com/p/if-you-dont-want-me-to-be-nice-then',
  gizmodo: 'https://gizmodo.com/openai-reportedly-trying-to-solve-hodge-conjecture-amid-feud-with-math-community-2000813658',
  decoder: 'https://the-decoder.com/openai-reportedly-closes-in-on-solving-the-hodge-conjecture-its-second-millennium-prize-problem/',
  vergeHodge: 'https://www.theverge.com/ai-artificial-intelligence/996949/this-is-the-next-millennium-prize-math-challenge-openai-is-reportedly-chasing',
  totaro: 'https://terrytao.wordpress.com/2026/09/11/on-the-hodge-conjecture/',
  sciam: 'https://www.scientificamerican.com/article/which-million-dollar-math-problem-could-ai-solve-next/',
  clayHodge: 'https://www.claymath.org/millennium/hodge-conjecture/',
  clayBsd: 'https://www.claymath.org/millennium/birch-and-swinnerton-dyer-conjecture/',
  poly: 'https://polymarket.com/event/which-millennium-prize-problem-will-ai-solve-next',
  manifold: 'https://manifold.markets/HumanClanker/will-another-millennium-prize-probl',
  kalshi: 'https://kalshi.com/markets/kxhodge',
  armstrong: 'https://x.com/scottnarmstrong/status/2099960311801696580',
  armstrongAug: 'https://x.com/scottnarmstrong/status/2091897271130448159',
};

async function pipelineSlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  s.addText(`${KICK} · MATHEMATICS IN CRISIS · 5`, { placeholder: 'kicker' });
  s.addText('OpenAI claims 100+ more results, unreleased', { placeholder: 'title' });

  // ---- left: the number (a vendor claim), who says "waiting to release", and where "hundreds" comes from (hearsay)
  const lw = 4.9;
  const big = d.text(s, '100+', { x: MX, y: 1.72, w: 2.15, h: 0.92, fontSize: 64, bold: true, fontFace: 'Arial', color: d.S.red, valign: 'middle' });
  const bigT = d.text(s, 'long-standing open problems “resolved” by a new internal model, says OpenAI',
    { x: MX + 2.2, y: 1.72, w: lw - 2.2, h: 0.92, fontSize: 14, color: d.S.txt, valign: 'middle' });
  const vendor = label(d, s, 'VENDOR CLAIM · NO LIST OR PROOFS PUBLISHED', MX, 2.66, lw, { color: d.S.amber, h: 0.26 });
  const nb = { x: MX + 0.05, y: 3.12, w: lw - 0.1, h: 1.17 };
  const nyt = d.headlineCard(s, {
    outlet: 'The New York Times', date: '2026-09-22', headline: 'Mathematics Isn’t Just a Game to Let A.I. Solve. History Shows Why.',
    dek: 'Guest essay, Steven Strogatz & Alex Townsend: “…results that OpenAI was waiting to release…”',
  }, nb, { rot: -1.2, size: 's' });
  const ntab = outletTab(d, s, { x: nb.x + 0.06, y: nb.y + 0.06, w: nb.w - 0.12, h: nb.h - 0.12 }, 'NYT ESSAY: “WAITING TO RELEASE”', 'br', -1.2);
  // Scott Armstrong (NYU/Courant) on X, Sep 15: header + first two paragraphs of the real post (contiguous crop)
  const acrop = await crop(MR('x-scottnarmstrong-sep15-hundreds-of-proofs-page.png'), 'math-armstrong-hundreds-head.png', { l: 572, t: 442, w: 1168, h: 362 });
  const ay = 4.86, aw = lw - 0.05;
  const af = await d.frame(s, acrop, { x: MX + 0.05, y: ay, w: aw, h: (aw - 0.12) * 362 / 1168 + 0.12 }, { rot: 0.8, align: 'left', link: MRU.armstrong });
  const ag = af.geom;
  const atab = outletTab(d, s, ag, 'X · @SCOTTNARMSTRONG (NYU) · SEP 15 · 58.9K VIEWS', 'tl', 0.8);
  // native marker over '"hundreds" of proofs of results, I was told,' (rotated with the clipping about its centre)
  const ahl = [[790, 272, 328, 44], [8, 312, 262, 44]].map(([x, y, w, h]) => {
    const k = ag.w / 1168, th = 0.8 * Math.PI / 180;
    const cx = ag.x + ag.w / 2, cy = ag.y + ag.h / 2;
    const bx = ag.x + (x + w / 2) * k - cx, by = ag.y + (y + h / 2) * k - cy;
    const px = cx + bx * Math.cos(th) - by * Math.sin(th), py = cy + bx * Math.sin(th) + by * Math.cos(th);
    const n = d.name('hl');
    s.addShape(d.pres.shapes.RECTANGLE, { x: px - w * k / 2, y: py - h * k / 2, w: w * k, h: h * k, rotate: 0.8, fill: { color: HEX.amber, transparency: 60 }, line: { color: HEX.amber, width: 0, transparency: 100 }, objectName: n });
    return n;
  });
  // red "UNCONFIRMED HEARSAY" stamp in the empty right part of the post's header row (clear of the text)
  const stW = 2.35, stH = 0.32, stX = ag.x + ag.w - stW - 0.55, stY = ag.y + 0.05;
  const stamp = d.name('stamp');
  s.addShape(d.pres.shapes.RECTANGLE, { x: stX, y: stY, w: stW, h: stH, rotate: -3, fill: { color: 'FFFFFF', transparency: 100 }, line: { color: HEX.red, width: 2 }, objectName: stamp });
  const stampT = d.text(s, 'UNCONFIRMED HEARSAY', { x: stX, y: stY, w: stW, h: stH, rotate: -3, fontSize: 12, bold: true, color: d.S.red, charSpacing: 1, align: 'center', valign: 'middle', fontFace: 'Arial' });

  // ---- right: OpenAI's own paragraph (real screenshot) with the key sentence marked
  const rx = MX + lw + 0.45, rw = 12.73 - rx;
  const para = await crop(MR('openai-advisory-post-100-problems.png'), 'math-openai-100-para.png', { l: 60, t: 895, w: 1210, h: 400 });
  const pf = await d.frame(s, para, { x: rx, y: 1.8, w: rw, h: (rw - 0.12) * 400 / 1210 + 0.12 }, { link: MRU.openai });
  const pg = pf.geom;
  const ptab = outletTab(d, s, pg, 'OPENAI · “ADVISORY GROUP ON MATHEMATICS AND AI” · SEP 21, 2026', 'tl');
  const hl = highlight(d, s, pg, 1210, [[846, 63, 292, 52], [17, 119, 1126, 52], [17, 175, 200, 52]]);

  // the outside group set up to manage the release (its own words, on Tao's blog), and OpenAI's caveat about pace
  const ty = pg.y + pg.h + 0.42;
  const tcrop = await crop(MR('tao-blog-agmai-announcement-current-task.png'), 'math-agmai-current-task.png', { l: 0, t: 112, w: 1040, h: 120 });
  const tf = await d.frame(s, tcrop, { x: rx, y: ty, w: rw, h: (rw - 0.12) * 120 / 1040 + 0.12 }, { link: MRU.tao });
  const tg = tf.geom;
  const ttab = outletTab(d, s, tg, 'THE ADVISORY GROUP (GOWERS, HAIRER, WITTEN…) · TAO’S BLOG · SEP 21', 'tl');
  const thl = highlight(d, s, tg, 1040, [[181.6, 9.6, 787.4, 34], [20, 43.6, 954.2, 34], [20, 77.6, 597.4, 34]]);
  const qy = tg.y + tg.h + 0.2;
  const pace = d.text(s, [
    { text: 'OpenAI: the group “', options: { color: d.S.muted } },
    { text: 'will not be responsible for advising us on how to pace our internal progress', options: { color: d.S.txt, bold: true, italic: true } },
    { text: ' on mathematics.”', options: { color: d.S.muted } },
  ], { x: rx, y: qy, w: rw, h: 6.52 - qy, fontSize: 14, valign: 'middle' });

  d.animate(s, [big, bigT], { auto: true, effect: 'zoom', dur: 500 });
  d.animate(s, [vendor], { auto: true, effect: 'fade', dur: 400, after: 100 });
  d.animate(s, [...pf, ...ptab], { auto: true, effect: 'fade', dur: 600, after: 150 });
  d.animate(s, hl.map((n, i) => ({ name: n, effect: 'wipeLeft', dur: 350, delay: i * 300 })), { auto: true, after: 200 });
  d.animate(s, [...nyt, ...ntab], { effect: 'slam', dur: 420 });
  d.animate(s, [...tf, ...ttab], { effect: 'fade', dur: 500 });
  d.animate(s, thl.map((n, i) => ({ name: n, effect: 'wipeLeft', dur: 350, delay: i * 300 })), { auto: true, after: 100 });
  d.animate(s, [pace], { effect: 'fade', dur: 500 });
  d.animate(s, [...af, ...atab], { effect: 'slam', dur: 420 });
  d.animate(s, ahl.map((n, i) => ({ name: n, effect: 'wipeLeft', dur: 350, delay: i * 300 })), { auto: true, after: 100 });
  d.animate(s, [stamp, stampT], { auto: true, effect: 'zoom', dur: 350, after: 150 });
  d.source(s, 'OpenAI, “Advisory Group on Mathematics and AI” (Sep 21, 2026) · the Advisory Group on T. Tao’s blog (Sep 21) · S. Strogatz & A. Townsend, NYT (Sep 22) · Scott Armstrong on X (Sep 15; hearsay).');
  s.addNotes([
    'MESSAGE: Navier–Stokes was not the end of it. OpenAI says the same internal model has since resolved more than a hundred long-standing open problems. None of them has been published: OpenAI says only that it is discussing "the best way to inform the community"; it is the NYT essay, The Verge and OpenAI\'s own advisory group who describe the results as waiting to be released. The 100+ is a vendor claim (no list, no proofs). The flood, if real, has not hit yet.',
    'PRECISE WORDING — OpenAI itself says only "more than 100" (do not say "hundreds" except as the hearsay below). OpenAI, Sep 21, 2026: "On August 28, we began training a new internal model. In addition to resolving the Navier–Stokes Millennium Prize problem, this model has now resolved more than 100 long-standing open problems across most areas of mathematics. The pace of its progress in mathematics has surprised the mathematicians within OpenAI. This has led to internal discussions on the best way to inform the community of the rapid progress to prepare and adapt the field." ' + MRU.openai + ' (X announcement, 6.6M views: ' + MRU.openaiX + '). We found no OpenAI statement saying "hundreds"; the figure is "more than 100", and OpenAI has not published a list or the proofs (the amber marks on the screenshots are ours).',
    'WHERE "HUNDREDS" COMES FROM (bottom-left clipping; UNCONFIRMED HEARSAY, say so): NYU/Courant mathematician Scott Armstrong (@scottnarmstrong; bio: "CNRS DR at LJLL/Sorbonne and Math Prof at Courant/NYU") on X, Sep 15, 2026, 20:35 UTC (58.9K views): "I am worried about a situation in which rumors are constantly swirling about major results and your distance to the labs in the social graph distance determines how much you know. Since at least the ICM they (openAI) have been sitting on \"hundreds\" of proofs of results, I was told, and I suspect Levent has more than he has released. Some of them may not be released any time soon. I don\'t think it\'s a great situation if this persists." ' + MRU.armstrong + ' . Earlier, Aug 24, 2026 (reply to Daniel Litt): "I am asking because I heard rumors at the ICM that they [openAI] \"are sitting on hundreds of results\"" ' + MRU.armstrongAug + ' . (ICM = International Congress of Mathematicians, Philadelphia, Jul 23–30, 2026.) Both are second-hand ("I was told", "I heard rumors"), with no source named. OpenAI itself says only "more than 100". Armstrong\'s complaint is itself the safety point: who knows what depends on how close you are to the labs.',
    '"WAITING TO BE RELEASED" is how others describe it, consistently: NYT guest essay by Cornell mathematicians Steven Strogatz and Alex Townsend (Sep 22), "Mathematics Isn\'t Just a Game to Let A.I. Solve. History Shows Why.": "Just yesterday, the company announced that the same internal model had now \'resolved more than 100 longstanding problems across most areas of mathematics\' — results that OpenAI was waiting to release until it had figured out \'the best way to inform the community of the rapid progress to prepare and adapt the field.\'" ' + MRU.nyt + ' (card, not a screenshot: NYT blocks our browser). The Advisory Group itself (guest post on Tao\'s blog, Sep 21): "Current Task. We are currently facing the very specific challenge of advising OpenAI on how to coordinate the release of a large number of significant results in mathematics that they report have been produced by their internal model." ' + MRU.tao + ' . The Verge (Robert Hart, Sep 28, "OpenAI keeps bulldozing mathematicians"): OpenAI "is sitting on a tranche of results it is clearly eager to release as soon as possible". ' + MRU.verge,
    'THE GROUP: François Charles, Camillo De Lellis, Timothy Gowers, Martin Hairer, Nikhil Srivastava, Ulrike Tillmann, Ravi Vakil, Edward Witten, Melanie Matchett Wood (hosted at the Institute for Advanced Study; unpaid; independent). OpenAI\'s post: it will "advise on how to coordinate their dissemination" — but "Importantly, the group will not be responsible for advising us on how to pace our internal progress on mathematics." That last line is the safety point: outside experts manage the announcement, not the speed.',
    'Related rumor (Q&A): Scott Aaronson (Sep 15) heard that "the AI companies, having been burned by the hostile response to the Navier-Stokes proof, are now sitting on solutions to some very major problems until they figure out a better way to handle things" (theoretical CS; a rumor) ' + MRU.aaronson + ' ; Andrew Curran on Sep 21: "The rumors were true once again; they are sitting on multiple major announcements." ' + MRU.curran,
  ].join('\n\n'));
  return s;
}

// ---------------------------------------------------------------- 12. the Hodge / BSD rumors (clearly labelled)
async function rumorsSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  s.addText(`${KICK} · MATHEMATICS IN CRISIS · 6`, { placeholder: 'kicker' });
  s.addText('Unconfirmed rumors: Hodge and BSD next?', { placeholder: 'title' });

  // ---- left: who said what, where, when
  const lw = 6.15;
  const l1 = label(d, s, 'THE RUMOR · WHO SAID WHAT, WHERE, WHEN', MX, 1.62, lw, { color: d.S.amber });
  const early = d.text(s, [
    { text: 'Sep 9 · @Dr_Singularity on X: ', options: { bold: true, color: d.S.steel } },
    { text: '“Rumors are emerging that OpenAI may have solved the Hodge conjecture”', options: { italic: true, color: d.S.txt } },
  ], { x: MX, y: 1.95, w: lw, h: 0.54, fontSize: 14, valign: 'top' });
  const sw = 5.75;
  const sf = await d.frame(s, MR('x-synthwavedd-hodge-bsd-rumor.png'), { x: MX + 0.05, y: 2.58, w: sw, h: (sw - 0.12) * 510 / 1200 + 0.12 }, { rot: -1, link: MRU.synth });
  const stab = outletTab(d, s, sf.geom, 'X · @SYNTHWAVEDD · SEP 10 · 1.5M VIEWS', 'br', -1);
  // red "unconfirmed" stamp on the empty top-right of the post (clear of its text)
  const sg = sf.geom;
  const stamp = d.name('stamp');
  const stW = 2.25, stH = 0.4, stX = sg.x + sg.w - stW - 0.14, stY = sg.y + 0.03;
  s.addShape(d.pres.shapes.RECTANGLE, { x: stX, y: stY, w: stW, h: stH, rotate: -6, fill: { color: 'FFFFFF', transparency: 100 }, line: { color: HEX.red, width: 2.5 }, objectName: stamp });
  const stampT = d.text(s, 'UNCONFIRMED', { x: stX, y: stY, w: stW, h: stH, rotate: -6, fontSize: 15, bold: true, color: d.S.red, charSpacing: 1.5, align: 'center', valign: 'middle', fontFace: 'Arial' });

  const gy = sg.y + sg.h + 0.4;
  const gcrop = await crop(MR('gizmodo-openai-reportedly-trying-hodge.png'), 'math-gizmodo-hodge-head.png', { l: 0, t: 98, w: 980, h: 492 });
  const gh = 6.5 - gy, gw = (gh - 0.12) * 980 / 492 + 0.12;
  const gf = await d.frame(s, gcrop, { x: MX + 0.05, y: gy, w: gw, h: gh }, { rot: 1.2, link: MRU.gizmodo });
  const gtab = outletTab(d, s, gf.geom, 'GIZMODO · SEP 17', 'tl', 1.2);
  const tx = MX + gw + 0.35, tw = MX + lw - tx;
  const info = d.text(s, [
    { text: 'The Information', options: { bold: true, color: d.S.steel } },
    { text: ' (', options: { color: d.S.txt } },
    { text: 'one', options: { color: d.S.txt, bold: true } },
    { text: ' OpenAI source): staff “expect to soon crack the Hodge Conjecture”', options: { color: d.S.txt, breakLine: true, paraSpaceAfter: 4 } },
    { text: 'Skeptic: ', options: { bold: true, color: d.S.steel } },
    { text: '“What would close even mean for BSD?” ', options: { italic: true, color: d.S.txt } },
    { text: '— Elliot Glazer', options: { color: d.S.muted, fontSize: 12 } },
  ], { x: tx, y: gy - 0.03, w: tw, h: 6.55 - gy, fontSize: 14, valign: 'top' });

  // ---- right: what is actually on the record, the status, and the betting
  const rx = MX + lw + 0.45, rw = 12.73 - rx;
  const r1 = label(d, s, 'ON THE RECORD · OPENAI TO THE NYT · SEP 10', rx, 1.62, rw, { color: d.S.blue });
  const rec = d.text(s, [
    { text: '“…we have made substantial progress on another Millennium Prize problem.”', options: { italic: true, fontFace: 'Cambria', fontSize: 15, color: d.S.txt, breakLine: true, paraSpaceAfter: 3 } },
    { text: 'It has not said which one.', options: { fontSize: 14, bold: true, color: d.S.txt } },
  ], { x: rx, y: 1.95, w: rw, h: 0.95, valign: 'top' });
  const r2 = d.text(s, [
    { text: 'CLAY MATHEMATICS INSTITUTE · OCT 4 · BOTH ', options: { color: d.S.blue } },
    { text: '“UNSOLVED”', options: { color: 'FF8A8C' } },
  ], { x: rx, y: 2.95, w: rw, h: 0.28, fontSize: 10, bold: true, charSpacing: 2, valign: 'bottom' });
  const ch1 = await crop(MR('clay-hodge-conjecture-unsolved.png'), 'math-clay-hodge-head.png', { l: 0, t: 70, w: 1400, h: 315 });
  const ch2 = await crop(MR('clay-bsd-conjecture-unsolved.png'), 'math-clay-bsd-head.png', { l: 0, t: 70, w: 1400, h: 470 });
  const cH = 0.7, cy = 3.28;
  const w1 = cH * 1400 / 315, w2 = cH * 1400 / 470, cgap = rw - w1 - w2;
  const c1 = await d.frame(s, ch1, { x: rx, y: cy, w: w1, h: cH }, { border: false, pad: 0, link: MRU.clayHodge });
  const c2 = await d.frame(s, ch2, { x: rx + w1 + cgap, y: cy, w: w2, h: cH }, { border: false, pad: 0, link: MRU.clayBsd });
  const r3 = label(d, s, 'POLYMARKET · WHICH ONE WILL AN AI LAB ANNOUNCE NEXT? (%)', rx, cy + cH + 0.2, rw, { color: d.S.blue });
  const ds = DS['polymarket-hodge-bsd-daily'];
  const mon = { '09': 'Sep', '10': 'Oct' };
  // Weekly labels at indices 0, 7, 14, 21 and tickLblSkip = 7, so PowerPoint (which draws every 7th label from index 0) and
  // LibreOffice (which ignores tickLblSkip and draws every label) both show exactly Sep 10 / Sep 17 / Sep 24 / Oct 1.
  const labs = ds.labels.map((l, i) => (i % 7 === 0 ? `${mon[l.slice(5, 7)]} ${+l.slice(8)}` : ''));
  const pick = ['Hodge Conjecture', 'Birch and Swinnerton-Dyer', 'No solution by Dec 31, 2027'];
  const series = pick.map((nm) => ({ name: nm === 'Hodge Conjecture' ? 'Hodge' : nm === 'Birch and Swinnerton-Dyer' ? 'BSD' : 'None by 2027', labels: labs, values: ds.series.find((x) => x.name === nm).values }));
  const chartY = cy + cH + 0.48;
  const pch = d.chart(s, 'line', series, { x: rx - 0.05, y: chartY, w: rw + 0.05, h: 6.12 - chartY }, {
    chartColors: [HEX.red, HEX.blue, '6B7383'], lineSize: 2.25, lineDataSymbol: 'none', legendPos: 'r', legendFontSize: 11,
    valAxisMinVal: 0, valAxisMaxVal: 80, valAxisMajorUnit: 20, catAxisLabelFrequency: 7, catAxisLabelRotate: 0,
    valAxisLabelFontSize: 10, catAxisLabelFontSize: 10,
  });
  const pfoot = d.text(s, 'Daily price ≈ implied probability · thin market ($214K traded): sentiment, not evidence',
    { x: rx, y: 6.14, w: rw, h: 0.36, fontSize: 10.5, italic: true, color: d.S.muted, valign: 'middle' });

  d.animate(s, [l1, early], { auto: true, effect: 'fade', dur: 500 });
  d.animate(s, [...sf, ...stab], { auto: true, effect: 'slam', dur: 420, after: 150 });
  d.animate(s, [stamp, stampT], { effect: 'zoom', dur: 350 });
  d.animate(s, [...gf, ...gtab], { effect: 'slam', dur: 420 });
  d.animate(s, [info], { auto: true, effect: 'fade', dur: 500, after: 100 });
  d.animate(s, [r1, rec], { effect: 'fade', dur: 500 });
  d.animate(s, [r2, ...c1, ...c2], { auto: true, effect: 'fade', dur: 500, after: 150 });
  d.animate(s, [r3, { name: pch, effect: 'wipeLeft', dur: 1200 }, pfoot], { effect: 'fade' });
  d.source(s, 'X posts (Sep 9–10, 2026) · OpenAI’s NYT statement via The Verge (Sep 10) · Gizmodo, reporting The Information (Sep 17) · claymath.org, Polymarket (Oct 4).');
  s.addNotes([
    'MESSAGE (say it as a rumor, twice): nobody has claimed a proof of the Hodge conjecture or of Birch and Swinnerton-Dyer. What exists is (1) OpenAI saying, on the record, it made "substantial progress on another Millennium Prize problem" without naming it, and (2) anonymous rumors that it is Hodge (OpenAI) and BSD ("one of OpenAI or Anthropic"). Both are Clay Millennium Prize Problems ($1M each); Clay still lists both as "Unsolved" (Oct 4, 2026). The point for this talk: the field now treats "AI proves another Millennium problem next month" as a live possibility, with real money on it.',
    'WHO SAID WHAT, WHERE, WHEN: Sep 9, 18:00 UTC — @Dr_Singularity on X (409K views): "Rumors are emerging that OpenAI may have solved the Hodge conjecture, another Millennium Prize Problem." (unsourced) ' + MRU.drsing + ' . Sep 10, 08:54 UTC — @synthwavedd ("leo", ~46K followers; 1.57M views), THE source of the Hodge+BSD rumor: "I am told the Hodge Conjecture is very close to being verified by OpenAI, and that one of OpenAI or Anthropic are also close to solving Birch-Swinnerton-Dyer. The race to be \'next\' behind the scenes is unlike anything I\'ve had described to me before. If true - and it may not be, given the scale of the rumour mill right now - it could mean 3 Millennium Problems fall in the space of a month." ' + MRU.synth + ' . 10:07 UTC — amplified by @kimmonismus (664K views) ' + MRU.chubby + ' . On r/mathematics a top comment (228 pts) claimed Hodge was "fully solved and is only awaiting verification", a reply that BSD "is proved true" — anonymous speculation ' + MRU.reddit,
    'ON THE RECORD: OpenAI\'s statement to the NYT, Sep 10 (quoted by The Verge, Emma Roth): "In addition, since the completion of Navier-Stokes, we have made substantial progress on another Millennium Prize problem. We are working through how to share these results thoughtfully." ' + MRU.vergeNyt + ' . Greg Brockman on Bloomberg\'s Odd Lots (~Sep 15): "we have significant progress on another one of these Millennium problems." ' + MRU.brockman + ' . No problem named; no proof, paper or announcement since; no formal denial either.',
    'THE ONLY NEWS SOURCE ON HODGE: The Information (Sep 17, paywalled), relayed by Gizmodo (Tom McKay): "citing a single source at OpenAI, that employees at the AI firm expect to soon crack the Hodge Conjecture" — an expectation, not a finished proof; "It could take the company longer to announce the solution, though, because it\'s trying to figure out how to collaborate with the math community to make the announcement without triggering another PR nightmare." Gizmodo headline: "OpenAI Reportedly Trying to Solve Hodge Conjecture Amid Feud With Math Community" ' + MRU.gizmodo + ' (also The Decoder ' + MRU.decoder + ' and The Verge ' + MRU.vergeHodge + ').',
    'SKEPTICS: Elliot Glazer (X, Sep 10, 63 minutes after the rumor): "In what context would an insider whisper to someone else \'one of these two labs is close to BSD,\' instead of saying which? What would close even mean for BSD? Remember the original Navier-Stokes rumor (Ant did it, plus Hodge) was wrong but vagueness obscured its implausibility." ' + MRU.glazer + ' . Michael Harris (Sep 8) on the EARLIER rumor that Anthropic would announce Hodge + Navier–Stokes: he "saw absolutely no reason to believe" Hodge was close ' + MRU.harris + ' (a Kalshi market on Anthropic announcing a Millennium solution before Oct 1 resolved NO). Burt Totaro, a Hodge expert, on Tao\'s blog (Sep 11): "It now seems possible that AI companies will burn through vast resources in order to prove some new fact about the Hodge conjecture" — but the first open case "still seems far out of reach" ' + MRU.totaro + ' . UConn\'s Álvaro Lozano-Robledo (The Verge): "No mathematician would go out and say that. You either have solved it, or you\'re still trying." Scientific American (Sep 15) ranks BSD and Hodge as AI\'s likeliest next targets ' + MRU.sciam,
    'MARKETS (Oct 4; sentiment only): Polymarket "Which Millennium Prize Problem will AI solve next?" (opened Sep 9; $213,778 traded): Hodge 37%, "No solution by Dec 31, 2027" 24%, BSD 22% — Hodge peaked at 74.5% (hourly) on the evening of Sep 17, right after The Information report ' + MRU.poly + ' . Chart = daily price nearest 18:00 UTC from Polymarket\'s price history. Manifold (play money): "Will ANOTHER millennium prize problem be solved in 2026?" 41% (602 traders) ' + MRU.manifold + ' . Kalshi: "Hodge resolved before 2027" last 25¢, "BSD resolved before 2027" last 9¢ ' + MRU.kalshi,
    'Clay pages (live, Oct 4, 2026): ' + MRU.clayHodge + ' · ' + MRU.clayBsd,
  ].join('\n\n'));
  return s;
}

async function build(d) {
  await metrSlide(d);
  await metrEvidenceSlide(d);
  await graveyardSlide(d);
  await hleSlide(d);
  await heroSlide(d);
  await closeupSlide(d);
  await paintSlide(d);
  await worldsSlide(d);
  await anabologyFilmSlide(d);
  await anabologySatireSlide(d);
  await fableSlide(d);
  await videoSlide(d);
  await navierSlide(d);
  await headlinesSlide(d);
  await aftermathSlide(d);
  await vibemathedSlide(d);
  await pipelineSlide(d);
  await rumorsSlide(d);
}

module.exports = { build };
