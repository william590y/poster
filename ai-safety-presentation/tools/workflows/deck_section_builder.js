export const meta = {
  name: 'deck-section-builder',
  description: 'Author, independently review, and fix slide modules for the AI safety deck',
  phases: [
    { title: 'Author', detail: 'one agent writes each section module and self-QAs renders' },
    { title: 'Review', detail: 'independent reviewer checks visuals + truthfulness against manifests' },
    { title: 'Fix', detail: 'apply review findings, re-render, verify' },
  ],
}

const ROOT = '/home/user/poster/ai-safety-presentation'
const ISSUES = {
  type: 'object',
  properties: {
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          slide: { type: 'integer', description: 'slide number in the module preview (slide-N.jpg)' },
          severity: { type: 'string', enum: ['major', 'minor'] },
          kind: { type: 'string', enum: ['overflow', 'overlap', 'readability', 'layout', 'truthfulness', 'missing-content', 'animation', 'other'] },
          description: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['slide', 'severity', 'kind', 'description', 'fix'],
      },
    },
    overall: { type: 'string', description: 'one-paragraph verdict on quality and how compelling the section is' },
  },
  required: ['issues', 'overall'],
}

function authorPrompt(m) {
  return `You are a senior presentation designer building one section of a high-stakes talk deck.
First read ${ROOT}/tools/SLIDE_BRIEF.md (rules + API) and ${ROOT}/tools/lib.js, and skim ${ROOT}/tools/theory_slides.js for the house style.
Your module name is \`${m.name}\` → write ${ROOT}/tools/slides_${m.name}.js.

SECTION SPEC:
${m.spec}

Process: read the manifest(s) named in the spec fully; look (Read tool) at the candidate images/screenshots before choosing them — pick the
most striking, legible, real ones; prefer real headline screenshots over citation cards; use native charts for datasets.
Plan each slide's message and layout, write the module, run \`node tools/render_module.js ${m.name}\` from ${ROOT}, view EVERY rendered JPG,
and iterate until there is no overflow, overlap, cut-off text, illegible screenshot, or dead space. Add entrance animations and transitions
per the brief (cascading clippings, wiping charts, click-reveals for key stats), and speaker notes with sources/caveats on every slide.
Final answer: short report per the brief.`
}

function reviewPrompt(m, round) {
  return `You are an exacting, independent reviewer of one section of a professional talk deck (review round ${round}).
Read ${ROOT}/tools/SLIDE_BRIEF.md. The section module is ${ROOT}/tools/slides_${m.name}.js; its spec was:
---
${m.spec}
---
Run \`node tools/render_module.js ${m.name}\` from ${ROOT} and view EVERY rendered slide JPG with the Read tool at full attention.
Check, slide by slide:
1. Visual defects: text overflowing or cut off, overlapping text/shapes, clippings covering each other's headlines, illegible (too small/blurry)
   screenshots, captcha/cookie-wall/blank screenshots, elements too close to edges (<0.5") or to each other, low contrast, awkward empty space,
   inconsistent title/kicker style, text < 14pt for body (10pt for captions).
2. Truthfulness: every headline, quote, statistic, date and claim on the slides must trace to an item with "verified": true in the manifests
   (${ROOT}/assets/research/*/manifest.json) or the user's original images. Open the module code and the manifests and check each one. Flag anything
   invented, misquoted, misattributed, or overstated (e.g. vendor claims presented as independent facts).
3. Coverage vs the spec (missing outline items that WERE found in the manifests) and impact: is it visually compelling, varied, scary-but-credible?
4. Animations: every frame/card animated as a unit (frame+image together), nothing animated that would look broken.
Report only real problems with concrete fixes. Use severity "major" for anything a viewer would notice or any truthfulness issue.`
}

function fixPrompt(m, issues) {
  return `You are fixing one section module of a professional talk deck. Read ${ROOT}/tools/SLIDE_BRIEF.md and ${ROOT}/tools/lib.js.
The module is ${ROOT}/tools/slides_${m.name}.js (spec below). An independent reviewer found these issues:
${JSON.stringify(issues, null, 1)}
---
SPEC:
${m.spec}
---
Fix every major issue and every minor issue you agree with (if you disagree with one, say why in your report). For truthfulness issues, verify
against the manifests and correct or remove the claim. Re-run \`node tools/render_module.js ${m.name}\` from ${ROOT} and view EVERY slide JPG to confirm
the fixes and that nothing new broke. Final answer: short list of what you changed.`
}

const modules = args.modules
log(`Building ${modules.length} section module(s): ${modules.map(m => m.name).join(', ')}`)

const results = await pipeline(
  modules,
  m => agent(authorPrompt(m), { label: `author:${m.name}`, phase: 'Author', agentType: 'general-purpose' }),
  async (authorReport, m) => {
    const rounds = []
    for (let round = 1; round <= 2; round++) {
      const review = await agent(reviewPrompt(m, round), { label: `review:${m.name}#${round}`, phase: 'Review', schema: ISSUES, agentType: 'general-purpose' })
      if (!review) break
      const major = review.issues.filter(i => i.severity === 'major')
      rounds.push({ round, overall: review.overall, issues: review.issues.length, major: major.length })
      if (review.issues.length === 0) break
      const fix = await agent(fixPrompt(m, review.issues), { label: `fix:${m.name}#${round}`, phase: 'Fix', agentType: 'general-purpose' })
      rounds[rounds.length - 1].fix = fix
      if (major.length === 0) break
    }
    return { module: m.name, authorReport, rounds }
  },
)
return results
