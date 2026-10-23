import { createDecipheriv } from "node:crypto";
import { assertSession, AUTH_HEADERS } from "./admin-auth.server";
import { flowerPartsFor } from "./simulator-special";
import { SPECIAL_PATTERNS, isMetallicPattern, type SpecialPatternAssets } from "./special-patterns";
import { finishFor } from "./special-finishes";
import { snakeMaterialFor } from "./snake-materials";
import { isLizardPattern } from "./lizard-materials";
import { camouflageMaterialFor } from "./camouflage-materials";
import { isPublicSpecialPattern, type SimulatorAudience } from "./simulator-catalog";
import { compactPatternAssets } from "./pattern-asset-wire";

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

function patternAssets(audience: SimulatorAudience): SpecialPatternAssets {
  // Enforce publication before reading/decrypting assets. New names are private
  // by default, including camouflage; public callers cannot request them by ID.
  const visiblePatterns = SPECIAL_PATTERNS.filter(({ name }) => audience === "admin" || isPublicSpecialPattern(name));
  if (!process.env.SIMULATOR_SPECIAL_PATTERN_KEY) return {};
  const patterns: SpecialPatternAssets = {};
  const decoded = new Map<string, { texture: string; swatch: string }>();
  const referenceKey = "SIMULATOR_REFERENCE_MATERIALS_20261021_KEY";
  const pair = (file: string, key: string) => {
    const id = `${key}:${file}`;
    if (!decoded.has(id)) decoded.set(id, {
      texture: image(`material-${file}`, key, "image/jpeg"),
      swatch: image(`material-${file}-swatch`, key, "image/jpeg"),
    });
    return decoded.get(id)!;
  };
  for (const { name } of visiblePatterns) {
    if (name === "SILVER WEAVE" && process.env.SIMULATOR_SILVER_WEAVE_PHOTO_KEY) {
      try {
        // Preserve the owner's original JPEG. Both the button and renderer
        // sample the same exposed leather, excluding the finger and plastic.
        const photo = image("material-silver-weave-photo", "SIMULATOR_SILVER_WEAVE_PHOTO_KEY", "image/jpeg");
        patterns[name] = {
          texture: photo, swatch: photo,
          sourceCrop: [230 / 484, 340 / 860, 140 / 484, 140 / 860],
        };
        continue;
      } catch { console.error("Original SILVER WEAVE photograph unavailable"); }
    }
    const camouflage = camouflageMaterialFor(name);
    const revised = isLizardPattern(name) ? "reference-lizard" : name === "SILVER WEAVE" ? "reference-silver-weave" : undefined;
    if (camouflage || revised) {
      if (process.env[referenceKey]) {
        try {
          patterns[name] = pair(camouflage?.assetKey ?? revised!, referenceKey);
          continue;
        } catch { console.error(`Reference material unavailable: ${name}`); }
      }
      // New private previews have no substitute. Established materials retain
      // their prior source if the independent reference key is not available.
      if (camouflage) continue;
    }
    const metallic = isMetallicPattern(name);
    const key = metallic ? "SIMULATOR_SPECIAL_METALLIC_KEY" : "SIMULATOR_SPECIAL_PATTERN_KEY";
    if (!process.env[key]) continue;
    const file = finishFor(name)?.assetKey ?? (snakeMaterialFor(name) ? "natural-snake" : isLizardPattern(name) ? "black-snake" : name.toLowerCase().replaceAll(" ", "-"));
    try { patterns[name] = pair(file, key); }
    catch { console.error(`Special material unavailable: ${name}`); }
  }
  return patterns;
}

export async function handleSpecialRequest(request: Request) {
  const json = (data: unknown, status = 200) => Response.json(data, { status, headers: AUTH_HEADERS });
  if (request.method !== "POST") return json({ error: "AUTH" }, 401);
  let body: { token?: unknown; action?: unknown; model?: unknown; audience?: unknown; compact?: unknown };
  try { body = await request.json(); } catch { return json({ error: "BAD_REQUEST" }, 400); }
  if (!body || typeof body !== "object") return json({ error: "BAD_REQUEST" }, 400);
  // Anonymous access is an explicit released-catalog operation. The original
  // admin request remains protected, including a caller with an invalid token.
  const audience: SimulatorAudience = body.audience === "public" ? "public" : "admin";
  if (audience === "admin") {
    try { await assertSession(typeof body.token === "string" ? body.token : ""); }
    catch { return json({ error: "AUTH" }, 401); }
  }
  if (body.action === "ping") return json({ ok: true, audience });
  if (body.action !== "assets" || (body.model !== "high" && body.model !== "mid")) {
    return json({ error: "BAD_REQUEST" }, 400);
  }
  try {
    // Never decode or send FLOWER A in a public response. Filtering occurs
    // before texture decoding, not merely in the browser's option buttons.
    const patterns = patternAssets(audience);
    return json({
      audience,
      ...(audience === "admin" ? {
        swatch: image("swatch"),
        layers: Object.fromEntries(flowerPartsFor(body.model).map(part => [part, image(part)])),
      } : { layers: {} }),
      ...(body.compact === true ? compactPatternAssets(patterns) : { patterns }),
    });
  } catch { return json({ error: "SPECIAL_UNAVAILABLE" }, 503); }
}
