import { mkdir } from "node:fs/promises";
import path from "node:path";

export type UploadFolder = "upload" | "video";

/** Runtime files live under data/uploads (Railway Volume: mount /app/data). */
export function uploadRoot() {
  const fromEnv = process.env.UPLOAD_DIR?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.resolve(process.cwd(), "data", "uploads");
}

export function uploadDir(folder: UploadFolder) {
  return path.join(uploadRoot(), folder);
}

export function legacyUploadDir(folder: UploadFolder) {
  return path.resolve(process.cwd(), "public", "products", folder);
}

export async function ensureUploadDir(folder: UploadFolder) {
  const dir = uploadDir(folder);
  await mkdir(dir, { recursive: true });
  return dir;
}
