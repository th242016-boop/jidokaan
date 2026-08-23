import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Minus, Plus, Star, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/product-card";
import { ProductVisual } from "@/components/store/product-visual";
import { SiteShell } from "@/components/store/site-shell";
import {
  formatProductCompare,
  formatProductPrice,
  pickLocalized,
  t,
} from "@/lib/i18n";
import { findSku } from "@/lib/product-options";
import { getProduct, productGallery, type Product } from "@/lib/products";
import { useStore } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";
import { SeoTags } from "@/components/seo-tags";
import { trackStoreEvent } from "@/components/analytics-tracker";
import type { StoreReview } from "@/lib/order-types";
import { RepairNotice } from "@/components/store/repair-notice";

export const Route = createFileRoute("/products/$productId")({
  component: ProductPage,
});

function ProductPage() {
  const { productId } = Route.useParams();
  const { catalog, ready } = useCatalog();
  const product =
    catalog.products.find((p) => p.id === productId) ?? getProduct(productId);

  if (!ready) {
    return (
      <SiteShell>
        <div className="container-page py-20 text-center text-muted">…</div>
      </SiteShell>
    );
  }
  if (!product) {
    return (
      <SiteShell>
        <div className="container-page flex min-h-[40vh] flex-col items-center justify-center gap-4 py-20 text-center">
          <p className="text-muted">상품을 찾을 수 없습니다.</p>
          <Button asChild>
            <Link to="/shop">샵으로</Link>
          </Button>
        </div>
      </SiteShell>
    );
  }
  return (
    <ProductDetail product={product} catalogProducts={catalog.products} />
  );
}

function ProductDetail({
  product,
  catalogProducts,
}: {
  product: Product;
  catalogProducts: Product[];
}) {
  const locale = useStore((s) => s.locale);
  const currency = useStore((s) => s.currency);
  const addToCart = useStore((s) => s.addToCart);
  const dict = t(locale);

  const [qty, setQty] = useState(1);
  const [size, setSize] = useState(
    product.sizes?.[5] ?? product.sizes?.[0] ?? "",
  );
  const [color, setColor] = useState(product.colors[0] ?? "#111111");
  const [picked, setPicked] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    for (const g of product.options?.groups ?? []) {
      if (g.values[0]) o[g.name] = g.values[0];
    }
    return o;
  });
  const [justAdded, setJustAdded] = useState(false);
  const [shot, setShot] = useState(0);
  const gallery = productGallery(product);

  const compare = formatProductCompare(product, currency);
  const related = useMemo(
    () =>
      catalogProducts
        .filter(
          (p) =>
            p.id !== product.id &&
            (p.category === product.category || p.category === "ready"),
        )
        .slice(0, 3),
    [catalogProducts, product],
  );

  const optionOn = Boolean(product.options?.enabled && product.options.groups.length);
  const selectedValues = optionOn
    ? (product.options?.groups ?? []).map((g) => picked[g.name] ?? g.values[0] ?? "")
    : [];
  const sku = optionOn ? findSku(product.options, selectedValues) : null;
  const extraKrw = sku?.extraKrw ?? 0;
  const extraUsd = sku?.extraUsd ?? 0;
  const optionOk = !optionOn || Boolean(sku && sku.stock > 0);

  function handleAdd() {
    if (!product.inStock) {
      toast.error(dict.shop.outOfStock);
      return;
    }
    if (optionOn && !optionOk) {
      toast.error(locale === "ko" ? "품절이거나 없는 옵션입니다." : "Option unavailable");
      return;
    }
    addToCart(product.id, qty, {
      size: selectedValues.join(" / ") || size || undefined,
      optionKey: sku?.key,
      optionLabel: sku?.key,
      extraKrw,
      extraUsd,
      color,
    });
    trackStoreEvent("cart", { path: `/products/${product.id}` });
    setJustAdded(true);
    toast.success(dict.product.added);
    window.setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <SiteShell>
      <SeoTags
        title={product.seoTitle}
        description={product.seoDescription}
        keywords={product.seoKeywords}
      />
      <div className="container-page py-8 sm:py-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            {gallery.length > 0 ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-2xl bg-surface shadow-soft">
                  <img
                    src={gallery[shot] ?? gallery[0]}
                    alt=""
                    className="aspect-[4/5] w-full object-contain"
                  />
                </div>
                {gallery.length > 1 ? (
                  <div className="flex gap-2 overflow-x-auto">
                    {gallery.map((src, i) => (
                      <button
                        key={`${i}-${src.slice(0, 20)}`}
                        type="button"
                        onClick={() => setShot(i)}
                        className={`size-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                          shot === i ? "border-primary" : "border-transparent"
                        }`}
                      >
                        <img src={src} alt="" className="size-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <ProductVisual
                product={product}
                large
                className="shadow-soft"
                upperColor={color}
                stripeColor={product.accent}
                soleColor={product.colors[product.colors.length - 1]}
              />
            )}
          </div>

          <div className="flex flex-col">
            <div className="space-y-3">
              {product.badge ? (
                <Badge variant="accent">
                  {pickLocalized(product.badge, locale)}
                </Badge>
              ) : null}
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {pickLocalized(product.name, locale)}
              </h1>
              <p className="text-base text-muted">
                {pickLocalized(product.tagline, locale)}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Star className="size-4 fill-accent text-accent" />
                <span className="price-num font-medium">{product.rating}</span>
                <span className="text-subtle">
                  ({product.reviews} {dict.product.reviews})
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-end gap-3">
              <p className="price-num text-3xl font-semibold">
                {formatProductPrice(product, currency)}
              </p>
              {compare ? (
                <p className="price-num pb-1 text-base text-subtle line-through">
                  {compare}
                </p>
              ) : null}
            </div>

            <p className="mt-3 text-sm font-medium">
              {product.inStock ? dict.shop.inStock : dict.shop.outOfStock}
            </p>

            {product.customizable ? (
              <p className="mt-4 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted">
                {dict.product.customHint}
              </p>
            ) : null}

            <RepairNotice className="mt-4" />

            <div className="mt-8 space-y-6">
              {optionOn ? (
                <div className="space-y-4">
                  {(product.options?.groups ?? []).map((g) => (
                    <div key={g.name}>
                      <p className="mb-2 text-sm font-medium">{g.name}</p>
                      <div className="flex flex-wrap gap-2">
                        {g.values.map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setPicked((s) => ({ ...s, [g.name]: v }))}
                            className={`min-h-11 min-w-14 rounded-full border px-3 text-sm font-medium ${
                              picked[g.name] === v
                                ? "border-primary bg-primary text-primary-fg"
                                : "border-border bg-surface text-muted hover:text-fg"
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {sku ? (
                    <p className="text-xs text-muted">
                      {sku.stock > 0
                        ? locale === "ko"
                          ? `재고 ${sku.stock} · 추가 ${extraKrw ? `₩${extraKrw.toLocaleString()}` : "없음"}`
                          : `Stock ${sku.stock}`
                        : locale === "ko"
                          ? "이 옵션은 품절입니다"
                          : "Sold out"}
                    </p>
                  ) : (
                    <p className="text-xs text-muted">
                      {locale === "ko" ? "선택 불가 조합입니다." : "Unavailable combination"}
                    </p>
                  )}
                </div>
              ) : product.sizes && product.sizes.length > 0 ? (
                <div>
                  <p className="mb-2 text-sm font-medium">{dict.product.size}</p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        className={`min-h-11 min-w-14 rounded-full border px-3 text-sm font-medium transition-colors ${
                          size === s
                            ? "border-primary bg-primary text-primary-fg"
                            : "border-border bg-surface text-muted hover:text-fg"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {product.colors.length > 0 && !product.customizable ? (
                <div>
                  <p className="mb-2 text-sm font-medium">{dict.product.color}</p>
                  <div className="flex gap-2">
                    {product.colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`size-9 rounded-full border-2 transition ${
                          color === c
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border"
                        }`}
                        style={{ background: c }}
                        aria-label={c}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <p className="mb-2 text-sm font-medium">{dict.product.qty}</p>
                <div className="inline-flex items-center rounded-full border border-border bg-surface">
                  <button
                    type="button"
                    className="flex size-11 items-center justify-center rounded-full hover:bg-surface-muted"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="price-num w-10 text-center font-medium">
                    {qty}
                  </span>
                  <button
                    type="button"
                    className="flex size-11 items-center justify-center rounded-full hover:bg-surface-muted"
                    onClick={() => setQty((q) => q + 1)}
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {product.customizable ? (
                <Button size="lg" className="flex-1" asChild>
                  <Link to="/customize">{dict.nav.custom}</Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleAdd}
                  disabled={!product.inStock || (!optionOk && !product.customizable)}
                >
                  {justAdded ? (
                    <>
                      <Check className="size-4" /> {dict.product.added}
                    </>
                  ) : (
                    dict.product.addToCart
                  )}
                </Button>
              )}
              {product.inStock ? (
                <Button
                  size="lg"
                  variant="secondary"
                  className="flex-1"
                  asChild
                  onClick={handleAdd}
                >
                  <Link to="/checkout">{dict.product.buyNow}</Link>
                </Button>
              ) : (
                <Button size="lg" variant="secondary" className="flex-1" disabled>
                  {dict.shop.outOfStock}
                </Button>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
                <Truck className="mt-0.5 size-5 shrink-0 text-accent" />
                <div className="text-sm">
                  <p className="font-medium">{dict.product.shipsWorldwide}</p>
                  <p className="mt-1 text-muted">{dict.product.freeOver}</p>
                </div>
              </div>
              {product.leadDays ? (
                <p className="text-sm text-muted">
                  <span className="font-medium text-fg">
                    {dict.product.leadTime}:{" "}
                  </span>
                  ~{product.leadDays} {dict.product.leadDays}
                </p>
              ) : null}
            </div>

            <div className="mt-8 space-y-4 border-t border-border pt-8">
              <h2 className="text-sm font-semibold tracking-wide text-subtle uppercase">
                {dict.product.description}
              </h2>
              <p className="leading-relaxed whitespace-pre-wrap text-muted">
                {pickLocalized(product.description, locale)}
              </p>
              {product.detailImages && product.detailImages.length > 0 ? (
                <div className="space-y-3">
                  {product.detailImages.map((src, i) => (
                    <img
                      key={`${i}-${src.slice(0, 20)}`}
                      src={src}
                      alt=""
                      className="w-full rounded-2xl"
                    />
                  ))}
                </div>
              ) : null}
              <dl className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-surface-muted/70 p-3">
                  <dt className="text-xs text-subtle">{dict.product.materials}</dt>
                  <dd className="mt-1 text-sm font-medium">
                    {pickLocalized(product.materials, locale)}
                  </dd>
                </div>
                <div className="rounded-2xl bg-surface-muted/70 p-3">
                  <dt className="text-xs text-subtle">{dict.product.weight}</dt>
                  <dd className="mt-1 text-sm font-medium">{product.weight}</dd>
                </div>
                <div className="rounded-2xl bg-surface-muted/70 p-3">
                  <dt className="text-xs text-subtle">{dict.product.shipsFrom}</dt>
                  <dd className="mt-1 text-sm font-medium">
                    {pickLocalized(product.shipsFrom, locale)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <ProductReviews product={product} locale={locale} />

        {related.length > 0 ? (
          <section className="mt-16">
            <h2 className="mb-6 text-xl font-semibold">{dict.product.related}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </SiteShell>
  );
}

function ProductReviews({
  product,
  locale,
}: {
  product: Product;
  locale: string;
}) {
  const ko = locale === "ko";
  const [items, setItems] = useState<StoreReview[]>([]);
  const [sent, setSent] = useState(false);
  useEffect(() => {
    void fetch(`/api/reviews?productId=${encodeURIComponent(product.id)}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }, [product.id]);

  return (
    <section className="mt-16 border-t border-border pt-10">
      <h2 className="text-xl font-semibold">{ko ? "리뷰" : "Reviews"}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((r) => (
          <li key={r.id} className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-sm font-medium">
              {"★".repeat(r.rating)} {r.name}
            </p>
            <p className="mt-1 text-sm text-muted">{r.body}</p>
          </li>
        ))}
        {items.length === 0 ? (
          <li className="text-sm text-muted">{ko ? "아직 리뷰가 없습니다." : "No reviews yet."}</li>
        ) : null}
      </ul>
      {sent ? (
        <p className="mt-6 text-sm">{ko ? "등록했습니다. 감사합니다." : "Thank you."}</p>
      ) : (
        <form
          className="mt-6 max-w-md space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void fetch("/api/reviews", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productId: product.id,
                productName: product.name.ko || product.name.en,
                name: fd.get("name"),
                rating: Number(fd.get("rating") || 5),
                body: fd.get("body"),
                website: fd.get("website"),
              }),
            }).then(() => setSent(true));
          }}
        >
          <p className="text-sm font-medium">{ko ? "리뷰 남기기" : "Write a review"}</p>
          <input name="name" required placeholder={ko ? "이름" : "Name"} className="h-10 w-full rounded-xl border border-border px-3 text-sm" />
          <select name="rating" className="h-10 w-full rounded-xl border border-border px-3 text-sm" defaultValue="5">
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {"★".repeat(n)}
              </option>
            ))}
          </select>
          <textarea name="body" required minLength={4} className="min-h-24 w-full rounded-xl border border-border px-3 py-2 text-sm" />
          <input name="website" className="hidden" tabIndex={-1} autoComplete="off" />
          <Button type="submit" size="sm">
            {ko ? "등록" : "Submit"}
          </Button>
        </form>
      )}
    </section>
  );
}
