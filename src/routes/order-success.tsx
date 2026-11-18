import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/store/site-shell";
import { customerOrderCopy } from "@/lib/customer-order-copy";
import { useStore } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";
import { getReviewOrder, IS_REVIEW_PREVIEW, REVIEW_ORDER_ID } from "@/lib/review-preview";
import { requestedLocale } from "@/lib/locale-preference";
import { confirmationCredentials, matchesCustomerOrder } from "@/lib/customer-order-view";
import { customerOrderDetailCopy } from "@/lib/customer-order-detail-copy";
import { CustomerOrderDetails } from "@/components/store/customer-order-details";
import type { StoreOrder } from "@/lib/order-types";

const searchSchema = z.object({
  order: z.string().optional().catch(undefined),
  lang: z.string().optional().transform(requestedLocale),
});

export const Route = createFileRoute("/order-success")({
  validateSearch: searchSchema,
  component: OrderSuccessPage,
});

function OrderSuccessPage() {
  const { order, lang } = Route.useSearch();
  const locale = useStore((s) => s.locale);
  const copy = customerOrderCopy(locale);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const { catalog } = useCatalog();
  const detail = customerOrderDetailCopy(locale);
  const [verified, setVerified] = useState<StoreOrder | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setVerified(null);
    setChecking(true);
    let credentials: { id: string; email: string } | null = null;
    try { credentials = confirmationCredentials(order, sessionStorage.getItem("jidokaan-last-order")); } catch { /* no proof in storage */ }
    if (IS_REVIEW_PREVIEW && order === REVIEW_ORDER_ID) credentials = { id: REVIEW_ORDER_ID, email: getReviewOrder().email };
    if (!credentials) { setChecking(false); return; }
    const expected = credentials;
    void (async () => {
      try {
        const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "lookup", ...expected }), signal: controller.signal });
        const data = await response.json() as { order?: StoreOrder };
        if (!controller.signal.aborted && response.ok && matchesCustomerOrder(data.order, expected.id, expected.email)) setVerified(data.order!);
      } catch { /* A failed lookup must never be shown as a completed order. */ }
      finally { if (!controller.signal.aborted) setChecking(false); }
    })();
    return () => controller.abort();
  }, [order]);

  const pay = catalog.pay;
  const transfer = verified?.status === "wait" && verified.pay === "transfer";
  const kr = verified?.currency === "KRW";
  const paid = verified && ["paid", "ready", "shipped", "done", "confirmed"].includes(verified.status);

  return (
    <SiteShell requestedLocale={lang}>
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        {IS_REVIEW_PREVIEW ? (
          <p className="mb-6 max-w-lg rounded-xl border border-amber-500 bg-amber-50 p-4 text-sm font-medium text-amber-950">
            {detail.preview}
          </p>
        ) : null}
        <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-accent-soft text-success">
          {paid ? <CheckCircle2 className="size-8" /> : <Search className="size-8" />}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {checking ? copy.lookingUp : !verified ? detail.verifyTitle : transfer ? copy.transferTitle : paid ? copy.successTitle : copy.statuses[verified.status]}
        </h1>
        <p className="mt-3 max-w-md text-muted">
          {verified ? transfer ? copy.transferBody : copy.successBody : detail.verifyHelp}
        </p>
        {verified ? (
          <p className="mt-4 rounded-full border border-border bg-surface px-4 py-2 text-sm">
            <span className="text-muted">{copy.orderNumber}: </span>
            <span className="price-num font-semibold">{verified.id}</span>
          </p>
        ) : null}
        {transfer ? (
          <div className="mt-6 w-full max-w-md rounded-2xl border border-border bg-surface p-5 text-left text-sm">
            {kr ? (
              <>
                <p>
                  {copy.bank}: <b>{pay.krBank || "-"}</b>
                </p>
                <p>
                  {copy.account}: <b>{pay.krAccount || "-"}</b>
                </p>
                <p>
                  {copy.holder}: <b>{pay.krHolder || "-"}</b>
                </p>
              </>
            ) : (
              <>
                {pay.intlBank ? (
                  <p>
                    {copy.bank}: <b>{pay.intlBank}</b>
                  </p>
                ) : null}
                {pay.intlAccount ? (
                  <p>
                    {copy.account}: <b>{pay.intlAccount}</b>
                  </p>
                ) : null}
                {pay.intlSwift ? (
                  <p>
                    SWIFT: <b>{pay.intlSwift}</b>
                  </p>
                ) : null}
                {pay.intlHolder ? (
                  <p>
                    {copy.holder}: <b>{pay.intlHolder}</b>
                  </p>
                ) : null}
                {pay.intlPaypal ? (
                  <p>
                    PayPal: <b>{pay.intlPaypal}</b>
                  </p>
                ) : null}
              </>
            )}
            {kr ? (
              <p className="mt-2 text-muted">
                {pay.krMemo && !pay.krMemo.includes("주문번호") ? pay.krMemo : copy.transferMemo}
              </p>
            ) : null}
          </div>
        ) : null}
        {verified ? (
          <section className="mt-6 w-full max-w-lg rounded-2xl border border-border bg-surface p-5 text-left">
            {verified.contactMethod !== "email" ? <p className="text-sm leading-relaxed text-muted">{copy.instagramNext}</p> : null}
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(verified.id);
                    setCopyStatus("copied");
                  } catch {
                    setCopyStatus("failed");
                  }
                }}
              >
                {copy.copyOrder}
              </Button>
              {verified.contactMethod !== "email" ? <Button asChild>
                <a href="https://ig.me/m/jidokaan" target="_blank" rel="noopener noreferrer">
                  {copy.instagramAction} ↗
                </a>
              </Button> : null}
            </div>
            <p role="status" aria-live="polite" className="mt-2 text-sm text-muted">
              {copyStatus === "copied"
                ? copy.copied
                : copyStatus === "failed"
                  ? copy.copyFailed
                  : ""}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">{copy.lookupHelp}</p>
          </section>
        ) : null}
        {verified ? <div className="mt-6 w-full max-w-3xl"><CustomerOrderDetails order={verified} locale={locale} /></div> : null}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/shop">{copy.continueShopping}</Link>
          </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/orders" search={{ id: order, lang: locale }}>
                {copy.lookupTitle}
              </Link>
            </Button>
        </div>
      </div>
    </SiteShell>
  );
}
