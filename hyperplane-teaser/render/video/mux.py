#!/usr/bin/env python3
"""Mux a silent H.264 video and a WAV into the final MP4, measuring the encoded loudness and true peak.

    python3 render/video/mux.py --video silent.mp4 --wav song/mix-short-song.wav --out out/hyperplane-brutal-teaser-9x16.mp4

- Video stream copy (H.264 as rendered); audio AAC-LC 256k, 48 kHz stereo; +faststart.
- The audio is padded/trimmed to exactly the video's length (frames / fps) so picture and sound end together.
- The encoded file's integrated loudness and true peak are measured with ffmpeg `ebur128=peak=true`
  (4x oversampled). AAC overshoots the WAV's true peak, so while TP > --tp-max (default -1 dBTP) the
  gain is lowered by the excess plus a 0.1 dB margin and the audio is re-encoded.
- A/V sync: the encoded audio is decoded and cross-correlated with the WAV; the offset is reported (0 = sample-exact).
Prints the final LUFS / dBTP (and a MUX_RESULT JSON line).
"""
import argparse
import json
import os
import re
import subprocess
import sys
from fractions import Fraction
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import correlate

SR = 48000


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"mux.py: command failed: {' '.join(map(str, cmd))}\n{r.stderr[-1500:]}")
    return r


def probe_video(path):
    r = run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries",
             "stream=codec_name,profile,width,height,pix_fmt,r_frame_rate,avg_frame_rate,nb_read_packets,duration",
             "-of", "json", str(path)])
    st = json.loads(r.stdout)["streams"]
    if not st:
        sys.exit(f"mux.py: no video stream in {path}")
    v = st[0]
    fps = Fraction(v.get("avg_frame_rate") or v["r_frame_rate"])
    if fps == 0:
        fps = Fraction(v["r_frame_rate"])
    frames = int(v.get("nb_read_packets") or 0)
    dur = float(frames / fps) if frames else float(v["duration"])
    a = json.loads(run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index",
                        "-of", "json", str(path)]).stdout).get("streams", [])
    return {"codec": v["codec_name"], "profile": v.get("profile"), "size": f"{v['width']}x{v['height']}",
            "pix_fmt": v.get("pix_fmt"), "fps": float(fps), "frames": frames, "duration": dur, "has_audio": bool(a)}


def measure(path):
    """Integrated loudness, LRA and true peak of the file's first audio stream, via ffmpeg ebur128=peak=true."""
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-map", "0:a:0",
                        "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True)
    err = r.stderr
    k = err.rfind("Summary:")
    if r.returncode != 0 or k < 0:
        sys.exit(f"mux.py: ebur128 measurement failed:\n{err[-1500:]}")
    s = err[k:]
    I = float(re.search(r"I:\s+(-?[\d.]+|-inf) LUFS", s).group(1))
    lra = float(re.search(r"LRA:\s+(-?[\d.]+) LU", s).group(1))
    tp = float(re.search(r"True peak:\s+Peak:\s+(-?[\d.]+|-inf) dBFS", s).group(1))
    return I, lra, tp


def encode(video, wav, out, gain_db, n_samples, bitrate):
    af = f"volume={gain_db:.3f}dB,apad=whole_len={n_samples},atrim=end_sample={n_samples}"
    run(["ffmpeg", "-y", "-v", "error", "-nostdin", "-i", str(video), "-i", str(wav),
         "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-af", af,
         "-c:a", "aac", "-b:a", bitrate, "-ar", str(SR), "-ac", "2",
         "-movflags", "+faststart", "-f", "mp4", str(out)])


def sync_offset(mp4, wav, n_samples, max_lag=4800):
    """Lag (samples) of the MP4's decoded audio relative to the WAV; 0 means sample-aligned."""
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(mp4), "-map", "0:a:0", "-ac", "1", "-ar", str(SR),
                        "-f", "f32le", "-"], capture_output=True)
    enc = np.frombuffer(r.stdout, dtype="<f4").astype(np.float64)
    ref, _ = sf.read(str(wav), dtype="float64", always_2d=True)
    ref = ref.mean(axis=1)[:n_samples]
    n = min(len(enc), len(ref), 60 * SR)
    if n < SR // 10 or not np.any(ref[:n]):
        return None, len(enc)
    c = correlate(enc[:n], ref[:n], mode="full", method="fft")
    mid = n - 1
    lo, hi = max(0, mid - max_lag), min(len(c), mid + max_lag + 1)
    return int(np.argmax(c[lo:hi]) + lo - mid), len(enc)


def mux(video, wav, out, tp_max=-1.0, bitrate="256k", max_iter=8, margin_db=0.1):
    video, wav, out = Path(video), Path(wav), Path(out)
    v = probe_video(video)
    if v["codec"] != "h264":
        print(f"  WARNING: video codec is {v['codec']}, not h264 (it is stream-copied as is)")
    if v["has_audio"]:
        print("  note: the video already has an audio stream; it is dropped")
    info = sf.info(str(wav))
    if info.samplerate != SR:
        sys.exit(f"mux.py: {wav} is {info.samplerate} Hz, expected {SR}")
    n = int(round(v["duration"] * SR))
    if abs(info.frames - n) > SR / v["fps"]:
        print(f"  WARNING: WAV is {info.frames / SR:.4f}s but the video is {v['duration']:.4f}s;"
              f" audio is {'padded' if info.frames < n else 'trimmed'} to the video")
    print(f"[mux] {video.name} ({v['size']} {v['codec']} {v['profile']} {v['pix_fmt']}, {v['frames']} frames"
          f" @ {v['fps']:.3f} = {v['duration']:.4f}s) + {wav.name} -> {out}")
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_name(out.stem + ".tmp.mp4")
    gain = 0.0
    try:
        for i in range(1, max_iter + 1):
            encode(video, wav, tmp, gain, n, bitrate)
            I, lra, tp = measure(tmp)
            ok = tp <= tp_max
            print(f"  pass {i}: gain {gain:+.2f} dB -> I {I:.1f} LUFS, TP {tp:+.1f} dBTP, LRA {lra:.1f} LU"
                  f" {'OK' if ok else f'> {tp_max} dBTP, lowering'}")
            if ok:
                break
            gain -= (tp - tp_max) + margin_db
        else:
            sys.exit(f"mux.py: true peak still {tp} dBTP after {max_iter} passes")
        os.replace(tmp, out)
    finally:
        if tmp.exists():
            tmp.unlink()
    off, enc_len = sync_offset(out, wav, n)
    a = json.loads(run(["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries",
                        "stream=codec_name,profile,sample_rate,channels,bit_rate,duration,start_time",
                        "-of", "json", str(out)]).stdout)["streams"][0]
    res = {"out": str(out), "lufs": I, "true_peak_dbtp": tp, "lra_lu": lra, "gain_db": round(gain, 2),
           "passes": i, "video": v, "audio": a, "decoded_samples": enc_len, "expected_samples": n,
           "sync_offset_samples": off, "size_bytes": out.stat().st_size}
    print(f"[mux] FINAL {out.name}: {I:.1f} LUFS integrated, {tp:+.1f} dBTP true peak (LRA {lra:.1f} LU,"
          f" gain {gain:+.2f} dB, {i} pass{'es' if i > 1 else ''}); audio {a.get('codec_name')} {a.get('profile')}"
          f" {a.get('sample_rate')} Hz {a.get('channels')} ch {int(a.get('bit_rate', 0)) // 1000} kb/s;"
          f" decoded {enc_len} / expected {n} samples; A/V offset {off} samples")
    return res


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--video", required=True, help="silent H.264 video")
    ap.add_argument("--wav", required=True, help="48 kHz WAV from mix.py")
    ap.add_argument("--out", required=True, help="output .mp4")
    ap.add_argument("--tp-max", type=float, default=-1.0, help="max true peak of the encoded audio, dBTP (default -1.0)")
    ap.add_argument("--bitrate", default="256k")
    ap.add_argument("--max-iter", type=int, default=8)
    args = ap.parse_args()
    res = mux(args.video, args.wav, args.out, tp_max=args.tp_max, bitrate=args.bitrate, max_iter=args.max_iter)
    print("MUX_RESULT " + json.dumps(res))


if __name__ == "__main__":
    main()
