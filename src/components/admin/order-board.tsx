import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Package, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderDetail, countryLabel, orderTime } from "./order-detail";
import { EmsPreparation, emsError, shipmentSummary } from "./ems-preparation";
import { canPrepareEms } from "@/lib/ems-workflow";
import {
  isCancelledOrder,
  ORDER_STATUS_LABEL,
  type OrderStatus,
  type StoreOrder,
} from "@/lib/order-types";

const MAIN = [
  { id: "all", label: "전체" },
  { id: "paid", label: "신규주문" },
  { id: "ready", label: "발송준비" },
  { id: "shipped", label: "배송중" },
  { id: "done", label: "배송완료" },
] as const;
type Filter = OrderStatus | "all" | "history";
const mainStatuses = new Set<OrderStatus>(["paid", "ready", "shipped", "done"]);

export function OrderBoard({ token, initialOrderId }: { token: string; initialOrderId?: string }) {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [msg, setMsg] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialOrderId || null);
  const [queue, setQueue] = useState<string[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<
    { paypalOrderId: string; createdAt: string; name: string; country: string; totalUsd: number }[]
  >([]);
  const [pendingError, setPendingError] = useState("");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/orders", { headers });
      if (!res.ok) throw new Error("LOAD_FAILED");
      const data = await res.json();
      if (!Array.isArray(data.orders)) throw new Error("LOAD_FAILED");
      if (initialOrderId && !data.orders.some((o: StoreOrder) => o.id === initialOrderId)) {
        const detail = await fetch(`/api/orders?id=${encodeURIComponent(initialOrderId)}`, {
          headers,
        });
        const found = detail.ok ? await detail.json() : null;
        if (found?.order) data.orders.push(found.order);
        else setLoadError("알림의 주문을 찾을 수 없습니다. 주문번호를 확인해 주세요.");
      }
      setOrders(data.orders);
      setPendingError("");
      try {
        const res = await fetch(`/api/paypal?token=${encodeURIComponent(token)}`);
        if (!res.ok) throw new Error("PAYMENT_QUEUE");
        setPending((await res.json()).pending ?? []);
      } catch {
        setPendingError("PayPal 저장 확인 대기 목록을 불러오지 못했습니다.");
      }
    } catch {
      setLoadError(
        "주문 조회에 실패했습니다. 관리자 로그인과 연결 상태를 확인하고 새로고침해 주세요.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    setSelectedId(initialOrderId || null);
    void load();
  }, [token, initialOrderId]);
  const operational = useMemo(
    () => orders.filter((o) => mainStatuses.has(o.status) && !isCancelledOrder(o)),
    [orders],
  );
  const rows = useMemo(() => {
    if (filter === "all") return operational;
    if (filter === "cancel") return orders.filter(isCancelledOrder);
    if (filter === "history")
      return orders.filter((o) => ["confirmed", "return", "exchange"].includes(o.status));
    return orders.filter((o) => o.status === filter && !isCancelledOrder(o));
  }, [orders, operational, filter]);
  const selectable = rows.filter(canPrepareEms);
  const allPicked = selectable.length > 0 && selectable.every((o) => picked.includes(o.id));
  const current = orders.find((o) => o.id === queue[0]);

  async function patch(id: string, body: Record<string, unknown>) {
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "update", token, id, ...body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "SAVE_FAILED");
      return true;
    } catch (err) {
      setMsg(emsError(err));
      return false;
    }
  }
  async function prepare(ids: string[]) {
    if (busy || !ids.length) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/ems", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "prepare", ids, token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "PREPARE_FAILED");
      const prepared: StoreOrder[] = data.orders ?? [];
      setOrders((old) => old.map((o) => prepared.find((p) => p.id === o.id) ?? o));
      setQueue(prepared.map((o) => o.id));
      setPicked([]);
      setSelectedId(null);
      setFilter("ready");
      setMsg(
        `${prepared.length}건의 발송 준비 화면을 열었습니다.${data.errors?.length ? ` 처리하지 못한 ${data.errors.length}건: ${data.errors.map((x: { id: string; error: string }) => `${x.id} — ${emsError(x.error)}`).join(" / ")}` : ""}`,
      );
    } catch (err) {
      setMsg(emsError(err));
    } finally {
      setBusy(false);
    }
  }
  async function cancel(id: string) {
    if (!window.confirm("주문을 취소 처리할까요? PayPal 환불은 자동 실행되지 않습니다.")) return;
    setBusy(true);
    if (await patch(id, { status: "cancel" })) {
      setMsg("취소 처리했습니다. 예외 처리에서 확인할 수 있습니다.");
      await load();
    }
    setBusy(false);
  }
  async function confirmPayment(o: StoreOrder) {
    if (!window.confirm("실제 입금 내역을 확인했나요? 미결제 주문은 발송 준비할 수 없습니다."))
      return;
    setBusy(true);
    if (await patch(o.id, { status: "paid" })) {
      await load();
      setMsg("입금 확인을 반영했습니다.");
    }
    setBusy(false);
  }
  async function recover(id: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/paypal", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "recover", token, orderID: id }),
      });
      const data = await res.json();
      if (!res.ok || !data.order?.id) throw new Error("NOT_CONFIRMED");
      await load();
      setSelectedId(data.order.id);
      setMsg("이미 완료된 PayPal 결제의 주문을 복구했습니다. 추가 결제는 하지 않았습니다.");
    } catch {
      setMsg(
        "결제 완료를 확인하지 못했습니다. PayPal 거래 상세를 확인해 주세요. 결제를 실행하지는 않았습니다.",
      );
    } finally {
      setBusy(false);
    }
  }
  function updateOrder(order: StoreOrder) {
    setOrders((old) => old.map((o) => (o.id === order.id ? order : o)));
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[.16em] text-slate-500">
              ORDER & SHIPPING
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">해외 주문 · EMS 발송 관리</h2>
            <p className="mt-2 text-sm text-slate-600">
              발송 정보를 확인하고, 스마트접수 후 우체국 창구에 직접 제출하세요.
            </p>
          </div>
          <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs text-slate-700">
            <ShieldCheck className="size-4" />
            창구 직접 반입
          </span>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {[
            "신규주문",
            "발송 준비",
            "EMS 확인·사전접수",
            "우체국 제출 대기",
            "발송·배송중",
            "배송완료",
          ].map((s, i) => (
            <span className="flex items-center gap-2" key={s}>
              <span>{s}</span>
              {i < 5 && <ArrowRight className="size-3 text-slate-300" />}
            </span>
          ))}
        </div>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="주문 처리 상태"
          className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1"
        >
          {MAIN.map((s) => (
            <button
              type="button"
              role="tab"
              aria-selected={filter === s.id}
              key={s.id}
              onClick={() => {
                setFilter(s.id);
                setPicked([]);
              }}
              className={`rounded-lg px-4 py-2.5 text-sm transition-colors ${filter === s.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {s.label}
              <span
                className={`ml-2 text-xs ${filter === s.id ? "text-slate-300" : "text-slate-400"}`}
              >
                {s.id === "all"
                  ? operational.length
                  : operational.filter((o) => o.status === s.id).length}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="예외 처리 및 과거 이력"
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
            value={["wait", "cancel", "history"].includes(filter) ? filter : ""}
            onChange={(e) => {
              setFilter((e.target.value || "all") as Filter);
              setPicked([]);
            }}
          >
            <option value="">예외 처리 · 과거 이력</option>
            <option value="wait">
              입금대기 ({orders.filter((o) => o.status === "wait" && !isCancelledOrder(o)).length})
            </option>
            <option value="cancel">취소 ({orders.filter(isCancelledOrder).length})</option>
            <option value="history">구매확정·반품·교환 이력</option>
          </select>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={loading || busy}
            onClick={() => void load()}
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="sm"
            disabled={busy || picked.length === 0}
            onClick={() => void prepare(picked)}
          >
            <Package className="size-4" />
            선택 주문 발송 준비{picked.length > 0 ? ` (${picked.length})` : ""}
          </Button>
          <p className="text-xs text-slate-600">결제 완료된 주문만 선택할 수 있습니다.</p>
        </div>
        <p className="text-xs text-slate-500">
          {filter === "all"
            ? "전체 = 신규주문 · 발송준비 · 배송중 · 배송완료"
            : filter === "history"
              ? "과거 처리 기록을 그대로 보존합니다."
              : filter === "wait"
                ? "입금 확인 전 발송할 수 없습니다."
                : `${rows.length}건 표시`}
        </p>
      </div>
      {loadError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {loadError}
        </p>
      )}
      {msg && (
        <p
          role="status"
          className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700"
        >
          {msg}
        </p>
      )}
      {pendingError && (
        <p role="alert" className="text-sm text-red-700">
          {pendingError}
        </p>
      )}
      {pending.length > 0 && (
        <details className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-amber-900">
            결제 예외 확인 · PayPal 저장 확인 대기 {pending.length}건
          </summary>
          <p className="my-3 text-xs leading-relaxed text-amber-900">
            미결제 시도도 포함됩니다. 결제 완료 주문으로 간주하지 마세요. 재확인은 실제 결제를
            실행하지 않고 이미 완료된 결제의 주문만 복구합니다.
          </p>
          {pending.map((p) => (
            <div
              key={p.paypalOrderId}
              className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-200 py-3 text-sm"
            >
              <span>
                {orderTime(p.createdAt)} · {p.name} · {countryLabel(p.country)} · $
                {p.totalUsd.toFixed(2)}
                <small className="block">PayPal {p.paypalOrderId}</small>
              </span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => void recover(p.paypalOrderId)}
              >
                결제 확인·주문 복구
              </Button>
            </div>
          ))}
        </details>
      )}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  className="size-4"
                  aria-label="발송 준비 가능한 주문 전체 선택"
                  checked={allPicked}
                  disabled={!selectable.length || busy}
                  onChange={() => setPicked(allPicked ? [] : selectable.map((o) => o.id))}
                />
              </th>
              <th className="px-3 py-3">주문</th>
              <th className="px-3 py-3">수취인 · 국가</th>
              <th className="px-3 py-3">상품 · 수량</th>
              <th className="px-3 py-3">결제 금액</th>
              <th className="px-3 py-3">처리 상태</th>
              <th className="px-3 py-3">다음 단계</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr
                key={o.id}
                className="border-t border-slate-100 align-top hover:bg-slate-50/70"
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest("button,a,input,select,textarea,label"))
                    setSelectedId(o.id);
                }}
              >
                <td className="px-4 py-4">
                  <input
                    className="size-4"
                    type="checkbox"
                    aria-label={`${o.id} 선택`}
                    checked={picked.includes(o.id)}
                    disabled={!canPrepareEms(o) || busy}
                    onChange={() =>
                      setPicked((cur) =>
                        cur.includes(o.id) ? cur.filter((id) => id !== o.id) : [...cur, o.id],
                      )
                    }
                  />
                </td>
                <td className="px-3 py-4">
                  <button
                    type="button"
                    onClick={() => setSelectedId(o.id)}
                    className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4"
                  >
                    {o.id}
                  </button>
                  <p className="mt-2 text-[11px] text-slate-500">{orderTime(o.createdAt)} KST</p>
                  <button
                    type="button"
                    onClick={() => setSelectedId(o.id)}
                    className="mt-2 text-xs text-slate-600"
                  >
                    디자인·주문 상세 보기 ↗
                  </button>
                </td>
                <td className="max-w-56 px-3 py-4">
                  <p className="font-medium">{o.name}</p>
                  <p className="mt-1 text-xs text-slate-600">{countryLabel(o.country)}</p>
                  <p className="mt-1 break-all text-[11px] text-slate-500">{o.email}</p>
                </td>
                <td className="max-w-56 px-3 py-4">
                  {o.items.map((it, i) => (
                    <p className="mb-1" key={i}>
                      {it.name} × {it.qty}
                      <span className="block text-xs text-slate-500">
                        {it.size ? `${it.size} mm` : "사이즈 미입력"}
                      </span>
                    </p>
                  ))}
                </td>
                <td className="px-3 py-4 tabular-nums">
                  {o.currency === "KRW"
                    ? `₩${o.totalKrw.toLocaleString()}`
                    : `$${o.totalUsd.toFixed(2)}`}
                  <p className="mt-1 text-xs text-slate-500">{o.pay}</p>
                </td>
                <td className="max-w-48 px-3 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${o.status === "done" ? "bg-emerald-50 text-emerald-800" : o.status === "wait" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-700"}`}
                  >
                    {ORDER_STATUS_LABEL[o.status] ?? o.status}
                  </span>
                  {o.fulfillment ? (
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                      {shipmentSummary(o)}
                    </p>
                  ) : o.tracking ? (
                    <p className="mt-2 text-xs text-slate-500">기존 송장 {o.tracking}</p>
                  ) : null}
                  {o.claim && (
                    <p className="mt-1 text-xs text-amber-800">고객 요청 이력 · {o.claim}</p>
                  )}
                </td>
                <td className="px-3 py-4">
                  <div className="flex flex-col items-start gap-2">
                    {canPrepareEms(o) ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => void prepare([o.id])}
                      >
                        발송 준비 <ArrowRight className="size-3" />
                      </Button>
                    ) : o.fulfillment ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setQueue([o.id])}
                      >
                        EMS 정보·상태
                      </Button>
                    ) : null}
                    {o.status === "wait" && o.pay !== "paypal" && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => void confirmPayment(o)}
                      >
                        입금 확인
                      </Button>
                    )}
                    {o.status === "wait" && o.pay === "paypal" && (
                      <span className="text-xs text-amber-800">PayPal 결제 확인 필요</span>
                    )}
                    {["wait", "paid", "ready"].includes(o.status) &&
                      !o.fulfillment?.packages.some(
                        (p) => p.state !== "preparing" && p.state !== "registration_failed",
                      ) && (
                        <button
                          type="button"
                          className="text-xs text-slate-500 underline"
                          disabled={busy}
                          onClick={() => void cancel(o.id)}
                        >
                          취소 처리
                        </button>
                      )}
                    {!canPrepareEms(o) && !o.fulfillment && (
                      <span className="text-xs text-slate-500">상세·기존 기록 확인</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="py-14 text-center text-sm text-slate-500">
                  {loading
                    ? "주문을 불러오는 중…"
                    : loadError
                      ? "주문 조회 실패"
                      : "해당 상태의 주문이 없습니다."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {selectedId && orders.find((o) => o.id === selectedId) && (
        <OrderDetail
          key={selectedId}
          order={orders.find((o) => o.id === selectedId)!}
          onClose={() => setSelectedId(null)}
          onPrepare={() => {
            const order = orders.find((o) => o.id === selectedId)!;
            if (order.fulfillment) {
              setSelectedId(null);
              setQueue([order.id]);
            } else void prepare([order.id]);
          }}
          onSave={async (id, body) => {
            const ok = await patch(id, body);
            if (ok) await load();
            return ok;
          }}
        />
      )}
      {current && (
        <EmsPreparation
          key={current.id}
          token={token}
          order={current}
          remaining={queue.length}
          onChange={updateOrder}
          onClose={() => setQueue((q) => q.slice(1))}
        />
      )}
    </div>
  );
}
