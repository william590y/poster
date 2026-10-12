import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
cands = {c['id'] for c in json.load(open(HERE + '/cands.json'))}
picks = {}
for ln in open(HERE + '/picks.txt'):
    ln = ln.strip()
    if not ln or ln.startswith('#'): continue
    oid, ph = ln.split(' :: ', 1)
    assert oid in cands, oid
    picks[oid] = {'phrases': [p.strip() for p in ph.split(' || ')]}
lyr = {}
for ln in open(HERE + '/lyrics.txt'):
    ln = ln.strip()
    if not ln or ln.startswith('#'): continue
    k, v = ln.split(' :: '); lyr[k] = v.split()
for k, v in lyr.items():
    if k in picks: picks[k]['lyric'] = v
ov = json.load(open(HERE + '/overrides.json')) if os.path.exists(HERE + '/overrides.json') else {}
for k, v in ov.items():
    if k in picks: picks[k].update(v)
drop = set(json.load(open(HERE + '/drop.json'))) if os.path.exists(HERE + '/drop.json') else set()
for k in drop: picks.pop(k, None)
json.dump(picks, open(HERE + '/picks.json', 'w'), ensure_ascii=False, indent=1)
print(len(picks), 'picks')
