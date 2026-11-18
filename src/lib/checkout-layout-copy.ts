import type { Locale } from "./i18n";

type CheckoutLayoutCopy = {
  detailsStep: string;
  reviewStep: string;
  continue: string;
  edit: string;
  help: string;
};

export const CHECKOUT_LAYOUT_COPY: Record<Locale, CheckoutLayoutCopy> = {
  ko: { detailsStep: "연락처·배송지", reviewStep: "주문 확인·결제", continue: "주문 확인으로 계속", edit: "연락처·배송지 수정", help: "입력 도움말" },
  en: { detailsStep: "Contact & delivery", reviewStep: "Review & pay", continue: "Continue to order review", edit: "Edit contact or delivery details", help: "Help with these details" },
  ja: { detailsStep: "連絡先・配送先", reviewStep: "注文確認・お支払い", continue: "注文内容の確認へ", edit: "連絡先・配送先を変更", help: "入力について" },
  zh: { detailsStep: "联系方式与收货地址", reviewStep: "确认订单并付款", continue: "继续确认订单", edit: "修改联系方式或地址", help: "填写帮助" },
  "zh-Hant": { detailsStep: "聯絡資料及收貨地址", reviewStep: "確認訂單及付款", continue: "繼續確認訂單", edit: "更改聯絡資料或地址", help: "填寫說明" },
  es: { detailsStep: "Contacto y entrega", reviewStep: "Revisar y pagar", continue: "Continuar a la revisión del pedido", edit: "Editar contacto o dirección", help: "Ayuda para completar los datos" },
  fr: { detailsStep: "Coordonnées et livraison", reviewStep: "Vérification et paiement", continue: "Vérifier la commande", edit: "Modifier les coordonnées ou l’adresse", help: "Aide à la saisie" },
  de: { detailsStep: "Kontakt und Lieferung", reviewStep: "Prüfen und bezahlen", continue: "Weiter zur Bestellübersicht", edit: "Kontakt- oder Lieferdaten ändern", help: "Hilfe beim Ausfüllen" },
  it: { detailsStep: "Contatti e consegna", reviewStep: "Riepilogo e pagamento", continue: "Continua al riepilogo dell’ordine", edit: "Modifica contatti o indirizzo", help: "Aiuto per la compilazione" },
  pt: { detailsStep: "Contato e entrega", reviewStep: "Revisão e pagamento", continue: "Continuar para revisar o pedido", edit: "Editar contato ou endereço", help: "Ajuda para preencher os dados" },
  ru: { detailsStep: "Контакты и доставка", reviewStep: "Проверка и оплата", continue: "Перейти к проверке заказа", edit: "Изменить контакты или адрес", help: "Помощь с заполнением" },
  tr: { detailsStep: "İletişim ve teslimat", reviewStep: "Kontrol ve ödeme", continue: "Siparişi kontrol etmeye devam et", edit: "İletişim veya adres bilgilerini düzenle", help: "Bilgi girişinde yardım" },
  th: { detailsStep: "ข้อมูลติดต่อและจัดส่ง", reviewStep: "ตรวจสอบและชำระเงิน", continue: "ไปตรวจสอบคำสั่งซื้อ", edit: "แก้ไขข้อมูลติดต่อหรือที่อยู่", help: "คำแนะนำการกรอกข้อมูล" },
  uz: { detailsStep: "Aloqa va yetkazib berish", reviewStep: "Tekshirish va to‘lov", continue: "Buyurtmani tekshirishga o‘tish", edit: "Aloqa yoki manzilni o‘zgartirish", help: "Ma’lumotlarni kiritish bo‘yicha yordam" },
  hi: { detailsStep: "संपर्क और डिलीवरी", reviewStep: "समीक्षा और भुगतान", continue: "ऑर्डर की समीक्षा के लिए आगे बढ़ें", edit: "संपर्क या पते में बदलाव करें", help: "जानकारी भरने में सहायता" },
  tl: { detailsStep: "Contact at delivery", reviewStep: "Suriin at magbayad", continue: "Magpatuloy sa pagsusuri ng order", edit: "Baguhin ang contact o address", help: "Tulong sa paglalagay ng detalye" },
  ar: { detailsStep: "التواصل والتوصيل", reviewStep: "المراجعة والدفع", continue: "المتابعة لمراجعة الطلب", edit: "تعديل بيانات التواصل أو العنوان", help: "مساعدة في تعبئة البيانات" },
};

export function checkoutLayoutCopy(locale: string): CheckoutLayoutCopy {
  return CHECKOUT_LAYOUT_COPY[locale as Locale] ?? CHECKOUT_LAYOUT_COPY.en;
}
