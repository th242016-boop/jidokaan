# V16 purchase-experience corrections — 2026-11-17

Scope: owner-private test Site only, based on V15 source `1e1df30ee29fa524f9118a7c8caa1d44fe8cdee7`. The user authorized fixing the preceding audit findings, including necessary displayed product-detail corrections. The official jidokaan.com/Railway deployment is not part of this change.

## Changes

- Product-detail offer and comparison prices use the same destination-aware pricing as the storefront. Japan displays JPY37,000 for a standard pair and its order shipping remains JPY6,000. Outdated USD230 and 20–30-day detail notices are replaced with current destination price and average15–21-day production guidance.
- Added104 full product-description translations (13languages ×8catalog products), wired localized names/options/shipping/descriptions, and corrected the Japanese mid-cut description. Existing merchant-authored data and all39ordered detail images remain unchanged. Text embedded in original images remains original.
- Localized simulator guide/enlargement/confirmation controls, sorting, missing country names, privacy/terms and business-information labels. Corrected targeted grammar/wording from the audit.
- Overseas special-order image popups and detail links consistently use Instagram DM; Korean delivery retains its existing consultation channel. Japan special-order notice uses JPY41,500.
- Mobile checkout is now contact/delivery → review/payment. Required fields, phone and postal checks gate advancement. Editing retains form values; country changes return to the details step; language/country changes reset consent. Payment method is next to the actual payment area. Optional help/specifications collapse; production, destination customs, exchange/return,12-hour cancellation and5% PayPal-refund deduction remain visible.

## Validation

- TypeScript and isolated static build passed.
- Existing pure regression suite:79named scenarios, including352foreign country×language×tier price combinations.
- Independent actual-product body matrix:384combinations (2shoe models×16languages×12countries) passed.
- Product detail128combinations and storefront product-language128combinations passed; original8catalog products,6visible products and39ordered detail images preserved.
- Home language3,344keys plus destination-specific special-popup checks passed. Targeted16-language simulator/country/sorting checks and Chinese regression passed.
- Preview isolation:7network blocks, synthetic lookup match/mismatch, beacon block and permitted asset access passed.
- Browser at390px iframe width: all16languages on product detail and checkout review have no horizontal overflow. Old20–30-day/USD230 detail text and generic English detail fallback were absent. Japanese detail showedJPY37,000; one special pair checkout showedJPY41,500+JPY6,000=JPY47,500.
- Browser: empty required email prevents advancing; valid synthetic contact/address advances; consent enables only the local preview button; edit preserves address; changing language resets consent; changing country returns to details, retains address and resets consent. No completion/order/payment was submitted.
- Mobile review-step final preview-button positions were approximately2,295–2,981px for the tested Japanese-destination special pair. This is a separate second step, not a claim that total form effort or real PayPal rendering was measured.

## Limits and retained scope

Actual IP geolocation and real PayPal remain disabled in this isolated preview. No live payment, order, email/DM, production database or official deployment was performed. AI language review is not a native-speaker user panel. Original product images may contain Korean lettering. Existing product-detail/domestic-terms outsole replacement amount50,000KRW was preserved; homepage FAQ65,000KRW is a pre-existing separate policy discrepancy outside the five requested audit corrections and must be resolved from the owner's current AS policy before official rollout.

Use the same Site source and its app-source directory to continue. Record final source SHA, saved version, deployment and URL in the existing Google Drive history/handoff after publication.
