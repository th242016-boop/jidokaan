# 와인 크로커다일 — 2026-11-04 shape and scale correction

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
The selector retains the entire atlas (`sourceCrop: [0,0,1,1]`). The renderer
loads that same unchanged atlas and selects a region for each leather panel.

## Smaller motifs and panel-specific scale families

Following the mixed-shape correction deployed in `a41390d`, the owner requested
a 30% reduction in motif size and different regions on broad and narrow panels.
The new mapping uses 70% of the previous linear pitch in both axes. It applies
that reduction after the previous guarded panel-span calculation, so a large B
panel or tall E panel cannot silently cancel the requested reduction. This is a
linear change; the area of a corresponding motif is about 49% of its old area.

B/C select the lower-left large rectangular belly plates. D/E/F/G/H select the
upper smaller squared plates; I/J use that smaller field as well. The smaller
pitch requires more material area than one bounded cut, so selected regions
repeat by reflection with independent panel offsets. The source is not blended
with a second texture, and the renderer does not stretch a small region back to
fit a large panel. Visual checks inspect joins for conspicuous reflected shapes.
Other materials' sampling is unchanged.

This is a relative change from the deployed preview. Scale remains an
approximate visual calibration, not a measured physical cutting layout or an
exact representation of the supplied hide.

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
are compared byte-for-byte with baseline `a41390d`, including Mint Gold Pearl.
An RGB coordinate chart passed through the actual renderer makes each native
output pixel identify its source location. The observed local texture-coordinate
gradients verify approximately 0.7 linear pitch on all 17 panels, independently
of the implementation's tile constants. The sampled coordinate distributions
also verify the lower-left region for B/C and the upper region for D–J. This
checks mapping behavior; photographic renders remain necessary to judge the
large/small scale appearance and reflected joins.
Additional checks require unchanged low-gloss parameters, wine hue retention,
lighter worn creases, darker seams and stable alpha across illumination levels.
The catalog test verifies the atlas source, full-source crop, private delivery,
compact round-trip, per-source failure isolation and absence of the old-photo
fallback. Visual review checks that broad B/C panels show large belly plates
and the other leather panels show the smaller field, with stitch visibility and
the original satin response retained.
These native Canvas checks are not a logged-in production browser session.
