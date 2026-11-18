import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const values = new Map();
const storage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: key => values.delete(key),
};
globalThis.window = { localStorage: storage };
globalThis.localStorage = storage;
globalThis.sessionStorage = storage;
globalThis.fetch = async () => { throw Error('OUTBOUND_NETWORK_BLOCKED'); };
const server = await createServer({
  configFile: false,
  root,
  resolve: { alias: { '@': resolve(root, 'src') } },
  server: { middlewareMode: true },
  appType: 'custom',
});
let checks = 0;
const check = async (name, fn) => { await fn(); checks++; console.log(`PASS ${name}`); };

try {
  const { useStore } = await server.ssrLoadModule('/src/lib/store.ts');
  const { colorByName } = await server.ssrLoadModule('/src/lib/simulator-config.ts');
  const { readFile } = await import('node:fs/promises');
  const state = () => useStore.getState();
  const remove = line => state().removeFromCart(line.productId,line.size,line.optionKey,line.sizeFit,line.partNames,line.specialOrder);
  state().ensureCustomBoot();
  const first = structuredClone(state().cart[0]);
  state().setPartColor('a', colorByName('BLACK').color, 'BLACK');
  state().ensureCustomBoot();
  const second = structuredClone(state().cart[1]);
  await check('remove one design only; other design and destination stay intact', () => {
    state().setShippingCountry('US');
    remove(first);
    assert.deepEqual(state().cart, [second]);
    assert.equal(state().shippingCountry, 'US');
    assert.equal(state().cartCount(), second.qty);
  });
  await check('all identity dimensions distinguish otherwise identical cart lines', () => {
    for (const variation of [{size:'999'}, {sizeFit:'women'}, {optionKey:'different'}, {specialOrder:!second.specialOrder}]) {
      const other={...structuredClone(second), ...variation};
      useStore.setState({cart:[second,other]});
      remove(second);
      assert.deepEqual(state().cart,[other]);
    }
  });
  await check('removal is persisted and last item produces zero totals', async () => {
    useStore.setState({cart:[second]});
    remove(second);
    assert.equal(state().cart.length,0);
    assert.equal(state().cartSubtotalUsdCents(),0);
    assert.equal(state().cartSubtotalKrw(),0);
    await useStore.persist.rehydrate();
    assert.equal(state().cart.length,0);
  });
  const code=await readFile(resolve(root,'src/routes/checkout.tsx'),'utf8');
  await check('checkout remove uses full identity, no form submission, and blocks payment/pending state', () => {
    assert.match(code,/disabled=\{placing \|\| Boolean\(pendingOrder\) \|\| paymentInFlight\}/);
    assert.match(code,/if \(placing \|\| pendingOrder \|\| paymentInFlightRef.current\) return;/);
    assert.match(code,/removeFromCart\(item.productId, item.size, item.optionKey, item.sizeFit, item.partNames, item.specialOrder\)/);
    assert.match(code,/type="button"[\s\S]{0,300}disabled=\{placing \|\| Boolean\(pendingOrder\) \|\| paymentInFlight\}/);
  });
  await check('PayPal activity lock never feeds PaypalButtons disabled/unmount dependency', () => {
    assert.match(code,/onActivity=\{onPaymentActivity\}/);
    assert.match(code,/disabled=\{placing \|\| !canPay \|\| paymentValue <= 0\}/);
    assert.match(code,/onCancel:.*releasePayment\(\)/);
    assert.match(code,/callbacks.current.onActivity\(paymentOwner, true\);/);
    assert.match(code,/setTermsAccepted\(false\);[\s\S]{0,100}removeFromCart\(/);
    assert.match(code,/if \(cart.length === 0 && !pendingOrder\)/);
  });
  const { stripTypeScriptTypes } = await import('node:module');
  const parentStart=code.indexOf('  function onPaymentActivity(');
  const parentEnd=code.indexOf('  const [instagram',parentStart);
  const parentJs=stripTypeScriptTypes(code.slice(parentStart,parentEnd),{mode:'strip'});
  const lock={current:null};
  let locked=false;
  const activity=new Function('paymentInFlightRef','setPaymentInFlight',parentJs+'; return onPaymentActivity;')(lock,value=>{locked=value;});
  const start=code.indexOf('const paymentOwner = Symbol("paypal-checkout")');
  const end=code.indexOf('    void buttons.render(mount)',start);
  const source=code.slice(start,end).replace('const buttons = ready.api.Buttons(', 'const buttons = (');
  const js=stripTypeScriptTypes(source,{mode:'strip'})+'; return {buttons,deactivate:()=>{active=false;}};';
  let pending=false;
  let succeed=true;
  let errors=0;
  let orderPayload={items:[{qty:1}]};
  let pendingPayload;
  const callbacks={current:{getOrder:()=>orderPayload,onActivity:activity,onPending:value=>{pending=true;pendingPayload=value;},onSaved:()=>{}}};
  const factory=new Function('active','host','callbacks','fetch','value','currency','copyRef','setErr','paidRef',js);
  const instance=()=>factory(true,{closest:()=>({reportValidity:()=>true})},callbacks,async(_url,request)=>{
    if (JSON.parse(request.body).action==='capture') throw Error('SIMULATED_CAPTURE_PENDING');
    assert.equal(locked,true);
    return {ok:succeed,json:async()=>succeed?{id:'FAKE-PAYPAL-ID'}:{error:'create-failure'}};
  },'335.00','USD',{current:{confirmError:'invalid',refresh:'refresh',paymentError:'error'}},()=>{errors++;}, {current:async()=>{}});
  await check('actual callbacks lock before create and unlock on create failure', async () => {
    const a=instance();
    assert.equal(await a.buttons.createOrder(),'FAKE-PAYPAL-ID');
    assert.equal(locked,true);
    assert.equal(await a.buttons.createOrder(),'FAKE-PAYPAL-ID');
    assert.equal(locked,true);
    a.buttons.onCancel(); assert.equal(locked,false);
    succeed=false;
    await assert.rejects(()=>a.buttons.createOrder()); assert.equal(locked,false);
    succeed=true;
  });
  await check('duplicate SDK create calls share one request/id without triggering onError unlock', async () => {
    let complete;
    let requests=0;
    let sentPayload;
    const waiting=new Promise(resolve=>{complete=resolve;});
    const a=factory(true,{closest:()=>({reportValidity:()=>true})},callbacks,async(_url,request)=>{
      requests++; sentPayload=JSON.parse(request.body).order;
      await waiting;
      return {ok:true,json:async()=>({id:'ONE-PAYPAL-ID'})};
    },'335.00','USD',{current:{}},()=>{errors++;},{current:async()=>{}});
    orderPayload={items:[{design:'first'}]};
    const sdkCreate=()=>a.buttons.createOrder().catch(error=>{a.buttons.onError(error);throw error;});
    const first=sdkCreate();
    orderPayload={items:[{design:'later'}]};
    const duplicate=sdkCreate();
    assert.equal(requests,1); assert.equal(locked,true);
    complete();
    assert.deepEqual(await Promise.all([first,duplicate]),['ONE-PAYPAL-ID','ONE-PAYPAL-ID']);
    assert.deepEqual(sentPayload.items,[{design:'first'}]);
    assert.equal(locked,true);
    assert.equal(await sdkCreate(),'ONE-PAYPAL-ID'); assert.equal(requests,1);
    a.buttons.onCancel(); assert.equal(locked,false);
    assert.equal(await sdkCreate(),'ONE-PAYPAL-ID'); assert.equal(requests,2);
    a.buttons.onError(); assert.equal(locked,false);
  });
  await check('cleanup alone keeps lock; old cancelled/error callbacks release their own lock', async () => {
    for (const callback of ['onCancel','onError']) {
      const old=instance();
      await old.buttons.createOrder(); old.deactivate();
      assert.equal(locked,true);
      const before=errors;
      old.buttons[callback]();
      assert.equal(locked,false);
      assert.equal(errors,before,'stale UI errors must not replace current error');
    }
  });
  await check('late old cancel/error cannot release a newer payment owner', async () => {
    const old=instance(); await old.buttons.createOrder(); old.deactivate();
    const fresh=instance(); await fresh.buttons.createOrder();
    const owner=lock.current;
    old.buttons.onCancel(); old.buttons.onError();
    assert.equal(lock.current,owner); assert.equal(locked,true);
    fresh.buttons.onCancel(); assert.equal(locked,false);
  });
  await check('late approval keeps the payload of its own SDK instance', async () => {
    orderPayload={items:[{design:'old'}]};
    const old=instance(); await old.buttons.createOrder(); old.deactivate();
    orderPayload={items:[{design:'new'}]};
    const fresh=instance(); await fresh.buttons.createOrder();
    await assert.rejects(()=>old.buttons.onApprove({orderID:'OLD-ID'}));
    assert.deepEqual(pendingPayload.items,[{design:'old'}]);
    assert.equal(pendingPayload.paypalOrderId,'OLD-ID');
    fresh.buttons.onCancel();
  });
  await check('approval keeps pending recovery protection even if activity releases later', async () => {
    const a=instance(); await a.buttons.createOrder();
    await assert.rejects(()=>a.buttons.onApprove({orderID:'FAKE-PAYPAL-ID'}));
    assert.equal(pending,true);
    a.deactivate(); a.buttons.onError();
    assert.equal(pending || locked,true);
    assert.match(code,/disabled=\{placing \|\| Boolean\(pendingOrder\) \|\| paymentInFlight\}/);
  });
  console.log(`${checks} checkout removal checks passed; no network or payment.`);
} finally { await server.close(); }
