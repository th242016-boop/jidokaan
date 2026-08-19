import { useEffect, useState } from "react";
type Hit = {
  id: string;
  type: string;
  path: string;
  source: string;
  campaign: string;
  keyword: string;
};

export function AnalyticsBoard({ token }: { token: string }) {
  const [hits, setHits] = useState<Hit[]>([]);
  useEffect(() => {
    void fetch(`/api/analytics?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => setHits(d.hits ?? []));
  }, [token]);

  const pages = count(hits.filter((h) => h.type === "page").map((h) => h.path));
  const sources = count(hits.map((h) => h.source || "직접 방문"));
  const keywords = count(hits.map((h) => h.keyword).filter(Boolean));
  const campaigns = count(hits.map((h) => h.campaign).filter(Boolean));
  const carts = hits.filter((h) => h.type === "cart").length;
  const orders = hits.filter((h) => h.type === "order").length;
  const views = hits.filter((h) => h.type === "page").length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="페이지뷰" value={views} />
        <Stat label="장바구니" value={carts} />
        <Stat label="주문" value={orders} />
        <Stat
          label="전환율"
          value={views ? `${((orders / views) * 100).toFixed(1)}%` : "0%"}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Table title="유입 경로 (어디서 왔나)" rows={sources} />
        <Table title="검색 키워드 / 광고 단어" rows={keywords} />
        <Table title="많이 본 페이지" rows={pages} />
        <Table title="캠페인" rows={campaigns} />
      </div>
      <p className="text-xs text-[#555]">
        네이버·구글 광고는 링크에 utm_source, utm_term(키워드) 을 붙이면 여기에 쌓입니다.
        광고 계정에 직접 들어가 보는 연동은 광고 아이디가 있어야 해서, 지금은 우리 사이트에 찍힌 실제 방문만 모읍니다.
      </p>
    </div>
  );
}

function count(list: string[]) {
  const map = new Map<string, number>();
  for (const k of list) map.set(k, (map.get(k) ?? 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[#e3e6ea] bg-white p-4">
      <p className="text-xs text-[#666]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Table({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <section className="rounded-lg border border-[#e3e6ea] bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-[#888]">아직 데이터가 없습니다. 쇼핑몰을 오가면 쌓입니다.</p>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {rows.map(([k, n]) => (
            <li key={k} className="flex justify-between gap-3">
              <span className="truncate text-[#333]">{k}</span>
              <b>{n}</b>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
