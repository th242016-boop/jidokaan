import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronLeft, ExternalLink, LogOut, Search } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

export type AdminPageId =
  | "home"
  | "list"
  | "register"
  | "categories"
  | "orders"
  | "claims"
  | "shipstatus"
  | "delay"
  | "settle"
  | "inbox"
  | "reviews"
  | "shipping"
  | "notice"
  | "company"
  | "seo"
  | "pay"
  | "password"
  | "coupons"
  | "analytics"
  | "customers"
  | "faq"
  | "blacklist"
  | "sales"
  | "guide";

type NavItem = { id: AdminPageId; label: string };
type NavGroup = { title: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    title: "상품관리",
    items: [
      { id: "list", label: "상품목록" },
      { id: "register", label: "상품등록" },
      { id: "categories", label: "분류관리" },
    ],
  },
  {
    title: "판매관리",
    items: [
      { id: "orders", label: "주문조회" },
      { id: "shipstatus", label: "배송현황관리" },
      { id: "claims", label: "취소·반품·교환" },
      { id: "delay", label: "발송지연" },
      { id: "blacklist", label: "판매방해 고객" },
    ],
  },
  {
    title: "정산관리",
    items: [{ id: "settle", label: "정산 내역" }],
  },
  {
    title: "문의/리뷰관리",
    items: [
      { id: "inbox", label: "문의관리" },
      { id: "reviews", label: "리뷰관리" },
      { id: "faq", label: "FAQ" },
    ],
  },
  {
    title: "스토어관리",
    items: [
      { id: "company", label: "회사정보" },
      { id: "shipping", label: "배송비" },
      { id: "notice", label: "공지사항" },
      { id: "seo", label: "검색엔진(SEO)" },
      { id: "pay", label: "계좌·결제" },
      { id: "password", label: "비밀번호" },
    ],
  },
  {
    title: "혜택/마케팅",
    items: [{ id: "coupons", label: "혜택등록" }],
  },
  {
    title: "데이터분석",
    items: [
      { id: "sales", label: "판매분석" },
      { id: "analytics", label: "유입·키워드" },
      { id: "customers", label: "회원목록" },
    ],
  },
  {
    title: "도움말",
    items: [{ id: "guide", label: "사용설명서" }],
  },
];

const ALL = GROUPS.flatMap((g) => g.items);

export function pageLabel(page: AdminPageId) {
  if (page === "home") return "홈";
  return ALL.find((n) => n.id === page)?.label ?? "관리자";
}

export function pageGroup(page: AdminPageId) {
  return GROUPS.find((g) => g.items.some((i) => i.id === page))?.title;
}

export function isAdminPage(id: string): id is AdminPageId {
  return id === "home" || ALL.some((i) => i.id === id);
}

function groupOpenFor(page: AdminPageId) {
  return GROUPS.find((g) => g.items.some((i) => i.id === page))?.title ?? "상품관리";
}

export function AdminShell({
  page,
  editing,
  onPage,
  onBack,
  onLogout,
  children,
}: {
  page: AdminPageId;
  editing?: boolean;
  onPage: (id: AdminPageId) => void;
  onBack: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(groupOpenFor(page));
  const [q, setQ] = useState("");
  const title = editing ? "상품 수정" : pageLabel(page);
  const group = pageGroup(editing ? "register" : page);
  const filtered = useMemo(() => {
    const s = q.trim();
    if (!s) return [];
    return ALL.filter((i) => i.label.includes(s));
  }, [q]);

  useEffect(() => {
    setOpen(groupOpenFor(editing ? "register" : page));
  }, [page, editing]);

  return (
    <div className="admin-ui flex min-h-dvh flex-col bg-[#f4f6f8] text-[#222]">
      <header className="flex h-12 shrink-0 items-center justify-between bg-[#1f2937] px-4 text-white">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => onPage("home")} className="text-sm font-bold tracking-tight">
            지도칸 스토어센터
          </button>
          <span className="hidden text-xs text-white/50 sm:inline">판매 · 주문 · 상품 · 문의</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <Link to="/" className="inline-flex items-center gap-1 text-white/75 hover:text-white">
            쇼핑몰 보기 <ExternalLink className="size-3" />
          </Link>
          <button type="button" onClick={onLogout} className="inline-flex items-center gap-1 text-white/75 hover:text-white">
            <LogOut className="size-3" /> 로그아웃
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[220px] shrink-0 flex-col bg-[#2b3340] text-white md:flex">
          <button
            type="button"
            onClick={() => onPage("home")}
            className="border-b border-white/10 px-4 py-4 text-left"
          >
            <BrandLogo variant="full" tone="dark" className="h-7" imgClassName="h-7 w-auto brightness-0 invert" />
            <p className="mt-2 text-[11px] text-white/50">계정 주매니저</p>
          </button>
          <div className="border-b border-white/10 px-3 py-2">
            <label className="flex items-center gap-2 rounded bg-black/25 px-2 py-1.5 text-xs text-white/70">
              <Search className="size-3.5 shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="메뉴 검색"
                className="w-full bg-transparent text-white outline-none placeholder:text-white/40"
              />
            </label>
            {filtered.length > 0 ? (
              <div className="mt-1 rounded bg-[#1f2630] py-1">
                {filtered.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => {
                      onPage(i.id);
                      setQ("");
                    }}
                    className="block w-full px-3 py-1.5 text-left text-xs hover:bg-white/10"
                  >
                    {i.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            {GROUPS.map((group) => {
              const isOpen = open === group.title;
              const active = group.items.some((i) => i.id === page);
              return (
                <div key={group.title} className="mb-0.5">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? "" : group.title)}
                    className={cn(
                      "flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px]",
                      active ? "text-white" : "text-white/80 hover:bg-white/5",
                    )}
                  >
                    {group.title}
                    <ChevronDown className={cn("size-3.5 opacity-60 transition", isOpen && "rotate-180")} />
                  </button>
                  {isOpen ? (
                    <div className="bg-black/15 pb-1">
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onPage(item.id)}
                          className={cn(
                            "flex w-full items-center px-6 py-2 text-left text-[13px]",
                            page === item.id
                              ? "bg-[#00c73c] font-semibold text-white"
                              : "text-white/75 hover:bg-white/10",
                          )}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-[#e3e6ea] bg-white px-4 py-3">
            {page !== "home" || editing ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex h-9 items-center gap-1 rounded border border-[#d5d7dc] bg-white px-3 text-sm font-semibold hover:bg-[#f6f7f8]"
              >
                <ChevronLeft className="size-4" />
                뒤로
              </button>
            ) : null}
            <div className="min-w-0">
              <p className="text-[11px] text-[#888]">
                <button type="button" className="hover:underline" onClick={() => onPage("home")}>
                  홈
                </button>
                {group ? (
                  <>
                    <span className="px-1">/</span>
                    {group}
                  </>
                ) : null}
                {page !== "home" || editing ? (
                  <>
                    <span className="px-1">/</span>
                    {title}
                  </>
                ) : null}
              </p>
              <h1 className="text-base font-semibold">{title}</h1>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto border-b border-[#e3e6ea] bg-white px-3 py-2 md:hidden">
            {ALL.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onPage(item.id)}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  page === item.id ? "bg-[#00c73c] text-white" : "bg-[#eef1f4] text-[#333]",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <main className="flex-1 px-3 py-4 sm:px-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
