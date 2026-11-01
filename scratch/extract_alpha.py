import os
from PIL import Image
import numpy as np
from scipy.ndimage import binary_fill_holes

cropped = Image.open("static/skillsync-logo-raw.png").convert("RGBA")
arr = np.array(cropped, dtype=np.float32)

rgb = arr[:, :, :3]

# Estimate background per-pixel or using local corners
# A gradient background: let's fit a simple plane to the 4 corners:
H, W, _ = arr.shape
x_coords, y_coords = np.meshgrid(np.arange(W), np.arange(H))

# Corner samples
c_tl = np.median(arr[:10, :10, :3], axis=(0, 1))
c_tr = np.median(arr[:10, -10:, :3], axis=(0, 1))
c_bl = np.median(arr[-10:, :10, :3], axis=(0, 1))
c_br = np.median(arr[-10:, -10:, :3], axis=(0, 1))

# Bilinear interpolation of background plane
bg_plane = (
    c_tl * (1 - x_coords / W)[:, :, None] * (1 - y_coords / H)[:, :, None] +
    c_tr * (x_coords / W)[:, :, None] * (1 - y_coords / H)[:, :, None] +
    c_bl * (1 - x_coords / W)[:, :, None] * (y_coords / H)[:, :, None] +
    c_br * (x_coords / W)[:, :, None] * (y_coords / H)[:, :, None]
)

diff = np.sqrt(np.sum((rgb - bg_plane) ** 2, axis=2))

# Smooth anti-aliased alpha:
# diff < 15: alpha = 0
# diff > 35: alpha = 1
alpha = np.clip((diff - 12.0) / (32.0 - 12.0), 0.0, 1.0)

print("Alpha min:", alpha.min(), "Alpha max:", alpha.max(), "Alpha mean:", alpha.mean())

# Let's save a test transparent image
out = np.zeros_like(arr)
out[:, :, :3] = rgb
out[:, :, 3] = alpha * 255.0

Image.fromarray(out.astype(np.uint8)).save("static/skillsync-logo-alpha.png")
print("Saved static/skillsync-logo-alpha.png")
