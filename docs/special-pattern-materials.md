# Special material references — 2026-10-20

Administrator Special now includes FLOWER B, FLOWER C and BLACK SNAKE for high B–J and mid B/C/D/E/F/H/I/J. The first two supplied photos show finished floral shoes; the third shows black embossed snake leather. Their surface patterns were reconstructed with the built-in image generation tool and visually reviewed against the references. They are approximate material previews, not exact scans, manufacturing layouts, or a guarantee of physical motif size or placement.

| Material | Reference | Stored server asset |
| --- | --- | --- |
| FLOWER B | KakaoTalk_20260106_205344708_02(1).jpg | src/lib/special-assets/material-flower-b.enc |
| FLOWER C | KakaoTalk_20260113_162911832_01.jpg | src/lib/special-assets/material-flower-c.enc |
| BLACK SNAKE | Revised against 20260930_162645.jpg and 20260930_172610.jpg | src/lib/special-assets/material-black-snake.enc |

Each texture has a companion `-swatch.enc` asset. The 768px JPEG textures and 160px JPEG swatches are AES-256-GCM encrypted with the new server-only `SIMULATOR_SPECIAL_PATTERN_KEY` (32 random bytes, base64). Never commit or expose this key or decrypted assets in public/. Existing FLOWER A ciphertext and key remain unchanged. Missing new key returns no new materials while retaining the existing Special studio. Each assets request checks the real administrator session and is no-store.

The browser maps texture pixels into existing RED source alpha at native 1424×1392 coordinates. The source dark details provide seam/stitch shading. Existing broad enamel highlights are not transferred; the textures retain their own material appearance. Motif scale is a reviewed visual approximation. Mirrored sampling and a small continuous warp cover all parts without unfilled pixels. The material names and selections are separate from ordinary cart/order colors, and choosing ordinary color, GRAY or FLOWER A clears the pattern choice. Mesh, laces and outsole remain independent. Hidden L keeps ordinary linkage and receives no new pattern override.

The generated original images remain with the originating conversation. The site consumes only the six encrypted, repo-owned assets. Built-in generation was used; no image-generation API key or CLI fallback was used.

## Prompts used

Verification: TypeScript and production build passed. Nine isolated real-session
authorization/state checks passed. The local production browser test exercised
all 51 material/model/part combinations, native E alpha with no outside pixels,
FLOWER A/GRAY/ordinary selection changes, model draft isolation, mobile layout,
logout and six actual JPEG exports. Screenshots and exported compositions were
reviewed visually. The test uses a protected floral fixture; it does not log in
to the live administrator account. All six new encrypted assets were decrypted
locally and byte-compared with their exact JPEG inputs before publication.

### flower-b

Use case: product-mockup. Asset type: flat seamless leather material texture for a shoe customization app. Reference image shows the real shoe using the target material. Extract and reconstruct ONLY its patterned leather into a square edge-to-edge swatch, photographed perfectly front-on flat under even light. Faithfully match the leather: pale silver/white ground, very fine irregular silver metallic crackle web with tiny polygon cells over scattered watercolor-like dark navy, burgundy, light pink, cyan, yellow, muted green floral petals/leaves. This is the exact busy multicolor silver crackle leather seen on toe and ankle trim. Preserve fine grain and subtle silver glints, NOT a smooth patent highlight. Show about 8-12 small flower/petal clusters across the width, with irregular distribution; the crackle cells much smaller than flowers. Seamless repeatable texture, no shoe shape, no seams, no laces, no mesh, no gold trim, no background, no text, no margin. Full square filled with material, high-detail natural photographic texture, no perspective, no large lighting gradient.

### flower-c

Use case: product-mockup. Asset type: flat seamless leather material texture for shoe customization. Reference image shows the real target leather on the shoe. Extract and reconstruct ONLY this floral botanical material into a square edge-to-edge flat orthographic swatch under even soft light. Faithfully preserve white lightly pebbled leather ground, large olive/forest green elongated leaves with pale green veins and subtle embroidered-looking printed line texture, warm rust orange/brown flowers and small round ochre brown flower heads with dark fine outlines; winding dark green stems. Match the specific green/brown/white botanical character and coarse motif size of the toe and ankle strip in reference. About 4-5 main leaf/flower groups across width, spread organically. This is softly textured leather, not polished patent enamel, no broad white reflections. Seamless repeatable texture. No shoe, no mesh, no laces, no seams, no gold panels, no background, no text, no borders. Fill every pixel with flat material.

### BLACK SNAKE revision — real shoe references, 2026-10-20

The user supplied `20260930_162645.jpg` and `20260930_172610.jpg` to correct the initial material. The old material had thick, domed scale cells and strong individual edge glints. The replacement has flatter, shallow rounded rectangular/polygonal embossing and a quieter surface. Only the two BLACK SNAKE encrypted assets were replaced, using the existing server key. FLOWER A/B/C and ordinary color assets are unchanged.

BLACK SNAKE alone now receives a restrained neutral reflection derived from the source photograph, blurred by 18 native pixels and capped at 60 channel levels. This softens the old hard enamel reflection while restoring the continuous satin sheen visible on the real shoes. Every output alpha byte still comes from the original source, including lace holes; motif size remains an approximation and the existing tile size is retained. This is an updated photographic reconstruction, not an exact material scan.

Built-in image generation was used, with both real shoe photographs as references. The final project assets remain `src/lib/special-assets/material-black-snake.enc` and `src/lib/special-assets/material-black-snake-swatch.enc`.

Revision prompt:

Use case: product-mockup. Asset type: seamless square flat leather material texture for the BLACK SNAKE option in a shoe configurator. The two supplied photographs are the exact target material reference; reproduce only the black embossed leather used on their toe surround and lace eyestay. Create a flat orthographic edge-to-edge swatch of that SAME leather, not a shoe. Crucial visual correction: the reference is smooth, flat black leather with very LOW shallow embossing, irregular rounded rectangular / gently hexagonal small scales arranged in staggered near-horizontal rows. The scales lie almost flush in a single surface; narrow fine incised dark outlines, softly worn edges. Scale faces have very fine smooth leather pores, NOT coarse wrinkles or pebbles. Deep neutral black, with restrained dark graphite satin/semi-gloss sheen across flat scale faces under soft light. Fine subtle pale edge glints only in places, no white outlining of every cell. About 21-24 small scale cells across the full square, sizes vary moderately organically, roughly as wide as tall, some horizontally stretched, no large center belly plates. Match the reference's smooth black continuous leather appearance, much flatter and less knobbly than generic snakeskin. Uniform diffuse illumination suitable for a repeat texture, no broad white highlights baked in, no directional lighting gradient. Seamless/tileable four edges. Do not show gravel, cobblestones, domed bumps, thick raised scale rims, deep crevices, diagonal diamond lattice, scales sticking out, crocodile armor, fabric mesh, laces, stitch lines, gold/blue markings, hands, shoe shapes, background, text or border. Entire square filled with the material; natural photographic detail.

### black-snake — initial version, superseded above

Use case: product-mockup. Asset type: flat seamless black embossed snakeskin leather texture for shoe configurator. Use reference photograph solely to faithfully reproduce the BLACK SCALE LEATHER on its toe/ankle/lace surround. Create a perfectly front-on flat square swatch entirely filled with that leather: deep charcoal-black irregular slightly elongated rounded polygon snake scales, subtly raised domed cells and narrow darker recessed outlines; restrained silver-gray highlights on upper edges; slight satin gloss, visible fine leather micrograin. Match reference scale shape and dark tonal balance, no crocodile huge plates, no diamonds, no colorful reptile. Around 25-30 small scales across width, varying naturally in size, seamless on all four edges. Even illumination, no large bright reflection or shadow gradient. No shoe silhouette, no laces, no fabric mesh, no stitching, no blue logo, no white border, no text. Only full-bleed flat black snakeskin leather.
