# Order and admin changes — 2026-09-30

This is repository maintenance documentation, not a replacement for the deployed application.

## Scope

Keep the existing homepage, simulator rendering, administrator authentication, and status names. Extend checkout, order persistence, the administrator order view, and shipping configuration. Do not modify existing customer orders as part of migration. Do not invent historical PayPal IDs, fees, Instagram handles, or missing design data.

## Source of truth and processing

- `checkout-quote.server.ts` calculates overseas product prices, option surcharges, coupon discounts, and shipping from the server catalog. Prices from the browser are not authoritative.
- PayPal create now requires a complete checkout payload. The server stores the customer/design/price snapshot in `paypal_checkout_drafts` before asking PayPal to create an order. Stale checkout clients are asked to refresh before creating a payment.
- The PayPal shipping address is explicitly supplied from checkout. It is customer-entered, not postal-address validation.
- Capture verifies a single completed USD capture and its exact total, then creates the store order using the saved snapshot. Amounts retain cents. Fee/net values are stored only when PayPal supplies them in USD.
- A unique index on `store_orders.data->>'paypalOrderId'` prevents duplicate paid orders. Existing records without that field are unaffected. Retry returns the existing order and does not overwrite its specification/status.
- If capture succeeds but order saving fails, the draft remains. Admin “결제 확인·주문 복구” verifies payment with a GET and saves only an already-paid order; it does not capture or charge an unpaid draft. The pending list also includes abandoned/unpaid attempts and is labelled accordingly. It shows the latest 100 pending attempts in 30 days.
- This is explicit recovery, not an automatic PayPal webhook/reconciliation worker. No webhook is configured by this change.
- Customer success is shown only after a server order ID is received. Failed saving retains the cart and a session recovery reference. No fabricated success order ID.
- Existing legacy payment captures can still be saved through `/api/orders` after server repricing and PayPal verification. Completed historical orders remain unchanged.

## Admin workflow

1. Open order number or “상세보기”. Review full customer address, country, phone, size, quantity and per-part color names. Instagram is optional and absent on historical orders.
2. Compare PayPal transaction amount and shipping address before fulfilment. Missing historical PayPal data is marked as not stored, never estimated.
3. Set existing status `ready` (배송준비) while making/preparing the product.
4. Save carrier, tracking number and internal note in order details.
5. After actual dispatch, set `shipped` (발송). Missing tracking is rejected by the server.
6. Cancellation changes the store record; it does not refund PayPal. Saving shipment information does not automatically send customer notifications.

Dates are displayed in Asia/Seoul, labelled KST. Underlying timestamps stay UTC.

## Shipping policy

Existing fallback rates are retained, not newly approved: Asia USD18, Pacific USD28, Europe USD32, rest of world USD38. KR local free shipping threshold remains KRW50,000. Overseas free-shipping fields previously shown by the admin were unused by checkout; the misleading inputs were removed. Express settings remain stored for compatibility but are not presented as a checkout choice.

Country-specific standard USD rates can override regional fallback rates. Admin can record the carrier/packed-weight/quote date in a note and preview checkout calculation. Quantity surcharge retains the legacy percentage and whole-dollar rounding. An empty checkout country is no longer displayed as rest-of-world USD38.

The current policy remains DAP, with import charges excluded. No US city tariff, estimated customs charge, DDP promise, carrier contract, or new monetary rate was enabled. DDP requires an actual supported carrier billing arrangement, product tariff classification/material/origin data and a verified landed-cost quote. Freight and duties must remain separate line items in any future implementation.

## Validation

Run `node scripts/order-smoke.mjs`, `npm run typecheck`, and `NITRO_PRESET=node-server npm run build`.

The regression script uses a temporary isolated PGlite database, blocks outbound requests, and uses mock PayPal responses on the sandbox hostname only. It covers full order data preservation, existing admin authentication, duplicate PayPal reuse, tracking guard, historical record compatibility, shipping rates/overrides, Instagram validation, amount/currency mismatch, HTTP/network/JSON failures, authoritative server quotes, pre-payment snapshots, post-payment DB failures and non-charging admin recovery.

No real transaction, refund, customer message or production test order was submitted. Mock payment tests are not a live/sandbox PayPal browser transaction. Browser UI verification requires a reachable preview or deployment and an authorized administrator login. Never obtain credentials from chat, reset production auth for testing, or run tests against a live database.

## Further work

- Configure and verify a PayPal webhook/reconciliation worker for automatic recovery; current recovery is manual and explicit.
- Bank-transfer submissions do not yet have a client idempotency key.
- Existing orders with no stored PayPal IDs need manual transaction matching, not automatic guessing.
- Owner must confirm actual carrier, packed weight/dimensions and contract rates before revising shipping prices or enabling DDP.
- Do not treat this audit as certification that every unrelated site feature has passed testing.
