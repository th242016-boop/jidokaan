import { guardResponse, limitRequests, readBoundedJson } from "@/lib/request-guard.server";
import { createFileRoute } from "@tanstack/react-router";
import { AUTH_HEADERS } from "@/lib/admin-auth.server";
import { listHits, summarizeAnalytics, trackHit } from "@/lib/analytics.server";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: AUTH_HEADERS });
}

export const Route = createFileRoute("/api/analytics")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const params = new URL(request.url).searchParams;
          const header = request.headers.get("authorization") || "";
          const token = header.startsWith("Bearer ") ? header.slice(7) : "";
          if (params.get("view") === "summary") {
            return json({ summary: await summarizeAnalytics(token, params.get("from"), params.get("to")) });
          }
          return json({ hits: await listHits(token) });
        } catch (error) {
          const code = error instanceof Error ? error.message : "";
          if (code === "AUTH") return json({ error: "AUTH" }, 401);
          if (code === "PERIOD_INVALID") return json({ error: code }, 400);
          return json({ error: "ANALYTICS_UNAVAILABLE" }, 500);
        }
      },
      POST: async ({ request }) => {
        try {
          limitRequests(request, "analytics");
          const body: unknown = await readBoundedJson(request, 8192);
          if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "INVALID_INPUT" }, 400);
          return json(await trackHit(body));
        } catch (error) {
          return guardResponse(error) ?? json({ error: "fail" }, 400);
        }
      },
    },
  },
});
