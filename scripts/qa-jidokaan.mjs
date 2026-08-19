import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

await page.goto("http://127.0.0.1:8080/products/drone-custom", { waitUntil: "networkidle" });
// pick size
await page.getByRole("button", { name: "265" }).click();
await page.getByRole("button", { name: /장바구니 담기|Add to cart|カートに入れる/ }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: "/workspace/screenshots/jidokaan-cart.png" });

await page.getByRole("link", { name: /주문하기|Checkout|注文する/ }).click();
await page.waitForURL("**/checkout");
await page.fill("#email", "fighter@example.com");
await page.fill("#firstName", "Ji");
await page.fill("#lastName", "Do");
await page.fill("#address", "성수이로18길 36");
await page.fill("#city", "Seoul");
await page.fill("#postal", "04797");
await page.fill("#card", "4242424242424242");
await page.fill("#cardName", "JIDOKAAN");
await page.fill("#expiry", "12/28");
await page.fill("#cvc", "123");
await page.getByRole("button", { name: /주문 확정|Place order|注文を確定/ }).click();
await page.waitForURL("**/order-success**");

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
await mobile.screenshot({ path: "/workspace/screenshots/jidokaan-mobile.png" });
const text = await mobile.locator("body").innerText();

console.log(JSON.stringify({
  success: page.url(),
  overflow,
  hasBrand: /지도칸|JIDOKAAN/.test(text),
  hasPrice: /248|₩/.test(text),
  errors,
}, null, 2));
await browser.close();
