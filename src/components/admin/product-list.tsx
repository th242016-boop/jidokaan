import { useEffect, useMemo, useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product } from "@/lib/products";
import {
  categoryName,
  majorsOf,
  type ShopCategory,
} from "@/lib/shop-taxonomy";
import { cn } from "@/lib/utils";

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
  onReorder?: (ids: string[]) => Promise<boolean> | boolean | void;
}) {
  const [q, setQ] = useState("");
  const [field, setField] = useState<"name" | "sku">("name");
  const [display, setDisplay] = useState<"all" | "on" | "off">("all");
  const [sale, setSale] = useState<"all" | "on" | "off">("all");
  const [major, setMajor] = useState("");
  const [sort, setSort] = useState<"display" | "new" | "name" | "price">("display");
  const [picked, setPicked] = useState<string[]>([]);
  const [moveMajor, setMoveMajor] = useState("");
  const [overId, setOverId] = useState<string | null>(null);
  const [liveIds, setLiveIds] = useState<string[] | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const dragId = useRef<string | null>(null);
  const startPt = useRef<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const liveRef = useRef<string[]>([]);

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

  const shown = useMemo(() => {
    if (!liveIds) return rows;
    const map = new Map(rows.map((p) => [p.id, p]));
    return liveIds.map((id) => map.get(id)).filter((p): p is Product => Boolean(p));
  }, [rows, liveIds]);

  const allChecked = shown.length > 0 && shown.every((p) => picked.includes(p.id));

  function toggleAll() {
    setPicked(allChecked ? [] : shown.map((p) => p.id));
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

  async function persistOrder(viewIds: string[]) {
    setSaving(true);
    setSaveNote(null);
    try {
      const ok = await onReorder?.(viewIds);
      if (ok === false) throw new Error("fail");
      setDirty(false);
      setLiveIds(viewIds);
      liveRef.current = viewIds;
      setSaveNote("저장했습니다. 쇼핑몰 상품 목록에 이 순서로 나갑니다.");
      return true;
    } catch {
      setDirty(true);
      setSaveNote("저장에 실패했습니다. 다시 로그인한 뒤 저장해 주세요.");
      window.alert("저장에 실패했습니다. 관리자에 다시 로그인한 뒤 저장해 주세요.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveOrder() {
    await persistOrder(liveRef.current.length ? liveRef.current : shown.map((p) => p.id));
  }

  function moveRow(id: string, dir: -1 | 1) {
    if (sort !== "display") setSort("display");
    const list = shown;
    const i = list.findIndex((p) => p.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    const next = list.map((p) => p.id);
    const tmp = next[i]!;
    next[i] = next[j]!;
    next[j] = tmp;
    liveRef.current = next;
    setLiveIds(next);
    setSort("display");
    void persistOrder(next);
  }

  function placeAt(fromId: string, at: number) {
    const next = liveRef.current.filter((id) => id !== fromId);
    const insert = Math.max(0, Math.min(at, next.length));
    next.splice(insert, 0, fromId);
    if (next.join() === liveRef.current.join()) return;
    liveRef.current = next;
    setLiveIds(next);
  }

  function onRowPointerDown(e: React.PointerEvent, id: string) {
    if (sort !== "display") return;
    const t = e.target as HTMLElement;
    if (t.closest("input, select, a, [data-nodrag]")) return;
    dragId.current = id;
    dragging.current = false;
    startPt.current = { x: e.clientX, y: e.clientY };
    liveRef.current = (liveIds ?? rows.map((p) => p.id)).slice();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onRowPointerMove(e: React.PointerEvent) {
    if (!dragId.current || !startPt.current) return;
    const dx = e.clientX - startPt.current.x;
    const dy = e.clientY - startPt.current.y;
    if (!dragging.current) {
      if (Math.hypot(dx, dy) < 6) return;
      dragging.current = true;
    }
    e.preventDefault();
    const tbody = (e.currentTarget as HTMLElement).closest("tbody");
    if (!tbody) return;
    const others = [...tbody.querySelectorAll("tr[data-pid]")].filter(
      (el) => (el as HTMLElement).dataset.pid !== dragId.current,
    ) as HTMLElement[];
    let at = others.length;
    for (let i = 0; i < others.length; i++) {
      const box = others[i]!.getBoundingClientRect();
      if (e.clientY < box.top + box.height / 2) {
        at = i;
        break;
      }
    }
    setOverId(others[at]?.dataset.pid ?? others[others.length - 1]?.dataset.pid ?? null);
    placeAt(dragId.current, at);
  }

  function onRowPointerUp(e: React.PointerEvent, product: Product) {
    const wasDrag = dragging.current;
    const fromId = dragId.current;
    dragId.current = null;
    dragging.current = false;
    startPt.current = null;
    setOverId(null);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    if (wasDrag && fromId) {
      setSort("display");
      void persistOrder(liveRef.current);
      return;
    }
    if (!wasDrag && !(e.target as HTMLElement).closest("input, select, [data-nodrag]")) {
      onEdit(product);
    }
  }

  const majors = majorsOf(categories);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

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
          <p className="text-sm">
            총 {shown.length}개
            <span className="ml-2 text-xs text-[#666]">
              위·아래 버튼으로 순서를 바꾸면 바로 저장됩니다. 끌어서 옮겨도 됩니다.
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-8 rounded border border-[#ccc] bg-white px-2 text-sm"
              value={sort}
              onChange={(e) => {
                setLiveIds(null);
                setSort(e.target.value as typeof sort);
              }}
            >
              <option value="display">진열순 (직접 정한 순서)</option>
              <option value="new">최근 등록순</option>
              <option value="name">상품명순</option>
              <option value="price">판매가 높은순</option>
            </select>
            <Button size="sm" onClick={onCreate}>상품등록</Button>
          </div>
        </div>

        {dirty || saveNote ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222] bg-[#111] px-4 py-3 text-white">
            <p className="text-sm font-medium">
              {saveNote ?? "순서가 바뀌었습니다. 저장해야 쇼핑몰에 반영됩니다."}
            </p>
            {dirty ? (
              <Button
                type="button"
                disabled={saving || busy}
                className="bg-[#00c73c] text-white hover:bg-[#00b434]"
                onClick={() => void saveOrder()}
              >
                {saving ? "저장 중…" : "진열 순서 저장"}
              </Button>
            ) : null}
          </div>
        ) : null}

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
              {shown.map((p, i) => (
                <tr
                  key={p.id}
                  data-pid={p.id}
                  onPointerDown={(e) => onRowPointerDown(e, p.id)}
                  onPointerMove={onRowPointerMove}
                  onPointerUp={(e) => onRowPointerUp(e, p)}
                  onPointerCancel={(e) => onRowPointerUp(e, p)}
                  className={cn(
                    "border-t border-[#eee] select-none",
                    sort === "display" && "cursor-grab",
                    overId === p.id && dragId.current && overId !== dragId.current
                      ? "bg-[#eef3ff]"
                      : "hover:bg-[#fafafa]",
                    dragId.current === p.id && "bg-[#e8eefc] opacity-80",
                  )}
                  style={sort === "display" ? { touchAction: "none" } : undefined}
                >
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
                  <td className="px-2 py-2 text-[#555]">{shown.length - i}</td>
                  <td className="px-2 py-2 text-[#333]">{p.sku || p.id}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      {sort === "display" ? (
                        <span
                          className="inline-flex size-8 shrink-0 cursor-grab items-center justify-center rounded text-[#999] hover:bg-[#eee] hover:text-[#333]"
                          title="끌어서 순서 변경"
                        >
                          <GripVertical className="size-4" />
                        </span>
                      ) : null}
                      <span className="flex min-w-0 items-center gap-2 text-left">
                        <span className="size-12 shrink-0 overflow-hidden rounded border border-[#ddd] bg-[#f3f3f3]">
                          {p.image ? (
                            <img src={p.image} alt="" className="pointer-events-none size-full object-cover" />
                          ) : null}
                        </span>
                        <span>
                          <span className="font-medium underline">{p.name.ko || p.name.en}</span>
                          {p.customizable ? (
                            <span className="mt-0.5 block text-[11px] text-[#666]">커스텀</span>
                          ) : null}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2" data-nodrag>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="h-7 rounded border border-[#ccc] px-1.5 text-xs disabled:opacity-30"
                        disabled={i === 0 || saving || busy}
                        onClick={() => moveRow(p.id, -1)}
                      >
                        위
                      </button>
                      <button
                        type="button"
                        className="h-7 rounded border border-[#ccc] px-1.5 text-xs disabled:opacity-30"
                        disabled={i === shown.length - 1 || saving || busy}
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
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      data-nodrag
                      onClick={() => onEdit(p)}
                    >
                      수정
                    </Button>
                  </td>
                </tr>
              ))}
              {shown.length === 0 ? (
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
