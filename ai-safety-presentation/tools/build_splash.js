// Assemble the Cornell Splash deck: M1237 "AI Alignment and Safety" (William Liaw · Sat Nov 21, 2026 · 110 min).
//   node tools/build_splash.js build/splash/AI_Alignment_and_Safety_Splash.pptx      (./build_splash.sh does the rest)
//
// Order (110 minutes): Opening + Part 1 (tools/slides_splash_ml.js, 40 min) · Part 2 How fast (20) · Part 3 Why it could
// go wrong (30) · Part 4 What we can do (12) · Q&A (8). Parts 2–4, the dividers and Q&A come from tools/slides_splash_extra.js,
// which re-uses adult-deck slide functions (each adult module exports `slides`) with Splash kickers, titles and notes.
// Also writes <out dir>/run_of_show.md (slide, class clock, minutes, beats) and prepends "SLIDE n · CLOCK" to every note.
const fs = require('fs');
const path = require('path');
const { Deck } = require('./lib');
const X = require('./slides_splash_extra');

const FOOTER = 'AI ALIGNMENT & SAFETY · CORNELL SPLASH M1237';
const FOOTER_PT = 12;
const ML = path.join(__dirname, 'slides_splash_ml.js');
const OPENING = ['titleSlide', 'hookSlide', 'roadmapSlide'];

function brand(d) {
  d.pres.title = 'AI Alignment and Safety';
  d.pres.subject = 'Cornell Splash Fall 2026 · M1237 · grades 7–12';
  d.pres.company = 'Cornell Splash';
  // Footer and slide number at 12 pt (the adult layouts use 9 pt), so they read from the back of a big room. The footer
  // box is widened from 5 in to 8 in so the 12 pt caps (charSpacing 3) stay on one line. lib.js is left unchanged.
  for (const l of d.pres._slideLayouts) {
    for (const o of l._slideObjects) {
      if (o._type === 'text' && Array.isArray(o.text) && o.text[0] && o.text[0].text === 'AI SAFETY & EXISTENTIAL RISK') {
        o.text[0].text = FOOTER;
        o.options = { ...o.options, fontSize: FOOTER_PT, w: 8 };
        if (o.text[0].options) o.text[0].options = { ...o.text[0].options, fontSize: FOOTER_PT };
      }
    }
    if (l._slideNumberProps) l._slideNumberProps = { ...l._slideNumberProps, fontSize: FOOTER_PT };
  }
}

const notesOf = (s) => s._slideObjects.find((o) => o._type === 'notes');
const titleOf = (s) => {
  const t = s._slideObjects.find((o) => o._type === 'text' && o.options && o.options.placeholder === 'title');
  return t ? t.text.map((r) => r.text || '').join('') : '';
};
const kickerOf = (s) => {
  const t = s._slideObjects.find((o) => o._type === 'text' && o.options && o.options.placeholder === 'kicker');
  return t ? t.text.map((r) => r.text || '').join('') : '';
};

// Opening + Part 1 from the Part 1 module. Its `slides` object is the one its build() iterates, so wrapping the first
// Part 1 function lets us start the "Part 1" section (and add the standard divider) exactly between the roadmap and Part 1.
async function openingAndPart1(d) {
  if (!fs.existsSync(ML)) {
    console.warn('(tools/slides_splash_ml.js not found: Part 1 skipped; using the Splash module’s own opening)');
    d.sectionStart('Opening');
    await X.part(d, 0);
    d.sectionStart('Part 1 · How AI learns');
    X.slides.partDivider(d, { ...X.DIVIDERS[1], min: 0.25 });
    return;
  }
  const ml = require(ML);
  const keys = ml.slides ? Object.keys(ml.slides) : [];
  const hasOpening = OPENING.every((k) => keys.includes(k));
  d.sectionStart('Opening');
  if (!hasOpening) await X.part(d, 0);
  const firstP1 = keys.find((k) => !OPENING.includes(k));
  const fn = firstP1 ? ml.slides[firstP1] : null;
  if (firstP1) {
    ml.slides[firstP1] = async (dd, ...a) => {
      dd.sectionStart('Part 1 · How AI learns');
      // 0 minutes: the roadmap has just introduced Part 1, so this is a one-line, few-second transition. (The LLM and
      // frontier-model definitions it used to carry are said where the words first come up, on slides 11 and 16.)
      X.slides.partDivider(dd, { ...X.DIVIDERS[1], min: 0, say: 'Let’s start. Part 1, 36 minutes: how today’s AI actually learns. (A few seconds, with no minutes of its own in the plan: click straight on. The terms LLM and frontier model are defined where they first come up, on slides 11 and 16.)' });
      return fn(dd, ...a);
    };
  } else {
    d.sectionStart('Part 1 · How AI learns');
  }
  const first = d.n + 1;
  try {
    await ml.build(d);
  } finally {
    if (firstP1) ml.slides[firstP1] = fn;
  }
  console.log(`  opening + part 1: slides ${first}-${d.n}`);
}

function fmt(min) { const t = Math.round(min * 60); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; }

// One notes format for the whole deck: the Part 1 module's section labels are renamed to the ones slides_splash_extra.js
// uses, and its "(class minute a–b)" aside is dropped because the SLIDE · CLASS CLOCK line above gives the same clock.
const LABELS = [[/^SAY:/gm, 'SAY (plain words):'], [/^ASK THE CLASS:/gm, 'ASK THE ROOM:'], [/^TERMS DEFINED HERE:/gm, 'TERMS TO DEFINE:'], [/^HONEST CAVEATS:/gm, 'BE HONEST ABOUT:']];
function unifyNotes(t) {
  let u = t.replace(/^(TIME: [\d.]+ min)\s+\(class minute [^)]*\)/m, '$1');
  for (const [re, to] of LABELS) u = u.replace(re, to);
  return u;
}
// What the CLICKS line promises, as a number of clicks (null when it cannot tell, e.g. "each click adds …").
function promisedClicks(line) {
  if (/\bno clicks\b/i.test(line)) return 0;
  if (/\beach click\b|\blast click\b/i.test(line)) return null;
  const nums = [...line.matchAll(/\bClicks? (\d+)(?:\s*[–-]\s*(\d+))?/g)].map((m) => +(m[2] || m[1]));
  if (nums.length) return Math.max(...nums);
  return /\b(one click|click:)/i.test(line) ? 1 : null;
}

function runOfShow(d, out) {
  const meta = new Map(((d.splash && d.splash.meta) || []).map((m) => [m.num, m]));
  const rows = [];
  let clock = 0;
  const warn = [];
  d.pres._slides.forEach((s, i) => {
    const num = i + 1;
    const m = meta.get(num) || {};
    const n = notesOf(s);
    if (n) n.text[0].text = unifyNotes(n.text[0].text);
    let noteText = n ? n.text.map((r) => r.text).join('') : '';
    let min = m.min;
    if (min === undefined) { const mm = /TIME:\s*([\d.]+)/.exec(noteText); min = mm ? parseFloat(mm[1]) : null; }
    // every note says what each click does; check it against the slide's click-triggered build steps
    const clicks = ((d.anim[num] && d.anim[num].groups) || []).filter((g) => !g.auto).length;
    const cl = /^CLICKS:(.*)$/m.exec(noteText);
    if (!cl && n) {
      if (clicks === 0) { n.text[0].text = n.text[0].text.replace(/^(TIME:[^\n]*)/m, '$1\n\nCLICKS: No clicks: everything appears on its own.'); noteText = n.text[0].text; }
      else warn.push(`slide ${num}: ${clicks} click(s) but no CLICKS line in the notes`);
    } else if (cl) {
      const want = promisedClicks(cl[1]);
      if (want !== null && want !== clicks) warn.push(`slide ${num}: CLICKS line describes ${want} click(s), the slide has ${clicks}`);
    }
    // beats on slides from other modules: a beat chip on the slide (HANDS UP, TURN TO A NEIGHBOR, …), plus the question
    // when the notes' ASK line opens with it in quotes
    const chip = s._slideObjects.find((o) => o._type === 'text' && Array.isArray(o.text) && /^(HANDS UP|TURN TO|THINK|GUESS|VOTE|QUIZ|PAIR|STAND|SHOW)/.test((o.text[0] && o.text[0].text) || ''));
    const askQ = (/^ASK THE ROOM:\s*(?:On the slide[^:“\n]*:\s*)?(“[^”]+”)/m.exec(noteText) || [])[1];
    const beat = m.beat || (chip ? chip.text.map((r) => r.text).join('') + (askQ ? `: ${askQ}` : '') : '');
    const title = m.title || titleOf(s) || '(no title placeholder)';
    const start = clock, end = clock + (min || 0);
    clock = end;
    const line = `SLIDE ${num} · CLASS CLOCK ${fmt(start)}–${fmt(end)} (min:sec from the start)${min === null ? ' · minutes not set' : ''}`;
    if (n) n.text[0].text = `${line}\n\n${n.text[0].text}`;
    else { s.addNotes(line); warn.push(`slide ${num}: no speaker notes`); }
    if (title.length > 48) warn.push(`slide ${num}: title is ${title.length} chars (> 48): ${title}`);
    rows.push({ num, start, end, min, section: s._splashSection || '', kicker: kickerOf(s), title, beat, source: m.source || (meta.has(num) ? '' : 'slides_splash_ml.js') });
  });
  const md = [
    '# Run of show (generated by tools/build_splash.js)', '',
    `${rows.length} slides · ${clock.toFixed(2).replace(/\.?0+$/, '')} minutes planned`, '',
    '| # | clock | min | section | title | beat | source |', '|---|---|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.num} | ${fmt(r.start)}–${fmt(r.end)} | ${r.min ?? '?'} | ${r.section} | ${r.title.replace(/\|/g, '/')} | ${(r.beat || '').replace(/\|/g, '/')} | ${r.source} |`),
  ].join('\n');
  fs.writeFileSync(path.join(path.dirname(out), 'run_of_show.md'), md + '\n');
  return { rows, clock, warn };
}

// Font-size check for the slides this build made new (not reused adult slides): text below 12 pt.
function fontCheck(d) {
  const meta = ((d.splash && d.splash.meta) || []).filter((m) => (m.source || '').startsWith('new') || (m.source || '').startsWith('adapted'));
  const out = [];
  for (const m of meta) {
    const s = d.pres._slides[m.num - 1];
    for (const o of s._slideObjects) {
      if (o._type !== 'text') continue;
      const runs = Array.isArray(o.text) ? o.text : [];
      const sizes = [o.options && o.options.fontSize, ...runs.map((r) => r.options && r.options.fontSize)].filter((x) => typeof x === 'number');
      const small = sizes.filter((x) => x < 12);
      if (small.length) out.push(`slide ${m.num}: ${Math.min(...small)} pt text: “${runs.map((r) => r.text).join('').slice(0, 50)}”`);
    }
  }
  return out;
}

(async () => {
  const out = process.argv[2] || 'build/splash/AI_Alignment_and_Safety_Splash.pptx';
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const d = new Deck();
  brand(d);
  const realSlide = d.slide;
  d.slide = function (master, opts) { const s = realSlide.call(this, master, opts); s._splashSection = this.section; return s; };

  await openingAndPart1(d);

  d.sectionStart('Part 2 · How fast it is moving');
  let first = d.n + 1;
  await X.part(d, 2);
  console.log(`  part 2: slides ${first}-${d.n}`);

  d.sectionStart('Part 3 · Why it could go wrong');
  first = d.n + 1;
  await X.part(d, 3);
  console.log(`  part 3: slides ${first}-${d.n}`);

  d.sectionStart('Part 4 · What we can do');
  first = d.n + 1;
  await X.part(d, 4);
  console.log(`  part 4: slides ${first}-${d.n}`);

  d.sectionStart('Q&A');
  await X.part(d, 5);

  const { clock, warn } = runOfShow(d, out);
  const fonts = fontCheck(d);
  for (const w of [...warn, ...fonts]) console.warn('  ! ' + w);
  await d.write(out);
  console.log(`wrote ${out} (${d.n} slides, ${clock} minutes planned; run of show: ${path.join(path.dirname(out), 'run_of_show.md')})`);
})().catch((e) => { console.error(e); process.exit(1); });
