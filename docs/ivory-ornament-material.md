# IVORY ORNAMENT — 2026-11-04

Added the owner's ivory / dark navy ornamental-loop leather to the administrator
Special studio. The material is available on high-cut B–J and mid-cut B–J except G.
Mesh, shoelaces, beads, outsole, ordinary colors, model menus and background are
unchanged. The material is deliberately absent from `PUBLIC_SPECIAL_PATTERNS`.

## Source and appearance

The unmodified 1153×2048 JPEG `KakaoTalk_20261103_175454893_17.jpg` is encrypted in
`src/lib/special-assets/material-ivory-ornament-photo.enc`. Its SHA-256 is
`5797d3f09d5367b3904d409d632246ec570e1f5d370eb5e22c01bd21677dd1fe`.
The existing Canvas material renderer and CSS swatch both sample the same
hand-free 480×480 region beginning at (360, 620). No generated substitute motif
is used. The repeat occupies 180 native shoe-photo pixels; this is a visual
estimate, not a measured manufacturing scale. Source perspective and local
photographic illumination are retained.

The shared renderer supplies photographed GOLD-guided broad light with a low
satin sheen, native RED alpha, independent panel-cut offsets and final dense
stitch restoration, including the existing B/C double-row corridors. No edge or
lace-hole geometry is redrawn. H/J retain the existing source-detail limitation.

## Protected delivery

The dedicated `SIMULATOR_IVORY_ORNAMENT_KEY` is an AES-256-GCM key stored only in
the server environment. The asset format is Base64(12-byte IV + 16-byte tag +
ciphertext). The new server branch requires an administrator audience as well as
the API's existing verified session. Missing or invalid key/image omits only this
new option and preserves the existing catalog. No existing key is replaced.

## Verification

The isolated catalog test covers admin access, public/anonymous exclusion,
identical crop for texture/swatch, compact delivery and missing/corrupt key/asset
isolation. The authentication/catalog smoke test checks the 48-material catalog
and all available leather panels. Native Canvas render checks separately compare
all 17 output silhouettes against the original alpha and inspect full-shoe and
B/C stitch previews. Native Canvas checks are not a claim of a logged-in
production browser session.
