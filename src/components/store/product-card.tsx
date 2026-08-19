import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProductVisual } from "@/components/store/product-visual";
import { formatProductCompare, formatProductPrice, pickLocalized } from "@/lib/i18n";
import type { Product } from "@/lib/products";
import { useStore } from "@/lib/store";

export function ProductCard({ product }: { product: Product }) {
  const locale = useStore((s) => s.locale);
  const currency = useStore((s) => s.currency);
  const compare = formatProductCompare(product, currency);

  return (
    <Link
      to="/products/$productId"
      params={{ productId: product.id }}
      className="group flex flex-col gap-3 rounded-2xl outline-none focus-ring"
    >
      <div className="relative overflow-hidden rounded-2xl transition-transform duration-250 group-hover:-translate-y-0.5">
        <ProductVisual product={product} className="shadow-soft" />
        {product.badge ? (
          <Badge variant="accent" className="absolute top-3 left-3">
            {pickLocalized(product.badge, locale)}
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5 px-0.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[0.95rem] font-medium leading-snug text-fg">
            {pickLocalized(product.name, locale)}
          </h3>
          <div className="shrink-0 text-right">
            <p className="price-num text-sm font-semibold text-fg">
              {formatProductPrice(product, currency)}
            </p>
            {compare ? (
              <p className="price-num text-xs text-subtle line-through">{compare}</p>
            ) : null}
          </div>
        </div>
        <p className="line-clamp-2 text-sm text-muted">
          {pickLocalized(product.tagline, locale)}
        </p>
        <div className="flex items-center gap-1 text-xs text-subtle">
          <Star className="size-3.5 fill-accent text-accent" />
          <span className="price-num font-medium text-fg">{product.rating}</span>
          <span>({product.reviews})</span>
        </div>
      </div>
    </Link>
  );
}
