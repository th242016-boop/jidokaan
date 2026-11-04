# 민트골드 펄 — 2026-11-04

The administrator Special studio adds `MINT GOLD PEARL`, displayed as
**민트골드 펄**, on high-cut B–J and mid-cut B–J except G. It remains private.
Ordinary colors, mesh, laces, beads, other materials, menus and background retain
their existing behavior.

## Original photograph

The owner's unmodified 1153×2048 photograph
`KakaoTalk_20261104_153704893.jpg` supplies the actual small gold marks and mint
substrate. Its SHA-256 is
`54597bc1a9b307dca197b6ae6571108559774c0487a902407fce1008000b042b`.
The complete JPEG is protected as `material-mint-gold-pearl-photo.enc` using the
existing private-photo key. No generated substitute or copied black-lizard atlas
is used. The selector and panel renderer sample the same hand-free 142×142 crop
starting at (616, 240), defined in `mint-gold-pearl-material.ts`. The crop occupies
74 pixels in the native shoe photograph, a source-to-shoe ratio of about 0.52.

Motif scale is estimated from the hand in this reference and the native shoe
photograph. It is an approximate visual match, not an exact millimeter calibration
or manufacturing cutting layout. Individual panel cuts use independent offsets.

## Mint and gold lighting

The material's dedicated linear-RGB response separates the mint substrate from
warm gold faces using their photographed color. The mint remains visible in
softer illumination; the gold faces respond more strongly where the existing
shoe light guide is brighter. The source's small surface variations provide
highlight detail rather than synthetic random glitter. Broad photographed
shading is replaced with the shoe's established light direction.

This is a fixed-view 2D photographic relighting approximation. A single reference
does not measure a complete angular BRDF or prove true iridescence. The preview
shows the two-color reflection character across the photographed shoe's faces;
it is not a dynamic 3D view with a movable light.

Native RED alpha remains the boundary authority, including lace holes. Original
dark seams and the existing final stitch restoration remain, including the B/C
double-row stitch corridors. H/J retain the source-detail limitations of their
existing photographs.

## Private delivery and validation

Only a verified administrator session can obtain the source. The material is
excluded from the public subset; unavailable ciphertext omits this single option.
The source is not stored under `public/` or bundled as plaintext client data.

`scripts/mint-gold-pearl-render-smoke.mjs` executes the actual application renderer
through optional native Canvas. It generates all 17 native 1424×1392 layers,
high/mid complete composites and enlarged B/C stitch checks. Every layer must
retain the exact native alpha without exterior spill. Eight prior materials
across two model/part combinations are compared byte-for-byte with a supplied
baseline, including Silver Snake, Gray Lizard and Ivory Ornament.

Light-response checks verify bounded RGB, mint and gold separation, stronger
gold response, darker seam detail and unchanged alpha under varying illumination.
Native Canvas tests are not a logged-in production browser session.
