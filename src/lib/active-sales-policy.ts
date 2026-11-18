/** New-sale availability only. Never use this list to hide existing orders or rate history. */
export const ACTIVE_SALES_POLICY_VERSION = "2026-11-16-sales-v3";
export const ACTIVE_SALES_COUNTRIES = [
  "KR", "US", "CA", "AU", "HK", "JP", "SG", "TH", "PH", "GB", "CH", "MX",
] as const;
const active = new Set<string>(ACTIVE_SALES_COUNTRIES);
export const EXCLUDED_SALES_COUNTRIES = [
  "EG", "SA", "TR", "IN", "DE", "NL", "SE", "BR", "AR", "RU", "UZ", "AE", "FR", "ES", "CN",
] as const;

export function isActiveSalesCountry(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) && active.has(code);
}

/** Historical country catalogs stay intact; customer purchase controls use this filter. */
export function activeSalesCountries<T extends { code: string }>(countries: readonly T[]): T[] {
  return countries.filter((country) => isActiveSalesCountry(country.code));
}
