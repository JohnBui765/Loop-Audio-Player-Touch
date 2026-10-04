"""Echo Loop+ Touch icon: the Echo Loop+ loop ring on a teal-to-indigo tile, around a waveform with one selected
section whose edges carry iPhone-style selection handles (A's knob on top, B's at the bottom), so it reads as the
touch edition next to Echo Loop+ and Echo Loop+ Desktop."""
import math
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.dirname(os.path.abspath(__file__))
S = 2048
C = S / 2

a = np.array([20, 184, 166], dtype=float)   # teal-500
b = np.array([55, 48, 163], dtype=float)    # indigo-800
yy, xx = np.mgrid[0:S, 0:S]
t = ((xx + yy) / (2 * S - 2))[..., None]
img = Image.fromarray((a * (1 - t) + b * t).astype(np.uint8), "RGB").convert("RGBA")

glow = Image.new("L", (S, S), 0)
ImageDraw.Draw(glow).ellipse([-S * 0.25, -S * 0.35, S * 0.75, S * 0.55], fill=56)
glow = glow.filter(ImageFilter.GaussianBlur(S * 0.08))
img = Image.composite(Image.new("RGBA", (S, S), (255, 255, 255, 255)), img, glow)

d = ImageDraw.Draw(img)
white = (255, 255, 255, 255)

# loop ring with arrowhead (same motif as Echo Loop, Echo Loop+ and Echo Loop+ Desktop)
R, W = 0.30 * S, 0.064 * S
start, end = -40, 245
d.arc([C - R - W / 2, C - R - W / 2, C + R + W / 2, C + R + W / 2], start=start, end=end, fill=white, width=int(W))
sx, sy = C + R * math.cos(math.radians(start)), C + R * math.sin(math.radians(start))
d.ellipse([sx - W / 2, sy - W / 2, sx + W / 2, sy + W / 2], fill=white)
th = math.radians(end)
P = (C + R * math.cos(th), C + R * math.sin(th))
T = (-math.sin(th), math.cos(th))
N = (math.cos(th), math.sin(th))
L, Hw = 0.10 * S, 0.072 * S
tip = (P[0] + L * T[0], P[1] + L * T[1])
b1 = (P[0] + Hw * N[0] - 0.01 * S * T[0], P[1] + Hw * N[1] - 0.01 * S * T[1])
b2 = (P[0] - Hw * N[0] - 0.01 * S * T[0], P[1] - Hw * N[1] - 0.01 * S * T[1])
d.polygon([tip, b1, b2], fill=white)

# waveform; bars 3-7 sit inside the selected section (band), whose edges are touch handles
heights = [0.06, 0.11, 0.19, 0.27, 0.33, 0.24, 0.29, 0.17, 0.10, 0.05]
bw, gap = 0.026 * S, 0.020 * S
total = len(heights) * bw + (len(heights) - 1) * gap
x0 = C - total / 2
band = Image.new("RGBA", (S, S), (0, 0, 0, 0))
bd = ImageDraw.Draw(band)
hx0 = x0 + 3 * (bw + gap) - gap * 0.55
hx1 = x0 + 8 * (bw + gap) - gap * 0.45
top, bot = C - 0.15 * S, C + 0.15 * S
bd.rectangle([hx0, top, hx1, bot], fill=(255, 255, 255, 64))
img = Image.alpha_composite(img, band)
d = ImageDraw.Draw(img)
edge = 0.011 * S
knob = 0.031 * S
d.rounded_rectangle([hx0 - edge / 2, top, hx0 + edge / 2, bot], radius=edge / 2, fill=white)
d.rounded_rectangle([hx1 - edge / 2, top, hx1 + edge / 2, bot], radius=edge / 2, fill=white)
d.ellipse([hx0 - knob, top - 1.6 * knob, hx0 + knob, top + 0.4 * knob], fill=white)   # A: knob on top
d.ellipse([hx1 - knob, bot - 0.4 * knob, hx1 + knob, bot + 1.6 * knob], fill=white)   # B: knob at the bottom
for i, hgt in enumerate(heights):
    x = x0 + i * (bw + gap)
    hh = hgt * S
    d.rounded_rectangle([x, C - hh / 2, x + bw, C + hh / 2], radius=bw / 2, fill=white)

img = img.convert("RGB")
for size, name in [(512, "icon-512.png"), (192, "icon-192.png"), (180, "icon-180.png")]:
    img.resize((size, size), Image.LANCZOS).save(os.path.join(OUT, name), optimize=True)
print("icons written to", OUT)
