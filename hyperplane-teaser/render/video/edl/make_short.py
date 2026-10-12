"""Generate render/video/edl/short.json: the SHORT cut = the spliced intro cut (BUILD.md "MUSIC splicing").
    python3 render/video/edl/make_short.py   # then: prep_clips.py short, render.py video short, mix.py short --video ...

Song timeline (song seconds; edit = song - 6.10 before the splice, song - 44.811 after it):
  6.10 -> 26.477   intro montage + breath + drop riff with the logo forming
  SPLICE           riff beat 15 (bar 3, beat 4) -> refrain bar 23, beat 4: 20 bars later (delta 38.711 s), same bar phase
  65.188 -> 80.411 'golden years / disappear / ego crush / God, it's brutal out here' + the instrumental with the reassembly
Post-splice items are long.json's refrain-b and instrumental items, re-timed: short edit = long edit - 25.579.
Splice measurements (onsets, centre-channel vocal energy, chroma): out/NOTES.md.

r4 (critiques-r3, short cut): the montage is rebuilt (it no longer copies short-v1's items; short-v1.json keeps only the grids,
look and the drop formation). Cold open on Sam Altman's 2015 footage with his own voice ("…the end of the world…"); Feynman is
dropped (the weakest item: a 1985 line cut before its caveat, a soft grey hook); Amodei's stage wall (AXIOS logos) is keyed out (rev2: key removed);
two Hugging Face headlines (TIME, BBC) held >= 1.6 s; Coxon dated (The Daily Show, Oct 5, 2026). New montage layout: stamps at
y 300 (below the app header), a 1080x640 clip box at y 400 and captions that end above y 1440 (the bottom app-UI band).
From the drop on: beat-locked piece hits through the hold, the logo breaks apart ON the splice (with a flash), the Guardian
label hugs its band, no blank frames before the 'God,' disc, and a larger closing caption.

r5 (the newest motion + social critiques, short cut): 640 px crops for Altman and Amodei (1.69x, was 2.2x / 2.7x; the key turns the
other panelists into ground), a brighter hook (grade lift, unspoken words at 0.6, a 3.5 % punch-in + hit on "THE END"), every cut from
edit 7.7 on the measured pulse (TIME 8.300, BBC 8.767, Coxon 10.700), both Hugging Face headlines kept whole but dimmed outside their
highlights, Coxon trimmed to "…There won't be jobs…" with a 0.20 s J-cut (was 0.52 s) and a freeze after "jobs"; after the drop the
plane band stays on as the ground under the Apollo and Lee cards with a logo circle behind each, both cards get the y-300 stamp
row, the Guardian ticker is dimmed outside 'golden age' with a 2-frame ink flash, Lee's collapse is 0.22 s with the 'God,' seed
under it, the reassembly's wordmark slams from 1.1x, and the closing caption sets in two lines (37 px at y 290).

r6 (the newest motion + social critiques, short cut; out/NOTES.md "Short cut, round 6"): the Hugging Face headlines are no longer
stacked: TIME alone 8.300-10.233 (pre:10 -> pre:6, 1.93 s) and then BBC alone 10.233-11.922 (1.69 s), each at full contrast
(rest at 0.62, red chip wiping on a beat after it lands). To make that room Coxon is dropped from the short (the montage's
weakest, most fragile item: 1.2 s, half of it a freeze, a J-cut under the headline and Olivia's line 0.2 s after it; he stays in
the long cut), so no clip speech plays after edit 8.43. The hook starts on '…I think' (picture 1.84, audio 1.86; 'You know,' is
cut, marked …), snaps in on frame 0 (1.08x -> 1 in 0.25 s), pushes from frame 0 (zoomEase "out") and punches 8 % with an 11 px hit
on 'THE END' (3.88), which then holds 0.85 s. Amodei punches 6 % on '25%' (5.10). Year chips are years only. After the drop: a
harder downbeat hit, the Guardian rest at 0.75, the logo circles placed so a clear part of each shows (no stray pink dot), the
'God,' disc kicks and shakes on each data point, and the quote cards drop the dates their year chips repeat."""
import copy, json, pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
V1, LONG, OUT = HERE / 'short-v1.json', HERE / 'long.json', HERE / 'short.json'
v1 = json.loads(V1.read_text())
lg = json.loads(LONG.read_text())
lbeat = json.loads((HERE / 'long-beats.json').read_text())   # long edit seconds (song - 19.232)

SONG0 = 6.10                 # song second at edit 0
RIFF_OUT = 26.477            # 15 ms before riff beat 15's attack (HF transient 26.493, onset peak 26.507)
DELTA = 38.711               # 20 bars: onset-envelope x-corr of bar 3 vs bar 23 peaks at 38.711 (beat pairs 38.709-38.715)
REF_IN = round(RIFF_OUT + DELTA, 3)            # 65.188: 20 ms before refrain beat 95's attack (65.208 / onset 65.217)
SPLICE = round(RIFF_OUT - SONG0, 3)            # edit 20.377
SPLICE_HIT = round(65.208 - (SONG0 + DELTA), 3)  # edit 20.397: the attack right after the cut (refrain bar 23 beat 4)
POST = round(SONG0 + DELTA, 3)                 # after the splice: edit = song - 44.811
LSHIFT = round(POST - 19.232, 3)               # long edit -> short edit: - 25.579
FPS = 30
N_FRAMES = 1068
DUR = round(N_FRAMES / FPS, 4)                 # 35.6
SONG_OUT = round(DUR + POST, 3)                # 80.411 (verse 2's first vocal is at 80.68)
CREAM = '#F2EBDD'
f = lambda k: round(k / FPS, 4)                # frame k's start time (cuts sit on frame boundaries)

# grids: the short's riff (measured onsets, beats 0-15), then the refrain/instrumental beats of long-beats.json from song bar 24
riff = v1['grids']['riff']
beat = riff + [round(x - LSHIFT, 3) for x in lbeat[96:]]
bar = beat[0::4]
BAR_OFF, BEAT_OFF = 20, 80   # long bar 24 = short bar 4; long beat 96 = short beat 16
PRE = v1['grids']['pre']     # pre:k = k beats before the drop on the riff grid extrapolated back (0.4839 s)
pre = lambda k: round(PRE['origin'] + k * PRE['period'], 4)


def ref(v):
    """A long.json time (number or grid ref) -> the same moment on the short's timeline."""
    if isinstance(v, (int, float)):
        return round(v - LSHIFT, 3)
    m = re.match(r'^(bar|beat):(-?[\d.]+)([+-][\d.]+)?$', v)
    if not m:
        raise SystemExit(f'cannot re-time {v!r}')
    k = float(m.group(2)) - (BAR_OFF if m.group(1) == 'bar' else BEAT_OFF)
    if k < (4 if m.group(1) == 'bar' else 16):
        raise SystemExit(f'{v!r} is before the splice')
    k = int(k) if k == int(k) else k
    return f'{m.group(1)}:{k}{m.group(3) or ""}'


def from_long(i, **over):
    it = copy.deepcopy(next(x for x in lg['items'] if x['id'] == i))
    for key in ('t0', 't1', 'at', 'dotsAt'):
        if key in it:
            it[key] = [ref(x) for x in it[key]] if isinstance(it[key], list) else ref(it[key])
    for w in it.get('words', []):
        if 'at' in w:
            w['at'] = ref(w['at'])
    if it.get('type') == 'logo' and it.get('grid') == 'beat':
        it['beat0'] = it['beat0'] - BEAT_OFF
    it.update(over)
    it['_note'] = (it.get('_note', '') + ' [short: re-timed from long.json, short edit = long edit - %.3f]' % LSHIFT).strip()
    return it


items = []
# ---------------------------------------------------------------- 1. intro montage (r4) + breath
# Layout (r4, both montage critics): stamps at y 300 like every other stamp in the cut (the top 250 px are the app header), a
# 1080x640 clip box at y 400, captions in 56 px from y 1110, so even a four-line caption and its source line end above y 1440
# (TikTok/Reels caption and username band). Secondary lines 32 px, stamp names 36 px (critic: >= 30 px at phone width).
# Captions show the whole quote dim from the first frame (reveal "dim") and light each word as it is spoken.
MON = {"meta": 32, "name_px": 36}
STAMP = {"y": 300, "yrPx": 52}
# r5 (motion critic: the hook's not-yet-spoken words read as near-black on frame 0): unspoken words at 0.45 instead of 0.22
# r6 (motion critic, low: 0.45 reads grey on Amodei): 0.6 on every montage caption, as on the hook
CAP = {"reveal": "dim", "dimOp": 0.6}
GRADE = {"sat": 0, "contrast": 1.25, "brightness": -0.04, "gamma": 0.93, "sharpen": 0.5, "grain": 4}
# Cuts: Altman -> Amodei on the speech edge (4.733; the intro has no measurable pulse before edit ~7.7). From 7.7 a ~0.5 s pulse is
# measurable (2-8 kHz onsets at edit 7.75, 8.24, 8.76, 9.26) and pre:k matches it within 60 ms. r5 (motion critic: TIME at 8.50 and
# Coxon at 10.60 sat 0.1-0.3 s off the pulse): every cut from 7.7 on is now on a pulse, to the nearest frame. TIME on pre:10 (8.293,
# frame 249 = 8.300; Amodei's last word "badly" runs on under it to 8.433, a 0.13 s L-cut), BBC on pre:9 (8.777, frame 263 = 8.767),
# Coxon on pre:5 (10.713, frame 321 = 10.700), the breath on pre:2.5.
# r6 (both critics, high: the stacked TIME + BBC pair was ~22 words in 2.4 s, and each had full contrast for only its 2-frame
# landing flash): one headline at a time. TIME on pre:10 (8.293, frame 249 = 8.300), BBC on pre:6 (10.229, frame 307 = 10.233),
# each alone at full contrast until the next cut: TIME 1.93 s, BBC 1.69 s (breath at 11.922). Coxon is dropped to make the room.
T_AMO, T_HF, T_BBC = f(142), f(249), f(307)                   # 4.7333, 8.3, 10.2333
# rev2 (William: "keep the original footage"): no background key on any clip. The r4 key (render/video/keying.py, kept as an
# unused tool) replaced the Altman and Amodei stage walls with a dark ground; both shots now show the real scene, other people
# and event branding included. Cropping/framing is unchanged.
T_BREATH = pre(2.5)                                            # 11.9225: the breath line, on the 8th before pre:2

items.append({"id": "grain", "type": "grain", "t0": 0, "t1": "riff:0", "opacity": 0.035, "size": 2, "hold": 3})
items.append({"id": "vignette", "type": "vignette", "t0": 0, "t1": T_BREATH})

# Altman, 2015 (cold open, heard). clips/altman-2015-short.mp4 (YouTube g70KUszkNvQ, the 18 s upload of the Airbnb OpenAir fireside
# chat; research/verify/SUMMARY.md). Speech starts at 1.68 after true silence (-60 dB to 1.64); "world," ends at 6.30 and "but"
# starts at 6.38 (-43 dB between).
# r6 (social critic, high: the punchline 'THE END OF THE WORLD' held only 0.63 s before the cut): 'You know,' is cut (the leading
# … marks it) so the line lands 0.24 s earlier and holds. Energy and voicing (10 ms, scratchpad r6): 'you know' 1.67-1.88, then a
# reduced 'I' + the 'th' of 'think' (1.89-1.98, -42 dB), 'ink' 1.99-2.08, 'AI' from 2.20. The audio starts at 1.86, where
# small.en and base.en both hear "I think AI will probably like most likely sort of lead to the end of the world" in 3/3 decodes
# each (from 1.88-1.92 small.en drops the 'I' in 1 of 3; from 2.08 it hears "AI will…"). The critic's 1.92 is inside the soft
# 'I', so it is not used. Picture in 1.84 (one frame of lead).
AL_IN, AL_AUDIO_IN = 1.84, 1.86
AL_HIT = round(5.72 - AL_IN, 3)                                 # 'THE END': 3.88
# r5: a 640 px crop (1.69x), x 280-920 (the source's right edge), y 6-385, still above the burned-in captions (y >= 556). Mike
# Curtis (x < 335) and the chairs are outside the key region, so they become ground. Grade lifted (brightness 0, gamma 0.97).
# r6 (motion critic: no visible hit, a static talking head; social critic: nothing snaps on frame 0): a snap-in on frame 0 (1.08x
# settling to the push in 0.25 s), the push runs from frame 0 (zoomEase "out": 1.00 -> 1.05, half of it in the first 1.2 s), and
# the punch on 'THE END' is 8 % over 0.12 s with an 11 px hit (decay 0.1); it stays, so the punchline holds tighter.
items.append({"id": "altman", "type": "clip", "t0": 0, "t1": T_AMO, "src": "clips/altman-2015-short.mp4", "in": AL_IN,
              "crop": {"x": 280, "y": 6, "w": 640}, "grade": dict(GRADE, brightness=0.0, gamma=0.97), "zoom": [1.0, 1.05],
              "zoomEase": "out", "snap": {"z": 1.08, "dur": 0.25},
              "focus": [0.72, 0.3], "punch": [{"at": AL_HIT, "z": 1.08, "dur": 0.12}],
              "shakes": [{"at": AL_HIT, "amp": 11, "decay": 0.1}],
              # r7 (editorial): the source line is the event and year, "Airbnb fireside chat · 2015" (Business Insider's Jun 4, 2015
              # report is secondary and stays off screen); the caption has no full stop: it ends "…THE END OF THE WORLD…" (he goes on
              # "but in the meantime, there will be great companies…")
              "stamp": dict(STAMP, year="2015", name="Sam Altman", role="Then president, Y Combinator"),
              "caption": dict(CAP, text="…I think AI will probably like most likely sort of lead to the end of the world…",
                              hl="the end of the world", dimHl=0.85,
                              words=[{"w": w, "s": s} for w, s in [
                                  ("…I", 1.86), ("THINK", 1.99), ("AI", 2.2), ("WILL", 2.52),
                                  ("PROBABLY", 2.78), ("LIKE", 3.44), ("MOST", 3.9), ("LIKELY", 4.14), ("SORT", 4.48), ("OF", 4.66),
                                  ("LEAD", 5.1), ("TO", 5.58), ("THE", 5.72), ("END", 5.8), ("OF", 5.92), ("THE", 6.02), ("WORLD…", 6.12)]]),
              "source": "Airbnb fireside chat · 2015", "audio": {"in": AL_AUDIO_IN, "out": 6.34, "peak_rel_db": 14}, "verified": True, **MON,
              "_note": "r4: footage + his own voice replace the silent quote card (all three short critics). r6: verbatim (small.en and "
                       "base.en on the exact window, 3/3 each): 'I think AI will probably like most likely sort of lead to the end of the "
                       "world'; the leading … marks the cut 'You know,', the trailing … the sentence going on ('but in the meantime, there "
                       "will be great companies created with serious machine learning'). rev2: the backdrop (the event's cyan wall with "
                       "yellow speaker credits, 'Airbnb' among them) is shown as filmed (the r4 key is removed). Year only (the month rests on Business "
                       "Insider's Jun 4, 2015 report). Audio: a quiet recording with a 21 dB peak-to-loudness ratio, so a per-clip peak "
                       "limiter (peak_rel_db 14) keeps it from capping the whole mix's loudness."})

# Amodei, Sep 17, 2025 (heard). The stage wall behind him is rows of AXIOS logos (one directly behind his head). r4 keyed it to
# a plain dark ground; rev2 (William: keep the original footage) removes the key, so the wall, the logos and Jack Clark at left
# are shown as filmed. r5 (social critic: the 400 px crop was 2.7x, the softest image in the montage): a 640 px crop (1.69x),
# x 195-835, y 150-529; the source is the Axios channel's 720p upload (y2mate offers no larger file).
AM_AUDIO = (1065.67, 1069.34)
AM_IN = round(AM_AUDIO[0] - 0.03, 3)
items.append({"id": "amodei", "type": "clip", "t0": T_AMO, "t1": T_HF, "src": "clips/amodei-axios-2025.mp4", "in": AM_IN,
              "crop": {"x": 195, "y": 150, "w": 640}, "grade": dict(GRADE, sharpen=0.6, brightness=-0.02),
              # r6 (motion critic: one framing for 3.6 s, and '25%' had no emphasis): the push is 1.00 -> 1.06 and the picture
              # punches 6 % with a 6 px hit on '25%' (src 1066.01 = edit 5.103). Year-only chip (the source line carries the date).
              "zoom": [1.0, 1.06], "focus": [0.5, 0.35],
              # (on frame 153 = 5.100, the frame '25%' starts in; 1066.01 is edit 5.103)
              "punch": [{"at": f(153), "z": 1.06, "dur": 0.12}],
              "shakes": [{"at": f(153), "amp": 7, "decay": 0.07}],
              "stamp": dict(STAMP, year="2025", name="Dario Amodei", role="CEO, Anthropic"),
              "caption": dict(CAP, text="…there’s a 25% chance that things go really, really badly…", hl=["25%", "really, really badly"],
                              words=[{"w": w, "s": s} for w, s in [
                                  ("…THERE’S", 1065.69), ("A", 1065.91), ("25%", 1066.01), ("CHANCE", 1067.07), ("THAT", 1067.33),
                                  ("THINGS", 1067.55), ("GO", 1067.73), ("REALLY,", 1068.01), ("REALLY", 1068.59), ("BADLY…", 1068.87)]]),
              # r7 (editorial: the card ended on "badly" as if that were the whole claim): the caption stays exactly what is heard,
              # ending "…" after "badly", and a small serif line under it gives how the sentence goes on, as text (not heard, never
              # word-lit): research/verify/amodei-line.json "line_continues_verbatim": "and a 75% chance that things go really, really
              # well" (small.en: "…really, really well with not much space.", so it also ends with …). "I think" stays out (leading …).
              "sub": {"text": "“…and a 75% chance that things go really, really well…”", "size": 40, "gap": 22, "color": "#C2BDCE"},
              "source": "Axios AI+ DC Summit · Sep 17, 2025", "audio": {"in": AM_AUDIO[0], "out": AM_AUDIO[1], "lcut": 0.15}, "verified": True, **MON,
              "_note": "Footage per research/verify/amodei-video.json (Axios upload nvXj4HTiYqA). Full sentence: 'I'm relatively an "
                       "optimist, so I think there's a 25% chance that things go really, really badly and a 75% chance that things go "
                       "really, really well'. r4 (editorial critic): the caption now ENDS with … (it went on with the 75% clause), not a "
                       "full stop; 'So I think' is trimmed (leading …). rev2: the background is shown as filmed (AXIOS wall, Jack Clark at left; the r4 key is removed)."})

# The Hugging Face attack: two headlines, one at a time (r6). Wired and CNBC are dropped here.
# r6 (motion critic, high: each headline had full-contrast paper only for its 2-frame landing flash, then sat at 0.3 on black,
# and the two overlapped; social critic, high: ~22 words in 2.4 s): TIME alone from pre:10 to pre:6 (8.300-10.233, 1.93 s), then
# BBC alone to the breath (10.233-11.922, 1.69 s). Each is set larger (84 px, centred in the clip box's region), the words outside
# the highlight at 0.62 (was 0.3), the red chip wipes on one pulse after the headline lands (a beat event in the hold), and a
# slow 4 % push keeps the frame moving. Both texts are verbatim (research/verify/hl-time-0724.json, hl-bbc-0730.json).
# r7 (motion critic: each card flipped from cream paper to dark mid-hold): "invert" 0, so each headline is light type on the dark
# montage ground from its first frame to its last; the landing is the 1.07 -> 1 slam with a 6 px hit, the red chip wipes on a pulse later.
HL = {"size": 84, "style": {"cy": 760}, "dimRest": 0.62, "zoom": [1.0, 1.04], "hit": 6, "hlWipe": 0.2, "invert": 0}
# r7 (editorial: "the Hugging Face attack · by rogue OpenAI agents" stated the attack as settled fact): the stamp carries the claim
# with its attribution, as the headlines do (Fortune: "OpenAI says its AI models … hacked into AI company Hugging Face"; BBC: "OpenAI
# says its rogue AI tried to hack other companies"; Wired: "…Its AI Agents…"): "OpenAI says its agents attacked Hugging Face".
items.append({"id": "hf-stamp", "type": "stamp", "t0": T_HF, "t1": T_BREATH, **MON,
              "stamp": dict(STAMP, year="2026", name="OpenAI says its agents attacked Hugging Face", w=560), "verified": True})
items.append({"id": "hf-time", "type": "headline", "t0": T_HF, "t1": T_BBC, **HL, **MON, "hlAt": "pre:9",
              "outlet": "TIME", "date": "Jul 24, 2026", "text": "How OpenAI Lost Control of an AI Model—and What Needs to Change",
              "hl": "Lost Control", "verified": True})
items.append({"id": "hf-bbc", "type": "headline", "t0": T_BBC, "t1": T_BREATH, **HL, **MON, "hlAt": "pre:5",
              "outlet": "BBC News", "date": "Jul 29, 2026", "text": "OpenAI says its rogue AI tried to hack other companies",
              "hl": "rogue AI tried to hack", "verified": True})

# r6: Coxon (The Daily Show, Oct 5, 2026: "…There won't be jobs…") is dropped from the short to give both headlines their own
# beat (see the docstring); he stays in the long cut. Montage speech now ends with Amodei's "badly" at edit 8.433.

# The breath. Approved exception: William asked for these exact words on screen; they are also sung later in the song (71.94).
items.append({"id": "breath", "type": "text", "t0": T_BREATH, "t1": "riff:0", "bg": "#000000", "text": "it’s brutal out here",
              "words": [{"w": "it’s", "at": "pre:2.5"}, {"w": "brutal", "at": "pre:2.25"}, {"w": "out", "at": "pre:2"}, {"w": "here", "at": "pre:1.75"}],
              "style": {"y": 880, "size": 112},
              "_note": "William's exact words, lowercase, at his explicit request: the ONE approved exception to 'no lyrics on screen' "
                       "(out/NOTES.md). Lands word by word on 16ths (11.92-12.29), over the breath (12.15-12.95), then holds until the drop."})

# the refrain's cream ground, under the logo: the logo's own cream cuts to it at the break (identical colour, so seamless)
items.append({"id": "ground-cream", "type": "color", "color": CREAM, "t0": SPLICE - 0.1, "t1": DUR,
              "_note": "Refrain + instrumental ground (full colour on cream), under the logo; revealed when the logo breaks apart."})

# ---------------------------------------------------------------- 2. the drop: the logo forms on the riff, hits on every beat of the hold, breaks ON the splice
logo = copy.deepcopy(next(x for x in v1['items'] if x['type'] == 'logo'))
logo.update({"id": "logo-form", "t1": "bar:4+0.6", "grid": "beat", "beat0": 0,
             "break": {"at": SPLICE_HIT, "dur": 0.36, "stagger": 0.004, "lead": 0.04, "hide": ["band", "pink"], "bgFade": 0, "hit": 18}})
# r1: the same downbeat slam as the long cut (plane band + black and pink discs land fully formed on the drop frame, 3-frame
# shake, whole-art kick; core on beat 1, small O on 1.5, the rest unchanged). Out of the black montage the drop keeps a
# ONE-frame white flash (frame 394; decay 0.012 s, so frame 395 already shows the art), as BUILD.md's Look allows.
lg_logo = next(x for x in lg['items'] if x['id'] == 'logo-form')
for k in ('slam', 'slamDur', 'slamFrom', 'cues', 'hits', 'pulse'):
    logo[k] = copy.deepcopy(lg_logo[k])
# r4 (motion + social critics: a 2.4 s static hold after the kicker, and no picture event on the splice):
# - every beat of the hold has an event: single pieces bump on beats 11-14.5, small camera hits on 11, 13 and 14 (12 is in the
#   long cut's list), stronger whole-art kicks, and a slow 3.5 % push-in from the kicker (beat 10) to the splice;
# - the logo BREAKS APART on the first attack after the splice (edit 20.397), with a 0.3 white flash and an 18 px hit, so the
#   audio change is seen; the band and the pink circle morph into the ticker band and the Stargate frame from that frame.
logo['hits'] = logo['hits'] + [{"beat": 11, "amp": 5, "decay": 0.06}, {"beat": 13, "amp": 6, "decay": 0.06}, {"beat": 14, "amp": 5, "decay": 0.06}]
# r6 (motion critic, low: "confirm the shake fires at 13.13 and 15.08"): it does (beat 0 = 13.132, beat 4 = 15.077, beat 8 = the
# wordmark at 17.021, 22 px). The downbeat hit is raised from 14 px / 0.05 s (about 3 frames) to 20 px / 0.07 s and the bar-2
# downbeat from 9 to 12 px, so the drop's camera hit reads on a phone.
_HARD = {0: {"amp": 20, "decay": 0.07}, 4: {"amp": 12, "decay": 0.07}}
logo['hits'] = [dict(h, **_HARD[h['beat']]) if h['beat'] in _HARD else h for h in logo['hits']]
logo['pulse'] = dict(logo['pulse'], accents=dict(logo['pulse']['accents'], **{"11": 1.6, "12": 1.8, "13": 1.8, "14": 1.6}))
logo['rehits'] = [{"beat": 11, "parts": ["blue", "teal", "square"], "scale": 1.26, "dur": 0.18},
                  {"beat": 12, "parts": ["pink", "core"], "scale": 1.16, "dur": 0.18},
                  {"beat": 12.5, "parts": ["dots", "smallO"], "scale": 1.8, "dur": 0.18},
                  {"beat": 13, "parts": ["blue", "teal", "target", "square"], "scale": 1.28, "dur": 0.18},
                  {"beat": 13.5, "parts": ["nabla", "chk"], "scale": 1.3, "dur": 0.16},
                  {"beat": 14, "parts": ["black", "core", "pink"], "scale": 1.16, "dur": 0.18},
                  {"beat": 14.5, "parts": ["teal", "smallO", "dots", "target"], "scale": 1.5, "dur": 0.16}]
logo['push'] = {"from": 10, "to": str(SPLICE_HIT), "z": [1.0, 1.035]}   # a number would be a beat index
logo['flashes'] = [{"beat": 0, "opacity": 0.8, "decay": 0.012}, {"beat": 8, "opacity": 0.22, "decay": 0.05},
                   {"beat": str(SPLICE_HIT), "opacity": 0.3, "decay": 0.04}]
logo['_note'] = ("short-v1's formation (LOGO_CUES on the measured riff onsets: plane + dots on the downbeat, shapes on beats 1-7, "
                 "wordmark beat 8, tilt 9, kicker 10), with the long cut's downbeat slam. r4: beat-locked piece hits and a slow push "
                 "through the hold (beats 10-15), then it BREAKS APART on the attack right after the music splice (cut at edit %.3f, "
                 "attack %.3f) with a flash: the plane band becomes the Guardian ticker's band and the pink circle the Stargate frame."
                 % (SPLICE, SPLICE_HIT))
items.append(logo)

# ---------------------------------------------------------------- 3. refrain bars 24-26 (long.json refrain-b), then the clear on 'God,'
MORPH = {"style": "morph", "dur": 0.24, "delay": 0.04}
GOD = 27.088      # the band's stop (song 71.90): Lee's card has collapsed, the 'God,' disc slams (section 4)
PINK_C, BLUE_C = (930, 470, 165), (850, 1340, 150)   # r6: the two card circles (cx, cy, r)
# r5 (motion critic, high: 22.83-27.09 held one card on empty cream, the band, Stargate and ticker all gone at bar:5): the circles
# that frame the two quote cards are listed BEFORE the band, so the plane lies across them as in the cover; the cards sit on top.
# Apollo (blue card): the logo's pink circle behind its top-right corner; Lee (cream card, pink ring): the blue circle behind its
# bottom-left corner. Each pops on the second beat of its bar and collapses with its card.
# r6 (motion critic, medium: the pink disc read as a sliver at the card's corner and left a stray pink dot at ~24.7 as it
# collapsed 0.16 s before its card cut; the blue disc sat almost wholly behind Lee's card and the band, a blue sliver): each disc
# is placed so a clear part of it shows, as the circles do on the cover, and it leaves on its card's own frame.
# - Apollo: the pink circle behind the card's top-right corner, moved in from the frame edge (cx 930, r 165): ~45 % of it shows
#   above/right of the card, none of it is cut by the frame edge's button rail band; exit "cut" with the card at bar:6.
# - Lee: the blue circle BELOW the plane band at the right, as on the cover (blue under the plane, right of centre): cx 850,
#   cy 1340, r 150, clear of the card (bottom y 1128) and above the bottom app band (y 1490); the band lies over its top edge.
items.append({"id": "rf-apollo-disc", "type": "shape", "t0": "beat:21", "t1": "bar:6",
              "frame": {"shape": "circle", "cx": PINK_C[0], "cy": PINK_C[1], "r": PINK_C[2], "fill": "#FF2E88"},
              "enter": {"style": "pop", "dur": 0.3}, "zoom": [1.0, 1.06],
              "_note": "r5: the logo's pink circle as the Apollo card's frame (behind its top-right corner), under the plane band. "
                       "r6: moved in from the frame edge so ~45 % shows; it cuts out with the card (no collapse dot)."})
items.append({"id": "rf-lee-disc", "type": "shape", "t0": "beat:25", "t1": GOD,
              "frame": {"shape": "circle", "cx": BLUE_C[0], "cy": BLUE_C[1], "r": BLUE_C[2], "fill": "#2346FF"},
              # r6: it leaves WITH the band (the band slides out up-right along its axis over the same 0.22 s), instead of
              # collapsing to a lone blue dot beside Lee's shrinking card
              "enter": {"style": "pop", "dur": 0.3}, "exit": {"style": "fly", "to": "axis", "dur": 0.22, "dist": 1700},
              "zoom": [1.0, 1.06],
              "_note": "r5: the logo's blue circle as the Lee card's frame. r6: below the plane band at the right, as on the cover, "
                       "clear of the card, so the whole disc reads (it was a sliver at the card's bottom-left corner); it flies out "
                       "with the band on the band's stop."})
items.append({"id": "rf-band", "type": "band", "t0": SPLICE_HIT, "t1": GOD, "band": copy.deepcopy(next(x for x in lg['items'] if x['id'] == 'rf-guardian')['band']),
              "enter": dict(MORPH, **{"from": "logo:band"}), "exit": {"style": "slide", "dur": 0.22},
              "_note": "The logo's plane band thickens into the 'golden age' ticker band at the break (long.json's rf-guardian band geometry). "
                       "r5: it stays on as the ground under the Apollo and Lee cards (motion critic) and slides out on the band's stop."})
# r7 (motion critic: the Stargate stamp and the Guardian ticker were on screen together 20.90-22.83, two attribution blocks in one
# bar): the stamp is its own item and ends as the ticker lands on bar:4 (20.900); it lands with the image on the break frame (no
# text delay), so the picture is named for 0.5 s and the Guardian then holds the bar alone over the image. The full credit
# ("Imagery: Epoch AI · Jul 2026") stays in the post caption.
_sg = from_long("rf-stargate", t0=SPLICE_HIT, enter=dict(MORPH, **{"from": "logo:pink"}), textDelay=0.3, **{"hit": None})
items.append({"id": "rf-stargate-stamp", "type": "stamp", "t0": SPLICE_HIT, "t1": "bar:4", "stamp": _sg.pop("stamp"),
              "verified": True, "_note": "r7: rf-stargate's stamp, split off so it ends on the Guardian ticker's landing (bar:4)."})
items.append(_sg)
# r4 (motion critic: the Guardian line sat between the photo and the band, under the Epoch AI stamp, and read as the photo's
# credit): outlet over date, a compact block that hugs the band's top edge at the left, well below the circle.
# r5 (social critic: 9 words in one bar): the verbatim ticker stays whole; outside 'golden age' it sits at 0.42 (ticker "dimRest")
# r5 (motion critic: the band read dark at 20.90 and yellow by 21.00): the ink flash is the ticker's landing hit on the bar-24
# downbeat; "invert" 0.06 makes it exactly 2 frames (0.067 rounded up to 3 frames at this phase)
# r6 (motion critic, medium: the rest at 0.42 over the yellow band read as muddy tan): the rest at 0.75 (ink on yellow), the red
# 'golden age' unchanged. The headline stays verbatim (only 'to nearly $100bn' is cut, marked …): the social critic's shorter
# "Nvidia's revenue doubles…" would drop 'quarterly' with no mark, i.e. reword it; this is the cut's one deliberately fast item.
# r7 (the long cut's Guardian and the short's TIME/BBC fixes, same reason: a 2-frame near-black band reads as a state flip): invert
# 0, so the yellow band never goes dark; the text lands with its 1.06 -> 1 slam and the 6 px hit on the bar-24 downbeat.
gu = from_long("rf-guardian", band="rf-band", t0="bar:4", hit=6, dimRest=0.75, invert=0, **{"enter": None, "exit": None})
# r7 (bottom zone: the rotated headline's lower-left words reached y ~1452): the text sits 50 px further along the band (up-right),
# so its lowest word ends above y 1440 and its right end stays left of x 930 below y 1000
gu['style'] = dict(gu.get('style', {}), labelStack=True, labelGap=14, along=50)
items.append(gu)
# r4 (editorial critic: the Apollo test gave the model its goal; the source line made the quote read as spontaneous). Apollo
# Research, "Frontier Models are Capable of In-context Scheming" (Dec 5, 2024): every scenario gives the model a goal in its
# system prompt, and the self-exfiltration figure is the model's hidden reasoning.
# r5 (motion critic: the two quote cards skipped the cut's header stamp row; social critic: the test framing sat in a long, small
# source line): both get the y-300 stamp (year chip, name, role) used by every other sourced item, and the in-card year/name row is
# dropped. Apollo: the role carries the test framing ("Apollo Research test · goal set by researchers"), the card keeps only the
# quote and a short 32 px source line at full opacity ("Hidden reasoning · Dec 5, 2024": the words are the model's <thinking>).
items.append(from_long("rf-apollo-card", frame={"shape": "square", "x": 90, "y": 470, "w": 900, "h": 600, "fill": "#2346FF"}))
# r6 (social critic: the quote cards repeat the year; Apollo ~24 words in 1.92 s): the source line is "Hidden reasoning" (the chip
# carries 2024; the paper's date, Dec 5, 2024, is in the post caption), so the card reads stamp + 7 quote words + 2.
# r7 (density: ~20 words in 1.92 s): the stamp's role is the long cut's qualifier, "Test · hidden reasoning" (the words are the
# model's <thinking> in a test), and the card's separate source line goes; Apollo Research, the goal the researchers set and the
# paper's date are in the post caption. Stamp 4 + role 3 + quote 7 = 14 words (was 20).
ap = from_long("rf-apollo", **{"name": None, "year": None, "role": None, "source": None}, **MON,
               stamp=dict(STAMP, year="2024", name="Claude 3 Opus", role="Test · hidden reasoning", w=500))
ap['style'] = dict(ap['style'], cy=770, dimColor="#F2EBDD")
items.append(ap)
# Lee (social critic: the punchline shrank while it was being read): the collapse is 0.22 s (was 0.36), so the card holds full size
# to 26.866; the stamp row carries name, year and role.
items.append(from_long("rf-lee-card", frame={"shape": "square", "x": 90, "y": 470, "w": 900, "h": 640, "ring": "#FF2E88", "ringW": 18,
                                             "fill": "#FBF7EE"}, exit={"style": "collapse", "dur": 0.22}))
lee = from_long("rf-lee", **{"name": None, "year": None, "role": None}, **MON, exit={"style": "collapse", "dur": 0.22},
                stamp=dict(STAMP, year="2019", name="Lee Sedol", role="Go player"))
lee['style'] = dict(lee['style'], cy=790)
# r6 (social critic: the year repeats under the chip): "Speaking to Yonhap" (the verified attribution: Lee Sedol speaking to Yonhap
# News Agency, Nov 27, 2019; research/long/plan/rf-b.verify.json). The chip carries 2019; the full date is in the post caption.
# r7 (editorial: '…there is an entity that cannot be defeated.' drops the concessive 'Even if I become the number one,'): the
# leading … stays and the context is on the card, from long.json's label "On AI, retiring from Go" with the 2019 chip (he said it
# explaining his retirement; TNW: 'World champion Go player retires: AI "cannot be defeated"'). The role is "Go player" (no repeat
# of 'retiring'), and the source line "Speaking to Yonhap" goes to the post caption as in the long cut, so the label's three extra
# words cost nothing: stamp 5 + label 5 + quote 8 = 18 words (was 18 + 3).
lee.pop('source', None)
items.append(lee)
# r5: with the shorter collapse the 'God,' seed (from 26.941) would draw over Lee's card while it is still being read, so it is moved
# under the card in the stack: it grows behind the card and is revealed as the card shrinks into it.
items.insert(next(i for i, x in enumerate(items) if x['id'] == 'rf-lee-card'), from_long("rf-god-seed", t1=27.088))

# ---------------------------------------------------------------- 4. the instrumental: the pieces reassemble and hold; Bostrom is heard
# r4 (all three critics: ~3 near-empty cream frames 27.09-27.18 at 'God,'): the disc slams on the band's stop (song 71.90 = edit
# 27.088, the frame Lee's card finishes collapsing), one frame before the sung 'God,' (71.94); the seed ends there.
# r6 (motion critic, medium: the a cappella line read as a pause, the six dots the only motion): the disc kicks 4 % (0.14 s) and
# the camera hits 6 px on each data point's pop (logo-re dotsAt, one per sung word), and the slow grow is 1.00 -> 1.10.
_god = from_long("rf-god-disc", t0=GOD, zoom=[1.0, 1.1])
_dots = next(x for x in lg['items'] if x['id'] == 'logo-re')['dotsAt']
_god['kicks'] = [{"at": ref(x), "s": 1.04, "dur": 0.14} for x in _dots]
_god['kickOrigin'] = [540, 820]
_god['shakes'] = [{"at": ref(x), "amp": 6, "decay": 0.06} for x in _dots]
items.append(_god)
# r5 (motion critic: at 30.10 the slammed wordmark ran past both frame edges): its slam starts at 1.1x (was 1.32x)
items.append(from_long("logo-re", t1=DUR, wmFrom=1.1))
items.append(from_long("end-voice"))
# r4 (social critic: the payoff caption was the cut's smallest, 36 px): 44 px, with the source on the rule's line.
# r5 (motion critic: three lines at y 272 ended ~30 px above the black circle, and the note said 290): y 290 and 37 px across 960 px,
# which sets it in TWO lines ("…THE LAST INVENTION" / "THAT HUMANITY…"; at 38 px Plex Mono advances 23 px, so the 42-character first
# line needs 966 px and it fell back to three), ending ~65 px above the art (black circle top y 481).
# FINAL PASS: the long cut's closing caption, unchanged (40 px, three lines, source on the rule's line, y 268), so both cuts end on
# the same cover moment and the line clears the 38 px floor (it was 37 px in two lines; at 40 px Plex Mono 960 px holds 40 characters).
items.append(from_long("end-cap"))
for it in items:   # drop keys set to None by the overrides above
    for k in [k for k, v in it.items() if v is None]:
        del it[k]

edl = {
    "name": "short",
    "title": "Hyperplane x brutal: short teaser, the spliced intro cut (9:16)",
    "fps": FPS, "width": 1080, "height": 1920, "duration": DUR,
    "audio": {"song": "song/brutal.mp3", "songStart": SONG0,
              "note": "SPLICED. Edit time = song time - 6.10 up to the splice at edit %.3f (song %.3f), then song time - %.3f "
                      "(song %.3f on). The 'song' block below is what mix.py plays; songStart only holds before the splice. "
                      "Clip speech: the montage (edit 0-8.43; Olivia's spoken line starts at 11.56) and Bostrom over the closing "
                      "instrumental." % (SPLICE, RIFF_OUT, POST, REF_IN)},
    "song": {"file": "song/brutal.mp3",
             "segments": [{"in_s": SONG0, "out_s": RIFF_OUT, "at": 0}, {"in_s": REF_IN, "out_s": SONG_OUT, "at": SPLICE}],
             "xfade_ms": 20, "xfade_shape": "gain", "bars": "song/bars.json", "bar_tol_ms": 70,
             "fade_in_s": 0.01, "fade_out_s": 0.35, "max_out_s": 80.45,
             "note": "Splice riff beat 15 -> refrain bar 23 beat 4 (same bar phase, 20 bars = %.3f s). Not on a bar line: bar 23's "
                     "downbeat is inside 'upset' (vocal to ~64.2) and bar 24's is inside the pickup 'They say' (from ~65.43). "
                     "bar_tol_ms 70 because bars.json runs ~25 ms late and both cut points sit 15-20 ms before the beat's attack, by "
                     "design (out/NOTES.md)." % DELTA},
    "outputs": {"song": "out/hyperplane-brutal-short-9x16.mp4", "no_song": "out/hyperplane-brutal-short-no-song-9x16.mp4"},
    "look": v1['look'],
    "layout": {"clipBox": {"x": 0, "y": 400, "w": 1080, "h": 640},
               "caption": {"x": 60, "w": 900, "gap": 40, "size": 56, "lh": 1.16, "reveal": "words"},
               "stack": {"y0": 420, "y1": 1400, "gap": 64, "dim": 0.62, "align": "center"}},
    "themes": [{"t0": SPLICE - 0.1, "t1": 1e9, "theme": "light"}],
    "grids": {"riff": riff, "pre": PRE, "beat": beat, "bar": bar},
    "_grids_note": "riff and pre as in short-v1 (riff = measured riff onsets, beat 0 = the drop at edit 13.132; pre:k = k beats "
                   "before it). beat = riff (beats 0-15) followed by long-beats.json from song bar 24 on, shifted to this timeline "
                   "(edit = song - %.3f): beat:16 = bar:4 = song bar 24 'golden years' (edit %.3f), bar:5 'disappear', bar:6 "
                   "'ego crush', bar:7 'God, it's brutal out here', bar:8 = the instrumental's downbeat (song 73.42), bar:9 the "
                   "kicker (song 75.36). The music splice is at edit %.3f, just before beat:15. r4: the intro (edit 0-7.7) has no "
                   "measurable pulse (flat onset-phase histograms in every band), so montage cuts there follow the speech; from edit "
                   "7.7 a ~0.5 s pulse is measurable (2-8 kHz onsets at 7.75, 8.24, 8.76, 9.26) and pre:k matches it within 60 ms."
                   % (POST, bar[4], SPLICE),
    "items": items,
}
OUT.write_text(json.dumps(edl, indent=1, ensure_ascii=False) + "\n")
print(f"wrote {OUT}: {len(items)} items, {DUR}s ({N_FRAMES} frames); splice edit {SPLICE} = song {RIFF_OUT} -> {REF_IN} (attack {SPLICE_HIT}); "
      f"song out {SONG_OUT}; bar:4 = {bar[4]}, bar:7 = {bar[7]}, bar:8 = {bar[8]}; montage cuts {T_AMO} {T_HF} {T_BBC} breath {T_BREATH}")
