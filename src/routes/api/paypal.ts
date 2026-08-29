import { createFileRoute } from "@tanstack/react-router";
import {
  capturePaypalOrder,
  createPaypalOrder,
  paypalPublic,
} from "@/lib/paypal.server";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export const Route = createFileRoute("/api/paypal")({
  server: {
    handlers: {
      GET: async () => json(paypalPublic()),
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            action?: string;
            value?: string;
            orderID?: string;
          };
          if (body.action === "create") {
            const id = await createPaypalOrder(String(body.value ?? ""));
            return json({ id });
          }
          if (body.action === "capture") {
            const cap = await capturePaypalOrder(String(body.orderID ?? ""));
            return json(cap);
          }
          return json({ error: "bad_action" }, 400);
        } catch (err) {
          const message = err instanceof Error ? err.message : "PAYPAL";
          return json({ error: message }, 400);
        }
      },
    },
  },
});
