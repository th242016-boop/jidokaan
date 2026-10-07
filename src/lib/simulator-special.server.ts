import { createDecipheriv } from "node:crypto";
import { assertSession, AUTH_HEADERS } from "./admin-auth.server";
import { flowerPartsFor } from "./simulator-special";

// Encrypted source assets are safe to keep in the public repository. Only the server
// has the key; nothing here belongs in public/ or in a client-side import.
const encrypted = import.meta.glob<string>("./special-assets/*.enc", {
  query: "?raw", import: "default", eager: true,
});

function image(name: string) {
  const key = Buffer.from(process.env.SIMULATOR_SPECIAL_ASSET_KEY ?? "", "base64");
  if (key.length !== 32) throw new Error("SPECIAL_UNAVAILABLE");
  const value = encrypted[`./special-assets/${name}.enc`];
  if (!value) throw new Error("SPECIAL_UNAVAILABLE");
  const bytes = Buffer.from(value, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  const png = Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]);
  return `data:image/png;base64,${png.toString("base64")}`;
}

export async function handleSpecialRequest(request: Request) {
  const json = (data: unknown, status = 200) => Response.json(data, { status, headers: AUTH_HEADERS });
  if (request.method !== "POST") return json({ error: "AUTH" }, 401);
  let body: { token?: unknown; action?: unknown; model?: unknown };
  try { body = await request.json(); } catch { return json({ error: "BAD_REQUEST" }, 400); }
  if (!body || typeof body !== "object") return json({ error: "BAD_REQUEST" }, 400);
  try { await assertSession(typeof body.token === "string" ? body.token : ""); }
  catch { return json({ error: "AUTH" }, 401); }
  if (body.action === "ping") return json({ ok: true });
  if (body.action !== "assets" || (body.model !== "high" && body.model !== "mid")) {
    return json({ error: "BAD_REQUEST" }, 400);
  }
  try {
    return json({
      swatch: image("swatch"),
      layers: Object.fromEntries(flowerPartsFor(body.model).map(part => [part, image(part)])),
    });
  } catch { return json({ error: "SPECIAL_UNAVAILABLE" }, 503); }
}
