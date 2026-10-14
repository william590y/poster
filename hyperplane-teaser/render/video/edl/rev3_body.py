"""rev3 pass, BODY (BUILD.md REVISION 3, changes 4-5): Bostrom closes both cuts; Musk "summoning the demon" replaces verse 1's
Amodei in the long cut; only the attention and the GRPO-gradient equations remain, the freed slots filled with other real content.

apply(edl, cut) edits the rev2 EDL dict in place (cut = 'long' | 'short') and returns it. Owned by the body editor. Every item,
track and transition it adds or touches carries a "REV3 body:" line in its _note. No engine module changes (EDL edits only).
Research: research/rev3/quotes.md + quotes.json (change 4: word times, audio edges, crops, credits) and
research/rev3/equations-audit.md + equations-rev3.json (change 5: the gradient record 'grpo-grad', the inventory, the free slots).

CHANGE 4a, the closer (both cuts, the same song times; short edit = song - 44.811):
  voice-amodei-b / kar-amodei-b / kc-blue-amodei -> voice-bostrom / kar-bostrom / kc-blue-bostrom, at the same list positions
  (the kandclip stays before fluid-re). Nick Bostrom, TED2015 (Vancouver, 16-20 Mar 2015; TED lists the talk as recorded
  2015-03-18): "Machine intelligence is the last invention that humanity will ever need to make." (clips/bostrom-ted-2015-full.mp4,
  src 466.03-469.90, 25 ms fades; room tone only on both sides, the next word "The" at 470.38). First word on hb:113 (voice at
  song 73.83): INVENTION lands on hb:116 (the kicker), HUMANITY on hb:118 (fx-re-zoom's punch, the blue disc's second grow),
  MAKE on hb:120. Speech ends song 77.52 (fade 77.70), 2.35 s before the music fade starts (80.05); the caption is gone by
  song 78.75 (hb:122.3) and the disc freezes on his closed mouth (song 77.75 = src 469.95), so the finished cover holds clean.
  The caption ROLLS OUT word by word as he says each word (karaoke with dim 0: a word appears, lit, on its own acoustic onset,
  the r1-r7 roll-out William liked), Newsreader on the cream plate, with "NICK BOSTROM, OXFORD PHILOSOPHER · TED2015" typed on.
  His original TED stage footage (one continuous shot 463.83-475.50, no slide, no cutaway) is in the blue disc.

CHANGE 4b, verse 1 (long only): p-amodei / voice-amodei / kar-amodei -> p-musk / voice-musk / kar-musk, same slots and list
  positions; tr-v1-zoom.in follows. Elon Musk, MIT AeroAstro Centennial Symposium, Fri 24 Oct 2014 (SpaceX & Tesla CEO):
  heard "…with artificial intelligence, we are summoning the demon." (clips/musk-mit-2014-demon.mp4, src 57.43-59.80, 20 ms
  fades, duck 9 dB like the Amodei line; "I mean," before it is cut, hence the leading ellipsis: the repo's rule, as for Altman and
  Coxon). Starts on hb:23.5 (song 30.603, the zoom-through's impact): "intelligence" on hb:25, "summoning" on hb:26, "demon" on
  hb:27; speech ends song 32.64, 0.38 s before tr-v1-fold (hb:28.5). Panel chip "MIT AEROASTRO CENTENNIAL · OCT 24, 2014"
  (39 chars: the full name overflows the frame), name line "ELON MUSK, SPACEX & TESLA CEO · 2014". His original red-curtain
  shot (one continuous shot 50.0-69.7 s) in the panel, lip-synced (picture in 57.43 at hb:23.5).
  pile-news: shot 4 (pushed in, lifted and circled on hb:27, i.e. on "demon") was CBS's 'Amodei says ... a "warning sign that
  we need to slow down"', Amodei's own sentence, which no longer plays: it becomes The Decoder, 17 Sep 2026, "An OpenAI model
  kept slipping prompt injections into its own notes, and researchers still aren't sure why" (security-decoder-compaction, hl 0,
  unused elsewhere, the same wide short footprint). The research's pick for this swap (9to5Google's Astra cancellation) is used
  for slot 3 below, where it carries the lyric, so it is not shown twice.

CHANGE 5, the equations (long; the short's only formula is eq-superpose, the intro editor's):
  - kept: eq-attn (unchanged).
  - eq-grpo (chorus hb:72-80 over the xAI racks; the id is kept, so tr-ch-zoom72 / tr-refrain-in still name it): the GRPO policy
    gradient alone, ref 'grpo-grad' (Shao et al. 2024, DeepSeekMath, arXiv:2402.03300, appendix A.1.6, eq. 20; the record's
    default 3-row form, exact). Rows pencilled on the beats hb:72 / 73 / 74, the cite rolled out from hb:75, the advantage
    circled on hb:76, the KL coefficient marker-swept on hb:77, the score function circled on hb:78, a pulse on every 16th of the
    last bar. maxW 880, drift / pulseAmt 1.02 (the defaults push it past the frame at the peak), pink beat flash.
  - eq-dpo (hb:28.5-32, "of who likes me and who hates you") -> chart-gallup: Bentley-Gallup 2026 (graphs.json gallup-harm),
    the share of Americans who say AI does more harm than good, all adults 40/31/31/39 % and ages 18-29 30/27/36/47 %, 2023-2026,
    drawn a year per 8th, the 2026 points landing on "hates"; it unfolds out of the news pile (tr-v1-fold) and dissolves into the
    tower (tr-v1-particles). Pairs with the TechCrunch sycophancy card (likes / hates).
  - eq-ntp + eq-upd (hb:40-44, "and they'd all be so disappointed") -> pile-leike: Jan Leike's resignation post (X, 17 May 2024,
    "... until we finally reached a breaking point."), over the top of the tower as the cards were, whipped in (tr-v1-whip),
    painted out (tr-v1-wipe); with pile-disappoint below it (TechCrunch, Common Dreams, Oct 2026) the resignations stack up.
  - eq-adv (hb:84-88, "this the kind of thanks I get") -> pile-astra: 9to5Google, 28 Sep 2026, "OpenAI cancels GPT-6.1 Astra release
    over misbehavior & safety concerns", in the loop's bottom zone (tr-rf-fold in, tr-rf-shatter out); it answers cp-try's GPT-6
    Astra driving SolidWorks ("All I did was try my best") one bar earlier.
"""
import copy

NOTE = 'REV3 body: '
HB0, BEAT = 19.232, 60 / 124


def B(x):
    return f'hb:{x:g}'


def note(x, text):
    """prepend a rev3 line to an item's / track's _note (the rev2 history stays after it)"""
    old = x.get('_note')
    x['_note'] = NOTE + text + (' | rev2: ' + old if old else '')


def _index(edl, iid):
    for k, x in enumerate(edl['items']):
        if x['id'] == iid:
            return k
    raise KeyError(iid)


def _get(edl, iid):
    return edl['items'][_index(edl, iid)]


def _tr(edl, tid):
    return next(t for t in edl['transitions'] if t['id'] == tid)


def _fx(edl, fid):
    return next(f for f in edl['fx'] if f['id'] == fid)


def _replace(edl, old_id, new):
    """put `new` where `old_id` was (same draw order) and rename every transition reference"""
    edl['items'][_index(edl, old_id)] = new
    _rename_refs(edl, old_id, new['id'])


def _rename_refs(edl, old_id, new_id):
    for t in edl.get('transitions', []):
        for k in ('out', 'in'):
            if k in t:
                lst = []
                for i in t[k]:
                    j = new_id if i == old_id else i
                    if j is not None and j not in lst:
                        lst.append(j)
                t[k] = lst


def _drop(edl, iid):
    edl['items'] = [x for x in edl['items'] if x['id'] != iid]
    for t in edl.get('transitions', []):
        for k in ('out', 'in'):
            if k in t:
                t[k] = [i for i in t[k] if i != iid]


# ============================================================ change 4a: the closer (both cuts)
BOSTROM_SRC = 'clips/bostrom-ted-2015-full.mp4'
BOSTROM_IN, BOSTROM_OUT, BOSTROM_AT = 466.03, 469.90, 73.83          # src s, src s, song s (the first word's vowel on hb:113)
BOSTROM_WORDS = [('Machine', 466.08), ('intelligence', 466.28), ('is', 466.93), ('the', 467.04), ('last', 467.10),
                 ('invention', 467.57), ('that', 468.17), ('humanity', 468.59), ('will', 468.92), ('ever', 469.05),
                 ('need', 469.21), ('to', 469.40), ('make.', 469.48)]   # acoustic onsets (research/rev3/quotes.md A.4)


def closer(edl, cut):
    old_v, old_k, old_c = _get(edl, 'voice-amodei-b'), _get(edl, 'kar-amodei-b'), _get(edl, 'kc-blue-amodei')
    off = BOSTROM_AT - BOSTROM_IN                                       # song = src + off (-392.2)
    voice = {
        'id': 'voice-bostrom', 'type': 'voice', 't0': f'song:{BOSTROM_AT:g}', 't1': 'song:77.7', 'src': BOSTROM_SRC,
        'at': f'song:{BOSTROM_AT:g}', 'audio': {'in': BOSTROM_IN, 'out': BOSTROM_OUT, 'fade_ms': 25}, 'verified': True,
        '_note': NOTE + "Nick Bostrom, TED2015: 'Machine intelligence is the last invention that humanity will ever need to make.' "
                        "src 466.03-469.90 (room tone only before 466.06 and from 469.76 to 470.36; the next word 'The' at 470.38; "
                        "re-transcribed on the exact cut: the 13 words, nothing else). 'Machine' (onset 466.075) sounds at song 73.875, "
                        "its vowel on hb:113 (73.910); speech ends song 77.52, fade 77.70. No duck_db: mix.py auto-ducks the "
                        "instrumental to keep the speech 10 LU above it (as for voice-amodei-b, which it replaces).",
    }
    kar = {
        'id': 'kar-bostrom', 'type': 'karaoke', 't0': 'song:73.7', 't1': 'song:78.5',
        'x': old_k.get('x', 72), 'y': old_k.get('y', 252), 'w': old_k.get('w', 940), 'size': 52,
        'style': {'serif': True}, 'font': {'weight': 600},
        'speech': {'in': BOSTROM_IN, 'at': f'song:{BOSTROM_AT:g}', 'words': [{'w': w, 's': s} for w, s in BOSTROM_WORDS]},
        'name': 'Nick Bostrom, Oxford philosopher', 'year': 'TED2015', 'metaAt': 'song:74.1', 'metaPx': 28, 'metaGap': 12,
        'roll': {'dim': 0},
        'marks': [{'phrase': 'the last invention', 'style': 'underline', 'at': 'song:75.45', 'dur': 0.22, 'color': '#FF2E88'},
                  {'phrase': 'ever need to make.', 'style': 'underline', 'at': 'song:77.35', 'dur': 0.22, 'color': '#15131F'}],
        'exit': {'style': 'fade', 'dur': 0.25}, 'theme': 'light', 'plate': {'color': 'rgba(242,235,221,0.9)', 'pad': 14},
        '_note': NOTE + "rolled out word by word as he says it (roll.dim 0: each word appears, lit, on its acoustic onset; the "
                        "r1-r7 Bostrom caption William liked), verbatim, no ellipsis (the sentence starts after 'Think about it.'). "
                        "Name line 'NICK BOSTROM, OXFORD PHILOSOPHER · TED2015' (TED lists him as philosopher; Oxford, FHI). "
                        "t1 song 78.5 + 0.25 s fade: gone by hb:122.3, the cover hold (hb:124) is clean. Underlines land after "
                        "'invention' (75.37) and 'make.' (77.28).",
    }
    clip = copy.deepcopy(old_c)
    for k in ('_note', 'crop'):
        clip.pop(k, None)
    t0s = HB0 + 112.75 * BEAT                                            # the disc's first frame (song s)
    clip.update({'id': 'kc-blue-bostrom', 'src': BOSTROM_SRC, 'in': round(t0s - off, 3), 'srcFocus': [0.54, 0.28], 'srcZoom': 1.8,
                 'tintK': 0.12, 'freeze': 'song:77.75'})
    note(clip, "Bostrom's TED2015 stage (original footage, one continuous shot) in the blue disc; crop {x:491,y:2,w:400,h:400} of "
               "1280x720 (srcFocus [0.54,0.28] + srcZoom 1.8: face centred, the red TED stage behind); picture = audio time "
               "(in 465.988 at hb:112.75); freeze on his closed mouth (song 77.75 = src 469.95: from 470.2 he speaks the next "
               "sentence, which is not heard); tintK 0.12 (0.2 turned the red stage maroon). Grows with kand-re's blue moves "
               "(hb:113.5, hb:118 = 'humanity').")
    _replace(edl, 'voice-amodei-b', voice)
    _replace(edl, 'kar-amodei-b', kar)
    _replace(edl, 'kc-blue-amodei', clip)
    z = _fx(edl, 'fx-re-zoom')
    note(z, "Bostrom's disc zooms up on 'humanity' (song 76.39, hb:118.3).")


# ============================================================ change 4b: Musk in verse 1 (long)
MUSK_SRC = 'clips/musk-mit-2014-demon.mp4'
MUSK_IN, MUSK_OUT, MUSK_AT = 57.43, 59.80, 30.603
MUSK_WORDS = [('…with', 57.43), ('artificial', 57.58), ('intelligence,', 58.15), ('we', 58.49), ('are', 58.60),
              ('summoning', 58.67), ('the', 59.03), ('demon.', 59.17)]


def musk(edl):
    old_p, old_k = _get(edl, 'p-amodei'), _get(edl, 'kar-amodei')
    voice = {
        'id': 'voice-musk', 'type': 'voice', 't0': f'song:{MUSK_AT:g}', 't1': 'song:32.973', 'src': MUSK_SRC, 'at': f'song:{MUSK_AT:g}',
        'audio': {'in': MUSK_IN, 'out': MUSK_OUT, 'fade_ms': 20, 'duck_db': 9}, 'verified': True,
        '_note': NOTE + "Elon Musk, MIT AeroAstro Centennial Symposium, 24 Oct 2014: heard 'with artificial intelligence, we are "
                        "summoning the demon.' (src 57.43-59.80). 'I mean,' ends at 57.39 (an in at <= 57.39 leaks its 'n': small.en "
                        "hears 'And with'; 57.40-57.54 hears 'With'). Speech ends 59.47, room tone to 60.62, no laughter, next speech "
                        "60.66. Over verse 1's 'And I'm so caught up in the news' (band gaps 30.56-30.82, 32.50-32.75: 'With' sounds "
                        "in the first, 'demon' ends in the second); song ducked 9 dB as under the Amodei line it replaces.",
    }
    pan = copy.deepcopy(old_p)
    pan.pop('_note', None)
    pan.update({'id': 'p-musk', 'src': MUSK_SRC, 'in': MUSK_IN, 'srcFocus': [0.461, 0.417], 'srcZoom': 1.2,
                'credit': 'MIT AEROASTRO CENTENNIAL · OCT 24, 2014'})
    note(pan, "Musk's original red-curtain shot (one continuous shot 50.0-69.7 s, no cutaway); crop {x:290,y:0,w:600,h:600} "
              "(srcFocus [0.461,0.417] + srcZoom 1.2); picture in 57.43 at hb:23.5 = lip sync with voice-musk (song = src - 26.827). "
              "Chip 'MIT AEROASTRO CENTENNIAL · OCT 24, 2014' (39 chars; the 62-char full form overflows the frame); the name and "
              "role are on kar-musk's line.")
    kar = copy.deepcopy(old_k)
    kar.pop('_note', None)
    kar.update({'id': 'kar-musk', 'size': 46,
                'speech': {'in': MUSK_IN, 'at': f'song:{MUSK_AT:g}', 'words': [{'w': w, 's': s} for w, s in MUSK_WORDS]},
                'name': 'Elon Musk, SpaceX & Tesla CEO', 'year': '2014',
                'marks': [{'phrase': 'summoning the demon.', 'style': 'underline', 'at': 'song:31.85', 'color': '#F2C300', 'dur': 0.3, 'width': 7}]})
    note(kar, "caption '…with artificial intelligence, we are summoning the demon.' (verbatim; the leading ellipsis because 'I mean,' "
              "is cut, the repo's rule as for Altman and Coxon; BUILD.md writes 'With ...'), word-lit on the acoustic onsets "
              "(research/rev3/quotes.md B.4: whisper puts 'intelligence' inside 'artificial'; it sounds at 58.15). size 46 keeps it "
              "on two lines (52 wraps to three and the pile covers the name line). Underline as 'summoning' is said (hb:26).")
    _replace(edl, 'p-amodei', pan)
    _replace(edl, 'voice-amodei', voice)
    _replace(edl, 'kar-amodei', kar)
    z = _tr(edl, 'tr-v1-zoom')
    z['_note'] = (z.get('_note') or '').replace('Amodei is inside it', 'Musk is inside it')
    note(z, "in: p-musk, kar-musk (were p-amodei, kar-amodei).")
    # the pile under him: the circled shot was Amodei's own (no longer heard) sentence
    pn = _get(edl, 'pile-news')
    s4 = pn['shots'][4]
    assert s4['id'] == 'xrisk-cbs-amodei', s4
    s4['id'] = 'security-decoder-compaction'
    note(pn, "shot 4 (pushed in, lifted and circled on hb:27 = 'demon') was CBS 2026-09-12 'Amodei says ... a \"warning sign that we "
             "need to slow down\"', the Amodei sentence that no longer plays: now The Decoder 2026-09-17 'An OpenAI model kept "
             "slipping prompt injections into its own notes, and researchers still aren't sure why' (security-decoder-compaction, "
             "hl 0 = 'kept slipping prompt injections into its own notes'; unused elsewhere; same wide short footprint).")


# ============================================================ change 5: the equations
def grpo_gradient():
    return {
        'id': 'eq-grpo', 'type': 'equation', 't0': 'hb:72', 't1': 'hb:80', 'ref': 'grpo-grad', 'drop': 'hb:72', 'mode': 'pencil',
        'rows': ['hb:72', 'hb:73', 'hb:74'], 'cx': 540, 'cy': 600, 'px': 48, 'maxW': 880,
        'card': {'color': '#FBF6EC', 'pad': 20, 'rot': -1.2, 'lead': 0.12},
        'label': {'text': "GRPO's policy gradient: each answer graded against its group", 'at': 'hb:72.25', 'per': 0.06,
                  'font': {'size': 38}, 'gap': 46, 'color': '#FBF6EC', 'bg': {'color': '#0E0D12', 'pad': 12}},
        'cite': {'at': 'hb:75', 'px': 24, 'color': '#FBF6EC', 'bg': {'color': '#0E0D12', 'pad': 10}},
        'hl': [{'from': 'adv_term', 'at': 'hb:76', 'style': 'circle', 'color': '#B31B1B', 'width': 9, 'padX': 24, 'padY': 28},
               {'from': 'highlight', 'at': 'hb:77', 'style': 'marker', 'color': '#F2C300', 'ink': '#15131F'},
               {'from': 'score_term', 'at': 'hb:78', 'style': 'circle', 'color': '#FF2E88', 'width': 9, 'padX': 30, 'padY': 26}],
        'pulse': {'from': 'hb:78.5', 'to': 'hb:79.75', 'every': 0.25}, 'theme': 'dark', 'exit': 'cut',
        'color': '#15131F', 'penColor': '#2A2832', 'drift': 1.02, 'pulseAmt': 1.02, 'flashColor': '#FF2E88',
        '_note': NOTE + "the GRPO policy gradient alone (William: 'for GRPO just show the gradient itself'): research/rev3/equations-rev3.json "
                        "'grpo-grad' = Shao et al. 2024, DeepSeekMath (arXiv:2402.03300), appendix A.1.6, eq. 20, the record's 3-row "
                        "`tex` (expectation / sums and the bracketed coefficient / score function; the only cuts are between the "
                        "paper's own terms, no symbol changed). Rows pencilled on the beats hb:72, 73, 74; cite from hb:75; the "
                        "advantage A-hat circled hb:76, the KL coefficient beta(pi_ref/pi_theta - 1) swept hb:77, the score function "
                        "circled hb:78; 16th pulses in the last bar. maxW 880 + drift/pulseAmt 1.02: the defaults (1.05/1.035) push a "
                        "900-wide equation out of the frame at the peak; pink flash (the default yellow is unreadable on the cream "
                        "card). The label glosses the advantage term (group-relative reward), as the rev2 label did; it adds no claim.",
    }


def chart_gallup():
    return {
        'id': 'chart-gallup', 'type': 'chart', 'graph': 'gallup-harm', 't0': 'hb:28.5', 't1': 'hb:32',
        'x': 150, 'y': 1118, 'w': 640, 'h': 150,
        'card': {'x': 60, 'y': 992, 'w': 960, 'h': 348, 'color': '#FBF6EC', 'rot': -0.6},
        'axesAt': 'hb:28.75', 'titleAt': 'hb:28.5', 'titlePx': 38, 'titleGap': 112, 'subAt': 'hb:28.75', 'subPx': 20, 'subPer': 0.03,
        'subW': 860, 'grow': ['hb:29', 'hb:29.5', 'hb:30', 'hb:30.5'], 'labels': 'all', 'valuePx': 30,
        'valueFmt': {'dec': 0, 'suffix': '%'}, 'yAxis': {'min': 20, 'max': 50, 'ticks': [20, 30, 40, 50]}, 'lineW': 6,
        'annotate': [{'at': 'hb:30.75', 's': 1, 'i': 3, 'text': 'ages 18-29: 47%', 'dx': 120, 'dy': -6, 'w': 190, 'px': 30, 'lines': 2,
                      'hl': '47%', 'lead': 0, 'per': 0.03}],
        'sourceAt': 'hb:29.5', 'sourcePer': 0.02, 'sourcePx': 18, 'sourceW': 860, 'sourceY': 1306, 'sourceX': 96,
        'splatColor': '#F2C300', 'theme': 'light',
        '_note': NOTE + "slot of eq-dpo ('of who likes me and who hates you'): Bentley-Gallup 2026 (research/rev2/graphs.json gallup-harm, "
                        "verified against the Gallup release of 28 Jul 2026; survey 4-11 May 2026, n 3,270): the share who say AI does "
                        "more harm than good, all adults (pink, values on the points) 40/31/31/39 %, ages 18-29 (blue, called out) "
                        "30/27/36/47 %. A year per 8th from hb:29, 2026 lands on 'hates' (hb:30.5). Card below kar-musk's name line "
                        "(y >= 992) and above pile-syco (y 1350, the 'likes' half). The chorus's scr-gallup (hb:76) is the headline "
                        "of the same release: a callback, a different form.",
    }


def pile_leike():
    return {
        'id': 'pile-leike', 'type': 'screens', 't0': 'hb:40', 't1': 'hb:44', 'region': {'x0': 60, 'y0': 330, 'x1': 1020, 'y1': 700},
        'w': 860, 'shots': [{'id': 'xrisk-rev2-x-leike-2024-05-17-breaking-point', 'at': 'hb:40', 'entry': 'slam', 'hlAt': 'hb:41',
                             'crop': [0, 290, 1096, 720]}],
        'push': {'at': 'hb:41.5', 'z': 1.12, 'dur': 0.3, 'to': [540, 520]}, 'emph': [{'style': 'lift', 'at': 'hb:41.5'}],
        'pulse': ['hb:42', 'hb:43'], 'out': 'cut', 'chips': 'all',
        '_note': NOTE + "slot of eq-ntp / eq-upd ('And they'd all be so disappointed'): Jan Leike's resignation post (X @janleike, 17 May "
                        "2024, verified; the main post, cropped: '... until we finally reached a breaking point.' marked hb:41 and "
                        "lifted hb:41.5, before 'disappointed' ~hb:41.9). Over the top of the tower where the cards sat; with "
                        "pile-disappoint below (TechCrunch / Common Dreams, Oct 2026) the safety resignations stack up from the 2024 "
                        "origin. Whipped in by tr-v1-whip, painted out by tr-v1-wipe.",
    }


def pile_astra():
    return {
        'id': 'pile-astra', 'type': 'screens', 't0': 'hb:84', 't1': 'hb:88', 'region': {'x0': 60, 'y0': 1150, 'x1': 1020, 'y1': 1570},
        'w': 900, 'shots': [{'id': 'security-astra-9to5', 'at': 'hb:84', 'entry': 'slam', 'hlAt': 'hb:85'}],
        'push': {'at': 'hb:85.5', 'z': 1.2, 'dur': 0.3, 'shot': 0, 'to': [540, 1350]},
        'emph': [{'style': 'lift', 'at': 'hb:85.5', 'shot': 0}, {'style': 'circle', 'at': 'hb:86.5', 'shot': 0, 'color': '#B31B1B', 'dur': 0.225}],
        'pulse': ['hb:85', 'hb:87'], 'out': 'cut', 'theme': 'light', 'chips': 'all',
        '_note': NOTE + "slot of eq-adv ('Is the kind of things I get', after 'All I did was try my best'): 9to5Google 28 Sep 2026 "
                        "'OpenAI cancels GPT-6.1 Astra release over misbehavior & safety concerns' (verified, unused elsewhere): the "
                        "thanks the model gets, one bar after cp-try's GPT-6 Astra driving SolidWorks. Bottom zone, inside tr-rf-fold / "
                        "tr-rf-shatter's rect [60,1130,960,450].",
    }


def equations(edl):
    _replace(edl, 'eq-dpo', chart_gallup())
    f = _tr(edl, 'tr-v1-fold')
    f['rect'] = [40, 975, 1000, 605]          # top at 975: the chart card (y 992) inside, kar-musk's name line (to ~y 970) outside
    f['_note'] = (f.get('_note') or '').replace('the DPO card unfolds', 'the Gallup chart unfolds').replace("Amodei's circle", "Musk's circle")
    note(f, "in: chart-gallup (was eq-dpo); rect top 960 -> 975 (still clear of the karaoke above, the chart card inside).")
    note(_tr(edl, 'tr-v1-particles'), "out: chart-gallup (was eq-dpo).")
    _replace(edl, 'eq-ntp', pile_leike())
    _drop(edl, 'eq-upd')
    note(_tr(edl, 'tr-v1-whip'), "in: pile-leike (was eq-ntp).")
    note(_tr(edl, 'tr-v1-wipe'), "out: pile-leike (was eq-ntp, eq-upd).")
    g = _get(edl, 'eq-grpo')
    assert g['ref'] == 'grpo', g['ref']
    _replace(edl, 'eq-grpo', grpo_gradient())
    note(_tr(edl, 'tr-ch-zoom72'), "in: eq-grpo is now the GRPO policy gradient (same id).")
    _replace(edl, 'eq-adv', pile_astra())
    note(_tr(edl, 'tr-rf-fold'), "in: pile-astra (was eq-adv).")
    note(_tr(edl, 'tr-rf-shatter'), "out: pile-astra (was eq-adv).")


def check_formulas(edl, cut):
    """change 5: the only formulas left are eq-attn and the GRPO gradient (long), plus eq-superpose until the intro pass removes it"""
    eqs = sorted(x['id'] for x in edl['items'] if x['type'] == 'equation')
    allowed = {'eq-attn', 'eq-grpo', 'eq-superpose'} if cut == 'long' else {'eq-superpose'}
    assert set(eqs) <= allowed, eqs
    if cut == 'long':
        assert {'eq-attn', 'eq-grpo'} <= set(eqs), eqs
        assert _get(edl, 'eq-grpo')['ref'] == 'grpo-grad'
    gone = {'eq-dpo', 'eq-ntp', 'eq-upd', 'eq-adv', 'p-amodei', 'voice-amodei', 'kar-amodei', 'voice-amodei-b', 'kar-amodei-b', 'kc-blue-amodei'}
    for t in edl.get('transitions', []):
        assert not gone & set(t.get('out', []) + t.get('in', [])), t['id']


def notes_top(edl, cut):
    n = edl.get('_note') or ''
    rep = [("DPO, the 3D tower, Amodei and Coxon audible", "the Gallup chart, the 3D tower, Musk and Coxon audible"),
           ("GRPO over the racks", "the GRPO policy gradient over the racks"),
           ("GRPO's advantage, ", "the Astra cancellation, "),
           ("Amodei's closer", "Bostrom's closer")]
    for a, b in rep:
        n = n.replace(a, b)
    edl['_note'] = n + (' | REV3 body: Bostrom (TED2015) closes; ' + ("Musk (MIT 2014) replaces verse 1's Amodei; equations: attention + the "
                        "GRPO gradient only (DPO -> Gallup chart, next-token loss + update -> Leike's post, GRPO advantage -> the Astra "
                        "cancellation)." if cut == 'long' else 'the short has no other quote or formula of change 4/5.'))


def apply(edl, cut):
    assert cut in ('long', 'short'), cut
    closer(edl, cut)
    if cut == 'long':
        musk(edl)
        equations(edl)
    check_formulas(edl, cut)
    notes_top(edl, cut)
    return edl
