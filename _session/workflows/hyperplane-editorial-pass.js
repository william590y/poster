export const meta = {
  name: 'hyperplane-editorial-pass',
  description: 'Session-model fixer: objective editorial and visual-bug fixes from the last critic round, then Haiku editorial re-check, final renders + previews',
  phases: [
    { title: 'Fix', detail: 'one session-model fixer for both cuts' },
    { title: 'Check', detail: 'Haiku editorial re-check of the fixed items' },
    { title: 'Final', detail: 'renders, mux, checks, previews' },
  ],
}
const P = '/home/user/hyperplane-teaser'
const CTX = `Project ${P}. Read ${P}/BUILD.md (UPDATE + splicing notes at the top override the rest), ${P}/out/NOTES.md, ${P}/render/video/edl/README.md. EDL generators: ${P}/render/video/edl/make_short.py and make_long.py. The breath line "it's brutal out here" is William's approved exception. Audio rule: no clip speech under sung vocals.`
const LIST = `Fix these (all from the last critic round, verified as real by the orchestrator):
EDITORIAL (keep meaning exact; "…" where words are cut; check every change against the source JSON in research/):
1. Short, Amodei (≈4.7–8.4 s): don't end on "badly" as if that were the whole claim. Either carry "…and a 75% chance that things go really, really well" on screen (the audio may stop at "badly" if speech timing forces it; the caption then ends with "…" and a small second line gives the 75% clause as text) or add the 75% clause as a sub-line. Keep "I think" out only with a leading ellipsis.
2. Short, Altman: the caption ends "…THE END OF THE WORLD…": fine with the ellipsis, but make sure no full stop implies the sentence ended. Mark the source line "Airbnb fireside chat, 2015" (the BI month is secondary).
3. Short, Hugging Face stamp: say "OpenAI says its agents attacked Hugging Face" (attributed), not the attack "by rogue OpenAI agents" as settled fact; match the headlines' attribution.
4. Lee Sedol card (both cuts): restore the concessive "Even if I become the number one, …there is an entity that cannot be defeated." or begin with "…" and add context "on AI, retiring from Go, 2019".
5. Long, Turing card: restore "we should have to": "…we should have to expect the machines to take control…".
6. Long, 96% card: end the quote with "…" since the sentence continues.
7. Long, Gallup 39% card: add the baseline "up from 31% in 2025" (check the exact source wording in research/long/plan/ch-b.json or the lyrics JSON).
8. Long, o3 card: drop the garbled "…parted illusions overshadow marinade illusions […]" fragment, keep the label and "Stop."; or replace it with a short explanatory label.
9. Project record: BUILD.md and research/verify/SUMMARY.md still describe Coxon's first take; add a note that the cut uses the restatement at 528.82–530.12 s ("There won't be jobs in this world.").
VISUAL BUGS:
10. Short, TIME and BBC headline cards flip from cream to dark mid-hold (≈8.3–9.0 s and ≈10.2–11.0 s): make each keep one state.
11. Long, Guardian band enters on a near-black band (≈46.48–46.60 s): start yellow.
12. Long, the bare band on black at ≈7.47–7.67 s: give it the first word/label so it isn't empty, or start the text on the band at 7.47.
13. Long, hook caption at frame 0 sits in the bottom 25% and the right rail: move it into the safe area (x ≤ 900, above y 1440) without covering the art.
14. Long, closing Bostrom caption at 36 px: raise to ≥ 38 px.
15. Short, Stargate stamp and Guardian ticker overlap 20.90–22.83 s: end the stamp before the ticker lands or merge them.
16. Right-rail clearance (both cuts): keep text blocks inside x ≤ 930 between y 1000 and 1600.
DENSITY (do what's cheap without restructuring): trim role/qualifier lines on the densest cards (Leike, Yudkowsky, Apollo, Fortune) so each card's word count fits about 3–4 words per second of its hold; never trim the quoted words themselves except with "…" and never change meaning.
Then regenerate both EDLs, re-render contact sheets out/sheets/<cut>-r7.png and look at them.`
const fix = await agent(`${CTX}\n${LIST}\nReturn {done, sheets, addressed, rejected (with reasons), notes}.`, { label: 'fix:r7', phase: 'Fix', schema: { type: 'object', properties: { done: { type: 'boolean' }, sheets: { type: 'array', items: { type: 'string' } }, addressed: { type: 'array', items: { type: 'string' } }, rejected: { type: 'array', items: { type: 'string' } }, notes: { type: 'string' } }, required: ['done', 'sheets', 'addressed', 'rejected'] } })
phase('Check')
const chk = await agent(`You are an editorial fact-checker. Read ${P}/render/video/edl/short.json and long.json and the contact sheets ${JSON.stringify(fix.sheets)} (Read the PNGs). For every quote, headline, stat, name, role and date shown on screen, check it against the sources: research/verify/*.json and SUMMARY.md, research/long/*.json, research/long/lyrics/*.json, research/long/plan/*.json and *.verify.json in ${P}. Report only real problems (wrong words, missing ellipsis, meaning changed, baseline missing, wrong date or attribution). The breath line "it's brutal out here" is approved. Return {problems:[{cut, item_id, problem, fix}]}.`, { label: 'check:editorial', phase: 'Check', model: 'haiku', schema: { type: 'object', properties: { problems: { type: 'array', items: { type: 'object', properties: { cut: { type: 'string' }, item_id: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' } }, required: ['problem'] } } }, required: ['problems'] } })
phase('Final')
const fin = await agent(`${CTX}\nThe fixer's report: ${JSON.stringify(fix).slice(0, 5000)}. An editorial re-check found: ${JSON.stringify(chk).slice(0, 5000)}. Verify each problem against the source and fix the real ones. Then re-render and mux all deliverables from the current EDLs (out/hyperplane-brutal-short-9x16.mp4, -short-no-song, -long, -long-clean, -long-no-song), verify each (ffprobe 1080x1920 30 fps; about -12 LUFS and TP ≤ -1 dBTP on the encoded file; music out before song 80.68; drop frame within one frame of the downbeat; every audible caption re-transcribed with whisper small.en matches the screen), make final sheets out/sheets/<cut>-final.png, and preview copies under 28 MB in out/preview/. Update out/NOTES.md. Delete superseded r7 sheets. Return outputs, measurements, open issues.`, { label: 'final', phase: 'Final', schema: { type: 'object', properties: { outputs: { type: 'array', items: { type: 'string' } }, measurements: { type: 'string' }, open_issues: { type: 'string' } }, required: ['outputs', 'measurements'] } })
return { fix: { addressed: fix.addressed, rejected: fix.rejected }, check: chk, fin }
