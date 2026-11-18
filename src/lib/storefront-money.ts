import { formatProductPrice, formatProductCompare, type Currency } from "./i18n";
import type { Product } from "./products";
import { japanYenQuote } from "./order-money";
import { checkoutCopy } from "./checkout-copy";

/** Amount is already JPY. Never pass it through the legacy USD-cent formatter. */
export function formatYen(amount: number, locale = "ja") {
  return new Intl.NumberFormat(locale === "tl" ? "fil" : locale, {
    style: "currency", currency: "JPY", currencyDisplay: "code",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

export function storefrontProductPrice(product: Product, currency: Currency, country: string, locale = "en") {
  const yen = japanYenQuote(country, [{...product, productId: product.id, qty: 1, priceUsd: product.priceUsd / 100}]);
  return yen ? formatYen(yen.unitPricesJpy[0], locale) : formatProductPrice(product, currency);
}

export function storefrontProductCompare(product: Product, currency: Currency, country: string) {
  // No approved JPY comparison price exists. Do not mix a USD comparison into a JPY offer.
  return japanYenQuote(country, [{...product, productId: product.id, qty: 1, priceUsd: product.priceUsd / 100}])
    ? null : formatProductCompare(product, currency);
}

const yenNotices: Record<string, string> = {
  ko: "제품 가격과 배송비는 일본 엔화(JPY)로 결제됩니다.",
  en: "Product prices and shipping are charged in Japanese yen (JPY).",
  ja: "商品代金と送料は日本円（JPY）で決済されます。",
  zh: "商品及运费以日元（JPY）结算。",
  "zh-Hant": "商品及運費以日元（JPY）結算。",
  es: "Los productos y el envío se cobran en yenes japoneses (JPY).",
  fr: "Les produits et le port sont facturés en yens japonais (JPY).",
  de: "Waren und Versand werden in japanischen Yen (JPY) berechnet.",
  it: "Prodotti e spedizione si pagano in yen giapponesi (JPY).",
  pt: "Produtos e frete são cobrados em ienes japoneses (JPY).",
  ru: "Товары и доставка оплачиваются в японских иенах (JPY).",
  tr: "Ürünler ve kargo Japon yeni (JPY) olarak ödenir.",
  uz: "Mahsulot va yetkazish haqi Yaponiya iyenasida (JPY) to‘lanadi.",
  th: "ราคาสินค้าและค่าจัดส่งชำระเป็นเงินเยนญี่ปุ่น (JPY)",
  hi: "उत्पाद और शिपिंग का भुगतान जापानी येन (JPY) में होगा।",
  tl: "Japanese yen (JPY) ang bayad para sa produkto at shipping.",
  ar: "تُدفع أسعار المنتجات والشحن بالين الياباني (JPY).",
};

export function paymentCurrencyNotice(locale: string, currency: string) {
  return currency === "JPY" ? (yenNotices[locale] ?? yenNotices.en) : checkoutCopy(locale).price;
}
