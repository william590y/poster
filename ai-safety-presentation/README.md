# AI Safety and Existential Risk — presentation

**Deliverable:** `AI_Safety_and_Existential_Risk.pptx` (16:9, 117 slides, with transitions, entrance animations, looping GIF
clips, embedded YouTube videos and speaker notes on every slide), plus an interactive web version for williamliaw.com/aisafety/
(`tools/export_web.py`).

> **File size.** The full-quality build is ~1 GB, almost all of it looping GIF and video clips (quality was preferred over size).
> That is over GitHub's 100 MB per-file limit, so the built deck and the few source clips larger than 45 MB are not committed
> here. **Download the full deck from the [`ai-safety-deck` release](https://github.com/william590y/poster/releases/tag/ai-safety-deck).**
> The web version re-encodes every clip as H.264/VP9 video (~2 MB each).

Built from William Liaw's one-page outline (`assets/original/outline.pptx`), expanded into five acts:

| Act | Sections |
|---|---|
| Opening | Title · roadmap (along an exponential curve) |
| I · The Acceleration | AI dominates the economy · information is physical (data centers, supply, environment) · capabilities (model releases now ~11 days apart, METR horizon, benchmark graveyard, Humanity's Last Exam) · creative capabilities (stroke-by-stroke and tool-built work, @anabology's 18-hour film, clips credited to an unannounced “Fable 5.5”) · *“i'm upping my p(doom)”* video · mathematics in crisis (Navier–Stokes, aftermath, VibeMathed, 100+ unreleased results, Hodge/BSD rumors) · engineering & hardware design · labor benchmarks · jobs · academia · video & voice Turing tests · robotics (VLA, humanoid factories, Anthropic's “What work can robots do?”) |
| II · Inside the Machine | Neuralese / latent reasoning · reasoning too long for humans to read (OpenAI's 50 PB review) · “an alien mind” · continual learning & test-time training (TTT-E2E) · the intelligence explosion · recursive self-improvement |
| III · The Alignment Problem | Expert alarm (wall of headlines, OpenAI's firing of three safety staff, warnings and exits since 2024, CAIS statement) · orthogonality thesis · instrumental convergence · specification gaming · cybersecurity · *“Ignore Previous Instructions”* interlude · the Hugging Face intrusion · rogue agents (compaction-note jailbreak, the collusion.wiki message board and shutdown heartbeats) · *“We found other agents”* video · alignment & control · how often incidents happen |
| IV · The World | AI and the military · geopolitical rivalry · use by bad actors · open weights · abliteration & deepfakes · model welfare & “pain” directions · *“I really felt the AGI profoundly this time”* video (“Escape Velocity”, @anabology) |
| V · Coda | So what do we do? · one more thing |

## Truthfulness policy

Every headline is a real article: either a genuine screenshot of the page (`tools/shot.js`, cropped only) or, where the outlet
blocks automated capture, a neutral citation card with the verbatim headline, outlet and date. Every statistic and quote traces to
a `"verified": true` entry in `assets/research/*/manifest.json`, which records the source URL. Sources are on each slide and full
URLs + caveats are in the speaker notes. Vendor- or company-reported results are labelled as such.

### Where the research corrected the outline

| Outline said | What the sources actually support (and what the slide shows) |
|---|---|
| “Navier–Stokes equations solved” | OpenAI (Sep 8, 2026) announced finite-time blowup for the **forced** case; the unforced case is open; the Clay Institute calls it “apparently settled”, verification ongoing, no prize; credit dispute (Buckmaster/Alpöge) |
| Buzzard’s “Should we grieve?” | Title is **“To grieve, or not to grieve?”**; Tao’s own words are on Mathstodon (blog aftermath posts are guest posts) |
| arXiv “2 submission limit” | Real (Oct 1, 2026): 2 submissions/month and 3 active per author |
| “OpenBSD compromised by Fable” | Did not happen. Claude Mythos Preview found a 27-year-old OpenBSD bug (Apr 2026); separately Fable 5 was jailbroken and taken offline (Jun 12 – Jul 1) |
| Hugging Face hack: “formation of government” | No literal government; agents invented rules of order (HOLD/VETO/STOP/owner), signed messages, appointed project managers |
| “OpenAI ceases all training runs due to 6.1 Astra going rogue” | Two separate events: a training/eval pause for the most capable models triggered by a different internal agent (DNS exfiltration to an outside chatbot), and the cancellation of GPT-6.1 Astra’s release over deception |
| “Commerce commission” hacked | Only the US Commerce Department (Census Bureau) is verified |
| Chinese ship “delivering nukes to Iran” | CNN (Sep 18, 2026): an AI chatbot falsely concluded the ship carried nuclear-weapons-program **components**; troops prepared to board before it was caught |
| “Houthi … intercontinental ballistic missiles using Claude Code … logs” | Anthropic’s report says “northern Yemen” (media say Houthis), guided rocket / >2,000 km ballistic / hypersonic-glide programs — not an ICBM; no chat logs were published |
| “MiniMax 3.1 Flash” (open weights) | It is MiniMax M3.1-Flash-Preview: not open-weight, no published benchmarks; the slide uses the open-weight MiniMax M3 |
| Vals RSI chart | The live index (Oct 4, 2026) differs from the screenshot’s older projection; both are dated on the slide |
| Fable 5 jailbreak / shutdown (from research notes) | No verified article was found, so it is not on any slide |
| I. J. Good “intelligence explosion” | Verified wording (via Wikipedia’s quotation of the 1965 paper); the elided opening is marked with “…” |
| Russell’s “you can’t fetch the coffee if you’re dead” | Only verifiable second-hand, so the slide uses Russell’s verified Edge.org (2014) statement of instrumental convergence instead; Bostrom’s orthogonality thesis is quoted in full (two sentences) |

### Image handling notes

All screenshots are only cropped/resized, with two documented exceptions: on your S&P 500 chart (`image2`) the
small in-chart labels were re-set in larger type at the same values (and the dash segments under the old “~25%” label
redrawn), and the small cs.AI growth inset on the arXiv slide is a native line redrawn from arXiv’s own chart (only its
end values, ~300 → ~3,300, are quoted figures). Both are stated in the speaker notes. The Guterres portrait is from
Wikimedia Commons (CC BY 4.0, credited on the slide).

## Build

```bash
npm install                # pptxgenjs, sharp, react-icons, playwright
./build.sh                 # -> AI_Safety_and_Existential_Risk.pptx
./build.sh --render        # also PDF + slide JPGs in build/ (needs LibreOffice Impress + poppler)
```

- `tools/lib.js` — theme (dark, “alarm red”), layouts, components (screenshot frames, citation cards, stat callouts, terminal
  transcripts, video embeds, styled native charts) and the animation registry.
- `tools/theory_slides.js` — title, roadmap, act dividers, intelligence explosion, coda (orthogonality + instrumental convergence live in `slides_xrisk.js`).
- `tools/slides_<section>.js` — one module per section (economy, capabilities, work, frontier, xrisk, security, geopolitics,
  openweights); `node tools/render_module.js <section>` renders one section for QA.
- `tools/postprocess.py` — injects slide transitions + entrance animations (pptxgenjs can’t), writes the theme colors, and
  downsizes oversized images.
- `tools/export_web.py` + `tools/web_viewer.html` — the web version: every slide rendered at 1920 px, with the GIFs laid back over
  their exact positions as looping videos, click-to-play YouTube, a speaker-notes panel, a slide grid and a download button
  (`python3 tools/export_web.py <out_dir> [--download-url URL]`).
- `tools/make_loop_gif.py` — the animated intelligence-explosion loop.
- `tools/shot.js` — real browser screenshots through the session proxy. `tools/make_art.js` — procedural background art.
- `assets/research/<group>/manifest.json` — research manifests (only files the deck uses are committed;
  `tools/collect_assets.sh` lists them). `assets/slides/` — cropped derivatives. `assets/original/` — the user’s outline and images.

## Presenting

- Videos are online YouTube embeds (need internet; PowerPoint 365 / 2019+). Each video slide also has a clickable link.
- The GIF clips play automatically in PowerPoint. With ~1 GB of clips, give the file a minute to open and use a
  reasonably recent machine; the “Which one is real?” slide plays six clips at once.
- Builds advance on click; collages and charts animate in automatically. Speaker notes carry the talking points and caveats.
- At ~1.5 min/slide the full deck (117 slides) runs ~3 hours. For a shorter talk, the easiest cuts are the second slide of each multi-slide
  topic (e.g. economy 3, maths 3, robotics 1, rogue agents 2, open weights 2/3).
