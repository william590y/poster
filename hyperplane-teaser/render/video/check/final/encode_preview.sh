#!/bin/bash
# Chat copy of a final MP4: H.264 High, two-pass ABR (preset slow), +faststart, the master's audio stream copied bit for bit.
#   encode_preview.sh <master.mp4> <out.mp4> <width> <height> <video kbps>
# rev3: long 720 1280 2500 (26.3 MB), short 1080 1920 5500 (26.8 MB); the user's chat upload limit is 30 MB (keep <= 28 MB).
set -e
M="$1"; O="$2"; W="$3"; H="$4"; K="$5"
T=$(mktemp -d); LOG=$T/pass
COMMON=(-c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -b:v ${K}k
        -vf "scale=${W}:${H}:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p"
        -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv -r 30 -g 60 -threads 2)
ffmpeg -v error -y -i "$M" -map 0:v:0 "${COMMON[@]}" -pass 1 -passlogfile "$LOG" -an -f null /dev/null
ffmpeg -v error -y -i "$M" -map 0:v:0 -map 0:a:0 "${COMMON[@]}" -pass 2 -passlogfile "$LOG" -c:a copy -movflags +faststart "$O"
rm -rf "$T"; ls -la "$O"
