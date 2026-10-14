export const meta = {
  name: 'hyperplane-rev3',
  description: 'Hyperplane x brutal rev3: William\'s six changes (prelude marks, riff build, arrows, Bostrom/Musk quotes, equations) -> research, edit, critique, fix, render',
  phases: [
    { title: 'Research', detail: 'intro audit, equations + GRPO gradient, Bostrom/Musk quotes (Sonnet)' },
    { title: 'Edit', detail: 'intro editor (changes 1-3) and body editor (4-5) (Opus)' },
    { title: 'Review', detail: 'two adversarial critics on the full rev3 build (Sonnet)' },
    { title: 'Fix', detail: 'apply verified findings (Opus)' },
    { title: 'Deliver', detail: 'render, mix, mux, verify, previews, NOTES (Sonnet)' },
  ],
}

const SP = '/tmp/claude-0/-home-user/a99e0376-0534-5e3e-8b47-ccbc03821dfd/scratchpad/hp3'

const CTX = `
PROJECT: /home/user/hyperplane-teaser: the Hyperplane x "brutal" (Olivia Rodrigo) music-video teaser for Hyperplane, the podcast of The Cornell Gradient (a Cornell newspaper). The user is William. Two cuts: LONG (75.3 s, continuous: song 6.10 -> 80.40, edit = song - 6.10) and SHORT (36.6 s, spliced at edit 20.377: song 26.477 -> 65.188, then edit = song - 44.811).
READ FIRST: /home/user/hyperplane-teaser/BUILD.md: the "REVISION 3" section at the top (William's six changes, verbatim, and how each is read; this is the task), then "REVISION 2" and the "WILLIAM FEEDBACK LOG" (every rev2 rule still holds). Engine docs: render/video/edl/README.md (pipeline at the top; the "Modules" section at the end documents fx/*.js). What rev2 contains, with sources: out/rev2/NOTES.md.
REV3 BUILD FILES: render/video/edl/make_long_rev3.py and make_short_rev3.py write edl/long3.json and short3.json. Each runs the rev2 builder (make_long_rev2.build / make_short_rev2.build, from edl/rev2_parts.py), then two passes: edl/rev3_intro.py apply(edl, cut) (changes 1-3: prelude + riff) and edl/rev3_body.py apply(edl, cut) (changes 4-5: quotes + equations). cut is 'long' or 'short'. Both passes are stubs now, so long3/short3 currently equal long2/short2. Change 6 (the loop's redo-icon arrowhead) is already fixed in fx/singularity.js.
  Single-pass previews: "REV3_PASSES=intro REV3_SUFFIX=i python3 render/video/edl/make_long_rev3.py" writes edl/long3i.json (EDL name long3i), and the same for make_short_rev3.py -> short3i. "REV3_PASSES=body REV3_SUFFIX=b" gives long3b / short3b. The default (both passes) gives long3 / short3.
DO NOT EDIT rev2_parts.py, make_long_rev2.py, make_short_rev2.py, long2.json or short2.json: rev2 must stay reproducible. Engine modules (render/video/fx/*.js) may change only in opt-in ways (a new option or preset that defaults to off), so long2 and short2 render unchanged. Check with "python3 render/video/check/regress.py compare long2 ${SP}/regress" (and short2). The snapshot was taken after the arrow fix; explain any diff above tolerance.
COMMANDS (run from /home/user/hyperplane-teaser):
  python3 render/video/edl/make_long_rev3.py && python3 render/video/edl/make_short_rev3.py
  python3 render/video/prep_clips.py long3   (and short3). New clip/image/screens items need their cache before they render.
  python3 render/video/render.py beats long3 --from S --to S [--eighths] [--debug] --out X.png   (one frame per hits.json beat; --debug labels item ids)
  python3 render/video/render.py sheet long3 t1 t2 ... --out X.png [--debug]
  python3 render/video/render.py still long3 T out.png [--debug]
  python3 render/video/render.py cues long3 [--json]   (speech placements for the mix)
  python3 render/video/check/beatcheck.py long3 --render --from S --to S
  python3 render/video/check/coverage.py long3
  python3 render/video/check/coverdiff.py long3
  python3 render/video/mix.py long3 --dry-run
  TIME REFERENCES: 'hb:i' is beat i of song/hits.json (124 BPM, about 0.484 s per beat). Landmarks: hb:0 = the drop (song 19.232 = long edit 13.132), hb:16 verse 1, hb:48 chorus, hb:80 refrain, hb:108.5 the "God" bar, hb:112 the instrumental. 'song:s' is song seconds.
REFERENCE MEDIA: out/rev2/preview/hyperplane-brutal-long-preview.mp4 and out/rev2/preview/hyperplane-brutal-short-preview.mp4 are what William watched. out/hyperplane-brutal-short-9x16.mp4 is the r7 short: its riff at edit 13.13-18.6 is the "old original intro" whose logo build William wants back. Extract frames with: ffmpeg -ss T -i FILE -frames:v 1 OUT.png
RULES:
  - Never commit, upload or copy the song or clips outside the project (copyright).
  - Scratch files go under ${SP}/<your-stage>/, not in the project. Keep them small (PNG/JSON) and delete temporary videos.
  - The box has 4 shared CPUs and about 4 GB of free disk. Run one render at a time, with --workers 2 at most, and no full-cut video renders unless your task says so.
  - Captions and quotes are verbatim ("…" at cuts), each with a name and year. Never change a meaning.
  - Screenshots are real. Equations are exact from the cited paper, with the source line on screen.
  - Read every PNG you render and judge it by eye, not only by the check scripts.
`

const RESEARCH_SCHEMA = { type: 'object', properties: {
  summary: { type: 'string' }, report_path: { type: 'string' },
  key_facts: { type: 'array', items: { type: 'string' } }, open_questions: { type: 'array', items: { type: 'string' } } },
  required: ['summary', 'report_path', 'key_facts'] }
const EDIT_SCHEMA = { type: 'object', properties: {
  summary: { type: 'string' }, files_changed: { type: 'array', items: { type: 'string' } },
  checks: { type: 'array', items: { type: 'string' } }, sheets: { type: 'array', items: { type: 'string' } },
  open_issues: { type: 'array', items: { type: 'string' } } },
  required: ['summary', 'files_changed', 'checks', 'open_issues'] }
const CRITIC_SCHEMA = { type: 'object', properties: {
  verdict: { type: 'string' },
  findings: { type: 'array', items: { type: 'object', properties: {
    severity: { type: 'string', enum: ['high', 'medium', 'low'] }, change: { type: 'string' }, cut: { type: 'string' },
    where: { type: 'string' }, problem: { type: 'string' }, evidence: { type: 'string' }, fix: { type: 'string' } },
    required: ['severity', 'change', 'where', 'problem', 'evidence', 'fix'] } },
  sheets: { type: 'array', items: { type: 'string' } } },
  required: ['verdict', 'findings'] }
const FINAL_SCHEMA = { type: 'object', properties: {
  summary: { type: 'string' },
  files: { type: 'array', items: { type: 'object', properties: { path: { type: 'string' }, size_mb: { type: 'number' }, duration_s: { type: 'number' }, lufs: { type: 'number' }, tp_db: { type: 'number' } }, required: ['path'] } },
  measurements: { type: 'array', items: { type: 'string' } }, issues: { type: 'array', items: { type: 'string' } } },
  required: ['summary', 'files', 'measurements', 'issues'] }

// ------------------------------------------------------------------ research prompts
const R_INTRO = `${CTX}
YOUR STAGE: research/intro-audit (read-only on the project, apart from writing your report). Scratch: ${SP}/intro-audit/. Write your report to /home/user/hyperplane-teaser/research/rev3/intro-audit.md (create the folder) and return the structured summary.
The editor after you implements changes 1-3 of REVISION 3 from your report alone, so be exact: item ids, beat track ids, fx ids, preset fields, and the code locations that draw each thing.
A. PRELUDE (long edit 0 -> 13.132, i.e. song 6.10 -> hb:0; the short is identical there).
  - Render frames on every beat and 8th. Use "render.py beats long3 --from 0 --to 13.2 --eighths --debug", plus stills at the pulse times in song/hits.json prelude_pulse.
  - Diff consecutive frames numerically (PIL/numpy) to find EVERY element that blinks, flashes, appears or changes on the pulse.
  - For each element give: the item / beatfx / fx id and the code that draws it (e.g. fx/beatfx.js pattern 'prelude': which marks, blooms, ticks, camera punches, zooms, grain), its screen region, and its times.
  - Classify each element as one of:
    (keep) TEXT-RELATED: the word-lit captions, pencil underlines, the circle around "25%", marker sweeps, the name/year chips, the role lines, the source lines, the Amodei sub-line;
    (keep) FOOTAGE or CONTENT: the clips, the headline pile, the transitions;
    (remove) DECORATIVE / FLASHING: e.g. the top-right pencil doodles that change on each pulse, the red/blue "classifier sketch" dots and pencil lines beside the captions (sketch-plane, sketch-dot-*), the splat behind the 2015 chip (splat-open), the red nabla stamp on the breath (r2-stamp-breath), the one-frame white flash before the drop (fx-drop-white, f393), bloom flashes on the pulse.
  - Decide whether the pencil frame around the footage (frame-pencil) and the beat-locked camera punches read as flashing.
  - List exactly what to delete or disable so that nothing decorative blinks, while the prelude still moves gently (the clips' slow push-ins, captions lighting word by word).
B. RIFF (hb:0 -> hb:16; long edit 13.132 -> 20.87; the short runs the same riff to its splice at 20.377).
  - Find the superposition burst: the kand-riff preset's "superpose" move (fx/kandinsky.js drawSuperpose) and eq-superpose.
  - Find the river's large swimming vectors: the preset's "river" move with vectors 26 and size 2.3 (drawRiver). Say how to remove only the arrows. Say whether the river streaks should stay (William: "the arrows that swim through the hyperplane"; he likes the SMALL ones at the end, in the refrain's kand-a river, so report that item's river settings too).
  - Find any other large arrows in the riff (e.g. r2-plane strokes, beatfx marks).
  - Note: the cover's own 'normal' line (the hyperplane's normal vector) is part of the logo and must stay.
C. THE OLD BUILD William wants back. Study out/hyperplane-brutal-short-9x16.mp4, edit 13.0 -> 18.8 (the r7 short; extract a frame at every 8th), and its EDL: render/video/edl/short-v1.json / short.json, the 'logo' item in legacy.js assemble mode.
  - Tabulate exactly what lands on which beat and how: slam, drop, pop, scale overshoot, duration, and the frame of each landing relative to its beat.
  - Explain why it reads as "all of the elements being shown falling into place on beat": the whole logo is in frame and still, on clean cream, with one landing per beat.
  - Then compare with the rev2 riff:
    - kand-riff cues: 'paint' strokes over 0.3 s;
    - the reframe zooms that crop the logo while it builds;
    - splat-drop, r2-spray-*, r2-burst-3, r2-plane-*, the fx-riff/fx-riff-b splats;
    - the pile shards flying over;
    - footage inside the discs;
    - fluid colour from hb:8;
    - the whip at hb:11.5.
    List what hides or muddies the build.
D. RECOMMEND a concrete rev3 riff that satisfies BUILD.md REVISION 3 change 2 (and still all of REVISION 2: something striking on every beat, imagery in every frame).
  - A full cue map for kand-riff: piece -> beat -> style. Styles available in fx/kandinsky.js are cut, paint, draw, pop, slam, drop, spinin, flip, rise, fly. Name any new style that would be needed.
  - Which rev2 riff elements to keep, retime or cut.
  - What fills hb:12-16 now that the superposition is gone: e.g. the circles orbiting or jumping on beats, the footage discs, a beat-locked whip. Use real assets only.
  - Coxon must stay: his line "…restarted the thing, and it did it again." at song 21.20-23.15 (hb:4-8) with his footage in a disc (kc-blue-coxon) and karaoke.
  - Also the short's riff (same until the splice iris at hb:15).
  - Check fx/kandinsky.js for exactly which preset fields the editor can set from the EDL (preset.river, preset.superpose, preset.reframe, cues overrides, drop:[...] of moves).`

const R_EQ = `${CTX}
YOUR STAGE: research/equations. Scratch: ${SP}/equations/. Report: /home/user/hyperplane-teaser/research/rev3/equations-audit.md, plus the JSON files named below; return the structured summary.
A. THE GRPO GRADIENT, exact. William: "lets only keep the equations for attention and the policy gradient for GRPO (and for GRPO just show the gradient itself)".
  - Get Shao et al. 2024, "DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models", arXiv:2402.03300. Prefer the LaTeX source (https://arxiv.org/e-print/2402.03300: a tarball; extract it under ${SP}/equations/src in its own empty folder and only read it), else the latest arXiv HTML/PDF.
  - Find the gradient of the GRPO objective. It is in the appendix's unified-paradigm section, A.1.6 "Group Relative Policy Optimization (GRPO)". Record verbatim LaTeX from the source, the equation number, the version (v1/v2/v3), and the page/section.
  - Make a display form that is "the gradient itself": the full expression for ∇_θ J_GRPO(θ) exactly as the paper writes it (expectation, 1/G sum, 1/|o_i| sum, the bracketed gradient coefficient and ∇_θ log π_θ), and nothing else: no objective, no advantage definition.
  - If the paper's notation for the KL term in the gradient coefficient differs from the objective in sec. 4.1, keep the paper's gradient exactly.
  - Write the record as research/rev3/equations-rev3.json, a list with one record, id 'grpo-grad', in the same schema as research/rev2/equations.json. Look at its 'grpo' record and at how fx/equations.js uses tex, forms, highlight and extra (the terms the EDL can circle or mark), and the cite string.
  - Pick highlight terms worth marking on beats: the advantage term, the KL coefficient, ∇_θ log π_θ.
  - Make the engine load it with a one-line additive change: append 'research/rev3/equations-rev3.json' to EFILES in fx/equations.js, guarded so a missing file is not an error. Check how the files are fetched.
  - Then prove it renders. Write a tiny test EDL edl/test-grpo-grad.json, modelled on long2.json's eq-grpo item: portrait, 2-4 rows, at least 40 px glyphs, on the dark racks theme. Render stills, Read them, and report the row splits that fit 1080 px wide with margins.
B. INVENTORY every formula in long3.json and short3.json: items of type 'equation', net/netviz labels with math, chart annotations, captions with math. Give id, time window and text. Keep only eq-attn (Vaswani et al. 2017 attention) and the GRPO gradient (which replaces eq-grpo, chorus hb:72-80, over the xAI Colossus racks footage v-racks).
C. FREED SLOTS. Cover eq-dpo (verse 1 hb:28.5-32), eq-ntp (hb:40-44), eq-upd (hb:41-44) and eq-adv (refrain hb:84-88). eq-superpose (riff) is the intro editor's, so skip it. For each slot report:
  - the edit and song window;
  - the lyric sung there (song/hits.json, song/song-map.md, research/ lyric notes);
  - what else is on screen (render "render.py beats long3 --from ... --to ..." and Read it);
  - the free screen region;
  - 2-3 ranked replacement ideas. Each must be REAL and already local:
    - screenshot records from research/rev2/screens.json or captures.json (id, outlet, date, headline, image path; prefer 2024-2026; mark whether long3 already uses it, by grepping long3.json for the id);
    - b-roll from research/rev2/broll.json (id, credit, file);
    - charts from research/rev2/graphs.json;
    - deck assets under /home/user/poster/ai-safety-presentation/assets;
    - logo or net choreography that already exists in the engine.
    Correlate each with the lyric and with the news story around it. No new downloads unless nothing fits; say so if so.
  - Give the EDL item JSON for your top pick (modelled on an existing item of the same type in long2.json), so the editor can paste it.`

const R_QUOTES = `${CTX}
YOUR STAGE: research/quotes. Scratch: ${SP}/quotes/. Write /home/user/hyperplane-teaser/research/rev3/quotes.json and quotes.md; return the structured summary.
William: "let's change the closing quote to the bostrom one and substitute one of the Dario quotes in the middle for Elon's we are summoning the demon". The choices are made in BUILD.md REVISION 3 change 4: Bostrom closes both cuts, and Musk replaces verse 1's Amodei "It's a warning sign that we need to slow down." in the long cut.
A. BOSTROM, TED2015, clips/bostrom-ted-2015-full.mp4.
  - Line: "Machine intelligence is the last invention that humanity will ever need to make."
  - The r1-r7 long used audio 466.03-469.90 with these word times: MACHINE 466.12, INTELLIGENCE 466.32, IS 466.70, THE 467.06, LAST 467.20, INVENTION 467.48, THAT 468.00, HUMANITY 468.36, WILL 468.84, EVER 469.10, NEED 469.22, TO 469.38, MAKE. 469.48 (research/long/bostrom-ted-2015.json; render/video/edl/make_long.py around 'end-voice' and 'end-cap').
  - Re-verify the word times and the clean in/out edges: no clipped breath, no next word. Use the transcription helpers in ${SP}/../hyperplane/ (transcribe.py: check its usage) or faster-whisper / whisper if installed. Use word timestamps, and cross-check with the energy envelope.
  - Verify the talk's title, event and date for the on-screen credit: TED2015, Vancouver, March 2015, "What happens when our computers get smarter than we are?". Use the TED talk page or a reliable source (WebFetch/WebSearch).
  - Report the clip's resolution and fps.
  - Look at frames across the line: is it Bostrom on stage, is it a slide, are there cutaways?
  - Give crops for (i) the blue disc (a circle; see kc-blue-amodei in long3.json for how the closer's disc crops Amodei) and (ii) a panel, with his face centred. Keep the original TED stage (no keying).
B. MUSK, MIT AeroAstro Centennial Symposium, 24 Oct 2014, clips/musk-mit-2014-demon.mp4 (also musk-mit-2014-demon-cut.mp4).
  - Line: "With artificial intelligence, we are summoning the demon." See research/long/musk-mit-2014.json, and make_long.py rf-musk: line 1 is at 57.32-59.38; the r2 cut used only "we are summoning the demon." from 58.46.
  - Re-verify the word times of the FULL line and its clean edges.
  - Verify the date, venue and his 2014 role for the credit, e.g. "ELON MUSK · MIT AEROASTRO CENTENNIAL SYMPOSIUM · OCT 24, 2014" and "SpaceX & Tesla CEO".
  - Report resolution and framing, and give crops for a panel and a disc.
C. PLACEMENT.
  - Musk replaces the verse-1 Amodei: p-amodei (panel, hb:23.5-29.5), voice-amodei (song 30.283-32.983), kar-amodei. Find the vocal intervals there (song/hits.json vocal_intervals), the sung lyric, and the best start (on a beat or 8th). Audio over the music is allowed (BUILD.md REVISION 2 audio rule: duck the music; the words are always on screen). Say whether the full line fits before tr-v1-fold at hb:28.5.
  - Bostrom replaces the closer: voice-amodei-b (song 73.768-79.338), kar-amodei-b and kc-blue-amodei in the instrumental from hb:112 (song 73.42). The music fades out over song 80.05-80.40 and the cover holds after it. Propose a start in song seconds on a beat or 8th, with the line ending at least 0.6 s before the fade. The same song times apply to both cuts (short edit = song - 44.811 there).
D. DEPENDENCIES. List every item, transition and fx in long3.json and short3.json that references the Amodei items being replaced, so the editor can swap them cleanly:
  - transition in/out lists (tr-v1-zoom, tr-v1-fold, ...), stamps, credits, ghost-out, fx-re-zoom;
  - kc-blue-amodei's moves and the kand-re cues it relies on;
  - pile-news (it carries the CBS headline about Amodei's 'warning sign': does it still make sense without his voice? suggest a replacement if not).
  - Give the current JSON of those items, so the editor can model the Bostrom and Musk items on them.`

// ------------------------------------------------------------------ edit prompts
const E_INTRO = (audit) => `${CTX}
YOUR STAGE: the INTRO EDITOR (changes 1-3 of BUILD.md REVISION 3). Scratch: ${SP}/edit-intro/.
YOU OWN: render/video/edl/rev3_intro.py (implement apply(edl, cut) for both cuts), plus opt-in additions to render/video/fx/kandinsky.js / beatfx.js if needed.
DO NOT TOUCH: rev3_body.py; the body editor works on it at the same time. Preview with your single pass: "REV3_PASSES=intro REV3_SUFFIX=i python3 render/video/edl/make_long_rev3.py" (and make_short_rev3.py), then prep_clips/render/check long3i and short3i. Run the full long3/short3 once at the end, to make sure both passes compose.
The research audit (Read it in full): /home/user/hyperplane-teaser/research/rev3/intro-audit.md. Its summary: ${JSON.stringify(audit)}
DO:
  1. Prelude (both cuts): remove every decorative / flashing mark the audit lists, including the beat tracks that blink marks on the pulse, the classifier sketch, the chip splat, the breath stamp and the white flash frame before the drop. Keep every text-related graphic (the circling, underlines, markers, chips, word-lit captions), the footage, the headline pile and the transitions. The prelude should still feel alive but gentle: slow push-ins, captions lighting word by word.
  2. Riff (both cuts):
     - kill the superposition burst and eq-superpose;
     - rebuild the logo so that every element visibly FALLS INTO PLACE ON A BEAT, like the r7 short's riff: the plane slams on the downbeat, the discs drop or pop in, one small shape per beat or 8th, the wordmark slams on a bar downbeat, the kicker lands;
     - the whole logo is in frame, on clean cream, and each landing frame is on its beat;
     - keep the rest of the rev2 riff only where it does not hide the build (Coxon heard with his footage in a disc, the footage in the discs once they have landed, the fluid colour, orbits and jumps after the build, the break into verse 1 at hb:16 / the short's splice iris);
     - fill hb:12-16 with something striking on every beat, using no equations.
  3. Riff: remove the large swimming arrows in the river (the band). Keep the refrain's small ones (kand-a) exactly as they are.
  - Keep every timing honest: Coxon's karaoke on his spoken words, his name and year on screen.
  - Write a rev3 note in each touched item's _note, and a docstring summary in rev3_intro.py.
VERIFY (and Read every image):
  - "render.py beats long3i --from 0 --to 21 --eighths" (and short3i to 20.4);
  - a strip of stills at every 8th through hb:0-12 to see each landing;
  - beatcheck over 0-21;
  - coverage.py long3i / short3i (no new violations against long2: compare);
  - "regress.py compare long2 ${SP}/regress" and short2, to prove rev2 is unchanged.
  Then compare your riff side by side with the r7 short's riff frames: do the elements fall into place on beat as clearly?
Iterate until it is right. Return: a summary, the files changed, the checks with their numbers, the sheet paths, and the open issues.`

const E_BODY = (eq, qu) => `${CTX}
YOUR STAGE: the BODY EDITOR (changes 4-5 of BUILD.md REVISION 3). Scratch: ${SP}/edit-body/.
YOU OWN: render/video/edl/rev3_body.py (implement apply(edl, cut) for both cuts), plus opt-in additions to fx/*.js if needed.
DO NOT TOUCH: rev3_intro.py; the intro editor works on it at the same time. Preview with your single pass: "REV3_PASSES=body REV3_SUFFIX=b" -> long3b / short3b (prep_clips, render, check those). Run the full long3/short3 once at the end, to make sure both passes compose.
Research to Read in full:
  - research/rev3/equations-audit.md and research/rev3/equations-rev3.json (summary: ${JSON.stringify(eq)});
  - research/rev3/quotes.md and quotes.json (summary: ${JSON.stringify(qu)}).
DO:
  4a. Closer, both cuts: replace Amodei's "…positive feedback loop…" (voice-amodei-b, kar-amodei-b, kc-blue-amodei and anything tied to them) with Nick Bostrom, TED2015, AUDIBLE: "Machine intelligence is the last invention that humanity will ever need to make."
      - Roll it out word by word exactly as he says it: karaoke lit on his word times, like the r1 Bostrom caption William liked.
      - Name and year on screen ("NICK BOSTROM · TED2015" or as verified), and his original TED footage in the blue disc (or a panel) as the cover reassembles.
      - It must end before the music's fade, so the finished cover holds clean.
      - Mix: check render.py cues, and run "mix.py long3b --dry-run": speech placements, ducking, nothing clipped.
  4b. Long cut only: replace verse 1's Amodei "It's a warning sign that we need to slow down." (p-amodei, voice-amodei, kar-amodei and their transition references) with Elon Musk, AUDIBLE: "With artificial intelligence, we are summoning the demon." (MIT AeroAstro Centennial Symposium, Oct 24, 2014).
      - Karaoke on his words, name and year, his original footage in the panel.
      - Fix every reference (transitions' in/out lists, credits, stamps).
      - Keep the pile around it coherent: the quotes research says whether pile-news's CBS 'warning sign' headline still belongs.
  5. Equations, both cuts:
      - Keep eq-attn as it is.
      - Replace eq-grpo (chorus hb:72-80 over the racks) with the GRPO gradient ONLY (ref 'grpo-grad' from research/rev3/equations-rev3.json): drawn on the beats, highlights on beats, the label rewritten for the gradient, and the cite line exact (paper, arXiv id, appendix section / equation number).
      - Remove eq-dpo, eq-ntp, eq-upd and eq-adv, plus any other formula the audit found, except eq-superpose, which is the intro editor's.
      - Fill each freed slot with the audit's top pick or better: real, lyric-correlated, moving on the beat, and fitting the transitions around it. Fix each transition's in/out lists.
      - Do the prep_clips for new screens/clips.
VERIFY (and Read every image):
  - Beat sheets ("render.py beats long3b --from A --to B") for every window you changed: verse hb:20-33 and hb:38-45, chorus hb:70-81, refrain hb:82-90, instrumental hb:110-end, and the short's instrumental.
  - Stills of the GRPO gradient at full size (is it legible and exact? compare it glyph by glyph with the paper's LaTeX).
  - The Bostrom and Musk karaoke against their word times.
  - "mix.py long3b --dry-run" and short3b.
  - coverage.py (no new violations against long2), coverdiff.py on the last frame (the cover must still match), and the regress compare of long2/short2.
Iterate until it is right. Return: a summary, the files changed, the checks with their numbers, the sheet paths, and the open issues.`

// ------------------------------------------------------------------ critic prompts
const C_INTRO = (edits) => `${CTX}
YOUR STAGE: CRITIC A (adversarial). You judge the INTRO of the FULL rev3 build against William's changes 1-3 (BUILD.md REVISION 3), and against REVISION 2 in that span. Scratch: ${SP}/critic-intro/. Do not edit project files.
Generate the full build first: "python3 render/video/edl/make_long_rev3.py && python3 render/video/edl/make_short_rev3.py", then prep long3 and short3 if items are missing.
What the editors say they did: ${JSON.stringify(edits)}
INSPECT (Read every image):
  - "render.py beats long3 --from 0 --to 21.5 --eighths", plus short3 0-21;
  - 8th-note stills through the riff build;
  - frame diffs on the prelude pulse;
  - the same spans of the rev2 preview (out/rev2/preview/*.mp4) and of the r7 short (out/hyperplane-brutal-short-9x16.mp4, edit 13-18.8), for comparison.
TRY TO FIND PROBLEMS. Default to reporting when unsure. Check:
  1. Does ANY decorative mark, blink or flash remain in the prelude?
     - doodles, dots, stamps, splats, blooms, a white frame, a strobe-like camera punch;
     - anything else that changes on the pulse and is not text-related.
     Was any text-related graphic (the circling, underlines, markers, chips) wrongly removed? Is the prelude now dead (no motion at all)?
  2. Is the superposition (the radiating vector fan) completely gone, with its equation?
     - Does every logo element visibly fall into place on a beat, as clearly as the r7 short? Measure each landing frame against its hits.json beat (within 2 frames).
     - Is the whole logo in frame while it builds?
     - Does anything hide it (splats, shards, zooms, footage, fluid)?
     - Is something striking on every beat in hb:12-16?
     - Are Coxon's voice, karaoke and footage intact and in sync?
     - Is there imagery in every frame?
  3. Are the large swimming arrows in the riff's band gone, and are the refrain's small river arrows untouched?
  Also check:
  - the short's riff and its splice iris;
  - the break into verse 1;
  - "beatcheck.py long3 --render --from 0 --to 21" (weak beats, dead stretches);
  - coverage.py long3 / short3;
  - the regress compare for long2/short2.
Return findings: severity (high = William's request not met or broken; medium = clearly visible craft problem; low = polish), change number, cut, where (edit time / beat), the problem, the evidence (file path of your sheet plus what you measured), and a concrete fix.`

const C_BODY = (edits) => `${CTX}
YOUR STAGE: CRITIC B (adversarial). You judge the BODY of the FULL rev3 build against William's changes 4-6 (BUILD.md REVISION 3), and against REVISION 2's honesty rules. Scratch: ${SP}/critic-body/. Do not edit project files.
Generate the full build first: "python3 render/video/edl/make_long_rev3.py && python3 render/video/edl/make_short_rev3.py", then prep long3 and short3 if items are missing.
What the editors say they did: ${JSON.stringify(edits)}
TRY TO FIND PROBLEMS. Default to reporting when unsure. Check:
  4. Quotes.
     - Bostrom closes BOTH cuts:
       - audible; verbatim "Machine intelligence is the last invention that humanity will ever need to make.";
       - karaoke lit on his words (compare the word times with the audio: make the mix WAVs with "mix.py long3" (no --video; WAVs go to song/) and transcribe that window with word timestamps, using the helpers in ${SP}/../hyperplane/ or faster-whisper if installed);
       - name and year on screen; his original footage;
       - ends before the music fade; the cover still matches (coverdiff.py long3 and short3);
       - no Amodei closer left anywhere (grep long3.json and short3.json for voice-amodei-b, kar-amodei-b and kc-blue-amodei).
     - Musk replaces verse 1's Amodei in the long cut:
       - verbatim "With artificial intelligence, we are summoning the demon." (or exactly what is heard, with "…");
       - intelligible over the music (transcribe the mixed window);
       - karaoke in sync; credit and date correct; footage original;
       - no dangling references; the pile around him still coherent.
     - The other middle Amodei quotes are untouched.
  5. Equations.
     - List EVERY formula visible in long3 and short3 (beat sheets over the whole cuts: "render.py beats long3 --from 13 --to 75" in chunks, plus short3).
     - Only scaled dot-product attention (eq-attn) and the GRPO policy gradient may remain.
     - The gradient must be ONLY the gradient, and exact: fetch arXiv 2402.03300's source yourself and compare it symbol by symbol with what is rendered, including the cite line.
     - Is each freed slot filled with something real, lyric-correlated and moving on the beat (no empty or static stretch, imagery in every frame)?
     - Check the new screenshots against their records (real, correct date and outlet).
  6. The loop's "Even better AI" redo icon: is the arrowhead now pointing along the arc, the same way round as the loop's travel? Read a large crop at long3 edit about 54.4 and short3 about 22.
  Also check:
  - "mix.py long3 --dry-run" (speech placements, ducking);
  - coverage.py;
  - beatcheck over the changed windows;
  - transitions that now point at removed items (the generator asserts ids, but check them visually);
  - clean-version dips unchanged.
Return findings: severity (high = request not met / dishonest / broken; medium = visible craft problem; low = polish), change number, cut, where, the problem, the evidence (your sheet path plus what you measured), and a concrete fix.`

// ------------------------------------------------------------------ fixer + delivery prompts
const FIX = (edits, findings) => `${CTX}
YOUR STAGE: the FIXER. Scratch: ${SP}/fix/. You own render/video/edl/rev3_intro.py, rev3_body.py and opt-in fx/*.js changes.
What the editors did: ${JSON.stringify(edits)}
The critics' findings (JSON): ${JSON.stringify(findings)}
FOR EACH FINDING, first verify it against frames, audio or data you produce yourself; critics can be wrong.
  - If it is real: fix every high and medium one, and the low ones that are cheap and clearly right.
  - If it is not real: say why, with evidence.
Then:
  - regenerate long3 and short3, and prep them;
  - re-render the beat sheets of every touched window, and Read them;
  - run beatcheck/coverage/coverdiff, "mix.py long3 --dry-run" and short3, and the regress compare for long2/short2.
Also make sure:
  - the generators run clean from scratch;
  - rev3_intro.py and rev3_body.py docstrings describe what rev3 changed;
  - render/video/edl/README.md has a short "rev3" paragraph: the files, the passes, change 6 in singularity.js, and any new engine options.
Return: a summary, the files changed, the checks with their numbers, the sheet paths, and the open issues (anything you could not fix, with the reason).`

const DELIVER = (fix) => `${CTX}
YOUR STAGE: DELIVERY: render, mix, mux, verify and document the rev3 deliverables. Scratch: ${SP}/deliver/. The fixer's report: ${JSON.stringify(fix)}
Steps (from /home/user/hyperplane-teaser):
  1. Make sure long3.json / short3.json are freshly generated and prepped (make_*_rev3.py, prep_clips.py long3 / short3).
  2. Free disk first (check df). Never delete out/rev2 or the r1-r7 files in out/. If space is short, delete only your own temporaries.
  3. Render the silent videos:
       python3 render/video/render.py video long3 ${SP}/deliver/long3-silent.mp4 --workers 3
       python3 render/video/render.py video short3 ${SP}/deliver/short3-silent.mp4 --workers 3
     These take a while; run each with a long timeout, one at a time.
  4. Mix and mux:
       python3 render/video/mix.py long3 --video ${SP}/deliver/long3-silent.mp4
       python3 render/video/mix.py short3 --video ${SP}/deliver/short3-silent.mp4
     The outputs land at the EDLs' outputs paths in out/rev3/: long with song, long clean, long no-song, short with song, short no-song.
  5. Verify each MP4 (ffprobe, decoding it):
     - duration and frame count;
     - integrated loudness about -12 LUFS (no-song about -14), true peak ≤ -1 dBTP;
     - audio/video alignment;
     - the drop on hb:0;
     - each painted word of "it's brutal out here" within 2 frames of its sung onset (song/hits.json words.brutal_out_here);
     - Bostrom's and Musk's karaoke vs the audio;
     - the short's splice;
     - the last frame vs the cover (coverdiff on the decoded last frame);
     - the clean variant dips the explicit word only.
  6. Make the chat copies in out/rev3/preview/. The user's chat upload limit is 30 MB, so make each file at most 28 MB:
     - out/rev3/preview/hyperplane-brutal-long-preview.mp4 and -short-preview.mp4: H.264 High, two-pass, 720x1280 for the long and 1080x1920 for the short if it fits;
     - out/rev3/hevc/<name>-1080p-hevc.mp4 for all five deliverables: libx265, 1080x1920, two-pass or CRF tuned to fit, tag hvc1, audio stream copied bit for bit.
  7. Contact sheets decoded from the final with-song MP4s: one frame per second plus the key frames (the drop, each riff landing, the Musk line, the GRPO gradient, the Bostrom words, the cover). Save as out/rev3/sheets/long-final.png and short-final.png.
  8. Write out/rev3/NOTES.md in the style of out/rev2/NOTES.md:
     - what rev3 changed (William's six changes, one line each, with times);
     - the files table with loudness and sizes;
     - the contents and sources for the changed sections (the Bostrom and Musk lines with source seconds, venue and date; the GRPO gradient's cite; what fills the freed slots, with sources);
     - the measurements;
     - the ear checks William should do.
  9. Delete the silent renders and other temporaries. Leave everything else.
Return: a summary, every deliverable and preview with path, size, duration, LUFS and TP, the measurements, and any issue.`

// ------------------------------------------------------------------ run
phase('Research')
const introChain = agent(R_INTRO, { label: 'research:intro-audit', phase: 'Research', schema: RESEARCH_SCHEMA, model: 'sonnet' })
  .then(audit => agent(E_INTRO(audit), { label: 'edit:intro (1-3)', phase: 'Edit', schema: EDIT_SCHEMA, model: 'opus' }))
const bodyChain = Promise.all([
  agent(R_EQ, { label: 'research:equations', phase: 'Research', schema: RESEARCH_SCHEMA, model: 'sonnet' }),
  agent(R_QUOTES, { label: 'research:quotes', phase: 'Research', schema: RESEARCH_SCHEMA, model: 'sonnet' }),
]).then(([eq, qu]) => agent(E_BODY(eq, qu), { label: 'edit:body (4-5)', phase: 'Edit', schema: EDIT_SCHEMA, model: 'opus' }))
const [introEdit, bodyEdit] = await Promise.all([introChain, bodyChain])
const edits = { intro: introEdit, body: bodyEdit }
log('Both editors done; critics next')

phase('Review')
const crit = await parallel([
  () => agent(C_INTRO(edits), { label: 'critic:intro (1-3)', phase: 'Review', schema: CRITIC_SCHEMA, model: 'sonnet' }),
  () => agent(C_BODY(edits), { label: 'critic:body (4-6)', phase: 'Review', schema: CRITIC_SCHEMA, model: 'sonnet' }),
])
const findings = crit.filter(Boolean).flatMap(c => c.findings || [])
log(`${findings.length} findings (${findings.filter(f => f.severity === 'high').length} high, ${findings.filter(f => f.severity === 'medium').length} medium)`)

phase('Fix')
const fix = await agent(FIX(edits, findings), { label: 'fix', phase: 'Fix', schema: EDIT_SCHEMA, model: 'opus' })

phase('Deliver')
const deliver = await agent(DELIVER(fix), { label: 'deliver', phase: 'Deliver', schema: FINAL_SCHEMA, model: 'sonnet' })
return { edits, critics: crit, fix, deliver }
