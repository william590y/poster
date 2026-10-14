"""Generator for edl/long3.json: the rev3 LONG cut (14 Oct 2026; BUILD.md REVISION 3). The rev2 long (make_long_rev2.build()) with
the rev3 passes applied: rev3_intro.apply (prelude and riff: changes 1-3) then rev3_body.apply (quotes and equations: 4-5). Change 6
(the loop's arrow icon) is in fx/singularity.js.

  python3 render/video/edl/make_long_rev3.py && python3 render/video/prep_clips.py long3
"""
import json, os, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import rev2_parts as P
import make_long_rev2 as L2
import rev3_intro, rev3_body


# an editor previewing one pass alone: REV3_PASSES=intro REV3_SUFFIX=i -> edl/long3i.json (name 'long3i'); default both passes -> long3.json
PASSES = lambda: os.environ.get('REV3_PASSES', 'intro,body').split(',')
SUFFIX = lambda: os.environ.get('REV3_SUFFIX', '')


def build():
    edl = L2.build()
    P.hold_past(edl, round(L2.SONG_END - L2.SONG0, 3)); P.early_emph(edl); P.fit_emph(edl)   # the rev2 generator's post-build steps (its __main__)
    passes = PASSES()
    if 'intro' in passes:
        edl = rev3_intro.apply(edl, 'long')
    if 'body' in passes:
        edl = rev3_body.apply(edl, 'long')
    P.early_emph(edl); P.fit_emph(edl)   # again, for piles the rev3 passes added or retimed (a no-op on the others)
    edl['name'] = 'long3' + SUFFIX()
    edl['rev'] = 3
    edl['title'] = "Hyperplane x 'brutal', rev3 LONG cut: the intro cut, continuous (song 6.10-80.40)"
    edl['outputs'] = {'song': 'out/rev3/hyperplane-brutal-long-9x16.mp4', 'clean': 'out/rev3/hyperplane-brutal-long-clean-9x16.mp4',
                      'no_song': 'out/rev3/hyperplane-brutal-long-no-song-9x16.mp4'}
    return edl


def check(edl):
    bad = [b for b in P.bad_refs(edl) if '..' not in b[1]]
    assert not bad, bad
    ids = [x['id'] for x in edl['items']]
    assert len(ids) == len(set(ids)), 'duplicate item ids'
    for t in edl['transitions']:
        for i in t.get('out', []) + t.get('in', []):
            assert i in ids, (t['id'], i)


if __name__ == '__main__':
    edl = build()
    check(edl)
    p = P.EDLDIR / (edl['name'] + '.json')
    p.write_text(json.dumps(edl, indent=1, ensure_ascii=False) + '\n')
    print('wrote', p, len(edl['items']), 'items,', len(edl['transitions']), 'transitions,', len(edl['beatfx']), 'beat tracks; duration', edl['duration'])
