import { createFileRoute } from "@tanstack/react-router";
import { handleSpecialRequest } from "@/lib/simulator-special.server";

export const Route = createFileRoute("/api/simulator-special")({
  server: { handlers: {
    GET: ({ request }) => handleSpecialRequest(request),
    POST: ({ request }) => handleSpecialRequest(request),
  } },
});
