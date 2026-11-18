import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteShell } from "@/components/store/site-shell";
import { type ClaimKind, type StoreOrder } from "@/lib/order-types";
import { useStore } from "@/lib/store";
import { customerOrderCopy } from "@/lib/customer-order-copy";
import { requestedLocale } from "@/lib/locale-preference";
import { CustomerOrderDetails } from "@/components/store/customer-order-details";
import { customerOrderDetailCopy } from "@/lib/customer-order-detail-copy";
import { matchesCustomerOrder } from "@/lib/customer-order-view";
import { getReviewOrder, IS_REVIEW_PREVIEW, REVIEW_EMAIL, REVIEW_ORDER_ID } from "@/lib/review-preview";

const searchSchema = z.object({
  id: z.string().optional().catch(undefined),
  lang: z.string().optional().transform(requestedLocale),
});

export const Route = createFileRoute("/orders")({
  validateSearch: searchSchema,
  component: OrdersPage,
});

function claimError(code: string, copy: ReturnType<typeof customerOrderCopy>) {
  if (code === "NOT_FOUND") return copy.notFound;
  if (code === "NOT_ALLOWED") return copy.notAllowed;
  if (code === "REASON") return copy.reasonError;
  if (code === "NO_CLAIM") return copy.noClaim;
  return copy.requestError;
}

function OrdersPage() {
  const locale = useStore((s) => s.locale);
  const copy = customerOrderCopy(locale);
  const { id: qid, lang } = Route.useSearch();
  const [id, setId] = useState(qid ?? "");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [kind, setKind] = useState<ClaimKind>("return");
  const [reason, setReason] = useState("");
  const [previewEmail, setPreviewEmail] = useState(REVIEW_EMAIL);
  useEffect(() => { if (IS_REVIEW_PREVIEW) setPreviewEmail(getReviewOrder().email); }, []);

  const canCancel = order ? ["wait", "paid", "ready"].includes(order.status) : false;
  const canReturn = order ? ["shipped", "done", "confirmed"].includes(order.status) : false;
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
    setOrder(null);
    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lookup", id: id.trim(), email: email.trim() }) });
      const data = (await res.json()) as { order?: StoreOrder; error?: string };
      if (!res.ok || !matchesCustomerOrder(data.order, id.trim(), email.trim())) {
        setOrder(null);
        setMsg(claimError(data.error ?? "NOT_FOUND", copy));
        return;
      }
      setOrder(data.order!);
      const next = ["wait", "paid", "ready"].includes(data.order!.status) ? "cancel" : "return";
      setKind(next);
    } catch {
      setMsg(copy.requestError);
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
        setMsg(claimError(data.error ?? "fail", copy));
        return;
      }
      setOrder(data.order);
      setReason("");
      setMsg(copy.received);
    } catch {
      setMsg(copy.requestError);
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
        setMsg(claimError(data.error ?? "fail", copy));
        return;
      }
      setOrder(data.order);
      setMsg(copy.withdrawn);
    } catch {
      setMsg(copy.requestError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteShell requestedLocale={lang}>
      <div className="container-page py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight">{copy.lookupTitle}</h1>
          <p className="mt-3 text-muted">{copy.lookupHelp}</p>
          {IS_REVIEW_PREVIEW ? <div className="mt-4 rounded-xl border border-amber-500 bg-amber-50 p-4 text-sm text-amber-950">
            <p>{customerOrderDetailCopy(locale).preview}</p>
            <p className="mt-2">{copy.orderNumber}: {REVIEW_ORDER_ID}<br />{copy.email}: {previewEmail}</p>
          </div> : null}

          <form
            className="mt-8 space-y-3 rounded-3xl border border-border bg-surface p-5 sm:p-6"
            onSubmit={lookup}
          >
            <div className="space-y-1.5">
              <Label htmlFor="oid">{copy.orderNumber}</Label>
              <Input
                id="oid"
                autoComplete="off"
                spellCheck={false}
                value={id}
                onChange={(e) => setId(e.target.value.toUpperCase())}
                placeholder="JDK-…"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="oem">{copy.email}</Label>
              <Input
                id="oem"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={busy}>
              {busy ? copy.lookingUp : copy.lookUp}
            </Button>
          </form>

          {msg ? (
            <p role="status" aria-live="polite" className="mt-4 text-sm text-muted">
              {msg}
            </p>
          ) : null}

          {order ? (
            <div className="mt-8 space-y-4 rounded-3xl border border-border bg-surface p-5 sm:p-6">
              <div>
                <p className="text-xs tracking-wide text-subtle uppercase">{order.id}</p>
                <p className="mt-1 text-xl font-semibold">{copy.statuses[order.status]}</p>
                {order.claim ? (
                  <p className="mt-2 text-sm">
                    {copy.claimKinds[order.claim]}{" "}
                    {order.claimStatus ? copy.claimStatuses[order.claimStatus] : ""}
                    {order.claimReason ? ` · ${order.claimReason}` : ""}
                  </p>
                ) : null}
              </div>

              <CustomerOrderDetails order={order} locale={locale} />

              {IS_REVIEW_PREVIEW ? <p className="text-sm text-muted">{customerOrderDetailCopy(locale).preview}</p> : pending ? (
                <div className="rounded-2xl bg-surface-muted p-4 text-sm">
                  <p>{copy.pendingRequest}</p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-3"
                    disabled={busy}
                    onClick={() => void withdraw()}
                  >
                    {copy.withdraw}
                  </Button>
                </div>
              ) : allowedKinds.length ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium">{copy.claimsTitle}</p>
                  <div className="flex flex-wrap gap-2">
                    {allowedKinds.map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setKind(k)}
                        aria-pressed={kind === k}
                        className={`rounded-full px-3 py-1.5 text-sm ${
                          kind === k ? "bg-fg text-bg" : "bg-surface-muted"
                        }`}
                      >
                        {copy.claimKinds[k]}
                      </button>
                    ))}
                  </div>
                  <label htmlFor="claim-reason" className="block text-sm font-medium">{copy.reason}</label>
                  <textarea
                    id="claim-reason"
                    className="min-h-24 w-full rounded-xl border border-border bg-surface px-3 py-2 text-base text-fg placeholder:text-muted focus-ring sm:text-sm"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={copy.reason}
                  />
                  <Button type="button" disabled={busy} onClick={() => void submitClaim()}>
                    {copy.submit}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted">{copy.noRequests}</p>
              )}
            </div>
          ) : null}

          <p className="mt-8 text-center text-sm text-muted">
            <Link to="/shipping" className="underline-offset-4 hover:underline">
              {copy.shippingInfo}
            </Link>
          </p>
        </div>
      </div>
    </SiteShell>
  );
}
