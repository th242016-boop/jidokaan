# Material stitching and compact Special palette

The user reported missing stitching on matte/suede, BLACK SNAKE and FLOWER B/C. B/C require the original paired seam tracks. FLOWER A is a separate supplied image set and remains unchanged.

## Stitch restoration

`src/lib/material-stitches.ts` reads the existing full native white photograph for each model. A local luminance residual against a 2px blur isolates real thread rims and needle holes. It is applied after the material mapping, with a small noise threshold and bounded additive contrast so that dark materials retain visible detail.

The RED layer remains the sole alpha source. The postpass never writes alpha, moves an edge, changes the material layout or draws synthetic stitches. B/C use feathered selection corridors along their photographed seams, intersected with a narrow interior alpha-distance band. Both tracks remain where they occur in the original photograph; C's outer track is much finer than B's. No stitches are invented on B's long sole edge or C's triangular occlusion edges. Other patterned panels use a narrow interior band to recover existing detail; H/J are skipped because the source has no resolvable thread detail there.

The same pass serves all eight matte/suede finishes on B/C and FLOWER B, FLOWER C and BLACK SNAKE on their existing available panels. Source pixels are cached by model; generated material layers retain the existing weak asset cache and logout behavior.

On FLOWER B/C, an additive residual alone was still hidden by dense crackle and leaf motifs. Only the original residual-selected thread pixels receive an ivory rim / warm dark hole blend, capped below full replacement and feathered by the same seam band. This keeps the thread visible across printed color changes without recoloring the surrounding leather. Other materials keep the bounded additive pass.

This restores photographed contrast, not a new physical thread color. Same-black stitching remains subtler against dark reptile embossing than on plain matte leather. The original source resolution limits the smallest stitch detail.

## Palette

Special mode uses ten columns on mobile and eight on desktop, versus the unchanged ordinary five/four. This approximately halves each square's width and height, with centered wrapping labels and cover-filled material swatches. It also applies to Special mesh and shoelaces. All selection handlers are retained.

## Verification

`scripts/special-finishes-browser-smoke.mjs` covers both models, B/C × eight finishes, exact native alpha, color identity, independent selections, exports, drafts, public-mode restoration and logout. It measures Special/ordinary button widths (ratio 0.42–0.58) on desktop and mobile and checks long-label placement.

`scripts/material-stitches-browser-smoke.mjs` exports native images and four-times B/C seam crops, measures both seam neighborhoods, and checks exact source alpha/no spill for the three patterned materials on both models. Numerical contrast alone is not a two-row visual proof; the original and output seam crops must also be inspected. Tests run against the local production build with actual material fixtures and a mocked authenticated asset response, not a real administrator session.
