"""Cover check: does a frame match brand/hyperplane-cover-3000.png? (BUILD.md: the final cover hold must match the cover.)

  python3 render/video/check/coverdiff.py <edl> [t] [--y 400] [--scale 0.72] [--png out.png]
      Renders edit time t (default: the last frame, DURATION - 1/fps) losslessly and compares it with the cover scaled to
      1500 * scale px and placed at x = (1080 - 1500 * scale) / 2, y (the kand / logo item's layout). Prints the mean absolute
      difference (0..255) over the cover area, the share of pixels off by more than 32, and the mean outside the cover area
      against flat cream (#F2EBDD). --png writes the difference image (x4) for a look. Added by builder A (fx/kandinsky.js).
"""
import sys, io, math, argparse, pathlib
import numpy as np
from PIL import Image
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import page, ROOT        # noqa: E402
from render import draw, CLIP        # noqa: E402

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("edl"); ap.add_argument("t", nargs="?", type=float)
    ap.add_argument("--y", type=float, default=400); ap.add_argument("--scale", type=float, default=0.72); ap.add_argument("--png")
    a = ap.parse_args()
    with page(a.edl, quiet=True) as pg:
        fps = pg.evaluate("HP.FPS"); dur = pg.evaluate("window.DURATION")
        t = a.t if a.t is not None else (math.ceil(dur * fps - 1e-6) - 1) / fps
        draw(pg, t)
        fr = np.asarray(Image.open(io.BytesIO(pg.screenshot(clip=CLIP, type="png"))).convert("RGB"), np.float32)
    size = round(1500 * a.scale * 2) / 2; x0 = round((1080 - 1500 * a.scale) / 2); y0 = round(a.y); n = int(round(size))
    cov = np.asarray(Image.open(ROOT / "brand" / "hyperplane-cover-3000.png").convert("RGB").resize((n, n), Image.LANCZOS), np.float32)
    reg = fr[y0:y0 + n, x0:x0 + n]
    hh, ww = min(reg.shape[0], n), min(reg.shape[1], n)
    D = np.abs(reg[:hh, :ww] - cov[:hh, :ww]).mean(axis=2)
    out = fr.copy(); out[y0:y0 + hh, x0:x0 + ww] = np.array([242, 235, 221], np.float32)
    outside = np.abs(out - np.array([242, 235, 221], np.float32)).mean()
    print(f"{a.edl} t={t:.4f}: cover area mean |diff| {D.mean():.3f}/255, {100 * (D > 32).mean():.2f}% of pixels > 32, max {D.max():.0f}; outside the cover mean |diff vs cream| {outside:.3f}")
    if a.png:
        Image.fromarray(np.clip(D * 4, 0, 255).astype(np.uint8)).save(a.png); print("wrote", a.png)

if __name__ == "__main__":
    main()
