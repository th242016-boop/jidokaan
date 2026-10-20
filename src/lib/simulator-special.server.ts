import { createDecipheriv } from "node:crypto";
import { assertSession, AUTH_HEADERS } from "./admin-auth.server";
import { flowerPartsFor } from "./simulator-special";
import { SPECIAL_PATTERNS, type SpecialPatternAssets } from "./special-patterns";
import { finishFor } from "./special-finishes";
import { snakeMaterialFor } from "./snake-materials";

// Encrypted source assets are safe to keep in the public repository. Only the server
// has the key; nothing here belongs in public/ or in a client-side import.
const encrypted = import.meta.glob<string>("./special-assets/*.enc", {
  query: "?raw", import: "default", eager: true,
});

function image(name: string, keyName = "SIMULATOR_SPECIAL_ASSET_KEY", mime = "image/png") {
  const key = Buffer.from(process.env[keyName] ?? "", "base64");
  if (key.length !== 32) throw new Error("SPECIAL_UNAVAILABLE");
  const value = encrypted[`./special-assets/${name}.enc`];
  if (!value) throw new Error("SPECIAL_UNAVAILABLE");
  const bytes = Buffer.from(value, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  const png = Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]);
  return `data:${mime};base64,${png.toString("base64")}`;
}

function patternAssets(): SpecialPatternAssets {
  // A missing new material key must not disable the existing FLOWER A studio.
  if (!process.env.SIMULATOR_SPECIAL_PATTERN_KEY) return {};
  try {
    const decoded = new Map<string, { texture: string; swatch: string }>();
    return Object.fromEntries(SPECIAL_PATTERNS.map(({ name }) => {
      const file = finishFor(name)?.assetKey ?? (snakeMaterialFor(name) ? "natural-snake" : name === "WHITE SNAKE" ? "black-snake" : name.toLowerCase().replaceAll(" ", "-"));
      if (!decoded.has(file)) decoded.set(file, {
          texture: image(`material-${file}`, "SIMULATOR_SPECIAL_PATTERN_KEY", "image/jpeg"),
          swatch: image(`material-${file}-swatch`, "SIMULATOR_SPECIAL_PATTERN_KEY", "image/jpeg"),
        });
      return [name, decoded.get(file)!];
    }));
  } catch {
    console.error("Special pattern assets unavailable");
    return {};
  }
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
      patterns: patternAssets(),
    });
  } catch { return json({ error: "SPECIAL_UNAVAILABLE" }, 503); }
}
