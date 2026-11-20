import { isIP } from "node:net";
import { reportSecurityEvent } from "./security-events.server";

// Per-minute limits [one network, whole application instance]. The global cap
// also bounds memory during distributed traffic and when the peer is unknown.
const limits = {
  orders: [90, 900],
  checkout: [90, 900],
  createOrder: [15, 150],
  createPayment: [20, 180],
  analytics: [180, 1800],
  catalogWrite: [120, 600],
  adminLogin: [20, 180],
  account: [90, 900],
  media: [120, 480],
} as const;
type Area = keyof typeof limits;
type Window = { minute: number; count: number; peers: Map<string, number> };
const windows = new Map<Area, Window>();

class RequestGuardError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function limitRequests(request: Request, area: Area) {
  const minute = Math.floor(Date.now() / 60_000);
  let window = windows.get(area);
  if (!window || window.minute !== minute) {
    window = { minute, count: 0, peers: new Map() };
    windows.set(area, window);
  }
  const [peerMax, totalMax] = limits[area];
  // Railway sets X-Real-IP at its ingress. Ignore client-supplied forwarding chains.
  const peer = process.env.RAILWAY_ENVIRONMENT_ID ? request.headers.get("x-real-ip") : null;
  const key = peer && isIP(peer) ? peer : null;
  const previous = key ? window.peers.get(key) ?? 0 : 0;
  if (window.count >= totalMax || previous >= peerMax) {
    if (area === "orders" || area === "checkout" || area === "createOrder" || area === "createPayment") {
      reportSecurityEvent("orderTraffic");
    } else if (area === "adminLogin") {
      reportSecurityEvent("adminLogin");
    }
    throw new RequestGuardError(429, "RATE_LIMIT");
  }
  window.count++;
  if (key) window.peers.set(key, previous + 1);
}

// A cart accepts up to 30 separate designs, each with a preview of up to
// 600,000 characters. Preserve those orders, including their specifications.
export const checkoutBodyLimit = 20 * 1024 * 1024;

// Count bytes even without Content-Length. A parser can wrap a stream error,
// so retain the limit flag for a reliable HTTP 413 result.
let activeBytes = 0;
const activeByteLimit = 128 * 1024 * 1024;

export async function readBoundedBody<T>(
  request: Request, bytes: number, parse: (body: Response) => Promise<T>,
): Promise<T> {
  if (Number(request.headers.get("content-length")) > bytes) {
    throw new RequestGuardError(413, "TOO_LARGE");
  }
  let seen = 0;
  let reserved = 0;
  let rejected: RequestGuardError | undefined;
  const stream = request.body?.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      seen += chunk.byteLength;
      if (seen > bytes) rejected = new RequestGuardError(413, "TOO_LARGE");
      else if (activeBytes + chunk.byteLength > activeByteLimit) rejected = new RequestGuardError(503, "BUSY");
      if (rejected) throw rejected;
      activeBytes += chunk.byteLength;
      reserved += chunk.byteLength;
      controller.enqueue(chunk);
    },
  }));
  try {
    return await parse(new Response(stream ?? null, { headers: request.headers }));
  } catch (error) {
    throw rejected ?? error;
  } finally {
    activeBytes -= reserved;
  }
}

export function readBoundedJson(request: Request, bytes: number) {
  return readBoundedBody(request, bytes, (body) => body.json());
}

export function guardResponse(error: unknown) {
  if (!(error instanceof RequestGuardError)) return null;
  const headers = new Headers({ "Cache-Control": "no-store" });
  if (error.status === 429) headers.set("Retry-After", String(60 - Math.floor(Date.now() / 1000) % 60));
  if (error.status === 503) headers.set("Retry-After", "5");
  return Response.json({ error: error.message }, { status: error.status, headers });
}
