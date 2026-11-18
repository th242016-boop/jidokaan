import assert from "node:assert/strict";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";

const server = await createServer({
  configFile: false,
  root: process.cwd(),
  resolve: { alias: { "@": resolve("src") } },
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { LOCALES, t } = await server.ssrLoadModule("/src/lib/i18n.ts");
  const { CHECKOUT_ENHANCEMENTS, CHECKOUT_ENHANCEMENTS_EN, checkoutEnhancementsCopy } = await server.ssrLoadModule("/src/lib/checkout-enhancements-copy.ts");
  const { CHECKOUT_COPY, checkoutCopy } = await server.ssrLoadModule("/src/lib/checkout-copy.ts");
  const { internationalShoppingCopy } = await server.ssrLoadModule("/src/lib/international-shopping-copy.ts");
  const { productionCopy } = await server.ssrLoadModule("/src/lib/production-copy.ts");
  const { internationalHomeCopy } = await server.ssrLoadModule("/src/components/home/international-copy.js");
  const { EXCLUDED_SALES_COUNTRIES } = await server.ssrLoadModule("/src/lib/active-sales-policy.ts");
  const { faqPageCopy } = await server.ssrLoadModule("/src/lib/faq-page-copy.js");
  const { supportCopy } = await server.ssrLoadModule("/src/lib/customer-support-copy.ts");
  const { default: koreanFaq } = await server.ssrLoadModule("/src/components/home/faq-korean-copy.js");
  await server.ssrLoadModule("/src/components/home/locale.js");
  const page = await readFile("src/components/home/page.html", "utf8");
  const requiredKeys = Object.keys(CHECKOUT_ENHANCEMENTS_EN).sort();
  for (const { id } of LOCALES) {
    assert.ok(CHECKOUT_ENHANCEMENTS[id], `${id}: missing purchasing guidance`);
    const enhancements = checkoutEnhancementsCopy(id);
    assert.deepEqual(Object.keys(enhancements).sort(), requiredKeys, `${id}: guidance coverage`);
    assert.ok(Object.values(enhancements).every(value => typeof value === "string" && value.trim()), `${id}: empty guidance`);
    if (id !== "en") {
      for (const key of requiredKeys) assert.notEqual(enhancements[key], CHECKOUT_ENHANCEMENTS_EN[key], `${id}: English fallback in ${key}`);
    }
    assert.equal(checkoutCopy(id).usDuty, enhancements.usDuty, `${id}: US checkout policy differs`);
    assert.equal(CHECKOUT_COPY[id].usDuty, enhancements.usDuty, `${id}: stored US consent text differs`);
    assert.equal(internationalShoppingCopy(id).guest, enhancements.guestNote, `${id}: account promise differs`);
    assert.equal(internationalShoppingCopy(id).contact, enhancements.contactManual, `${id}: DM promise differs`);
    for (const country of EXCLUDED_SALES_COUNTRIES) {
      const blockedHome = internationalHomeCopy(id, country);
      assert.equal(blockedHome.orderNote, enhancements.salesUnavailable, `${id}/${country}: purchase CTA still invites an order`);
      assert.equal(blockedHome.process2Description, enhancements.salesUnavailable, `${id}/${country}: normal payment step shown`);
      assert.ok(!blockedHome.faqA1.includes("<ol>"), `${id}/${country}: normal checkout steps shown`);
      assert.ok(!blockedHome.faqA1.includes("PayPal"), `${id}/${country}: unavailable-country payment invitation`);
      assert.equal(faqPageCopy(id, country).items[0].answerHtml, blockedHome.faqA1, `${id}/${country}: standalone FAQ diverges`);
    }
    for (const country of ["US", "JP", "HK", "KR"]) {
      assert.ok(internationalHomeCopy(id, country).faqA1.includes("<ol>"), `${id}/${country}: supported order steps removed`);
    }
    assert.deepEqual(internationalHomeCopy(id, " mx "), internationalHomeCopy(id, "MX"), `${id}: stored country normalization`);
    const faq = faqPageCopy(id, "US");
    assert.equal(faq.items.length, 10, `${id}: FAQ count`);
    assert.ok(faq.items.every(item => item.question?.trim() && item.answerHtml?.trim()), `${id}: incomplete FAQ`);
    const production = productionCopy(id);
    assert.ok(production.average.includes("15") && production.average.includes("21"), `${id}: current average missing`);
    assert.equal(checkoutCopy(id).production, production.notice, `${id}: checkout production differs`);
    assert.equal(internationalShoppingCopy(id).production, production.average, `${id}: home production differs`);
    assert.equal(t(id).shippingPage.body, production.notice, `${id}: shipping page production differs`);
    for (const [key, value] of Object.entries({
      faq: faq.items[1].answerHtml,
      hero: t(id).hero.ships,
      craft: t(id).home.craftBody,
      craftBadge: t(id).home.craftItems[2],
    })) {
      assert.ok(value.includes("15") && value.includes("21"), `${id}: ${key} production period missing`);
      assert.ok(!/20[–~〜～-]30|30\s*(business|working|営業)|영업일/.test(value), `${id}: ${key} outdated production period`);
    }
    assert.ok(faq.items[5].answerHtml.replace(/[,.\s]/g, "").includes("65000"), `${id}: outsole repair price`);
    assert.ok(supportCopy(id).hoursValue.includes("UTC+9"), `${id}: support timezone missing`);
    assert.ok(!/optional|optionnel|opcional|opz\.|необяз|ixtiyoriy|isteğe bağlı|选填|वैकल्पिक|opsyonal|ไม่บังคับ/i.test(t(id).checkout.phone), `${id}: required phone marked optional`);
    if (!["ko", "en"].includes(id)) assert.notEqual(t(id).nav.orders, "Orders", `${id}: untranslated order lookup link`);
  }
  for (const section of ["checkout", "cart", "product", "shippingPage", "login"]) {
    for (const key of Object.keys(t("en")[section])) {
      if (!["payPaypal", "payKakao", "payNaver"].includes(key)) assert.notEqual(t("ja")[section][key], t("en")[section][key], `Japanese ${section}.${key} inherits English`);
    }
  }
  for (const [key, value] of Object.entries(koreanFaq)) {
    if (/^faq[QA](?:[3-9]|10)$/.test(key)) assert.ok(page.includes(`data-i18n="${key}">${value}`), `${key}: Korean no-JS fallback drifted`);
  }
  console.log(`PASS: ${LOCALES.length} languages; ${requiredKeys.length} purchasing notices each; 10 shared FAQs, excluded-country purchase guidance, average 15–21-day production consistency, US policy/account/DM consistency, Japanese purchase flow, required-phone labels and support timezone.`);
} finally {
  await server.close();
}
