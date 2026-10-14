#!/usr/bin/env python3
"""Karaoke vs audio and picture on the ENCODED rev3 deliverables (Musk's and Bostrom's lines; any karaoke item with a "speech" block).
Usage: karaoke_final3.py <long3|short3> [out.json]

For each word of each karaoke item (kar-musk, kar-bostrom, and the older ones with --all):
  lit        = the edit time the EDL lights the word (TimeRef(speech.at) + word.s - speech.in), i.e. when the engine draws it
  audio      = the acoustic onset in the decoded no-song file: the largest rise of the 5 ms RMS envelope (in dB) nearest to the lit time within
               [lit - 120 ms, lit + 120 ms] of the speech-only MP4 (digital silence outside the speech, so the envelope is the voice
               alone, with the music out of the way); the same measured on the with-song file (voice over the ducked song) is
               reported too, as a check that the song mix did not move the voice
The picture side is the engine's own draw of the same lit times (the words' pixels are checked on the frames by eye, see the contact sheet
and out/rev3/NOTES.md); this script checks the audio side of the same affine map (source second -> edit time).
Prints a table and writes the JSON next to the other check outputs."""
import sys, json, math, subprocess
from pathlib import Path
import numpy as np

ROOT = Path("/home/user/hyperplane-teaser")
sys.path.insert(0, str(ROOT / "render/video"))
from timeref import TimeRef  # noqa: E402

SR, FPS, W, H = 48000, 30, 1080, 1920
cut = sys.argv[1]
edl = json.loads((ROOT / f"render/video/edl/{cut}.json").read_text())
TR = TimeRef(edl)
files = {k: ROOT / v for k, v in edl["outputs"].items()}
ALL = "--all" in sys.argv
ids = [it["id"] for it in edl["items"] if it.get("type") == "karaoke" and it.get("speech") and (ALL or it["id"] in ("kar-musk", "kar-bostrom"))]


def decode(p):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-map", "0:a:0", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True)
    return np.frombuffer(r.stdout, "<f4").astype(np.float64)


def envelope(x, hop=SR // 200):
    n = len(x) // hop
    e = np.add.reduceat(x[:n * hop] ** 2, np.arange(0, n * hop, hop)) / hop
    return 10 * np.log10(np.convolve(e, np.ones(2) / 2, "same") + 1e-12)   # dB per 5 ms hop (2-hop smoothing)


def onset(env, t, win=0.12, min_rise=5.0):
    """rises of the envelope (15 ms) in [t-win, t+win]: the local maxima of the rise series >= min_rise dB; returns the one nearest
    to t (time of the START of the rise) and its size; the largest rise if none is a local maximum"""
    lo, hi = max(1, int((t - win) * 200)), int((t + win) * 200)
    rise = np.array([env[min(i + 3, len(env) - 1)] - env[i] for i in range(lo, hi)])
    peaks = [k for k in range(len(rise)) if rise[k] >= min_rise and rise[k] >= rise[max(0, k - 2):k + 3].max() - 1e-9]
    if not peaks:
        k = int(np.argmax(rise))
        return (lo + k + 1) / 200.0, float(rise[k])
    k = min(peaks, key=lambda k: abs((lo + k + 1) / 200.0 - t))
    return (lo + k + 1) / 200.0, float(rise[k])


def frames_gray(mp4, f0, f1, box):
    x0, y0, x1, y1 = box
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(mp4), "-vf",
                        f"select='between(n\\,{f0}\\,{f1})',crop={x1 - x0}:{y1 - y0}:{x0}:{y0}", "-vsync", "0", "-f", "rawvideo",
                        "-pix_fmt", "gray", "-"], capture_output=True)
    return np.frombuffer(r.stdout, np.uint8).reshape(-1, y1 - y0, x1 - x0)


dec = {k: envelope(decode(p)) for k, p in files.items() if k in ("song", "no_song")}
rep = {"cut": cut, "items": []}
for iid in ids:
    it = next(x for x in edl["items"] if x["id"] == iid)
    sp = it["speech"]
    base = TR(sp["at"])
    lit = [base + w["s"] - sp["in"] for w in sp["words"]]
    rows = []
    for k, w in enumerate(sp["words"]):
        a_ns, r_ns = onset(dec["no_song"], lit[k])
        a_s, r_s = onset(dec["song"], lit[k])
        rows.append({"word": w["w"], "lit": round(lit[k], 3), "audio_nosong": round(a_ns, 3), "rise_db_nosong": round(r_ns, 1),
                     "audio_song": round(a_s, 3), "audio_minus_lit_ms": round((a_ns - lit[k]) * 1000)})
    rep["items"].append({"id": iid, "name": it.get("name"), "year": it.get("year"), "rows": rows})
    print(f"\n{cut} {iid}  ({it.get('name')}, {it.get('year')})  speech.at {sp['at']} = edit {base:.3f}")
    for r in rows:
        print(f"  {r['word']:14s} lit {r['lit']:7.3f}  audio onset {r['audio_nosong']:7.3f} ({r['audio_minus_lit_ms']:+4d} ms, rise {r['rise_db_nosong']:4.1f} dB)  with-song file {r['audio_song']:7.3f}")
out = Path(sys.argv[2]) if len(sys.argv) > 2 and not sys.argv[2].startswith("--") else ROOT / "render/video/check/out" / f"{cut}-karaoke-final.json"
out.write_text(json.dumps(rep, indent=1))
print("wrote", out)

# ---- every speech window: the encoded no-song file against the SOURCE clip audio (waveform cross-correlation, +-0.3 s search)
from scipy.signal import correlate  # noqa: E402
x_ns = decode(files["no_song"])
cues = json.loads(subprocess.run(["python3", str(ROOT / "render/video/render.py"), "cues", cut, "--json"], capture_output=True, text=True).stdout)
lags = []
print("\nspeech windows: encoded no-song file vs the source clip audio (lag of the best waveform match, + = the file is late)")
for c in cues:
    dur = c["src_out"] - c["src_in"]
    ref = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{c['src_in']:.3f}", "-t", f"{dur:.3f}", "-i", str(ROOT / c["src"]), "-map", "0:a:0",
                                        "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, "<f4").astype(np.float64)
    i0 = int(round((c["edit_in"] - 0.3) * SR)); i1 = int(round((c["edit_out"] + 0.3) * SR))
    seg = x_ns[max(0, i0):i1]
    n = min(len(ref), int(0.9 * len(ref)))
    k = len(ref) // 20
    r = ref[k:k + n]                                      # a 90 % core of the source window (clear of the fades)
    cc = correlate(seg, r, mode="valid", method="fft")
    j = int(np.argmax(cc))
    lag = (max(0, i0) + j - (int(round(c["edit_in"] * SR)) + k)) / SR * 1000
    peak = float(cc[j] / (np.linalg.norm(r) * np.linalg.norm(seg[j:j + len(r)]) + 1e-12))
    lags.append({"id": c["id"], "lag_ms": round(lag, 2), "norm_corr": round(peak, 3)})
    print(f"  {c['id']:16s} {c['edit_in']:7.3f}-{c['edit_out']:7.3f}  lag {lag:+6.2f} ms  (normalised correlation {peak:.2f})")
rep["source_lags"] = lags
Path(sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith("--") else ROOT / "render/video/check/out" / f"{cut}-karaoke-final.json").write_text(json.dumps(rep, indent=1))
