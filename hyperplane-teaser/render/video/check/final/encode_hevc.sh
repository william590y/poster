#!/bin/bash
# HEVC copy of a cut: 1080x1920 libx265 two-pass ABR (preset slow), tag hvc1, +faststart. ONE video encode per cut; the video
# stream is then muxed with each variant's audio stream copied bit for bit (the variants share one video stream, as the masters do).
#   encode_hevc.sh <video-master.mp4> <kbps> <out-video-only.mp4> [<audio-master.mp4> <out.mp4>]...
# rev3: long 2600 kbps (24.6 MB of video; with-song 27.1 MB, no-song 25.6 MB), short 5750 kbps (26.7 MB of video; 27.9 / 27.2 MB).
# Budget: (27.6 MB - audio bytes - 0.1 MB) * 8 / duration; x265 lands 0.7-2 % above it. Keep every file <= 28 MB (decimal).
set -e
M="$1"; K="$2"; V="$3"; shift 3
T=$(mktemp -d); ST=$T/stats
COMMON=(-c:v libx265 -preset slow -pix_fmt yuv420p -b:v ${K}k -tag:v hvc1 -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv -r 30 -g 60 -threads 4)
ffmpeg -v error -y -i "$M" -map 0:v:0 "${COMMON[@]}" -x265-params "pass=1:stats=$ST:log-level=error" -an -f null /dev/null
ffmpeg -v error -y -i "$M" -map 0:v:0 "${COMMON[@]}" -x265-params "pass=2:stats=$ST:log-level=error" -an -movflags +faststart "$V"
rm -rf "$T"
while [ $# -ge 2 ]; do
  ffmpeg -v error -y -i "$V" -i "$1" -map 0:v:0 -map 1:a:0 -c copy -tag:v hvc1 -movflags +faststart "$2"; ls -la "$2"; shift 2
done
