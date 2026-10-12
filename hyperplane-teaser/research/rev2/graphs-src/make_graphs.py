#!/usr/bin/env python3
"""Builds ../graphs.json from raw source files in this folder (all fetched 10 Oct 2026).
Run:  python3 -I make_graphs.py   (from this directory)
Every number comes from a source file here, or from a deck constant noted inline.
No extrapolation: derived values are only sums, running maxima, ratios and unit conversions."""
import csv, json, os, collections, datetime as dt
import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'graphs.json')
DECK = '/home/user/poster/ai-safety-presentation/assets'
TODAY = '2026-10-10'


def P(*a):
    return os.path.join(HERE, *a)


def dec_year(iso):
    d = dt.date.fromisoformat(iso)
    ylen = 366 if (d.year % 4 == 0 and (d.year % 100 != 0 or d.year % 400 == 0)) else 365
    return round(d.year + (d.timetuple().tm_yday - 1) / ylen, 3)


def mon(iso, day=False):
    d = dt.date.fromisoformat(iso)
    return d.strftime('%-d %b %Y') if day else d.strftime('%b %Y')


def r(x, n=3):
    return round(x + 0.0, n)


items = []

# ------------------------------------------------------------------ Epoch data-centre timelines
tl = list(csv.DictReader(open(P('data_center_timelines.csv'), encoding='utf8')))
dcs = list(csv.DictReader(open(P('data_centers.csv'), encoding='utf8')))
by = collections.defaultdict(list)
for row in tl:
    by[row['Data center']].append((row['Date'], float(row['IT power (MW)'] or 0), float(row['Power (MW)'] or 0),
                                   float(row['Buildings operational'] or 0), row['Construction status']))
for k in by:
    by[k].sort()


def state(site, date):
    cur = None
    for rw in by[site]:
        if rw[0] <= date:
            cur = rw
    return cur


def total_mw(date, col=1):
    s = 0.0
    for site in by:
        cur = state(site, date)
        if cur:
            s += cur[col]
    return s


# sanity: Epoch hub headline = 13.8 GW IT power, 93 sites, 17.9 GW facility power
hub_it = sum(float(x['Current power (MW)'] or 0) for x in dcs)
assert len(dcs) == 93 and abs(hub_it - total_mw('2026-10-05')) < 1e-6, (hub_it, total_mw('2026-10-05'))
facility_now = total_mw('2026-10-05', 2)

# ---- 1. total IT power of the 93 tracked sites, quarter ends
qe = []
for y in range(2024, 2027):  # Epoch covers data centres operational from 2024 on (with exceptions), so start at Q1 2024
    for m, d in ((3, 31), (6, 30), (9, 30), (12, 31)):
        iso = f'{y}-{m:02d}-{d:02d}'
        if iso <= '2026-09-30':
            qe.append(iso)
qe.append('2026-10-05')
xl, vals, mws = [], [], []
for iso in qe:
    mw = total_mw(iso)
    mws.append(r(mw, 1))
    vals.append(r(mw / 1000, 3))
    q = (int(iso[5:7]) - 1) // 3 + 1
    xl.append(f"Q{q} {iso[:4]}" if iso != '2026-10-05' else '5 Oct 2026')
items.append({
    'id': 'dc-total-gw',
    'title': 'AI data centres: total power',
    'subtitle': 'Combined IT power of the 93 AI data centres Epoch tracks, gigawatts',
    'caption': 'Epoch\'s 93 tracked sites, about 43% of global AI compute',
    'kind': 'area',
    'x': xl, 'x_iso': qe, 'x_type': 'date',
    'x_label': 'quarter end', 'y_label': 'IT power (GW)', 'log_y': False,
    'series': [{'name': 'IT power of Epoch\'s tracked sites', 'values': vals, 'unit': 'GW', 'values_mw': mws}],
    'highlight': {'x': '5 Oct 2026', 'label': '13.8 GW across 93 sites'},
    'source': 'EPOCH AI · AI DATA CENTERS HUB · UPDATED 5 OCT 2026',
    'url': 'https://epoch.ai/data/ai-data-centers',
    'as_of': '2026-10-05 (Epoch hub "Updated Oct. 5, 2026"; downloaded 2026-10-10)',
    'verified_how': ('Downloaded Epoch\'s official CSVs (epoch.ai/data/data_centers/data_center_timelines.csv and data_centers.csv, CC-BY). '
                     'Each point = sum over all 93 sites of IT power (MW) in that site\'s latest timeline row dated on or before the quarter end. '
                     'Check: the sum at 5 Oct 2026 = 13,833.4 MW = the hub headline "13.8 GW IT power, 93 sites", and equals the sum of the Current power column. '
                     'Page text: "Total facility power is 20-50% higher ... pushing the real-world footprint of these 93 sites to 17.9 GW" '
                     f'(our sum of facility power at 5 Oct 2026 = {facility_now / 1000:.1f} GW).'),
    'notes': ('Derived sum (ours). CAVEAT, from Epoch\'s hub FAQ: the database covers "data centers that become operational in 2024 or later, with some exceptions", and Epoch estimates its coverage of global deployed AI computing capacity '
              'at 43% as of 10 Oct 2026 (90% CI 23% to 81%) versus 22% in Q1 2024 (CI 11% to 49%). So the rise partly reflects coverage improving, not only construction: say "tracked by Epoch", never "world total", and do not quote a growth multiple from this curve '
              '(use dc-record-mw for the growth story). Quarters before Q1 2024 (0.13 to 0.34 GW in 2023) exist in Epoch\'s CSV but are left out for that reason. Rows dated after 5 Oct 2026 (Epoch projections to 2030, 37.5 GW) are NOT used. '
              'Epoch on the page: the real-world footprint of the 93 sites is 17.9 GW including cooling overhead, "more than New York City\'s peak demand, at 11 GW" (deck: NYC summer peak 10,825 MW, NYISO 2026 Gold Book); 13.8 GW of IT power alone also exceeds that. '
              'Deck, with arithmetic in tools/slides_economy.js gigawattSlide: 1 GW running nonstop is roughly 850,000 average US homes.'),
    'image': f'{DECK}/research/economy/meta_richland_parish_hyperion.jpg',
    'image_credit': 'Meta (official aerial of Hyperion, Richland Parish, LA; Jul 2026), as used in the deck',
    'deck_ref': 'tools/slides_economy.js scaleSlide, gigawattSlide; assets/research/economy/rev2/gw_epoch_frontier_sites_power.csv',
})

# ---- 2. record-holder data centre (Epoch Data Insight, observed frontier)
rec = [('2024-08-03', 'Google Papillion', 237), ('2025-02-17', 'Colossus 1', 278),
       ('2025-06-23', 'Anthropic-Amazon New Carlisle', 398), ('2025-12-23', 'Anthropic-Amazon New Carlisle', 626),
       ('2026-03-23', 'Anthropic-Amazon New Carlisle', 910), ('2026-06-15', 'Colossus 2', 946)]
for d, site, mw in rec:  # cross-check against the timelines CSV
    st = state(site, d)
    assert st and st[0] == d and st[1] == mw, (d, site, mw, st)
items.append({
    'id': 'dc-record-mw',
    'title': 'The record data centre keeps doubling',
    'subtitle': 'Largest AI data centre by IT power at each record, megawatts',
    'caption': 'Observed records only (Epoch estimates)',
    'kind': 'step',
    'x': [mon(d) for d, _, _ in rec], 'x_iso': [d for d, _, _ in rec], 'x_type': 'date',
    'x_label': 'date of the record', 'y_label': 'IT power of the largest data centre (MW)', 'log_y': False,
    'series': [{'name': 'Record IT power (observed)', 'values': [m for _, _, m in rec], 'unit': 'MW'}],
    'point_labels': [f'{s}, {mon(d, True)}' for d, s, _ in rec],
    'highlight': {'x': 'Jun 2026', 'label': 'Colossus 2: 946 MW'},
    'source': 'EPOCH AI · DATA INSIGHT · FRONTIER DATA CENTER POWER · SEP 2026',
    'url': 'https://epoch.ai/data-insights/frontier-data-center-power',
    'as_of': '2026-09-04 (insight published; data updated Aug 31, 2026); last observed record 15 Jun 2026',
    'verified_how': ('Fetched the Epoch insight page and read its "Observed frontier" series (237, 278, 398, 626, 910, 946 MW; Google Papillion, Colossus 1, '
                     'Anthropic-Amazon New Carlisle x3, Colossus 2). Each value re-checked against Epoch\'s data_center_timelines.csv (same dates and MW). '
                     'Epoch\'s headline: "Since mid-2024, the record for the largest AI data center by IT power capacity has doubled every ten months. '
                     'The current record-holder is xAI\'s Colossus 2, at an estimated 950 MW."'),
    'notes': ('Only Epoch\'s observed points are plotted. Epoch also lists FUTURE (projected) records: 1,037 MW New Carlisle 19 Oct 2026, 1,531 MW Colossus 2 25 Feb 2027, '
              '1,676 MW Meta Hyperion 1 Jan 2028 (the CSV now says 1,632), 1,925 MW New Carlisle 17 Mar 2028, 2,263 MW Fairwater Wisconsin 13 May 2028; none are used here. '
              'Our own arithmetic on the observed points: 237 -> 946 MW is x3.99 in 22.4 months. Epoch lists the Colossus owner as "SpaceXAI"; the deck says xAI.'),
    'image': f'{DECK}/research/economy/epoch_sat_xai_colossus2_2026-06.png',
    'image_credit': 'Epoch AI annotated satellite image, 15 Jun 2026 (imagery (c) Airbus DS), as used in the deck',
    'deck_ref': 'tools/slides_economy.js scaleSlide; assets/research/economy/rev2/gw_epoch_power_doubling_chart.png',
})

# ---- 3. by site: now vs Epoch plan
sites = [('Colossus 2', 'xAI Colossus 2'), ('Anthropic-Amazon New Carlisle', 'Anthropic–Amazon New Carlisle'),
         ('Microsoft Fairwater Atlanta', 'Microsoft Fairwater Atlanta'), ('Meta Prometheus', 'Meta Prometheus'),
         ('OpenAI Stargate Abilene', 'Stargate Abilene'), ('Microsoft Fairwater Wisconsin', 'Microsoft Fairwater Wisconsin'),
         ('Colossus 1', 'xAI Colossus 1'), ('Meta Hyperion', 'Meta Hyperion')]
now_v, now_d, plan_v, plan_d = [], [], [], []
for key, _ in sites:
    cur = state(key, TODAY)
    now_v.append(cur[1]); now_d.append(cur[0])
    fut = [rw for rw in by[key] if rw[0] > TODAY]
    if fut:
        plan_v.append(fut[-1][1]); plan_d.append(fut[-1][0])
    else:
        plan_v.append(None); plan_d.append(None)
now_sorted = sorted(range(len(sites)), key=lambda i: -now_v[i])
assert now_sorted == list(range(len(sites))), now_sorted
items.append({
    'id': 'dc-sites-mw',
    'title': 'Where the gigawatts are going',
    'subtitle': 'IT power by site: today vs Epoch\'s planned build-out, megawatts',
    'caption': 'Dashed = Epoch\'s projection of the planned build-out',
    'kind': 'bar',
    'x': [n for _, n in sites], 'x_type': 'category',
    'x_label': 'data centre', 'y_label': 'IT power (MW)', 'log_y': False,
    'series': [
        {'name': 'Today (Epoch estimate, 5 Oct 2026)', 'values': now_v, 'unit': 'MW', 'as_of_dates': now_d},
        {'name': 'Epoch\'s planned build-out (projection, not yet built)', 'values': plan_v, 'unit': 'MW', 'projected': True, 'target_dates': plan_d},
    ],
    'highlight': {'x': 'xAI Colossus 2', 'label': 'Largest today: 946 MW'},
    'source': 'EPOCH AI · AI DATA CENTERS · UPDATED 5 OCT 2026',
    'url': 'https://epoch.ai/data/ai-data-centers',
    'as_of': '2026-10-05 (downloaded 2026-10-10)',
    'verified_how': ('From Epoch\'s official data_center_timelines.csv: "today" = the site\'s latest row dated on or before 10 Oct 2026; "planned" = the site\'s last (future-dated) row, '
                     'which is Epoch\'s own projection with its date. Today-values match the hub text: "The largest known AI data center by IT power is Colossus 2 ... 946 MW. It is followed by '
                     'Anthropic-Amazon New Carlisle (Amazon, 910 MW), Microsoft Fairwater Atlanta (Microsoft, 636 MW), DayOne Nusajaya (473 MW), and Meta Prometheus (Meta, 471 MW)". '
                     'DayOne Nusajaya (Malaysia, 473 MW, owner unknown) is left out as not one of the named US frontier campuses.'),
    'notes': ('Planned values are Epoch\'s projections (series 2 is flagged projected:true; draw it hatched/dashed and say "planned"). '
              'Planned: Colossus 2 1,531 MW (25 Feb 2027), New Carlisle 1,925 MW (17 Mar 2028), Prometheus 1,022 MW (1 Jul 2028), Abilene 843 MW (1 Nov 2026), '
              'Fairwater Wisconsin 2,263 MW (13 May 2028), Hyperion 1,632 MW (1 Jan 2028). Atlanta and Colossus 1 have no later rows (null). Meta Hyperion is 0 MW today (Buildings 1-2 roofed Apr 2026). '
              'Meta says Hyperion "will be able to scale up to 5GW" (Zuckerberg, quoted in the deck, tools/slides_economy.js gigawattSlide); that is a company claim, not Epoch\'s number. '
              'Anthropic-Amazon "Rainier" = Epoch\'s "Anthropic-Amazon New Carlisle" (Indiana). Microsoft does not publish a power figure for Fairwater Wisconsin; Epoch\'s 369 MW is an estimate.'),
    'image': f'{DECK}/research/economy/epoch_sat_amazon_new_carlisle_2026-06.png',
    'image_credit': 'Epoch AI annotated satellite image, Anthropic-Amazon New Carlisle, Jun 2026 (imagery (c) Airbus DS), as in the deck assets',
    'deck_ref': 'assets/research/economy/rev2/gw_epoch_frontier_sites_power.csv (older snapshot of the same sites); tools/slides_economy.js',
})

# ---- 4. Stargate Abilene
ab = [('2025-06-28', 0), ('2025-09-26', 1), ('2026-01-15', 2), ('2026-03-24', 2), ('2026-07-28', 4)]
for d, n in ab:
    st = state('OpenAI Stargate Abilene', d)
    assert st[0] == d and st[3] == n, (d, n, st)
it_mw = [state('OpenAI Stargate Abilene', d)[1] for d, _ in ab]
items.append({
    'id': 'abilene-buildings',
    'title': 'Abilene: roofed vs powered buildings',
    'subtitle': 'Stargate Abilene, Texas: buildings with a roof vs buildings in operation',
    'caption': 'Roofed is not powered: Epoch counts 4 of 8 operating in Jul 2026',
    'kind': 'step',
    'x': [mon(d, True) for d, _ in ab], 'x_iso': [d for d, _ in ab], 'x_type': 'date',
    'x_label': 'satellite image date', 'y_label': 'buildings (of 8)', 'log_y': False,
    'series': [
        {'name': 'Roofed (shell complete), counted on the satellite image', 'values': [2, None, None, None, 8], 'unit': 'buildings',
         'connect_gaps': True},
        {'name': 'In operation (Epoch estimate)', 'values': [n for _, n in ab], 'unit': 'buildings', 'it_power_mw': it_mw},
    ],
    'highlight': {'x': '28 Jul 2026', 'label': '2 → 8 roofs in 13 months'},
    'source': 'EPOCH AI · OPENAI STARGATE ABILENE · SATELLITE IMAGERY (C) AIRBUS DS',
    'url': 'https://epoch.ai/data/ai-data-centers/directory/openai-stargate-abilene',
    'as_of': '2026-07-28 (latest satellite image); Epoch directory page "Updated Oct. 5, 2026"',
    'verified_how': ('Roofed counts: the deck\'s own count (tools/slides_economy.js abileneSlide: "June 2025: two buildings done, six under construction; July 2026: all 8 buildings complete") '
                     'RE-CHECKED by eye on the original Epoch satellite images (28 Jun 2025: only the two northern buildings have complete roofs, the six others are bare slab or partial steel; '
                     '28 Jul 2026: all eight roofed) and against Epoch\'s timeline text for 28 Jul 2026, "Buildings 5-8 are structurally complete and roofed but not yet confirmed operational". '
                     'Operational counts: Epoch\'s data_center_timelines.csv "Buildings operational" column on each satellite date (0, 1, 2, 2, 4). '
                     'Intermediate roofed counts are deliberately left null: Epoch does not state them and by-eye counts at the in-between images (Sep 2025, Jan 2026, Mar 2026) were ambiguous.'),
    'notes': ('Draw the roofed line with only its two verified points (connect_gaps true) so it jumps 2 to 8; the second series shows the fit-out lag (4 operational vs 8 roofed in Jul 2026). '
              'Epoch IT power on those dates: 0, 105, 211, 211, 421 MW (series[1].it_power_mw); Epoch projects 843 MW with all 8 buildings operational by 1 Nov 2026 (projection, not plotted). '
              'Crusoe: flagship 1.2 GW campus, construction began June 2024 (1.2 GW is campus power, IT power is lower; do not conflate). '
              'More Epoch satellite frames exist for 26 Sep 2025, 15 Jan 2026 and 24 Mar 2026 at epoch.ai/assets/images/data_centers/previews/OpenAI_Stargate_Abilene/<date>.png (1280x720; not copied into the project).'),
    'image': f'{DECK}/research/economy/epoch_sat_stargate_abilene_2025-06.png',
    'image_after': f'{DECK}/research/economy/epoch_sat_stargate_abilene_2026-07.png',
    'image_credit': 'Epoch AI annotated satellite images, 28 Jun 2025 and 28 Jul 2026 (imagery (c) Airbus DS), as used in the deck',
    'deck_ref': 'tools/slides_economy.js abileneSlide',
})

# ---- 5. hyperscaler capex
cap = list(csv.DictReader(open(P('epoch_hyperscaler_capex_quarterly.csv'), encoding='utf8')))
cols = {'Amazon': 'AMZN Broad CapEx ($M)', 'Microsoft': 'MSFT Broad CapEx ($M)', 'Alphabet': 'GOOG Broad CapEx ($M)', 'Meta': 'META Broad CapEx ($M)'}
years = ['2022', '2023', '2024', '2025']
ann = {k: [r(sum(float(x[c]) for x in cap if x['Calendar Quarter'].startswith(f'CY{y}')) / 1000, 3) for y in years] for k, c in cols.items()}
guided = {'Amazon': 220, 'Microsoft': 190, 'Alphabet': 205, 'Meta': 145}  # Statista infographic, upper limits
tot = [r(sum(ann[k][i] for k in ann), 1) for i in range(4)] + [sum(guided.values())]
assert tot[4] == 760
items.append({
    'id': 'hyperscaler-capex',
    'title': 'Big Tech capex, year by year',
    'subtitle': 'Capital expenditure of Amazon, Microsoft, Alphabet and Meta, $ billions (2026 = guidance)',
    'caption': '2026 = company guidance (upper limits), not spent yet',
    'kind': 'bar', 'stacked': True,
    'x': ['2022', '2023', '2024', '2025', '2026 (guided)'], 'x_type': 'category',
    'x_label': 'calendar year', 'y_label': 'capital expenditure ($B)', 'log_y': False,
    'series': [{'name': k, 'values': ann[k] + [guided[k]], 'unit': '$B'} for k in ('Amazon', 'Microsoft', 'Alphabet', 'Meta')],
    'totals': tot,
    'projected_from_index': 4,
    'highlight': {'x': '2026 (guided)', 'label': 'up to $760B in 2026'},
    'source': 'EPOCH AI (SEC FILINGS) · STATISTA · COMPANY GUIDANCE, 30 JUL 2026',
    'url': 'https://www.statista.com/chart/35046/capital-expenditure-of-meta-alphabet-amazon-and-microsoft/',
    'url_epoch': 'https://epoch.ai/data-insights/hyperscaler-capex-trend',
    'as_of': '2026-07-31 (Statista; guidance as of Jul 30, 2026); Epoch data through Q4 2025',
    'verified_how': ('2022-25: sums of the four calendar quarters in Epoch\'s hyperscaler capex CSV (epoch_hyperscaler_capex_quarterly.csv, "broad capex" from SEC filings; identical to the table '
                     'on the live Epoch insight page, fetched 10 Oct 2026). 2026: Statista chart page fetched 10 Oct 2026 ("cap ex spending between the four companies is expected to hit $760 billion this year. '
                     'For comparison, this number stood at only $413 billion in 2025"); per-company 2026 values $220B Amazon, $190B Microsoft, $205B Alphabet, $145B Meta read off the Statista infographic '
                     '(the deck\'s copy assets/research/economy/statista_bigtech_capex_2026.jpeg; "upper limit of latest company projection as of Jul. 30, 2026", Microsoft outlook as of Apr 29, 2026); they sum to 760.'),
    'notes': ('The 2026 bar is company GUIDANCE (upper limits), not spending to date: draw it hatched/dashed and say "guided". Epoch\'s SEC-based 2025 total for these four is $408.6B vs Statista\'s $413B '
              '(company-reported totals differ slightly); the +84% (760/413) uses Statista\'s own numbers. Epoch adds Oracle (CY2025 $39.6B, not shown) and writes: "growing at an average of 72% per year since the second quarter of 2023". '
              'Epoch quarterly totals incl. Oracle (Q1 2022 -> Q4 2025): $37.6B -> $140.6B. Bloomberg projects ~$950B for 2027 (deck, Fortune/Bloomberg Jul 26, 2026; not plotted).'),
    'image': f'{DECK}/slides/economy/statista_head.png',
    'image_credit': 'Statista headline crop (real screenshot), as used in the deck',
    'deck_ref': 'tools/slides_economy.js capexSlide (series arrays there are rounded to 0.1)',
})

# ---- 6. training compute records (Epoch notable models)
nm = list(csv.DictReader(open(P('notable.csv'), encoding='utf8')))
rows = []
for x in nm:
    f, d = x.get('Training compute (FLOP)'), x.get('Publication date')
    if f and d:
        rows.append((d, float(f), x['Model'], x['Organization'], x['Confidence']))
rows.sort()
best = 0
recs = []
for d, f, m, o, c in rows:
    if f > best:
        best = f
        if d >= '2020-01-01':
            recs.append((d, f, m, o, c))
# keep the strict running maxima from 2020 on
assert recs[0][2] == 'Meena' and recs[-1][2] == 'GPT-6 Astra', [x[2] for x in recs]
ratio = recs[-1][1] / [x for x in recs if x[2] == 'GPT-3 175B (davinci)'][0][1]
items.append({
    'id': 'training-compute',
    'title': 'Frontier training compute, 2020–2026',
    'subtitle': 'Training compute of the largest known AI training run at each record, FLOP (log scale)',
    'caption': 'Epoch estimates; 3 of the 12 points are rated speculative',
    'kind': 'scatter',
    'x': [dec_year(d) for d, *_ in recs], 'x_iso': [d for d, *_ in recs], 'x_type': 'date',
    'x_label': 'publication date', 'y_label': 'training compute (FLOP, log scale)', 'log_y': True,
    'series': [{'name': 'Record training run (Epoch notable models)', 'values': [f for _, f, *_ in recs], 'unit': 'FLOP'}],
    'point_labels': [m for _, _, m, *_ in recs],
    'point_meta': [{'model': m, 'org': o, 'date': d, 'confidence': c} for d, _, m, o, c in recs],
    'highlight': {'x': dec_year('2026-09-03'), 'label': 'GPT-6 Astra: 1e27 FLOP'},
    'source': 'EPOCH AI · NOTABLE AI MODELS · UPDATED 8 OCT 2026',
    'url': 'https://epoch.ai/data/ai-models',
    'as_of': '2026-10-08 (Epoch "Updated Oct. 8, 2026"; downloaded 2026-10-10)',
    'verified_how': ('Downloaded Epoch\'s notable_ai_models.csv (epoch.ai/data/notable_ai_models.csv, CC-BY, 1,078 rows, 540 with a compute estimate). '
                     'Plotted = the running maximum of "Training compute (FLOP)" by publication date, from 2020 on (each point is the largest estimate known at that date). '
                     'Values are Epoch\'s exact numbers (e.g. GPT-4 2.1e25, Grok 3 3.5e26, GPT-6 Astra 1.0001e27). Cross-checked against the deck\'s landmark table '
                     '(assets/research/splash/epoch_compute_trend.csv) and training-power table (assets/research/economy/rev2/gw_epoch_frontier_training_power.csv): same values. '
                     'Epoch Trends page (fetched 10 Oct 2026): "Training compute for frontier language models has been growing at 5x per year since 2020" (90% CI 4x to 6x); '
                     '"doubling every 5.2 months since 2020".'),
    'notes': (f'Derived: GPT-6 Astra / GPT-3 = x{ratio:,.0f} in 6.3 years. Epoch\'s confidence flags per point are in point_meta: GPT-3.5, Gemini 1.0 Ultra and Grok 4 are "Speculative" '
              '(within 30x), GPT-4, GPT-4.5, Grok 3 and GPT-6 Astra "Likely" (within 10x), the rest "Confident" (within 3x). GPT-6 Astra: Epoch notes OpenAI said it trained on at least 100,000 '
              'GB200s in Abilene, so its compute may be an underestimate; training power 232.67 MW and 90 days are in the deck table (training time is an Epoch assumption). The 5x/yr is Epoch\'s own trend statistic, '
              'quoted not drawn.'),
    'image': f'{DECK}/research/economy/rev2/gw_pcgamer_astra_100k_gpus.png',
    'image_credit': 'PC Gamer headline (real screenshot), Sep 7, 2026, as used in the deck',
    'deck_ref': 'assets/research/splash/scaling-epoch-trend.json; tools/slides_economy.js (GPT-6 Astra training energy slide)',
})

# ---- 7. METR 50% time horizon
y = yaml.safe_load(open(P('metr.yaml'), encoding='utf8'))
names = {'gpt2': 'GPT-2', 'davinci_002': 'GPT-3 (davinci-002)', 'gpt_3_5_turbo_instruct': 'GPT-3.5', 'gpt_4': 'GPT-4', 'gpt_4_1106_inspect': 'GPT-4 (Nov 2023)',
         'claude_3_opus_inspect': 'Claude 3 Opus', 'gpt_4_turbo_inspect': 'GPT-4 Turbo', 'gpt_4o_inspect': 'GPT-4o',
         'claude_3_5_sonnet_20240620_inspect': 'Claude 3.5 Sonnet (Jun 2024)', 'o1_preview': 'o1-preview',
         'claude_3_5_sonnet_20241022_inspect': 'Claude 3.5 Sonnet (Oct 2024)', 'o1_inspect': 'o1', 'claude_3_7_sonnet_inspect': 'Claude 3.7 Sonnet',
         'o3_inspect': 'o3', 'claude_4_opus_inspect': 'Claude Opus 4', 'claude_4_1_opus_inspect': 'Claude Opus 4.1', 'gpt_5_2025_08_07_inspect': 'GPT-5',
         'gemini_3_pro': 'Gemini 3 Pro', 'gpt_5_1_codex_max_inspect': 'GPT-5.1-Codex-Max', 'claude_opus_4_5_inspect': 'Claude Opus 4.5', 'gpt_5_2': 'GPT-5.2 (high)',
         'claude_opus_4_6_inspect': 'Claude Opus 4.6', 'gpt_5_3_codex': 'GPT-5.3 Codex', 'gemini_3_1_pro': 'Gemini 3.1 Pro', 'gpt_5_4': 'GPT-5.4',
         'claude_mythos_preview_early_inspect': 'Claude Mythos Preview (early)'}
mr = []
for k, v in y['results'].items():
    m = v['metrics']
    mr.append((str(v['release_date']), k, m['p50_horizon_length']['estimate'], m['p50_horizon_length']['ci_low'], m['p50_horizon_length']['ci_high'], bool(m['is_sota'])))
mr.sort(key=lambda t: (t[0], t[1]))


def disp(mins):
    if mins < 1:
        return f'{mins * 60:.0f} sec'
    if mins < 60:
        return f'{mins:.0f} min'
    return f'{mins / 60:.1f} hours'


assert len(mr) == 26 and mr[-1][1].startswith('claude_mythos')
dt2023 = y['doubling_time_in_days']['from_2023_on']
items.append({
    'id': 'metr-horizon',
    'title': 'Task length AI can finish',
    'subtitle': 'METR 50% time horizon: length of software task (human-expert time) an AI completes half the time',
    'caption': 'METR: measurements above 16 hours are unreliable',
    'kind': 'scatter',
    'x': [dec_year(d) for d, *_ in mr], 'x_iso': [d for d, *_ in mr], 'x_type': 'date',
    'x_label': 'model release date', 'y_label': '50% time horizon (minutes, log scale)', 'log_y': True,
    'series': [
        {'name': 'State of the art at release', 'values': [r(e, 3) if s else None for _, _, e, _, _, s in mr], 'unit': 'minutes'},
        {'name': 'Other models', 'values': [None if s else r(e, 3) for _, _, e, _, _, s in mr], 'unit': 'minutes'},
    ],
    'point_labels': [names[k] for _, k, *_ in mr],
    'y_display': [disp(e) for _, _, e, *_ in mr],
    'ci_low': [r(c, 1) for _, _, _, c, _, _ in mr], 'ci_high': [r(h, 1) for _, _, _, _, h, _ in mr],
    'highlight': {'x': dec_year('2026-04-07'), 'label': 'Claude Mythos Preview: 17+ hours'},
    'source': 'METR · TIME HORIZON 1.1 · PAGE UPDATED 8 SEP 2026',
    'url': 'https://metr.org/time-horizons',
    'url_data': 'https://metr.org/assets/benchmark_results_1_1.yaml',
    'as_of': '2026-09-08 (metr.org/time-horizons "LAST UPDATED September 8, 2026", now marked "no longer actively updated"; YAML fetched 2026-10-10; newest model 7 Apr 2026)',
    'verified_how': ('Fetched METR\'s raw results file benchmark_results_1_1.yaml on 10 Oct 2026 (26 models) and read p50_horizon_length.estimate, ci_low/high, release_date and is_sota for each; '
                     'identical to the values in the deck (tools/slides_capabilities.js METR array). METR\'s stated doubling time: "from_2023_on: point_estimate 128.744 days (CI 104.428 to 158.012); all_time_stitched 187.778 days" '
                     '(the YAML comment says it excludes points with p50 above 16 hrs).'),
    'notes': ('Honesty caveats to keep on screen or in the caption: METR\'s own chart title for the top point is "Claude Mythos Preview (early) likely has a 50%-time-horizon of at least 16 hrs" and its note '
              '"Measurements above 16 hrs are unreliable with our current task suite" (deck metr-x-thread-1.png, METR tweet 8 May 2026); the point estimate is 1,044.8 minutes = 17.4 hours, CI 509 to 3,304 minutes. '
              'METR measures software, ML and cybersecurity tasks, human-expert time, not how long an AI works. Doubling time since 2023 = 128.7 days (about 4.2 months). '
              'METR\'s separate GPT-5.6 Sol evaluation (blog 26 Jun 2026) gave ~11.3 hours (95% CI 5 to 40 h) with cheating counted as failures; not in the YAML, not plotted. '
              'Y values are minutes; y_display has the human-readable string.'),
    'image': f'{DECK}/slides/capabilities/decoder-metr-head.png',
    'image_credit': 'The Decoder headline (real screenshot), May 10, 2026, as used in the deck',
    'deck_ref': 'tools/slides_capabilities.js metrSlide; assets/research/capabilities/manifest.json dataset "metr-time-horizon"',
})

# ---- 8. HLE, Artificial Analysis, best to date by model release quarter
aa = [m for m in json.load(open(P('aa_models_from_o1_page.json'))) if isinstance(m, dict)]
o1 = json.load(open(P('aa_o1_record.json')))
hrows = []
for m in aa:
    if m.get('hle') is None or not m.get('releaseDate'):
        continue
    c = m['creator']
    cn = c.get('name') if isinstance(c, dict) else c
    hrows.append((m['releaseDate'], m['hle'] * 100, m['name'], cn))
hrows.append((o1['releaseDate'], o1['hle'] * 100, 'o1', 'OpenAI'))  # the page's own model is not in its model list
big = {'OpenAI', 'Anthropic', 'Google'}
qs = [("Q4 '24", '2024-12-31'), ("Q1 '25", '2025-03-31'), ("Q2 '25", '2025-06-30'), ("Q3 '25", '2025-09-30'),
      ("Q4 '25", '2025-12-31'), ("Q1 '26", '2026-03-31'), ("Q2 '26", '2026-06-30'), ("Q3 '26", '2026-09-30')]
hv, hl, hd = [], [], []
for lab, d in qs:
    b = max([x for x in hrows if x[0] <= d and x[3] in big], key=lambda x: x[1])
    hv.append(round(b[1], 1)); hl.append(b[2]); hd.append(b[0])
assert hv == [7.0, 18.0, 22.5, 28.5, 39.7, 47.0, 55.5, 61.4], hv
items.append({
    'id': 'hle-quarterly',
    'title': "Humanity's Last Exam: 7% to 61%",
    'subtitle': 'Best score to date by model release quarter, Artificial Analysis (text-only questions, no tools)',
    'caption': 'Independent runs by Artificial Analysis, text-only, no tools',
    'kind': 'bar',
    'x': [q for q, _ in qs], 'x_iso': [d for _, d in qs], 'x_type': 'category',
    'x_label': 'model release quarter (best so far)', 'y_label': 'accuracy (%)', 'log_y': False,
    'series': [{'name': 'Best HLE score to date (OpenAI / Anthropic / Google models)', 'values': hv, 'unit': '%'}],
    'point_labels': [f'{n} ({mon(d, True)})' for n, d in zip(hl, hd)],
    'highlight': {'x': "Q3 '26", 'label': 'Claude Opus 5.5: 61.4%'},
    'source': 'ARTIFICIAL ANALYSIS · HUMANITY\'S LAST EXAM · 22 SEP 2026',
    'url': 'https://artificialanalysis.ai/evaluations/humanitys-last-exam',
    'as_of': '2026-10-10 (leaderboard still tops out at Claude Opus 5.5, released 2026-09-22)',
    'verified_how': ('Fetched artificialanalysis.ai on 10 Oct 2026. The HLE page says "Claude Opus 5.5 (Max, Default Fallback) scores the highest on Humanity\'s Last Exam with a score of 61.4%, '
                     'followed by Claude Fable 5.1 (Max, Default Fallback) with a score of 59.1%". The model list embedded in the AA model page (658 scored models, hle and releaseDate for each) '
                     'was parsed and, for each quarter end, the best HLE score among OpenAI, Anthropic and Google models released on or before that date was computed: 7.0, 18.0, 22.5, 28.5, 39.7, 47.0, 55.5, 61.4, '
                     'identical to the deck\'s dataset "hle-artificial-analysis" (assets/research/capabilities/manifest.json). Q4 \'24 = o1 (release 2024-12-05, AA hle 0.0701 on its own model page).'),
    'notes': ('One source only (AA: 2,158 text-only questions, no tools, LLM-graded). Do not mix with the official Scale AI / CAIS board, which uses the full 2,500-question set: it shows GPT-6 Astra 54.8 +/-1.94 and '
              'Fable 5.1 (xhigh) 46.5 (deck). Anthropic\'s own system card reports Opus 5.5 at 64.4% (full set, no tools, vendor-run, deck Table 8.1.A), which is not comparable. '
              'HLE launched Jan 2025 with frontier models under 10%; the Q4 \'24 bar is a retroactive score for a model released in Dec 2024. Scale AI calls it "designed to be the last academic exam of its kind for AI" '
              'and on 17 Sep 2026 announced HLE-Rolling for when models "hit the noise ceiling" (deck, hleSlide). No release after 22 Sep has beaten 61.4.'),
    'image': f'{DECK}/research/capabilities/scale-hle-leaderboard.png',
    'image_credit': 'Scale AI HLE leaderboard (real screenshot), as used in the deck',
    'deck_ref': 'tools/slides_capabilities.js hleSlide; manifest dataset "hle-artificial-analysis"',
})

# ---- 9. benchmark saturation (running best at each quarter end)
sys_path = None
bq = [('Q3 \'24', '2024-09-30'), ('Q4 \'24', '2024-12-31'), ('Q1 \'25', '2025-03-31'), ('Q2 \'25', '2025-06-30'), ('Q3 \'25', '2025-09-30'),
      ('Q4 \'25', '2025-12-31'), ('Q1 \'26', '2026-03-31'), ('Q2 \'26', '2026-06-30'), ('Q3 \'26', '2026-09-30')]


def load(f, col):
    out = []
    for x in csv.DictReader(open(P('bench', f), encoding='utf8')):
        if x.get('Release date') and x.get(col) not in (None, ''):
            out.append((x['Release date'], float(x[col]) * 100, x['Model version']))
    return out


spec = [('GPQA Diamond', 'gpqa_diamond.csv', 'mean_score'), ('ARC-AGI-1', 'arc_agi_external.csv', 'Score'), ('ARC-AGI-2', 'arc_agi_2_external.csv', 'Score'),
        ('SWE-bench Verified', 'swe_bench_verified.csv', 'mean_score'), ('FrontierMath Tier 4', 'frontiermath_tier_4_v2.csv', 'mean_score')]
bser, bmodels = [], {}
for name, f, col in spec:
    rws = load(f, col)
    vals, mods = [], []
    for lab, d in bq:
        c = [x for x in rws if x[0] <= d]
        if not c:
            vals.append(None); mods.append(None)
        else:
            b = max(c, key=lambda x: x[1])
            vals.append(round(b[1], 1)); mods.append(f'{b[2]} ({b[0]})')
    bser.append({'name': name, 'values': vals, 'unit': '%'})
    bmodels[name] = mods
want = {'GPQA Diamond': [62.4, 76.8, 83.8, 85.3, 87.0, 92.6, 94.6, 94.6, 95.8],
        'ARC-AGI-1': [18.0, 30.7, 34.5, 60.8, 66.7, 90.5, 98.0, 98.5, 98.5],
        'ARC-AGI-2': [0.8, 0.8, 3.0, 8.6, 16.0, 54.2, 84.6, 89.2, 95.0],
        'SWE-bench Verified': [None, 31.0, 61.0, 70.7, 73.6, 76.7, 78.7, 83.5, 83.5],
        'FrontierMath Tier 4': [None, None, 0.0, 4.9, 22.0, 46.0, 58.5, 90.2, 100.0]}
for s in bser:
    assert s['values'] == want[s['name']], (s['name'], s['values'])
# ARC-AGI-3: deck dataset 'arc-agi-3-sota' (ARC Prize leaderboard, Standard harness, best verified by release date)
arc3 = {'2026-03-05': 0.4, '2026-04-23': 0.4, '2026-06-01': 1.5, '2026-07-09': 7.8, '2026-07-24': 30.2, '2026-09-02': 62.7}
a3 = []
for lab, d in bq:
    c = [v for k, v in arc3.items() if k <= d]
    a3.append(max(c) if c else None)
bser.append({'name': 'ARC-AGI-3 (launched 25 Mar 2026)', 'values': a3, 'unit': '%', 'source_note': 'deck dataset arc-agi-3-sota, ARC Prize leaderboard, Standard harness'})
items.append({
    'id': 'benchmarks-saturate',
    'title': 'Benchmarks saturate within months',
    'subtitle': 'Best score so far on famous AI benchmarks, at each quarter end',
    'caption': 'Best verified score among models released by each quarter end',
    'kind': 'line',
    'x': [q for q, _ in bq], 'x_iso': [d for _, d in bq], 'x_type': 'date',
    'x_label': 'quarter end (best score among models released by then)', 'y_label': 'best score (%)', 'log_y': False,
    'series': bser,
    'series_models': bmodels,
    'highlight': {'x': "Q3 '26", 'label': 'ARC-AGI-2: 0.8% to 95.0% in two years'},
    'source': 'EPOCH AI BENCHMARKING HUB · ARC PRIZE · OCT 2026',
    'url': 'https://epoch.ai/benchmarks',
    'url_data': 'https://epoch.ai/data/benchmark_data.zip',
    'as_of': '2026-10-09/10 (Epoch benchmark_data.zip downloaded 2026-10-10; latest runs dated 2026-10-09)',
    'verified_how': ('Downloaded Epoch\'s benchmark_data.zip (CC-BY) on 10 Oct 2026 and recomputed the running best score by model release date for GPQA Diamond (mean_score; 35.7% GPT-4 Mar 2023 -> 95.8% GPT-6 Astra), '
                     'ARC-AGI-1 (arc_agi_external.csv, from arcprize.org; 98.5% Claude Fable 5, Jun 2026), ARC-AGI-2 (arc_agi_2_external.csv; 0.8% o1-mini Sep 2024 -> 95.0% GPT-6 Astra Max), '
                     'SWE-bench Verified (Epoch runs; 31.0% GPT-4o Nov 2024 -> 83.5% Claude Opus 4.7 Apr 2026; the deck notes Epoch stopped adding frontier runs after that, and the later rows in the CSV are lower-scoring models) and FrontierMath Tier 4 v2 (0% o3-mini Jan 2025 -> 100% GPT-6.1 Sol 29 Sep 2026). '
                     'Each point = the maximum over models released on or before the quarter end. All values equal the deck\'s datasets (assets/research/capabilities/manifest.json). '
                     'ARC-AGI-3: values are the deck\'s dataset (ARC Prize leaderboard accessed 4 Oct 2026); the endpoint (GPT-6 Astra Max 62.7%, Provider Adapter 99.9%) is visible on the deck\'s real screenshot '
                     '(arcprize-arcagi3-leaderboard.png); the leaderboard is JavaScript-rendered so the earlier points could not be re-fetched today.'),
    'notes': ('Derived by us: quarter-end running maxima (no interpolation, null where a benchmark did not yet exist). series_models lists the record model behind each value. '
              'Deck takeaway: ARC-AGI-1 effectively saturated since Feb 2026 (98.0%); GPQA Diamond expert human baseline ~65-70% (original GPQA paper, via the deck); '
              'ARC-AGI-3: 99.9% only with the Provider Adapter harness, 62.7% on the standard harness; GPT-6.1 Sol 100% on FrontierMath Tier 4 v2 is Epoch\'s own run (29 Sep 2026). '
              'Humanity\'s Last Exam has its own graph (hle-quarterly). Pick 2-3 series for the video if six lines are too many; ARC-AGI-2 and FrontierMath T4 are the dramatic ones.'),
    'image': f'{DECK}/research/capabilities/arcprize-arcagi3-leaderboard.png',
    'image_credit': 'ARC Prize ARC-AGI-3 leaderboard (real screenshot), as used in the deck',
    'deck_ref': 'tools/slides_capabilities.js benchmark tiles (lines 430-492); manifest datasets gpqa-diamond-sota, arc-agi-1/2/3, swe-bench-verified-sota, frontiermath-t4-sota',
})

# ---- 10. Gallup
items.append({
    'id': 'gallup-harm',
    'title': 'Americans: more harm than good',
    'subtitle': 'Share who say AI does more harm than good, Bentley-Gallup survey',
    'caption': 'Bentley-Gallup, May 2026, 3,270 U.S. adults',
    'kind': 'line',
    'x': ['2023', '2024', '2025', '2026'], 'x_type': 'category',
    'x_label': 'survey year (May)', 'y_label': 'say AI does more harm than good (%)', 'log_y': False,
    'series': [
        {'name': 'All U.S. adults', 'values': [40, 31, 31, 39], 'unit': '%'},
        {'name': 'Ages 18 to 29', 'values': [30, 27, 36, 47], 'unit': '%'},
    ],
    'highlight': {'x': '2026', 'label': '31% to 39% in a year; 47% of 18-29s'},
    'source': 'BENTLEY-GALLUP BUSINESS IN SOCIETY · GALLUP · 28 JUL 2026',
    'url': 'https://news.gallup.com/poll/712751/americans-cool-toward.aspx',
    'as_of': '2026-07-28 (survey 4-11 May 2026, n = 3,270 U.S. adults, margin of error +/-2.4 pts)',
    'verified_how': ('Fetched the Gallup article live on 10 Oct 2026 ("Americans Cool Toward AI"). Table "Americans See More Harm Than Good From AI in 2026": more harm than good 40 (2023), 31 (2024), 31 (2025), 39 (2026); '
                     'more good than harm 10, 13, 12, 9; equal 50, 56, 57, 52. Text: "The percentage of Americans who believe AI does more harm than good has increased from 31% in 2025 to 39% in 2026, nearly matching the 40% recorded in 2023" '
                     'and "Nearly half of adults aged 18 to 29 (47%) now believe AI does more harm than good, up from 36% in 2025 and considerably higher than the 30% recorded in 2023 and 27% recorded in 2024." '
                     'The headline/date was also verified by the long-cut research (research/long/lyrics/wish-done-before.json).'),
    'notes': ('Same Gallup release, other series (not plotted): "AI will reduce the number of U.S. jobs over the next 10 years" 75, 75, 73, 79 (2023-2026); trust businesses to use AI responsibly '
              '"a lot" or "some" 21, 23, 31, 27; Americans who say AI does more good than harm 9% in 2026. 2022-2026 surveys are different samples with different margins of error (see the page\'s Survey Methods). '
              'No Gallup chart or logo is in the deck; if an image is wanted capture the live article header (real screenshot) rather than re-drawing it.'),
    'deck_ref': 'not in the deck; sourced in research/long/plan/ch-b.json (chb-06/07)',
})

doc = {
    '_about': ('Graph datasets for the animated hand-drawn charts in the Hyperplane rev2 cut. Written 10 Oct 2026. '
               'Items are ordered by priority (data-centre build-outs first). Every value is read or recomputed from the cited source on 10 Oct 2026; '
               'derived numbers are limited to sums, running maxima, ratios and unit conversions and are labelled as such in verified_how / notes. '
               'Projections are only ever the source\'s own, flagged projected:true / projected_from_index, and are not extrapolated by us.'),
    '_schema': {
        'x': 'axis labels (strings) for line/bar/step/area, or numbers (decimal years) for scatter; x_iso gives exact ISO dates where x is a date; x_type = date or category',
        'series[].values': 'same length as x; null = no value at that x (leave a gap, or connect if connect_gaps is true)',
        'highlight': '{x: a value from x, label: short callout}',
        'image / image_after': 'absolute paths of related photos or satellite images in the deck, to show behind or beside the graph (image_credit gives the credit line to show)',
        'point_labels': 'per-point names (model, site) aligned with x',
        'log_y': 'true = logarithmic y axis',
        'projected': 'a series (or projected_from_index = first projected x index) that is the source\'s own projection or company guidance, not an observation: draw dashed/hatched and say so',
    },
    'as_of_today': TODAY,
    'items': items,
}
with open(OUT, 'w', encoding='utf8') as f:
    json.dump(doc, f, indent=1, ensure_ascii=False)
print('wrote', OUT, len(items), 'items')
