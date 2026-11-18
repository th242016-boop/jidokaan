import { specialOrderCopy } from "@/lib/special-order-copy";
import { SpecialOrderNotice } from "@/components/store/special-order-notice";
import { japanYenQuote } from "@/lib/order-money";
import { formatYen, paymentCurrencyNotice } from "@/lib/storefront-money";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/store/site-shell";
import { customerOptionLabel } from "@/lib/customer-order-view";
import { KrOrderPanel } from "@/components/store/kr-order-panel";
import { Button } from "@/components/ui/button";
import { formatMoney, lineTotal, startOverseasCheckout, t } from "@/lib/i18n";
import { getProduct, naverProductUrl, productDisplayName, SMARTSTORE_HOME } from "@/lib/products";
import { useCatalog } from "@/lib/use-catalog";
import { formatCartSize, naverCartProductId, useStore } from "@/lib/store";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const locale = useStore((s) => s.locale);
  const currency = useStore((s) => s.currency);
  const country = useStore((s) => s.shippingCountry);
  const setShippingCountry = useStore((s) => s.setShippingCountry);
  const cart = useStore((s) => s.cart);
  const subtotalUsd = useStore((s) => s.cartSubtotalUsdCents());
  const subtotalKrw = useStore((s) => s.cartSubtotalKrw());
  const dict = t(locale);
  const { catalog } = useCatalog();
  const [krOrder, setKrOrder] = useState(false);
  const domestic = country === "KR";
  const yen = japanYenQuote(country, cart.map(item => ({...getProduct(item.productId), productId: item.productId, qty: item.qty, priceUsd: ((getProduct(item.productId)?.priceUsd ?? 0) + (item.extraUsd ?? 0)) / 100})));
  const subtotalLabel =
    currency === "KRW"
      ? new Intl.NumberFormat("ko-KR", {
          style: "currency",
          currency: "KRW",
          maximumFractionDigits: 0,
        }).format(subtotalKrw)
      : yen ? formatYen(yen.subtotalJpy, locale) : formatMoney(subtotalUsd, currency);

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
              {cart.map((item, index) => {
                const product =
                  catalog.products.find((p) => p.id === item.productId) ??
                  getProduct(item.productId);
                const name = product ? productDisplayName(product, locale) : item.productId;
                return (
                  <li
                    key={`${item.productId}-${item.specialOrder ? "special" : "standard"}-${item.size}-${item.optionKey}-${item.sizeFit}-${JSON.stringify(item.partNames)}`}
                    className="flex justify-between gap-4 rounded-2xl border border-border bg-surface p-4"
                  >
                    <div>
                      <p className="font-medium">{name}</p>
                      {item.specialOrder ? <p className="text-sm font-semibold text-red-700">{specialOrderCopy(locale).special}</p> : null}
                      {item.optionLabel ? <p className="text-sm text-muted">{customerOptionLabel(item.optionLabel, locale)}</p> : null}
                      {item.size ? <p className="text-sm text-muted">{formatCartSize(item, locale)}</p> : null}
                      <p className="mt-1 text-sm text-muted">
                        {dict.cart.qty} {item.qty}
                      </p>
                    </div>
                    {product ? (
                      <p className="price-num text-sm font-semibold">
                        {yen ? formatYen(yen.unitPricesJpy[index] * item.qty, locale) : lineTotal({...product,priceKrw:product.priceKrw+(item.extraKrw??0),priceUsd:product.priceUsd+(item.extraUsd??0)}, item.qty, currency)}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <div className="h-fit space-y-4 rounded-2xl border border-border bg-surface p-5">
              {cart.some(item => item.specialOrder) ? <SpecialOrderNotice locale={locale} /> : null}
              <p className="flex justify-between text-sm">
                <span>{dict.cart.subtotal}</span>
                <span className="price-num font-semibold">{subtotalLabel}</span>
              </p>
              {country === "JP" ? <p className="text-xs leading-relaxed text-muted">{paymentCurrencyNotice(locale, yen ? "JPY" : "USD")}</p> : null}
              {krOrder && domestic ? (
                <KrOrderPanel
                  naverUrl={(() => {
                    const id = cart[0] ? naverCartProductId(cart[0]) : undefined;
                    const p = id
                      ? (catalog.products.find((x) => x.id === id) ?? getProduct(id))
                      : undefined;
                    return p ? naverProductUrl(p) : SMARTSTORE_HOME;
                  })()}
                  onOverseas={() => {
                    startOverseasCheckout();
                    if (country === "KR") setShippingCountry("");
                    window.location.assign("/checkout");
                  }}
                />
              ) : domestic ? (
                <Button className="w-full" type="button" onClick={() => setKrOrder(true)}>
                  {dict.cart.checkout}
                </Button>
              ) : (
                <Button className="w-full" asChild>
                  <Link to="/checkout">{dict.cart.checkout}</Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </SiteShell>
  );
}
