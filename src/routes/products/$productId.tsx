import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Minus, Plus, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/product-card";
import { ProductDetailStory } from "@/components/store/product-detail-story";
import { KrOrderPanel } from "@/components/store/kr-order-panel";
import { ProductVisual } from "@/components/store/product-visual";
import { SiteShell } from "@/components/store/site-shell";
import {
  formatProductCompare,
  formatProductPrice,
  isDomesticCustomer,
  pickLocalized,
  t,
} from "@/lib/i18n";
import { findSku } from "@/lib/product-options";
import {
  closestBootSize,
  MEN_BOOT_SIZES,
  naverProductUrl,
  productGallery,
  WOMEN_BOOT_SIZES,
  type Product,
} from "@/lib/products";
import { useStore } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";
import { SeoTags } from "@/components/seo-tags";
import { trackStoreEvent } from "@/components/analytics-tracker";

export const Route = createFileRoute("/products/$productId")({
  component: ProductPage,
});

function ProductPage() {
  const { productId } = Route.useParams();
  const { catalog, ready } = useCatalog();
  const product = catalog.products.find((p) => p.id === productId);

  if (!ready) {
    return (
      <SiteShell>
        <div className="container-page py-20 text-center text-muted">…</div>
      </SiteShell>
    );
  }
  if (!product || product.visible === false) {
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
  const draftFit = useStore((s) => s.draftFit);
  const draftSize = useStore((s) => s.draftSize);
  const setDraftFit = useStore((s) => s.setDraftFit);
  const setDraftSize = useStore((s) => s.setDraftSize);
  const dict = t(locale);

  const [qty, setQty] = useState(1);
  const [krOrder, setKrOrder] = useState(false);
  const navigate = useNavigate();
  const [size, setSize] = useState(
    product.sizes?.[5] ?? product.sizes?.[0] ?? "",
  );
  const [color, setColor] = useState(product.colors[0] ?? "#111111");
  const [picked, setPicked] = useState<Record<string, string>>({});
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
            p.visible !== false &&
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
  const optionOk =
    !optionOn ||
    (selectedValues.every(Boolean) && Boolean(sku && sku.stock > 0));

  function handleAdd() {
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

  function handleOrder() {
    if (optionOn && !optionOk) {
      toast.error(locale === "ko" ? "품절이거나 없는 옵션입니다." : "Option unavailable");
      return;
    }
    if (isDomesticCustomer(currency)) {
      setKrOrder(true);
      return;
    }
    handleAdd();
    navigate({ to: "/checkout" });
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
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {pickLocalized(product.name, locale)}
              </h1>
              <p className="text-base text-muted">
                {pickLocalized(product.tagline, locale)}
              </p>
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

            {product.customizable ? (
              <div className="mt-8 space-y-6">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{dict.product.size}</p>
                    <div className="flex gap-1.5">
                      {(["women", "men"] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            const next = g === "women" ? WOMEN_BOOT_SIZES : MEN_BOOT_SIZES;
                            setDraftFit(g);
                            if (!next.includes(draftSize)) {
                              setDraftSize(closestBootSize(draftSize, next));
                            }
                          }}
                          className={`h-9 rounded-full px-3.5 text-sm font-medium ${
                            draftFit === g
                              ? "bg-primary text-primary-fg"
                              : "border border-border bg-surface text-muted hover:text-fg"
                          }`}
                        >
                          {g === "men" ? dict.custom.men : dict.custom.women}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(draftFit === "women" ? WOMEN_BOOT_SIZES : MEN_BOOT_SIZES).map(
                      (s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setDraftSize(s)}
                          className={`min-h-11 min-w-14 rounded-full border px-3 text-sm font-medium transition-colors ${
                            draftSize === s
                              ? "border-primary bg-primary text-primary-fg"
                              : "border-border bg-surface text-muted hover:text-fg"
                          }`}
                        >
                          {s}
                        </button>
                      ),
                    )}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted">
                    {dict.custom.sizeGuideBody}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" className="h-14 flex-1 text-base font-semibold" asChild>
                    <Link to="/customize">{dict.product.customOrder}</Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-14 flex-1 text-base font-semibold"
                    type="button"
                    onClick={() => toast.message(dict.product.specialSoon)}
                  >
                    {dict.product.specialOrder}
                  </Button>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
                  <Truck className="mt-0.5 size-5 shrink-0 text-accent" />
                  <div className="text-sm">
                    <p className="font-medium">{dict.product.shipsWorldwide}</p>
                    <p className="mt-1 text-muted">{dict.product.freeOver}</p>
                  </div>
                </div>
                {product.leadDays ? (
                  <p className="text-sm text-muted">
                    <span className="font-medium text-fg">{dict.product.leadTime}: </span>
                    {locale === "ko" ? "평균 20~30일" : "typically 20–30 days"}
                  </p>
                ) : null}
              </div>
            ) : null}

            {!product.customizable ? (
            <div className="mt-8 space-y-6">
              {optionOn ? (
                <div className="space-y-4">
                  {(product.options?.groups ?? []).map((g) => (
                    <div key={g.name}>
                      <p className="mb-2 text-sm font-medium">{g.name}</p>
                      <select
                        className="h-12 w-full rounded-lg border border-border bg-surface px-3 text-sm"
                        value={picked[g.name] ?? ""}
                        onChange={(e) =>
                          setPicked((s) => ({ ...s, [g.name]: e.target.value }))
                        }
                      >
                        <option value="">
                          {locale === "ko" ? "아래 옵션 중 선택" : "Select an option"}
                        </option>
                        {g.values.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {selectedValues.every(Boolean) ? (
                    sku ? (
                      <p className="text-xs text-muted">
                        {sku.stock > 0
                          ? locale === "ko"
                            ? `재고 ${sku.stock}개${extraKrw ? ` · 추가 ₩${extraKrw.toLocaleString()}` : ""}`
                            : `Stock ${sku.stock}`
                          : locale === "ko"
                            ? "이 옵션은 품절입니다"
                            : "Sold out"}
                      </p>
                    ) : (
                      <p className="text-xs text-muted">
                        {locale === "ko" ? "선택 불가 조합입니다." : "Unavailable combination"}
                      </p>
                    )
                  ) : (
                    <p className="text-xs text-muted">
                      {locale === "ko" ? "옵션을 모두 선택해 주세요." : "Please select all options."}
                    </p>
                  )}
                </div>
              ) : null}

              {!optionOn && product.sizes && product.sizes.length > 0 ? (
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
                            ? "border-primary bg-primary ring-2 ring-primary/30"
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

            <div className="flex flex-col gap-3 sm:flex-row">
                {krOrder ? (
                  <KrOrderPanel
                    naverUrl={naverProductUrl(product)}
                    onOverseas={() => {
                      setKrOrder(false);
                      handleAdd();
                      navigate({ to: "/checkout" });
                    }}
                  />
                ) : (
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleOrder}
                  disabled={!optionOk}
                >
                  {justAdded ? (
                    <>
                      <Check className="size-4" /> {dict.product.added}
                    </>
                  ) : (
                    dict.cart.checkout
                  )}
                </Button>
                )}
            </div>

            <div className="space-y-3">
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
            </div>
            ) : null}
          </div>
        </div>
      </div>

      <ProductDetailStory product={product} locale={locale} />

      {related.length > 0 ? (
        <div className="container-page pb-16">
          <section className="mt-16">
            <h2 className="mb-6 text-xl font-semibold">{dict.product.related}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </SiteShell>
  );
}

