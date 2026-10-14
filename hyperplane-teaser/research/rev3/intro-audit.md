> **WILLIAM FOLLOW-UP (14 Oct, overrides this audit):** "You also do this thing in the prelude where the video clips like 'pulse' zooming in and out I dislike this." Remove EVERY beat-locked zoom pulse in the prelude: the `punch` lists and their `shakes` on `altman` and `amodei`, the beatfx 'prelude' zoom pulses / camera punches (going with fx-prelude / fx-prelude-grid), and `pile-hf`'s scale `pulse` list (the cards may still land on the pulse; its single push-in at hb:-3 stays). At most a slow, steady, one-way push-in on a clip. See BUILD.md REVISION 3, change 1.

# Intro audit for BUILD.md REVISION 3, changes 1-3 (prelude, riff, arrows)

Stage: research/intro-audit (read-only on the project). Written 14 Oct 2026 for the intro editor, who implements `edl/rev3_intro.py`
`apply(edl, cut)` from this file alone. Everything below was measured on `long3.json` (= long2) and `short3.json` (= short2); the proposed
patch in section 5.10 was run in a scratch harness (the EDL dict is patched in memory and served to Chromium by a Playwright route, so no
project file was written). **No engine module needs to change**: every fix is an EDL edit.

Scratch (not in the project; deleted with the session): `/tmp/claude-0/-home-user/a99e0376-0534-5e3e-8b47-ccbc03821dfd/scratchpad/hp3/intro-audit/`
(`tools/intro_patch.py` is the tested patch, `tools/h.py` the harness, `out/*.jpg` the contact sheets, `frames/` per-frame thumbnails).

## 0. Decisions in one screen

| Question | Answer |
|---|---|
| What reads as "flashing" in the prelude | (1) 12 full-frame white bloom flashes from the two beat tracks `fx-prelude` / `fx-prelude-grid`, mean luminance +28 to +45 (of about 85) for 4 frames; (2) the 8-12 % zoom bounce of both talking-head clips on EVERY beat (`altman.pulses`, `amodei.pulses`); (3) 23 pencil ticks that change in the top-right strip; (4) 13 grain bursts; (5) 39 whole-frame camera zoom pulses (up to 2.1 %); (6) the one-frame white frame f393. |
| Extraneous symbols | the classifier sketch (`sketch`, `sketch-plane`, 19 `sketch-dot-*`), the pink splat `splat-open` (and its 8 px camera hit), the red nabla stamp `r2-stamp-breath`, the ticks above. |
| `frame-pencil` | NOT flashing (thin graphite outline, boils on twos, mean change 0.5/255). Keep. |
| Beat-locked camera punches | The beat-track ones (`fx-prelude*` cam = punch/zoom) DO read as a pulse: remove. The item `punch`/`shakes` on the two clips are small bar hits: removed in the recommended patch (tier 3, one line each, easy to keep). The headline pile's own landing punch/hit (`screens.js` slam) is content landing: keep. |
| What stays | word-lit captions, pencil underlines, the circle round "25%", the red marker chip, name/year chips, role lines, source lines, the Amodei sub-line, both clips with a slow push-in, the headline pile, `tr-wipe`, `tr-fold`, `tr-shatter`, `frame-pencil`, `grain-prelude`, `paper`. |
| Superposition fan | `kand-riff` preset move `superpose` (kandinsky.js `drawSuperpose`) + item `eq-superpose`; kill both, plus the `whip` at hb:11.5, the `thicken` at hb:12, the two `reframe` shots at hb:13/14 that were framed for it. |
| Large swimming arrows | `kand-riff` preset `river` (`vectors 26, size 2.3`). Remove ONLY the arrows with `preset.river.vectors = 0`; the streaks and ripples can stay. The beatfx 'arrow' stamps/pencil arrows of `fx-riff-b` are the only other large arrows (exclude with `no: ['stamp','scribble']`). The cover's `normal` piece stays. |
| Which arrows are the "small beautiful ones" | measured: only the instrumental's river (`kand-re`, default size 1, 7 vectors, arrows 58-94 px long) is small. `kand-a` and `kand-b` use size 2.0 (115-187 px, mostly hidden behind the loop). BUILD.md names kand-a; leave kand-a, kand-b AND kand-re untouched. |
| Old build William wants back | r7 short, edit 13.13-18.6: every piece lands FULLY FORMED, at its largest, on the beat frame (slam 1.3-3.2x down to 1 in 0.1 s), on clean cream, logo whole and still, one landing per beat from hb:0 to hb:10. rev2 replaced that with 0.2-0.32 s paint strokes, close-up zooms, a grey ghost aerial, splats, 3 extra yellow strokes, shards, footage in the discs, fluid colour, a 360 degree whip. |
| Recommended rev3 riff | `kand-riff` on `preset: hold` with an explicit cue map (5.2) and post-build moves (5.3). New style needed: none. |
| Conflict to decide | BUILD.md REV3-2 "clean cream" vs REV2 "imagery in every frame": coverage.py counts only an element of at least 12 % of the frame at opacity at least 0.5, so the discs never count and the Galaxy ghost was the only thing keeping hb:1.4-16 green. Tested fix: keep the ghost but only in the bottom 22 % (mask), t0 hb:1.4. Coverage probe: 0 uncovered frames, the build stays clean cream. Alternatives in 5.7. |

## 1. Method and evidence

- Every frame of the prelude (f0-f396) was rendered at full resolution (JPEG q95 capture, as the real render does) and diffed: whole-frame
  mean abs diff, 24x15 block diffs, mean luminance per frame. Flashes show as luminance spikes.
- Each suspect group was ablated one at a time (EDL edited in memory) at the 133 frames around the 21 `prelude_pulse` events, the 27 grid
  beats, the first frames and the drop: the pixels that change are that group's footprint (bounding boxes below).
- Camera: `HP.cam.at(t)` read for all 397 frames, with and without the groups.
- Riff: `render.py beats long3 --from 13 --to 20.95 --eighths` (two strips) and the r7 short at every frame 12.9-18.9 s.
- The proposed patch was then swept (prelude: all 397 frames; riff: f388-f631), the coverage probe (`HP.probe.frame`, same rule as
  check/coverage.py: area >= 12 %, opacity >= 0.5, `tr-*` excluded) run on f394-f630, and `rev2_parts.bad_refs` + the generator's id checks
  run on both patched EDLs (long3 and short3: no bad refs, no missing transition ids).
- Heads-up unrelated to this stage: loading long3 prints, intermittently, `WARN: image cache/screens/<some big screenshot>.png: could not
  load/decode` (seen for xrisk-rev2-cnn-2026-02-11-... in one run, capabilities-variety-suno-v6 in another; both files are valid PNGs).
  `render.py video` refuses to render when the page reports warnings (use `--allow-missing` after checking, or simply re-run).

## 2. A. The prelude (long edit 0 -> 13.132 = song 6.10 -> hb:0; the short is identical there)

`short3` carries the same ids (`fx-prelude`, `fx-prelude-grid`, `sketch*`, `splat-open`, `r2-stamp-breath`, `fx-drop-white`, clips with pulses);
the same patch applies to both cuts without change.

### 2.1 Inventory of every element that blinks, appears or changes, with the code that draws it

Frame regions are 1080x1920 px. "Edit s" are edit seconds (f = round(s*30)). Ablation = pixels that change when only that group is removed.

| # | Element | Ids | Drawn by | Region | Times | Class | Action |
|---|---|---|---|---|---|---|---|
| 1 | **Bloom flash** (white wash over everything) | beat tracks `fx-prelude`, `fx-prelude-grid` (`edl['beatfx']`), `pattern: "prelude"` | `fx/beatfx.js` `EFFECTS.flash` (l.172) -> `HP.flash` (`fx/core.js` l.305): opacity 0.5 x amp on bar/crash roles (amp = intensity 0.75-0.8 x 1.2 x 0.6 x (0.5+0.5 x pulse)), 0.28 x amp otherwise, decay 0.06 s; PATTERNS.prelude l.79 gives `bar`/`crash` the weight-2 `flash` | full frame | 12: edit 0.45, 1.28, 7.53, 8.11, 11.68, 12.04 (`fx-prelude`, on hits.json prelude_pulse) and 1.52, 3.46, 5.39, 7.33, 9.26, 11.20 (`fx-prelude-grid`, on the bars hb:-24, -20, -16, -12, -8, -4) | decorative, FLASHING | remove both tracks |
| 2 | **Pencil ticks** (check, cross, star, underline; they change on every pulse and sit 1 beat) | same two tracks | `EFFECTS.tick` l.221 (`PL().pencil`, boils on twos, 56-88 px, life 1 beat) on the shared `paint` layer, zone `[872,150,136,84]` set by `rev2_parts.r2_bfx` | ablation bbox x 832-1072, y 109-257 | 23 marks (11 + 12), one per pulse/beat | decorative | remove (same tracks) |
| 3 | **Grain bursts** | same | `EFFECTS.grain` l.174: speckle tile over the ground, alpha up to 0.8 x amp, decays in 0.16 s | full frame | 13 (4 + 9) | decorative | same |
| 4 | **Camera zoom pulses** | same | `EFFECTS.punch` l.162 (+3.5 % x amp, decay 0.1 s) and `EFFECTS.zoom` l.167 (anticipation 2.5 %) through `HP.cam` | whole frame, peak 1.9-2.1 % | 39 (6+6+13+14) | decorative pulse, reads as flashing | same. Without the tracks the camera is quiet except the fold (293-307, 2.9 %), the pile push (329-355, 3.6 %) and the drop (394-396) |
| 5 | **Classifier sketch**: orange/blue dots + pencil "plane" line with arrow beside the captions, one dot per beat | `sketch` (layer, canvas, song 6.1 -> hb:0), `sketch-plane` (pencil, 6 shapes, t1 hb:1.45), `sketch-dot-m26 ... sketch-dot-m4` (19 `inkstamp`s, layer `sketch`: 15 discs orange/blue 26-34 px, plus nabla at hb:-16 (red), checker -12 (cream), ring -8 (violet), square -4 (teal)); `rev2_parts.SKETCH_DOTS`, `prelude_riff()` | `fx/paint.js` `pencil` l.640, `inkstamp` l.649 | x 751-1028, y 1237-1468 | hb:-26 -> hb:1.45 (kept alive through the shatter) | decorative | delete the 21 items; also delete `sketch` and `r2-stamp-breath` from `tr-shatter.out` |
| 6 | **Pink paint dab behind the 2015 chip** + an 8 px camera hit on frame 0 | `splat-open` (splat, x 124 y 296 r 96, `#FF2E88`, dir -20, cullDur 0.6, `hit: 8`) | `paint.js` `splat` l.600; the hit is `core.js` l.365 (`d.hit`) | x 0-420, y 5-376 (37k px >10 levels on every frame to f77; residue until hb:-20) | edit 0 -> ~3.5 s | decorative | delete |
| 7 | **Red nabla stamp on the breath** | `r2-stamp-breath` (inkstamp, x 958 y 1188, size 120, rot 8, layer `own`) | `paint.js` `inkstamp` l.649 | x 898-1047, y 1112-1270 | hb:-1 -> 0 (f380-f392) | decorative | delete; remove from `tr-shatter.out` |
| 8 | **One-frame white flash** | `fx-drop-white` (`edl['fx']`, `flash` at song:19.1995, opacity 1.15, decay 0.007) | `core.js` flashes l.305-313 | full frame; f393 mean luminance 255 (+137) | edit 13.1 | decorative | delete the `fx` entry. f394 (the cream world, shards flying) then follows the pile directly |
| 9 | **Footage bounce**: the picture scales 8 % (12 % on bars) and springs back over 0.34-0.42 s on every beat | `altman.pulses` (13), `amodei.pulses` (13); built by `rev2_parts.prelude_kicks_r3` | `fx/legacy.js` ClipItem `pulses` l.277 + l.331 (`z` spring), inside the footage box y 364-1258 | box | every hb beat from hb:-27 to -8, plus 3 swells each | decorative pulse | remove the two `pulses` lists and give the clips a slow push-in (below) |
| 10 | Clip `punch` / `shakes` (bar hits on the clips) | `altman.punch` (hb:-24 x1.08 step, hb:-20 x1.03, song:10.04 x1.03), `altman.shakes` (6, 6, 11 px), `amodei.punch` (x1.04 at hb:-16, x1.06 step at hb:-12, x1.03 at song:14.23), `amodei.shakes` (5 hits, 4-7 px) | `legacy.js` l.273, 330; `core.js` l.367 (`HP.cam.hit`) | whole frame (shakes), footage (punch) | 3 + 5 bars/words | borderline | remove in the recommended patch (23 of the 49 shake frames); keep if William wants the tiny word hits |
| 11 | `frame-pencil` | pencil, rect 12,352 1056x916 + a 138 px underline stub, alpha 0.6, boil 2 | `paint.js` `pencil` | thin outline round the footage | hb:-27 -> -7 | footage frame | **keep** (see 2.3) |

Not decorative, kept (text-related or content): `altman`, `amodei` (stamp, caption `reveal: "sweep"`, `marks`: underlines "probably" and "most likely", the circle round
"25%" (`song:12.258`/`hb:-14`), underline "really, really badly", the `sub` line with the painted "75%", source lines); `pile-hf` (8 real
screenshots, `emph` lift/circle/marker on the Gizmodo phrase, chips); transitions `tr-wipe` (paint wipe at song 10.833), `tr-fold` (hb:-7),
`tr-shatter` (hb:0); `grain-prelude` (steady film grain 0.035, 10 Hz) and `paper` (paper tooth): quiet textures, not blinking.

### 2.2 The numbers behind "flashing"

- Baseline luminance jumps over +10 between consecutive frames (flash onsets): f14, 39, 46, 104, 140, 162, 220, 226, 244, 278, 290, 291, 303,
  326, 334, 336, 351, 362, 393. After the patch: f140 (`tr-wipe`), f290-f292 (`tr-fold` showing its lit paper back), f303, f326/f334/f341
  (white headline cards landing), f394 (the cut to the cream drop). Everything left is a transition or a content landing.
- Mean frame-to-frame change, f1-f290: 8.4 -> 3.5. Mean absolute luminance step per frame (whole prelude): 4.0 -> 1.4. Biggest step before
  the pile: 45 -> 23 (the wipe).
- Camera: frames with whole-frame zoom over 0.4 %: 150 -> 45 without the beat tracks (max 1.045 at the drop remains).
- Clip pulses: removing them alone changes 86 of the 133 sampled frames, mean abs diff up to 9 inside the footage box.

### 2.3 Verdicts

- **`frame-pencil`: not flashing.** It is a static 4 px graphite outline at alpha 0.6, redrawn with a new seed every 2 frames (`boil: 2`), so it
  shimmers by about 2 px at 15 Hz: ablation mean difference 0.5/255, at most 25k px (1.2 % of the frame) above 10 levels, nothing locked to the pulse. Keep it;
  if it ever bothers William set `"boil": 4` or `0`.
- **Beat-locked camera punches: yes where they come from the beat tracks** (items 1-4 above: a 1.5-2 % whole-frame pump on 39 beats on top of
  the flashes). The item-level hits (10) are 2-3 frame, 4-11 px bar jolts: not flashing, but they pulse on bars while the brief wants the
  prelude gentle, so the patch removes them and lets the push-ins carry the motion.
- Watch items NOT changed (content or transitions William asked to keep): the `tr-fold` flap shows cream paper over about 60 % of the frame for
  about 10 frames at hb:-7 (+33 luminance) and could read as a flash; the magenta bristle band that stays on the top card of the pile at
  hb:-4..-1 is the `paint` entry of shot `security-hf-header` (set `"entry": "drop"` on that shot if he calls it a stray mark); the pile's own
  beat kicks (`pile-hf.pulse`, `pulseAmt` 0.02 and `pulseRot` 1.4 degrees, 6 swells) stay (set `pulseAmt: 0.01, pulseRot: 0.6` to soften).

### 2.4 What to delete or disable (exact)

In `rev3_intro.apply` (both cuts):

1. `edl['beatfx']`: remove the entries with id `fx-prelude` and `fx-prelude-grid`.
2. `edl['items']`: remove `sketch`, `sketch-plane`, every id starting `sketch-dot-` (19), `splat-open`, `r2-stamp-breath`.
3. `edl['transitions']`: remove those ids from every `out`/`in` list (only `tr-shatter.out` lists `sketch` and `r2-stamp-breath`); the generator's
   `check()` asserts that every listed id exists.
4. `edl['fx']`: remove the entry with id `fx-drop-white`.
5. Items `altman` and `amodei`: delete the keys `pulses`, `punch`, `shakes`.
6. Replace the lost motion with slow push-ins (Altman had `zoom: [1.0, 1.0]`, i.e. nothing but the pulses): `altman.zoom = [1.0, 1.05]`,
   `altman.zoomEase = "lin"`; `amodei.zoom = [1.0, 1.06]`, `amodei.zoomEase = "lin"`. (`altman.snap {z 1.08, dur .25}`, the settle on frame 0,
   stays.) Captions keep lighting word by word (`reveal: "sweep"`), marks keep drawing.

Order does not matter. Do not touch `grain-prelude`, `paper`, `g-dark-prelude`, `frame-pencil`, `pile-hf`, `tr-wipe`, `tr-fold`, `tr-shatter`.

### 2.5 Verified result (patch of 5.10, prelude half, f0-f396)

Contact strips at every grid beat show: no doodles, no splat, no sketch, no bloom; the stamp + role line, word-lit caption with its pencil
underlines, the red chip, the "25%" circle, the sub-line, the source line and the frame outline are intact; the pile and the shatter unchanged.
Residual luminance events are the six transition/landing events listed in 2.2. Strips: `out/fin-beats-a.jpg`, `out/fin-beats-b.jpg` (scratch).

## 3. B. The riff's arrows and the superposition (long edit 13.132 -> 20.87, hb:0 -> hb:16)

### 3.1 The superposition burst (William: "weird polar coordinates like thing with the vectors all pointing out")

- `fx/kandinsky.js`: `PRESETS.riff` l.294 puts `{move:'superpose', at: B(12), to: B(15.75), n: 7, ...rel(o.superpose,B)}` (l.318); `MOVES.superpose`
  l.247 registers the overlay; `drawKand` l.594 calls `drawSuperpose` (l.692-730) after the pieces. It draws 7 feature vectors from the centre
  of the pink+black pair (radius 500 cover units x `reach` 1.22, so about 440 px, running off the frame), a boiling pencil unit circle,
  two interference ring sets, one vector lit per 16th, and (`flash: true`) a 2-frame recolour + bright ring on every beat.
- EDL: `kand-riff.preset.superpose = {at 12, to 15.75, r 500, reach 1.22, flash true, wK 1.3}`.
- Its equation: item `eq-superpose` (hb:12 -> hb:16 long, -> 20.923 short; Elhage et al. 2022, arXiv:2209.10652, "x' = ReLU(W^T W x + b)", cx 540, cy 330).
  It is also listed in `tr-riff-break.out`.
- Things built only to stage it: `whip` {at hb:11.5, deg 360, dur 0.5} (the whole art spins a full turn into the burst), `thicken` {at hb:12, k 2.5}
  (the band widens 2.5x for the river), `preset.reframe` shots at hb:13 and hb:14 (zoom 1.08, rot -2.5 / +2.5, focus on the fan), the
  `orbit` steps every 0.5 beat from hb:12.
- To kill it minimally: `kand-riff.drop = ['orbit', 'superpose']` (the `drop` list removes PRESET moves by name; `preset.superpose` can only
  override fields, it cannot disable), delete `eq-superpose`, remove it from `tr-riff-break.out`, delete the `whip` and `thicken` entries of
  `kand-riff.moves`, delete the two hb:13/14 reframe shots. The recommended patch replaces all of it (5.10).

### 3.2 The river and every instance of it

`MOVES.river` l.246 -> `drawBandExtras` l.613 -> `drawRiver` l.626-686. Streaks (`streaks`, default 54) and `ripple` lines are clipped to the band;
the swimming vectors (`vectors`, default 7) are drawn after `ctx.restore()`, are not clipped, comet-trail (`trail`) and one of them leaps out of
the band per beat. `size` multiplies length (80-130 units), shaft width (9-13) and head (2.6 x width). 1 cover unit = 0.72 px.

| Item (piece) | Edit / hb | Fields | Arrow size in px (length / shaft / head) | Verdict |
|---|---|---|---|---|
| `kand-riff` (band) | hb:8 -> 16 (`preset.river`) | `vectors 26, size 2.3, trail 1.6, stagger 0.25, lanes 100, flowK 1.6, ripple 8`, 8 colours; `thicken` 2.5x from hb:12 | **132-215 / 15-22 / 39-56**, with 1.6-length comet trails, 26 at once, one leaps 250 px per beat | the "large arrows": remove the arrows |
| `kand-a` (band, refrain) | hb:80.5 -> 100 | `vectors 14, size 2.0, trail 1.5, stagger 0.5, lanes 100, flowK 1.5, ripple 6`, 7 colours | 115-187 / 13-19 / 34-49, mostly behind the loop and the panels (see `out/rivers-end.jpg`) | leave |
| `kand-b` (band, hb:100.5 -> 104.5) | | same as kand-a (14, 2.0) | same | leave |
| `kand-re` (band, instrumental, final cover) | hb:116 -> 123 | defaults: `vectors 7, size 1, streaks 54, ripple 0`, default colours | **58-94 / 6.5-9.4 / 17-24** | the visibly SMALL arrows; leave |

So the arrows that really are small are kand-re's; BUILD.md assumed kand-a. Both are "at the end"; neither is to be touched, so the reading does
not change the work, but if William says "small ones" he most likely means the finale (size 1), and the riff's size 2.3 is 2.3x that.

### 3.3 Removing only the arrows (what to say to the engine)

`kand-riff.preset.river.vectors = 0` (`nv = m.vectors ?? 7`, so 0 draws none; the leap and trails are inside the vector loop). Rendered and
checked (`out/rivers-riff.jpg`): the band keeps its flowing cream/yellow streaks and 8 sine ripples, it reads as water. Recommendation: **keep
the streaks and ripples** (William disliked the arrows, not the river; it is the hyperplane-as-river idea from REV2) but **drop `thicken`**
(a 2.5x band with nothing in it is a yellow slab over the discs). Optional if the river looks empty on screen: the finale's own settings
(`vectors 7, size 1`) are what he called beautiful, but he said "get rid of those", so the default is none.

### 3.4 Other large arrows in the riff

- beatfx marks from `fx-riff` (hb:0-7.5) and `fx-riff-b` (hb:8-15.5): `stamp` can pick glyph `arrow` (90-150 px ink arrow) and `scribble` can pick
  kind `arrow` (110-190 px pencil arrow) (`beatfx.js` l.202-220); one dark arrow in the right margin near the target ring is visible at hb:8.5-11
  (`out/river-F-vs-patched.jpg`). Fix: `no: ['stamp','scribble']` on `fx-riff-b` (the recommended patch also drops `fx-riff`).
- The `r2-plane-0/1/2` strokes are yellow dry-brush sweeps, not arrows. The `normal` piece (the cover's normal vector, `draw` cue at hb:5.5) is part of
  the logo and stays. `v1-arrow-hinton` and the loop's redo icon are outside the riff.

## 4. C. The old build William wants back (`out/hyperplane-brutal-short-9x16.mp4`, edit 13.0-18.8)

Source of the choreography: `render/video/edl/short.json` item `logo-form` (the r7 short; it inherits `short-v1.json`'s `LOGO_CUES`), drawn by
`LogoItem` in `fx/legacy.js` (l.742-1000). Beat grid: the measured riff onsets `riff = [13.132, 13.643, 14.125, 14.612, 15.077, 15.57, 16.058,
16.539, 17.021, 17.52, 17.997, 18.48, 18.954, 19.442, 19.93, 20.411]`. Landing frame = first frame at/after the cue, read off the video frames
(frame i at t = i/30).

### 4.1 What lands on which beat and how (r7)

| Cue (r7 `cues`) | Beat | Style (legacy.js) | Scale at the landing frame -> rest | Landing frame (measured onset) | After the onset |
|---|---|---|---|---|---|
| plane (band) | 0 | slam: thickness x1.45 -> 1 in 0.1 s, the edge line is drawn at once; camera hit 20 px (decay .07); flash 0.8 (decay .012: f394 is nearly white) | | f394 (13.132) | +1 ms |
| pink | 0 | slam, `slamFrom` 1.3 | 1.3 -> 1 in 0.1 s | f394 | +1 ms |
| black | 0 | slam 1.3 | 1.3 -> 1 | f394 | +1 ms |
| dots (6 data points) | 0 (+0.02 s each) | burst out scattered, 2.6x, oBack over 0.2 s | | f394 | |
| smallO | 0.5 | slam 3.2 | 3.2 -> 1; hit 5 px | f402 (13.387) | +13 ms |
| core | 1 | slam 2.3 | 2.3 -> 1; hit 9 px | f410 (13.643) | +24 ms |
| sort (dots fly home) + blue | 2 | slam blue 1.9; dots oBack 0.5 s, 2.6x -> 1; hit 12 px | 1.9 -> 1 | f424 (14.125) | +8 ms |
| teal | 3 | slam 2.2; hit 6 | 2.2 -> 1 | f439 (14.612) | +21 ms |
| square | 4 | spinin: rotate -165 -> 15 deg, scale oBack, 0.36 s; hit 12 | | f453 (15.077) | +23 ms |
| target | 4.5 | rings pop (oBack, 0.24 s, 0.06 s apart) | | f460 | +10 ms |
| arc | 5 | draw on 0.34 s | | f468 | +30 ms |
| normal / margin | 5.5 / 5.75 | draw on 0.24 s | | f475 / f479 | +19 / +31 ms |
| checkerboard | 6 | 8 squares flip in (rotate 90 -> 0, oBack), 0.055 s apart | | f482 (16.058) | +9 ms |
| nabla | 7 | drop from -760 units, oBack 1.6, 0.3 s; hit 6 | | f497 (16.539) | +28 ms |
| wordmark | 8 | slam 1.32 -> 1 (oBack 1.5, 0.24 s), flash 0.22, hit 22 | 1.32 -> 1 (edges crop at the landing) | f511 (17.021) | +12 ms |
| crossbar tilt | 9 | skewY 0 -> -22 deg, oBack 2.2, 0.3 s; hit 7 | | f526 (17.52) | +13 ms |
| kicker | 10 | rise 36 px + fade 0.32 s | | f540 (17.997) | +3 ms |
| hold, beats 11-14.5 | | "rehits": a group bumps on each beat/8th (11 blue+teal+square x1.26; 12 pink+core x1.16; 12.5 dots+smallO x1.8; 13 blue+teal+target+square x1.28; 13.5 nabla+chk x1.3; 14 black+core+pink x1.16; 14.5 teal+smallO+dots+target x1.5, 0.16-0.18 s) + hits 5-8 px + a slow push 1.0 -> 1.035 from beat 10 | | | |

Whole-art pulse on every beat 0-15 (`pulse amp 0.009`, accents {0: 6, 1: 2, 2: 2.4, 8: 2.2, 11: 1.6, 12: 1.8, 13: 1.8, 14: 1.6, 15: 1.8}, decay 0.085 s).
Pixel check of the video (`out/r7-landings-a.jpg`): on each landing frame the piece is present at its largest, on the frame before it is absent.

### 4.2 Why it reads as "everything falling into place on the beat"

1. The whole 1500-unit cover is in frame the whole time (art y 400, scale 0.72); nothing crops it, no camera move changes what a landing means.
2. Clean cream `#F2EBDD`, nothing else: no footage, no splats, no stamps, no text, so every change on screen IS a landing.
3. One landing per beat from the downbeat to the kicker (hb:0, .5, 1, 2, 3, 4, 4.5, 5, 5.5, 5.75, 6, 7, 8, 9, 10): the eye is led shape by shape in
   the order of the logo's meaning (plane, classes, line work, title, kicker).
4. Each piece arrives FULLY FORMED at its largest size on the beat frame and then shrinks (the slam), so the beat frame is the impact, not the
   start of a stroke; the settle takes 3 frames. Nothing is "half drawn" on the beat.
5. Every landing is paired with a camera hit scaled to its weight (20 px on the downbeat, 22 on the title bar, 5-12 elsewhere) and a 1 % art kick.
6. The structure is still: pieces that have landed do not move until the build is done (hb:10); only then do the rehits start.

### 4.3 What the rev2 riff does instead (`long3`, hb:0-16; strips `out/riff2-a.png`, `out/riff2-b.png`)

| What hides or muddies the build | Where | Effect |
|---|---|---|
| `paint` cues (pink hb:.5 over 0.3 s, black hb:1 0.26, core 1.5 0.2, blue 2 0.3, teal 2.5 0.2, wordmark hb:8 0.32) | `PRESETS.riff` cues l.296-303 (the EDL has no `cues`) | on the beat frame only a sliver of stroke exists; the shape is complete 0.4-0.65 beat later |
| order and gaps | same | shapes finish at hb:5.5, hb:6-7 carry nothing, the wordmark waits to hb:8; r7 spread landings to hb:10 |
| `reframe` close-ups | `preset.reframe`: hb:5 (zoom 1.6 on the blue disc, to [560,900]), 6 (1.45 on pink), 7 (1.3, rot -3), 7.5 wide; hb:13, 14 (1.08, rot +-2.5) | the logo is cropped to one disc while it builds |
| `breathe` 3 % per bar + `artpulse` accents | preset | the art swells between downbeats; "still" is lost |
| `ghost-riff` (Galaxy Helios aerial, multiply 0.5, footage shows through the top 52 %, faint 58-82 %, shows again 90-100 %) | item, hb:-0.3 -> 16 | the cream is grey under the whole logo |
| splashes | `splat-drop` (pink, (860,1660) r180, 4 drips, to hb:6.75), `r2-spray-1` (orange (170,1440) r110, hb:1), `r2-spray-2` (pink (860,1330) r150, hb:2), `r2-burst-3` (orange (245,640) r90, hb:3, on the black disc), beat track `fx-riff` hb:0-7.5 on every beat and 8th (splat/stamp/scribble/droplets/tick/grain/tint/invert + punch/shake/snap/jolt/zoom/spin, and `jump`/`burst` impulses that lift every piece off its landing) | bottom-right and left of the frame fill with paint |
| three extra yellow strokes | `r2-plane-0/1/2` (widths 64/58/120, hb:1.75-2, alive to hb:12.3) | the plane looks like four stripes, the slam is lost |
| shards of the pile | `tr-shatter` at hb:0, `dur 1.75` beats, lead 0.2, window 19.063-19.909 (hb:-0.35 -> 1.4) | cover the plane/pink/black/smallO/core landings; grey back-of-paper polygons are still up at hb:1 |
| footage in the discs | `kc-pink-agents` from hb:0.75, `kc-blue-coxon` hb:3-8 with `grow` x1.6 (teal fades to 0 at hb:3.25), `kc-blue-dc` from hb:8 | the pink disc is a screenshot by the second landing; the teal landing is hidden |
| fluid colour | `fluid-riff` from hb:8 (`wobble 7`, marbling) | the wordmark lands as every shape starts to swirl and wobble |
| `invert` flash | beatfx riff pattern, bar role (seen as a negative frame at hb:8) | |
| whip + thicken + superposition | hb:11.5, 12, 12-15.75 | see 3.1 |

## 5. D. The recommended rev3 riff

### 5.1 Principle

Rebuild the r7 build on the rev2 engine, in the `kand` item (painted look kept), by switching `kand-riff` to `preset: hold` and writing the cues and
moves explicitly. Order of work in time: hb:0-10 build (nothing moves after landing), hb:10-16 hold (orbits, jumps, the r7 rehits, the river
water, fluid colour, a slow push). Footage stays in the discs and under the hold but never on top of the build.

### 5.2 Cue map for `kand-riff` (hb refs; the cue's `dur`/`scale` are kandinsky.js `cueOf` fields)

| hb | Piece | Style | Fields | Camera hit (`fx` shake, px / decay) | Landing frame |
|---|---|---|---|---|---|
| 0 | band | slam | dur .12, scale 1.3 | tr-shatter already shakes 16 px here | f394 |
| 0 | pink | slam | dur .10, scale 1.3 | | f394 |
| 0 | black | slam | dur .10, scale 1.3 | | f394 |
| 0 | dots | (special cue) | six data points burst out big (`dotScale 2.6`) | | f394 |
| 0.5 | smallO | slam | dur .10, scale 3.2 | 5 / .05 | f402 |
| 1 | core | slam | dur .10, scale 2.3 | 9 / .06 | f409 |
| 2 | blue | slam | dur .10, scale 1.9 | 12 / .06 | f423 |
| 2 | sort | (special) | the dots fly home | | f423 |
| 3 | teal | slam | dur .10, scale 2.2 | 6 / .06 | f438 |
| 4 | square | spinin | dur .36 | 12 / .07 | f453 |
| 4.5 | target | pop | dur .24 | | f460 |
| 5 | arc | draw | dur .34 (starts 1 frame early by design) | | f467 |
| 5.5 | normal | draw | dur .24 | | f474 |
| 5.75 | margin | draw | dur .24 | | f478 |
| 6 | chk | flip | dur .18 | | f482 |
| 7 | nabla | drop | dur .30 | 6 / .11 | f496 |
| 8 | wm | slam | dur .24, scale 1.32 | 22 / .11 | f511 |
| 9 | tilt | (special) | the H crossbar skews to -22 deg | 7 / .11 | f525 |
| 10 | kick | rise | dur .30 | | f540 |

All landings are on `hb:` refs (the project's beat grid). They differ from r7's measured onsets (`riff` grid) by 0-33 ms (the regression grid
runs about 21 ms ahead of the attacks): hb lands at most one frame earlier than r7 did (f409 vs f410, f423 vs f424, f438 vs f439, f467 vs f468,
f474 vs f475, f478 vs f479, f496 vs f497, f525 vs f526). To reproduce r7 exactly add `"grids": {"riff": [13.132, 13.643, 14.125, 14.612, 15.077,
15.57, 16.058, 16.539, 17.021, 17.52, 17.997, 18.48, 18.954, 19.442, 19.93, 20.411]}` at EDL top level and write `riff:k` instead of `hb:k` in the cues.
Measured per-beat change in the final patched riff (mean abs diff, whole frame, landing frame vs the frame before; typical frame-to-frame change 2-4):
hb:0 87 (the cut to cream), 1 10.6, 2 19.6, 3 7.7, 4 13.3, 5 5.1 (a thin arc draws on), 6 6.8, 7 11.5, 8 26.0, 9 13.5, 10 7.6, 11 21.9, 12 21.7, 13 22.4,
14 23.4, 15 23.2: no whole beat is quiet; the 8ths without a cue (1.5, 2.5, 3.5, 6.5, 7.5, 10.5) sit at 1.5-4.6 and carry only the art kick.

### 5.3 After the build (hb:10.5 -> 16)

- Rehits (r7): `bump` pieces on hb:11 (blue, teal, square x1.26), 12 (pink, core x1.16), 12.5 (dots + smallO x1.8), 13 (blue, teal, target, square
  x1.28), 13.5 (nabla, chk x1.3), 14 (black, core, pink x1.16), 14.5 (teal, smallO, target, dots x1.5).
- Orbits (REV2 idea kept, after the build): pink+black about their common centre 45 degrees per beat on hb:11..15 (`turn: false`, discs stay
  upright), core about black (`k -2`), teal about blue; `spin` square hb:12, 14, chk hb:13 (and 15), `jump` dots hb:13, smallO+target hb:15.
- River water: `river {from hb:10.5, to hb:16, vectors 0, streaks 54, flowK 1.6, ripple 8, lanes 100}`, no `thicken`.
- `artpulse` (r7 accents), slow `push` 1.0 -> 1.035 from hb:10, camera hits 5/8/6/5 px on hb:11/12/13/14.
- Fluid colour after the kicker: `fluid-riff.t0 = hb:10.5` (was hb:8).
- Beat track `fx-riff` (hb:0-7.5) removed; `fx-riff-b` from hb:11 with `no: ['stamp','scribble','invert','jump','burst','tint']`: only margin splats,
  droplets, grain, ticks and camera moves remain.
- Break into verse 1 unchanged: the move `break {at hb:99, hide [pink, band], hideAt hb:16}` stays (long only), `tr-riff-break` unchanged.

### 5.4 Keep, retime or cut (rev2 riff elements)

| Element | Decision |
|---|---|
| plane/pink/black slam, discs/lines landing | KEEP the idea, retime to the cue map (paint -> slam) |
| `orbit` pink/black/core/teal | KEEP, retime to start hb:11 (was hb:4) and run per beat |
| `jump`, `spin`, `bump` rehits | KEEP, only after hb:11 (r7 rehits + rev2 jumps/spins) |
| `kc-blue-coxon` (hb:3-8, frozen at song 22.98), `voice-coxon`, `kar-coxon`, `coxon-stamp`, `credit-coxon` | KEEP exactly |
| `grow` of the blue disc | RETIME/soften: hb:4 -> 7.75, x1.3, dx -40, dy -30 (was x1.6 from hb:3.25 with the teal faded out); the teal stays |
| `kc-pink-agents` | RETIME: t0 hb:2 (a disc shows its flat colour for >= 1 beat first), speed recomputed so it still reaches source 75.21 at the end: long `3.21 / (20.8979 - 14.0997) = 0.4722`, short `3.21 / (20.923 - 14.0997) = 0.4704`; re-run `prep_clips.py` |
| `kc-blue-dc` (data hall from hb:8) | KEEP |
| `fluid-riff` | RETIME to hb:10.5 |
| `ghost-riff` | RETIME + RESHAPE: t0 hb:1.4 (the shatter is over), entry fade at hb:1.4, `alpha 0.55`, `mask: linear-gradient(to bottom, transparent 0%, transparent 74%, #000 79%, #000 100%)` (bottom 22 % only); remove it from `tr-shatter.in` |
| `riff-credit` text "AGENTS' LAST EXAM 2026 · NVIDIA 2025 · GALAXY 2026" | KEEP while any Galaxy footage is on screen; if you drop the ghost entirely, remove "GALAXY 2026" |
| `reframe`, `breathe`, `whip`, `thicken`, `swing` | CUT (preset `hold` has none of them) |
| `superpose`, `eq-superpose` | CUT |
| river arrows | CUT (`vectors 0`); streaks + ripples KEEP from hb:10.5 |
| `splat-drop`, `r2-spray-1/2`, `r2-burst-3`, `r2-plane-0/1/2` | CUT |
| `fx-riff` | CUT; `fx-riff-b` KEEP from hb:11 with `no` list above |
| `fx-riff-punch3` (5 % punch at hb:3) | CUT (replaced by the per-beat hits) |
| flash at hb:0 and hb:8 (r7 had 0.8 and 0.22) | NOT restored (REV3-1 dislikes flashes); the hits carry the beat. Add `{"fx":"flash","on":["hb:8"],"opacity":0.22,"decay":0.05}` if William asks |
| wordmark slam scale | 1.32 as r7 (the landing frame crops the word at both edges, as in the old build); use 1.12-1.2 if he minds |

### 5.5 What fills hb:12-16 without the superposition

The same beat-by-beat layering as r7, stacked: every beat has an orbit step of the discs, a different group bump, a camera hit and a whole-art
kick (hb:11-15); 8ths carry the `bump` of the small pieces (12.5, 13.5, 14.5); the river water flows on the band; fluid colour swirls the
discs without footage; the data-hall footage plays in the blue disc, the agent wall in the pink disc; margin splats/droplets arrive from
`fx-riff-b`; the Galaxy aerial runs in the bottom strip. No new asset, no whip. Frames hb:11-15: `out/final-riff-beats.jpg` (scratch).

### 5.6 Coxon

Unchanged and verified in frames: `voice-coxon` (song 21.20-23.15 = hb:4.07-8.10, source 452.42-454.37, "…restarted the thing, and it did it again."), `kar-coxon`
(top strip y 300, word-lit, ends `blow` at hb:8.75), `coxon-stamp` (2026, Jacob Coxon, on OpenAI's escaped agent), `kc-blue-coxon` in the blue disc from hb:3
(lands hb:2, so the disc is blue for one beat), frozen on source 454.20 so his face holds to the title downbeat. In the recommended patch his disc
grows x1.3 between hb:4 and hb:7.75 and is not cropped. The karaoke sits at y 262-480, above the pink disc (top edge about y 508): no overlap.

### 5.7 Footage vs clean cream (the one real conflict)

`coverage.py` (and `HP.probe`) count an element only if its visible area is at least 12 % of the frame and its opacity at least 0.5; `tr-*` overlays
never count. A disc (r 122-173 px) is 3-6 %, so kandclips never count and, in rev2, `ghost-riff` alone kept hb:1.4-16 covered. Measured on f394-f630:

| Variant | Uncovered frames (coverage rule) | Look |
|---|---|---|
| rev2 (ghost full frame, multiply .5) | 0 | grey under the whole logo |
| ghost removed | 106 of 118 sampled (f416-f626) | clean cream |
| ghost alpha 0.22 | 106 (opacity below 0.5 does not count) | |
| ghost from hb:10.4 (after the build) | f415-f544 (130 frames, hb:1.4-10.5) | clean build, grey from the kicker on |
| **ghost in the bottom 22 % only, t0 hb:1.4, alpha 0.55 (recommended)** | **0** | the build stays on clean cream; the footage fills the empty lower quarter (the wordmark ends at y 1316, the kicker at 1380; the credit line at 1468 sits at the start of the strip and stays legible) |

If William wants literally nothing but cream, drop the ghost and accept the coverage report for hb:1.4-16 (the report always exits 0).

### 5.8 The short (same riff to the splice)

Same patch (`cut == 'short'`): the song is cut at song 26.477 = just before hb:15 (26.490), so no ref at hb:15 or later may be written (the
generator's `check()` asserts `bad_refs` empty): orbits `hb:11..14`, no hb:15 spin/hit, `river.to` and `push.to` omitted (they default to the item's end
20.923), no `break` move, and the pink footage speed uses 20.923 (formula in 5.4). After the splice `tr-entrance-short` (iris, `hb:95`, lead 0.025) opens
the loop world out of the loop centre with a flash and a hit while the riff's logo stays behind it until the iris passes the frame edge (about 0.4 s);
the patched riff stays intact until then (checked at edit 20.35, 20.4, 20.5, 20.65). `short3` shares ids with `long3` for everything touched here, so
`rev3_intro.apply(edl, 'short')` uses the same function.

### 5.9 What the editor can set from the EDL (fx/kandinsky.js)

- `preset`: `{name: 'riff' | 'assemble' | 'hold', from: 'hb:i', river: {...}, superpose: {...}, reframe: false | [shots]}`; `river`, `superpose` and each
  reframe shot take numeric `from`/`to`/`at` as beats offset from `preset.from` (`rel()`, l.290) and override the move's fields; none of them can disable a move.
  `hold` returns no cues and no moves (l.349).
- `cues`: `{piece: time | {at, style, dur, lead, from, dist, scale, k}}` merged over the preset's (l.372-374); styles `cut, paint, draw, pop, slam, drop, spinin, flip, rise, fly`
  (`applyCue` l.417); `paint`/`draw` start 1 frame early (`lead`); special cues `dots`, `sort`, `tilt`, `kick`; `slam.scale` = start scale, `pop.k` = overshoot.
- `drop: [move names]` removes PRESET moves by name (l.378: `pre.moves.filter(m => !(d.drop||[]).includes(m.move))`); it never touches `moves`.
  Names: orbit, spin, jump, pulse, bump, swing, scatter, recolor, whip, push, breathe, reframe, artpulse, break, thicken, grow, river, superpose.
- `moves`: appended after the preset's; a `river` here adds a SECOND river unless the preset's is dropped.
- `dotScale` (6 data points' burst size), `look` (`paint` | `flat`), `ink`, `settle`, `pieces`, `avoid`.
- No engine change is needed: no new style. (If a literal fall is preferred for a disc, `drop` (-760 units, oBack 1.6) already exists and nabla uses it.)

### 5.10 Verified implementation (drop-in body for `rev3_intro.py`)

Tested against `long3.json` and `short3.json`: renders, 0 bad refs, 0 duplicate ids, 0 missing transition ids, imagery coverage 0 uncovered frames in hb:0-16.
Afterwards run `python3 render/video/prep_clips.py long3` (and short3): `kc-pink-agents` (t0, speed) and `ghost-riff` (t0, alpha) change.

```python
def _drop_ids(edl, ids=(), prefix=()):
    gone = lambda i: i in ids or any(i.startswith(p) for p in prefix)
    edl['items'] = [x for x in edl['items'] if not gone(x['id'])]
    for t in edl.get('transitions', []):
        for k in ('out', 'in'):
            if k in t: t[k] = [i for i in t[k] if not gone(i)]

def prelude(edl, cut):
    # change 1: every decorative / flashing element of song 6.10 -> hb:0
    edl['beatfx'] = [b for b in edl['beatfx'] if b['id'] not in ('fx-prelude', 'fx-prelude-grid')]
    _drop_ids(edl, ids=('sketch', 'sketch-plane', 'splat-open', 'r2-stamp-breath'), prefix=('sketch-dot-',))
    edl['fx'] = [f for f in edl['fx'] if f['id'] != 'fx-drop-white']
    for it in edl['items']:
        if it['id'] in ('altman', 'amodei'):
            for k in ('pulses', 'punch', 'shakes'): it.pop(k, None)
        if it['id'] == 'altman': it['zoom'] = [1.0, 1.05]; it['zoomEase'] = 'lin'
        if it['id'] == 'amodei': it['zoom'] = [1.0, 1.06]; it['zoomEase'] = 'lin'

HITS = [(0, 20, .07), (.5, 5, .05), (1, 9, .06), (2, 12, .06), (3, 6, .06), (4, 12, .07), (7, 6, .11), (8, 22, .11), (9, 7, .11),
        (11, 5, .06), (12, 8, .11), (13, 6, .06), (14, 5, .06)]    # r7 logo hits (beat, px, decay); beat 0 is tr-shatter's own 16 px shake

def riff(edl, cut):
    I = {x['id']: x for x in edl['items']}
    k = I['kand-riff']
    B = lambda x: f'hb:{x:g}'
    k['preset'] = {'name': 'hold', 'from': 'hb:0'}
    k.pop('drop', None)
    k['dotScale'] = 2.6
    k['cues'] = {
        'band': {'at': B(0), 'style': 'slam', 'dur': .12, 'scale': 1.3},
        'pink': {'at': B(0), 'style': 'slam', 'dur': .10, 'scale': 1.3},
        'black': {'at': B(0), 'style': 'slam', 'dur': .10, 'scale': 1.3},
        'dots': B(0),
        'smallO': {'at': B(.5), 'style': 'slam', 'dur': .10, 'scale': 3.2},
        'core': {'at': B(1), 'style': 'slam', 'dur': .10, 'scale': 2.3},
        'sort': B(2),
        'blue': {'at': B(2), 'style': 'slam', 'dur': .10, 'scale': 1.9},
        'teal': {'at': B(3), 'style': 'slam', 'dur': .10, 'scale': 2.2},
        'square': {'at': B(4), 'style': 'spinin', 'dur': .36},
        'target': {'at': B(4.5), 'style': 'pop', 'dur': .24},
        'arc': {'at': B(5), 'style': 'draw', 'dur': .34},
        'normal': {'at': B(5.5), 'style': 'draw', 'dur': .24},
        'margin': {'at': B(5.75), 'style': 'draw', 'dur': .24},
        'chk': {'at': B(6), 'style': 'flip', 'dur': .18},
        'nabla': {'at': B(7), 'style': 'drop', 'dur': .30},
        'wm': {'at': B(8), 'style': 'slam', 'dur': .24, 'scale': 1.32},
        'tilt': B(9),
        'kick': {'at': B(10), 'style': 'rise', 'dur': .30},
    }
    DOTS = ['d0', 'd1', 'd2', 'd3', 'd4', 'd5']
    LAST = 15 if cut == 'long' else 14    # the short is cut at song 26.477 (= hb:14.97): refs at hb:15 and later do not resolve there (bad_refs)
    bump = lambda ps, on, sc, dur: {'move': 'bump', 'pieces': ps, 'on': [B(x) for x in on], 'scale': sc, 'dur': dur}
    moves = [
        # the r7 "rehits" (one group of pieces bumps on each beat / 8th of the hold)
        bump(['blue', 'teal', 'square'], [11], 1.26, .18), bump(['pink', 'core'], [12], 1.16, .18), bump(DOTS + ['smallO'], [12.5], 1.8, .18),
        bump(['blue', 'teal', 'target', 'square'], [13], 1.28, .18), bump(['nabla', 'chk'], [13.5], 1.3, .16),
        bump(['black', 'core', 'pink'], [14], 1.16, .18), bump(['teal', 'smallO', 'target'] + DOTS, [14.5], 1.5, .16),
        # the rev2 orbits, once the build is done (upright discs)
        {'move': 'orbit', 'pieces': ['pink', 'black'], 'on': f'hb:11..{LAST}', 'stepDeg': 45, 'turn': False},
        {'move': 'orbit', 'pieces': ['core'], 'around': 'black', 'on': f'hb:11..{LAST}', 'stepDeg': 45, 'k': -2},
        {'move': 'orbit', 'pieces': ['teal'], 'around': 'blue', 'on': f'hb:11..{LAST}', 'stepDeg': 45},
        {'move': 'spin', 'pieces': ['square'], 'on': [B(12), B(14)], 'deg': 90},
        {'move': 'spin', 'pieces': ['chk'], 'on': [B(13)] + ([B(15)] if cut == 'long' else []), 'deg': 90},
        {'move': 'jump', 'pieces': DOTS, 'on': [B(13)], 'h': 70, 'stagger': .03},
        {'move': 'jump', 'pieces': ['smallO', 'target'], 'on': [B(15) if cut == 'long' else B(14.5)], 'h': 110, 'stagger': .06},
        # Coxon's disc reads a little bigger while he talks
        {'move': 'grow', 'pieces': ['blue'], 'from': B(4), 'to': B(7.75), 'scale': 1.3, 'dx': -40, 'dy': -30, 'dur': .25},
        {'move': 'river', 'from': B(10.5), **({'to': B(16)} if cut == 'long' else {}), 'vectors': 0, 'streaks': 54, 'flowK': 1.6, 'ripple': 8, 'lanes': 100},
        {'move': 'artpulse', 'on': 'hb:0..15', 'amp': .009, 'accents': {0: 6, 1: 2, 2: 2.4, 8: 2.2, 11: 1.6, 12: 1.8, 13: 1.8, 14: 1.6, 15: 1.8}},
        {'move': 'push', 'from': B(10), **({'to': B(16)} if cut == 'long' else {}), 'z': [1.0, 1.035]},
    ]
    if cut == 'long':
        moves.append({'move': 'break', 'at': 'hb:99', 'dur': 0.4, 'hide': ['pink', 'band'], 'hideAt': 'hb:16', 'stagger': 0.006})
    k['moves'] = moves
    # decorations that hid the build
    _drop_ids(edl, ids=('splat-drop', 'r2-spray-1', 'r2-spray-2', 'r2-burst-3', 'r2-plane-0', 'r2-plane-1', 'r2-plane-2', 'eq-superpose'))
    edl['beatfx'] = [b for b in edl['beatfx'] if b['id'] != 'fx-riff']
    for b in edl['beatfx']:
        if b['id'] == 'fx-riff-b':
            b['from'] = 'hb:11'; b['no'] = ['stamp', 'scribble', 'invert', 'jump', 'burst', 'tint']
    edl['fx'] = [f for f in edl['fx'] if f['id'] != 'fx-riff-punch3']
    for beat, amp, dec in HITS:
        if beat == 0: continue
        edl['fx'].append({'id': f'fx-riff-hit-{beat:g}', 'fx': 'shake', 'on': [B(beat)], 'amp': amp, 'decay': dec, 'barK': 1})
    # footage: the ghost aerial lives only in the bottom 22 % (the build stays on clean cream), from the end of the shatter; every disc shows
    # its flat colour for >= 1 beat before its footage fades in (pink lands hb:0 -> footage hb:2; blue lands hb:2 -> Coxon hb:3, unchanged)
    g = I['ghost-riff']; g['t0'] = 'hb:1.4'; g['entry'] = {'style': 'fade', 'at': 'hb:1.4', 'dur': .25}; g['alpha'] = 0.55
    g['mask'] = 'linear-gradient(to bottom, transparent 0%, transparent 74%, #000 79%, #000 100%)'
    for t in edl['transitions']:
        if t['id'] == 'tr-shatter': t['in'] = [i for i in t['in'] if i != 'ghost-riff']
    I['fluid-riff']['t0'] = 'hb:10.5'
    p = I['kc-pink-agents']; p['t0'] = 'hb:2'
    t_end = 20.8979 if cut == 'long' else 20.923   # edit time at which the footage must reach source 75.21 (long: hb:16.05; short: the riff's end)
    p['speed'] = round(3.21 / (t_end - (13.132 + 2 * 0.483871)), 4)

def apply(edl, cut):
    prelude(edl, cut); riff(edl, cut); return edl
```

Notes for the editor: (a) `_drop_ids` also strips ids from transition lists (needed for `sketch`, `r2-stamp-breath`, `eq-superpose`, `ghost-riff`). (b) `rev3_intro.apply`
runs after `make_*_rev2.build()`, so `kand-riff` already carries `drop: ['orbit']` and the moves list: the patch replaces both. (c) The old
`r2-plane-*`/`splat-drop` etc. exist in both cuts. (d) `ghost-riff.mask` and `.alpha` are existing item fields (the rev2 item already had both).

### 5.11 Verification commands for the editor

```
python3 render/video/edl/make_long_rev3.py && python3 render/video/edl/make_short_rev3.py      # check() asserts bad_refs and ids
python3 render/video/prep_clips.py long3 ; python3 render/video/prep_clips.py short3
python3 render/video/render.py beats long3 --from 13.0 --to 20.95 --eighths --cols 7 --thumb 280 --out /tmp/.../riff3.png
python3 render/video/render.py beats long3 --from 0 --to 13.2 --eighths --debug --out /tmp/.../prelude3.png
python3 render/video/check/coverage.py long3 --from 13 --to 21     # expect 0 uncovered frames
python3 render/video/check/beatcheck.py long3 --render --from 13 --to 21
python3 render/video/check/regress.py compare long2 /tmp/claude-0/-home-user/a99e0376-0534-5e3e-8b47-ccbc03821dfd/scratchpad/hp3/regress   # engine untouched: expect no diff
```
Landing frames to eyeball (frame i at t = i/30): hb:0 f394, .5 f402, 1 f409, 2 f423, 3 f438, 4 f453, 4.5 f460, 5 f467, 5.5 f474, 5.75 f478, 6 f482,
7 f496, 8 f511, 9 f525, 10 f540, 11 f554, 12 f569, 13 f583, 14 f598, 15 f612; the frame before each must not show the new piece.

## 6. Open questions and risks

1. Footage vs clean cream (5.7): the recommended bottom-strip ghost satisfies both rules; if William wants pure cream the coverage report will list hb:1.4-16.
2. "Small arrows at the end": BUILD.md says kand-a; the small ones on screen are kand-re (size 1). The patch touches neither, so no action, but the
   brief should be corrected so nobody later "tidies" kand-a to size 1.
3. Tier 3 (clip `punch`/`shakes` removal) is taste: they are tiny bar hits; restore with the original lists if the prelude feels too still after the
   slow push-ins.
4. The r7 flashes (hb:0 0.8, hb:8 0.22) are deliberately not restored; the first landing frame is therefore full contrast with the pile's shards
   still flying over it (grey back-of-paper polygons are gone by hb:1.4). If the first slam feels buried, shorten `tr-shatter` (`dur` 1.75 -> 1.25).
5. `wm` slam at 1.32 crops the wordmark on its landing frame (as in r7); the `kand` slam has no undershoot (legacy used oBack).
6. The hold from hb:11 has orbits + bumps + margin splats + the camera hits at once; I judged it busy but legible (strip `out/final-riff-beats.jpg`).
   If it is too much, drop `fx-riff-b` entirely or the jumps; the build itself is unaffected.
7. Intermittent "could not load/decode" page warnings on big screenshot PNGs (section 1): rerun, they are not related to this change.
