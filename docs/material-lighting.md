# Shared photograph-guided material lighting — 2026-10-21

The approved BRONZE / PINK GOLD rendering established a useful lighting reference: the native GOLD layers contain curved highlights and darker faces that the old RED-only material renderer did not reproduce strongly enough. This change extends that photographed direction to the other 36 generated Special materials, with a different response for each surface.

| Material family | GOLD guide blur, native pixels | Appearance |
| --- | ---: | --- |
| BLACK SNAKE | 14 | Dark scale fields and restrained neutral glints |
| WHITE SNAKE | 16 | Bright white scales with visible curved shading |
| NATURAL / colored SNAKE | 16 | Directional shading while preserving dark markings and dyed fields |
| FLOWER B | 22 | Curved shading and a little sheen on the pale/crackled areas |
| FLOWER C | 26 | Softer light over the existing floral print |
| SILVER WEAVE | 16 | Moderately reflective silver pattern with dark contrast preserved |
| MICRO HOUNDSTOOTH | 26 | Broad, low-sheen shading over the woven pattern |
| MATTE, all 12 colors | 26 | Smooth diffuse shading with almost no added reflection |
| SUEDE, all 12 colors | 36 | Broad soft shading, short-nap detail, very little added reflection |

All profiles use the same luminance calibration across parts. The renderer converts color to linear RGB for diffuse light and restrained neutral sheen, then applies a shared highlight shoulder to avoid flattening bright colors by clipping an individual channel. White matte and white suede have a separate brighter diffuse range so they remain distinctly white rather than becoming the existing GRAY choices. The material's original grain remains; matte is still smooth and suede still has nap. Suede's grain multiplier is squared in linear light to preserve the visible nap contrast of the previous display-RGB treatment. The profiles are artistic photographic approximations, not measured BRDFs.

## Preserved behavior

- BRONZE and PINK GOLD keep their approved lighting calculations and 6px / 10px guide blurs.
- Original FLOWER A uses the user's completed per-part PNGs through its separate path. It is not replaced by a generic generated texture. Its existing model/part availability is unchanged.
- Every generated output retains the original RED layer's 1424×1392 dimensions and alpha, including lace scallops and narrow edges. The GOLD image supplies only light, never its shape, color or fine scratches.
- Low-coverage GOLD samples blend into RED lighting. Missing or incorrectly sized GOLD files use the existing legacy renderer, so a failed optional guide cannot make a material disappear.
- Existing stitch restoration remains the final pass, including the photographed double rows on B/C. No synthetic seam is added where the source lacks thread detail.
- Existing texture files, swatches, motif sizes and independent per-panel cut offsets are unchanged. SILVER WEAVE remains at the previously reduced 294px repeat size.
- Mesh, laces, outsole, beads, ordinary order behavior and the administrator-only Special access boundary are unchanged.

## Scope and limits

The generated catalog has 38 choices: 36 newly relit materials plus the two approved metals. These apply to nine high-cut leather panels and eight mid-cut panels; mid has no G. FLOWER A is separate and has no supplied mid E/F/H layers.

The renderer transfers the fixed photograph's lighting. It does not reconstruct 3D surface normals, calculate moving lights or enable shoe rotation. Reference textures and repeat sizes remain visual previews rather than exact scans or physical cutting layouts.

## Verification

- `npm run typecheck` and `NITRO_PRESET=node-server npm run build` passed.
- Initial coverage checked 241 renders across all 17 supported leather panels. After the final diffuse-contrast and suede-nap tuning, 131 focused renders checked every one of the 38 choices on B in both models, representative materials on C/H in both models, and mid E. Native dimensions and RED alpha matched exactly; no pixels leaked outside the source mask.
- All 34 BRONZE / PINK GOLD panel renders remained byte-for-byte RGBA identical to baseline `5b973f1`.
- Visual review confirmed B/C double stitches, E lace-hole boundaries, narrow H edges without halos, curved shading on snakes/flowers/weave, smooth matte and visible suede nap. High B white finishes averaged about 232/255 versus gray 166–167/255; black finishes stayed around 30/255.
- Eight missing-GOLD fallback cases, 64 UI selections across both models, six JPEG exports, mobile layout and ordinary-mode Special hiding passed. Browser errors: zero.
- Browser QA used the local production build with a mocked authorized material response. The 24 finish textures and two metals used preserved final JPEG fixtures. The other 12 choices used JPEGs re-encoded from their actual generated texture originals; compression bytes may differ from the encrypted production assets. This verifies the renderer and interactions, not a live authenticated administrator session.
