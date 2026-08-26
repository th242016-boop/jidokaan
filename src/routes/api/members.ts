import { createFileRoute } from "@tanstack/react-router";
import { AUTH_HEADERS } from "@/lib/admin-auth.server";
import { listMembers } from "@/lib/members.server";

export const Route = createFileRoute("/api/members")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const token = new URL(request.url).searchParams.get("token") ?? "";
          return Response.json(
            { members: await listMembers(token) },
            { headers: AUTH_HEADERS },
          );
        } catch {
          return Response.json({ error: "AUTH" }, { status: 401, headers: AUTH_HEADERS });
        }
      },
    },
  },
});
