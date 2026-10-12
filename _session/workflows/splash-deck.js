export const meta = {
  name: 'splash-deck',
  description: 'Build a 110-minute grades 7-12 "AI Alignment and Safety" Splash deck: new ML-intro section + age-adapted reuse of the existing deck, reviewed by three lenses',
  phases: [
    { title: 'Research', detail: 'swarm of small Haiku research subtasks (+ the finished Sonnet audit and first research item, cached)', model: 'haiku' },
    { title: 'Plan', detail: 'four Haiku planners, one per part, each with its own minute budget and slide pool', model: 'haiku' },
    { title: 'Build', detail: 'ML-intro module and the Splash assembler, in parallel' },
    { title: 'Integrate', detail: 'full Splash build, render, self-QA' },
    { title: 'Review', detail: 'Haiku swarm: each reviews ~10 slides through one lens (visual, accuracy, pedagogy) + one arc/timing reviewer', model: 'haiku' },
    { title: 'Fix', detail: 'apply findings, partitioned by file' },
  ],
}

const ROOT = '/home/user/poster/ai-safety-presentation'
const SP = '/tmp/claude-0/-home-user-poster/a99e0376-0534-5e3e-8b47-ccbc03821dfd/scratchpad'
const MY = '/tmp/claude-0/-home-user/a99e0376-0534-5e3e-8b47-ccbc03821dfd/scratchpad'
const RS = `${ROOT}/assets/research/splash`
const COMMON = `Project: ${ROOT} builds talk decks with pptxgenjs (Deck API in tools/lib.js; rules in tools/SLIDE_BRIEF.md; truthfulness rules in
tools/RESEARCH_BRIEF.md — read both). TODAY IS 2026-10-10 (after your training data — use the web; do not "correct" 2026 model names/events you
have not heard of). The existing 117-slide adult deck "AI Safety and Existential Risk" is built by ./build.sh from tools/build_deck.js +
tools/slides_<module>.js (economy, capabilities, work, frontier, xrisk, security, geopolitics, openweights) + tools/theory_slides.js.
Its slides are already rendered as 1920px JPGs at /home/user/blog/aisafety/slides/slide-NN.jpg (NN = 01…117); a slide index (number | kicker |
title | clips) is at ${MY}/slide_index.txt and ALL speaker notes at ${MY}/deck_notes.txt ("===== SLIDE n =====").
Web tools: WebSearch/WebFetch; if WebSearch is exhausted use \`node ${SP}/ddg.js "<query>"\` (read it first); real screenshots via
\`node ${ROOT}/tools/shot.js <url> <out.png> [--selector css] [--clip x,y,w,h] [--wait ms]\`; X posts via \`curl -sS https://api.fxtwitter.com/<user>/status/<id>\`.
YouTube downloads are blocked (embed with d.video + a thumbnail cover instead). View every image you capture with Read; discard captchas/blank pages.
Never fabricate a number, quote, headline, image or clip. Disk is tight (~5 GB free): never copy the 1 GB adult deck; delete your preview renders
when done with them.

THE NEW DECK: Cornell Splash Fall 2026 class M1237 "AI Alignment and Safety", taught by William Liaw, Saturday Nov 21, 2026: ONE 1 h 50 min session
(110 minutes), grades 7–12, up to 200 students, projector only (students have no computers; assume no phones either), no programming background.
Official description (from the registration): "How do today's most powerful AI systems work, and what might their continued development mean for
humanity? The first third of this class introduces neural networks and large language models, including backpropagation, pretraining,
post-training, and the scaling laws that guide training at frontier AI labs. We will build intuition for how models learn and why more data and
computation can produce more capable systems. The remaining two thirds explore AI safety and existential risk: how quickly AI capabilities are
advancing, why increasingly powerful systems could pose serious risks, and the theory behind keeping AI aligned with human goals and under human
control. We will discuss the evidence, uncertainties, and open questions behind these concerns. No programming or prior AI experience is required."
The teacher also asked for: the training pipeline at frontier labs, scaling laws, the difference between unsupervised, supervised and
reinforcement learning, how deep learning works — and adapting everything to a grade 7–12 audience.
Audience rules: plain words a 7th grader follows (define every term the first time; analogies first, math optional), big type for a big room
(body ≥ 16pt, labels ≥ 12pt on NEW slides), interactive beats every ~5–8 minutes (hand-raise polls, guess-the-answer, think-pair-share — no devices),
honest about uncertainty and disagreement among experts, and NOT despair-inducing: frame risks as serious, unsolved problems that people
(including them) are working on. No sexual content, no self-harm/suicide cases, no gore, no weapon/bioweapon how-to detail, no profanity, and avoid
partisan politics (no slides centred on a politician). Keep the adult deck's look (same lib.js theme, kickers, frames, animations).`

const CHECK = { type: 'object', properties: {
  issues: { type: 'array', items: { type: 'object', properties: {
    slide: { type: 'string', description: 'slide number in the Splash render + its title' },
    file: { type: 'string', description: 'which source file the fix belongs in (e.g. tools/slides_splash_ml.js or tools/build_splash.js)' },
    severity: { type: 'string', enum: ['major', 'minor'] }, description: { type: 'string' }, fix: { type: 'string' } },
    required: ['slide', 'file', 'severity', 'description', 'fix'] } },
  overall: { type: 'string' } }, required: ['issues', 'overall'] }

const ML_RESEARCH = [
  { key: 'learning-types', task: `Supervised vs. unsupervised/self-supervised vs. reinforcement learning, explained for 12–17-year-olds, with REAL media:
a labelled-image grid (e.g. an ImageNet / CIFAR sample figure from the paper or official site), a clustering/self-supervised example, and RL examples
kids love — DeepMind AlphaGo/AlphaZero (2016/2017, with dates and the Move 37 story), OpenAI's hide-and-seek emergent tool use (Sep 2019, YouTube id +
thumbnail), a robot or simulated agent learning to walk by trial and error (a real GIF/clip you can download, e.g. from a project page). Also one
modern framing: LLM pretraining is self-supervised (predict the next word), post-training uses supervised examples + RL. Exact dates, URLs, files saved.` },
  { key: 'neural-nets', task: `How neural networks and deep learning work, and how they learn (loss, gradient descent, backpropagation), at a 7–12 level.
Find: 3Blue1Brown's neural-network series videos (YouTube ids, exact titles, the best 1–2 min segment to show, thumbnails saved) — especially "But what
is a neural network?" and the backpropagation intuition video; a real screenshot of TensorFlow Playground (playground.tensorflow.org) training a small
network; a real loss-landscape / gradient-descent figure with source; and a sourced history of model sizes (parameters): LeNet-5 (~60k), AlexNet (~60M,
2012), GPT-2 (1.5B, 2019), GPT-3 (175B, 2020), and what is publicly known/estimated for 2025–2026 frontier models (Epoch AI's database — label estimates).
Give simple, correct analogies (neuron = weighted vote; knobs/dials; hiker in fog walking downhill; backprop = passing blame backwards).` },
  { key: 'pipeline', task: `The training pipeline at frontier AI labs as of 2026, accurate but explainable to teenagers, with sources:
(1) next-token prediction and tokens (a real screenshot of a tokenizer page, e.g. OpenAI's tokenizer); (2) pretraining data scale (e.g. Llama 3: 15T
tokens, 2024; what is reported for 2025–2026 frontier models) and a sourced "how long would it take a person to read that" arithmetic; (3) training
compute, GPU counts and cost for frontier runs (Epoch AI data; also check ${ROOT}/assets/research/economy/manifest.json for figures the adult deck already
verified, e.g. GPT-6 Astra training energy/compute); (4) base model vs. assistant (a real example of a base model rambling vs. a chat answer, e.g. from
the InstructGPT paper or blog); (5) post-training: InstructGPT's 3-step figure (Ouyang et al. 2022 — save the real figure), RLHF, Anthropic's
Constitutional AI (Dec 2022) and Claude's constitution (2026 version if any), RL with verifiable rewards / reasoning models (OpenAI o1 Sep 2024,
DeepSeek-R1 Jan 2025 "aha moment" figure); (6) safety testing before release (system cards, red-teaming, responsible scaling policies) — and how
long each stage takes. Save real figures/screenshots.` },
  { key: 'scaling', task: `Scaling laws for teenagers, with REAL figures: Kaplan et al. 2020 "Scaling Laws for Neural Language Models" Figure 1 (save a clean
crop from the arXiv PDF/HTML), Hoffmann et al. 2022 "Chinchilla" (compute-optimal: ~20 tokens per parameter), Epoch AI's training-compute trend
(growth per year for frontier models, with a downloadable dataset → save a CSV of notable models' training compute by date for a native chart),
Rich Sutton's "The Bitter Lesson" (2019 — exact short quote), and the 2025–2026 debate (did pretraining scaling slow? test-time compute / RL scaling
as new axes — sourced). Give one honest, simple takeaway: loss falls predictably (a straight line on log-log axes) as compute, data and parameters grow,
which is why labs spend billions — but "lower loss" ≠ guaranteed specific abilities (emergence debate, sourced).` },
  { key: 'inside', task: `"We grow AI, we don't build it" and the black-box problem, for teenagers: Anthropic interpretability results with real images —
"Scaling Monosemanticity" (May 2024) features + Golden Gate Claude (exact demo date and a real screenshot), "Tracing the thoughts of a large language
model" (Mar 2025; a real circuit figure e.g. planning a rhyme), and a verified quote from a lab leader that models are "grown" rather than built
(e.g. Dario Amodei, "The Urgency of Interpretability", Apr 2025 — exact wording and URL). Also any 2026 interpretability milestone (check
${ROOT}/assets/research/frontier/manifest.json and xrisk/ for items the adult deck already verified, e.g. the model-welfare "pain direction" work).` },
]

const AUDIT_TASK = `AGE-APPROPRIATENESS AND FIT AUDIT of all 117 slides of the adult deck for the Splash class. For EVERY slide: view its JPG
(/home/user/blog/aisafety/slides/slide-NN.jpg), read its notes in ${MY}/deck_notes.txt, and check any clip/video it embeds (GIFs/MP4s are listed in
the slide's relationships inside ${ROOT}/AI_Safety_and_Existential_Risk.pptx — e.g. unzip -l / python zipfile; YouTube links are in the notes: fetch the
video page title/description and, where possible, a transcript or reliable summary, to check for profanity, sexual content, violence or disturbing
material). Rate each slide: suitable as-is for grades 7–12 / suitable with simpler wording / unsuitable (why), and its value for this class's arc
(how fast AI is advancing → why powerful AI could be risky → alignment theory and control → evidence, uncertainty, open questions → what people are
doing). Also locate each slide's source function: the module file and async function name in ${ROOT}/tools/slides_<module>.js (or theory_slides.js)
that builds it (the build() function at the bottom of each module lists them in order; theory slides are T.* calls in tools/build_deck.js).
Return a compact table-like text: n | function (module:fn) | rating | value 1–5 | one-line reason/flags | minutes it needs.`

function mlResearchPrompt(it) {
  return `${COMMON}

RESEARCH TASK "${it.key}" (other agents work in parallel — do NOT edit any code or manifest.json):
${it.task}

Save files under ${RS}/ (create it). Write ${RS}/${it.key}.json in the manifest schema of RESEARCH_BRIEF.md ({items, datasets, facts, not_found};
file paths relative to ${RS}/; "verified": true only for pages you loaded). Validate the JSON (python3 -m json.tool).
Final answer: concise findings — exact numbers, verbatim quotes, dates, URLs, files saved (with what each shows), suggested slide visuals — and what was not found.`
}

function planPrompt(audit) {
  return `${COMMON}

PLAN TASK. Using the audit below (and by viewing slide JPGs yourself where needed), write the slide-by-slide plan for the 110-minute Splash deck.
Structure (adjust if you have a better arc, but keep the registered split — first third ≈ 35–37 min on how AI works):
- Opening (~4 min): new title slide (AI Alignment and Safety · William Liaw · Cornell Splash · November 21, 2026), a hook, a short roadmap.
- PART 1 · HOW AI LEARNS (~36 min, NEW slides built by another agent in tools/slides_splash_ml.js — do not design them in detail; give the
  outline you want with minutes): what machine learning is; supervised vs. unsupervised/self-supervised vs. reinforcement learning (with a quiz);
  neural networks; loss, gradient descent, backpropagation; LLMs = next-token prediction, tokens; pretraining; base model vs assistant; post-training
  (SFT, RLHF, constitutions, RL with verifiable rewards → reasoning models); the full frontier-lab pipeline incl. safety testing; scaling laws and
  compute growth (reusing the adult deck's data-center/gigawatt slides here is welcome if suitable); "grown, not built" / interpretability → bridge.
- PART 2 · HOW FAST IT IS MOVING (~18–20 min), PART 3 · WHY IT COULD GO WRONG (alignment theory + evidence, ~30 min), PART 4 · WHAT WE CAN DO
  (~10 min) — built mostly by REUSING adult-deck slide functions (same visuals) with new Splash kicker/title/notes, plus a few NEW framing slides
  (section dividers, "how to think about this" (uncertainty, experts disagree, not doom), "what alignment researchers are trying", "what you can do",
  a final Q&A slide). Leave ~8 minutes for Q&A at the end. Total must be 110 minutes.
Reuse only slides the audit rates suitable; prefer fewer, stronger slides (≈ 1.5–2.5 min each) and kid-relevant examples (video Turing test
"Which one is real?", robots, the boat that games its reward, agents in their own words, heartbeats, "this presentation was made by an AI").
If a valuable slide needs a visual change (not just words) to be suitable, mark it "adapt" with exactly what to change.
Return (plain text, it is handed to the builders): a numbered slide list — n | part | NEW or REUSE module:fn (adult slide #) | Splash kicker
(e.g. "PART 2 · HOW FAST · 3") | Splash title (≤ 48 chars, sentence case, states the message, simple words) | minutes | interactive beat if any |
what the notes must say for this audience — then the cut list (adult slides left out, one-line reason each) and the minute total.

AUDIT:
${audit}`
}

function mlBuildPrompt(research, plan) {
  return `${COMMON}

BUILD TASK A — PART 1 "HOW AI LEARNS": create ${ROOT}/tools/slides_splash_ml.js exporting { build, slides } (build(d) adds all Part 1 slides in order;
slides = map of name → async slide function). You may edit only that file and create assets under ${ROOT}/assets/slides/splash/ and ${RS}/
(merge the ${RS}/*.json research into ${RS}/manifest.json — items/facts/datasets/not_found; keep valid JSON). Do NOT edit lib.js, build_deck.js or the
adult modules (another agent is editing build files in parallel).
Follow this plan's PART 1 outline and minutes (build exactly the Part 1 slides it lists, in its order, with its kickers/titles unless a better
simple title fits):
${plan}

Research results (JSON + saved media in ${RS}/):
${research.map(r => `--- research ${r.key} ---\n${r.text}`).join('\n')}

Design: same visual language as the adult deck (study tools/slides_capabilities.js and tools/theory_slides.js for patterns: d.frame clippings, native
charts via d.chart, d.stat, kicker/title placeholders, d.animate builds, d.video YouTube embeds). Many slides should be DIAGRAMS built from native
shapes (a tiny neural network with labelled layers; a hiker-on-a-hill gradient-descent picture; backprop arrows flowing backwards; the 3 learning
types side by side; next-token prediction with probability bars; the frontier pipeline as a left-to-right flow data → pretraining → post-training →
safety testing → release, each stage with what/how long/how much); real figures where they exist (Kaplan scaling-law figure, InstructGPT 3-step
figure, Golden Gate Claude); a native chart for compute growth or model size if the research saved data. Build steps with d.animate so the teacher
reveals ideas one click at a time. Include 2–3 interactive slides (e.g. "Supervised, unsupervised or RL? Hands up", "Predict the next word",
a quick check-for-understanding). Speaker notes for EVERY slide: minutes, what to say in plain words (a short script), the analogy, a question to ask
the class with the expected answers, a "for advanced students" aside where useful, and source URLs. Everything sourced; label estimates.
Run \`node tools/render_module.js splash_ml\` from ${ROOT} and view EVERY slide JPG (build/preview/splash_ml/); iterate until there is no overflow,
overlap, illegible text, dead space or clutter; then delete build/preview/splash_ml. Final answer: slide list (titles), what each shows, notes summary,
anything you could not do.`
}

function asmBuildPrompt(plan) {
  return `${COMMON}

BUILD TASK B — THE SPLASH ASSEMBLER. Another agent is writing tools/slides_splash_ml.js (Part 1) in parallel — do not touch it.
(1) Make every adult module ALSO export its slide functions without changing its build(): append to each tools/slides_<module>.js export a
\`slides\` object listing its slide functions by name (e.g. module.exports = { build, slides: { metrSlide, metrEvidenceSlide, … } }). Check that
./build.sh's adult deck is unaffected (build_deck.js output must stay 117 slides; you can verify by running \`node tools/build_deck.js /tmp/adult-check.pptx\`
then deleting it — or by reasoning if disk is short).
(2) Write ${ROOT}/tools/build_splash.js (+ ${ROOT}/build_splash.sh mirroring build.sh: build → python3 tools/postprocess.py → copy to
${ROOT}/AI_Alignment_and_Safety_Splash.pptx; optional --render to PDF+JPGs under build/splash/). It assembles, in the plan's order: new framing slides
(write them in a new module ${ROOT}/tools/slides_splash_extra.js exporting { build, slides }: title, roadmap, section dividers, "how to think about
this", "what alignment researchers are trying", "what you can do", Q&A — strong visuals, not text walls), Part 1 by calling
require('./slides_splash_ml').build(d) if that file exists (skip with a warning if not yet), and the REUSED adult slides by calling their slide
functions through a helper that overrides the kicker, title and speaker notes of the slide the function creates — e.g. temporarily wrap d.slide so the
returned slide's addText(…, {placeholder:'kicker'|'title'}) uses the Splash text and addNotes(…) uses the Splash notes (keep the original visuals
untouched). Where the plan says "adapt", write a Splash-specific variant function in slides_splash_extra.js instead. Use d.sectionStart for
Opening / Part 1–4 / Q&A. Notes for every reused slide: minutes, a plain-words script for grades 7–12 (define terms), a question to ask, the takeaway,
and the source URLs from the adult notes (${MY}/deck_notes.txt). Keep each title ≤ 48 chars.
(3) Write ${ROOT}/SPLASH.md: run of show (clock time from 0:00, slide numbers, minutes, interactive beats, what to cut if running long), the materials
needed, and how to build. Add a short pointer to it in ${ROOT}/README.md.
PLAN:
${plan}
(4) Build it (./build_splash.sh --render, or build + render the parts you changed) and view the slides you created or re-titled; fix overflow
(Splash titles must fit one line at the title size) and anything else broken. Delete renders you no longer need. Final answer: the final slide list
(n | title | minutes | source), the files you created/changed, and anything you could not do.`
}

function integratePrompt(mlReport, asmReport) {
  return `${COMMON}

INTEGRATION TASK. Two builders finished: Part 1 (tools/slides_splash_ml.js) and the assembler (tools/build_splash.js, tools/slides_splash_extra.js,
build_splash.sh, SPLASH.md). Reports:
--- Part 1 builder ---
${mlReport}
--- assembler ---
${asmReport}
Now: run \`./build_splash.sh --render\` from ${ROOT} (PDF + JPGs under build/splash/), view EVERY slide JPG, and fix integration problems in any of the
Splash files (order, duplicate or missing slides, kicker numbering per part, transitions between parts, the minute total = 110 incl. ~8 min Q&A —
update SPLASH.md to match the final deck exactly). Also confirm \`./build.sh\` would still produce the 117-slide adult deck (node tools/build_deck.js
to a temp file, count, delete). Leave the final render in build/splash/ (slide-NN.jpg) for the reviewers. Final answer: final slide list with minutes,
total, the deck's file size, and what you fixed.`
}

function reviewPrompt(lens, report) {
  const focus = {
    visual: `LENS = VISUAL/DESIGN on every slide: overflow, overlap, clipped or illegible text (new slides: body ≥ 16pt, labels ≥ 12pt — it is a big room),
dead space or clutter, diagrams that don't read at a glance, broken/blank images or GIF first frames, inconsistent kicker/title style or numbering,
titles that wrap to two lines, sensible animation builds (read the code's d.animate calls).`,
    accuracy: `LENS = ACCURACY/TRUTHFULNESS. Part 1's ML explanations must be correct (simplified is fine, wrong is not): supervised vs self-supervised vs
RL, what a neuron/parameter is, loss, gradient descent, backprop, tokens, pretraining, SFT/RLHF/constitutions/RLVR, scaling laws (what Kaplan and
Chinchilla actually found), compute trends, interpretability claims. Every number/quote/figure must trace to a verified item in
${RS}/manifest.json (or the adult manifests for reused slides) and be labelled (estimate, vendor claim, rumor). Re-titled reused slides must not
overstate their original evidence. Spot-check sources on the web.`,
    pedagogy: `LENS = TEACHER OF GRADES 7–12 and Splash veteran. Is every term defined the first time? Could a 7th grader follow the Part 1 story, and is
there enough for a 12th grader? Are there interactive beats every ~5–8 min that work with up to 200 students and no devices? Does the timing really
fit 110 minutes (SPLASH.md + per-slide minutes in notes; 1.5–2.5 min per content slide is realistic)? Is anything unsuitable for 12-year-olds
(sexual content, self-harm, gore, weapon detail, profanity in clips, partisan politics) or needlessly frightening — and does the deck end with agency
and honest uncertainty rather than doom? Are the speaker notes usable as a script by the teacher?`,
  }[lens]
  return `${COMMON}

REVIEW TASK (${lens}). The Splash deck is built: ${ROOT}/AI_Alignment_and_Safety_Splash.pptx, rendered slides at ${ROOT}/build/splash/slide-*.jpg
(re-render with ./build_splash.sh --render only if they are missing — another reviewer may be reading them; do NOT delete them). Source files:
tools/slides_splash_ml.js, tools/slides_splash_extra.js, tools/build_splash.js, SPLASH.md. Latest build report:
${report}
View EVERY slide JPG at full attention and read the notes (python zipfile on the pptx, ppt/notesSlides/) and code.
${focus}
Return only real problems with concrete fixes and the FILE each fix belongs in (empty list if clean). Do not edit files.`
}

function fixPrompt(file, issues, round) {
  return `${COMMON}

FIX TASK (round ${round}) — you own ONLY these files: ${file}. (Another fixer may be editing the other Splash files at the same time; do not touch them.)
Fix these independent review findings (reject any you disagree with, saying why):
${JSON.stringify(issues, null, 1)}
Check your changes by rendering: for tools/slides_splash_ml.js use \`node tools/render_module.js splash_ml\` (then delete build/preview/splash_ml);
for the assembler files build the full deck to a separate output (node tools/build_splash.js build/splash_fix_${round}/deck.pptx && python3 tools/postprocess.py
build/splash_fix_${round}/deck.pptx, render with LibreOffice + pdftoppm into build/splash_fix_${round}/, view the affected slides, then delete that folder).
Do not run ./build_splash.sh and do not touch build/splash/. Final answer: what changed, what you rejected and why.`
}

// ---------------- Haiku swarm (non-editing work split into small subtasks) ----------------
const HAIKU = { agentType: 'general-purpose', model: 'haiku' }
const SUBTASKS = [
  { group: 'neural-nets', key: '3b1b', task: `3Blue1Brown's neural-network series on YouTube: the exact titles and video ids of "But what is a neural network?" and of the gradient-descent and backpropagation videos (open each YouTube page or 3blue1brown.com), the best 1–2 minute segment of each to show in class (timestamps), and save each thumbnail (https://i.ytimg.com/vi/<id>/maxresdefault.jpg) to ${RS}/.` },
  { group: 'neural-nets', key: 'playground', task: `A real screenshot of TensorFlow Playground (https://playground.tensorflow.org) training a small network (shot.js with --wait so it trains a few seconds), saved to ${RS}/tf-playground.png; view it and describe what it shows.` },
  { group: 'neural-nets', key: 'param-history', task: `A sourced history of model sizes (parameters) for a native chart: LeNet-5 (1998, ~60k), AlexNet (2012, ~60M), GPT-2 (2019, 1.5B), GPT-3 (2020, 175B), plus what Epoch AI's database lists or estimates for 2024–2026 frontier models (label estimates). Every value with a URL you opened.` },
  { group: 'neural-nets', key: 'gd-figure', task: `A real, reusable figure of a loss landscape or gradient descent (e.g. Wikimedia Commons; note its license) saved to ${RS}/, plus one simple, correct analogy each for: a neuron (weighted vote), parameters (knobs), gradient descent (hiker in fog walking downhill), backpropagation (passing blame backwards through the layers).` },
  { group: 'pipeline', key: 'tokens', task: `Next-token prediction and tokens: a real screenshot of a tokenizer page (e.g. https://platform.openai.com/tokenizer or tiktokenizer.vercel.app) tokenizing a short sentence, saved to ${RS}/; a sourced one-line definition of a token and the typical tokens-per-word ratio.` },
  { group: 'pipeline', key: 'data-scale', task: `Pretraining data scale: Llama 3's 15T training tokens (2024, Meta's own page) and what is reported for 2025–2026 frontier models (sourced; label estimates); then a "how long would one person take to read that" calculation with its assumptions (reading speed, tokens per word) stated.` },
  { group: 'pipeline', key: 'compute-cost', task: `Training compute, GPU counts and cost of frontier runs as of 2026 from Epoch AI (FLOP and cost of the largest runs; GPU counts of a few named clusters), and any figures already verified in ${ROOT}/assets/research/economy/manifest.json (e.g. GPT-6 Astra training energy) — cite which manifest item.` },
  { group: 'pipeline', key: 'base-vs-chat', task: `Base model vs. assistant: a real, citable example of a pretrained-only model's continuation vs. an instruction-tuned answer to the same prompt (e.g. OpenAI's InstructGPT blog post or paper, 2022), quoted exactly with URL.` },
  { group: 'pipeline', key: 'instructgpt-fig', task: `The InstructGPT 3-step figure (Ouyang et al. 2022, arXiv 2203.02155, Figure 2: SFT → reward model → PPO): download the PDF into a new folder ${RS}/tmp-instructgpt/, render the page with pdftoppm -r 200, crop the figure with python3 -I (PIL) to ${RS}/instructgpt-fig2.png, view it, then delete the tmp folder.` },
  { group: 'pipeline', key: 'constitution', task: `Anthropic's Constitutional AI (Dec 2022 paper) in one simple sentence, and Claude's constitution (the latest version Anthropic published — date, URL, one short verbatim line suitable for teenagers).` },
  { group: 'pipeline', key: 'rlvr', task: `RL with verifiable rewards and reasoning models: OpenAI o1 (Sep 2024 announcement — its "thinks before it answers" framing and the train-time / test-time compute chart; save a clean screenshot crop of that chart to ${RS}/) and DeepSeek-R1 (Jan 2025 paper: the "aha moment" example, verbatim), with dates and URLs.` },
  { group: 'pipeline', key: 'safety-testing', task: `How frontier labs test models before release (2025–2026): system cards, red-teaming, dangerous-capability evaluations, Anthropic's Responsible Scaling Policy and OpenAI's Preparedness Framework — one sourced plain-words sentence each, and how long pre-release testing takes only if a source says.` },
  { group: 'scaling', key: 'kaplan', task: `Kaplan et al. 2020 "Scaling Laws for Neural Language Models" (arXiv 2001.08361) Figure 1: download the PDF into a new folder ${RS}/tmp-kaplan/, render the page, crop Figure 1 with python3 -I (PIL) to ${RS}/kaplan-fig1.png, view it, delete the tmp folder, and give its takeaway in one simple sentence.` },
  { group: 'scaling', key: 'chinchilla', task: `Hoffmann et al. 2022 "Training Compute-Optimal Large Language Models" (Chinchilla, arXiv 2203.15556): the compute-optimal finding (≈20 tokens per parameter; Chinchilla 70B vs Gopher 280B) stated exactly from the paper, with page/figure refs.` },
  { group: 'scaling', key: 'epoch-trend', task: `Epoch AI's training-compute trend for notable/frontier models: the growth per year (exact figure and date from Epoch's page) and its downloadable dataset → save a trimmed CSV ${RS}/epoch_compute_trend.csv (model, date, training FLOP) of ~15–25 well-known models from 2012 to 2026 for a native chart.` },
  { group: 'scaling', key: 'bitter-lesson', task: `Rich Sutton's "The Bitter Lesson" (2019, http://www.incompleteideas.net/IncIdeas/BitterLesson.html): one exact short quote suitable for a slide, and one plain sentence on what it means.` },
  { group: 'scaling', key: 'debate', task: `The 2025–2026 debate on whether pretraining scaling slowed and the new scaling axes (test-time compute, RL scaling): 2–3 sourced statements with dates; plus the "are emergent abilities a mirage?" point (Schaeffer et al. 2023) in one sentence.` },
  { group: 'inside', key: 'monosemanticity', task: `Anthropic's "Scaling Monosemanticity" (May 2024) and Golden Gate Claude (exact demo date; a real screenshot of the announcement or a feature example) saved to ${RS}/, with one simple sentence on what a "feature" is.` },
  { group: 'inside', key: 'tracing', task: `Anthropic's "Tracing the thoughts of a large language model" (Mar 2025): save a real figure (e.g. planning a rhyme ahead) to ${RS}/ and give one kid-friendly sentence on what it shows.` },
  { group: 'inside', key: 'grown-quote', task: `Verify a lab leader's quote that AI models are "grown" rather than built — e.g. Dario Amodei, "The Urgency of Interpretability" (Apr 2025): exact wording, URL, date.` },
  { group: 'inside', key: 'interp-2026', task: `Interpretability milestones of 2025–2026 the adult deck already verified: read ${ROOT}/assets/research/frontier/manifest.json and ${ROOT}/assets/research/xrisk/manifest.json (and openweights/ for the model-welfare "pain direction" work) and list the 3 most kid-friendly verified items (title, date, URL, saved media paths).` },
]
function subPrompt(s) {
  return `${COMMON}

SMALL RESEARCH SUBTASK "${s.group}/${s.key}" (one of many small agents working in parallel — do ONLY this; do NOT edit code or manifest.json):
${s.task}
Save files under ${RS}/ (create it). Write ${RS}/${s.group}-${s.key}.json in the manifest schema of RESEARCH_BRIEF.md ({items, datasets, facts,
not_found}; file paths relative to ${RS}/; "verified": true only for pages you actually loaded). Validate it (python3 -m json.tool).
Final answer (short): the exact facts, quotes and numbers with URLs, files saved and what each shows, and what was not found.`
}
const PARTS = [
  { key: 'open-p1', minutes: 40, pool: 'adult slides 8, 9 and 10 only (data centers / gigawatt), optionally reused inside Part 1’s scaling section', task: `the OPENING (~4 min: a new title slide "AI Alignment and Safety · William Liaw · Cornell Splash · November 21, 2026", a hook, a short roadmap) and the OUTLINE of PART 1 · HOW AI LEARNS (~36 min of NEW slides another agent builds in tools/slides_splash_ml.js — give each slide's title, minutes and what it teaches, not its design): what machine learning is; supervised vs. unsupervised/self-supervised vs. reinforcement learning (with a quiz); neural networks; loss, gradient descent, backpropagation; LLMs = next-token prediction, tokens; pretraining; base model vs. assistant; post-training (SFT, RLHF, constitutions, RL with verifiable rewards → reasoning models); the full frontier-lab pipeline incl. safety testing; scaling laws and compute growth; "grown, not built" / interpretability → bridge to Part 2. An interactive beat every ~5–8 min.` },
  { key: 'p2', minutes: 20, pool: 'adult slides 4–54 except 8, 9 and 10', task: `PART 2 · HOW FAST IT IS MOVING (~20 min incl. a section divider): the strongest, most kid-relevant evidence of fast progress (e.g. release cadence, task horizons, Humanity's Last Exam, the "Which one is real?" video Turing test, robots, math), REUSING adult slides.` },
  { key: 'p3', minutes: 30, pool: 'adult slides 55–95', task: `PART 3 · WHY IT COULD GO WRONG (~30 min incl. a section divider): alignment theory (orthogonality, instrumental convergence, specification gaming — the boat) and the evidence (frontier models gaming tests, agents in their own words, heartbeats, chain-of-thought we can't read, self-improvement), REUSING adult slides, plus one NEW "how to think about this" slide (uncertainty, experts disagree, not doom).` },
  { key: 'p4', minutes: 20, pool: 'adult slides 96–117', task: `PART 4 · WHAT WE CAN DO (~12 min incl. a section divider) and Q&A (~8 min): one or two kid-suitable world slides if valuable (e.g. model welfare), NEW slides "what alignment researchers are trying" (interpretability, oversight, evals, control, governance) and "what you can do", the adult "So what do we do?" and "This presentation was made by an AI" slides if suitable, and a final Q&A slide.` },
]
function partPlanPrompt(p, audit) {
  return `${COMMON}

SMALL PLANNING SUBTASK "${p.key}" — you plan ONE part of the 110-minute Splash deck (other agents plan the other parts in parallel):
${p.task}
Your minute budget: exactly ${p.minutes} minutes. You may reuse ONLY ${p.pool} (view their JPGs before choosing). Reuse only slides the audit rates
suitable; prefer fewer, stronger slides (≈ 1.5–2.5 min each). If a valuable slide needs a visual change to be suitable, mark it "adapt" with what to change.
Return plain text: a numbered list for your part only — n | part | NEW or REUSE module:fn (adult slide #) | Splash kicker (e.g. "PART 2 · HOW FAST · 3") |
Splash title (≤ 48 chars, sentence case, states the message, simple words) | minutes | interactive beat if any | what the notes must say for this
audience — then the adult slides from your pool you left out (one-line reason each) and your minute total.

AUDIT:
${audit}`
}
const FOCUS = {
  visual: `LENS = VISUAL/DESIGN: overflow, overlap, clipped or illegible text (new slides: body ≥ 16pt, labels ≥ 12pt — it is a big room), dead space or
clutter, diagrams that don't read at a glance, broken/blank images or GIF first frames, inconsistent kicker/title style or numbering, titles that wrap to
two lines, sensible animation builds (read the code's d.animate calls for your slides).`,
  accuracy: `LENS = ACCURACY/TRUTHFULNESS: ML explanations must be correct (simplified is fine, wrong is not); every number, quote and figure must trace to a
verified item in ${RS}/manifest.json (or the adult manifests for reused slides) and be labelled (estimate, vendor claim, rumor); re-titled reused slides
must not overstate their original evidence. Spot-check a source on the web when unsure.`,
  pedagogy: `LENS = TEACHER OF GRADES 7–12: is every term defined the first time; could a 7th grader follow, and is there enough for a 12th grader; does any
interactive beat work with up to 200 students and no devices; anything unsuitable for 12-year-olds (sexual content, self-harm, gore, weapon detail,
profanity in clips, partisan politics) or needlessly frightening; are the speaker notes usable as a script, with minutes?`,
}
function chunkReviewPrompt(lens, a, b, report) {
  return `${COMMON}

SMALL REVIEW SUBTASK (${lens}, slides ${a}–${b} ONLY; other agents review the other slides and lenses in parallel). The Splash deck is built:
${ROOT}/AI_Alignment_and_Safety_Splash.pptx, rendered at ${ROOT}/build/splash/slide-*.jpg (zero-padded names; do NOT re-render or delete them).
View only slides ${a}–${b} at full attention, read their speaker notes (python3 -I with zipfile: ppt/slides/slideN.xml → its notes slide) and the code
that builds them (tools/slides_splash_ml.js, tools/slides_splash_extra.js, tools/build_splash.js). Latest build summary:
${String(report).slice(0, 3000)}
${FOCUS[lens]}
Return only real problems in YOUR slides with concrete fixes and the FILE each fix belongs in (empty list if clean). Do not edit files.`
}
function arcReviewPrompt(report) {
  return `${COMMON}

SMALL REVIEW SUBTASK (whole-deck ARC and TIMING). Read ${ROOT}/SPLASH.md and the per-slide minutes in the speaker notes of
${ROOT}/AI_Alignment_and_Safety_Splash.pptx (python3 -I zipfile). Check: the minutes add up to 110 incl. ~8 min Q&A and SPLASH.md matches the deck;
Part 1 is about the first third; an interactive beat every ~5–8 minutes; the arc ends with agency and honest uncertainty rather than doom; no topic
repeated across parts. Latest build summary: ${String(report).slice(0, 3000)}
Return only real problems with concrete fixes and the FILE each fix belongs in (empty list if clean). Do not edit files.`
}
const INTEG = { type: 'object', properties: { report: { type: 'string' }, slideCount: { type: 'integer' } }, required: ['report', 'slideCount'] }

// ---------------- run ----------------
phase('Research')
// research items the first (Sonnet) run already finished replay from cache; everything else runs as small Haiku subtasks
const KEEP = ['learning-types']
const mlResearchP = parallel([
  ...ML_RESEARCH.filter(it => KEEP.includes(it.key)).map(it => () =>
    agent(mlResearchPrompt(it), { label: `research:${it.key}`, phase: 'Research', agentType: 'general-purpose', model: 'sonnet' })
      .then(r => ({ key: it.key, text: r || '(returned nothing)' }))),
  ...SUBTASKS.filter(s => !KEEP.includes(s.group)).map(s => () =>
    agent(subPrompt(s), { label: `research:${s.group}/${s.key}`, phase: 'Research', ...HAIKU })
      .then(r => ({ key: `${s.group}/${s.key}`, text: r || '(returned nothing)' }))),
])
const planP = agent(AUDIT_TASK.replace(/^/, `${COMMON}\n\n`), { label: 'audit:adult-deck', phase: 'Research', agentType: 'general-purpose', model: 'sonnet' })
  .then(audit => parallel(PARTS.map(p => () =>
    agent(partPlanPrompt(p, audit || '(audit failed — view the slide JPGs yourself)'), { label: `plan:${p.key}`, phase: 'Plan', ...HAIKU }))))
  .then(parts => parts.map((t, i) => `===== ${PARTS[i].key} (${PARTS[i].minutes} min) =====\n${t || '(this part\'s planner returned nothing — plan it yourself)'}`).join('\n\n')
    + `\n\nNOTE: the four parts above were planned by separate agents. Renumber slides consecutively, keep each part's minute budget (total 110 incl. Q&A), and drop any duplicate slide.`)

const [mlReport, asmReport] = await Promise.all([
  Promise.all([mlResearchP, planP]).then(([research, plan]) =>
    agent(mlBuildPrompt(research, plan), { label: 'build:part1-ml', phase: 'Build', agentType: 'general-purpose' })),
  planP.then(plan => agent(asmBuildPrompt(plan), { label: 'build:assembler', phase: 'Build', agentType: 'general-purpose' })),
])

phase('Integrate')
const COUNT_ASK = `\nReturn: report = your final answer text; slideCount = the number of slides in the final deck.`
let integ = await agent(integratePrompt(mlReport, asmReport) + COUNT_ASK, { label: 'integrate', phase: 'Integrate', agentType: 'general-purpose', schema: INTEG })
let report = integ ? integ.report : '(integration returned nothing)'
let count = (integ && integ.slideCount) || 70

const rounds = []
for (let round = 1; round <= 3; round++) {
  const jobs = []
  for (const lens of ['visual', 'accuracy', 'pedagogy'])
    for (let a = 1; a <= count; a += 10) {
      const b = Math.min(count, a + 9)
      jobs.push(() => agent(chunkReviewPrompt(lens, a, b, report), { label: `review:${lens}:${a}-${b}#${round}`, phase: 'Review', schema: CHECK, ...HAIKU }))
    }
  jobs.push(() => agent(arcReviewPrompt(report), { label: `review:arc#${round}`, phase: 'Review', schema: CHECK, ...HAIKU }))
  const reviews = (await parallel(jobs)).filter(Boolean)
  const issues = reviews.flatMap(r => r.issues)
  const major = issues.filter(i => i.severity === 'major').length
  rounds.push({ round, issues: issues.length, major, overall: reviews.map(r => r.overall) })
  log(`review round ${round}: ${issues.length} issues (${major} major)`)
  if (!issues.length) break
  const mlIssues = issues.filter(i => /splash_ml/.test(i.file))
  const asmIssues = issues.filter(i => !/splash_ml/.test(i.file))
  const fixes = await parallel([
    mlIssues.length ? () => agent(fixPrompt('tools/slides_splash_ml.js (+ assets/slides/splash/, assets/research/splash/)', mlIssues, round), { label: `fix:ml#${round}`, phase: 'Fix', agentType: 'general-purpose' }) : null,
    asmIssues.length ? () => agent(fixPrompt('tools/build_splash.js, tools/slides_splash_extra.js, build_splash.sh, SPLASH.md, README.md', asmIssues, round), { label: `fix:asm#${round}`, phase: 'Fix', agentType: 'general-purpose' }) : null,
  ].filter(Boolean))
  const re = await agent(integratePrompt(fixes.filter(Boolean).join('\n\n'), `(round ${round} fixes applied; rebuild and re-check everything)`) + COUNT_ASK, { label: `reintegrate#${round}`, phase: 'Integrate', agentType: 'general-purpose', schema: INTEG })
  if (re) { report = re.report; count = re.slideCount || count }
  if (!major) break
}
return { report, rounds, mlReport, asmReport }
