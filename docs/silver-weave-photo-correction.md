# SILVER WEAVE photo correction — 2026-10-23

The previous generated map changed the supplied leather into thick, padded
rectangles. The replacement uses the owner's unmodified 484×860 JPEG so the
small silver bars, fine dark strands and shallow metallic relief come from the
actual leather. The material ID and customer/admin catalog remain unchanged.

The original photo is encrypted as `material-silver-weave-photo.enc` with the
independent server variable `SIMULATOR_SILVER_WEAVE_PHOTO_KEY`. This does not
replace or rekey existing materials. Plaintext SHA-256:
`1980a4df38d47900d0d937d80048f8775912459cb8bff6d9f10ddb58510dcef2`.

The response includes a normalized `sourceCrop` for the exposed leather rectangle
at x230/y340/width140/height140. The Canvas renderer and CSS swatch use this same
rectangle, excluding the finger, plastic and background. The compact API retains
crop metadata and distinguishes different crops of a shared image.

The 137px repeat preserves the photographed strand direction without mirroring
it into large diamonds. This is a photo sample, not a seamless scanned material;
minor motif resets at repetition boundaries can remain on close inspection.

Native RED alpha, GOLD-derived broad lighting, independent panel cut offsets,
and the existing stitch restoration are retained. Scale is a visual approximation
from the shoe reference, not a physical cutting specification.

Validation includes TypeScript, the production Node build, API catalog/crop
round-trips, all 17 high/mid leather silhouettes, B/C stitch inspection, and
byte-identical unrelated FLOWER B, BRONZE and BLACK LIZARD renders. Confirm the
live SILVER WEAVE response has the photo hash and crop metadata after deployment;
without the independent key the server intentionally uses its prior fallback.
