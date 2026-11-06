// Cornell Splash M1237 · PART 4 (What we can do) and the Q&A, split out of slides_splash_extra.js on Nov 6, 2026 so the
// Part 4 editor and the Parts 2-3 editor never edit the same file. slides_splash_extra.js's part(d, 4) / part(d, 5) use
// what this file exports: ORDER4 (the content slides, in order; an entry {fn, kicker} gets its own kicker and is not
// counted), DIVIDER4 (the divider; default: X.DIVIDERS[4]), reveal (the closing "made by an AI" slide) and qaSlide.
// Helpers and the existing Part 4 slides come from slides_splash_extra.js (X.slides.*, X.reuse, X.notes, X.meta, X.poll).
const X = require('./slides_splash_extra');
const S = X.slides;

const ORDER4 = [S.p4Approaches, S.p4Access, { fn: S.p4Pain, kicker: 'PART 4 · AN OPEN QUESTION' }, S.p4YouCanDo];
const DIVIDER4 = X.DIVIDERS[4];
const reveal = S.p4Reveal;
const qaSlide = S.qaSlide;

module.exports = { ORDER4, DIVIDER4, reveal, qaSlide };
