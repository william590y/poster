"""Export the deck as an interactive web viewer (for williamliaw.com/aisafety/, i.e. william590y/blog/aisafety/).

Every slide is rendered to a full-HD image; the real media is then laid over it at the exact positions read from the built
.pptx: GIFs become looping H.264 videos (sharper and ~10x smaller than GIF), YouTube embeds become click-to-play iframes,
embedded mp4s become <video> players. Speaker notes (with their source links) are shown in a toggleable panel.

Usage: python tools/export_web.py [OUT_DIR] [--download-url URL] [--webm]
  --download-url '' hides the download button; --webm also ships a VP9 copy of every loop (for browsers without H.264 —
  off by default to stay well under GitHub Pages' 1 GB site limit)
  default OUT_DIR = /home/user/blog/aisafety ; build the deck first (./build.sh)
"""
import glob
import hashlib
import html
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
import xml.etree.ElementTree as ET

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
DECK = os.environ.get('DECK_PATH') or os.path.join(ROOT, 'AI_Safety_and_Existential_Risk.pptx')
SOFFICE = '/root/.claude/skills/synced/ceb39289-bb87-46dd-a0b0-6166f033cec2_ce7dbb7b-a240-4473-b2d0-1ddff77530c0/pptx/scripts/office/soffice.py'
CACHE = os.path.join(ROOT, 'build', 'webcache')
DEFAULT_DOWNLOAD = 'https://github.com/william590y/poster/releases/download/ai-safety-deck/AI_Safety_and_Existential_Risk.pptx'

NS = {
    'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'rel': 'http://schemas.openxmlformats.org/package/2006/relationships',
    'p14': 'http://schemas.microsoft.com/office/powerpoint/2010/main',
}
R_EMBED = '{%s}embed' % NS['r']
R_LINK = '{%s}link' % NS['r']


def rels_of(z, part):
    d, f = os.path.split(part)
    path = f'{d}/_rels/{f}.rels'
    out = {}
    if path in z.namelist():
        for r in ET.fromstring(z.read(path)).findall('rel:Relationship', NS):
            tgt = r.get('Target')
            if r.get('TargetMode') != 'External':
                tgt = os.path.normpath(os.path.join(d, tgt)).replace('\\', '/')
            out[r.get('Id')] = (r.get('Type').rsplit('/', 1)[-1], tgt, r.get('TargetMode') == 'External')
    return out


def ordered_slides(z):
    pres = 'ppt/presentation.xml'
    rels = rels_of(z, pres)
    root = ET.fromstring(z.read(pres))
    sz = root.find('p:sldSz', NS)
    cx, cy = int(sz.get('cx')), int(sz.get('cy'))
    parts = [rels[s.get('{%s}id' % NS['r'])][1] for s in root.find('p:sldIdLst', NS)]
    return parts, cx, cy


def notes_text(z, slide_part, rels):
    for typ, tgt, ext in rels.values():
        if typ == 'notesSlide' and not ext:
            root = ET.fromstring(z.read(tgt))
            paras = []
            for sp in root.iter('{%s}sp' % NS['p']):
                ph = sp.find('.//p:nvPr/p:ph', NS)
                if ph is None or ph.get('type') != 'body':
                    continue
                for para in sp.iter('{%s}p' % NS['a']):
                    t = ''.join(x.text or '' for x in para.iter('{%s}t' % NS['a']))
                    paras.append(t)
            return '\n'.join(paras).strip()
    return ''


def geom(pic, cx, cy):
    xfrm = pic.find('p:spPr/a:xfrm', NS)
    off, ext = xfrm.find('a:off', NS), xfrm.find('a:ext', NS)
    g = {
        'x': int(off.get('x')) / cx, 'y': int(off.get('y')) / cy,
        'w': int(ext.get('cx')) / cx, 'h': int(ext.get('cy')) / cy,
        'rot': int(xfrm.get('rot', '0')) / 60000,
    }
    src = pic.find('p:blipFill/a:srcRect', NS)
    if src is not None:
        g['crop'] = [int(src.get(k, '0')) / 100000 for k in ('l', 't', 'r', 'b')]
    return {k: (round(v, 5) if isinstance(v, float) else v) for k, v in g.items()}


MC = 'http://schemas.openxmlformats.org/markup-compatibility/2006'


def box_of(el, cx, cy):
    """Fractional bounding box of a top-level shape, or None if it has no explicit transform."""
    x = next((f for f in (el.find('p:spPr/a:xfrm', NS), el.find('p:xfrm', NS), el.find('p:grpSpPr/a:xfrm', NS)) if f is not None), None)
    if x is None or x.find('a:off', NS) is None:
        return None
    o, e = x.find('a:off', NS), x.find('a:ext', NS)
    return (int(o.get('x')) / cx, int(o.get('y')) / cy, int(e.get('cx')) / cx, int(e.get('cy')) / cy)


def overlaps(a, b):
    return a is None or (a[0] < b[0] + b[2] and b[0] < a[0] + a[2] and a[1] < b[1] + b[3] and b[1] < a[1] + a[3])


def layer_slide(xml, keep, num, bg=None):
    """Copy of a slide keeping only the top-level shapes whose index is in `keep`. With `bg` (hex colour) the layout/master
    shapes are hidden and the background is that solid colour (LibreOffice ignores a no-fill background), so the layer
    can be matted out of a black and a white render."""
    import io
    for _, (pfx, uri) in ET.iterparse(io.BytesIO(xml), events=('start-ns',)):
        if pfx and not re.match(r'ns\d+$', pfx):
            ET.register_namespace(pfx, uri)
    root = ET.fromstring(xml)
    for par in root.iter('{%s}p' % NS['a']):  # slide-number fields would renumber inside the variant deck: freeze them
        for fld in par.findall('a:fld', NS):
            if fld.get('type') == 'slidenum':
                fld.tag = '{%s}r' % NS['a']
                fld.attrib.clear()
                for pp in fld.findall('a:pPr', NS):
                    fld.remove(pp)
                t = fld.find('a:t', NS)
                if t is None:
                    t = ET.SubElement(fld, '{%s}t' % NS['a'])
                t.text = str(num)
    tree = root.find('p:cSld/p:spTree', NS)
    for i, el in enumerate(list(tree)[2:]):
        if i not in keep:
            tree.remove(el)
    for el in list(root):
        if el.tag.split('}')[1] in ('timing', 'transition', 'AlternateContent', 'extLst'):
            root.remove(el)
    root.attrib.pop('{%s}Ignorable' % MC, None)
    if bg:
        root.set('showMasterSp', '0')
        csld = root.find('p:cSld', NS)
        if csld.find('p:bg', NS) is not None:
            csld.remove(csld.find('p:bg', NS))
        bgel = ET.Element('{%s}bg' % NS['p'])
        bgpr = ET.SubElement(bgel, '{%s}bgPr' % NS['p'])
        fill = ET.SubElement(bgpr, '{%s}solidFill' % NS['a'])
        ET.SubElement(fill, '{%s}srgbClr' % NS['a']).set('val', bg)
        ET.SubElement(bgpr, '{%s}effectLst' % NS['a'])
        csld.insert(0, bgel)
    return ET.tostring(root, encoding='UTF-8', xml_declaration=True)


def write_variant(z, out_path, parts, xml_by_part):
    """Write a copy of the deck that lists only `parts` (in order), with their XML replaced."""
    rels = rels_of(z, 'ppt/presentation.xml')
    keep_ids = {rid for rid, (_, tgt, _) in rels.items() if tgt in parts}
    pres = z.read('ppt/presentation.xml').decode('utf8')
    pres = re.sub(r'<p:sldId [^>]*?r:id="([^"]+)"[^>]*/>', lambda m: m.group(0) if m.group(1) in keep_ids else '', pres)
    with zipfile.ZipFile(out_path, 'w', zipfile.ZIP_DEFLATED) as zo:
        for info in z.infolist():
            # fresh ZipInfo: writestr() rewrites offsets on the one it is given, which would corrupt reads from `z`
            ni = zipfile.ZipInfo(info.filename, info.date_time)
            ni.compress_type = info.compress_type
            if info.filename == 'ppt/presentation.xml':
                zo.writestr(ni, pres)
            elif info.filename in xml_by_part:
                zo.writestr(ni, xml_by_part[info.filename])
            else:
                zo.writestr(ni, z.read(info.filename))


def matte(on_black, on_white):
    """RGBA layer from the same shapes rendered on black and on white: alpha = 1 - (white - black), colour = black / alpha."""
    import numpy as np
    from PIL import Image
    b = np.asarray(on_black.convert('RGB'), dtype=np.float32) / 255
    w = np.asarray(on_white.convert('RGB'), dtype=np.float32) / 255
    a = np.clip(1 - (w - b).mean(axis=2), 0, 1)
    rgb = np.clip(b / np.maximum(a, 1e-4)[..., None], 0, 1)
    rgb[a < 1 / 255] = 0
    return Image.fromarray(np.dstack([rgb, a[..., None]]).__mul__(255).round().astype(np.uint8), 'RGBA')


def render(pptx):
    """pptx -> list of 1920px PNG paths (one per listed slide), in a temp dir the caller removes."""
    tmp = tempfile.mkdtemp()
    subprocess.run(['python3', SOFFICE, '--headless', '--convert-to', 'pdf', '--outdir', tmp, pptx],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=1800)
    pdf = os.path.join(tmp, os.path.splitext(os.path.basename(pptx))[0] + '.pdf')
    subprocess.run(['pdftoppm', '-png', '-scale-to-x', '1920', '-scale-to-y', '-1', pdf, os.path.join(tmp, 's')], check=True)
    os.remove(pdf)
    return tmp, sorted(glob.glob(os.path.join(tmp, 's-*.png')))


def youtube_id(url):
    m = re.search(r'(?:embed/|watch\?v=|youtu\.be/)([\w-]{6,})', url)
    return m.group(1) if m else None


def gif_to_mp4(src, dst):
    # light denoise removes GIF dither noise (visually lossless here) so the H.264 loop is ~8x smaller
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', src, '-movflags', '+faststart', '-pix_fmt', 'yuv420p',
                    '-vf', 'hqdn3d=1.5:1.5:6:6,scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-crf', '22', '-preset', 'slow', '-an', dst],
                   check=True)


def gif_to_webm(src, dst):
    # VP9 copy for browsers without H.264 (e.g. open-source Chromium builds); same denoise as the mp4
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', src, '-pix_fmt', 'yuv420p',
                    '-vf', 'hqdn3d=1.5:1.5:6:6,scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libvpx-vp9', '-crf', '33', '-b:v', '0',
                    '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-an', dst], check=True)


def web_video(src, dst):
    # embedded clips: copy as-is if already <=720p, else a 720p H.264/AAC web copy (the .pptx keeps the original)
    h = int(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=height', '-of', 'csv=p=0', src],
                           capture_output=True, text=True, check=True).stdout.strip() or 0)
    if h <= 720:
        shutil.copy(src, dst)
        return
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', src, '-vf', 'scale=-2:720', '-c:v', 'libx264', '-crf', '23', '-preset', 'slow',
                    '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', dst], check=True)


def main():
    args = sys.argv[1:]
    webm = '--webm' in args
    args = [a for a in args if a != '--webm']
    download = DEFAULT_DOWNLOAD
    if '--download-url' in args:
        i = args.index('--download-url')
        download = args[i + 1]
        del args[i:i + 2]
    out = args[0] if args else '/home/user/blog/aisafety'
    if not os.path.exists(DECK):
        sys.exit('build the deck first (./build.sh)')
    os.makedirs(CACHE, exist_ok=True)
    for sub in ('slides', 'thumbs', 'media'):
        shutil.rmtree(os.path.join(out, sub), ignore_errors=True)
        os.makedirs(os.path.join(out, sub))

    z = zipfile.ZipFile(DECK)
    parts, cx, cy = ordered_slides(z)
    slides, mp4cache, layered = [], {}, {}
    for n, part in enumerate(parts, 1):
        rels = rels_of(z, part)
        root = ET.fromstring(z.read(part))
        media = []
        for k, pic in enumerate(root.iter('{%s}pic' % NS['p'])):
            nv = pic.find('p:nvPicPr/p:nvPr', NS)
            vid = nv.find('a:videoFile', NS) if nv is not None else None
            blip = pic.find('p:blipFill/a:blip', NS)
            g = geom(pic, cx, cy)
            if vid is not None:
                typ, tgt, ext = rels.get(vid.get(R_LINK), (None, None, None))
                if ext and tgt and youtube_id(tgt):
                    media.append({'kind': 'youtube', 'id': youtube_id(tgt), **g})
                    continue
                # embedded file (p14:media r:embed)
                p14 = pic.find('.//p14:media', NS)
                mid = p14.get(R_EMBED) if p14 is not None else vid.get(R_LINK)
                typ, tgt, ext = rels.get(mid, (None, None, None))
                if tgt and not ext and tgt in z.namelist():
                    name = f's{n:02d}-{k}{os.path.splitext(tgt)[1]}'
                    tmpv = os.path.join(CACHE, 'embedded' + os.path.splitext(tgt)[1])
                    with open(tmpv, 'wb') as f:
                        f.write(z.read(tgt))
                    web_video(tmpv, os.path.join(out, 'media', name))
                    os.remove(tmpv)
                    media.append({'kind': 'video', 'src': f'media/{name}', '_pic': pic, **g})
                continue
            if blip is not None:
                typ, tgt, ext = rels.get(blip.get(R_EMBED), (None, None, None))
                if tgt and tgt.lower().endswith('.gif') and not ext:
                    if tgt not in mp4cache:
                        data = z.read(tgt)
                        key = os.path.join(CACHE, hashlib.sha1(data).hexdigest())  # encodes are slow: reuse across exports
                        if not (os.path.exists(key + '.mp4') and os.path.exists(key + '.webm')):
                            tmpgif = key + '.gif'
                            with open(tmpgif, 'wb') as f:
                                f.write(data)
                            gif_to_mp4(tmpgif, key + '.part.mp4')
                            gif_to_webm(tmpgif, key + '.part.webm')
                            os.replace(key + '.part.mp4', key + '.mp4')
                            os.replace(key + '.part.webm', key + '.webm')
                            os.remove(tmpgif)
                        base = f'loop-{len(mp4cache) + 1:02d}'
                        shutil.copy(key + '.mp4', os.path.join(out, 'media', base + '.mp4'))
                        if webm:
                            shutil.copy(key + '.webm', os.path.join(out, 'media', base + '.webm'))
                        mp4cache[tgt] = f'media/{base}'
                    media.append({'kind': 'loop', 'webm': mp4cache[tgt] + '.webm' if webm else '', 'src': mp4cache[tgt] + '.mp4', '_pic': pic, **g})
        # Shapes drawn above a clip (labels, letter badges, loop nodes) would be hidden under the web <video>. For such slides
        # the shapes stacked above a clip and overlapping it go in a transparent layer, the base image is rendered without them.
        kids = list(root.find('p:cSld/p:spTree', NS))[2:]
        clip_ids = {id(pic) for pic in root.iter('{%s}pic' % NS['p'])
                    if any(m.get('_pic') is pic for m in media if m['kind'] in ('loop', 'video'))}
        clip_idx = [i for i, el in enumerate(kids) if id(el) in clip_ids or any(id(d) in clip_ids for d in el.iter())]
        if clip_idx:
            first = clip_idx[0]
            boxes = [box_of(kids[i], cx, cy) for i in clip_idx]
            top = {i for i in range(first + 1, len(kids))
                   if i not in clip_idx and any(overlaps(box_of(kids[i], cx, cy), b) for b in boxes if b)}
            if top:
                layered[part] = (set(range(len(kids))) - top, top, n)
        for m in media:
            m.pop('_pic', None)
        slides.append({'n': n, 'part': part, 'img': f'slides/slide-{n:02d}.jpg', 'thumb': f'thumbs/thumb-{n:02d}.jpg',
                       'notes': notes_text(z, part, rels), 'media': media})

    # render slide images (full slides: thumbnails, posters and the base image of unlayered slides)
    from PIL import Image
    tmps = []
    try:
        tmp, pages = render(DECK)
        tmps.append(tmp)
        assert len(pages) == len(slides), (len(pages), len(slides))
        lay = [s for s in slides if s['part'] in layered]
        base_pages, top_pages = {}, {}
        if lay:
            vdir = tempfile.mkdtemp(); tmps.append(vdir)
            parts = [s['part'] for s in lay]
            layers = {}
            for kind, keep, bg in (('base', 0, None), ('black', 1, '000000'), ('white', 1, 'FFFFFF')):
                xml = {p: layer_slide(z.read(p), layered[p][keep], layered[p][2], bg) for p in parts}
                write_variant(z, os.path.join(vdir, kind + '.pptx'), set(parts), xml)
                t, pg = render(os.path.join(vdir, kind + '.pptx'))
                os.remove(os.path.join(vdir, kind + '.pptx'))
                tmps.append(t)
                assert len(pg) == len(parts), (kind, len(pg), len(parts))
                layers[kind] = dict(zip(parts, pg))
            base_pages = layers['base']
            top_pages = {p: (layers['black'][p], layers['white'][p]) for p in parts}
        for s, p in zip(slides, pages):
            full = Image.open(p).convert('RGB')
            base = Image.open(base_pages[s['part']]).convert('RGB') if s['part'] in base_pages else full
            base.save(os.path.join(out, s['img']), 'JPEG', quality=85, optimize=True, progressive=True, subsampling=0)
            if s['part'] in top_pages:
                top = matte(*(Image.open(f) for f in top_pages[s['part']]))
                bb = top.getchannel('A').getbbox()
                if bb:
                    W, H = top.size
                    name = f'slides/top-{s["n"]:02d}.png'
                    top.crop(bb).save(os.path.join(out, name), optimize=True)
                    s['overlay'] = {'src': name, 'x': round(bb[0] / W, 5), 'y': round(bb[1] / H, 5),
                                    'w': round((bb[2] - bb[0]) / W, 5), 'h': round((bb[3] - bb[1]) / H, 5)}
            # poster frames for embedded videos: crop the rendered cover from the slide image
            for m in s['media']:
                if m['kind'] == 'video':
                    W, H = full.size
                    box = (int(m['x'] * W), int(m['y'] * H), int((m['x'] + m['w']) * W), int((m['y'] + m['h']) * H))
                    pname = m['src'].rsplit('.', 1)[0] + '-poster.jpg'
                    full.crop(box).save(os.path.join(out, pname), 'JPEG', quality=88)
                    m['poster'] = pname
            full.thumbnail((480, 270))
            full.save(os.path.join(out, s['thumb']), 'JPEG', quality=82, optimize=True)
            s.pop('part')
    finally:
        for t in tmps:
            shutil.rmtree(t, ignore_errors=True)
    print('layered slides (shapes above clips):', [s['n'] for s in lay])

    size_mb = os.path.getsize(DECK) / 1e6
    tpl = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'web_viewer.html')).read()
    page = (tpl.replace('__DATA__', json.dumps({'slides': slides, 'download': download, 'sizeMB': round(size_mb)}, ensure_ascii=False))
               .replace('__COUNT__', str(len(slides))))
    with open(os.path.join(out, 'index.html'), 'w') as f:
        f.write(page)
    nloops = sum(1 for s in slides for m in s['media'] if m['kind'] == 'loop')
    nyt = sum(1 for s in slides for m in s['media'] if m['kind'] == 'youtube')
    total = sum(os.path.getsize(f) for f in glob.glob(os.path.join(out, '**', '*'), recursive=True) if os.path.isfile(f))
    print(f'exported {len(slides)} slides, {nloops} looping clips ({len(mp4cache)} files), {nyt} YouTube embeds -> {out} ({total / 1e6:.1f} MB)')


if __name__ == '__main__':
    main()
