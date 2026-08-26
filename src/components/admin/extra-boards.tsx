import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Coupon, StoreOrder, StoreReview } from "@/lib/order-types";
import {
  CLAIM_KIND_LABEL,
  CLAIM_STATUS_LABEL,
  COURIERS,
  ORDER_STATUS_LABEL,
  isPendingClaim,
} from "@/lib/order-types";

async function postOrder(body: Record<string, unknown>) {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { order?: StoreOrder; error?: string };
  if (!res.ok) throw new Error(data.error ?? "fail");
  return data.order;
}

function ClaimActions({
  token,
  order,
  onDone,
}: {
  token: string;
  order: StoreOrder;
  onDone: () => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  if (!isPendingClaim(order)) {
    return (
      <span className="text-[11px] text-[#666]">
        {order.claim
          ? `${CLAIM_KIND_LABEL[order.claim]} ${order.claimStatus ? CLAIM_STATUS_LABEL[order.claimStatus] : ""}`
          : "—"}
      </span>
    );
  }
  async function decide(decision: "accept" | "reject" | "cancel") {
    setBusy(true);
    try {
      await postOrder({ action: "decide", token, id: order.id, decision, note });
      onDone();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex min-w-[220px] flex-col gap-1">
      <p className="text-[11px] text-[#c00]">
        {CLAIM_KIND_LABEL[order.claim!]} 접수
        {order.claimReason ? ` · ${order.claimReason}` : ""}
      </p>
      <Input
        className="h-8"
        placeholder="처리 메모"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex flex-wrap gap-1">
        <Button size="sm" disabled={busy} onClick={() => void decide("accept")}>
          승인
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => void decide("reject")}
        >
          거부
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => void decide("cancel")}
        >
          접수취소
        </Button>
      </div>
    </div>
  );
}

export function ClaimsBoard({ token }: { token: string }) {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  async function load() {
    const res = await fetch(`/api/orders?token=${encodeURIComponent(token)}`);
    const data = (await res.json()) as { orders?: StoreOrder[] };
    setOrders(data.orders ?? []);
  }
  useEffect(() => {
    void load();
  }, [token]);
  const rows = orders.filter((o) => o.claim || ["cancel", "return", "exchange"].includes(o.status));
  const pending = rows.filter((o) => isPendingClaim(o)).length;
  return (
    <div className="space-y-3">
      <p className="text-sm text-[#444]">
        손님이 주문조회에서 넣은 취소·반품·교환이 여기와 배송현황관리에 같이 뜹니다. 대기{" "}
        <b>{pending}</b>건.
      </p>
      <ClaimTable token={token} rows={rows} empty="취소·반품·교환 요청이 없습니다." onDone={load} />
    </div>
  );
}

export function ShipStatusBoard({ token }: { token: string }) {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [filter, setFilter] = useState<"all" | "claim" | "shipped" | "ready">("all");
  async function load() {
    const res = await fetch(`/api/orders?token=${encodeURIComponent(token)}`);
    const data = (await res.json()) as { orders?: StoreOrder[] };
    setOrders(data.orders ?? []);
  }
  useEffect(() => {
    void load();
  }, [token]);

  const base = orders.filter(
    (o) =>
      ["ready", "shipped", "done", "confirmed", "return", "exchange"].includes(o.status) ||
      isPendingClaim(o, "return") ||
      isPendingClaim(o, "exchange"),
  );
  const rows = base.filter((o) => {
    if (filter === "claim") return isPendingClaim(o);
    if (filter === "shipped") return o.status === "shipped";
    if (filter === "ready") return o.status === "ready";
    return true;
  });

  async function patch(id: string, body: Record<string, unknown>) {
    await postOrder({ action: "update", token, id, ...body });
    await load();
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#444]">
        발송·송장·교환·반품을 여기서 처리합니다. 손님이 접수하면 이 목록에 바로 나옵니다.
      </p>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "전체"],
            ["claim", "교환·반품 접수"],
            ["ready", "배송준비"],
            ["shipped", "배송중"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-full px-3 py-1 text-sm ${
              filter === id ? "bg-[#111] text-white" : "bg-white border border-[#ddd]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded border border-[#d5d7dc] bg-white">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-[#f6f7f8] text-xs">
            <tr>
              <th className="px-3 py-2">주문번호</th>
              <th className="px-3 py-2">주문자</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">택배·송장</th>
              <th className="px-3 py-2">교환·반품</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-t border-[#eee] align-top">
                <td className="px-3 py-2">
                  <p className="font-medium">{o.id}</p>
                  <p className="text-[11px] text-[#666]">
                    {o.items.map((i) => i.name).join(", ")}
                  </p>
                </td>
                <td className="px-3 py-2">
                  {o.name}
                  <span className="block text-[11px] text-[#666]">{o.email}</span>
                </td>
                <td className="px-3 py-2">{ORDER_STATUS_LABEL[o.status]}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-1">
                    <select
                      className="h-8 rounded border border-[#ccc] bg-white px-2 text-xs"
                      value={o.courier ?? ""}
                      onChange={(e) => void patch(o.id, { courier: e.target.value })}
                    >
                      <option value="">택배사</option>
                      {COURIERS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <Input
                      className="h-8 w-40"
                      defaultValue={o.tracking ?? ""}
                      placeholder="송장번호"
                      onBlur={(e) => {
                        if (e.target.value !== (o.tracking ?? "")) {
                          void patch(o.id, { tracking: e.target.value });
                        }
                      }}
                    />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <ClaimActions token={token} order={o} onDone={() => void load()} />
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[#555]">
                  표시할 배송 건이 없습니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ClaimTable({
  token,
  rows,
  empty,
  onDone,
}: {
  token: string;
  rows: StoreOrder[];
  empty: string;
  onDone: () => void;
}) {
  const list = useMemo(() => rows, [rows]);
  return (
    <div className="overflow-x-auto rounded border border-[#d5d7dc] bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-[#f6f7f8] text-xs">
          <tr>
            <th className="px-3 py-2">주문번호</th>
            <th className="px-3 py-2">주문자</th>
            <th className="px-3 py-2">상품</th>
            <th className="px-3 py-2">금액</th>
            <th className="px-3 py-2">상태</th>
            <th className="px-3 py-2">처리</th>
          </tr>
        </thead>
        <tbody>
          {list.map((o) => (
            <tr key={o.id} className="border-t border-[#eee] align-top">
              <td className="px-3 py-2">{o.id}</td>
              <td className="px-3 py-2">
                {o.name}
                <span className="block text-[11px] text-[#666]">{o.email}</span>
              </td>
              <td className="px-3 py-2">{o.items.map((i) => i.name).join(", ")}</td>
              <td className="px-3 py-2">
                {o.currency === "KRW" ? `₩${o.totalKrw.toLocaleString()}` : `$${o.totalUsd}`}
              </td>
              <td className="px-3 py-2">{ORDER_STATUS_LABEL[o.status] ?? o.status}</td>
              <td className="px-3 py-2">
                <ClaimActions token={token} order={o} onDone={onDone} />
              </td>
            </tr>
          ))}
          {list.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-[#555]">
                {empty}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export function DelayBoard({ token }: { token: string }) {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  useEffect(() => {
    void fetch(`/api/orders?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []));
  }, [token]);
  const rows = orders.filter((o) => {
    const age = Date.now() - new Date(o.createdAt).getTime();
    return (o.status === "paid" || o.status === "ready") && age > 3 * 24 * 60 * 60 * 1000;
  });
  return <SimpleTable empty="3일 넘은 미발송 주문이 없습니다." rows={rows} />;
}

export function SettleBoard({ token }: { token: string }) {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  useEffect(() => {
    void fetch(`/api/orders?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []));
  }, [token]);
  const done = orders.filter((o) => o.status === "done" || o.status === "confirmed");
  const pending = orders.filter((o) => ["paid", "ready", "shipped"].includes(o.status));
  const sum = (list: StoreOrder[]) => list.reduce((s, o) => s + (o.totalKrw || 0), 0);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-[#e3e6ea] bg-white p-4">
          <p className="text-xs text-[#666]">정산예정</p>
          <p className="mt-1 text-xl font-semibold">{sum(pending).toLocaleString()}원</p>
        </div>
        <div className="rounded-lg border border-[#e3e6ea] bg-white p-4">
          <p className="text-xs text-[#666]">정산가능</p>
          <p className="mt-1 text-xl font-semibold">{sum(done).toLocaleString()}원</p>
        </div>
        <div className="rounded-lg border border-[#e3e6ea] bg-white p-4">
          <p className="text-xs text-[#666]">전체 주문</p>
          <p className="mt-1 text-xl font-semibold">{sum(orders).toLocaleString()}원</p>
        </div>
      </div>
      <SimpleTable empty="정산할 주문이 없습니다." rows={[...done, ...pending]} />
    </div>
  );
}

export function ReviewBoard({ token }: { token: string }) {
  const [items, setItems] = useState<StoreReview[]>([]);
  async function load() {
    const res = await fetch(`/api/reviews?token=${encodeURIComponent(token)}`);
    const data = (await res.json()) as { items?: StoreReview[] };
    setItems(data.items ?? []);
  }
  useEffect(() => {
    void load();
  }, [token]);
  return (
    <ul className="divide-y divide-[#eee] overflow-hidden rounded border border-[#d5d7dc] bg-white">
      {items.map((it) => (
        <li key={it.id} className="px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">
                {"★".repeat(it.rating)} {it.productName || it.productId}
              </p>
              <p className="text-[11px] text-[#666]">
                {it.name} · {it.createdAt.slice(0, 16).replace("T", " ")}
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                void fetch("/api/reviews", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "update",
                    token,
                    id: it.id,
                    status: it.status === "done" ? "new" : "done",
                  }),
                }).then(load)
              }
            >
              {it.status === "done" ? "미확인" : "확인"}
            </Button>
          </div>
          <p className="mt-2 text-sm">{it.body}</p>
        </li>
      ))}
      {items.length === 0 ? (
        <li className="px-4 py-10 text-center text-sm text-[#555]">리뷰가 없습니다.</li>
      ) : null}
    </ul>
  );
}

export function CouponBoard({
  coupons,
  busy,
  onSave,
}: {
  coupons: Coupon[];
  busy: boolean;
  onSave: (c: Coupon[]) => void;
}) {
  const [rows, setRows] = useState(coupons);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [offKrw, setOffKrw] = useState(10000);
  return (
    <div className="space-y-4">
      <div className="grid gap-2 rounded border border-[#d5d7dc] bg-white p-4 sm:grid-cols-4">
        <div>
          <Label>코드</Label>
          <Input className="mt-1" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        </div>
        <div>
          <Label>이름</Label>
          <Input className="mt-1" value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div>
          <Label>할인(원)</Label>
          <Input className="mt-1" type="number" value={offKrw} onChange={(e) => setOffKrw(Number(e.target.value) || 0)} />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            onClick={() => {
              if (!code.trim()) return;
              setRows([
                ...rows,
                {
                  id: `CP-${Date.now()}`,
                  code: code.trim(),
                  label: label || code,
                  offKrw,
                  offUsd: Math.round(offKrw / 1300),
                  enabled: true,
                },
              ]);
              setCode("");
              setLabel("");
            }}
          >
            추가
          </Button>
        </div>
      </div>
      <ul className="divide-y divide-[#eee] overflow-hidden rounded border border-[#d5d7dc] bg-white">
        {rows.map((c) => (
          <li key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>
              <b>{c.code}</b> · {c.label} · ₩{c.offKrw.toLocaleString()}
            </span>
            <button type="button" className="text-[#c00]" onClick={() => setRows(rows.filter((x) => x.id !== c.id))}>
              삭제
            </button>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="px-4 py-8 text-center text-[#555]">등록된 쿠폰이 없습니다.</li>
        ) : null}
      </ul>
      <Button disabled={busy} onClick={() => onSave(rows)}>
        {busy ? "저장 중…" : "쿠폰 저장"}
      </Button>
    </div>
  );
}

export function CustomerBoard({ token }: { token: string }) {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  useEffect(() => {
    void fetch(`/api/orders?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []));
  }, [token]);
  const people = new Map<string, { name: string; email: string; n: number; sum: number }>();
  for (const o of orders) {
    const key = o.email || o.name;
    const prev = people.get(key);
    people.set(key, {
      name: o.name,
      email: o.email,
      n: (prev?.n ?? 0) + 1,
      sum: (prev?.sum ?? 0) + (o.totalKrw || 0),
    });
  }
  const rows = [...people.values()].sort((a, b) => b.n - a.n);
  return (
    <div className="overflow-x-auto rounded border border-[#d5d7dc] bg-white">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="bg-[#f6f7f8] text-xs">
          <tr>
            <th className="px-3 py-2">고객</th>
            <th className="px-3 py-2">이메일</th>
            <th className="px-3 py-2">주문수</th>
            <th className="px-3 py-2">누적금액</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.email || r.name} className="border-t border-[#eee]">
              <td className="px-3 py-2">{r.name}</td>
              <td className="px-3 py-2">{r.email}</td>
              <td className="px-3 py-2">{r.n}</td>
              <td className="px-3 py-2">₩{r.sum.toLocaleString()}</td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-10 text-center text-[#555]">
                주문이 생기면 고객이 여기 모입니다.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function SimpleTable({ rows, empty }: { rows: StoreOrder[]; empty: string }) {
  const list = useMemo(() => rows, [rows]);
  return (
    <div className="overflow-x-auto rounded border border-[#d5d7dc] bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-[#f6f7f8] text-xs">
          <tr>
            <th className="px-3 py-2">주문번호</th>
            <th className="px-3 py-2">주문자</th>
            <th className="px-3 py-2">상품</th>
            <th className="px-3 py-2">금액</th>
            <th className="px-3 py-2">상태</th>
          </tr>
        </thead>
        <tbody>
          {list.map((o) => (
            <tr key={o.id} className="border-t border-[#eee]">
              <td className="px-3 py-2">{o.id}</td>
              <td className="px-3 py-2">
                {o.name}
                <span className="block text-[11px] text-[#666]">{o.email}</span>
              </td>
              <td className="px-3 py-2">{o.items.map((i) => i.name).join(", ")}</td>
              <td className="px-3 py-2">
                {o.currency === "KRW" ? `₩${o.totalKrw.toLocaleString()}` : `$${o.totalUsd}`}
              </td>
              <td className="px-3 py-2">{ORDER_STATUS_LABEL[o.status] ?? o.status}</td>
            </tr>
          ))}
          {list.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-[#555]">
                {empty}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
