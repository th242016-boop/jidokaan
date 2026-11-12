// Uses a fresh in-memory PostgreSQL engine. Never reads production credentials.
// Optional module override supports an isolated dependency install outside the repo.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const { PGlite } = await import(process.env.JIDOKAAN_PGLITE_TEST_MODULE || "@electric-sql/pglite");
const sql = await readFile(new URL("../migrations/0013_overseas_shoe_prices.sql", import.meta.url), "utf8");
const db = new PGlite();
globalThis.fetch = async () => { throw new Error("OUTBOUND_NETWORK_BLOCKED"); };
let passed = 0;
async function check(label, test) { await test(); console.log(`PASS ${label}`); passed++; }
const snapshot = async () => (await db.query("select id, data, sort, updated_at from catalog_products order by id")).rows;
const run = () => db.transaction(tx => tx.exec(sql));
try {
  // Matches migrations/0002_catalog.sql exactly for the modified tables.
  await db.exec(`
    create table catalog_products (id text primary key, data jsonb not null, sort integer not null default 0, updated_at timestamptz not null default now());
    create table site_settings (key text primary key, value text not null);
    create table store_orders (id text primary key, data jsonb not null);
    create table paypal_checkout_drafts (id text primary key, payload jsonb not null);
  `);
  const boot = id => ({ id, priceUsd: 23000, priceKrw: 288000, compareAtKrw: 318000, name: { ko: "복싱화", en: "Boxing shoes" }, description: { ko: "국내 288,000원 / 해외 USD 230", en: "USD 230. Text USD 2300 must stay. USD 230", ja: "USD 230", metadata: 12 }, image: "/test.png", customizable: true, options: { enabled: false, skus: [] }, customField: { preserved: true } });
  const products = [boot("drone-custom"), boot("drone-mid"), { id: "accessory", priceUsd: 23000, priceKrw: 18900, description: { en: "USD 230" } }, boot("another-custom-model")];
  for (const [i, product] of products.entries()) await db.query("insert into catalog_products (id,data,sort,updated_at) values ($1,$2::jsonb,$3,'2026-10-01T00:00:00Z')", [product.id, JSON.stringify(product), i + 1]);
  const historical = { id: "HISTORIC", status: "paid", totalUsd: 315, shippingUsd: 85, items: [{ productId: "drone-custom", priceUsd: 230 }] };
  await db.query("insert into store_orders values ('HISTORIC',$1::jsonb)", [JSON.stringify(historical)]);
  await db.query("insert into paypal_checkout_drafts values ('PENDING',$1::jsonb)", [JSON.stringify(historical)]);
  await db.query("insert into site_settings values ('shipping_json',$1)", [JSON.stringify({ countryRates: { US: { usd: 85 } } })]);
  const before = await snapshot();
  await run();
  const after = await snapshot();
  await check("only two existing boot products reprice; domestic fields and other products preserved", () => {
    assert.equal(after.length, before.length);
    for (const original of before) {
      const result = after.find(row => row.id === original.id);
      if (!["drone-custom", "drone-mid"].includes(original.id)) { assert.deepEqual(result, original); continue; }
      const expected = structuredClone(original.data);
      expected.priceUsd = 25000;
      expected.description.ko = "국내 288,000원 / 해외 USD 250";
      expected.description.en = "USD 250. Text USD 2300 must stay. USD 250";
      expected.description.ja = "USD 250";
      assert.deepEqual(result.data, expected);
      assert.equal(result.sort, original.sort);
      assert.notDeepEqual(result.updated_at, original.updated_at);
    }
  });
  await check("backup contains both original product data and row metadata", async () => {
    const rows = (await db.query("select value from site_settings where key='overseas_shoe_prices_backup_20261112_v1'")).rows;
    assert.equal(rows.length, 1);
    const backup = JSON.parse(rows[0].value);
    assert.equal(backup.length, 2);
    for (const row of backup) {
      const original = before.find(value => value.id === row.id);
      assert.deepEqual(row.data, original.data);
      assert.equal(row.sort, original.sort);
      assert.equal(new Date(row.updated_at).toISOString(), new Date(original.updated_at).toISOString());
    }
  });
  const backupBefore = (await db.query("select value from site_settings where key='overseas_shoe_prices_backup_20261112_v1'")).rows[0].value;
  await check("historic paid orders, in-progress PayPal quotes and shipping settings are unchanged", async () => {
    assert.deepEqual((await db.query("select data from store_orders where id='HISTORIC'")).rows[0].data, historical);
    assert.deepEqual((await db.query("select payload from paypal_checkout_drafts where id='PENDING'")).rows[0].payload, historical);
    assert.equal((await db.query("select value from site_settings where key='shipping_json'")).rows[0].value, JSON.stringify({ countryRates: { US: { usd: 85 } } }));
  });
  await check("SQL replay is a no-op and preserves the first backup", async () => {
    await run();
    assert.deepEqual(await snapshot(), after);
    assert.equal((await db.query("select value from site_settings where key='overseas_shoe_prices_backup_20261112_v1'")).rows[0].value, backupBefore);
  });
  await check("future administrator price is not overwritten by replay", async () => {
    await db.exec("update catalog_products set data=jsonb_set(data,'{priceUsd}','26900'::jsonb) where id='drone-custom'");
    const future = await snapshot();
    await run();
    assert.deepEqual(await snapshot(), future);
    assert.equal((await db.query("select value from site_settings where key='overseas_shoe_prices_backup_20261112_v1'")).rows[0].value, backupBefore);
  });
  console.log(`${passed} SQL migration checks passed in fresh in-memory PGlite; production not accessed.`);
} finally { await db.close(); }
