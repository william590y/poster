#!/usr/bin/env python3
"""Static subset lint for Slides-type slide files. Usage: lint_slide.py FILE...
Prints one line per problem; exit 1 if any. Does not render anything."""
import re, sys, os
from html.parser import HTMLParser

ALLOWED = set("section h1 h2 h3 p ul ol li br b i u a span div img table tr th td hr x-shape x-icon x-connector x-embed aside svg".split())
SVG_OK = set("g path rect circle ellipse line polyline polygon defs lineargradient radialgradient stop clippath mask use filter fegaussianblur title desc pattern marker symbol".split())
VOID = {"br", "img", "hr"}
PROPS = set("""position left top right bottom width height min-width min-height max-width max-height display flex-direction flex-wrap gap
align-items justify-content justify-items align-self justify-self flex flex-grow flex-shrink flex-basis grid-template-columns grid-template-rows
grid-column grid-row aspect-ratio padding overflow font-family font-size font-weight font-style font line-height letter-spacing text-align
text-transform white-space text-decoration font-variant-numeric -webkit-text-stroke color background background-clip -webkit-text-fill-color border
border-top border-right border-bottom border-left border-radius box-shadow text-shadow opacity transform filter backdrop-filter mix-blend-mode
object-fit""".split())
NOOP = {"margin", "box-sizing", "grid-template"}
TEXT_TAGS = {"h1", "h2", "h3", "p", "ul", "ol", "li", "table", "td", "th"}

class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True)
        s.stack = []; s.errs = []; s.count = 0; s.top = []; s.in_svg = 0
        s.aside_text = None; s.in_aside = False; s.last_top_child = None; s.section_depth = None
        s.outside_text = ""
    def handle_starttag(s, tag, attrs):
        a = dict(attrs)
        if s.in_svg:
            if tag.lower() not in SVG_OK and tag != "svg": s.errs.append(f"svg child <{tag}> unusual")
            if tag not in VOID: s.stack.append(tag)
            if tag == "svg": s.in_svg += 1
            return
        s.count += 1
        if s.in_aside: s.errs.append(f"tag <{tag}> inside <aside> (notes must be plain text)")
        if tag not in ALLOWED: s.errs.append(f"tag <{tag}> not in subset")
        if "class" in a: s.errs.append(f"class attribute on <{tag}>")
        if len(s.stack) == 0:
            s.top.append((tag, a.get("id")))
        if len(s.stack) == 1 and s.stack[0] == "section": s.last_top_child = tag
        st = a.get("style")
        if st: s.check_style(tag, st)
        if tag in ("h1", "h2", "h3", "p") and (not st or "font-size" not in st):
            # inherits section/div size only for p; h1-h3 use tag defaults (>=44px), fine
            pass
        if tag == "img":
            src = a.get("src", "")
            if not src.startswith("/_blob/"): s.errs.append(f"img src not /_blob/: {src[:60]}")
            if not a.get("alt") and a.get("alt") != "": s.errs.append("img without alt")
        if tag == "aside": s.in_aside = True; s.aside_text = ""
        if tag == "svg": s.in_svg = 1
        if tag not in VOID: s.stack.append(tag)
    def handle_endtag(s, tag):
        if tag in VOID: return
        if s.stack and s.stack[-1] == tag:
            s.stack.pop()
        else:
            s.errs.append(f"mismatched </{tag}> (open: {s.stack[-3:]})")
            if tag in s.stack:
                while s.stack and s.stack.pop() != tag: pass
        if tag == "aside": s.in_aside = False
        if tag == "svg" and s.in_svg: s.in_svg -= 1
    def handle_data(s, d):
        if s.in_aside: s.aside_text += d
        if not s.stack and d.strip(): s.outside_text += d.strip()[:40]
    def check_style(s, tag, st):
        for decl in st.split(";"):
            if not decl.strip(): continue
            if ":" not in decl: s.errs.append(f"bad decl '{decl.strip()}'"); continue
            k, v = decl.split(":", 1); k = k.strip().lower(); v = v.strip()
            if k in NOOP: s.errs.append(f"<{tag}> uses no-op/unsupported '{k}'"); continue
            if k not in PROPS: s.errs.append(f"<{tag}> property '{k}' not in subset"); continue
            if re.search(r"\d(em|rem|vw|vh)\b", v) and k != "letter-spacing": s.errs.append(f"<{tag}> {k}: unit not allowed ({v})")
            if "var(" in v or "currentcolor" in v.lower(): s.errs.append(f"<{tag}> {k}: var()/currentcolor")
            if k == "font-size":
                m = re.match(r"([\d.]+)px$", v)
                if not m: s.errs.append(f"<{tag}> font-size '{v}' not px")
                elif float(m.group(1)) < 24: s.errs.append(f"<{tag}> font-size {v} under 24px")
            if k == "padding":
                for part in v.split():
                    m = re.match(r"([\d.]+)px$", part)
                    if m and float(m.group(1)) > 256: s.errs.append(f"<{tag}> padding over 256")
            if k == "gap":
                m = re.match(r"([\d.]+)px$", v)
                if not m: s.errs.append(f"<{tag}> gap '{v}' must be one px value")
            if k == "justify-content" and v in ("flex-start", "flex-end"): pass
            if k == "border" and v not in ("none",) and not re.search(r"\b(solid|dashed|dotted|double|none)\b", v):
                s.errs.append(f"<{tag}> border needs a style word ({v})")

def lint(path):
    errs = []
    txt = open(path, encoding="utf-8").read()
    sid = os.path.splitext(os.path.basename(path))[0]
    if not re.fullmatch(r"[A-Za-z0-9_-]{1,64}", sid): errs.append("bad file id")
    p = P(); p.feed(txt); p.close()
    errs += p.errs
    if p.stack: errs.append(f"unclosed tags at end: {p.stack}")
    if len(p.top) != 1 or p.top[0][0] != "section": errs.append(f"top level must be exactly one <section>, got {p.top}")
    elif p.top[0][1] != sid: errs.append(f"section id {p.top[0][1]!r} != file id {sid!r}")
    if p.outside_text: errs.append(f"text outside section: {p.outside_text!r}")
    m = re.search(r"<section[^>]*style=\"([^\"]*)\"", txt)
    if not m or "background" not in m.group(1): errs.append("section has no background")
    if p.aside_text is not None:
        if len(p.aside_text) > 4000: errs.append(f"notes {len(p.aside_text)} chars > 4000")
        if p.last_top_child != "aside": errs.append("aside is not the section's last child")
    else:
        errs.append("no <aside> speaker notes")
    if p.count > 200: errs.append(f"{p.count} elements > 200")
    # raw '<' followed by a non-tag char inside text is a parse hazard
    for mm in re.finditer(r"<(?![a-zA-Z/!])", txt):
        errs.append(f"raw '<' at offset {mm.start()}: {txt[mm.start():mm.start()+20]!r} (escape as &lt;)"); break
    return errs

bad = 0
for f in sys.argv[1:]:
    e = lint(f)
    if e:
        bad += 1
        for x in e: print(f"{os.path.basename(f)}: {x}")
    else:
        print(f"{os.path.basename(f)}: OK")
sys.exit(1 if bad else 0)
