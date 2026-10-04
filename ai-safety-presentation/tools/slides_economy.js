// Section: THE ACCELERATION · economy ("AI dominates the economy" + "Information is physical").
// Sources: assets/research/economy/manifest.json (verified items/datasets/facts) + user originals image1-3.
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { HEX, W, MX, A } = require('./lib');

const R = (f) => A('research', 'economy', f);
const O = (f) => A('original', f);
const OUT = A('slides', 'economy');
const D = (f) => path.join(OUT, f);

// ---------- derived images (crops of verified screenshots; originals untouched) ----------
// Boxes are in source-pixel coordinates.
const CROPS = {
  'fortune_housing.png': ['fortune_datacenter_spending_exceeds_housing.png', { left: 77, top: 429, width: 2406, height: 851 }],
  'fortune_furman.png': ['fortune_furman_gdp_without_datacenters.png', { left: 77, top: 378, width: 2406, height: 857 }],
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
};

async function prep() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [dst, [src, box]] of Object.entries(CROPS)) {
    const out = D(dst);
    if (fs.existsSync(out) && fs.statSync(out).mtimeMs > fs.statSync(R(src)).mtimeMs && fs.statSync(out).mtimeMs > fs.statSync(__filename).mtimeMs) continue;
    let img = sharp(R(src)).extract(box);
    img = dst.endsWith('.jpg') ? img.jpeg({ quality: 90 }) : img.png();
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

// =====================================================================================
// 1. THE MARKET
async function marketSlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  kicker(s, 'THE ACCELERATION · ECONOMY 1');
  title(s, 'AI is swallowing the stock market');

  // hero: user's S&P share chart, with the headline clipping pinned above it
  const chart = await d.frame(s, O('image2.png'), { x: MX, y: 2.95, w: 6.5, h: 3.6 }, { pad: 0.06 });
  const head = await d.frame(s, O('image3.png'), { x: MX + 0.05, y: 1.74, w: 6.4, h: 0.98 }, { rot: -1.2, pad: 0.08 });

  // Nvidia market cap (native)
  const rx = 7.5, rw = W - MX - rx;
  const nvLab = label(d, s, 'NVIDIA MARKET VALUE (YEAR-END; 2026 = OCT 3)', rx, 1.72, rw);
  const nv = [17.73, 57.53, 117.26, 81.43, 144.0, 323.24, 735.27, 364.18, 1223, 3288, 4638, 5649].map(v => v / 1000);
  const nvBox = { x: rx - 0.12, y: 2.0, w: rw + 0.12, h: 2.5 }, nvL = { x: 0.1, y: 0.1, w: 0.88, h: 0.74 };
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
  const st1 = stat(d, s, { x: rx, y: 4.82, w: 2.45, value: '$852B', label: 'OpenAI’s valuation, Mar 2026 — reportedly in talks at ~$1.4T', color: d.S.txt, labelH: 0.62 });
  const st2 = stat(d, s, { x: rx + 2.7, y: 4.82, w: rw - 2.7, value: '$65B', label: 'Anthropic’s annualized revenue, Jul 2026 — up from $9B at end of 2025', color: d.S.txt, labelH: 0.62 });

  d.source(s, 'Sources: S&P 500 share chart — Mag 7 via historyofmarket.com, Kobeissi Letter, JPMorgan (definitions differ) · Nvidia: CompaniesMarketCap (2026 = Oct 3) · TechCrunch, Mar 31, Aug 17 & Sep 29, 2026');

  d.animate(s, chart, { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, head, { effect: 'slam', dur: 450 });
  d.animate(s, [nvLab, nvChart, nvNote, nvLine], { effect: 'wipeLeft', dur: 900 });
  d.animate(s, [divider, ...st1, ...st2], { effect: 'rise', stagger: 200 });

  s.addNotes([
    'The AI trade is now the stock market. The Magnificent 7 alone are about a third of the S&P 500; broader AI-linked baskets put it at 45% (Kobeissi, Apr 2026) or 50% (JPMorgan’s 28 “direct AI” stocks). The three series use different definitions, so they are not directly comparable — the point is the direction.',
    'Click 1 — the headline: “AI Swallows Wall Street: Stocks Hit Record 45% of S&P 500 Market Cap” (user-supplied headline image; outlet not recorded in our research manifest — matches the Kobeissi 45% figure in the chart).',
    'Click 2 — Nvidia: from about $18B at the end of 2015 to $5.65T on Oct 3, 2026 (CompaniesMarketCap). It became the first public company worth $5T on Oct 29, 2025; the Guardian noted that was more than the GDP of India, Japan or the UK (IMF). It has NOT reached $6T — don’t say it has. The chart shows year-end values, so the 2025 bar ($4.64T) sits below $5T: it crossed $5T in late October, then ended the year lower (dashed line = the $5T level).',
    'Click 3 — the labs: OpenAI raised $122B at an $852B valuation (TechCrunch, Mar 31, 2026) and is reportedly in talks to raise at ~$1.4T (TechCrunch citing Bloomberg, Sep 29, 2026 — talks, not closed). Anthropic’s annualized revenue run rate went from $9B at end-2025 to over $65B by end of July 2026 (TechCrunch citing Bloomberg, Aug 17, 2026); it also raised $65B at a $965B valuation in May 2026.',
    'URLs: https://companiesmarketcap.com/nvidia/marketcap/ · https://techcrunch.com/2025/10/29/nvidia-becomes-first-public-company-worth-5-trillion/ · https://www.theguardian.com/technology/2025/oct/29/nvidia-first-company-5-trillion · https://techcrunch.com/2026/03/31/openai-not-yet-public-raises-3b-from-retail-investors-in-monster-122b-fund-raise/ · https://techcrunch.com/2026/09/29/openai-reportedly-in-talks-to-raise-30b-round-at-1-4t-valuation/ · https://techcrunch.com/2026/08/17/anthropics-annualized-revenue-surges-to-65b/ · https://techcrunch.com/2026/05/28/anthropic-raises-65-billion-nears-1t-valuation-ahead-of-ipo/',
  ].join('\n\n'));
  return s;
}

// =====================================================================================
// 2. THE CAPEX BOOM
async function capexSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  kicker(s, 'THE ACCELERATION · ECONOMY 2');
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

  // Statista clipping + the user's construction chart (the larger of the two)
  const stc = await d.frame(s, R('statista_bigtech_capex_2026.jpeg'), { x: 6.45, y: 1.9, w: 2.6, h: 2.6 }, { rot: -2, pad: 0.05 });
  const con = await d.frame(s, O('image1.png'), { x: 9.45, y: 1.72, w: 3.28, h: 3.69 }, { rot: 1.5, pad: 0.05 });
  const conCap = d.text(s, 'Data-center construction keeps rising while all other private construction falls', { x: 9.45, y: 5.55, w: 3.28, h: 0.5, fontSize: 11, italic: true, color: d.S.muted, valign: 'top' });

  const st1 = stat(d, s, { x: 6.5, y: 4.75, w: 2.6, value: '+84%', label: 'Statista: $413B (2025) → up to $760B (2026); ~$950B projected for 2027 (Bloomberg)', valueSize: 36, labelH: 0.85 });

  d.source(s, 'Sources: 2022–25 bars: Epoch AI “broad capex” from SEC filings (company-report totals differ slightly) · Statista, Jul 31, 2026 (2026 = upper limit of guidance) · Fortune/Bloomberg, Jul 26, 2026 · Commerce Dept.');

  d.animate(s, [lab, ch], { auto: true, effect: 'wipeLeft', dur: 1000 });
  d.animate(s, stc, { effect: 'rise' });
  d.animate(s, st1, { effect: 'zoom', dur: 400 });
  d.animate(s, [...con, conCap], { effect: 'rise' });

  s.addNotes([
    'Four companies — Amazon, Microsoft, Alphabet, Meta — went from ~$155B of capex in 2022 to ~$409B in 2025, and their own guidance points to up to $760B in 2026 (Statista: “Big Tech’s AI Spending to Reach $760 Billion in 2026”, up 84% from $413B). Bloomberg’s projection is ~$724B for 2026 and nearly $950B for 2027.',
    'CAVEATS: 2026 bars are guidance (upper limits as of Jul 30, 2026; Microsoft outlook as of Apr 29), not actuals. 2022–25 are sums of Epoch AI’s quarterly “broad capex” series (calendar years), which differ slightly from Statista’s company-report totals (e.g. 2025: $409B in the chart vs $413B per Statista — the +84% callout uses Statista’s own numbers: 760/413). That is why the bars carry no per-year totals. Capex includes some non-AI spending, but the companies say the growth is driven by AI data centers. Oracle (not shown) adds ~$40B in 2025.',
    'Epoch AI: hyperscaler capex has grown ~72%/yr since Q2 2023 — quadrupling since GPT-4. Alphabet’s free cash flow turned negative in Q2 2026 for the first time since its 2004 IPO (Fortune/Bloomberg).',
    'Right chart (user-supplied, Commerce Dept. data): private construction relative to Dec 2023 — data centers up ~$50B annualized, everything else down ~$120B.',
    'URLs: https://www.statista.com/chart/35046/capital-expenditure-of-meta-alphabet-amazon-and-microsoft/ · https://epoch.ai/data-insights/hyperscaler-capex-trend · https://fortune.com/2026/07/26/big-tech-earnings-meta-microsoft-apple-amazon-market-revolt-ai-spending/',
  ].join('\n\n'));
  return s;
}

// =====================================================================================
// 3. AI IS THE ECONOMY
async function gdpSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  kicker(s, 'THE ACCELERATION · ECONOMY 3');
  title(s, 'AI investment is now propping up US growth');

  const c1 = await d.frame(s, D('fortune_housing.png'), { x: MX, y: 1.76, w: 6.25, h: 2.3 }, { rot: -1.2, pad: 0.06 });
  const c2 = await d.frame(s, D('fortune_furman.png'), { x: MX + 0.15, y: 4.2, w: 6.05, h: 2.3 }, { rot: 1.2, pad: 0.06 });

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

  const st1 = stat(d, s, { x: rx, y: 5.02, w: 2.55, value: '92%', label: 'of H1-2025 GDP growth came from information-processing investment', labelH: 0.62 });
  const st2 = stat(d, s, { x: rx + 2.8, y: 5.02, w: rw - 2.8, value: '~2×', label: 'computing’s share of GDP vs. the 2015–22 norm (1.5% vs ~0.7%)', labelH: 0.62 });

  d.source(s, 'Sources: Fortune, Sep 20, 2026 & Oct 7, 2025 (Jason Furman) · Epoch AI, “The AI boom has doubled computing infrastructure’s share of US GDP” (CC-BY; BEA via FRED, Census, SEC)');

  d.animate(s, c1, { auto: true, effect: 'rise' });
  d.animate(s, c2, { auto: true, effect: 'rise', after: 250 });
  d.animate(s, [lab, ch], { effect: 'wipeLeft', dur: 1100 });
  d.animate(s, st1, { effect: 'zoom', dur: 400 });
  d.animate(s, st2, { effect: 'zoom', dur: 400 });

  s.addNotes([
    'Two Fortune headlines. Sep 20, 2026: “U.S. economy hits pivotal milestone: Spending on data centers and other information-processing hardware now exceeds housing investment.” Quote from SF Fed’s Adam Shapiro: “investment is shifting away from residential investment and towards computers.” Oct 7, 2025: “Without data centers, GDP growth was 0.1% in the first half of 2025, Harvard economist says.”',
    'Jason Furman’s calculation: information-processing equipment & software was ~4% of GDP but accounted for 92% of GDP growth in H1 2025. Caveat: this is an accounting decomposition, not a counterfactual — without the boom, other spending might have been higher.',
    'Chart (Epoch AI, CC-BY): total computing-infrastructure investment hit ~1.49% of US GDP in Q1 2026 vs a 2015–22 trend of ~0.66%. Epoch attributes ~0.8% of GDP to AI-related data-center construction, compute hardware and networking (the gap above trend). “AI infrastructure is now the leading driver of growth in private investment in the US.”',
    'URLs: https://fortune.com/2026/09/20/us-economy-milestone-spending-data-centers-ai-boom-housing-residential-investment/ · https://fortune.com/2025/10/07/data-centers-gdp-growth-zero-first-half-2025-jason-furman-harvard-economist/ · https://epoch.ai/data-insights/ai-datacenter-share-gdp',
  ].join('\n\n'));
  return s;
}

// =====================================================================================
// 4. INFORMATION IS PHYSICAL — SCALE
async function scaleSlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  kicker(s, 'THE ACCELERATION · INFORMATION IS PHYSICAL 1');
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
  kicker(s, 'THE ACCELERATION · INFORMATION IS PHYSICAL 2');
  title(s, 'Stargate Abilene, 13 months apart');

  const box = { x: MX, y: 1.76, w: 8.1, h: 4.56 };
  const before = await d.frame(s, R('epoch_sat_stargate_abilene_2025-06.png'), box, { border: false });
  const g = before.geom;
  const t1 = tag(d, s, 'JUNE 2025', g.x + 0.15, g.y + 0.15, '1D222C');
  const after = await d.frame(s, R('epoch_sat_stargate_abilene_2026-07.png'), box, { border: false });
  const t2 = tag(d, s, 'JULY 2026', g.x + 0.15, g.y + 0.15, HEX.red);

  const rx = 9.05, rw = W - MX - rx;
  const st1 = stat(d, s, { x: rx, y: 1.72, w: rw, value: '2 → 8', valueSize: 36, color: d.S.txt, labelH: 0.45, label: 'buildings finished: June 2025 vs. July 2026' });
  const st2 = stat(d, s, { x: rx, y: 2.85, w: rw, value: '1.2 GW', valueSize: 36, labelH: 0.45, label: 'flagship campus for OpenAI & Oracle (Crusoe)' });
  const vid = await d.video(s, {
    link: 'https://www.youtube.com/watch?v=GhIJs4zbH0o', embed: 'https://www.youtube.com/embed/GhIJs4zbH0o',
    cover: R('yt_GhIJs4zbH0o.jpg'), box: { x: rx, y: 4.1, w: rw, h: 2.1 }, label: 'Inside OpenAI’s Stargate Megafactory (Bloomberg)',
  });

  d.source(s, 'Sources: Epoch AI, OpenAI Stargate Abilene (annotated satellite imagery © Airbus DS via Epoch AI) · Crusoe newsroom, Sep 30, 2025 · Bloomberg Originals, “The Circuit”');

  d.animate(s, [...before, ...t1], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, [...after, ...t2], { effect: 'fade', dur: 1600 });
  d.animate(s, st1, { auto: true, effect: 'rise', after: 200 });
  d.animate(s, st2, { effect: 'rise' });

  s.addNotes([
    'Same place, same scale, 13 months apart — Epoch AI’s annotated satellite views of the first Stargate site in Abilene, Texas (imagery © Airbus DS). June 2025: two buildings done, six under construction. Click — July 2026: all eight buildings complete, with cooling rows and substations.',
    'Crusoe (developer): flagship 1.2 GW campus built for Oracle/OpenAI; construction began June 2024. Epoch estimates for the site: ~509k H100-equivalents and 421 MW of IT power today (~$15.9B), projected 843 MW / $31.9B by Q4 2026. (1.2 GW is total campus power; IT power is lower — don’t conflate them.)',
    'Video (click the thumbnail to play): Bloomberg Originals, “Inside OpenAI’s Stargate Megafactory with Sam Altman | The Circuit” — Emily Chang and Sam Altman on the roof at Abilene. Title/channel verified via YouTube oEmbed; upload date not retrieved.',
    'URLs: https://epoch.ai/data/ai-data-centers/directory/openai-stargate-abilene · https://www.crusoe.ai/resources/newsroom/crusoe-announces-flagship-abilene-data-center-is-live · https://www.youtube.com/watch?v=GhIJs4zbH0o',
  ].join('\n\n'));
  return { s, vid };
}

// =====================================================================================
// 6. SUPPLY CAN'T KEEP UP
async function supplySlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  kicker(s, 'THE ACCELERATION · INFORMATION IS PHYSICAL 3');
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
  const c1 = await d.frame(s, D('guardian_ramageddon_head.png'), { x: rx, y: 1.74, w: rw, h: 1.58 }, { rot: -1.5, pad: 0.07 });
  const c2 = await d.frame(s, D('ars_ram.png'), { x: rx, y: 3.42, w: rw, h: 2.2 }, { rot: 1.2, pad: 0.05 });
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
// 7. THE ENVIRONMENTAL BILL
async function envSlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  kicker(s, 'THE ACCELERATION · INFORMATION IS PHYSICAL 4');
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

  const st1 = stat(d, s, { x: MX, y: 4.92, w: 2.1, value: '18.6¢', valueSize: 30, color: d.S.amber, labelSize: 12, labelH: 0.95,
    label: 'projected US home power price per kWh in 2027, up from 16.5¢ in 2024 (EIA)' });
  const st2 = stat(d, s, { x: MX + 2.4, y: 4.92, w: 2.1, value: '6.7–12%', valueSize: 30, color: d.S.amber, labelSize: 12, labelH: 0.95,
    label: 'of US electricity to data centers by 2028 (LBNL projection), vs 4.4% in 2023' });

  // wall of headlines: two staggered columns
  const w1 = await d.frame(s, D('guardian_xai_head.png'), { x: 5.45, y: 1.78, w: 3.6, h: 1.1 }, { rot: -1.5, pad: 0.07 });
  const w2 = await d.frame(s, D('guardian_thermal.png'), { x: 9.25, y: 1.98, w: 3.48, h: 1.85 }, { rot: 2, pad: 0.06 });
  const w3 = await d.frame(s, D('guardian_drought_head.png'), { x: 5.5, y: 3.28, w: 3.6, h: 1.1 }, { rot: 1.2, pad: 0.07 });
  const w4 = await d.frame(s, D('wired_gas.png'), { x: 9.2, y: 4.25, w: 3.53, h: 1.75 }, { rot: -1.5, pad: 0.06 });
  const w5 = await d.frame(s, R('nbc_datacenter_opposition_130b.png'), { x: 5.45, y: 4.8, w: 3.6, h: 1.32 }, { rot: -1, pad: 0.06 });

  d.source(s, 'Sources: IEA, Energy and AI (2025, CC BY 4.0) · LBNL (Dec 2024) · EIA STEO, Sep 2026 · The Guardian, Jan 15, Feb 13 & Jun 8, 2026 · WIRED, Jan 28, 2026 · NBC News, Jun 12, 2026');

  d.animate(s, [lab, ch, japan], { auto: true, effect: 'wipeLeft', dur: 1000 });
  d.animate(s, w1, { effect: 'slam', dur: 450 });
  // stagger whole clippings (frame + image together), not their individual parts
  const together = (groups, st) => groups.flatMap((g, i) => g.map(name => ({ name, delay: i * st })));
  d.animate(s, together([w2, w3], 200), { effect: 'rise' });
  d.animate(s, together([w4, w5], 200), { effect: 'rise' });
  d.animate(s, [...st1, ...st2], { effect: 'rise', stagger: 200 });

  s.addNotes([
    'Electricity: the IEA (Energy and AI, 2025, Base Case) puts data-center use at ~415 TWh in 2024 (~1.5% of world electricity), ~945 TWh by 2030 — slightly more than Japan’s total consumption today — and ~1,200 TWh by 2035. In the US, data centers are nearly half of electricity-demand growth to 2030. LBNL: US data centers used 4.4% of US electricity in 2023 (176 TWh), projected 6.7–12% by 2028. (IEA’s 2026 update was not accessible to us, so we use the 2025 report.)',
    'Pollution: Guardian, Jan 15, 2026 — “Elon Musk’s xAI datacenter generating extra electricity illegally, regulator rules” (dozens of methane gas turbines powering Colossus in Memphis). Guardian/Floodlight, Feb 13, 2026 — “‘A different set of rules’: thermal drone footage shows Musk’s AI power plant flouting clean air regulations” (turbines just across the line in Mississippi). WIRED, Jan 28, 2026 — gas projects explicitly linked to data centers up almost 25× in two years (Global Energy Monitor).',
    'Water: Guardian analysis, Jun 8, 2026 — about two-thirds of upcoming US datacenters are set to be built in places that have been among the driest in the country over the past year.',
    'Bills & backlash: EIA projects average US residential electricity at 18.6¢/kWh in 2027, up from 16.5¢ in 2024 (national averages; data centers are one driver among several — don’t claim they are the sole cause). NBC News: “Data center opponents have blocked or delayed projects worth nearly $130 billion in 2026, study finds” — Data Center Watch counted at least 75 projects in Q1 2026, the most on record, and 45 more worth $68B in Q2.',
    'URLs: https://iea.blob.core.windows.net/assets/de9dea13-b07d-42c5-a398-d1b3ae17d866/EnergyandAI.pdf · https://newscenter.lbl.gov/2025/01/15/berkeley-lab-report-evaluates-increase-in-electricity-demand-from-data-centers/ · https://www.theguardian.com/technology/2026/jan/15/elon-musk-xai-datacenter-memphis · https://www.theguardian.com/environment/2026/feb/13/elon-musk-xai-datacenters-air-pollution-mississippi · https://www.theguardian.com/us-news/2026/jun/08/datacenter-ai-drought-water · https://www.wired.com/story/data-centers-are-driving-a-us-gas-boom/ · https://www.eia.gov/outlooks/steo/report/elec_coal_renew.php · https://www.nbcnews.com/tech/tech-news/data-center-opposition-sharply-rising-2026-study-finds-rcna349728 · https://www.datacenterwatch.org/q2-2026',
  ].join('\n\n'));
  return s;
}

// =====================================================================================
// 8. THE STAKES — Altman quote (section closer)
async function stakesSlide(d) {
  const s = d.slide('Content', { transition: 'fadeBlack' });
  kicker(s, 'THE ACCELERATION · THE STAKES');
  title(s, 'The stakes, in Sam Altman’s own words');

  const clip = await d.frame(s, D('tc_openai_852b.png'), { x: MX, y: 1.9, w: 6.3, h: 3.25 }, { rot: -1.5, pad: 0.06 });
  const ctx = d.text(s, [
    { text: 'The money keeps coming. ', options: { bold: true, color: d.S.txt } },
    { text: 'OpenAI is reportedly in talks to raise at a ~$1.4 trillion valuation — yet Altman has ruled out a 2026 IPO to prioritize AI safety.', options: { color: d.S.muted } },
  ], { x: MX, y: 5.4, w: 6.3, h: 1.05, fontSize: 15, valign: 'top' });

  const qx = 7.35, qw = W - MX - qx;
  const qm = d.text(s, '“', { x: qx - 0.05, y: 1.7, w: 1.0, h: 1.0, fontSize: 110, bold: true, color: d.S.red, fontFace: 'Cambria', valign: 'top' });
  const q = d.text(s, 'I think it is unacceptable to be taking like a 10% chance of killing everybody by the end of the decade.',
    { x: qx, y: 2.55, w: qw, h: 2.6, fontSize: 31, italic: true, color: d.S.txt, fontFace: 'Cambria', valign: 'top', lineSpacingMultiple: 1.05 });
  const attr = d.text(s, [
    { text: '— Sam Altman', options: { bold: true, color: d.S.txt, breakLine: true } },
    { text: 'CEO of OpenAI, to Fortune, responding to safety researchers’ warnings of existential risk', options: { color: d.S.muted } },
  ], { x: qx, y: 5.3, w: qw, h: 0.85, fontSize: 14, valign: 'top' });

  d.source(s, 'Sources: TechCrunch, Sep 29, 2026 (quoting Altman’s interview with Fortune; valuation talks per Bloomberg) · TechCrunch, Mar 31, 2026');

  d.animate(s, clip, { auto: true, effect: 'fade', dur: 700 });
  d.animate(s, [ctx], { auto: true, effect: 'fade', after: 200 });
  d.animate(s, [qm, q], { effect: 'fade', dur: 1500 });
  d.animate(s, [attr], { auto: true, effect: 'fade', after: 300 });

  s.addNotes([
    'Close the economics section here. Everything we just saw — the trillion-dollar valuations, the $760B of capex, the gigawatt campuses — is a bet on building something far more capable than us.',
    'Click — pause, then read the quote slowly: “I think it is unacceptable to be taking like a 10% chance of killing everybody by the end of the decade.” Sam Altman, as reported by TechCrunch (Sep 29, 2026), which says he “recently told Fortune” this “in response to warnings from safety researchers about AI posing an existential risk to humanity.” Note: he is calling such a risk unacceptable — not stating his own probability estimate.',
    'Context on the left: TechCrunch, Mar 31, 2026 — “OpenAI, not yet public, raises $3B from retail investors in monster $122B fund raise” ($852B valuation). Sep 29, 2026: reportedly in talks to raise $30B at ~$1.4T (per Bloomberg); TechCrunch reports Altman ruled out a 2026 IPO to prioritize AI safety.',
    'URLs: https://techcrunch.com/2026/09/29/openai-reportedly-in-talks-to-raise-30b-round-at-1-4t-valuation/ · https://techcrunch.com/2026/03/31/openai-not-yet-public-raises-3b-from-retail-investors-in-monster-122b-fund-raise/',
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
  await supplySlide(d);
  await envSlide(d);
  await stakesSlide(d);
}

module.exports = { build };
