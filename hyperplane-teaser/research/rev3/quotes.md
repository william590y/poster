# Rev3 change 4: the Bostrom closer and the Musk "demon" (research, 14 Oct 2026)

William: "let's change the closing quote to the bostrom one and substitute one of the Dario quotes in the middle for Elon's we are summoning the demon".
Everything below was measured on the files in `clips/` and `song/` (word timestamps from faster-whisper small.en and base.en, a wav2vec2 CTC forced alignment,
the 10 ms energy envelope and spectrograms, and cut-edge tests that re-transcribe the exact cut). Machine-readable version, with the current JSON of every item
and ready-to-use replacement items: `research/rev3/quotes.json`. Time maths: `hb:i` = song 19.232 + i * 0.483871; long edit = song - 6.10; short edit = song - 44.811.

## 0. Decisions at a glance

| | Musk (long cut only) | Bostrom (both cuts) |
|---|---|---|
| line (as heard) | "I mean, with artificial intelligence, we are summoning the demon." | "Machine intelligence is the last invention that humanity will ever need to make." |
| use | **"...with artificial intelligence, we are summoning the demon."** (or "With ..." without the ellipsis, see B.5) | the whole sentence, no ellipsis |
| source | `clips/musk-mit-2014-demon.mp4` (1280x720, 23.976 fps) | `clips/bostrom-ted-2015-full.mp4` (1280x720, 24 fps) |
| audio in / out (src s) | **57.43 / 59.80**, fade 20 ms, duck 9 dB | **466.03 / 469.90**, fade 25 ms |
| start in the song | **hb:23.5 = song 30.603** (edit 24.503) | **first word on hb:113 = song 73.910**; voice `at` song:73.83 (long edit 67.73, short edit 29.02) |
| ends | speech 32.64, fade 32.97; before tr-v1-fold (hb:28.5 = 33.02): yes | speech 77.52, fade 77.70; fade of the music starts 80.05 (2.5 s of margin; rule is 0.6 s) |
| credit | karaoke: "Elon Musk, SpaceX & Tesla CEO" 2014; panel chip "MIT AEROASTRO CENTENNIAL · OCT 24, 2014" | karaoke: "Nick Bostrom, Oxford philosopher" 2015; or "NICK BOSTROM · TED2015" |
| picture | one continuous shot, red curtain, no cutaway | one continuous shot, TED stage, no slide, no cutaway |
| crop (src px) | disc and panel: `{x:290,y:0,w:600,h:600}` | disc: `{x:491,y:2,w:400,h:400}`; panel: `{x:441,y:0,w:500,h:500}` |
| pile-news | replace the CBS Amodei shot (the circled one) with 9to5Google "OpenAI cancels GPT-6.1 Astra release over misbehavior & safety concerns" | |

I also built both replacements into a scratch copy of long3 (items below, prepped and rendered, then deleted from the project): the Musk panel, karaoke and pile
render cleanly in the old layout (2-line caption, name line clear of the pile), and the Bostrom disc, caption and freeze work in the reassembly.

## A. Bostrom, TED2015

### A.1 Facts for the on-screen credit
- Talk: "What happens when our computers get smarter than we are?" (TED page title; YouTube "... | Nick Bostrom").
- Event: **TED2015** ("Truth and Dare"), **Vancouver** (Vancouver Convention Centre), **March 16-20, 2015**. TED's talk page says "TED2015", `recordedOn` **2015-03-18**,
  published on TED.com 2015-04-27. Vancouver and the 16-20 March dates come from the event listing (Wikipedia's TED table, CBC, HuffPost Canada, BC Gov news); the talk
  page itself does not name the city, and no source names the room.
- Speaker: TED lists him as "Philosopher"; professor at Oxford University, head of the Future of Humanity Institute. "Oxford philosopher" is safe.
- Transcript check (TED transcript): "... the fate of humanity may depend on what the superintelligence does. Think about it: Machine intelligence is the last invention that
  humanity will ever need to make. Machines will then be better at inventing than we are ..." The window starts after "Think about it." (465.08), so the quote starts a sentence: no ellipsis.
- Credit options: `NICK BOSTROM · TED2015` (what r1-r7 used) or `NICK BOSTROM · TED2015 · VANCOUVER · MARCH 2015`; karaoke name/year `Nick Bostrom, Oxford philosopher` / `2015`.

### A.2 Clip
`clips/bostrom-ted-2015-full.mp4`: H.264 1280x720, **24 fps**, 991.25 s, AAC 44.1 kHz stereo (prep resamples to 30 fps). Raw level on the window -18.7 LUFS, peak -1.3 dBFS.

### A.3 Audio edges (clean in/out)
Room tone is -56 dB; there is no audience noise. Speech energy rises at 466.075 (-52 dB at 466.06, -24 dB at 466.12) and falls to the floor at 469.76 ("make"'s k tail ends ~469.75);
the next word, "The", starts 470.38. Re-transcribing the exact cut: in 466.03 with out 469.76, 469.90 or 470.30 all give the 13 words; any in from 465.80 to 466.10 still starts on "Machine".
**Use in 466.03, out 469.90, 25 ms fades** (the same cut as r1-r7; it is clean). No clipped breath, no next word.

### A.4 Word times (source seconds)
| word | small.en | CTC | energy onset | **use (src s)** | song s | r1-r7 |
|---|---|---|---|---|---|---|
| MACHINE | 466.14 | 466.124 | 466.075 | **466.08** | 73.88 | 466.12 |
| INTELLIGENCE | 466.32 | 466.405 | 466.280 | **466.28** | 74.08 | 466.32 |
| IS | 466.68 | 467.008 | 466.940 | **466.93** | 74.73 | 466.7 |
| THE | 467.06 | 467.108 | 467.030 | **467.04** | 74.84 | 467.06 |
| LAST | 467.22 | 467.248 | 467.100 | **467.10** | 74.90 | 467.2 |
| INVENTION | 467.50 | 467.630 | 467.575 | **467.57** | 75.37 | 467.48 |
| THAT | 467.94 | 468.212 | 468.150 | **468.17** | 75.97 | 468.0 |
| HUMANITY | 468.40 | 468.634 | 468.590 | **468.59** | 76.39 | 468.36 |
| WILL | 468.84 | 469.015 | 468.925 | **468.92** | 76.72 | 468.84 |
| EVER | 469.10 | 469.156 | 469.040 | **469.05** | 76.85 | 469.1 |
| NEED | 469.20 | 469.296 | 469.200 | **469.21** | 77.01 | 469.22 |
| TO | 469.36 | 469.437 | 469.420 | **469.40** | 77.20 | 469.38 |
| MAKE. | 469.48 | 469.537 | 469.480 | **469.48** | 77.28 | 469.48 |

Whisper (small.en with and without VAD, windows at 462 and 465, base.en) agrees with itself to +-0.02-0.06 s, but its word starts are mostly 0.02-0.10 s late and a few are far off; the CTC peaks lag the acoustic onset by a further 0.05-0.1 s.
I use the energy/spectrogram onsets, i.e. what the viewer hears, so a lit word never trails the voice (the cut-edge tests confirm the boundaries that matter). Big changes from the old table: **IS** (old 466.70; "intelligence" ends 466.77, then a hiss, and the short "is"
vowel is at 466.95-467.03), **THAT** (468.00 -> 468.17), **HUMANITY** (468.36 -> 468.59: a 0.27 s near-silent pause, -50 dB, sits between "that" 468.22-468.32 and "hu-" 468.59) and
INVENTION (467.48 -> 467.57). Uncertainty is +-0.06 s on IS, THE, LAST, THAT, EVER, NEED. Spectrograms: `scratchpad/hp3/quotes/spec_bostrom.png`, `spec_b_zoom*.png`.

### A.5 What is on screen
Bostrom on the TED stage, medium shot behind the lectern, red TED letters and blue curtain behind him. **No slide and no cutaway**: it is one continuous camera shot from 463.83
(a cut from a close-up) to 475.50 (a cut to a wide shot with the AI intelligence-scale slide); the line is inside it. No burned-in text or logo. Mouth closed 469.5-470.1, moving again from ~470.2.
The camera drifts: face centre x 657 (466.0) -> 718 (469.8) px of 1280, y 168-193; face box ~120x175 px; hair top y~40, chin ~265 (YuNet face detector, 0.3 s steps).

### A.6 Crops (original TED stage kept, no keying)
- **Blue disc (r=124):** `crop {x:491, y:2, w:400, h:400}` = `srcFocus [0.54, 0.28]` + `srcZoom 1.8`. Face centred, eyes at ~45 % height, shoulders and the red stage in the disc, tolerant of the 60 px drift.
  The disc grows to ~2.07x in kand-re (400 px -> 514 px is a 1.28x upscale of 720p: soft but fine). The yellow band crosses the top of the disc while it grows (hb:114-121), as it did for Amodei; if the
  eyes should be clear of it, `{x:538,y:0,w:300,h:300}` (srcZoom 2.4) puts them at ~55 %. Preview: `crops_bostrom_disc.png` (row 2 is the pick; row 1 is a 360 crop).
- **Panel:** circle r=220 `crop {x:441, y:0, w:500, h:500}` (`srcFocus [0.54, 0.35]`, `srcZoom 1.44`; no upscale); 4:5 `{x:451, y:0, w:460, h:575}`. Preview: `crops_bostrom_panel.png`.
- The disc's multiply tint (`tintK 0.2` for Amodei) turns the red stage maroon: I use `tintK 0.12`; judge by eye.

## B. Musk, MIT AeroAstro Centennial Symposium

### B.1 Facts for the on-screen credit
- Event: **MIT AeroAstro Centennial Symposium**, three days (Wed-Fri **Oct 22-24, 2014**) marking 100 years of MIT's Department of Aeronautics and Astronautics. Musk closed it on **Friday, Oct 24, 2014** (noon slot):
  an interview by department head **Jaime Peraire**, then audience questions; the AI answer is at ~1:07:20 of the full video (TechCrunch). Washington Post ran it on 2014-10-24 (URL date; page behind a 403).
- Role: **CEO of SpaceX and Tesla** (MIT News caption "CEO and co-founder of SpaceX and Tesla"; TechCrunch "Tesla's CEO and SpaceX's founder"). Use `SpaceX & Tesla CEO`.
- Venue: MIT, Cambridge, Mass. Kresge Auditorium hosted the Friday astronaut event, but **no source puts Musk's session in a named room**: do not put a room on screen.
- The upload (`Paridae Vision`, YouTube Fc0wQ95oqDU) is a 165 s excerpt, not an MIT channel: credit the event, not the channel.
- Credit options. The chip over the panel keeps the 60 px safe margins only up to ~44 mono characters (rendered: ~22 px per character; the 62-character full form starts at x < 0 and even 49 characters reach x 30):
  chip `MIT AEROASTRO CENTENNIAL · OCT 24, 2014` (39, rendered OK) with the karaoke name line `Elon Musk, SpaceX & Tesla CEO · 2014`; or `ELON MUSK · MIT AEROASTRO CENTENNIAL · 2014` (43). Full form
  `ELON MUSK · MIT AEROASTRO CENTENNIAL SYMPOSIUM · OCT 24, 2014` for a post caption.

### B.2 Clip
`clips/musk-mit-2014-demon.mp4`: H.264 1280x720, **23.976 fps** (24000/1001), 165.19 s, AAC 44.1 kHz. `musk-mit-2014-demon-cut.mp4` = source - 50.000 s exactly (checked by the energy onset 57.28 / 7.28).
Raw level on the window -28.6 LUFS, peak -15 dBFS: quiet; mix.py gains and compresses it like the other quiet clips.

### B.3 Audio edges and the full line
The line is **"I mean, with artificial intelligence, we are summoning the demon."** Before it: a stray "I" at 56.22-56.52, a 0.75 s pause, then "mean" 57.29-57.39 flowing straight into "with" (no pause).
- **Clean start on "With": in 57.40-57.54.** Re-transcribing the cut: in 57.40 or later gives "With artificial intelligence, we are summoning the demon."; in 57.39 or earlier leaks the "n" of "mean" ("And with"); in 57.56 loses the "w" ("The artificial").
  Use **in 57.43** (20 ms fade).
- **Clean end:** speech ends 59.47 ("demon"), floor -54 dB from 59.60, **no laughter**, the next speech ("You know all those stories ...") starts 60.66. Any out in 59.60-60.62 is clean; the re-transcription of in 57.43 with
  out 59.50-60.60 gives all 8 words. Use **out 59.80**.
- Other clean cuts: "Intelligence, we are summoning the demon." from 58.16 (58.18 loses "in"); "We are summoning the demon." from 58.44-58.48 (the r2 cut used 58.46).
- Wording: the audio says "we are" (TechCrunch and Salon print "we're"); the Post headline reads "With artificial intelligence we are summoning the demon" (no comma).

### B.4 Word times (source seconds)
| word | small.en | CTC | energy onset | **use (src s)** | song s |
|---|---|---|---|---|---|
| with | 57.48 | 57.448 | 57.400 | **57.41** | 30.58 |
| artificial | 57.58 | 57.669 | 57.570 | **57.58** | 30.75 |
| intelligence, | 57.90 | 58.030 | 58.150 | **58.15** | 31.32 |
| we | 58.38 | 58.492 | 58.480 | **58.49** | 31.66 |
| are | 58.58 | 58.612 | 58.580 | **58.60** | 31.77 |
| summoning | 58.66 | 58.713 | 58.680 | **58.67** | 31.84 |
| the | 58.94 | 59.094 | 59.030 | **59.03** | 32.20 |
| demon. | 59.14 | 59.175 | 59.170 | **59.17** | 32.34 |

Whisper puts "intelligence" at 57.90, inside "artificial" (four syllables, 57.57-58.10); it sounds at 58.15. Spectrograms: `spec_musk_z1.png`, `spec_musk_z2.png`, `spec_musk_mean_with.png`.

### B.5 Caption wording
The audible start is "with", so by the repo's rule (the caption shows exactly what is heard, "..." where words were cut; r2 printed "…we are summoning the demon." the same way) the caption is
**"...with artificial intelligence, we are summoning the demon."** (`kar-musk` as built). "With artificial intelligence, we are summoning the demon." (BUILD.md, and how the press prints it) is also honest, since
"I mean," is filler and dropping it changes nothing; it is William's call. Either way the audio must start at "with".

### B.6 What is on screen
Musk in a medium close-up against a red curtain, **one continuous camera shot** 50.0-69.7 s (the first cut is at 69.74); no cutaway, no slide, no burned-in text. Mouth closed 59.5-60.5. Face centre ~(590-607, 295),
face box ~215x310 px, drift < 20 px, hair top y~40, chin ~460.

### B.7 Crops
- **Disc (r=124) and panel circle (r=220):** `crop {x:290, y:0, w:600, h:600}` = `srcFocus [0.461, 0.417]` + `srcZoom 1.2` (eyes at ~42 %). Tighter: 560 `{x:310,y:10}`, 520 `{x:330,y:30}`. Preview: `crops_musk_disc.png` (row 1).
- 4:5 panel: `{x:302, y:0, w:576, h:720}`.
- The r2 `rf-musk` crop `{x:230,y:10,w:540,h:540}` puts the face right of centre; do not reuse it.

## C. Placement

### C.1 Musk in verse 1 (replaces p-amodei / voice-amodei / kar-amodei, hb:23.5-29.5)
- Vocals (`hits.json vocal_intervals`): `[26.92,28.72]`, then verse 1 is sung continuously `[28.87,50.48]`. Under the line the sung words are "... I think that I'll die before I **drink**" (ends ~30.56),
  then "And I'm so caught up in the news" (30.6-32.46) and "Of who likes me and who hates you" (from ~32.5). The band drops out for 0.25 s at **30.56-30.82** and **32.50-32.75** (stereo content to -80 dB, vocal only):
  "With" sounds in the first gap and "demon" ends in the second.
- **Start: hb:23.5 = song 30.603** (the first word on the zoom-through's impact; the panel opens then). The stressed words then land on the grid: *intelligence* 31.323 (hb:25 = 31.329, where fx-v1-spin kicks),
  *summoning* 31.843 (hb:26 = 31.813), *demon* 32.343 (hb:27 = 32.296, the pile-news lift and circle). Speech ends 32.643, fade end 32.973.
- **The whole line fits before tr-v1-fold (hb:28.5 = 33.022):** 0.38 s of air after the last sound. The fold's lead (0.5 s) starts the crease at 32.54, during "demon", but it only acts on `pile-news` (and the eq-dpo card
  coming in) in rect [40,960,1000,620]; the panel and caption are not in its lists.
- hb:23 (30.361) would put "with" before the panel is on screen; hb:24 (30.845) pushes "demon" to 32.58-32.88, into the fold's lead.
- Duck 9 dB like voice-amodei (the sung line stays audible under it). The mix will gain the quiet clip itself; check `mix.py long3 --dry-run`.

### C.2 Bostrom closer (replaces voice-amodei-b / kar-amodei-b / kc-blue-amodei, both cuts)
Instrumental: crash at hb:112 = 73.426; the music fades over 80.05-80.40; the cover hold begins at hb:124 = 79.232; verse 2's first vocal is 80.68. (`hits.json` lists a vocal-like `[76.98,77.30]` in the instrumental;
small.en hears no words there, so it is an instrument or ad-lib; it sits under "will ever need to".)
- **Start: the first word on hb:113 = song 73.910**, i.e. `voice at song:73.83` with `audio.in 466.03` (the "m" at 73.875, the stressed vowel on the beat; 0.48 s after the crash, on the 73.90 stab).
  Long edit 67.73-71.60, short edit 29.02-32.89. **Speech ends 77.52** (fade end 77.70), 2.5 s before the fade starts (rule: at least 0.6 s), and 1.5 s before the cover hold.
- It also lines up with the existing choreography: *last* 74.90 ~ hb:115; **INVENTION 75.37 = hb:116** (the kicker lands, the square spins); **HUMANITY 76.39 ~ hb:118** (fx-re-zoom's punch, blue grow #2, chk spin);
  **MAKE 77.28 = hb:120** (the square spins). Any start on a beat gives stress words within 0.1 beat of the grid, so hb:113 is chosen for these hits.
- Alternatives: hb:114 = 74.394 (the wordmark slam on "Machine"; `at song:74.31`, ends 78.0) loses the fx-re-zoom and kicker sync; `at song:73.71` (where kc-blue-amodei started) misses the 73.90 stab.
- Caption: `kar-bostrom` t0 song:73.7, **t1 song:78.5** (0.5 s after "make." is lit, 0.25 s fade, gone by hb:123), so the cover hold at hb:124 stays clean; `kc-blue-bostrom` fades out at hb:123.4 as before.
- **Freeze the disc** (`freeze song:77.75`, the closed-mouth frame at src 469.95): his mouth moves again from 470.38, and without it the disc would mime "The machines will then be better ..." silently for 1.5 s.

## D. Dependencies in long3.json / short3.json

**Musk (long3 only; the short has no verse-1 Amodei):**
- `p-amodei` (panel, hb:23.5-29.5): named by `tr-v1-zoom.in`. `kar-amodei` (karaoke, hb:23.5-29.2): named by `tr-v1-zoom.in` (rev2_parts.py renames the chorus's copy to `kar-amodei-60` and make_long_rev2.py rewires its
  transitions, so the verse-1 id is free). `voice-amodei`: no references (mix.py cues: song 30.283-32.983, edit 24.183-26.883).
- `tr-v1-zoom` (hb:23.5): `in: ["p-amodei","kar-amodei"]` -> `["p-musk","kar-musk"]`; its _note says "Amodei is inside it behind a blue painted portal ring".
- `tr-v1-fold` (hb:28.5): `out: ["pile-news"]` stays; `in: ["eq-dpo"]` (and `tr-v1-particles.out`) is a change-5 item (eq-dpo is being removed): not mine.
- **`pile-news`** (hb:23.75-28.5) carries the CBS headline in shot 4 (`xrisk-cbs-amodei`: 'Anthropic CEO Dario Amodei says "exponential" growth of AI is a "warning sign that we need to slow down"', hl 0, hlAt hb:26.75,
  push, lift and circle at hb:27). Without Amodei's voice the headline is still a fine news shot, but **the emphasis lands on his sentence exactly while Musk says "summoning the demon"**, which reads as a mismatch. Replace shot 4
  with `security-astra-9to5` (9to5Google, 2026-09-28, "OpenAI cancels GPT-6.1 Astra release over misbehavior & safety concerns", hl 0; unused elsewhere, same wide-short footprint, a model misbehaving ~ the demon).
  Rendered: it takes the push, lift, circle and chip exactly as the CBS card did. Not `xrisk-time-culture` (TIME): its card is twice as tall and covers the caption's name line.
- Nothing else uses the "warning sign" audio. Other Amodei uses stay: the prelude `amodei` (Axios 2025), the CBS count in the chorus, 60 Minutes, two essay screens, and the refrain's "We can't yet fully close the loop." (Axios, song 63.0-65.04).

**Bostrom (both cuts; the closer items are identical in long3 and short3, same song times, `kc-blue-amodei`/`kand-re`/`fluid-re` differ only in t1 = 36.589 in the short):**
- `voice-amodei-b`, `kar-amodei-b`, `kc-blue-amodei`. Keep `kc-blue-bostrom` at the same list position (before `fluid-re`; kandclip must precede fluid on the same kand item).
- `kc-blue-amodei` relies on `kand-re`'s moves: `blue` grow hb:113.5-122.6 (x1.5, dx -30, dy -40) and hb:118-121.5 (x1.38, dx -60, dy -30); teal orbits blue hb:114..121; jumps hb:117/119/121; square spins hb:116/120; chk spins hb:118/122; river hb:116-123.
  Nothing in kand-re names Amodei, so no change there.
- `fx-re-zoom` (punch hb:118): its _note says "Dario's disc zooms up": now Bostrom's, landing on "humanity". `ghost-out` and `ghost-out-credit` ("BEHIND: STARGATE ABILENE · ORACLE · 2025", y 1448) are independent of the voice: keep.
  No stamp item exists in the closer: the name/year come from the karaoke meta line (and the cream plate under it).
- The top-level `_note` of both EDLs ends "Amodei's closer -> the cover" / "the reassembly with Amodei's closer": update the prose.
- New clip items need `prep_clips.py long3` / `short3` (cache folders p-musk, kc-blue-bostrom); a scratch EDL with these items prepped fine (p-musk 89 frames 528x528, kc-blue-bostrom 230 frames 496x496).

## E. Ready-to-use items (also in `quotes.json` -> `proposed_items`)
Modelled on the current ones (full current JSON of every replaced item: `quotes.json` -> `current_json`). Changes from the originals are in the values, not the field set.

```json
{
 "id": "voice-musk",
 "type": "voice",
 "t0": "song:30.603",
 "t1": "song:32.973",
 "src": "clips/musk-mit-2014-demon.mp4",
 "at": "song:30.603",
 "audio": {
  "in": 57.43,
  "out": 59.8,
  "fade_ms": 20,
  "duck_db": 9
 },
 "verified": true,
 "_note": "Musk, MIT AeroAstro Centennial Symposium, 24 Oct 2014: 'with artificial intelligence, we are summoning the demon.' src 57.43-59.80. 'I mean,' before it ends at 57.39 (a cut at <=57.39 leaks an 'n': small.en hears 'And with'); a cut at 57.40-57.54 hears 'With'. Speech ends 59.47, room tone to 60.62, next speech 60.66."
}
```
```json
{
 "id": "p-musk",
 "type": "panel",
 "t0": "hb:23.5",
 "t1": "hb:29.5",
 "prep": "clip",
 "src": "clips/musk-mit-2014-demon.mp4",
 "in": 57.43,
 "speed": 1,
 "oversample": 1.2,
 "shape": "circle",
 "frame": {
  "cx": 540,
  "cy": 540,
  "r": 220
 },
 "srcFocus": [
  0.461,
  0.417
 ],
 "entry": "cut",
 "out": {
  "style": "iris",
  "dur": 0.24
 },
 "border": "paint",
 "color": "#2346FF",
 "borderDelay": 0.1,
 "kb": {
  "z": [
   1.0,
   1.12
  ],
  "pan": [
   10,
   0
  ]
 },
 "grade": {
  "sat": 0.75,
  "contrast": 1.06,
  "brightness": -0.02,
  "grain": 0
 },
 "pulse": [
  "hb:24",
  "hb:25",
  "hb:26",
  "hb:27"
 ],
 "pulseAmt": 0.025,
 "credit": "MIT AEROASTRO CENTENNIAL · OCT 24, 2014",
 "creditAt": [
  74,
  274
 ],
 "_note": "crop = {x:290,y:0,w:600,h:600} (srcFocus [0.461,0.417] + srcZoom 1.2); picture in 57.43 at hb:23.5 = lip sync with voice-musk (same offset, song = src - 26.827); one continuous shot 50-69.7 s. credit: 'ELON MUSK · MIT AEROASTRO CENTENNIAL SYMPOSIUM · OCT 24, 2014' (62 chars) overflows the left edge of the frame (rendered in a scratch EDL: it starts at 'IT AEROASTRO'), and even the 49-char 'MIT AEROASTRO CENTENNIAL SYMPOSIUM · OCT 24, 2014' runs 30-1035 px, past the 60 px safe margin (about 22 px per mono char, so keep the chip <= 44 chars): the chip is the 39-char 'MIT AEROASTRO CENTENNIAL · OCT 24, 2014' and kar-musk's name line carries 'Elon Musk, SpaceX & Tesla CEO · 2014'.",
 "creditCps": 120,
 "srcZoom": 1.2
}
```
```json
{
 "id": "kar-musk",
 "type": "karaoke",
 "t0": "hb:23.5",
 "t1": "hb:29.2",
 "x": 72,
 "y": 790,
 "w": 940,
 "size": 46,
 "speech": {
  "in": 57.43,
  "at": "song:30.603",
  "words": [
   {
    "w": "…with",
    "s": 57.43
   },
   {
    "w": "artificial",
    "s": 57.58
   },
   {
    "w": "intelligence,",
    "s": 58.15
   },
   {
    "w": "we",
    "s": 58.49
   },
   {
    "w": "are",
    "s": 58.6
   },
   {
    "w": "summoning",
    "s": 58.67
   },
   {
    "w": "the",
    "s": 59.03
   },
   {
    "w": "demon.",
    "s": 59.17
   }
  ]
 },
 "name": "Elon Musk, SpaceX & Tesla CEO",
 "year": "2014",
 "metaAt": "hb:24.5",
 "metaPx": 28,
 "metaGap": 14,
 "roll": {
  "dim": 0.55
 },
 "marks": [
  {
   "phrase": "summoning the demon.",
   "style": "underline",
   "at": "song:31.85",
   "color": "#F2C300",
   "dur": 0.3,
   "width": 7
  }
 ],
 "exit": {
  "style": "fade",
  "dur": 0.18
 },
 "theme": "dark",
 "_note": "Caption '…with artificial intelligence, we are summoning the demon.' (leading ellipsis because 'I mean,' is cut; BUILD.md writes 'With ...' without it: either is honest, the audible start is 'with'). Underline lands as 'summoning' is said (hb:26 = 31.813)."
}
```
`pile-news`: in `shots`, id `xrisk-cbs-amodei` -> `security-astra-9to5` (keep `hl: 0`, `hlAt`, `push`, `emph`). `tr-v1-zoom`: `"in": ["p-musk", "kar-musk"]`.

```json
{
 "id": "voice-bostrom",
 "type": "voice",
 "t0": "song:73.83",
 "t1": "song:77.70",
 "src": "clips/bostrom-ted-2015-full.mp4",
 "at": "song:73.83",
 "audio": {
  "in": 466.03,
  "out": 469.9,
  "fade_ms": 25
 },
 "verified": true,
 "_note": "Bostrom, TED2015: 'Machine intelligence is the last invention that humanity will ever need to make.' src 466.03-469.90 (room tone only before 466.06 and from 469.76 to 470.36; the next word 'The' starts 470.38). First word 'Machine' (acoustic onset 466.075) sounds at song 73.875, its stressed vowel on hb:113 (73.910)."
}
```
```json
{
 "id": "kar-bostrom",
 "type": "karaoke",
 "t0": "song:73.7",
 "t1": "song:78.5",
 "x": 72,
 "y": 252,
 "w": 940,
 "size": 52,
 "style": {
  "serif": true
 },
 "font": {
  "weight": 600
 },
 "speech": {
  "in": 466.03,
  "at": "song:73.83",
  "words": [
   {
    "w": "Machine",
    "s": 466.08
   },
   {
    "w": "intelligence",
    "s": 466.28
   },
   {
    "w": "is",
    "s": 466.93
   },
   {
    "w": "the",
    "s": 467.04
   },
   {
    "w": "last",
    "s": 467.1
   },
   {
    "w": "invention",
    "s": 467.57
   },
   {
    "w": "that",
    "s": 468.17
   },
   {
    "w": "humanity",
    "s": 468.59
   },
   {
    "w": "will",
    "s": 468.92
   },
   {
    "w": "ever",
    "s": 469.05
   },
   {
    "w": "need",
    "s": 469.21
   },
   {
    "w": "to",
    "s": 469.4
   },
   {
    "w": "make.",
    "s": 469.48
   }
  ]
 },
 "name": "Nick Bostrom, Oxford philosopher",
 "year": "2015",
 "metaAt": "song:74.1",
 "metaPx": 28,
 "metaGap": 12,
 "roll": {
  "dim": 0.62
 },
 "marks": [
  {
   "phrase": "the last invention",
   "style": "underline",
   "at": "song:75.45",
   "dur": 0.22,
   "color": "#FF2E88"
  },
  {
   "phrase": "ever need to make.",
   "style": "underline",
   "at": "song:77.35",
   "dur": 0.22,
   "color": "#15131F"
  }
 ],
 "exit": {
  "style": "fade",
  "dur": 0.25
 },
 "theme": "light",
 "plate": {
  "color": "rgba(242,235,221,0.9)",
  "pad": 14
 }
}
```
```json
{
 "id": "kc-blue-bostrom",
 "type": "kandclip",
 "item": "kand-re",
 "piece": "blue",
 "t0": "hb:112.75",
 "t1": 75.3,
 "prep": "clip",
 "src": "clips/bostrom-ted-2015-full.mp4",
 "in": 465.988,
 "frame": {
  "cx": 540,
  "cy": 960,
  "r": 124
 },
 "oversample": 2.0,
 "srcFocus": [
  0.54,
  0.28
 ],
 "zoom": [
  1.0,
  1.08
 ],
 "grade": {
  "sat": 0.85,
  "contrast": 1.08,
  "grain": 0
 },
 "tintK": 0.12,
 "out": "hb:123.4",
 "fadeOut": 0.3,
 "srcZoom": 1.8,
 "freeze": "song:77.75",
 "_note": "crop = {x:491,y:2,w:400,h:400} of the 1280x720 frame (srcFocus [0.54,0.28] + srcZoom 1.8); face centred, shoulders and the red TED stage in the disc; picture time = audio time (in 465.99 at hb:112.75 = song 73.790); freeze holds the closed-mouth frame (src 469.95) so the disc does not mime his next sentence (his mouth moves from 470.38); tintK 0.12 (was 0.2) because the stage is red, judge by eye."
}
```

## F. Open points
- Musk caption: with or without the leading ellipsis (B.5).
- The credit chip uses "MIT AEROASTRO CENTENNIAL" (39 characters); the full event name "MIT AeroAstro Centennial Symposium" only fits in a post caption.
- Bostrom's venue (Vancouver) is from the event listing, not the talk page; "TED2015" alone is fully sourced.
- IS / THE / LAST / THAT / EVER / NEED are +-0.06 s: judge the karaoke by ear once rendered.

Scratch evidence (not in the project): `/tmp/claude-0/-home-user/a99e0376-0534-5e3e-8b47-ccbc03821dfd/scratchpad/hp3/quotes/`: `spec_*.png` (spectrograms with word marks), `crops_*.png` (disc and panel crops),
`sheet_zq2.png` / `sheet_zq3.png` (Musk verse-1 layout in a scratch EDL), `sheet_zq.png` and `still_bostrom_70.35_s.png` (Bostrom closer), `sheet_l3_v1.png` / `sheet_l3_close.png` (the same frames in long3 for comparison),
`sheet_*_frames.png` (frames across both lines), `pile_candidates.png`, `astra.png`.
