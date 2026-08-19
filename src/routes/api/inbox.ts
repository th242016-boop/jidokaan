import { createFileRoute } from "@tanstack/react-router";
import { AUTH_HEADERS } from "@/lib/admin-auth.server";
import { addInbox, listInbox, updateInbox } from "@/lib/orders.server";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: AUTH_HEADERS });
}

export const Route = createFileRoute("/api/inbox")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const token = new URL(request.url).searchParams.get("token") ?? "";
          return json({ items: await listInbox(token) });
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
            name?: string;
            email?: string;
            message?: string;
            website?: string;
          };
          if (body.action === "update" && body.token && body.id) {
            return json({
              item: await updateInbox(body.token, body.id, body.status ?? "done"),
            });
          }
          return json(
            await addInbox({
              name: body.name ?? "",
              email: body.email ?? "",
              message: body.message ?? "",
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
