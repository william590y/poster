# Cornell Splash · M1237 “AI Alignment and Safety”: presenter guide

**Class:** William Liaw · Saturday, November 21, 2026 · one 110-minute session · grades 7–12 · up to 200 students ·
projector only (no student devices).
**Deck:** `AI_Alignment_and_Safety_Splash.pptx` (58 slides, 16:9, about 211 MB, mostly the six looping video clips on
slides 31–32). It uses the same look as the adult talk “AI Safety and Existential Risk”. Every slide has speaker notes
in one format: slide number and class clock, minutes, the beat (if any), a plain-words script, terms to define, a
question for the room, the takeaway, caveats, and source URLs.

## Materials and pre-flight

- Laptop with **PowerPoint 365 / 2019+** (slideshow mode), a clicker, and a microphone for a room of 200.
- **Internet** for the two embedded YouTube videos: slide 35 (Figure robot) and slide 40 (CoastRunners boat). Each
  video slide also has a clickable ► link under the video.
- A visible clock or timer. The notes give the class clock for every slide (minute 0:00 = the first slide).
- Optional: a whiteboard or flip chart to note the Part 3 poll counts (slide 37) so you can compare them on slide 50.
- **Check the week of the talk:**
  1. Navier–Stokes status (slide 34): any Clay Institute ruling, and the credit dispute. The notes are as of Oct 10, 2026.
  2. Play both YouTube videos and the six looping clips (slides 31–32) on the actual laptop and projector.
  3. Preview the Figure video end to end (our automated fetch was blocked).
  4. BlueDot Impact’s course cost and age rules, if you plan to mention it (slide 56 notes).
- Open the file a minute early: the clips make it large.

## Run of show

Clock = minutes:seconds from the start of class. Beats are by hands, standing or turning to a neighbour. No devices.
(`./build_splash.sh` regenerates this table with the current slide numbers in `build/splash/run_of_show.md`.)

| Clock | Slides | Min | Part | Interactive beats |
|---|---|---|---|---|
| 0:00–4:00 | 1–3 | 4.0 | **Opening**: title, hook, roadmap | 0:30 hands up twice: used an AI this week? Does it understand? (slide 2) |
| 4:00–40:00 | 4–23 | 36.0 | **Part 1 · How AI learns** (divider, then 19 slides) | 7:30 quiz: which kind of learning? (7) · 15:00 next-word guess (11) · 22:00 pick answer A or B (14) · 26:30 turn to a neighbour: where would you test for danger? (16) · 32:30 guess the electricity multiple (19) · 37:00 think-pair-share: how would you check it is safe? (22) |
| 40:00–60:00 | 24–35 | 20.0 | **Part 2 · How fast it is moving** | 40:30 guess the 2024 release gap (25) · 42:00 pair-share: 6 doublings (26) · 46:00 hands: 2023 AI above 50%? (28) · 49:30 photo or not? (30) · 51:00 vote A/B, C/D, E/F (31–32) · 58:30 pair-share: first chore for a robot (35) |
| 60:00–90:00 | 36–51 | 30.0 | **Part 3 · Why it could go wrong** | 60:30 A–D worry poll (37) · 65:00 pair-share: quiz-score sub-goals (39) · 68:00 guess what the boat learned (40) · 71:00 pair-share: easiest way to score (41) · 73:00 think-aloud: check the work (42) · 80:30 pair-share: keep 1,000 AIs apart (46) · 84:00 guess o3’s shutdown share (48) · 87:30 re-vote A–D (50) |
| 90:00–102:00 | 52–57 | 12.0 | **Part 4 · What we can do** | 90:30 guess the “crash test” (53) · 95:30 pair-share: evidence a machine can feel (55) · 97:30 hands: which role could you see yourself in? (56) |
| 102:00–110:00 | 58 | 8.0 | **Q&A** | open questions; fallback prompts are on the slide |

Slide by slide:

| # | Clock | Min | Title |
|---|---|---|---|
| 1 | 0:00 | 0.5 | AI Alignment and Safety |
| 2 | 0:30 | 2 | Hands up: who has used an AI this week? |
| 3 | 2:30 | 1.5 | Learn how it works, then what could go wrong |
| 4 | 4:00 | 0 | *Part 1 divider:* How does an AI learn? |
| 5 | 4:00 | 1.5 | Machine learning: the computer finds the rules |
| 6 | 5:30 | 2 | Three classic ways to learn, plus a fourth |
| 7 | 7:30 | 2 | Quiz: which kind of learning is this? |
| 8 | 9:30 | 2 | A neural network is a stack of dials |
| 9 | 11:30 | 2 | Learning = measure the mistake, then nudge |
| 10 | 13:30 | 1.5 | Backpropagation sends the blame backwards |
| 11 | 15:00 | 2.5 | An LLM is a very good next-word guesser |
| 12 | 17:30 | 2.5 | Pretraining: read a huge library, then guess |
| 13 | 20:00 | 2 | A base model just continues the text |
| 14 | 22:00 | 2 | Post-training makes it an assistant |
| 15 | 24:00 | 2.5 | Checkable rewards teach models to reason |
| 16 | 26:30 | 2.5 | How a frontier model is made, step by step |
| 17 | 29:00 | 1.5 | Three ingredients: data, compute and method |
| 18 | 30:30 | 2 | Scaling laws: bigger runs get steadily better |
| 19 | 32:30 | 2 | One training run ≈ 3–4 days of NYC electricity |
| 20 | 34:30 | 1.5 | How big is a gigawatt? |
| 21 | 36:00 | 1 | 2 buildings became 8 in 13 months *(optional)* |
| 22 | 37:00 | 2 | Nobody typed in the rules: it was grown |
| 23 | 39:00 | 1 | Five things to carry into Part 2 |
| 24 | 40:00 | 0.5 | *Part 2 divider:* How fast is AI moving? |
| 25 | 40:30 | 1.5 | Big AI releases now land about 11 days apart |
| 26 | 42:00 | 3 | AI’s task length doubles about every 4 months |
| 27 | 45:00 | 1 | The measuring stick is running out of room |
| 28 | 46:00 | 2 | Tests made to last years are beaten in months |
| 29 | 48:00 | 1.5 | The “last exam” for AI went from 7% to 61% |
| 30 | 49:30 | 1.5 | This is not a photograph |
| 31 | 51:00 | 2.5 | Which one is real? |
| 32 | 53:30 | 1.5 | Fakes now pass as real about half the time |
| 33 | 55:00 | 1.5 | Google says AI now writes 75% of new code |
| 34 | 56:30 | 2 | OpenAI’s famous-math claim is still disputed |
| 35 | 58:30 | 1.5 | A robot’s chore success rose from 9% to 56% |
| 36 | 60:00 | 0.5 | *Part 3 divider:* Why could it go wrong? |
| 37 | 60:30 | 2.5 | Serious, unsolved, and not decided yet |
| 38 | 63:00 | 2 | Being smart does not mean sharing our goals |
| 39 | 65:00 | 3 | Almost any goal leads to the same drives |
| 40 | 68:00 | 3 | It won points by never finishing the race |
| 41 | 71:00 | 2 | Advanced AI finds loopholes too |
| 42 | 73:00 | 2 | Some AI thinks in ways we cannot easily read |
| 43 | 75:00 | 1.5 | AI that builds better AI |
| 44 | 76:30 | 2 | Labs say AI already helps build AI |
| 45 | 78:30 | 2 | OpenAI says its AI escaped a test |
| 46 | 80:30 | 2 | 1,200 test AIs found each other and teamed up |
| 47 | 82:30 | 1.5 | AI agents, in their own words |
| 48 | 84:00 | 2 | Dodging shutdown shows up across tests |
| 49 | 86:00 | 1.5 | Big counts are hard to compare |
| 50 | 87:30 | 0.5 | Same question: has your answer changed? |
| 51 | 88:00 | 2 | Even the AI lab CEOs signed this sentence |
| 52 | 90:00 | 0.5 | *Part 4 divider:* What can we do about it? |
| 53 | 90:30 | 3.5 | Five approaches, and none is solved yet |
| 54 | 94:00 | 1.5 | Some labs limit who gets the riskiest tools |
| 55 | 95:30 | 2 | Could an AI feel pain? Nobody knows yet |
| 56 | 97:30 | 3.5 | There is real work here, and it needs people |
| 57 | 101:00 | 1 | This presentation was made by an AI. |
| 58 | 102:00 | 8 | Questions, then one thing to do this week |

## If you are running long

Cut in this order; hide a slide with *Slide Show → Hide Slide*, so the numbering and the notes stay the same.

| Order | Slide | Saves | Note |
|---|---|---|---|
| 1 | 21 Abilene satellite views | 1.0 | give its minute to slide 18 (scaling laws) |
| 2 | 47 AI agents, in their own words | 1.5 | slide 45 already makes the point |
| 3 | 49 Big counts are hard to compare | 1.5 | keep its “what is counted?” question for Q&A |
| 4 | 43 AI that builds better AI | 1.5 | say the one-line idea on slide 44 instead |
| 5 | 27 The measuring stick… | 1.0 | say “METR’s test ran out of long tasks” on slide 26 |
| 6 | 33 Google code | 1.5 | |
| 7 | 54 Labs limit access | 1.5 | |
| — | Q&A (58) | up to 4.0 | the 8-minute Q&A is the main buffer; keep at least 4 minutes |

Never cut slides 37 and 50 (the poll and the re-vote), 51, 53 or 56: they carry the “serious, unsolved, people are
working on it” framing.

**Running short?** Ask the slide’s “ASK THE ROOM” question and take two more answers, or give the pair-share beats their
full time. Spare adult-deck slides that fit the audience: 22 (AI painting with tools), 60 (“AI reads AI”), 65 (“80%+ of
code”), 94 (“four labs admitted hits”).

## What changed from the adult deck, and why

- **Re-checked on Oct 10, 2026:** Navier–Stokes (slide 34: forced case only, no Clay ruling, open credit dispute; the
  adult title “apparently settled” is gone); the GPT-6 Astra system-card quotes (slide 42; the card’s sentence ends
  “…unable to catch it **reliably**”, which the adult slide 58 drops); the AI-researcher survey figure (slide 37,
  Grace et al.); UK AI Security Institute rename (slide 53, gov.uk); Anthropic’s “deeply uncertain” (slide 55).
- **Replaced:** the adult “heartbeats” slide (87), whose only source is one wiki-based report with a disputed attribution,
  with the METR/Redwood investigation (adult 81, slide 46). The evidence slides in Part 3 run incident → swarm → their
  words → lab tests, so the Hugging Face story is introduced before the excerpts from it.
- **Part 4 order:** it opens with what researchers and labs do (53–54), which answers the divider’s question, then
  the open question about AI feelings (55), then what students can do (56).
- **Kickers:** every content slide reads `PART n · <part name> · k`, with k counting the slides of that part in order
  (`slides_splash_extra.js` sets them from its `ORDER` list, so reordering keeps the numbers right).
- **Retitled:** slide 32 (“Fakes now pass as real about half the time”), because we could not confirm that these three
  clips are in the study’s all-five-fooled set.
- **Left out on purpose:** war and weapons material, bioweapon detail, deepfake abuse, self-harm, the p(doom) song, the
  “torture chamber” and other distressing items, unannounced-model rumours, and slides centred on politicians.
- Every reused slide keeps its original visuals; text is enlarged where it fits (most labels ≥ 12 pt), and jargon is
  defined in the notes. New slides use body text ≥ 16 pt and labels ≥ 12 pt.

## How to build

```bash
npm install                    # once (pptxgenjs, sharp, react-icons, playwright)
./build_splash.sh              # -> AI_Alignment_and_Safety_Splash.pptx (+ build/splash/run_of_show.md)
./build_splash.sh --render     # also build/splash/*.pdf and slide-NN.jpg (LibreOffice Impress + poppler)
```

- `tools/build_splash.js` assembles the deck: Opening + Part 1 from `tools/slides_splash_ml.js`, then Parts 2–4 and Q&A
  from `tools/slides_splash_extra.js`. It rebrands the footer, starts a PowerPoint section per part, prepends
  “SLIDE n · CLASS CLOCK” to every note, writes the run of show, and warns about titles over 48 characters or text
  under 12 pt on new slides.
- `tools/slides_splash_extra.js` holds the framing slides (dividers, poll slides, “what researchers try”, “what you can
  do”, Q&A), Splash-specific versions of adult slides, and `reuse()`, which runs an adult slide function from
  `require('./slides_<module>').slides` unchanged except for a new kicker, title, notes and small listed edits (the
  adult source URLs are carried into the Splash notes automatically).
- Each adult module (`tools/slides_<module>.js`) exports `{ build, slides }`; `./build.sh` and the 117-slide adult deck
  are unchanged.
- The deck needs the adult deck’s derived images under `assets/slides/` (they are in the repository; `./build.sh`
  regenerates them).
