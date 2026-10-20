# B-part black finish samples — 2026-10-20

**Superseded:** the user rejected this matte grain as too coarse. See [B/C finish color samples](bc-finish-color-samples.md) for the current smooth matte/suede, four-color B/C implementation. The description below records the initial prototype only.

The user requested only B-part previews to judge material appearance before expanding to other colors or parts. Administrator Special now offers **MATTE BLACK** (fine-grain matte black leather) and **BLACK SUEDE** (short-nap black suede), in both high and mid models. Existing BLACK remains the patent reference. These are generated concept samples without a supplied real material scan; do not describe them as a validated representation of stock material.

The same B photograph and exact source alpha are used, preserving position, edges and stitching. Both finishes carry fine surface texture and use source red-channel dark detail; no patent specular reflection or BLACK SNAKE sheen is applied. Materials are restricted to B in both UI and selection/renderer validation. All other existing colors, patterns, mesh, laces, public availability and order data remain unchanged.

## Asset paths and access

- `src/lib/special-assets/material-matte-black.enc`
- `src/lib/special-assets/material-matte-black-swatch.enc`
- `src/lib/special-assets/material-black-suede.enc`
- `src/lib/special-assets/material-black-suede-swatch.enc`

768px texture JPEGs and 160px swatch JPEGs are encrypted with the existing server-only SIMULATOR_SPECIAL_PATTERN_KEY. They are delivered only through the existing authenticated, no-store Special assets endpoint. No new key or public plaintext asset was introduced. Existing ordinary cart/order selections do not persist these prototype material names.

## Verification

TypeScript, production build and nine isolated real-session/state smoke checks passed. The local production browser test uses a mocked authenticated materials response and verifies both models: B-only availability, exact native B alpha with no spill, unchanged non-B layer sources, distinct material pixels, switching, model-specific drafts, mobile layout, public-design restoration and logout. Six JPEG exports (patent / matte / suede for each model) were visually reviewed. Matte grain is deliberately visible; suede nap is subtle at whole-shoe scale. Without the hard patent reflection, the panel looks flatter; user acceptance of these visual prototypes is still pending. All four new ciphertext assets were decrypted and byte-compared against the generated JPEG inputs.

## Generation

Built-in image generation was used (not CLI fallback), with no reference photos. Final site assets are the encrypted files above; the original generated swatches remain with the conversation.

### MATTE BLACK prompt

Use case: product-mockup. Asset type: seamless material texture for a black matte leather shoe panel in a customization simulator. Create a perfectly flat, orthographic square filled edge to edge with premium smooth BLACK MATTE full-grain shoe leather. Very fine understated pores and shallow natural irregular micrograin visible at close inspection; low contrast, supple flat leather, not coarse embossed pebbles. Deep neutral black with faint dark charcoal diffuse light, tiny soft grain shading. The surface absorbs light, absolutely no patent gloss, no white reflection patches, no sparkle, no reptile scales, no printed pattern, no textile weave, no fuzz or suede nap. This represents roughly a 15cm x 15cm square of fine shoe leather; grain features should be very small. Even neutral studio illumination, no corner vignette or large gradients. Seamless tileable on every edge. No shoe shape, no seams, no stitching, no folds, no objects, no text, no border. Photographic material swatch. Preserve natural very fine surface detail rather than uniform digital noise. Black leather remains visibly black, not medium gray.

### BLACK SUEDE prompt

Use case: product-mockup. Asset type: seamless black suede leather material texture for a shoe customization simulator. Perfectly flat square orthographic close-up of premium BLACK SUEDE, covering the entire canvas edge to edge. Very short, dense, soft suede nap with fine individual microfibers; subtle brushed nap direction creates irregular softly feathered deep black and dark charcoal areas, with tiny velvet-like diffuse fiber highlights. The fibers are very short and fine, not long hairs. The soft touch and nap must clearly distinguish this from smooth leather while retaining a deep neutral black appearance. This represents about a 15cm square of real fine footwear suede; gentle broad organic variation from brushing, no repeating decorative pattern. No glossy white highlights, no satin shine, no patent coating, no reptile cells, no pebble grain, no woven textile grid, no carpet loops, no coarse felt clumps, no scratches or sharp marks. Even soft diffuse neutral lighting, no vignette or directional shadow gradient; seamless tileable four edges. No shoe, no seams, no folds, no stitching, no objects, no text, no border. Natural detailed product material photography.
