# Hyperplane teaser: handover for Claude Code

You're picking up a video project from a Claude session that ran in a cloud workspace with no access to YouTube or most of the web. You run on William's computer, with normal internet, so you can do what that session couldn't: **download the clips and his slides, then build and render the video.**

Read this whole file before starting. `research/sources.md` has every quote and headline with its source. `song/song-map.md` has the measured song timings.

---

## 1. Context

- **The Cornell Gradient** is an AI news publication William is starting at Cornell, styled like the Cornell Daily Sun. Its logo is a serif masthead with a red ∇ (`brand/cornell-gradient-masthead.png`, red `#B31B1B`).
- **Hyperplane** is its companion podcast. The logo is a Kandinsky-style composition on cream (`brand/hyperplane-cover-3000.png`): a yellow plane band at 22°, colored shapes, the custom "Hyperplane" wordmark (Unbounded Bold, with the H crossbar tilted to the plane's angle), and the kicker "∇ A CORNELL GRADIENT PODCAST".
- **The existing logo reveal** (`render/video/anim.html`, reference renders in `render/video/reference/`) is a 9:16 animation where the logo forms from points → lines → plane → shapes → "INTRODUCING" → wordmark. **William loves this animation.** Three soundtracks for it were rejected:
  - generic house: "elevator music"
  - a synthesized K-pop track with sung "Hy-per-plane": "robotic"
  - an instrumental version of that track: "still very synthetic"
- So the new direction uses a **real song: Olivia Rodrigo's "brutal"**, and a new concept.

## 2. The concept (William's words, lightly edited)

> Show a bunch of scary headlines and videos of AI events, like the Hugging Face attack, overlaid with clips: Feynman talking about the possibility of AI, Altman with his notorious "AI will probably kill us, but…" quote, Coxon saying there will be no jobs, Dario on extinction. Then the words "it's brutal out here", the beat drops, and then we show the logo.

The song happens to fit this structure almost exactly (measured in `song/song-map.md`):

| Song time (s) | Edit time (s) | What's happening in the song | What's on screen |
|---|---|---|---|
| 6.10 → 18.20 | 0.00 → 12.10 | quiet, tense intro (~123 BPM pulse) | **the montage**: headlines + clips |
| 18.25 → 19.05 | 12.15 → 12.95 | near-silent breath (−37 to −49 dB) | **"it's brutal out here"** |
| 19.12 (pickup), **≈19.23 downbeat** | 13.02 / **13.13** | the guitar riff slams in | hard cut to cream: **the logo forms** |
| 19.23 → ≈26.7 | 13.13 → ≈20.6 | riff, 4 bars, beats every ≈0.4875 s | logo builds on beats, then holds |
| ≈26.8 | ≈20.7 | **first verse begins: vocals with explicit language** | **the video must be over by now** |

**Edit time = song time − 6.10** (the first 6.05 s of William's file is a music-video prelude, not the song). If his file differs (a different rip or the album version), **re-run `song/song_map.py`** and re-derive every number. Don't trust these blindly.

## 3. Step 0: get the materials

**Tools:** `ffmpeg`, `yt-dlp`, Python 3 with `pip install playwright pillow numpy librosa pyloudnorm` (plus `playwright install chromium`), Node (`cd render && npm install` for the fonts). Whisper (`pip install openai-whisper` or `faster-whisper`) is useful for finding quote timestamps.

1. **The song.** William already has it: `YTDown.com_YouTube_Media_OGUy2UmRxJ0_Olivia-Rodrigo-brutal-Official-Video_009_128k.mp3`. Copy it to `song/brutal.mp3`. **Never commit it**; `.gitignore` excludes `song/*.mp3`, `song/*.wav` and `clips/`.
2. **The clips** go in `clips/`. Download full videos, then transcribe them with whisper to find the exact line and its timestamps.
   - **Jacob Coxon on The Daily Show:** `yt-dlp -o "clips/coxon-daily-show.%(ext)s" "https://youtube.com/watch?v=lnLDjXy2kRA"`. The line: "I think there will be no jobs." Optional second cut: "…gambling with our lives." The wording comes from a secondary article; **confirm it against the audio.**
   - **Feynman, 1985 lecture:** `yt-dlp -o "clips/feynman-1985.%(ext)s" "https://www.youtube.com/watch?v=ipRvjS7q1DI"`. The line: "I think that we are getting close to intelligent machines…"
   - **Dario Amodei, Axios AI+ DC Summit, 17 Sep 2025** (with Jim VandeHei): "There's a 25% chance that things go really, really badly." The cloud session couldn't find the video. Search Axios's site and YouTube. If you can't find it, make a quote card.
   - **Sam Altman, 2015:** no recording was found; it seems to exist only as a reported quote. Make a quote card unless you find primary audio or video. Pin down the original source and wording first (see `research/sources.md`).
3. **William's slides:** https://williamliaw.com/aisafety, his own 117-slide talk "AI Safety and Existential Risk", with every claim sourced. The page's ".pptx" download button is JS-driven. Get the deck via the page, from William directly, or from the blog repo (`william590y/blog` on GitHub may contain it). Use it for extra events and headlines. **His slides are the preferred source for "scary headlines"**, and the Hugging Face headlines in `research/sources.md` are verified backups.

## 4. Build the teaser

Make a new page `render/video/teaser.html` that follows `anim.html`'s contract: a `render(t)` function, `window.DURATION`, and `window.__ok = true` once loaded. Then render it with `PAGE=teaser.html python3 render/video/frames.py all 30`. Video clips can't play inside the headless page frame-accurately, so either:
- (a) render the graphics as transparent/overlay PNG frames and composite the clips in ffmpeg, or
- (b) pre-extract clip frames with ffmpeg (`-vf fps=30`) and draw them as `<image>` elements in the page at `t`.

(b) keeps all the timing logic in one place.

### 4a. Montage (edit 0.00 → 12.10): dark, tense
- **Suggested order: chronological escalation**, from "someday" to "now". Put a year stamp on every item; it reads better and keeps the quotes honest.
  1. **Feynman (1985)**, around 2.5 s
  2. **Altman (2015)**, a quote card, around 2 s
  3. **Amodei (2025)**, around 2.5 s
  4. **Hugging Face attack (Jul 2026)**: 3–4 real headlines slamming in one per beat, around 2.5 s
  5. **Coxon (Oct 2026)**: "I think there will be no jobs.", around 2.5 s
- That totals about 12 s, which is tight. If the clips run long, you can **extend the intro by looping whole bars** (1 bar ≈ 1.95 s). Crossfade on bar lines and check by ear. You can also put a short cold open before the music.
- **Look:**
  - near-black ground (`#0E0D12`)
  - clips desaturated, high contrast, light grain
  - captions in IBM Plex Mono, uppercase, white, with a **red `#B31B1B`** accent (the Gradient's red)
  - headlines set in **Newsreader** (the Gradient masthead serif), with a mono line under each: `REUTERS · JUL 24, 2026`
  - **Don't imitate the outlets' logos or page designs.** Plain text attribution only.
- **Captions must be verbatim**, matching what the person actually says in the clip, with name and year. Don't caption Amodei's line as "extinction"; he said "really, really badly". **Don't put any song lyrics on screen.**
- **Audio:** each clip's speech sits over the quiet intro. Duck the song a few dB under speech and keep the speech intelligible on a phone speaker.

### 4b. The breath (edit 12.15 → 12.95)
- Black screen, the near-silence in the song. The words **"it's brutal out here"** (William's line, his exact words) in white. They can type in, or land word by word on the last beats before the breath. Hold them still through the silence.

### 4c. The drop (edit ≈13.02–13.13 → end)
- Hard cut, or a one-frame white flash, from the dark montage into the **cream Kandinsky world**. That color payoff is the whole point.
- **Retime the existing logo formation** from `anim.html` (built at 128 BPM over 9 bars) into about 4 bars at ≈123 BPM:
  - **downbeat:** the plane slams in (with a camera shake, as `anim.html` already does on HITS)
  - **beats 2–8:** shapes pop in on beats
  - **bar 3:** the wordmark slams in and the H crossbar tilts
  - **bar 3.5:** the kicker
  - **hold to the end**, ending on the full logo, matching `brand/hyperplane-cover-3000.png`
- `anim.html`'s timing is all in `T(bar, beat, sixteenth)` with `BPM = 128`, and its camera hits come from `kpop/sync.json`. For the teaser, set `BPM ≈ 123` and **derive the hits and beats from `song/song-map.md`**, not from `sync.json`.
- "INTRODUCING" is optional here. The breath line replaces it.
- Find the riff beats by onset detection (`song/song_map.py`). The grid ≈ `19.23 + k·0.4875` s song time is an estimate; **verify the drop frame by ear.** One frame (33 ms) early or late is noticeable.
- **End before ≈26.8 s song time** (≈20.7 s edit). Fade the music over the last ~0.2 s, or end on a riff hit. **No verse vocals may be heard.**

### 4d. Render and mux
- 1080×1920, 30 fps, H.264 `-crf 17 -pix_fmt yuv420p -profile:v high -movflags +faststart`, AAC 256k.
- **Two deliverables:**
  1. `hyperplane-brutal-teaser-9x16.mp4`: with the song
  2. `hyperplane-brutal-teaser-no-song-9x16.mp4`: clip speech only. This is for posting with "brutal" added from Instagram's or TikTok's music library; give William the exact song-time offset to start it at.
- **AAC overshoots true peak.** On the earlier track it added about 2 dB, so measure the encoded file with `ffmpeg -af ebur128=peak=true`, and lower the gain before encoding until it's ≤ −1 dBTP. Aim for about −11 to −14 LUFS integrated.

## 5. Checks before you hand it back
- [ ] Every caption matches the audio word for word. Every headline matches its source exactly (outlet, date). Every person and year is correct.
- [ ] The drop lands on the riff downbeat (check frame by frame against the waveform), and the shapes land on beats.
- [ ] No verse vocals or explicit lyrics are audible; the video ends before ≈26.8 s song time.
- [ ] Look at a contact sheet (`PAGE=teaser.html python3 render/video/frames.py sheet 0.5 2 4 6 8 10 12.4 13.2 14 15 17 20`).
- [ ] Speech is intelligible on a phone speaker, and the true peak is ≤ −1 dBTP after encoding.

## 6. Working with William
- He likes an **ensemble-of-critics loop**: spawn 3 critic subagents with different lenses (e.g. motion designer, social-video editor, editorial/fact-check), iterate until they score ~9/10, and show him drafts along the way.
- Critics can't hear audio. Previous soundtracks passed the critics and failed when William listened. **He has to listen and judge the audio himself**, so say so when you deliver.
- Design rule he set for the logo: **art and type must not intersect, or if they do, there must be no weird gaps.**
- He wanted the logo reveal to feel "catchy and explosive".

## 7. Copyright (as told to William; not legal advice)
- The news clips and headlines are a reasonable commentary and fair-use use.
- **Using "brutal" as the soundtrack is generally not transformative.** In practice:
  - Instagram and TikTok have licensing deals with Universal (Rodrigo's label), so posting from a **personal or creator account** usually works.
  - **Business accounts** usually get the video muted or blocked.
  - **YouTube** lets the label claim it.
- This is why the no-song version exists. Don't commit the song or the clips to any repo.

## 8. Repo map
```
brand/                 logos (final Hyperplane cover/avatars, Cornell Gradient masthead)
render/package.json    fonts via npm (Unbounded, IBM Plex Mono, Newsreader, Archivo, …) → `npm install` here
render/unbounded-700.ttf  static font used by wordmark_parts.py
render/hp/             the logo itself (kand_e.html = final cover, kand_e_avatar.html, wordmark_u.svg)
render/video/anim.html the existing logo-formation animation (128 BPM, 18.47 s) and the code to reuse
render/video/frames.py Playwright frame renderer (PAGE=… to pick the page; serves render/ as web root)
render/video/wordmark_parts.json  "Hyperplane" as SVG paths (body + separate H crossbar for the tilt)
render/video/kpop/sync.json       hit times for anim.html's old soundtrack (not for this song)
render/video/reference/           earlier renders of the reveal + a contact sheet
song/song-map.md       measured timings of William's file;  song_map.py / analyze_song.py to re-measure
research/sources.md    every quote and headline, with links and caveats
```
