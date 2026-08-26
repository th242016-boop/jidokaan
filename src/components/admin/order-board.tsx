import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type OrderStatus, type StoreOrder } from "@/lib/order-types";

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

  async function load() {
    const res = await fetch(`/api/orders?token=${encodeURIComponent(token)}`);
    const data = (await res.json()) as { orders?: StoreOrder[] };
    setOrders(data.orders ?? []);
  }

  useEffect(() => {
    void load();
  }, [token]);

  const rows = useMemo(
    () => (filter === "all" ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  );

  const allOnPage = rows.length > 0 && rows.every((o) => picked.includes(o.id));

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", token, id, ...body }),
    });
    if (!res.ok) {
      setMsg("주문 수정에 실패했습니다.");
      return false;
    }
    return true;
  }

  async function cancelIds(ids: string[]) {
    if (!ids.length) {
      setMsg("취소할 주문을 선택하세요.");
      return;
    }
    if (!window.confirm(`${ids.length}건을 취소 처리할까요?`)) return;
    setBusy(true);
    let ok = 0;
    for (const id of ids) {
      if (await patch(id, { status: "cancel" })) ok += 1;
    }
    setBusy(false);
    setPicked([]);
    setMsg(`${ok}건 취소했습니다.`);
    await load();
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
                ? orders.length
                : orders.filter((o) => o.status === s.id).length}
            </b>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={busy || picked.length === 0}
          onClick={() => void cancelIds(picked)}
        >
          선택 {picked.length}건 취소처리
        </Button>
        <p className="text-xs text-[#666]">
          입금대기 테스트 주문은 체크한 뒤 취소하면 됩니다. 목록에서 지우지 않고 취소 탭으로 이동합니다.
        </p>
      </div>
      {msg ? <p className="text-sm text-[#333]">{msg}</p> : null}
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
                  주문이 없습니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
