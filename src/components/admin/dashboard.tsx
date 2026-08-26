import { useEffect, useState } from "react";
import { ChevronRight, RefreshCw } from "lucide-react";
import type { AdminPageId } from "@/components/admin/admin-shell";
import type { InboxItem, StoreOrder, StoreReview } from "@/lib/order-types";
import { isPendingClaim } from "@/lib/order-types";
import type { Product } from "@/lib/products";

export function Dashboard({
  token,
  products,
  onGo,
}: {
  token: string;
  products: Product[];
  onGo: (id: AdminPageId) => void;
}) {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [at, setAt] = useState("");

  async function load() {
    const [o, i, r] = await Promise.all([
      fetch(`/api/orders?token=${encodeURIComponent(token)}`).then((x) => x.json()),
      fetch(`/api/inbox?token=${encodeURIComponent(token)}`).then((x) => x.json()),
      fetch(`/api/reviews?token=${encodeURIComponent(token)}`).then((x) => x.json()),
    ]);
    setOrders(o.orders ?? []);
    setInbox(i.items ?? []);
    setReviews(r.items ?? []);
    setAt(new Date().toTimeString().slice(0, 5));
  }

  useEffect(() => {
    void load();
  }, [token]);

  const n = (s: StoreOrder["status"]) => orders.filter((o) => o.status === s).length;
  const claims = {
    cancel: orders.filter((o) => isPendingClaim(o, "cancel")).length,
    return: orders.filter((o) => isPendingClaim(o, "return")).length,
    exchange: orders.filter((o) => isPendingClaim(o, "exchange")).length,
  };
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  const delayed = orders.filter(
    (o) =>
      (o.status === "paid" || o.status === "ready") &&
      Date.now() - new Date(o.createdAt).getTime() > threeDays,
  ).length;
  const settleToday = orders
    .filter((o) => o.status === "confirmed" || o.status === "done")
    .reduce((s, o) => s + (o.totalKrw || 0), 0);
  const pending = orders
    .filter((o) => o.status === "paid" || o.status === "ready" || o.status === "shipped")
    .reduce((s, o) => s + (o.totalKrw || 0), 0);

  const pipe = [
    { id: "wait" as const, label: "입금대기", count: n("wait"), go: "orders" as const },
    { id: "paid" as const, label: "신규주문", count: n("paid"), go: "orders" as const },
    { id: "ready" as const, label: "배송준비", count: n("ready"), go: "orders" as const },
    { id: "shipped" as const, label: "배송중", count: n("shipped"), go: "orders" as const },
    { id: "done" as const, label: "배송완료", count: n("done"), go: "orders" as const },
    { id: "confirmed" as const, label: "구매확정", count: n("confirmed"), go: "orders" as const },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.7fr_0.9fr]">
        <section className="rounded-lg border border-[#e3e6ea] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold">
              <span className="inline-block size-2.5 rounded-full bg-[#00c73c]" />
              판매 관리
            </h2>
            <button type="button" onClick={() => void load()} className="text-[11px] text-[#888]">
              최근 {at || "--:--"} <RefreshCw className="ml-1 inline size-3" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1 sm:grid-cols-6">
            {pipe.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onGo(p.go)}
                className="relative rounded-md px-1 py-2 text-center hover:bg-[#f6f8fa]"
              >
                <p className="text-[12px] text-[#555]">{p.label}</p>
                <p className="mt-1 text-[28px] font-semibold leading-none text-[#111]">
                  {p.count}
                  <span className="ml-0.5 text-sm font-normal text-[#888]">건</span>
                </p>
                {idx < pipe.length - 1 ? (
                  <ChevronRight className="absolute -right-1 top-1/2 size-4 -translate-y-1/2 text-[#ccc]" />
                ) : null}
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-6 border-t border-[#eee] pt-3 text-[13px] text-[#555] sm:grid-cols-4">
            <span>오늘출발 <b className="ml-2 text-[#111]">0</b></span>
            <span>예약구매 <b className="ml-2 text-[#111]">0</b></span>
            <span>주문제작 <b className="ml-2 text-[#111]">{orders.filter((o) => o.items.some((it) => it.productId.includes("custom"))).length}</b></span>
            <span>해외배송 <b className="ml-2 text-[#111]">{orders.filter((o) => o.country !== "KR").length}</b></span>
          </div>
        </section>

        <section className="rounded-lg border border-[#e3e6ea] bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold">
              <span className="inline-block size-2.5 rounded-full bg-[#00c73c]" />
              정산 관리
            </h2>
            <button type="button" onClick={() => onGo("settle")} className="text-[12px] text-[#00a832]">
              바로가기
            </button>
          </div>
          <Row label="오늘정산" value={`${settleToday.toLocaleString()}원`} />
          <Row label="정산예정" value={`${pending.toLocaleString()}원`} />
          <Row label="이번 달 매출" value={`${orders.reduce((s, o) => s + (o.totalKrw || 0), 0).toLocaleString()}원`} />
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Mini
          title="취소 · 반품 · 교환"
          color="#ef4444"
          rows={[
            ["취소요청", claims.cancel],
            ["반품요청", claims.return],
            ["교환요청", claims.exchange],
          ]}
          onClick={() => onGo("shipstatus")}
        />
        <Mini
          title="판매 지연"
          color="#f97316"
          rows={[
            ["발송지연", delayed],
            ["배송준비 대기", n("paid") + n("ready")],
            ["송장 미입력", orders.filter((o) => o.status === "ready" && !o.tracking).length],
          ]}
          onClick={() => onGo("delay")}
        />
        <Mini
          title="상품 관리"
          color="#0ea5e9"
          rows={[
            ["판매중 상품", products.filter((p) => p.visible !== false && p.inStock).length],
            ["품절 상품", products.filter((p) => !p.inStock).length],
            ["숨긴 상품", products.filter((p) => p.visible === false).length],
          ]}
          onClick={() => onGo("list")}
        />
        <Mini
          title="리뷰 현황"
          color="#22c55e"
          rows={[
            ["새로 작성된 리뷰", reviews.filter((r) => r.status === "new").length],
            ["전체 리뷰", reviews.length],
            ["낮은 평점(1–2)", reviews.filter((r) => r.rating <= 2).length],
          ]}
          onClick={() => onGo("reviews")}
        />
      </div>

      <section className="rounded-lg border border-[#e3e6ea] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold">
            <span className="inline-block size-2.5 rounded-full bg-[#00c73c]" />
            문의 · 리뷰 현황
          </h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-[13px] font-medium">확인 필요한 문의</p>
            <div className="flex flex-wrap gap-2">
              <Chip onClick={() => onGo("inbox")} active>
                미답변 {inbox.filter((x) => x.status === "new").length}
              </Chip>
              <Chip onClick={() => onGo("inbox")}>전체 {inbox.length}</Chip>
            </div>
            {inbox.filter((x) => x.status === "new").length === 0 ? (
              <p className="mt-6 text-sm text-[#888]">미답변 신규 문의가 없어요.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {inbox
                  .filter((x) => x.status === "new")
                  .slice(0, 4)
                  .map((x) => (
                    <li key={x.id} className="truncate text-[#333]">
                      {x.name} · {x.message}
                    </li>
                  ))}
              </ul>
            )}
          </div>
          <div>
            <p className="mb-2 text-[13px] font-medium">확인 필요한 리뷰</p>
            {reviews.length === 0 ? (
              <p className="mt-6 text-sm text-[#888]">아직 등록된 리뷰가 없습니다.</p>
            ) : (
              <ul className="space-y-3">
                {reviews.slice(0, 4).map((r) => (
                  <li key={r.id} className="text-sm">
                    <p className="text-[#222]">{r.body}</p>
                    <p className="mt-0.5 text-[11px] text-[#888]">
                      {r.name} · {"★".repeat(r.rating)} · {r.createdAt.slice(0, 10)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#f0f0f0] py-2.5 text-[13px]">
      <span className="text-[#555]">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function Mini({
  title,
  color,
  rows,
  onClick,
}: {
  title: string;
  color: string;
  rows: [string, number][];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-[#e3e6ea] bg-white p-4 text-left"
    >
      <p className="mb-3 flex items-center gap-2 text-[13px] font-semibold">
        <span className="inline-block size-2.5 rounded-full" style={{ background: color }} />
        {title}
      </p>
      <ul className="space-y-1.5 text-[13px]">
        {rows.map(([k, v]) => (
          <li key={k} className="flex justify-between">
            <span className="text-[#555]">{k}</span>
            <span className="font-semibold" style={{ color: v ? color : "#111" }}>
              {v}
            </span>
          </li>
        ))}
      </ul>
    </button>
  );
}

function Chip({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
        active ? "bg-[#00c73c] text-white" : "bg-[#f1f3f5] text-[#333]"
      }`}
    >
      {children}
    </button>
  );
}
