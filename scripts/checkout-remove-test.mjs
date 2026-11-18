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
    assert.match(code,/onCancel:.*onActivity\(false\)/);
    assert.match(code,/callbacks.current.onActivity\(true\);/);
    assert.match(code,/setTermsAccepted\(false\);[\s\S]{0,100}removeFromCart\(/);
    assert.match(code,/if \(cart.length === 0 && !pendingOrder\)/);
  });
  await check('actual PayPal callbacks lock before create, preserve on success, unlock on cancel/error', async () => {
    const start=code.indexOf('const buttons = ready.api.Buttons({');
    const end=code.indexOf('    void buttons.render(mount)',start);
    const source=code.slice(start,end).replace('const buttons = ready.api.Buttons(', 'const buttons = (');
    // This options object has no TypeScript except its callback parameter/assertions.
    const { stripTypeScriptTypes } = await import('node:module');
    const js=stripTypeScriptTypes(source,{mode:'strip'})+'; return buttons;';
    const signals=[];
    const callbacks={current:{getOrder:()=>({items:[{qty:1}]}),onActivity:value=>signals.push(value),onPending:()=>signals.push('pending'),onSaved:()=>{}}};
    const factory=new Function('active','host','callbacks','submitted','fetch','value','currency','copyRef','setErr','paidRef',js);
    let succeed=true;
    const opts=factory(true,{closest:()=>({reportValidity:()=>true})},callbacks,{current:null},async()=>{
      assert.equal(signals.at(-1),true);
      return {ok:succeed,json:async()=>succeed?{id:'FAKE-PAYPAL-ID'}:{error:'create-failure'}};
    },'335.00','USD',{current:{confirmError:'invalid',refresh:'refresh',paymentError:'error'}},()=>{}, {current:async()=>{}});
    assert.equal(await opts.createOrder(),'FAKE-PAYPAL-ID');
    assert.deepEqual(signals,[true]);
    opts.onCancel(); assert.equal(signals.at(-1),false);
    succeed=false;
    await assert.rejects(()=>opts.createOrder()); assert.equal(signals.at(-1),false);
    opts.onError(); assert.equal(signals.at(-1),false);
  });
  console.log(`${checks} checkout removal checks passed; no network or payment.`);
} finally { await server.close(); }
