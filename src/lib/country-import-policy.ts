import { checkoutEnhancementsCopy, type CheckoutEnhancementsCopy } from "./checkout-enhancements-copy";
import { countryImportExtraCopy } from "./country-import-extra-copy";
import { isActiveSalesCountry } from "./active-sales-policy";
/** Review policy, not a customs clearance approval. Sales remain merchandise at actual value. */
export const IMPORT_POLICY_VERSION = "2026-11-14-review-v7";
type NoticeKey = keyof Pick<CheckoutEnhancementsCopy, "usDuty" | "mexico" | "egypt" | "saudi" | "china" | "brazil" | "india" | "europePrepay" | "turkey" | "paymentReview" | "argentina" | "general">;
export type CountryImportPolicy = {
  country: string;
  /** Retained for existing callers. Use countryImportNotice for JP/HK-specific text. */
  notice: NoticeKey;
  consultationRequired: boolean;
  salesAvailable: boolean;
  source: string;
  sources: string[];
  checkedAt: string;
};
const policies: Record<string, {notice: NoticeKey; hold: boolean; footwearOnly?: boolean}> = {
  US: {notice:"usDuty",hold:false},
  // The merchant handles Mexico's dispatch-document checks in the private
  // administrator reminder. Customer checkout uses normal goods + freight.
  MX:{notice:"general",hold:false},
  EG:{notice:"egypt",hold:true,footwearOnly:true},
  SA:{notice:"saudi",hold:true,footwearOnly:true},
  CN:{notice:"china",hold:false}, BR:{notice:"brazil",hold:true}, IN:{notice:"india",hold:true},
  DE:{notice:"europePrepay",hold:true}, NL:{notice:"europePrepay",hold:true}, SE:{notice:"europePrepay",hold:true},
  TR:{notice:"turkey",hold:true}, RU:{notice:"paymentReview",hold:true}, UZ:{notice:"paymentReview",hold:true}, AR:{notice:"argentina",hold:true},
};
const EUROPE_B2C = "https://ems.epost.go.kr/front.EmsNewsDetail.postal?db=notice&seq=1408";
const EUROPE_COUNTER = "https://ems.epost.go.kr/front.EmsNewsDetail.postal?db=notice&seq=1402";
const EU_GPSR_GUIDANCE = "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX%3A52025XC06233";
const EU_GPSR_REGULATION = "https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=oj%3AJOL_2023_135_R_0001";
const officialSources: Record<string, readonly string[]> = {
  US: [
    "https://ems.epost.go.kr/front.EmsNewsDetail.postal?db=notice&seq=1343",
    "https://ems.epost.go.kr/front.EmsNewsDetail.postal?db=notice&seq=1412",
  ],
  BR: ["https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/remessas-postal-e-expressa/manual-de-encomendas-internacionais"],
  IN: ["https://www.bis.gov.in/product-certification/products-under-compulsory-certification/scheme-1/?lang=en"],
  FR: [EU_GPSR_GUIDANCE, EU_GPSR_REGULATION],
  ES: [EU_GPSR_GUIDANCE, EU_GPSR_REGULATION],
  // Ordinary counter service differs from contract B2C: DE > EUR45 needs
  // Premium; NL/SE counter service remains DDU. EU seller readiness is separate.
  DE: [EUROPE_COUNTER, EUROPE_B2C, EU_GPSR_GUIDANCE],
  NL: [EUROPE_COUNTER, EUROPE_B2C, EU_GPSR_GUIDANCE],
  SE: [EUROPE_COUNTER, EUROPE_B2C, EU_GPSR_GUIDANCE],
  TR: ["https://www.ticaret.gov.tr/gumruk-islemleri/sikca-sorulan-sorular/bireysel/posta-ve-hizli-kargo-muafiyeti"],
  AR: ["https://www.argentina.gob.ar/node/508897"],
  JP: ["https://www.customs.go.jp/english/c-answer_e/imtsukan/1006_e.htm"],
  HK: ["https://www.customs.gov.hk/en/service-enforcement-information/cargo-clearance/"],
};

export function countryImportPolicy(country: string, containsFootwear = true): CountryImportPolicy {
  const code = country.trim().toUpperCase();
  const candidate = policies[code];
  // Removing this footwear-specific hold does not approve other goods or bypass
  // the separate accessory/mixed-parcel quote and payment checks.
  const policy = candidate?.footwearOnly && !containsFootwear ? undefined : candidate;
  const emsSource = `https://ems.epost.go.kr/front.EmsApplyGoCondition.postal?nation=${encodeURIComponent(code)}`;
  const additionalSources = code === "JP" && !containsFootwear ? [] : (officialSources[code] ?? []);
  const sources = [...additionalSources, emsSource];
  return {
    country: code,
    notice: policy?.notice ?? "general",
    consultationRequired: isActiveSalesCountry(code) && (policy?.hold ?? false),
    salesAvailable: isActiveSalesCountry(code),
    source: sources[0],
    sources,
    checkedAt: "2026-11-14",
  };
}

/** Localized policy text, including destination notes outside the legacy notice keys. */
export function countryImportNotice(country: string, locale: string, containsFootwear = true): string {
  const policy = countryImportPolicy(country, containsFootwear);
  const { copy, locale: supportedLocale } = countryImportExtraCopy(locale);
  if (policy.country && !policy.salesAvailable) return checkoutEnhancementsCopy(supportedLocale).salesUnavailable;
  if (policy.country === "JP" && containsFootwear) return copy.japan;
  if (policy.country === "HK") return copy.hongKong;
  return checkoutEnhancementsCopy(supportedLocale)[policy.notice];
}
