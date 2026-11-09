import { useEffect, useState, type FormEvent } from "react";
import { FileText, ImageIcon, MessageCircle, ShoppingBag, UserRound } from "lucide-react";
import { analyticsDateRange, type AnalyticsPage, type AnalyticsRank, type AnalyticsSummary } from "@/lib/analytics-summary";

const number = (value: number) => value.toLocaleString("ko-KR");
const control = "rounded-md border border-[#cdd2d9] bg-white px-3 py-2 text-sm text-[#27313e]";

export function AnalyticsBoard({ token }: { token: string }) {
  const [period, setPeriod] = useState(() => analyticsDateRange());
  const [draft, setDraft] = useState(period);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ view: "summary", ...period });
    void fetch(`/api/analytics?${params}`, {
      headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(response.status === 401 ? "관리자 인증이 만료되었습니다. 다시 로그인해 주세요."
        : data.error === "PERIOD_INVALID" ? "조회 기간을 확인해 주세요. 한 번에 최대 366일까지 조회할 수 있습니다."
          : "방문 데이터를 불러오지 못했습니다. 다시 시도해 주세요.");
      if (!controller.signal.aborted) setSummary(data.summary);
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "조회에 실패했습니다.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, period, refresh]);

  const quickPeriod = (days: number) => {
    const value = analyticsDateRange(days);
    setDraft(value); setPeriod(value);
  };
  const search = (event: FormEvent) => { event.preventDefault(); setPeriod({ ...draft }); };

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-[#e3e6ea] bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#27313e]">방문 · 유입 분석</h2>
            <p className="mt-1 text-xs text-[#626d7c]">선택한 기간의 전체 기록을 집계합니다. 날짜는 한국 시간 기준입니다.</p>
          </div>
          <button className={control} type="button" disabled={loading} onClick={() => setRefresh((value) => value + 1)}>새로고침</button>
        </div>
        <form className="mt-4 flex flex-wrap items-end gap-2" onSubmit={search}>
          <label className="grid gap-1 text-xs text-[#626d7c]">시작일
            <input className={control} type="date" required value={draft.from} max={draft.to} onChange={(event) => setDraft((value) => ({ ...value, from: event.target.value }))} />
          </label>
          <label className="grid gap-1 text-xs text-[#626d7c]">종료일
            <input className={control} type="date" required value={draft.to} min={draft.from} onChange={(event) => setDraft((value) => ({ ...value, to: event.target.value }))} />
          </label>
          <button type="submit" className="rounded-md bg-[#27313e] px-5 py-2 text-sm text-white">조회</button>
          <div className="flex flex-wrap gap-1 sm:ml-2">
            {[7, 30, 90].map((days) => <button key={days} className={control} type="button" onClick={() => quickPeriod(days)}>최근 {days}일</button>)}
          </div>
        </form>
      </section>
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {loading && <p role="status" className="px-1 text-sm text-[#626d7c]">조회 중입니다…</p>}
      {summary && !error && (
        <div className={`space-y-4 ${loading ? "opacity-50" : ""}`} aria-busy={loading}>
          <p className="px-1 text-xs text-[#626d7c]">집계 기간 {summary.period.from} ~ {summary.period.to} · 순위는 상위 20개</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="페이지 조회" value={summary.totals.pageViews} note="같은 사람의 여러 번 조회를 포함합니다." />
            <Stat label="장바구니 추가 이벤트" value={summary.totals.cartEvents} note="브라우저에서 기록한 장바구니 동작입니다." />
            <Stat label="주문 이벤트" value={summary.totals.orderEvents} note="결제 완료 주문 수는 주문관리에서 확인하세요." />
          </div>
          <div className="grid items-start gap-4 xl:grid-cols-2">
            <section className="rounded-lg border border-[#e3e6ea] bg-white p-4 sm:p-5">
              <h3 className="text-sm font-semibold">유입 경로</h3>
              <p className="mb-4 mt-1 text-xs leading-5 text-[#626d7c]">해당 출처가 기록된 페이지 조회 수입니다. 방문자 수와는 다릅니다.</p>
              <RankList rows={summary.sources} empty="선택한 기간에 수집된 유입 정보가 없습니다." showKey />
              {summary.excludedSourceViews > 0 && <p className="mt-4 border-t border-[#e3e6ea] pt-3 text-xs leading-5 text-[#626d7c]">과거 기록 중 사이트 내부 이동·소셜 로그인 돌아오기 {number(summary.excludedSourceViews)}회는 유입 순위에서 제외했습니다. 전체 페이지 조회 수에는 포함됩니다.</p>}
            </section>
            <section className="rounded-lg border border-[#e3e6ea] bg-white p-4 sm:p-5">
              <h3 className="text-sm font-semibold">검색어 · 광고 키워드</h3>
              <p className="mb-4 mt-1 text-xs leading-5 text-[#626d7c]">사이트에 실제로 전달된 검색어 또는 광고 링크의 키워드만 표시합니다.</p>
              <div className="mb-4 grid grid-cols-2 gap-2 rounded-md bg-[#f5f7fa] p-3 text-sm">
                <span className="text-[#626d7c]">검색 경로 조회</span><b className="text-right">{number(summary.search.pageViews)}회</b>
                <span className="text-[#626d7c]">검색어 미제공</span><b className="text-right">{number(summary.search.withoutKeyword)}회</b>
              </div>
              <RankList rows={summary.keywords} empty="전달된 검색어가 없습니다. 검색 유입이 없다는 뜻은 아닙니다." />
              <p className="mt-4 border-t border-[#e3e6ea] pt-3 text-xs leading-5 text-[#626d7c]">검색엔진이 검색어를 공개하지 않으면 확인할 수 없습니다. 과거에 저장하지 않은 검색어도 소급해서 복원할 수 없습니다. 광고의 utm_term은 설정한 광고 키워드이며 실제 검색어와 다를 수 있습니다.</p>
            </section>
            <section className="rounded-lg border border-[#e3e6ea] bg-white p-4 sm:p-5">
              <h3 className="text-sm font-semibold">많이 본 페이지</h3>
              <p className="mb-3 mt-1 text-xs leading-5 text-[#626d7c]">대표 이미지와 페이지 이름으로 확인하세요. 누르면 해당 페이지가 열립니다.</p>
              {summary.pages.length ? <ul className="divide-y divide-[#edf0f3]">
                {summary.pages.map((page) => <li key={page.path}>
                  <a href={page.path} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-3 rounded-md py-3 hover:bg-[#f7f9fb]">
                    <PageThumbnail page={page} />
                    <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium text-[#27313e]">{page.title}</p><p className="mt-1 truncate text-xs text-[#7b8491]">{page.path}</p></div>
                    <b className="shrink-0 pr-1 text-sm tabular-nums">{number(page.count)}<span className="ml-1 font-normal text-[#7b8491]">회</span></b>
                  </a>
                </li>)}
              </ul> : <Empty>선택한 기간의 페이지 조회 기록이 없습니다.</Empty>}
            </section>
            <section className="rounded-lg border border-[#e3e6ea] bg-white p-4 sm:p-5">
              <h3 className="text-sm font-semibold">캠페인</h3>
              <p className="mb-4 mt-1 text-xs leading-5 text-[#626d7c]">링크에 지정한 utm_campaign별 페이지 조회 수입니다.</p>
              <RankList rows={summary.campaigns} empty="캠페인 이름이 전달된 방문이 없습니다." />
            </section>
          </div>
          <p className="px-1 text-xs leading-5 text-[#626d7c]">광고 계정이나 검색엔진 관리 도구의 데이터가 아닌, 사이트에서 수집한 기록입니다. 광고 차단·브라우저 제한에 따라 누락될 수 있습니다. 이전 기록에는 원래 유입 경로가 보존되지 않은 경우가 있으며, 확인할 수 없는 값을 추정해서 채우지 않습니다.</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: number; note: string }) {
  return <div className="rounded-lg border border-[#e3e6ea] bg-white p-4 sm:p-5"><p className="text-xs text-[#626d7c]">{label}</p><p className="my-1 text-2xl font-semibold tabular-nums text-[#27313e]">{number(value)}</p><p className="text-xs text-[#7b8491]">{note}</p></div>;
}
function Empty({ children }: { children: React.ReactNode }) { return <p className="rounded-md bg-[#f7f9fb] p-4 text-sm leading-6 text-[#7b8491]">{children}</p>; }
function RankList({ rows, empty, showKey = false }: { rows: AnalyticsRank[]; empty: string; showKey?: boolean }) {
  const max = rows[0]?.count || 1;
  return rows.length ? <ul className="space-y-4">{rows.map((row) => <li key={row.key}>
    <div className="mb-1.5 flex justify-between gap-3 text-sm"><div className="min-w-0"><span className="break-words text-[#27313e]">{row.label}</span>{showKey && row.label !== row.key && <span className="ml-2 break-all text-xs text-[#7b8491]">{row.key}</span>}</div><b className="shrink-0 tabular-nums">{number(row.count)}</b></div>
    <div className="h-1 overflow-hidden rounded-full bg-[#f0f2f5]" aria-hidden="true"><div className="h-full rounded-full bg-[#6d8198]" style={{ width: `${Math.max(1, row.count / max * 100)}%` }} /></div>
  </li>)}</ul> : <Empty>{empty}</Empty>;
}
function PageThumbnail({ page }: { page: AnalyticsPage }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [page.image]);
  const Icon = page.kind === "account" ? UserRound : page.kind === "support" ? MessageCircle : page.kind === "store" ? ShoppingBag : page.kind === "product" ? ImageIcon : FileText;
  return <span className="flex h-14 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#e3e6ea] bg-[#f1f3f6] text-[#8290a0]">
    {page.image && !failed ? <img src={page.image} alt="" loading="lazy" className="h-full w-full object-cover" onError={() => setFailed(true)} /> : <Icon size={23} aria-hidden="true" />}
  </span>;
}
