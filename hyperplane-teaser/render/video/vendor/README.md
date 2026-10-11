# Vendored libraries (no network at render time)

Installed with `npm install roughjs perfect-freehand mathjax-full three@0.169.0` (versions in `VERSIONS.txt`, `package.json`,
`package-lock.json`); only the browser builds below are kept (node_modules was pruned).

| file | library | exposed by fx/core.js as |
|---|---|---|
| `rough/rough.js` | roughjs 4.6.6 (MIT), bundled IIFE (`window.rough`) | `HP.lib.rough.canvas(cv, key)`, `.svg(svgEl, key)`, `.generator(key)`: seeded wrappers (every shape gets `seed = HP.hash(key, ...)` unless options carry one; rough falls back to Math.random without a seed). `HP.lib.rough.raw` = the library. Eager. |
| `perfect-freehand/perfect-freehand.js` | perfect-freehand 1.2.3 (MIT), `dist/cjs/index.js` wrapped as `window.PerfectFreehand` | `HP.lib.freehand.getStroke(points, opts)`, `getStrokePoints`, `getStrokeOutlinePoints`, `toPath(outline)` (SVG path data), `path2d(outline)` (canvas Path2D). Eager. |
| `mathjax/tex-svg-full.js` | mathjax-full 3.2.1 (Apache-2.0), es5 component with every TeX extension | `await HP.lib.mathjax.load()` (lazy, ~150 ms), then `HP.lib.mathjax.svg(tex, {px, display, color})` -> `{svg, w, h, baseline}`: a px-sized SVG whose glyphs are plain `<path>`s (fontCache none), so they can be drawn on stroke by stroke. |
| `three/three.js` | three 0.169.0 (r169, MIT; `three/LICENSE`), `build/three.cjs` wrapped as a browser global (`window.THREE`) | not eager: `fx/netviz.js` calls `HP.lib.load('three')` in its item `load()` and uses `HP.lib.netviz.THREE`. WebGL in headless Chromium is SwiftShader (software): deterministic (identical frames across runs and render orders), ~20-80 ms per frame for the netviz scenes; the renderer is created with `preserveDrawingBuffer: true`. Added by builder B. |

To update: `npm install <pkg>@<version>` here, copy the same build files over, re-run the wrap for perfect-freehand
(see the header of `perfect-freehand/perfect-freehand.js`), delete node_modules.
