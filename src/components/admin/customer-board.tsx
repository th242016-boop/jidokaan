import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, RefreshCw, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StoreOrder } from "@/lib/order-types";

import type {
  StoreMember as Member,
  MemberListResponse as MemberResult,
} from "@/lib/customer-types";

type Filters = {
  q: string;
  searchField: string;
  provider: string;
  device: string;
  source: string;
  from: string;
  to: string;
};

const EMPTY_FILTERS: Filters = {
  q: "",
  searchField: "all",
  provider: "",
  device: "",
  source: "",
  from: "",
  to: "",
};
const SELECT_CLASS =
  "h-10 w-full rounded-md border border-[#d5d7dc] bg-white px-3 text-sm text-[#222] outline-none focus:border-[#687587] focus:ring-2 focus:ring-[#e4e8ef]";
const DEVICE_LABELS: Record<string, string> = {
  pc: "PC",
  mobile: "모바일",
  tablet: "태블릿",
  unknown: "확인 불가",
};

function sourceLabel(source: string) {
  const value = source.toLowerCase();
  if (value === "direct") return "직접 방문 / 출처 없음";
  if (value === "ig" || value === "instagram" || /(^|\.)instagram\.com$/.test(value))
    return "인스타그램";
  if (value === "naver" || /(^|\.)naver\.com$/.test(value)) return "네이버";
  if (value === "google" || /(^|\.)google\.[a-z.]+$/.test(value)) return "구글";
  if (value === "youtube" || /(^|\.)youtube\.com$/.test(value)) return "유튜브";
  if (value === "facebook" || value === "fb" || /(^|\.)facebook\.com$/.test(value))
    return "페이스북";
  if (value === "tiktok" || /(^|\.)tiktok\.com$/.test(value)) return "틱톡";
  return source || "기록 없음";
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-2">
      <span className="text-xs font-medium text-[#59616d]">{label}</span>
      {children}
    </label>
  );
}

function Pagination({
  page,
  totalPages,
  onPage,
  disabled = false,
  label = "회원 목록 페이지",
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  disabled?: boolean;
  label?: string;
}) {
  const max = Math.max(1, totalPages);
  const start = Math.max(1, Math.min(page - 2, max - 4));
  const pages = Array.from({ length: Math.min(5, max) }, (_, i) => start + i);
  return (
    <nav aria-label={label} className="flex flex-wrap items-center justify-center gap-1.5">
      <Button
        size="sm"
        variant="outline"
        disabled={disabled || page <= 1}
        onClick={() => onPage(1)}
      >
        처음
      </Button>
      <Button
        size="sm"
        variant="outline"
        aria-label="이전 페이지"
        disabled={disabled || page <= 1}
        onClick={() => onPage(page - 1)}
      >
        <ChevronLeft size={16} />
      </Button>
      {pages.map((n) => (
        <Button
          key={n}
          size="sm"
          variant={n === page ? "default" : "outline"}
          aria-current={n === page ? "page" : undefined}
          disabled={disabled}
          onClick={() => onPage(n)}
        >
          {n}
        </Button>
      ))}
      <Button
        size="sm"
        variant="outline"
        aria-label="다음 페이지"
        disabled={disabled || page >= max}
        onClick={() => onPage(page + 1)}
      >
        <ChevronRight size={16} />
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled || page >= max}
        onClick={() => onPage(max)}
      >
        마지막
      </Button>
    </nav>
  );
}

export function CustomerBoard({ token }: { token: string }) {
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<MemberResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [validation, setValidation] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setExpandedId(null);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
    void fetch(`/api/members?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            response.status === 401
              ? "관리자 로그인이 만료되었습니다. 다시 로그인해 주세요."
              : "회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          );
        const data = (await response.json()) as MemberResult;
        if (!Array.isArray(data.members) || typeof data.total !== "number")
          throw new Error("회원 조회 응답을 확인할 수 없습니다. 새로고침해 주세요.");
        if (!controller.signal.aborted) setResult(data);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(reason instanceof Error ? reason.message : "회원 조회 중 오류가 발생했습니다.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [token, filters, page, pageSize, refresh]);

  const change = (key: keyof Filters, value: string) =>
    setDraft((previous) => ({ ...previous, [key]: value }));
  const currentPage = result?.page ?? page;
  const total = result?.total ?? 0;
  const sources = result?.filterOptions?.sources ?? [];

  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.from && draft.to && draft.from > draft.to) {
      setValidation("가입일의 종료일을 시작일 이후로 선택해 주세요.");
      return;
    }
    setValidation("");
    setPage(1);
    setFilters({ ...draft, q: draft.q.trim() });
  }

  function reset() {
    setDraft({ ...EMPTY_FILTERS });
    setFilters({ ...EMPTY_FILTERS });
    setPage(1);
    setValidation("");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Users size={20} className="text-[#556274]" />
            고객 관리
          </h2>
          <p className="mt-1.5 text-sm text-[#606975]">
            회원의 연락처, 가입방법, 유입경로를 조건별로 확인하세요.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => setRefresh((value) => value + 1)}
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          새로고침
        </Button>
      </div>

      <form onSubmit={search} className="rounded-xl border border-[#dfe3e9] bg-white p-5">
        <div className="grid gap-x-5 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="md:col-span-2">
            <FilterField label="회원 검색">
              <div className="flex gap-2">
                <select
                  aria-label="검색 항목"
                  className={`${SELECT_CLASS} max-w-32 shrink-0`}
                  value={draft.searchField}
                  onChange={(event) => change("searchField", event.target.value)}
                >
                  <option value="all">전체 항목</option>
                  <option value="name">이름</option>
                  <option value="email">이메일</option>
                  <option value="phone">휴대폰</option>
                </select>
                <Input
                  aria-label="회원 검색어"
                  className="h-10 min-w-0"
                  placeholder="이름, 이메일 또는 휴대폰 번호"
                  maxLength={200}
                  value={draft.q}
                  onChange={(event) => change("q", event.target.value)}
                />
              </div>
            </FilterField>
          </div>
          <FilterField label="가입방법">
            <select
              className={SELECT_CLASS}
              value={draft.provider}
              onChange={(event) => change("provider", event.target.value)}
            >
              <option value="">전체</option>
              <option value="google">구글</option>
              <option value="naver">네이버</option>
              <option value="kakao">카카오</option>
              <option value="email">이메일</option>
              <option value="unknown">기록 없음</option>
            </select>
          </FilterField>
          <FilterField label="가입경로 · 기기">
            <select
              className={SELECT_CLASS}
              value={draft.device}
              onChange={(event) => change("device", event.target.value)}
            >
              <option value="">전체</option>
              <option value="pc">PC</option>
              <option value="mobile">모바일</option>
              <option value="tablet">태블릿</option>
              <option value="unknown">기록 없음 / 확인 불가</option>
            </select>
          </FilterField>
          <FilterField label="유입경로 · 가입 전 첫 방문">
            <select
              className={SELECT_CLASS}
              value={draft.source}
              onChange={(event) => change("source", event.target.value)}
            >
              <option value="">전체</option>
              <option value="__unknown__">기록 없음</option>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {sourceLabel(source)}
                  {sourceLabel(source) !== source && source !== "direct" ? ` (${source})` : ""}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="가입일 · 한국시간">
            <div className="flex items-center gap-2">
              <Input
                type="date"
                aria-label="가입 시작일"
                className="h-10 min-w-0"
                value={draft.from}
                onChange={(event) => change("from", event.target.value)}
              />
              <span className="text-[#7a818c]">~</span>
              <Input
                type="date"
                aria-label="가입 종료일"
                className="h-10 min-w-0"
                value={draft.to}
                onChange={(event) => change("to", event.target.value)}
              />
            </div>
          </FilterField>
        </div>
        {validation ? (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {validation}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0f3] pt-4">
          <p className="max-w-2xl text-xs leading-relaxed text-[#707987]">
            가입경로와 유입경로는 수집을 시작한 뒤 가입한 회원부터 표시됩니다. 과거 회원의 비어 있는
            정보는 임의로 채우지 않습니다.
          </p>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" onClick={reset}>
              초기화
            </Button>
            <Button type="submit">
              <Search size={15} />
              검색
            </Button>
          </div>
        </div>
      </form>

      <section
        className="overflow-hidden rounded-xl border border-[#dfe3e9] bg-white"
        aria-busy={loading}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e8ed] px-5 py-4">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h3 className="text-sm font-semibold">회원 목록</h3>
            <p className="text-sm text-[#626d7c]">
              전체{" "}
              <b className="text-[#263548]">{result ? result.allTotal.toLocaleString() : "—"}</b>명
              <span className="mx-2.5 text-[#d3d7de]">|</span>검색 결과{" "}
              <b className="text-[#263548]">{result ? total.toLocaleString() : "—"}</b>명
            </p>
          </div>
          <select
            aria-label="페이지당 회원 수"
            className={`${SELECT_CLASS} h-9 w-auto`}
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          >
            <option value={20}>20명씩 보기</option>
            <option value={50}>50명씩 보기</option>
            <option value={100}>100명씩 보기</option>
          </select>
        </div>
        {error ? (
          <div
            role="alert"
            className="m-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={() => setRefresh((value) => value + 1)}>
              다시 시도
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="border-b border-[#e4e8ed] bg-[#f7f8fa] text-xs text-[#596474]">
                <tr>
                  <th scope="col" className="px-5 py-3">
                    가입일
                  </th>
                  <th scope="col" className="px-3 py-3">
                    이름
                  </th>
                  <th scope="col" className="px-3 py-3">
                    이메일
                  </th>
                  <th scope="col" className="px-3 py-3">
                    휴대폰
                  </th>
                  <th scope="col" className="px-3 py-3">
                    가입방법
                  </th>
                  <th scope="col" className="px-3 py-3">
                    가입경로
                  </th>
                  <th scope="col" className="px-3 py-3">
                    유입경로
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">유입 상세</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-14 text-center text-[#697584]" role="status">
                      회원 정보를 불러오는 중입니다…
                    </td>
                  </tr>
                ) : result?.members.length ? (
                  result.members.map((member) => (
                    <MemberRows
                      key={member.id}
                      member={member}
                      expanded={expandedId === member.id}
                      onToggle={() => setExpandedId((id) => (id === member.id ? null : member.id))}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-14 text-center text-[#697584]">
                      {result?.allTotal
                        ? "검색 조건에 맞는 회원이 없습니다. 조건을 바꾸거나 초기화해 주세요."
                        : "아직 가입한 회원이 없습니다."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#e5e8ed] px-5 py-4 lg:flex-row">
          <p className="text-xs text-[#697584]">
            {result && total > 0
              ? `${((currentPage - 1) * result.pageSize + 1).toLocaleString()}–${Math.min(currentPage * result.pageSize, total).toLocaleString()} / ${total.toLocaleString()}명`
              : "0명"}
            <span className="ml-3">
              {currentPage} / {Math.max(1, result?.totalPages ?? 1)} 페이지
            </span>
          </p>
          <Pagination
            page={currentPage}
            totalPages={result?.totalPages ?? 1}
            onPage={setPage}
            disabled={loading || Boolean(error)}
          />
        </div>
      </section>
      <p className="px-1 text-xs leading-relaxed text-[#707987]">
        소셜 로그인에서 이메일을 제공받지 못한 회원은 ‘이메일 미제공’으로 표시합니다. 로그인용 내부
        식별 주소는 고객에게 연락할 수 있는 이메일이 아닙니다.
      </p>
      <OrderCustomers token={token} />
    </div>
  );
}

function MemberRows({
  member,
  expanded,
  onToggle,
}: {
  member: Member;
  expanded: boolean;
  onToggle: () => void;
}) {
  const attribution = member.attribution;
  return (
    <>
      <tr className="border-b border-[#edf0f3] align-top hover:bg-[#fafbfd]">
        <td className="whitespace-nowrap px-5 py-4 text-xs text-[#697584]">
          {dateLabel(member.createdAt)}
        </td>
        <td className="max-w-44 break-words px-3 py-4 font-medium text-[#263548]">
          {member.name || "이름 미등록"}
        </td>
        <td className="max-w-72 break-all px-3 py-4">
          {member.email && !member.emailUnavailable ? (
            member.email
          ) : (
            <span className="text-xs text-[#8b919b]">이메일 미제공</span>
          )}
        </td>
        <td className="whitespace-nowrap px-3 py-4">
          {member.phone || <span className="text-xs text-[#8b919b]">미등록</span>}
        </td>
        <td className="px-3 py-4">
          <div className="flex max-w-36 flex-wrap gap-1">
            {member.providers.length ? (
              member.providers.map((provider) => (
                <span
                  key={provider}
                  className={`whitespace-nowrap rounded px-2 py-0.5 text-xs ${provider === "네이버" ? "bg-green-50 text-green-800" : provider === "카카오" ? "bg-yellow-50 text-yellow-900" : provider === "구글" ? "bg-blue-50 text-blue-800" : "bg-[#f0f2f5] text-[#5b6573]"}`}
                >
                  {provider}
                </span>
              ))
            ) : (
              <span className="text-xs text-[#8b919b]">기록 없음</span>
            )}
          </div>
        </td>
        <td className="whitespace-nowrap px-3 py-4 text-xs text-[#596474]">
          {attribution ? DEVICE_LABELS[attribution.device] || "확인 불가" : "기록 없음"}
        </td>
        <td className="max-w-52 break-words px-3 py-4 text-xs">
          {attribution?.source ? (
            <>
              <span className="block text-[#3e4d60]">{sourceLabel(attribution.source)}</span>
              {sourceLabel(attribution.source) !== attribution.source &&
              attribution.source !== "direct" ? (
                <span className="mt-1 block break-all text-[11px] text-[#8b919b]">
                  {attribution.source}
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-[#8b919b]">기록 없음</span>
          )}
        </td>
        <td className="px-4 py-3">
          {attribution ? (
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={`member-source-${member.id}`}
              onClick={onToggle}
              className="flex items-center gap-1 whitespace-nowrap rounded border border-[#e1e5eb] px-2.5 py-1.5 text-xs text-[#556274] hover:bg-[#eef2f7]"
            >
              유입 상세
              <ChevronDown size={13} className={expanded ? "rotate-180" : ""} />
            </button>
          ) : null}
        </td>
      </tr>
      {expanded && attribution ? (
        <tr id={`member-source-${member.id}`} className="border-b border-[#e5e8ed] bg-[#f8fafd]">
          <td colSpan={8} className="px-5 py-5">
            <p className="mb-3 text-xs font-semibold text-[#425369]">가입 전 첫 유입 정보 · 브라우저에서 전달된 값</p>
            <dl className="grid gap-x-8 gap-y-3 text-xs md:grid-cols-3">
              <Detail label="최초 방문 페이지" value={attribution.landing || "기록 없음"} />
              <Detail label="이전 사이트" value={attribution.referrerHost || "제공되지 않음"} />
              <Detail label="유입 유형" value={attribution.medium || "기록 없음"} />
              <Detail label="캠페인" value={attribution.campaign || "미지정"} />
              <Detail
                label="전달된 검색어 / 광고 키워드"
                value={attribution.keyword || "검색어 미제공"}
              />
              <Detail label="기록일" value={dateLabel(attribution.capturedAt)} />
            </dl>
            <p className="mt-4 text-[11px] leading-relaxed text-[#7b8592]">
              검색엔진이 검색어를 전달하지 않으면 확인할 수 없습니다. 링크에 전달된 키워드만
              표시하며 실제 고객 검색어와 광고에 지정한 단어는 다를 수 있습니다.
            </p>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="mb-1 text-[#7b8592]">{label}</dt>
      <dd className="break-all text-[#3e4d60]">{value}</dd>
    </div>
  );
}

/** Existing order-based customer history remains available separately from registered members. */
function OrderCustomers({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    setLoaded(false);
    setOrders([]);
  }, [token]);
  useEffect(() => {
    if (!open || loaded) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    void fetch("/api/orders", {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("주문 고객 기록을 불러오지 못했습니다.");
        const data = (await response.json()) as { orders?: StoreOrder[] };
        if (!controller.signal.aborted) {
          setOrders(data.orders ?? []);
          setLoading(false);
          setLoaded(true);
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(reason instanceof Error ? reason.message : "조회 오류가 발생했습니다.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [token, open, loaded, retry]);
  const people = useMemo(() => {
    const customers = new Map<string, { name: string; email: string; n: number; sum: number }>();
    for (const order of orders) {
      const key = order.email || order.name;
      const previous = customers.get(key);
      customers.set(key, {
        name: order.name,
        email: order.email,
        n: (previous?.n ?? 0) + 1,
        sum: (previous?.sum ?? 0) + (order.totalKrw || 0),
      });
    }
    const query = search.trim().toLowerCase();
    return [...customers.values()]
      .filter(
        (customer) => !query || `${customer.name} ${customer.email}`.toLowerCase().includes(query),
      )
      .sort((a, b) => b.n - a.n);
  }, [orders, search]);
  const totalPages = Math.max(1, Math.ceil(people.length / 20));
  const currentPage = Math.min(page, totalPages);
  return (
    <section className="overflow-hidden rounded-xl border border-[#dfe3e9] bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="order-customer-history"
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span>
          <span className="block text-sm font-semibold">주문 고객 기록</span>
          <span className="mt-1 block text-xs text-[#75808e]">
            기존 주문에서 모은 고객 목록 · 비회원 주문 포함
          </span>
        </span>
        <ChevronDown size={18} className={open ? "rotate-180" : ""} />
      </button>
      {open ? (
        <div id="order-customer-history" className="border-t border-[#e5e8ed]">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <p className="text-xs text-[#697584]">고객 {people.length.toLocaleString()}명</p>
            <Input
              aria-label="주문 고객 검색"
              className="max-w-xs"
              placeholder="이름 또는 이메일 검색"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          {error ? (
            <div role="alert" className="px-5 pb-5 text-sm text-red-700">
              {error}
              <button
                type="button"
                className="ml-3 underline"
                onClick={() => setRetry((value) => value + 1)}
              >
                다시 시도
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-[#f7f8fa] text-xs text-[#596474]">
                  <tr>
                    <th scope="col" className="px-5 py-3">
                      고객
                    </th>
                    <th scope="col" className="px-3 py-3">
                      이메일
                    </th>
                    <th scope="col" className="px-3 py-3">
                      주문 기록
                    </th>
                    <th scope="col" className="px-3 py-3">
                      주문금액 합계
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-[#697584]">
                        주문 고객을 불러오는 중입니다…
                      </td>
                    </tr>
                  ) : people.length ? (
                    people.slice((currentPage - 1) * 20, currentPage * 20).map((customer) => (
                      <tr
                        key={customer.email || customer.name}
                        className="border-t border-[#edf0f3]"
                      >
                        <td className="px-5 py-3">{customer.name || "—"}</td>
                        <td className="max-w-80 break-all px-3 py-3">
                          {customer.email || "미등록"}
                        </td>
                        <td className="px-3 py-3">{customer.n}건</td>
                        <td className="px-3 py-3">₩{customer.sum.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-[#697584]">
                        {search
                          ? "검색 조건에 맞는 주문 고객이 없습니다."
                          : "주문이 생기면 고객이 여기 모입니다."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="space-y-4 border-t border-[#e5e8ed] px-5 py-4">
            <Pagination
              label="주문 고객 기록 페이지"
              page={currentPage}
              totalPages={totalPages}
              onPage={setPage}
              disabled={loading || Boolean(error)}
            />
            <p className="text-xs leading-relaxed text-[#75808e]">
              이 영역은 기존 주문 기록을 이메일 기준으로 모은 참고 목록입니다. 합계에는
              입금대기·취소 등 모든 상태의 주문이 포함되어 있으며, 실제 결제 매출과 다릅니다.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
