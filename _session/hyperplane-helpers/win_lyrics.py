import sys, subprocess, json
from faster_whisper import WhisperModel
src, a, b, step, win = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), 4.0, 8.0
m = WhisperModel('medium.en', device='cpu', compute_type='int8', cpu_threads=4)
out = []
t = a
while t < b:
    subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-t',str(win),'-i',src,'-ac','1','-ar','16000','/tmp/_w.wav'],check=True)
    segs,_ = m.transcribe('/tmp/_w.wav', vad_filter=False, word_timestamps=True, condition_on_previous_text=False, beam_size=5, no_speech_threshold=0.95)
    for s in segs:
        ws = [(w.word, round(w.start+t,2)) for w in (s.words or [])]
        print(f"win {t:6.1f}: [{s.start+t:6.2f}-{s.end+t:6.2f}] {s.text.strip()}", flush=True)
        out.append({'win': t, 'start': round(s.start+t,2), 'end': round(s.end+t,2), 'text': s.text.strip(), 'words': ws})
    t += step
json.dump(out, open(sys.argv[4],'w'), indent=1)
