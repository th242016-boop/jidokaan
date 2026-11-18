const keys = ["details", "size", "quantity", "address", "subtotal", "discount", "shipping", "total", "parcel", "tracking", "noPreview", "manual", "unavailable", "verifyTitle", "verifyHelp", "preview", "preparing", "awaiting_dropoff", "in_transit", "delivered", "customs_delay", "delivery_failed", "returned"] as const;
const rows: Record<string, string[]> = {
  en: ["Confirmed order details","Size","Quantity","Delivery address","Products","Discount","Shipping","Total","Parcel","Tracking number","No saved design image is available for this order.","Delivery confirmed by the store","Tracking is temporarily unavailable","Check your order","Enter your order number and checkout email in order lookup to verify its current status.","Example only: no order, payment, email or DM was created.","Preparing shipment","Awaiting post-office drop-off","In transit","Delivered","Customs delay","Delivery attempt failed","Returned"],
  ko: ["확정 주문 상세","사이즈","수량","배송지","상품금액","할인","배송비","총액","소포","우편물번호","이 주문에 저장된 디자인 이미지가 없습니다.","판매자가 배송완료 확인","배송조회 일시 불가","주문 확인이 필요합니다","주문 조회에서 주문번호와 주문 시 이메일을 입력해 현재 상태를 확인해 주세요.","예시 화면: 실제 주문·결제·이메일·DM은 생성되지 않았습니다.","발송 준비","우체국 제출 대기","배송 중","배송 완료","통관 지연","배달 실패","반송"],
  ja: ["確定した注文の詳細","サイズ","数量","配送先","商品代金","割引","送料","合計","荷物","追跡番号","この注文には保存されたデザイン画像がありません。","店舗による配達完了確認","追跡情報を一時的に取得できません","注文をご確認ください","注文照会で注文番号と注文時のメールアドレスを入力し、現在の状況をご確認ください。","表示例です。実際の注文・決済・メール・DMは作成されません。","発送準備中","郵便局への持ち込み待ち","配送中","配達完了","通関の遅延","配達できませんでした","返送"],
  zh: ["已确认的订单详情","尺码","数量","收货地址","商品金额","优惠","运费","总额","包裹","邮件追踪号码","此订单没有已保存的设计图片。","商家已确认送达","暂时无法查询物流","请核实您的订单","请在订单查询中输入订单号和下单时的邮箱，核实当前状态。","仅为示例：未创建真实订单、付款、邮件或私信。","准备发货","等待送交邮局","运输中","已送达","清关延误","投递失败","退回"],
  "zh-Hant": ["已確認的訂單詳情","尺碼","數量","收貨地址","商品金額","優惠","運費","總額","包裹","郵件追蹤號碼","此訂單沒有已保存的設計圖片。","商家已確認送達","暫時無法查詢物流","請覈實您的訂單","請在訂單查詢中輸入訂單號和下單時的電郵地址，覈實當前狀態。","僅為示例：未創建真實訂單、付款、郵件或私訊。","準備發貨","等待送交郵局","運輸中","已送達","清關延誤","投遞失敗","退回"],
  es: ["Detalles del pedido confirmado","Talla","Cantidad","Dirección de entrega","Productos","Descuento","Envío","Total","Paquete","Número de seguimiento","Este pedido no tiene una imagen del diseño guardada.","Entrega confirmada por la tienda","Seguimiento temporalmente no disponible","Comprueba tu pedido","Introduce el número de pedido y el correo usado al comprar en la consulta de pedidos para verificar su estado.","Solo ejemplo: no se ha creado ningún pedido, pago, correo ni DM.","Preparando el envío","Pendiente de entrega en Correos","En tránsito","Entregado","Retraso en aduanas","Intento de entrega fallido","Devuelto"],
  fr: ["Détails de la commande confirmée","Pointure","Quantité","Adresse de livraison","Produits","Réduction","Livraison","Total","Colis","Numéro de suivi","Aucune image du modèle n’est enregistrée pour cette commande.","Livraison confirmée par la boutique","Suivi temporairement indisponible","Vérifiez votre commande","Saisissez le numéro de commande et l’adresse e-mail utilisée à l’achat dans le suivi des commandes pour vérifier son état.","Exemple uniquement : aucune commande, paiement, e-mail ou message privé n’a été créé.","Préparation de l’envoi","En attente de dépôt à la poste","En transit","Livré","Retard en douane","Échec de livraison","Retourné"],
  de: ["Bestätigte Bestelldetails","Größe","Menge","Lieferadresse","Artikel","Rabatt","Versand","Gesamt","Paket","Sendungsnummer","Für diese Bestellung ist kein Designbild gespeichert.","Zustellung vom Shop bestätigt","Sendungsverfolgung vorübergehend nicht verfügbar","Bestellung prüfen","Gib in der Bestellabfrage die Bestellnummer und die beim Kauf verwendete E-Mail-Adresse ein, um den Status zu prüfen.","Nur ein Beispiel: Es wurden keine Bestellung, Zahlung, E-Mail oder DM erstellt.","Versand wird vorbereitet","Abgabe bei der Post ausstehend","Unterwegs","Zugestellt","Verzögerung beim Zoll","Zustellversuch fehlgeschlagen","Zurückgesandt"],
  it: ["Dettagli dell’ordine confermato","Taglia","Quantità","Indirizzo di consegna","Prodotti","Sconto","Spedizione","Totale","Pacco","Numero di tracciamento","Questo ordine non ha un’immagine del design salvata.","Consegna confermata dal negozio","Tracciamento temporaneamente non disponibile","Verifica il tuo ordine","Inserisci il numero d’ordine e l’e-mail usata all’acquisto nella ricerca ordini per verificarne lo stato.","Solo esempio: non sono stati creati ordini, pagamenti, e-mail o messaggi privati.","Preparazione della spedizione","In attesa di consegna all’ufficio postale","In transito","Consegnato","Ritardo doganale","Tentativo di consegna fallito","Restituito"],
  pt: ["Detalhes do pedido confirmado","Tamanho","Quantidade","Endereço de entrega","Produtos","Desconto","Frete","Total","Pacote","Código de rastreamento","Não há uma imagem do design salva para este pedido.","Entrega confirmada pela loja","Rastreamento temporariamente indisponível","Confira seu pedido","Informe o número do pedido e o e-mail usado na compra na consulta de pedidos para verificar o status.","Apenas exemplo: nenhum pedido, pagamento, e-mail ou mensagem privada foi criado.","Preparando o envio","Aguardando entrega aos Correios","Em trânsito","Entregue","Atraso na alfândega","Tentativa de entrega sem sucesso","Devolvido"],
  ru: ["Подтверждённые данные заказа","Размер","Количество","Адрес доставки","Товары","Скидка","Доставка","Итого","Посылка","Номер отслеживания","Для этого заказа нет сохранённого изображения дизайна.","Доставка подтверждена магазином","Отслеживание временно недоступно","Проверьте заказ","Введите номер заказа и адрес электронной почты, использованный при покупке, в разделе проверки заказа.","Только пример: заказ, оплата, электронное письмо и личное сообщение не создавались.","Подготовка к отправке","Ожидает передачи в почтовое отделение","В пути","Доставлено","Задержка на таможне","Неудачная попытка доставки","Возвращено"],
  tr: ["Onaylanan sipariş ayrıntıları","Numara","Adet","Teslimat adresi","Ürünler","İndirim","Kargo","Toplam","Paket","Takip numarası","Bu sipariş için kaydedilmiş tasarım görseli yok.","Teslimat mağaza tarafından onaylandı","Takip geçici olarak kullanılamıyor","Siparişinizi kontrol edin","Güncel durumu doğrulamak için sipariş sorgulamada sipariş numaranızı ve alışverişte kullandığınız e-postayı girin.","Yalnızca örnek: sipariş, ödeme, e-posta veya DM oluşturulmadı.","Gönderime hazırlanıyor","Postaneye teslim bekleniyor","Yolda","Teslim edildi","Gümrük gecikmesi","Teslimat denemesi başarısız","İade edildi"],
  uz: ["Tasdiqlangan buyurtma tafsilotlari","O‘lcham","Miqdor","Yetkazib berish manzili","Mahsulotlar","Chegirma","Yetkazib berish","Jami","Jo‘natma","Kuzatuv raqami","Bu buyurtma uchun saqlangan dizayn rasmi yo‘q.","Yetkazilganini do‘kon tasdiqladi","Kuzatuv vaqtincha mavjud emas","Buyurtmangizni tekshiring","Joriy holatni tekshirish uchun buyurtma qidiruviga buyurtma raqami va xaridda ishlatilgan e-pochta manzilini kiriting.","Faqat namuna: haqiqiy buyurtma, to‘lov, e-pochta yoki DM yaratilmagan.","Jo‘natishga tayyorlanmoqda","Pochta bo‘limiga topshirish kutilmoqda","Yo‘lda","Yetkazildi","Bojxonada kechikish","Yetkazish urinishi muvaffaqiyatsiz","Qaytarildi"],
  th: ["รายละเอียดคำสั่งซื้อที่ยืนยันแล้ว","ขนาด","จำนวน","ที่อยู่จัดส่ง","สินค้า","ส่วนลด","ค่าจัดส่ง","ยอดรวม","พัสดุ","หมายเลขติดตาม","คำสั่งซื้อนี้ไม่มีภาพดีไซน์ที่บันทึกไว้","ร้านค้ายืนยันการจัดส่งสำเร็จ","ไม่สามารถติดตามพัสดุได้ชั่วคราว","ตรวจสอบคำสั่งซื้อของคุณ","กรอกหมายเลขคำสั่งซื้อและอีเมลที่ใช้สั่งซื้อในหน้าตรวจสอบคำสั่งซื้อเพื่อดูสถานะปัจจุบัน","ตัวอย่างเท่านั้น: ไม่มีการสร้างคำสั่งซื้อ การชำระเงิน อีเมล หรือ DM จริง","กำลังเตรียมจัดส่ง","รอนำส่งที่ทำการไปรษณีย์","อยู่ระหว่างขนส่ง","จัดส่งสำเร็จ","ล่าช้าที่ศุลกากร","จัดส่งไม่สำเร็จ","ส่งคืน"],
  hi: ["पुष्ट ऑर्डर का विवरण","साइज़","मात्रा","डिलीवरी का पता","उत्पाद","छूट","शिपिंग","कुल","पार्सल","ट्रैकिंग नंबर","इस ऑर्डर के लिए कोई डिज़ाइन चित्र सहेजा नहीं गया है।","स्टोर ने डिलीवरी की पुष्टि की","ट्रैकिंग अस्थायी रूप से उपलब्ध नहीं है","अपना ऑर्डर जाँचें","वर्तमान स्थिति की पुष्टि के लिए ऑर्डर खोज में ऑर्डर नंबर और खरीदते समय इस्तेमाल किया गया ईमेल दर्ज करें।","केवल उदाहरण: कोई वास्तविक ऑर्डर, भुगतान, ईमेल या DM नहीं बनाया गया।","शिपमेंट की तैयारी","डाकघर में जमा करने की प्रतीक्षा","रास्ते में","डिलीवर हो गया","सीमा शुल्क में देरी","डिलीवरी का प्रयास विफल","वापस भेजा गया"],
  tl: ["Mga detalye ng kumpirmadong order","Sukat","Dami","Address ng paghahatid","Mga produkto","Diskuwento","Shipping","Kabuuan","Pakete","Tracking number","Walang naka-save na larawan ng disenyo para sa order na ito.","Kinumpirma ng tindahan ang paghahatid","Pansamantalang hindi available ang tracking","Tingnan ang iyong order","Ilagay ang order number at email na ginamit sa pagbili sa paghahanap ng order upang makumpirma ang kasalukuyang status.","Halimbawa lamang: walang aktuwal na order, bayad, email o DM na ginawa.","Inihahanda ang pagpapadala","Naghihintay na dalhin sa post office","Nasa biyahe","Naihatid na","Naantala sa customs","Hindi matagumpay ang paghahatid","Ibinalik"],
};
const extra: Record<string, [string, string]> = {
  "en": [
    "Preview order confirmation",
    "Information accepted at checkout · original text"
  ],
  "ko": [
    "테스트 주문 완료 화면 보기",
    "주문 당시 동의한 안내 · 원문"
  ],
  "ja": [
    "注文完了画面をプレビュー",
    "注文時に同意したご案内・原文"
  ],
  "zh": [
    "预览订单确认页面",
    "下单时同意的说明 · 原文"
  ],
  "zh-Hant": [
    "預覽訂單確認頁面",
    "下單時同意的說明 · 原文"
  ],
  "es": [
    "Vista previa de la confirmación",
    "Información aceptada al comprar · texto original"
  ],
  "fr": [
    "Aperçu de la confirmation",
    "Informations acceptées lors de la commande · texte original"
  ],
  "de": [
    "Bestellbestätigung ansehen",
    "Bei der Bestellung akzeptierte Hinweise · Originaltext"
  ],
  "it": [
    "Anteprima della conferma",
    "Informazioni accettate al momento dell’ordine · testo originale"
  ],
  "pt": [
    "Prévia da confirmação do pedido",
    "Informações aceitas na compra · texto original"
  ],
  "ru": [
    "Предпросмотр подтверждения заказа",
    "Условия, принятые при заказе · исходный текст"
  ],
  "tr": [
    "Sipariş onayını önizle",
    "Siparişte kabul edilen bilgiler · özgün metin"
  ],
  "uz": [
    "Buyurtma tasdig‘ini oldindan ko‘rish",
    "Buyurtmada qabul qilingan ma’lumotlar · asl matn"
  ],
  "th": [
    "ดูตัวอย่างการยืนยันคำสั่งซื้อ",
    "ข้อมูลที่ยอมรับเมื่อสั่งซื้อ · ข้อความต้นฉบับ"
  ],
  "hi": [
    "ऑर्डर की पुष्टि का पूर्वावलोकन",
    "ऑर्डर करते समय स्वीकार की गई जानकारी · मूल पाठ"
  ],
  "tl": [
    "I-preview ang kumpirmasyon ng order",
    "Impormasyong tinanggap sa pag-order · orihinal na teksto"
  ]
};

export function customerOrderDetailCopy(locale: string) {
  const row = rows[locale] ?? rows.en;
  const fit: Record<string, [string, string]> = {
    en: ["Men", "Women"], ko: ["남성", "여성"], ja: ["メンズ", "レディース"], zh: ["男款", "女款"],
    "zh-Hant": ["男款", "女款"],
    es: ["Hombre", "Mujer"], fr: ["Homme", "Femme"], de: ["Herren", "Damen"], it: ["Uomo", "Donna"],
    pt: ["Masculino", "Feminino"], ru: ["Мужской", "Женский"], tr: ["Erkek", "Kadın"], uz: ["Erkaklar", "Ayollar"],
    th: ["ผู้ชาย", "ผู้หญิง"], hi: ["पुरुष", "महिला"], tl: ["Panlalaki", "Pambabae"],
  };
  const [men, women] = fit[locale] ?? fit.en;
  const [previewConfirm, originalTerms] = extra[locale] ?? extra.en;
  return { ...Object.fromEntries(keys.map((key, i) => [key, row[i]])) as Record<typeof keys[number], string>, men, women, previewConfirm, originalTerms };
}
