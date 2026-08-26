import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
};

const SAFE = /^[a-zA-Z0-9._-]+$/;

export function resolveUploadPath(
  folder: "upload" | "video",
  filename: string,
): string | null {
  if (!SAFE.test(filename)) return null;
  const root = path.resolve(process.cwd(), "public", "products");
  const full = path.resolve(root, folder, filename);
  if (!full.startsWith(root + path.sep)) return null;
  if (!existsSync(full)) return null;
  return full;
}

export function parseUploadUrl(pathname: string): {
  folder: "upload" | "video";
  filename: string;
} | null {
  const m = pathname.match(/^\/products\/(upload|video)\/([^/]+)$/);
  if (!m) return null;
  return { folder: m[1] as "upload" | "video", filename: decodeURIComponent(m[2] ?? "") };
}

export async function uploadFileResponse(pathname: string): Promise<Response | null> {
  const parsed = parseUploadUrl(pathname);
  if (!parsed) return null;
  const full = resolveUploadPath(parsed.folder, parsed.filename);
  if (!full) return new Response("not found", { status: 404 });
  const ext = path.extname(full).toLowerCase();
  const buf = await import("node:fs/promises").then((fs) => fs.readFile(full));
  return new Response(buf, {
    headers: {
      "content-type": MIME[ext] ?? "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

/** Vite/Node middleware: serve runtime uploads even when the folder is watch-ignored. */
export function pipeUploadFile(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
): boolean {
  const parsed = parseUploadUrl(pathname);
  if (!parsed) return false;
  const full = resolveUploadPath(parsed.folder, parsed.filename);
  if (!full) {
    res.statusCode = 404;
    res.end("not found");
    return true;
  }
  const ext = path.extname(full).toLowerCase();
  const stat = statSync(full);
  res.statusCode = 200;
  res.setHeader("content-type", MIME[ext] ?? "application/octet-stream");
  res.setHeader("content-length", String(stat.size));
  res.setHeader("cache-control", "public, max-age=31536000, immutable");
  createReadStream(full).pipe(res);
  return true;
}
