// Render one slide module in isolation for QA.
//   node tools/render_module.js <module>      (e.g. economy -> tools/slides_economy.js)
// Writes build/preview/<module>/<module>.pptx (+ .pdf, slide-N.jpg) and prints the JPG paths.
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { Deck } = require('./lib');
(async () => {
  const mod = process.argv[2];
  const out = path.join(__dirname, '..', 'build', 'preview', mod);
  fs.mkdirSync(out, { recursive: true });
  for (const f of fs.readdirSync(out)) fs.unlinkSync(path.join(out, f));
  const d = new Deck();
  d.sectionStart(mod);
  await require(`./slides_${mod}.js`).build(d);
  const file = path.join(out, `${mod}.pptx`);
  await d.write(file);
  execFileSync('python3', [path.join(__dirname, 'postprocess.py'), file], { stdio: 'inherit' });
  const SK = '/root/.claude/skills/synced/ceb39289-bb87-46dd-a0b0-6166f033cec2_ce7dbb7b-a240-4473-b2d0-1ddff77530c0/pptx/scripts/office';
  try { execFileSync('python3', [path.join(SK, 'validate.py'), file], { stdio: 'inherit' }); } catch (e) { console.error('VALIDATION FAILED'); }
  execFileSync('python3', [path.join(SK, 'soffice.py'), '--headless', '--convert-to', 'pdf', '--outdir', out, file], { stdio: 'ignore', timeout: 300000 });
  execFileSync('pdftoppm', ['-jpeg', '-r', '110', file.replace(/\.pptx$/, '.pdf'), path.join(out, 'slide')]);
  for (const f of fs.readdirSync(out).filter(f => f.endsWith('.jpg')).sort()) console.log(path.join(out, f));
})().catch(e => { console.error(e); process.exit(1); });
