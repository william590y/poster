# Economy and markets around AI, Jul-Nov 2026 (Splash research stage "r-econ")

Researched Nov 5, 2026. Everything below is traced in `manifest.json` (ids `econ-*`, facts, dataset `econ-series`).
Screenshots are in `assets/research/splash_nov/econ/` (real captures via tools/shot.js, cropped only).
Chart data: `assets/research/splash_nov/econ_series.json`.

## Headline finding: TODAY (Nov 5) is the event

Nov 5, 2026 (the day this was researched) is a very large AI-led sell-off. Intraday (AP, 1:46 pm ET): S&P 500 -3.9%, Dow -3.1%,
Nasdaq -5.2% and more than 10% below its October record ("correction"), Nvidia -8.7%, AMD -15.5%, CoreWeave -12.5%, every S&P sector
down, worst day since the April 2025 tariff shock. Brent oil about $98 (Iran war). FRED has not published Nov 5 yet (next release Nov 6),
so the chart ends Nov 4; Nov 5 must be added from a close (see "Nov 5 close" below) and re-checked on Nov 6.

AP's explanation (cite as AP's, not ours): AI data-center stocks "have been swinging for months on worries that the construction of further
AI data centres may slow because of how expensive it's become to borrow money", and Tuesday's Democratic midterm wins "raised the possibility that
governments could force pauses in construction of more data centres". This ties directly to William's data-center-moratorium slide (46 states).
Caution: that is AP's reading of the market's reasoning, not a fact about policy.

## What the S&P 500 data actually shows (FRED, Jul 1 - Nov 4 closes, 89 trading days)

- The S&P 500 was never wild through Nov 4: range 7,316 (Jul 29) to 7,819 (mid-Aug), about 6%. Biggest daily move -1.82% (Oct 30).
- The swings were concentrated in AI/chip stocks and the Nasdaq (Nasdaq -2.86% Oct 30; +2.78% Jul 30). VIX stayed 14-21 (peak 21.15 on Nov 2). VIX Nov 4: 16.61.
- So the kid-level message is honest only as "the AI part of the market is swinging hard", not "the whole market is crashing" (until Nov 5).
- Top moves (S&P / Nasdaq): Oct 30 -1.82/-2.86; Aug 4 +1.79/+2.59; Jul 30 +1.66/+2.78; Nov 4 +1.58/+1.44; Jul 29 -1.52/-1.74; Sep 21 +1.49/+2.26.

## Timeline with dated, fetched sources (each page was opened and read)

| Date | What | Source |
|---|---|---|
| Jul 28 | Nasdaq-100 briefly in correction, chip index in bear market; SanDisk -14% | NBC News (Kopack) |
| Jul 29 | S&P -1.5%, Dow -1,153; Brent +7.3% as Iran-war fighting resumed; Fed holds | Fortune/AP (Choe) |
| Aug 4 | Rebound to record highs on Hormuz-deal hopes, chips, earnings (Palantir +29%) | Yahoo Finance live blog headline (search snippet only for the body; FRED confirms +1.79%) |
| Aug 26-27 | Nvidia quarterly revenue nearly $100bn; stocks up Aug 27 (S&P +0.7%, Nasdaq +1.6%, FRED) | Guardian (already in economy manifest) |
| Oct 13 | IMF Global Financial Stability Report: AI-price correction a top risk | RTE quoting the IMF; IMF eLibrary record |
| Oct 20 | Ken Griffin: "almost certainly bubbles" in AI | Yahoo Finance / Bloomberg |
| Oct 22 | Nasdaq -2.6%, S&P -1.2%: Meta raises capex, AI-debt fears (secondary sources only; headline not captured) | Investing.com / Bloomberg summaries |
| Oct 28 | Fed holds 3.75-4.00%, two dissents for a HIKE | CNN, Schwab |
| Oct 29 | Alphabet -12.6%, worst day since 2004 IPO, about $482B | Fortune |
| Oct 30 | S&P -1.8%, tech loses >$1 trillion, Intel -29%; Amazon still plans ~$220B capex | NBC News |
| Nov 4 | Midterm relief rally: Dow +3%, S&P +1.6% (FRED 7,688.62) | AP/Yahoo; FRED |
| Nov 5 | AI sell-off, S&P -3.6% to -4% intraday | AP via BNN Bloomberg; Yahoo Finance |

## Credible-voice warnings (use sparingly, name who and what they did NOT say)

- IMF (Oct 13): says an AI correction is a plausible near-term trigger for "market turmoil"; also said risks are "elevated" yet markets held up on strong earnings. It warned of risk, it did not predict a crash.
- Ken Griffin (Oct 20): "almost certainly bubbles"; also said bubbles can leave durable leaders and he is not telling people to sell.
- Not found: any Fed chair remark on AI valuations; BoE statement unverified. Fed chair is Kevin Warsh; the live Fed debate is about raising rates for inflation.
- Numbers seen only in low-authority secondary blogs (not used): $1.4T "circular" AI financing, seven firms >35% of the S&P, 0.4-point growth hit. Verify in the IMF report PDF before use.

## Layoffs attributed to AI (honest picture)

Challenger (published Nov 5): 43,994 announced cuts in Oct (lowest October since 2023). AI cited for only 1,265 in Oct (lowest month of 2026) but 121,401 year to
date, about 20% of all announced cuts; "market/economic conditions" has now overtaken AI as the top stated reason. Technology leads all sectors at 171,501 cuts YTD.
Do not claim "AI is causing a layoff wave right now"; claim "about 1 in 5 announced cuts this year cite AI, but the monthly count fell". Counts are company announcements.
Earlier Challenger headline (AI leads layoffs for 5th month) is already in the economy manifest (Aug 6).

## Reusable images already in the repo

assets/research/economy/: guardian_ai_selloff.png (Jun 23), fortune_bigtech_capex_revolt.png (Jul 26), guardian_ai_bubble_collapse_threat.png (Sep 20),
guardian_nvidia_revenue_100bn.png (Aug 26), challenger_ai_leads_layoffs. New captures in econ/: hl-nbc-tech-1tn, hl-fortune-alphabet, hl-fortune-dow-jul29,
hl-nbc-nasdaq100-correction-jul28, hl-rte-imf, hl-yahoo-griffin, hl-cnn-fed-oct28, hl-schwab-fed, hl-challenger-oct.
Blocked (not used): CNBC pages (Access Denied), Bangkok Post.

## What the existing decks say

Adult deck tools/slides_economy.js: ECONOMY 1 (AI-linked stocks about 45% of S&P market cap, BeInCrypto Apr 24), 2 (capex), 3 (GDP without data centers),
then the "information is physical" run. The Splash deck has nothing on markets (only electricity/Abilene/gigawatt slides in Part 1). Nothing there covers volatility.

## Suggested kid-level framing (2 slides, optional 3rd)

1. "Money is pouring in..." (reuse capex/valuation visuals): companies plan hundreds of billions on AI data centers (Amazon about $220B in 2026).
2. "...and markets are swinging": line chart of Nasdaq (or S&P) Jul-Nov with 4 annotated days (Jul 29, Aug 4, Oct 30, Nov 4) plus a final callout for Nov 5; side stack of 3 headline cards
(Alphabet Oct 29, NBC Oct 30, Nov 5 AP). Plain line: "Investors keep asking: will all this spending pay off?"
3. Optional: "Bubble or boom?" two voices (IMF, Griffin) with "nobody knows; this is what safety people call uncertainty".
Rules: no investment advice; call the Nov 5 numbers "as of the time of writing"; say plainly that a stock-market drop is not proof AI is failing, and a rise is not proof it is safe.
Link to the class: if AI progress slows or speeds up, money and politics shift (data-center pauses), and fast-moving money is part of why labs race.

## FRED licence and attribution

Credit on the slide: "S&P 500: S&P Dow Jones Indices LLC via FRED, Federal Reserve Bank of St. Louis; Nasdaq Composite: NASDAQ OMX via FRED; VIX: Cboe via FRED".
FRED shows "Source: S&P Dow Jones Indices LLC via FRED" for SP500. S&P DJI data on FRED is for non-commercial use with attribution; do not post the raw CSV publicly.
The exact FRED copyright note could not be fetched here (the series page notes did not render), so confirm it on https://fred.stlouisfed.org/series/SP500 if the deck goes online.
A hand-drawn native chart of ~90 daily points is fine for a class; keep it a line chart (no investment forecasts).

## Caveats for notes (BE HONEST ABOUT)

- Explanations of daily moves are the press's reading, not proven causes. Different outlets round differently ($475B vs $482B vs $500B for Alphabet; use Fortune's $482B, the one on the slide).
- Intel -29% (NBC) vs smaller numbers in snapshots: use NBC's closing figure.
- Nov 5 is intraday until the close is recorded below.

## Nov 5 close (recorded 21:02 UTC, after the 4 pm ET close)

Yahoo Finance page ticker (page showed "markets closed"): S&P 500 7,353.81 (-4.35%), Dow 51,522.58 (-3.44%), Nasdaq 24,315.00 (-5.52%), VIX 26.76 (+60%).
Headline captured: econ/hl-yahoo-nov5-close.png, "Stock market today: Dow plunges 1,800 points, Nasdaq enters correction in AI trade meltdown".
PROVISIONAL: not from FRED. FRED publishes Nov 5 on Nov 6; re-pull SP500, NASDAQCOM, VIXCLS and replace `nov5_provisional` in econ_series.json. The AP/BNN page still showed
intraday text at 21:02 UTC (S&P -3.6%, "worst day since April 2025 tariffs"); do not quote the AP intraday numbers once the close is known.
The S&P 500 band was about 6% through Nov 4; with Nov 5 the Nov 5 close (7,353.81) is below the Jul 29 low (7,316.15) only by being close to it: it is NOT a new low for the window (7,353.81 > 7,316.15).
