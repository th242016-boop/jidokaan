import type { ProductOptions } from "./product-options";
import { getCatalogCache } from "./catalog-cache";

export type CategoryId = "custom" | "ready" | "care" | "gear";

export type Localized = {
  ko: string;
  en: string;
  ja: string;
};

export type Product = {
  id: string;
  sku: string;
  name: Localized;
  tagline: Localized;
  description: Localized;
  category: CategoryId;
  /** Base price in USD cents (approx from KRW) */
  priceUsd: number;
  /** Official KRW price for display accuracy when currency is KRW */
  priceKrw: number;
  compareAtUsd?: number;
  compareAtKrw?: number;
  rating: number;
  reviews: number;
  badge?: Localized;
  colors: string[];
  materials: Localized;
  weight: string;
  shipsFrom: Localized;
  inStock: boolean;
  featured?: boolean;
  plate: string;
  accent: string;
  shape: "drone" | "classic" | "low" | "laces" | "kit" | "patch";
  image?: string;
  images?: string[];
  detailImages?: string[];
  visible?: boolean;
  customizable?: boolean;
  sizes?: string[];
  leadDays?: number;
  createdAt?: string;
  majorId?: string;
  minorId?: string;
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  options?: ProductOptions;
};

export const CATEGORIES: {
  id: CategoryId;
  label: Localized;
  description: Localized;
}[] = [
  {
    id: "custom",
    label: { ko: "커스텀", en: "Custom", ja: "カスタム" },
    description: {
      ko: "원하는 컬러로 주문 제작",
      en: "Build your own colorway",
      ja: "好きなカラーでオーダー",
    },
  },
  {
    id: "ready",
    label: { ko: "레디메이드", en: "Ready-made", ja: "レディメイド" },
    description: {
      ko: "검증된 컬러웨이 즉시 선택",
      en: "Proven colorways, ready to order",
      ja: "定番カラーをすぐ注文",
    },
  },
  {
    id: "care",
    label: { ko: "케어", en: "Care", ja: "ケア" },
    description: {
      ko: "신발을 오래 쓰는 관리 용품",
      en: "Keep your boots fighting fit",
      ja: "長く履くためのケア",
    },
  },
  {
    id: "gear",
    label: { ko: "기어", en: "Gear", ja: "ギア" },
    description: {
      ko: "링 사이드 액세서리",
      en: "Ring-side essentials",
      ja: "リングサイドの必需品",
    },
  },
];

export const PRODUCTS: Product[] = [
  {
    id: "drone-custom",
    sku: "JDK-DRONE-CUSTOM",
    name: {
      ko: "DRONE 커스텀 복싱화",
      en: "DRONE Custom Boxing Shoes",
      ja: "DRONE カスタムボクシングシューズ",
    },
    tagline: {
      ko: "국내 최초 커스텀 수제 복싱화 — 컬러는 당신 마음대로",
      en: "Korea’s first custom handmade boxing shoes",
      ja: "韓国初のカスタム手製ボクシングシューズ",
    },
    description: {
      ko: "지도칸 DRONE은 100% 국내 수제 제작 커스텀 복싱화입니다. 갑피·힐·스트라이프·솔 컬러를 직접 고르고, 발볼이 넓은 핏과 미즈노급 착화감을 목표로 설계했습니다. 수작업 제작으로 약 10일 소요됩니다. 정식가 328,000원 · 현재 베타 특가.",
      en: "JIDOKAAN DRONE is a 100% Korea-made custom boxing boot. Choose upper, heel, stripe and sole colors. Built for a wide, secure fit and pro-level comfort. Handcrafted lead time ~10 days. Full price ₩328,000 — beta pricing now.",
      ja: "JIDOKAAN DRONEは100%韓国製のカスタム手製ボクシングシューズ。アッパー・ヒール・ストライプ・ソールの色を選べます。幅広フィットとプロ級の履き心地。手作りで約10日。通常価格₩328,000 — 現在ベータ特価。",
    },
    category: "custom",
    priceUsd: 23000,
    priceKrw: 288000,
    compareAtUsd: 23800,
    compareAtKrw: 328000,
    rating: 4.9,
    reviews: 186,
    badge: { ko: "베타 특가", en: "Beta price", ja: "ベータ特価" },
    colors: ["#111111", "#f5f5f5", "#dc2626", "#1d4ed8", "#fbbf24", "#16a34a"],
    materials: {
      ko: "합성 가죽 갑피, 고그립 아웃솔, 쿠션 미드솔",
      en: "Synthetic leather upper, high-grip outsole, cushioned midsole",
      ja: "合成レザーアッパー、高グリップアウトソール、クッションミッドソール",
    },
    weight: "약 380 g / side",
    shipsFrom: { ko: "서울 성수, KR", en: "Seongsu, Seoul, KR", ja: "ソウル聖水, KR" },
    inStock: true,
    featured: true,
    plate: "#1a1a1e",
    accent: "#dc2626",
    shape: "drone",
    customizable: true,
    sizes: ["240", "245", "250", "255", "260", "265", "270", "275", "280", "285", "290"],
    leadDays: 10,
  },
  {
    id: "drone-black",
    sku: "JDK-DRONE-BLK",
    name: {
      ko: "DRONE Classic Black",
      en: "DRONE Classic Black",
      ja: "DRONE Classic Black",
    },
    tagline: {
      ko: "링에서 가장 많이 선택되는 블랙 올오버",
      en: "The most-chosen all-black ring boot",
      ja: "リングで最も選ばれるオールブラック",
    },
    description: {
      ko: "올 블랙 컬러웨이의 DRONE. 커스텀 대기 없이 바로 주문 가능한 레디 스펙입니다. 동일한 수제 공정과 착화감.",
      en: "All-black DRONE colorway. Same handmade build — ready to order without full custom wait options beyond size.",
      ja: "オールブラックのDRONE。同じ手製工程と履き心地でサイズ選択のみ。",
    },
    category: "ready",
    priceUsd: 23000,
    priceKrw: 288000,
    compareAtUsd: 23800,
    compareAtKrw: 328000,
    rating: 4.8,
    reviews: 124,
    badge: { ko: "베스트", en: "Best seller", ja: "ベスト" },
    colors: ["#111111", "#1f1f1f"],
    materials: {
      ko: "합성 가죽 갑피, 고그립 아웃솔",
      en: "Synthetic leather upper, high-grip outsole",
      ja: "合成レザーアッパー、高グリップアウトソール",
    },
    weight: "약 380 g / side",
    shipsFrom: { ko: "서울 성수, KR", en: "Seongsu, Seoul, KR", ja: "ソウル聖水, KR" },
    inStock: true,
    featured: true,
    plate: "#161618",
    accent: "#a1a1aa",
    shape: "classic",
    sizes: ["240", "245", "250", "255", "260", "265", "270", "275", "280", "285", "290"],
    leadDays: 10,
  },
  {
    id: "drone-white",
    sku: "JDK-DRONE-WHT",
    name: {
      ko: "DRONE Pure White",
      en: "DRONE Pure White",
      ja: "DRONE Pure White",
    },
    tagline: {
      ko: "클린한 화이트 베이스, 링 위 존재감",
      en: "Clean white presence on the canvas",
      ja: "クリーンなホワイトの存在感",
    },
    description: {
      ko: "퓨어 화이트 갑피에 블랙 솔 포인트. 촬영·시합 모두에서 돋보이는 컬러웨이.",
      en: "Pure white upper with black sole contrast — sharp under lights.",
      ja: "ピュアホワイトアッパーにブラックソール。リングでも映える配色。",
    },
    category: "ready",
    priceUsd: 23000,
    priceKrw: 288000,
    compareAtUsd: 23800,
    compareAtKrw: 328000,
    rating: 4.8,
    reviews: 97,
    colors: ["#f5f5f5", "#111111"],
    materials: {
      ko: "합성 가죽 갑피, 고그립 아웃솔",
      en: "Synthetic leather upper, high-grip outsole",
      ja: "合成レザーアッパー、高グリップアウトソール",
    },
    weight: "약 380 g / side",
    shipsFrom: { ko: "서울 성수, KR", en: "Seongsu, Seoul, KR", ja: "ソウル聖水, KR" },
    inStock: true,
    featured: true,
    plate: "#222226",
    accent: "#f5f5f5",
    shape: "drone",
    sizes: ["240", "245", "250", "255", "260", "265", "270", "275", "280", "285", "290"],
    leadDays: 10,
  },
  {
    id: "drone-ring-red",
    sku: "JDK-DRONE-RED",
    name: {
      ko: "DRONE Ring Red",
      en: "DRONE Ring Red",
      ja: "DRONE Ring Red",
    },
    tagline: {
      ko: "레드 포인트 스트라이프 — 공격적인 인상",
      en: "Red stripe energy for the walk-out",
      ja: "レッドストライプの攻撃的な印象",
    },
    description: {
      ko: "블랙 바디에 레드 스트라이프. 기세·시합용으로 인기 있는 조합입니다.",
      en: "Black body with red stripe — a favorite for fight nights.",
      ja: "ブラックボディにレッドストライプ。試合向けの定番。",
    },
    category: "ready",
    priceUsd: 23000,
    priceKrw: 288000,
    compareAtUsd: 23800,
    compareAtKrw: 328000,
    rating: 4.9,
    reviews: 81,
    badge: { ko: "인기", en: "Popular", ja: "人気" },
    colors: ["#111111", "#dc2626"],
    materials: {
      ko: "합성 가죽 갑피, 고그립 아웃솔",
      en: "Synthetic leather upper, high-grip outsole",
      ja: "合成レザーアッパー、高グリップアウトソール",
    },
    weight: "약 380 g / side",
    shipsFrom: { ko: "서울 성수, KR", en: "Seongsu, Seoul, KR", ja: "ソウル聖水, KR" },
    inStock: true,
    featured: true,
    plate: "#1a1214",
    accent: "#dc2626",
    shape: "drone",
    sizes: ["240", "245", "250", "255", "260", "265", "270", "275", "280", "285", "290"],
    leadDays: 10,
  },
  {
    id: "drone-mint",
    sku: "JDK-DRONE-MNT",
    name: {
      ko: "DRONE Mint Signal",
      en: "DRONE Mint Signal",
      ja: "DRONE Mint Signal",
    },
    tagline: {
      ko: "민트 포인트 시그널 컬러웨이",
      en: "Mint signal colorway",
      ja: "ミントシグナルのカラーウェイ",
    },
    description: {
      ko: "다크 베이스에 민트 포인트. 커스텀 시뮬레이터에서 자주 고르는 조합을 레디메이드로.",
      en: "Dark base with mint accents — a simulator favorite, ready-made.",
      ja: "ダークベースにミントアクセント。シミュレーター人気配色を既製品で。",
    },
    category: "ready",
    priceUsd: 23000,
    priceKrw: 288000,
    rating: 4.7,
    reviews: 54,
    colors: ["#111111", "#5eead4"],
    materials: {
      ko: "합성 가죽 갑피, 고그립 아웃솔",
      en: "Synthetic leather upper, high-grip outsole",
      ja: "合成レザーアッパー、高グリップアウトソール",
    },
    weight: "약 380 g / side",
    shipsFrom: { ko: "서울 성수, KR", en: "Seongsu, Seoul, KR", ja: "ソウル聖水, KR" },
    inStock: true,
    featured: true,
    plate: "#121816",
    accent: "#5eead4",
    shape: "low",
    sizes: ["240", "245", "250", "255", "260", "265", "270", "275", "280", "285", "290"],
    leadDays: 10,
  },
  {
    id: "lace-pack",
    sku: "JDK-LACE-01",
    name: {
      ko: "교체용 레이스 팩",
      en: "Replacement Lace Pack",
      ja: "替えシューレースパック",
    },
    tagline: {
      ko: "컬러 레이스로 룩을 바꾸는 가장 쉬운 방법",
      en: "The easiest way to change your look",
      ja: "カラーレースでルックを変える",
    },
    description: {
      ko: "DRONE 호환 교체 레이스 2쌍. 블랙 / 화이트 / 레드 중 선택.",
      en: "Two pairs of DRONE-compatible laces. Black, white, or red.",
      ja: "DRONE対応替えレース2組。ブラック / ホワイト / レッド。",
    },
    category: "care",
    priceUsd: 1800,
    priceKrw: 19000,
    rating: 4.6,
    reviews: 43,
    colors: ["#111111", "#f5f5f5", "#dc2626"],
    materials: {
      ko: "폴리에스터 플랫 레이스",
      en: "Polyester flat laces",
      ja: "ポリエステルフラットレース",
    },
    weight: "40 g",
    shipsFrom: { ko: "서울 성수, KR", en: "Seongsu, Seoul, KR", ja: "ソウル聖水, KR" },
    inStock: true,
    plate: "#1a1a1e",
    accent: "#dc2626",
    shape: "laces",
  },
  {
    id: "care-kit",
    sku: "JDK-CARE-01",
    name: {
      ko: "복싱화 케어 키트",
      en: "Boxing Shoe Care Kit",
      ja: "ボクシングシューズケアキット",
    },
    tagline: {
      ko: "훈련 후 관리로 수명을 늘리세요",
      en: "Extend boot life after hard sessions",
      ja: "トレーニング後のケアで寿命を延ばす",
    },
    description: {
      ko: "클리너, 보호 크림, 마이크로파이버 천. 수제 복싱화 갑피 관리용.",
      en: "Cleaner, protectant cream, and microfiber cloth for handmade uppers.",
      ja: "クリーナー、保護クリーム、マイクロファイバークロス。",
    },
    category: "care",
    priceUsd: 2800,
    priceKrw: 32000,
    rating: 4.7,
    reviews: 38,
    colors: ["#27272a"],
    materials: {
      ko: "클리너, 크림, 마이크로파이버",
      en: "Cleaner, cream, microfiber",
      ja: "クリーナー、クリーム、マイクロファイバー",
    },
    weight: "220 g",
    shipsFrom: { ko: "서울 성수, KR", en: "Seongsu, Seoul, KR", ja: "ソウル聖水, KR" },
    inStock: true,
    plate: "#18181b",
    accent: "#a1a1aa",
    shape: "kit",
  },
  {
    id: "jidokaan-patch",
    sku: "JDK-PATCH-01",
    name: {
      ko: "지도칸 패치 세트",
      en: "JIDOKAAN Patch Set",
      ja: "JIDOKAAN パッチセット",
    },
    tagline: {
      ko: "가방·글러브에 붙이는 브랜드 패치",
      en: "Brand patches for bags and gloves",
      ja: "バッグやグローブに貼るブランドパッチ",
    },
    description: {
      ko: "자수 패치 3종 세트. 벨크로 또는 봉제용.",
      en: "Set of three embroidered patches. Velcro or sew-on.",
      ja: "刺繍パッチ3種セット。ベルクロまたは縫い付け。",
    },
    category: "gear",
    priceUsd: 1600,
    priceKrw: 18000,
    rating: 4.5,
    reviews: 29,
    colors: ["#111111", "#dc2626", "#f5f5f5"],
    materials: {
      ko: "자수 패치, 벨크로 백킹",
      en: "Embroidered patch, velcro backing",
      ja: "刺繍パッチ、ベルクロ裏地",
    },
    weight: "30 g",
    shipsFrom: { ko: "서울 성수, KR", en: "Seongsu, Seoul, KR", ja: "ソウル聖水, KR" },
    inStock: true,
    plate: "#141417",
    accent: "#dc2626",
    shape: "patch",
  },
];

export function getProduct(id: string) {
  const live = getCatalogCache();
  return (live ?? PRODUCTS).find((p) => p.id === id);
}

export function isListed(product: Product) {
  return product.visible !== false;
}

export function productGallery(product: Product): string[] {
  return [product.image, ...(product.images ?? [])].filter(
    (src): src is string => Boolean(src),
  );
}

export function getFeaturedProducts() {
  const live = getCatalogCache();
  return (live ?? PRODUCTS).filter((p) => p.featured && isListed(p));
}

export function getProductsByCategory(category?: CategoryId | "all") {
  const list = (getCatalogCache() ?? PRODUCTS).filter(isListed);
  if (!category || category === "all") return list;
  return list.filter((p) => p.category === category);
}
