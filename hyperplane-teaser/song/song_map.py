import sys, numpy as np, librosa
y, sr = librosa.load(sys.argv[1], sr=44100, mono=True)
hop = 256
rms = librosa.feature.rms(y=y, frame_length=1024, hop_length=hop)[0]
t = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)
db = 20*np.log10(rms+1e-9)
def show(a, b, step=0.05):
    for s in np.arange(a, b, step):
        m = (t>=s)&(t<s+step); print("  %6.2f %6.1f dB" % (s, db[m].max()))
print("around intro start"); show(5.5, 6.6, 0.1)
print("around breath/drop"); show(17.8, 19.4, 0.05)
print("around riff end / verse"); show(26.0, 27.6, 0.1)
on = librosa.onset.onset_detect(y=y, sr=sr, hop_length=hop, units='time', backtrack=False)
print("onsets 18.0-27.5:", np.round(on[(on>18)&(on<27.5)], 3).tolist())
# beat grid in riff 19-27
yy = y[int(19.0*sr):int(27.0*sr)]
tempo, beats = librosa.beat.beat_track(y=yy, sr=sr, hop_length=hop, units='time')
print("riff tempo", tempo, "beats", np.round(np.array(beats)+19.0, 3).tolist())
