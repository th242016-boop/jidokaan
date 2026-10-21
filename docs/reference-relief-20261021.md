# Reference-based lizard and silver-weave relief — 2026-10-21

The owner supplied finished-shoe references showing raised lizard cells and distinct silver/dark woven bars. The previous flat, scratched lizard map could not reproduce that relief by raising contrast alone. This update uses new reference-derived material maps, while retaining the native photograph geometry.

## Rendering

- All nine lizard choices now share one raised-scale map. Legacy `BLACK SNAKE` and `WHITE SNAKE` IDs remain for selection compatibility; displayed names remain BLACK/WHITE LIZARD.
- Black midtones are opened while deep grooves remain dark. White fields retain recessed scale boundaries instead of the earlier very narrow luminance range. Seven dyed colors retain both dark cell shading and neutral bright rims. Swatches and shoe layers use the same transfer for all nine.
- Lizard repeat is 360 native pixels; independent panel offsets remain. This is an approximate visual scale inferred from the finished-shoe reference, not a measured cutting template.
- SILVER WEAVE uses flattened silver tabs over dark ribbons, with photo lighting that preserves both tones. Its 294-pixel repeat remains.
- Both new camouflage descriptors use a 250-pixel repeat and a broad low-sheen photographic light response.
- RED native photos remain the sole alpha source. GOLD guides broad curvature light. All these materials use photographed stitch restoration, including the existing two rows on B/C. No new shape masks or drawn stitch lines were introduced.

## Asset generation

Built-in image generation was used with each supplied shoe as a material reference. Only flat texture maps were generated; shoe images and silhouettes were not regenerated.

- Lizard original: `generated_images/exec-58beb589-a7ae-4ac3-92ce-4908b5d30665.png`
- Silver weave original: `generated_images/exec-fafcca1f-f0ed-436c-9b38-8161bb72a766.png`

The serving assets are derived JPEG texture/swatch pairs packaged separately in protected asset storage. These reference-derived maps are visual approximations, not scanned manufacturing material.

### Lizard prompt

Create a square flat material texture map ONLY, derived from the BLACK LIZARD LEATHER covering the toe, lace surround and ankle cuff of this reference shoe. The shoe is a material reference, do NOT reproduce the shoe. Fill the whole square edge to edge with black embossed reptile/lizard leather. Match reference: irregular tightly packed rounded polygonal scales, subtly domed smooth satin-black centers, narrow deep dark crevices with very crisp silver-gray highlights along the upper-left raised rims and soft darker lower-right sides. Around 16 scales across, irregular sizes and orientations, slightly elongated compact cells. Smooth polished leather with very fine inconspicuous skin grain, NOT coarse wrinkles, scratches, cracked paint or flat vein network. Orthographic top-down scan, even exposure over the entire tile with no large shadow or spotlight, but preserve the small local embossing light at each scale. Black cell centers visibly readable dark charcoal rather than crushed pure black. Approximately 20-80 sRGB in most centers and gray rim highlights up to 180. Suitable for repeat mapping, no strong band or diagonal seam, no border, no text, no shoe, no laces, no stitching. No color.

### Silver weave prompt

Generate a square flat material texture map only, faithfully matching the SILVER WEAVE surface visible on the toe, ankle cuff and lacing surround of the supplied reference shoe. Do NOT reproduce the shoe. Edge-to-edge orthographic macro scan of a silver-gray diagonal wave weave: alternating dark charcoal horizontal flattened leather strands with bright cool silver oblong rectangular small tabs arranged in stepped diagonal wave/chevron bands, short vertical silver bars grouped in twos and threes, varying slightly naturally. About 6 wave bands across the full square. The bright bars are thin flattened metallic leather tabs with rounded corners, narrow dark recesses and subtle edge relief, not puffy white pillows or beads. Cool silver/dark slate contrast must remain distinct. Satin metallic gleam with gentle localized highlights and minute leather grain; no noisy glitter. Entire square equally exposed, no large-scale spotlight or vignette, preserving local relief illumination from upper left. Pattern continues seamlessly to the edges for fabric-like tiling, no borders, no text, no shoe, no stitching, no transparent areas. Keep the distinctive graphic silver bar and dark horizontal weave geometry from the reference, do not substitute herringbone chevrons or generic basketweave.

## Focused validation

A local isolated server and source-injected production renderer used the exact newly packaged JPEG assets. All 12 affected materials (nine lizards, silver weave, two camouflage) were rendered on high B/C and mid E/H: 48 outputs retained exact 1424×1392 dimensions and source alpha, with no pixels outside the source. All nine lizard swatches matched the shared pixel transfer byte-for-byte using the same CPU Canvas decode path.

The contact sheet and four complete high-shoe compositions (black, navy, white lizard and silver weave) were visually inspected at shoe scale. Individual raised cells remain visible in dark colors. This is local rendering verification, not an authenticated live-site check.

Both camouflage materials were also reviewed as complete high- and mid-cut shoe compositions, including D. Native white mesh/laces and independent panel cuts remain visible.

## Protected asset packaging and release gate

The four new material maps are encoded as 768-pixel JPEG textures with 160-pixel swatches at quality 0.94. Their eight AES-256-GCM files are under `src/lib/special-assets/material-reference-lizard*`, `material-reference-silver-weave*`, `material-gray-camo*`, and `material-woodland-camo*`. Every encrypted file was decrypted and compared byte-for-byte during packaging. Plaintext sources and encryption keys must not be committed to this public repository.

The server reads `SIMULATOR_REFERENCE_MATERIALS_20261021_KEY` (a base64-encoded 32-byte key) for these files. Existing key names remain unchanged. If this independent key is missing or invalid, existing lizard/weave materials retain their previous source and new camouflage entries are omitted. Each failed material is isolated from the rest of the catalog.

Configure this key on the existing Railway `jidokaan` production service before deploying this change. At preparation time the Railway connector's variable read/write operations returned `Invalid key length`; the value was not configured and no production deployment was performed. A successful key update, deployment of the reviewed commit, and live catalog checks are still required. The missing-key fallback is resilience behavior, not acceptance of the visual update.
