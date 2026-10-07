const TOKEN_KEY = "jidokaan-admin-token";
export const ADMIN_SESSION_EVENT = "jidokaan-admin-session-ended";

export function readAdminToken() {
  try { return sessionStorage.getItem(TOKEN_KEY) ?? ""; } catch { return ""; }
}

export function writeAdminToken(token: string) {
  try { sessionStorage.setItem(TOKEN_KEY, token); } catch { /* storage unavailable */ }
  if (!token && typeof window !== "undefined") {
    window.dispatchEvent(new Event(ADMIN_SESSION_EVENT));
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(ADMIN_SESSION_EVENT);
      channel.postMessage("logout");
      channel.close();
    }
  }
}
