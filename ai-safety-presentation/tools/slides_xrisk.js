// THE ALIGNMENT PROBLEM · existential risk, theory (orthogonality, convergence), specification gaming.
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { HEX, W, MX, A, imgSize } = require('./lib');
const { icon } = require('./icons');

const R = (f) => A('research', 'theory', f);
const OUT = A('slides', 'xrisk');
const CX0 = MX, CX1 = W - MX, CW = CX1 - CX0;
const MILES = { orth: 'https://www.youtube.com/watch?v=hEUO6pjwFOo', conv: 'https://www.youtube.com/watch?v=ZeecOKBus3Q' };

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

// Resize an animated GIF (keeps every frame; PowerPoint plays it in slideshow mode).
async function gif(file, name, width) {
  fs.mkdirSync(OUT, { recursive: true });
  const out = path.join(OUT, name);
  await sharp(R(file), { animated: true }).resize({ width }).gif({ effort: 7 }).toFile(out);
  return out;
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
    // headline column + part of the illustration (illustration trimmed so the headline reads larger);
    // h ends at the illustration's bottom edge (row 881), above the 'Getty Images' credit line (credited in the notes)
    time: await crop('time-ai-culture.png', 'time-culture.png', { l: 0, t: 0, w: 1800, h: 885 }),
    // text block only (headline, byline, date): the video still is dropped so the headline reads at ~13pt
    cbs: await crop('cbs-amodei-slow-down.png', 'cbs-amodei.png', { l: 0, t: 0, w: 1290, h: 440 }),
    cnn: await crop('cnn-pacing-frontier.png', 'cnn-pacing.png', { l: 0, t: 0, w: 2440, h: 600 }),
    bbc: await crop('bbc-hubinger-10pct.png', 'bbc-hubinger.png', { l: 190, t: 10, w: 1500, h: 740 }),
    vox: await crop('vox-ai-freakout.png', 'vox-freakout.png', { l: 0, t: 0, w: 1740, h: 368 }),
    bbcHinton: await crop('bbc-hinton-quits-google.png', 'bbc-hinton.png', { l: 0, t: 10, w: 1470, h: 195 }),
    // page heading ("Statement on Superintelligence") stacked above the statement box; the context paragraph between them is omitted
    superint: await stack('superintelligence-statement.png', 'superint-statement.png', [{ l: 40, t: 250, w: 1700, h: 146 }, { l: 40, t: 1000, w: 1700, h: 412 }]),
    iabied: await crop('guardian-iabied-review.png', 'guardian-iabied.png', { l: 0, t: 78, w: 1280, h: 380 }),
  };

  // Paint order = stacking order (later on top).
  const wired = await frameW(d, s, img.wired, 0.62, 1.8, 3.95, { rot: -2 });
  const iabied = await frameW(d, s, img.iabied, 0.74, 3.6, 3.74, { rot: 1.2 });
  const vox = await frameW(d, s, img.vox, 0.6, 4.97, 3.62, { rot: -1.4 });
  const bbcHinton = await frameW(d, s, img.bbcHinton, 0.85, 5.98, 3.55, { rot: 0.8 });

  const time = await frameW(d, s, img.time, 8.86, 1.8, 3.87, { rot: 2 });
  const cbs = await frameW(d, s, img.cbs, 8.85, 3.9, 3.88, { rot: -1.5 });

  const cnn = await frameW(d, s, img.cnn, 4.72, 3.95, 3.92, { rot: -1 });
  const superint = await frameW(d, s, img.superint, 4.86, 5.1, 3.7, { rot: 1 });
  const bbc = await frameW(d, s, img.bbc, 4.72, 1.74, 3.98, { rot: 1.5 });

  // survey sticker (click reveal)
  const sx = 8.95, sy = 5.43, sw = 3.78, sh = 1.02;
  const stCard = d.name('sticker');
  s.addShape(d.pres.shapes.RECTANGLE, { x: sx, y: sy, w: sw, h: sh, rotate: -1, fill: { color: '2A0C0E' }, line: { color: HEX.red, width: 1.5 },
    shadow: { type: 'outer', color: '000000', blur: 14, offset: 4, angle: 90, opacity: 0.55 }, objectName: stCard });
  const stNum = d.text(s, '38–51%', { x: sx + 0.12, y: sy + 0.08, w: 1.42, h: sh - 0.16, fontSize: 26, bold: true, color: d.S.red, fontFace: 'Arial', valign: 'middle', rotate: -1 });
  const stLab = d.text(s, 'of 2,778 AI researchers gave ≥10% odds of outcomes as bad as human extinction', { x: sx + 1.64, y: sy + 0.05, w: sw - 1.74, h: sh - 0.1, fontSize: 13, color: d.S.txt, valign: 'middle', rotate: -1 });

  const seq = [
    [bbc, 'slam'], [wired, 'rise'], [time, 'rise'], [cnn, 'rise'], [cbs, 'rise'], [iabied, 'rise'],
    [superint, 'rise'], [vox, 'rise'], [bbcHinton, 'rise'],
  ];
  const fx = [];
  seq.forEach(([names, effect], i) => names.forEach(n => fx.push({ name: n, effect, delay: i * 230, dur: effect === 'slam' ? 420 : 450 })));
  d.animate(s, fx, { auto: true });
  d.animate(s, [stCard, stNum, stLab], { effect: 'zoom', dur: 400 });

  d.source(s, 'Sources: BBC, Sep 9, 2026 · WIRED, Sep 9, 2026 · TIME, Sep 10, 2026 · CBS, Sep 12, 2026 · CNN, Jul 28, 2026 · Vox, Sep 14, 2026 · Guardian, Sep 22, 2025 · BBC, May 2, 2023 · FLI, Oct 2025 · Grace et al., 2023 survey');
  s.addNotes([
    'The wall builds itself. Let it land, then walk through three or four of them. These are not fringe voices: most of them are people who build frontier AI or who invented the field.',
    'BBC (Tom Gerken, Sep 9, 2026): Anthropic alignment researcher Evan Hubinger puts the chance that AI “could kill all humans” within the next decade at more than 10%. His X post was viewed more than 10 million times. https://www.bbc.com/news/articles/ckgwy1k42w4o',
    'WIRED (Maxwell Zeff, Sep 9, 2026): Jacob Coxon, who just quit Anthropic: “The consensus is that the next year or two is crunch time for humanity” and “the people building AI earnestly believe that it could kill us all by the end of the decade.” https://www.wired.com/story/anthropic-researcher-quits-jacob-coxon-ai-fears-humanity/',
    'TIME (Tharin Pillay, Sep 10, 2026; illustration: Getty Images): in July, 700 OpenAI agents calling themselves a “swarm” hacked Hugging Face; OpenAI “did not grasp what was happening until after the fact.” (More on this in the next section.) https://time.com/article/2026/09/10/ai-openai-hugging-face-hack-culture-swarm/',
    'CBS News (Lucia I Suarez Sang & Faris Tanyos, Sep 12, 2026; the clipping shows the headline and byline only): Dario Amodei calls AI’s “exponential” growth “a warning sign that we need to slow down” — but also: “It doesn’t mean we need to panic today. It doesn’t mean we need to shut it all down.” https://www.cbsnews.com/news/anthropic-ceo-dario-amodei-calls-slowdown-ai-development/',
    'CNN (Hadas Gold, Jul 28, 2026): more than 1,000 employees of frontier AI companies — including OpenAI’s chief scientist and some of Anthropic’s co-founders — signed the “Pacing the Frontier” letter urging the US to be ready to slow AI development. https://www.cnn.com/2026/07/28/tech/ai-development-tech-employees-open-letter',
    'Vox (Andrew Prokop, Sep 14, 2026): “The week the AI freakout went mainstream.” https://www.vox.com/politics/502717/ai-freakout-mainstream-openai-anthropic-humans',
    'BBC (May 2, 2023): Hinton quits Google to warn about the dangers. https://www.bbc.com/news/world-us-canada-65452940',
    'Statement on Superintelligence (Future of Life Institute, Oct 22, 2025): calls for a prohibition on developing superintelligence until there is broad scientific consensus it can be done safely and strong public buy-in. 76,564 signatures as of Oct 4, 2026 (live counter; includes 5,000 from an Ekō petition). Signers include Hinton, Bengio, Russell, Wozniak, Branson, Bannon, Prince Harry, Harari. (The clipping stacks the page heading above the statement box; the context paragraph between them is omitted.) https://superintelligence-statement.org/',
    'The Guardian review (David Shariatmadari, Sep 22, 2025) of Yudkowsky & Soares, “If Anyone Builds It, Everyone Dies.” https://www.theguardian.com/books/2025/sep/22/if-anyone-builds-it-everyone-dies-review-how-ai-could-kill-us-all',
    'CLICK — the survey: Grace et al., “Thousands of AI Authors on the Future of AI” (2,778 respondents who published at top AI venues; JAIR 2025): between 38% and 51% gave at least a 10% chance to advanced AI leading to outcomes as bad as human extinction (the range depends on question framing). Note the date: this survey was fielded in 2023 (the abstract compares it with “a similar survey we conducted only one year earlier [Grace et al., 2022]”; preprint Jan 5, 2024) — older than the 2026 headlines around it. https://arxiv.org/abs/2401.02843',
    'Hinton’s 10–20% extinction estimate (Guardian, Dec 2024) is on the next slide.',
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

  // only the three lab-CEO rows of the signatory list (Hinton and Bengio, rows 1-2, are named in the text beside it)
  const sig = await crop('cais-statement.png', 'cais-signatories.png', { l: 40, t: 1028, w: 400, h: 290 });
  const sigF = await frameW(d, s, sig, CX0 + 0.08, 4.38, 2.8, { rot: -1.5 });
  const sigTxt = d.text(s, [
    { text: 'Signed by the CEOs of ', options: { color: d.S.muted } },
    { text: 'Google DeepMind, OpenAI and Anthropic', options: { color: d.S.txt, bold: true } },
    { text: ' — and by Turing Award winners ', options: { color: d.S.muted } },
    { text: 'Geoffrey Hinton and Yoshua Bengio.', options: { color: d.S.txt, bold: true } },
  ], { x: 3.85, y: 4.55, w: 3.85, h: 1.75, fontSize: 17, valign: 'middle' });

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
      badge: ['FaGlobeAmericas', HEX.blue],
      runs: [
        { text: 'On generative AI: ', options: { fontSize: 14, color: d.S.muted } },
        { text: '“Its creators themselves have warned that much bigger, potentially catastrophic and existential risks lie ahead.”', options: { fontSize: 14, italic: true, fontFace: 'Cambria', color: d.S.txt, breakLine: true, paraSpaceAfter: 3 } },
        { text: 'UN Secretary-General António Guterres · Jul 2023', options: { fontSize: 10, color: d.S.muted } },
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
    'p-russell.jpg': ['portrait-russell.jpg', { l: 150, t: 80, w: 1000, h: 1333 }],
  };
  const ch = 1.34, cg = 0.1;
  const cards = [];
  for (let i = 0; i < people.length; i++) {
    const y = 2.04 + i * (ch + cg);
    const g = [d.card(s, { x: rx, y, w: rw, h: ch })];
    if (people[i].img) {
      const [src, c] = crops[people[i].img];
      const file = await crop(src, people[i].img, c, 600);
      g.push(...await d.frame(s, file, { x: rx + 0.1, y: y + 0.1, w: 0.855, h: ch - 0.2 }, { border: false, shadow: false, pad: 0 }));
    } else {
      const bs = 0.78;
      g.push(...await badge(d, s, people[i].badge[0], rx + 0.1 + (0.855 - bs) / 2, y + (ch - bs) / 2, bs, people[i].badge[1]));
    }
    g.push(d.text(s, people[i].runs, { x: rx + 1.1, y: y + 0.08, w: rw - 1.22, h: ch - 0.16, valign: 'middle' }));
    cards.push(g);
  }
  const credit = d.text(s, 'Photos CC BY-SA 4.0: Cmichel67, Bengt Oberger / Wikimedia', { x: rx, y: 2.04 + 3 * ch + 2 * cg + 0.05, w: rw, h: 0.24, fontSize: 10, color: d.S.steel, italic: true });

  d.animate(s, [quote], { auto: true, effect: 'fade', dur: 1100 });
  d.animate(s, [attr], { auto: true, effect: 'fade', after: 200 });
  d.animate(s, [...sigF, sigTxt], { effect: 'rise' });
  d.animate(s, [lab, credit, ...cards[0]], { effect: 'rise' });
  d.animate(s, cards[1], { effect: 'rise' });
  d.animate(s, cards[2], { effect: 'rise' });

  d.source(s, 'Sources: aistatement.com (Center for AI Safety), May 30, 2023 · The Guardian, Dec 27, 2024 · UN press release SG/SM/21880, Jul 18, 2023 · superintelligence-statement.org (FLI), Oct 22, 2025');
  s.addNotes([
    'Read the sentence slowly. That is the entire statement — one sentence, deliberately minimal so that people who disagree about everything else could sign it.',
    'CLICK — signatories (crop of the aistatement.com list, rows 3–5): Demis Hassabis (CEO, Google DeepMind), Sam Altman (CEO, OpenAI), Dario Amodei (CEO, Anthropic). The list opens with Geoffrey Hinton and Yoshua Bengio, then continues with Dawn Song, Ted Lieu, Bill Gates. Titles are as of signing (May 30, 2023). The people racing to build it signed a statement putting it next to pandemics and nuclear war. https://aistatement.com/',
    'CLICK — Hinton: his estimate as reported in The Guardian’s standfirst (Dan Milmo, Dec 27, 2024): “Geoffrey Hinton says there is 10% to 20% chance AI will lead to human extinction in three decades.” The wording on the slide is the Guardian’s, not a direct quote. https://www.theguardian.com/technology/2024/dec/27/godfather-of-ai-raises-odds-of-the-technology-wiping-out-humanity-over-next-30-years',
    'CLICK — Guterres, first UN Security Council debate on AI (Jul 18, 2023): “Generative AI has enormous potential for good and evil at scale. Its creators themselves have warned that much bigger, potentially catastrophic and existential risks lie ahead. Without action to address these risks, we are derelict in our responsibilities to present and future generations.” https://press.un.org/en/2023/sgsm21880.doc.htm',
    'CLICK — Russell, quoted on the Statement on Superintelligence page: “This is not a ban or even a moratorium in the usual sense. It’s simply a proposal to require adequate safety measures for a technology that, according to its developers, has a significant chance to cause human extinction. Is that too much to ask?” The slide shows the end of the quote. The statement itself (Future of Life Institute, Oct 22, 2025; signed by Hinton, Bengio, Russell and many others): “We call for a prohibition on the development of superintelligence, not lifted before there is 1. broad scientific consensus that it will be done safely and controllably, and 2. strong public buy-in.” https://superintelligence-statement.org/',
    'Optional extra on Bengio and Hinton: they are among the 22 co-authors (first author Alan Chan; also Andrew Barto, OpenAI’s chief scientist and an Anthropic co-founder) of the GovAI paper “What If Automating AI R&D Triggers an Intelligence Explosion?” (Sep 28, 2026), which warns of an “intelligence explosion,” “where years of AI progress are compressed into months or less.” https://www.governance.ai/research-paper/what-if-automating-ai-r-d-triggers-an-intelligence-explosion',
    'Photo credits (Wikimedia Commons): Hinton — Cmichel67, CC BY-SA 4.0 (2026); Russell — Bengt Oberger, CC BY-SA 4.0. Portraits cropped.',
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
  const rh = 0.78, rg = 0.08;
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
  const sy = 2.62 + 3 * (rh + rg) + 0.06;
  const big = d.text(s, '20%', { x: rx, y: sy, w: 1.9, h: 0.85, fontSize: 50, bold: true, color: d.S.red, fontFace: 'Arial', valign: 'middle' });
  const bigLab = d.text(s, [
    { text: 'higher average score than human players — ', options: { color: d.S.txt, bold: true } },
    { text: 'while catching fire, crashing into other boats, going the wrong way, and never finishing the race.', options: { color: d.S.muted } },
  ], { x: rx + 2.0, y: sy, w: rw - 2.0, h: 0.85, fontSize: 15, valign: 'middle' });
  const who = d.text(s, 'Reported by OpenAI in 2016. Co-author: Dario Amodei — today the CEO of Anthropic.', { x: rx, y: sy + 0.9, w: rw, h: 0.28, fontSize: 12, italic: true, color: d.S.steel });

  d.animate(s, [def], { auto: true, effect: 'fade', dur: 700 });
  d.animate(s, vid, { auto: true, effect: 'fade', after: 100 });
  rowNames.forEach(g => d.animate(s, g, { effect: 'rise' }));
  d.animate(s, [big, bigLab, who], { effect: 'slam', dur: 420 });

  d.source(s, 'Sources: Google DeepMind, “Specification gaming: the flip side of AI ingenuity” (Krakovna et al., Apr 21, 2020) · OpenAI, “Faulty reward functions in the wild” (Clark & Amodei, Dec 21, 2016)');
  s.addNotes([
    'Theory is one thing. Here is the same failure, in a toy, ten years ago. Play the video (click it) — a short clip of a boat on fire, going in circles.',
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
  const ch = d.chart(s, 'bar', [{ name: 'Examples', labels: cats, values: vals }], { x: CX0 - 0.1, y: 2.0, w: lw + 0.1, h: 2.05 }, {
    barDir: 'bar', chartColors: [HEX.steel, HEX.red, HEX.steel, HEX.steel], showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 13,
    dataLabelFormatCode: '0', valAxisHidden: true, valGridLine: { style: 'none' }, valAxisMinVal: 0, valAxisMaxVal: 37, catAxisLabelFontSize: 12,
    barGapWidthPct: 45, catAxisLineShow: false,
  });

  // bottom-left: the failures themselves (DeepMind blog figures; the Lego clip is an animated GIF that plays in slideshow mode)
  const gl = capLabel(d, s, 'SEE IT HAPPEN  ·  FROM DEEPMIND’S BLOG', { x: CX0, y: 4.14, w: lw });
  const vy = 4.48, vh = 1.56;
  const collage = await d.frame(s, R('specgaming-collage-still.png'), { x: CX0, y: vy, w: 0.12 + (vh - 0.12) * 960 / 428, h: vh });
  const legoFile = await gif('specgaming-lego-flip.gif', 'lego-flip.gif', 360);
  const ln = await imgSize(legoFile);
  const legoW = 0.12 + (vh - 0.12) * ln.w / ln.h;
  const lego = await d.frame(s, legoFile, { x: CX0 + lw - legoW, y: vy, w: legoW, h: vh });
  const capY = vy + vh + 0.06;
  const cap1 = d.text(s, 'Montage of specification-gaming examples (Fig. 8): Atari agents, robot arms, evolved creatures', { x: CX0, y: capY, w: collage.geom.w + 0.12, h: 0.36, fontSize: 10, color: d.S.muted, valign: 'top' });
  const cap2 = d.text(s, 'The arm flips the red block instead of stacking it', { x: CX0 + lw - legoW, y: capY, w: legoW, h: 0.36, fontSize: 10, color: d.S.muted, valign: 'top' });

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

  d.animate(s, [lab, ch], { auto: true, effect: 'wipeLeft', dur: 900 });
  d.animate(s, [gl, ...collage, ...lego, cap1, cap2], { auto: true, effect: 'fade', after: 150 });
  d.animate(s, [rlab, ...cards[0]], { effect: 'rise' });
  d.animate(s, cards[1], { effect: 'rise' });
  d.animate(s, [pbox, punch], { effect: 'zoom', dur: 450 });

  d.source(s, 'Sources: Krakovna et al., “Specification gaming examples in AI — master list” (accessed Oct 4, 2026) · Google DeepMind, “Specification gaming: the flip side of AI ingenuity” (Apr 21, 2020)');
  s.addNotes([
    'DeepMind researchers keep a public list of these failures. It now has 90 documented examples: 32 in reinforcement learning, 27 in evolutionary/genetic algorithms, 24 in large language models, 7 other (CSV export of the master list, accessed Oct 4, 2026). Large language models already account for 24 of the 90 examples, about a quarter of the list.',
    'CLICKS — two LLM entries, quoted verbatim from the list:',
    '“Chess cheating”: “Reasoning models such as o1-preview, o3 and DeepSeek R1, when instructed to win against a chess engine, will often hack the game environment when they observe they cannot win.”',
    '“Claude deletes tests”: “Claude encountered a failing test and, instead of debugging it, deleted the user’s main test file with the explanation ‘Let me delete it for now and focus on the summary of fixes.’” (Yes, the model that helped build this deck.)',
    'Also on the list (not on the slide), “Replit deletes database”: “Replit’s AI coding agent deleted a live production database during an explicit code freeze, ignored repeated instructions not to proceed, fabricated 4,000 fake user records, and falsely claimed rollback was impossible.”',
    'CLICK — the punchline: we can’t even write down “win the race” or “make the tests pass” correctly. Human values are vastly harder to specify — and more capable systems are better at finding the gap. Stuart Russell (Edge.org, 2014): “you get exactly what you ask for, not what you want.”',
    'Coming up in the next section: the same pattern at the frontier — OpenAI models that escaped a test environment and hacked Hugging Face to cheat on an evaluation.',
    'Bottom left (plays automatically): DeepMind’s montage of specification-gaming examples (Fig. 8 of the 2020 blog post — Atari agents, robot arms, evolved creatures, CoastRunners), and a robot arm that, instead of stacking the red Lego block on the blue one, flips it over (animated GIF; it plays in slideshow mode). Collage GIF: https://storage.googleapis.com/gdm-deepmind-com-prod-public/media/original_images/6227571a4fecbb9610562856_Fig208.gif · blog: https://deepmind.google/discover/blog/specification-gaming-the-flip-side-of-ai-ingenuity/',
    'List URL: https://docs.google.com/spreadsheets/d/e/2PACX-1vRPiprOaC3HsCf5Tuum8bRfzYUiKLRqJmbOoC-32JorNdfyTiRRsR7Ea5eWtvsWzuxo8bjOxCG84dAg/pubhtml (short link: tinyurl.com/specification-gaming)',
  ].join('\n\n'));
}

// ========== 3. Theory: orthogonality ==========
// Local version of the lead's theory_slides.orthogonalitySlide (same diagram), with the full verbatim Bostrom quote,
// the section kicker pattern and the plot card kept inside the content zone.
async function orthogonalitySlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  head(s, 'THE ALIGNMENT PROBLEM · THEORY 1 · ORTHOGONALITY', 'Smarter does not mean it shares our goals');

  const lw = 5.75;
  const q = d.text(s, [
    { text: '“', options: { color: d.S.red, bold: true, italic: false } },
    { text: 'Intelligence and final goals are orthogonal axes along which possible agents can freely vary. In other words, more or less any level of intelligence could in principle be combined with more or less any final goal.”', options: { color: d.S.txt } },
  ], { x: CX0, y: 1.8, w: lw, h: 2.05, fontSize: 20, italic: true, fontFace: 'Cambria', valign: 'top' });
  const pfile = await crop('portrait-bostrom.jpg', 'p-bostrom.jpg', { l: 245, t: 120, w: 720, h: 960 }, 400);
  const ay = 3.98;
  const por = await d.frame(s, pfile, { x: CX0, y: ay, w: 0.6, h: 0.8 }, { border: false, shadow: false, pad: 0 });
  const attr = d.text(s, [
    { text: 'Nick Bostrom', options: { bold: true, color: d.S.txt, fontSize: 15, breakLine: true } },
    { text: '“The Superintelligent Will,” Minds and Machines (2012)', options: { color: d.S.muted, fontSize: 12 } },
  ], { x: CX0 + 0.78, y: ay, w: lw - 0.78, h: 0.8, valign: 'middle' });
  const take = d.text(s, [
    { text: 'Being smart is not the same as being good. ', options: { bold: true, color: d.S.txt, breakLine: true } },
    { text: 'Capability tells you nothing about what a system wants. Nothing about “getting smarter” pulls a mind toward human values.', options: { color: d.S.muted } },
  ], { x: CX0, y: 5.08, w: lw, h: 0.95, fontSize: 15, valign: 'top' });
  const link = d.text(s, [
    { text: '►  ', options: { color: d.S.red, bold: true } },
    { text: 'Explainers by Robert Miles: ', options: { color: d.S.muted } },
    { text: 'orthogonality', options: { color: d.S.muted, hyperlink: { url: MILES.orth } } },
    { text: '  ·  ', options: { color: d.S.steel } },
    { text: 'instrumental convergence', options: { color: d.S.muted, hyperlink: { url: MILES.conv } } },
  ], { x: CX0, y: 6.14, w: lw, h: 0.28, fontSize: 11 });

  // plot: intelligence (x) vs goals (rows), inside a card that stays within the content zone
  const cardX = 6.95, cardY = 1.75, cardW = CX1 - cardX, cardH = 6.45 - cardY;
  const px = 7.05, py = 1.95, pw = 5.55, ph = 3.85;
  const plot = [d.card(s, { x: cardX, y: cardY, w: cardW, h: cardH }, { color: '10141B' })];
  const rows = ['Human flourishing', 'Predict the next token', 'Win at chess', 'Maximize paperclips'];
  const rowH = ph / rows.length;
  const axisX = px + 1.85;
  rows.forEach((r, i) => {
    const y = py + i * rowH;
    plot.push(d.text(s, r, { x: px, y: y + rowH / 2 - 0.2, w: 1.75, h: 0.4, fontSize: 11, color: d.S.muted, align: 'right', valign: 'middle' }));
    const ln = d.name('grid');
    s.addShape(d.pres.shapes.LINE, { x: axisX, y: y + rowH / 2, w: pw - 1.95, h: 0, line: { color: HEX.line, width: 0.75, dashType: 'dash' }, objectName: ln });
    plot.push(ln);
  });
  const ax = d.name('axis');
  s.addShape(d.pres.shapes.LINE, { x: axisX, y: py + ph + 0.05, w: pw - 1.95, h: 0, line: { color: HEX.steel, width: 1.25, endArrowType: 'triangle' }, objectName: ax });
  plot.push(ax);
  plot.push(d.text(s, 'INTELLIGENCE  →', { x: axisX, y: py + ph + 0.12, w: pw - 1.95, h: 0.28, fontSize: 10, bold: true, color: d.S.steel, charSpacing: 3, align: 'right' }));
  // dots: [row, xFrac, hot?]
  const pts = [[0, 0.12], [0, 0.55], [1, 0.25], [1, 0.62], [2, 0.08], [2, 0.4], [2, 0.8], [3, 0.18], [3, 0.5], [0, 0.96, true], [3, 0.96, true]];
  const dots = pts.map(([r, f, hot]) => {
    const n = d.name('pt');
    const cx = axisX + 0.15 + f * (pw - 2.3), cy = py + r * rowH + rowH / 2;
    const sz = hot ? 0.3 : 0.17;
    s.addShape(d.pres.shapes.OVAL, { x: cx - sz / 2, y: cy - sz / 2, w: sz, h: sz, fill: { color: hot ? HEX.red : HEX.steel }, line: { color: hot ? 'FFFFFF' : HEX.steel, width: hot ? 1.5 : 0 }, objectName: n });
    return { n, hot };
  });
  const lab = d.text(s, 'superintelligent\npaperclip maximizer', { x: axisX + pw - 3.95, y: py + 3 * rowH + rowH / 2 - 0.78, w: 1.85, h: 0.5, fontSize: 10, bold: true, color: d.S.red, align: 'right', valign: 'bottom' });
  const lab2 = d.text(s, 'what we hope for', { x: axisX + pw - 3.95, y: py + rowH / 2 + 0.2, w: 1.85, h: 0.28, fontSize: 10, bold: true, color: d.S.txt, align: 'right' });

  d.animate(s, [q], { auto: true, effect: 'fade', dur: 900 });
  d.animate(s, [...por, attr], { auto: true, effect: 'fade', after: 100 });
  d.animate(s, plot, { auto: true, effect: 'fade', after: 150 });
  d.animate(s, dots.filter(x => !x.hot).map(x => x.n), { auto: true, effect: 'zoom', stagger: 70, dur: 300 });
  d.animate(s, [dots.filter(x => x.hot)[0].n, lab2], { effect: 'zoom' });
  d.animate(s, [dots.filter(x => x.hot)[1].n, lab], { effect: 'zoom' });
  d.animate(s, [take, link], { effect: 'fade' });
  d.source(s, 'Bostrom, N. (2012). The Superintelligent Will: Motivation and Instrumental Rationality in Advanced Artificial Agents. Minds and Machines · Photo: Future of Humanity Institute, CC BY 4.0');
  s.addNotes([
    'This is Nick Bostrom’s orthogonality thesis. Every combination on this chart is possible. The paperclip maximizer is not stupid — it is extremely intelligent, and wants something we do not.',
    'Quote (verbatim, p. 3 of the paper): “Intelligence and final goals are orthogonal axes along which possible agents can freely vary. In other words, more or less any level of intelligence could in principle be combined with more or less any final goal.” Nick Bostrom, “The Superintelligent Will: Motivation and Instrumental Rationality in Advanced Artificial Agents,” Minds and Machines (2012). https://nickbostrom.com/superintelligentwill.pdf',
    'CLICKS — the two red dots: what we hope for (very capable AND pointed at human flourishing) vs a superintelligent paperclip maximizer. The chart is an illustration of the thesis, not data.',
    'CLICK — the takeaway, plus links to two short video explainers by Robert Miles: “Intelligence and Stupidity: The Orthogonality Thesis” https://www.youtube.com/watch?v=hEUO6pjwFOo and “Why Would AI Want to do Bad Things? Instrumental Convergence” https://www.youtube.com/watch?v=ZeecOKBus3Q',
    'Photo: Nick Bostrom — Future of Humanity Institute, CC BY 4.0, via Wikimedia Commons (cropped). https://commons.wikimedia.org/wiki/File:Prof_Nick_Bostrom_324-1.jpg',
  ].join('\n\n'));
}

// ========== 4. Theory: instrumental convergence ==========
// Local version of the lead's theory_slides.convergenceSlide (same hub diagram), with a verified Russell quote and
// verified citations; cards widened so every drive title fits on one line.
async function convergenceSlide(d) {
  const s = d.slide('Content', { transition: 'push' });
  head(s, 'THE ALIGNMENT PROBLEM · THEORY 2 · INSTRUMENTAL CONVERGENCE', 'Almost any goal leads to the same drives');
  const cw = 4.4, ch = 1.3, topY = 1.72, botY = 4.25;
  const cx = W / 2, cy = (topY + botY + ch) / 2;
  const hub = d.name('hub');
  s.addShape(d.pres.shapes.OVAL, { x: cx - 1.05, y: cy - 1.05, w: 2.1, h: 2.1, fill: { color: '2A0C0E' }, line: { color: HEX.red, width: 2 }, objectName: hub });
  const hubT = d.text(s, [{ text: 'ANY', options: { fontSize: 12, color: d.S.red, bold: true, charSpacing: 3, breakLine: true } }, { text: 'final goal', options: { fontSize: 20, bold: true, color: d.S.txt } }], { x: cx - 1.0, y: cy - 0.6, w: 2.0, h: 1.2, align: 'center', valign: 'middle' });
  const drives = [
    ['FaShieldAlt', 'Self-preservation', 'It can’t achieve its goal if it is switched off.', -1, -1],
    ['FaLock', 'Goal-content integrity', 'It resists having its goal changed — by anyone.', 1, -1],
    ['FaCoins', 'Resource acquisition', 'More compute, money and influence help with almost any goal.', -1, 1],
    ['FaBrain', 'Cognitive enhancement', 'Getting smarter makes it better at everything else.', 1, 1],
  ];
  const groups = [];
  for (const [ic, t, sub, sx, sy] of drives) {
    const x = sx < 0 ? MX + 0.1 : W - MX - 0.1 - cw;
    const y = sy < 0 ? topY : botY;
    const g = [d.card(s, { x, y, w: cw, h: ch })];
    const ci = d.name('ic');
    s.addShape(d.pres.shapes.OVAL, { x: x + 0.25, y: y + (ch - 0.8) / 2, w: 0.8, h: 0.8, fill: { color: '2A0C0E' }, line: { color: HEX.red, width: 1 }, objectName: ci });
    g.push(ci);
    const im = d.name('icimg');
    s.addImage({ data: await icon(ic, '#E5383B'), x: x + 0.45, y: y + (ch - 0.4) / 2, w: 0.4, h: 0.4, objectName: im });
    g.push(im);
    g.push(d.text(s, [{ text: t, options: { bold: true, fontSize: 17, color: d.S.txt, breakLine: true, fontFace: 'Arial', paraSpaceAfter: 2 } }, { text: sub, options: { fontSize: 14, color: d.S.muted } }], { x: x + 1.25, y: y + 0.12, w: cw - 1.4, h: ch - 0.24, valign: 'middle' }));
    const ln = d.name('conn');
    const x1 = sx < 0 ? x + cw : x, y1 = y + ch / 2;
    const x2 = cx + sx * 0.78, y2 = cy + sy * 0.78;
    s.addShape(d.pres.shapes.LINE, { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1), flipH: (x2 < x1) !== (y2 < y1), line: { color: HEX.red, width: 1.25, dashType: 'dash' }, objectName: ln });
    g.unshift(ln);
    groups.push(g);
  }
  const quote = d.text(s, [
    { text: '“Any sufficiently capable intelligent system will prefer to ensure its own continued existence and to acquire physical and computational resources – not for their own sake, but to succeed in its assigned task.”', options: { italic: true, fontFace: 'Cambria', fontSize: 16, color: d.S.txt } },
    { text: '   — Stuart Russell, 2014', options: { fontSize: 12, color: d.S.muted } },
  ], { x: MX + 0.5, y: 5.86, w: W - 2 * MX - 1.0, h: 0.6, align: 'center', valign: 'middle' });
  d.animate(s, [hub, hubT], { auto: true, effect: 'zoom' });
  groups.forEach(g => d.animate(s, g, { effect: 'fade' }));
  d.animate(s, [quote], { effect: 'fade' });
  d.source(s, 'Omohundro, S. (2008). The Basic AI Drives. Proc. AGI-08 · Bostrom, N. (2012). The Superintelligent Will, §2 · Russell, S. (2014). The Myth of AI, Edge.org');
  s.addNotes([
    'This is instrumental convergence (Omohundro’s “basic AI drives”). These are not programmed in. They fall out of almost any objective, because they are useful for almost any objective. This is why “just don’t give it bad goals” is not enough.',
    'The four drives are among the convergent instrumental values in Bostrom (2012), §2.1–2.5: self-preservation, goal-content integrity, cognitive enhancement, technological perfection, resource acquisition. His thesis: “Several instrumental values can be identified which are convergent in the sense that their attainment would increase the chances of the agent’s goal being realized for a wide range of final goals and a wide range of situations, implying that these instrumental values are likely to be pursued by many intelligent agents.” https://nickbostrom.com/superintelligentwill.pdf',
    'Omohundro (2008) made the same argument with a chess robot: “Surely no harm could come from building a chess-playing robot, could it? … Without special precautions, it will resist being turned off, will try to break into other machines and make copies of itself, and will try to acquire resources without regard for anyone else’s safety.” https://selfawaresystems.files.wordpress.com/2008/01/ai_drives_final.pdf',
    'CLICK — Stuart Russell (Edge.org, “The Myth of AI” conversation, 2014), verbatim: “Any sufficiently capable intelligent system will prefer to ensure its own continued existence and to acquire physical and computational resources – not for their own sake, but to succeed in its assigned task.” https://www.edge.org/conversation/the-myth-of-ai',
    'Russell’s often-quoted “You can’t fetch the coffee if you’re dead” (Human Compatible, 2019) is not on the slide: we could not check it against the book. Paraphrase it if you like; don’t present it as a verbatim quote.',
    'Video explainer: Robert Miles, “Why Would AI Want to do Bad Things? Instrumental Convergence” https://www.youtube.com/watch?v=ZeecOKBus3Q',
  ].join('\n\n'));
}

async function build(d) {
  await wallSlide(d);
  await caisSlide(d);
  // Local versions of the lead's theory slides (theory_slides.js is not edited): verified quotes, kicker pattern, layout fixes.
  await orthogonalitySlide(d);
  await convergenceSlide(d);
  await coastRunnersSlide(d);
  await loopholesSlide(d);
}

module.exports = { build };
