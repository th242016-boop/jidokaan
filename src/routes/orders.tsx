import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteShell } from "@/components/store/site-shell";
import {
  CLAIM_KIND_LABEL,
  CLAIM_STATUS_LABEL,
  ORDER_STATUS_LABEL,
  type ClaimKind,
  type StoreOrder,
} from "@/lib/order-types";
import { useStore } from "@/lib/store";

const searchSchema = z.object({
  id: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/orders")({
  validateSearch: searchSchema,
  component: OrdersPage,
});

function claimError(code: string, ko: boolean) {
  if (code === "NOT_FOUND") return ko ? "주문번호 또는 이메일이 맞지 않습니다." : "Order not found.";
  if (code === "NOT_ALLOWED") return ko ? "지금 상태에서는 신청할 수 없습니다." : "Not allowed for this status.";
  if (code === "REASON") return ko ? "사유를 4자 이상 적어 주세요." : "Please write a reason (4+ characters).";
  if (code === "NO_CLAIM") return ko ? "접수된 신청이 없습니다." : "No open request.";
  return ko ? "처리하지 못했습니다. 다시 시도해 주세요." : "Could not complete the request.";
}

function OrdersPage() {
  const locale = useStore((s) => s.locale);
  const ko = locale === "ko";
  const { id: qid } = Route.useSearch();
  const [id, setId] = useState(qid ?? "");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [kind, setKind] = useState<ClaimKind>("return");
  const [reason, setReason] = useState("");

  const canCancel = order ? ["wait", "paid", "ready"].includes(order.status) : false;
  const canReturn = order
    ? ["shipped", "done", "confirmed"].includes(order.status)
    : false;
  const pending = order?.claimStatus === "requested";

  const allowedKinds = useMemo(() => {
    const list: ClaimKind[] = [];
    if (canCancel) list.push("cancel");
    if (canReturn) {
      list.push("return");
      list.push("exchange");
    }
    return list;
  }, [canCancel, canReturn]);

  async function lookup(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/orders?id=${encodeURIComponent(id.trim())}&email=${encodeURIComponent(email.trim())}`,
      );
      const data = (await res.json()) as { order?: StoreOrder; error?: string };
      if (!res.ok || !data.order) {
        setOrder(null);
        setMsg(claimError(data.error ?? "NOT_FOUND", ko));
        return;
      }
      setOrder(data.order);
      const next = ["wait", "paid", "ready"].includes(data.order.status)
        ? "cancel"
        : "return";
      setKind(next);
    } finally {
      setBusy(false);
    }
  }

  async function submitClaim() {
    if (!order) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "claim",
          id: order.id,
          email,
          kind,
          reason,
        }),
      });
      const data = (await res.json()) as { order?: StoreOrder; error?: string };
      if (!res.ok || !data.order) {
        setMsg(claimError(data.error ?? "fail", ko));
        return;
      }
      setOrder(data.order);
      setReason("");
      setMsg(ko ? "접수했습니다. 관리자가 확인하면 연락드립니다." : "Request received.");
    } finally {
      setBusy(false);
    }
  }

  async function withdraw() {
    if (!order) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "withdraw", id: order.id, email }),
      });
      const data = (await res.json()) as { order?: StoreOrder; error?: string };
      if (!res.ok || !data.order) {
        setMsg(claimError(data.error ?? "fail", ko));
        return;
      }
      setOrder(data.order);
      setMsg(ko ? "접수를 취소했습니다." : "Request withdrawn.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteShell>
      <div className="container-page py-12 sm:py-16">
        <div className="mx-auto max-w-xl">
          <h1 className="text-3xl font-semibold tracking-tight">
            {ko ? "주문조회" : "Order lookup"}
          </h1>
          <p className="mt-3 text-muted">
            {ko
              ? "주문번호와 주문 시 이메일을 넣으면 배송 상태 확인, 교환·반품 접수를 할 수 있습니다."
              : "Look up your order to check shipping or request an exchange/return."}
          </p>

          <form className="mt-8 space-y-3 rounded-3xl border border-border bg-surface p-5 sm:p-6" onSubmit={lookup}>
            <div className="space-y-1.5">
              <Label htmlFor="oid">{ko ? "주문번호" : "Order number"}</Label>
              <Input
                id="oid"
                value={id}
                onChange={(e) => setId(e.target.value.toUpperCase())}
                placeholder="JDK-…"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="oem">{ko ? "이메일" : "Email"}</Label>
              <Input
                id="oem"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={busy}>
              {busy ? (ko ? "조회 중…" : "Looking up…") : ko ? "조회하기" : "Look up"}
            </Button>
          </form>

          {msg ? <p className="mt-4 text-sm text-muted">{msg}</p> : null}

          {order ? (
            <div className="mt-8 space-y-4 rounded-3xl border border-border bg-surface p-5 sm:p-6">
              <div>
                <p className="text-xs tracking-wide text-subtle uppercase">
                  {order.id}
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {ORDER_STATUS_LABEL[order.status]}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {order.name} · {order.items.map((it) => `${it.name} × ${it.qty}`).join(", ")}
                </p>
                {order.courier || order.tracking ? (
                  <p className="mt-2 text-sm">
                    {order.courier ? `${order.courier} ` : ""}
                    {order.tracking || ""}
                  </p>
                ) : null}
                {order.claim ? (
                  <p className="mt-2 text-sm">
                    {CLAIM_KIND_LABEL[order.claim]}{" "}
                    {order.claimStatus ? CLAIM_STATUS_LABEL[order.claimStatus] : ""}
                    {order.claimReason ? ` · ${order.claimReason}` : ""}
                  </p>
                ) : null}
              </div>

              {pending ? (
                <div className="rounded-2xl bg-surface-muted p-4 text-sm">
                  <p>
                    {ko
                      ? "신청이 접수되어 있습니다. 관리자 확인 전 접수를 취소할 수 있습니다."
                      : "Your request is pending. You can withdraw it before we review it."}
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-3"
                    disabled={busy}
                    onClick={() => void withdraw()}
                  >
                    {ko ? "접수 취소" : "Withdraw request"}
                  </Button>
                </div>
              ) : allowedKinds.length ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    {ko ? "교환 · 반품 · 취소 접수" : "Exchange, return, or cancel"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allowedKinds.map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setKind(k)}
                        className={`rounded-full px-3 py-1.5 text-sm ${
                          kind === k ? "bg-fg text-bg" : "bg-surface-muted"
                        }`}
                      >
                        {CLAIM_KIND_LABEL[k]}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="min-h-24 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={ko ? "사유를 적어 주세요 (4자 이상)" : "Reason (4+ characters)"}
                  />
                  <Button type="button" disabled={busy} onClick={() => void submitClaim()}>
                    {ko ? "접수하기" : "Submit request"}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted">
                  {ko
                    ? "이 주문은 지금 추가로 신청할 수 있는 항목이 없습니다."
                    : "No further requests are available for this order."}
                </p>
              )}
            </div>
          ) : null}

          <p className="mt-8 text-center text-sm text-muted">
            <Link to="/shipping" className="underline-offset-4 hover:underline">
              {ko ? "배송 안내" : "Shipping info"}
            </Link>
          </p>
        </div>
      </div>
    </SiteShell>
  );
}
