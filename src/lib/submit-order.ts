import type { StoreOrder } from "./order-types";

/** A payment confirmation is not an order-save confirmation. */
export async function submitOrder(
  payload: unknown,
  request: typeof fetch = fetch,
): Promise<StoreOrder> {
  const response = await request("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as { order?: StoreOrder; error?: string };
  if (!response.ok || !data.order?.id) throw new Error(data.error || "ORDER_SAVE_FAILED");
  return data.order;
}
