# 실버 스네이크 — 2026-11-04

The administrator Special studio adds `SILVER SNAKE`, displayed as **실버 스네이크**,
on high-cut B–J and mid-cut B–J except G. It is absent from the retained public
subset. Ordinary colors, mesh, shoelaces, beads, model menu and background remain
unchanged.

## Photographic source and scale

The unmodified 590×831 photograph `KakaoTalk_20261103_175454893_05.jpg` is protected
in `src/lib/special-assets/material-silver-snake-photo.enc`. Its SHA-256 is
`28eb4a2069cfd9a56e728572437c58d926a0e192ca26278510d1e175f55daf33`.
Both the material renderer and selector swatch sample its 72×72 region starting
at (302, 177). The source's elongated cells and pale dividers remain the pattern
authority. The separate hand-held photograph
`KakaoTalk_20261030_170621176(1).jpg` informs approximate physical scale and the
metallic reflection character; it is not pasted onto the shoe.

The 72px crop occupies 36 native shoe-photo pixels. This retains the initial
0.5 source-to-shoe scale, using a smaller phase-matched repeat to reduce visible
boundary mismatch. This is an estimate from
the hand reference, not a measured cutting layout. The renderer uses ordinary
repeat rather than mirrored repeat, preserves the source direction, and uses
independent panel offsets. A photographic crop is not a manufactured seamless
texture; any source perspective and local irregularities remain.

## Silver response

`silver-snake-material.ts` separates pale dividers from dark reflective foil
faces using source luminance. Dark source cells represent reflected surroundings,
not permanent black pigment. The neutral GOLD light guide supplies a nonlinear
silver response to those faces; the white dividers respond more diffusely.
Small photographic surface variations remain. No random sparkle or permanently
colored reflection is added. This is calibrated 2D photographic relighting in a
fixed view, not a measured 3D BRDF or a guarantee of every real lighting angle.

Native RED alpha remains the sole boundary authority, including lace holes.
Photographed dark seam detail and the existing final stitch restoration remain,
including the B/C double-row corridors. H/J retain their existing source-detail
limitation.

## Protected delivery

The existing private-photo `SIMULATOR_IVORY_ORNAMENT_KEY` is reused without key
rotation. Ciphertext uses Base64(12-byte IV + 16-byte GCM tag + ciphertext). The
photo is delivered only after a verified administrator session and administrator
audience check. It is not a public image or client-bundled plaintext asset.
An unavailable photo omits this option without removing unrelated materials.

## Verification

`scripts/silver-snake-render-smoke.mjs` invokes the actual application renderer
through optional native Canvas. It checks the 17 native 1424×1392 layers for exact
alpha and no exterior spill, verifies the displayed name and exclusion from the
black-lizard dye transfer, and generates high/mid whole-shoe and B/C seam previews.
Fourteen historical outputs (seven materials × two model/part selections) are
compared byte-for-byte with a supplied baseline, including Gray Lizard and Ivory
Ornament.

Relighting checks cover finite bounded linear output across source luminances
and light levels, a stronger light response in foil than white dividers, retained
dark seam detail, neutral silver and no illumination outside the native mask.
These native Canvas checks are not a logged-in production browser session.
