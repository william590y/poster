"""Beat check: is something visually striking happening on every beat? (BUILD.md REVISION 2)

  python3 render/video/check/beatcheck.py long --render [--from 0 --to 12] [--eighths]
  python3 render/video/check/beatcheck.py long --video out/long-silent.mp4 [--video-start 0] [--from S --to S]

For every beat of song/hits.json (the prelude pulse included: negative beats) that the cut plays inside the range:
  - change across the beat: frames 2 before and 2 after the beat's first frame (fb = ceil(t * fps)), compared at 270x480 grey:
      mad   mean absolute difference (0..255)
      edge  share of pixels whose Sobel edge map flips (0..1): catches a change of shape where the colours barely move
      local the largest mean |diff| over a 4 x 8 grid of tiles (270 x 240 px each): a small but sharp event (a word, an
            equation, a splat) counts even when the frame as a whole barely changes
  - scheduled: the schedule marks the page declares within 1.5 frames of the beat (item in, cam hit/punch/spin, flash, kick,
    word, highlight, fx:<name>, logo cue/pulse...; modules add their own with HP.mark / item.mark)
  - weak: mad < --weak-mad (6) and edge < --weak-edge (0.04) and local < --weak-local (24); a bar downbeat (beat % 4 == 0)
    is held to twice that. Calibration (test EDLs): a card drop mad 11, a bar splat 13.5 (strong); a lone 3 % camera punch on a
    flat frame mad 1-2 (weak); thresholds are tunable per run
Dead stretches: runs of consecutive-frame mad < --dead-mad (0.6, after a light blur so grain does not count) longer than
--dead-frames (6). Writes check/out/<edl>-beatcheck[-from-to].json and .png (a timeline: per-frame change, beats coloured
green ok / orange weak but scheduled / red weak and unscheduled, downbeats tall, dead stretches shaded).
--render draws the frames in the page (about 0.1 s a frame: use ranges); --video reads a rendered mp4 instead.
"""
import sys, json, math, argparse, pathlib
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import page, grab_render, grab_video, OUT, load_edl     # noqa: E402


def tile_max(D, ty=8, tx=4):
    """largest mean |diff| over a 4 x 8 grid of tiles (67 x 60 px at analysis size = 270 x 240 px of the frame)"""
    h, w = D.shape; hh, ww = h // ty, w // tx
    return float(D[:hh * ty, :ww * tx].reshape(ty, hh, tx, ww).mean(axis=(1, 3)).max())


def edges(g):
    m = np.hypot(ndi.sobel(g, 0), ndi.sobel(g, 1))
    return m > 60.0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("edl")
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--render", action="store_true"); src.add_argument("--video")
    ap.add_argument("--video-start", type=float, default=0.0, help="edit time of the video's first frame (render.py --from)")
    ap.add_argument("--from", dest="t_from", type=float, default=0.0); ap.add_argument("--to", dest="t_to", type=float)
    ap.add_argument("--eighths", action="store_true", help="also check the 8th notes between beats")
    ap.add_argument("--weak-mad", type=float, default=6.0); ap.add_argument("--weak-edge", type=float, default=0.04)
    ap.add_argument("--weak-local", type=float, default=24.0, help="strongest tile change below which a beat counts as weak")
    ap.add_argument("--dead-mad", type=float, default=0.6); ap.add_argument("--dead-frames", type=int, default=6)
    ap.add_argument("--out")
    a = ap.parse_args()
    edl = load_edl(a.edl)
    with page(a.edl, quiet=True) as pg:
        fps = pg.evaluate("HP.FPS"); dur = pg.evaluate("window.DURATION")
        t1 = min(a.t_to if a.t_to is not None else dur, dur); t0 = max(0.0, a.t_from)
        beats = pg.evaluate("([s, a, b]) => window.__beats(s, a, b)", [0.5 if a.eighths else 1, t0, t1])
        sched = pg.evaluate("window.__sched()")
        hits_src = pg.evaluate("window.__hits.src")
        F0, F1 = int(math.floor(t0 * fps + 0.5)), int(math.floor(t1 * fps + 0.5))
        need = set(range(max(0, F0 - 2), min(F1 + 3, int(round(dur * fps)))))
        print(f"{a.edl}: {len(beats)} beats in edit {t0:.2f}-{t1:.2f} ({hits_src}); grabbing {len(need)} frames", flush=True)
        if a.render: G = grab_render(pg, need, fps)
    if a.video: G = grab_video(a.video, need, fps, a.video_start)
    fs = sorted(G)
    blur = {f: ndi.gaussian_filter(G[f], 1.2) for f in fs}
    d = {f: float(np.abs(blur[f] - blur[f - 1]).mean()) for f in fs if f - 1 in blur}
    E = {}
    rows = []
    for b in beats:
        fb = math.ceil(b["t"] * fps - 1e-6); pre, post = fb - 2, fb + 2
        if pre not in G or post not in G: continue
        D = np.abs(G[post] - G[pre]); mad = float(D.mean()); loc = tile_max(D)
        for f in (pre, post):
            if f not in E: E[f] = edges(G[f])
        edge = float((E[pre] ^ E[post]).mean())
        whole = abs(b["i"] - round(b["i"])) < 1e-6
        bar = whole and int(round(b["i"])) % 4 == 0
        k = 2.0 if bar else 1.0
        near = [s for s in sched if abs(s["t"] - b["t"]) <= 1.5 / fps]
        weak = mad < a.weak_mad * k and edge < a.weak_edge * k and loc < a.weak_local * k
        rows.append({"i": b["i"], "t": b["t"], "song": b["song"], "section": b["section"], "flags": b["flags"], "frame": fb, "bar": bar,
                     "mad": round(mad, 2), "edge": round(edge, 4), "local": round(loc, 1), "weak": weak,
                     "scheduled": sorted({f"{s['id']}:{s['what']}" for s in near})})
    # dead stretches
    dead, run = [], []
    for f in fs:
        if f in d and d[f] < a.dead_mad and F0 <= f < F1: run.append(f)
        else:
            if len(run) > a.dead_frames: dead.append(run)
            run = []
    if len(run) > a.dead_frames: dead.append(run)
    dead = [{"t0": round((r[0] - 1) / fps, 3), "t1": round(r[-1] / fps, 3), "frames": len(r) + 1} for r in dead]
    weak = [r for r in rows if r["weak"]]
    summ = {"beats": len(rows), "weak": len(weak), "weak_unscheduled": sum(1 for r in weak if not r["scheduled"]),
            "unscheduled": sum(1 for r in rows if not r["scheduled"]), "dead_stretches": len(dead),
            "dead_frames": sum(x["frames"] for x in dead), "median_mad": round(float(np.median([r["mad"] for r in rows])), 2) if rows else None}
    rep = {"edl": a.edl, "range": [t0, t1], "fps": fps, "source": a.video or "render", "hits": hits_src,
           "thresholds": {"weak_mad": a.weak_mad, "weak_edge": a.weak_edge, "weak_local": a.weak_local, "bar_factor": 2.0, "dead_mad": a.dead_mad, "dead_frames": a.dead_frames},
           "summary": summ, "beats": rows, "dead": dead,
           "frame_change": {str(f): round(v, 2) for f, v in d.items() if F0 <= f < F1}}
    OUT.mkdir(parents=True, exist_ok=True)
    stem = a.out or str(OUT / (f"{a.edl}-beatcheck" + ("" if (t0 == 0 and t1 == dur) else f"-{t0:.2f}-{t1:.2f}")))
    pathlib.Path(stem + ".json").write_text(json.dumps(rep, indent=1))
    timeline(rep, stem + ".png", F0, F1, d, edl)
    print(f"weak beats: {summ['weak']}/{summ['beats']} ({summ['weak_unscheduled']} with nothing scheduled); "
          f"dead stretches: {summ['dead_stretches']} ({summ['dead_frames']} frames); median change on a beat {summ['median_mad']}")
    for r in weak:
        print(f"  WEAK hb:{r['i']:g} edit {r['t']:.3f} song {r['song']:.3f} {r['section']}{' BAR' if r['bar'] else ''}: mad {r['mad']} edge {r['edge']} local {r['local']} "
              f"scheduled {r['scheduled'] or '-'}")
    for x in dead: print(f"  DEAD edit {x['t0']:.3f}-{x['t1']:.3f} ({x['frames']} frames)")
    print(f"wrote {stem}.json, {stem}.png")


def timeline(rep, path, F0, F1, d, edl):
    n = max(1, F1 - F0); W = int(min(2400, max(1200, n * 3))); H = 360; L, R, T, B = 60, 20, 40, 60
    im = Image.new("RGB", (W, H), (24, 24, 28)); g = ImageDraw.Draw(im)
    try: font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 12)
    except Exception: font = ImageFont.load_default()
    fps = rep["fps"]
    X = lambda t: L + (t * fps - F0) / n * (W - L - R)
    top = max([10.0] + list(d.values()) + [r["mad"] for r in rep["beats"]])
    Y = lambda v: H - B - math.sqrt(min(v, top) / top) * (H - T - B)   # sqrt scale: small beat changes stay visible next to cuts
    for x in rep["dead"]: g.rectangle([X(x["t0"]), T, X(x["t1"]), H - B], fill=(90, 20, 20))
    g.line([L, H - B, W - R, H - B], fill=(120, 120, 120))
    pts = [(X(f / fps), Y(v)) for f, v in sorted(d.items()) if F0 <= f < F1]
    if len(pts) > 1: g.line(pts, fill=(140, 170, 255), width=1)
    for r in rep["beats"]:
        x = X(r["t"]); col = (60, 200, 90) if not r["weak"] else ((255, 160, 40) if r["scheduled"] else (255, 50, 50))
        y0 = T if r["bar"] else T + 30
        g.line([x, y0, x, H - B], fill=col, width=3 if r["bar"] else 1)
        g.ellipse([x - 3, Y(r["mad"]) - 3, x + 3, Y(r["mad"]) + 3], fill=col)
        if r["scheduled"]: g.rectangle([x - 2, H - B + 4, x + 2, H - B + 10], fill=(200, 200, 200))
        if r["bar"]: g.text((x + 3, T - 14), f"{r['i']:g}", fill=(230, 230, 230), font=font)
    sec = None
    for r in rep["beats"]:
        if r["section"] != sec: sec = r["section"]; g.text((X(r["t"]) + 2, H - B + 14), sec, fill=(255, 210, 60), font=font)
    t0, t1 = rep["range"]
    for k in range(int(math.ceil(t0)), int(t1) + 1):
        g.line([X(k), H - B, X(k), H - B + 3], fill=(150, 150, 150)); g.text((X(k) - 6, H - 18), str(k), fill=(150, 150, 150), font=font)
    s = rep["summary"]
    g.text((L, 8), f"{rep['edl']} beatcheck  edit {t0:.2f}-{t1:.2f}  beats {s['beats']}  weak {s['weak']} (unscheduled {s['weak_unscheduled']})  "
                   f"dead {s['dead_frames']} frames   (sqrt scale) blue = frame-to-frame change, dots = change across each beat; green ok, orange weak+scheduled, red weak+nothing scheduled; grey ticks = scheduled",
           fill=(230, 230, 230), font=font)
    im.save(path)


if __name__ == "__main__":
    main()
