import type { Coupon } from "./order-types";

export function findCoupon(coupons: Coupon[], code: string) {
  const needle = code.trim().toUpperCase();
  if (!needle) return undefined;
  return coupons.find((c) => c.enabled !== false && c.code.toUpperCase() === needle);
}

export function couponDiscount(
  coupon: Coupon,
  subtotalKrw: number,
  subtotalUsdCents: number,
) {
  if (coupon.type === "percent") {
    const p = Math.max(0, Math.min(100, coupon.percent ?? 0));
    return {
      krw: Math.round((subtotalKrw * p) / 100),
      usdCents: Math.round((subtotalUsdCents * p) / 100),
    };
  }
  return {
    krw: Math.max(0, coupon.offKrw ?? 0),
    usdCents: Math.max(0, (coupon.offUsd ?? 0) * 100),
  };
}

export function couponRejectReason(
  coupon: Coupon | undefined,
  subtotalKrw: number,
  orderCount: number,
  today = new Date().toISOString().slice(0, 10),
): string | null {
  if (!coupon) return "없는 코드입니다.";
  if (coupon.start && coupon.start > today) return "아직 시작 전인 쿠폰입니다.";
  if (coupon.end && coupon.end < today) return "기간이 끝난 쿠폰입니다.";
  if ((coupon.minKrw ?? 0) > subtotalKrw) {
    return `${(coupon.minKrw ?? 0).toLocaleString()}원 이상 주문부터 쓸 수 있습니다.`;
  }
  if (coupon.target === "first" && orderCount > 0) return "첫 구매 전용 쿠폰입니다.";
  if (coupon.target === "repeat" && orderCount < 1) return "재구매 고객 전용 쿠폰입니다.";
  return null;
}
