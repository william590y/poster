import json, sys, re, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
cands = {c['id']: c for c in json.load(open('cands.json'))}
a = json.load(open('analysis.json'))
rows = []
for oid, v in a.items():
    c = cands[oid]; m = c.get('man') or {}; d = c.get('deck') or {}
    date = m.get('date') or d.get('date') or ''
    yr = date[:4]
    outlet = (m.get('outlet') or d.get('outlet') or '')[:26]
    score = {'2026': 2, '2025': 1.5, '2024': .5}.get(yr, 0)
    h = v['h80']
    score += 3 if h >= 45 else 2 if h >= 32 else 1 if h >= 22 else -2 if h < 14 else 0
    cs = (v['chk'] or {}).get('score', 0)
    score += 1 if cs >= .9 else -2 if cs < .6 else 0
    score += {'headline': 1, 'post': .5}.get(v['kind'], 0)
    if c['w'] < 600: score -= 1
    if not v['tags']: score -= 1
    rows.append((score, oid, v, c, date, outlet, cs))
rows.sort(key=lambda r: (-r[0], r[1]))
lo = int(sys.argv[1]) if len(sys.argv) > 1 else 0
hi = int(sys.argv[2]) if len(sys.argv) > 2 else 9999
for i, (score, oid, v, c, date, outlet, cs) in enumerate(rows):
    if i < lo or i >= hi: continue
    t = (v['text'] or '').replace('\n', ' ')
    print(f"{i:3d} {score:4.1f} {oid} | {v['kind'][:4]} {date[:10]} {outlet} | w{c['w']} h80={v['h80']:.0f} cs={cs:.2f} | {t[:170]}")
