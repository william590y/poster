# Song map: William's "brutal" file

**File:** `YTDown.com_YouTube_Media_OGUy2UmRxJ0_Olivia-Rodrigo-brutal-Official-Video_009_128k.mp3`. It's 173.30 s, 44.1 kHz stereo, a rip of the official video's audio. The file is **not in this repo**; put it at `song/brutal.mp3`.

Measured with `song_map.py` and `analyze_song.py` (librosa 0.11; RMS in 50–100 ms windows, onsets, beat tracking). If your file is different, re-run them:
```
python3 song/analyze_song.py song/brutal.wav     # overview: 0.5 s loudness/band table, tempo, biggest loudness jumps
python3 song/song_map.py song/brutal.wav         # zoom on intro start, the breath, the drop, riff onsets/beats
```
(Convert first with `ffmpeg -i song/brutal.mp3 -ac 2 -ar 44100 song/brutal.wav`.)

| Song time | Event | Evidence |
|---|---|---|
| 0.00–6.05 s | **Music-video prelude** (loud, not the song). Skip it. | about −15 dB RMS, hard cut at 6.07 |
| 6.10 s | **Quiet intro starts**, fading in from silence | −59 dB at 6.1, −42 dB at 6.5 |
| 6.1–18.2 s | Quiet, tense intro, slowly building (louder from about 15 s) | about −32 to −40 dB; beat tracker gives a steady ~0.49 s pulse |
| **18.25–19.05 s** | **The breath**: near-silence before the drop | −37 to −49 dB |
| 19.12 s | First riff sound (pickup) | onset at 19.116 |
| **≈19.23 s** | **Riff downbeat: the drop** | onset at 19.232; −10 dB by 19.20 (+16.5 dB jump vs. the 2 s before) |
| 19.23 → ≈26.7 s | Riff, about 4 bars at ≈123 BPM (beat ≈ 0.4875 s) | beats 19.74, 20.23, 20.71, 21.19, 21.68, 22.16, 22.65, 23.13, 23.62, 24.10, 24.58, 25.06, … |
| ≈26.8 s | **Verse 1 starts: vocals, explicit language.** End the video before this. | level drops to about −21 to −28 dB at 26.8 |

Riff onsets (song time): 19.116, 19.232, 19.743, 20.225, 20.463, 20.712, 21.177, 21.670, 22.158, 22.401, 22.639, 23.121, 24.097, 24.340, 25.054, 25.542, 26.511.

**Caveat:** whether the first strong hit at 19.12–19.23 is the bar's downbeat or a pickup into it should be **confirmed by ear**. Put the plane slam on whichever one feels like "the drop".

**Edit time = song time − 6.10** if the edit starts at the intro.
