/** Merchant policy for orders delivered outside Korea. Never infer destination from language. */
export type InternationalOrderPolicy = {
  title: string;
  returns: string;
  cancellation: string;
  paypalFee: string;
  acknowledgement: string;
  statutoryRights: string;
};

export const INTERNATIONAL_ORDER_POLICY_VERSION = "2026-11-16-overseas-12h-5pct";

const COPY: Record<string, Omit<InternationalOrderPolicy, "acknowledgement">> = {
  ko: {
    title: "해외 주문 교환·반품·취소 안내",
    returns: "해외 주문은 교환·반품 및 이에 따른 환불이 불가합니다. 주문 취소는 아래 취소 정책에 따릅니다.",
    cancellation: "취소는 주문 후 12시간 이내에 요청한 경우에만 가능합니다.",
    paypalFee: "PayPal 결제를 취소하여 환불할 경우, 당사의 환불 정책에 따라 총결제금액의 5%를 공제한 금액을 환불합니다.",
    statutoryRights: "이 안내는 관련 법령에서 의무적으로 보장하는 소비자 권리를 제한하지 않습니다.",
  },
  en: {
    title: "International exchanges, returns and cancellations",
    returns: "International orders cannot be exchanged or returned for a refund. Order cancellations are subject to the policy below.",
    cancellation: "Cancellation is available only if requested within 12 hours of placing the order.",
    paypalFee: "Under our refund policy, refunds for cancelled PayPal payments are subject to a deduction of 5% of the total amount paid.",
    statutoryRights: "This policy does not limit any mandatory consumer rights under applicable law.",
  },
  ja: {
    title: "海外注文の交換・返品・キャンセルについて",
    returns: "海外注文の交換・返品および返品に伴う返金はお受けできません。注文のキャンセルには、以下の規定が適用されます。",
    cancellation: "キャンセルはご注文から12時間以内にご連絡いただいた場合に限り可能です。",
    paypalFee: "PayPal決済をキャンセルして返金する場合、当店の返金規定に基づき、お支払い総額の5%を差し引いて返金します。",
    statutoryRights: "この案内は、適用法令により保障される消費者の権利を制限するものではありません。",
  },
  zh: {
    title: "海外订单退换货及取消说明",
    returns: "海外订单不支持换货、退货及因退货产生的退款。取消订单须遵守以下取消政策。",
    cancellation: "仅可在下单后12小时内申请取消。",
    paypalFee: "取消PayPal付款并申请退款时，根据本店退款政策，将扣除实际支付总金额的5%后退款。",
    statutoryRights: "本说明不限制适用法律强制保障的消费者权利。",
  },
  "zh-Hant": {
    title: "海外訂單退換貨及取消須知",
    returns: "海外訂單不接受換貨、退貨及因退貨而作出的退款。取消訂單須遵守以下取消政策。",
    cancellation: "只可在下單後12小時內申請取消。",
    paypalFee: "取消PayPal付款並申請退款時，根據本店退款政策，將扣除實際支付總金額的5%後退款。",
    statutoryRights: "本須知不限制適用法律強制保障的消費者權利。",
  },
  es: {
    title: "Cambios, devoluciones y cancelaciones internacionales",
    returns: "No se aceptan cambios ni devoluciones con reembolso de pedidos internacionales. Las cancelaciones se rigen por la política siguiente.",
    cancellation: "Solo se puede cancelar si se solicita dentro de las 12 horas siguientes a realizar el pedido.",
    paypalFee: "Según nuestra política de reembolsos, al reembolsar un pago cancelado de PayPal se descontará el 5% del importe total pagado.",
    statutoryRights: "Esta política no limita los derechos obligatorios del consumidor establecidos por la legislación aplicable.",
  },
  fr: {
    title: "Échanges, retours et annulations des commandes internationales",
    returns: "Les commandes internationales ne peuvent être ni échangées ni retournées pour remboursement. Les annulations sont soumises aux conditions ci-dessous.",
    cancellation: "Une annulation n’est possible que si elle est demandée dans les 12 heures suivant la commande.",
    paypalFee: "Conformément à notre politique de remboursement, une retenue de 5% du montant total payé s’applique au remboursement d’un paiement PayPal annulé.",
    statutoryRights: "Cette politique ne limite pas les droits impératifs des consommateurs prévus par la législation applicable.",
  },
  de: {
    title: "Umtausch, Rückgabe und Stornierung internationaler Bestellungen",
    returns: "Internationale Bestellungen können weder umgetauscht noch gegen Erstattung zurückgegeben werden. Für Stornierungen gelten die folgenden Bedingungen.",
    cancellation: "Eine Stornierung ist nur möglich, wenn sie innerhalb von 12 Stunden nach der Bestellung angefragt wird.",
    paypalFee: "Gemäß unserer Erstattungsregelung werden bei der Erstattung einer stornierten PayPal-Zahlung 5% des insgesamt gezahlten Betrags abgezogen.",
    statutoryRights: "Zwingende Verbraucherrechte nach geltendem Recht bleiben von dieser Regelung unberührt.",
  },
  it: {
    title: "Cambi, resi e annullamenti degli ordini internazionali",
    returns: "Non si accettano cambi o resi con rimborso per gli ordini internazionali. Gli annullamenti sono soggetti alle condizioni riportate di seguito.",
    cancellation: "L’annullamento è possibile solo se richiesto entro 12 ore dall’ordine.",
    paypalFee: "In base alla nostra politica di rimborso, in caso di annullamento di un pagamento PayPal viene trattenuto il 5% dell’importo totale pagato.",
    statutoryRights: "Questa politica non limita i diritti inderogabili dei consumatori previsti dalla legge applicabile.",
  },
  pt: {
    title: "Trocas, devoluções e cancelamentos internacionais",
    returns: "Não aceitamos trocas nem devoluções com reembolso de pedidos internacionais. Os cancelamentos seguem a política abaixo.",
    cancellation: "O cancelamento só é possível se solicitado em até 12 horas após o pedido.",
    paypalFee: "De acordo com nossa política de reembolso, será descontado 5% do valor total pago no reembolso de um pagamento PayPal cancelado.",
    statutoryRights: "Esta política não limita os direitos obrigatórios do consumidor previstos na legislação aplicável.",
  },
  ru: {
    title: "Обмен, возврат и отмена международных заказов",
    returns: "Международные заказы нельзя обменять или вернуть с возмещением стоимости. Отмена заказа регулируется условиями ниже.",
    cancellation: "Отмена возможна только при обращении в течение 12 часов после оформления заказа.",
    paypalFee: "Согласно нашей политике возврата средств, при возврате отменённого платежа PayPal удерживается 5% от общей уплаченной суммы.",
    statutoryRights: "Эти условия не ограничивают обязательные права потребителей, предусмотренные применимым законодательством.",
  },
  tr: {
    title: "Uluslararası siparişlerde değişim, iade ve iptal",
    returns: "Uluslararası siparişlerde değişim veya ücret iadesi için ürün iadesi kabul edilmez. Sipariş iptalleri aşağıdaki koşullara tabidir.",
    cancellation: "İptal, yalnızca sipariş verildikten sonraki 12 saat içinde talep edilirse mümkündür.",
    paypalFee: "İade politikamız uyarınca, iptal edilen PayPal ödemelerinin iadesinde toplam ödenen tutarın %5’i kesilir.",
    statutoryRights: "Bu politika, geçerli mevzuatın zorunlu olarak tanıdığı tüketici haklarını sınırlamaz.",
  },
  uz: {
    title: "Xalqaro buyurtmalarni almashtirish, qaytarish va bekor qilish",
    returns: "Xalqaro buyurtmalarni almashtirish yoki pulni qaytarib olish uchun mahsulotni qaytarish mumkin emas. Buyurtmani bekor qilishga quyidagi shartlar qo‘llanadi.",
    cancellation: "Bekor qilish faqat buyurtma berilgandan keyin 12 soat ichida so‘ralganda mumkin.",
    paypalFee: "Pulni qaytarish siyosatimizga ko‘ra, bekor qilingan PayPal to‘lovi qaytarilganda jami to‘langan summaning 5% qismi ushlab qolinadi.",
    statutoryRights: "Bu siyosat amaldagi qonun bilan majburiy kafolatlangan iste’molchi huquqlarini cheklamaydi.",
  },
  th: {
    title: "การเปลี่ยน คืน และยกเลิกคำสั่งซื้อระหว่างประเทศ",
    returns: "คำสั่งซื้อระหว่างประเทศไม่สามารถเปลี่ยนสินค้าหรือคืนสินค้าเพื่อขอเงินคืนได้ การยกเลิกคำสั่งซื้อเป็นไปตามนโยบายด้านล่าง",
    cancellation: "สามารถยกเลิกได้เฉพาะเมื่อแจ้งภายใน 12 ชั่วโมงหลังสั่งซื้อ",
    paypalFee: "ตามนโยบายการคืนเงินของร้าน หากยกเลิกและคืนเงินสำหรับการชำระผ่าน PayPal จะหัก 5% ของยอดที่ชำระทั้งหมดก่อนคืนเงิน",
    statutoryRights: "นโยบายนี้ไม่จำกัดสิทธิผู้บริโภคที่กฎหมายที่ใช้บังคับรับรองไว้โดยบังคับ",
  },
  hi: {
    title: "अंतरराष्ट्रीय ऑर्डर का एक्सचेंज, रिटर्न और रद्द करना",
    returns: "अंतरराष्ट्रीय ऑर्डर में एक्सचेंज या रिफ़ंड के लिए सामान वापस करना स्वीकार नहीं है। ऑर्डर रद्द करने पर नीचे दी गई नीति लागू होती है।",
    cancellation: "ऑर्डर देने के 12 घंटे के भीतर अनुरोध करने पर ही उसे रद्द किया जा सकता है।",
    paypalFee: "हमारी रिफ़ंड नीति के अनुसार, रद्द किए गए PayPal भुगतान का रिफ़ंड देते समय कुल भुगतान राशि का 5% काटा जाता है।",
    statutoryRights: "यह नीति लागू कानून द्वारा अनिवार्य रूप से दिए गए उपभोक्ता अधिकारों को सीमित नहीं करती।",
  },
  tl: {
    title: "Pagpapalit, pagbabalik at pagkansela ng internasyonal na order",
    returns: "Hindi tumatanggap ng pagpapalit o pagbabalik ng produkto para sa refund ng mga internasyonal na order. Ang pagkansela ay saklaw ng patakaran sa ibaba.",
    cancellation: "Maaari lamang magkansela kung hihilingin sa loob ng 12 oras mula sa pag-order.",
    paypalFee: "Ayon sa aming patakaran sa refund, ibabawas ang 5% ng kabuuang halagang binayaran sa refund ng kinanselang pagbabayad sa PayPal.",
    statutoryRights: "Hindi nililimitahan ng patakarang ito ang mga karapatan ng mamimili na sapilitang pinoprotektahan ng naaangkop na batas.",
  },
};

export function internationalOrderPolicy(locale: string): InternationalOrderPolicy {
  const copy = COPY[locale] ?? COPY.en;
  return { ...copy, acknowledgement: [copy.returns, copy.cancellation, copy.paypalFee].join(" ") };
}

export function isInternationalDestination(country: string | null | undefined): boolean {
  const destination = country?.trim().toUpperCase();
  return Boolean(destination && destination !== "KR");
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[c]!);

export function internationalOrderPolicyHtml(locale: string): string {
  const copy = internationalOrderPolicy(locale);
  return [copy.returns, copy.cancellation, copy.paypalFee].map(text => `<p>${escapeHtml(text)}</p>`).join("");
}
