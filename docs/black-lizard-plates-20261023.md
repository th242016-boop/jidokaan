# Black LIZARD — elongated scale plates and reflected light

## Problem and scope

The owner rejected the first 2026-10-23 black release. Compared directly with
`KakaoTalk_20260918_163433723(4).png`, the old texture had separate, inflated oval
cells resembling pebbles. Its faces stayed almost black while only the edges
caught light. The old reflection was multiplied by near-black texture brightness
and a sheen of 0.012, so the broad shoe light guide had almost no visible effect.

Only saved ID `BLACK SNAKE` (display label **BLACK LIZARD**) changes. High and mid
models use the same correction; RED silhouettes, panel placement, lace holes and
dense stitches are retained, including the two B/C stitch rows. Other lizard
colors, materials, catalogs, access control and ordering behavior are unchanged.

## Correction

- A new independent generated texture has shallow, elongated interlocking scale
  plates, varied lengths and less uniformly rounded edges. It replaces the
  rejected smooth inflated cells.
- Black uses a dense, wide-field material atlas with a native span of at least
  820 px. Each panel is cut once from inside that atlas: no repetition, hard tile
  seams, mirrored V joins or blending of unrelated scale faces. The cut includes
  the full alpha extent and curvature-warp margin. Existing independent panel
  offsets choose different crops inside the available area. The source is
  prefiltered to its projected resolution to avoid aliasing of fine grain.
- The broad reflection comes from the original GOLD photograph's neutral light
  guide. Black uses blur 16, floor 0.34, peak 1.10 and sheen 0.16. Reflection is
  independent of the black diffuse albedo, with a smooth dark-joint gate and
  scale-face response. Light exponent is 1.05. Dark regions stay black while lit
  faces develop broad charcoal/silver reflections. Nonblack math is unchanged.
- Black luminance transfer is unchanged (identity); the entire texture is not
  lifted into gray. Stitches are applied after material rendering as before.

This is a 2D photographic material preview, not measured 3D scale geometry. The
reference is a finished boot, not a flat calibrated material scan. It is a
likeness correction for the owner's review, not a claim of identical individual
scales or physically measured reflections.

## Delivery and fallback

New files: `material-black-lizard-plates.enc` and
`material-black-lizard-plates-swatch.enc`, AES-256-GCM under the independent
server variable `SIMULATOR_BLACK_LIZARD_PLATES_KEY`. No secret is committed or
included in the client bundle. The server tries this pair, then the unchanged
20261023 black pair, then the previous reference/legacy fallback. Existing keys
and encrypted files are retained. Public catalogs remain 45 references and 11
deduplicated source pairs; private options remain private.

## Asset provenance

Built-in image generation used the owner's boot image as the authoritative
reference. A flattened-plate intermediate was supplied to the final wide-field
generation. Final ID: `exec-a4e7eaf9-268a-4893-bcb9-6ac32a31970d.png`.
Browser Canvas packaged the full atlas as a 1024 px JPEG texture and its center
40% crop as a readable 192 px JPEG swatch.

Final prompt:

> Create a single very wide-field BLACK LIZARD LEATHER material atlas, square, orthographic top-down photograph. The FIRST reference boot is authoritative for the black reptile scale style and reflective finish. The SECOND texture is only a morphology starting point: keep its flat elongated interlocking plates but make the scales much SMALLER and the surface smoother with clearer satin reflections like the boot. MOST IMPORTANT: zoom out 3 times in BOTH axes relative to the second texture. Show at least 45 to 50 tiny scales across the image width and 45 rows down. A very broad sheet of leather, not macro view. Each scale occupies about 1/45th of image width. This atlas must cover an entire shoe leather panel without repeating it. Flat shallow embossed irregular elongated rounded polygons, mostly about 1.6 to 2.2 times longer than wide, some shorter and some longer, tight shared straight-to-curving boundaries. Thin recessed black grooves. Natural diagonal staggered organic rows. This is NOT round stones, puffy ovals, beads, cobblestone, rubber bubbles or upholstery; no swollen domes. Faces smooth fine satin-black leather, not coarse grain, not rough matte sandpaper. Gray-silver specular reflection extends across whole scale faces and their fine upper-left edges, like the first reference boot. Individual scale faces vary gently in angle and reflection; many medium charcoal faces mixed with black faces. Consistent soft upper-left lighting throughout, NO giant global lighting gradient, no vignette, no shoe curvature. It must unmistakably look like the dense small elongated scale leather on the toe and lacing strip of the reference boot. Do not draw the boot, blue logo, stitches, laces or background. One continuous dense leather sheet filling entire square. High detail. Not a collage or grid of repeated tiles, no abrupt seams or symmetric V joins. Largest possible resolution.

Plaintext JPEG SHA-256 for live verification:

- Texture, 484129 bytes: `ac47f6bbfed405b968228d6025d3dfc615b39cffe21bec364d5c7d285f53b901`.
- Swatch, 22877 bytes: `70d941498ceba649f3b6d7674c70bff11a0eb9918f397ca167e1911941966835`.

## Validation

- TypeScript and production `node-server` build pass; `git diff --check` passes.
- Isolated catalog smoke covers the new source priority, all fallback paths,
  absent/corrupt pairs and invalid keys, public/admin parity and private options.
- Native Chromium: all 17 high/mid layers are 1424×1392 with zero alpha
  differences against RED and zero pixels outside the mask. B/C double stitch
  contrast checks pass and enlarged crops were inspected.
- All 44 unrelated public source objects are unchanged. The other eight lizards,
  FLOWER B, BRONZE and SILVER WEAVE B renders are byte-identical to the baseline.
- Both real customer model UIs pass black/white switching, swatch display and
  JPEG export, with no browser errors.
- Visual comparison confirms elongated interlocking scales, broad face lighting
  and removal of straight/mirrored joins. The reference has sharper bright scale
  rims and a glossier finish; this preview remains somewhat more satin. Do not
  describe the result as an exact material match or owner-approved.

After deployment, verify the live plaintext hashes above, unchanged nonblack
assets, public catalog counts and unauthorized admin rejection; then inspect the
actual deployed high/mid UI. A build status alone is not proof of deployment.
