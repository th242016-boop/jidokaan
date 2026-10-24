// Synthetic EMS regression suite. Temporary PGlite only; no production data or carrier calls.
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const temporary = await mkdtemp(resolve(tmpdir(), "jidokaan-ems-regression-"));
const previousCwd = process.cwd();
process.env.DATABASE_URL = "";
process.env.JIDOKAAN_LOCAL_ONLY = "1";
process.env.TELEGRAM_BOT_TOKEN = "";
process.env.RESEND_API_KEY = "";
process.env.EPOST_TRACKING_SERVICE_KEY = "";
process.env.EPOST_TRACKING_ENABLED = "";
process.env.EPOST_TRACKING_HTTPS_VERIFIED = "";
process.chdir(temporary);
let outboundAttempts = 0;
globalThis.fetch = async () => {
  outboundAttempts++;
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
let checks = 0;
let sequence = 0;
let operations = 0;
const operation = () => `synthetic-operation-${++operations}`;
const now = "2026-10-24T09:00:00.000Z";
const later = "2026-10-25T09:00:00.000Z";
const check = async (label, work) => {
  await work();
  checks++;
  console.log(`PASS ${label}`);
};
function tracking(n) {
  const digits = String(n).padStart(8, "0");
  const weights = [8, 6, 4, 2, 3, 5, 9, 7];
  const remainder = 11 - ([...digits].reduce((sum, x, i) => sum + Number(x) * weights[i], 0) % 11);
  const checkDigit = remainder === 10 ? 0 : remainder === 11 ? 5 : remainder;
  return `EE${digits}${checkDigit}KR`;
}
const base = {
  email: "synthetic@example.invalid",
  name: "SYNTHETIC CUSTOMER",
  phone: "+6580000000",
  instagram: "synthetic_customer",
  address: "1 TEST STREET",
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
  items: [
    {
      productId: "drone-custom",
      name: "Synthetic boxing boots",
      qty: 1,
      size: "265",
      priceKrw: 288000,
      priceUsd: 230,
      partNames: { a: "WHITE", b: "GOLD" },
      partColors: { a: "#ffffff", b: "#c9a227" },
    },
  ],
};
function evidence(pkg, state, time = later) {
  return {
    checkedAt: time,
    outcome: "ok",
    evidence: {
      provider: "koreapost",
      tracking: pkg.tracking,
      checkedAt: time,
      verified: true,
      state,
      ...(state === "delivered" ? { deliveredAt: time } : {}),
      events: [
        {
          occurredAt: time,
          status: state === "delivered" ? "배달완료" : state,
          location: "SYNTHETIC OFFICE",
          detail: "SYNTHETIC TEST RECORD",
        },
      ],
      rawStatus: state,
    },
  };
}

try {
  db = await server.ssrLoadModule("/src/lib/db.ts");
  const auth = await server.ssrLoadModule("/src/lib/admin-auth.server.ts");
  const catalog = await server.ssrLoadModule("/src/lib/catalog.server.ts");
  const orders = await server.ssrLoadModule("/src/lib/orders.server.ts");
  const ems = await server.ssrLoadModule("/src/lib/ems.server.ts");
  const workflow = await server.ssrLoadModule("/src/lib/ems-workflow.ts");
  const orderTypes = await server.ssrLoadModule("/src/lib/order-types.ts");
  await catalog.seedIfEmpty();
  const token = await auth.createSession();
  const sql = await db.getSql();
  const fresh = async (patch = {}) =>
    orders.placeOrder({
      ...structuredClone(base),
      paypalOrderId: `SYNTHETIC-PAY-${++sequence}`,
      ...patch,
    });
  const read = (id) => orders.findOrderById(id);
  const mutate = (o, action, op = operation()) =>
    ems.mutateEms(token, o.id, o.fulfillment.version, op, action);
  async function prepared(patch = {}) {
    const o = await fresh(patch);
    const result = await ems.prepareEmsOrders(token, [o.id]);
    assert.equal(result.errors.length, 0);
    return read(o.id);
  }
  async function complete(o, packages = null) {
    const recipient = {
      ...o.fulfillment.recipient,
      englishConfirmed: true,
      countryCallingCode: "65",
      areaCode: "",
      phone1: "8000",
      phone2: "0000",
    };
    const draftPackages = (packages ?? o.fulfillment.packages).map((p) => ({
      ...p,
      grossWeightGrams: 1400,
      lengthCm: 41,
      widthCm: 31,
      heightCm: 15,
      items: p.items.map((i) => ({
        ...i,
        descriptionEn: "Boxing shoes",
        hsCode: "640399",
        originCountry: "KR",
        netWeightGrams: 600,
      })),
    }));
    return mutate(o, { action: "save", recipient, packages: draftPackages });
  }
  const register = (o, n, index = 0, op) =>
    mutate(
      o,
      {
        action: "register",
        packageId: o.fulfillment.packages[index].id,
        tracking: tracking(n),
        reference: "Synthetic postal confirmation",
        confirmed: true,
      },
      op,
    );
  const handover = (o) =>
    mutate(o, {
      action: "handover",
      packageIds: o.fulfillment.packages.map((p) => p.id),
      confirmed: true,
    });

  let primary;
  await check(
    "single paid order prepares without inventing English, customs or actual weight",
    async () => {
      primary = await prepared();
      assert.equal(primary.status, "ready");
      assert.equal(primary.fulfillment.method, "ems_counter_dropoff");
      assert.equal(primary.fulfillment.recipient.name, base.name);
      assert.equal(primary.fulfillment.recipient.address, base.address);
      assert.equal(primary.fulfillment.recipient.englishConfirmed, false);
      const p = primary.fulfillment.packages[0];
      assert.equal(p.grossWeightGrams, null);
      assert.equal(p.items[0].descriptionEn, "");
      assert.equal(p.items[0].hsCode, "");
      assert.equal(p.items[0].declaredValue, 230);
      assert.equal(p.items[0].quantity, 1);
      assert.ok(workflow.emsIssues(primary).length > 0);
    },
  );
  await check("prepare is repeatable without new parcels or overwritten data", async () => {
    const initial = JSON.stringify(primary.fulfillment);
    await ems.prepareEmsOrders(token, [primary.id, primary.id]);
    assert.equal(JSON.stringify((await read(primary.id)).fulfillment), initial);
  });
  await check("authentication protects prepare and mutation", async () => {
    await assert.rejects(ems.prepareEmsOrders("wrong", [primary.id]), /AUTH/);
    await assert.rejects(
      ems.mutateEms("wrong", primary.id, primary.fulfillment.version, operation(), {
        action: "failed",
        packageId: primary.fulfillment.packages[0].id,
        note: "test",
      }),
      /AUTH/,
    );
  });
  await check("bulk prepare distinguishes unpaid and missing orders", async () => {
    const one = await fresh();
    const two = await fresh();
    const unpaid = await fresh({ pay: "transfer" });
    const result = await ems.prepareEmsOrders(token, [one.id, two.id, unpaid.id, "MISSING"]);
    assert.equal(result.orders.length, 2);
    assert.equal(result.errors.length, 2);
    assert.equal((await read(unpaid.id)).status, "wait");
    assert.equal((await read(unpaid.id)).fulfillment, undefined);
  });
  await check("missing customs and English details block registration and export", async () => {
    await assert.rejects(register(primary, 1));
    await assert.rejects(ems.exportEmsOrders(token, [primary.id]));
    assert.equal((await read(primary.id)).fulfillment.packages[0].state, "preparing");
  });
  await check(
    "editing fills verified details without changing order payment or design",
    async () => {
      primary = await complete(primary);
      assert.equal(workflow.emsIssues(primary).length, 0);
      assert.equal(primary.totalUsd, base.totalUsd);
      assert.equal(primary.shippingUsd, base.shippingUsd);
      assert.deepEqual(primary.items, base.items);
    },
  );
  await check("customs cannot underdeclare or misallocate ordered quantities", async () => {
    const p = structuredClone(primary.fulfillment.packages);
    p[0].items[0].declaredValue = 1;
    const undervalued = await mutate(primary, {
      action: "save",
      recipient: primary.fulfillment.recipient,
      packages: p,
    });
    assert.ok(workflow.emsIssues(undervalued).length > 0);
    await assert.rejects(register(undervalued, 2));
    const fixed = structuredClone(undervalued.fulfillment.packages);
    fixed[0].items[0].declaredValue = 230;
    fixed[0].items[0].quantity = 2;
    const wrongQty = await mutate(undervalued, {
      action: "save",
      recipient: undervalued.fulfillment.recipient,
      packages: fixed,
    });
    assert.ok(workflow.emsIssues(wrongQty).length > 0);
    await assert.rejects(register(wrongQty, 2));
    fixed[0].items[0].quantity = 1;
    primary = await mutate(wrongQty, {
      action: "save",
      recipient: wrongQty.fulfillment.recipient,
      packages: fixed,
    });
  });
  await check("official TXT has 25 fields and commercial goods category only", async () => {
    const file = await ems.exportEmsOrders(token, [primary.id]);
    const line = file.content
      .replace(/^\uFEFF/, "")
      .trim()
      .split(/\r?\n/)[0];
    const fields = line.split("|");
    assert.equal(fields.length, 25);
    assert.equal(fields[15], "");
    assert.equal(fields[16], "");
    assert.equal(fields[17], "O");
    assert.equal(fields[18], "Boxing shoes");
    assert.equal(Number(fields[21]), 230);
  });
  await check("stale edits cannot overwrite a newer saved revision", async () => {
    const stale = structuredClone(primary);
    primary = await mutate(primary, {
      action: "save",
      recipient: primary.fulfillment.recipient,
      packages: primary.fulfillment.packages,
    });
    await assert.rejects(
      mutate(stale, {
        action: "save",
        recipient: stale.fulfillment.recipient,
        packages: stale.fulfillment.packages,
      }),
    );
    assert.equal((await read(primary.id)).fulfillment.version, primary.fulfillment.version);
  });
  await check("unconfirmed registration and premature handover are rejected", async () => {
    await assert.rejects(
      mutate(primary, {
        action: "register",
        packageId: primary.fulfillment.packages[0].id,
        tracking: tracking(3),
        reference: "test",
        confirmed: false,
      }),
    );
    await assert.rejects(handover(primary));
  });
  await check("same registration operation is idempotent even under concurrency", async () => {
    const op = operation();
    const pair = await Promise.allSettled([
      register(primary, 3, 0, op),
      register(primary, 3, 0, op),
    ]);
    assert.ok(pair.some((r) => r.status === "fulfilled"));
    primary = await read(primary.id);
    assert.equal(primary.status, "ready");
    assert.equal(primary.fulfillment.packages[0].state, "awaiting_dropoff");
    assert.equal(primary.fulfillment.packages[0].tracking, tracking(3));
    assert.equal(primary.fulfillment.audit.filter((a) => a.operationId === op).length, 1);
    const retry = await ems.mutateEms(token, primary.id, 1, op, {
      action: "register",
      packageId: primary.fulfillment.packages[0].id,
      tracking: tracking(3),
      reference: "Synthetic postal confirmation",
      confirmed: true,
    });
    assert.equal(retry.fulfillment.version, primary.fulfillment.version);
  });
  await check("reusing operation key for a different action is rejected", async () => {
    const registration = primary.fulfillment.audit.find((a) => a.action === "register");
    await assert.rejects(
      mutate(
        primary,
        { action: "handover", packageIds: [primary.fulfillment.packages[0].id], confirmed: true },
        registration.operationId,
      ),
    );
  });
  await check("registered parcel details cannot silently be edited", async () => {
    const packages = structuredClone(primary.fulfillment.packages);
    packages[0].grossWeightGrams = 100;
    await assert.rejects(
      mutate(primary, { action: "save", recipient: primary.fulfillment.recipient, packages }),
    );
  });
  await check("tracking ownership is unique across simultaneous different orders", async () => {
    const a = await complete(await prepared());
    const b = await complete(await prepared());
    const result = await Promise.allSettled([register(a, 4), register(b, 4)]);
    assert.equal(result.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(result.filter((r) => r.status === "rejected").length, 1);
    const parcels = await Promise.all([read(a.id), read(b.id)]);
    assert.equal(
      parcels.filter((o) => o.fulfillment.packages[0].tracking === tracking(4)).length,
      1,
    );
  });
  await check("tracking from historical legacy orders is not reused", async () => {
    const old = await fresh();
    const historic = { ...old, status: "done", tracking: tracking(5), courier: "EMS" };
    await sql.query("update store_orders set data=$2::jsonb,status='done' where id=$1", [
      old.id,
      JSON.stringify(historic),
    ]);
    const next = await complete(await prepared());
    await assert.rejects(register(next, 5));
  });
  await check("unknown registration locks retries until supported reconciliation", async () => {
    let o = await complete(await prepared());
    o = await mutate(o, {
      action: "uncertain",
      packageId: o.fulfillment.packages[0].id,
      note: "Synthetic response timeout",
    });
    assert.equal(o.fulfillment.packages[0].state, "registration_unknown");
    await assert.rejects(register(o, 6));
    await assert.rejects(ems.exportEmsOrders(token, [o.id]));
    await assert.rejects(
      mutate(o, {
        action: "reconcile",
        packageId: o.fulfillment.packages[0].id,
        outcome: "not_registered",
        reference: "",
        confirmed: true,
      }),
    );
    o = await mutate(o, {
      action: "reconcile",
      packageId: o.fulfillment.packages[0].id,
      outcome: "not_registered",
      reference: "Synthetic official lookup: no registration found",
      confirmed: true,
    });
    assert.equal(o.fulfillment.packages[0].state, "preparing");
    o = await register(o, 6);
    assert.equal(o.fulfillment.packages[0].state, "awaiting_dropoff");
  });
  await check("known registration failure remains distinguishable and recoverable", async () => {
    let o = await complete(await prepared());
    o = await mutate(o, {
      action: "failed",
      packageId: o.fulfillment.packages[0].id,
      note: "Synthetic validation rejection from official form",
    });
    assert.equal(o.fulfillment.packages[0].state, "registration_failed");
    assert.equal(o.status, "ready");
    o = await register(o, 7);
    assert.equal(o.fulfillment.packages[0].state, "awaiting_dropoff");
  });
  await check("only confirmed counter handover advances ready to shipped", async () => {
    await assert.rejects(
      mutate(primary, {
        action: "handover",
        packageIds: [primary.fulfillment.packages[0].id],
        confirmed: false,
      }),
    );
    primary = await handover(primary);
    assert.equal(primary.status, "shipped");
    assert.equal(primary.fulfillment.packages[0].state, "in_transit");
    assert.ok(primary.fulfillment.packages[0].handedOverAt);
  });
  await check(
    "tracking remains disabled without account keys and never calls carrier",
    async () => {
      assert.equal(ems.getEmsCapabilities().registration.enabled, false);
      assert.equal(ems.getEmsCapabilities().tracking.enabled, false);
      await assert.rejects(
        ems.refreshEmsTracking(
          token,
          primary.id,
          primary.fulfillment.version,
          operation(),
          primary.fulfillment.packages[0].id,
          true,
        ),
      );
      assert.equal(outboundAttempts, 0);
      assert.equal((await read(primary.id)).status, "shipped");
    },
  );
  await check(
    "delivery failure, customs delay and returns are never delivery completion",
    async () => {
      for (const state of ["customs_delay", "delivery_failed", "returned"]) {
        const changed = workflow.applyEmsTracking(
          primary,
          primary.fulfillment.packages[0].id,
          evidence(primary.fulfillment.packages[0], state),
          operation(),
          later,
        );
        assert.equal(changed.status, "shipped");
        assert.equal(changed.fulfillment.packages[0].state, state);
      }
    },
  );
  await check(
    "lookup failures and unknown statuses preserve previous delivery evidence",
    async () => {
      const tracked = workflow.applyEmsTracking(
        primary,
        primary.fulfillment.packages[0].id,
        evidence(primary.fulfillment.packages[0], "in_transit"),
        operation(),
        later,
      );
      const failed = workflow.applyEmsTracking(
        tracked,
        tracked.fulfillment.packages[0].id,
        { checkedAt: later, outcome: "unavailable", message: "Synthetic timeout" },
        operation(),
        later,
      );
      assert.equal(failed.status, "shipped");
      assert.equal(failed.fulfillment.packages[0].trackingCheck.outcome, "unavailable");
      assert.ok(failed.fulfillment.packages[0].trackingCheck.evidence.events.length);
      const unknown = workflow.applyEmsTracking(
        primary,
        primary.fulfillment.packages[0].id,
        { checkedAt: later, outcome: "unknown", message: "Unknown carrier status" },
        operation(),
        later,
      );
      assert.equal(unknown.status, "shipped");
    },
  );
  await check(
    "multiple boxes require all actual delivery records before order completion",
    async () => {
      const item = { ...base.items[0], qty: 2 };
      let o = await prepared({ items: [item], totalUsd: 478, totalKrw: 601000 });
      const packages = structuredClone(o.fulfillment.packages);
      packages[0].items[0].quantity = 1;
      packages[0].items[0].declaredValue = 230;
      packages.push({ ...structuredClone(packages[0]), id: "synthetic-second-parcel" });
      o = await complete(o, packages);
      assert.equal(workflow.emsIssues(o).length, 0);
      o = await register(o, 8);
      o = await register(o, 9, 1);
      o = await handover(o);
      const partial = workflow.applyEmsTracking(
        o,
        o.fulfillment.packages[0].id,
        evidence(o.fulfillment.packages[0], "delivered"),
        operation(),
        later,
      );
      assert.equal(partial.status, "shipped");
      assert.equal(partial.fulfillment.packages[0].state, "delivered");
      assert.equal(partial.fulfillment.packages[1].state, "in_transit");
      const all = workflow.applyEmsTracking(
        partial,
        partial.fulfillment.packages[1].id,
        evidence(partial.fulfillment.packages[1], "delivered"),
        operation(),
        later,
      );
      assert.equal(all.status, "done");
      const stale = workflow.applyEmsTracking(
        all,
        all.fulfillment.packages[0].id,
        evidence(all.fulfillment.packages[0], "in_transit", now),
        operation(),
        later,
      );
      assert.equal(stale.status, "done");
      assert.equal(stale.fulfillment.packages[0].state, "delivered");
    },
  );
  await check("customer projection removes internal fulfillment and audit", async () => {
    const projected = orderTypes.customerOrder(primary);
    assert.equal("fulfillment" in projected, false);
    assert.deepEqual(projected.items, primary.items);
  });
  await check(
    "legacy status mutation cannot bypass EMS shipping or downgrade completed orders",
    async () => {
      await assert.rejects(orders.updateOrder(token, primary.id, { status: "done" }));
      await assert.rejects(orders.updateOrder(token, primary.id, { tracking: tracking(10) }));
      const o = await fresh();
      await sql.query("update store_orders set status='done' where id=$1", [o.id]);
      assert.equal((await read(o.id)).status, "done");
      const result = await ems.prepareEmsOrders(token, [o.id]);
      assert.equal(result.orders.length, 0);
      assert.equal(result.errors.length, 1);
      await assert.rejects(orders.updateOrder(token, o.id, { status: "shipped" }));
      assert.equal((await read(o.id)).status, "done");
    },
  );
  await check(
    "cancel requests block dispatch and require shipment review after registration",
    async () => {
      let o = await register(await complete(await prepared()), 11);
      await orders.requestClaim({
        id: o.id,
        email: o.email,
        kind: "cancel",
        reason: "Synthetic cancellation request",
      });
      o = await read(o.id);
      await assert.rejects(handover(o));
      await assert.rejects(orders.decideClaim(token, o.id, "accept", "Synthetic review"));
      assert.equal((await read(o.id)).status, "ready");
    },
  );
  await check("client parcel fields cannot forge registration or delivery evidence", async () => {
    const o = await prepared();
    const packages = structuredClone(o.fulfillment.packages);
    packages[0].state = "delivered";
    packages[0].tracking = tracking(12);
    packages[0].handedOverAt = now;
    packages[0].deliveredAt = later;
    packages[0].trackingCheck = evidence(packages[0], "delivered");
    const saved = await mutate(o, {
      action: "save",
      recipient: o.fulfillment.recipient,
      packages,
    });
    const actual = saved.fulfillment.packages[0];
    assert.equal(actual.state, "preparing");
    for (const key of ["tracking", "handedOverAt", "deliveredAt", "trackingCheck"])
      assert.equal(actual[key], undefined, key);
  });
  await check("shared order CAS rejects stale claim or memo snapshots", async () => {
    const o = await fresh();
    const first = await read(o.id);
    const stale = await read(o.id);
    await orders.saveOrder(first, { ...first, note: "SYNTHETIC CURRENT MEMO" });
    await assert.rejects(
      orders.saveOrder(stale, {
        ...stale,
        claim: "cancel",
        claimStatus: "requested",
        claimReason: "Synthetic stale request",
      }),
      /ORDER_CHANGED/,
    );
    const latest = await read(o.id);
    assert.equal(latest.note, "SYNTHETIC CURRENT MEMO");
    assert.equal(latest.claim, undefined);
    const beforeStatusChange = await read(o.id);
    await sql.query("update store_orders set status='done' where id=$1", [o.id]);
    await assert.rejects(
      orders.saveOrder(beforeStatusChange, { ...beforeStatusChange, status: "ready" }),
      /ORDER_CHANGED/,
    );
    assert.equal((await read(o.id)).status, "done");
  });
  await check("legacy tracking metadata cannot accidentally create a second shipment", async () => {
    const o = await fresh();
    await sql.query("update store_orders set data=$2::jsonb where id=$1", [
      o.id,
      JSON.stringify({ ...o, tracking: tracking(13), courier: "EMS" }),
    ]);
    const result = await ems.prepareEmsOrders(token, [o.id]);
    assert.equal(result.orders.length, 0);
    assert.equal(result.errors.length, 1);
    assert.equal((await read(o.id)).fulfillment, undefined);
    assert.equal((await read(o.id)).tracking, tracking(13));
  });
  await check(
    "delivery evidence before handover and contradictory tracking cannot complete orders",
    async () => {
      const o = await register(await complete(await prepared()), 14);
      const p = o.fulfillment.packages[0];
      assert.throws(
        () => workflow.applyEmsTracking(o, p.id, evidence(p, "delivered"), operation(), later),
        /EMS_NOT_HANDED_OVER/,
      );
      const wrongEvidence = evidence(primary.fulfillment.packages[0], "delivered");
      wrongEvidence.evidence.tracking = tracking(999);
      const unchanged = workflow.applyEmsTracking(
        primary,
        primary.fulfillment.packages[0].id,
        wrongEvidence,
        operation(),
        later,
      );
      assert.equal(unchanged.status, "shipped");
      assert.equal(unchanged.fulfillment.packages[0].state, "in_transit");
    },
  );
  await check("domestic paid orders keep their original courier workflow outside EMS", async () => {
    let o = await fresh({ country: "KR", address: "SYNTHETIC DOMESTIC ADDRESS", city: "Seoul" });
    const prep = await ems.prepareEmsOrders(token, [o.id]);
    assert.equal(prep.orders.length, 0);
    assert.equal(prep.errors.length, 1);
    await assert.rejects(
      orders.updateOrder(token, o.id, { status: "shipped" }),
      /TRACKING_REQUIRED/,
    );
    o = await orders.updateOrder(token, o.id, { status: "ready" });
    assert.equal(o.status, "ready");
    o = await orders.updateOrder(token, o.id, {
      status: "shipped",
      tracking: "SYNTHETIC-DOMESTIC-TRACKING",
      courier: "SYNTHETIC COURIER",
    });
    assert.equal(o.status, "shipped");
    assert.equal(o.fulfillment, undefined);
    o = await orders.updateOrder(token, o.id, { status: "done" });
    assert.equal(o.status, "done");
    await assert.rejects(orders.updateOrder(token, o.id, { status: "shipped" }), /ORDER_COMPLETED/);
  });
  await check(
    "domestic unpaid orders cannot enter preparation or shipping accidentally",
    async () => {
      const o = await fresh({ country: "KR", pay: "transfer" });
      for (const status of ["ready", "shipped", "done", "confirmed"])
        await assert.rejects(
          orders.updateOrder(token, o.id, {
            status,
            tracking: "SYNTHETIC-UNPAID-TRACKING",
          }),
        );
      assert.equal((await read(o.id)).status, "wait");
    },
  );
  await check("all synthetic work creates no notifications or customer messages", async () => {
    assert.equal(outboundAttempts, 0);
    for (const table of ["telegram_order_outbox", "telegram_inbox_outbox", "inbox_messages"]) {
      const rows = await sql.query(`select count(*)::int as count from ${table}`);
      assert.equal(rows[0].count, 0, table);
    }
  });
  console.log(
    `${checks} EMS checks passed; ${outboundAttempts} outbound attempts; temporary PGlite only; no real customers, postal registrations, payments or notifications.`,
  );
} finally {
  await server.close();
  if (db) await (await db.getPglite()).close();
  process.chdir(previousCwd);
  await rm(temporary, { recursive: true, force: true });
}
