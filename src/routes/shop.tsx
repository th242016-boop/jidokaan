import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { ProductCard } from "@/components/store/product-card";
import { SiteShell } from "@/components/store/site-shell";
import { t } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";
import { majorsOf } from "@/lib/shop-taxonomy";
import { SeoTags } from "@/components/seo-tags";

const searchSchema = z.object({
  sort: z
    .enum(["featured", "price-asc", "price-desc", "rating"])
    .optional()
    .catch("featured"),
});

export const Route = createFileRoute("/shop")({
  validateSearch: searchSchema,
  component: ShopPage,
});

function ShopPage() {
  const { sort = "featured" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const locale = useStore((s) => s.locale);
  const dict = t(locale);
  const { catalog } = useCatalog();
  const [major, setMajor] = useState("");

  const products = useMemo(() => {
    const list = catalog.products.filter((p) => {
      if (p.visible === false) return false;
      if (major && p.majorId !== major) return false;
      return true;
    });
    switch (sort) {
      case "price-asc":
        return list.sort((a, b) => a.priceKrw - b.priceKrw);
      case "price-desc":
        return list.sort((a, b) => b.priceKrw - a.priceKrw);
      case "rating":
        return list.sort((a, b) => b.rating - a.rating);
      default:
        return list;
    }
  }, [sort, catalog.products, major]);

  const majors = majorsOf(catalog.categories);

  return (
    <SiteShell>
      <SeoTags
        title={catalog.seo.title}
        description={catalog.seo.description}
        keywords={catalog.seo.keywords}
      />
      <div className="container-page py-10 sm:py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {dict.shop.title}
            </h1>
            <p className="mt-2 text-muted">
              {products.length} {dict.shop.results}
            </p>
          </div>
          <label className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-surface px-3 py-2 text-sm text-muted">
            <span className="hidden sm:inline">{dict.shop.sort}</span>
            <select
              className="bg-transparent text-fg outline-none"
              value={sort}
              onChange={(e) =>
                navigate({
                  search: (prev) => ({
                    ...prev,
                    sort: e.target.value as typeof sort,
                  }),
                })
              }
            >
              <option value="featured">{dict.shop.sortFeatured}</option>
              <option value="price-asc">{dict.shop.sortPriceAsc}</option>
              <option value="price-desc">{dict.shop.sortPriceDesc}</option>
              <option value="rating">{dict.shop.sortRating}</option>
            </select>
          </label>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <Chip active={!major} onClick={() => setMajor("")}>
            전체
          </Chip>
          {majors.map((c) => (
            <Chip
              key={c.id}
              active={major === c.id}
              onClick={() => setMajor(c.id)}
            >
              {c.name}
            </Chip>
          ))}
        </div>

        {products.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center text-muted">
            {dict.shop.empty}
          </p>
        ) : (
          <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm ${
        active
          ? "border-primary bg-primary text-primary-fg"
          : "border-border bg-surface text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}
