import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const values=new Map();
const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
globalThis.window={localStorage:storage};globalThis.localStorage=storage;globalThis.sessionStorage=storage;
globalThis.fetch=async()=>{throw Error('OUTBOUND_NETWORK_BLOCKED');};
const server=await createServer({configFile:false,root,resolve:{alias:{'@':resolve(root,'src')}},server:{middlewareMode:true},appType:'custom'});
let checks=0;const check=async(name,fn)=>{await fn();checks++;console.log(`PASS ${name}`);};
try {
  const {useStore}=await server.ssrLoadModule('/src/lib/store.ts');
  const {japanYenQuote}=await server.ssrLoadModule('/src/lib/order-money.ts');
  const {specialOrderCopy}=await server.ssrLoadModule('/src/lib/special-order-copy.ts');
  const reset=()=>{values.clear();useStore.setState({...useStore.getInitialState()});};
  await check('same design standard/special are separate lines and special fee is charged once',()=>{
    reset();const s=()=>useStore.getState();s().addCustomBoot(1,false);s().setDraftSpecialOrder(true);s().addCustomBoot(1,false);s().addCustomBoot(1,false);
    assert.equal(s().cart.length,2);assert.deepEqual(s().cart.map(x=>x.qty),[1,2]);assert.equal(s().cart[1].extraUsd,3000);assert.equal(s().cartSubtotalUsdCents(),81000);
  });
  await check('quantity/removal target the selected order type only',()=>{
    const s=()=>useStore.getState();const special=s().cart[1];
    s().setQty(special.productId,3,special.size,special.optionKey,special.sizeFit,special.partNames,true);
    assert.deepEqual(s().cart.map(x=>x.qty),[1,3]);
    s().removeFromCart(special.productId,special.size,special.optionKey,special.sizeFit,special.partNames,true);
    assert.equal(s().cart.length,1);assert.equal(s().cart[0].specialOrder,false);
  });
  await check('saved cart and draft preserve special selection after rehydration',async()=>{
    const s=()=>useStore.getState();s().setDraftSpecialOrder(true);s().addCustomBoot(1,false);
    const saved=values.get('jidokaan-store-v32');assert.ok(saved);s().clearCart();s().setDraftSpecialOrder(false);
    values.set('jidokaan-store-v32',saved);await useStore.persist.rehydrate();
    assert.equal(s().draftSpecialOrder,true);assert.equal(s().cart.at(-1).specialOrder,true);assert.equal(s().cartSubtotalUsdCents(),53000);
  });
  await check('returning to standard removes the surcharge from subsequent orders; reset clears type',()=>{
    const s=()=>useStore.getState();s().clearCart();s().setDraftSpecialOrder(false);s().addCustomBoot(1,false);
    assert.equal(s().cartSubtotalUsdCents(),25000);s().setDraftSpecialOrder(true);s().resetDraft();assert.equal(s().draftSpecialOrder,false);
  });
  await check('Japan standard/special totals preserve fixed currency and freight',()=>{
    assert.equal(japanYenQuote('JP',[{productId:'drone-custom',priceUsd:250,qty:1}]).totalJpy,43000);
    assert.equal(japanYenQuote('JP',[{productId:'drone-custom',priceUsd:280,qty:1}]).totalJpy,47500);
  });
  await check('special consultation instruction is present in all 16 supported languages',()=>{
    for(const locale of ['ko','en','ja','zh','zh-Hant','es','fr','de','it','pt','ru','tr','uz','th','hi','tl']) {
      assert.match(specialOrderCopy(locale).notice,/Instagram/);assert.ok(specialOrderCopy(locale).special);
      if(locale!=='en')assert.notEqual(specialOrderCopy(locale).notice,specialOrderCopy('en').notice);
    }
  });
  console.log(`${checks} special-order cart checks passed; no network or payment.`);
} finally {await server.close();}
