import { EMS_POLICY, EMS_RATES_KRW, EMS_FX_KRW_PER_USD, emsUsd } from "./ems-rates";
import {
  DEFAULT_SHIPPING_PRICING,
  SHIPPING_REFERENCE_FX,
  SHIPPING_PRICING_VERSION,
  shippingPrice,
  type ShippingPricing,
} from "./shipping-pricing";
import { checkoutCopy } from "./checkout-copy";
export type ShipZone = "kr" | "asia" | "pacific" | "europe" | "world";
export type ShipMethod = "standard" | "express";

export type ZoneRate = {
  standardKrw: number;
  standardUsd: number;
  expressKrw: number;
  expressUsd: number;
  daysStandard: string;
  daysExpress: string;
};

export type ShippingSettings = {
  policyVersion?: string;
  exchangeKrwPerUsd?: number;
  pricing?: ShippingPricing;
  freeKrw: number;
  freeUsd: number;
  extraPct: number;
  zones: Record<ShipZone, ZoneRate>;
  countryRates?: Record<string, { usd: number; krw?: number; note?: string; minimumUsd?: number }>;
};

const LEGACY_SHIPPING: ShippingSettings = {
  freeKrw: 288000,
  freeUsd: 230,
  extraPct: 40,
  zones: {
    kr: {
      standardKrw: 3000,
      standardUsd: 3,
      expressKrw: 5000,
      expressUsd: 5,
      daysStandard: "1–2",
      daysExpress: "하루",
    },
    asia: {
      standardKrw: 25000,
      standardUsd: 18,
      expressKrw: 44000,
      expressUsd: 32,
      daysStandard: "4–8",
      daysExpress: "2–4",
    },
    pacific: {
      standardKrw: 38000,
      standardUsd: 28,
      expressKrw: 66000,
      expressUsd: 48,
      daysStandard: "6–12",
      daysExpress: "3–5",
    },
    europe: {
      standardKrw: 44000,
      standardUsd: 32,
      expressKrw: 72000,
      expressUsd: 52,
      daysStandard: "6–12",
      daysExpress: "3–5",
    },
    world: {
      standardKrw: 52000,
      standardUsd: 38,
      expressKrw: 80000,
      expressUsd: 58,
      daysStandard: "8–16",
      daysExpress: "4–7",
    },
  },
};

/** Apply the owner-approved EMS policy to old settings without mutating old orders. */
export function applyEmsPolicy(settings: ShippingSettings): ShippingSettings {
  let next = settings;
  if (next.policyVersion !== EMS_POLICY) {
    next = {
      ...next,
      policyVersion: EMS_POLICY,
      exchangeKrwPerUsd: EMS_FX_KRW_PER_USD,
      extraPct: 100,
      countryRates: Object.fromEntries(
        Object.entries(EMS_RATES_KRW).map(([code, krw]) => [
          code,
          {
            usd: emsUsd(krw),
            krw,
            note: `우체국 EMS · 410×310×150mm · 3.5kg 구간 · ${krw.toLocaleString("en-US")}원 · 2026-07-01 시행`,
          },
        ]),
      ),
    };
  }
  if (next.pricing?.version !== SHIPPING_PRICING_VERSION) {
    const previousFx = next.exchangeKrwPerUsd ?? EMS_FX_KRW_PER_USD;
    next = {
      ...next,
      exchangeKrwPerUsd: SHIPPING_REFERENCE_FX,
      pricing: { ...DEFAULT_SHIPPING_PRICING },
      countryRates: Object.fromEntries(
        Object.entries(next.countryRates ?? {}).map(([code, rate]) => {
          const krw = rate.krw ?? EMS_RATES_KRW[code];
          const manuallySet = krw != null && Math.abs(rate.usd - emsUsd(krw, previousFx)) > 0.005;
          return [
            code,
            { ...rate, krw, minimumUsd: rate.minimumUsd ?? (manuallySet ? rate.usd : undefined) },
          ];
        }),
      ),
    };
  }
  // Recalculate on every settings read/quote. Changing FX cannot leave stale USD rates.
  return {
    ...next,
    countryRates: Object.fromEntries(
      Object.entries(next.countryRates ?? {}).map(([code, rate]) => [
        code,
        rate.krw == null
          ? rate
          : {
              ...rate,
              usd: Math.max(
                rate.minimumUsd ?? 0,
                shippingPrice(rate.krw, next.exchangeKrwPerUsd!, next.pricing!).usd,
              ),
            },
      ]),
    ),
  };
}
export const DEFAULT_SHIPPING = applyEmsPolicy(LEGACY_SHIPPING);

/** Korea local free-ship threshold (accessories). Custom pair uses freeKrw. */
export const KR_LOCAL_FREE = 50000;

const ZONE_COUNTRIES: Record<ShipZone, string[]> = {
  kr: ["KR"],
  asia: ["JP", "CN", "SG", "TH", "PH"],
  pacific: ["US", "CA", "MX", "AU"],
  europe: ["FR", "ES", "GB", "DE", "IT", "CH", "NL", "SE"],
  world: [],
};

export function zoneForCountry(code: string): ShipZone {
  const c = code.toUpperCase();
  for (const [zone, list] of Object.entries(ZONE_COUNTRIES) as [ShipZone, string[]][]) {
    if (list.includes(c)) return zone;
  }
  return "world";
}

export function zoneLabel(zone: ShipZone, ko: boolean): string {
  const map: Record<ShipZone, [string, string]> = {
    kr: ["대한민국", "South Korea"],
    asia: ["아시아 (일본·중국·태국·필리핀·싱가포르)", "Asia (JP, CN, TH, PH, SG)"],
    pacific: ["미주·오세아니아 (미국·캐나다·멕시코·호주)", "US, Canada, Mexico, Australia"],
    europe: ["유럽 (영·프·독·이·스·스위스 등)", "Europe (UK, FR, DE, IT, ES, CH…)"],
    world: ["그 외 국가 (중동·남미·아프리카·인도 등)", "Rest of world"],
  };
  return ko ? map[zone][0] : map[zone][1];
}

export type ShipQuote = {
  zone: ShipZone;
  method: ShipMethod;
  krw: number;
  usd: number;
  free: boolean;
  days: string;
  label: string;
  available: boolean;
};

export function quoteShipping(opts: {
  country: string;
  method: ShipMethod;
  subtotalKrw: number;
  subtotalUsd: number;
  qty: number;
  settings?: ShippingSettings;
}): ShipQuote {
  const s = applyEmsPolicy(opts.settings ?? DEFAULT_SHIPPING);
  const zone = zoneForCountry(opts.country);
  const rate = s.zones[zone];
  const pairs = Math.max(1, opts.qty);
  const extraMul = 1 + Math.max(0, pairs - 1) * (s.extraPct / 100);

  let krw = (opts.method === "express" ? rate.expressKrw : rate.standardKrw) * extraMul;
  let usd = (opts.method === "express" ? rate.expressUsd : rate.standardUsd) * extraMul;
  const countryRate = s.countryRates?.[opts.country.toUpperCase()];
  if (
    opts.method === "standard" &&
    countryRate &&
    Number.isFinite(countryRate.usd) &&
    countryRate.usd >= 0
  )
    usd = countryRate.usd * extraMul;
  const available = zone === "kr" || Boolean(countryRate);
  if (zone !== "kr") {
    // One unchanged box per pair, not a fictitious combined-box discount.
    usd = countryRate ? countryRate.usd * pairs : 0;
    krw = countryRate
      ? (countryRate.krw ??
          Math.round(countryRate.usd * (s.exchangeKrwPerUsd ?? EMS_FX_KRW_PER_USD))) * pairs
      : 0;
  }
  krw = Math.round(krw);
  usd = Math.round(usd * 100) / 100;

  const days = opts.method === "express" ? rate.daysExpress : rate.daysStandard;

  let free = false;
  if (opts.method === "standard" && zone === "kr" && opts.subtotalKrw >= KR_LOCAL_FREE) {
    free = true;
  }
  if (free) {
    krw = 0;
    usd = 0;
  }

  return {
    zone,
    available,
    method: opts.method,
    krw,
    usd,
    free,
    days,
    label: opts.method === "express" ? "express" : "standard",
  };
}

export function shipCopy(locale: string, country?: string) {
  const copy = checkoutCopy(locale);
  const ko = locale === "ko";
  return {
    standard: ko ? "택배 (추적)" : "Tracked courier",
    express: ko ? "특급" : "Express",
    days: ko ? "배송" : "transit",
    makeDays: ko ? "제작 평균 20~30일 +" : "Handmade typically 20–30 days +",
    dutyTitle: ko ? "관세·부가세" : "Duties & tax",
    dutyBody: country === "US" ? copy.usDuty : copy.duty,
    freeIntl: copy.shipping,
    freeKr: ko ? "국내는 택배로 발송합니다." : "Korea: domestic courier.",
    extra: copy.shipping,
    production: copy.production,
    autoShip: ko
      ? "한국은 국내 택배, 해외는 우체국 EMS로 발송합니다."
      : "Korea: domestic courier. International: Korea Post EMS.",
  };
}
