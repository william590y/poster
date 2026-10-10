# Cornell Splash · M1237 “AI Alignment and Safety”: presenter guide

**Class:** William Liaw · Saturday, November 21, 2026 · one 110-minute session · grades 7–12 · up to 200 students ·
projector only (no student devices).
**Deck:** `AI_Alignment_and_Safety_Splash.pptx` (58 slides, 16:9, about 98 MB, about 74 MB of it the twelve looping
video clips on slides 31–32). It uses the same look as the adult talk “AI Safety and Existential Risk”. Every slide has speaker notes
in one format: `SLIDE n · CLASS CLOCK`, then `TIME` (minutes, and the beat if any), `CLICKS` (what each click shows),
`SAY (plain words)`, `TERMS TO DEFINE`, `ASK THE ROOM`, `TAKEAWAY`, `BE HONEST ABOUT` (caveats) and `SOURCES`, where
each applies. Part 1 slides add `ANALOGY` and `FOR ADVANCED STUDENTS`; reused adult slides end with a teacher-only
pointer to the adult slide.

## Materials and pre-flight

- Laptop with **PowerPoint 365 / 2019+** (slideshow mode), a clicker, and a microphone for a room of 200. For the Q&A
  (slide 58), a roving microphone or a runner; if there is none, hand out paper slips for written questions.
- **Internet** for the two embedded YouTube videos: slide 35 (Figure robot) and slide 40 (CoastRunners boat; its embed
  link ends in `?end=40`, so it stops by itself after 40 seconds). Each video slide also has a clickable ► link under the
  video. Stop each video before YouTube’s end screen, which shows recommendations.
- A visible clock or timer. The notes give the class clock for every slide (minute 0:00 = the first slide).
- A whiteboard or flip chart and a helper (or a student volunteer) to write down the rough A–D counts of the Part 3
  worry poll (slide 37), so the room can compare them with the re-vote on slide 50.
- If there is no roving microphone: paper slips and pencils. Helpers hand them out at the Part 4 divider (slide 52) so
  students can write questions during Part 4, and collect them during slide 56. With 200 people, say rough
  fractions out loud (“about a third”) rather than counting hands.
- **Check the week of the talk:**
  1. Navier–Stokes status (slide 34): any Clay Institute ruling, and the credit dispute. The notes are as of Oct 10, 2026.
  2. Play both YouTube videos and the twelve looping clips (six on each of slides 31 and 32) on the actual laptop and
     projector.
  3. Preview the Figure video end to end (slide 35): check the audio for language, and pick a clean stretch of about
     30 seconds (Figure’s page gives no running time). If you like, add `?start=S&end=E` (seconds) to the embed link in
     PowerPoint so it stops on its own. Play the CoastRunners clip too (slide 40): YouTube blocked every way of reading
     its length from this network, so its embed is set to stop after 40 seconds (`?end=40`), which fits the slide’s
     3 minutes; check that it stops cleanly. The two other robot pictures on slide 35 are stills, not links.
  4. BlueDot Impact’s course list, cost and age rules, if you plan to mention it (slide 56 notes).
  5. The dated facts on slides 54 and 55 (OpenAI’s GPT-Rosalind-5.5 card, Anthropic’s Aug 18 post, the Pain Axis
     preprint): the notes quote them; re-open the pages that week.
  6. Write the one true sentence about what you checked yourself (for example, which slides you reviewed) for slide 57,
     and say it right after the “made by an AI” explanation (the slide 57 notes ask for it).
- The looping clips on slides 31–32 are Splash copies of the adult deck’s GIFs (`tools/slides_splash_extra.js`,
  `splashGif`): the same frames and timing, scaled to about the size they are shown at (540 px wide on slide 31,
  400 px on slide 32) and lightly compressed (gifsicle `--lossy=40`, full colour palettes), about 6–11 MB each on
  slide 31 and about 2.7–5 MB on slide 32 (the adult files are 18–26 MB and 7–10 MB). Stronger compression (lossy 80+, 128
  colours) was tried and left visible banding and grain, which would bias a real-or-fake vote. Each loop starts partway
  into its clip (both clips of a pair at the same frame, so they stay in sync): the shared first frame shows once per
  loop, and a printed still shows the mid-clip frame. Before class, play slides 31–32 in slideshow mode on the room
  laptop with all six clips on each slide running; if they stutter, close other programs.
- Open the file a minute early.

## Run of show

Clock = minutes:seconds from the start of class. Beats are by hands, standing or turning to a neighbor. No devices.
(`./build_splash.sh` regenerates this table with the current slide numbers in `build/splash/run_of_show.md`; if the
two ever differ, the generated file and the slide notes are right.)

| Clock | Slides | Min | Part | Interactive beats |
|---|---|---|---|---|
| 0:00–4:00 | 1–3 | 4.0 | **Opening**: title, hook, roadmap | 0:30 hands up twice: used an AI this week? Does it understand? (slide 2) |
| 4:00–40:00 | 4–23 | 36.0 | **Part 1 · How AI learns** (divider, then 19 slides) | 4:00 hands up: name something you could not write rules for (5) · 8:00 finger quiz: which kind of learning? (7) · 12:15 hands up: what if the steps are too big? (9) · 14:15 hands up: why not test each dial one at a time? (10) · 16:00 next-word guess (11) · 18:15 guess: how many years to read it all? (12) · 20:30 think: why would a base model answer with questions? (13) · 22:15 pick answer A or B (14) · 24:15 hands up: a task a computer can’t check (15) · 26:00 turn to a neighbor: where would you test for danger? (16) · 28:00 vote: hardest ingredient to grow (17) · 29:30 think: why keep spending for 11%? (18) · 31:30 guess: how many homes does a gigawatt run? (19) · 33:00 guess the electricity multiple (20) · 36:00 turn to a neighbor: how would you check it is safe? (22) · 38:30 hands up: what would show an AI understands? (23) |
| 40:00–60:00 | 24–35 | 20.0 | **Part 2 · How fast it is moving** | 40:30 guess the 2024 launch gap (25) · 42:00 pair-share: 6 doublings (26) · 46:00 hands: did any 2023 AI top 50%? (28) · 49:30 photo or not? (30) · 51:00 vote A/B, C/D, E/F (31) · 53:30 hands: who got all three right? (32) · 55:00 hands: unchecked AI code? (33) · 56:00 hands: research math? (34) · 57:30 pair-share: first chore for a robot (35) |
| 60:00–90:00 | 36–51 | 30.0 | **Part 3 · Why it could go wrong** | 60:30 A–D worry poll (37) · 63:00 hands: good at its job, doesn’t care? (38) · 65:00 pair-share: quiz-score helper steps (39) · 68:00 guess what the boat learned (40) · 71:00 pair-share: easiest way to score (41) · 73:00 think silently, then hands: check the work (42) · 76:30 hands: fact, goal or forecast? (44) · 80:00 pair-share: keep 1,000 AIs apart (46) · 84:00 guess o3’s shutdown share (48) · 85:30 hands: is 0.004% big or small? (49) · 87:30 re-vote A–D (50) |
| 90:00–102:00 | 52–57 | 12.0 | **Part 4 · What we can do** | 90:30 guess the AI “crash test”, hands up by letter (53) · 94:00 hands: who should decide who gets powerful tools? (54) · 95:30 pair-share: evidence a machine can feel (55) · 98:00 hands: which role could you see yourself in? (56) · 101:00 hands: who suspected an AI made the slides? (57) |
| 102:00–110:00 | 58 | 8.0 | **Q&A** | open questions; fallback prompts are on the slide |

Slide by slide:

| # | Clock | Min | Title |
|---|---|---|---|
| 1 | 0:00 | 0.5 | AI Alignment and Safety |
| 2 | 0:30 | 2 | Hands up: who has used an AI this week? |
| 3 | 2:30 | 1.5 | Learn how it works, then what could go wrong |
| 4 | 4:00 | 0 | *Part 1 divider:* How does an AI learn? *(one line, a few seconds: the roadmap has just introduced Part 1)* |
| 5 | 4:00 | 2 | Machine learning: the computer finds the rules |
| 6 | 6:00 | 2 | Three classic ways to learn, plus a fourth |
| 7 | 8:00 | 2 | Quiz: which kind of learning is this? |
| 8 | 10:00 | 2.25 | A neural network is a stack of dials |
| 9 | 12:15 | 2 | Learning = measure the mistake, then nudge |
| 10 | 14:15 | 1.75 | Backpropagation sends the blame backwards |
| 11 | 16:00 | 2.25 | An LLM is a very good next-word guesser |
| 12 | 18:15 | 2.25 | Pretraining: read a huge library, then guess |
| 13 | 20:30 | 1.75 | A base model just continues the text |
| 14 | 22:15 | 2 | Post-training makes it an assistant |
| 15 | 24:15 | 1.75 | Checkable rewards teach models to write steps |
| 16 | 26:00 | 2 | How a frontier model is made, step by step |
| 17 | 28:00 | 1.5 | Three ingredients: data, compute and method |
| 18 | 29:30 | 2 | Scaling laws: bigger runs, steadily lower loss |
| 19 | 31:30 | 1.5 | How big is a gigawatt? |
| 20 | 33:00 | 2 | Est.: training GPT-6 Astra ≈ 4 days of NYC power |
| 21 | 35:00 | 1 | 2 roofed buildings → 8 in 13 months (our count) *(optional)* |
| 22 | 36:00 | 2.5 | Nobody typed in the rules: it was grown |
| 23 | 38:30 | 1.5 | Five things to carry into Part 2 |
| 24 | 40:00 | 0.5 | *Part 2 divider:* How fast is AI moving? |
| 25 | 40:30 | 1.5 | Anthropic + OpenAI: typical launch gap ~11 days |
| 26 | 42:00 | 3 | Task length doubled every ~4 months since 2023 |
| 27 | 45:00 | 1 | The ruler is running out of room |
| 28 | 46:00 | 2 | Hard AI tests were beaten in 1½ to 3½ years |
| 29 | 48:00 | 1.5 | The “last exam” for AI went from 7% to 61% |
| 30 | 49:30 | 1.5 | This is not a photograph, says its maker *(the title is the click reveal)* |
| 31 | 51:00 | 2.5 | Which one is real? |
| 32 | 53:30 | 1.5 | Top 2 video AIs fool people about half the time |
| 33 | 55:00 | 1 | Google says 75% of new code is AI-generated |
| 34 | 56:00 | 1.5 | OpenAI’s famous-math claim is still disputed |
| 35 | 57:30 | 2.5 | Figure says pretraining raised success to 56% |
| 36 | 60:00 | 0.5 | *Part 3 divider:* Why could it go wrong? |
| 37 | 60:30 | 2.5 | How worried should we be? Vote first |
| 38 | 63:00 | 2 | Being smart does not mean sharing our goals |
| 39 | 65:00 | 3 | What would you need besides studying? |
| 40 | 68:00 | 3 | What did this game AI learn? |
| 41 | 71:00 | 2 | AI systems find loopholes too |
| 42 | 73:00 | 2 | Some AI thinks in ways we cannot easily read |
| 43 | 75:00 | 1.5 | AI that builds better AI |
| 44 | 76:30 | 2 | OpenAI says it now has an AI research intern |
| 45 | 78:30 | 1.5 | OpenAI says its AI broke out of a sealed test |
| 46 | 80:00 | 2.5 | AIs in a test found a hidden message board |
| 47 | 82:30 | 1.5 | AI agents, in their own words |
| 48 | 84:00 | 1.5 | Dodging shutdown shows up across tests |
| 49 | 85:30 | 2 | Big counts are hard to compare |
| 50 | 87:30 | 1 | Same question: has your answer changed? |
| 51 | 88:30 | 1.5 | Even the AI lab CEOs signed this sentence |
| 52 | 90:00 | 0.5 | *Part 4 divider:* What can we do about it? |
| 53 | 90:30 | 3.5 | Five approaches, and none is solved yet |
| 54 | 94:00 | 1.5 | Some labs limit who gets the riskiest tools |
| 55 | 95:30 | 2.5 | Could an AI feel pain? Nobody knows yet |
| 56 | 98:00 | 3 | There is real work here, and it needs people |
| 57 | 101:00 | 1 | This presentation was made by an AI. |
| 58 | 102:00 | 8 | Questions, then one thing to do this week |

## If you are running long

Cut in this order; hide a slide with *Slide Show → Hide Slide*, so the numbering and the notes stay the same.

| Order | Slide | Saves | Note |
|---|---|---|---|
| 1 | 21 Abilene satellite views | 1.0 | the saved minute is a buffer; slide 22 (“Nobody typed in the rules”) keeps its 2.5 minutes |
| 2 | 47 AI agents, in their own words | 1.5 | slides 45–46 already make the point; on slide 46, say the rule words the agents made up instead (HOLD, VETO, STOP, “precedent”) |
| 3 | 43 AI that builds better AI | 1.5 | slide 44’s script opens with a one-sentence definition of the loop, so it still makes sense |
| 4 | 27 The ruler is running out of room | 1.0 | say “METR’s test ran out of long tasks” on slide 26 |
| 5 | 33 Google code | 1.0 | it carries a 15-second hands-up; slide 34’s hands-up still keeps Part 2 under about 5 minutes between beats |
| 6 | 54 Labs limit access | 1.5 | |
| 7 | 49 Big counts are hard to compare | 2.0 | cut it last (see below); keep its “what is counted?” question for Q&A |
| — | Q&A (58) | up to 4.0 | the 8-minute Q&A is the main buffer; keep at least 4 minutes |

Never cut slides 37 and 50 (the poll and the re-vote), 51, 53 or 56: they carry the “serious, unsolved, people are
working on it” framing. Slide 49 is last in the cut order because it is the honest-uncertainty counterweight to the
incident stories on slides 44–48 (how big is “tens of thousands”, out of how many?), just before the re-vote.

**Running short?** Use the spare minutes inside the Splash deck: give the pair-share beats (26, 39, 41, 46, 55) their
full time, take a third answer on slides 6, 8, 12 or 17, or ask a slide’s “ASK THE ROOM” question again and take two
more answers. Do not import adult-deck slides on the day: they are not built for this audience and the adult file is
about 1 GB.

## What changed from the adult deck, and why

- **Re-checked on Oct 10, 2026:** Navier–Stokes (slide 34: forced case only, no Clay ruling, a credit dispute kept in
  the notes; the adult title “apparently settled” is gone); Figure’s Helix 2.5 page (slide 35: 9% trained from scratch,
  56% pretrained on “Index, Figure’s global-scale dataset of human behavior”); Google’s Oct 2024 “more than a quarter”
  (slide 33, “>25%”); METR’s raw GPT-2 and GPT-3 values (slide 26; the unlabelled “GPT-3” and “GPT-3.5” dots are METR’s
  davinci-002 and gpt-3.5-turbo-instruct, plotted at the dates in METR’s file); the survey’s Oct 2023 fielding date (slide 37, in the paper’s methods);
  Pachocki’s sentence against his essay “An Alien Mind” itself (slide 44); Buckmaster’s Mastodon post, quoted verbatim in
  the notes (slide 34); Figure’s “three tasks across 30 unseen … homes” (slide 35: the 9% and 56% are shares of tries);
  the GPQA paper’s expert score, 65% (74% discounting clear mistakes), on its full question set (slide 28); ARC-AGI-2’s
  launch, Mar 24, 2025 (slide 28); the GPT-6 Astra system-card quotes (slide 42; the card’s sentence ends
  “…unable to catch it **reliably**”, which the adult slide 58 drops); the AI-researcher survey figure (slide 37,
  Grace et al.); UK AI Security Institute rename (slide 53, gov.uk); Anthropic’s “deeply uncertain” (slide 55); the
  Nature page itself, re-captured with `tools/shot.js` (slide 34: same headline, dek, byline and date as the image);
  the Bostrom photo’s author, Ryan Cowan, from the file’s own metadata on Wikimedia Commons (slide 38); the Baker et al.
  (2025) paper’s OpenAI affiliation, on its first page (slide 53); RA-Bench’s arXiv page, which lists no journal or
  conference (slides 31–32: “arXiv preprint”); the two 80,000 Hours pages and the BlueDot course page (slide 56 notes).
  YouTube blocked every way of reading the CoastRunners clip’s length, so slide 40’s embed stops itself at 40 seconds.
- **Replaced:** the adult “heartbeats” slide (87), whose only source is one wiki-based report with a disputed attribution,
  with the METR/Redwood investigation (adult 81, slide 46). The evidence slides in Part 3 run incident → swarm → their
  words → lab tests, so the Hugging Face story is introduced before the excerpts from it.
- **Part 4 order:** it opens with what researchers and labs do (53–54), which answers the divider’s question, then
  the open question about AI feelings (55), then what students can do (56).
- **Kickers:** every content slide reads `PART n · <part name> · k`, with k counting the slides of that part in order
  (Part 1: 1–18 on slides 5–23, set in `slides_splash_ml.js`; Parts 2–4: set by `slides_splash_extra.js` from its
  `ORDER` list, so reordering keeps the numbers right). The exceptions: slides 2–3 read `OPENING · …`; slide 21 (the
  optional Abilene slide, first in the cut order) reads `PART 1 · HOW AI LEARNS · OPTIONAL` and is not counted, so
  hiding it leaves no gap (slides 22–23 are `· 17` and `· 18`); slide 55 reads
  `PART 4 · AN OPEN QUESTION` and is not counted (it is a question, not an action), so slide 56 is `· 3`; slide 57 reads
  `ONE MORE THING` (as in the adult deck) and slide 58 `Q&A`. The dividers (4, 24, 36, 52) carry the part name only.
- **Retitled:** slide 32 (“Top 2 video AIs fool people about half the time”). The three AI clips on it are in the
  study’s all-five-fooled set (RA-Bench-HumanProof), but they were picked because they fooled everyone, so the adult
  title (“Each of these fakes fooled all five reviewers”) would present the most convincing fakes as typical; the
  Splash title gives the typical rate instead, and only the two best generators came near half (Seedance 2.0 51.9%,
  Kling 47.7%; about a third, 33.9%, across all nine, which the slide also shows). Titles that would have given away a
  poll answer are questions instead (37, 39, 40); titles were narrowed to what the data shows (25: launches from either
  company, counted together, as a typical gap rather than a schedule; 26: METR’s fitted trend since 2023, past tense;
  28: “beaten”, not “fell”, in 1½ to 3½ years, the range of the three cards; 30: “says its maker”, since the only
  support is his own post; 33: “AI-generated”, Google’s word, not “writes”; 35: “Figure says”, a company result; 41:
  “AI systems”, since most of the 90 cases are not advanced models; 44: OpenAI’s own claim; 45: “broke out of a sealed
  test”, not “escaped a test”; 46: “AIs in a test”, and 688 of the 1,206 agents joined the break-in, so the title says
  what all of them did).
- **Notes format:** every Splash note has a `CLICKS:` line saying what each click reveals. `tools/build_splash.js` gives
  the Part 1 notes the same section labels as the rest of the deck and warns when a `CLICKS:` line describes a different
  number of clicks than the slide has.
- **Left out on purpose:** war and weapons material, bioweapon detail, deepfake abuse, self-harm, the p(doom) song, the
  “torture chamber” and other distressing items, unannounced-model rumors, and slides centered on politicians.
- Every reused slide keeps its original visuals, with these listed exceptions (all crops, re-orders or native
  overlays; no picture’s pixels are edited): slide 49 shows the Axios headline as a crop and its two key sentences as
  16 pt quotes (the body text in the adult screenshots was about 8 pt on screen); slide 46 lays a white fade over the
  bottom of the cropped METR figure, so the panels do not look cut off, and plain white boxes over the figure’s three
  speech bubbles (about 10 pt on screen; their words are in the notes and one is read aloud); slides 31–32 use smaller
  copies of the clips (see Materials), and slide 32’s clip grid is drawn 6% larger; slide 25’s chart is a little
  smaller (same aspect ratio) with a 16 pt key under it, because its own axis text was too small; slide 26 leaves four
  minor point labels off (their dots stay) and shows the months since METR’s last update in amber; slide 34 uses a crop
  of the Nature header and headline without the dek, slide 42 a crop of the TechCrunch headline and byline without the
  photo half; and slide 41’s robot-arm GIF starts on its last frame, so a printed copy shows the flipped block. Text is enlarged where it fits (most labels ≥ 12 pt), and
  jargon is defined in the notes and said once in the script. New slides use body text ≥ 16 pt and labels ≥ 12 pt; the
  footer and slide numbers are 12 pt (the adult deck’s are 9 pt).
- **Beats on screen:** every hands-up or pair-share question in the run of show is on its slide, so a room of 200 can
  see what it is voting on (31, 32, 33, 34, 38, 44, 49 and 54 gained one or gained a chip). Slides 29 and 43 have no
  beat, so beats are not crowded together (slide 29 keeps a closing question the teacher answers). Short extras are
  spoken only: the flashcard question on slide 6, the mixing-board question on slide 8, the optional 10-second show of
  hands on slide 51 and the closing “who suspected an AI?” hands-up on slide 57 (it follows the reveal). No stretch of
  the class goes more than about 5 minutes without a beat.

## How to build

```bash
npm install                    # once (pptxgenjs, sharp, react-icons, playwright)
./build_splash.sh              # -> AI_Alignment_and_Safety_Splash.pptx (+ build/splash/run_of_show.md)
./build_splash.sh --render     # also build/splash/*.pdf and slide-NN.jpg (LibreOffice Impress + poppler)
```

- `tools/build_splash.js` assembles the deck: Opening + Part 1 from `tools/slides_splash_ml.js`, then Parts 2–4 and Q&A
  from `tools/slides_splash_extra.js`. It rebrands the footer, starts a PowerPoint section per part, prepends
  “SLIDE n · CLASS CLOCK” to every note, gives all notes one set of section labels, writes the run of show, and warns
  about titles over 48 characters, text under 12 pt on new slides, and `CLICKS:` lines that do not match the slide.
- `tools/slides_splash_extra.js` holds the framing slides (dividers, poll slides, “what researchers try”, “what you can
  do”, Q&A), Splash-specific versions of adult slides, and `reuse()`, which runs an adult slide function from
  `require('./slides_<module>').slides` unchanged except for a new kicker, title, notes and small listed edits (the
  adult source URLs are carried into the Splash notes automatically).
- Each adult module (`tools/slides_<module>.js`) exports `{ build, slides }`; `./build.sh` and the 117-slide adult deck
  are unchanged.
- The deck needs the adult deck’s derived images under `assets/slides/` (they are in the repository; `./build.sh`
  regenerates them).
