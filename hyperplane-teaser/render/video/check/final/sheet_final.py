#!/usr/bin/env python3
"""Contact sheet decoded from a final rev2 MP4. Usage: sheet2.py <long2|short2> <mp4> <out.png>
One frame per second plus key frames (drop, splice, the painted words, the burst, the last frame); each tile labelled with
edit time, frame, song time and the section."""
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
extra = {f_at(TR("hb:0")) - 1: "flash", f_at(TR("hb:0")): "DROP"}
for w in words:
    if w["w"] != "God,":
        extra[f_at(TR(f"song:{w['s']}")) + 3] = f"'{w['w']}' +3f"
extra[f_at(TR("hb:112"))] = "burst"
extra[f_at(TR("hb:124"))] = "cover hold"
extra[N - 1] = "LAST"
if len(segs) > 1:
    c = segs[1]["at"]
    extra[f_at(c) - 1] = "splice -1f"; extra[f_at(c)] = "splice"
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
