type Copy = { standard: string; special: string; notice: string; contactLabel: string; specialTotalNote: string; domesticBasePrice: string };
type RegionalCopy = Omit<Copy, "contactLabel"> & { domesticNotice: string; domesticContactLabel: string; domesticTotalNote: string };
const copy: Record<string, RegionalCopy> = {
  "ko": {
    "standard": "기본 커스텀오더",
    "special": "스페셜오더",
    "notice": "스페셜오더는 반드시 Instagram DM으로 상담한 후 주문·결제를 진행해 주세요.",
    "domesticNotice": "스페셜오더는 반드시 네이버 톡톡 메시지 또는 고객센터로 별도 상담한 후 주문해 주세요.",
    "domesticContactLabel": "네이버 톡톡 · 고객센터",
    "specialTotalNote": "스페셜 구성 한 켤레 기준 · 관부가세 별도",
    "domesticTotalNote": "스페셜 구성 한 켤레 기준",
    "domesticBasePrice": "스페셜오더 기본가 {price}."
  },
  "en": {
    "standard": "Standard order",
    "special": "Special order",
    "notice": "For a special order, you must consult us through Instagram DM before ordering and paying.",
    "domesticNotice": "For a special order, you must contact us separately through Naver TalkTalk messages or customer service before ordering.",
    "domesticContactLabel": "Naver TalkTalk · Customer service",
    "specialTotalNote": "One special-order pair · Duties and taxes excluded",
    "domesticTotalNote": "One special-order pair",
    "domesticBasePrice": "Special-order base price: {price}."
  },
  "ja": {
    "standard": "通常注文",
    "special": "スペシャルオーダー",
    "notice": "スペシャルオーダーは、必ずInstagramのDMでご相談のうえ、ご注文・お支払いにお進みください。",
    "domesticNotice": "スペシャルオーダーは、必ずNaver TalkTalkのメッセージまたはカスタマーセンターで個別にご相談のうえ、ご注文ください。",
    "domesticContactLabel": "Naver TalkTalk · カスタマーセンター",
    "specialTotalNote": "スペシャルオーダー1足分 · 関税・税金別途",
    "domesticTotalNote": "スペシャルオーダー1足分",
    "domesticBasePrice": "スペシャルオーダー基本価格：{price}。"
  },
  "zh": {
    "standard": "标准订单",
    "special": "特别定制",
    "notice": "特别定制订单必须先通过 Instagram 私信与我们协商，再下单及付款。",
    "domesticNotice": "特别定制订单必须先通过 Naver TalkTalk 消息或客服与我们单独咨询，再下单。",
    "domesticContactLabel": "Naver TalkTalk · 客服",
    "specialTotalNote": "一双特别定制鞋 · 关税及税费另计",
    "domesticTotalNote": "一双特别定制鞋",
    "domesticBasePrice": "特别定制基础价格：{price}。"
  },
  "zh-Hant": {
    "standard": "標準訂單",
    "special": "特別訂製",
    "notice": "特別訂製訂單必須先透過 Instagram 私訊與我們商議，再下單及付款。",
    "domesticNotice": "特別訂製訂單必須先透過 Naver TalkTalk 訊息或客服與我們另行商議，再下單。",
    "domesticContactLabel": "Naver TalkTalk · 客服",
    "specialTotalNote": "一雙特別訂製鞋 · 關稅及稅項另計",
    "domesticTotalNote": "一雙特別訂製鞋",
    "domesticBasePrice": "特別訂製基本價格：{price}。"
  },
  "es": {
    "standard": "Pedido estándar",
    "special": "Pedido especial",
    "notice": "Para un pedido especial, debes consultarnos por mensaje directo de Instagram antes de hacer el pedido y pagar.",
    "domesticNotice": "Para un pedido especial, debes contactarnos por separado mediante mensajes de Naver TalkTalk o a través de atención al cliente antes de hacer el pedido.",
    "domesticContactLabel": "Naver TalkTalk · Atención al cliente",
    "specialTotalNote": "Un par de pedido especial · Aranceles e impuestos no incluidos",
    "domesticTotalNote": "Un par de pedido especial",
    "domesticBasePrice": "Precio base del pedido especial: {price}."
  },
  "fr": {
    "standard": "Commande standard",
    "special": "Commande spéciale",
    "notice": "Pour une commande spéciale, vous devez nous consulter par message privé sur Instagram avant de commander et de payer.",
    "domesticNotice": "Pour une commande spéciale, vous devez nous contacter séparément par message Naver TalkTalk ou auprès de notre service client avant de commander.",
    "domesticContactLabel": "Naver TalkTalk · Service client",
    "specialTotalNote": "Une paire sur commande spéciale · Droits et taxes non inclus",
    "domesticTotalNote": "Une paire sur commande spéciale",
    "domesticBasePrice": "Prix de base d’une commande spéciale : {price}."
  },
  "de": {
    "standard": "Standardbestellung",
    "special": "Sonderanfertigung",
    "notice": "Eine Sonderanfertigung müssen Sie vor der Bestellung und Zahlung per Instagram-Direktnachricht mit uns abstimmen.",
    "domesticNotice": "Bei einer Sonderanfertigung müssen Sie uns vor der Bestellung gesondert per Naver-TalkTalk-Nachricht oder über unseren Kundenservice kontaktieren.",
    "domesticContactLabel": "Naver TalkTalk · Kundenservice",
    "specialTotalNote": "Ein Paar als Sonderanfertigung · Zölle und Steuern nicht enthalten",
    "domesticTotalNote": "Ein Paar als Sonderanfertigung",
    "domesticBasePrice": "Grundpreis einer Sonderanfertigung: {price}."
  },
  "it": {
    "standard": "Ordine standard",
    "special": "Ordine speciale",
    "notice": "Per un ordine speciale, devi consultarti con noi tramite messaggio diretto su Instagram prima di ordinare e pagare.",
    "domesticNotice": "Per un ordine speciale, devi contattarci separatamente tramite messaggi Naver TalkTalk o il servizio clienti prima di ordinare.",
    "domesticContactLabel": "Naver TalkTalk · Servizio clienti",
    "specialTotalNote": "Un paio su ordine speciale · Dazi e imposte esclusi",
    "domesticTotalNote": "Un paio su ordine speciale",
    "domesticBasePrice": "Prezzo base dell’ordine speciale: {price}."
  },
  "pt": {
    "standard": "Pedido padrão",
    "special": "Pedido especial",
    "notice": "Para um pedido especial, é obrigatório falar conosco por mensagem direta no Instagram antes de fazer o pedido e pagar.",
    "domesticNotice": "Para um pedido especial, é obrigatório entrar em contato conosco separadamente por mensagens do Naver TalkTalk ou pelo atendimento ao cliente antes de fazer o pedido.",
    "domesticContactLabel": "Naver TalkTalk · Atendimento ao cliente",
    "specialTotalNote": "Um par de pedido especial · Tarifas e impostos não incluídos",
    "domesticTotalNote": "Um par de pedido especial",
    "domesticBasePrice": "Preço base do pedido especial: {price}."
  },
  "ru": {
    "standard": "Стандартный заказ",
    "special": "Специальный заказ",
    "notice": "Перед оформлением и оплатой специального заказа обязательно согласуйте его с нами в личных сообщениях Instagram.",
    "domesticNotice": "Перед оформлением специального заказа обязательно свяжитесь с нами отдельно через сообщения Naver TalkTalk или службу поддержки.",
    "domesticContactLabel": "Naver TalkTalk · Служба поддержки",
    "specialTotalNote": "Одна пара по специальному заказу · Пошлины и налоги не включены",
    "domesticTotalNote": "Одна пара по специальному заказу",
    "domesticBasePrice": "Базовая цена специального заказа: {price}."
  },
  "tr": {
    "standard": "Standart sipariş",
    "special": "Özel sipariş",
    "notice": "Özel sipariş vermeden ve ödeme yapmadan önce Instagram DM üzerinden bizimle görüşüp siparişi netleştirmeniz gerekir.",
    "domesticNotice": "Özel sipariş vermeden önce Naver TalkTalk mesajları veya müşteri hizmetleri aracılığıyla bizimle ayrıca görüşmeniz gerekir.",
    "domesticContactLabel": "Naver TalkTalk · Müşteri hizmetleri",
    "specialTotalNote": "Bir çift özel sipariş · Gümrük vergileri ve diğer vergiler hariç",
    "domesticTotalNote": "Bir çift özel sipariş",
    "domesticBasePrice": "Özel sipariş başlangıç fiyatı: {price}."
  },
  "uz": {
    "standard": "Standart buyurtma",
    "special": "Maxsus buyurtma",
    "notice": "Maxsus buyurtma berish va to‘lov qilishdan oldin Instagram shaxsiy xabarlari orqali biz bilan maslahatlashishingiz shart.",
    "domesticNotice": "Maxsus buyurtma berishdan oldin Naver TalkTalk xabarlari yoki mijozlarga xizmat ko‘rsatish bo‘limi orqali biz bilan alohida maslahatlashishingiz shart.",
    "domesticContactLabel": "Naver TalkTalk · Mijozlarga xizmat",
    "specialTotalNote": "Bir juft maxsus buyurtma · Bojlar va soliqlar kiritilmagan",
    "domesticTotalNote": "Bir juft maxsus buyurtma",
    "domesticBasePrice": "Maxsus buyurtmaning boshlang‘ich narxi: {price}."
  },
  "th": {
    "standard": "คำสั่งซื้อปกติ",
    "special": "คำสั่งซื้อพิเศษ",
    "notice": "สำหรับคำสั่งซื้อพิเศษ ต้องปรึกษาเราทางข้อความส่วนตัวใน Instagram ให้เรียบร้อยก่อนสั่งซื้อและชำระเงิน",
    "domesticNotice": "สำหรับคำสั่งซื้อพิเศษ ต้องติดต่อปรึกษาเราเป็นการเฉพาะทางข้อความ Naver TalkTalk หรือฝ่ายบริการลูกค้าก่อนสั่งซื้อ",
    "domesticContactLabel": "Naver TalkTalk · ฝ่ายบริการลูกค้า",
    "specialTotalNote": "รองเท้าสั่งทำพิเศษหนึ่งคู่ · ไม่รวมอากรและภาษี",
    "domesticTotalNote": "รองเท้าสั่งทำพิเศษหนึ่งคู่",
    "domesticBasePrice": "ราคาเริ่มต้นสำหรับคำสั่งซื้อพิเศษ: {price}"
  },
  "hi": {
    "standard": "सामान्य ऑर्डर",
    "special": "विशेष ऑर्डर",
    "notice": "विशेष ऑर्डर देने और भुगतान करने से पहले Instagram DM पर हमसे सलाह करना अनिवार्य है।",
    "domesticNotice": "विशेष ऑर्डर देने से पहले Naver TalkTalk संदेश या ग्राहक सेवा के माध्यम से हमसे अलग से संपर्क करना अनिवार्य है।",
    "domesticContactLabel": "Naver TalkTalk · ग्राहक सेवा",
    "specialTotalNote": "विशेष ऑर्डर की एक जोड़ी · आयात शुल्क और कर शामिल नहीं",
    "domesticTotalNote": "विशेष ऑर्डर की एक जोड़ी",
    "domesticBasePrice": "विशेष ऑर्डर की शुरुआती कीमत: {price}।"
  },
  "tl": {
    "standard": "Karaniwang order",
    "special": "Espesyal na order",
    "notice": "Para sa espesyal na order, kailangan munang makipag-usap sa amin sa Instagram DM bago umorder at magbayad.",
    "domesticNotice": "Para sa espesyal na order, kailangan munang makipag-ugnayan sa amin nang hiwalay sa pamamagitan ng mga mensahe sa Naver TalkTalk o customer service bago umorder.",
    "domesticContactLabel": "Naver TalkTalk · Customer service",
    "specialTotalNote": "Isang pares na espesyal na order · Hindi kasama ang mga buwis at singil sa pag-import",
    "domesticTotalNote": "Isang pares na espesyal na order",
    "domesticBasePrice": "Batayang presyo ng espesyal na order: {price}."
  }
};

/** Delivery destination selects the consultation channel, independently of display language. */
export function specialOrderCopy(locale: string, shippingCountry = ""): Copy {
  const value = copy[locale] ?? copy.en;
  const domestic = shippingCountry.trim().toUpperCase() === "KR";
  return {
    standard: value.standard,
    special: value.special,
    notice: domestic ? value.domesticNotice : value.notice,
    contactLabel: domestic ? value.domesticContactLabel : "Instagram DM",
    specialTotalNote: domestic ? value.domesticTotalNote : value.specialTotalNote,
    domesticBasePrice: value.domesticBasePrice,
  };
}

export function specialOrderContactHref(locale: string, shippingCountry = ""): string {
  return shippingCountry.trim().toUpperCase() === "KR"
    ? `/contact?lang=${encodeURIComponent(locale)}`
    : "https://ig.me/m/jidokaan";
}
