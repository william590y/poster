"""Inject slide transitions and entrance animations into a pptxgenjs deck.

pptxgenjs cannot write <p:transition> or <p:timing>, so the generator records, per slide,
a transition name and animation groups keyed by shape objectName (deck.anim.json). This
script maps objectNames to shape ids and writes the OOXML.

Usage: python tools/postprocess.py build/deck.pptx   (reads build/deck.anim.json, rewrites in place)
"""
import json
import os
import re
import shutil
import subprocess
import sys
import io
import zipfile

from PIL import Image

MAX_SIDE = 2400  # px; ~180 dpi across a full 13.3" slide


def optimize_image(name, data):
    """Downscale oversized media (screenshots are captured at 2x) to keep the deck small."""
    ext = name.rsplit('.', 1)[-1].lower()
    if ext not in ('png', 'jpg', 'jpeg'):
        return data
    try:
        im = Image.open(io.BytesIO(data))
        im.load()
    except Exception:
        return data
    w, h = im.size
    if max(w, h) <= MAX_SIDE and len(data) < 1_500_000:
        return data
    if max(w, h) > MAX_SIDE:
        r = MAX_SIDE / max(w, h)
        im = im.resize((round(w * r), round(h * r)), Image.LANCZOS)
    out = io.BytesIO()
    if ext == 'png':
        im.save(out, 'PNG', optimize=True)
        # optional (DECK_QUANTIZE=1): palette quantization with pngquant to shrink the deck; off by default to keep full quality
        if os.environ.get('DECK_QUANTIZE') == '1' and shutil.which('pngquant') and out.tell() > 400_000:
            r = subprocess.run(['pngquant', '--quality=75-95', '--speed', '3', '-'], input=out.getvalue(), capture_output=True)
            if r.returncode == 0 and 0 < len(r.stdout) < out.tell():
                out = io.BytesIO(r.stdout)
    else:
        im.convert('RGB').save(out, 'JPEG', quality=86, optimize=True, progressive=True)
    return out.getvalue() if len(out.getvalue()) < len(data) else data

TRANSITIONS = {
    'none': '',
    'fade': '<p:transition spd="med"><p:fade/></p:transition>',
    'fadeBlack': '<p:transition spd="slow"><p:fade thruBlk="1"/></p:transition>',
    'push': '<p:transition spd="med"><p:push dir="u"/></p:transition>',
    'pushLeft': '<p:transition spd="med"><p:push dir="l"/></p:transition>',
    'wipe': '<p:transition spd="med"><p:wipe dir="r"/></p:transition>',
    'cover': '<p:transition spd="med"><p:cover dir="l"/></p:transition>',
    'zoom': '<p:transition spd="med"><p:zoom/></p:transition>',
    'dissolve': '<p:transition spd="slow"><p:dissolve/></p:transition>',
    'split': '<p:transition spd="med"><p:split orient="vert" dir="out"/></p:transition>',
}


class Ids:
    def __init__(self):
        self.i = 2

    def next(self):
        self.i += 1
        return self.i


def set_vis(ids, spid):
    return (f'<p:set><p:cBhvr><p:cTn id="{ids.next()}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>'
            f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst>'
            f'</p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>')


def anim_effect(ids, spid, flt, dur):
    return (f'<p:animEffect transition="in" filter="{flt}"><p:cBhvr><p:cTn id="{ids.next()}" dur="{dur}"/>'
            f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl></p:cBhvr></p:animEffect>')


def anim_prop(ids, spid, attr, frm, to, dur):
    return (f'<p:anim calcmode="lin" valueType="num"><p:cBhvr additive="base"><p:cTn id="{ids.next()}" dur="{dur}" fill="hold"/>'
            f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl><p:attrNameLst><p:attrName>{attr}</p:attrName></p:attrNameLst></p:cBhvr>'
            f'<p:tavLst><p:tav tm="0"><p:val><p:strVal val="{frm}"/></p:val></p:tav>'
            f'<p:tav tm="100000"><p:val><p:strVal val="{to}"/></p:val></p:tav></p:tavLst></p:anim>')


# effect name -> (presetID, presetSubtype, body builder)
def effect_xml(ids, kind, spid, dur):
    if kind == 'fade':
        return 10, 0, set_vis(ids, spid) + anim_effect(ids, spid, 'fade', dur)
    if kind == 'wipeLeft':
        return 22, 8, set_vis(ids, spid) + anim_effect(ids, spid, 'wipe(left)', dur)
    if kind == 'wipeDown':
        return 22, 1, set_vis(ids, spid) + anim_effect(ids, spid, 'wipe(up)', dur)
    if kind == 'zoom':
        return 53, 16, (set_vis(ids, spid) + anim_prop(ids, spid, 'ppt_w', '0', '#ppt_w', dur)
                        + anim_prop(ids, spid, 'ppt_h', '0', '#ppt_h', dur) + anim_effect(ids, spid, 'fade', dur))
    if kind == 'rise':  # fade while floating up
        return 42, 0, (set_vis(ids, spid) + anim_effect(ids, spid, 'fade', dur)
                       + anim_prop(ids, spid, 'ppt_y', '#ppt_y+0.06', '#ppt_y', dur))
    if kind == 'slam':  # quick scale-down from large, like a stamp landing
        return 53, 32, (set_vis(ids, spid) + anim_prop(ids, spid, 'ppt_w', '#ppt_w*1.35', '#ppt_w', dur)
                        + anim_prop(ids, spid, 'ppt_h', '#ppt_h*1.35', '#ppt_h', dur) + anim_effect(ids, spid, 'fade', dur))
    raise ValueError(kind)


def timing_xml(groups, name2id, slide_no):
    """Each group is one build step. A click group starts a new outer step; an auto group either starts the
    slide (first group) or chains 'after previous' inside the preceding step."""
    ids = Ids()
    outers = []  # each: {'cond': str, 'inners': [xml], 'end': ms}
    for gi, g in enumerate(groups):
        auto = bool(g.get('auto'))
        chained = auto and bool(outers)
        effects, end = [], 0
        for ei, e in enumerate(g['effects']):
            spid = name2id.get(e['name'])
            if spid is None:
                print(f'  ! slide {slide_no}: no shape named {e["name"]}', file=sys.stderr)
                continue
            if ei == 0:
                node = 'afterEffect' if chained else ('withEffect' if auto else 'clickEffect')
            else:
                node = 'withEffect'
            dur, delay = int(e.get('dur', 500)), int(e.get('delay', 0))
            end = max(end, delay + dur)
            pid, sub, body = effect_xml(ids, e.get('effect', 'fade'), spid, dur)
            effects.append(
                f'<p:par><p:cTn id="{ids.next()}" presetID="{pid}" presetClass="entr" presetSubtype="{sub}" fill="hold" nodeType="{node}">'
                f'<p:stCondLst><p:cond delay="{delay}"/></p:stCondLst><p:childTnLst>{body}</p:childTnLst></p:cTn></p:par>')
        if not effects:
            continue
        if chained:
            o = outers[-1]
            start = o['end'] + int(g.get('after', 0))
            o['inners'].append((start, effects))
            o['end'] = start + end
        else:
            cond = ('<p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond>' if auto
                    else '<p:cond delay="indefinite"/>')
            outers.append({'cond': cond, 'inners': [(0, effects)], 'end': end})
    if not outers:
        return ''
    body = ''
    for o in outers:
        inner = ''.join(f'<p:par><p:cTn id="{ids.next()}" fill="hold"><p:stCondLst><p:cond delay="{st}"/></p:stCondLst>'
                        f'<p:childTnLst>{"".join(eff)}</p:childTnLst></p:cTn></p:par>' for st, eff in o['inners'])
        body += f'<p:par><p:cTn id="{ids.next()}" fill="hold"><p:stCondLst>{o["cond"]}</p:stCondLst><p:childTnLst>{inner}</p:childTnLst></p:cTn></p:par>'
    return ('<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>'
            '<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>'
            f'{body}</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>'
            '<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>'
            '</p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>')


SLOTS = ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink']


def theme_xml(xml, theme):
    """Write the deck's color scheme and theme name into ppt/theme/theme1.xml (pptxgenjs can't)."""
    name = theme['name']
    scheme = f'<a:clrScheme name="{name}">' + ''.join(
        f'<a:{k}><a:srgbClr val="{theme["colors"][k].upper()}"/></a:{k}>' for k in SLOTS) + '</a:clrScheme>'
    xml = re.sub(r'<a:clrScheme\b[\s\S]*?</a:clrScheme>', lambda m: scheme, xml, count=1)
    xml = re.sub(r'(<a:(?:theme|fontScheme)\b[^>]*?\bname=")[^"]*"', lambda m: m.group(1) + name + '"', xml)
    return xml


def main(deck):
    anim = json.load(open(deck.replace('.pptx', '.anim.json')))
    theme = json.load(open(deck.replace('.pptx', '.theme.json')))
    tmp = deck + '.tmp'
    zin = zipfile.ZipFile(deck)
    zout = zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED)
    for info in zin.infolist():
        data = zin.read(info.filename)
        if info.filename.startswith('ppt/media/'):
            data = optimize_image(info.filename, data)
        if info.filename == 'ppt/theme/theme1.xml':
            data = theme_xml(data.decode('utf-8'), theme).encode('utf-8')
        if info.filename.endswith('.xml'):
            bad = re.search(rb'<a:srgbClr val="((?![0-9A-Fa-f]{6}")[^"]*)"', data)
            if bad:
                raise SystemExit(f'{info.filename}: srgbClr "{bad.group(1).decode()}" is not hex (scheme color in a hex-only option)')
        m = re.fullmatch(r'ppt/slides/slide(\d+)\.xml', info.filename)
        if m and m.group(1) in anim:
            spec = anim[m.group(1)]
            xml = data.decode('utf-8')
            # renumber ids so every shape id on the slide is unique (pptxgenjs may repeat ids)
            name2id = {}
            counter = [1]

            def renum(mm):
                counter[0] += 1
                name2id.setdefault(mm.group(2), counter[0])
                return f'<p:cNvPr id="{counter[0]}" name="{mm.group(2)}"'
            xml = re.sub(r'<p:cNvPr id="(\d+)" name="([^"]*)"', renum, xml)
            extra = TRANSITIONS[spec.get('transition', 'fade')] + timing_xml(spec.get('groups', []), name2id, m.group(1))
            if extra:
                if '</p:clrMapOvr>' in xml:
                    xml = xml.replace('</p:clrMapOvr>', '</p:clrMapOvr>' + extra, 1)
                else:
                    xml = xml.replace('</p:cSld>', '</p:cSld>' + extra, 1)
            data = xml.encode('utf-8')
        zout.writestr(info, data)
    zout.close()
    zin.close()
    shutil.move(tmp, deck)
    print('postprocessed', deck)


if __name__ == '__main__':
    main(sys.argv[1])
