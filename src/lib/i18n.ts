export type Locale =
  | "ko"
  | "en"
  | "ja"
  | "es"
  | "th"
  | "fr"
  | "de"
  | "ar"
  | "ru"
  | "it"
  | "pt"
  | "tr"
  | "uz"
  | "zh"
  | "hi"
  | "tl";
export type Currency = "USD" | "EUR" | "KRW" | "JPY" | "GBP";

export function currencyForCountry(code: string): Currency {
  return code.toUpperCase() === "KR" ? "KRW" : "USD";
}

export const LOCALES: { id: Locale; label: string; native: string }[] = [
  { id: "ko", label: "Korean", native: "한국어" },
  { id: "en", label: "English", native: "English" },
  { id: "es", label: "Spanish", native: "Español" },
  { id: "th", label: "Thai", native: "ไทย" },
  { id: "fr", label: "French", native: "Français" },
  { id: "de", label: "German", native: "Deutsch" },
  { id: "ar", label: "Arabic", native: "العربية" },
  { id: "ja", label: "Japanese", native: "日本語" },
  { id: "zh", label: "Chinese", native: "中文" },
  { id: "ru", label: "Russian", native: "Русский" },
  { id: "it", label: "Italian", native: "Italiano" },
  { id: "pt", label: "Portuguese", native: "Português" },
  { id: "tr", label: "Turkish", native: "Türkçe" },
  { id: "uz", label: "Uzbek", native: "Oʻzbekcha" },
  { id: "hi", label: "Hindi", native: "हिन्दी" },
  { id: "tl", label: "Filipino", native: "Filipino" },
];


export const CURRENCIES: {
  id: Currency;
  label: string;
  symbol: string;
  rateFromUsd: number;
  decimals: number;
}[] = [
  { id: "KRW", label: "Korean Won", symbol: "₩", rateFromUsd: 1380, decimals: 0 },
  { id: "USD", label: "US Dollar", symbol: "$", rateFromUsd: 1, decimals: 2 },
];

export const CHECKOUT_CURRENCIES = CURRENCIES;

import type { Product } from "@/lib/products";

/** Prefer official KRW prices when showing KRW */
export function formatProductPrice(product: Product, currency: Currency) {
  if (currency === "KRW") {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(product.priceKrw);
  }
  return formatMoney(product.priceUsd, currency);
}

export function formatProductCompare(product: Product, currency: Currency) {
  if (!product.compareAtUsd && !product.compareAtKrw) return null;
  if (currency === "KRW" && product.compareAtKrw) {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(product.compareAtKrw);
  }
  if (product.compareAtUsd) return formatMoney(product.compareAtUsd, currency);
  return null;
}

export function formatMoney(priceUsdCents: number, currency: Currency) {
  const meta = CURRENCIES.find((c) => c.id === currency) ?? CURRENCIES[1];
  const amount = (priceUsdCents / 100) * meta.rateFromUsd;
  return new Intl.NumberFormat(
    currency === "KRW" ? "ko-KR" : currency === "JPY" ? "ja-JP" : "en-US",
    {
      style: "currency",
      currency,
      maximumFractionDigits: meta.decimals,
      minimumFractionDigits: meta.decimals,
    },
  ).format(amount);
}

export function lineTotal(
  product: Product,
  qty: number,
  currency: Currency,
): string {
  if (currency === "KRW") {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(product.priceKrw * qty);
  }
  return formatMoney(product.priceUsd * qty, currency);
}

export type Dictionary = {
  brand: string;
  brandEn: string;
  tagline: string;
  domain: string;
  nav: {
    shop: string;
    about: string;
    shipping: string;
    cart: string;
    account: string;
    signIn: string;
    custom: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
    secondary: string;
    ships: string;
  };
  home: {
    originKicker: string;
    originTitle: string;
    originBody: string;
    originItems: [string, string, string];
    craftKicker: string;
    craftTitle: string;
    craftBody: string;
    craftItems: [string, string, string];
    clickStudio: string;
    buildTitle: string;
    buildBody: string;
    viewAll: string;
    studioLabel: string;
  };
  custom: {
    back: string;
    reset: string;
    resetToast: string;
    guide2d: string;
    guide3d: string;
    allParts: string;
    shipTo: string;
    lockOrder: string;
    rotateHint: string;
    added: string;
    colorNote: string;
    expandPreview: string;
    closePreview: string;
    men: string;
    women: string;
    sizeGuideTitle: string;
    sizeGuideBody: string;
  };
  trust: {
    freeShip: string;
    freeShipBody: string;
    duties: string;
    dutiesBody: string;
    returns: string;
    returnsBody: string;
    secure: string;
    secureBody: string;
  };
  sections: {
    featured: string;
    featuredBody: string;
    categories: string;
    categoriesBody: string;
    why: string;
    whyBody: string;
    countries: string;
  };
  shop: {
    title: string;
    all: string;
    filter: string;
    sort: string;
    sortFeatured: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
    sortRating: string;
    results: string;
    empty: string;
    inStock: string;
    outOfStock: string;
  };
  product: {
    addToCart: string;
    added: string;
    buyNow: string;
    shipsWorldwide: string;
    freeOver: string;
    materials: string;
    weight: string;
    shipsFrom: string;
    reviews: string;
    description: string;
    qty: string;
    related: string;
    size: string;
    color: string;
    leadTime: string;
    leadDays: string;
    customHint: string;
    upper: string;
    stripe: string;
    sole: string;
  };
  cart: {
    title: string;
    empty: string;
    emptyCta: string;
    subtotal: string;
    shipping: string;
    shippingCalc: string;
    total: string;
    checkout: string;
    continue: string;
    remove: string;
    qty: string;
  };
  checkout: {
    title: string;
    contact: string;
    email: string;
    phone: string;
    shipping: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    region: string;
    postal: string;
    country: string;
    payment: string;
    card: string;
    nameOnCard: string;
    expiry: string;
    cvc: string;
    placeOrder: string;
    placing: string;
    note: string;
    summary: string;
    freeShipNote: string;
    duty: string;
    freeShipAdd: string;
    payCard: string;
    payKakao: string;
    payNaver: string;
    payTransfer: string;
    payPaypal: string;
    signInFirst: string;
    payNote: string;
  };
  success: {
    title: string;
    body: string;
    order: string;
    continue: string;
  };
  about: {
    title: string;
    body: string;
    mission: string;
    missionBody: string;
    address: string;
    hours: string;
    studio: string;
  };
  shippingPage: {
    title: string;
    body: string;
    zones: string;
    asia: string;
    asiaBody: string;
    americas: string;
    americasBody: string;
    europe: string;
    europeBody: string;
    returns: string;
    returnsBody: string;
  };
  footer: {
    shop: string;
    help: string;
    company: string;
    rights: string;
    contact: string;
    faq: string;
    privacy: string;
    terms: string;
    instagram: string;
    address: string;
  };
  login: {
    title: string;
    body: string;
    continueWith: string;
    disabled: string;
    back: string;
    google: string;
    kakao: string;
    naver: string;
    email: string;
    password: string;
    name: string;
    signIn: string;
    signUp: string;
    haveAccount: string;
    noAccount: string;
    orEmail: string;
    guestCheckout: string;
    socialSoon: string;
    failed: string;
  };
  common: {
    currency: string;
    language: string;
    close: string;
    loading: string;
  };
};

const EN: Dictionary = {
  brand: "JIDOKAAN",
  brandEn: "JIDOKAAN",
  tagline: "Korea’s first custom handmade boxing shoes",
  domain: "jidokaan.com",
  nav: {
    shop: "Shop",
    about: "Brand",
    shipping: "Shipping",
    cart: "Cart",
    account: "Account",
    signIn: "Sign in",
    custom: "Custom order",
  },
  hero: {
    eyebrow: "100% Made in Korea · Global Shipping",
    title: "Your boxing shoes.\nAnywhere in the world.",
    body: "JIDOKAAN builds Korea’s first custom handmade boxing boots. Pick your colors, get pro-level comfort, ship worldwide from Seoul.",
    cta: "Shop custom boots",
    secondary: "Shipping info",
    ships: "Handcrafted in Seongsu · ~10 days · global delivery",
  },
  home: {
    originKicker: "ORIGIN",
    originTitle: "Korea’s first\nmade-to-order custom boxing shoes.",
    originBody:
      "JIDOKAAN makes every pair by hand, one at a time, in our Seongsu workshop. Combine the colors you love — we build them for you.",
    originItems: ["Handcrafted in Seongsu", "Made to order", "100% Made in Korea"],
    craftKicker: "CRAFT",
    craftTitle: "No compromise on fit.",
    craftBody:
      "Wide last, locked-in support, ring-ready grip. Pro feel first — then your design on top. ~10 day handmade lead time.",
    craftItems: ["Wide last", "High-grip sole", "~10 day make"],
    clickStudio: "Click · Custom studio",
    buildTitle: "Build your pair.",
    buildBody: "Design in Custom Studio, pick your country, place the order.",
    viewAll: "View all products",
    studioLabel: "Custom Studio",
  },
  custom: {
    back: "Back",
    reset: "Reset",
    resetToast: "Reset to default",
    guide2d: "GUIDE ON/OFF for parts. (product-accurate 2D)",
    guide3d: "3D is a preview mesh. Locked colors match 2D.",
    allParts: "All parts",
    shipTo: "Ship to",
    lockOrder: "Lock design · Order",
    rotateHint: "Drag to rotate · preview mesh",
    added: "Design locked — added to cart",
    colorNote: "Simulator colors may differ from the actual product",
    expandPreview: "Tap the photo to enlarge",
    closePreview: "Close",
    men: "Men",
    women: "Women",
    sizeGuideTitle: "Size guide",
    sizeGuideBody:
      "Women’s sizes are similar to most everyday shoes, so many customers order their usual size. Men’s sizes tend to run slightly larger than Nike and other common sneakers, so we recommend going one size down. If you have a wide foot, however, your regular size may fit better.",
  },
  trust: {
    freeShip: "Domestic free ship",
    freeShipBody: "Free in Korea over ₩50,000 · worldwide available",
    duties: "Duties upfront",
    dutiesBody: "Estimated tax & duty before you pay abroad",
    returns: "Made-to-order",
    returnsBody: "Cancel before production starts",
    secure: "Secure checkout",
    secureBody: "Cards & local methods (demo)",
  },
  sections: {
    featured: "The lineup",
    featuredBody: "DRONE series — comfort first, colors yours",
    categories: "Shop by type",
    categoriesBody: "From full custom to care kits",
    why: "Why JIDOKAAN",
    whyBody:
      "Built by hand in Korea for a wide, secure fit and ring-ready grip — then shipped to fighters everywhere.",
    countries: "Where we ship",
  },
  shop: {
    title: "All products",
    all: "All",
    filter: "Category",
    sort: "Sort",
    sortFeatured: "Featured",
    sortPriceAsc: "Price: low to high",
    sortPriceDesc: "Price: high to low",
    sortRating: "Top rated",
    results: "products",
    empty: "No products match these filters.",
    inStock: "Available",
    outOfStock: "Sold out",
  },
  product: {
    addToCart: "Add to cart",
    added: "Added",
    buyNow: "Order now",
    shipsWorldwide: "Ships worldwide",
    freeOver: "Free shipping in Korea over ₩50,000",
    materials: "Materials",
    weight: "Weight",
    shipsFrom: "Ships from",
    reviews: "reviews",
    description: "Details",
    qty: "Qty",
    related: "You may also like",
    size: "Size (mm)",
    color: "Color",
    leadTime: "Lead time",
    leadDays: "days (handmade)",
    customHint: "Pick upper, stripe, and sole colors for your DRONE.",
    upper: "Upper",
    stripe: "Stripe",
    sole: "Sole",
  },
  cart: {
    title: "Your cart",
    empty: "Your cart is empty.",
    emptyCta: "Browse the shop",
    subtotal: "Subtotal",
    shipping: "Shipping",
    shippingCalc: "Calculated at checkout",
    total: "Total",
    checkout: "Checkout",
    continue: "Continue shopping",
    remove: "Remove",
    qty: "Qty",
  },
  checkout: {
    title: "Checkout",
    contact: "Contact",
    email: "Email",
    phone: "Phone (optional)",
    shipping: "Shipping address",
    firstName: "First name",
    lastName: "Last name",
    address: "Address",
    city: "City",
    region: "State / region",
    postal: "Postal code",
    country: "Country",
    payment: "Payment",
    card: "Card number",
    nameOnCard: "Name on card",
    expiry: "Expiry",
    cvc: "CVC",
    placeOrder: "Place order",
    placing: "Placing order…",
    note: "Korea and worldwide check out on jidokaan.com.",
    summary: "Order summary",
    freeShipNote: "Qualifies for free domestic shipping",
    duty: "Est. duties & tax",
    freeShipAdd: "more for free domestic shipping",
    payCard: "Card",
    payKakao: "Kakao Pay",
    payNaver: "Naver Pay",
    payTransfer: "Bank transfer",
    payPaypal: "PayPal",
    signInFirst: "Sign in to save this order to your account",
    payNote:
      "Choose how you want to pay. Card and wallet payments go live once the official jidokaan.com checkout is connected. Your order is still received.",
  },
  success: {
    title: "Order received",
    body: "We’ll email production timing and tracking. Live site: jidokaan.com",
    order: "Order number",
    continue: "Back to shop",
  },
  about: {
    title: "JIDOKAAN — custom handmade boxing shoes",
    body: "Korea’s first custom handmade boxing shoe brand. Built one pair at a time in Seongsu, shipped to fighters worldwide.",
    mission: "Our promise",
    missionBody:
      "Comfort is a given. Keep the quality, keep the price honest — and let every fighter wear their own colors.",
    address: "36, Seongsui-ro 18-gil, Seongdong-gu, Seoul",
    hours: "10:00 – 18:00 (lunch 12–13)",
    studio: "Studio",
  },
  shippingPage: {
    title: "Shipping, duties & production",
    body: "Handmade first, then shipped domestic or international. ~10 days production + transit.",
    zones: "Shipping zones",
    asia: "Korea & Asia",
    asiaBody: "2–5 business days after make (KR) · 3–8 (Asia)",
    americas: "Americas",
    americasBody: "5–12 business days after make",
    europe: "Europe & rest",
    europeBody: "5–14 business days after make",
    returns: "Made-to-order policy",
    returnsBody:
      "Custom pairs may not accept simple change-of-mind returns after production starts. Contact support before make for size advice or cancel.",
  },
  footer: {
    shop: "Shop",
    help: "Help",
    company: "Brand",
    rights: "All rights reserved.",
    contact: "Contact",
    faq: "FAQ",
    privacy: "Privacy",
    terms: "Terms",
    instagram: "Instagram",
    address: "Seongsu, Seoul — JIDOKAAN studio",
  },
  login: {
    title: "Sign in",
    body: "One account on jidokaan.com — Korea and worldwide.",
    continueWith: "Continue with",
    disabled: "Sign-in is disabled.",
    back: "Back home",
    google: "Continue with Google",
    kakao: "Kakao",
    naver: "Naver",
    email: "Email",
    password: "Password",
    name: "Name",
    signIn: "Sign in",
    signUp: "Create account",
    haveAccount: "Already have an account? Sign in",
    noAccount: "New here? Create an account",
    orEmail: "or use email",
    guestCheckout: "Continue as guest",
    socialSoon:
      "Kakao and Naver open when jidokaan.com is live. Use Google or email for now.",
    failed: "Could not sign in. Please try again.",
  },
  common: {
    currency: "Currency",
    language: "Language",
    close: "Close",
    loading: "Loading…",
  },
};

function overlay(base: Dictionary, patch: DeepPartial<Dictionary>): Dictionary {
  return deepMerge(base, patch);
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends Array<infer U>
      ? Array<U>
      : DeepPartial<T[K]>
    : T[K];
};

function deepMerge<T>(base: T, patch: DeepPartial<T>): T {
  const out = { ...(base as object) } as T;
  for (const key of Object.keys(patch as object) as (keyof T)[]) {
    const pv = patch[key];
    const bv = (base as T)[key];
    if (
      pv &&
      typeof pv === "object" &&
      !Array.isArray(pv) &&
      bv &&
      typeof bv === "object" &&
      !Array.isArray(bv)
    ) {
      (out as Record<string, unknown>)[key as string] = deepMerge(
        bv,
        pv as DeepPartial<typeof bv>,
      );
    } else if (pv !== undefined) {
      (out as Record<string, unknown>)[key as string] = pv;
    }
  }
  return out;
}

export const DICT: Record<Locale, Dictionary> = {
  en: EN,
  ko: overlay(EN, {
    brand: "지도칸",
    tagline: "국내 최초 커스텀 수제 복싱화",
    nav: {
      shop: "샵",
      about: "브랜드",
      shipping: "배송·글로벌",
      cart: "장바구니",
      account: "계정",
      signIn: "로그인",
      custom: "커스텀 주문",
    },
    hero: {
      title: "나만의 복싱화를\n전 세계 어디든",
      body: "지도칸은 국내 최초 커스텀 제작 수제 복싱화 브랜드입니다. 원하는 컬러로 주문하고, 세계 어디서나 같은 착용감으로 신으세요.",
      cta: "커스텀 복싱화 보기",
      secondary: "배송 안내",
      ships: "성수 공방 제작 · 약 10일 · 글로벌 배송",
    },
    home: {
      originTitle: "대한민국 최초,\n주문제작 커스텀 복싱화.",
      originBody:
        "지도칸은 성수 공방에서 한 켤레씩 손으로 만듭니다.\n당신이 좋아하는 컬러를 조합하여 제작할 수 있습니다.",
      originItems: ["성수 공방 수제", "주문 제작", "100% Made in Korea"],
      craftTitle: "착화감은 타협하지 않습니다.",
      craftBody:
        "넓은 발볼, 안정적인 지지, 링 위 그립. 프로 장비의 감각을 유지하면서 원하는 디자인을 입힐 수 있게 설계했습니다. 수제 제작 약 10일.",
      craftItems: ["와이드 라스트", "고그립 솔", "약 10일 제작"],
      clickStudio: "클릭 · 커스텀 스튜디오",
      buildTitle: "나만의 복싱화를 만드세요.",
      buildBody: "커스텀 스튜디오에서 디자인한 뒤, 배송 국가만 고르면 주문이 끝납니다.",
      viewAll: "모든 상품 보기",
    },
    custom: {
      back: "뒤로",
      reset: "초기화",
      resetToast: "기본 컬러로 초기화",
      guide2d: "GUIDE ON/OFF로 부위(A–K)를 확인하세요. (제품 정확 뷰)",
      guide3d: "3D는 미리보기용입니다. 주문 확정 색은 2D와 동일합니다.",
      allParts: "전체 부위",
      shipTo: "배송 국가",
      lockOrder: "디자인 확정 · 주문",
      rotateHint: "드래그하여 회전 · 미리보기 메시",
      added: "디자인이 확정되어 장바구니에 담겼습니다",
      colorNote: "시뮬레이터의 색상과 실제와는 차이가 있습니다",
      expandPreview: "사진을 누르면 확대됩니다",
      closePreview: "닫기",
      men: "남성",
      women: "여성",
      sizeGuideTitle: "사이즈 선택 가이드",
      sizeGuideBody:
        "여성용은 보통의 신발들과 비슷하기에 정사이즈로 많이 주문해주시는 편입니다. 남성용은 나이키와 같은 일반적인 신발들보다 약간 더 크다는 평가가 많아 한 치수 작게 주문하시길 권장합니다. 다만 발볼이 두꺼운 경우에는 정사이즈가 더 잘 맞을 수 있습니다.",
    },
    trust: {
      freeShip: "국내 무료 배송",
      freeShipBody: "5만원 이상 국내 무료 · 해외 배송 가능",
      duties: "관세 미리 안내",
      dutiesBody: "해외 결제 전 예상 관·부가세 표시",
      returns: "수제 제작 안내",
      returnsBody: "주문제작 특성상 제작 전 취소 가능",
      secure: "안전한 결제",
      secureBody: "카드 · 간편결제 지원 (데모)",
    },
    sections: {
      featured: "지도칸 라인업",
      featuredBody: "DRONE 시리즈 — 착화감은 덤, 컬러는 당신 것",
      categories: "카테고리",
      categoriesBody: "커스텀부터 케어까지",
      whyBody:
        "미즈노급 착화감을 목표로, 국내에서 수작업으로 만들고, 전 세계로 보냅니다. 품질은 그대로, 가격은 합리적으로.",
      countries: "배송 가능 지역 예시",
    },
    shop: {
      title: "전체 제품",
      all: "전체",
      filter: "카테고리",
      sort: "정렬",
      sortFeatured: "추천순",
      sortPriceAsc: "낮은 가격",
      sortPriceDesc: "높은 가격",
      sortRating: "평점순",
      results: "개 제품",
      empty: "조건에 맞는 제품이 없습니다.",
      inStock: "주문 가능",
      outOfStock: "품절",
    },
    product: {
      addToCart: "장바구니 담기",
      added: "담았습니다",
      buyNow: "바로 주문",
      shipsWorldwide: "글로벌 배송 가능",
      freeOver: "국내 5만원 이상 무료 배송",
      materials: "소재",
      weight: "무게",
      shipsFrom: "출고지",
      reviews: "리뷰",
      description: "상세 설명",
      qty: "수량",
      related: "함께 보면 좋은 제품",
      size: "사이즈 (mm)",
      color: "컬러",
      leadTime: "제작 기간",
      leadDays: "일 내외 (수제)",
      customHint: "갑피 · 스트라이프 · 솔 컬러를 골라 나만의 DRONE을 만드세요.",
      upper: "갑피",
      stripe: "스트라이프",
      sole: "솔",
    },
    cart: {
      title: "장바구니",
      empty: "아직 담긴 제품이 없습니다.",
      emptyCta: "샵 둘러보기",
      subtotal: "소계",
      shipping: "배송비",
      shippingCalc: "결제 시 계산",
      total: "합계",
      checkout: "주문하기",
      continue: "쇼핑 계속",
      remove: "삭제",
      qty: "수량",
    },
    checkout: {
      title: "주문 · 결제",
      contact: "연락처",
      email: "이메일",
      phone: "전화번호 (선택)",
      shipping: "배송지",
      firstName: "이름",
      lastName: "성",
      address: "주소",
      city: "도시",
      region: "주/도",
      postal: "우편번호",
      country: "국가",
      payment: "결제 정보",
      card: "카드 번호",
      nameOnCard: "카드 소유자",
      expiry: "유효기간",
      cvc: "CVC",
      placeOrder: "주문 확정",
      placing: "처리 중…",
      note: "국내·해외 모두 jidokaan.com에서 주문합니다.",
      summary: "주문 요약",
      freeShipNote: "국내 무료 배송 대상입니다",
      duty: "예상 관세·부가세",
      freeShipAdd: "더 담으면 국내 무료 배송",
      payCard: "신용/체크카드",
      payKakao: "카카오페이",
      payNaver: "네이버페이",
      payTransfer: "무통장입금",
      payPaypal: "페이팔",
      signInFirst: "로그인하면 주문이 계정에 저장됩니다",
      payNote:
        "결제 수단을 고르면 주문이 접수됩니다. 카드·페이는 jidokaan.com 결제 연결이 끝나는 즉시 바로 승인됩니다.",
    },
    success: {
      title: "주문이 접수되었습니다",
      body: "수제 제작 일정과 배송 안내를 이메일로 보내드립니다. 정식 운영 사이트: jidokaan.com",
      order: "주문 번호",
      continue: "샵으로 돌아가기",
    },
    about: {
      title: "지도칸 — 수제 커스텀 복싱화",
      body: "JIDOKAAN은 국내 최초로 커스텀 제작이 가능한 수제 복싱화를 만듭니다. 성수 공방에서 한 켤레씩 제작하며, 전 세계 복서에게 보냅니다.",
      mission: "우리의 약속",
      missionBody:
        "착용감은 덤. 품질은 그대로, 가격은 아래로. 원하는 컬러로 나만의 복싱화를 신을 수 있어야 한다는 믿음으로 만들었습니다.",
      address: "서울특별시 성동구 성수이로18길 36",
      hours: "오전 10시 – 오후 6시 (점심 12–1시)",
      studio: "공방",
    },
    shippingPage: {
      title: "배송 · 관세 · 제작",
      body: "수제 제작 후 국내·해외로 발송합니다. 제작 약 10일 + 배송 일정을 안내드립니다.",
      zones: "배송 권역",
      asia: "국내 · 아시아",
      asiaBody: "제작 후 2–5 영업일 (국내) · 3–8일 (아시아)",
      americas: "미주",
      americasBody: "제작 후 5–12 영업일",
      europe: "유럽 · 기타",
      europeBody: "제작 후 5–14 영업일",
      returns: "주문 제작 안내",
      returnsBody:
        "커스텀·수제 특성상 제작 착수 이후 단순 변심 반품이 제한될 수 있습니다. 제작 전 취소·사이즈 상담은 고객지원으로 문의해 주세요.",
    },
    footer: {
      shop: "샵",
      help: "고객지원",
      company: "브랜드",
      contact: "문의",
      privacy: "개인정보",
      terms: "이용약관",
      address: "서울 성동구 성수 (지도칸 공방)",
    },
    login: {
      title: "로그인",
      body: "국내·해외 모두 jidokaan.com 하나로 주문합니다.",
      continueWith: "계속하기",
      disabled: "로그인이 비활성화되어 있습니다.",
      back: "홈으로",
      google: "Google로 계속하기",
      kakao: "카카오 로그인",
      naver: "네이버 로그인",
      email: "이메일",
      password: "비밀번호",
      name: "이름",
      signIn: "로그인",
      signUp: "회원가입",
      haveAccount: "이미 계정이 있나요? 로그인",
      noAccount: "처음이신가요? 회원가입",
      orEmail: "또는 이메일로",
      guestCheckout: "비회원으로 주문",
      socialSoon:
        "카카오·네이버는 jidokaan.com 오픈 후 연결됩니다. 지금은 구글 또는 이메일로 바로 시작하세요.",
      failed: "로그인에 실패했습니다. 다시 시도해 주세요.",
    },
    common: {
      currency: "통화",
      language: "언어",
      close: "닫기",
      loading: "불러오는 중…",
    },
  }),
  ja: overlay(EN, {
    tagline: "韓国初のカスタム手製ボクシングシューズ",
    nav: {
      shop: "ショップ",
      about: "ブランド",
      shipping: "配送",
      cart: "カート",
      account: "アカウント",
      signIn: "ログイン",
      custom: "カスタム注文",
    },
    hero: {
      title: "自分だけの\nボクシングシューズを",
      body: "JIDOKAANは韓国初のカスタム手製ボクシングシューズ。好きなカラーでオーダーし、世界中どこでも同じ履き心地を。",
      cta: "カスタムを見る",
      secondary: "配送について",
      ships: "聖水で手製 · 約10日 · 海外配送",
    },
    home: {
      originTitle: "韓国初の\nカスタム手製。",
      originBody:
        "JIDOKAANは聖水の工房で一足ずつ手作業。量産ではなく、あなたのカラーとサイズに合わせた受注生産。",
      originItems: ["聖水で手製", "受注生産", "100% Made in Korea"],
      craftTitle: "履き心地は妥協しない。",
      craftBody:
        "幅広フィット、安定したサポート、リングのグリップ。プロ仕様の感覚を保ちながら、好きなデザインを。",
      craftItems: ["ワイドラスト", "高グリップソール", "約10日製作"],
      clickStudio: "クリック · カスタムスタジオ",
      buildTitle: "自分だけの一足を。",
      buildBody: "カスタムスタジオでデザインして、配送国を選ぶだけ。",
    },
    custom: {
      back: "戻る",
      reset: "リセット",
      resetToast: "初期カラーに戻しました",
      guide2d: "GUIDE ON/OFFでパーツ確認。(製品正確ビュー)",
      guide3d: "3Dはプレビュー。確定色は2Dと同じです。",
      allParts: "全パーツ",
      shipTo: "配送国",
      lockOrder: "デザイン確定 · 注文",
      rotateHint: "ドラッグで回転 · プレビュー",
      added: "デザインを確定してカートに追加しました",
      colorNote: "シミュレーターの色と実物は異なる場合があります",
      expandPreview: "写真をタップして拡大",
      closePreview: "閉じる",
      men: "メンズ",
      women: "レディース",
      sizeGuideTitle: "サイズ選びガイド",
      sizeGuideBody:
        "レディースは一般的な靴とほぼ同じなので、いつものサイズでご注文いただく方が多いです。メンズはナイキなど一般的なスニーカーよりやや大きめとの声が多く、ワンサイズ下げてのご注文をおすすめします。ただし、足幅が広い方はいつものサイズの方が合う場合もあります。",
    },
    about: { studio: "工房" },
    footer: { address: "ソウル 聖水（JIDOKAAN工房）" },
    common: { currency: "通貨", language: "言語", close: "閉じる", loading: "読み込み中…" },
  }),
  es: overlay(EN, {
    tagline: "El primer calzado de boxeo artesanal personalizado de Corea",
    nav: {
      shop: "Tienda",
      about: "Marca",
      shipping: "Envíos",
      cart: "Carrito",
      account: "Cuenta",
      signIn: "Entrar",
      custom: "Pedido custom",
    },
    hero: {
      title: "Tus zapatos de boxeo.\nEn cualquier país.",
      body: "JIDOKAAN fabrica a mano en Seúl el primer botín de boxeo custom de Corea. Elige colores, recibe confort de pro y envío mundial.",
      cta: "Ver custom",
      secondary: "Envíos",
      ships: "Hecho a mano en Seongsu · ~10 días · envío global",
    },
    home: {
      originTitle: "El primero de Corea\nhecho a mano.",
      originBody:
        "Cada par se cose a mano en Seongsu, Seúl: a tu color y talla, no en serie. El confort es estándar.",
      originItems: ["Hecho a mano en Seongsu", "Bajo pedido", "100% Made in Korea"],
      craftTitle: "Sin concesiones en el ajuste.",
      craftBody:
        "Horma ancha, sujeción firme, grip de ring. Primero el feeling pro, luego tu diseño. ~10 días de fabricación.",
      craftItems: ["Horma ancha", "Suela de alto grip", "~10 días"],
      clickStudio: "Clic · Estudio custom",
      buildTitle: "Crea tu par.",
      buildBody: "Diseña en el estudio, elige el país y pide.",
    },
    custom: {
      back: "Volver",
      reset: "Restablecer",
      resetToast: "Colores por defecto",
      guide2d: "GUIDE ON/OFF para ver las piezas. (2D fiel al producto)",
      guide3d: "El 3D es una vista previa. Los colores finales son los del 2D.",
      allParts: "Todas las piezas",
      shipTo: "Enviar a",
      lockOrder: "Confirmar diseño · Pedir",
      rotateHint: "Arrastra para girar",
      added: "Diseño guardado en el carrito",
      colorNote: "Los colores del simulador pueden diferir del producto real",
      expandPreview: "Toca la foto para ampliar",
      closePreview: "Cerrar",
      men: "Hombre",
      women: "Mujer",
      sizeGuideTitle: "Guía de tallas",
      sizeGuideBody:
        "Las tallas de mujer son similares a las de la mayoría de zapatos, por lo que muchos piden su talla habitual. Las de hombre suelen quedar un poco más grandes que Nike u otras zapatillas comunes, así que recomendamos pedir una talla menos. Si tienes el pie ancho, la talla habitual puede sentarte mejor.",
    },
    shop: {
      title: "Todos los productos",
      all: "Todo",
      filter: "Categoría",
      sort: "Ordenar",
      sortFeatured: "Destacados",
      sortPriceAsc: "Precio: menor",
      sortPriceDesc: "Precio: mayor",
      sortRating: "Mejor valorados",
      results: "productos",
      empty: "Nada coincide con estos filtros.",
      inStock: "Disponible",
      outOfStock: "Agotado",
    },
    product: {
      addToCart: "Añadir al carrito",
      added: "Añadido",
      buyNow: "Pedir ahora",
      shipsWorldwide: "Envío mundial",
      materials: "Materiales",
      weight: "Peso",
      shipsFrom: "Sale de",
      reviews: "reseñas",
      description: "Detalles",
      qty: "Cant.",
      related: "También te puede gustar",
      size: "Talla (mm)",
      color: "Color",
      leadTime: "Plazo",
      leadDays: "días (artesanal)",
      customHint: "Elige empeine, franja y suela de tu DRONE.",
      upper: "Empeine",
      stripe: "Franja",
      sole: "Suela",
    },
    cart: {
      title: "Tu carrito",
      empty: "El carrito está vacío.",
      emptyCta: "Ver tienda",
      subtotal: "Subtotal",
      shipping: "Envío",
      shippingCalc: "Se calcula al pagar",
      total: "Total",
      checkout: "Pagar",
      continue: "Seguir comprando",
      remove: "Quitar",
      qty: "Cant.",
    },
    checkout: {
      title: "Pago",
      contact: "Contacto",
      email: "Email",
      phone: "Teléfono (opcional)",
      shipping: "Dirección de envío",
      firstName: "Nombre",
      lastName: "Apellido",
      address: "Dirección",
      city: "Ciudad",
      region: "Estado / región",
      postal: "Código postal",
      country: "País",
      payment: "Pago",
      card: "Número de tarjeta",
      nameOnCard: "Nombre en la tarjeta",
      expiry: "Caducidad",
      placeOrder: "Confirmar pedido",
      placing: "Procesando…",
      note: "Tienda demo — sin cargo real. Pedidos reales: jidokaan.com",
      summary: "Resumen",
      duty: "Aranceles e impuestos est.",
    },
    success: {
      title: "Pedido recibido",
      body: "Te enviaremos plazos de fabricación y seguimiento. Sitio: jidokaan.com",
      order: "Número de pedido",
      continue: "Volver a la tienda",
    },
    about: {
      title: "JIDOKAAN — boxeo artesanal custom",
      body: "La primera marca coreana de botines de boxeo custom hechos a mano. Un par a la vez en Seongsu, para el mundo.",
      mission: "Nuestra promesa",
      studio: "Taller",
    },
    shippingPage: {
      title: "Envíos, aranceles y fabricación",
      body: "Primero a mano, luego envío nacional o internacional. ~10 días de fabricación + tránsito.",
      zones: "Zonas de envío",
      asia: "Corea y Asia",
      americas: "Américas",
      europe: "Europa y resto",
      returns: "Política bajo pedido",
    },
    footer: {
      shop: "Tienda",
      help: "Ayuda",
      company: "Marca",
      contact: "Contacto",
      privacy: "Privacidad",
      terms: "Términos",
      address: "Seongsu, Seúl — taller JIDOKAAN",
    },
    login: {
      title: "Entrar",
      body: "Sigue pedidos y fabricación.",
      continueWith: "Continuar con",
      disabled: "El acceso está desactivado.",
      back: "Inicio",
    },
    common: {
      currency: "Moneda",
      language: "Idioma",
      close: "Cerrar",
      loading: "Cargando…",
    },
  }),
  th: overlay(EN, {
    tagline: "รองเท้ามวยแฮนด์เมดคัสตอมแห่งแรกของเกาหลี",
    nav: {
      shop: "ร้านค้า",
      about: "แบรนด์",
      shipping: "การจัดส่ง",
      cart: "ตะกร้า",
      account: "บัญชี",
      signIn: "เข้าสู่ระบบ",
      custom: "สั่งคัสตอม",
    },
    hero: {
      title: "รองเท้ามวยของคุณ\nส่งได้ทั่วโลก",
      body: "JIDOKAAN ทำรองเท้ามวยแฮนด์เมดคัสตอมแห่งแรกของเกาหลี เลือกสี สวมสบายระดับโปร ส่งจากโซลทั่วโลก",
      cta: "ดูคัสตอม",
      secondary: "การจัดส่ง",
      ships: "ทำมือที่ซองซู · ประมาณ 10 วัน · ส่งทั่วโลก",
    },
    home: {
      originTitle: "แห่งแรกของเกาหลี\nทำมือคัสตอม",
      originBody:
        "ทำทีละคู่ที่ซองซู โซล ตามสีและไซส์ของคุณ ไม่ใช่โรงงานจำนวนมาก ความสบายมากับทุกคู่",
      originItems: ["ทำมือที่ซองซู", "ทำตามสั่ง", "100% Made in Korea"],
      craftTitle: "ไม่ยอมลดเรื่องฟิต",
      craftBody:
        "ลาสต์กว้าง ล็อกแน่น กริปริง รู้สึกแบบโปรก่อน แล้วค่อยใส่ดีไซน์ของคุณ ใช้เวลาทำมือประมาณ 10 วัน",
      craftItems: ["ลาสต์กว้าง", "พื้นกริปสูง", "ทำประมาณ 10 วัน"],
      clickStudio: "คลิก · สตูดิโอคัสตอม",
      buildTitle: "สร้างคู่ของคุณ",
      buildBody: "ออกแบบในสตูดิโอ เลือกประเทศ แล้วสั่งได้เลย",
    },
    custom: {
      back: "กลับ",
      reset: "รีเซ็ต",
      resetToast: "กลับเป็นสีเริ่มต้น",
      guide2d: "กด GUIDE ON/OFF เพื่อดูชิ้นส่วน (มุม 2D ตามสินค้าจริง)",
      guide3d: "3D เป็นพรีวิว สีที่ยืนยันตาม 2D",
      allParts: "ทุกชิ้นส่วน",
      shipTo: "ส่งไปที่",
      lockOrder: "ยืนยันดีไซน์ · สั่งซื้อ",
      rotateHint: "ลากเพื่อหมุน",
      added: "ล็อกดีไซน์แล้ว ใส่ตะกร้าแล้ว",
      colorNote: "สีในเครื่องจำลองอาจต่างจากสินค้าจริง",
      expandPreview: "แตะรูปเพื่อขยาย",
      closePreview: "ปิด",
      men: "ชาย",
      women: "หญิง",
      sizeGuideTitle: "คู่มือเลือกไซซ์",
      sizeGuideBody:
        "ไซซ์ผู้หญิงใกล้เคียงรองเท้าทั่วไป จึงมีคนสั่งไซซ์เดิมค่อนข้างมาก ไซซ์ผู้ชายมักใหญ่กว่าไนกี้หรือรองเท้าทั่วไปเล็กน้อย แนะนำให้สั่งเล็กลงหนึ่งไซซ์ แต่ถ้าเท้ากว้าง ไซซ์ปกติอาจพอดีกว่า",
    },
    shop: {
      title: "สินค้าทั้งหมด",
      all: "ทั้งหมด",
      filter: "หมวดหมู่",
      sort: "เรียง",
      results: "รายการ",
      empty: "ไม่พบสินค้าตามตัวกรอง",
      inStock: "พร้อมสั่ง",
      outOfStock: "หมด",
    },
    product: {
      addToCart: "ใส่ตะกร้า",
      added: "ใส่แล้ว",
      buyNow: "สั่งเลย",
      shipsWorldwide: "ส่งทั่วโลก",
      materials: "วัสดุ",
      weight: "น้ำหนัก",
      shipsFrom: "ส่งจาก",
      reviews: "รีวิว",
      description: "รายละเอียด",
      qty: "จำนวน",
      related: "คุณอาจชอบ",
      size: "ไซส์ (มม.)",
      color: "สี",
      leadTime: "ระยะเวลาทำ",
      leadDays: "วัน (ทำมือ)",
      upper: "อัปเปอร์",
      stripe: "ลาย",
      sole: "พื้น",
    },
    cart: {
      title: "ตะกร้าของคุณ",
      empty: "ตะกร้าว่าง",
      emptyCta: "เลือกซื้อ",
      subtotal: "ยอดย่อย",
      shipping: "ค่าส่ง",
      shippingCalc: "คำนวณตอนชำระ",
      total: "รวม",
      checkout: "ชำระเงิน",
      continue: "ซื้อต่อ",
      remove: "ลบ",
      qty: "จำนวน",
    },
    checkout: {
      title: "ชำระเงิน",
      contact: "ติดต่อ",
      email: "อีเมล",
      phone: "โทร (ไม่บังคับ)",
      shipping: "ที่อยู่จัดส่ง",
      firstName: "ชื่อ",
      lastName: "นามสกุล",
      address: "ที่อยู่",
      city: "เมือง",
      region: "รัฐ / จังหวัด",
      postal: "รหัสไปรษณีย์",
      country: "ประเทศ",
      payment: "การชำระเงิน",
      card: "เลขบัตร",
      nameOnCard: "ชื่อบนบัตร",
      expiry: "หมดอายุ",
      placeOrder: "ยืนยันคำสั่งซื้อ",
      placing: "กำลังดำเนินการ…",
      note: "ร้านเดโม — ไม่คิดเงินจริง สั่งจริงที่ jidokaan.com",
      summary: "สรุปคำสั่งซื้อ",
      duty: "ภาษีศุลกากรโดยประมาณ",
    },
    success: {
      title: "รับคำสั่งซื้อแล้ว",
      body: "เราจะอีเมลกำหนดทำและติดตามพัสดุ เว็บจริง: jidokaan.com",
      order: "เลขคำสั่งซื้อ",
      continue: "กลับไปร้านค้า",
    },
    about: {
      title: "JIDOKAAN — รองเท้ามวยแฮนด์เมดคัสตอม",
      mission: "คำมั่นของเรา",
      studio: "เวิร์กช็อป",
    },
    shippingPage: {
      title: "การจัดส่ง ภาษี และการผลิต",
      zones: "โซนจัดส่ง",
      asia: "เกาหลีและเอเชีย",
      americas: "ทวีปอเมริกา",
      europe: "ยุโรปและอื่นๆ",
    },
    footer: {
      shop: "ร้านค้า",
      help: "ช่วยเหลือ",
      company: "แบรนด์",
      contact: "ติดต่อ",
      privacy: "ความเป็นส่วนตัว",
      terms: "ข้อกำหนด",
      address: "ซองซู โซล — สตูดิโอ JIDOKAAN",
    },
    login: {
      title: "เข้าสู่ระบบ",
      body: "ติดตามคำสั่งซื้อและการผลิต",
      continueWith: "ดำเนินการต่อด้วย",
      disabled: "ปิดการเข้าสู่ระบบแล้ว",
      back: "หน้าแรก",
    },
    common: {
      currency: "สกุลเงิน",
      language: "ภาษา",
      close: "ปิด",
      loading: "กำลังโหลด…",
    },
  }),
  fr: overlay(EN, {
    tagline: "Les premières chaussures de boxe custom faites main de Corée",
    nav: {
      shop: "Boutique",
      about: "Marque",
      shipping: "Livraison",
      cart: "Panier",
      account: "Compte",
      signIn: "Connexion",
      custom: "Commande custom",
    },
    hero: {
      title: "Vos chaussures de boxe.\nPartout dans le monde.",
      body: "JIDOKAAN fabrique à Séoul les premières bottines de boxe custom coréennes. Choisissez vos couleurs, confort pro, livraison mondiale.",
      cta: "Voir le custom",
      secondary: "Livraison",
      ships: "Fait main à Seongsu · ~10 jours · mondial",
    },
    home: {
      originTitle: "Premier de Corée,\nfait main sur mesure.",
      originBody:
        "Chaque paire est cousue à la main à Seongsu, Séoul — à vos couleurs et votre pointure, pas en série.",
      originItems: ["Fait main à Seongsu", "Sur commande", "100% Made in Korea"],
      craftTitle: "Aucun compromis sur le fit.",
      craftBody:
        "Forme large, maintien ferme, grip de ring. Le feeling pro d’abord, puis votre design. ~10 jours de fabrication.",
      craftItems: ["Forme large", "Semelle high-grip", "~10 jours"],
      clickStudio: "Clic · Studio custom",
      buildTitle: "Créez votre paire.",
      buildBody: "Design dans le studio, choisissez le pays, commandez.",
    },
    custom: {
      back: "Retour",
      reset: "Réinitialiser",
      resetToast: "Couleurs par défaut",
      guide2d: "GUIDE ON/OFF pour voir les pièces. (2D fidèle au produit)",
      guide3d: "Le 3D est un aperçu. Les couleurs finales suivent le 2D.",
      allParts: "Toutes les pièces",
      shipTo: "Livrer vers",
      lockOrder: "Valider le design · Commander",
      rotateHint: "Glisser pour tourner",
      added: "Design validé — ajouté au panier",
      colorNote: "Les couleurs du simulateur peuvent différer du produit réel",
      expandPreview: "Touchez la photo pour agrandir",
      closePreview: "Fermer",
      men: "Homme",
      women: "Femme",
      sizeGuideTitle: "Guide des tailles",
      sizeGuideBody:
        "Les tailles femme sont proches de celles des chaussures classiques : beaucoup commandent leur pointure habituelle. Les tailles homme ont tendance à tailler un peu plus grand que Nike et la plupart des baskets, nous conseillons donc de prendre une pointure en dessous. En revanche, si vous avez le pied large, votre pointure habituelle peut mieux convenir.",
    },
    shop: {
      title: "Tous les produits",
      all: "Tout",
      filter: "Catégorie",
      sort: "Trier",
      sortFeatured: "En avant",
      sortPriceAsc: "Prix croissant",
      sortPriceDesc: "Prix décroissant",
      sortRating: "Mieux notés",
      results: "produits",
      empty: "Aucun produit pour ces filtres.",
      inStock: "Disponible",
      outOfStock: "Épuisé",
    },
    product: {
      addToCart: "Ajouter au panier",
      added: "Ajouté",
      buyNow: "Commander",
      shipsWorldwide: "Livraison mondiale",
      materials: "Matières",
      weight: "Poids",
      shipsFrom: "Expédié de",
      reviews: "avis",
      description: "Détails",
      qty: "Qté",
      related: "Vous aimerez aussi",
      size: "Pointure (mm)",
      color: "Couleur",
      leadTime: "Délai",
      leadDays: "jours (fait main)",
      upper: "Tige",
      stripe: "Bande",
      sole: "Semelle",
    },
    cart: {
      title: "Votre panier",
      empty: "Le panier est vide.",
      emptyCta: "Voir la boutique",
      subtotal: "Sous-total",
      shipping: "Livraison",
      shippingCalc: "Calculé au paiement",
      total: "Total",
      checkout: "Commander",
      continue: "Continuer",
      remove: "Retirer",
      qty: "Qté",
    },
    checkout: {
      title: "Paiement",
      contact: "Contact",
      email: "E-mail",
      phone: "Téléphone (optionnel)",
      shipping: "Adresse de livraison",
      firstName: "Prénom",
      lastName: "Nom",
      address: "Adresse",
      city: "Ville",
      region: "Région / État",
      postal: "Code postal",
      country: "Pays",
      payment: "Paiement",
      card: "Numéro de carte",
      nameOnCard: "Nom sur la carte",
      expiry: "Expiration",
      placeOrder: "Valider la commande",
      placing: "Traitement…",
      note: "Boutique démo — pas de vrai paiement. Commandes réelles : jidokaan.com",
      summary: "Récapitulatif",
      duty: "Droits & taxes est.",
    },
    success: {
      title: "Commande reçue",
      body: "Nous e-mailons les délais de fabrication et le suivi. Site : jidokaan.com",
      order: "N° de commande",
      continue: "Retour boutique",
    },
    about: {
      title: "JIDOKAAN — boxe custom faite main",
      mission: "Notre promesse",
      studio: "Atelier",
    },
    shippingPage: {
      title: "Livraison, droits et fabrication",
      zones: "Zones de livraison",
      asia: "Corée & Asie",
      americas: "Amériques",
      europe: "Europe & reste",
    },
    footer: {
      shop: "Boutique",
      help: "Aide",
      company: "Marque",
      contact: "Contact",
      privacy: "Confidentialité",
      terms: "Conditions",
      address: "Seongsu, Séoul — atelier JIDOKAAN",
    },
    login: {
      title: "Connexion",
      body: "Suivez commandes et fabrication.",
      continueWith: "Continuer avec",
      disabled: "La connexion est désactivée.",
      back: "Accueil",
    },
    common: {
      currency: "Devise",
      language: "Langue",
      close: "Fermer",
      loading: "Chargement…",
    },
  }),
  de: overlay(EN, {
    tagline: "Koreas erste maßgefertigten Boxschuhe aus Handarbeit",
    nav: {
      shop: "Shop",
      about: "Marke",
      shipping: "Versand",
      cart: "Warenkorb",
      account: "Konto",
      signIn: "Anmelden",
      custom: "Custom-Bestellung",
    },
    hero: {
      title: "Deine Boxschuhe.\nÜberall auf der Welt.",
      body: "JIDOKAAN fertigt in Seoul Koreas erste Custom-Boxstiefel von Hand. Farben wählen, Profi-Komfort, weltweiter Versand.",
      cta: "Custom ansehen",
      secondary: "Versand",
      ships: "Handarbeit in Seongsu · ~10 Tage · weltweit",
    },
    home: {
      originTitle: "Koreas erste\nCustom-Handarbeit.",
      originBody:
        "Jedes Paar entsteht von Hand in Seongsu, Seoul — in deiner Farbe und Größe, keine Massenware.",
      originItems: ["Handarbeit in Seongsu", "Auf Bestellung", "100% Made in Korea"],
      craftTitle: "Kein Kompromiss bei der Passform.",
      craftBody:
        "Weite Leisten, fester Halt, Ring-Grip. Erst das Profi-Gefühl, dann dein Design. ~10 Tage Fertigung.",
      craftItems: ["Weiter Leisten", "High-Grip-Sohle", "~10 Tage"],
      clickStudio: "Klick · Custom-Studio",
      buildTitle: "Bau dein Paar.",
      buildBody: "Im Studio gestalten, Land wählen, bestellen.",
    },
    custom: {
      back: "Zurück",
      reset: "Zurücksetzen",
      resetToast: "Standardfarben",
      guide2d: "GUIDE ON/OFF für die Teile. (produktgetreues 2D)",
      guide3d: "3D ist eine Vorschau. Finale Farben kommen aus dem 2D.",
      allParts: "Alle Teile",
      shipTo: "Liefern nach",
      lockOrder: "Design sichern · Bestellen",
      rotateHint: "Ziehen zum Drehen",
      added: "Design gesichert — im Warenkorb",
      colorNote: "Die Simulatorfarben können vom Original abweichen",
      expandPreview: "Foto antippen zum Vergrößern",
      closePreview: "Schließen",
      men: "Herren",
      women: "Damen",
      sizeGuideTitle: "Größenratgeber",
      sizeGuideBody:
        "Damengrößen entsprechen weitgehend normalen Schuhen, deshalb bestellen viele ihre übliche Größe. Herrengrößen fallen im Vergleich zu Nike und anderen gängigen Sneakern oft etwas größer aus — wir empfehlen eine Nummer kleiner. Bei einem breiten Fuß kann die normale Größe aber besser passen.",
    },
    shop: {
      title: "Alle Produkte",
      all: "Alle",
      filter: "Kategorie",
      sort: "Sortieren",
      sortFeatured: "Empfohlen",
      sortPriceAsc: "Preis aufsteigend",
      sortPriceDesc: "Preis absteigend",
      sortRating: "Beste Bewertung",
      results: "Produkte",
      empty: "Keine Treffer für diese Filter.",
      inStock: "Verfügbar",
      outOfStock: "Ausverkauft",
    },
    product: {
      addToCart: "In den Warenkorb",
      added: "Hinzugefügt",
      buyNow: "Jetzt bestellen",
      shipsWorldwide: "Weltweiter Versand",
      materials: "Materialien",
      weight: "Gewicht",
      shipsFrom: "Versand aus",
      reviews: "Bewertungen",
      description: "Details",
      qty: "Menge",
      related: "Das könnte dir gefallen",
      size: "Größe (mm)",
      color: "Farbe",
      leadTime: "Fertigungszeit",
      leadDays: "Tage (Handarbeit)",
      upper: "Schaft",
      stripe: "Streifen",
      sole: "Sohle",
    },
    cart: {
      title: "Dein Warenkorb",
      empty: "Der Warenkorb ist leer.",
      emptyCta: "Shop ansehen",
      subtotal: "Zwischensumme",
      shipping: "Versand",
      shippingCalc: "Wird an der Kasse berechnet",
      total: "Gesamt",
      checkout: "Zur Kasse",
      continue: "Weiter shoppen",
      remove: "Entfernen",
      qty: "Menge",
    },
    checkout: {
      title: "Kasse",
      contact: "Kontakt",
      email: "E-Mail",
      phone: "Telefon (optional)",
      shipping: "Lieferadresse",
      firstName: "Vorname",
      lastName: "Nachname",
      address: "Adresse",
      city: "Stadt",
      region: "Region / Bundesland",
      postal: "PLZ",
      country: "Land",
      payment: "Zahlung",
      card: "Kartennummer",
      nameOnCard: "Name auf der Karte",
      expiry: "Gültig bis",
      placeOrder: "Bestellung aufgeben",
      placing: "Wird verarbeitet…",
      note: "Demo-Shop — keine echte Zahlung. Echte Bestellungen: jidokaan.com",
      summary: "Zusammenfassung",
      duty: "Geschätzte Zölle & Steuern",
    },
    success: {
      title: "Bestellung eingegangen",
      body: "Wir mailen Fertigungszeit und Tracking. Live: jidokaan.com",
      order: "Bestellnummer",
      continue: "Zurück zum Shop",
    },
    about: {
      title: "JIDOKAAN — Custom-Boxschuhe von Hand",
      mission: "Unser Versprechen",
      studio: "Werkstatt",
    },
    shippingPage: {
      title: "Versand, Zölle & Fertigung",
      zones: "Versandzonen",
      asia: "Korea & Asien",
      americas: "Amerika",
      europe: "Europa & Rest",
    },
    footer: {
      shop: "Shop",
      help: "Hilfe",
      company: "Marke",
      contact: "Kontakt",
      privacy: "Datenschutz",
      terms: "AGB",
      address: "Seongsu, Seoul — JIDOKAAN-Werkstatt",
    },
    login: {
      title: "Anmelden",
      body: "Bestellungen und Fertigung verfolgen.",
      continueWith: "Weiter mit",
      disabled: "Anmeldung ist deaktiviert.",
      back: "Startseite",
    },
    common: {
      currency: "Währung",
      language: "Sprache",
      close: "Schließen",
      loading: "Lädt…",
    },
  }),
  ar: overlay(EN, {
    tagline: "أول حذاء ملاكمة مخصص مصنوع يدوياً في كوريا",
    nav: {
      shop: "المتجر",
      about: "العلامة",
      shipping: "الشحن",
      cart: "السلة",
      account: "الحساب",
      signIn: "تسجيل الدخول",
      custom: "طلب مخصص",
    },
    hero: {
      title: "حذاء الملاكمة الخاص بك.\nإلى أي مكان في العالم.",
      body: "JIDOKAAN يصنع في سيول أول بوت ملاكمة كوري مخصص يدوياً. اختر الألوان، راحة احترافية، وشحن عالمي.",
      cta: "شاهد التخصيص",
      secondary: "الشحن",
      ships: "صناعة يدوية في سونغسو · نحو 10 أيام · شحن عالمي",
    },
    home: {
      originTitle: "الأول في كوريا\nصناعة يدوية مخصصة.",
      originBody:
        "كل زوج يُخاط يدوياً في سونغسو، سيول — بألوانك ومقاسك، لا إنتاجاً كمياً.",
      originItems: ["صناعة يدوية في سونغسو", "حسب الطلب", "100% Made in Korea"],
      craftTitle: "لا تنازل عن المقاس.",
      craftBody:
        "قالب عريض، ثبات محكم، قبضة الحلبة. الإحساس الاحترافي أولاً ثم تصميمك. نحو 10 أيام صناعة.",
      craftItems: ["قالب عريض", "نعل عالي القبضة", "نحو 10 أيام"],
      clickStudio: "انقر · استوديو التخصيص",
      buildTitle: "اصنع زوجك.",
      buildBody: "صمّم في الاستوديو، اختر الدولة، ثم اطلب.",
    },
    custom: {
      back: "رجوع",
      reset: "إعادة ضبط",
      resetToast: "الألوان الافتراضية",
      guide2d: "GUIDE ON/OFF لرؤية الأجزاء (ثنائي الأبعاد مطابق للمنتج)",
      guide3d: "الثلاثي الأبعاد معاينة. الألوان النهائية من الثنائي الأبعاد.",
      allParts: "كل الأجزاء",
      shipTo: "الشحن إلى",
      lockOrder: "تثبيت التصميم · اطلب",
      rotateHint: "اسحب للتدوير",
      added: "تم تثبيت التصميم وإضافته للسلة",
      colorNote: "قد تختلف ألوان المحاكي عن المنتج الفعلي",
      expandPreview: "اضغط على الصورة للتكبير",
      closePreview: "إغلاق",
      men: "رجال",
      women: "نساء",
      sizeGuideTitle: "دليل اختيار المقاس",
      sizeGuideBody:
        "مقاسات النساء قريبة من معظم الأحذية العادية، لذلك يطلب كثيرون مقاسهم المعتاد. مقاسات الرجال غالباً أكبر قليلاً من نايكي ومعظم الأحذية الشائعة، لذا ننصح بطلب مقاس أصغر بدرجة واحدة. أما إذا كان القدم عريضاً فقد يناسب المقاس المعتاد أكثر.",
    },
    shop: {
      title: "كل المنتجات",
      all: "الكل",
      filter: "الفئة",
      sort: "ترتيب",
      sortFeatured: "مميز",
      sortPriceAsc: "السعر: الأقل",
      sortPriceDesc: "السعر: الأعلى",
      sortRating: "الأعلى تقييماً",
      results: "منتجات",
      empty: "لا توجد منتجات لهذه التصفية.",
      inStock: "متوفر",
      outOfStock: "نفد",
    },
    product: {
      addToCart: "أضف إلى السلة",
      added: "تمت الإضافة",
      buyNow: "اطلب الآن",
      shipsWorldwide: "شحن عالمي",
      materials: "الخامات",
      weight: "الوزن",
      shipsFrom: "يشحن من",
      reviews: "تقييمات",
      description: "التفاصيل",
      qty: "الكمية",
      related: "قد يعجبك أيضاً",
      size: "المقاس (مم)",
      color: "اللون",
      leadTime: "مدة الصنع",
      leadDays: "أيام (يدوي)",
      upper: "الجزء العلوي",
      stripe: "الشريط",
      sole: "النعل",
    },
    cart: {
      title: "سلتك",
      empty: "السلة فارغة.",
      emptyCta: "تصفح المتجر",
      subtotal: "المجموع الفرعي",
      shipping: "الشحن",
      shippingCalc: "يُحسب عند الدفع",
      total: "الإجمالي",
      checkout: "إتمام الطلب",
      continue: "متابعة التسوق",
      remove: "إزالة",
      qty: "الكمية",
    },
    checkout: {
      title: "الدفع",
      contact: "التواصل",
      email: "البريد",
      phone: "الهاتف (اختياري)",
      shipping: "عنوان الشحن",
      firstName: "الاسم",
      lastName: "العائلة",
      address: "العنوان",
      city: "المدينة",
      region: "المنطقة / الولاية",
      postal: "الرمز البريدي",
      country: "الدولة",
      payment: "الدفع",
      card: "رقم البطاقة",
      nameOnCard: "الاسم على البطاقة",
      expiry: "الانتهاء",
      placeOrder: "تأكيد الطلب",
      placing: "جارٍ المعالجة…",
      note: "متجر تجريبي — بلا دفع حقيقي. الطلبات الحقيقية: jidokaan.com",
      summary: "ملخص الطلب",
      duty: "رسوم وضرائب تقديرية",
    },
    success: {
      title: "تم استلام الطلب",
      body: "سنرسل مواعيد التصنيع والتتبع بالبريد. الموقع: jidokaan.com",
      order: "رقم الطلب",
      continue: "العودة للمتجر",
    },
    about: {
      title: "JIDOKAAN — ملاكمة مخصصة يدوياً",
      mission: "وعدنا",
      studio: "الورشة",
    },
    shippingPage: {
      title: "الشحن والرسوم والتصنيع",
      zones: "مناطق الشحن",
      asia: "كوريا وآسيا",
      americas: "الأمريكتان",
      europe: "أوروبا وباقي العالم",
    },
    footer: {
      shop: "المتجر",
      help: "المساعدة",
      company: "العلامة",
      contact: "تواصل",
      privacy: "الخصوصية",
      terms: "الشروط",
      address: "سونغسو، سيول — استوديو JIDOKAAN",
    },
    login: {
      title: "تسجيل الدخول",
      body: "تتبع الطلبات والتصنيع.",
      continueWith: "المتابعة عبر",
      disabled: "تسجيل الدخول معطّل.",
      back: "الرئيسية",
    },
    common: {
      currency: "العملة",
      language: "اللغة",
      close: "إغلاق",
      loading: "جارٍ التحميل…",
    },
  }),
  ru: overlay(EN, {
    tagline: "Первые кастомные боксёрские кроссовки ручной работы из Кореи",
    nav: {
      shop: "Магазин",
      about: "Бренд",
      shipping: "Доставка",
      cart: "Корзина",
      account: "Аккаунт",
      signIn: "Войти",
      custom: "Кастом-заказ",
    },
    hero: {
      title: "Ваши боксёрские кроссовки.\nВ любую точку мира.",
      body: "JIDOKAAN шьёт в Сеуле первые корейские кастомные боксёрские ботинки. Выберите цвета, получите комфорт профи и доставку по миру.",
      cta: "Смотреть кастом",
      secondary: "Доставка",
      ships: "Ручная работа в Сонсу · ~10 дней · по миру",
    },
    home: {
      originTitle: "Первые в Корее\nкастомные, вручную.",
      originBody:
        "Каждую пару шьют вручную в Сонсу, Сеул — под ваш цвет и размер, не конвейер.",
      originItems: ["Ручная работа в Сонсу", "Под заказ", "100% Made in Korea"],
      craftTitle: "Без компромиссов по посадке.",
      craftBody:
        "Широкая колодка, жёсткая фиксация, грип ринга. Сначала ощущение профи, потом ваш дизайн. ~10 дней.",
      craftItems: ["Широкая колодка", "Подошва high-grip", "~10 дней"],
      clickStudio: "Нажмите · Кастом-студия",
      buildTitle: "Соберите свою пару.",
      buildBody: "Дизайн в студии, страна доставки, заказ.",
    },
    custom: {
      back: "Назад",
      reset: "Сброс",
      resetToast: "Цвета по умолчанию",
      guide2d: "GUIDE ON/OFF — детали (точный 2D)",
      guide3d: "3D — превью. Финальные цвета как в 2D.",
      allParts: "Все детали",
      shipTo: "Доставка в",
      lockOrder: "Зафиксировать дизайн · Заказать",
      rotateHint: "Тяните, чтобы вращать",
      added: "Дизайн сохранён в корзине",
      colorNote: "Цвета симулятора могут отличаться от реального изделия",
      expandPreview: "Нажмите фото, чтобы увеличить",
      closePreview: "Закрыть",
      men: "Мужские",
      women: "Женские",
      sizeGuideTitle: "Подбор размера",
      sizeGuideBody:
        "Женские размеры близки к обычной обуви, поэтому многие заказывают свой привычный размер. Мужские часто чуть больше, чем Nike и другие привычные кроссовки, поэтому рекомендуем брать на размер меньше. Если стопа широкая, лучше может сесть обычный размер.",
    },
    shop: {
      title: "Все товары",
      all: "Все",
      filter: "Категория",
      sort: "Сортировка",
      results: "товаров",
      empty: "Ничего не найдено.",
      inStock: "В наличии",
      outOfStock: "Нет в наличии",
    },
    product: {
      addToCart: "В корзину",
      added: "Добавлено",
      buyNow: "Заказать",
      shipsWorldwide: "Доставка по миру",
      materials: "Материалы",
      weight: "Вес",
      shipsFrom: "Отправка из",
      reviews: "отзывы",
      description: "Описание",
      qty: "Кол-во",
      related: "Вам также понравится",
      size: "Размер (мм)",
      color: "Цвет",
      leadTime: "Срок изготовления",
      leadDays: "дней (ручная работа)",
      upper: "Верх",
      stripe: "Полоса",
      sole: "Подошва",
    },
    cart: {
      title: "Корзина",
      empty: "Корзина пуста.",
      emptyCta: "В магазин",
      subtotal: "Подытог",
      shipping: "Доставка",
      shippingCalc: "Считается при оформлении",
      total: "Итого",
      checkout: "Оформить",
      continue: "Продолжить покупки",
      remove: "Удалить",
      qty: "Кол-во",
    },
    checkout: {
      title: "Оформление",
      contact: "Контакты",
      email: "Email",
      phone: "Телефон (необяз.)",
      shipping: "Адрес доставки",
      firstName: "Имя",
      lastName: "Фамилия",
      address: "Адрес",
      city: "Город",
      region: "Регион",
      postal: "Индекс",
      country: "Страна",
      payment: "Оплата",
      card: "Номер карты",
      nameOnCard: "Имя на карте",
      expiry: "Срок",
      placeOrder: "Подтвердить заказ",
      placing: "Обработка…",
      note: "Демо-магазин — без реального списания. Заказы: jidokaan.com",
      summary: "Итог заказа",
      duty: "Пошлины и налоги (оценка)",
    },
    success: {
      title: "Заказ получен",
      body: "Пришлём сроки производства и трек. Сайт: jidokaan.com",
      order: "Номер заказа",
      continue: "В магазин",
    },
    about: { title: "JIDOKAAN — кастомные боксёрские кроссовки", mission: "Наше обещание", studio: "Мастерская" },
    shippingPage: {
      title: "Доставка, пошлины и производство",
      zones: "Зоны доставки",
      asia: "Корея и Азия",
      americas: "Америка",
      europe: "Европа и остальной мир",
    },
    footer: {
      shop: "Магазин",
      help: "Помощь",
      company: "Бренд",
      contact: "Контакты",
      privacy: "Конфиденциальность",
      terms: "Условия",
      address: "Сонсу, Сеул — студия JIDOKAAN",
    },
    login: {
      title: "Войти",
      body: "Следите за заказом и производством.",
      continueWith: "Продолжить через",
      disabled: "Вход отключён.",
      back: "На главную",
    },
    common: { currency: "Валюта", language: "Язык", close: "Закрыть", loading: "Загрузка…" },
  }),
  it: overlay(EN, {
    tagline: "Le prime scarpe da boxe custom fatte a mano in Corea",
    nav: {
      shop: "Negozio",
      about: "Brand",
      shipping: "Spedizione",
      cart: "Carrello",
      account: "Account",
      signIn: "Accedi",
      custom: "Ordine custom",
    },
    hero: {
      title: "Le tue scarpe da boxe.\nOvunque nel mondo.",
      body: "JIDOKAAN confeziona a Seul i primi stivali da boxe custom coreani. Scegli i colori, comfort da pro, spedizione mondiale.",
      cta: "Vedi custom",
      secondary: "Spedizione",
      ships: "Fatto a mano a Seongsu · ~10 giorni · mondiale",
    },
    home: {
      originTitle: "I primi in Corea\ncustom fatti a mano.",
      originBody:
        "Ogni paio è cucito a mano a Seongsu, Seul — nei tuoi colori e nella tua misura, non in serie.",
      originItems: ["Fatto a mano a Seongsu", "Su ordinazione", "100% Made in Korea"],
      craftTitle: "Nessun compromesso sulla calzata.",
      craftBody:
        "Forma larga, tenuta ferma, grip da ring. Prima il feeling pro, poi il tuo design. ~10 giorni.",
      craftItems: ["Forma larga", "Suola high-grip", "~10 giorni"],
      clickStudio: "Clic · Studio custom",
      buildTitle: "Crea il tuo paio.",
      buildBody: "Disegna nello studio, scegli il Paese, ordina.",
    },
    custom: {
      back: "Indietro",
      reset: "Reset",
      resetToast: "Colori predefiniti",
      guide2d: "GUIDE ON/OFF per le parti (2D fedele)",
      guide3d: "Il 3D è un’anteprima. I colori finali sono quelli del 2D.",
      allParts: "Tutte le parti",
      shipTo: "Spedisci in",
      lockOrder: "Blocca design · Ordina",
      rotateHint: "Trascina per ruotare",
      added: "Design salvato nel carrello",
      colorNote: "I colori del simulatore possono differire dal prodotto reale",
      expandPreview: "Tocca la foto per ingrandire",
      closePreview: "Chiudi",
      men: "Uomo",
      women: "Donna",
      sizeGuideTitle: "Guida alle taglie",
      sizeGuideBody:
        "Le taglie donna sono simili alla maggior parte delle scarpe, quindi in tanti ordinano la propria misura abituale. Quelle uomo tendono a calzare un po’ più grandi di Nike e di altre sneaker comuni: consigliamo di prendere una taglia in meno. Se però hai il piede largo, la misura abituale può calzare meglio.",
    },
    shop: {
      title: "Tutti i prodotti",
      all: "Tutto",
      filter: "Categoria",
      sort: "Ordina",
      results: "prodotti",
      empty: "Nessun prodotto per questi filtri.",
      inStock: "Disponibile",
      outOfStock: "Esaurito",
    },
    product: {
      addToCart: "Aggiungi al carrello",
      added: "Aggiunto",
      buyNow: "Ordina ora",
      shipsWorldwide: "Spedizione mondiale",
      materials: "Materiali",
      weight: "Peso",
      shipsFrom: "Spedito da",
      reviews: "recensioni",
      description: "Dettagli",
      qty: "Qtà",
      related: "Potrebbe piacerti",
      size: "Taglia (mm)",
      color: "Colore",
      leadTime: "Tempi",
      leadDays: "giorni (a mano)",
      upper: "Tomaia",
      stripe: "Banda",
      sole: "Suola",
    },
    cart: {
      title: "Carrello",
      empty: "Il carrello è vuoto.",
      emptyCta: "Vai al negozio",
      subtotal: "Subtotale",
      shipping: "Spedizione",
      shippingCalc: "Calcolato al checkout",
      total: "Totale",
      checkout: "Cassa",
      continue: "Continua lo shopping",
      remove: "Rimuovi",
      qty: "Qtà",
    },
    checkout: {
      title: "Cassa",
      contact: "Contatti",
      email: "Email",
      phone: "Telefono (opz.)",
      shipping: "Indirizzo di spedizione",
      firstName: "Nome",
      lastName: "Cognome",
      address: "Indirizzo",
      city: "Città",
      region: "Regione",
      postal: "CAP",
      country: "Paese",
      payment: "Pagamento",
      card: "Numero carta",
      nameOnCard: "Nome sulla carta",
      expiry: "Scadenza",
      placeOrder: "Conferma ordine",
      placing: "Elaborazione…",
      note: "Negozio demo — nessun addebito reale. Ordini: jidokaan.com",
      summary: "Riepilogo",
      duty: "Dazi e tasse st.",
    },
    success: {
      title: "Ordine ricevuto",
      body: "Invieremo tempi di produzione e tracking. Sito: jidokaan.com",
      order: "Numero ordine",
      continue: "Torna al negozio",
    },
    about: { title: "JIDOKAAN — boxe custom fatta a mano", mission: "La nostra promessa", studio: "Laboratorio" },
    shippingPage: {
      title: "Spedizione, dazi e produzione",
      zones: "Zone di spedizione",
      asia: "Corea e Asia",
      americas: "Americhe",
      europe: "Europa e resto",
    },
    footer: {
      shop: "Negozio",
      help: "Aiuto",
      company: "Brand",
      contact: "Contatti",
      privacy: "Privacy",
      terms: "Termini",
      address: "Seongsu, Seul — studio JIDOKAAN",
    },
    login: {
      title: "Accedi",
      body: "Segui ordini e produzione.",
      continueWith: "Continua con",
      disabled: "Accesso disattivato.",
      back: "Home",
    },
    common: { currency: "Valuta", language: "Lingua", close: "Chiudi", loading: "Caricamento…" },
  }),
  pt: overlay(EN, {
    tagline: "Os primeiros tênis de boxe custom feitos à mão da Coreia",
    nav: {
      shop: "Loja",
      about: "Marca",
      shipping: "Envio",
      cart: "Carrinho",
      account: "Conta",
      signIn: "Entrar",
      custom: "Pedido custom",
    },
    hero: {
      title: "Seus tênis de boxe.\nPara qualquer lugar do mundo.",
      body: "A JIDOKAAN produz em Seul as primeiras botas de boxe custom da Coreia. Escolha as cores, conforto de pro e envio mundial.",
      cta: "Ver custom",
      secondary: "Envio",
      ships: "Feito à mão em Seongsu · ~10 dias · mundial",
    },
    home: {
      originTitle: "Os primeiros da Coreia\ncustom à mão.",
      originBody:
        "Cada par é costurado à mão em Seongsu, Seul — na sua cor e tamanho, sem linha de fábrica.",
      originItems: ["Feito à mão em Seongsu", "Sob encomenda", "100% Made in Korea"],
      craftTitle: "Sem abrir mão do caimento.",
      craftBody:
        "Forma larga, travamento firme, grip de ringue. Primeiro o feeling pro, depois o seu design. ~10 dias.",
      craftItems: ["Forma larga", "Sola high-grip", "~10 dias"],
      clickStudio: "Clique · Estúdio custom",
      buildTitle: "Monte o seu par.",
      buildBody: "Desenhe no estúdio, escolha o país e peça.",
    },
    custom: {
      back: "Voltar",
      reset: "Redefinir",
      resetToast: "Cores padrão",
      guide2d: "GUIDE ON/OFF para ver as peças (2D fiel)",
      guide3d: "O 3D é prévia. As cores finais são as do 2D.",
      allParts: "Todas as peças",
      shipTo: "Enviar para",
      lockOrder: "Travar design · Pedir",
      rotateHint: "Arraste para girar",
      added: "Design salvo no carrinho",
      colorNote: "As cores do simulador podem diferir do produto real",
      expandPreview: "Toque na foto para ampliar",
      closePreview: "Fechar",
      men: "Masculino",
      women: "Feminino",
      sizeGuideTitle: "Guia de tamanhos",
      sizeGuideBody:
        "Os tamanhos femininos são parecidos com os da maioria dos sapatos, então muita gente pede o tamanho de sempre. Os masculinos costumam ficar um pouco maiores que Nike e outros tênis comuns, por isso recomendamos pedir um número a menos. Se o pé for largo, o tamanho habitual pode assentar melhor.",
    },
    shop: {
      title: "Todos os produtos",
      all: "Tudo",
      filter: "Categoria",
      sort: "Ordenar",
      results: "produtos",
      empty: "Nada combina com esses filtros.",
      inStock: "Disponível",
      outOfStock: "Esgotado",
    },
    product: {
      addToCart: "Adicionar ao carrinho",
      added: "Adicionado",
      buyNow: "Pedir agora",
      shipsWorldwide: "Envio mundial",
      materials: "Materiais",
      weight: "Peso",
      shipsFrom: "Enviado de",
      reviews: "avaliações",
      description: "Detalhes",
      qty: "Qtd",
      related: "Você também pode gostar",
      size: "Tamanho (mm)",
      color: "Cor",
      leadTime: "Prazo",
      leadDays: "dias (à mão)",
      upper: "Cabedal",
      stripe: "Faixa",
      sole: "Sola",
    },
    cart: {
      title: "Seu carrinho",
      empty: "O carrinho está vazio.",
      emptyCta: "Ver loja",
      subtotal: "Subtotal",
      shipping: "Envio",
      shippingCalc: "Calculado no checkout",
      total: "Total",
      checkout: "Finalizar",
      continue: "Continuar comprando",
      remove: "Remover",
      qty: "Qtd",
    },
    checkout: {
      title: "Pagamento",
      contact: "Contato",
      email: "E-mail",
      phone: "Telefone (opcional)",
      shipping: "Endereço de envio",
      firstName: "Nome",
      lastName: "Sobrenome",
      address: "Endereço",
      city: "Cidade",
      region: "Estado / região",
      postal: "CEP",
      country: "País",
      payment: "Pagamento",
      card: "Número do cartão",
      nameOnCard: "Nome no cartão",
      expiry: "Validade",
      placeOrder: "Confirmar pedido",
      placing: "Processando…",
      note: "Loja demo — sem cobrança real. Pedidos: jidokaan.com",
      summary: "Resumo",
      duty: "Taxas e impostos est.",
    },
    success: {
      title: "Pedido recebido",
      body: "Enviaremos prazos de produção e rastreio. Site: jidokaan.com",
      order: "Número do pedido",
      continue: "Voltar à loja",
    },
    about: { title: "JIDOKAAN — boxe custom feito à mão", mission: "Nossa promessa", studio: "Oficina" },
    shippingPage: {
      title: "Envio, taxas e produção",
      zones: "Zonas de envio",
      asia: "Coreia e Ásia",
      americas: "Américas",
      europe: "Europa e resto",
    },
    footer: {
      shop: "Loja",
      help: "Ajuda",
      company: "Marca",
      contact: "Contato",
      privacy: "Privacidade",
      terms: "Termos",
      address: "Seongsu, Seul — estúdio JIDOKAAN",
    },
    login: {
      title: "Entrar",
      body: "Acompanhe pedidos e produção.",
      continueWith: "Continuar com",
      disabled: "Login desativado.",
      back: "Início",
    },
    common: { currency: "Moeda", language: "Idioma", close: "Fechar", loading: "Carregando…" },
  }),
  tr: overlay(EN, {
    tagline: "Kore’nin ilk elde üretilen özel boks ayakkabıları",
    nav: {
      shop: "Mağaza",
      about: "Marka",
      shipping: "Kargo",
      cart: "Sepet",
      account: "Hesap",
      signIn: "Giriş",
      custom: "Özel sipariş",
    },
    hero: {
      title: "Boks ayakkabınız.\nDünyanın her yerine.",
      body: "JIDOKAAN, Seul’de Kore’nin ilk özel boks botlarını elde üretir. Renginizi seçin, pro konfor, dünya çapında kargo.",
      cta: "Özeli gör",
      secondary: "Kargo",
      ships: "Seongsu’da el yapımı · ~10 gün · dünya",
    },
    home: {
      originTitle: "Kore’nin ilk\nel yapımı özeli.",
      originBody:
        "Her çift Seongsu, Seul’de elde dikilir — renginize ve numaranıza, seri üretim değil.",
      originItems: ["Seongsu’da el yapımı", "Siparişe özel", "100% Made in Korea"],
      craftTitle: "Kalıpta taviz yok.",
      craftBody:
        "Geniş kalıp, sıkı tutuş, ring grip’i. Önce pro his, sonra sizin tasarım. ~10 gün.",
      craftItems: ["Geniş kalıp", "Yüksek tutuşlu taban", "~10 gün"],
      clickStudio: "Tıkla · Özel stüdyo",
      buildTitle: "Çiftinizi oluşturun.",
      buildBody: "Stüdyoda tasarlayın, ülkeyi seçin, sipariş verin.",
    },
    custom: {
      back: "Geri",
      reset: "Sıfırla",
      resetToast: "Varsayılan renkler",
      guide2d: "Parçalar için GUIDE ON/OFF (ürün 2D)",
      guide3d: "3D önizlemedir. Nihai renkler 2D ile aynı.",
      allParts: "Tüm parçalar",
      shipTo: "Gönderim",
      lockOrder: "Tasarımı kilitle · Sipariş",
      rotateHint: "Döndürmek için sürükleyin",
      added: "Tasarım sepete eklendi",
      colorNote: "Simülatör renkleri gerçek üründen farklı olabilir",
      expandPreview: "Büyütmek için fotoğrafa dokunun",
      closePreview: "Kapat",
      men: "Erkek",
      women: "Kadın",
      sizeGuideTitle: "Beden rehberi",
      sizeGuideBody:
        "Kadın bedenleri çoğu günlük ayakkabıya yakındır; birçok kişi alıştığı bedeni sipariş eder. Erkek bedenleri Nike ve benzeri spor ayakkabılara göre biraz büyük gelebilir, bu yüzden bir beden küçük almanızı öneririz. Ayak bileği veya tabanı geniş olanlarda ise normal beden daha iyi oturabilir.",
    },
    shop: {
      title: "Tüm ürünler",
      all: "Tümü",
      filter: "Kategori",
      sort: "Sırala",
      results: "ürün",
      empty: "Bu filtrelere uygun ürün yok.",
      inStock: "Stokta",
      outOfStock: "Tükendi",
    },
    product: {
      addToCart: "Sepete ekle",
      added: "Eklendi",
      buyNow: "Şimdi sipariş",
      shipsWorldwide: "Dünya çapında kargo",
      materials: "Malzeme",
      weight: "Ağırlık",
      shipsFrom: "Çıkış",
      reviews: "yorum",
      description: "Detay",
      qty: "Adet",
      related: "Beğenebilirsiniz",
      size: "Numara (mm)",
      color: "Renk",
      leadTime: "Üretim süresi",
      leadDays: "gün (el yapımı)",
      upper: "Saya",
      stripe: "Şerit",
      sole: "Taban",
    },
    cart: {
      title: "Sepetiniz",
      empty: "Sepet boş.",
      emptyCta: "Mağazaya git",
      subtotal: "Ara toplam",
      shipping: "Kargo",
      shippingCalc: "Ödemede hesaplanır",
      total: "Toplam",
      checkout: "Ödeme",
      continue: "Alışverişe devam",
      remove: "Kaldır",
      qty: "Adet",
    },
    checkout: {
      title: "Ödeme",
      contact: "İletişim",
      email: "E-posta",
      phone: "Telefon (isteğe bağlı)",
      shipping: "Teslimat adresi",
      firstName: "Ad",
      lastName: "Soyad",
      address: "Adres",
      city: "Şehir",
      region: "Bölge",
      postal: "Posta kodu",
      country: "Ülke",
      payment: "Ödeme",
      card: "Kart numarası",
      nameOnCard: "Karttaki isim",
      expiry: "Son kullanma",
      placeOrder: "Siparişi onayla",
      placing: "İşleniyor…",
      note: "Demo mağaza — gerçek çekim yok. Sipariş: jidokaan.com",
      summary: "Özet",
      duty: "Tahmini gümrük ve vergi",
    },
    success: {
      title: "Sipariş alındı",
      body: "Üretim süresi ve takibi e-postalarız. Site: jidokaan.com",
      order: "Sipariş no",
      continue: "Mağazaya dön",
    },
    about: { title: "JIDOKAAN — el yapımı özel boks", mission: "Sözümüz", studio: "Atölye" },
    shippingPage: {
      title: "Kargo, gümrük ve üretim",
      zones: "Kargo bölgeleri",
      asia: "Kore ve Asya",
      americas: "Amerika",
      europe: "Avrupa ve diğer",
    },
    footer: {
      shop: "Mağaza",
      help: "Yardım",
      company: "Marka",
      contact: "İletişim",
      privacy: "Gizlilik",
      terms: "Şartlar",
      address: "Seongsu, Seul — JIDOKAAN stüdyosu",
    },
    login: {
      title: "Giriş",
      body: "Sipariş ve üretimi takip edin.",
      continueWith: "Şununla devam",
      disabled: "Giriş kapalı.",
      back: "Ana sayfa",
    },
    common: { currency: "Para birimi", language: "Dil", close: "Kapat", loading: "Yükleniyor…" },
  }),
  uz: overlay(EN, {
    tagline: "Koreyaning birinchi qo‘lda tikilgan maxsus boks poyabzali",
    nav: {
      shop: "Do‘kon",
      about: "Brend",
      shipping: "Yetkazib berish",
      cart: "Savat",
      account: "Hisob",
      signIn: "Kirish",
      custom: "Maxsus buyurtma",
    },
    hero: {
      title: "Boks poyabzalingiz.\nDunyo bo‘ylab.",
      body: "JIDOKAAN Seulda Koreyaning birinchi maxsus boks botinkalarini qo‘lda tikadi. Rangni tanlang, pro qulaylik, dunyo bo‘ylab yetkazish.",
      cta: "Maxsusni ko‘rish",
      secondary: "Yetkazib berish",
      ships: "Seongsu’da qo‘lda · ~10 kun · dunyo",
    },
    home: {
      originTitle: "Koreyada birinchi\nqo‘lda maxsus.",
      originBody:
        "Har bir juft Seongsu, Seulda qo‘lda tikiladi — rangi va o‘lchamingizga, ommaviy emas.",
      originItems: ["Seongsu’da qo‘lda", "Buyurtmaga", "100% Made in Korea"],
      craftTitle: "O‘tirishida kelishmovchilik yo‘q.",
      craftBody:
        "Keng qolip, mahkam ushlash, ring gripi. Avval pro his, keyin dizayningiz. ~10 kun.",
      craftItems: ["Keng qolip", "Yuqori grip taglik", "~10 kun"],
      clickStudio: "Bosing · Maxsus studiya",
      buildTitle: "Juftingizni yarating.",
      buildBody: "Studiyada dizayn, mamlakatni tanlang, buyurtma bering.",
    },
    custom: {
      back: "Orqaga",
      reset: "Tiklash",
      resetToast: "Standart ranglar",
      guide2d: "Qismlar uchun GUIDE ON/OFF (aniq 2D)",
      guide3d: "3D — oldindan ko‘rish. Yakuniy ranglar 2D bilan bir xil.",
      allParts: "Barcha qismlar",
      shipTo: "Yetkazish",
      lockOrder: "Dizaynni belgilash · Buyurtma",
      rotateHint: "Aylantirish uchun torting",
      added: "Dizayn savatga qo‘shildi",
      colorNote: "Simulyator ranglari haqiqiy mahsulotdan farq qilishi mumkin",
      expandPreview: "Kattalashtirish uchun rasmni bosing",
      closePreview: "Yopish",
      men: "Erkak",
      women: "Ayol",
      sizeGuideTitle: "O‘lcham tanlash qo‘llanmasi",
      sizeGuideBody:
        "Ayollar o‘lchami odatdagi poyabzallarga yaqin, shuning uchun ko‘pchilik odatdagi o‘lchamini buyurtma qiladi. Erkaklar o‘lchami Nike va boshqa odatiy krossovkalardan biroz katta chiqishi mumkin — bir o‘lcham kichikroq olishni tavsiya qilamiz. Oyoq keng bo‘lsa, odatdagi o‘lcham yaxshiroq o‘tirishi mumkin.",
    },
    shop: {
      title: "Barcha mahsulotlar",
      all: "Hammasi",
      filter: "Turkum",
      sort: "Saralash",
      results: "mahsulot",
      empty: "Mos mahsulot yo‘q.",
      inStock: "Mavjud",
      outOfStock: "Tugagan",
    },
    product: {
      addToCart: "Savatga",
      added: "Qo‘shildi",
      buyNow: "Hozir buyurtma",
      shipsWorldwide: "Dunyo bo‘ylab yetkazish",
      materials: "Material",
      weight: "Og‘irlik",
      shipsFrom: "Jo‘natish",
      reviews: "sharh",
      description: "Tafsilot",
      qty: "Soni",
      related: "Sizga yoqishi mumkin",
      size: "O‘lcham (mm)",
      color: "Rang",
      leadTime: "Ishlab chiqarish",
      leadDays: "kun (qo‘lda)",
      upper: "Ustki",
      stripe: "Yo‘l",
      sole: "Taglik",
    },
    cart: {
      title: "Savatingiz",
      empty: "Savat bo‘sh.",
      emptyCta: "Do‘konga",
      subtotal: "Oraliq",
      shipping: "Yetkazib berish",
      shippingCalc: "To‘lovda hisoblanadi",
      total: "Jami",
      checkout: "Rasmiylashtirish",
      continue: "Xaridni davom ettirish",
      remove: "O‘chirish",
      qty: "Soni",
    },
    checkout: {
      title: "To‘lov",
      contact: "Aloqa",
      email: "Email",
      phone: "Telefon (ixtiyoriy)",
      shipping: "Yetkazish manzili",
      firstName: "Ism",
      lastName: "Familiya",
      address: "Manzil",
      city: "Shahar",
      region: "Viloyat",
      postal: "Pochta indeksi",
      country: "Mamlakat",
      payment: "To‘lov",
      card: "Karta raqami",
      nameOnCard: "Kartadagi ism",
      expiry: "Amal qilish",
      placeOrder: "Buyurtmani tasdiqlash",
      placing: "Qayta ishlanmoqda…",
      note: "Demo do‘kon — haqiqiy to‘lov yo‘q. Buyurtma: jidokaan.com",
      summary: "Xulosa",
      duty: "Taxminiy boj va soliq",
    },
    success: {
      title: "Buyurtma qabul qilindi",
      body: "Ishlab chiqarish muddati va kuzatuvni yuboramiz. Sayt: jidokaan.com",
      order: "Buyurtma raqami",
      continue: "Do‘konga qaytish",
    },
    about: { title: "JIDOKAAN — qo‘lda maxsus boks", mission: "Va’damiz", studio: "Ustaxona" },
    shippingPage: {
      title: "Yetkazish, boj va ishlab chiqarish",
      zones: "Yetkazish zonalari",
      asia: "Koreya va Osiyo",
      americas: "Amerika",
      europe: "Yevropa va boshqalar",
    },
    footer: {
      shop: "Do‘kon",
      help: "Yordam",
      company: "Brend",
      contact: "Aloqa",
      privacy: "Maxfiylik",
      terms: "Shartlar",
      address: "Seongsu, Seul — JIDOKAAN studiyasi",
    },
    login: {
      title: "Kirish",
      body: "Buyurtma va ishlab chiqarishni kuzating.",
      continueWith: "Davom etish",
      disabled: "Kirish o‘chirilgan.",
      back: "Bosh sahifa",
    },
    common: { currency: "Valyuta", language: "Til", close: "Yopish", loading: "Yuklanmoqda…" },
  }),
  zh: overlay(EN, {
    tagline: "韩国首个手工定制拳击鞋",
    nav: {
      shop: "商店",
      about: "品牌",
      shipping: "配送",
      cart: "购物车",
      account: "账户",
      signIn: "登录",
      custom: "定制下单",
    },
    hero: {
      title: "你的拳击鞋。\n送往世界各地。",
      body: "JIDOKAAN 在首尔手工打造韩国首款定制拳击靴。自选配色，职业级脚感，全球配送。",
      cta: "查看定制",
      secondary: "配送",
      ships: "圣水手工 · 约10天 · 全球配送",
    },
    home: {
      originTitle: "韩国首创\n手工定制。",
      originBody: "每一双都在首尔圣水手缝——按你的颜色和尺码，不是流水线。",
      originItems: ["圣水手作", "按单制作", "100% Made in Korea"],
      craftTitle: "合脚绝不妥协。",
      craftBody: "宽楦、稳固包裹、擂台抓地。先保证职业脚感，再上你的设计。约10天。",
      craftItems: ["宽楦", "高抓地大底", "约10天"],
      clickStudio: "点击 · 定制工作室",
      buildTitle: "打造你的那一双。",
      buildBody: "在工作室设计，选择国家，下单即可。",
    },
    custom: {
      back: "返回",
      reset: "重置",
      resetToast: "已恢复默认配色",
      guide2d: "GUIDE ON/OFF 查看部位（精确 2D）",
      guide3d: "3D 为预览。最终颜色以 2D 为准。",
      allParts: "全部部位",
      shipTo: "配送至",
      lockOrder: "锁定设计 · 下单",
      rotateHint: "拖动旋转",
      added: "设计已加入购物车",
      colorNote: "模拟器颜色可能与实物存在差异",
      expandPreview: "点击照片放大",
      closePreview: "关闭",
      men: "男款",
      women: "女款",
      sizeGuideTitle: "尺码选择指南",
      sizeGuideBody:
        "女款尺码与多数日常鞋接近，很多人会按平时的尺码下单。男款普遍比耐克等常见运动鞋略大，建议小一码。但如果脚偏宽，平时的尺码可能会更合适。",
    },
    shop: {
      title: "全部商品",
      all: "全部",
      filter: "分类",
      sort: "排序",
      results: "件商品",
      empty: "没有符合条件的商品。",
      inStock: "可订",
      outOfStock: "售罄",
    },
    product: {
      addToCart: "加入购物车",
      added: "已加入",
      buyNow: "立即下单",
      shipsWorldwide: "全球配送",
      materials: "材质",
      weight: "重量",
      shipsFrom: "发货地",
      reviews: "评价",
      description: "详情",
      qty: "数量",
      related: "你可能还喜欢",
      size: "尺码 (mm)",
      color: "颜色",
      leadTime: "制作周期",
      leadDays: "天（手工）",
      upper: "鞋面",
      stripe: "条纹",
      sole: "大底",
    },
    cart: {
      title: "购物车",
      empty: "购物车是空的。",
      emptyCta: "去商店",
      subtotal: "小计",
      shipping: "运费",
      shippingCalc: "结算时计算",
      total: "合计",
      checkout: "去结算",
      continue: "继续购物",
      remove: "删除",
      qty: "数量",
    },
    checkout: {
      title: "结算",
      contact: "联系方式",
      email: "邮箱",
      phone: "电话（选填）",
      shipping: "收货地址",
      firstName: "名",
      lastName: "姓",
      address: "地址",
      city: "城市",
      region: "省 / 州",
      postal: "邮编",
      country: "国家",
      payment: "支付",
      card: "卡号",
      nameOnCard: "持卡人",
      expiry: "有效期",
      placeOrder: "确认订单",
      placing: "处理中…",
      note: "演示商店 — 不会真实扣款。正式下单：jidokaan.com",
      summary: "订单摘要",
      duty: "预估关税与税费",
    },
    success: {
      title: "已收到订单",
      body: "我们会邮件告知制作周期与物流。网站：jidokaan.com",
      order: "订单号",
      continue: "返回商店",
    },
    about: { title: "JIDOKAAN — 手工定制拳击鞋", mission: "我们的承诺", studio: "工坊" },
    shippingPage: {
      title: "配送、关税与制作",
      zones: "配送区域",
      asia: "韩国与亚洲",
      americas: "美洲",
      europe: "欧洲及其他",
    },
    footer: {
      shop: "商店",
      help: "帮助",
      company: "品牌",
      contact: "联系",
      privacy: "隐私",
      terms: "条款",
      address: "首尔圣水 — JIDOKAAN 工坊",
    },
    login: {
      title: "登录",
      body: "跟踪订单与制作进度。",
      continueWith: "继续使用",
      disabled: "登录已关闭。",
      back: "首页",
    },
    common: { currency: "货币", language: "语言", close: "关闭", loading: "加载中…" },
  }),
  hi: overlay(EN, {
    tagline: "कोरिया की पहली कस्टम हस्तनिर्मित बॉक्सिंग शूज़",
    nav: {
      shop: "दुकान",
      about: "ब्रांड",
      shipping: "शिपिंग",
      cart: "कार्ट",
      account: "खाता",
      signIn: "साइन इन",
      custom: "कस्टम ऑर्डर",
    },
    hero: {
      title: "आपके बॉक्सिंग शूज़।\nदुनिया कहीं भी।",
      body: "JIDOKAAN सियोल में कोरिया के पहले कस्टम बॉक्सिंग बूट हाथ से बनाता है। रंग चुनें, प्रो आराम, दुनिया भर शिपिंग।",
      cta: "कस्टम देखें",
      secondary: "शिपिंग",
      ships: "सोंग्सू में हाथ से · ~10 दिन · वैश्विक",
    },
    home: {
      originTitle: "कोरिया के पहले\nकस्टम हाथ से बने।",
      originBody:
        "हर जोड़ी सोंग्सू, सियोल में हाथ से सिली जाती है — आपके रंग और साइज़ पर, फ़ैक्टरी रन नहीं।",
      originItems: ["सोंग्सू में हस्तनिर्मित", "ऑर्डर पर", "100% Made in Korea"],
      craftTitle: "फ़िट पर कोई समझौता नहीं।",
      craftBody:
        "चौड़ा लास्ट, मज़बूत पकड़, रिंग ग्रिप। पहले प्रो फील, फिर आपका डिज़ाइन। ~10 दिन।",
      craftItems: ["चौड़ा लास्ट", "हाई-ग्रिप सोल", "~10 दिन"],
      clickStudio: "क्लिक · कस्टम स्टूडियो",
      buildTitle: "अपनी जोड़ी बनाएँ।",
      buildBody: "स्टूडियो में डिज़ाइन करें, देश चुनें, ऑर्डर करें।",
    },
    custom: {
      back: "वापस",
      reset: "रीसेट",
      resetToast: "डिफ़ॉल्ट रंग",
      guide2d: "पार्ट्स के लिए GUIDE ON/OFF (सटीक 2D)",
      guide3d: "3D पूर्वावलोकन है। अंतिम रंग 2D जैसे।",
      allParts: "सभी पार्ट्स",
      shipTo: "भेजें",
      lockOrder: "डिज़ाइन लॉक · ऑर्डर",
      rotateHint: "घुमाने के लिए खींचें",
      added: "डिज़ाइन कार्ट में जोड़ दिया",
      colorNote: "सिम्युलेटर के रंग वास्तविक उत्पाद से भिन्न हो सकते हैं",
      expandPreview: "बड़ा देखने के लिए फ़ोटो टैप करें",
      closePreview: "बंद करें",
      men: "पुरुष",
      women: "महिला",
      sizeGuideTitle: "साइज़ गाइड",
      sizeGuideBody:
        "महिलाओं के साइज़ ज़्यादातर आम जूतों जैसे होते हैं, इसलिए कई लोग अपना सामान्य साइज़ ऑर्डर करते हैं। पुरुषों के साइज़ नाइकी और अन्य आम स्नीकर्स से थोड़े बड़े लग सकते हैं, इसलिए एक साइज़ छोटा लेने की सलाह है। अगर पैर चौड़ा है, तो सामान्य साइज़ बेहतर फिट हो सकता है।",
    },
    shop: {
      title: "सभी उत्पाद",
      all: "सभी",
      filter: "श्रेणी",
      sort: "क्रम",
      results: "उत्पाद",
      empty: "कोई मेल नहीं।",
      inStock: "उपलब्ध",
      outOfStock: "समाप्त",
    },
    product: {
      addToCart: "कार्ट में डालें",
      added: "जोड़ दिया",
      buyNow: "अभी ऑर्डर",
      shipsWorldwide: "विश्वव्यापी शिपिंग",
      materials: "सामग्री",
      weight: "वज़न",
      shipsFrom: "यहाँ से",
      reviews: "समीक्षाएँ",
      description: "विवरण",
      qty: "मात्रा",
      related: "यह भी पसंद आ सकता है",
      size: "साइज़ (मिमी)",
      color: "रंग",
      leadTime: "बनाने का समय",
      leadDays: "दिन (हाथ से)",
      upper: "अपर",
      stripe: "स्ट्राइप",
      sole: "सोल",
    },
    cart: {
      title: "आपका कार्ट",
      empty: "कार्ट खाली है।",
      emptyCta: "दुकान देखें",
      subtotal: "उप-योग",
      shipping: "शिपिंग",
      shippingCalc: "चेकआउट पर गणना",
      total: "कुल",
      checkout: "चेकआउट",
      continue: "खरीदारी जारी",
      remove: "हटाएँ",
      qty: "मात्रा",
    },
    checkout: {
      title: "चेकआउट",
      contact: "संपर्क",
      email: "ईमेल",
      phone: "फ़ोन (वैकल्पिक)",
      shipping: "शिपिंग पता",
      firstName: "नाम",
      lastName: "उपनाम",
      address: "पता",
      city: "शहर",
      region: "राज्य / क्षेत्र",
      postal: "पिन कोड",
      country: "देश",
      payment: "भुगतान",
      card: "कार्ड नंबर",
      nameOnCard: "कार्ड पर नाम",
      expiry: "समाप्ति",
      placeOrder: "ऑर्डर पक्का करें",
      placing: "प्रोसेस हो रहा है…",
      note: "डेमो स्टोर — असली शुल्क नहीं। ऑर्डर: jidokaan.com",
      summary: "सारांश",
      duty: "अनुमानित शुल्क व कर",
    },
    success: {
      title: "ऑर्डर मिल गया",
      body: "उत्पादन समय और ट्रैकिंग ईमेल करेंगे। साइट: jidokaan.com",
      order: "ऑर्डर नंबर",
      continue: "दुकान पर वापस",
    },
    about: { title: "JIDOKAAN — कस्टम हस्तनिर्मित बॉक्सिंग", mission: "हमारा वादा", studio: "वर्कशॉप" },
    shippingPage: {
      title: "शिपिंग, शुल्क और उत्पादन",
      zones: "शिपिंग ज़ोन",
      asia: "कोरिया और एशिया",
      americas: "अमेरिका",
      europe: "यूरोप और अन्य",
    },
    footer: {
      shop: "दुकान",
      help: "मदद",
      company: "ब्रांड",
      contact: "संपर्क",
      privacy: "गोपनीयता",
      terms: "नियम",
      address: "सोंग्सू, सियोल — JIDOKAAN स्टूडियो",
    },
    login: {
      title: "साइन इन",
      body: "ऑर्डर और उत्पादन ट्रैक करें।",
      continueWith: "जारी रखें",
      disabled: "साइन-इन बंद है।",
      back: "होम",
    },
    common: { currency: "मुद्रा", language: "भाषा", close: "बंद", loading: "लोड हो रहा है…" },
  }),
  tl: overlay(EN, {
    tagline: "Unang custom handmade na boxing shoes ng Korea",
    nav: {
      shop: "Tindahan",
      about: "Brand",
      shipping: "Padala",
      cart: "Cart",
      account: "Account",
      signIn: "Mag-sign in",
      custom: "Custom order",
    },
    hero: {
      title: "Boxing shoes mo.\nKahit saan sa mundo.",
      body: "Gumagawa ang JIDOKAAN sa Seoul ng unang custom boxing boot ng Korea. Pumili ng kulay, pro-level na suot, padala sa buong mundo.",
      cta: "Tingnan ang custom",
      secondary: "Padala",
      ships: "Handmade sa Seongsu · ~10 araw · pandaigdig",
    },
    home: {
      originTitle: "Una sa Korea\ncustom na handmade.",
      originBody:
        "Bawat pares ay tahi sa kamay sa Seongsu, Seoul — sa kulay at sukat mo, hindi mass production.",
      originItems: ["Handmade sa Seongsu", "Made to order", "100% Made in Korea"],
      craftTitle: "Walang kompromiso sa fit.",
      craftBody:
        "Malapad na last, mahigpit na hawakan, grip sa ring. Pro feel muna, tapos design mo. ~10 araw.",
      craftItems: ["Malapad na last", "High-grip na sol", "~10 araw"],
      clickStudio: "I-click · Custom studio",
      buildTitle: "Gawin ang pares mo.",
      buildBody: "Mag-design sa studio, piliin ang bansa, umorder.",
    },
    custom: {
      back: "Bumalik",
      reset: "I-reset",
      resetToast: "Default na kulay",
      guide2d: "GUIDE ON/OFF para sa parts (tumpak na 2D)",
      guide3d: "Preview lang ang 3D. Final na kulay ay 2D.",
      allParts: "Lahat ng parts",
      shipTo: "Ipadala sa",
      lockOrder: "I-lock ang design · Order",
      rotateHint: "I-drag para i-rotate",
      added: "Nasa cart na ang design",
      colorNote: "Maaaring magkaiba ang kulay ng simulator sa aktwal na produkto",
      expandPreview: "I-tap ang larawan para palakihin",
      closePreview: "Isara",
      men: "Lalaki",
      women: "Babae",
      sizeGuideTitle: "Gabay sa sukat",
      sizeGuideBody:
        "Ang sukat para sa babae ay malapit sa karaniwang sapatos, kaya marami ang nag-oorder ng regular nilang size. Ang sa lalaki ay madalas na medyo mas malaki kaysa Nike at ibang ordinaryong sneakers, kaya inirerekomenda naming bumaba ng isang size. Pero kung malapad ang paa, mas babagay ang regular size.",
    },
    shop: {
      title: "Lahat ng produkto",
      all: "Lahat",
      filter: "Kategorya",
      sort: "Ayusin",
      results: "produkto",
      empty: "Walang tumugma.",
      inStock: "Available",
      outOfStock: "Sold out",
    },
    product: {
      addToCart: "Idagdag sa cart",
      added: "Naidagdag",
      buyNow: "Umorder ngayon",
      shipsWorldwide: "Pandaigdigang padala",
      materials: "Materyales",
      weight: "Timbang",
      shipsFrom: "Galing sa",
      reviews: "review",
      description: "Detalye",
      qty: "Dami",
      related: "Maaari mo ring magustuhan",
      size: "Sukat (mm)",
      color: "Kulay",
      leadTime: "Oras ng gawa",
      leadDays: "araw (handmade)",
      upper: "Upper",
      stripe: "Stripe",
      sole: "Sol",
    },
    cart: {
      title: "Cart mo",
      empty: "Walang laman ang cart.",
      emptyCta: "Pumunta sa tindahan",
      subtotal: "Subtotal",
      shipping: "Padala",
      shippingCalc: "Kalkulahin sa checkout",
      total: "Kabuuan",
      checkout: "Checkout",
      continue: "Magpatuloy sa pamimili",
      remove: "Alisin",
      qty: "Dami",
    },
    checkout: {
      title: "Checkout",
      contact: "Contact",
      email: "Email",
      phone: "Telepono (opsyonal)",
      shipping: "Address ng padala",
      firstName: "Pangalan",
      lastName: "Apelyido",
      address: "Address",
      city: "Lungsod",
      region: "Rehiyon",
      postal: "Postal code",
      country: "Bansa",
      payment: "Bayad",
      card: "Numero ng card",
      nameOnCard: "Pangalan sa card",
      expiry: "Expiry",
      placeOrder: "Kumpirmahin ang order",
      placing: "Pinoproseso…",
      note: "Demo store — walang totoong singil. Order: jidokaan.com",
      summary: "Buod",
      duty: "Tantiya ng duty at buwis",
    },
    success: {
      title: "Natanggap ang order",
      body: "I-email namin ang oras ng gawa at tracking. Site: jidokaan.com",
      order: "Order number",
      continue: "Bumalik sa tindahan",
    },
    about: { title: "JIDOKAAN — custom handmade boxing", mission: "Pangako namin", studio: "Workshop" },
    shippingPage: {
      title: "Padala, duty at produksyon",
      zones: "Mga zone ng padala",
      asia: "Korea at Asya",
      americas: "Amerika",
      europe: "Europa at iba pa",
    },
    footer: {
      shop: "Tindahan",
      help: "Tulong",
      company: "Brand",
      contact: "Contact",
      privacy: "Privacy",
      terms: "Mga Tuntunin",
      address: "Seongsu, Seoul — JIDOKAAN studio",
    },
    login: {
      title: "Mag-sign in",
      body: "I-track ang order at produksyon.",
      continueWith: "Magpatuloy sa",
      disabled: "Naka-off ang sign-in.",
      back: "Home",
    },
    common: { currency: "Pera", language: "Wika", close: "Isara", loading: "Naglo-load…" },
  }),
};

export function t(locale: Locale): Dictionary {
  return DICT[locale] ?? DICT.en;
}

export function pickLocalized(
  value: { ko?: string; en?: string; ja?: string } & Record<string, string | undefined>,
  locale: Locale,
): string {
  return value[locale] || value.en || value.ko || value.ja || "";
}

export const COUNTRIES = [
  { code: "KR", ko: "대한민국", en: "South Korea", ja: "韓国", es: "Corea del Sur", th: "เกาหลีใต้", fr: "Corée du Sud", de: "Südkorea", ar: "كوريا الجنوبية" },
  { code: "US", ko: "미국", en: "United States", ja: "アメリカ", es: "Estados Unidos", th: "สหรัฐอเมริกา", fr: "États-Unis", de: "USA", ar: "الولايات المتحدة" },
  { code: "MX", ko: "멕시코", en: "Mexico", ja: "メキシコ", es: "México", th: "เม็กซิโก", fr: "Mexique", de: "Mexiko", ar: "المكسيك" },
  { code: "CA", ko: "캐나다", en: "Canada", ja: "カナダ", es: "Canadá", th: "แคนาดา", fr: "Canada", de: "Kanada", ar: "كندا" },
  { code: "AU", ko: "호주", en: "Australia", ja: "オーストラリア", es: "Australia", th: "ออสเตรเลีย", fr: "Australie", de: "Australien", ar: "أستراليا" },
  { code: "AE", ko: "아랍에미리트", en: "United Arab Emirates", ja: "UAE", es: "EAU", th: "สหรัฐอาหรับเอมิเรตส์", fr: "Émirats arabes unis", de: "VAE", ar: "الإمارات" },
  { code: "TH", ko: "태국", en: "Thailand", ja: "タイ", es: "Tailandia", th: "ไทย", fr: "Thaïlande", de: "Thailand", ar: "تايلاند" },
  { code: "FR", ko: "프랑스", en: "France", ja: "フランス", es: "Francia", th: "ฝรั่งเศส", fr: "France", de: "Frankreich", ar: "فرنسا" },
  { code: "ES", ko: "스페인", en: "Spain", ja: "スペイン", es: "España", th: "สเปน", fr: "Espagne", de: "Spanien", ar: "إسبانيا" },
  { code: "GB", ko: "영국", en: "United Kingdom", ja: "イギリス", es: "Reino Unido", th: "สหราชอาณาจักร", fr: "Royaume-Uni", de: "Vereinigtes Königreich", ar: "المملكة المتحدة" },
  { code: "DE", ko: "독일", en: "Germany", ja: "ドイツ", es: "Alemania", th: "เยอรมนี", fr: "Allemagne", de: "Deutschland", ar: "ألمانيا" },
  { code: "PH", ko: "필리핀", en: "Philippines", ja: "フィリピン", es: "Filipinas", th: "ฟิลิปปินส์", fr: "Philippines", de: "Philippinen", ar: "الفلبين" },
  { code: "RU", ko: "러시아", en: "Russia", ja: "ロシア", es: "Rusia", th: "รัสเซีย", fr: "Russie", de: "Russland", ar: "روسيا" },
  { code: "UZ", ko: "우즈베키스탄", en: "Uzbekistan", ja: "ウズベキスタン", es: "Uzbekistán", th: "อุซเบกิสถาน", fr: "Ouzbékistan", de: "Usbekistan", ar: "أوزبكستان" },
  { code: "IT", ko: "이탈리아", en: "Italy", ja: "イタリア", es: "Italia", th: "อิตาลี", fr: "Italie", de: "Italien", ar: "إيطاليا" },
  { code: "TR", ko: "튀르키예", en: "Turkey", ja: "トルコ", es: "Turquía", th: "ตุรกี", fr: "Turquie", de: "Türkei", ar: "تركيا" },
  { code: "SA", ko: "사우디아라비아", en: "Saudi Arabia", ja: "サウジアラビア", es: "Arabia Saudí", th: "ซาอุดีอาระเบีย", fr: "Arabie saoudite", de: "Saudi-Arabien", ar: "السعودية" },
  { code: "BR", ko: "브라질", en: "Brazil", ja: "ブラジル", es: "Brasil", th: "บราซิล", fr: "Brésil", de: "Brasilien", ar: "البرازيل" },
  { code: "AR", ko: "아르헨티나", en: "Argentina", ja: "アルゼンチン", es: "Argentina", th: "อาร์เจนตินา", fr: "Argentine", de: "Argentinien", ar: "الأرجنتين" },
  { code: "CH", ko: "스위스", en: "Switzerland", ja: "スイス", es: "Suiza", th: "สวิตเซอร์แลนด์", fr: "Suisse", de: "Schweiz", ar: "سويسرا" },
  { code: "CN", ko: "중국", en: "China", ja: "中国", es: "China", th: "จีน", fr: "Chine", de: "China", ar: "الصين" },
  { code: "IN", ko: "인도", en: "India", ja: "インド", es: "India", th: "อินเดีย", fr: "Inde", de: "Indien", ar: "الهند" },
  { code: "ZA", ko: "남아프리카공화국", en: "South Africa", ja: "南アフリカ", es: "Sudáfrica", th: "แอฟริกาใต้", fr: "Afrique du Sud", de: "Südafrika", ar: "جنوب أفريقيا" },
  { code: "EG", ko: "이집트", en: "Egypt", ja: "エジプト", es: "Egipto", th: "อียิปต์", fr: "Égypte", de: "Ägypten", ar: "مصر" },
  { code: "SG", ko: "싱가포르", en: "Singapore", ja: "シンガポール", es: "Singapur", th: "สิงคโปร์", fr: "Singapour", de: "Singapur", ar: "سنغافورة" },
  { code: "NL", ko: "네덜란드", en: "Netherlands", ja: "オランダ", es: "Países Bajos", th: "เนเธอร์แลนด์", fr: "Pays-Bas", de: "Niederlande", ar: "هولندا" },
  { code: "SE", ko: "스웨덴", en: "Sweden", ja: "スウェーデン", es: "Suecia", th: "สวีเดน", fr: "Suède", de: "Schweden", ar: "السويد" },
  { code: "JP", ko: "일본", en: "Japan", ja: "日本", es: "Japón", th: "ญี่ปุ่น", fr: "Japon", de: "Japan", ar: "اليابان" },
] as const;

export function countryName(
  country: (typeof COUNTRIES)[number],
  locale: Locale,
): string {
  const rec = country as Record<string, string>;
  return rec[locale] || rec.en || rec.ko || country.code;
}

export const FLAG_MARKETS: {
  code: string;
  locale: Locale;
  currency: Currency;
  name: string;
}[] = [
  { code: "kr", locale: "ko", currency: "KRW", name: "대한민국" },
  { code: "us", locale: "en", currency: "USD", name: "United States" },
  { code: "mx", locale: "es", currency: "USD", name: "Mexico" },
  { code: "gb", locale: "en", currency: "USD", name: "United Kingdom" },
  { code: "ca", locale: "en", currency: "USD", name: "Canada" },
  { code: "au", locale: "en", currency: "USD", name: "Australia" },
  { code: "ph", locale: "tl", currency: "USD", name: "Philippines" },
  { code: "th", locale: "th", currency: "USD", name: "Thailand" },
  { code: "ru", locale: "ru", currency: "USD", name: "Russia" },
  { code: "uz", locale: "uz", currency: "USD", name: "Uzbekistan" },
  { code: "de", locale: "de", currency: "USD", name: "Germany" },
  { code: "fr", locale: "fr", currency: "USD", name: "France" },
  { code: "it", locale: "it", currency: "USD", name: "Italy" },
  { code: "es", locale: "es", currency: "USD", name: "Spain" },
  { code: "tr", locale: "tr", currency: "USD", name: "Turkey" },
  { code: "ae", locale: "ar", currency: "USD", name: "United Arab Emirates" },
  { code: "sa", locale: "ar", currency: "USD", name: "Saudi Arabia" },
  { code: "br", locale: "pt", currency: "USD", name: "Brazil" },
  { code: "ar", locale: "es", currency: "USD", name: "Argentina" },
  { code: "ch", locale: "de", currency: "USD", name: "Switzerland" },
  { code: "cn", locale: "zh", currency: "USD", name: "China" },
  { code: "jp", locale: "ja", currency: "USD", name: "Japan" },
  { code: "in", locale: "hi", currency: "USD", name: "India" },
  { code: "za", locale: "en", currency: "USD", name: "South Africa" },
  { code: "eg", locale: "ar", currency: "USD", name: "Egypt" },
];


/** Strong match only. Unknown / generic English → null (stay Korean). */
export function detectVisitorMarket(): (typeof FLAG_MARKETS)[number] | null {
  if (typeof navigator === "undefined") return FLAG_MARKETS[0];
  const langs = (
    navigator.languages?.length ? [...navigator.languages] : [navigator.language]
  ).map((l) => (l || "").toLowerCase());
  let tz = "";
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    tz = "";
  }

  if (langs.some((l) => l.startsWith("ko")) || tz === "Asia/Seoul") {
    return FLAG_MARKETS.find((m) => m.code === "kr")!;
  }
  if (langs.some((l) => l.startsWith("th")) || tz === "Asia/Bangkok") {
    return FLAG_MARKETS.find((m) => m.code === "th")!;
  }
  if (langs.some((l) => l.startsWith("ar-sa")) || tz === "Asia/Riyadh") {
    return FLAG_MARKETS.find((m) => m.code === "sa")!;
  }
  if (
    langs.some((l) => l.startsWith("ar")) ||
    tz === "Asia/Dubai" ||
    tz === "Asia/Abu_Dhabi"
  ) {
    return FLAG_MARKETS.find((m) => m.code === "ae")!;
  }
  if (langs.some((l) => l.startsWith("de")) || tz.startsWith("Europe/Berlin")) {
    return FLAG_MARKETS.find((m) => m.code === "de")!;
  }
  if (langs.some((l) => l.startsWith("it")) || tz === "Europe/Rome") {
    return FLAG_MARKETS.find((m) => m.code === "it")!;
  }
  if (langs.some((l) => l.startsWith("fr")) && !langs.some((l) => l.startsWith("fr-ca"))) {
    return FLAG_MARKETS.find((m) => m.code === "fr")!;
  }
  if (langs.some((l) => l.startsWith("es-mx")) || tz.startsWith("America/Mexico")) {
    return FLAG_MARKETS.find((m) => m.code === "mx")!;
  }
  if (langs.some((l) => l.startsWith("es-ar")) || tz === "America/Argentina/Buenos_Aires") {
    return FLAG_MARKETS.find((m) => m.code === "ar")!;
  }
  if (langs.some((l) => l.startsWith("pt")) || tz === "America/Sao_Paulo") {
    return FLAG_MARKETS.find((m) => m.code === "br")!;
  }
  if (langs.some((l) => l.startsWith("ru")) || tz === "Europe/Moscow") {
    return FLAG_MARKETS.find((m) => m.code === "ru")!;
  }
  if (langs.some((l) => l.startsWith("uz")) || tz === "Asia/Tashkent") {
    return FLAG_MARKETS.find((m) => m.code === "uz")!;
  }
  if (langs.some((l) => l.startsWith("tr")) || tz === "Europe/Istanbul") {
    return FLAG_MARKETS.find((m) => m.code === "tr")!;
  }
  if (langs.some((l) => l.startsWith("fil") || l.startsWith("tl")) || tz === "Asia/Manila") {
    return FLAG_MARKETS.find((m) => m.code === "ph")!;
  }
  if (langs.some((l) => l.startsWith("es"))) {
    return FLAG_MARKETS.find((m) => m.code === "es")!;
  }
  if (langs.some((l) => l.startsWith("zh")) || tz.startsWith("Asia/Shanghai") || tz === "Asia/Hong_Kong") {
    return FLAG_MARKETS.find((m) => m.code === "cn")!;
  }
  if (langs.some((l) => l.startsWith("ja")) || tz === "Asia/Tokyo") {
    return FLAG_MARKETS.find((m) => m.code === "jp")!;
  }
  if (langs.some((l) => l.startsWith("hi")) || tz === "Asia/Kolkata" || tz === "Asia/Calcutta") {
    return FLAG_MARKETS.find((m) => m.code === "in")!;
  }
  if (tz === "Africa/Johannesburg" || langs.some((l) => l.startsWith("af") || l.startsWith("zu"))) {
    return FLAG_MARKETS.find((m) => m.code === "za")!;
  }
  if (tz === "Africa/Cairo" || langs.some((l) => l.startsWith("ar-eg"))) {
    return FLAG_MARKETS.find((m) => m.code === "eg")!;
  }
  if (tz === "Europe/Zurich" || langs.some((l) => l.startsWith("de-ch") || l.startsWith("gsw"))) {
    return FLAG_MARKETS.find((m) => m.code === "ch")!;
  }
  if (langs.some((l) => l.startsWith("en-gb")) || tz === "Europe/London") {
    return FLAG_MARKETS.find((m) => m.code === "gb")!;
  }
  if (langs.some((l) => l.startsWith("en-au")) || tz.startsWith("Australia/")) {
    return FLAG_MARKETS.find((m) => m.code === "au")!;
  }
  if (langs.some((l) => l.startsWith("en-ca")) || tz.startsWith("America/Toronto") || tz.startsWith("America/Vancouver")) {
    return FLAG_MARKETS.find((m) => m.code === "ca")!;
  }
  if (
    langs.some((l) => l.startsWith("en-us")) &&
    (tz.startsWith("America/") || tz.startsWith("US/"))
  ) {
    return FLAG_MARKETS.find((m) => m.code === "us")!;
  }

  // Exception / unknown preview env → Korean so the site builder stays in 한글
  return FLAG_MARKETS.find((m) => m.code === "kr")!;
}

export const HTML_LANG: Record<Locale, string> = {
  ko: "ko",
  en: "en",
  ja: "ja",
  es: "es",
  th: "th",
  fr: "fr",
  de: "de",
  ar: "ar",
  ru: "ru",
  it: "it",
  pt: "pt",
  tr: "tr",
  uz: "uz",
  zh: "zh",
  hi: "hi",
  tl: "tl",
};

export const FREE_SHIP_USD_CENTS = 3600;
export const FREE_SHIP_KRW = 50000;
