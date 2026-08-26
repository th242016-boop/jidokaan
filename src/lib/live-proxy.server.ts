const LIVE = (process.env.LIVE_ORIGIN || "https://jidokaan.com").replace(/\/$/, "");

export function shouldProxyToLive(request: Request) {
  if (process.env.DATABASE_URL?.trim()) return false;
  const host = request.headers.get("host") || "";
  if (host.includes("jidokaan.com")) return false;
  return true;
}

export async function proxyToLive(request: Request, path: string) {
  try {
    let search = "";
    try {
      search = new URL(request.url, "http://127.0.0.1").search;
    } catch {
      search = "";
    }
    const headers = new Headers();
    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    headers.set("user-agent", "jidokaan-preview-proxy");
    const init: RequestInit = { method: request.method, headers };
    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = Buffer.from(await request.arrayBuffer());
    }
    const res = await fetch(`${LIVE}${path}${search}`, init);
    const body = await res.arrayBuffer();
    const out = new Headers();
    out.set("content-type", res.headers.get("content-type") || "application/json");
    return new Response(body, { status: res.status, headers: out });
  } catch (err) {
    const message = err instanceof Error ? err.message : "proxy_failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
