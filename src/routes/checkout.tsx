import { internationalOrderPolicy } from "@/lib/international-order-policy";
import { specialOrderCopy } from "@/lib/special-order-copy";
import { SpecialOrderNotice } from "@/components/store/special-order-notice";
import { japanYenQuote, orderPaymentMoney } from "@/lib/order-money";
import { formatYen, paymentCurrencyNotice } from "@/lib/storefront-money";
import { activeSalesCountries, isActiveSalesCountry } from "@/lib/active-sales-policy";
import { designSpecLine } from "@/lib/simulator-config";
import { checkoutCopy } from "@/lib/checkout-copy";
import { checkoutLayoutCopy } from "@/lib/checkout-layout-copy";
import { customerOrderCopy } from "@/lib/customer-order-copy";
import { customerOrderDetailCopy } from "@/lib/customer-order-detail-copy";
import { customerOptionLabel } from "@/lib/customer-order-view";
import {
  captureDesign,
  completeDesign,
  designKey,
  DESIGN_VERSION,
  ORDER_TERMS_VERSION,
} from "@/lib/design-order";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DesignThumb } from "@/components/store/design-thumb";
import { KrOrderPanel } from "@/components/store/kr-order-panel";
import { SiteShell } from "@/components/store/site-shell";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { COUNTRIES, countryName, formatMoney, lineTotal, t } from "@/lib/i18n";
import { getProduct, naverProductUrl, productDisplayName, SMARTSTORE_HOME } from "@/lib/products";
import { quoteShipping, shipCopy } from "@/lib/shipping";
import { formatCartSize, naverCartProductId, useStore } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";
import { trackStoreEvent } from "@/components/analytics-tracker";
import { clearCheckoutDraft, normalizeCheckoutRegion, readCheckoutDraft, readLegacyCheckoutProfile, writeCheckoutDraft, type CheckoutDraft } from "@/lib/checkout-draft";
import { PHONE_COUNTRY_OPTIONS, phoneCountryForNumber, validatePhoneNumber } from "@/lib/phone";
import { checkoutEnhancementsCopy } from "@/lib/checkout-enhancements-copy";
import { countryImportPolicy, countryImportNotice, IMPORT_POLICY_VERSION } from "@/lib/country-import-policy";
import { parcelPlan } from "@/lib/parcel-policy";
import { ADDRESS_REGIONS, POSTAL_EXAMPLES, validPostalAddress } from "@/lib/address-validation";
import type { StoreOrder } from "@/lib/order-types";
import { submitOrder } from "@/lib/submit-order";
import { normalizeInstagram } from "@/lib/order-contact";
import { requiresPostalCode } from "@/lib/address-requirements";
import { cn } from "@/lib/utils";
import { IS_REVIEW_PREVIEW, REVIEW_ORDER_ID, saveReviewOrder } from "@/lib/review-preview";

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>): { step?: "review"; lang?: string } => ({
    step: search.step === "review" ? "review" : undefined,
    lang: typeof search.lang === "string" ? search.lang : undefined,
  }),
  component: CheckoutPage,
});

type PayMethod = "card" | "kakao" | "naver" | "transfer" | "paypal";

function CheckoutPage() {
  const locale = useStore((s) => s.locale);
  const currency = useStore((s) => s.currency);
  const country = useStore((s) => s.shippingCountry);
  const setCountry = useStore((s) => s.setShippingCountry);
  const cart = useStore((s) => s.cart);
  const clearCart = useStore((s) => s.clearCart);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const subtotalUsd = useStore((s) => s.cartSubtotalUsdCents());
  const subtotalKrw = useStore((s) => s.cartSubtotalKrw());
  const dict = t(locale);
  const customer = customerOrderCopy(locale);
  const cancellationPolicy = internationalOrderPolicy(locale);
  const detail = customerOrderDetailCopy(locale);
  const improvement = checkoutEnhancementsCopy(locale);
  const navigate = useNavigate();
  const { step: routeStep } = Route.useSearch();
  const { user, isPending } = useCurrentUserState();
  const { catalog } = useCatalog();
  const [placing, setPlacing] = useState(false);
  const [paymentInFlight, setPaymentInFlight] = useState(false);
  const paymentInFlightRef = useRef<symbol | null>(null);
  function onPaymentActivity(owner: symbol, active: boolean) {
    // A cancelled old SDK instance may release only its own payment lock.
    if (!active && paymentInFlightRef.current !== owner) return;
    paymentInFlightRef.current = active ? owner : null;
    setPaymentInFlight(active);
  }
  const [instagram, setInstagram] = useState("");
  const [contactMethod, setContactMethod] = useState<"instagram" | "email">("instagram");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [designPreviews, setDesignPreviews] = useState<Record<string, string>>({});
  const [previewFailed, setPreviewFailed] = useState(false);
  const [previewAttempt, setPreviewAttempt] = useState(0);
  const review = checkoutCopy(locale);
  const layout = checkoutLayoutCopy(locale);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const draftFinished = useRef(false);
  const previousCountry = useRef<string | null>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const stepNavRef = useRef<HTMLElement>(null);
  const [detailsError, setDetailsError] = useState("");
  const customItems = cart.filter((item) => getProduct(item.productId)?.customizable);
  const designSignature = JSON.stringify(
    cart.map((item) => [item.productId, item.size, item.sizeFit, item.qty, item.partNames]),
  );
  const validDesigns = customItems.every((item) => Boolean(completeDesign(item.partNames)));
  const previewsReady =
    validDesigns && customItems.every((item) => Boolean(designPreviews[designKey(item.partNames)]));
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setTermsAccepted(false);
    setDesignPreviews({});
    setPreviewFailed(false);
    if (!validDesigns) return;
    const unique = [
      ...new Map(
        customItems.map((item) => [designKey(item.partNames), completeDesign(item.partNames)!]),
      ).entries(),
    ];
    // Render one design at a time to avoid decoding every cart item's layers at once on phones.
    void (async () => {
      for (const [key, names] of unique) {
        const preview = await captureDesign(names, { signal: controller.signal });
        if (active) setDesignPreviews((current) => ({ ...current, [key]: preview }));
      }
    })().catch(() => {
      if (active) setPreviewFailed(true);
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, [designSignature, previewAttempt]);
  const [orderError, setOrderError] = useState("");
  const [pendingOrder, setPendingOrder] = useState<Record<string, unknown> | null>(null);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pay, setPay] = useState<PayMethod>("card");
  const [phone, setPhone] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [address, setAddress] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postal, setPostal] = useState("");
  const [depositor, setDepositor] = useState("");
  const paySettings = catalog.pay;
  const mobileStep = pendingOrder || (draftHydrated && routeStep === "review") ? "review" : "details";

  useEffect(() => {
    setCartOpen(false);
    // Hydrate before saving so the initial empty render cannot erase a returning customer's draft.
    const nextCountry = useStore.getState().shippingCountry;
    let saved: CheckoutDraft | null = null;
    try { saved = readCheckoutDraft(sessionStorage, nextCountry); } catch { /* Storage access may be blocked. */ }
    if (!saved) {
      try { saved = readLegacyCheckoutProfile(localStorage, nextCountry); } catch { /* Optional legacy prefill. */ }
    }
    saved ??= {};
    if (saved.instagram !== undefined) setInstagram(saved.instagram);
    if (saved.contactMethod) setContactMethod(saved.contactMethod);
    try {
      const pending = sessionStorage.getItem("jidokaan-pending-paid-order");
      if (pending) setPendingOrder(JSON.parse(pending));
    } catch {
      /* storage may be unavailable */
    }
    // Destination is independent of language and shared with the storefront.
    // syncLocalePreference migrates any saved destination before this screen is used.
    if (nextCountry !== "KR") setPay("paypal");
    if (saved.email !== undefined) setEmail(saved.email);
    if (saved.firstName !== undefined) setFirstName(saved.firstName);
    if (saved.lastName !== undefined) setLastName(saved.lastName);
    setPhoneCountry(phoneCountryForNumber(saved.phone ?? "", saved.phoneCountry || nextCountry || ""));
    if (saved.phone !== undefined) setPhone(saved.phone);
    if (saved.address !== undefined) setAddress(saved.address);
    if (saved.address2 !== undefined) setAddress2(saved.address2);
    if (saved.city !== undefined) setCity(saved.city);
    if (saved.region !== undefined) setRegion(saved.region);
    if (saved.postal !== undefined) setPostal(saved.postal);
    if (saved.depositor !== undefined) setDepositor(saved.depositor);
    setDraftHydrated(true);
  }, [setCartOpen]);

  useEffect(() => {
    if (!draftHydrated || !user) return;
    if (user.primaryEmail) setEmail((cur) => cur || user.primaryEmail || "");
    if (user.displayName) {
      const parts = user.displayName.trim().split(/\s+/);
      setFirstName((cur) => cur || parts[0] || "");
      if (parts.length > 1) {
        setLastName((cur) => cur || parts.slice(1).join(" "));
      }
    }
  }, [user, draftHydrated]);

  useEffect(() => {
    if (!draftHydrated || draftFinished.current) return;
    try {
      writeCheckoutDraft(sessionStorage, { instagram, contactMethod, email, firstName, lastName,
        phone, phoneCountry, address, address2, city, region, postal, country, depositor });
    } catch { /* Storage access may be blocked. */ }
  }, [draftHydrated, instagram, contactMethod, email, firstName, lastName, phone, phoneCountry,
    address, address2, city, region, postal, country, depositor]);

  useEffect(() => {
    if (draftHydrated) setRegion((value) => normalizeCheckoutRegion(country, value));
  }, [country, draftHydrated]);

  useEffect(() => {
    const name = `${lastName} ${firstName}`.trim();
    if (name) setDepositor((cur) => cur || name);
  }, [firstName, lastName]);

  const isKrw = currency === "KRW";
  const isDomestic = country === "KR";

  useEffect(() => {
    if (isDomestic) return;
    setPay((cur) => (cur === "card" || cur === "kakao" || cur === "naver" ? "paypal" : cur));
  }, [isDomestic]);
  const regionRequired = ["US", "CA", "AU", "MX", "CN", "IN", "BR", "JP"].includes(country);
  const postalRequired = requiresPostalCode(country);
  const qty = cart.reduce((n, i) => n + i.qty, 0);
  const parcelItems = cart.map(item => ({...getProduct(item.productId),qty:item.qty}));
  const packing = parcelPlan(parcelItems);
  const importPolicy = countryImportPolicy(country, packing.hasShoes);
  const checkedPhone = validatePhoneNumber(phone, phoneCountry);
  const phoneNames = new Intl.DisplayNames([locale === "tl" ? "fil" : locale], {type:"region"});
  const chineseMobileValid = country !== "CN" || (checkedPhone.valid && checkedPhone.country === "CN" && /^\+861[3-9]\d{9}$/.test(checkedPhone.e164));
  const quote = quoteShipping({
    country,
    method: "standard",
    subtotalKrw,
    subtotalUsd: subtotalUsd / 100,
    qty,
    items: parcelItems,
    settings: catalog.shipping,
  });
  const shippingUsd = quote.usd * 100;
  const shippingKrw = quote.krw;
  const totalUsd = subtotalUsd + shippingUsd;
  const totalKrw = subtotalKrw + shippingKrw;
  const yen = japanYenQuote(country, cart.map(item => ({
    ...getProduct(item.productId), productId: item.productId, qty: item.qty,
    priceUsd: ((getProduct(item.productId)?.priceUsd ?? 0) + (item.extraUsd ?? 0)) / 100,
  })));
  const paymentCurrency = yen ? "JPY" : isDomestic ? "KRW" : "USD";
  const paymentValue = yen ? yen.totalJpy : totalUsd / 100;
  useEffect(() => {
    if (paymentCurrency === "JPY") setPay("paypal");
  }, [paymentCurrency]);
  const copy = shipCopy(locale, country);
  const dutyText = country === "US" ? review.usDuty : review.duty;
  const salesUnavailable = Boolean(country) && !isActiveSalesCountry(country);
  const shippingBlocker = salesUnavailable ? improvement.salesUnavailable : quote.reason === "parcel_quote" ? improvement.parcelQuote : review.unavailable;
  const canPay = draftHydrated && termsAccepted && previewsReady && quote.available && Boolean(country) && !importPolicy.consultationRequired && (!yen || pay === "paypal");
  const consentBlocker = !country
    ? review.selectCountry
    : importPolicy.consultationRequired
      ? improvement.consultHelp
    : !quote.available
      ? shippingBlocker
      : !validDesigns
        ? review.missing
        : !previewsReady
          ? previewFailed
            ? review.imageError
            : review.loading
          : "";
  useEffect(() => {
    setTermsAccepted(false);
  }, [country, locale, totalUsd, paymentCurrency, paymentValue]);

  useEffect(() => {
    if (!draftHydrated) return;
    const changed = previousCountry.current !== null && previousCountry.current !== country;
    previousCountry.current = country;
    if (changed && !pendingOrder) {
      void navigate({ to: "/checkout", search: (prev) => ({ ...prev, step: undefined }), replace: true, resetScroll: false });
    }
    setDetailsError("");
  }, [country, draftHydrated, pendingOrder, navigate]);

  function showMobileStep(step: "details" | "review", replace = false) {
    if (step !== mobileStep) {
      // Review gets its own history entry, so browser Back returns to the filled details.
      void navigate({ to: "/checkout", search: (prev) => ({ ...prev, step: step === "review" ? "review" : undefined }),
        replace: replace || step === "details", resetScroll: false });
    }
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => {
        stepNavRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
        stepNavRef.current?.focus({ preventScroll: true });
      });
    }
  }

  function continueToReview() {
    setDetailsError("");
    if (!country || salesUnavailable) {
      setDetailsError(salesUnavailable ? improvement.salesUnavailable : review.selectCountry);
      showMobileStep("details", true);
      requestAnimationFrame(() => document.getElementById("country")?.focus());
      return;
    }
    const fields = detailsRef.current?.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select") ?? [];
    for (const field of fields) {
      if (!field.checkValidity()) {
        showMobileStep("details", true);
        requestAnimationFrame(() => field.reportValidity());
        return;
      }
    }
    setPhoneTouched(true);
    if (!checkedPhone.valid || !chineseMobileValid) {
      setDetailsError(country === "CN" && !chineseMobileValid ? improvement.china : improvement.phoneInvalid);
      showMobileStep("details", true);
      requestAnimationFrame(() => document.getElementById("phone")?.focus());
      return;
    }
    if (!validPostalAddress(country, postal, region)) {
      setDetailsError(improvement.addressInvalid);
      showMobileStep("details", true);
      requestAnimationFrame(() => document.getElementById("postal")?.focus());
      return;
    }
    setOrderError("");
    showMobileStep("review");
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
        ...(!yen && ((paySettings.intlBank && paySettings.intlAccount) || paySettings.intlPaypal)
          ? [{ id: "transfer" as const, label: customer.transferOption }]
          : []),
      ];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (IS_REVIEW_PREVIEW) return;
    if (cart.length === 0) return;
    if (pay === "paypal") return;
    if (isDomestic) return;
    await placeStoreOrder();
  }

  function buildOrderPayload(paypalOrderId?: string) {
    if (cart.length === 0) return;
    setOrderError("");
    if (salesUnavailable) { setOrderError(improvement.salesUnavailable); return; }
    setPhoneTouched(true);
    if (!checkedPhone.valid || !chineseMobileValid) { setOrderError(country === "CN" && !chineseMobileValid ? improvement.china : improvement.phoneInvalid); return; }
    if (!validPostalAddress(country, postal, region)) { setOrderError(improvement.addressInvalid); return; }
    if (!canPay || !email.trim() || (contactMethod === "instagram" && !instagram.trim())) {
      setOrderError(review.confirmError);
      return;
    }
    let handle: string;
    try {
      handle = contactMethod === "instagram" ? normalizeInstagram(instagram) : "";
    } catch {
      setOrderError(review.confirmError);
      return;
    }
    const fullAddress = [address.trim(), address2.trim()].filter(Boolean).join(", ");
    const items = cart
      .map((item, index) => {
        const product = getProduct(item.productId);
        if (!product) return null;
        return {
          productId: item.productId,
          name: `${product.name.ko || product.name.en}${item.optionLabel ? ` (${item.optionLabel})` : ""}`,
          qty: item.qty,
          size: item.size ? formatCartSize(item, "ko") : undefined,
          priceKrw: product.priceKrw + (item.extraKrw ?? 0),
          priceUsd: (product.priceUsd + (item.extraUsd ?? 0)) / 100,
          ...(yen ? {priceJpy: yen.unitPricesJpy[index]} : {}),
          sizeFit: item.sizeFit,
          specialOrder: item.specialOrder === true,
          optionKey: item.optionKey,
          optionLabel: [item.specialOrder ? specialOrderCopy(locale).special : "", item.optionLabel].filter(Boolean).join(" · ") || undefined,
          color: item.color,
          partColors: item.partColors,
          partNames: item.partNames,
          ...(product.customizable
            ? {
                designPreview: designPreviews[designKey(item.partNames)],
                designKey: designKey(item.partNames),
                designVersion: DESIGN_VERSION,
              }
            : {}),
        };
      })
      .filter(Boolean);
    const payload = {
      email,
      contactMethod,
      checkoutLocale: locale,
      termsAccepted,
      termsVersion: ORDER_TERMS_VERSION,
      importPolicyVersion: IMPORT_POLICY_VERSION,
      acknowledgedTerms: {shipping: review.shipping, duty: dutyText, design: review.design, production: packing.hasShoes ? review.production : improvement.accessoryTiming, destination: countryImportNotice(country, locale, packing.hasShoes), agree: review.agree, ...(!isDomestic ? {cancellationPolicy: cancellationPolicy.acknowledgement} : {})},
      instagram: handle,
      phone: checkedPhone.e164,
      name: `${firstName} ${lastName}`.trim(),
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
      totalUsd: totalUsd / 100,
      currency: paymentCurrency,
      ...(yen ? {totalJpy: yen.totalJpy, shippingJpy: yen.shippingJpy, discountJpy: yen.discountJpy} : {}),
      items,
      discountKrw: 0,
      discountUsd: 0,
      paypalOrderId,
    };
    return payload;
  }

  function markPending(payload: Record<string, unknown>) {
    setPendingOrder(payload);
    try {
      sessionStorage.setItem("jidokaan-pending-paid-order", JSON.stringify(payload));
    } catch {
      /* retain in component state */
    }
  }

  async function placeStoreOrder(paypalOrderId?: string) {
    const payload = buildOrderPayload(paypalOrderId);
    if (!payload) return;
    if (paypalOrderId) markPending(payload);
    await saveOrderPayload(payload);
  }

  function finishOrder(order: StoreOrder) {
    const paidMoney = orderPaymentMoney(order);
    draftFinished.current = true;
    try {
      clearCheckoutDraft(sessionStorage);
      sessionStorage.setItem(
        "jidokaan-last-order",
        JSON.stringify({
          orderId: order.id,
          email: order.email,
          country: order.country,
          pay: order.pay,
          depositor: order.depositor,
          currency: order.currency,
          shipMethod: order.shipMethod,
          shipping: paidMoney.currency === "USD" ? paidMoney.shipping * 100 : paidMoney.shipping,
          total: paidMoney.currency === "USD" ? paidMoney.total * 100 : paidMoney.total,
        }),
      );
      sessionStorage.removeItem("jidokaan-pending-paid-order");
    } catch {
      /* server order is already saved */
    }
    setPendingOrder(null);
    clearCart();
    trackStoreEvent("order");
    navigate({ to: "/order-success", search: { order: order.id } });
  }

  async function saveOrderPayload(payload: Record<string, unknown>) {
    if (IS_REVIEW_PREVIEW) return;
    setPlacing(true);
    setOrderError("");
    try {
      const order = await submitOrder(payload);
      finishOrder(order);
    } catch {
      setOrderError(payload.paypalOrderId ? review.paymentError : review.saveError);
    } finally {
      setPlacing(false);
    }
  }

  if (cart.length === 0 && !pendingOrder) {
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
      <div className="container-page py-6 sm:py-12">
        <h1 className="mb-5 text-3xl font-semibold tracking-tight">{dict.checkout.title}</h1>

        <section
          className="mb-4 rounded-2xl border border-border bg-surface p-4 sm:p-5"
          aria-labelledby="delivery-country-title"
        >
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(14rem,1fr)] sm:items-center [&>*]:min-w-0">
            <div>
              <Label id="delivery-country-title" htmlFor="country" className="font-semibold">
                {dict.checkout.country}
              </Label>
              <p className="mt-2 text-sm leading-relaxed text-muted">{customer.destinationHelp}</p>
            </div>
            <select
              id="country"
              className="flex min-h-12 w-full min-w-0 max-w-full rounded-xl border border-border bg-surface px-3.5 text-base sm:text-sm text-fg focus-ring"
              value={isActiveSalesCountry(country) ? country : ""}
              onChange={(e) => {
                const next = e.target.value;
                setCountry(next);
                setPay(next === "KR" ? "card" : "paypal");
              }}
              disabled={placing || Boolean(pendingOrder)}
              required
            >
              <option value="">{review.selectCountry}</option>
              {activeSalesCountries(COUNTRIES).map((entry) => (
                <option key={entry.code} value={entry.code}>
                  {countryName(entry, locale)}
                </option>
              ))}
            </select>
          </div>
          {!country ? (
            <p role="status" className="mt-3 text-sm text-muted">
              {review.selectCountry}
            </p>
          ) : null}
          {country && !quote.available ? (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {shippingBlocker}
            </p>
          ) : null}
        </section>

        {!isDomestic ? (
          <nav ref={stepNavRef} tabIndex={-1} aria-label={dict.checkout.title} className="mb-4 grid scroll-mt-24 grid-cols-2 gap-2 focus:outline-none lg:hidden">
            <button type="button" aria-current={mobileStep === "details" ? "step" : undefined} disabled={Boolean(pendingOrder)} onClick={() => showMobileStep("details")} className={cn("min-h-12 rounded-xl border px-3 py-2 text-sm font-medium", mobileStep === "details" ? "border-fg bg-fg text-primary-fg" : "border-border bg-surface text-muted")}>
              1. {layout.detailsStep}
            </button>
            <button type="button" aria-current={mobileStep === "review" ? "step" : undefined} onClick={() => pendingOrder ? showMobileStep("review") : continueToReview()} className={cn("min-h-12 rounded-xl border px-3 py-2 text-sm font-medium", mobileStep === "review" ? "border-fg bg-fg text-primary-fg" : "border-border bg-surface text-muted")}>
              2. {layout.reviewStep}
            </button>
          </nav>
        ) : null}

        {!isPending && !user && !isDomestic ? (
          <div className={cn("mb-4 flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between lg:flex", mobileStep === "review" ? "hidden" : "flex")}>
            <p className="text-sm text-muted">
              <strong className="block font-semibold text-fg">{customer.guestTitle}</strong>
              {improvement.guestNote}
            </p>
            <Button size="sm" disabled={IS_REVIEW_PREVIEW} asChild={!IS_REVIEW_PREVIEW}>
              {IS_REVIEW_PREVIEW ? (
                customer.googleContinue
              ) : (
                <Link to="/login" search={{ next: "/checkout" }}>
                  {customer.googleContinue}
                </Link>
              )}
            </Button>
          </div>
        ) : null}

        {isDomestic ? (
          <div className="mb-8 max-w-lg rounded-3xl border border-border bg-surface p-5 sm:p-6">
            <KrOrderPanel
              naverUrl={(() => {
                const p = cart[0] ? getProduct(naverCartProductId(cart[0])) : undefined;
                return p ? naverProductUrl(p) : SMARTSTORE_HOME;
              })()}
            />
            <p className="mt-3 text-xs text-muted">{customer.domesticRedirect}</p>
          </div>
        ) : null}

        <form
          onSubmit={onSubmit}
          onKeyDown={(event) => {
            if (event.key === "Enter" && event.target instanceof HTMLInputElement && mobileStep === "details" && !isDomestic && window.matchMedia("(max-width: 1023px)").matches) {
              event.preventDefault();
              continueToReview();
            }
          }}
          onInvalidCapture={(event) => {
            if (detailsRef.current?.contains(event.target as Node) && mobileStep === "review" && window.matchMedia("(max-width: 1023px)").matches) {
              showMobileStep("details", true);
              const field = event.target as HTMLInputElement;
              requestAnimationFrame(() => field.focus());
            }
          }}
          className={cn("grid min-w-0 grid-cols-1 gap-5 lg:gap-8", !isDomestic && "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]", isDomestic && "max-w-2xl")}
        >
          {!isDomestic ? <div ref={detailsRef} className={cn("min-w-0 space-y-4 lg:block lg:space-y-6", mobileStep === "review" && "hidden")}>
            <section className="min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-6">
              <h2 className="mb-4 text-base font-semibold">{dict.checkout.contact}</h2>
              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="email">
                    {review.email} <span className="text-accent">*</span>
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
                <fieldset
                  className="min-w-0 max-w-full sm:col-span-2 space-y-3"
                  lang={locale}
                  dir={locale === "ar" ? "rtl" : undefined}
                >
                  <legend className="mb-2 max-w-full whitespace-normal text-sm font-semibold">{review.contact}</legend>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                    <input
                      type="radio"
                      name="contactMethod"
                      checked={contactMethod === "instagram"}
                      onChange={() => setContactMethod("instagram")}
                      className="size-4 shrink-0"
                    />
                    <span>{customer.instagramRecommended}</span>
                  </label>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                    <input
                      type="radio"
                      name="contactMethod"
                      checked={contactMethod === "email"}
                      onChange={() => setContactMethod("email")}
                      className="size-4 shrink-0"
                    />
                    <span>{review.emailOption}</span>
                  </label>
                  {contactMethod === "instagram" ? (
                    <Input
                      id="instagram"
                      name="instagram"
                      aria-label={customer.instagramRecommended}
                      required
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@your_username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      maxLength={31}
                      pattern="@?[A-Za-z0-9._]{1,30}"
                      aria-describedby="instagram-help"
                    />
                  ) : null}
                  <details className="text-xs leading-relaxed text-muted">
                    <summary className="min-h-11 cursor-pointer py-3 font-medium">{layout.help}</summary>
                    <p id="instagram-help" className="pb-2">{improvement.contactManual}</p>
                  </details>
                </fieldset>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="phone">
                    {dict.checkout.phone} <span className="text-accent">*</span>
                  </Label>
                  <div className="grid min-w-0 grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)] gap-2 [&>*]:min-w-0">
                    <select aria-label={improvement.phoneCountry} value={phoneCountry} onChange={e=>setPhoneCountry(e.target.value)} className="h-12 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-base sm:text-sm">
                      <option value="">{improvement.phoneCountry}</option>
                      {PHONE_COUNTRY_OPTIONS.map(option=><option value={option.code} key={option.code}>{phoneNames.of(option.code) ?? option.code} ({option.dialCode})</option>)}
                    </select>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      inputMode="tel"
                      className="flex-1"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={()=>setPhoneTouched(true)}
                      aria-invalid={phoneTouched && (!checkedPhone.valid || !chineseMobileValid)}
                      aria-describedby="phone-help"
                      placeholder={isDomestic ? "010-0000-0000" : customer.phonePlaceholder}
                    />
                  </div>
                  <details className="text-xs leading-relaxed text-muted">
                    <summary className="min-h-11 cursor-pointer py-3 font-medium">{improvement.phoneCountry} · {layout.help}</summary>
                    <p id="phone-help" className="pb-2">{improvement.phoneHelp}</p>
                  </details>
                  {phoneTouched && (!checkedPhone.valid || !chineseMobileValid) ? <p role="alert" className="text-sm text-red-700">{country === "CN" && !chineseMobileValid ? improvement.china : improvement.phoneInvalid}</p> : null}
                </div>
              </div>
            </section>

            <section className="min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-6">
              <h2 className="mb-4 text-base font-semibold">{dict.checkout.shipping}</h2>
              <div className="grid min-w-0 grid-cols-2 gap-4 [&>*]:min-w-0">
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
                    {improvement.lastNameOptional}
                  </Label>
                  <Input
                    id="lastName"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <details className="col-span-2 text-xs leading-relaxed text-muted">
                  <summary className="min-h-11 cursor-pointer py-3 font-medium">{layout.help}</summary>
                  <p>{improvement.nameHelp}</p>
                </details>
                <p className="col-span-2 text-xs leading-relaxed text-muted">{improvement.addressHelp}</p>
                <div className="col-span-2 space-y-2">
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
                <div className="col-span-2 space-y-2">
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
                  {ADDRESS_REGIONS[country] ? <select id="region" required value={region} onChange={e=>setRegion(e.target.value)} autoComplete="address-level1" className="h-12 w-full rounded-xl border border-border bg-surface px-3 text-base sm:text-sm"><option value="">{dict.checkout.region}</option>{Object.entries(ADDRESS_REGIONS[country]).map(([code,name])=><option value={code} key={code}>{name} ({code})</option>)}</select> : <Input
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
                  />}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal">
                    {dict.checkout.postal}{" "}
                    {postalRequired && <span className="text-accent">*</span>}
                  </Label>
                  <Input
                    id="postal"
                    required={postalRequired}
                    autoComplete="postal-code"
                    value={postal}
                    placeholder={POSTAL_EXAMPLES[country]}
                    onChange={(e) => setPostal(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {!isDomestic ? (
              <div className="space-y-3 lg:hidden">
                {detailsError ? <p role="alert" className="rounded-xl border border-red-400 p-3 text-sm text-red-700">{detailsError}</p> : null}
                <Button type="button" size="lg" className="w-full whitespace-normal" onClick={continueToReview}>{layout.continue} →</Button>
              </div>
            ) : null}
          </div> : null}

          <aside className={cn("h-fit min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-6 lg:sticky lg:top-24 lg:block", !isDomestic && mobileStep === "details" && "hidden")}>
            {!isDomestic && mobileStep === "review" && !pendingOrder ? (
              <div className="mb-4 space-y-2 border-b border-border pb-4 lg:hidden">
                <p className="break-words text-sm font-medium">{firstName} {lastName} · {email}</p>
                <p className="break-words text-xs leading-relaxed text-muted">{[address, address2, city, region, postal, COUNTRIES.find(entry => entry.code === country) ? countryName(COUNTRIES.find(entry => entry.code === country)!, locale) : country].filter(Boolean).join(", ")}</p>
                <button type="button" className="min-h-11 text-sm font-medium underline underline-offset-4" onClick={() => showMobileStep("details")}>{layout.edit}</button>
              </div>
            ) : null}
            <h2 className="mb-4 text-base font-semibold">{dict.checkout.summary}</h2>
            {cart.some(item => item.specialOrder) ? <div className="mb-4"><SpecialOrderNotice locale={locale} /></div> : null}
            <div className="space-y-3">
              {cart.map((item, index) => {
                const product = getProduct(item.productId);
                if (!product) return null;
                return (
                  <div
                    key={`${item.productId}-${item.specialOrder ? "special" : "standard"}-${item.size}-${item.optionKey}-${item.sizeFit}-${designKey(item.partNames)}`}
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
                        {item.specialOrder ? `${specialOrderCopy(locale).special} · ` : ""}
                        {dict.cart.qty} {item.qty}
                        {item.size ? ` · ${formatCartSize(item, locale)}` : ""}
                        {item.optionLabel ? ` · ${customerOptionLabel(item.optionLabel, locale)}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="price-num text-sm font-medium">
                        {yen ? formatYen(yen.unitPricesJpy[index] * item.qty, locale) : lineTotal({...product,priceKrw:product.priceKrw+(item.extraKrw??0),priceUsd:product.priceUsd+(item.extraUsd??0)}, item.qty, currency)}
                      </p>
                      <button
                        type="button"
                        className="min-h-11 min-w-11 text-sm text-muted underline underline-offset-4 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={placing || Boolean(pendingOrder) || paymentInFlight}
                        aria-label={`${dict.cart.remove}: ${productDisplayName(product, locale)} · ${formatCartSize(item, locale)}`}
                        onClick={() => {
                          if (placing || pendingOrder || paymentInFlightRef.current) return;
                          // Only the local, unpaid cart line changes. Never mutate a saved order.
                          setTermsAccepted(false);
                          setOrderError("");
                          removeFromCart(item.productId, item.size, item.optionKey, item.sizeFit, item.partNames, item.specialOrder);
                        }}
                      >
                        {dict.cart.remove}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">{dict.cart.subtotal}</span>
                <span className="price-num">
                  {isKrw ? fmtKrw(subtotalKrw) : yen ? formatYen(yen.subtotalJpy, locale) : formatMoney(subtotalUsd, currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{dict.cart.shipping}</span>
                <span className="price-num">
                  {!country
                    ? review.selectCountry
                    : salesUnavailable
                      ? "—"
                    : !quote.available || importPolicy.consultationRequired
                      ? improvement.consult
                      : quote.free
                        ? customer.freeShipping
                        : isKrw
                          ? fmtKrw(shippingKrw)
                          : yen ? formatYen(yen.shippingJpy, locale) : formatMoney(shippingUsd, currency)}
                </span>
              </div>
              {isDomestic ? (
                <p className="rounded-xl bg-surface-muted px-3 py-2 text-xs text-muted">
                  {copy.freeKr}
                </p>
              ) : null}
              {!isDomestic ? (
                <p className="text-xs leading-relaxed text-muted">{review.notIncluded}</p>
              ) : null}
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <span>{isDomestic ? dict.cart.total : improvement.today}</span>
                <span className="price-num">
                  {!country || !quote.available || importPolicy.consultationRequired
                    ? "—"
                    : isKrw
                      ? fmtKrw(totalKrw)
                      : yen ? formatYen(yen.totalJpy, locale) : formatMoney(totalUsd, currency)}
                </span>
              </div>
            </div>

            <section className="mt-5 min-w-0 border-t border-border pt-4">
              <h2 className="mb-3 text-base font-semibold">{dict.checkout.payment}</h2>
              {isDomestic ? (
                <p className="text-sm leading-relaxed text-muted">{customer.domesticRedirect}</p>
              ) : (
                <>
                  <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 [&>*]:min-w-0">
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
                      amount={isKrw ? fmtKrw(totalKrw) : yen ? formatYen(yen.totalJpy, locale) : formatMoney(totalUsd, currency)}
                      depositor={depositor}
                      onDepositor={setDepositor}
                    />
                  ) : null}
                  <p className="mt-4 text-xs text-muted">{paymentCurrencyNotice(locale, paymentCurrency)}</p>
                </>
              )}
            </section>

            {!isDomestic && !pendingOrder ? (
              <section
                className="mt-4 space-y-3 border-t border-border pt-4"
                lang={locale}
                dir={locale === "ar" ? "rtl" : undefined}
              >
                <h3 className="text-lg font-semibold">{review.title}</h3>
                {customItems.length ? (
                  <>
                    <h4 className="text-sm font-medium">{review.designTitle}</h4>
                    {!validDesigns ? (
                      <div role="alert" className="rounded border border-red-400 p-3 text-sm">
                        <p>{review.missing}</p>
                        <Link to="/customize" className="mt-2 block underline">
                          {review.simulator}
                        </Link>
                      </div>
                    ) : null}
                    {validDesigns && !previewsReady ? (
                      <div role="status" className="text-sm">
                        <p>{previewFailed ? review.imageError : review.loading}</p>
                        {previewFailed ? (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setPreviewAttempt((n) => n + 1)}
                          >
                            {review.retry}
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                    {customItems.map((item, i) => (
                      <figure
                        key={`${i}-${designKey(item.partNames)}`}
                        className="overflow-hidden rounded-xl border border-border"
                      >
                        {designPreviews[designKey(item.partNames)] ? (
                          <img
                            src={designPreviews[designKey(item.partNames)]}
                            alt={review.designTitle}
                            className="mx-auto h-36 w-full object-contain sm:h-52"
                          />
                        ) : null}
                        <figcaption className="space-y-2 p-3 text-sm">
                          <p className="font-semibold">
                            {formatCartSize(item, locale)} · {dict.cart.qty} {item.qty}
                          </p>
                          <details className="text-sm leading-relaxed">
                            <summary className="min-h-11 cursor-pointer py-3 font-medium">
                              {customer.designDetails}
                            </summary>
                            <p className="mb-2 text-muted">{review.design}</p>
                            <p className="text-muted">{designSpecLine(item.partNames, locale)}</p>
                          </details>
                        </figcaption>
                      </figure>
                    ))}
                  </>
                ) : null}
                <p className="text-sm leading-relaxed">{packing.hasShoes ? review.production : improvement.accessoryTiming}</p>
                <section className="space-y-2 rounded-xl border border-amber-500/40 bg-amber-50 p-3 text-sm leading-relaxed text-neutral-950" aria-live="polite">
                  <h4 className="font-semibold">{improvement.noticeTitle}</h4>
                  <p>{dutyText}</p>
                  {country && countryImportNotice(country, locale, packing.hasShoes) !== dutyText ? (
                    <p>{countryImportNotice(country, locale, packing.hasShoes)}</p>
                  ) : null}
                  {!salesUnavailable && (importPolicy.consultationRequired || quote.reason === "parcel_quote") ? <>
                    <p>{quote.reason === "parcel_quote" ? improvement.parcelQuote : improvement.consultHelp}</p>
                    <a href={`/contact?lang=${encodeURIComponent(locale)}&country=${encodeURIComponent(country)}`} className="inline-flex min-h-12 items-center rounded-xl bg-neutral-950 px-5 font-semibold text-white">{improvement.consult} ↗</a>
                  </> : null}
                </section>
                <details className="rounded-xl border border-border p-3 text-sm leading-relaxed">
                  <summary className="min-h-11 cursor-pointer py-3 font-medium">
                    {customer.details}
                  </summary>
                  <p className="text-muted">{salesUnavailable ? improvement.salesUnavailable : packing.requiresQuote ? improvement.parcelQuote : review.shipping}</p>
                  <p className="mt-3 text-muted">{improvement.declaration}</p>
                </details>
                {!quote.available && country ? (
                  <p role="alert" className="text-sm text-red-600">
                    {shippingBlocker}{" "}
                    {!salesUnavailable ? <a
                      href="https://www.instagram.com/jidokaan/"
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      {review.contactLink}
                    </a> : <a href="#country" className="underline">{review.selectCountry} ↑</a>}
                  </p>
                ) : null}
                <section className="space-y-2 rounded-xl border border-border p-3 text-sm leading-relaxed">
                  <h4 className="font-medium">{cancellationPolicy.title}</h4>
                  <div className="space-y-2 text-muted">
                    <p>{cancellationPolicy.returns}</p>
                    <p>{cancellationPolicy.cancellation}</p>
                    <p>{cancellationPolicy.paypalFee}</p>
                  </div>
                </section>
                <label
                  htmlFor="checkout-consent"
                  className="flex min-h-14 cursor-pointer touch-manipulation items-start gap-3 rounded-xl border border-border-strong bg-surface-muted p-4 text-sm leading-relaxed focus-within:ring-2 focus-within:ring-ring"
                >
                  <input
                    id="checkout-consent"
                    name="checkout-consent"
                    type="checkbox"
                    required
                    checked={termsAccepted}
                    aria-describedby={consentBlocker ? "checkout-consent-status" : undefined}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 size-6 shrink-0 cursor-pointer accent-primary"
                  />
                  <span>{review.agree}</span>
                </label>
                {consentBlocker ? (
                  <div
                    id="checkout-consent-status"
                    role="status"
                    aria-live="polite"
                    className="space-y-3 rounded-xl border border-amber-500/40 p-3 text-sm leading-relaxed"
                  >
                    <p>{consentBlocker}</p>
                    {!country || salesUnavailable ? (
                      <a href="#country" className="inline-flex min-h-11 items-center underline">
                        {dict.checkout.country} ↑
                      </a>
                    ) : null}
                    {!validDesigns ? (
                      <Link to="/customize" className="inline-flex min-h-11 items-center underline">
                        {review.simulator}
                      </Link>
                    ) : null}
                    {previewFailed && validDesigns ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-11"
                        onClick={() => setPreviewAttempt((n) => n + 1)}
                      >
                        {review.retry}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </section>
            ) : null}

            {orderError ? (
              <p
                role="alert"
                className="mt-4 rounded border border-red-400 p-3 text-sm text-red-600"
              >
                {orderError}
              </p>
            ) : null}
            {pendingOrder ? (
              <div className="mt-4 rounded border border-amber-500 p-4">
                <p className="text-sm">{customer.paymentPending}</p>
                <p className="mt-2 break-all text-xs">
                  PayPal · {customer.orderNumber}: {String(pendingOrder.paypalOrderId ?? "")}
                </p>
                <Button
                  className="mt-3"
                  type="button"
                  disabled={placing}
                  onClick={() => void saveOrderPayload(pendingOrder)}
                >
                  {customer.retrySave}
                </Button>
              </div>
            ) : null}
            {IS_REVIEW_PREVIEW && !isDomestic ? (
              <div className="mt-6 rounded-xl border border-dashed border-amber-500 p-4">
                <p className="text-sm leading-relaxed">
                  {detail.preview}
                </p>
                <Button
                  type="button"
                  size="lg"
                  className="mt-3 w-full"
                  disabled={placing || !canPay}
                  onClick={(event) => {
                    if (!event.currentTarget.form?.reportValidity()) return;
                    const payload=buildOrderPayload();
                    if (!payload) return;
                    saveReviewOrder({...payload,id:REVIEW_ORDER_ID,createdAt:new Date().toISOString(),status:"paid",pay:"paypal"} as StoreOrder);
                    void navigate({ to: "/order-success", search: { order: REVIEW_ORDER_ID } });
                  }}
                >
                  {detail.previewConfirm}
                </Button>
              </div>
            ) : !isDomestic && pay === "paypal" && !pendingOrder ? (
              <div className="mt-6">
                <PaypalButtons
                  value={paymentValue.toFixed(paymentCurrency === "JPY" ? 0 : 2)}
                  currency={paymentCurrency === "JPY" ? "JPY" : "USD"}
                  disabled={placing || !canPay || paymentValue <= 0}
                  locale={locale}
                  onPaid={(orderID) => placeStoreOrder(orderID)}
                  getOrder={() => buildOrderPayload()}
                  onPending={markPending}
                  onActivity={onPaymentActivity}
                  onSaved={finishOrder}
                />
              </div>
            ) : !isDomestic && !pendingOrder ? (
              <Button type="submit" size="lg" className="mt-6 w-full" disabled={placing || !canPay}>
                {placing ? dict.checkout.placing : dict.checkout.placeOrder}
              </Button>
            ) : null}
            <p className="mt-3 text-center text-xs text-subtle">jidokaan.com</p>
            <p className="mt-3 text-center text-sm text-muted">
              <a
                href="https://ig.me/m/jidokaan"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                {customer.instagramAction} · @jidokaan ↗
              </a>
            </p>
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
  pay:
    | {
        krBank?: string;
        krAccount?: string;
        krHolder?: string;
        krMemo?: string;
        intlBank?: string;
        intlAccount?: string;
        intlSwift?: string;
        intlHolder?: string;
        intlPaypal?: string;
      }
    | undefined;
  amount: string;
  depositor: string;
  onDepositor: (v: string) => void;
}) {
  const customer = customerOrderCopy(locale);
  const cancellationPolicy = internationalOrderPolicy(locale);
  const ready = domestic
    ? Boolean(pay?.krBank && pay?.krAccount)
    : Boolean((pay?.intlBank && pay?.intlAccount) || pay?.intlPaypal);
  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-border bg-surface-muted p-4 text-sm">
      <p className="font-semibold">
        {customer.amountDue} · {amount}
      </p>
      {ready ? (
        domestic ? (
          <ul className="space-y-1 text-muted">
            <li>
              {customer.bank}: <b className="text-fg">{pay?.krBank}</b>
            </li>
            <li>
              {customer.account}: <b className="text-fg">{pay?.krAccount}</b>
            </li>
            <li>
              {customer.holder}: <b className="text-fg">{pay?.krHolder}</b>
            </li>
            {pay?.krMemo ? (
              <li>{pay.krMemo.includes("주문번호") ? customer.transferMemo : pay.krMemo}</li>
            ) : (
              <li>{customer.transferMemo}</li>
            )}
          </ul>
        ) : (
          <ul className="space-y-1 text-muted">
            {pay?.intlBank ? (
              <li>
                {customer.bank}: <b className="text-fg">{pay.intlBank}</b>
              </li>
            ) : null}
            {pay?.intlAccount ? (
              <li>
                {customer.account} / IBAN: <b className="text-fg">{pay.intlAccount}</b>
              </li>
            ) : null}
            {pay?.intlSwift ? (
              <li>
                SWIFT: <b className="text-fg">{pay.intlSwift}</b>
              </li>
            ) : null}
            {pay?.intlHolder ? (
              <li>
                {customer.holder}: <b className="text-fg">{pay.intlHolder}</b>
              </li>
            ) : null}
            {pay?.intlPaypal ? (
              <li>
                PayPal: <b className="text-fg">{pay.intlPaypal}</b>
              </li>
            ) : null}
          </ul>
        )
      ) : (
        <p className="text-muted">{customer.bankUnavailable}</p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="depositor">{customer.depositor}</Label>
        <Input
          id="depositor"
          value={depositor}
          onChange={(e) => onDepositor(e.target.value)}
          required={pay === undefined ? false : true}
          placeholder={customer.depositor}
        />
      </div>
    </div>
  );
}

import { loadPaypalSdk, paypalLocaleNotice, type PaypalSdk } from "@/lib/paypal-sdk";

function PaypalButtons({
  locale,
  value,
  currency,
  disabled,
  onPaid,
  getOrder,
  onPending,
  onSaved,
  onActivity,
}: {
  locale: string;
  value: string;
  currency: "USD" | "JPY";
  disabled: boolean;
  onPaid: (orderID: string) => Promise<void>;
  getOrder: () => Record<string, unknown> | undefined;
  onPending: (payload: Record<string, unknown>) => void;
  onSaved: (order: StoreOrder) => void;
  onActivity: (owner: symbol, active: boolean) => void;
}) {
  const review = checkoutCopy(locale);
  const copyRef = useRef(review);
  copyRef.current = review;
  const slot = useRef<HTMLDivElement>(null);
  const paidRef = useRef(onPaid);
  paidRef.current = onPaid;
  const callbacks = useRef({ getOrder, onPending, onSaved, onActivity });
  callbacks.current = { getOrder, onPending, onSaved, onActivity };
  const [loaded, setLoaded] = useState(false);
  const [clientId, setClientId] = useState("");
  const [ready, setReady] = useState<{ clientId: string; locale: string; currency: "USD" | "JPY"; api: PaypalSdk } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const localeNotice = paypalLocaleNotice(locale);

  useEffect(() => {
    const controller = new AbortController();
    setErr(null);
    setLoaded(false);
    setClientId("");
    void fetch("/api/paypal", { signal: controller.signal })
      .then((r) => r.json())
      .then((d: { enabled?: boolean; clientId?: string }) => {
        if (!controller.signal.aborted && d.enabled && d.clientId) setClientId(d.clientId);
      })
      .catch(() => { if (!controller.signal.aborted) setErr(copyRef.current.paymentUnavailable); })
      .finally(() => { if (!controller.signal.aborted) setLoaded(true); });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    setReady(null);
    if (!clientId) return;
    let active = true;
    setErr(null);
    void loadPaypalSdk(clientId, locale, undefined, currency)
      .then(api => { if (active) setReady({ clientId, locale, currency, api }); })
      .catch(() => { if (active) setErr(copyRef.current.paymentUnavailable); });
    return () => { active = false; };
  }, [clientId, locale, currency, attempt]);

  useEffect(() => {
    if (!ready || ready.locale !== locale || ready.currency !== currency || ready.clientId !== clientId || !slot.current || disabled) {
      if (slot.current) slot.current.innerHTML = "";
      return;
    }
    const host = slot.current;
    // Give every render its own node. A late render from the previous language
    // can only append to its detached node, never replace the current buttons.
    const mount = document.createElement("div");
    host.replaceChildren(mount);
    let active = true;
    // Kept with this SDK instance so late callbacks never adopt a newer attempt.
    const paymentOwner = Symbol("paypal-checkout");
    let createPromise: Promise<string> | null = null;
    const releasePayment = () => {
      createPromise = null;
      callbacks.current.onActivity(paymentOwner, false);
    };
    const submitted = { current: null as Record<string, unknown> | null };
    const buttons = ready.api.Buttons({
      style: { layout: "vertical", color: "gold", label: "paypal" },
      createOrder: async () => {
        if (createPromise) return createPromise;
        if (!active) throw new Error("STALE_PAYMENT_UI");
        const form = host.closest("form");
        if (form && !form.reportValidity()) throw new Error("form");
        const order = callbacks.current.getOrder();
        if (!order) throw new Error(copyRef.current.confirmError);
        submitted.current = order;
        callbacks.current.onActivity(paymentOwner, true);
        const attemptPromise = (async () => {
          const res = await fetch("/api/paypal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "create", value, currency, order }),
          });
          const data = (await res.json()) as { id?: string; error?: string };
          if (!res.ok || !data.id) {
            setErr(copyRef.current.refresh);
            throw new Error("create");
          }
          return data.id;
        })();
        // Duplicate SDK create callbacks reuse the same draft and request, not an error.
        createPromise = attemptPromise;
        try {
          return await attemptPromise;
        } catch (error) {
          if (createPromise === attemptPromise) releasePayment();
          throw error;
        }
      },
      onCancel: () => { releasePayment(); },
      onApprove: async (data: { orderID: string }) => {
        if (submitted.current)
          callbacks.current.onPending({ ...submitted.current, paypalOrderId: data.orderID });
        const res = await fetch("/api/paypal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "capture", orderID: data.orderID }),
        });
        if (!res.ok) throw new Error("capture");
        const result = (await res.json()) as { order?: StoreOrder };
        if (result.order?.id) callbacks.current.onSaved(result.order);
        else await paidRef.current(data.orderID);
      },
      onError: () => {
        releasePayment();
        if (active) setErr((current) => current || copyRef.current.paymentError);
      },
    });
    void buttons.render(mount).catch(() => { if (active) setErr(copyRef.current.paymentUnavailable); });
    return () => {
      active = false;
      mount.remove();
      try {
        void Promise.resolve(buttons.close?.()).catch(() => {});
      } catch {
        /* ignore */
      }
    };
  }, [ready, value, currency, disabled, locale, clientId]);

  if (!clientId) {
    return (
      <div className="text-sm text-muted">
        <p>{loaded ? review.paymentUnavailable : review.paymentLoading}</p>
        {loaded ? <Button type="button" variant="secondary" className="mt-2" onClick={() => setAttempt(n => n + 1)}>{review.retry}</Button> : null}
      </div>
    );
  }
  return (
    <div>
      {localeNotice ? <p className="mb-3 text-sm leading-relaxed text-muted">{localeNotice}</p> : null}
      {err ? <p className="mb-2 text-sm text-danger">{err}</p> : null}
      {err ? <Button type="button" variant="secondary" className="mb-3" onClick={() => setAttempt(n => n + 1)}>{review.retry}</Button> : null}
      {!ready && !err ? <p role="status" className="text-sm text-muted">{review.paymentLoading}</p> : null}
      <div ref={slot} />
    </div>
  );
}
