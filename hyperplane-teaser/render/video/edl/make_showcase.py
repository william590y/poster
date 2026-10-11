"""Generator for edl/showcase.json (integrator, rev2): every rev2 module in one spliced cut.

  python3 render/video/edl/make_showcase.py && python3 render/video/prep_clips.py showcase

Song 6.10 -> 34.70 (the prelude, the drop and the riff, verse 1), a downbeat-to-downbeat splice, song 63.732 -> 80.40 (refrain
bar 23 to the instrumental). Edit = song - 6.10 before the splice (edit 28.60), song - 35.132 after it.
  prelude   Altman 2015 and Amodei 2025 as filmed (no keying), word-lit captions; three real HF-incident headline screenshots
            piled on the prelude's pulse swells, pushed and lifted; the breath is visual only
  drop      illumination flash into the cream world; builder A's kand riff (painted on, orbits, river, superposition) with
            footage inside the pink and blue discs (fx/kandclip.js)
  verse 1   the logo breaks; the pink disc becomes a footage frame; a real MLP reads a 3, says 8, backprops (BP1, BP2, BP4, the
            update rule landing on beats) and says 3; zoom-through into two real screenshot piles with b-roll panels
            ("caught up in the news"), a shatter between them
  splice    whip-spin into the refrain: Epoch's record data-centre chart over the Colossus 2 satellite view, particles into
            the GRPO objective with the DeepSeek / Nvidia screenshots ("golden age" lands on "golden years"), an iris into
            the self-improvement loop (laps of 2 beats, 1 beat, 8ths) as headlines pile up, the black hole swallows
            everything and snaps shut on "God,"; "it's brutal out here" painted on the sung words over fog footage; the
            burst on the instrumental downbeat, the logo reassembles with fluid colour while Yoshua Bengio's line plays
            (audible, music ducked, karaoke caption, his talk's footage inside the pink disc); the cover holds from hb:124.
"""
import json, pathlib

ROOT = pathlib.Path('/home/user/hyperplane-teaser')
EDL = ROOT / 'render/video/edl'
R2 = ROOT / 'research/rev2'
SCR = {x['id']: x for x in json.load(open(R2 / 'screens.json'))['items']}
SCR.update({x['id']: x for x in json.load(open(R2 / 'captures.json'))['items']})
GRA = {x['id']: x for x in json.load(open(R2 / 'graphs.json'))['items']}
SHORT = {x['id']: x for x in json.load(open(EDL / 'short.json'))['items']}
MON = 'JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC'.split()


def dt(d):
    y, m, dd = (d.split('-') + ['1', '1'])[:3]
    return f"{MON[int(m) - 1]} {int(dd)}, {y}"


BEAT = 60 / 124
HB = lambda i: 19.232 + i * BEAT                 # song second of hits.json beat i
B = lambda i: f"hb:{i}"
SEG1 = (6.10, 34.70)                             # song in/out (out 16 ms before the hb:32 downbeat's grid time 34.716)
SEG2_IN = 63.732                                 # 16 ms before hb:92 (63.748): same bar phase (bar 8 beat 1 -> bar 23 beat 1)
SPLICE = round(SEG1[1] - SEG1[0], 3)             # edit 28.60
SONG_END = 80.40
OFF2 = SEG2_IN - SPLICE                          # edit = song - 35.132 after the splice


def E(song):
    """edit seconds of a song second (either side of the splice)"""
    return round(song - SEG1[0], 4) if song < SEG1[1] else round(song - OFF2, 4)


END = E(SONG_END)                                # 45.268
HB92 = E(HB(92))                                 # 28.616, the first beat after the splice
CREAM, DARK, INK = '#F2EBDD', '#0E0D12', '#15131F'
BROLL = {x['id']: x for x in json.load(open(R2 / ('broll.json' if (R2 / 'broll.json').exists() else 'broll.stand-in.json')))['items']}


def shot(sid, at, entry='slam', **kw):
    assert sid in SCR, sid
    return {'id': sid, 'at': at, 'entry': entry, **kw}


items = []
A = items.append

# ---------------------------------------------------------------- grounds (bottom), the black hole's night, the shared paint layer
A({"id": "g-cream-riff", "type": "color", "t0": B(0), "t1": B(16), "color": CREAM})
A({"id": "g-dark-verse", "type": "color", "t0": B(16), "t1": HB92, "color": DARK, "_note": "hard cut to the dark verse on its downbeat while the logo blows apart"})
A({"id": "g-cream-2", "type": "color", "t0": HB92, "t1": B(109), "color": CREAM})
A({"id": "g-cream-3", "type": "color", "t0": B(112), "t1": END, "color": CREAM,
   "enterFx": {"type": "iris", "shape": "circle", "c": [540, 861], "dur": 1.0, "lead": 0, "rim": "yellow", "ground": False}})
A({"id": "hole", "type": "blackhole", "t0": B(100), "t1": B(113.5), "c": [540, 861],
   "r": [[B(101), 0], [B(102.5), 30], [B(104.5), 70], [B(106.5), 120], [B(107.6), 160]],
   "darken": {"from": B(104.5), "to": B(107.7)},
   "swallow": {"from": B(104.5), "to": B(107.8), "items": "all", "keep": ["fog", "brutal", "fog-credit"], "turns": 1.15},
   "collapse": {"at": B(107.78), "dur": 0.14, "flash": 0.85, "flashDecay": 0.06, "shake": 14,
                "pinch": {"glow": 0.6, "ring": 0.55, "flecks": 56, "colors": ["cream", "yellow", "pink", "orange", "teal"]}},
   "burst": {"at": B(112), "rings": 3, "debris": 80},
   "shakes": [{"at": B(104), "amp": 10}, {"at": B(106), "amp": 8}],
   "_note": "builder D's singularity: opens as the laps reach a beat (hb:101), swallows everything from hb:104.5, snaps shut on 'God,' (song 71.456 = hb:107.93), bursts on the instrumental's downbeat hb:112"})
A({"id": "paint", "type": "layer", "kind": "canvas", "_note": "the beat track's paint (splats, stamps, ticks, grain): above the grounds, under the facts"})

# ---------------------------------------------------------------- PRELUDE (edit 0 - 13.132): Altman 2015, Amodei 2025, the HF pile
# polisher: a taller footage box (1080x740 from y 380, was 1080x640 from y 400) with tighter crops, so the speakers fill the frame,
# Altman's stage banner is a strip rather than half the picture, Amodei's crop starts between two rows of Axios wordmarks, and
# the captions sit lower (no empty dark third under them). Captions "sweep": unspoken words at 0.14, the hook phrases at 0.3
# with no chip until spoken, the red chip swept on with the voice, a pencil underline / circle drawn as the words land.
PRELUDE = {
  "altman": {"crop": {"x": 320, "y": 80, "w": 600}, "focus": [0.72, 0.3],
             "marks": [{"phrase": "the end of the world…", "style": "underline", "at": 3.88, "dur": 0.34, "color": "#F2C300", "width": 7}]},
  "amodei": {"crop": {"x": 210, "y": 100, "w": 600}, "focus": [0.5, 0.42],
             "marks": [{"phrase": "25%", "style": "circle", "at": 5.2, "dur": 0.3, "color": "#F2C300", "width": 7},
                       {"phrase": "really, really badly…", "style": "underline", "at": 7.1, "dur": 0.95, "color": "#F2C300", "width": 7}]},
}
AMODEI_T1 = B(-7)                                # song 15.845 = edit 9.745: the 75% baseline is read before the fold (was 8.3)
for k in ("altman", "amodei"):
    it = json.loads(json.dumps(SHORT[k]))
    it["zoom"] = [1.0, 1.1]   # showcase: a stronger slow push than the short (beatcheck flagged the prelude's slow push as near-static)
    it["crop"] = PRELUDE[k]["crop"]; it["focus"] = PRELUDE[k]["focus"]
    it["frames"] = f"showcase-{k}"   # its own cache folder: the short's cache/altman, cache/amodei keep the short's crop and box
    it["caption"].update({"reveal": "sweep", "dimOp": 0.14, "dimHl": 0.3, "marks": PRELUDE[k]["marks"]})
    it["caption"].pop("dimHl_", None)
    it["_note"] = "copied from edl/short.json (verified words, timing and audio; footage as filmed, no keying). " + it.get("_note", "")[:300]
    A(it)
amo = items[-1]
amo["t1"] = AMODEI_T1
amo["punch"] += [{"at": 7.1, "z": 1.035, "dur": 0.12}, {"at": 7.963, "z": 1.05, "dur": 0.12}]
amo["shakes"] += [{"at": 7.963, "amp": 6, "decay": 0.08}]
amo["sub"].update({"size": 44, "gap": 20, "roll": {"rate": 8}, "marks": [{"phrase": "75%", "style": "paint", "color": "#F2C300", "at": 8.95, "dur": 0.22}]})
amo["_note"] = ("polisher: held to hb:-7 (edit 9.745) so the baseline is never dropped: his audio still ends at clip 1069.34 (edit 8.43), the "
                "picture plays on (he is saying exactly the sub line, muted) while the sub rolls out on 32nds from 'BADLY' (8.17-8.88) and "
                "the marker hits '75%' at 8.95; the fold starts at 9.44. ") + amo["_note"]
P = {"fortune": AMODEI_T1, "time": B(-6), "bbc": E(16.823), "push": E(17.233), "lift": E(17.784), "circle": E(18.138)}
A({"id": "pile-hf", "type": "screens", "t0": AMODEI_T1, "t1": B(1.75), "region": {"x0": 60, "y0": 330, "x1": 1020, "y1": 1500}, "w": 900,
   "shots": [shot("fortune-2026-07-21-openai-hf-escape", P["fortune"], "slam", hl=1),
             shot("time-2026-07-24-lost-control", P["time"], "drop"),
             shot("bbc-2026-07-29-rogue-ai-hack-other-companies", P["bbc"], "paint")],
   "push": {"at": P["push"], "z": 1.4, "dur": 0.6}, "emph": [{"style": "lift", "at": P["lift"]}, {"style": "circle", "at": P["circle"]}],
   "pulse": [E(16.646), E(17.233), E(17.784), E(18.138)], "out": {"style": "scatter", "at": B(0), "dur": 0.8}, "drift": 0.05,
   "_note": "real captures (research/rev2/captures.json, focus crops): Fortune Jul 21, TIME Jul 24, BBC Jul 29 2026, dumped on the prelude's beats and pulse swells (hb:-7, hb:-6, song 16.823 = hb:-5; hits.json prelude_pulse); pushed into the BBC phrase, lifted and circled through the breath (song 18.25-19.05, visual only)"})

# ---------------------------------------------------------------- RIFF (hb:0 - 16): the kand riff, footage inside the discs
# polisher: the river runs hb:8-16 (was 10-16) with 16 vectors 2.3x the size, joining on 8ths, comet trails, water ripples and
# brighter flow lines; the superposition is bigger (r 380) and its reframes cap at 1.15x about a point that keeps the whole wordmark
# in frame (was 1.5x / 1.25x pushes that cut the title to "Hyperp" for hb:13-15)
RIFF_PRESET = {"name": "riff", "from": "hb:0",
  "river": {"from": 8, "to": 16, "vectors": 16, "size": 2.3, "trail": 1.6, "stagger": 0.5, "lanes": 110, "flowK": 1.6, "ripple": 6,
            "colors": ["ink", "pink", "blue", "violet", "orange", "teal", "red", "ink"]},
  "superpose": {"r": 380},
  "reframe": [{"at": 5, "zoom": 1.55, "focus": "black", "to": [470, 760]}, {"at": 6, "zoom": 1.4, "focus": "blue", "to": [620, 980]}, {"at": 7, "zoom": 1},
              {"at": 13, "zoom": 1.15, "focus": [722, 500], "to": [528, 760], "rot": -2.5}, {"at": 14, "zoom": 1.12, "focus": [764, 583], "to": [550, 820], "rot": 2.5},
              {"at": 15, "zoom": 1}]}
A({"id": "kand-riff", "type": "kand", "t0": B(0), "t1": B(17), "layout": {"y": 400, "scale": 0.72}, "preset": RIFF_PRESET,
   "moves": [{"move": "break", "at": B(16), "dur": 0.4, "hide": ["pink"], "stagger": 0.006}],
   "_note": "builder A's riff preset: painted on piece by piece, orbits, jumps, the river on beats 10-15, the superposition on bar 4; breaks apart on verse 1 (hb:16), the pink disc stays behind as the footage frame"})
A({"id": "kc-pink-riff", "type": "kandclip", "item": "kand-riff", "piece": "pink", "t0": B(1.5), "t1": B(16.05), "prep": "clip",
   "broll": "ale-agent-wall", "speed": 0.42, "frame": {"cx": 540, "cy": 960, "r": 174}, "oversample": 1.25, "zoom": [1.0, 1.15],
   "grade": {"sat": 0.75, "contrast": 1.06, "grain": 0}, "tintK": 0.35,
   "_note": "footage inside the orbiting pink disc (research/rev2/broll.json: a wall of real agent desktop sessions, Agents' Last Exam; its 3 s window slowed to fill the riff)"})
A({"id": "kc-blue-riff", "type": "kandclip", "item": "kand-riff", "piece": "blue", "t0": B(2.5), "t1": B(16.35), "prep": "clip",
   "broll": "figure-botq-200", "frame": {"cx": 540, "cy": 960, "r": 124}, "oversample": 1.25, "zoom": [1.05, 1.2],
   "grade": {"sat": 0.6, "contrast": 1.08, "grain": 0}, "tintK": 0.4,
   "_note": "footage inside the blue disc (b-roll catalog: Figure 03 humanoids in the BotQ hall)"})
A({"id": "riff-credit", "type": "words", "t0": B(3), "t1": B(12.75), "exit": {"style": "fade", "dur": 0.15}, "x": 64, "y": 1530, "w": 900, "text": "IN THE DISCS: AGENTS' LAST EXAM · FIGURE AI",
   "font": {"family": "'IBM Plex Mono', monospace", "weight": 600, "size": 26}, "color": INK, "roll": {"mode": "words", "rate": 4, "from": B(3)}, "theme": "light"})

# ---------------------------------------------------------------- VERSE 1a (hb:16 - 24): the net reads a 3, says 8, learns, says 3
fig = BROLL["unitree-factory"]
A({"id": "v-unitree", "type": "clip", "prep": "clip", "t0": B(16), "t1": B(24), "src": fig["path"], "in": fig["windows"][0]["in"],
   "srcFocus": fig.get("subject_xy", [0.5, 0.5]), "frame": {"shape": "circle", "cx": 862, "cy": 520, "r": 150, "ring": "#F2C300", "ringW": 8},
   "enter": {"style": "morph", "from": "kand-riff:pink", "dur": 0.3}, "zoom": [1.05, 1.18], "grade": {"sat": 0.55, "contrast": 1.1, "grain": 3}, "theme": "dark",
   "_note": "the pink disc becomes a footage frame on the break (morph); b-roll catalog: Unitree humanoids on a factory line (muted)"})
A({"id": "v-unitree-credit", "type": "words", "t0": B(16.5), "t1": B(24), "x": 712, "y": 312, "w": 320, "text": "UNITREE ROBOTICS · FEB 2026",
   "font": {"family": "'IBM Plex Mono', monospace", "weight": 600, "size": 22}, "color": "#C2BDCE", "roll": {"mode": "words", "rate": 4, "from": B(16.5)}})
A({"id": "mlp", "type": "net", "kind": "mlp", "t0": B(16.25), "t1": B(24), "enter": {"style": "fade", "dur": 0.12}, "digit": 3, "wrong": 8, "infer": [B(16.5), B(17), B(18), B(19)], "backprop": "hb:20..22",
   "update": B(22.5), "infer2": {"from": "hb:23", "to": "hb:23.75", "every": 0.25},
   "cam": {"dist": 27, "cy": 1260, "cx": 455, "orbit": 18, "step": 1.4, "target": [-0.9, 0, 0]},
   "_note": "builder B's real sigmoid MLP (144-16-16-10): one layer per beat, the wrong answer (8), the error flows back on beats, one gradient step, the corrected pass on 16ths says 3"})
A({"id": "eq-fwd", "type": "equation", "ref": "nn-forward", "t0": B(16), "t1": B(20), "drop": B(16), "mode": "slam", "x": 90, "y": 360, "px": 68, "theme": "dark",
   "hit": 6, "flash": {"opacity": 0.3, "decay": 0.1, "color": "#F2C300"},
   "label": {"text": "inference: each layer feeds the next", "at": B(16.5), "font": {"size": 44}}, "cite": {"at": B(18.5)}, "exit": {"style": "fade", "dur": 0.15}, "pulse": "hb:17..19",
   "hl": [{"tex": "\\sigma", "at": B(18), "style": "circle", "color": "#FF2E88"}],
   "_note": "polisher: slammed in full cream ink on the verse downbeat (it took the light theme from its old t0 hb:15.9, so it was set in dark ink on the dark verse: 15-20% visible), a 6 px hit and a yellow ink flash; sigma circled on hb:18"})
A({"id": "eq-bp1", "type": "equation", "ref": "bp1", "t0": B(20), "t1": B(24), "drop": B(20), "mode": "pencil", "dur": 0.42, "x": 90, "y": 330, "px": 52, "cite": False,
   "flash": {"opacity": 0.32, "decay": 0.09, "color": "#FF4A1C"}, "hit": 12,
   "label": {"text": "backprop: the error at the output", "at": B(20), "font": {"size": 36}, "gap": 18}})
A({"id": "eq-bp2", "type": "equation", "ref": "bp2", "t0": B(21), "t1": B(24), "drop": B(21), "mode": "pencil", "dur": 0.42, "x": 90, "y": 470, "px": 52, "cite": False})
A({"id": "eq-bp4", "type": "equation", "ref": "bp4", "t0": B(22), "t1": B(24), "drop": B(22), "mode": "pencil", "dur": 0.42, "x": 90, "y": 600, "px": 52, "cite": False})
A({"id": "eq-upd", "type": "equation", "ref": "gd-update", "t0": B(22.5), "t1": B(24), "drop": B(22.5), "mode": "slam", "x": 90, "y": 740, "px": 52,
   "cite": {"text": "Nielsen 2015, Neural Networks and Deep Learning, ch. 2 eqs. BP1, BP2, BP4; ch. 1 eq. 16", "at": B(23), "px": 24, "w": 600},
   "hl": [{"tex": "\\eta \\frac{\\partial C}{\\partial w_k}", "at": B(23.25), "style": "underline", "color": "#F2C300"}]})

# ---------------------------------------------------------------- VERSE 1b (hb:24 - 32): "caught up in the news": two piles + b-roll
cox = BROLL["coxon-daily-show"]
A({"id": "p-band", "type": "panel", "prep": "clip", "broll": "coxon-daily-show", "prepBox": {"w": 1500, "h": 1080}, "t0": B(24), "t1": B(28),
   "shape": "band", "frame": {"cx": 540, "cy": 470, "w": 1500, "h": 330}, "rot": -22, "entry": {"style": "paint", "at": B(24)}, "out": "cut", "border": "none",
   "pulse": "hb:24..27", "pulseAmt": 0.015, "kb": {"z": [1.0, 1.12], "pan": [60, 0]}, "grade": {"sat": 0.2, "contrast": 1.12, "grain": 0},
   "credit": "THE DAILY SHOW · OCT 2026", "creditAt": [64, 300],
   "_note": "the logo's yellow plane band as a footage container at 22 degrees (b-roll: Jacob Coxon in the guest chair, muted)"})
A({"id": "pile-a", "type": "screens", "t0": B(24), "t1": B(28), "region": {"x0": 60, "y0": 720, "x1": 1020, "y1": 1500}, "w": 900,
   "shots": [shot("xrisk-vox-freakout", B(24), "slam"), shot("geopolitics-cnn-hoax-head", B(24.5), "drop"),
             shot("xrisk-bbc-hubinger", B(25), "flip"), shot("xrisk-cbs-amodei", B(26), "paint")],
   "push": {"at": B(26.5), "z": 1.4}, "emph": [{"style": "lift", "at": B(26.5)}, {"style": "circle", "at": B(27)}, {"style": "underline", "at": B(27.5), "color": "#FF2E88"}],
   "out": "cut", "_note": "verse 1: 'caught up in the news' (song 31.2-32.5): the AI freakout goes mainstream; pushed into Amodei's 'warning sign that we need to slow down'"})
A({"id": "p-agents", "type": "panel", "prep": "clip", "broll": "ale-agent-wall", "in": 72.0, "oversample": 1.2, "t0": B(28), "t1": HB92,
   "shape": "square", "frame": {"cx": 790, "cy": 470, "w": 360, "h": 360}, "rot": -7, "entry": {"style": "pop", "at": B(28)}, "out": "cut", "border": "pencil",
   "pulse": "hb:28..31", "pulseAmt": 0.03, "kb": {"z": [1.0, 1.2]}, "grade": {"sat": 0.6, "contrast": 1.05, "grain": 0}, "credit": "AGENTS' LAST EXAM · AGENT SESSIONS",
   "creditAt": [64, 300]})
A({"id": "pile-b", "type": "screens", "t0": B(28), "t1": HB92, "layout": "scatter", "center": [540, 1060], "w": 860, "jitter": {"x": 50, "y": 34, "rot": 6},
   "shots": [shot("security-cnn-gov", B(28), "slam"), shot("frontier-rev2-wired_aug18_headline", B(28.5), "slide"),
             shot("security-hl-bbc-medicare", B(29), "slam"), shot("frontier-rev2-guardian_techscape_sep29_headline", B(29.5), "paint")],
   "push": {"at": B(30), "z": 1.35}, "emph": [{"style": "lift", "at": B(30)}, {"style": "circle", "at": B(30.5)}, {"style": "underline", "at": B(31), "color": "#FF2E88"}],
   "out": "cut", "_note": "'of who likes me and who hates you': the rogue-agent news of Aug-Sep 2026, pushed into 'The AI agents are spiraling out of control'"})

# ---------------------------------------------------------------- REFRAIN (hb:92 - 100): the record data centre, GRPO, "golden age"
g = GRA["dc-record-mw"]
# polisher: the chart's payoff lands and holds. Points on 8ths/16ths from hb:92.5 with the record (Colossus 2, 946 MW) on the beat
# hb:94, the annotation slammed big on hb:94.5, the source line from hb:94.75, and the particles exit moved from hb:96 to hb:97.5
# (1 beat long: the chart is whole until hb:97.25, 3.25 beats after the record lands; was: annotation 30.30 and source 30.40, both
# under the exit that started at 30.3).
# A bigger card (970 px wide, values 44 px), the first value label kept clear of the y ticks, the unit inside the plot.
A({"id": "chart-dc", "type": "chart", "graph": "dc-record-mw", "t0": HB92, "t1": B(97.5), "prep": "image", "src": g["image"],
   "frame": {"x": 70, "y": 262, "w": 940, "h": 440, "rot": -1.2}, "fit": "cover", "srcFocus": [0.5, 0.5], "zoom": [1.0, 1.12],
   "imgCaption": {"text": "xAI Colossus 2 · Epoch AI satellite view, 15 Jun 2026 · imagery (c) Airbus DS", "at": B(92.5), "x": 90},
   "x": 200, "y": 1060, "w": 760, "h": 380, "titleGap": 230, "titlePx": 54, "subPx": 26, "axesAt": B(92), "titleAt": B(92), "titlePer": 0.121, "subAt": B(93),
   "grow": [B(92.5), B(92.75), B(93), B(93.25), B(93.5), B(94)], "labels": "all", "valuePx": 44, "valueFmt": {"dec": 0}, "color": "#FF2E88",
   "yAxis": {"label": "MW", "labelIn": True, "labelPx": 30},
   "annotate": [{"at": B(94.5), "i": 5, "text": g["highlight"]["label"], "dx": -560, "dy": 128, "w": 420, "px": 62, "lines": 2, "hl": "946 MW", "lead": 0, "per": 0.06}],
   "sourceAt": B(94.75), "sourcePer": 0.05, "sourceY": 1500, "sourcePx": 24, "sourceW": 900, "splatColor": "#F2C300",
   "_note": "research/rev2/graphs.json dc-record-mw (Epoch observed records only, no projections); the records land on 8ths and 16ths, the 946 MW record on the beat"})
A({"id": "eq-grpo", "type": "equation", "ref": "grpo", "t0": B(97.5), "t1": B(100), "drop": B(97.5), "mode": "pencil", "cx": 540, "cy": 640, "px": 40, "maxW": 960,
   "label": {"text": "GRPO: the RL objective behind DeepSeek-R1", "at": B(97.5), "gap": 60}, "cite": {"at": B(98.75)},
   "hl": [{"from": "highlight", "at": B(99.25), "style": "circle", "ink": "#B31B1B"}], "card": {"pad": 40, "rot": -1.0, "color": "#FBF6EC"},
   "pulse": {"from": B(98.75), "to": B(99.75)}, "rows": [B(97.5), B(98), B(98.5)],
   "_note": "research/rev2/equations.json grpo (Shao et al. 2024, DeepSeekMath eq. 3), portrait-stacked form, rows drawn on beats (polisher: from hb:97.5, 1.5 beats later, so the chart before it keeps its payoff)"})
A({"id": "pile-c", "type": "screens", "t0": B(97.5), "t1": B(100), "region": {"x0": 60, "y0": 1040, "x1": 1020, "y1": 1500}, "w": 900,
   "shots": [shot("geopolitics-toms-deepseek", B(97.75), "slide"), shot("economy-guardian_nvidia_revenue_100bn", B(98.25), "slam", hl=1, crop=[330, 425, 1600, 695])],
   "push": False, "emph": [{"style": "circle", "at": B(99), "shot": 1}], "out": "cut",
   "_note": "the market side of the RL race: DeepSeek's release (Jan 2025) and Nvidia's 'golden age' (Aug 2026), whose highlight lands on 'golden years' (song 66.56-67.44)"})

# ---------------------------------------------------------------- THE LOOP AND THE SINGULARITY (hb:100 - 108)
PIECES = ["band", "pink", "black", "core", "smallO", "blue", "teal", "square", "target", "arc", "chk", "nabla", "normal", "margin", "d0", "d1", "d2", "d3", "d4", "d5", "kick"]
pop = {p: {"at": B(100 + 0.125 * (k % 14)), "style": "pop", "dur": 0.2} for k, p in enumerate(PIECES[:-1])}
pop["kick"] = {"at": 999, "style": "cut"}
A({"id": "kand-loop", "type": "kand", "t0": B(100), "t1": B(109), "layout": {"y": 400, "scale": 0.72}, "preset": "hold", "pieces": PIECES, "cues": pop,
   "moves": [
     {"move": "orbit", "pieces": ["pink", "black"], "on": "hb:101..103", "stepDeg": 45},
     {"move": "orbit", "pieces": ["pink", "black"], "on": {"from": 103.5, "to": 107.5, "every": 0.5}, "stepDeg": 45},
     {"move": "orbit", "pieces": ["core"], "around": "black", "on": {"from": 101, "to": 107.5, "every": 0.5}, "stepDeg": 45, "k": -2},
     {"move": "orbit", "pieces": ["teal"], "around": "blue", "on": {"from": 100.5, "to": 107.5, "every": 0.5}, "stepDeg": 45},
     {"move": "jump", "pieces": ["d0", "d1", "d2", "d3", "d4", "d5"], "on": ["hb:101", "hb:102", "hb:103", "hb:103.5", "hb:104", "hb:104.5", "hb:105", "hb:105.5"], "h": 70, "stagger": 0.03},
     {"move": "spin", "pieces": ["square", "chk"], "on": ["hb:102", "hb:103", "hb:104", "hb:104.5", "hb:105", "hb:105.5", "hb:106"], "deg": 90},
     {"move": "jump", "pieces": ["smallO", "target", "nabla"], "on": ["hb:101.5", "hb:102.5", "hb:103.5", "hb:104.5", "hb:105.5"], "h": 100, "stagger": 0.05},
     {"move": "river", "from": B(100.5), "to": B(104.5)},
     {"move": "artpulse", "on": "hb:100..107", "amp": 0.012, "accents": {"100": 3, "104": 2.6}}],
   "_note": "the cover's pieces (no wordmark/kicker) pop back on 8ths and dance faster behind the loop; swallowed by the hole from hb:104.5"})
A({"id": "loop", "type": "loop", "t0": B(100), "t1": B(109), "c": [540, 861], "r": 300, "build": B(100),
   "laps": {"from": B(100), "plan": [[2, 1], [1, 2], [0.5, 8]]}, "title": {"text": "AI that builds better AI", "y": 262, "at": B(100), "px": 76},
   "collapse": {"at": B(105.9), "dur": 0.92, "turns": 1.6},
   "_note": "the deck's self-improvement loop (theory_slides.explosionSlide; Splash title 'AI that builds better AI'), compressed to laps of 2 beats, 1 beat x2, 8ths x8 = hb:100-108"})
FOG_T0 = 36.38                       # polisher: just after the hole pinches shut (collapse ends edit 36.35)
A({"id": "fog", "type": "clip", "prep": "clip", "t0": FOG_T0, "t1": B(112.2), "src": "clips/bengio-fog-loss-of-control-ted2025.mp4", "in": round(10.9 + FOG_T0 - E(HB(106.5)), 3),
   "box": {"x": 0, "y": 0, "w": 1080, "h": 1920}, "srcFocus": [0.62, 0.5], "zoom": [1.0, 1.12], "zoomEase": "lin", "punch": [{"at": B(109), "z": 1.06, "dur": 0.14}, {"at": B(110), "z": 1.05, "dur": 0.12}, {"at": B(111), "z": 1.05, "dur": 0.12}],
   "grade": {"sat": 0, "contrast": 1.1, "brightness": 0.03, "gamma": 1.25, "grain": 4}, "enter": {"style": "fade", "dur": 0.7}, "theme": "dark",
   "_note": "the clearing (polisher): fades up over 36.38-37.08 right after the hole pinches shut, graded so the fog and the car's headlights read as footage (was brightness -0.16 / gamma 0.75: two grey blobs on black); b-roll from Bengio's TED2025 talk, muted, under the painted words"})
A({"id": "god-ink", "type": "stroke", "t0": B(108.5), "t1": B(110), "at": B(108.5), "dur": 0.2, "layer": "own", "width": 44, "color": "#F2EBDD",
   "points": [[120, 430], [380, 372], [700, 338], [990, 262]], "dry": 0.3, "gaps": 0.25, "out": {"at": B(109.5), "dur": 0.25},
   "_note": "polisher: a half-beat brush flick (hb:108.5) so something moves between the pinch and the first painted word"})
pile = [("frontier-anthropic_rsi_head", 100.5, "bottom", -3, 760), ("frontier-govai_head", 101, "top", 2.5, 800),
        ("capabilities-rev3-nikkei-us-china-ai-race-speeds-up-headline", 101.5, "bottom2", 2, 860), ("frontier-engadget_head", 102, "top2", -2, 820),
        ("frontier-anthropic_rdai_chart", 102.5, "bottom", -2.5, 760), ("xrisk-rev2-cnn-2026-02-11-researchers-alarm-on-way-out", 103, "top", 3, 820),
        ("frontier-tnw_headline", 103.5, "bottom2", 3, 900), ("capabilities-rev3-cnbc-model-fatigue-headline", 104, "top2", -3, 800),
        ("economy-statista_head", 104.5, "bottom", -2, 760), ("security-hl-cso-pause", 105, "top", 2, 760)]
POS = {"bottom": (1220, 1), "bottom2": (1270, 1), "top": (262, 0), "top2": (330, 0)}
for k, (sid, b, where, rot, w) in enumerate(pile):
    x = SCR[sid]; h = min(round(w * x['h'] / x['w']), 400)
    y0, anchor = POS[where]
    y = y0 if anchor == 0 else y0 - h // 2 + 60
    xx = (1080 - w) // 2 + (k % 3 - 1) * 40
    A({"id": f"sc-s{k:02d}", "type": "image", "t0": B(b), "t1": B(108.5), "src": x['path'], "fit": "cover",
       "frame": {"x": xx, "y": y, "w": w, "h": h, "rot": rot, "ring": INK, "ringW": 5, "fill": "#FBF7EE"},
       "outlet": x['outlet'].split(' (')[0], "date": dt(x['date']), "theme": "light",
       "enter": {"style": "fly", "from": "left" if k % 2 else "right", "dur": 0.22, "dist": 1300, "spin": -8 if k % 2 else 8},
       "_note": f"real screenshot {sid}: {x['text'][:80]}"})

# ---------------------------------------------------------------- "GOD, IT'S BRUTAL OUT HERE" (hb:108 - 112): painted over the fog
A({"id": "god-splat", "type": "splat", "at": B(109), "t1": B(112), "x": 900, "y": 1730, "r": 110, "color": "#FF2E88", "dir": -60, "layer": "own",
   "_note": "a beat event on 'It's' (hb:109) over the dark fog: on its own layer so the footage does not hide it"})
A({"id": "fog-credit", "type": "words", "t0": B(108.5), "t1": B(112), "x": 64, "y": 1534, "w": 900, "text": "FOOTAGE: YOSHUA BENGIO, TED2025",
   "font": {"family": "'IBM Plex Mono', monospace", "weight": 600, "size": 30}, "color": "#C9C4D6", "roll": {"mode": "words", "rate": 4, "from": B(108.5)}})
BT_UNDER = {"color": "#15131F", "k": 1.5}   # polisher: a dark ink under-stroke so cream and yellow read where they cross the pink splat
A({"id": "brutal", "type": "brushtext", "t0": "song:71.95", "t1": B(112.65), "text": "it's brutal out here", "words": "hits", "overlay": True,
   "exit": {"style": "fade", "dur": 0.12}, "drift": 0.02,
   "place": [{"x": 150, "y": 640, "size": 190, "rot": -8, "color": "yellow", "width": 30, "under": BT_UNDER},
             {"x": 87, "y": 960, "size": 256, "rot": -8, "color": "cream", "under": BT_UNDER},
             {"x": 330, "y": 1190, "size": 210, "rot": -8, "color": "yellow", "width": 34, "under": BT_UNDER, "dur": 0.3},
             {"x": 300, "y": 1450, "size": 250, "rot": -8, "color": "cream", "under": BT_UNDER, "lead": 0.03, "dur": 0.16}],
   "splat": {"dimTo": 0.45, "dimAfter": 0.25},
   "_note": "builder A: painted word by word on the sung words (song/hits.json words.brutal_out_here), the one lyric allowed on screen. Polisher: in the unshaken overlay layer (#fx) so the burst (rings, debris, the iris, the spat cards, the logo pieces) paints BEHIND the letters; 'brutal' scaled to 256 px so every glyph keeps >= 60 px of margin; ink under-strokes; the pink burst drops to 45% after landing; 'here' painted 37.94-38.10 (was 37.97-38.31) and held to 38.60, so the whole line reads for ~0.4 s past the downbeat burst"})

# ---------------------------------------------------------------- INSTRUMENTAL (hb:112 - end): the burst, the reassembly, Bengio
V_AT = E(HB(113.25))                 # edit time Bengio's audio.in (clip 3.62 s) plays at
V_IN, V_OUT = 3.62, 7.80
A({"id": "kand-re", "type": "kand", "t0": B(111.6), "t1": END, "layout": {"y": 400, "scale": 0.72}, "preset": {"name": "assemble", "from": B(112), "point": "center", "hold": 12},
   "moves": [{"move": "jump", "pieces": ["d0", "d1", "d2", "d3", "d4", "d5"], "on": ["hb:117", "hb:119", "hb:121"], "h": 60, "stagger": 0.03},
             {"move": "orbit", "pieces": ["teal"], "around": "blue", "on": "hb:114..121", "stepDeg": 45},
             {"move": "spin", "pieces": ["square"], "on": ["hb:116", "hb:120"], "deg": 90}, {"move": "spin", "pieces": ["chk"], "on": ["hb:118", "hb:122"], "deg": 90},
             {"move": "river", "from": "hb:116", "to": "hb:123"}],
   "_note": "the logo bursts out of the hole and reassembles into the cover (builder A's assemble preset from the art's middle = the hole)"})
A({"id": "kc-blue-bengio", "type": "kandclip", "item": "kand-re", "piece": "blue", "t0": B(112.75), "t1": END, "prep": "clip",
   "src": "clips/bengio-fog-loss-of-control-ted2025.mp4", "in": round(V_IN - (V_AT - E(HB(112.75))), 3), "frame": {"cx": 540, "cy": 960, "r": 124}, "oversample": 1.3,
   "srcFocus": [0.5, 0.5], "zoom": [1.0, 1.1], "grade": {"sat": 0.8, "contrast": 1.15, "grain": 0}, "blend": "screen", "screenK": 0.95,
   "_note": "the talk's own picture, in sync with his voice, inside the blue disc while it flies in and lands, playing on (silent) after his line until the kand item settles to the flat cover"})
spit = [("frontier-govai_head", [-1300, -300], -14), ("frontier-engadget_head", [1300, -500], 12), ("frontier-anthropic_rsi_head", [-1200, 700], 10), ("economy-statista_head", [1250, 800], -12)]
for k, (sid, to, spin) in enumerate(spit):
    x = SCR[sid]; w = 620; h = min(round(w * x['h'] / x['w']), 330); ox, oy = (k % 2 * 2 - 1) * 120, (k // 2 * 2 - 1) * 170   # card centre - hole centre
    A({"id": f"sc-spit{k}", "type": "image", "t0": B(112), "t1": B(113.4), "src": x['path'], "fit": "cover",
       "frame": {"x": 540 - w // 2 + ox, "y": 861 - h // 2 + oy, "w": w, "h": h, "rot": spin / 2, "ring": INK, "ringW": 5, "fill": "#FBF7EE"},
       "outlet": x['outlet'], "date": dt(x['date']), "theme": "light",
       "enter": {"style": "fly", "from": [-ox, -oy], "dist": round((ox * ox + oy * oy) ** 0.5), "dur": 0.2, "spin": spin}, "exit": {"style": "fly", "to": to, "dur": 0.5, "spin": spin},
       "_note": f"spat back out of the black hole on the burst: real screenshot {sid}"})
A({"id": "fluid", "type": "fluid", "t0": B(112), "t1": END, "item": "kand-re",
   "_note": "builder D: marbled colour and liquid edges in every shape, settling to the exact flat cover for the hold (the blue disc's fill is the footage above)"})
words = [("We", 3.76), ("are", 4.48), ("blindly", 5.12), ("driving", 6.36), ("into", 6.74), ("a", 7.22), ("fog…", 7.36)]
A({"id": "voice-bengio", "type": "voice", "t0": V_AT, "t1": round(V_AT + V_OUT - V_IN, 3), "src": "clips/bengio-fog-loss-of-control-ted2025.mp4", "at": V_AT,
   "audio": {"in": V_IN, "out": V_OUT, "fade_ms": 60}, "verified": True,
   "_note": "AUDIBLE over the instrumental (vocal-free; the song ducks under it): 'We are blindly driving into a fog' (research/long/bengio-2025.json rank 2, base.en and small.en agree; word times re-measured with small.en, clip 3.76-7.82). The sentence goes on ('despite the warnings...'), hence the trailing ellipsis."})
A({"id": "kar-bengio", "type": "karaoke", "t0": round(V_AT - 0.1, 3), "t1": B(123.5), "x": 72, "y": 255, "w": 940, "size": 60, "font": {"weight": 700},
   "roll": {"dim": 0.62}, "metaPx": 30, "metaGap": 14,
   "speech": {"in": V_IN, "at": V_AT, "words": [{"w": w, "s": s} for w, s in words]}, "name": "Yoshua Bengio", "year": "TED2025", "metaAt": round(V_AT + 0.3, 3),
   "marks": [{"phrase": "blindly driving into a fog", "style": "underline", "at": round(V_AT + (7.82 - V_IN) + 0.1, 3), "color": "#FF2E88"}],
   "exit": {"style": "fade", "dur": 0.25}, "theme": "light",
   "_note": "polisher: 60 px bold in the clear cream strip above the logo (y 255-475; the outro's paint is kept out of it), unspoken words at 0.62 (4.6:1 on the cream; was 0.3 of a 46 px mono line under blue/orange splats)"})

# ---------------------------------------------------------------- surface
A({"id": "grain", "type": "grain", "t0": 0, "t1": B(0), "opacity": 0.035, "size": 2, "hold": 3})
A({"id": "paper", "type": "paper", "t0": 0, "t1": END, "mode": "auto", "_note": "builder A's paper tooth over everything (boils on twos); gone by the final hold"})

PRELUDE_ZONES = [[60, 150, 960, 120], [60, 1610, 960, 230]]   # above the speaker stamp (y 300) and under the caption block

transitions = [
  {"id": "tr-wipe", "at": 4.7333, "type": "paintwipe", "out": ["altman"], "in": ["amodei"], "dur": 1.0, "colors": ["pink", "violet"], "ground": DARK},
  {"id": "tr-fold", "at": AMODEI_T1, "type": "fold", "out": ["amodei"], "in": ["pile-hf"], "dur": 1.25, "mode": "both", "shake": 6, "ground": DARK},
  {"id": "tr-light", "at": B(0), "type": "illuminate", "out": [], "in": ["g-cream-riff", "kand-riff"], "dur": 1.0, "flash": 0.5, "ground": False},
  {"id": "tr-zoom", "at": B(24), "type": "zoomthrough", "out": ["mlp", "eq-bp1", "eq-bp2", "eq-bp4", "eq-upd", "v-unitree", "v-unitree-credit"], "in": ["pile-a", "p-band"],
   "dur": 1.5, "focus": [905, 790], "r": 110, "ground": DARK},
  {"id": "tr-shatter", "at": B(28), "type": "shatter", "out": ["pile-a", "p-band"], "in": ["pile-b", "p-agents"], "dur": 1.5, "n": 16, "flash": 0.25, "shake": 6, "ground": DARK},
  {"id": "tr-whip", "at": HB92, "type": "whip", "mode": "spin", "dir": 1, "out": ["g-dark-verse", "pile-b", "p-agents"], "in": ["g-cream-2", "chart-dc"], "dur": 1.0, "ground": False},
  {"id": "tr-particles", "at": B(97.5), "type": "particles", "out": ["chart-dc"], "in": ["eq-grpo", "pile-c"], "dur": 1.0, "ground": CREAM},
  {"id": "tr-iris", "at": B(100), "type": "iris", "shape": "circle", "c": [540, 861], "out": ["eq-grpo", "pile-c"], "in": ["kand-loop", "loop"], "dur": 1.0, "ground": CREAM, "shake": 6},
]

edl = {
  "name": "showcase",
  "title": "Integrator showcase (rev2): the prelude, the drop and verse 1 (song 6.10-34.70), a downbeat splice, the refrain's last lines to the cover (song 63.73-80.40)",
  "_note": "Generated by edl/make_showcase.py (edit it and re-run, then prep_clips.py showcase). Edit = song - 6.10 to the splice at edit 28.60, then song - 35.132. Every module in one cut: legacy clips (prelude), text.js (word-lit captions, roll-outs, karaoke), screens.js (real screenshot piles, panels), paint.js / kandinsky.js / beatfx.js (the riff, the paint, the beat track), kandclip.js (footage inside logo pieces), netviz.js + equations.js (the MLP and backprop), charts.js (Epoch's record data centres), transitions.js / singularity.js / fluid.js (transitions, the loop, the black hole, the fluid logo).",
  "rev": 2, "fps": 30, "width": 1080, "height": 1920, "duration": END,
  "audio": {"song": "song/brutal.mp3", "songStart": SEG1[0], "note": "SPLICED: see song.segments"},
  "song": {"file": "song/brutal.mp3", "segments": [{"in_s": SEG1[0], "out_s": SEG1[1], "at": 0}, {"in_s": SEG2_IN, "out_s": SONG_END, "at": SPLICE}],
           "xfade_ms": 30, "xfade_shape": "gain", "bars": "song/bars.json", "bar_tol_ms": 70, "fade_in_s": 0.01, "fade_out_s": 0.35, "max_out_s": 80.45,
           "note": "Splice bar 8 beat 1 (hb:32, song 34.716) -> bar 23 beat 1 (hb:92, song 63.748): same bar phase, 15 bars; both cut points 16 ms before the grid beat (the attacks land 0-20 ms after it, hits-extra onset_offsets). Side A ends on the pickup 'And' (34.46-34.72) of 'And I'm so tired'; side B starts in the tail of 'upset' (62.88-63.94): a vocal is cut on both sides (verse 1 is sung continuously 28.87-50.48), so William must judge it by ear."},
  "outputs": {"song": "out/rev2/showcase-9x16.mp4", "no_song": "out/rev2/showcase-no-song-9x16.mp4"},
  "look": {"ground": DARK},
  "layout": {},
  "themes": [{"t0": 0, "t1": B(0), "theme": "dark"}, {"t0": B(0), "t1": B(16), "theme": "light"}, {"t0": B(16), "t1": HB92, "theme": "dark"},
             {"t0": HB92, "t1": B(108), "theme": "light"}, {"t0": B(108), "t1": B(112), "theme": "dark"}, {"t0": B(112), "t1": 999, "theme": "light"}],
  "finalHold": [B(124), END],
  "items": items,
  "transitions": transitions,
  "beatfx": [
    {"id": "fx-prelude", "from": 0, "to": 12.9, "pattern": "prelude", "grid": "pulse", "intensity": 0.8, "zones": PRELUDE_ZONES},
    {"id": "fx-prelude-grid", "from": "hb:-27", "to": "hb:-1.5", "pattern": "prelude", "intensity": 0.7, "zones": PRELUDE_ZONES,
     "_note": "polisher: the prelude pattern (pencil scribbles, stamps, ticks; no splats) on every prelude beat, in the strips above the stamp and under the caption"},
    {"id": "fx-riff", "from": "hb:0", "to": "hb:15.5", "pattern": "riff", "intensity": 1, "eighths": True, "layer": "paint"},
    {"id": "fx-verse", "from": "hb:16", "to": "hb:31.5", "pattern": "verse", "intensity": 0.85, "eighths": True, "layer": "paint"},
    {"id": "fx-refrain", "from": "hb:92", "to": "hb:107.5", "pattern": "refrain", "eighths": False, "layer": "paint"},
    {"id": "fx-god", "from": "hb:108", "to": "hb:111.5", "pattern": "god", "eighths": False, "layer": "paint"},
    {"id": "fx-outro", "from": "hb:112.5", "to": "hb:123.5", "pattern": "outro", "eighths": True, "layer": "paint",
     "zones": [[40, 1590, 1000, 260], [10, 560, 110, 820], [960, 600, 110, 780]], "avoid": [[40, 220, 1000, 280]],
     "_note": "polisher: the outro's splats and stamps stay out of the Bengio caption strip (y 220-500)"},
  ],
}
# the short's layout for its prelude clips (caption/stamp sizes), so the copied Altman/Amodei items set exactly as there
sh = json.load(open(EDL / 'short.json'))
edl["layout"] = json.loads(json.dumps(sh.get("layout", {})))
edl["layout"]["clipBox"] = {"x": 0, "y": 380, "w": 1080, "h": 740}   # polisher: the prelude's taller footage box (see PRELUDE)
# the splice check grid: song/bars.json (librosa, 123.05 BPM) runs ~60 ms late by bar 23; hits.json's 124-BPM regression grid
# matches the measured attacks there (research/rev2/hits-extra.json onset_offsets_ms: 0 ms at hb:32 and hb:92), so mix.py checks
# the splice against a bars.json-format copy of the hits.json grid
H = json.load(open(ROOT / 'song/hits.json'))
bh = {"_note": "written by edl/make_showcase.py from song/hits.json (beat t = 19.232 + i * 60/124; bar = every 4th beat from the drop)",
      "drop": H["drop"], "beat_s": H["beat_s"], "beats": [b["t"] for b in H["beats"]], "bars": [b["t"] for b in H["beats"] if b["i"] % 4 == 0]}
(ROOT / 'song/bars-hits.json').write_text(json.dumps(bh, indent=1) + "\n")
edl["song"]["bars"] = "song/bars-hits.json"; edl["song"]["bar_tol_ms"] = 30
p = EDL / 'showcase.json'
p.write_text(json.dumps(edl, indent=1, ensure_ascii=False) + "\n")
print('wrote', p, len(items), 'items,', len(transitions), 'transitions; duration', END, '; splice at edit', SPLICE, '; Bengio at edit', V_AT)
