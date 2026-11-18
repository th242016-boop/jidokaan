/** The option changes the order tier, never the private simulator access. */
export const SPECIAL_ORDER_EXTRA_USD_CENTS = 3000;
export const SPECIAL_ORDER_EXTRA_KRW = 30000;
export function isSpecialOrderEligible(product: { id: string; customizable?: boolean; priceUsd: number } | undefined) {
  return Boolean(product?.customizable && ["drone-custom", "drone-mid"].includes(product.id) && product.priceUsd === 25000);
}

export function specialOrderProduct<T extends { priceUsd: number; priceKrw: number }>(product: T, selected: boolean): T {
  return selected ? { ...product, priceUsd: product.priceUsd + SPECIAL_ORDER_EXTRA_USD_CENTS, priceKrw: product.priceKrw + SPECIAL_ORDER_EXTRA_KRW } : product;
}
