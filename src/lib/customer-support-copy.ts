/** Customer support and service links. Opening hours are in Korea Standard Time. */
export type CustomerSupportCopy = {
  title: string;
  email: string;
  phone: string;
  hours: string;
  closedLabel: string;
  hoursValue: string;
  closedValue: string;
  nav: {
    shop: string;
    orders: string;
    shipping: string;
    account: string;
    brand: string;
    contact: string;
    terms: string;
    privacy: string;
    admin: string;
  };
};

export const CUSTOMER_SUPPORT_COPY: Record<string, CustomerSupportCopy> = {
  ko: {
    title: "고객 상담", email: "상담 이메일", phone: "상담전화", hours: "상담시간",
    closedLabel: "토요일 및 공휴일", hoursValue: "월–금 10:00–17:00 (한국시간, UTC+9)", closedValue: "상담불가",
    nav: { shop: "샵", orders: "주문조회", shipping: "배송 안내", account: "내 계정", brand: "브랜드", contact: "문의", terms: "이용약관", privacy: "개인정보처리방침", admin: "관리자" },
  },
  en: {
    title: "Customer support", email: "Email", phone: "Phone", hours: "Support hours",
    closedLabel: "Saturdays & public holidays", hoursValue: "Mon–Fri, 10:00–17:00 (Korea time, UTC+9)", closedValue: "Closed",
    nav: { shop: "Shop", orders: "Order lookup", shipping: "Shipping information", account: "My account", brand: "Brand", contact: "Contact", terms: "Terms of use", privacy: "Privacy policy", admin: "Admin" },
  },
  ja: {
    title: "お問い合わせ", email: "メール", phone: "電話", hours: "受付時間",
    closedLabel: "土曜日・祝日", hoursValue: "月–金 10:00–17:00（韓国時間、UTC+9）", closedValue: "休業",
    nav: { shop: "ショップ", orders: "注文の確認", shipping: "配送について", account: "マイアカウント", brand: "ブランド", contact: "お問い合わせ", terms: "利用規約", privacy: "プライバシーポリシー", admin: "管理者" },
  },
  es: {
    title: "Atención al cliente", email: "Correo electrónico", phone: "Teléfono", hours: "Horario de atención",
    closedLabel: "Sábados y festivos", hoursValue: "Lun–vie, 10:00–17:00 (hora de Corea, UTC+9)", closedValue: "Cerrado",
    nav: { shop: "Tienda", orders: "Consultar pedido", shipping: "Información de envío", account: "Mi cuenta", brand: "Marca", contact: "Contacto", terms: "Condiciones de uso", privacy: "Política de privacidad", admin: "Administración" },
  },
  th: {
    title: "ฝ่ายบริการลูกค้า", email: "อีเมล", phone: "โทรศัพท์", hours: "เวลาทำการ",
    closedLabel: "วันเสาร์และวันหยุดนักขัตฤกษ์", hoursValue: "จันทร์–ศุกร์ 10:00–17:00 น. (เวลาเกาหลี UTC+9)", closedValue: "ปิดทำการ",
    nav: { shop: "ร้านค้า", orders: "ตรวจสอบคำสั่งซื้อ", shipping: "ข้อมูลการจัดส่ง", account: "บัญชีของฉัน", brand: "แบรนด์", contact: "ติดต่อเรา", terms: "ข้อกำหนดการใช้งาน", privacy: "นโยบายความเป็นส่วนตัว", admin: "ผู้ดูแลระบบ" },
  },
  fr: {
    title: "Service client", email: "E-mail", phone: "Téléphone", hours: "Horaires du service client",
    closedLabel: "Samedis et jours fériés", hoursValue: "Lun–ven, 10 h–17 h (heure de Corée, UTC+9)", closedValue: "Fermé",
    nav: { shop: "Boutique", orders: "Consulter une commande", shipping: "Informations de livraison", account: "Mon compte", brand: "La marque", contact: "Contact", terms: "Conditions d’utilisation", privacy: "Politique de confidentialité", admin: "Administration" },
  },
  de: {
    title: "Kundenservice", email: "E-Mail", phone: "Telefon", hours: "Servicezeiten",
    closedLabel: "Samstags und an Feiertagen", hoursValue: "Mo–Fr, 10:00–17:00 Uhr (koreanische Zeit, UTC+9)", closedValue: "Geschlossen",
    nav: { shop: "Shop", orders: "Bestellung abrufen", shipping: "Versandinformationen", account: "Mein Konto", brand: "Marke", contact: "Kontakt", terms: "Nutzungsbedingungen", privacy: "Datenschutzerklärung", admin: "Verwaltung" },
  },
  ru: {
    title: "Поддержка клиентов", email: "Электронная почта", phone: "Телефон", hours: "Часы работы",
    closedLabel: "Суббота и праздничные дни", hoursValue: "Пн–пт, 10:00–17:00 (время Кореи, UTC+9)", closedValue: "Закрыто",
    nav: { shop: "Магазин", orders: "Проверить заказ", shipping: "Информация о доставке", account: "Мой аккаунт", brand: "О бренде", contact: "Связаться с нами", terms: "Условия использования", privacy: "Политика конфиденциальности", admin: "Администратор" },
  },
  it: {
    title: "Assistenza clienti", email: "E-mail", phone: "Telefono", hours: "Orari di assistenza",
    closedLabel: "Sabato e giorni festivi", hoursValue: "Lun–ven, 10:00–17:00 (ora della Corea, UTC+9)", closedValue: "Chiuso",
    nav: { shop: "Negozio", orders: "Consulta un ordine", shipping: "Informazioni sulla spedizione", account: "Il mio account", brand: "Il marchio", contact: "Contatti", terms: "Condizioni d’uso", privacy: "Informativa sulla privacy", admin: "Amministrazione" },
  },
  pt: {
    title: "Atendimento ao cliente", email: "E-mail", phone: "Telefone", hours: "Horário de atendimento",
    closedLabel: "Sábados e feriados", hoursValue: "Seg–sex, 10:00–17:00 (horário da Coreia, UTC+9)", closedValue: "Fechado",
    nav: { shop: "Loja", orders: "Consultar pedido", shipping: "Informações de envio", account: "Minha conta", brand: "A marca", contact: "Contato", terms: "Termos de uso", privacy: "Política de privacidade", admin: "Administração" },
  },
  tr: {
    title: "Müşteri hizmetleri", email: "E-posta", phone: "Telefon", hours: "Çalışma saatleri",
    closedLabel: "Cumartesi ve resmî tatiller", hoursValue: "Pzt–Cum, 10:00–17:00 (Kore saati, UTC+9)", closedValue: "Kapalı",
    nav: { shop: "Mağaza", orders: "Sipariş sorgulama", shipping: "Kargo bilgileri", account: "Hesabım", brand: "Marka", contact: "İletişim", terms: "Kullanım koşulları", privacy: "Gizlilik politikası", admin: "Yönetici" },
  },
  uz: {
    title: "Mijozlarni qo‘llab-quvvatlash", email: "Elektron pochta", phone: "Telefon", hours: "Ish vaqti",
    closedLabel: "Shanba va rasmiy bayramlar", hoursValue: "Dushanba–juma, 10:00–17:00 (Koreya vaqti, UTC+9)", closedValue: "Yopiq",
    nav: { shop: "Do‘kon", orders: "Buyurtmani tekshirish", shipping: "Yetkazib berish haqida", account: "Mening hisobim", brand: "Brend", contact: "Bog‘lanish", terms: "Foydalanish shartlari", privacy: "Maxfiylik siyosati", admin: "Administrator" },
  },
  zh: {
    title: "客户服务", email: "电子邮箱", phone: "电话", hours: "服务时间",
    closedLabel: "周六及公共假日", hoursValue: "周一至周五 10:00–17:00（韩国时间，UTC+9）", closedValue: "暂停服务",
    nav: { shop: "商店", orders: "查询订单", shipping: "配送说明", account: "我的账户", brand: "品牌", contact: "联系我们", terms: "使用条款", privacy: "隐私政策", admin: "管理后台" },
  },
  "zh-Hant": {
    title: "客戶服務", email: "電郵地址", phone: "電話", hours: "服務時間",
    closedLabel: "週六及公共假日", hoursValue: "週一至週五 10:00–17:00（韓國時間，UTC+9）", closedValue: "暫停服務",
    nav: { shop: "商店", orders: "查詢訂單", shipping: "配送說明", account: "我的帳戶", brand: "品牌", contact: "聯絡我們", terms: "使用條款", privacy: "隱私政策", admin: "管理後台" },
  },
  hi: {
    title: "ग्राहक सहायता", email: "ईमेल", phone: "फ़ोन", hours: "सहायता का समय",
    closedLabel: "शनिवार और सार्वजनिक अवकाश", hoursValue: "सोम–शुक्र, 10:00–17:00 (कोरिया का समय, UTC+9)", closedValue: "बंद",
    nav: { shop: "दुकान", orders: "ऑर्डर देखें", shipping: "डिलीवरी की जानकारी", account: "मेरा खाता", brand: "ब्रांड", contact: "संपर्क करें", terms: "उपयोग की शर्तें", privacy: "गोपनीयता नीति", admin: "व्यवस्थापक" },
  },
  tl: {
    title: "Serbisyo sa customer", email: "Email", phone: "Telepono", hours: "Oras ng serbisyo",
    closedLabel: "Sabado at mga pampublikong holiday", hoursValue: "Lun–Biy, 10:00–17:00 (oras sa Korea, UTC+9)", closedValue: "Sarado",
    nav: { shop: "Tindahan", orders: "Tingnan ang order", shipping: "Impormasyon sa pagpapadala", account: "Aking account", brand: "Brand", contact: "Makipag-ugnayan", terms: "Mga tuntunin sa paggamit", privacy: "Patakaran sa privacy", admin: "Admin" },
  },
};

export function supportCopy(locale: string): CustomerSupportCopy {
  return Object.hasOwn(CUSTOMER_SUPPORT_COPY, locale)
    ? CUSTOMER_SUPPORT_COPY[locale]
    : CUSTOMER_SUPPORT_COPY.en;
}
