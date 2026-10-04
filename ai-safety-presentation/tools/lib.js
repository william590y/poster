// Shared building blocks for the AI Safety deck (pptxgenjs).
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const pptxgen = require('pptxgenjs');

const ROOT = path.join(__dirname, '..');
const A = (...p) => path.join(ROOT, 'assets', ...p);

const THEME = {
  name: 'Existential',
  headFontFace: 'Arial',
  bodyFontFace: 'Calibri',
  colors: {
    dk1: '0A0C10', lt1: 'F2F3F5', dk2: '161A22', lt2: '9AA3B2',
    accent1: 'E5383B', accent2: 'F4A261', accent3: '5B8DEF', accent4: '2A9D8F', accent5: '8B95A7', accent6: 'FFD166',
    hlink: 'FF6B6B', folHlink: 'C9A0A0',
  },
};
// Hex copies for hex-only options (shadows, chart grid lines).
const HEX = { bg: '0A0C10', card: '161A22', card2: '1D222C', text: 'F2F3F5', muted: '9AA3B2', red: 'E5383B', amber: 'F4A261', blue: '5B8DEF', teal: '2A9D8F', steel: '8B95A7', paper: 'FAFAF7', ink: '15171C', line: '2A303B' };

const W = 13.333, H = 7.5;
const MX = 0.6; // side margin

function makePres() {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.author = 'William Liaw';
  pres.title = 'AI Safety and Existential Risk';
  pres.subject = 'AI safety, capabilities and existential risk';
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;
  const S = { txt: C.background1, muted: C.background2, bg: C.text1, card: C.text2, red: C.accent1, amber: C.accent2, blue: C.accent3, teal: C.accent4, steel: C.accent5, yellow: C.accent6 };

  const footer = [
    { text: { text: 'AI SAFETY & EXISTENTIAL RISK', options: { x: MX, y: 7.03, w: 5, h: 0.3, fontSize: 9, color: S.steel, charSpacing: 3, margin: 0 } } },
  ];
  const slideNum = { x: W - MX - 0.8, y: 7.03, w: 0.8, h: 0.3, fontSize: 9, color: S.steel, align: 'right', margin: 0 };

  pres.defineSlideMaster({
    title: 'Title', background: { path: A('art', 'bg_title.png') },
    objects: [
      { placeholder: { options: { name: 'title', type: 'title', x: MX, y: 2.35, w: 8.2, h: 1.9, fontSize: 54, bold: true, color: S.txt, valign: 'bottom', align: 'left', margin: 0, fontFace: THEME.headFontFace }, text: '' } },
      { placeholder: { options: { name: 'body', type: 'body', x: MX, y: 4.45, w: 8, h: 0.5, fontSize: 20, color: S.muted, margin: 0 }, text: '' } },
    ],
  });
  pres.defineSlideMaster({
    title: 'Section', background: { path: A('art', 'bg_section.png') },
    objects: [
      { placeholder: { options: { name: 'kicker', type: 'body', x: MX, y: 2.45, w: 8, h: 0.45, fontSize: 16, bold: true, color: S.red, charSpacing: 6, margin: 0 }, text: '' } },
      { placeholder: { options: { name: 'title', type: 'title', x: MX, y: 2.95, w: 9.5, h: 1.4, fontSize: 54, bold: true, color: S.txt, valign: 'top', align: 'left', margin: 0, fontFace: THEME.headFontFace }, text: '' } },
      { placeholder: { options: { name: 'body', type: 'body', x: MX, y: 4.45, w: 10.6, h: 1.0, fontSize: 18, color: S.muted, valign: 'top', margin: 0 }, text: '' } },
    ],
    slideNumber: slideNum,
  });
  pres.defineSlideMaster({
    title: 'Content', background: { path: A('art', 'bg_content.png') },
    objects: [
      ...footer,
      { placeholder: { options: { name: 'kicker', type: 'body', x: MX, y: 0.42, w: 9, h: 0.3, fontSize: 12, bold: true, color: S.red, charSpacing: 4, margin: 0 }, text: '' } },
      { placeholder: { options: { name: 'title', type: 'title', x: MX, y: 0.72, w: W - 2 * MX, h: 0.75, fontSize: 36, bold: true, color: S.txt, valign: 'middle', align: 'left', margin: 0, fontFace: THEME.headFontFace }, text: '' } },
    ],
    slideNumber: slideNum,
  });
  pres.defineSlideMaster({
    title: 'Blank', background: { path: A('art', 'bg_content.png') },
    objects: [...footer],
    slideNumber: slideNum,
  });
  pres.defineSlideMaster({
    title: 'Exp', background: { path: A('art', 'bg_exp.png') },
    objects: [
      { placeholder: { options: { name: 'kicker', type: 'body', x: MX, y: 0.42, w: 9, h: 0.3, fontSize: 12, bold: true, color: S.red, charSpacing: 4, margin: 0 }, text: '' } },
      { placeholder: { options: { name: 'title', type: 'title', x: MX, y: 0.72, w: W - 2 * MX, h: 0.75, fontSize: 36, bold: true, color: S.txt, valign: 'middle', align: 'left', margin: 0, fontFace: THEME.headFontFace }, text: '' } },
    ],
    slideNumber: slideNum,
  });
  pres.defineSlideMaster({
    title: 'Closing', background: { path: A('art', 'bg_closing.png') },
    objects: [],
  });
  return { pres, C, S };
}

// ---------- image helpers ----------
const sizeCache = {};
async function imgSize(file) {
  if (!sizeCache[file]) { const m = await sharp(file).metadata(); sizeCache[file] = { w: m.width, h: m.height }; }
  return sizeCache[file];
}
// Fit an image of natural size into a box, return {x,y,w,h} centered (contain).
function fit(nat, box, align = 'center') {
  const r = Math.min(box.w / nat.w, box.h / nat.h);
  const w = nat.w * r, h = nat.h * r;
  const x = align === 'left' ? box.x : align === 'right' ? box.x + box.w - w : box.x + (box.w - w) / 2;
  const y = box.y + (box.h - h) / 2;
  return { x, y, w, h };
}

// ---------- deck builder with animation registry ----------
class Deck {
  constructor() {
    const { pres, C, S } = makePres();
    this.pres = pres; this.C = C; this.S = S;
    this.n = 0; this.anim = {}; this.section = null; this.uid = 0;
  }
  sectionStart(title) { this.pres.addSection({ title }); this.section = title; }
  slide(masterName, opts = {}) {
    const s = this.pres.addSlide({ masterName, sectionTitle: this.section });
    this.n += 1;
    const num = this.n;
    this.anim[num] = { transition: opts.transition || 'fade', groups: [] };
    s._num = num;
    return s;
  }
  name(prefix) { this.uid += 1; return `${prefix}_${this.uid}`; }
  // Register an animation group on slide `s`. names: array of objectNames, or array of {name, effect, delay, dur}
  animate(s, names, { auto = false, effect = 'fade', stagger = 0, delay = 0, dur = 500, after = 0 } = {}) {
    const effects = names.map((n, i) => (typeof n === 'string'
      ? { name: n, effect, delay: delay + i * stagger, dur }
      : { effect, dur, delay: delay + i * stagger, ...n }));
    this.anim[s._num].groups.push({ auto, effects, after });
  }
  setTransition(s, t) { this.anim[s._num].transition = t; }

  // --- primitives ---
  text(s, text, o) { const name = o.objectName || this.name('txt'); s.addText(text, { isTextBox: true, margin: 0, ...o, objectName: name }); return name; }
  rect(s, o) {
    const name = o.objectName || this.name('shape');
    s.addShape(o.rounded ? this.pres.shapes.ROUNDED_RECTANGLE : this.pres.shapes.RECTANGLE, { ...o, objectName: name });
    return name;
  }

  // Screenshot / image inside a white "clipping" frame with shadow. Returns [frameName, imgName].
  async frame(s, file, box, { rot = 0, pad = 0.06, border = true, align = 'center', shadow = true, frameColor = 'FFFFFF', link } = {}) {
    const nat = await imgSize(file);
    const inner = { x: box.x + pad, y: box.y + pad, w: box.w - 2 * pad, h: box.h - 2 * pad };
    const g = fit(nat, inner, align);
    const names = [];
    if (border) {
      const fr = this.name('frame');
      s.addShape(this.pres.shapes.RECTANGLE, {
        x: g.x - pad, y: g.y - pad, w: g.w + 2 * pad, h: g.h + 2 * pad, rotate: rot,
        fill: { color: frameColor }, line: { color: 'D9DCE1', width: 0.5 },
        shadow: shadow ? { type: 'outer', color: '000000', blur: 14, offset: 4, angle: 90, opacity: 0.55 } : undefined,
        objectName: fr,
      });
      names.push(fr);
    }
    const im = this.name('img');
    const io = { path: file, x: g.x, y: g.y, w: g.w, h: g.h, rotate: rot, objectName: im };
    if (link) io.hyperlink = { url: link };
    if (!border && shadow) io.shadow = { type: 'outer', color: '000000', blur: 14, offset: 4, angle: 90, opacity: 0.55 };
    s.addImage(io);
    names.push(im);
    names.geom = g;
    return names;
  }

  // Neutral citation card for a verified headline (used when a screenshot isn't available).
  headlineCard(s, item, box, { rot = 0, size = 'm', dek = true } = {}) {
    const names = [];
    const card = this.name('hcard');
    s.addShape(this.pres.shapes.RECTANGLE, {
      x: box.x, y: box.y, w: box.w, h: box.h, rotate: rot, fill: { color: HEX.paper }, line: { color: 'D9DCE1', width: 0.5 },
      shadow: { type: 'outer', color: '000000', blur: 14, offset: 4, angle: 90, opacity: 0.55 }, objectName: card,
    });
    names.push(card);
    const hs = { s: 14, m: 17, l: 22 }[size];
    const runs = [
      { text: `${(item.outlet || '').toUpperCase()}${item.date ? '   ·   ' + fmtDate(item.date) : ''}`, options: { fontSize: 9, bold: true, color: '8A1C1F', charSpacing: 2, breakLine: true, paraSpaceAfter: 4 } },
      { text: item.headline, options: { fontFace: 'Cambria', fontSize: hs, bold: true, color: HEX.ink, breakLine: !!(dek && item.dek), paraSpaceAfter: 4 } },
    ];
    if (dek && item.dek) runs.push({ text: item.dek, options: { fontSize: Math.max(10, hs - 6), color: '4A4F59' } });
    const t = this.name('htext');
    s.addText(runs, {
      isTextBox: true, x: box.x + 0.18, y: box.y + 0.12, w: box.w - 0.36, h: box.h - 0.24, rotate: rot, valign: 'top',
      margin: 0, fit: 'shrink', objectName: t,
    });
    names.push(t);
    return names;
  }

  // Big number callout. Returns names.
  stat(s, { x, y, w, value, label, color, valueSize = 54, labelSize = 13 }) {
    const n1 = this.text(s, value, { x, y, w, h: valueSize / 72 * 1.15, fontSize: valueSize, bold: true, color: color || this.S.red, fontFace: THEME.headFontFace, valign: 'bottom' });
    const n2 = this.text(s, label, { x, y: y + valueSize / 72 * 1.15 + 0.05, w, h: 0.75, fontSize: labelSize, color: this.S.muted, valign: 'top' });
    return [n1, n2];
  }

  // Muted source line at the bottom of a content slide.
  source(s, text, { y = 6.62, x = MX, w = W - 2 * MX } = {}) {
    return this.text(s, text, { x, y, w, h: 0.32, fontSize: 10, color: this.S.steel, valign: 'bottom', italic: true });
  }

  // Dark card background (subtle tint, no edge stripes).
  card(s, box, { color = HEX.card, line = HEX.line, rounded = true, transparency = 0 } = {}) {
    const name = this.name('card');
    s.addShape(rounded ? this.pres.shapes.ROUNDED_RECTANGLE : this.pres.shapes.RECTANGLE, {
      ...box, fill: { color, transparency }, line: { color: line, width: 0.75 }, rectRadius: rounded ? 0.08 : undefined, objectName: name,
    });
    return name;
  }

  // Terminal-style transcript card for verbatim agent logs.
  terminal(s, { x, y, w, h, title, lines, fontSize = 12 }) {
    const names = [];
    names.push(this.card(s, { x, y, w, h }, { color: '0D1016', line: '2F3644' }));
    const dots = ['FF5F57', 'FEBC2E', '28C840'].map((c, i) => {
      const n = this.name('dot');
      s.addShape(this.pres.shapes.OVAL, { x: x + 0.18 + i * 0.2, y: y + 0.15, w: 0.12, h: 0.12, fill: { color: c }, line: { color: c, width: 0 }, objectName: n });
      return n;
    });
    names.push(...dots);
    if (title) names.push(this.text(s, title, { x: x + 0.85, y: y + 0.08, w: w - 1.0, h: 0.26, fontSize: 10, color: this.S.steel, fontFace: 'Courier New' }));
    const runs = [];
    lines.forEach((ln, i) => {
      const o = typeof ln === 'string' ? { text: ln } : ln;
      runs.push({ text: o.text, options: { fontFace: 'Courier New', fontSize, color: o.color || 'C9D1D9', bold: !!o.bold, breakLine: i < lines.length - 1, paraSpaceAfter: 5 } });
    });
    names.push(this.text(s, runs, { x: x + 0.22, y: y + 0.45, w: w - 0.44, h: h - 0.6, valign: 'top', fit: 'shrink' }));
    return names;
  }

  // Embedded online video with a cover image + clickable fallback link.
  async video(s, { link, embed, cover, box, label }) {
    const names = [];
    const nat = await imgSize(cover);
    const g = fit(nat, box);
    const coverData = 'data:image/' + (cover.endsWith('.png') ? 'png' : 'jpeg') + ';base64,' + fs.readFileSync(cover).toString('base64');
    if (embed) {
      const n = this.name('video');
      s.addMedia({ type: 'online', link: embed, x: g.x, y: g.y, w: g.w, h: g.h, cover: coverData, objectName: n });
      names.push(n);
    } else {
      const n = this.name('vcover');
      s.addImage({ path: cover, x: g.x, y: g.y, w: g.w, h: g.h, hyperlink: { url: link }, objectName: n });
      names.push(n);
    }
    if (label) {
      names.push(this.text(s, [
        { text: '►  ', options: { color: this.S.red, bold: true } },
        { text: label, options: { color: this.S.muted, hyperlink: { url: link } } },
      ], { x: g.x, y: g.y + g.h + 0.08, w: g.w, h: 0.3, fontSize: 11 }));
    }
    names.geom = g;
    return names;
  }

  // Native chart with the deck's consistent dark styling. type: 'line' | 'bar' | 'area' | 'scatter' | 'doughnut'
  chart(s, type, data, box, opts = {}) {
    const name = opts.objectName || this.name('chart');
    const T = this.pres.charts[type.toUpperCase()];
    const base = {
      ...box, objectName: name,
      chartColors: [HEX.red, HEX.steel, HEX.blue, HEX.amber, HEX.teal, 'C9D1D9'],
      catAxisLabelColor: HEX.muted, valAxisLabelColor: HEX.muted, catAxisLabelFontFace: '+mn-lt', valAxisLabelFontFace: '+mn-lt',
      catAxisLabelFontSize: 11, valAxisLabelFontSize: 11, catAxisLineColor: HEX.line, valAxisLineShow: false,
      valGridLine: { color: HEX.line, size: 0.75 }, catGridLine: { style: 'none' },
      showLegend: (data.length > 1), legendPos: 't', legendColor: HEX.muted, legendFontFace: '+mn-lt', legendFontSize: 11,
      dataLabelColor: HEX.text, dataLabelFontFace: '+mn-lt', dataLabelFontSize: 11,
      titleColor: HEX.text, titleFontFace: '+mj-lt', titleFontSize: 14,
      lineSize: 3, lineDataSymbol: 'circle', lineDataSymbolSize: 7,
      valAxisTitleColor: HEX.muted, catAxisTitleColor: HEX.muted, valAxisTitleFontSize: 11, catAxisTitleFontSize: 11,
    };
    s.addChart(T, data, { ...base, ...opts, objectName: name });
    return name;
  }

  async write(file) {
    await this.pres.writeFile({ fileName: file });
    fs.writeFileSync(file.replace(/\.pptx$/, '.anim.json'), JSON.stringify(this.anim, null, 1));
    fs.writeFileSync(file.replace(/\.pptx$/, '.theme.json'), JSON.stringify(THEME, null, 1));
  }
}

function fmtDate(d) {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(d || '');
  if (!m) return d || '';
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m[2] - 1];
  return m[3] ? `${mon} ${+m[3]}, ${m[1]}` : `${mon} ${m[1]}`;
}

module.exports = { Deck, THEME, HEX, W, H, MX, A, ROOT, imgSize, fit, fmtDate };
