import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ORDER_STATUS_LABEL, type OrderStatus, type StoreOrder } from "@/lib/order-types";

const STATUSES: { id: OrderStatus | "all"; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "wait", label: "입금대기" },
  { id: "paid", label: "신규주문" },
  { id: "ready", label: "배송준비" },
  { id: "shipped", label: "배송중" },
  { id: "done", label: "배송완료" },
  { id: "confirmed", label: "구매확정" },
  { id: "cancel", label: "취소" },
  { id: "return", label: "반품" },
  { id: "exchange", label: "교환" },
];

export function OrderBoard({ token }: { token: string }) {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/orders?token=${encodeURIComponent(token)}`);
    const data = (await res.json()) as { orders?: StoreOrder[]; error?: string };
    if (!res.ok) {
      setMsg(data.error === "AUTH" ? "다시 로그인해 주세요." : "주문 목록을 불러오지 못했습니다.");
      setOrders([]);
      return;
    }
    setOrders(Array.isArray(data.orders) ? data.orders : []);
  }

  useEffect(() => {
    void load();
  }, [token]);

  const rows = useMemo(
    () => (filter === "all" ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  );

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", token, id, ...body }),
    });
    if (!res.ok) {
      setMsg("주문 수정에 실패했습니다.");
      return;
    }
    setMsg("반영했습니다.");
    await load();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 rounded border border-[#d5d7dc] bg-white px-3 py-2 text-sm">
        {STATUSES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setFilter(s.id)}
            className={`rounded-full px-3 py-1 ${
              filter === s.id ? "bg-[#111] text-white" : "bg-[#f3f3f3]"
            }`}
          >
            {s.label}{" "}
            <b>
              {s.id === "all"
                ? orders.length
                : orders.filter((o) => o.status === s.id).length}
            </b>
          </button>
        ))}
      </div>
      {msg ? <p className="text-sm text-[#333]">{msg}</p> : null}
      <div className="overflow-x-auto rounded border border-[#d5d7dc] bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-[#f6f7f8] text-xs">
            <tr>
              <th className="px-3 py-2">주문번호</th>
              <th className="px-3 py-2">주문자</th>
              <th className="px-3 py-2">상품</th>
              <th className="px-3 py-2">금액</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">송장</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-t border-[#eee] align-top">
                <td className="px-3 py-2">
                  <p className="font-medium">{o.id}</p>
                  <p className="text-[11px] text-[#666]">
                    {o.createdAt.slice(0, 16).replace("T", " ")}
                  </p>
                </td>
                <td className="px-3 py-2">
                  <p>{o.name}</p>
                  <p className="text-[11px] text-[#555]">{o.email}</p>
                  <p className="text-[11px] text-[#555]">
                    {o.country} · {o.address}
                  </p>
                </td>
                <td className="px-3 py-2">
                  {o.items.map((it, i) => (
                    <p key={i}>
                      {it.name} × {it.qty}
                      {it.size ? ` (${it.size})` : ""}
                    </p>
                  ))}
                </td>
                <td className="px-3 py-2">
                  {o.currency === "KRW"
                    ? `₩${o.totalKrw.toLocaleString()}`
                    : `$${o.totalUsd}`}
                </td>
                <td className="px-3 py-2">
                  <select
                    className="h-9 rounded border border-[#ccc] bg-white px-2"
                    value={o.status}
                    onChange={(e) =>
                      void patch(o.id, { status: e.target.value })
                    }
                  >
                    {STATUSES.filter((s) => s.id !== "all").map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <Input
                      className="h-9 w-36"
                      defaultValue={o.tracking ?? ""}
                      placeholder="송장번호"
                      onBlur={(e) => {
                        if (e.target.value !== (o.tracking ?? "")) {
                          void patch(o.id, { tracking: e.target.value });
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      type="button"
                      onClick={() =>
                        void patch(o.id, {
                          status: o.status === "wait" ? "paid" : "shipped",
                        })
                      }
                    >
                      {o.status === "wait" ? "입금확인" : "발송"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[#555]">
                  주문이 없습니다. 결제하면 여기에 쌓입니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
