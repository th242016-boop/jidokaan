import { Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CartItemVisual,
  customSpecLine,
} from "@/components/store/cart-item-visual";
import {
  formatMoney,
  formatProductPrice,
  lineTotal,
  pickLocalized,
  t,
} from "@/lib/i18n";
import { getProduct } from "@/lib/products";
import { formatCartSize } from "@/lib/simulator-config";
import { quoteShipping, shipCopy } from "@/lib/shipping";
import { useStore } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";

export function CartDrawer() {
  const locale = useStore((s) => s.locale);
  const currency = useStore((s) => s.currency);
  const cart = useStore((s) => s.cart);
  const cartOpen = useStore((s) => s.cartOpen);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const setQty = useStore((s) => s.setQty);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const subtotalUsd = useStore((s) => s.cartSubtotalUsdCents());
  const subtotalKrw = useStore((s) => s.cartSubtotalKrw());
  const dict = t(locale);
  const { catalog } = useCatalog();
  let country = currency === "KRW" ? "KR" : "US";
  if (typeof window !== "undefined") {
    try {
      country = sessionStorage.getItem("jidokaan-ship-country") || country;
    } catch {
      /* ignore */
    }
  }
  const qty = cart.reduce((n, i) => n + i.qty, 0);
  const quote = quoteShipping({
    country,
    method: "standard",
    subtotalKrw,
    subtotalUsd: Math.round(subtotalUsd / 100),
    qty,
    settings: catalog.shipping,
  });
  const copy = shipCopy(locale);

  const subtotalLabel =
    currency === "KRW"
      ? new Intl.NumberFormat("ko-KR", {
          style: "currency",
          currency: "KRW",
          maximumFractionDigits: 0,
        }).format(subtotalKrw)
      : formatMoney(subtotalUsd, currency);

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {dict.cart.title}
            {cart.length > 0 ? (
              <span className="ml-2 text-sm font-normal text-muted">
                ({cart.reduce((n, i) => n + i.qty, 0)})
              </span>
            ) : null}
          </SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-muted">{dict.cart.empty}</p>
            <Button variant="secondary" onClick={() => setCartOpen(false)} asChild>
              <Link to="/customize">{dict.nav.custom}</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {cart.map((item) => {
                const product = getProduct(item.productId);
                if (!product) return null;
                const spec = customSpecLine(item);
                return (
                  <div
                    key={`${item.productId}-${item.size ?? ""}-${item.color ?? ""}`}
                    className="flex gap-3 rounded-2xl border border-border bg-bg/60 p-3"
                  >
                    <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-[#111]">
                      <CartItemVisual item={item} className="size-full" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {pickLocalized(product.name, locale)}
                          </p>
                          {item.optionLabel ? (
                            <p className="text-xs text-subtle">{item.optionLabel}</p>
                          ) : item.size ? (
                            <p className="text-xs text-subtle">{formatCartSize(item, locale)}</p>
                          ) : null}
                          {spec ? (
                            <p className="mt-1 line-clamp-3 text-[10px] leading-snug text-subtle">
                              {spec}
                            </p>
                          ) : null}
                          <p className="price-num mt-1 text-sm text-muted">
                            {formatProductPrice(product, currency)}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="rounded-full p-1.5 text-subtle hover:bg-surface-muted hover:text-fg"
                          onClick={() =>
                            removeFromCart(item.productId, item.size, item.optionKey, item.sizeFit)
                          }
                          aria-label={dict.cart.remove}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center rounded-full border border-border bg-surface">
                          <button
                            type="button"
                            className="flex size-8 items-center justify-center rounded-full hover:bg-surface-muted"
                            onClick={() =>
                              setQty(item.productId, item.qty - 1, item.size, item.optionKey, item.sizeFit)
                            }
                            aria-label="Decrease"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="price-num w-7 text-center text-sm font-medium">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            className="flex size-8 items-center justify-center rounded-full hover:bg-surface-muted"
                            onClick={() =>
                              setQty(item.productId, item.qty + 1, item.size, item.optionKey, item.sizeFit)
                            }
                            aria-label="Increase"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                        <span className="price-num ml-auto text-sm font-semibold">
                          {lineTotal(product, item.qty, currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 border-t border-border px-5 py-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">{dict.cart.subtotal}</span>
                <span className="price-num font-semibold">{subtotalLabel}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">{dict.cart.shipping}</span>
                <span className="price-num text-muted">
                  {quote.free
                    ? locale === "ko"
                      ? "무료"
                      : "Free"
                    : currency === "KRW"
                      ? `₩${quote.krw.toLocaleString()}`
                      : `$${quote.usd}`}
                </span>
              </div>
              {quote.free ? (
                <p className="rounded-xl bg-accent-soft px-3 py-2 text-xs text-accent">
                  {country === "KR" ? copy.freeKr : copy.freeIntl}
                </p>
              ) : (
                <p className="text-xs text-muted">{copy.freeIntl}</p>
              )}
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="font-medium">{dict.cart.total}</span>
                <span className="price-num text-lg font-semibold">
                  {currency === "KRW"
                    ? new Intl.NumberFormat("ko-KR", {
                        style: "currency",
                        currency: "KRW",
                        maximumFractionDigits: 0,
                      }).format(subtotalKrw + quote.krw)
                    : formatMoney(subtotalUsd + quote.usd * 100, currency)}
                </span>
              </div>
              <Button className="w-full" asChild onClick={() => setCartOpen(false)}>
                <Link to="/checkout">{dict.cart.checkout}</Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setCartOpen(false)}
              >
                {dict.cart.continue}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
