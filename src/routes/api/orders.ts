import { createFileRoute } from "@tanstack/react-router";
import { AUTH_HEADERS } from "@/lib/admin-auth.server";
import {
  countOrdersByEmail,
  decideClaim,
  listOrders,
  lookupOrder,
  placeOrder,
  requestClaim,
  updateOrder,
  withdrawClaim,
  type OrderStatus,
  type StoreOrder,
} from "@/lib/orders.server";
import { proxyToLive, shouldProxyToLive } from "@/lib/live-proxy.server";
import { readCatalog } from "@/lib/catalog.server";
import { couponRejectReason, findCoupon } from "@/lib/coupon";
import { paypalCaptureOk } from "@/lib/paypal.server";
import type { ClaimKind } from "@/lib/order-types";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: AUTH_HEADERS });
}

export const Route = createFileRoute("/api/orders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (shouldProxyToLive(request)) return proxyToLive(request, "/api/orders");
        try {
          const url = new URL(request.url);
          const id = url.searchParams.get("id") ?? "";
          const email = url.searchParams.get("email") ?? "";
          if (id && email) {
            const order = await lookupOrder(id, email);
            if (!order) return json({ error: "NOT_FOUND" }, 404);
            return json({ order });
          }
          const token = url.searchParams.get("token") ?? "";
          return json({ orders: await listOrders(token) });
        } catch {
          return json({ error: "AUTH" }, 401);
        }
      },
      POST: async ({ request }) => {
        if (shouldProxyToLive(request)) return proxyToLive(request, "/api/orders");
        try {
          const body = (await request.json()) as {
            action?: string;
            token?: string;
            id?: string;
            email?: string;
            status?: OrderStatus;
            tracking?: string;
            courier?: string;
            note?: string;
            kind?: ClaimKind;
            reason?: string;
            decision?: "accept" | "reject" | "cancel";
          } & Partial<StoreOrder>;
          if (body.action === "checkCoupon") {
            const catalog = await readCatalog();
            const coupon = findCoupon(catalog.coupons ?? [], String(body.note ?? body.couponCode ?? ""));
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
            return json({ order });
          }
          if (body.action === "claim") {
            const order = await requestClaim({
              id: String(body.id ?? ""),
              email: String(body.email ?? ""),
              kind: (body.kind ?? "return") as ClaimKind,
              reason: String(body.reason ?? ""),
            });
            return json({ order });
          }
          if (body.action === "withdraw") {
            const order = await withdrawClaim(String(body.id ?? ""), String(body.email ?? ""));
            return json({ order });
          }
          if (body.action === "decide" && body.token && body.id) {
            const order = await decideClaim(
              body.token,
              body.id,
              body.decision ?? "reject",
              body.note,
            );
            return json({ order });
          }
          if (body.action === "update" && body.token && body.id) {
            const order = await updateOrder(body.token, body.id, {
              status: body.status,
              tracking: body.tracking,
              courier: body.courier,
              note: body.note,
            });
            return json({ order });
          }
          if ((body.pay ?? "") === "paypal") {
            if ((body.country ?? "KR") === "KR") {
              return json({ error: "PAYPAL_OVERSEAS_ONLY" }, 400);
            }
            const paid = await paypalCaptureOk(
              String((body as { paypalOrderId?: string }).paypalOrderId ?? ""),
            );
            if (!paid) return json({ error: "PAYPAL_UNPAID" }, 400);
          }
          const order = await placeOrder({
            email: body.email ?? "",
            phone: body.phone ?? "",
            name: body.name ?? "",
            address: body.address ?? "",
            city: body.city ?? "",
            region: body.region ?? "",
            postal: body.postal ?? "",
            country: body.country ?? "KR",
            pay: body.pay ?? "card",
            depositor: (body as { depositor?: string }).depositor,
            shipMethod: body.shipMethod ?? "standard",
            shippingKrw: Number(body.shippingKrw) || 0,
            shippingUsd: Number(body.shippingUsd) || 0,
            totalKrw: Number(body.totalKrw) || 0,
            totalUsd: Number(body.totalUsd) || 0,
            currency: body.currency ?? "KRW",
            items: body.items ?? [],
            note: body.note,
            couponCode: body.couponCode,
            discountKrw: body.discountKrw,
            discountUsd: body.discountUsd,
          });
          return json({ order });
        } catch (err) {
          const message = err instanceof Error ? err.message : "fail";
          return json({ error: message }, message === "AUTH" ? 401 : 400);
        }
      },
    },
  },
});
