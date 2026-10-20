# B/C matte and suede color prototypes — 2026-10-20

This replaces the initial B-only black samples. The user rejected the coarse grain of MATTE BLACK and supplied real black, gray and yellow smooth matte-leather shoes as references. The requested scope is B and C only, both high and mid, in black/white/red/yellow, for both smooth matte leather and short-nap suede. Other materials and parts remain unchanged.

## Shared surface and independent color
`src/lib/special-finishes.ts` defines the eight names, base RGB colors and two shared asset keys. Existing MATTE BLACK and BLACK SUEDE names remain valid. Neutral textures are separate from base colors: no black source photograph is multiplied into bright colors.

- Matte: almost invisible low-contrast micrograin (contrast factor 0.12); broad weak reflected light from a 32px-blurred source, capped at 21 levels.
- Suede: fine short-nap variation (factor 0.65); weaker broad light from a 42px blur, capped at 7 levels.
- The native source RED image supplies the exact alpha and dark seam/edge detail. Every output keeps that alpha byte-for-byte, including all openings. The raw red channel also contains hard patent-highlight boundaries: those were visible in the first white/yellow trial. Finish-only shading now uses blurred red for broad shape and retains only dark unblurred detail (saturating at red155), preventing the old highlight silhouettes from reappearing.
- Fine stitch contrast is retained relative to a 2px-blurred source and suppressed in neutral specular zones. Broad blurred-mask coverage and diffuse light provide restrained curvature shading; output alpha is never blurred. This avoids both sharp enamel patches and a completely flat color-fill appearance.
- Shape shading is a 2D approximation from existing photography, not a physical light/material measurement. These are visual prototypes awaiting user approval. Suede has no supplied stock reference.

Colors are black #242629, white #e6e5e1, red #c51d2b and yellow #edc618. Each color can independently be selected on B/C. Swatches use the selected base color plus a faint shared texture overlay, with centered labels.

## Access and assets
The existing four encrypted finish files are replaced with neutral texture/swatch assets (768/160 JPEG), using the same SIMULATOR_SPECIAL_PATTERN_KEY. The server aliases all eight names to these two material families and caches decryption per request. No new key, public plaintext asset or ordinary order color is introduced. Existing admin-only no-store access remains.

References:
- upload/00389.png — smooth black leather, excluding mesh and green/gold trim.
- upload/20260519_174106.jpg — gray leather, excluding mesh and white patent trim.
- upload/20260519_134658.jpg — yellow leather, excluding black mesh.

Generated neutral maps:
- matte: generated_images/exec-b28e3216-aa86-4736-9e10-fab933dfbdf8.png
- suede: generated_images/exec-04a33f57-3ae5-4ee7-bda4-601f6e91f6c3.png

## Generation prompts
Built-in image generation was used. Matte used all three references; suede is a generic fine footwear suede sample.

### Matte
Use case: product-mockup. Asset type: neutral material texture for recolorable smooth matte shoe leather in a simulator. Input images: three real shoe photographs. Learn ONLY the very smooth almost grainless leather finish: black leather in image1 (not mesh/green trim), gray leather in image2 (not mesh/white accents), yellow leather in image3 (not black mesh). Create a square orthographic material swatch of that same smooth leather, recolored to neutral light gray. This is a 20cm square of leather, viewed at real product scale, NOT an exaggerated macro. Surface essentially smooth, nearly invisible very shallow fine pores. Tiny natural low-contrast micrograin only on close inspection, no distinct pebbled cells or raised bumps. Soft supple lightly coated smooth matte finish. Uniform neutral diffuse studio illumination; no hard shine, no white highlights or wrinkles. Even gray around RGB180-190. No large lighting gradient, no vignette. Tileable edge-to-edge. No shoe, no seams, no stitching, no folds, no objects, no text, no grainy noise. The most important priority: surface must look smooth like these reference shoes, not coarse pebbled leather, reptile, asphalt, felt or suede.

### Suede
Use case: product-mockup. Asset type: neutral grayscale short-nap suede material map to recolor shoes black, white, red and yellow. Create a square flat orthographic swatch of premium fine footwear suede, light neutral gray around RGB180. Short dense fine velvety nap, very subtle small softly brushed areas, fine microfibers visible near inspection. Physical area about20cm square, not extreme magnification. Soft dry touch clearly differs from smooth coated leather. Modest low-contrast nap direction variations across canvas. No long hair, no carpet, no large fuzzy clumps, no woven grid, no pebbled leather cells, no metallic or patent highlights. Even diffuse neutral illumination, no large gradient, no vignette, no cast shadow. Edge-to-edge seamless tileable texture. No shoe, no seams, no stitching, no folds, no objects, no text. Photographic natural short suede nap, not uniform digital noise.

## Verification
TypeScript, production build and nine isolated authentication/state checks passed. Four ciphertext files round-trip to the exact JPEG inputs.

The local production browser test uses a mocked authenticated asset response with the actual neutral maps. It covers both models, B/C × eight finishes (32 combinations), exact native alpha/no spill, independently selected B/C, unchanged other layers, four recognizable colors, JPEG saves, model drafts, mobile layout, public design restoration and logout. Actual live administrator login is not simulated as a real user; isolated auth tests and production unauthenticated rejection are checked separately.

Visual review: coarse matte grain and hard white patent patches are removed; matte is almost smooth and suede has fine nap. Narrow seam details and soft shape lighting are retained, but curvature is still restrained compared with the real shoe photographs. These remain prototypes for user review, not an exact reproduction of the physical material or color under calibrated light.

