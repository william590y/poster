// Assemble the full deck from the theory slides and the per-section slide modules.
//   node tools/build_deck.js build/AI_Safety_and_Existential_Risk.pptx
const fs = require('fs');
const path = require('path');
const { Deck } = require('./lib');
const T = require('./theory_slides');

async function mod(d, name) {
  const f = path.join(__dirname, `slides_${name}.js`);
  if (!fs.existsSync(f)) { console.warn(`(module ${name} missing — skipped)`); return; }
  const first = d.n + 1;
  await require(f).build(d);
  console.log(`  ${name}: slides ${first}-${d.n}`);
}

(async () => {
  const out = process.argv[2] || 'build/AI_Safety_and_Existential_Risk.pptx';
  const d = new Deck();

  d.sectionStart('Opening');
  T.titleSlide(d);
  T.agendaSlide(d);

  d.sectionStart('I · The Acceleration');
  T.sectionSlide(d, { num: 'I', title: 'The Acceleration', body: 'Money, compute, and capabilities — all on exponentials at once.' });
  await mod(d, 'economy');
  await mod(d, 'capabilities');
  await mod(d, 'work');

  d.sectionStart('II · Inside the Machine');
  T.sectionSlide(d, { num: 'II', title: 'Inside the Machine', body: 'Models are starting to think in ways we cannot read — and to improve themselves.' });
  await mod(d, 'frontier');

  d.sectionStart('III · The Alignment Problem');
  T.sectionSlide(d, { num: 'III', title: 'The Alignment Problem', body: 'Why a smarter system is not a safer one — and what happens when control slips.' });
  await mod(d, 'xrisk');
  await mod(d, 'security');

  d.sectionStart('IV · The World');
  T.sectionSlide(d, { num: 'IV', title: 'The World', body: 'War, rivalry, misuse — and the minds we may be creating.' });
  await mod(d, 'geopolitics');
  await mod(d, 'openweights');

  d.sectionStart('V · Coda');
  T.sectionSlide(d, { num: 'V', title: 'Coda', body: 'What now?' });
  await T.whatNowSlide(d);
  T.closingSlide(d, { agents: process.env.AGENT_COUNT || 'more than 80' });

  fs.mkdirSync(path.dirname(out), { recursive: true });
  await d.write(out);
  console.log(`wrote ${out} (${d.n} slides)`);
})().catch(e => { console.error(e); process.exit(1); });
