#!/usr/bin/env bash
# Build the Cornell Splash deck (M1237 "AI Alignment and Safety", Sat Nov 21, 2026; grades 7–12; 110 min).
#   ./build_splash.sh            build build/splash/AI_Alignment_and_Safety_Splash.pptx -> ./AI_Alignment_and_Safety_Splash.pptx
#   ./build_splash.sh --render   also render a PDF + slide JPGs in build/splash/ (needs LibreOffice Impress + poppler)
# Run of show (slide numbers, class clock, beats): build/splash/run_of_show.md · presenter guide: SPLASH.md
set -euo pipefail
cd "$(dirname "$0")"
OUT=build/splash/AI_Alignment_and_Safety_Splash.pptx
mkdir -p build/splash
[ -d node_modules ] || npm install --silent
node tools/make_art.js >/dev/null
[ -f assets/art/loop_explosion.gif ] || python3 tools/make_loop_gif.py >/dev/null
node tools/build_splash.js "$OUT"
python3 tools/postprocess.py "$OUT"
cp "$OUT" ./AI_Alignment_and_Safety_Splash.pptx
if [[ "${1:-}" == "--render" ]]; then
  (cd build/splash && soffice --headless --convert-to pdf "$(basename "$OUT")" >/dev/null 2>&1 && rm -f slide-*.jpg && pdftoppm -jpeg -r 80 "$(basename "${OUT%.pptx}").pdf" slide)
fi
echo "done -> AI_Alignment_and_Safety_Splash.pptx"
