import type { StoreOrder } from "./order-types";

/** Compile-time review build only. Never enabled by a URL or a browser setting. */
export const IS_REVIEW_PREVIEW = import.meta.env.VITE_REVIEW_PREVIEW === "true";
export const REVIEW_ORDER_ID = IS_REVIEW_PREVIEW ? "PREVIEW-ONLY-001" : "";
export const REVIEW_EMAIL = IS_REVIEW_PREVIEW ? "demo@example.com" : "";

export const REVIEW_DEMO_ORDER: StoreOrder | null = IS_REVIEW_PREVIEW ? {
  id: REVIEW_ORDER_ID, createdAt: "2026-11-14T00:00:00.000Z",
  email: REVIEW_EMAIL, phone: "+1 202 555 0100", name: "Preview Customer",
  address: "123 Example Street", city: "Example City", region: "CA", postal: "90001",
  country: "US", contactMethod: "email", checkoutLocale: "en", pay: "preview",
  shipMethod: "standard", shippingKrw: 0, shippingUsd: 170,
  totalKrw: 0, totalUsd: 670, currency: "USD", status: "shipped",
  items: [{productId: "drone-custom", name: "JIDOKAAN DRONE — example only", qty: 2,
    size: "265", sizeFit: "men", priceKrw: 288000, priceUsd: 250,
    designPreview: "/homepage/assets/white-gold.webp"}],
  customerParcels: [
    { id: "example-parcel-1", state: "delivered", tracking: "EXAMPLE-ONLY-1", manuallyConfirmed: true },
    { id: "example-parcel-2", state: "in_transit", tracking: "EXAMPLE-ONLY-2", trackingUnavailable: true },
  ],
} : null;

const REVIEW_ORDER_STORAGE = "jidokaan-review-order";
export function saveReviewOrder(order: StoreOrder) {
  if (!IS_REVIEW_PREVIEW || typeof window === "undefined") return;
  try { sessionStorage.setItem(REVIEW_ORDER_STORAGE, JSON.stringify({ ...order, id: REVIEW_ORDER_ID, pay: "preview" })); }
  catch { /* An explicit example remains available when browser storage is unavailable. */ }
}
export function getReviewOrder(): StoreOrder {
  if (!IS_REVIEW_PREVIEW || !REVIEW_DEMO_ORDER) throw new Error("REVIEW_PREVIEW_DISABLED");
  if (IS_REVIEW_PREVIEW && typeof window !== "undefined") {
    try {
      const saved = JSON.parse(sessionStorage.getItem(REVIEW_ORDER_STORAGE) || "null");
      if (saved?.id === REVIEW_ORDER_ID && saved.pay === "preview" && Array.isArray(saved.items) && typeof saved.email === "string") return saved;
    } catch { /* use the clearly labelled fixture */ }
  }
  return REVIEW_DEMO_ORDER;
}

let installed = false;

/** Defense in depth: static preview has no API server; also prevent client requests. */
export function installReviewNetworkGuard() {
  if (!IS_REVIEW_PREVIEW || typeof window === "undefined" || installed) return;
  installed = true;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = new URL(typeof input === "string" || input instanceof URL ? input.toString() : input.url, location.href);
    const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
    if (url.origin === location.origin && url.pathname === "/api/orders") {
      let credentials: { action?: string; id?: string; email?: string } | null = null;
      if (method === "GET") credentials = { id: url.searchParams.get("id") ?? "", email: url.searchParams.get("email") ?? "" };
      if (method === "POST") {
        try {
          const body = typeof init?.body === "string" ? JSON.parse(init.body) : input instanceof Request ? await input.clone().json() : null;
          if (body?.action === "lookup") credentials = body;
        } catch { /* all other requests remain blocked */ }
      }
      if (credentials) {
        const fixture = getReviewOrder();
        const match = credentials.id === fixture.id && credentials.email?.trim().toLowerCase() === fixture.email.trim().toLowerCase();
        return Response.json(match ? {order: fixture, preview: true} : {error: "NOT_FOUND"}, {status: match ? 200 : 404});
      }
    }
    // Images/SVGs loaded by the real simulator remain available. API, auth,
    // analytics and all outbound/POST requests are never forwarded anywhere.
    if (url.origin === location.origin && method === "GET" && /\.(?:svg|png|jpe?g|webp|avif|gif|glb|gltf|bin|woff2?|ttf|css|js|json)$/i.test(url.pathname) && !/^\/(?:api|_server|auth)\//.test(url.pathname)) {
      return nativeFetch(input, init);
    }
    return Response.json({error: "PREVIEW_NO_TRANSACTIONS", preview: true}, {status: 403});
  };
  try { navigator.sendBeacon = () => false; } catch { /* CSP also denies outbound connections. */ }
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("a") : null;
    if (!target) return;
    const url = new URL(target.href, location.href);
    if (url.origin !== location.origin) {
      event.preventDefault();
      event.stopImmediatePropagation();
      alert("테스트 화면입니다. 외부 로그인·결제·메시지는 실행하지 않습니다.\nPreview only: external sign-in, payment and messaging are disabled.");
    }
  }, true);
}

installReviewNetworkGuard();
