// Production copy coverage: preview translations must not hide an English fallback.
// No auth, customer records, network, database or payment calls.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createServer } from "vite";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const server = await createServer({
  configFile: false,
  root,
  resolve: { alias: { "@": resolve(root, "src") } },
  server: { middlewareMode: true },
  appType: "custom",
});
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => { throw new Error("OUTBOUND_NETWORK_BLOCKED"); };
try {
  const { LOCALES, t } = await server.ssrLoadModule("/src/lib/i18n.ts");
  const { inboxCopy, inboxLocale } = await server.ssrLoadModule("/src/lib/inbox-copy.ts");
  const { contactPreviewCopy } = await server.ssrLoadModule("/src/lib/contact-preview-copy.ts");
  const englishInbox = inboxCopy("en");
  const inboxKeys = Object.keys(englishInbox).sort();
  assert.equal(LOCALES.length, 16);
  assert.equal(inboxKeys.length, 29);
  const inboxSentences = ["intro", "notice", "received", "save", "error", "rate", "missing", "waiting", "noEmail", "emailFooter"];
  const accountSentences = ["internationalBody", "phoneNeed", "phoneInvalid", "signUp", "haveAccount", "noAccount", "orEmail", "guestCheckout", "failed"];
  for (const { id } of LOCALES) {
    const inbox = inboxCopy(id);
    const dict = t(id);
    assert.equal(inboxLocale(id), id, `${id}: production inbox must retain the requested language`);
    assert.deepEqual(Object.keys(inbox).sort(), inboxKeys, `${id}: complete production conversation copy`);
    for (const [key, value] of Object.entries(inbox)) {
      assert.ok(typeof value === "string" && value.trim(), `${id}: inbox.${key}`);
    }
    for (const key of accountSentences) {
      assert.ok(dict.login[key]?.trim(), `${id}: login.${key}`);
      if (id !== "en") assert.notEqual(dict.login[key], t("en").login[key], `${id}: login.${key} silently uses English`);
    }
    if (id !== "en") {
      for (const key of inboxSentences) assert.notEqual(inbox[key], englishInbox[key], `${id}: inbox.${key} silently uses English`);
      assert.notEqual(dict.nav.logOut, t("en").nav.logOut, `${id}: logout uses English`);
    }
    for (const value of [dict.nav.menu, dict.cart.decrease, dict.cart.increase, dict.cart.close]) assert.ok(value?.trim());
    const preview = contactPreviewCopy(id);
    assert.ok(preview.notice && preview.receivedHelp);
    for (const key of ["title", "name", "email", "message", "send"]) {
      assert.equal(Object.hasOwn(preview, key), false, `${id}: preview must not have competing form copy for ${key}`);
    }
  }
  // Unsupported legacy language codes have a deliberate, bounded fallback.
  assert.equal(inboxLocale("unknown"), "en");
  assert.equal(inboxCopy("unknown"), englishInbox);
  const contact = await readFile(resolve(root, "src/routes/contact.tsx"), "utf8");
  assert.match(contact, /const copy = inboxCopy\(locale\);/);
  assert.doesNotMatch(contact, /preview\.(?:title|name|email|message|send)\b/);
  const login = await readFile(resolve(root, "src/routes/login.tsx"), "utf8");
  assert.match(login, /dict\.login\.internationalBody/);
  assert.doesNotMatch(login, /Google is recommended for international orders/);
  console.log("PASS: 16 locales retain production inbox language and all 29 conversation fields");
  console.log("PASS: 16 account/guest/error flows have localized critical copy and shared navigation labels");
  console.log("PASS: preview uses production form copy with separate no-send notice; unknown locale falls back safely");
} finally {
  globalThis.fetch = originalFetch;
  await server.close();
}
