# Bronze and pink-gold leather — 2026-10-21

Two independent materials extend the administrator-only Special palette:

| Choice | Supplied reference | Surface interpretation |
| --- | --- | --- |
| BRONZE | `il_fullxfull.4552539556_m8r4.webp` | Deep warm brown/copper bronze, irregular small foil-like leather creases and warm metallic glints |
| PINK GOLD | `JLL0003-MET-PINK_1200x1200.jpg` | Muted blush/rose copper, fine smooth grain and a softer satin metallic sheen |

Both are available on the nine high-cut leather panels and eight mid-cut panels (mid has no G). They use existing pattern selection, compact centered swatches, per-model drafts and image export. Mesh, laces, outsole and beads do not receive these choices; ordinary orders and their available colors are unchanged.

The colored reference-derived texture maps supply the material's own grain and local metallic contrast. Repeat sizes are 380 and 420 native pixels respectively, with the existing independent panel-cut offsets. These sizes are visual estimates, not physical cutting dimensions.

The metallic-lighting revision uses each panel's existing GOLD photograph as a neutral lighting guide: its bright curved reflections and darker turning-away faces now shape the new materials. A 6px bronze / 10px pink-gold blur removes the reference's fine scratches; the supplied bronze creases and pink-gold grain remain the surface texture. A single luminance calibration across all panels preserves relative light levels instead of independently stretching every panel to the same brightness. Shading and warm reflected light are combined in linear RGB, with bronze glints modulated by its existing raised bright grain and a smoother rose-colored reflection for pink gold. A common RGB highlight shoulder above a linear peak of 0.85 compresses the brightest glints together, preserving hue and grain instead of clipping the red channel first.

The GOLD image is used only for light, never for the output silhouette. Its mask differs slightly from RED on several panels, so low-coverage reference samples blend into the existing RED lighting; missing or invalid-size GOLD images also fall back to RED. Output alpha always comes from RED. This is a fixed-view, photograph-guided 2D approximation: it does not reconstruct normals, simulate moving lights, or claim calibrated physically based rendering. No new textures or keys are needed for the lighting revision.

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

The lighting revision was compared against commit `9416323` with the same final JPEG maps. Its 34 renders retained exact RED alpha and 1424×1392 dimensions; no opaque material pixel reached a maximum RGB channel of 254. B/C full-shoe comparisons and B/E close-ups confirmed the photographed reflection direction, two-row B/C seams, lace scallops and visible detail in darker faces. Ten representative unrelated materials remained pixel-identical. Four missing-GOLD cases (both metals on high B / mid E) still rendered with exact alpha. The refreshed production build passed type checking and the same eight UI selections, four JPEG exports, mobile layout and ordinary-mode checks with zero browser errors. Authentication in these UI checks was mocked; production authorization was not bypassed or changed.
