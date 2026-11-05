#!/usr/bin/env bash
# Build the whole Splash deck into its own folder and render it, so several editors can preview without clobbering
# build/splash/ (the official build) or each other.
#   tools/preview_splash.sh build/prev-ml            -> build/prev-ml/deck.pptx, deck.pdf, slide-NN.jpg, run_of_show.md
#   tools/preview_splash.sh build/prev-ml 5 6 7      -> the same, then prints only those slides' JPG paths
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=${1:?usage: tools/preview_splash.sh OUT_DIR [slide numbers...]}; shift || true
mkdir -p "$OUT"; rm -f "$OUT"/slide-*.jpg "$OUT"/deck.pdf
node tools/make_art.js >/dev/null
[ -f assets/art/loop_explosion.gif ] || python3 tools/make_loop_gif.py >/dev/null
node tools/build_splash.js "$OUT/deck.pptx"
python3 tools/postprocess.py "$OUT/deck.pptx" >/dev/null
(cd "$OUT" && timeout 900 soffice -env:UserInstallation=file://$PWD/.lo --headless --convert-to pdf deck.pptx >/dev/null 2>&1 && pdftoppm -jpeg -r 80 deck.pdf slide)
if [ $# -gt 0 ]; then for n in "$@"; do ls "$OUT"/slide-$(printf '%02d' "$n").jpg 2>/dev/null || ls "$OUT"/slide-"$n".jpg; done; else ls "$OUT"/slide-*.jpg | wc -l; fi
