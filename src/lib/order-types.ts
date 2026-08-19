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
  note?: string;
  couponCode?: string;
  discountKrw?: number;
  discountUsd?: number;
  claim?: "cancel" | "return" | "exchange";
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
