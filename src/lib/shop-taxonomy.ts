import { EMPTY_OPTIONS } from "./product-options";
import type { CategoryId, Product } from "./products";

export type ShopCategory = {
  id: string;
  name: string;
  parentId: string | null;
};

export type SiteSeo = {
  title: string;
  description: string;
  keywords: string;
};

export const DEFAULT_CATEGORIES: ShopCategory[] = [
  { id: "apparel", name: "의류", parentId: null },
  { id: "shoes", name: "신발", parentId: null },
  { id: "etc", name: "기타", parentId: null },
];

const OLD_CAT_IDS = new Set(["goods", "custom", "ready", "care", "gear"]);

export function migrateCategories(cats: ShopCategory[]): ShopCategory[] {
  if (!Array.isArray(cats) || cats.length === 0) return DEFAULT_CATEGORIES;
  if (cats.some((c) => OLD_CAT_IDS.has(c.id))) return DEFAULT_CATEGORIES;
  return cats.filter((c) => !c.parentId);
}

export const DEFAULT_SEO: SiteSeo = {
  title: "지도칸 JIDOKAAN — Custom Boxing Shoes",
  description:
    "지도칸은 성수 공방에서 한 켤레씩 손으로 만드는 커스텀 복싱화입니다. 전 세계 배송. jidokaan.com",
  keywords: "지도칸, JIDOKAAN, 복싱화, 커스텀 복싱화, 수제 복싱화, boxing shoes, custom boxing",
};

export function majorsOf(cats: ShopCategory[]) {
  return cats.filter((c) => !c.parentId);
}

export function minorsOf(cats: ShopCategory[], majorId?: string) {
  return cats.filter((c) => c.parentId && (!majorId || c.parentId === majorId));
}

export function categoryName(cats: ShopCategory[], id?: string) {
  return cats.find((c) => c.id === id)?.name ?? "";
}

export function inferMajorId(p: Product): string {
  if (p.majorId === "apparel" || p.majorId === "shoes" || p.majorId === "etc") {
    return p.majorId;
  }
  if (p.majorId === "goods" || p.category === "care" || p.category === "gear") {
    return "etc";
  }
  return "shoes";
}

/** 사장이 진열순서를 정했으면 그 숫자, 아니면 최근 등록이 앞. */
export function sortForDisplay<T extends Pick<Product, "id" | "sortOrder" | "createdAt">>(list: T[]): T[] {
  const anyCustom = list.some((p) => (p.sortOrder ?? 0) > 0);
  return [...list].sort((a, b) => {
    if (anyCustom) {
      const sa = a.sortOrder ?? 0;
      const sb = b.sortOrder ?? 0;
      if (sa !== sb) {
        if (sa === 0) return 1;
        if (sb === 0) return -1;
        return sa - sb;
      }
    }
    return (b.createdAt || "").localeCompare(a.createdAt || "");
  });
}

export function applyDisplayOrder<T extends Pick<Product, "id" | "sortOrder">>(
  list: T[],
  ids: string[],
): T[] {
  if (!ids.length) return list;
  const map = new Map(list.map((p) => [p.id, p]));
  const out: T[] = [];
  for (const id of ids) {
    const p = map.get(id);
    if (!p) continue;
    out.push({ ...p, sortOrder: out.length + 1 });
    map.delete(id);
  }
  for (const p of map.values()) {
    out.push({ ...p, sortOrder: out.length + 1 });
  }
  return out;
}

export function fillProductSeo(p: Product): Product {
  const name = p.name.ko || p.name.en || "지도칸";
  const desc = (p.tagline.ko || p.description.ko || p.tagline.en || "").slice(0, 160);
  return {
    ...p,
    seoTitle: p.seoTitle?.trim() || `${name} | 지도칸 JIDOKAAN`,
    seoDescription: p.seoDescription?.trim() || desc || `${name} — 지도칸`,
    seoKeywords:
      p.seoKeywords?.trim() ||
      [name, "지도칸", "JIDOKAAN"].filter(Boolean).join(", "),
  };
}

export function normalizeProduct(p: Product): Product {
  const majorId = inferMajorId(p);
  const minorId = undefined;
  const category = (["custom", "ready", "care", "gear"].includes(p.category)
    ? p.category
    : p.customizable
      ? "custom"
      : "ready") as CategoryId;
  return fillProductSeo({
    ...p,
    badge: undefined,
    minorId,
    majorId,
    category,
    createdAt: p.createdAt || new Date().toISOString(),
    visible: p.visible !== false,
    sortOrder: p.sortOrder ?? 0,
    options: p.options ?? EMPTY_OPTIONS,
  });
}
