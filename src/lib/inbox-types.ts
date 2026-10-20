import type { InboxItem } from "./order-types";

export type InboxMessage = {
  id: string;
  author: "customer" | "admin";
  body: string;
  createdAt: string;
  siteVisible: boolean;
  emailState: "none" | "pending" | "accepted" | "failed";
  emailError: string | null;
};
export type InboxThread = {
  item: InboxItem;
  messages: InboxMessage[];
  accessUrl: string;
};
export type InboxSummary = InboxItem & {
  replyCount: number;
  emailPending: number;
  emailFailed: number;
  updatedAt: string;
};
export type InboxChannels = {
  emailConfigured: boolean;
  telegram: { configured: boolean; connected: boolean; enabled: boolean };
  recentAlerts: { inbox_id: string; state: string; last_error: string | null }[];
};
