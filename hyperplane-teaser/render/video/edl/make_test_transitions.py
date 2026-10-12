"""generator for edl/test-transitions.json (builder D)"""
import json, pathlib
ROOT = pathlib.Path('/home/user/hyperplane-teaser')
S = {x['id']: x for x in json.load(open(ROOT / 'research/rev2/screens.json'))['items']}
MON = 'JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC'.split()
def dt(d): y, m, dd = d.split('-'); return f"{MON[int(m)-1]} {int(dd)}, {y}"
items = [
  {"id": "d-ground", "type": "color", "t0": 0, "t1": 7.742, "color": "#F2EBDD"},
  {"id": "paint", "type": "layer", "kind": "canvas"},
]
def shot_img(iid, sid, t0, t1, y=None, w=960, rot=0, extra=None):
    x = S[sid]; h = round(w * x['h'] / x['w'])
    if h > 1000: h = 1000
    y = y if y is not None else round(930 - h / 2)
    it = {"id": iid, "type": "image", "t0": t0, "t1": t1, "src": x['path'], "fit": "cover",
          "frame": {"x": (1080 - w) // 2, "y": y, "w": w, "h": h, "rot": rot, "ring": "#15131F", "ringW": 5, "fill": "#FBF7EE"},
          "outlet": x['outlet'], "date": dt(x['date']), "theme": "light", "zoom": [1.0, 1.04],
          "_note": f"real screenshot {sid}: {x['text'][:90]}"}
    if extra: it.update(extra)
    items.append(it); return it
def shot_clip(iid, src, inp, t0, t1, frame, extra=None):
    it = {"id": iid, "type": "clip", "prep": "clip", "t0": t0, "t1": t1, "src": src, "in": inp, "frame": frame,
          "box": {"x": frame["x"], "y": frame["y"], "w": frame["w"], "h": frame["h"]}, "zoom": [1.0, 1.06], "mute": True,
          "grade": {"sat": 0.9, "contrast": 1.08, "grain": 4}, "theme": "light"}
    if extra: it.update(extra)
    items.append(it); return it
def shot_words(iid, text, meta, t0, t1, y, size=92, color="#15131F", marks=None):
    items.append({"id": iid, "type": "words", "t0": t0, "t1": t1, "x": 80, "y": y, "w": 920, "text": text, "color": color,
                  "font": {"family": "'Newsreader', serif", "weight": 600, "size": size}, "roll": {"mode": "words", "per": 0.06, "entry": "pop"},
                  "marks": marks or [], "theme": "light"})
    items.append({"id": iid + "-meta", "type": "words", "t0": t0, "t1": t1, "x": 80, "y": y - 70, "w": 920, "text": meta, "color": "#B31B1B",
                  "font": {"family": "'IBM Plex Mono', monospace", "weight": 600, "size": 34}, "roll": {"mode": "words", "rate": 4}, "theme": "light"})
B = lambda i: f"hb:{i}"
# shots (song 42.458 -> 50.2, hb:48 -> hb:64), one change on (nearly) every beat
shot_img("d-a", "capabilities-ns-bbc", 0, B(49), rot=-2)
shot_clip("d-b", "clips/hinton-60min-2023.mp4", 40.0, B(49), B(50), {"x": 60, "y": 600, "w": 960, "h": 640, "ring": "#15131F", "ringW": 8})
shot_img("d-c", "capabilities-deepmind-imo-gold", B(50), B(51), rot=2)
shot_words("d-d", "officially achieves gold-medal standard at the International Mathematical Olympiad", "GOOGLE DEEPMIND · JUL 21, 2025", B(51), B(53), 760,
           marks=[{"phrase": "gold-medal standard", "style": "marker", "color": "#F2C300", "at": B(52.25)}])
shot_img("d-e", "work-acad-404-arxiv-ban", B(53), B(55), rot=-3)
shot_clip("d-f", "clips/bostrom-ted-2015-full.mp4", 120.0, B(55), B(56), {"x": 60, "y": 620, "w": 960, "h": 540, "ring": "#15131F", "ringW": 8})
shot_img("d-g", "work-acad-nature-iclr-ai-reviews", B(56), B(57), rot=1.5)
shot_img("d-h", "work-robots-engadget-head", B(57), B(58), rot=-2)
shot_clip("d-i", "clips/bostrom-ted-2015-full.mp4", 40.0, B(58), B(59), {"x": 140, "y": 560, "w": 800, "h": 800, "ring": "#15131F", "ringW": 8})
shot_img("d-j", "work-robots-electrek-head", B(59), B(60), rot=2.5)
shot_words("d-k", "\u201cThe AI agents are spiraling out of control\u201d", "THE GUARDIAN · SEP 29, 2026", B(60), B(62), 820,
           marks=[{"phrase": "spiraling out of control", "style": "underline", "color": "#B31B1B", "at": B(61)}])
shot_img("d-l", "geopolitics-ukraine-drones", B(62), B(63), rot=-1.5)
shot_img("d-o", "work-robots-bgr-head", B(63), 7.742, rot=-2)
items.append({"id": "d-grain", "type": "paper", "t0": 0, "t1": 7.742, "mode": "light"})
# camera hits on the beats that fall inside a hold (translation only: camera zoom is history-dependent in Chromium)
for it in items:
    if it["id"] == "d-d": it["shakes"] = [{"at": B(52), "amp": 7}, {"at": B(52.5), "amp": 4}]
    if it["id"] == "d-e": it["shakes"] = [{"at": B(54), "amp": 7}, {"at": B(53.5), "amp": 4}]
    if it["id"] == "d-k": it["shakes"] = [{"at": B(61), "amp": 7}, {"at": B(61.5), "amp": 4}]
T = [
  {"at": B(48), "type": "iris", "in": ["d-a"], "dur": 0.75, "shape": "circle", "c": [540, 930], "shake": 5},
  {"at": B(49), "type": "zoomthrough", "out": ["d-a"], "in": ["d-b"], "dur": 1.0, "focus": [700, 930], "r": 110},
  {"at": B(50), "type": "shatter", "out": ["d-b"], "in": ["d-c"], "dur": 1.25, "n": 14, "flash": 0.25, "shake": 6},
  {"at": B(51), "type": "whip", "out": ["d-c"], "in": ["d-d", "d-d-meta"], "dur": 0.8, "mode": "pan", "dir": 1},
  {"at": B(53), "type": "fold", "out": ["d-d", "d-d-meta"], "in": ["d-e"], "dur": 1.0, "mode": "both", "shake": 7},
  {"at": B(55), "type": "particles", "out": ["d-e"], "in": ["d-f"], "dur": 1.5},
  {"at": B(56), "type": "illuminate", "out": ["d-f"], "in": ["d-g"], "dur": 1.0},
  {"at": B(57), "type": "paintwipe", "out": ["d-g"], "in": ["d-h"], "dur": 1.0, "colors": ["teal", "blue"], "shake": 6},
  {"at": B(58), "type": "iris", "out": ["d-h"], "in": ["d-i"], "dur": 0.8, "shape": "square", "c": [540, 960]},
  {"at": B(59), "type": "pageturn", "out": ["d-i"], "in": ["d-j"], "dur": 1.0},
  {"at": B(60), "type": "whip", "out": ["d-j"], "in": ["d-k", "d-k-meta"], "dur": 0.8, "mode": "spin", "dir": -1},
  {"at": B(62), "type": "iris", "out": ["d-k", "d-k-meta"], "in": ["d-l"], "dur": 0.9, "shape": "nabla", "c": [540, 900], "shake": 7},
  {"at": B(63), "type": "paintwipe", "out": ["d-l"], "in": ["d-o"], "dur": 1.0, "style": "matte", "colors": ["pink", "orange"]},
]
for k, tr in enumerate(T): tr["id"] = f"tr{k:02d}-{tr['type']}"
edl = {"name": "test-transitions",
  "title": "Builder D: beat-locked transitions (song 42.458-50.2, chorus, hb:48-64): a transition on (nearly) every beat between real screenshots, b-roll panels and text",
  "_note": "Edit time = song - 42.458 (hb:48 = 0, hb:64 = song 50.200). Generated by edl/make_test_transitions.py. Every type once or twice: iris (circle, square, nabla), zoomthrough, shatter, whip (pan, spin), fold (both, in), particles, illuminate, paintwipe (cover, matte), pageturn. Run prep_clips.py test-transitions first. Render: python3 render/video/render.py beats test-transitions --from 0 --to 7.74 --eighths",
  "fps": 30, "width": 1080, "height": 1920, "duration": 7.742,
  "audio": {"song": "song/brutal.mp3", "songStart": 42.458},
  "look": {"ground": "#F2EBDD"},
  "themes": [{"t0": 0, "t1": 99, "theme": "light"}],
  "items": items, "transitions": T}
p = ROOT / 'render/video/edl/test-transitions.json'
p.write_text(json.dumps(edl, indent=1, ensure_ascii=False) + "\n"); print('wrote', p, len(items), 'items', len(T), 'transitions')
