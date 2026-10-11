"""Export 'Hyperplane' (Unbounded Bold) as two path strings: the body (with the H's stems only) and the H crossbar (flat),
so the animation can skew the crossbar to 22°. Coordinates in font units, y flipped (SVG down)."""
import json
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

font_path = "../unbounded-700.ttf"
tt = TTFont(font_path); gs = tt.getGlyphSet()
font = hb.Font(hb.Face(hb.Blob.from_file_path(font_path)))
buf = hb.Buffer(); buf.add_str("Hyperplane"); buf.guess_segment_properties()
hb.shape(font, buf, {"kern": True, "liga": True})
TRACK = -30

def poly(pen, pts):
    pen.moveTo(pts[0]); [pen.lineTo(p) for p in pts[1:]]; pen.closePath()

body, bar, bar_c, x = [], "", None, 0
for name, pos in zip([tt.getGlyphOrder()[i.codepoint] for i in buf.glyph_infos], buf.glyph_positions):
    sp = SVGPathPen(gs); tp = TransformPen(sp, (1, 0, 0, -1, x + pos.x_offset, 0))
    if name == "H":
        poly(tp, [(70, 0), (70, 750), (277, 750), (277, 0)])
        poly(tp, [(660, 0), (660, 750), (868, 750), (868, 0)])
        bp = SVGPathPen(gs); btp = TransformPen(bp, (1, 0, 0, -1, x + pos.x_offset, 0))
        poly(btp, [(186, 289), (186, 473), (746, 473), (746, 289)])
        bar = bp.getCommands(); bar_c = [x + pos.x_offset + 466, -381]
    else:
        gs[name].draw(tp)
    body.append(sp.getCommands())
    x += pos.x_advance + TRACK
hh = tt["hhea"]
json.dump({"body": " ".join(body), "bar": bar, "barC": bar_c, "width": x - TRACK, "asc": hh.ascent, "desc": -hh.descent},
          open("wordmark_parts.json", "w"))
print("ok", round(x - TRACK))
