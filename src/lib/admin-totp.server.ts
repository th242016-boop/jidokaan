import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const derive = promisify(scrypt);
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

// A 20-byte TOTP key has exactly 32 Base32 characters.
function decodeKey(key: string) {
  if (!/^[A-Z2-7]{32}$/.test(key)) throw new Error("TOTP_KEY");
  let bits = 0,
    value = 0;
  const bytes: number[] = [];
  for (const char of key) {
    value = (value << 5) | alphabet.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >>> bits) & 255);
    }
  }
  return Buffer.from(bytes);
}

export function matchTotp(key: string, code: string, time = Date.now()) {
  if (!/^\d{6}$/.test(code)) return null;
  const secret = decodeKey(key);
  const now = Math.floor(time / 30000);
  for (const step of [now, now - 1, now + 1]) {
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(step));
    const hmac = createHmac("sha1", secret).update(counter).digest();
    const pos = hmac[hmac.length - 1]! & 15;
    const number = (hmac.readUInt32BE(pos) & 0x7fffffff) % 1000000;
    if (timingSafeEqual(Buffer.from(code), Buffer.from(String(number).padStart(6, "0"))))
      return step;
  }
  return null;
}

export async function sealTotp(key: string, pin: string) {
  decodeKey(key);
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", (await derive(pin, salt, 32)) as Buffer, iv);
  const encrypted = Buffer.concat([cipher.update(key, "utf8"), cipher.final()]);
  return [salt, iv, cipher.getAuthTag(), encrypted].map((b) => b.toString("hex")).join(".");
}

export async function openTotp(sealed: string, pin: string) {
  const parts = sealed.split(".").map((value) => Buffer.from(value, "hex"));
  if (parts.length !== 4) throw new Error("AUTH");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    (await derive(pin, parts[0]!, 32)) as Buffer,
    parts[1]!,
  );
  decipher.setAuthTag(parts[2]!);
  return Buffer.concat([decipher.update(parts[3]!), decipher.final()]).toString("utf8");
}
