# Derived crops/highlights for slides_geopolitics.js (sources: assets/research/geopolitics, untouched).
from PIL import Image
import numpy as np, os
R = os.path.join(os.path.dirname(__file__), '..', '..', 'research', 'geopolitics')
O = os.path.dirname(__file__)

def crop(src, box, out):
    im = Image.open(os.path.join(R, src)).convert('RGB')
    im.crop(box).save(os.path.join(O, out))

def highlight(src, rects, out, box=None, color=(255, 209, 102)):
    im = np.array(Image.open(os.path.join(R, src)).convert('RGB')).astype(np.float32)
    c = np.array(color, np.float32) / 255.0
    for (x0, y0, x1, y1) in rects:
        im[y0:y1, x0:x1] *= c  # multiply blend keeps the ink dark
    img = Image.fromarray(im.clip(0, 255).astype(np.uint8))
    if box: img = img.crop(box)
    img.save(os.path.join(O, out))

crop('cnn-ai-china-ship.png', (0, 30, 2430, 710), 'cnn-ship-head.png')
crop('cbs-hegseth-anthropic-supply-chain-risk.png', (0, 0, 1260, 515), 'cbs-head.png')
crop('cnn-trump-ai-hoax.png', (0, 62, 2440, 640), 'cnn-hoax-head.png')
crop('npr-ai-preemption-eo.png', (0, 0, 1369, 375), 'npr-head.png')
crop('guardian-lavender.png', (345, 75, 1615, 960), 'lavender.png')
crop('guardian-gospel.png', (345, 75, 1615, 1000), 'gospel.png')
# Ukraine: MoD promo photo stacked above the article's own headline (breadcrumb/tags skipped)
def stack_photo_headline(src, photo_box, head_box, out, width=1440, pad=22, margin=45):
    im = Image.open(os.path.join(R, src)).convert('RGB')
    ph = im.crop(photo_box); hd = im.crop(head_box)
    ph = ph.resize((width, round(ph.height * width / ph.width)), Image.LANCZOS)
    if hd.width > width - 2 * margin:
        hd = hd.resize((width - 2 * margin, round(hd.height * (width - 2 * margin) / hd.width)), Image.LANCZOS)
    canvas = Image.new('RGB', (width, ph.height + pad + hd.height + pad), (255, 255, 255))
    canvas.paste(ph, (0, 0)); canvas.paste(hd, (margin, ph.height + pad))
    canvas.save(os.path.join(O, out))
stack_photo_headline('defensepost-ukraine-ai-drones.png', (6, 115, 2268, 1085), (50, 1560, 1400, 1785), 'ukraine-drones.png')
crop('euronews-ai-nuclear-wargames.png', (0, 100, 1728, 290), 'euronews-wargames.png')
crop('pbs-us-china-ai-channel.png', (213, 8, 1226, 1450), 'pbs-xi.png')
crop('register-h200-china.png', (0, 0, 2407, 470), 'register-h200.png')
crop('toms-deepseek-nvidia.png', (0, 0, 1261, 520), 'toms-deepseek.png')
crop('digitimes-huawei-ascend.png', (40, 60, 1520, 445), 'digitimes-huawei.png')
crop('mee-houthis-claude.png', (0, 0, 1997, 490), 'mee-head.png')
crop('anthropic-yemen-gtg87001-figure.png', (0, 0, 1522, 1175), 'yemen-vee.png')

# Hegseth memo p.4 — the key sentence highlighted, cropped to the 'Speed Wins' paragraph
highlight('hegseth-memo-speed-wins.png',
          [(1330, 421, 1392, 464), (46, 463, 1297, 506), (46, 505, 214, 548)], 'memo-speed-hl.png',
          box=(30, 318, 1405, 640))  # start at the 'Speed Wins.' paragraph (header crop gives the context)
# Trump's post: body only (archive header has a broken avatar), key phrases highlighted
highlight('trumpstruth-high-iq-post.png',
          [(908, 279, 1294, 321), (66, 332, 452, 377), (585, 669, 1053, 711)], 'trump-post-hl.png',
          box=(10, 222, 1398, 930))
# Yemen case detail — key lines highlighted
highlight('anthropic-yemen-gtg87001-detail.png',
          [(152, 21, 812, 54), (296, 652, 1012, 685), (28, 689, 108, 716)], 'yemen-detail-hl.png')
print('ok')
