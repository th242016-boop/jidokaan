/** Destinations without a postal-code system; never invent a placeholder postcode. */
export function requiresPostalCode(country: string): boolean {
  return !["AE", "HK"].includes(country.trim().toUpperCase());
}
