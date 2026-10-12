#!/usr/bin/env python3
"""Re-transcribe every audible speech window of the final encoded rev2 deliverables (faster-whisper small.en, no VAD, beam 5,
0.4 s of digital silence either side) and compare with the on-screen caption words in the EDL.
Usage: captions2.py <long2|short2> ...  (prints a table; writes <cut>-captions.json next to this script)."""
import json, re, subprocess, sys, unicodedata
from pathlib import Path
import numpy as np
from faster_whisper import WhisperModel

ROOT = Path("/home/user/hyperplane-teaser")
sys.path.insert(0, str(ROOT / "render/video"))
from timeref import TimeRef  # noqa: E402
SR = 16000
PAD = 0.4
NUM = {"one": "1", "two": "2", "four": "4", "eight": "8", "sixteen": "16", "thirty-two": "32", "thirtytwo": "32",
       "twenty-five": "25", "twentyfive": "25"}


def norm(s):
    s = unicodedata.normalize("NFKC", s).replace("’", "'").replace("‘", "'").lower()
    s = re.sub(r"thirty[\s-]two", "thirty-two", s)
    s = re.sub(r"twenty[\s-]five", "twenty-five", s)
    s = re.sub(r"(\d+)\s*(percent|per cent|%)", r"\1%", s)
    s = re.sub(r"[“”\"…\.,!?;:—–]", " ", s)
    return [NUM.get(w, w) for w in s.split()]


def decode(p, t0, t1):
    r = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t0:.3f}", "-t", f"{t1 - t0:.3f}", "-i", str(p), "-map", "0:a:0",
                        "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True)
    x = np.frombuffer(r.stdout, "<f4").astype(np.float32)
    z = np.zeros(int(PAD * SR), np.float32)
    return np.concatenate([z, x, z])


import os
WAV = os.environ.get("WAV") == "1"   # pre-check: read song/mix-<cut>-<song|clean|speech>.wav instead of the MP4s
model = WhisperModel("small.en", device="cpu", compute_type="int8", cpu_threads=int(os.environ.get("THREADS", "4")))
for cut in sys.argv[1:]:
    edl = json.loads((ROOT / f"render/video/edl/{cut}.json").read_text())
    TR = TimeRef(edl)
    items = [it for it in edl["items"] if it.get("enabled", True)]
    cues = json.loads(subprocess.run(["python3", str(ROOT / "render/video/render.py"), "cues", cut, "--json"],
                                     capture_output=True, text=True).stdout)
    res = []
    for c in cues:
        e0, e1 = c["edit_in"], c["edit_out"]
        it = next(x for x in items if x["id"] == c["id"])
        if it.get("caption"):
            caps = [(it["id"], it["caption"]["text"], it.get("stamp", {}).get("name"), it.get("stamp", {}).get("year"))]
        else:
            caps = []
            for k in items:
                sp = k.get("speech")
                if k.get("type") == "karaoke" and sp and abs(TR(sp["at"]) - e0) < 0.02:
                    caps.append((k["id"], " ".join(w["w"] for w in sp["words"]), k.get("name"), k.get("year")))
        cap = " ".join(x[1] for x in caps)
        for kind, rel in edl["outputs"].items():
            src = ROOT / "song" / f"mix-{cut}-{ {'song': 'song', 'clean': 'clean', 'no_song': 'speech'}[kind] }.wav" if WAV else ROOT / rel
            x = decode(src, e0, e1)
            segs, _ = model.transcribe(x, language="en", beam_size=5, word_timestamps=True, vad_filter=False,
                                       condition_on_previous_text=False)
            words = [w for s in segs for w in (s.words or [])]
            heard = " ".join(w.word.strip() for w in words)
            ok = norm(cap) == norm(heard)
            res.append({"cut": cut, "file": kind, "id": c["id"], "src": c.get("source") or c.get("src"),
                        "src_in_out": [c.get("src_in"), c.get("src_out")], "edit": [round(e0, 3), round(e1, 3)],
                        "screen_items": [x[0] for x in caps], "speakers": [f"{x[2]} {x[3]}" for x in caps],
                        "caption": cap, "heard": heard, "match": ok,
                        "first_word_edit": round(e0 - PAD + words[0].start, 2) if words else None,
                        "last_word_edit": round(e0 - PAD + words[-1].end, 2) if words else None,
                        "min_word_prob": round(min(w.probability for w in words), 2) if words else None})
            print(f"{cut:6s} {kind:7s} {c['id']:15s} {e0:6.3f}-{e1:6.3f}  {'MATCH' if ok else 'DIFF '}  heard: {heard}"
                  + ("" if ok else f"\n{'':48s}screen: {cap}"), flush=True)
    (ROOT / "render/video/check/out").joinpath(f"{cut}-captions{'-wav' if WAV else ''}.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
