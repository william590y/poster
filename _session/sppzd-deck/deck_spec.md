# Writer spec: "Self-Play Pretraining with Zero Data" lab-meeting deck

Audience: an ML research lab, 1-hour lab meeting (40 min talk + 18 min discussion). The presenter is William Liaw.
Content source of truth: `/tmp/claude-0/-home-user/a99e0376-0534-5e3e-8b47-ccbc03821dfd/scratchpad/sppzd/outline.json`
(key `slides`, each `{id, section, minutes, title, layout, content, figure, diagram, notes}`). Every number, quote, page
reference and attribution in it was fact-checked against the paper. The paper itself: `.../sppzd/src/paper.txt`
(layout text) and `.../sppzd/pages/p-NN.png` (page renders) if you must check a detail.

## Where to write
Root: `/tmp/claude-0/-home-user/a99e0376-0534-5e3e-8b47-ccbc03821dfd/scratchpad/sppzd/deck`
One file per slide: `<root>/project/slides/<id>.html`. Write each file DIRECTLY with the Write tool (never a script that
generates files). Do not touch `project/deck.json` or `s1-title.html` (already published). Do not publish anything.

## Slide format (closed subset; anything else is dropped)
- The file is EXACTLY ONE `<section id="<id>" style="...">...</section>`; nothing before or after it. No `<html>`,
  `<head>`, `<style>`, `<link>`, classes or scripts.
- Canvas 1920x1080. Every style inline. Allowed elements: h1 h2 h3 p ul ol li br b i u a span div img table tr th td hr
  x-shape x-icon x-connector svg aside. `<ul>/<ol>` hold plain `<li>` (one level, no nesting).
  Inline marks only `<b> <i> <u> <a href> <span style="color:...">` (no sizes or fonts on spans).
- CSS allowed (px only; no em/rem/%, no margin, z-index, var(), float): position(absolute|relative) left top right bottom
  width height min-width max-width min-height max-height display(flex|grid) flex-direction flex-wrap gap(one px value)
  align-items justify-content justify-items align-self flex flex-grow flex-shrink flex-basis grid-template-columns
  grid-template-rows grid-column/grid-row (span N only) padding overflow font-family font-size(>=24px everywhere)
  font-weight font-style line-height letter-spacing text-align text-transform white-space text-decoration
  font-variant-numeric color background border(+ -top/-right/-bottom/-left; style word required, e.g. `1px solid #ccc`)
  border-radius box-shadow opacity transform object-fit.
- `gap` works only on section and div. Lists cannot be spaced with margins: for spaced items use a flex-column div of
  `<p>` blocks with `gap`.
- Escape `<` and `>` in text as `&lt;` `&gt;` (Brainf*ck code!), `&` as `&amp;`.
- Tables: `<table>` of `<tr>` with `<th>` (first row) / `<td>`; no colspan/rowspan; column widths via `width:N%` on EVERY
  cell of the first row; `<tr style="background:...">` for banding (no background on cells); one `padding` per table
  (on cells) if any, never `padding:... 0`. Row height ~ 2.1 x font-size per text line.
- Images: `<img src="/_blob/<id>" alt="what it shows" style="width:Wpx;height:Hpx;object-fit:contain">` (urls below).
- Speaker notes: ONE `<aside>` as the section's LAST child, PLAIN TEXT (no tags inside), at most 4,000 characters.
- At most 200 elements per slide. Pinned (`position:absolute`) text needs a `width`.
- Text wraps only at spaces; size boxes to their longest word (about 0.6 x font-size per character).

## Look (decided; do not change)
Fonts (declared in deck.json): headings `'Source Serif 4', Georgia, serif`; body `'IBM Plex Sans', Arial, sans-serif`;
code/pseudocode/equation-ish monospace `'IBM Plex Mono', 'Courier New', monospace`.
Type scale (use only these): 88 cover title (done) · 56 slide titles (h2) · 36 lead lines, statements, question text ·
28 body · 24 small (tables, captions, footers, eyebrows, dense detail). Emphasis by weight/italic/color, not new sizes.
Palette:
- paper `#f6f5f0` (content-slide background) · ink `#17242c` (headings on paper; dark slide background)
- body text `#3d4a52` · muted `#5f6b72` (captions, footers, cites) · rule `#d5d9d2`
- card `#ebefe9` (tinted panel on paper) · figure panel `#ffffff` with `1px solid #dde1da`, radius 12px, padding 16-20px
- teal accent `#1d6f68` (eyebrows, emphasis, "paper says") · orange accent `#a14d19` (marks the PRESENTER'S OWN readings,
  calculations and caveats: write a label such as "our reading", "our calc", "plot read" in it, never color alone)
- On dark `#17242c` slides: text `#eef1ec`, muted `#b9c7c4`, teal-light `#6cc3b8`, orange-light `#f2b07c`
- Accent statement slide (only `s4-05-takeaways`): background `#1d6f68`, text `#eef1ec`, secondary `#cfe6e2`.
Question/discussion slides (`s2-07`, `s3-10`, `s4-06-discussion`) use the dark background. Everything else: paper.

## Shared markup (keep these identical across slides so nothing hops)
Content slide section:
`<section id="ID" data-transition="fade" style="background:#f6f5f0;color:#3d4a52;font-family:'IBM Plex Sans', Arial, sans-serif;padding:128px 128px 160px;display:flex;flex-direction:column;gap:40px">`
Header block (first child):
```
<div style="display:flex;flex-direction:column;gap:12px">
<p style="font-size:24px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#1d6f68">SECTION NAME</p>
<h2 style="font-family:'Source Serif 4', Georgia, serif;font-size:56px;font-weight:600;line-height:1.1;color:#17242c">Title</h2>
</div>
```
Section names for the eyebrow: `Background` (s1-*), `Method` (s2-*), `Results` (s3-*), `Critique` (s4-*).
Footer (two pinned 24px paragraphs, nothing else below y 920):
`<p style="position:absolute;left:128px;bottom:64px;width:1440px;font-size:24px;color:#5f6b72">Cowsik et al. 2026 · SOURCE REFS</p>`
`<p style="position:absolute;right:128px;bottom:64px;width:120px;text-align:right;font-size:24px;color:#5f6b72">N</p>`
(dark slides: footer color `#b9c7c4`). Page numbers N (cover = 1): s1-hook 2, s1-roadmap 3, s1-solomonoff 4,
s1-selfplay 5, s2-01 6, s2-02 7, s2-03 8, s2-04 9, s2-05 10, s2-06 11, s2-07 12, s3-01 13, s3-02 14, s3-03 15,
s3-04 16, s3-05 17, s3-06 18, s3-07 19, s3-08 20, s3-09 21, s3-10 22, s4-01-positioning 23, s4-02-strengths 24,
s4-03-limitations 25, s4-04-convince 26, s4-05-takeaways 27, s4-06-discussion 28.

Space budget on a footer slide: 1664 px wide x 792 px tall inside the padding. The header block (eyebrow + one-line
title) is ~105 px, plus the 40 px gap, leaving ~645 px for the body. A two-line title costs ~62 px more: keep titles to
one line at 56px (about 50 characters max; shorten the outline title if needed, same meaning). Body at 28px with
line-height 1.35 = ~38 px per line. Card height = lines x size x line-height + padding (never set a fixed height on a
text box). If it does not fit: cut words, move detail into the notes; never shrink below the scale.

Figure layouts (pick by the image aspect ratio a = width/height):
- Side by side (a <= ~2.3): body = `<div style="display:flex;flex-direction:row;gap:48px;align-items:start">`: figure
  panel (img width ~960-1060 px, height = width / a) + a takeaways column (`flex:1`, flex column of `<p>` at 28px,
  `gap:20px`, each takeaway optionally with `border-left:4px solid #1d6f68;padding-left:20px`).
- Stacked (a > ~2.3): figure panel on top (img height ~360-420 px, width = height x a, max 1624), then a row of 2-3
  takeaway cards (`background:#ebefe9;border-radius:12px;padding:24px`, `flex:1`, text 24-28px).
A one-line 24px muted caption under a figure ("Paper's Fig. 2, p.7") is fine and counts toward the height.

## Content rules
- The outline's `content` is the slide's material and its `notes` are the speaker notes. The outline is DENSE: put the
  essential claims on the slide (aim: a slide is readable in the allotted minutes; ~6 short bullets or ~4 takeaways
  max) and move the rest, verbatim where possible, into the `<aside>`. Nothing in the outline may be lost: whatever is
  cut from the slide goes into the notes (notes = outline notes + moved detail + a first line "About N minutes.").
- Keep every number, quote, page/figure reference and attribution EXACTLY as in the outline. Never invent a number,
  quote or claim. Keep the outline's provenance markers: "(my calc)", "(plot read)", "my reading", "Not reported".
  On the slide, render the presenter's own readings with the orange accent and say "our calc" / "our reading" /
  "plot read" in words (notes may keep "my").
- Quotes from the paper: in quotation marks, with the page in muted text, e.g. `“scales substantially more slowly” (p.7)`.
- Use symbols where clearer: θ φ π Σ ≈ ≤ ≥ × → · (literal characters). Write Brainf*ck as "Brainf*ck".
- Short refs go in the footer (e.g. "Cowsik et al. 2026 · Fig. 2, p.7; Sec. 3.1, p.9").

## Images (upload urls; aspect ratios)
- `/_blob/9a224ddde4d3dcc567eaa9fb5bd78083` paper Fig. 1 top: method diagram (generator → programs → UTM → bytes →
  learner; reward r_i = |<g_i, Δθ_i>|), 1265x756, a = 1.67 → use on `s2-01` instead of drawing the diagram; caption
  "Paper's Fig. 1 (top), p.3". Put the outline's diagram labels into the side bullets where useful.
- `/_blob/b98176f74998bfe9f6ca5780985f155d` Brainf*ck for-loop example line from App. E, 1189x103, a = 11.5 (s2-02)
- `/_blob/7aed17bfef648aa43dc975bb26e333fc` Eq. 1 learner loss, 1162x131, a = 8.9 (s2-03)
- `/_blob/007ebf02f5ab43a1c6aa195f17d89319` Eq. 3 J_RL(φ) = E[r(x)] − β KL(g_φ‖g_0), g_0(x) = |A|^−ℓ(x), 1437x125, a = 11.5 (s2-03)
- `/_blob/bf9be6b823e5518e4d4f3b991b0a83a2` Eq. 2 reward (p(e)=⌊e/2⌋, δθ_e, r_i, P_e), 1162x273, a = 4.26 (s2-04)
- `/_blob/db9b5925e1761a935d6bdd52ebf0ba4f` Fig. 10 melody byte encoding, 1592x551, a = 2.89 (s3-01)
- `/_blob/0861642efb87bae638c94d962bb30fa6` Fig. 2, 8 panels, 1677x791, a = 2.12 (s3-02)
- `/_blob/250a2a00d0f1699965c28200d9914113` Table 1 math families, 1141x319, a = 3.58 (s3-04)
- `/_blob/38a47bba61cedb3ac3a00a44824f1d6f` Fig. 3 (a) epiplexity, (b) val BPB vs checkpoint, 1285x589, a = 2.18 (s3-05)
- `/_blob/146338f4646e905a76a471df0d2f849e` Fig. 4 ICL, three panels, 1665x580, a = 2.87 (s3-06)
- `/_blob/835419cf3396a0ede91c32653b1223f8` Fig. 5 SUM strategies, 1170x625, a = 1.87 (s3-07)
- `/_blob/fbb8401ae93db8ee938a0c9ebc772f4b` Fig. 6 pre-pretraining warm start, 1694x560, a = 3.02 (s3-08)
- `/_blob/86498133925381ca68d2e520cd1dddbd` Table 5 reward ablations, 1292x569, a = 2.27 (s3-09)
- `/_blob/dce0622edb05b153cd7701593faae64c` Fig. 2 Text (DCLM) panel only, no legend (teal filled = self-play,
  orange dashed = universal prior, purple dash-dot = PCFG: say so in a caption), 418x346, a = 1.21 (s4-02-strengths)
- `/_blob/d618bbb1f769331f81914c6be48fcfa4` Fig. 1 bottom: scaling and ICL teaser, 1216x578, a = 2.10 (optional, e.g. s1-hook)
The outline's `figure` paths map to these by file name; `s4-02-strengths` uses the DCLM panel above.
The `s3-06` diagram build steps are optional: no pinned overlays on the plot (they would not line up); state the chance
line (1/256 ≈ 0.004, our calc) in text instead.

## Self-check before you finish
Run the static linter on your files: `python3 -I /tmp/claude-0/-home-user/a99e0376-0534-5e3e-8b47-ccbc03821dfd/scratchpad/sppzd/lint_slide.py <files>`
and fix every line it prints until each file says OK. Then do the space arithmetic once per slide (header + body heights
<= 792 px) and fix anything over. Do not render, screenshot or publish.
