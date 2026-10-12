// Machine U (App. E + Table 4). p: tokens after the 'S' prefix (may contain 'F'); om(i): i-th byte of the random tape;
// T: bytes to emit; tr: max trace events (0 = no trace). Returns {o: T bytes, ev: token-level snapshots, n: tokens before F}.
const MAC = {Z: '[-]', R: '[->+<]', L: '[->+++<]', N: '[-<->]', C: '[->+>+<<]', G: '[>]', H: '[<]', W: '[[-]>+<]', V: '[.>]', X: '[-]' + '+'.repeat(16)};
function run(p, om, T, tr) {
  let c = '', s = [], f = [], m = [], k = [], q, i, j;
  for (i = 0; i < p.length && p[i] != 'F'; i++) {
    q = MAC[p[i]] || p[i];
    for (j = 0; j < q.length; j++) { c += q[j]; s.push(i); f.push(j ? 0 : q.length > 1 ? 2 : 1); }
  }
  const nt = i;
  for (i = 0; i < c.length; i++) if (c[i] == '[') k.push(i); else if (c[i] == ']' && k.length) { j = k.pop(); m[i] = j; m[j] = i; }
  let t = new Uint8Array(256), P = 0, pc = 0, o = [], n = 0, st = 0, d = 0, D = 0, ev = [];
  const snap = () => ev.push({k: pc < c.length ? s[pc] + 1 : nt + 1, t: t.slice(), p: P, o: o.length, n, d: D});
  while (pc < c.length && o.length < T && st++ < 3e4) {
    const h = c[pc], g = m[pc] != null;
    if (tr && f[pc]) { snap(); if (ev.length > tr) break; }
    if (h == '+') t[P]++;
    else if (h == '-') t[P]--;
    else if (h == '>') P = P + 1 & 255;
    else if (h == '<') P = P - 1 & 255;
    else if (h == '.') o.push(t[P]);
    else if (h == ',') t[P] = om(n++);
    else if (h == '[') { if (g) { if (!t[P]) pc = m[pc]; else if (f[pc] == 1 && ++d > D) D = d; } }
    else if (h == ']') { if (g) { if (t[P]) pc = m[pc]; else if (f[pc] == 1) d--; } }
    pc++;
  }
  if (tr && ev.length <= tr) snap();
  while (o.length < T) o.push(0);
  return {o, ev, n: nt};
}
