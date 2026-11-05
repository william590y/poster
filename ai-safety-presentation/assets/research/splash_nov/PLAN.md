# PLAN: new Part 1 and the 110-minute budget (Splash M1237, Nov 21, 2026)

Planner stage, Nov 5, 2026. Inputs: `ml-research.md`, `hack-research.md`, `dc-research.md`, `econ-research.md`, `SPLASH.md`,
`README.md` (truthfulness policy), `tools/slides_splash_ml.js`, `tools/slides_splash_extra.js`, `tools/build_splash.js` and the
baseline renders `build/baseline/slide-01..58.jpg` (each viewed).

The staleness audit (stage `r-stale`) had not written a report when this plan was made. Section 4 says how to fit what it forces.

---

## 0. Decisions in one screen

- **Budget:** Opening 4 + Part 1 37 = **41 min**; Part 2 **21**; Part 3 **29**; Part 4 **12**; Q&A **7**. Total 110. The deck grows
  from 58 slides to **59**.
- **Part 1:** 21 content slides (divider at 0 min), in six blocks:
  1. learning from examples (5 slides);
  2. the machine (dials, slope, blame) (3 slides);
  3. how it makes things (left to right, denoising) (2 slides);
  4. the cake and the school year (5 slides);
  5. chips and scale (4 slides);
  6. grown, then recap (2 slides).

  Every item on William's list has its own slide. Nine slides are new, eleven are modified and one is kept with a light
  trim. Seven old functions leave the build: `learningTypesSlide`, `postTrainSlide`, `rewardsSlide`, `pipelineSlide`,
  `ingredientsSlide`, `trainingEnergySlide` and `abileneSlide`.
- **Cuts in Parts 2–4** follow SPLASH.md's cut order in sequence:
  - #2 old 47 "AI agents, in their own words" (1.5);
  - #3 old 43 "AI that builds better AI" (1.5);
  - #4 old 27 "The ruler is running out of room" (1.0);
  - #5 old 33 "Google says 75% of new code…" (1.0).

  Cut #1 (old 21, Abilene) leaves with the Part 1 redesign. Q&A goes from 8 to 7.
- **News slides:**
  - **data-center map**: Part 2, new slide 36, 1.5 min;
  - **AI stocks swinging**: Part 2, new slide 37, 1.5 min;
  - **PHP2Shell hacking spree**: Part 3, new slide 48, right after the Hugging Face swarm, 2.0 min. It takes the place
    and role of the cut "own words" slide.
- **Never cut** (new numbers): 39 (worry poll), 51 (re-vote), 52 (CAIS), 54 (five approaches), 57 (roles). These are old
  37, 50, 51, 53 and 56.
- **No math anywhere:** no equations, no "=" used as a formula, no "≈", "~", "×", "→" used as arithmetic, no "log scale",
  no Greek letters, and no "gradient descent", "derivative" or "chain rule" in SAY. Write "about", "times" and "fewer" as
  words. William's line, used verbatim in the SAY of slide 11: **"the gradient is the slope in higher dimensions: the
  slope in many directions at once. It tells us which way is downhill."**
- **Truthfulness:** a number goes on a slide only if it has a `verified: true` manifest entry.
  - The SemiAnalysis "about half of compute is RL" estimate goes in the notes only, labelled "analyst estimate, seen
    second-hand". It is not in the manifest as verified.
  - Nvidia's market share stays off the slide: there is no primary source. A range can go in BE HONEST ABOUT, labelled
    "secondary estimates".
  - PHP's "70% of the internet" appears only inside the real Fortune/TIME headline screenshot, unless E2 verifies a
    usage source and adds it to the manifest.
  - William's "46 states" is corrected on the map slide (see 3.1).

---

## 1. The new Part 1 (slides 4–25, class minute 4:00–41:00)

### Conventions for E1

- **Canvas:** 13.333 × 7.5 in. Content sits between y 1.55 and 6.5, and the 12 pt source line at y 6.6. Use the existing
  helpers: `box`, `chip`, `iconDisc`, `beatTag`/`beat`/`beatLine`, `drawNet`, `src` and `notes`.
- **Kickers:** `PART 1 · HOW AI LEARNS · k`, with k = 1…21 on slides 5–25. No optional slides in Part 1.
- **Animation:** postprocess supports **entrance effects only**: `fade`, `wipeLeft`, `wipeDown`, `zoom`, `rise` and
  `slam`. There are no exits and no motion paths.
  - To fake a **flip**, an opaque "back" card of the same size and rotation fades or zooms in on top of the front.
  - To fake a **move**, an opaque cover panel (fill `HEX.bg` or `HEX.card`) fades in over the old layout, and the new
    layout rises on top of it.
- **Text:** body text at 16 pt or more, labels at 12 pt or more, titles of 48 characters or fewer (every title below is
  45 or fewer). One idea per slide, with at most about 25 words of body text.
- **Notes:** every slide's notes have TIME, CLICKS (the count must match the slide's click groups), SAY (plain words),
  ANALOGY, TERMS TO DEFINE, ASK THE ROOM, TAKEAWAY, FOR ADVANCED STUDENTS, BE HONEST ABOUT and SOURCES (with full
  URLs).
- **No formulas, even in the notes.** FOR ADVANCED STUDENTS may name an idea in words, for example "if asked: this is
  the chain rule from calculus". Remove the `784×16+16 … = 13,002` line, the 90,000-years arithmetic chain and the
  FLOP/scientific-notation lines. Keep a one-line plain description and the source.
- **Beats:** every chipped beat has its question printed on the slide, as SPLASH.md's "Beats on screen" rule requires.

### Slide table

| # | Clock | Min | Title (claim) | Status | Beat |
|---|---|---|---|---|---|
| 4 | 4:00 | 0 | *Divider:* How does an AI learn? | build_splash.js line | — |
| 5 | 4:00 | 1.5 | Machine learning: the computer finds the rules | modified `mlSlide` | HANDS UP |
| 6 | 5:30 | 1.0 | Supervised learning: flash cards with answers | **new** `flashCardsSlide` | GUESS FIRST (call out) |
| 7 | 6:30 | 1.25 | Unsupervised: sort the cards, or make new ones | **new** `unsupervisedSlide` | HANDS UP |
| 8 | 7:45 | 1.0 | Reinforcement learning: treats for good tries | **new** `rlDogSlide` | spoken only |
| 9 | 8:45 | 1.5 | Quiz: which kind of learning is this? | modified `quizSlide` | QUIZ (fingers) |
| 10 | 10:15 | 2.0 | A neural network is a stack of dials | modified `networkSlide` | spoken only (mixing board) |
| 11 | 12:15 | 2.0 | Training feels the slope, then steps downhill | modified `gradientSlide` | HANDS UP |
| 12 | 14:15 | 1.5 | Backpropagation sends the blame backwards | modified `backpropSlide` | HANDS UP |
| 13 | 15:45 | 1.75 | Text AI writes left to right, a word at a time | modified `nextWordSlide` | HANDS UP |
| 14 | 17:30 | 1.5 | Image AI starts from static and cleans it up | **new** `diffusionSlide` | GUESS FIRST |
| 15 | 19:00 | 2.0 | LeCun's cake: the data itself teaches most | **new** `cakeSlide` | HANDS UP (vote) |
| 16 | 21:00 | 2.5 | Making a chatbot: lecture, examples, homework | **new** `schoolSlide` (replaces `pipelineSlide`) | TURN TO A NEIGHBOR |
| 17 | 23:30 | 1.75 | Pretraining: read a huge library, then guess | modified `pretrainSlide` | GUESS FIRST |
| 18 | 25:15 | 1.75 | Worked examples turn it into an assistant | modified `baseModelSlide` (takes the SFT part of `postTrainSlide`) | THINK ABOUT IT |
| 19 | 27:00 | 2.0 | RL is homework: try, get graded, try again | **new** `rlHomeworkSlide` (merges `postTrainSlide` + `rewardsSlide`) | HANDS UP (A or B) |
| 20 | 29:00 | 2.5 | A GPU does thousands of simple sums at once | **new** `gpuSlide` | GUESS FIRST |
| 21 | 31:30 | 2.0 | Why Nvidia is so hard to beat in AI chips | **new** `nvidiaSlide` | HANDS UP |
| 22 | 33:30 | 2.0 | Scaling laws: bigger runs, fewer mistakes | modified `scalingSlide` (absorbs `ingredientsSlide`) | THINK ABOUT IT |
| 23 | 35:30 | 1.5 | How big is a gigawatt? | modified `gigawattSlide` | GUESS FIRST |
| 24 | 37:00 | 2.5 | Nobody typed in the rules: it was grown | kept `grownSlide` (light trim) | TURN TO A NEIGHBOR |
| 25 | 39:30 | 1.5 | Five things to carry into Part 2 | modified `recapSlide` | HANDS UP (callback) |

The Part 1 content totals **37.0 min**. No stretch goes more than about 3 minutes without a beat.

**Why this order.** William asked to begin with the network and the three kinds of learning; both come first.

- The three kinds come first because they say where the "mistake" comes from (the back of the flash card). The dials,
  the slope and the blame then run together without a break.
- Left-to-right text and denoised images are both games where the data is its own answer key (self-supervised). That
  leads straight into LeCun's 2019 cake ("self-supervised").
- The cake then becomes the chatbot's school year (lecture, worked examples, homework and exams).
- Chips, Nvidia and the scaling laws explain why labs build bigger runs. The gigawatt slide sets up the Part 2
  data-center map.

### Slide-by-slide specs

**5 · Machine learning: the computer finds the rules** — modified `mlSlide`, 1.5 min
- Visual: keep the two flows (classic software vs machine learning) and the nested AI ⟶ ML ⟶ deep-learning boxes. Shorten
  the nested boxes to names plus 4 words each. Replace the spam-filter card with a framed ImageNet "Lion" photo (crop of
  `assets/research/splash/imagenet-ilsvrc-fig1-labelled-categories.png`, photo only, no printed label) and the line
  "Write rules that spot a lion?" (20 pt).
- Clicks (3): the ML row → the nested boxes → the lion photo and hands-up.
- Beat: HANDS UP, "Name something you could NOT easily write rules for." (kept).
- Analogy: a recipe someone writes (rules) vs learning to cook by tasting (examples).
- Notes: the SAY keeps the spam-filter example spoken. TERMS: AI, machine learning, deep learning. TAKEAWAY: nobody
  types in the rules. ADVANCED: ImageNet had people label photos by hand.
- Sources: existing, plus ImageNet (Russakovsky et al. 2015, https://arxiv.org/abs/1409.0575; manifest item
  `imagenet-ilsvrc-fig1-labelled-categories`).

**6 · Supervised learning: flash cards with answers** — new `flashCardsSlide`, 1.0 min
- Visual:
  - Three big native flash cards: white `ROUNDED_RECTANGLE` 3.3 × 2.5 in at x = 0.9, 5.0 and 9.1, y = 1.75, rotated −4°,
    +2° and −2°. Each holds an ImageNet photo crop (Leopard, Strawberry, Airliner from the ImageNet figure; photo only)
    with a 0.15 in white margin.
  - Click 1, the "flip": an opaque back card (fill `FAFAF7`, 3 pt amber border, same size and rotation) zooms in on top
    of each front. It shows the word in 44 pt bold ink ("leopard", "strawberry", "airliner"), with a 12 pt caps label
    "BACK: THE ANSWER".
  - Click 2: a strip at y 4.8–5.7 with three icon steps and arrows: FaQuestion "Guess" → FaUndo "Flip and check" →
    FaSlidersH "Adjust the dials". Below it, one 20 pt line: "Every example comes with its answer: a label."
- Clicks: 2.
- Beat: GUESS FIRST chip at top right, "What's on the back?" The room calls out before click 1.
- Analogy: **flash cards** (William's).
- Notes: SAY: "Supervised learning is studying with flash cards. Picture on the front, answer on the back. Guess, flip,
  fix." TERMS: supervised learning, label. TAKEAWAY: the answers come from people. ADVANCED: people labelled ImageNet's
  photos. BE HONEST: labels can be wrong or biased.
- Sources: Russakovsky et al. (2015), Fig. 1 (cropped), https://arxiv.org/abs/1409.0575. This replaces column 1 of
  `learningTypesSlide`.

**7 · Unsupervised: sort the cards, or make new ones** — new `unsupervisedSlide`, 1.25 min
- Visual, left half (x 0.6–6.4):
  - Nine one-sided cards (white, 1.6 × 1.2 in, photos from the ImageNet figure: leopard, lion, monkey, strawberry,
    orange, mushroom, airliner, minivan and canoe), scattered with rotations within ±8°. Header (12 pt caps): "NO ANSWERS
    ON THE BACK".
  - Click 1, "sort": an opaque cover panel (`HEX.bg`, the same region) fades in. Three neat piles then rise (3 stacked
    cards each, offset 0.08 in), labelled only "pile 1", "pile 2", "pile 3" (14 pt). Caption (18 pt): "It finds the
    groups. Nobody named them."
  - Optional, only if it reads by eye: a 1.5 in inset of `assets/slides/splash/kmeans_sorted_first.gif` with the
    caption "the same idea, on dots".
- Visual, right half (x 6.9–12.7), click 2, "make new":
  - One bigger new card (white, 4.2 × 3.2 in, rotated +3°, an amber FaMagic sparkle at the corner) holding the
    40-step panel cropped from the Commons DDIM plot (`ml/diffusion-ddim-steps-castle.png`, see Assets).
  - Caption (18 pt): "…or learn to make a new card nobody printed."
  - Fallback if the DDIM file is not on disk: `assets/research/splash/unsup-google-cat-neuron-image.png`, with the
    caption worded exactly as Google's 2012 blog describes it.
- Clicks: 2.
- Beat: HANDS UP chip, "Sort these: by kind, or by color?" Take hands for each. The point: there is no single right
  answer.
- Analogy: **one-sided flash cards**. Sort them into piles (clustering), or learn to draw new cards (generating).
- Notes: TERMS: unsupervised learning, clustering, generative. TAKEAWAY: patterns with no answer key. BE HONEST:
  today's image generators are trained with a "remove the static" game (slide 14), which researchers call
  self-supervised. "Unsupervised" is the broad family.
- Sources: ImageNet (as above); k-means GIF by Chire, CC BY-SA 4.0 (cropped, frame order changed); castle image by
  Benlisquare, CC BY-SA 4.0, Stable Diffusion v1-5 output,
  https://commons.wikimedia.org/wiki/File:X-Y_plot_of_algorithmically-generated_AI_art_of_European-style_castle_in_Japan_demonstrating_DDIM_diffusion_steps.png

**8 · Reinforcement learning: treats for good tries** — new `rlDogSlide`, 1.0 min
- Visual:
  - Left: the photo `ml/dog-with-treat.jpg` (Commons "Dog with treat.jpg", pbump, CC BY-SA 2.0), framed with
    `d.frame`, about 5.6 × 4.2 in at x 0.6, y 1.65. Fallback: a large FaDog icon with FaBone.
  - Right: a native loop of three `iconDisc`s (1.3 in) on a triangle centred at (9.7, 3.4) with radius 1.4, joined by
    arrows: FaRedo "Try something" → FaBone "Treat… or not" → FaThumbsUp "Do more of what earned treats".
  - Click 2: a strip at y 5.4–6.4 with the 18 pt line "For an AI, the treat is a number: points." and a 2.2 in thumbnail
    of `assets/slides/splash/hideseek_ab.png` captioned "OpenAI hide-and-seek (2019): forts, learned from points alone".
- Clicks: 2.
- Beat: spoken only, "Who has taught a pet a trick?"
- Analogy: **training your dog with treats** (William's).
- Notes: TERMS: reinforcement learning, reward. TAKEAWAY: a reward says how good, not what to do. ADVANCED: rewards
  are rare and carry little information, which sets up the cherry on slide 15. BE HONEST: a reward can be gamed
  (Part 3's boat).
- Sources: pbump, CC BY-SA 2.0, https://commons.wikimedia.org/wiki/File:Dog_with_treat.jpg ; Baker et al. 2019,
  https://arxiv.org/abs/1909.07528

**9 · Quiz: which kind of learning is this?** — modified `quizSlide`, 1.5 min
- Visual: a three-finger key (1 Supervised, 2 Unsupervised, 3 Reinforcement), each with a mini icon of its picture
  (card, piles, dog). Keep four scenario cards:
  - A: flash cards and an answer key → supervised;
  - B: sorts unlabeled photos → unsupervised;
  - C: game bot earns points → RL;
  - D (new): "learns to draw new faces from a pile of photos with no names" → unsupervised, making new cards.
- The 4th finger (self-supervised) goes: it is introduced on slides 13–15. Answer chips must not use "=" (write
  "SUPERVISED: the answer key is the labels").
- Clicks: 4 (one answer each).
- Beat: QUIZ, fingers.
- Analogy: all three pictures together.
- Notes: keep the existing format and update the CLICKS line.
- Sources: none needed (made-up scenarios, labelled as such).

**10 · A neural network is a stack of dials** — modified `networkSlide`, 2.0 min
- Visual:
  - Keep the native network and the CIFAR cat input. Remove the definitions box (neuron, weight, layer, parameters,
    open/closed) and move those terms to the notes.
  - Click 1: the layers light up left to right (staggered fades of red-tinted nodes), then "cat" lights.
  - Click 2: a mixing-console photo (`ml/mixing-console-faders.jpg`, Dejan Krsmanovic, CC BY 2.0) framed at the top
    right (x 8.4–12.7, h about 2.6), captioned "Each line is a dial (a weight)."
  - Click 3: a "HOW MANY DIALS?" stack with three rows: 13,002 (a digit reader), 175 billion (GPT-3, 2020) and
    1.04 trillion (Kimi K2.5, 2026). Under it, a 12 pt footnote: "closed models: no count published".
- Clicks: 3.
- Beat: spoken only, "A mixing board with a trillion knobs: could you set them by hand?"
- Analogy: **a mixing board**.
- Notes: TERMS: neuron, weight (dial), layer, parameters, open vs closed model (Part 4 uses "open"). ADVANCED, in words
  only: "each unit adds up its inputs, each multiplied by a dial, then squashes the result". Drop the 13,002
  arithmetic.
- Sources: existing, plus Krsmanovic, CC BY 2.0,
  https://commons.wikimedia.org/wiki/File:Modern_Mixing_Console_(32961446438).jpg

**11 · Training feels the slope, then steps downhill** — modified `gradientSlide`, 2.0 min
- Visual:
  - Keep the native hiker-in-fog valley (left) and the public-domain contour inset `gd_zoom.png`.
  - **New (click 1):** a "compass rose" of 8 short arrows at the hiker's feet, all steel except the downhill one in
    red, with the label "the slope, in every direction at once".
  - Replace the four definition cards on the right with three picture cards of 6 words or fewer, shown on clicks 2–3:
    - FaBullseye "How wrong? (the loss)";
    - FaCompass "Slope in every direction: which way is down?";
    - FaShoePrints "Small step downhill. Repeat."
  - **Delete from the slide:** "Gradient | for each dial, the uphill direction. We step the opposite way.", "Training
    (gradient descent)", "Learning rate", and the "=" in the old title.
- Clicks: 3.
- Beat: HANDS UP, "Steps way too big: what goes wrong?" (kept).
- Analogy: **a hiker in thick fog** who can only feel the ground under their feet.
- Notes:
  - SAY uses William's sentence, quoted in section 0. It says "gradient" once as the name of that slope (William's
    choice whether to say it) and never "descent", "derivative" or "local minimum".
  - ADVANCED, in words only: "with a trillion dials, the hill has a trillion directions".
  - BE HONEST: the real landscape is bumpy, and you can get stuck.
- Sources: existing (Commons "Gradient descent.png", public domain).

**12 · Backpropagation sends the blame backwards** — modified `backpropSlide`, 1.5 min
- Visual:
  - Keep the factory line, and animate the blame: click 1, the inspector stamps "Defect!" (`slam`).
  - Click 2: red blame arrows wipe right to left (`wipeLeft`) station 3 → 2 → 1, with native blame bars under each
    station, labelled "a lot", "some" and "a little" (no numbers).
  - Click 3: the lower network's red arrows sweep back layer by layer (staggered).
  - Replace the paragraph with one 18 pt line: "One backward sweep tells every dial which way to turn." Keep the 1986
    Nature line.
- Clicks: 3.
- Beat: HANDS UP, "Why not test each dial one at a time?" (kept).
- Analogy: **a factory line passing the blame back**.
- Notes: remove "gradient descent" from the SAY. ADVANCED: replace "chain rule … derivative of the loss" with "if
  asked: it is a rule from calculus for passing blame through a chain of steps".
- Sources: Rumelhart, Hinton & Williams, Nature (1986) (existing).

**13 · Text AI writes left to right, a word at a time** — modified `nextWordSlide`, 1.75 min
- Visual:
  - Replace the four numbered steps on the right with a full-width **left-to-right row** of word boxes (Arial bold
    28 pt, card fill, 1.5 × 0.8 in each) at y 1.75: "The", then "cat", "sat", "on" and "the" appear on clicks 1–2
    (`wipeLeft`). A long arrow under the row reads "LEFT TO RIGHT: each word is guessed from all the words before it".
  - Keep the five-bar "next-word scores" chart (made-up example, labelled as such) under the row.
  - Click 3: the red "mat" bar `zoom`s into a sixth box at the end of the row.
  - Keep the token chips (un / believ / able) small at the bottom right.
  - Add a teal tag (14 pt): "The text is its own answer key: self-supervised". This sets up slide 15.
- Clicks: 3.
- Beat: HANDS UP, "The cat sat on the ___: mat, moon or pizza?" (kept; asked before click 3).
- Analogy: **autocomplete on your phone, scaled up enormously**.
- Notes: TERMS: LLM (defined here; the divider's note must point to slide 13), token, autoregressive (said once, glossed
  as "left to right"), self-supervised.
- Sources: existing.

**14 · Image AI starts from static and cleans it up** — new `diffusionSlide`, 1.5 min
- Visual:
  - Five panels (2.3 in wide, height from the crop, at x = 0.6 + i × 2.47, y 1.75), cropped (crop only) from the Commons
    DDIM X-Y plot at **1, 3, 8, 20 and 40 steps**, labelled under each "1 step", "3 steps", … "40 steps" (14 pt).
  - The first panel is visible at the start; click 1 shows panels 2–3, and click 2 shows panels 4–5 (`fade`, staggered
    150 ms).
  - Click 2 also shows a long arrow at y about 3.75: "static → picture: clean up a little, again and again" (20 pt).
  - Click 3: two comparison cards at y 4.3–5.6:
    - "TEXT: left to right" with a mini row of 4 word boxes;
    - "IMAGES: from static, cleaned up" with a mini noise square → mini castle.
  - Under the cards, one 14 pt line: "Usually, not always: some text AIs use diffusion, and some image AIs go left to
    right."
- Clicks: 3.
- Beat: GUESS FIRST, "When does the castle appear?" (call out a step number).
- Analogy: **wiping fog off a window, a little each pass**, or **a sculptor removing what isn't the statue**.
- Notes:
  - BE HONEST: **each panel is a separate run made with that many clean-up steps, not frames of one run.** Say it that
    way.
  - Gemini Diffusion is a text diffusion research model (Google, May 20, 2025). OpenAI's card says "4o image
    generation is an autoregressive model natively embedded within ChatGPT" (Mar 25, 2025). Transfusion mixes the two
    (Aug 2024). Inception's Mercury and its "up to 10x faster" are vendor claims, so leave them out or label them.
  - ADVANCED: the training game adds static to real photos and learns to undo it (the Commons rhino figure,
    MrAlanKoh, CC BY-SA 4.0, as a link in the notes; it is not on the slide).
- Sources:
  - DDIM plot: Benlisquare, CC BY-SA 4.0, URL above;
  - https://blog.google/innovation-and-ai/models-and-research/google-deepmind/gemini-diffusion/
  - https://cdn.openai.com/11998be9-5319-4302-bfbf-1167e093f1fb/Native_Image_Generation_System_Card.pdf
  - https://arxiv.org/abs/2408.11039
- Fallback if the DDIM plot cannot be fetched: native noise squares (sharp-generated) fading to a photo the deck already
  holds, with the label **"Illustration, not a real model run"** on the slide.

**15 · LeCun's cake: the data itself teaches most** — new `cakeSlide`, 2.0 min
- Visual (native cake on the left):
  - plate: oval x 0.9, y 5.55, w 5.4, h 0.4, fill `2A303B`;
  - sponge: rounded rectangle x 1.2, y 3.35, w 4.8, h 2.3, fill `7A4A24`, with two 0.08 in cream stripes at y 4.1 and
    4.85;
  - icing: rounded rectangle x 1.1, y 3.0, w 5.0, h 0.45, fill `F3E3C3`, with five small drip ovals on its lower edge;
  - cherry: oval x 3.35, y 2.35, 0.55 in, fill `E5383B`, with a teal stem line from (3.65, 2.38) to (3.95, 1.95), 3 pt.
- Three label rows at x 6.4–12.7, aligned to the layers, appear one per click (clicks 1–3, sponge first). Each row has
  a coloured chip, a big plain word and a small italic quote of LeCun's words (14 pt):
  - **SELF-SUPERVISED** (the data is its own answer key), "THE MOST", *"Millions of bits per sample"*;
  - **SUPERVISED** (flash cards), "SOME", *"10→10,000 bits per sample"*;
  - **REINFORCEMENT** (treats), "A LITTLE", *"A few bits for some samples"*.
- Click 4, "proof": the real slide `assets/research/splash/lecun-cake-isscc2019-slide.png` `zoom`s in as a large framed
  overlay (x 2.4, y 1.55, w 8.5), captioned "Yann LeCun's own slide, ISSCC 2019 (slide 59)".
- Clicks: 4.
- Beat: HANDS UP chip, **"Which layer teaches the AI the most: cake, icing or cherry?"** Take hands before click 1.
- Analogy: **a cake**. Most of it is sponge, there is a little icing, and one cherry.
- Notes:
  - SAY: in 2016 LeCun called the sponge "unsupervised" and in 2019 he renamed it "self-supervised". He joked that the
    picture is "slightly offensive to RL folks" (2016 footnote, read from the slide).
  - BE HONEST: his point was **how much information each example gives**. It was not about training stages and it
    says nothing about chatbots; the proportions are not exact.
  - ADVANCED: RL researchers answered with a cake covered in cherries (Synced).
- Sources: Y. LeCun, ISSCC 2019 keynote, slide 59 (© IEEE ISSCC), via Synced, Feb 22, 2019,
  https://syncedreview.com/2019/02/22/yann-lecun-cake-analogy-2-0/ ; NIPS 2016 "Predictive Learning",
  https://nips.cc/virtual/2016/invited-talk/6197. The image is a credited quotation, not openly licensed.

**16 · Making a chatbot: lecture, examples, homework** — new `schoolSlide` (replaces `pipelineSlide`; reuse its bracket
code), 2.5 min
- Visual:
  - Three big stage cards: w 3.85, h 2.9, at x = 0.6, 4.75 and 8.9, y 1.65, with chevrons between them. Each has:
    - an icon disc (0.9 in);
    - the school word in 24 pt bold;
    - the ML term in 16 pt muted;
    - 8 words or fewer in 18 pt;
    - a 0.6 in cake-layer swatch at the bottom right (sponge, icing, cherry), which ties the slide to slide 15.
  - The three cards:
    1. FaChalkboardTeacher **LECTURE**, "Pretraining", "Read a huge library. Guess the next word.";
    2. FaPencilAlt **WORKED EXAMPLES**, "SFT (supervised fine-tuning)", "Copy good answers people wrote.";
    3. FaClipboardCheck **HOMEWORK & EXAMS**, "RL (reinforcement learning)", "Try, get graded, try again."
  - Brackets at y 4.7: "PRETRAINING" under card 1 (steel line) and "POST-TRAINING" under cards 2–3 (amber line).
  - Click 4: a full-width red-outlined row at y 5.2–6.4 with FaShieldAlt, "Before release: a final exam (safety tests).
    It grades the model but doesn't teach it.", and the TURN TO A NEIGHBOR question beside it.
- Clicks: 4 (cards 1, 2 and 3 with their brackets, then the exam row).
- Beat: TURN TO A NEIGHBOR (30 s), **"At which step would you test for dangerous behavior? Why?"** (moved from old
  slide 16).
- Analogy: **pretraining is the lecture; SFT is the worked examples in class; RL is the homework and exams**
  (William's).
- Notes:
  - TERMS: frontier model (defined here, as before on old slide 16; the divider's note must point to slide 16),
    pretraining, post-training, SFT, RL.
  - SAY: the cake maps onto the school year. Cake = lecture (most of the learning), icing = worked examples, cherry =
    homework. These "=" signs are fine in spoken notes; they never go on the slide.
  - BE HONEST: the cake-to-chatbot mapping is the community's adaptation (N. Lambert, RLHF Book lecture 5), not
    LeCun's. Labs rarely publish full recipes.
- Sources: Ouyang et al. (2022), InstructGPT Fig. 2, https://arxiv.org/abs/2203.02155 ; Lambert,
  https://rlhfbook.com/teach/course/lec5-chap7/

**17 · Pretraining: read a huge library, then guess** — modified `pretrainSlide`, 1.75 min
- Visual:
  - Add an amber "LECTURE" tag at the top left of the content.
  - Keep the 4-box loop (hide, guess, check, nudge), the "15 trillion+" card, the "about 90,000 years" guess card and the
    token bar chart.
  - **Delete** the line "nudge = gradient descent + backpropagation".
  - Write "≈36T" as "about 36T" and "≈ 90,000 years" as "about 90,000 years".
  - Replace the GPU card with one line: "Thousands of chips, for months (slide 20)".
- Clicks: keep the current count and update the CLICKS line.
- Beat: GUESS FIRST, "Reading 24 hours a day, how many years?" (kept).
- Analogy: **the lecture**, which is most of the course.
- Notes: move the arithmetic chain out of ADVANCED. Keep "our arithmetic from Meta's token count and an average reading
  speed" plus the sources.
- Sources: existing.

**18 · Worked examples turn it into an assistant** — modified `baseModelSlide`, 1.75 min (takes the SFT idea from
`postTrainSlide`)
- Visual:
  - Add a blue "WORKED EXAMPLES" tag. Keep the paper-plane prompt and the BASE MODEL output on the left (labelled "after
    the lecture only").
  - Click 1: a middle "worked example" card with FaUserEdit, "People write thousands of model answers", from InstructGPT
    step 1.
  - Click 2: the ASSISTANT output.
  - Optional click 3, kept only if the slide is not crowded by eye: the real InstructGPT Fig. 47 "serendipity" pair as
    two short quote chips. Otherwise put it in the notes.
- Clicks: 2 (3 with the optional click).
- Beat: THINK ABOUT IT, "Why would a model trained on the internet reply with more questions?" (kept).
- Analogy: **worked examples in class**: watch the teacher solve one, then copy the method.
- Notes: TERMS: base model, assistant, SFT. Keep "made-up example; not a real model's output".
- Sources: Ouyang et al. (2022) Fig. 47 (existing).

**19 · RL is homework: try, get graded, try again** — new `rlHomeworkSlide` (merges `postTrainSlide` + `rewardsSlide`),
2.0 min
- Visual:
  - Add a red "HOMEWORK & EXAMS" tag. Two grader panels side by side at y 1.65–4.6:
    - **Left, "Grader 1: people's votes"**: the sky question with answers A and B, from `postTrainSlide`. Click 1
      reveals "Raters compare answers; a scoring model learns what they prefer".
    - **Right, "Grader 2: a checker program"**: click 2 shows "Math and code: a right answer earns the reward" and a big
      stat "15.6% → 71%", captioned "DeepSeek-R1-Zero, a hard math contest (AIME 2024), before vs after practice". The
      arrow here is "before → after", not arithmetic.
  - Click 3, the strip **"The cherry is growing"** at y 4.8–6.4: two mini native cakes, one with a small cherry and one
    with a big cherry, each with one 16 pt fact:
    - "2024: DeepSeek-V3 used about 0.2% of its chip time after pretraining (our division of its report)";
    - "2025: xAI says it ran RL 'at pretraining scale' for Grok 4 (company claim)".
- Clicks: 3.
- Beat: HANDS UP, "A or B?" (kept from `postTrainSlide`). Spoken follow-up: "Name a task a computer can't easily check."
- Analogy: **homework and exams**: graded practice changes what you know, and the grade is the treat (ties to slide 8).
- Notes:
  - SAY includes Karpathy's view (Dec 19, 2025) that RL "gobbled up the compute that was originally intended for
    pretraining", labelled as an expert's view.
  - BE HONEST: the SemiAnalysis "about half of Anthropic and OpenAI compute is post-training/RL" figure is an analyst
    estimate seen only through OfficeChai (Oct 18, 2026). Notes only, not the slide.
  - ADVANCED: Claude's constitution (Anthropic, Jan 2026) and Constitutional AI move here from `rewardsSlide`. Cite R1
    **arXiv v1** (later versions differ).
- Sources:
  - https://arxiv.org/abs/2203.02155
  - https://arxiv.org/abs/2501.12948 (v1)
  - https://arxiv.org/abs/2412.19437
  - https://x.ai/news/grok-4
  - https://karpathy.bearblog.dev/year-in-review-2025/
  - https://arxiv.org/abs/2510.13786 (R1-Zero RL = 3.75% of pretraining)

**20 · A GPU does thousands of simple sums at once** — new `gpuSlide`, 2.5 min
- Visual, left half:
  - the CPU photo `ml/cpu-ryzen-9-9950x.jpg` (4300streetcar, CC BY 4.0), 2.2 in square at (0.9, 1.7);
  - beside it, a 4 × 4 grid of 16 amber squares (0.45 in, gap 0.08) at (3.4, 1.75);
  - label: "CPU: 16 cores" (24 pt bold) and "a few strong workers" (16 pt).
- Visual, right half, which starts as the GUESS FIRST poll: "How many cores in one AI chip (a GPU)? A 16 · B 1,600 ·
  C 16,000".
- Click 1: an opaque card covering the right half fades in. It carries:
  - the H100 photo `ml/nvidia-h100-geekerwan-011.png` (Geekerwan, CC BY 3.0), about 3.0 in wide. **View the frame by eye
    first**; if 011 is poor, pick a sibling frame (002–024);
  - a **dot field** the same size as the CPU grid: E1 generates `assets/slides/splash/gpu_dots_16896.png` from an SVG
    of 132 columns × 128 rows = 16,896 dots (H100 SXM5: 132 SMs × 128 cores), 1,600 px square;
  - the label "GPU (NVIDIA H100): 16,896 cores, thousands of simple workers", with a check on C.
- Click 2: a paintball strip at y 4.9–5.9:
  - left: one barrel icon and a dotted smiley, "one barrel, one dot at a time";
  - right: a grid of barrels, "1,100 barrels at once: the Mona Lisa. NVIDIA says: 80 milliseconds".
- Click 3: a 16 pt line, "Training is billions of tiny sums, so the stadium of workers wins. (Each GPU core is much
  simpler than a CPU core.)"
- Clicks: 3.
- Beat: GUESS FIRST (A/B/C).
- Analogy: **a few professors vs a stadium of students doing simple sums at once**; the **MythBusters paintball**
  demo (NVISION 2008).
- Notes:
  - The video is OPTIONAL: three third-party re-uploads (ZrJeYFxpUyQ, fKK933KK6Gg, WmW6SD-EHVY), none on NVIDIA's own
    channel. Their running time is unknown, so William must time them himself before adding one; if he shows a clip,
    it comes out of the 2.5 min.
  - "About a thousand times as many cores" is our division.
  - BE HONEST: more cores does not mean "1,000 times faster" at everything.
- Sources:
  - https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-9-9950x.html
  - https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/
  - https://www.bit-tech.net/news/mythbusters-finish-nvision-in-style/1
  - https://www.nvidia.com/content/nvision2008/
  - photos: https://commons.wikimedia.org/wiki/File:AMD_Ryzen_9_9950X.jpg and the Geekerwan file page

**21 · Why Nvidia is so hard to beat in AI chips** — new `nvidiaSlide`, 2.0 min
- Visual:
  - Left: the framed headline `ml/hl-entrepreneur-nvidia-5t.png` (real screenshot), x 0.6, y 1.6, w 6.0, shown
    automatically.
  - Below it at y 4.3, the beat line.
  - Right (x 7.0–12.7): three "moat" tiles, h 1.15, at y 1.6, 2.9 and 4.2, one per click (clicks 1–3):
    1. FaMicrochip "Fast chips": "Data Center sales: $75.2 billion in one quarter (to Apr 2026), company-reported";
    2. FaCode "CUDA software, since 2006–07": "NVIDIA says 6 million developers use it";
    3. FaNetworkWired "The wiring between chips": "Bought Mellanox (networking), $7 billion, 2020".
  - Click 4: a rivals strip at y 5.5–6.4 with four text chips (Google TPU · Amazon Trainium · AMD · Huawei Ascend; no
    logos) and one 16 pt line: "Anthropic plans up to 1 million Google TPUs; OpenAI signed for 6 GW of AMD chips."
- Clicks: 4.
- Beat: HANDS UP, **"All your class's apps run on one brand. A cheaper brand appears. Do you switch?"**
- Analogy: CUDA as **the apps that only run on one brand** (lock-in).
- Notes:
  - SAY: "People call it an effective monopoly: not illegal, but hard to compete with." The share estimates (about 75–90%
    of AI-chip revenue) are secondary and differ by what is counted; do not state one number. "Effective monopoly" is
    about share, software and wiring, not law.
  - CHECK ON NOV 21: a live market value (NVIDIA reports around Nov 18); otherwise keep the verified Oct 29, 2025
    milestone.
- Sources:
  - https://www.entrepreneur.com/business-news/nvidia-becomes-the-first-to-pass-5-trillion-in-market-value/498929
  - https://www.sec.gov/Archives/edgar/data/0001045810/000104581026000051/q1fy27pr.htm
  - https://forums.developer.nvidia.com/t/cuda-is-nvidia-s-platform-for-accelerated-computing-and-the-foundation-for-gpu-computing/363954
  - https://nvidianews.nvidia.com/news/nvidia-completes-acquisition-of-mellanox-creating-major-force-driving-next-gen-data-centers
  - https://www.anthropic.com/news/expanding-our-use-of-google-cloud-tpus-and-services
  - https://www.amd.com/en/newsroom/press-releases/2025-10-6-amd-and-openai-announce-strategic-partnership-to-d.html
  - https://aws.amazon.com/ai/machine-learning/trainium/
  - https://www.huawei.com/en/news/2025/9/hc-xu-keynote-speech

**22 · Scaling laws: bigger runs, fewer mistakes** — modified `scalingSlide`, absorbs `ingredientsSlide`, 2.0 min
- Visual:
  - Keep the redrawn Kaplan line (left, about 7.4 in). **Remove** the tick labels "1×…1B×", "k/M/B", "log scale" and the
    "Each 10× more compute → about 11% lower loss" box.
  - Axis titles in words: y "mistakes on new text (lower is better)"; x "training compute (each tick: 10 times more)".
  - Right column, click 1: three ingredient tiles from `ingredientsSlide`: Data "the ingredients", Compute "the oven
    time", Method "the recipe", under the heading "Turn all three up together".
  - Click 2: the "What it doesn't say" card ("which new skills appear, or when").
  - Drop the Epoch log-axis compute chart from Part 1. Its "about 5 times more each year" can be one spoken line,
    sourced in the notes.
- Clicks: 2.
- Beat: THINK ABOUT IT, **"If more compute keeps cutting mistakes, what would you do if you ran an AI lab?"** (replaces
  the 11% question).
- Analogy: **practice makes progress**: each doubling of practice still helps, predictably.
- Notes: TERMS: loss (said once, as "the mistake score"), compute. BE HONEST: steady on this measure does not mean
  steady in skills. Kaplan's own words: loss falls "smoothly and predictably" (manifest item `kaplan-fig1-scaling-laws`).
- Sources: Kaplan et al. 2020, https://arxiv.org/abs/2001.08361 ; Hoffmann et al. 2022, https://arxiv.org/abs/2203.15556

**23 · How big is a gigawatt?** — modified `gigawattSlide`, 1.5 min
- Visual: **delete** the box "A watt measures power… Energy = power × time…". Change "≈" to "about". Keep the homes, the
  reactor, the Hoover Dam photo and the Abilene 1.2 GW bar. Add one 16 pt line: "Towns and states are starting to push
  back (Part 2)."
- Clicks: keep the current count and update the CLICKS line.
- Beat: GUESS FIRST, "How many homes can one gigawatt run?" (kept).
- Analogy: a gigawatt is about one nuclear reactor running nonstop.
- Notes: the PC Gamer "100,000 Nvidia GPUs" headline and the GPT-6 Astra energy estimate move to the notes as an
  ADVANCED aside, from the retired `trainingEnergySlide`.
- Sources: existing.

**24 · Nobody typed in the rules: it was grown** — kept `grownSlide`, 2.5 min. Trim the lower-left paragraph to 2 lines.
In the SAY, refer back to the dials (slide 10) and to the cake. Beat: TURN TO A NEIGHBOR (kept). Sources: existing.

**25 · Five things to carry into Part 2** — modified `recapSlide`, 1.5 min
- Visual: five rows (one click each, as now), each with a mini visual and 10 words or fewer:
  1. card / piles / dog icons: "AI learns from answers, patterns or treats.";
  2. dial + down arrow: "A network of dials, nudged downhill, blame passed back.";
  3. word boxes + noise square: "Text: left to right. Images: static, cleaned up.";
  4. cake: "Lecture, then worked examples, then homework.";
  5. chip + seedling: "Thousands of chips, bigger runs, a mind we grew."
- Beat: HANDS UP callback, "Back to question 2: does it understand what it says? What would count as evidence?"
- Notes: drop "gradient descent does the nudging".

### Opening (E1, in `slides_splash_ml.js`)

- `roadmapSlide`:
  - Part 1 "37 minutes · now", Part 2 "21 minutes", Part 3 "29 minutes", Part 4 "12 minutes + 7 Q&A";
  - Part 2's line becomes "Tests, trends, money and data centers".
- The title and hook stay as they are (4.0 min in all).
- Header comment: "OPENING (3 slides, 4 min) + PART 1 (21 slides, 37 min) = 41 min".

### Divider (E1, `tools/build_splash.js`, the `openingAndPart1` say line)

"Let's start. Part 1, 37 minutes: how today's AI actually learns. … The terms LLM and frontier model are defined where
they first come up, on slides 13 and 16." Also update the file's header comment to the new minutes: Opening + Part 1 41,
Part 2 21, Part 3 29, Part 4 12, Q&A 7.

### Assets E1 must fetch (Commons answered with a normal 302 at plan time, not a 429)

| Manifest id | Save as | License / credit line | Used on |
|---|---|---|---|
| `ml-diffusion-ddim-steps` | `ml/diffusion-ddim-steps-castle.png` | Benlisquare, CC BY-SA 4.0 | 7, 14 (most important) |
| `ml-dog-treat` | `ml/dog-with-treat.jpg` | pbump, CC BY-SA 2.0 | 8 |
| `ml-mixing-console` | `ml/mixing-console-faders.jpg` | Dejan Krsmanovic, CC BY 2.0 | 10 |
| `ml-gpu-h100-geekerwan` | `ml/nvidia-h100-geekerwan-011.png` | Geekerwan (极客湾), CC BY 3.0 | 20 |
| `ml-diffusion-forward-noise` | `ml/diffusion-forward-noise-rhino.png` | MrAlanKoh, CC BY-SA 4.0 | 14 notes only (optional) |

- How to fetch: one file at a time, at least 30 s apart, with an honest User-Agent, from
  `https://commons.wikimedia.org/wiki/Special:FilePath/<File name>?width=2000`.
  1. Save into a new empty folder: `…/scratchpad/splash-nov/e1/dl-commons/`.
  2. **View each file by eye**, then copy it into `assets/research/splash_nov/ml/`.
  3. Set `verified: true` and `file` on its manifest entry.
- Derived crops go in `assets/slides/splash/`, added to `CROPS`:
  - the ImageNet photo crops (lion, leopard, strawberry, airliner, monkey, orange, mushroom, minivan, canoe);
  - the five DDIM panels;
  - `gpu_dots_16896.png`.

---

## 2. Run of show (110 min, 59 slides)

| # | Clock | Min | Part | Title | Beat | Status |
|---|---|---|---|---|---|---|
| 1 | 0:00 | 0.5 | Opening | AI Alignment and Safety | | kept |
| 2 | 0:30 | 2.0 | Opening | Hands up: who has used an AI this week? | HANDS UP ×2 | kept |
| 3 | 2:30 | 1.5 | Opening | Learn how it works, then what could go wrong | | minutes updated |
| 4–25 | 4:00–41:00 | 37.0 | Part 1 | (table in section 1) | | |
| 26 | 41:00 | 0.5 | Part 2 | *Divider:* How fast is AI moving? | | say: "21 minutes" |
| 27 | 41:30 | 1.5 | Part 2 | Anthropic + OpenAI: typical launch gap ~11 days | GUESS | old 25 |
| 28 | 43:00 | 3.0 | Part 2 | Task length doubled every ~4 months since 2023 | PAIR | old 26 (now also says the ruler ran out) |
| 29 | 46:00 | 2.0 | Part 2 | Hard AI tests were beaten in 1½ to 3½ years | HANDS | old 28 |
| 30 | 48:00 | 1.5 | Part 2 | The "last exam" for AI went from 7% to 61% | | old 29 |
| 31 | 49:30 | 1.5 | Part 2 | This is not a photograph, says its maker | POLL | old 30 |
| 32 | 51:00 | 2.5 | Part 2 | Which one is real? | VOTE | old 31 |
| 33 | 53:30 | 1.5 | Part 2 | Top 2 video AIs fool people about half the time | HANDS | old 32 |
| 34 | 55:00 | 1.5 | Part 2 | OpenAI's famous-math claim is still disputed | HANDS | old 34 |
| 35 | 56:30 | 2.5 | Part 2 | Figure says pretraining raised success to 56% | PAIR | old 35 |
| 36 | 59:00 | 1.5 | Part 2 | **Data-center pauses are spreading, town by town** | GUESS FIRST | **new** |
| 37 | 60:30 | 1.5 | Part 2 | **AI stocks are swinging hard** | HANDS UP 15 s | **new** |
| 38 | 62:00 | 0.5 | Part 3 | *Divider:* Why could it go wrong? | | say: "29 minutes" |
| 39 | 62:30 | 2.5 | Part 3 | How worried should we be? Vote first | POLL | old 37, never cut |
| 40 | 65:00 | 2.0 | Part 3 | Being smart does not mean sharing our goals | HANDS | old 38 |
| 41 | 67:00 | 3.0 | Part 3 | What would you need besides studying? | PAIR | old 39 |
| 42 | 70:00 | 3.0 | Part 3 | What did this game AI learn? | GUESS | old 40 |
| 43 | 73:00 | 2.0 | Part 3 | AI systems find loopholes too | PAIR | old 41 |
| 44 | 75:00 | 2.0 | Part 3 | Some AI thinks in ways we cannot easily read | THINK | old 42 |
| 45 | 77:00 | 2.0 | Part 3 | OpenAI says it now has an AI research intern | HANDS | old 44 (SAY opens with the loop) |
| 46 | 79:00 | 1.5 | Part 3 | OpenAI says its AI broke out of a sealed test | | old 45 (defines "agent") |
| 47 | 80:30 | 2.5 | Part 3 | AIs in a test found a hidden message board | PAIR | old 46 (says HOLD/VETO/STOP) |
| 48 | 83:00 | 2.0 | Part 3 | **AI helped find an old bug; attackers came fast** | spoken | **new** |
| 49 | 85:00 | 1.5 | Part 3 | Dodging shutdown shows up across tests | GUESS | old 48 |
| 50 | 86:30 | 2.0 | Part 3 | Big counts are hard to compare | HANDS | old 49 |
| 51 | 88:30 | 1.0 | Part 3 | Same question: has your answer changed? | RE-POLL | old 50, never cut |
| 52 | 89:30 | 1.5 | Part 3 | Even the AI lab CEOs signed this sentence | | old 51, never cut |
| 53 | 91:00 | 0.5 | Part 4 | *Divider:* What can we do about it? | | say: "then 7 for questions", "slide 57" |
| 54 | 91:30 | 3.5 | Part 4 | Five approaches, and none is solved yet | GUESS | old 53, never cut |
| 55 | 95:00 | 1.5 | Part 4 | Some labs limit who gets the riskiest tools | HANDS | old 54 |
| 56 | 96:30 | 2.5 | Part 4 | Could an AI feel pain? Nobody knows yet | PAIR | old 55 |
| 57 | 99:00 | 3.0 | Part 4 | There is real work here, and it needs people | POLL | old 56, never cut |
| 58 | 102:00 | 1.0 | Part 4 | This presentation was made by an AI. | HANDS | old 57 |
| 59 | 103:00 | 7.0 | Q&A | Questions, then one thing to do this week | open | old 58, 8 → 7 min |

The parts add up as follows:
- Opening: 4.0.
- Part 1: 37.0, which makes 41.0 with the Opening.
- Part 2: 0.5 + 20.5 = 21.0.
- Part 3: 0.5 + 28.5 = 29.0.
- Part 4: 0.5 + 10.5 + 1.0 = 12.0.
- Q&A: 7.0.

Total: **110.0**.

Cut from the build (the functions stay in `slides_splash_extra.js`; only `ORDER` changes):
- `p2MetrEvidence` (old 27);
- `p2Code` (old 33);
- `p3Explosion` (old 43);
- `p3RogueWords` (old 47).

### New "if you are running long" order (for SPLASH.md; hide slides, don't delete)

| Order | Slide | Saves | Note |
|---|---|---|---|
| 1 | 23 How big is a gigawatt? | 1.5 | On slide 36, say "one AI campus can use as much power as a nuclear reactor" |
| 2 | 30 The "last exam" | 1.5 | Slide 29 already shows the benchmarks being beaten |
| 3 | 55 Labs limit access | 1.5 | was #6 |
| 4 | 50 Big counts are hard to compare | 2.0 | cut it last: it is the honest-uncertainty counterweight before the re-vote |
| — | Q&A (59) | up to 1.0 | keep at least 6 minutes |

Never cut: 39, 51, 52, 54 and 57, plus the three news slides (36, 37 and 48) and the Part 1 topics William named.

SPLASH.md is owned by neither editor. The integration stage rewrites its run of show, cut order, never-cut numbers and
"what changed" from this plan and the generated `run_of_show.md`.

---

## 3. News-slide specs (E2, in `slides_splash_extra.js`)

### 3.1 · Slide 36 · Data-center pauses are spreading, town by town (`p2DcMap`, new, 1.5 min)
- **Visual:** `assets/slides/splash_extra/dc_moratoria_map.png` (its own legend), full width at about 11.6 × 6.5 in in
  the content area.
- **Click build:** E2 makes `tools/make_dc_map.js` also emit cumulative layer PNGs, stacked and faded in on clicks:
  - grey base;
  - + blue (local only);
  - + amber/teal (bills);
  - + red (the three statewide pauses).
  - Optional last click: a small Stateline headline inset (`dc/hl-stateline-cities.png`).
- **Beat:** GUESS FIRST, "How many states have paused data centers statewide? A 3 · B 13 · C 46". Answer: 3. Then: "46
  is a tracker's count of states with **any** restriction or bill."
- **Notes:**
  - TELL WILLIAM: do not say "moratoriums in 46 states". Say "a tracker counts 46 states with some restriction or bill;
    three states (NY, TX, OR) have a statewide pause, by governor order; local pauses are in dozens of states".
  - BE HONEST:
    - "moratorium" ranges from a permit pause to a grid audit to a local zoning ban;
    - the tracker is inconsistent;
    - Texas: governor-elect Hinojosa (won Nov 3) and an audit due in December;
    - Maine's legislature passed a moratorium and it was vetoed.
  - **Re-run the map around Nov 19** and keep the "as of" date on the image.
  - Link: AP tied the Nov 5 sell-off partly to fears of construction pauses, which leads into slide 37.
- **Sources:**
  - https://www.electricchoice.com/datacenters/moratoriums/
  - https://savrn.com/blog/data-center-moratorium-tracker-update-2026-09-28
  - SiliconANGLE (NY, Jul 14); Route Fifty / Texas Tribune (Aug 4); OPB (Oct 13); Stateline (May 28). Each URL is in
    the manifest `dc-*` entries.

### 3.2 · Slide 37 · AI stocks are swinging hard (`p2Economy`, new, 1.5 min)
- **Visual:** a native line chart of the Nasdaq Composite, Jul 1 to the latest close (`econ_series.json`), drawn from
  the data with a `wipeLeft` reveal.
  - Five dated markers, each with 4 words or fewer: Jul 29 down; Aug 4 record; Oct 30 "tech loses $1 trillion"; Nov 4
    rally; Nov 5 −5.5%.
  - A side stack of 3 real headline crops: Fortune Alphabet Oct 29, NBC Oct 30, Yahoo Nov 5 close.
  - Takeaway chip: "Investors keep asking: will all this spending pay off?"
- **Clicks (3):** line → markers and headlines → takeaway.
- **Beat:** HANDS UP 15 s, "Does a big stock drop prove AI is failing?" Answer: no, and a rise doesn't prove it is safe.
- **Notes:**
  - No investment advice.
  - The Nov 5 values are provisional (Yahoo close). **Re-pull FRED (SP500, NASDAQCOM, VIXCLS) around Nov 19–20**, extend
    the line, and add Nvidia's earnings (around Nov 18) if they move markets.
  - Explanations of daily moves are the press's reading, not proven causes.
  - The IMF (Oct 13) warned of risk without predicting a crash. Griffin said "almost certainly bubbles".
  - Challenger: about 1 in 5 announced 2026 job cuts cite AI, but the monthly count fell.
- **Sources:** credit line on the slide: "Nasdaq Composite: NASDAQ OMX via FRED, Federal Reserve Bank of St. Louis",
  plus the headline outlets and dates. URLs are in the `econ-*` entries.

### 3.3 · Slide 48 · AI helped find an old bug; attackers came fast (`p3Php2Shell`, new, 2.0 min)
- **Visual:**
  - Left: the TIME headline screenshot (`hack/hl-time-php.png`, framed).
  - Right: a native timeline strip, one stop per click:
    1. Aug 19 "An AI agent flags a flaw in PHP" (the code behind many websites);
    2. Oct 21 "Fix released";
    3. "Same day: tens of thousands of break-in attempts in 45 minutes (Cloudflare, via Fortune)";
    4. Oct 27 "US cyber agency: actively exploited".
  - Last click: a takeaway card, "The same skill helps defenders and attackers. Who attacked? Mostly unknown.", with
    the TechCrunch headline crop.
  - "70%" appears only inside a real headline image, unless E2 adds a verified usage source to the manifest.
- **Kid-safe:** no exploit details, no CVE mechanics, no attacker infrastructure, and no THN China graphic.
- **Clicks:** 4–5. Count them in the CLICKS line.
- **Beat:** spoken only. Slides 47, 49 and 50 already carry beats.
- **Notes:**
  - William's "hacking spree with PHP" is **PHP2Shell**: two PHP flaws found with AI help, then mass-exploited. php.net
    itself was not hacked.
  - BE HONEST:
    - humans spent days confirming what the AI flagged (TIME);
    - attackers' use of AI is reported by single vendors;
    - Unit 42 retracted one link it had drawn;
    - the "China-nexus" lead is low-to-moderate confidence;
    - CrowdStrike's VAPOR PANDA report is not tied to PHP, so leave it off.
  - Link back to slides 46–47: OpenAI was on both sides (the July agents; the October coordinated disclosure). This is
    the "dual-use" idea, which returns on slide 55.
- **Sources:** php.net advisory (Oct 21), TIME (Oct 23), Fortune, TechCrunch (CISA, Oct 27) and Wiz. URLs are in the
  `hack-*` entries.

---

## 4. The staleness audit

- **Default: 0 minutes.** Staleness fixes are in-place edits of numbers, dates and wording: METR, ARC/HLE/SWE-bench,
  Navier–Stokes and Clay, RA-Bench, Palisade, the Pain Axis, BlueDot/80,000 Hours, and Axios.
- If the audit forces **extra** time (a new slide or a longer reveal), take it from Q&A down to the 6.0-minute floor
  (1.0 min available). After that, hide in the new running-long order (gigawatt, then HLE).
- If the audit **removes** a slide (a claim collapsed), its minutes go to Q&A.
- Do not touch the never-cut slides' minutes.

---

## 5. Work split: two editors in parallel

Shared rules:
- No git.
- One deck build at a time on the box. Wrap every preview:
  `flock /tmp/claude-0/-home-user/a99e0376-0534-5e3e-8b47-ccbc03821dfd/scratchpad/splash-nov/build.lock tools/preview_splash.sh build/prev-<you> [n…]`
- Read every rendered slide image by eye.
- `manifest.json` is shared:
  - E1 edits only `ml-` items and `_ml` facts;
  - E2 edits only `hack-`, `dc-` and `econ-` entries;
  - each edit is a one-shot read-modify-write (load, change, dump), never a long-held copy.
- `icons.js` takes any react-icons name, so E2 needs no change there.

### E1: `tools/slides_splash_ml.js`, `tools/icons.js`, `assets/slides/splash/`, and the Part 1 divider line and header minutes in `tools/build_splash.js`
1. Fetch, view and register the five Commons files (section 1, "Assets"). Make the crops: ImageNet photos, DDIM panels
   and `gpu_dots_16896.png`.
2. Build the nine new slide functions and edit the eleven modified ones, exactly as in section 1.
3. Set the `slides` object to this order: `titleSlide, hookSlide, roadmapSlide, mlSlide, flashCardsSlide,
   unsupervisedSlide, rlDogSlide, quizSlide, networkSlide, gradientSlide, backpropSlide, nextWordSlide, diffusionSlide,
   cakeSlide, schoolSlide, pretrainSlide, baseModelSlide, rlHomeworkSlide, gpuSlide, nvidiaSlide, scalingSlide,
   gigawattSlide, grownSlide, recapSlide`. Retired functions leave `slides`, because `build()` runs every entry.
4. Number the kickers 1–21. Set the minutes as in the table, so the Part 1 clock ends at **41:00**.
5. Do a math sweep of every Part 1 slide and its notes (list in `ml-research.md` section 1; rules in section 0 here).
6. Update the roadmap minutes, the divider say line ("37 minutes"; "slides 13 and 16") and the `build_splash.js` header
   comment.
7. Preview into `build/prev-e1`. The run of show must show Part 1 at 4:00–41:00 with no CLICKS mismatches, no titles
   over 48 characters and no text under 12 pt. Check each Part 1 render by eye.

### E2: `tools/slides_splash_extra.js` (ORDER, DIVIDERS, the news slides, stale-fact edits, cuts), `tools/make_dc_map.js` and `assets/slides/splash_extra/`
1. **ORDER**, Part 2: remove `p2MetrEvidence` (−1.0) and `p2Code` (−1.0). Append `p2DcMap` (1.5) and `p2Economy` (1.5)
   after `p2Robot`. Part 2 becomes 21.0 min (slides 26–37, clock 41:00–62:00).
2. **ORDER**, Part 3: remove `p3Explosion` (−1.5) and `p3RogueWords` (−1.5). Insert `p3Php2Shell` (2.0) between
   `p3HfSwarm` and `p3Shutdown`. Part 3 becomes 29.0 min (slides 38–52, 62:00–91:00).
3. **Part 4** is unchanged (12.0, slides 53–58, 91:00–103:00). **Q&A:** `qaSlide` min 8.0 → **7.0**; its beat and SAY
   change "8 minutes" to "7" (slide 59, 103:00–110:00).
4. **DIVIDERS:**
   - [1] say "36" → "37";
   - [2] "20 minutes" → "21 minutes";
   - [3] "30 minutes" → "29 minutes", and the opening line may become "Part 2 showed fast progress, and a world racing
     to build for it";
   - [4] "then 8 for questions" → "then 7", and "collect them during slide 56" → "slide 57".
5. **Carry the cut content:**
   - `p2Metr` SAY gets "METR's test ran out of long tasks" (from old 27);
   - `p3Rsi` SAY opens with a one-sentence definition of AI that builds better AI, crediting I. J. Good (1965) (from
     old 43);
   - `p3HfOverview` TERMS gets "agent = an AI that takes actions on its own";
   - `p3HfSwarm` SAY gets the made-up rule words (HOLD, VETO, STOP, "precedent") (from old 47).
6. **Slide-number cross-references** in the notes (grep `slide \d` and `slides \d`). Old → new: 25→27, 26→28, 28→29,
   29→30, 30→31, 31→32, 32→33, 34→34, 35→35, 37→39, 38→40, 39→41, 40→42, 41→43, 42→44, 44→45, 45→46, 46→47, 48→49, 49→50,
   50→51, 51→52, 53→54, 54→55, 55→56, 56→57, 57→58, 58→59. Old Part 1 references: 11→13, 16→16.
7. **Three news slides** as in section 3. Kickers come from ORDER automatically. Each gets the full notes format (TIME,
   CLICKS, SAY, TERMS, ASK, TAKEAWAY, BE HONEST, SOURCES with URLs) and a `meta` source such as "new (Nov 2026 news)".
8. **`make_dc_map.js`:** emit the cumulative layer PNGs for the click build. Keep the full map PNG, and keep the "as of"
   date and the source line.
9. **Staleness edits** from the audit, in place and at 0 min (section 4).
10. **Optional:** update the fallback `roadmapSlide` minutes in `slides_splash_extra.js` to match E1's.
11. Preview into `build/prev-e2` under the build lock. The run of show must total **110** with Part 2 at 41:00–62:00,
    Part 3 at 62:00–91:00, Part 4 at 91:00–103:00 and Q&A at 103:00–110:00, with no warnings. Check the new slides and
    their neighbours by eye.

---

## 6. Open items for William
- **MythBusters clip** (slide 20): optional. Only third-party re-uploads exist (ZrJeYFxpUyQ, fKK933KK6Gg, WmW6SD-EHVY).
  Time the smiley round and the Mona Lisa round yourself; any clip time comes out of the slide's 2.5 minutes.
- **Nvidia market value** (slide 21): check a live quote on Nov 21. NVIDIA reports around Nov 18.
- **Data, the week of the talk:** re-run the data-center map (~Nov 19) and re-pull FRED for the stocks slide
  (~Nov 19–20).
- **"Gradient" on slide 11:** saying the word once is your call. The slide itself shows only "the slope in every
  direction".
- **The "about half of compute is RL" estimate** (SemiAnalysis via OfficeChai) stays in the notes. It goes on a slide
  only if someone reads the original chart and adds it to the manifest as verified.
