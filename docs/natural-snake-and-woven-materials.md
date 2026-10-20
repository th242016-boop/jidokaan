# Natural snake and monochrome materials — 2026-10-20

The user supplied a gray/ivory python-pattern leather and a photograph of dyed
stock, then requested two further monochrome materials. This extends the existing
administrator Special configurator. The initial release left ordinary colors
and existing materials unchanged; the later panel-placement update is noted below.

## Choices and source references

| Choice | Source / interpretation |
| --- | --- |
| NATURAL SNAKE | `20260909_141838.jpg`: mottled charcoal/ivory scales |
| HOT PINK SNAKE | `20260909_141924.jpg`: deep pink/magenta stock |
| ORANGE SNAKE | Same stock photograph: orange |
| SKY BLUE SNAKE | Same stock photograph: cyan/sky blue |
| GREEN SNAKE | Same stock photograph: green |
| YELLOW SNAKE | Same stock photograph: yellow |
| SILVER WEAVE | `20260909_141701(3).jpg`: raised ivory segments and silver/charcoal zigzag strips |
| MICRO HOUNDSTOOTH | `20260909_141619.jpg`: fine black/white houndstooth printed leather |

All eight choices apply to high-cut B–J and mid-cut B–J except G. Mesh A,
shoelaces, outsole K, independent bead L and the legacy hidden line retain their
existing behavior. Existing BLACK SNAKE and WHITE SNAKE are separate materials.

## Rendering and protection

`src/lib/snake-materials.ts` defines the six python colorways. All share one
neutral scale/mottle map. The five dyes preserve near-charcoal markings and
transfer their base color to the lighter scale fields with a smooth luminance
transition. `recolorSnakePixels()` serves both the preview texture and small
button swatch, avoiding inconsistent CSS-only tinting. Swatch promises are
cached by asset identity and discarded from the UI on model changes/logout.

The original native RED layer remains the only alpha source. New materials use
restrained broad reflected light instead of copying the sharp patent highlights.
The existing final dense stitch restoration uses photographed needle holes and
thread detail, including the paired B/C rows; it does not synthesize new seams.
Both native silhouettes and lace openings remain unchanged. The existing H/J
source limitation (no resolvable thread detail) still applies.

The micro houndstooth map uses a 220-native-pixel repeat after visual comparison
against the photographed finger/print proportions; the initial 480px repeat was
too large. Long material labels wrap within the existing compact centered
buttons, including MICRO HOUNDSTOOTH on mobile.

### Later adjustment: independent panel cuts

At the user's request, all generated printed/embossed patterns now use fixed,
different texture origins for each leather panel B–J. B retains its original
origin; C/D and the other panels sample separate portions of the same material,
without rotating the grain or changing the physical silhouettes. This prevents
the artificial continuous print across adjacent seams while keeping repeat
selection, model switching and image export deterministic. FLOWER A's supplied
layers and matte/suede rendering are unchanged. The SILVER WEAVE repeat is now
294px instead of 420px: each motif's linear dimensions are 30% smaller.
Source alpha and the photographed stitch-restoration pass remain unchanged.

Textures are protected server-only assets under `src/lib/special-assets/`:

- `material-natural-snake.enc` and `material-natural-snake-swatch.enc`
- `material-silver-weave.enc` and `material-silver-weave-swatch.enc`
- `material-micro-houndstooth.enc` and `material-micro-houndstooth-swatch.enc`

Each source is a 768px JPEG with a 160px swatch, AES-256-GCM encoded using the
existing material key. All six python names alias the same protected source.
No environment variable, new key, public plaintext asset, or admin authorization
rule was changed. Encryption round trips were verified against the JPEG bytes;
the reused key also successfully authenticated the existing BLACK SNAKE asset.

## Asset creation

The built-in image-generation tool created flat texture maps from the supplied
references. The original generated maps remain at:

- `generated_images/exec-32b6ed8b-e546-43ed-974e-3679e878db81.png` — natural snake
- `generated_images/exec-42594a72-90d5-48b8-ae85-5a9adfe4fe8a.png` — silver weave
- `generated_images/exec-d19e1f46-c353-421f-b889-6b5520f5114b.png` — micro houndstooth

These are reconstructed visual texture samples, not exact scans, calibrated
stock-color measurements or manufacturing cutting layouts. Repeat sizes are
visual estimates from the photographs; no precise physical scale was supplied.

### Natural snake generation prompt

Use case: product-mockup. Asset type: square photorealistic repeatable natural python-pattern leather albedo texture for a footwear configurator. Input image is the user's real material reference, NOT an edit target. Generate a flat top-down unfolded sample matching the actual leather in the lower uncovered central portion: small overlapping rounded diamond/oval scales arranged in diagonal rows, irregular charcoal-gray and ivory/cream mottled python markings organized into broken dark diamond bands. The pattern is a printed/embossed leather, not a living snake. Preserve the reference's distinctive uneven gray/cream patch distribution across individual scales; do not replace it with uniform crocodile rectangles, a regular checkerboard, black-on-black embossing, or a decorative gold grid. Show approximately 15cm by15cm of flat material, roughly 25-35small scales across, edge-to-edge and repeatable. Pale fields are offwhite gray-ivory luminance180-235, dark mottled patches charcoal luminance30-90, intermediates100-170. Very shallow embossed scale rims with a restrained satin sheen, even diffuse illumination. No hard glare: this is a material map with soft local relief only, no overall gradient, vignette, folds, roll, plastic packaging, hand, finger, floor, labels, letters or objects. Fill the entire square with only the leather surface. Create a high-quality square texture.

### Silver weave generation prompt

Use case: product-mockup. Asset type: flat square photographic leather material texture for a shoe configurator, named SILVER WEAVE. Input image is a material reference only. Reproduce the distinctive uncovered lower central material in the user's photograph as a flat top-down sample. Dense geometric interlocking diagonal zigzag bands composed of little raised ivory-white rounded rectangular stitches/segments alternating with flat dark charcoal strips; the charcoal strips have subtle fine parallel metallic-silver striations along their length. It resembles a herringbone/basket-weave embossing, not real loose yarn or woven clothing. Match the reference's broken step-like chevron repeats, chunky short pale segments, charcoal-gray grounding, silver-gray shallow relief and modest satin shine. Show an approximately18x18cm material patch with many repeats; pale segments each about2mmwide. Repeatable edge-to-edge composition, consistent motif scale and density, evenly diffuse lit. Fill full square with only the material. No plastic cover, glare streaks, fold, roll, hand, background, objects, text, watermark, stitches along a shoe border or shoes. Do not turn this into a checkerboard, houndstooth or snakeskin. Preserve ivory/white vs charcoal contrast with natural shallow relief.

### Micro houndstooth generation prompt

Use case: product-mockup. Asset type: square photorealistic printed leather material map for a footwear configurator, named MICRO HOUNDSTOOTH. Input photo is reference for the uncovered leather only. Create a flat orthographic unfolded sample of the exact tiny black and offwhite houndstooth pattern on smooth lightly coated leather shown in the reference. A crisp orderly tessellation of small jagged four-point black/white houndstooth checks (pied-de-poule), consistent geometry and spacing across the whole square. Very fine repeated scale: approximately70-90 motifs across a square20cm sample. Strong clean black/offwhite contrast, subtly embossed/printed leather surface, very restrained satin sheen under even diffuse light. This is not woven wool fabric, not broad plaid, not checkerboard, not zebra. Show the material edge-to-edge, repeatable, with no perspective, no curved roll, no creases, no seams, no packaging, no plastic shine, no finger/hand, no labels, no background, no text. Avoid overall gradients, mottled shadow patches, moire, blurry shapes, large checks. Preserve actual recognizable tiny houndstooth pattern and smooth leather finish.

## Verification

`scripts/simulator-special-smoke.mjs` checks the 34-pattern catalog, all-part
availability, ordinary-order exclusion, per-model state, dye tonal ordering and
protected source aliasing. `scripts/natural-snake-browser-smoke.mjs` uses actual
material fixtures with a mocked admin response against the production build.
It checks all eight new materials on both models, exact alpha/no spill,
independent layers, swatch/color agreement, native B/C seam crops, JPEG export
composition, drafts, compact mobile labels, logout and ordinary-mode restoration.
This local test does not represent an actual logged-in production admin session.

TypeScript and the final production build passed. The isolated suite passed
12 checks. Final browser evidence combines 136 unique native renderings and
16 JPEG exports: alpha differences and exterior spill were zero in every case;
maximum swatch/render hue difference was 1.285 degrees and maximum JPEG versus
displayed-composition mean error was 1.942/255. All eight mobile labels fit,
model drafts were restored, logout returned to the unchanged ordinary designs,
and no browser errors or unintended external requests occurred. The eight
legacy BLACK/WHITE SNAKE B/C images matched prior verified outputs pixel for pixel
at the initial release. The later independent-cut update intentionally changes
pattern placement on C and the other offset panels, including those snake choices.

Full-shoe previews and B/C seam crops were visually inspected. The original
coarser houndstooth rendering was superseded and rechecked after the 220px scale
adjustment. Tests retain brightness-region means as descriptive evidence only:
printed dark cells can naturally be darker in a lit area than pale cells in a
shaded area, so those means alone cannot validate surface lighting or stitch rows.
