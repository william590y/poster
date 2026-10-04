"""Export the deck as an interactive web viewer (for williamliaw.com/aisafety/, i.e. william590y/blog/aisafety/).

Every slide is rendered to a full-HD image; the real media is then laid over it at the exact positions read from the built
.pptx: GIFs become looping H.264 videos (sharper and ~10x smaller than GIF), YouTube embeds become click-to-play iframes,
embedded mp4s become <video> players. Speaker notes (with their source links) are shown in a toggleable panel.

Usage: python tools/export_web.py [OUT_DIR] [--download-url URL]
  default OUT_DIR = /home/user/blog/aisafety ; build the deck first (./build.sh)
"""
import glob
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


def main():
    args = sys.argv[1:]
    download = DEFAULT_DOWNLOAD
    if '--download-url' in args:
        i = args.index('--download-url')
        download = args[i + 1]
        del args[i:i + 2]
    out = args[0] if args else '/home/user/blog/aisafety'
    if not os.path.exists(DECK):
        sys.exit('build the deck first (./build.sh)')
    for sub in ('slides', 'thumbs', 'media'):
        shutil.rmtree(os.path.join(out, sub), ignore_errors=True)
        os.makedirs(os.path.join(out, sub))

    z = zipfile.ZipFile(DECK)
    parts, cx, cy = ordered_slides(z)
    slides, mp4cache = [], {}
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
                    with open(os.path.join(out, 'media', name), 'wb') as f:
                        f.write(z.read(tgt))
                    media.append({'kind': 'video', 'src': f'media/{name}', **g})
                continue
            if blip is not None:
                typ, tgt, ext = rels.get(blip.get(R_EMBED), (None, None, None))
                if tgt and tgt.lower().endswith('.gif') and not ext:
                    if tgt not in mp4cache:
                        tmpgif = os.path.join(tempfile.gettempdir(), 'deck_' + os.path.basename(tgt))
                        with open(tmpgif, 'wb') as f:
                            f.write(z.read(tgt))
                        base = f'loop-{len(mp4cache) + 1:02d}'
                        gif_to_mp4(tmpgif, os.path.join(out, 'media', base + '.mp4'))
                        gif_to_webm(tmpgif, os.path.join(out, 'media', base + '.webm'))
                        os.remove(tmpgif)
                        mp4cache[tgt] = f'media/{base}'
                    media.append({'kind': 'loop', 'webm': mp4cache[tgt] + '.webm', 'src': mp4cache[tgt] + '.mp4', **g})
        slides.append({'n': n, 'img': f'slides/slide-{n:02d}.jpg', 'thumb': f'thumbs/thumb-{n:02d}.jpg',
                       'notes': notes_text(z, part, rels), 'media': media})

    # render slide images
    tmp = tempfile.mkdtemp()
    shutil.copy(DECK, os.path.join(tmp, 'deck.pptx'))
    subprocess.run(['python3', SOFFICE, '--headless', '--convert-to', 'pdf', '--outdir', tmp, os.path.join(tmp, 'deck.pptx')],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=1200)
    subprocess.run(['pdftoppm', '-png', '-scale-to-x', '1920', '-scale-to-y', '-1', os.path.join(tmp, 'deck.pdf'),
                    os.path.join(tmp, 's')], check=True)
    from PIL import Image
    pages = sorted(glob.glob(os.path.join(tmp, 's-*.png')))
    assert len(pages) == len(slides), (len(pages), len(slides))
    for s, p in zip(slides, pages):
        im = Image.open(p).convert('RGB')
        im.save(os.path.join(out, s['img']), 'JPEG', quality=90, optimize=True, progressive=True, subsampling=0)
        # poster frames for embedded videos: crop the rendered cover from the slide image
        for m in s['media']:
            if m['kind'] == 'video':
                W, H = im.size
                box = (int(m['x'] * W), int(m['y'] * H), int((m['x'] + m['w']) * W), int((m['y'] + m['h']) * H))
                pname = m['src'].rsplit('.', 1)[0] + '-poster.jpg'
                im.crop(box).save(os.path.join(out, pname), 'JPEG', quality=88)
                m['poster'] = pname
        im.thumbnail((480, 270))
        im.save(os.path.join(out, s['thumb']), 'JPEG', quality=82, optimize=True)
    shutil.rmtree(tmp)

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
