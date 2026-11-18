import type { Product } from "./products";

// Product-detail titles retain the production display rule from
// th242016-boop/jidokaan@a280a93df3555ce2dfd719193ec6f6a9a1590ca5.
// Homepage and ordering translations are maintained separately.
const HANGUL = /[가-힣]/;

export function preservedProductDisplayName(
  product: Pick<Product, "id" | "name" | "shape" | "customizable">,
  locale: string,
) {
  if (locale === "ko") return product.name.ko || product.name.en || "지도칸";
  const preferred =
    locale === "ja" ? product.name.ja || product.name.en : product.name.en;
  if (preferred && !HANGUL.test(preferred)) return preferred;
  if (product.name.en && !HANGUL.test(product.name.en)) return product.name.en;
  if (product.id.includes("mid") || product.shape === "classic") {
    return "JIDOKAAN DRONE Mid-Cut Custom Boxing Shoes";
  }
  if (product.customizable || product.shape === "drone") {
    return "JIDOKAAN DRONE Custom Boxing Shoes";
  }
  return product.name.en || product.name.ja || "JIDOKAAN";
}
