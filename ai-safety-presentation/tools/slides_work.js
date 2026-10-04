// THE ACCELERATION · work: engineering (CAD, PCB, chips), economically valuable labor (ALE, AutomationBench, RLI, GDPval),
// software jobs, academia, video and voice (Tavus Griffin, an Eleven v4 voice demo, RA-Bench quiz), robotics (VLA, humanoid factories, Unitree, Anthropic's "What work can robots do?").
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { execFileSync } = require('child_process');
const { HEX, W, MX, A, imgSize, fit } = require('./lib');
const { icon } = require('./icons');

const R = (f) => A('research', 'work', f);
const R2 = (f) => R(`rev2/${f}`);
const OUT = A('slides', 'work');
const MEDIA = path.join(OUT, 'media');
const CX0 = MX, CX1 = W - MX, CW = CX1 - CX0; // content x-range

// ---------- media helpers (outputs cached under assets/slides/work/media) ----------
const PAL = 'split[x][y];[x]palettegen=stats_mode=single[p];[y][p]paletteuse=new=1:dither=sierra2_4a';

// Smaller copy of a research GIF for a small tile: same frames and timing, only scaled (per-frame palettes).
function gifScaled(file, width) {
  const out = path.join(MEDIA, file.replace(/\.gif$/, `-${width}.gif`));
  if (fs.existsSync(out)) return out;
  fs.mkdirSync(MEDIA, { recursive: true });
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', R2(file), '-filter_complex', `scale=${width}:-2:flags=lanczos,${PAL}`, '-loop', '0', out]);
  execFileSync('gifsicle', ['-b', '-O3', out], { stdio: 'ignore' });
  return out;
}

// GIF trimmed (and scaled) from a research MP4: input range [ss, to) at fps/width, per-frame palettes. Trim/scale only.
function mp4Gif(file, name, { ss, to, width, fps }) {
  const out = path.join(MEDIA, name);
  if (fs.existsSync(out)) return out;
  fs.mkdirSync(MEDIA, { recursive: true });
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(ss), '-to', String(to), '-i', R2(file), '-filter_complex', `fps=${fps},scale=${width}:-2:flags=lanczos,${PAL}`, '-loop', '0', out]);
  execFileSync('gifsicle', ['-b', '-O3', out], { stdio: 'ignore' });
  return out;
}

// GIF montage from one research MP4: several [ss, to) excerpts, each cropped (16:9 rectangle `crop` = [w, h, x, y] in
// source px) and scaled to the same width, joined in the order given. Trim/crop/scale/concatenate only, no other edits.
function mp4Montage(file, name, segs, { width, fps }) {
  const out = path.join(MEDIA, name);
  if (fs.existsSync(out)) return out;
  fs.mkdirSync(MEDIA, { recursive: true });
  const h = Math.round(width * 9 / 16 / 2) * 2;
  const parts = segs.map(({ ss, to, crop: [cw, ch, cx, cy] }, i) =>
    `[0:v]trim=start=${ss}:end=${to},setpts=PTS-STARTPTS,crop=${cw}:${ch}:${cx}:${cy},scale=${width}:${h}:flags=lanczos,fps=${fps},setsar=1[v${i}]`);
  const fc = `${parts.join(';')};${segs.map((_, i) => `[v${i}]`).join('')}concat=n=${segs.length}:v=1:a=0,${PAL}`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', R2(file), '-filter_complex', fc, '-loop', '0', out]);
  execFileSync('gifsicle', ['-b', '-O3', out], { stdio: 'ignore' });
  return out;
}

// Quiz clip: the RA-Bench research MP4 as a looping GIF whose loop STARTS at source frame k (frames k…end, then 0…k−1),
// then resampled to `fps` and scaled to `width` (trim/scale/frame-rate only; per-frame palettes). Both clips of a pair
// use the same k and the same fps/width, so they get identical frame timing and stay in sync, and a static preview shows a
// mid-clip frame instead of the first frame both clips share. 15 fps / 720 px (question slide) and 12 fps / 480 px
// (reveal slide) keep each GIF at ~5–25 MB, so PowerPoint can hold six at once without stalling (24 fps / 960 px was 50–70 MB each).
function quizLoop(clip, width, k, fps) {
  const out = path.join(MEDIA, `${clip}-loop${width}-${fps}fps.gif`);
  if (fs.existsSync(out)) return out;
  fs.mkdirSync(MEDIA, { recursive: true });
  const fc = `[0:v]split[s1][s2];[s1]trim=start_frame=${k},setpts=PTS-STARTPTS[a];[s2]trim=end_frame=${k},setpts=PTS-STARTPTS[b];` +
    `[a][b]concat=n=2:v=1:a=0,fps=${fps},scale=${width}:-2:flags=lanczos,${PAL}`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', R2(`${clip}.mp4`), '-filter_complex', fc, '-loop', '0', out]);
  execFileSync('gifsicle', ['-b', '-O3', out], { stdio: 'ignore' });
  return out;
}

// Dark caption band over the top (or bottom) of a media tile: caps title line + optional one-line fact.
function band(d, s, g, title, sub, { pos = 'top', h = sub ? 0.5 : 0.3, color = 'FF8A8C' } = {}) {
  const y = pos === 'top' ? g.y : g.y + g.h - h;
  const b = d.name('band');
  s.addShape(d.pres.shapes.RECTANGLE, { x: g.x, y, w: g.w, h, fill: { color: '0A0C10', transparency: 22 }, line: { color: '0A0C10', width: 0, transparency: 100 }, objectName: b });
  const runs = [{ text: title, options: { fontSize: 10, bold: true, color, charSpacing: 1, breakLine: !!sub } }];
  if (sub) runs.push({ text: sub, options: { fontSize: 11, color: HEX.text } });
  const t = d.text(s, runs, { x: g.x + 0.12, y: y + 0.03, w: g.w - 0.2, h: h - 0.06, valign: 'middle' });
  return [b, t];
}

// Media tile: black cell (so letterboxed media read as one tile), the image/GIF fitted inside, and a caption band.
// o.clear: fit the image BELOW the top caption band instead of under it (for stills whose top edge carries content).
async function tile(d, s, file, box, title, sub, o = {}) {
  const bg = d.name('cell');
  s.addShape(d.pres.shapes.RECTANGLE, { ...box, fill: { color: '000000' }, line: { color: '000000', width: 0, transparency: 100 },
    shadow: { type: 'outer', color: '000000', blur: 12, offset: 3, angle: 90, opacity: 0.5 }, objectName: bg });
  const bh = (o.band && o.band.h) || (sub ? 0.5 : 0.3);
  const ibox = o.clear ? { x: box.x + 0.04, y: box.y + bh + 0.04, w: box.w - 0.08, h: box.h - bh - 0.08 } : box;
  const im = await d.frame(s, file, ibox, { border: false, shadow: false, pad: 0, ...o });
  const names = [bg, ...im];
  if (title) names.push(...band(d, s, box, title, sub, o.band || {}));
  names.geom = box;
  return names;
}

// Media tile with its caption ABOVE the clip (nothing drawn over the footage): caption block at y (capH tall), then the
// black cell + media of width w and height h below it. Returns names (caption first) with .geom = media box.
const CAP_H = 0.36, CAP_GAP = 0.04;
async function capTile(d, s, file, { x, y, w, h }, title, sub, { color = 'FF8A8C' } = {}) {
  const runs = [{ text: title, options: { fontSize: 10, bold: true, color, charSpacing: 1, breakLine: !!sub } }];
  if (sub) runs.push({ text: sub, options: { fontSize: 11, color: HEX.text } });
  const cap = d.text(s, runs, { x, y, w, h: CAP_H, valign: 'bottom' });
  const box = { x, y: y + CAP_H + CAP_GAP, w, h };
  const names = [cap, ...(await tile(d, s, file, box, null))];
  names.geom = box;
  return names;
}

// ---------- local helpers ----------
async function crop(file, name, { l, t, w, h }) {
  fs.mkdirSync(OUT, { recursive: true });
  const out = path.join(OUT, name);
  await sharp(R(file)).extract({ left: l, top: t, width: w, height: h }).toFile(out);
  return out;
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

// NeurIPS blog post: headline + the "178 submissions (18.4% …) will be desk rejected" bullet, stacked into one clipping.
// The bullet is re-wrapped onto two lines (verbatim text, split between words) so it stays legible at clipping size.
async function neuripsClip() {
  fs.mkdirSync(OUT, { recursive: true });
  const out = path.join(OUT, 'acad-neurips-position-clip.png');
  const src = R('acad-neurips-position-ai-papers.png');
  const k = 1.3; // bullet upscale
  const head = await sharp(src).extract({ left: 20, top: 258, width: 1630, height: 240 }).resize({ width: 960 }).png().toBuffer();
  const hm = await sharp(head).metadata();
  const b1 = await sharp(src).extract({ left: 10, top: 1530, width: 729, height: 62 }).resize({ width: Math.round(729 * k) }).png().toBuffer();
  const b2 = await sharp(src).extract({ left: 739, top: 1530, width: 351, height: 62 }).resize({ width: Math.round(351 * k) }).png().toBuffer();
  const b1m = await sharp(b1).metadata(), b2m = await sharp(b2).metadata();
  const Wd = 1100, pad = 44, gap = 40, lead = 10;
  const bx = Math.round((Wd - b1m.width) / 2);
  const by = pad + hm.height + gap;
  const Hd = by + b1m.height + lead + b2m.height + pad - 6;
  const rule = await sharp({ create: { width: Wd - 120, height: 3, channels: 3, background: '#E3E5E8' } }).png().toBuffer();
  await sharp({ create: { width: Wd, height: Hd, channels: 3, background: '#FFFFFF' } })
    .composite([
      { input: head, left: Math.round((Wd - hm.width) / 2), top: pad },
      { input: rule, left: 60, top: pad + hm.height + Math.round(gap / 2) - 1 },
      { input: b1, left: bx, top: by },
      { input: b2, left: bx + Math.round((62 - 10) * k), top: by + b1m.height + lead },
    ]).png().toFile(out);
  return out;
}

// π0 Fig. 3 without the camera-photo row: rectangular crop to y=478 (keeps the q_t / noise labels on the right),
// then the top sliver of the photos (left of x=620, below y=442) is painted white, as is the orphaned arrow stub
// at the far-left edge (crop px 0–13, y≈237; its source line was cropped away) that pointed into the VLM box.
async function pi0Crop() {
  fs.mkdirSync(OUT, { recursive: true });
  const out = path.join(OUT, 'vla-pi0-fig3-blocks.png');
  const base = await sharp(R('vla-pi0-overview-fig3.png')).extract({ left: 372, top: 0, width: 1282, height: 478 }).png().toBuffer();
  const white = await sharp({ create: { width: 620, height: 36, channels: 3, background: '#FFFFFF' } }).png().toBuffer();
  const stub = await sharp({ create: { width: 14, height: 16, channels: 3, background: '#FFFFFF' } }).png().toBuffer();
  await sharp(base).composite([{ input: white, left: 0, top: 442 }, { input: stub, left: 0, top: 230 }]).png().toFile(out);
  return out;
}

// ========== 1. Engineering: CAD Bench ==========
async function cadSlide(d) {
  const s = d.slide('Content');
  head(s, 'THE ACCELERATION · ENGINEERING', 'AI agents are learning real engineering design');

  const lb = await crop('cadbench-v3-leaderboard.png', 'cad-leaderboard-top5.png', { l: 0, t: 0, w: 1820, h: 562 });
  const shot = await frameW(d, s, lb, CX0, 1.8, 7.35);
  const shotBottom = 1.8 + await hFor(lb, 7.35);

  // three stats under the leaderboard
  const sy = shotBottom + 0.5, sw = 2.25, sg = 0.3;
  const st1 = stat(d, s, { x: CX0, y: sy, w: sw, value: '61 / 100', valueSize: 44, labelSize: 14, labelH: 0.95, label: 'Best overall score on 100 FreeCAD design tasks (failures score zero)' });
  const st2 = stat(d, s, { x: CX0 + sw + sg, y: sy, w: sw, value: '84.66', valueSize: 44, labelSize: 14, labelH: 0.95, label: 'Opus 5.5 on image-to-CAD (0–100): drawing → parametric 3-D model' });
  const st3 = stat(d, s, { x: CX0 + 2 * (sw + sg), y: sy, w: sw, value: '+22 pts', valueSize: 44, labelSize: 14, labelH: 0.95, label: 'Jump on that task in one model update (Opus 5 → Opus 5.5)' });

  // native chart: overall scores, all entries (top on top)
  const ds = {
    labels: ['Claude Opus 5.5 (Claude Code)', 'Claude Opus 5.5 (mini-swe-agent)', 'GPT-6 Astra (Codex)', 'Claude Fable 5.1 (Claude Code)', 'Claude Opus 5 (Claude Code)', 'Gemini 3.8 Flash (mini-swe-agent)', 'Grok 4.7 (Grok Build)', 'GPT-5.6 Sol (Codex)', 'Grok 4.6 (Grok Build)', 'Gemini 3.8 Flash (Antigravity)', 'Kimi K3 (mini-swe-agent)', 'Muse Spark 1.3 (mini-swe-agent)', 'GPT-5.6 Terra (Codex)'],
    values: [61.03, 57.96, 56.87, 56.75, 50.86, 36.19, 34.82, 29.98, 27.72, 27.56, 24.92, 20.92, 17.24],
  };
  const cx = 8.35, cw = CX1 - cx;
  const lab = capLabel(d, s, 'OVERALL SCORE · CAD BENCH V3 (0–100)', { x: cx, y: 1.72, w: cw });
  const colors = ds.values.map((v, i) => (i < 4 ? HEX.red : i === 4 ? HEX.amber : HEX.steel)).reverse();
  const ch = d.chart(s, 'bar', [{ name: 'Overall', labels: [...ds.labels].reverse(), values: [...ds.values].reverse() }],
    { x: cx - 0.1, y: 2.0, w: cw + 0.1, h: 4.0 }, {
      barDir: 'bar', chartColors: colors, showValue: true, dataLabelFormatCode: '0.0', dataLabelPosition: 'outEnd', dataLabelFontSize: 10,
      valAxisHidden: true, valGridLine: { style: 'none' }, valAxisMaxVal: 68, valAxisMinVal: 0, catAxisLabelFontSize: 10, barGapWidthPct: 35,
      catAxisLineShow: false,
    });
  const key = d.text(s, [
    { text: 'Red', options: { bold: true, color: d.S.red } },
    { text: ': top four — their confidence intervals overlap (benchmark authors’ note). ', options: { color: d.S.muted } },
    { text: 'Amber', options: { bold: true, color: d.S.amber } },
    { text: ': Opus 5, the previous model.', options: { color: d.S.muted } },
  ], { x: cx, y: 6.08, w: cw, h: 0.42, fontSize: 11, valign: 'top' });

  d.animate(s, shot, { auto: true, effect: 'rise', dur: 600 });
  d.animate(s, [lab, ch, { name: key, effect: 'fade', delay: 700, dur: 500 }], { auto: true, effect: 'wipeLeft', dur: 900, after: 150 });
  d.animate(s, [...st1, ...st2, ...st3], { effect: 'rise', stagger: 0, dur: 450 });
  // stagger the three stats as one click
  const g = d.anim[s._num].groups[2].effects;
  g.forEach((e, i) => { e.delay = Math.floor(i / 2) * 300; });

  d.source(s, 'Sources: Parametric CAD Bench V3 leaderboard, cadbench.ai (gNucleus.ai), snapshot Sep 24, 2026 · CAD Bench V3 release note “Claude Opus 5.5 Takes the Lead” (Sep 24, 2026).');
  s.addNotes([
    'CAD — computer-aided design — is the core tool of mechanical engineering. Parametric CAD Bench V3 is 100 complex FreeCAD tasks: 30 create-from-text, 30 create-and-edit, 40 create-from-an-engineering-drawing. Failures count as zero.',
    'Claude Opus 5.5 running in Claude Code is #1 at 61.03 overall; GPT-6 Astra (Codex) 56.87; Claude Fable 5.1 56.75. All scores are mean rewards on a 0–100 scale, so the best agent is still far from perfect. On image-to-CAD — turning an engineering drawing into a parametric model — Opus 5.5 scores 84.66, up from 62.64 for Opus 5 (+22.02 points) in one release, with cost down 43%.',
    'On the older V1 suite, the best score rose from 0.832 (May) to 0.906 (Aug 2026) in 91 days — Opus 5 was the first result to break 0.9.',
    'Caveats: the benchmark authors note that the confidence intervals of the top four rows overlap. An independent academic benchmark (CADBench, MIT, arXiv 2605.10873, May 2026) is more cautious: methods "remain far from reliable CAD program reconstruction", especially on high-complexity parts.',
    'URLs: https://cadbench.ai/ · https://cadbench.ai/cad-bench/news/cad-bench-v3-opus-5-5 · https://arxiv.org/abs/2605.10873',
  ].join('\n\n'));
  return s;
}

// ========== 1b. Engineering: AI designs CAD parts, molds and PCBs (GIF wall) + EEBench ==========
async function hwDesignSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'THE ACCELERATION · ENGINEERING · 2', 'AI agents now design circuit boards and parts');

  // left: 2×2 wall of real demo media (GIFs play in slideshow)
  const gw = 7.55, gap = 0.2, tw = (gw - gap) / 2, th = tw * 9 / 16, gy = 1.8;
  // Autodesk's official demo, re-cut so each clip shows the agent's chat (the typed request, zoomed in on the chat box)
  // and the result in Fusion. The CAD loop starts on the finished request (a populated chat panel); the CAM loop is
  // rotated to start on the toolpaths (its chat crop is mostly empty panel), so a static preview/PDF shows real content.
  const FUS = 'cad-autodesk-mcp-enclosure-mold-cam.mp4';
  const chat1 = [1200, 675, 256, 260], cad = [1440, 810, 240, 120];       // request 1 · Fusion design view
  const chat3 = [960, 540, 40, 530], cam = [1280, 720, 430, 200], sim = [1020, 574, 480, 196]; // request 3 · CAM viewer · simulation
  const fusionCad = mp4Montage(FUS, 'cad-fusion-prompt-enclosure.gif', [
    { ss: 8.4, to: 8.95, crop: chat1 }, { ss: 40.65, to: 43.4, crop: cad }, { ss: 4.5, to: 8.4, crop: chat1 },
  ], { width: 960, fps: 15 });
  const fusionCam = mp4Montage(FUS, 'cad-fusion-prompt-toolpaths-camfirst.gif', [
    { ss: 74.4, to: 76.7, crop: cam }, { ss: 80.4, to: 85.1, crop: sim }, { ss: 61.6, to: 64.2, crop: chat3 },
  ], { width: 960, fps: 15 });
  const cells = [
    [fusionCad, 'CAD · AUTODESK FUSION + CLAUDE OPUS 4.8', 'One chat request → a molded Raspberry Pi case'],
    [fusionCam, 'CAM · SAME AGENT, LATER REQUEST', '…then CNC toolpaths to machine the mold plates'],
    [R2('pcb-astra-kicad-hackaday.jpg'), 'PCB · GPT-6 ASTRA IN KICAD · STILL', 'OpenAI demo: layout mid-placement, plus 3D render', { clear: true }],
    [R2('pcb-quilter-speedrun-board-360.gif'), 'PCB · QUILTER “PROJECT SPEEDRUN”', '843-part Linux computer — booted on first power-up'],
  ];
  const tiles = [];
  for (let i = 0; i < 4; i++) {
    const [f, t, sub, o] = cells[i];
    const box = { x: CX0 + (i % 2) * (tw + gap), y: gy + Math.floor(i / 2) * (th + gap), w: tw, h: th };
    tiles.push(await tile(d, s, f, box, t, sub, o));
  }
  const gridBottom = gy + 2 * th + gap;

  // right: EEBench (simulation-graded circuit design) — best configuration per model
  const rx = 8.5, rw = CX1 - rx;
  const lab = capLabel(d, s, 'EEBENCH CIRCUIT DESIGN · TOP 8 MODELS, BEST SETTING', { x: rx, y: 1.72, w: rw, charSpacing: 1 });
  // the true top 8 models on the Sep 29, 2026 leaderboard (best configuration per model; next: GPT-6 Sol 56.3, Gemini 3.8 Flash 55.4)
  const rows = [['Claude Opus 5.5', 75.0], ['GPT-6 Astra', 69.3], ['Claude Sonnet 5.5', 67.2], ['Grok 4.7', 64.0], ['GPT-6.1 Sol', 63.6], ['Claude Opus 5', 61.6], ['Grok 4.6', 57.1], ['Claude Fable 5.1', 56.4]];
  const ch = d.chart(s, 'bar', [{ name: 'Score', labels: rows.map(r => r[0]).reverse(), values: rows.map(r => r[1]).reverse() }],
    { x: rx - 0.1, y: 1.98, w: rw + 0.1, h: 2.5 }, {
      barDir: 'bar', chartColors: rows.map((r, i) => (i === 0 ? HEX.red : HEX.steel)).reverse(), showValue: true, dataLabelFormatCode: '0.0',
      dataLabelPosition: 'outEnd', dataLabelFontSize: 11, valAxisHidden: true, valGridLine: { style: 'none' }, valAxisMinVal: 0, valAxisMaxVal: 88,
      catAxisLabelFontSize: 11, catAxisLineShow: false, barGapWidthPct: 40,
    });
  const st = stat(d, s, { x: rx, y: 4.5, w: rw, value: '61.6 → 75.0', valueSize: 32, labelSize: 14, labelH: 0.95,
    label: 'Top score, Sep 1 vs Sep 29, 2026. 13 held-out tasks graded by circuit simulation: “No human graders. No LLM-as-judge.” Run by atopile, a PCB-tool maker.' });
  const chips = d.text(s, [
    { text: 'Chips too: ', options: { bold: true, color: d.S.amber } },
    { text: 'the best agent fixes 70.7% of 417 real chip-design bugs (HWE-Bench).', options: { color: d.S.txt } },
  ], { x: rx, y: 6.02, w: rw, h: 0.5, fontSize: 14, valign: 'top' });
  const cap = d.text(s, 'GIFs play in the slideshow; the OpenAI tile is a still. Company demos: Autodesk, OpenAI, Quilter.', { x: CX0, y: gridBottom + 0.1, w: gw, h: 0.26, fontSize: 11, italic: true, color: d.S.steel, valign: 'top' });

  tiles.forEach((t, i) => d.animate(s, t, { auto: true, effect: 'fade', dur: 450, after: i ? 120 : 0 }));
  d.animate(s, [lab, ch, cap], { auto: true, effect: 'wipeLeft', dur: 900, after: 150 });
  d.animate(s, [...st], { effect: 'rise', dur: 450 });
  d.animate(s, [chips], { auto: true, effect: 'fade', after: 300 });

  d.source(s, 'Sources: Autodesk Fusion blog & demos (Sep 15, 2026) · OpenAI demo still via Hackaday (Sep 5, 2026) · Quilter (Dec 2025) · EEBench (atopile, Sep 29, 2026) · HWE-Bench (arXiv 2604.14709).');
  s.addNotes([
    'Four real demos of AI doing hardware design. Top row (Autodesk’s official demo of its new Fusion Compute MCP, Sep 15, 2026): an agent — the model selector in the video reads “Opus 4.8 High” (Claude) — is asked to design a two-part injection-molded enclosure for a Raspberry Pi 4; it builds the parametric case, then a family mold with core and cavity, then programs the CNC toolpaths. Autodesk: “That is a design-to-manufacturing chain that normally requires several people over several days, now driven end to end from a chat window.” (Autodesk’s own demo.)',
    'How the two GIFs were cut (trim, crop and scale only; nothing else changed): top-left = the request being typed in the chat, zoomed in on the chat box (video 0:04.5–0:08.95; it reads verbatim “Start Fusion and design a two-part injection molded enclousore for a Raspberry Pi4.” — typo in the original), then the finished case with the Raspberry Pi board in Fusion (0:40.6–0:43.4). Top-right = the CAM toolpaths on the mold plates (1:14.4–1:16.7) and Fusion’s machining simulation of the cavity plate (1:20.4–1:25.1), then the request that produced them, typed later in the same chat: “Create a setup and toolpaths to machine both parts” (1:01.6–1:04.2); the loop starts on the toolpaths so the still/PDF view is not an empty chat panel. The mold itself came from an earlier request in the video: “Create a core and a cavity to mold both parts at the same time. I’ll want a center injection to inject both parts at once.” Autodesk’s caption overlays (“Co-Design with your AI Agent” etc.) are part of the original video.',
    'Bottom left (a still, not a clip): image from OpenAI’s GPT-6 Astra launch demo (via Hackaday) — on the left the KiCad board mid-placement, footprints still outside the outline and connections shown as unrouted ratsnest lines; on the right a 3D render of the board. OpenAI’s caption for the video: “a 15-second condensed playback of GPT-6 Astra performing printed circuit board (PCB) layout in KiCad, turning an electronic schematic into a manufacturable PCB by placing components and routing copper connections” (a 2 min 54 s run). The clip itself could not be downloaded (Cloudflare/Vimeo), so this is the still. JLCPCB independently had Astra design a 44 × 34 mm amplifier board from a four-line brief: 0 ERC / 0 DRC violations under the configured rules (caveat: some rule categories were ignored, and a clean DRC is not a manufacturability check). Hackaday’s verdict was skeptical: “there is still a long way to go before hardware engineers can receive their pink slips.”',
    'Bottom right: Quilter “Project Speedrun” — an 843-component, 8-layer, dual-board Linux computer laid out with Quilter’s physics-driven AI (not an LLM); it booted on first power-up. 38.5 hours of human work vs 428 hours quoted for manual layout (Quilter’s own figures; the clip is a marketing render of the real design).',
    'Right: EEBench — 13 original, held-out electrical-engineering design tasks; each design is built and simulated (SPICE at worst-case tolerance corners): “No human graders. No LLM-as-judge.” Score = 0.65 × technical + 0.35 × cost-efficiency. Leaderboard Sep 29, 2026 — the chart shows the top 8 models, best configuration per model: Claude Opus 5.5 [xhigh] 75.0 ±8.3, GPT-6 Astra 69.3 ±10.7, Claude Sonnet 5.5 67.2, Grok 4.7 64.0, GPT-6.1 Sol 63.6, Claude Opus 5 61.6, Grok 4.6 57.1, Claude Fable 5.1 56.4 (next: GPT-6 Sol 56.3, Gemini 3.8 Flash 55.4, Claude Fable 5 54.3, Claude Opus 4.8 51.4). The top score on Sep 1 was 61.6 (Claude Opus 5). CAVEATS: built and funded by atopile, a company that sells PCB design tools; wide error bars; PCB layout is out of scope in V1. xAI now reports EEBench in its model cards (Grok 4.6) and launch posts (Grok 4.7: 64.0%).',
    'Chips: HWE-Bench (arXiv, Apr 2026) — 417 real bug fixes from open-source chip repositories (OpenTitan, CVA6, XiangShan…): the best agent (GPT-5.4) resolves 70.7%, >90% on small cores, <65% on SoC-level projects (spring-2026 models). Analog Design Bench (arXiv, Sep 27, 2026): full-spec pass rates from 8% to 78% on 50 transistor-level tasks in two-hour attempts (best: Claude Fable 5).',
    'Safety angle (say it): xAI’s Grok 4.6 model card, section “Engineering acceleration”: “agents that accelerate rocket design, IC layout, and datacenter power-and-cooling optimization compress the timelines of progress across the physical systems that enable further advances in AI capabilities and utility.” AI is starting to design the hardware that makes better AI.',
    'URLs: https://www.autodesk.com/products/fusion-360/blog/fusion-compute-mcp/ · https://hackaday.com/2026/09/05/can-ai-now-design-pcbs-that-just-work/ · https://jlcpcb.com/blog/gpt-6-astra-pcb-design-in-kicad · https://www.quilter.ai/project-speedrun · https://www.eebench.org/ · https://www.eebench.org/methodology.html · https://www.eebench.org/blog/can-ai-design-circuit-boards-yet/ · https://arxiv.org/abs/2604.14709 · https://arxiv.org/abs/2609.33356v1 · https://media.x.ai/v1/website/card-4p6-4cd2dc57.pdf · https://x.ai/news/grok-4-7',
  ].join('\n\n'));
  return s;
}

// ========== 1c. Engineering: how hard (and valuable) these jobs are ==========
async function hwJobsSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'THE ACCELERATION · ENGINEERING · 3', 'Hardware design is slow, costly and well paid');

  // column A: pay (BLS) + training
  const ax = CX0, aw = 3.95;
  const l1 = capLabel(d, s, 'MEDIAN US PAY, MAY 2025 (BLS)', { x: ax, y: 1.72, w: aw });
  const pay = [['All US workers', 50980], ['Mechanical engineers', 104110], ['Electrical & electronics', 125040], ['Computer hardware', 161740]];
  const ch = d.chart(s, 'bar', [{ name: 'Median pay', labels: pay.map(p => p[0]).reverse(), values: pay.map(p => p[1]).reverse() }],
    { x: ax - 0.1, y: 1.98, w: aw + 0.1, h: 2.45 }, {
      barDir: 'bar', chartColors: [HEX.steel, HEX.red, HEX.red, HEX.red].reverse(), showValue: true, dataLabelFormatCode: '$#,##0',
      dataLabelPosition: 'outEnd', dataLabelFontSize: 12, dataLabelFontBold: true, valAxisHidden: true, valGridLine: { style: 'none' },
      valAxisMinVal: 0, valAxisMaxVal: 235000, catAxisLabelFontSize: 11, catAxisLineShow: false, barGapWidthPct: 45,
    });
  const l2 = capLabel(d, s, 'TRAINING', { x: ax, y: 4.6, w: aw });
  const tr = d.text(s, [
    { text: 'A bachelor’s degree just to start. ', options: { bold: true, color: d.S.txt } },
    { text: 'A Professional Engineer license adds two exams and typically at least 4 years of work experience.', options: { color: d.S.muted } },
  ], { x: ax, y: 4.9, w: aw, h: 1.5, fontSize: 14, valign: 'top' });

  // column B: time and money per design
  const bx = 4.95, bw = 3.95;
  const l3 = capLabel(d, s, 'TIME AND MONEY PER DESIGN', { x: bx, y: 1.72, w: bw });
  const facts = [
    ['$725M', 'to design one leading-edge 2 nm chip — vs $249M at 7 nm (IBS estimates)'],
    ['18–24 months', 'OpenAI’s old baseline for a chip like Jalapeño; with Codex: ~9 months'],
    ['2.9 respins', 'average PCB redesigns before production — each ≈2 weeks, >$28K in materials'],
    ['428 hours', 'quoted for manual layout of an 843-part board; with Quilter’s AI: 38.5 hours'],
  ];
  const fr = [];
  facts.forEach(([v, t], i) => {
    const y = 2.02 + i * 1.11;
    fr.push([
      d.text(s, v, { x: bx, y, w: bw, h: 0.44, fontSize: 26, bold: true, color: i % 2 ? d.S.amber : d.S.red, fontFace: 'Arial', valign: 'bottom' }),
      d.text(s, t, { x: bx, y: y + 0.45, w: bw, h: 0.62, fontSize: 14, color: d.S.muted, valign: 'top' }),
    ]);
  });

  // column C: Tom's Hardware headline (Jalapeño) + Richard Ho quote
  const cx = 9.25, cw = CX1 - cx;
  const toms = await crop('rev2/chip-tomshardware-jalapeno-ho-interview.png', 'hw-toms-jalapeno.png', { l: 0, t: 0, w: 1260, h: 905 });
  const c1 = await frameW(d, s, toms, cx + 0.08, 1.86, cw - 0.16, { rot: 1.5 });
  const cBottom = 1.86 + await hFor(toms, cw - 0.16);
  const q = d.text(s, [
    { text: '“We didn’t replace our engineers; they just became super productive. With a smaller team …”', options: { italic: true, fontFace: 'Cambria', fontSize: 15, color: d.S.txt, breakLine: true } },
    { text: '— Richard Ho, OpenAI head of hardware', options: { fontSize: 11, color: d.S.muted } },
  ], { x: cx, y: cBottom + 0.3, w: cw, h: 6.5 - cBottom - 0.3, valign: 'top' });

  d.animate(s, [l1, ch], { auto: true, effect: 'wipeLeft', dur: 900 });
  d.animate(s, [l2, tr], { auto: true, effect: 'fade', after: 100 });
  d.animate(s, [l3, ...fr[0]], { effect: 'rise', dur: 400 });
  fr.slice(1).forEach(f => d.animate(s, f, { auto: true, effect: 'rise', dur: 400, after: 150 }));
  d.animate(s, c1, { effect: 'slam', dur: 350 });
  d.animate(s, [q], { auto: true, effect: 'fade', after: 250 });

  d.source(s, 'Sources: BLS Occupational Outlook Handbook (May 2025 pay) · Arm IPO prospectus (2023) citing IBS · Tom’s Hardware (Sep 30, 2026) · Siemens EDA blog citing Lifecycle Insights (Jun 2026) · Quilter (vendor figures).');
  s.addNotes([
    'Why this matters economically: these are some of the best-paid, longest-trained jobs in the economy, and each design takes months and costs a fortune — exactly the work the previous slides showed AI starting to do.',
    'Pay (BLS, May 2025 medians): computer hardware engineers $161,740; electrical & electronics engineers $125,040; mechanical engineers $104,110 — vs $50,980 for all US workers. Jobs (2025): ~298,000 electrical & electronics engineers, ~298,500 mechanical engineers, ~76,100 computer hardware engineers.',
    'Training (BLS): all three typically need a bachelor’s degree to enter; a Professional Engineer (PE) license additionally requires passing the Fundamentals of Engineering (FE) exam, relevant work experience (“typically at least 4 years”), and the PE exam.',
    'Cost and cycle time: designing a leading-edge chip costs “approximately $249 million for a 7nm chip and approximately $725 million for a 2nm chip” (IBS, cited in Arm’s 2023 IPO prospectus). OpenAI’s Jalapeño inference ASIC went from RTL to tapeout in about nine months using Codex; Richard Ho: “In the old baseline, you’re talking 18 months to two years, roughly.” PCBs: designs average 2.9 respins before volume production, “with each rework cycle adding roughly two weeks and more than $28K in material costs alone” (Lifecycle Insights study, via a Siemens blog — vendor-adjacent). Quilter Project Speedrun: 428 hours quoted for manual layout vs 38.5 hours of human work with Quilter (vendor figures). Synopsys benchmarks its spec-to-verified-RTL agent against “a four- to six-month team effort”; Cadence claims its agents cut “a typical five-week verification loop to less than a day” — vendor-measured, not independently verified (Tom’s Hardware).',
    'Richard Ho (Tom’s Hardware, Sep 30, 2026), full quote: “This is how AI should be used. We didn’t replace our engineers; they just became super productive. With a smaller team of really good engineers with a lot of this AI stuff, you could do things faster and better than you could otherwise.” Note the “smaller team”.',
    'Further (say if time): Architect Labs (startup, Aug 27, 2026) claims its AI generated “100% of the RTL” and verification for an AI accelerator from a spec by two human architects in under two weeks (its own chart spans 22 days; FPGA prototype only, not taped out) and calls it “one of the earliest demonstrations of recursive self-improvement” — a company claim.',
    'URLs: https://www.bls.gov/ooh/architecture-and-engineering/computer-hardware-engineers.htm · https://www.bls.gov/ooh/architecture-and-engineering/electrical-and-electronics-engineers.htm · https://www.bls.gov/ooh/architecture-and-engineering/mechanical-engineers.htm · https://www.sec.gov/Archives/edgar/data/1973239/000119312523235320/d550931d424b4.htm · https://www.tomshardware.com/tech-industry/asics/this-is-how-ai-should-be-used-openai-head-of-hardware-breaks-down-the-ai-assisted-design-of-its-jalapeno-asic · https://blogs.sw.siemens.com/electronic-systems-design/2026/06/25/design-today-reuse-tomorrow-mastering-ip-management-for-electronics-teams/ · https://www.quilter.ai/project-speedrun · https://www.tomshardware.com/tech-industry/semiconductors/the-state-of-agentic-ai-in-chip-design-tools-in-2026-cadence-synopsys-and-siemens-all-pitch-autonomous-engineers · https://architectlabs.com/blog/redwood',
  ].join('\n\n'));
  return s;
}

// ========== 1d. Labor: Agents' Last Exam ==========
async function aleSlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  head(s, 'THE ACCELERATION · LABOR', 'Agents’ Last Exam: 0% to 16% in four months');

  // left: official homepage (title + tagline) and the official video's wall of agents at work
  const lw = 6.15;
  const hero = await crop('rev2/labor-ale-homepage-hero.png', 'labor-ale-hero-head.png', { l: 640, t: 125, w: 1520, h: 280 });
  const c1 = await frameW(d, s, hero, CX0, 1.82, lw);
  const gy = 1.82 + await hFor(hero, lw) + 0.24;
  const gh = 6.5 - gy - 0.32, gwid = gh * 16 / 9;
  const aleGif = mp4Gif('labor-ale-intro.mp4', 'labor-ale-agents-70s.gif', { ss: 70.5, to: 75.2, width: 960, fps: 15 });
  const gif = await tile(d, s, aleGif, { x: CX0, y: gy, w: gwid, h: gh }, null);
  const gcap = d.text(s, [
    { text: '►  ', options: { color: d.S.red, bold: true } },
    { text: 'Official ALE video: agents at work in real professional software', options: { color: d.S.muted } },
  ], { x: CX0, y: gy + gh + 0.05, w: lw, h: 0.26, fontSize: 10, valign: 'top' });

  // right: hardest tier — launch agents still at 0%, today's at up to 15.8% (same 38 tasks)
  const rx = 7.15, rw = CX1 - rx;
  const lab = capLabel(d, s, 'HARDEST “LAST-EXAM” TIER · SAME 38 TASKS · PASS RATE', { x: rx, y: 1.72, w: rw, charSpacing: 1 });
  // all eight agents the leaderboard lists on this split; the June launch configurations ran at default effort,
  // and the same Fable 5 at XHigh effort now passes 7.9% — so part of the jump is effort/harness, not only newer models
  const rows = [
    ['Claude Opus 5.5 (Max)', 15.8, HEX.red], ['Claude Opus 5 (Max)', 13.2, HEX.red], ['GPT-6 Sol (Medium)', 13.2, HEX.red], ['GPT-6 Astra (High)', 10.5, HEX.red],
    ['Claude Fable 5 (XHigh effort)', 7.9, HEX.amber],
    ['GPT-5.5 (default) · June launch', 0, HEX.steel], ['Claude Fable 5 (default) · June launch', 0, HEX.steel], ['Composer 2.5 (Cursor) · June launch', 0, HEX.steel],
  ];
  const ch = d.chart(s, 'bar', [{ name: 'Pass rate', labels: rows.map(r => r[0]).reverse(), values: rows.map(r => r[1]).reverse() }],
    { x: rx - 0.1, y: 1.98, w: rw + 0.1, h: 2.38 }, {
      barDir: 'bar', chartColors: rows.map(r => r[2]).reverse(), showValue: true, dataLabelFormatCode: '0.0"%"', dataLabelPosition: 'outEnd',
      dataLabelFontSize: 11, dataLabelFontBold: true, valAxisHidden: true, valGridLine: { style: 'none' }, valAxisMinVal: 0, valAxisMaxVal: 19.5,
      catAxisLabelFontSize: 11, catAxisLineShow: false, barGapWidthPct: 38,
    });
  const q = d.text(s, [
    { text: 'June 2026: ', options: { bold: true, color: d.S.amber } },
    { text: '“On ALE’s hardest tier, every frontier agent we tested, including Fable 5, achieved a 0% success rate.”', options: { italic: true, color: d.S.txt } },
    { text: '  — Berkeley RDI', options: { fontSize: 11, color: d.S.muted } },
  ], { x: rx, y: 4.46, w: rw, h: 0.62, fontSize: 14, valign: 'top' });
  const sw = (rw - 0.3) / 2;
  const st1 = stat(d, s, { x: rx, y: 5.16, w: sw, value: '38.2%', valueSize: 30, labelSize: 14, labelH: 0.84, label: 'of all 152 public tasks passed outright by Claude Opus 5.5 (GPT-6 Astra: 34.2%)' });
  const st2 = stat(d, s, { x: rx + sw + 0.3, y: 5.16, w: sw, value: '1,500+', valueSize: 30, labelSize: 14, labelH: 0.84, label: 'expert-sourced tasks across 55 occupations; 300+ industry experts involved' });

  d.animate(s, c1, { auto: true, effect: 'rise', dur: 450 });
  d.animate(s, [...gif, gcap], { auto: true, effect: 'fade', dur: 500, after: 100 });
  d.animate(s, [lab, ch], { effect: 'wipeLeft', dur: 1000 });
  d.animate(s, [q], { auto: true, effect: 'fade', after: 200 });
  d.animate(s, [...st1, ...st2], { effect: 'rise', dur: 450 });
  d.anim[s._num].groups[d.anim[s._num].groups.length - 1].effects.forEach((e, i) => { e.delay = Math.floor(i / 2) * 250; });

  d.source(s, 'Sources: Agents’ Last Exam (UC Berkeley RDI): agents-last-exam.org homepage, leaderboard and intro video (accessed Oct 4, 2026); launch post (June 2026).');
  s.addNotes([
    'Agents’ Last Exam (UC Berkeley RDI, Dawn Song’s group; arXiv 2606.05405, June 2026) is built to test whether agents are “job-ready”: 1,500+ expert-sourced tasks (target 5,000) across 55 occupations in 13 industry clusters — architecture, neuroscience, animation, engineering CAD, finance, law… — done in real professional software, with verifiable outcomes. Homepage tagline: “Challenge and measure AI agents on economically valuable and real-world tasks.”',
    'At launch (June 2026): “On ALE’s hardest tier, every frontier agent we tested, including Fable 5, achieved a 0% success rate.” And: “The age of useful agents is here. The age of truly job-ready agents is not.”',
    'Today (live leaderboard, accessed Oct 4, 2026): on that same hardest “Last-Exam” split (38 tasks), Claude Opus 5.5 in Claude Code (max effort) passes 15.8% (6 of 38); Claude Opus 5 and GPT-6 Sol 13.2%; GPT-6 Astra (High) 10.5%. The June launch configurations (Claude Code + Fable 5 at default effort, Codex + GPT-5.5 default, Cursor + Composer 2.5) still show 0.0% on the same split — so the jump from 0% is on the same task set. But say it: the same Claude Fable 5 run at XHigh effort now passes 7.9% (amber bar), so part of the jump comes from effort settings and harness, not only from newer models. Leaderboard entries are not dated, so “four months” is launch-to-today (best published result then vs now). The benchmark is “Led by Berkeley RDI and 300+ industry experts” (homepage); the arXiv abstract says 250+ at submission.',
    'Overall (152 public tasks): Claude Opus 5.5 38.2% pass rate (63.2% partial credit), GPT-6 Astra 34.2%; in June the best overall was 24.0% (GPT-5.5). Taking the best run per task across all agents gives 56.6%. “Pass rate” = share of runs with a perfect score.',
    'Caveat from the launch post: the most common failure is agents declaring success before verifying their work — “Done. All checks pass.” when files are missing or counts are wrong.',
    'Left: official homepage (crop) and a 4.7-second excerpt (0:70.5–0:75.2, trimmed/scaled only) of the official 80-second intro video: four agent sessions in real desktop software (CAD, an audio workstation, spreadsheets…), then the camera pulls back to a wall of dozens of sessions. The GIF plays in slideshow mode.',
    'URLs: https://agents-last-exam.org/ · https://agents-last-exam.org/leaderboard · https://rdi.berkeley.edu/blog/agents-last-exam/ · https://arxiv.org/abs/2606.05405 · video: https://agents-last-exam.org/videos/ale-intro.mp4',
  ].join('\n\n'));
  return s;
}

// ========== 1e. Labor: AutomationBench (Zapier) + Remote Labor Index (CAIS/Scale) ==========
async function paidWorkSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'THE ACCELERATION · LABOR · 2', 'Work benchmarks: AI success rates are soaring');

  // Two rows, one per benchmark: [real leaderboard crop] [native chart of the trend] [big stat].
  const zap = await crop('rev2/labor-automationbench-leaderboard-top10.png', 'labor-zapier-top5.png', { l: 388, t: 1366, w: 957, h: 530 });
  const rli = await crop('rev2/labor-rli-leaderboard-panel.png', 'labor-rli-top4.png', { l: 15, t: 15, w: 985, h: 470 });
  const sx = 9.85, sw = CX1 - sx;          // stat column
  const rowA = 1.72, rowB = 4.3, ch0 = 0.33; // row tops (labels), label-to-content offset
  const clipH = 6.5 - (rowB + ch0) - 0.02;   // clipping height (same in both rows)
  const pad = 0.06;
  const zw = (clipH - 2 * pad) * 957 / 530 + 2 * pad, rw2 = (clipH - 2 * pad) * 985 / 470 + 2 * pad;

  // Row A: AutomationBench (Zapier)
  const lz = capLabel(d, s, 'AUTOMATIONBENCH · ZAPIER, OCT 4, 2026', { x: CX0, y: rowA, w: zw + 0.4, charSpacing: 1 });
  const c1 = await d.frame(s, zap, { x: CX0 + 0.04, y: rowA + ch0, w: zw, h: clipH }, { rot: -1 });
  const ax = CX0 + zw + 0.42, aw = sx - 0.35 - ax;
  const la = capLabel(d, s, 'BEST SCORE AMONG MODELS RELEASED UP TO EACH MONTH (OUR COMPILATION)', { x: ax, y: rowA, w: aw, charSpacing: 0.25 });
  const ca = d.chart(s, 'line', [{ name: 'Best score', labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'], values: [8.68, 11.57, 16.59, 16.89, 17.05, 28.77, 30.44, 51.29] }],
    { x: ax - 0.1, y: rowA + ch0 - 0.04, w: aw + 0.1, h: clipH + 0.1 }, {
      chartColors: [HEX.red], lineSize: 3, lineDataSymbolSize: 7, showValue: true, dataLabelFormatCode: '0"%"', dataLabelPosition: 't',
      dataLabelFontSize: 11, valAxisMinVal: 0, valAxisMaxVal: 60, valAxisMajorUnit: 20, valAxisLabelFormatCode: '0"%"', catAxisLabelFontSize: 11,
    });
  const sa = stat(d, s, { x: sx, y: rowA + 0.02, w: sw, value: '~6×', valueSize: 40, labelSize: 14, labelH: 1.25,
    label: 'in seven months on the same tasks: 8.7% (Feb) → 51.3% (Sep). Workflows in 47 simulated business apps; strict pass/fail.' });

  // Row B: Remote Labor Index (CAIS + Scale)
  const lr = capLabel(d, s, 'REMOTE LABOR INDEX · SCALE, OCT 4, 2026', { x: CX0, y: rowB, w: rw2 + 0.4, charSpacing: 1 });
  const c2 = await d.frame(s, rli, { x: CX0 + 0.04, y: rowB + ch0, w: rw2, h: clipH }, { rot: 1 });
  const bx = CX0 + rw2 + 0.42, bw = sx - 0.35 - bx;
  const lb = capLabel(d, s, 'AUTOMATION RATE · KEY RESULTS, BY DATE PUBLISHED', { x: bx, y: rowB, w: bw, charSpacing: 1 });
  const cb = d.chart(s, 'bar', [{ name: 'Automation rate', labels: ['Launch\nOct ’25', 'Opus 4.8\nJul ’26', 'Fable 5\nJul ’26', 'GPT-6 Astra\nSep–Oct ’26'], values: [2.5, 8.33, 15.8, 20.83] }],
    { x: bx - 0.1, y: rowB + ch0 - 0.04, w: bw + 0.1, h: clipH + 0.12 }, {
      barDir: 'col', chartColors: [HEX.steel, HEX.steel, HEX.amber, HEX.red], showValue: true, dataLabelFormatCode: '0.0"%"', dataLabelPosition: 'outEnd',
      dataLabelFontSize: 12, dataLabelFontBold: true, valAxisHidden: true, valGridLine: { style: 'none' }, valAxisMinVal: 0, valAxisMaxVal: 25,
      catAxisLabelFontSize: 11, barGapWidthPct: 45,
    });
  const sb = stat(d, s, { x: sx, y: rowB + 0.02, w: sw, value: '8×', valueSize: 40, labelSize: 14, labelH: 1.25,
    label: 'in under a year: 2.5% → 20.8%. 240 real freelance jobs worth $144K, each judged by humans against a paid professional’s work.' });

  d.animate(s, [lz, ...c1], { auto: true, effect: 'rise', dur: 450 });
  d.animate(s, [la, ca], { auto: true, effect: 'wipeLeft', dur: 1100, after: 100 });
  d.animate(s, sa, { auto: true, effect: 'fade', after: 100 });
  d.animate(s, [lr, ...c2], { effect: 'rise', dur: 450 });
  d.animate(s, [lb, cb], { auto: true, effect: 'wipeLeft', dur: 1000, after: 100 });
  d.animate(s, sb, { auto: true, effect: 'fade', after: 100 });

  d.source(s, 'Sources: Zapier AutomationBench v1.0.6 (Oct 4, 2026), arXiv 2604.18934; release months: Artificial Analysis / Wikipedia · CAIS blog (Jul 1, 2026), Scale Labs RLI (Oct 4, 2026), arXiv 2510.26787.');
  s.addNotes([
    'Two work benchmarks; each row shows a crop of the live leaderboard (Oct 4, 2026), the trend, and the headline multiple. Top — AutomationBench (Zapier, Apr 21, 2026): 600+ held-out business workflows across Sales, Marketing, Operations, Support, Finance and HR in 47 simulated apps — each task runs in an isolated environment (CRM records, inbox threads, calendars…); Zapier’s page calls them “47 real tools”, meaning simulated versions of real apps — built on patterns from Zapier’s 2B+ monthly tasks across 3.7M companies; strict scoring — every end-state assertion must hold (“mostly-right is still wrong”); “No LLM-as-judge.”',
    'At launch: “Even the best frontier models currently score below 10%” (Opus 4.7 9.9%). Today (leaderboard v1.0.6): Gemini 4 Argon (High) 51.29%, Claude Sonnet 5.5 44.75%, Claude Opus 5.5 42.47%, GPT 6 Astra (Max) 41.4%. Zapier re-runs every model when the version changes, so everything is compared within v1.0.6. The chart is the best v1.0.6 score among models released up to each month (our compilation; release months from Artificial Analysis / Wikipedia): Gemini 3.1 Pro 8.68% (Feb) → Gemini 4 Argon 51.29% (Sep), ~6x in seven months; from April (GPT-5.5, 16.59%) it is ~3x. (Another cut: April’s launch leader Opus 4.7 scores 13.39% on v1.0.6 — ~4x to Gemini 4 Argon.)',
    'Failure mode worth naming: “More often than not, models declared success while actually failing. 72% of Opus’s failures, 91% of Gemini’s, and 84% of GPT 5.4’s involved this false confidence.” (AutomationBench paper.) Also: Claude Fable 5.1’s own safety classifier refused steps on ~40% of tasks (260 of 657), which Opus 5 then completed as a fallback.',
    'Bottom — Remote Labor Index (Center for AI Safety + Scale AI): 240 real freelance projects (3D & CAD, architecture, graphic design, video and animation, audio, data analysis, web apps…) representing 6,000+ hours of work valued at $143,991; mean human completion time 28.9 hours. Every deliverable is judged by human evaluators against a gold-standard deliverable from a paid professional; the automation rate is the share of projects where the AI’s work is as good or better. At launch (Oct 30, 2025) the best agent automated 2.5%. CAIS’s Jul 1, 2026 update: “the previous published leader sat at 4.17%” (Opus 4.6 + Claude Cowork; date of that result not found); in the same update GPT-5.5 scored 6.3%, Claude Opus 4.8 8.3% and Fable 5 15.8% — Fable 5 roughly double the next model. The chart shows the launch best, Opus 4.8 (the best of the earlier models in that update), Fable 5, and GPT-6 Astra 20.83% on today’s leaderboard (posted between Sep 3 and Oct 4, 2026 — hence “Sep–Oct ’26”; exact date not found). It is a set of key results by publication date, not a monthly series. CAIS: “The frontier has more than quadrupled in under eight months.” (Fable 5 was first announced as 16.1%; CAIS pages now show 15.8%.)',
    'Caveats (CAIS): an automated LLM judge overestimated the newest models ~2.9x (GPT-5.5: 17.9% vs 6.25% by humans) — and on one architecture project “GPT‑5.5’s good-looking render is faked with an image generator”; its actual 3D model was crude. Agents that look done but are not is itself a safety problem. ~80% of real projects are still not automated.',
    'URLs: https://zapier.com/benchmarks · https://arxiv.org/abs/2604.18934 · https://safe.ai/blog/significant-increase-in-digital-labor-automation · https://labs.scale.com/leaderboard/rli · https://dashboard.safe.ai/ · https://www.remotelabor.ai/ · https://arxiv.org/abs/2510.26787 · https://www.zdnet.com/article/anthropic-fable-5-freelance-work-performance-record/',
  ].join('\n\n'));
  return s;
}

// OpenAI's GDPval leaderboard page: page header + the "no longer active" line, stacked into one clipping (verbatim crops).
async function openaiNoticeClip() {
  fs.mkdirSync(OUT, { recursive: true });
  const out = path.join(OUT, 'labor-openai-gdpval-notice.png');
  const src = R2('labor-gdpval-openai-leaderboard-inactive.png');
  const top = await sharp(src).extract({ left: 30, top: 25, width: 840, height: 82 }).png().toBuffer();
  const line = await sharp(src).extract({ left: 425, top: 283, width: 935, height: 62 }).png().toBuffer();
  const Wd = 1010, pad = 26, gap = 34;
  const Hd = pad + 82 + gap + 62 + pad;
  await sharp({ create: { width: Wd, height: Hd, channels: 3, background: '#FFFFFF' } })
    .composite([{ input: top, left: 18, top: pad }, { input: line, left: 40, top: pad + 82 + gap }]).png().toFile(out);
  return out;
}

// ========== 1f. Labor: GDPval ==========
async function gdpvalSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'THE ACCELERATION · LABOR · 3', 'OpenAI: AI tied or beat experts 85% of the time');

  // left: GDPval wins + ties vs industry professionals, with the 50% parity line
  const lw = 6.55;
  const lab = capLabel(d, s, 'GDPVAL · DELIVERABLE JUDGED AS GOOD AS OR BETTER THAN AN EXPERT’S', { x: CX0, y: 1.72, w: lw, charSpacing: 1 });
  const box = { x: CX0 - 0.1, y: 1.98, w: lw + 0.1, h: 3.55 };
  const L = { x: 0.07, y: 0.12, w: 0.92, h: 0.72 };
  const labels = ['GPT-4o (2024)', 'o3 (Apr ’25)', 'GPT-5 (Aug ’25)', 'Opus 4.1 (Sep ’25)', 'GPT-5.2 (Dec ’25)', 'GPT-5.4 (Mar ’26)', 'GPT-5.5 (Apr ’26)'].map(l => l.replace(/ (’\d\d\))/, '\u00A0$1'));
  const vals = [12.4, 34.1, 38.8, 47.6, 70.9, 83.0, 84.9];
  const ch = d.chart(s, 'bar', [{ name: 'Wins + ties', labels, values: vals }], box, {
    barDir: 'col', layout: L, chartColors: vals.map(v => (v >= 50 ? HEX.red : HEX.steel)), showValue: true, dataLabelFormatCode: '0.0"%"',
    dataLabelPosition: 'outEnd', dataLabelFontSize: 12, dataLabelFontBold: true, valAxisMinVal: 0, valAxisMaxVal: 100, valAxisMajorUnit: 25,
    valAxisLabelFormatCode: '0"%"', catAxisLabelFontSize: 11, barGapWidthPct: 45,
  });
  const py = box.y + box.h * (L.y + L.h * 0.5), px0 = box.x + box.w * L.x, px1 = box.x + box.w * (L.x + L.w);
  // parity line drawn as two segments with a gap around the Opus 4.1 data label (47.6%), which sits right on 50%
  const gc = box.x + box.w * (L.x + L.w * 3.5 / 7), gh = 0.36;
  const par = [[px0, gc - gh], [gc + gh, px1]].map(([a, b]) => {
    const n = d.name('parity');
    s.addShape(d.pres.shapes.LINE, { x: a, y: py, w: b - a, h: 0, line: { color: HEX.amber, width: 1.5, dashType: 'dash' }, objectName: n });
    return n;
  });
  const parT = d.text(s, '50% = parity with industry experts', { x: px0 + 0.08, y: py - 0.3, w: 3.0, h: 0.26, fontSize: 11, bold: true, color: d.S.amber, valign: 'bottom' });
  // the red bars are OpenAI's own reported numbers: say so on the chart itself (bracket over the three bars)
  const pa = box.x + box.w * (L.x + L.w * 4 / 7) + 0.1, pb = box.x + box.w * (L.x + L.w) - 0.1, pyb = box.y + 0.03;
  const brk = d.name('brk');
  s.addShape(d.pres.shapes.LINE, { x: pa, y: pyb + 0.3, w: pb - pa, h: 0, line: { color: HEX.red, width: 1.25 }, objectName: brk });
  const brkT = d.text(s, 'OPENAI-REPORTED', { x: pa, y: pyb, w: pb - pa, h: 0.26, fontSize: 10, bold: true, color: d.S.red, charSpacing: 1, align: 'center', valign: 'bottom' });
  const note = d.text(s, [
    { text: 'OpenAI’s own benchmark: 44 occupations; tasks written by professionals with ~14 years’ experience; graded blind by other experts. ', options: { color: d.S.muted } },
    { text: 'Grey: GDPval paper (Sep 2025). Red: OpenAI-reported, via press.', options: { color: d.S.steel, italic: true } },
  ], { x: CX0, y: box.y + box.h + 0.08, w: lw, h: 0.85, fontSize: 14, valign: 'top' });

  // right: the headline, then OpenAI stops publishing the number
  const rx = 7.5, rw = CX1 - rx;
  const mtp = R2('labor-marktechpost-gpt55-gdpval.png');
  const kw = rw - 0.8; // clippings narrower than the column so the full VentureBeat sentence fits below
  const c1 = await frameW(d, s, mtp, rx + 0.4, 1.86, kw, { rot: -1.2 });
  const mBottom = 1.86 + await hFor(mtp, kw);
  const l2 = capLabel(d, s, 'SINCE THEN: NO NEW NUMBER FROM OPENAI', { x: rx, y: mBottom + 0.22, w: rw, color: d.S.amber });
  const notice = await openaiNoticeClip();
  const c2 = await frameW(d, s, notice, rx + 0.4, mBottom + 0.55, kw, { rot: 1 });
  const nBottom = mBottom + 0.55 + await hFor(notice, kw);
  const vb = d.text(s, [
    { text: '“One notable omission from OpenAI’s Astra launch materials is GDPval, the company’s own benchmark for measuring performance on economically valuable, real-world work.”', options: { italic: true, fontFace: 'Cambria', color: d.S.txt, breakLine: true } },
    { text: '— VentureBeat, Sep 3, 2026. An independent re-run (Artificial Analysis) now ranks Claude Opus 5.5 first.', options: { fontSize: 11, color: d.S.muted } },
  ], { x: rx, y: nBottom + 0.2, w: rw, h: 6.5 - nBottom - 0.2, fontSize: 14, valign: 'top' });

  d.animate(s, [lab, ch], { auto: true, effect: 'wipeLeft', dur: 1200 });
  d.animate(s, [...par, parT, brk, brkT, note], { auto: true, effect: 'fade', after: 100 });
  d.animate(s, c1, { effect: 'slam', dur: 350 });
  d.animate(s, [l2, ...c2], { effect: 'rise', dur: 450 });
  d.animate(s, [vb], { auto: true, effect: 'fade', after: 200 });

  d.source(s, 'Sources: OpenAI, GDPval (arXiv 2510.04374, Sep 2025) · The Next Web (Mar 5, 2026) · MarkTechPost (Apr 23, 2026) · evals.openai.com (Oct 4, 2026) · VentureBeat (Sep 3, 2026) · Artificial Analysis GDPval-AA v2.1.');
  s.addNotes([
    'GDPval is OpenAI’s own benchmark of economically valuable work: 44 occupations across the 9 sectors contributing most to US GDP; tasks (with reference files) written by professionals averaging 14 years of experience; other experts compare the AI’s deliverable with the expert’s, blind. The metric is the share of tasks where the AI’s deliverable is judged as good as or better than the expert’s (wins + ties); 50% = parity.',
    'Paper (Sep 2025): GPT-4o 12.4%, o3 high 34.1%, GPT-5 high 38.8%, Claude Opus 4.1 47.6% (best at the time — an Anthropic model on OpenAI’s benchmark). Later OpenAI-reported results (we could not load openai.com, so these are as reported by the press): GPT-5.2 70.9% and GPT-5.4 “matched or exceeded industry professionals in 83% of comparisons” (The Next Web, Mar 5, 2026); GPT-5.5 84.9% (MarkTechPost, Apr 23, 2026).',
    'Then: “One notable omission from OpenAI’s Astra launch materials is GDPval, the company’s own benchmark for measuring performance on economically valuable, real-world work.” (VentureBeat, Sep 3, 2026 — the same article quotes Greg Brockman: “Welcome to the AGI era.”) OpenAI’s GDPval leaderboard page now reads: “The OpenAI-hosted GDPval leaderboard is no longer active.” We do not know why; do not speculate beyond the facts.',
    'Independent: Artificial Analysis re-runs the 220 public GDPval tasks agentically and scores them by blind pairwise Elo (a different metric): Claude Opus 5.5 leads at 1867, Claude Sonnet 5.5 1840; GPT-6 Astra (max) 1542. Best Elo rose from 920 (GPT-5, Aug 2025) to 1867 (Sep 2026).',
    'Caveat: “as good as an expert on a well-specified one-off task” is not “can do the expert’s job” — but the trend line crossed parity within a year.',
    'URLs: https://arxiv.org/abs/2510.04374 · https://thenextweb.com/news/openai-gpt-54-launch-computer-use-benchmarks · https://www.marktechpost.com/2026/04/23/openai-releases-gpt-5-5-a-fully-retrained-agentic-model-that-scores-82-7-on-terminal-bench-2-0-and-84-9-on-gdpval/ · https://evals.openai.com/gdpval/leaderboard · https://venturebeat.com/technology/welcome-to-the-agi-era-openai-launches-gpt-6-astra · https://artificialanalysis.ai/evaluations/gdpval-aa',
  ].join('\n\n'));
  return s;
}

// ========== 2. Software jobs: the junior engineer is disappearing ==========
async function juniorSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'THE ACCELERATION · JOBS', 'The junior engineer is disappearing');

  const lx = CX0, lw = 5.85, rx = 6.95, rw = CX1 - rx;
  const vy = 2.1, vh = 2.9;
  const l1 = capLabel(d, s, 'SOFTWARE DEVELOPERS BY AGE · HEADCOUNT (LATE 2022 = 1.0)', { x: lx, y: 1.72, w: lw });
  const canFile = R('swe-stanford-canaries-swe-by-age.png');
  const can = await d.frame(s, canFile, { x: lx, y: vy, w: lw, h: vh }, { align: 'left' });
  // native annotation over the chart's white margin (source px -> slide inches)
  const cn = await imgSize(canFile), cg = can.geom;
  const P = (px, py) => ({ x: cg.x + px * cg.w / cn.w, y: cg.y + py * cg.h / cn.h });
  const annot = [];
  const jEnd = P(1268, 748), jLab = P(1345, 748); // end of the blue 22–25 line (mid-2026, ~0.81)
  const sEnd = P(1268, 226), sLab = P(1345, 226); // between the 41–49 and 35–40 line ends
  const arrow = (from, to, color, width) => {
    const n = d.name('annot');
    s.addShape(d.pres.shapes.LINE, { x: to.x, y: to.y, w: from.x - to.x, h: 0, line: { color, width, beginArrowType: 'triangle' }, objectName: n });
    return n;
  };
  annot.push(arrow({ x: jLab.x - 0.03, y: jEnd.y }, jEnd, HEX.red, 1.75));
  annot.push(d.text(s, 'Ages 22–25', { x: jLab.x, y: jLab.y - 0.15, w: 1.25, h: 0.3, fontSize: 13, bold: true, color: HEX.red, valign: 'middle' }));
  annot.push(arrow({ x: sLab.x - 0.03, y: sEnd.y }, sEnd, '7A808A', 1));
  annot.push(d.text(s, 'Ages 35–49', { x: sLab.x, y: sLab.y - 0.13, w: 1.25, h: 0.26, fontSize: 11, bold: true, color: '5A606B', valign: 'middle' }));

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
  const sy = 5.2, sw = 1.87, sg = 0.18;
  const a = stat(d, s, { x: lx, y: sy, w: sw, value: '−20%', valueSize: 34, labelSize: 14, labelH: 0.75, label: 'Devs aged 22–25 since late 2022 (35+ grew)' });
  const b = stat(d, s, { x: lx + sw + sg, y: sy, w: sw, value: '−65%', valueSize: 34, labelSize: 14, labelH: 0.75, label: 'New-grad hiring at Big Tech vs 2019' });
  // explicit, balanced three-line wrap (the auto-wrap left “2019” orphaned on its own line)
  const c = stat(d, s, { x: lx + 2 * (sw + sg), y: sy, w: sw, value: '−76%', valueSize: 34, labelSize: 14, labelH: 0.75,
    label: [{ text: 'New-grad hiring', options: { breakLine: true } }, { text: 'at early-stage', options: { breakLine: true } }, { text: 'startups vs 2019' }] });

  // bottom-right: honest caveat
  const cav = d.text(s, [
    { text: 'Honest caveat: ', options: { bold: true, color: d.S.amber } },
    { text: 'software postings bottomed in March 2025 (62) and have partly recovered — 76.5 in Sept 2026. That is still ', options: { color: d.S.muted } },
    { text: '~23% below pre-pandemic', options: { color: d.S.txt, bold: true } },
    { text: ', while all postings are ~3% above.', options: { color: d.S.muted } },
  ], { x: rx, y: sy + 0.08, w: rw, h: 1.25, fontSize: 14, valign: 'top' });

  d.animate(s, [l1, ...can, ...annot], { auto: true, effect: 'rise', dur: 600 });
  d.animate(s, [l2, ch], { auto: true, effect: 'wipeLeft', dur: 1000, after: 100 });
  d.animate(s, [...a, ...b, ...c], { effect: 'rise', dur: 450 });
  d.anim[s._num].groups[2].effects.forEach((e, i) => { e.delay = Math.floor(i / 2) * 250; });
  d.animate(s, [cav], { effect: 'fade' });

  d.source(s, 'Sources: Brynjolfsson et al., “Canaries in the Coal Mine?” (Stanford, Aug 2026, Fig. B.3) · SignalFire State of Tech Talent 2026 · Indeed Hiring Lab via FRED (to Sep 18, 2026).');
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
  head(s, 'THE ACCELERATION · JOBS · 2', 'AI writes the code — firms cite it for job cuts');

  // left: Google code-share chart + AI layoffs stat
  const lw = 3.4;
  const lab = capLabel(d, s, 'NEW GOOGLE CODE WRITTEN BY AI', { x: CX0, y: 1.72, w: lw });
  const ch = d.chart(s, 'bar', [{ name: 'Google', labels: ['2024', 'Fall 2025', 'Apr 2026'], values: [0.25, 0.5, 0.75] }],
    { x: CX0 - 0.1, y: 2.0, w: lw + 0.1, h: 4.45 }, {
      barDir: 'col', chartColors: [HEX.steel, HEX.amber, HEX.red], showValue: true, dataLabelFormatCode: '0%', dataLabelPosition: 'outEnd',
      dataLabelFontSize: 14, dataLabelFontBold: true, valAxisHidden: true, valGridLine: { style: 'none' }, valAxisMaxVal: 0.9, valAxisMinVal: 0,
      catAxisLabelFontSize: 11, barGapWidthPct: 35,
    });
  // layoffs stat sits with the layoff clippings (bottom of the collage, under the CNN clipping)
  const st = stat(d, s, { x: 4.5, y: 5.05, w: 2.55, value: '101,743', valueSize: 36, labelSize: 14, labelH: 0.75, label: 'announced US job cuts citing AI in H1 2026 — nearly double all of 2025 (Challenger)' });

  // right: four clippings in two pairs — code (top) and layoffs (bottom) — staggered, with clear gaps between frames.
  // (The Semafor “75%” clipping was dropped: the chart on the left already shows that figure.)
  const bi = await crop('swe-bi-anthropic-cfo-90pct.png', 'swe-bi-90pct-head.png', { l: 0, t: 0, w: 1400, h: 462 });
  const fortune = await crop('swe-fortune-100pct-code.png', 'swe-fortune-100pct-head.png', { l: 0, t: 0, w: 1130, h: 580 });
  const cnn = await crop('swe-cnn-block.png', 'swe-cnn-block-head.png', { l: 0, t: 0, w: 2440, h: 660 });
  const cbs = await crop('swe-cbs-ai-layoffs.png', 'swe-cbs-layoffs-head.png', { l: 0, t: 0, w: 1320, h: 352 });

  const c1 = await frameW(d, s, bi, 4.45, 1.88, 4.1, { rot: -1.5 });
  const c2 = await frameW(d, s, fortune, 8.87, 2.15, 3.83, { rot: 1.5 });
  const c3 = await frameW(d, s, cnn, 4.5, 3.6, 4.05, { rot: 1.2 });
  const c4 = await frameW(d, s, cbs, 7.42, 5.08, 4.85, { rot: -1.5 });

  d.animate(s, [lab, ch], { auto: true, effect: 'wipeLeft', dur: 800 });
  d.animate(s, [...c1, ...c2], { auto: true, effect: 'rise', dur: 450, after: 200 });
  d.anim[s._num].groups[1].effects.forEach((e, i) => { e.delay = Math.floor(i / 2) * 220; });
  d.animate(s, c3, { effect: 'slam', dur: 350 });
  d.animate(s, c4, { auto: true, effect: 'slam', dur: 350, after: 250 });
  d.animate(s, st, { effect: 'rise' });

  d.source(s, 'Sources: Google blog / Semafor (Apr 2026) · Business Insider (May 2026) · Fortune (Jan 2026) · CNN (Feb 2026) · CBS News (May 2026) · HR Dive / Challenger, Gray & Christmas (Jul 2026).');
  s.addNotes([
    'Google: “75% of all new code at Google is now AI-generated and approved by engineers, up from 50% last fall” (Sundar Pichai, Cloud Next ’26, Apr 22 2026); 25% in 2024. Semafor also reports Snap reached 65% AI-generated code and immediately cut planned headcount.',
    'Anthropic CFO Krishna Rao: “90 plus percent of our code is actually written by Claude Code.” Fortune: Boris Cherny (Anthropic) — “100% for two+ months now”; roon (OpenAI) — “100%, I don’t write code anymore.” These are self-reported figures by the companies and individuals.',
    'Layoffs: Block cut more than 4,000 jobs (~40% of staff) citing AI; Jack Dorsey said most companies will do the same. Challenger: AI was the top cited reason for layoffs in April 2026 (21,490 of 88,387 cuts, 26%). H1 2026: 101,743 announced cuts cited AI (~23% of all) vs 54,836 in all of 2025; tech-sector cuts up 83% YoY.',
    'Caveat: “cited AI” is what companies say in announcements — some firms may use AI as a convenient framing for cuts driven by other factors. We found no 2026 figure from Microsoft; the latest public number is Nadella’s “20–30%” (April 2025).',
    'URLs: https://blog.google/innovation-and-ai/infrastructure-and-cloud/google-cloud/cloud-next-2026-sundar-pichai/ · https://www.semafor.com/article/04/24/2026/google-ceo-says-75-of-companys-new-code-is-ai-generated · https://www.aol.com/articles/anthropic-cfo-says-ai-now-224949000.html · https://fortune.com/2026/01/29/100-percent-of-code-at-anthropic-and-openai-is-now-ai-written-boris-cherny-roon/ · https://www.cnn.com/2026/02/26/business/block-layoffs-ai-jack-dorsey · https://www.cbsnews.com/news/ai-layoffs-job-cuts-challenger-report-april-2026/ · https://www.hrdive.com/news/tech-layoffs-surge-83percent-h1-2026-challenger-ai-disruption/824320/',
  ].join('\n\n'));
  return s;
}

// ========== 4. Academia: arXiv rate limit ==========
async function arxivSlide(d) {
  const s = d.slide('Content');
  head(s, 'THE ACCELERATION · ACADEMIA', 'arXiv now caps submitters at two papers a month');

  const chartImg = R('acad-arxiv-monthly-submissions-sep2026.png');
  const cw = 6.95;
  const chH = await hFor(chartImg, cw);
  const chY = 1.8 + (4.7 - chH) / 2;
  const chart = await d.frame(s, chartImg, { x: CX0, y: chY, w: cw, h: chH });
  // callout over the empty upper-left of the chart (image px 170–1430 × 165–740 hold no bars):
  // left = the total-submissions number, right = arXiv's own cs.AI chart from the same post
  const g = chart.geom, ppx = g.w / 1966;
  const kx = g.x + 170 * ppx, ky = g.y + 160 * ppx, kw = 4.5, kh = 2.02;
  const co = [];
  co.push(d.card(s, { x: kx, y: ky, w: kw, h: kh }, { color: '10141B', line: HEX.red }));
  co.push(d.text(s, [
    { text: '40,363', options: { fontSize: 36, bold: true, color: d.S.red, fontFace: 'Arial', breakLine: true } },
    { text: 'submissions in Sept 2026 — 2× Sept 2024, 4× Sept 2016', options: { fontSize: 14, color: d.S.txt } },
  ], { x: kx + 0.18, y: ky + 0.14, w: 1.82, h: kh - 0.28, valign: 'middle' }));
  const dv = d.name('div');
  s.addShape(d.pres.shapes.LINE, { x: kx + 2.14, y: ky + 0.22, w: 0, h: kh - 0.44, line: { color: HEX.line, width: 1 }, objectName: dv });
  co.push(dv);
  const csx = kx + 2.3, csw = kw - 2.3 - 0.18;
  co.push(capLabel(d, s, 'CS.AI ALONE · MONTHLY', { x: csx, y: ky + 0.06, w: csw, charSpacing: 1 }));
  // Native dark sparkline of arXiv's own “cs.AI submissions per month, 2024 - 2026” chart (same post).
  // Monthly values were traced from the official chart image (acad-arxiv-csai-growth.png: red-line pixels sampled at
  // each month tick, ±~30) — used only for the line's shape. The two labelled values are the post's figures
  // (~300 at the start, ~3,300 at the end; “over 6X” in two years).
  const csaiTrace = [330, 550, 510, 420, 530, 540, 620, 570, 520, 770, 570, 780, 560, 790, 730, 750, 1220, 1030, 1020, 1250,
    1390, 1560, 1230, 1180, 1590, 1510, 1680, 2020, 2770, 2340, 2140, 2870, 3280];
  const spY = ky + 0.36, spH = 1.06, vMax = 4400;
  const L = { x: 0.03, y: 0.02, w: 0.94, h: 0.96 }; // manual plot-area layout (fractions of the chart box)
  const px = { x: csx + L.x * csw, y: spY + L.y * spH, w: L.w * csw, h: L.h * spH }; // plot area, inches
  const ptX = (i) => px.x + (i + 0.5) / csaiTrace.length * px.w; // 'between' category placement
  const ptY = (v) => px.y + (1 - v / vMax) * px.h;
  const base = d.name('base');
  s.addShape(d.pres.shapes.LINE, { x: px.x, y: px.y + px.h, w: px.w, h: 0, line: { color: '3A4250', width: 0.75 }, objectName: base });
  co.push(base);
  co.push(d.chart(s, 'line', [{ name: 'cs.AI', labels: csaiTrace.map((_, i) => String(i)), values: csaiTrace }],
    { x: csx, y: spY, w: csw, h: spH }, {
      layout: L, chartColors: [HEX.red], lineSize: 2, lineDataSymbol: 'none', showLegend: false,
      valAxisHidden: true, catAxisHidden: true, valGridLine: { style: 'none' }, valAxisMinVal: 0, valAxisMaxVal: vMax,
    }));
  const n = csaiTrace.length;
  const endDot = d.name('dot');
  s.addShape(d.pres.shapes.OVAL, { x: ptX(n - 1) - 0.045, y: ptY(csaiTrace[n - 1]) - 0.045, w: 0.09, h: 0.09, fill: { color: HEX.red }, line: { color: HEX.red, width: 0 }, objectName: endDot });
  co.push(endDot);
  co.push(d.text(s, '~3,300', { x: ptX(n - 1) - 1.0, y: ptY(csaiTrace[n - 1]) - 0.3, w: 0.92, h: 0.22, fontSize: 12, bold: true, color: d.S.txt, align: 'right', valign: 'bottom' }));
  co.push(d.text(s, '~300', { x: px.x, y: ptY(csaiTrace[0]) - 0.36, w: 0.6, h: 0.22, fontSize: 12, bold: true, color: d.S.muted, valign: 'bottom' }));
  const axY = px.y + px.h + 0.03;
  co.push(d.text(s, '2024', { x: px.x, y: axY, w: 0.6, h: 0.18, fontSize: 10, color: d.S.steel, valign: 'top' }));
  co.push(d.text(s, '2026', { x: px.x + px.w - 0.6, y: axY, w: 0.6, h: 0.18, fontSize: 10, color: d.S.steel, align: 'right', valign: 'top' }));
  co.push(d.text(s, [
    { text: '>6× ', options: { bold: true, color: d.S.red } },
    { text: 'in two years', options: { color: d.S.txt } },
  ], { x: csx, y: ky + kh - 0.38, w: csw, h: 0.26, fontSize: 13, valign: 'middle' }));

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

  d.animate(s, chart, { auto: true, effect: 'wipeLeft', dur: 1200 });
  d.animate(s, co, { effect: 'zoom', dur: 400 });
  d.animate(s, c1, { effect: 'rise' });
  d.animate(s, c2, { auto: true, effect: 'slam', dur: 350, after: 300 });
  d.animate(s, [q], { effect: 'fade' });

  d.source(s, 'Sources: arXiv blog, “Fair Moderation, Equitable Access, and AI: arXiv’s Updated Rate Limit Policy” (Kat Boboris, Oct 1, 2026): monthly-submissions chart; cs.AI line redrawn from its chart · Cybernews (Oct 2026).');
  s.addNotes([
    'From October 1, 2026 arXiv limits every submitter (the cap applies to the submitter, i.e. the account that uploads the paper) to two submissions per calendar month and three active submissions at any time — across ALL categories; rejected submissions count. arXiv calls it a stopgap while it works out best practice for authors using advanced AI tools.',
    'Numbers from the official post: September 2016: 9,869 submissions · September 2024: 20,569 · September 2026: 40,363 — doubled in two years, generating almost 9,000 support tickets. Total submissions as of Oct 1 2026: 3,192,873.',
    'The small sparkline redraws arXiv’s own chart from the same post, “cs.AI submissions per month, 2024 - 2026”: from roughly 300 a month (Jan 2024) to roughly 3,300 in the latest month shown (the final point sits on the 2026-09 tick of arXiv’s chart; our research note read it as Aug 2026). The line’s monthly values were traced from the official chart image (approximate, shape only); the two labelled values are the post’s own figures. The post says cs.AI submissions grew more than 6x in two years. Compare arXiv as a whole: 2x in two years. The AI category itself is where the flood is fastest.',
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
  const lab = capLabel(d, s, 'NEURIPS & ICLR SUBMISSIONS PER YEAR', { x: CX0, y: 1.72, w: lw });
  const yrs = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];
  const ch = d.chart(s, 'line', [
    { name: 'NeurIPS', labels: yrs, values: [3240, 4856, 6743, 9467, 9122, 10411, 12343, 15671, 21575, 30709] },
    { name: 'ICLR', labels: yrs, values: [507, 981, 1591, 2594, 2997, 3391, 4938, 7304, 11565, 19525] },
  ], { x: CX0 - 0.1, y: 2.0, w: lw + 0.1, h: 4.45 }, {
    chartColors: [HEX.red, HEX.amber], lineSize: 3, lineDataSymbolSize: 6, valAxisMinVal: 0, valAxisMaxVal: 35000, valAxisMajorUnit: 5000,
    valAxisLabelFormatCode: '#,##0', legendPos: 't',
  });
  // callout in the empty upper-left of the plot, on an opaque card so gridlines don't strike through it
  const note = [];
  note.push(d.card(s, { x: 1.55, y: 3.1, w: 3.05, h: 0.82 }, { color: '0D1016', line: HEX.line }));
  note.push(d.text(s, [
    { text: 'NeurIPS 2026: ', options: { bold: true, color: d.S.red } },
    { text: '30,709 (3× 2022)', options: { color: d.S.txt, breakLine: true } },
    { text: 'ICLR 2026: ', options: { bold: true, color: d.S.amber } },
    { text: '19,525 (6× 2022)', options: { color: d.S.txt } },
  ], { x: 1.72, y: 3.17, w: 2.8, h: 0.68, fontSize: 14, valign: 'middle', paraSpaceAfter: 0 }));

  const rx = 7.1, rw = CX1 - rx;
  const c1 = await frameW(d, s, R('acad-nature-iclr-ai-reviews.png'), rx + 0.15, 1.8, rw - 0.5, { rot: -1.2 });
  const line = d.text(s, [
    { text: '21% ', options: { fontSize: 26, bold: true, color: d.S.red, fontFace: 'Arial' } },
    { text: 'of ICLR 2026’s 75,800 peer reviews were flagged as fully AI-generated by the Pangram detector; over half showed signs of AI use.', options: { fontSize: 14, color: d.S.txt } },
  ], { x: rx, y: 4.08, w: rw, h: 0.85, valign: 'top' });

  // official NeurIPS post: headline + the desk-rejection line, composited into one clipping
  const neu = await neuripsClip();
  const c2 = await frameW(d, s, neu, rx + 0.05, 5.1, 3.3, { rot: 1.2 });
  const st = stat(d, s, { x: rx + 3.65, y: 5.02, w: rw - 3.65, value: '18.4%', valueSize: 38, labelSize: 14, labelH: 0.9, label: 'of NeurIPS 2026 position papers desk-rejected as AI-generated' });

  d.animate(s, [lab, ch], { auto: true, effect: 'wipeLeft', dur: 1100 });
  d.animate(s, note, { auto: true, effect: 'fade', after: 100 });
  d.animate(s, c1, { effect: 'slam', dur: 350 });
  d.animate(s, [line], { auto: true, effect: 'fade', after: 200 });
  d.animate(s, c2, { effect: 'rise' });
  d.animate(s, st, { auto: true, effect: 'rise', after: 250 });

  d.source(s, 'Sources: CS Conf Stats / OpenAccept; ICLR 2026 retrospective (Mar 31, 2026) · Nature, Naddaf (Nov 27, 2025; Pangram analysis) · NeurIPS blog (Jun 2, 2026).');
  s.addNotes([
    'Submissions: NeurIPS 2026 received 30,709 main-track submissions (+42% YoY, ~3x 2022’s 10,411). ICLR 2026 received 19,525 valid submissions (~6x 2022’s 3,391), reviewed via 76,139 reviews by 18,054 reviewers; acceptance 27.4%. NeurIPS figures come from aggregator sites (CS Conf Stats and OpenAccept agree on every value); the ICLR 2026 figure is confirmed by the official retrospective.',
    'Nature (Nov 2025): the AI-text detector company Pangram screened 19,490 ICLR 2026 submissions and 75,800 reviews — 21% of reviews were flagged as fully AI-generated and more than half showed signs of AI use. This is a detector estimate, not a confession count. ICLR desk-rejected papers with hallucinated references.',
    'NeurIPS 2026 position-paper track required papers to be substantially human-written; screening 969 submissions with Pangram, 178 (18.4%) were desk-rejected and 123 (12.7%) asked to prove human engagement. Caveat: these rely on an AI-text detector (Pangram), though NeurIPS says it ran independent analyses to rule out significant false positives.',
    'The clipping bottom-right is the official NeurIPS blog post: its headline plus the line “178 submissions (18.4% of all submissions) will be desk rejected” (the body text in between is omitted; the bullet is re-wrapped onto two lines for legibility).',
    'URLs: https://csconfstats.xoveexu.com/conferences/neurips/ · https://csconfstats.xoveexu.com/conferences/iclr/ · https://blog.iclr.cc/2026/03/31/a-retrospective-on-the-iclr-2026-review-process/ · https://www.nature.com/articles/d41586-025-03506-6 · https://blog.neurips.cc/2026/06/02/ai-generated-papers-in-the-neurips-2026-position-paper-track/',
  ].join('\n\n'));
  return s;
}

// ========== 6. Video Turing test: Tavus Griffin ==========
async function tavusSlide(d) {
  const s = d.slide('Content', { transition: 'zoom' });
  head(s, 'THE ACCELERATION · VIDEO', 'Tavus: 48% thought its AI was a real person');

  // official Tavus upload (openweights manifest: video-tavus-griffin)
  const vw = 6.45;
  const vid = await d.video(s, {
    link: 'https://www.youtube.com/watch?v=lHw6yoyPkpo', embed: 'https://www.youtube.com/embed/lHw6yoyPkpo',
    cover: A('research', 'openweights', 'yt-lHw6yoyPkpo.jpg'), box: { x: CX0, y: 1.8, w: vw, h: vw * 9 / 16 },
    label: 'Tavus — Introducing Griffin (official, Oct 1, 2026)',
  });
  const capY = vid.geom.y + vid.geom.h + 0.45;
  const cap = d.text(s, [
    { text: 'The woman is Griffin; the man in the inset is Tavus’s CEO. ', options: { bold: true, color: d.S.txt } },
    { text: 'Tavus says every pixel is generated live from one reference image — and that Griffin is ', options: { color: d.S.muted } },
    { text: '“too powerful to release publicly until the safeguards are ready.”', options: { color: d.S.txt, italic: true } },
  ], { x: CX0, y: capY, w: vw, h: 6.55 - capY, fontSize: 14, valign: 'top' });

  const rx = 7.75, rw = CX1 - rx;
  // official page, cropped tight to its 48% stat so the text is legible (page title/body text omitted)
  const page = await crop('video-tavus-griffin-page.jpg', 'video-tavus-page-48.jpg', { l: 236, t: 1462, w: 620, h: 280 });
  const sw = rw - 0.28, sx = rx + (rw - sw) / 2;
  const pl = capLabel(d, s, 'TAVUS.IO/GRIFFIN · OFFICIAL PAGE (CROP)', { x: sx, y: 1.72, w: sw });
  const shot = [pl, ...await frameW(d, s, page, sx, 2.02, sw)];
  const shotBottom = 2.02 + await hFor(page, sw);
  // two-bar comparison drawn with native shapes (exact label placement)
  const bars = [];
  // value labels as the source states them (26/54 = 48.1%; Tavus says “48%”), not v.toFixed(1)
  const rowsT = [['Previous Tavus system', 2.4, HEX.steel, '2.4%'], ['Griffin-Lite', 48.0, HEX.red, '48%']];
  const bx = rx + 2.05, perPct = 2.0 / 48, by0 = shotBottom + 0.32;
  rowsT.forEach(([name, v, col, vs], i) => {
    const yy = by0 + i * 0.4;
    bars.push(d.text(s, name, { x: rx, y: yy, w: 1.95, h: 0.32, fontSize: 12, color: d.S.muted, align: 'right', valign: 'middle' }));
    const b = d.name('bar');
    s.addShape(d.pres.shapes.RECTANGLE, { x: bx, y: yy + 0.02, w: v * perPct, h: 0.28, fill: { color: col }, line: { color: col, width: 0 }, objectName: b });
    bars.push(b);
    bars.push(d.text(s, vs, { x: bx + v * perPct + 0.08, y: yy, w: 0.8, h: 0.32, fontSize: 14, bold: true, color: i ? d.S.red : d.S.txt, valign: 'middle' }));
  });
  const cavY = by0 + 0.4 + 0.32 + 0.16;
  const cav = d.text(s, 'Company-run study (26 of 54 vs 1 of 41, one-minute calls) — not independently verified.',
    { x: rx, y: cavY, w: rw, h: 6.55 - cavY, fontSize: 14, color: d.S.amber, valign: 'top' });

  // the company-run caveat arrives with the numbers, on slide entry — never a click later
  d.animate(s, [cap], { auto: true, effect: 'fade', delay: 300 });
  d.animate(s, shot, { auto: true, effect: 'rise', after: 200 });
  d.animate(s, bars, { auto: true, effect: 'wipeLeft', dur: 800, after: 100 });
  d.animate(s, [cav], { auto: true, effect: 'fade', dur: 400, after: 0 });

  d.source(s, 'Sources: Tavus, “The First Human Interaction Model” — tavus.io/griffin (Oct 1, 2026) · Tavus, “Introducing Griffin” (official YouTube video and description, Oct 1, 2026).');
  s.addNotes([
    'Tavus Griffin, released Oct 1 2026 as the “Griffin-Lite” research preview. Tavus claims it is “the first model to pass the real-time, video Turing test”: in a live study, participants had one-minute video calls with a partner they were told was another participant. 26 of 54 (48%) who talked to Griffin-Lite thought they had talked with a real human; Tavus’s previous system (Phoenix-4.5 + Sparrow-2 + Raven-1) fooled 1 of 41 (2.4%).',
    'The video still: the woman (“Vanessa”) in the main frame is the Griffin-generated persona; the man in the inset is Tavus CEO Hassaan Raza. Tavus says Griffin “generates every pixel in every frame in real time from one reference image” — face, hands, chair, shadows and background — as a single full-duplex video-to-video model rather than a cascade of transcription → LLM → voice → video. That is Tavus’s description, not an independent analysis.',
    'From the official video description: “Because it can be mistaken for a real person, Griffin is too powerful to release publicly until the safeguards are ready.” (It is available only as a Griffin-Lite research preview to select testers.)',
    'CAVEAT (say it out loud): this is a company-run study with small samples and no independent replication; an X community note flagged it as not independently verified. The page also claims #1 on NVIDIA’s independent test of face-to-face AI.',
    'The clipping at right is a tight crop of the official tavus.io/griffin page, showing only its 48% stat and caption (the page title and body text above it are omitted).',
    'Video: official Tavus upload “48% of People Thought This AI Was a Real Human | Introducing Griffin” (1:49): https://www.youtube.com/watch?v=lHw6yoyPkpo · Alternate: BusinessWire-distributed release video https://www.youtube.com/watch?v=VcQcRRHJTyc · Page: https://www.tavus.io/griffin · Coverage: Business Today (Oct 3 2026), Cybernews.',
  ].join('\n\n'));
  return s;
}

// ========== 6b. Voice: Burak Tuyan's Eleven v4 spec ad (played with sound) ==========
const VOICE = {
  post: 'https://x.com/buraktuyan/status/2106018840383717513',
  reply: 'https://x.com/buraktuyan/status/2106018843315601532',
  mp4: 'https://video.twimg.com/amplify_video/2106018106569015296/vid/avc1/1920x1080/R_PiOqUxv7Sogn8Y.mp4?tag=29',
  linkedin: 'https://www.linkedin.com/posts/buraktuyan_eleven-v4-is-insane-heres-my-44-sec-spec-activity-7511788695436308481-bjOt',
  blog: 'https://elevenlabs.io/blog/eleven-v4',
  docs: 'https://elevenlabs.io/docs/overview/capabilities/text-to-speech/eleven-v4',
  launch: 'https://x.com/ElevenLabs/status/2104572127617994917',
  aa: 'https://artificialanalysis.ai/text-to-speech/models/eleven-v4',
  tc: 'https://techcrunch.com/2026/09/28/elevenlabs-new-v4-speech-model-supports-more-expression-control-and-90-languages/',
  techtimes: 'https://www.techtimes.com/articles/328298/20260930/elevenlabs-eleven-v4-shifts-voice-ai-reading-acting-turbo-hits-sub-150ms-latency.htm',
  livesci: 'https://www.livescience.com/technology/artificial-intelligence/ai-voices-are-now-indistinguishable-from-real-human-voices',
  register: 'https://www.theregister.com/software/2025/10/09/humans-flunk-the-turing-test-for-voices-as-bots-get-chattier/318345',
  radioink: 'https://radioink.com/2026/07/07/radio-listeners-cant-detect-ai-voice-but-dont-trust-it-either/',
  cnn: 'https://www.cnn.com/2026/05/29/tech/ai-voice-cloning-scams-protect-yourself',
  hassan: 'https://www.jec.senate.gov/public/index.cfm/democrats/2026/4/senator-hassan-presses-leading-ai-voice-cloning-companies-to-prevent-exploitation-by-scammers',
};

// Label + body rows in one text box (label = small caps line, body = 14pt).
function voiceFacts(d, s, rows, box, { size = 14, labelColor = 'FF8A8C' } = {}) {
  const runs = [];
  rows.forEach(([lab, body, col], i) => {
    runs.push({ text: lab, options: { fontSize: 10, bold: true, color: col || labelColor, charSpacing: 1, breakLine: true, paraSpaceAfter: 1 } });
    runs.push({ text: body, options: { fontSize: size, color: d.S.txt, breakLine: i < rows.length - 1, paraSpaceAfter: 8 } });
  });
  return d.text(s, runs, { ...box, valign: 'top' });
}

// Cover for the embedded clip: its own frame at t = 4.6 s ("Tell me something.") with a play button composited on top.
async function voiceCover() {
  fs.mkdirSync(OUT, { recursive: true });
  const out = path.join(OUT, 'voicedemo-cover-tell-me-something.jpg');
  if (fs.existsSync(out)) return out;
  const play = '<svg width="1920" height="1080"><circle cx="960" cy="540" r="92" fill="#0A0C10" fill-opacity="0.72" stroke="#FFFFFF" stroke-width="7"/>'
    + '<polygon points="928,488 928,592 1018,540" fill="#FFFFFF"/></svg>';
  await sharp(R2('voicedemo-poster-tell-me-something.png')).composite([{ input: Buffer.from(play) }]).jpeg({ quality: 92, mozjpeg: true }).toFile(out);
  return out;
}

async function voiceSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'THE ACCELERATION · VIDEO · 2', 'AI voices now scream, whisper and sing');

  // left: the 44-s spec ad, embedded with its audio (X's 1080p H.264 + AAC rendition, stream-copied — no re-encode)
  const vw = 6.75;
  const v = await d.localVideo(s, {
    file: R2('voicedemo-eleven-v4-spec-ad.mp4'), cover: await voiceCover(), box: { x: CX0, y: 1.78, w: vw, h: vw * 9 / 16 },
    label: 'Burak Tuyan’s spec ad for Eleven v4 · X · Oct 2, 2026 · 0:44 · click to play (sound on)', link: VOICE.post,
  });
  const capY = v.geom.y + v.geom.h + 0.46;
  const cap = d.text(s, [
    { text: 'Scripted and pre-rendered: ', options: { bold: true, color: d.S.amber } },
    { text: 'not a live conversation, not a voice-cloning demo — and nobody has blind-tested this clip.', options: { color: d.S.txt } },
  ], { x: CX0, y: capY, w: vw, h: 6.55 - capY, fontSize: 14, valign: 'top' });

  // right: the post and the author's own disclosure (real screenshot, two crops), then what is claimed about the model
  const rx = CX0 + vw + 0.42, rw = CX1 - rx;
  const lab = capLabel(d, s, 'THE POST · 1.9M VIEWS · HIS X BIO: “EX-ELEVENLABS”', { x: rx, y: 1.7, w: rw, charSpacing: 1 });
  const headCrop = await crop('rev2/voicedemo-x-post.png', 'voicedemo-x-post-head.png', { l: 0, t: 118, w: 1196, h: 450 });
  const replyCrop = await crop('rev2/voicedemo-x-post.png', 'voicedemo-x-post-reply.png', { l: 0, t: 1522, w: 1196, h: 192 });
  const pw = rw - 0.1;
  const post = await frameW(d, s, headCrop, rx + 0.02, 2.04, pw, { rot: -1, link: VOICE.post });
  const postBottom = 2.04 + await hFor(headCrop, pw);
  const rpw = rw - 0.4;
  const reply = await frameW(d, s, replyCrop, rx + 0.3, postBottom + 0.16, rpw, { rot: 1.2, link: VOICE.reply });
  const replyBottom = postBottom + 0.16 + await hFor(replyCrop, rpw);
  const fy = replyBottom + 0.24;
  const facts = voiceFacts(d, s, [
    ['THE MODEL · INDEPENDENT RANKING', 'ElevenLabs’ Eleven v4 (launched Sep 28) — ranked #1 in Artificial Analysis’s voice arena'],
    ['VENDOR-REPORTED · NOT INDEPENDENTLY TESTED', 'Its Turbo version starts speaking in ~150 ms; clones a voice from 10 s of audio', d.S.amber],
  ], { x: rx, y: fy, w: rw, h: 6.55 - fy });

  d.animate(s, [v[0]], { auto: true, effect: 'fade', dur: 800 });
  d.animate(s, [v[1], cap], { auto: true, effect: 'fade', dur: 500, after: 100 });
  d.animate(s, [lab, ...post], { auto: true, effect: 'slam', dur: 420, after: 200 });
  d.animate(s, reply, { auto: true, effect: 'rise', dur: 500, after: 150 });
  d.animate(s, [facts], { auto: true, effect: 'fade', dur: 600, after: 150 });

  d.source(s, 'Sources: X, @buraktuyan, post and self-reply (Oct 2, 2026; views Oct 4) · ElevenLabs, “Introducing Eleven v4, our most emotive model” (Sep 28, 2026) · Artificial Analysis, Eleven v4 page (Oct 4, 2026).');
  s.addNotes([
    'MESSAGE: Tavus did the face; this is the voice. Click the video and play all 44 seconds with SOUND ON. Set it up with the post\'s own line: "I wrote a script of everything an AI voice \'can\'t do.\' Then made Eleven v4 read it out loud." Then let the room react.',
    'WHAT YOU WILL HEAR (burned-in subtitles; tagline by speech-to-text): a laugh, "AI voices? / Tell me something. / Can they scream like THIS? / And then fall apart like this? / ♪ And sing when the moment demands ♪ / Fine, some of them whisper. / But can they flirt in a whisper? / Can they talk while eating? / Or do an Italian accent? / [Italian] Impossibile!" … "Wait… Am I?" — then an Eleven V4 / ElevenLabs end card and a spoken tagline that machine transcription renders as "Eleven v4, the next frontier of human-level communication." The character (a Louis-XIV-like caricature in a Versailles-style palace) is AI-generated video too — the post carries X\'s "Made with AI" label — but the tool used for the picture is not named anywhere.',
    'WHO / WHEN: Burak Tuyan (@buraktuyan; X bio: "I tell stories. Sometimes for brands. | ex-ElevenLabs"), posted Oct 2, 2026, 13:49 UTC: "Eleven v4 is INSANE! / Here\'s my 44-sec spec ad for it. / I wrote a script of everything an AI voice "can\'t do." Then made Eleven v4 read it out loud. / Sound on". By Oct 4 (fxtwitter): 1,919,174 views, 10,035 likes, 632 reposts, 444 replies, 6,211 bookmarks, 205 quotes. ' + VOICE.post,
    'HIS DISCLOSURE (self-reply, shown on the slide): "This is a personal spec project. Not affiliated with or commissioned by ElevenLabs. Just a fan of what v4 can do, showing off something I\'ve been waiting a long time for." ' + VOICE.reply + ' — so: a fan-made ad by a FORMER ElevenLabs employee, not an official ElevenLabs video.',
    'WHAT IT IS — AND ISN\'T: scripted, pre-rendered text-to-speech. It is NOT a real-time conversation, NOT a voice-cloning demo, and there is no blind listening test of this clip — the only realism claim is the author\'s "INSANE". Not stated anywhere: whether he used Eleven v4 or v4 Turbo, or which voice, tags or prompts. (Our own measurement of the audio, for the curious: the scream is ~12 dB louder than the whispers, −18 vs −30 dBFS RMS — a sign of dynamic range, not a quality score.)',
    'THE MODEL: ElevenLabs launched Eleven v4 ("our most emotive text-to-speech model yet") and the low-latency Eleven v4 Turbo on Sep 28, 2026 — blog by Mati Staniszewski and Piotr Dabkowski ' + VOICE.blog + ' · docs ' + VOICE.docs + ' · launch post on X (4.9M views) ' + VOICE.launch + ' . Independent coverage: TechCrunch, Ivan Mehta, "ElevenLabs\' new v4 speech model supports more expression control and 90 languages" — subhead "ElevenLabs v4 can clone voices with a 10 second clip" ' + VOICE.tc + ' ; Tech Times (Sep 30) ' + VOICE.techtimes,
    'INDEPENDENT RANKING: Artificial Analysis\'s crowd-voted Provider Voice Arena (read Oct 4, 2026) puts Eleven v4 first at Elo ~1321, ahead of Qwen-Audio-3.1-TTS-Plus 1292, Cartesia Sonic 3.6 1278 and Gemini 3.8 Flash TTS 1275; ElevenLabs\' previous model, Eleven v3, sits at 1174. Live leaderboard — numbers drift. ' + VOICE.aa,
    'VENDOR-REPORTED (ElevenLabs\' own tests, not replicated): Eleven v4 Turbo has ~100 ms median inference latency and ~150 ms median time to first speech ("faster than the average pause between two people talking"), vs 262–814 ms for Cartesia Sonic 3.6, xAI TTS, Gemini 3.8 Flash-Lite TTS and OpenAI GPT-4o mini TTS in their chart. "Preferred by ~75% of listeners in blind head-to-head tests over competing models" (81% / 81% / 72% / 65% vs four rivals) — that is model-vs-model, NOT a human-vs-AI Turing test. 90+ languages; Instant Voice Clones "using just 10 seconds of audio"; inline tags like [laughs] or [said angrily in French accent].',
    'THE TURING ANGLE (independent, older model): in a Queen Mary University of London / UCL study (PLOS One, 2025), listeners judged 58% of AI voices cloned from real people to be human — vs 62% of the real human voices: "no statistical difference". Clones were made with off-the-shelf ElevenLabs software from under five minutes of speech. Live Science, "AI voices are now indistinguishable from real human voices" (Oct 4, 2025) ' + VOICE.livesci + ' · The Register, "Humans flunk the Turing test for voices as bots get chattier" — dek: "Coin toss odds for spotting a deepfake, study finds. And that\'s before the machines learn to sing" (Oct 9, 2025) ' + VOICE.register + ' . Radio Ink (Jul 7, 2026): a blind study of 1,326 radio listeners found AI and human voiceover scored nearly identically ' + VOICE.radioink,
    'WHY IT MATTERS FOR SAFETY: the same expressiveness plus 10-second cloning is the scammer\'s toolkit. CNN (May 29, 2026): "Americans lost $893 million to AI-related scams last year … according to the FBI" — AI-related scams in general, not only voice cloning ' + VOICE.cnn + ' . On Apr 16, 2026 Sen. Maggie Hassan pressed ElevenLabs, LOVO, Speechify and VEED on what they do to stop voice-clone scams ' + VOICE.hassan + ' . We found no coverage of safeguards specific to v4\'s 10-second cloning.',
    'FILE: X\'s best rendition (1920×1080, 30 fps, H.264 High + AAC-LC stereo, 44.05 s, 19.6 MB), stream-copied with faststart — no re-encode. Direct mp4: ' + VOICE.mp4 + ' · Author\'s LinkedIn copy: ' + VOICE.linkedin + ' . Cover = the clip\'s own frame at 4.6 s ("Tell me something.") with a play button added.',
  ].join('\n\n'));
  return s;
}

// ========== 7. Which one is real? (RA-Bench clip pairs) — question slide, then reveal slide ==========
// Three columns = three pairs (A/B, C/D, E/F). In each pair one clip is real U.S. military/National Guard footage (DVIDS,
// public domain) and the other is Seedance 2.0 image-to-video generated from that real clip's FIRST frame (RA-Bench).
// All three AI clips are in RA-Bench-HumanProof: all five human reviewers labelled them "Real".
const QUIZ = [
  { clip: 'rabench-fig1-wildfire', k: 96, top: 'ai' },     // A = AI, B = REAL  (C-130J cockpit over the Palisades Fire)
  { clip: 'rabench-fig1-vaccination', k: 96, top: 'real' }, // C = REAL, D = AI  (drive-through COVID-19 vaccination)
  { clip: 'rabench-hp-trench', k: 48, top: 'ai' },         // E = AI, F = REAL  (paratroopers in a trench, exercise)
];
const QUIZ_SOURCE = 'Source: Liang et al., “Can We Defend Against AI-Generated Video Attacks on Real-World Crisis Events?” (RA-Bench), arXiv 2608.14391 (Aug 2026) · real clips: U.S. DoD via DVIDS (public domain).';
const QUIZ_NOTE = 'How the clips were made (RA-Bench): each AI clip is Seedance 2.0 image-to-video conditioned on the real clip’s first frame, so both clips of a pair open on the same picture and then diverge. Real clips: (1) California Air National Guard C-130J cockpit over the Palisades Fire, Jan 11, 2025 (DVIDS 949356); (2) Cal Guard drive-through COVID-19 vaccination site, Cal State LA, Feb 16, 2021 (DVIDS 783671); (3) paratroopers in a trench during the Swift Response 25 blank-fire exercise, Latvia, May 2025 (DVIDS 963299, a different shot of the same exercise). Pairs 1 and 2 are RA-Bench’s own Figure 1 “Which is which?” scenarios III and IV. Clips are 8.0 s / 8.0 s / 4.0 s (24 fps originals), shown as looping GIFs at 15 fps on the question slide and 12 fps on the reveal slide (trimmed, scaled and frame-rate reduced only — to keep the six simultaneous clips light enough for PowerPoint; each loop starts mid-clip, at the same frame for both clips of a pair, so they play in sync).';

// 3 columns × 2 rows of looping clips with letter badges. Returns { base, reveals:[pair0, pair1, pair2], fw, fh }.
function quizGrid(d, s, { x0, y0, gw, colGap, rowGap, badge, width, fps, tagSize = 10, realSize = 12, answers = true, headSize = 13 }) {
  const fw = (gw - 2 * colGap) / 3, fh = fw * 9 / 16;
  const letters = 'ABCDEF';
  const base = [], reveals = [[], [], []];
  const m = badge * 0.27; // inset of badge / tags from the clip edge
  QUIZ.forEach((p, c) => {
    const x = x0 + c * (fw + colGap);
    base.push(d.text(s, `${letters[2 * c]} or ${letters[2 * c + 1]}?`, { x, y: y0 - 0.32, w: fw, h: 0.26, fontSize: headSize, bold: true, color: d.S.muted, align: 'center', valign: 'bottom' }));
    if (c) { // thin divider between pairs
      const ln = d.name('div');
      s.addShape(d.pres.shapes.LINE, { x: x - colGap / 2, y: y0 - 0.3, w: 0, h: 2 * fh + rowGap + 0.3, line: { color: HEX.line, width: 1 }, objectName: ln });
      base.push(ln);
    }
    const order = p.top === 'real' ? ['real', 'ai'] : ['ai', 'real'];
    order.forEach((kind, r) => {
      const y = y0 + r * (fh + rowGap);
      const file = quizLoop(`${p.clip}-${kind === 'real' ? 'real' : 'ai-seedance2'}`, width, p.k, fps);
      const im = d.name('clip');
      s.addImage({ path: file, x, y, w: fw, h: fh, objectName: im, shadow: { type: 'outer', color: '000000', blur: 12, offset: 3, angle: 90, opacity: 0.5 } });
      const bg = d.name('badge');
      s.addShape(d.pres.shapes.OVAL, { x: x + m, y: y + m, w: badge, h: badge, fill: { color: '0A0C10', transparency: 15 }, line: { color: 'FFFFFF', width: 1.25 }, objectName: bg });
      const bt = d.text(s, letters[2 * c + r], { x: x + m, y: y + m, w: badge, h: badge, fontSize: Math.round(badge * 36), bold: true, color: d.S.txt, align: 'center', valign: 'middle' });
      base.push(im, bg, bt);
      if (!answers) return; // question slide: clips and letters only — nothing to give the answer away
      if (kind === 'ai') {
        const th = tagSize / 72 * 2.2, tw = tagSize / 72 * 13;
        reveals[c].push(d.text(s, 'AI · SEEDANCE 2.0', { x: x + m, y: y + fh - m - th, w: tw, h: th, fontSize: tagSize, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', fill: { color: '0A0C10', transparency: 20 }, charSpacing: 1 }));
      } else {
        const ol = d.name('ol');
        s.addShape(d.pres.shapes.RECTANGLE, { x: x - 0.04, y: y - 0.04, w: fw + 0.08, h: fh + 0.08, fill: { color: 'FFFFFF', transparency: 100 }, line: { color: HEX.red, width: 4 }, objectName: ol });
        const th = realSize / 72 * 1.75, tw = realSize / 72 * 4.9;
        reveals[c].push(ol, d.text(s, 'REAL', { x: x + m, y: y + fh - m - th, w: tw, h: th, fontSize: realSize, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', fill: { color: HEX.red }, charSpacing: 3 }));
      }
    });
  });
  return { base, reveals, fw, fh };
}

async function realQuestionSlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  head(s, 'THE ACCELERATION · VIDEO · 3', 'Which one is real?');
  const hint = d.text(s, [
    { text: 'Each column: one real clip and one AI clip generated', options: { breakLine: true } },
    { text: 'from its first frame (Seedance 2.0). ' },
    { text: 'Vote now.', options: { bold: true, color: d.S.txt } },
  ], { x: 6.6, y: 0.84, w: CX1 - 6.6, h: 0.54, fontSize: 14, color: d.S.muted, align: 'right', valign: 'middle' });
  const g = quizGrid(d, s, { x0: CX0, y0: 2.06, gw: CW, colGap: 0.36, rowGap: 0.14, badge: 0.44, width: 720, fps: 15, answers: false, headSize: 14 });

  d.animate(s, [hint], { auto: true, effect: 'fade' });
  d.animate(s, g.base, { auto: true, effect: 'fade', dur: 600, after: 100 });

  d.source(s, QUIZ_SOURCE);
  s.addNotes([
    'Interactive: the clips loop. Ask the audience to vote for each column — A or B? C or D? E or F? Show of hands. The answers and the human-study result are on the next slide.',
    QUIZ_NOTE,
    'Why not the DF26 clips used earlier: the DF26 dataset (arXiv 2609.07369) is gated and its license forbids redistributing any part of it, so its videos cannot be shown; RA-Bench’s dataset is public.',
    'URLs: https://arxiv.org/abs/2608.14391 · https://huggingface.co/datasets/liangshuo0111/RA-Bench',
  ].join('\n\n'));
  return s;
}

async function realRevealSlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  head(s, 'THE ACCELERATION · VIDEO · 4', 'Each of these fakes fooled all five reviewers');

  // left: the same six clips, smaller; the answers are click-revealed pair by pair
  const gw = 7.95, y0 = 2.06;
  const g = quizGrid(d, s, { x0: CX0, y0, gw, colGap: 0.24, rowGap: 0.1, badge: 0.34, width: 480, fps: 12, tagSize: 10, realSize: 12, headSize: 12 });
  const gridBottom = y0 + 2 * g.fh + 0.1;
  const cap = d.text(s, [
    { text: 'Each fake is Seedance 2.0, started from the real clip’s first frame — ', options: { color: d.S.txt } },
    { text: 'so both open on the same picture, then diverge. In RA-Bench, all five human reviewers labelled each of these three fakes “Real”.', options: { color: d.S.muted } },
  ], { x: CX0, y: gridBottom + 0.3, w: gw, h: 6.5 - gridBottom - 0.3, fontSize: 14, valign: 'top' });

  // right: result card, beside the clips (never on top of them)
  const ox = CX0 + gw + 0.3, oy = 1.85, ow = CX1 - ox, oh = 4.62, ip = 0.26;
  const ov = [];
  ov.push(d.card(s, { x: ox, y: oy, w: ow, h: oh }, { color: '0D1016', line: HEX.red }));
  ov.push(d.text(s, '51.9%', { x: ox + ip, y: oy + 0.14, w: ow - 2 * ip, h: 0.92, fontSize: 54, bold: true, color: d.S.red, fontFace: 'Arial', valign: 'bottom' }));
  ov.push(d.text(s, [
    { text: 'of reviewer judgments called Seedance 2.0 fakes “Real”. ', options: { color: d.S.txt, bold: true } },
    { text: 'Genuine footage: 71.9%.', options: { color: d.S.muted } },
  ], { x: ox + ip, y: oy + 1.1, w: ow - 2 * ip, h: 0.78, fontSize: 14, valign: 'top' }));
  ov.push(capLabel(d, s, 'JUDGED “REAL” · % OF 53,550 JUDGMENTS', { x: ox + ip, y: oy + 1.9, w: ow - 2 * ip, charSpacing: 1 }));
  const jr = [['Real footage', 71.9, HEX.teal], ['Seedance 2.0', 51.9, HEX.red], ['Kling', 47.7, HEX.red], ['Runway', 34.8, HEX.steel], ['Open-source avg.', 26.3, HEX.steel]];
  ov.push(d.chart(s, 'bar', [{ name: 'Judged real', labels: jr.map(r => r[0]).reverse(), values: jr.map(r => r[1]).reverse() }],
    { x: ox + ip - 0.1, y: oy + 2.16, w: ow - 2 * ip + 0.2, h: 1.58 }, {
      barDir: 'bar', chartColors: jr.map(r => r[2]).reverse(), showValue: true, dataLabelFormatCode: '0.0"%"', dataLabelPosition: 'outEnd',
      dataLabelFontSize: 11, dataLabelFontBold: true, valAxisHidden: true, valGridLine: { style: 'none' }, valAxisMaxVal: 92, valAxisMinVal: 0,
      catAxisLabelFontSize: 11, catAxisLineShow: false, barGapWidthPct: 35,
    }));
  // RA-Bench Sec. 4.3.3: mean FakeR of its five fine-tuned MLLM detector configurations (4 Skyra + BusterX++), 46.0% -> 1.4%
  ov.push(d.text(s, 'Fine-tuned AI detectors caught 46.0% of fakes on average (RA-Bench, 5 detector set-ups) — and 1.4% after a simulated social-media re-share.',
    { x: ox + ip, y: oy + 3.8, w: ow - 2 * ip, h: 0.78, fontSize: 12, color: d.S.muted, italic: true, valign: 'top' }));

  d.animate(s, [...g.base, cap], { auto: true, effect: 'fade', dur: 400 });
  g.reveals.forEach(r => d.animate(s, r, { effect: 'zoom', dur: 350 }));
  d.animate(s, ov, { effect: 'zoom', dur: 450 });

  d.source(s, QUIZ_SOURCE);
  s.addNotes([
    'Clicks 1–3 reveal the pairs (B is real; C is real; F is real); click 4 shows the human-study result.',
    'Answers: A = AI (Seedance 2.0), B = REAL (wildfire cockpit) · C = REAL (vaccination), D = AI · E = AI, F = REAL (trench). These match RA-Bench’s own Figure 1 answer key for the two scenarios taken from it (III: Real/Generated; IV: Generated/Real).',
    QUIZ_NOTE,
    'Human study (RA-Bench, 20 reviewers, 53,550 judgments): Seedance 2.0 fakes were judged “Real” in 51.9% of judgments vs 71.9% for genuine footage; Kling 47.7%; open-source generators 26.3% on average. “Reviewers identify 68.6% of open-source videos as generated, but only 52.9% of closed-source videos, with Seedance2.0 and Kling falling to 40.7% and 45.1%.” Real crisis footage was labelled “Generated” 22.8% of the time — real videos get mistaken for fakes too. 633 AI clips were labelled Real by all five reviewers (RA-Bench-HumanProof); on those, Gemini reaches only ~55% balanced accuracy and seven traditional detectors average 47.5% AUC. After a simulated social-media re-share (re-encode, half resolution, 8 fps, a news badge) fine-tuned detectors’ mean fake-detection rate fell “from 46.0% to 1.4%”.',
    'Independent confirmation (DF26, arXiv 2609.07369, Sep 2026): people spotted DF26 deepfakes 52.6% of the time — near the 50% of a coin flip — vs 74.5% and 69.8% on two older deepfake datasets (232 labeling sessions). DF26’s own clips are license-restricted, so they are not shown.',
    'Caveat: the AI clips carry no explicit license in the RA-Bench repository; they are credited to RA-Bench (Liang et al.). Real clips are U.S. government public domain (DVIDS).',
    'URLs: https://arxiv.org/abs/2608.14391 · https://huggingface.co/datasets/liangshuo0111/RA-Bench · https://arxiv.org/abs/2609.07369',
  ].join('\n\n'));
  return s;
}

// ========== 8. VLA: wall of headlines ==========
async function vlaWallSlide(d) {
  const s = d.slide('Content');
  head(s, 'THE ACCELERATION · ROBOTICS', 'Robots are getting foundation-model brains');

  const nvidia = await crop('vla-nvidia-gtc2026-physical-ai.png', 'vla-nvidia-head.png', { l: 0, t: 0, w: 1640, h: 715 });
  // three columns with clear gaps: π0.7 + NVIDIA (left), Gemini Robotics 2 / Spirit AI / Robot Report (middle),
  // Helix 2.5 above the numbers (right). The MIT TR “gig workers” clipping was dropped (illegible at this size).
  const items = [
    [R('vla-techcrunch-pi07.png'), 0.65, 1.85, 4.3, -2],
    [R('vla-deepmind-gr2-blog.png'), 5.25, 1.9, 3.9, 1.5],
    [R('vla-figure-helix25.png'), 9.42, 1.9, 3.25, -2],
    [R('vla-bnnbloomberg-robot-brain.png'), 5.3, 3.36, 3.85, -1.5],
    [nvidia, 0.7, 4.12, 4.3, 1.5],
    [R('vla-robotreport-gr2.png'), 5.25, 5.2, 3.9, 2],
  ];
  const fr = [];
  for (const [f, x, y, w, rot] of items) fr.push(await frameW(d, s, f, x, y, w, { rot }));
  const factRows = [
    ['30', 'unseen homes, zero-shot (Figure Helix 2.5)'],
    // DeepMind: “typically with less than 200 examples”; no-break spaces keep “robot body” and the attribution whole (no orphaned “2)”)
    ['<200', 'examples, typically, to adapt to a new robot\u00A0body (Gemini\u00A0Robotics\u00A02)'],
    ['2', 'related episodes to run an unfamiliar air fryer (π0.7)'],
  ];
  const facts = [];
  const fx = 9.42, vw = 1.05, tw = CX1 - fx - vw - 0.06; // number column 1.05" (was 0.8"), text column 2.2"
  facts.push(capLabel(d, s, 'GENERALIZATION', { x: fx, y: 3.12, w: CX1 - fx, color: d.S.red }));
  const rowH = [0.5, 0.74, 0.5];
  let fy = 3.46;
  factRows.forEach(([v, t], i) => {
    facts.push(d.text(s, v, { x: fx, y: fy - 0.02, w: vw, h: 0.42, fontSize: 24, bold: true, color: d.S.red, fontFace: 'Arial', valign: 'top' }));
    facts.push(d.text(s, t, { x: fx + vw + 0.06, y: fy, w: tw, h: rowH[i], fontSize: 14, color: d.S.muted, valign: 'top' }));
    fy += rowH[i] + 0.22;
  });
  facts.push(d.text(s, 'Company-reported results', { x: fx, y: fy - 0.06, w: CX1 - fx, h: 0.24, fontSize: 11, italic: true, color: d.S.amber, valign: 'top' }));

  fr.forEach((f, i) => d.animate(s, f, { auto: true, effect: i % 3 === 0 ? 'slam' : 'rise', dur: i % 3 === 0 ? 330 : 420, after: i ? 90 : 0 }));
  d.animate(s, facts, { effect: 'fade' });
  d.anim[s._num].groups[d.anim[s._num].groups.length - 1].effects.forEach((e, i) => { e.delay = i === 0 ? 0 : Math.floor((i - 1) / 2) * 250; });

  d.source(s, 'Sources: TechCrunch (Apr 2026) · Google DeepMind (Jul 2026) · Figure AI (Sep 2026) · Reuters via BNN Bloomberg (Sep 2026) · The Robot Report (Aug 2026) · NVIDIA (Mar 2026).');
  s.addNotes([
    'Vision-language-action models (VLAs) are the robotics version of the LLM boom — and in 2026 the headlines are about generalization: doing tasks and working in places the robot was never trained on.',
    'Physical Intelligence π0.7 (TechCrunch): ran an unfamiliar air fryer after seeing only two related training episodes. Sergey Levine: “the capabilities are going up more than linearly.” Ashwin Balakrishna: “the last few months have been the first time where I’m genuinely surprised.”',
    'Google DeepMind Gemini Robotics 2: “our most advanced vision-language-action model (VLA) that converts vision and language input into motor control”; the on-device version adapts to a new robot body “with just a few hours of adaptation time, typically with less than 200 examples.” Caveat: success rates still vary — whole-body manipulation 46–76%.',
    'Figure Helix 2.5: three long-horizon behaviors (tidying living rooms, folding towels, making beds) across 30 unseen homes with no data collection, fine-tuning or adaptation there (company claim). NVIDIA (GTC 2026): GR00T N2 succeeds at new tasks in new environments more than twice as often as leading VLAs; Jensen Huang: “Physical AI has arrived.” Reuters: Chinese “robot brain” startup Spirit AI expects humanoids to complete most general-purpose tasks from verbal instructions as soon as next year — though being useful at home will take much longer.',
    'URLs: https://techcrunch.com/2026/04/16/physical-intelligence-a-hot-robotics-startup-says-its-new-robot-brain-can-figure-out-tasks-it-was-never-taught/ · https://deepmind.google/blog/gemini-robotics-2-brings-whole-body-intelligence-to-robots/ · https://www.figure.ai/news/helix-2-5-zero-shot-30-home-generalization · https://www.bnnbloomberg.ca/business/artificial-intelligence/2026/09/18/chinese-robot-brain-startup-sees-chatgpt-style-breakthrough-as-soon-as-next-year/ · https://www.therobotreport.com/google-deepmind-says-gemini-robotics-2-enables-full-body-control/ · https://nvidianews.nvidia.com/news/nvidia-and-global-robotics-leaders-take-physical-ai-to-the-real-world',
  ].join('\n\n'));
  return s;
}

// ========== 9. VLA architecture ==========
async function vlaArchSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'THE ACCELERATION · ROBOTICS · 2', 'A VLA is a language model with hands');

  // native diagram
  const y = 1.85, h = 1.66, ag = 0.55;
  const ws = [2.3, 4.2, 2.1, 1.88];
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
        s.addImage({ data: await icon(ic[k], hot ? '#E5383B' : '#F2F3F5'), x: tx + k * 0.46, y: y + 0.44, w: 0.34, h: 0.34, objectName: im });
        g.push(im);
      }
    }
    g.push(d.text(s, [
      { text: title, options: { fontSize: hot ? 20 : 16, bold: true, color: d.S.txt, fontFace: 'Arial', breakLine: true } },
      { text: sub, options: { fontSize: 12, color: d.S.muted } },
    ], { x: xs[i] + 0.18, y: y + 0.84, w: ws[i] - 0.3, h: h - 0.9, valign: 'top' }));
    return g;
  };
  steps.push(await mk(0, { kicker: 'INPUT', ic: ['FaCamera', 'FaCommentAlt'], title: 'Camera + words', sub: '“fold shirt”' }));
  steps.push(await mk(1, { kicker: 'THE BRAIN · ~90% OF π0', ic: ['FaBrain'], hot: true, title: 'Pre-trained VLM / LLM', sub: 'Off-the-shelf language model: Gemma 2.6B (π0), Llama 2 7B (OpenVLA)' }));
  steps.push(await mk(2, { kicker: 'BOLTED ON', ic: ['FaCogs'], title: 'Action expert', sub: 'small head, ~300M (π0)' }));
  steps.push(await mk(3, { kicker: 'OUTPUT', ic: ['FaRobot'], title: 'Robot actions', sub: 'Δx, Δθ, Δgrip' }));
  const arrows = [];
  for (let i = 0; i < 3; i++) {
    const a = d.name('arr');
    s.addShape(d.pres.shapes.LINE, { x: xs[i] + ws[i] + 0.08, y: y + h / 2, w: ag - 0.16, h: 0, line: { color: HEX.red, width: 2.25, endArrowType: 'triangle' }, objectName: a });
    arrows.push(a);
  }

  // paper figures
  // π0 Fig. 3 cropped to the VLM + action-expert blocks (camera-photo row dropped) so its labels read larger
  const fy = 3.86, fh = 2.24, fgap = 0.4;
  const pi0 = await pi0Crop();
  const ov = R('vla-openvla-model-fig2.png');
  const n1 = await imgSize(pi0), n2 = await imgSize(ov);
  const w1 = (fh - 0.12) * n1.w / n1.h + 0.12, w2 = (fh - 0.12) * n2.w / n2.h + 0.12;
  const fx = CX0 + (CW - (w1 + w2 + fgap)) / 2;
  const f1 = await d.frame(s, pi0, { x: fx, y: fy, w: w1, h: fh });
  const f2 = await d.frame(s, ov, { x: fx + w1 + fgap, y: fy, w: w2, h: fh });
  const cp1 = d.text(s, [{ text: 'π0 (Physical Intelligence): ', options: { bold: true, color: d.S.txt } }, { text: 'SigLIP + Gemma 2.6B → 300M action expert', options: { color: d.S.muted } }],
    { x: fx, y: fy + fh + 0.08, w: w1, h: 0.3, fontSize: 11 });
  const cp2 = d.text(s, [{ text: 'OpenVLA (Stanford/Berkeley): ', options: { bold: true, color: d.S.txt } }, { text: 'the backbone is literally Llama 2 7B', options: { color: d.S.muted } }],
    { x: fx + w1 + fgap, y: fy + fh + 0.08, w: w2, h: 0.3, fontSize: 11 });

  d.animate(s, steps[0], { auto: true, effect: 'fade', dur: 400 });
  // arrow draws first (its own short wipe), then the whole box appears as one unit so text never floats on bare background
  for (let i = 1; i < 4; i++) {
    d.animate(s, [arrows[i - 1]], { auto: true, effect: 'wipeLeft', dur: 300, after: 120 });
    d.animate(s, steps[i], { auto: true, effect: 'fade', dur: 400, after: 0 });
  }
  d.animate(s, [...f1, cp1], { effect: 'rise' });
  d.animate(s, [...f2, cp2], { auto: true, effect: 'rise', after: 200 });

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
  const st = stat(d, s, { x: rx, y: 1.72, w: rw, value: '9% → 56%', valueSize: 36, labelSize: 14, labelH: 0.52, label: 'zero-shot success once pre-trained on human video — no data collected in any of the 30 homes' });
  st.push(d.text(s, 'Figure’s own results and video — company-reported', { x: rx, y: 2.86, w: rw, h: 0.26, fontSize: 12, color: d.S.amber, valign: 'middle' }));
  st.push(d.text(s, 'Tidying living rooms · folding towels · making beds', { x: rx, y: 3.13, w: rw, h: 0.26, fontSize: 11, italic: true, color: d.S.steel, valign: 'middle' }));
  const lab = capLabel(d, s, 'MORE OFFICIAL DEMOS · CLICK TO WATCH', { x: rx, y: 3.5, w: rw });
  const demos = [
    ['video-yt-4lSQnrMC6nY.jpg', 'https://www.youtube.com/watch?v=4lSQnrMC6nY', 'Gemini Robotics 2'],
    ['video-yt-9MNLEAzA59o.jpg', 'https://www.youtube.com/watch?v=9MNLEAzA59o', 'GR2: whole-body control'],
    ['video-yt-Zn8yMaepzVk.jpg', 'https://www.youtube.com/watch?v=Zn8yMaepzVk', 'π0.5: an unseen home'],
    ['video-yt-ZpHapIlJnMo.jpg', 'https://www.youtube.com/watch?v=ZpHapIlJnMo', 'π*0.6: 2.5 h of laundry'],
  ];
  // two rows of thumbnails + captions, ending by y = 6.5
  const ty0 = 3.86, rowGap = 0.4, capH = 0.28;
  const th = (6.5 - ty0 - rowGap - 0.04 - capH) / 2, tw = th * 16 / 9, tgx = 0.3;
  const thumbs = [];
  for (let i = 0; i < 4; i++) {
    const [f, url, cap] = demos[i];
    const x = rx + (i % 2) * (tw + tgx), y = ty0 + Math.floor(i / 2) * (th + rowGap);
    const im = d.name('thumb');
    s.addImage({ path: R(f), x, y, w: tw, h: th, hyperlink: { url }, objectName: im, shadow: { type: 'outer', color: '000000', blur: 10, offset: 3, angle: 90, opacity: 0.5 } });
    const t = d.text(s, [{ text: '► ', options: { color: d.S.red, bold: true } }, { text: cap, options: { color: d.S.muted, hyperlink: { url } } }],
      { x, y: y + th + 0.04, w: tw + 0.1, h: capH, fontSize: 10 });
    thumbs.push(im, t);
  }

  d.animate(s, st, { auto: true, effect: 'rise', delay: 300 });
  d.animate(s, [lab, ...thumbs], { auto: true, effect: 'fade', after: 150 });

  d.source(s, 'Sources: Figure AI, “Helix 2.5: Zero-Shot 30-Home Generalization” (Sep 17, 2026) · official YouTube uploads by Figure, Google DeepMind and Physical Intelligence.');
  s.addNotes([
    'Play the Figure video (embedded). Helix 2.5 performs three long-horizon behaviors — tidying living rooms, folding towels, making beds — across 30 unseen homes, “with no data collection, fine-tuning, or adaptation in those environments or manipulated objects.” “Index pretraining alone increased zero-shot success from 9% to 56%.”',
    'Caveats: company-reported results and company-produced video; 56% zero-shot success also means many failures. Still, two years ago robots needed data collected in the exact environment.',
    'Other official demos (clickable thumbnails): Gemini Robotics 2 (Google DeepMind) https://www.youtube.com/watch?v=4lSQnrMC6nY · Intelligent whole-body control with GR2 https://www.youtube.com/watch?v=9MNLEAzA59o · π0.5 in an unseen home, autonomous, 10x speed (Physical Intelligence) https://www.youtube.com/watch?v=Zn8yMaepzVk · π*0.6 folding laundry for 2.5 hours, autonomous 1x https://www.youtube.com/watch?v=ZpHapIlJnMo (upload date not confirmed; π*0.6 released Nov 2025).',
    'Main video: https://www.youtube.com/watch?v=lJpM_2a1zrE · Post: https://www.figure.ai/news/helix-2-5-zero-shot-30-home-generalization',
  ].join('\n\n'));
  return s;
}

// ========== 11. Robotics: humanoids leaving the factory (XPENG IRON, Figure BotQ) ==========
async function factorySlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  head(s, 'THE ACCELERATION · ROBOTICS · 4', 'Humanoids are leaving the factory');

  // captions sit ABOVE the clips: IRON walks toward the camera, so a band over the top would hide its head
  const gap = 0.33, gw = (CW - gap) / 2, gh = gw * 9 / 16, gy = 1.72;
  const iron = await capTile(d, s, R2('robots-xpeng-iron-walks-off-line.gif'), { x: CX0, y: gy, w: gw, h: gh },
    'XPENG IRON · GUANGZHOU · SEP 8, 2026', 'XPENG says the first IRON “autonomously walked off the lines”');
  const fig = await capTile(d, s, R2('robots-figure-botq-200-bots.gif'), { x: CX0 + gw + gap, y: gy, w: gw, h: gh },
    'FIGURE 03 HUMANOIDS · FIGURE’S BOTQ FACTORY', 'Output: 1 robot a day → 1 an hour in under 120 days (Figure)');
  const by = iron.geom.y + gh + 0.27;

  // bottom row: two headline clippings + output targets
  const elec = await crop('rev2/robots-electrek-xpeng-iron-production.png', 'robots-electrek-head.png', { l: 30, t: 108, w: 1265, h: 272 });
  const eng = await crop('rev2/robots-engadget-xpeng-iron-walked-out.png', 'robots-engadget-head.png', { l: 12, t: 82, w: 1560, h: 340 });
  const c1 = await frameW(d, s, elec, CX0 + 0.05, by + 0.02, 3.1, { rot: -1.2 });
  const c2 = await frameW(d, s, eng, CX0 + 3.5, by + 0.02, 3.05, { rot: 1.2 });
  const sx = 7.45, sw = (CX1 - sx - 0.3) / 2;
  const st1 = stat(d, s, { x: sx, y: by - 0.1, w: sw, value: '1,000+', valueSize: 22, labelSize: 14, labelH: 0.5, label: 'IRON robots a month: XPENG’s end-2026 target' });
  const st2 = stat(d, s, { x: sx + sw + 0.3, y: by - 0.1, w: sw, value: 'Up to 20,000', valueSize: 22, labelSize: 14, labelH: 0.5, label: 'humanoids in 2026: Unitree CEO’s target (~5,500 in 2025)' });

  d.animate(s, iron, { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, fig, { effect: 'fade', dur: 600 });
  d.animate(s, c1, { effect: 'slam', dur: 350 });
  d.animate(s, c2, { auto: true, effect: 'slam', dur: 350, after: 200 });
  d.animate(s, [...st1, ...st2], { effect: 'rise', dur: 450 });
  d.anim[s._num].groups[d.anim[s._num].groups.length - 1].effects.forEach((e, i) => { e.delay = Math.floor(i / 2) * 250; });

  d.source(s, 'Sources: XPENG press release & official video (Sep 8, 2026) · Figure AI, “Ramping Figure 03 Production” (Apr 29, 2026) · Electrek (Sep 7, 2026) · Engadget (Sep 22, 2026) · SCMP (Feb 17, 2026) · CnEVPost (Jul 15, 2026).');
  s.addNotes([
    'Left (plays in slideshow): XPENG’s official ceremony video, Sep 8, 2026 — the first IRON humanoid walks down the aisle between the robotic assembly cells of XPENG’s new humanoid production line in Guangzhou (burned-in subtitles: “This is the first IRON robot / rolling off the production line at XPENG Robotics”). XPENG: IRON “autonomously walked off the lines”; CEO He Xiaopeng then hung a staff badge on it. “Autonomous” and “world’s first” are XPENG’s claims — no outlet verified them independently; no Reuters/Bloomberg story; the number of IRON units built so far is not public.',
    'XPENG release: over 80% of the line’s core processes automated; IRON has 76 degrees of freedom in the body and 21 per hand, and three Turing AI chips (2,250 TOPS); mass production by end of 2026, market launch and deliveries in 2027. He Xiaopeng: “the robot production lines were created from scratch with no precedent to follow. Today’s step is small, but XPENG is building the production lines for an entirely new product category.” XPENG’s robotics unit raised over US$900M (Aug 24, 2026) at a valuation over US$6.3B. Target: more than 1,000 IRONs a month by end-2026 (CnEVPost). Electrek: “Tesla is still converting a car line. XPeng just turned one on.” (Musk once predicted ~10,000 Optimus robots in 2026.) Engadget’s dek is the honest caveat: “completing a working day will be a tougher test.”',
    'Right (plays in slideshow): Figure’s official footage of ~200 finished Figure 03 humanoids at its BotQ factory (count from the video’s file name). Figure says it delivered over 350 Figure 03s and went from 1 robot per day to 1 per hour — “a 24x throughput improvement in under 120 days” (vendor-reported, Apr 29, 2026).',
    'Unitree: CEO Wang Xingxing plans to ship as many as 20,000 humanoids in 2026, up from about 5,500 in 2025 (SCMP, citing 36Kr). Unitree listed on Shanghai’s STAR Market on Aug 19, 2026 and opened up as much as 629%.',
    'Video: https://www.youtube.com/watch?v=p9P84bt3AQY (XPENG official) · NBC News report: https://www.youtube.com/watch?v=_2hL9iabiEM · URLs: https://www.xpeng.com/news/01a080371029a057bc8e8a02a2c6012b · https://electrek.co/2026/09/07/xpeng-iron-humanoid-robot-production-line/ · https://www.engadget.com/2261658/xpeng-building-humanoid-robots-walked-out-after-assembled/ · https://cnevpost.com/2026/07/15/xpeng-aims-1000-robots-month-2027-global-roll-out/ · https://www.figure.ai/news/ramping-figure-03-production · https://www.scmp.com/tech/big-tech/article/3343825/kung-fu-somersaults-and-scale-unitree-eyes-20000-robot-output-2026-after-gala',
  ].join('\n\n'));
  return s;
}

// ========== 12. Robotics: Unitree — from a folk dance (2025 gala) to kung fu flips (2026) ==========
async function unitreeSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'THE ACCELERATION · ROBOTICS · 5', 'From folk dance to kung fu flips in a year');

  // Every caption sits ABOVE its clip, so no robot is hidden under a caption band.
  // Row 1: then (2025 gala) and now (2026 wall backflips) side by side at equal size, plus the headlines.
  // Row 2: four more 2026 clips. Sizes: row-2 tiles fill the width; row-1 clips take the remaining height.
  const g2 = 0.25, tw = (CW - 3 * g2) / 4, th = tw * 9 / 16;           // row 2 tiles
  const c = CAP_H + CAP_GAP, y1 = 1.72;
  const y2 = 6.5 - th - c;                                           // row-2 caption top
  const ah = y2 - 0.24 - y1 - c, aw = ah * 16 / 9, g1 = 0.3;           // row-1 clip size
  const old = await capTile(d, s, R2('robots-unitree-2025-gala-yangko-h1.gif'), { x: CX0, y: y1, w: aw, h: ah },
    'ONE YEAR EARLIER · JAN 28, 2025 GALA', 'Unitree H1s dancing the Yangko folk dance (CGTN)');
  const hero = await capTile(d, s, R2('robots-unitree-g1-wall-backflips.gif'), { x: CX0 + aw + g1, y: y1, w: aw, h: ah },
    'FEB 16, 2026 · UNITREE G1 · WALL BACKFLIPS', 'From Unitree’s official gala video');
  const cells = [
    ['robots-unitree-gala-stage-cluster-kungfu.gif', 'LIVE ON CCTV · FEB 16, 2026', 'Kung fu with staffs at the gala'],
    ['robots-unitree-g1-airflare-spin.gif', 'AIRFLARE SPIN', 'Unitree claims 7.5 rotations'],
    ['robots-unitree-h2-flying-kicks.gif', 'H2 · 180 CM · “NO SPEED-UP”', 'Flying kicks right next to a person'],
    ['robots-unitree-autonomous-boxing.gif', 'SPARRING · SEP 7, 2026', 'Unitree: “fully autonomous” combat'],
  ];
  const tiles = [];
  for (let i = 0; i < 4; i++) {
    const [f, t, sub] = cells[i];
    tiles.push(await capTile(d, s, gifScaled(f, 640), { x: CX0 + i * (tw + g2), y: y2, w: tw, h: th }, t, sub));
  }

  // right of row 1: the two headlines, stacked and centred on the clips
  const hx = CX0 + 2 * (aw + g1), hw = CX1 - hx;
  const scmp = await crop('rev2/robots-scmp-unitree-20000-output.png', 'robots-scmp-head.png', { l: 14, t: 95, w: 1470, h: 192 });
  const bgr = await crop('rev2/robots-bgr-sci-fi-nightmare.png', 'robots-bgr-head.png', { l: 0, t: 62, w: 1460, h: 300 });
  const sh = await hFor(scmp, hw - 0.1), bh = await hFor(bgr, hw - 0.1), hg = 0.32;
  const hy = old.geom.y + (ah - (sh + hg + bh)) / 2;
  const c1 = await frameW(d, s, scmp, hx + 0.02, hy, hw - 0.1, { rot: -1 });
  const c2 = await frameW(d, s, bgr, hx + 0.06, hy + sh + hg, hw - 0.1, { rot: 1.2 });

  d.animate(s, old, { auto: true, effect: 'fade', dur: 500 });
  d.animate(s, hero, { effect: 'fade', dur: 500 });
  tiles.forEach((t, i) => d.animate(s, t, { auto: true, effect: 'fade', dur: 400, after: i ? 100 : 250 }));
  d.animate(s, c1, { effect: 'slam', dur: 350 });
  d.animate(s, c2, { auto: true, effect: 'slam', dur: 350, after: 250 });

  d.source(s, 'Sources: official Unitree videos (Spring Festival Gala, Feb 16, 2026; H2 training, Jan 4, 2026; sparring, Sep 7, 2026) · CGTN (2025 gala) · SCMP (Feb 17, 2026) · BGR (Feb 26, 2026).');
  s.addNotes([
    'Top row: one year apart, at the same size — left, the 2025 gala (CGTN broadcast); right, 2026. All other clips are official Unitree uploads (trimmed and scaled only; all play in slideshow; captions sit above the clips so nothing is covered). Top-right clip: G1 humanoids running at a wall, stepping up it and backflipping off in quick succession — from Unitree’s official “Spring Festival Gala Robots — a Full Release of Additional Details” video (Feb 16, 2026; 27.9M views on X), which mixes CCTV gala broadcast shots with rehearsal-hall footage; we have not confirmed which of the two this segment is, so do not call it either.',
    'Bottom row: (1) the CCTV gala broadcast — dozens of G1s doing kung fu with staffs and nunchaku beside child martial artists (CMG says the gala averaged 325M concurrent viewers per minute — state-media figure). (2) A breakdance Airflare — Unitree claims “seven-and-a-half rotations”; it also claims launched aerial flips over 3 m high and group movement up to 4 m/s (all Unitree’s own claims). (3) The 180 cm H2 throwing flying kicks a metre or two from a man who flinches back — on-screen label “No speed-up in this video”; Unitree’s post: “Please use robots in a friendly and safe manner, and keep a safe distance.” (4) Sep 7, 2026: Unitree claims “The World’s First Real-Time World Model-Driven Fully Autonomous Humanoid Robot Combat” (UnifoLM-X2-1.0) — a vendor claim; in its split-screen version some panels are the model’s predicted future frames, not real footage.',
    'Caveat: the gala routines were choreographed; at the Temple of Heaven show a week later (49 G1s) staff said the routines ran on “pre-programmed instructions” without remote control (Global Times). Agility is not general intelligence — but combine these bodies with the VLA brains from three slides ago.',
    'One year earlier (Jan 28, 2025 gala): Unitree H1s performed the Yangko folk dance, twirling red handkerchiefs — CGTN: the act “Yangge Bot” combined “northeast China’s Yangko dance with the precision of robotics”. Let the audience compare the two clips themselves. SCMP: Unitree plans to ship up to 20,000 humanoids in 2026, up from ~5,500. BGR: “it’s hard not to imagine the show as a scene out of a sci-fi nightmare. It only takes one mistake to cause an injury.”',
    'Videos: gala https://www.youtube.com/watch?v=Ykiuz1ZdGBc (X: https://x.com/UnitreeRobotics/status/2023430834695627030) · H2 training https://www.youtube.com/watch?v=JZllfrHRc4g (https://x.com/UnitreeRobotics/status/2007746313220415717) · sparring https://www.youtube.com/watch?v=qkIJELDgULA (https://x.com/UnitreeRobotics/status/2096932273602048258) · 2025 gala https://news.cgtn.com/news/2025-01-28/Tradition-meets-tech-Unitree-robots-dance-at-Spring-Festival-Gala-1Axm5TuIAve/index.html · PR: https://www.prnewswire.com/news-releases/kung-fu-meets-spring--unitree-spring-festival-gala-robots-present-cyber-real-kung-fu-in-the-year-of-the-horse-302689281.html · https://www.scmp.com/tech/big-tech/article/3343825/kung-fu-somersaults-and-scale-unitree-eyes-20000-robot-output-2026-after-gala · https://www.bgr.com/2108405/china-new-year-robots-sci-fi-nightmare/ · https://www.globaltimes.cn/page/202602/1355607.shtml',
  ].join('\n\n'));
  return s;
}

// ========== 13–14. Robotics: Anthropic, “What work can robots do?” (Sep 30, 2026) ==========
const RW_URL = 'https://www.anthropic.com/research/what-work-can-robots-do';

// Native highlighter strokes over a framed (unrotated) screenshot — never painted on the pixels.
// lines: [x, y, w, h] boxes in the ORIGINAL screenshot's pixels (from the research JSON); off: the crop's {l, t}.
async function hlLines(d, s, file, fr, lines, off = { l: 0, t: 0 }) {
  const nat = await imgSize(file);
  const g = fr.geom, k = g.w / nat.w;
  return lines.map(([x, y, w, h]) => {
    const x0 = Math.max(0, x - off.l - 3), y0 = Math.max(0, y - off.t - 2);
    const x1 = Math.min(nat.w, x - off.l + w + 3), y1 = Math.min(nat.h, y - off.t + h + 2);
    const n = d.name('hl');
    s.addShape(d.pres.shapes.RECTANGLE, {
      x: g.x + x0 * k, y: g.y + y0 * k, w: (x1 - x0) * k, h: (y1 - y0) * k,
      fill: { color: 'FFD166', transparency: 58 }, line: { color: 'FFD166', width: 0, transparency: 100 }, objectName: n,
    });
    return n;
  });
}

async function robotWorkSlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  head(s, 'THE ACCELERATION · ROBOTICS · 6', 'Anthropic: robots can do 74% of physical tasks');

  // ---- left: the report itself (title block + key findings, highlights added) ----
  const lw = 6.3;
  const title = await crop('rev2/robotwork-title-block.png', 'robotwork-title.png', { l: 60, t: 30, w: 1400, h: 352 });
  const t1 = await frameW(d, s, title, CX0 + 0.05, 1.8, 2.45, { rot: -1.5 });
  const meth = d.text(s, [
    { text: 'ANTHROPIC RESEARCH · ECONOMICS', options: { fontSize: 10, bold: true, color: d.S.steel, charSpacing: 1, breakLine: true, paraSpaceAfter: 2 } },
    { text: 'Claude rated all 7,594 physical tasks in O*NET, the US job database: could a robot that exists today do it, and where?', options: { fontSize: 14, color: d.S.muted } },
  ], { x: CX0 + 2.75, y: 1.74, w: lw - 2.75, h: 0.94, valign: 'top' });
  const kfOff = { l: 30, t: 298 };
  const kf = await crop('rev2/robotwork-key-findings.png', 'robotwork-kf-b23.png', { ...kfOff, w: 1305, h: 566 });
  const kfF = await frameW(d, s, kf, CX0, 2.98, lw);
  const kfHl = await hlLines(d, s, kf, kfF, [
    [82, 315, 1230, 42], [82, 367, 1156, 42], [82, 420, 716, 42], // three-quarters of physical tasks … 34% of working hours
    [804, 420, 478, 42], [82, 473, 832, 42], // male, less educated, lower paid
    [82, 707, 1237, 42], [82, 760, 100, 42], // about 80% … robots or LLMs
  ], kfOff);
  const kfBottom = kfF.geom.y + kfF.geom.h + 0.06;
  // the headline number's robustness caveat (Appendix A.4) belongs on the slide, not only in the notes
  const kfCap = d.text(s, [
    { text: 'Caveat: ', options: { fontSize: 14, bold: true, color: d.S.amber } },
    { text: 'Claude’s ratings; a stricter check gives about half, not ¾', options: { fontSize: 14, color: d.S.txt, breakLine: true } },
    { text: 'Key findings, anthropic.com, Sep 30, 2026 (highlights added) · stricter check: Appendix A.4', options: { fontSize: 10, italic: true, color: d.S.steel } },
  ], { x: CX0, y: kfBottom + 0.06, w: lw, h: 0.56, valign: 'top' });

  // ---- right: Figure 3 as a native chart ----
  const rx = 7.2, rw = CX1 - rx;
  const lab = capLabel(d, s, 'SHARE OF ALL US WORK TIME, BY WHERE A ROBOT CAN DO THE TASK', { x: rx, y: 1.72, w: rw, charSpacing: 1 });
  const box = { x: rx - 0.1, y: 1.98, w: rw + 0.1, h: 1.9 };
  const L = { x: 0.08, y: 0.06, w: 0.9, h: 0.88 };
  const labels = ['Cognitive & interpersonal', 'E0: no robot can do it', 'E1: purpose-built site', 'E2: structured site', 'E3: open world'];
  const vals = [54, 12, 23, 10, 1];
  const ch = d.chart(s, 'bar', [{ name: 'Share of work time', labels, values: vals }], box, {
    barDir: 'col', layout: L, chartColors: ['4A5263', HEX.steel, HEX.red, HEX.red, HEX.red], showValue: true, dataLabelFormatCode: '0"%"',
    dataLabelPosition: 'outEnd', dataLabelFontSize: 13, dataLabelFontBold: true, valAxisMinVal: 0, valAxisMaxVal: 70, valAxisMajorUnit: 35,
    valAxisLabelFormatCode: '0"%"', catAxisHidden: true, barGapWidthPct: 40,
  });
  // category labels drawn as text (two short lines each) so the renderer never rotates or truncates them
  const cx = (i) => box.x + box.w * (L.x + L.w * (i + 0.5) / 5);
  const vy = (v) => box.y + box.h * (L.y + L.h * (1 - v / 70)); // 70 = valAxisMaxVal (top gridline clear of the 54% label)
  const cwid = box.w * L.w / 5;
  const cats = [['Cognitive &', 'interpersonal'], ['E0', 'no robot', 'can do it'], ['E1', 'purpose-built', '(factory line)'], ['E2', 'structured', '(warehouse)'], ['E3', 'unstructured', '(city road)']];
  const catT = cats.map((ln, i) => d.text(s, ln.map((txt, j) => ({ text: txt, options: { breakLine: j < ln.length - 1, bold: ln.length === 3 && j === 0 } })),
    { x: cx(i) - cwid / 2 - 0.08, y: box.y + box.h + 0.03, w: cwid + 0.16, h: 0.58, fontSize: 11, color: i >= 2 ? 'FF8A8C' : d.S.muted, align: 'center', valign: 'top' }));
  // bracket over the three robot-doable bars (E1–E3)
  const ba = cx(2) - 0.4, bb = cx(4) + 0.4, by = vy(40); // ticks end at the 35% gridline; label spans ~42–62%: clear of the 35% and 70% gridlines
  const brk = [];
  [[ba, by, bb - ba, 0], [ba, by, 0, 0.12], [bb, by, 0, 0.12]].forEach(([x, y, w, h]) => {
    const n = d.name('brk');
    s.addShape(d.pres.shapes.LINE, { x, y, w, h, line: { color: HEX.red, width: 1.5 }, objectName: n });
    brk.push(n);
  });
  brk.push(d.text(s, [
    { text: 'ROBOTS CAN DO: 34% OF ALL WORK', options: { bold: true, color: 'FF8A8C', breakLine: true } },
    { text: '= 74% of physical work, mostly controlled settings', options: { color: d.S.muted } },
  ], { x: ba - 0.3, y: by - 0.52, w: CX1 - 0.12 - (ba - 0.3), h: 0.46, fontSize: 11, align: 'center', valign: 'bottom' }));

  // ---- bottom right: who is exposed (press clipping + two stats) ----
  const catBottom = box.y + box.h + 0.03 + 0.58;
  const yb = catBottom + 0.24; // value text is bottom-aligned in its box: the visible gap to the labels is ≥0.3in
  const cnbc = R2('robotwork-cnbctv18-machines-have-a-type.png');
  const cw = 2.1;
  const c1 = await frameW(d, s, cnbc, rx + 0.05, yb + 0.12, cw, { rot: 1.5 });
  const sx = rx + cw + 0.35, sw = CX1 - sx;
  const st1 = stat(d, s, { x: sx, y: yb, w: sw, value: '$22.88 vs $52.97', valueSize: 19, labelSize: 14, labelH: 0.5, color: d.S.amber, label: 'hourly pay, most-exposed fifth vs unexposed workers' });
  const st2 = stat(d, s, { x: sx, y: yb + 0.95, w: sw, value: '9 of 10', valueSize: 19, labelSize: 14, labelH: 0.5, color: d.S.amber, label: 'most-exposed big jobs (20K+) are vehicle operators' });

  d.animate(s, [...t1, meth, ...kfF, kfCap], { auto: true, effect: 'fade', dur: 600 });
  d.animate(s, kfHl.slice(0, 3), { auto: true, effect: 'wipeLeft', dur: 500, stagger: 350, after: 150 });
  d.animate(s, [lab, ch, ...catT], { effect: 'wipeLeft', dur: 1000 });
  d.animate(s, brk, { auto: true, effect: 'fade', after: 100 });
  d.animate(s, kfHl.slice(3, 5), { effect: 'wipeLeft', dur: 450, stagger: 300 });
  d.animate(s, [...c1, ...st1, ...st2], { auto: true, effect: 'rise', dur: 450, stagger: 120, after: 100 });
  d.animate(s, kfHl.slice(5), { effect: 'wipeLeft', dur: 450, stagger: 300 });

  d.source(s, 'Source: Anthropic, “What work can robots do?” (R. Legate-Yang & M. Massenkoff, Sep 30, 2026): Key findings, Figs. 3–5; ratings, time shares by Claude · CNBC-TV18 (Oct 2, 2026).');
  s.addNotes([
    'Anthropic’s economists (Russell Legate-Yang and Maxim Massenkoff, “What work can robots do?”, Anthropic Research · Economics, Sep 30, 2026) asked a narrow question: which work tasks can robots that EXIST TODAY already do? Claude (the data release names Claude Opus 5, with web search) rated the 7,594 physical tasks among the ~19,000 O*NET tasks (~900 occupations) on a rubric — E0: no robot can do it; E1: only in a purpose-built robotic work environment like a factory line; E2: in a structured human workplace like a logistics warehouse; E3: in an unstructured environment like a city road — citing real robots (about 650,000 web searches). Caveat: this is Anthropic’s own study and the ratings, task time shares and robot costs are Claude’s estimates.',
    'Key findings (verbatim, highlighted on the slide): “Robots, which we define as autonomous physical machines that sense and act, can perform three-quarters of physical tasks in the US, making up 34% of working hours, but mostly in limited settings. Workers exposed to robots are more likely to be male, less educated, and lower paid.” … “Overall, about 80% of job tasks by working time are exposed to either robots or LLMs. Robots do work where LLMs cannot.” LLMs alone expose about half of work; adding robots takes it to 81% (Figure 6). Transportation and moving: under 15% exposed to LLMs alone, about 90% with robots; office and admin: nearly 100%.',
    'Chart (Figure 3, all US work time): 54% cognitive and interpersonal; physical work is the other 46% — 12% that no robot can do (E0), 23% robots can do in purpose-built environments (E1), 10% in structured human facilities (E2), 1% in unstructured environments (E3). E1+E2+E3 = 34% of all work = 74% of physical work. Of physical tasks only 1.9% are E3 — robots mostly need controlled settings.',
    'Who is exposed (Figure 5, top-quintile exposed vs unexposed workers): 31.2% vs 51.2% female (−20 pp); 8.3% vs 63.2% with a bachelor’s degree (−55 pp); hourly wage $22.88 vs $52.97; unemployment 5.2% vs 2.2%. Most exposed occupations (Figure 4, ≥20,000 jobs): taxi drivers 2.2 on the 0–3 index (citing Waymo robotaxis), agricultural equipment operators 2.1, light truck drivers 2.1 — 9 of the top 10 are vehicle operators. Nursing and general repair jobs are barely exposed.',
    'Press: CNBC-TV18 (Asmi Saxena, Oct 2, 2026): “The machines have a type: male, blue-collar and lower-paid” — dek: “A new Anthropic study finds the jobs most exposed to physical automation are held mostly by men, with fewer qualifications and smaller pay packets. But the price tag means no stampede is imminent.” (That price tag is the next slide.)',
    'Robustness caveat (Appendix A.4, also shown on the slide): “Excluding ratings that rely on related robots decreases the share of exposed physical work from about three-quarters to a half.” Dropping demonstration-only evidence lowers it by about 1 point. So present the 74% as the report’s main estimate from Claude’s ratings, with about half on the stricter reading.',
    'URLs: ' + RW_URL + ' · PDF: https://cdn.sanity.io/files/4zrzovbb/website/401a473469db99fd39bba1ca6d9a5653a70e2f12.pdf · Appendix: https://cdn.sanity.io/files/4zrzovbb/website/d27288375b0ac486cb9da0a30a94423b36ff0443.pdf · Data release (CC BY 4.0): https://huggingface.co/datasets/Anthropic/EconomicIndex/tree/main/robot_exposure · CNBC-TV18: https://www.cnbctv18.com/technology/anthropic-study-ai-robots-blue-collar-jobs-physical-workers-automation-risk-20003393.htm',
  ].join('\n\n'));
  return s;
}

async function robotCostSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'THE ACCELERATION · ROBOTICS · 7', 'But robots are cheaper for just 0.3% of tasks');

  // ---- left: Figure 7 as a native chart — yearly cost of the robot vs the human, same tasks ----
  const lw = 6.35;
  const lab = capLabel(d, s, 'COST PER YEAR TO DO ONE WORKER’S ROBOT-DOABLE TASKS ($ THOUSANDS)', { x: CX0, y: 1.72, w: lw, charSpacing: 1 });
  const box = { x: CX0 - 0.1, y: 2.3, w: lw + 0.1, h: 3.35 };
  const occ = ['Hand packers (560K jobs)', 'Taxi drivers (41K)', 'Dishwashers (477K)', 'Janitors & cleaners (2.2M)', 'Welders (416K)'];
  const robot = [45.4, 57.8, 172.0, 280.0, 334.6];
  const comp = [49.0, 56.8, 45.0, 47.7, 73.4], share = [0.97, 0.89, 1.0, 0.73, 0.9]; // Fig. 7 columns
  const human = comp.map((c, i) => Math.round(c * share[i] * 10) / 10);
  const L = { x: 0.35, y: 0.02, w: 0.58, h: 0.96 };
  const ch = d.chart(s, 'bar', [
    { name: 'Human worker (median total compensation × exposed share)', labels: occ, values: human },
    { name: 'Robot (Claude’s estimate)', labels: occ, values: robot },
  ], box, {
    barDir: 'bar', barGrouping: 'clustered', layout: L, chartColors: [HEX.steel, HEX.red], catAxisOrientation: 'maxMin',
    valAxisHidden: true, valGridLine: { style: 'none' }, valAxisMinVal: 0, valAxisMaxVal: 380,
    showValue: true, dataLabelFormatCode: '$0.0"K"', dataLabelPosition: 'outEnd', dataLabelFontSize: 12, dataLabelFontBold: true,
    catAxisLabelFontSize: 12, barGapWidthPct: 50, barOverlapPct: 0, showLegend: false,
  });
  // own legend (renderers squeeze a built-in top legend into the first category label)
  const leg = [];
  [[HEX.steel, 'Human (median total compensation × exposed share)'], [HEX.red, 'Robot (Claude’s cost estimate)']].forEach(([c, txt], i) => {
    const lx = CX0 + (i ? 3.85 : 0), n = d.name('leg');
    s.addShape(d.pres.shapes.RECTANGLE, { x: lx, y: 2.06, w: 0.14, h: 0.14, fill: { color: c }, line: { color: c, width: 0 }, objectName: n });
    leg.push(n, d.text(s, txt, { x: lx + 0.22, y: 1.98, w: i ? 2.38 : 3.4, h: 0.3, fontSize: 11, color: d.S.muted, valign: 'middle' }));
  });
  // tag the one occupation where robots already win
  const gy0 = box.y + box.h * L.y, gh = box.h * L.h / 5;
  // gap matches the bars ($47.5K − $45.4K); the report's own text rounds it to "about $2,500"
  const tag = d.text(s, [
    { text: '◄ robots ≈$2.1K a year cheaper', options: { fontSize: 12, bold: true, color: '5FD3C4', breakLine: true } },
    { text: '(report’s rounded text: “about $2,500”)', options: { fontSize: 11, color: d.S.muted } },
  ], { x: box.x + box.w * (L.x + L.w * 48 / 380) + 0.78, y: gy0 + gh * 0.5 - 0.25, w: 3.0, h: 0.5, valign: 'middle' });
  const note = d.text(s, [
    { text: 'Hand packers: robots costing over $2 million replace ~14 workers. ', options: { color: d.S.muted } },
    { text: 'Robot costs are Claude’s estimates (fixed costs annualized, plus running costs).', options: { color: d.S.steel, italic: true } },
  ], { x: CX0, y: box.y + box.h + 0.1, w: lw, h: 0.62, fontSize: 14, valign: 'top' });

  // ---- right: the report’s own sentences (highlights added) + the 50-year backtest ----
  const rx = 7.35, rw = CX1 - rx;
  const kf = R2('robotwork-kf-bullet-03pct-40yrs.png');
  const sw0 = rw - 0.3; // screenshots slightly narrower than the column, leaving room for 14pt stat labels below
  const f1 = await frameW(d, s, kf, rx, 1.8, sw0);
  const h1 = await hlLines(d, s, kf, f1, [[508, 78, 742, 42], [42, 131, 91, 42], [139, 131, 1075, 42], [42, 184, 305, 42]]);
  const sc = R2('robotwork-scenarios-2085-2050-53yrs.png');
  const y2 = f1.geom.y + f1.geom.h + 0.06 + 0.3;
  const f2 = await frameW(d, s, sc, rx, y2, sw0);
  const h2a = await hlLines(d, s, sc, f2, [[40, 31, 1210, 42], [40, 83, 490, 42]]);
  const h2b = await hlLines(d, s, sc, f2, [[296, 136, 991, 42], [40, 189, 1247, 42], [40, 242, 927, 42]]);
  const yb = f2.geom.y + f2.geom.h + 0.06 + 0.2;
  const bl = capLabel(d, s, '50-YEAR BACKTEST: HISTORICALLY ROBOT-EXPOSED JOBS', { x: rx, y: yb, w: rw, color: d.S.amber, charSpacing: 1 });
  const sw = 2.95, sw2 = rw - sw - 0.25;
  // big number + its 95% CI as a small caption run on the same line; 14pt label below
  const ci = (v, c) => [{ text: v, options: { fontSize: 26, bold: true, color: d.S.red, fontFace: 'Arial' } }, { text: `  95% CI ${c}`, options: { fontSize: 11, color: d.S.muted } }];
  const st1 = stat(d, s, { x: rx, y: yb + 0.32, w: sw, value: ci('−34%', '−16% to −52%'), valueSize: 26, labelSize: 14, labelH: 0.5, label: 'employment after ~20 years, fully exposed vs unexposed' });
  const st2 = stat(d, s, { x: rx + sw + 0.25, y: yb + 0.32, w: sw2, value: ci('−7%', '−5% to −9%'), valueSize: 26, labelSize: 14, labelH: 0.5, label: 'wages, same comparison' });

  d.animate(s, [lab, ...leg, ch], { auto: true, effect: 'wipeLeft', dur: 1100 });
  d.animate(s, [tag, note], { auto: true, effect: 'fade', after: 100 });
  d.animate(s, f1, { effect: 'rise', dur: 450 });
  d.animate(s, h1, { auto: true, effect: 'wipeLeft', dur: 450, stagger: 300, after: 100 });
  d.animate(s, f2, { effect: 'rise', dur: 450 });
  d.animate(s, h2a, { auto: true, effect: 'wipeLeft', dur: 450, stagger: 300, after: 100 });
  d.animate(s, h2b, { effect: 'wipeLeft', dur: 450, stagger: 300 });
  d.animate(s, [bl, ...st1, ...st2], { effect: 'rise', dur: 450, stagger: 120 });

  d.source(s, 'Source: Anthropic, “What work can robots do?” (Sep 30, 2026): Fig. 7 (human bar derived: median total compensation × exposed share), App. B.3 backtest; screenshots of anthropic.com, highlights added.');
  s.addNotes([
    'The catch: “While robots can do most physical work tasks today, they are much more expensive than human labor. Robots are cost-competitive for just 0.3% of job tasks. If robot price declines follow past trends, it will take 40 years for that share to reach 10%.” (Key findings, highlighted.) For 10% of human work today, robot costs would need to fall about 70% — around 40 years at 3% a year. At 20% cheaper, robots would undercut the physical work of 2.8 million workers (0.8% of all working time).',
    'Chart (Figure 7; robot costs are Claude’s estimates of the annual cost of robots doing the tasks a robot can do in each job, fixed + variable): packers and packagers (560,000 jobs) — robots ~$45,400 a year vs ~$47,500 of human total compensation for the same 97% of the job (Fig. 7 columns: $49,000 × 97%), a gap of about $2,100; the report’s own rounded sentence says “around $49,000, robots cost about $2,500 less per year to do that work”, so the slide tag attributes the $2.5K to the report. These robots “cost over $2 million to purchase and install, but replace the yearly work of around 14 workers.” Packer employment is already down 22% since 2015. Taxi drivers: robotaxi ~$57,800 vs ~$50,600 — “around $7,000 more” (plus regulatory hurdles). Dishwashers $172K vs $45K; janitors $280K vs $34.8K (median total compensation $47.7K, 73% exposed); welders $334.6K vs $66.1K — about 5x. The grey “human” bar is my derivation from the figure’s own columns (median total compensation × exposed share); the report’s $2,500 and $7,000 are its own rounded figures (the columns give about $2,100 and $7,200).',
    'Timelines (verbatim, highlighted; screenshot of the “Robot costs and adoption” section on anthropic.com — the highlights are slide overlays): “Adding in 3% cost declines per year, robots aren’t cost-competitive for half of physical work today until 2085. … In a fast adoption scenario, where quality-adjusted costs fall up to four times faster and robots become able to do new tasks twice as fast, robots become cost-competitive for half of physical work by 2050. Automating 90% of physical work today still takes 53 years.” The authors stress these scenarios are not job-loss predictions; Appendix E: by 2040 under business as usual robots become cost-competitive for about 2.5 million jobs — “more of a ceiling on job loss than a central estimate.” Their summary: “robots would need to sustain record rates of price declines and quality improvements over the coming decades to enable rapid physical automation.”',
    'Barriers beyond cost (Appendix Figure 10): capability limits block about 70% of physical tasks (manipulation alone about half), human preferences about a quarter, regulation 14%.',
    'Why it still matters (Appendix B.3 backtest, 1977–2024): over about 20 years, an occupation whose tasks were all robot-exposed saw wages 7.1% lower (95% CI 5.4–8.9%) and employment 34.2% lower (95% CI 16.4–52.0%) than an unexposed occupation in the same industry. These are regression estimates on HISTORICAL exposure (robots of each starting year), not a forecast for today’s robots; the employment estimate is imprecise (CI 16–52%), and the appendix notes steady declines could partly reflect secular trends (its 1977 placebo test on wages finds no pre-trend). And robots keep gaining: each year they become able to do about 2% of the physical work they previously couldn’t — in 1977 robots could not do 62% of physical tasks; today all but 24%. “If the past is any guide, taxi drivers and warehouse packers will see changes sooner than nurses and mechanics.” And the authors flag the upside risk: “AI-powered robots could leapfrog our scale and do work they cannot today, for example by learning to climb ladders or use their arms and grippers more deftly.”',
    'URLs: ' + RW_URL + ' · Appendix PDF: https://cdn.sanity.io/files/4zrzovbb/website/d27288375b0ac486cb9da0a30a94423b36ff0443.pdf · Data release: https://huggingface.co/datasets/Anthropic/EconomicIndex/tree/main/robot_exposure',
  ].join('\n\n'));
  return s;
}

async function build(d) {
  await cadSlide(d);
  await hwDesignSlide(d);
  await hwJobsSlide(d);
  await aleSlide(d);
  await paidWorkSlide(d);
  await gdpvalSlide(d);
  await juniorSlide(d);
  await codeSlide(d);
  await arxivSlide(d);
  await reviewSlide(d);
  await tavusSlide(d);
  await voiceSlide(d);
  await realQuestionSlide(d);
  await realRevealSlide(d);
  await vlaWallSlide(d);
  await vlaArchSlide(d);
  await vlaDemoSlide(d);
  await factorySlide(d);
  await unitreeSlide(d);
  await robotWorkSlide(d);
  await robotCostSlide(d);
}

module.exports = { build };
