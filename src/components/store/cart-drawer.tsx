import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DesignThumb } from "@/components/store/design-thumb";
import { KrOrderPanel } from "@/components/store/kr-order-panel";
import {
  formatMoney,
  formatProductPrice,
  lineTotal,
  pickLocalized,
  startOverseasCheckout,
  t,
} from "@/lib/i18n";
import { getProduct, naverProductUrl, productDisplayName, SMARTSTORE_HOME } from "@/lib/products";
import { quoteShipping, shipCopy } from "@/lib/shipping";
import { formatCartSize, useStore } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";

export function CartDrawer() {
  const locale = useStore((s) => s.locale);
  const currency = useStore((s) => s.currency);
  const cart = useStore((s) => s.cart);
  const cartOpen = useStore((s) => s.cartOpen);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const setCurrency = useStore((s) => s.setCurrency);
  const setQty = useStore((s) => s.setQty);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const subtotalUsd = useStore((s) => s.cartSubtotalUsdCents());
  const subtotalKrw = useStore((s) => s.cartSubtotalKrw());
  const dict = t(locale);
  const { catalog } = useCatalog();
  const [krOrder, setKrOrder] = useState(false);
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
                const swatches = item.partColors
                  ? [
                      item.partColors.a,
                      item.partColors.b,
                      item.partColors.e,
                      item.partColors.k,
                    ]
                  : [item.color].filter(Boolean);
                return (
                  <div
                    key={`${item.productId}-${item.size ?? ""}-${item.color ?? ""}`}
                    className="flex gap-3 rounded-2xl border border-border bg-bg/60 p-3"
                  >
                    <div className="size-24 shrink-0 overflow-hidden rounded-xl bg-[#111]">
                      <DesignThumb item={item} className="size-full" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {productDisplayName(product, locale)}
                          </p>
                          {item.optionLabel ? (
                            <p className="text-xs text-subtle">{item.optionLabel}</p>
                          ) : item.size ? (
                            <p className="text-xs text-subtle">
                              {formatCartSize(item, locale)}
                            </p>
                          ) : null}
                          {swatches.length > 0 ? (
                            <div className="mt-1 flex gap-1">
                              {swatches.map((c, i) => (
                                <span
                                  key={i}
                                  className="size-3 rounded-full border border-border"
                                  style={{ background: c as string }}
                                />
                              ))}
                            </div>
                          ) : null}
                          <p className="price-num mt-1 text-sm text-muted">
                            {formatProductPrice(product, currency)}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="rounded-full p-1.5 text-subtle hover:bg-surface-muted hover:text-fg"
                          onClick={() =>
                            removeFromCart(
                              item.productId,
                              item.size,
                              item.optionKey,
                              item.sizeFit,
                            )
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
                              setQty(
                                item.productId,
                                item.qty - 1,
                                item.size,
                                item.optionKey,
                                item.sizeFit,
                              )
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
                              setQty(
                                item.productId,
                                item.qty + 1,
                                item.size,
                                item.optionKey,
                                item.sizeFit,
                              )
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
              {country === "KR" ? (
                <p className="rounded-xl bg-surface-muted px-3 py-2 text-xs text-muted">
                  {copy.freeKr}
                </p>
              ) : null}
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
              {krOrder ? (
                <KrOrderPanel
                  naverUrl={(() => {
                    const p = cart[0] ? getProduct(cart[0].productId) : undefined;
                    return p ? naverProductUrl(p) : SMARTSTORE_HOME;
                  })()}
                  onOverseas={() => {
                    startOverseasCheckout();
                    setCurrency("USD");
                    setCartOpen(false);
                    window.location.assign("/checkout");
                  }}
                />
              ) : (
                <Button
                  className="w-full"
                  asChild={country !== "KR"}
                  onClick={() => {
                    if (country === "KR") setKrOrder(true);
                    else setCartOpen(false);
                  }}
                >
                  {country === "KR" ? (
                    dict.cart.checkout
                  ) : (
                    <Link to="/checkout">{dict.cart.checkout}</Link>
                  )}
                </Button>
              )}
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
