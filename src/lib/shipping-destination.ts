import { isActiveSalesCountry } from "./active-sales-policy";

export const SHIPPING_COUNTRY_KEY = "jidokaan-ship-country";

export function normalizeShippingCountry(value: unknown): string {
  if (typeof value !== "string") return "";
  const code = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : "";
}

export function currencyForDestination(country: string): "KRW" | "USD" {
  return normalizeShippingCountry(country) === "KR" ? "KRW" : "USD";
}

export function isSupportedShippingCountry(country: string): boolean {
  return isActiveSalesCountry(country);
}

export function readLegacyShippingCountry(): string {
  try {
    return normalizeShippingCountry(sessionStorage.getItem(SHIPPING_COUNTRY_KEY));
  } catch {
    return "";
  }
}

/** Keep older read-only shipping helpers compatible with the persisted destination. */
export function writeShippingCountrySession(country: string): void {
  try {
    const code = normalizeShippingCountry(country);
    if (code) sessionStorage.setItem(SHIPPING_COUNTRY_KEY, code);
    else sessionStorage.removeItem(SHIPPING_COUNTRY_KEY);
  } catch {
    // The shared in-memory state still works when browser storage is unavailable.
  }
}
