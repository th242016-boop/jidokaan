// Isolated regression checks: temporary PGlite only; all outbound fetches blocked.
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const temp = await mkdtemp(resolve(tmpdir(), "jidokaan-orders-test-"));
const previousCwd = process.cwd();
process.env.DATABASE_URL = "";
process.env.PAYPAL_CLIENT_ID = "test-only";
process.env.PAYPAL_CLIENT_SECRET = "test-only";
process.env.PAYPAL_MODE = "sandbox";
process.env.PAYPAL_ENV = "sandbox";
process.chdir(temp);
globalThis.fetch = async () => {
  throw new Error("OUTBOUND_NETWORK_BLOCKED");
};
const server = await createServer({
  configFile: false,
  root,
  resolve: { alias: { "@": resolve(root, "src") } },
  server: { middlewareMode: true },
  appType: "custom",
});
let db;
let count = 0;
const check = async (label, fn) => {
  await fn();
  count++;
  console.log(`PASS ${label}`);
};
try {
  db = await server.ssrLoadModule("/src/lib/db.ts");
  const orders = await server.ssrLoadModule("/src/lib/orders.server.ts");
  const auth = await server.ssrLoadModule("/src/lib/admin-auth.server.ts");
  const catalog = await server.ssrLoadModule("/src/lib/catalog.server.ts");
  const shipping = await server.ssrLoadModule("/src/lib/shipping.ts");
  const pricing = await server.ssrLoadModule("/src/lib/shipping-pricing.ts");
  const paypal = await server.ssrLoadModule("/src/lib/paypal.server.ts");
  const submit = await server.ssrLoadModule("/src/lib/submit-order.ts");
  const sim = await server.ssrLoadModule("/src/lib/simulator-config.ts");
  const design = await server.ssrLoadModule("/src/lib/design-order.ts");
  const copies = await server.ssrLoadModule("/src/lib/checkout-copy.ts");
  const orderTypes = await server.ssrLoadModule("/src/lib/order-types.ts");
  const contact = await server.ssrLoadModule("/src/lib/order-contact.ts");
  await catalog.seedIfEmpty();
  const token = await auth.createSession(); // only this disposable test DB
  const input = {
    email: "qa@example.invalid",
    name: "TEST ONLY",
    phone: "+6580000000",
    instagram: "@test_customer",
    address: "1 Test Street #02-01",
    city: "Singapore",
    region: "",
    postal: "000001",
    country: "SG",
    pay: "paypal",
    shipMethod: "standard",
    shippingKrw: 25000,
    shippingUsd: 18,
    totalKrw: 313000,
    totalUsd: 248,
    currency: "USD",
    paypalOrderId: "TESTPAYPAL001",
    items: [
      {
        productId: "drone-custom",
        name: "Test custom boots",
        qty: 1,
        size: "265 (남성)",
        sizeFit: "men",
        priceKrw: 288000,
        priceUsd: 230,
        partNames: { a: "WHITE", b: "GOLD", k: "BLACK" },
        partColors: { a: "#fff", b: "#c9a227", k: "#000" },
      },
    ],
  };
  let saved;
  await check(
    "save and lookup preserves full address, Instagram, sizes and custom design",
    async () => {
      saved = await orders.placeOrder(input);
      const found = await orders.lookupOrder(saved.id, input.email);
      for (const key of ["city", "region", "postal", "country", "phone"])
        assert.equal(found[key], input[key]);
      assert.equal(found.instagram, "test_customer");
      assert.deepEqual(found.items, input.items);
    },
  );
  await check("admin authentication still required", async () => {
    await assert.rejects(orders.listOrders("wrong"), /AUTH/);
    assert.equal((await orders.listOrders(token)).length, 1);
  });
  await check("PayPal retries produce one order, even concurrently", async () => {
    const copies = await Promise.all([orders.placeOrder(input), orders.placeOrder(input)]);
    assert.ok(copies.every((o) => o.id === saved.id));
    assert.equal((await orders.listOrders(token)).length, 1);
  });
  await check("reusing a captured payment for another customer is rejected", async () => {
    await assert.rejects(
      orders.placeOrder({ ...input, email: "other@example.invalid" }),
      /PAYPAL_ALREADY_USED/,
    );
  });
  await check("shipping requires tracking and preserves existing status workflow", async () => {
    await assert.rejects(
      orders.updateOrder(token, saved.id, { status: "shipped" }),
      /TRACKING_REQUIRED/,
    );
    await orders.updateOrder(token, saved.id, { status: "ready" });
    const shipped = await orders.updateOrder(token, saved.id, {
      status: "shipped",
      tracking: "TEST-NOT-A-REAL-TRACKING",
      courier: "DHL",
    });
    assert.equal(shipped.status, "shipped");
    assert.equal(shipped.courier, "DHL");
  });
  await check("legacy order without Instagram/PayPal IDs remains readable", async () => {
    const legacy = { ...input, pay: "transfer", paypalOrderId: undefined, instagram: undefined };
    const o = await orders.placeOrder(legacy);
    assert.equal(o.status, "wait");
    assert.equal((await orders.lookupOrder(o.id, o.email)).instagram, "");
  });
  await check("original carton EMS country rates and one carton per pair", async () => {
    for (const [country, usd] of [
      ["SG", 27],
      ["CN", 28],
      ["US", 85],
      ["AE", 61],
    ]) {
      const q = shipping.quoteShipping({
        country,
        method: "standard",
        subtotalKrw: 288000,
        subtotalUsd: 230,
        qty: 1,
      });
      assert.equal(q.usd, usd);
      assert.equal(q.available, true);
    }
    assert.equal(
      shipping.quoteShipping({
        country: "US",
        method: "standard",
        subtotalKrw: 576000,
        subtotalUsd: 460,
        qty: 2,
      }).usd,
      170,
    );
    for (const country of ["IT", "ZA", ""])
      assert.equal(
        shipping.quoteShipping({
          country,
          method: "standard",
          subtotalKrw: 288000,
          subtotalUsd: 230,
          qty: 1,
        }).available,
        false,
      );
    assert.equal(
      shipping.quoteShipping({
        country: "KR",
        method: "standard",
        subtotalKrw: 288000,
        subtotalUsd: 230,
        qty: 1,
      }).krw,
      0,
    );
  });
  await check(
    "buffered quote covers carrier cost under the configured FX and deduction assumptions",
    async () => {
      const p = pricing.DEFAULT_SHIPPING_PRICING;
      const base = pricing.shippingPrice(96500, 1350, p);
      assert.equal(base.usd, 85);
      assert.equal(base.effectiveFx, 1282.5);
      assert.ok(base.assumedNetKrw >= 96500 * 1.03);
      assert.ok((base.usd - 1) * base.effectiveFx * 0.92 < 96500 * 1.03);
      assert.ok(pricing.shippingPrice(96500, 1250, p).usd > base.usd);
      assert.ok(
        pricing.shippingPrice(96500, 1350, { ...p, settlementReservePct: 12 }).usd > base.usd,
      );
      assert.equal(pricing.shippingPrice(96500, 1350, { ...p, roundUsd: 5 }).usd % 5, 0);
      for (const invalid of [
        { fxBufferPct: 100 },
        { settlementReservePct: -1 },
        { costBufferPct: NaN },
        { roundUsd: 0 },
      ]) {
        assert.throws(
          () => pricing.shippingPrice(96500, 1350, { ...p, ...invalid }),
          /SHIPPING_PRICING_INVALID/,
        );
      }
      assert.throws(() => pricing.shippingPrice(96500, 0, p), /SHIPPING_PRICING_INVALID/);
    },
  );
  await check(
    "old EMS settings migrate once and preserve higher manual country prices",
    async () => {
      const old = {
        ...shipping.DEFAULT_SHIPPING,
        pricing: undefined,
        exchangeKrwPerUsd: 1380,
        countryRates: { US: { krw: 96500, usd: 69.93 }, SG: { krw: 30000, usd: 45 } },
      };
      const before = JSON.stringify(old);
      const migrated = shipping.applyEmsPolicy(old);
      assert.equal(migrated.countryRates.US.usd, 85);
      assert.equal(migrated.countryRates.SG.usd, 45);
      assert.equal(migrated.countryRates.SG.minimumUsd, 45);
      assert.deepEqual(shipping.applyEmsPolicy(migrated), migrated);
      assert.equal(JSON.stringify(old), before);
      const paid = await orders.lookupOrder(saved.id, input.email);
      assert.equal(paid.shippingUsd, 18);
      assert.equal(paid.totalUsd, 248);
    },
  );
  await check("malformed Instagram rejected; no account allowed", async () => {
    assert.equal(contact.normalizeInstagram(""), "");
    assert.equal(contact.normalizeInstagram("@valid.name"), "valid.name");
    assert.throws(
      () => contact.normalizeInstagram("https://instagram.com/no"),
      /INSTAGRAM_INVALID/,
    );
  });
  const response = {
    id: "TESTPAYPAL001",
    status: "COMPLETED",
    purchase_units: [
      {
        payments: {
          captures: [
            {
              id: "CAPTURE001",
              status: "COMPLETED",
              amount: { currency_code: "USD", value: "248.00" },
              seller_receivable_breakdown: {
                paypal_fee: { currency_code: "USD", value: "11.21" },
                net_amount: { currency_code: "USD", value: "236.79" },
              },
            },
          ],
        },
      },
    ],
  };
  await check(
    "PayPal gross/fee/net persist with cents; amount/currency mismatch rejected",
    async () => {
      const verified = paypal.verifiedPayment(response, "TESTPAYPAL001", 248);
      assert.equal(verified.paypalNetUsd, 236.79);
      assert.equal(verified.paypalFeeUsd, 11.21);
      assert.throws(
        () => paypal.verifiedPayment(response, "TESTPAYPAL001", 268),
        /AMOUNT_MISMATCH/,
      );
      const wrong = structuredClone(response);
      wrong.purchase_units[0].payments.captures[0].amount.currency_code = "EUR";
      assert.throws(() => paypal.verifiedPayment(wrong, "TESTPAYPAL001", 248), /AMOUNT_MISMATCH/);
    },
  );
  await check(
    "checkout never returns a fake success on HTTP/network/malformed responses",
    async () => {
      for (const request of [
        async () => Response.json({ error: "DB_DOWN" }, { status: 500 }),
        async () => {
          throw new Error("offline");
        },
        async () => new Response("bad json"),
        async () => Response.json({}),
      ])
        await assert.rejects(submit.submitOrder(input, request));
      assert.equal(
        (await submit.submitOrder(input, async () => Response.json({ order: saved }))).id,
        saved.id,
      );
    },
  );
  // Historical records above deliberately have partial design data and old prices.
  // New checkout requires a complete simulator specification and saved preview.
  input.contactMethod = "instagram";
  input.termsAccepted = true;
  input.termsVersion = design.ORDER_TERMS_VERSION;
  input.checkoutLocale = "en";
  input.items[0].partNames = { ...sim.defaultPartNames(), b: "GOLD", k: "BLACK" };
  input.items[0].partColors = design.designColors(input.items[0].partNames);
  input.items[0].designKey = design.designKey(input.items[0].partNames);
  input.items[0].designVersion = design.DESIGN_VERSION;
  // Header-valid mock data only, no raster claim: canvas rendering checked separately.
  input.items[0].designPreview = "data:image/jpeg;base64,/9j/2Q==";
  await check("all supported languages contain every order notice with no fallback", async () => {
    const { LOCALES } = await server.ssrLoadModule("/src/lib/i18n.ts");
    for (const locale of LOCALES.map((l) => l.id)) {
      assert.ok(copies.CHECKOUT_COPY[locale], locale);
      assert.deepEqual(
        Object.keys(copies.CHECKOUT_COPY[locale]).sort(),
        Object.keys(copies.ko).sort(),
      );
      assert.ok(
        Object.values(copies.CHECKOUT_COPY[locale]).every(
          (v) => typeof v === "string" && v.trim().length > 0,
        ),
      );
      assert.ok(copies.checkoutCopy(locale).shipping.includes("410×310×150"));
      assert.ok(copies.SHIPPING_RATE_NOTE[locale]?.length > 10);
      assert.ok(copies.checkoutCopy(locale).selectCountry.length > 10);
      assert.ok(copies.checkoutCopy(locale).shipping.endsWith(copies.SHIPPING_RATE_NOTE[locale]));
    }
  });
  await check("different designs at the same size stay separate in cart", async () => {
    const { useStore } = await server.ssrLoadModule("/src/lib/store.ts");
    useStore.getState().clearCart();
    const one = sim.defaultPartNames(),
      two = { ...one, b: "RED" };
    for (const partNames of [one, two, one])
      useStore.getState().addToCart("drone-custom", 1, {
        size: "265",
        sizeFit: "men",
        partNames,
        partColors: design.designColors(partNames),
        openCart: false,
      });
    assert.deepEqual(
      useStore.getState().cart.map((i) => i.qty),
      [2, 1],
    );
    useStore.getState().setQty("drone-custom", 3, "265", undefined, "men", two);
    assert.deepEqual(
      useStore.getState().cart.map((i) => i.qty),
      [2, 3],
    );
    useStore.getState().removeFromCart("drone-custom", "265", undefined, "men", one);
    assert.equal(useStore.getState().cart.length, 1);
    assert.equal(useStore.getState().cart[0].partNames.b, "RED");
  });
  await check("high/mid drafts and carts remain separate; mid order metadata survives", async () => {
    const { useStore } = await server.ssrLoadModule("/src/lib/store.ts");
    useStore.getState().clearCart();
    useStore.getState().resetDraft();
    useStore.getState().setPartColor("e", sim.colorByName("RED").color, "RED");
    useStore.getState().addCustomBoot(1, false);
    useStore.getState().setDraftModel("mid");
    assert.equal(useStore.getState().draftPartNames.e, "WHITE");
    useStore.getState().setPartColor("e", sim.colorByName("RED").color, "RED");
    useStore.getState().addCustomBoot(1, false);
    assert.equal(useStore.getState().cart.length, 2);
    const mid = useStore.getState().draftPartNames;
    assert.equal(design.completeDesign(mid).model, "mid");
    assert.notEqual(design.designKey(mid), design.designKey({ ...mid, model: "high" }));
    assert.equal(design.completeDesign({ ...mid, g: "RED" }), null);
    assert.equal(design.completeDesign({ ...mid, model: "low" }), null);
    assert.equal(sim.partsForModel(mid).some(p => p.id === "g"), false);
    useStore.getState().setDraftModel("high");
    useStore.getState().setPartColor("e", sim.colorByName("BLUE").color, "BLUE");
    useStore.getState().setDraftModel("mid");
    assert.equal(useStore.getState().draftPartNames.e, "RED");
    const { quoteCheckout } = await server.ssrLoadModule("/src/lib/checkout-quote.server.ts");
    const midInput = structuredClone(input);
    midInput.items[0].partNames = mid;
    midInput.items[0].partColors = design.designColors(mid);
    midInput.items[0].designKey = design.designKey(mid);
    const quote = await quoteCheckout(midInput);
    assert.equal(quote.items[0].partNames.model, "mid");
    assert.equal(quote.items[0].optionLabel, "중목");
    assert.equal(quote.items[0].designKey, design.designKey(mid));
  });
  await check("missing/invalid historical colors never produce a guessed design", async () => {
    assert.equal(design.completeDesign({ a: "WHITE" }), null);
    assert.equal(design.completeDesign({ ...sim.defaultPartNames(), k: "GOLD" }), null);
    assert.equal(design.completeDesign({ ...sim.defaultPartNames(), l: "RED" }), null);
    assert.ok(design.completeDesign(input.items[0].partNames));
  });
  await check("customer responses hide merchant notes, fees and net", async () => {
    const view = orderTypes.customerOrder({
      ...saved,
      note: "INTERNAL",
      paypalFeeUsd: 11.21,
      paypalNetUsd: 236.79,
    });
    for (const key of ["note", "paypalFeeUsd", "paypalNetUsd"]) assert.equal(key in view, false);
    assert.equal(view.id, saved.id);
  });
  const quoteModule = await server.ssrLoadModule("/src/lib/checkout-quote.server.ts");
  const drafts = await server.ssrLoadModule("/src/lib/paypal-checkout.server.ts");
  await check(
    "admin FX changes recalculate stale country USD on both server and customer quotes",
    async () => {
      const config = { ...shipping.DEFAULT_SHIPPING, exchangeKrwPerUsd: 1250 };
      await catalog.writeShipping(token, config);
      const updated = await quoteModule.quoteCheckout({ ...input, country: "US", region: "CA" });
      assert.equal(updated.shippingUsd, 91);
      assert.equal(updated.totalUsd, 321);
      assert.match(updated.shippingBasis, /1,250|1250/);
      assert.equal(
        shipping.quoteShipping({
          country: "US",
          qty: 1,
          method: "standard",
          subtotalKrw: 288000,
          subtotalUsd: 230,
          settings: config,
        }).usd,
        updated.shippingUsd,
      );
      await assert.rejects(
        catalog.writeShipping(token, {
          ...config,
          pricing: { ...config.pricing, settlementReservePct: 100 },
        }),
        /SHIPPING_INVALID/,
      );
      await catalog.writeShipping(token, shipping.DEFAULT_SHIPPING);
    },
  );
  await check(
    "server ignores browser prices and calculates catalog prices + shipping",
    async () => {
      const q = await quoteModule.quoteCheckout({
        ...input,
        totalUsd: 1,
        shippingUsd: 0,
        items: input.items.map((i) => ({ ...i, priceUsd: 1 })),
      });
      assert.equal(q.totalUsd, 257);
      assert.equal(q.shippingUsd, 27);
      assert.equal(q.items[0].priceUsd, 230);
    },
  );
  await check("country override is used by both server quote and checkout calculator", async () => {
    const config = {
      ...shipping.DEFAULT_SHIPPING,
      countryRates: { SG: { usd: 35, krw: 30000, minimumUsd: 35, note: "TEST ONLY" } },
    };
    await catalog.writeShipping(token, config);
    const q = await quoteModule.quoteCheckout(input);
    assert.equal(q.shippingUsd, 35);
    assert.equal(
      shipping.quoteShipping({
        country: "SG",
        qty: 1,
        method: "standard",
        subtotalKrw: 288000,
        subtotalUsd: 230,
        settings: config,
      }).usd,
      35,
    );
    await catalog.writeShipping(token, shipping.DEFAULT_SHIPPING);
  });
  await check(
    "missing contact/country and unsupported pay methods fail before payment",
    async () => {
      for (const change of [{ country: "" }, { phone: "" }, { city: "" }, { pay: "card" }])
        await assert.rejects(quoteModule.quoteCheckout({ ...input, ...change }));
    },
  );
  await check(
    "email fallback works; consent, contact and complete design are mandatory",
    async () => {
      const q = await quoteModule.quoteCheckout({
        ...input,
        contactMethod: "email",
        instagram: "",
        checkoutLocale: "zh",
      });
      assert.equal(q.contactMethod, "email");
      assert.equal(q.instagram, "");
      assert.equal(q.acknowledgedTerms.shipping, copies.checkoutCopy("zh").shipping);
      for (const change of [
        { instagram: "" },
        { contactMethod: undefined },
        { email: "invalid", contactMethod: "email" },
        { termsAccepted: false },
        { termsVersion: "old" },
        { country: "IT" },
        { checkoutLocale: "bad" },
      ])
        await assert.rejects(quoteModule.quoteCheckout({ ...input, ...change }));
      for (const change of [
        { partNames: { a: "WHITE" } },
        { designPreview: undefined },
        { designPreview: "https://example.invalid/shoe.jpg" },
        { designKey: "wrong" },
        { designVersion: "old" },
      ])
        await assert.rejects(
          quoteModule.quoteCheckout({ ...input, items: [{ ...input.items[0], ...change }] }),
          /DESIGN_REQUIRED/,
        );
      const us = await quoteModule.quoteCheckout({ ...input, country: "US", region: "CA" });
      assert.equal(us.shippingUsd, 85);
      assert.equal(us.dutyTerms, "PREPAID_BEFORE_DISPATCH");
      assert.equal(us.acknowledgedTerms.duty, copies.CHECKOUT_COPY.en.usDuty);
    },
  );
  const paypalRecords = new Map();
  let paypalSequence = 0,
    captureCalls = 0;
  const sql = await db.getSql();
  globalThis.fetch = async (url, init = {}) => {
    const address = String(url);
    assert.ok(
      address.startsWith("https://api-m.sandbox.paypal.com/"),
      "test must never call a live payment host",
    );
    if (address.endsWith("/v1/oauth2/token")) return Response.json({ access_token: "TEST-TOKEN" });
    if (address.endsWith("/v2/checkout/orders")) {
      const request = JSON.parse(init.body);
      const pending = await sql.query("select payload from paypal_checkout_drafts where id=$1", [
        request.purchase_units[0].custom_id,
      ]);
      assert.equal(pending.length, 1, "full order must be saved before PayPal is called");
      assert.equal(pending[0].payload.instagram, "test_customer");
      assert.equal(pending[0].payload.items[0].designPreview, input.items[0].designPreview);
      assert.equal(pending[0].payload.termsVersion, design.ORDER_TERMS_VERSION);
      assert.equal(request.purchase_units[0].shipping.address.country_code, "SG");
      assert.equal(
        request.payment_source.paypal.experience_context.shipping_preference,
        "SET_PROVIDED_ADDRESS",
      );
      const id = `TESTDRAFT${++paypalSequence}`;
      paypalRecords.set(id, {
        id,
        status: "APPROVED",
        purchase_units: [
          { shipping: request.purchase_units[0].shipping, payments: { captures: [] } },
        ],
        expected: request.purchase_units[0].amount.value,
      });
      return Response.json({ id });
    }
    const id = address.split("/")[6];
    const record = paypalRecords.get(id);
    assert.ok(record, `unknown mock payment ${id}`);
    if (address.endsWith("/capture")) {
      captureCalls++;
      assert.ok(init.headers["PayPal-Request-Id"]);
      record.status = "COMPLETED";
      record.purchase_units[0].payments.captures = [
        {
          id: `CAP-${id}`,
          status: "COMPLETED",
          amount: { currency_code: "USD", value: record.expected },
          seller_receivable_breakdown: {
            paypal_fee: { currency_code: "USD", value: "11.21" },
            net_amount: { currency_code: "USD", value: "236.79" },
          },
        },
      ];
    }
    return Response.json(record);
  };
  await check("client/server quote mismatch stops before creating payment", async () => {
    await assert.rejects(drafts.startPaypalCheckout(input, "1.00"), /QUOTE_CHANGED/);
    assert.equal(paypalSequence, 0);
  });
  let newId;
  await check(
    "PayPal checkout saves design BEFORE capture; capture stores complete order",
    async () => {
      newId = await drafts.startPaypalCheckout(input, "257.00");
      const o = await drafts.completePaypalCheckout(newId, true);
      assert.equal(o.paypalOrderId, newId);
      assert.equal(o.paypalNetUsd, 236.79);
      assert.equal(o.paypalShipping.country, "SG");
      assert.deepEqual(o.items[0].partNames, input.items[0].partNames);
      assert.equal(o.items[0].designPreview, input.items[0].designPreview);
      assert.equal(o.acknowledgedTerms.shipping, copies.checkoutCopy("en").shipping);
    },
  );
  await check(
    "payment retry returns same order and quote survives later shipping-rate changes",
    async () => {
      await catalog.writeShipping(token, {
        ...shipping.DEFAULT_SHIPPING,
        countryRates: { SG: { usd: 99, krw: 30000, minimumUsd: 99 } },
      });
      const one = await drafts.completePaypalCheckout(newId, false);
      const two = await drafts.completePaypalCheckout(newId, false);
      assert.equal(one.id, two.id);
      assert.equal(one.shippingUsd, 27);
      await catalog.writeShipping(token, shipping.DEFAULT_SHIPPING);
    },
  );
  await check("database failure after payment is recoverable without a second charge", async () => {
    const id = await drafts.startPaypalCheckout(input, "257.00");
    const realQuery = sql.query;
    sql.query = async (text, ...args) => {
      if (text.startsWith("insert into store_orders")) throw new Error("TEST_DB_OUTAGE");
      return realQuery(text, ...args);
    };
    try {
      await assert.rejects(drafts.completePaypalCheckout(id, true), /TEST_DB_OUTAGE/);
    } finally {
      sql.query = realQuery;
    }
    assert.ok((await drafts.pendingPaypalCheckouts(token)).some((p) => p.paypalOrderId === id));
    const charges = captureCalls;
    const recovered = await drafts.recoverPaypalCheckout(token, id);
    assert.equal(recovered.totalUsd, 257);
    assert.equal(captureCalls, charges);
    assert.ok(!(await drafts.pendingPaypalCheckouts(token)).some((p) => p.paypalOrderId === id));
  });
  await check(
    "an in-progress PayPal quote keeps its original amount and terms after settings change",
    async () => {
      const id = await drafts.startPaypalCheckout(input, "257.00");
      const original = await sql.query(
        "select payload from paypal_checkout_drafts where paypal_id=$1",
        [id],
      );
      const payload = { ...original[0].payload, termsVersion: "2026-09-30-ems-design-v1" };
      await sql.query("update paypal_checkout_drafts set payload=$2::jsonb where paypal_id=$1", [
        id,
        JSON.stringify(payload),
      ]);
      await catalog.writeShipping(token, { ...shipping.DEFAULT_SHIPPING, exchangeKrwPerUsd: 1100 });
      const completed = await drafts.completePaypalCheckout(id, true);
      assert.equal(completed.shippingUsd, 27);
      assert.equal(completed.totalUsd, 257);
      assert.equal(completed.termsVersion, "2026-09-30-ems-design-v1");
      assert.equal(completed.shippingBasis, payload.shippingBasis);
      await catalog.writeShipping(token, shipping.DEFAULT_SHIPPING);
    },
  );
  await check("admin recovery never captures an unpaid draft", async () => {
    const id = await drafts.startPaypalCheckout(input, "257.00");
    const charges = captureCalls;
    await assert.rejects(drafts.recoverPaypalCheckout(token, id), /PAYPAL_UNPAID/);
    assert.equal(captureCalls, charges);
    await assert.rejects(drafts.pendingPaypalCheckouts("wrong"), /AUTH/);
  });
  console.log(`${count} checks passed; no live requests, no real payments, no production records.`);
} finally {
  await server.close();
  if (db) await (await db.getPglite()).close();
  process.chdir(previousCwd);
  await rm(temp, { recursive: true, force: true });
}
