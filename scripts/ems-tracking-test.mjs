// Synthetic XML only. No real postal number, customer data, API key or outbound network.
import assert from "node:assert/strict";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
let outbound = 0;
globalThis.fetch = async () => {
  outbound++;
  throw new Error("OUTBOUND_BLOCKED");
};
const server = await createServer({
  configFile: false,
  root,
  server: { middlewareMode: true },
  appType: "custom",
});
let count = 0;
const check = async (name, fn) => {
  await fn();
  count++;
  console.log(`PASS ${name}`);
};
const tracking = "EE123456789KR";
const checkedAt = "2026-10-24T10:00:00.000Z";
const enabled = {
  EPOST_TRACKING_ENABLED: "1",
  EPOST_TRACKING_SERVICE_KEY: "FAKE-KEY-ONLY",
  EPOST_TRACKING_HTTPS_VERIFIED: "1",
};
const event = (status, date = "2026-10-23", time = "12:30") =>
  `<history><date>${date}</date><time>${time}</time><Statue>${status}</Statue><location>TEST POST</location><remark>TEST ONLY</remark></history>`;
const xml = (
  status = "배달완료",
  events = event("배달완료"),
  date = "2026-10-23",
  number = tracking,
) =>
  `<?xml version="1.0" encoding="UTF-8"?><response><header><successYn>Y</successYn><requestRegiNo>${number}</requestRegiNo></header><item><regiNo>${number}</regiNo><trackState>${status}</trackState><receiveDate>${date}</receiveDate>${events}</item></response>`;
try {
  const {
    parseEmsTrackingXml: parse,
    fetchEmsTracking: fetchTracking,
    getEmsTrackingCapabilities: cap,
  } = await server.ssrLoadModule("/src/lib/ems-tracking.server.ts");
  await check("disabled without approved key", () => assert.equal(cap({}).enabled, false));
  await check("requires independent HTTPS verification", () =>
    assert.equal(cap({ ...enabled, EPOST_TRACKING_HTTPS_VERIFIED: "" }).enabled, false),
  );
  await check("requires explicit enable flag", () =>
    assert.equal(cap({ ...enabled, EPOST_TRACKING_ENABLED: "" }).enabled, false),
  );
  await check("disabled fetch never calls network", async () => {
    const r = await fetchTracking(tracking, { env: {} });
    assert.equal(r.outcome, "unavailable");
    assert.equal(outbound, 0);
  });
  await check("explicit dated delivery becomes delivered evidence", () => {
    const r = parse(xml(), tracking, checkedAt);
    assert.equal(r.outcome, "ok");
    assert.equal(r.evidence.state, "delivered");
    assert.equal(r.evidence.deliveredAt, "2026-10-23T12:30:00");
  });
  await check("summary needs valid delivered date", () =>
    assert.equal(parse(xml("배달완료", "", ""), tracking, checkedAt).outcome, "unknown"),
  );
  await check("summary with actual receive date allowed", () =>
    assert.equal(
      parse(xml("배달완료", ""), tracking, checkedAt).evidence.deliveredAt,
      "2026-10-23",
    ),
  );
  await check("invalid calendar date cannot complete", () =>
    assert.equal(
      parse(xml("배달완료", event("배달완료", "2026-02-30"), "2026-02-30"), tracking, checkedAt)
        .outcome,
      "unknown",
    ),
  );
  await check("future date cannot complete", () =>
    assert.equal(
      parse(xml("배달완료", event("배달완료", "2027-01-01"), "2027-01-01"), tracking, checkedAt)
        .outcome,
      "unknown",
    ),
  );
  await check("not delivered never substring-matches delivered", () => {
    const r = parse(xml("not delivered", event("not delivered")), tracking, checkedAt);
    assert.equal(r.evidence.state, "delivery_failed");
    assert.equal(r.evidence.deliveredAt, undefined);
  });
  await check("customs delay distinct from delivery", () =>
    assert.equal(
      parse(xml("통관지연", event("통관지연")), tracking, checkedAt).evidence.state,
      "customs_delay",
    ),
  );
  await check("return distinct from delivery", () =>
    assert.equal(parse(xml("반송", event("반송")), tracking, checkedAt).evidence.state, "returned"),
  );
  await check("transit distinct from delivery", () =>
    assert.equal(
      parse(xml("배송중", event("발송")), tracking, checkedAt).evidence.state,
      "in_transit",
    ),
  );
  await check("unknown postal status remains unknown", () =>
    assert.equal(
      parse(xml("UNKNOWN CODE", event("UNKNOWN CODE"), ""), tracking, checkedAt).outcome,
      "unknown",
    ),
  );
  await check("newer failure overrides stale delivery summary", () => {
    const r = parse(
      xml("배달완료", event("배달완료", "2026-10-22") + event("반송", "2026-10-24"), "2026-10-22"),
      tracking,
      checkedAt,
    );
    assert.equal(r.evidence.state, "returned");
    assert.equal(r.evidence.deliveredAt, undefined);
  });
  await check("conflicting summary and delivered history stays unknown", () =>
    assert.equal(parse(xml("반송", event("배달완료")), tracking, checkedAt).outcome, "unknown"),
  );
  await check("newer unknown history prevents stale delivered summary", () =>
    assert.equal(
      parse(xml("배달완료", event("UNKNOWN CODE", "2026-10-24"), "2026-10-23"), tracking, checkedAt)
        .outcome,
      "unknown",
    ),
  );
  await check("mismatched postal number rejected", () =>
    assert.equal(
      parse(xml("배달완료", event("배달완료"), "2026-10-23", "EE000000000KR"), tracking, checkedAt)
        .outcome,
      "unavailable",
    ),
  );
  await check("ambiguous multiple result IDs rejected", () =>
    assert.equal(
      parse(xml().replace("</item>", "<regiNo>EE000000000KR</regiNo></item>"), tracking, checkedAt)
        .outcome,
      "unavailable",
    ),
  );
  await check("provider failure response preserves state", () =>
    assert.equal(
      parse(xml().replace("<successYn>Y", "<successYn>N"), tracking, checkedAt).outcome,
      "unavailable",
    ),
  );
  await check("malformed XML and duplicate success rejected", () => {
    assert.equal(parse("<broken>", tracking, checkedAt).outcome, "unavailable");
    assert.equal(
      parse(xml().replace("</header>", "<successYn>Y</successYn></header>"), tracking, checkedAt)
        .outcome,
      "unavailable",
    );
  });
  await check("DTD and external entities rejected without evaluation", () =>
    assert.equal(
      parse(
        '<!DOCTYPE response [<!ENTITY x SYSTEM "file:///etc/passwd">]>' +
          xml().replace(/<\?xml.*?\?>/, ""),
        tracking,
        checkedAt,
      ).outcome,
      "unavailable",
    ),
  );
  await check("oversized XML rejected", () =>
    assert.equal(parse(xml() + " ".repeat(530000), tracking, checkedAt).outcome, "unavailable"),
  );
  await check("mock successful request is HTTPS with exact decoded key and number", async () => {
    let called = 0;
    const r = await fetchTracking(tracking, {
      env: { ...enabled, EPOST_TRACKING_SERVICE_KEY: "FAKE%2BONLY%3D" },
      now: () => new Date(checkedAt),
      fetchImpl: async (url, options) => {
        called++;
        assert.equal(url.protocol, "https:");
        assert.equal(url.searchParams.get("ServiceKey"), "FAKE+ONLY=");
        assert.equal(url.searchParams.get("rgist"), tracking);
        assert.equal(options.redirect, "error");
        return new Response(xml());
      },
    });
    assert.equal(called, 1);
    assert.equal(r.evidence.state, "delivered");
  });
  await check("HTTP failures and thrown fetch errors do not leak credentials", async () => {
    for (const fetchImpl of [
      async () => new Response("failure", { status: 503 }),
      async () => {
        throw new Error("https://private?ServiceKey=SECRET");
      },
    ]) {
      const r = await fetchTracking(tracking, { env: enabled, fetchImpl });
      assert.equal(r.outcome, "unavailable");
      assert.equal(JSON.stringify(r).includes("SECRET"), false);
    }
  });
  await check("response delay is bounded without retry", async () => {
    let calls = 0;
    const start = Date.now();
    const r = await fetchTracking(tracking, {
      env: enabled,
      timeoutMs: 20,
      fetchImpl: () => {
        calls++;
        return new Promise(() => {});
      },
    });
    assert.equal(r.outcome, "unavailable");
    assert.equal(calls, 1);
    assert.ok(Date.now() - start < 1500);
  });
  await check("oversized streaming body blocked", async () => {
    const r = await fetchTracking(tracking, {
      env: enabled,
      fetchImpl: async () => new Response("x".repeat(530000)),
    });
    assert.equal(r.outcome, "unavailable");
  });
  await check("invalid input and disabled adapter cause zero real requests", async () => {
    assert.equal((await fetchTracking("not-a-number", { env: enabled })).outcome, "unavailable");
    assert.equal(outbound, 0);
  });
  console.log(
    `EMS tracking: ${count} synthetic checks passed. Actual external requests: ${outbound}.`,
  );
} finally {
  await server.close();
}
