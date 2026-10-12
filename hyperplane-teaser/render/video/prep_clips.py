"""Extract the frames each `clip` item of an EDL uses, at the EDL's fps, into render/video/cache/<item-id>/%05d.jpg.

Usage:
  python3 render/video/prep_clips.py short                 # edl/short.json (a name or a path)
  python3 render/video/prep_clips.py short --only coxon    # just these item ids (comma-separated)
  python3 render/video/prep_clips.py short --force         # re-extract even if the cache matches
  python3 render/video/prep_clips.py short --clean         # also delete cache folders no item of this EDL uses

Only the used window is extracted: source time `in` to `in + (t1 - t0) * speed` (+2 frames of slack). Frame n (1-based)
shows source time in + (n-1)/fps, which is what teaser.html draws at item-local time (n-1)/fps.
Each frame is cropped to the item's box aspect (from `crop` in source pixels, or `focus` + `zoom`), scaled to the box size
(default 1080x940) and graded here with ffmpeg (desaturate, contrast, gamma, sharpen, temporal grain): see `grade`.
A meta.json next to the frames records the count and the parameters; an unchanged item is skipped.
A clip with a "frame" (circle/square mask) is extracted at the frame's size instead of the clip box.
rev2 (BUILD.md, "keep the original footage"): there is no background keying. A clip's "key" field is ignored with a warning
(keying.py stays in this folder as an unused tool). Times may use any reference fx/core.js understands, including "hb:<i>"
(song/hits.json beats) and "song:<s>" (see timeref.py).

Items of any module type are prepared the same way when they carry "prep": "clip" (footage frames, e.g. a b-roll item:
src, in, t0/t1, speed, crop | srcFocus/srcZoom, grade, box | frame) or "prep": "image" (a still, as below).
`image` items (deck screenshots, photos) are prepared too: cache/<item-id>/image.jpg, cropped to `crop` (source px:
{x, y, w, h} or {x0, y0, x1, y1}), fitted to the item's frame ("fit": "cover" (default: fill the frame, centred on
`srcFocus`), "contain" (letterbox inside the frame with `pad` px on `bg`), or "width" (frame width, natural height, for a
pan)), oversampled by `oversample` (default: the larger zoom end, at least 1), and graded with the same ffmpeg chain as clips
(`grade`: sat, contrast, brightness, gamma, sharpen; no grain unless asked).
Builder C (fx/screens.js) additions:
- `screens` items (and any item with "prep": "screens"): every shot's real screenshot (a record of research/rev2/screens.json,
  captures.json or the stand-in screens.stand-in.json, looked up by id; or a shot "src") is copied to
  cache/screens/<id>.png|jpg, byte for byte (downscaled with Lanczos only when wider than 2400 px), and listed in
  cache/screens/index.json ({id: {file, w, h, fw, fh, src}}; w/h = the record's source px, fw/fh = the file's).
- `"broll": "<id>"` on a clip-prepped item (panel, broll): src, in (the first window) and srcFocus (subject_xy) come from
  research/rev2/broll.json (or broll.stand-in.json) unless the item gives them.
- `"oversample": k` on a clip-prepped item extracts frames k times the box size (Ken Burns headroom); `"prepBox": {w, h}`
  overrides the extracted size (e.g. a band panel's rotated bounding box).
The cache holds copies of the clips: it is git-ignored and must never be committed or copied elsewhere.
"""
import sys, os, re, json, math, shutil, hashlib, subprocess, argparse, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from timeref import TimeRef  # noqa: E402

HERE = pathlib.Path(__file__).resolve().parent          # render/video
ROOT = HERE.parent.parent                               # project root
DEFAULT_BOX = {"x": 0, "y": 330, "w": 1080, "h": 940}  # keep in sync with LAYOUT.clipBox in teaser.html
DEFAULT_GRADE = {"sat": 0.0, "contrast": 1.3, "brightness": -0.02, "gamma": 0.95, "sharpen": 0.5, "grain": 9, "deinterlace": False}


def load_edl(name):
    p = pathlib.Path(name)
    if not p.suffix:
        p = HERE / "edl" / f"{name}.json"
    return json.loads(p.read_text()), p


# ---- time references: same rules as teaser.html (number | "grid:index[+-off]" | {"at": ..., "off": s})
def build_grid(g):
    if isinstance(g, list):
        return list(g)
    out, k0, tol = [], g.get("start", 0), g.get("tol", 0.03)
    for i in range(g["count"]):
        x = g["origin"] + (k0 + i) * g["period"]
        near = [s for s in g.get("snap", []) if abs(s - x) <= tol]
        if near:
            x = min(near, key=lambda s: abs(s - x))
        out.append(round(x, 4))
    return out


def grid_at(grids, name, idx):
    g = grids[name]
    def at(k):
        if k < 0: return g[0] + k * (g[1] - g[0])
        if k >= len(g): return g[-1] + (k - len(g) + 1) * (g[-1] - g[-2])
        return g[k]
    i = math.floor(idx + 1e-6); f = idx - i
    return at(i) + (at(i + 1) - at(i)) * f if f > 1e-6 else at(i)


def tref(grids, v, dflt=None):
    if v is None: return dflt
    if isinstance(v, (int, float)): return float(v)
    if isinstance(v, str):
        m = re.match(r"^([A-Za-z_][\w-]*):(-?[\d.]+)([+-][\d.]+)?$", v)
        if not m: return float(v)
        return grid_at(grids, m.group(1), float(m.group(2))) + (float(m.group(3)) if m.group(3) else 0.0)
    if isinstance(v, dict): return tref(grids, v["at"]) + v.get("off", 0)
    raise ValueError(f"bad time {v!r}")


def probe(src):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                          "-of", "json", str(src)], capture_output=True, text=True, check=True).stdout
    s = json.loads(out)["streams"][0]
    return s["width"], s["height"]


def crop_rect(item, sw, sh, bw, bh):
    """Crop (x, y, w, h) in source pixels with the box's aspect ratio."""
    asp = bw / bh
    if "crop" in item:
        c = item["crop"]; w, h = c["w"], c.get("h", c["w"] / asp)
        return int(round(c["x"])), int(round(c["y"])), int(round(w)), int(round(h))
    z = item.get("srcZoom", 1.0)                         # 1 = the largest box-aspect crop that fits the source
    h = sh / z; w = h * asp
    if w > sw / z: w = sw / z; h = w / asp
    fx, fy = item.get("srcFocus", [0.5, 0.5])            # centre of the crop, as a fraction of the source frame
    x = min(max(fx * sw - w / 2, 0), sw - w); y = min(max(fy * sh - h / 2, 0), sh - h)
    return int(round(x)), int(round(y)), int(round(w)), int(round(h))


def frame_rect(f):
    """Same as teaser.html frameRect(): {x, y, w, h} | {cx, cy, r} | {cx, cy, w, h}."""
    if "r" in f:
        return {"x": f["cx"] - f["r"], "y": f["cy"] - f["r"], "w": 2 * f["r"], "h": 2 * f["r"]}
    w = f["w"]; h = f.get("h", w)
    if "cx" in f:
        return {"x": f["cx"] - w / 2, "y": f["cy"] - h / 2, "w": w, "h": h}
    return {"x": f["x"], "y": f["y"], "w": w, "h": h}


def grade_filters(g):
    f = [f"hue=s={g['sat']}", f"eq=contrast={g['contrast']}:brightness={g['brightness']}:gamma={g['gamma']}"]
    if g.get("sharpen"): f.append(f"unsharp=5:5:{g['sharpen']}:5:5:0")
    return f


IMAGE_GRADE = {"sat": 1.0, "contrast": 1.0, "brightness": 0.0, "gamma": 1.0, "sharpen": 0.0, "grain": 0}


def image_vf(it, sw, sh, R):
    """ffmpeg filter chain for an image item: source crop, fit to the frame (oversampled), grade. Returns (vf, out_w, out_h)."""
    g = {**IMAGE_GRADE, **it.get("grade", {})}
    zoom = it.get("zoom", [1, 1])
    os_ = float(it.get("oversample", max(1.0, *zoom)))
    c = it.get("crop")
    if c and "x0" in c:
        c = {"x": c["x0"], "y": c["y0"], "w": c["x1"] - c["x0"], "h": c["y1"] - c["y0"]}
    x, y, w, h = (c["x"], c["y"], c["w"], c["h"]) if c else (0, 0, sw, sh)
    fit = it.get("fit", "cover")
    W, H = int(round(R["w"] * os_)), int(round(R["h"] * os_))
    f = []
    if fit == "cover":                       # sub-crop the source crop to the frame's aspect, centred on srcFocus
        asp = R["w"] / R["h"]
        cw, ch = (w, w / asp) if w / h < asp else (h * asp, h)
        fx, fy = it.get("srcFocus", [0.5, 0.5])
        cx0 = min(max(x + fx * w - cw / 2, x), x + w - cw); cy0 = min(max(y + fy * h - ch / 2, y), y + h - ch)
        f.append(f"crop={int(round(cw))}:{int(round(ch))}:{int(round(cx0))}:{int(round(cy0))}")
        f.append(f"scale={W}:{H}:flags=lanczos")
    elif fit == "contain":
        pad = float(it.get("pad", 0)) * os_
        bg = (it.get("bg") or (it.get("frame") or {}).get("fill") or "#000000").lstrip("#")
        f.append(f"crop={int(w)}:{int(h)}:{int(x)}:{int(y)}")
        f.append(f"scale={int(W - 2 * pad)}:{int(H - 2 * pad)}:force_original_aspect_ratio=decrease:flags=lanczos")
        f.append(f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color=0x{bg}")
    elif fit == "width":
        H = int(round(W * h / w))
        f.append(f"crop={int(w)}:{int(h)}:{int(x)}:{int(y)}")
        f.append(f"scale={W}:{H}:flags=lanczos")
    else:
        raise SystemExit(f"{it['id']}: unknown fit {fit!r}")
    f += grade_filters(g)
    if g.get("grain"): f.append(f"noise=alls={int(g['grain'])}:allf=u")
    f.append("format=yuvj444p")
    return ",".join(f), W, H, fit


def prep_image(it, cache, force, quality):
    iid = it["id"]; folder = it.get("frames", iid)
    src = (ROOT / it["src"]).resolve()
    if not src.exists():
        print(f"!! {iid}: missing image {src}"); return folder
    R = frame_rect(it.get("frame") or {"x": 60, "y": 360, "w": 960, "h": 600})
    sw, sh = probe(src)
    vf, W, H, fit = image_vf(it, sw, sh, R)
    key = json.dumps({"src": str(src), "mtime": src.stat().st_mtime, "vf": vf, "q": quality}, sort_keys=True)
    h = hashlib.sha1(key.encode()).hexdigest()[:12]
    out = cache / folder; meta_p = out / "meta.json"
    if meta_p.exists() and (out / "image.jpg").exists() and not force:
        try:
            if json.loads(meta_p.read_text()).get("hash") == h:
                print(f"== {iid}: image cached"); return folder
        except Exception:
            pass
    if out.exists(): shutil.rmtree(out)
    out.mkdir(parents=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-vf", vf, "-frames:v", "1", "-q:v", str(quality), str(out / "image.jpg")], check=True)
    meta = {"id": iid, "type": "image", "w": W, "h": H, "fit": fit, "frame": R, "src": it["src"], "src_size": [sw, sh], "vf": vf, "hash": h}
    meta_p.write_text(json.dumps(meta, indent=1))
    print(f"-> {iid}: image {W}x{H} ({fit}) from {it['src']}")
    return folder


def vf_chain(item, fps, sw, sh, box):
    g = {**DEFAULT_GRADE, **item.get("grade", {})}
    x, y, w, h = crop_rect(item, sw, sh, box["w"], box["h"])
    w -= w % 2; h -= h % 2
    f = []
    if g.get("deinterlace"): f.append("yadif=mode=1")
    f.append(f"fps={fps}")
    f.append(f"crop={w}:{h}:{x}:{y}")
    f.append(f"scale={box['w']}:{box['h']}:flags=lanczos")
    f.append(f"hue=s={g['sat']}")
    f.append(f"eq=contrast={g['contrast']}:brightness={g['brightness']}:gamma={g['gamma']}")
    if g.get("sharpen"): f.append(f"unsharp=5:5:{g['sharpen']}:5:5:0")
    if g.get("grain"): f.append(f"noise=alls={int(g['grain'])}:allf=t")
    return ",".join(f), (x, y, w, h)


# ---- builder C: real screenshots (screens items) and the b-roll catalog
RESEARCH = ROOT / "research" / "rev2"


def _catalog(names):
    """{id: record} from research/rev2 catalogs; earlier names win; *.verify.*.json corrections are merged into screens.json."""
    out = {}
    for n in reversed(names):
        p = RESEARCH / n
        if not p.exists(): continue
        for r in json.loads(p.read_text()).get("items", []):
            out[r["id"]] = r
    for v in ("screens.verify.even.json", "screens.verify.odd.json"):
        p = RESEARCH / v
        if p.exists():
            for r in json.loads(p.read_text()).get("items", []):
                if r.get("id") in out: out[r["id"]] = {**out[r["id"]], **r}
    return out


def screens_catalog():
    return _catalog(["screens.json", "captures.json", "screens.stand-in.json"])


def broll_catalog():
    return _catalog(["broll.json", "broll.stand-in.json"])


def prep_screens(it, cache, force, CAT):
    """copy each shot's screenshot to cache/screens/<id>.<ext> (pixels untouched; Lanczos downscale only above 2400 px wide)"""
    from PIL import Image
    Image.MAX_IMAGE_PIXELS = None
    out = cache / "screens"; out.mkdir(exist_ok=True)
    idx_p = out / "index.json"
    idx = json.loads(idx_p.read_text()) if idx_p.exists() else {}
    shots = it.get("shots") or ([{"id": it["shot"]}] if it.get("shot") else [])
    for sh in shots:
        sid = sh if isinstance(sh, str) else sh.get("id")
        rec = CAT.get(sid) or {}
        src = (sh.get("src") if isinstance(sh, dict) else None) or rec.get("path")
        if not src:
            print(f"!! {it['id']}: shot {sid}: not in screens.json / captures.json / screens.stand-in.json and no src"); continue
        sp = (ROOT / src).resolve()
        if not sp.exists():
            print(f"!! {it['id']}: shot {sid}: missing image {sp}"); continue
        ext = ".jpg" if sp.suffix.lower() in (".jpg", ".jpeg") else ".png"
        dst = out / f"{sid}{ext}"
        stamp = f"{sp}|{sp.stat().st_mtime}"
        old = idx.get(sid)
        if old and old.get("stamp") == stamp and (out / old["file"]).exists() and not force:
            continue
        im = Image.open(sp); w, h = im.size
        if w > 2400:
            k = 2400 / w; im2 = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB").resize((2400, max(1, round(h * k))), Image.LANCZOS)
            dst = out / f"{sid}.png"; im2.save(dst); fw, fh = im2.size
        else:
            shutil.copyfile(sp, dst); fw, fh = w, h
        idx[sid] = {"file": dst.name, "w": rec.get("w", w), "h": rec.get("h", h), "fw": fw, "fh": fh, "src": str(src), "stamp": stamp}
        print(f"-> screens/{dst.name} ({fw}x{fh}) from {src}")
    idx_p.write_text(json.dumps(idx, indent=1))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("edl"); ap.add_argument("--only", default=""); ap.add_argument("--force", action="store_true")
    ap.add_argument("--clean", action="store_true"); ap.add_argument("--quality", type=int, default=3, help="ffmpeg -q:v (2 best .. 31)")
    a = ap.parse_args()
    edl, path = load_edl(a.edl)
    fps = edl.get("fps", 30)
    TR = TimeRef(edl)   # rev2: hb:/song: references too
    box0 = {**DEFAULT_BOX, **edl.get("layout", {}).get("clipBox", {})}
    only = set(x for x in a.only.split(",") if x)
    cache = HERE / "cache"; cache.mkdir(exist_ok=True)
    used = {"screens"}
    SCAT, BCAT = None, None
    for it in edl["items"]:
        if it.get("enabled") is False: continue
        kind = it.get("prep") or it.get("type")   # rev2: module items opt in with "prep": "clip" | "image" (e.g. a b-roll item)
        if kind == "screens" or it.get("type") == "screens":
            if not only or it["id"] in only:
                SCAT = SCAT if SCAT is not None else screens_catalog()
                prep_screens(it, cache, a.force, SCAT)
            continue
        if it.get("broll") and kind == "clip":   # builder C: b-roll catalog lookup (research/rev2/broll.json)
            BCAT = BCAT if BCAT is not None else broll_catalog()
            b = BCAT.get(it["broll"])
            if not b: print(f"!! {it['id']}: broll {it['broll']} not in research/rev2/broll.json / broll.stand-in.json"); continue
            win = (b.get("windows") or [{}])[0]
            it = {**it, "src": it.get("src") or b["path"], "in": it.get("in", win.get("in", 0.0))}
            if "srcFocus" not in it and b.get("subject_xy"): it["srcFocus"] = b["subject_xy"]
        if kind == "image":
            if only and it["id"] not in only: used.add(it.get("frames", it["id"])); continue
            used.add(prep_image(it, cache, a.force, min(a.quality, 2))); continue
        if kind != "clip": continue
        iid = it["id"]; folder = it.get("frames", iid); used.add(folder)
        if only and iid not in only: continue
        src = (ROOT / it["src"]).resolve()
        if not src.exists():
            print(f"!! {iid}: missing source {src}"); continue
        t0, t1 = TR(it.get("t0"), 0.0), TR(it.get("t1"))
        speed = it.get("speed", 1.0)
        dur = (t1 - t0) * speed + 2.0 / fps
        box = frame_rect(it["frame"]) if "frame" in it else {**box0, **it.get("box", {})}
        if it.get("prepBox"): box = {**box, **it["prepBox"]}          # builder C: explicit extraction size
        if it.get("oversample"): box = {**box, "w": box["w"] * it["oversample"], "h": box["h"] * it["oversample"]}
        box = {k: int(round(v)) for k, v in box.items()}
        box["w"] -= box["w"] % 2; box["h"] -= box["h"] % 2
        sw, sh = probe(src)
        vf, rect = vf_chain(it, fps, sw, sh, box)
        if it.get("key"): print(f"!! {iid}: ignoring \"key\" (rev2: no background keying; keep the original footage)")
        key = json.dumps({"src": str(src), "in": it["in"], "dur": round(dur, 4), "vf": vf, "q": a.quality, "fps": fps}, sort_keys=True)
        h = hashlib.sha1(key.encode()).hexdigest()[:12]
        out = cache / folder; meta_p = out / "meta.json"
        if meta_p.exists() and not a.force:
            try:
                m = json.loads(meta_p.read_text())
                if m.get("hash") == h and len(list(out.glob("*.jpg"))) == m.get("count"):
                    print(f"== {iid}: cached ({m['count']} frames)"); continue
            except Exception:
                pass
        if out.exists(): shutil.rmtree(out)
        out.mkdir(parents=True)
        cmd = ["ffmpeg", "-v", "error", "-y", "-ss", f"{it['in']:.3f}", "-i", str(src), "-t", f"{dur:.3f}", "-an",
               "-vf", vf, "-q:v", str(a.quality), "-start_number", "1", str(out / "%05d.jpg")]
        subprocess.run(cmd, check=True)
        n = len(list(out.glob("*.jpg")))
        meta = {"id": iid, "count": n, "fps": fps, "w": box["w"], "h": box["h"], "src": it["src"], "in": it["in"], "dur": round(dur, 4),
                "crop": rect, "src_size": [sw, sh], "vf": vf, "hash": h}
        meta_p.write_text(json.dumps(meta, indent=1))
        mb = sum(f.stat().st_size for f in out.glob("*.jpg")) / 1e6
        print(f"-> {iid}: {n} frames {box['w']}x{box['h']} from {it['src']} @ {it['in']:.3f}s (+{dur:.2f}s), crop {rect}, {mb:.1f} MB")
    if a.clean:
        for d in cache.iterdir():
            if d.is_dir() and d.name not in used:
                shutil.rmtree(d); print(f"xx removed cache/{d.name}")


if __name__ == "__main__":
    main()
