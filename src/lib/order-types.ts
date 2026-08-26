export type OrderStatus =
  | "wait"
  | "paid"
  | "ready"
  | "shipped"
  | "done"
  | "confirmed"
  | "cancel"
  | "return"
  | "exchange";

export type ClaimKind = "cancel" | "return" | "exchange";
export type ClaimStatus = "requested" | "accepted" | "rejected" | "cancelled";

export type OrderItem = {
  productId: string;
  name: string;
  qty: number;
  size?: string;
  priceKrw: number;
  priceUsd: number;
};

export type StoreOrder = {
  id: string;
  createdAt: string;
  email: string;
  phone: string;
  name: string;
  address: string;
  city: string;
  region: string;
  postal: string;
  country: string;
  pay: string;
  depositor?: string;
  shipMethod: string;
  shippingKrw: number;
  shippingUsd: number;
  totalKrw: number;
  totalUsd: number;
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
  items: OrderItem[];
};

export type InboxItem = {
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
  ready: "배송준비",
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
