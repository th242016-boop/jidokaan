import { pickLocalized, type Currency, type Locale } from "./i18n";
import { catalogProductCopy } from "./catalog-product-copy";
import { localizedProductText, type Product } from "./products";
import { productionCopy } from "./production-copy";
import { productShippingCopy } from "./storefront-detail-copy";
import { storefrontProductPrice } from "./storefront-money";
import { productDetailTranslations } from "./product-detail-translations";

const priceLabels: Record<string, string> = {
  ko: "상품 가격", en: "Product price", ja: "商品価格", zh: "商品价格", "zh-Hant": "商品價格",
  es: "Precio del producto", fr: "Prix du produit", de: "Produktpreis", it: "Prezzo del prodotto",
  pt: "Preço do produto", ru: "Цена товара", tr: "Ürün fiyatı", uz: "Mahsulot narxi",
  th: "ราคาสินค้า", hi: "उत्पाद की कीमत", tl: "Presyo ng produkto",
};

function currentDetailNotices(id: string, text: string): string {
  if (!["drone-custom", "drone-mid"].includes(id)) return text;
  return text
    .replaceAll("아웃솔 교체 50,000원", "아웃솔 교체 65,000원")
    .replaceAll("outsole recraft ₩50,000", "outsole recraft ₩65,000")
    .replaceAll("アウトソール交換₩50,000", "アウトソール交換₩65,000")
    .replace("Same handmade fight boot with a taller collar for extra ankle support.", "Handmade fight boots with a lower collar than the high-cut model.")
    .replace("同じ手製で、足首サポートのためカラーが高めです。", "ハイカットより履き口が低い手作りのボクシングシューズです。")
    .replaceAll("수제 제작 평균 20~30일 + 배송", productionCopy("ko").notice)
    .replace(/About 20–30 days(?: to make)?\./g, productionCopy("en").notice)
    .replace(/製作約20–30日。/g, productionCopy("ja").notice)
    .replace(/KR ₩288,000 \/ worldwide USD (?:230|250)\./g, "KR ₩288,000 / international product price USD 250.")
    .replace(/韓国₩288,000 \/ 海外USD (?:230|250)。/g, "韓国₩288,000 / 海外の商品価格USD 250。");
}

/** Display-only corrections. Stored catalog copy, image order and historical orders stay intact. */
export function productDetailBody(product: Product, locale: Locale, currency: Currency, country: string): string {
  const raw = pickLocalized(product.description, locale);
  const catalogCopy = catalogProductCopy(product.id, locale);
  const translated = productDetailTranslations[locale]?.[product.id];
  // Merchant-authored translations take precedence. Translate only recognized original catalog text.
  const useTranslation = translated && catalogCopy &&
    localizedProductText(product, "description", locale) === catalogCopy.description;
  let body = useTranslation ? translated : currentDetailNotices(product.id, raw);
  if (!["drone-custom", "drone-mid"].includes(product.id)) return body;

  const price = `${priceLabels[locale] ?? priceLabels.en}: ${storefrontProductPrice(product, currency, country, locale)}`;
  const oldPrice = /한국 288,000원 \/ 해외 USD (?:230|250)|KR ₩288,000 \/ international product price USD 250\.|韓国₩288,000 \/ 海外の商品価格USD 250。/g;
  if (oldPrice.test(body)) {
    body = body.replace(oldPrice, price);
  } else if (useTranslation) {
    body += `\n\n${productionCopy(locale).notice}\n${price}\n${productShippingCopy(locale).body}`;
  }
  return body;
}
