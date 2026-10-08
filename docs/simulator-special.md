# Administrator special simulator

The /customize header shows 스페셜 only after the existing administrator session
has been checked by POST /api/simulator-special. From /admin use the same-tab
시뮬레이터 link; authentication continues to use the existing sessionStorage token.
No separate password or public feature flag is introduced.

FLOWER A: high B–J; mid B/C/D/I/J. Mid has no G and no supplied floral E/F/H
layers. Ordinary A and K remain white/black. L keeps the underlying solid-color linkage
because no floral L was supplied. Original PNG coordinates, pixels and alpha are
unchanged; only embedded editing metadata was removed. The swatch is z (90).png.

Special choices live only in React memory, independently for each model, outside
the persisted normal draft and cart. The special footer downloads a composed JPEG
instead of offering checkout. Normal ordering is unchanged. Logging out broadcasts
an invalidation to other tabs; focus, visibility and a 30-second heartbeat also
recheck the server session. Each material fetch and export requires authorization.
Like any preview, images already displayed or downloaded cannot be recalled.

## Protected source assets

src/lib/special-assets/*.enc contains base64 of AES-256-GCM ciphertext, prefixed
with the 12-byte IV and 16-byte authentication tag. The 32-byte base64 key lives
only in the Railway service variable SIMULATOR_SPECIAL_ASSET_KEY. Never commit
it, put it in a VITE_ variable or copy decrypted PNGs into public/. The server-only
raw imports keep encrypted blobs in the server build. Responses are no-store.
Rotating the key requires re-encrypting all source assets with unique IVs and
deploying the matching key and ciphertext together. Missing keys fail closed.

## Verification

Run npm run typecheck, NITRO_PRESET=node-server npm run build,
node scripts/simulator-special-smoke.mjs and node scripts/design-preview-smoke.mjs.
The special checks use only an isolated disposable PGlite database. Supplying the
asset key through the environment additionally verifies authenticated decryption.

## Mesh and lace preview

Administrator special mode splits A into mesh and independently controlled laces.
Mesh choices are RED, ORANGE, YELLOW, GREEN, BLUE, NAVY, PURPLE, PINK, GRAY,
WHITE and BLACK. Stocked laces are RED, BLUE, YELLOW, WHITE and BLACK. Both high
and mid models keep independent in-memory selections; standard ordering remains
unchanged. L is an existing hidden line layer and is not renamed or repurposed.

The renderer uses native 1424×1392 source pixels and original A alpha. The internal
lace mask was refined on 2026-10-08 after triangular tongue cutouts were found
to cross the lower lace ribbons. It now follows complete strands, with separate
upper contours for high and mid and shared lower contours. The existing native
A silhouette still clips the mask; source PNGs, dimensions and alpha are unchanged.
Outer-edge irregularities already present in A therefore remain. The user
approved administrator deployment on 2026-10-07. Solid tints retain source luminance; they
are previews, not photographs of the new physical lace colors.

Non-black mesh choices keep WHITE in the ordinary underlying A specification;
BLACK keeps BLACK. This preserves valid standard data and existing hidden L
linkage. With colored mesh, L may therefore remain white depending on D/I.

The earlier local prototype checkout was removed by workspace maintenance.
Its exact renderer and paths were recovered from the retained inline preview;
React integration was reconstructed on production 97ab236. The rollout is limited
to authenticated administrator special previews, for both high and mid models.

Verified: TypeScript and production build; 7 isolated authentication/state checks;
9 browser flows against the actual local build (protected floral payload fixture);
110 high/mid mesh/lace combinations in the inline preview, with independent
model drafts, zoom and mobile layout. The browser test also verifies normal order
data is unchanged and logout removes the preview. Production deployment status
and commit should be checked in Railway when taking over this project.

Boundary regression check: `node scripts/simulator-lace-boundaries-smoke.mjs`.
It uses local source images in a real browser Canvas and no server/session.
Set `CHROMIUM_EXECUTABLE_PATH` when using a system Chromium. It checks native
alpha for all 110 model/color combinations, unchanged all-white/all-black source
pixels, photograph-reviewed points in previously severed ribbons, exposed mesh
points, and independent color changes. Pixel assertions supplement enlarged
before/after visual review; they do not establish pixel-perfect segmentation.

## Special GRAY patent color

Administrator special mode also offers GRAY for high B–J and mid B/C/D/E/F/H/I/J.
It uses the existing #7a7d84 swatch. The browser derives each layer from that
model's native RED photograph, replacing red chroma while retaining neutral
highlights, shading, stitching, dimensions and alpha. It is a color preview of
the existing glossy material, not SILVER and not the matte mesh renderer.
Do not use the legacy public photo/tints/*-gray.png files; they are not suitable
transparent layers. No new public color or checkout option is introduced.

GRAY selections live in each special draft's solids map, mutually exclusive
with FLOWER A. The ordinary backing name stays RED so existing capture/order
validation stays valid. Hidden L follows GRAY I only when D is WHITE or BLACK;
GRAY D retains the existing colored-D linkage. Model changes wait for the
matching gray layers, and export waits for selected preview layers to be ready.

Verified on 2026-10-08: typecheck, production build, 8 isolated authorization/state
checks, and the actual local production UI with a protected floral fixture.
`node scripts/special-gray-browser-smoke.mjs` checks all 17 selectable gray
layers, native alpha, shading, FLOWER A transitions, model isolation, JPEG export,
mobile layout, ordinary-mode restoration and logout. Run against a local server
only; set CHROMIUM_EXECUTABLE_PATH if needed. Screenshots and exported JPEGs
were also reviewed visually for both models.
