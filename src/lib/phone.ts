export const DIAL_CODES: Record<string, string> = {
  KR: "+82",
  JP: "+81",
  US: "+1",
  CA: "+1",
  MX: "+52",
  AU: "+61",
  AE: "+971",
  TH: "+66",
  FR: "+33",
  ES: "+34",
  GB: "+44",
  DE: "+49",
  PH: "+63",
  RU: "+7",
  UZ: "+998",
  IT: "+39",
  TR: "+90",
  SA: "+966",
  BR: "+55",
  AR: "+54",
  CH: "+41",
  CN: "+86",
  IN: "+91",
  ZA: "+27",
  EG: "+20",
  SG: "+65",
  NL: "+31",
  SE: "+46",
};

export function dialCode(country: string) {
  return DIAL_CODES[country.toUpperCase()] || "";
}

export function localPhoneNumber(phone: string, country: string) {
  let s = phone.trim();
  if (!s) return "";
  const dial = dialCode(country);
  const dialDigits = dial.replace(/\D/g, "");
  if (dial && (s.startsWith(`${dial} `) || s.startsWith(dial))) {
    s = s.slice(s.startsWith(`${dial} `) ? dial.length + 1 : dial.length);
  } else if (s.startsWith("+") && dialDigits) {
    const rest = s.slice(1).replace(/[^\d]/g, "");
    if (rest.startsWith(dialDigits)) s = rest.slice(dialDigits.length);
  }
  return s.replace(/^[\s-]+/, "");
}

export function fullPhoneNumber(local: string, country: string) {
  const dial = dialCode(country);
  const part = local.trim();
  if (!dial) return part;
  if (!part) return dial;
  return `${dial} ${part}`;
}
