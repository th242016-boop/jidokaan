import { definePlugin } from "nitro";
import { startOrderNotificationWorker } from "../lib/telegram-orders.server";

export default definePlugin((app) => {
  const stop = startOrderNotificationWorker();
  app.hooks.hook("close", stop);
});
