# 그레이 도마뱀 — 2026-11-04

The administrator Special studio adds `GRAY LIZARD`, displayed as **그레이 도마뱀**.
It is available on high-cut B–J and mid-cut B–J except G. It is deliberately absent
from `PUBLIC_SPECIAL_PATTERNS`; it does not change the ordinary simulator, mesh,
laces, beads, model menu or background.

## Source and scale

The unmodified 1153×2048 JPEG `KakaoTalk_20261103_175454893_18.jpg` is encrypted in
`src/lib/special-assets/material-gray-lizard-photo.enc`. Its SHA-256 is
`4cd0346adf7ffd62398e90db994c0dc17b12b42795b888b5b2849669cfb34312`.
The renderer and swatch use the same hand-free 800×800 region beginning at
(300, 260). It includes elongated rounded rectangular scales and the smaller
rounder scales of the actual hide; no generated substitute texture is used.

The projected atlas spans 800 native shoe-photo pixels. Each panel samples an
independent cut, without mirrored repetition or joining B/C/D motifs at seams.
The source aspect ratio is preserved. This size is a visual estimate using the
hand as a reference, not a physical measurement or a manufacturing cutting plan.
Perspective and photographic illumination in the source remain.

The material is independent of the existing nine lizard dyes: it does not alias
to their black atlas and does not pass through their recoloring transfer. Its
own light response uses broad GOLD-guided neutral light (blur 22, diffuse floor
0.48, peak 1.10) and restrained satin sheen (0.018). Native RED remains the sole
alpha authority, preserving panel outlines and lace holes. Final stitch
restoration retains the established B/C double-row corridors; H/J retain the
existing source-detail limitation.

## Protected delivery

The existing `SIMULATOR_IVORY_ORNAMENT_KEY` also protects this photograph. Its
legacy environment-variable name is retained to avoid rotating a working key.
No plaintext source is stored in `public/` or imported into a client bundle.
Encrypted data uses Base64(12-byte IV + 16-byte GCM tag + ciphertext). Access
requires the API's verified administrator session and administrator audience.
Failure of an individual image omits only that material. Missing or invalid
shared photo key omits both photo materials, while the earlier catalog remains.

## Verification

`scripts/gray-lizard-render-smoke.mjs` runs the actual application
`loadPatternLayer` through optional native Canvas. It checks 17 native 1424×1392
layers, exact original alpha, no exterior spill, model-specific G availability,
the displayed name, separation from the black-lizard dye family, and coverage
within the 800px atlas including the curvature-warp margin. It writes full-shoe
previews and magnified B/C seam regions, and compares ten historical material
outputs byte-for-byte against a supplied baseline commit. These render checks
are not a logged-in production browser session.

The separate catalog/authentication tests cover private-only access, compact
crop delivery, missing/corrupt image isolation and the shared-key failure case.
