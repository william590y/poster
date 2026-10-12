#!/usr/bin/env python3
"""Per-section contents of a rev2 EDL with each item's source (research/rev2 records). Usage: contents2.py <long2|short2> [--json]"""
import sys, json
from pathlib import Path

ROOT = Path("/home/user/hyperplane-teaser")
sys.path.insert(0, str(ROOT / "render/video"))
from timeref import TimeRef  # noqa: E402

cut = sys.argv[1]
edl = json.loads((ROOT / f"render/video/edl/{cut}.json").read_text())
TR = TimeRef(edl)
R = ROOT / "research/rev2"
shots = {x["id"]: x for f in ("screens.json", "captures.json") for x in json.loads((R / f).read_text())["items"]}
graphs = {x["id"]: x for x in json.loads((R / "graphs.json").read_text())["items"]}
eqj = json.loads((R / "equations.json").read_text())
eqs = {x["id"]: x for x in (eqj.get("items") or []) + (eqj.get("equations") or [])}
eqs.update({x["id"]: x for x in json.loads((R / "equations-extra.json").read_text())["equations"]})
broll = {x["id"]: x for x in json.loads((R / "broll.json").read_text())["items"]}
SECT = [("prelude", -99, 19.232), ("riff", 19.232, 26.974), ("verse 1", 26.974, 42.458), ("chorus", 42.458, 57.942),
        ("refrain", 57.942, 71.490), ("God bar", 71.490, 73.426), ("instrumental", 73.426, 79.232), ("cover hold", 79.232, 99)]


def sect(song):
    return next(n for n, a, b in SECT if a - 1e-6 <= song < b)


def T(x):
    try:
        return TR(x)
    except Exception:
        return None


def fmt(e):
    return f"{int(e // 60)}:{e % 60:05.2f}"


rows = []
for it in edl["items"]:
    if it.get("enabled") is False:
        continue
    t, i = it["type"], it["id"]
    t0, t1 = T(it.get("t0", 0)), T(it.get("t1", edl["duration"]))
    what = src = None
    if t == "clip":
        what = f'{it.get("stamp", {}).get("name")} ({it.get("stamp", {}).get("year")}): "{it.get("caption", {}).get("text")}"'
        src = f'{it.get("source")} · {it["src"]} {it.get("audio", {}).get("in")}-{it.get("audio", {}).get("out")} s'
    elif t == "karaoke":
        sp = it.get("speech", {})
        what = f'{it.get("name")} ({it.get("year")}): "{" ".join(w["w"] for w in sp.get("words", []))}"'
    elif t == "voice":
        what = f'audio {it["src"]} {it["audio"]["in"]}-{it["audio"]["out"]} s'
    elif t == "screens":
        L = []
        for s in it.get("shots", []):
            r = shots.get(s.get("id"), {})
            L.append(f'{r.get("outlet")} {r.get("date")}: "{r.get("text")}" <{r.get("url")}> [{s.get("id")}]')
        what = f"pile of {len(L)} real screenshots"; src = L
    elif t in ("panel", "kandclip") and it.get("broll"):
        r = broll.get(it["broll"], {})
        what = f'{t} footage: {r.get("shows")}'
        src = f'{r.get("credit")} {r.get("year")} [{it["broll"]}] {r.get("url") or r.get("source") or ""}'
    elif t in ("panel", "kandclip", "image"):
        what = f'{t}: {it.get("src") or it.get("item")}'
        src = f'{it.get("outlet", "")} {it.get("date", "")} in {it.get("in")}'
    elif t == "chart":
        g = graphs.get(it.get("graph"), {})
        what = f'chart "{g.get("title")}" ({g.get("subtitle")})'
        src = f'{g.get("source") or g.get("source_line") or g.get("cite")} [{it.get("graph")}]'
    elif t == "equation":
        e = eqs.get(it.get("ref"), {})
        what = f'equation {e.get("label") or e.get("name")} [{it.get("ref")}]'
        src = e.get("cite") or e.get("citation") or json.dumps(e.get("source"))[:200]
    elif t in ("words", "stamp", "band", "loop", "net", "blackhole", "brushtext", "kand", "fluid"):
        if t == "words":
            what = f'credit line: "{it.get("text")}"'
        elif t == "stamp":
            what = f'stamp: {it.get("stamp")}'
        elif t == "band":
            what = f'band: {json.dumps(it.get("band"))[:300]}'
        elif t == "loop":
            what = f'self-improvement loop: title {it.get("title")}, laps {json.dumps(it.get("laps"))[:120]}'
        elif t == "net":
            what = f'net ({it.get("kind")}): tokens {it.get("tokens")}'
        elif t == "brushtext":
            what = f'"{it["text"]}" painted on the sung words'
        else:
            what = t
    else:
        continue
    s0 = TR.song_at(t0) if t0 is not None else None
    rows.append({"id": i, "type": t, "edit": [round(t0, 3), round(t1, 3)], "song0": round(s0, 3), "section": sect(s0), "what": what, "src": src})
rows.sort(key=lambda r: r["edit"][0])
if "--json" in sys.argv:
    print(json.dumps(rows, indent=1, ensure_ascii=False))
else:
    cur = None
    for r in rows:
        if r["section"] != cur:
            cur = r["section"]; print(f"\n## {cur}")
        print(f'- {fmt(r["edit"][0])}-{fmt(r["edit"][1])} (song {r["song0"]:.2f}) {r["type"]} {r["id"]}: {r["what"]}')
        if isinstance(r["src"], list):
            for s in r["src"]:
                print(f"    * {s}")
        elif r["src"]:
            print(f'    src: {r["src"]}')
