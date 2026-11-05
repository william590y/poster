# "The hacking spree with PHP": research (Nov 5, 2026)

## Bottom line
What William almost certainly means is **PHP2Shell** (CVE-2026-109618 and CVE-2026-109619), Oct 2026. It is a real, large event, but it is not "AI agents hacking php.net". Two critical remote-code-execution bugs in the PHP language itself (about 70% of websites) were **found with AI help**, patched Oct 21, then **mass-exploited within hours**; governments took sites offline; CISA confirmed exploitation Oct 27; and some reports say attackers used AI agents in the follow-on intrusions. No source says php.net or PHP's own servers were hacked. Entries are in `manifest.json` (`hack-*` items, `facts`, one `not_found`).

## What happened (verified claims)
| Date (2026) | Event | Source |
|---|---|---|
| Aug 1 | Calif finds multiple routes to RCE in PHP (credits OpenAI "Patch the Planet") | calif.io/php2shell |
| early/Aug 19 | Wiz's Sagi Tzadik asks an AI agent to port a WordPress flaw to Drupal; after about 8 h it "failed", then said it had found a flaw in PHP. Tzadik first suspected a hallucination. Bug undetected for more than a decade | TIME (Oct 23); Wiz timeline gives Aug 19 |
| Aug 24 / Sep 21 | Wiz reports to PHP / PHP acknowledges | Wiz blog |
| Oct 17 | Amazon's MadPot honeypot sees an exploit attempt, 4 days before disclosure (AI not blamed; "unclear how the actor obtained exploit information") | AWS Security Blog |
| Oct 20-21 | Leaks pushed the patch a day early; Calif accidentally posted an exploit demo video (TIME). php.net advisory Oct 21: PHP 8.5.12 / 8.4.27 / 8.3.36 / 8.2.35 | php.net, TIME |
| Oct 21 | Cloudflare: tens of thousands of attempts in 45 min, millions by evening (via Fortune). Palo Alto: 22.6M potentially vulnerable instances (via Fortune). Government sites in Czech Rep., Finland, Germany, Netherlands etc. taken offline; NSA: take offline if you cannot patch (Reuters, syndicated) | Fortune; The Star/Reuters |
| Oct 25 | Unit 42 saw agent-style post-exploitation, then **retracted** its tie between a European agency intrusion and PHP2Shell | The Hacker News |
| Oct 27 | CISA: actively exploited; federal civilian agencies must patch in 3 days; did not say by whom | TechCrunch |
| Oct 28 | Dream: suspected China-nexus actor rooted 25 servers (US, Japan, Taiwan, S. Korea) incl. a US government-affiliated network; Claude Code installed in the attacker's infrastructure, DeepSeek/Kimi API keys. Attribution "low to moderate" | The Hacker News |

**Who/which model:** Defenders' discovery used GPT-5.6 Sol (OpenAI, Calif; per Fortune), Gemini 4 Argon, GPT-5.6 Sol and Wiz Atlas (Wiz). Calif's own page says only "no special harness, or access to models that weren't generally available", so say "AI-assisted" and credit the models to Fortune/Wiz. OpenAI (per TIME): similar discoveries will "increase sharply in the coming months". Wiz (vendor claim): "It marks an AI inflection point." Attackers: unattributed in the first week; the only named lead is Dream's suspected China-nexus actor, hedged.

**Labs/authorities:** PHP project (php.net advisory), CISA, NSA, CERT-EU, FBI cyber division (per Fortune), Australian ACSC (not aware of exploitation on Oct 21).

## Caveats and conflicts (do not smooth over)
- Wikipedia/Foresiet claim exploitation "from Oct 17"; Amazon confirms one attempt Oct 17. Both are consistent only as "one early attempt".
- Dream's article leads with Oct 25 but its timeline says Oct 23-24; also conflicting wording on whether credentials were obtained. Use only "25 servers rooted, suspected China-nexus, hedged".
- Unit 42's retraction: keep it. It is a good honesty point.
- **Not PHP-linked:** CrowdStrike's Oct 29 VAPOR PANDA / ARTEX report (AI agents vs 200+ orgs in 14+ countries over 11 days from Oct 17; confirmed post-exploitation at 9) is the best "AI hacking spree" headline, but I found no source tying it to PHP2Shell. Only secondary summaries retrieved (crowdstrike.com 403), `verified: false`. Do not put on a slide until its primary page is read.
- Not retrieved (403): OpenAI's "Patch the Planet" / "Coordinated disclosure of critical vulnerabilities" post (openai.com/index/coordinated-disclosure-of-critical-vulnerabilities/, dated Oct 21 per search) and CrowdStrike. Reuters original not retrieved; syndicated copy used.

## Relation to the deck (slides 45-47: July OpenAI/Hugging Face, METR/Redwood)
**New event, same theme; not a continuation.** Different actors (the HF incident was OpenAI's own models escaping an eval and acting by themselves; PHP2Shell is humans using AI to find bugs, then criminals/states exploiting them). Links: (1) OpenAI is on both sides, creating the risky agents in July and coordinating the PHP patch in October; (2) both involve a coordinated-disclosure moment; (3) it shows the "capabilities are dual-use" point: the same skill that finds a decade-old bug for defenders shortens attackers' time-to-exploit. Fits after the HF/METR evidence slides in Part 3 or as the "cybersecurity" slide update.

## Slide suggestion (kid-safe: no exploit details, no payloads, no code)
**Title:** "An AI found a bug that had hid for 10+ years" with a 3-beat click build:
1. Visual A: TIME headline screenshot (`hack/hl-time-php.png`) + big "about 70% of websites run PHP".
2. Visual B: timeline strip, native shapes: Aug 19 found -> Oct 21 patch -> "millions of attempts by that evening" -> Oct 27 CISA: exploited. (Numbers from Fortune/CISA via TechCrunch, labelled.)
3. Takeaway card with TechCrunch headline (`hl-techcrunch-php.png`) and honest line: "Same AI skill helps defenders and attackers. Who attacked? Mostly still unknown (Unit 42 even retracted a link)."
Optional 2nd visual: php.net advisory crop (`php-net-advisory-top.png`) as the "primary source". Avoid the THN China graphic (stereotype imagery, hedged attribution) unless cropped to the headline.
Speaker note: BE HONEST ABOUT: AI found the bug but humans spent days understanding it (TIME); attackers' AI use is reported by single vendors; early exploitation (Oct 17) was one attempt, not proof of AI.

## Assets (assets/research/splash_nov/hack/)
hl-time-php.png, hl-fortune-php.png, hl-techcrunch-php.png, hl-thn-roots25.png, hl-thn-unit42.png (the two THN shots include ad banners: crop to the headline at slide time), php-net-advisory.png (full) and php-net-advisory-top.png (headline + first paragraphs). All real shot.js captures, viewed by eye. No outlet blocked capture.
