import { useCallback, useEffect, useState } from "react";
import { setCatalogCache } from "./catalog-cache";
import { PRODUCTS } from "./products";
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
  products: PRODUCTS.map(normalizeProduct),
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
  memory = next;
  setCatalogCache(next.products);
  listeners.forEach((fn) => fn(next));
}

export async function fetchCatalog(): Promise<CatalogPayload> {
  const res = await fetch("/api/catalog", { cache: "no-store" });
  if (!res.ok) throw new Error("catalog");
  const data = (await res.json()) as CatalogPayload;
  return {
    ...fallback,
    ...data,
    products: (data.products ?? []).map(normalizeProduct),
    categories: data.categories?.length ? data.categories : DEFAULT_CATEGORIES,
    seo: data.seo ?? DEFAULT_SEO,
    shipping: data.shipping ?? DEFAULT_SHIPPING,
    notice: data.notice ?? DEFAULT_NOTICE,
    coupons: data.coupons ?? [],
    pay: data.pay ?? DEFAULT_PAY,
    faqs: data.faqs ?? [],
    blacklist: data.blacklist ?? [],
  };
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

  const replace = useCallback((next: CatalogPayload) => {
    publish({
      ...fallback,
      ...next,
      products: (next.products ?? []).map(normalizeProduct),
      categories: next.categories?.length ? next.categories : DEFAULT_CATEGORIES,
      seo: next.seo ?? DEFAULT_SEO,
      shipping: next.shipping ?? DEFAULT_SHIPPING,
      notice: next.notice ?? DEFAULT_NOTICE,
      coupons: next.coupons ?? [],
      pay: next.pay ?? DEFAULT_PAY,
      faqs: next.faqs ?? [],
      blacklist: next.blacklist ?? [],
    });
  }, []);

  return { catalog, ready, replace };
}
