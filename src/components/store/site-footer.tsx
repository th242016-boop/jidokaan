import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { t, type Locale } from "@/lib/i18n";
import { supportCopy } from "@/lib/customer-support-copy";
import { legalPageCopy } from "@/lib/legal-page-copy";
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

function companyLines(locale: Locale, rows: InfoRow[]): InfoRow[] {
  if (locale === "ko") return rows;
  const labels = legalPageCopy(locale).labels;
  const L = { brand: labels[0], ceo: labels[1], address: labels[2], phone: labels[3], biz: labels[4], mail: labels[5] };
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

function supportLines(locale: Locale, rows: InfoRow[]): InfoRow[] {
  if (locale === "ko") return rows;
  const copy = supportCopy(locale);
  const labels: Record<string, string> = {
    "상담 이메일": copy.email,
    "상담전화": copy.phone,
    "CS운영시간": copy.hours,
    "CS 운영시간": copy.hours,
    "토요일 및 공휴일": copy.closedLabel,
  };
  return rows.map((row) => {
    let value = row.value;
    let href = row.href;
    // Preserve merchant-edited values; translate only the known stored defaults.
    if (value === "오전 10시~오후 5시 (월~금)") value = copy.hoursValue;
    if (value === "상담불가") value = copy.closedValue;
    if (href?.startsWith("tel:")) {
      const digits = href.slice(4).replace(/[\s()-]/g, "");
      if (/^0\d{8,10}$/.test(digits)) href = `tel:+82${digits.slice(1)}`;
      if (href === "tel:+821034815598") value = "+82 10-3481-5598";
    }
    return { ...row, label: labels[row.label] || row.label, value, href };
  });
}

export function SiteFooter() {
  const locale = useStore((s) => s.locale);
  const dict = t(locale);
  const supportLabels = supportCopy(locale);
  const year = new Date().getFullYear();
  const { catalog } = useCatalog();
  const company = companyLines(
    locale,
    catalog.company.length ? catalog.company : COMPANY,
  );
  const support = supportLines(
    locale,
    catalog.support.length ? catalog.support : SUPPORT,
  );

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
            <p className="mb-3 text-sm font-semibold tracking-wide">
              {supportLabels.title}
            </p>
            <ul className="space-y-2">
              {support.map((row) => (
                <InfoLine key={row.label} {...row} />
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-4 text-sm font-semibold tracking-wide">{locale === "zh" ? "社交媒体" : locale === "zh-Hant" ? "社交媒體" : "SNS"}</p>
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
            © {year} {dict.brandEn}. {locale === "zh" || locale === "zh-Hant" ? dict.footer.rights : "All rights reserved."}
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
              {locale === "zh" || locale === "zh-Hant" ? dict.footer.faq : "FAQ"}
            </Link>
            <Link
              to="/contact"
              className="text-[11px] text-subtle/70 hover:text-muted"
            >
              {locale === "ko" ? "문의" : dict.footer.contact}
            </Link>
            <Link
              to="/admin"
              className="text-[11px] text-subtle/70 hover:text-muted"
            >
              {supportLabels.nav.admin}
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
