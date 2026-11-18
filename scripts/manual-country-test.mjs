import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const values=new Map(); const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
globalThis.window={localStorage:storage};globalThis.localStorage=storage;globalThis.sessionStorage=storage;
globalThis.fetch=async()=>{throw Error('OUTBOUND_NETWORK_BLOCKED');};
const server=await createServer({configFile:false,root,resolve:{alias:{'@':resolve(root,'src')}},server:{middlewareMode:true,hmr:false},appType:'custom'});
let checks=0; const check=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
try{
 const {useStore}=await server.ssrLoadModule('/src/lib/store.ts');
 const {syncLocalePreference}=await server.ssrLoadModule('/src/lib/locale-preference.ts');
 const reset=()=>{values.clear();useStore.setState({...useStore.getInitialState()});};
 check('new visitor has no inferred country or lookup action',()=>{reset();assert.equal(useStore.getState().shippingCountry,'');assert.equal(useStore.getState().applyDetectedCountry,undefined);});
 check('manual KR selects KRW without changing language',()=>{reset();useStore.getState().setLocale('en');useStore.getState().setShippingCountry('KR');assert.equal(useStore.getState().currency,'KRW');assert.equal(useStore.getState().locale,'en');});
 check('overseas manual countries preserve language and USD store base',()=>{for(const c of ['US','JP','MX','HK']){reset();useStore.getState().setLocale('ko');useStore.getState().setShippingCountry(c);assert.equal(useStore.getState().shippingCountry,c);assert.equal(useStore.getState().currency,'USD');assert.equal(useStore.getState().locale,'ko');}});
 check('language changes do not overwrite manual shipping',()=>{reset();useStore.getState().setShippingCountry('MX');syncLocalePreference('ja');assert.equal(useStore.getState().shippingCountry,'MX');assert.equal(useStore.getState().locale,'ja');});
 check('country changes preserve cart/design/size',()=>{reset();useStore.getState().setDraftSize('280');useStore.getState().addCustomBoot(1,false);const before=useStore.getState();useStore.getState().setShippingCountry('JP');for(const k of ['cart','draftParts','draftPartNames','draftSize','draftFit'])assert.equal(useStore.getState()[k],before[k]);});
 const merge=useStore.persist.getOptions().merge;
 check('old geo-only preference cleared without losing cart/language',()=>{reset();const before={...useStore.getState(),shippingCountry:'KR',shippingCountryInitialized:true,shippingCountrySource:'geo',locale:'ja',draftSize:'280'};const merged=merge(before,useStore.getInitialState());assert.equal(merged.shippingCountry,'');assert.equal(merged.shippingCountrySource,null);assert.equal(merged.shippingCountryInitialized,false);assert.equal(merged.currency,'USD');assert.equal(merged.locale,'ja');assert.equal(merged.draftSize,'280');assert.equal(merged.cart,before.cart);assert.equal(storage.getItem('jidokaan-ship-country'),null);});
 check('persisted manual and legacy choices survive hydration',()=>{for(const source of ['manual','legacy',undefined]){const merged=merge({shippingCountry:'KR',shippingCountrySource:source,shippingCountryInitialized:true},useStore.getInitialState());assert.equal(merged.shippingCountry,'KR');assert.equal(merged.currency,'KRW');assert.equal(storage.getItem('jidokaan-ship-country'),'KR');}});
 console.log(`${checks} manual country checks passed`);
}finally{await server.close();}
