import { createFileRoute } from "@tanstack/react-router";
import { AUTH_HEADERS } from "@/lib/admin-auth.server";
import {
  countOrdersByEmail,
  listOrders,
  placeOrder,
  updateOrder,
  type OrderStatus,
  type StoreOrder,
} from "@/lib/orders.server";
import { readCatalog } from "@/lib/catalog.server";
import { couponRejectReason, findCoupon } from "@/lib/coupon";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: AUTH_HEADERS });
}

export const Route = createFileRoute("/api/orders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const token = new URL(request.url).searchParams.get("token") ?? "";
          return json({ orders: await listOrders(token) });
        } catch {
          return json({ error: "AUTH" }, 401);
        }
      },
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            action?: string;
            token?: string;
            id?: string;
            status?: OrderStatus;
            tracking?: string;
            note?: string;
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
          if (body.action === "update" && body.token && body.id) {
            const order = await updateOrder(body.token, body.id, {
              status: body.status,
              tracking: body.tracking,
              note: body.note,
            });
            return json({ order });
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
