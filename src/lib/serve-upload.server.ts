import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  legacyUploadDir,
  tmpUploadDir,
  uploadDir,
  type UploadFolder,
} from "./upload-dir.server";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jfif": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
};

const SAFE = /^[a-zA-Z0-9._-]+$/;

export function resolveUploadPath(
  folder: UploadFolder,
  filename: string,
): string | null {
  if (!SAFE.test(filename)) return null;
  for (const root of [tmpUploadDir(folder), uploadDir(folder), legacyUploadDir(folder)]) {
    const full = path.resolve(root, filename);
    if (!full.startsWith(root + path.sep)) continue;
    if (existsSync(full)) return full;
  }
  return null;
}

export function parseUploadUrl(pathname: string): {
  folder: UploadFolder;
  filename: string;
} | null {
  const m = pathname.match(/^\/products\/(upload|video)\/([^/]+)$/);
  if (!m) return null;
  return { folder: m[1] as UploadFolder, filename: decodeURIComponent(m[2] ?? "") };
}

export async function uploadFileResponse(pathname: string): Promise<Response | null> {
  const parsed = parseUploadUrl(pathname);
  if (!parsed) return null;
  const full = resolveUploadPath(parsed.folder, parsed.filename);
  if (full) {
    const ext = path.extname(full).toLowerCase();
    const buf = await import("node:fs/promises").then((fs) => fs.readFile(full));
    return new Response(buf, {
      headers: {
        "content-type": MIME[ext] ?? "application/octet-stream",
        "cache-control": "public, max-age=31536000, immutable",
        "content-length": String(buf.length),
      },
    });
  }
  try {
    const { readMediaFile } = await import("./media.server");
    const row = await readMediaFile(parsed.filename);
    if (!row) return new Response("not found", { status: 404 });
    return new Response(row.bytes, {
      headers: {
        "content-type": row.mime || "application/octet-stream",
        "cache-control": "public, max-age=31536000, immutable",
        "content-length": String(row.bytes.length),
      },
    });
  } catch {
    return new Response("not found", { status: 404 });
  }
}

export function pipeUploadFile(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
): boolean {
  const parsed = parseUploadUrl(pathname);
  if (!parsed) return false;
  const full = resolveUploadPath(parsed.folder, parsed.filename);
  if (!full) return false;
  const ext = path.extname(full).toLowerCase();
  const stat = statSync(full);
  res.statusCode = 200;
  res.setHeader("content-type", MIME[ext] ?? "application/octet-stream");
  res.setHeader("content-length", String(stat.size));
  res.setHeader("cache-control", "public, max-age=31536000, immutable");
  createReadStream(full).pipe(res);
  return true;
}
