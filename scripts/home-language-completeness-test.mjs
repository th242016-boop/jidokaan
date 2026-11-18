// Full editorial home-key regression, using the real HTML key inventory and
// locale runtime. No browser, network, database, customer message or payment.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { brandInternationalCopy } from '../src/components/home/brand-international-copy.js';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const html = await readFile(resolve(rootDir, 'src/components/home/page.html'), 'utf8');
const visibleKeys = [...new Set([...html.matchAll(/data-i18n="([^"]+)"/g)].map(m => m[1]))];
const attrKeys = Object.fromEntries(['alt', 'aria-label'].map(attr => [attr, [...new Set([...html.matchAll(new RegExp(`data-i18n-${attr}="([^"]+)"`, 'g'))].map(m => m[1]))]]));
const keys = [...new Set([...visibleKeys, ...Object.values(attrKeys).flat(), 'title', 'description', 'shopLoading', 'shopEmpty', 'craftDialogIndex', 'specialDialogIndex', 'specialExampleProduct'])];
const nodes = visibleKeys.map(key => ({ dataset: { i18n: key }, innerHTML: `SOURCE_KO:${key}` }));
const attrs = Object.fromEntries(Object.entries(attrKeys).map(([attr, values]) => [attr, values.map(key => ({
  getAttribute(name) { return name.startsWith('data-i18n-') ? key : `SOURCE_KO:${key}`; },
  setAttribute() {},
}))]));
const select = { value: 'ko', replaceChildren() {}, addEventListener() {}, removeEventListener() {} };
const menu = { getAttribute() { return 'false'; }, setAttribute() {} };
const root = {
  dataset: {},
  querySelector(s) { return s === '#site-language' ? select : menu; },
  querySelectorAll(s) {
    if (s === '[data-i18n]') return nodes;
    if (s === '.look') return Array(11).fill({});
    if (s === '.special-look') return Array(5).fill({});
    for (const [attr, list] of Object.entries(attrs)) if (s === `[data-i18n-${attr}]`) return list;
    return [];
  },
  dispatchEvent() {},
};
const originals = { document: globalThis.document, fetch: globalThis.fetch };
globalThis.document = { createElement() { return {}; } };
globalThis.fetch = async () => { throw new Error('OUTBOUND_NETWORK_BLOCKED'); };
const server = await createServer({ configFile: false, root: rootDir, resolve: { alias: { '@': resolve(rootDir, 'src') } }, server: { middlewareMode: true }, appType: 'custom' });
try {
  const { LOCALES } = await server.ssrLoadModule('/src/lib/i18n.ts');
  const { createHomeLocale } = await server.ssrLoadModule('/src/components/home/locale.js');
  const runtime = createHomeLocale(root, () => {});
  runtime.applyLanguage('en', 'US');
  const english = Object.fromEntries(keys.map(key => [key, runtime.t(key)]));
  // Legal identities and postal address intentionally remain Romanized. These
  // short French/German labels are also valid words in the selected language.
  const legitimateEnglishMatches = new Set(['companyName', 'owner', 'address', 'commerce']);
  const borrowedLabels = { fr: new Set(['navCollection', 'mobileCollection', 'accent', 'contactLink']), de: new Set(['navDetail', 'mobileDetail', 'shopLink', 'shopIndex']), tl: new Set(['addressLabel', 'emailLabel', 'brandLink', 'adminLink']) };
  let checked = 0;
  for (const { id } of LOCALES) {
    runtime.applyLanguage(id, 'US');
    assert.equal(root.dataset.partialTranslation, 'false', `${id} still marks the home partially translated`);
    for (const key of keys) {
      const value = runtime.t(key);
      assert.equal(typeof value, 'string', `${id}.${key} is not text`);
      assert.ok(value.trim(), `${id}.${key} is empty`);
      assert.notEqual(value, key, `${id}.${key} is missing`);
      assert.doesNotMatch(value, /\b(?:undefined|null)\b|\[object Object\]/, `${id}.${key} has a broken value`);
      if (id !== 'ko') {
        assert.doesNotMatch(value, /SOURCE_KO:|[가-힣]/, `${id}.${key} falls back to Korean`);
        if (id !== 'en' && !legitimateEnglishMatches.has(key) && !borrowedLabels[id]?.has(key)) {
          assert.notEqual(value, english[key], `${id}.${key} falls back to English: ${value}`);
        }
      }
      checked++;
    }
    // Shipping country switches ordering instructions, never the selected language.
    const hero = runtime.t('heroTitle1');
    runtime.applyLanguage(id, 'KR');
    assert.equal(runtime.locale, id);
    assert.equal(runtime.t('heroTitle1'), hero);
    assert.match(runtime.t('process2Description'), /Naver|네이버/);
    assert.match(runtime.t('specialExampleProduct'), /Naver|네이버/, `${id}: domestic example consultation`);
    assert.doesNotMatch(runtime.t('specialExampleProduct'), /Instagram/, `${id}: domestic example must not use overseas channel`);
    assert.doesNotMatch(runtime.t('faqA2'), /30/);
    runtime.applyLanguage(id, 'JP');
    assert.equal(runtime.t('heroTitle1'), hero);
    assert.match(runtime.t('specialDescription'), /41[,. ]?500/);
    assert.match(runtime.t('specialExampleProduct'), /Instagram/, `${id}: overseas example consultation`);
    assert.doesNotMatch(runtime.t('specialExampleProduct'), /Naver|네이버|010[ -]?3481/, `${id}: overseas example must not name a domestic channel`);
    assert.match(runtime.t('specialExampleProduct'), /41[,. ]?500/, `${id}: Japan example price`);
    console.log(`PASS ${id}: ${keys.length} home/editorial/FAQ/accessibility keys, KR and JP flow consistency`);
  }
  assert.equal(Object.keys(brandInternationalCopy).length, 10);
  const translationKeys = Object.keys(brandInternationalCopy.fr).sort();
  for (const [id, copy] of Object.entries(brandInternationalCopy)) assert.deepEqual(Object.keys(copy).sort(), translationKeys, `${id} missing an editorial key`);
  runtime.destroy();
  console.log(`${checked} home-key checks passed across ${LOCALES.length} languages; ${translationKeys.length} completed editorial keys in 10 languages.`);
} finally {
  for (const [key, value] of Object.entries(originals)) {
    if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
  }
  await server.close();
}
