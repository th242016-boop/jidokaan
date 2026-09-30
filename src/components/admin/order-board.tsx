import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { OrderDetail, countryLabel, orderTime } from "./order-detail";
import { Input } from "@/components/ui/input";
import { isCancelledOrder, type OrderStatus, type StoreOrder } from "@/lib/order-types";

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
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<
    { paypalOrderId: string; createdAt: string; name: string; country: string; totalUsd: number }[]
  >([]);
  const [pendingError, setPendingError] = useState("");

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch(`/api/orders?token=${encodeURIComponent(token)}`);
      if (!res.ok) throw new Error("LOAD_FAILED");
      const data = (await res.json()) as { orders?: StoreOrder[] };
      if (!Array.isArray(data.orders)) throw new Error("LOAD_FAILED");
      setOrders(data.orders);
      setPendingError("");
      try {
        const paymentResponse = await fetch(`/api/paypal?token=${encodeURIComponent(token)}`);
        if (!paymentResponse.ok) throw new Error("PAYMENT_QUEUE");
        const queue = await paymentResponse.json();
        setPending(queue.pending ?? []);
      } catch {
        setPendingError("PayPal 저장 확인 대기 목록을 불러오지 못했습니다.");
      }
    } catch {
      setLoadError(
        "주문을 불러오지 못했습니다. 연결 상태 또는 관리자 로그인을 확인하고 새로고침해 주세요.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [token]);

  const active = useMemo(() => orders.filter((o) => !isCancelledOrder(o)), [orders]);
  const rows = useMemo(() => {
    if (filter === "all") return active;
    if (filter === "cancel") return orders.filter((o) => isCancelledOrder(o));
    return orders.filter((o) => o.status === filter && !isCancelledOrder(o));
  }, [orders, active, filter]);

  const allOnPage = rows.length > 0 && rows.every((o) => picked.includes(o.id));

  async function patch(id: string, body: Record<string, unknown>) {
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", token, id, ...body }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMsg(
          data.error === "TRACKING_REQUIRED"
            ? "송장번호를 먼저 저장한 후 발송 처리해 주세요."
            : "주문 수정에 실패했습니다.",
        );
        return false;
      }
      return true;
    } catch {
      setMsg("연결 오류로 주문을 수정하지 못했습니다.");
      return false;
    }
  }

  async function cancelIds(ids: string[]) {
    if (!ids.length) {
      setMsg("취소할 주문을 선택하세요.");
      return;
    }
    if (!window.confirm(`${ids.length}건을 취소 처리할까요? PayPal 환불은 자동 실행되지 않습니다.`))
      return;
    setBusy(true);
    let ok = 0;
    for (const id of ids) {
      if (await patch(id, { status: "cancel" })) ok += 1;
    }
    setBusy(false);
    setPicked([]);
    setMsg(`${ok}건 취소했습니다. 취소 탭에서 확인할 수 있습니다.`);
    setFilter("cancel");
    await load();
  }

  async function deleteIds(ids: string[]) {
    if (!ids.length) {
      setMsg("삭제할 주문을 선택하세요.");
      return;
    }
    if (!window.confirm(`${ids.length}건을 목록에서 완전히 삭제할까요? 복구할 수 없습니다.`))
      return;
    setBusy(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", token, ids }),
    });
    setBusy(false);
    if (!res.ok) {
      setMsg("삭제에 실패했습니다.");
      return;
    }
    const data = (await res.json()) as { deleted?: number };
    setPicked([]);
    setMsg(`${data.deleted ?? 0}건 삭제했습니다.`);
    await load();
  }

  async function recover(id: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "recover", token, orderID: id }),
      });
      const data = await res.json();
      if (!res.ok || !data.order?.id) throw new Error("NOT_CONFIRMED");
      await load();
      setSelectedId(data.order.id);
      setMsg(
        "PayPal 결제 완료를 확인하고 저장된 주문을 불러왔습니다. 추가 결제는 하지 않았습니다.",
      );
    } catch {
      setMsg(
        "결제 완료를 확인하지 못했습니다. 미결제·대기 상태일 수 있으므로 PayPal 거래 상세에서 확인해 주세요. 이 기능은 결제를 실행하지 않습니다.",
      );
    } finally {
      setBusy(false);
    }
  }

  function toggle(id: string) {
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function toggleAll() {
    if (allOnPage) {
      const ids = new Set(rows.map((o) => o.id));
      setPicked((cur) => cur.filter((id) => !ids.has(id)));
      return;
    }
    setPicked((cur) => Array.from(new Set([...cur, ...rows.map((o) => o.id)])));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 rounded border border-[#d5d7dc] bg-white px-3 py-2 text-sm">
        {STATUSES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setFilter(s.id);
              setPicked([]);
            }}
            className={`rounded-full px-3 py-1 ${
              filter === s.id ? "bg-[#111] text-white" : "bg-[#f3f3f3]"
            }`}
          >
            {s.label}{" "}
            <b>
              {s.id === "all"
                ? active.length
                : s.id === "cancel"
                  ? orders.filter((o) => isCancelledOrder(o)).length
                  : orders.filter((o) => o.status === s.id && !isCancelledOrder(o)).length}
            </b>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {filter === "cancel" ? (
          <Button
            type="button"
            variant="secondary"
            disabled={busy || picked.length === 0}
            onClick={() => void deleteIds(picked)}
          >
            선택 {picked.length}건 삭제
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            disabled={busy || picked.length === 0}
            onClick={() => void cancelIds(picked)}
          >
            선택 {picked.length}건 취소처리
          </Button>
        )}
        <p className="text-xs text-[#666]">
          {filter === "cancel"
            ? "취소된 주문은 여기서만 보입니다. 선택 후 삭제하면 목록에서 사라집니다."
            : "취소하면 전체 목록에서 빠지고 취소 탭으로 이동합니다."}
        </p>
      </div>
      <Button type="button" variant="secondary" disabled={loading} onClick={() => void load()}>
        {loading ? "불러오는 중…" : "주문 새로고침"}
      </Button>
      {loadError ? (
        <p role="alert" className="text-sm text-red-700">
          {loadError}
        </p>
      ) : null}
      {msg ? <p className="text-sm text-[#333]">{msg}</p> : null}
      {pendingError ? (
        <p role="alert" className="text-sm text-red-700">
          {pendingError}
        </p>
      ) : null}
      {pending.length ? (
        <section className="rounded border border-amber-300 bg-amber-50 p-4">
          <h3 className="font-semibold">
            PayPal 결제 시도 / 주문 저장 확인 대기 · {pending.length}건
          </h3>
          <p className="my-2 text-sm">
            이 목록은 미결제 시도도 포함합니다. 결제 완료 주문으로 간주하지 마세요. 재확인은 실제
            결제를 실행하지 않고, 이미 완료된 결제의 주문만 복구합니다.
          </p>
          {pending.map((p) => (
            <div
              key={p.paypalOrderId}
              className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-200 py-2 text-sm"
            >
              <span>
                {orderTime(p.createdAt)} KST · {p.name} · {countryLabel(p.country)} · $
                {p.totalUsd.toFixed(2)}
                <small className="block">PayPal {p.paypalOrderId}</small>
              </span>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => void recover(p.paypalOrderId)}
              >
                결제 확인·주문 복구
              </Button>
            </div>
          ))}
        </section>
      ) : null}
      <div className="overflow-x-auto rounded border border-[#d5d7dc] bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-[#f6f7f8] text-xs">
            <tr>
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={allOnPage}
                  onChange={toggleAll}
                  aria-label="현재 목록 전체 선택"
                />
              </th>
              <th className="px-3 py-2">주문번호</th>
              <th className="px-3 py-2">주문자</th>
              <th className="px-3 py-2">상품</th>
              <th className="px-3 py-2">금액</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">처리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-t border-[#eee] align-top">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={picked.includes(o.id)}
                    onChange={() => toggle(o.id)}
                    aria-label={`${o.id} 선택`}
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="font-medium underline underline-offset-4"
                    onClick={() => setSelectedId(o.id)}
                  >
                    {o.id}
                  </button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="my-2"
                    type="button"
                    onClick={() => setSelectedId(o.id)}
                  >
                    상세보기
                  </Button>
                  <p className="text-[11px] text-[#666]">{orderTime(o.createdAt)} KST</p>
                </td>
                <td className="px-3 py-2">
                  <p>{o.name}</p>
                  <p className="text-[11px] text-[#555]">{o.email}</p>
                  <p className="text-[11px] text-[#555]">
                    {countryLabel(o.country)} · {o.address}
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
                  {o.currency === "KRW" ? `₩${o.totalKrw.toLocaleString()}` : `$${o.totalUsd}`}
                </td>
                <td className="px-3 py-2">
                  <select
                    className="h-9 rounded border border-[#ccc] bg-white px-2"
                    value={o.status}
                    onChange={(e) =>
                      void patch(o.id, { status: e.target.value }).then((ok) => {
                        if (ok) {
                          setMsg("반영했습니다.");
                          void load();
                        }
                      })
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
                  <div className="flex flex-wrap gap-1">
                    {o.status === "wait" ? (
                      <Button
                        size="sm"
                        type="button"
                        onClick={() =>
                          void patch(o.id, { status: "paid" }).then((ok) => {
                            if (ok) {
                              setMsg("입금 확인했습니다.");
                              void load();
                            }
                          })
                        }
                      >
                        입금확인
                      </Button>
                    ) : null}
                    {o.status !== "cancel" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        type="button"
                        disabled={busy}
                        onClick={() => void cancelIds([o.id])}
                      >
                        취소
                      </Button>
                    ) : (
                      <span className="text-[11px] text-[#888]">취소됨</span>
                    )}
                    <Input
                      className="h-9 w-32"
                      defaultValue={o.tracking ?? ""}
                      placeholder="송장번호"
                      onBlur={(e) => {
                        if (e.target.value !== (o.tracking ?? "")) {
                          void patch(o.id, { tracking: e.target.value }).then((ok) => {
                            if (ok) {
                              setMsg("송장을 저장했습니다.");
                              void load();
                            }
                          });
                        }
                      }}
                    />
                    {o.status !== "wait" && o.status !== "cancel" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        type="button"
                        onClick={() =>
                          void patch(o.id, { status: "shipped" }).then((ok) => {
                            if (ok) {
                              setMsg("발송 처리했습니다.");
                              void load();
                            }
                          })
                        }
                      >
                        발송
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[#555]">
                  {loading ? "불러오는 중…" : loadError ? "주문 조회 실패" : "주문이 없습니다."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {selectedId && orders.find((o) => o.id === selectedId) ? (
        <OrderDetail
          key={selectedId}
          order={orders.find((o) => o.id === selectedId)!}
          onClose={() => setSelectedId(null)}
          onSave={async (id, body) => {
            const ok = await patch(id, body);
            if (ok) await load();
            return ok;
          }}
        />
      ) : null}
    </div>
  );
}
