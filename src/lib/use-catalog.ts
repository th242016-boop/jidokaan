import { publicCatalog } from "./public-catalog";
import { IS_REVIEW_PREVIEW } from "./review-preview";
import { useEffect, useState } from "react";
import { setCatalogCache } from "./catalog-cache";
import { PRODUCTS } from "./products";
import { reviewCatalogProducts } from "./review-catalog";
import { DEFAULT_COMPANY, DEFAULT_NOTICE, DEFAULT_SUPPORT } from "./site-defaults";
import type { InfoRow, StoreNotice } from "./site-defaults";
import type { Product } from "./products";
import type { Coupon } from "./order-types";
import type { BlackCustomer, FaqItem } from "./store-extras";
import { DEFAULT_PAY, type PaySettings } from "./pay-settings";
import { DEFAULT_SHIPPING, type ShippingSettings } from "./shipping";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SEO,
  normalizeProduct,
  type ShopCategory,
  type SiteSeo,
} from "./shop-taxonomy";

export type CatalogPayload = {
  products: Product[];
  company: InfoRow[];
  support: InfoRow[];
  categories: ShopCategory[];
  seo: SiteSeo;
  shipping: ShippingSettings;
  notice: StoreNotice;
  coupons: Coupon[];
  pay: PaySettings;
  faqs: FaqItem[];
  blacklist: BlackCustomer[];
  hasPin: boolean;
};

const fallback: CatalogPayload = {
  products: (IS_REVIEW_PREVIEW ? reviewCatalogProducts() : PRODUCTS).map(normalizeProduct),
  company: DEFAULT_COMPANY,
  support: DEFAULT_SUPPORT,
  categories: DEFAULT_CATEGORIES,
  seo: DEFAULT_SEO,
  shipping: DEFAULT_SHIPPING,
  notice: DEFAULT_NOTICE,
  coupons: [],
  pay: DEFAULT_PAY,
  faqs: [],
  blacklist: [],
  hasPin: false,
};

let memory: CatalogPayload | null = null;
const listeners = new Set<(c: CatalogPayload) => void>();

function publish(next: CatalogPayload) {
  const storefront = { ...publicCatalog(next), coupons: [], blacklist: [] };
  memory = storefront;
  setCatalogCache(storefront.products);
  listeners.forEach((fn) => fn(storefront));
}

export function normalizeCatalog(data: CatalogPayload): CatalogPayload {
  return {
    ...fallback,
    ...publicCatalog(data),
    products: (data.products ?? []).map(normalizeProduct),
    categories: data.categories?.length ? data.categories : DEFAULT_CATEGORIES,
    seo: data.seo ?? DEFAULT_SEO,
    shipping: data.shipping ?? DEFAULT_SHIPPING,
    notice: data.notice ?? DEFAULT_NOTICE,
    coupons: data.coupons ?? [],
    faqs: data.faqs ?? [],
    blacklist: data.blacklist ?? [],
  };
}

export async function fetchCatalog(token = "", signal?: AbortSignal): Promise<CatalogPayload> {
  if (IS_REVIEW_PREVIEW) return fallback;
  const res = await fetch("/api/catalog", {
    cache: "no-store",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    signal,
  });
  if (!res.ok) throw new Error(res.status === 401 ? "AUTH" : "catalog");
  return normalizeCatalog(await res.json());
}

export function useCatalog() {
  const [catalog, setCatalog] = useState<CatalogPayload>(memory ?? fallback);
  const [ready, setReady] = useState(Boolean(memory));

  useEffect(() => {
    const sub = (next: CatalogPayload) => {
      setCatalog(next);
      setReady(true);
    };
    listeners.add(sub);
    void fetchCatalog()
      .then((data) => publish(data))
      .catch(() => {
        if (!memory) publish(fallback);
      });
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void fetchCatalog().then(publish).catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      listeners.delete(sub);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return { catalog, ready, replace: publish };
}
