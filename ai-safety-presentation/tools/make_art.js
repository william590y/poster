// Procedural background art for the deck (rendered SVG -> PNG with sharp).
const sharp = require('sharp');
const path = require('path');
const OUT = path.join(__dirname, '..', 'assets', 'art');
const W = 3840, H = 2160;
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

function base(extra, glow = { x: 0.82, y: 0.85, r: 0.75, c: '#7A0F14', o: 0.55 }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="g" cx="${glow.x}" cy="${glow.y}" r="${glow.r}">
      <stop offset="0" stop-color="${glow.c}" stop-opacity="${glow.o}"/><stop offset="1" stop-color="#07080B" stop-opacity="0"/></radialGradient>
    <radialGradient id="v" cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.75"/></radialGradient>
    <linearGradient id="l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0E1118"/><stop offset="1" stop-color="#07080B"/></linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#l)"/>
  <rect width="100%" height="100%" fill="url(#g)"/>
  ${extra}
  <rect width="100%" height="100%" fill="url(#v)"/></svg>`;
}

function network(n, region, maxD, nodeColor, lineOp, hole) {
  const pts = [];
  // hole: optional ellipse {cx, cy, rx, ry} kept free of nodes (and of lines crossing it) so text stays clean
  const inHole = (x, y) => hole && ((x - hole.cx) / hole.rx) ** 2 + ((y - hole.cy) / hole.ry) ** 2 < 1;
  while (pts.length < n) {
    const x = region.x0 + rnd() * (region.x1 - region.x0), y = region.y0 + rnd() * (region.y1 - region.y0);
    if (!inHole(x, y)) pts.push([x, y]);
  }
  let s = '';
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
    const mx = (pts[i][0] + pts[j][0]) / 2, my = (pts[i][1] + pts[j][1]) / 2;
    if (d < maxD && !inHole(mx, my)) s += `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${pts[j][0]}" y2="${pts[j][1]}" stroke="#C7CCD6" stroke-opacity="${(lineOp * (1 - d / maxD)).toFixed(3)}" stroke-width="2"/>`;
  }
  for (const [x, y] of pts) {
    const hot = rnd() < 0.12, r = hot ? 7 + rnd() * 6 : 2.5 + rnd() * 4;
    if (hot) s += `<circle cx="${x}" cy="${y}" r="${r * 4}" fill="#E5383B" fill-opacity="0.12"/>`;
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${hot ? '#FF4D4F' : nodeColor}" fill-opacity="${hot ? 0.95 : 0.55}"/>`;
  }
  return s;
}

function grid(step, op) {
  let s = '';
  for (let x = 0; x <= W; x += step) s += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#FFFFFF" stroke-opacity="${op}" stroke-width="1.5"/>`;
  for (let y = 0; y <= H; y += step) s += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#FFFFFF" stroke-opacity="${op}" stroke-width="1.5"/>`;
  return s;
}

function expCurve() {
  // A glowing exponential curve rising off the right edge
  let d = '';
  for (let i = 0; i <= 200; i++) {
    const t = i / 200, x = 200 + t * 3700, y = 2000 - 1950 * (Math.exp(5.2 * t) - 1) / (Math.exp(5.2) - 1);
    d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
  }
  return `<path d="${d}" fill="none" stroke="#E5383B" stroke-opacity="0.18" stroke-width="40"/>
          <path d="${d}" fill="none" stroke="#E5383B" stroke-opacity="0.35" stroke-width="14"/>
          <path d="${d}" fill="none" stroke="#FF6B6B" stroke-opacity="0.9" stroke-width="4"/>`;
}

(async () => {
  const jobs = {
    'bg_title.png': base(grid(160, 0.025) + network(150, { x0: 1700, x1: 3900, y0: -100, y1: 2260 }, 420, '#AEB6C4', 0.22)),
    'bg_section.png': base(grid(120, 0.03) + network(60, { x0: 2400, x1: 3900, y0: 200, y1: 2100 }, 380, '#AEB6C4', 0.16), { x: 0.9, y: 0.5, r: 0.6, c: '#8C1117', o: 0.5 }),
    'bg_content.png': base('', { x: 1.0, y: 1.0, r: 0.9, c: '#3A0A0D', o: 0.35 }),
    'bg_exp.png': base(grid(160, 0.03) + expCurve(), { x: 0.95, y: 0.05, r: 0.7, c: '#8C1117', o: 0.45 }),
    'bg_closing.png': base(network(170, { x0: -100, x1: 3940, y0: -100, y1: 2260 }, 330, '#AEB6C4', 0.14, { cx: 1920, cy: 1080, rx: 1750, ry: 700 }), { x: 0.5, y: 0.5, r: 0.6, c: '#6E0D12', o: 0.32 }),
  };
  for (const [name, svg] of Object.entries(jobs)) {
    await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).resize(2560, 1440).toFile(path.join(OUT, name));
    console.log('wrote', name);
  }
})();
