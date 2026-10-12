#!/usr/bin/env python3
"""Painted words in the FINAL video, measured against the engine's isolated brushtext render of the same frames.
Usage: words3.py <cut> <final.mp4> <iso.mp4> <iso_first_frame>
iso.mp4 = render.py video of an EDL holding only the cut's brushtext item on a flat dark ground, same frame grid.
Per frame f and word k: P = pixels of word k's paint colour (yellow / cream) inside word k's band in the iso frame f;
final_match = the pixels of P where the final frame f shows the same colour (mean |diff| < 40). The brushtext is an overlay
above everything but the flash layer, so painted pixels are the paint in both renders; background never counts unless it
happens to match the paint exactly under the stroke. first = the first frame with >= 150 matched px."""
import sys, json, math, subprocess
from pathlib import Path
import numpy as np

ROOT = Path("/home/user/hyperplane-teaser")
FPS, W, H = 30, 1080, 1920
cut, final, iso, off = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
edl = json.loads((ROOT / f"render/video/edl/{cut}.json").read_text())
segs = edl["song"]["segments"]
hits = json.loads((ROOT / "song/hits.json").read_text())["words"]["brutal_out_here"]


def s2e(s):
    for sg in segs:
        if sg["in_s"] - 1e-9 <= s <= sg["out_s"] + 1e-9:
            return s - sg["in_s"] + sg["at"]


bt = next(it for it in edl["items"] if it.get("type") == "brushtext" and it.get("enabled", True))
words = bt["text"].split()
sung = [h for h in hits if h["w"].lower().strip(",") != "god"]
place = bt["place"]
th = math.radians(place[0].get("rot", -8)); sn, cs = math.sin(th), math.cos(th)
yb = [-p["x"] * sn + p["y"] * cs for p in place]
xb = [p["x"] * cs + p["y"] * sn for p in place]
bands = []
for k, p in enumerate(place):
    top, bot = yb[k] - 0.98 * p["size"], yb[k] + 0.32 * p["size"]
    if k > 0:
        top = max(top, (yb[k - 1] + 0.32 * place[k - 1]["size"] + yb[k] - 0.98 * p["size"]) / 2)
    if k + 1 < len(place):
        bot = min(bot, (yb[k] + 0.32 * p["size"] + yb[k + 1] - 0.98 * place[k + 1]["size"]) / 2)
    bands.append((top, bot, xb[k] - 60))
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
YR, XR = -xx * sn + yy * cs, xx * cs + yy * sn
masks = [(YR >= a) & (YR < b) & (XR >= c) for a, b, c in bands]


def frames(p, f0, f1):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-vf", f"select='between(n\\,{f0}\\,{f1})'", "-vsync", "0",
                        "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
    a = np.frombuffer(r.stdout, np.uint8).reshape(-1, H, W, 3)
    assert len(a) == f1 - f0 + 1, (p, len(a), f1 - f0 + 1)
    return a


n_iso = int(subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames",
                            "-of", "csv=p=0", iso], capture_output=True, text=True).stdout.strip())
F0, F1 = off, off + n_iso - 1
A = frames(iso, 0, n_iso - 1)
B = frames(final, F0, F1)
rows = {k: [] for k in range(len(words))}
for j in range(n_iso):
    a = A[j].astype(np.int16); b = B[j].astype(np.int16)
    R, G, Bc = a[..., 0], a[..., 1], a[..., 2]
    yel = (R > 190) & (G > 150) & (G < 230) & (Bc < 90)
    cre = (R > 215) & (G > 205) & (Bc > 185) & (np.abs(R - G) < 25)
    same = np.abs(a - b).mean(axis=2) < 40
    for k in range(len(words)):
        P = (yel if place[k].get("color") == "yellow" else cre) & masks[k]
        rows[k].append((F0 + j, int(P.sum()), int((P & same).sum())))
res = []
for k, w in enumerate(words):
    on = s2e(sung[k]["s"])
    fi = next((f for f, n, m in rows[k] if n >= 150), None)
    ff = next((f for f, n, m in rows[k] if m >= 150), None)
    pk = max(n for f, n, m in rows[k])
    half = next((f for f, n, m in rows[k] if m >= 0.5 * pk), None)
    d = lambda f: None if f is None else round((f / FPS - on) * 1000, 1)
    win = [(f, n, m) for f, n, m in rows[k] if fi is not None and fi - 2 <= f <= fi + 6]
    res.append({"word": w, "sung_song": sung[k]["s"], "sung_edit": round(on, 4), "lead": place[k].get("lead", bt.get("lead", 0)),
                "iso_first": fi, "iso_first_ms": d(fi), "final_first": ff, "final_first_ms": d(ff),
                "final_first_frames": None if ff is None else round((ff / FPS - on) * FPS, 2), "final_half": half, "final_half_ms": d(half),
                "frames(f, iso px, final matched px)": win})
out = {"cut": cut, "final": final, "iso": iso, "frames": [F0, F1], "words": res}
(ROOT / "render/video/check/out").joinpath(f"{cut}-words-final.json").write_text(json.dumps(out, indent=1))
for r in res:
    print(f'{r["word"]:7s} sung {r["sung_song"]:.3f} (edit {r["sung_edit"]:.3f}) lead {r["lead"]}: iso first f{r["iso_first"]} {r["iso_first_ms"]:+.1f} ms;'
          f' FINAL first f{r["final_first"]} {r["final_first_ms"]:+.1f} ms = {r["final_first_frames"]:+.2f} frames; half f{r["final_half"]} {r["final_half_ms"]:+.1f} ms')
    print("        ", r["frames(f, iso px, final matched px)"])
