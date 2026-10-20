import { definePlugin } from "nitro";
import { startOrderNotificationWorker } from "../lib/telegram-orders.server";
import { startInboxWorker } from "../lib/inbox-notifications.server";

export default definePlugin((app) => {
  const stop = startOrderNotificationWorker();
  const stopInbox = startInboxWorker();
  app.hooks.hook("close", stop);
  app.hooks.hook("close", stopInbox);
});
