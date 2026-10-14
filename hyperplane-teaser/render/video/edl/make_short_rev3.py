"""Generator for edl/short3.json: the rev3 SHORT cut (14 Oct 2026; BUILD.md REVISION 3). The rev2 short (make_short_rev2.build()) with
the rev3 passes applied: rev3_intro.apply (prelude and riff: changes 1-3) then rev3_body.apply (the Bostrom closer, equations: 4-5).

  python3 render/video/edl/make_short_rev3.py && python3 render/video/prep_clips.py short3
"""
import json, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import rev2_parts as P
import make_short_rev2 as S2
import rev3_intro, rev3_body
from make_long_rev3 import check


def build():
    edl = S2.build()
    P.hold_past(edl, round(S2.SONG_END - S2.OFF2, 3)); P.early_emph(edl); P.fit_emph(edl)   # the rev2 generator's post-build steps (its __main__)
    edl = rev3_intro.apply(edl, 'short')
    edl = rev3_body.apply(edl, 'short')
    P.early_emph(edl); P.fit_emph(edl)   # again, for piles the rev3 passes added or retimed (a no-op on the others)
    edl['name'] = 'short3'
    edl['rev'] = 3
    edl['title'] = "Hyperplane x 'brutal', rev3 SHORT cut: the spliced intro cut"
    edl['outputs'] = {'song': 'out/rev3/hyperplane-brutal-short-9x16.mp4', 'no_song': 'out/rev3/hyperplane-brutal-short-no-song-9x16.mp4'}
    return edl


if __name__ == '__main__':
    edl = build()
    check(edl)
    p = P.EDLDIR / 'short3.json'
    p.write_text(json.dumps(edl, indent=1, ensure_ascii=False) + '\n')
    print('wrote', p, len(edl['items']), 'items,', len(edl['transitions']), 'transitions; duration', edl['duration'])
