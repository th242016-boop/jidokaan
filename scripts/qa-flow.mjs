import { chromium } from "playwright";
import { mkdir } from "fs/promises";

await mkdir("/workspace/screenshots", { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

await page.goto("http://127.0.0.1:8080/products/ceramic-vase-01", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /장바구니 담기|Add to cart|カートに入れる/ }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: "/workspace/screenshots/cart-open.png", fullPage: false });
const cartText = await page.locator("body").innerText();
const hasCart = /장바구니|Your cart|カート/.test(cartText);

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
await mobile.screenshot({ path: "/workspace/screenshots/mobile-390.png", fullPage: false });
const mobileText = await mobile.locator("body").innerText();

await page.getByRole("link", { name: /결제하기|Checkout|レジに進む/ }).click();
await page.waitForURL("**/checkout");
await page.fill("#email", "buyer@example.com");
await page.fill("#firstName", "Min");
await page.fill("#lastName", "Park");
await page.fill("#address", "123 Global Ave");
await page.fill("#city", "Seoul");
await page.fill("#postal", "04524");
await page.fill("#card", "4242424242424242");
await page.fill("#cardName", "Min Park");
await page.fill("#expiry", "12/28");
await page.fill("#cvc", "123");
await page.getByRole("button", { name: /주문 확정|Place order|注文を確定/ }).click();
await page.waitForURL("**/order-success**", { timeout: 10000 });
await page.screenshot({ path: "/workspace/screenshots/success.png", fullPage: false });

console.log(JSON.stringify({
  hasCart,
  overflow,
  mobileTextLen: mobileText.length,
  successUrl: page.url(),
  errors,
}, null, 2));
await browser.close();
