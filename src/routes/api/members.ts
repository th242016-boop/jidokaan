import { createFileRoute } from "@tanstack/react-router";
import { AUTH_HEADERS } from "@/lib/admin-auth.server";
import { proxyToLive, shouldProxyToLive } from "@/lib/live-proxy.server";
import { listMembers } from "@/lib/members.server";

export const Route = createFileRoute("/api/members")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (shouldProxyToLive(request)) return proxyToLive(request, "/api/members");
        try {
          const query = new URL(request.url).searchParams;
          const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
          const token = bearer ?? query.get("token") ?? "";
          return Response.json(
            await listMembers(token, {
              page: query.get("page") ?? undefined,
              pageSize: query.get("pageSize") ?? undefined,
              q: query.get("q") ?? undefined,
              searchField: query.get("searchField") ?? undefined,
              provider: query.get("provider") ?? undefined,
              device: query.get("device") ?? undefined,
              source: query.get("source") ?? undefined,
              from: query.get("from") ?? undefined,
              to: query.get("to") ?? undefined,
            }),
            { headers: AUTH_HEADERS },
          );
        } catch (err) {
          const code = err instanceof Error ? err.message : "MEMBERS_UNAVAILABLE";
          const status = code === "AUTH" ? 401 : code === "INVALID_FILTER" ? 400 : 500;
          if (status === 500) console.error("[members] directory query failed");
          return Response.json(
            { error: status === 500 ? "MEMBERS_UNAVAILABLE" : code },
            { status, headers: AUTH_HEADERS },
          );
        }
      },
    },
  },
});
