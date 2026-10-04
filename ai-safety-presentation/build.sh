#!/usr/bin/env bash
# Build the deck: generate -> inject transitions/animations/theme -> (optional) render previews.
#   ./build.sh            build build/AI_Safety_and_Existential_Risk.pptx
#   ./build.sh --render   also render a PDF + slide JPGs (needs LibreOffice Impress + poppler)
set -euo pipefail
cd "$(dirname "$0")"
OUT=build/AI_Safety_and_Existential_Risk.pptx
[ -d node_modules ] || npm install --silent
node tools/make_art.js >/dev/null
node tools/build_deck.js "$OUT"
python3 tools/postprocess.py "$OUT"
cp "$OUT" ./AI_Safety_and_Existential_Risk.pptx
if [[ "${1:-}" == "--render" ]]; then
  (cd build && soffice --headless --convert-to pdf "$(basename "$OUT")" >/dev/null 2>&1 && rm -f slide-*.jpg && pdftoppm -jpeg -r 60 "$(basename "${OUT%.pptx}").pdf" slide)
fi
echo "done -> AI_Safety_and_Existential_Risk.pptx"
