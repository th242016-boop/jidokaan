import { createFileRoute } from "@tanstack/react-router";
import { AUTH_HEADERS } from "@/lib/admin-auth.server";
import { getPhone, savePhone, sessionUser } from "@/lib/profile.server";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: AUTH_HEADERS });
}

export const Route = createFileRoute("/api/profile")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await sessionUser(request);
        if (!user) return json({ error: "AUTH" }, 401);
        return json({ phone: await getPhone(user.id) });
      },
      POST: async ({ request }) => {
        const user = await sessionUser(request);
        if (!user) return json({ error: "AUTH" }, 401);
        const body = (await request.json()) as { phone?: string };
        try {
          const phone = await savePhone(user.id, String(body.phone ?? ""));
          return json({ ok: true, phone });
        } catch {
          return json({ error: "INVALID_PHONE" }, 400);
        }
      },
    },
  },
});
