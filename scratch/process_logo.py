import os
from PIL import Image
import numpy as np
import colorsys

src_path = r'C:\Users\ASUS\.gemini\antigravity-ide\brain\8e056275-d1f4-4e52-a77b-f737d4d5b344\.user_uploaded\media_1791083897530.png'
im = Image.open(src_path).convert("RGBA")
w, h = im.size
pixels = np.array(im, dtype=np.float32)

# Convert RGB to HSV
r = pixels[:, :, 0] / 255.0
g = pixels[:, :, 1] / 255.0
b = pixels[:, :, 2] / 255.0

# Calculate max, min, delta
maxc = np.maximum(np.maximum(r, g), b)
minc = np.minimum(np.minimum(r, g), b)
delta = maxc - minc

# Saturation and Value
s = np.zeros_like(maxc)
nonzero = maxc > 1e-5
s[nonzero] = delta[nonzero] / maxc[nonzero]
v = maxc

# Background detection:
# The background is very low saturation (s < 0.12) and high value (v > 0.8)
# But wait: the constellation nodes/lines inside the logo are near-white (high v, low s).
# Where are they? They are inside the arrows!
# Let's inspect the bounding box of the logo first:
# Logo pixels have either high saturation (s > 0.18) or lower value (v < 0.75).
is_logo = (s > 0.14) | (v < 0.72)

# Find bounding box of logo:
ys, xs = np.where(is_logo)
print(f"Bounding box: X: [{xs.min()}, {xs.max()}], Y: [{ys.min()}, {ys.max()}]")

# Let's crop the image with a small margin:
pad = 12
x1, x2 = max(0, xs.min() - pad), min(w, xs.max() + pad)
y1, y2 = max(0, ys.min() - pad), min(h, ys.max() + pad)
print(f"Crop box: ({x1}, {y1}) to ({x2}, {y2})")

cropped = im.crop((x1, y1, x2, y2))
cropped.save("static/skillsync-logo-raw.png")
print("Saved static/skillsync-logo-raw.png")
