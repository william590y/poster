import sys, numpy as np, librosa
y, sr = librosa.load(sys.argv[1], sr=22050, mono=True)
hop = 512
rms = librosa.feature.rms(y=y, hop_length=hop)[0]
t = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)
db = 20*np.log10(rms+1e-9)
# spectral: low (<200), mid, high energy
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop))
f = librosa.fft_frequencies(sr=sr, n_fft=2048)
def band(lo,hi): return 10*np.log10((S[(f>=lo)&(f<hi)]**2).sum(0)+1e-12)
low, mid, hi = band(30,200), band(200,2000), band(2000,10000)
flat = librosa.feature.spectral_flatness(S=S)[0]
print("duration %.2f s" % (len(y)/sr))
print("t(s)  rms_dB  low   mid   high  (0.5 s windows, first 60 s)")
for s in np.arange(0, 60, 0.5):
    m = (t>=s)&(t<s+0.5)
    print("%5.1f %6.1f %5.1f %5.1f %5.1f" % (s, db[m].mean(), low[m].mean(), mid[m].mean(), hi[m].mean()))
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, hop_length=hop)
bt = librosa.frames_to_time(beats, sr=sr, hop_length=hop)
print("tempo", tempo)
print("beats 0-60s:", np.round(bt[bt<60],2).tolist())
on = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
# biggest jumps in short-term loudness (2 s after vs 2 s before)
w = int(2*sr/hop)
jumps = []
for i in range(w, len(db)-w):
    jumps.append((db[i:i+w].mean()-db[i-w:i].mean(), t[i]))
jumps.sort(reverse=True)
seen=[]
for j,tt in jumps:
    if all(abs(tt-s)>3 for s in seen):
        seen.append(tt); print("loudness jump +%.1f dB at %.2f s" % (j,tt))
    if len(seen)>=6: break
