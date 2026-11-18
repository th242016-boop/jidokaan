import { ADDRESS_REGIONS } from "./address-validation";

export const CHECKOUT_DRAFT_KEY = "jidokaan-checkout-draft-v1";
export const LEGACY_CHECKOUT_PROFILE_KEY = "jidokaan-checkout-profile";

/** Contact/address drafts belong to this tab. Payment credentials and consent are never saved. */
export type CheckoutDraft = Partial<Record<
  "instagram" | "email" | "firstName" | "lastName" | "phone" | "phoneCountry" |
  "address" | "address2" | "city" | "region" | "postal" | "country" | "depositor", string
>> & { contactMethod?: "instagram" | "email" };

const fields = [
  "instagram", "email", "firstName", "lastName", "phone", "phoneCountry",
  "address", "address2", "city", "region", "postal", "country", "depositor",
] as const;

export function normalizeCheckoutRegion(country: string, value: string): string {
  const normalized = value.trim().toLowerCase();
  const match = Object.entries(ADDRESS_REGIONS[country.trim().toUpperCase()] ?? {})
    .find(([code, name]) => code.toLowerCase() === normalized || name.toLowerCase() === normalized);
  return match?.[0] ?? value;
}

function draftFields(value: unknown, country: string): CheckoutDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const draft: CheckoutDraft = {};
  for (const field of fields) if (typeof raw[field] === "string") draft[field] = raw[field];
  if (raw.contactMethod === "instagram" || raw.contactMethod === "email") draft.contactMethod = raw.contactMethod;
  if (draft.region !== undefined) draft.region = normalizeCheckoutRegion(country, draft.region);
  return draft;
}

type Reader = Pick<Storage, "getItem">;
type Writer = Pick<Storage, "setItem">;

function readDraft(storage: Reader, key: string, country: string): CheckoutDraft | null {
  try {
    const raw = storage.getItem(key);
    return raw ? draftFields(JSON.parse(raw), country) : null;
  } catch {
    return null;
  }
}

export function readCheckoutDraft(storage: Reader, country: string): CheckoutDraft | null {
  return readDraft(storage, CHECKOUT_DRAFT_KEY, country);
}

/** Read older completed-checkout profiles once as a fallback; new drafts never write localStorage. */
export function readLegacyCheckoutProfile(storage: Reader, country: string): CheckoutDraft | null {
  return readDraft(storage, LEGACY_CHECKOUT_PROFILE_KEY, country);
}

export function writeCheckoutDraft(storage: Writer, draft: CheckoutDraft): void {
  try {
    storage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draftFields(draft, draft.country ?? "") ?? {}));
  } catch {
    // Checkout remains usable when storage is unavailable or full.
  }
}

export function clearCheckoutDraft(storage: Pick<Storage, "removeItem">): void {
  try { storage.removeItem(CHECKOUT_DRAFT_KEY); } catch { /* Storage may be unavailable. */ }
}
