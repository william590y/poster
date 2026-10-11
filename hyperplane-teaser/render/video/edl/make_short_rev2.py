"""Generator for edl/short2.json: the rev2 SHORT cut (assembler, 11 Oct 2026), built from the same pieces as the long (edl/rev2_parts.py).

  song 6.10 -> 26.477 (the prelude and the riff to beat 15)  |splice, 20 ms gain crossfade|  65.188 -> 80.40 (refrain beat 95 to the cover)
  edit = song - 6.10 before the splice (edit 20.377), song - 44.811 after it; 35.589 s.

The splice is the one William already heard in the r4-r7 short (riff beat 15 -> refrain bar 23 beat 4: same bar phase, 20 bars), re-checked
here against song/hits.json's grid and the song's onsets/RMS (see the song.note). The refrain plan's "short_entrance" says how the
short enters: the riff's logo breaks into halftone particles that swirl and land on the cream loop world (tr-entrance-short).

  python3 render/video/edl/make_short_rev2.py && python3 render/video/prep_clips.py short2

The old edl/make_short.py / short.json are kept untouched as history.
"""
import json, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import rev2_parts as P

SONG0, SPL_A, SPL_B, SONG_END = 6.10, 26.477, 65.188, 80.40
SPLICE = round(SPL_A - SONG0, 3)                     # edit 20.377
OFF2 = SPL_B - SPLICE                                # edit = song - 44.811 after the splice
HOLD_PAST = 0.45                                     # FIXER r1: the cover holds 0.45 s past the music
END = round(SONG_END - OFF2 + HOLD_PAST, 3)          # 36.039
E = lambda s: round(s - SONG0, 4) if s <= SPL_A else round(s - OFF2, 4)
HB = lambda i: E(P.hb_song(i))
RIFF_OUT = round(HB(96) + 0.05, 3)                   # the riff items' end: just past tr-entrance-short's window (FIXER r1: hb:95.06 - 95.86)


def build():
    pre = P.prelude_riff()
    ref, R = P.refrain('short')
    g = {x['id']: x for x in pre}
    # ---- the riff side of the splice: every riff item alive at song 26.477 ends with the entrance transition (its refs to beats
    # 15-17 fall in the cut of the song, so they are given in edit seconds or dropped)
    riff_out = ['kand-riff', 'kc-pink-agents', 'kc-blue-dc', 'fluid-riff', 'g-cream-riff', 'splat-drop', 'eq-superpose', 'riff-credit']
    for k in riff_out + ['paper']:
        g[k]['t1'] = SPLICE if k == 'paper' else RIFF_OUT
    k = g['kand-riff']
    k['moves'] = [m for m in k['moves'] if m['move'] != 'break']
    for m in k['moves']:                               # bar 3's 8th-note orbits stop at riff beat 14.5 (15.5 is in the cut)
        if isinstance(m.get('on'), dict) and m['on'].get('to') == 'hb:15.5':
            m['on']['to'] = 'hb:14.5'
    k['_note'] = "the riff's logo, cut at riff beat 15 by the splice: it breaks into particles on the refrain's bar-24 downbeat (tr-entrance-short)"
    # the disc footage stays inside its catalogued windows to the end of the transition
    kp = g['kc-pink-agents']
    kp['speed'] = round((75.21 - 72.0) / (RIFF_OUT - HB(1.25)), 4)
    kd = g['kc-blue-dc']
    kd['speed'] = round(2.35 / (RIFF_OUT - HB(8)), 4)
    for x in (kp, kd):                                 # own cache folders: the long's copies play at other speeds
        x['frames'] = 'short-' + x['id']
    eq = g['eq-superpose']
    eq['pulse'] = ['hb:13', 'hb:14']                  # hb:15 is in the cut
    eq['exit'] = 'cut'
    g['riff-credit']['exit'] = 'cut'
    items = P.fixer_r2(P.fixer_r1(P.safe_nudges(P.ensure_prep(pre + ref)), 'short'), 'short')
    gi = {x['id']: x for x in items}
    # FIXER r2: the ghost b-roll under the riff ends with the riff (hb:16 is in the cut of the song)
    gi['ghost-riff']['t1'] = RIFF_OUT
    gi['ghost-riff']['frames'] = 'short-ghost-riff'   # its own cache folder (a shorter life than the long's)
    riff_out.append('ghost-riff')
    # FIXER r2 (director, medium: the loop's 2 s were cluttered by an empty chart card and the Guardian card over the top node):
    # the short drops the build-out chart and the 'golden age' card; the loop has the frame, its comet lighting the four nodes one
    # per beat (hb:96-100), then laps twice as fast in the big loop; only Palisade's shutdown-resistance card lands on hb:100.5
    items = [x for x in items if x['id'] not in ('chart-gw', 'pile-golden')]
    gi = {x['id']: x for x in items}
    pg = gi['pile-gone']
    pg['shots'] = [s for s in pg['shots'] if s['id'].startswith('palisade')]
    pg['emph'] = [{'style': 'circle', 'at': 'hb:102', 'shot': 0, 'color': '#B31B1B'}]
    gi['cp-golden']['frame'] = {**gi['cp-golden']['frame'], 'r': 165}
    gi['cp-golden']['frames'] = 'short-cp-golden'      # its own cache folder (the long's disc is r 140)
    # (william, medium) the short's loop world had only the centre disc as footage: Galaxy's Helios campus going up (aerial of two
    # long halls with chillers, 2026) printed into the cream under the loop (multiply 30 %), as under the riff and the reassembly
    k = next(i for i, x in enumerate(items) if x['id'] == 'g-cream-s')
    items.insert(k + 1, {
        'id': 'ghost-loop-s', 'type': 'panel', 't0': 'song:65.188', 't1': 'hb:100.6', 'prep': 'clip', 'broll': 'galaxy-helios-datacenter', 'in': 25.2,
        'speed': 0.9, 'shape': 'rect', 'frame': {'x': 0, 'y': 0, 'w': 1080, 'h': 1920}, 'entry': {'style': 'fade', 'at': 'song:65.188', 'dur': 0.3},
        'out': 'cut', 'border': 'none', 'kb': {'z': [1.0, 1.1]}, 'alpha': 0.3, 'blend': 'multiply',
        'grade': {'sat': 0.3, 'contrast': 0.85, 'brightness': 0.07, 'gamma': 1.55, 'grain': 0}, 'theme': 'light',
        '_note': "FIXER r2: MUTED ghost b-roll under the short's loop (Galaxy's Helios AI data centre going up, 2026), multiply 30 %"})
    gi = {x['id']: x for x in items}
    gi['cp-golden']['credit'] = 'STARGATE 2025 · BEHIND: GALAXY HELIOS 2026'
    gi['cp-golden']['creditAt'] = [64, 1160]      # under the loop (the chart card is gone), clear of the bottom node's label
    gi['cp-golden']['creditSize'] = 26
    # FIXER r1 (critic: the short's loop could not read as accelerating): the laps run 1 bar (hb:96-100, the small loop), then
    # 2 beats x2, 1 beat x2 and 8ths x4 in the big loop (hb:100-108, into the collapse): each lap twice as fast as the last
    g2 = {x['id']: x for x in items}
    g2['loop-a-s']['build'] = 'hb:95.25'
    g2['loop-a-s']['laps'] = {'from': 'hb:96', 'plan': [[4, 1]]}
    g2['loop-b']['laps'] = {'from': 'hb:100', 'plan': [[2, 2], [1, 2], [0.5, 4]]}

    # ---- transitions
    tr = P.r2_prelude_tr(P.transitions_of(P.load('prelude-riff')))
    rt = P.transitions_of(R, 'short')
    for t in rt:
        if t['id'] == 'tr-entrance-short':
            t['out'] = riff_out
            t['in'] = t['in'] + ['ghost-loop-s']
            # FIXER r2 (director, medium: the splice at edit 20.377 was not punctuated, the riff logo held to hb:96): an iris out of
            # the loop's centre opens ON the splice (window 20.377-20.861 = hb:95 - 0.025 beat to hb:96), so picture and music cut
            # together, and the loop world is whole on the bar-24 downbeat (hb:96) where its first lap starts
            for k in ('grid', 'swirl', 'colors', 'trail'):
                t.pop(k, None)
            t.update({'type': 'iris', 'at': 'hb:95', 'dur': 1.0, 'lead': 0.025, 'shape': 'circle', 'mode': 'open', 'c': [540, 760], 'rim': 'yellow',
                      'spin': 120, 'flash': {'opacity': 0.35, 'decay': 0.06, 'color': '#FFF8EA'}, 'shake': 10})
            t['_note'] = ("THE SHORT'S ENTRANCE (fixer r2): an iris out of the loop centre opens on the splice (edit 20.377, song 26.477 | 65.188) "
                          "with a flash and a hit; the riff's logo stays round it until the iris passes the frame edge (hb:95.85)")
        t['in'] = [i for i in ('chart-gw' if i == 'chart-dc' else i for i in t.get('in', [])) if i not in ('chart-gw', 'pile-golden')]
        t['out'] = [i for i in ('chart-gw' if i == 'chart-dc' else i for i in t.get('out', [])) if i not in ('chart-gw', 'pile-golden')]
    for t in rt:
        if t['id'] == 'tr-dive-s':
            t['out'] = t['out'] + ['ghost-loop-s']
    for t in tr:
        if t['id'] == 'tr-fold':
            t['mode'] = 'away'      # FIXER r2: the HF pile is already under the folding flap (no flat slab)
    transitions = tr + rt

    bfx = P.r2_prelude_bfx(P.beatfx_of(P.load('prelude-riff'), layer=lambda b: 'paint'))
    for b in bfx:
        if b['id'] == 'fx-riff-b':
            b['to'] = 'hb:14.5'                       # hb:15.5 is in the cut
    bfx += P.beatfx_of(R, 'short', layer=lambda b: {'fx-god': 'paint-god', 'fx-outro': 'paint-out'}.get(b['id'], 'paint-rf'))

    edl = {
        'name': 'short2',
        'title': "Hyperplane x 'brutal', rev2 SHORT cut: prelude + riff, a splice, the refrain's last lines to the cover (35.6 s)",
        '_note': ("Generated by edl/make_short_rev2.py from the same pieces as the long (edl/rev2_parts.py). Edit = song - 6.10 to the splice at "
                  f"edit {SPLICE} (song {SPL_A}), then song - {OFF2:.3f}. Prelude (Altman, Amodei, the Hugging Face pile) -> the riff (Coxon audible, "
                  "the logo painted on) -> the splice into the refrain's bar 23 beat 4: the logo dissolves into particles that land on the loop world "
                  "(the data-centre build-out, 'golden age'), the zoom-through into the big loop and the black hole, 'it's brutal out here' painted "
                  "on the sung words, the burst, the reassembly with Amodei's closer, the cover."),
        'rev': 2, 'fps': 30, 'width': 1080, 'height': 1920, 'duration': END,
        'audio': {'song': 'song/brutal.mp3', 'songStart': SONG0, 'note': f'SPLICED: edit = song - 6.10 to {SPLICE}, then song - {OFF2:.3f}; see song.segments'},
        'song': {'file': 'song/brutal.mp3', 'segments': [{'in_s': SONG0, 'out_s': SPL_A, 'at': 0}, {'in_s': SPL_B, 'out_s': SONG_END, 'at': SPLICE}],
                 'xfade_ms': 20, 'xfade_shape': 'gain', 'bars': 'song/bars-hits.json', 'bar_tol_ms': 30, 'fade_in_s': 0.01, 'fade_out_s': 0.35,
                 'max_out_s': 80.45, 'note': SPLICE_NOTE},
        'mix': {'limiter_max_gr_db': 6.5, 'speech_limiter_max_gr_db': 6.0},
        'outputs': {'song': 'out/rev2/hyperplane-brutal-short-9x16.mp4', 'no_song': 'out/rev2/hyperplane-brutal-short-no-song-9x16.mp4'},
        'look': {'ground': P.DARK},
        'layout': P.LAYOUT,
        'themes': [{'t0': 0, 't1': 'hb:0', 'theme': 'dark'}, {'t0': 'hb:0', 't1': 'hb:108', 'theme': 'light'},
                   {'t0': 'hb:108', 't1': 'hb:112', 'theme': 'dark'}, {'t0': 'hb:112', 't1': 999, 'theme': 'light'}],
        'finalHold': ['hb:124', END],
        'items': items,
        'transitions': transitions,
        'beatfx': bfx,
        'fx': [f for f in P.fixer_fx('short') if f['id'] != 'fx-cover-bloom'] + P.fixer_r2_fx('short'),
        'paintMask': [{**P.PAINT_MASK_RIFF, 'to': RIFF_OUT}],
    }
    return edl


SPLICE_NOTE = ("Splice riff beat 15 -> refrain bar 23 beat 4 (the r4-r7 short's splice, which William has heard): song 26.477 is 13 ms before hb:15 "
               "(26.490) and 65.188 is 12 ms before hb:95 (65.200), so both cuts sit just ahead of the beat's attack with the same beat phase "
               "(beat 4 of a bar on both sides, 80 beats apart). Re-checked 11 Oct (assembler) on song/brutal.mp3: see the onset/RMS figures in "
               "the assembler's notes. 20 ms raised-cosine (gain) crossfade centred on the cut. Not on a bar line by design: bar 23's downbeat is "
               "inside 'upset' and bar 24's inside the pickup 'They say'.")

if __name__ == '__main__':
    edl = build()
    print('  items held past the music (fixer r1):', P.hold_past(edl, round(SONG_END - OFF2, 3)))
    for r in P.early_emph(edl):
        print('  emph moved earlier (fixer r1, late payoffs):', r)
    for r in P.fit_emph(edl):
        print('  emph drawn faster to finish before its transition:', r)
    bad = [b for b in P.bad_refs(edl) if '..' not in b[1]]
    assert not bad, bad
    ids = [x['id'] for x in edl['items']]
    assert len(ids) == len(set(ids)), 'duplicate item ids'
    for t in edl['transitions']:
        for i in t.get('out', []) + t.get('in', []):
            assert i in ids, (t['id'], i)
    p = P.EDLDIR / 'short2.json'
    p.write_text(json.dumps(edl, indent=1, ensure_ascii=False) + '\n')
    print('wrote', p, len(edl['items']), 'items,', len(edl['transitions']), 'transitions; duration', END, '; splice at edit', SPLICE)
