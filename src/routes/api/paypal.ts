import { createFileRoute } from "@tanstack/react-router";
import {
  startPaypalCheckout,
  completePaypalCheckout,
  pendingPaypalCheckouts,
  recoverPaypalCheckout,
} from "@/lib/paypal-checkout.server";
import type { StoreOrder } from "@/lib/order-types";
import { capturePaypalOrder, paypalPublic } from "@/lib/paypal.server";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export const Route = createFileRoute("/api/paypal")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = new URL(request.url).searchParams.get("token");
        if (!token) return json(paypalPublic());
        try {
          return json({ pending: await pendingPaypalCheckouts(token) });
        } catch {
          return json({ error: "AUTH" }, 401);
        }
      },
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            action?: string;
            value?: string;
            orderID?: string;
            order?: Partial<StoreOrder>;
            token?: string;
          };
          if (body.action === "create") {
            if (!body.order) return json({ error: "CHECKOUT_REFRESH_REQUIRED" }, 400);
            const id = await startPaypalCheckout(body.order, String(body.value ?? ""));
            return json({ id });
          }
          if (body.action === "capture") {
            const order = await completePaypalCheckout(String(body.orderID ?? ""), true);
            if (order) return json({ order, id: body.orderID, status: "COMPLETED" });
            const cap = await capturePaypalOrder(String(body.orderID ?? ""));
            return json(cap);
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
          const message = err instanceof Error ? err.message : "PAYPAL";
          return json({ error: message }, 400);
        }
      },
    },
  },
});
