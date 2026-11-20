"""Draws three original comic-style city illustrations for the cover maker's
sample photos. No real people, no game artwork: flat colours, thick black
outlines and halftone dots, drawn from scratch with Pillow."""
import math
import random
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 900
random.seed(7)

YELLOW = (255, 212, 0)
RED = (230, 51, 41)
BLACK = (17, 17, 17)
WHITE = (255, 255, 255)
ORANGE = (255, 122, 26)
PINK = (255, 92, 138)
PURPLE = (58, 28, 84)
TEAL = (0, 178, 169)
BLUE = (38, 84, 214)
SKY = (255, 214, 140)


def sky_gradient(d, top, bottom):
    for y in range(H):
        t = y / H
        c = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        d.line([(0, y), (W, y)], fill=c)


def sun(d, cx, cy, r, colour):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=colour, outline=BLACK, width=8)
    for k in range(12):
        a = math.pi * 2 * k / 12
        x1, y1 = cx + math.cos(a) * (r + 14), cy + math.sin(a) * (r + 14)
        x2, y2 = cx + math.cos(a) * (r + 52), cy + math.sin(a) * (r + 52)
        d.line([(x1, y1), (x2, y2)], fill=BLACK, width=9)


def halftone(d, box, spacing=26, max_r=7, colour=BLACK):
    x0, y0, x1, y1 = box
    for y in range(y0, y1, spacing):
        for x in range(x0, y1 and x1, spacing):
            r = max_r * (0.4 + 0.6 * ((x + y) % 3) / 2)
            d.ellipse([x - r, y - r, x + r, y + r], fill=colour)


def palm(d, x, y, s, colour=BLACK):
    d.line([(x, y), (x + 8 * s, y - 150 * s)], fill=colour, width=int(14 * s))
    for k in range(-2, 3):
        a = -math.pi / 2 + k * 0.45
        ex = x + 8 * s + math.cos(a) * 95 * s
        ey = y - 150 * s + math.sin(a) * 55 * s
        d.line([(x + 8 * s, y - 150 * s), (ex, ey)], fill=colour, width=int(11 * s))


def windows(d, x, y, w, h, lit):
    cols, rows = max(2, w // 46), max(2, h // 52)
    for r in range(rows):
        for c in range(cols):
            wx = x + 12 + c * ((w - 24) // cols)
            wy = y + 14 + r * ((h - 28) // rows)
            d.rectangle([wx, wy, wx + 22, wy + 26],
                        fill=YELLOW if (r * cols + c) in lit else (30, 30, 46),
                        outline=BLACK, width=2)


def boulevard():
    img = Image.new("RGB", (W, H), SKY)
    d = ImageDraw.Draw(img)
    sky_gradient(d, (255, 170, 60), (255, 92, 138))
    sun(d, 880, 240, 120, YELLOW)
    d.polygon([(0, 900), (0, 620), (1200, 620), (1200, 900)], fill=(40, 24, 64))
    # buildings left and right
    for (x, y, w, h, col) in [(40, 300, 220, 320, PURPLE), (300, 210, 190, 410, (90, 40, 120)),
                              (900, 260, 200, 360, PURPLE), (1120, 330, 80, 290, (90, 40, 120))]:
        d.rectangle([x, y, x + w, y + h], fill=col, outline=BLACK, width=7)
        windows(d, x, y, w, h, {1, 4, 7, 12, 15, 20})
    # road with perspective
    d.polygon([(330, 900), (560, 620), (640, 620), (870, 900)], fill=(24, 24, 28), outline=BLACK)
    for i in range(5):
        t = i / 5
        y = 640 + (900 - 640) * t * t
        wdt = 8 + 26 * t
        d.rectangle([592 - wdt // 2, y, 608 + wdt // 2, y + 14 + 20 * t], fill=YELLOW)
    # palms
    palm(d, 120, 640, 1.0)
    palm(d, 1060, 640, 0.9)
    # speed lines top-left
    for i in range(6):
        d.line([(40 + i * 26, 60), (180 + i * 26, 60)], fill=BLACK, width=7)
    halftone(d, (700, 480, 1200, 620), spacing=30, max_r=6)
    return img


def pier():
    img = Image.new("RGB", (W, H), SKY)
    d = ImageDraw.Draw(img)
    sky_gradient(d, (255, 214, 140), (0, 178, 169))
    sun(d, 300, 220, 110, (255, 240, 180))
    # clouds
    for (cx, cy, s) in [(760, 150, 1.0), (980, 260, 0.7), (520, 110, 0.6)]:
        for dx, dy, r in [(-70, 0, 46), (0, -18, 58), (70, 0, 46)]:
            d.ellipse([cx + dx * s - r * s, cy + dy * s - r * s,
                       cx + dx * s + r * s, cy + dy * s + r * s],
                      fill=WHITE, outline=BLACK, width=5)
    # sea
    d.rectangle([0, 560, W, H], fill=(0, 120, 160), outline=BLACK, width=6)
    for y in range(600, 880, 46):
        for x in range(0, W, 90):
            d.arc([x, y, x + 70, y + 26], 200, 340, fill=WHITE, width=6)
    # pier planks
    d.polygon([(430, 900), (520, 560), (680, 560), (770, 900)], fill=(150, 90, 40), outline=BLACK, width=6)
    for i in range(7):
        t = i / 7
        y = 580 + (900 - 580) * t
        d.line([(440 + 130 * t, y), (760 - 130 * t, y)], fill=BLACK, width=4)
    # pier posts and lamp
    for x in (470, 730):
        d.rectangle([x, 700, x + 26, 900], fill=BLACK)
    d.line([(600, 560), (600, 380)], fill=BLACK, width=10)
    d.ellipse([560, 330, 640, 410], fill=YELLOW, outline=BLACK, width=7)
    palm(d, 90, 580, 1.1)
    palm(d, 1090, 580, 1.0)
    halftone(d, (0, 60, 420, 240), spacing=30, max_r=6)
    return img


def rooftop():
    img = Image.new("RGB", (W, H), (20, 16, 44))
    d = ImageDraw.Draw(img)
    # stars
    for _ in range(90):
        x, y = random.randint(0, W - 1), random.randint(0, 420)
        r = random.choice([2, 3, 4])
        d.ellipse([x - r, y - r, x + r, y + r], fill=WHITE)
    # moon
    d.ellipse([900, 90, 1080, 270], fill=YELLOW, outline=BLACK, width=7)
    d.ellipse([950, 130, 990, 170], fill=(230, 190, 0))
    # skyline
    heights = [260, 380, 300, 430, 340, 470, 290, 400, 330]
    x = -20
    for h in heights:
        w = 130
        d.rectangle([x, 620 - h, x + w, 620], fill=(48, 32, 88), outline=BLACK, width=6)
        windows(d, x, 620 - h, w, h, {0, 3, 6, 9, 13, 18, 22})
        x += w + 6
    # rooftop floor + railing
    d.rectangle([0, 620, W, H], fill=(60, 30, 60), outline=BLACK, width=6)
    for x in range(0, W, 110):
        d.line([(x, 620), (x, 560)], fill=BLACK, width=8)
    d.line([(0, 560), (W, 560)], fill=BLACK, width=8)
    # neon sign blocks
    d.rectangle([180, 660, 520, 780], fill=RED, outline=BLACK, width=7)
    d.rectangle([700, 660, 1040, 780], fill=TEAL, outline=BLACK, width=7)
    for y in range(690, 770, 22):
        d.line([(200, y), (500, y)], fill=WHITE, width=6)
        d.line([(720, y), (1020, y)], fill=WHITE, width=6)
    palm(d, 1120, 640, 0.8)
    return img


if __name__ == "__main__":
    import os
    out = os.path.expanduser("~/workspace/makefun/entries/zech-gta6cover/app/samples")
    os.makedirs(out, exist_ok=True)
    for name, fn in [("boulevard", boulevard), ("pier", pier), ("rooftop", rooftop)]:
        fn().save(os.path.join(out, name + ".jpg"), quality=88)
        print("wrote", name + ".jpg")
