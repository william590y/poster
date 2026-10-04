"""Animated GIF for the intelligence-explosion slide: a glowing pulse circles the loop, each lap faster than the last.

The GIF is drawn on the exact crop of the slide background it sits on (assets/art/bg_content.png), so it blends in; the
nodes, icons and labels stay as native PowerPoint shapes layered on top of it (see theory_slides.explosionSlide).

Usage: python tools/make_loop_gif.py  ->  assets/art/loop_explosion.gif (+ loop_explosion_first.png for previews)
"""
import math
import os
import shutil
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), '..')
ART = os.path.join(ROOT, 'assets', 'art')

# geometry in slide inches (must match theory_slides.explosionSlide)
CX, CY, R = 9.7, 4.0, 1.5
HALF = 2.05                      # GIF covers (CX±HALF, CY±HALF)
PPI = 192                        # bg_content.png is 2560 px across 13.333 in
SS = 2                           # supersampling factor
RED = (229, 56, 59)
HOT = (255, 120, 110)
NODE_R = 0.42                    # node circle radius (in)

LAPS = [2.6, 1.8, 1.25, 0.9, 0.65, 0.48, 0.36]   # seconds per lap: each lap faster
FPS = 25
HOLD = 0.6                       # pause (s) after the last lap before looping


def px(v):
    return v * PPI * SS


def main():
    bg = Image.open(os.path.join(ART, 'bg_content.png')).convert('RGB')
    x0, y0 = round((CX - HALF) * PPI), round((CY - HALF) * PPI)
    size = round(2 * HALF * PPI)
    base = bg.crop((x0, y0, x0 + size, y0 + size)).resize((size * SS, size * SS), Image.LANCZOS)
    c = size * SS / 2
    rr = px(R)

    # timeline: angle (radians, 0 = top, clockwise) as a function of frame
    angles, speeds = [], []
    for lap, dur in enumerate(LAPS):
        n = max(6, round(dur * FPS))
        for i in range(n):
            angles.append(2 * math.pi * (lap + i / n))
            speeds.append(lap / (len(LAPS) - 1))
    for _ in range(round(HOLD * FPS)):
        angles.append(None)
        speeds.append(1.0)

    def pt(a, r=rr):
        return c + r * math.sin(a), c - r * math.cos(a)

    tmp = tempfile.mkdtemp()
    for f, (a, spd) in enumerate(zip(angles, speeds)):
        im = base.copy()
        glow = Image.new('RGBA', im.size, (0, 0, 0, 0))
        g = ImageDraw.Draw(glow)
        d = ImageDraw.Draw(im)
        # dashed ring
        dash, gap = 0.11, 0.07   # radians
        t = 0.0
        while t < 2 * math.pi:
            seg = [pt(t + k * dash / 12) for k in range(13)]
            d.line(seg, fill=RED, width=round(px(0.028)))
            t += dash + gap
        # clockwise arrowheads between the nodes
        for deg in (45, 135, 225, 315):
            th = math.radians(deg)
            tip = pt(th + 0.09)
            back = pt(th - 0.03)
            ang = math.atan2(tip[1] - back[1], tip[0] - back[0])
            s = px(0.12)
            p1 = (tip[0] + s * 0.0 * math.cos(ang), tip[1] + s * 0.0 * math.sin(ang))
            p2 = (tip[0] - s * math.cos(ang) + s * 0.55 * math.sin(ang), tip[1] - s * math.sin(ang) - s * 0.55 * math.cos(ang))
            p3 = (tip[0] - s * math.cos(ang) - s * 0.55 * math.sin(ang), tip[1] - s * math.sin(ang) + s * 0.55 * math.cos(ang))
            d.polygon([p1, p2, p3], fill=RED)
        if a is not None:
            # comet tail: fading arc behind the head, longer when faster
            tail = 0.5 + 0.9 * spd
            steps = 40
            for k in range(steps):
                tt = a - tail * k / steps
                alpha = int(230 * (1 - k / steps) ** 1.6)
                w = px(0.07) * (1 - k / steps) + px(0.012)
                x, y = pt(tt)
                g.ellipse([x - w, y - w, x + w, y + w], fill=HOT + (alpha,))
            # node glow when the head passes a node
            for nd in range(4):
                na = nd * math.pi / 2
                diff = abs((a - na + math.pi) % (2 * math.pi) - math.pi)
                if diff < 0.45:
                    k = 1 - diff / 0.45
                    nx, ny = pt(na)
                    rg = px(NODE_R + 0.16)
                    g.ellipse([nx - rg, ny - rg, nx + rg, ny + rg], fill=RED + (int(150 * k),))
            hx, hy = pt(a)
            hr = px(0.085)
            g.ellipse([hx - hr * 2.2, hy - hr * 2.2, hx + hr * 2.2, hy + hr * 2.2], fill=RED + (90,))
        glow = glow.filter(ImageFilter.GaussianBlur(px(0.045)))
        im.paste(glow, (0, 0), glow)
        if a is not None:
            # crisp tapering tail on top of the glow (longer when the loop is faster)
            ov = Image.new('RGBA', im.size, (0, 0, 0, 0))
            o = ImageDraw.Draw(ov)
            tail = 0.7 + 1.1 * spd
            steps = 60
            for k in range(steps):
                t1, t2 = a - tail * k / steps, a - tail * (k + 1) / steps
                fade = (1 - k / steps)
                o.line([pt(t1), pt(t2)], fill=HOT + (int(255 * fade ** 1.3),), width=max(1, round(px(0.055) * fade + px(0.01))))
            im.paste(ov, (0, 0), ov)
            d = ImageDraw.Draw(im)
            hx, hy = pt(a)
            hr = px(0.07)
            d.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=(255, 235, 230))
        im = im.resize((size, size), Image.LANCZOS)
        im.save(os.path.join(tmp, f'f{f:04d}.png'))
        if f == 0:
            im.save(os.path.join(ART, 'loop_explosion_first.png'))

    out = os.path.join(ART, 'loop_explosion.gif')
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-framerate', str(FPS), '-i', os.path.join(tmp, 'f%04d.png'),
                    '-vf', 'split[a][b];[a]palettegen=max_colors=256:stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a',
                    '-loop', '0', out], check=True)
    if shutil.which('gifsicle'):
        subprocess.run(['gifsicle', '-O3', '--batch', out], check=True)
    shutil.rmtree(tmp)
    print('wrote', out, os.path.getsize(out), 'bytes,', len(angles), 'frames')


if __name__ == '__main__':
    main()
