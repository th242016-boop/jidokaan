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
