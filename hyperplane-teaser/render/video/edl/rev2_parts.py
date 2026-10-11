"""Shared assembly for the rev2 cuts (assembler, 11 Oct 2026): edl/make_long_rev2.py -> long2.json, edl/make_short_rev2.py -> short2.json.

The four section plans in research/rev2/plan/ are the source of truth (prelude-riff, verse1, chorus, refrain-inst). This module
loads them, turns each plan item into its EDL item (prelude-riff: "content"; verse1/chorus: "engine"; refrain-inst: "edl"),
applies every verifier fix from research/rev2/plan/*.verify.json (the FIXES comments below cite the verify item ids) and the
assembler's cross-plan decisions (ASSEMBLY comments), and returns the parts in stacking order. Nothing here writes a file.

Stacking (EDL order = bottom to top): each section keeps its planner's order; the grounds that a logo break or a dark verse need
UNDER earlier items are moved down (g-dark-v1 under kand-riff, so the logo blows apart over the dark verse ground), and every
section gets its own shared paint canvas right above its ground (the beat track and splats draw there): paint (prelude, riff,
verse), paint-ch (chorus), paint-racks (over the full-frame racks footage), paint-rf (refrain), paint-god (over the fog footage),
paint-out (over the instrumental's cream). A paint layer under a full-frame clip would hide its beat track.
"""
import copy, json, pathlib

ROOT = pathlib.Path('/home/user/hyperplane-teaser')
EDLDIR = ROOT / 'render/video/edl'
R2 = ROOT / 'research/rev2'
PLAN = R2 / 'plan'
BEAT = 60 / 124
CREAM, DARK, INK, PAPER = '#F2EBDD', '#0E0D12', '#15131F', '#FBF6EC'


def hb_song(i):
    """song second of hits.json beat i (the 124-BPM grid; hits.json beats are these values to the ms)"""
    return 19.232 + i * BEAT


def load(name):
    return json.load(open(PLAN / f'{name}.json'))


SCR = {x['id']: x for x in json.load(open(R2 / 'screens.json'))['items']}
SCR.update({x['id']: x for x in json.load(open(R2 / 'captures.json'))['items']})
BROLL = {x['id']: x for x in json.load(open(R2 / 'broll.json'))['items']}
GRA = {x['id']: x for x in json.load(open(R2 / 'graphs.json'))['items']}

# plan-only documentation keys that are not EDL fields
DOC_KEYS = {'expand', 'entries', 'verbatim_heard', 'word_times_song', 'verify_by_ear', 'tex_verbatim', 'verbatim', 'lines', '_sync',
            'handoff', '_preset_cues_kept', '_fields_note', '_role_basis', '_', 'shows', 'window', 'source_window', 'catalog_window', 'note'}


def _und(d):
    if isinstance(d, dict):
        return {k: _und(v) for k, v in d.items() if not (k.startswith('_') and k != '_note')}
    if isinstance(d, list):
        return [_und(x) for x in d]
    return d


def clean(d):
    """drop plan documentation keys (top level) and '_...' keys (recursively, e.g. the shots' _verbatim); keep _note"""
    return _und({k: v for k, v in d.items() if k not in DOC_KEYS})


def find(items, iid):
    for x in items:
        if x['id'] == iid:
            return x
    raise KeyError(iid)


def words_set(item, new):
    """re-time karaoke / caption words by word text (first match in order): new = [(word, s)]"""
    ws = item['speech']['words'] if 'speech' in item else item['caption']['words']
    k = 0
    for w, s in new:
        while ws[k]['w'] != w:
            k += 1
        ws[k]['s'] = s
        k += 1


# ============================================================================================ PRELUDE + RIFF (song 6.10 - hb:16)
def prelude_riff():
    P = load('prelude-riff')
    out = []
    for it in P['items']:
        c = clean(it.get('content') or {})
        base = {'id': it['id'], 'type': it['type'], 't0': it['t0'], 't1': it['t1']}
        if it['id'] == 'sketch-dots':      # the generator expands the stamp list (plan: content.expand)
            for e in it['content']['entries']:
                b = float(e['at'][3:])
                out.append({'id': f"sketch-dot-{'m' if b < 0 else ''}{abs(b):g}", 'type': 'inkstamp', 'at': e['at'], 't0': e['at'],
                            't1': 'hb:1.45', 'x': e['x'], 'y': e['y'], 'size': e['size'], 'glyph': e['glyph'], 'color': e['color'],
                            'rot': e.get('rot', 0), 'layer': 'sketch'})
            continue
        x = {**base, **c}
        au = it.get('audio') or {}
        if it['type'] == 'clip' and au.get('audible'):
            x['audio'] = {k: au[k] for k in ('in', 'out', 'peak_rel_db', 'duck_db', 'lcut') if k in au}
            x['verified'] = True
        if 'frames' in x:
            x['frames'] = x['frames'].split(' ')[0]
        out.append(x)
    g = {x['id']: x for x in out}

    # FIXES (prelude-riff.verify.json "altman", optional, measured): word starts after the 0.5 s pause before LEAD etc.
    words_set(g['altman'], [('WILL', 2.42), ('PROBABLY', 2.68), ('SORT', 4.40), ('LEAD', 5.40)])
    g['altman']['_note'] = ("Altman 2015 (Airbnb fireside chat), footage as filmed; caption verbatim of the heard window 1.86-6.34 (small.en), "
                            "word times re-measured by the prelude verifier (LEAD after its pause)")
    # FIXES (verify "amodei"): the audio window kept the whole of 'badly' (out 1069.50, the next word 'and' is at 1069.73), lcut
    # dropped; word times moved to the real onsets (whisper put each pause before the NEXT word); the punches follow the words
    a = g['amodei']
    a['audio'] = {'in': 1065.67, 'out': 1069.50, 'duck_db': 5}
    words_set(a, [('25%', 1066.26), ('CHANCE', 1067.20), ('THAT', 1067.44), ('GO', 1067.84), ('REALLY,', 1068.32), ('REALLY', 1068.66), ('BADLY…', 1069.04)])
    # song = source - 1054.807: 25% 11.453 (~hb:-16 = 11.490), REALLY, 13.513, BADLY 14.233
    a['punch'] = [{'at': 'hb:-16', 'z': 1.06, 'dur': 0.12}, {'at': 'song:13.51', 'z': 1.035, 'dur': 0.12},
                  {'at': 'song:14.23', 'z': 1.05, 'dur': 0.12}, {'at': 'hb:-8', 'z': 1.03, 'dur': 0.12}]
    a['shakes'] = [{'at': 'hb:-16', 'amp': 7, 'decay': 0.07}, {'at': 'song:14.23', 'amp': 6, 'decay': 0.08}, {'at': 'hb:-12', 'amp': 5, 'decay': 0.08}]
    # the 25% circle after 'percent' ends (~song 12.30): ON hb:-14; the underline drawn from 'badly' to land ON hb:-10 (14.393)
    a['caption']['marks'] = [{'phrase': '25%', 'style': 'circle', 'at': 'hb:-14', 'dur': 0.28, 'color': '#F2C300', 'width': 7},
                             {'phrase': 'really, really badly…', 'style': 'underline', 'at': 'song:14.24', 'dur': 0.15, 'color': '#F2C300', 'width': 7}]
    a['_note'] = ("Amodei 2025 (Axios AI+ DC Summit, Sep 17 2025), footage as filmed (Axios wall kept). Heard: '…there's a 25% chance that "
                  "things go really, really badly…' (audio 1065.67-1069.50, the whole of 'badly'); the sub line is the baseline he says next "
                  "('…and a 75% chance…'), set as unheard words, never word-lit")

    # FIXES (verify "pile-hf", cosmetic): the TIME marker box 3 covered the OCR token 'Model-and'; it now ends at 'Model' (x 378)
    for s in g['pile-hf']['shots']:
        if s['id'] == 'time-2026-07-24-lost-control':
            s['hl'] = [[158, 311, 778, 401], [160, 399, 718, 472], [158, 487, 378, 561]]
    # the sketch keeps drawing through the shatter window (hb:0 - hb:1.4: its shared layer 'sketch' is in tr-shatter's out list, and
    # a shared canvas is cleared every frame, so the items that paint it must stay alive while the shards fly)
    g['sketch-plane']['t1'] = 'hb:1.45'
    g['sketch']['t1'] = 'hb:0'

    # ASSEMBLY (verse1 interfaces): the riff's logo breaks on verse 1's downbeat; the pink disc and the band stay behind as frames
    k = g['kand-riff']
    k['moves'].append({'move': 'break', 'at': 'hb:16', 'dur': 0.4, 'hide': ['pink', 'band'], 'hideAt': 'hb:16', 'stagger': 0.006})
    k['_note'] = ("builder A's riff preset: shattered prelude above it, painted on piece by piece, Coxon in the orbiting pink disc (upright), "
                  "the wordmark on hb:8, the band a river of vectors from hb:8, the whole art whips 360 into the superposition burst on hb:12; "
                  "breaks on verse 1 (hb:16): the pink disc and the band become the verse's frames")

    # ASSEMBLY (seen on the first strip): in the cover the black disc and the orange core sit on top of most of the pink disc, so
    # Coxon's face in the pink disc was hidden for most of his line. His picture goes into the BLUE disc instead (unoccluded but for
    # the small teal moon at its rim, and it never turns, so he stays upright); the pink disc carries the agents wall the whole riff,
    # timed to reach source 75.21 at hb:16.05, where verse 1's v1-agents picks the same footage up (continuity through the morph);
    # the blue disc then carries the NVIDIA data hall (broll nvidia-nvl72-factory 39.8-42.2) from the title downbeat. The xAI
    # Colossus corridor the plan had in the blue disc is the chorus's full-frame footage (hb:71-80), so it is not shown twice.
    ag = g['kc-pink-agents-a']
    pink = {**ag, 'id': 'kc-pink-agents', 't0': 'hb:1.25', 't1': 'hb:16.05', 'in': 72.0,
            'speed': round((75.21 - 72.0) / (hb_song(16.05) - hb_song(1.25)), 4), 'zoom': [1.0, 1.15],
            '_note': "agents' wall (ale-agent-wall 72.0 -> 75.21, Agents' Last Exam 2026) in the orbiting pink disc for the whole riff"}
    for k in ('fadeOut', 'out'):
        pink.pop(k, None)
    cx = g['kc-pink-coxon']
    cox = {**cx, 'id': 'kc-blue-coxon', 'piece': 'blue', 't0': 'hb:3', 't1': 'hb:8', 'in': round(hb_song(3) + 431.22, 3),
           'frame': {'cx': 540, 'cy': 960, 'r': 122}, 'oversample': 2.0, 'zoom': [1.0, 1.06], 'freeze': 'song:22.98', 'fadeOut': 0.1,
           '_note': ("Coxon's own picture in sync with voice-coxon (song = source - 431.22), in the blue disc; frozen on source 454.20 (song 22.98), "
                     "before the show's camera cut at 454.22, so his face holds through 'again.' to the title downbeat (ENGINE REQUEST: kandclip freeze)")}
    br = g['kc-blue-racks']
    dc = {**br, 'id': 'kc-blue-dc', 't0': 'hb:8', 't1': 'hb:16.35', 'broll': 'nvidia-nvl72-factory', 'in': 39.8,
          'speed': round(2.35 / (hb_song(16.35) - hb_song(8)), 4),
          '_note': "broll nvidia-nvl72-factory 39.8-42.15 'rows of racks in a data hall' (NVIDIA, 2025) in the blue disc from the title downbeat"}
    rep = {'kc-pink-agents-a': pink, 'kc-pink-coxon': cox, 'kc-blue-racks': dc}
    out = [rep.get(x['id'], x) for x in out if x['id'] not in ('kc-pink-agents-b',)]
    g = {x['id']: x for x in out}
    # beat-cut close-ups follow: Coxon's disc (hb:5, hb:7), the agents disc (hb:6); the title close-ups capped at 1.08 so the
    # wordmark stays in frame (the first strip showed the 'e' cut at 1.15)
    rf = g['kand-riff']['preset']['reframe']
    rf[0].update({'focus': 'blue', 'to': [560, 900]})
    rf[1].update({'focus': 'pink', 'to': [560, 820]})
    rf[2].update({'focus': 'blue', 'to': [560, 900]})
    for x in rf:
        if x['at'] in (13, 14):
            x['zoom'] = 1.08
    g['riff-credit']['text'] = "IN THE DISCS: AGENTS' LAST EXAM, 2026 · NVIDIA NVL72 DATA HALL, 2025"

    # ENGINE REQUEST (fluid fadeIn, implemented): the colour floods in over ~0.18 s from the title downbeat
    g['fluid-riff']['fadeIn'] = 0.18

    # FIXES (verify "voice-coxon"): keep the whole of 'again' (vowel + nasal to 454.36): out 454.37, a 25 ms fade
    vc = g['voice-coxon']
    vc['audio'] = {'in': 452.42, 'out': 454.37, 'fade_ms': 25, 'duck_db': 9}
    vc['t1'] = 'song:23.15'
    vc['verified'] = True
    vc['_note'] = ("AUDIBLE over the riff (vocal-free 19.0-26.9): '…restarted the thing, and it did it again.' (clips/transcripts/coxon.json; "
                   "small.en on the window). 'Like,' ends 452.27 and the gap 452.28-452.53 is silent, so the in-point carries none of it")
    # FIXES (verify "kar-coxon", optional): real onsets
    words_set(g['kar-coxon'], [('…RESTARTED', 452.52), ('THING,', 453.12), ('AND', 453.72)])
    return out


# ============================================================================================ VERSE 1 (hb:16 - hb:48)
def verse1():
    V = load('verse1')
    out = [clean(it['engine']) for it in V['items']]
    g = {x['id']: x for x in out}
    # FIXES (verse1.verify "v1-agents"): the intro video dissolves to grey from source ~75.8: 0.25x keeps 4 beats inside 75.21-75.69
    g['v1-agents']['speed'] = 0.25
    g['v1-agents']['_note'] = ("MUTED b-roll: continues the riff's kc-pink-agents-b (ale-agent-wall, 75.21 at hb:16); 0.25x so the 4 beats show "
                               "75.21-75.69, before the source dissolves to grey (~75.8). The logo's pink disc becomes this frame (legacy morph)")
    # FIXES (verify "p-nvlink", optional): one continuous shot (the window had a hard cut at 27.03)
    g['p-nvlink']['in'] = 27.05
    g['p-nvlink']['speed'] = 0.7
    # FIXES (verify "pile-insecure", optional): the NBC crop starts after the section label (no stray 'ENCE')
    for s in g['pile-insecure']['shots']:
        if s['id'] == 'capabilities-nbc-gpt6-astra':
            s['crop'] = [450, 150, 2560, 640]
    # FIXES (verify "pile-die", MEDIUM): the pushed / lifted / circled phrase keeps its baseline 'over next 30 years' (tesseract
    # word boxes on the Guardian image: 'over' 1045-1179 on line 2, 'next 30 years' 21-422 on line 3)
    for s in g['pile-die']['shots']:
        if s['id'] == 'theory-guardian-hinton-odds':
            s['hl'] = [[533, 10, 1158, 70], [18, 88, 1185, 161], [18, 172, 428, 240]]
            s['_note'] = "phrase: 'shortens odds of the technology wiping out humanity over next 30 years' (baseline kept)"
    # FIXES (verify "p-pause"): the footage is from the promo, not of the 28 Feb march
    g['p-pause']['credit'] = 'PAUSEAI UK · MARCH FOR AI SAFETY PROMO · FEB 2026'
    # FIXES (verify "kar-amodei", optional): 'down.' starts at 194.80 (song 32.663): the word, its underline and the CBS lift after it
    words_set(g['kar-amodei'], [('down.', 194.80)])
    g['kar-amodei']['marks'][0]['at'] = 'song:32.67'
    for e in g['pile-news']['emph']:
        if e['style'] == 'lift':
            e['at'] = 'song:32.67'
    # FIXES (verify "kar-coxon-v1"): the heard line starts mid-sentence ('Yeah,' trimmed): leading ellipsis; real onsets; the whole
    # Coxon snippet (voice, karaoke, picture) moves 0.06 s earlier so 'jobs' (source 529.34) lands ON hb:38 (song 37.619)
    sh = -0.06
    kc = g['kar-coxon-v1']
    kc['speech']['words'][0]['w'] = '…There'
    words_set(kc, [("won't", 528.98), ('jobs', 529.34), ('world.', 529.92)])
    kc['speech']['at'] = f'song:{37.159 + sh:.3f}'
    kc['t0'] = f'song:{37.1 + sh:.3f}'
    kc['metaAt'] = f'song:{37.25 + sh:.3f}'
    vcx = g['voice-coxon-v1']
    vcx['at'] = vcx['t0'] = f'song:{37.159 + sh:.3f}'
    vcx['t1'] = f'song:{38.459 + sh:.3f}'
    pc = g['p-coxon-v1']
    pc['t0'] = f'song:{37.339 + sh:.3f}'
    pc['entry']['at'] = f'song:{37.339 + sh:.3f}'
    # ENGINE REQUEST (panel freeze, implemented): no silent mouth after his last word ('world.' ends ~530.1 = song 38.40)
    pc['freeze'] = f'song:{38.46 + sh:.3f}'
    # FIXES (verify "eq-attn", "eq-upd", optional): exact labels
    g['eq-attn']['label']['text'] = 'each word decides which words matter'
    g['eq-upd']['label']['text'] = 'gradient descent: every weight nudged downhill'
    # FIXES (verify "p-coast", optional): the boat clip is OpenAI's (Clark & Amodei, Dec 2016), shown on DeepMind's 2020 blog
    g['p-coast']['credit'] = 'COASTRUNNERS RL AGENT · OPENAI 2016 (VIA DEEPMIND BLOG)'
    # FIXES (verify "pile-exploit", optional): the TIME fragment keeps its actor ('OpenAI Used Kenyan Workers...'; tesseract box of
    # 'OpenAI' 511-776 x 282-366) and the crop no longer touches the ink of 'Toxic'
    for s in g['pile-exploit']['shots']:
        if s['id'] == 'time-2023-01-18-kenyan-workers':
            s['crop'] = [120, 250, 920, 800]
            s['hl'] = [[506, 280, 780, 368], [157, 367, 604, 458], [158, 455, 716, 529], [159, 540, 782, 623]]
    # ENGINE REQUEST (tower view, implemented): the tower sits 140 px lower so the equation cards (y 250-650) never cover it
    g['v1-tower']['view'] = {'dx': 0, 'dy': 140}
    return out, V


# ============================================================================================ CHORUS (hb:48 - hb:80)
def chorus():
    C = load('chorus')
    out = [clean(it['engine']) for it in C['items']]
    g = {x['id']: x for x in out}
    # ASSEMBLY: id clash with verse 1's kar-amodei
    g['kar-amodei']['id'] = 'kar-amodei-60'
    g = {x['id']: x for x in out}
    # FIXES (chorus.verify "p-sora"): the source cut (18.043) lands on the hb:50 crash; the panel shows the profile, then the eyes
    g['p-sora']['in'] = 16.833
    g['p-sora']['_note'] = "AI-generated anime character in profile, then a close-up of eyes with sparks (Sora 2 reel, OpenAI 2025); the reel's cut at 18.043 lands on the hb:50 crash"
    # FIXES (verify "voice-count"): keep the whole 'thirty-two' (vowel to 161.73): out 161.76; in 158.17 (no tail of 'have')
    vc = g['voice-count']
    vc['audio'] = {'in': 158.17, 'out': 161.76, 'fade_ms': 30, 'duck_db': 8}
    vc['at'] = vc['t0'] = 'song:46.339'
    vc['t1'] = 'song:49.929'
    g['kar-count']['speech']['in'] = 158.17
    g['kar-count']['speech']['at'] = 'song:46.339'
    # FIXES (verify "voice-elected"): end in the silence before the next word (808.25)
    ve = g['voice-elected']
    ve['audio'] = {'in': 804.04, 'out': 808.20, 'fade_ms': 40, 'duck_db': 8}
    ve['t1'] = 'song:54.115'
    # FIXES (verify "chart-dc", optional): the values are Epoch estimates (graphs.json caption)
    g['chart-dc']['subtitle'] = GRA['dc-record-mw']['subtitle'] + ' (Epoch estimates)'
    # ENGINE REQUEST (zoomthrough focus on a chart point, implemented): dive exactly into the 946 MW record (point 5)
    # FIXES (verify "credit-racks", optional): the footage is the 2024 site, not Colossus 2
    g['credit-racks']['text'] = 'XAI COLOSSUS (2024 SITE), MEMPHIS · SERVETHEHOME TOUR · 2024'
    pb = g['pile-before']
    for s in pb['shots']:
        if s['id'] == 'fli-2023-03-22-pause-letter':     # FIXES (verify "pile-before", optional): legible
            s['w0'] = 880
    # ASSEMBLY (verse1.verify "pile-insecure" (c)): the NYT 'ignored employees' card is verse 1's bar-4 lead phrase; the chorus's
    # third 'before' card is CNN's 'AI researchers are sounding the alarm on their way out the door' (Feb 2026) instead
    pb['shots'] = [s if s['id'] != 'xrisk-nyt-ignored-warnings' else
                   {'id': 'xrisk-rev2-cnn-2026-02-11-researchers-alarm-on-way-out', 'at': s['at'], 'entry': s['entry'], 'hlAt': s['hlAt'],
                    'crop': [60, 240, 2420, 530]} for s in pb['shots']]
    pb['_note'] = ("'And I wish I'd done this before': the early warnings (Hinton quits Google 2023, the FLI pause letter 2023) and CNN Feb 2026 "
                   "'AI researchers are sounding the alarm on their way out the door' (pushed, lifted, circled)")
    # ENGINE REQUEST (screens per-shot second phrase, implemented): the X post's baseline 'every ~10 weeks' is marked before
    # 'now it's every ~11 days' is pushed and lifted (verify "pile-cadence": keep the antecedent on screen)
    for s in g['pile-cadence']['shots']:
        if s['id'] == 'capabilities-rev3-jfonsecarivera-post-header-text':
            s['marks'] = [{'hl': 0, 'style': 'marker', 'at': 'hb:58.25', 'color': '#F2C300', 'dur': 0.24}]
    # Gallup: 'Americans turn skeptical' underlined after the headline's marker (engine request 2)
    for e in g['scr-gallup']['emph']:
        if e['style'] == 'underline':
            e['hl'] = 1
    # ASSEMBLY: the refrain's bar 21 is the GRPO advantage formula as its hero (eq-adv, hb:84); the chorus's small copy of the same
    # formula 3.5 s earlier (eq-grpo-adv, hb:77) is dropped, and the GRPO cite goes back to the record's own (eq. 3)
    out = [x for x in out if x['id'] != 'eq-grpo-adv']
    g['eq-grpo']['cite'] = {'at': 'hb:74.25', 'px': 24}
    # ASSEMBLY: chorus splats draw into the chorus's paint canvas
    for x in out:
        if x.get('layer') == 'paint':
            x['layer'] = 'paint-ch'
    return out, C


# ============================================================================================ REFRAIN + GOD + INSTRUMENTAL (hb:80 -)
def refrain(cut):
    R = load('refrain-inst')
    out = []
    for it in R['items']:
        if cut not in it.get('cuts', ['long', 'short']):
            continue
        x = clean(it['edl'])
        x.pop('skipIn', None)
        out.append(x)
    g = {x['id']: x for x in out}
    # ASSEMBLY: id clashes (chorus chart-dc; prelude paint/paper)
    if 'chart-dc' in g:
        g['chart-dc']['id'] = 'chart-gw'
    g['paint']['id'] = 'paint-rf'
    for k in ('paper', 'paper-s'):
        if k in g:
            g[k]['id'] = 'paper-rf'
    g = {x['id']: x for x in out}
    if cut == 'long':
        # FIXES (refrain-inst.verify "pile-upset"): the X post is the chorus's (pile-cadence); TNW is the single card
        pu = g['pile-upset']
        pu['shots'] = [{'id': 'frontier-tnw_headline', 'at': 'hb:88', 'entry': 'slam', 'hl': 0, 'w0': 960}]
        pu['push'] = {'at': 'hb:89.5', 'z': 1.25, 'shot': 0, 'to': [540, 1330], 'dur': 0.3}
        pu['emph'] = [{'style': 'lift', 'at': 'hb:89.5', 'shot': 0}, {'style': 'circle', 'at': 'hb:89.75', 'shot': 0, 'color': '#B31B1B'}]
        pu['_note'] = "'Unrelentlessly upset': OpenAI's chief scientist says no lab should keep scaling at maximum speed (TNW, Sep 6 2026)"
        # FIXES (verify "cp-thanks", optional): the source's hard cut (625.80) now lands after the collapse
        g['cp-thanks']['in'] = 623.9
        # FIXES (verify "pile-try", optional): headline-only crops (no half-clipped metadata row, no competing dates)
        for s in g['pile-try']['shots']:
            if s['id'] == 'openai-alignment-2026-09-25-agent-dns':
                s['crop'] = [540, 250, 1860, 455]
            if s['id'] == 'security-rev2-cso-six-misalignment-incidents':
                s['crop'] = [20, 30, 1880, 490]
        # FIXES (verify "kar-amodei-a", optional): real onsets
        words_set(g['kar-amodei-a'], [('We', 676.97), ("can't", 677.20), ('yet', 677.54), ('fully', 677.91), ('close', 678.30), ('the', 678.57), ('loop.', 678.66)])
    # FIXES (verify "pile-rsi" / "spit1"): the GovAI crop keeps the whole 'R&D' (ink to x 940)
    for s in g['pile-rsi']['shots']:
        if s['id'] == 'frontier-govai_head':
            s['crop'] = [20, 30, 960, 305]
        if s['id'] == 'frontier-anthropic_rsi_head':      # advisory: the date is the inferred first publication
            s['label'] = 'ANTHROPIC · FIRST PUBLISHED JUN 4, 2026'
    sp = g['spit1']
    sp['crop'] = {'x0': 20, 'y0': 30, 'x1': 960, 'y1': 305}
    sp['frame']['h'] = 181
    sp['frame']['y'] += (194 - 181) // 2
    # FIXES (verify "kar-amodei-b"): the karaoke words on the real onsets (clip - 612.262 = song); the underline after 'loop,'
    words_set(g['kar-amodei-b'], [('…positive', 686.10), ('feedback', 686.52), ('loop,', 686.90), ('that', 687.52), ('cycle,', 688.06),
                                  ("it's", 688.68), ('not', 688.92), ('yet', 689.14), ('going', 689.26), ('super', 689.56), ('fast,', 689.90),
                                  ('but', 690.30), ("it's", 690.37), ('definitely', 690.66), ('started.', 691.15)])
    for m in g['kar-amodei-b']['marks']:
        if m['phrase'] == 'positive feedback loop':
            m['at'] = 'song:74.74'
    # FIXES (verify "chart-dc" -> chart-gw, optional): Epoch's tracked sites, never a world total
    g['chart-gw']['title'] = 'AI data centres Epoch tracks: total power'
    # FIXES (verify "pile-golden", optional): the marker covers the closing quote of 'golden age'
    for s in g['pile-golden']['shots']:
        s['hl'] = [[1299, 520, 1526, 593], [357, 614, 480, 671]]
    # FIXES (verify "disc-credit-1/2", "fog-credit", optional)
    g['disc-credit-1']['text'] = 'IN THE DISCS: GALAXY · FIGURE AI · 2026'
    g['disc-credit-2']['text'] = 'IN THE DISCS: UNITREE ROBOTICS · 2026'
    g['fog-credit']['text'] = "FROM YOSHUA BENGIO'S TED2025 TALK"
    # ASSEMBLY: refrain paint into paint-rf; god-bar and outro beat tracks get canvases above the fog and the cream
    for x in out:
        if x.get('layer') == 'paint':
            x['layer'] = 'paint-rf'
    res = []
    for x in out:
        res.append(x)
        if x['id'] == 'fog':
            res.append({'id': 'paint-god', 'type': 'layer', 'kind': 'canvas', '_note': "the God bar's beat track over the fog footage"})
        if x['id'] == 'g-cream-b':
            res.append({'id': 'paint-out', 'type': 'layer', 'kind': 'canvas', '_note': "the instrumental's beat track over its cream"})
    return res, R


def beatfx_of(plan, cut=None, layer=None):
    out = []
    for b in plan.get('beatfx', []):
        if cut and cut not in b.get('cuts', ['long', 'short']):
            continue
        b = {k: v for k, v in b.items() if k not in ('cuts', 'skipIn')}
        if '_' in b:
            b['_note'] = b.pop('_')
        if layer:
            b['layer'] = layer(b)
        out.append(b)
    return out


def transitions_of(plan, cut=None):
    out = []
    for t in plan.get('transitions', []):
        if cut and cut not in t.get('cuts', ['long', 'short']):
            continue
        t = {k: v for k, v in t.items() if k not in ('cuts', 'skipIn')}
        if '_' in t:
            t['_note'] = t.pop('_')
        out.append(t)
    return out


def ensure_prep(items):
    """footage panels / kandclips that name a b-roll id or a video src but no "prep" (the refrain plan's centre panels) get
    "prep": "clip", so prep_clips.py extracts their frames"""
    for x in items:
        if x['type'] in ('panel', 'kandclip') and 'prep' not in x and (x.get('broll') or (x.get('src') and not x['src'].lower().endswith(('.png', '.jpg', '.jpeg', '.webp')))):
            x['prep'] = 'clip'
    return items


THEMES_TAIL = [{'t0': 'hb:80', 't1': 'hb:108', 'theme': 'light'}, {'t0': 'hb:108', 't1': 'hb:112', 'theme': 'dark'},
               {'t0': 'hb:112', 't1': 999, 'theme': 'light'}]

# the prelude's layout (the showcase's: taller footage box, caption sizes)
LAYOUT = json.loads(json.dumps(json.load(open(EDLDIR / 'showcase.json'))['layout']))
