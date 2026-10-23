# LIZARD family — shared elongated scales and light

## Change

WHITE LIZARD and RED, ORANGE, YELLOW, GREEN, BLUE, NAVY and PURPLE LIZARD now
use the elongated-scale atlas already deployed for BLACK LIZARD in `a246abc`.
The existing saved IDs `BLACK SNAKE` and `WHITE SNAKE` remain unchanged.
This applies to all nine leather panels on the high model and eight on the mid
model (which has no G). Mesh, laces, beads and other materials are outside scope.

All nine colors share the existing encrypted `black-lizard-plates` texture and
swatch pair under `SIMULATOR_BLACK_LIZARD_PLATES_KEY`. No new key or asset is
required. The server preserves the previous complete-pair fallback paths.
The public catalog still has 45 material references, now in 10 deduplicated
sources. FLOWER A and the two camouflage options remain private.

## Rendering

- Use the same atlas orientation, minimum 820 px projected span, smooth panel
  warp and independent panel cuts for every color. Never mirror or repeat the
  lizard atlas across a panel. Prefilter it to the same projected resolution.
- The dye transfer retains dark joints and variation across the scale faces.
  The atlas has median luminance about 33; the previous transfer flattened
  much of its face detail above 28/32. Colored dye now reaches its base at 52,
  with restrained neutral bright rims above that. White uses a brighter curve
  through 42 and retains the shallow gray grooves.
- Use the same photographed neutral GOLD light guide, blur 16, peak 1.10,
  sheen 0.16 and light exponent 1.05 as black. The diffuse floor is 0.34 except
  white's 0.62, so white stays white without changing where the light falls.
- Gate reflected light using the **undyed** scale luminance, independently of
  color. Navy must not lose its reflections because its diffuse color is dark;
  white must not brighten recessed joints because its diffuse color is light.
- Keep BLACK's existing transfer and calculation exactly. Restore the existing
  dense stitch overlay after rendering, including both B/C stitch rows. RED
  alpha is the sole authority for silhouettes and lace holes.

This remains a photographic 2D preview, not a measured 3D material or an exact
reproduction of individual scales in the owner's sample. That sample's rim
highlights are sharper than the shared atlas's satin finish. The change extends
the latest black method consistently; it does not claim an identical real-world
color under every light.

## Verification

Isolated catalog smoke checks both models and public/admin parity, one shared
atlas for all nine colors, invalid/missing keys, incomplete or damaged pairs,
fallback behavior, compact response round trips and private-option protection.
Native browser validation covers all 153 model/part/color combinations against
the original alpha mask, all 17 unchanged BLACK renders, unrelated material
regression checks, B/C stitch rows, color selections and JPEG export. Inspect
full-size white/navy and nine-color contact sheets before deployment.

After deployment, verify all nine public texture hashes equal
`ac47f6bbfed405b968228d6025d3dfc615b39cffe21bec364d5c7d285f53b901`, and swatches equal
`70d941498ceba649f3b6d7674c70bff11a0eb9918f397ca167e1911941966835`.
The 36 non-lizard assets and BLACK remain unchanged. Check live frontend bundles,
unauthenticated admin rejection and actual high/mid UI after terminal success.
