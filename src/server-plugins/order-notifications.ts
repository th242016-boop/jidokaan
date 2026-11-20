import { reportSecurityEvent } from "../lib/security-events.server";
import { definePlugin } from "nitro";
import { startOrderNotificationWorker } from "../lib/telegram-orders.server";
import { startInboxWorker } from "../lib/inbox-notifications.server";

import { startCustomerOrderEmailWorker } from "../lib/customer-order-emails.server";

export default definePlugin((app) => {
  app.hooks.hook("response", (response) => {
    if (response.status >= 500) reportSecurityEvent("serverError");
  });
  const stop = startOrderNotificationWorker();
  const stopInbox = startInboxWorker();
  const stopCustomerEmail = startCustomerOrderEmailWorker();
  app.hooks.hook("close", stop);
  app.hooks.hook("close", stopInbox);
  app.hooks.hook("close", stopCustomerEmail);
});
