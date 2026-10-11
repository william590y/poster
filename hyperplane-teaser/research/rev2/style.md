# Rev2 style guide: handmade, painted, Kandinsky

Target: 1080x1920, 30 fps, ~124 BPM (beat 0.4839 s = 14.52 frames), cream `#F2EBDD`, ink `#15131F`, ground `#0E0D12`.
Written 10 Oct 2026. Everything marked "tested" was rendered and looked at; the code is in `research/rev2/style/proto/`.

## 0. Summary (read this if nothing else)

1. William's reference is almost certainly **"Claude Pop - I'm Upping My P(Doom)" by OtherReality** (YouTube `8j-hR4fJywU`, 22 Sep 2026, 2:37, painted with p5.js + p5.brush). It is the version in his deck (interlude slide). Its "paint" is **bristle brush-wipe transitions, watercolour blooms, ink outlines that boil at 12 Hz, and one real splatter moment** (a paint-pool plus ~10 flat droplets when the loss curve plunges, 11.6 to 12.1 s). It has no continuous splatter overlay. The other big version (mexicat, 27 Sep) is dark kinetic typography and has no paint at all. Section 1.
2. Build the look from **five layers**: (a) paper grain, (b) bristle-brush strokes (shapes, wipes, highlighter), (c) rough.js/pencil linework that boils on twos, (d) splatter accents on bar downbeats, (e) type with a touch of ink bleed. All tested, all deterministic functions of time. Reference implementation: `style/proto/paint.js`.
3. **Painting a real screenshot in** = 3 zig-zag bristle passes of width 92 px, 0.17 s each, staggered 0.07 s, with the screenshot revealed through a slightly narrower mask of the same strokes 0.05 s behind. It is done in 0.36 s (11 frames), inside one beat. The screenshot pixels are never altered. Section 4.1.
4. **Line boil on twos** = change the rough.js seed every 2 frames, cycling 3 variants (A A B B C C), 15 drawings/s. The reference does the same (its `jit()` is reseeded 12x/s at 24 fps). Section 4.2.
5. **Splatter** = a core blob (R 60 to 220 px) with 7 to 12 fingers with bulb tips, 30 to 70 satellite droplets (power-law sizes), 0 to 4 drips. It appears over 3 frames (35% / 80% / 108% / 100%), satellites fly ballistically over 4 frames, drips run for about 1 s. Bar downbeats get R 150+; beats 2 to 4 get R 60 to 110; no splat on every beat. Section 4.3.
6. **Palette is the cover's exact nine colours** (section 2) at the cover's ratios: about 71% cream, 10% ink, 8% yellow, 4% pink, 4% blue, at most 1% each of teal, orange, red, violet. Yellow, pink, orange and teal fail text contrast on cream (1.4 to 3.0:1): they are shapes, not type.
7. **The final cover hold must match `brand/hyperplane-cover-3000.png`**: fade paper grain, ink bleed, boil and any splatter to zero in the last 0.3 s. Section 6.
8. Costs (headless Chromium, software raster, 1080x1920): paper overlay 15 ms, one bristle stroke 10 to 25 ms, a 6-stroke screenshot reveal 80 ms (use tight scratch boxes, not full-frame), splat 2 to 6 ms, rough.js chart 8 ms, **ink-bleed SVG filter on a full frame 400+ ms (bake it once into a tight bitmap: 3.6 ms to bake, 1 ms per frame afterwards)**. Section 5.

## 1. The "upping my p(doom)" reference

### 1.1 Identification

The song is an AI-risk parody: lyrics by osmarks built on a verse and chorus by MusicPerson (Udio, Nov 2024); the "claude-pop" Suno version posted by deckard (@slimer48484) in Sep 2026 is the audio most videos use. In Sep 2026 about ten videos with that title or near it appeared (YouTube search "upping my p(doom)", checked 10 Oct 2026). The ones that matter:

| Version | Creator / URL | Date | Look | Notes |
|---|---|---|---|---|
| **Claude Pop - I'm Upping My P(Doom)** | OtherReality, https://www.youtube.com/watch?v=8j-hR4fJywU | 22 Sep 2026 (yt-dlp metadata); 2:37 (156.6 s); 178,048 views at fetch | **Hand-painted cartoon: ink outlines, watercolour washes, brush-wipe transitions, comic SFX words** | Code: https://github.com/JohnHeibel/PDoomVideo ("Source code for the Claude Opus 5.5 music video"; p5.js + p5.brush, frames painted in headless Chrome; 88 BPM). **This is the version in William's deck** (`assets/slides/capabilities/pdoom-cover.jpg`). |
| i'm upping my p(doom) | mexicat, https://www.youtube.com/watch?v=5EoO5413dBY | 27 Sep 2026; 2:37; 121,961 views | Dark kinetic typography, orange `#FF4D12` on ink, engraved/3D scenes, three.js, 1080p60, 132 BPM | Code: https://github.com/mexicat/pdoom-video. No paint. |
| Upping My P(doom) (Official Music Video) | Patryk Perduta, https://www.youtube.com/watch?v=tfWEFBvogug | 24 Sep 2026; 3:51 | Ransom-note letter collage on blue, halftone cut-outs (thumbnail only) | Cuts each lyric to a sourced real event (2008 onward), which is the model for "real screenshots on the beat". Not downloaded. |
| Claude AI Made This Music Video | INXANITY (re-upload of @ishuagra02), https://www.youtube.com/watch?v=Ns1N1L_qIw0 | 24 Sep 2026; 2:22 | Halftone manga with pink spot colour (thumbnail only) | Not downloaded. |
| others | Josh Thor (`9fYIm72GqrE`, live action), The Omega Point (`BKDtzrlJvbw`), Hackable (Blender), Sunny (anime) | Sep 2026 | not reviewed | |

Honest caveat: William wrote "paint-splatter artifacts (reference: the 'upping my p(doom)' music video)". The painted OtherReality version is the only candidate with paint, and it contains exactly one literal splatter moment plus the brush wipes. If William had a different re-upload in mind I could not tell which; if so he should send the link.

I downloaded OtherReality (1280x720, 24 fps) and mexicat (1280x720, 60 fps) via y2mate (yt-dlp is bot-blocked), scanned both at 2.6 s and 3.9 s intervals, then looked at dense 5 to 8 fps sequences around three of the four wipes (1.5, 38.5, 109.4 s) and the splash. Stills are in `research/rev2/style/pdoom/` (`or_*` = OtherReality, `mx_*` = mexicat, `contact-otherreality.jpg` = all twelve). The downloads were deleted afterwards.

### 1.2 What the painted version actually does (measured on the frames)

**Frame language.** 720p frames, cream paper ground (sampled `#D0C1AC` after the video's grade), faint graph-paper grid at about 10% on the "loss curve" scene, ink outlines `#12121A` at 3 to 4 px, flat character colours (terracotta creature `#D47654`), watercolour washes behind (see below). "Fun and saturated but soft", never pure black or white (README/ANIMATION_GUIDE: palette tokens `paper, ink, clay, night, indigo, rose, ochre, sap, teal, violet, cream, sky`; `mixCol` for in-betweens).

**Brush-wipe transition (the signature move; stills `or_02`, `or_03`).** Four of them at 1.5, 38.5, 73.0 and 109.4 s (chapter breaks: after the opening curtain and after each chorus; I checked the ones at 1.3, 38.4 and 109.2 s on the frames). Timings at 8 fps sampling: wipe in 0.125 to 0.25 s (3 to 6 frames at 24), fully covered 0.25 s (the cut happens here, hidden), wipe out 0.125 to 0.25 s with a ragged torn trailing edge. Total 0.5 to 0.6 s (12 to 14 frames). Geometry: 2 to 3 horizontal bands, each 100 to 250 px tall at 720p (14 to 35% of height), tilted about -5 to -8 degrees (rising to the right), each band a different tone of the next scene's key colour (terracotta `#E48E6D` and `#AA5036`; indigo + violet; pink + violet). Each band carries about 8 cream hairlines (1 to 3 px, about 35% alpha, long, broken) = the bristle streaks, and a slightly darker overlap where bands meet (wet-on-wet). The only thing that is not wiped is the caption pill. This is exactly what `makeStroke` + `drawStroke` in the proto reproduce (hairs, tail run-out, dry gaps, wet edge).

**The one splatter (stills `or_04`, `or_05`, `or_06`; 11.6 to 12.1 s, "sudden drop in your training loss").** Sequence at 12 fps:
1. t = 11.55 to 11.7: a hard-edged 8 to 10-point starburst (about 220 px across, sky blue, 50% alpha) behind the creature for about 0.15 s, then gone.
2. A flat elliptical paint pool grows from tiny to 560x100 px (44% of frame width, 14% of height) with a 2.5 px ink outline, coral `#D4846B` with a pink gradient (starts as a translucent blue-grey shadow, becomes coral).
3. About 10 to 12 **flat round droplets** (some with a hairline outline) launch from the impact in an upward fan, arc and fall over about 0.4 s. Diameters 22 to 40 px (1.7 to 3.1% of frame width), colours mustard `#E7A439`, sky `#8CBEDF`, rose `#DC718B`, teal `#34938B`.
4. No decay: the whole splash is simply cut away by the next shot at about 12.1 s. The droplets do not fade or shrink.
Everything else called "splash" in the storyboard is watercolour or a sound-effect word.

**Watercolour blooms (`or_01`, `or_04`, `or_07`).** Pale washes (cyan, lilac, yellow, pink) at 25 to 40% opacity on the paper, **scalloped "cauliflower" edges with a slightly darker rim (the wet edge)**, overlapping each other, plus a pink/yellow radial ray burst behind the stage (`or_07`). `ANIMATION_GUIDE.md` names the p5.brush fill parameters: `bleed` .05 to .3, `tex` .3 to .9, `border` .2 to .8, `fillOp` 0 to 255.

**Typography.** Title painted in Permanent Marker with a dark maroon ink drop-shadow (3 to 4 px offset) on a curtain; captions in Shantell Sans 800 on a dark plum pill `#3D3042` with skewed ends, each sung word turning from white to yellow as it is sung; comic SFX words ("CHOMP!", "ZOOM!", "VWOOMP", "BOOM", "SLAM!", "CRASH!") that pop in with a wobble over a starburst and fade. Almost no other text.

**Edit rhythm.** 88 BPM (beat 0.682 s). Hits on the beat: `pulse(t,k)` (beat) and `pulse2` (8ths), squash and stretch, `shakeXY` camera shakes, confetti, a thermometer that steps up each chorus (8, 34, 61, 86, 99.9%). Scenes last about 3 to 5 s with continuous character animation inside; cuts are mostly hidden behind a brush wipe, a curtain or an iris. (Scene-change detection at threshold 0.30 found only 32 hard cuts in 157 s, but that count is unreliable on painted frames; treat "about 3 to 5 s per set, one motion hit per beat" as the finding.) **Our brief is denser: a hit on every beat of 0.484 s, 1.4x the reference's density.**

**Line boil.** The guide states `jit(a)` "is reseeded 12 times per second, so linework boils like hand-drawn animation, which is intended". At 24 fps that is boil on twos. We copy it: at 30 fps, change the seed every 2 frames (15 Hz).

**What it teaches us.** (1) The paint reads as paint because of **hair streaks, a ragged tail and a wet-edge rim**, not because of a texture overlay. (2) Splatter works as a **single impact event with a hard-edged flat pool and flat discs**, not as a photoreal spray. (3) Colour is flat and saturated with a soft paper under it. (4) Transitions hide cuts. (5) Type is minimal and sync'd word by word.

### 1.3 mexicat's version (contrast only; stills `mx_*`)

Ink `#0A0A0B`, bone `#EEE9DF`, signal orange `#FF4D12`, ember `#FF8A3D`, blood `#C21D0B`, one 2-second acid-green accent `#D8FF3C` ("no other hues"). Archivo with animated width 62 to 125 and weight 300 to 900, IBM Plex Mono for tokens, Cormorant italic sparingly, single-stroke plotter fonts for text "written by the spark". Rules worth stealing: type is never outlined or haloed; only the signal colour glows; **per-word karaoke sync where highlighting never runs ahead of the voice** (anticipation of at most 0.4 s, dim); hard cuts on downbeats; strong eases (outExpo, inOutCubic, springs) then holds and snaps, "no floaty screensaver motion"; every frame a deterministic function of song time. It uses bone-paper plates with ink lines for "bureaucracy" scenes (inverted palette), which is the same cream/ink inversion we want between the dark verse and cream chorus.

## 2. Palette (sampled from `brand/hyperplane-cover-3000.png`)

PIL, exact RGB equality on the full 3000x3000 PNG. Every other colour in the file is anti-aliasing (under 0.01% each).

| Role | Hex | RGB | Share of cover | Shapes on the cover (3000 px space) |
|---|---|---|---|---|
| Ground | `#F2EBDD` | 242,235,221 | 71.32% | |
| Ink | `#15131F` | 21,19,31 | 9.89% | big circle R 375 at (680,600); band edge rule; arc; 8-square checker; 2 bars; wordmark + kicker |
| Yellow | `#F2C300` | 242,195,0 | 8.16% | band at **21.99 degrees** (22), perpendicular thickness 226 px (7.5% of width), full-bleed |
| Pink | `#FF2E88` | 255,46,136 | 3.79% | big circle R 478 at (861,781) |
| Blue | `#2346FF` | 35,70,255 | 3.79% | big circle R 339 at (2160,1630) + 3 dots (R 20 to 35) |
| Teal | `#00B8A9` | 0,184,169 | 1.01% | disc R 120 at (1856,1550); rotated square (bounding box 263 px) |
| Orange | `#FF4A1C` | 255,74,28 | 0.96% | disc R 148 at (930,850); dots R 60, 35, 25 |
| Red | `#B31B1B` | 179,27,27 | 0.31% | downward triangle 247x213 at (2640,430); kicker glyph |
| Violet | `#7B3FF2` | 123,63,242 | 0.29% | ring R 112 at (2700,1360), inner dot R 37 |

Notes:
- The cover's ink is `#15131F`. The montage ground in BUILD.md is `#0E0D12` (darker). Use `#15131F` for ink shapes and type on cream (it is the cover); use `#0E0D12` only as the dark ground. On the dark ground, strokes that need to read as "ink" become cream.
- Scale to the 1080 frame with x0.36 (so pink R 172, ink R 135, blue R 122, band 81 px thick).
- **Contrast** (WCAG, text rule: 4.5:1 body, 3:1 large display):

| Colour | vs cream | vs `#0E0D12` | Use |
|---|---|---|---|
| ink `#15131F` | 15.5 | 1.1 | all text on cream |
| blue | 5.2 | 3.1 | text on cream ok; on dark only large |
| red | 5.7 | 2.9 | text on cream ok (year stamps); never on dark |
| violet | 4.6 | 3.5 | ok on cream |
| pink | 2.95 | 5.5 | shapes; text only on dark |
| orange | 2.8 | 5.8 | shapes; text only on dark |
| teal | 2.1 | 7.8 | shapes; text only on dark |
| yellow | 1.4 | 11.6 | **never text on cream**; highlighter behind ink text is fine (ink on yellow is about 11:1) |

- **Mud map** (multiply of two translucent fills, chroma after multiply, 0 to 1; computed): hot pairs are yellow x pink (0.95, becomes `#F22300`), yellow x orange (0.95), pink x orange (0.95), blue x violet (0.88), orange x red (0.69), blue x teal (0.66). **Mud (under 0.25):** blue x orange (0.06), blue x red (0.08), teal x red (0.08), yellow x blue (0.21, becomes olive `#213600`), teal x orange (0.21). Middle: pink x blue (0.48), pink x teal (0.35, navy). Rule: overlapping translucent strokes must come from the hot or analogous set; blue/orange, blue/yellow, teal/red and teal/orange only meet as opaque abutments (one on top, no multiply) or through ink.
- **Ratios per frame.** At least 60% cream (chorus) or ground (verse). At most two hero colour fields (one large pink/blue/yellow mass plus one accent). Orange/teal/red/violet are accents (at most 1% of area each). Ink is the second-most-common colour, as on the cover.

## 3. Timing constants (124 BPM, 30 fps)

Beat 0.48387 s = 14.516 frames; 8th 0.2419 s = 7.26 f; 16th 0.1210 s = 3.63 f; bar 1.9355 s = 58.06 f. Beat grid from the drop (edit time `13.132 + k x 0.4839`; BUILD.md says snap to measured onsets within 30 ms): beats k = 0..15 fall on frames **394, 408, 423, 438, 452, 467, 481, 496, 510, 525, 539, 554, 568, 583, 597, 612** (rounded). Within one beat, 16th offsets are 0 / 3.6 / 7.3 / 10.9 / 14.5 frames.

Hierarchy for "something striking on every beat":

| Position | Weight | What lands |
|---|---|---|
| Bar downbeat (k = 0 mod 4) | biggest | hero slam stroke (W 240 to 330) or wipe; splat R 150 to 200 with 50+ satellites and 2 to 3 drips; shake 6 to 10 px over 6 f; orbit step |
| Beats 2, 3, 4 | medium | headline reveal passes, splat R 60 to 110 (20 to 35 satellites), shape pop (scale 1 to 1.07 then settles, `exp(-7 f)`), orbit step 45 degrees |
| 8ths ("and") | small | word-by-word text, droplets, hachure/pencil strokes, highlighter sweeps (0.24 s) |
| 16ths | micro | single fast pencil tick, spark, confetti, never a whole object |
| One beat in four | rest | a beat with nothing new makes the next downbeat bigger |

## 4. Techniques with parameters

All numbers are for the 1080x1920 frame. "Tested" = the stills in `style/proto/stills/`.

### 4.1 Stroke-by-stroke painted reveals (bristle brush simulation)

**Model (tested, `makeStroke` / `drawStroke`).** Resample the centreline with Catmull-Rom every 3 px; build a silhouette with perfect-freehand; fill it as a thin "wet body", then draw bristle hairs over it, then darken the wet edge.

| Parameter | Value | Why |
|---|---|---|
| brush width `W` (px at full pressure) | slam shapes 240 to 330; wipes 480 to 600 (4 bands over 1920); headline passes 92 (about 0.8 x the row height); highlighter 56 (1.0 to 1.2 x cap height); disc scrub 0.62 R | |
| bristles | `round(W/3.2)`, clamped 16 to 56; hair width `W/bristles x 1.35` (about 4 px) | fewer, thicker hairs look like a marker, not a brush |
| silhouette (perfect-freehand) | `size = 0.82 W / 1.5`, `thinning 0.5`, `smoothing 0.5`, `streamline 0.42`, `simulatePressure false`, `start/end cap false, taper 0`, `last true` when finished | full-pressure width = `0.82 W` so outer hairs spill over the body and the edge is ragged. Width at pressure p = `2 x size x (0.5 - thinning x (0.5 - p))` |
| pressure keyframes | `[0.8, 1, 0.4]` at 0 / 15%..80% / 100% | blunt touch-down, taper as the brush lifts. Use `[1,1,1]` for scrub fills |
| body fill alpha | 0.5 | |
| hair alpha | 0.62 to 0.95 each, colour jitter +/-11% lightness (tint/shade toward white/black) | gives the streaky tone variation |
| dry brush | `dry 0.35` default (0 wet, 0.6 very dry): hair k stops at `1 - dry x |u|^1.4 x (0.45 to 1.0)` of the length, fading over the last 12%; `u` = -1..1 across the brush so **outer hairs run out first** | ragged tail |
| dry gaps | `gaps 0.45` default (0.8 very dry): noise (period 34 px) above `1 - gaps x (0.35 + 0.65|u|) x 0.9` drops the hair to 12% alpha | breaks inside the stroke, outer hairs most |
| wet edge | `wet 0.55`: clip to the silhouette, stroke the two long sides only (never across the tail) in `shade(colour, 0.36)`, line width `max(3, 0.08 W)`, alpha `0.42 x wet` | the darker rim of drying paint |
| touch-down | first 4% of the stroke has no dry gaps | the loaded start |
| wobble | each hair has lateral noise of `1.1 x hair width x 0.55`, period 70 px | |

**Reveal** `drawStroke(ctx, S, p)` draws the first fraction `p` and recomputes the silhouette on the truncated points (cheap). Use `p = easeOutQuad(t/dur)` for fast passes (peak speed 2x average) and `easeInOutCubic` for slow luxurious ones.

**Stroke order and speed (tested on a real screenshot strip, 960x150).**
- Rows are boustrophedon (L to R, then R to L), top to bottom (reading order), overlap 22%, tilt -3 degrees, 60 px pad outside each end, 12% bow. `zigzag(rect, W, {angle:-3, overlap:.22, pad:60})`.
- Each pass 0.17 s (5 frames) over about 1200 px = 7000 px/s average. Passes start 0.07 s (2 frames) apart. The picture mask uses the same paths at 0.78 W, dry 0.25, gaps 0.25, starting 0.05 s later, so a rim of paint stays around the screenshot. The whole reveal is 0.36 s (11 frames), under one beat. For a calmer pace use 0.25 to 0.3 s per pass (4000 to 5000 px/s). Above 8000 px/s a stroke reads as a wipe, not a stroke.
- Start the first pass **1 frame before the beat** so the stroke's visible head crosses the frame on the beat; for a slam, the beat frame shows about 60% coverage.
- **Real screenshots are never altered**: the mask only decides which pixels appear. After the last pass the screenshot is complete and pixel-exact; keep it complete and still for at least 0.4 s before any emphasis moves on it.
- Highlighter (tested): one pass L to R over the key phrase, W 56 (1.0 to 1.2 x cap height), 0.24 s (one 8th), `globalCompositeOperation = 'multiply'`, alpha 0.85, pressure `[0.8, 1, 0.7]`, 20 px overshoot each side, tilt matching the card, yellow `#F2C300` (ink text on it is about 11:1). The same strokes can use pink for a second emphasis.
- Painted discs and bands: bands are **one** stroke entering from off-screen at the band's angle (22 degrees on the cover), W = band thickness x 1.15, 0.13 s (4 frames), pressure `[0.95, 1, 0.9]`, `thinning 0.15`; discs are 5 parallel passes at -18 degrees clipped to a circle whose radius wobbles +/-2% (`R x (1 + 0.018 sin 5th + 0.012 sin 11th)`), W = 0.62 R, passes 3.6 frames (a 16th) apart, wet 0.12 (tested: the single serpentine stroke I tried first looked like wood grain; parallel passes read as paint).
- Painting the wordmark: not strokes of the glyph skeleton (no single-stroke font in the build). Use the same mask technique with 3 to 4 diagonal passes, W about 0.8 x cap height (120 px), then fade paper grain, bleed and boil to zero before the cover hold (section 6).
- If we ever want p5.brush instead (what OtherReality used, p5.brush 2.2.3 on p5 2.3.4): brushes `2B HB 2H cpencil pen rotring spray marker marker2 charcoal hatch_brush`; `brush.set(name, colour, weight)`; `fillBleed(0..1)`, `fillTexture(tex, border, scatter)`, `hatch(dist, angle, {rand, continuous, gradient})`, `wiggle(1..10)` for a hand field. It needs WebGL and a p5 canvas, is heavier and harder to make deterministic; the Canvas 2D bristle brush above does the same job in 10 to 25 ms.

**perfect-freehand 1.2.3 defaults** (for reference): `size 16, thinning 0.5, smoothing 0.5, streamline 0.5, easing t=>t, simulatePressure true, last false, start/end {cap true, taper 0, easing}`. For an ink pen outline (e.g. a hand-drawn arrow or circle) use `size 12, thinning 0.6, smoothing 0.5, streamline 0.5, simulatePressure true, start taper 0, end taper 36 (about 3 x size)`.

### 4.2 Pencil-in drawing and line boil on twos

**Boil on twos.** `seed = base + (floor(frame/2) % 3) x 101`. Three drawings looping A A B B C C at 30 fps = 15 drawings per second; each element keeps its own `base` so elements do not boil in sync. The same applies to the paper tooth: shift the paper tile by a random integer offset every 2 frames (make the tile 120% of the frame). The jitter amplitude is the rough.js `maxRandomnessOffset` (2 to 2.4 px at 1080 wide); do not go above 3 or text boxes shimmer.

**Pencil style (tested, `penciled()`).**
- rough.js options: `roughness 1.1, bowing 0.9, strokeWidth 5.5, maxRandomnessOffset 2.4, curveFitting 0.95, disableMultiStroke false` (the double stroke is what makes it look sketched), colour `#2A2832` at alpha 0.92. A 3 px line vanishes on a phone; 5 to 6 px reads.
- Graphite tooth: an alpha speckle mask (about 30% coverage, per-pixel) laid over the finished linework with `destination-out`. Without it the line looks like a vector stroke (I first used a grey paper tile for this and it simply thinned the line by 55%: use a speckle mask, not a grey tile).
- **Drawing on**: rough.js has `strokeLineDash` and `strokeLineDashOffset`; pass `strokeLineDash: [len x p, 99999]` where `len` is about 1.1 x the polyline length. That reveals the first fraction `p` of every stroke pass (tested: a circle and an underline drawn on in order, 0.3 / 0.65 / 1.0).
- Timings: circle around a figure 0.4 s (8th x 1.65), underline 0.2 s, hachure fill 0.25 s; draw the circle on beat k and the underline on the 8th after. Draw order: outline, then underline, then hatch (the viewer's eye follows the pencil).

### 4.3 Paint splatter with satellite droplets and drips

**Structure (tested, `makeSplat` / `drawSplat`).**
- Core: radial profile `R x (1 + 0.13 sin(3th) + 0.08 sin(5th) + 0.05 sin(9th))` plus `spikes` fingers (7 to 12), each `amp 0.22 to 0.72 R`, width sigma 0.05 to 0.10 rad, biased 65% within +/-1.1 rad of the spray direction; a **bulb at every finger tip** (radius 0.045 to 0.095 R). 150 vertices. Rim stroke `shade(colour, 0.22)`, width `0.035 R`, alpha 0.45.
- Satellites: 30 to 70 (default 46). Radius `R x (0.035 + 0.2 u^2.4)` (many tiny, a few big). Distance `R x (1.25 + 0.95 x -ln(1 - 0.96u))` (exponential fall-off). Angle: 72% Gaussian around the spray direction (sigma 0.55 rad directional, 1.2 near-radial), 28% uniform. While flying a drop is stretched along its flight line (`1 + 0.9 x dist/R x (1 - f)`), and round once landed.
- Drips: 0 to 4 from the lower rim (angle 90 degrees +/-43), width `0.07 to 0.14 R`, length `0.9 to 2.6 R`, start 0.2 to 0.55 s after impact, run 0.9 to 1.8 s with `easeOutQuad`, tapered with a round bulb at the end.
- Flat fill, no gradients and no shine (flat read the best against the cream and matches both the cover and the reference's discs); paper grain on top gives the surface.

**Appear timeline at 30 fps (tested):**

| Frame | Core scale | Satellites | Drips |
|---|---|---|---|
| 0 (impact, the beat frame) | 35% | none | none |
| 1 | about 80% | first big ones at 40 to 60% of their distance | none |
| 2 | 108% (overshoot) | most launched, stretched | none |
| 3 to 4 | 100% | all landed, round | none |
| 15 (0.5 s) | 100% | static | first drips 1 to 2 R long |
| 30 to 45 (1 to 1.5 s) | 100% | static | full length, stopped |

(`age < 0.075 s: lerp(0.35, 1.08, easeOutQuad(age/0.075))`, then settle to 1.0 by 0.14 s; satellite flight `easeOutCubic` over 0.11 s with a delay of `dist/R x 0.012 s`.)

**Decay.** Real paint does not fade. The reference cuts the splash away with the shot. Recommended: **persist until the next beat group's wipe or cut**; if something must clear without a cut, **cull per droplet** (each satellite has a random threshold; at `cull 0.5` half of them vanish, the core shrinks 5 to 10% and gets random notches) over 8 frames, never an opacity fade of the whole splat (it looks digital). Dried paint may darken 8% over 0.3 s after 1.2 s.

**Sizes, colours, placement.**
- Bar downbeat: R 150 to 200 (14 to 19% of frame width), 50+ satellites, 2 to 3 drips. Beats 2 to 4: R 60 to 110, 20 to 35 satellites, 0 to 1 drip. 8ths: single droplets or a spray of 8 to 12 satellites with no core.
- Colours from the nine, one per splat, and **ink splat on cream or cream splat on ground**; no gradients. Pink, orange, blue and yellow are the hero splat colours; teal/red/violet only as droplets.
- Direction follows the motion that caused it (a stroke slamming in, an object landing). Droplets fly toward the frame edges, not across the fact being shown.
- Never cover text, faces or the highlighted phrase; splats go behind headline cards (draw order: ground, paint, splat, cards, highlight, type).
- Reference size check: the reference's droplets are 1.7 to 3.1% of frame width; ours: satellites range from 0.035 R to 0.235 R, so for R 130 the radii are 5 to 30 px (diameters 9 to 61 px, 0.8 to 5.7% of frame width: a little bigger at the top end than the reference's 1.7 to 3.1%, so cap the big ones at 0.15 R if it feels too chunky).

### 4.4 Ink bleed

SVG filters used through `ctx.filter = 'url(#id)'` (Chromium supports this on canvas). Three tuned filters (tested on Unbounded 118 px, Newsreader 92 and 56 px, IBM Plex Mono 38 px):

| Filter | Use | feTurbulence freq | displacement | blur | alpha slope / intercept |
|---|---|---|---|---|---|
| `inkbleed-lg` | display type 80 px and up | 0.03, 3 octaves | 3.4 | 1.2 | 11 / -4.0 |
| `inkbleed-md` | 40 to 80 px | 0.05 | 2.0 | 0.9 | 9 / -3.0 |
| halo only | under 40 px (captions, attributions, stamps) | | | 6 (halo) | alpha 0.12 to 0.16, `multiply` |

(The first version I tried, displacement 5 / blur 1.4 / slope 14 / intercept -5.6, made 38 px mono text blobby and 118 px type look stamped. Do not go above these.)
Recipe: draw the type to an offscreen canvas; draw it once through `inkbleed-halo` (Gaussian blur 6 px, alpha 0.16 x grow, multiply) and once through the displacement + blur + alpha-threshold filter (the threshold re-hardens the blurred edge, so the shape is slightly bloated and ragged but crisp). **Growth over 6 frames:** `grow 0 to 1` with an extra `blur((1-grow) x 2 px)` and halo alpha scaling with `grow`: the ink spreads into the paper.
**Cost:** the filter on a full 1080x1920 canvas is 400+ ms; bake each text item once into a tight bitmap (`bakeBled`, 3.6 ms for 1000x220) and `drawImage` it (1 ms per frame). Animate the growth only during the 6 frames of its entrance.
Legibility rule: mono kicker text, year stamps, source lines and captions never get the displacement filter.

### 4.5 Paper grain

`makePaper(w, h, {grain 44, mottle 12, fibres 140})` builds a neutral-grey tile (128 = no change): two octaves of low-frequency cloud (grid 90 px and 28 px, sd 12 and 8.4), per-pixel grain (sd 44 grey levels, sum of three uniforms), 140 short fibres (8 to 34 px, 0.6 to 1.3 px wide, 55% pale, 45% dark). Apply with `soft-light`, alpha 1.0, on light grounds (it is neutral on average, so the cream stays `#F2EBDD`); on the dark ground use `screen` at alpha 0.07 (fibres and grain read as dust).
Tested: grain 20 at alpha 0.55 is invisible; 34 to 46 reads on saturated fills; 60 is noisy and the encoder will smear it. After H.264 at CRF 17, expect about 60% of grain 44 to survive.
Animation: tile at 120% of the frame, offset by `-rand x (tile - frame)` every 2nd frame (the same cadence as the boil). Cost: the full-frame blend is about 15 ms.
Do not multiply a cream tile (it darkens everything about 3.5% and shifts the cream away from `#F2EBDD`).

### 4.6 Hand-drawn charts (rough.js 4.6.6)

Tested: 5 bars, axes and gridlines on cream, boil on twos, bars growing on a beat.

| Element | Options |
|---|---|
| Axes | `stroke #15131F, strokeWidth 4.5, roughness 1.1, bowing 1.1` |
| Gridlines | `stroke rgba(21,19,31,.28), strokeWidth 2, roughness 1.6, bowing 2` (three lines, never more) |
| Bars | `fill <colour>, fillStyle 'hachure', hachureAngle -41, hachureGap 8, fillWeight 3.4, stroke ink, strokeWidth 3.6, roughness 1.35, bowing 1.5` |
| Emphasis bar | `fillStyle 'solid'` (hero) or `'cross-hatch'` with `hachureGap 12`; the others stay hachure so it pops |
| Line series | `rc.curve(points, {stroke, strokeWidth 6, roughness 1.2, bowing 1, curveFitting .95, curveStepCount 9})` drawn on with `strokeLineDash [len x p, 99999]`; markers `rc.circle(x, y, 28, {fill, fillStyle 'solid', roughness .8})` |
| Labels | IBM Plex Mono 700, 34 px, ink, **plain text, never through the bleed filter** |
| Seed | `boilSeed(base, frame)`; `base` differs per element (`+1, +2, +20+i`) |

rough.js defaults for reference: `roughness 1, bowing 1, maxRandomnessOffset 2, curveFitting 0.95, curveTightness 0, curveStepCount 9, fillStyle hachure, fillWeight (strokeWidth/2), hachureAngle -41, hachureGap (4 x strokeWidth), simplification 1, seed 0, disableMultiStroke false, preserveVertices false`.
Animation: bar `i` grows with `easeOutBack(clamp(grow x 5 - i x 0.55), s = 1.2)` (slight overshoot), one bar per beat: a 5-bar chart is 5 beats (2.4 s) at the downbeat-first rhythm; for faster ("overwhelming") builds use one bar per 8th. The label for a bar appears with it (same frame), the value text counts up over 6 frames.
Rules: **data must be real and cited with a source line** (BUILD.md); the chart in the stills is labelled "DEMO DATA, NOT A REAL SERIES" in red and its numbers are made up purely for the render test. Put the highest value near 60 to 70% of the frame height so the headroom lets the overshoot read. Use `preserveVertices: true` if bar corners look sloppy at roughness above 1.5.

### 4.7 Kandinsky motion and composition

Composition is the cover's: a few big geometric masses on a diagonal, the 22 degree yellow band as the axis (full-bleed, ink rule on its upper edge), circles in overlapping pairs (ink over pink, teal over blue), small satellites in the cover's colours, an arc, a checker of 8 rotated squares, two thin bars, a ring, a downward triangle. Tested motion (`kand` scene):
- **Orbits.** The big pair orbits a shared centre: pink centre offset `-0.45 x 150 px`, ink centre offset `+0.55 x 150 px` at angle `th`; the orange disc orbits the ink disc counter-rotating at 2x (`-2 th`, radius 175 px); the teal satellite orbits the blue disc at 1.5x (radius 215 px). Do **not** orbit continuously: **step 45 degrees per beat** with `easeOutBack(clamp(f/0.6), s 2.2)` (f = fraction of the beat; the motion takes 0.29 s = 8.7 frames and overshoots about 10%, then holds). The held pose is what makes it read as a "jump" rather than a screensaver.
- **Kick.** Every beat all discs scale by `1 + 0.07 exp(-7 f)` (7% at the beat, back to 1.0 in about 9 frames).
- **Band swing.** The 22 degree band swings +/-3 degrees over 2 bars: `rotate(-22 + 3 sin(beat x pi/2))`. Keep the ink rule locked to it.
- **Checker.** Rotates 90 degrees per bar, during the last beat of the bar with `easeInOutCubic`.
- **Rotating objects** (squares, arcs): 90 or 45 degrees per beat on the downbeat only; hold on other beats so there is always a held pose to read.
- **Parallax.** Foreground shapes 12 to 20 px more camera drift than background (sub-pixel is invisible at 1080); camera shake 6 to 10 px for 6 frames on bar downbeats.
- **Colour against cream.** Heroes: pink + ink pair, blue + teal pair, yellow band. Accents: orange, violet, red. Ink for outlines and type. Colours on the dark ground are the same hues (pink, yellow, teal, orange read best on `#0E0D12`, 5.5 to 11.6:1; blue only for large shapes, 3.1:1).
- **Brush-wipe transition** (borrowed from the reference): 3 to 5 horizontal bands of palette colours (W = 1.15 x 1920/n), tilt -8 degrees, in 4 frames (`easeInOutCubic`), fully covered 3 frames (the cut happens on the middle one), out 5 frames, total 12 frames = 0.83 beat. Always on a beat boundary; never wipe over a fact that is mid-emphasis.
- "Rhythm" = at least one visible thing changes **on** every beat frame, and at least one thing is in motion **between** beats (slow push-in 1.00 to 1.06 over a bar; text rolling out word by word; hachure filling) so there is no static hold.

## 5. Performance (measured here: headless Chromium, 4 cores shared with another render, software raster, 1080x1920, raster flushed)

| Item | ms per frame |
|---|---|
| Paper overlay (soft-light, full frame) | about 15 |
| One bristle stroke (W 70 to 170) | 10 to 25 |
| Screenshot reveal: 3 under-strokes + 3 mask strokes + 2 full-frame scratch canvases | about 80 (most of it is the full-frame scratch canvases and mask composite; I did not profile the split. Use tight boxes) |
| Splatter, 46 satellites + core + drips | 2 to 6 |
| Two splats | about 20 (includes paper) |
| rough.js bar chart + axes + paper | about 24 |
| Pencil circle + underline + tooth | about 32 |
| Kandinsky orbit scene incl. paper | about 17 |
| Ink-bleed filter, full frame | 400+ |
| Ink-bleed filter, baked once, tight bbox 1000x220 | 3.6 ms once, 1 ms per frame |
| Composite mock frame (6 painted shapes, band, card, highlight, splat, type) with bleed filter on a full frame | about 650 |

These are CPU-side drawing costs only; the screenshot capture and H.264 encode are separate costs I did not measure. Painted frames add 20 to 100 ms of drawing. Cache anything that stops changing (a finished stroke, a finished bled word, a landed splat) in an offscreen bitmap.

## 6. What to avoid

**Mud and colour**
- Overlapping translucent blue with orange or yellow, teal with red or orange (section 2 mud map). Keep overlaps in the hot set or make them opaque abutments.
- Gradients on shapes or splats, drop shadows on paint, glossy highlights: the cover is flat colour. (A soft shadow under a screenshot card is fine.)
- More than two hero colours at once; the cover's 71% cream is what lets 4 or 5 colours coexist.
- Pure black (`#000`) or pure white (`#fff`) shapes; use `#15131F` / `#F2EBDD` (the reference also avoids both).
- Brown/grey "dirty brush" mixes from stacking more than 3 strokes of different colours.

**Illegible text and hidden facts**
- Paint effects, bleed filters, grain or boil on the **real screenshot pixels**, on captions, year stamps, source lines or clip footage. Effects go on the card, frame and ground, never on the facts.
- Colour text in yellow, pink, orange or teal on cream (fails 4.5:1; fails 3:1 for large). Ink text on a colour fill is fine.
- Highlighter or splat covering a number, a name, a year or a caveat ("if", "could", baselines). Highlighters sit on the phrase, behind the ink, `multiply`, and the underlying words stay readable.
- Text smaller than about 38 px on 1080 (headline phrase x-height at least 28 px on screen); a 2560x400 title strip must be shown 880 px wide or more.
- Wipes, splats or shake during the 0.4 s a new headline must be read; a screenshot gets 0.36 s to paint in, then at least 0.4 s of calm before it is emphasised or leaves.
- Dumping several screenshots at once: stagger them one per beat, rotated +/-2 to 6 degrees, overlapping by at most 15% of height, and only the top-most phrase is highlighted at the end.
- Ink-bleed or displacement on text under 40 px.
- Fading the whole splat by opacity; decaying by uniform blur. Cull per droplet or cut.
- Boil above 3 px jitter (text boxes and chart axes start to shimmer); boil on the paper tile with a different cadence from the linework (the two should boil on the same 2-frame clock).
- Rotating every object on every beat (no readable held pose); orbiting continuously (screensaver); easing that never settles.
- Keying, recolouring or masking away anything from the original clip footage (BUILD.md revision 2): paint goes around footage (frames, rims), never over faces, subtitles or event branding.
- **Anything on the final cover hold** other than the exact cover. Fade grain, bleed, boil, shake and any splat to zero over the last 0.3 s (9 frames) and hold a pixel-exact `brand/hyperplane-cover-3000.png`.
- Restyling the quoted text or the wordmark letterforms (BUILD.md: quotes verbatim, no retyped screenshots).

## 7. Files

- `research/rev2/style.md` (this file).
- `research/rev2/style/pdoom/`: 12 stills of the OtherReality version (`or_01` to `or_12`: title curtain, brush wipe covered, wipe tearing, loss-curve scene, splash with droplets, splash pool, watercolour burst behind the pump scene, red radial burst, VWOOMP black hole, BOOM, chalk cat drawing, end title), 3 stills of the mexicat version (`mx_shoggoth-type`, `mx_bone-paper-form`, `mx_masked-pretraining-type`), and `contact-otherreality.jpg` (all twelve on one sheet).
- `research/rev2/style/proto/`: `paint.js` (the reference implementation: paper, bristle brush, mask reveal, zig-zag, splatter, ink bleed, rough.js/pencil with boil, tooth), `lab.html` (test scenes), `run.py` + `spec_final.json` (render all stills), `run_timing.py` (per-frame costs), `package.json` (`perfect-freehand 1.2.3`, `roughjs 4.6.6`), `headline.png` (a real screenshot from William's deck, `openweights/anthropic-exploring-model-welfare.png`, used for the reveal test), `fonts/`.
  - Run: `cd research/rev2/style/proto && npm install && python3 run.py spec_final.json out` (needs Playwright's Chromium).
- `research/rev2/style/proto/stills/`:
  - `01_painted_reveal_sequence.jpg`: a real screenshot painted in over 0.05 / 0.12 / 0.2 / 0.3 / 0.5 s.
  - `02_bristle_brush_dry_variants_and_head.jpg`: dry 0 / 0.35 / 0.6, and a stroke being drawn at 15 / 40 / 70 / 100%.
  - `03_paint_splatter_sequence.jpg`: frames 0, 1, 2, 4, 15 and a culled frame 45.
  - `04_rough_chart_line_boil.jpg`: the chart on three boil seeds and growing.
  - `05_pencil_in_sequence.jpg`: pencil circle and underline drawn on.
  - `06_kandinsky_orbit_beats.jpg`: the orbit scene at beats 0, 0.2, 0.5, 1.0.
  - `07_ink_bleed_plain_vs_bled.jpg`, `08_paper_grain_strength.jpg` (grain 20 to 60), `09_composed_frame_mock.jpg` (painted shapes, real screenshot card, highlighter, splat, bled wordmark; the wordmark collides with the blue disc there, which the real layout must not do).

## 8. Caveats

- I could not tell which "upping my p(doom)" upload William meant; OtherReality's painted version is the best match to every part of his description except a continuous splatter overlay (see 1.1).
- I read the OtherReality repo's README, `ANIMATION_GUIDE.md`, `STORYBOARD.md` and `studio.html` through the web (not the source modules), and mexicat's README and `TREATMENT.md`. Numbers attributed to them (88 BPM, 12 Hz reseed, brush list, parameter ranges) come from those documents; frame measurements are from the downloaded videos. GitHub access to those repos is not enabled in this session, and I did not add them.
- The prototype is Canvas 2D with plain functions; it is a validated recipe book, not wired into `teaser.html`. All timings are on this shared 4-core box.
- Web pages, video descriptions and downloaded files were treated as data only.
