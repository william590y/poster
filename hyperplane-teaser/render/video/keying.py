"""Background key for a clip: everything that is not the speaker becomes a plain dark ground (prep_clips.py, item field "key").

Made for the short's Amodei shot (r4): the stage wall behind him is the event's branding (rows of white AXIOS logos on blue),
and one logo sits right behind his head, so no crop can leave it out. The key is data-driven from the EDL item:

  "key": {
    "model": "clips/models/u2net_human_seg.onnx",  # person segmentation (rembg's u2net_human_seg, 320x320 input; git-ignored)
    "region": [x0, y0, x1, y1],        # source px handed to the segmenter: the speaker with some context (must cover the crop)
    "wall": {"hue": [205, 255], "sat": 0.35, "val": 0.5},   # wall-coloured pixels are ground even inside the person mask
                                       # ("walls": [{...}, ...] for several colours, e.g. a cyan backdrop with yellow lettering)
    "letters": [[y0, y1], ...],        # source rows of the wall's white lettering: a white blob there that touches the wall is ground
    "white": {"sat": 0.18, "val": 0.8},
    "erode": 1, "feather": 1.0,        # alpha: grey erosion passes (3x3), then a Gaussian blur (px) against a light fringe
    "smooth": 1,                       # temporal median of the mask over +-smooth frames (no edge flicker)
    "bg": ["#2B2932", "#111015"], "bgCenter": [0.5, 0.32], "bgRadius": 0.8   # radial ground (centre, edge colour) in the crop
  }

The grade (desaturate, contrast, grain) is applied afterwards by ffmpeg, exactly as for any other clip.
"""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

_SESS = {}


def _session(path):
    if path not in _SESS:
        import onnxruntime as ort
        _SESS[path] = ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])
    return _SESS[path]


def _seg(sess, rgb):
    """u2net person probability (320x320, 0..1) for an RGB uint8 array."""
    a = np.asarray(Image.fromarray(rgb).resize((320, 320), Image.LANCZOS)).astype(np.float32) / 255.0
    a = (a - np.array([0.485, 0.456, 0.406], np.float32)) / np.array([0.229, 0.224, 0.225], np.float32)
    o = sess.run(None, {sess.get_inputs()[0].name: a.transpose(2, 0, 1)[None].astype(np.float32)})[0][0, 0]
    return (o - o.min()) / (o.max() - o.min() + 1e-8)


def _hsv(rgb):
    x = rgb.astype(np.float32) / 255.0
    mx, mn = x.max(-1), x.min(-1)
    d = mx - mn
    s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    r, g, b = x[..., 0], x[..., 1], x[..., 2]
    h = np.zeros_like(mx)
    m = d > 1e-6
    rm = m & (mx == r); gm = m & (mx == g) & ~rm; bm = m & ~rm & ~gm
    h[rm] = ((g - b)[rm] / d[rm]) % 6
    h[gm] = (b - r)[gm] / d[gm] + 2
    h[bm] = (r - g)[bm] / d[bm] + 4
    return h * 60.0, s, mx


def _hex(c):
    c = c.lstrip("#"); return np.array([int(c[i:i + 2], 16) for i in (0, 2, 4)], np.float32)


def key_frames(frames, crop, key, root):
    """frames: list of HxWx3 uint8 source frames; crop: (x, y, w, h) source px. Returns the keyed crops (uint8)."""
    sess = _session(root / key["model"])
    x0, y0, x1, y1 = key["region"]
    probs = [_seg(sess, f[y0:y1, x0:x1]) for f in frames]
    r = int(key.get("smooth", 1))
    if r > 0 and len(probs) > 1:
        st = np.stack(probs)
        probs = [np.median(st[max(0, i - r):i + r + 1], axis=0) for i in range(len(st))]
    cx, cy, cw, ch = crop
    walls = key.get("walls") or [key.get("wall", {})]
    Wt = key.get("white", {}); wts, wtv = Wt.get("sat", 0.18), Wt.get("val", 0.8)
    yy, xx = np.mgrid[0:ch, 0:cw].astype(np.float32)
    fx, fy = key.get("bgCenter", [0.5, 0.32]); rad = key.get("bgRadius", 0.8)
    dist = np.sqrt(((xx / cw - fx) * (cw / ch)) ** 2 + (yy / ch - fy) ** 2) / rad
    c0, c1 = (_hex(c) for c in key.get("bg", ["#2B2932", "#111015"]))
    ground = c0 + (c1 - c0) * np.clip(dist, 0, 1)[..., None]
    out = []
    for f, p in zip(frames, probs):
        a_full = np.zeros(f.shape[:2], np.float32)
        a_full[y0:y1, x0:x1] = np.asarray(Image.fromarray((p * 255).astype(np.uint8)).resize((x1 - x0, y1 - y0), Image.BILINEAR)) / 255.0
        rgb = f[cy:cy + ch, cx:cx + cw]
        a = a_full[cy:cy + ch, cx:cx + cw]
        h, s, v = _hsv(rgb)
        wall = np.zeros_like(a)
        for W in walls:   # soft membership in each wall colour (hue range, saturation and value floors)
            lo, hi = W.get("hue", [205, 255])
            hue_in = ((h >= lo) & (h <= hi)).astype(np.float32)
            wall = np.maximum(wall, hue_in * np.clip((s - W.get("sat", 0.35) + 0.1) / 0.2, 0, 1) * np.clip((v - W.get("val", 0.5) + 0.1) / 0.2, 0, 1))
        a = a * (1 - wall)
        # the wall's white lettering: white blobs in the lettering rows that touch wall-coloured pixels
        white = (s < wts) & (v > wtv)
        band = np.zeros_like(white)
        for r0, r1 in key.get("letters", []):
            band[max(0, r0 - cy):max(0, r1 - cy), :] = True
        lab, n = ndi.label(white & band)
        if n:
            touch = ndi.binary_dilation(wall > 0.5, iterations=2)
            hit = np.unique(lab[touch & (lab > 0)])
            letters = np.isin(lab, hit[hit > 0])
            a[ndi.binary_dilation(letters, iterations=1)] = 0
        for _ in range(int(key.get("erode", 1))):
            a = ndi.grey_erosion(a, size=(3, 3))
        if key.get("feather", 1.0):
            a = ndi.gaussian_filter(a, key.get("feather", 1.0))
        comp = rgb.astype(np.float32) * a[..., None] + ground * (1 - a[..., None])
        out.append(np.clip(comp + 0.5, 0, 255).astype(np.uint8))
    return out
