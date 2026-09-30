import {
  completeDesign,
  designColors,
  designKey,
  validDesignPreview,
  DESIGN_VERSION,
  ORDER_TERMS_VERSION,
} from "./design-order";
import { checkoutCopy, CHECKOUT_COPY } from "./checkout-copy";
import { EMS_BOX } from "./ems-rates";
import { readCatalog, isBlockedEmail } from "./catalog.server";
import { countOrdersByEmail } from "./orders.server";
import { couponDiscount, couponRejectReason, findCoupon } from "./coupon";
import { COUNTRIES } from "./i18n";
import { normalizeInstagram } from "./order-contact";
import type { StoreOrder, OrderItem } from "./order-types";
import { quoteShipping, zoneForCountry } from "./shipping";
export type CheckoutInput = Omit<StoreOrder, "id" | "createdAt" | "status">;
const clean = (value: unknown, max = 200) =>
  String(value ?? "")
    .trim()
    .slice(0, max);

/** One authoritative quote used for payment creation and order storage. */
export async function quoteCheckout(raw: Partial<StoreOrder>): Promise<CheckoutInput> {
  const country = clean(raw.country, 2).toUpperCase();
  if (!COUNTRIES.some((c) => c.code === country) || country === "KR")
    throw new Error("SHIPPING_COUNTRY");
  if (raw.pay !== "paypal" && raw.pay !== "transfer") throw new Error("PAYMENT_METHOD");
  const email = clean(raw.email).toLowerCase();
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !clean(raw.name) ||
    !clean(raw.address) ||
    !clean(raw.phone) ||
    !clean(raw.city)
  )
    throw new Error("CONTACT_REQUIRED");
  if (["US", "CA", "AU", "MX", "CN", "IN", "BR", "JP"].includes(country) && !clean(raw.region))
    throw new Error("REGION_REQUIRED");
  if (country !== "AE" && !clean(raw.postal)) throw new Error("POSTAL_REQUIRED");
  const instagram = raw.contactMethod === "email" ? "" : normalizeInstagram(raw.instagram);
  const contactMethod = raw.contactMethod;
  if (contactMethod !== "instagram" && contactMethod !== "email")
    throw new Error("CONTACT_REQUIRED");
  if (contactMethod === "instagram" && !instagram) throw new Error("CONTACT_REQUIRED");
  if (raw.termsAccepted !== true || raw.termsVersion !== ORDER_TERMS_VERSION)
    throw new Error("TERMS_REQUIRED");
  const checkoutLocale = String(raw.checkoutLocale ?? "en");
  if (!Object.hasOwn(CHECKOUT_COPY, checkoutLocale)) throw new Error("LOCALE_INVALID");
  const copy = checkoutCopy(checkoutLocale);
  const catalog = await readCatalog();
  if (await isBlockedEmail(email)) throw new Error("BLOCKED");
  if (!Array.isArray(raw.items) || !raw.items.length || raw.items.length > 30)
    throw new Error("ITEMS_INVALID");
  const items: OrderItem[] = raw.items.map((item) => {
    const product = catalog.products.find((p) => p.id === item.productId);
    if (
      !product ||
      product.visible === false ||
      !product.inStock ||
      !Number.isInteger(item.qty) ||
      item.qty < 1 ||
      item.qty > 30
    )
      throw new Error("ITEM_UNAVAILABLE");
    if (product.customizable && !clean(item.size)) throw new Error("SIZE_REQUIRED");
    const sku = product.options?.enabled
      ? product.options.skus.find(
          (s) => s.key === item.optionKey && s.enabled && s.stock >= item.qty,
        )
      : undefined;
    if (product.options?.enabled && !sku) throw new Error("OPTION_UNAVAILABLE");
    const design = product.customizable ? completeDesign(item.partNames) : null;
    if (
      product.customizable &&
      (!design ||
        !validDesignPreview(item.designPreview) ||
        item.designVersion !== DESIGN_VERSION ||
        item.designKey !== designKey(design))
    )
      throw new Error("DESIGN_REQUIRED");
    const names = (value: unknown) =>
      value && typeof value === "object" && !Array.isArray(value)
        ? Object.fromEntries(
            Object.entries(value)
              .filter(([key]) => /^[a-l]$/.test(key))
              .map(([key, value]) => [key, clean(value, 64)]),
          )
        : undefined;
    return {
      productId: product.id,
      name: `${product.name.ko || product.name.en}${sku ? ` (${sku.key})` : ""}`,
      qty: item.qty,
      size: clean(item.size, 100),
      sizeFit: clean(item.sizeFit, 16),
      optionKey: sku?.key,
      optionLabel: sku?.key,
      color: clean(item.color, 64),
      partNames: design ?? names(item.partNames),
      partColors: design ? designColors(design) : names(item.partColors),
      ...(design
        ? {
            designPreview: item.designPreview,
            designVersion: DESIGN_VERSION,
            designKey: designKey(design),
          }
        : {}),
      priceKrw: product.priceKrw + (sku?.extraKrw ?? 0),
      priceUsd: (product.priceUsd + (sku?.extraUsd ?? 0)) / 100,
    };
  });
  const subtotalKrw = items.reduce((sum, item) => sum + item.qty * item.priceKrw, 0);
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.qty * Math.round(item.priceUsd * 100),
    0,
  );
  const couponCode = clean(raw.couponCode, 80).toUpperCase();
  let off = { krw: 0, usdCents: 0 };
  if (couponCode) {
    const coupon = findCoupon(catalog.coupons, couponCode);
    if (!coupon || couponRejectReason(coupon, subtotalKrw, await countOrdersByEmail(email)))
      throw new Error("COUPON_INVALID");
    off = couponDiscount(coupon, subtotalKrw, subtotalCents);
  }
  const discountKrw = Math.min(subtotalKrw, off.krw),
    discountCents = Math.min(subtotalCents, off.usdCents);
  const qty = items.reduce((sum, item) => sum + item.qty, 0);
  const shipping = quoteShipping({
    country,
    method: "standard",
    subtotalKrw,
    subtotalUsd: subtotalCents / 100,
    qty,
    settings: catalog.shipping,
  });
  if (!shipping.available) throw new Error("SHIPPING_QUOTE_REQUIRED");
  return {
    email,
    contactMethod,
    checkoutLocale,
    termsVersion: ORDER_TERMS_VERSION,
    termsAccepted: true,
    termsAcceptedAt: new Date().toISOString(),
    acknowledgedTerms: {
      shipping: copy.shipping,
      duty: country === "US" ? copy.usDuty : copy.duty,
      design: copy.design,
      production: copy.production,
      agree: copy.agree,
    },
    instagram: contactMethod === "instagram" ? instagram : "",
    name: clean(raw.name, 80),
    phone: clean(raw.phone, 40),
    address: clean(raw.address),
    city: clean(raw.city, 100),
    region: clean(raw.region, 100),
    postal: clean(raw.postal, 30),
    country,
    pay: raw.pay,
    depositor: clean(raw.depositor, 80),
    shipMethod: "standard",
    shippingKrw: shipping.krw,
    shippingUsd: shipping.usd,
    shippingBasis: `우체국 EMS · ${country} · ${EMS_BOX.widthMm}×${EMS_BOX.depthMm}×${EMS_BOX.heightMm}mm · ${EMS_BOX.billableKg}kg 구간 · 1켤레 1상자 · 환산 ${catalog.shipping.exchangeKrwPerUsd}원/USD · ${catalog.shipping.countryRates?.[country]?.note ?? ""}`,
    dutyTerms: country === "US" ? "PREPAID_BEFORE_DISPATCH" : "DESTINATION_RULES",
    totalKrw: subtotalKrw - discountKrw + shipping.krw,
    totalUsd: (subtotalCents - discountCents) / 100 + shipping.usd,
    currency: "USD",
    items,
    couponCode,
    discountKrw,
    discountUsd: discountCents / 100,
  };
}
