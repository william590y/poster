# Data-center moratoriums and the map (researched Nov 5, 2026)

## Bottom line: what "46 states" actually is
William's "moratoriums in 46 states" is NOT true as stated. The 46 is a tracker count:
- Electric Choice tracker (Eisenbach Consulting, updated Oct 15, 2026): "575 active restrictions across 46 states". It counts moratoriums, permanent bans, zoning limits, executive orders AND pending/stalled/failed bills and tax-incentive pauses. Alaska, Hawaii, West Virginia, Wyoming have none. https://www.electricchoice.com/datacenters/moratoriums/
- SAVRN (Sep 28, 2026): "46 states with state-level action" - 29 restriction in force, 1 admin pause, 11 pending, 5 failed/vetoed; 958 local jurisdictions in 49 states. https://savrn.com/blog/data-center-moratorium-tracker-update-2026-09-28

What is true on Nov 5, 2026:
- Statewide pauses in effect: 3 states, all by governor directive, all limited in scope. New York (EO 62, Jul 14: DEC permits for 50 MW+ paused up to a year), Texas (Abbott: ERCOT grid connections halted Aug 3, TCEQ permits halted Sep 21, pending an audit; critics say not a true moratorium), Oregon (Kotek: state-land requests Sep 8; air and water pollution permits Oct 13, until July 2027).
- No state legislature has enacted a statewide moratorium. Maine passed one (Apr 14) and Gov. Mills vetoed it (Apr 24).
- Local moratoriums or bans are everywhere: 27 states local only, 13 more with local plus a statewide bill/plan/veto (40 states with local action in our dataset; SAVRN counts 49 states with local action; S&P Global, via search summary only, says 40).
- Safe slide line: "Tracker count: 46 states have some data-center restriction or bill. Statewide pause: 3 (NY, TX, OR). Local pauses: dozens of states."

## Dataset
assets/research/splash_nov/dc_moratoria_states.json: 50 states + DC. Categories (our reading of the tracker's per-state rows): statewide_pause 3 (NY, TX, OR), local_and_state_bill 13, local_only 27, state_bill_only 3 (SD, VT, VA), none_found 5 (AK, HI, WV, WY, DC). Every entry carries source_url (the tracker) and cross_check_urls where verified. Cross-checked: NY, TX, OR, VA, ME, MD, NJ, WA, DC.

## Caveats (say honestly)
- "Moratorium" ranges from a permit pause (NY) to a grid-connection audit (TX) to a state-land pause (OR) to local zoning bans. Many state "actions" (tax-break pauses in AZ/IL/NE/OH, cost laws) are NOT moratoriums; the map does not colour them as pauses.
- Pending vs enacted: bill-only states (amber/teal) have nothing in force statewide.
- The tracker is inconsistent (its 46 state counts sum to 679 not 575; NC/GA differ) and overstates Virginia EO 22 (by-right removal is only a 2027 proposal; Virginia Mercury). NJ town counts range 34 to 109 by source: quote no precise number.
- Texas: pause "remains in place" per Texas Tribune Nov 4; audit expected to end in December; governor-elect Gina Hinojosa (won Nov 3) has called for a moratorium until the Legislature meets in January.
- DC: none found (no entry in tracker; searches only found Maryland counties). Categories are tracker-based and may lag the last two weeks.
- Not verified directly: S&P Global (403) and GatherGov numbers; manifest marks them verified:false.

## Headline images (assets/research/splash_nov/dc/, real screenshots, cropped)
- hl-siliconangle-ny.png: "New York becomes first US state to impose a data center moratorium", SiliconANGLE, Duncan Riley, Jul 14, 2026.
- hl-routefifty-texas.png: "Data center approvals in Texas halted until audits completed, Gov. Greg Abbott says", Route Fifty / Texas Tribune (Paul Cobler), Aug 4 (Tribune Aug 3).
- hl-opb-oregon.png: "Gov. Kotek expands Oregon data center moratorium", OPB, April Ehrlich, Oct 13, 2026.
- hl-stateline-cities.png: "More cities are pressing pause on data centers as local backlash grows", Stateline, Robbie Sequeira, May 28, 2026.
- Citation card only (blocked): Texas Tribune, "Gina Hinojosa won the governor's race. What happens to Texas data centers now?", Emily Foxhall, Nov 4, 2026.

## Map
tools/make_dc_map.js -> assets/slides/splash_extra/dc_moratoria_map.png (3200x1800, dark, Albers USA, legend with counts, source line). Deps added: us-atlas@3, topojson-client, d3-geo. Red = statewide pause, amber = local + statewide bill/plan/veto, blue = local only, teal = bill only, grey = none found. East-coast small states labelled with leader lines.
Suggested build: reveal in clicks (grey base, blue local, amber bills, red three) and ask "Is it 46 states?" then correct it.
