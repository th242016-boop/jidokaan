/** Merchant pricing reserves, not a quotation of actual processor fees or live FX. */
export const SHIPPING_PRICING_VERSION = "shipping-buffer-2026-10-01";
export const SHIPPING_REFERENCE_FX = 1350;
export type ShippingPricing = {
  version: string;
  fxBufferPct: number;
  settlementReservePct: number;
  costBufferPct: number;
  roundUsd: number;
};
export const DEFAULT_SHIPPING_PRICING: ShippingPricing = {
  version: SHIPPING_PRICING_VERSION,
  fxBufferPct: 5,
  settlementReservePct: 8,
  costBufferPct: 3,
  roundUsd: 1,
};
export function validShippingPricing(p: ShippingPricing) {
  return (
    p &&
    p.version === SHIPPING_PRICING_VERSION &&
    Number.isFinite(p.fxBufferPct) &&
    p.fxBufferPct >= 0 &&
    p.fxBufferPct <= 40 &&
    Number.isFinite(p.settlementReservePct) &&
    p.settlementReservePct >= 0 &&
    p.settlementReservePct <= 40 &&
    Number.isFinite(p.costBufferPct) &&
    p.costBufferPct >= 0 &&
    p.costBufferPct <= 100 &&
    [0.01, 1, 5].includes(p.roundUsd)
  );
}
export function shippingPrice(krw: number, referenceFx: number, p: ShippingPricing) {
  if (
    !Number.isFinite(krw) ||
    krw < 0 ||
    !Number.isFinite(referenceFx) ||
    referenceFx < 100 ||
    referenceFx > 10000 ||
    !validShippingPricing(p)
  )
    throw new Error("SHIPPING_PRICING_INVALID");
  const effectiveFx = referenceFx * (1 - p.fxBufferPct / 100);
  const costTargetKrw = krw * (1 + p.costBufferPct / 100);
  // Gross up for deductions; adding 8% does not compensate an 8% deduction.
  const rawUsd = costTargetKrw / (effectiveFx * (1 - p.settlementReservePct / 100));
  const usd = Math.round(Math.ceil((rawUsd - 1e-10) / p.roundUsd) * p.roundUsd * 100) / 100;
  return {
    usd,
    effectiveFx,
    costTargetKrw,
    assumedNetKrw: usd * effectiveFx * (1 - p.settlementReservePct / 100),
  };
}
