import { useEffect, useState } from "react";
import type { StoreOrder } from "@/lib/order-types";

export function SalesBoard({ token }: { token: string }) {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  useEffect(() => {
    void fetch(`/api/orders?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []));
  }, [token]);

  const paid = orders.filter((o) => !["cancel"].includes(o.status));
  const sales = paid.reduce((s, o) => s + (o.totalKrw || 0), 0);
  const count = paid.length;
  const aov = count ? Math.round(sales / count) : 0;
  const byProduct = new Map<string, { n: number; won: number }>();
  for (const o of paid) {
    for (const it of o.items ?? []) {
      const cur = byProduct.get(it.name) ?? { n: 0, won: 0 };
      cur.n += it.qty;
      cur.won += (it.priceKrw || 0) * it.qty;
      byProduct.set(it.name, cur);
    }
  }
  const top = [...byProduct.entries()].sort((a, b) => b[1].won - a[1].won).slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card label="판매금액" value={`${sales.toLocaleString()}원`} />
        <Card label="주문건수" value={`${count}건`} />
        <Card label="객단가" value={`${aov.toLocaleString()}원`} />
      </div>
      <section className="rounded-lg border border-[#e3e6ea] bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold">상품별 판매</h3>
        {top.length === 0 ? (
          <p className="text-sm text-[#888]">주문이 쌓이면 상품별 매출이 보입니다.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {top.map(([name, v]) => (
              <li key={name} className="flex justify-between gap-3">
                <span className="truncate">{name}</span>
                <span>
                  {v.n}건 · {v.won.toLocaleString()}원
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e3e6ea] bg-white p-4">
      <p className="text-xs text-[#666]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
