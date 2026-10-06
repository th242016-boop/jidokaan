import { createFileRoute } from "@tanstack/react-router";
import { AUTH_HEADERS } from "@/lib/admin-auth.server";
import {
  TelegramError,
  beginNotificationPairing,
  finishNotificationPairing,
  notificationStatus,
  setNotificationsEnabled,
  testOrderNotification,
} from "@/lib/telegram-orders.server";

export const Route = createFileRoute("/api/order-notifications")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const json = (body: unknown, status = 200) =>
          Response.json(body, { status, headers: AUTH_HEADERS });
        try {
          // An explicit session header is required. No cookie auth or live-preview proxy.
          const token = request.headers.get("Authorization")?.replace(/^Bearer /, "") || "";
          const body = await request.json();
          switch (body.action) {
            case "status":
              return json(await notificationStatus(token));
            case "begin":
              return json(await beginNotificationPairing(token));
            case "finish":
              return json(await finishNotificationPairing(token, String(body.code || "")));
            case "test":
              return json(await testOrderNotification(token));
            case "toggle":
              if (typeof body.enabled !== "boolean") return json({ error: "BAD_REQUEST" }, 400);
              return json(await setNotificationsEnabled(token, body.enabled));
            default:
              return json({ error: "BAD_REQUEST" }, 400);
          }
        } catch (error) {
          if (error instanceof Error && error.message === "AUTH")
            return json({ error: "AUTH" }, 401);
          if (error instanceof TelegramError) return json({ error: error.code }, 400);
          return json({ error: "NOTIFICATION_UNAVAILABLE" }, 503);
        }
      },
    },
  },
});
