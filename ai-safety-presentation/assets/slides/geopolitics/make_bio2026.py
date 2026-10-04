# Derived assets for the 2026 AI-bio slides (slides_geopolitics.js: proteinSlide, accessSlide).
# Sources (untouched) live in assets/research/geopolitics/rev2/. Crops / resizes / GIF re-encode only — no pixel edits.
# Highlight boxes for the system-card clippings are emitted as JSON (image-pixel coords) and drawn as native
# semi-transparent shapes on the slide, never painted onto the screenshot.
import json, os, re, subprocess
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
RV = os.path.join(HERE, '..', '..', 'research', 'geopolitics', 'rev2')


def crop(src, box, out, width=None):
    im = Image.open(os.path.join(RV, src)).convert('RGB').crop(box)
    if width and im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(os.path.join(HERE, out))
    return im.size


# --- news / blog headline clippings ---------------------------------------------------------------
# Anthropic research post: 'Science' tag, title, date (2560x4400 capture)
crop('anthropic-protein-blog-top.png', (300, 165, 2260, 660), 'protein-blog-head.png')
# Dataconomy: headline + byline/date on the grey hero (2360x2240 capture)
crop('dataconomy-protein-headline.png', (250, 520, 2110, 935), 'dataconomy-protein-head.png')
# Adaptyv Bio (the CRO that made and measured the designs): title + date (2400x3000 capture)
crop('adaptyv-casestudy.png', (215, 405, 2020, 705), 'adaptyv-head.png')

# --- OpenAI GPT-Rosalind-5.5 system card, rendered at 300 dpi from the PDF ------------------------
# Word boxes come from `pdftotext -bbox-layout` (points * 300/72). Crops are whole text lines.
S = 300 / 72
CARD = [
    # (page png, crop box px, out, [highlight phrases as (x0, y0, x1, y1) px on the PAGE])
    ('openai-rosalind-pdfp3-300dpi.png', (262, 1764, 2226, 1887), 'rosalind-highcap.png'),
    ('openai-rosalind-pdfp3-300dpi.png', (262, 2655, 2226, 2836), 'rosalind-norefuse.png'),
    ('openai-rosalind-pdfp9-300dpi.png', (262, 924, 2226, 1108), 'rosalind-nomonitor.png'),
]
for src, box, out in CARD:
    crop(src, box, out)


def word_boxes(pdf, page):
    """Return [(x0,y0,x1,y1,word)] in 300-dpi pixels for one PDF page."""
    html = subprocess.run(['pdftotext', '-bbox-layout', '-f', str(page), '-l', str(page), pdf, '-'],
                          capture_output=True, text=True).stdout
    return [(float(a) * S, float(b) * S, float(c) * S, float(d) * S, w) for a, b, c, d, w in
            re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]+)</word>', html)]


def phrase_rects(words, phrase, origin):
    """Union boxes (one per text line) of the first occurrence of `phrase`, relative to crop origin."""
    toks = phrase.split()
    ws = [w[4] for w in words]
    for i in range(len(ws) - len(toks) + 1):
        if ws[i:i + len(toks)] == toks:
            sel = words[i:i + len(toks)]
            lines = {}
            for x0, y0, x1, y1, _ in sel:
                key = round(y0 / 20)
                l = lines.setdefault(key, [x0, y0, x1, y1])
                l[0], l[1], l[2], l[3] = min(l[0], x0), min(l[1], y0), max(l[2], x1), max(l[3], y1)
            ox, oy = origin
            return [[round(l[0] - ox - 6), round(l[1] - oy - 4), round(l[2] - ox + 6), round(l[3] - oy + 4)] for l in lines.values()]
    raise SystemExit('phrase not found: ' + phrase)


PDF = os.environ.get('ROSALIND_PDF')  # optional: path to gpt-rosalind-5-5.pdf to regenerate highlight boxes
if PDF:
    p3, p9 = word_boxes(PDF, 3), word_boxes(PDF, 9)
    hl = {
        'rosalind-highcap.png': phrase_rects(p3, 'met our threshold for High capability', (262, 1764)),
        'rosalind-norefuse.png': phrase_rects(p3, 'it is trained not to refuse sophisticated biology queries,', (262, 2655))
        + phrase_rects(p3, 'as the primary safeguard.', (262, 2655)),
        'rosalind-nomonitor.png': phrase_rects(p9, 'we are not deploying automated monitors', (262, 924))
        + phrase_rects(p9, 'for real-time blocking of potentially unsafe generations.', (262, 924)),
    }
    json.dump(hl, open(os.path.join(HERE, 'bio2026-highlights.json'), 'w'), indent=1)

# --- Anthropic's hero clip -> looping GIF ------------------------------------------------------------
# 11 s, 1920x1080. The loop is started at t=1.0 s (grid of binders on their targets fully visible) so the first
# frame — what static previews show — is meaningful; the order of the loop is unchanged.
MP4 = os.path.join(RV, 'anthropic-protein-binders.mp4')
GIF = os.path.join(HERE, 'protein-binders.gif')
if not os.path.exists(GIF) or os.environ.get('REBUILD_GIF'):
    vf = ('[0:v]trim=start=1.0:end=11.0,setpts=PTS-STARTPTS[a];[0:v]trim=start=0:end=1.0,setpts=PTS-STARTPTS[b];'
          '[a][b]concat=n=2:v=1:a=0,fps=20,scale=1280:-1:flags=lanczos,split[x][y];'
          '[x]palettegen=stats_mode=diff:max_colors=256[p];[y][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', MP4, '-filter_complex', vf, '-loop', '0', GIF], check=True)
    subprocess.run(['gifsicle', '-O3', '--batch', GIF], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '1.5', '-i', MP4, '-frames:v', '1',
                    os.path.join(HERE, 'protein-binders-poster.png')], check=True)
print('ok')
