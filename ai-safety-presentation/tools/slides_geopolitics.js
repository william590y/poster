// Act IV · The World — AI and the military, geopolitical rivalry, use by bad actors.
// Sources: assets/research/geopolitics/manifest.json (verified items only) + assets/original/image11.png.
// Derived crops/highlights: assets/slides/geopolitics/ (regenerate with make_crops.py there).
const { HEX, W, MX, A } = require('./lib');
const { icon } = require('./icons');

const R = (f) => A('research', 'geopolitics', f);
const D = (f) => A('slides', 'geopolitics', f);
const CW = W - 2 * MX; // content width

function heading(s, kicker, title) {
  s.addText(kicker, { placeholder: 'kicker' });
  s.addText(title, { placeholder: 'title' });
}

// Small uppercase label (section header inside a slide).
function label(d, s, text, box, color) {
  return d.text(s, text, { ...box, h: box.h || 0.3, fontSize: 11, bold: true, color: color || d.S.red, charSpacing: 2, valign: 'middle' });
}

// Numbered circle + text row (timeline step).
function step(d, s, n, x, y, runs, { w = 4.3, h = 0.66, color = HEX.red } = {}) {
  const c = d.name('num');
  s.addShape(d.pres.shapes.OVAL, { x, y: y + 0.04, w: 0.42, h: 0.42, fill: { color: '2A0C0E' }, line: { color, width: 1.5 }, objectName: c });
  const t1 = d.text(s, String(n), { x, y: y + 0.04, w: 0.42, h: 0.42, fontSize: 14, bold: true, color: d.S.txt, align: 'center', valign: 'middle', fontFace: 'Arial' });
  const t2 = d.text(s, runs, { x: x + 0.6, y, w, h, fontSize: 14, color: d.S.muted, valign: 'top' });
  return [c, t1, t2];
}

// ---------------------------------------------------------------- 1. China ship
async function shipSlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  heading(s, 'THE WORLD · AI AND THE MILITARY · 1', 'An AI hallucination almost started a war');

  const cnn = await d.frame(s, D('cnn-ship-head.png'), { x: MX, y: 1.8, w: 6.9, h: 2.05 }, { rot: -1.2 });
  const giz = await d.frame(s, R('gizmodo-almost-started-war.png'), { x: 1.35, y: 3.68, w: 5.6, h: 2.86 }, { rot: 1.5 });

  // right column: what happened
  const rx = 7.95, rw = W - MX - rx;
  const lab = label(d, s, 'WHAT CNN’S SOURCES DESCRIBE · SPRING 2026', { x: rx, y: 1.78, w: rw });
  const line = d.name('spine');
  s.addShape(d.pres.shapes.LINE, { x: rx + 0.21, y: 2.45, w: 0, h: 2.5, line: { color: HEX.line, width: 1.5 }, objectName: line });
  const B = (t, c) => ({ text: t, options: { bold: true, color: c || d.S.txt } });
  const M = (t) => ({ text: t, options: { color: d.S.muted } });
  const sw = rw - 0.6;
  const st = [
    step(d, s, 1, rx, 2.2, [M('During the Iran war, an analyst runs intel on a '), B('Chinese ship’s manifest'), M(' through an AI chatbot')], { w: sw }),
    step(d, s, 2, rx, 2.95, [M('It wrongly concludes the ship carries '), B('nuclear-weapons-program components', 'FF6B6B')], { w: sw }),
    step(d, s, 3, rx, 3.7, [M('AI packages the claim into a '), B('standard intelligence report'), M(', circulated across the military')], { w: sw }),
    step(d, s, 4, rx, 4.45, [B('Armed troops prepare to board'), M('; military planes are in the air. Caught only just before the operation')], { w: sw, h: 0.72 }),
  ];
  const qc = d.card(s, { x: rx, y: 5.42, w: rw, h: 1.08 }, { color: '2A0C0E', line: HEX.red });
  const q = d.text(s, [
    { text: '“Entirely false” — but it “almost started a war.”', options: { fontSize: 19, bold: true, color: d.S.txt, fontFace: 'Arial', breakLine: true } },
    { text: '“AI allows you to get to a bad idea faster.” — CNN sources', options: { fontSize: 13, italic: true, color: d.S.muted } },
  ], { x: rx + 0.22, y: 5.5, w: rw - 0.4, h: 0.92, valign: 'middle' });

  d.animate(s, cnn, { auto: true, effect: 'slam', dur: 450 });
  d.animate(s, giz, { auto: true, effect: 'rise', delay: 150, dur: 600 });
  d.animate(s, [lab, line, ...st[0], ...st[1]], { effect: 'fade', stagger: 0, dur: 500 });
  d.animate(s, [...st[2], ...st[3]], { effect: 'fade', dur: 500 });
  d.animate(s, [qc, q], { effect: 'slam', dur: 450 });
  d.source(s, 'Sources: CNN exclusive (Lillis & Cohen), Sep 18, 2026 · Gizmodo, Sep 18, 2026 (photo shows a separate interdiction, MT Davina — not the Chinese ship).');
  s.addNotes([
    'HERO STORY. CNN exclusive, Sept 18, 2026: during the 2026 war with Iran, an intelligence report circulated across the US military claiming a Chinese ship in the Middle East was transporting components of a nuclear weapons program.',
    'What actually happened (per CNN sources): an analyst (reporting originated with US Special Operations Command Pacific) used an AI chatbot on intel about the ship’s manifest. The bot fused open-source information with classified signals intelligence and wrongly concluded the ship carried nuclear-weapons-program components. The analyst then used AI again to package it into a standard intel report. Armed US personnel were preparing to board, military planes were in the air; it was caught only just before the planned operation.',
    'Quotes: the report was “entirely false” but “almost started a war.” Another source: “AI allows you to get to a bad idea faster.” A source told CNN the “hallucination” was part of a trend, not an isolated incident (Gizmodo).',
    'CAVEATS — say it precisely: the claim was nuclear-weapons-PROGRAM COMPONENTS, not a ship “delivering nukes.” CNN could not learn what the misidentified cargo actually was, nor whether the chatbot was a commercial or government model. The Gizmodo photo is a file image of a different US interdiction (MT Davina, Indian Ocean), not the Chinese ship.',
    'URLs: https://www.cnn.com/2026/09/18/politics/us-military-ai-false-intelligence-china-ship · https://gizmodo.com/almost-started-a-war-us-military-nearly-boarded-a-chinese-ship-based-on-bad-intel-from-ai-2000814290',
  ].join('\n\n'));
}

// ---------------------------------------------------------------- 2. Speed over alignment
async function memoSlide(d) {
  const s = d.slide('Content', { transition: 'pushLeft' });
  heading(s, 'THE WORLD · AI AND THE MILITARY · 2', 'The Pentagon chose speed over alignment');

  const head = await d.frame(s, R('hegseth-memo-header.png'), { x: MX, y: 1.74, w: 5.3, h: 2.1 }, { rot: -1.5 });
  const memo = await d.frame(s, D('memo-speed-hl.png'), { x: 0.72, y: 3.74, w: 6.35, h: 2.8 }, { rot: 0.8 });

  const rx = 7.55, rw = W - MX - rx;
  const txt = d.text(s, [
    { text: 'The same memo demands models “free from usage policy constraints” and “any lawful use” in every AI contract. ', options: { color: d.S.muted } },
    { text: 'Anthropic kept two limits: no mass domestic surveillance, no fully autonomous weapons.', options: { color: d.S.txt, bold: true } },
  ], { x: rx, y: 1.78, w: rw, h: 1.15, fontSize: 15, valign: 'top' });
  const cbs = await d.frame(s, D('cbs-head.png'), { x: rx + 0.1, y: 3.02, w: 5.0, h: 2.12 }, { rot: 1.2 });
  const tnw = await d.frame(s, R('tnw-appeals-court-anthropic.png'), { x: rx, y: 5.22, w: 5.1, h: 1.32 }, { rot: -1 });

  d.animate(s, head, { auto: true, effect: 'rise', dur: 500 });
  d.animate(s, memo, { auto: true, effect: 'rise', delay: 150, dur: 600 });
  d.animate(s, [txt], { effect: 'fade' });
  d.animate(s, cbs, { effect: 'slam', dur: 450 });
  d.animate(s, tnw, { effect: 'slam', dur: 450 });
  d.source(s, 'Sources: Secretary of War memo “Artificial Intelligence Strategy for the Department of War,” Jan 9, 2026 (pp. 1, 4–5) · CBS News, Feb 28, 2026 · The Next Web, Sep 25, 2026.');
  s.addNotes([
    'These are real rendered pages of the official memo PDF (letterhead from page 1; highlighted passage from page 4). Verbatim key line: “We must accept that the risks of not moving fast enough outweigh the risks of imperfect alignment.” (Section “Speed Wins”, under “Acceleration Expectations”.) Memo dated Jan 9, 2026; released Jan 12, 2026.',
    'Other directives in the same memo: latest frontier models deployed within 30 days of public release; “We must approach risk tradeoffs, ‘equities’, and other subjective questions as if we were at war”; a monthly “Barrier Removal Board” may waive non-statutory requirements. Page 5 (“Clarifying ‘Responsible AI’”): the Department must use “models free from usage policy constraints that may limit lawful military applications”, and standard “any lawful use” language goes into every AI contract within 180 days.',
    'Consequence — the Anthropic–Pentagon dispute: Anthropic held two exceptions (mass domestic surveillance of Americans; fully autonomous weapons). Anthropic, Feb 27, 2026: “we do not believe that today’s frontier AI models are reliable enough to be used in fully autonomous weapons.” Hegseth declared Anthropic a “supply chain risk to national security” — a label Anthropic says was “historically reserved for US adversaries” — and Trump ordered federal agencies to stop using Anthropic (6-month DoD phase-out). Sept 25, 2026: DC Circuit upheld the designation 2–1 (Katsas, joined by Rao; Henderson dissenting); Anthropic had won a parallel case in August.',
    'Link back to the previous slide: Yahoo News headline the day of the CNN story — “Pete Hegseth’s AI Strategy Almost Started War With China.”',
    'Disclosure: this deck was made with Claude (Anthropic), a party to this dispute.',
    'URLs: https://media.defense.gov/2026/Jan/12/2003855671/-1/-1/0/artificial-intelligence-strategy-for-the-department-of-war.pdf · https://www.cbsnews.com/news/hegseth-declares-anthropic-supply-chain-risk/ · https://www.anthropic.com/news/statement-comments-secretary-war · https://thenextweb.com/news/anthropic-pentagon-supply-chain-risk-appeals-court-ruling · https://www.yahoo.com/news/politics/articles/pete-hegseths-ai-strategy-almost-220218803.html',
  ].join('\n\n'));
}

// ---------------------------------------------------------------- 3. War room wall
async function warRoomSlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  heading(s, 'THE WORLD · AI AND THE MILITARY · 3', 'AI is already in the war room');

  const ukr = await d.frame(s, D('ukraine-drones.png'), { x: MX, y: 1.82, w: 4.0, h: 2.4 }, { rot: -2 });
  const lav = await d.frame(s, D('lavender.png'), { x: 4.72, y: 1.8, w: 3.9, h: 2.75 }, { rot: 1.4 });
  const gos = await d.frame(s, D('gospel.png'), { x: 8.83, y: 1.8, w: 3.9, h: 2.9 }, { rot: -1.2 });

  const grok = await d.frame(s, A('original', 'image11.png'), { x: MX, y: 4.55, w: 4.0, h: 0.66 }, { rot: 1 });
  const grokDek = d.text(s, [
    { text: 'Trump “spent hours” asking Grok how Venezuelans would react to Maduro’s capture — ', options: { color: d.S.muted } },
    { text: 'a month before the U.S. seized him', options: { color: d.S.txt, bold: true } },
    { text: ' (Time, via TechCrunch)', options: { color: d.S.muted } },
  ], { x: MX + 0.05, y: 5.38, w: 3.95, h: 1.05, fontSize: 14, valign: 'top' });

  const con = await d.frame(s, R('defensescoop-pentagon-frontier-ai-contracts.png'), { x: 4.75, y: 4.95, w: 3.85, h: 1.3 }, { rot: -1 });
  const conDek = d.text(s, 'Up to $200M each: Anthropic, Google, OpenAI, xAI (Jul 2025)', { x: 4.8, y: 6.27, w: 3.8, h: 0.28, fontSize: 11, color: d.S.muted });

  const eur = await d.frame(s, D('euronews-wargames.png'), { x: 8.85, y: 4.98, w: 3.88, h: 0.55 }, { rot: 0.8 });
  const st = d.stat(s, { x: 8.9, y: 5.55, w: 1.75, value: '95%', valueSize: 40, color: d.S.red, label: '' });
  const stLab = d.text(s, 'of simulated nuclear crises saw frontier models choose escalation (KCL, 2026)', { x: 10.6, y: 5.66, w: 2.13, h: 0.85, fontSize: 12, color: d.S.muted, valign: 'middle' });

  d.animate(s, ukr, { auto: true, effect: 'rise', dur: 500 });
  d.animate(s, lav, { auto: true, effect: 'rise', delay: 120, dur: 500 });
  d.animate(s, gos, { auto: true, effect: 'rise', delay: 120, dur: 500 });
  d.animate(s, [...grok, grokDek], { effect: 'slam', dur: 450 });
  d.animate(s, [...con, conDek], { effect: 'rise' });
  d.animate(s, [...eur, st[0], stLab], { effect: 'zoom', dur: 450 });
  d.source(s, 'Sources: The Defense Post, Sep 10, 2026 · The Guardian, Apr 3, 2024 & Dec 1, 2023 (+972/Local Call) · TechCrunch, Oct 1, 2026 · DefenseScoop, Jul 14, 2025 · Euronews; Payne, arXiv:2602.14740.');
  s.addNotes([
    'Wall of headlines — AI is already inside military decision loops.',
    'Ukraine (The Defense Post, Sep 10, 2026): Ukraine is testing whether AI can let drones detect, acquire and hit moving ground targets without continuous pilot control — drones fly 2 km and must acquire a moving lightly armored vehicle from ≥500 m; 7 companies evaluated (MoD + Brave1). The image is a Ukrainian Ministry of Defence promotional graphic.',
    'Israel (The Guardian, based on +972 Magazine / Local Call): “Lavender” marked about 37,000 Gazans as potential targets; intelligence sources claim permission was given to kill civilians in pursuit of low-ranking militants. “The Gospel”: a data-driven “factory” that greatly increases the number of strike targets.',
    'Grok / Venezuela (the user’s headline, TechCrunch, Oct 1, 2026, reporting Time): in Dec 2025, about a month before the U.S. invaded Venezuela and captured Nicolás Maduro, Trump reportedly “spent hours” with Musk’s Grok, including asking how Venezuelans would respond to Maduro’s capture. Grok reportedly called Maduro a “deeply unpopular dictator” whose downfall many would celebrate; Trump “came away thinking Grok was ingenious.” Single-source reporting via Time — say “reportedly.”',
    'Pentagon contracts (DefenseScoop, Jul 14, 2025): CDAO awarded “frontier AI” contracts worth up to $200M each to xAI, OpenAI, Anthropic and Google. The Intercept (Sep 8, 2026) later obtained records showing the labs working “hand-in-hand” with the Pentagon.',
    'Nuclear command & control: King’s College London study (Kenneth Payne, arXiv:2602.14740, Feb 2026; GPT-5.2, Claude Sonnet 4, Gemini 3 Flash): models chose nuclear escalation in 95% of simulated war games; “no model ever chose accommodation or withdrawal even when under acute pressure.” Simulation, not real NC3 systems.',
    'URLs: https://thedefensepost.com/2026/09/10/ukraine-ai-guided-drones/ · https://www.theguardian.com/world/2024/apr/03/israel-gaza-ai-database-hamas-airstrikes · https://www.theguardian.com/world/2023/dec/01/the-gospel-how-israel-uses-ai-to-select-bombing-targets · https://techcrunch.com/2026/10/01/musks-ai-chatbot-grok-reportedly-encouraged-trump-to-capture-venezuelas-president/ · https://defensescoop.com/2025/07/14/pentagon-ai-contracts-musk-xai-google-openai-anthropic-cdao/ · https://www.euronews.com/2026/02/27/ai-chatbots-chose-nuclear-escalation-in-95-of-simulated-war-games-study-finds · https://arxiv.org/abs/2602.14740',
  ].join('\n\n'));
}

// ---------------------------------------------------------------- 4. No guardrails
async function guardrailsSlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  heading(s, 'THE WORLD · GEOPOLITICAL RIVALRY · 1', 'The White House rejects AI guardrails');

  const cap = d.text(s, [
    { text: 'Donald J. Trump', options: { bold: true, color: d.S.txt } },
    { text: '  ·  Truth Social  ·  Sep 14, 2026, 9:58 AM', options: { color: d.S.muted } },
  ], { x: MX, y: 1.78, w: 6.6, h: 0.32, fontSize: 14 });
  const post = await d.frame(s, D('trump-post-hl.png'), { x: MX, y: 2.18, w: 6.6, h: 3.5 }, { rot: 0 });
  const ctx = d.text(s, 'One of a daylong string of posts rejecting AI leaders’ calls for regulation, per CNN.', { x: MX, y: 5.82, w: 6.6, h: 0.5, fontSize: 13, italic: true, color: d.S.muted, valign: 'top' });

  const rx = 7.65, rw = W - MX - rx;
  const cnn = await d.frame(s, D('cnn-hoax-head.png'), { x: rx, y: 1.8, w: rw, h: 1.25 }, { rot: 1 });
  const q = d.text(s, [
    { text: '“The whole thing is a hoax.”', options: { fontFace: 'Cambria', italic: true, fontSize: 24, color: d.S.txt, breakLine: true } },
    { text: 'Trump on AI risk, on a call with Nvidia’s Jensen Huang', options: { fontSize: 12, color: d.S.muted } },
  ], { x: rx, y: 3.3, w: rw, h: 0.95, valign: 'middle' });
  const eoLab = d.text(s, [
    { text: 'Dec 11, 2025: ', options: { bold: true, color: d.S.txt } },
    { text: 'an executive order sets up a DOJ task force to sue states over their AI laws', options: { color: d.S.muted } },
  ], { x: rx, y: 4.42, w: rw, h: 0.55, fontSize: 14, valign: 'top' });
  const npr = await d.frame(s, D('npr-head.png'), { x: rx + 0.05, y: 5.05, w: rw - 0.1, h: 1.45 }, { rot: -1 });

  d.animate(s, [cap, ...post], { auto: true, effect: 'rise', dur: 600 });
  d.animate(s, [ctx], { auto: true, effect: 'fade', delay: 200 });
  d.animate(s, [...cnn, q], { effect: 'slam', dur: 450 });
  d.animate(s, [eoLab, ...npr], { effect: 'rise' });
  d.source(s, 'Sources: Truth Social post (archived at trumpstruth.org/statuses/41712); highlights added · CNN (Liptak), Sep 14, 2026 · NPR (Huo Jingnan), Dec 11, 2025.');
  s.addNotes([
    'Trump, Truth Social, Sep 14, 2026, 9:58 AM (exact text, from the Trump’s Truth archive; truthsocial.com itself blocked automated capture): “The only control or ‘guardrails’ that AI needs is a STRONG AND SMART (High IQ!) PRESIDENT, and the U.S.A. has that, in spades! … like Dario (Anthropic!), who is now pretending to be a ‘perfect little angel’ … We already have tremendous CRIMINAL and REGULATORY power over these companies! … WHOEVER WINS AI, WINS! We are leading China, and all others …” The yellow highlights are mine; the archive header (broken avatar image) is cropped off.',
    'CNN (Kevin Liptak, Sep 14, 2026): Trump spent Monday angrily rejecting calls from AI industry leaders for more regulation, in a daylong string of posts, putting outpacing China above public concerns. To Jensen Huang by phone: “The robots will not be taking over. The AI will not be taking over the rest of the world. The whole thing is a hoax.” CBS and NBC ran similar headlines (“Trump says AI doesn’t need guardrails, calls growing concerns ‘a hoax’”).',
    'State-law preemption: “Ensuring a National Policy Framework for Artificial Intelligence”, signed Dec 11, 2025 — creates a DOJ “AI Litigation Task Force” to challenge state AI laws. NPR: “It may not be legal.”',
    'URLs: https://truthsocial.com/@realDonaldTrump/117269745153543631 · https://www.trumpstruth.org/statuses/41712 · https://www.cnn.com/2026/09/14/politics/trump-vance-ai-alarms · https://www.npr.org/2025/12/11/nx-s1-5638562/trump-ai-david-sacks-executive-order',
  ].join('\n\n'));
}

// ---------------------------------------------------------------- 5. Race with China
async function raceSlide(d) {
  const s = d.slide('Content', { transition: 'pushLeft' });
  heading(s, 'THE WORLD · GEOPOLITICAL RIVALRY · 2', 'Racing China — while selling it chips');

  const pbs = await d.frame(s, D('pbs-xi.png'), { x: MX, y: 1.76, w: 3.45, h: 4.78 }, { rot: -1.2 });
  const rx = 4.45;
  const toms = await d.frame(s, D('toms-deepseek.png'), { x: rx, y: 1.85, w: 4.0, h: 1.75 }, { rot: -1.2 });
  const reg = await d.frame(s, D('register-h200.png'), { x: 8.6, y: 1.8, w: 4.13, h: 0.95 }, { rot: 1.2 });
  const dig = await d.frame(s, D('digitimes-huawei.png'), { x: 8.68, y: 2.92, w: 4.05, h: 1.15 }, { rot: -0.8 });

  const cw3 = (W - MX - rx - 0.5) / 3;
  const s1 = d.stat(s, { x: rx, y: 4.3, w: cw3, value: '$589B', valueSize: 44, color: d.S.red, label: 'wiped off Nvidia in one day by DeepSeek’s R1 (Jan 27, 2025)' });
  const s2 = d.stat(s, { x: rx + cw3 + 0.25, y: 4.3, w: cw3, value: '25%', valueSize: 44, color: d.S.amber, label: 'U.S. government cut on Nvidia H200 sales to China, allowed Dec 2025' });
  const q = d.text(s, [
    { text: '“We’re leading by at least a year, maybe a year and a half.”', options: { fontFace: 'Cambria', italic: true, fontSize: 18, color: d.S.txt, breakLine: true } },
    { text: 'Trump at the Xi summit, Sep 2026', options: { fontSize: 12, color: d.S.muted } },
  ], { x: rx + 2 * (cw3 + 0.25), y: 4.4, w: cw3, h: 1.6, valign: 'top' });
  const div = d.name('div');
  s.addShape(d.pres.shapes.LINE, { x: rx, y: 4.28, w: W - MX - rx, h: 0, line: { color: HEX.line, width: 1 }, objectName: div });

  d.animate(s, pbs, { auto: true, effect: 'rise', dur: 600 });
  d.animate(s, toms, { auto: true, effect: 'rise', delay: 100, dur: 450 });
  d.animate(s, reg, { auto: true, effect: 'rise', delay: 100, dur: 450 });
  d.animate(s, dig, { auto: true, effect: 'rise', delay: 100, dur: 450 });
  d.animate(s, [div, ...s1], { effect: 'zoom', dur: 400 });
  d.animate(s, s2, { effect: 'zoom', dur: 400 });
  d.animate(s, [q], { effect: 'fade' });
  d.source(s, 'Sources: PBS News/AP, Sep 26, 2026 · Tom’s Hardware, Jan 28, 2025 · The Register, Dec 9, 2025 · DigiTimes, Oct 1, 2026.');
  s.addNotes([
    'The race framing drives everything: “WHOEVER WINS AI, WINS!” — and it cuts both ways.',
    'DeepSeek moment (Tom’s Hardware, Jan 28, 2025): DeepSeek’s R1 release wiped $589 billion off Nvidia’s market value in one day — the largest single-day loss in stock-market history; DeepSeek claimed similar performance at a fraction of the hardware cost.',
    'Export controls loosened (The Register, Dec 9, 2025): Trump said Nvidia may ship H200s to “approved customers in China” if Washington gets a 25 percent cut; Blackwell and Rubin remain off limits.',
    'China substitutes (DigiTimes, Oct 1, 2026): Huawei’s chairman says its Ascend chips are now ahead of Nvidia in China, with domestic supply driving AI-chip substitution — company claim.',
    'Summit (PBS/AP, Sep 26, 2026): after a three-day Trump–Xi summit in Washington, the two governments agreed to establish a channel for handling AI-related incidents and to accelerate military crisis communications. Trump: “We’re leading by at least a year, maybe a year and a half. Some people say two years. I’m not looking to open it up.” (The White House reportedly calls it the “U.S.–China Super Intelligence (SI) Dialogue” — not page-verified, don’t state as fact.)',
    'URLs: https://www.pbs.org/newshour/world/china-and-u-s-agree-to-establish-ai-safety-channel-and-continue-trade-and-military-talks · https://www.tomshardware.com/tech-industry/artificial-intelligence/nvidia-loses-usd589-billion-in-market-cap-broad-stock-plunge-triggered-by-deepseek-ai-release · https://www.theregister.com/on-prem/2025/12/09/trump-says-nvidia-can-sell-h200s-to-china/2020308 · https://www.digitimes.com/newsshow/article.asp?datePublish=2026/10/01&pages=pd&seq=232',
  ].join('\n\n'));
}

// ---------------------------------------------------------------- 6. Yemen weapons cell
async function yemenSlide(d) {
  const s = d.slide('Content', { transition: 'fade' });
  heading(s, 'THE WORLD · USE BY BAD ACTORS · 1', 'A weapons cell used Claude as its engineers');

  const lx = MX, lw = 5.75;
  const lab = label(d, s, 'GTG-87001 · NORTHERN YEMEN · ANTHROPIC, SEPT 2026', { x: lx, y: 1.78, w: lw });
  const intro = d.text(s, 'A cell ran three weapons programs and used Claude Code to write the guidance software. How far each got:', { x: lx, y: 2.12, w: lw, h: 0.62, fontSize: 15, color: d.S.txt, valign: 'top' });

  // stage diagram (adapted from the report's Figure 1)
  const gx = lx + 2.45, gw = lw - 2.45, gy = 2.95;
  const stages = ['Design', 'Simulation', 'Flight test'];
  const diag = [];
  stages.forEach((t, i) => {
    const sx = gx + (i + 1) * gw / 3;
    diag.push(d.text(s, t, { x: sx - 1.0, y: gy, w: 1.0, h: 0.26, fontSize: 10, bold: true, color: d.S.steel, align: 'right', charSpacing: 1 }));
    const tk = d.name('tick');
    s.addShape(d.pres.shapes.LINE, { x: sx, y: gy + 0.3, w: 0, h: 1.95, line: { color: HEX.line, width: 0.75, dashType: 'dash' }, objectName: tk });
    diag.push(tk);
  });
  const rows = [
    ['Guided rocket', 'phone-class flight computer, homing', 3, HEX.red, 'TEST-FIRED · FAILED'],
    ['Ballistic missile', 'multi-stage, range goal >2,000 km', 2, HEX.amber, ''],
    ['“R2000” missile family', 'incl. a hypersonic glide vehicle', 1, HEX.steel, ''],
  ];
  const bars = [];
  rows.forEach(([t, sub, n, col, tag], i) => {
    const y = gy + 0.42 + i * 0.62;
    const lt = d.text(s, [
      { text: t, options: { bold: true, fontSize: 14, color: d.S.txt, breakLine: true } },
      { text: sub, options: { fontSize: 11, color: d.S.muted } },
    ], { x: lx, y: y - 0.06, w: 2.4, h: 0.56, valign: 'middle' });
    const track = d.name('track');
    s.addShape(d.pres.shapes.RECTANGLE, { x: gx, y: y + 0.08, w: gw, h: 0.3, fill: { color: HEX.card2 }, line: { color: HEX.card2, width: 0 }, objectName: track });
    const bar = d.name('bar');
    s.addShape(d.pres.shapes.RECTANGLE, { x: gx, y: y + 0.08, w: gw * n / 3, h: 0.3, fill: { color: col }, line: { color: col, width: 0 }, objectName: bar });
    const g = [bar];
    if (tag) g.push(d.text(s, tag, { x: gx + 0.1, y: y + 0.08, w: gw - 0.2, h: 0.3, fontSize: 10, bold: true, color: 'FFFFFF', align: 'right', valign: 'middle', charSpacing: 1 }));
    diag.push(lt, track);
    bars.push(g);
  });
  const figNote = d.text(s, 'Adapted from the report’s Figure 1 (p. 114)', { x: gx, y: gy + 2.3, w: gw, h: 0.26, fontSize: 10, italic: true, color: d.S.steel, align: 'right' });

  const medLab = label(d, s, 'MEDIA NAMED THE HOUTHIS — THE REPORT DOES NOT', { x: lx, y: 5.5, w: lw }, d.S.amber);
  const mee = await d.frame(s, D('mee-head.png'), { x: lx, y: 5.82, w: 2.95, h: 0.75 }, { rot: -1 });
  const meeT = d.text(s, 'Anthropic says only “northern Yemen.” It is not an ICBM, and no chat logs were published.', { x: lx + 3.1, y: 5.82, w: lw - 3.1, h: 0.72, fontSize: 11, color: d.S.muted, valign: 'middle' });

  const rx = 6.85, rw = W - MX - rx;
  const exc = await d.frame(s, D('yemen-detail-hl.png'), { x: rx, y: 1.8, w: rw, h: 4.2 }, { rot: 0 });
  const excCap = d.text(s, 'Anthropic threat report, p. 113 (highlights added)', { x: rx, y: exc.geom.y + exc.geom.h + 0.14, w: rw, h: 0.26, fontSize: 10, italic: true, color: d.S.steel, align: 'right' });

  d.animate(s, [lab, intro], { auto: true, effect: 'fade' });
  d.animate(s, diag, { auto: true, effect: 'fade', delay: 100 });
  d.animate(s, bars[2], { auto: true, effect: 'wipeLeft', dur: 500 });
  d.animate(s, bars[1], { auto: true, effect: 'wipeLeft', dur: 600 });
  d.animate(s, [...bars[0], figNote], { auto: true, effect: 'wipeLeft', dur: 800 });
  d.animate(s, [...exc, excCap], { effect: 'rise', dur: 600 });
  d.animate(s, [medLab, ...mee, meeT], { effect: 'fade' });
  d.source(s, 'Source: Anthropic, “Detecting and countering misuse of AI: September 2026,” case GTG-87001, pp. 112–114 · Middle East Eye (citing the FT), Sep 11, 2026.');
  s.addNotes([
    'Anthropic Threat Intelligence report, Sept 10, 2026, case GTG-87001: “We identified a cell of threat actors based in northern Yemen running three weapons development programs: a guided rocket that used a commodity phone-class flight computer with final-phase homing guidance; a multi-stage ballistic missile with a stated range goal above 2,000 km; and a multi-variant missile (referred to as the ‘R2000’ set) that included a hypersonic glide vehicle variant.”',
    '“The actors used Claude Code in place of human software engineers to develop the guidance, navigation, and control (GNC) software …” They ran several Claude instances as a mini engineering team (one coding, one researching, one reviewing). “Our safeguards blocked many of their requests, but not all of them.” They hid their goals and split work across sessions so no single session revealed full intent. “We do not have evidence the actors succeeded in fielding an operational device; but they did test-fire a guided rocket. This field test appears to have failed: within hours, the actors returned to Claude to work out why it failed.” They also built an offline simulation toolkit that no longer needs Claude.',
    'The bars are adapted from the report’s Figure 1 (systems-engineering V): the rocket reached flight test; the ballistic-missile work reached simulation (the report’s table: medium- and intermediate-range and hypersonic-glide variants); the multi-variant family reached design. Anthropic notes its visibility into the overall program was limited.',
    'ACCURACY: Not an ICBM (stated range goal >2,000 km = medium/intermediate range). Anthropic says “northern Yemen” and does not name the Houthis; the FT and Middle East Eye do (the area is largely Houthi-controlled). There are no published chat logs — only the report’s narrative and diagram.',
    'URLs: https://www-cdn.anthropic.com/e50be2e51e7695dc4b1366a37a245a597377d3b5/Anthropic-Detecting-and-countering-091026.pdf · https://www.anthropic.com/threat-intelligence-report-september-2026 · https://www.middleeasteye.net/live-blog/live-blog-update/houthis-used-anthropic-ai-develop-ballistic-missile-software-says-report',
  ].join('\n\n'));
}

// ---------------------------------------------------------------- 7. Virology + other misuse
async function bioSlide(d) {
  const s = d.slide('Content', { transition: 'pushLeft' });
  heading(s, 'THE WORLD · USE BY BAD ACTORS · 2', 'OpenAI’s o3 beat 94% of expert virologists');

  const lx = MX, lw = 6.1;
  const sv = d.text(s, '94%', { x: lx, y: 1.72, w: 2.1, h: 1.0, fontSize: 60, bold: true, color: d.S.red, fontFace: 'Arial', valign: 'middle' });
  const sl = d.text(s, [
    { text: 'of expert virologists outscored by o3 ', options: { color: d.S.txt, bold: true } },
    { text: 'on lab-troubleshooting questions from their own specialties', options: { color: d.S.muted } },
  ], { x: lx + 2.2, y: 1.8, w: lw - 2.2, h: 0.85, fontSize: 15, valign: 'middle' });

  const vct = [
    ['o3', 43.8], ['Gemini 2.5 Pro', 37.6], ['o4-mini', 37.0], ['o1', 35.4], ['Claude 3.7 Sonnet', 30.8],
    ['GPT-4.5 Preview', 28.3], ['Expert virologists', 22.1], ['GPT-4o', 18.8],
  ];
  const colors = vct.map(([n]) => (n === 'o3' ? HEX.red : n.startsWith('Expert') ? HEX.amber : '5A6475'));
  const chart = d.chart(s, 'bar', [{ name: 'VCT accuracy (%)', labels: vct.map(v => v[0]), values: vct.map(v => v[1]) }],
    { x: lx - 0.05, y: 2.85, w: lw, h: 3.65 }, {
      barDir: 'bar', chartColors: colors, catAxisOrientation: 'maxMin', valAxisHidden: true, valGridLine: { style: 'none' },
      valAxisMinVal: 0, valAxisMaxVal: 50, showValue: true, dataLabelFormatCode: '0.0"%"', dataLabelPosition: 'outEnd',
      catAxisLabelFontSize: 12, dataLabelFontSize: 12, barGapWidthPct: 45, showLegend: false,
      showTitle: true, title: 'Virology Capabilities Test — accuracy', titleFontSize: 12, titleColor: HEX.muted,
    });

  // right: other cases
  const rx = 7.2, rw = W - MX - rx;
  const lab = label(d, s, 'MEANWHILE, IN ANTHROPIC’S THREAT REPORTS', { x: rx, y: 1.78, w: rw });
  const cases = [
    ['FaBiohazard', 'Bioweapons research', 'SEP 2026', 'State-linked researchers used Claude on gain-of-function virology and toxin design via relays that dodged blocks'],
    ['GiDeliveryDrone', 'Autonomous kamikaze swarm', 'SEP 2026', 'A Russia-based team built FPV drones that pick targets, incl. a “person” class, with no human in the loop'],
    ['FaMoneyBillWave', '“Vibe-hacking” extortion', 'AUG 2025', 'One actor used Claude Code to extort at least 17 organizations; ransoms sometimes over $500,000'],
    ['FaUserSecret', 'North Korean IT workers', 'AUG 2025', 'Operatives who can’t code used Claude to land and keep remote jobs at Fortune 500 tech firms'],
  ];
  const ch = 1.0, gap = 0.12;
  const groups = [];
  for (let i = 0; i < cases.length; i++) {
    const [ic, t, dt, body] = cases[i];
    const y = 2.18 + i * (ch + gap);
    const g = [d.card(s, { x: rx, y, w: rw, h: ch })];
    const c = d.name('ic');
    s.addShape(d.pres.shapes.OVAL, { x: rx + 0.18, y: y + 0.24, w: 0.52, h: 0.52, fill: { color: '2A0C0E' }, line: { color: HEX.red, width: 1 }, objectName: c });
    const im = d.name('icimg');
    s.addImage({ data: await icon(ic, '#E5383B'), x: rx + 0.31, y: y + 0.37, w: 0.26, h: 0.26, objectName: im });
    g.push(c, im);
    g.push(d.text(s, [
      { text: t, options: { bold: true, fontSize: 14, color: d.S.txt } },
      { text: `   ${dt}`, options: { fontSize: 10, bold: true, color: d.S.steel, charSpacing: 1, breakLine: true } },
      { text: body, options: { fontSize: 13, color: d.S.muted } },
    ], { x: rx + 0.88, y: y + 0.07, w: rw - 1.02, h: ch - 0.14, valign: 'middle' }));
    groups.push(g);
  }

  d.animate(s, [chart], { auto: true, effect: 'wipeLeft', dur: 900 });
  d.animate(s, [sv, sl], { effect: 'zoom', dur: 450 });
  d.animate(s, [lab, ...groups[0]], { effect: 'rise' });
  groups.slice(1).forEach(g => d.animate(s, g, { auto: true, effect: 'rise', delay: 150 }));
  d.source(s, 'Sources: SecureBio / Center for AI Safety, Virology Capabilities Test (Götting et al., arXiv:2504.16137), Apr 2025 · Anthropic threat reports, Aug 27, 2025 & Sep 10, 2026 (GTG-27005).');
  s.addNotes([
    'Virology Capabilities Test (SecureBio + Center for AI Safety, Apr 2025): troubleshooting complex virology lab protocols. Expert virologists with internet access averaged 22.1% on questions in their own sub-areas; OpenAI’s o3 reached 43.8% and outperformed 94% of expert virologists on question subsets tailored to their specialties. Other models: Gemini 2.5 Pro 37.6%, o4-mini 37.0%, o1 35.4%, Claude 3.7 Sonnet 30.8%, GPT-4.5 Preview 28.3%, GPT-4o 18.8%. The expert bar is an average, not a percentile. (TIME had the exclusive.)',
    'Why it matters: tacit lab know-how used to be the bottleneck for would-be bioweapons makers.',
    'Anthropic, Sept 2026 report (biological misuse): state-linked researchers used Claude on dual-use biology — gain-of-function virology, avian-flu mammalian adaptation, venom/toxin design — via reseller relays that evaded regional blocks and rerouted refused prompts to more permissive models.',
    'Anthropic, Sept 2026 (GTG-27005): a Russia-based freelance team used Claude Code to build an autonomous FPV kamikaze drone swarm whose onboard model could select targets (including a “person” target class) and issue detonation commands without a human in the loop.',
    'Anthropic, Aug 2025: “vibe hacking” — an actor used Claude Code for a large-scale data-extortion operation against at least 17 organizations (healthcare, emergency services, government, religious institutions), ransoms sometimes exceeding $500,000. North Korea: operatives used Claude to get and keep remote jobs at US Fortune 500 tech companies — “Operators who cannot otherwise write basic code or communicate professionally in English are now able to pass technical interviews.”',
    'Also (covered earlier in the deck): GTG-1002, Nov 2025 — a Chinese state-sponsored group used Claude Code to run 80–90% of a cyber-espionage campaign against ~30 targets.',
    'All misuse cases are Anthropic’s own reporting about its own platform.',
    'URLs: https://securebio.org/virologytest/ · https://arxiv.org/abs/2504.16137 · https://www.anthropic.com/threat-intelligence-report-september-2026 · https://www.anthropic.com/news/detecting-countering-misuse-aug-2025 · https://www.anthropic.com/news/disrupting-AI-espionage',
  ].join('\n\n'));
}

async function build(d) {
  await shipSlide(d);
  await memoSlide(d);
  await warRoomSlide(d);
  await guardrailsSlide(d);
  await raceSlide(d);
  await yemenSlide(d);
  await bioSlide(d);
}

module.exports = { build };
