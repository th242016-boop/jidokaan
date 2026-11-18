import type { EmsFulfillment, EmsManualDeliveryConfirmation } from "./ems-types";
export type OrderStatus =
  "wait" | "paid" | "ready" | "shipped" | "done" | "confirmed" | "cancel" | "return" | "exchange";

export function isCancelledOrder(order: { status?: string; claim?: string } | null | undefined) {
  const status = String(order?.status ?? "").toLowerCase();
  const claim = String(order?.claim ?? "").toLowerCase();
  return (
    status === "cancel" || status === "cancelled" || status === "canceled" || claim === "cancel"
  );
}

export type ClaimKind = "cancel" | "return" | "exchange";
export type ClaimStatus = "requested" | "accepted" | "rejected" | "cancelled";

export type OrderItem = {
  productId: string;
  name: string;
  qty: number;
  size?: string;
  sizeFit?: string;
  specialOrder?: boolean;
  optionKey?: string;
  optionLabel?: string;
  color?: string;
  designPreview?: string;
  designVersion?: string;
  designKey?: string;
  partNames?: Record<string, string>;
  partColors?: Record<string, string>;
  priceKrw: number;
  priceUsd: number;
  /** Fixed JPY unit price, only on orders actually charged in Japanese yen. */
  priceJpy?: number;
};

export type AdminShippingGuidance = {
  title: string;
  lines: string[];
  reviewedAt: string;
};

export type StoreOrder = {
  /** Added only to authenticated admin API responses, never customer projection. */
  adminShippingGuidance?: AdminShippingGuidance;
  id: string;
  createdAt: string;
  email: string;
  phone: string;
  instagram?: string;
  contactMethod?: "instagram" | "email";
  checkoutLocale?: string;
  termsVersion?: string;
  importPolicyVersion?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  acknowledgedTerms?: {
    shipping: string;
    duty: string;
    design: string;
    production: string;
    agree: string;
    destination?: string;
    /** Policy accepted at purchase time; do not regenerate for historical orders. */
    cancellationPolicy?: string;
  };
  name: string;
  address: string;
  city: string;
  region: string;
  postal: string;
  country: string;
  pay: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  paypalGrossUsd?: number;
  paypalFeeUsd?: number;
  paypalNetUsd?: number;
  paypalCurrency?: "USD" | "JPY";
  paypalGrossAmount?: number;
  paypalFeeAmount?: number;
  paypalNetAmount?: number;
  paypalShipping?: {
    name?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    region?: string;
    postal?: string;
    country?: string;
  };
  depositor?: string;
  shipMethod: string;
  shippingBasis?: string;
  dutyTerms?: "DAP" | "DESTINATION_RULES" | "PREPAID_BEFORE_DISPATCH";
  shippingKrw: number;
  shippingUsd: number;
  totalKrw: number;
  totalUsd: number;
  /** Additive actual-payment fields: legacy USD/KRW order values are never reinterpreted. */
  shippingJpy?: number;
  totalJpy?: number;
  discountJpy?: number;
  priceVersion?: string;
  currency: string;
  status: OrderStatus;
  tracking?: string;
  courier?: string;
  note?: string;
  couponCode?: string;
  discountKrw?: number;
  discountUsd?: number;
  claim?: ClaimKind;
  claimStatus?: ClaimStatus;
  claimReason?: string;
  claimAt?: string;
  claimAdminNote?: string;
  fulfillment?: EmsFulfillment;
  deliveryCompletion?: EmsManualDeliveryConfirmation & { fingerprint?: string };
  /** Customer-safe parcel projection. Never contains customs IDs or internal audit data. */
  customerParcels?: CustomerParcel[];
  items: OrderItem[];
};

export type CustomerParcel = {
  id: string;
  state: "preparing" | "awaiting_dropoff" | "in_transit" | "delivered" | "customs_delay" | "delivery_failed" | "returned";
  tracking?: string;
  handedOverAt?: string;
  deliveredAt?: string;
  manuallyConfirmed?: boolean;
  trackingUnavailable?: boolean;
};

export type InboxItem = {
  locale?: string;
  id: string;
  createdAt: string;
  name: string;
  email: string;
  message: string;
  status: "new" | "done";
};

export type StoreReview = {
  id: string;
  createdAt: string;
  productId: string;
  productName: string;
  name: string;
  rating: number;
  body: string;
  status: "new" | "done";
};

export type Coupon = {
  id: string;
  code: string;
  label: string;
  offKrw: number;
  offUsd: number;
  enabled: boolean;
  type?: "amount" | "percent";
  percent?: number;
  minKrw?: number;
  target?: "all" | "first" | "repeat";
  start?: string;
  end?: string;
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  wait: "입금대기",
  paid: "신규주문",
  ready: "발송준비",
  shipped: "배송중",
  done: "배송완료",
  confirmed: "구매확정",
  cancel: "취소",
  return: "반품",
  exchange: "교환",
};

export const CLAIM_KIND_LABEL: Record<ClaimKind, string> = {
  cancel: "취소",
  return: "반품",
  exchange: "교환",
};

export const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
  requested: "접수",
  accepted: "승인",
  rejected: "거부",
  cancelled: "접수취소",
};

export const COURIERS = [
  "우체국택배",
  "우체국 EMS",
  "CJ대한통운",
  "한진택배",
  "롯데택배",
  "로젠택배",
  "DHL",
  "FedEx",
  "UPS",
  "기타",
] as const;

export function isPendingClaim(order: StoreOrder, kind?: ClaimKind) {
  if (!order.claim) return false;
  if (kind && order.claim !== kind) return false;
  if (order.claimStatus === "requested") return true;
  if (!order.claimStatus && order.status !== order.claim) return true;
  return false;
}

/** Public order projection; never expose merchant-only notes/settlement data. */
export function customerOrder(order: StoreOrder): StoreOrder {
  const {
    note, adminShippingGuidance, paypalFeeUsd, paypalNetUsd, paypalGrossUsd, paypalOrderId, paypalCaptureId,
    paypalCurrency, paypalGrossAmount, paypalFeeAmount, paypalNetAmount,
    paypalShipping, shippingBasis, claimAdminNote, fulfillment, deliveryCompletion,
    customerParcels: _previousProjection, ...publicOrder
  } = order;
  const customerParcels = fulfillment?.packages.map((parcel): CustomerParcel => ({
    id: parcel.id,
    state: ["registration_unknown", "registration_failed"].includes(parcel.state)
      ? "preparing" : parcel.state as CustomerParcel["state"],
    tracking: parcel.tracking,
    handedOverAt: parcel.handedOverAt,
    deliveredAt: parcel.deliveredAt,
    manuallyConfirmed: Boolean(parcel.manualDelivery),
    trackingUnavailable: Boolean(parcel.trackingCheck && parcel.trackingCheck.outcome !== "ok"),
  }));
  return { ...publicOrder, ...(customerParcels ? { customerParcels } : {}) };
}
