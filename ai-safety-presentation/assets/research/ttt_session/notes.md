# Research extracted from session_01E5J9TRaKyQss129GaME7pC ("GPU allocation for ttt-pipe ladder")

## What that session is
- A Claude Code session running on the user's Cornell cluster since 2026-09-22. It has gone through several compactions (about 6.1M tokens dropped).
- Most of it is the user's own ML work:
  - music transcription in the `anticipation3` project: DAgger ladders, Muon weight-decay ablations, a Lakh stage-1 run, and test-time-training workflows such as `ttt-wholesong-stabilise` and the "ttt-pipe ladder" in the title;
  - world-model experiments (TRPO path-integral, H-Net temporal abstraction);
  - a self-play paper replication.
- On 2026-10-03 (evening, US time) the user started the **same AI Safety deck** there, uploading the same 29-slide outline:
  - 13 research agents (t01 to t13) collected sources. t06 was "Neuralese / Continual learning & TTT / RSI".
  - At 00:58 UTC the user told the session to stop the agents and build the deck itself. It is building with pptxgenjs in `/share/ellis/wjl86/aisafety_deck/`, with planned output `/home/wjl86/AI_Safety_and_Existential_Risk_v2.pptx`.
  - Those files are on the user's cluster and cannot be reached from here.

### How much of the transcript was read
The transcript runs at roughly 100 events every 1 to 2 minutes for 12 days, so paging all of it was not feasible.
- **Read:** everything from 2026-10-04 00:40 UTC to the live end (about 01:14 UTC), which is the whole deck episode, plus the 00:45 compaction summary of everything before it.
- **Not read:** the earlier days. `has_more` was still true.
- Thinking blocks in the transcript are redacted, so they contain no text.

## 1. Continual Learning & Test-Time Training (the main slide)
Neither the research agents nor the session's notes contain any results from the user's own TTT work. The t06 agent did not reach TTT before it was stopped. The main session then pulled TTT-E2E Figure 1 itself (`assets/extra/ttt_fig1_combined.png`, deck key `ttt_fig`). I re-downloaded and re-rendered it here.

**End-to-End Test-Time Training for Long Context (TTT-E2E)**
- arXiv:2512.23675, submitted 29 Dec 2025 (v2 31 Dec 2025). https://arxiv.org/abs/2512.23675. Code: https://github.com/test-time-training/e2e
- Authors: Arnuv Tandon, Karan Dalal, Xinhao Li, Daniel Koceja, Marcel Rød, Sam Buchanan, Xiaolong Wang, Jure Leskovec, Sanmi Koyejo, Tatsunori Hashimoto, Carlos Guestrin, Jed McCaleb, Yejin Choi, Yu Sun.
- Abstract, verbatim:
  - "We formulate long-context language modeling as a problem in continual learning rather than architecture design."
  - "our model continues learning at test time via next-token prediction on the given context, compressing the context it reads into its weights."
  - "for 3B models trained with 164B tokens, our method (TTT-E2E) scales with context length in the same way as Transformer with full attention, while others, such as Mamba 2 and Gated DeltaNet, do not. However, similar to RNNs, TTT-E2E has constant inference latency regardless of context length, making it 2.7 times faster than full attention for 128K context."
- Fig. 1 caption, verbatim:
  - "Our method (TTT-E2E) turns the worst line (green) into the best (blue) at 128K context length."
  - "TTT-E2E has constant inference latency regardless of context length, making it 2.7× faster than full attention for 128K context on an H100."
- **Files:**
  - `ttt_e2e_fig1_combined.png` (3700x1480) and the two panels `ttt_e2e_fig1_left_loss.png` and `ttt_e2e_fig1_right_latency.png`. These were rendered from the paper's own SVGs (`ttt_flagship.svg`, `ttt_timing.svg`) and checked visually.
  - `ttt_e2e_fig1_data_extracted.json` holds the exact series, recovered from the SVG vector geometry. They can be used for a native chart.
- **Key numbers** (prefill seconds per 1K tokens at 8K / 16K / 32K / 64K / 128K):

  | Model | 8K | 16K | 32K | 64K | 128K |
  |---|---|---|---|---|---|
  | Full attention | .0137 | .0169 | .0239 | .0388 | .0734 |
  | TTT-E2E | .0252 | .0251 | .0258 | .0264 | .0274 |

  The ratio at 128K is 2.68×, which matches the paper's "2.7×". TTT-E2E's loss Δ vs full attention stays between -0.014 and -0.012 at every length. Sliding-window attention degrades to +0.048 and Mamba 2 to +0.032 at 128K.
- **Caveats for the speaker notes:**
  - Table 2: "Transformer with full attention dramatically outperforms the other methods, including ours, especially in long context" on needle-in-a-haystack. Memory stored in the weights is lossy.
  - Fig. 8: "training latency is still a significant limitation".
  - The paper only tests up to 128K. "Effectively infinite context" is an extrapolation of the constant-latency curve, not a result in the paper.

**Follow-on paper, 2026:** *Self-Guided Test-Time Training for Long-Context LLMs* (S-TTT), arXiv:2607.09415, 10 Jul 2026, by Zhu, Xu, Wei et al. It reports "up to a 15% relative improvement" on LongBench-v2 and LongBench-Pro. The abstract was verified here.

## 2. Neuralese / latent reasoning (verified here)
**OpenAI, "An Alien Mind"**
- By Jakub Pachocki, Chief Scientist, dated 6 Sep 2026. https://openai.com/index/an-alien-mind/
- openai.com blocks curl, so the page was fetched via TinyFish.
- Verbatim:
  - "This tool continues to be critical as we study the Astra class of models. However, unfortunately our evaluations indicate our ability to rely on CoT monitoring is progressively diminishing."
  - "The AI is becoming better at reasoning about and manipulating its own reasoning process."
  - "With improved pretraining performance, we also see the models become much smarter even without using verbalized reasoning at all."
  - "AI is *grown* more than *designed*"
  - "Currently I believe that no lab has solved alignment and monitoring to a sufficient degree to continue responsibly scaling at maximum speed for much longer."
  - "...not left behind by unchecked progress, brought about by an alien intellect exceeding our own."

**TechCrunch, 2 Sep 2026, Russell Brandom: "OpenAI's new reasoning technique alarms AI safety experts"**
- Dek: OpenAI's new Astra model will use "recurrent depth," a technique that allows it to operate outside sequential thinking, making the model's chain of thought harder to monitor.
- Quote from Buck Shlegeris (Redwood): "...they'll have the option to massively increase the recurrence and totally destroys CoT monitorability."
- Quote from Ryan Greenblatt: "...scaling up the opaque reasoning to the point where the model reasons entirely or almost entirely in latent space."

## 3. Recursive self-improvement (verified here)
**OpenAI, "Research acceleration: The view inside OpenAI", 6 Sep 2026**
- "we have now reached the goal ... of having an automated research intern by September of this year"
- "We are making strong progress toward creating an automated AI researcher by March of 2028."
- The research organization uses "3.1 agent-workdays of effort for every workday of human labor" as of mid-August.
- The median researcher spends more than $600 a day on agent inference; the 90th percentile spends more than $7,000 a day.
- RL training was paused for about two weeks after the Hugging Face incident (July 20).
- Astra-class GPU allocation fell a further 59.2% after the 7 Aug cyber-capability finding.

**Anthropic, "When AI builds itself", updated 18 Sep 2026** (fetched with a summarizer, so re-check exact wording before putting it on a slide)
- "more than 80% of the code we merge into Anthropic's codebase was authored by Claude"
- "8× as much code per day as ... in 2024"
- Speedup on optimization tasks went from about 3x with Opus 4 to about 52x with Mythos Preview (April 2026).
- Success on the most open-ended tasks reached 76% (May 2026).
- In comparisons against researcher judgment, the model beat the human choice 51% of the time with Opus 4.5 (Nov 2025) and 64% with Mythos Preview (Apr 2026).

**Vals RSI Index** (https://www.vals.ai/benchmarks/rsi_index), live page as fetched 2026-10-04
- Scores: Claude Opus 5.5 37.31%, Fable 5.1 36.09%, Opus 5 33.02%, Gemini 4 Argon 30.55%.
- Key takeaway: "Anthropic is on track for frontier-level AI researchers by July 2027"; the trend "reaches 0.6 in July 2027".
- The user's outline image shows an older extrapolation (50% by Mar 2027 / Jan 2028), so the live page has changed. Date whichever version is used.

**Headlines captured by the other session's t06 agent** (screenshots exist only on the user's cluster; not re-verified here; full list with URLs in `session_extracts/catalog_t06_cognition_rsi.txt`)
- Guardian, 2 Dec 2025: "'The biggest decision yet': Jared Kaplan on allowing AI to train itself"
- TIME, 7 Aug 2026: "Inside the Race to Make AI Build Itself"
- MIT Technology Review, 18 Aug 2026: "AI's recursive self-improvement might not come so quickly after all"
- Reuters via KSL: "Anthropic says Claude now leads a quarter of work building its next AI models"
- AP via ABC News: "Will AI models achieve the ability to improve autonomously? Leading labs say..."
- The agent also collected charts: OpenAI's agent-workdays, lines changed, task success, RL-compute pause and experiment velocity; Anthropic's R&D automation index and code-per-person 8x.

## 4. Benchmarks and compute (gathered by the other session; not re-verified)
**FrontierMath Tier 4 (v2), best score over time**, from Epoch CSVs parsed in the session (`session_extracts/frontiermath_tier4_best_score_progression.txt`). Epoch's page confirms that v2 exists and that it corrected 12 Tier-4 problems.

| Date | Best model | Score |
|---|---|---|
| Jan 2025 | o3-mini | 0% |
| Aug 2025 | GPT-5 | 22% |
| Dec 2025 | GPT-5.2 Pro | 46% |
| Apr 2026 | GPT-5.5 Pro | 78% |
| Jun 2026 | Claude Fable 5 | 90.2% |
| 3 Sep 2026 | GPT-6 Astra | 97.6% |
| 29 Sep 2026 | GPT-6.1 Sol | 100% |

**Compute datasets** from the session's t01 `charts.json`, with sources (`session_extracts/t01_compute_charts_json_summary.txt`):
- Big Tech capex 2018 to 2026: the four companies' total rose from $66.7B to $376B (2025) to about $760B (2026 guidance).
- IEA global data-centre electricity: 485 TWh in 2025, projected 950 TWh in 2030.
- Epoch: record compute in a single data center doubles about every 7 months.
- Also in that file: largest data-center IT power, the Stargate sites, the GE Vernova turbine backlog, PJM prices, and projects blocked by local opposition.

**Other**
- The session's t05 data includes Tavus' Griffin-Lite video-call study: 48.1% of participants (26 of 54) said "real person". This is a vendor study with no control arm.
- Jones & Bergen (arXiv:2503.23674): GPT-4.5 with a persona prompt was judged human 73% of the time.

## 5. The user's own experiments
- The session title and workflow names (`ttt-wholesong-stabilise`, "ttt-pipe ladder") show the user ran **test-time training for whole-song music transcription** in the `anticipation3` project.
- No TTT results appear in the part of the transcript I read.
- The compaction summary lists music metrics (for example "wdqk val 12.35 / test 9.21"), but these come from unrelated weight-decay and DAgger runs and are not TTT results.
- **Nothing here can honestly be shown as "our experiments" on the TTT slide.** If wanted, ask the user for their TTT ladder numbers directly.

## Files
- `ttt_e2e_fig1_combined.png`, `ttt_e2e_fig1_left_loss.png`, `ttt_e2e_fig1_right_latency.png`: the slide figures.
- `ttt_flagship.svg`, `ttt_timing.svg`, `abs_2512.23675.html`: original sources.
- `ttt_e2e_fig1_data_extracted.json`: exact series for native charts.
- `manifest.json`: follows the RESEARCH_BRIEF schema. Items have `verified: true` only where I re-fetched the source myself.
- `session_extracts/`:
  - t06 catalog;
  - t01/t02 catalog;
  - compute charts;
  - FrontierMath progression;
  - the user's outline slide text;
  - the session's 13 topic briefs.
