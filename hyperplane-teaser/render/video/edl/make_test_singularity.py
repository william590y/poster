"""generator for edl/test-singularity.json (builder D)"""
import json, pathlib
ROOT = pathlib.Path('/home/user/hyperplane-teaser')
S = {x['id']: x for x in json.load(open(ROOT / 'research/rev2/screens.json'))['items']}
MON = 'JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC'.split()
def dt(d): y, m, dd = d.split('-'); return f"{MON[int(m)-1]} {int(dd)}, {y}"
B = lambda i: f"hb:{i}"
END = round(80.4 - 57.942, 3)
items = [
  {"id": "sg-cream-a", "type": "color", "t0": 0, "t1": B(109), "color": "#F2EBDD"},
  {"id": "sg-cream-b", "type": "color", "t0": B(112), "t1": END, "color": "#F2EBDD",
   "enterFx": {"type": "iris", "shape": "circle", "c": [540, 861], "dur": 1.0, "lead": 0, "rim": "yellow", "ground": False}},
  {"id": "sg-hole", "type": "blackhole", "t0": B(100), "t1": B(113.5), "c": [540, 861],
   "r": [[B(100), 0], [B(102), 30], [B(104), 64], [B(106), 112], [B(107.6), 160]],
   "darken": {"from": B(104), "to": B(107.7)},
   "swallow": {"from": B(104), "to": B(107.8), "items": "all", "turns": 1.15},
   "collapse": {"at": B(107.78), "dur": 0.14},
   "burst": {"at": B(112), "rings": 3, "debris": 80},
   "shakes": [{"at": B(104), "amp": 10}, {"at": B(106), "amp": 8}],
   "_note": "the singularity: opens at hb:100 as the laps reach 1 beat, swallows everything from hb:104 (8th-note laps), snaps shut on 'God,' (song 71.456 ~ hb:107.93), bursts on the instrumental's downbeat hb:112 (73.426)"},
  {"id": "paint", "type": "layer", "kind": "canvas"},
  {"id": "sg-kand", "type": "kand", "t0": 0, "t1": B(109), "layout": {"y": 400, "scale": 0.72}, "preset": "hold",
   "pieces": ["band", "pink", "black", "core", "smallO", "blue", "teal", "square", "target", "arc", "chk", "nabla", "normal", "margin", "d0", "d1", "d2", "d3", "d4", "d5", "kick"],
   "cues": {"kick": {"at": 999, "style": "cut"}},
   "moves": [
    {"move": "orbit", "pieces": ["pink", "black"], "on": "hb:80..103", "stepDeg": 45},
    {"move": "orbit", "pieces": ["core"], "around": "black", "on": "hb:80..103", "stepDeg": 45, "k": -2},
    {"move": "orbit", "pieces": ["teal"], "around": "blue", "on": {"from": 80.5, "to": 103.5}, "stepDeg": 45},
    {"move": "jump", "pieces": ["d0", "d1", "d2", "d3", "d4", "d5"], "on": ["hb:81", "hb:83", "hb:85", "hb:87", "hb:89", "hb:91", "hb:93", "hb:95", "hb:97", "hb:99", "hb:101", "hb:103"], "h": 70, "stagger": 0.03},
    {"move": "spin", "pieces": ["square", "chk"], "on": ["hb:84", "hb:88", "hb:92", "hb:96", "hb:98", "hb:100", "hb:101", "hb:102", "hb:103"], "deg": 90},
    {"move": "jump", "pieces": ["smallO", "target", "nabla"], "on": ["hb:86", "hb:90", "hb:94", "hb:97", "hb:99", "hb:101", "hb:102.5"], "h": 100, "stagger": 0.05},
    {"move": "river", "from": 0, "to": B(104)},
    {"move": "swing", "pieces": ["band"], "from": 0, "to": B(104), "amp": 3, "period": 8},
    {"move": "artpulse", "on": "hb:80..103", "amp": 0.012, "accents": {"80": 3, "84": 2, "88": 2, "92": 2, "96": 2.4, "100": 2.6}}
   ],
   "_note": "the cover's pieces (no wordmark/kicker) dancing behind the loop through the refrain; swallowed by the hole from hb:104"},
  {"id": "sg-loop", "type": "loop", "t0": 0, "t1": B(109), "c": [540, 861], "r": 300, "build": 0,
   "laps": {"from": B(80), "plan": [[8, 1], [4, 2], [2, 2], [1, 4], [0.5, 8]]},
   "title": {"text": "AI that builds better AI", "y": 262, "at": 0, "px": 80},
   "quote": {"text": "“…an ultraintelligent machine could design even better machines; there would then unquestionably be an ‘intelligence explosion’…”", "cite": "— I. J. Good, 1965", "at": B(82), "y": 1300, "step": 0.5, "w": 860},
   "collapse": {"at": B(105.9), "dur": 0.92, "turns": 1.6},
   "_note": "the deck's loop (theory_slides.explosionSlide; Splash title 'AI that builds better AI'): laps of 2 bars, 1 bar x2, 2 beats x2, 1 beat x4, 8ths x8 from hb:80 (refrain downbeat, song 57.942) to hb:108"},
]
# headline screenshots piling up on the beats, faster as the laps speed up (real screenshots, outlet + date)
pile = [
  ("frontier-anthropic_rsi_head", 88, "bottom", -3, 760), ("frontier-govai_head", 90, "top", 2.5, 820),
  ("capabilities-rev3-nikkei-us-china-ai-race-speeds-up-headline", 92, "bottom", 2, 860), ("frontier-engadget_head", 94, "top", -2, 820),
  ("frontier-rev2-guardian_techscape_sep29_headline", 96, "bottom", -2.5, 860), ("economy-statista_head", 97, "top", 3, 780),
  ("capabilities-ns-bbc", 98, "bottom", 3, 820), ("work-swe-fortune-100pct-head", 99, "top", -3, 760),
  ("frontier-anthropic_rsi_head", 100, "bottom2", 4, 700), ("capabilities-rev2-afp-malaymail-header", 100.5, "top2", -4, 820),
  ("frontier-tnw_headline", 101, "bottom2", -3, 900), ("work-swe-cbs-layoffs-head", 101.5, "top2", 3, 840),
  ("economy-fortune_hyperion_head", 102, "bottom", -2, 780), ("capabilities-ns-wired", 102.5, "top", 2, 720),
  ("frontier-rev2-wired_aug18_headline", 103, "bottom2", 4, 720), ("security-cnn-gov", 103.5, "top2", -3, 900),
]
POS = {"bottom": (1250, 1), "bottom2": (1320, 1), "top": (262, 0), "top2": (330, 0)}
for k, (sid, b, where, rot, w) in enumerate(pile):
    x = S[sid]; h = min(round(w * x['h'] / x['w']), 420)
    y0, anchor = POS[where]
    y = y0 if anchor == 0 else y0 - h // 2 + 60
    xx = (1080 - w) // 2 + (k % 3 - 1) * 40
    items.append({"id": f"sg-s{k:02d}", "type": "image", "t0": B(b), "t1": B(108.5), "src": x['path'], "fit": "cover",
      "frame": {"x": xx, "y": y, "w": w, "h": h, "rot": rot, "ring": "#15131F", "ringW": 5, "fill": "#FBF7EE"},
      "outlet": x['outlet'], "date": dt(x['date']), "theme": "light",
      "enter": {"style": "fly", "from": "left" if k % 2 else "right", "dur": 0.22, "dist": 1300, "spin": -8 if k % 2 else 8},
      "_note": f"real screenshot {sid}: {x['text'][:80]}"})
items += [
  {"id": "sg-brutal", "type": "brushtext", "t0": "song:71.95", "t1": B(112.4), "text": "it's brutal out here", "words": "hits",
   "_note": "builder A's brushtext over the dark: painted on the sung words (song/hits.json)"},
  {"id": "sg-kand-b", "type": "kand", "t0": B(111.6), "t1": END, "layout": {"y": 400, "scale": 0.72},
   "preset": {"name": "assemble", "from": B(112), "point": "center", "hold": 12},
   "moves": [
    {"move": "jump", "pieces": ["d0", "d1", "d2", "d3", "d4", "d5"], "on": ["hb:117", "hb:119", "hb:121"], "h": 60, "stagger": 0.03},
    {"move": "orbit", "pieces": ["teal"], "around": "blue", "on": "hb:114..121", "stepDeg": 45},
    {"move": "spin", "pieces": ["square"], "on": ["hb:116", "hb:120"], "deg": 90},
    {"move": "spin", "pieces": ["chk"], "on": ["hb:118", "hb:122"], "deg": 90},
    {"move": "river", "from": "hb:116", "to": "hb:123"}
   ], "_note": "the logo bursts out of the hole (preset assemble from the art's middle = the hole) and reassembles into the cover"},
  {"id": "sg-fluid", "type": "fluid", "t0": B(112), "t1": END, "item": "sg-kand-b",
   "_note": "fluid colour inside every shape + liquid edges, settling to the exact flat cover for the final hold"},
  {"id": "sg-grain", "type": "paper", "t0": 0, "t1": END, "mode": "auto"},
]
edl = {"name": "test-singularity",
  "title": "Builder D: the self-improvement loop accelerating through the refrain, the black hole, 'it's brutal out here' over the dark, the burst and the fluid logo settling to the cover (song 57.942-80.4)",
  "_note": "Edit time = song - 57.942 (hb:80 = 0 = the refrain's downbeat). Generated by edl/make_test_singularity.py. prep_clips.py test-singularity first. Render: python3 render/video/render.py beats test-singularity --from 0 --to 22.46; check/coverdiff.py test-singularity.",
  "fps": 30, "width": 1080, "height": 1920, "duration": END,
  "audio": {"song": "song/brutal.mp3", "songStart": 57.942},
  "look": {"ground": "#0E0D12"},
  "themes": [{"t0": 0, "t1": B(108), "theme": "light"}, {"t0": B(108), "t1": B(112), "theme": "dark"}, {"t0": B(112), "t1": 99, "theme": "light"}],
  "finalHold": [B(124), END],
  "items": items,
  "beatfx": [
    {"id": "sg-refrain-fx", "from": "hb:80", "to": "hb:99.5", "pattern": "refrain", "eighths": False},
    {"id": "sg-outro-fx", "from": "hb:113", "to": "hb:123.5", "pattern": "outro", "eighths": True}
  ]}
p = ROOT / 'render/video/edl/test-singularity.json'
p.write_text(json.dumps(edl, indent=1, ensure_ascii=False) + "\n"); print('wrote', p, len(items), 'items')
