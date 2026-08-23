import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/store/site-shell";
import { Button } from "@/components/ui/button";
import { formatMoney, formatProductPrice, pickLocalized, t } from "@/lib/i18n";
import { getProduct } from "@/lib/products";
import { useCatalog } from "@/lib/use-catalog";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const locale = useStore((s) => s.locale);
  const currency = useStore((s) => s.currency);
  const cart = useStore((s) => s.cart);
  const subtotalUsd = useStore((s) => s.cartSubtotalUsdCents());
  const subtotalKrw = useStore((s) => s.cartSubtotalKrw());
  const dict = t(locale);
  const { catalog } = useCatalog();
  const subtotalLabel =
    currency === "KRW"
      ? new Intl.NumberFormat("ko-KR", {
          style: "currency",
          currency: "KRW",
          maximumFractionDigits: 0,
        }).format(subtotalKrw)
      : formatMoney(subtotalUsd, currency);

  return (
    <SiteShell>
      <div className="container-page py-12">
        <h1 className="text-3xl font-semibold">{dict.cart.title}</h1>
        {cart.length === 0 ? (
          <div className="mt-8 space-y-4">
            <p className="text-muted">{dict.cart.empty}</p>
            <Button asChild>
              <Link to="/shop">{dict.cart.emptyCta}</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
            <ul className="space-y-4">
              {cart.map((item) => {
                const product =
                  catalog.products.find((p) => p.id === item.productId) ??
                  getProduct(item.productId);
                const name = product
                  ? pickLocalized(product.name, locale)
                  : item.productId;
                return (
                  <li
                    key={`${item.productId}-${item.size ?? ""}-${item.optionKey ?? ""}`}
                    className="flex justify-between gap-4 rounded-2xl border border-border bg-surface p-4"
                  >
                    <div>
                      <p className="font-medium">{name}</p>
                      {item.size ? (
                        <p className="text-sm text-muted">{item.size}</p>
                      ) : null}
                      <p className="mt-1 text-sm text-muted">
                        {dict.cart.qty} {item.qty}
                      </p>
                    </div>
                    {product ? (
                      <p className="price-num text-sm font-semibold">
                        {formatProductPrice(product, currency)}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <div className="h-fit space-y-4 rounded-2xl border border-border bg-surface p-5">
              <p className="flex justify-between text-sm">
                <span>{dict.cart.subtotal}</span>
                <span className="price-num font-semibold">{subtotalLabel}</span>
              </p>
              <Button className="w-full" asChild>
                <Link to="/checkout">{dict.cart.checkout}</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </SiteShell>
  );
}
