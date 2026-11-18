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
  const state = () => useStore.getState();
  const reset = () => {
    values.clear();
    useStore.setState({ ...useStore.getInitialState() });
  };
  const setLineQty = (line, qty) => state().setQty(
    line.productId, qty, line.size, line.optionKey, line.sizeFit, line.partNames, line.specialOrder,
  );

  await check('confirming a new draft, then returning and confirming again, keeps one pair', () => {
    reset();
    state().ensureCustomBoot();
    const saved = structuredClone(state().cart);
    for (let visit = 0; visit < 3; visit++) state().ensureCustomBoot();
    assert.equal(state().cart.length, 1);
    assert.equal(state().cart[0].qty, 1);
    assert.deepEqual(state().cart, saved);
    assert.equal(state().cartOpen, false);
  });

  await check('confirmation preserves an explicit quantity; Add to cart still adds a pair', () => {
    setLineQty(state().cart[0], 3);
    state().ensureCustomBoot();
    assert.equal(state().cart[0].qty, 3);
    state().addCustomBoot();
    assert.equal(state().cart[0].qty, 4);
    assert.equal(state().cartOpen, true);
    state().ensureCustomBoot();
    assert.equal(state().cart[0].qty, 4);
    assert.equal(state().cartOpen, false);
  });

  await check('changed named colors add a separate design and preserve the previous artwork', () => {
    reset();
    state().ensureCustomBoot();
    const original = structuredClone(state().cart[0]);
    const black = colorByName('BLACK');
    state().setPartColor('a', black.color, 'BLACK');
    state().ensureCustomBoot();
    state().ensureCustomBoot();
    assert.equal(state().cart.length, 2);
    assert.deepEqual(state().cart[0], original);
    assert.equal(state().cart[1].partNames.a, 'BLACK');
    assert.equal(state().cart[1].partColors.a, black.color);
    assert.equal(state().cart[1].qty, 1);
  });

  await check('different model, size and fit remain separate while returning to an old draft reuses it', () => {
    reset();
    state().ensureCustomBoot();
    const original = structuredClone(state().cart[0]);
    state().setDraftModel('mid');
    state().ensureCustomBoot();
    state().setDraftSize('270');
    state().ensureCustomBoot();
    state().setDraftFit('women');
    state().ensureCustomBoot();
    assert.equal(state().cart.length, 4);
    assert.deepEqual(state().cart.map(line => line.qty), [1, 1, 1, 1]);
    assert.equal(state().cart[1].productId, 'drone-mid');
    assert.equal(state().cart[2].size, '270');
    assert.equal(state().cart[3].sizeFit, 'women');
    state().setDraftModel('high');
    state().setDraftSize('265');
    state().setDraftFit('men');
    state().ensureCustomBoot();
    assert.equal(state().cart.length, 4);
    assert.deepEqual(state().cart[0], original);
  });

  await check('standard and special confirmation preserve their own quantities and surcharge', () => {
    reset();
    state().ensureCustomBoot();
    state().setDraftSpecialOrder(true);
    state().ensureCustomBoot();
    setLineQty(state().cart[1], 2);
    state().ensureCustomBoot();
    assert.deepEqual(state().cart.map(line => line.qty), [1, 2]);
    assert.equal(state().cart[1].extraUsd, 3000);
    assert.equal(state().cartSubtotalUsdCents(), 81000);
    state().setDraftSpecialOrder(false);
    state().ensureCustomBoot();
    assert.deepEqual(state().cart.map(line => line.qty), [1, 2]);
  });

  await check('an existing legacy standard line and unrelated cart lines are not rewritten', () => {
    reset();
    state().addCustomBoot(2, false);
    const legacy = structuredClone(state().cart[0]);
    delete legacy.specialOrder;
    const unrelated = { productId: 'historical-accessory', qty: 3, optionKey: 'saved-option', color: '#abcdef' };
    useStore.setState({ cart: [unrelated, legacy] });
    const saved = structuredClone(state().cart);
    state().ensureCustomBoot();
    assert.deepEqual(state().cart, saved);
    state().setDraftSize('270');
    state().ensureCustomBoot();
    assert.deepEqual(state().cart.slice(0, 2), saved);
    assert.equal(state().cart.length, 3);
  });

  await check('rehydrating a saved design before reconfirming preserves the stored quantity and colors', async () => {
    reset();
    state().setDraftSpecialOrder(true);
    state().addCustomBoot(3, false);
    const savedCart = structuredClone(state().cart);
    const savedStorage = values.get('jidokaan-store-v32');
    assert.ok(savedStorage);
    state().clearCart();
    values.set('jidokaan-store-v32', savedStorage);
    await useStore.persist.rehydrate();
    state().ensureCustomBoot();
    assert.deepEqual(state().cart, savedCart);
  });

  await check('removing a confirmed line then confirming again adds only one fresh pair', () => {
    setLineQty(state().cart[0], 0);
    assert.equal(state().cart.length, 0);
    state().ensureCustomBoot();
    state().ensureCustomBoot();
    assert.equal(state().cart.length, 1);
    assert.equal(state().cart[0].qty, 1);
  });

  console.log(`${checks} design-confirmation checks passed; no network or payment.`);
} finally {
  await server.close();
}
