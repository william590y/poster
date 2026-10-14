#!/usr/bin/env python3
"""Contact sheet decoded from a final rev3 MP4. Usage: sheet_final3.py <long3|short3> <mp4> <out.png>
One frame per second plus key frames (the frame before the drop, the drop, each riff landing, the Musk line, the GRPO gradient,
the Bostrom words, the painted words, the burst, the cover hold, the last frame); each tile labelled with edit time, frame,
song time and the section."""
import sys, json, math, subprocess
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path("/home/user/hyperplane-teaser")
sys.path.insert(0, str(ROOT / "render/video"))
from timeref import TimeRef  # noqa: E402
cut, mp4, out = sys.argv[1], sys.argv[2], sys.argv[3]
edl = json.loads((ROOT / f"render/video/edl/{cut}.json").read_text())
TR = TimeRef(edl)
segs = edl["song"]["segments"]
FPS, N = 30, int(round(edl["duration"] * 30))
TW, TH = 240, 427
SECT = [("prelude", -99, 19.232), ("riff", 19.232, 26.974), ("verse 1", 26.974, 42.458), ("chorus", 42.458, 57.942),
        ("refrain", 57.942, 71.490), ("God bar", 71.490, 73.426), ("instrumental", 73.426, 79.232), ("cover hold", 79.232, 999)]


def song(e):
    for sg in reversed(segs):
        if e >= sg["at"] - 1e-9:
            return e - sg["at"] + sg["in_s"]


def f_at(t):
    return int(math.ceil(t * FPS - 1e-9))


words = json.loads((ROOT / "song/hits.json").read_text())["words"]["brutal_out_here"]
extra = {f_at(TR("hb:0")) - 1: "pre-drop", f_at(TR("hb:0")): "DROP"}
# the riff's landings (rev3_intro BUILD cues): plane/pink/black hb:0, orange hb:.5, core 1, blue 2, teal 3, square 4, target 4.5,
# arc 5, wordmark 8, kicker 10
for hb, nm in ((0.5, "orange"), (1, "core"), (2, "blue"), (3, "teal"), (4, "square"), (4.5, "target"), (5, "arc"), (6, "checker"),
               (7, "nabla"), (8, "WORDMARK"), (10, "kicker"), (12, "hold"), (15, "hold")):
    if hb == 15 and len(segs) > 1:
        continue
    extra.setdefault(f_at(TR(f"hb:{hb:g}")), f"riff {nm}")
for w in words:
    if w["w"] != "God,":
        extra[f_at(TR(f"song:{w['s']}")) + 3] = f"'{w['w']}' +3f"
extra[f_at(TR("hb:112"))] = "burst"
extra[f_at(TR("hb:124"))] = "cover hold"
extra[N - 1] = "LAST"
if len(segs) > 1:
    c = segs[1]["at"]
    extra[f_at(c) - 1] = "splice -1f"; extra[f_at(c)] = "splice"
# karaoke words: Musk (long) and Bostrom (both): a frame 2 after each lit word's onset (first, middle, last words)
for it in edl["items"]:
    if it.get("type") == "karaoke" and it["id"] in ("kar-musk", "kar-bostrom"):
        sp = it["speech"]
        base = TR(sp["at"])
        for k, w in enumerate(sp["words"]):
            if it["id"] == "kar-bostrom" or w["w"].strip(".,\u2026").lower() in ("with", "summoning", "demon"):
                extra.setdefault(f_at(base + w["s"] - sp["in"]) + 2, f"{it['id'][4:]} {w['w'].strip(chr(8230))[:9]}")
# the GRPO gradient (chorus hb:72-80)
if any(i["id"] == "eq-grpo" for i in edl["items"]):
    for hb in (72, 73, 74, 75, 76, 77, 78, 79.5):
        extra.setdefault(f_at(TR(f"hb:{hb:g}")), f"GRPO hb:{hb:g}")
frames = sorted(set(min(N - 1, s * FPS) for s in range(0, int(edl["duration"]) + 1)) | set(extra))
sel = "+".join(f"eq(n\\,{i})" for i in frames)
r = subprocess.run(["ffmpeg", "-v", "error", "-i", mp4, "-vf", f"select='{sel}',scale={TW}:{TH}:flags=lanczos", "-vsync", "0",
                    "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True)
raw = np.frombuffer(r.stdout, np.uint8).reshape(-1, TH, TW, 3)
assert len(raw) == len(frames), (len(raw), len(frames))
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", 13)
    big = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", 18)
except Exception:
    font = big = ImageFont.load_default()
cols, pad, lab = 10, 8, 34
rows = -(-len(frames) // cols)
sheet = Image.new("RGB", (cols * (TW + pad) + pad, rows * (TH + lab + pad) + pad + 40), (36, 36, 40))
d = ImageDraw.Draw(sheet)
d.text((pad, 10), f"{Path(mp4).name}: decoded from the final file ({N} frames). Label: edit m:ss.ss  frame / song s  section  [key]",
       fill=(235, 235, 235), font=big)
for k, (fi, im) in enumerate(zip(frames, raw)):
    x = pad + (k % cols) * (TW + pad)
    y = 40 + pad + (k // cols) * (TH + lab + pad)
    sheet.paste(Image.fromarray(im), (x, y + lab))
    t = fi / FPS
    s = song(t)
    sec = next(n for n, a, b in SECT if a - 1e-6 <= s < b)
    col = (255, 210, 60) if fi in extra else (255, 110, 110)
    d.text((x, y), f"{int(t // 60)}:{t % 60:05.2f} f{fi}", fill=col, font=font)
    d.text((x, y + 16), f"s{s:.2f} {sec} {extra.get(fi, '')}"[:34], fill=(205, 205, 205), font=font)
sheet.save(out)
print(f"wrote {out} ({len(frames)} frames, {sheet.size[0]}x{sheet.size[1]})")
