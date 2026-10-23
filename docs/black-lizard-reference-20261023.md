# Black LIZARD reference correction — 2026-10-23

> Superseded visually by the second correction in `black-lizard-plates-20261023.md`.
> The owner rejected this first release: its cells looked like rounded pebbles,
> and broad reflected light on the black faces was too weak. The checks below
> established technical compatibility, not acceptance of the material likeness.

## Scope

Only the existing `BLACK SNAKE` saved-material ID (displayed as **BLACK LIZARD**) changes. Applies to high and mid leather panels in both the released and administrator catalogs. White and all seven colored lizards retain their previous shared source and rendering. No catalog visibility, mesh, laces, bead, order, account or database changes.

The owner's reference is `KakaoTalk_20260918_163433723(4).png`: a black boot with a blue logo, compact diagonal embossed scales, smooth dark faces and narrow directional rim highlights. The former source had coarse polygonal scales and excessive grain; its black transfer also lifted the entire material toward gray.

## Material and rendering

- New independent texture and swatch: `material-black-lizard-20261023.enc` and `material-black-lizard-20261023-swatch.enc`.
- Independent server variable: `SIMULATOR_BLACK_LIZARD_20261023_KEY`. AES-256-GCM; never import plaintext keys or assets into a client bundle. Existing reference keys remain untouched.
- Server tries the new black pair first, then the previous reference/legacy source if either file or the key is unavailable. Other materials bypass this branch.
- Black uses identity luminance transfer, so black faces stay dark. Broad GOLD-derived shape lighting uses blur 12, floor 0.46, peak 1.22, sheen 0.012.
- Black mapping preserves the source's orientation and repeats it without mirroring its baked upper-left rim light. Native tile span is 360 pixels; panel cut offsets stay independent.
- Original RED alpha, placement and dense stitch overlay are preserved, including the double B/C rows.

This is a photographic-style generated texture with baked fine highlights and separate broad shoe shading, not measured physical scale geometry or a 3D reconstruction. The visual reference is not a flat scan; exact cell-for-cell reproduction is not claimed. Only black is released for the owner's assessment before any other color is changed.

## Asset provenance

Created and refined with the built-in image-generation tool using the owner's boot reference. The final edit used the intermediate organic scale texture plus the boot image, specifically requesting smooth faces instead of coarse grain. Browser Canvas was used only to package the generated image as 1024px JPEG texture and 192px JPEG swatch.

Final generation identifier: `exec-a23c7187-b058-4b29-b53a-0de65484e28e.png`.

Final edit prompt:

> Edit the FIRST texture to match the smoothness of the black scale leather on the SECOND boot photo. Preserve first texture's scale count, layout, sizes and diagonal interlocking scale boundaries. Crucial edit: REMOVE ALL grain, pores, wrinkles, ridges and pebble stipple INSIDE every scale. Every scale face should be almost perfectly smooth satin black like the smooth leather on the second boot photo, with a broad soft very subtle charcoal reflection across the face and a thin silver-gray directional bevel highlight on upper-left edge. Smooth leather emboss, absolutely no coarse granularity or crunchy scratchy highlights. The face dark, thin grooves black. Do not convert it into a regular geometric grid or quilted padding. Only make the faces smooth and highlights soft like the reference photo. Return only one square flat seamless texture, material fills the image, same small scales, uniform global exposure. Opposite edges repeat seamlessly. No shoe or text.

Plaintext JPEG SHA-256 (for live response verification):

- Texture: `9d741496f87d9a847e581c20fedcd624df78834a045c858c3d11d431701e8664` (273010 bytes).
- Swatch: `266e2d9fd6c4f5fab36950ba4dc42f6ab6831f3bc1156fb3bd2bb5a042c0fd67` (24092 bytes).

## Validation

- TypeScript check and production node-server build passed.
- Isolated catalog smoke: public 45 references / 11 sources; admin/public and high/mid parity; black independent; white and seven colored lizards still share their old source. Missing, invalid and corrupted black key/assets safely fall back. Private materials stay private.
- Native browser rendering: all 17 high/mid leather layers remain 1424×1392; alpha equals original RED pixel-for-pixel, with zero spill outside the mask.
- B/C double stitch rows inspected in enlarged crops.
- All 44 unrelated public asset objects unchanged. WHITE/RED/NAVY LIZARD, FLOWER B, BRONZE and SILVER WEAVE rendered byte-identically against the prechange implementation.
- Real local customer UI: both models, BLACK LIZARD selection, WHITE-to-BLACK switching, swatches and JPEG export passed with no page errors.

Deployment verification must compare the live black texture/swatch against the hashes above, compare all other assets against the predeployment payload, check administrator rejection without credentials and inspect the actual deployed simulator.
