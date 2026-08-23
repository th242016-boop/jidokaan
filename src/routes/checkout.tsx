import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CartItemVisual,
  customSpecLine,
  hasCustomSpec,
} from "@/components/store/cart-item-visual";
import { SiteShell } from "@/components/store/site-shell";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  COUNTRIES,
  countryName,
  currencyForCountry,
  formatMoney,
  lineTotal,
  pickLocalized,
  t,
} from "@/lib/i18n";
import { getProduct } from "@/lib/products";
import { formatCartSize } from "@/lib/simulator-config";
import { quoteShipping, shipCopy, type ShipMethod } from "@/lib/shipping";
import { useStore } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";
import { trackStoreEvent } from "@/components/analytics-tracker";
import { couponDiscount } from "@/lib/coupon";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

type PayMethod = "card" | "kakao" | "naver" | "transfer" | "paypal";

function CheckoutPage() {
  const locale = useStore((s) => s.locale);
  const currency = useStore((s) => s.currency);
  const setCurrency = useStore((s) => s.setCurrency);
  const cart = useStore((s) => s.cart);
  const clearCart = useStore((s) => s.clearCart);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const subtotalUsd = useStore((s) => s.cartSubtotalUsdCents());
  const subtotalKrw = useStore((s) => s.cartSubtotalKrw());
  const dict = t(locale);
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const { catalog } = useCatalog();
  const [placing, setPlacing] = useState(false);
  const [country, setCountry] = useState("KR");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pay, setPay] = useState<PayMethod>("card");
  const [shipMethod, setShipMethod] = useState<ShipMethod>("standard");
  const [depositor, setDepositor] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [appliedOff, setAppliedOff] = useState({ krw: 0, usdCents: 0 });
  const paySettings = catalog.pay;

  const coupon = (catalog.coupons ?? []).find(
    (c) => c.enabled !== false && c.code.toUpperCase() === appliedCode,
  );
  const discountKrw = appliedOff.krw;
  const discountUsd = appliedOff.usdCents;

  useEffect(() => {
    setCartOpen(false);
    try {
      const saved = sessionStorage.getItem("jidokaan-ship-country");
      if (saved) {
        setCountry(saved);
        setCurrency(currencyForCountry(saved));
      }
    } catch {
      /* ignore */
    }
  }, [setCartOpen, setCurrency]);

  useEffect(() => {
    if (!user) return;
    if (user.primaryEmail) setEmail(user.primaryEmail);
    if (user.displayName && !firstName) {
      const parts = user.displayName.trim().split(/\s+/);
      if (parts.length === 1) setFirstName(parts[0]);
      else {
        setFirstName(parts[0]);
        setLastName(parts.slice(1).join(" "));
      }
    }
  }, [user, firstName]);

  const isKrw = currency === "KRW";
  const isDomestic = country === "KR";
  const qty = cart.reduce((n, i) => n + i.qty, 0);
  const quote = quoteShipping({
    country,
    method: shipMethod,
    subtotalKrw,
    subtotalUsd: Math.round(subtotalUsd / 100),
    qty,
    settings: catalog.shipping,
  });
  const shippingUsd = quote.usd * 100;
  const shippingKrw = quote.krw;
  const totalUsd = Math.max(0, subtotalUsd - discountUsd) + shippingUsd;
  const totalKrw = Math.max(0, subtotalKrw - discountKrw) + shippingKrw;
  const copy = shipCopy(locale);

  async function applyCoupon() {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setAppliedCode("");
      setAppliedOff({ krw: 0, usdCents: 0 });
      setCouponMsg(locale === "ko" ? "코드를 입력하세요" : "Enter a code");
      return;
    }
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "checkCoupon",
        couponCode: code,
        email,
        totalKrw: subtotalKrw,
      }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      reason?: string | null;
      type?: string;
      percent?: number;
      offKrw?: number;
      offUsd?: number;
      code?: string;
    };
    if (!data.ok) {
      setAppliedCode("");
      setAppliedOff({ krw: 0, usdCents: 0 });
      setCouponMsg(data.reason || (locale === "ko" ? "쓸 수 없는 코드" : "Invalid code"));
      return;
    }
    const found = (catalog.coupons ?? []).find((c) => c.code.toUpperCase() === code);
    const off = found
      ? couponDiscount(found, subtotalKrw, subtotalUsd)
      : { krw: data.offKrw ?? 0, usdCents: (data.offUsd ?? 0) * 100 };
    setAppliedCode(code);
    setAppliedOff(off);
    setCouponMsg(locale === "ko" ? "적용됨" : "Applied");
  }

  const fmtKrw = (n: number) =>
    new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(n);

  const payOptions: { id: PayMethod; label: string }[] = isDomestic
    ? [
        { id: "card", label: dict.checkout.payCard },
        { id: "kakao", label: dict.checkout.payKakao },
        { id: "naver", label: dict.checkout.payNaver },
        { id: "transfer", label: dict.checkout.payTransfer },
      ]
    : [
        { id: "card", label: dict.checkout.payCard },
        { id: "paypal", label: dict.checkout.payPaypal },
        { id: "transfer", label: locale === "ko" ? "해외송금 / 계좌이체" : "Bank / wire transfer" },
      ];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (cart.length === 0) return;
    setPlacing(true);
    const fd = new FormData(e.currentTarget);
    const items = cart
      .map((item) => {
        const product = getProduct(item.productId);
        if (!product) return null;
        return {
          productId: item.productId,
          name: `${product.name.ko || product.name.en}${item.optionLabel ? ` (${item.optionLabel})` : ""}`,
          qty: item.qty,
          size: item.size,
          priceKrw: product.priceKrw + (item.extraKrw ?? 0),
          priceUsd: Math.round((product.priceUsd + (item.extraUsd ?? 0)) / 100),
          partNames: item.partNames,
          partColors: item.partColors,
        };
      })
      .filter(Boolean);
    let orderId = `JDK-${Date.now().toString(36).toUpperCase()}`;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone: String(fd.get("phone") ?? ""),
          name: `${lastName} ${firstName}`.trim(),
          address: String(fd.get("address") ?? ""),
          city: String(fd.get("city") ?? ""),
          region: String(fd.get("region") ?? ""),
          postal: String(fd.get("postal") ?? ""),
          country,
          pay,
          depositor,
          shipMethod,
          shippingKrw,
          shippingUsd: quote.usd,
          totalKrw,
          totalUsd: Math.round(totalUsd / 100),
          currency,
          items,
          couponCode: appliedCode || undefined,
          discountKrw,
          discountUsd: Math.round(discountUsd / 100),
        }),
      });
      const data = (await res.json()) as { order?: { id: string } };
      if (data.order?.id) orderId = data.order.id;
    } catch {
      /* still show success with local id */
    }
    try {
      sessionStorage.setItem(
        "jidokaan-last-order",
        JSON.stringify({
          orderId,
          email,
          country,
          pay,
          depositor,
          currency,
          shipMethod,
          shipping: isKrw ? shippingKrw : shippingUsd,
          total: isKrw ? totalKrw : totalUsd,
        }),
      );
    } catch {
      /* ignore */
    }
    clearCart();
    setPlacing(false);
    trackStoreEvent("order");
    navigate({
      to: "/order-success",
      search: { order: orderId },
    });
  }

  if (cart.length === 0) {
    return (
      <SiteShell>
        <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-muted">{dict.cart.empty}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/customize">{dict.nav.custom}</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/shop">{dict.cart.emptyCta}</Link>
            </Button>
          </div>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="container-page py-8 sm:py-12">
        <h1 className="mb-8 text-3xl font-semibold tracking-tight">
          {dict.checkout.title}
        </h1>

        {!isPending && !user ? (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">{dict.checkout.signInFirst}</p>
            <Button size="sm" asChild>
              <Link to="/login" search={{ next: "/checkout" }}>
                {dict.nav.signIn}
              </Link>
            </Button>
          </div>
        ) : null}

        <form
          onSubmit={onSubmit}
          className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="space-y-8">
            <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="mb-4 text-base font-semibold">
                {dict.checkout.contact}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="email">{dict.checkout.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="phone">{dict.checkout.phone}</Label>
                  <Input id="phone" name="phone" type="tel" autoComplete="tel" />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="mb-4 text-base font-semibold">
                {dict.checkout.shipping}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{dict.checkout.firstName}</Label>
                  <Input
                    id="firstName"
                    required
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{dict.checkout.lastName}</Label>
                  <Input
                    id="lastName"
                    required
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="address">{dict.checkout.address}</Label>
                  <Input id="address" name="address" required autoComplete="street-address" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">{dict.checkout.city}</Label>
                  <Input id="city" name="city" required autoComplete="address-level2" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">{dict.checkout.region}</Label>
                  <Input id="region" name="region" autoComplete="address-level1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal">{dict.checkout.postal}</Label>
                  <Input id="postal" name="postal" required autoComplete="postal-code" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">{dict.checkout.country}</Label>
                  <select
                    id="country"
                    className="flex h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-fg focus-ring"
                    value={country}
                    onChange={(e) => {
                      const next = e.target.value;
                      setCountry(next);
                      setCurrency(currencyForCountry(next));
                      setPay("card");
                    }}
                    required
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {countryName(c, locale)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>{copy.standard.includes("일반") ? "배송 방법" : "Shipping method"}</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(["standard", "express"] as const).map((m) => {
                      const q = quoteShipping({
                        country,
                        method: m,
                        subtotalKrw,
                        subtotalUsd: Math.round(subtotalUsd / 100),
                        qty,
                        settings: catalog.shipping,
                      });
                      const price = isKrw
                        ? q.krw === 0
                          ? locale === "ko" ? "무료" : "Free"
                          : fmtKrw(q.krw)
                        : q.usd === 0
                          ? "Free"
                          : `$${q.usd}`;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setShipMethod(m)}
                          className={cn(
                            "rounded-xl border px-4 py-3 text-left text-sm transition",
                            shipMethod === m
                              ? "border-fg bg-fg text-primary-fg"
                              : "border-border bg-surface-muted hover:border-border-strong",
                          )}
                        >
                          <span className="block font-semibold">
                            {m === "standard" ? copy.standard : copy.express}
                          </span>
                          <span className="mt-1 block text-xs opacity-80">
                            {copy.makeDays} {q.days} {copy.days} · {price}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted">{copy.production}</p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="mb-4 text-base font-semibold">
                {dict.checkout.payment}
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {payOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPay(opt.id)}
                    className={cn(
                      "h-12 rounded-xl border px-4 text-sm font-semibold transition",
                      pay === opt.id
                        ? "border-fg bg-fg text-primary-fg"
                        : "border-border bg-surface-muted text-fg hover:border-border-strong",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {pay === "transfer" ? (
                <BankBox
                  locale={locale}
                  domestic={isDomestic}
                  pay={paySettings}
                  amount={isKrw ? fmtKrw(totalKrw) : formatMoney(totalUsd, currency)}
                  depositor={depositor}
                  onDepositor={setDepositor}
                />
              ) : null}
              <p className="mt-4 text-xs text-subtle">{dict.checkout.payNote}</p>
            </section>
          </div>

          <aside className="h-fit rounded-3xl border border-border bg-surface p-5 sm:p-6 lg:sticky lg:top-24">
            <h2 className="mb-4 text-base font-semibold">
              {dict.checkout.summary}
            </h2>
            {cart.some(hasCustomSpec) ? (
              <div className="mb-5 overflow-hidden rounded-2xl border border-border bg-[#111]">
                <div className="aspect-square w-full">
                  <CartItemVisual
                    item={cart.find(hasCustomSpec) ?? cart[0]}
                    className="h-full w-full"
                  />
                </div>
              </div>
            ) : null}
            <div className="space-y-3">
              {cart.map((item) => {
                const product = getProduct(item.productId);
                if (!product) return null;
                const spec = customSpecLine(item);
                return (
                  <div
                    key={`${item.productId}-${item.size ?? ""}-${item.sizeFit ?? ""}-${item.color ?? ""}`}
                    className="flex gap-3"
                  >
                    <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-[#111]">
                      <CartItemVisual item={item} className="size-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {pickLocalized(product.name, locale)}
                      </p>
                      <p className="text-xs text-muted">
                        {dict.cart.qty} {item.qty}
                        {item.size ? ` · ${formatCartSize(item, locale)}` : ""}
                      </p>
                      {spec ? (
                        <p className="mt-1 line-clamp-3 text-[10px] leading-snug text-subtle">
                          {spec}
                        </p>
                      ) : null}
                    </div>
                    <p className="price-num shrink-0 text-sm font-medium">
                      {lineTotal(product, item.qty, currency)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">{dict.cart.subtotal}</span>
                <span className="price-num">
                  {isKrw ? fmtKrw(subtotalKrw) : formatMoney(subtotalUsd, currency)}
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponMsg("");
                  }}
                  placeholder={locale === "ko" ? "쿠폰 코드" : "Coupon code"}
                />
                <Button type="button" variant="secondary" onClick={() => void applyCoupon()}>
                  {locale === "ko" ? "적용" : "Apply"}
                </Button>
              </div>
              {couponMsg ? <p className="text-xs text-muted">{couponMsg}</p> : null}
              {discountKrw > 0 ? (
                <div className="flex justify-between text-success">
                  <span>쿠폰 {coupon?.code}</span>
                  <span>-{isKrw ? fmtKrw(discountKrw) : formatMoney(discountUsd, currency)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-muted">{dict.cart.shipping}</span>
                <span className="price-num">
                  {quote.free
                    ? locale === "ko"
                      ? "무료"
                      : "Free"
                    : isKrw
                      ? fmtKrw(shippingKrw)
                      : formatMoney(shippingUsd, currency)}
                </span>
              </div>
              {quote.free ? (
                <p className="rounded-xl bg-accent-soft px-3 py-2 text-xs text-accent">
                  {isDomestic ? copy.freeKr : copy.freeIntl}
                </p>
              ) : isDomestic ? (
                <p className="rounded-xl bg-surface-muted px-3 py-2 text-xs text-muted">
                  {copy.freeKr}
                </p>
              ) : (
                <p className="rounded-xl bg-surface-muted px-3 py-2 text-xs text-muted">
                  {copy.freeIntl}
                </p>
              )}
              {!isDomestic ? (
                <p className="text-xs leading-relaxed text-muted">
                  <span className="font-medium text-fg">{copy.dutyTitle}. </span>
                  {copy.dutyBody}
                </p>
              ) : null}
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <span>{dict.cart.total}</span>
                <span className="price-num">
                  {isKrw ? fmtKrw(totalKrw) : formatMoney(totalUsd, currency)}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="mt-6 w-full"
              disabled={placing}
            >
              {placing ? dict.checkout.placing : dict.checkout.placeOrder}
            </Button>
            <p className="mt-3 text-center text-xs text-subtle">jidokaan.com</p>
          </aside>
        </form>
      </div>
    </SiteShell>
  );
}

function BankBox({
  locale,
  domestic,
  pay,
  amount,
  depositor,
  onDepositor,
}: {
  locale: string;
  domestic: boolean;
  pay: {
    krBank?: string;
    krAccount?: string;
    krHolder?: string;
    krMemo?: string;
    intlBank?: string;
    intlAccount?: string;
    intlSwift?: string;
    intlHolder?: string;
    intlPaypal?: string;
  } | undefined;
  amount: string;
  depositor: string;
  onDepositor: (v: string) => void;
}) {
  const ko = locale === "ko";
  const ready = domestic
    ? Boolean(pay?.krBank && pay?.krAccount)
    : Boolean((pay?.intlBank && pay?.intlAccount) || pay?.intlPaypal);
  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-border bg-surface-muted p-4 text-sm">
      <p className="font-semibold">
        {ko ? "입금할 금액" : "Amount due"} · {amount}
      </p>
      {ready ? (
        domestic ? (
          <ul className="space-y-1 text-muted">
            <li>{ko ? "은행" : "Bank"}: <b className="text-fg">{pay?.krBank}</b></li>
            <li>{ko ? "계좌" : "Account"}: <b className="text-fg">{pay?.krAccount}</b></li>
            <li>{ko ? "예금주" : "Holder"}: <b className="text-fg">{pay?.krHolder}</b></li>
            {pay?.krMemo ? <li>{pay.krMemo}</li> : null}
          </ul>
        ) : (
          <ul className="space-y-1 text-muted">
            {pay?.intlBank ? <li>Bank: <b className="text-fg">{pay.intlBank}</b></li> : null}
            {pay?.intlAccount ? <li>Account / IBAN: <b className="text-fg">{pay.intlAccount}</b></li> : null}
            {pay?.intlSwift ? <li>SWIFT: <b className="text-fg">{pay.intlSwift}</b></li> : null}
            {pay?.intlHolder ? <li>Name: <b className="text-fg">{pay.intlHolder}</b></li> : null}
            {pay?.intlPaypal ? <li>PayPal: <b className="text-fg">{pay.intlPaypal}</b></li> : null}
          </ul>
        )
      ) : (
        <p className="text-muted">
          {ko
            ? "사장님이 아직 계좌를 등록하지 않았습니다. 관리자 → 계좌·결제에 통장을 넣어 주세요."
            : "Bank details are not set yet."}
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="depositor">{ko ? "입금자명" : "Depositor name"}</Label>
        <Input
          id="depositor"
          value={depositor}
          onChange={(e) => onDepositor(e.target.value)}
          required={pay === undefined ? false : true}
          placeholder={ko ? "통장에 찍힐 이름" : "Name on the transfer"}
        />
      </div>
    </div>
  );
}
