#!/usr/bin/env python3
"""Verify the rev3 deliverables of one cut on the ENCODED files. Usage: verify_final3.py <long3|short3> [out.json]
(rev2's verify_final.py with the drop test changed: rev3 has no white flash before the drop, so the drop frame is the largest
frame-to-frame change within +-3 frames of hb:0 and the check also asserts that no frame within +-0.5 s is a flash.)
ffprobe, ebur128 (I, LRA, TP), video md5, last audible music sample (song time), song alignment (cross-correlation),
no-song silence outside speech, clean dip, drop frames vs downbeat, burst at the instrumental downbeat, last frame vs cover,
splice (short) sample steps / RMS / onset."""
import sys, json, re, subprocess, math
from pathlib import Path
import numpy as np
from scipy.signal import correlate
from PIL import Image

ROOT = Path("/home/user/hyperplane-teaser")
sys.path.insert(0, str(ROOT / "render/video"))
from timeref import TimeRef  # noqa: E402

SR = 48000
FPS = 30
cut = sys.argv[1]
edl = json.loads((ROOT / f"render/video/edl/{cut}.json").read_text())
TR = TimeRef(edl)
files = {k: ROOT / v for k, v in edl["outputs"].items()}
segs = edl["song"]["segments"]
DUR = edl["duration"]
NFR = int(round(DUR * FPS))


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def ffprobe(p):
    r = run(["ffprobe", "-v", "error", "-count_frames", "-show_entries",
             "stream=index,codec_type,codec_name,profile,width,height,pix_fmt,r_frame_rate,avg_frame_rate,nb_read_frames,duration,"
             "start_time,sample_rate,channels,bit_rate,color_space,color_primaries,color_transfer,color_range:format=duration,size,bit_rate",
             "-of", "json", str(p)])
    j = json.loads(r.stdout)
    v = [s for s in j["streams"] if s["codec_type"] == "video"][0]
    a = [s for s in j["streams"] if s["codec_type"] == "audio"][0]
    head = open(p, "rb").read(1 << 16)
    faststart = head.find(b"moov") >= 0 and (head.find(b"mdat") < 0 or head.find(b"moov") < head.find(b"mdat"))
    return {"video": v, "audio": a, "format": j["format"], "faststart": faststart}


def ebur(p):
    r = run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(p), "-map", "0:a:0", "-af", "ebur128=peak=true", "-f", "null", "-"])
    s = r.stderr[r.stderr.rfind("Summary:"):]
    I = float(re.search(r"I:\s+(-?[\d.]+|-inf) LUFS", s).group(1))
    lra = float(re.search(r"LRA:\s+(-?[\d.]+) LU", s).group(1))
    tp = float(re.search(r"True peak:\s+Peak:\s+(-?[\d.]+|-inf) dBFS", s).group(1))
    return {"I_lufs": I, "LRA_lu": lra, "TP_dbtp": tp}


def decode(p, ch=2):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-map", "0:a:0", "-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"],
                       capture_output=True)
    return np.frombuffer(r.stdout, dtype="<f4").astype(np.float64).reshape(-1, ch)


def stream_md5(p, sel):
    r = run(["ffmpeg", "-v", "error", "-i", str(p), "-map", sel, "-c", "copy", "-f", "md5", "-"])
    return r.stdout.strip().replace("MD5=", "")


def frames_rgb(p, idx, w=1080, h=1920):
    sel = "+".join(f"eq(n\\,{i})" for i in idx)
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-vf", f"select='{sel}',scale={w}:{h}", "-vsync", "0",
                        "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
    return np.frombuffer(r.stdout, np.uint8).reshape(-1, h, w, 3)


def edit_to_song(e):
    for sg in reversed(segs):
        if e >= sg["at"] - 1e-9:
            return e - sg["at"] + sg["in_s"]
    return e + segs[0]["in_s"]


def song_to_edit(s):
    for sg in segs:
        if sg["in_s"] - 1e-9 <= s <= sg["out_s"] + 1e-9:
            return s - sg["in_s"] + sg["at"]
    return None


def db(x):
    return 20 * math.log10(max(float(x), 1e-12))


cues = json.loads(run(["python3", str(ROOT / "render/video/render.py"), "cues", cut, "--json"]).stdout)
speech = [(c["edit_in"], c["edit_out"]) for c in cues]
song_full = decode(ROOT / "song/brutal.wav").mean(axis=1)
rep = {"cut": cut, "duration": DUR, "frames_expected": NFR, "speech_windows": [[c["id"], round(c["edit_in"], 3), round(c["edit_out"], 3)] for c in cues], "files": {}}
dec = {}
for k, p in files.items():
    pr = ffprobe(p)
    v, a = pr["video"], pr["audio"]
    m = ebur(p)
    x = decode(p)
    dec[k] = x
    d = {"path": str(p.relative_to(ROOT)), "size_mb": round(int(pr["format"]["size"]) / 1e6, 1),
         "video": f'{v["codec_name"]} {v.get("profile")} {v["width"]}x{v["height"]} {v["pix_fmt"]} {v["r_frame_rate"]} (avg {v["avg_frame_rate"]}) '
                  f'{v["nb_read_frames"]} frames {float(v["duration"]):.3f}s start {v.get("start_time")}, '
                  f'{v.get("color_space")}/{v.get("color_primaries")}/{v.get("color_transfer")}/{v.get("color_range")}, '
                  f'{int(v["bit_rate"]) / 1e6:.1f} Mb/s',
         "audio": f'{a["codec_name"]} {a.get("profile")} {a["sample_rate"]} Hz {a["channels"]} ch {int(a["bit_rate"]) // 1000} kb/s '
                  f'{float(a["duration"]):.3f}s start {a.get("start_time")}',
         "w": v["width"], "h": v["height"], "fps": v["r_frame_rate"], "avg_fps": v["avg_frame_rate"], "frames": int(v["nb_read_frames"]),
         "faststart": pr["faststart"], "decoded_samples": len(x), **m,
         "video_md5": stream_md5(p, "0:v:0"), "audio_md5": stream_md5(p, "0:a:0")}
    lvl = np.abs(x).max(axis=1)
    above = np.nonzero(lvl > 10 ** (-60 / 20))[0]
    last = above[-1] / SR if len(above) else None
    d["last_above_-60dBFS_edit"] = round(last, 3) if last is not None else None
    if k != "no_song":
        d["last_above_-60dBFS_song"] = round(edit_to_song(last), 3)
        # music level after song 80.40 (the fade): RMS of the last 0.5 s of the file
        d["rms_last_0.5s_dbfs"] = round(db(np.sqrt(np.mean(x[-SR // 2:] ** 2))), 1)
        mono = x.mean(axis=1)
        lags = []
        for sg in segs:
            e0, e1 = sg["at"], sg["at"] + sg["out_s"] - sg["in_s"]
            for w0 in np.arange(e0 + 0.5, e1 - 2.5, 3.0):
                w1 = w0 + 2.0
                if any(s < w1 + 0.3 and t > w0 - 0.3 for s, t in speech):
                    continue
                i0, i1 = int(w0 * SR), int(w1 * SR)
                ref0 = int(round((w0 - sg["at"] + sg["in_s"]) * SR))
                ref = song_full[ref0 - 2400: ref0 + (i1 - i0) + 2400]
                c = correlate(ref, mono[i0:i1], mode="valid", method="fft")
                lags.append((round(float(w0), 1), int(np.argmax(c)) - 2400))
        d["song_lag_samples"] = lags
    else:
        mask = np.ones(len(x), bool)
        for s, t in speech:
            mask[max(0, int((s - 0.2) * SR)):int((t + 0.2) * SR)] = False
        d["peak_outside_speech_dbfs"] = round(db(np.abs(x[mask]).max()), 1) if mask.any() else None
    rep["files"][k] = d

# clean dip (long)
if "clean" in files:
    a0, a1 = edl["song"]["clean"]["dips"][0]
    e0, e1 = song_to_edit(a0), song_to_edit(a1)
    xs, xc = dec["song"], dec["clean"]
    i0, i1 = int(e0 * SR), int(e1 * SR)
    rs, rc = math.sqrt(np.mean(xs[i0:i1] ** 2)), math.sqrt(np.mean(xc[i0:i1] ** 2))
    diff = np.abs(xs - xc).max(axis=1)
    far = np.ones(len(diff), bool); far[max(0, i0 - int(0.1 * SR)):i1 + int(0.1 * SR)] = False
    rep["clean_dip"] = {"song": [a0, a1], "edit": [round(e0, 3), round(e1, 3)], "song_rms_dbfs": round(db(rs), 1),
                        "clean_rms_dbfs": round(db(rc), 1), "depth_db": round(db(rs) - db(rc), 1),
                        "rms_diff_elsewhere_dbfs": round(db(np.sqrt(np.mean((xs - xc)[np.repeat(far[:, None], 2, 1)] ** 2))), 1)}

# 1 ms energy envelope of the with-song file
x = dec["song"].mean(axis=1)
hop = SR // 1000
nh = len(x) // hop
e = np.add.reduceat(x[:nh * hop] ** 2, np.arange(0, nh * hop, hop))
e5 = np.convolve(e, np.ones(5), "same")
edb = 10 * np.log10(e5 + 1e-12)


def onset_near(t, win=0.08):
    lo, hi = max(0, int((t - win) * 1000)), int((t + win) * 1000)
    rise = edb[lo + 10:hi + 10] - edb[lo:hi]
    k = int(np.argmax(rise))
    return (lo + k + 5) / 1000.0, round(float(rise[k]), 1)


# drop (song 19.232). rev3: no flash. The drop frame = the largest frame-to-frame change within +-3 frames of the downbeat; a flash
# would be a frame with mean luma > 235 anywhere within +-0.5 s.
drop = song_to_edit(19.232)
on, rise = onset_near(drop)
f_drop = int(math.ceil(drop * FPS - 1e-9))
fr = list(range(f_drop - 4, f_drop + 4))
raw = frames_rgb(files["song"], fr, 108, 192)
mean = {fi: [int(c) for c in raw[j].reshape(-1, 3).mean(axis=0)] for j, fi in enumerate(fr)}
mad = {fr[j]: round(float(np.abs(raw[j].astype(np.float32) - raw[j - 1].astype(np.float32)).mean()), 1) for j in range(1, len(fr))}
big_drop = max(mad, key=lambda f: mad[f])
fr2 = list(range(f_drop - 15, f_drop + 16))
raw2 = frames_rgb(files["song"], fr2, 108, 192)
luma2 = {fi: round(float(raw2[j].mean()), 1) for j, fi in enumerate(fr2)}
rep["drop"] = {"downbeat_edit": round(drop, 4), "first_frame_at_or_after": f_drop, "its_start": round(f_drop / FPS, 4),
               "audio_onset_edit": round(on, 4), "onset_rise_db": rise, "mean_rgb": mean, "mad_vs_previous": mad,
               "largest_change_frame": big_drop, "largest_change_minus_downbeat_ms": round((big_drop / FPS - drop) * 1000, 1),
               "max_mean_luma_pm15f": max(luma2.values()), "flash_frames_gt235": [f for f, v in luma2.items() if v > 235]}

# instrumental downbeat (hb:112 = song 73.4255): the burst
inst = TR("hb:112")
on2, rise2 = onset_near(inst)
f_i = int(math.ceil(inst * FPS - 1e-9))
fr = list(range(f_i - 3, f_i + 4))
raw = frames_rgb(files["song"], fr, 108, 192).astype(float)
lum = {fi: round(float(raw[j].mean()), 1) for j, fi in enumerate(fr)}
jumps = {fr[j]: round(lum[fr[j]] - lum[fr[j - 1]], 1) for j in range(1, len(fr))}
big = max(jumps, key=lambda f: jumps[f])
rep["burst"] = {"downbeat_edit": round(inst, 4), "song": round(TR.song_at(inst), 4), "audio_onset_edit": round(on2, 4),
                "onset_rise_db": rise2, "mean_luma_by_frame": lum, "largest_jump_frame": big,
                "largest_jump_minus_downbeat_ms": round((big / FPS - inst) * 1000, 1)}

# last frame vs the cover (cover 1080x1080 at x 0, y 400; outside it flat cream)
last = frames_rgb(files["song"], [NFR - 1])[0].astype(np.float32)
n = 1080
cov = np.asarray(Image.open(ROOT / "brand/hyperplane-cover-3000.png").convert("RGB").resize((n, n), Image.LANCZOS), np.float32)
D = np.abs(last[400:400 + n, 0:n] - cov).mean(axis=2)
out = last.copy(); out[400:400 + n] = np.array([242, 235, 221], np.float32)
outside = float(np.abs(out - np.array([242, 235, 221], np.float32)).mean())
rep["cover"] = {"frame": NFR - 1, "t": round((NFR - 1) / FPS, 4), "mean_absdiff": round(float(D.mean()), 3),
                "pct_gt_32": round(100 * float((D > 32).mean()), 3), "p99": round(float(np.percentile(D, 99)), 1),
                "outside_vs_cream": round(outside, 3)}
Image.fromarray(np.clip(D * 4, 0, 255).astype(np.uint8)).save(ROOT / "render/video/check/out" / f"{cut}-coverdiff.png")
# the hold: which frames are identical to the last (the static cover hold)
fh0 = TR(edl["finalHold"][0])
rep["cover"]["finalHold_from_edit"] = round(fh0, 3)

# splice (short): around each inner segment boundary
if len(segs) > 1:
    rep["splices"] = []
    xs = dec["song"]
    for sg in segs[1:]:
        c = TR(sg["at"]) if isinstance(sg["at"], str) else sg["at"]
        ic = int(round(c * SR))
        w = int(0.015 * SR)
        steps = np.abs(np.diff(xs[ic - w:ic + w], axis=0)).max()
        ref = np.abs(np.diff(xs[ic - 2 * SR:ic - w], axis=0)).max(axis=1)
        p999 = float(np.percentile(ref, 99.9))
        rms = []
        for t0 in np.arange(-0.05, 0.05, 0.01):
            i0 = ic + int(t0 * SR)
            rms.append(round(db(np.sqrt(np.mean(xs[i0:i0 + SR // 100] ** 2))), 1))
        on3, r3 = onset_near(c + 0.03, 0.03)
        rep["splices"].append({"edit": round(c, 3), "song_out": round(segs[segs.index(sg) - 1]["out_s"], 3), "song_in": sg["in_s"],
                               "max_step_pm15ms": round(float(steps), 3), "p99.9_step_2s_before": round(p999, 3),
                               "rms10ms_-50..+50ms": rms, "onset_after_cut": round(on3, 4), "onset_rise_db": r3})
print(json.dumps(rep, indent=1))
if len(sys.argv) > 2:
    Path(sys.argv[2]).write_text(json.dumps(rep, indent=1))
