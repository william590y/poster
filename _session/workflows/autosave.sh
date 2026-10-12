#!/bin/bash
# Autosave (approved by William, 11 Oct 2026): mirror the Hyperplane project (no song, clips, renders or caches) and this
# session's working files into the poster repo on the session branch, then commit and push if anything changed.
set -u
SP=/tmp/claude-0/-home-user/a99e0376-0534-5e3e-8b47-ccbc03821dfd/scratchpad
REPO=/home/user/poster
BR=claude/busy-thompson-44fmqz
EXC=/home/user/wf/autosave-exclude.txt
cd "$REPO" || exit 1
# one run at a time: a slow push must never overlap the next save
exec 9>/tmp/claude-0/-home-user/a99e0376-0534-5e3e-8b47-ccbc03821dfd/scratchpad/autosave.lock
flock -n 9 || { echo "autosave: previous run still going, skipped ($(date -u +%H:%MZ))"; exit 0; }
# never start from a broken state (e.g. a merge or rebase in progress)
[ -e .git/MERGE_HEAD ] || [ -d .git/rebase-merge ] || [ -d .git/rebase-apply ] && { echo "autosave: git busy, skipped"; exit 0; }
git rev-parse --abbrev-ref HEAD | grep -qx "$BR" || { echo "not on $BR"; exit 1; }
rm -rf "$REPO/hyperplane-teaser" "$REPO/_session"
mkdir -p "$REPO/hyperplane-teaser" "$REPO/_session/workflows" "$REPO/_session/hyperplane-helpers"
tar -C /home/user/hyperplane-teaser -c --exclude-from="$EXC" -f - . | tar -C "$REPO/hyperplane-teaser" -x
cp /home/user/wf/*.js /home/user/wf/*.sh /home/user/wf/*.txt "$REPO/_session/workflows/" 2>/dev/null
cp -r /home/user/minds-and-machines "$REPO/_session/" 2>/dev/null
cp "$SP"/hyperplane/*.py "$REPO/_session/hyperplane-helpers/" 2>/dev/null
# the Self-Play Pretraining lab-meeting deck: slide sources and the animated-cover work (no paper page renders, videos or node_modules)
SZ="$SP/sppzd"
if [ -d "$SZ" ]; then
  mkdir -p "$REPO/_session/sppzd-deck"
  tar -C "$SZ" -c --exclude='node_modules' --exclude='*.mp4' --exclude='*.webm' --exclude='./src' --exclude='./work' --exclude='./cover/tmp' \
      -f - deck deck_spec.md outline.json merge scripts cover lint_slide.py 2>/dev/null | tar -C "$REPO/_session/sppzd-deck" -x
fi
cat > "$REPO/_session/README.md" <<'MD'
# Session working files (autosaved)
- `../hyperplane-teaser/`: the Hyperplane x "brutal" video project (engine, EDLs, research, brief). The song, clips, b-roll,
  render caches and rendered videos are NOT included (copyright and size); see hyperplane-teaser/README.md and BUILD.md to rebuild.
- `workflows/`: the multi-agent workflow scripts used in this session, and this autosave script.
- `hyperplane-helpers/`: transcription and download helpers (transcribe.py, y2dl.py, ...).
- `minds-and-machines/`: the H1239 lecture notes (LaTeX + PDF).
- `sppzd-deck/`: the Self-Play Pretraining lab-meeting deck sources (slides, outline, spec) and the animated-cover build.
MD
git add -A hyperplane-teaser _session
git diff --cached --name-only --diff-filter=AM | while read -r f; do [ -f "$f" ] && [ "$(stat -c %s "$f")" -gt 45000000 ] && git rm -q --cached "$f" && echo "skipped large $f"; done
if git diff --cached --quiet; then echo "autosave: nothing new ($(date -u +%H:%MZ))"; exit 0; fi
git commit -q -m "Autosave: Hyperplane project and session files ($(date -u +%Y-%m-%dT%H:%MZ))

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Gs6nrmAXs29Kx7ERy8wBV7"
for d in 0 2 4 8 16; do sleep $d; timeout 900 git push -q origin "$BR" && { echo "autosave: pushed $(git rev-parse --short HEAD) ($(date -u +%H:%MZ))"; exit 0; }; done
echo "autosave: push failed"; exit 1
