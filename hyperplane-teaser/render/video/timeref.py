"""Time references for the Python tools, identical to fx/core.js T() (keep the two in sync).

A time is a number (edit seconds), "grid:i[+-off]" (an EDL grid; fractions interpolate, indices beyond extrapolate),
"hb:i[+-off]" (beat i of song/hits.json, i = 0 at the drop, song 19.232; prelude beats negative; "hb:8.5" = the 8th after 8),
"song:s[+-off]" (song second s), or {"at": <time>, "off": s}. hb/song map song -> edit time through the EDL's
song.segments (spliced cuts) or audio.songStart. A grid named "hb" or "song" wins over the built-ins.

    from timeref import TimeRef
    TR = TimeRef(edl)            # edl = the parsed EDL dict
    TR("hb:4"), TR("song:71.94"), TR("riff:2+0.05"), TR.song_at(edit_t), TR.edit_at(song_s), TR.beats_in(t0, t1, step=1)
"""
import json, math, re, pathlib

HERE = pathlib.Path(__file__).resolve().parent          # render/video
ROOT = HERE.parent.parent                               # project root
EPS = 1e-6
TIME_RE = re.compile(r"^([A-Za-z_][\w-]*):(-?[\d.]+)([+-][\d.]+)?$")


def build_grid(g):
    if isinstance(g, list):
        return [float(x) for x in g]
    out, k0, tol = [], g.get("start", 0), g.get("tol", 0.03)
    for i in range(int(g["count"])):
        x = g["origin"] + (k0 + i) * g["period"]
        near = [s for s in g.get("snap", []) if abs(s - x) <= tol]
        if near:
            x = min(near, key=lambda s: abs(s - x))
        out.append(round(x, 4))
    return out


def load_hits(edl=None):
    """song/hits.json (or edl["hits"]), else song/hits.stand-in.json, normalised like fx/core.js normHits(). None if absent."""
    for p in [(edl or {}).get("hits"), "song/hits.json", "song/hits.stand-in.json"]:
        if p and (ROOT / p).exists():
            j = json.loads((ROOT / p).read_text())
            arr = j.get("beats") or j.get("grid") or []
            L = [{"t": b} if isinstance(b, (int, float)) else {**b, "t": b.get("t", b.get("song", b.get("time", b.get("s"))))} for b in arr]
            drop = j.get("drop", j.get("drop_s", 19.232))
            idx = lambda b: b.get("i", b.get("index", b.get("beat")))
            if not L or any(not isinstance(idx(b), (int, float)) for b in L):
                k0 = min(range(len(L)), key=lambda k: abs(L[k]["t"] - drop)) if L else 0
                for k, b in enumerate(L): b["i"] = k - k0
            else:
                for b in L: b["i"] = idx(b)
            L.sort(key=lambda b: b["i"])
            d = sorted(L[k]["t"] - L[k - 1]["t"] for k in range(1, len(L)) if L[k]["i"] - L[k - 1]["i"] == 1)
            period = j.get("period", j.get("beat_s", d[len(d) // 2] if d else 0.4839))
            return {"src": p, "list": L, "by": {b["i"]: b for b in L}, "period": period, "drop": drop, "raw": j,
                    "stand_in": "stand-in" in p}
    return None


class TimeRef:
    def __init__(self, edl, hits="auto"):
        self.edl = edl
        self.grids = {k: build_grid(v) for k, v in (edl.get("grids") or {}).items()}
        self.hits = load_hits(edl) if hits == "auto" else hits
        self.song0 = (edl.get("audio") or {}).get("songStart", 0.0)
        self.segs = None
        sg = (edl.get("song") or {}).get("segments") if isinstance(edl.get("song"), dict) else None
        if sg:
            at, self.segs = 0.0, []
            for s in sg:
                at = self(s.get("at"), at)
                self.segs.append((at, s["in_s"], s["out_s"])); at += s["out_s"] - s["in_s"]

    # ---- grids
    def grid_at(self, name, idx):
        if name not in self.grids: raise KeyError(f'unknown beat grid "{name}"')
        g = self.grids[name]
        def at(k):
            if k < 0: return g[0] + k * (g[1] - g[0])
            if k >= len(g): return g[-1] + (k - len(g) + 1) * (g[-1] - g[-2])
            return g[k]
        i = math.floor(idx + EPS); f = idx - i
        return at(i) + (at(i + 1) - at(i)) * f if f > EPS else at(i)

    # ---- song <-> edit
    def song_at(self, e):
        if self.segs:
            for a0, i_s, o_s in reversed(self.segs):
                if e >= a0 - 1e-9: return e - a0 + i_s
            a0, i_s, _ = self.segs[0]; return e - a0 + i_s
        return e + self.song0

    def edit_at(self, s, strict=True):
        if self.segs:
            for a0, i_s, o_s in self.segs:
                if i_s - 1e-6 <= s <= o_s + 1e-6: return a0 + s - i_s
            if s < self.segs[0][1]: return self.segs[0][0] + s - self.segs[0][1]
            if s > self.segs[-1][2]: return self.segs[-1][0] + s - self.segs[-1][1]
            if strict: raise ValueError(f"song {s:.3f} s falls in a cut of the song")
            return float("nan")
        return s - self.song0

    # ---- beats (song/hits.json)
    def song_of_beat(self, i):
        H = self.hits
        if not H or not H["list"]: return 19.232 + i * 0.4839
        if i in H["by"]: return H["by"][i]["t"]
        lo, hi = H["list"][0]["i"], H["list"][-1]["i"]
        if i < lo: return H["by"][lo]["t"] + (i - lo) * H["period"]
        if i > hi: return H["by"][hi]["t"] + (i - hi) * H["period"]
        a = i - 1
        while a not in H["by"]: a -= 1
        c = i + 1
        while c not in H["by"]: c += 1
        return H["by"][a]["t"] + (H["by"][c]["t"] - H["by"][a]["t"]) * (i - a) / (c - a)

    def beat_song(self, x):
        i = math.floor(x + EPS); f = x - i
        return self.song_of_beat(i) + (self.song_of_beat(i + 1) - self.song_of_beat(i)) * f if f > EPS else self.song_of_beat(i)

    def beat_edit(self, x):
        return self.edit_at(self.beat_song(x))

    def beats_in(self, t0=-1e9, t1=1e9, step=1.0):
        """[{i, t (edit), song, **flags}] for the beats (and subdivisions) the cut plays inside [t0, t1)."""
        H = self.hits
        lo, hi = (H["list"][0]["i"], H["list"][-1]["i"]) if H and H["list"] else (-64, 200)
        out, n = [], int(round((hi - lo) / step))
        for k in range(n + 1):
            x = round(lo + k * step, 6); s = self.beat_song(x); e = self.edit_at(s, strict=False)
            if math.isnan(e) or e < t0 - EPS or e >= t1 - EPS: continue
            info = (H["by"].get(int(round(x))) or {}) if (H and abs(x - round(x)) < EPS) else {"sub": True}
            out.append({**info, "i": x, "t": e, "song": s})
        return out

    # ---- T()
    def __call__(self, v, default=None):
        if v is None: return default
        if isinstance(v, (int, float)): return float(v)
        if isinstance(v, str):
            m = TIME_RE.match(v)
            if not m: return float(v)
            name, x, off = m.group(1), float(m.group(2)), float(m.group(3)) if m.group(3) else 0.0
            if name not in self.grids and name == "hb": return self.beat_edit(x) + off
            if name not in self.grids and name == "song": return self.edit_at(x) + off
            return self.grid_at(name, x) + off
        if isinstance(v, dict): return self(v["at"]) + v.get("off", 0)
        raise ValueError(f"bad time {v!r}")
