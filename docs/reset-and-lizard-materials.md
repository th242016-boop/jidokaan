# All-white reset and lizard colorways — 2026-10-21

## Reset behavior

The Reset button sits immediately below the model/Special controls. It resets the currently visible design in the current mode and keeps the selected high/mid model.

- Ordinary mode resets that model's color names and color values to WHITE, including the outsole and hidden linked line.
- Special mode replaces only the current model's Special draft: WHITE leather, mesh and laces; no FLOWER A, generated patterns or GRAY solid override; beads NONE.
- The other model's draft, the other mode's draft, shoe size, fit and cart remain intact.
- Reset also works during material loading. A pending asset response retains an existing reset draft, and the pattern hook only exposes layers matching current selections. Reset is disabled while a Special JPEG capture is in progress.

## Lizard family

The displayed labels BLACK SNAKE and WHITE SNAKE are now BLACK LIZARD and WHITE LIZARD. Their established internal IDs, encrypted asset filenames and rendering remain unchanged for compatibility.

Seven colorways join this small-scale embossed family: RED, ORANGE, YELLOW, GREEN, BLUE, NAVY and PURPLE LIZARD. They reuse the protected black-snake texture and key; no new plaintext texture or credential is required. A monotonic color transfer retains the source's bright rims and dark recesses. The same transfer generates the swatch and the material layer.

All nine lizards share the existing 420px repeat and independent panel cut offsets. The seven new colors use the photograph-guided GOLD light direction with restrained sheen, RED-only alpha and the final photographed stitch restoration. Existing black/white output remains unchanged. The separate NATURAL SNAKE and five dyed python-print choices keep their names, texture and output.

Generated catalog: 45 choices, including nine lizards, six python-print snakes, two florals, two woven patterns, two metals and 24 matte/suede finishes. Original FLOWER A remains a separate per-part PNG path. Generated materials cover nine high-cut and eight mid-cut leather panels; mid has no G.

## Verification

- Type checking and the Node-server production build passed.
- Seven new colors across all 17 leather panels: 119 renders with exact native dimensions and RED alpha, no outside pixels, and preserved photographed stitch detail. B/C double rows and E lace cutouts were visually reviewed.
- Fifty baseline renders stayed RGBA-identical to `657e456`: black/white lizard across all 17 panels, plus eight representative established materials on B in both models.
- All seven swatches matched the shared pixel transfer exactly when using the same CPU Canvas decode path as the renderer. Four missing-GOLD fallback cases passed.
- Twenty-eight part/color UI selections (seven B/C pairs per model), three JPEG exports, ordinary and Special resets, model/mode draft isolation, size/fit/cart preservation, delayed-asset reset, and mobile placement passed. Browser errors: zero.
- Browser checks used a local production build with mocked administrator responses. Texture fixtures came from the actual earlier material originals; re-encoded pattern JPEGs may differ in compression bytes from the protected production files. FLOWER A used a stand-in only to test selection clearing, not to claim a new visual comparison. Live authenticated administrator rendering was not tested.

## Correction: colored lizard scale contrast

The initial seven dyed variants passed geometry and legacy-output checks, but their color transfer compressed the source scale rims and recesses too severely. The visual review did not catch the weak pattern contrast; it was reported by the owner after deployment.

The corrected transfer retains source-luminance variation below the dyed field and separates the brighter scale-rim reflection from the dye. This preserves neutral rim highlights on dark and saturated colors without clipping or changing the source texture, repeat, panel offsets, photograph-guided lighting or stitch restoration. Rendering and swatches use the same correction. Black/white lizard, other materials and reset behavior are unchanged.

Focused verification compared the previous deployment (`0827b97`) with the correction: all seven colors on high B/C and mid E/H (28 renders), exact 1424×1392 dimensions and RED alpha, no outside pixels, eight byte-identical black/white reference renders, and seven matching swatches. Fine-detail contrast increased in all 28 cases. Before/after B panels and B/C/E stitch close-ups were inspected visually; this check supplements geometry checks rather than assuming that matching masks imply a visible pattern.

The production build and type check passed. A focused local production-UI check selected NAVY LIZARD on high B/C/D/E and RED LIZARD on mid B/C/D/E, inspected the complete shoe views and saved both JPEG exports with no browser errors. Authenticated asset responses were mocked with the same original-texture fixtures as above.
