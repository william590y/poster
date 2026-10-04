# Slide-authoring brief (shared by all slide agents)

We are building **"AI Safety and Existential Risk"** (by William Liaw), a live talk deck that must look super professional
and convey (a) how fast AI is advancing, (b) how scary that is, (c) the urgency of safety, (d) the theory underneath.
The user wants **lots of visuals, especially real screenshots of real news headlines**, plus tasteful animations.
Project root: `/home/user/poster/ai-safety-presentation`. Generator: pptxgenjs via `tools/lib.js`.

## Your deliverable
Write `tools/slides_<module>.js` exporting `async function build(d)` that appends your slides, in order, to the `Deck` `d`.
Do NOT call `d.sectionStart` (the main script does). Do NOT edit `tools/lib.js`, `tools/postprocess.py`, or any other
module — define local helpers inside your own file. Derived images (crops/resizes) go to `assets/slides/<module>/`
(create it; never modify files under `assets/research/` or `assets/original/`).

Render and check: `node tools/render_module.js <module>` → validates, renders, prints JPG paths
(`build/preview/<module>/slide-N.jpg`). **Look at every JPG with the Read tool**, fix problems, re-render. Iterate until clean.

## The Deck API (tools/lib.js) — read the file once, it is short
- `const s = d.slide('Content' | 'Blank' | 'Exp', { transition })` → transitions: `fade` (default), `push`, `pushLeft`,
  `wipe`, `cover`, `zoom`, `dissolve`, `split`, `fadeBlack`. Use `fade` mostly; `push`/`pushLeft` between consecutive slides
  of one topic; `zoom`/`fadeBlack` before a video or a climactic slide. Don't make it a circus.
- `Content` layout: `s.addText('KICKER', { placeholder: 'kicker' })` and `s.addText('Title', { placeholder: 'title' })`.
  `Blank`: footer only (for full-bleed visuals / video). `Exp`: background with an exponential curve, kicker+title.
- `d.text(s, textOrRuns, opts)` → name. Always pass x,y,w,h,fontSize,color. Colors: `d.S.txt` (off-white), `d.S.muted`,
  `d.S.red`, `d.S.amber`, `d.S.steel`, `d.S.blue` (scheme colors) — or hex from `HEX` for hex-only options.
- `await d.frame(s, file, {x,y,w,h}, { rot, pad, border, align, link })` → [frameName, imgName] (+ `.geom`):
  a screenshot/image fitted (contain) inside the box with a white clipping frame + shadow. `rot` in degrees (use −3…3 for a
  "pinned clippings" collage; 0 for charts/figures). `border:false` for charts/photos that look better unframed.
- `d.headlineCard(s, item, {x,y,w,h}, { rot, size:'s'|'m'|'l', dek })` → names: neutral citation card (outlet · date,
  headline in serif, optional dek) for verified headlines that have no usable screenshot. Never imitate an outlet's logo.
- `d.stat(s, { x, y, w, value, label, color, valueSize, labelSize })` → names: big number callout.
- `d.card(s, {x,y,w,h})` → subtle dark card background. `d.terminal(s, { x,y,w,h, title, lines })` → terminal-style card for
  VERBATIM agent transcripts / chain-of-thought (lines: strings or `{text, color, bold}`).
- `await d.video(s, { link, embed, cover, box, label })` → embedded YouTube video (embed = `https://www.youtube.com/embed/<ID>`,
  link = watch URL, cover = thumbnail file) with a clickable caption.
- `d.chart(s, 'line'|'bar'|'area'|'scatter'|'doughnut', data, {x,y,w,h}, opts)` → native chart pre-styled for the dark theme
  (data = pptxgenjs format `[{ name, labels, values }]`). Prefer native charts for any dataset in the manifests. Add
  `showValue`, `valAxisMaxVal`, `valAxisLabelFormatCode`, `catAxisLabelFrequency` etc. as needed. For bars: `barDir: 'col'|'bar'`.
  Highlight with `chartColors`. Never stacked + `dataLabelPosition: 'outEnd'`.
- `d.source(s, 'Sources: …')` → muted italic source line at y≈6.62 (keep content above y=6.55).
- `d.animate(s, names, { auto, effect, stagger, delay, dur, after })` — one call = one build step.
  `auto:true` = plays automatically (first group starts on slide entry; later auto groups chain "after previous" with
  `after` ms gap). `auto:false` (default) = on click. Effects: `fade`, `rise` (fade + float up), `zoom`, `slam` (drops in
  from 135% scale — great for a damning headline), `wipeLeft` (good for charts/lines), `wipeDown`.
  Always animate a frame's names together (frame + image) — pass the array returned by `frame()` / `headlineCard()`.
- `s.addNotes('…')` — speaker notes: put talking points, every source URL, and any caveats here.
- `await imgSize(file)` and `fit(nat, box)` are exported if you need manual layout. `A('research','work','x.png')` builds paths.

## Canvas & layout rules
- 13.333" × 7.5". Margins 0.6". Title zone is fixed by the layout (kicker y=0.42, title y=0.72–1.47).
  Content zone: x 0.6 → 12.73, y 1.7 → 6.55. Source line 6.62–6.94. Footer/slide number at 7.03 (from the layout).
- Kicker: UPPERCASE section label with a number, e.g. `THE ACCELERATION · ECONOMY`, `ROGUE AGENTS · 2`.
- Title: sentence case, ≤ ~48 characters so it fits on one line at 36pt, no trailing period. It should state the message
  ("Junior engineering jobs are vanishing"), not just the topic, where possible.
- Body text ≥ 14pt; captions/labels ≥ 10pt; nothing smaller except the layout footer. Left-align body text.
- Every slide must have a strong visual: screenshot collage, chart, photo, diagram, big stat. No text-only slides.
- Vary layouts: collage of 4–7 rotated headline clippings; hero image + 2–3 stat callouts; chart + commentary column;
  2×2 / 3-up grids; a "wall of headlines" cascade; terminal transcript + annotation; full-bleed photo with overlay.
- Leave ≥0.3" between blocks. Nothing may overflow its box or the slide; no overlapping text. Rotated clippings may overlap
  each other slightly (that is the look), but never cover another clipping's headline text.
- Dark theme: never put dark text on the dark background; paper-white clippings carry dark text by design.
- Section pacing: about 1–2 minutes per slide. Split a crowded outline slide into 2–3 slides rather than cramming.

## Truthfulness (non-negotiable)
- Use only material in the manifests (`assets/research/*/manifest.json`, `assets/research/ttt_session/manifest.json`)
  and the user's original images (`assets/original/`, described below). Only items with `"verified": true`.
- Headline text in cards must be copied verbatim from the manifest. Stats on slides must come from manifest `facts` /
  `datasets` (round sensibly, keep units, put the source on the slide and the URL in the notes).
- Model/product names (e.g. GPT-6 Astra, Claude Opus 5.5, Fable) appear exactly as in sources.
- If an outline item is in a manifest's `not_found`, do not invent it. Either skip it, or (only if it is central to the
  user's outline) include a clearly-marked placeholder box: dashed outline, text `[Add screenshot: <what>]` in amber —
  and mention it in your final report.
- Note vendor-reported / unverified / company-run results as such in notes (and on the slide if the claim is central).

## The user's original images (assets/original/)
- `image1.png` WSJ-style chart "Private construction relative to Dec. 2023: data centers vs all other" (Commerce Dept.)
- `image2.png` chart: AI-linked share of S&P 500 market value 2019–2027 (Mag 7, Kobeissi, JPMorgan series)
- `image3.png` headline text image "AI Swallows Wall Street: Stocks Hit Record 45% of S&P 500 Market Cap"
- `image4.png` 2×2 heron pencil drawings made by a model (iterative refinement, Final 1–4)
- `image5.png` photoreal Blender recreation of the Palace of Fine Arts by GPT-6 Astra (r/singularity)
- `image6.png` Coconut (Chain of Continuous Thought) training-procedure figure
- `image7.png` Coconut ProsQA case-study figure (latent reasoning as search)
- `image8.png` chart "Claude now leads 26% of model R&D work" (Anthropic R&D Automation Index)
- `image9.png` chart "Vals RSI Index" with extrapolations (projected milestones)
- `image10.png` attack-chain diagram: "from a frontier-model evaluation sandbox to our internal network" (Hugging Face)
- `image11.png` headline text image "Musk's AI chatbot Grok reportedly encouraged Trump to capture Venezuela's president"

## Final report (your last message)
Short: slide list (title per slide), what visuals/animations you used, any placeholders, and any doubts about accuracy.

## Chart notes
- A one-series bar chart colors each bar differently when `chartColors` has more than one entry; pass a single color
  (e.g. `chartColors: [HEX.red]`) for uniform bars, or one entry per bar on purpose to highlight (e.g. the last bar red).
- `valAxisLabelFormatCode` examples: `'0%'` (values as fractions), `'#,##0'`, `'$#,##0"B"'`.
