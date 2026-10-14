"""Render an EDL page (teaser.html?edl=<name>) with Playwright + Chromium.

  python3 render/video/render.py video short [out.mp4] [--from S] [--to S] [--crf 17] [--png]
      Silent H.264 (1080x1920, EDL fps, yuv420p BT.709, high profile, +faststart). Frame i is drawn at t = i/fps EXACTLY
      (frames.py draws i/fps + 1/fps), so picture and audio line up sample for sample once muxed. Screenshots stream straight
      into ffmpeg (image2pipe): nothing is written to disk but the .mp4. Default output: out/<edl>-silent.mp4.
      Capture is JPEG q95 by default (~6x faster than PNG on grainy frames; the H.264 output is 4:2:0 anyway); --png for lossless.
      --from/--to render a sub-range (frame numbering stays absolute: the first frame is round(from*fps)).
  python3 render/video/render.py sheet short 0.5 2 4 ... [--out sheet.png] [--cols 6] [--thumb 270] [--guides] [--debug]
      Contact sheet at the given edit times (default output render/video/sheets/<edl>.png).
  python3 render/video/render.py still short 13.2 [out.png] [--guides] [--debug]
      One full-resolution frame.

  python3 render/video/render.py beats long --from 0 --to 8 [--eighths] [--cols 8] [--thumb 200] [--out strip.png]
      One frame per beat (or 8th) of song/hits.json in the range (the first frame at/after it), labelled with the beat index,
      song time, section, frame and flags (K kick, S snare, H hat, A accent, V vocal); bar downbeats framed in yellow.
      Default output render/video/sheets/<edl>-beats-<from>-<to>.png.
  video ... --workers N renders with N Chromium pages in parallel (frames interleaved, encoded in order by one ffmpeg).

  python3 render/video/render.py cues short [--json]
      Speech cue sheet for the audio mix: every clip's audio.in/out (source s) resolved to edit time and song time.

Clip frames must be extracted first: python3 render/video/prep_clips.py <edl>.
Renders contain clip frames: keep them out of git (out/ and render/video/sheets/ are ignored).
"""
import sys, os, io, math, json, time, argparse, pathlib, threading, functools, subprocess, urllib.parse
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent      # render/video
WEBROOT = HERE.parent                               # render/ (fonts live in render/node_modules)
ROOT = WEBROOT.parent                               # project root


# the page is served from render/ (fonts in render/node_modules); these project folders are mapped in too, so modules can
# fetch song/hits.json, research/rev2/... and brand/... (fx/core.js HP.url() prefixes them with "/")
EXTRA = {"song": ROOT / "song", "research": ROOT / "research", "brand": ROOT / "brand"}


class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()
    def translate_path(self, path):
        p = urllib.parse.unquote(urllib.parse.urlsplit(path).path).lstrip("/")
        head, _, rest = p.partition("/")
        if head in EXTRA:
            base = EXTRA[head].resolve(); full = (base / rest).resolve()
            return str(full) if full == base or base in full.parents else str(base / "__outside__")
        return super().translate_path(path)


def serve():
    srv = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(WEBROOT)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def open_page(p, port, edl, guides=False, debug=False, page="teaser.html", quiet=False):
    # Playwright passes --disable-dev-shm-usage, which moves Chromium's shared memory to /tmp; on a nearly full disk the GPU
    # process then dies mid-render ("GPU process isn't usable"). /dev/shm is RAM-backed, so keep shared memory there.
    b = p.chromium.launch(ignore_default_args=["--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    q = f"edl={edl}" + ("&guides=1" if guides else "") + ("&debug=1" if debug else "")
    pg.goto(f"http://127.0.0.1:{port}/video/{page}?{q}")
    pg.wait_for_function("window.__ok === true || !!window.__err", timeout=60000)
    err = pg.evaluate("window.__err || null")
    if err:
        print("PAGE ERROR:\n" + err); b.close(); sys.exit(1)
    if not quiet:
        for e in errs: print("console:", e)
        for w in pg.evaluate("window.__warn || []"): print("WARN:", w)
        for w in pg.evaluate("window.__info || []"): print("info:", w)
    return b, pg, errs


def draw(pg, t):
    pg.evaluate("t => window.renderAsync ? window.renderAsync(t) : window.render(t)", t)


CLIP = {"x": 0, "y": 0, "width": 1080, "height": 1920}


class Capturer:
    """Frame capture through the DevTools protocol (Page.captureScreenshot, optimizeForSpeed): ~90 ms a frame against ~130 ms
    for page.screenshot at 1080x1920, and always the freshly drawn state (checked against page.screenshot across cuts)."""
    def __init__(self, pg, png=False):
        self.cdp = pg.context.new_cdp_session(pg); self.png = png
    def __call__(self):
        import base64
        opts = {"format": "png" if self.png else "jpeg", "clip": {**CLIP, "scale": 1}, "optimizeForSpeed": not self.png}
        if not self.png: opts["quality"] = 95
        return base64.b64decode(self.cdp.send("Page.captureScreenshot", opts)["data"])


def _worker(k, n, edl, frames, port, q, png, fps, allow_missing=False):
    """--workers: one Chromium per worker renders frames f0+k, f0+k+n, ... and hands them to the parent in order."""
    try:
        with sync_playwright() as p:
            b, pg, errs = open_page(p, port, edl, quiet=True)
            # rev3 fixer: each worker's page loads its own assets, so it gets the parent's warning guard too (a card that failed to
            # load in one worker only used to vanish from every n-th frame without a word)
            warn = pg.evaluate("window.__warn || []")
            if warn and not allow_missing:
                b.close(); q.put(("err", f"worker {k}: page warnings: " + " | ".join(warn))); return
            cap = Capturer(pg, png)
            for i in frames[k::n]:
                draw(pg, i / fps)
                q.put((i, cap()))
            b.close()
    except BaseException as e:  # noqa: BLE001
        q.put(("err", f"worker {k}: {e!r}"))


def encoder(out, fps, png, crf, preset):
    return ["ffmpeg", "-v", "error", "-y", "-f", "image2pipe", "-framerate", str(fps), "-c:v", "png" if png else "mjpeg", "-i", "-",
            # sRGB screenshots -> BT.709 limited-range 4:2:0 (JPEG capture decodes as full-range BT.601 YCbCr: say so explicitly)
            "-vf", ("scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int" if png else
                    "scale=in_range=pc:in_color_matrix=bt601:out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int") + ",format=yuv420p",
            "-c:v", "libx264", "-preset", preset, "-crf", str(crf), "-profile:v", "high", "-pix_fmt", "yuv420p",
            "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv",
            "-r", str(fps), "-movflags", "+faststart", "-an", str(out)]


def cmd_video(a):
    srv = serve()
    out = pathlib.Path(a.out) if a.out else ROOT / "out" / f"{a.edl}-silent.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b, pg, errs = open_page(p, srv.server_address[1], a.edl)
        info = pg.evaluate("({dur: window.DURATION, items: window.__items, warn: window.__warn || []})")
        if info["warn"] and not a.allow_missing:
            b.close(); srv.shutdown(); sys.exit("refusing to render with warnings (missing clip frames? Math.random?); --allow-missing to override")
        edl = json.loads((HERE / "edl" / f"{a.edl}.json").read_text())
        fps = edl.get("fps", 30)
        dur = info["dur"]
        unver = [i["id"] for i in info["items"] if not i["verified"]]
        if unver: print("NOTE: items marked \"verified\": false ->", ", ".join(unver))
        f0 = int(math.floor((a.t_from or 0) * fps + 0.5))
        f1 = int(math.floor((a.t_to if a.t_to is not None else dur) * fps + 0.5))
        frames = list(range(f0, f1)); n = len(frames)
        ff = subprocess.Popen(encoder(out, fps, a.png, a.crf, a.preset), stdin=subprocess.PIPE)
        t_start = time.time()
        def tick(k):
            if k % 60 == 0 or k == n:
                el = time.time() - t_start
                print(f"  frame {k}/{n}  ({k / el:.1f} fps, {el / k:.3f} s/frame, eta {(n - k) / max(k / el, 1e-6):.0f}s)", flush=True)
        try:
            if a.workers <= 1:
                cap = Capturer(pg, a.png)
                for k, i in enumerate(frames, 1):
                    draw(pg, i / fps)                                   # frame i at t = i/fps, exactly
                    ff.stdin.write(cap()); tick(k)
            else:
                b.close()
                import multiprocessing as mp
                ctx = mp.get_context("spawn")
                qs = [ctx.Queue(maxsize=6) for _ in range(a.workers)]
                ws = [ctx.Process(target=_worker, args=(k, a.workers, a.edl, frames, srv.server_address[1], qs[k], a.png, fps, a.allow_missing), daemon=True)
                      for k in range(a.workers)]
                for w in ws: w.start()
                try:
                    for k, i in enumerate(frames):
                        j, data = qs[k % a.workers].get(timeout=300)
                        if j == "err": raise RuntimeError(data)
                        assert j == i, f"frame order: got {j}, expected {i}"
                        ff.stdin.write(data); tick(k + 1)
                finally:
                    for w in ws:
                        w.join(timeout=5)
                        if w.is_alive(): w.terminate()
        finally:
            ff.stdin.close(); ff.wait()
        for e in errs: print("console:", e)
        if a.workers <= 1: b.close()
    srv.shutdown()
    if ff.returncode: sys.exit(f"ffmpeg failed ({ff.returncode})")
    el = time.time() - t_start
    print(f"wrote {out}  ({n} frames, {n / fps:.3f} s, frames {f0}..{f1 - 1}; {el:.1f} s wall, {el / max(n, 1):.3f} s/frame, {a.workers} worker(s))")


def cmd_beats(a):
    """A strip with one frame per beat (or per 8th) of song/hits.json inside [from, to): the critics' main view of rhythm."""
    from PIL import Image, ImageDraw, ImageFont
    srv = serve()
    out = pathlib.Path(a.out) if a.out else HERE / "sheets" / f"{a.edl}-beats-{a.t_from:.2f}-{a.t_to:.2f}{'-8ths' if a.eighths else ''}.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    tw = a.thumb; th = int(round(tw * 16 / 9))
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", max(11, tw // 15))
        small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", max(10, tw // 18))
    except Exception:
        font = small = ImageFont.load_default()
    with sync_playwright() as p:
        b, pg, errs = open_page(p, srv.server_address[1], a.edl, a.guides, a.debug)
        fps = pg.evaluate("HP.FPS")
        beats = pg.evaluate("([s, t0, t1]) => window.__beats(s, t0, t1)", [0.5 if a.eighths else 1, a.t_from, a.t_to])
        src = pg.evaluate("window.__hits.src")
        thumbs = []
        for bt in beats:
            fr = math.ceil(bt["t"] * fps - 1e-6)                    # the first frame at or after the beat (what lands on it)
            draw(pg, fr / fps)
            im = Image.open(io.BytesIO(pg.screenshot(clip=CLIP, type="jpeg", quality=90))).convert("RGB").resize((tw, th), Image.LANCZOS)
            d = ImageDraw.Draw(im)
            whole = abs(bt["i"] - round(bt["i"])) < 1e-6
            down = whole and int(round(bt["i"])) % 4 == 0
            fl = "".join(c for c, k in (("K", "kick"), ("S", "snare"), ("H", "hat"), ("A", "accent"), ("V", "vocal")) if k in bt["flags"])
            lab1 = f"hb:{bt['i']:g}" + ("  BAR" if down else "")
            lab2 = f"song {bt['song']:.2f}  {bt['section']}"
            lab3 = f"f{fr} e{bt['t']:.2f} {fl}"
            hh = (tw // 15 + 4) * 3 + 6
            d.rectangle([0, 0, tw, hh], fill=(0, 0, 0))
            d.text((5, 3), lab1, fill=(255, 210, 60) if down else (255, 90, 90), font=font)
            d.text((5, 3 + tw // 15 + 4), lab2, fill=(220, 220, 220), font=small)
            d.text((5, 3 + 2 * (tw // 15 + 4)), lab3, fill=(160, 200, 255), font=small)
            if down: d.rectangle([0, 0, tw - 1, th - 1], outline=(255, 210, 60), width=4)
            thumbs.append(im)
        for e in errs: print("console:", e)
        b.close()
    srv.shutdown()
    if not thumbs: sys.exit(f"no beats of {src} fall inside {a.t_from}-{a.t_to}")
    cols = min(a.cols, len(thumbs)); rows = (len(thumbs) + cols - 1) // cols; pad = 6
    sheet = Image.new("RGB", (cols * (tw + pad) + pad, rows * (th + pad) + pad + 30), (40, 40, 40))
    ImageDraw.Draw(sheet).text((pad, 6), f"{a.edl}  edit {a.t_from:.2f}-{a.t_to:.2f}  {'8ths' if a.eighths else 'beats'} of {src}  ({len(thumbs)} frames; each = first frame at/after the beat)", fill=(230, 230, 230), font=small)
    for i, im in enumerate(thumbs): sheet.paste(im, (pad + (i % cols) * (tw + pad), 30 + pad + (i // cols) * (th + pad)))
    sheet.save(out); print(f"wrote {out}  ({len(thumbs)} frames)")


def cmd_sheet(a):
    from PIL import Image, ImageDraw, ImageFont
    srv = serve()
    out = pathlib.Path(a.out) if a.out else HERE / "sheets" / f"{a.edl}.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    tw = a.thumb; th = int(round(tw * 16 / 9))
    try: font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", max(12, tw // 16))
    except Exception: font = ImageFont.load_default()
    with sync_playwright() as p:
        b, pg, errs = open_page(p, srv.server_address[1], a.edl, a.guides, a.debug)
        thumbs = []
        for t in a.times:
            draw(pg, t)
            im = Image.open(io.BytesIO(pg.screenshot(clip=CLIP))).convert("RGB").resize((tw, th), Image.LANCZOS)
            d = ImageDraw.Draw(im); lab = f"{t:.2f}s"
            d.rectangle([0, 0, len(lab) * (tw // 26) + 14, tw // 12 + 6], fill=(0, 0, 0)); d.text((6, 3), lab, fill=(255, 80, 80), font=font)
            thumbs.append(im)
        for e in errs: print("console:", e)
        b.close()
    srv.shutdown()
    cols = min(a.cols, len(thumbs)); rows = (len(thumbs) + cols - 1) // cols; pad = 8
    sheet = Image.new("RGB", (cols * (tw + pad) + pad, rows * (th + pad) + pad), (40, 40, 40))
    for i, im in enumerate(thumbs): sheet.paste(im, (pad + (i % cols) * (tw + pad), pad + (i // cols) * (th + pad)))
    sheet.save(out); print(f"wrote {out}  ({len(thumbs)} frames)")


def cmd_still(a):
    srv = serve()
    out = pathlib.Path(a.out) if a.out else HERE / "sheets" / f"{a.edl}-{a.t:.3f}.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b, pg, errs = open_page(p, srv.server_address[1], a.edl, a.guides, a.debug)
        draw(pg, a.t); pg.screenshot(path=str(out), clip=CLIP)
        for e in errs: print("console:", e)
        b.close()
    srv.shutdown(); print(f"wrote {out}")


def cmd_cues(a):
    sys.path.insert(0, str(HERE))
    from prep_clips import load_edl
    from timeref import TimeRef
    edl, _ = load_edl(a.edl)
    TR = TimeRef(edl)
    tref = lambda _g, v, d=None: TR(v, d)   # same signature as before; hb:/song: refs resolve too
    grids, song_at = TR.grids, TR.song_at
    rows = []
    for it in edl["items"]:
        if it.get("type") not in ("clip", "voice") or it.get("enabled") is False or "audio" not in it: continue
        t0, t1 = tref(grids, it.get("t0"), 0.0), tref(grids, it.get("t1"))
        sp = it.get("speed", 1.0); au = it["audio"]
        if it["type"] == "voice":   # speech with no picture: audio.in plays at "at"
            e0 = tref(grids, it.get("at", it.get("t0"))); e1 = e0 + (au["out"] - au["in"]) / sp
        else:
            e0 = t0 + (au["in"] - it["in"]) / sp; e1 = t0 + (au["out"] - it["in"]) / sp
        rows.append({"id": it["id"], "src": it["src"], "src_in": au["in"], "src_out": au["out"], "edit_in": round(e0, 3), "edit_out": round(e1, 3),
                     "song_in": round(song_at(e0), 3), "song_out": round(song_at(e1), 3), "picture": [round(t0, 3), round(t1, 3)],
                     "verified": it.get("verified", True)})
    if a.json: print(json.dumps(rows, indent=1)); return
    print(f"{'id':12s} {'source':32s} {'src in-out':>19s}   {'edit in-out':>15s}   {'song in-out':>15s}  picture")
    for r in rows:
        print(f"{r['id']:12s} {r['src']:32s} {r['src_in']:9.3f}-{r['src_out']:9.3f}   {r['edit_in']:7.3f}-{r['edit_out']:7.3f}   {r['song_in']:7.3f}-{r['song_out']:7.3f}  {r['picture'][0]:.3f}-{r['picture'][1]:.3f}{'' if r['verified'] else '  (unverified)'}")
    if rows: print(f"last speech ends at edit {max(r['edit_out'] for r in rows):.3f}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    v = sp.add_parser("video"); v.add_argument("edl"); v.add_argument("out", nargs="?")
    v.add_argument("--from", dest="t_from", type=float); v.add_argument("--to", dest="t_to", type=float)
    v.add_argument("--crf", type=int, default=17); v.add_argument("--preset", default="medium")
    v.add_argument("--png", action="store_true", help="capture lossless PNG instead of JPEG q95 (slower)")
    v.add_argument("--allow-missing", action="store_true", help="render even if the page reports warnings")
    v.add_argument("--workers", type=int, default=1, help="render with N Chromium pages in parallel (frames interleaved, encoded in order)")
    bt = sp.add_parser("beats"); bt.add_argument("edl"); bt.add_argument("--from", dest="t_from", type=float, required=True)
    bt.add_argument("--to", dest="t_to", type=float, required=True); bt.add_argument("--eighths", action="store_true")
    bt.add_argument("--cols", type=int, default=8); bt.add_argument("--thumb", type=int, default=200); bt.add_argument("--out")
    bt.add_argument("--guides", action="store_true"); bt.add_argument("--debug", action="store_true")
    s = sp.add_parser("sheet"); s.add_argument("edl"); s.add_argument("times", nargs="+", type=float)
    s.add_argument("--out"); s.add_argument("--cols", type=int, default=6); s.add_argument("--thumb", type=int, default=270)
    s.add_argument("--guides", action="store_true"); s.add_argument("--debug", action="store_true")
    st = sp.add_parser("still"); st.add_argument("edl"); st.add_argument("t", type=float); st.add_argument("out", nargs="?")
    st.add_argument("--guides", action="store_true"); st.add_argument("--debug", action="store_true")
    c = sp.add_parser("cues"); c.add_argument("edl"); c.add_argument("--json", action="store_true")
    a = ap.parse_args()
    {"video": cmd_video, "sheet": cmd_sheet, "still": cmd_still, "cues": cmd_cues, "beats": cmd_beats}[a.cmd](a)


if __name__ == "__main__":
    main()
