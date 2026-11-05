# Research for the new Part 1 (How AI learns) — Splash M1237, Nov 21, 2026

Researcher: Sonnet stage `r-ml`, Nov 5, 2026. Manifest entries: `assets/research/splash_nov/manifest.json`, ids starting `ml-`.
Images: `assets/research/splash_nov/ml/` (each with license and credit in the manifest). Existing assets are in `assets/research/splash/`.

Legend: **[V]** = I opened the page or file and read the quoted words. **[2nd]** = seen only through a search summary or a secondary site; do not put on a slide without re-checking. **[ours]** = our own arithmetic or analogy.

---

## 1. Inventory of the current Part 1 (slides 4–23) against William's list

| Topic William wants | Where it is now | How well | Missing |
|---|---|---|---|
| How a neural network works | Slide 8 "A neural network is a stack of dials" (native input / hidden / output drawing, CIFAR cat photo, "each line is a weight, a dial", counts 13,002 / 175 billion / 1.04 trillion) | Good and visual. | No physical "knobs" picture; no demo of dials changing behavior (the TF Playground screenshots exist in `splash/` but are not on this slide). |
| Supervised / unsupervised / RL, with his analogies | Slide 6 (four columns: CIFAR-10 labelled cards = "flashcards with the answers on the back"; k-means dots; hide-and-seek screenshots with "like training a pet with treats"; MAE masked photos) and slide 7 (finger quiz) | Flashcards: yes (text + real labelled cards). Clustering: dots, but not "sorting one-sided cards". Generating new cards: **missing**. Dog and treat: text only, **no dog picture**. | A one-idea-per-slide version: flashcards / sorting one-sided cards (and generating new ones) / dog + treat. |
| LeCun's cake | Only one sentence in the slide-6 "FOR ADVANCED STUDENTS" note | **Missing as a slide.** Both LeCun slide images are already in `splash/` but unused. | Whole slide, plus the mapping to pretraining / SFT / RL. |
| Pretraining vs post-training (SFT + RL) as lecture / worked examples / homework and exams | Slides 12 (pretraining loop, token counts), 13 (base vs assistant, Fig. 47), 14 (SFT, reward model, RLHF, from InstructGPT Fig. 2), 15 (constitution, checkable rewards, R1-Zero 15.6% to 71%), 16 (six-step pipeline with PRETRAINING / POST-TRAINING / TESTING brackets) | The content is there and well sourced. But there is no single frame, the school analogy is absent, and slide 14 mixes SFT/reward model/RLHF while slide 15 adds more. | One "school" picture: lecture, worked examples, homework (and exams = evaluations). The compute contrast (pretraining is almost all of the compute) appears only as one line in slide 16. |
| Autoregressive (left to right, text) vs diffusion (repeated denoising, images) | Slide 11 shows one-word-at-a-time generation (4-step loop). The word "autoregressive" appears only in the slide-7 note. **"Diffusion" appears nowhere in the Splash deck.** | Autoregressive: good on slide 11 but not named or contrasted. Diffusion: **missing**. | A slide (or two) pairing the two methods, with a real denoising picture. |
| GPUs vs CPUs | Only "A GPU is a chip built for AI math" (slide 12) and GPU counts (slides 12, 16, 20) | **Missing.** | A slide: a few big cores vs thousands of small ones; why training needs them. |
| Why Nvidia dominates AI hardware | Nothing explains it. Nvidia is named only on slide 20 (the PC Gamer headline "Jensen Huang says 100,000 Nvidia GPUs ...") and in its notes (grep: 0 hits in `slides_splash_extra.js`) | **Missing.** | A slide: share, CUDA, networking, market value, and fair competitors. |
| Gradient as a slope | Slide 9: hiker in fog (native), "Gradient: for each dial, the uphill direction", Commons gradient-descent contour picture | Visual is good; wording is the problem (see math list). | Say "slope in many directions at once: which way is downhill". |
| Backpropagation | Slide 10: factory line with an inspector, blame sent backwards, 1986 Nature paper | Good analogy, native and clean. | Nothing essential. Drop "gradient descent" from the SAY. |
| Scaling laws | Slides 17 (compute dots on a log scale), 18 (Kaplan line, log-log, "10× compute ≈ 11% lower loss") | Accurate, but the charts are the most math-looking in Part 1. | A no-axis version ("more compute, steadily lower error") is possible with the same sources. |

### Math now on slides or in SAY lines (to remove or rewrite)

On slides:
- S9: label **"Gradient | for each dial, the uphill direction. We step the opposite way."**; label **"Training (gradient descent)"**; **"Learning rate"**; title uses "Learning = measure the mistake, then nudge" (an "=" in a title; harmless but reads like an equation).
- S12: line **"nudge = gradient descent + backpropagation"** (looks like a formula). Slide text also says "trillions of times".
- S17: **"Log scale: each gridline up = 10× more math"**, and the ratio labels **1×, 16×, 670,000×, 45 million×, ≈ 2 billion×**; chart axis is logarithmic.
- S18: log-log chart; **"Each 10× more compute → about 11% lower loss"**; "(our arithmetic from the paper's fit)".
- S19: formula-like sentence "Energy = power × time: 1 GW for 1 hour is 1 gigawatt-hour" (slide text, line 1412 of `slides_splash_ml.js`) and a "terms" entry "energy = power × time".
- S20: "1.8 → 503 GWh" (units arithmetic, not an equation).
- S8: "13,002" is fine on the slide.

In SAY lines or notes:
- S9 SAY: "That is gradient descent. The gradient points uphill, the way that makes the loss grow fastest. Each dial steps the opposite way ..."; notes: "a billion dimensions ... take a small step opposite the gradient", "local minimum".
- S10 SAY: "Then gradient descent nudges every dial a little in the helpful direction."; advanced note: **"Backprop is the chain rule from calculus ... the derivative of the loss"**.
- S12 SAY: "nudges the dials with gradient descent and backpropagation"; advanced note has the 90,000-years arithmetic (15 trillion × 0.75 words ...).
- S8 advanced note: weighted sum, bias, "nonlinear function (activation function)", and **"784×16+16 + 16×16+16 + 16×10+10 = 13,002"**.
- S17 advanced note: "FLOP", scientific notation (4.7e17 ...).
- S23 SAY: "gradient descent does the nudging" (recap).
- Notes on S5: "top-5 error" definition.

Suggested replacement wording: *"Gradient = the slope, in all directions at once: it tells each dial which way is downhill. Training = feel the slope, take a small step downhill, repeat."* Keep the word "gradient" only if William wants students to hear it; never "descent", "derivative", "chain rule".

---

## 2. LeCun's cake

### The 2016 slide (read by eye from the repo's `lecun-cake-nips2016-slide.png`, 784×502) [V]
Talk: Yann LeCun, "Predictive Learning", invited talk (Posner Lecture), NIPS 2016, **Dec 5, 2016** (talk title and abstract on nips.cc [V]: https://nips.cc/virtual/2016/invited-talk/6197 ; the Dec 5 date is from the deck-transcript filename "Lecun-20161205-Nips-Keynote" on Scribd [2nd] and the brief; the nips.cc page text I loaded gives no date).
Slide text, verbatim from the image (this crop has no title bar):
- **"Pure" Reinforcement Learning (cherry)** — The machine predicts a scalar reward given once in a while. — **A few bits for some samples**
- **Supervised Learning (icing)** — The machine predicts a category or a few numbers for each input — Predicting human-supplied data — **10→10,000 bits per sample**
- **Unsupervised/Predictive Learning (cake)** — The machine predicts any part of its input for any observed part. — Predicts future frames in videos — **Millions of bits per sample**
- Footnote: **"(Yes, I know, this picture is slightly offensive to RL folks. But I'll make it up)"**
- Slide title: a Scribd transcript summarised by a search tool gives "How Much Information Does the Machine Need to Predict?" [2nd, not seen on the crop]. Do not print the 2016 title on a slide.

The one-sentence version, as Synced printed it [V, https://syncedreview.com/2019/02/22/yann-lecun-cake-analogy-2-0/]: *"If intelligence is a cake, the bulk of the cake is unsupervised learning, the icing on the cake is supervised learning, and the cherry on the cake is reinforcement learning (RL)."* Synced attributes it to NIPS 2016; the wording of the spoken line is Synced's report, not something I could check against a recording.

### The 2019 revision (read by eye from `lecun-cake-isscc2019-slide.png`, 2208×1244) [V]
LeCun, ISSCC 2019 (International Solid-State Circuits Conference, San Francisco, Feb 2019), "1.1: Deep Learning Hardware: Past, Present, & Future", slide 59 (footer of the image). Title: **"How Much Information is the Machine Given during Learning?"**. Cherry = "Pure" Reinforcement Learning, "The machine predicts a scalar reward given once in a while.", "A few bits for some samples". Icing = Supervised Learning, "The machine predicts a category or a few numbers for each input", "Predicting human-supplied data", "10→10,000 bits per sample". Cake génoise = **Self-Supervised Learning**, "The machine predicts any part of its input for any observed part.", "Predicts future frames in videos", "Millions of bits per sample". Synced (Feb 22, 2019): LeCun "updated his cake recipe last week at ... ISSCC ... replacing 'unsupervised learning' with 'self-supervised learning'" [V].

Provenance in the repo: both files are in `assets/research/splash/manifest.json` (ids `lecun-cake-nips2016-slide`, `lecun-cake-isscc2019-slide`), downloaded from the Synced article. Copyright: LeCun / IEEE ISSCC (the 2019 footer reads "© 2019 IEEE International Solid-State Circuits Conference"). Treat both as a credited quotation of a slide, not as openly licensed. Note the 2016 file is only 784×502 (a crop without the title). Option: redraw the cake natively (cake / icing / cherry with the three bit-counts) and show the real 2019 slide as the proof, credit "Y. LeCun, ISSCC 2019".

The key point for kids: LeCun's argument was about **how much information per example the learner gets** (the bits), not about training stages.

### The LLM reading (cake = pretraining, icing = SFT, cherry = RL) — who has used it
- **Nathan Lambert, "The RLHF Book", Lecture 5 (slides), "The LeCun cake" [V, https://rlhfbook.com/teach/course/lec5-chap7/]:** *"At NeurIPS 2016, Yann LeCun introduced the cake metaphor: predictive / unsupervised learning is the cake, supervised learning is icing, and RL is the cherry. With modern language models, the analogy is complete: Self-supervised learning on internet data = the bulk of the cake. Supervised fine-tuning for instructions = the icing. Reinforcement learning (RLHF, then RLVR) = the cherry on top –> With agents, RL may be more than just the cherry in compute, but it's still the shape of the training loops!"* (cites Synced 2019; the page shows no date; the slides name "Lambert" in the footer.)
- A web search also surfaced a Manning "RLHF Book" chapter 14 summary that says the analogy is "now largely complete" [2nd, not found when I grepped the page]; a NoStarch "Craft of Post-Training" chapter 3 sample saying the proportions "have been hotly debated" [2nd]; and the Reinforcement Pre-Training paper crediting the cherry cake image to LeCun's slides [2nd; my grep of the PDF text found no "cake"]. Do not cite these three without opening them.
- **Be honest on the slide: it is an adaptation.** LeCun's 2016 and 2019 slides are about unsupervised/self-supervised vs supervised vs reward-only learning in general. They do not mention language models, SFT or RLHF. Mapping "icing = SFT" is the community's adaptation (SFT is supervised learning on human-written answers, so the icing fits by type). And the "bits per example" ranking does not carry over cleanly: one RL reward on a long reasoning chain can carry a lot of useful signal.
- Also true: RL folks answered with a cake covered in cherries (DeepMind researchers; Pieter Abbeel at NIPS 2017) [V via Synced]. A fun "the cherry is growing" visual.

### Credible 2025–2026 evidence that the RL "cherry" is growing
1. **xAI, "Grok 4", July 9, 2025 [V, https://x.ai/news/grok-4]:** *"For Grok 4, we utilized Colossus, our 200,000 GPU cluster, to run reinforcement learning training that refines Grok's reasoning abilities at pretraining scale."* and *"xAI will continue scaling reinforcement learning to unprecedented levels"*. (Company claim. "At pretraining scale" is xAI's phrase; no numbers are given in the text I read.)
2. **Epoch AI, Josh You, "How far can reasoning models scale?", May 9, 2025 [V, https://epoch.ai/gradient-updates/how-far-can-reasoning-models-scale]:** *"OpenAI has said that o3 is a 10× scale-up in training compute from o1, almost certainly referring to reasoning training compute."* and *"If reasoning training continues to scale at 10× every few months, in line with the jump from o1 to o3, it will reach the frontier of total training compute before long, perhaps within a year."* Also: *"Llama-Nemotron Ultra's RL reasoning stage took 140,000 H100-hours, or around 1e23 FLOP, <1% of the pre-training cost of the original base model."* So in May 2025 Epoch said RL was still **small** but growing fast. (Do not say "Epoch says RL rivals pretraining"; it did not.)
3. **Khatri et al., "The Art of Scaling Reinforcement Learning Compute for LLMs", arXiv Oct 15, 2025 [V, https://arxiv.org/abs/2510.13786]:** *"DeepSeek-R1-Zero used 100,000 H800 GPU hours for RL training – 3.75% of its pre-training compute (Guo et al., 2025). This dramatic increase in RL compute is amplified across frontier LLM generations, with more than 10× increase from o1 to o3 (OpenAI, 2025) and a similar leap from Grok-3 to Grok-4 (xAI Team, 2025)."* (Paper's authors; the 3.75% is their calculation from DeepSeek's numbers.)
4. **Andrej Karpathy, "2025 LLM Year in Review", Dec 19, 2025 [V, https://karpathy.bearblog.dev/year-in-review-2025/]:** *"Running RLVR turned out to offer high capability/$, which gobbled up the compute that was originally intended for pretraining. Therefore, most of the capability progress of 2025 was defined by the LLM labs chewing through the overhang of this new stage and overall we saw ~similar sized LLMs but a lot longer RL runs."* (An expert's view, not a lab disclosure. "RLVR" = reinforcement learning from verifiable rewards.)
5. **SemiAnalysis chart, reported by OfficeChai, Oct 18, 2026 [2nd for the chart, V for the article text, https://officechai.com/ai/while-share-of-inference-has-held-steady-over-the-last-2-years-pre-training-compute-has-moved-to-post-training-semi-analysis/]:** for **combined Anthropic and OpenAI compute**, pre-training share 67% (1Q24) → 32% (4Q25) → 23% (1Q26); post-training/RL share 5% (1Q24) → 36% (4Q25) → 42% (1Q26) → "53–55%" in the 3Q26/4Q26 *estimates*. This is an analyst's estimate, seen through a news site; I did not see the original chart. Label it "SemiAnalysis estimate, via OfficeChai".
6. **Do not use:** a Startup Fortune article (Oct 11, 2026) says "Epoch AI data shows post-training compute overtook pretraining"; the text I loaded does not show Epoch's numbers, and the 42% / 23% pair it echoes in search summaries is the SemiAnalysis figure above. Misattribution risk.
7. **Hard fact for the contrast (older, small post-training):** DeepSeek-V3 technical report, Dec 2024 [V, https://arxiv.org/abs/2412.19437]: pre-training 2,664K H800 GPU hours; context extension 119K; **post-training 5K**; total 2.788M. (Post-training ≈ 0.2% of total: our arithmetic.) And **InstructGPT**: post-training "uses less than 2% of the compute and data relative to model pretraining" (OpenAI, https://openai.com/index/instruction-following/, in the repo manifest, id in `pipeline-compute-cost.json`).

**Suggested slide story:** the cake (pretraining) was almost all the compute in 2022–2024 (V3: post-training ≈ 0.2%); in 2025–26 labs say they are scaling the cherry (RL) up fast (xAI "pretraining scale", o1→o3 10×, R1-Zero 3.75% → analysts estimating about half of lab compute now). Caveat: the share numbers are estimates and the cake is not a precise proportion.

---

## 3. Learning types with William's analogies (images and licenses)

| Analogy | What exists | Best visual |
|---|---|---|
| **Flash cards = supervised** | In repo: `splash/cifar10-labelled-grid.png` (screenshot of Krizhevsky's CIFAR-10 table, cite the page), `splash/imagenet-ilsvrc-fig1-labelled-categories.png` (paper figure). Commons search for flash-card photos returned only scanned books, so no photo recommended. | **Draw native cards**: front = a CIFAR cat photo (the repo's cropped image already in slide 6), back = "cat". Flip animation on click. Optional: the ImageNet figure crop (credited) for "real labelled photos". |
| **Sorting one-sided cards into piles = unsupervised (clustering)** | In repo: `splash/clustering-kmeans-convergence.gif` (Chire, Commons, CC BY-SA 4.0, verified in the manifest) | **Native**: a pile of unlabelled cards (CIFAR photos with blank backs) that slide into 3 piles on clicks, and a "no one told it what the piles mean" caption. Use the k-means GIF only as a small "real example" inset (credit on the slide). |
| **Generating new cards = unsupervised/generative (if the cards have images)** | No licensed grid of GAN samples found (Commons searches for GAN/MNIST samples returned nothing usable). The Commons DDIM plot (section 5) is real model output (Stable Diffusion v1-5): ten images from one prompt at 1, 2, 3, 5, 8, 10, 15, 20, 30, 40 steps. | **Native**: a fan of new "cards" made from the DDIM final images, or simply use the DDIM strip on the diffusion slide and say "the model drew a card nobody ever printed". Honest note: a generative image model is trained with a denoising target (self-supervised), not a pure "sort into piles". |
| **Dog with a treat = RL** | `ml/dog-with-treat.jpg` (Commons "Dog with treat.jpg", pbump, Flickr, 2010, **CC BY-SA 2.0**; description "Dog waiting for treat") if the download completed (see status below). Existing RL visuals in `splash/`: hide-and-seek (OpenAI), DeepMind locomotion GIFs, DQN Breakout. | Photo of the dog (credit on slide) + native loop: **try → score → do it more**, "reward = a treat". |

Other free pictures noted from Commons search (not downloaded): `File:Capybara getting treats and pets.jpg` (CC BY-SA 4.0) as a fun alternative for the treat slide.

Credits needed on the slide: "Dog with treat" by pbump, CC BY-SA 2.0, via Wikimedia Commons.

---

## 4. Neural network and "the slope", with no math

- **Network as dials/knobs:** keep the native network of slide 8 (already the best). Add one real picture of a mixing console: `ml/mixing-console-faders.jpg` (Commons "Modern Mixing Console (32961446438).jpg", Dejan Krsmanovic, Flickr, 22 Jan 2019, **CC BY 2.0**, 5616×3744) if downloaded; credit "Dejan Krsmanovic, CC BY 2.0". Runner-up: Commons CC0 `Fader tweaked on Mackie D8B Digital Mixer ... pixabay - 225498.jpg` (no credit required). Metaphor: a mixing board with a billion knobs (already in the slide-8 note as a spoken question).
- **A tiny network you can watch:** `splash/tf-playground.png` and the `nn-playground-*` before/after crops (screenshots of playground.tensorflow.org; manifest id `nn-playground-screenshot-trained`).
- **Slope in many directions / hiker in fog:**
  - `splash/gd-commons-gradient-descent-hires.png` (+ `.svg`): Commons "Gradient descent.png", **public domain**, shows red steps down contour lines; already used on slide 9 as an inset.
  - `splash/gd-lossland-li2018-*.png` (Li et al., NeurIPS 2018, arXiv non-exclusive distribution license, **not** CC/PD: cite the paper; for a printed handout, confirm). Good "real landscape of a network", the rugged vs smooth pair. Best used for "this is what the landscape looks like; it has many directions", with a credit line.
  - Native hiker in fog (already built on slide 9). Optional photo backdrop for the fog beat: Commons `Fog on a mountain 2.jpg` / `Fog, Forest and mountain 4.jpg` (CC BY-SA 4.0, 5184×3456, no hiker in them; not downloaded). I could not find a licensed photo of a lone hiker in fog.
  - Wording: "The slope in many directions at once. You stand on a hillside in fog; the gradient is just: which way is downhill, for every direction you could step."
- **Backprop as passing blame backwards:** keep slide 10's native factory line and add a click-by-click animation (station 3 blames station 2, then 1). Nothing else needed. Source for the 1986 paper is already on the slide.

Already in `assets/research/splash`: `gd-*`, `nn-3b1b-*` (YouTube thumbnails for the four 3Blue1Brown chapters, for video-card use), `nn-playground-*`, `nn-lossland-*`, `nn-commons-gradient-descent.gif`, `tf-playground.png`, `kaplan-fig1.png`, `scaling-chinchilla-*`.

---

## 5. Autoregressive vs diffusion

### A real, licensed picture of denoising
- **`ml/diffusion-ddim-steps-castle.png`**: Commons "X-Y plot of algorithmically-generated AI art of European-style castle in Japan demonstrating DDIM diffusion steps.png", author **Benlisquare**, own work, 31 Oct / 1 Nov 2022, **CC BY-SA 4.0** (also GFDL 1.2+), 2,560×1,734. Made with Stable Diffusion v1-5; it "illustrates the U-Net denoising process using the DDIM sampler"; ten images of the same picture at 1, 2, 3, 5, 8, 10, 15, 20, 30, 40 steps; prompt "a (european castle:1.3) in japan. by Albert Bierstadt, ray traced, octane render, 8k" [V from the Commons file page]. Credit line: "Benlisquare, CC BY-SA 4.0, via Wikimedia Commons". Best "noise to picture" visual. (Check the picture by eye after download; I could not view it, see status.)
- **`ml/diffusion-forward-noise-rhino.png`**: Commons "Example of Forward Diffusion Models.png", **MrAlanKoh**, 29 Nov 2022, **CC BY-SA 4.0**, 1,624×861, "An images of rhino by rocky river bed is gradually added noises until it is unrecognisable." (derived from a Black Rhinoceros photo). Shows the training direction (adding noise), which the model learns to undo.
- Both licenses require attribution and share-alike for adaptations; the picture on a slide with a credit is fine. No other license found for a paper figure (I did not use paper figures).

### Left-to-right token generation: native animation spec
Row of word boxes, one per click: `The` → `The cat` → `The cat sat` → `The cat sat on` → `The cat sat on the` → `… mat`. Under the growing row, a bar chart of 4 candidate next words (as slide 11) that re-draws on each click, the winning bar flies into the row. A fixed arrow "→ left to right" under the row. Keep it as the 5-click version of slide 11, no new numbers. (Already "made-up example" labelled on slide 11.)
Diffusion beat: a 5-panel row (native noise squares to the real DDIM images 1 / 3 / 8 / 20 / 40 steps) with the caption "start with noise, clean it up a little, again and again". The real image is the DDIM plot above, cropped panel by panel (crop only).

### Honest caveats (sources for the notes)
- **Text diffusion exists.** Google DeepMind, "Gemini Diffusion", May 20, 2025 [V, https://blog.google/innovation-and-ai/models-and-research/google-deepmind/gemini-diffusion/]: *"Our latest research model, Gemini Diffusion, is a state-of-the-art text diffusion model that learns to generate outputs by converting random noise into coherent text or code, like how our current state-of-the-art models in image and video generation work."* (experimental demo). Inception Labs, "Introducing Mercury", Feb 2025 [V, https://www.inceptionlabs.ai/blog/introducing-mercury]: *"We are announcing the Mercury family of diffusion large language models (dLLMs) ... Mercury is up to 10x faster than frontier speed-optimized LLMs."* and *"These models operate with a 'coarse-to-fine' generation process, where the output is refined from pure noise over a few 'denoising' steps."* (vendor claims; the 10× is Inception's own). Later Mercury releases (Mercury 2 on Feb 24, 2026; Mercury 3 on Oct 19, 2026) were seen only in search summaries [2nd].
- **Some image generators are autoregressive.** OpenAI, "Native Image Generation System Card" (the GPT-4o image generation addendum), March 25, 2025 [V, PDF read: https://cdn.openai.com/11998be9-5319-4302-bfbf-1167e093f1fb/Native_Image_Generation_System_Card.pdf]: *"Unlike DALL·E, which operates as a diffusion model, 4o image generation is an autoregressive model natively embedded within ChatGPT."* (The HTML page itself returned 403 to my tools; the PDF is the same card.) Outside analysts disagree on whether a diffusion-like decoder sits at the end [2nd]; say "OpenAI describes it as autoregressive".
- **Mixed models.** Zhou et al. (Meta and collaborators), "Transfusion: Predict the Next Token and Diffuse Images with One Multi-Modal Model", arXiv Aug 20, 2024 [V, https://arxiv.org/abs/2408.11039]: *"Transfusion combines the language modeling loss function (next token prediction) with diffusion to train a single transformer over mixed-modality sequences."* I did not verify which current video models mix the two; say "some".
- So the clean slide is "text is usually left to right; images are usually denoised; but the two methods are mixed and swapped", with the three sources.

---

## 6. GPU vs CPU

### MythBusters demo (NVISION 2008)
- Event: NVIDIA's NVISION 08, San Jose (Aug 25–28, 2008 per Wikipedia's "Nvision" article, seen only in a search summary [2nd]); Adam Savage and Jamie Hyneman closed the keynote [bit-tech, https://www.bit-tech.net/news/mythbusters-finish-nvision-in-style/1 , V]. A small robot fired paintballs one at a time to draw a smiley face (the "CPU"), then a covered machine fired **1,100 paintballs from 1,100 barrels** at once, painting the Mona Lisa. Savage's line (bit-tech): "underneath this sheet, there are thousands of pounds of aluminium and steel, a mile of high-pressure air hose, hundreds of pounds of compressed air and 1,100 specifically compressed paintballs in 1,100 barrels" [V].
- NVIDIA's own NVISION page says they "painted the Mona Lisa in 80ms - with paint balls!" [V, https://www.nvidia.com/content/nvision2008/]. Another outlet reported 275 ms [2nd, via search summary]; say "NVIDIA says 80 milliseconds".
- **Video: not verified.** I could not find NVIDIA's official-channel upload, and YouTube blocked every way I had of reading length, upload date and channel (page fetch returns a bot check; yt-dlp is refused). What I did verify through YouTube's oEmbed endpoint (the title and uploader exist and embedding is allowed): `ZrJeYFxpUyQ` "NVIDIA: Adam and Jamie explain parallel processing on GPU's" (uploader "artmaze1974"; the NVIDIA developer forum links this id and calls it "on NVIDIA's site itself"); `fKK933KK6Gg` "NVIDIA: Adam & Jamie draw a MONA LISA in 80 milliseconds!" (same uploader); `WmW6SD-EHVY` "Adam and Jamie Paint the Mona Lisa in 80 Milliseconds! (HD)" (uploader "Joe Schmoe"). **All three are third-party re-uploads, not NVIDIA's channel.** I give **no start/end seconds, because I could not read the running time**. William should play the one he likes and write down the smiley round and the Mona Lisa round times himself. (The Splash deck's rule: no invented numbers.)
- Safer option if the video is not allowed on the projector: a native 2-panel "one barrel vs 1,100 barrels" animation, with the bit-tech quote and NVIDIA's "80 ms" as the cited facts.

### Core counts from vendor pages [V]
- **AMD Ryzen 9 9950X:** "# of CPU Cores **16**", "# of Threads **32**", Zen 5, max boost "up to 5.7 GHz", launch date 08/15/2024 (amd.com product page, https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-9-9950x.html). Alternative: Intel Core Ultra 9 285K, **24 cores** (8 performance + 16 efficient), Intel ARK spec page (https://www.intel.com/content/www/us/en/products/sku/241060/intel-core-ultra-9-processor-285k-36m-cache-up-to-5-70-ghz/specifications.html).
- **NVIDIA H100 SXM5:** "8 GPCs, 66 TPCs, 2 SMs/TPC, 132 SMs per GPU; 128 FP32 CUDA Cores per SM, **16896 FP32 CUDA Cores per GPU**; 4 fourth-generation Tensor Cores per SM, **528 per GPU**" (NVIDIA Technical Blog, "NVIDIA Hopper Architecture In-Depth", Mar 22, 2022, https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/). H100 PCIe: 14,592 CUDA cores, 456 Tensor Cores (same table).
- **Blackwell Ultra (B300):** NVIDIA's blog (https://developer.nvidia.com/blog/inside-nvidia-blackwell-ultra-the-chip-powering-the-ai-factory-era/) says "160 Streaming Multiprocessors (SMs)", "640 fifth-generation Tensor Cores" and "128 CUDA Cores for FP32 and INT32" per SM. It does **not** print a CUDA-core total; 160 × 128 = 20,480 would be our arithmetic. Use **H100 SXM5's 16,896** as the NVIDIA-published number, as the brief says.
- Ratio on the slide (ours): 16,896 vs 16 is about **1,000 times** as many cores. Say "about a thousand". Honest caveat on the slide: a GPU core is far simpler and slower than a CPU core, so the comparison is "many simple workers vs a few very capable ones", not "1,000 times faster".
- NVLink: H100 has 18 fourth-generation NVLink links, "900 GB/sec total bandwidth ... 7x the bandwidth of PCIe Gen 5" (same Hopper blog, [V]).

### Kid analogy [ours, an analogy, not a sourced claim]
"A CPU is a few professors who can solve any problem, one hard step at a time. A GPU is a stadium of thousands of students who can each only do simple sums, but they all do them at the same moment. Training a neural network is millions of simple sums (multiply and add), so the stadium wins." Tie to the MythBusters paintball picture.

### Openly licensed photos
- **CPU:** `ml/cpu-ryzen-9-9950x.jpg` (1920×1920; Commons "AMD Ryzen 9 9950X.jpg", photographer **4300streetcar**, 27 Nov 2024, **CC BY 4.0**; original is 3,305×3,305 on Commons) [V, viewed]. Credit: "4300streetcar, CC BY 4.0, via Wikimedia Commons". Alternatives from search (not downloaded): `Intel i9-14900KF CPU.jpg` (CC BY-SA 4.0), `Intel i9-9900K.jpg` (CC BY-SA 4.0).
- **GPU board:** still frames of an NVIDIA H100 card on Commons, e.g. `File:NVIDIA H100 (极客湾Geekerwan) 011.png`, from the Geekerwan YouTube review (https://www.youtube.com/watch?v=-nb_DZAH-TM), **CC BY 3.0**, 3840×2160, 14 Jun 2023; caption "View of the high-performance graphics card NVIDIA H100, which is based on the Hopper architecture"; the file page lists H100 PCIe with 14,592 CUDA cores [V page text; I have not seen the picture]. Credit: "Geekerwan (极客湾), CC BY 3.0, via Wikimedia Commons". Frames 002, 003, 004, 007, 014, 019, 021, 022, 024 also exist. See status below for whether a copy is downloaded; if not, pick the frame by eye on Commons.
- Also noted: `File:2026-02-12 NVIDIA Quadro 400 HOF6313 RAW-Export.png` (CC BY-SA 4.0, 4117×4117) is an old Quadro card, not an AI chip.

---

## 7. Why NVIDIA dominates (an "effective monopoly") — dated, sourced points

1. **Share (estimates, no audited number).** I found **no primary or top-tier source** with a global AI-accelerator share. Estimates in secondary pieces cluster at roughly 75–90% of AI-accelerator **revenue** for 2025–26 and differ by what is counted (merchant GPUs vs custom chips; revenue vs units): "Bloomberg, about 86% of AI accelerator sales in 2025, unchanged from 2024" (via a Motley Fool article [2nd, original not seen]); IDC "about 92%" (via a crypto-news site [2nd]); a vendor blog "80–90% by revenue, peaking near 87% in 2024 and projected to fall to 75% in 2026" [2nd]. **Recommend:** say "estimates run from about 75% to about 90% of AI-chip revenue, depending on who counts" and do not print a single number as fact. Primary figures that are solid: NVIDIA's **Q1 FY2027 results (May 20, 2026): record revenue $81.6 billion, up 85%; record Data Center revenue $75.2 billion, up 92%** [V, SEC 8-K exhibit, https://www.sec.gov/Archives/edgar/data/0001045810/000104581026000051/q1fy27pr.htm]. That is company-reported, quarter ended April 2026.
2. **CUDA (the software moat).** NVIDIA forum post by "TomNVIDIA", Mar 18, 2026 [V]: *"In 2006, NVIDIA made a bold bet on a parallel computing platform that would eventually redefine the limits of science and industry. 20 years later, CUDA serves as the foundation for 6 million developers worldwide."* (company figure; https://forums.developer.nvidia.com/t/cuda-is-nvidia-s-platform-for-accelerated-computing-and-the-foundation-for-gpu-computing/363954). Launch year: NVIDIA says 2006; other pages say 2007 (public software release), so say "2006–07". Why it locks in: most AI code (PyTorch and others) is written to call CUDA libraries, so switching chips means rewriting or re-testing code [our summary; no single source read for the "lock-in" claim; label it as the common explanation].
3. **Networking (NVLink and InfiniBand).** NVIDIA completed its acquisition of **Mellanox on April 27, 2020** ("a transaction value of $7 billion", announced Mar 11, 2019) [V, NVIDIA press release, https://nvidianews.nvidia.com/news/nvidia-completes-acquisition-of-mellanox-creating-major-force-driving-next-gen-data-centers]. H100's NVLink: 900 GB/s, 7× PCIe Gen 5 [V, above]. The point for kids: training uses thousands of GPUs that must talk constantly, so the "wiring" matters as much as the chip.
4. **Market value.** Nvidia became the first company at **$5 trillion** on **Oct 29, 2025**. Verified headline: *"Nvidia Becomes the First Company to Reach a $5 Trillion Market Value, Leaving Apple and Microsoft in the Dust"*, Entrepreneur, Sherin Shibu, Oct 29, 2025 (dek: "Nvidia's market capitalization surpasses the combined value of competitors like AMD and Intel.") — real screenshot taken with `tools/shot.js` (see `ml/hl-entrepreneur-nvidia-5t.png`) [V]. Global News also ran "Nvidia is now worth $5 trillion, a new record amid global AI boom", Reuters byline, posted Oct 29, 2025 5:43 pm [V screenshot viewed]. The AP report (via the Washington Times, search summary [2nd]) gave 24.3 billion shares and a $5.05 trillion market cap. **A November 2026 market-cap figure: not found.** Search results disagreed (about $5.4 trillion in Aug 2026 and about $5.8 trillion in early Oct 2026 in two search summaries [2nd]); check a live source the morning of Nov 21 (and note NVIDIA reports earnings around Nov 18) or just say "the first company ever worth $5 trillion, Oct 2025".
5. **Competitors (so the slide is fair).** (a) **Google TPU:** Anthropic, Oct 23, 2025: "we plan to expand our use of Google Cloud technologies, including up to one million TPUs ... expected to bring well over a gigawatt of capacity online in 2026" [V, https://www.anthropic.com/news/expanding-our-use-of-google-cloud-tpus-and-services]. (b) **AMD Instinct:** AMD press release, Oct 6, 2025: "OpenAI to deploy 6 gigawatts of AMD GPUs ... Initial 1 gigawatt OpenAI deployment of AMD Instinct MI450 Series GPUs starting in 2H 2026" [V, https://www.amd.com/en/newsroom/press-releases/2025-10-6-amd-and-openai-announce-strategic-partnership-to-d.html]. (c) **Amazon Trainium:** AWS page lists Trainium3 UltraServers "scale up to 144 Trainium chips" [V, https://aws.amazon.com/ai/machine-learning/trainium/]; and in the repo: Anthropic, "we currently use over one million Trainium2 chips to train and serve Claude" (https://www.anthropic.com/news/anthropic-amazon-compute, `pipeline-compute-cost.json`). (d) **Huawei Ascend:** Huawei's Sept 2025 keynote: "Over the next three years, we'll be working on three new series of Ascend chips: the Ascend 950 series ..., the Ascend 960 series, and the Ascend 970 series" [V, https://www.huawei.com/en/news/2025/9/hc-xu-keynote-speech]; a roadmap, not a share. (e) Fair framing: even leading labs now buy from several suppliers (OpenAI buys AMD and NVIDIA; Anthropic uses Google TPUs and Amazon Trainium (sources above)); "effective monopoly" is about share, tools and wiring, not a legal monopoly.

---

## 8. Pretraining vs post-training: facts for the school analogy

William's analogy (author-written, not sourced): pretraining = **lecture**; SFT = **worked examples in class**; RL = **homework** (and **exams**). Suggested honesty note: exams (benchmarks) grade a model but do not teach it; homework (RL with a checker or a reward model) is graded practice that does change the dials.

- **Pretraining = read everything, predict the next word.** In the repo already: Meta Llama 3 "over 15 trillion tokens"; Llama 4 "more than 30 trillion"; Qwen3 "approximately 36 trillion"; OpenAI VP Aidan Clark (Sep 3, 2026, via Fortune): "It's the first time we've pretrained on more than 100,000 GPUs at our Stargate site in Texas." (`pipeline-tokens.json`, `pipeline-compute-cost.json`).
- **SFT = demonstrations of good answers.** InstructGPT (Ouyang et al., Mar 2022, arXiv 2203.02155): labelers wrote the example answers; Fig. 2 and Fig. 47 are in the repo (`instructgpt-fig2*.png`, `pipeline-instructgpt-fig47-serendipity.png`).
- **RL = graded attempts.** (i) With a reward model: RLHF (InstructGPT step 3). (ii) With a checker: RLVR. DeepSeek-R1 paper (arXiv 2501.12948v1, Jan 2025): DeepSeek-R1-Zero, pure RL on a base model, "raised pass@1 on AIME 2024 from 15.6% to 71.0%" (repo facts, `pipeline-rlvr.json`; cite v1, later versions report different numbers).
- **Compute contrast.** InstructGPT post-training "uses less than 2% of the compute and data relative to model pretraining" (OpenAI, https://openai.com/index/instruction-following/, repo). DeepSeek-V3: 2,664K GPU hours pretraining vs 5K post-training (V3 report, V, section 2). R1-Zero: 100,000 H800 hours = 3.75% of pretraining (Khatri et al., V). **But** see section 2: by 2026 analysts estimate about half of Anthropic and OpenAI compute is post-training/RL (SemiAnalysis via OfficeChai, 2nd). Teach both: "tiny in 2022, growing fast now".
- **Pipeline diagram to redraw natively: Andrej Karpathy, "State of GPT", Microsoft Build, May 2023.** Video "State of GPT | BRK216HFS", Microsoft Developer channel, id `bZQun8Y4L2A` [V via oEmbed: title and channel; length and date not read]. The talk's pipeline has four stages (pretraining, supervised finetuning, reward modeling, reinforcement learning), per a Scribd copy of the slides summarised by search [2nd]; his own PDF link (karpathy.ai/stateofgpt.pdf) returned his homepage HTML to my tool, so I did not read the slides. Redraw natively as "lecture / examples / homework" and credit "after Karpathy, State of GPT (2023)" only if William checks the slide himself; otherwise credit InstructGPT Fig. 2 (already used) and the Splash deck's own slide 16.
- Pipeline slide recommendation: three big boxes in a row — **PRETRAINING (lecture)**: "read the library, guess the next word" (≈ almost all the compute until 2024) → **SFT (worked examples)**: "copy good answers people wrote" → **RL (homework)**: "try, get graded, try again" with two graders (a reward model; a checker for math and code); exams = evaluations on the side.

---

## Where each item should go (recommended visuals)

| Slide idea | Recommended visual (file) |
|---|---|
| Flash cards (supervised) | native flip cards with CIFAR cat photo (`splash/cifar10-labelled-grid.png` for the real labelled cards, credit Krizhevsky) |
| Sorting piles (unsupervised) | native cards sliding into piles; k-means GIF `splash/clustering-kmeans-convergence.gif` as small inset (CC BY-SA 4.0, Chire) |
| New cards (generative) | cropped DDIM images `ml/diffusion-ddim-steps-castle.png` |
| Dog + treat (RL) | `ml/dog-with-treat.jpg` (CC BY-SA 2.0, pbump) + native try/score/repeat loop |
| LeCun's cake | native cake drawing + real slide `splash/lecun-cake-isscc2019-slide.png` and 2016 inset |
| Cake = pretraining/SFT/RL | native 3-layer cake, with "adaptation, not LeCun's claim" label; growth-of-RL strip with xAI / Karpathy / SemiAnalysis quotes |
| NN as dials | native network (slide 8) + `ml/mixing-console-faders.jpg` (CC BY 2.0) |
| Slope in many directions | native hiker (slide 9) + `splash/gd-commons-gradient-descent-hires.png` (public domain) |
| Backprop | native factory line (slide 10), animate the blame arrow |
| Autoregressive | native word-by-word row + bars (slide 11) |
| Diffusion | `ml/diffusion-ddim-steps-castle.png` (cropped panels) + `ml/diffusion-forward-noise-rhino.png` |
| GPU vs CPU | `ml/cpu-ryzen-9-9950x.jpg` beside an H100 frame (CC BY 3.0, Geekerwan) and a native "16 vs 16,896" dot-field |
| MythBusters | native 1 barrel vs 1,100 barrels (video only if William checks it) |
| Nvidia dominance | `ml/hl-entrepreneur-nvidia-5t.png` headline + native 5-point card (CUDA, wiring, share range, market value, rivals) |
| School analogy pipeline | native 3 boxes (lecture / worked examples / homework) with the compute facts |

## Not found or not verified (also in the manifest `not_found`)
- Official NVIDIA-channel video for the MythBusters demo, and any running time for any copy.
- Primary-source global Nvidia AI-accelerator share.
- A November 2026 Nvidia market-cap figure with a clean source.
- A licensed grid of GAN or digit samples; a licensed photo of flash cards; a licensed photo of a hiker in fog.
- Original LeCun deck (2016) title text on the slide; exact spoken sentence.
- RL ≥ pretraining stated by a lab in plain words (only analyst estimates and "pretraining scale" from xAI).
- Download status for the Commons files is in the manifest ("file": null means not downloaded; the Commons URL and license are recorded so it can be fetched later).

## Download status (Nov 5, 2026, about 21:00 UTC)
On disk in `assets/research/splash_nov/ml/`: `cpu-ryzen-9-9950x.jpg` (CC BY 4.0, viewed), `hl-entrepreneur-nvidia-5t.png` (real screenshot, viewed).
**Not on disk:** `diffusion-ddim-steps-castle.png`, `diffusion-forward-noise-rhino.png`, `dog-with-treat.jpg`, `mixing-console-faders.jpg`, `nvidia-h100-geekerwan-011.png`. Wikimedia (upload.wikimedia.org and the Commons API) answered HTTP 429 "too many requests" to every request from this shared box for about 20 minutes, even at one request per 45 seconds with an honest user-agent; I did not try to get around the limit. Their licenses, credits and exact original URLs are in the manifest (entries `ml-diffusion-ddim-steps`, `ml-diffusion-forward-noise`, `ml-dog-treat`, `ml-mixing-console`, `ml-gpu-h100-geekerwan`, all `verified: false`, `file: null` until fetched). To fetch later: `curl -A "<your name and contact>" -o <file> <original URL from the manifest>`, wait a few minutes between files, then view each image and set `verified` to true. The single most valuable one is the DDIM denoising plot.
