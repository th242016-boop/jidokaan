import { timingSafeEqual } from "node:crypto";

// A simulator-only capability. Never use this token in administrator sessions.
// Kept in the server environment, so it cannot be found in a public JS bundle.
function configuredToken() {
  const token = process.env.SIMULATOR_SPECIAL_SHARE_TOKEN;
  return typeof token === "string" && /^[a-f0-9]{64}$/.test(token) ? token : null;
}

export function isSimulatorShareToken(value: unknown): boolean {
  const token = configuredToken();
  if (!token || typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) return false;
  return timingSafeEqual(Buffer.from(value, "hex"), Buffer.from(token, "hex"));
}

// Call only after checking an administrator session. The fragment keeps the
// capability out of HTTP navigation URLs and Referer headers.
export function simulatorShareUrl(): string | null {
  const token = configuredToken();
  return token ? `https://jidokaan.com/special#key=${token}` : null;
}
