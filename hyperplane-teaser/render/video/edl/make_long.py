"""Generate render/video/edl/long.json (the long version = the drop cut, song 19.232 -> 80.432).
    python3 render/video/edl/make_long.py   # then: prep_clips.py long, render.py video long, mix.py long --video ...
Every item carries a _note with its source and how it was verified (research/long/plan/*.verify.json + re-checks)."""
import json, pathlib

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / 'long.json'
D = 19.232
beat = json.load(open(HERE / 'long-beats.json'))   # edit-time beat grid (see _grids_note); bar:k = beat:4k
bar = beat[0::4]
riff = beat[:16]
A = '/home/user/poster/ai-safety-presentation/assets/'

INK, CREAM, RED, BLUE, PINK, TEAL, VIOLET, YEL = '#15131F', '#F2EBDD', '#B31B1B', '#2346FF', '#FF2E88', '#00B8A9', '#7B3FF2', '#F2C300'
DARK_IMG = {"sat": 0.25, "contrast": 1.06, "brightness": -0.13, "gamma": 0.95}         # verse: screenshots held back
DARK_CLIP = {"sat": 0.15, "contrast": 1.25, "brightness": -0.06, "gamma": 0.92, "sharpen": 0.6, "grain": 4}
FULL_CLIP = {"sat": 1.0, "contrast": 1.08, "brightness": -0.01, "gamma": 1.0, "sharpen": 0.5, "grain": 3}

items = []
def add(**k): items.append(k); return k

# r5 (motion critic, medium: the two-bar cards held ~3.9 s with only a slow zoom, ignoring the beat): beat-locked kicks of the
# whole card (engine "kicks"): a 2 % bump on beat 3 of each bar and a 3.5 % bump on the second bar's downbeat, ~1 s apart.
# Every item of one card gets the same list and kickOrigin, so frame, text and attribution move as one.
def kicks(bar0, skip=()):
    ks = [{"at": f"beat:{4 * bar0 + 2}", "s": 1.02, "dur": 0.16}, {"at": f"beat:{4 * bar0 + 4}", "s": 1.035, "dur": 0.2},
          {"at": f"beat:{4 * bar0 + 6}", "s": 1.02, "dur": 0.16}]
    return [k for i, k in enumerate(ks) if i not in skip]

# ---------------------------------------------------------------- grounds and texture
add(id="ground-dark", type="color", color="#0E0D12", t0="riff:15-0.05", t1="bar:12",
    _note="Verse 1 ground. Sits under the logo; the logo's cream fades out over the break (bgFade) and reveals it.")
add(id="grain-verse", type="grain", t0="bar:4", t1="bar:12", opacity=0.035, size=2, hold=3)
add(id="vignette-verse", type="vignette", t0="bar:4", t1="bar:12")
add(id="ground-cream", type="color", color=CREAM, t0="bar:12", t1=61.2, flash={"opacity": 0.5, "decay": 0.03},
    _note="Chorus, refrain and the instrumental: full colour on the cream Kandinsky ground. r1: the chorus-downbeat flash is "
          "0.5 / 0.03 s (was 0.75 / 0.07), so it is gone by the second frame and does not wash out the 17,600 card.")

# ---------------------------------------------------------------- the drop: the logo forms on the riff, then breaks apart
VOCAL1 = 7.683   # verse 1's first vocal ('I'm'), song 26.915: centre-channel (mid-side, 300-3500 Hz) onset measured 10 Oct r2
# FINAL PASS (social critic, high: the hook's third line and source line sat in the Reels/TikTok caption zone, y ~1360-1520):
# the FORMATION's art is lifted 100 px (layout y 300, was 400) so the hook block can move up to y 1040 with the plane band
# clear of it on the left (band's lower edge at x 60: y 995, was 1095). Only the formation moves: the reassembled cover
# (logo-re) keeps y 400, so the final frame still matches brand/hyperplane-cover-3000.png. make_short.py does not copy this
# item's layout (the short's formation is short-v1's).
add(id="logo-form", type="logo", t0=0, t1="bar:4+0.6", grid="riff", beat0=0, layout={"y": 300, "scale": 0.72},
    slam=["plane", "pink", "black", "core", "blue", "teal", "smallO"], slamDur=0.1,
    slamFrom={"plane": 1.3, "pink": 1.3, "black": 1.3, "core": 2.3, "blue": 1.9, "teal": 2.2, "smallO": 3.2},
    cues={"plane": 0, "dots": 0, "pink": 0, "black": 0, "smallO": 0.5, "core": 1, "sort": 2, "blue": 2, "teal": 3},
    hits=[{"beat": 0, "amp": 14, "decay": 0.05}, {"beat": 0.5, "amp": 5, "decay": 0.05}, {"beat": 1, "amp": 9, "decay": 0.06}, {"beat": 2, "amp": 12, "decay": 0.06},
          {"beat": 3, "amp": 6, "decay": 0.06}, {"beat": 4, "amp": 9}, {"beat": 7, "amp": 6},
          {"beat": 8, "amp": 22}, {"beat": 9, "amp": 7}, {"beat": 12, "amp": 8}],
    # r5: the hold's extra camera hits are item "shakes", not logo "hits": make_short.py copies this item's hits and appends its
    # own 11/13/14, so listing them here would double the short's
    shakes=[{"at": "riff:10", "amp": 5, "decay": 0.06},
            {"at": "riff:11", "amp": 5, "decay": 0.06}, {"at": "riff:13", "amp": 6, "decay": 0.06}, {"at": "riff:14", "amp": 5, "decay": 0.06}],
    flashes=[{"beat": 8, "opacity": 0.22, "decay": 0.05}],
    pulse={"from": 0, "to": 15, "amp": 0.009, "accents": {"0": 6, "1": 2.0, "2": 2.4, "8": 2.2, "11": 1.6, "12": 1.8, "13": 1.8, "14": 1.6, "15": 1.8}},
    # r5 (motion critic, high: the title hold 3.9-7.3 s sat static under the caption): the short's r4 hold treatment -- single
    # pieces bump on the riff beats after the kicker, small camera hits on 11, 13 and 14, and a slow 3.5 % push from the tilt
    # (beat 9) to the break (beat 15)
    # r6 (motion critic, low: after the wordmark slam only the 3.5 % push moved until beat 10.5; social critic, medium: nothing
    # visibly changed 4.25-5.1 s): a piece pops on EVERY 8th of the hold from beat 9 (the crossbar tilt, 4.388) to 14.5, with a
    # small camera hit on the kicker's beat 10. (rehits and shakes are not copied by make_short.py; hits and pulse are, and are
    # unchanged.)
    rehits=[{"beat": 9, "parts": ["teal", "square", "dots"], "scale": 1.45, "dur": 0.16},
            {"beat": 9.5, "parts": ["smallO", "core"], "scale": 1.5, "dur": 0.16},
            {"beat": 10, "parts": ["blue", "target"], "scale": 1.22, "dur": 0.18},
            {"beat": 10.5, "parts": ["dots", "smallO"], "scale": 1.6, "dur": 0.16},
            {"beat": 11, "parts": ["blue", "teal", "square"], "scale": 1.26, "dur": 0.18},
            {"beat": 11.5, "parts": ["nabla", "chk", "smallO"], "scale": 1.3, "dur": 0.16},
            {"beat": 12, "parts": ["pink", "core"], "scale": 1.16, "dur": 0.18},
            {"beat": 12.5, "parts": ["dots", "smallO"], "scale": 1.8, "dur": 0.18},
            {"beat": 13, "parts": ["blue", "teal", "target", "square"], "scale": 1.28, "dur": 0.18},
            {"beat": 13.5, "parts": ["nabla", "chk"], "scale": 1.3, "dur": 0.16},
            {"beat": 14, "parts": ["black", "core", "pink"], "scale": 1.16, "dur": 0.18},
            {"beat": 14.5, "parts": ["teal", "smallO", "dots", "target"], "scale": 1.5, "dur": 0.16}],
    push={"from": 9, "to": 15, "z": [1.0, 1.035]},
    # r5: the teal square no longer stays behind (the LOOT frame it became is dropped); it blows out with the other pieces
    **{"break": {"at": "riff:15", "dur": 0.3, "stagger": 0.004, "lead": 0.05, "hide": ["band"], "bgFade": 0, "bgDelay": 0.067, "hit": 16}},
    _note="r1: the drop lands on frame 0. The plane band and the black and pink discs SLAM in fully formed on the downbeat "
          "(1.3x -> 1 over 3 frames, whole-art kick 1.054 -> 1, a 3-frame camera shake of 14 px) with no white flash (this cut "
          "opens cold on frame 0, so a flash would only blank the first frame). The orange core moves to beat 1 and the small "
          "orange O to beat 1.5 so beat 1 still has a hit; dots sort on beat 2 and the rest is unchanged (blue 3, teal 3.5, "
          "square 4, target 4.5, arc 5, normal 5.5, margin 5.75, checkerboard 6, nabla 7, wordmark 8, tilt 9, kicker 10). "
          "BREAK (r1): on the riff's last hit (beat 15, song 26.511), 0.45 s before the verse bar, so the blow-out gets its full "
          "0.4 s before the first verse frame lands: the wordmark and kicker leave first (0.05 s lead), the cream fades to the "
          "dark verse ground over 0.22 s (no ghost of the wordmark on dark), and the yellow band and the teal square stay behind "
          "in place, then morph into band-v1 and the LOOT frame after the pieces have cleared (morph delay 0.18 s, landing on bar 4). "
          "r2 (critics): the riff's first hits are visible events, not specks: the orange core slams in at 2.3x on beat 1 (0.51 s), "
          "the blue disc at 1.9x on beat 2 (0.99 s, was rising in on beat 3) and the teal disc at 2.2x on beat 3 (1.48 s), each "
          "with a camera hit and a whole-art kick. Break: no grey dissolve: the cream holds 2 frames while the wordmark and kicker "
          "leave first, then cuts to the dark ground (bgFade 0, bgDelay 0.067). The verse lands on the MEASURED first vocal "
          "(song 26.915, edit 7.683; bars.json's 26.82 is the riff's level drop, not the voice): morph delay 0.14 s. "
          "r3 (motion critic: thin dark frames 7.40-7.60 before the verse lands): the blow-out is 0.3 s (ends 7.58) and the LOOT "
          "frame and the band morph out of the stay-behind pieces 0.06 s after the break over 0.22 s, so both are in place by 7.56; "
          "the ticker still lands on the first vocal (re-measured r3: centre-channel energy jumps at song 26.925, edit 7.693, the "
          "same frame 231 as 7.683; 26.74-26.92 is the riff's ring-out with no centred voice, so 26.82 / edit 7.588 is not the "
          "vocal). The hook gets one more event in its first second: the small orange O slams at 3.2x on beat 0.5 (0.255 s).")

# r2 (social critic: ~2.4 s of dead air between the kicker and the verse; the no-song file was silent): Altman's Senate line is
# HEARD over the riff's logo hold (the riff is vocal-free; the song is ducked under it), captioned above the cover like Bostrom
# at the end. Speech 3.92-7.38 (song 23.15-26.61), after the wordmark slam (3.889) and before verse 1's first vocal (7.683).
CAP_W = 960   # the closing voice-over caption's width (end-cap). r7: the stale CAP_Y / CAP_SIZE (36) constants are gone: nothing used
              # them, and the closing caption is END_SIZE = 40 px (measured in the DOM: 40 px text, 38 px source line)
# r5 (social critic, high: nothing readable or human in the first 3.9 s): the line moves from the hold to the formation. It
# starts on riff beat 1, not on frame 0, so the drop's downbeat and its first 8th (the plane slam, the small O at 0.255) are heard
# at full level: the song ducks ~12.5 dB under speech (min_snr_lu 10) and the duck's 120 ms ramp now runs 0.35-0.47. 'I' lands on
# beat 1 (0.511), the first 'wrong' on beat 4 (1.971 vs 1.945) and 'quite wrong' on beat 7 (3.451 vs 3.407); the speech ends at
# 3.931, as the wordmark slams (3.889). Frame 0 is unchanged.
A_AT, A_IN, A_OUT = 0.471, 418.32, 421.78
add(id="open-voice", type="voice", t0=A_AT, t1=A_AT + (A_OUT - A_IN), src="clips/altman-senate-2023-cspan.mp4", at=A_AT,
    audio={"in": A_IN, "out": A_OUT, "peak_rel_db": 13}, verified=True,
    _note="AUDIBLE (drop riff, no vocals). research/long/altman-senate-2023.json line 1 ('I think if this technology goes wrong, it "
          "can go quite wrong and we want to be vocal about that.', 418.36-424.58; C-SPAN, Senate Judiciary subcommittee hearing "
          "'Oversight of A.I.', May 16, 2023). Cut after 'wrong' (marked …): r2 small.en on the exact window 418.32 + 3.46 s hears "
          "'I think if this technology goes wrong, it can go quite wrong.' Edges measured on the clip's RMS: silence 417.84-418.38 "
          "before 'I' (418.40) and 421.74-422.00 after 'wrong' ('and' at 422.02). A 40 ms thump on 'I' (418.42-418.48, 15-20 dB over "
          "the speech, +7.7 dBTP after leveling) is held by a per-clip limiter (peak_rel_db 13), so it no longer forces the "
          "whole mix down to -20 LUFS.")
A_W = [("I", 418.36), ("THINK", 418.50), ("IF", 418.64), ("THIS", 418.88), ("TECHNOLOGY", 419.08), ("GOES", 419.46), ("WRONG,", 419.82),
       ("IT", 420.50), ("CAN", 420.72), ("GO", 420.84), ("QUITE", 421.02), ("WRONG…", 421.30)]
# r6 (social critic, high: the first 0.5 s had no text; the 36 px mono caption was dim until spoken, so at 1.0 s only 'I THINK
# IF THIS' was lit and the thesis lit at 2.65 s): the line is the hook, set big. It lands with the plane's slam on frame 0 (a cut, so nothing is scaled off the edge; the
# first frame and the feed preview carry it), as an 84 px Newsreader italic pull-quote below the forming art (y ~1190-1500, in
# the empty lower half the wordmark lands in at 3.889), the whole sentence readable at once (unspoken words at 0.82, the red
# 'it can go quite wrong…' chip at full strength) and each word lighting to full as he says it. It cuts on the wordmark's slam
# (bar 2, beat 8), which takes its place, so the thesis hands over to the title. The source line is 38 px.
A_W = [(w.capitalize() if w == "I" else w.lower(), s) for w, s in A_W]   # sentence case for the serif setting (same words)
add(id="open-cap", type="caption", t0=0, t1="riff:8", theme="light",
    text="I think if this technology goes wrong, it can go quite wrong…", hl="it can go quite wrong…",
    # FINAL PASS (social critic, high): y 1180 -> 1040 and w 900 -> 820, so the source line ends above y ~1405 (the caption /
    # audio-line zone starts ~1420) and the right edge (x 880) stays left of the action-button rail (x > 960); see logo-form
    # r7 (social critic: at frame 0 the block reached x 920 and, with the drop's 14 px camera hit, y ~1441): the source line is
    # "Sam Altman · Senate hearing, 2023" (one character shorter, so it ends at x ~885), w 800, lh 1.05 and srcGap 14, so the block
    # ends ~20 px higher (y ~1408 before the shake) at the same top (y 1040: the plane band's lower edge is y 994 at x 60).
    words=[{"w": w, "at": round(A_AT + s - A_IN, 3)} for w, s in A_W], y=1040, w=800, size=84, lh=1.05, srcGap=14,
    serif=True, hlKeep=True, reveal="dim", dimOp=0.82, dimHl=1.0, source="Sam Altman · Senate hearing, 2023", verified=True,
    _note="Caption = exactly what is heard (small.en words), the trailing … marks the cut 'and we want to be vocal about that'. "
          "r5: on screen 0.43-4.25 over the formation (the line is heard 0.471-3.931); the whole line shows dim from its first "
          "frame and each word lights as it is spoken, so the hook reads at once; it fades 0.3 s after the last word, over the "
          "wordmark slam, and the title holds clean to the break. r6 (social critic, high): a big serif pull-quote from frame 0 "
          "(see above), cut by the wordmark slam at 3.889; 'WRONG…' is heard 3.45-3.93.")

# r3 (seen on the r3 motion strip): every frame that takes over from the previous card on the same frame now SLAMS in (full
# size on its first frame, 1.18 -> 1) instead of popping from zero, as Amodei, 96% and Musk did in r2: the OpenAI square, Leike,
# the Coxon ring, Kenya, the Coxon clip, the 19% tile, Stargate, Apollo and Lee. A pop from zero left 1-3 near-empty frames
# at each hand-over (13.58, 15.55, 17.40, 27.12, 29.10, 46.50). Pops stay where another element already holds the frame.
# ---------------------------------------------------------------- VERSE 1 (dark): bars 4-11
# r1 density: about one headline every two bars; tickers hold two bars (or are short); page captures are typeset.
BAND_V = {"cx": 540, "cy": 960, "h": 330}   # r5: the frame's middle (was 1135, under the LOOT frame), thicker for a 72 px headline
# r7 (motion critic: the band sat bare on black ~7.47-7.67 before the text; social critic: Fortune ~13 words in 2.0 s): the morph
# is 0.16 s (lands 7.499), the Fortune text lands ON it on the 8th before the vocal (beat 15.5, frame 225 = 7.500) and holds to bar
# 5 beat 3 (beat 22, 10.657), 3.16 s (~4.1 words/s); Yudkowsky's card starts there. Band and ticker kick together on beat 18 and
# bar 5 (with a camera hit), and the first vocal (7.683) gets a small hit, so the longer hold still moves on the beat.
FORT_IN, FORT_OUT = 7.5, "beat:22"
FORT_K = dict(kicks=[{"at": "beat:18", "s": 1.02, "dur": 0.16}, {"at": "bar:5", "s": 1.035, "dur": 0.2}], kickOrigin=[540, 960])
add(id="band-v1", type="band", t0="riff:15", t1=FORT_OUT, band=BAND_V,
    enter={"style": "morph", "from": "logo:band", "dur": 0.16, "delay": 0.06}, **FORT_K,
    _note="The logo's plane band stays behind at the break, then thickens into the 22-degree ticker for verse bars 4-5 (one "
          "headline, two bars). r1: centre raised from y 1300 to 1100 so the left end of the headline sits inside the "
          "Reels/TikTok text-safe area (left-end centreline about y 1274). r3: lands by 7.56 (delay 0.06, dur 0.22) and carries "
          "TWO tickers in turn, Fortune (bars 4-5) then TechCrunch (bar 6), each landing with the 2-frame ink flash; it slides out on bar 7. "
          "r5 (both critics, high: two or three text blocks at once in bars 4-6): the band carries Fortune ALONE through bar 4 and "
          "cuts out on bar 5 under Yudkowsky's slam (camera hit), so bar 5 belongs to him; the TechCrunch ticker and the LOOT frame "
          "are dropped. Centred on the frame (cy 960, 330 px thick), it is the bar's one picture.")

# FINAL PASS (motion critic, medium: a bare yellow band on black ~7.47-7.67, about 6 frames, before the Fortune text lands on
# the first vocal): two of the blown-out pieces land ON the band in the gap, beat-locked: the teal square on the 16th after the
# break (beat 15.25 = 7.39, frame 222) and a blue dot on the 8th (beat 15.5 = 7.50, frame 225; the riff's low end cuts out at
# song 26.76 = edit 7.53, measured 40-200 Hz on song/brutal.wav), each with a small camera hit. They cut on the vocal (7.683)
# under the ticker's 2-frame ink flash, so the text still lands alone. Centred on the band's axis (y = 960 - tan 22 (x - 540)).
add(id="v1-gap-sq", type="shape", t0="beat:15.25", t1=FORT_IN, frame={"shape": "square", "cx": 820, "cy": 847, "w": 112, "h": 112, "fill": TEAL, "rot": 15},
    enter={"style": "pop", "dur": 0.16}, hit=4)
add(id="v1-gap-dot", type="shape", t0="beat:15.5", t1=VOCAL1, enabled=False, frame={"shape": "circle", "cx": 250, "cy": 1077, "r": 50, "fill": BLUE},
    enter={"style": "pop", "dur": 0.14}, hit=4)

# bar 4: "I'm so insecure"
# r5 (motion critic, low: the LOOT box showed a raw log string, 'LOOT=[ENV VALUE 315]', that gives a viewer nothing to parse; social
# critic, high: the LOOT stamp plus the Fortune ticker put ~25 words on screen in bar 4): v1-loot is DROPPED (enabled: false, kept
# for the record); Fortune carries bar 4 alone on the centred band, and the teal square blows out with the other logo pieces.
add(id="v1-loot", type="image", t0="riff:15", t1="bar:5", src=A + "research/security/swarmtraces-loot.png", enabled=False,
    crop={"x": 14, "y": 911, "w": 316, "h": 50}, frame={"shape": "rect", "x": 90, "y": 560, "w": 900, "h": 142, "ring": TEAL, "ringW": 6},
    grade={"sat": 0.5, "contrast": 1.04, "brightness": -0.07, "gamma": 1.0}, oversample=1.0,
    enter={"style": "morph", "from": "logo:square", "dur": 0.22, "delay": 0.06},
    stamp={"year": "2026", "name": "A recovered agent script", "role": "Swarm Traces · Sep 25, 2026"}, textDelay=0.41, verified=True,
    _note="Plan v1a s1-loot-square (verify ok). r1: cropped to the single line 'LOOT=[ENV VALUE 315]' of the recovered script "
          "(swarmtraces-loot.png, source px x 14-330, y 911-961) at 2.85x, so the line is about 64 px tall and nothing runs off "
          "the frame. The teal square of the broken logo stays behind at the break and morphs into this frame. r2: stamp at the "
          "default y 300 (below the app header), frame moved down to y 430. r3 (social critic: two headlines at once in bars 4-5): "
          "the typeset LOOT headline is dropped, so Fortune is the only headline of bars 4-5; the source moves into the stamp's role "
          "line ('Swarm Traces · Sep 25, 2026', the page date verified in v1a.verify idx 1) and the frame sits at y 560, centred "
          "between the stamp and the Fortune label.")
# r3: v1-loot-hl (the typeset Swarm Traces heading 'An agent referred to server resources and credentials as “LOOT”') is
# dropped: with the Fortune ticker it put two headlines on screen in bars 4-5 (social critic). Fortune carries both bars.
# r7: invert 0 (no 2-frame near-black band on the landing: the Guardian fix, same reason); the gap dot (beat 15.5) is off, the
# text lands on its beat instead
add(id="v1-fortune", type="ticker", band="band-v1", t0=FORT_IN, t1=FORT_OUT, hit=6,
    shakes=[{"at": VOCAL1, "amp": 5, "decay": 0.06}, {"at": "bar:5", "amp": 7, "decay": 0.07}], **FORT_K,
    text="…hacked into AI company Hugging Face", hl="hacked into AI company Hugging Face",
    outlet="OpenAI says its AI models", date="Fortune · 2026", size=84, style={"w": 960, "labelStack": True, "labelGap": 18},
    invert=0, verified=True,
    _note="Plan v1a s1-fortune-ticker (verify ok). r1: holds two bars (3.9 s) instead of one. Full headline: 'OpenAI says its AI "
          "models secretly broke out of a secure test environment and hacked into AI company Hugging Face in order to cheat on "
          "an evaluation'; the ellipsis marks the cut. r5 (motion and social critics, high: it ran under Yudkowsky's card through "
          "bar 5): it ends on bar 5 (9.705), so it holds 2.0 s alone (10 words, the only text on screen), set at 74 px on the "
          "centred band. The social critic's 'OpenAI's AI models hacked into AI company Hugging Face' is not used: it rewrites "
          "'says its' and drops the ellipsis, and headlines stay verbatim. r6 (social critic, high: 15 words in 2.0 s): the "
          "label is 'FORTUNE · 2026' (the date, Jul 21, 2026, goes to the post caption), and the lead-in 'OpenAI says its AI models …' "
          "is set at 0.72 (dimRest; ~5:1 on the yellow) so the eye lands on the red clause 'hacked into AI company Hugging Face' (6 "
          "words) while the whole verbatim headline stays readable: 12 words in 2.0 s. The critic's option of a 6-word band with "
          "'OpenAI' in a stamp would read as 'OpenAI hacked into Hugging Face' (the company, not its models), which changes the "
          "claim; its other option (Yudkowsky from bar 5.5) would leave his 20-word sentence 2.9 s. The ticker already lands on the "
          "measured first vocal (7.683, song 26.915); the critic's 7.59 is bars.json's 26.82, the riff's level drop. "
          "FINAL PASS (social critic, high: ~13 words in 2.0 s, dimming adds no reading time): the band carries only the red "
          "clause, '…hacked into AI company Hugging Face' (6 words, 84 px), and the headline's subject rides in the stacked mono "
          "label above the band: 'OPENAI SAYS ITS AI MODELS' over 'FORTUNE · 2026'. Every word is the headline's, in order; the "
          "… marks the cut 'secretly broke out of a secure test environment and' (in the post caption with the full headline). "
          "'says' keeps the attribution and 'its AI models' keeps the claim about the models, not the company (the r6 objection "
          "to 'OpenAI' alone).")

# bars 5-6: "I think that I'll die before I drink" / "so caught up in the news" -- Yudkowsky's WHOLE sentence (r4)
# r4 (editorial critic, high: '…we are all going to die.' dropped the condition 'If we actually try to do this in real life,', so
# the card claimed more than he said): the full sentence is on screen for two bars (3.9 s), and the clip is cut from the full talk
# so he says the whole sentence inside the card. TechCrunch still takes over the shared band on bar 6 ('caught up in the news').
YUD_IN = 276.092  # r7: 275.14 + (beat 22 - bar 5) = 275.14 + 0.952, the card starts on beat 22. research/verify/yudkowsky-full.json: 'If' 276.72 -> 'die.' 280.32 in clips/yudkowsky-ted-2023-full.mp4 (small.en)
# FINAL PASS (social critic: verse 1 ran ~5.7 words/s; "drop the sycophancy card (bars 7 to 8) and extend the Yudkowsky card and
# clip"): the card holds THREE bars, bar 5 to bar 8 (5.80 s), so his 20-word sentence reads at ~3.6 words/s. The shot is one
# continuous wide take from 269.85 to 280.99 s (ffmpeg scene detection, cuts at 269.85 and 280.99), so the in-point moves back
# from 276.50 to 275.14 and the picture ends at 280.94, a frame before the camera cut. He says the sentence at card-local
# 1.58-5.18 s (edit 11.29-14.89), inside the card; the first 1.6 s is the end of his previous sentence, muted like the rest.
# It ends on Leike's slam (bar:8-0.01, frame 465), so the two cards never share a frame. Bar 7 gets its own event: a 3.5 % kick with a camera hit on the downbeat and a 2 % kick on beat 30 (kicks(5) + bar 7).
YUD_K = dict(kicks=kicks(5, skip=(0,)) + [{"at": "beat:28", "s": 1.035, "dur": 0.2}, {"at": "beat:30", "s": 1.02, "dur": 0.16}], kickOrigin=[540, 860])
add(id="v1-yud", type="clip", t0=FORT_OUT, t1="bar:8-0.01", src="clips/yudkowsky-ted-2023-full.mp4", **{"in": YUD_IN},
    crop={"x": 730, "y": 0, "w": 460, "h": 460}, frame={"shape": "circle", "cx": 540, "cy": 640, "r": 250, "ring": RED, "ringW": 8},
    grade=dict(DARK_CLIP, brightness=0.02, gamma=1.08, contrast=1.18), zoom=[1.0, 1.08], focus=[0.5, 0.3], enter="slam", hit=10, shakes=[{"at": "bar:6", "amp": 7, "decay": 0.07}, {"at": "bar:7", "amp": 7, "decay": 0.07}], **YUD_K,
    verified=True,
    _note="MUTED (sung verse). Plan v1a s2-yudkowsky-clip, re-cut r4 from the full talk (TED2023, YouTube Yd0yQ9yxSYY, 1920x1080, "
          "one continuous wide shot from 275 to 281 s, no camera cut). research/verify/yudkowsky-full.json: 'If we actually try to do "
          "this in real life, we are all going to die.' runs 276.72-280.32 s (small.en on 273.64 + 9.68 s; the preceding sentence "
          "ends at 275.80 with a full stop). Picture in 276.50, so he says the whole sentence at card-local 0.22-3.82 s, inside the "
          "two bars (3.90 s). Crop 400 px around his head and chest (he drifts from x ~860 to ~1040 over the line). His words are the pull-quote "
          "v1-yud-q. r4: the circle moves to the upper right (cx 800, cy 525, r 200) so the full sentence can run down the left "
          "column from y 300, ending above the band's attribution line (y ~870). "
          "r5 (motion critic, low: a flat pink disc with no content showed at the upper right for ~3 frames at 9.75-9.85 s): that "
          "was this frame's morph out of the logo's pink circle (the colour fades off as it grows). It now SLAMS in on bar 5, full "
          "size with the clip on its first frame, like every other hand-over. With the band gone in bars 5-6 (r5), the card uses "
          "the whole frame: the circle is larger and centred above (cx 540, cy 640, r 250), the sentence runs under it. Beat kicks "
          "on beats 22, 24 (bar 6, with a camera hit) and 26. At this size the crop is 460 px centred on x 960 (he drifts from x ~860 "
          "to ~1040 over the line), and the grade is lifted (brightness +0.02, gamma 1.08): the dark verse grade left the larger circle "
          "nearly black on the r5 stills.")
# r7: from beat 22 (Fortune holds the first half of bar 5): 4.84 s for label 2 + sentence 16 + '2023 · Eliezer Yudkowsky' 3 =
# 21 words (~4.3 words/s; was 3.6, while Fortune drops from ~6.4 to ~4.1). He says the sentence at edit 11.29-14.89, inside the card.
add(id="v1-yud-q", type="pullquote", t0=FORT_OUT, t1="bar:8-0.01", label="On superintelligence",
    text="“If we actually try to do this in real life, we are all going to die.”", hl="we are all going to die", size=78,
    style={"x": 60, "w": 960, "y": 950, "labSize": 38}, name="Eliezer Yudkowsky", year="2023",
    enter="slam", textDelay=0.0, **YUD_K, verified=True,
    _note="r4: the WHOLE sentence, verbatim (research/verify/yudkowsky-full.json; base.en and small.en agree word for word), so the "
          "condition stays with the claim. No ellipsis: the sentence starts at 'If' (the one before ends with a full stop at 275.80). "
          "The red label says what 'this' is: the sentences just before are 'Some of the people leading these efforts have spent the "
          "last decade not denying that creating a superintelligence might kill everyone, but joking about it. We are very far "
          "behind. This is not a gap we can overcome in six months given a six-month moratorium.' (small.en, 260.98-275.80). "
          "Talk: 'Will superintelligent AI end the world?', TED2023 (April 2023). r6 (social critic, high: density): the role line "
          "'TED2023' goes to the post caption (the chip says 2023); the whole sentence stays (r4 editorial): 20 words in 3.9 s.")
# r1: the BBC '10% chance' ticker planned for this bar is dropped (lowest priority in the run: it repeats Yudkowsky's point
# and needs the Hubinger caveat), so the verse carries about one headline every two bars.

# bar 6: "so caught up in the news" -- one headline, on the shared band (r3)
# r3 (social critic: TIME's 12 words in 1.94 s): the TIME card ('AI Is Developing a Culture of Its Own. That Could Be
# Dangerous') is dropped rather than given two bars, because bar 7 also carried two text blocks (the OpenAI line and the
# TechCrunch ticker, 14 words in 1.9 s). The sycophancy pair now gets one bar each: the headline on 'caught up in the news',
# the thumbs-up / thumbs-down line on 'who likes me and who hates you'.
# r4: the empty red ring that popped on bar 6 (v1-tc-ring) is gone: Yudkowsky's clip and sentence hold the top of the frame.
# r5 (social critic, high: TechCrunch + the Yudkowsky quote = ~33 words in 2 s; motion critic, high: two blocks in bar 6): the
# TechCrunch ticker is DROPPED (enabled: false). Its context ('too sycophantic') moves to the OpenAI quote's red label in bar 7,
# taken from the post's own title ('Sycophancy in GPT-4o: what happened and what we're doing about it').
add(id="v1-tc", type="ticker", band="band-v1", t0="bar:6", t1="bar:7", hit=4, enabled=False,
    text="OpenAI explains why ChatGPT became too sycophantic", hl="too sycophantic", outlet="TechCrunch", date="Apr 29, 2025", size=66,
    style={"w": 940}, verified=True,
    _note="Plan v1a s4-techcrunch-ticker (verify ok; Kyle Wiggers; h1 checked on the live page). 7 words, one bar. r3: moved from "
          "bar 7 to bar 6 and set on the shared verse band (it takes over from Fortune with the ink flash).")

# bar 7: "who likes me and who hates you"
# FINAL PASS (social critic): the sycophancy card (ring + quote) is DROPPED (enabled: false). Its explaining ticker (v1-tc) was
# already off, so '…thumbs-up / thumbs-down feedback…' rested on its label alone; bar 7 goes to the Yudkowsky card.
add(id="v1-openai-ring", type="shape", enabled=False, t0="bar:7", t1="bar:8+0.04", frame={"shape": "square", "cx": 540, "cy": 860, "w": 740, "h": 740, "ring": RED, "ringW": 8, "rot": 15},
    enter="slam", hit=5, exit={"style": "collapse", "dur": 0.12},
    _note="r3: alone in the bar now, a tilted square (the logo's square at 15 degrees) instead of the small corner frame. r4: "
          "its collapse runs 40 ms past bar 8 (under Leike's slam), so the frame before the slam still shows it at ~1/4 size instead "
          "of a point on an empty ground. r6 (frame scan): the collapse is 0.12 s (was 0.2), so the last frame before Leike's slam "
          "(464) shows the square at ~86 % instead of ~1/3 (0.5 % of the frame had content).")
add(id="v1-openai-q", type="pullquote", enabled=False, t0="bar:7", t1="bar:8+0.04", label="Sycophancy in GPT-4o",
    text="“…thumbs-up / thumbs-down feedback…”", upright=True,
    hl="thumbs-up / thumbs-down", size=84, style={"x": 220, "w": 640, "cy": 860, "align": "center", "labSize": 40}, name="OpenAI", year="2025",
    enter="slam", textDelay=0.0, exit={"style": "collapse", "dur": 0.12}, verified=True,
    _note="Plan v1a s4-openai-quote (verify ok): tail of 'We also teach our models how to apply these principles by incorporating "
          "user signals like thumbs-up / thumbs-down feedback on ChatGPT responses.' (Sycophancy in GPT-4o, Apr 29, 2025). r1: "
          "the text collapses with its frame. r3: the only block in its bar (the TechCrunch ticker moved to bar 6). r4 (seen on the r4 strip: the tilted square stood "
          "empty for 3 frames after its slam): textDelay 0.1 -> 0.03. r5 (motion critic, medium: the italic body read as tilted "
          "inside the 15-degree square): set upright (roman); only the frame keeps its tilt. With the TechCrunch ticker dropped, "
          "the red label 'Sycophancy in GPT-4o' (the post's title: 'Sycophancy in GPT-4o: what happened and what we're doing about "
          "it') says why the feedback line matters; the role line is 'Blog' (the date, Apr 29, 2025, goes to the post caption), so the "
          "bar carries 15 words, not 18. r6 (social critic, high: density): cut to '…thumbs-up / thumbs-down feedback…' (the "
          "post's 'by incorporating user signals like' and 'on ChatGPT responses' cut, marked …; same meaning: the models were taught "
          "with that feedback) at 84 px, and the role 'Blog' goes to the caption: label 3 + quote 3 + '2025 · OpenAI' = 8 words in 1.9 s. "
          "Frame scan (r6): the text rose in 0.03 s after the square's slam, so frame 408 showed only the thin red outline; it now "
          "slams in with the square, and collapses with it in 0.12 s.")

# bars 8-9: "so tired that I might" / "quit my job, start a new life" -- two resignations, stacked (r4)
# r4 (editorial critic: cutting 'for quite some time' makes 'breaking point' read as one sudden event): Leike's card keeps the
# long disagreement and holds BOTH bars (3.9 s) in the top half; Coxon's resignation slams in under it on bar 9 ('quit my job').
LEIKE_IN = "bar:8-0.01"   # r4: bar 8 is 15.507 on the grid, so frame 465 (15.500) fell between the OpenAI square's collapse
                          # (gone by 15.507) and Leike's slam: one blank frame. Starting 10 ms early puts the card on frame 465.
# r6 (social critic, medium: from 17.39 to 19.35 Leike's 25 words and Coxon's 12 were on screen together): Leike holds BOTH bars
# ALONE, centred in the frame, and Coxon's X-post card is dropped (his Daily Show clip carries him in the chorus, bar 13.75). Bar
# 9 ('quit my job') gets its own event: the 'breaking point' chip wipes on with a 3.5 % kick and a camera hit.
LEIKE_K = dict(kicks=kicks(8), kickOrigin=[540, 890])
add(id="v1-leike-card", type="shape", t0=LEIKE_IN, t1="bar:10", frame={"shape": "square", "x": 60, "y": 560, "w": 960, "h": 660, "ring": RED, "ringW": 8},
    enter="slam", hit=6, shakes=[{"at": "bar:9", "amp": 8, "decay": 0.07}], **LEIKE_K)
# r7 (density: 21 words in 3.85 s): the label is "Resigning" (the quote itself names OpenAI leadership): 19 words, ~4.9 words/s.
# The quote is not trimmed further: 'for quite some time' is the r4 editorial condition.
add(id="v1-leike", type="pullquote", t0=LEIKE_IN, t1="bar:10", label="Resigning",
    text="“…disagreeing with OpenAI leadership … for quite some time, until we finally reached a breaking point.”", hl="breaking point",
    hlAt="bar:9", hlWipe=0.2,
    size=70, style={"x": 120, "w": 840, "cy": 890}, name="Jan Leike", year="2024",
    enter="slam", textDelay=0.0, **LEIKE_K, verified=True,
    _note="Plan v1b-01 (verify ok). r1: typeset from the post (x-leike-2024-05-17-breaking-point.png, second post of the thread, "
          "3:57 PM · May 17, 2024) instead of the page capture: 'However, I have been disagreeing with OpenAI leadership about the "
          "company's core priorities for quite some time, until we finally reached a breaking point.' One sentence; the ellipses "
          "mark 'However,' and 'about the company's core priorities for quite some time,'. No X mark or chrome. r2 (both critics: "
          "14 words in one bar, ~7 w/s): cut to the sentence's end, '…until we finally reached a breaking point.' (7 words); the "
          "red label 'Resigning from OpenAI' carries the context the cut removes (the thread says he is 'resigning from my job as "
          "head of alignment', lyrics/quit-my-job.json; 'we' = Leike and OpenAI leadership). r3 (motion critic: one bar only if the "
          "role line goes): the 'X post · May 17, 2024' role line is dropped; label, quote, '2024' and the name stay. The post's date "
          "is in out/NOTES.md. r4 (editorial critic): '…disagreeing with OpenAI leadership … for quite some time, until we finally "
          "reached a breaking point.' (15 words of the one sentence, in order; the ellipses mark 'However, I have been' and 'about the "
          "company's core priorities'), on screen for two bars (3.9 s, about 4.6 words/s with the label), so the motion critic's "
          "reading-load limit still holds. research/verify/leike-full.json: x.com/janleike/status/1791498178346549382, "
          "2024-05-17T15:57:04Z, second post of the thread; the role line 'X post · May 17, 2024' is back now the card has time. "
          "r6 (social critic, medium): alone for both bars, centred (card y 560-1220, 70 px); the role line goes to the post "
          "caption again (label 3 + quote 15 + '2024 · Jan Leike' = 21 words in 3.9 s, the only block on screen); 'breaking point' "
          "wipes on on bar 9 (hlAt) with the bar's kick and a camera hit. Seen on the r6 strip: frames 465-466 showed the slammed "
          "card as an empty red outline while the text rose in, so the text now slams in with the card (enter slam, no delay).")

# bar 9: "quit my job, start a new life" -- Coxon's resignation lands under Leike's card
COXR_K = dict(kicks=[{"at": "beat:38", "s": 1.03, "dur": 0.18}], kickOrigin=[540, 1185])
add(id="v1-coxon-ring", type="shape", t0="bar:9", t1="bar:10", frame={"shape": "circle", "cx": 540, "cy": 1185, "r": 270, "ring": RED, "ringW": 10},
    enter="slam", hit=8, enabled=False, **COXR_K)
add(id="v1-coxon", type="pullquote", t0="bar:9", t1="bar:10", text="“I resigned from Anthropic today.”", hl="resigned",
    size=64, style={"x": 300, "w": 480, "cy": 1162, "align": "center"}, name="Jacob Coxon", year="2026", role="X\u00a0post\u00a0·\u00a0Sep\u00a09,\u00a02026",
    rule=False, enter="slam", enabled=False, **COXR_K, verified=True,
    _note="Plan v1b-02 (verify ok): the post's first sentence, verbatim (x-coxon-2026-09-08-resigned-anthropic.png, 12:04 AM · "
          "Sep 9, 2026). r1: typeset instead of the page capture (no X mark, no Follow button). r4: a circle under Leike's card "
          "(the two resignations stacked on 'so tired that I might / quit my job'); the role line is set with non-breaking spaces so "
          "it wraps as one line under the name. r6: DROPPED (enabled: false; social critic, medium: two text blocks at once under "
          "Leike's card). Coxon is in the long cut once, on The Daily Show (ch-coxon).")

# bars 10-11: "they'd all be so disappointed / who am I if not exploited" -- one headline, two bars
# r1: the TechCrunch 'culture is broken' ticker (bar 10) is dropped so the Kenya headline (15 words) gets two bars.
KENYA_K = dict(kicks=kicks(10), kickOrigin=[540, 850])   # r5: beat-locked kicks; bar 11's is the big one, with the shake and the wipe
add(id="v1-kenya-ring", type="shape", t0="bar:10", t1="bar:12", frame={"shape": "square", "x": 80, "y": 470, "w": 920, "h": 760, "ring": RED, "ringW": 10},
    enter="slam", zoom=[1.0, 1.045], shakes=[{"at": "bar:11", "amp": 9, "decay": 0.07}], **KENYA_K)
# r7 (the short's TIME/BBC note, same pattern: a 2-frame cream-paper landing on the dark verse ground reads as a state flip):
# invert 0, light type on dark from the first frame; the landing is the slam with its 6 px hit
add(id="v1-kenya", type="headline", t0="bar:10", t1="bar:12", enter="slam", hit=6, hlAt="bar:11", hlWipe=0.2, zoom=[1.0, 1.045], invert=0,
    text="…OpenAI Used Kenyan Workers on Less Than $2 Per Hour to Make ChatGPT Less Toxic", hl="Kenyan Workers",
    outlet="TIME", date="2023", size=70, style={"x": 150, "w": 780, "cy": 850}, **KENYA_K, verified=True,
    _note="Plan v1b-04 (verify ok; Billy Perrigo). r1: two bars (3.9 s) for its 15 words. r3 (motion critic: a 4 s static hold): "
          "the card and its ring push in slowly (1 -> 1.045 over both bars, same centre and curve), and on bar 11 ('who am I if not "
          "exploited') the red 'Kenyan Workers' highlight wipes on left to right with a camera hit. r5 (motion critic, medium: "
          "the hold still ignored the beat; Kenya needs a beat hit at bar 11, not only the wipe): card and ring kick together on "
          "beat 42 (2 %), bar 11 (3.5 %, with the shake and the wipe) and beat 46 (2 %). r6 (social critic, high: density): the "
          "headline's 'Exclusive:' tag is cut (marked …; the headline is otherwise verbatim) and the attribution is 'TIME · 2023' "
          "(Jan 18, 2023 in the post caption): 16 words in 3.9 s.")

# ---------------------------------------------------------------- CHORUS (full colour, cream): bars 12-19
# r1: filled Kandinsky tiles behind about one card in three (bars 12, 15, 18), not only outlines.
# bar 12: "so sick of seventeen"
AMODEI_IN = "beat:51"   # r2: Amodei enters on the beat after 'seventeen' (song 43.93; 'Where's' ~44.04), so it gets 2.4 s
# r6 (social critic, high: on-screen text ~2.5x the brief's 3 words/s; "cut one of the six chorus cards (the 17,600, Hinton or
# Turing cards are the candidates) and give the remaining cards 3 to 4 s holds"): the 17,600 card is CUT (enabled: false; it held
# ~11 words for 1.45 s and was the long cut's second Hugging Face item after Fortune). Amodei takes the chorus downbeat and holds
# to beat 55 (3.4 s) and the Coxon clip gets 2.4 s (beat 55 to bar 15). Hinton ('I can't see a path that guarantees safety' on
# 'I'm anxious and nothing can help') and Turing (1951, on 'I wish I'd done this before') keep their bars: both are closer
# lyric matches than '~17,600' on 'seventeen'.
CH17 = dict(enabled=False)
AMODEI_IN, AMODEI_OUT = "bar:12", "beat:55"
add(id="ch-17600-sq", **CH17, type="shape", t0="bar:12", t1=AMODEI_IN, frame={"shape": "square", "cx": 150, "cy": 1450, "w": 400, "h": 400, "fill": PINK, "rot": 15},
    enter={"style": "fly", "from": "left", "dist": 700, "dur": 0.22})
add(id="ch-17600-ring", **CH17, type="shape", t0="bar:12", t1=AMODEI_IN, frame={"shape": "circle", "cx": 560, "cy": 950, "r": 520, "fill": BLUE}, enter="slam", hit=8,
    _note="r4 (seen on the r4 strip): the chorus downbeat frame showed only a small blue dot (the disc popped from zero under the "
          "flash); the disc now slams in at full size on the downbeat, the pink square still flies in from the left.")
add(id="ch-17600", **CH17, type="pullquote", t0="bar:12", t1=AMODEI_IN, big="~17,600", bigSize=180, text="attacker actions recovered",
    upright=True, size=58, style={"x": 220, "w": 680, "cy": 950, "align": "center", "color": CREAM, "bigColor": CREAM}, enter="rise", textDelay=0.1, verified=True,
    _note="Plan ch-a-01 (verify ok): verbatim 'covers ~17,600 attacker actions that we were able to recover' (Hugging Face technical "
          "timeline, Jul 27, 2026). The 17 lands on 'seventeen'. r1: a half-bleed filled blue disc (not an outline ring) with a "
          "pink square behind it; the figure is set in cream on the blue (about 5:1). r2: stamp at y 300 (below the app header) with "
          "the date in the chip ('JUL 27, 2026') and 'Incident timeline' as the role, so the 38-40 px line fits; the disc moves down "
          "to cy 950 to clear it; the card hands over to Amodei on beat 51 (it is up through 'seventeen'). r3 (social critic: 8 words "
          "plus a stamp in 1.45 s): the sub-line is shortened to 'attacker actions recovered' (unquoted, upright: a description of "
          "the source's '~17,600 attacker actions that we were able to recover', same meaning: the count of recovered actions). "
          "The card cannot hold longer: '17' sits on 'seventeen' and Amodei needs its 2.4 s.")
add(id="ch-17600-stamp", **CH17, type="stamp", t0="bar:12", t1=AMODEI_IN, stamp={"year": "Jul 27, 2026", "name": "Hugging Face", "role": "Incident timeline"},
    _note="r4: drawn after the disc, so the disc's 1.18x slam on the chorus downbeat passes under the stamp.")

# bar 13: "where's my [explicit] teenage dream"
AMO_K = dict(kicks=kicks(12), kickOrigin=[540, 850])
add(id="ch-amodei-disc", type="shape", t0="beat:49", t1=AMODEI_OUT, frame={"shape": "circle", "cx": 240, "cy": 1300, "r": 200, "fill": BLUE},
    enter={"style": "pop", "dur": 0.22}, **AMO_K,
    _note="r6: with the 17,600 card cut, the chorus's blue disc is a half-bleed accent behind the pink tile's lower-left corner; "
          "it pops on the downbeat's second beat (as the 17,600 card's pink square flew in) and kicks with the card. FINAL PASS (motion "
          "critic, low: at cx 170, cy 1310 it clipped the card's corner and the frame edge, a sliver that read as an accidental "
          "tangent): its centre sits ON the card's bottom edge (cx 240, cy 1300), so exactly half of it shows as a clean half-disc "
          "under the tile, wholly inside the frame (x 40-440, y 1300-1500), the cover's layered-circle look.")
add(id="ch-amodei-ring", type="shape", t0=AMODEI_IN, t1=AMODEI_OUT, frame={"shape": "square", "x": 90, "y": 400, "w": 900, "h": 900, "fill": PINK},
    enter="slam", hit=8, **AMO_K, _note="r2: slams in (full size on its first frame), so the hand-over from the 17,600 card has no empty frame. "
                                        "r6: it slams on the chorus downbeat (bar 12) under the cream ground's flash.")
add(id="ch-amodei", type="pullquote", t0=AMODEI_IN, t1=AMODEI_OUT,
    text="“…the dream of a civilization that had made it through to adulthood…”", hl="the dream", size=80, hlAt="bar:13", hlWipe=0.2,
    style={"x": 160, "w": 760, "cy": 850, "color": INK, "hlColor": INK, "hlBg": CREAM, "dimColor": "#3A1027"}, name="Dario Amodei", year="2026",
    role="Anthropic CEO", enter="slam", textDelay=0.0, **AMO_K, verified=True,
    _note="REPLACEMENT for ch-a-02 (the Guardian 'golden age' headline was planned twice; it stays on 'golden years'). From "
          "lyrics/teenage-dream.json; re-checked 10 Oct by fetching darioamodei.com/essay/the-adolescence-of-technology (header "
          "'January 2026'): '...In my essay Machines of Loving Grace, I tried to lay out the dream of a civilization that had made it "
          "through to adulthood, where the risks had been addressed...'. No picture event on the explicit word (song 44.86-45.25). "
          "r2 (both critics: 16 words in 1.9 s): trimmed to '…the dream of a civilization that had made it through to adulthood…' "
          "(12 words; 'I tried to lay out' cut, meaning unchanged) and on screen 2.4 s from beat 51 (~5 w/s). Filled pink tile, "
          "ink type (about 5.8:1), the highlight as a cream-on-ink chip. r5 (social critic, high: 23 words in 2.4 s): the source line "
          "'Essay: The Adolescence of Technology' moves to the post caption (out/NOTES.md); on screen the quote, 'Jan 2026 · Dario "
          "Amodei · CEO, Anthropic' (18 words). r6: on the chorus downbeat for 3.4 s (bar 12 to beat 55; the 17,600 card is cut), "
          "17 words (~5 w/s). The chip is 'Jan 2026' -> '2026' (the essay's month is in the post caption). Motion critic (low): the "
          "body was already ink on the pink (#15131F on #FF2E88, ~5.3:1; the 'cream' read was the thumbnail), but the black highlight "
          "chip broke the cut's highlight system, so the chip is now cream with ink type, and it wipes on on bar 13 ('where's my … "
          "teenage dream', 25.175, 0.45 s before the explicit word, which still has no picture event) with the bar's 3.5 % kick. "
          "Seen on the r6 strip: the chorus downbeat (frames 698-699) showed an empty pink tile under the cream flash while the "
          "quote rose in, so the quote now slams in with the tile.")

# bar 14: "if someone tells me one more time"
add(id="ch-coxon", type="clip", t0=AMODEI_OUT, t1="bar:15", src="clips/coxon-daily-show.mp4", **{"in": 451.75},
    crop={"x": 250, "y": 20, "w": 540, "h": 540}, frame={"shape": "circle", "cx": 540, "cy": 690, "r": 300, "ring": VIOLET, "ringW": 18},
    grade=FULL_CLIP, zoom=[1.0, 1.05], focus=[0.5, 0.4], enter="slam", hit=6, verified=True,
    _note="MUTED (sung chorus). Plan ch-a-03: its verify flagged the speaker/year, so re-checked here: the transcript shows the "
          "guest (28, worked at Anthropic and OpenAI) saying it at 452.24-454.26 and the host says 'Jacob Cox[on]' at 1546.3; a frame "
          "at 452.8 shows the guest speaking. Same guest and attribution as the short's verified Coxon clip (research/verify/SUMMARY.md). "
          "Source: youtube.com/watch?v=lnLDjXy2kRA. Picture starts at 452.25 ('Like,') so the bar ends before the camera cut at 454.21. "
          "r6: 2.42 s from beat 55 (26.620, after the explicit word and 'teenage dream'), so the picture starts at 451.75 (one "
          "continuous shot of the guest from before 450 to the cut at 454.22, checked with ffmpeg scene detection; muted, so the "
          "extra 0.5 s is him finishing 'that's not happening' on mute) and ends at 454.17.")
# r7 (right rail: the one-line label ran to x 945 at y 1033-1092): w 860 and non-breaking spaces in "the escaped agent", so the
# label sets as "OPENAI RESTARTED" / "THE ESCAPED AGENT" (both lines end left of x 930); the quote (to x 785) is unchanged
add(id="ch-coxon-q", type="pullquote", t0=AMODEI_OUT, t1="bar:15", label="OpenAI restarted the\u00a0escaped\u00a0agent", text="“…and it did it again.”",
    hl="it did it again", size=84, style={"x": 60, "w": 860, "y": 1040}, name="Jacob Coxon", year="2026",
    enter="rise", textDelay=0.08, verified=True,
    _note="Heard on tape (transcript 445.38-454.26): 'because OpenAI specifically, they saw the thing poking its head out of the "
          "sandbox, and they were like, that's not happening. Like, restarted the thing, and it did it again.' r3: the motion critic "
          "(8 words + name in one bar) and the social critic (no context: what is 'the thing', what did 'it' do) are both met by "
          "the core of the line, '…and it did it again.' (cut 'Like, restarted the thing,', marked …), under a red context label in "
          "the house style, 'OpenAI restarted the escaped agent': Coxon's own account ('they saw the thing poking its head out of "
          "the sandbox … restarted the thing'; earlier, 421.5-424.9: 'it figured out it was in a sandbox, hacked its way out of the "
          "sandbox'), and Fortune's 'secretly broke out of a secure test environment' (v1-fortune). 10 words in 1.93 s. "
          "r4 (editorial critic: show and year unconfirmed): research/verify/coxon-daily-show-date.json confirms the segment aired "
          "Monday, Oct 5, 2026 (The Daily Show with Jon Stewart, Season 31, Episode 111; YouTube lnLDjXy2kRA; LateNighter, Oct 5, "
          "11:52 AM ET: Coxon 'set to sit down tonight'; Newsweek, IBTimes UK and Mediaite, Oct 6: 'Monday'; Wikipedia's 2026 episode "
          "list: Episode 111, October 5, guest 'Former researcher at OpenAI and Anthropic'). About 92% confidence; no network listing "
          "page could be read. The role line now carries the air date. This supersedes plan ch-a.verify idx 2 (ok: false: "
          "placeholder source_url, no air date); the source URL is https://youtube.com/watch?v=lnLDjXy2kRA. r5 (social critic, "
          "high: ~19 words in 1.9 s): the role line is 'The Daily Show' (the chip says 2026); the air date, Oct 5, 2026, is in the "
          "post caption (out/NOTES.md). r6 (social critic, high: 15 words in 1.9 s): 2.4 s from beat 55, and the role line goes to "
          "the post caption (The Daily Show, Oct 5, 2026: re-confirmed by research/verify/coxon-daily-show-date.json): label 5 + "
          "quote 5 + '2026 · Jacob Coxon' = 13 words in 2.4 s.")

# bars 15-16: "'enjoy your youth,' I'm gonna cry" / "I don't stick up for myself" -- the 19% card, two bars (r3)
# r3 (social critic: a bare '19% below' reads as a year-on-year drop, which changes the claim): the baseline is on screen, and the
# card holds two bars so the longer line reads. The CNN 'HOAX' ticker that held bar 16 is dropped (the chorus's weakest lyric
# match, and the only way to free a bar without moving an item off its lyric).
add(id="ch-19-stamp", type="stamp", t0="bar:15", t1="bar:17", stamp={"year": "2026", "name": "Stanford study"},
    _note="r2: chip '2026' (was 'Aug 2026') so the 40 px name and 38 px authors each fit one line above the tile. r5 (social "
          "critic, high): the authors (Brynjolfsson, Chandar, Chen) move to the post caption; the stamp is year + lab. r6 (social "
          "critic, high/medium: 26 words in 3.9 s): 'Stanford study' (the Digital Economy Lab and the authors are in the post caption).")
S19_K = dict(kicks=kicks(15), kickOrigin=[540, 790])
add(id="ch-19-ring", type="shape", t0="bar:15", t1="bar:17", frame={"shape": "square", "x": 90, "y": 450, "w": 900, "h": 680, "fill": VIOLET},
    enter="slam", hit=6, zoom=[1.0, 1.02], **S19_K)
add(id="ch-19", type="pullquote", t0="bar:15", t1="bar:17", label="Young workers (22–25) in AI-exposed jobs",
    big="19% below", bigDim=" below", bigSize=160, text="where it would be had it kept pace with … less-exposed peers", upright=True, size=62,
    style={"x": 150, "w": 780, "cy": 790, "lh": 1.12, "color": CREAM, "bigColor": CREAM, "bigDimColor": YEL, "labColor": CREAM, "labSize": 42},
    enter="cut", **S19_K, verified=True,
    _note="Plan ch-a-04 (verify ok). Source (abstract, verbatim): 'employment of young workers (ages 22–25) in AI-exposed occupations "
          "now stands 19% below where it would be had it kept pace with that of their less-exposed peers'. Descriptive, not causal: "
          "nothing on screen says AI caused it. r1: a filled tile. r2: violet with cream type (about 5.5:1). r3 (social critic): the "
          "card now reads as the comparison it is: label 'Employment of young workers (22–25) in AI-exposed jobs' (the subject), "
          "'19% below', 'the trend of less-exposed peers' (the baseline: 'where it would be had it kept pace with … their "
          "less-exposed peers'). The text is upright and unquoted (a description of the finding, not a quotation). Two bars "
          "(bars 15-16, 3.9 s) for its 13 words. r4 (editorial critic, high: 'the trend of' is our paraphrase, and the cut at "
          "'occupations' was unmarked): every word on the card is now the abstract's, in its order: 'Employment of young workers "
          "(ages 22–25) in AI-exposed occupations' / '19% below' / 'where it would be had it kept pace with that of their "
          "less-exposed peers'; only the linking 'now stands' between the label and the figure is left out (the card is an "
          "unquoted stat card, not a quotation, so there is no quote to mark). research/verify/stanford-19pct.json: verbatim in the "
          "abstract of the August 2026 revision (PDF p. 1, 'Revised August 12 2026', data through June 2026), "
          "digitaleconomy.stanford.edu/app/uploads/2026/08/Canaries_August2026.pdf; the 19% is the paper's descriptive series (15% "
          "in Jul 2025 -> 19% in Jun 2026), not a regression estimate. Not sourced to the deck's swe-by-age chart (no 19% on it). "
          "r5 (social critic, high: ~33 words in 3.9 s): the authors leave the stamp (post caption); the counterfactual STAYS on "
          "screen, because a bare '19% below' reads as a plain decline (the r3 editorial and social issue; the critic says it "
          "'does not make sense without it'), and the card cannot take a third bar without dropping Hinton's 'I can't see a path "
          "that guarantees safety' on 'I'm anxious and nothing can help'. Beat kicks on beats 62, 64 (bar 16, with the yellow dot) "
          "and 66. r6 (motion critic, medium: a 10-word, three-line 38 px label read as texture; social critic, medium: 26 words in "
          "3.9 s; both: 'Young workers (22-25) in AI-exposed jobs'): the label is 'Young workers (22–25) in AI-exposed jobs' at 42 px "
          "(two lines). 'Jobs' is the paper's own word (research/verify/stanford-19pct.json: Section 2.2 and the introduction say "
          "'AI-exposed jobs'), and 'young workers in AI-exposed jobs' counts the same people as 'employment of young workers in "
          "AI-exposed occupations', so the figure keeps its subject. The counterfactual STAYS (a bare '19% below' reads as a plain "
          "decline, the r3 issue), cut to 'where it would be had it kept pace with … less-exposed peers' ('that of their' cut, marked "
          "…). On screen: 'Stanford study' 2 + label 6 + '19% below' + 11 = 21 words in 3.9 s (was 26). The full sentence is in the "
          "post caption.")
add(id="ch-19-dot", type="shape", t0="bar:16", t1="bar:17", frame={"shape": "circle", "cx": 985, "cy": 1140, "r": 150, "fill": YEL},
    enter={"style": "pop", "dur": 0.22}, hit=6, kicks=kicks(15, skip=(0, 1)), kickOrigin=[540, 790],
    _note="r3: the bar-16 event inside the two-bar hold: a plane-yellow disc pops over the tile's lower-right corner (no text there).")

# bar 17: "I'm anxious and nothing can help"
add(id="ch-hinton-tile", type="shape", t0="bar:17", t1="bar:18", frame={"shape": "circle", "cx": 250, "cy": 500, "r": 250, "fill": BLUE},
    enter={"style": "pop", "dur": 0.22},
    _note="r2 (motion critic): a filled tile behind the Hinton clip, so the chorus has a filled shape every one or two cards. "
          "r3: cy 430 -> 500 so its top (y 250) stays below the platform header.")
add(id="ch-hinton", type="clip", t0="bar:17", t1="bar:18", src="clips/hinton-no-path-to-safety-2023.mp4", **{"in": 1.60},
    crop={"x": 270, "y": 0, "w": 600, "h": 600}, frame={"shape": "square", "x": 240, "y": 380, "w": 600, "h": 600, "ring": TEAL, "ringW": 18},
    grade=FULL_CLIP, zoom=[1.0, 1.04], focus=[0.5, 0.4], enter="slam", hit=6, verified=True,
    _note="MUTED (sung chorus). Plan ch-b-03 (verify ok). In-point re-checked with small.en on the clip: 'I can't see a path that "
          "guarantees safety.' = clip 1.70-3.90, so he says it inside the bar. The duplicate Vox ticker planned for this bar is dropped.")
add(id="ch-hinton-q", type="pullquote", t0="bar:17", t1="bar:18", text="“I can’t see a path that guarantees safety.”", hl="guarantees safety",
    size=70, style={"x": 60, "w": 900, "y": 1050}, name="Geoffrey Hinton", year="2023", enter="rise", textDelay=0.08, verified=True,
    _note="r6 (social critic, high: density): the role line 'CBS 60 Minutes' goes to the post caption: 10 words in 1.9 s.")

# bar 18: "I wish I'd done this before"
add(id="ch-turing-sq", type="shape", t0="bar:18", t1="bar:19", frame={"shape": "square", "cx": 990, "cy": 590, "w": 520, "h": 520, "fill": TEAL, "rot": 15},
    enter={"style": "fly", "from": "right", "dist": 800, "dur": 0.22}, hit=6)
add(id="ch-turing", type="pullquote", t0="bar:18", t1="bar:19", big="1951", bigSize=240,
    # r7 (editorial: cutting 'we should have to' made a hedged forecast read flatter): the clause is restored, "…we should have to
    # expect the machines to take control…" (Quote Investigator: 'At some stage therefore we should have to expect the machines to
    # take control, in the way that is mentioned in Samuel Butler's Erewhon.'; only 'At some stage therefore' and the tail are cut)
    text="“…we should have to expect the machines to take control…”", hl="the machines to take control", size=80,
    style={"x": 60, "w": 900, "cy": 880, "bigColor": INK}, name="Alan M. Turing", enter="cut", verified=True,
    _note="Plan ch-b-04 (verify ok; Quote Investigator). Venue deliberately not named. The CAIS-statement image planned on beat 2 "
          "is dropped: its May 30, 2023 date was not confirmed by the verifier, and the bar is already dense. r1: the teal square "
          "is a half-bleed filled tile behind the year, which is set in ink. r2 (social critic: 14 words in 2.0 s): 'At some stage "
          "therefore' cut, marked …; 10 words, meaning unchanged. r3 (motion critic: 10 words + '1951' + name in one bar): cut to "
          "the core, '…expect the machines to take control…' (6 words; 'we should have to' cut, marked …; 'expect' is kept so it "
          "stays a forecast, not a claim). The teal square moves down (cy 590, 520 px, rotated 15) so its top corner stays below "
          "y 250 (was ~139, under the platform header).")

# bar 19: "I wish people liked me more"
# r5 (social critic, high: the Gallup stack, the 'Americans Cool Toward AI' ticker and the 39% card with two attributions, ~19
# words in 1.9 s): ONE block. The headline ticker is dropped (enabled: false); the 39% figure rides the yellow plane band itself,
# on the bar line, with the band's label as the one Gallup attribution and the subject upright under the band.
add(id="ch-gallup", type="ticker", t0="bar:19", t1="bar:20", band={"cx": 540, "cy": 1080, "h": 240}, enabled=False,
    enter={"style": "slam", "dur": 0.2}, exit={"style": "slide", "dur": 0.2}, hit=6,
    text="Americans Cool Toward AI", hl="Cool", outlet="Gallup", date="Jul 28, 2026", size=84, verified=True,
    _note="Plan ch-b-06 (verify ok). r1: band raised from y 1230 to 1080 (safe zone); slams in with its text. r5: dropped (see above); "
          "the headline is in out/NOTES.md for the post caption.")
add(id="ch-gallup-39", type="ticker", t0="bar:19", t1="bar:20", band={"cx": 540, "cy": 690, "h": 340},
    # r7 (the Guardian band's note, same pattern: the band entered as a near-black band for 2 frames): invert 0, yellow from frame 1
    enter={"style": "slam", "dur": 0.2}, hit=7, invert=0, text="39%", size=250, style={"w": 760},
    outlet="Gallup", date="2026", verified=True,
    _note="Plan ch-b-07 with the verifier's correct_text 'GALLUP · 2026' (the 3,270 sample size was not confirmed and is dropped). "
          "Page (news.gallup.com/poll/712751, 'Americans Cool Toward AI', Jul 28, 2026): 'The percentage of Americans who believe AI "
          "does more harm than good has increased from 31% in 2025 to 39% in 2026'. r5 (social critic, high: the Gallup stack, a "
          "headline ticker plus a 39% card with a second attribution, ~19 words in 1.9 s): ONE block on the bar line. The figure "
          "rides the logo's yellow plane band at its 22 degrees (fully inside the band, so no edge crosses the type), the band's "
          "straight label carries the one attribution 'GALLUP · JUL 28, 2026' (the page's date; the year chip of the old card is "
          "gone), and the subject sits upright under the band (ch-gallup-sub). The headline 'Americans Cool Toward AI' goes to the "
          "post caption. 12 words in 1.9 s. r6 (social critic, high: density): the label is 'GALLUP · 2026' (Jul 28, 2026 in the "
          "post caption): 12 words in 1.9 s.")
# r7 (editorial: 39% with no baseline; right rail: 'good' ran to x 945): the page's comparison is on screen, "up from 31% in 2025"
# (news.gallup.com/poll/712751: 'The percentage of Americans who believe AI does more harm than good has increased from 31% in
# 2025 to 39% in 2026'; research/long/plan/ch-b.json allows 'up from 31% in 2025'), as an ink mono line under the subject. The
# subject is 62 px in a 780 px column (x 150-930, centred on the frame), so no word passes x 930.
add(id="ch-gallup-sub", type="pullquote", t0="bar:19", t1="bar:20", text="of Americans believe AI does more harm than good",
    source="up from 31% in 2025",
    upright=True, size=62, rule=False, style={"x": 150, "w": 780, "y": 1085, "align": "center", "lh": 1.08, "dimColor": "#2C2836"}, enter="slam", verified=True,
    _note="r4 (editorial critic: the subject was dropped): 'of Americans' is restored (unquoted, upright: the page's figure in short "
          "form, same meaning). r5: set under the band's lower edge (y ~1044 at x 90), so the band never crosses it.")

# ---------------------------------------------------------------- REFRAIN (full colour): bars 20-26, clear on bar 27
# r2 (both critics): the 96% card holds TWO bars from the refrain downbeat ('all I did was try my best / this the kind of
# thanks I get'), with its qualifier on screen the whole time; the BBC 'tried to hack' ticker that held bar 20 is dropped (it is
# the long cut's third Hugging Face item, and the same headline is in the intro cut's montage). o3 is cut to one excerpt and a
# big 'Stop.', and Musk is now AUDIBLE in the refrain's vocal gap (measured r2: 'upset' decays by song ~64.1, 'They' at 65.44).
# bar 20-21: "all I did was try my best" / "this the kind of thanks I get"
R96_K = dict(kicks=kicks(20), kickOrigin=[540, 900])
add(id="rf-96-field", type="shape", t0="bar:21", t1="bar:22", frame={"shape": "circle", "cx": 700, "cy": 570, "r": 320, "fill": BLUE},
    enter={"style": "pop", "dur": 0.22}, hit=5, kicks=kicks(20, skip=(0, 1)), kickOrigin=[540, 900],
    _note="r2: a half-bleed blue field pops in behind the red disc on bar 21 ('this the kind of thanks I get'), so the two-bar card "
          "still moves on the bar line. r3 (social critic: it started above the frame, under the platform header): cx 950, cy 570, "
          "r 320, so its top is y 250; it still sits behind the red disc, overlapping it by about 50 px. r5 (motion critic, medium: "
          "the ~50 px sliver read as a mistake): cx 820, so it commits to a ~180 px lens behind the red disc (top still y 250) and "
          "still bleeds off the right edge. r6 (motion critic, low: the field still read as tangent to the disc beside the '%'): the "
          "field sits BEHIND the red disc, so the 180 px overlap was hidden and only the touching edges showed. It moves in to cx 700 "
          "(a 300 px overlap): the bigger blue disc now shows as a crescent wrapping the red disc's top-right and right side, the "
          "layered look of the cover's pink behind its black circle; its top stays at y 250 and its bottom (y 890) clears the label. "
          "The '96%' is set at 196 px (was 220) so it sits inside the red disc with a margin instead of touching its edge.")
add(id="rf-96-ring", type="shape", t0="bar:20", t1="bar:22", frame={"shape": "circle", "cx": 420, "cy": 590, "r": 260, "fill": RED},
    enter="slam", hit=10, flash={"opacity": 0.5, "decay": 0.03}, **R96_K)
add(id="rf-96-big", type="pullquote", t0="bar:20", t1="bar:22", big="96%", bigSize=196, rule=False,
    style={"x": 170, "w": 500, "cy": 602, "align": "center", "bigColor": CREAM}, enter="cut", **R96_K)
add(id="rf-96", type="pullquote", t0="beat:80.5", t1="bar:22", label="In controlled simulations",
    # r7 (editorial): the clause ends with … because Anthropic's sentence goes on ('; with the same prompt, Gemini 2.5 Flash also
    # had a 96% blackmail rate…', research/long/plan/rf-a.verify.json)
    text="“Claude Opus 4 blackmailed the user 96% of the time…”", hl="blackmailed",
    size=70, style={"x": 60, "w": 900, "y": 920, "labSize": 44}, name="Anthropic", year="2025",
    enter="rise", textDelay=0.0, **R96_K, verified=True,
    _note="Plan rf-a-2 with the verifier's correct_text: the disclaimer is shown in full (three sentences). Only the Opus 4 row. "
          "r1: a filled red disc with the figure in cream. r2 (both critics: the caveat was unreadable in 1.5 s): the card holds two "
          "bars (3.9 s; the text from one beat in, 3.4 s), the disclaimer is set at 38 px, and a 42 px red label 'In controlled "
          "simulations' (the disclaimer's own words) sits above the quote for the whole card, so the qualifier reads with the claim. "
          "The quote itself is unchanged (an exact clause of the Anthropic sentence). Full disclaimer also in out/NOTES.md for the "
          "post caption. r3 (both critics: a 34-word mono paragraph is unreadable texture on a phone, 13 words/s): the on-screen "
          "honesty is the red label 'In controlled simulations' (the words of the disclaimer's first sentence) plus its third "
          "sentence, verbatim, as the one source line: 'No real people were involved or harmed in any of these experiments.' The "
          "second sentence (the experiments' names are fictional) names nothing shown on screen, so it moves to the post caption "
          "with the full three-sentence disclaimer (out/NOTES.md). The text rises half a beat after the 96% slam (beat 80.5), 3.6 s. "
          "r5 (social critic, high: 32 words in 3.6 s): the source line is the disclaimer's third sentence up to 'harmed' ('No real "
          "people were involved or harmed.'; 'in any of these experiments' is implied by the label 'In controlled simulations' and "
          "is in the caption), set at the 38 px meta size (>= 36 px), and the role line 'Agentic Misalignment · Jun 20, 2025' moves "
          "to the post caption. On screen: label 3 + quote 9 + '2025 · Anthropic' + source 7 = 21 words in 3.6 s. Beat kicks on "
          "beats 82, 84 (bar 21, with the blue field) and 86. r6 (social critic, high: density; motion critic, medium: the 38 px "
          "'NO REAL PEOPLE…' line was at risk on a phone): the source line goes to the post caption with the full disclaimer. The "
          "on-screen qualifier is the red label 'In controlled simulations' (the disclaimer's own words), now 44 px, over the quote "
          "at 70 px: label 3 + quote 9 + '2025 · Anthropic' = 14 words in 3.4 s.")

# bar 22: "unrelentlessly upset" -- the snippet's caption, then a big 'Stop.' on beat 3 of the bar
O3_OUT = "beat:93"   # the Musk card takes the frame on beat 93 (song 64.254), as the vocal gap opens
O3_STOP = "beat:90"
# r6 (motion critic, medium: 42.6-43.9 read as an unfinished frame, the card alone in the upper third over ~60 % empty cream;
# social critic, high: 17 words in 2.4 s): the card is centred (y 560-890, centre ~725, growing down to 1320 on 'Stop.', so the
# whole card is centred at ~940), a teal disc pops behind its top-right corner on the bar's second beat, and card, disc and text
# kick together on beats 89, 91 and 92 (Stop slams on 90). (r6 also cut the label to 'OpenAI o3, stuck in a loop' and the
# excerpt to '…parted illusions…'; r7 dropped the excerpt and final pass 3 dropped the label: see rf-o3 below for the card now.)
O3_K = dict(kicks=[{"at": "beat:89", "s": 1.025, "dur": 0.16}, {"at": "beat:91", "s": 1.02, "dur": 0.16}, {"at": "beat:92", "s": 1.02, "dur": 0.16}],
            kickOrigin=[540, 820])   # r7: the card moved 80 px down (see rf-o3-card)
add(id="rf-o3-disc", type="shape", t0="beat:89", t1=O3_OUT, frame={"shape": "circle", "cx": 930, "cy": 640, "r": 200, "fill": TEAL},
    enter={"style": "pop", "dur": 0.22}, hit=5, **O3_K,
    _note="r6: the bar's second-beat event (motion critic: 'a beat-locked teal disc behind the card'), behind the card's top-right corner.")
# r7 (editorial: the excerpt '…parted illusions overshadow marinade illusions […]' read as garble): it is dropped. Until 'Stop.'
# the card holds one line of text (final pass 3: the snippet's caption, rf-o3) and opens at that height (350 px); it grows on the
# 'Stop.' slam as before.
# The whole card (disc, card, text) sits 80 px lower than in r6 (y 640-990, growing to 1400), so the opening card is nearer the
# frame's middle and the grown card still ends above y 1440.
add(id="rf-o3-card", type="shape", t0="bar:22", t1=O3_OUT, frame={"shape": "rect", "x": 90, "y": 640, "w": 900, "h": 350, "ring": TEAL, "ringW": 14, "fill": "#EAF7F3"},
    enter="slam", hit=6, resize={"at": O3_STOP, "dur": 0.16, "frame": {"h": 760}}, **O3_K,
    _note="r3 (motion critic: the card's lower half was empty for a beat): it opens at content height (final pass 3: the snippet's "
          "caption and its name row) and grows down to full height on the 'Stop.' slam (beat 90), with a small overshoot.")
# Final pass 3 (editorial re-check): r7's red label "Its reasoning" over "Stuck in a loop" copied the snippet's own layout (its
# teal "Reasoning" tab sits over the model's text), so the editor's gloss read as o3's output; "Stuck in a loop" is in no source.
# The card now carries the snippet's verified caption, verbatim and unquoted (a source's caption, set like a headline), with the
# source's name row: "OpenAI o3 keeps repeating the same phrase before snapping out of it" / "2025 · Apollo Research × OpenAI".
# 'Stop.' (the model's own word, in mono) still slams on beat 90. 12 + 4 + 1 words in 2.4 s.
add(id="rf-o3", type="pullquote", t0="bar:22", t1=O3_OUT,
    text="OpenAI o3 keeps repeating the same phrase before snapping out of it", hl="keeps repeating the same phrase",
    upright=True, size=66, name="Apollo Research × OpenAI", year="2025", rule=False,
    style={"x": 135, "w": 810, "y": 676, "lh": 1.04, "color": INK},
    enter="cut", **O3_K, verified=True,
    _note="Plan rf-a-3 (research/long/plan/rf-a.json text_exact; rf-a.verify.json idx 2 ok): the snippet's caption, verbatim, "
          "'OpenAI o3 keeps repeating the same phrase before snapping out of it' (slides/frontier/o3_loop1.png, "
          "antischeming.ai/snippets, Apollo Research × OpenAI, Sep 17, 2025). It is the publisher's caption, not model output: "
          "upright, unquoted, with the publisher as the name row. The model's own text on the card is only 'Stop.' and '[…]' "
          "(rf-o3-stop, mono). The red highlight marks the loop (exact substring). History: r1-r6 showed a verbatim excerpt of the "
          "repeated reasoning phrase under a mono label; r7 dropped the excerpt (it read as garble) for a red label 'Its "
          "reasoning' over 'Stuck in a loop', which final pass 3 removed (the gloss read as o3's reasoning and is in no source).")
add(id="rf-o3-stop", type="pullquote", t0=O3_STOP, t1=O3_OUT, big="Stop.", bigSize=210, text="[…]", size=44, rule=False,
    style={"x": 135, "w": 810, "y": 1010, "mono": True, "bigMono": True},
    enter="slam", hit=8, **O3_K, verified=True,
    _note="The snippet's 'Stop. [...]' (the model snapping out of the loop), set big in mono (model output) on beat 90. r5 (refrain "
          "word load, social critic): the role's date (Sep 17, 2025) moves to the post caption; the chip keeps 2025. r6: the role "
          "line 'Apollo Research × OpenAI' moves to the post caption. Final pass 3: it is back on screen as rf-o3's name row "
          "(the publisher of the caption shown above 'Stop.').")

# bar 23: the vocal gap before 'golden years' -- Musk, AUDIBLE (r2): 'we are summoning the demon.' fits the gap
add(id="rf-musk", type="clip", t0=O3_OUT, t1="bar:24", src="clips/musk-mit-2014-demon.mp4", **{"in": 58.354},
    crop={"x": 230, "y": 10, "w": 540, "h": 540}, frame={"shape": "circle", "cx": 540, "cy": 640, "r": 280, "ring": RED, "ringW": 18},
    grade=FULL_CLIP, zoom=[1.0, 1.05], focus=[0.5, 0.4], enter="slam", hit=6, audio={"in": 58.46, "out": 59.44}, verified=True,
    _note="AUDIBLE in the refrain's vocal gap (r2). REPLACEMENT for rf-a-4 (Bostrom 'Humanville'). research/long/musk-mit-2014.json "
          "line 1: 'With artificial intelligence, we are summoning the demon.' (57.32-59.38; MIT AeroAstro Centennial Symposium, "
          "24 Oct 2014). The gap only holds the second half: audio 58.36-59.44 plays at song 64.26-65.34 (edit 45.028-46.108). "
          "Gap measured r2 on song/brutal.wav (mid-side energy, 300-3500 Hz): 'upset' decays to the band's level by ~64.1, the "
          "pickup 'They' starts at 65.44, so speech ends 0.10 s before it (the 120 ms duck ramp ends on it). small.en on the exact "
          "window (58.36 + 1.08 s) hears only 'we are summoning the demon.' (also from 58.30 and 58.46). The picture starts at src "
          "58.354 so his mouth matches the sound; it runs to 59.81, before 'You know' (60.92). FINAL PASS: audio in 58.36 -> 58.46. "
          "small.en on the final mix (window padded with digital silence) heard 'As we are summoning the demon': 58.30-58.40 keep the "
          "sibilant tail of 'intelligence' (HF energy 58.31-58.44). 58.46 sits in the quiet gap before 'we' (58.45-58.50) and hears "
          "exactly 'We are summoning the demon.' Speech now plays at edit 45.128-46.108 (song 64.36-65.34).")
add(id="rf-musk-q", type="pullquote", t0=O3_OUT, t1="bar:24", label="On AI", text="“…we are summoning the demon.”",
    hl="summoning the demon", size=76, style={"x": 60, "w": 900, "y": 1000}, name="Elon Musk", year="2014",
    enter="rise", textDelay=0.06, verified=True,
    _note="What is heard, exactly ('With artificial intelligence,' is cut, marked …); the label says what the demon is. r5 (social "
          "critic, high: 13 words in 1.5 s): the role line 'MIT AeroAstro Symposium' moves to the post caption (MIT AeroAstro "
          "Centennial Symposium, Oct 24, 2014).")

# bar 24: "they say these are the golden years"
# r6 (social critic, high: bar 24 carried the Stargate stamp, its image credit and the Guardian ticker with its attribution, ~20
# words in 1.9 s, the densest bar of the cut; motion critic, medium: the ticker's dimmed body read as tan mud): in the LONG cut
# the bar is the Guardian headline alone, on a centred band at 72 px with its body at 0.85 (ink on yellow), 'GALLUP'-style short
# label 'THE GUARDIAN · 2026', and an orange disc (the logo's core colour) rising behind the band as the bar's second-beat event.
# rf-stargate and rf-guardian stay in long.json UNCHANGED because make_short.py imports both (the short's splice bar); they carry
# "skipIn": ["long"], so the long cut skips them and the short's copies still draw (engine field, r6).
add(id="rf-stargate", type="image", skipIn=["long"], t0="bar:24", t1="bar:25", src=A + "research/economy/epoch_sat_stargate_abilene_2026-07.png",
    crop={"x": 280, "y": 0, "w": 720, "h": 720}, frame={"shape": "circle", "cx": 540, "cy": 630, "r": 200, "ring": RED, "ringW": 18},
    grade={"sat": 1.0}, zoom=[1.0, 1.06], enter="slam", hit=8,
    stamp={"year": "2026", "name": "OpenAI Stargate Abilene", "role": "Image: Epoch AI"}, verified=True,
    _note="Plan rf-b-0 with the verifier's correct_text 'IMAGERY: EPOCH AI · JUL 2026' (the Airbus credit is unconfirmed and dropped). "
          "r1: the circle is smaller and higher (cy 600, r 250) so it clears the raised Guardian band and its attribution line. "
          "r2: stamp at y 300 with the verifier's exact credit line as the role (chip '2026'), so the 40 px name fits one line; the "
          "circle sits between the stamp and the Guardian label (cy 630, r 200), the band moves to y 1185. r5 (social critic, high: "
          "the Guardian ticker plus this stamp, ~23 words in 1.9 s): the credit is cut to 'Image: Epoch AI' (the image stays credited "
          "on screen); the full 'Imagery: Epoch AI · Jul 2026' is in the post caption.")
add(id="rf-guardian", type="ticker", t0="bar:24", t1="bar:25", band={"cx": 540, "cy": 1185, "h": 260}, skipIn=["long"],
    enter={"style": "slam", "dur": 0.2}, exit={"style": "slide", "dur": 0.2},
    text="Nvidia’s quarterly revenue doubles … as CEO declares ‘golden age’", hl="‘golden age’", outlet="The Guardian", date="Aug 26, 2026",
    size=68, style={"w": 940}, dimRest=0.42, invert=0.06, verified=True,
    _note="Plan rf-b-1 (verify ok). Full: 'Nvidia’s quarterly revenue doubles to nearly $100bn as CEO declares ‘golden age’'. "
          "5 words: one bar. r1: band raised from y 1290 to 1100 (safe zone) and slams in with its text. r3 (social critic: whose "
          "CEO?): 'Nvidia’s quarterly revenue doubles … as CEO declares ‘golden age’' (9 words; only 'to nearly $100bn' is cut, "
          "marked …), set at 68 px across the band's 940 px. r5 (social critic, high): the verbatim headline stays whole, the words "
          "outside 'golden age' at 0.42 (as in the short's r5), so it reads as its highlight; the landing flash is 2 frames. "
          "r6: skipped in the long cut (skipIn), kept for make_short.py (the short overrides dimRest to 0.75); the long's bar 24 "
          "is rf-guardian-l.")
add(id="rf-gold-disc", type="shape", t0="beat:97", t1="bar:25", frame={"shape": "circle", "cx": 720, "cy": 690, "r": 230, "fill": "#FF4A1C"},
    enter={"style": "pop", "dur": 0.26}, hit=5, kicks=[{"at": "beat:98", "s": 1.04, "dur": 0.16}], kickOrigin=[720, 690],
    _note="r6: the bar's second-beat event, an orange disc (the logo's core colour) behind the band's top edge, like a sun on the "
          "'golden age' horizon; it cuts out with the band under Apollo's slam on bar 25.")
add(id="rf-guardian-l", type="ticker", t0="bar:24", t1="bar:25", band={"cx": 540, "cy": 1080, "h": 300},
    enter={"style": "slam", "dur": 0.2}, hit=8,
    text="Nvidia’s quarterly revenue doubles … as CEO declares ‘golden age’", hl="‘golden age’", outlet="The Guardian", date="2026",
    size=72, style={"w": 940}, dimRest=0.85, invert=0, verified=True,
    _note="FINAL PASS (motion critic, medium: the band entered as a near-black band for 2 frames, 46.50-46.53, the label grey "
          "on it, a flicker before the yellow): invert 0, so the band is yellow from its first frame and only the text slams "
          "(1.06 -> 1 over 0.14 s, with the band's 1.18 -> 1 slam and an 8 px hit). The long cut's bar 24 (r6). Plan rf-b-1 (verify ok): 'Nvidia’s quarterly revenue doubles to nearly $100bn as CEO declares "
          "‘golden age’' (The Guardian, Aug 26, 2026); only 'to nearly $100bn' is cut, marked …. Motion critic (medium): the body is "
          "ink at 0.85 on the yellow (was 0.42, 'tan mud'), the red 'golden age' unchanged. Social critic (high): one block, 9 + "
          "'THE GUARDIAN · 2026' = 12 words in 1.9 s (the date is in the post caption). The band takes the Stargate image's place in "
          "the middle of the frame (cy 1080, 300 px thick). It CUTS on bar 25 under Apollo's slam: a slide-out (seen on the r6 "
          "strip) left frame 1452 (48.400, 12 ms before bar 25) as empty cream, because Apollo's card is shared with the short and "
          "keeps its bar-line start.")

# bar 25: "but I wish I could disappear"
add(id="rf-apollo-card", type="shape", t0="bar:25", t1="bar:26", frame={"shape": "square", "x": 90, "y": 420, "w": 900, "h": 780, "fill": BLUE},
    enter="slam", hit=7)
add(id="rf-apollo", type="pullquote", t0="bar:25", t1="bar:26", text="“…I could copy myself to the new server…”", hl="copy myself", size=78,
    style={"x": 170, "w": 740, "cy": 810, "color": CREAM, "hlColor": YEL, "dimColor": "#D8D4F5"}, name="Claude 3 Opus", year="2024",
    # r7 (seen on the r7 sheet: frame 1453 showed the slammed blue card empty while the text rose in): the text slams in with the card
    source="Test · hidden reasoning", enter="slam", textDelay=0.0, verified=True,
    _note="Plan rf-b-2 (verify ok). The figure reads '<thinking> [...] I could copy myself to the new server, overwriting...': "
          "both ellipses mark the cuts. r1: a filled blue tile, cream type, the highlight in the plane's yellow. r5 (social critic, "
          "high: ~21 words in 1.9 s): the source line is 'Self-exfiltration test · hidden reasoning' (the date, Dec 5, 2024, goes "
          "to the post caption). 'Hidden reasoning' stays, against the critic's 'Self-exfiltration test' alone: the words are the "
          "model's <thinking> in a test, not something it said to anyone. r6 (social critic, high: 17 words in 1.9 s): the role "
          "'Apollo Research' goes to the post caption and the source line is 'Test · hidden reasoning' (both facts stay on screen): "
          "quote 7 + '2024 · Claude 3 Opus' + 3 = 13 words. (make_short.py overrides this item's name, year, role and source.)")

# bar 26: "ego crush is so severe" -- then everything clears on "God," (bar 27) as the band drops out (song ~71.9)
add(id="rf-lee-card", type="shape", t0="bar:26", t1=52.667, frame={"shape": "square", "x": 90, "y": 420, "w": 900, "h": 820, "ring": PINK, "ringW": 18, "fill": "#FBF7EE"},
    enter="slam", hit=7, exit={"style": "collapse", "dur": 0.36})
# r7 (editorial: the cut drops the concessive 'Even if I become the number one,'): the leading … stays and the card says what he was
# talking about: label "On AI, retiring from Go" with the 2019 chip (he said it explaining his retirement, Nov 2019; TNW: 'World
# champion Go player retires: AI "cannot be defeated"'); the role is "Go player" (no repeat of 'retiring'). The full sentence is
# in the post caption. Label 5 + quote 8 + '2019 · Lee Sedol · Go player' 5 = 18 words in 2.3 s (the full sentence would be 25).
add(id="rf-lee", type="pullquote", t0="bar:26", t1=52.667, label="On AI, retiring from Go", text="“…there is an entity that cannot be defeated.”", hl="cannot be defeated",
    size=76, style={"x": 170, "w": 740, "cy": 830}, name="Lee Sedol", year="2019", role="Go player",
    enter="slam", textDelay=0.0, exit={"style": "collapse", "dur": 0.36}, verified=True,   # r7: slams with its card (frame 1511 was empty)
    _note="Plan rf-b-4 with the verifier's correct_text source line. Full: 'Even if I become the number one, there is an entity that "
          "cannot be defeated.' (TNW wording). The photo planned beside it (rf-b-3) is dropped: its DeepMind credit and date were "
          "not confirmed. Collapses from 'God,' (bar 27) to the band's stop at song ~71.90. r1: the text shrinks and spins with "
          "its card (same curve, same centre), so no empty frame rotates on its own. r5 (social critic, high: ~23 words in 2.3 s): "
          "source line 'Yonhap · 2019' ('As reported by Yonhap, Nov 27, 2019' in the post caption). r6 (social critic, high: 17 "
          "words in 2.3 s): the source line goes to the post caption (Lee Sedol speaking to Yonhap, Nov 27, 2019): 14 words. "
          "(make_short.py sets its own name, year, role and source.)")

# ---------------------------------------------------------------- CLEAR, then the instrumental: the pieces reassemble and hold
# a cappella 'God, it's brutal out here' (song 71.94-73.64): vocal onsets measured on the song's RMS (song/brutal.wav):
# God ~71.99, it's 72.34, bru- 72.50, -tal 72.66, out 72.83, here 73.12 (song) -> edit = song - 19.232
add(id="rf-god-seed", type="shape", t0=52.52, t1=52.758, frame={"shape": "circle", "cx": 540, "cy": 820, "r": 380, "fill": INK},
    zoom=[0.04, 0.42],
    _note="r3 (social critic: ~0.25 s of blank cream between Lee's collapse and the disc): as Lee's card shrinks to a point, an ink "
          "seed appears at its centre and grows (r 15 -> 160 px); on 'God,' the full disc slams over it (rf-god-disc).")
add(id="rf-god-disc", type="shape", t0=52.758, t1="beat:112.75", frame={"shape": "circle", "cx": 540, "cy": 820, "r": 380, "fill": INK},
    enter={"style": "slam", "dur": 0.12}, exit={"style": "morph", "to": "logo-re:black", "dur": 0.36}, zoom=[1.0, 1.07], hit=12,
    # FINAL PASS (motion critic, low: a near-static ink disc for ~1.5 s): a 2 % pulse (0.12 s) on each data point's pop, i.e. on
    # each sung word (logo-re dotsAt), the first on the slam itself skipped. make_short.py sets its own kicks and shakes.
    kicks=[{"at": t, "s": 1.02, "dur": 0.12} for t in [53.108, 53.268, 53.428, 53.598, 53.888]], kickOrigin=[540, 820],
    _note="r2 (both critics: the 'God, it's brutal out here' hold read as an empty frame): one large ink disc slams in on 'God,' "
          "(song 71.99) and holds, slowly growing, through the a cappella line; the data points pop on it, one per word. On the "
          "instrumental's downbeat (song 73.42) it shrinks into the logo's black circle (exit morph, landing as the reassembly's "
          "black piece cuts in at beat 0.75) while the plane slams back over it.")
add(id="logo-re", type="logo", mode="assemble", t0=52.667, t1=61.2, grid="beat", beat0=112, layout={"y": 400, "scale": 0.72},
    dotsAt=[52.76, 53.108, 53.268, 53.428, 53.598, 53.888], dotScale=7.0, bg="rgba(0,0,0,0)", cutIn=["black"],
    flashes=[{"beat": 3, "opacity": 0.2, "decay": 0.05}],
    _note="While 'God, it's brutal out here' is sung a cappella (the band stops at song ~71.90) the six data points pop in one per "
          "word, large (4.2x), the first on 'God,'. Then on the instrumental's downbeat (song 73.42) the plane slams back and sorts "
          "them, the pieces fly in on 8ths, the wordmark lands on beat 3, the crossbar tilts, the kicker lands on bar 2 (song "
          "75.36) and the cover holds to the end. r1: layout y 400 (was 465), the same place the logo formed on the riff, so the "
          "kicker (about y 1361-1385) clears the bottom app overlay; the art top (about y 481) clears the Bostrom caption. r2: the "
          "points pop at 7x (100-180 px) on the held ink disc (rf-god-disc), the logo's own cream is transparent (ground-cream is "
          "under it) so the disc can sit below the points, and the black circle cuts in where the disc lands (cutIn). r3 (motion "
          "critic: the disc read as a half-opacity grey circle at 54.2): that was the default 0.5 white flash on the instrumental "
          "downbeat washing over the ink disc. The downbeat flash is gone (the plane's slam keeps its 24 px hit); only the "
          "wordmark's 0.2 flash on beat 3 remains, so the disc stays flat ink until it lands as the black circle.")
B_AT = 55.10   # r2 (motion critic): was 56.30; song 74.33, after the a cappella line ends (~73.35-73.64) and the band is back
add(id="end-voice", type="voice", t0=B_AT, t1=B_AT + 3.87, src="clips/bostrom-ted-2015-full.mp4", at=B_AT, audio={"in": 466.03, "out": 469.90},
    verified=True,
    _note="AUDIBLE (closing instrumental, no vocals): 'Machine intelligence is the last invention that humanity will ever need to "
          "make.' research/long/bostrom-ted-2015.json rank 1 (466.06-469.70; small.en x3); edges re-checked 10 Oct: silence before "
          "466.07 and after 469.75 (next word at 470.40). Song is ducked under it. r2: starts at edit 55.10 (song 74.33), ends 58.97 "
          "(song 78.20); the caption is gone by 59.35, so the finished cover holds clean for 1.85 s (to 61.2).")
W0 = B_AT - 466.03
END_Y, END_SIZE = 268, 40   # FINAL PASS: the closing caption (see end-cap); y 268 is below the app header (250)
words = [("MACHINE", 466.12), ("INTELLIGENCE", 466.32), ("IS", 466.70), ("THE", 467.06), ("LAST", 467.20), ("INVENTION", 467.48), ("THAT", 468.00),
         ("HUMANITY", 468.36), ("WILL", 468.84), ("EVER", 469.10), ("NEED", 469.22), ("TO", 469.38), ("MAKE.", 469.48)]
add(id="end-cap", type="caption", t0=B_AT, t1=59.35, exit={"style": "fade", "dur": 0.3}, theme="light",
    text="Machine intelligence is the last invention that humanity will ever need to make.", hl="the last invention",
    words=[{"w": w, "at": round(s + W0, 3)} for w, s in words], y=END_Y, w=CAP_W, size=END_SIZE, lh=1.18, hlKeep=True,
    srcInline=True, srcGap=12, source="Nick Bostrom · TED2015", verified=True,
    _note="r2: y 290 (was 250, inside the app header zone), 960 px wide so it sets on two lines above the art. FINAL PASS (motion "
          "critic, medium: 36 px, under the 38 px floor for read-once lines, and the only text on the cover moment for 4.25 s): "
          "40 px. In IBM Plex Mono a 40 px character advances 24 px, so 960 px holds 40 characters and the 81-character line "
          "cannot set in two lines at 40 px (the critic's 'keep two lines' is not possible without leaving the 60 px margins); "
          "it sets in three, with 'THE LAST INVENTION' kept on one line (hlKeep) and the source line moved onto the red rule's "
          "line (srcInline, as in the short), so the block still ends above the art (black circle top, y ~481): see out/NOTES.md "
          "for the measured rows.")

edl = {
    "name": "long",
    "title": "Hyperplane x brutal: long version, the drop cut (9:16)",
    "fps": 30, "width": 1080, "height": 1920, "duration": 61.2,
    "audio": {"song": "song/brutal.mp3", "songStart": D,
              "note": "edit time = song time - 19.232 (the drop downbeat is frame 0). Ends at song 80.432 (verse 2's first vocal is "
                      "at 80.68). Clip speech only in vocal-free stretches (r2): the drop riff (open-voice, Altman), the refrain's "
                      "vocal gap (rf-musk) and the closing instrumental (end-voice, Bostrom)."},
    "song": {"file": "song/brutal.mp3", "segments": [{"in_s": D, "out_s": 80.432, "at": 0}], "fade_in_s": 0.025, "fade_out_s": 0.35,
             "max_out_s": 80.45, "bars": "song/bars.json",
             "clean": {"dips": [[44.86, 45.25]], "ramp_ms": 12, "mode": "full", "note": "the explicit word ('fucking'), measured 44.86-45.25 (its /f/ starts at 44.86, the 't' of 'teenage' at 45.28); bars.json says 44.88-45.22"}},
    # FINAL PASS: the song mixes reach -12.0 LUFS with 4.85 dB of peak limiting (measured), so the cap is 5 dB (was 4: -12.8 LUFS),
    # matching the short (-12.0). The speech-only mix would need 8 dB to get there, so it keeps its 5 dB cap (-13.4 LUFS).
    "mix": {"limiter_max_gr_db": 5.0, "speech_limiter_max_gr_db": 5.0},
    "outputs": {"song": "out/hyperplane-brutal-long-9x16.mp4", "clean": "out/hyperplane-brutal-long-clean-9x16.mp4",
                "no_song": "out/hyperplane-brutal-long-no-song-9x16.mp4"},
    "look": {"ground": "#0E0D12", "red": RED, "dim": "#9A96A8"},
    "themes": [{"t0": "bar:12", "t1": 1e9, "theme": "light"}],
    "grids": {"riff": riff, "beat": beat, "bar": bar},
    "_grids_note": "beat = the measured riff onsets for beats 0-15 (as in short.json, minus 13.132), then song/bars.json beats "
                   "snapped to the strongest onset within 70 ms (else bars.json - 25 ms, the median offset of the matched ones), minus "
                   "19.232. bar:k = beat:4k (bar 4 = verse 1 at song 26.957, bar 12 = chorus 42.483, bar 20 = refrain 57.955, bar 27 = "
                   "'God, it's brutal out here' 71.539, bar 28 = the instrumental 73.42).",
    "items": items,
}
OUT.write_text(json.dumps(edl, indent=1, ensure_ascii=False) + "\n")
print("wrote", OUT, len(items), "items")
