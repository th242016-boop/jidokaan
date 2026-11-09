// Disposable PGlite only. No live data, customers, or external notification services.
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const temp = await mkdtemp(resolve(tmpdir(), 'jidokaan-analytics-test-'));
const previous = process.cwd();
process.env.DATABASE_URL = '';
process.env.JIDOKAAN_LOCAL_ONLY = '1';
process.env.LIVE_ORIGIN = 'http://127.0.0.1:9';
for (const key of ['TELEGRAM_BOT_TOKEN', 'RESEND_API_KEY', 'INQUIRY_EMAIL_FROM']) delete process.env[key];
process.chdir(temp);
const server = await createServer({configFile:false, root, resolve:{alias:{'@':resolve(root,'src')}}, server:{middlewareMode:true}, appType:'custom'});
const oldFetch = globalThis.fetch;
globalThis.fetch = async () => { throw new Error('Unexpected outbound request blocked'); };
let checks = 0;
const check = async (name, fn) => { await fn(); checks++; console.log(`PASS ${name}`); };
try {
  const db = await server.ssrLoadModule('/src/lib/db.ts');
  const auth = await server.ssrLoadModule('/src/lib/admin-auth.server.ts');
  const analytics = await server.ssrLoadModule('/src/lib/analytics.server.ts');
  const helpers = await server.ssrLoadModule('/src/lib/analytics-summary.ts');
  const api = (await server.ssrLoadModule('/src/routes/api/analytics.ts')).Route.options.server.handlers;
  const sql = await db.getSql(), token = await auth.createSession();
  await sql.query(`create table if not exists store_analytics (id text primary key,data jsonb not null,created_at timestamptz not null default now())`);
  await sql.query(`insert into catalog_products(id,data,sort) values ('drone-custom', $1::jsonb,0) on conflict(id) do update set data=excluded.data`, [JSON.stringify({id:'drone-custom',name:{ko:'테스트 커스텀 복싱화'},image:'/products/store/drone-main.png'})]);
  const hit = async (id, data, at = '2026-11-09T03:00:00Z') => sql.query('insert into store_analytics(id,data,created_at) values($1,$2::jsonb,$3::timestamptz)', [id, JSON.stringify({id,type:'page',path:'/',source:'direct',keyword:'',campaign:'', ...data}), at]);
  await sql.query(`insert into store_analytics(id,data,created_at) select 'BULK-'||n, jsonb_build_object('id','BULK-'||n,'type','page','path','/products/drone-custom','source','search.naver.com','medium','organic','keyword','','campaign',''), '2026-11-09T03:00:00Z'::timestamptz from generate_series(1,610) n`);
  await hit('KEYWORD',{source:'google.com',keyword:'boxing shoes',medium:'organic'});
  await hit('SELF',{source:'jidokaan.com'});
  await hit('OAUTH',{source:'accounts.google.com'});
  await hit('CART',{type:'cart'});
  await hit('ORDER',{type:'order'});
  await hit('START',{},'2026-11-08T15:00:00Z');
  await hit('BEFORE',{},'2026-11-08T14:59:59Z');
  await hit('END',{},'2026-11-09T14:59:59Z');
  await hit('AFTER',{},'2026-11-09T15:00:00Z');
  const summary = await analytics.summarizeAnalytics(token,'2026-11-09','2026-11-09');
  await check('period aggregates all 615 pageviews, not latest 500', async () => {
    assert.equal(summary.totals.pageViews, 615);
    assert.equal(summary.totals.cartEvents,1); assert.equal(summary.totals.orderEvents,1);
    assert.equal(summary.sources.find(r=>r.key==='direct').count,2);
  });
  await check('self and OAuth referrals excluded only from acquisition ranking', async () => {
    assert.equal(summary.excludedSourceViews,2);
    assert.ok(!summary.sources.some(r=>r.key==='jidokaan.com'||r.key==='accounts.google.com'));
  });
  await check('search query unavailable is explicit and no keyword invented', async () => {
    assert.deepEqual(summary.search,{pageViews:611,withKeyword:1,withoutKeyword:610});
    assert.deepEqual(summary.keywords,[{key:'boxing shoes',label:'boxing shoes',count:1}]);
  });
  await check('real catalog name and thumbnail attached to top page', async () => {
    assert.deepEqual(summary.pages[0],{path:'/products/drone-custom',title:'테스트 커스텀 복싱화',image:'/products/store/drone-main.png',kind:'product',count:610});
  });
  await check('Korean midnight and valid date bounds', async () => {
    assert.deepEqual(helpers.analyticsDateRange(7,new Date('2026-11-08T16:00:00Z')),{from:'2026-11-03',to:'2026-11-09'});
    for(const dates of [['2026-02-30','2026-03-01'],['2026-11-10','2026-11-09'],['2025-01-01','2026-11-09']]) assert.throws(()=>helpers.analyticsPeriod(...dates),/PERIOD_INVALID/);
  });
  await check('sanitization removes private query and fragment tokens', async () => {
    await analytics.trackHit({path:'/contact?token=PRIVATE#thread=SECRET',landing:'/login?code=SECRET',referrer:'https://search.naver.com/search.naver?query=SECRET',source:'naver',keyword:'boxing'});
    const rows = await sql.query(`select data from store_analytics where id like 'AN-%'`);
    assert.equal(rows[0].data.path,'/contact'); assert.equal(rows[0].data.landing,'/login'); assert.equal(rows[0].data.referrer,'https://search.naver.com');
    assert.ok(!JSON.stringify(rows[0]).includes('SECRET'));
    assert.equal(helpers.analyticsSafePath('//evil.test/path'),'/');
  });
  const get = (query='',bearer='') => api.GET({request:new Request(`https://jidokaan.com/api/analytics${query}`,{headers:bearer?{authorization:`Bearer ${bearer}`}:{}})});
  await check('admin bearer required and errors distinguish auth/date', async () => {
    assert.equal((await get('?view=summary')).status,401);
    assert.equal((await get('?view=summary&from=wrong',token)).status,400);
    const response = await get('?view=summary&from=2026-11-09&to=2026-11-09',token);
    assert.equal(response.status,200); assert.ok((await response.json()).summary);
  });
  await check('legacy feed compatible and bounded', async () => {
    const result = await (await get(`?token=${encodeURIComponent(token)}`)).json();
    assert.equal(result.hits.length,500);
  });
  await check('malformed and oversized tracking payloads rejected', async () => {
    const post = (body) => api.POST({request:new Request('https://jidokaan.com/api/analytics',{method:'POST',body})});
    assert.equal((await post('[]')).status,400); assert.equal((await post(JSON.stringify({keyword:'x'.repeat(9000)}))).status,413);
  });
  console.log(`${checks} analytics checks passed.`);
} finally {
  globalThis.fetch = oldFetch;
  await server.close();
  if(globalThis.__pgliteInstanceV2__) await (await globalThis.__pgliteInstanceV2__).close();
  process.chdir(previous);
  await rm(temp,{recursive:true,force:true});
}
