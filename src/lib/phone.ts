import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/max";

/** A contact may live anywhere, regardless of the available shipping countries. */
export const PHONE_COUNTRY_OPTIONS = getCountries().map((code) => ({
  code,
  dialCode: `+${getCountryCallingCode(code)}`,
}));

export const DIAL_CODES: Record<string, string> = Object.fromEntries(
  PHONE_COUNTRY_OPTIONS.map(({ code, dialCode }) => [code, dialCode]),
);

export function dialCode(country: string) {
  return DIAL_CODES[country.trim().toUpperCase()] || "";
}

export type PhoneValidation =
  | {
      valid: true;
      e164: string;
      international: string;
      nationalNumber: string;
      country: string;
      callingCode: string;
    }
  | {
      valid: false;
      e164: "";
      error: "required" | "country_required" | "invalid" | "extension_not_supported";
    };

function phoneCountryCode(value: string): CountryCode | undefined {
  const code = value.trim().toUpperCase();
  return Object.hasOwn(DIAL_CODES, code) ? (code as CountryCode) : undefined;
}

/** Normalize common full-width/Arabic numerals without guessing missing digits. */
function normalizeDigits(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[٠-٩۰-۹]/g, (digit) => String(digit.charCodeAt(0) - (digit <= "٩" ? 0x660 : 0x6f0)));
}

/**
 * phoneCountry describes the telephone numbering plan, NOT the destination.
 * An explicit international + number always takes precedence over this hint.
 * National trunk prefixes follow country metadata (Italy's significant 0 stays).
 * This validates a numbering plan, not ownership or actual reachability.
 */
export function validatePhoneNumber(input: string, phoneCountry = ""): PhoneValidation {
  const value = normalizeDigits(input.trim());
  if (!value) return { valid: false, e164: "", error: "required" };
  const defaultCountry = phoneCountryCode(phoneCountry);
  if (!value.startsWith("+") && !defaultCountry)
    return { valid: false, e164: "", error: "country_required" };
  if (value.length > 100) return { valid: false, e164: "", error: "invalid" };

  // Never extract a plausible number from free text or discard an extension.
  const parsed = parsePhoneNumberFromString(value, { defaultCountry, extract: false });
  if (parsed?.ext) return { valid: false, e164: "", error: "extension_not_supported" };
  if (
    !/^\+?[\d\s().-]+$/.test(value) ||
    !parsed?.isValid() ||
    !/^\+[1-9]\d{1,14}$/.test(parsed.number)
  )
    return { valid: false, e164: "", error: "invalid" };

  return {
    valid: true,
    e164: parsed.number,
    international: parsed.formatInternational(),
    nationalNumber: parsed.nationalNumber,
    country: parsed.country ?? "",
    callingCode: `+${parsed.countryCallingCode}`,
  };
}

/** Use for saved-number prefill; it does not consult or change shipping country. */
export function phoneCountryForNumber(input: string, fallback = "") {
  const result = validatePhoneNumber(input, fallback);
  return result.valid && result.country ? result.country : (phoneCountryCode(fallback) ?? "");
}

/** Legacy display helper. Keep foreign + numbers intact instead of corrupting them. */
export function localPhoneNumber(phone: string, phoneCountry: string) {
  const value = phone.trim();
  const result = validatePhoneNumber(value, phoneCountry);
  if (!result.valid || result.callingCode !== dialCode(phoneCountry)) return value;
  return result.nationalNumber;
}

/** Legacy display helper; new order payloads should use validatePhoneNumber().e164. */
export function fullPhoneNumber(local: string, phoneCountry: string) {
  const result = validatePhoneNumber(local, phoneCountry);
  return result.valid ? `${result.callingCode} ${result.nationalNumber}` : "";
}
