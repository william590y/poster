// Dark-theme US choropleth of data-center moratorium status, built from
// assets/research/splash_nov/dc_moratoria_states.json (Albers USA, us-atlas + topojson-client + d3-geo).
// Usage: node tools/make_dc_map.js [out.png]   (default assets/slides/splash_extra/dc_moratoria_map.png)
//
// Writes:
//   dc_moratoria_map.png         the full map with its own legend and source line (3200 × 1800), for stand-alone use
//   dc_map_layer0.png … layer3   map only (no legend, transparent background, 2400 × 1330), cumulative, for the Splash
//                                slide's click build: 0 grey base · 1 + local-only (blue) · 2 + bills (amber, teal)
//                                · 3 + the statewide pauses (red). The slide draws its own legend and source line.
// Re-run this (and rebuild the deck) after editing the dataset; the "as of" date comes from the dataset's as_of field
// when it has one.
const path = require('path');
const fs = require('fs');
const sharp = require(path.join(__dirname, '..', 'node_modules', 'sharp'));
const ROOT = path.join(__dirname, '..');
const HEX = { bg: '0A0C10', card: '161A22', card2: '1D222C', text: 'F2F3F5', muted: '9AA3B2', red: 'E5383B', amber: 'F4A261', blue: '5B8DEF', teal: '2A9D8F', steel: '8B95A7', line: '2A303B' };
const FIPS = { '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE','11':'DC','12':'FL','13':'GA','15':'HI','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME','24':'MD','25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE','32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND','39':'OH','40':'OK','41':'OR','42':'PA','44':'RI','45':'SC','46':'SD','47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV','55':'WI','56':'WY' };
// Category colours. The slide (tools/slides_splash_extra.js, p2DcMap) uses the same values for its native legend.
const COLOR = { statewide_pause: HEX.red, local_and_state_bill: HEX.amber, local_only: '4A74C9', state_bill_only: HEX.teal, none_found: '2A313D' };
// The click build: which categories are coloured in each cumulative layer (the rest are drawn as "none found" grey).
const LAYERS = [[], ['local_only'], ['local_only', 'local_and_state_bill', 'state_bill_only'], ['local_only', 'local_and_state_bill', 'state_bill_only', 'statewide_pause']];
const OUT_DIR = path.join(ROOT, 'assets/slides/splash_extra');

(async () => {
  const { geoAlbersUsa, geoPath } = await import('d3-geo');
  const { feature, mesh } = await import('topojson-client');
  const topo = JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules/us-atlas/states-10m.json'), 'utf8'));
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/research/splash_nov/dc_moratoria_states.json'), 'utf8'));
  const asOf = data.as_of ? new Date(data.as_of + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : 'Nov 5, 2026';
  const by = Object.fromEntries(data.states.map((s) => [s.abbr, s]));
  const states = feature(topo, topo.objects.states);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const f2 = Object.fromEntries(states.features.map((f) => [FIPS[String(f.id).padStart(2, '0')], f]));
  const small = new Set(['DC', 'DE', 'RI', 'CT', 'NJ', 'MD', 'MA', 'NH', 'VT']);
  const order = ['VT', 'NH', 'MA', 'RI', 'CT', 'NJ', 'DE', 'MD', 'DC'];

  // The map itself (states, labels, east-coast leader labels) inside MAPBOX; `shown` = the categories drawn in colour.
  // big = the slide layers (shown smaller on screen, so larger labels)
  function mapSvg(MAPBOX, shown, big = false) {
    const proj = geoAlbersUsa().fitExtent([[MAPBOX.x, MAPBOX.y], [MAPBOX.x + MAPBOX.w, MAPBOX.y + MAPBOX.h]], states);
    const gp = geoPath(proj);
    const catOf = (ab) => { const s = by[ab]; const c = s ? s.category : 'none_found'; return shown.includes(c) ? c : 'none_found'; };
    let paths = '', labels = '', lead = '';
    for (const f of states.features) {
      const ab = FIPS[String(f.id).padStart(2, '0')];
      paths += `<path d="${gp(f)}" fill="#${COLOR[catOf(ab)]}" stroke="#${HEX.bg}" stroke-width="3" stroke-linejoin="round"/>`;
    }
    const borders = gp(mesh(topo, topo.objects.states, (a, b) => a !== b));
    // abbreviations on the larger states (bigger and white on the red ones)
    for (const f of states.features) {
      const ab = FIPS[String(f.id).padStart(2, '0')];
      if (!by[ab] || small.has(ab)) continue;
      const c = gp.centroid(f); if (!c || isNaN(c[0])) continue;
      const cat = catOf(ab);
      const red = cat === 'statewide_pause';
      const dx = { FL: 38, LA: -20, MI: 40, NY: 0, VA: 0, KY: 20, OH: 0, TX: 0 }[ab] || 0, dy = { MI: 55, NY: 8, VA: 10, FL: 20, KY: 6 }[ab] || 0;
      const dark = cat === 'none_found';
      labels += `<text x="${c[0] + dx}" y="${c[1] + dy + 10}" text-anchor="middle" font-size="${red ? (big ? 52 : 38) : (big ? 34 : 30)}" font-weight="${red ? 800 : 600}" fill="#${red ? 'FFFFFF' : (cat === 'local_and_state_bill' ? '1A1208' : dark ? HEX.muted : 'F2F3F5')}" opacity="${red ? 1 : 0.82}">${ab}</text>`;
    }
    // East-coast small states: leader lines + labels in the Atlantic
    order.forEach((ab, i) => {
      const c = gp.centroid(f2[ab]); const ly = proj([-70, 43.2])[1] + i * (big ? 50 : 46);
      const lx = proj([-68.8, 40])[0] + 20;
      lead += `<line x1="${c[0]}" y1="${c[1]}" x2="${lx - 12}" y2="${ly - 10}" stroke="#${HEX.muted}" stroke-width="2" opacity="0.6"/>`
        + `<circle cx="${c[0]}" cy="${c[1]}" r="5" fill="#${HEX.text}"/>`
        + `<rect x="${lx - 8}" y="${ly - (big ? 36 : 32)}" width="${big ? 28 : 22}" height="${big ? 28 : 22}" rx="4" fill="#${COLOR[catOf(ab)]}"/>`
        + `<text x="${lx + (big ? 30 : 24)}" y="${ly - 10}" font-size="${big ? 36 : 28}" font-weight="600" fill="#${HEX.text}" opacity="0.9">${ab}</text>`;
    });
    return `${paths}<path d="${borders}" fill="none" stroke="#${HEX.bg}" stroke-width="3"/>${labels}${lead}`;
  }

  const counts = {}; data.states.forEach((s) => { counts[s.category] = (counts[s.category] || 0) + 1; });

  // 1. the full map with its own legend (stand-alone use)
  {
    const W = 3200, H = 1800;
    const LX = 2540; let ly = 330, legend = '';
    legend += `<text x="${LX}" y="${ly - 60}" font-size="40" font-weight="700" fill="#${HEX.text}">Data-center moratoriums</text>`;
    legend += `<text x="${LX}" y="${ly - 18}" font-size="28" fill="#${HEX.muted}">by state, as of ${esc(asOf)}</text>`;
    ly += 50;
    for (const k of ['statewide_pause', 'local_and_state_bill', 'local_only', 'state_bill_only', 'none_found']) {
      const lines = { statewide_pause: ['Statewide pause in effect', 'governor order, limited scope'], local_and_state_bill: ['Local moratoriums +', 'statewide bill, plan or veto'], local_only: ['Local moratoriums only', 'no statewide pause'], state_bill_only: ['Statewide bill only', 'no local moratorium tracked'], none_found: ['None found', ''] }[k];
      legend += `<rect x="${LX}" y="${ly - 36}" width="64" height="64" rx="12" fill="#${COLOR[k]}" stroke="#${HEX.line}" stroke-width="2"/>`;
      legend += `<text x="${LX + 90}" y="${ly - 4}" font-size="34" font-weight="600" fill="#${HEX.text}">${esc(lines[0])}</text>`;
      legend += `<text x="${LX + 90}" y="${ly + 34}" font-size="28" fill="#${HEX.muted}">${esc(lines[1])}</text>`;
      legend += `<text x="${W - 70}" y="${ly + 8}" font-size="56" font-weight="800" text-anchor="end" fill="#${k === 'none_found' ? HEX.muted : COLOR[k] === '4A74C9' ? HEX.blue : COLOR[k]}">${counts[k] || 0}</text>`;
      ly += 150;
    }
    legend += `<text x="${LX}" y="${ly + 10}" font-size="26" fill="#${HEX.muted}">50 states + DC. Only New York, Texas</text>`;
    legend += `<text x="${LX}" y="${ly + 46}" font-size="26" fill="#${HEX.muted}">and Oregon have a statewide pause.</text>`;
    legend += `<text x="${LX}" y="${ly + 82}" font-size="26" fill="#${HEX.muted}">None passed by a legislature.</text>`;
    const src = 'Source: Electric Choice data-center moratorium tracker (updated Oct 15, 2026), statewide pauses checked against OPB, Texas Tribune / Route Fifty, SiliconANGLE (NY). Categories are our reading of the tracker.';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Inter, DejaVu Sans, sans-serif">
<rect width="${W}" height="${H}" fill="#${HEX.bg}"/>
${mapSvg({ x: 40, y: 150, w: 2110, h: 1450 }, LAYERS[3])}${legend}
<text x="70" y="${H - 50}" font-size="26" fill="#${HEX.muted}">${esc(src)}</text></svg>`;
    const out = process.argv[2] || path.join(OUT_DIR, 'dc_moratoria_map.png');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await sharp(Buffer.from(svg), { density: 72 }).png().toFile(out);
    console.log('wrote', out, counts);
  }

  // 2. the slide's click-build layers: map only, transparent, cumulative. The "as of" date sits in the empty ocean at
  // the bottom right, so every layer carries it.
  {
    const W = 2400, H = 1330;
    for (let i = 0; i < LAYERS.length; i++) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Inter, DejaVu Sans, sans-serif">
${mapSvg({ x: 20, y: 20, w: 2110, h: 1290 }, LAYERS[i], true)}
<text x="${W - 20}" y="${H - 24}" font-size="42" text-anchor="end" fill="#${HEX.muted}">data as of ${esc(asOf)}</text></svg>`;
      const out = path.join(OUT_DIR, `dc_map_layer${i}.png`);
      await sharp(Buffer.from(svg), { density: 72 }).png().toFile(out);
      console.log('wrote', out);
    }
  }
})();
