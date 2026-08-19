export type FaqItem = {
  id: string;
  q: string;
  a: string;
  enabled: boolean;
};

export type BlackCustomer = {
  id: string;
  email: string;
  name: string;
  reason: string;
  createdAt: string;
};

export function normalizeCoupon(c: {
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
}) {
  return {
    id: c.id,
    code: c.code,
    label: c.label,
    offKrw: c.offKrw,
    offUsd: c.offUsd,
    enabled: c.enabled !== false,
    type: c.type ?? "amount",
    percent: c.percent ?? 0,
    minKrw: c.minKrw ?? 0,
    target: c.target ?? "all",
    start: c.start ?? "",
    end: c.end ?? "",
  };
}
