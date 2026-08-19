import { createFileRoute } from "@tanstack/react-router";
import { AUTH_HEADERS } from "@/lib/admin-auth.server";
import { listHits, trackHit } from "@/lib/analytics.server";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: AUTH_HEADERS });
}

export const Route = createFileRoute("/api/analytics")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const token = new URL(request.url).searchParams.get("token") ?? "";
          return json({ hits: await listHits(token) });
        } catch {
          return json({ error: "AUTH" }, 401);
        }
      },
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as Record<string, string>;
          return json(await trackHit(body));
        } catch {
          return json({ error: "fail" }, 400);
        }
      },
    },
  },
});
