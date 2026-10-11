"""Coverage check (BUILD.md REVISION 2): footage in every frame, text rolled out, no lyrics on screen, text in the safe zone.

  python3 render/video/check/coverage.py long [--from S --to S] [--step 1] [--min-area 0.12] [--min-frames 4]

Per frame (render(t) in the page; DOM-level, no screenshots):
  imagery   is some footage/image visible? Elements declared with HP.markImagery(el) / item.imagery(el) (legacy: clip canvases,
            image items) count when their effective opacity >= 0.3 and their visible (clipped) area >= --min-area of the frame.
            Frames inside the EDL's "finalHold": [t0, t1] (time refs; the closing cover hold) are exempt.
  safe zone every visible text run (opacity >= 0.5) must sit inside x 60-1014, y 250-1574, and keep out of the right rail
            (x > 930 for y 1000-1600); a violation counts when it lasts >= --min-frames frames (fly-ins are allowed).
  lyrics    on-screen text (visible runs per item, plus every item's declared texts()) must not share a 3-word sequence with the
            song's lyrics (song/full-map.json). The one exception, "it's brutal out here", is allowed only while it is sung
            (song 71.5-74.2).
Static, per item (HP.probe.items(): each item's texts() with its reveal mode):
  reveal    every main text of more than 4 words needs a reveal mode (words, chars, highlight, stroke, ...; not "none").
  payoff    (polisher) every payoff an item declares (the time its rolled-out text, mark, chart annotation or source line is
            complete: a clip's r7 "sub" line, a caption's marks, ...) must land at least --read seconds (0.5) before the item ends;
            a payoff that the item's end cuts off (e.g. the Amodei 75% baseline before rev2's fix) is a violation.
Writes check/out/<edl>-coverage[-from-to].json and prints a summary. Exit status 0 always (it is a report).
"""
import sys, re, json, math, argparse, pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import page, OUT, ROOT, load_edl     # noqa: E402

SAFE = dict(x0=60, x1=1014, y0=250, y1=1574); RAIL = dict(x=930, y0=1000, y1=1600); TOL = 4
ALLOWED = "it's brutal out here"; ALLOWED_SONG = (71.5, 74.2)


def norm_words(s):
    s = s.replace("’", "'").replace("‘", "'").lower()
    return [w for w in (re.sub(r"[^\w%']", "", x).strip("'") for x in s.split()) if w]


def grams(ws, n=3):
    return {" ".join(ws[i:i + n]) for i in range(len(ws) - n + 1)}


def lyric_grams():
    fm = json.loads((ROOT / "song" / "full-map.json").read_text())
    ws = [w for seg in fm["lyrics"] for w in norm_words(" ".join(x["w"] for x in seg["words"]))]
    G = grams(ws)
    allowed = grams(norm_words(ALLOWED))
    return G, allowed


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("edl"); ap.add_argument("--from", dest="t_from", type=float, default=0.0); ap.add_argument("--to", dest="t_to", type=float)
    ap.add_argument("--step", type=int, default=1, help="check every Nth frame")
    ap.add_argument("--min-area", type=float, default=0.12); ap.add_argument("--min-op", type=float, default=0.3)   # fixer r2: min-area 12 % (was 2 %): a corner thumbnail is not "footage in the frame"
    ap.add_argument("--min-frames", type=int, default=4); ap.add_argument("--out")
    ap.add_argument("--read", type=float, default=0.5, help="payoff check: seconds a completed text/mark must stay before the item ends")
    a = ap.parse_args()
    edl = load_edl(a.edl)
    LG, ALLOWED_G = lyric_grams()
    with page(a.edl, quiet=True) as pg:
        fps = pg.evaluate("HP.FPS"); dur = pg.evaluate("window.DURATION"); W, H = 1080, 1920
        t0 = max(0.0, a.t_from); t1 = min(a.t_to if a.t_to is not None else dur, dur)
        fh = edl.get("finalHold")
        hold = pg.evaluate("(h) => h ? [HP.T(Array.isArray(h) ? h[0] : (h.t0 ?? h.from)), HP.T(Array.isArray(h) ? h[1] : (h.t1 ?? h.to ?? 1e9))] : null", fh)
        items = pg.evaluate("HP.probe.items().map(x => ({...x, s0: HP.songAt(x.t0), s1: HP.songAt(Math.min(x.t1, window.DURATION))}))")
        F = list(range(int(math.floor(t0 * fps + 0.5)), int(math.floor(t1 * fps + 0.5)), a.step))
        song_of = pg.evaluate("(ts) => ts.map(t => HP.songAt(t))", [f / fps for f in F])
        frames = []
        for k in range(0, len(F), 30):
            frames += pg.evaluate("(ts) => ts.map(t => HP.probe.frame(t))", [f / fps for f in F[k:k + 30]])
            if (k // 30) % 10 == 9: print(f"  probed {min(k + 30, len(F))}/{len(F)} frames", flush=True)
    # ---- imagery
    min_area = a.min_area * W * H
    uncovered, held = [], 0
    for f, fr in zip(F, frames):
        t = f / fps
        if hold and hold[0] - 1e-6 <= t < hold[1]: held += 1; continue
        if not any(x["area"] >= min_area and x["op"] >= a.min_op for x in fr["img"]): uncovered.append(f)
    gaps = []
    for f in uncovered:
        if gaps and f - gaps[-1][1] <= a.step: gaps[-1][1] = f
        else: gaps.append([f, f])
    gaps = [{"t0": round(g0 / fps, 3), "t1": round((g1 + a.step) / fps, 3), "frames": (g1 - g0) // a.step + 1} for g0, g1 in gaps]
    # ---- safe zone (per item id + text, runs of consecutive checked frames)
    viol = {}
    for f, fr in zip(F, frames):
        for r in fr["txt"]:
            if r["op"] < 0.5: continue
            x, y, w, h = r["rect"]
            why = []
            if x < SAFE["x0"] - TOL: why.append("left")
            if x + w > SAFE["x1"] + TOL: why.append("right")
            if y < SAFE["y0"] - TOL: why.append("top")
            if y + h > SAFE["y1"] + TOL: why.append("bottom")
            if x + w > RAIL["x"] + TOL and y < RAIL["y1"] and y + h > RAIL["y0"]: why.append("rail")
            if why: viol.setdefault((r["id"], r["text"][:60], ",".join(why)), []).append(f)
    safe = []
    for (iid, txt, why), fl in viol.items():
        run = [fl[0]]
        for f in fl[1:] + [None]:
            if f is not None and f - run[-1] <= a.step: run.append(f); continue
            if (run[-1] - run[0]) // a.step + 1 >= a.min_frames:
                safe.append({"id": iid, "text": txt, "where": why, "t0": round(run[0] / fps, 3), "t1": round(run[-1] / fps, 3), "frames": (run[-1] - run[0]) // a.step + 1})
            if f is not None: run = [f]
    # ---- lyrics (visible runs grouped per item and frame, plus declared texts)
    seen, lyr = {}, []
    def check(iid, text, song_lo, song_hi, where):
        g = grams(norm_words(text)) & LG
        if not g: return
        bad = sorted(x for x in g if not (x in ALLOWED_G and song_lo >= ALLOWED_SONG[0] and song_hi <= ALLOWED_SONG[1]))
        if bad:
            k = (iid, tuple(bad))
            if k not in seen:
                seen[k] = True; lyr.append({"id": iid, "grams": bad, "text": text[:120], "song": [round(song_lo, 2), round(song_hi, 2)], "from": where})
    for f, fr, s in zip(F, frames, song_of):
        per = {}
        for r in fr["txt"]: per.setdefault(r["id"], []).append(r["text"])
        for iid, ts in per.items(): check(iid, " ".join(ts), s, s, f"frame {f}")
    for it in items:
        for tx in it["texts"]:
            check(it["id"], tx.get("text") or "", it["s0"], it["s1"], "texts()")
    # ---- reveal modes
    reveal = []
    for it in items:
        for tx in it["texts"]:
            if tx.get("role", "main") != "main": continue
            n = len((tx.get("text") or "").split())
            if n > 4 and (tx.get("reveal") or "none") in ("none", "all", ""):
                reveal.append({"id": it["id"], "type": it["type"], "words": n, "reveal": tx.get("reveal") or "none", "text": (tx.get("text") or "")[:100]})
    # ---- payoffs (polisher): rolled-out texts, marks, annotations complete >= --read s before their item ends
    late = []
    for it in items:
        if it["t1"] < t0 or it["t0"] > t1: continue
        # assembler (rev2): an item that leaves through a transition is readable until that transition's impact (readEnd)
        end = it.get("readEnd", it["t1"])
        for p in it.get("payoffs") or []:
            if p["at"] + a.read > end + 1e-3:
                late.append({"id": it["id"], "type": it["type"], "what": p["what"], "at": p["at"], "t1": end, "short_by": round(p["at"] + a.read - end, 3)})
    rep = {"edl": a.edl, "range": [t0, t1], "fps": fps, "step": a.step, "finalHold": hold, "frames_checked": len(F), "frames_held": held,
           "imagery": {"uncovered_frames": len(uncovered), "coverage": round(1 - len(uncovered) / max(1, len(F) - held), 4), "gaps": gaps,
                       "min_area": a.min_area, "min_op": a.min_op},
           "reveal": reveal, "lyrics": lyr, "safe_zone": safe, "payoff": {"read_s": a.read, "late": late},
           "summary": {"uncovered_frames": len(uncovered), "gaps": len(gaps), "reveal_violations": len(reveal), "lyric_hits": len(lyr), "safe_violations": len(safe),
                       "late_payoffs": len(late)}}
    OUT.mkdir(parents=True, exist_ok=True)
    stem = a.out or str(OUT / (f"{a.edl}-coverage" + ("" if (t0 == 0 and t1 == dur) else f"-{t0:.2f}-{t1:.2f}")))
    pathlib.Path(stem + ".json").write_text(json.dumps(rep, indent=1))
    s = rep["summary"]
    print(f"{a.edl} edit {t0:.2f}-{t1:.2f}: imagery {rep['imagery']['coverage'] * 100:.1f}% of {len(F) - held} frames"
          f"{' (finalHold %.2f-%.2f exempt)' % tuple(hold) if hold else ' (no finalHold declared)'}; {s['gaps']} gaps; "
          f"{s['reveal_violations']} texts without a reveal; {s['lyric_hits']} lyric overlaps; {s['safe_violations']} safe-zone violations; "
          f"{s['late_payoffs']} late payoffs")
    for g in gaps[:20]: print(f"  NO IMAGERY edit {g['t0']:.3f}-{g['t1']:.3f} ({g['frames']} frames)")
    for r in reveal[:20]: print(f"  NO REVEAL {r['id']} ({r['type']}, {r['words']} words): {r['text'][:70]}")
    for r in lyr[:20]: print(f"  LYRIC {r['id']} {r['grams']} song {r['song']}: {r['text'][:70]}")
    for r in safe[:20]: print(f"  SAFE {r['id']} [{r['where']}] edit {r['t0']:.2f}-{r['t1']:.2f}: {r['text']}")
    for r in late[:20]: print(f"  LATE {r['id']} ({r['type']}): {r['what']} complete at {r['at']:.2f}, item ends {r['t1']:.2f} (short by {r['short_by']:.2f} s)")
    print(f"wrote {stem}.json")


if __name__ == "__main__":
    main()
