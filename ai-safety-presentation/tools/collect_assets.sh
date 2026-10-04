#!/usr/bin/env bash
# List (and optionally git-add) every research asset the deck build actually reads, plus all manifests.
#   tools/collect_assets.sh          -> prints the list and total size
#   tools/collect_assets.sh --add    -> git add -f those files (assets/research is otherwise gitignored)
set -euo pipefail
cd "$(dirname "$0")/.."
TMP=$(mktemp -d)
strace -f -e trace=openat -o "$TMP/trace" node tools/build_deck.js "$TMP/deck.pptx" >/dev/null 2>&1
grep -o '"[^"]*assets/research/[^"]*"' "$TMP/trace" | tr -d '"' | sed "s#^$PWD/##" | sort -u | while read -r f; do [ -f "$f" ] && echo "$f"; done > "$TMP/list"
ls assets/research/*/manifest.json assets/research/*/notes.md 2>/dev/null >> "$TMP/list" || true
sort -u "$TMP/list" -o "$TMP/list"
echo "$(wc -l < "$TMP/list") files, $(cat "$TMP/list" | xargs du -cb | tail -1 | cut -f1) bytes"
if [[ "${1:-}" == "--add" ]]; then xargs git add -f < "$TMP/list"; else cat "$TMP/list"; fi
rm -rf "$TMP"
