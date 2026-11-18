import { isSpecialOrderEligible, SPECIAL_ORDER_EXTRA_USD_CENTS, SPECIAL_ORDER_EXTRA_KRW } from "./special-order";
import { specialOrderCopy } from "./special-order-copy";
import { modelLabel } from "./simulator-config";
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
import { requiresPostalCode } from "./address-requirements";
import type { StoreOrder, OrderItem } from "./order-types";
import { quoteShipping, zoneForCountry } from "./shipping";
import { validatePhoneNumber } from "./phone";
import { countryImportPolicy, countryImportNotice, IMPORT_POLICY_VERSION } from "./country-import-policy";
import { checkoutEnhancementsCopy } from "./checkout-enhancements-copy";
import { parcelPlan } from "./parcel-policy";
import { validPostalAddress } from "./address-validation";
import { isActiveSalesCountry } from "./active-sales-policy";
import { normalizeShippingCountry } from "./shipping-destination";
import { internationalOrderPolicy } from "./international-order-policy";
import { japanYenQuote, JAPAN_PRICE_VERSION } from "./order-money";
export type CheckoutInput = Omit<StoreOrder, "id" | "createdAt" | "status">;
const clean = (value: unknown, max = 200) =>
  String(value ?? "")
    .trim()
    .slice(0, max);

/** One authoritative quote used for payment creation and order storage. */
export async function quoteCheckout(raw: Partial<StoreOrder>): Promise<CheckoutInput> {
  const country = normalizeShippingCountry(raw.country);
  if (!COUNTRIES.some((c) => c.code === country) || country === "KR")
    throw new Error("SHIPPING_COUNTRY");
  if (!isActiveSalesCountry(country)) throw new Error("DESTINATION_SALES_UNAVAILABLE");
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
  if (requiresPostalCode(country) && !clean(raw.postal)) throw new Error("POSTAL_REQUIRED");
  if (!validPostalAddress(country, clean(raw.postal), clean(raw.region))) throw new Error("ADDRESS_INVALID");
  // The checkout sends a canonical international number. Never infer it from the delivery country.
  const phone = validatePhoneNumber(clean(raw.phone, 80));
  if (!phone.valid) throw new Error("PHONE_INVALID");
  if (country === "CN" && (phone.country !== "CN" || !/^\+861[3-9]\d{9}$/.test(phone.e164))) throw new Error("CHINA_MOBILE_REQUIRED");
  const instagram = raw.contactMethod === "email" ? "" : normalizeInstagram(raw.instagram);
  const contactMethod = raw.contactMethod;
  if (contactMethod !== "instagram" && contactMethod !== "email")
    throw new Error("CONTACT_REQUIRED");
  if (contactMethod === "instagram" && !instagram) throw new Error("CONTACT_REQUIRED");
  if (raw.termsAccepted !== true || raw.termsVersion !== ORDER_TERMS_VERSION)
    throw new Error("TERMS_REQUIRED");
  if (raw.importPolicyVersion !== IMPORT_POLICY_VERSION) throw new Error("IMPORT_POLICY_CHANGED");
  const checkoutLocale = String(raw.checkoutLocale ?? "en");
  if (!Object.hasOwn(CHECKOUT_COPY, checkoutLocale)) throw new Error("LOCALE_INVALID");
  const copy = checkoutCopy(checkoutLocale);
  const catalog = await readCatalog();
  const improvements = checkoutEnhancementsCopy(checkoutLocale);
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
    if (item.specialOrder !== undefined && typeof item.specialOrder !== "boolean") throw new Error("SPECIAL_ORDER_UNAVAILABLE");
    const specialOrder = item.specialOrder === true;
    if (specialOrder && (!isSpecialOrderEligible(product) || (sku?.extraUsd ?? 0) !== 0 || (sku?.extraKrw ?? 0) !== 0)) throw new Error("SPECIAL_ORDER_UNAVAILABLE");
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
      specialOrder,
      optionKey: sku?.key,
      optionLabel: [specialOrder ? specialOrderCopy(checkoutLocale).special : "", sku?.key, design ? modelLabel(design) : ""].filter(Boolean).join(" · ") || undefined,
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
      priceKrw: product.priceKrw + (sku?.extraKrw ?? 0) + (specialOrder ? SPECIAL_ORDER_EXTRA_KRW : 0),
      priceUsd: (product.priceUsd + (sku?.extraUsd ?? 0) + (specialOrder ? SPECIAL_ORDER_EXTRA_USD_CENTS : 0)) / 100,
    };
  });
  // Different designs may create several basket lines for the same SKU. Stock
  // belongs to that SKU, so validate the combined quantity before quoting payment.
  const skuQuantities = new Map<string, number>();
  for (const item of items) {
    const product = catalog.products.find((p) => p.id === item.productId)!;
    if (!product.options?.enabled) continue;
    const key = JSON.stringify([item.productId, item.optionKey]);
    const quantity = (skuQuantities.get(key) ?? 0) + item.qty;
    skuQuantities.set(key, quantity);
    const sku = product.options.skus.find((s) => s.key === item.optionKey);
    if (!sku || sku.stock < quantity) throw new Error("OPTION_UNAVAILABLE");
  }
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
  const parcelItems = items.map(item => ({...catalog.products.find(product => product.id === item.productId)!,qty:item.qty}));
  const plan = parcelPlan(parcelItems);
  const importPolicy = countryImportPolicy(country, plan.hasShoes);
  if (importPolicy.consultationRequired) throw new Error("DESTINATION_CONSULTATION_REQUIRED");
  const shipping = quoteShipping({
    country,
    method: "standard",
    subtotalKrw,
    subtotalUsd: subtotalCents / 100,
    qty,
    items: parcelItems,
    settings: catalog.shipping,
  });
  if (!shipping.available) throw new Error("SHIPPING_QUOTE_REQUIRED");
  const yen = japanYenQuote(country, items.map(item => ({
    ...catalog.products.find(product => product.id === item.productId)!, ...item,
  })), discountCents / 100);
  if (yen && raw.pay !== "paypal") throw new Error("JPY_PAYPAL_REQUIRED");
  if (yen) items.forEach((item, index) => { item.priceJpy = yen.unitPricesJpy[index]; });
  return {
    email,
    contactMethod,
    checkoutLocale,
    termsVersion: ORDER_TERMS_VERSION,
    importPolicyVersion: IMPORT_POLICY_VERSION,
    termsAccepted: true,
    termsAcceptedAt: new Date().toISOString(),
    acknowledgedTerms: {
      shipping: copy.shipping,
      duty: country === "US" ? copy.usDuty : copy.duty,
      design: copy.design,
      production: plan.hasShoes ? copy.production : improvements.accessoryTiming,
      destination: countryImportNotice(country, checkoutLocale, plan.hasShoes),
      agree: copy.agree,
      cancellationPolicy: internationalOrderPolicy(checkoutLocale).acknowledgement,
    },
    instagram: contactMethod === "instagram" ? instagram : "",
    name: clean(raw.name, 80),
    phone: phone.e164,
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
    shippingBasis: `${yen ? `일본 고정 결제 운임 JPY ${yen.shippingJpy} (${yen.shippingJpy / 6000}상자 × JPY 6,000) · ${JAPAN_PRICE_VERSION} · 아래 KRW/USD는 기존 운임 참고값: ` : ""}우체국 EMS · ${country} · ${EMS_BOX.widthMm}×${EMS_BOX.depthMm}×${EMS_BOX.heightMm}mm · ${EMS_BOX.billableKg}kg 구간 · 1켤레 1상자 · 환산 ${catalog.shipping.exchangeKrwPerUsd}원/USD · 환율 여유 ${catalog.shipping.pricing?.fxBufferPct ?? 0}% · 정산 차감 대비 ${catalog.shipping.pricing?.settlementReservePct ?? 0}% · 운임 여유 ${catalog.shipping.pricing?.costBufferPct ?? 0}% · ${catalog.shipping.pricing?.roundUsd ?? 0.01}USD 올림 · ${catalog.shipping.countryRates?.[country]?.note ?? ""}`,
    dutyTerms: country === "US" ? "PREPAID_BEFORE_DISPATCH" : "DESTINATION_RULES",
    totalKrw: subtotalKrw - discountKrw + shipping.krw,
    totalUsd: (subtotalCents - discountCents) / 100 + shipping.usd,
    currency: yen ? "JPY" : "USD",
    ...(yen ? { shippingJpy: yen.shippingJpy, totalJpy: yen.totalJpy, discountJpy: yen.discountJpy, priceVersion: JAPAN_PRICE_VERSION } : {}),
    items,
    couponCode,
    discountKrw,
    discountUsd: discountCents / 100,
  };
}

