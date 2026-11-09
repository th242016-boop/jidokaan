// Disposable local DB. No live accounts, payment, emails or Telegram calls.
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const temp = await mkdtemp(resolve(tmpdir(), 'jidokaan-acquisition-'));
const previous = process.cwd();
process.env.DATABASE_URL = '';
process.env.JIDOKAAN_LOCAL_ONLY = '1';
process.env.BETTER_AUTH_URL = 'http://localhost:8080';
for (const key of ['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','KAKAO_CLIENT_ID','KAKAO_CLIENT_SECRET','NAVER_CLIENT_ID','NAVER_CLIENT_SECRET','RESEND_API_KEY','TELEGRAM_BOT_TOKEN']) delete process.env[key];
process.chdir(temp);
const server = await createServer({configFile:false,root,resolve:{alias:{'@':resolve(root,'src')}},server:{middlewareMode:true},appType:'custom'});
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => { throw new Error('External network blocked in signup test'); };
let db, count=0;
const check = async (name,fn) => { await fn(); count++; console.log(`PASS ${name}`); };
try {
  const a = await server.ssrLoadModule('/src/lib/acquisition.ts');
  const now = new Date();
  await check('Only actual search referrer queries are collected',()=>{
    const n=a.observeAcquisition('https://jidokaan.com/shop?q=private&email=secret#key=secret','https://m.search.naver.com/search.naver?query=%EB%B3%B5%EC%8B%B1%ED%99%94',now);
    assert.equal(n.keyword,'복싱화'); assert.equal(n.source,'m.search.naver.com'); assert.equal(n.medium,'organic'); assert.equal(n.landing,'/shop');
    const no=a.observeAcquisition('https://jidokaan.com/?q=private','https://www.google.com/',now);
    assert.equal(no.keyword,''); assert.equal(no.source,'google.com');
  });
  await check('OAuth/self referrals are not counted as new acquisition',()=>{
    for(const ref of ['https://jidokaan.com/login','https://accounts.google.com/','https://kauth.kakao.com/','https://nid.naver.com/']){
      assert.equal(a.observeAcquisition('https://jidokaan.com/',ref,now).source,'direct');
    }
  });
  await check('Campaign allowlist excludes URL credentials/hash',()=>{
    const hit=a.observeAcquisition('https://jidokaan.com/shop?utm_source=IG&utm_campaign=launch&utm_term=boots&code=secret&email=private#key=secret','',now);
    assert.equal(hit.source,'ig'); assert.equal(hit.keyword,'boots'); assert.equal(hit.landing,'/shop'); assert.ok(!JSON.stringify(hit).includes('secret'));
  });
  await check('Invalid, expired and oversized cookies ignored',()=>{
    assert.equal(a.acquisitionFromCookie('jidokaan_acquisition_v1=%zz'),null);
    assert.equal(a.parseAcquisition({source:'naver',observedAt:'2020-01-01'}),null);
    assert.equal(a.acquisitionFromCookie('jidokaan_acquisition_v1='+ 'x'.repeat(4000)),null);
    assert.equal(a.signupDevice('Mozilla/5.0 (iPhone) Mobile'),'mobile');
    assert.equal(a.signupDevice('Mozilla/5.0 (X11; Linux x86_64)'),'pc');
    assert.equal(a.signupDevice(null),'unknown');
  });
  db=await server.ssrLoadModule('/src/lib/db.ts'); const sql=await db.getSql();
  const {auth}=await server.ssrLoadModule('/src/lib/auth/server.ts');
  const observed=a.observeAcquisition('http://localhost:8080/login?utm_source=instagram&utm_campaign=test','',now);
  const headers=new Headers({origin:'http://localhost:8080','user-agent':'Mozilla/5.0 (iPhone) Mobile',cookie:`${a.ACQUISITION_COOKIE}=${encodeURIComponent(JSON.stringify(observed))}`});
  let user;
  await check('Real Better Auth signup hook saves attribution after creation',async()=>{
    const result=await auth.api.signUpEmail({body:{name:'TEST ONLY',email:'signup@example.invalid',password:'TEST-only-password-2038'},headers});
    user=result.user;
    const rows=await sql.query('select * from member_signup_attribution where user_id=$1',[user.id]);
    assert.equal(rows.length,1); assert.equal(rows[0].source,'instagram'); assert.equal(rows[0].device,'mobile');
  });
  await check('Later sign-in does not replace signup attribution',async()=>{
    const other=a.observeAcquisition('http://localhost:8080/login?utm_source=google','',now);
    const changed=new Headers(headers); changed.set('cookie',`${a.ACQUISITION_COOKIE}=${encodeURIComponent(JSON.stringify(other))}`);
    await auth.api.signInEmail({body:{email:'signup@example.invalid',password:'TEST-only-password-2038'},headers:changed});
    const rows=await sql.query('select source from member_signup_attribution where user_id=$1',[user.id]);
    assert.equal(rows[0].source,'instagram');
  });
  console.log(`PASS ${count} acquisition/signup checks; no production changes`);
} finally {
 globalThis.fetch=originalFetch;
 await server.close();
 if(db) {const pg=await db.getPglite();await pg.close();}
 process.chdir(previous); await rm(temp,{recursive:true,force:true});
}
