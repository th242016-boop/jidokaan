import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DesignThumb } from "@/components/store/design-thumb";
import { IgHelp } from "@/components/store/ig-help";
import { KrOrderPanel } from "@/components/store/kr-order-panel";
import { SiteShell } from "@/components/store/site-shell";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  COUNTRIES,
  countryName,
  currencyForCountry,
  formatMoney,
  lineTotal,
  overseasCheckoutIntent,
  pickLocalized,
  t,
} from "@/lib/i18n";
import { getProduct, naverProductUrl, productDisplayName, SMARTSTORE_HOME } from "@/lib/products";
import { quoteShipping, shipCopy } from "@/lib/shipping";
import { formatCartSize, useStore } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";
import { trackStoreEvent } from "@/components/analytics-tracker";
import { couponDiscount } from "@/lib/coupon";
import { dialCode, fullPhoneNumber, localPhoneNumber } from "@/lib/phone";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

type PayMethod = "card" | "kakao" | "naver" | "transfer" | "paypal";

type SavedCheckout = {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
  postal?: string;
  country?: string;
};

const PROFILE_KEY = "jidokaan-checkout-profile";

function readProfile(): SavedCheckout {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SavedCheckout;
  } catch {
    return {};
  }
}

function writeProfile(p: SavedCheckout) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

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
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postal, setPostal] = useState("");
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
    const saved = readProfile();
    let nextCountry = "";
    try {
      const overseas = overseasCheckoutIntent();
      const shipCountry = sessionStorage.getItem("jidokaan-ship-country");
      if (overseas) {
        if (shipCountry && shipCountry.toUpperCase() !== "KR") {
          nextCountry = shipCountry;
          setCountry(shipCountry);
          setCurrency(currencyForCountry(shipCountry));
        } else {
          setCountry("");
          setCurrency("USD");
        }
        setPay("paypal");
      } else if (shipCountry) {
        nextCountry = shipCountry;
        setCountry(shipCountry);
        setCurrency(currencyForCountry(shipCountry));
      } else if (saved.country) {
        nextCountry = saved.country;
        setCountry(saved.country);
        setCurrency(currencyForCountry(saved.country));
      }
    } catch {
      if (saved.country) {
        nextCountry = saved.country;
        setCountry(saved.country);
        setCurrency(currencyForCountry(saved.country));
      }
    }
    if (saved.email) setEmail(saved.email);
    if (saved.firstName) setFirstName(saved.firstName);
    if (saved.lastName) setLastName(saved.lastName);
    if (saved.phone) {
      setPhone(
        nextCountry && nextCountry !== "KR"
          ? localPhoneNumber(saved.phone, nextCountry)
          : saved.phone,
      );
    }
    if (saved.address) setAddress(saved.address);
    if (saved.city) setCity(saved.city);
    if (saved.region) setRegion(saved.region);
    if (saved.postal) setPostal(saved.postal);
  }, [setCartOpen, setCurrency]);

  useEffect(() => {
    if (!user) return;
    if (user.primaryEmail) setEmail(user.primaryEmail);
    if (user.displayName) {
      const parts = user.displayName.trim().split(/\s+/);
      setFirstName((cur) => cur || parts[0] || "");
      if (parts.length > 1) {
        setLastName((cur) => cur || parts.slice(1).join(" "));
      }
    }
  }, [user]);

  useEffect(() => {
    const name = `${lastName} ${firstName}`.trim();
    if (name) setDepositor((cur) => cur || name);
  }, [firstName, lastName]);

  const isKrw = currency === "KRW";
  const isDomestic = country === "KR";

  useEffect(() => {
    if (isDomestic) return;
    setPay((cur) =>
      cur === "card" || cur === "kakao" || cur === "naver" ? "paypal" : cur,
    );
  }, [isDomestic]);
  const regionRequired = ["US", "CA", "AU", "MX", "CN", "IN", "BR", "JP"].includes(
    country,
  );
  const qty = cart.reduce((n, i) => n + i.qty, 0);
  const quote = quoteShipping({
    country,
    method: "standard",
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
        { id: "paypal", label: dict.checkout.payPaypal },
        { id: "transfer", label: locale === "ko" ? "해외송금 / 계좌이체" : "Bank / wire transfer" },
      ];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (cart.length === 0) return;
    if (pay === "paypal") return;
    if (isDomestic) return;
    await placeStoreOrder();
  }

  async function placeStoreOrder(paypalOrderId?: string) {
    if (cart.length === 0) return;
    setPlacing(true);
    const fullAddress = [address.trim(), address2.trim()].filter(Boolean).join(", ");
    writeProfile({
      email,
      firstName,
      lastName,
      phone: isDomestic ? phone.trim() : fullPhoneNumber(phone, country),
      address,
      city,
      region,
      postal,
      country,
    });
    const items = cart
      .map((item) => {
        const product = getProduct(item.productId);
        if (!product) return null;
        return {
          productId: item.productId,
          name: `${product.name.ko || product.name.en}${item.optionLabel ? ` (${item.optionLabel})` : ""}`,
          qty: item.qty,
          size: item.size
            ? formatCartSize(item, "ko")
            : undefined,
          priceKrw: product.priceKrw + (item.extraKrw ?? 0),
          priceUsd: Math.round((product.priceUsd + (item.extraUsd ?? 0)) / 100),
          partNames: item.partNames,
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
          phone: isDomestic ? phone.trim() : fullPhoneNumber(phone, country),
          name: `${lastName} ${firstName}`.trim(),
          address: fullAddress,
          city: city.trim(),
          region: region.trim(),
          postal: postal.trim(),
          country,
          pay,
          depositor,
          shipMethod: "standard",
          shippingKrw,
          shippingUsd: quote.usd,
          totalKrw,
          totalUsd: Math.round(totalUsd / 100),
          currency,
          items,
          couponCode: appliedCode || undefined,
          discountKrw,
          discountUsd: Math.round(discountUsd / 100),
          paypalOrderId,
        }),
      });
      const data = (await res.json()) as { order?: { id: string }; error?: string };
      if (!res.ok && paypalOrderId) {
        setPlacing(false);
        return;
      }
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
          shipMethod: "standard",
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

        {!isPending && !user && !isDomestic ? (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              {locale === "ko"
                ? "구글 로그인하면 이메일·이름이 채워집니다. 이메일만으로도 주문할 수 있습니다."
                : "Google sign-in fills your email and name. You can also order with just an email."}
            </p>
            <Button size="sm" asChild>
              <Link to="/login" search={{ next: "/checkout" }}>
                {locale === "ko" ? "구글로 계속" : "Continue with Google"}
              </Link>
            </Button>
          </div>
        ) : null}

        {isDomestic ? (
          <div className="mb-8 max-w-lg rounded-3xl border border-border bg-surface p-5 sm:p-6">
            <KrOrderPanel
              naverUrl={(() => {
                const p = cart[0] ? getProduct(cart[0].productId) : undefined;
                return p ? naverProductUrl(p) : SMARTSTORE_HOME;
              })()}
            />
            <p className="mt-3 text-xs text-muted">
              {locale === "ko"
                ? "해외 주문은 위에서 국가를 한국 이외로 바꾸면 이 사이트에서 USD 결제됩니다."
                : "Ordering from outside Korea? Change the country below to pay in USD on this site."}
            </p>
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
                  <Label htmlFor="email">
                    {dict.checkout.email} <span className="text-accent">*</span>
                  </Label>
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
                  <Label htmlFor="phone">
                    {dict.checkout.phone} <span className="text-accent">*</span>
                  </Label>
                  <div className="flex gap-2">
                    {!isDomestic && country ? (
                      <span className="inline-flex h-11 shrink-0 items-center rounded-xl border border-border bg-surface-muted px-3 text-sm font-medium text-fg">
                        {dialCode(country) || "+"}
                      </span>
                    ) : null}
                    <Input
                      id="phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      inputMode="tel"
                      className="flex-1"
                      value={phone}
                      onChange={(e) =>
                        setPhone(
                          !isDomestic && country
                            ? localPhoneNumber(e.target.value, country)
                            : e.target.value,
                        )
                      }
                      placeholder={
                        isDomestic
                          ? "010-0000-0000"
                          : locale === "ko"
                            ? "휴대폰 번호만 입력"
                            : "Mobile number only"
                      }
                    />
                  </div>
                  <p className="text-xs text-muted">
                    {isDomestic
                      ? dict.checkout.phoneHint
                      : locale === "ko"
                        ? "국가번호는 배송 국가에 따라 자동으로 붙습니다. 휴대폰 번호만 입력하세요."
                        : "Country code is added from the shipping country. Enter your mobile number only."}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="mb-4 text-base font-semibold">
                {dict.checkout.shipping}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    {dict.checkout.firstName} <span className="text-accent">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    required
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    {dict.checkout.lastName} <span className="text-accent">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    required
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="address">
                    {dict.checkout.address} <span className="text-accent">*</span>
                  </Label>
                  <Input
                    id="address"
                    required
                    autoComplete="address-line1"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="address2">{dict.checkout.address2}</Label>
                  <Input
                    id="address2"
                    autoComplete="address-line2"
                    value={address2}
                    onChange={(e) => setAddress2(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">
                    {dict.checkout.city} <span className="text-accent">*</span>
                  </Label>
                  <Input
                    id="city"
                    required
                    autoComplete="address-level2"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">
                    {dict.checkout.region}
                    {regionRequired ? <span className="text-accent"> *</span> : null}
                  </Label>
                  <Input
                    id="region"
                    required={regionRequired}
                    autoComplete="address-level1"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder={
                      country === "US"
                        ? "CA, NY, TX…"
                        : country === "CA"
                          ? "ON, BC, QC…"
                          : undefined
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal">
                    {dict.checkout.postal} <span className="text-accent">*</span>
                  </Label>
                  <Input
                    id="postal"
                    required
                    autoComplete="postal-code"
                    value={postal}
                    onChange={(e) => setPostal(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">
                    {dict.checkout.country} <span className="text-accent">*</span>
                  </Label>
                  <select
                    id="country"
                    className="flex h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-fg focus-ring"
                    value={country}
                    onChange={(e) => {
                      const next = e.target.value;
                      setPhone((p) => {
                        const stripped = country ? localPhoneNumber(p, country) : p;
                        if (!next || next === "KR") return stripped;
                        return localPhoneNumber(stripped, next);
                      });
                      setCountry(next);
                      setCurrency(currencyForCountry(next || "US"));
                      setPay(next === "KR" ? "card" : "paypal");
                      try {
                        if (next) sessionStorage.setItem("jidokaan-ship-country", next);
                        if (next && next !== "KR") {
                          sessionStorage.setItem("jidokaan-order-market", "intl");
                        }
                      } catch {
                        /* ignore */
                      }
                    }}
                    required
                  >
                    {!country ? (
                      <option value="">
                        {locale === "ko" ? "국가 선택" : "Select country"}
                      </option>
                    ) : null}
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {countryName(c, locale)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2 space-y-2 rounded-xl border border-border bg-surface-muted/60 px-4 py-3">
                  <p className="text-sm font-medium">{copy.autoShip}</p>
                  <p className="text-xs text-muted">
                    {copy.makeDays} {quote.days} {copy.days}
                  </p>
                  <p className="text-xs text-muted">{copy.production}</p>
                  {!isDomestic ? (
                    <p className="text-xs text-muted">
                      {copy.dutyTitle}. {copy.dutyBody} {dict.checkout.noPobox}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="mb-4 text-base font-semibold">
                {dict.checkout.payment}
              </h2>
              {isDomestic ? (
                <p className="text-sm leading-relaxed text-muted">
                  {locale === "ko"
                    ? "한국 주문은 네이버 스토어에서 결제합니다. 이 사이트 PayPal은 해외 전용입니다."
                    : "Korean orders check out on Naver Store. PayPal on this site is for international orders only."}
                </p>
              ) : (
                <>
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
              <ul className="mt-4 space-y-1.5 text-xs leading-relaxed text-muted">
                <li>Prices are in USD.</li>
                <li>Shipping is calculated and shown in the order summary.</li>
                <li>Import duties and VAT in the destination country are paid by the recipient (DAP).</li>
                <li>{dict.checkout.noPobox}</li>
              </ul>
                </>
              )}
            </section>
          </div>

          <aside className="h-fit rounded-3xl border border-border bg-surface p-5 sm:p-6 lg:sticky lg:top-24">
            <h2 className="mb-4 text-base font-semibold">
              {dict.checkout.summary}
            </h2>
            {cart.some((i) => i.partNames || i.partColors) ? (
              <div className="mb-5 overflow-hidden rounded-2xl border border-border bg-[#111]">
                <div className="aspect-square w-full">
                  <DesignThumb
                    item={
                      cart.find((i) => i.partNames || i.partColors) ?? cart[0]
                    }
                    className="h-full w-full"
                  />
                </div>
              </div>
            ) : null}
            <div className="space-y-3">
              {cart.map((item) => {
                const product = getProduct(item.productId);
                if (!product) return null;
                return (
                  <div
                    key={`${item.productId}-${item.size ?? ""}-${item.sizeFit ?? ""}-${item.color ?? ""}`}
                    className="flex gap-3"
                  >
                    <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-[#111]">
                      <DesignThumb item={item} className="size-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {productDisplayName(product, locale)}
                      </p>
                      <p className="text-xs text-muted">
                        {dict.cart.qty} {item.qty}
                        {item.size ? ` · ${formatCartSize(item, locale)}` : ""}
                        {item.optionLabel ? ` · ${item.optionLabel}` : ""}
                      </p>
                      {item.partNames ? (
                        <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-subtle">
                          {Object.entries(item.partNames)
                            .map(([k, v]) => `${k.toUpperCase()} ${v}`)
                            .join(" · ")}
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
              {isDomestic ? (
                <p className="rounded-xl bg-surface-muted px-3 py-2 text-xs text-muted">
                  {copy.freeKr}
                </p>
              ) : null}
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

            {!isDomestic && pay === "paypal" ? (
              <div className="mt-6">
                <PaypalButtons
                  valueUsd={(totalUsd / 100).toFixed(2)}
                  disabled={placing}
                  onPaid={(orderID) => placeStoreOrder(orderID)}
                />
              </div>
            ) : !isDomestic ? (
            <Button
              type="submit"
              size="lg"
              className="mt-6 w-full"
              disabled={placing}
            >
              {placing ? dict.checkout.placing : dict.checkout.placeOrder}
            </Button>
            ) : null}
            <p className="mt-3 text-center text-xs text-subtle">jidokaan.com</p>
            <IgHelp className="mt-3 text-center text-sm text-muted" />
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
            {pay?.krMemo ? (
              <li>
                {pay.krMemo.includes("주문번호")
                  ? "주문자명으로 입금해 주세요"
                  : pay.krMemo}
              </li>
            ) : (
              <li>{ko ? "주문자명으로 입금해 주세요" : "Transfer under the orderer's name"}</li>
            )}
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

type PaypalButtonsApi = {
  Buttons: (opts: Record<string, unknown>) => {
    render: (el: HTMLElement) => Promise<void>;
    close?: () => void;
  };
};

function PaypalButtons({
  valueUsd,
  disabled,
  onPaid,
}: {
  valueUsd: string;
  disabled: boolean;
  onPaid: (orderID: string) => Promise<void>;
}) {
  const slot = useRef<HTMLDivElement>(null);
  const paidRef = useRef(onPaid);
  paidRef.current = onPaid;
  const [clientId, setClientId] = useState("");
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/paypal")
      .then((r) => r.json())
      .then((d: { enabled?: boolean; clientId?: string }) => {
        if (d.enabled && d.clientId) setClientId(d.clientId);
      })
      .catch(() => setErr("PayPal"));
  }, []);

  useEffect(() => {
    if (!clientId) return;
    const w = window as Window & { paypal?: PaypalButtonsApi };
    if (w.paypal) {
      setReady(true);
      return;
    }
    const prev = document.querySelector("script[data-jidokaan-paypal]");
    if (prev) {
      prev.addEventListener("load", () => setReady(true));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture`;
    script.async = true;
    script.dataset.jidokaanPaypal = "1";
    script.onload = () => setReady(true);
    script.onerror = () => setErr("PayPal SDK");
    document.body.appendChild(script);
  }, [clientId]);

  useEffect(() => {
    const w = window as Window & { paypal?: PaypalButtonsApi };
    if (!ready || !w.paypal || !slot.current || disabled) return;
    const host = slot.current;
    host.innerHTML = "";
    const buttons = w.paypal.Buttons({
      style: { layout: "vertical", color: "gold", label: "paypal" },
      createOrder: async () => {
        const form = host.closest("form");
        if (form && !form.reportValidity()) throw new Error("form");
        const res = await fetch("/api/paypal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create", value: valueUsd }),
        });
        const data = (await res.json()) as { id?: string };
        if (!data.id) throw new Error("create");
        return data.id;
      },
      onApprove: async (data: { orderID: string }) => {
        const res = await fetch("/api/paypal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "capture", orderID: data.orderID }),
        });
        if (!res.ok) throw new Error("capture");
        await paidRef.current(data.orderID);
      },
      onError: () => setErr("PayPal"),
    });
    void buttons.render(host);
    return () => {
      try {
        buttons.close?.();
      } catch {
        /* ignore */
      }
    };
  }, [ready, valueUsd, disabled]);

  if (!clientId) {
    return (
      <p className="text-sm text-muted">
        PayPal is not configured. Use bank transfer or add PAYPAL_CLIENT_ID on the server.
      </p>
    );
  }
  return (
    <div>
      {err ? <p className="mb-2 text-sm text-danger">{err}</p> : null}
      <div ref={slot} />
    </div>
  );
}
