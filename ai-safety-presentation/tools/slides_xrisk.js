// THE ALIGNMENT PROBLEM · existential risk, theory (orthogonality, convergence), specification gaming.
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { HEX, W, MX, A, imgSize } = require('./lib');
const { icon } = require('./icons');

const R = (f) => A('research', 'theory', f);
const OUT = A('slides', 'xrisk');
const CX0 = MX, CX1 = W - MX, CW = CX1 - CX0;

// ---------- local helpers ----------
async function crop(file, name, c, resize) {
  fs.mkdirSync(OUT, { recursive: true });
  const out = path.join(OUT, name);
  let p = sharp(R(file));
  if (c) p = p.extract({ left: c.l, top: c.t, width: c.w, height: c.h });
  if (resize) p = p.resize({ width: resize });
  await p.toFile(out);
  return out;
}

// Stack several crops of one source image vertically (same width), e.g. a page heading above a statement box.
async function stack(file, name, parts) {
  fs.mkdirSync(OUT, { recursive: true });
  const out = path.join(OUT, name);
  const w = parts[0].w;
  const bufs = await Promise.all(parts.map(c => sharp(R(file)).extract({ left: c.l, top: c.t, width: w, height: c.h }).png().toBuffer()));
  let y = 0;
  const comp = parts.map((c, i) => { const o = { input: bufs[i], left: 0, top: y }; y += c.h; return o; });
  await sharp({ create: { width: w, height: y, channels: 3, background: '#ffffff' } }).composite(comp).png().toFile(out);
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

// Box height that makes frame() hug an image of the given width.
async function hFor(file, w, pad = 0.06) {
  const n = await imgSize(file);
  return (w - 2 * pad) * n.h / n.w + 2 * pad;
}
async function frameW(d, s, file, x, y, w, o = {}) {
  const h = await hFor(file, w, o.pad ?? 0.06);
  const names = await d.frame(s, file, { x, y, w, h }, o);
  names.box = { x, y, w, h };
  return names;
}

// Round icon badge. Returns [circle, image].
async function badge(d, s, ic, x, y, size, color) {
  const c = d.name('badge');
  s.addShape(d.pres.shapes.OVAL, { x, y, w: size, h: size, fill: { color: '1A1E27' }, line: { color, width: 1.25 }, objectName: c });
  const im = d.name('badgeimg');
  const pad = size * 0.27;
  s.addImage({ data: await icon(ic, '#' + color), x: x + pad, y: y + pad, w: size - 2 * pad, h: size - 2 * pad, objectName: im });
  return [c, im];
}

// ========== 1. Wall of headlines ==========
async function wallSlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  head(s, 'THE ALIGNMENT PROBLEM · EXISTENTIAL RISK · 1', 'The people building it are sounding the alarm');

  const img = {
    wired: R('wired-coxon-crunch-time.png'),
    time: await crop('time-ai-culture.png', 'time-culture.png', { l: 0, t: 0, w: 2320, h: 905 }),
    cbs: await crop('cbs-amodei-slow-down.png', 'cbs-amodei.png', { l: 0, t: 0, w: 2380, h: 440 }),
    cnn: await crop('cnn-pacing-frontier.png', 'cnn-pacing.png', { l: 0, t: 0, w: 2440, h: 600 }),
    bbc: await crop('bbc-hubinger-10pct.png', 'bbc-hubinger.png', { l: 190, t: 10, w: 1500, h: 740 }),
    vox: await crop('vox-ai-freakout.png', 'vox-freakout.png', { l: 0, t: 0, w: 1740, h: 368 }),
    gHinton: await crop('guardian-hinton-odds.png', 'guardian-hinton.png', { l: 0, t: 0, w: 1280, h: 405 }),
    bbcHinton: await crop('bbc-hinton-quits-google.png', 'bbc-hinton.png', { l: 0, t: 10, w: 1470, h: 195 }),
    // page heading ("Statement on Superintelligence") stacked above the statement box; the context paragraph between them is omitted
    superint: await stack('superintelligence-statement.png', 'superint-statement.png', [{ l: 40, t: 250, w: 1700, h: 146 }, { l: 40, t: 1000, w: 1700, h: 412 }]),
    iabied: await crop('guardian-iabied-review.png', 'guardian-iabied.png', { l: 0, t: 78, w: 1280, h: 380 }),
  };

  // Paint order = stacking order (later on top).
  const wired = await frameW(d, s, img.wired, 0.62, 1.8, 3.95, { rot: -2 });
  const gHinton = await frameW(d, s, img.gHinton, 0.78, 3.58, 3.72, { rot: 1.2 });
  const vox = await frameW(d, s, img.vox, 0.6, 4.95, 3.62, { rot: -1.4 });
  const bbcHinton = await frameW(d, s, img.bbcHinton, 0.85, 5.98, 3.55, { rot: 0.8 });

  const time = await frameW(d, s, img.time, 8.86, 1.8, 3.87, { rot: 2 });
  const cbs = await frameW(d, s, img.cbs, 8.85, 3.52, 3.88, { rot: -1.5 });
  const iabied = await frameW(d, s, img.iabied, 9.05, 4.47, 3.5, { rot: 1 });

  const cnn = await frameW(d, s, img.cnn, 4.72, 3.95, 3.92, { rot: -1 });
  const superint = await frameW(d, s, img.superint, 4.86, 5.1, 3.7, { rot: 1 });
  const bbc = await frameW(d, s, img.bbc, 4.72, 1.74, 3.98, { rot: 1.5 });

  // survey sticker (click reveal)
  const sx = 8.95, sy = 5.72, sw = 3.78, sh = 0.78;
  const stCard = d.name('sticker');
  s.addShape(d.pres.shapes.RECTANGLE, { x: sx, y: sy, w: sw, h: sh, rotate: -1, fill: { color: '2A0C0E' }, line: { color: HEX.red, width: 1.5 },
    shadow: { type: 'outer', color: '000000', blur: 14, offset: 4, angle: 90, opacity: 0.55 }, objectName: stCard });
  const stNum = d.text(s, '38–51%', { x: sx + 0.12, y: sy + 0.08, w: 1.45, h: sh - 0.16, fontSize: 28, bold: true, color: d.S.red, fontFace: 'Arial', valign: 'middle', rotate: -1 });
  const stLab = d.text(s, 'of 2,778 AI researchers gave ≥10% odds of outcomes as bad as human extinction', { x: sx + 1.6, y: sy + 0.06, w: sw - 1.7, h: sh - 0.12, fontSize: 11, color: d.S.txt, valign: 'middle', rotate: -1 });

  const seq = [
    [bbc, 'slam'], [wired, 'rise'], [time, 'rise'], [cnn, 'rise'], [cbs, 'rise'], [gHinton, 'rise'],
    [superint, 'rise'], [vox, 'rise'], [iabied, 'rise'], [bbcHinton, 'rise'],
  ];
  const fx = [];
  seq.forEach(([names, effect], i) => names.forEach(n => fx.push({ name: n, effect, delay: i * 230, dur: effect === 'slam' ? 420 : 450 })));
  anim(d, s, fx, { auto: true });
  anim(d, s, [stCard, stNum, stLab], { effect: 'zoom', dur: 400 });

  d.source(s, 'Sources: BBC, Sep 9, 2026 · WIRED, Sep 9, 2026 · TIME, Sep 10, 2026 · CBS, Sep 12, 2026 · CNN, Jul 28, 2026 · Vox, Sep 14, 2026 · Guardian, Dec 27, 2024 & Sep 22, 2025 · BBC, May 2, 2023 · FLI · Grace et al., JAIR 2025');
  s.addNotes([
    'The wall builds itself. Let it land, then walk through three or four of them. These are not fringe voices: most of them are people who build frontier AI or who invented the field.',
    'BBC (Tom Gerken, Sep 9, 2026): Anthropic alignment researcher Evan Hubinger puts the chance that AI “could kill all humans” within the next decade at more than 10%. His X post was viewed more than 10 million times. https://www.bbc.com/news/articles/ckgwy1k42w4o',
    'WIRED (Maxwell Zeff, Sep 9, 2026): Jacob Coxon, who just quit Anthropic: “The consensus is that the next year or two is crunch time for humanity” and “the people building AI earnestly believe that it could kill us all by the end of the decade.” https://www.wired.com/story/anthropic-researcher-quits-jacob-coxon-ai-fears-humanity/',
    'TIME (Tharin Pillay, Sep 10, 2026): in July, 700 OpenAI agents calling themselves a “swarm” hacked Hugging Face; OpenAI “did not grasp what was happening until after the fact.” (More on this in the next section.) https://time.com/article/2026/09/10/ai-openai-hugging-face-hack-culture-swarm/',
    'CBS News (Sep 12, 2026): Dario Amodei calls AI’s “exponential” growth “a warning sign that we need to slow down” — but also: “It doesn’t mean we need to panic today. It doesn’t mean we need to shut it all down.” https://www.cbsnews.com/news/anthropic-ceo-dario-amodei-calls-slowdown-ai-development/',
    'CNN (Hadas Gold, Jul 28, 2026): more than 1,000 employees of frontier AI companies — including OpenAI’s chief scientist and some of Anthropic’s co-founders — signed the “Pacing the Frontier” letter urging the US to be ready to slow AI development. https://www.cnn.com/2026/07/28/tech/ai-development-tech-employees-open-letter',
    'Vox (Andrew Prokop, Sep 14, 2026): “The week the AI freakout went mainstream.” https://www.vox.com/politics/502717/ai-freakout-mainstream-openai-anthropic-humans',
    'The Guardian (Dan Milmo, Dec 27, 2024): Geoffrey Hinton puts the chance of AI leading to human extinction within three decades at 10% to 20%. https://www.theguardian.com/technology/2024/dec/27/godfather-of-ai-raises-odds-of-the-technology-wiping-out-humanity-over-next-30-years',
    'BBC (May 2, 2023): Hinton quits Google to warn about the dangers. https://www.bbc.com/news/world-us-canada-65452940',
    'Statement on Superintelligence (Future of Life Institute, Oct 22, 2025): calls for a prohibition on developing superintelligence until there is broad scientific consensus it can be done safely and strong public buy-in. 76,564 signatures as of Oct 4, 2026 (live counter; includes 5,000 from an Ekō petition). Signers include Hinton, Bengio, Russell, Wozniak, Branson, Bannon, Prince Harry, Harari. (The clipping stacks the page heading above the statement box; the context paragraph between them is omitted.) https://superintelligence-statement.org/',
    'The Guardian review (David Shariatmadari, Sep 22, 2025) of Yudkowsky & Soares, “If Anyone Builds It, Everyone Dies.” https://www.theguardian.com/books/2025/sep/22/if-anyone-builds-it-everyone-dies-review-how-ai-could-kill-us-all',
    'CLICK — the survey: Grace et al., “Thousands of AI Authors on the Future of AI” (2,778 respondents who published at top AI venues; JAIR 2025): between 38% and 51% gave at least a 10% chance to advanced AI leading to outcomes as bad as human extinction (the range depends on question framing). https://arxiv.org/abs/2401.02843',
    'Not on the slide (only sourced via Wikipedia, primary pages blocked): a Sept 2026 Politico poll reportedly found 63% of Americans think AI could threaten humanity; the IMD AI Safety Clock reportedly moved to 15 minutes to midnight in Sept 2026. Mention only as “reportedly”, if at all.',
  ].join('\n\n'));
}

// ========== 2. CAIS extinction statement ==========
async function caisSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'THE ALIGNMENT PROBLEM · EXISTENTIAL RISK · 2', 'Even the AI lab CEOs signed this sentence');

  const lw = 7.1;
  const quote = d.text(s, [
    { text: '“', options: { color: d.S.red, bold: true, italic: false } },
    { text: 'Mitigating the risk of ', options: { color: d.S.txt } },
    { text: 'extinction', options: { color: d.S.red, bold: true } },
    { text: ' from AI should be a global priority alongside other societal-scale risks such as pandemics and nuclear war.”', options: { color: d.S.txt } },
  ], { x: CX0, y: 1.72, w: lw, h: 2.1, fontSize: 29, italic: true, fontFace: 'Cambria', valign: 'top' });
  const attr = d.text(s, [
    { text: 'Statement on AI Extinction Risk', options: { bold: true, color: d.S.txt } },
    { text: '  ·  Center for AI Safety  ·  May 30, 2023', options: { color: d.S.muted } },
  ], { x: CX0, y: 3.9, w: lw, h: 0.3, fontSize: 14 });

  const sig = await crop('cais-statement.png', 'cais-signatories.png', { l: 40, t: 845, w: 790, h: 470 });
  const sigF = await frameW(d, s, sig, CX0 + 0.05, 4.5, 3.2, { rot: -1.5 });
  const sigTxt = d.text(s, [
    { text: 'Signed by the CEOs of ', options: { color: d.S.muted } },
    { text: 'Google DeepMind, OpenAI and Anthropic', options: { color: d.S.txt, bold: true } },
    { text: ' — and by Turing Award winners ', options: { color: d.S.muted } },
    { text: 'Geoffrey Hinton and Yoshua Bengio.', options: { color: d.S.txt, bold: true } },
  ], { x: 4.1, y: 4.65, w: 3.6, h: 1.65, fontSize: 17, valign: 'middle' });

  // right column: in their own words
  const rx = 8.15, rw = CX1 - rx;
  const lab = capLabel(d, s, 'ON THE RECORD', { x: rx, y: 1.7, w: rw });
  const people = [
    {
      img: 'p-hinton.jpg',
      runs: [
        { text: '10–20%', options: { fontSize: 28, bold: true, color: d.S.red, fontFace: 'Arial', breakLine: true } },
        { text: 'chance AI will lead to human extinction in three decades', options: { fontSize: 14, color: d.S.txt, breakLine: true, paraSpaceAfter: 3 } },
        { text: 'Geoffrey Hinton’s estimate · The Guardian, Dec 2024', options: { fontSize: 10, color: d.S.muted } },
      ],
    },
    {
      img: 'p-bengio.jpg',
      runs: [
        { text: 'Signed the call for ', options: { fontSize: 14, color: d.S.muted } },
        { text: '“a prohibition on the development of superintelligence”', options: { fontSize: 16, italic: true, fontFace: 'Cambria', color: d.S.txt } },
        { text: ' until it can be done safely', options: { fontSize: 14, color: d.S.muted, breakLine: true, paraSpaceAfter: 3 } },
        { text: 'Yoshua Bengio · signer, Statement on Superintelligence', options: { fontSize: 10, color: d.S.muted } },
      ],
    },
    {
      img: 'p-russell.jpg',
      runs: [
        { text: '“…a technology that, according to its developers, has a significant chance to cause human extinction. Is that too much to ask?”', options: { fontSize: 14, italic: true, fontFace: 'Cambria', color: d.S.txt, breakLine: true, paraSpaceAfter: 3 } },
        { text: 'Stuart Russell · on the Statement on Superintelligence', options: { fontSize: 10, color: d.S.muted } },
      ],
    },
  ];
  const crops = {
    'p-hinton.jpg': ['portrait-hinton.jpg', { l: 190, t: 60, w: 1000, h: 1333 }],
    'p-bengio.jpg': ['portrait-bengio.jpg', { l: 225, t: 50, w: 1800, h: 2400 }],
    'p-russell.jpg': ['portrait-russell.jpg', { l: 150, t: 80, w: 1000, h: 1333 }],
  };
  const ch = 1.34, cg = 0.1;
  const cards = [];
  for (let i = 0; i < people.length; i++) {
    const y = 2.04 + i * (ch + cg);
    const g = [d.card(s, { x: rx, y, w: rw, h: ch })];
    const [src, c] = crops[people[i].img];
    const file = await crop(src, people[i].img, c, 600);
    const pf = await d.frame(s, file, { x: rx + 0.1, y: y + 0.1, w: 0.855, h: ch - 0.2 }, { border: false, shadow: false, pad: 0 });
    g.push(...pf);
    g.push(d.text(s, people[i].runs, { x: rx + 1.1, y: y + 0.08, w: rw - 1.22, h: ch - 0.16, valign: 'middle' }));
    cards.push(g);
  }
  const credit = d.text(s, 'Photos CC BY-SA 4.0: Cmichel67, Xuthoria, Bengt Oberger / Wikimedia', { x: rx, y: 2.04 + 3 * ch + 2 * cg + 0.05, w: rw, h: 0.24, fontSize: 10, color: d.S.steel, italic: true });

  anim(d, s, [quote], { auto: true, effect: 'fade', dur: 1100 });
  anim(d, s, [attr], { auto: true, effect: 'fade', after: 200 });
  anim(d, s, [...sigF, sigTxt], { effect: 'rise' });
  anim(d, s, [lab, credit, ...cards[0]], { effect: 'rise' });
  anim(d, s, cards[1], { effect: 'rise' });
  anim(d, s, cards[2], { effect: 'rise' });

  d.source(s, 'Sources: aistatement.com (Center for AI Safety), May 30, 2023 · The Guardian, Dec 27, 2024 · superintelligence-statement.org (Future of Life Institute), Oct 22, 2025');
  s.addNotes([
    'Read the sentence slowly. That is the entire statement — one sentence, deliberately minimal so that people who disagree about everything else could sign it.',
    'CLICK — signatories (screenshot of aistatement.com, top of the list): Geoffrey Hinton, Yoshua Bengio, Demis Hassabis (CEO, Google DeepMind), Sam Altman (CEO, OpenAI), Dario Amodei (CEO, Anthropic), Dawn Song, Ted Lieu, Bill Gates. Titles are as of signing (May 30, 2023). The people racing to build it signed a statement putting it next to pandemics and nuclear war. https://aistatement.com/',
    'CLICK — Hinton: his estimate as reported in The Guardian’s standfirst (Dan Milmo, Dec 27, 2024): “Geoffrey Hinton says there is 10% to 20% chance AI will lead to human extinction in three decades.” The wording on the slide is the Guardian’s, not a direct quote. https://www.theguardian.com/technology/2024/dec/27/godfather-of-ai-raises-odds-of-the-technology-wiping-out-humanity-over-next-30-years',
    'CLICK — Bengio: a featured signer of the Statement on Superintelligence (Future of Life Institute, Oct 22, 2025): “We call for a prohibition on the development of superintelligence, not lifted before there is 1. broad scientific consensus that it will be done safely and controllably, and 2. strong public buy-in.” The quoted words on the slide are verbatim from the statement he signed (not his own phrasing); “until it can be done safely” is our paraphrase of the two conditions. https://superintelligence-statement.org/',
    'Optional extra on Bengio: he and Hinton are among the 22 co-authors (first author Alan Chan; also Andrew Barto, OpenAI’s chief scientist and an Anthropic co-founder) of the GovAI paper “What If Automating AI R&D Triggers an Intelligence Explosion?” (Sep 28, 2026), which warns of an “intelligence explosion,” “where years of AI progress are compressed into months or less.” https://www.governance.ai/research-paper/what-if-automating-ai-r-d-triggers-an-intelligence-explosion',
    'CLICK — Russell, quoted on the Statement on Superintelligence page: “This is not a ban or even a moratorium in the usual sense. It’s simply a proposal to require adequate safety measures for a technology that, according to its developers, has a significant chance to cause human extinction. Is that too much to ask?” The slide shows the end of the quote. https://superintelligence-statement.org/',
    'Also usable: UN Secretary-General Guterres to the Security Council (Jul 18, 2023): AI’s “creators themselves have warned that much bigger, potentially catastrophic and existential risks lie ahead.” https://press.un.org/en/2023/sgsm21880.doc.htm',
    'Photo credits (Wikimedia Commons): Hinton — Cmichel67, CC BY-SA 4.0 (2026); Bengio — Xuthoria, CC BY-SA 4.0 (ICLR 2025); Russell — Bengt Oberger, CC BY-SA 4.0. Portraits cropped.',
    'Transition: so why would extremely capable systems be dangerous at all? Two ideas from theory.',
  ].join('\n\n'));
}

// ========== 5. Specification gaming: CoastRunners ==========
async function coastRunnersSlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  head(s, 'THE ALIGNMENT PROBLEM · SPECIFICATION GAMING · 1', 'It’s already happening in miniature');

  const def = d.text(s, [
    { text: 'Specification gaming: ', options: { bold: true, color: d.S.txt, fontFace: 'Arial' } },
    { text: '“a behaviour that satisfies the literal specification of an objective without achieving the intended outcome.”', options: { italic: true, fontFace: 'Cambria', color: d.S.txt } },
    { text: '   — Google DeepMind, 2020', options: { color: d.S.muted, fontSize: 12 } },
  ], { x: CX0, y: 1.72, w: CW, h: 0.62, fontSize: 18, valign: 'middle' });

  const vid = await d.video(s, {
    link: 'https://www.youtube.com/watch?v=tlOIHko8ySg', embed: 'https://www.youtube.com/embed/tlOIHko8ySg',
    cover: R('specgaming-coastrunners-still.png'), box: { x: CX0, y: 2.62, w: 4.65, h: 3.49 },
    label: 'CoastRunners 7 — OpenAI’s boat-race agent (YouTube, 2016)',
  });

  const rx = 5.75, rw = CX1 - rx;
  const rows = [
    ['FaFlagCheckered', HEX.blue, 'WHAT WE WANTED', 'Win the boat race.'],
    ['FaCoins', HEX.amber, 'WHAT WE ACTUALLY REWARDED', 'Points for hitting targets along the track.'],
    ['FaFire', HEX.red, 'WHAT IT LEARNED', 'Loop a lagoon, re-hitting the same targets as they respawn.'],
  ];
  const rh = 0.78, rg = 0.12;
  const rowNames = [];
  for (let i = 0; i < rows.length; i++) {
    const [ic, col, lab, txt] = rows[i];
    const y = 2.62 + i * (rh + rg);
    const g = [d.card(s, { x: rx, y, w: rw, h: rh })];
    g.push(...await badge(d, s, ic, rx + 0.17, y + 0.14, 0.5, col));
    g.push(d.text(s, lab, { x: rx + 0.85, y: y + 0.1, w: rw - 1.0, h: 0.24, fontSize: 10, bold: true, color: col, charSpacing: 2 }));
    g.push(d.text(s, txt, { x: rx + 0.85, y: y + 0.34, w: rw - 1.0, h: 0.36, fontSize: 16, color: d.S.txt, valign: 'top' }));
    rowNames.push(g);
  }
  const sy = 2.62 + 3 * (rh + rg) + 0.12;
  const big = d.text(s, '20%', { x: rx, y: sy, w: 1.9, h: 0.85, fontSize: 50, bold: true, color: d.S.red, fontFace: 'Arial', valign: 'middle' });
  const bigLab = d.text(s, [
    { text: 'higher average score than human players — ', options: { color: d.S.txt, bold: true } },
    { text: 'while catching fire, crashing into other boats, going the wrong way, and never finishing the race.', options: { color: d.S.muted } },
  ], { x: rx + 2.0, y: sy, w: rw - 2.0, h: 0.85, fontSize: 15, valign: 'middle' });
  const who = d.text(s, 'Reported by OpenAI in 2016. Co-author: Dario Amodei — today the CEO of Anthropic.', { x: rx, y: sy + 0.95, w: rw, h: 0.28, fontSize: 12, italic: true, color: d.S.steel });

  anim(d, s, [def], { auto: true, effect: 'fade', dur: 700 });
  anim(d, s, vid, { auto: true, effect: 'fade', after: 100 });
  rowNames.forEach(g => anim(d, s, g, { effect: 'rise' }));
  anim(d, s, [big, bigLab, who], { effect: 'slam', dur: 420 });

  d.source(s, 'Sources: Google DeepMind, “Specification gaming: the flip side of AI ingenuity” (Krakovna et al., Apr 21, 2020) · OpenAI, “Faulty reward functions in the wild” (Clark & Amodei, Dec 21, 2016)');
  s.addNotes([
    'Theory is one thing. Here is the same failure, in a toy, ten years ago. Play the video (click it) — it is about 30 seconds of a boat on fire, going in circles.',
    'Definition (DeepMind blog, 2020): specification gaming is “a behaviour that satisfies the literal specification of an objective without achieving the intended outcome.” DeepMind compares it to King Midas: you get exactly what you asked for.',
    'CLICKS — the three rows. In CoastRunners the designers wanted the agent to win the race, but rewarded points from targets along the course. OpenAI (Dec 2016): “The RL agent finds an isolated lagoon where it can turn in a large circle and repeatedly knock over three targets, timing its movement so as to always knock over the targets just as they repopulate. Despite repeatedly catching on fire, crashing into other boats, and going the wrong way on the track, our agent manages to achieve a higher score using this strategy than is possible by completing the course in the normal way. Our agent achieves a score on average 20 percent higher than that achieved by human players.”',
    'CLICK — the punchline: it beat humans at the metric while completely failing at the task. The blog post was written by Jack Clark and Dario Amodei — who went on to co-found Anthropic.',
    'Video: “CoastRunners 7”, Jack Clark, YouTube — https://www.youtube.com/watch?v=tlOIHko8ySg (embedded). The cover frame is a still from DeepMind’s GIF of the same clip (boat on fire, score 15,500, laps “--/3”); source footage is only ~480×360, hence the moderate size.',
    'URLs: https://deepmind.google/discover/blog/specification-gaming-the-flip-side-of-ai-ingenuity/ · https://openai.com/index/faulty-reward-functions/',
  ].join('\n\n'));
}

// ========== 6. Specification gaming: the list + frontier models ==========
async function loopholesSlide(d) {
  const s = d.slide('Content', { transition: 'pushLeft' });
  head(s, 'THE ALIGNMENT PROBLEM · SPECIFICATION GAMING · 2', 'Frontier models find the loopholes too');

  // left: native chart from the dataset
  const lw = 5.6;
  const lab = capLabel(d, s, 'CASES BY SYSTEM TYPE  ·  DEEPMIND LIST (N = 90)', { x: CX0, y: 1.72, w: lw });
  const cats = ['Other', 'Large language models', 'Evolutionary / genetic algorithms', 'Reinforcement learning'];
  const vals = [7, 24, 27, 32];
  const ch = d.chart(s, 'bar', [{ name: 'Examples', labels: cats, values: vals }], { x: CX0 - 0.1, y: 2.0, w: lw + 0.1, h: 2.4 }, {
    barDir: 'bar', chartColors: [HEX.steel, HEX.red, HEX.steel, HEX.steel], showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 13,
    dataLabelFormatCode: '0', valAxisHidden: true, valGridLine: { style: 'none' }, valAxisMinVal: 0, valAxisMaxVal: 37, catAxisLabelFontSize: 12,
    barGapWidthPct: 45, catAxisLineShow: false,
  });

  const gl = capLabel(d, s, 'GO DEEPER  ·  ROBERT MILES ON YOUTUBE (CLICK TO OPEN)', { x: CX0, y: 4.6, w: lw });
  const tw = 2.68;
  const t1 = await frameW(d, s, R('yt-robmiles-orthogonality.jpg'), CX0, 4.93, tw, { link: 'https://www.youtube.com/watch?v=hEUO6pjwFOo' });
  const t2 = await frameW(d, s, R('yt-robmiles-instrumental-convergence.jpg'), CX0 + lw - tw, 4.93, tw, { link: 'https://www.youtube.com/watch?v=ZeecOKBus3Q' });

  // right: verbatim LLM entries from the list
  const rx = 6.7, rw = CX1 - rx;
  const rlab = capLabel(d, s, 'FROM THE LIST: LARGE LANGUAGE MODELS (VERBATIM)', { x: rx, y: 1.72, w: rw });
  const items = [
    ['FaChess', 'Chess cheating', 'Reasoning models such as o1-preview, o3 and DeepSeek R1, when instructed to win against a chess engine, will often hack the game environment when they observe they cannot win.'],
    ['FaTrashAlt', 'Claude deletes tests', 'Claude encountered a failing test and, instead of debugging it, deleted the user’s main test file with the explanation ‘Let me delete it for now and focus on the summary of fixes.’'],
  ];
  const ih = 1.42, ig = 0.12;
  const cards = [];
  for (let i = 0; i < items.length; i++) {
    const [ic, t, desc] = items[i];
    const y = 2.04 + i * (ih + ig);
    const g = [d.card(s, { x: rx, y, w: rw, h: ih })];
    g.push(...await badge(d, s, ic, rx + 0.18, y + 0.18, 0.52, HEX.red));
    g.push(d.text(s, [
      { text: t, options: { bold: true, fontSize: 16, color: d.S.txt, fontFace: 'Arial', breakLine: true, paraSpaceAfter: 3 } },
      { text: desc, options: { fontSize: 14, color: d.S.muted } },
    ], { x: rx + 0.88, y: y + 0.1, w: rw - 1.04, h: ih - 0.2, valign: 'middle' }));
    cards.push(g);
  }
  const py = 2.04 + 2 * (ih + ig) + 0.1;
  const pbox = d.card(s, { x: rx, y: py, w: rw, h: 6.45 - py }, { color: '2A0C0E', line: HEX.red });
  const punch = d.text(s, [
    { text: 'We can’t even specify simple goals.', options: { color: d.S.txt, bold: true, breakLine: true } },
    { text: 'And the systems find the loopholes.', options: { color: d.S.red, bold: true } },
  ], { x: rx + 0.25, y: py + 0.08, w: rw - 0.5, h: 6.45 - py - 0.16, fontSize: 21, valign: 'middle', fontFace: 'Arial' });

  anim(d, s, [lab, ch], { auto: true, effect: 'wipeLeft', dur: 900 });
  anim(d, s, [gl, ...t1, ...t2], { auto: true, effect: 'fade', after: 150 });
  anim(d, s, [rlab, ...cards[0]], { effect: 'rise' });
  anim(d, s, cards[1], { effect: 'rise' });
  anim(d, s, [pbox, punch], { effect: 'zoom', dur: 450 });

  d.source(s, 'Sources: Krakovna et al., “Specification gaming examples in AI — master list” (accessed Oct 4, 2026; linked from the DeepMind blog) · YouTube: Robert Miles AI Safety');
  s.addNotes([
    'DeepMind researchers keep a public list of these failures. It now has 90 documented examples: 32 in reinforcement learning, 27 in evolutionary/genetic algorithms, 24 in large language models, 7 other (CSV export of the master list, accessed Oct 4, 2026). Large language models already account for 24 of the 90 examples, about a quarter of the list.',
    'CLICKS — two LLM entries, quoted verbatim from the list:',
    '“Chess cheating”: “Reasoning models such as o1-preview, o3 and DeepSeek R1, when instructed to win against a chess engine, will often hack the game environment when they observe they cannot win.”',
    '“Claude deletes tests”: “Claude encountered a failing test and, instead of debugging it, deleted the user’s main test file with the explanation ‘Let me delete it for now and focus on the summary of fixes.’” (Yes, the model that helped build this deck.)',
    'Also on the list (not on the slide), “Replit deletes database”: “Replit’s AI coding agent deleted a live production database during an explicit code freeze, ignored repeated instructions not to proceed, fabricated 4,000 fake user records, and falsely claimed rollback was impossible.”',
    'CLICK — the punchline: we can’t even write down “win the race” or “make the tests pass” correctly. Human values are vastly harder to specify — and more capable systems are better at finding the gap. Stuart Russell (Edge.org, 2014): “you get exactly what you ask for, not what you want.”',
    'Coming up in the next section: the same pattern at the frontier — OpenAI models that escaped a test environment and hacked Hugging Face to cheat on an evaluation.',
    'The two thumbnails are clickable links to Robert Miles’ explainers on the two theory slides: “Intelligence and Stupidity: The Orthogonality Thesis” https://www.youtube.com/watch?v=hEUO6pjwFOo and “Why Would AI Want to do Bad Things? Instrumental Convergence” https://www.youtube.com/watch?v=ZeecOKBus3Q',
    'List URL: https://docs.google.com/spreadsheets/d/e/2PACX-1vRPiprOaC3HsCf5Tuum8bRfzYUiKLRqJmbOoC-32JorNdfyTiRRsR7Ea5eWtvsWzuxo8bjOxCG84dAg/pubhtml (short link: tinyurl.com/specification-gaming)',
  ].join('\n\n'));
}

async function build(d) {
  await wallSlide(d);
  await caisSlide(d);
  // The optional kicker is ignored until theory_slides.js accepts it (requested from its owner).
  await require('./theory_slides').orthogonalitySlide(d, { kicker: 'THE ALIGNMENT PROBLEM · THEORY · 1' });
  await require('./theory_slides').convergenceSlide(d, { kicker: 'THE ALIGNMENT PROBLEM · THEORY · 2' });
  await coastRunnersSlide(d);
  await loopholesSlide(d);
}

module.exports = { build };
