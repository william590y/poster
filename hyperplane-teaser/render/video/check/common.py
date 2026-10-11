"""Shared helpers for the check tools (beatcheck.py, coverage.py): open the engine page, grab low-res grey frames."""
import sys, io, json, math, pathlib, subprocess, contextlib
import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent.parent      # render/video
ROOT = HERE.parent.parent
OUT = HERE / "check" / "out"
sys.path.insert(0, str(HERE))
from render import serve, open_page, draw, Capturer         # noqa: E402

SMALL = (270, 480)       # analysis size (1/4 of 1080x1920): grain and JPEG noise average out


@contextlib.contextmanager
def page(edl, quiet=False):
    from playwright.sync_api import sync_playwright
    srv = serve()
    try:
        with sync_playwright() as p:
            b, pg, errs = open_page(p, srv.server_address[1], edl, quiet=quiet)
            try:
                yield pg
            finally:
                b.close()
    finally:
        srv.shutdown()


def to_small(img_bytes_or_pil):
    im = img_bytes_or_pil if isinstance(img_bytes_or_pil, Image.Image) else Image.open(io.BytesIO(img_bytes_or_pil))
    return np.asarray(im.convert("L").resize(SMALL, Image.BOX), np.float32)


def grab_render(pg, frames, fps, progress=True):
    """{frame: grey 270x480 float32} drawn by the page (renderAsync, so clip frames are loaded)."""
    cap = Capturer(pg)
    out = {}
    for k, f in enumerate(sorted(set(frames))):
        draw(pg, f / fps)
        out[f] = to_small(cap())
        if progress and (k + 1) % 100 == 0: print(f"  grabbed {k + 1}/{len(set(frames))}", flush=True)
    return out


def grab_video(path, frames, fps, start=0.0):
    """{frame: grey} decoded from a rendered mp4 whose first frame is edit time `start` (render.py --from)."""
    fs = sorted(set(frames)); v0 = int(round(start * fps))
    lo, hi = fs[0], fs[-1]
    cmd = ["ffmpeg", "-v", "error", "-ss", f"{max(0, lo - v0) / fps:.6f}", "-i", str(path), "-frames:v", str(hi - lo + 1),
           "-vf", f"scale={SMALL[0]}:{SMALL[1]}:flags=area,format=gray", "-f", "rawvideo", "-pix_fmt", "gray", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    n = len(raw) // (SMALL[0] * SMALL[1])
    allf = {lo + k: np.frombuffer(raw, np.uint8, SMALL[0] * SMALL[1], k * SMALL[0] * SMALL[1]).reshape(SMALL[1], SMALL[0]).astype(np.float32) for k in range(n)}
    return {f: allf[f] for f in fs if f in allf}


def load_edl(name):
    p = pathlib.Path(name)
    if not p.suffix: p = HERE / "edl" / f"{name}.json"
    return json.loads(p.read_text())
