export const meta = {
  name: 'deck-section-polish',
  description: 'Apply pending review findings, then independently re-review and fix each section of the AI safety deck',
  phases: [
    { title: 'Fix pending', detail: 'apply review findings left unfixed by the interrupted run' },
    { title: 'Review', detail: 'independent reviewer: visuals + truthfulness vs manifests' },
    { title: 'Fix', detail: 'apply new findings, re-render, verify' },
  ],
}

const ROOT = '/home/user/poster/ai-safety-presentation'
const ISSUES = {
  type: 'object',
  properties: {
    issues: { type: 'array', items: { type: 'object', properties: {
      slide: { type: 'integer' }, severity: { type: 'string', enum: ['major', 'minor'] },
      kind: { type: 'string', enum: ['overflow', 'overlap', 'readability', 'layout', 'truthfulness', 'missing-content', 'animation', 'other'] },
      description: { type: 'string' }, fix: { type: 'string' } }, required: ['slide', 'severity', 'kind', 'description', 'fix'] } },
    overall: { type: 'string' },
  },
  required: ['issues', 'overall'],
}

const COMMON = `Context: ${ROOT} builds a ~77-slide talk deck "AI Safety and Existential Risk" from per-section modules tools/slides_<name>.js
(rules + API in ${ROOT}/tools/SLIDE_BRIEF.md — read it). Shared files tools/lib.js and tools/theory_slides.js are owned by the lead: do NOT edit them.
Recent lib changes: d.animate() now honours the \`after\` option (ms gap before a chained auto group) — if your module worked around this with
\`delay\`, keep timings sensible (no double gaps). Video captions now use '►'. Render a module with \`node tools/render_module.js <name>\` from ${ROOT}
(prints slide JPG paths); view EVERY JPG with the Read tool. Truthfulness is non-negotiable: every headline/quote/number must trace to a "verified": true
item in assets/research/*/manifest.json (or the user's originals); quotes verbatim (use … for omissions); vendor/company-reported claims labelled.`

function fixPrompt(name, issuesText) {
  return `${COMMON}

You are fixing section module \`${name}\` (${ROOT}/tools/slides_${name}.js). Review findings to address:
${issuesText}

Fix every major issue and every minor one you agree with (say why for any you reject). Keep slides visually rich; don't delete good content to dodge a
fix. Re-render and view every slide to confirm. Final answer: brief list of changes.`
}

function reviewPrompt(name, round) {
  return `${COMMON}

You are an exacting, independent reviewer of section module \`${name}\` (review round ${round}). Render it and view EVERY slide at full attention. Check:
1) visual defects: overflow/cut-off text, overlaps, clippings covering other clippings' headlines, illegible screenshots (text that would be < ~10pt on a
projector), blank/captcha screenshots, < 0.5" edge margins, cramped or dead space, body text < 14pt / captions < 10pt, inconsistent kicker/title style,
titles that wrap to two lines; 2) truthfulness — open the module source and the manifests and trace EVERY headline, quote, number and claim (including
titles and speaker notes); flag overstatement, composites presented as verbatim, misattribution, unlabelled vendor claims; 3) animations (frame+image
together; sensible order); 4) impact: compelling, varied, credible. Report only real problems with concrete fixes; severity "major" = a viewer would notice
or any truthfulness problem. If the section is clean, return an empty issues list.`
}

phase('Fix pending')
const results = await pipeline(
  args.modules,
  async (m) => {
    if (!m.pending) return 'no pending findings'
    return agent(fixPrompt(m.name, `Read the JSON list of findings at ${ROOT}/build/qa/${m.name}_pending.json (from an earlier independent review).`),
      { label: `fix-pending:${m.name}`, phase: 'Fix pending', agentType: 'general-purpose' })
  },
  async (pendingFix, m) => {
    const rounds = []
    for (let round = 1; round <= m.rounds; round++) {
      const review = await agent(reviewPrompt(m.name, round), { label: `review:${m.name}#${round}`, phase: 'Review', schema: ISSUES, agentType: 'general-purpose' })
      if (!review) break
      const major = review.issues.filter(i => i.severity === 'major').length
      const entry = { round, overall: review.overall, issues: review.issues.length, major }
      rounds.push(entry)
      if (review.issues.length === 0) break
      entry.fix = await agent(fixPrompt(m.name, JSON.stringify(review.issues, null, 1)), { label: `fix:${m.name}#${round}`, phase: 'Fix', agentType: 'general-purpose' })
      if (major === 0) break
    }
    return { module: m.name, pendingFix, rounds }
  },
)
return results
