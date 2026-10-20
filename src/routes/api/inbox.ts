import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AUTH_HEADERS } from "@/lib/admin-auth.server";
import {
  addInbox,
  listInbox,
  updateInbox,
  getAdminInbox,
  getCustomerInbox,
  addCustomerMessage,
  replyInbox,
  inboxChannels,
  limitInboxRequests,
} from "@/lib/inbox.server";

const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { ...AUTH_HEADERS, "Referrer-Policy": "no-referrer" } });
const adminToken = (request: Request) =>
  request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
const schema = z.object({
  action: z.enum(["create", "lookup", "followup", "reply", "update"]).default("create"),
  id: z.string().max(80).optional(),
  key: z.string().max(64).optional(),
  name: z.string().max(80).optional(),
  email: z.string().max(200).optional(),
  message: z.string().max(5000).optional(),
  website: z.string().max(200).optional(),
  locale: z.string().max(10).optional(),
  requestId: z.string().uuid().optional(),
  site: z.boolean().optional(),
  emailReply: z.boolean().optional(),
  status: z.enum(["new", "done"]).optional(),
});
async function readBody(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new Error("BAD_INBOX");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("BAD_INBOX");
  const decoder = new TextDecoder();
  let size = 0,
    body = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 24000) {
        await reader.cancel();
        throw new Error("TOO_LARGE");
      }
      body += decoder.decode(value, { stream: true });
    }
    return schema.parse(JSON.parse(body + decoder.decode()));
  } finally {
    reader.releaseLock();
  }
}
function failure(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  const codes: Record<string, number> = {
    AUTH: 401,
    NOT_FOUND: 404,
    RATE_LIMIT: 429,
    BAD_INBOX: 400,
    BAD_EMAIL: 400,
    CONFLICT: 409,
    EMAIL_NOT_CONFIGURED: 409,
    TOO_LARGE: 413,
  };
  if (error instanceof z.ZodError || error instanceof SyntaxError)
    return json({ error: "BAD_INBOX" }, 400);
  return json({ error: codes[code] ? code : "INBOX_UNAVAILABLE" }, codes[code] || 503);
}

export const Route = createFileRoute("/api/inbox")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const params = new URL(request.url).searchParams;
          const token = adminToken(request);
          if (params.get("id")) return json(await getAdminInbox(token, params.get("id")!));
          const offset = Math.min(100000, Math.max(0, Number(params.get("offset")) || 0));
          const [items, channels] = await Promise.all([
            listInbox(token, offset),
            inboxChannels(token),
          ]);
          return json({ items, channels });
        } catch (error) {
          return failure(error);
        }
      },
      POST: async ({ request }) => {
        try {
          const body = await readBody(request);
          const token = adminToken(request);
          if (body.action === "reply")
            return json(
              await replyInbox(token, {
                id: body.id || "",
                body: body.message || "",
                requestId: body.requestId || "",
                site: body.site === true,
                email: body.emailReply === true,
              }),
            );
          if (body.action === "update")
            return json({ item: await updateInbox(token, body.id || "", body.status || "done") });
          const ip =
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            request.headers.get("x-real-ip");
          if (ip)
            await limitInboxRequests(
              `network:${body.action === "create" ? "create" : "read"}:${ip}`,
              body.action === "create" ? 30 : 120,
              900,
            );
          if (body.action === "lookup")
            return json(await getCustomerInbox(body.id || "", body.key || ""));
          if (body.action === "followup")
            return json(
              await addCustomerMessage(
                body.id || "",
                body.key || "",
                body.message || "",
                body.requestId || "",
              ),
            );
          return json(
            await addInbox({
              name: body.name || "",
              email: body.email || "",
              message: body.message || "",
              trap: body.website,
              locale: body.locale,
              requestId: body.requestId,
            }),
          );
        } catch (error) {
          return failure(error);
        }
      },
    },
  },
});
