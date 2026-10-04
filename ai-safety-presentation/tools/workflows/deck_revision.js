export const meta = {
  name: 'deck-revision',
  description: 'Research, edit, independently review and fix requested changes to one or more sections of the AI safety deck',
  phases: [
    { title: 'Research', detail: 'one agent per requested item: verify facts, capture real screenshots/media', model: 'sonnet' },
    { title: 'Edit', detail: 'apply all changes to the section module, render, self-check' },
    { title: 'Review', detail: 'independent visual + truthfulness review', model: 'sonnet' },
    { title: 'Fix', detail: 'apply review findings' },
  ],
}

const ROOT = '/home/user/poster/ai-safety-presentation'
// Non-editing agents (research, review) run on Sonnet; editing/fixing agents inherit the session model.
const RESEARCH_MODEL = (args && args.researchModel) || 'sonnet'
const COMMON = `Project: ${ROOT} builds a ~85-slide talk deck "AI Safety and Existential Risk" (pptxgenjs). Read ${ROOT}/tools/SLIDE_BRIEF.md (rules, API,
and the Media section) and ${ROOT}/tools/RESEARCH_BRIEF.md (truthfulness rules). TODAY IS 2026-10-04 (after your training data — use the web).
WebSearch may be exhausted for this session; if so use WebFetch on known URLs or DuckDuckGo through the headless browser:
\`node /tmp/claude-0/-home-user-poster/a99e0376-0534-5e3e-8b47-ccbc03821dfd/scratchpad/ddg.js "<query>"\` (read it first), and real screenshots via
\`node ${ROOT}/tools/shot.js <url> <out.png> [--selector css] [--clip x,y,w,h] [--wait ms]\`. View every image you capture with Read and discard
captchas/blank pages. Never fabricate a number, quote, headline, image or clip. Quality matters more than file size.`

const ISSUES = { type: 'object', properties: {
  issues: { type: 'array', items: { type: 'object', properties: {
    slide: { type: 'integer' }, severity: { type: 'string', enum: ['major', 'minor'] }, description: { type: 'string' }, fix: { type: 'string' } },
    required: ['slide', 'severity', 'description', 'fix'] } },
  overall: { type: 'string' } }, required: ['issues', 'overall'] }

function researchPrompt(m, it) {
  return `${COMMON}

RESEARCH TASK "${it.key}" for section module \`${m.name}\`:
${it.research}

Save files under ${ROOT}/assets/research/${m.name}/rev2/ (create it). Do NOT edit manifest.json (other agents are working in parallel); instead
write your findings to ${ROOT}/assets/research/${m.name}/rev2/${it.key}.json using the manifest schema from RESEARCH_BRIEF.md
({items, datasets, facts, not_found}, file paths relative to the rev2 folder, "verified": true only for pages you loaded). Validate the JSON.
Final answer: concise findings — exact numbers, verbatim quotes, dates, URLs, files saved (with what each shows) — and what was not found.`
}

function editPrompt(m, research) {
  return `${COMMON}

EDIT TASK for section module \`${m.name}\` (${ROOT}/tools/slides_${m.name}.js). You may edit only that file and files under
${ROOT}/assets/slides/${m.name}/ and ${ROOT}/assets/research/${m.name}/ (not lib.js, theory_slides.js or other modules).
The user requested these changes:
${m.edit}

Research results (one block per research agent; their JSON files are in ${ROOT}/assets/research/${m.name}/rev2/):
${research.map((r, i) => `--- research ${i + 1} ---\n${r}`).join('\n')}

Steps: (1) merge the rev2/*.json findings into ${ROOT}/assets/research/${m.name}/manifest.json (append items/facts/datasets/not_found; file paths
prefixed 'rev2/'; keep valid JSON). (2) Implement every requested change with strong visuals (real screenshots, GIFs/clips, native charts), honest
labels (vendor-reported, rumor, estimates) and speaker notes with URLs. (3) Run \`node tools/render_module.js ${m.name}\` from ${ROOT} and view EVERY
slide JPG; iterate until there is no overflow, overlap, illegible text or dead space. Final answer: the module's slide list (titles), what changed,
and anything you could not do (and why).`
}

function reviewPrompt(m, editReport, round) {
  return `${COMMON}

REVIEW TASK (round ${round}) for section module \`${m.name}\`. Requested changes were:
${m.edit}
Editor's report:
${editReport}

Render it (\`node tools/render_module.js ${m.name}\` from ${ROOT}), view EVERY slide JPG at full attention, open the module code and
${ROOT}/assets/research/${m.name}/manifest.json. Check: (1) each requested change is actually implemented well; (2) visual defects — overflow,
overlap, illegible text (< 14pt body, < 10pt captions), clippings covering headlines, broken/blank images or GIF first frames, inconsistent
kicker/title style; (3) truthfulness — every number/quote/headline/clip traces to a verified manifest item; estimates/arithmetic shown and labelled;
vendor claims and rumors labelled. Return only real problems with concrete fixes (empty list if clean).`
}

function fixPrompt(m, issues) {
  return `${COMMON}

FIX TASK for section module \`${m.name}\` (${ROOT}/tools/slides_${m.name}.js; only that file and its assets folders). Fix these review findings
(reject any you disagree with, saying why), re-render with \`node tools/render_module.js ${m.name}\` from ${ROOT}, and view every slide JPG:
${JSON.stringify(issues, null, 1)}
Final answer: what changed.`
}

const results = await pipeline(
  args.modules,
  async (m) => {
    const res = await parallel(m.items.map(it => () => agent(researchPrompt(m, it), { label: `research:${m.name}:${it.key}`, phase: 'Research', agentType: 'general-purpose', model: RESEARCH_MODEL })))
    return res.map((r, i) => r || `(research "${m.items[i].key}" returned nothing)`)
  },
  async (research, m) => {
    const edit = await agent(editPrompt(m, research), { label: `edit:${m.name}`, phase: 'Edit', agentType: 'general-purpose' })
    return { research, edit }
  },
  async (prev, m) => {
    const rounds = []
    let report = prev.edit
    for (let round = 1; round <= 2; round++) {
      const review = await agent(reviewPrompt(m, report, round), { label: `review:${m.name}#${round}`, phase: 'Review', schema: ISSUES, agentType: 'general-purpose', model: RESEARCH_MODEL })
      if (!review) break
      const major = review.issues.filter(i => i.severity === 'major').length
      const entry = { round, overall: review.overall, issues: review.issues.length, major }
      rounds.push(entry)
      if (!review.issues.length) break
      entry.fix = await agent(fixPrompt(m, review.issues), { label: `fix:${m.name}#${round}`, phase: 'Fix', agentType: 'general-purpose' })
      report = entry.fix
      if (!major) break
    }
    return { module: m.name, edit: prev.edit, rounds }
  },
)
return results
