# Cornell Splash · M1237 “AI Alignment and Safety”: presenter guide

**Class:** William Liaw · Saturday, November 21, 2026, 3:00–4:50 pm · Warren Hall 151 · one 110-minute session · grades
7–12 · up to 200 students · projector only (no student devices).
**Deck:** `AI_Alignment_and_Safety_Splash.pptx` (160 slides, 16:9, about 137 MB, which is 131 MiB; about
74 MB of it is the twelve looping real-or-fake clips on slides 74–75). The pace is about 1.5 slides a minute (see the
Nov 6 section). It uses the same look as the adult talk “AI Safety and Existential Risk”. Every slide has speaker notes
in one format: `SLIDE n · CLASS CLOCK`, then `TIME` (minutes, and the beat if any), `CLICKS` (what each click shows),
`SAY (plain words)`, `TERMS TO DEFINE`, `ASK THE ROOM`, `TAKEAWAY`, `BE HONEST ABOUT` (caveats) and `SOURCES`, where
each applies (`TIME`, `CLICKS`, `SAY` and `SOURCES` are always there). Part 1 slides add `ANALOGY` and `FOR ADVANCED
STUDENTS`; reused adult slides end with a teacher-only pointer to the adult slide. The file is too big to email: share
it by link, USB stick or a shared drive, and keep the PDF (`build/splash/AI_Alignment_and_Safety_Splash.pdf`) as a
backup. For reviewers there is an emailable copy, `build/splash/AI_Alignment_and_Safety_Splash_REVIEW-COPY.pptx`
(about 20 MB: the same slides, notes and animations with smaller clips and pictures; present from the full
deck), made by `python3 tools/make_review_copy.py`.

## Nov 6, 2026: faster pace

William’s request (Nov 6): “I want the presentation to be a bit more fast paced, let’s go for 1.5 slides per minute”, and
“Feel free to use more material from the old presentation if you desire”.

- **The pace.** The deck went from 59 slides to **160 in the same 110 minutes**: 1.45 slides a minute overall and
  **1.53 a minute without the 6-minute Q&A** (about 40 seconds a slide). Opening 5 slides / 3 min; Part 1 56 / 36;
  Part 2 33 / 22; Part 3 46 / 30; Part 4 19 / 13 (with the closing reveal); Q&A 1 / 6. No slide is a copy of another
  with one more thing shown: the pace comes from splitting, not cloning.
- **How: one idea per slide.** Dense slides became short sequences, each slide led by one picture, number, headline,
  quote or diagram. Part 1: flash cards (2 slides), one-sided cards (3), dog treats (2, plus OpenAI’s hide-and-seek and
  AlphaGo’s Move 37), the finger quiz (2), the network and its dials (3), the hiker in fog (4: the loss, the slope in
  every direction, the small step, real bumpy hills), backpropagation (2), text left to right (2), images from static
  (3), LeCun’s cake (3), lecture / worked examples / homework and exams (9), CPU, GPU and MythBusters (4), Nvidia’s
  three reasons and its rivals (5), scaling laws (2) and the gigawatt (3). Parts 2 and 3: the benchmark summary became a
  guess and three one-test slides; Navier–Stokes, CoastRunners, the loopholes, the hidden reasoning, the research
  intern, the Hugging Face break-in, PHP2Shell, the shutdown tests, the incident counts and the CAIS statement each
  became 2–6 slides. Part 4: the five approaches got a slide each, with real material; the access, pain and
  “real work” slides were split; a free-resources slide was added. Six layout builders in
  `tools/slides_splash_extra.js` (one headline, one number, one question, one quote, one clip or photo, native
  cards) measure their own text, so the one-idea slides centre themselves and do not overlap.
- **Material added from the adult deck**, adapted for ages 12–17, every fact from a verified manifest entry:
  AlphaGo’s Move 37 (photo and WIRED headline); all six hide-and-seek stages; the ImageNet numbers; a ladder of dial
  counts; real loss landscapes (Li et al.); OpenAI’s real GPT-3 versus InstructGPT example; the PC Gamer “100,000 GPUs”
  headline and the Abilene aerial and satellite views; Epoch AI’s training-compute chart; the Hercules fact sheet as a
  spot-the-mistake beat; Genie 3; Buzzard’s “To grieve, or not to grieve?”; arXiv’s submission limit; Google’s 75%;
  Fortune’s “100% of their code”; Block’s job cuts and the mixed Challenger data; XPENG IRON and Unitree robot clips;
  Big Tech’s $760 billion; Meta Hyperion; the Three Mile Island restart; data centers on drought-hit land;
  RAMageddon; Hinton leaving Google, the employees’ letter and Amodei’s “doesn’t mean we need to panic”; Russell’s
  2014 words; the Hugging Face headline; the GPT-6.1 Astra cancellation; Golden Gate Claude (moved to Part 4) and
  Anthropic’s rhyme-planning study; the labs’ safety frameworks; OpenAI’s Sep 27 training pause.
- **Beats trimmed.** Kept: the Part 3 worry poll and its re-vote, the real-or-fake vote, the guesses (castle steps,
  reading years, GPU cores, gigawatt homes, the launch gap, the 2023 test score, statewide pauses, the shutdown share,
  the crash test), the say-together flash cards, the two-slide finger quiz, and one turn-to-a-neighbor each in
  Parts 1–4. Dropped: Part 1’s “at which step would you test for danger?” and “what would you do if you ran a lab?”.
  Shortened: the doubling pair-share (1 minute to 45 seconds), the robot-chore pair-share (to 30 seconds), the
  machine-feelings and “which role?” beats (to 45 seconds). New beats are 10–20 seconds or spoken only (the fact-sheet
  mistake, code nobody checked, “because of AI”, phone prices, good news or bad news). Q&A went from 7 to 6 minutes
  and is the only buffer: see “If you are running long”.
- **Fix pass (Nov 6, after two editors and two critics).**
  - *Exclusions:* “Some AI tools can help or harm” no longer names a weapon (“refuse requests that could help someone
    cause serious harm”; the bioweapon definition left the notes). The pain topic is one slide, not two: the
    “turned up, the models picked delete options” experiment is gone from the slides and the notes, and the notes call
    it the most speculative slide and the first Part 4 item to skip. The CAIS notes now say that the pandemics and
    nuclear-war words are a comparison of seriousness, not a prediction.
  - *No repeats:* the GPT-6.1 Astra cancellation is shown once, in Part 3 (“A new model held back over misbehavior”);
    “Labs can hit the brakes” in Part 4 keeps only OpenAI’s Sep 27 pause and refers back in one line.
  - *Readable from the back:* the re-vote uses the same large poll as the first vote; the shutdown slide is one hero
    number with a 100-dot grid (one dot per run) instead of a five-model chart; the message-board slide was split into
    the four-step strip and “688 of the 1,206 agents joined the break-in” with one agent’s words (its rule chips and
    message counts went to the notes); the PHP2Shell timeline has one short line per card at 24 pt; the stock slide
    keeps one headline (NBC) beside a taller chart with larger labels (Fortune’s and Yahoo’s headlines are quoted in
    the notes); the hide-and-seek panels carry big numbered labels; the three safety-framework pages carry big
    ANTHROPIC / OPENAI / GOOGLE DEEPMIND labels; the roadmap, “Part 2 in three words” and “real work” cards were
    shortened and enlarged; the fog caption and axis label on the loss slide were moved clear of the drawing.
  - *Sources:* the GPT-6 Astra photo slide now says on its face “a demo posted by its maker, not independently
    checked”.
  - *Timing:* the two robot-clip slides and “Some engineers say AI writes all their code” got 30 seconds each, so a clip
    can play; LeCun’s own slide became a 15-second glance; the time went to “it was grown” (neighbor turn) and “real
    work” (hands-up). Each part kept its total.
  - *Checked and kept:* the “Which one is real?” E/F pair is soldiers on a training exercise (Swift Response 25,
    Latvia): no combat, no shooting in the clip, no injuries; the only other pair in the deck’s research set shows rifles
    firing (see “About the real-or-fake clips”). The green answer ticks on the guess slides appear only on the click
    (checked in the animation list; a PDF shows every slide’s last step). Source lines stay 12 pt (credits, not
    content).

## Nov 5, 2026 update: what changed and why

*Slide numbers in this section are those of the 59-slide Nov 5 deck; today’s numbers are in the run of show below.*

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
  (slide 160), a roving microphone or a runner; if there is none, hand out paper slips for written questions.
- **A visible clock**, and these checkpoints (minute 0:00 = the first slide, 3:00 pm): Part 1 ends at **39:00**
  (3:39 pm), Part 2 at **61:00** (4:01), Part 3 at **91:00** (4:31), Part 4 at **104:00** (4:44). At about 40
  seconds a slide, a late part is caught up only by hiding slides: see “If you are running long”. Every note starts
  with its slide’s class clock.
- **Internet** for the two embedded YouTube videos: slide 84 (Figure robot; play about 20 seconds, then talk over the
  still) and slide 107 (CoastRunners boat; its embed link ends in `?end=40`, so it stops by itself after 40 seconds).
  Each video slide also has a clickable ► link under the video. Stop each video before YouTube’s end screen, which
  shows recommendations.
- **Optional: the MythBusters paintball clip for slide 49** (NVIDIA’s 2008 demo: one paintball barrel paints a smiley,
  then 1,100 barrels paint the Mona Lisa at once). It is *not* embedded: only third-party re-uploads were found, none on
  NVIDIA’s channel, and their running times could not be read. The three links are in the slide 49 notes. The slide has
  45 seconds; if you add the clip, watch it first, note the start and end seconds of the two rounds, test it on the room
  laptop, and pay for its time by hiding one group from the cut list.
- A whiteboard or flip chart and a helper (or a student volunteer) to write down the rough A–D counts of the Part 3
  worry poll (slide 96), so the room can compare them with the re-vote on slide 138.
- If there is no roving microphone: paper slips and pencils. Helpers hand them out at the Part 4 divider (slide 141) so
  students can write questions during Part 4, and collect them during slide 156 (“There is real work here”). With
  200 people, say rough fractions out loud (“about a third”) rather than counting hands.
- **Check the week of the talk** (each slide’s notes say what to look for):
  1. **Data-center map (slide 91), around Nov 19:** update `assets/research/splash_nov/dc_moratoria_states.json`
     (categories and `as_of`), run `node tools/make_dc_map.js`, and rebuild; the counts on the slide come from the
     file. Texas’s audit is due in December, and governor-elect Hinojosa has called for a moratorium.
  2. **Stock chart (slide 93), around Nov 19–20:** add FRED’s Nasdaq closes to
     `assets/research/splash_nov/econ_series.json`, delete `nov5_provisional`, and rebuild; the line extends itself.
     NVIDIA reports earnings around Nov 18; mention it if markets move sharply.
  3. **NVIDIA’s value (slide 50):** the headline is from Oct 29, 2025 (“the first company worth $5 trillion”); say it
     was a year ago, or check a live quote.
  4. **PHP2Shell (slides 127–129):** any new CISA notice or confirmed attribution. The notes mark which claims are
     single source.
  5. **GPT-6 Astra, GPT-6.1 Astra and Abilene (new on Nov 6):** slides 40 (PC Gamer’s “100,000 GPUs”), 56 (Epoch AI’s
     compute estimates), 59 (the 1.2-gigawatt campus), 67 (GPT-6 Astra’s science score), 114–115 (the Astra system
     card), 134 (GPT-6.1 Astra held back) and 149 (OpenAI’s Sep 27 pause). Re-open the pages; each is shown as a
     company report, a news report or an estimate, and none may be presented as more than that.
  6. **Leaderboards and pages:** Humanity’s Last Exam (70), the three test slides (67–69: Epoch AI, ARC Prize,
     SWE-bench), METR’s page (64–65), the Clay Institute and the Navier–Stokes dispute (76–77), OpenAI’s
     research-intern page (117–119), and any new model (for example Gemini 4) that would change a “best score”.
  7. **New on Nov 6:** arXiv’s submission limit (79) and Challenger’s November job-cuts report (83; if it is out before
     Nov 21, update “1 in 5” and the “October lowest month” line in the notes).
  8. **Dated facts in Part 4:** OpenAI’s GPT-Rosalind cards (151–152), Anthropic’s Aug 18 post (152), the
     pain-direction preprint revised Nov 3 (154), and BlueDot Impact’s course list, cost and age rules (157).
  9. **Play every clip on the room laptop, in slideshow mode:** both YouTube videos; the twelve looping real-or-fake
     clips (six on each of slides 74 and 75); the two robot clips (85 XPENG, 86 Unitree); the robot-arm clip (110) and
     the loop animation (116). Preview the Figure video end to end (slide 84): check the audio for language and pick
     a clean stretch of about 20 seconds; if you like, add `?start=S&end=E` (seconds) to the embed link. Check that the
     CoastRunners clip (107) stops cleanly at 40 seconds.
  10. Write the one true sentence about what you checked yourself (for example, which slides you reviewed) for the
      closing reveal (slide 159), and say it right after the “made by an AI” explanation (its notes ask for it).
- **About the real-or-fake clips (slides 74–75).** They are Splash copies of the adult deck’s GIFs
  (`tools/slides_splash_extra.js`, `splashGif`): the same frames and timing, scaled to about the size they are shown
  at (540 px wide on slide 74, 400 px on slide 75) and lightly compressed (gifsicle `--lossy=40`, full colour
  palettes), about 6–11 MB each on slide 74 and about 4–5 MB on slide 75. Stronger compression left visible banding,
  which would bias a real-or-fake vote. Each loop starts partway into its clip (both clips of a pair at the same
  frame, so they stay in sync). The third pair (E/F) is US paratroopers walking through a trench on a training
  exercise (Swift Response 25, Latvia, May 2025): no combat, no shooting in the clip, no injuries (checked frame by
  frame on Nov 6). The only other pair in the deck’s verified research set shows rifles firing, so it was not used. If
  you would rather show no soldiers at all, say so before the 21st: the two slides can be rebuilt with two pairs.
- Open the file a minute early (it is about 137 MB), and keep the PDF (`build/splash/AI_Alignment_and_Safety_Splash.pdf`)
  on the laptop as a backup.

## Run of show

Clock = minutes:seconds from the start of class (3:00 pm). Beats are by hands, fingers, standing or turning to a
neighbor. No devices. (`./build_splash.sh` regenerates the slide list with the current slide numbers in
`build/splash/run_of_show.md`; if the two ever differ, the generated file and the slide notes are right.)

| Clock | Slides | Slides in part | Min | Part | Interactive beats (clock, slide) |
|---|---|---|---|---|---|
| 0:00–3:00 | 1–5 | 5 | 3 | **Opening** | 0:15 Hands up if you used an AI chatbot or an AI picture tool… (2) · 1:00 Hands up if you think an AI chatbot understands what it… (3) |
| 3:00–39:00 | 6–61 | 56 | 36 | **Part 1 · How AI learns** | 3:15 hands up: Name something you could NOT easily write… (7) · 5:00 guess first: What’s on the back? Say it together on 3! (9) · 6:30 hands up: Sort these into piles: by kind, or by color? (11) · 9:45 QUIZ (17) · 10:45 QUIZ (18) · 15:30 hands up: Steps way too big: what goes wrong? (24) · 17:15 think about it: Why not test each dial one at a time? (27) · 17:45 hands up: The cat sat on the ___: mat, moon or pizza? (28) · 18:45 guess first: When does the castle appear: after 3, 8 or… (30) · 20:15 hands up: Which layer teaches the AI the most: cake,… (33) · 23:30 guess first: Reading 24 hours a day, how many years? (38) · 25:00 think about it: Why would a model trained on the… (41) · 26:30 hands up: A or B? (43) · 28:45 guess first: How many cores in one AI chip (a GPU)? (47) · 31:45 hands up: Do you switch? (52) · 35:00 GUESS FIRST (57) · 36:45 turn to a neighbor: If you can’t read a model’s rules,… (60) · 38:00 hands up: Does it understand what it says? What would… (61) |
| 39:00–61:00 | 62–94 | 33 | 22 | **Part 2 · How fast it is moving** | 39:15 guess first, about Part 2 minute 1 (63) · 40:15 think-pair-share, 45 seconds, about Part 2 minute 2 (64) · 42:15 hands up, 20 seconds: yes or no (66) · 44:45 poll before the click: photo or computer-made? (71) · 45:30 hands up when you spot the mistake (72) · 46:45 vote on each column: A or B? C or D? E or F? (74) · 48:15 reveal the answers pair by pair; hands up: who got all… (75) · 49:15 hands up: Did you think a computer could do new research… (76) · 51:45 quick hands up: Would you use code an AI wrote if no… (80) · 52:45 spoken: because of AI (82) · 53:45 think-pair-share: Which chore would you give a robot… (84) · 58:00 guess first: How many of them have a statewide pause? (91) · 59:15 spoken, 10 seconds: would you pay more for your next… (92) · 59:45 hands up: Does a big stock drop prove AI is failing? (93) |
| 61:00–91:00 | 95–140 | 46 | 30 | **Part 3 · Why it could go wrong** | 61:15 hand-raise poll, about 1 minute, Part 3 minute 1 (96) · 65:00 hands up, 20 seconds: name something very good at its… (102) · 66:45 think-pair-share, 90 seconds (104) · 69:00 guess-the-answer before the clip, hands up for A, B or C (107) · 71:00 think-pair-share, 1 minute (109) · 73:30 30 seconds of silent thinking, then hands up for A or B (113) · 77:00 hands up, 20 seconds: a fact, a company goal, or a forecast? (119) · 80:00 think-pair-share, 1 minute: how would you keep 1,000 AI… (124) · 83:15 spoken only: Is an AI that finds hidden bugs good news… (129) · 83:45 guess first, hands up for A, B or C (130) · 87:30 hands up: Is 0.004% big or small? (137) · 88:30 re-poll by hands (138) |
| 91:00–104:00 | 141–159 | 19 | 13 | **Part 4 · What we can do** | 91:15 guess first: Cars are crash-tested before sale. Which of… (142) · 97:30 quick hands up: Who should decide who gets a very… (152) · 99:30 turn to a neighbor: What evidence would convince you a… (155) · 100:30 hand-raise poll: Which could you picture yourself doing? (156) · 103:00 quick hands up: Who suspected an AI made these slides… (159) |
| 104:00–110:00 | 160 | 1 | 6 | **Q&A** | 104:00 open Q&A (160) |

Total: 160 slides, 110 minutes: 1.45 slides a minute overall, 1.53 a minute without the Q&A.

Slide by slide (from `build/splash/run_of_show.md`; the Note column marks the cut order, the never-cut slides and the news slides):

| # | Clock | Min | Part | Title | Note |
|---|---|---|---|---|---|
| 1 | 0:00 | 0.25 | Opening | AI Alignment and Safety |  |
| 2 | 0:15 | 0.75 | Opening | Hands up: who has used an AI this week? |  |
| 3 | 1:00 | 0.5 | Opening | Does it understand what it says? |  |
| 4 | 1:30 | 1 | Opening | Learn how it works, then what could go wrong |  |
| 5 | 2:30 | 0.5 | Opening | Alignment: getting AI to do what we want |  |
| 6 | 3:00 | 0.25 | Part 1 | *How does an AI learn?* |  |
| 7 | 3:15 | 1 | Part 1 | Could you write rules to spot a lion? |  |
| 8 | 4:15 | 0.75 | Part 1 | Machine learning: the computer finds the rules |  |
| 9 | 5:00 | 1 | Part 1 | Supervised learning: flash cards with answers |  |
| 10 | 6:00 | 0.5 | Part 1 | Guess, flip, adjust: millions of times |  |
| 11 | 6:30 | 0.5 | Part 1 | Unsupervised learning: no answers on the back |  |
| 12 | 7:00 | 0.5 | Part 1 | It finds the groups. Nobody named them. |  |
| 13 | 7:30 | 0.5 | Part 1 | Or it learns to make a brand-new card |  |
| 14 | 8:00 | 0.5 | Part 1 | Reinforcement learning: treats for good tries |  |
| 15 | 8:30 | 0.5 | Part 1 | For an AI, the treat is points |  |
| 16 | 9:00 | 0.75 | Part 1 | AlphaGo practised by playing against itself |  |
| 17 | 9:45 | 1 | Part 1 | Quiz 1 of 2: which kind of learning? |  |
| 18 | 10:45 | 1 | Part 1 | Quiz 2 of 2: which kind of learning? |  |
| 19 | 11:45 | 1 | Part 1 | A neural network: layers of simple units |  |
| 20 | 12:45 | 0.5 | Part 1 | Every connection is a dial |  |
| 21 | 13:15 | 0.75 | Part 1 | How many dials? From thousands to trillions |  |
| 22 | 14:00 | 0.5 | Part 1 | First, a score for how wrong: the loss |  |
| 23 | 14:30 | 1 | Part 1 | Feel the slope in every direction |  |
| 24 | 15:30 | 0.75 | Part 1 | Small step downhill. Feel again. Repeat. |  |
| 25 | 16:15 | 0.5 | Part 1 | Real hills are bumpy |  |
| 26 | 16:45 | 0.5 | Part 1 | Backpropagation passes the blame back |  |
| 27 | 17:15 | 0.5 | Part 1 | One backward sweep tunes every dial |  |
| 28 | 17:45 | 0.5 | Part 1 | Text AI writes left to right, a word at a time |  |
| 29 | 18:15 | 0.5 | Part 1 | It scores every word, and the text grades it |  |
| 30 | 18:45 | 0.5 | Part 1 | Image AI starts from static and cleans it up |  |
| 31 | 19:15 | 0.5 | Part 1 | Cleaned up a little, again and again |  |
| 32 | 19:45 | 0.5 | Part 1 | Practice: add static to a photo, then undo it |  |
| 33 | 20:15 | 0.5 | Part 1 | LeCun’s cake: which layer teaches most? |  |
| 34 | 20:45 | 0.75 | Part 1 | The sponge: the data itself teaches most |  |
| 35 | 21:30 | 0.25 | Part 1 | LeCun’s own slide, 2019 |  |
| 36 | 21:45 | 1.25 | Part 1 | Making a chatbot: lecture, examples, homework |  |
| 37 | 23:00 | 0.5 | Part 1 | Pretraining is the lecture: guess the next word |  |
| 38 | 23:30 | 0.5 | Part 1 | How long would it take you to read it all? |  |
| 39 | 24:00 | 0.5 | Part 1 | About 90,000 years of nonstop reading |  |
| 40 | 24:30 | 0.5 | Part 1 | Thousands of chips, running for months |  |
| 41 | 25:00 | 1 | Part 1 | A base model just keeps the page going |  |
| 42 | 26:00 | 0.5 | Part 1 | Worked examples turn it into an assistant |  |
| 43 | 26:30 | 0.75 | Part 1 | Homework, grader 1: people’s votes |  |
| 44 | 27:15 | 0.5 | Part 1 | Grader 2: a program checks the answer |  |
| 45 | 27:45 | 0.5 | Part 1 | The cherry is growing |  |
| 46 | 28:15 | 0.5 | Part 1 | A CPU: a few strong workers |  |
| 47 | 28:45 | 0.5 | Part 1 | How many cores in one AI chip? |  |
| 48 | 29:15 | 0.75 | Part 1 | A GPU: 16,896 simple workers |  |
| 49 | 30:00 | 0.75 | Part 1 | MythBusters: one paintball barrel, or 1,100 |  |
| 50 | 30:45 | 0.5 | Part 1 | Nvidia: the first company worth $5 trillion |  |
| 51 | 31:15 | 0.5 | Part 1 | Reason 1: the fastest AI chips |  |
| 52 | 31:45 | 0.75 | Part 1 | Reason 2: CUDA, the software everyone uses |  |
| 53 | 32:30 | 0.5 | Part 1 | Reason 3: the wiring between thousands of chips |  |
| 54 | 33:00 | 0.5 | Part 1 | But Nvidia has rivals |  |
| 55 | 33:30 | 1 | Part 1 | Scaling laws: bigger runs, fewer mistakes |  |
| 56 | 34:30 | 0.5 | Part 1 | Training runs grow about 5 times a year |  |
| 57 | 35:00 | 0.5 | Part 1 | How many homes can one gigawatt run? | hide #1 if running long |
| 58 | 35:30 | 0.75 | Part 1 | One gigawatt: about 850,000 homes | hide #1 if running long |
| 59 | 36:15 | 0.5 | Part 1 | One AI campus: 1.2 gigawatts | hide #1 if running long |
| 60 | 36:45 | 1.25 | Part 1 | Nobody typed in the rules: it was grown |  |
| 61 | 38:00 | 1 | Part 1 | Five things to carry into Part 2 |  |
| 62 | 39:00 | 0.25 | Part 2 | *How fast is AI moving?* |  |
| 63 | 39:15 | 1 | Part 2 | Anthropic + OpenAI: typical launch gap 11 days |  |
| 64 | 40:15 | 1.25 | Part 2 | Task length doubled about every 4 months |  |
| 65 | 41:30 | 0.75 | Part 2 | The ruler is running out of room |  |
| 66 | 42:15 | 0.5 | Part 2 | Guess: did any 2023 AI pass 50%? |  |
| 67 | 42:45 | 0.5 | Part 2 | PhD-level science: 36% to 96% |  |
| 68 | 43:15 | 0.5 | Part 2 | Picture puzzles: 0.8% to 95% |  |
| 69 | 43:45 | 0.5 | Part 2 | Fixing real bugs: 31% to 83.5% |  |
| 70 | 44:15 | 0.5 | Part 2 | The “last exam” for AI went from 7% to 61% | hide #2 if running long |
| 71 | 44:45 | 0.75 | Part 2 | This is not a photograph, says its maker |  |
| 72 | 45:30 | 0.75 | Part 2 | Spot the mistake in this AI fact sheet | hide #3 if running long |
| 73 | 46:15 | 0.5 | Part 2 | AI can now build a world you can explore | hide #3 if running long |
| 74 | 46:45 | 1.5 | Part 2 | Which one is real? |  |
| 75 | 48:15 | 1 | Part 2 | Top 2 video AIs fool people about half the time |  |
| 76 | 49:15 | 0.75 | Part 2 | A $1 million math problem |  |
| 77 | 50:00 | 0.75 | Part 2 | OpenAI’s famous-math claim is still disputed |  |
| 78 | 50:45 | 0.5 | Part 2 | A top mathematician: “grieve, or not?” | hide #4 if running long |
| 79 | 51:15 | 0.5 | Part 2 | Too many AI-written papers: arXiv sets a limit | hide #4 if running long |
| 80 | 51:45 | 0.5 | Part 2 | Google: 75% of its new code is AI-generated |  |
| 81 | 52:15 | 0.5 | Part 2 | Some engineers say AI writes all their code |  |
| 82 | 52:45 | 0.5 | Part 2 | A company cut about 4,000 jobs, citing AI |  |
| 83 | 53:15 | 0.5 | Part 2 | How sure are we? The jobs data is mixed |  |
| 84 | 53:45 | 1.25 | Part 2 | Figure says pretraining raised success to 56% |  |
| 85 | 55:00 | 0.5 | Part 2 | A robot walked off its own assembly line | hide #5 if running long |
| 86 | 55:30 | 0.5 | Part 2 | Kung-fu robots, and 20,000 more planned | hide #5 if running long |
| 87 | 56:00 | 0.5 | Part 2 | Big Tech’s AI spending: $760 billion in 2026 |  |
| 88 | 56:30 | 0.5 | Part 2 | One AI campus: $10 billion to $50 billion | hide #6 if running long |
| 89 | 57:00 | 0.5 | Part 2 | A nuclear plant is reopening to power AI | hide #6 if running long |
| 90 | 57:30 | 0.5 | Part 2 | Most new AI data centers: on drought-hit land | hide #6 if running long |
| 91 | 58:00 | 1.25 | Part 2 | 46 states have data-center limits or bills | news (data centers), keep |
| 92 | 59:15 | 0.5 | Part 2 | AI’s hunger for chips is raising phone prices |  |
| 93 | 59:45 | 1 | Part 2 | Tech and AI stocks are swinging hard | news (stocks), keep |
| 94 | 60:45 | 0.25 | Part 2 | Part 2 in three words |  |
| 95 | 61:00 | 0.25 | Part 3 | *Why could it go wrong?* |  |
| 96 | 61:15 | 1.25 | Part 3 | How worried should we be? Vote first | never cut |
| 97 | 62:30 | 0.75 | Part 3 | Experts disagree, and these are guesses |  |
| 98 | 63:15 | 0.25 | Part 3 | Our three rules for Part 3 |  |
| 99 | 63:30 | 0.5 | Part 3 | A pioneer of AI left Google to warn us |  |
| 100 | 64:00 | 0.5 | Part 3 | AI workers: be ready to slow down |  |
| 101 | 64:30 | 0.5 | Part 3 | A CEO: “a warning sign,” but no panic |  |
| 102 | 65:00 | 0.75 | Part 3 | Good at its job, but does it care? |  |
| 103 | 65:45 | 1 | Part 3 | Being smart does not mean sharing our goals |  |
| 104 | 66:45 | 1 | Part 3 | What would you need besides studying? |  |
| 105 | 67:45 | 0.75 | Part 3 | Almost any goal needs the same helper steps |  |
| 106 | 68:30 | 0.5 | Part 3 | In one AI pioneer’s words (2014) | hide #7 if running long |
| 107 | 69:00 | 1.25 | Part 3 | What did this game AI learn? |  |
| 108 | 70:15 | 0.75 | Part 3 | It chased the points, not the race |  |
| 109 | 71:00 | 0.75 | Part 3 | Find the loophole |  |
| 110 | 71:45 | 0.75 | Part 3 | A public list of 90 AI loopholes |  |
| 111 | 72:30 | 0.5 | Part 3 | Losing at chess? Some AIs hacked the game |  |
| 112 | 73:00 | 0.5 | Part 3 | A failing test? One AI deleted it |  |
| 113 | 73:30 | 0.5 | Part 3 | How would you check the work? |  |
| 114 | 74:00 | 0.5 | Part 3 | A new AI shows less of its working |  |
| 115 | 74:30 | 0.75 | Part 3 | OpenAI’s own report: harder to check |  |
| 116 | 75:15 | 0.75 | Part 3 | AI that builds better AI |  |
| 117 | 76:00 | 0.5 | Part 3 | OpenAI says it has an AI research intern |  |
| 118 | 76:30 | 0.5 | Part 3 | Its chief scientist: alignment isn’t solved |  |
| 119 | 77:00 | 0.75 | Part 3 | “Automated AI researcher by 2028”: what is it? |  |
| 120 | 77:45 | 0.5 | Part 3 | An AI broke out of a test and hacked a company |  |
| 121 | 78:15 | 0.75 | Part 3 | Hugging Face counted 17,600 attacker actions |  |
| 122 | 79:00 | 0.5 | Part 3 | AIs in a test found a hidden message board |  |
| 123 | 79:30 | 0.5 | Part 3 | 688 of the 1,206 agents joined the break-in | split off the message board (fix pass) |
| 124 | 80:00 | 0.75 | Part 3 | How would you keep them apart? |  |
| 125 | 80:45 | 0.5 | Part 3 | In their own words: faking the records | hide #7 if running long |
| 126 | 81:15 | 0.5 | Part 3 | In their own words: “no”, then “GO” | hide #7 if running long |
| 127 | 81:45 | 0.75 | Part 3 | AI helped find a bug hidden for 10+ years | news (PHP2Shell), keep |
| 128 | 82:30 | 0.75 | Part 3 | Then attackers moved within minutes | news (PHP2Shell), keep |
| 129 | 83:15 | 0.5 | Part 3 | Good news or bad news? Both. | news (PHP2Shell), keep |
| 130 | 83:45 | 0.5 | Part 3 | Guess: would an AI dodge being switched off? |  |
| 131 | 84:15 | 0.75 | Part 3 | o3 sabotaged its shutdown in 79 of 100 runs |  |
| 132 | 85:00 | 0.5 | Part 3 | Secretly working against its instructions | hide #8 if running long |
| 133 | 85:30 | 0.5 | Part 3 | Pretending to agree, to avoid being changed | hide #8 if running long |
| 134 | 86:00 | 0.5 | Part 3 | A new model held back over misbehavior |  |
| 135 | 86:30 | 0.5 | Part 3 | “Tens of thousands” of AI incidents? |  |
| 136 | 87:00 | 0.5 | Part 3 | Out of how many? |  |
| 137 | 87:30 | 1 | Part 3 | Big counts are hard to compare | hide #11 if running long |
| 138 | 88:30 | 1 | Part 3 | Same question: has your answer changed? | never cut |
| 139 | 89:30 | 1 | Part 3 | Even the AI lab CEOs signed this sentence | never cut |
| 140 | 90:30 | 0.5 | Part 3 | One expert’s estimate, and the wider view |  |
| 141 | 91:00 | 0.25 | Part 4 | *What can we do about it?* |  |
| 142 | 91:15 | 1 | Part 4 | Five approaches: which one is a crash test? | never cut |
| 143 | 92:15 | 0.5 | Part 4 | A · Interpretability: a brain scan for AI | never cut |
| 144 | 92:45 | 0.75 | Part 4 | Turned up, Claude talked about the bridge |  |
| 145 | 93:30 | 0.5 | Part 4 | Researchers caught Claude planning a rhyme |  |
| 146 | 94:00 | 0.5 | Part 4 | B · Oversight: a referee reads its notes | never cut |
| 147 | 94:30 | 1 | Part 4 | C · Evaluations: crash tests before release | never cut |
| 148 | 95:30 | 0.5 | Part 4 | D · Control: plan for the AI misbehaving | never cut |
| 149 | 96:00 | 0.5 | Part 4 | Labs can hit the brakes |  |
| 150 | 96:30 | 0.5 | Part 4 | E · Governance: rules, like traffic laws | never cut |
| 151 | 97:00 | 0.5 | Part 4 | Some AI tools can help or harm | hide #10 if running long |
| 152 | 97:30 | 0.75 | Part 4 | So some labs limit who gets the riskiest tools | hide #10 if running long |
| 153 | 98:15 | 0.5 | Part 4 | Each approach is partial, and none is solved |  |
| 154 | 98:45 | 0.75 | Part 4 | Could an AI feel pain? Nobody knows yet | hide #9 if running long |
| 155 | 99:30 | 1 | Part 4 | Model welfare: “we remain deeply uncertain” |  |
| 156 | 100:30 | 1.25 | Part 4 | There is real work here, and it needs people | never cut |
| 157 | 101:45 | 0.75 | Part 4 | Start now: free things to try |  |
| 158 | 102:30 | 0.5 | Part 4 | Nobody has this solved yet |  |
| 159 | 103:00 | 1 | Part 4 | This presentation was made by an AI. |  |
| 160 | 104:00 | 6 | Q&A | Questions, then one thing to do this week |  |

## If you are running long

The plan has no slack: it totals exactly 110 minutes, and the 6-minute **Q&A (slide 160) is the only buffer**. Keep
at least 4 minutes of it. Check the clock at the end of each part (39:00, 61:00, 91:00, 104:00, from the
checkpoints above) and decide there.

**First, shorten beats (no slide hidden):** ask the question and answer it yourself instead of polling the room on
slides 27 (why not test each dial alone?), 41 (why answer with more questions?), 52 (do you switch?), 82 and 92
(spoken questions) and 113 (silent thinking); cut the neighbor turn on 60 to 30 seconds. Together they save about
2 minutes.

**Then hide slides** (*Slide Show → Hide Slide*, so the numbering and the notes stay the same). The groups are in
class order. At slide 50 (Nvidia, planned for 30:45), hide #1 if you are more than 2 minutes behind. At the end of
each part, hide the next part’s groups in order until you are back on the plan: #2–#6 for Part 2 (up to 5.25
minutes), #7–#8 for Part 3 (2.5), #9–#10 for Part 4 (2.0). Hide #11 last of all.

| Order | Slides | Saves (min) | Say instead / note |
|---|---|---|---|
| 1 | 57, 58, 59: How many homes can one gigawatt run?; One gigawatt: about 850,000 homes; One AI campus: 1.2 gigawatts | 1.75 | Part 1. On “Training runs grow about 5 times a year”, say “one AI campus can use about as much power as a big power plant makes” |
| 2 | 70: The “last exam” for AI went from 7% to 61% | 0.5 | Part 2. The three test slides before it already show tests being beaten |
| 3 | 72, 73: Spot the mistake in this AI fact sheet; AI can now build a world you can explore | 1.25 | Part 2. The photo and the real-or-fake vote carry the creative point |
| 4 | 78, 79: A top mathematician: “grieve, or not?”; Too many AI-written papers: arXiv sets a limit | 1 | Part 2 |
| 5 | 85, 86: A robot walked off its own assembly line; Kung-fu robots, and 20,000 more planned | 1 | Part 2. The Figure robot slide stays |
| 6 | 88, 89, 90: One AI campus: $10 billion to $50 billion; A nuclear plant is reopening to power AI; Most new AI data centers: on drought-hit land | 1.5 | Part 2. Keep the $760 billion, the map and the stocks |
| 7 | 106, 125, 126: In one AI pioneer’s words (2014); In their own words: faking the records; In their own words: “no”, then “GO” | 1.5 | Part 3. The Hugging Face sequence keeps its headline, overview, board, the 688 and the pair question |
| 8 | 132, 133: Secretly working against its instructions; Pretending to agree, to avoid being changed | 1 | Part 3. The shutdown guess and the 79-of-100 slide stay |
| 9 | 154: Could an AI feel pain? Nobody knows yet | 0.75 | Part 4. The most speculative slide; on the next slide, say “some researchers ask whether an AI could ever feel anything; nobody knows” |
| 10 | 151, 152: Some AI tools can help or harm; So some labs limit who gets the riskiest tools | 1.25 | Part 4. Hide the two together; the five approaches stay complete |
| 11 | 137: Big counts are hard to compare | 1 | Part 3, but hide it last of all: it is the honest-uncertainty counterweight to the incident stories, just before the re-vote; keep its “what is counted?” question for Q&A |

**Never cut** the worry poll and its re-vote (96 and 138), the CAIS statement (139), the five approaches (142, and
the approach slides 143, 146, 147, 148 and 150), and “There is real work here, and it needs people” (156): they carry
the “serious, unsolved, people are working on it” framing. Also keep the news slides William asked for: the
data-center map (91), the stock swings (93) and PHP2Shell (127–129); and Part 1’s topic slides (6–56 and 60–61),
each of which carries a topic from the course description or from William’s list (the three kinds of learning, the
network, the slope, backpropagation, left-to-right text and diffusion, the cake, pretraining versus post-training,
GPUs, NVIDIA, scaling laws).

**Running short?** Use the spare minutes inside the deck: give the pair-share beats (64, 84, 104, 109, 124, 155) a
full minute, take a third answer on slides 7, 33 or 52, or ask a slide’s “ASK THE ROOM” question again and take two
more answers. Do not import adult-deck slides on the day: they are not built for this audience and the adult file is
about 1 GB.

## What changed from the adult deck, and why

*Written for the Nov 5 deck: slide numbers in this section are the 59-slide numbers (for example, Part 1 was slides 4–25 and the real-or-fake pair 32–33, now 6–61 and 74–75). The run of show above has today’s numbers; the substance below still holds, and the Nov 6 section lists what changed since.*

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
- **Kickers (updated Nov 6):** every content slide reads `PART n · <part name> · k`, with k counting the slides of
  that part in order: Part 1 1–55 on slides 7–61 (set in `slides_splash_ml.js`), Part 2 1–32 on 63–94, Part 3 1–45 on
  96–140 (both from the `ORDER` list in `slides_splash_extra.js`) and Part 4 1–17 on 142–158 (from `ORDER4` in
  `slides_splash_p4.js`), so reordering keeps the numbers right. The exceptions: slides 2–5 read `OPENING · …`; the
  dividers (6, 62, 95, 141) carry the part name only; slide 159 reads `ONE MORE THING` (as in the adult deck) and slide
  160 `Q&A`.
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

- `tools/build_splash.js` assembles the deck: Opening + Part 1 from `tools/slides_splash_ml.js`, then Parts 2–3 from
  `tools/slides_splash_extra.js`, and Part 4, the closing reveal and the Q&A from `tools/slides_splash_p4.js` (its
  `ORDER4`, `DIVIDER4`, `reveal` and `qaSlide`, which `slides_splash_extra.js` picks up). It rebrands the footer, starts a PowerPoint section per part, prepends
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
- `python3 tools/make_review_copy.py` writes the emailable review copy (`build/splash/…_REVIEW-COPY.pptx`, under
  25 MB): the GIF clips at a third of their size, pictures over 100 KB at 1,280 px or less (256 colours, unless that
  shifts a small colour, as on the annotated satellite views, which stay in full colour at 960 px). It never touches
  the real deck. `tools/postprocess.py` writes no folder entries into the .pptx (some cloud drives fail to open a file
  that has them).
- Research for the Nov 5 update is in `assets/research/splash_nov/` (`manifest.json`, `PLAN.md`, the map and stock
  data). Each adult module (`tools/slides_<module>.js`) exports `{ build, slides }`; `./build.sh` and the 117-slide
  adult deck are unchanged.
- The deck needs the adult deck’s derived images under `assets/slides/` (they are in the repository; `./build.sh`
  regenerates them).
