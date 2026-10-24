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
  const recordPosted = (o, n, index = 0, op = operation(), confirmed = true) =>
    mutate(
      o,
      {
        action: "record_posted",
        packageId: o.fulfillment.packages[index].id,
        tracking: tracking(n),
        confirmed,
      },
      op,
    );
  await check(
    "already posted parcel records with blank new-registration metadata and explicit confirmation",
    async () => {
      const o = await prepared();
      assert.ok(workflow.emsIssues(o).length > 0);
      const saved = await recordPosted(o, 1001);
      assert.equal(saved.status, "shipped");
      const p = saved.fulfillment.packages[0];
      assert.equal(p.state, "in_transit");
      assert.equal(p.tracking, tracking(1001));
      assert.ok(p.handedOverAt);
      assert.equal(p.postingRecordSource, "admin_confirmation");
      assert.equal(p.grossWeightGrams, null);
      assert.equal(p.items[0].descriptionEn, "");
      assert.equal(p.items[0].hsCode, "");
      assert.equal(p.items[0].originCountry, "");
      assert.equal(saved.fulfillment.recipient.englishConfirmed, false);
      assert.equal(p.deliveredAt, undefined);
      assert.equal(p.trackingCheck, undefined);
      assert.equal(outboundAttempts, 0);
    },
  );
  await check(
    "already posted recording rejects absent confirmation and invalid tracking",
    async () => {
      const o = await prepared();
      await assert.rejects(recordPosted(o, 1002, 0, operation(), false), /EMS_CONFIRM_REQUIRED/);
      for (const invalid of ["", "SHORT", "EE123456789KR-EXTRA"])
        await assert.rejects(
          mutate(o, {
            action: "record_posted",
            packageId: o.fulfillment.packages[0].id,
            tracking: invalid,
            confirmed: true,
          }),
          /EMS_TRACKING_INVALID/,
        );
      assert.equal((await read(o.id)).status, "ready");
      assert.equal((await read(o.id)).fulfillment.packages[0].state, "preparing");
    },
  );
  await check(
    "already posted recording is idempotent across concurrent click and old-version retry",
    async () => {
      const o = await prepared();
      const op = operation();
      const results = await Promise.allSettled([
        recordPosted(o, 1003, 0, op),
        recordPosted(o, 1003, 0, op),
      ]);
      assert.ok(results.every((r) => r.status === "fulfilled"));
      const saved = await read(o.id);
      assert.equal(saved.fulfillment.audit.filter((a) => a.operationId === op).length, 1);
      const retried = await recordPosted(o, 1003, 0, op);
      assert.equal(retried.fulfillment.version, saved.fulfillment.version);
      assert.equal(
        retried.fulfillment.packages[0].handedOverAt,
        saved.fulfillment.packages[0].handedOverAt,
      );
      await assert.rejects(recordPosted(saved, 1004, 0, op), /EMS_OPERATION_CONFLICT/);
      await assert.rejects(recordPosted(saved, 1003));
    },
  );
  await check(
    "already posted recording uses shared tracking ownership and blocks duplicates",
    async () => {
      const a = await prepared();
      const b = await prepared();
      const results = await Promise.allSettled([recordPosted(a, 1005), recordPosted(b, 1005)]);
      assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
      assert.equal(results.filter((r) => r.status === "rejected").length, 1);
      const saved = await Promise.all([read(a.id), read(b.id)]);
      assert.equal(saved.filter((o) => o.status === "shipped").length, 1);
      assert.equal(
        saved.filter((o) => o.fulfillment.packages[0].tracking === tracking(1005)).length,
        1,
      );
      const historic = await prepared();
      await assert.rejects(recordPosted(historic, 5), /EMS_DUPLICATE_TRACKING/);
    },
  );
  await check(
    "already posted recording cannot bypass unknown registration or active claims",
    async () => {
      let uncertain = await prepared();
      uncertain = await mutate(uncertain, {
        action: "uncertain",
        packageId: uncertain.fulfillment.packages[0].id,
        note: "Synthetic response delay: registration status uncertain",
      });
      await assert.rejects(recordPosted(uncertain, 1006));
      assert.equal(
        (await read(uncertain.id)).fulfillment.packages[0].state,
        "registration_unknown",
      );
      let claimed = await prepared();
      await orders.requestClaim({
        id: claimed.id,
        email: claimed.email,
        kind: "cancel",
        reason: "Synthetic claim awaiting review",
      });
      claimed = await read(claimed.id);
      await assert.rejects(recordPosted(claimed, 1006), /EMS_ORDER_INACTIVE/);
      assert.equal((await read(claimed.id)).status, "ready");
    },
  );
  await check(
    "already posted recording cannot ship unpaid, cancelled or completed orders",
    async () => {
      for (const status of ["wait", "cancel", "done", "confirmed"]) {
        const o = await prepared();
        await sql.query("update store_orders set status=$2 where id=$1", [o.id, status]);
        await assert.rejects(recordPosted(o, 1007), /EMS_ORDER_INACTIVE/);
        assert.equal((await read(o.id)).status, status);
        assert.equal((await read(o.id)).fulfillment.packages[0].tracking, undefined);
      }
    },
  );
  await check(
    "already posted recording still enforces quantity, value and currency allocation",
    async () => {
      for (const patch of [
        { quantity: 2 },
        { declaredValue: 1 },
        { declaredValue: -1 },
        { currency: "EUR" },
        { sourceItemIndex: 99 },
      ]) {
        let o = await prepared();
        const packages = structuredClone(o.fulfillment.packages);
        Object.assign(packages[0].items[0], patch);
        o = await mutate(o, { action: "save", recipient: o.fulfillment.recipient, packages });
        await assert.rejects(recordPosted(o, 1008));
        assert.equal((await read(o.id)).status, "ready");
      }
    },
  );
  await check(
    "already posted recording keeps multiple-parcel progression distinct from delivery",
    async () => {
      let o = await prepared({
        items: [{ ...base.items[0], qty: 2 }],
        totalUsd: 478,
        totalKrw: 601000,
      });
      const packages = structuredClone(o.fulfillment.packages);
      packages[0].items[0].quantity = 1;
      packages[0].items[0].declaredValue = 230;
      packages.push({ ...structuredClone(packages[0]), id: "already-posted-second" });
      o = await mutate(o, { action: "save", recipient: o.fulfillment.recipient, packages });
      o = await recordPosted(o, 1009);
      assert.equal(o.status, "shipped");
      assert.equal(o.fulfillment.packages[0].state, "in_transit");
      assert.equal(o.fulfillment.packages[1].state, "preparing");
      o = await recordPosted(o, 1010, 1);
      assert.equal(o.status, "shipped");
      assert.ok(o.fulfillment.packages.every((p) => p.state === "in_transit"));
      assert.ok(o.fulfillment.packages.every((p) => !p.deliveredAt));
      const partial = workflow.applyEmsTracking(
        o,
        o.fulfillment.packages[0].id,
        evidence(o.fulfillment.packages[0], "delivered"),
        operation(),
        later,
      );
      assert.equal(partial.status, "shipped");
      const delivered = workflow.applyEmsTracking(
        partial,
        partial.fulfillment.packages[1].id,
        evidence(partial.fulfillment.packages[1], "delivered"),
        operation(),
        later,
      );
      assert.equal(delivered.status, "done");
    },
  );
  await check(
    "already posted recording rejects stale preparation revisions and permits known failed drafts",
    async () => {
      const stale = await prepared();
      let current = await mutate(stale, {
        action: "failed",
        packageId: stale.fulfillment.packages[0].id,
        note: "Synthetic previous failed online registration, later posted at counter",
      });
      await assert.rejects(recordPosted(stale, 1011), /ORDER_CHANGED/);
      current = await recordPosted(current, 1011);
      assert.equal(current.status, "shipped");
      assert.equal(current.fulfillment.packages[0].state, "in_transit");
      assert.ok(current.fulfillment.audit.some((a) => a.action === "failed"));
      assert.ok(current.fulfillment.audit.some((a) => a.action === "record_posted"));
    },
  );
  const manualComplete = async (o, op = operation(), confirmed = true, snapshot = null) => {
    const current = snapshot ?? (await ems.readEmsOrder(token, o.id));
    return ems.completeEmsDelivery(
      token,
      o.id,
      current.order.fulfillment?.version ?? 0,
      current.revision,
      op,
      confirmed,
    );
  };
  const legacyShipped = async (n) => {
    const o = await fresh();
    const shipped = { ...o, status: "shipped", courier: "EMS", tracking: tracking(n) };
    await sql.query("update store_orders set data=$2::jsonb,status=$3 where id=$1", [
      o.id,
      JSON.stringify(shipped),
      "shipped",
    ]);
    return read(o.id);
  };
  await check(
    "manual delivery completion requires authentication and explicit confirmation",
    async () => {
      const o = await recordPosted(await prepared(), 2001);
      const snapshot = await ems.readEmsOrder(token, o.id);
      await assert.rejects(
        ems.completeEmsDelivery(
          "wrong",
          o.id,
          o.fulfillment.version,
          snapshot.revision,
          operation(),
          true,
        ),
        /AUTH/,
      );
      await assert.rejects(manualComplete(o, operation(), false), /EMS_CONFIRM_REQUIRED/);
      assert.equal((await read(o.id)).status, "shipped");
      assert.equal((await read(o.id)).deliveryCompletion, undefined);
    },
  );
  await check(
    "manual completion records admin provenance without fabricating carrier delivery",
    async () => {
      const o = await recordPosted(await prepared(), 2002);
      const op = operation();
      const completed = await manualComplete(o, op);
      assert.equal(completed.status, "done");
      assert.equal(completed.deliveryCompletion.source, "admin_confirmation");
      assert.equal(completed.deliveryCompletion.operationId, op);
      assert.ok(Number.isFinite(Date.parse(completed.deliveryCompletion.recordedAt)));
      const p = completed.fulfillment.packages[0];
      assert.equal(p.state, "delivered");
      assert.equal(p.manualDelivery.source, "admin_confirmation");
      assert.equal(p.manualDelivery.operationId, op);
      assert.equal(p.deliveredAt, undefined);
      assert.equal(p.trackingCheck, undefined);
      assert.equal(outboundAttempts, 0);
      const projected = orderTypes.customerOrder(completed);
      assert.equal(projected.status, "done");
      assert.equal("deliveryCompletion" in projected, false);
      assert.equal("fulfillment" in projected, false);
    },
  );
  await check(
    "manual completion supports legacy overseas shipments without inventing parcels",
    async () => {
      const o = await legacyShipped(2003);
      assert.equal(o.fulfillment, undefined);
      const completed = await manualComplete(o);
      assert.equal(completed.status, "done");
      assert.equal(completed.fulfillment, undefined);
      assert.equal(completed.tracking, o.tracking);
      assert.equal(completed.deliveryCompletion.source, "admin_confirmation");
      assert.deepEqual(completed.items, o.items);
    },
  );
  await check(
    "manual completion rejects unpaid, unshipped, cancelled and already completed orders",
    async () => {
      for (const status of [
        "wait",
        "paid",
        "ready",
        "cancel",
        "done",
        "confirmed",
        "return",
        "exchange",
      ]) {
        const o = await legacyShipped(2004 + sequence);
        await sql.query("update store_orders set status=$2 where id=$1", [o.id, status]);
        await assert.rejects(manualComplete(o));
        assert.equal((await read(o.id)).status, status);
        assert.equal((await read(o.id)).deliveryCompletion, undefined);
      }
      const noTracking = await legacyShipped(2020);
      await sql.query("update store_orders set data=data-'tracking' where id=$1", [noTracking.id]);
      await assert.rejects(manualComplete(noTracking));
      assert.equal((await read(noTracking.id)).status, "shipped");
    },
  );
  await check(
    "manual completion concurrent retries retain one audit and original confirmation time",
    async () => {
      for (const legacy of [false, true]) {
        const o = legacy ? await legacyShipped(2022) : await recordPosted(await prepared(), 2021);
        const snapshot = await ems.readEmsOrder(token, o.id);
        const op = operation();
        const results = await Promise.allSettled([
          manualComplete(o, op, true, snapshot),
          manualComplete(o, op, true, snapshot),
        ]);
        assert.ok(results.every((r) => r.status === "fulfilled"));
        const completed = await read(o.id);
        const retry = await manualComplete(o, op, true, snapshot);
        assert.deepEqual(retry.deliveryCompletion, completed.deliveryCompletion);
        if (completed.fulfillment) {
          assert.equal(completed.fulfillment.audit.filter((a) => a.operationId === op).length, 1);
          assert.equal(retry.fulfillment.version, completed.fulfillment.version);
        }
        await assert.rejects(manualComplete(completed));
        assert.deepEqual((await read(o.id)).deliveryCompletion, completed.deliveryCompletion);
      }
    },
  );
  await check("manual completion rejects stale legacy and modern order revisions", async () => {
    for (const legacy of [false, true]) {
      const o = legacy ? await legacyShipped(2024) : await recordPosted(await prepared(), 2023);
      const stale = await ems.readEmsOrder(token, o.id);
      await orders.updateOrder(token, o.id, { note: "SYNTHETIC CHANGED SINCE REVIEW" });
      await assert.rejects(manualComplete(o, operation(), true, stale), /ORDER_CHANGED/);
      assert.equal((await read(o.id)).status, "shipped");
      assert.equal((await read(o.id)).deliveryCompletion, undefined);
    }
  });
  await check(
    "manual completion selected batch returns success and failure separately",
    async () => {
      const modern = await recordPosted(await prepared(), 2025);
      const legacy = await legacyShipped(2026);
      const waiting = await fresh({ pay: "transfer" });
      const ready = await prepared();
      const selected = [modern, legacy, waiting, ready];
      const results = await Promise.allSettled(selected.map((o) => manualComplete(o)));
      assert.equal(results.filter((r) => r.status === "fulfilled").length, 2);
      assert.equal(results.filter((r) => r.status === "rejected").length, 2);
      assert.equal((await read(modern.id)).status, "done");
      assert.equal((await read(legacy.id)).status, "done");
      assert.equal((await read(waiting.id)).status, "wait");
      assert.equal((await read(ready.id)).status, "ready");
    },
  );
  await check(
    "manual completion blocks unposted parcels but permits explicit resolution of stale tracking exceptions",
    async () => {
      let o = await prepared({
        items: [{ ...base.items[0], qty: 2 }],
        totalUsd: 478,
        totalKrw: 601000,
      });
      const packages = structuredClone(o.fulfillment.packages);
      packages[0].items[0].quantity = 1;
      packages[0].items[0].declaredValue = 230;
      packages.push({ ...structuredClone(packages[0]), id: "manual-complete-second" });
      o = await mutate(o, { action: "save", recipient: o.fulfillment.recipient, packages });
      o = await recordPosted(o, 2027);
      await assert.rejects(manualComplete(o));
      assert.equal((await read(o.id)).status, "shipped");
      o = await recordPosted(o, 2028, 1);
      for (const state of ["registration_unknown", "awaiting_dropoff", "preparing"]) {
        const blocked = structuredClone(o);
        blocked.fulfillment.packages[1].state = state;
        assert.throws(() => workflow.applyManualDeliveryCompletion(blocked, operation(), true));
      }
      for (const state of ["customs_delay", "delivery_failed", "returned"]) {
        const staleException = workflow.applyEmsTracking(
          o,
          o.fulfillment.packages[1].id,
          evidence(o.fulfillment.packages[1], state),
          operation(),
          later,
        );
        const resolved = workflow.applyManualDeliveryCompletion(staleException, operation(), true);
        assert.equal(resolved.status, "done");
        assert.equal(resolved.deliveryCompletion.source, "admin_confirmation");
        assert.equal(resolved.fulfillment.packages[1].trackingCheck.evidence.state, state);
        assert.equal(resolved.fulfillment.packages[1].deliveredAt, undefined);
      }
      const completed = await manualComplete(o);
      assert.equal(completed.status, "done");
      assert.ok(completed.fulfillment.packages.every((p) => p.state === "delivered"));
      assert.ok(
        completed.fulfillment.packages.every(
          (p) => p.manualDelivery.source === "admin_confirmation",
        ),
      );
      assert.ok(completed.fulfillment.packages.every((p) => p.deliveredAt === undefined));
    },
  );
  await check(
    "manual completion preserves real carrier evidence on already delivered parcels",
    async () => {
      let o = await prepared({
        items: [{ ...base.items[0], qty: 2 }],
        totalUsd: 478,
        totalKrw: 601000,
      });
      const packages = structuredClone(o.fulfillment.packages);
      packages[0].items[0].quantity = 1;
      packages[0].items[0].declaredValue = 230;
      packages.push({ ...structuredClone(packages[0]), id: "manual-carrier-second" });
      o = await mutate(o, { action: "save", recipient: o.fulfillment.recipient, packages });
      o = await recordPosted(o, 2029);
      o = await recordPosted(o, 2030, 1);
      const partial = workflow.applyEmsTracking(
        o,
        o.fulfillment.packages[0].id,
        evidence(o.fulfillment.packages[0], "delivered"),
        operation(),
        later,
      );
      await orders.saveOrder(o, partial);
      const completed = await manualComplete(partial);
      assert.equal(completed.status, "done");
      assert.equal(completed.fulfillment.packages[0].deliveredAt, later);
      assert.deepEqual(
        completed.fulfillment.packages[0].trackingCheck,
        partial.fulfillment.packages[0].trackingCheck,
      );
      assert.equal(completed.fulfillment.packages[1].deliveredAt, undefined);
      assert.equal(completed.fulfillment.packages[1].manualDelivery.source, "admin_confirmation");
      const staleProvider = workflow.applyEmsTracking(
        completed,
        completed.fulfillment.packages[1].id,
        evidence(completed.fulfillment.packages[1], "in_transit", now),
        operation(),
        later,
      );
      assert.equal(staleProvider.status, "done");
    },
  );
  await check("manual completion cannot bypass pending or accepted claims", async () => {
    const o = await legacyShipped(2031);
    await orders.requestClaim({
      id: o.id,
      email: o.email,
      kind: "return",
      reason: "SYNTHETIC RETURN REQUEST",
    });
    await assert.rejects(manualComplete(o));
    assert.equal((await read(o.id)).status, "shipped");
    assert.equal((await read(o.id)).deliveryCompletion, undefined);
    const accepted = { ...(await read(o.id)), claimStatus: "accepted" };
    await sql.query("update store_orders set data=$2::jsonb where id=$1", [
      o.id,
      JSON.stringify(accepted),
    ]);
    await assert.rejects(manualComplete(o));
    assert.equal((await read(o.id)).status, "shipped");
    assert.equal((await read(o.id)).deliveryCompletion, undefined);
  });
  await check("competing manual completions preserve exactly one confirmation record", async () => {
    const o = await legacyShipped(2032);
    const snapshot = await ems.readEmsOrder(token, o.id);
    const ops = [operation(), operation()];
    const results = await Promise.allSettled(
      ops.map((op) => manualComplete(o, op, true, snapshot)),
    );
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(results.filter((r) => r.status === "rejected").length, 1);
    const winner = results.find((r) => r.status === "fulfilled").value;
    assert.equal(
      (await read(o.id)).deliveryCompletion.operationId,
      winner.deliveryCompletion.operationId,
    );
    assert.equal((await read(o.id)).status, "done");
  });
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
