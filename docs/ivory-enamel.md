# Ivory enamel — private Special catalog

Added 2026-11-13 from the supplied jacket reference (`s1 (1).png`).

- Display name: `IVORY` in the existing enamel color grid.
- Pigment/swatch: `#eee2cc` / RGB 238, 226, 204, a warm cream rather than yellow gold.
- Availability: the existing private Special interface, on B–J for high-cut and B–F/H–J for mid-cut. No mesh, laces, outsole or bead option is added. The public ordinary palette is unchanged. The palette helper and selection guard explicitly reject IVORY for a public audience, so it remains private even if the older public Special subset is enabled again.
- Material: patent/enamel with the native photographic specular highlights, seams and shadows. No metallic map, floral/pattern overlay or generated shoe geometry is used.

## Rendering and compatibility

`renderSolidPatent` extracts the neutral reflected-light component and red diffuse component from the original RED part image, then recolors only the latter. The native 1424×1392 dimensions, every alpha byte and the source position remain unchanged. Neutral highlights and dark neutral seam pixels remain neutral.

`renderGrayPatent` and `loadGrayPatent` remain exported as wrappers with exactly the previous GRAY formula. `SpecialSolidLayers` is now indexed by color and part so GRAY and IVORY can coexist without sharing a cached image. The cache key includes both source URL and color. Only encoded PNG layers are retained.

Draft solids remain separate from the public cart/order color names. A valid RED backing layer is still used. The hidden legacy L layer follows I's selected solid color only under the original D WHITE/BLACK condition; visible L/beads and shoelaces remain separate.

These are fixed-view photographic highlights, not a rotating 3D/PBR material. The jacket supplies the color reference; it does not provide a color-calibrated physical sample.

## Validation

`node scripts/ivory-enamel-render-smoke.mjs <output-dir>` runs the actual renderer through native Canvas, without browser state or production credentials. It verifies all 17 high/mid visible parts, exact source alpha, warm color separation from white, retained shadow/highlight range, unchanged legacy GRAY calculations and distinct per-color caches. It also writes high/mid full-boot previews and a JSON report for inspection.

TypeScript typecheck passed at implementation time. Existing Special selector tests cover per-color overrides and the hidden linkage. Public availability and deployment are verified separately by the integration task.
