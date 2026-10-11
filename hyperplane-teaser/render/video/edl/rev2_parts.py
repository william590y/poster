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
        if it['type'] == 'layer' and it['id'] != 'sketch':   # shared canvases live for the whole cut (no refs into the short's cut)
            x.pop('t0', None); x.pop('t1', None)
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

    # FIXER r1 (director, prelude): the talking heads were ~35 % of the frame height and sat still for ~5 s each, and the weakest
    # beats of the cut were here (hb:-25, -14, -13, -11). The footage box is now 1080x900 (47 %: LAYOUT below; tighter source crops,
    # Altman's still above his talk's burned-in subtitles), and every bar downbeat gets a push-in snap on the speaker (clip punch,
    # they step in and stay, replacing the slow push), the off-beats a pencil mark on the word just spoken or a smaller snap. Both
    # cuts open with a paint dab behind the red '2015' tag on frame 0 (a scroll-stopping first second). The Altman -> Amodei swap
    # already is a transition (tr-wipe, a paint wipe between his last word and Amodei's first: it stays on the speech, not on hb:-16).
    al, am = g['altman'], g['amodei']
    al['crop'] = {'x': 340, 'y': 50, 'w': 540}         # source 920x720: rows 50-500, clear of the burned-in subtitles (y > 520)
    al['zoom'] = [1.0, 1.03]
    al['punch'] = [{'at': 'hb:-24', 'z': 1.04, 'dur': 0.1}, {'at': 'hb:-20', 'z': 1.04, 'dur': 0.1}, {'at': 'song:10.04', 'z': 1.06, 'dur': 0.12}]
    al['shakes'] = [{'at': 'hb:-24', 'amp': 6, 'decay': 0.08}, {'at': 'hb:-20', 'amp': 6, 'decay': 0.08}, {'at': 'song:10.04', 'amp': 11, 'decay': 0.1}]
    al['caption']['marks'] = [{'phrase': 'probably', 'style': 'underline', 'at': 'hb:-25', 'dur': 0.16, 'color': '#F2C300', 'width': 7},
                              {'phrase': 'most likely', 'style': 'underline', 'at': 'song:8.42', 'dur': 0.28, 'color': '#F2C300', 'width': 7}]
    am['crop'] = {'x': 240, 'y': 120, 'w': 540}        # source 1280x720: rows 120-570 (Amodei, VandeHei's knee, the Axios wall)
    am['zoom'] = [1.0, 1.0]
    am['box'] = {'x': 0, 'y': 360, 'w': 1080, 'h': 840}   # 60 px shorter: his caption, the unheard '75%' line and the source fit the safe zone
    am['sub']['size'] = 40
    am['punch'] = [{'at': 'hb:-16', 'z': 1.05, 'dur': 0.12}, {'at': 'hb:-13', 'z': 1.02, 'dur': 0.1}, {'at': 'hb:-12', 'z': 1.035, 'dur': 0.1},
                   {'at': 'song:13.51', 'z': 1.02, 'dur': 0.1}, {'at': 'hb:-11', 'z': 1.02, 'dur': 0.1}, {'at': 'song:14.23', 'z': 1.04, 'dur': 0.12},
                   {'at': 'hb:-8', 'z': 1.02, 'dur': 0.1}]
    am['shakes'] = [{'at': 'hb:-16', 'amp': 7, 'decay': 0.07}, {'at': 'hb:-13', 'amp': 4, 'decay': 0.07}, {'at': 'hb:-12', 'amp': 6, 'decay': 0.08},
                    {'at': 'hb:-11', 'amp': 4, 'decay': 0.07}, {'at': 'song:14.23', 'amp': 6, 'decay': 0.08}]
    fp = g['frame-pencil']
    fp['shapes'][0].update({'y': 352, 'h': 916})
    fp['shapes'][1].update({'y0': 1282, 'y1': 1282})
    ix = next(i for i, x in enumerate(out) if x['id'] == 'altman')
    out.insert(ix, {'id': 'splat-open', 'type': 'splat', 't0': 0, 'at': 0.0, 't1': 'hb:-20', 'x': 118, 'y': 318, 'r': 92, 'color': '#FF2E88',
                    'dir': -20, 'layer': 'paint', 'cullDur': 0.6, 'hit': 8,
                    '_note': "FIXER r1: a paint dab bursts behind the red '2015' tag on frame 0 (the short's first second)"})

    # FIXES (verify "voice-coxon"): keep the whole of 'again' (vowel + nasal to 454.36): out 454.37, a 25 ms fade
    vc = g['voice-coxon']
    vc['audio'] = {'in': 452.42, 'out': 454.37, 'fade_ms': 25}   # duck: mix.py's rule (>= 10 LU over the loud riff, max 15 dB)
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
    # FIXES (verify "pile-exploit", optional): the TIME fragment keeps its actor ('OpenAI Used Kenyan Workers...'; tesseract box of
    # 'OpenAI' 511-776 x 282-366) and the crop no longer touches the ink of 'Toxic'
    for s in g['pile-exploit']['shots']:
        if s['id'] == 'time-2023-01-18-kenyan-workers':
            s['crop'] = [120, 250, 920, 800]
            s['hl'] = [[506, 280, 780, 368], [157, 367, 604, 458], [158, 455, 716, 529], [159, 540, 782, 623]]
    # ENGINE REQUEST (tower view, implemented): the tower sits 140 px lower so the equation cards (y 250-650) never cover it
    g['v1-tower']['view'] = {'dx': 0, 'dy': 140}
    # ASSEMBLY (first strip): bar 6's news pile covered Amodei's karaoke (y 790-960): the pile sits lower and the karaoke is drawn
    # above it; bar 7's DPO card and the TechCrunch card move down so the karaoke reads until it leaves, and the fold's flap is
    # confined to the pile's zone (rect 'item' meant the whole frame for a pile, so its violet back covered everything)
    pn = g['pile-news']
    pn['center'] = [540, 1330]
    pn['jitter'] = {'x': 50, 'y': 20, 'rot': 6}
    pn['push']['to'] = [540, 1300]
    ka = g['kar-amodei']
    out.remove(ka)
    out.insert(out.index(pn) + 1, ka)
    g['eq-dpo']['cy'] = 1160
    ps = g['pile-syco']
    ps['region'] = {'x0': 60, 'y0': 1350, 'x1': 1020, 'y1': 1560}
    ps['push']['to'] = [540, 1450]
    for t in V['transitions']:
        if t['id'] == 'tr-v1-fold':
            t['rect'] = [40, 960, 1000, 620]
    # the equation cards' labels sit above the cards: the cards start lower so every label stays in the safe zone (y >= 250), and
    # the update rule clears the loss's cite line
    g['eq-attn']['y'] = 360
    g['eq-ntp']['y'] = 360
    g['eq-upd']['y'] = 660
    g['p-coast']['credit'] = 'COASTRUNNERS · OPENAI 2016 (VIA DEEPMIND BLOG)'
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
    vc['audio'] = {'in': 158.17, 'out': 161.76, 'fade_ms': 30, 'duck_db': 9}     # 9 dB (was 8): >= 10 LU over the chorus
    vc['at'] = vc['t0'] = 'song:46.339'
    vc['t1'] = 'song:49.929'
    g['kar-count']['speech']['in'] = 158.17
    g['kar-count']['speech']['at'] = 'song:46.339'
    # FIXES (verify "voice-elected"): end in the silence before the next word (808.25)
    ve = g['voice-elected']
    ve['audio'] = {'in': 804.04, 'out': 808.20, 'fade_ms': 40, 'duck_db': 9}
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
    # FIXES (verify "chart-dc" -> chart-gw, optional): Epoch's tracked sites, never a world total: the subtitle ('Combined IT power of
    # the 93 AI data centres Epoch tracks') rolls out right behind the title (a longer title wrapped onto the subtitle on the strip)
    g['chart-gw']['subAt'] = 'hb:96.25'
    # FIXES (verify "pile-golden", optional): the marker covers the closing quote of 'golden age'
    for s in g['pile-golden']['shots']:
        s['hl'] = [[1299, 520, 1526, 593], [357, 614, 480, 671]]
    # FIXES (verify "disc-credit-1/2", "fog-credit", optional)
    g['disc-credit-1']['text'] = 'IN THE DISCS: GALAXY · FIGURE AI · 2026'
    g['disc-credit-2']['text'] = 'IN THE DISCS: UNITREE ROBOTICS · 2026'
    g['fog-credit']['text'] = "FROM YOSHUA BENGIO'S TED2025 TALK"
    # ASSEMBLY (mix dry run): a fixed 9 dB duck left the refrain and closing Amodei only 5-6.5 LU over the loud song; mix.py's own
    # rule (raise the duck until speech is >= 10 LU over the song, at most 15 dB) decides instead
    for k in ('voice-amodei-a', 'voice-amodei-b'):
        if k in g:
            g[k]['audio'].pop('duck_db', None)
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
# FIXER r1: the prelude's talking heads at 1080x900 (47 % of the frame, was 740); the caption a little smaller so it and its source
# line stay inside the safe zone under the taller box and clear of the right rail
LAYOUT['clipBox'] = {'x': 0, 'y': 360, 'w': 1080, 'h': 900}
LAYOUT['caption'] = {**LAYOUT['caption'], 'size': 50, 'w': 860, 'gap': 34}


def bad_refs(edl):
    """every "hb:"/"song:" string in an EDL that does not resolve (e.g. falls in the cut of a spliced song): [(path, ref, error)]"""
    sys_path = str(ROOT / 'render/video')
    import sys
    if sys_path not in sys.path:
        sys.path.insert(0, sys_path)
    from timeref import TimeRef, TIME_RE
    TR = TimeRef(edl)
    bad = []

    def walk(v, path):
        if isinstance(v, dict):
            for k, x in v.items():
                walk(x, path + '.' + str(k))
        elif isinstance(v, list):
            for i, x in enumerate(v):
                walk(x, f'{path}[{i}]')
        elif isinstance(v, str) and TIME_RE.match(v) and v.split(':')[0] in ('hb', 'song'):
            try:
                TR(v)
            except Exception as e:
                bad.append((path, v, str(e)[:60]))
        elif isinstance(v, str) and '..' in v and v.startswith('hb:'):
            pass
    for key in ('items', 'transitions', 'beatfx', 'fx', 'themes', 'finalHold'):
        walk(edl.get(key), key)
    return bad


DEF_DUR = {'circle': 0.42, 'underline': 0.22, 'marker': 0.24, 'lift': 0.22, 'box': 0.36}


def fit_emph(edl):
    """screens piles whose last pencil emphasis (circle / underline / box) would still be drawing at the impact of the pile's
    outgoing transition draw it faster, so it is complete one frame before the impact (it never vanishes half-drawn); the
    beat it starts on is unchanged. Returns [(item, style, old dur, new dur)]."""
    import sys
    sp = str(ROOT / 'render/video')
    if sp not in sys.path:
        sys.path.insert(0, sp)
    from timeref import TimeRef
    TR = TimeRef(edl)
    imp = {}
    for t in edl.get('transitions', []):
        for i in t.get('out', []):
            imp[i] = min(imp.get(i, 1e9), TR(t['at']))
    for x in edl['items']:
        for k in ('enterFx', 'exitFx'):
            pass
    done = []
    for x in edl['items']:
        if x['type'] != 'screens' or not isinstance(x.get('emph'), list):
            continue
        end = imp.get(x['id'], TR(x['t1']))
        for e in x['emph']:
            if e.get('style') not in ('circle', 'underline', 'box') or 'at' not in e:
                continue
            a, d = TR(e['at']), e.get('dur', DEF_DUR[e['style']])
            if a + d > end - 1 / 30 and end - 1 / 30 - a >= 0.12:
                nd = round(end - 1 / 30 - a, 3)
                e['dur'] = nd
                done.append((x['id'], e['style'], d, nd))
    return done


def early_emph(edl, read=0.5):
    """FIXER r1 (critic 'late payoffs'): a pile's end-of-bar emphases (lift, circle, underline, box, marker) finished as the pile
    was already leaving (folded / zoomed / shattered at its outgoing transition's impact), so the finished highlight was seen for
    1-2 frames. Every emphasis that would complete less than `read` s before that impact (else before t1) now starts on the
    latest 8th of the hits grid that lets it finish in time (its duration trimmed to fit, never below 0.14 s), never before its
    card has landed (+0.06 s: pre-lit as it slams in); the push-in moves up with it. Returns [(item, style, old at, new ref)]."""
    import math, sys
    sp = str(ROOT / 'render/video')
    if sp not in sys.path:
        sys.path.insert(0, sp)
    from timeref import TimeRef
    TR = TimeRef(edl)
    imp = {}
    for t in edl.get('transitions', []):
        for i in t.get('out', []):
            imp[i] = min(imp.get(i, 1e9), TR(t['at']))
    done = []
    for x in edl['items']:
        if x['type'] != 'screens' or not isinstance(x.get('emph'), list) or not x['emph']:
            continue
        end = imp.get(x['id'], TR(x['t1']))
        D = end - read
        shots = x['shots']
        lands = [TR(s['at']) if isinstance(s, dict) and 'at' in s else None for s in shots]
        P = x.get('push') if isinstance(x.get('push'), dict) else None
        for e in x['emph']:
            if 'at' not in e:
                continue
            a, d = TR(e['at']), e.get('dur', DEF_DUR.get(e['style'], 0.3))
            if a + d <= D + 1e-3:
                continue
            k = e.get('shot', len(shots) - 1)
            k = k if k >= 0 else len(shots) + k
            floor = (lands[k] if k < len(lands) and lands[k] is not None else TR(x['t0'])) + 0.06
            # latest 8th with room for at least min(d, 0.2) s
            hb = (TR.song_at(D - min(d, 0.2)) - 19.232) / BEAT
            cand = math.floor(hb * 2 + 1e-6) / 2
            ref = f'hb:{cand:g}'
            try:
                na = TR(ref)
            except Exception:
                na = None
            if na is None or na < floor:
                na, ref = floor, round(floor, 4)
            nd = max(0.14, min(d, D - na))
            e['at'] = ref
            if nd < d - 1e-3:
                e['dur'] = round(nd, 3)
            done.append((x['id'], e['style'], round(a, 3), ref))
            if P and 'at' in P and TR(P['at']) > na + 1e-3:
                P['at'] = ref
    return done


def fixer_r1(items, cut):
    """FIXER r1 (critics on the assembled cuts, 11 Oct): layout and craft changes applied after safe_nudges, shared by both cuts.
    Each block names the critic issue it answers."""
    g = {x['id']: x for x in items}
    def has(k): return k in g
    # ---- the self-improvement loop (critic 'the acceleration does not read'): bigger ring (r 210 -> 250, ~60 % of the frame width
    # with its nodes), a comet tail a third of the ring at the slowest lap that grows with each faster lap, a shock ring and a
    # tick on every lap; the top and bottom labels sit beside their nodes (the title above and the facts below need the room)
    for k in ('loop-a', 'loop-a-s'):
        if has(k):
            L = g[k]
            L['r'] = 250
            L['labelSide'] = ['right', None, 'right', None]
            L['tailBase'], L['tailK'], L['lapShock'] = 1.9, 1.5, True
    if has('loop-b'):
        g['loop-b'].update({'tailBase': 1.9, 'tailK': 1.5, 'lapShock': True})
    # ---- the refrain's data-centre chart (critic: small, colliding): the card is 940 x 482 (87 % x 25 % of the frame), the plot
    # 670 x 200 with the unit inside it; no big counter (its 'GW' doubled the axis unit and it printed over the subtitle): the
    # value label at the line's head counts up instead, at 56 px; the subtitle wraps in a narrower column so the head's label is
    # clear of it; the source line rolls out while the last points land (complete before the dive), under the x labels
    if has('chart-gw'):
        c = g['chart-gw']
        c.update({'x': 175, 'y': 1300, 'w': 660, 'h': 178, 'titlePx': 50, 'titleGap': 196, 'subPx': 23, 'subW': 600, 'valuePx': 56,
                  'card': {'x': 70, 'y': 1090, 'w': 940, 'h': 482, 'color': '#FBF6EC', 'rot': -0.6},
                  'sourceAt': 'hb:97.25', 'sourcePer': 0.02, 'sourceY': 1538, 'sourcePx': 21, 'sourceW': 760, 'sourceX': 140})
        c.pop('counter', None)
        c['yAxis'] = {**c.get('yAxis', {}), 'labelPx': 28, 'labelIn': 'top'}   # the unit top-left inside the plot (the first point sat on it)
        a = c['annotate'][0]
        a.update({'dx': -330, 'dy': 70, 'px': 38, 'w': 330, 'at': 'hb:98.125', 'per': 0.03})
    if has('pile-golden'):   # the Guardian card and its chip a little higher: the chip sat on the top node's label
        for sh in g['pile-golden']['shots']:
            sh['y'] = 318
    if has('cp-golden'):   # its credit sat under the 'Faster research' label: shorter, smaller, clear of the bottom node and the chart
        g['cp-golden']['credit'] = 'ORACLE · STARGATE · 2025'
        g['cp-golden']['creditSize'] = 24
        g['cp-golden']['creditAt'] = [64, 1046]
    # ---- verse 1, the DPO beat (critic: grey on near-black, an almost empty frame at 27.3-27.5): white chalk drawn fast, the
    # PauseAI footage painted in 0.3 s earlier and larger, over Amodei's closing iris
    if has('eq-dpo'):
        g['eq-dpo'].update({'color': '#FFF8EA', 'penColor': '#FFF8EA', 'rowDur': 0.3, 'fillDur': 0.16, 'glyphDur': 0.05, 'cy': 1075})   # 85 px up: the TechCrunch card covered its last row
    if has('p-pause'):
        pp = g['p-pause']
        pp['t0'] = 'hb:28.9'
        pp['entry'] = {'style': 'paint', 'at': 'hb:28.9'}
        pp['frame'] = {**pp['frame'], 'r': 250}
    # ---- verse 1, the 3D net (critic: a yellow slab cropped by the frame edges, buried under five other things): the tower has its
    # first bar to itself with the attention equation (the FPGA panel is gone), the camera stands back so the blocks stay inside
    # the frame, and the heads fan out on beats 2, 3, 4 (attention of blocks 1-3) with the output token on the next downbeat;
    # Coxon's portrait, the tweet and the Guardian card come in smaller on the second bar, around the tower
    if has('p-fpga'):
        g['p-fpga']['enabled'] = False
    if has('v1-tower'):
        vt = g['v1-tower']
        vt['infer'] = ['hb:32', 'hb:33', 'hb:33.5', 'hb:34', 'hb:34.5', 'hb:35', 'hb:35.5', 'hb:36']
        vt['cam'] = {**vt.get('cam', {}), 'dist': 34, 'fov': 40, 'attnX': 1.0, 'mlpX': -1.2, 'lead': 0.4}
        vt['view'] = {'dx': 0, 'dy': 170}
    if has('p-coxon-v1'):
        g['p-coxon-v1']['frame'] = {'cx': 790, 'cy': 480, 'r': 175}
    if has('kar-coxon-v1'):
        k = g['kar-coxon-v1']
        k.update({'lead': 0.08, 'metaAt': k['t0'], 'metaCps': 110, 'metaWrap': True, 'plate': {'color': 'rgba(14,13,18,0.88)', 'pad': 22}})
    if has('pile-jobs'):
        pj = g['pile-jobs']
        pj['region'] = {'x0': 60, 'y0': 1150, 'x1': 1020, 'y1': 1560}
        pj['w'] = 700
        pj['overlap'] = 0.0
        for sh in pj['shots']:
            if sh['id'] == 'xrisk-rev2-x-coxon-2026-09-08-resigned-anthropic':
                # the post's header and its first sentence only (the paragraph read as a dumped block); its marker lands on it
                sh.update({'crop': [20, 20, 610, 214], 'w0': 520, 'at': 'hb:36.75', 'hlAt': 'hb:37.25'})
            else:
                sh.update({'at': 'hb:37.75', 'w0': 700})
        pj['pulse'] = ['hb:37.75', 'hb:38']
        pj['push'] = {**pj['push'], 'z': 1.25, 'to': [540, 1380]}
    # ---- the chorus's GRPO objective over the racks (critic: pale lavender on cornflower, ~3:1, illegible on a phone; a green smudge
    # over 1/G Σ; the source line weak on the purple footage): ink on a cream card, 20 % larger, the markers yellow on cream (the
    # green was yellow multiplied on blue), red and pink circles drawn heavier, label and source line on dark chips
    if has('eq-grpo'):
        q = g['eq-grpo']
        q.update({'mode': 'pencil', 'color': '#15131F', 'penColor': '#2A2832', 'px': 48, 'maxW': 1000,
                  'card': {**q['card'], 'color': '#FBF6EC', 'pad': 26}})
        q['label'] = {**q['label'], 'color': '#FBF6EC', 'bg': {'color': '#0E0D12', 'pad': 12}}
        q['cite'] = {**(q.get('cite') or {}), 'color': '#FBF6EC', 'px': 24, 'bg': {'color': '#0E0D12', 'pad': 10}}
        for h in q['hl']:
            if h.get('from') == 'highlight':
                h.update({'color': '#B31B1B', 'width': 9, 'padX': 24, 'padY': 28})
            elif h.get('from') == 'extra:0':
                h.update({'color': '#FF2E88', 'width': 9, 'padX': 34, 'padY': 28})
    # ---- low-severity, cheap (critics): -------------------------------------------------------------------------------------
    # 'exploit' pile: the emphasis was on TIME's 2023 Kenyan-workers card (unstamped under newer cards); it now lands on Susman
    # Godfrey's $1.5 billion piracy settlement (Sep 2025), which lands last and on top; TIME 2023 stays in the pile, behind
    if has('pile-exploit'):
        pe = g['pile-exploit']
        sh = {x['id']: x for x in pe['shots']}
        sg, va = sh['susmangodfrey-2025-09-25-piracy-settlement'], sh['capabilities-variety-suno-v6']
        va.update({'at': 'hb:45', 'entry': 'slam'})
        sg.update({'at': 'hb:45.5', 'entry': 'paint', 'hl': 0})
        pe['shots'] = [x for x in pe['shots'] if x['id'] not in (sg['id'], va['id'])] + [va, sg]
        pe['push'] = {**pe['push'], 'shot': 3, 'at': 'hb:46.5', 'z': 1.3}
        pe['emph'] = [{'style': 'lift', 'at': 'hb:46.5', 'shot': 3}, {'style': 'circle', 'at': 'hb:46.5', 'shot': 3, 'dur': 0.3}]
    # riff: the whole-art whip turns the fresh title upside down for a shorter moment (360 deg in half a beat into hb:12)
    if has('kand-riff'):
        for m in g['kand-riff']['moves']:
            if m.get('move') == 'whip':
                m.update({'at': 'hb:11.5', 'dur': 0.5})
    # 'it's brutal out here' (critic: 'it's' completes 0.4 s after its onset, 'out' starts ~0.1 s late, the ghost text overlaps the
    # burst's flying cards for ~0.3 s): 'it's' painted in 0.22 s, 'out' leads by 0.2 s, the line fades out over the burst's first 8th
    if has('brutal'):
        b = g['brutal']
        b['place'][0]['dur'] = 0.22
        b['place'][2]['lead'] = 0.2
        b['t1'] = 'hb:112.4'
        b['exit'] = {'style': 'fade', 'dur': 0.14}
    # the instrumental (critic: soft last bars, unlit quote words faint, no visible orbit, no impact on the cover): the pink and
    # black discs orbit each other once over the last two bars (eight 45-degree steps, home on hb:123), every piece bumps and the
    # frame blooms on the final downbeat; Amodei's unspoken words at 62 %
    if has('kand-re'):
        kr = g['kand-re']
        kr['moves'] = kr['moves'] + [{'move': 'orbit', 'pieces': ['pink', 'black'], 'on': 'hb:116..123', 'stepDeg': 45},
                                     {'move': 'bump', 'pieces': ['pink', 'black', 'core', 'blue', 'teal', 'square', 'target', 'band', 'smallO', 'nabla', 'chk'],
                                      'on': ['hb:124'], 'scale': 1.035, 'dur': 0.2}]
    if has('kar-amodei-b'):
        g['kar-amodei-b']['roll'] = {**g['kar-amodei-b'].get('roll', {}), 'dim': 0.62}
    return items


def fixer_fx(cut):
    """FIXER r1: the bloom flash on the cover's final downbeat (both cuts)"""
    return [{'id': 'fx-cover-bloom', 'fx': 'flash', 'on': ['hb:124'], 'opacity': 0.42, 'decay': 0.12, 'color': '#FFF8EA',
             '_note': 'FIXER r1: the cover lands on the final downbeat with a bloom flash (and a 3.5 % bump of every piece, kand-re)'}]


def hold_past(edl, old_end):
    """FIXER r1: every item (and theme) that ran to the old end of the cut runs to the new one (the cover holds past the music)"""
    import sys
    sp = str(ROOT / 'render/video')
    if sp not in sys.path:
        sys.path.insert(0, sp)
    from timeref import TimeRef
    TR = TimeRef(edl)
    n = 0
    for x in edl['items']:
        if 't1' in x:
            try:
                v = TR(x['t1'])
            except Exception:
                continue
            if v >= old_end - 1e-3:
                x['t1'] = edl['duration']
                n += 1
    return n


def safe_nudges(items):
    """text that sat on the safe zone's edge and crossed it under the camera shakes (coverage.py, first pass): moved inside"""
    g = {x['id']: x for x in items}
    def has(k): return k in g
    if has('v1-agents-credit'): g['v1-agents-credit']['y'] = 276; g['v1-agents-credit']['x'] = 76
    if has('coxon-stamp'): g['coxon-stamp']['stamp']['y'] = 262
    if has('loop-a'): g['loop-a']['title']['y'] = 270
    if has('loop-a-s'): g['loop-a-s']['title']['y'] = 270
    if has('chart-gw'): g['chart-gw']['sourceY'] = 1498
    if has('fog-credit'): g['fog-credit']['y'] = 1512
    if has('credit-racks'): g['credit-racks']['y'] = 1490
    for k in ('disc-credit-1', 'disc-credit-2'):
        if has(k): g[k]['x'] = 74
    if has('eq-ntp'): g['eq-ntp']['y'] = 400
    if has('eq-upd'): g['eq-upd']['y'] = 770
    if has('eq-adv'):
        g['eq-adv']['cy'] = 1345                         # its cite line sat on the safe zone's bottom edge (coverage)
        g['eq-adv']['px'] = 72
        g['eq-adv']['cite']['px'] = 20
        g['eq-adv']['label']['font']['size'] = 33       # two lines, clear of the centre panel's credit
    # verse 1: Amodei's karaoke stays until the DPO label rolls in (both moved half a beat), Coxon's karaoke wraps left of the
    # tower's yellow residual river (its words were unreadable over the river)
    if has('kar-amodei'):
        g['kar-amodei']['t1'] = 'hb:29.2'
        g['kar-amodei']['exit'] = {'style': 'fade', 'dur': 0.18}
    if has('eq-dpo'): g['eq-dpo']['label']['at'] = 'hb:29.25'
    if has('kar-coxon-v1'): g['kar-coxon-v1']['w'] = 440
    if has('chart-dc'):
        g['chart-dc']['x'] = 195; g['chart-dc']['w'] = 675
        # the callout sat on the title and subtitle (first render): it goes inside the plot, under the 1,000 line
        a = g['chart-dc']['annotate'][0]; a['dx'] = -360; a['dy'] = 90; a['px'] = 54
    if has('chart-gw'):
        a = g['chart-gw']['annotate'][0]; a['dx'] = -300; a['dy'] = 90; a['px'] = 34; a['w'] = 300
    if has('p-60'): g['p-60']['creditAt'] = [610, 712]      # was over the karaoke's name line (the long chip clamps left)
    # credit chips too long for the safe zone (they clamped onto its left edge or into the right rail): shorter, same facts
    if has('cp-try'):
        # final coverage pass: the 42-character chip (y 1088) ran into the right rail and under the loop's 'Faster research' label;
        # 30 characters, 40 px lower (between that label, bottom ~1122, and the DNS card's sloped top edge)
        g['cp-try']['credit'] = '@MECAGENT · GPT-6 ASTRA · 2026'
        g['cp-try']['creditAt'] = [64, 1128]
    if has('p-protein'): g['p-protein']['credit'] = 'ANTHROPIC · PROTEIN BINDERS BY CLAUDE · 2026'
    if has('p-pause'): g['p-pause']['credit'] = 'PAUSEAI UK · PROTEST FOOTAGE · 2026'   # the verifier's alternative wording
    for x in items:
        if x['type'] == 'panel' and x.get('creditAt') == [64, 262]:
            x['creditAt'] = [74, 274]
    return items
