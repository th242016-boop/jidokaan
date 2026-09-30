/** Empty is allowed for customers who do not use Instagram. Never store a URL. */
export function normalizeInstagram(value: unknown): string {
  const handle = String(value ?? "")
    .trim()
    .replace(/^@/, "");
  if (!handle) return "";
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) throw new Error("INSTAGRAM_INVALID");
  return handle;
}
