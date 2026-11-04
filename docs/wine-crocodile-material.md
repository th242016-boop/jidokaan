# 와인 크로커다일 — 2026-11-04 shape correction

The administrator Special studio retains `WINE CROCODILE`, displayed as
**와인 크로커다일**, on high-cut B–J and mid-cut B–J except G. Its material shape
has been corrected; the catalog, private audience and other materials retain
their existing behavior.

## Why the first texture was rejected

The owner's original 1153×2048 photograph `20261026_111248.jpg` contains several
scale families: large belly rectangles, smaller squared plates, and rounded
flank cells. The first implementation sampled only a 222×222 upper-photo patch,
then repeated it at 122 native shoe pixels. That patch predominantly contained
small rectangles and could not represent the supplied hide's mixed character.

The original JPEG remains encrypted as `material-wine-crocodile-photo.enc` for
provenance. Its SHA-256 is
`72c158d4ee19a0116a5065e0aff05ef8e438f19e34d2224482e8e525a710a87d`.
It is no longer the delivered material and is not a fallback when the corrected
atlas is unavailable.

## Reference-reconstructed mixed-shape atlas

The replacement is an AI-reconstructed material atlas based on that photograph,
not a pixel-exact extraction of the original hide. It combines large irregular
rectangular plates, smaller squared plates and some rounded cells in one broad
surface, while retaining the reference's wine dye and lighter, worn-looking
creases. The reconstruction removes hands, background, tape and overlapping
leather cut edges; those objects must not appear on the shoe.

The 1254×1254 JPEG is protected as `material-wine-crocodile-atlas.enc`. Its
SHA-256 is
`f84f4842a2d692ecac04054900d6b7b3a9c94139d16fc2cbef7895e89c90cc1b`.
Both selector swatch and renderer use the entire atlas (`sourceCrop: [0,0,1,1]`).
The native projected atlas spans at least 720 pixels, extending only when a
panel's guarded warped bounds require it. Each panel takes one independent
bounded atlas cut rather than mirroring or tiling a small pattern. This keeps
mixed shape families visible at product scale and avoids a uniform grid of tiny
repeats. Scale remains an approximate visual calibration, not a measured cutting
layout or an exact representation of the supplied hide.

Wine-only cut positions place B toward the lower mixed-shape transition
(`0.65, 0.95`), C toward the rounded flank (`0.9, 0.85`) and D across the
large/small rectangle boundary (`0.25, 0.5`). Other panels retain their shared
cut positions. These values select different regions of one atlas; they do not
alter any other material's mapping.

## Preserved lighting and boundaries

The approved fixed-view light response is unchanged: blur 30, floor 0.58,
peak 1.16 and sheen 0.012. It supplies broad, restrained satin rather than a
metallic or enamel response. The reconstructed source's uneven wine tones and
lighter creases remain visible under the shoe light field. This is a fixed-view
2D photographic preview, not a measured 3D surface or prediction of all angles.

Native RED alpha remains the sole boundary authority, including lace holes.
Dark seams and final stitch restoration remain intact. B/C retain their existing
double-row stitch corridors; H/J retain the detail limitations of their original
photographs. Mesh, laces, beads, menus and background are unchanged.

## Private delivery and verification

The existing private-photo key protects the atlas. A verified administrator
session and administrator audience are required to retrieve it. Missing or
corrupted atlas ciphertext omits only this option, without reverting to the
rejected small-rectangle crop. No plaintext atlas is stored under `public/` or
bundled in the client.

`scripts/wine-crocodile-render-smoke.mjs` runs the actual application renderer
through optional native Canvas. It renders all 17 native 1424×1392 layers,
high/mid composites and B/C stitch enlargements, requiring exact native alpha
and zero exterior spill. Eighteen historical material/model/part combinations
are compared byte-for-byte with baseline `a6bbce8`, including Mint Gold Pearl.
Additional checks require unchanged low-gloss parameters, wine hue retention,
lighter worn creases, darker seams and stable alpha across illumination levels.
The catalog test verifies the atlas source, full-source crop, private delivery,
compact round-trip, per-source failure isolation and absence of the old-photo
fallback. Visual review, rather than a formula-only test, checks that large,
small and rounded scale families are actually apparent on the main panels.
These native Canvas checks are not a logged-in production browser session.
