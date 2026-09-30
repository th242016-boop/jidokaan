import { createHash } from "node:crypto";
import type { CheckoutInput } from "./checkout-quote.server";
function env(key: string) {
  return (process.env[key] ?? "").trim();
}

const clientId = () => env("PAYPAL_CLIENT_ID");
const secret = () => env("PAYPAL_CLIENT_SECRET");

function apiBase() {
  const mode = (env("PAYPAL_ENV") || env("PAYPAL_MODE") || "live").toLowerCase();
  return mode === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
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

export async function createPaypalOrder(
  valueUsd: string,
  checkout?: { requestId: string; order: CheckoutInput },
) {
  const value = Number(valueUsd).toFixed(2);
  if (!(Number(value) > 0)) throw new Error("PAYPAL_AMOUNT");
  const token = await accessToken();
  const res = await fetch(`${apiBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(checkout ? { "PayPal-Request-Id": checkout.requestId } : {}),
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value },
          ...(checkout
            ? {
                custom_id: checkout.requestId,
                shipping: {
                  name: { full_name: checkout.order.name },
                  address: {
                    address_line_1: checkout.order.address,
                    admin_area_2: checkout.order.city,
                    admin_area_1: checkout.order.region || undefined,
                    postal_code: checkout.order.postal || undefined,
                    country_code: checkout.order.country,
                  },
                },
              }
            : {}),
        },
      ],
      ...(checkout
        ? {
            payment_source: {
              paypal: {
                experience_context: {
                  shipping_preference: "SET_PROVIDED_ADDRESS",
                  user_action: "PAY_NOW",
                },
              },
            },
          }
        : {}),
    }),
  });
  const data = (await res.json()) as { id?: string };
  if (!res.ok || !data.id) throw new Error("PAYPAL_CREATE");
  return data.id;
}

export async function capturePaypalOrder(orderId: string) {
  const id = orderId.trim();
  if (!/^[A-Za-z0-9-]{6,80}$/.test(id)) throw new Error("PAYPAL_ORDER");
  const token = await accessToken();
  const res = await fetch(`${apiBase()}/v2/checkout/orders/${id}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": createHash("sha256").update(`capture:${id}`).digest("hex").slice(0, 38),
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

type PaypalMoney = { currency_code?: string; value?: string };
type PaypalOrder = {
  id?: string;
  status?: string;
  purchase_units?: {
    shipping?: {
      name?: { full_name?: string };
      address?: {
        address_line_1?: string;
        address_line_2?: string;
        admin_area_2?: string;
        admin_area_1?: string;
        postal_code?: string;
        country_code?: string;
      };
    };
    payments?: {
      captures?: {
        id?: string;
        status?: string;
        amount?: PaypalMoney;
        seller_receivable_breakdown?: { paypal_fee?: PaypalMoney; net_amount?: PaypalMoney };
      }[];
    };
  }[];
};

export function verifiedPayment(data: PaypalOrder, id: string, expectedUsd: number) {
  const units = data.purchase_units ?? [];
  const captures = units.flatMap((unit) => unit.payments?.captures ?? []);
  const capture = captures[0];
  // This integration creates one purchase unit and a single full capture.
  if (
    data.id !== id ||
    units.length !== 1 ||
    captures.length !== 1 ||
    capture?.status !== "COMPLETED" ||
    !capture.id
  )
    throw new Error("PAYPAL_UNPAID");
  const gross = Number(capture.amount?.value);
  if (
    capture.amount?.currency_code !== "USD" ||
    !Number.isFinite(expectedUsd) ||
    expectedUsd <= 0 ||
    !Number.isFinite(gross) ||
    Math.round(gross * 100) !== Math.round(expectedUsd * 100)
  )
    throw new Error("PAYPAL_AMOUNT_MISMATCH");
  const usd = (money?: PaypalMoney) =>
    money?.currency_code === "USD" && money.value != null && Number.isFinite(Number(money.value))
      ? Number(money.value)
      : undefined;
  const shipping = units[0].shipping;
  const address = shipping?.address;
  return {
    paypalOrderId: id,
    paypalCaptureId: capture.id,
    paypalGrossUsd: gross,
    paypalFeeUsd: usd(capture.seller_receivable_breakdown?.paypal_fee),
    paypalNetUsd: usd(capture.seller_receivable_breakdown?.net_amount),
    paypalShipping: address
      ? {
          name: shipping?.name?.full_name,
          addressLine1: address.address_line_1,
          addressLine2: address.address_line_2,
          city: address.admin_area_2,
          region: address.admin_area_1,
          postal: address.postal_code,
          country: address.country_code,
        }
      : undefined,
  };
}

export async function verifyPaypalPayment(orderId: string, expectedUsd: number) {
  const id = orderId.trim();
  if (!/^[A-Za-z0-9-]{6,80}$/.test(id)) throw new Error("PAYPAL_ORDER");
  const token = await accessToken();
  const res = await fetch(`${apiBase()}/v2/checkout/orders/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("PAYPAL_VERIFY");
  return verifiedPayment((await res.json()) as PaypalOrder, id, expectedUsd);
}
