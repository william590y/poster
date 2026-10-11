#!/usr/bin/env python3
"""Audio mix for the Hyperplane x "brutal" videos (short teaser and long version), driven by an EDL.

    python3 render/video/mix.py short                     # edl/short.json -> two WAVs
    python3 render/video/mix.py short --video silent.mp4  # ... then mux both deliverables into out/ (see mux.py)
    python3 render/video/mix.py path/to/edl.json --wav-dir DIR [--out-dir DIR] [--video V]

Builds two (three) 48 kHz stereo WAVs:
  song/mix-<name>-song.wav    the song segment(s) + clip speech, song ducked under each speech span
  song/mix-<name>-clean.wav   the same with the explicit word dipped (only when the EDL's song has "clean")
  song/mix-<name>-speech.wav  clip speech only (for the "no-song" deliverable)
They stay in song/ because they contain the song or the clips (song/*.wav is git-ignored).
Each is normalized to about -12 LUFS integrated (pyloudnorm), with a gentle look-ahead true-peak
limiter so normalizing doesn't push peaks over; mux.py then checks the *encoded* AAC and lowers the
gain until it's <= -1 dBTP.

Reads either EDL dialect (everything else in the file is ignored; see parse_edl()):
  engine (what teaser.html reads, e.g. edl/short.json):
    "audio": {"song", "songStart", [optional] "songEnd" (default songStart + duration), "fadeOut" (default 0.2),
              "fadeIn" (0.01), "songAt" (edit time the song starts, 0), "songGainDb", "maxSongEnd"}
    clip items: {"src", "in", "t0", "t1", "speed", "audio": {"in", "out", [optional] "gain_db", "duck_db", "fade_ms", "mono",
                 "peak_rel_db" (a per-clip true-peak limiter this many dB over the clip's leveled loudness)}}
      a clip with "audio" is heard: source second s plays at edit t0 + (s - in)/speed, like its picture.
      t0/t1 may be grid refs ("pre:8", "riff:3.5+0.02"), resolved exactly as teaser.html does.
  mixer: "song": {"file", "in_s", "out_s", "fade_out_s", [optional] "t0", "fade_in_s", "gain_db", "max_out_s"}
         or, for a spliced/segmented song: "song": {"file", "segments": [{"in_s", "out_s", "at"}, ...], "xfade_ms" (20),
           "xfade_shape" ("gain" | "power"), "bars" (a bars.json: inner splice points are checked against its bars/beats,
           "bar_tol_ms" 30), "fade_in_s", "fade_out_s", "gain_db", "max_out_s", "clean"}. Segment k plays song in_s..out_s
           starting at edit time "at" (a number or a grid ref); consecutive segments crossfade over xfade_ms centred on the
           splice (the audio either side of a splice runs on by xfade/2 so the sum stays continuous).
         "clean": {"dips": [[a, b], ...] (song seconds), "ramp_ms" (12), "depth_db" (null = silence), "mode" ("full" |
           "mid": dip only the centre channel)} also writes a clean
           variant, mix-<name>-clean.wav, with the song dipped over each window (ramps outside the window).
    clip items: {"file", "src_in", "src_out", "t0" (edit time the audio starts), "speech": true, [optional] "gain_db", ...}
  voice items (engine): {"type": "voice", "src", "at" (edit time of audio.in), "audio": {"in", "out", ...}}: speech with
    no picture of its own.
  Both: "duration" (the WAVs are exactly round(duration*48000) samples); "mix": overrides of DEFAULTS below,
  e.g. {"duck_db": 6, "speech_rel_lu": -3}; "outputs": {"song": "out/x.mp4", "no_song": "out/y.mp4"} for --video.
  An EDL named "short" may not play the song past 26.75 s (verse vocals start at 26.82; BUILD.md).
"""
import argparse
import json
import math
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.ndimage import minimum_filter1d
from scipy.signal import butter, lfilter, resample_poly, sosfilt

SR = 48000
ROOT = Path(__file__).resolve().parents[2]  # /home/user/hyperplane-teaser
EDL_DIR = Path(__file__).resolve().parent / "edl"

DEFAULTS = {
    "target_lufs": -12.0,       # integrated loudness of each WAV
    "speech_rel_lu": -4.0,      # speech loudness relative to the song's loud sections (95th pct short-term)
    "duck_db": 5.0,             # song duck under speech ("a few dB"); raised automatically if needed:
    "min_snr_lu": 10.0,         #   speech must sit at least this far above the (ducked) song under it
    "max_duck_db": 15.0,        #   but never duck more than this
    "duck_ramp_ms": 120.0,      # raised-cosine ramp in/out of each duck (80-150 ms)
    "duck_merge_gap_s": 0.35,   # speech spans closer than this (plus the two ramps) share one duck
    "hpf_hz": 100.0,            # speech high-pass, 24 dB/oct
    "mud_hz": 250.0, "mud_db": -2.0, "mud_q": 1.0,                # small low-mid cut (phone boxiness)
    "presence_hz": 3200.0, "presence_db": 3.0, "presence_q": 0.9,  # presence lift
    "phase_rotate_hz": [150.0, 300.0],  # all-pass phase rotation: evens out asymmetric voice peaks (~1.5 dB less
                                        # peak for the same loudness), inaudible on its own; [] disables
    "comp_ref_lufs": -23.0,     # clips are leveled to this before the compressor, so the threshold is relative
    "comp_threshold_db": -27.0, "comp_ratio": 2.5, "comp_knee_db": 6.0,
    "comp_attack_ms": 8.0, "comp_release_ms": 120.0,
    "declick_ms": 15.0,         # raised-cosine fade at every clip cut point (10-20 ms)
    "limiter_ceiling_dbtp": -1.5,  # pre-encode true-peak ceiling (None/null disables the limiter)
    "limiter_attack_ms": 3.0, "limiter_release_ms": 60.0,
    "limiter_max_gr_db": 5.0,   # if reaching target_lufs would need more limiting than this, settle a bit quieter
    "speech_limiter_max_gr_db": None,  # the same cap for the speech-only (no-song) mix; None = limiter_max_gr_db
}

# Known voices in William's file (song time, s) — used only for warnings.
SONG_VOICE = {
    "brutal": [
        (17.50, 19.00, "Olivia's spoken line 'I want it to be, like, messy' (song 17.66-19.0); "
                       "BUILD.md: no clip speech after edit ~11.4 in the short cut"),
        # sung vocals (measured 10 Oct: whisper word times + the band's stop at 71.9): informational only since REVISION 2 (William: clip audio over the music, vocals included, is welcome; duck the music and caption the words)
        (26.80, 64.05, "sung vocals (verse 1, chorus, refrain to 'unrelentlessly upset')"),
        # r2: the refrain's vocal gap re-measured (mid-side energy, 300-3500 Hz, 40 ms windows on song/brutal.wav): 'upset' decays
        # to the band's level by ~64.1 and the pickup 'They' starts at 65.44 (this range began at 64.60, inside the gap)
        (65.40, 73.40, "sung vocals ('they say these are the golden years' to 'God, it's brutal out here')"),
        (80.60, 173.3, "sung vocals (verse 2 onwards)"),
    ],
}
DROP_SONG_S = {"brutal": 19.232}  # riff downbeat, measured (BUILD.md)


# ---------------------------------------------------------------- EDL: times and the two dialects
EPS = 1e-6
TIME_RE = re.compile(r"^([A-Za-z_][\w-]*):(-?[\d.]+)([+-][\d.]+)?$")
_TR = None   # timeref.TimeRef for hb:/song: refs (set by parse_edl)


def build_grids(edl):
    """Same as teaser.html buildGrid(): a list of times, or {origin, period, count, start, snap, tol}."""
    grids = {}
    for name, g in (edl.get("grids") or {}).items():
        if isinstance(g, list):
            grids[name] = [float(x) for x in g]
            continue
        out, k0, tol = [], g.get("start", 0), g.get("tol", 0.03)
        for i in range(int(g["count"])):
            x = g["origin"] + (k0 + i) * g["period"]
            near = [t for t in g.get("snap", []) if abs(t - x) <= tol]
            if near:
                x = min(near, key=lambda t: abs(t - x))
            out.append(round(x, 4))
        grids[name] = out
    return grids


def grid_at(grids, name, idx):
    """Same as teaser.html gridAt(): fractional index interpolates, out-of-range extrapolates."""
    if name not in grids:
        die(f'unknown beat grid "{name}"')
    g = grids[name]

    def at(k):
        if k < 0:
            return g[0] + k * (g[1] - g[0])
        if k >= len(g):
            return g[-1] + (k - len(g) + 1) * (g[-1] - g[-2])
        return g[k]
    i = math.floor(idx + EPS)
    f = idx - i
    return at(i) + (at(i + 1) - at(i)) * f if f > EPS else at(i)


def edit_time(v, grids, default=None):
    """Same as teaser.html T(): number | "grid:index[+-offset]" | numeric string | {"at": time, "off": s}."""
    if v is None:
        return default
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        m = TIME_RE.match(v)
        if not m:
            try:
                return float(v)
            except ValueError:
                die(f'bad time "{v}"')
        if m.group(1) in ("hb", "song") and m.group(1) not in grids and _TR is not None:   # rev2: song/hits.json beats, song seconds
            return _TR(v)
        return grid_at(grids, m.group(1), float(m.group(2))) + (float(m.group(3)) if m.group(3) else 0.0)
    if isinstance(v, dict):
        return edit_time(v.get("at"), grids) + float(v.get("off", 0))
    die(f"bad time {v!r}")


def parse_edl(edl, name):
    """Read either EDL dialect into (song, speech clips).
    engine (teaser.html): "audio": {"song", "songStart", [songEnd, fadeOut, fadeIn, songAt, songGainDb, maxSongEnd]};
        clip items {"src", "in", "t0", "speed", "audio": {"in", "out", [gain_db, duck_db, fade_ms, mono]}}: the clip's
        source second s plays at edit t0 + (s - in) / speed, exactly as the picture does. t0/t1 may be grid refs.
    mixer: "song": {"file", "in_s", "out_s", "fade_out_s", ...}; clip items {"file", "src_in", "src_out", "t0", "speech": true}.
    """
    grids = build_grids(edl)
    global _TR
    try:
        sys.path.insert(0, str(Path(__file__).resolve().parent)); from timeref import TimeRef
        _TR = TimeRef(edl)
    except Exception as e:  # noqa: BLE001
        warn(f"timeref unavailable ({e}); hb:/song: references will fail"); _TR = None
    duration = float(edl["duration"])
    if isinstance(edl.get("song"), dict):
        s = edl["song"]
        song = {"file": s["file"], "fade_out_s": s.get("fade_out_s"), "fade_in_s": s.get("fade_in_s"), "gain_db": s.get("gain_db"),
                "max_out_s": s.get("max_out_s"), "xfade_ms": s.get("xfade_ms"), "xfade_shape": s.get("xfade_shape"),
                "bars": s.get("bars"), "bar_tol_ms": s.get("bar_tol_ms"), "clean": s.get("clean")}
        if s.get("segments"):
            segs = s["segments"]
        else:
            segs = [{"in_s": s["in_s"], "out_s": s.get("out_s"), "at": s.get("t0")}]
    elif isinstance(edl.get("audio"), dict) and edl["audio"].get("song"):
        a = edl["audio"]
        song = {"file": a["song"], "fade_out_s": a.get("fadeOut"), "fade_in_s": a.get("fadeIn"), "gain_db": a.get("songGainDb"),
                "max_out_s": a.get("maxSongEnd"), "xfade_ms": None, "xfade_shape": None, "bars": None, "bar_tol_ms": None, "clean": None}
        segs = [{"in_s": a["songStart"], "out_s": a.get("songEnd"), "at": a.get("songAt")}]
    else:
        die("EDL has no song ('song' or 'audio.song')")
    song["segments"] = []
    for k, sg in enumerate(segs):
        at = edit_time(sg.get("at"), grids, 0.0 if k == 0 else None)
        if at is None:  # a later segment with no "at" follows on from the previous one
            p = song["segments"][-1]
            at = p["at"] + p["out_s"] - p["in_s"]
        i_s = float(sg["in_s"])
        o_s = float(sg["out_s"]) if sg.get("out_s") is not None else i_s + duration - at
        if o_s <= i_s:
            die(f"song segment {k}: out_s must be after in_s")
        song["segments"].append({"in_s": i_s, "out_s": o_s, "at": at})
    for k in range(1, len(song["segments"])):
        p, q = song["segments"][k - 1], song["segments"][k]
        gap = q["at"] - (p["at"] + p["out_s"] - p["in_s"])
        if abs(gap) > 1.5 / SR:
            warn(f"song segments {k - 1}->{k}: {gap * 1000:+.1f} ms {'gap' if gap > 0 else 'overlap'} at edit {q['at']:.3f} (splices should butt)")
    # legacy single-segment fields (summary, no-song offset)
    song["in_s"], song["out_s"], song["t0"] = song["segments"][0]["in_s"], song["segments"][-1]["out_s"], song["segments"][0]["at"]
    song["fade_out_s"] = float(song["fade_out_s"]) if song["fade_out_s"] is not None else 0.2
    song["fade_in_s"] = float(song["fade_in_s"]) if song["fade_in_s"] is not None else 0.01
    song["gain_db"] = float(song["gain_db"] or 0.0)
    song["xfade_ms"] = float(song["xfade_ms"] if song["xfade_ms"] is not None else 20.0)
    song["xfade_shape"] = song["xfade_shape"] or "gain"
    if song["max_out_s"] is None and name == "short":
        song["max_out_s"] = 26.75

    clips = []
    for it in edl.get("items", []):
        if it.get("type") not in ("clip", "voice") or it.get("speech") is False or it.get("enabled") is False:
            continue
        au, speed = it.get("audio"), float(it.get("speed") or 1.0)
        f = it.get("file") or it.get("src")
        if it.get("type") == "voice" and isinstance(au, dict):
            a_in, a_out = float(au["in"]), float(au["out"])
            t = edit_time(it.get("at", it.get("t0")), grids)
            opts = {k: v for k, v in au.items() if k in ("gain_db", "duck_db", "fade_ms", "mono", "hpf_hz", "peak_rel_db")}
        elif isinstance(au, dict) and "in" in au:
            a_in, a_out = float(au["in"]), float(au["out"])
            t = edit_time(it.get("t0"), grids, 0.0) + (a_in - float(it.get("in", a_in))) / speed
            opts = {k: v for k, v in it.items() if k in ("gain_db", "duck_db", "fade_ms", "mono", "hpf_hz", "peak_rel_db")}
            opts.update({k: v for k, v in au.items() if k in ("gain_db", "duck_db", "fade_ms", "mono", "hpf_hz", "peak_rel_db")})
        elif it.get("speech"):
            a_in, a_out = float(it["src_in"]), float(it["src_out"])
            t = edit_time(it["t0"], grids)
            opts = it
        else:
            continue
        clips.append({"id": it.get("id") or Path(f).stem, "file": f, "src_in": a_in, "src_out": a_out, "t_edit": t,
                      "speed": speed, "t1_item": edit_time(it.get("t1"), grids),
                      "gain_db": float(opts.get("gain_db") or 0.0), "duck_db": opts.get("duck_db"),
                      "fade_ms": opts.get("fade_ms"), "mono": opts.get("mono", True), "hpf_hz": opts.get("hpf_hz"),
                      "peak_rel_db": opts.get("peak_rel_db"),
                      # r5: "lcut" (s) in a clip's audio declares a deliberate L-cut (the last word runs on under the next item);
                      # the overrun warning below then fires only past that allowance
                      "lcut": float((au or {}).get("lcut", 0.0) if isinstance(au, dict) else 0.0)})
    return song, clips


# ---------------------------------------------------------------- helpers
def die(msg):
    print(f"mix.py: ERROR: {msg}", file=sys.stderr)
    sys.exit(2)


def warn(msg):
    print(f"  WARNING: {msg}")


def resolve(p, base=None):
    p = Path(p)
    if p.is_absolute():
        return p
    for b in ([base] if base else []) + [ROOT]:
        if (b / p).exists():
            return b / p
    return ROOT / p


def load_edl(arg):
    p = Path(arg)
    if not (p.suffix == ".json" or p.exists()):
        p = EDL_DIR / f"{arg}.json"
    if not p.exists():
        die(f"EDL not found: {p}")
    with open(p) as f:
        edl = json.load(f)
    return p.stem, edl, p.resolve()


def decode(path, start=None, dur=None, channels=2):
    """Decode any media to float64 (n, channels) at 48 kHz. Input seeking is sample-accurate when decoding."""
    cmd = ["ffmpeg", "-v", "error", "-nostdin"]
    if start is not None:
        cmd += ["-ss", f"{start:.6f}"]
    if dur is not None:
        cmd += ["-t", f"{dur:.6f}"]
    cmd += ["-i", str(path), "-vn", "-map", "0:a:0", "-af", "aresample=resampler=soxr:precision=28",
            "-ac", str(channels), "-ar", str(SR), "-f", "f32le", "-"]
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0:
        die(f"ffmpeg could not decode {path}: {r.stderr.decode()[-400:]}")
    return np.frombuffer(r.stdout, dtype="<f4").astype(np.float64).reshape(-1, channels)


def db(x):
    return 20 * math.log10(max(float(x), 1e-12))


def sample_peak_db(x):
    return db(np.max(np.abs(x))) if len(x) else -240.0


def true_peak_db(x, os_factor=4):
    if not len(x):
        return -240.0
    return db(np.max(np.abs(resample_poly(x, os_factor, 1, axis=0))))


# BS.1770 K-weighting at 48 kHz (the standard's published coefficients).
_K1 = ([1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585])
_K2 = ([1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621])


def kweighted_power(x):
    """Per-sample K-weighted power summed over channels (for windowed loudness)."""
    y = lfilter(*_K2, lfilter(*_K1, x, axis=0), axis=0)
    return np.sum(y * y, axis=1)


def window_loudness(power, win_s, hop_s=0.1):
    """Ungated loudness (LUFS) of sliding windows: -0.691 + 10 log10(mean K-weighted power)."""
    w, h = int(win_s * SR), int(hop_s * SR)
    if len(power) < w:
        return np.array([-0.691 + 10 * np.log10(np.mean(power) + 1e-20)]) if len(power) else np.array([-120.0])
    c = np.concatenate([[0.0], np.cumsum(power)])
    starts = np.arange(0, len(power) - w + 1, h)
    return -0.691 + 10 * np.log10((c[starts + w] - c[starts]) / w + 1e-20)


_METER = pyln.Meter(SR)


def lufs(x):
    """Integrated loudness (BS.1770-4, gated) via pyloudnorm; ungated fallback for clips under 0.4 s."""
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = x[:, None]
    if len(x) < int(0.4 * SR) + 1:
        return float(window_loudness(kweighted_power(x), len(x) / SR)[0]) if len(x) else -120.0
    with np.errstate(divide="ignore"):
        v = _METER.integrated_loudness(x)
    return float(v) if np.isfinite(v) else -120.0


def peaking_sos(f0, gain_db, q):
    """RBJ cookbook peaking EQ biquad as one SOS row."""
    A = 10 ** (gain_db / 40)
    w0 = 2 * math.pi * f0 / SR
    alpha = math.sin(w0) / (2 * q)
    b = [1 + alpha * A, -2 * math.cos(w0), 1 - alpha * A]
    a = [1 + alpha / A, -2 * math.cos(w0), 1 - alpha / A]
    return np.array([[b[0] / a[0], b[1] / a[0], b[2] / a[0], 1.0, a[1] / a[0], a[2] / a[0]]])


def allpass_sos(f0, q):
    """RBJ cookbook 2nd-order all-pass (flat magnitude, phase rotates through 180 deg at f0)."""
    w0 = 2 * math.pi * f0 / SR
    alpha, c = math.sin(w0) / (2 * q), math.cos(w0)
    b = [1 - alpha, -2 * c, 1 + alpha]
    a = [1 + alpha, -2 * c, 1 - alpha]
    return np.array([[b[0] / a[0], b[1] / a[0], b[2] / a[0], 1.0, a[1] / a[0], a[2] / a[0]]])


def raised_cos(n):
    return 0.5 - 0.5 * np.cos(np.pi * (np.arange(n) + 0.5) / n) if n > 0 else np.zeros(0)


# ---------------------------------------------------------------- dynamics
def compress(x, thr_db, ratio, knee_db, att_ms, rel_ms):
    """Gentle feed-forward compressor: 5 ms RMS detector, soft knee, attack/release smoothing on 1 ms blocks."""
    n = len(x)
    B = SR // 1000
    p = np.mean(x * x, axis=1)
    c = np.concatenate([[0.0], np.cumsum(p)])
    w = int(0.005 * SR)
    idx = np.arange(n)
    lo, hi = np.clip(idx - w // 2, 0, n), np.clip(idx + w // 2 + 1, 0, n)
    rms = (c[hi] - c[lo]) / np.maximum(hi - lo, 1)
    nb = -(-n // B)
    rms = np.pad(rms, (0, nb * B - n), mode="edge").reshape(nb, B).max(axis=1)
    lvl = 10 * np.log10(rms + 1e-20)
    over = lvl - thr_db
    s = 1 - 1 / ratio
    gr = np.where(over <= -knee_db / 2, 0.0,
                  np.where(over >= knee_db / 2, over * s, s * (over + knee_db / 2) ** 2 / (2 * knee_db)))
    a_att, a_rel = math.exp(-1 / att_ms), math.exp(-1 / rel_ms)  # per 1 ms block
    env = np.empty(nb)
    g = 0.0
    for i, t in enumerate(gr):
        a = a_att if t > g else a_rel
        g = a * g + (1 - a) * t
        env[i] = g
    gr_s = np.interp(idx, (np.arange(nb) + 0.5) * B, env)
    return x * (10 ** (-gr_s / 20))[:, None], float(env.max(initial=0.0)), gr_s


def _fwd_min(a, W):
    """out[j] = min(a[j .. j+W-1]) (past the end counts as 1.0)."""
    if W <= 1:
        return a.copy()
    padded = np.concatenate([a, np.ones(W)])
    return minimum_filter1d(padded, size=W, mode="nearest")[W // 2: W // 2 + len(a)]


def _trail_mean(a, L):
    """out[k] = mean(a[k-L+1 .. k]) (before the start counts as 1.0)."""
    if L <= 1:
        return a.copy()
    c = np.concatenate([[0.0], np.cumsum(np.concatenate([np.ones(L), a]))])
    return (c[L + 1:] - c[1:-L])[: len(a)] / L


def peak_envelope(x, os_factor=4):
    """Per-sample true-peak envelope: max |x| over the 4x-oversampled points in [n-1, n+1)."""
    n = len(x)
    xo = np.abs(resample_poly(x, os_factor, 1, axis=0)).max(axis=1)
    xo = np.pad(xo, (0, n * os_factor - len(xo)))[: n * os_factor]
    pk = xo.reshape(n, os_factor).max(axis=1)
    return np.maximum(pk, np.concatenate([[0.0], pk[:-1]]))


def limit(x, ceiling_dbtp, att_ms, rel_ms, pk=None):
    """Look-ahead true-peak limiter (offline, so the look-ahead costs no latency).
    need[n] = gain sample n needs so its 4x-oversampled peak sits at the ceiling.
    attack:  forward running-min over A samples, then an A-sample trailing mean -> a linear ramp down that
             finishes exactly at each peak (the mean's window lies inside the min's, so gain <= need).
    release: exponential recovery (time constant rel_ms) computed on 32-sample blocks, never above the attack curve.
    Returns (y, max gain reduction dB)."""
    n = len(x)
    if n == 0:
        return x, 0.0
    if pk is None:
        pk = peak_envelope(x)
    need = np.minimum(1.0, 10 ** (ceiling_dbtp / 20) / np.maximum(pk, 1e-12))
    if need.min() >= 1.0:
        return x.copy(), 0.0
    A = max(1, int(round(att_ms * 1e-3 * SR)))
    att = _trail_mean(_fwd_min(need, A), A)
    B = 32
    nb = -(-n // B)
    v = (1.0 - np.pad(att, (0, nb * B - n), constant_values=1.0).reshape(nb, B).min(axis=1)).tolist()
    a = math.exp(-B / (rel_ms * 1e-3 * SR))
    u, acc = [0.0] * nb, 0.0
    for k in range(nb):  # gain reduction u = 1 - g: jumps up to v, decays exponentially
        acc = v[k] if v[k] > a * acc else a * acc
        u[k] = acc
    g = np.minimum(att, np.interp(np.arange(n), np.arange(nb) * B, 1.0 - np.asarray(u)))
    return x * g[:, None], -db(g.min())


def normalize(x, target, cfg, label, max_gr=None):
    """Gain to `target` LUFS integrated, limiting to the true-peak ceiling; iterate since limiting lowers loudness.
    max_gr overrides cfg["limiter_max_gr_db"] (the speech-only mix uses cfg["speech_limiter_max_gr_db"])."""
    ceiling = cfg["limiter_ceiling_dbtp"]
    max_gr = float(cfg["limiter_max_gr_db"] if max_gr is None else max_gr)
    L0 = lufs(x)
    if L0 <= -100:
        die(f"{label}: the mix is silent")
    gain = target - L0
    y, gr, capped = x, 0.0, False
    pk0 = peak_envelope(x) if ceiling is not None else None
    for _ in range(8):
        k = 10 ** (gain / 20)
        y = x * k
        gr = 0.0
        if ceiling is not None:
            y, gr = limit(y, ceiling, cfg["limiter_attack_ms"], cfg["limiter_release_ms"], pk=pk0 * k)
        if gr > max_gr + 0.05:
            gain -= gr - max_gr
            capped = True
            continue
        L = lufs(y)
        if abs(L - target) < 0.05 or capped:
            break
        gain += target - L
    info = {"lufs_before": round(L0, 2), "gain_db": round(gain, 2), "limiter_max_gr_db": round(gr, 2),
            "lufs": round(lufs(y), 2), "sample_peak_db": round(sample_peak_db(y), 2),
            "true_peak_db": round(true_peak_db(y), 2), "limiter_capped": capped}
    if capped:
        print(f"  note: {label}: reaching {target} LUFS needed more than {max_gr} dB of limiting;"
              f" settled at {info['lufs']} LUFS instead")
    return y, info


# ---------------------------------------------------------------- speech
def process_speech(item, cfg):
    """Decode a clip's speech with 0.5 s handles, clean it, cut it, de-click the cuts. Returns (n, 2) array."""
    src = resolve(item["file"])
    if not src.exists():
        die(f"clip not found: {src}")
    a, b = float(item["src_in"]), float(item["src_out"])
    if b <= a:
        die(f"clip {src.name}: src_out <= src_in")
    pad = min(0.5, a)
    raw = decode(src, a - pad, (b - a) + pad + 0.5)
    i0 = int(round(pad * SR))
    n = int(round((b - a) * SR))
    if len(raw) < i0 + n:
        warn(f"{src.name}: source ends early ({(len(raw) - i0) / SR:.3f}s of {(b - a):.3f}s); padding with silence")
        raw = np.pad(raw, ((0, i0 + n - len(raw)), (0, 0)))
    x = raw.mean(axis=1, keepdims=True) if item.get("mono", True) is not False else raw
    hpf = butter(4, float(item.get("hpf_hz") or cfg["hpf_hz"]), "highpass", fs=SR, output="sos")
    x = sosfilt(hpf, x, axis=0)  # filters run over the handle first, so the cut point has no filter transient
    raw_lufs = lufs(x[i0:i0 + n])
    x = x * 10 ** ((cfg["comp_ref_lufs"] - raw_lufs) / 20)
    x, gr_max, gr_s = compress(x, cfg["comp_threshold_db"], cfg["comp_ratio"], cfg["comp_knee_db"],
                               cfg["comp_attack_ms"], cfg["comp_release_ms"])
    eq = np.vstack([peaking_sos(cfg["mud_hz"], cfg["mud_db"], cfg["mud_q"]),
                    peaking_sos(cfg["presence_hz"], cfg["presence_db"], cfg["presence_q"])])
    if cfg["phase_rotate_hz"]:
        eq = np.vstack([eq] + [allpass_sos(f, 0.7) for f in cfg["phase_rotate_hz"]])
    x = sosfilt(eq, x, axis=0)
    core = x[i0:i0 + n].copy()
    gr_core = gr_s[i0:i0 + n]
    speed = float(item.get("speed") or 1.0)
    if abs(speed - 1.0) > 1e-6:  # the picture plays at `speed`; stretch the speech to match (pitch kept)
        import librosa
        core = np.stack([librosa.effects.time_stretch(np.ascontiguousarray(core[:, c]), rate=speed)
                         for c in range(core.shape[1])], axis=1)
        n = len(core)
    f = int(round(float(item.get("fade_ms") or cfg["declick_ms"]) * 1e-3 * SR))
    f = min(f, n // 2)
    ramp = raised_cos(f)
    core[:f] *= ramp[:, None]
    core[n - f:] *= ramp[::-1][:, None]
    if core.shape[1] == 1:
        core = np.repeat(core, 2, axis=1)
    info = {"file": src.name, "src": [a, b], "raw_lufs": round(raw_lufs, 1),
            "comp_gr_db_max": round(float(gr_core.max(initial=0)), 1),
            "comp_gr_db_mean_voiced": round(float(gr_core[gr_core > 0.1].mean()) if (gr_core > 0.1).any() else 0.0, 1)}
    return core, info


def duck_curve(spans, n, ramp_s):
    """spans: [(start_s, end_s, duck_db)] -> per-sample gain (linear). Raised-cosine ramps in dB, outside the span."""
    g_db = np.zeros(n)
    r = int(round(ramp_s * SR))
    shape = raised_cos(r)
    for s, e, d in spans:
        i0, i1 = int(round(s * SR)), int(round(e * SR))
        seg = np.full(i1 - i0 + 2 * r, -d)
        seg[:r] = -d * shape
        seg[len(seg) - r:] = -d * shape[::-1]
        a = i0 - r
        lo, hi = max(a, 0), min(a + len(seg), n)
        if hi > lo:
            g_db[lo:hi] = np.minimum(g_db[lo:hi], seg[lo - a:hi - a])
    return 10 ** (g_db / 20)


def write_wav(path, x):
    path.parent.mkdir(parents=True, exist_ok=True)
    subtype = "PCM_24" if np.max(np.abs(x)) < 0.9999 else "FLOAT"
    sf.write(str(path), x.astype(np.float32), SR, subtype=subtype)
    return subtype


# ---------------------------------------------------------------- main mix
def build(edl, name, cfg, wav_dir, dry_run=False):
    song, clips = parse_edl(edl, name)
    duration = float(edl["duration"])
    N = int(round(duration * SR))
    song_path = resolve(song["file"])
    if not song_path.exists():
        die(f"song not found: {song_path}")
    key = next((k for k in SONG_VOICE if k in song_path.stem.lower()), None)
    segs, fade_out, fade_in, max_out = song["segments"], song["fade_out_s"], song["fade_in_s"], song["max_out_s"]
    in_s, out_s, song_t0 = song["in_s"], song["out_s"], song["t0"]
    for k, sg in enumerate(segs):
        if max_out is not None and sg["out_s"] > float(max_out) + 1e-9:
            die(f"song segment {k}: out_s = {sg['out_s']} is past the limit {max_out} (vocals follow; BUILD.md)")
    xf = int(round(song["xfade_ms"] * 1e-3 * SR)) if len(segs) > 1 else 0
    print(f"[mix] {name}: {duration:.3f}s @ {SR} Hz; song {song_path.name} in {len(segs)} segment(s)"
          f" (fade in {fade_in}s, out {fade_out}s" + (f", {song['xfade_ms']:.0f} ms {song['xfade_shape']} crossfades)" if xf else ")"))
    bars = None
    if song.get("bars"):
        bj = json.loads(resolve(song["bars"]).read_text())
        bars = {"bars": [float(x) for x in bj.get("bars", [])], "beats": [float(x) for x in bj.get("beats", [])]}
    tol = float(song.get("bar_tol_ms") or 30.0) / 1000

    def grid_note(x):
        if not bars:
            return ""
        nb = min(bars["bars"], key=lambda b: abs(b - x)) if bars["bars"] else None
        nt = min(bars["beats"], key=lambda b: abs(b - x)) if bars["beats"] else None
        if nb is not None and abs(nb - x) <= tol:
            return f"on bar {nb:.3f} ({(x - nb) * 1000:+.0f} ms)"
        if nt is not None and abs(nt - x) <= tol:
            return f"on beat {nt:.3f} ({(x - nt) * 1000:+.0f} ms), not a bar line"
        return f"OFF the grid (nearest bar {nb:.3f}, beat {nt:.3f})"

    full = decode(song_path)
    g_song = 10 ** (song["gain_db"] / 20)
    song_bus = np.zeros((N, 2))
    segs_info = []
    for k, sg in enumerate(segs):
        first, last = k == 0, k == len(segs) - 1
        pre = 0 if first else xf // 2           # inner splices: run on xf/2 either side, crossfade centred on the splice
        post = 0 if last else xf - xf // 2
        i_in, i_out = int(round(sg["in_s"] * SR)) - pre, int(round(sg["out_s"] * SR)) + post
        if i_in < 0 or i_out > len(full):
            die(f"song segment {k} ({sg['in_s']}-{sg['out_s']}) runs past the file ({len(full) / SR:.2f}s)")
        x = full[i_in:i_out] * g_song
        if first:
            fi = int(round(fade_in * SR)); x[:fi] *= raised_cos(fi)[:, None]
        else:
            r = raised_cos(xf); x[:xf] *= (np.sin(np.pi / 2 * r) if song["xfade_shape"] == "power" else r)[:, None]
        if last:
            fo = int(round(max(fade_out, 0.005) * SR)); x[len(x) - fo:] *= raised_cos(fo)[::-1][:, None]
        else:
            r = raised_cos(xf)[::-1]; x[len(x) - xf:] *= (np.sin(np.pi / 2 * r) if song["xfade_shape"] == "power" else r)[:, None]
        j0 = int(round(sg["at"] * SR)) - pre
        lo, hi = max(j0, 0), min(j0 + len(x), N)
        if hi < j0 + len(x):
            warn(f"song segment {k} runs {(j0 + len(x) - hi) / SR:.3f}s past the edit duration; truncated")
        if hi > lo:
            song_bus[lo:hi] += x[lo - j0:hi - j0]
        e0, e1 = sg["at"], sg["at"] + sg["out_s"] - sg["in_s"]
        segs_info.append({"in_s": sg["in_s"], "out_s": sg["out_s"], "edit": [round(e0, 4), round(e1, 4)],
                          "in_grid": grid_note(sg["in_s"]), "out_grid": grid_note(sg["out_s"])})
        print(f"  segment {k}: song {sg['in_s']:.3f} -> {sg['out_s']:.3f} at edit {e0:.3f} -> {e1:.3f}"
              + (f"; in {grid_note(sg['in_s'])}" if not first and bars else "") + (f"; out {grid_note(sg['out_s'])}" if not last and bars else ""))
        if not first and bars and "OFF" in grid_note(sg["in_s"]):
            warn(f"splice into segment {k} at song {sg['in_s']:.3f} is not on the bar grid")
        if not last and bars and "OFF" in grid_note(sg["out_s"]):
            warn(f"splice out of segment {k} at song {sg['out_s']:.3f} is not on the bar grid")
    del full
    song_end_edit = min(duration, segs[-1]["at"] + segs[-1]["out_s"] - segs[-1]["in_s"])
    if song_end_edit < duration - 1e-6:
        print(f"  song ends at edit {song_end_edit:.3f}; silence to {duration:.3f}")

    def song_to_edit(a, b):
        """Song-time span -> list of edit-time spans where it plays."""
        out = []
        for sg in segs:
            lo, hi = max(a, sg["in_s"]), min(b, sg["out_s"])
            if lo < hi:
                out.append((sg["at"] + lo - sg["in_s"], sg["at"] + hi - sg["in_s"]))
        return out

    # clean variant: dip the song over each window (song seconds), short raised-cosine ramps outside the window
    clean = song.get("clean")
    dip = None
    if clean and clean.get("dips"):
        depth = clean.get("depth_db")
        floor = 0.0 if depth is None else 10 ** (float(depth) / 20)
        r = int(round(float(clean.get("ramp_ms", 12)) * 1e-3 * SR))
        dip = np.ones(N)
        shape = raised_cos(r)
        for a, b in clean["dips"]:
            for e0, e1 in song_to_edit(float(a), float(b)):
                i0, i1 = int(round(e0 * SR)), int(round(e1 * SR))
                seg = np.concatenate([1 - (1 - floor) * shape, np.full(max(i1 - i0, 0), floor), 1 - (1 - floor) * shape[::-1]])
                lo, hi = max(i0 - r, 0), min(i1 + r, N)
                dip[lo:hi] = np.minimum(dip[lo:hi], seg[lo - (i0 - r):hi - (i0 - r)])
                print(f"  clean: dip song {a:.3f}-{b:.3f} = edit {e0:.3f}-{e1:.3f} to {'silence' if depth is None else f'{depth} dB'}"
                      f" ({clean.get('ramp_ms', 12)} ms ramps outside)")

    # Song loudness reference = its loud sections (95th-percentile short-term loudness of what plays).
    act = song_bus[int(round(song_t0 * SR)):int(round(song_end_edit * SR))]
    st = window_loudness(kweighted_power(act), 3.0)
    song_ref = float(np.percentile(st, 95))
    speech_lu = song_ref + cfg["speech_rel_lu"]
    print(f"  song: integrated {lufs(act):.2f} LUFS, loud-section ref {song_ref:.2f} LUFS"
          f" -> speech target {speech_lu:.2f} LUFS (pre-normalization)")

    # Speech
    speech_bus = np.zeros((N, 2))
    spans, clips_info = [], []
    for it in sorted(clips, key=lambda c: c["t_edit"]):
        core, info = process_speech(it, cfg)
        g = speech_lu + it["gain_db"] - lufs(core)
        core *= 10 ** (g / 20)
        if it.get("peak_rel_db") is not None:   # r2: per-clip transient limiter (e.g. a mic thump in a quiet source), re-leveled
            tgt = speech_lu + it["gain_db"]
            for _ in range(4):
                y, gr = limit(core, tgt + float(it["peak_rel_db"]), cfg["limiter_attack_ms"], cfg["limiter_release_ms"])
                adj = tgt - lufs(y)
                if abs(adj) < 0.05:
                    break
                core = core * 10 ** (adj / 20)
            core = y
            info["peak_limit_gr_db"] = round(gr, 1)
            print(f"  speech [{it['id']}] transient limiter at {it['peak_rel_db']:+.0f} dB over its loudness: GR max {gr:.1f} dB,"
                  f" re-leveled to {lufs(core):.2f} LUFS")
        t0 = it["t_edit"]
        k0 = int(round(t0 * SR))
        if k0 < 0:
            die(f"{info['file']}: t0 < 0")
        k1 = min(N, k0 + len(core))
        if k1 - k0 < len(core):
            warn(f"{info['file']}: runs past the edit end; truncated by {(k0 + len(core) - k1) / SR:.3f}s")
        speech_bus[k0:k1] += core[:k1 - k0]
        t1 = k1 / SR
        info.update({"id": it["id"], "edit": [round(t0, 3), round(t1, 3)], "lufs": round(lufs(core), 2),
                     "gain_db_item": it["gain_db"], "speed": it["speed"]})
        clips_info.append(info)
        spans.append([t0, t1, it["duck_db"]])
        print(f"  speech [{it['id']}] {info['file']} src {info['src'][0]:.3f}-{info['src'][1]:.3f} -> edit {t0:.3f}-{t1:.3f};"
              f" raw {info['raw_lufs']} LUFS; comp GR max {info['comp_gr_db_max']} dB"
              f" (mean {info['comp_gr_db_mean_voiced']} dB voiced)")
        if it["t1_item"] is not None and t1 > it["t1_item"] + 0.04 + it.get("lcut", 0.0):
            warn(f"[{it['id']}] speech runs {t1 - it['t1_item']:.2f}s past the clip's picture (t1 = {it['t1_item']:.3f})")
        for a, b, what in SONG_VOICE.get(key, []):  # region in edit time, wherever the song plays it
            for ea, eb in song_to_edit(a, b):
                if t0 < eb and t1 > ea:
                    warn(f"{info['file']} (edit {t0:.2f}-{t1:.2f}) overlaps {what} at edit {max(ea, t0):.2f}-{min(eb, t1):.2f}")

    # Merge close spans, then pick each duck depth.
    ramp = cfg["duck_ramp_ms"] / 1000
    merged = []
    for s, e, d in sorted(spans, key=lambda sp: (sp[0], sp[1])):
        if merged and s - merged[-1][1] < cfg["duck_merge_gap_s"] + 2 * ramp:
            m = merged[-1]
            m[1] = max(m[1], e)
            m[2] = d if m[2] is None else (m[2] if d is None else max(m[2], d))
        else:
            merged.append([s, e, d])
    song_power = kweighted_power(song_bus)
    duck_spans, ducks_info = [], []
    for s, e, fixed in merged:
        a, b = int(round(s * SR)), int(round(e * SR))
        p = song_power[a:b]
        song_l = -0.691 + 10 * math.log10(np.mean(p) + 1e-20) if len(p) else -120.0
        if fixed is not None:
            d = float(fixed)
            if speech_lu - song_l + d < cfg["min_snr_lu"]:
                warn(f"speech at edit {s:.2f}-{e:.2f}: fixed duck {d:.1f} dB leaves speech only"
                     f" {speech_lu - song_l + d:.1f} LU above the song (min_snr_lu {cfg['min_snr_lu']})")
        else:
            d = min(max(cfg["duck_db"], cfg["min_snr_lu"] - (speech_lu - song_l)), cfg["max_duck_db"])
            if cfg["min_snr_lu"] - (speech_lu - song_l) > cfg["max_duck_db"]:
                warn(f"speech at edit {s:.2f}-{e:.2f}: song is loud there; duck capped at {d:.1f} dB,"
                     f" speech only {speech_lu - song_l + d:.1f} LU above it")
        duck_spans.append((s, e, d))
        ducks_info.append({"edit": [round(s, 3), round(e, 3)], "duck_db": round(d, 1),
                           "song_lufs_under": round(song_l, 1), "speech_over_song_lu": round(speech_lu - song_l + d, 1)})
        print(f"  duck edit {s:.3f}-{e:.3f}: -{d:.1f} dB ({cfg['duck_ramp_ms']:.0f} ms ramps);"
              f" song there {song_l:.1f} LUFS -> speech {speech_lu - song_l + d:.1f} LU above the ducked song")

    duck = duck_curve(duck_spans, N, ramp)
    mix_song = song_bus * duck[:, None] + speech_bus
    out_song, n_song = normalize(mix_song, cfg["target_lufs"], cfg, "song mix")
    out_clean, n_clean = (None, None)
    if dip is not None:
        if (clean.get("mode") or "full") == "mid":   # dip only the centre (M) channel, keep the sides (S): less of a hole, but a faint ghost of the word may remain
            m, sd = song_bus.mean(axis=1) * dip, (song_bus[:, 0] - song_bus[:, 1]) / 2
            song_clean = np.stack([m + sd, m - sd], axis=1)
        else:
            song_clean = song_bus * dip[:, None]
        out_clean, n_clean = normalize(song_clean * duck[:, None] + speech_bus, cfg["target_lufs"], cfg, "clean mix")
    if not clips:
        warn("no speech clips in the EDL; the speech-only WAV will not be written")
        out_speech, n_speech = None, None
    else:
        out_speech, n_speech = normalize(speech_bus, cfg["target_lufs"], cfg, "speech mix", max_gr=cfg.get("speech_limiter_max_gr_db"))

    p_song, p_speech, p_clean = wav_dir / f"mix-{name}-song.wav", wav_dir / f"mix-{name}-speech.wav", wav_dir / f"mix-{name}-clean.wav"
    if dry_run:
        print("[mix] dry run: nothing written")
        write = lambda p, x: "not written"
    else:
        wav_dir.mkdir(parents=True, exist_ok=True)
        write = write_wav
    st_song = write(p_song, out_song)
    print(f"[mix] {p_song}  ({st_song}, {len(out_song)} samples = {len(out_song) / SR:.4f}s)  "
          f"I {n_song['lufs']} LUFS, sample peak {n_song['sample_peak_db']} dBFS, TP {n_song['true_peak_db']} dBTP"
          f" (gain {n_song['gain_db']:+.2f} dB, limiter GR max {n_song['limiter_max_gr_db']} dB)")
    if out_clean is not None:
        st_cl = write(p_clean, out_clean)
        print(f"[mix] {p_clean}  ({st_cl})  I {n_clean['lufs']} LUFS, sample peak {n_clean['sample_peak_db']} dBFS,"
              f" TP {n_clean['true_peak_db']} dBTP (gain {n_clean['gain_db']:+.2f} dB)")
    if out_speech is not None:
        st_sp = write(p_speech, out_speech)
        print(f"[mix] {p_speech}  ({st_sp})  I {n_speech['lufs']} LUFS, sample peak "
              f"{n_speech['sample_peak_db']} dBFS, TP {n_speech['true_peak_db']} dBTP"
              f" (gain {n_speech['gain_db']:+.2f} dB, limiter GR max {n_speech['limiter_max_gr_db']} dB)")
    summary = {"name": name, "duration_s": duration, "samples": N, "song": {"in_s": in_s, "out_s": out_s, "t0": song_t0, "segments": segs_info},
               "song_wav": str(p_song), "speech_wav": str(p_speech) if out_speech is not None else None,
               "clean_wav": str(p_clean) if out_clean is not None else None, "clean_mix": n_clean,
               "song_mix": n_song, "speech_mix": n_speech, "clips": clips_info, "ducks": ducks_info,
               "no_song_start_offset_s": round(in_s - song_t0, 3)}
    if key in DROP_SONG_S and in_s <= DROP_SONG_S[key] <= out_s:
        summary["drop_edit_s"] = round(DROP_SONG_S[key] - in_s + song_t0, 3)
    print(f"  no-song version: start '{song_path.stem}' at song offset {summary['no_song_start_offset_s']:.2f}s"
          + (f" -> the drop (song {DROP_SONG_S[key]}) lands at edit {summary['drop_edit_s']:.3f}s"
             if "drop_edit_s" in summary else ""))
    return summary


def default_outputs(name, edl, out_dir):
    o = edl.get("outputs", {})
    stem = "hyperplane-brutal-teaser" if name == "short" else f"hyperplane-brutal-{name}"
    return (resolve(o["song"]) if "song" in o else out_dir / f"{stem}-9x16.mp4",
            resolve(o["no_song"]) if "no_song" in o else out_dir / f"{stem}-no-song-9x16.mp4",
            resolve(o["clean"]) if "clean" in o else out_dir / f"{stem}-clean-9x16.mp4")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("edl", help="EDL name (render/video/edl/<name>.json) or path to a JSON file")
    ap.add_argument("--wav-dir", default=str(ROOT / "song"), help="where the WAVs go (default: song/)")
    ap.add_argument("--video", help="silent H.264 video: also mux both deliverables (mux.py)")
    ap.add_argument("--out-dir", default=str(ROOT / "out"), help="deliverable folder for --video (default: out/)")
    ap.add_argument("--target-lufs", type=float, help="override mix.target_lufs")
    ap.add_argument("--tp-max", type=float, default=-1.0, help="true-peak limit on the encoded AAC (default -1.0)")
    ap.add_argument("--json", help="also write the summary JSON here")
    ap.add_argument("--dry-run", action="store_true", help="measure and report only; write no files")
    args = ap.parse_args()

    name, edl, edl_path = load_edl(args.edl)
    name = edl.get("name") or name
    cfg = dict(DEFAULTS)
    unknown = set(edl.get("mix", {})) - set(DEFAULTS)
    if unknown:
        warn(f"unknown mix keys ignored: {sorted(unknown)}")
    cfg.update({k: v for k, v in edl.get("mix", {}).items() if k in DEFAULTS})
    if args.target_lufs is not None:
        cfg["target_lufs"] = args.target_lufs
    print(f"[mix] EDL {edl_path}")
    summary = build(edl, name, cfg, Path(args.wav_dir), dry_run=args.dry_run)

    if args.video and not args.dry_run:
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        import mux
        out_song, out_nosong, out_clean = default_outputs(name, edl, Path(args.out_dir))
        summary["deliverables"] = {}
        summary["deliverables"]["song"] = mux.mux(args.video, summary["song_wav"], out_song, tp_max=args.tp_max)
        if summary.get("clean_wav"):
            summary["deliverables"]["clean"] = mux.mux(args.video, summary["clean_wav"], out_clean, tp_max=args.tp_max)
        if summary["speech_wav"]:
            summary["deliverables"]["no_song"] = mux.mux(args.video, summary["speech_wav"], out_nosong, tp_max=args.tp_max)
        print("[mix] deliverables:")
        for k, r in summary["deliverables"].items():
            print(f"  {k:8s} {r['out']}: I {r['lufs']} LUFS, TP {r['true_peak_dbtp']} dBTP, LRA {r['lra_lu']} LU,"
                  f" gain {r['gain_db']:+.2f} dB, A/V offset {r['sync_offset_samples']} samples")
    print("MIX_SUMMARY " + json.dumps(summary))
    if args.json:
        Path(args.json).write_text(json.dumps(summary, indent=1))


if __name__ == "__main__":
    main()
