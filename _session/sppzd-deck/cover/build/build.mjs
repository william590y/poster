// Bundle bf.js + main.js, minify with terser, wrap as the x-embed page, check limits, write the slide.
import fs from 'fs';
import {minify} from 'terser';
const dir = new URL('.', import.meta.url).pathname;
const D = dir.replace(/cover\/build\/$/, '');
const src = fs.readFileSync(dir + 'bf.js', 'utf8') + '\n' + fs.readFileSync(dir + 'main.js', 'utf8');
const out = await minify(src, {
  ecma: 2022, toplevel: true,
  compress: {passes: 3, unsafe: true, unsafe_arrows: true, pure_getters: true, booleans_as_integers: false},
  mangle: {toplevel: true},
  format: {ascii_only: false, comments: false},
});
let js = out.code;
const page = '<!doctype html><script>' + js + '</script>';
const bytes = Buffer.byteLength(page, 'utf8');
const errs = [];
if (bytes > 16384) errs.push(`embed is ${bytes} bytes > 16384`);
const inner = js;
if (inner.includes('</')) errs.push('"</" inside the script');
if (/<!--|<script/i.test(inner)) errs.push('"<!--" or "<script" inside the script');
const tpl = fs.readFileSync(dir + 'slide.tpl.html', 'utf8');
const notes = fs.readFileSync(dir + 'notes.txt', 'utf8').trim();
if (/[<>&]/.test(notes)) errs.push('notes contain < > or &');
const slide = tpl.replace('@@EMBED@@', () => page).replace('@@NOTES@@', () => notes);
if (slide.includes('@@')) errs.push('placeholder left');
fs.writeFileSync(dir + 'embed.html', page);
fs.writeFileSync(dir + 'embed.min.js', js);
fs.writeFileSync(dir + 's1-title.built.html', slide);
// exact measurement: the bytes between the x-embed tags in the slide file
const m = slide.match(/<x-embed[^>]*>([\s\S]*?)<\/x-embed>/);
const between = Buffer.byteLength(m[1], 'utf8');
console.log(`embed content ${between} bytes (limit 16384, headroom ${16384 - between}); script ${Buffer.byteLength(js, 'utf8')} bytes; slide file ${Buffer.byteLength(slide, 'utf8')} bytes`);
const nonAscii = [...new Set([...js].filter(ch => ch.charCodeAt(0) > 127))].join('');
console.log('non-ASCII glyphs in the script:', nonAscii);
if (errs.length) { console.log('ERRORS:', errs.join('; ')); process.exit(1); }
if (process.argv.includes('--write')) { fs.writeFileSync(D + 'deck/project/slides/s1-title.html', slide); console.log('wrote deck slide'); }
