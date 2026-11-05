# Cornell Splash · M1237 “AI Alignment and Safety”: presenter guide

**Class:** William Liaw · Saturday, November 21, 2026, 3:00–4:50 pm · Warren Hall 151 · one 110-minute session · grades
7–12 · up to 200 students · projector only (no student devices).
**Deck:** `AI_Alignment_and_Safety_Splash.pptx` (59 slides, 16:9, about 102 MB, which is 97 MiB; about 76 MB of it is the
twelve looping video clips on slides 32–33). It uses the same look as the adult talk “AI Safety and Existential Risk”. Every slide has
speaker notes in one format: `SLIDE n · CLASS CLOCK`, then `TIME` (minutes, and the beat if any), `CLICKS` (what each
click shows), `SAY (plain words)`, `TERMS TO DEFINE`, `ASK THE ROOM`, `TAKEAWAY`, `BE HONEST ABOUT` (caveats) and
`SOURCES`, where each applies. Part 1 slides add `ANALOGY` and `FOR ADVANCED STUDENTS`; reused adult slides end with a
teacher-only pointer to the adult slide. The file is too big to email: share it by link, USB stick or a shared drive,
and keep the PDF (`build/splash/AI_Alignment_and_Safety_Splash.pdf`) as a backup.

## Nov 5, 2026 update: what changed and why

William’s request (Nov 5): a real introduction to how AI learns, with no math (the gradient is “the slope in higher
dimensions”, and no limit or equation is ever written down), thorough coverage of the pretraining pipeline (LeCun’s
cake; pretraining versus post-training, SFT plus RL), what a neural network is, supervised / unsupervised / RL,
left-to-right text generation versus diffusion for images, GPUs versus CPUs and why NVIDIA dominates AI chips, his
analogies (pretraining is the lecture, SFT the worked examples in class, RL the homework and exams; flash cards,
one-sided flash cards, training a dog with treats), as visual as possible, plus the recent news (the PHP hacking spree,
data-center moratoriums, the swings in the economy).

- **A new Part 1, “How AI learns” (slides 4–25, 37 minutes, 21 content slides).** In order: machine learning (5);
  supervised learning as flash cards that flip (6); unsupervised learning as one-sided cards sorted into unnamed piles,
  or a brand-new card the AI made (7); reinforcement learning as a dog and treats (8); a finger quiz (9); a neural
  network as a stack of dials, with a real mixing board (10); training as a hiker in fog who feels “the slope in every
  direction” (on the slide: “the gradient: the slope in higher dimensions”) and steps downhill (11); backpropagation as
  a factory line passing the blame back (12); text written left to right, a word at a time (13); images made by
  cleaning up static, with a real 1-to-40-step diffusion strip (14); LeCun’s cake, drawn, then his own 2019 slide (15);
  the chatbot’s school year: lecture (pretraining), worked examples (SFT), homework and exams (RL) (16), each with its
  own slide (17–19); CPU versus GPU, with 16 cores against a field of 16,896 and the MythBusters paintball demo (20);
  why NVIDIA is so hard to beat: fast chips, CUDA software, the wiring between chips, and its rivals (21); scaling laws
  (22); a gigawatt (23); “grown, not built” (24); a five-line recap (25). No equations, “=”, “≈”, “×”, formulas or
  log-scale labels on any slide or in the Part 1 notes. Retired from the build: the old learning-types, post-training,
  rewards, pipeline, ingredients, training-energy and Abilene slides.
- **Three news slides.** Slide 36, a click-by-click map of data-center pushback by state; slide 37, the Nasdaq’s daily
  swings since July with three real headlines; slide 48, the PHP2Shell hacking story.
- **What the research found about the two claims in the request.**
  - *“Data centers getting moratoriums in 46 states”: not true as stated.* 46 is one tracker’s count (Electric Choice,
    updated Oct 15) of states with *any* data-center limit or bill, including pending, stalled and failed bills and
    town-level rules. Only **3** states have a statewide pause (New York, Texas, Oregon), each by governor’s order and
    each limited; no legislature has passed one that took effect (Maine’s was vetoed). Most pushback is local. Another
    tracker (SAVRN) also says “46”, but counts state measures of any kind (tax and reporting rules too). So the slide
    says “46 states have data-center limits or bills” and asks “how many have a statewide pause?” (answer: 3). Do not
    say “moratoriums in 46 states”.
  - *“The hacking spree with PHP”: real, with corrections.* It is **PHP2Shell**: two flaws in the PHP language itself,
    hidden for over a decade, found in August with AI help by three groups (Calif, OpenAI and Wiz), disclosed Oct 21
    after word leaked late on Oct 20, attacked within minutes, and confirmed as exploited by the US agency CISA on
    Oct 27. php.net itself was not hacked, and it was not “AI agents on a spree”: people used AI to find the flaws, and
    the attackers are mostly unidentified. Claims that attackers used AI come from single companies (one link was
    retracted), so they stay in the notes.
  - *“Volatility in the economy”:* the Nasdaq’s daily closes (FRED) since July, with five marked days (Nov 5: −5.5%,
    Yahoo’s provisional close), Alphabet’s worst day (Oct 29), “tech stocks wipe out $1 trillion” (Oct 30) and the
    Nov 5 correction. The slide asks “does a big stock drop prove AI is failing?” (no), says on its face that the side
    axis starts at 24,000, and gives no investment advice.
- **Cuts to make room** (functions kept in `tools/slides_splash_extra.js`, only `ORDER` changed): the old “The ruler is
  running out of room”, “Google says 75% of new code…”, “AI that builds better AI” and “AI agents, in their own words”
  slides; their key lines are now said on the neighbouring slides (28, 45, 47) or kept in the notes. Q&A went from 8 to
  7 minutes.
- **Stale facts re-checked on Nov 5** (each note says “re-checked Nov 5, 2026”): METR’s page is retired, last model
  added May 8 (28); SWE-bench card (29); Humanity’s Last Exam (30); Navier–Stokes and the Clay Institute (34); the
  research-intern timeline, where the April 2025 “AI 2027” forecast date was removed because its authors have revised
  it and the new dates could not be read (45); the sealed-test follow-ups (46); Palisade (49); OpenAI’s newer biology
  and cyber models (55); the pain-direction preprint, revised Nov 3 (56); BlueDot and 80,000 Hours (57).
- **Review pass (Nov 5).** After two editors and two critics: LeCun’s real slide now opens in a full panel that hides
  the cake behind it (15); slide 16’s third card is “homework & exams”, matching the analogy, and the pre-release
  safety tests are no longer called an exam (they measure; the model does not learn from them); “self-supervised” is
  shown as one kind of unsupervised learning on slides 13 and 15 and said on slide 7; the gradient is named on
  slide 11; slide 10 says what one neuron does and that Kimi’s 1.04 trillion is a total (about 32 billion used per
  word); slide 14 adds a “practice: add static, then undo it” card and a finger vote instead of shouting; the GPU,
  gigawatt and recap slides were re-laid out (20, 23, 25); captions students must read are 14 pt; the map legend
  matches the dataset (36); the PHP slide names all three discoverers (48); the METR poll is a guess, not a sum (28).

## Materials and pre-flight

- Laptop with **PowerPoint 365 / 2019+** (slideshow mode), a clicker, and a microphone for a room of 200. For the Q&A
  (slide 59), a roving microphone or a runner; if there is none, hand out paper slips for written questions.
- **Internet** for the two embedded YouTube videos: slide 35 (Figure robot) and slide 42 (CoastRunners boat; its embed
  link ends in `?end=40`, so it stops by itself after 40 seconds). Each video slide also has a clickable ► link under
  the video. Stop each video before YouTube’s end screen, which shows recommendations.
- **Optional, new: the MythBusters paintball clip for slide 20** (NVIDIA’s 2008 demo: one paintball barrel paints a
  smiley, then 1,100 barrels paint the Mona Lisa at once). It is *not* embedded: only third-party re-uploads were
  found, none on NVIDIA’s channel, and their running times could not be read. The three links are in the slide 20
  notes. If you want it, watch it first, note the start and end seconds of the two rounds, test it on the room laptop,
  and take its time out of the slide’s 2.5 minutes.
- A visible clock or timer. The notes give the class clock for every slide (minute 0:00 = the first slide).
- A whiteboard or flip chart and a helper (or a student volunteer) to write down the rough A–D counts of the Part 3
  worry poll (slide 39), so the room can compare them with the re-vote on slide 51.
- If there is no roving microphone: paper slips and pencils. Helpers hand them out at the Part 4 divider (slide 53) so
  students can write questions during Part 4, and collect them during slide 57. With 200 people, say rough fractions
  out loud (“about a third”) rather than counting hands.
- **Check the week of the talk** (each slide’s notes say what to look for):
  1. **Data-center map (slide 36), around Nov 19:** update `assets/research/splash_nov/dc_moratoria_states.json`
     (categories and `as_of`), run `node tools/make_dc_map.js`, and rebuild; the counts on the slide come from the
     file. Texas’s audit is due in December, and governor-elect Hinojosa has called for a moratorium.
  2. **Stock chart (slide 37), around Nov 19–20:** add FRED’s Nasdaq closes to
     `assets/research/splash_nov/econ_series.json`, delete `nov5_provisional`, and rebuild; the line extends itself.
     NVIDIA reports earnings around Nov 18; mention it if markets move sharply.
  3. **NVIDIA’s value (slide 21):** the headline is from Oct 29, 2025 (“the first company worth $5 trillion”); say it
     was a year ago, or check a live quote.
  4. **PHP2Shell (slide 48):** any new CISA notice or confirmed attribution. The notes mark which claims are single
     source.
  5. **Leaderboards and pages:** Humanity’s Last Exam (30), ARC Prize and Epoch AI (29), METR’s page (28), the Clay
     Institute and the Navier–Stokes dispute (34), OpenAI’s research-intern page (45), and any new model (for example
     Gemini 4) that would change a “best score” card.
  6. Play both YouTube videos and the twelve looping clips (six on each of slides 32 and 33) on the actual laptop and
     projector. Preview the Figure video end to end (slide 35): check the audio for language and pick a clean stretch of
     about 30 seconds (Figure’s page gives no running time); if you like, add `?start=S&end=E` (seconds) to the embed
     link in PowerPoint. Play the CoastRunners clip (slide 42) and check that it stops cleanly at 40 seconds.
  7. BlueDot Impact’s course list, cost and age rules, if you plan to mention it (slide 57 notes).
  8. The dated facts on slides 55 and 56 (OpenAI’s GPT-Rosalind-5.5 card and its newer biology model, Anthropic’s
     Aug 18 post, the pain-direction preprint revised Nov 3): the notes quote them; re-open the pages that week.
  9. Write the one true sentence about what you checked yourself (for example, which slides you reviewed) for slide 58,
     and say it right after the “made by an AI” explanation (the slide 58 notes ask for it).
- The looping clips on slides 32–33 are Splash copies of the adult deck’s GIFs (`tools/slides_splash_extra.js`,
  `splashGif`): the same frames and timing, scaled to about the size they are shown at (540 px wide on slide 32,
  400 px on slide 33) and lightly compressed (gifsicle `--lossy=40`, full colour palettes), about 6–11 MB each on
  slide 32 and about 2.7–5 MB on slide 33. Stronger compression (lossy 80+, 128 colours) was tried and left visible
  banding and grain, which would bias a real-or-fake vote, so the clips were not degraded further. Each loop starts
  partway into its clip (both clips of a pair at the same frame, so they stay in sync). Before class, play slides 32–33
  in slideshow mode on the room laptop with all six clips on each slide running; if they stutter, close other programs.
- Open the file a minute early.

## Run of show

Clock = minutes:seconds from the start of class (3:00 pm). Beats are by hands, fingers, standing or turning to a
neighbor. No devices. (`./build_splash.sh` regenerates this table with the current slide numbers in
`build/splash/run_of_show.md`; if the two ever differ, the generated file and the slide notes are right.)

| Clock | Slides | Min | Part | Interactive beats |
|---|---|---|---|---|
| 0:00–4:00 | 1–3 | 4.0 | **Opening**: title, hook, roadmap | 0:30 hands up twice: used an AI this week? Does it understand? (2) |
| 4:00–41:00 | 4–25 | 37.0 | **Part 1 · How AI learns** (divider, then 21 slides) | 4:00 hands up: something you could not write rules for (5) · 5:30 say it together: what’s on the back? (6) · 6:30 hands: sort by kind or by color? (7) · 8:45 finger quiz: which kind of learning? (9) · 12:15 hands: steps way too big? (11) · 14:15 hands: why not test each dial alone? (12) · 15:45 hands: mat, moon or pizza? (13) · 17:30 finger vote: when does the castle appear? (14) · 19:00 hands: which layer teaches most? (15) · 21:00 turn to a neighbor: where would you test for danger? (16) · 23:30 guess: years to read it all (17) · 25:15 think: why answer with questions? (18) · 27:00 hands: A or B? (19) · 29:00 guess: cores in a GPU (20) · 31:30 hands: switch to a cheaper brand? (21) · 33:30 think: what would you do if you ran a lab? (22) · 35:30 guess: homes per gigawatt (23) · 37:00 turn to a neighbor: how would you check it is safe? (24) · 39:30 hands: does it understand? (25) |
| 41:00–62:00 | 26–37 | 21.0 | **Part 2 · How fast it is moving** | 41:30 guess the launch gap (27) · 43:00 pair-share: doubling guess (28) · 46:00 hands: did any 2023 AI top 50%? (29) · 49:30 photo or not? (31) · 51:00 vote A/B, C/D, E/F (32) · 53:30 hands: who got all three right? (33) · 55:00 hands: research math? (34) · 56:30 pair-share: first chore for a robot (35) · 59:00 guess: how many statewide pauses? (36) · 60:30 hands: does a drop prove AI is failing? (37) |
| 62:00–91:00 | 38–52 | 29.0 | **Part 3 · Why it could go wrong** | 62:30 A–D worry poll (39) · 65:00 hands: good at its job, doesn’t care? (40) · 67:00 pair-share: helper steps (41) · 70:00 guess what the boat learned (42) · 73:00 pair-share: easiest way to score (43) · 75:00 think silently, then hands (44) · 77:00 hands: fact, goal or forecast? (45) · 80:30 pair-share: keep 1,000 AIs apart (47) · 83:00 spoken: good news or bad news? (48) · 85:00 guess o3’s shutdown share (49) · 86:30 hands: is 0.004% big or small? (50) · 88:30 re-vote A–D (51) |
| 91:00–103:00 | 53–58 | 12.0 | **Part 4 · What we can do** | 91:30 guess the AI “crash test”, hands up by letter (54) · 95:00 hands: who should decide who gets powerful tools? (55) · 96:30 pair-share: evidence a machine can feel (56) · 99:00 hands: which role could you see yourself in? (57) · 102:00 hands: who suspected an AI made the slides? (58) |
| 103:00–110:00 | 59 | 7.0 | **Q&A** | open questions; fallback prompts are on the slide |

Slide by slide (new = added Nov 5, 2026):

| # | Clock | Min | Title | Note |
|---|---|---|---|---|
| 1 | 0:00 | 0.5 | AI Alignment and Safety |  |
| 2 | 0:30 | 2 | Hands up: who has used an AI this week? |  |
| 3 | 2:30 | 1.5 | Learn how it works, then what could go wrong |  |
| 4 | 4:00 | 0 | *How does an AI learn?* | Part 1 divider (a few seconds; no minutes of its own) |
| 5 | 4:00 | 1.5 | Machine learning: the computer finds the rules | reworked |
| 6 | 5:30 | 1 | Supervised learning: flash cards with answers | new Part 1 slide |
| 7 | 6:30 | 1.25 | Unsupervised: sort the cards, or make new ones | new Part 1 slide |
| 8 | 7:45 | 1 | Reinforcement learning: treats for good tries | new Part 1 slide |
| 9 | 8:45 | 1.5 | Quiz: which kind of learning is this? | reworked |
| 10 | 10:15 | 2 | A neural network is a stack of dials | reworked |
| 11 | 12:15 | 2 | Training feels the slope, then steps downhill | reworked |
| 12 | 14:15 | 1.5 | Backpropagation sends the blame backwards | reworked |
| 13 | 15:45 | 1.75 | Text AI writes left to right, a word at a time | reworked |
| 14 | 17:30 | 1.5 | Image AI starts from static and cleans it up | new Part 1 slide |
| 15 | 19:00 | 2 | LeCun’s cake: the data itself teaches most | new Part 1 slide |
| 16 | 21:00 | 2.5 | Making a chatbot: lecture, examples, homework | new Part 1 slide |
| 17 | 23:30 | 1.75 | Pretraining: read a huge library, then guess | reworked |
| 18 | 25:15 | 1.75 | Worked examples turn it into an assistant | reworked |
| 19 | 27:00 | 2 | RL is homework: try, get graded, try again | new Part 1 slide |
| 20 | 29:00 | 2.5 | A GPU does thousands of simple sums at once | new Part 1 slide |
| 21 | 31:30 | 2 | Why Nvidia is so hard to beat in AI chips | new Part 1 slide |
| 22 | 33:30 | 2 | Scaling laws: bigger runs, fewer mistakes | reworked |
| 23 | 35:30 | 1.5 | How big is a gigawatt? | reworked · first to hide if running long |
| 24 | 37:00 | 2.5 | Nobody typed in the rules: it was grown | kept, lightly trimmed |
| 25 | 39:30 | 1.5 | Five things to carry into Part 2 | reworked |
| 26 | 41:00 | 0.5 | *How fast is AI moving?* | Part 2 divider |
| 27 | 41:30 | 1.5 | Anthropic + OpenAI: typical launch gap 11 days |  |
| 28 | 43:00 | 3 | Task length doubled about every 4 months |  |
| 29 | 46:00 | 2 | Hard AI tests were beaten in 1½ to 3½ years |  |
| 30 | 48:00 | 1.5 | The “last exam” for AI went from 7% to 61% | second to hide if running long |
| 31 | 49:30 | 1.5 | This is not a photograph, says its maker |  |
| 32 | 51:00 | 2.5 | Which one is real? |  |
| 33 | 53:30 | 1.5 | Top 2 video AIs fool people about half the time |  |
| 34 | 55:00 | 1.5 | OpenAI’s famous-math claim is still disputed |  |
| 35 | 56:30 | 2.5 | Figure says pretraining raised success to 56% |  |
| 36 | 59:00 | 1.5 | 46 states have data-center limits or bills | new: news (data centers) |
| 37 | 60:30 | 1.5 | Tech and AI stocks are swinging hard | new: news (stocks) |
| 38 | 62:00 | 0.5 | *Why could it go wrong?* | Part 3 divider |
| 39 | 62:30 | 2.5 | How worried should we be? Vote first | never cut |
| 40 | 65:00 | 2 | Being smart does not mean sharing our goals |  |
| 41 | 67:00 | 3 | What would you need besides studying? |  |
| 42 | 70:00 | 3 | What did this game AI learn? |  |
| 43 | 73:00 | 2 | AI systems find loopholes too |  |
| 44 | 75:00 | 2 | Some AI thinks in ways we cannot easily read |  |
| 45 | 77:00 | 2 | OpenAI says it now has an AI research intern |  |
| 46 | 79:00 | 1.5 | OpenAI says its AI broke out of a sealed test |  |
| 47 | 80:30 | 2.5 | AIs in a test found a hidden message board |  |
| 48 | 83:00 | 2 | AI helped find old bugs; attackers came fast | new: news (PHP2Shell) |
| 49 | 85:00 | 1.5 | Dodging shutdown shows up across tests |  |
| 50 | 86:30 | 2 | Big counts are hard to compare | last to hide if running long |
| 51 | 88:30 | 1 | Same question: has your answer changed? | never cut |
| 52 | 89:30 | 1.5 | Even the AI lab CEOs signed this sentence | never cut |
| 53 | 91:00 | 0.5 | *What can we do about it?* | Part 4 divider |
| 54 | 91:30 | 3.5 | Five approaches, and none is solved yet | never cut |
| 55 | 95:00 | 1.5 | Some labs limit who gets the riskiest tools | third to hide if running long |
| 56 | 96:30 | 2.5 | Could an AI feel pain? Nobody knows yet |  |
| 57 | 99:00 | 3 | There is real work here, and it needs people | never cut |
| 58 | 102:00 | 1 | This presentation was made by an AI. |  |
| 59 | 103:00 | 7 | Questions, then one thing to do this week | Q&A (7 minutes) |

## If you are running long

**First, inside Part 1 (no slide hidden):** the notes’ `TIME` line marks five beats as droppable. Ask the question and
answer it yourself instead of polling the room: slide 12 (hands-up, about 0.5 min), 14 (finger vote, about 0.25),
18 (think about it, about 0.5), 22 (think about it, about 0.5) and 24 (neighbor chat, about 1.0). Together they save
about 2.5–3 minutes and keep every Part 1 topic.

**Then hide slides** in this order (*Slide Show → Hide Slide*, so the numbering and the notes stay the same):

| Order | Slide | Saves | Note |
|---|---|---|---|
| 1 | 23 How big is a gigawatt? | 1.5 | on slide 36, say “one AI campus can use as much power as a nuclear reactor makes” |
| 2 | 30 The “last exam” for AI went from 7% to 61% | 1.5 | slide 29 already shows hard tests being beaten |
| 3 | 55 Some labs limit who gets the riskiest tools | 1.5 | |
| 4 | 50 Big counts are hard to compare | 2.0 | cut it last: it is the honest-uncertainty counterweight to the incident stories on slides 46–49, just before the re-vote; keep its “what is counted?” question for Q&A |
| — | Q&A (59) | up to 1.0 | keep at least 6 minutes |

**Never cut** slides 39 and 51 (the poll and the re-vote), 52, 54 and 57: they carry the “serious, unsolved, people are
working on it” framing. Also keep the three news slides (36, 37, 48), which William asked for, and Part 1’s slides
5–22 and 24–25: each carries a topic from the course description or from William’s list (the three kinds of
learning, the network, the slope, backpropagation, left-to-right text and diffusion, the cake, pretraining versus
post-training, GPUs, NVIDIA, scaling laws).

**Running short?** Use the spare minutes inside the deck: give the pair-share beats (28, 41, 43, 47, 56) their full
time, take a third answer on slides 5, 11, 13 or 21, or ask a slide’s “ASK THE ROOM” question again and take two more
answers. Do not import adult-deck slides on the day: they are not built for this audience and the adult file is about
1 GB.

## What changed from the adult deck, and why

- **Part 1 is new for Splash** (see the Nov 5 update above). Its gigawatt slide (23) is adapted from the adult deck’s
  slide 9, and its scaling-law line (22) is redrawn from Kaplan et al. (2020) with the numbers left off.
- **Re-checked on Oct 10, 2026, and again on Nov 5:** Navier–Stokes (34: forced case only, no Clay ruling, a credit
  dispute kept in the notes; the adult title “apparently settled” is gone); Figure’s Helix 2.5 page (35: 9% trained
  from scratch, 56% pretrained on “Index, Figure’s global-scale dataset of human behavior”, shares of tries across
  “three tasks across 30 unseen … homes”); METR’s raw GPT-2 and GPT-3 values (28; the unlabelled dots are METR’s
  davinci-002 and gpt-3.5-turbo-instruct, plotted at the dates in METR’s file); the survey’s Oct 2023 fielding date and
  the AI-researcher survey figure (39, Grace et al.); Pachocki’s sentence against his essay “An Alien Mind” itself (45);
  Buckmaster’s Mastodon post, quoted verbatim in the notes (34); the GPQA paper’s expert score, 65% (74% discounting
  clear mistakes), on its full question set (29); ARC-AGI-2’s launch, Mar 24, 2025 (29); the GPT-6 Astra system-card
  quotes (44; the card’s sentence ends “…unable to catch it **reliably**”, which the adult slide 58 drops); the UK AI
  Security Institute rename (54, gov.uk); Anthropic’s “deeply uncertain” (56); the Nature page itself, re-captured with
  `tools/shot.js` (34); the Bostrom photo’s author, Ryan Cowan, from the file’s metadata on Wikimedia Commons (40); the
  Baker et al. (2025) paper’s OpenAI affiliation (54); RA-Bench’s arXiv page, which lists no journal (32–33: “arXiv
  preprint”); the two 80,000 Hours pages and the BlueDot course page (57 notes). YouTube blocked every way of reading
  the CoastRunners clip’s length, so slide 42’s embed stops itself at 40 seconds.
- **Replaced:** the adult “heartbeats” slide (87), whose only source is one wiki-based report with a disputed
  attribution, with the METR/Redwood investigation (adult 81, slide 47). The evidence slides in Part 3 now run
  incident (46) → swarm (47) → a real-world case, PHP2Shell (48) → lab tests (49).
- **Part 4 order:** it opens with what researchers and labs do (54–55), which answers the divider’s question, then the
  open question about AI feelings (56), then what students can do (57).
- **Kickers:** every content slide reads `PART n · <part name> · k`, with k counting the slides of that part in order
  (Part 1: 1–21 on slides 5–25, set in `slides_splash_ml.js`; Parts 2–4: set by `slides_splash_extra.js` from its
  `ORDER` list, so reordering keeps the numbers right). The exceptions: slides 2–3 read `OPENING · …`; slide 56 reads
  `PART 4 · AN OPEN QUESTION` and is not counted (it is a question, not an action), so slide 57 is `· 3`; slide 58
  reads `ONE MORE THING` (as in the adult deck) and slide 59 `Q&A`. The dividers (4, 26, 38, 53) carry the part name
  only.
- **Retitled:** slide 33 (“Top 2 video AIs fool people about half the time”). The three AI clips on it are in the
  study’s all-five-fooled set (RA-Bench-HumanProof), but they were picked because they fooled everyone, so the adult
  title (“Each of these fakes fooled all five reviewers”) would present the most convincing fakes as typical; the
  Splash title gives the typical rate instead, and only the two best generators came near half (Seedance 2.0 51.9%,
  Kling 47.7%; about a third, 33.9%, across all nine, which the slide also shows). Titles that would have given away a
  poll answer are questions instead (39, 41, 42); titles were narrowed to what the data shows (27: launches from either
  company, counted together, as a typical gap; 28: METR’s fitted trend, “about every 4 months”, past tense; 29:
  “beaten”, not “fell”, in 1½ to 3½ years; 31: “says its maker”, since the only support is his own post; 35: “Figure
  says”, a company result; 36: “46 states have data-center limits or bills”, not “moratoriums”; 43: “AI systems”, since
  most of the 90 cases are not advanced models; 45: OpenAI’s own claim; 46: “broke out of a sealed test”, not “escaped
  a test”; 47: “AIs in a test”, and 688 of the 1,206 agents joined the break-in). No title uses “~”, “≈” or “=”.
- **Notes format:** every Splash note has a `CLICKS:` line saying what each click reveals. `tools/build_splash.js`
  gives the Part 1 notes the same section labels as the rest of the deck and warns when a `CLICKS:` line describes a
  different number of clicks than the slide has.
- **Left out on purpose:** war and weapons material, bioweapon detail, deepfake abuse, self-harm, the p(doom) song, the
  “torture chamber” and other distressing items, unannounced-model rumors, slides centered on politicians, exploit
  details of PHP2Shell, and investment advice.
- Every reused slide keeps its original visuals, with these listed exceptions (all crops, re-orders or native
  overlays; no picture’s pixels are edited): slide 50 shows the Axios headline as a crop and its two key sentences as
  16 pt quotes; slide 47 lays a white fade over the bottom of the cropped METR figure and plain white boxes over the
  figure’s three speech bubbles (their words are in the notes and one is read aloud); slides 32–33 use smaller copies
  of the clips (see Materials), and slide 33’s clip grid is drawn 6% larger; slide 27’s chart is a little smaller (same
  aspect ratio) with a 16 pt key under it; slide 28 leaves four minor point labels off (their dots stay), shows the
  months since METR’s last model in amber and says the ruler ran out; slide 34 uses a crop of the Nature header and
  headline without the dek, slide 44 a crop of the TechCrunch headline and byline without the photo half; and
  slide 43’s robot-arm GIF starts on its last frame, so a printed copy shows the flipped block. In Part 1, photos are
  crops of verified files (ImageNet, Wikimedia Commons, LeCun’s slide via Synced); the drawings (the cakes, the
  networks, the hill, the static square, the 16,896-dot field) are ours, and the source lines or notes say so. New slides use body text ≥ 16 pt, captions students must read
  ≥ 14 pt, and labels and source lines ≥ 12 pt; the footer and slide numbers are 12 pt (the adult deck’s are 9 pt).
- **Beats on screen:** every hands-up, finger, guess or pair-share question in the run of show is printed on its slide,
  so a room of 200 can see what it is voting on. Slides 30, 46 and 52 have no beat, so beats are not crowded together.
  Short extras are spoken only: the pet-trick question on slide 8, the mixing-board question on slide 10, the
  10-second “good news or bad news?” on slide 48, the optional show of hands on slide 52 and the closing “who
  suspected an AI?” hands-up on slide 58 (it follows the reveal). Shout-outs were replaced by controlled formats for a
  room of 200: “say it together on 3” (6) and a finger vote (14). No stretch of the class goes more than about 5 minutes
  without a beat.

## How to build

```bash
npm install                    # once (pptxgenjs, sharp, react-icons, playwright)
./build_splash.sh              # -> AI_Alignment_and_Safety_Splash.pptx (+ build/splash/run_of_show.md)
./build_splash.sh --render     # also build/splash/*.pdf and slide-NN.jpg (LibreOffice Impress + poppler)
tools/preview_splash.sh build/prev-me 14 15   # a private preview build and render, without touching build/splash
```

- `tools/build_splash.js` assembles the deck: Opening + Part 1 from `tools/slides_splash_ml.js`, then Parts 2–4 and
  Q&A from `tools/slides_splash_extra.js`. It rebrands the footer, starts a PowerPoint section per part, prepends
  “SLIDE n · CLASS CLOCK” to every note, gives all notes one set of section labels, writes the run of show, and warns
  about titles over 48 characters, text under 12 pt on new slides, and `CLICKS:` lines that do not match the slide.
- `tools/slides_splash_ml.js` holds the Opening and Part 1, and makes Part 1’s derived images (photo crops, the
  diffusion panels, the GPU dot field) in `assets/slides/splash/` from the files in `assets/research/splash/` and
  `assets/research/splash_nov/ml/`.
- `tools/slides_splash_extra.js` holds the framing slides (dividers, poll slides, “what researchers try”, “what you can
  do”, Q&A), the three news slides, Splash-specific versions of adult slides, and `reuse()`, which runs an adult slide
  function from `require('./slides_<module>').slides` unchanged except for a new kicker, title, notes and small listed
  edits (the adult source URLs are carried into the Splash notes automatically). `tools/make_dc_map.js` draws the
  data-center map and its click layers from `assets/research/splash_nov/dc_moratoria_states.json`.
- Research for the Nov 5 update is in `assets/research/splash_nov/` (`manifest.json`, `PLAN.md`, the map and stock
  data). Each adult module (`tools/slides_<module>.js`) exports `{ build, slides }`; `./build.sh` and the 117-slide
  adult deck are unchanged.
- The deck needs the adult deck’s derived images under `assets/slides/` (they are in the repository; `./build.sh`
  regenerates them).
