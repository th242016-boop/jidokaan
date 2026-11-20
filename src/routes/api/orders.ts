import { checkoutBodyLimit, guardResponse, limitRequests, readBoundedJson } from "@/lib/request-guard.server";
import { adminOrderWithGuidance } from "@/lib/admin-shipping-guidance.server";
import { reportSecurityEvent } from "@/lib/security-events.server";
import { createFileRoute } from "@tanstack/react-router";
import { AUTH_HEADERS, assertSession } from "@/lib/admin-auth.server";
import {
  countOrdersByEmail,
  findOrderById,
  decideClaim,
  deleteCancelledOrders,
  listOrders,
  lookupOrder,
  placeOrder,
  requestClaim,
  updateOrder,
  withdrawClaim,
  type OrderStatus,
  type StoreOrder,
} from "@/lib/orders.server";
import { readCatalog } from "@/lib/catalog.server";
import { couponRejectReason, findCoupon } from "@/lib/coupon";
import { customerOrder, type ClaimKind } from "@/lib/order-types";
import { finishBrowserCheckout } from "@/lib/paypal-checkout.server";
import { quoteCheckout } from "@/lib/checkout-quote.server";
import { recoverLegacyPaypalOrder } from "@/lib/legacy-paypal-recovery.server";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: AUTH_HEADERS });
}

export const Route = createFileRoute("/api/orders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          limitRequests(request, "orders");
          const url = new URL(request.url);
          const id = url.searchParams.get("id") ?? "";
          const email = url.searchParams.get("email") ?? "";
          if (id && email) {
            const order = await lookupOrder(id, email);
            if (!order) return json({ error: "NOT_FOUND" }, 404);
            return json({ order: customerOrder(order) });
          }
          const token = request.headers.get("Authorization")?.replace(/^Bearer /, "") || "";
          if (id) {
            await assertSession(token);
            const order = await findOrderById(id);
            return order ? json({ order: adminOrderWithGuidance(order) }) : json({ error: "NOT_FOUND" }, 404);
          }
          return json({ orders: (await listOrders(token)).map(adminOrderWithGuidance) });
        } catch (error) {
          return guardResponse(error) ?? json({ error: "AUTH" }, 401);
        }
      },
      POST: async ({ request }) => {
        try {
          limitRequests(request, "orders");
          const body = (await readBoundedJson(request, checkoutBodyLimit)) as {
            action?: string;
            token?: string;
            id?: string;
            email?: string;
            status?: OrderStatus;
            tracking?: string;
            courier?: string;
            note?: string;
            ids?: string[];
            reason?: string;
            decision?: "accept" | "reject" | "cancel";
            kind?: ClaimKind;
          } & Partial<StoreOrder>;
          if (!body.action && body.pay !== "paypal") limitRequests(request, "createOrder");
          if (body.action === "checkCoupon") {
            const catalog = await readCatalog();
            const coupon = findCoupon(
              catalog.coupons ?? [],
              String(body.note ?? body.couponCode ?? ""),
            );
            const count = await countOrdersByEmail(body.email ?? "");
            const goods = Number(body.totalKrw) || 0;
            const reason = couponRejectReason(coupon, goods, count);
            return json({
              ok: !reason && Boolean(coupon),
              reason,
              code: coupon?.code,
              type: coupon?.type,
              percent: coupon?.percent,
              offKrw: coupon?.offKrw,
              offUsd: coupon?.offUsd,
            });
          }
          if (body.action === "lookup") {
            const order = await lookupOrder(String(body.id ?? ""), String(body.email ?? ""));
            if (!order) return json({ error: "NOT_FOUND" }, 404);
            return json({ order: customerOrder(order) });
          }
          if (body.action === "claim") {
            const order = await requestClaim({
              id: String(body.id ?? ""),
              email: String(body.email ?? ""),
              kind: (body.kind ?? "return") as ClaimKind,
              reason: String(body.reason ?? ""),
            });
            return json({ order: customerOrder(order) });
          }
          if (body.action === "withdraw") {
            const order = await withdrawClaim(String(body.id ?? ""), String(body.email ?? ""));
            return json({ order: customerOrder(order) });
          }
          if (body.action === "decide" && body.token && body.id) {
            const order = await decideClaim(
              body.token,
              body.id,
              body.decision ?? "reject",
              body.note,
            );
            return json({ order: adminOrderWithGuidance(order) });
          }
          if (body.action === "update" && body.token && body.id) {
            const order = await updateOrder(body.token, body.id, {
              status: body.status,
              tracking: body.tracking,
              courier: body.courier,
              note: body.note,
            });
            return json({ order: adminOrderWithGuidance(order) });
          }
          if (body.action === "delete" && body.token) {
            const ids = Array.isArray(body.ids) ? body.ids : body.id ? [body.id] : [];
            const deleted = await deleteCancelledOrders(body.token, ids);
            return json({ deleted });
          }
          if (body.action) return json({ error: "BAD_ACTION" }, 400);
          if (body.pay === "paypal" && body.paypalOrderId) {
            const email = String(body.email ?? "").trim();
            const completed = await finishBrowserCheckout(request, body.paypalOrderId, false, email, String(body.phone ?? ""))
              ?? await recoverLegacyPaypalOrder(body);
            // Older open checkout tabs need their own submitted email echoed to
            // open the receipt. No stored customer or payment fields are returned.
            if (completed) return json({ order: { id: completed.id, email } });
          }
          if (body.pay !== "paypal") {
            const order = await placeOrder(await quoteCheckout(body), true);
            reportSecurityEvent("ordersOpened");
            return json({ order: customerOrder(order) });
          }
          // A legacy retry without a saved draft or order has no authoritative
          // production specification. Current prices/terms and client amounts
          // cannot reconstruct what was paid; leave reconciliation to support.
          throw new Error("PAYPAL_ORDER_REVIEW_REQUIRED");
        } catch (err) {
          const limited = guardResponse(err);
          if (limited) return limited;
          const message = err instanceof Error ? err.message : "fail";
          return json({ error: message }, message === "AUTH" ? 401 : 400);
        }
      },
    },
  },
});
