"""Engine regression: render lossless stills of an EDL at fixed frames, then compare a later render against them.

  python3 render/video/check/regress.py snap long DIR [--n 20] [--frames 0,57,...]
      Renders frame i at t = i/fps (PNG) into DIR/<edl>/<i>.png and DIR/<edl>/frames.json.
  python3 render/video/check/regress.py compare long DIR [--tol 1.0] [--save-diff]
  python3 render/video/check/regress.py det test-paint [--n 20]
      Determinism: renders the frames in order in one page and in reverse order in a fresh page; any difference means
      render(t) depends on something other than t (state carried between frames, Math.random, wall-clock, an unawaited load).
      Re-renders the same frames and prints the mean absolute difference per frame (0..255 scale).
      Exit status 1 if any frame is at or above --tol (default 1.0, i.e. 1/255).

Use it around any engine change that must not alter existing EDLs (builders: run it on long + short before handing in).
Snapshots contain clip frames: keep DIR outside the repo (the scratchpad), and delete it when done.
"""
import sys, io, json, math, argparse, pathlib
import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent.parent      # render/video
sys.path.insert(0, str(HERE))
from render import serve, open_page, draw, CLIP              # noqa: E402
from playwright.sync_api import sync_playwright              # noqa: E402


def pick_frames(n_total, n):
    """n frames spread over the cut: the first, the last, and evenly spaced ones nudged off the beat grid by a prime step."""
    if n <= 2: return [0, n_total - 1][:n]
    out = {0, n_total - 1}
    for k in range(1, n - 1):
        out.add(min(n_total - 2, int(round(k * (n_total - 1) / (n - 1))) + (k * 7) % 11))
    return sorted(out)


def grab(edl, frames, page="teaser.html", reverse=False):
    srv = serve(); shots = {}
    with sync_playwright() as p:
        b, pg, errs = open_page(p, srv.server_address[1], edl, page=page)
        fps = json.loads((HERE / "edl" / f"{edl}.json").read_text()).get("fps", 30)
        for i in (frames[::-1] if reverse else frames):
            draw(pg, i / fps)
            shots[i] = pg.screenshot(clip=CLIP, type="png")
        dur = pg.evaluate("window.DURATION")
        b.close()
    srv.shutdown()
    return shots, dur


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("cmd", choices=["snap", "compare", "det"]); ap.add_argument("edl"); ap.add_argument("dir", nargs="?")
    ap.add_argument("--n", type=int, default=20); ap.add_argument("--frames", default="")
    ap.add_argument("--tol", type=float, default=1.0); ap.add_argument("--save-diff", action="store_true")
    ap.add_argument("--page", default="teaser.html")
    a = ap.parse_args()
    if a.cmd == "det":
        edl = json.loads((HERE / "edl" / f"{a.edl}.json").read_text())
        fps = edl.get("fps", 30); n_total = int(round(edl.get("duration") * fps))
        frames = [int(x) for x in a.frames.split(",") if x] or pick_frames(n_total, a.n)
        A, _ = grab(a.edl, frames, a.page); B, _ = grab(a.edl, frames, a.page, reverse=True)
        worst = 0.0; tol = a.tol if a.tol != 1.0 else 0.05
        for i in frames:
            D = np.abs(np.asarray(Image.open(io.BytesIO(A[i])).convert("RGB"), np.int16) - np.asarray(Image.open(io.BytesIO(B[i])).convert("RGB"), np.int16))
            m = float(D.mean()); worst = max(worst, m)
            if m > 0:
                # Chromium's scale-dependent image-decode cache can shift a few antialiased edge pixels of a rotated/scaled image
                # by history (mean ~0.001); a state leak (Math.random, carried state) shows up as whole objects (mean >> 0.05)
                print(f"  frame {i} t={i / fps:.3f}: in-order vs reverse-order mean |diff| {m:.4f}, max {int(D.max())}, "
                      f"{int((D.max(axis=2) > 0).sum())} px{'   <-- NOT DETERMINISTIC' if m >= tol else '  (raster-cache noise)'}")
        print(f"{a.edl}: {len(frames)} frames, worst in-order vs reverse-order mean |diff| {worst:.4f} (tol {tol})")
        sys.exit(1 if worst >= tol else 0)
    d = pathlib.Path(a.dir) / a.edl
    if a.cmd == "snap":
        edl = json.loads((HERE / "edl" / f"{a.edl}.json").read_text())
        fps = edl.get("fps", 30); dur = edl.get("duration")
        frames = [int(x) for x in a.frames.split(",") if x] or pick_frames(int(round(dur * fps)), a.n)
        shots, _ = grab(a.edl, frames, a.page)
        d.mkdir(parents=True, exist_ok=True)
        for i, s in shots.items(): (d / f"{i:05d}.png").write_bytes(s)
        (d / "frames.json").write_text(json.dumps({"edl": a.edl, "fps": fps, "frames": frames}))
        print(f"snapped {len(frames)} frames of {a.edl} into {d}: {frames}")
        return
    meta = json.loads((d / "frames.json").read_text())
    shots, _ = grab(a.edl, meta["frames"], a.page)
    bad = 0; worst = 0.0; rows = []
    for i in meta["frames"]:
        A = np.asarray(Image.open(d / f"{i:05d}.png").convert("RGB"), np.int16)
        B = np.asarray(Image.open(io.BytesIO(shots[i])).convert("RGB"), np.int16)
        diff = np.abs(A - B); m = float(diff.mean()); mx = int(diff.max())
        rows.append((i, m, mx)); worst = max(worst, m)
        if m >= a.tol:
            bad += 1
            if a.save_diff:
                Image.fromarray(np.clip(diff * 8, 0, 255).astype(np.uint8)).save(d / f"diff-{i:05d}.png")
                (d / f"new-{i:05d}.png").write_bytes(shots[i])
    for i, m, mx in rows:
        print(f"  frame {i:5d}  t={i / meta['fps']:7.3f}  mean |diff| {m:7.4f}  max {mx:3d}{'   <-- DRIFT' if m >= a.tol else ''}")
    print(f"{a.edl}: {len(rows)} frames, worst mean |diff| {worst:.4f} (tol {a.tol}); {bad} over")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
