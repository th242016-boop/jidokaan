# Bronze and pink-gold leather — 2026-10-21

Two independent materials extend the administrator-only Special palette:

| Choice | Supplied reference | Surface interpretation |
| --- | --- | --- |
| BRONZE | `il_fullxfull.4552539556_m8r4.webp` | Deep warm brown/copper bronze, irregular small foil-like leather creases and warm metallic glints |
| PINK GOLD | `JLL0003-MET-PINK_1200x1200.jpg` | Muted blush/rose copper, fine smooth grain and a softer satin metallic sheen |

Both are available on the nine high-cut leather panels and eight mid-cut panels (mid has no G). They use existing pattern selection, compact centered swatches, per-model drafts and image export. Mesh, laces, outsole and beads do not receive these choices; ordinary orders and their available colors are unchanged.

The colored reference-derived texture maps supply the material's own grain and local metallic contrast. Broad light from the photographed RED source adds restrained warm sheen without copying the hard patent highlight shapes. The pink-gold light is blurred more broadly than bronze. Repeat sizes are 380 and 420 native pixels respectively, with the existing independent panel-cut offsets. These sizes are visual estimates, not physical cutting dimensions.

Original 1424×1392 alpha masks and panel coordinates are retained exactly. The existing final dense photographed-stitch pass restores the native thread and needle-hole detail, including both B/C rows; it does not draw synthetic seams. The existing H/J source-detail limitation remains unchanged.

Protected JPEG assets follow the existing server-only material convention:

- `src/lib/special-assets/material-bronze.enc`
- `src/lib/special-assets/material-bronze-swatch.enc`
- `src/lib/special-assets/material-pink-gold.enc`
- `src/lib/special-assets/material-pink-gold-swatch.enc`

The server resolves these two materials with a separate `SIMULATOR_SPECIAL_METALLIC_KEY`; the existing material key is unchanged. All four assets must ship with the new catalog entries. Missing metallic-key configuration omits only the new choices, while an invalid individual metallic asset omits only that material. Neither case disables the established 36 materials or changes their existing key/error handling. The maps are reconstructed preview textures, not calibrated stock-color measurements or exact scans. Existing material rendering branches, including the separate gray and brighter white matte/suede treatments, are unchanged.

## Texture creation

The built-in image-generation tool reconstructed flat, reference-derived maps:

- BRONZE: `generated_images/exec-663278ec-ef55-427d-a7d7-0b4eb158a9d1.png`
- PINK GOLD: `generated_images/exec-c0c6288c-d612-4b79-9dcc-f32b83fb2c10.png`

Both prompts requested a photographic, orthographic, repeatable 18×18cm material sample under even diffuse light, without the photographed roll, folds, background, borders or stitches. The bronze prompt specified deep brown/copper-bronze grounding, tightly packed irregular crumpled leather grain and muted gold glints, excluding yellow gold and glitter. The pink-gold prompt specified muted rose-copper/blush coloration, very fine smooth grain and gentle satin metallic flecks, excluding neon pink, coarse bronze creases and patent plastic. Local grain and metallic glints remain in the maps; large photographed lighting gradients are excluded. These are prompt summaries, and the stated physical patch size is an artistic target rather than a measured reference dimension.

## Exact generation prompts

### bronze

Use case: product-mockup. Asset type: square photographic repeating material texture for an existing shoe configurator, material name BRONZE. Input image is the user's material reference only. Produce a flat orthographic unfolded sample matching the metallic bronze leather in the photograph. Deep rich warm brown/copper-bronze grounding, small natural crumpled leather creases and densely interlaced irregular shallow grain with warm bronze and muted golden glints on the fine raised ridges. Preserve this distinctive bronze color and crumpled metallic leather surface, not yellow gold, orange plastic, chunky gravel, crocodile scales, glitter fabric or smooth painted metal. Show an approximately 18x18cm patch at normal footwear-material scale, with fine closely packed irregular grain, not oversized dramatic wrinkles. Even diffuse studio illumination; local metallic glints remain, but no global light gradient, no hard white glare or black shadow regions. Tileable edge-to-edge: fill the whole square with only this leather, equal visual grain scale throughout. No diagonal roll, folds, edges, white background, objects, seams, stitches, lettering or watermark. Photorealistic natural leather with a metallic foil finish, detailed yet restrained.

### pink-gold

Use case: product-mockup. Asset type: square photographic repeating material texture for an existing shoe configurator, material name PINK GOLD. Input image is the user's material reference only. Produce a flat orthographic unfolded sample closely matching the reference's muted rose-copper / blush pink-gold metallic leather. Match the fine very smooth shallow leather grain, tiny densely distributed metallic flecks and softly lustrous satin sheen. Pink-gold is a subdued warm dusty rose/copper metallic, NOT neon pink, magenta, orange gold, gray silver, coarse crumpled bronze leather, glitter chunks, sparkly fabric or patent plastic. Show an approximately 18x18cm patch of the actual fine-grain surface at normal footwear-material scale, no enlarged pores. Uniform soft diffuse studio lighting with restrained microscopic metallic glints; no global light gradient or diagonal highlight stripe. Tileable edge-to-edge, consistent color and grain across whole square. Fill the entire image with only the leather material. No folded roll, creases, seam, stitches, border, floor, other objects, lettering or watermark. Photorealistic, delicate smooth rose-gold leather with a gentle metallic finish.

## Verification

TypeScript and the Node production build passed. All four encrypted assets round-trip to the packaged 768px/160px JPEG bytes. The isolated session suite passed 12 checks; a separate synthetic-key loader test confirmed missing/invalid-key and per-material corruption isolation. A local production UI test using mocked authentication and the final JPEG maps checked 34 native renders across 17 panels, exact alpha and dimensions, B/C stitch detail, eight independent UI selections, four JPEG exports, compact mobile labels and ordinary-mode exclusion with no browser errors. Ten representative pre-existing renders, including the four white/gray finishes, matched the previous renderer pixel-for-pixel. This is local authenticated-response simulation, not a live customer/admin session.
