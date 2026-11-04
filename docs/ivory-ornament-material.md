# IVORY ORNAMENT — 2026-11-04

Added the owner's cream / dark ornamental-loop leather to the administrator
Special studio. The material is available on high-cut B–J and mid-cut B–J except G.
Mesh, shoelaces, beads, outsole, ordinary colors, model menus and background are
unchanged. The material is deliberately absent from `PUBLIC_SPECIAL_PATTERNS`.

## Source and appearance

After the owner supplied the true base-color reference, the unmodified 832×870
JPEG `KakaoTalk_20261103_175454893_03.jpg` replaces the earlier, cooler reference in
`src/lib/special-assets/material-ivory-ornament-photo.enc`. Its SHA-256 is
`b9ff2da33578a44e9f1f8792e29393eb69c7b05311a7b944546eddc9e02cc634`.
The existing Canvas material renderer and CSS swatch both sample the same
clear 360×360 region beginning at (180, 170), excluding other samples and folds.
No generated substitute motif is used. The repeat occupies 230 native shoe-photo
pixels, matching the approximate motif pitch of the previous source; this is a visual
estimate, not a measured manufacturing scale. Source perspective and local
photographic illumination are retained.

The shared renderer supplies photographed GOLD-guided broad light with a low
satin sheen, native RED alpha, independent panel-cut offsets and final dense
stitch restoration, including the existing B/C double-row corridors. No edge or
lace-hole geometry is redrawn. H/J retain the existing source-detail limitation.

## Protected delivery

The `SIMULATOR_IVORY_ORNAMENT_KEY` is an AES-256-GCM key stored only in
the server environment. The asset format is Base64(12-byte IV + 16-byte tag +
ciphertext). It now also protects the independent gray-lizard photograph. Each
file has its own authenticated ciphertext. The server branch requires an administrator audience as well as
the API's existing verified session. A missing or invalid image omits only its
own option; a missing key omits the two private photographs. The rest of the
catalog is preserved. No existing key is replaced.

## Verification

The isolated catalog test covers admin access, public/anonymous exclusion,
identical crop for texture/swatch, compact delivery and missing/corrupt key/asset
isolation. The authentication/catalog smoke test checks the 49-material catalog
and all available leather panels. Native Canvas render checks separately compare
all 17 output silhouettes against the original alpha and inspect full-shoe and
B/C stitch previews. Native Canvas checks are not a claim of a logged-in
production browser session.
