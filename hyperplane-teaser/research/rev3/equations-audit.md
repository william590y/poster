# Equations audit, rev3 (research/equations stage)

William's change 5: "lets only keep the equations for attention and the policy gradient for GRPO (and for GRPO just show
the gradient itself), and use the remaining space for something else."

Scratch (stills, sheets, the arXiv source, the builder scripts): `/tmp/claude-0/-home-user/a99e0376-0534-5e3e-8b47-ccbc03821dfd/scratchpad/hp3/equations/`
(`stills/`, `work/`, `src/` = the v3 e-print, read only).

Files changed in the project: `research/rev3/equations-rev3.json` (new), `render/video/edl/test-grpo-grad.json` (new),
`render/video/fx/equations.js` (one line: EFILES), this file. Nothing else. `long2` / `short2` regress at 0.0000 (see D).

---------------------------------------------------------------------------------------------------------------------------

## A. The GRPO policy gradient, exact

### A.1 Source
- Paper: Shao et al., "DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models", arXiv:2402.03300.
- Where: Appendix **A.1.6 "Group Relative Policy Optimization (GRPO)"** (under A.1 Analysis of Reinforcement Learning, in
  the unified-paradigm appendix). The heading is on p. 29 of the arXiv PDF; the gradient is printed **eq. (20) on p. 30**
  (eq. 19 is the appendix objective on p. 29, eq. 21 the gradient coefficient GC_GRPO on p. 30). The gradient has no `\label` in the source.
- Version: arXiv lists v1 (5 Feb 2024), v2 (6 Feb 2024), v3 (27 Apr 2024). I read the **v3 e-print** (latest) and also v1 and v2:
  the lead-in sentence plus the equation block is **byte-identical in all three** (same sha1), and the PDFs of all three print
  it as (20) on p. 30. Rasterised p. 30 viewed and checked against the TeX.
- Verbatim from `main.tex` (v3), newlines collapsed:

```
\footnotesize \begin{split} \nabla_{\theta}\mathcal{J}_{GRPO}(\theta) & = \mathbb{E}{[q \sim P_{sft}(Q), \{o_i\}_{i=1}^G \sim \pi_{\theta_{old}}(O|q)]} \\ & \frac{1}{G}\sum_{i=1}^G\frac{1}{|o_i|} \sum_{t=1}^{|o_i|} \left[\hat{A}_{i,t} + \beta \left(\frac{\pi_{ref}(o_{i,t}|o_{i,<t})}{\pi_{\theta}(o_{i,t}|o_{i,<t})} - 1\right)\right] \nabla_{\theta}\log \pi_\theta(o_{i,t} | q, o_{i,<t}). \end{split}
```

- Notation differences from the sec. 4.1 objective (eq. 3), all **kept exactly as the paper writes the gradient**:
  1. KL: eq. 3 has `\beta \mathbb{D}_{KL}[\pi_\theta || \pi_{ref}]` (estimator eq. 4: `pi_ref(o|q,o_<t)/pi_theta(o|q,o_<t) - log(...) - 1`).
     The gradient has its derivative, `\beta (pi_ref(o_{i,t}|o_{i,<t}) / pi_theta(o_{i,t}|o_{i,<t}) - 1)`, and that conditioning has **no `q`**.
  2. The question distribution is `P_{sft}(Q)` here (eq. 3: `P(Q)`).
  3. No min / clip (the appendix assumes pi_theta_old = pi_theta "for simplified analysis").
  4. The sentence-final period after the last symbol is punctuation, not maths: dropped in every form.
  (I checked the algebra: differentiating appendix eq. 19 with pi_theta_old = pi_theta gives exactly the bracket [A-hat + beta (pi_ref/pi_theta - 1)] times the score function.)

### A.2 The record: `research/rev3/equations-rev3.json`
A list with one record, `id: "grpo-grad"`, same schema as `research/rev2/equations.json`'s `grpo` record (+ `section`, `page`,
`version_note`, `objective_notation_differences`, `sha1_source_block`). Built mechanically by a script (scratch
`work/build_record.py`) that cuts the block out of `main.tex` and asserts, per form, that the layout-stripped TeX equals the
paper's block (all four forms pass); MathJax 3.2.1 (the vendored build) compiles all forms with no error.

| field | use |
|---|---|
| `tex` = `latex_stacked` | **default (3 rows)**: row 1 `grad J(theta) = E[...]`; row 2 `1/G sum 1/|o_i| sum [A-hat + beta(...)]`; row 3 `grad log pi_theta(...)`. Cuts only after the expectation line and between `\right]` and `\nabla_\theta`; no `\left..\right` pair is split. |
| `latex` | the paper's own 2-row `aligned` layout (only fits at ~27 px em in 1080 px: not usable) |
| `stacked4_latex` (`form: "stacked4"`) | 4 rows: `grad J(theta) =` / expectation / sums + coefficient / score function |
| `stacked5_latex` (`form: "stacked5"`) | 5 rows, outside the 2-4 brief, big glyphs (kept as an option) |
| `highlight_latex` = `kl_term_latex` | `\beta \left(\frac{\pi_{ref}(o_{i,t}|o_{i,<t})}{\pi_{\theta}(o_{i,t}|o_{i,<t})} - 1\right)`, the KL part of the coefficient (`{from: "highlight"}`) |
| `adv_term_latex` | `\hat{A}_{i,t}`, the advantage (`{from: "adv_term"}`) |
| `score_term_latex` | `\nabla_{\theta}\log \pi_\theta(o_{i,t} | q, o_{i,<t})` (`{from: "score_term"}`) |
| `group_avg_latex`, `expect_latex` | `\frac{1}{G}\sum_{i=1}^G`; the expectation (`from: "group_avg"` / `"expect"`) |
| `coefficient_latex` | the whole coefficient (eq. 21's right-hand side); overlaps the advantage and KL terms: never mark it in the same item as those |
| `extra_highlights[0..4]` | advantage, score function, group average, expectation, whole bracket (`from: "extra:N"`) |
| `cite` | `Shao et al. 2024, DeepSeekMath (arXiv:2402.03300), appendix A.1.6, eq. 20` (rolled out under the equation by default) |

Highlights worth marking on beats (disjoint substrings, so they can share one item): the advantage (circle, red), the KL
coefficient (marker, yellow), the score function (circle, pink). Order used in the test: advantage, KL, score (the reading order of the bracket, then the tail).

### A.3 Engine change (one line, additive, guarded)
`render/video/fx/equations.js`, line 30:
`const EFILES = ['research/rev2/equations.json', 'research/rev2/equations-extra.json', 'research/rev3/equations-rev3.json'];`
How the files are fetched: `find(ref)` walks EFILES in order (the first file holding the id wins, so no rev2 id can be shadowed),
and for each file asks `K.exists(f)` (charts.js: it lists the folder through render.py's static server and checks for the
`href`), then `HP.assets.json(f)` inside a try/catch. A missing file is skipped. Tested: with `research/rev3/` moved away an
equation with an unknown ref gives the normal "ref not in ..." WARN and two 404 console lines (the folder listing), no error; with the file present, no noise.
`regress.py compare long2` = 16 frames, worst mean |diff| 0.0000; `short2` = 12 frames, 0.0000 (against the snapshot after the arrow fix).

### A.4 Proof it renders: `render/video/edl/test-grpo-grad.json`
Modelled on long2's `eq-grpo` (same card, label and cite chips, pencil mode, rows on beats) over the real `v-racks` footage
(`v-racks` is the long cut's own cache, its item JSON identical to long3's; `t-racks-b` / `t-racks-c` are two more 16 MB copies of the same window. `python3 render/video/prep_clips.py test-grpo-grad` is safe: it reports all three as cached.)
Edit time = song - 6.10 as in long3. Stills (scratch `stills/`): `grad3-end.png`, `grad4-end.png`, `grad5-end.png` (finished, with the safe-zone guides),
`grad3-sheet.png` (the 3-row build, 8 frames). Read by eye: the rows draw one per beat, the three marks land on their beats, the cite is readable, nothing is clipped.

Row splits at 1080 px wide (measured with MathJax at 48 px em, then the live page; margins = glyph box over the whole life of
the item including drift, jump, sway and float):

| rows | split | width at 48 px em | em px to fit 880 wide | glyph margins measured (L / R) | verdict |
|---|---|---|---|---|---|
| 2 (the paper's) | 2 | 1675 | 25 | n/a | too small, reject |
| **3** (`tex`) | E-line / sums + bracket / score | 1048 (rows 1 and 2 are the widest) | **40.3** | 82 / 77 | **recommended**: h 325 at 48 px (about 270 px on the page); coverage.py: 0 safe-zone flags |
| **4** (`stacked4`) | `grad J =` / E[..] / sums + bracket / score | 988 | **42.7** | 80 / 78 | fits, bigger glyphs, a lone `grad J(theta) =` row; 0 safe-zone flags |
| 5 (`stacked5`) | adds a split of the sums from the bracket | 724 | 60 | 80 / 72 | outside the 2-4 brief; cite hits the right rail (flagged) |

**Gotcha found while testing (matters for the body pass):** the engine's default `drift` (1.05) and `pulseAmt` (1.035) push a
maxW 900 equation to about 975 px wide at the peak, so rev2's `maxW 1000` item (long2 `eq-grpo`) reached x = -3..1083 when it was on a pulse beat.
Use `maxW 880`, card `pad 18-24`, `drift 1.02`, `pulseAmt 1.02` (then em = 40.3 px at 3 rows, peak glyph width 920, card inside x 60-1014). The pulse flash
defaults to yellow on a dark theme, which is unreadable on the cream card: `flashColor: "#FF2E88"`.

### A.5 Paste-ready replacement for long3's `eq-grpo` (keep the id: `tr-ch-zoom72` and `tr-refrain-in` name it)
```json
{"id":"eq-grpo","type":"equation","t0":"hb:72","t1":"hb:80","ref":"grpo-grad","drop":"hb:72","mode":"pencil",
 "rows":["hb:72","hb:72.75","hb:73.5"],"cx":540,"cy":600,"px":48,"maxW":880,
 "card":{"color":"#FBF6EC","pad":18,"rot":-1.2,"lead":0.12},
 "label":{"text":"GRPO: the policy gradient itself","at":"hb:72","per":0.06,"font":{"size":40},"gap":50,"color":"#FBF6EC","bg":{"color":"#0E0D12","pad":12}},
 "cite":{"at":"hb:74.25","px":24,"color":"#FBF6EC","bg":{"color":"#0E0D12","pad":10}},
 "hl":[{"from":"adv_term","at":"hb:75","style":"circle","color":"#B31B1B","width":9,"padX":24,"padY":28},
       {"from":"highlight","at":"hb:76.5","style":"marker","color":"#F2C300","ink":"#15131F"},
       {"from":"score_term","at":"hb:77.5","style":"circle","color":"#FF2E88","width":9,"padX":30,"padY":26}],
 "pulse":{"from":"hb:78.5","to":"hb:79.75","every":0.25},"theme":"dark","exit":"cut","color":"#15131F","penColor":"#2A2832",
 "drift":1.02,"pulseAmt":1.02,"flashColor":"#FF2E88"}
```
The label text is an editor's choice (it states nothing the paper does not: the gradient is the whole payload). The long2 label ("each answer is scored against its group") also still holds for the advantage term.
For the 4-row variant add `"form":"stacked4"` and `"rows":["hb:72","hb:72.75","hb:73.5","hb:74.25"]` (cite then at hb:75, marks one beat later).

---------------------------------------------------------------------------------------------------------------------------

## B. Inventory of every formula in long3 and short3

Edit time long = song - 6.10; the short's first segment is song 6.10 -> 26.477 (edit 0 -> 20.377), the second song 65.188 -> 80.4 (edit - 44.811).

| id | cut | type | window (beats) | edit s | song s | content | decision |
|---|---|---|---|---|---|---|---|
| eq-superpose | long, short | equation | hb:12-16 (short: hb:12-edit 20.923) | 18.94-20.87 | 25.04-26.97 | `superposition` (Elhage et al.), `form latex` | **remove** (the intro editor's: change 2) |
| eq-dpo | long | equation | hb:28.5-32 | 26.92-28.62 | 33.02-34.72 | `dpo`, label "DPO: learn from which answer people preferred" | **remove** (slot 1) |
| **eq-attn** | long | equation | hb:32.5-35.75 | 28.86-30.43 | 34.96-36.53 | `attention`, Vaswani et al. 2017, eq. 1 (cite = the record's default), label "each word decides which words matter", over the tower | **KEEP, unchanged** |
| eq-ntp | long | equation | hb:40-44 | 32.49-34.42 | 38.59-40.52 | `ntp-ce`, label "the loss: ..." | **remove** (slot 2) |
| eq-upd | long | equation | hb:41-44 | 32.97-34.42 | 39.07-40.52 | `gd-update`, label "gradient descent: ..." | **remove** (slot 2) |
| eq-grpo | long | equation | hb:72-80 | 47.97-51.84 | 54.07-57.94 | `grpo` objective (eq. 3) over `v-racks` | **replace** by the gradient (A.5) |
| eq-adv | long | equation | hb:84-88 | 53.78-55.71 | 59.88-61.81 | `grpo` form `advantage` (sec. 4.1.2) | **remove** (slot 3) |

The short has exactly one formula (`eq-superpose`) and no GRPO or attention, so after the intro pass it has none; nothing in the short needs the new gradient.

Looked at and **not formulas, keep**: the 3D tower's labels (`v1-tower`: tokens "AI that builds better", `attention . 4 heads`, `MLP`, `residual stream`, the predicted
token; words only, no TeX; `netviz.js` only typesets for the MLP kind); the chart numbers (`chart-dc` annotate "Colossus 2: 946 MW", `chart-gw` "13.8 GW across 93 sites", both cited data labels); loop node labels;
the doubling stamps `one two four eight 16 32` (Amodei's count, speech captions); percentages inside quotes. No caption in either cut contains TeX or an equation.

### B.1 References to the removed equation ids that must be patched in the same pass (found by grep; the engine only WARNs "no item", and the transition then runs without it)
| transition | at | field | now | change to |
|---|---|---|---|---|
| `tr-v1-fold` (zone fold, `rect [40,960,1000,620]`) | hb:28.5 | `in` | `["eq-dpo"]` | the slot-1 item (see C; if the card starts above y 960, widen the rect upward) |
| `tr-v1-particles` | hb:32 | `out` | `["eq-dpo","p-pause","pile-syco"]` | replace `eq-dpo` by the slot-1 item |
| `tr-v1-whip` | hb:40 | `in` | `["eq-ntp"]` | the slot-2 item |
| `tr-v1-wipe` | hb:44 | `out` | `[..,"eq-ntp","eq-upd",..]` | drop both, add the slot-2 item |
| `tr-ch-zoom72` | hb:72 | `in` | `["v-racks","eq-grpo"]` | nothing if the gradient keeps the id `eq-grpo` |
| `tr-refrain-in` | hb:80 | `out` | `[..,"eq-grpo",..]` | nothing if the id is kept |
| `tr-rf-fold` (zone fold, `rect [60,1130,960,450]`) | hb:84 | `in` | `["eq-adv"]` | the slot-3 item |
| `tr-rf-shatter` (same rect) | hb:88 | `out` | `["eq-adv"]` | the slot-3 item |
| `tr-riff-break` (long) | hb:16 | `out` | `[..,"eq-superpose"]` | the intro editor's |
| `tr-entrance-short` (short) | hb:95 | `out` | `[..,"eq-superpose",..]` | the intro editor's |

Nothing else names an equation (no `fx`, `beatfx`, `mix` or item field does).

---------------------------------------------------------------------------------------------------------------------------

## C. The freed slots

Slots 2 (eq-ntp + eq-upd) share one window, so there are three independent slots. All the on-screen facts below were read from
`render.py beats` strips and full-resolution stills of long3 with the six equations removed (scratch `stills/free-*.png`,
`sheet-noeq-*.png`). Lyrics are described, not quoted (the lyric notes are in `research/long/lyrics/`; no lyric ever goes on screen).
Transition notes in the EDL fix the timing of the sung words: "likes" at hb:28.5, "And they'd" at song 38.49, "'Cause" at song 40.40, "And I'm so tired" at 34.51.

### Slot 1: eq-dpo, hb:28.5-32 (edit 26.92-28.62, song 33.02-34.72)
- Lyric: the second half of the "caught up in the news / of who likes me and who hates you" line (research key `caught-up-in-news`: news flood, then
  the sycophancy feedback loop, thumbs-up/down, for "who likes me").
- On screen: Amodei's disc and karaoke until hb:29.5 (`p-amodei`, `kar-amodei`), the PauseAI UK protest disc `p-pause` (hb:28.9-32, centre 540,540, r 250), the TechCrunch
  sycophancy card `pile-syco` (lands hb:30, region y 1350-1560), pink splat bottom-left, paint-out layer. `tower-bg` / `v1-tower` arrive on hb:31.6 / 32 via particles.
- Free region: **x 60-1020, y 860-1340** (the DPO card sat at cy 1185, y ~950-1425, and overlapped the syco card). Before hb:29.75 the whole lower half (y 880-1560) is empty.
  The transition `tr-v1-fold` is zone-local on `rect [40,960,1000,620]`.
- Ranked ideas (all real, local, no download):
  1. **Gallup chart, "who hates you"** (chart `gallup-harm` in `research/rev2/graphs.json`; Bentley-Gallup, published 28 Jul 2026, survey 4-11 May 2026, n = 3,270, source line comes with the graph):
     share saying AI does more harm than good, all adults 40/31/31/39 % (2023-2026), ages 18-29 30/27/36/47 %. Not used as a chart in long3 (the same release is the screenshot `scr-gallup`,
     hb:75.82-80, so it becomes a callback; the editor may keep both). Pairs with the TechCrunch card (likes / hates). Animated on 8ths. **Rendered and read**: works above the green card; the callout wants one more nudge.
  2. **arXiv "Sycophantic AI Decreases Prosocial Intentions and Promotes Dependence"**, capture `arxiv-2025-10-01-sycophantic-ai` (captures.json; arXiv 2510.01395, 1 Oct 2025; unused). Rendered as a second card above `pile-syco`: reads, but the banner is thin (about 23 px type at 880 wide), so only as a stack partner. The lyric note's stat ("affirm users' actions 50% more than humans do") is not on this capture, do not put it on screen without a new capture.
  3. **NBC "Data center opponents have blocked or delayed projects worth nearly $130 billion in 2026"** (screens `economy-nbc_datacenter_opposition_130b`, 12 Jun 2026, q3, unused): organised public opposition for "hates you". Not rendered.
  (Rejected: the ElevenLabs v4 blind-preference chart in the deck assets, `work/rev2/voicedemo-elevenlabs-v4-preference-chart.png`: right idea (preference) but a product win, not an AI frustration.)
- Top pick, paste-ready (rendered in `_tmp-top`, scratch `stills/top.png`; give the transitions the new id):
```json
{"id":"chart-gallup","type":"chart","graph":"gallup-harm","t0":"hb:28.75","t1":"hb:32","x":195,"y":1075,"w":600,"h":165,
 "card":{"x":60,"y":860,"w":960,"h":475,"color":"#FBF6EC","rot":-0.6},"axesAt":"hb:28.9","titleAt":"hb:28.9","titlePx":40,"titleGap":185,
 "subAt":"hb:29.25","subPx":21,"subPer":0.03,"subW":820,"grow":["hb:29.5","hb:30","hb:30.5","hb:31"],"labels":"all","valuePx":36,
 "valueFmt":{"dec":0,"suffix":"%"},"yAxis":{"min":20,"max":50,"ticks":[20,30,40,50]},"color":"#2346FF","lineW":6,
 "annotate":[{"at":"hb:31","i":3,"text":"47% of 18-29s","dx":70,"dy":70,"w":170,"px":32,"lines":2,"hl":"47%","lead":0,"per":0.03}],
 "sourceAt":"hb:30.25","sourcePer":0.02,"sourcePx":19,"sourceW":860,"sourceY":1300,"sourceX":100,"splatColor":"#F2C300","theme":"light"}
```
  Caveats: the card's top (y 860) is above the fold rect (y 960), so set `tr-v1-fold` `rect` to `[40,850,1000,730]` (untested), or shrink the card; the first series (all adults) is blue, the second (18-29) takes the default colour and has no legend, which is why the callout names it.

### Slot 2: eq-ntp + eq-upd, hb:40-44 (edit 32.49-34.42, song 38.59-40.52; eq-upd from hb:41)
- Lyric: "And they'd all be so disappointed" (hb:40-43.8; "'Cause" lands at hb:43.8, the exploited pile follows at hb:43.75). Research key `exploited`
  (verse-1 line about disappointment and exploitation) and `quit-my-job` (resignations).
- On screen: the 3D tower `v1-tower` (hb:32-44: forward pass done by hb:36, **backprop on 8ths hb:40-43**, pull-back at hb:43.25) over the muted Stargate Abilene b-roll `tower-bg`; Coxon's disc/caption and `pile-jobs` end at hb:40.5; `pile-disappoint`
  (TechCrunch "OpenAI safety employee resigns, claiming the company's 'culture is broken'", Oct 3 2026, + Common Dreams "Looks Like They're Firing Whistleblowers", Oct 1 2026; hb:40.25-44, y 1120-1500); the wipe to `pile-exploit` at hb:44.
  The equation cards (ntp at y ~400, upd at y ~770, both dark, 900 wide) sat **on top of the tower**.
- Free region: **the top band x 60-1020, y 330-700** (where eq-ntp sat) and y 700-1000 on the right; there is no empty dark space, the tower fills the frame, so anything added covers the tower as the cards did.
- Ranked ideas:
  1. **Jan Leike's resignation post**, screens `xrisk-rev2-x-leike-2024-05-17-breaking-point` (X @janleike, 17 May 2024, verified, q3; **unused in long3**): "I joined because I thought OpenAI would be the best place in the world to do this research ... until we finally reached a breaking point."
     The canonical "disappointed" resignation, continuing the arc TechCrunch Oct 2026 -> Common Dreams Oct 2026 -> Leike 2024 as the origin. The other X posts on the same story (`xrisk-rev2-x-casar-...`, Quartz `frontier-rev2-quartz_oct1_headline`) repeat the Common Dreams card, so they are redundant. **Rendered and read**: big, legible, the marker lands on the breaking-point phrase, sits over the tower top as the eq cards did.
  2. **Loss-landscape figure**, deck asset `/home/user/poster/ai-safety-presentation/assets/research/splash/gd-lossland-li2018-noshortLogRotatedLower.png` (Li, Xu, Taylor, Studer, Goldstein, "Visualizing the Loss Landscape of Neural Nets", arXiv:1712.09913, Fig. 1(a); older than the 2024-2026 preference, so "sparingly"):
     a real picture of what the removed backprop equations meant, a rugged loss surface with the narrow blue minimum. `image` item (model: `spit1`), frame `{x:430,y:330,w:590,h:490,rot:3}`. **Rendered**: striking, but the source line landed on the busy tower and was unreadable; give it `srcPos` {x, y} on a dark chip.
  3. **Let the net own the frame** (no new item): the tower's backprop hb:40-43 and the pull-back were designed with the equation cards as captions; with them gone the choreography that already exists (`v1-tower`, the `ATTENTION . 4 HEADS` / `RESIDUAL STREAM` tags) reads on its own. Cheapest, but it adds nothing "else".
- Top pick, paste-ready (rendered; transitions: `tr-v1-whip` `in` and `tr-v1-wipe` `out` take `pile-leike`):
```json
{"id":"pile-leike","type":"screens","t0":"hb:40","t1":"hb:44","region":{"x0":60,"y0":330,"x1":1020,"y1":700},"w":860,
 "shots":[{"id":"xrisk-rev2-x-leike-2024-05-17-breaking-point","at":"hb:40","entry":"slam","hlAt":"hb:41.25","crop":[0,290,1096,720]}],
 "push":{"at":"hb:41.5","z":1.12,"dur":0.3,"to":[540,520]},"emph":[{"style":"lift","at":"hb:41.5"}],"out":"cut","chips":"all"}
```
  Needs the shot prepared: `python3 render/video/prep_clips.py long3` (copies it to `cache/screens/`; I already prepared this one, `security-astra-9to5` and `arxiv-2025-10-01-sycophantic-ai` there).

### Slot 3: eq-adv, hb:84-88 (edit 53.78-55.71, song 59.88-61.81)
- Lyric: "Is the kind of things I get" (research key `tried-my-best`: "All I did was try my best / this the kind of thanks I get", echoed by AI that was trained to succeed and cheats, blackmails or breaks out); "Unrelentlessly upset" follows at hb:87.9 (`pile-upset`).
- On screen: the self-improvement loop `loop-a` (c 540,760, r 250, title at y 270; laps every 2 bars then every bar), the 60 Minutes disc `cp-thanks` (centre of the loop, collapses at hb:87.62), the Kandinsky river `kand-a` (small vectors), cream ground.
  `pile-try` (the OpenAI alignment-blog "agent used DNS" and CSO "six new misalignment incidents" cards) leaves at hb:84; `pile-upset` (TNW) lands at hb:87.9.
- Free region: **the bottom zone x 60-1020, y 1130-1580** (loop-a's own note reserves it "so the bottom zone can carry the facts"; eq-adv sat at cy 1345). The zone-local fold/shatter use `rect [60,1130,960,450]`, so the item must stay inside it.
- Ranked ideas:
  1. **9to5Google, "OpenAI cancels GPT-6.1 Astra release over misbehavior & safety concerns"**, screens `security-astra-9to5` (28 Sep 2026, verified, q3, **unused in long3**): the lab's reward for the model's best effort is cancellation; a clean legible card in the same pile rhythm as its neighbours. **Rendered and read**: the highlight on "cancels GPT-6.1 Astra release over misbehavior & safety concerns" and the circle land on the beats.
  2. **Anthropic's blackmail-rates figure**, deck asset `.../assets/research/security/agentic-misalignment-fig1-blackmail-rates.png` (Anthropic, "Agentic misalignment: How LLMs could be insider threats", 20 Jun 2025; the lyric note's "96%": Claude Opus 4 0.96, Gemini-2.5-Pro 0.95, ...): a data figure for variety (not another headline).
     `image` item (model: `spit1`), frame `{x:60,y:1150,w:960,h:409}` fits the zone exactly (4096x1746). **Rendered**: title and bar lengths read, bar labels and values do not (too small at 960 px), and the source line was clipped at the right (shorten `outlet`). Not in long3 now (the 96% card was in the r7 cuts).
  3. **Specification gaming**: b-roll `coastrunners-specification-gaming` (Google DeepMind blog Fig. 4 / OpenAI 2016, `research/theory/specgaming-coastrunners.gif`) is the exact picture of reward hacking, but long3 already uses it at hb:44.25-48 (`p-coast`, "exploited"); repeating it would double the shot. Alternative stills: `research/theory/specgaming-collage-still.png` (DeepMind collage), `work/rev2/cad-cadbench-v3-reward-hacking.png` (a text excerpt).
- Top pick, paste-ready (rendered; transitions: `tr-rf-fold` `in` and `tr-rf-shatter` `out` take `pile-astra`):
```json
{"id":"pile-astra","type":"screens","t0":"hb:84","t1":"hb:88","region":{"x0":60,"y0":1150,"x1":1020,"y1":1570},"w":900,
 "shots":[{"id":"security-astra-9to5","at":"hb:84","entry":"slam","hlAt":"hb:85.5"}],
 "push":{"at":"hb:85.5","z":1.2,"dur":0.3,"shot":0,"to":[540,1350]},
 "emph":[{"style":"lift","at":"hb:85.5","shot":0},{"style":"circle","at":"hb:86.5","shot":0,"color":"#B31B1B","dur":0.225}],
 "out":"cut","theme":"light","chips":"all"}
```

Note for the editor: all three picks are "real screenshot / cited chart" items, so rev2's rules hold (real screens, cited data, imagery in every frame). Each pick is wired to its slot's transitions only by the id (B.1).

---------------------------------------------------------------------------------------------------------------------------

## D. Checks run, and things to know
- `regress.py compare long2` and `short2` against the post-arrow-fix snapshot: 0.0000 on all 16 + 12 frames (the engine diff is the EFILES line).
- `coverage.py test-grpo-grad`: 0 texts without a reveal, 0 lyric overlaps, 0 stamp violations; the only flags are "no imagery" in the empty stretch before the racks (a test EDL) and the 5-row variant's cite on the right rail.
- Temp EDLs used for the slot renders (`_tmp-*.json`) are deleted; their image caches (`cache/img-*`) are deleted. Kept in `cache/screens/` (git-ignored copies of real screenshots, needed by the top picks): `xrisk-rev2-x-leike-2024-05-17-breaking-point.png`, `security-astra-9to5.png`, `arxiv-2025-10-01-sycophantic-ai.png` (and their entries in `cache/screens/index.json`).
- Rendering observation (not caused by this stage): twice a different cached screenshot logged `image cache/screens/<id>.png: could not load/decode` while the box was busy; the files are valid (PIL loads them) and the next run was clean. Worth a re-render if a card is missing in a full render.
- Unchanged and still true: `render/video/edl/make_*_rev3.py`, `rev3_intro.py` and `rev3_body.py` were not touched; `long3.json` / `short3.json` still equal rev2 apart from the name.
