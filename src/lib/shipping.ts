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
  freeKrw: number;
  freeUsd: number;
  extraPct: number;
  zones: Record<ShipZone, ZoneRate>;
};

export const DEFAULT_SHIPPING: ShippingSettings = {
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
};

export function quoteShipping(opts: {
  country: string;
  method: ShipMethod;
  subtotalKrw: number;
  subtotalUsd: number;
  qty: number;
  settings?: ShippingSettings;
}): ShipQuote {
  const s = opts.settings ?? DEFAULT_SHIPPING;
  const zone = zoneForCountry(opts.country);
  const rate = s.zones[zone];
  const pairs = Math.max(1, opts.qty);
  const extraMul = 1 + Math.max(0, pairs - 1) * (s.extraPct / 100);

  let krw = (opts.method === "express" ? rate.expressKrw : rate.standardKrw) * extraMul;
  let usd = (opts.method === "express" ? rate.expressUsd : rate.standardUsd) * extraMul;
  krw = Math.round(krw);
  usd = Math.round(usd);

  const days = opts.method === "express" ? rate.daysExpress : rate.daysStandard;

  let free = false;
  if (opts.method === "standard") {
    if (zone === "kr" && opts.subtotalKrw >= KR_LOCAL_FREE) free = true;
    if (zone !== "kr" && (opts.subtotalUsd >= s.freeUsd || opts.subtotalKrw >= s.freeKrw)) {
      free = true;
    }
  }
  if (free) {
    krw = 0;
    usd = 0;
  }

  return {
    zone,
    method: opts.method,
    krw,
    usd,
    free,
    days,
    label: opts.method === "express" ? "express" : "standard",
  };
}

export function shipCopy(locale: string) {
  const ko = locale === "ko";
  return {
    standard: ko ? "택배 (추적)" : "Tracked courier",
    express: ko ? "특급" : "Express",
    days: ko ? "배송" : "transit",
    makeDays: ko ? "제작 평균 20~30일 +" : "Handmade typically 20–30 days +",
    dutyTitle: ko ? "관세·부가세" : "Duties & tax",
    dutyBody: ko
      ? "해외 배송은 DAP입니다. 배송비는 결제 시 나오고, 도착국 관세·부가세가 있으면 수령인이 따로 냅니다. PO Box·택배 대행지는 받을 수 없습니다."
      : "We ship DAP. Shipping is paid at checkout. Import duty/VAT, if charged, is paid by the recipient. PO Boxes and freight-forwarding addresses are not accepted.",
    freeIntl: ko
      ? "해외는 DHL 또는 EMS 추적 택배로 보냅니다."
      : "International orders ship by tracked DHL or EMS.",
    freeKr: ko ? "국내는 택배로 발송합니다." : "Korea: domestic courier.",
    extra: ko
      ? "추가 켤레는 배송비의 40%만 더해집니다."
      : "Each extra pair adds 40% of the first-pair rate.",
    production: ko
      ? "주문 후 제작 상품으로 평균적으로 20~30일 정도 소요됩니다."
      : "Made-to-order items typically take about 20–30 days after you order.",
    autoShip: ko
      ? "배송 방법은 고르지 않습니다. 한국은 국내 택배, 해외는 DHL 또는 EMS 추적 택배로 보냅니다."
      : "No shipping-method choice. Korea: domestic courier. International: tracked DHL or EMS.",
  };
}
