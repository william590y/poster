"""Whole-song map for the long version: loudness per 0.5 s, beat grid, onsets, sections, and lyric word timings.
Usage: python3 song/full_map.py song/brutal.wav song/full-map.json [whisper_model]
Writes JSON and prints a readable summary. Lyrics are for timing only: never put them on screen."""
import sys, json, numpy as np, librosa
from faster_whisper import WhisperModel

wav, out = sys.argv[1], sys.argv[2]
model = sys.argv[3] if len(sys.argv) > 3 else "small.en"
y, sr = librosa.load(wav, sr=22050, mono=True)
hop = 512
dur = len(y) / sr
rms = librosa.feature.rms(y=y, hop_length=hop)[0]
t = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)
db = 20 * np.log10(rms + 1e-9)
loud = [{"t": float(s), "db": round(float(db[(t >= s) & (t < s + 0.5)].mean()), 1)} for s in np.arange(0, dur, 0.5)]

onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
onsets = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr, hop_length=hop, units="time", backtrack=False)
tempo, beats = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr, hop_length=hop, start_bpm=124, tightness=200)
bt = librosa.frames_to_time(beats, sr=sr, hop_length=hop)

# sections by novelty on chroma + mfcc (coarse)
C = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop)
M = librosa.feature.mfcc(y=y, sr=sr, hop_length=hop, n_mfcc=13)
F = np.vstack([librosa.util.normalize(C, axis=0), librosa.util.normalize(M, axis=1)])
Fs = librosa.util.sync(F, beats, aggregate=np.median)
bounds = librosa.segment.agglomerative(Fs, 14)
bound_t = [float(bt[min(b, len(bt) - 1)]) for b in bounds]

# lyrics (timing only)
wm = WhisperModel(model, device="cpu", compute_type="int8", cpu_threads=4)
segs, _ = wm.transcribe(wav, word_timestamps=True, vad_filter=False, beam_size=5, condition_on_previous_text=False)
lyr = []
for s in segs:
    lyr.append({"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip(),
                "words": [{"w": w.word, "s": round(w.start, 3), "e": round(w.end, 3)} for w in (s.words or [])]})

res = {"duration": dur, "tempo": float(np.atleast_1d(tempo)[0]), "beats": [round(float(b), 3) for b in bt],
       "onsets": [round(float(o), 3) for o in onsets], "section_bounds": [round(b, 2) for b in bound_t],
       "loudness_0p5s": loud, "lyrics": lyr}
json.dump(res, open(out, "w"), indent=1)
print("duration %.2f tempo %.2f beats %d" % (dur, res["tempo"], len(bt)))
print("section bounds:", res["section_bounds"])
print("lyrics:")
for s in lyr: print(f"  [{s['start']:7.2f}-{s['end']:7.2f}] {s['text']}")
print("loudness (2 s means):")
for i in range(0, len(loud), 4):
    chunk = loud[i:i + 4]; print("  %6.1f  %6.1f dB" % (chunk[0]["t"], np.mean([c["db"] for c in chunk])))
