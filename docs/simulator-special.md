# Administrator special simulator

The /customize header shows 스페셜 only after the existing administrator session
has been checked by POST /api/simulator-special. From /admin use the same-tab
시뮬레이터 link; authentication continues to use the existing sessionStorage token.
No separate password or public feature flag is introduced.

FLOWER A: high B–J; mid B/C/D/I/J. Mid has no G and no supplied floral E/F/H
layers. A and K remain white/black. L keeps the underlying solid-color linkage
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
