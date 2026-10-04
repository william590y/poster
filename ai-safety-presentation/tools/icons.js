// Render react-icons to PNG data URIs for pptxgenjs.
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const sharp = require('sharp');
const packs = {
  fa: () => require('react-icons/fa'), fa6: () => require('react-icons/fa6'), md: () => require('react-icons/md'),
  tb: () => require('react-icons/tb'), pi: () => require('react-icons/pi'), gi: () => require('react-icons/gi'), lu: () => require('react-icons/lu'),
};
const cache = {};
async function icon(name, color = '#F2F3F5', size = 256) {
  const key = name + color + size;
  if (cache[key]) return cache[key];
  const prefix = name.match(/^[A-Z][a-z]+/)[0].toLowerCase();
  const pack = { fa: 'fa', md: 'md', tb: 'tb', pi: 'pi', gi: 'gi', lu: 'lu' }[prefix] || 'fa';
  let C = packs[pack]()[name];
  if (!C && pack === 'fa') C = packs.fa6()[name];
  if (!C) throw new Error('icon not found: ' + name);
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(C, { color, size: String(size) }));
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  return (cache[key] = 'image/png;base64,' + buf.toString('base64'));
}
module.exports = { icon };
