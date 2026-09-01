import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { t, type Locale } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";
import type { InfoRow } from "@/lib/site-defaults";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M23 12.2s0-3.2-.4-4.6c-.2-.8-.9-1.5-1.7-1.7C19.4 5.5 12 5.5 12 5.5s-7.4 0-8.9.4c-.8.2-1.5.9-1.7 1.7C1 9 1 12.2 1 12.2s0 3.2.4 4.6c.2.8.9 1.5 1.7 1.7 1.5.4 8.9.4 8.9.4s7.4 0 8.9-.4c.8-.2 1.5-.9 1.7-1.7.4-1.4.4-4.6.4-4.6zM9.8 15.5v-6.6l6.2 3.3-6.2 3.3z" />
    </svg>
  );
}

function InfoLine({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[13px] leading-relaxed sm:text-sm">
      <span className="font-semibold text-fg">{label}</span>
      {href ? (
        <a href={href} className="text-muted transition hover:text-fg">
          {value}
        </a>
      ) : (
        <span className="text-muted">{value}</span>
      )}
    </li>
  );
}

const COMPANY_LABELS: Record<
  Locale,
  { brand: string; ceo: string; address: string; phone: string; biz: string; mail: string }
> = {
  ko: {
    brand: "상호명",
    ceo: "대표자명",
    address: "사업장 주소",
    phone: "대표전화",
    biz: "사업자 등록번호",
    mail: "통신판매업 신고번호",
  },
  en: {
    brand: "Brand",
    ceo: "CEO",
    address: "Address",
    phone: "Phone",
    biz: "Business Reg. No.",
    mail: "Mail-order report",
  },
  ja: {
    brand: "商号",
    ceo: "代表者",
    address: "住所",
    phone: "電話",
    biz: "事業者登録番号",
    mail: "通信販売業届出番号",
  },
  es: {
    brand: "Marca",
    ceo: "CEO",
    address: "Dirección",
    phone: "Teléfono",
    biz: "Business Reg. No.",
    mail: "Mail-order report",
  },
  th: {
    brand: "แบรนด์",
    ceo: "CEO",
    address: "ที่อยู่",
    phone: "โทร",
    biz: "Business Reg. No.",
    mail: "Mail-order report",
  },
  fr: {
    brand: "Marque",
    ceo: "CEO",
    address: "Adresse",
    phone: "Téléphone",
    biz: "Business Reg. No.",
    mail: "Mail-order report",
  },
  de: {
    brand: "Marke",
    ceo: "CEO",
    address: "Adresse",
    phone: "Telefon",
    biz: "Business Reg. No.",
    mail: "Mail-order report",
  },
  ar: {
    brand: "العلامة",
    ceo: "CEO",
    address: "العنوان",
    phone: "الهاتف",
    biz: "Business Reg. No.",
    mail: "Mail-order report",
  },
  ru: {
    brand: "Бренд",
    ceo: "CEO",
    address: "Адрес",
    phone: "Телефон",
    biz: "Business Reg. No.",
    mail: "Mail-order report",
  },
  it: {
    brand: "Marchio",
    ceo: "CEO",
    address: "Indirizzo",
    phone: "Telefono",
    biz: "Business Reg. No.",
    mail: "Mail-order report",
  },
  pt: {
    brand: "Marca",
    ceo: "CEO",
    address: "Endereço",
    phone: "Telefone",
    biz: "Business Reg. No.",
    mail: "Mail-order report",
  },
  tr: {
    brand: "Marka",
    ceo: "CEO",
    address: "Adres",
    phone: "Telefon",
    biz: "Business Reg. No.",
    mail: "Mail-order report",
  },
  uz: {
    brand: "Brend",
    ceo: "CEO",
    address: "Manzil",
    phone: "Telefon",
    biz: "Business Reg. No.",
    mail: "Mail-order report",
  },
  zh: {
    brand: "品牌",
    ceo: "代表人",
    address: "地址",
    phone: "电话",
    biz: "Business Reg. No.",
    mail: "Mail-order report",
  },
  hi: {
    brand: "ब्रांड",
    ceo: "CEO",
    address: "पता",
    phone: "फ़ोन",
    biz: "Business Reg. No.",
    mail: "Mail-order report",
  },
  tl: {
    brand: "Brand",
    ceo: "CEO",
    address: "Address",
    phone: "Phone",
    biz: "Business Reg. No.",
    mail: "Mail-order report",
  },
};

function companyLines(locale: Locale, rows: InfoRow[]): InfoRow[] {
  if (locale === "ko") return rows;
  const L = COMPANY_LABELS[locale] ?? COMPANY_LABELS.en;
  return [
    { label: L.brand, value: "JIDOKAAN" },
    { label: L.ceo, value: "Taehoon Choi (최태훈)" },
    {
      label: L.address,
      value: "36, Seongsuil-ro 18-gil, Seongdong-gu, Seoul, Republic of Korea",
    },
    { label: L.phone, value: "+82 10-3481-5598", href: "tel:+821034815598" },
    { label: L.biz, value: "207-18-73695" },
    { label: L.mail, value: "2018-서울성동-0927" },
  ];
}

const COMPANY = [
  { label: "상호명", value: "지도칸" },
  { label: "대표자명", value: "최태훈" },
  { label: "사업장 주소", value: "04782 서울특별시 성동구 성수이로18길 36 주동2층" },
  { label: "대표전화", value: "010 3481 5598", href: "tel:01034815598" },
  { label: "사업자 등록번호", value: "207 18 73695" },
  { label: "통신판매업 신고번호", value: "2018서울성동0927호" },
];

const SUPPORT = [
  { label: "상담 이메일", value: "th242016@naver.com", href: "mailto:th242016@naver.com" },
  { label: "상담전화", value: "010 3481 5598", href: "tel:01034815598" },
  { label: "CS운영시간", value: "오전 10시~오후 5시 (월~금)" },
  { label: "토요일 및 공휴일", value: "상담불가" },
];

export function SiteFooter() {
  const locale = useStore((s) => s.locale);
  const dict = t(locale);
  const year = new Date().getFullYear();
  const { catalog } = useCatalog();
  const company = companyLines(
    locale,
    catalog.company.length ? catalog.company : COMPANY,
  );
  const support = catalog.support.length ? catalog.support : SUPPORT;

  return (
    <footer className="mt-auto border-t border-white/[0.05] bg-black">
      <div className="container-page grid gap-12 py-14 md:grid-cols-2">
        <div className="space-y-5">
          <BrandLogo
            variant="full"
            tone="dark"
            className="h-10"
            imgClassName="h-10 w-auto max-w-[180px]"
          />
          <ul className="space-y-2">
            {company.map((row) => (
              <InfoLine key={row.label} {...row} />
            ))}
          </ul>
        </div>

        <div className="space-y-8 md:justify-self-end md:text-left">
          <div>
            <p className="mb-3 text-sm font-semibold tracking-wide">상담</p>
            <ul className="space-y-2">
              {support.map((row) => (
                <InfoLine key={row.label} {...row} />
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-4 text-sm font-semibold tracking-wide">SNS</p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/jidokaan"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-fg transition hover:bg-white/[0.08]"
              >
                <InstagramIcon className="size-5" />
              </a>
              <a
                href="https://www.youtube.com/@JIDOKAAN"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-fg transition hover:bg-white/[0.08]"
              >
                <YoutubeIcon className="size-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/[0.05]">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 sm:flex-row">
          <p className="text-xs text-subtle">
            © {year} {dict.brandEn}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="/orders"
              className="text-[11px] text-subtle/70 hover:text-muted"
            >
              {dict.nav.orders}
            </Link>
            <Link
              to="/faq"
              className="text-[11px] text-subtle/70 hover:text-muted"
            >
              FAQ
            </Link>
            <Link
              to="/contact"
              className="text-[11px] text-subtle/70 hover:text-muted"
            >
              문의
            </Link>
            <Link
              to="/admin"
              className="text-[11px] text-subtle/70 hover:text-muted"
            >
              관리자
            </Link>
            <BrandLogo
              variant="word"
              tone="dark"
              className="h-3.5 opacity-50"
              imgClassName="h-3.5 w-auto max-w-[120px]"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
