"""Generator for edl/long2.json: the rev2 LONG cut (assembler, 11 Oct 2026). The intro cut, continuous: song 6.10 -> 80.40 (74.30 s),
edit = song - 6.10 throughout, no splice. Built from the four verified section plans (research/rev2/plan/{prelude-riff,verse1,
chorus,refrain-inst}.json) with every verifier fix applied (see edl/rev2_parts.py, which the short's generator shares).

  python3 render/video/edl/make_long_rev2.py && python3 render/video/prep_clips.py long2

The old edl/make_long.py / long.json (r1-r7) are kept untouched as history.
"""
import json, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import rev2_parts as P

SONG0, SONG_END = 6.10, 80.40
HOLD_PAST = 0.45                                   # FIXER r1: the cover holds 0.45 s past the music (critic: a 1.17 s hold was too short)
END = round(SONG_END - SONG0 + HOLD_PAST, 3)        # 74.75 (the music ends at 74.30 + its 0.35 s fade)


def build():
    pre = P.prelude_riff()
    ver, V = P.verse1()
    cho, C = P.chorus()
    ref, R = P.refrain('long')

    # ---- stacking (see rev2_parts doc): the verse's dark ground goes under the riff's logo (the break blows the pieces out over it)
    gdv = P.find(ver, 'g-dark-v1')
    ver = [x for x in ver if x['id'] != 'g-dark-v1']
    k = [x['id'] for x in pre].index('g-cream-riff')
    pre = pre[:k + 1] + [gdv] + pre[k + 1:]
    # chorus canvases: paint-ch over the cream (under the facts), paint-racks over the full-frame racks footage
    out = []
    for x in cho:
        out.append(x)
        if x['id'] == 'ch-paper':
            out.append({'id': 'paint-ch', 'type': 'layer', 'kind': 'canvas', '_note': "the chorus's beat track and splats"})
        if x['id'] == 'v-racks':
            out.append({'id': 'paint-racks', 'type': 'layer', 'kind': 'canvas', '_note': "the chorus's last two bars: paint over the racks footage"})
    cho = out
    items = P.fixer_r2(P.fixer_r1(P.safe_nudges(P.ensure_prep(pre + ver + cho + ref)), 'long'), 'long')
    gi = {x['id']: x for x in items}
    # FIXER r2 (william, medium: 'the 20.87 cut does not read as the logo breaking apart'): the riff's logo no longer blows out
    # under a hard cut to the dark verse; the pink disc and the band stay behind as the verse's frames (hidden on hb:16, the
    # frames morph out of them) and the rest of the cover page, wordmark included, shatters into shards (tr-riff-break below)
    for m in gi['kand-riff']['moves']:
        if m.get('move') == 'break':
            m.update({'at': 'hb:99', 'hideAt': 'hb:16'})

    # ---- transitions
    tr = P.r2_prelude_tr(P.transitions_of(load_pre()))
    vt = P.transitions_of(V)
    ill = next(t for t in vt if t['id'] == 'tr-v1-illum')
    ill['in'] = [x for x in next(t for t in C['transitions'] if t['id'] == 'tr-v1-illum')['_in_add']]   # chorus interface
    ct = [t for t in P.transitions_of(C) if not t.get('_shared')]
    for t in ct:
        t['out'] = ['kar-amodei-60' if i == 'kar-amodei' else i for i in t.get('out', [])]
        t['in'] = ['kar-amodei-60' if i == 'kar-amodei' else i for i in t.get('in', [])]
        if t['id'] == 'tr-ch-zoom72':
            t['focus'] = {'item': 'chart-dc', 'point': 5}      # engine request: the 946 MW record point
            t['_note'] = "the camera dives into the 946 MW record point (resolved from the chart) and comes out inside the data hall"
    # the hb:80 hand-off: ONE iris (the refrain's: out of the loop's own centre), with the chorus's outgoing items
    out80 = next(t for t in C['transitions'] if t['id'] == 'tr-ch-out80')['out']
    rt = P.transitions_of(R, 'long')
    for t in rt:
        if t['id'] == 'tr-refrain-in':
            t['out'] = [i for i in out80 if i != 'eq-grpo-adv']
        if t['id'] == 'tr-fold':
            t['id'] = 'tr-rf-fold'
        if t['id'] == 'tr-shatter':
            t['id'] = 'tr-rf-shatter'
        t['in'] = ['chart-gw' if i == 'chart-dc' else i for i in t.get('in', [])]
        t['out'] = ['chart-gw' if i == 'chart-dc' else i for i in t.get('out', [])]
    transitions = tr + vt + ct + rt
    # ---- FIXER r2 transitions
    T = {t['id']: t for t in transitions}
    # (director, low; william, medium) folds landed as a flat slab with nothing behind: the incoming frame is already under the
    # flap (mode 'away'), and the flap is a lit, lifted quad with a crease, grain and a cast shadow (transitions.js)
    T['tr-fold']['mode'] = 'away'
    T['tr-ch-fold52']['mode'] = 'away'
    # (william, medium) paint wipes were pure-paint frames on bar downbeats: the incoming frame is painted in through the strokes
    T['tr-v1-wipe']['style'] = 'matte'
    T['tr-ch-wipe64']['style'] = 'matte'
    # (director, medium) the hb:48 bloom peaked ON the bar with nothing under it: it peaks 0.1 s earlier, the teens pile lands on it
    T['tr-v1-illum']['at'] = 'hb:47.8'
    # (director + william, medium) hb:56 was a near-empty cream frame mid-whip: the whip runs half a beat earlier, so the CBS
    # circle and the count decelerate in and land ON the bar (with a shake, fixer_r2_fx)
    T['tr-ch-whip56']['at'] = 'hb:55.6'
    # (director, low) Hinton's portrait is not revealed under the page turn any more (it pops in with his own card, hb:21.5)
    T['tr-v1-turn']['in'] = [i for i in T['tr-v1-turn']['in'] if i != 'p-hinton']
    transitions.append({'id': 'tr-riff-break', 'type': 'shatter', 'at': 'hb:16', 'dur': 1.5, 'lead': 0.12, 'n': 22, 'impact': [540, 1236],
                        'out': ['g-cream-riff', 'ghost-riff', 'kand-riff', 'eq-superpose'], 'in': ['g-dark-v1'],
                        '_note': "FIXER r2: the cover page (wordmark, kicker, discs, the river) cracks from the wordmark and shatters into the dark verse; the pink disc and the band morph into the verse's frames on top"})

    # ---- beat tracks (each section's canvas) and fx events
    beatfx = (P.r2_prelude_bfx(P.beatfx_of(load_pre(), layer=lambda b: 'paint')) + P.beatfx_of(V, layer=lambda b: 'paint')
              + P.beatfx_of(C, layer=lambda b: 'paint-racks' if b['id'] == 'fx-ch-b' else 'paint-ch')
              + P.beatfx_of(R, 'long', layer=lambda b: {'fx-god': 'paint-god', 'fx-outro': 'paint-out'}.get(b['id'], 'paint-rf')))
    fx = ([dict(f) for f in V.get('fx', [])] + [dict(f) for f in R.get('fx', [])] + [f for f in P.fixer_fx('long') if f['id'] != 'fx-cover-bloom']
          + P.fixer_r2_fx('long'))

    themes = ([{'t0': 0, 't1': 'hb:0', 'theme': 'dark'}, {'t0': 'hb:0', 't1': 'hb:16', 'theme': 'light'}, {'t0': 'hb:16', 't1': 'hb:48', 'theme': 'dark'}]
              + C['themes'] + P.THEMES_TAIL)
    edl = {
        'name': 'long2',
        'title': "Hyperplane x 'brutal', rev2 LONG cut: the intro cut, continuous (song 6.10-80.40)",
        '_note': ("Generated by edl/make_long_rev2.py from research/rev2/plan/*.json (+ the verifier fixes, edl/rev2_parts.py). Edit = song - 6.10. "
                  "Prelude (Altman 2015, Amodei 2025, the Hugging Face pile, the pencil classifier sketch) -> the shatter into the riff (Coxon audible, "
                  "the logo painted on, river, superposition) -> verse 1 (the logo breaks: footage masks, screenshot piles on 8ths, DPO, the 3D tower, "
                  "Amodei and Coxon audible) -> the chorus (teens, the dream essays, Amodei's count, 60 Minutes, Epoch's record data centres, GRPO over "
                  "the racks) -> the refrain (the self-improvement loop: GRPO's advantage, Amodei 'We can't yet fully close the loop.', the data-centre "
                  "build-out, the black hole) -> 'it's brutal out here' painted on the sung words -> the burst, the reassembly, Amodei's closer -> the cover."),
        'rev': 2, 'fps': 30, 'width': 1080, 'height': 1920, 'duration': END,
        'audio': {'song': 'song/brutal.mp3', 'songStart': SONG0, 'note': 'edit time = song time - 6.10 (continuous)'},
        'song': {'file': 'song/brutal.mp3', 'segments': [{'in_s': SONG0, 'out_s': SONG_END, 'at': 0}], 'fade_in_s': 0.01, 'fade_out_s': 0.35,
                 'max_out_s': 80.45, 'bars': 'song/bars-hits.json', 'bar_tol_ms': 30,
                 'clean': {'dips': [[44.86, 45.25]], 'ramp_ms': 12, 'mode': 'full',
                           'note': "the explicit word ('fucking'), measured 44.86-45.25 (its /f/ starts at 44.86, the 't' of 'teenage' at 45.28)"}},
        'mix': {'limiter_max_gr_db': 6.5, 'speech_limiter_max_gr_db': 6.0},
        'outputs': {'song': 'out/rev2/hyperplane-brutal-long-9x16.mp4', 'clean': 'out/rev2/hyperplane-brutal-long-clean-9x16.mp4',
                    'no_song': 'out/rev2/hyperplane-brutal-long-no-song-9x16.mp4'},
        'look': {'ground': P.DARK},
        'layout': P.LAYOUT,
        'themes': themes,
        'finalHold': ['hb:124', END],
        'items': items,
        'transitions': transitions,
        'beatfx': beatfx,
        'fx': fx,
        'paintMask': [P.PAINT_MASK_RIFF],
    }
    return edl


_PRE = None


def load_pre():
    global _PRE
    if _PRE is None:
        _PRE = P.load('prelude-riff')
    return _PRE


if __name__ == '__main__':
    edl = build()
    print('  items held past the music (fixer r1):', P.hold_past(edl, round(SONG_END - SONG0, 3)))
    for r in P.early_emph(edl):
        print('  emph moved earlier (fixer r1, late payoffs):', r)
    for r in P.fit_emph(edl):
        print('  emph drawn faster to finish before its transition:', r)
    bad = [b for b in P.bad_refs(edl) if '..' not in b[1]]
    assert not bad, bad
    ids = [x['id'] for x in edl['items']]
    assert len(ids) == len(set(ids)), 'duplicate item ids'
    known = set(ids)
    for t in edl['transitions']:
        for i in t.get('out', []) + t.get('in', []):
            assert i in known, (t['id'], i)
    p = P.EDLDIR / 'long2.json'
    p.write_text(json.dumps(edl, indent=1, ensure_ascii=False) + '\n')
    print('wrote', p, len(edl['items']), 'items,', len(edl['transitions']), 'transitions,', len(edl['beatfx']), 'beat tracks; duration', END)
