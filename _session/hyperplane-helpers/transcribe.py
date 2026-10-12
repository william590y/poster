"""Transcribe a media file with faster-whisper, word timestamps. Usage: transcribe.py <media> <out.json> [model] [start_s] [dur_s]"""
import sys, json, subprocess, tempfile, os
from faster_whisper import WhisperModel

media, out = sys.argv[1], sys.argv[2]
model = sys.argv[3] if len(sys.argv) > 3 else "small.en"
start = float(sys.argv[4]) if len(sys.argv) > 4 else 0.0
dur = float(sys.argv[5]) if len(sys.argv) > 5 else None
wav = tempfile.mktemp(suffix=".wav")
cmd = ["ffmpeg", "-v", "error", "-y", "-ss", str(start)] + (["-t", str(dur)] if dur else []) + ["-i", media, "-ac", "1", "-ar", "16000", wav]
subprocess.run(cmd, check=True)
m = WhisperModel(model, device="cpu", compute_type="int8", cpu_threads=4)
segs, info = m.transcribe(wav, word_timestamps=True, vad_filter=True, beam_size=5)
res = []
for s in segs:
    res.append({"start": round(s.start + start, 2), "end": round(s.end + start, 2), "text": s.text.strip(),
                "words": [{"w": w.word, "s": round(w.start + start, 3), "e": round(w.end + start, 3), "p": round(w.probability, 3)} for w in (s.words or [])]})
    print(f"[{s.start + start:8.2f} - {s.end + start:8.2f}] {s.text.strip()}", flush=True)
json.dump(res, open(out, "w"), indent=1)
os.remove(wav)
