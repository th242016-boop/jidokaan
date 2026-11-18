import { orderPaymentMoney } from "./order-money";
import { checkoutCopy } from "./checkout-copy";
import type { StoreOrder } from "./order-types";

export type OrderEmailConfig = { apiKey: string; from: string; replyTo?: string; startAt: string };
export function orderEmailConfig(env: Record<string, string | undefined>): OrderEmailConfig | null {
  if (
    env.VITE_REVIEW_PREVIEW === "true" ||
    env.REVIEW_PREVIEW === "true" ||
    env.ORDER_EMAIL_ENABLED !== "true"
  )
    return null;
  const apiKey = env.RESEND_API_KEY?.trim(),
    from = env.ORDER_EMAIL_FROM?.trim();
  const startAt = env.ORDER_EMAIL_START_AT?.trim();
  // An explicit timezone prevents a server-local timezone from changing rollout scope.
  if (
    !apiKey ||
    !from ||
    !startAt ||
    !/(Z|[+-]\d{2}:\d{2})$/.test(startAt) ||
    !Number.isFinite(Date.parse(startAt))
  )
    return null;
  if (/[\r\n]/.test(from) || !from.includes("@")) return null;
  const replyTo = env.ORDER_EMAIL_REPLY_TO?.trim();
  if (replyTo && (/[\r\n]/.test(replyTo) || !replyTo.includes("@"))) return null;
  return { apiKey, from, replyTo, startAt: new Date(startAt).toISOString() };
}

export function canConfirmPaidOrder(order: StoreOrder): boolean {
  if (!["paid", "ready", "shipped", "done", "confirmed"].includes(order.status)) return false;
  if (order.claim === "cancel") return false;
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email || "") ||
    /@login\.jidokaan\.com$/i.test(order.email)
  )
    return false;
  if (
    !order.items?.length ||
    !order.id ||
    !["USD", "JPY"].includes(order.currency) ||
    !order.country ||
    order.country === "KR"
  )
    return false;
  try {
    const { total } = orderPaymentMoney(order);
    if (!Number.isFinite(total) || total <= 0) return false;
  } catch { return false; }
  return (
    order.pay === "transfer" || (order.pay === "paypal" && Boolean(order.paypalCaptureId?.trim()))
  );
}

// Transactional content only: no promotions, tracking pixels or public order links.
// Checkout legal/production notices are shared with the customer's checkout locale.
const labels: Record<
  string,
  readonly [string, string, string, string, string, string, string, string]
> = {
  ko: [
    "결제가 확인되었습니다",
    "주문번호",
    "결제금액",
    "배송비 포함 · 관세/세금 별도",
    "회원가입 없이 아래 주문조회에서 주문번호와 주문할 때 사용한 이메일을 입력해 확인할 수 있습니다.",
    "주문 조회",
    "Instagram 상담을 원하시면 주문번호를 복사한 뒤 메시지를 보내주세요. 담당자가 확인 후 안내해드립니다.",
    "Instagram으로 문의",
  ],
  en: [
    "Payment confirmed",
    "Order number",
    "Amount paid",
    "Shipping included · duties/taxes excluded",
    "No account is needed. Open order lookup below and enter your order number and the email used at checkout.",
    "Look up your order",
    "For help on Instagram, copy your order number and send us a message. Our team will check it and reply.",
    "Contact us on Instagram",
  ],
  es: [
    "Pago confirmado",
    "Número de pedido",
    "Importe pagado",
    "Envío incluido · aranceles e impuestos no incluidos",
    "No necesitas una cuenta. Abre la consulta de pedidos e introduce el número de pedido y el correo electrónico utilizado al comprar.",
    "Consultar pedido",
    "Para recibir ayuda por Instagram, copia tu número de pedido y envíanos un mensaje. Nuestro equipo lo revisará y responderá.",
    "Contactar por Instagram",
  ],
  th: [
    "ยืนยันการชำระเงินแล้ว",
    "หมายเลขคำสั่งซื้อ",
    "ยอดชำระแล้ว",
    "รวมค่าจัดส่ง · ไม่รวมอากรและภาษี",
    "ไม่ต้องสมัครสมาชิก เปิดหน้าตรวจสอบคำสั่งซื้อด้านล่าง แล้วกรอกหมายเลขคำสั่งซื้อและอีเมลที่ใช้ตอนสั่งซื้อ",
    "ตรวจสอบคำสั่งซื้อ",
    "หากต้องการสอบถามทาง Instagram ให้คัดลอกหมายเลขคำสั่งซื้อแล้วส่งข้อความถึงเรา ทีมงานจะตรวจสอบและตอบกลับ",
    "ติดต่อทาง Instagram",
  ],
  fr: [
    "Paiement confirmé",
    "Numéro de commande",
    "Montant payé",
    "Livraison incluse · droits et taxes exclus",
    "Aucun compte n’est nécessaire. Ouvrez le suivi de commande et saisissez le numéro de commande ainsi que l’adresse e-mail utilisée lors de l’achat.",
    "Consulter la commande",
    "Pour nous contacter sur Instagram, copiez votre numéro de commande et envoyez-nous un message. Notre équipe le vérifiera et vous répondra.",
    "Contacter sur Instagram",
  ],
  de: [
    "Zahlung bestätigt",
    "Bestellnummer",
    "Bezahlter Betrag",
    "Versand enthalten · Zoll und Steuern nicht enthalten",
    "Du brauchst kein Konto. Öffne die Bestellabfrage und gib deine Bestellnummer sowie die beim Kauf verwendete E-Mail-Adresse ein.",
    "Bestellung aufrufen",
    "Für Hilfe auf Instagram kopiere deine Bestellnummer und sende uns eine Nachricht. Unser Team prüft sie und antwortet dir.",
    "Kontakt auf Instagram",
  ],
  ja: [
    "お支払いを確認しました",
    "注文番号",
    "お支払い金額",
    "送料込み・関税や税金は別途",
    "会員登録は不要です。下記の注文照会ページで注文番号とご注文時のメールアドレスを入力してください。",
    "注文を確認",
    "Instagramでのお問い合わせは、注文番号をコピーしてメッセージをお送りください。担当者が確認後にご案内します。",
    "Instagramで問い合わせ",
  ],
  zh: [
    "付款已确认",
    "订单编号",
    "已付金额",
    "含运费・不含关税和税费",
    "无需注册账号。请打开下方订单查询页面，输入订单编号及下单时使用的电子邮箱。",
    "查询订单",
    "如需通过Instagram咨询，请复制订单编号并向我们发送消息。工作人员核实后会回复您。",
    "通过Instagram联系",
  ],
  "zh-Hant": [
    "付款已確認",
    "訂單編號",
    "已付金額",
    "含運費・不含關稅和稅費",
    "無需註冊帳號。請打開下方訂單查詢頁面，輸入訂單編號及下單時使用的電郵地址。",
    "查詢訂單",
    "如需通過Instagram諮詢，請複製訂單編號並向我們發送消息。工作人員覈實後會回復您。",
    "通過Instagram聯絡",
  ],
  ru: [
    "Оплата подтверждена",
    "Номер заказа",
    "Оплаченная сумма",
    "Доставка включена · пошлины и налоги не включены",
    "Регистрация не нужна. Откройте страницу проверки заказа и введите номер заказа и адрес электронной почты, указанный при оформлении.",
    "Проверить заказ",
    "Для связи в Instagram скопируйте номер заказа и отправьте нам сообщение. Наша команда проверит его и ответит.",
    "Связаться в Instagram",
  ],
  it: [
    "Pagamento confermato",
    "Numero d’ordine",
    "Importo pagato",
    "Spedizione inclusa · dazi e imposte esclusi",
    "Non serve un account. Apri la pagina di consultazione e inserisci il numero d’ordine e l’indirizzo e-mail utilizzato per l’acquisto.",
    "Consulta l’ordine",
    "Per assistenza su Instagram, copia il numero d’ordine e inviaci un messaggio. Il nostro team verificherà e risponderà.",
    "Contattaci su Instagram",
  ],
  pt: [
    "Pagamento confirmado",
    "Número do pedido",
    "Valor pago",
    "Frete incluído · impostos e taxas aduaneiras não incluídos",
    "Não é necessário ter uma conta. Abra a consulta de pedidos e informe o número do pedido e o e-mail usado na compra.",
    "Consultar pedido",
    "Para atendimento pelo Instagram, copie o número do pedido e envie-nos uma mensagem. Nossa equipe verificará e responderá.",
    "Falar pelo Instagram",
  ],
  tr: [
    "Ödeme onaylandı",
    "Sipariş numarası",
    "Ödenen tutar",
    "Kargo dahil · gümrük vergileri ve diğer vergiler hariç",
    "Hesap açmanız gerekmez. Sipariş sorgulama sayfasını açıp sipariş numaranızı ve alışverişte kullandığınız e-posta adresini girin.",
    "Siparişi sorgula",
    "Instagram üzerinden yardım için sipariş numaranızı kopyalayıp bize mesaj gönderin. Ekibimiz kontrol edip yanıtlayacaktır.",
    "Instagram’dan iletişime geç",
  ],
  uz: [
    "To‘lov tasdiqlandi",
    "Buyurtma raqami",
    "To‘langan summa",
    "Yetkazib berish kiritilgan · boj va soliqlar kiritilmagan",
    "Hisob ochish shart emas. Buyurtmani tekshirish sahifasini ochib, buyurtma raqami va xaridda ishlatilgan elektron pochta manzilini kiriting.",
    "Buyurtmani tekshirish",
    "Instagram orqali yordam olish uchun buyurtma raqamini nusxalab, bizga xabar yuboring. Jamoamiz tekshirib, javob beradi.",
    "Instagram orqali bog‘lanish",
  ],
  hi: [
    "भुगतान की पुष्टि हो गई",
    "ऑर्डर नंबर",
    "भुगतान की गई राशि",
    "शिपिंग शामिल · सीमा शुल्क और कर अलग",
    "खाता बनाना ज़रूरी नहीं है। नीचे ऑर्डर खोजने का पेज खोलें और अपना ऑर्डर नंबर तथा खरीदते समय इस्तेमाल किया गया ईमेल दर्ज करें।",
    "ऑर्डर देखें",
    "Instagram पर सहायता के लिए अपना ऑर्डर नंबर कॉपी करके हमें संदेश भेजें। हमारी टीम जाँच करके जवाब देगी।",
    "Instagram पर संपर्क करें",
  ],
  tl: [
    "Nakumpirma ang bayad",
    "Numero ng order",
    "Halagang nabayaran",
    "Kasama ang pagpapadala · hindi kasama ang mga buwis at customs fee",
    "Hindi kailangang gumawa ng account. Buksan ang pagtingin sa order at ilagay ang numero ng order at email na ginamit sa pagbili.",
    "Tingnan ang order",
    "Para sa tulong sa Instagram, kopyahin ang numero ng order at magpadala sa amin ng mensahe. Susuriin ito ng aming team at sasagot.",
    "Makipag-ugnayan sa Instagram",
  ],
};

export type OrderEmailPayload = {
  from: string;
  to: string[];
  reply_to?: string;
  subject: string;
  text: string;
  html: string;
};
const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
export function orderEmailPayload(order: StoreOrder, config: OrderEmailConfig): OrderEmailPayload {
  const locale = Object.hasOwn(labels, order.checkoutLocale || "") ? order.checkoutLocale! : "en";
  const [subject, number, amount, included, lookup, lookupLabel, instagram, instagramLabel] =
    labels[locale];
  const terms = checkoutCopy(locale);
  const money = orderPaymentMoney(order);
  const total = `${money.currency} ${money.currency === "USD" ? money.total.toFixed(2) : money.total.toLocaleString("en-US")}`;
  const lookupUrl = `https://jidokaan.com/orders?lang=${locale}`;
  const instagramUrl = "https://ig.me/m/jidokaan";
  const madeToOrder = order.items.some(
    (item) => ["drone-custom", "drone-mid"].includes(item.productId) || Boolean(item.partNames),
  );
  const lines = [
    subject,
    `${number}: ${order.id}`,
    `${amount}: ${total}`,
    included,
    ...(madeToOrder ? [terms.production] : []),
    ...(order.acknowledgedTerms?.cancellationPolicy ? [order.acknowledgedTerms.cancellationPolicy] : []),
    order.country === "US" ? terms.usDuty : terms.duty,
    lookup,
    `${lookupLabel}: ${lookupUrl}`,
    instagram,
    `${instagramLabel}: ${instagramUrl}`,
  ];
  return {
    from: config.from,
    to: [order.email],
    ...(config.replyTo ? { reply_to: config.replyTo } : {}),
    subject: `JIDOKAAN · ${subject} · ${order.id}`,
    text: lines.join("\n\n"),
    html: `<div lang="${locale}" style="font-family:Arial,sans-serif;max-width:600px;margin:auto;line-height:1.7;color:#222"><h1 style="font-size:24px">${escapeHtml(subject)}</h1>${lines
      .slice(1)
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join(
        "",
      )}<p><a href="${lookupUrl}">${escapeHtml(lookupLabel)}</a></p><p><a href="${instagramUrl}">${escapeHtml(instagramLabel)}</a></p></div>`,
  };
}
