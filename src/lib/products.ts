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
    "id": "drone-custom",
    "sku": "11962349323",
    "name": {
      "en": "JIDOKAAN DRONE Custom Boxing Shoes",
      "ja": "JIDOKAAN DRONE カスタムボクシングシューズ",
      "ko": "국내 수제제작 커스텀 시합용 복싱화 지도칸 드론"
    },
    "tagline": {
      "en": "Handmade fight boots from Seongsu, color by color",
      "ja": "聖水工房で一足ずつ手作りする試合用カスタムシューズ",
      "ko": "성수 공방에서 한 켤레씩 손으로 만드는 시합용 커스텀 복싱화"
    },
    "description": {
      "en": "JIDOKAAN DRONE is a fight-ready custom boxing boot, handmade one pair at a time in Seongsu, Seoul.\n\nPick colors and size in the simulator — tap the large Custom order button.\n\n• Panel-by-panel color custom\n• Gum outsole grip\n• Handmade build, repairable in Korea (outsole recraft ₩50,000)\n• Women’s 225–245, men’s 240–300. Men often size down one.\n• About 20–30 days to make. KR ₩288,000 / worldwide USD 230.",
      "ja": "JIDOKAAN DRONEはソウル聖水で一足ずつ手作りする試合用カスタムボクシングシューズです。\n\nカラーとサイズはシミュレーターで選びます。大きな「カスタム注文」ボタンへ。\n\n・パネルごとにカラー指定\n・生ゴムアウトソール\n・韓国で修理可能（アウトソール交換₩50,000）\n・女性225–245 / 男性240–300。男性はワンサイズ下げ推奨。\n・製作約20–30日。韓国₩288,000 / 海外USD 230。",
      "ko": "지도칸 DRONE은 대한민국 성수에서 한 켤레씩 손으로 만드는 시합용 커스텀 복싱화입니다.\n\n컬러와 사이즈는 이 페이지가 아니라, 아래 큰 버튼으로 들어가는 시뮬레이터에서 고릅니다.\n\n■ 이런 분께\n· 부위별 컬러를 직접 조합하고 싶은 선수\n· 기성 복싱화 착화감이 아쉬웠던 분\n· 국내에서 수선·아웃솔 교체가 가능한 신발을 원하는 분\n\n■ 특징\n· 부위별 컬러 커스텀\n· 생고무창 접지력\n· 미즈노 피니셔와 같은 수제 공정\n· 국내 제작 → 수선 가능, 아웃솔 교체 50,000원\n\n■ 사이즈 가이드\n여성 225–245 / 남성 240–300\n여성은 보통 정사이즈, 남성은 일반 운동화보다 약간 크다는 평가가 많아 한 치수 작게 권장합니다. 발볼이 두꺼우면 정사이즈가 더 맞을 수 있습니다.\n\n■ 제작 · 배송\n수제 제작 평균 20~30일 + 배송\n한국 288,000원 / 해외 USD 230"
    },
    "category": "custom",
    "priceUsd": 23000,
    "priceKrw": 288000,
    "compareAtUsd": 31000,
    "compareAtKrw": 388000,
    "rating": 4.9,
    "reviews": 186,
    "badge": {
      "en": "Custom",
      "ja": "カスタム",
      "ko": "커스텀"
    },
    "colors": [
      "#f5f5f5",
      "#111111",
      "#d4af37"
    ],
    "materials": {
      "en": "Handmade upper, high-grip outsole",
      "ja": "手製アッパー、高グリップアウトソール",
      "ko": "수제 갑피, 고그립 아웃솔"
    },
    "weight": "약 380 g / side",
    "shipsFrom": {
      "en": "Seongsu, Seoul, KR",
      "ja": "ソウル聖水, KR",
      "ko": "서울 성수, KR"
    },
    "inStock": true,
    "featured": true,
    "plate": "#1a1a1e",
    "accent": "#dc2626",
    "shape": "drone",
    "image": "/products/store/drone-main.png",
    "images": [
      "/products/store/drone-main.png",
      "/products/store/shoe-drone.png",
      "/products/store/shoe-drone-2.png",
      "/products/store/shoe-drone-3.png"
    ],
    "visible": true,
    "customizable": true,
    "sizes": [
      "225",
      "230",
      "235",
      "240",
      "245",
      "250",
      "255",
      "260",
      "265",
      "270",
      "275",
      "280",
      "285",
      "290",
      "295",
      "300"
    ],
    "leadDays": 25,
    "createdAt": "2025-06-13T15:46:02.000Z",
    "majorId": "shoes",
    "sortOrder": 0,
    "seoTitle": "국내 수제제작 커스텀 시합용 복싱화 지도칸 드론 | 지도칸 JIDOKAAN",
    "seoDescription": "성수 공방에서 한 켤레씩 손으로 만드는 시합용 커스텀 복싱화",
    "seoKeywords": "국내 수제제작 커스텀 시합용 복싱화 지도칸 드론, 지도칸, JIDOKAAN",
    "options": {
      "skus": [],
      "type": "combo",
      "groups": [],
      "enabled": false
    }
  },
  {
    "id": "drone-mid",
    "sku": "12349180497",
    "name": {
      "en": "JIDOKAAN DRONE Mid-Cut Custom Boxing Shoes",
      "ja": "JIDOKAAN DRONE ミッドカット カスタム",
      "ko": "국내 수제 커스텀 제작 선수용 복싱화 지도칸 드론 중목 미드컷"
    },
    "tagline": {
      "en": "Mid-cut height for extra ankle support",
      "ja": "ミッドカット。足首サポート重視",
      "ko": "중목 미드컷 — 발목 지지가 더 필요한 선수에게"
    },
    "description": {
      "en": "DRONE mid-cut. Same handmade fight boot with a taller collar for extra ankle support.\n\nColors and size are chosen in the simulator via Custom order.\n\nWomen 225–245 / men 240–300. Men often size down one.\nAbout 20–30 days. KR ₩288,000 / worldwide USD 230.",
      "ja": "DRONEミッドカット。同じ手製で、足首サポートのためカラーが高めです。\n\nカラーとサイズはシミュレーターで選択。\n製作約20–30日。韓国₩288,000 / 海外USD 230。",
      "ko": "지도칸 DRONE 중목(미드컷)입니다. 시합용과 같은 수제 공정에, 목이 조금 더 높아 발목 지지가 필요할 때 고릅니다.\n\n컬러와 사이즈는 시뮬레이터에서 고릅니다. 아래 큰 「커스텀 주문」을 누르세요.\n\n■ 특징\n· 중목 미드컷 — 발목 지지 강화\n· 부위별 컬러 커스텀\n· 생고무창 접지력, 국내 수선 가능\n\n■ 사이즈\n여성 225–245 / 남성 240–300\n남성은 한 치수 작게, 발볼이 두꺼우면 정사이즈.\n\n■ 제작 · 가격\n수제 평균 20~30일. 한국 288,000원 / 해외 USD 230"
    },
    "category": "custom",
    "priceUsd": 23000,
    "priceKrw": 288000,
    "compareAtUsd": 31000,
    "compareAtKrw": 388000,
    "rating": 4.8,
    "reviews": 64,
    "badge": {
      "en": "Mid-cut",
      "ja": "ミッド",
      "ko": "미드컷"
    },
    "colors": [
      "#111111",
      "#d4af37"
    ],
    "materials": {
      "en": "Handmade upper, high-grip outsole",
      "ja": "手製アッパー、高グリップアウトソール",
      "ko": "수제 갑피, 고그립 아웃솔"
    },
    "weight": "약 400 g / side",
    "shipsFrom": {
      "en": "Seongsu, Seoul, KR",
      "ja": "ソウル聖水, KR",
      "ko": "서울 성수, KR"
    },
    "inStock": true,
    "featured": true,
    "plate": "#161618",
    "accent": "#d4af37",
    "shape": "classic",
    "image": "/products/store/mid-main.png",
    "images": [
      "/products/store/mid-main.png",
      "/products/store/shoe-mid.png",
      "/products/store/shoe-mid-2.jpg",
      "/products/store/shoe-mid-3.jpg"
    ],
    "visible": true,
    "customizable": true,
    "sizes": [
      "225",
      "230",
      "235",
      "240",
      "245",
      "250",
      "255",
      "260",
      "265",
      "270",
      "275",
      "280",
      "285",
      "290",
      "295",
      "300"
    ],
    "leadDays": 25,
    "createdAt": "2025-09-04T11:03:29.000Z",
    "majorId": "shoes",
    "sortOrder": 1,
    "seoTitle": "국내 수제 커스텀 제작 선수용 복싱화 지도칸 드론 중목 미드컷 | 지도칸 JIDOKAAN",
    "seoDescription": "중목 미드컷 — 발목 지지가 더 필요한 선수에게",
    "seoKeywords": "국내 수제 커스텀 제작 선수용 복싱화 지도칸 드론 중목 미드컷, 지도칸, JIDOKAAN",
    "options": {
      "skus": [],
      "type": "combo",
      "groups": [],
      "enabled": false
    }
  },
  {
    "id": "glove-strap",
    "sku": "13709768555",
    "name": {
      "en": "Leather lace-up glove converter strap",
      "ja": "本革コンバーター レースアップグローブストラップ",
      "ko": "리얼 천연 소가죽 컨버터 레이스업 끈글러브 스트랩 9가지컬러"
    },
    "tagline": {
      "en": "Convert velcro gloves to lace-up — 9 colors",
      "ja": "マジックテープをレースアップに。9色",
      "ko": "벨크로 글러브를 레이스업으로 — 9가지 컬러"
    },
    "description": {
      "en": "Full-grain leather converter straps turn velcro gloves into a lace-up closure.\n\nNine colors. One set. Ships from Seoul in about 2–3 days.",
      "ja": "本革コンバーター。マジックテープグローブをレースアップ仕様に。9色。ソウルから2–3日。",
      "ko": "벨크로 글러브를 레이스업처럼 묶을 수 있게 하는 천연 소가죽 컨버터 스트랩입니다.\n\n시중 기성 부자재보다 가죽 두께와 마감을 올렸습니다. 글러브 벨크로 위에 장착해 끈을 통과시켜 사용합니다.\n\n■ 컬러 9종\n블랙, 화이트, 레드, 블루, 네이비, 골드, 실버, 브라운, 와인\n\n■ 구성 · 배송\n스트랩 1세트. 국내 제작, 출고 약 2–3일."
    },
    "category": "gear",
    "priceUsd": 2300,
    "priceKrw": 28900,
    "compareAtUsd": 3900,
    "compareAtKrw": 49000,
    "rating": 4.8,
    "reviews": 22,
    "colors": [
      "#7a1f1f",
      "#111111",
      "#d4af37"
    ],
    "materials": {
      "en": "Full-grain cowhide",
      "ja": "本革",
      "ko": "천연 소가죽"
    },
    "weight": "80 g",
    "shipsFrom": {
      "en": "Seongsu, Seoul, KR",
      "ja": "ソウル聖水, KR",
      "ko": "서울 성수, KR"
    },
    "inStock": true,
    "featured": false,
    "plate": "#1a1412",
    "accent": "#7a1f1f",
    "shape": "kit",
    "image": "/products/store/strap-main.png",
    "images": [
      "/products/store/strap-main.png"
    ],
    "visible": true,
    "leadDays": 3,
    "createdAt": "2026-08-08T18:29:59.000Z",
    "majorId": "etc",
    "sortOrder": 2,
    "seoTitle": "리얼 천연 소가죽 컨버터 레이스업 끈글러브 스트랩 9가지컬러 | 지도칸 JIDOKAAN",
    "seoDescription": "벨크로 글러브를 레이스업으로 — 9가지 컬러",
    "seoKeywords": "리얼 천연 소가죽 컨버터 레이스업 끈글러브 스트랩 9가지컬러, 지도칸, JIDOKAAN",
    "options": {
      "skus": [
        {
          "key": "블랙",
          "stock": 67,
          "values": [
            "블랙"
          ],
          "enabled": true,
          "extraKrw": 0,
          "extraUsd": 0
        },
        {
          "key": "화이트",
          "stock": 67,
          "values": [
            "화이트"
          ],
          "enabled": true,
          "extraKrw": 0,
          "extraUsd": 0
        },
        {
          "key": "레드",
          "stock": 67,
          "values": [
            "레드"
          ],
          "enabled": true,
          "extraKrw": 0,
          "extraUsd": 0
        },
        {
          "key": "블루",
          "stock": 67,
          "values": [
            "블루"
          ],
          "enabled": true,
          "extraKrw": 0,
          "extraUsd": 0
        },
        {
          "key": "네이비",
          "stock": 67,
          "values": [
            "네이비"
          ],
          "enabled": true,
          "extraKrw": 0,
          "extraUsd": 0
        },
        {
          "key": "골드",
          "stock": 67,
          "values": [
            "골드"
          ],
          "enabled": true,
          "extraKrw": 0,
          "extraUsd": 0
        },
        {
          "key": "실버",
          "stock": 67,
          "values": [
            "실버"
          ],
          "enabled": true,
          "extraKrw": 0,
          "extraUsd": 0
        },
        {
          "key": "브라운",
          "stock": 67,
          "values": [
            "브라운"
          ],
          "enabled": true,
          "extraKrw": 0,
          "extraUsd": 0
        },
        {
          "key": "와인",
          "stock": 67,
          "values": [
            "와인"
          ],
          "enabled": true,
          "extraKrw": 0,
          "extraUsd": 0
        }
      ],
      "type": "single",
      "groups": [
        {
          "name": "컬러",
          "values": [
            "블랙",
            "화이트",
            "레드",
            "블루",
            "네이비",
            "골드",
            "실버",
            "브라운",
            "와인"
          ]
        }
      ],
      "enabled": true
    }
  },
  {
    "id": "viper-band",
    "sku": "10994229070",
    "name": {
      "en": "Viper towel headband",
      "ja": "バイパー頭巾 タオルタイプ",
      "ko": "복싱 두건 헤어밴드 겸용 스포츠 헬스 러닝 땀흡수 타올타입 바이퍼두건"
    },
    "tagline": {
      "en": "Sweat-absorbing towel wrap for boxing and training",
      "ja": "汗を吸うタオル頭巾。ボクシング・ジム・ラン",
      "ko": "땀 흡수 타올 두건 — 복싱·헬스·러닝"
    },
    "description": {
      "en": "Best-selling towel-type Viper wrap. Absorbs sweat, worn as a headband for boxing, gym, and running. Registered design.\n\nColors: black, navy, white, red, blue.",
      "ja": "ベストセラーのタオルタイプ頭巾。ボクシング・ジム・ラン用。ブラック/ネイビー/ホワイト/レッド/ブルー。",
      "ko": "지도칸 베스트셀러, 타올 타입 바이퍼두건입니다.\n\n땀을 잘 흡수하고, 헤어밴드처럼 둘러 복싱·헬스·러닝에 씁니다. 디자인 등록이 완료된 제품입니다.\n\n■ 컬러\n블랙 / 네이비 / 화이트 / 레드 / 블루\n\n■ 소재\n타올 면 혼방. 세탁 후 그늘에서 건조하세요."
    },
    "category": "gear",
    "priceUsd": 1300,
    "priceKrw": 16900,
    "compareAtUsd": 2100,
    "compareAtKrw": 25900,
    "rating": 4.7,
    "reviews": 48,
    "colors": [
      "#111111",
      "#1e3a5f",
      "#f5f5f5",
      "#b91c1c",
      "#1d4ed8"
    ],
    "materials": {
      "en": "Towel cotton blend",
      "ja": "タオル生地",
      "ko": "타올 면 혼방"
    },
    "weight": "60 g",
    "shipsFrom": {
      "en": "Seongsu, Seoul, KR",
      "ja": "ソウル聖水, KR",
      "ko": "서울 성수, KR"
    },
    "inStock": true,
    "featured": true,
    "plate": "#141418",
    "accent": "#b91c1c",
    "shape": "kit",
    "image": "/products/store/viper-main.jpg",
    "images": [
      "/products/store/viper-main.jpg",
      "/products/store/band.jpg"
    ],
    "visible": true,
    "leadDays": 3,
    "createdAt": "2024-10-13T14:20:32.000Z",
    "majorId": "apparel",
    "sortOrder": 3,
    "seoTitle": "복싱 두건 헤어밴드 겸용 스포츠 헬스 러닝 땀흡수 타올타입 바이퍼두건 | 지도칸 JIDOKAAN",
    "seoDescription": "땀 흡수 타올 두건 — 복싱·헬스·러닝",
    "seoKeywords": "복싱 두건 헤어밴드 겸용 스포츠 헬스 러닝 땀흡수 타올타입 바이퍼두건, 지도칸, JIDOKAAN",
    "options": {
      "skus": [
        {
          "key": "블랙",
          "stock": 47,
          "values": [
            "블랙"
          ],
          "enabled": true,
          "extraKrw": 0,
          "extraUsd": 0
        },
        {
          "key": "네이비",
          "stock": 218,
          "values": [
            "네이비"
          ],
          "enabled": true,
          "extraKrw": 0,
          "extraUsd": 0
        },
        {
          "key": "화이트",
          "stock": 19,
          "values": [
            "화이트"
          ],
          "enabled": true,
          "extraKrw": 0,
          "extraUsd": 0
        },
        {
          "key": "레드",
          "stock": 37,
          "values": [
            "레드"
          ],
          "enabled": true,
          "extraKrw": 0,
          "extraUsd": 0
        },
        {
          "key": "블루",
          "stock": 41,
          "values": [
            "블루"
          ],
          "enabled": true,
          "extraKrw": 0,
          "extraUsd": 0
        }
      ],
      "type": "single",
      "groups": [
        {
          "name": "컬러",
          "values": [
            "블랙",
            "네이비",
            "화이트",
            "레드",
            "블루"
          ]
        }
      ],
      "enabled": true
    }
  },
  {
    "id": "viper-band-ns",
    "sku": "10978501877",
    "name": {
      "en": "Viper non-slip headband (cooling / towel)",
      "ja": "バイパー頭巾 ノンスリップ（クーリング/タオル）",
      "ko": "헤드기어 돌아감 방지 바이퍼두건 논슬립 버젼 (쿨링/타올) 2가지"
    },
    "tagline": {
      "en": "Stops headgear from spinning — non-slip",
      "ja": "ヘッドギアの回転を防ぐノンスリップ",
      "ko": "헤드기어가 돌아가지 않게 — 논슬립"
    },
    "description": {
      "en": "Non-slip Viper wrap worn under headgear so it does not spin.\n\nCooling nylon (fast-dry) or towel cotton (absorbent).",
      "ja": "ヘッドギアの回転を防ぐノンスリップ頭巾。クーリング（ナイロン）とタオル（綿）。",
      "ko": "헤드기어가 돌아가는 것을 막아 주는 논슬립 바이퍼두건입니다.\n\n헤드기어 안쪽에 착용합니다. 실리콘 논슬립 처리가 되어 있습니다.\n\n■ 종류\n· 쿨링타입 (나일론) — 가볍고 빨리 마름\n· 타올타입 (면) — 땀 흡수\n\n헤드기어 스파링·시합 전에 착용하세요."
    },
    "category": "gear",
    "priceUsd": 1500,
    "priceKrw": 18900,
    "compareAtUsd": 2900,
    "compareAtKrw": 35900,
    "rating": 4.7,
    "reviews": 31,
    "colors": [
      "#111111",
      "#1e3a5f"
    ],
    "materials": {
      "en": "Cooling nylon / towel cotton",
      "ja": "クーリングナイロン / タオル",
      "ko": "나일론 쿨링 / 면 타올"
    },
    "weight": "55 g",
    "shipsFrom": {
      "en": "Seongsu, Seoul, KR",
      "ja": "ソウル聖水, KR",
      "ko": "서울 성수, KR"
    },
    "inStock": true,
    "featured": false,
    "plate": "#12151a",
    "accent": "#2563eb",
    "shape": "kit",
    "image": "/products/store/band-ns-main.jpg",
    "images": [
      "/products/store/band-ns-main.jpg",
      "/products/store/band-ns.jpg"
    ],
    "visible": true,
    "leadDays": 3,
    "createdAt": "2024-10-09T23:01:36.000Z",
    "majorId": "apparel",
    "sortOrder": 4,
    "seoTitle": "헤드기어 돌아감 방지 바이퍼두건 논슬립 버젼 (쿨링/타올) 2가지 | 지도칸 JIDOKAAN",
    "seoDescription": "헤드기어가 돌아가지 않게 — 논슬립",
    "seoKeywords": "헤드기어 돌아감 방지 바이퍼두건 논슬립 버젼 (쿨링/타올) 2가지, 지도칸, JIDOKAAN",
    "options": {
      "skus": [
        {
          "key": "바이퍼두건 쿨링타입(나일론)",
          "stock": 81,
          "values": [
            "바이퍼두건 쿨링타입(나일론)"
          ],
          "enabled": true,
          "extraKrw": 0,
          "extraUsd": 0
        },
        {
          "key": "바이퍼두건 타올타입(면)",
          "stock": 0,
          "values": [
            "바이퍼두건 타올타입(면)"
          ],
          "enabled": false,
          "extraKrw": 0,
          "extraUsd": 0
        }
      ],
      "type": "single",
      "groups": [
        {
          "name": "종류",
          "values": [
            "바이퍼두건 쿨링타입(나일론)",
            "바이퍼두건 타올타입(면)"
          ]
        }
      ],
      "enabled": true
    }
  },
  {
    "id": "lace-b1",
    "sku": "13452327906",
    "name": {
      "en": "Boxing shoe laces 220cm 8mm JDKL B1",
      "ja": "ボクシングシューレース 220cm 8mm JDKL B1",
      "ko": "복싱화끈 긴 운동화 신발 끈 길이 220cm 넓이 8mm JDKL B1"
    },
    "tagline": {
      "en": "Long flat laces for boxing boots — 220cm",
      "ja": "ボクシングシューズ用フラットレース 220cm",
      "ko": "복싱화·운동화용 플랫 끈 220cm"
    },
    "description": {
      "en": "Long flat laces for boxing boots and high-tops. 220cm × 8mm. Model JDKL B1.",
      "ja": "ボクシングシューズ・ハイカット用フラットレース。220cm×8mm。JDKL B1。",
      "ko": "복싱화·하이탑에 맞는 긴 플랫 신발끈입니다.\n\n길이 220cm, 넓이 8mm. 일반 운동화 끈보다 길어 복싱화 목까지 충분히 감습니다.\n\n■ 스펙\nJDKL B1 / 220cm × 8mm / 폴리에스터 플랫"
    },
    "category": "care",
    "priceUsd": 700,
    "priceKrw": 8500,
    "compareAtUsd": 1000,
    "compareAtKrw": 11900,
    "rating": 4.6,
    "reviews": 40,
    "colors": [
      "#111111"
    ],
    "materials": {
      "en": "Polyester flat lace",
      "ja": "ポリエステルフラットレース",
      "ko": "폴리에스터 플랫 레이스"
    },
    "weight": "30 g",
    "shipsFrom": {
      "en": "Seongsu, Seoul, KR",
      "ja": "ソウル聖水, KR",
      "ko": "서울 성수, KR"
    },
    "inStock": true,
    "featured": false,
    "plate": "#18181b",
    "accent": "#a1a1aa",
    "shape": "laces",
    "image": "/products/store/lace-b1-main.jpg",
    "images": [
      "/products/store/lace-b1-main.jpg"
    ],
    "visible": true,
    "leadDays": 2,
    "createdAt": "2026-04-25T22:13:11.000Z",
    "majorId": "etc",
    "sortOrder": 5,
    "seoTitle": "복싱화끈 긴 운동화 신발 끈 길이 220cm 넓이 8mm JDKL B1 | 지도칸 JIDOKAAN",
    "seoDescription": "복싱화·운동화용 플랫 끈 220cm",
    "seoKeywords": "복싱화끈 긴 운동화 신발 끈 길이 220cm 넓이 8mm JDKL B1, 지도칸, JIDOKAAN",
    "options": {
      "skus": [],
      "type": "combo",
      "groups": [],
      "enabled": false
    }
  },
  {
    "id": "lace-a1",
    "sku": "13137841097",
    "name": {
      "en": "Long round laces 5mm 200cm JDKL A1",
      "ja": "ロングラウンドレース 5mm 200cm JDKL A1",
      "ko": "길이가 긴 신발 끈 부츠 등산화용 5mm 200cm JDKL A1"
    },
    "tagline": {
      "en": "Round 5mm laces for boots — 200cm",
      "ja": "ブーツ・登山靴用ラウンドレース 200cm",
      "ko": "부츠·등산화용 둥근 끈 200cm"
    },
    "description": {
      "en": "Round 5mm × 200cm laces for boots and hiking shoes. Model JDKL A1.",
      "ja": "ブーツ・登山靴用ラウンドレース。5mm×200cm。JDKL A1。",
      "ko": "부츠·등산화·하이탑용 둥근 신발끈입니다.\n\n두께 5mm, 길이 200cm. 잘 풀리지 않는 라운드 타입입니다.\n\n■ 스펙\nJDKL A1 / 200cm × 5mm / 폴리에스터 라운드"
    },
    "category": "care",
    "priceUsd": 700,
    "priceKrw": 8500,
    "compareAtUsd": 1100,
    "compareAtKrw": 13500,
    "rating": 4.5,
    "reviews": 18,
    "colors": [
      "#111111"
    ],
    "materials": {
      "en": "Polyester round lace",
      "ja": "ポリエステルラウンドレース",
      "ko": "폴리에스터 라운드 레이스"
    },
    "weight": "28 g",
    "shipsFrom": {
      "en": "Seongsu, Seoul, KR",
      "ja": "ソウル聖水, KR",
      "ko": "서울 성수, KR"
    },
    "inStock": true,
    "featured": false,
    "plate": "#18181b",
    "accent": "#71717a",
    "shape": "laces",
    "image": "/products/store/lace-a1-main.png",
    "images": [
      "/products/store/lace-a1-main.png"
    ],
    "visible": true,
    "leadDays": 2,
    "createdAt": "2026-02-19T20:17:44.000Z",
    "majorId": "etc",
    "sortOrder": 6,
    "seoTitle": "길이가 긴 신발 끈 부츠 등산화용 5mm 200cm JDKL A1 | 지도칸 JIDOKAAN",
    "seoDescription": "부츠·등산화용 둥근 끈 200cm",
    "seoKeywords": "길이가 긴 신발 끈 부츠 등산화용 5mm 200cm JDKL A1, 지도칸, JIDOKAAN",
    "options": {
      "skus": [],
      "type": "combo",
      "groups": [],
      "enabled": false
    }
  },
  {
    "id": "lace-a2",
    "sku": "13137780144",
    "name": {
      "en": "Headgear / glove rope 6mm 200cm JDKL A2",
      "ja": "ヘッドギア・グローブ用ロープ 6mm 200cm JDKL A2",
      "ko": "헤드기어 교체용 끈 글러브 다용도 둥근 로프타입 6mm 200cm JDKL A2"
    },
    "tagline": {
      "en": "6mm rope for headgear and gloves",
      "ja": "ヘッドギア・グローブ交換用 6mmロープ",
      "ko": "헤드기어·글러브 교체용 6mm 로프"
    },
    "description": {
      "en": "6mm × 200cm rope for headgear replacement or gloves. Model JDKL A2.",
      "ja": "ヘッドギア交換・グローブ用ロープ。6mm×200cm。JDKL A2。",
      "ko": "헤드기어 교체용, 글러브에도 쓰는 둥근 로프 끈입니다.\n\n두께 6mm, 길이 200cm. 일반 신발끈보다 굵어 헤드기어 버클에 맞습니다.\n\n■ 스펙\nJDKL A2 / 200cm × 6mm / 폴리에스터 로프"
    },
    "category": "care",
    "priceUsd": 700,
    "priceKrw": 8500,
    "compareAtUsd": 1100,
    "compareAtKrw": 13500,
    "rating": 4.5,
    "reviews": 12,
    "colors": [
      "#111111"
    ],
    "materials": {
      "en": "Polyester rope",
      "ja": "ポリエステルロープ",
      "ko": "폴리에스터 로프"
    },
    "weight": "32 g",
    "shipsFrom": {
      "en": "Seongsu, Seoul, KR",
      "ja": "ソウル聖水, KR",
      "ko": "서울 성수, KR"
    },
    "inStock": true,
    "featured": false,
    "plate": "#18181b",
    "accent": "#52525b",
    "shape": "laces",
    "image": "/products/store/lace-a2-main.png",
    "images": [
      "/products/store/lace-a2-main.png"
    ],
    "visible": true,
    "leadDays": 2,
    "createdAt": "2026-02-19T20:03:45.000Z",
    "majorId": "etc",
    "sortOrder": 7,
    "seoTitle": "헤드기어 교체용 끈 글러브 다용도 둥근 로프타입 6mm 200cm JDKL A2 | 지도칸 JIDOKAAN",
    "seoDescription": "헤드기어·글러브 교체용 6mm 로프",
    "seoKeywords": "헤드기어 교체용 끈 글러브 다용도 둥근 로프타입 6mm 200cm JDKL A2, 지도칸, JIDOKAAN",
    "options": {
      "skus": [],
      "type": "combo",
      "groups": [],
      "enabled": false
    }
  }
] as Product[];

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
