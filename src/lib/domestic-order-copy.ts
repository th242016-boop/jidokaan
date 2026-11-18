/** Shared domestic handoff: customer keeps the design; our team initiates TalkTalk contact. */
const COPY: Record<string, [string, string]> = {
  "ko": [
    "한국 배송은 네이버 스마트스토어에서 주문하고, 시뮬레이터로 만든 디자인 이미지를 캡처해 보관해 주세요.",
    "주문 확인 후 지도칸에서 네이버톡톡 메시지로 따로 연락드립니다."
  ],
  "en": [
    "For delivery within South Korea, order through our Naver Smart Store and keep a screenshot of your simulator design.",
    "After checking your order, our team will contact you separately through Naver TalkTalk."
  ],
  "ja": [
    "韓国国内への配送はNaverスマートストアでご注文いただき、シミュレーターで作成したデザインのスクリーンショットを保管してください。",
    "ご注文を確認後、担当者からNaver TalkTalkのメッセージで別途ご連絡します。"
  ],
  "es": [
    "Para entregas en Corea del Sur, pide en nuestra tienda Naver Smart Store y guarda una captura de pantalla de tu diseño en el simulador.",
    "Tras revisar tu pedido, nuestro equipo te contactará por separado mediante Naver TalkTalk."
  ],
  "th": [
    "สำหรับการจัดส่งภายในเกาหลีใต้ ให้สั่งซื้อผ่าน Naver Smart Store ของเรา และเก็บภาพหน้าจอแบบที่สร้างในเครื่องมือออกแบบไว้",
    "หลังตรวจสอบคำสั่งซื้อ ทีมงานจะติดต่อคุณแยกต่างหากผ่านข้อความ Naver TalkTalk"
  ],
  "fr": [
    "Pour une livraison en Corée du Sud, commandez sur notre Naver Smart Store et conservez une capture d’écran de votre design dans le simulateur.",
    "Après vérification de votre commande, notre équipe vous contactera séparément par message sur Naver TalkTalk."
  ],
  "de": [
    "Für Lieferungen innerhalb Südkoreas bestelle in unserem Naver Smart Store und bewahre einen Screenshot deines Designs aus dem Konfigurator auf.",
    "Nach Prüfung deiner Bestellung meldet sich unser Team separat über Naver TalkTalk bei dir."
  ],
  "ru": [
    "Для доставки по Южной Корее оформите заказ в нашем Naver Smart Store и сохраните снимок экрана с дизайном из конструктора.",
    "После проверки заказа наша команда отдельно свяжется с вами через Naver TalkTalk."
  ],
  "it": [
    "Per consegne in Corea del Sud, ordina nel nostro Naver Smart Store e conserva uno screenshot del design creato nel simulatore.",
    "Dopo aver verificato l’ordine, il nostro team ti contatterà separatamente tramite Naver TalkTalk."
  ],
  "pt": [
    "Para entregas na Coreia do Sul, faça o pedido em nossa Naver Smart Store e guarde uma captura de tela do seu design no simulador.",
    "Após verificar seu pedido, nossa equipe entrará em contato separadamente pelo Naver TalkTalk."
  ],
  "tr": [
    "Güney Kore içi teslimatlar için Naver Smart Store mağazamızdan sipariş verin ve simülatörde oluşturduğunuz tasarımın ekran görüntüsünü saklayın.",
    "Siparişinizi kontrol ettikten sonra ekibimiz sizinle Naver TalkTalk üzerinden ayrıca iletişime geçecektir."
  ],
  "uz": [
    "Janubiy Koreya ichidagi yetkazib berish uchun Naver Smart Store do‘konimizda buyurtma bering va simulyatorda yaratgan dizayningizning ekran rasmini saqlang.",
    "Buyurtmangizni tekshirgach, jamoamiz Naver TalkTalk orqali siz bilan alohida bog‘lanadi."
  ],
  "zh": [
    "配送至韩国境内的订单，请在我们的Naver智能商店下单，并保存模拟器设计的截图。",
    "确认订单后，工作人员会另行通过Naver TalkTalk消息联系您。"
  ],
  "zh-Hant": [
    "配送至韓國境內的訂單，請在我們的Naver智能商店下單，並保留模擬器設計的螢幕截圖。",
    "確認訂單後，工作人員會另行透過Naver TalkTalk訊息聯絡您。"
  ],
  "hi": [
    "दक्षिण कोरिया के भीतर डिलीवरी के लिए हमारे Naver Smart Store पर ऑर्डर करें और सिम्युलेटर में बनाए डिज़ाइन का स्क्रीनशॉट रखें।",
    "ऑर्डर की जाँच के बाद हमारी टीम Naver TalkTalk संदेश के ज़रिए आपसे अलग से संपर्क करेगी।"
  ],
  "tl": [
    "Para sa delivery sa loob ng South Korea, umorder sa aming Naver Smart Store at itago ang screenshot ng disenyo mo sa simulator.",
    "Pagkatapos suriin ang order, hiwalay kang kokontakin ng aming team sa Naver TalkTalk."
  ],
  "ar": [
    "للتوصيل داخل كوريا الجنوبية، اطلب من متجرنا على Naver Smart Store واحتفظ بلقطة شاشة لتصميمك في المحاكي.",
    "بعد مراجعة طلبك، سيتواصل معك فريقنا بشكل منفصل عبر رسائل Naver TalkTalk."
  ]
};

export function domesticOrderCopy(locale: string) {
  const [order, followup] = COPY[locale] ?? COPY.en;
  return {order, followup, message: `${order} ${followup}`};
}

