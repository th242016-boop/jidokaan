import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product } from "@/lib/products";
import {
  categoryName,
  majorsOf,
  type ShopCategory,
} from "@/lib/shop-taxonomy";

export function ProductList({
  products,
  categories,
  busy,
  onCreate,
  onEdit,
  onBulk,
  onReorder,
}: {
  products: Product[];
  categories: ShopCategory[];
  busy: boolean;
  onCreate: () => void;
  onEdit: (p: Product) => void;
  onBulk: (
    ids: string[],
    op: string,
    extra?: { majorId?: string; order?: string[] },
  ) => void;
  onReorder?: (ids: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const [field, setField] = useState<"name" | "sku">("name");
  const [display, setDisplay] = useState<"all" | "on" | "off">("all");
  const [sale, setSale] = useState<"all" | "on" | "off">("all");
  const [major, setMajor] = useState("");
  const [sort, setSort] = useState<"display" | "new" | "name" | "price">("display");
  const [picked, setPicked] = useState<string[]>([]);
  const [moveMajor, setMoveMajor] = useState("");

  const stats = useMemo(() => {
    const all = products.length;
    const selling = products.filter((p) => p.inStock).length;
    const shown = products.filter((p) => p.visible !== false).length;
    return { all, selling, hiddenSale: all - selling, shown, hidden: all - shown };
  }, [products]);

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = products.filter((p) => {
      if (display === "on" && p.visible === false) return false;
      if (display === "off" && p.visible !== false) return false;
      if (sale === "on" && !p.inStock) return false;
      if (sale === "off" && p.inStock) return false;
      if (major && p.majorId !== major) return false;
      if (query) {
        const hay =
          field === "sku"
            ? `${p.sku} ${p.id}`.toLowerCase()
            : `${p.name.ko} ${p.name.en} ${p.sku}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "name") return (a.name.ko || "").localeCompare(b.name.ko || "", "ko");
      if (sort === "price") return b.priceKrw - a.priceKrw;
      if (sort === "new") return (b.createdAt || "").localeCompare(a.createdAt || "");
      const sa = a.sortOrder ?? 0;
      const sb = b.sortOrder ?? 0;
      if (sa === 0 && sb === 0) return (b.createdAt || "").localeCompare(a.createdAt || "");
      if (sa === 0) return 1;
      if (sb === 0) return -1;
      return sa - sb;
    });
    return list;
  }, [products, q, field, display, sale, major, sort]);

  const allChecked = rows.length > 0 && rows.every((p) => picked.includes(p.id));

  function toggleAll() {
    setPicked(allChecked ? [] : rows.map((p) => p.id));
  }

  function run(op: string) {
    if (!picked.length) {
      alert("상품을 먼저 선택하세요.");
      return;
    }
    if (op === "delete" && !confirm(`${picked.length}개 상품을 삭제할까요?`)) return;
    onBulk(picked, op, {
      majorId: moveMajor || undefined,
    });
    setPicked([]);
  }

  function moveRow(id: string, dir: -1 | 1) {
    const i = rows.findIndex((p) => p.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= rows.length) return;
    const next = rows.map((p) => p.id);
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
    onReorder?.(next);
    setSort("display");
  }

  const majors = majorsOf(categories);

  return (
    <div className="space-y-3">
      <div className="rounded border border-[#d5d7dc] bg-white px-4 py-3 text-sm">
        <span className="mr-3">전체 <b>{stats.all}</b>건</span>
        <button type="button" className="mr-3 underline" onClick={() => setSale("on")}>
          판매함 <b>{stats.selling}</b>
        </button>
        <button type="button" className="mr-3 underline" onClick={() => setSale("off")}>
          판매안함 <b>{stats.hiddenSale}</b>
        </button>
        <button type="button" className="mr-3 underline" onClick={() => setDisplay("on")}>
          진열함 <b>{stats.shown}</b>
        </button>
        <button type="button" className="underline" onClick={() => setDisplay("off")}>
          진열안함 <b>{stats.hidden}</b>
        </button>
      </div>

      <div className="rounded border border-[#d5d7dc] bg-white">
        <table className="w-full text-sm">
          <tbody>
            <FilterRow label="검색">
              <select
                className="h-9 rounded border border-[#ccc] bg-white px-2"
                value={field}
                onChange={(e) => setField(e.target.value as "name" | "sku")}
              >
                <option value="name">상품명</option>
                <option value="sku">상품코드</option>
              </select>
              <Input
                className="h-9 max-w-sm rounded"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="검색어"
              />
            </FilterRow>
            <FilterRow label="상품분류">
              <select
                className="h-9 rounded border border-[#ccc] bg-white px-2"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
              >
                <option value="">전체</option>
                {majors.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FilterRow>
            <FilterRow label="진열상태">
              <Radios
                value={display}
                onChange={setDisplay}
                options={[
                  { value: "all", label: "전체" },
                  { value: "on", label: "진열함" },
                  { value: "off", label: "진열안함" },
                ]}
              />
            </FilterRow>
            <FilterRow label="판매상태">
              <Radios
                value={sale}
                onChange={setSale}
                options={[
                  { value: "all", label: "전체" },
                  { value: "on", label: "판매함" },
                  { value: "off", label: "판매안함" },
                ]}
              />
            </FilterRow>
          </tbody>
        </table>
        <div className="flex justify-end gap-2 border-t border-[#eee] px-4 py-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setQ("");
              setDisplay("all");
              setSale("all");
              setMajor("");
            }}
          >
            초기화
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded border border-[#d5d7dc] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eee] px-3 py-2">
          <p className="text-sm">총 {rows.length}개</p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-8 rounded border border-[#ccc] bg-white px-2 text-sm"
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
            >
              <option value="display">진열순 (직접 정한 순서)</option>
              <option value="new">최근 등록순</option>
              <option value="name">상품명순</option>
              <option value="price">판매가 높은순</option>
            </select>
            <Button size="sm" onClick={onCreate}>상품등록</Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 border-b border-[#eee] px-3 py-2">
          <BulkBtn onClick={() => run("show")}>진열함</BulkBtn>
          <BulkBtn onClick={() => run("hide")}>진열안함</BulkBtn>
          <BulkBtn onClick={() => run("sell")}>판매함</BulkBtn>
          <BulkBtn onClick={() => run("unsell")}>판매안함</BulkBtn>
          <BulkBtn onClick={() => run("copy")}>복사</BulkBtn>
          <BulkBtn onClick={() => run("delete")}>삭제</BulkBtn>
          <select
            className="h-8 rounded border border-[#ccc] bg-white px-2 text-xs"
            value={moveMajor}
            onChange={(e) => setMoveMajor(e.target.value)}
          >
            <option value="">분류 이동</option>
            {majors.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <BulkBtn onClick={() => run("category")}>분류수정</BulkBtn>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#f6f7f8] text-xs text-[#333]">
              <tr>
                <th className="px-3 py-2">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} />
                </th>
                <th className="px-2 py-2">No</th>
                <th className="px-2 py-2">상품코드</th>
                <th className="px-2 py-2">상품명</th>
                <th className="px-2 py-2">진열순</th>
                <th className="px-2 py-2">분류</th>
                <th className="px-2 py-2 text-right">판매가</th>
                <th className="px-2 py-2">진열</th>
                <th className="px-2 py-2">판매</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr key={p.id} className="border-t border-[#eee] hover:bg-[#fafafa]">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={picked.includes(p.id)}
                      onChange={(e) =>
                        setPicked((cur) =>
                          e.target.checked ? [...cur, p.id] : cur.filter((id) => id !== p.id),
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-2 text-[#555]">{rows.length - i}</td>
                  <td className="px-2 py-2 text-[#333]">{p.sku || p.id}</td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      className="flex items-center gap-2 text-left"
                      onClick={() => onEdit(p)}
                    >
                      <span className="size-12 shrink-0 overflow-hidden rounded border border-[#ddd] bg-[#f3f3f3]">
                        {p.image ? (
                          <img src={p.image} alt="" className="size-full object-cover" />
                        ) : null}
                      </span>
                      <span>
                        <span className="font-medium underline">{p.name.ko || p.name.en}</span>
                        {p.customizable ? (
                          <span className="mt-0.5 block text-[11px] text-[#666]">커스텀</span>
                        ) : null}
                      </span>
                    </button>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="h-7 rounded border border-[#ccc] px-1.5 text-xs disabled:opacity-30"
                        disabled={i === 0}
                        onClick={() => moveRow(p.id, -1)}
                      >
                        위
                      </button>
                      <button
                        type="button"
                        className="h-7 rounded border border-[#ccc] px-1.5 text-xs disabled:opacity-30"
                        disabled={i === rows.length - 1}
                        onClick={() => moveRow(p.id, 1)}
                      >
                        아래
                      </button>
                      <span className="text-[11px] text-[#666]">{p.sortOrder || "자동"}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-[#333]">
                    {categoryName(categories, p.majorId) || "—"}
                  </td>
                  <td className="px-2 py-2 text-right">
                    ₩{p.priceKrw.toLocaleString()}
                    <div className="text-[11px] text-[#555]">${Math.round(p.priceUsd / 100)}</div>
                  </td>
                  <td className="px-2 py-2">{p.visible === false ? "진열안함" : "진열함"}</td>
                  <td className="px-2 py-2">{p.inStock ? "판매함" : "판매안함"}</td>
                  <td className="px-2 py-2">
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => onEdit(p)}>
                      수정
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-[#555]">
                    조건에 맞는 상품이 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-t border-[#eee] first:border-t-0">
      <th className="w-28 bg-[#f7f8f9] px-4 py-3 text-left text-sm font-medium">{label}</th>
      <td className="flex flex-wrap items-center gap-2 px-4 py-3">{children}</td>
    </tr>
  );
}

function Radios({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: "all" | "on" | "off") => void;
  options: { value: "all" | "on" | "off"; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-4">
      {options.map((opt) => (
        <label key={opt.value} className="inline-flex items-center gap-1.5">
          <input
            type="radio"
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function BulkBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-8 rounded border border-[#ccc] bg-white px-2 text-xs font-medium hover:bg-[#f4f4f4]"
    >
      {children}
    </button>
  );
}
