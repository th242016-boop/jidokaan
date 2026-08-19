import { createFileRoute } from "@tanstack/react-router";
import { AUTH_HEADERS } from "@/lib/admin-auth.server";
import { addReview, listReviews, updateReview } from "@/lib/orders.server";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: AUTH_HEADERS });
}

export const Route = createFileRoute("/api/reviews")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const token = url.searchParams.get("token") ?? "";
          const productId = url.searchParams.get("productId") ?? "";
          return json({ items: await listReviews(token || undefined, productId || undefined) });
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
            status?: "new" | "done";
            productId?: string;
            productName?: string;
            name?: string;
            rating?: number;
            body?: string;
            website?: string;
          };
          if (body.action === "update" && body.token && body.id) {
            return json({
              item: await updateReview(body.token, body.id, body.status ?? "done"),
            });
          }
          return json(
            await addReview({
              productId: body.productId ?? "",
              productName: body.productName ?? "",
              name: body.name ?? "",
              rating: body.rating ?? 5,
              body: body.body ?? "",
              trap: body.website,
            }),
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : "fail";
          return json({ error: message }, message === "AUTH" ? 401 : 400);
        }
      },
    },
  },
});
