# V17 — outsole replacement fee confirmed

2026-11-17: the owner explicitly confirmed outsole replacement is KRW65,000. This resolves the V16 note about50,000/65,000 inconsistency; it does not change other repair, sales or cancellation terms.

- Corrected16language domestic terms and13additional language descriptions to65,000KRW. Original English/Japanese fee-bearing catalog text is corrected at display time. Original Korean detail has noASparagraph, so no new paragraph was added. Preserved source catalog/media and historic records.
- Free domestic shipping threshold50,000KRW remains unchanged; it is not anASfee.
- PayPal verification V15→V16: SDK/server/API/settings/quote/order money/order API/recovery files byte-identical. Payment request/approval/capture/order saving handlers and PaypalButtons component are also identical. V16 changed mobile step validation and presentation. V17 changes only fee copy/display normalization.
- Existing product-detail128combinations, catalog8products/6visible/39orderedimages preservation and TypeScript passed. Focused check:16localized terms and15fee-bearing high-cut descriptions use65,000; no prior50,000 fee in displayed bodies. An initial assertion incorrectly required anASparagraph in the original Korean detail; the assertion was corrected without adding content.
- Static preview build passed. No browser check was necessary for this bounded text correction. RealPayPal, orders, emails, productionDB and officialjidokaan.com/Railway were not invoked or changed.

Exact sourceSHA/version/deployment are recorded in the existing GoogleDrive history and handoff after publication.
