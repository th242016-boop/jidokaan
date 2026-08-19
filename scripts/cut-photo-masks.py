#!/usr/bin/env python3
"""Tight interior masks — stay inside visible panels, no overflow blobs."""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = Path("/workspace/public/simulator/photo/base.jpg")
OUT = Path("/workspace/public/simulator/photo")
PREV = Path("/workspace/screenshots")

COLORS = {
    "a": (200, 200, 200),
    "b": (25, 70, 200),
    "c": (45, 45, 50),
    "d": (210, 30, 35),
    "e": (230, 185, 30),
    "f": (110, 110, 115),
    "g": (175, 70, 200),
    "h": (0, 175, 175),
    "i": (255, 130, 40),
    "j": (70, 215, 80),
    "k": (140, 100, 60),
}


def poly(size, pts, blur=0.45):
    im = Image.new("L", size, 0)
    ImageDraw.Draw(im).polygon([(int(x), int(y)) for x, y in pts], fill=255)
    if blur:
        im = im.filter(ImageFilter.GaussianBlur(blur))
    return np.array(im).astype(np.float32) / 255.0


def save_overlay(photo, mask, path, color=(255, 30, 30)):
    a = mask[..., None]
    out = photo * (1 - a * 0.55) + np.array(color, np.float32) * (a * 0.55)
    Image.fromarray(out.astype(np.uint8)).save(path, quality=88)


def main():
    photo_im = Image.open(SRC).convert("RGB")
    w, h = photo_im.size
    photo = np.array(photo_im).astype(np.float32)
    L = photo.mean(2)
    shoe = (L > 24).astype(np.float32)

    m = {}

    # --- F collar strap (thin top band) ---
    m["f"] = poly((w, h), [
        (548, 214), (600, 188), (670, 176), (740, 184),
        (792, 214), (812, 258), (800, 302), (752, 328),
        (680, 332), (608, 318), (562, 284), (542, 244),
    ])

    # --- H tiny heel tab ---
    m["h"] = poly((w, h), [
        (748, 182), (798, 194), (812, 228), (786, 242),
        (754, 228), (738, 200),
    ])

    # --- G tongue (only under lace channel) ---
    m["g"] = poly((w, h), [
        (548, 360), (608, 348), (648, 388), (662, 470),
        (648, 560), (608, 620), (558, 632), (522, 580),
        (516, 470),
    ])

    # --- A mesh: medial vamp + lateral shaft (fabric only) ---
    a_med = poly((w, h), [
        (368, 520), (418, 410), (500, 348), (568, 368),
        (598, 470), (608, 640), (572, 780), (500, 830),
        (420, 810), (358, 700), (348, 590),
    ])
    a_lat = poly((w, h), [
        (688, 338), (768, 318), (838, 368), (862, 470),
        (848, 600), (792, 690), (722, 700), (682, 620),
        (672, 470), (674, 380),
    ])
    m["a"] = np.maximum(a_med, a_lat)

    # --- D toe cap (front patent, stay in front of wavy seam) ---
    m["d"] = poly((w, h), [
        (240, 930), (300, 868), (380, 848), (448, 888),
        (468, 970), (438, 1068), (360, 1118), (280, 1098),
        (228, 1020), (218, 968),
    ])

    # --- E lightning (thin chevron, stay on the raised bolt) ---
    m["e"] = poly((w, h), [
        (748, 498), (798, 478), (858, 508), (908, 568),
        (928, 638), (908, 708), (858, 768), (808, 738),
        (858, 668), (868, 608), (828, 558), (778, 548),
        (748, 568), (728, 528),
    ])

    # --- J thin outline around bolt ---
    j_out = poly((w, h), [
        (708, 448), (788, 424), (868, 458), (938, 532),
        (978, 622), (972, 718), (918, 812), (848, 872),
        (782, 838), (838, 752), (852, 668), (828, 592),
        (768, 548), (708, 562), (682, 512),
    ], 0.3)
    m["j"] = np.clip(j_out - m["e"] * 1.05, 0, 1)

    # --- I small medial shield ---
    m["i"] = poly((w, h), [
        (428, 778), (492, 762), (528, 798), (512, 848),
        (452, 868), (412, 828),
    ])

    # --- B lower lateral patent (between bolt and sole) ---
    m["b"] = poly((w, h), [
        (668, 888), (748, 868), (828, 898), (868, 968),
        (848, 1048), (758, 1078), (668, 1058), (628, 998),
        (628, 938),
    ])

    # --- C heel counter ---
    m["c"] = poly((w, h), [
        (1008, 448), (1088, 498), (1148, 588), (1172, 698),
        (1162, 818), (1108, 938), (1028, 1008), (958, 998),
        (938, 908), (958, 758), (978, 598), (988, 498),
    ])

    # --- K sole stack only ---
    m["k"] = poly((w, h), [
        (278, 1068), (348, 1158), (468, 1232), (618, 1278),
        (778, 1292), (938, 1268), (1078, 1198), (1168, 1098),
        (1188, 1018), (1138, 1008), (1028, 1098), (868, 1168),
        (698, 1188), (528, 1162), (398, 1102), (308, 1038),
    ])

    # subtract overlaps, later wins
    order = ["a", "g", "f", "h", "d", "c", "b", "e", "i", "j", "k"]
    claimed = np.zeros((h, w), np.float32)
    final = {}
    for k in order:
        part = np.clip(m[k] * np.clip(shoe + 0.2, 0, 1) - claimed * 0.9, 0, 1)
        part[shoe < 0.1] = 0
        final[k] = part
        claimed = np.maximum(claimed, part)

    OUT.mkdir(parents=True, exist_ok=True)
    for k, part in final.items():
        rgba = np.zeros((h, w, 4), np.uint8)
        rgba[:, :, :3] = 255
        rgba[:, :, 3] = (np.clip(part, 0, 1) * 255).astype(np.uint8)
        Image.fromarray(rgba).save(OUT / f"{k}.png")
        print(k, round(float((part > 0.15).mean()), 4))
        save_overlay(photo, part, PREV / "masks" / f"{k}.jpg")

    over = photo.copy()
    for k, part in final.items():
        col = np.array(COLORS[k], np.float32)
        mm = part[..., None]
        over = over * (1 - mm * 0.55) + col * (mm * 0.55)
    Image.fromarray(over.astype(np.uint8)).save(PREV / "photo-masks.jpg", quality=90)


if __name__ == "__main__":
    main()
