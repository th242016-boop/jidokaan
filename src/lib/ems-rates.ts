// Korea Post non-document EMS, effective 2026-07-01, checked 2026-09-30.
// https://www.koreapost.go.kr/kpost/subIndex/239.do?pSiteIdx=125
// https://ems.epost.go.kr/front.EmsDeliveryDelivery04.postal
// 410 x 310 x 150 mm, <=1.5 kg actual: volumetric 3.1775 kg -> 3.5 kg bracket.
export const EMS_POLICY = "EMS-2026-07-01-410x310x150";
// Existing store conversion basis, NOT a live foreign-exchange quotation.
export const EMS_FX_KRW_PER_USD = 1380;
export const EMS_BOX = {
  widthMm: 410,
  depthMm: 310,
  heightMm: 150,
  actualKgMax: 1.5,
  billableKg: 3.5,
};
export const EMS_RATES_KRW: Record<string, number> = {
  US: 96500,
  CA: 68500,
  AU: 67000,
  CN: 32000,
  JP: 39000,
  SG: 30000,
  TH: 30000,
  PH: 37000,
  FR: 59000,
  DE: 74000,
  GB: 72000,
  ES: 62500,
  RU: 83000,
  BR: 95500,
  // Verified EMS tariff zones (not EMS Premium zones).
  MX: 87500,
  AR: 87500,
  EG: 87500,
  AE: 69500,
  SA: 69500,
  UZ: 69500,
  TR: 69500,
  CH: 69500,
  NL: 69500,
  SE: 69500,
  IN: 44000,
};
// IT and ZA have no standard EMS tariff in the official destination table.
// They require a separate carrier quote; never fall back to an invented EMS rate.
export function emsUsd(krw: number, exchange = EMS_FX_KRW_PER_USD) {
  return Math.round((krw / exchange) * 100) / 100;
}
