import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";
import { guardResponse, limitRequests, readBoundedBody } from "@/lib/request-guard.server";

async function handleAccountRequest({ request }: { request: Request }) {
  try {
    limitRequests(request, "account");
    if (request.method === "POST") {
      const bytes = await readBoundedBody(request, 64 * 1024, (body) => body.arrayBuffer());
      request = new Request(request, { body: bytes });
    }
    return await auth.handler(request);
  } catch (error) {
    const limited = guardResponse(error);
    if (limited) return limited;
    throw error;
  }
}

export const Route = createFileRoute("/api/auth/$")({
  server: { handlers: { GET: handleAccountRequest, POST: handleAccountRequest } },
});
