"""rev3 pass, INTRO (BUILD.md REVISION 3, changes 1-3): the prelude without its flashing and decorative marks, the riff without the
superposition fan and the large swimming arrows, and the logo falling into place on the beat (as in the r1-r7 riff).

apply(edl, cut) edits the rev2 EDL dict in place (cut = 'long' | 'short') and returns it. Written by the intro editor, revised by
the rev3 fixer (lines marked "fixer"). Every item, track and transition it touches carries a "REV3 intro:" line in its _note. Engine:
one opt-in field, screens `driftEase: 'lin'` (fx/screens.js; rev2 never sets it).
Research: research/rev3/intro-audit.md (inventory, measurements, the r7 landing table); this file follows its section 5 patch, plus
William's follow-up on the prelude zoom pulses, which the audit predates.

CHANGE 1, the prelude (song 6.10 -> the drop; the same patch in both cuts):
  - out: the beat tracks fx-prelude / fx-prelude-grid (12 full-frame bloom flashes, 23 pencil ticks in the top-right strip, 13 grain
    bursts, 39 camera zoom/punch pulses); the classifier sketch (sketch layer, sketch-plane, the 19 sketch-dot-* stamps); the pink dab
    behind the 2015 chip (splat-open, with its 8 px camera hit on frame 0); the red nabla stamp on the breath (r2-stamp-breath); the
    white frame before the drop (fx entry fx-drop-white, f393).
  - William's follow-up ("the video clips like 'pulse' zooming in and out I dislike this"): no beat-locked zoom anywhere in the
    prelude: altman / amodei lose their pulses (8-12 % bounce on every beat), punch lists and the camera shakes that went with them,
    and Altman his snap (a 1.08 -> 1 zoom-out on frame 0, then the push: in-and-out). Each clip gets ONE slow, steady, one-way linear
    push-in instead (Altman 1.00 -> 1.06, Amodei 1.00 -> 1.06; fixer: 1.04 moved ~0.3 px a frame, too little to read). The headline
    pile loses its scale/rotation pulse list (pile-hf.pulse); its cards still land on the pulse and its single push-in to the Gizmodo
    phrase at hb:-3 stays; fixer: its drift is linear (driftEase 'lin'), so it keeps creeping in through the breath (it froze for
    12 frames there).
  - the HF-header card of the pile (hb:-5) drops in instead of being painted in: the paint entry left a magenta bristle rim round
    it for the rest of the prelude, a decorative mark over the cards beneath (its highlight still lights at hb:-4).
  - fixer: frame-pencil out too (a graphite rectangle round the clip box and a stub line under it, NOT still: boil 2 re-drew it every
    2 frames for the whole Altman / Amodei stretch, a decorative non-text mark); the "25%" circle lands on the beat hb:-14 (song
    12.458, on the music's own pulse 12.484, while "chance" is spoken; it was song 12.258).
  - kept: every text graphic (word-lit captions, pencil underlines, the circle round "25%", the red chips, name/year stamps, role and
    source lines, the Amodei sub-line and its painted "75%"), the footage, the pile and its emphases, the transitions (tr-wipe,
    tr-fold, tr-shatter; the Altman -> Amodei paint wipe is ~5 frames of pink and violet, a transition the brief keeps), the steady
    film grain and the paper.

CHANGE 2, the riff (hb:0 -> hb:16 long; -> the splice at song 26.477 = hb:14.97 short):
  - out: the superposition burst (preset move superpose) and its equation eq-superpose; the 360 degree whip into it (hb:11.5), the
    2.5x band thicken (hb:12), the close-up reframes (hb:5-7.5, hb:13-14), the per-bar breathe; the paint dabs and extra plane strokes
    that hid the build (splat-drop, r2-spray-1/2, r2-burst-3, r2-plane-0/1/2); the beat track fx-riff (splats, stamps, jumps and
    inverts on every 8th of hb:0-7.5) and the 5 % punch fx-riff-punch3. The rev2 track fx-riff-b now starts at hb:11 and draws only
    paint droplets in the top strip (no splats, stamps, scribbles, ticks, invert, tint, grain or bar flash), plus its camera moves.
  - tr-shatter (the pile breaking into the cream world on the drop) is kept; its shards fly faster (2100 -> 2800 px/s) so they are off
    the cover by the core's slam (hb:1). No flash at hb:0 or hb:8 (r7 had 0.8 and 0.22; change 1's no-flashing reading).
  - the build (r7's choreography, short.json logo-form, on the painted kand pieces): kand-riff on preset "hold" with an explicit cue
    map, every piece arriving FULLY FORMED at its largest on its beat frame and settling in 0.1 s: hb:0 the plane, the pink and the
    black disc slam (the six data points burst out big), hb:0.5 the small orange disc slams, 1 the core, 2 the blue disc (the dots fly
    home), 3 teal, 4 the square spins in, 4.5 the target pops, 5 / 5.5 / 5.75 the arc, the normal and the margin draw on, 6 the
    checkerboard flips in, 7 the nabla drops, 8 the wordmark slams (bar 3), 9 the H crossbar tilts, 10 the kicker lands. The spin-in,
    the pop and the drop start a few frames early so their impact (full size / home) is the beat frame. A camera
    hit per landing scaled to its weight (r7's). Nothing that has landed moves until the kicker, except Coxon's disc, which grows
    1.3x while he talks (hb:4-7.75). The whole cover stays in frame (no reframes, no whip).
  - clean cream under the build: the Galaxy aerial (ghost-riff) lives only in the bottom 22 % of the frame, under the kicker,
    from hb:0.4 (fixer: was hb:1.4, which left f402-f415 with no footage at all; the bottom shards are gone by hb:0.4), on the
    construction-site drone shot (src 41.2 at speed 0.36, inside the shot 41.08-44.00; it was 43.6, whose next shot, a ribbed roof,
    read as a grey ruled strip); the discs show their flat colour first, then footage: pink lands hb:0 -> the agents'
    wall from hb:2; blue lands hb:2 -> Coxon from hb:3 (unchanged), then the data hall from hb:8; the fluid colour starts after the
    kicker (hb:10.5).
  - Coxon unchanged: voice-coxon, kar-coxon (word-lit on his spoken words), coxon-stamp (2026, Jacob Coxon), credit-coxon
    (fixer: kar-coxon 12 px lower, clear of the stamp's role line; credit-coxon and riff-credit 26 px lower, clear of the kicker).
  - kept as r7 (checked frame by frame against out/hyperplane-brutal-short-9x16.mp4 f464-f548): the wordmark's 1.32 slam (one
    frame cropped at both edges, f511, exactly as r7), the arc / checkerboard / kicker starting on their beat and completing over
    5-11 frames (r7 identical); only slams, pops, spin-ins and drops are led so their impact is the beat frame.
  - the hold, hb:11 -> 16 (long) / -> hb:14.97 (short), no equation: something lands on every beat and 8th: r7's rehits (a group
    bumps on each beat and 8th), the pink/black pair orbiting a quarter turn per beat (a third in the short; upright, home again on
    the last beat), the
    core swinging round the black disc and the teal round the blue on every beat, the square / checkerboard / nabla spinning, the
    data points and the small pieces jumping onto beats, the whole cover kicking out and springing back on the bar-4 downbeat, a
    camera hit per beat, the river water surging on every beat, the fluid colour, footage in the pink and blue discs.
  - the break into verse 1 (tr-riff-break, the kand break at hb:16) and the short's splice iris (tr-entrance-short) are unchanged.

CHANGE 3, the arrows: "the arrows that 'swim' through the hyperplane" (William) = every LARGE vector swimming in the yellow band:
  - the riff river (kand-riff, 26 arrows at size 2.3, 132-215 px): the river keeps its water (streaks and ripples) with no vectors.
    The beat track's ink-arrow stamps and pencil arrows (stamp / scribble) are excluded from the riff's remaining track.
  - fixer, rivers(): the refrain's loop river too (kand-a, kand-b, and kand-a-s in the short: 14 arrows at size 2.0, ~115-190 px on
    screen, nearly the riff's size and twice the finale's; BUILD.md had called kand-a "small", which it is not). Water kept.
  - kept: the finale's small arrows (kand-re, instrumental hb:116-123, 7 arrows at size 1, ~58-94 px): William's "the arrows at the
    end that are small are beautiful". rivers() asserts no other kand river swims a vector.

The short: the same patch, with every ref before song 26.477 (no hb:15 or later: the generator's check() asserts it).
Caches: ghost-riff and kc-pink-agents change t0 / speed, so they extract into their own folders (frames: r3l-* / r3s-*); rev2's
cache/ghost-riff and cache/kc-pink-agents stay as long2 / short2 render them (prep_clips.py long3 / short3 fills the new ones).
"""

NOTE = 'REV3 intro: '
PUSH = [1.0, 1.06]   # the prelude clips' one slow, linear push-in (fixer: 1.04 moved 0.3 px a frame, too little to read as motion)

# r7 logo hits (short.json logo-form.hits; beat, px, decay); hb:0 is tr-shatter's own 16 px shake
BUILD_HITS = [(.5, 5, .05), (1, 9, .06), (2, 12, .06), (3, 6, .06), (4, 12, .07), (7, 6, .11), (8, 22, .11), (9, 7, .11)]


def B(x):
    return f'hb:{x:g}'


def note(x, text):
    """prepend a rev3 line to an item's / track's _note (the rev2 history stays after it)"""
    old = x.get('_note')
    x['_note'] = NOTE + text + (' | rev2: ' + old if old else '')


def _drop_ids(edl, ids=(), prefix=()):
    gone = lambda i: i in ids or any(i.startswith(p) for p in prefix)
    edl['items'] = [x for x in edl['items'] if not gone(x['id'])]
    for t in edl.get('transitions', []):
        for k in ('out', 'in'):
            if k in t:
                t[k] = [i for i in t[k] if not gone(i)]


def items(edl):
    return {x['id']: x for x in edl['items']}


# ============================================================ change 1: the prelude
def prelude(edl, cut):
    edl['beatfx'] = [b for b in edl['beatfx'] if b['id'] not in ('fx-prelude', 'fx-prelude-grid')]
    edl['fx'] = [f for f in edl['fx'] if f['id'] != 'fx-drop-white']
    # fixer: frame-pencil too (a graphite outline round the clip box and a stub line under it, re-drawn every 2 frames by its boil:
    # a decorative, non-text mark that jitters through the whole Altman / Amodei stretch)
    _drop_ids(edl, ids=('sketch', 'sketch-plane', 'splat-open', 'r2-stamp-breath', 'frame-pencil'), prefix=('sketch-dot-',))
    I = items(edl)
    for k, z in (('altman', PUSH), ('amodei', PUSH)):
        it = I[k]
        for f in ('pulses', 'punch', 'shakes', 'snap'):
            it.pop(f, None)
        it['zoom'] = z
        it['zoomEase'] = 'lin'
        note(it, f'no beat-locked zoom (William: the clips "pulse zooming in and out"): pulses, punch, shakes{" and the frame-0 snap" if k == "altman" else ""} '
                 f'removed; one slow linear push-in {z[0]:.2f} -> {z[1]:.2f} over the shot. Caption, marks, stamp and source unchanged.')
    # fixer: the "25%" circle lands on the prelude beat hb:-14 (song 12.458, 26 ms from the music's own pulse at 12.484), while
    # "chance" is spoken, instead of 0.2 s before it (song 12.258); still after "25%" is heard (song 11.45)
    for m in I['amodei']['caption']['marks']:
        if m['phrase'] == '25%' and m['at'] == 'song:12.258':
            m['at'] = 'hb:-14'
    p = I['pile-hf']
    p.pop('pulse', None)
    # fixer: the pile's drift runs linearly to its last frame (fx/screens.js driftEase 'lin', opt-in): with the default ioSine ease it
    # stopped dead in the breath (song 18.7-19.07, hb:-1.1 to -0.35, 12 still frames); same end scale (drift 0.05)
    p['driftEase'] = 'lin'
    for s in p['shots']:
        if s['id'] == 'security-hf-header' and s.get('entry') == 'paint':
            s['entry'] = 'drop'
            s['hlAt'] = s.get('hlAt', 'hb:-4')   # the paint entry lit its highlight 1 beat after landing (hb:-5 + 1): kept
    note(p, 'the scale/rotation pulse list removed (BUILD.md REV3-1 follow-up: no beat-locked zoom in the prelude); the HF-header card '
            '(hb:-5) drops in instead of being painted in, so no magenta bristle rim stays round it (a decorative mark over the cards '
            'beneath); the cards still land on the pulse, the single push-in to the Gizmodo phrase (hb:-3) and the emphases stay. '
            'Fixer: the drift is linear (driftEase lin), so the pile keeps creeping in through the breath instead of freezing.')
    for t in edl['transitions']:
        if t['id'] == 'tr-shatter':
            note(t, 'out no longer lists sketch / r2-stamp-breath (deleted); in no longer lists ghost-riff (it starts at hb:1.4, under the '
                    'kicker only). The shards fly faster (speed 2100 -> 2800) so they clear the cover sooner after the plane slams.')
            t['speed'] = 2800


# ============================================================ changes 2 and 3: the riff
def riff(edl, cut):
    long = cut == 'long'
    I = items(edl)
    k = I['kand-riff']
    k['preset'] = {'name': 'hold', 'from': 'hb:0'}   # no preset cues or moves: superpose, river arrows, reframe, breathe, whip all go
    k.pop('drop', None)
    k['dotScale'] = 2.6
    slam = lambda at, sc, dur=.10: {'at': B(at), 'style': 'slam', 'dur': dur, 'scale': sc}
    k['cues'] = {   # r7 (short.json logo-form, LOGO_CUES + its slam scales), every landing on an hb beat or 8th
        'band': slam(0, 1.3, .12), 'pink': slam(0, 1.3), 'black': slam(0, 1.3), 'dots': B(0),
        'smallO': slam(.5, 3.2), 'core': slam(1, 2.3),
        'blue': slam(2, 1.9), 'sort': B(2),
        'teal': slam(3, 2.2),
        # spin-in / pop / drop: the motion starts a few frames early so the IMPACT (the piece reaching its full size or its
        # place) is the beat frame; lead = the time oBack takes to first reach 1 (spinin .36 s: .124; pop: the outer ring, .13;
        # drop .3 s with overshoot 1.6: .115)
        'square': {'at': B(4), 'style': 'spinin', 'dur': .36, 'lead': .124}, 'target': {'at': B(4.5), 'style': 'pop', 'dur': .24, 'lead': .13},
        'arc': {'at': B(5), 'style': 'draw', 'dur': .34}, 'normal': {'at': B(5.5), 'style': 'draw', 'dur': .24},
        'margin': {'at': B(5.75), 'style': 'draw', 'dur': .24},
        'chk': {'at': B(6), 'style': 'flip', 'dur': .18},
        'nabla': {'at': B(7), 'style': 'drop', 'dur': .30, 'lead': .115},
        'wm': slam(8, 1.32, .24), 'tilt': B(9),
        'kick': {'at': B(10), 'style': 'rise', 'dur': .30},
    }
    DOTS = ['d0', 'd1', 'd2', 'd3', 'd4', 'd5']
    # the hold: long hb:11-15.5 (the break is at hb:16); short hb:11-14.5 (the song is cut at hb:14.97)
    last = 15 if long else 14
    beats = list(range(12, last + 1))                     # the orbit steps: long 12..15 (4 x 90 deg), short 12..14 (3 x 120 deg)
    step = 360 / len(beats)                               # so the discs are home again on the last beat of the hold
    bump = lambda ps, on, sc, dur=.18: {'move': 'bump', 'pieces': ps, 'on': [B(x) for x in on], 'scale': sc, 'dur': dur}
    moves = [
        # Coxon's disc reads a little bigger while he talks (lands hb:2 at 1x; footage from hb:3)
        {'move': 'grow', 'pieces': ['blue'], 'from': B(4), 'to': B(7.75), 'scale': 1.3, 'dx': -40, 'dy': -30, 'dur': .25},
        # r7 rehits: one group bumps on every beat / 8th of the hold
        bump(['blue', 'teal', 'square'], [11], 1.26), bump(DOTS + ['smallO'], [11.5, 12.5], 1.8),
        bump(['pink', 'core'], [12], 1.16), bump(['blue', 'teal', 'target', 'square'], [13], 1.28),
        bump(['nabla', 'chk'], [13.5], 1.3, .16), bump(['black', 'core', 'pink'], [14], 1.16),
        bump(['teal', 'smallO', 'target'] + DOTS, [14.5], 1.5, .16),
        # orbits once the build is done (discs upright, so the footage stays upright)
        {'move': 'orbit', 'pieces': ['pink', 'black'], 'on': [B(x) for x in beats], 'stepDeg': step, 'turn': False},
        {'move': 'orbit', 'pieces': ['core'], 'around': 'black', 'on': [B(x) for x in beats], 'stepDeg': step, 'k': -1},
        {'move': 'orbit', 'pieces': ['teal'], 'around': 'blue', 'on': [B(x) for x in beats], 'stepDeg': step},
        {'move': 'spin', 'pieces': ['square'], 'on': [B(12), B(14)], 'deg': 90},
        {'move': 'spin', 'pieces': ['chk'], 'on': [B(13)] + ([B(15)] if long else []), 'deg': 90},
        {'move': 'spin', 'pieces': ['nabla'], 'on': [B(13.5)], 'deg': 120},
        {'move': 'jump', 'pieces': DOTS, 'on': [B(13)], 'h': 70, 'stagger': .03},
        {'move': 'jump', 'pieces': ['smallO', 'target'], 'on': [B(15) if long else B(14.5)], 'h': 110, 'stagger': .06},
        # change 3: the river keeps its water (streaks, ripples, a surge on every beat) and has NO swimming vectors
        {'move': 'river', 'from': B(10.5), **({'to': B(16)} if long else {}), 'vectors': 0, 'streaks': 54, 'flowK': 1.6, 'ripple': 8, 'lanes': 100},
        {'move': 'artpulse', 'on': f'hb:0..{last}', 'amp': .009, 'accents': {0: 6, 1: 2, 2: 2.4, 8: 2.2, 11: 1.6, 12: 2.4, 13: 1.8, 14: 1.8, 15: 1.8}},
        {'move': 'push', 'from': B(10), **({'to': B(16)} if long else {}), 'z': [1.0, 1.035]},
    ]
    if long:
        moves.append(bump(['arc', 'normal', 'margin'], [15.5], 1.3, .16))
        moves.append({'move': 'break', 'at': 'hb:99', 'dur': 0.4, 'hide': ['pink', 'band'], 'hideAt': 'hb:16', 'stagger': 0.006})
    k['moves'] = moves
    note(k, 'the r1-r7 build back (BUILD.md REV3-2): preset "hold" + r7 cue map, every piece slams / pops / drops in fully formed ON its '
            'beat (hb:0 plane + pink + black, .5 smallO, 1 core, 2 blue, 3 teal, 4 square, 4.5 target, 5-5.75 arc / normal / margin, 6 '
            'checker, 7 nabla, 8 wordmark, 9 crossbar tilt, 10 kicker), still until the kicker, whole cover in frame; then the hold: '
            'rehits, orbits (a quarter turn per beat; a third in the short), spins, jumps on every beat and 8th. Superposition, whip, thicken, reframes, breathe gone; the '
            'river (REV3-3) has no swimming vectors, only its water.')

    # decorations that hid the build, the superposition's equation
    _drop_ids(edl, ids=('splat-drop', 'r2-spray-1', 'r2-spray-2', 'r2-burst-3', 'r2-plane-0', 'r2-plane-1', 'r2-plane-2', 'eq-superpose'))
    edl['beatfx'] = [b for b in edl['beatfx'] if b['id'] != 'fx-riff']
    for b in edl['beatfx']:
        if b['id'] == 'fx-riff-b':
            b['from'] = 'hb:11'
            b['no'] = ['splat', 'splatS', 'stamp', 'scribble', 'tick', 'invert', 'jump', 'burst', 'tint', 'grain']
            # "no" alone is not enough: a role whose every effect is excluded falls back to its full list (beatfx.plan), so every
            # role's visible effect is mapped to droplets; no bloom flash on the bar downbeats either
            b['map'] = {r: {'vis': [['droplets', 1]]} for r in ('crash', 'bar', 'backbeat', 'beat', 'fill', 'off')}
            b['barFlash'] = False
            b['zones'] = [[40, 140, 1000, 150]]   # the top strip only: never on the cover, never over the credits / the aerial strip
            b['avoid'] = [[0, 300, 1080, 1620]]
            note(b, 'only after the build (from hb:11): paint droplets in the top strip (off the cover) and the camera moves; '
                    'no splats (they dripped onto the orbiting discs), stamps, pencil scribbles or ticks (stray symbols; a stamp or scribble can be an arrow glyph), no invert / '
                    'tint / grain / bar flash over the cover, no kand jump / burst impulses (the hold has its own).')
    edl['fx'] = [f for f in edl['fx'] if f['id'] != 'fx-riff-punch3']
    hold_hits = [(11, 5, .06), (12, 10, .11), (13, 6, .06), (14, 8, .08)] + ([(15, 6, .06)] if long else [(14.5, 5, .05)])
    for beat, amp, dec in BUILD_HITS + hold_hits:
        edl['fx'].append({'id': f'fx-riff-hit-{beat:g}', 'fx': 'shake', 'on': [B(beat)], 'amp': amp, 'decay': dec, 'barK': 1,
                          '_note': NOTE + ('the r7 logo hit for the landing on this beat' if beat <= 10 else 'a hit on the hold beat')})
    edl['fx'].append({'id': 'fx-riff-burst-12', 'fx': 'burst', 'on': [B(12)], 'intensity': 1.3,
                      '_note': NOTE + 'bar-4 downbeat of the hold: every cover piece kicks out from the middle and springs back into place'})

    # footage: the Galaxy aerial only in the bottom 22 % (the build stays on clean cream), from the end of the shatter
    g = I['ghost-riff']
    # fixer: from hb:0.4 (was hb:1.4: f402-f415 had no footage at all, cream + flat shapes); the bottom shards of tr-shatter are
    # gone by then. Source: the Galaxy drone shot 41.08-44.00 (the construction site between two halls, recognisable in the 22 %
    # strip; 43.6 was its last 0.4 s, then the ribbed roof of the next shot read as a grey ruled strip), at 0.36 so it ends by 43.94
    g['t0'] = 'hb:0.4'
    g['in'] = 41.2
    g['speed'] = 0.36
    g['entry'] = {'style': 'fade', 'at': 'hb:0.4', 'dur': .25}
    g['alpha'] = 0.55
    g['mask'] = 'linear-gradient(to bottom, transparent 0%, transparent 74%, #000 79%, #000 100%)'
    g['frames'] = f'r3{cut[0]}-ghost-riff'   # its own cache folder: rev2's cache/ghost-riff (t0 hb:-0.3) stays as rev2 renders it
    note(g, 'the build stays on clean cream: the aerial only in the bottom 22 % (under the kicker), from hb:0.4 (the bottom shards are '
            'gone), alpha 0.55; fixer: in 41.2 at speed 0.36 (the construction-site drone shot 41.08-44.00, not the roof shot after it).')
    # fixer: Coxon's caption sits 12 px lower (his role line touched its first line); the two credit lines sit 26 px lower (they were
    # 40 px under the kicker; still inside the safe zone: credit-coxon's 2 lines end at y ~1566)
    I['kar-coxon']['y'] = 312
    note(I['kar-coxon'], 'y 300 -> 312: a gap under the stamp\'s role line (the two touched).')
    for cid in ('credit-coxon', 'riff-credit'):
        I[cid]['y'] = 1494
        note(I[cid], 'y 1468 -> 1494: clear of the kicker above it.')
    for t in edl['transitions']:
        if t['id'] == 'tr-shatter':
            t['in'] = [i for i in t['in'] if i != 'ghost-riff']
    f = I['fluid-riff']
    f['t0'] = 'hb:10.5'
    note(f, 'starts after the kicker has landed (was hb:8, as the wordmark landed).')
    p = I['kc-pink-agents']
    p['t0'] = 'hb:2'
    t_end = 20.8979 if long else 20.923   # edit time at which the footage must reach source 75.21 (long: hb:16.05; short: the riff's end)
    p['speed'] = round(3.21 / (t_end - (13.132 + 2 * 0.483871)), 4)
    p['frames'] = f'r3{cut[0]}-kc-pink-agents'   # its own cache folder (rev2's cache/kc-pink-agents is untouched)
    note(p, 'from hb:2: the pink disc lands flat on the downbeat and shows its colour for two beats; speed re-fitted so it still ends on source 75.21.')
    # unchanged: kc-blue-coxon, voice-coxon, kar-coxon, coxon-stamp, credit-coxon (Coxon heard and word-lit on his own words, his name
    # and year on screen), kc-blue-dc (the data hall from the title downbeat), riff-credit
    for t in edl['transitions']:
        if t['id'] in ('tr-riff-break', 'tr-entrance-short'):
            note(t, 'no longer lists eq-superpose / splat-drop (deleted); otherwise unchanged.')


# ============================================================ change 3, the refrain: its large swimming arrows go too
def rivers(edl, cut):
    """William: "By 3 I specifically mean the arrows that 'swim' through the hyperplane" (and "the arrows at the end that are small
    are beautiful"). The refrain's loop river (kand-a, kand-b; the short's kand-a-s) swims 14 arrows at size 2.0 (160-260 cover
    units, ~115-190 px on screen), nearly the riff's (2.3) and twice the finale's: they are large arrows swimming through the
    hyperplane, not the small ones at the end, so they go as well. Each river keeps its water (streaks, ripples, the surge on every
    beat). kand-re (the instrumental, hb:116-123, 7 arrows at size 1) is the "small at the end" and stays exactly as in rev2."""
    ids = ('kand-a', 'kand-b', 'kand-a-s')
    for x in edl['items']:
        if x['id'] in ids:
            for m in x.get('moves', []):
                if m.get('move') == 'river' and m.get('vectors', 7):
                    m['vectors'] = 0
            note(x, 'the river keeps its water but swims no arrows (REV3-3: the large arrows swimming through the hyperplane; was 14 '
                    'arrows at size 2.0). The small finale arrows (kand-re) are kept.')
    for x in edl['items']:   # the only arrows left in the band are the finale's small ones
        if x['type'] == 'kand' and x['id'] != 'kand-re':
            for m in x.get('moves', []):
                assert m.get('move') != 'river' or m.get('vectors', 7) == 0, (x['id'], m)
            pre = x.get('preset') or {}
            assert not (isinstance(pre, dict) and pre.get('river', {}).get('vectors')), x['id']


def apply(edl, cut):
    assert cut in ('long', 'short'), cut
    prelude(edl, cut)
    riff(edl, cut)
    rivers(edl, cut)
    return edl
