function env(key: string) {
  return (process.env[key] ?? "").trim();
}

const clientId = () => env("PAYPAL_CLIENT_ID");
const secret = () => env("PAYPAL_CLIENT_SECRET");

function apiBase() {
  const mode = (env("PAYPAL_ENV") || env("PAYPAL_MODE") || "live").toLowerCase();
  return mode === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

export function paypalPublic() {
  const id = clientId();
  return {
    enabled: Boolean(id && secret()),
    clientId: id,
    mode: apiBase().includes("sandbox") ? "sandbox" : "live",
  };
}

async function accessToken() {
  const id = clientId();
  const sec = secret();
  if (!id || !sec) throw new Error("PAYPAL_NOT_CONFIGURED");
  const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${sec}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = (await res.json()) as { access_token?: string };
  if (!res.ok || !data.access_token) throw new Error("PAYPAL_AUTH");
  return data.access_token;
}

export async function createPaypalOrder(valueUsd: string) {
  const value = Number(valueUsd).toFixed(2);
  if (!(Number(value) > 0)) throw new Error("PAYPAL_AMOUNT");
  const token = await accessToken();
  const res = await fetch(`${apiBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value },
        },
      ],
    }),
  });
  const data = (await res.json()) as { id?: string };
  if (!res.ok || !data.id) throw new Error("PAYPAL_CREATE");
  return data.id;
}

export async function capturePaypalOrder(orderId: string) {
  const id = orderId.trim();
  if (!id) throw new Error("PAYPAL_ORDER");
  const token = await accessToken();
  const res = await fetch(`${apiBase()}/v2/checkout/orders/${id}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = (await res.json()) as {
    id?: string;
    status?: string;
    purchase_units?: { payments?: { captures?: { status?: string }[] } }[];
  };
  const cap = data.purchase_units?.[0]?.payments?.captures?.[0]?.status;
  const ok = data.status === "COMPLETED" || cap === "COMPLETED";
  if (!res.ok || !ok) throw new Error("PAYPAL_CAPTURE");
  return { id: data.id ?? id, status: "COMPLETED" };
}

export async function paypalCaptureOk(orderId: string) {
  const id = orderId.trim();
  if (!id) return false;
  const token = await accessToken();
  const res = await fetch(`${apiBase()}/v2/checkout/orders/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return false;
  const data = (await res.json()) as {
    status?: string;
    purchase_units?: { payments?: { captures?: { status?: string }[] } }[];
  };
  const cap = data.purchase_units?.[0]?.payments?.captures?.[0]?.status;
  return data.status === "COMPLETED" || cap === "COMPLETED";
}
