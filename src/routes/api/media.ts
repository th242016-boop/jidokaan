import { createFileRoute } from "@tanstack/react-router";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertSession, AUTH_HEADERS } from "@/lib/admin-auth.server";
import { saveMediaFile } from "@/lib/media.server";
import { proxyToLive, shouldProxyToLive } from "@/lib/live-proxy.server";
import { uploadRoots } from "@/lib/upload-dir.server";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: AUTH_HEADERS });
}

const IMAGE_EXT = new Set([
  ".jpg",
  ".jpeg",
  ".jfif",
  ".png",
  ".webp",
  ".gif",
  ".avif",
  ".svg",
  ".bmp",
  ".heic",
  ".heif",
  ".tif",
  ".tiff",
]);
const VIDEO_EXT = new Set([".mp4", ".webm", ".mov", ".m4v"]);
const MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/pjpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "image/svg+xml": ".svg",
  "image/bmp": ".bmp",
  "image/x-windows-bmp": ".bmp",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "image/tiff": ".tiff",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

type UploadBlob = {
  name?: string;
  type?: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

function isUpload(v: unknown): v is UploadBlob {
  return (
    !!v &&
    typeof v === "object" &&
    typeof (v as UploadBlob).size === "number" &&
    typeof (v as UploadBlob).arrayBuffer === "function"
  );
}

function fileExt(file: UploadBlob): string {
  const fromName = path.extname(file.name || "").toLowerCase();
  if (IMAGE_EXT.has(fromName) || VIDEO_EXT.has(fromName)) return fromName;
  return MIME_EXT[(file.type || "").toLowerCase()] ?? "";
}

async function writeDisk(folder: "upload" | "video", name: string, buf: Buffer) {
  let ok = false;
  for (const dir of uploadRoots(folder)) {
    try {
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, name), buf);
      ok = true;
    } catch {
      /* try next root */
    }
  }
  return ok;
}

export const Route = createFileRoute("/api/media")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (shouldProxyToLive(request)) return proxyToLive(request, "/api/media");
        try {
          const type = request.headers.get("content-type") || "";
          if (!type.includes("multipart/form-data")) {
            return json({ error: "no_file" }, 400);
          }
          const form = await request.formData();
          const token = String(form.get("token") ?? "");
          await assertSession(token);
          const file = form.get("file");
          if (!isUpload(file) || file.size < 1) {
            return json({ error: "no_file" }, 400);
          }
          if (file.size > 80 * 1024 * 1024) {
            return json({ error: "too_large" }, 413);
          }
          const ext = fileExt(file);
          if (!ext) return json({ error: "bad_type" }, 400);
          const isImage = IMAGE_EXT.has(ext);
          const stamp = Date.now().toString(36);
          const rand = Math.random().toString(36).slice(2, 8);
          const base =
            path
              .basename(file.name || "file", ext)
              .replace(/[^a-zA-Z0-9._-]/g, "")
              .slice(0, 40) || "file";
          const name = `${stamp}-${rand}-${base}${ext}`;
          const folder = isImage ? "upload" : "video";
          const buf = Buffer.from(await file.arrayBuffer());
          const mime = file.type || (isImage ? "image/jpeg" : "video/mp4");

          const diskOk = await writeDisk(folder, name, buf);
          if (diskOk) {
            void saveMediaFile(name, mime, buf).catch(() => undefined);
            return json({ url: `/products/${folder}/${name}`, bytes: buf.length });
          }
          await saveMediaFile(name, mime, buf);
          return json({ url: `/products/${folder}/${name}`, bytes: buf.length });
        } catch (err) {
          const message = err instanceof Error ? err.message : "upload_failed";
          const status = message === "AUTH" ? 401 : 500;
          return json({ error: message }, status);
        }
      },
    },
  },
});
