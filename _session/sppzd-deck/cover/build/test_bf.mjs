// Cross-check the embed's interpreter (bf.js, or the run() inside a built embed via --embed) against ref_bf.py outputs.
import fs from 'fs';
const dir = new URL('.', import.meta.url).pathname;
const run = new Function(fs.readFileSync(dir + 'bf.js', 'utf8') + '\nreturn run;')();
const cases = JSON.parse(fs.readFileSync(dir + 'cases.json', 'utf8'));
let bad = 0, nonzero = 0;
for (const c of cases) {
  const p = c.p.startsWith('S') ? c.p.slice(1) : c.p;
  const om = i => c.w[i % c.w.length];
  const a = run(p, om, 96, 0).o;
  // the traced run must give the same bytes when it is not truncated
  const b = run(p, om, 96, 1e6);
  if (a.join() != c.o.join() || b.o.join() != c.o.join()) { bad++; if (bad < 5) console.log('MISMATCH', c.p, a.slice(0, 12), c.o.slice(0, 12)); }
  if (c.o.some(v => v)) nonzero++;
}
console.log(`${cases.length} programs, ${bad} mismatches, ${nonzero} with a nonzero byte`);
const show = (p, w) => run(p, i => w[i % w.length], 12, 0).o.join(',');
console.log('App. E   +++[>+.<-]F    ', show('+++[>+.<-]F', [0]));
console.log('Arith    S+[.++]        ', show('+[.++]', [77]));
console.log('Fib      S,[[.C>.C>]    ', show(',[[.C>.C>]', [1, 77]));
console.log('Geom     S+[.L>]        ', show('+[.L>]', [77]));
console.log('Quad     S,.[<C>>VX<RX++]', show(',.[<C>>VX<RX++]', [9, 77]));
console.log('Cubic    S+[[-.L>L>-]-] ', show('+[[-.L>L>-]-]', [77]));
for (const p of ['+[.++]', ',[[.C>.C>]', '+[.L>]', ',.[<C>>VX<RX++]', '+[[-.L>L>-]-]']) {
  const r = run(p, i => [9, 1][0], 96, 400);
  console.log(p.padEnd(16), 'events', r.ev.length, 'max loop depth', r.ev.at(-1).d, 'len', p.length);
}
process.exit(bad ? 1 : 0);
