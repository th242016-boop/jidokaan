import { checkoutBodyLimit, guardResponse, limitRequests, readBoundedJson } from "@/lib/request-guard.server";
import { reportSecurityEvent } from "@/lib/security-events.server";
import { createFileRoute } from "@tanstack/react-router";
import {
  openBrowserCheckout,
  finishBrowserCheckout,
  legacyApprovalCookie,
  pendingPaypalCheckouts,
  recoverPaypalCheckout,
} from "@/lib/paypal-checkout.server";
import type { StoreOrder } from "@/lib/order-types";
import { paypalPublic } from "@/lib/paypal.server";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export const Route = createFileRoute("/api/paypal")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
        if (!token) return json(paypalPublic());
        try {
          return json({ pending: await pendingPaypalCheckouts(token) });
        } catch {
          return json({ error: "AUTH" }, 401);
        }
      },
      POST: async ({ request }) => {
        try {
          limitRequests(request, "checkout");
          const body = (await readBoundedJson(request, checkoutBodyLimit)) as {
            action?: string;
            value?: string;
            orderID?: string;
            receiptOnly?: boolean;
            order?: Partial<StoreOrder>;
            token?: string;
          };
          if (body.action === "create") {
            limitRequests(request, "createPayment");
            if (!body.order) return json({ error: "CHECKOUT_REFRESH_REQUIRED" }, 400);
            const { id, cookie } = await openBrowserCheckout(body.order, String(body.value ?? ""));
            reportSecurityEvent("ordersOpened");
            const response = json({ id });
            response.headers.append("Set-Cookie", cookie);
            return response;
          }
          if (body.action === "capture") {
            const id = String(body.orderID ?? "");
            const legacyCookie = !body.receiptOnly && legacyApprovalCookie(request, id);
            if (legacyCookie) {
              const response = json({ status: "CONFIRM_CHECKOUT" });
              response.headers.append("Set-Cookie", legacyCookie);
              return response;
            }
            const order = await finishBrowserCheckout(request, id, true);
            if (order) {
              // Older tabs then submit the saved form, including their email.
              return json(body.receiptOnly ? { order: { id: order.id }, status: "COMPLETED" } : { status: "COMPLETED" });
            }
            return json({ error: "CHECKOUT_REFRESH_REQUIRED" }, 400);
          }
          if (body.action === "recover")
            return json({
              order: await recoverPaypalCheckout(
                String(body.token ?? ""),
                String(body.orderID ?? ""),
              ),
            });
          return json({ error: "bad_action" }, 400);
        } catch (err) {
          const limited = guardResponse(err);
          if (limited) return limited;
          const message = err instanceof Error ? err.message : "PAYPAL";
          return json({ error: message }, 400);
        }
      },
    },
  },
});
