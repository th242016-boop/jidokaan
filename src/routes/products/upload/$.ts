import { createFileRoute } from "@tanstack/react-router";
import { uploadFileResponse } from "@/lib/serve-upload.server";

export const Route = createFileRoute("/products/upload/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const pathname = new URL(request.url).pathname;
        return (await uploadFileResponse(pathname)) ?? new Response("not found", { status: 404 });
      },
    },
  },
});
