# Special material expansion and public AQUA — 2026-10-20

## Available choices

Matte and suede each offer exactly RED, ORANGE, YELLOW, GREEN, BLUE, NAVY,
PURPLE, KHAKI, PINK, WHITE and BLACK. Both families are available on all leather
panels: B–J for high-cut, and B–J except G for mid-cut. Mesh A, shoelaces,
outsole K and the hidden linked line are not leather-material targets.

The existing neutral matte/suede assets and shading are reused. The final
`material-stitches.ts` pass still restores original photographed thread and
needle-hole detail, including the paired B/C tracks. Native RED alpha remains
unchanged. H/J retain their source edge detail; no synthetic stitch rows are
invented where the original photograph has no resolvable threads.

WHITE SNAKE shares BLACK SNAKE's embossed scale topology. A monotonic gray-to-white
transfer preserves the raised/recessed relationship, followed by broad shape
light and the same stitch pass. Its swatch uses the matching linear transfer.
The server aliases it to the existing encrypted snake asset. No new keys or
authentication changes are required.

AQUA (#16a3b4) follows MINT in the ordinary palette. It is available on both
models through native-size PNGs: ten high-cut layers including the hidden linked
line, plus mid-cut E/F/H. The other mid-cut panels reuse the high-cut files.
The RGB recolor preserves the existing RED alpha, seam detail and neutral gloss.
The reference is upload/20261020_160125.jpg; this is a visual color estimate,
not a calibrated physical color measurement.

## Independent L beads

In administrator Special mode, high-cut has a new visible `L · 비즈` group:
NONE, GOLD, SILVER, RED, ORANGE, YELLOW, GREEN, BLUE, NAVY and PURPLE.
The fine irregular glitter treatment follows upload/20261020_160413.jpg.

`createBeadMask()` extracts the already disconnected upper-shaft component from
the existing A alpha. The native 1424×1392 mask contains 41,907 pixels, with
bounding box [548,155,802,462). It is neither retraced nor expanded. The renderer
only changes RGB inside this mask and uses broad lighting from the white source;
the photographed mesh lattice is not reused as surface texture.

Beads are composed inside A after mesh/lace coloring and before E/F/G/H are
drawn, so the surrounding leather edges and stitches keep their original layer
order. The optional `SpecialDraft.beads` field is independent of mesh, laces and
`names.l` (the legacy hidden line). NONE restores the selected mesh material.
Swatches use the same facet shader as the shoe. Saved Special previews use the
same composed layer as the screen.

Mid-cut has no G separator and no corresponding closed upper window: its A
component connects to the lower mesh. This release intentionally offers beads
only on high-cut instead of inventing a mid-cut boundary. Other new materials
and AQUA work on both models. Public mode never exposes the bead controls.

## Verification

`scripts/simulator-special-smoke.mjs` checks the exact color families, all leather
panel availability, AQUA order validation and assets, and independent bead state.
`scripts/material-expansion-browser-smoke.mjs` exercises the production build
with real protected-material fixtures and a mocked authenticated asset response.
It covers material colors and panels on both models, exact alpha/no spill, bead
selection boundaries, independent mesh/laces, drafts, export, public restoration,
logout and compact desktop/mobile controls. This is not a real live admin login.

The 13 AQUA PNGs and all nine bead colors were also checked pixel by pixel:
alpha differences and changes outside their intended regions are zero.
TypeScript and production build passed. The isolated suite passed 11 checks;
the browser suite passed 112 native render comparisons, nine bead colors,
12 JPEG exports and desktop/mobile state checks with zero browser errors.
Changing mesh/laces left all 41,907 bead pixels unchanged, and NONE restored
the prior A layer exactly. Representative full shoes and B/C stitch crops were
visually reviewed after the numerical checks.
The surface previews remain photographic approximations, not physical material
measurements or production cutting patterns.
