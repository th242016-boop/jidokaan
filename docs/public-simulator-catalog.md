# Released simulator catalog — 2026-10-21

The owner authorized the current Special materials for customers, with FLOWER A excluded. Customers can open Special on both high- and mid-cut models, choose the released textures, mesh/lace colors and existing high-cut bead options, reset the current design, and save a rendered JPEG. The ordinary cart/checkout is unchanged. Special remains a design-preview/save workflow; it never submits its ordinary backing colors as if they were the chosen Special materials.

## Audience boundary

- `src/lib/simulator-catalog.ts` contains an explicit list of the 45 approved pattern/finish IDs. New entries in `SPECIAL_PATTERNS` are private by default until deliberately added to this list.
- The existing POST `/api/simulator-special` supports an explicit `audience: "public"` operation. It returns only the approved pattern assets, an empty `layers` object, and no FLOWER A `swatch`.
- Public filtering occurs before decoding assets, so public requests never require or decode the FLOWER A key/layers. A public request with an extra `admin` flag or forged token still receives only the public catalog.
- `audience: "admin"` or the legacy request without an audience retains the existing session validation. A fabricated client flag or token does not grant access.
- FLOWER A, GRAY CAMO and WOODLAND CAMO are available only in a successfully authenticated administrator catalog. The two new camouflage materials are not in the release list.
- An audience change or logout clears private decoded assets and Special drafts. Ordinary color drafts and cart state remain separate. Material choices are filtered in the UI and checked again when selected.
- Responses retain `no-store`; this change does not create a shared cache of administrator assets.

## Verification

`node scripts/public-simulator-catalog-smoke.mjs` runs the real handler and catalog policy against fresh in-memory ciphertext and a fake local authentication boundary. It checks the 45-name release set, absent private assets, public operation without the FLOWER A key, forged/malformed requests, and fallback when the optional reference-material key is absent or invalid. It uses no production session, credentials or database.

`scripts/public-simulator-browser-smoke.mjs` exercises a local production build with mocked public/admin responses: public high/mid selection, JPEG save, reset, ordinary draft isolation, private administrator options, logout and invalid-token fallback. Its camouflage stand-ins verify state/access behavior only; visual material acceptance is checked separately against the supplied reference photographs.

## Compact texture transport

The new client requests `compact: true` for assets. The server first filters and decrypts the authorized catalog, then transmits unique `patternSources` plus named numeric `patternRefs`. The 45 released choices use 10 unique source pairs; aliases such as nine lizard colors and twelve matte colors do not repeat large images in the JSON response. The client expands these references back to the renderer's existing `patterns` map while retaining shared object identity. Requests without the explicit boolean opt-in keep the original response shape. The decoder also accepts that legacy shape for backward compatibility.

The API smoke test verifies legacy/compact equality, publication boundaries in both forms, private administrator options, alias identity, and rejection of invalid reference indexes. The browser smoke test returns the actual compact wire format rather than an already-expanded mock.

## Integrated local result

The 2026-10-21 Node-server production build and TypeScript check passed. The browser smoke test ran against that build with the exact packaged 47-material fixture: all public/admin selection, JPEG export, reset, ordinary-draft isolation, logout and forged-token checks passed, with no browser page errors. The local server used a temporary working directory and no production database or administrator session. These checks do not assert that production has been deployed.
