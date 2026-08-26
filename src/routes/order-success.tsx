import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/store/site-shell";
import { t } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";

const searchSchema = z.object({
  order: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/order-success")({
  validateSearch: searchSchema,
  component: OrderSuccessPage,
});

function OrderSuccessPage() {
  const { order } = Route.useSearch();
  const locale = useStore((s) => s.locale);
  const dict = t(locale);
  const { catalog } = useCatalog();
  const [last, setLast] = useState<{
    pay?: string;
    total?: number;
    currency?: string;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("jidokaan-last-order");
      if (raw) setLast(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const pay = catalog.pay;
  const transfer = last?.pay === "transfer";
  const ko = locale === "ko";
  const kr = last?.currency === "KRW";

  return (
    <SiteShell>
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-accent-soft text-success">
          <CheckCircle2 className="size-8" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {transfer
            ? ko
              ? "주문을 받았습니다. 입금해 주세요."
              : "Order received — please transfer"
            : dict.success.title}
        </h1>
        <p className="mt-3 max-w-md text-muted">
          {transfer
            ? ko
              ? "입금이 확인되면 제작을 시작합니다. 주문자명으로 입금해 주세요."
              : "We start making the pair after the transfer is confirmed. Please transfer under the orderer's name."
            : dict.success.body}
        </p>
        {order ? (
          <p className="mt-4 rounded-full border border-border bg-surface px-4 py-2 text-sm">
            <span className="text-muted">{dict.success.order}: </span>
            <span className="price-num font-semibold">{order}</span>
          </p>
        ) : null}
        {transfer ? (
          <div className="mt-6 w-full max-w-md rounded-2xl border border-border bg-surface p-5 text-left text-sm">
            {kr ? (
              <>
                <p>{ko ? "은행" : "Bank"}: <b>{pay.krBank || "-"}</b></p>
                <p>{ko ? "계좌" : "Account"}: <b>{pay.krAccount || "-"}</b></p>
                <p>{ko ? "예금주" : "Holder"}: <b>{pay.krHolder || "-"}</b></p>
              </>
            ) : (
              <>
                {pay.intlBank ? <p>Bank: <b>{pay.intlBank}</b></p> : null}
                {pay.intlAccount ? <p>Account: <b>{pay.intlAccount}</b></p> : null}
                {pay.intlSwift ? <p>SWIFT: <b>{pay.intlSwift}</b></p> : null}
                {pay.intlHolder ? <p>Name: <b>{pay.intlHolder}</b></p> : null}
                {pay.intlPaypal ? <p>PayPal: <b>{pay.intlPaypal}</b></p> : null}
              </>
            )}
            {kr ? (
              <p className="mt-2 text-muted">
                {pay.krMemo && !pay.krMemo.includes("주문번호")
                  ? pay.krMemo
                  : "주문자명으로 입금해 주세요"}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/shop">{dict.success.continue}</Link>
          </Button>
          {order ? (
            <Button size="lg" variant="secondary" asChild>
              <Link to="/orders" search={{ id: order }}>
                {ko ? "주문조회 · 교환/반품" : "Look up order"}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </SiteShell>
  );
}
