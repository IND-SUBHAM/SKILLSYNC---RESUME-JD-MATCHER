import os
from PIL import Image
import numpy as np

im = Image.open("static/skillsync-logo-alpha.png").convert("RGBA")
arr = np.array(im, dtype=np.float32)

rgb = arr[:, :, :3]
alpha = arr[:, :, 3] / 255.0

# Extract lightness/perceived luminance:
# Standard relative luminance: Y = 0.299 R + 0.587 G + 0.114 B
lum = (0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]) / 255.0

# In the original image:
# Blue/Cyan channel dominance vs Red/Purple channel:
# Red > Blue -> Purple/Indigo
# Blue > Red -> Cyan/Teal
r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
cyan_factor = np.clip((b - r) / 100.0, -1.0, 1.0)
# Normalize to [0, 1] where 0 = deepest purple, 1 = brightest cyan
t = np.clip((cyan_factor + 1.0) * 0.5, 0.0, 1.0)

# Also factor in position / coordinate along the gradient axis:
H, W = arr.shape[:2]
y_norm = np.linspace(0, 1, H)[:, None]
x_norm = np.linspace(0, 1, W)[None, :]
# In original, top-right is cyan, bottom-left is purple:
diag_t = np.clip((x_norm + (1.0 - y_norm)) * 0.5, 0.0, 1.0)

# Combined tone t in [0, 1]:
# 0 = deep emerald forest (#045c43)
# 0.5 = rich emerald (#10b981)
# 1.0 = radiant mint/neon cyan (#34d399 / #22e2a0)
tone = 0.6 * t + 0.4 * diag_t

# Base palette:
# Dark end (deep emerald): [6, 95, 70] / 255
# Mid end (vibrant emerald): [16, 185, 129] / 255
# Bright end (mint glow): [52, 211, 153] / 255
# Lightest highlights (cyan-mint): [110, 231, 183] / 255

c_dark = np.array([5, 84, 60], dtype=np.float32)
c_mid = np.array([16, 185, 129], dtype=np.float32)
c_bright = np.array([52, 211, 153], dtype=np.float32)
c_neon = np.array([110, 231, 183], dtype=np.float32)

# Interpolate base color:
base_rgb = np.zeros_like(rgb)
mask_low = tone < 0.5
t_low = tone[mask_low] * 2.0
base_rgb[mask_low] = c_dark * (1.0 - t_low[:, None]) + c_mid * t_low[:, None]

mask_high = tone >= 0.5
t_high = (tone[mask_high] - 0.5) * 2.0
base_rgb[mask_high] = c_mid * (1.0 - t_high[:, None]) + c_bright * t_high[:, None]

# Modulate with original luminosity:
# The original luminosity preserves the bevels, lighting, and constellation dots!
# Identify constellation nodes and lines (very high luminance and near-white):
is_node = (lum > 0.72) & (alpha > 0.5)
node_intensity = np.clip((lum - 0.65) / 0.35, 0.0, 1.0)

# Multiply base color with luminance curve:
lum_factor = np.clip(lum / 0.55, 0.35, 1.7)
green_rgb = base_rgb * lum_factor[:, :, None]

# Add luminous constellation nodes glow:
node_color = np.array([236, 253, 245], dtype=np.float32) # Minty white
green_rgb = green_rgb * (1.0 - node_intensity[:, :, None]) + node_color * node_intensity[:, :, None]

green_rgb = np.clip(green_rgb, 0.0, 255.0)

out = np.zeros_like(arr)
out[:, :, :3] = green_rgb
out[:, :, 3] = alpha * 255.0

# Save high-res green logo:
out_img = Image.fromarray(out.astype(np.uint8))
out_img.save("static/skillsync-logo-green.png")
print("Saved static/skillsync-logo-green.png")
