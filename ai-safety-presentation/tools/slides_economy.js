// Section: THE ACCELERATION · economy ("AI dominates the economy" + "Information is physical").
// Sources: assets/research/economy/manifest.json (verified items/datasets/facts) + user originals image1-3.
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { HEX, W, MX, A } = require('./lib');
const { icon } = require('./icons');

const R = (f) => A('research', 'economy', f);
const O = (f) => A('original', f);
const OUT = A('slides', 'economy');
const D = (f) => path.join(OUT, f);

// ---------- derived images (crops of verified screenshots; originals untouched) ----------
// Boxes are in source-pixel coordinates.
const CROPS = {
  'fortune_housing.png': ['fortune_datacenter_spending_exceeds_housing.png', { left: 77, top: 429, width: 2406, height: 851 }],
  // headline + byline only: the article photo (Fed Chair Jerome Powell) would read as the "Harvard economist"
  'fortune_furman.png': ['fortune_furman_gdp_without_datacenters.png', { left: 77, top: 378, width: 1200, height: 680 }],
  'fortune_hyperion_head.png': ['fortune_meta_hyperion_50b.png', { left: 77, top: 384, width: 1190, height: 486 }],
  'guardian_ramageddon_head.png': ['guardian_ramageddon_iphone.png', { left: 342, top: 342, width: 1277, height: 342 }],
  'guardian_thermal.png': ['guardian_xai_thermal_drone.png', { left: 342, top: 422, width: 1904, height: 950 }],
  'guardian_xai_head.png': ['guardian_xai_illegal_turbines.png', { left: 342, top: 427, width: 1254, height: 337 }],
  'guardian_drought_head.png': ['guardian_drought_datacenters.png', { left: 342, top: 427, width: 1254, height: 331 }],
  'ars_ram.png': ['arstechnica_ram_shortage_2028.png', { left: 128, top: 0, width: 2304, height: 902 }],
  'wired_gas.png': ['wired_datacenters_gas_boom.png', { left: 115, top: 794, width: 2330, height: 1006 }],
  'colossus2_crop.png': ['epoch_sat_xai_colossus2_2026-06.png', { left: 280, top: 0, width: 620, height: 492 }],
  'hyperion_crop.jpg': ['meta_richland_parish_hyperion.jpg', { left: 280, top: 0, width: 1361, height: 1080 }],
  'fairwater_crop.jpg': ['ms_fairwater_wisconsin_hero.jpg', { left: 150, top: 0, width: 1612, height: 1280 }],
  // drops a page-render artifact (bright-green square, bottom-right) and the white strip under the photo
  'tc_openai_852b.png': ['techcrunch_openai_122b_852b.png', { left: 0, top: 0, width: 2500, height: 1240 }],
  // Statista infographic cropped to its headline + dek (the full infographic's mini charts are illegible at slide size
  // and duplicate the native chart beside it)
  'statista_head.png': ['statista_bigtech_capex_2026.jpeg', { left: 16, top: 48, width: 1046, height: 302 }],
  // --- rev2: gigawatt / training energy ---
  // headline + byline row (breadcrumb and dek dropped)
  'pcgamer_astra_head.png': ['rev2/gw_pcgamer_astra_100k_gpus.png', { left: 0, top: 95, width: 1270, height: 690 }],
  // Hoover Dam aerial (CC BY-SA 4.0, Mariordo), tightened around the dam + Lake Mead + bridge (3:2 kept). The right edge
  // (x 1780) and bottom (y 1120) stay clear of the aircraft-window wedge in the source's bottom-right corner, whose edge
  // runs from (1907, 1000) to (1740, 1260) — at y 1120 it starts at x ≈ 1830.
  'hoover_crop.jpg': ['rev2/gw_commons_hoover_dam_aerial_2017.jpg', { left: 280, top: 120, width: 1500, height: 1000 }],
  // --- rev2: nuclear restarts ---
  // TMI aerial (CC BY-SA 2.0, formulanone): trims a strip of sky so the frame matches the slide box; resized to 2700 px
  'tmi_aerial.jpg': ['rev2/commons_tmi_formulanone_2021.jpg', { left: 0, top: 104, width: 3600, height: 2292 }, 2700],
  // headline + date line (section label "NATIONAL" and photo dropped)
  'npr_tmi_head.png': ['rev2/npr_tmi_microsoft_2024.png', { left: 14, top: 74, width: 1290, height: 246 }],
  'capstar_crane_head.png': ['rev2/capitalstar_crane_2027_restart_2026-07-29.png', { left: 40, top: 100, width: 1700, height: 310 }],
  // headline only: the dek / byline lines would be illegible at row size (dates are in the facts + source line)
  'national_palisades_head.png': ['rev2/national_palisades_shadow_2026-09-23.png', { left: 10, top: 1025, width: 1630, height: 222 }],
  'bnn_duane_head.png': ['rev2/bnn_reuters_nextera_doe_loan_duane_arnold_2026-09-08.png', { left: 0, top: 75, width: 1494, height: 300 }],
  // --- rev2: Altman 2015 (Business Insider original report) ---
  'bi_2015_header.png': ['rev2/altman_bi_2015_header_photo.png', { left: 20, top: 25, width: 1440, height: 1325 }],
  // bold lead-in + the quote (the preceding "Here are some of his thoughts:" line dropped)
  'bi_2015_quote.png': ['rev2/altman_bi_2015_quote_passage.png', { left: 35, top: 105, width: 975, height: 175 }],
};
// Source-pixel boxes [x0, y0, x1, y1] of the three quoted lines in altman_bi_2015_quote_passage.png (measured from the
// dark-pixel extents of each text line), used for the native highlight overlay.
const BI_QUOTE_LINES = [[828, 117, 951, 160], [45, 172, 980, 214], [45, 228, 680, 270]];

// User's S&P 500 share chart (image2.png, 826×459), cropped to the plot below its empty 60% band (data max is 50%):
// the footnote goes to the slide's source line, the legend is replaced by the native series-end callouts (same series
// names, in the series colours) and the rotated y-axis title by the native label above the chart. Its ~6.5pt in-plot
// labels (the three series-end values, "~25%" — which the dashed Kobeissi line ran through — and "ChatGPT launch",
// which sat above the crop) are re-set natively at 12pt (same values/words). Only greyish text pixels inside the erase
// boxes are cleared; coloured series pixels are kept and gridline rows are restored. Boxes are [x0, y0, x1, y1] in
// source pixels.
const SP = {
  file: 'sp500_ai_share.png', box: { left: 80, top: 60, width: 720, height: 337 },
  erase: [[669, 95, 697, 109], [637, 122, 725, 138], [759, 202, 796, 216], [472, 219, 504, 229]],
  grid: [49, 102, 156, 209, 263, 317], gridMaxX: 778, bg: [252, 252, 251], gridRGB: [225, 224, 217],
  // marker centres (source px) used to place the native callouts
  jpm: [705, 101], kob: [733, 128], kobLeft: 726, mag7: [753, 202], chatgptX: 463.5, chatgptY: 72,
  kob0: [463.5, 234], kob0Left: 455,
  // where the old "~25%" text sat on top of the dashed Kobeissi line, the erase leaves holes in the dashes: redraw
  // those dash runs (same line fit, colour, ~2px anti-aliased width, and dash phase as the source)
  redash: { m: -0.398100537, b: 420.756107, core: [226, 109, 60], runs: [[473, 478], [483, 487], [492, 497], [501, 506]] },
};

async function prepChart() {
  const src = O('image2.png'), out = D(SP.file);
  if (fs.existsSync(out) && fs.statSync(out).mtimeMs > fs.statSync(src).mtimeMs && fs.statSync(out).mtimeMs > fs.statSync(__filename).mtimeMs) return;
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  for (const [x0, y0, x1, y1] of SP.erase) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = (y * info.width + x) * ch, r = data[i], g = data[i + 1], b = data[i + 2];
      const greyish = Math.max(r, g, b) - Math.min(r, g, b) < 40 && (r + g + b) / 3 < 247;
      if (!greyish) continue;
      const c = SP.grid.includes(y) && x <= SP.gridMaxX ? SP.gridRGB : SP.bg;
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2];
    }
  }
  const { m, b, core, runs } = SP.redash;
  for (const [x0, x1] of runs) for (let x = x0; x <= x1; x++) {
    const yc = m * x + b;
    for (let y = Math.floor(yc - 1.5); y <= Math.ceil(yc + 1.5); y++) {
      const al = Math.max(0, Math.min(1, 1.45 - Math.abs(y - yc)));
      if (!al) continue;
      const i = (y * info.width + x) * ch;
      for (let k = 0; k < 3; k++) data[i + k] = Math.round(data[i + k] * (1 - al) + core[k] * al);
    }
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: ch } }).extract(SP.box).png().toFile(out);
}

async function prep() {
  fs.mkdirSync(OUT, { recursive: true });
  await prepChart();
  for (const [dst, [src, box, resizeW]] of Object.entries(CROPS)) {
    const out = D(dst);
    if (fs.existsSync(out) && fs.statSync(out).mtimeMs > fs.statSync(R(src)).mtimeMs && fs.statSync(out).mtimeMs > fs.statSync(__filename).mtimeMs) continue;
    let img = sharp(R(src)).extract(box);
    if (resizeW) img = img.resize({ width: resizeW, kernel: 'lanczos3' });
    img = dst.endsWith('.jpg') ? img.jpeg({ quality: 92 }) : img.png();
    await img.toFile(out);
  }
}

// ---------- local helpers ----------
function kicker(s, t) { s.addText(t, { placeholder: 'kicker' }); }
function title(s, t) { s.addText(t, { placeholder: 'title' }); }

// Small uppercase label above a chart / block.
function label(d, s, text, x, y, w, color) {
  return d.text(s, text, { x, y, w, h: 0.26, fontSize: 11, bold: true, color: color || d.S.steel, charSpacing: 2, valign: 'bottom' });
}

// Dark translucent caption bar over the bottom of a photo.
function captionBar(d, s, g, runs, h = 0.42) {
  const r = d.name('capbar');
  s.addShape(d.pres.shapes.RECTANGLE, { x: g.x, y: g.y + g.h - h, w: g.w, h, fill: { color: '000000', transparency: 30 }, line: { color: '000000', width: 0, transparency: 100 }, objectName: r });
  const t = d.text(s, runs, { x: g.x + 0.14, y: g.y + g.h - h, w: g.w - 0.28, h, fontSize: 12, color: 'FFFFFF', valign: 'middle' });
  return [r, t];
}

// Date tag pinned to the top-left of an image.
function tag(d, s, text, x, y, fill) {
  const r = d.name('tag');
  const w = 0.16 + text.length * 0.115;
  s.addShape(d.pres.shapes.RECTANGLE, { x, y, w, h: 0.36, fill: { color: fill }, line: { color: fill, width: 0 }, objectName: r });
  const t = d.text(s, text, { x, y, w, h: 0.36, fontSize: 13, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', charSpacing: 2 });
  return [r, t];
}

// Geometry of a native bar chart whose inner plot area is pinned with `layout` (fractions of the chart box),
// so annotations can be placed next to specific bars (same in PowerPoint and LibreOffice).
function barGeom(box, layout, n, gapPct, maxVal) {
  const px = box.x + layout.x * box.w, pw = layout.w * box.w, py = box.y + layout.y * box.h, ph = layout.h * box.h;
  const cw = pw / n, bw = cw / (1 + gapPct / 100);
  return { cx: (i) => px + (i + 0.5) * cw, bw, cw, vy: (v) => py + ph * (1 - v / maxVal), px, pw, py, ph };
}

// Big-number callout with explicit sizes (wrapper around d.stat with tighter label box).
function stat(d, s, o) {
  const { x, y, w, value, label: lab, color, valueSize = 40, labelSize = 12, labelH = 0.75 } = o;
  const vh = valueSize / 72 * 1.15;
  const n1 = d.text(s, value, { x, y, w, h: vh, fontSize: valueSize, bold: true, color: color || d.S.red, fontFace: 'Arial', valign: 'bottom' });
  const n2 = d.text(s, lab, { x, y: y + vh + 0.04, w, h: labelH, fontSize: labelSize, color: d.S.muted, valign: 'top' });
  return [n1, n2];
}

// Filled status chip (uppercase label on a coloured pill).
function chip(d, s, text, x, y, w, fill, { h = 0.3, fontSize = 10.5, color = 'FFFFFF', charSpacing = 1 } = {}) {
  const r = d.name('chip');
  s.addShape(d.pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.06, fill: { color: fill }, line: { color: fill, width: 0 }, objectName: r });
  const t = d.text(s, text, { x: x + 0.1, y, w: w - 0.2, h, fontSize, bold: true, color, valign: 'middle', charSpacing });
  return [r, t];
}

// Icon image (react-icons rendered to PNG by tools/icons.js). frac < 1 keeps only the left part (e.g. half a house).
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

function line(d, s, x, y, w, h, color, { width = 1, dash } = {}) {
  const n = d.name('ln');
  s.addShape(d.pres.shapes.LINE, { x, y, w, h, line: { color, width, dashType: dash }, objectName: n });
  return n;
}

// =====================================================================================
// 1. THE MARKET
async function marketSlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  kicker(s, 'THE ACCELERATION · ECONOMY · 1');
  title(s, 'AI is swallowing the stock market');

  // Two charts side by side under matching labels: the user's S&P share chart (white paper exhibit, cleaned crop — see SP)
  // on the left, the native Nvidia chart on the right. The headline clipping is pinned under the S&P chart.
  // vertical budget (left): label · chart · 0.24 gap · headline clipping (bottom at 6.47); the chart's width follows
  const headH = 0.82, headY = 6.47 - headH, spTop = 2.04, spH = headY - 0.24 - spTop;
  const lw = (spH - 0.12) * SP.box.width / SP.box.height + 0.12, rx = MX + lw + 0.42, rw = W - MX - rx;
  const spLab = label(d, s, 'SHARE OF S&P 500 MARKET VALUE · THREE AI-STOCK BASKETS', MX, 1.72, lw);
  const chart = await d.frame(s, D(SP.file), { x: MX, y: spTop, w: lw, h: spH }, { pad: 0.06 });
  const head = await d.frame(s, O('image3.png'), { x: MX + 0.08, y: headY, w: lw - 0.5, h: headH }, { rot: -1.2, pad: 0.08, align: 'left' });

  // Native 12pt callouts at the series ends (they double as the legend). Positions come from the source-pixel
  // marker coordinates; white fill = the chart's background, so gridlines don't run through the text.
  const cg = chart.geom, ck = cg.w / SP.box.width;
  const P = ([sx, sy]) => ({ x: cg.x + (sx - SP.box.left) * ck, y: cg.y + (sy - SP.box.top) * ck });
  const calloutH = 0.21;
  const callout = (value, desc, color, right, yMid, w) => d.text(s, [
    { text: value, options: { bold: true } }, ...(desc ? [{ text: ` · ${desc}` }] : []),
  ], { x: right - w, y: yMid - calloutH / 2, w, h: calloutH, fontSize: 12, color, align: 'right', valign: 'middle', fill: { color: 'FCFCFB' } });
  const pJ = P(SP.jpm), pK = P(SP.kob), pM = P(SP.mag7);
  const kobRight = P([SP.kobLeft, 0]).x - 0.06;
  const cJ = callout('50%', 'JPMorgan, 28 “direct AI” stocks', '1E8A57', pJ.x - 0.1, pK.y - 0.09 - calloutH, 2.6);
  const cK = callout('45%', 'Kobeissi, broad AI-linked (Apr 2026)', 'C9531C', kobRight, pK.y - 0.09, 2.92);
  const cM = callout('31.5%', 'Magnificent 7', '2F62C8', pM.x + 0.2, pM.y + 0.25, 1.56);
  // Kobeissi starting value: above-left of its triangle, clear of the dashed line and the ChatGPT rule
  const p0 = P(SP.kob0);
  const c0 = callout('~25%', '', 'C9531C', P([SP.kob0Left, 0]).x, p0.y - 0.115, 0.46);
  const pC = P([SP.chatgptX, SP.chatgptY]);
  const cC = d.text(s, 'ChatGPT launch', { x: pC.x - 0.6, y: pC.y - calloutH / 2, w: 1.2, h: calloutH, fontSize: 12, color: '5F6670', align: 'center', valign: 'middle', fill: { color: 'FCFCFB' } });

  // Nvidia market cap (native)
  const nvLab = label(d, s, 'NVIDIA MARKET VALUE (YEAR-END; 2026 = OCT 3)', rx, 1.72, rw);
  const nv = [17.73, 57.53, 117.26, 81.43, 144.0, 323.24, 735.27, 364.18, 1223, 3288, 4638, 5649].map(v => v / 1000);
  const nvBox = { x: rx - 0.12, y: 2.0, w: rw + 0.12, h: 2.5 }, nvL = { x: 0.11, y: 0.1, w: 0.87, h: 0.74 };
  const nvChart = d.chart(s, 'bar', [{ name: 'Nvidia market cap ($T)', labels: ['2015', '’16', '’17', '’18', '’19', '’20', '’21', '’22', '’23', '’24', '’25', 'Oct ’26'], values: nv }],
    nvBox, {
      layout: nvL, barDir: 'col', chartColors: [...Array(11).fill(HEX.steel), HEX.red], barGapWidthPct: 45,
      valAxisMaxVal: 6.5, valAxisMinVal: 0, valAxisMajorUnit: 2, valAxisLabelFormatCode: '$0"T"',
      showValue: true, dataLabelFormatCode: '[<5]"";$0.00"T"', dataLabelPosition: 'outEnd', dataLabelFontSize: 12, dataLabelFontBold: true, dataLabelColor: HEX.red,
      catAxisLabelFontSize: 10,
    });
  // "$5T" marker next to the 2025 bar: dashed leader at the $5T level, ending just before the Oct '26 bar
  const ng = barGeom(nvBox, nvL, 12, 45, 6.5);
  const y5 = ng.vy(5);
  const nvNote = d.text(s, 'First to close above $5T (Oct 29, 2025)', { x: ng.cx(10) - ng.bw / 2 - 0.08 - 3.0, y: y5 - 0.14, w: 3.0, h: 0.28, fontSize: 11, italic: true, color: d.S.muted, align: 'right', valign: 'middle' });
  const nvLine = d.name('lead');
  s.addShape(d.pres.shapes.LINE, { x: ng.cx(10) - ng.bw / 2 - 0.04, y: y5, w: ng.bw + 0.04 + (ng.cw - ng.bw) / 2 - 0.03, h: 0, line: { color: HEX.muted, width: 1, dashType: 'dash' }, objectName: nvLine });

  // stat callouts
  const divider = d.name('div');
  s.addShape(d.pres.shapes.LINE, { x: rx, y: 4.72, w: rw, h: 0, line: { color: HEX.line, width: 1 }, objectName: divider });
  const sw = (rw - 0.3) / 2;
  const st1 = stat(d, s, { x: rx, y: 4.82, w: sw, value: '$96.2B', label: 'Nvidia’s revenue in one quarter, up 106% in a year (Aug 2026)', color: d.S.txt, labelH: 0.8 });
  const st2 = stat(d, s, { x: rx + sw + 0.3, y: 4.82, w: sw, value: '$65B', label: 'Anthropic’s annualized revenue, Jul 2026 — up from $9B at end of 2025', color: d.S.txt, labelH: 0.8 });

  d.source(s, 'Sources: S&P 500 share chart — Mag 7 via historyofmarket.com, Kobeissi Letter, JPMorgan (definitions differ) · Nvidia: CompaniesMarketCap (2026 = Oct 3) · Guardian, Aug 26, 2026 · TechCrunch, Aug 17, 2026');

  d.animate(s, [spLab, ...chart, cJ, cK, cM, c0, cC], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, head, { effect: 'slam', dur: 450 });
  d.animate(s, [nvLab, nvChart, nvNote, nvLine], { effect: 'wipeLeft', dur: 900 });
  d.animate(s, [divider, ...st1, ...st2], { effect: 'rise', stagger: 200 });

  s.addNotes([
    'The AI trade is now the stock market. The Magnificent 7 alone are about a third of the S&P 500; broader AI-linked baskets put it at 45% (Kobeissi, Apr 2026) or 50% (JPMorgan’s 28 “direct AI” stocks). The three series use different definitions, so they are not directly comparable — the point is the direction.',
    'Click 1 — the headline: “AI Swallows Wall Street: Stocks Hit Record 45% of S&P 500 Market Cap” (user-supplied headline image; outlet not recorded in our research manifest — matches the Kobeissi 45% figure in the chart).',
    'Click 2 — Nvidia: from about $18B at the end of 2015 to $5.65T on Oct 3, 2026 (CompaniesMarketCap). It became the first public company worth $5T on Oct 29, 2025; the Guardian noted that was more than the GDP of India, Japan or the UK (IMF). It has NOT reached $6T — don’t say it has. The chart shows year-end values, so the 2025 bar ($4.64T) sits below $5T: it crossed $5T in late October, then ended the year lower (dashed line = the $5T level).',
    'Click 3 — the money behind it: The Guardian, Aug 26, 2026 — “Nvidia’s quarterly revenue doubles to nearly $100bn as CEO declares ‘golden age’”: $96.2B in the quarter, 106% more than a year earlier, with guidance of $108B for the next quarter. Anthropic’s annualized revenue run rate went from $9B at end-2025 to over $65B by end of July 2026 (TechCrunch citing Bloomberg, Aug 17, 2026); it also raised $65B at a $965B valuation in May 2026. (OpenAI’s $852B valuation and ~$1.4T talks are saved for the section closer.)',
    'Chart footnote (cropped from the image; summarized on the source line): Mag 7 series from historyofmarket.com (semiannual, through Jul 24, 2026); broad AI-linked from The Kobeissi Letter via Yahoo Finance (Apr 2026, “+20 pts since ChatGPT”, i.e. from ~25%); JPMorgan Eye on the Market, Outlook 2026. The end-value labels, “~25%” and “ChatGPT launch” were re-set in larger type on the slide (values unchanged); the chart’s small legend and y-axis title (“% of S&P 500 market value”) were cropped — the coloured callouts name the series and the label above the chart gives the measure.',
    'URLs: https://companiesmarketcap.com/nvidia/marketcap/ · https://techcrunch.com/2025/10/29/nvidia-becomes-first-public-company-worth-5-trillion/ · https://www.theguardian.com/technology/2025/oct/29/nvidia-first-company-5-trillion · https://www.theguardian.com/technology/2026/aug/26/nvidia-quarterly-revenue · https://techcrunch.com/2026/08/17/anthropics-annualized-revenue-surges-to-65b/ · https://techcrunch.com/2026/05/28/anthropic-raises-65-billion-nears-1t-valuation-ahead-of-ipo/',
  ].join('\n\n'));
  return s;
}

// =====================================================================================
// 2. THE CAPEX BOOM
async function capexSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  kicker(s, 'THE ACCELERATION · ECONOMY · 2');
  title(s, 'The capex boom: up to $760B in 2026');

  // Hyperscaler capex by company, calendar years (2022-25 Epoch sums of SEC filings; 2026 Statista guidance upper limits)
  const series = [
    { name: 'Amazon', values: [64.3, 53.4, 83.9, 134.7, 220] },
    { name: 'Microsoft', values: [27.8, 40.6, 74.5, 108.3, 190] },
    { name: 'Alphabet', values: [31.5, 32.3, 52.8, 93.1, 205] },
    { name: 'Meta', values: [32.0, 28.1, 38.5, 72.5, 145] },
  ];
  // Category labels carry no per-year totals: the only 2025 total on the slide is Statista's $413B (Epoch's
  // broad-capex sum is $409B — see notes).
  const labels = ['2022', '2023', '2024', '2025', '2026 guided'];
  const lab = label(d, s, 'CAPITAL EXPENDITURE BY COMPANY ($ BILLIONS)', MX, 1.72, 5.6);
  const ch = d.chart(s, 'bar', series.map(x => ({ ...x, labels })), { x: MX - 0.1, y: 1.98, w: 5.7, h: 4.55 }, {
    barDir: 'col', barGrouping: 'stacked', barGapWidthPct: 55,
    chartColors: [HEX.amber, HEX.blue, HEX.teal, HEX.steel],
    valAxisMaxVal: 800, valAxisMinVal: 0, valAxisMajorUnit: 200, valAxisLabelFormatCode: '$#,##0"B"',
    catAxisLabelFontSize: 12, legendFontSize: 12,
  });

  // Statista headline (cropped clipping) + stat column, and the user's construction chart
  const stc = await d.frame(s, D('statista_head.png'), { x: 6.42, y: 1.86, w: 2.72, h: 1.0 }, { rot: -1.5, pad: 0.05 });
  const con = await d.frame(s, O('image1.png'), { x: 9.45, y: 1.72, w: 3.28, h: 3.69 }, { rot: 1.5, pad: 0.05 });
  const conCap = d.text(s, 'Data-center construction keeps rising while all other private construction falls', { x: 9.45, y: 5.55, w: 3.28, h: 0.5, fontSize: 11, italic: true, color: d.S.muted, valign: 'top' });

  const st1 = stat(d, s, { x: 6.5, y: 3.12, w: 2.6, value: '+84%', label: 'Statista: $413B in 2025 → up to $760B in 2026', labelH: 0.5 });
  const st2 = stat(d, s, { x: 6.5, y: 4.62, w: 2.6, value: '~$950B', color: d.S.txt, label: 'projected for 2027 (Bloomberg)', labelH: 0.5 });

  d.source(s, 'Sources: 2022–25 bars: Epoch AI “broad capex” from SEC filings (company-report totals differ slightly) · Statista, Jul 31, 2026 (2026 = upper limit of guidance) · Fortune/Bloomberg, Jul 26, 2026 · Commerce Dept.');

  d.animate(s, [lab, ch], { auto: true, effect: 'wipeLeft', dur: 1000 });
  d.animate(s, stc, { effect: 'slam', dur: 450 });
  d.animate(s, st1, { auto: true, effect: 'zoom', dur: 400, after: 150 });
  d.animate(s, st2, { effect: 'rise' });
  d.animate(s, [...con, conCap], { effect: 'rise' });

  s.addNotes([
    'Four companies — Amazon, Microsoft, Alphabet, Meta — went from ~$155B of capex in 2022 to ~$409B in 2025, and their own guidance points to up to $760B in 2026 (Statista: “Big Tech’s AI Spending to Reach $760 Billion in 2026”, up 84% from $413B). Bloomberg’s projection is ~$724B for 2026 and nearly $950B for 2027.',
    'CAVEATS: 2026 bars are guidance (upper limits as of Jul 30, 2026; Microsoft outlook as of Apr 29), not actuals. 2022–25 are sums of Epoch AI’s quarterly “broad capex” series (calendar years), which differ slightly from Statista’s company-report totals (e.g. 2025: $409B in the chart vs $413B per Statista — the +84% callout uses Statista’s own numbers: 760/413). That is why the bars carry no per-year totals. Capex includes some non-AI spending, but the companies say the growth is driven by AI data centers. Oracle (not shown) adds ~$40B in 2025.',
    'Epoch AI: hyperscaler capex has grown ~72%/yr since Q2 2023 — quadrupling since GPT-4. Alphabet’s free cash flow turned negative in Q2 2026 for the first time since its 2004 IPO (Fortune/Bloomberg).',
    'Click 1 — the Statista headline (clipping cropped to its headline; full CC BY-ND infographic with per-company bars at the URL below), then +84%. Click 2 — Bloomberg’s ~$950B for 2027.',
    'Click 3 — right chart (user-supplied, Commerce Dept. data): private construction relative to Dec 2023 — data centers up ~$50B annualized, everything else down ~$120B.',
    'URLs: https://www.statista.com/chart/35046/capital-expenditure-of-meta-alphabet-amazon-and-microsoft/ · https://epoch.ai/data-insights/hyperscaler-capex-trend · https://fortune.com/2026/07/26/big-tech-earnings-meta-microsoft-apple-amazon-market-revolt-ai-spending/',
  ].join('\n\n'));
  return s;
}

// =====================================================================================
// 3. AI IS THE ECONOMY
async function gdpSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  kicker(s, 'THE ACCELERATION · ECONOMY · 3');
  title(s, 'AI investment is now propping up US growth');

  const c1 = await d.frame(s, D('fortune_housing.png'), { x: MX, y: 1.76, w: 6.25, h: 2.3 }, { rot: -1.2, pad: 0.06 });
  // Furman clipping cropped to its headline/byline (narrower), with his 92% figure beside it
  const c2 = await d.frame(s, D('fortune_furman.png'), { x: MX + 0.12, y: 4.28, w: 3.75, h: 2.2 }, { rot: 1.2, pad: 0.06 });
  // stat row: all three values share one baseline (y = statY)
  const statY = 5.02;
  const st1 = stat(d, s, { x: 4.8, y: statY, w: 2.2, value: '92%', labelH: 0.82,
    label: 'of H1-2025 US GDP growth came from information-processing investment — Jason\u00A0Furman' });

  // Epoch AI: computing infrastructure share of GDP vs 2015-22 trend
  const qlab = [];
  for (let y = 2015; y <= 2026; y++) for (let q = 1; q <= 4; q++) { if (y === 2026 && q > 1) break; qlab.push(q === 1 ? String(y) : ''); }
  const actual = [0.5756, 0.5743, 0.5758, 0.5495, 0.5675, 0.5587, 0.5389, 0.5386, 0.5504, 0.5736, 0.5959, 0.5882, 0.6287, 0.6448, 0.6383, 0.6247, 0.6191, 0.6348, 0.5924, 0.5951, 0.5887, 0.6923, 0.6621, 0.6819, 0.6989, 0.676, 0.6812, 0.6908, 0.7152, 0.696, 0.7077, 0.6685, 0.6472, 0.6454, 0.6356, 0.6759, 0.7229, 0.7664, 0.8122, 0.8162, 0.9436, 1.0629, 1.1395, 1.2899, 1.4886];
  const trend = [0.5277, 0.5306, 0.5336, 0.5365, 0.5395, 0.5424, 0.5453, 0.5483, 0.5512, 0.5542, 0.5571, 0.56, 0.563, 0.5659, 0.5688, 0.5718, 0.5747, 0.5777, 0.5806, 0.5835, 0.5865, 0.5894, 0.5924, 0.5953, 0.5982, 0.6012, 0.6041, 0.6071, 0.61, 0.6129, 0.6159, 0.6188, 0.6217, 0.6247, 0.6276, 0.6306, 0.6335, 0.6364, 0.6394, 0.6423, 0.6453, 0.6482, 0.6511, 0.6541, 0.657];
  const rx = 7.3, rw = W - MX - rx;
  const lab = label(d, s, 'COMPUTING INFRASTRUCTURE INVESTMENT, % OF US GDP', rx, 1.72, rw);
  const ch = d.chart(s, 'line', [
    { name: 'Actual (incl. AI data centers, chips, networking)', labels: qlab, values: actual.map(v => v / 100) },
    { name: '2015–22 trend', labels: qlab, values: trend.map(v => v / 100) },
  ], { x: rx - 0.12, y: 1.98, w: rw + 0.12, h: 2.95 }, {
    chartColors: [HEX.red, HEX.steel], lineDataSymbol: 'none', lineSize: 3,
    valAxisMaxVal: 0.016, valAxisMinVal: 0, valAxisMajorUnit: 0.004, valAxisLabelFormatCode: '0.0%',
    catAxisLabelFrequency: 4, catAxisLabelFontSize: 10, catAxisLabelRotate: 0, legendPos: 'b', legendFontSize: 10,
  });

  const st2 = stat(d, s, { x: rx, y: statY, w: 2.55, value: '~2×', label: 'computing’s share of GDP vs. the 2015–22 norm (1.5% vs ~0.7%)', labelH: 0.62 });
  const st3 = stat(d, s, { x: rx + 2.8, y: statY, w: rw - 2.8, value: '~0.8%', label: 'of US GDP from AI data centers, chips and networking alone', labelH: 0.62 });

  d.source(s, 'Sources: Fortune, Sep 20, 2026 & Oct 7, 2025 (Jason Furman) · Epoch AI, “The AI boom has doubled computing infrastructure’s share of US GDP” (CC-BY; BEA via FRED, Census, SEC)');

  d.animate(s, c1, { auto: true, effect: 'rise' });
  d.animate(s, c2, { auto: true, effect: 'rise', after: 250 });
  d.animate(s, st1, { effect: 'zoom', dur: 400 });
  d.animate(s, [lab, ch], { effect: 'wipeLeft', dur: 1100 });
  d.animate(s, [...st2, ...st3], { effect: 'rise', stagger: 200 });

  s.addNotes([
    'Two Fortune headlines. Sep 20, 2026: “U.S. economy hits pivotal milestone: Spending on data centers and other information-processing hardware now exceeds housing investment.” Quote from SF Fed’s Adam Shapiro: “investment is shifting away from residential investment and towards computers.” Oct 7, 2025: “Without data centers, GDP growth was 0.1% in the first half of 2025, Harvard economist says.”',
    'Click 1 — 92%: Jason Furman’s calculation: information-processing equipment & software was ~4% of GDP but accounted for 92% of GDP growth in H1 2025. Caveat: this is an accounting decomposition, not a counterfactual — without the boom, other spending might have been higher. (The Fortune clipping is cropped to its headline; the article’s photo is of Fed Chair Jerome Powell, not Furman.)',
    'Click 2 — chart (Epoch AI, CC-BY): total computing-infrastructure investment hit ~1.49% of US GDP in Q1 2026 vs a 2015–22 trend of ~0.66%. Click 3 — so it is about double the norm, and Epoch attributes ~0.8% of GDP to AI-related data-center construction, compute hardware and networking (roughly the gap above trend). “AI infrastructure is now the leading driver of growth in private investment in the US.”',
    'URLs: https://fortune.com/2026/09/20/us-economy-milestone-spending-data-centers-ai-boom-housing-residential-investment/ · https://fortune.com/2025/10/07/data-centers-gdp-growth-zero-first-half-2025-jason-furman-harvard-economist/ · https://epoch.ai/data-insights/ai-datacenter-share-gdp',
  ].join('\n\n'));
  return s;
}

// =====================================================================================
// 4. INFORMATION IS PHYSICAL — SCALE
async function scaleSlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  kicker(s, 'THE ACCELERATION · INFORMATION IS PHYSICAL · 1');
  title(s, 'The “cloud” is now concrete, steel and gigawatts');

  const gap = 0.3, cw = (W - 2 * MX - 2 * gap) / 3, ph = 3.05, y0 = 1.76;
  const xs = [0, 1, 2].map(i => MX + i * (cw + gap));
  const cols = [];
  const photos = [
    [D('hyperion_crop.jpg'), [{ text: 'Meta Hyperion', options: { bold: true } }, { text: '  ·  Louisiana  ·  expanding to 5 GW' }]],
    [D('fairwater_crop.jpg'), [{ text: 'Microsoft Fairwater', options: { bold: true } }, { text: '  ·  Wisconsin  ·  315 acres' }]],
    [D('colossus2_crop.png'), [{ text: 'xAI Colossus 2', options: { bold: true } }, { text: '  ·  Memphis  ·  June 2026' }]],
  ];
  for (let i = 0; i < 3; i++) {
    const f = await d.frame(s, photos[i][0], { x: xs[i], y: y0, w: cw, h: ph }, { border: false });
    const cap = captionBar(d, s, f.geom, photos[i][1]);
    cols.push([...f, ...cap]);
  }
  // under each photo
  const fort = await d.frame(s, D('fortune_hyperion_head.png'), { x: xs[0] + 0.05, y: 4.98, w: cw - 0.1, h: 1.55 }, { rot: -1.5, pad: 0.06 });
  const fw = stat(d, s, { x: xs[1], y: 4.95, w: cw, value: '46.6 miles', valueSize: 34, color: d.S.txt, labelSize: 13, labelH: 0.95,
    label: 'of foundation piles, 26.5M lb of steel. “10X the performance of the world’s fastest supercomputer today.” — Microsoft' });
  const cx = stat(d, s, { x: xs[2], y: 4.95, w: cw, value: '~946 MW', valueSize: 34, color: d.S.txt, labelSize: 13, labelH: 0.95,
    label: 'of IT power, ~1.1M H100-equivalents. Painted on the roof: “MACROHARD”. — Epoch AI' });

  d.source(s, 'Sources: Meta Data Centers (Jul 13, 2026) · Fortune, Jul 13, 2026 · Microsoft blog (Sep 18, 2025) · Epoch AI Frontier Data Centers hub — satellite imagery © Airbus DS via Epoch AI');

  cols.forEach((c, i) => d.animate(s, c, { auto: true, effect: 'rise', after: i ? 150 : 0, dur: 600 }));
  d.animate(s, fort, { effect: 'slam', dur: 450 });
  d.animate(s, fw, { effect: 'rise' });
  d.animate(s, cx, { effect: 'rise' });

  s.addNotes([
    'Information is physical. This is what “the cloud” looks like now — concrete, steel and power plants. Meta’s Hyperion alone is being expanded to 5 GW, carved out of Louisiana farmland (Epoch); xAI’s Colossus 2 already runs ~946 MW of IT power. (Microsoft does not give Fairwater Wisconsin’s power figure, so don’t quote one — use its physical scale instead.)',
    'Meta Hyperion, Richland Parish, Louisiana (official Meta aerial, Jul 2026): being expanded to 5 GW, “the largest in Meta’s fleet”, investment over $50B. Click 1 — Fortune: “Meta’s AI data center cost went from $10 billion to $50 billion in under 2 years—and split the town in two.” Epoch: the tract is more than 3× Central Park.',
    'Microsoft Fairwater, Mt Pleasant, Wisconsin (official Microsoft photo; those rings are closed-loop cooling fans): 315 acres, three buildings, 1.2M sq ft; 46.6 miles of foundation piles, 26.5M lb of steel, 120 miles of medium-voltage cable. Microsoft claims “10X the performance of the world’s fastest supercomputer today” (vendor claim, Sep 2025).',
    'xAI Colossus 2, Memphis (Epoch AI annotated satellite image, Jun 2026; imagery © Airbus DS): “MACROHARD” and “MACROHARDER” are painted on the roofs. Epoch estimates ~946 MW of IT power, ~1.11M H100-equivalents, ~$35.8B; gas turbines sit just across the state line in Mississippi. These are Epoch estimates, not company figures.',
    'URLs: https://datacenters.atmeta.com/2026/07/deepening-our-investment-in-richland-parish-louisiana/ · https://fortune.com/2026/07/13/meta-hyperion-louisiana-50-billion-tax-breaks-locals/ · https://blogs.microsoft.com/blog/2025/09/18/inside-the-worlds-most-powerful-ai-datacenter/ · https://epoch.ai/data/ai-data-centers/directory/colossus-2',
  ].join('\n\n'));
  return s;
}

// =====================================================================================
// 5. STARGATE ABILENE — BEFORE / AFTER
async function abileneSlide(d) {
  const s = d.slide('Content', { transition: 'pushLeft' });
  kicker(s, 'THE ACCELERATION · INFORMATION IS PHYSICAL · 2');
  title(s, 'Stargate Abilene, 13 months apart');

  // before | after, side by side at the same scale; the after reveals on click and both stay visible
  const gap = 0.5, iw = (W - 2 * MX - gap) / 2, ih = iw * 720 / 1280, y0 = 1.76;
  const before = await d.frame(s, R('epoch_sat_stargate_abilene_2025-06.png'), { x: MX, y: y0, w: iw, h: ih }, { border: false });
  const t1 = tag(d, s, 'JUNE 2025', before.geom.x + 0.15, before.geom.y + 0.15, '1D222C');
  const after = await d.frame(s, R('epoch_sat_stargate_abilene_2026-07.png'), { x: MX + iw + gap, y: y0, w: iw, h: ih }, { border: false });
  const t2 = tag(d, s, 'JULY 2026', after.geom.x + 0.15, after.geom.y + 0.15, HEX.red);
  // "+13 months" marker in the gutter between the two images
  const arrow = d.name('arrow');
  s.addShape(d.pres.shapes.RIGHT_ARROW, { x: MX + iw + 0.1, y: y0 + ih / 2 - 0.16, w: gap - 0.2, h: 0.32, fill: { color: HEX.red }, line: { color: HEX.red, width: 0 }, objectName: arrow });

  // bottom band: two stats + the video
  const by = y0 + ih + 0.3, bh = 6.5 - by;
  const st1 = stat(d, s, { x: MX, y: by, w: 3.0, value: '2 → 8', valueSize: 32, color: d.S.txt, labelH: 0.45, label: 'buildings finished: June 2025 vs. July 2026' });
  const st2 = stat(d, s, { x: MX + 3.3, y: by, w: 3.0, value: '1.2 GW', valueSize: 32, labelH: 0.45, label: 'flagship campus for OpenAI & Oracle (Crusoe)' });
  const vw = bh * 16 / 9, vx = MX + 6.6, cx = vx + vw + 0.2;
  const vid = await d.video(s, {
    link: 'https://www.youtube.com/watch?v=GhIJs4zbH0o', embed: 'https://www.youtube.com/embed/GhIJs4zbH0o',
    cover: R('yt_GhIJs4zbH0o.jpg'), box: { x: vx, y: by, w: vw, h: bh },
  });
  const vcap = d.text(s, [
    { text: '►  WATCH', options: { color: d.S.red, bold: true, fontSize: 11, charSpacing: 2, breakLine: true, paraSpaceAfter: 3 } },
    { text: 'Inside OpenAI’s Stargate Megafactory with Sam Altman', options: { color: d.S.txt, hyperlink: { url: 'https://www.youtube.com/watch?v=GhIJs4zbH0o' }, breakLine: true, paraSpaceAfter: 3 } },
    { text: 'Bloomberg Originals · The Circuit', options: { color: d.S.muted } },
  ], { x: cx, y: by, w: W - MX - cx, h: bh, fontSize: 12, valign: 'middle' });

  d.source(s, 'Sources: Epoch AI, OpenAI Stargate Abilene (annotated satellite imagery © Airbus DS via Epoch AI) · Crusoe newsroom, Sep 30, 2025 · Bloomberg Originals, “The Circuit”');

  d.animate(s, [...before, ...t1], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, [arrow], { effect: 'wipeLeft', dur: 400 });
  d.animate(s, [...after, ...t2], { auto: true, effect: 'fade', dur: 1200 });
  d.animate(s, st1, { auto: true, effect: 'rise', after: 200 });
  d.animate(s, st2, { effect: 'rise' });

  s.addNotes([
    'Same place, same scale, 13 months apart — Epoch AI’s annotated satellite views of the first Stargate site in Abilene, Texas (imagery © Airbus DS). June 2025 (left): two buildings done, six under construction. Click — July 2026 (right): all eight buildings complete, with cooling rows and substations; both stay on screen for comparison.',
    'Crusoe (developer): flagship 1.2 GW campus built for Oracle/OpenAI; construction began June 2024. Epoch estimates for the site: ~509k H100-equivalents and 421 MW of IT power today (~$15.9B), projected 843 MW / $31.9B by Q4 2026. (1.2 GW is total campus power; IT power is lower — don’t conflate them.)',
    'Video (click the thumbnail to play): Bloomberg Originals, “Inside OpenAI’s Stargate Megafactory with Sam Altman | The Circuit” — Emily Chang and Sam Altman on the roof at Abilene. Title/channel verified via YouTube oEmbed; upload date not retrieved.',
    'URLs: https://epoch.ai/data/ai-data-centers/directory/openai-stargate-abilene · https://www.crusoe.ai/resources/newsroom/crusoe-announces-flagship-abilene-data-center-is-live · https://www.youtube.com/watch?v=GhIJs4zbH0o',
  ].join('\n\n'));
  return { s, vid };
}

// =====================================================================================
// 6. HOW BIG IS A GIGAWATT?
async function gigawattSlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  kicker(s, 'THE ACCELERATION · INFORMATION IS PHYSICAL · 3');
  title(s, 'How big is a gigawatt?');

  // left: four equivalences, one row each (value + label | icons / scale bar)
  const lx = MX, lw = 6.6, vw = 2.4, ix = lx + vw + 0.3, iw = lx + lw - ix;
  const lab = label(d, s, 'ONE GIGAWATT, RUNNING NONSTOP, IS ROUGHLY…', lx, 1.72, lw, d.S.amber);
  const rowY = [2.13, 3.24, 4.35, 5.46];
  const val = (y, v, l) => [
    d.text(s, v, { x: lx, y, w: vw, h: 0.56, fontSize: 32, bold: true, color: d.S.amber, fontFace: 'Arial', valign: 'bottom' }),
    d.text(s, l, { x: lx, y: y + 0.6, w: vw, h: 0.4, fontSize: 13, color: d.S.muted, valign: 'top' }),
  ];
  const rows = [];

  // 1) homes: 8.5 house icons, one per 100,000 homes
  {
    const y = rowY[0], sz = 0.5, step = 0.47;
    const r = val(y, '≈ 850,000', 'average US homes');
    for (let i = 0; i < 9; i++) r.push(await iconImg(d, s, 'PiHouseFill', '#F2F3F5', ix + i * step, y + 0.08, sz, i === 8 ? 0.5 : 1));
    r.push(d.text(s, 'each icon = 100,000 homes (EIA 2024 average use)', { x: ix, y: y + 0.64, w: iw, h: 0.3, fontSize: 11, color: d.S.steel, valign: 'top' }));
    rows.push(r);
  }
  // 2) one typical reactor
  {
    const y = rowY[1];
    const r = val(y, '1', 'typical nuclear reactor');
    r.push(await iconImg(d, s, 'PiNuclearPlantFill', '#F2F3F5', ix, y + 0.08, 0.78));
    r.push(d.text(s, [
      { text: '“A typical nuclear reactor produces 1 gigawatt of power per plant on average.”', options: { italic: true, color: d.S.txt, breakLine: true } },
      { text: 'U.S. Department of Energy', options: { color: d.S.steel, fontSize: 11 } },
    ], { x: ix + 1.0, y: y + 0.04, w: iw - 1.0, h: 0.9, fontSize: 13, valign: 'middle' }));
    rows.push(r);
  }
  // 3) two Hoover Dams (average output)
  {
    const y = rowY[2];
    const r = val(y, '≈ 2', 'Hoover Dams, at average output');
    r.push(await iconImg(d, s, 'LuDam', '#F2F3F5', ix, y + 0.1, 0.74));
    r.push(await iconImg(d, s, 'LuDam', '#F2F3F5', ix + 0.86, y + 0.1, 0.74));
    r.push(d.text(s, 'Hoover Dam: about 2,080 MW at full capacity, but it averages ~480 MW', { x: ix + 1.85, y: y + 0.04, w: iw - 1.85, h: 0.9, fontSize: 13, color: d.S.muted, valign: 'middle' }));
    rows.push(r);
  }
  // 4) a sixth of New York City: scale bar of NYC's average demand (5.72 GW), 1 GW highlighted
  {
    const y = rowY[3], nyc = 5.72, k = iw / nyc, by = y + 0.16, bh = 0.4;
    const r = val(y, '≈ 1/6', 'of NYC’s average demand');
    const base = d.name('bar');
    s.addShape(d.pres.shapes.RECTANGLE, { x: ix, y: by, w: iw, h: bh, fill: { color: HEX.card2 }, line: { color: HEX.steel, width: 0.75 }, objectName: base });
    const one = d.name('bar');
    s.addShape(d.pres.shapes.RECTANGLE, { x: ix, y: by, w: k, h: bh, fill: { color: HEX.amber }, line: { color: HEX.amber, width: 0.75 }, objectName: one });
    r.push(base, one);
    for (let g = 2; g <= 5; g++) r.push(line(d, s, ix + g * k, by, 0, bh, HEX.line, { width: 1 }));
    r.push(d.text(s, '1 GW', { x: ix, y: by, w: k, h: bh, fontSize: 13, bold: true, color: HEX.ink, align: 'center', valign: 'middle' }));
    r.push(d.text(s, 'NYC’s average load in 2025: 5.7 GW (summer peak 10.8 GW)', { x: ix, y: by + bh + 0.08, w: iw, h: 0.3, fontSize: 11, color: d.S.steel, valign: 'top' }));
    rows.push(r);
  }

  // right: Hoover Dam photo + the AI tie-in
  const rx = 7.62, rw = W - MX - rx;
  const ph = await d.frame(s, D('hoover_crop.jpg'), { x: rx, y: 1.76, w: rw, h: rw / 1.5 }, { border: false });
  const cap = captionBar(d, s, ph.geom, [{ text: 'Hoover Dam', options: { bold: true } }, { text: '  ·  2,080 MW max  ·  ~480 MW on average' }]);
  const sy = ph.geom.y + ph.geom.h + 0.24;
  // a range across three separate projects (not growth over time), hence the en dash
  const st = stat(d, s, { x: rx, y: sy, w: rw, value: '1.2–5 GW', valueSize: 30, color: d.S.red, labelSize: 12, labelH: 0.62,
    label: 'per AI build-out now underway: Stargate Abilene 1.2 GW; Meta Hyperion up to 5 GW; Anthropic–Amazon deal up to 5 GW' });

  d.source(s, 'Sources: EIA · U.S. DOE · U.S. Bureau of Reclamation · NYISO 2026 Gold Book (Zone J = NYC) · Oracle via DCD · Meta · Anthropic · Photo: Mariordo / Wikimedia Commons, CC BY-SA 4.0');

  d.animate(s, [lab, ...rows[0], ...ph, ...cap], { auto: true, effect: 'fade', dur: 600 });
  for (let i = 1; i < 4; i++) d.animate(s, rows[i], { effect: 'rise', dur: 500 });
  d.animate(s, st, { effect: 'zoom', dur: 400 });

  s.addNotes([
    'People hear “gigawatt” and it means nothing. So: one gigawatt, running around the clock, is roughly —',
    '≈ 850,000 average US homes. Arithmetic: EIA says the average US residential customer used 863 kWh per month in 2024 → 863 × 12 = 10,356 kWh/yr → an average draw of ~1.18 kW. 1 GW ÷ 1.18 kW ≈ 846,000 homes. (Cross-check: Larry Ellison said Abilene’s 1.2 GW is “enough power for one million four-bedroom homes in the United States.”) Caveat: homes are an average — at peak hours a gigawatt covers fewer.',
    'Click 1 — one typical nuclear reactor. DOE: “A typical nuclear reactor produces 1 gigawatt of power per plant on average.”',
    'Click 2 — about two Hoover Dams. U.S. Bureau of Reclamation: nameplate capacity “about 2,080 megawatts”, but average annual net generation (1947–2008) “about 4.2 billion kilowatt-hours” → 4.2 billion kWh ÷ 8,760 h ≈ 480 MW average. So 1 GW ≈ 2 Hoover Dams at their average output (or about half of Hoover running flat out).',
    'Click 3 — about a sixth of New York City. NYISO 2026 Gold Book, Table I-2: Zone J (New York City) used 50,104 GWh in 2025 → ÷ 8,760 h = 5.72 GW average load; summer peak 10,825 MW (Table I-4a). 1 ÷ 5.72 ≈ 17%.',
    'Click 4 — and AI build-outs are now measured in gigawatts: Stargate Abilene is a 1.2 GW campus (Crusoe/Oracle); Zuckerberg says Meta’s Hyperion “will be able to scale up to 5GW”; Anthropic’s April 2026 deal with Amazon secures “up to 5 gigawatts (GW) of capacity” (a multi-site capacity deal, not one building). That is one to five typical reactors’ worth of power per project.',
    'Photo: Hoover Dam aerial, 22 Sep 2017, by Mariordo (Mario Roberto Durán Ortiz), CC BY-SA 4.0, cropped.',
    'URLs: https://www.eia.gov/electricity/sales_revenue_price/pdf/table_5A.pdf · https://www.energy.gov/ne/articles/infographic-how-much-power-does-nuclear-reactor-produce · https://www.usbr.gov/lc/hooverdam/faqs/powerfaq.html · https://www.nyiso.com/documents/20142/2226333/2026-Gold-Book-Public.pdf · https://www.datacenterdynamics.com/en/news/openai-and-oracle-to-deploy-450000-gb200-gpus-at-stargate-abilene-data-center/ · https://www.datacenterdynamics.com/en/news/meta-to-invest-hundreds-of-billions-of-dollars-into-compute-to-build-superintelligence-with-several-multi-gw-data-center-clusters/ · https://www.anthropic.com/news/anthropic-amazon-compute · https://commons.wikimedia.org/wiki/File:2017_Aerial_view_Hoover_Dam_4771.jpg',
  ].join('\n\n'));
  return s;
}

// =====================================================================================
// 7. ONE TRAINING RUN, IN NEW YORK CITY TIME
async function trainingSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  kicker(s, 'THE ACCELERATION · INFORMATION IS PHYSICAL · 4');
  title(s, 'GPT-6 Astra’s training ≈ 3–4 days of NYC power');

  // left: the headline + Brockman's own words
  const lw = 3.75;
  const clip = await d.frame(s, D('pcgamer_astra_head.png'), { x: MX, y: 1.8, w: lw, h: 2.15 }, { rot: -1.5, pad: 0.06 });
  const qy = clip.geom.y + clip.geom.h + 0.38;
  const q = d.text(s, [
    { text: '“…this is the first run that we’ve trained on more than 100,000 GPUs, which is an easy number to throw around, but just think about the scale of that.”', options: { italic: true, fontFace: 'Cambria', fontSize: 16, color: d.S.txt, breakLine: true, paraSpaceAfter: 6 } },
    { text: '— Greg Brockman, OpenAI president, to Stratechery (Sep 4, 2026)', options: { fontSize: 12, color: d.S.muted } },
  ], { x: MX, y: qy, w: lw, h: 6.5 - qy, valign: 'top' });

  // right: the arithmetic, the week bar, the trend
  const rx = 4.85, rw = W - MX - rx;
  const lab1 = label(d, s, 'THE ARITHMETIC · EPOCH AI ESTIMATES (OPENAI HAS NOT DISCLOSED THE ENERGY)', rx, 1.72, rw);
  // the 233 MW cell ties the run back to slide 6's yardsticks (fact #77: ≈197,000 homes, ≈¼ of a typical reactor);
  // operators and the 503 GWh cell are trimmed to make room for its two-line label
  const cells = [
    ['100,000+', 'GPUs (Nvidia GB200)', 1.28],
    ['2.33 kW', 'per GPU, incl. servers & cooling', 1.3],
    ['233 MW', 'nonstop ≈ 200,000 US homes (¼ of a reactor)', 1.56],
    ['~90 days', 'of pretraining (assumed)', 1.26],
    ['503 GWh', 'of electricity', 1.36],
  ];
  const opW = 0.28, eqY = 2.04, eq = [];
  let cx = rx;
  cells.forEach(([v, l, w], i) => {
    const last = i === cells.length - 1;
    eq.push(d.text(s, v, { x: cx, y: eqY, w, h: 0.45, fontSize: 21, bold: true, color: last ? d.S.red : d.S.txt, fontFace: 'Arial', valign: 'bottom' }));
    eq.push(d.text(s, l, { x: cx, y: eqY + 0.5, w: w - 0.05, h: 0.42, fontSize: 11, color: d.S.muted, valign: 'top' }));
    cx += w;
    if (!last) { eq.push(d.text(s, i % 2 ? '=' : '×', { x: cx, y: eqY, w: opW, h: 0.45, fontSize: 20, color: d.S.steel, align: 'center', valign: 'bottom' })); cx += opW; }
  });

  // one week of NYC electricity as seven day-blocks; Astra's ~503 GWh fills 3.66 of them. The fill is drawn as separate
  // red segments over the blocks (gaps kept) so the days stay countable; day labels sit in a row under the bar.
  const lab2 = label(d, s, 'ONE WEEK OF NEW YORK CITY’S ELECTRICITY  =  961 GWh', rx, 3.16, rw, d.S.amber);
  const by = 3.46, bh = 0.58, gap = 0.05, bw = (rw - 6 * gap) / 7, dx = (i) => rx + i * (bw + gap);
  const week = [];
  for (let i = 0; i < 7; i++) {
    const n = d.name('day');
    s.addShape(d.pres.shapes.RECTANGLE, { x: dx(i), y: by, w: bw, h: bh, fill: { color: HEX.card }, line: { color: HEX.steel, width: 0.75 }, objectName: n });
    week.push(n, d.text(s, `day ${i + 1}`, { x: dx(i), y: by + bh + 0.03, w: bw, h: 0.2, fontSize: 10, color: d.S.steel, align: 'center', valign: 'top' }));
  }
  const astraDays = 3.66, segs = [];
  for (let i = 0; i < Math.ceil(astraDays); i++) {
    const n = d.name('fill'), f = Math.min(1, astraDays - i);
    s.addShape(d.pres.shapes.RECTANGLE, { x: dx(i), y: by, w: f * bw, h: bh, fill: { color: HEX.red }, line: { color: HEX.red, width: 0.75 }, objectName: n });
    segs.push(n);
  }
  const fillT = d.text(s, [{ text: 'GPT-6 Astra ≈ 3.7 days', options: { bold: true } }, { text: '  (503 GWh)' }],
    { x: rx + 0.14, y: by, w: dx(3) + 0.66 * bw - rx - 0.2, h: bh, fontSize: 15, color: 'FFFFFF', valign: 'middle' });
  // plausible range whisker under the day labels (2.2 – 6.1 days)
  const wy = by + bh + 0.37, w0 = rx + 2.16 * (bw + gap), w1 = rx + 6.14 * (bw + gap);
  const whisk = [line(d, s, w0, wy, w1 - w0, 0, HEX.muted, { width: 1.25 }), line(d, s, w0, wy - 0.07, 0, 0.14, HEX.muted, { width: 1.25 }), line(d, s, w1, wy - 0.07, 0, 0.14, HEX.muted, { width: 1.25 })];
  whisk.push(d.text(s, 'plausible range ≈ 2–6 days (60–120 days of training; 2.1–2.9 kW per GPU)', { x: w0 - 0.6, y: wy + 0.07, w: w1 - w0 + 1.2, h: 0.24, fontSize: 11, color: d.S.muted, align: 'center', valign: 'top' }));

  // the trend: each record run measured in NYC-time, and Epoch's 2030 forecast
  const lab3 = label(d, s, 'SAME YARDSTICK, EARLIER RECORD RUNS · AND WHERE IT IS HEADING', rx, 4.9, rw);
  const ty = 5.2, th = 1.28, cw = 1.3, ag = 0.17;
  const trend = [['GPT-3 · 2020', '~19 min'], ['GPT-4 · 2023', '~8 hours'], ['Grok 3 · 2025', '~1.7 days'], ['GPT-6 Astra · 2026', '~3.7 days']];
  const tgroups = [];
  trend.forEach(([m, v], i) => {
    const x = rx + i * (cw + ag), g = [d.card(s, { x, y: ty, w: cw, h: th })];
    g.push(d.text(s, m, { x: x + 0.08, y: ty + 0.1, w: cw - 0.14, h: 0.42, fontSize: 11, color: d.S.muted, valign: 'top' }));
    g.push(d.text(s, v, { x: x + 0.08, y: ty + 0.66, w: cw - 0.1, h: 0.46, fontSize: 17, bold: true, color: i === 3 ? d.S.red : d.S.txt, fontFace: 'Arial', valign: 'middle' }));
    if (i < 3) g.push(d.text(s, '›', { x: x + cw, y: ty, w: ag, h: th, fontSize: 20, color: d.S.steel, align: 'center', valign: 'middle' }));
    tgroups.push(g);
  });
  const fx = rx + 4 * (cw + ag) + 0.04, fw = W - MX - fx;
  const fut = [d.card(s, { x: fx, y: ty, w: fw, h: th }, { color: '2A1416', line: HEX.red })];
  fut.push(d.text(s, '2030 · Epoch AI forecast', { x: fx + 0.1, y: ty + 0.1, w: fw - 0.2, h: 0.26, fontSize: 11, color: d.S.muted, valign: 'top' }));
  fut.push(d.text(s, '4–16 GW', { x: fx + 0.1, y: ty + 0.36, w: fw - 0.2, h: 0.44, fontSize: 22, bold: true, color: d.S.red, fontFace: 'Arial', valign: 'middle' }));
  fut.push(d.text(s, 'for one run: 0.7–2.8× NYC’s average demand', { x: fx + 0.1, y: ty + 0.82, w: fw - 0.16, h: 0.42, fontSize: 11, color: d.S.txt, valign: 'top' }));

  d.source(s, 'Sources: PC Gamer, Sep 7, 2026 · Fortune, Sep 3 · Stratechery, Sep 4 · Epoch AI model database & Epoch/EPRI (Aug 2025) · NYISO 2026 Gold Book (Zone J) · arithmetic in notes');

  d.animate(s, clip, { auto: true, effect: 'slam', dur: 450 });
  d.animate(s, [q], { auto: true, effect: 'fade', after: 200 });
  d.animate(s, [lab1, ...eq], { effect: 'wipeLeft', dur: 900 });
  d.animate(s, [lab2, ...week], { effect: 'fade', dur: 400 });
  // the red segments fill day by day (each wipes in after the previous), the caption wipes across with them
  d.animate(s, [...segs.map((name, i) => ({ name, delay: i * 340, dur: i < 3 ? 340 : 230 })), { name: fillT, dur: 1250 }], { auto: true, effect: 'wipeLeft', after: 150 });
  d.animate(s, whisk, { effect: 'fade' });
  d.animate(s, [lab3, ...tgroups.flatMap((g, i) => g.map(name => ({ name, delay: i * 220 })))], { effect: 'rise' });
  d.animate(s, fut, { effect: 'zoom', dur: 450 });

  s.addNotes([
    'BUILD: the clipping and Brockman’s quote appear automatically. Click 1 — the arithmetic. Click 2 — one week of NYC electricity, then GPT-6 Astra’s share fills in. Click 3 — the plausible range. Click 4 — earlier record runs on the same yardstick. Click 5 — the 2030 forecast.',
    'How much electricity does training one frontier model take? OpenAI says GPT-6 Astra was “the first time we’ve pretrained on more than 100,000 GPUs at our Stargate site in Texas” — its largest training run “by far” (Aidan Clark, VP of research, to Fortune, Sep 3, 2026). Brockman, to Stratechery: “just think about the scale of that.” Jensen Huang (via X, reported by PC Gamer): trained on “~100K+ Nvidia Grace Blackwell NVLink72”, with plans to bring 400,000 GPUs online next.',
    'THE ANSWER: roughly 3–4 days of New York City’s entire electricity use (central estimate 3.7 days; plausible range 2–6 days). NOTE: the line “it used as much electricity as NYC uses in a week” overstates it by about 2× — matching a full NYC-week at 233 MW would take ~172 days of pretraining, longer than any evidence suggests. Say “3 to 4 days”.',
    'ARITHMETIC (central case): 100,000 GPUs × 2.327 kW per GPU all-in = 232.7 MW. × 90 days × 24 h = 2,160 h → 232.7 MW × 2,160 h = 502,600 MWh ≈ 503 GWh. NYC: 50,104 GWh in 2025 ÷ 365 = 137.3 GWh per day (× 7 = 961 GWh per week). 503 ÷ 137.3 = 3.66 days (= 0.52 of a week).',
    'INPUTS AND SOURCES: (1) GPU count “more than 100,000” — OpenAI’s Aidan Clark via Fortune (Sep 3, 2026); Greg Brockman via Stratechery (Sep 4, 2026); Huang via PC Gamer (Sep 7, 2026). We use exactly 100,000 (a lower bound). Abilene’s first two buildings hold 100,800 GB200s (Epoch, citing Crusoe: “Each building has been designed to operate up to 50,000 NVIDIA GB200 NVL72s”). OpenAI says only “our Stargate site in Texas”; “Abilene” is Epoch’s/the press’s attribution. (2) 2.327 kW per GPU — Epoch AI’s model database (GPT-6 Astra row, updated Sep 23, 2026) estimates a training power draw of 232.67 MW = ~1,200 W per GB200 × 1.82 server overhead × PUE ~1.065 (Epoch estimation method). Cross-checks: HPE QuickSpecs — a GB200 NVL72 rack (72 GPUs) has a “TDP … 132 kW nominal” = 1.83 kW per GPU before cooling; SpaceX S-1 — “approximately 110,000 GB200 processors, approximately 210 megawatts of compute power” = 1.91 kW per GPU (IT only). (3) 90 days — Epoch’s assumption (“~100k GB200s over 90 days at 25% FP8 MFU”, ~1e27 FLOP); OpenAI has not disclosed the duration. (4) NYC = NYISO Load Zone J, 2025 annual energy 50,104 GWh (2026 Gold Book, Table I-2).',
    'RANGE: low = 206 MW (Crusoe’s 206 MW first phase ÷ 100,000) × 60 days = 297 GWh = 2.2 days; high = 292.7 MW (Epoch’s 295 MW peak facility power for buildings 1–2 ÷ 100,800 GPUs × 100,000) × 120 days = 843 GWh = 6.1 days. All cases assume near-peak draw (actual average draw is probably a bit lower), and cover PRETRAINING ONLY — RL post-training, experiments and inference are not disclosed and come on top.',
    'Other ways to say 233 MW: ~4% of NYC’s average load; the continuous use of ~197,000 average US homes; about a quarter of a typical nuclear reactor; about half of Hoover Dam’s average output. The whole ~503 GWh run ≈ a year of electricity for ~48,500 US homes.',
    'TREND (Epoch power × Epoch training time ÷ NYC’s 5.72 GWh per hour): GPT-3 (2020) 5.1 MW × 355 h = 1.8 GWh ≈ 19 minutes; GPT-4 (2023) 19.9 MW × 2,280 h = 45.5 GWh ≈ 8 hours; Grok 3 (2025) 110 MW × 2,160 h = 237.5 GWh ≈ 1.7 days; GPT-6 Astra ≈ 3.7 days. All are estimates, not company disclosures.',
    'WHERE IT IS HEADING: Huang’s next 400,000 GPUs at the same ~2.33 kW each ≈ 0.93 GW — one nuclear reactor. Epoch AI/EPRI (Aug 11, 2025): training power has grown ~2.2× a year and “the largest individual frontier training runs in 2030 will likely draw 4-16 gigawatts (GW) of power” → 4 ÷ 5.72 = 0.7× to 16 ÷ 5.72 = 2.8× New York City’s average demand (the top end is ~1.5× NYC’s 2025 summer peak). That is a forecast.',
    'URLs: https://www.pcgamer.com/software/ai/jensen-huang-says-100-000-nvidia-gpus-were-used-to-train-openais-latest-model-gpt-6-astra-and-theres-already-plans-to-bring-quadruple-that-amount-of-hardware-online/ · https://fortune.com/2026/09/03/openai-debuts-gpt-6-astra-computer-use-greg-brockman-says-start-of-agi/ · https://stratechery.com/2026/an-interview-with-openai-president-greg-brockman-about-astra-and-alignment/ · https://epoch.ai/data/all_ai_models.csv · https://epoch.ai/data/ai-models-documentation/estimation · https://epoch.ai/data/ai-data-centers/directory/openai-stargate-abilene · https://www.hpe.com/us/en/collaterals/collateral.a50009224enw.html · https://www.sec.gov/Archives/edgar/data/1181412/000162828026036936/spaceexplorationtechnologi.htm · https://www.nyiso.com/documents/20142/2226333/2026-Gold-Book-Public.pdf · https://epoch.ai/publications/power-demands-of-frontier-ai-training · https://www.eia.gov/electricity/sales_revenue_price/pdf/table_5A.pdf',
  ].join('\n\n'));
  return s;
}

// =====================================================================================
// 8. SUPPLY CAN'T KEEP UP
async function supplySlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  kicker(s, 'THE ACCELERATION · INFORMATION IS PHYSICAL · 5');
  title(s, 'The build-out is outrunning supply');

  const lw = 6.2;
  const lab = label(d, s, 'PJM CAPACITY AUCTION PRICE ($/MW-DAY, BY DELIVERY YEAR)', MX, 1.72, lw);
  const yrs = ['18/19', '19/20', '20/21', '21/22', '22/23', '23/24', '24/25', '25/26', '26/27', '27/28', '28/29'];
  const px = [164.77, 100.0, 76.53, 140.0, 50.0, 34.13, 28.92, 269.92, 329.17, 333.44, 325.0];
  const pjBox = { x: MX - 0.12, y: 1.98, w: lw + 0.12, h: 2.62 }, pjL = { x: 0.1, y: 0.04, w: 0.88, h: 0.82 };
  const ch = d.chart(s, 'bar', [{ name: 'Clearing price', labels: yrs, values: px }], pjBox, {
    layout: pjL, barDir: 'col', chartColors: [...Array(7).fill(HEX.steel), HEX.amber, HEX.red, HEX.red, HEX.red], barGapWidthPct: 40,
    valAxisMaxVal: 500, valAxisMinVal: 0, valAxisMajorUnit: 100, valAxisLabelFormatCode: '$#,##0',
    showValue: true, dataLabelFormatCode: '[<30]$0;[<200]"";$0', dataLabelPosition: 'outEnd', dataLabelFontSize: 11, dataLabelFontBold: true,
    catAxisLabelFontSize: 10,
  });
  // note sits directly over the three capped (red) bars, between the $400 and $500 gridlines
  const pg = barGeom(pjBox, pjL, yrs.length, 40, 500);
  const capX0 = pg.cx(8) - pg.cw / 2, capX1 = pg.cx(10) + pg.cw / 2;
  const capNote = d.text(s, 'Last 3 auctions:\nat the price cap', { x: capX0, y: pg.vy(450) - 0.19, w: capX1 - capX0, h: 0.38, fontSize: 11, italic: true, color: d.S.red, align: 'center', valign: 'middle' });
  const pjCap = d.text(s, 'PJM (US grid operator), 2028/29 auction: still 6.8 GW short of its reliability target; without the cap it would have cleared at ≈ $555/MW-day',
    { x: MX, y: 4.62, w: lw, h: 0.42, fontSize: 11, italic: true, color: d.S.muted, valign: 'top' });

  const sw = (lw - 2 * 0.25) / 3;
  const sts = [
    ['116 GW', 'GE Vernova gas-turbine backlog + reservations — up 16 GW in one quarter'],
    ['2,060 GW', 'of generation & storage waiting in US grid connection queues'],
    ['+77%', 'power-transformer unit costs since 2019; ~30% supply deficit'],
  ].map(([v, l], i) => stat(d, s, { x: MX + i * (sw + 0.25), y: 5.2, w: sw, value: v, label: l, valueSize: 28, color: d.S.amber, labelSize: 12, labelH: 0.85 }));

  const rx = 7.2, rw = W - MX - rx;
  // nominal gap 0.27" between the two clippings; after rotation the closest corners stay ≥ 0.17" apart
  const c1 = await d.frame(s, D('guardian_ramageddon_head.png'), { x: rx, y: 1.72, w: rw, h: 1.55 }, { rot: -1.2, pad: 0.07 });
  const c2 = await d.frame(s, D('ars_ram.png'), { x: rx, y: 3.54, w: rw, h: 2.12 }, { rot: 0.8, pad: 0.05 });
  const dv = d.text(s, '+93–98%', { x: rx, y: 5.83, w: 2.1, h: 0.6, fontSize: 30, bold: true, color: d.S.red, fontFace: 'Arial', valign: 'middle' });
  const dl = d.text(s, 'jump in DRAM contract prices in a single quarter (1Q26, TrendForce)', { x: rx + 2.15, y: 5.83, w: rw - 2.15, h: 0.6, fontSize: 12, color: d.S.muted, valign: 'middle' });

  d.source(s, 'Sources: PJM 2028/29 BRA report (Jul 14, 2026) · GE Vernova Q2 2026 results · LBNL “Queued Up” (end-2025) · Wood Mackenzie (Aug 2025) · The Guardian, Sep 21, 2026 · Ars Technica, Oct 1, 2026 · TrendForce');

  d.animate(s, [lab, ch, capNote, pjCap], { auto: true, effect: 'wipeLeft', dur: 1000 });
  d.animate(s, sts.flat(), { effect: 'rise', stagger: 180 });
  d.animate(s, c1, { effect: 'slam', dur: 450 });
  d.animate(s, c2, { auto: true, effect: 'slam', dur: 450, after: 250 });
  d.animate(s, [dv, dl], { effect: 'zoom', dur: 400 });

  s.addNotes([
    'Power: PJM, a US regional grid operator, runs an annual auction for future generating capacity. The clearing price went from $28.92/MW-day (2024/25) to the ~$325–333 cap for three straight auctions; total annual cost rose from $2.2B to $16.4B. Without the cap, 2028/29 would have cleared at ~$555, and it still came up 6.8 GW short of the reliability requirement (PJM BRA report; Utility Dive). CAVEAT: our sources document the shortfall and the price spike, not their cause — present this as evidence that power supply is tight, not as proof that data centers alone drove it.',
    'Equipment: GE Vernova’s gas-power backlog + slot reservations grew from 100 GW to 116 GW in Q2 2026 alone, heading for at least 125 GW by year-end (company earnings release). Over 2,060 GW of generation and storage (~8,200 projects) was waiting in US interconnection queues at the end of 2025 (LBNL Queued Up 2026, from the official page summary — the PDF itself was not accessible). Wood Mackenzie: power transformers are in a ~30% supply deficit; unit costs up 77% (power) and 78–95% (distribution) since 2019.',
    'Chips: memory is being hoovered up by datacentres. Guardian: “‘RAMageddon’: tech crunch hikes the price of your next iPhone by £100.” Ars Technica: “Memory executives expect RAM shortage to continue through 2028.” TrendForce: conventional DRAM contract prices rose 93–98% in 1Q26 alone, then another 58–63% in 2Q26; DRAM industry revenue nearly tripled from $53.6B (4Q25) to $154.7B (2Q26). (Compounding to ~4× is our derivation, not a TrendForce figure — don’t quote it as theirs.)',
    'URLs: https://www.pjm.com/-/media/DotCom/markets-ops/rpm/rpm-auction-info/2028-2029/2028-2029-bra-results-report.pdf · https://www.utilitydive.com/news/pjm-capacity-auction-price-cap-reserve-shortfall/825282/ · https://www.sec.gov/Archives/edgar/data/1996810/000199681026000147/gevpressrelease2q26.htm · https://emp.lbl.gov/queues · https://www.woodmac.com/news/opinion/transformer-troubles-manufacturing-and-policy-constraints-hit-us-transformer-supply/ · https://www.theguardian.com/money/2026/sep/21/ramageddon-apple-iphone-price-increase-chip-shortage · https://arstechnica.com/information-technology/2026/10/memory-supplies-are-only-getting-tighter-micron-ceo-says/ · https://www.trendforce.com/presscenter/news/20260601-13070.html',
  ].join('\n\n'));
  return s;
}

// =====================================================================================
// 9. NUCLEAR PLANTS COME BACK FROM THE DEAD
async function nuclearSlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  kicker(s, 'THE ACCELERATION · INFORMATION IS PHYSICAL · 6');
  title(s, 'Three Mile Island is reopening to power AI');

  // left: the plant, with the 2024 NPR headline pinned in its sky
  const lw = 5.25, phY = 2.0, phH = lw * 2292 / 3600;
  const ph = await d.frame(s, D('tmi_aerial.jpg'), { x: MX, y: phY, w: lw, h: phH }, { border: false });
  const cap = captionBar(d, s, ph.geom, [{ text: 'Three Mile Island, Pa.', options: { bold: true } }, { text: '  ·  Unit 1 shut 2019  →  restarting as “Crane”' }]);
  const npr = await d.frame(s, D('npr_tmi_head.png'), { x: MX - 0.08, y: 1.7, w: 4.3, h: 0.92 }, { rot: -2, pad: 0.07, align: 'left' });
  const qy = ph.geom.y + ph.geom.h + 0.18;
  const quote = d.text(s, [
    { text: '“I suspect that the rush to do things quickly is leading to mistakes – and you don’t like to have too many mistakes when you’re talking about a nuclear power plant.”', options: { italic: true, color: d.S.txt, breakLine: true, paraSpaceAfter: 3 } },
    { text: '— Edwin Lyman, Union of Concerned Scientists, on Palisades', options: { fontSize: 11, color: d.S.steel, fontFace: 'Calibri' } },
  ], { x: MX, y: qy, w: lw, h: 6.52 - qy, fontSize: 13, valign: 'top', fontFace: 'Cambria' });

  // right: the three US restarts — headline clipping + who / when / how many MW + status
  const rx = MX + lw + 0.35, rw = W - MX - rx;
  const lab = label(d, s, 'THE THREE SHUT US REACTORS COMING BACK  ·  ≈ 2.25 GW', rx, 1.72, rw, d.S.amber);
  // owner/seller in the 'where' line; buyer · deal year · federal money on one 13pt line; status chip (targets are
  // attributed: Crane's 'ahead of schedule' is Constellation's own claim)
  const rows = [
    { clip: 'capstar_crane_head.png', mw: '835 MW', name: 'Crane (TMI Unit 1)', where: 'Constellation · Pa. · shut 2019',
      deal: 'Microsoft · 20-yr deal (2024) · $1B DOE loan', status: 'TARGET: 2027 · CONSTELLATION: “AHEAD OF SCHEDULE”', col: HEX.teal, rot: -1 },
    { clip: 'bnn_duane_head.png', mw: '615 MW', name: 'Duane Arnold', where: 'NextEra · Iowa · shut 2020',
      deal: 'Google · 25-yr deal (2025) · ≤$1.9B DOE loan', status: 'TARGET: NO LATER THAN Q1 2029', col: '3E6FD8', rot: 1 },
    { clip: 'national_palisades_head.png', mw: '800 MW', name: 'Palisades', where: 'Holtec · Mich. · shut 2022',
      deal: 'Rural co-ops · $1.52B DOE loan guarantee', status: 'PAUSED SINCE AUG 30 · NO NEW DATE', col: 'C0282B', rot: -1 },
  ];
  const r0 = 2.06, rh = 1.36, rg = 0.15, cw = 2.5, fx = rx + 0.14 + cw + 0.26, fw = W - MX - fx - 0.12;
  const groups = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i], y = r0 + i * (rh + rg), g = [d.card(s, { x: rx, y, w: rw, h: rh })];
    g.push(...await d.frame(s, D(r.clip), { x: rx + 0.14, y: y + 0.12, w: cw, h: rh - 0.24 }, { rot: r.rot, pad: 0.05 }));
    g.push(d.text(s, r.mw, { x: fx, y: y + 0.08, w: 1.42, h: 0.46, fontSize: 25, bold: true, color: d.S.amber, fontFace: 'Arial', valign: 'middle' }));
    g.push(d.text(s, [
      { text: r.name, options: { bold: true, color: d.S.txt, fontSize: 12.5, breakLine: true } },
      { text: r.where, options: { color: d.S.muted, fontSize: 11 } },
    ], { x: fx + 1.46, y: y + 0.08, w: fw - 1.46, h: 0.46, valign: 'middle' }));
    g.push(d.text(s, r.deal, { x: fx, y: y + 0.6, w: fw, h: 0.32, fontSize: 13, color: d.S.txt, valign: 'middle' }));
    g.push(...chip(d, s, r.status, fx, y + rh - 0.36, fw, r.col, { h: 0.27, fontSize: 10, charSpacing: 0 }));
    groups.push(g);
  }

  d.source(s, 'Sources: NPR, Sep 20, 2024 · Pa. Capital-Star, Jul 29, 2026 · WNN, Sep 28 · Reuters/BNN, Sep 8 · The National, Sep 23 · Detroit Free Press, Sep 26 · Photo: formulanone / Wikimedia Commons, CC BY-SA 2.0');

  d.animate(s, [...ph, ...cap], { auto: true, effect: 'fade', dur: 700 });
  d.animate(s, npr, { auto: true, effect: 'slam', dur: 450, after: 150 });
  d.animate(s, [lab, ...groups[0]], { effect: 'rise' });
  d.animate(s, groups[1], { effect: 'rise' });
  d.animate(s, groups[2], { effect: 'rise' });
  d.animate(s, [quote], { effect: 'fade', dur: 700 });

  s.addNotes([
    'The power crunch is so severe that shut nuclear plants are being brought back. Sep 20, 2024 — NPR: “Three Mile Island nuclear plant will reopen to power Microsoft data centers.” Three Mile Island is the site of the worst commercial nuclear accident in US history (1979; that partial meltdown was in Unit 2 — the reactor now restarting is Unit 1, which ran until 2019). Microsoft signed a 20-year deal to buy all of its 835 MW; Constellation is renaming it the Crane Clean Energy Center. Financial terms “weren’t disclosed” (CNN) — the “$16B” figure online is a Pennsylvania GDP-impact estimate, not the deal value.',
    'Click 1 — Crane status (Oct 2026): first targeted for 2028; Constellation told World Nuclear News on Sep 28, 2026 that “the restart remains ahead of schedule, and we’re on track to return 835 megawatts of dependable, emissions-free power to the grid in 2027” (company claim). $1.6B restart, backed by a $1B DOE loan (Nov 18, 2025). A PJM analysis had suggested a grid connection only in 2031; FERC let Constellation move grid rights from its Eddystone gas units, and the NRC approved the fuel licence amendment. The NRC’s final environmental assessment (finding of no significant impact) was published Sep 25, 2026; an exemption and three licence amendments are still pending; new fuel arrives by end-2026. Capital-Star (Jul 29, 2026): “Concern persists as former Three Mile Island nuclear plant progresses toward 2027 restart” — the plant is “on track to begin producing electricity again by the middle of next year, federal regulators said” (i.e. by mid-2027); WITF (Jul 28, 2026; Constellation is a WITF funder) reports an NRC operating-licence decision expected in May 2027. No exact restart month has been announced, so the chip says “TARGET: 2027” and attributes “ahead of schedule” to Constellation. A 262-ton transformer arrived from South Korea in August.',
    'Click 2 — Duane Arnold, Iowa (615 MW, shut 2020): Google signed a 25-year deal with NextEra (Oct 27, 2025); DOE closed a loan of up to $1.9B on Sep 8, 2026; restart targeted “no later than first quarter of 2029”.',
    'Click 3 — Palisades, Michigan (800 MW, shut May 2022): Holtec’s restart — the power goes to rural co-ops (Wolverine ~435 MW, Hoosier 370 MW), not a tech company, backed by a $1.52B DOE loan guarantee. Fuel loading began Aug 30, 2026; one previously used fuel assembly “tilted from its upright position after it had been placed in the vessel”. Loading is still paused (MLive, Oct 3, 2026); NEI Magazine says the restart is delayed indefinitely; no new date. NRC: “no radiological release.” Holtec disclosed it only in a Sep 21 progress report, about three weeks later. The National (Sep 23): “Shadow cast over US nuclear revival after Palisades reactor incident” — “The revival has been driven largely by the proliferation of energy-hungry data centres.” Earlier targets (end-2025, early 2026) were missed; Holtec’s contract calls for power by March 2027. Holtec then postponed its $750M+ IPO (Sep 17); CEO Krishna Singh: “Our business, rightly or wrongly, is viewed as connected to [data centers].”',
    'Click 4 — Edwin Lyman (Union of Concerned Scientists), Detroit Free Press, Sep 26, 2026: “I suspect that the rush to do things quickly is leading to mistakes – and you don’t like to have too many mistakes when you’re talking about a nuclear power plant.” (The theme of this whole talk: racing creates mistakes.)',
    'If asked about new nuclear: Meta signed for up to 6.6 GW (Vistra, TerraPower, Oklo; Jan 9, 2026) on top of all 1,121 MW of Constellation’s Clinton plant from June 2027; Amazon takes 1,920 MW from Talen’s Susquehanna plant through 2042 and signed a 20-year, 690 MW Calvert Cliffs deal (Sep 30, 2026); Google has up to 500 MW of Kairos small reactors by 2035 and 50% of Finland’s Loviisa plant for 2030–2049. No credible new Microsoft nuclear deal beyond Crane was found.',
    'Photo: Three Mile Island Nuclear Generating Station, 26 Apr 2021, by formulanone (Flickr / Wikimedia Commons), CC BY-SA 2.0, cropped.',
    'URLs: https://www.npr.org/2024/09/20/nx-s1-5120581/three-mile-island-nuclear-power-plant-microsoft-ai · https://www.cnn.com/2024/09/20/energy/three-mile-island-microsoft-ai/index.html · https://www.world-nuclear-news.org/articles/nrc-completes-environmental-review-of-crane-restart · https://penncapital-star.com/energy-environment/concern-persists-as-crane-nuclear-plant-progresses-toward-2027-restart/ · https://www.constellationenergy.com/news/2025/11/us-government-backs-constellations-plan-to-launch-crane-clean-energy-center-adding-835-mws-of-new-baseload-power-to-the-grid.html · https://www.bnnbloomberg.ca/business/international/2026/09/08/nextera-secures-up-to-19b-us-loan-to-restart-duane-arnold-nuclear-center/ · https://www.investor.nexteraenergy.com/news-and-events/news-releases/2026/09-08-2026-123110497 · https://www.thenationalnews.com/future/technology/2026/09/23/palisades-power-plant-nuclear-incident/ · https://www.ans.org/news/2026-09-25/article-8436/incident-pauses-palisades-fuel-loading-plant-connected-to-switchyard/ · https://www.neimagazine.com/news/palisades-restart-delayed/ · https://www.mlive.com/environment/2026/10/federal-regulators-investigating-tilted-fuel-assembly-at-michigan-nuclear-plant.html · https://www.freep.com/story/news/environment/2026/09/26/palisades-nuclear-holtec-nrc/91934961007/ · https://www.inquirer.com/business/holtec-camden-ipo-data-center-backlash-20260917.html · https://about.fb.com/news/2026/01/meta-nuclear-energy-projects-power-american-ai-leadership/ · https://commons.wikimedia.org/wiki/File:Three_Mile_Island_Nuclear_Generating_Station_(51142893665).jpg',
  ].join('\n\n'));
  return s;
}

// =====================================================================================
// 10. THE ENVIRONMENTAL BILL
async function envSlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  kicker(s, 'THE ACCELERATION · INFORMATION IS PHYSICAL · 7');
  title(s, 'The environmental bill is coming due');

  const lw = 4.5;
  const lab = label(d, s, 'DATA-CENTER ELECTRICITY USE, WORLD (TWh, IEA)', MX, 1.72, lw);
  const ieBox = { x: MX - 0.12, y: 1.98, w: lw + 0.12, h: 2.75 }, ieL = { x: 0.12, y: 0.03, w: 0.86, h: 0.85 };
  const ch = d.chart(s, 'bar', [{ name: 'Global data centers', labels: ['2024', '2030 proj.', '2035 proj.'], values: [415, 945, 1200] }],
    ieBox, {
      layout: ieL, barDir: 'col', chartColors: [HEX.steel, HEX.red, HEX.red], barGapWidthPct: 60,
      valAxisMaxVal: 1600, valAxisMinVal: 0, valAxisMajorUnit: 400, valAxisLabelFormatCode: '#,##0',
      showValue: true, dataLabelFormatCode: '#,##0', dataLabelPosition: 'outEnd', dataLabelFontSize: 13, dataLabelFontBold: true,
      catAxisLabelFontSize: 12,
    });
  // note beside the top of the 2030 bar (right-aligned to its left edge, between the 800 and 1,200 gridlines)
  const ig = barGeom(ieBox, ieL, 3, 60, 1600);
  const jx1 = ig.cx(1) - ig.bw / 2 - 0.1;
  const japan = d.text(s, '2030: more than Japan’s\ntotal use today', { x: jx1 - 1.6, y: ig.vy(1000) - 0.19, w: 1.6, h: 0.38, fontSize: 11, italic: true, color: d.S.muted, align: 'right', valign: 'middle' });

  const st1 = stat(d, s, { x: MX, y: 4.92, w: 2.1, value: '6.7–12%', valueSize: 30, color: d.S.amber, labelSize: 12, labelH: 0.95,
    label: 'of US electricity to data centers by 2028 (LBNL projection), vs 4.4% in 2023' });
  const st2 = stat(d, s, { x: MX + 2.4, y: 4.92, w: 2.1, value: '+37%', valueSize: 30, color: d.S.amber, labelSize: 12, labelH: 0.95,
    label: 'Google’s freshwater use, 2025 vs 2024; its energy use rose 36% — Google report' });

  // wall of headlines: two staggered columns
  const w1 = await d.frame(s, D('guardian_xai_head.png'), { x: 5.45, y: 1.78, w: 3.6, h: 1.1 }, { rot: -1.5, pad: 0.07 });
  const w2 = await d.frame(s, D('guardian_thermal.png'), { x: 9.25, y: 1.98, w: 3.48, h: 1.85 }, { rot: 2, pad: 0.06 });
  const w3 = await d.frame(s, D('guardian_drought_head.png'), { x: 5.5, y: 3.28, w: 3.6, h: 1.1 }, { rot: 1.2, pad: 0.07 });
  const w4 = await d.frame(s, D('wired_gas.png'), { x: 9.2, y: 4.25, w: 3.53, h: 1.75 }, { rot: -1.5, pad: 0.06 });
  const w5 = await d.frame(s, R('nbc_datacenter_opposition_130b.png'), { x: 5.45, y: 4.8, w: 3.6, h: 1.32 }, { rot: -1, pad: 0.06 });

  d.source(s, 'Sources: IEA, Energy and AI (2025, CC BY 4.0) · LBNL (Dec 2024) · Google 2026 Environmental Report · The Guardian, Jan 15, Feb 13 & Jun 8, 2026 · WIRED, Jan 28, 2026 · NBC News, Jun 12, 2026');

  // build follows the notes: electricity (chart, then LBNL) → pollution (xAI; thermal drone + WIRED gas boom)
  // → water (drought + Google) → backlash (NBC)
  d.animate(s, [lab, ch, japan], { auto: true, effect: 'wipeLeft', dur: 1000 });
  d.animate(s, st1, { auto: true, effect: 'rise', after: 300 });
  d.animate(s, w1, { effect: 'slam', dur: 450 });
  // stagger whole clippings (frame + image together), not their individual parts
  const together = (groups, st) => groups.flatMap((g, i) => g.map(name => ({ name, delay: i * st })));
  d.animate(s, together([w2, w4], 200), { effect: 'rise' });
  d.animate(s, together([w3, st2], 250), { effect: 'rise' });
  d.animate(s, w5, { effect: 'rise' });

  s.addNotes([
    'Electricity (builds automatically, chart then the LBNL stat): the IEA (Energy and AI, 2025, Base Case) puts data-center use at ~415 TWh in 2024 (~1.5% of world electricity), ~945 TWh by 2030 — slightly more than Japan’s total consumption today — and ~1,200 TWh by 2035. In the US, data centers are nearly half of electricity-demand growth to 2030. LBNL: US data centers used 4.4% of US electricity in 2023 (176 TWh), projected 6.7–12% by 2028. (IEA’s 2026 update was not accessible to us, so we use the 2025 report.)',
    'Click 1 — Pollution: Guardian, Jan 15, 2026 — “Elon Musk’s xAI datacenter generating extra electricity illegally, regulator rules” (dozens of methane gas turbines powering Colossus in Memphis). Click 2 — Guardian/Floodlight, Feb 13, 2026 — “‘A different set of rules’: thermal drone footage shows Musk’s AI power plant flouting clean air regulations” (turbines just across the line in Mississippi). WIRED, Jan 28, 2026 — gas projects explicitly linked to data centers up almost 25× in two years (Global Energy Monitor).',
    'Click 3 — Water: Guardian analysis, Jun 8, 2026 — about two-thirds of upcoming US datacenters are set to be built in places that have been among the driest in the country over the past year. Google’s own 2026 Environmental Report (company-reported): freshwater consumption up 37% in 2025; total energy use up 36% in one year (32.3 → 44.0 TWh); electricity demand up more than 250% since 2019; emissions up 18%.',
    'Click 4 — Backlash: NBC News: “Data center opponents have blocked or delayed projects worth nearly $130 billion in 2026, study finds” — Data Center Watch counted at least 75 projects in Q1 2026, the most on record, and 45 more worth $68B in Q2. If asked about household bills: EIA projects average US residential electricity at 18.6¢/kWh in 2027, up from 16.5¢ in 2024 (national averages; data centers are one driver among several — don’t claim they are the sole cause).',
    'URLs: https://iea.blob.core.windows.net/assets/de9dea13-b07d-42c5-a398-d1b3ae17d866/EnergyandAI.pdf · https://newscenter.lbl.gov/2025/01/15/berkeley-lab-report-evaluates-increase-in-electricity-demand-from-data-centers/ · https://www.theguardian.com/technology/2026/jan/15/elon-musk-xai-datacenter-memphis · https://www.theguardian.com/environment/2026/feb/13/elon-musk-xai-datacenters-air-pollution-mississippi · https://www.theguardian.com/us-news/2026/jun/08/datacenter-ai-drought-water · https://www.wired.com/story/data-centers-are-driving-a-us-gas-boom/ · https://sustainability.google/files/google-2026-environmental-report.pdf · https://www.eia.gov/outlooks/steo/report/elec_coal_renew.php · https://www.nbcnews.com/tech/tech-news/data-center-opposition-sharply-rising-2026-study-finds-rcna349728 · https://www.datacenterwatch.org/q2-2026',
  ].join('\n\n'));
  return s;
}

// =====================================================================================
// 11. THE STAKES — Altman quote (section closer)
async function stakesSlide(d) {
  const s = d.slide('Content', { transition: 'fadeBlack' });
  kicker(s, 'THE ACCELERATION · ECONOMY · 4');
  title(s, 'The stakes, in Sam Altman’s own words');

  // left: the original report (Business Insider, June 2015) — header with the stage photo, and the passage itself
  const lw = 4.95;
  const head = await d.frame(s, D('bi_2015_header.png'), { x: MX + 0.2, y: 1.74, w: lw - 0.4, h: 3.62 }, { rot: -1.5, pad: 0.06 });
  const pas = await d.frame(s, D('bi_2015_quote.png'), { x: MX, y: 5.56, w: lw, h: 0.92 }, { pad: 0.07 });
  // native amber highlight over the quoted words (not painted on the screenshot)
  const pg = pas.geom, pk = pg.w / CROPS['bi_2015_quote.png'][1].width, pl = CROPS['bi_2015_quote.png'][1].left, pt = CROPS['bi_2015_quote.png'][1].top;
  const hl = BI_QUOTE_LINES.map(([x0, y0, x1, y1]) => {
    const n = d.name('hl');
    s.addShape(d.pres.shapes.RECTANGLE, { x: pg.x + (x0 - pl) * pk, y: pg.y + (y0 - pt) * pk, w: (x1 - x0) * pk, h: (y1 - y0) * pk, fill: { color: 'FFD166', transparency: 60 }, line: { color: 'FFD166', width: 0, transparency: 100 }, objectName: n });
    return n;
  });

  // right: the quote, verbatim as Business Insider reported it, with date / event / source
  const qx = MX + lw + 0.45, qw = W - MX - qx;
  const qm = d.text(s, '“', { x: qx - 0.05, y: 1.62, w: 1.0, h: 0.95, fontSize: 100, bold: true, color: d.S.red, fontFace: 'Cambria', valign: 'top' });
  const q = d.text(s, 'AI will probably most likely lead to the end of the world, but in the meantime, there’ll be great companies.',
    { x: qx, y: 2.38, w: qw, h: 1.95, fontSize: 30, italic: true, color: d.S.txt, fontFace: 'Cambria', valign: 'top', lineSpacingMultiple: 1.02 });
  const attr = d.text(s, [
    { text: '— Sam Altman, then president of Y Combinator', options: { bold: true, color: d.S.txt, breakLine: true } },
    { text: 'Onstage at Airbnb’s Open Air 2015 conference, June 4, 2015 · reported that day by Business Insider', options: { color: d.S.muted } },
  ], { x: qx, y: 4.34, w: qw, h: 0.62, fontSize: 13, valign: 'top' });

  // bottom right: the clip of the moment, and the money a decade later
  const div = line(d, s, qx, 5.1, qw, 0, HEX.line, { width: 1 });
  const vid = await d.video(s, {
    link: 'https://www.youtube.com/watch?v=d6lDZpvHAoo&t=525s', embed: 'https://www.youtube.com/embed/d6lDZpvHAoo?start=525',
    cover: R('rev2/altman_yt_d6lDZpvHAoo_thumb.jpg'), box: { x: qx, y: 5.25, w: 2.12, h: 0.96 }, label: 'the moment, at 8:45',
  });
  const sx = qx + 2.42, sw = W - MX - sx;
  const later = [
    d.text(s, '11 YEARS LATER', { x: sx, y: 5.22, w: sw, h: 0.26, fontSize: 11, bold: true, color: d.S.steel, charSpacing: 2, valign: 'middle' }),
    d.text(s, '$852B → ~$1.4T', { x: sx, y: 5.48, w: sw, h: 0.5, fontSize: 28, bold: true, color: d.S.amber, fontFace: 'Arial', valign: 'middle' }),
    d.text(s, 'OpenAI’s valuation: its March 2026 round, then reported talks in September 2026', { x: sx, y: 6.0, w: sw, h: 0.48, fontSize: 12, color: d.S.muted, valign: 'top' }),
  ];

  d.source(s, 'Sources: Business Insider (Matt Weinberger), Jun 4, 2015 · video: Open Air 2015 fireside chat (re-upload of Airbnb’s recording) · TechCrunch, Mar 31 & Sep 29, 2026 (valuation talks per Bloomberg)');

  d.animate(s, head, { auto: true, effect: 'fade', dur: 700 });
  d.animate(s, [...pas], { auto: true, effect: 'rise', after: 150 });
  d.animate(s, [qm, q], { effect: 'fade', dur: 1500 });
  d.animate(s, [attr, ...hl], { auto: true, effect: 'fade', after: 300 });
  d.animate(s, [div, ...vid], { effect: 'fade' });
  d.animate(s, later, { effect: 'rise' });

  s.addNotes([
    'Close the economics section here. Everything we just saw — the trillion-dollar valuations, the $760B of capex, gigawatt campuses, reopened nuclear plants — is a bet on building something far more capable than us. And the man who now runs OpenAI said this, out loud, more than a decade ago.',
    'Click — pause, then read it slowly, word for word: “AI will probably most likely lead to the end of the world, but in the meantime, there’ll be great companies.” That is the exact wording in the original report: Business Insider, Matt Weinberger, “Head of Silicon Valley’s most important startup farm says we’re in a ‘mega bubble’ that won’t last”, published Jun 5, 2015 00:09 UTC (Thursday June 4 in the US), under the bold lead-in “On the growing artificial-intelligence market:”. NOTE: the popular short version (“AI will most likely lead to the end of the world…”) drops the word “probably” — every source we checked includes it.',
    'Context: Sam Altman was then president of Y Combinator, speaking in an onstage fireside chat with Airbnb’s Mike Curtis (BI calls him VP of engineering in the text, CTO in the photo caption) at Airbnb’s Open Air 2015 conference. OpenAI was announced six months later, in December 2015. Fuller spoken version (Stanford SIEPR, 2024; matches the video captions): “I think that AI will probably, most likely, sort of lead to the end of the world. But in the meantime, there will be great companies created with serious machine learning.” In the next breath he said he had just agreed to fund a company doing “AI Safety Research” (auto-captions; SIEPR says that company was OpenAI — that is SIEPR’s reading). Same talk (BI): “If I were Barack Obama, I would commit maybe $100 billion to R&D of AI safety initiatives.”',
    'He was not joking around in a vacuum: on Feb 25, 2015 his own blog said “Development of superhuman machine intelligence (SMI) [1] is probably the greatest threat to the continued existence of humanity.” The quote went viral again in 2026 (Tom’s Guide, Jan 8; TechRadar Pro “quote of the day”, Jun 15) — Tom’s Guide argues it lacks context, so present it as what he said, when, and where.',
    'Click — video: the talk’s recording, starting at 8:45 (the quote is at ~8:46–8:57). This is an unofficial YouTube re-upload of Airbnb’s video (“originally published July 31 2015” on Airbnb’s channel, which no longer hosts it); max 360p; needs internet.',
    'Click — the “great companies” part: TechCrunch, Mar 31, 2026 — OpenAI raised $122B at an $852B valuation; Sep 29, 2026 — reportedly in talks to raise $30B at ~$1.4T (per Bloomberg).',
    'URLs: https://www.businessinsider.com/sam-altman-y-combinator-talks-mega-bubble-nuclear-power-and-more-2015-6 · https://www.youtube.com/watch?v=d6lDZpvHAoo&t=525s · https://siepr.stanford.edu/news/what-point-do-we-decide-ais-risks-outweigh-its-promise · https://blog.samaltman.com/machine-intelligence-part-1 · https://www.techradar.com/pro/quote-of-the-day-by-sam-altman-ai-will-probably-most-likely-lead-to-the-end-of-the-world-but-in-the-meantime-therell-be-great-companies-the-dichotomy-between-grave-existential-risks-and-economic-nirvana · https://techcrunch.com/2026/03/31/openai-not-yet-public-raises-3b-from-retail-investors-in-monster-122b-fund-raise/ · https://techcrunch.com/2026/09/29/openai-reportedly-in-talks-to-raise-30b-round-at-1-4t-valuation/',
  ].join('\n\n'));
  return s;
}

async function build(d) {
  await prep();
  await marketSlide(d);
  await capexSlide(d);
  await gdpSlide(d);
  await scaleSlide(d);
  await abileneSlide(d);
  await gigawattSlide(d);
  await trainingSlide(d);
  await supplySlide(d);
  await nuclearSlide(d);
  await envSlide(d);
  await stakesSlide(d);
}

module.exports = { build };
