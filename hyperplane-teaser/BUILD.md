# Build brief: Hyperplane × "brutal" (short teaser + long version)

Read `README.md` (the handover) first; this file records what was measured and decided since, and overrides it where they differ.

## REVISION 2 (William, 10 Oct 2026, after watching both cuts; overrides everything below where they differ)
William: "This is quite good but I think it can be improved." His points, as direction:
- **Brand:** Hyperplane is the podcast of **The Cornell Gradient**, a newspaper. The kicker "A CORNELL GRADIENT PODCAST" is correct (`brand/cornell-gradient-masthead.png` exists if useful).
- **Structure: both cuts now open with the prelude.** William likes the gentle-music prelude with Sam Altman (2015) and Dario Amodei (2025) talking; both cuts get it (song 6.10 → drop at 19.232 = edit 13.132).
  - **Long = the intro cut, continuous:** song 6.10 → ≈80.4 (≈74.3 s), with no splices. Its no-song version starts the track at song 6.10 (album ≈0.05).
  - **Short = the spliced cut as now:** prelude → riff → splice (edit 20.377, song 26.477 → 65.188) → refrain end → instrumental (≈35.6 s).
  - **Keep the original footage.** No background keying/removal on any clip (the r4 key on Amodei's Axios wall and Altman's Airbnb stage is to be removed: show the real scene, other people and event branding included). Cropping/framing is fine; burned-in third-party subtitles may be cropped out.
- **"it's brutal out here" appears exactly when it is sung**, word by word with the vocal. Refined on the demucs vocal stem (song/hits.json words.brutal_out_here): "God," 71.456, "It's" 72.012, "brutal" 72.339 (the "b" burst; land the paint ≈72.34–72.47), "out" 72.798 (±70 ms), "here" 73.099–73.441. This is in both cuts, and it is the one lyric allowed on screen (William's request). It is removed from the breath; the breath (song 18.25–19.05, after Olivia's spoken "I want it to be, like, messy", which is never captioned) is visual only.
- **More dynamism, like a music video: something visually striking on EVERY beat** (≈0.484 s from the drop; bar downbeats bigger; 8th notes for text). No static holds: every item moves while on screen. The prelude is gentler but still alive (slow push-ins, drawing-on, captions rolling out with the speech, accents on the intro's ~0.49 s pulse, which swells from ≈15 s). William's ideas:
  - the logo's circles orbit each other, objects rotate or jump;
  - the hyperplane becomes a river with vectors swimming through it;
  - a flashy superposition of vectors;
  - equations dropped on the beat (e.g. the GRPO objective);
  - animated graphs drawn on the beat, e.g. data-centre build-outs ("a really good one").
- **Text is never dumped as a paragraph.** Roll it out (word by word, like the Bostrom quote) and/or highlight it dynamically (marker sweep, bold-on, pencil underline/circle), or both, so the viewer's eye is led around. Speech captions light up word by word as spoken.
- **Real screenshots of headlines, as in William's deck**, wherever possible, not retyped text cards. Highlight or roll out the relevant words on the real screenshot (OCR-located). Dump several headline screenshots into a frame on the beats, overlapping slightly, then emphasize one phrase with a highlighter or bold at the end: AI should feel overwhelming in its speed.
- **Images or related video footage in every frame** (except the final cover hold, which must match `brand/hyperplane-cover-3000.png`), so the viewer is constantly stimulated: b-roll from the deck's videos and clips, photos, screenshots.
- **Prefer newer results (2024–2026).** Major older results (e.g. AlphaGo) are fine sparingly.
- **Handmade, skeuomorphic texture:**
  - paint-splatter artifacts (reference: the "upping my p(doom)" music video);
  - things penciled in or drawn frame by frame (line boil on twos);
  - things **painted stroke by stroke** (William: "would be awesome").
  Hypermodern but artistic, in the Kandinsky atmosphere. "More dynamism and motion is always better."
- **William's later ideas (creative license: "whatever as long as it's cool and dynamic"). Engine builder D owns these, in fx/transitions.js, fx/singularity.js and fx/fluid.js:**
  - **Self-improvement loop, then the singularity:** a sequence visually like the deck's intelligence-explosion loop: a ring of nodes with a glowing pulse circling, each lap faster than the last.
    - Sources: `/home/user/poster/ai-safety-presentation/assets/art/loop_explosion.gif`, `tools/make_loop_gif.py` and `explosionSlide` in the deck's tools; the Splash slide "AI that builds better AI" shows the same loop.
    - Lock the laps to the music: 2 bars, 1 bar, 2 beats, 1 beat, 8ths.
    - Then the loop COLLAPSES INTO A BLACK HOLE (the singularity): an accretion-disk swirl, the frame warped around it (lensing), and everything on screen (shapes, screenshots, vectors) spiralling in.
    - Suggested placement (planners may move it): build the loop through the refrain (song ≈57.98-69.6). The black hole swallows everything just before "God, it's brutal out here" (≈70-71.9), which is the moment everything clears. "it's brutal out here" is then painted over the dark. In the instrumental (73.42) the logo bursts back out of the black hole and reassembles into the cover.
  - **Fluid logo colour:**
    - The logo's shapes are not flat. Their colours swirl and flow inside each shape (marbling, domain-warped flow, liquid paint), staying in each shape's hue family.
    - Their boundaries wobble organically, like liquid edges.
    - Everything settles to the exact flat cover colours and edges for the final hold, so the last frame still matches the cover.
  - **Transitions (William: "folding, zooming or illumination, or shattering into pieces or particles. Feel free to be creative"):** beat-locked transitions between items and sections, for example:
    - paper fold / origami fold-away and unfold-in (with lighting);
    - zoom-through into a detail that becomes the next shot, whip/spin zoom;
    - illumination: light sweep, bloom flash, light leak in the palette;
    - shatter into shards that fly and fall;
    - dissolve into paint/dot particles that swirl and re-form as the next item;
    - a brush-stroke paint wipe; an iris through Kandinsky shapes; a page turn.
    Use them often: most item changes should be a transition, not a cut.
  - **Neural-net candy (William: "some animation of a neural net or some other architecture doing backprop or inference too as visual candy (and any relevant equations)"):** engine builder B (fx/netviz.js) owns it.
    - Inference: activations flow forward on the beats.
    - Backprop: gradients flow back and the weights update.
    - Attention: arcs between tokens.
    - Each is paired with its exact equations (forward pass, backprop, the update rule, attention).
    - **Make the hero version 3D (William: "There are gorgeous 3D animations online of transformers or resnets we can emulate for this").** Emulate the look (not the assets) of Brendan Bycroft's 3D LLM visualization, 3Blue1Brown's transformer videos and 3D network fly-throughs: glowing tensor blocks, a camera fly-through, attention heads fanning out, the residual stream as a river, and skip connections. Do it in three.js if it renders deterministically, with handmade accents.
- **Unchanged rules:**
  - **Audio (updated by William: "do not be afraid to superimpose audio clips while the music is playing"):** audible clip audio over the music is welcome everywhere, not only in the vocal-free stretches. Speech, news sound bites and other short clips can play over the song, under sung lines too.
    - Keep each snippet short and punchy, and keep it intelligible: duck the music under it, or drop the snippet into the gaps between sung lines (song/hits.json vocal_intervals) where possible.
    - The words are always on screen too (karaoke caption or pull-quote), so they read even where the music masks them.
    - Two voices may overlap only briefly, as a deliberate effect.
    - mix.py's old "no speech under vocals" guard is lifted.
    - The no-song versions carry all the clip audio.
  - Captions and quotes stay verbatim, with "…" at cuts, and each carries a name and year.
  - Never change a meaning (keep conditionals and baselines).
  - Graphs use cited data with a source line. Equations are exact from the cited paper.
  - Screenshots are real (from the deck or captured from the original page), never fabricated or re-typeset to look like a screenshot.
  - The music is out before verse 2 (80.68).
  - Loudness ≈ −12 LUFS, TP ≤ −1 dBTP on the encoded file.

## UPDATE (William, latest; overrides the "short/long" notes below)
Both versions END in the instrumental after the first refrain (song 73.64 → 80.68; verse 2's first vocal is at 80.68, so the music must be out by ≈80.4), and they differ only by where they START:
- **Intro cut** (≈72–74 s): starts at song 6.10. Quiet-intro montage → the breath ("it's brutal out here") → the drop.
- **Drop cut** (≈59–61 s): the same edit from the drop on, opening cold at song 19.232.
Creative direction from the drop on (shared by both): the logo FORMS explosively on the riff as the title (plane slams on the downbeat, shapes pop on beats, wordmark and kicker land, as in the original short spec). At verse 1 (≈ song 26.8) it BREAKS APART: the shapes and the plane become the containers for the news (the yellow plane band as a 22° headline ticker, circles and squares as clip masks and frames), carrying lyric-correlated headlines and clips through verse 1, the chorus and the refrain (darker for the verse, full colour for the chorus and refrain). On the refrain's "God, it's brutal out here" (song 71.94–73.64) everything clears, and in the instrumental the pieces fly back and REASSEMBLE into the full logo (cover composition), which holds to the end. No lyrics on screen. Deliverables per cut: with song, with song clean (explicit word at 44.88–45.22 dipped), and no-song (clip speech only).
The ≈20.6 s "short" EDL described below is now the first segment of the intro cut (draft stage only).
Ending (William): end on the refrain's "God, it's brutal out here" + the instrumental (his suggestion; chosen).
MUSIC splicing (William: "for the short one, you are also free to splice the music if convenient"). Resulting plan:
- **Short = the intro cut, spliced** (target ≈30–40 s): intro montage (song 6.10→) → breath "it's brutal out here" → drop at song 19.232 with the logo forming on the riff → a bar-aligned music splice from the end of the riff (before verse 1's first vocal at ≈26.8) into the last lines of the first refrain (around song 63.9–65.0, the "golden years / disappear / ego crush" lines) → "God, it's brutal out here" (71.94–73.64) → the instrumental, ending ≈80.4 on the reassembled logo. The editor picks the exact splice points: cut on downbeats, matched beat phase, 10–40 ms crossfade, no vocal straddling the cut; verify with onsets/RMS and list the splice points in out/NOTES.md, since William must judge them by ear.
- **Long = the drop cut, continuous** (≈61 s): song 19.232 → ≈80.4, no splices, the full lyric-correlated montage.
(If a splice can't be made clean, fall back to the unspliced intro cut ≈72 s and say so.)
Quote trimming in clips is fine too, with these honesty rules: never change a speaker's meaning; the caption shows exactly what is heard, with "…" where words were cut; don't join words from different answers; keep each speaker's name and year on screen.

## Two deliverables, one engine
- **Short teaser** (the handover's spec): song 6.10 → ≈26.70 s, about 20.6 s long. Montage → "it's brutal out here" → drop → logo.
- **Long version** (later): starts at the **first beat drop** (song 19.232, "roughly 14 s in" on the album) and fills the rest of the song, to the end of the music, with headlines and clips; William gave creative license. **On-screen content correlates with the lyrics** (they read as AI frustrations), but lyrics themselves never appear on screen; per-line sourced candidates live in `research/long/lyrics/*.json`. **It ends around song 80 s** (William, with license): the natural end is the instrumental after the first refrain's "God, it's brutal out here" (sung at song 71.94–73.64), before verse 2's first vocal at song 80.68. So the long version runs song 19.232 → ≈80.5 (≈61.3 s), covering the drop riff, verse 1, the chorus, the refrain, and the instrumental tail, with the full logo forming on that instrumental and holding to the end. No verse-2 vocals may be audible. Plan: open on the drop with the cream Kandinsky world and first headlines on the riff, then darker verses and a full-colour chorus and refrain, and close on "God, it's brutal out here" → logo. Lyric line timings (song time, one line per bar ≈ 1.95 s; whisper word times, which run early at segment starts): see `song/full-map.json`. Explicit word: "fucking" at song 44.88–45.22. Make a clean audio variant too (the explicit word in the chorus dipped out). Built on the same engine with a different edit list.
- So build ONE engine page, `render/video/teaser.html`, driven by an edit-decision list (EDL) JSON chosen by query string: `teaser.html?edl=short` loads `render/video/edl/short.json`. Keep the page contract: `render(t)`, `window.DURATION` (from the EDL), `window.__ok = true` once loaded, and `window.__err` on failure.
- Item types the engine must support (extend as needed, but keep them data-driven): `clip` (video frames from a pre-extracted frame folder, with an in-point, a duration, a crop/zoom, a grade, a caption and a year stamp), `headline` (Newsreader serif headline plus a mono attribution line `OUTLET · MON D, YYYY`), `quote` (a quote card for quotes with no usable footage: speaker, year, verbatim text, source line), `text` (e.g. the breath line), and `logo` (the Kandinsky logo formation, parameterized by its start time and a beat grid). Items carry `t0`, `t1` and enter/exit styles; beat-locked entrances snap to the beat grid in the EDL.

## Timing facts (measured on William's file, `song/brutal.mp3`, 173.30 s; see song/song-map.md and song/full-map.*)
- Edit time = song time − 6.10 for the short version (the file's first 6.05 s is a music-video prelude, not the song).
- Quiet intro: song 6.10 → 18.20, with a ~0.49 s pulse that gets louder from ~15 s.
- **The song has a spoken line during the "breath":** Olivia says "I want it to be, like, messy" at about song 17.66 → 19.0 (edit 11.56 → 12.9). It is not a sung lyric, and it isn't explicit. Consequence: **no clip speech after edit ≈ 11.4**, so the two voices never overlap. Do NOT caption it (no song words on screen).
- Breath (near-silence): song 18.25 → 19.05 (edit 12.15 → 12.95).
- Riff pickup: onset at song 19.116 (a 16th before the downbeat). **Drop downbeat: song 19.232 = edit 13.132** (energy −23 → −10 dB by 19.20). Verify by eye on the waveform; one frame matters.
- Riff beats (song time; onsets): 19.743, 20.225, 20.712, 21.177, 21.670, 22.158, 22.639, 23.121, (23.62), 24.097, (24.58), 25.054, 25.542, (26.03), 26.511. Mean beat ≈ 0.4839 s (≈124 BPM). Use the grid `19.232 + k·0.4839` snapped to the nearest measured onset within 30 ms.
- Verse vocals start at song 26.82 ("I'm so in-…"), and the level drops at 26.80. **The short version's audio must end by song 26.75 (edit 20.65)**: hold the logo, end on the last riff hit (song 26.511) or fade over the final 0.2 s. No verse vocals audible.

## Frame timing
- `render/video/frames.py` renders frame i at `t = i/fps + 1/fps` (one frame late). For the deliverables, render **frame i at t = i/fps** exactly, so the picture lines up with the audio sample-for-sample; fix it in your render script.
- 1080×1920 at 30 fps; frame 394 begins at edit 13.133 s, which is the drop.
- Don't write thousands of PNGs to disk (the disk allowance is limited). Stream screenshots straight into ffmpeg (`-f image2pipe`), or write JPEG q95 into a folder and delete it after encoding.

## Clips (all in `clips/`; never commit them, or the song)
- `coxon-daily-show.mp4`: 1280×720, 26:00, Jacob Coxon on The Daily Show (Oct 2026). Transcript: `clips/transcripts/coxon.json` (base.en; re-check with small.en). The line is at ≈521.9–524.9 s: "So, I heard you talking about jobs, and I think, like, there will be no jobs." Caption only what's heard: e.g. "I THINK, LIKE, THERE WILL BE NO JOBS." (verify word-accurate start/end with `transcribe.py … small.en 518 10`).
  - **Record (r7): this first take is not used in either cut.** Stewart talks over its last word, so from the first draft the short
    used Coxon's restatement at **528.82–530.12 s, "There won't be jobs in this world."** (528.78 at first; 528.82 from final pass 1,
    so the trimmed "Yeah," tail is not heard), trimmed in r5 to "…There won't be jobs…" (528.82–529.655, picture frozen after
    "jobs"). In r6 Coxon left the short altogether (out/NOTES.md, "Short cut, round 6"). The only Coxon footage in the current
    edits is the long cut's chorus clip, 451.75–454.17 s, muted, with his words "…and it did it again." as a pull-quote.
- `feynman-1985.mp4`: 854×480, 18:27, "Richard Feynman: Can Machines Think?" (1985). Transcript: `clips/transcripts/feynman.json`. The line is at ≈1067.4–1076 s (base.en): "So I think that we are getting close to intelligent machines, but they're showing the necessary weaknesses of intelligence, all right?" Get word-accurate in/out with `transcribe.py … small.en 1064 14`; for the teaser, cut to "I think that we are getting close to intelligent machines".
- Amodei (Axios AI+ DC Summit, 17 Sep 2025): pending research (`research/verify/amodei-*.json`). If there is no footage, make a quote card: "There's a 25% chance that things go really, really badly." Check the exact wording in the research file.
- Altman 2015: quote card; the wording and attribution are pending (`research/verify/altman-2015.json`).
- Headlines: pending verification (`research/verify/hl-*.json`, `research/verify/deck-headlines.json`). Until then use `research/sources.md` and mark the items `"verified": false` in the EDL.
- Helper scripts (outside the repo): `/tmp/claude-0/-home-user/a99e0376-0534-5e3e-8b47-ccbc03821dfd/scratchpad/hyperplane/transcribe.py` (faster-whisper with word timestamps: `media out.json model [start] [dur]`) and `y2dl.py` (YouTube download via y2mate.gs).

## Look (from the handover)
- Montage: near-black `#0E0D12`; clips desaturated, high contrast, light grain; captions in IBM Plex Mono, uppercase, white, with a red `#B31B1B` accent; headlines in Newsreader with a mono attribution line; a year stamp on every item; no outlet logos or page imitations, plain text attribution only.
- Breath: black, "it's brutal out here" in white (William's exact words, lowercase as written), held through the silence.
- Drop: hard cut or a one-frame white flash into the cream (`#F2EBDD`) Kandinsky world. The logo forms on the riff: plane slams on the downbeat (camera shake), shapes pop on beats, the wordmark slams in on bar 3 with the H crossbar tilting, the kicker on bar 3.5, then hold. The final frame matches `brand/hyperplane-cover-3000.png` (the layout of `render/hp/kand_e.html` / the end of `anim.html`). Art and type must not intersect, or if they do there must be no odd gaps. Catchy and explosive.

## Audio
- Song from 6.10. Clip speech goes on top; duck the song by a few dB under speech; speech must stay intelligible on a phone speaker (high-pass ~100 Hz, gentle compression, presence boost).
- Loudness: about −11 to −14 LUFS integrated; true peak ≤ −1 dBTP **measured on the encoded AAC** (`ffmpeg -i out.mp4 -af ebur128=peak=true -f null -`). Lower the gain and re-encode until it passes.
- Encode: H.264 `-crf 17 -pix_fmt yuv420p -profile:v high -movflags +faststart`, AAC 256k, 1080×1920, 30 fps.
- Outputs go in `out/`: `hyperplane-brutal-teaser-9x16.mp4` (with the song) and `hyperplane-brutal-teaser-no-song-9x16.mp4` (clip speech only; William adds "brutal" from the app's music library, so record in `out/NOTES.md` where the drop falls and at what song offset to start the track).
