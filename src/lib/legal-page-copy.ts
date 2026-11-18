import type { Locale } from "./i18n";
import type { InfoRow } from "./site-defaults";

type LegalCopy = {
  domesticTerms: string;
  leatherTerms: string;
  privacyOrders: string;
  privacyAnalytics: string;
  seller: string;
  company: string;
  support: string;
  labels: readonly string[];
  hours: string;
  unavailable: string;
};

// Translate the existing notices without changing commercial or data policies.
// Legal names, registration identifiers and administrator-entered values remain intact.
const LEGAL_COPY: Record<Exclude<Locale, "ar">, LegalCopy> = {
  ko: {
    domesticTerms: "주문제작 상품은 제작 전 취소가 가능합니다. 국내 창 벌어짐·마모는 무료 수선·보강이며, 창 교체는 65,000원입니다.",
    leatherTerms: "가죽 갑피는 무겁고 이염·물빠짐이 있을 수 있습니다. 결제·배송 조건은 결제 화면과 배송 페이지를 따릅니다.",
    privacyOrders: "주문·상담에 필요한 이름, 연락처, 배송지, 결제 정보를 수집합니다. 인스타그램 또는 이메일 중 선택한 연락 방법으로 주문·제작 사양·배송 안내를 드립니다. 배송·CS 외 목적으로 넘기지 않습니다.",
    privacyAnalytics: "회원관리와 사이트 이용 분석을 위해 가입방법, 가입 시 기기 유형(PC·모바일·태블릿), 방문 페이지와 유입경로, 전달된 캠페인·검색어 정보를 기록합니다. 유입정보를 가입 과정에 연결하는 자사 쿠키는 최대 24시간 유지됩니다. 검색엔진이 제공하지 않는 검색어는 수집할 수 없으며, 이 분석을 위해 기기 지문을 만들지는 않습니다.",
    seller: "상호", company: "사업자 정보", support: "상담",
    labels: ["상호명", "대표자명", "사업장 주소", "대표전화", "사업자 등록번호", "통신판매업 신고번호", "상담 이메일", "상담전화", "CS운영시간", "토요일 및 공휴일"],
    hours: "오전 10시~오후 5시 (월~금)", unavailable: "상담불가",
  },
  en: {
    domesticTerms: "Made-to-order items can be cancelled before production starts. In Korea, repairs and reinforcement for sole separation or wear are free; sole replacement costs ₩65,000.",
    leatherTerms: "Leather uppers are heavy and may transfer dye or lose colour when wet. Payment and shipping conditions are shown at checkout and on the shipping page.",
    privacyOrders: "We collect the name, contact, shipping and payment details needed to fulfil orders and provide support. We use your chosen contact method, Instagram or email, to discuss your order, design specifications and shipping. We do not share these details for purposes other than shipping and customer support.",
    privacyAnalytics: "For member management and site analytics, we record the signup method, device type at signup (desktop, mobile or tablet), pages visited, referral source and any campaign or search terms provided to us. A first-party attribution cookie links this information to signup and lasts for up to 24 hours. We cannot collect search terms withheld by search engines, and we do not create device fingerprints for this analytics feature.",
    seller: "Seller", company: "Company information", support: "Customer support",
    labels: ["Business name", "Representative", "Business address", "Telephone", "Business registration number", "Online sales registration number", "Support email", "Support telephone", "Support hours", "Saturdays and public holidays"],
    hours: "10 am–5 pm, Monday–Friday", unavailable: "Support unavailable",
  },
  ja: {
    domesticTerms: "受注生産品は製作開始前であればキャンセルできます。韓国内では、靴底の剥がれや摩耗の修理・補強は無料です。靴底の交換は65,000ウォンです。",
    leatherTerms: "レザーのアッパーは重く、水に濡れると色移りや色落ちが起こる場合があります。お支払い・配送条件は、注文手続き画面と配送案内ページをご確認ください。",
    privacyOrders: "ご注文への対応とお問い合わせ対応に必要な氏名、連絡先、配送先、お支払い情報を収集します。ご注文内容、製作仕様、配送については、お客様が選択したInstagramまたはメールでご連絡します。配送・カスタマーサポート以外の目的でこれらの情報を第三者に提供することはありません。",
    privacyAnalytics: "会員管理とサイト利用状況の分析のため、登録方法、登録時の端末の種類（パソコン・スマートフォン・タブレット）、閲覧ページ、流入元、提供されたキャンペーン・検索キーワードの情報を記録します。流入情報を会員登録に関連付けるファーストパーティCookieの有効期間は最大24時間です。検索エンジンから提供されない検索キーワードは収集できません。また、この分析のために端末のフィンガープリントを作成することはありません。",
    seller: "販売事業者", company: "事業者情報", support: "お問い合わせ",
    labels: ["事業者名", "代表者", "所在地", "電話番号", "事業者登録番号", "通信販売業届出番号", "お問い合わせメール", "お問い合わせ電話番号", "受付時間", "土曜・祝日"],
    hours: "月曜〜金曜 10:00〜17:00", unavailable: "お問い合わせ対応休業",
  },
  es: {
    domesticTerms: "Los productos hechos por encargo se pueden cancelar antes de que comience la fabricación. En Corea, la reparación y el refuerzo de suelas despegadas o desgastadas son gratuitos; la sustitución de la suela cuesta ₩65.000.",
    leatherTerms: "Las partes superiores de cuero son pesadas y pueden desteñir o transferir color al mojarse. Las condiciones de pago y envío se indican al finalizar la compra y en la página de envíos.",
    privacyOrders: "Recogemos el nombre y los datos de contacto, envío y pago necesarios para tramitar los pedidos y atender las consultas. Usamos el medio de contacto que elijas, Instagram o correo electrónico, para informarte sobre el pedido, las especificaciones del diseño y el envío. No compartimos estos datos para fines distintos del envío y la atención al cliente.",
    privacyAnalytics: "Para gestionar las cuentas y analizar el uso del sitio, registramos el método de registro, el tipo de dispositivo utilizado al registrarse (ordenador, móvil o tableta), las páginas visitadas, la fuente de referencia y los datos de campañas o términos de búsqueda que recibamos. Una cookie propia vincula esta información de procedencia con el registro y dura como máximo 24 horas. No podemos recoger los términos de búsqueda que los buscadores no faciliten ni creamos huellas digitales del dispositivo para este análisis.",
    seller: "Vendedor", company: "Datos de la empresa", support: "Atención al cliente",
    labels: ["Nombre comercial", "Representante", "Domicilio comercial", "Teléfono", "Número de registro empresarial", "Número de registro de venta en línea", "Correo de atención al cliente", "Teléfono de atención al cliente", "Horario de atención", "Sábados y festivos"],
    hours: "De lunes a viernes, de 10:00 a 17:00", unavailable: "Sin atención al cliente",
  },
  th: {
    domesticTerms: "สินค้าสั่งทำสามารถยกเลิกได้ก่อนเริ่มผลิต สำหรับลูกค้าในเกาหลี การซ่อมและเสริมความแข็งแรงของพื้นรองเท้าที่แยกหรือสึกหรอไม่มีค่าใช้จ่าย ส่วนการเปลี่ยนพื้นรองเท้าราคา 65,000 วอน",
    leatherTerms: "ส่วนบนของรองเท้าที่ทำจากหนังมีน้ำหนักมาก และอาจเกิดสีตกหรือสีซีดเมื่อเปียกน้ำ เงื่อนไขการชำระเงินและการจัดส่งแสดงอยู่ในหน้าชำระเงินและหน้าข้อมูลการจัดส่ง",
    privacyOrders: "เราเก็บชื่อ ข้อมูลติดต่อ ที่อยู่จัดส่ง และข้อมูลการชำระเงินที่จำเป็นต่อการดำเนินการตามคำสั่งซื้อและการให้คำปรึกษา เราจะติดต่อเรื่องคำสั่งซื้อ รายละเอียดการออกแบบ และการจัดส่งผ่านช่องทางที่คุณเลือก คือ Instagram หรืออีเมล เราจะไม่เปิดเผยข้อมูลเหล่านี้เพื่อวัตถุประสงค์อื่นนอกเหนือจากการจัดส่งและการบริการลูกค้า",
    privacyAnalytics: "เพื่อจัดการสมาชิกและวิเคราะห์การใช้งานเว็บไซต์ เราบันทึกวิธีสมัครสมาชิก ประเภทอุปกรณ์ขณะสมัคร (คอมพิวเตอร์ โทรศัพท์มือถือ หรือแท็บเล็ต) หน้าที่เข้าชม แหล่งที่มาของผู้เข้าชม และข้อมูลแคมเปญหรือคำค้นหาที่ได้รับ คุกกี้ของเว็บไซต์ที่เชื่อมโยงข้อมูลแหล่งที่มากับการสมัครสมาชิกจะมีอายุไม่เกิน 24 ชั่วโมง เราไม่สามารถเก็บคำค้นหาที่เครื่องมือค้นหาไม่ได้ส่งให้ และไม่สร้างลายนิ้วมือดิจิทัลของอุปกรณ์เพื่อการวิเคราะห์นี้",
    seller: "ผู้ขาย", company: "ข้อมูลผู้ประกอบการ", support: "ฝ่ายบริการลูกค้า",
    labels: ["ชื่อกิจการ", "ผู้แทนกิจการ", "ที่อยู่กิจการ", "โทรศัพท์", "เลขทะเบียนธุรกิจ", "เลขทะเบียนการขายออนไลน์", "อีเมลฝ่ายบริการลูกค้า", "โทรศัพท์ฝ่ายบริการลูกค้า", "เวลาทำการฝ่ายบริการลูกค้า", "วันเสาร์และวันหยุดนักขัตฤกษ์"],
    hours: "วันจันทร์–ศุกร์ เวลา 10:00–17:00 น.", unavailable: "ปิดให้บริการลูกค้า",
  },
  fr: {
    domesticTerms: "Les articles fabriqués sur commande peuvent être annulés avant le début de la fabrication. En Corée, la réparation et le renforcement des semelles décollées ou usées sont gratuits ; le remplacement de la semelle coûte 65 000 ₩.",
    leatherTerms: "Les tiges en cuir sont lourdes et peuvent déteindre ou perdre leur couleur lorsqu’elles sont mouillées. Les conditions de paiement et de livraison figurent lors du règlement et sur la page de livraison.",
    privacyOrders: "Nous recueillons le nom et les coordonnées de contact, de livraison et de paiement nécessaires au traitement des commandes et à l’assistance. Nous utilisons le moyen de contact que vous avez choisi, Instagram ou e-mail, pour communiquer au sujet de votre commande, des caractéristiques de votre modèle et de la livraison. Nous ne transmettons pas ces données à d’autres fins que la livraison et le service client.",
    privacyAnalytics: "Pour gérer les comptes et analyser l’utilisation du site, nous enregistrons le mode d’inscription, le type d’appareil utilisé à l’inscription (ordinateur, mobile ou tablette), les pages consultées, la source de provenance ainsi que les données de campagne ou les termes de recherche qui nous sont communiqués. Un cookie propriétaire relie ces informations de provenance à l’inscription pendant une durée maximale de 24 heures. Nous ne pouvons pas recueillir les termes de recherche que les moteurs de recherche ne nous transmettent pas et ne créons pas d’empreinte numérique de l’appareil pour cette analyse.",
    seller: "Vendeur", company: "Informations sur l’entreprise", support: "Service client",
    labels: ["Nom commercial", "Représentant", "Adresse de l’entreprise", "Téléphone", "Numéro d’immatriculation de l’entreprise", "Numéro d’enregistrement de vente en ligne", "E-mail du service client", "Téléphone du service client", "Horaires du service client", "Samedis et jours fériés"],
    hours: "Du lundi au vendredi, de 10 h à 17 h", unavailable: "Service client fermé",
  },
  de: {
    domesticTerms: "Massgefertigte Artikel können vor Produktionsbeginn storniert werden. In Korea sind Reparaturen und Verstärkungen bei abgelösten oder abgenutzten Sohlen kostenlos; ein Sohlenwechsel kostet 65.000 ₩.",
    leatherTerms: "Obermaterial aus Leder ist schwer und kann bei Nässe abfärben oder an Farbe verlieren. Die Zahlungs- und Versandbedingungen finden Sie im Bestellvorgang und auf der Versandseite.",
    privacyOrders: "Wir erheben Namen, Kontakt-, Liefer- und Zahlungsdaten, die wir zur Bearbeitung von Bestellungen und für den Kundenservice benötigen. Über den von Ihnen gewählten Kontaktweg, Instagram oder E-Mail, informieren wir Sie über Ihre Bestellung, die Gestaltung Ihres Schuhs und den Versand. Wir geben diese Daten ausschliesslich für den Versand und den Kundenservice weiter.",
    privacyAnalytics: "Für die Mitgliederverwaltung und die Analyse der Websitenutzung erfassen wir die Registrierungsmethode, den Gerätetyp bei der Registrierung (Computer, Mobiltelefon oder Tablet), besuchte Seiten, die Herkunft des Besuchs sowie übermittelte Kampagnen- und Suchbegriffsdaten. Ein eigenes Zuordnungs-Cookie verknüpft diese Herkunftsinformationen mit der Registrierung und bleibt höchstens 24 Stunden gespeichert. Suchbegriffe, die Suchmaschinen nicht übermitteln, können wir nicht erfassen. Für diese Analyse erstellen wir keinen digitalen Gerätefingerabdruck.",
    seller: "Verkäufer", company: "Unternehmensangaben", support: "Kundenservice",
    labels: ["Firmenname", "Vertretungsberechtigte Person", "Geschäftsanschrift", "Telefon", "Unternehmensregisternummer", "Registrierungsnummer für den Onlinehandel", "E-Mail des Kundenservice", "Telefon des Kundenservice", "Servicezeiten", "Samstage und Feiertage"],
    hours: "Montag bis Freitag, 10–17 Uhr", unavailable: "Kundenservice geschlossen",
  },
  ru: {
    domesticTerms: "Изделия на заказ можно отменить до начала изготовления. В Корее ремонт и укрепление подошвы при отклеивании или износе выполняются бесплатно; замена подошвы стоит 65 000 вон.",
    leatherTerms: "Кожаный верх имеет большой вес и при намокании может окрашивать другие материалы или терять цвет. Условия оплаты и доставки указаны при оформлении заказа и на странице доставки.",
    privacyOrders: "Мы собираем имя, контактные данные, адрес доставки и платёжные данные, необходимые для выполнения заказов и поддержки клиентов. Для обсуждения заказа, характеристик дизайна и доставки мы используем выбранный вами способ связи: Instagram или электронную почту. Мы не передаём эти данные для целей, не связанных с доставкой и обслуживанием клиентов.",
    privacyAnalytics: "Для управления учётными записями и анализа использования сайта мы записываем способ регистрации, тип устройства при регистрации (компьютер, телефон или планшет), посещённые страницы, источник перехода и переданные нам сведения о кампаниях или поисковых запросах. Собственный файл cookie связывает сведения об источнике перехода с регистрацией и хранится не более 24 часов. Мы не можем собирать поисковые запросы, которые поисковые системы нам не передают, и не создаём цифровые отпечатки устройств для этого анализа.",
    seller: "Продавец", company: "Информация о компании", support: "Служба поддержки",
    labels: ["Название компании", "Представитель", "Адрес компании", "Телефон", "Регистрационный номер компании", "Регистрационный номер интернет-торговли", "Электронная почта поддержки", "Телефон поддержки", "Часы работы поддержки", "Суббота и праздничные дни"],
    hours: "Понедельник–пятница, 10:00–17:00", unavailable: "Служба поддержки не работает",
  },
  it: {
    domesticTerms: "Gli articoli realizzati su ordinazione possono essere annullati prima dell’inizio della produzione. In Corea, la riparazione e il rinforzo delle suole scollate o usurate sono gratuiti; la sostituzione della suola costa 65.000 ₩.",
    leatherTerms: "Le tomaie in pelle sono pesanti e possono trasferire colore o scolorire quando si bagnano. Le condizioni di pagamento e spedizione sono indicate durante il pagamento e nella pagina delle spedizioni.",
    privacyOrders: "Raccogliamo il nome e i dati di contatto, spedizione e pagamento necessari per evadere gli ordini e fornire assistenza. Utilizziamo il metodo di contatto scelto, Instagram o e-mail, per comunicare riguardo all’ordine, alle specifiche del modello e alla spedizione. Non condividiamo questi dati per finalità diverse dalla spedizione e dall’assistenza clienti.",
    privacyAnalytics: "Per gestire gli account e analizzare l’utilizzo del sito, registriamo il metodo di registrazione, il tipo di dispositivo usato al momento dell’iscrizione (computer, cellulare o tablet), le pagine visitate, la provenienza della visita e le informazioni sulle campagne o sui termini di ricerca che ci vengono fornite. Un cookie di prima parte collega queste informazioni di provenienza alla registrazione e dura al massimo 24 ore. Non possiamo raccogliere i termini di ricerca non forniti dai motori di ricerca e non creiamo impronte digitali dei dispositivi per questa analisi.",
    seller: "Venditore", company: "Informazioni sull’azienda", support: "Assistenza clienti",
    labels: ["Ragione sociale", "Rappresentante", "Indirizzo dell’azienda", "Telefono", "Numero di registrazione dell’impresa", "Numero di registrazione per la vendita online", "E-mail dell’assistenza", "Telefono dell’assistenza", "Orari dell’assistenza", "Sabato e festivi"],
    hours: "Dal lunedì al venerdì, dalle 10:00 alle 17:00", unavailable: "Assistenza non disponibile",
  },
  pt: {
    domesticTerms: "Os artigos feitos por encomenda podem ser cancelados antes do início da produção. Na Coreia, a reparação e o reforço de solas descoladas ou gastas são gratuitos; a substituição da sola custa ₩65.000.",
    leatherTerms: "As partes superiores em couro são pesadas e podem transferir tinta ou perder a cor quando molhadas. As condições de pagamento e envio são apresentadas ao finalizar a compra e na página de envios.",
    privacyOrders: "Recolhemos o nome e os dados de contacto, envio e pagamento necessários para processar as encomendas e prestar apoio. Utilizamos o meio de contacto escolhido, Instagram ou e-mail, para comunicar sobre a encomenda, as especificações do modelo e o envio. Não partilhamos estes dados para fins diferentes do envio e do apoio ao cliente.",
    privacyAnalytics: "Para gerir as contas e analisar a utilização do site, registamos o método de registo, o tipo de dispositivo utilizado no registo (computador, telemóvel ou tablet), as páginas visitadas, a origem da visita e os dados de campanhas ou termos de pesquisa que nos sejam fornecidos. Um cookie próprio associa estas informações de origem ao registo e dura, no máximo, 24 horas. Não podemos recolher os termos de pesquisa que os motores de busca não disponibilizam e não criamos impressões digitais dos dispositivos para esta análise.",
    seller: "Vendedor", company: "Informações da empresa", support: "Apoio ao cliente",
    labels: ["Nome comercial", "Representante", "Morada da empresa", "Telefone", "Número de registo da empresa", "Número de registo de vendas online", "E-mail de apoio ao cliente", "Telefone de apoio ao cliente", "Horário de apoio", "Sábados e feriados"],
    hours: "De segunda a sexta-feira, das 10:00 às 17:00", unavailable: "Apoio indisponível",
  },
  tr: {
    domesticTerms: "Sipariş üzerine üretilen ürünler, üretim başlamadan önce iptal edilebilir. Kore’de taban ayrılması veya aşınması için onarım ve güçlendirme ücretsizdir; taban değişimi 65.000 ₩ tutarındadır.",
    leatherTerms: "Deri sayalar ağırdır; ıslandığında başka yüzeylere boya verebilir veya renk kaybedebilir. Ödeme ve gönderim koşulları ödeme ekranında ve gönderim sayfasında belirtilir.",
    privacyOrders: "Siparişleri yerine getirmek ve destek sağlamak için gerekli ad, iletişim, teslimat ve ödeme bilgilerini toplarız. Sipariş, tasarım özellikleri ve gönderim hakkında iletişim kurmak için seçtiğiniz Instagram veya e-posta yöntemini kullanırız. Bu bilgileri gönderim ve müşteri desteği dışındaki amaçlarla paylaşmayız.",
    privacyAnalytics: "Üyelik yönetimi ve site kullanım analizi için kayıt yöntemi, kayıt sırasındaki cihaz türü (bilgisayar, telefon veya tablet), ziyaret edilen sayfalar, yönlendirme kaynağı ve bize iletilen kampanya veya arama terimi bilgilerini kaydederiz. Kaynak bilgisini üyelik kaydıyla ilişkilendiren birinci taraf çerezi en fazla 24 saat saklanır. Arama motorlarının iletmediği arama terimlerini toplayamayız ve bu analiz için cihaz parmak izi oluşturmayız.",
    seller: "Satıcı", company: "Şirket bilgileri", support: "Müşteri desteği",
    labels: ["Ticari unvan", "Temsilci", "İşletme adresi", "Telefon", "İşletme kayıt numarası", "Çevrimiçi satış kayıt numarası", "Destek e-posta adresi", "Destek telefonu", "Destek saatleri", "Cumartesi ve resmî tatiller"],
    hours: "Pazartesi–Cuma, 10.00–17.00", unavailable: "Destek hizmeti kapalı",
  },
  uz: {
    domesticTerms: "Buyurtma asosida tayyorlanadigan mahsulotni ishlab chiqarish boshlanishidan oldin bekor qilish mumkin. Koreyada tagcharmi ajralgan yoki yeyilgan poyabzalni ta’mirlash va mustahkamlash bepul; tagcharmni almashtirish narxi 65 000 von.",
    leatherTerms: "Charm ustki qism og‘ir bo‘ladi va ho‘llanganda boshqa materiallarga rang berishi yoki rangi oqarishi mumkin. To‘lov va yetkazib berish shartlari buyurtmani rasmiylashtirish ekranida hamda yetkazib berish sahifasida ko‘rsatiladi.",
    privacyOrders: "Buyurtmalarni bajarish va maslahat berish uchun zarur bo‘lgan ism, aloqa, yetkazib berish va to‘lov ma’lumotlarini yig‘amiz. Buyurtma, dizayn tafsilotlari va yetkazib berish haqida siz tanlagan Instagram yoki elektron pochta orqali bog‘lanamiz. Bu ma’lumotlarni yetkazib berish va mijozlarga xizmat ko‘rsatishdan boshqa maqsadlarda ulashmaymiz.",
    privacyAnalytics: "A’zolikni boshqarish va saytdan foydalanishni tahlil qilish uchun ro‘yxatdan o‘tish usuli, ro‘yxatdan o‘tish paytidagi qurilma turi (kompyuter, telefon yoki planshet), ko‘rilgan sahifalar, saytga kirish manbasi hamda bizga berilgan kampaniya yoki qidiruv so‘zlari haqidagi ma’lumotlarni qayd etamiz. Kirish manbasini ro‘yxatdan o‘tish bilan bog‘laydigan saytimizning cookie fayli ko‘pi bilan 24 soat saqlanadi. Qidiruv tizimlari bermagan qidiruv so‘zlarini yig‘a olmaymiz va bu tahlil uchun qurilmaning raqamli izini yaratmaymiz.",
    seller: "Sotuvchi", company: "Korxona ma’lumotlari", support: "Mijozlarni qo‘llab-quvvatlash",
    labels: ["Korxona nomi", "Vakil", "Korxona manzili", "Telefon", "Korxonaning ro‘yxatga olish raqami", "Onlayn savdo ro‘yxatga olish raqami", "Yordam uchun elektron pochta", "Yordam telefoni", "Xizmat vaqti", "Shanba va bayram kunlari"],
    hours: "Dushanba–juma, 10:00–17:00", unavailable: "Yordam xizmati ishlamaydi",
  },
  zh: {
    domesticTerms: "定制商品可在开始制作前取消。在韩国，鞋底开胶或磨损可免费维修、加固；更换鞋底的费用为65,000韩元。",
    leatherTerms: "皮革鞋面较重，遇水可能染色或掉色。付款和配送条件以结账页面及配送说明页面为准。",
    privacyOrders: "我们收集处理订单及提供咨询服务所需的姓名、联系方式、收货地址和付款信息。我们会通过您选择的Instagram或电子邮件，就订单、制作规格和配送事宜与您联系。这些信息不会用于配送及客户服务以外的目的而向第三方提供。",
    privacyAnalytics: "为管理会员及分析网站使用情况，我们会记录注册方式、注册时的设备类型（电脑、手机或平板电脑）、访问页面、访问来源，以及向我们提供的推广活动和搜索词信息。用于将访问来源与注册行为关联的第一方Cookie最多保留24小时。我们无法收集搜索引擎未提供的搜索词，也不会为此分析创建设备指纹。",
    seller: "卖家", company: "经营者信息", support: "客户服务",
    labels: ["商家名称", "负责人", "经营地址", "联系电话", "营业登记号", "网络销售登记号", "客服邮箱", "客服电话", "客服时间", "星期六及公众假期"],
    hours: "周一至周五 10:00–17:00", unavailable: "客服休息",
  },
  "zh-Hant": {
    domesticTerms: "訂製商品可於開始製作前取消。在韓國，鞋底脫膠或磨損可免費維修及加固；更換鞋底的費用為65,000韓圜。",
    leatherTerms: "皮革鞋面較重，遇水可能染色或褪色。付款及配送條件以結帳頁面及配送說明頁面為準。",
    privacyOrders: "我們收集處理訂單及提供諮詢服務所需的姓名、聯絡資料、收貨地址和付款資料。我們會透過您選擇的Instagram或電郵，就訂單、製作規格和配送事宜與您聯絡。我們不會為配送及客戶服務以外的目的，向第三方提供這些資料。",
    privacyAnalytics: "為管理會員及分析網站使用情況，我們會記錄註冊方式、註冊時的裝置類型（電腦、手機或平板電腦）、瀏覽頁面、流量來源，以及向我們提供的推廣活動和搜尋字詞資料。用於將流量來源與註冊行為連結的第一方Cookie最多保留24小時。我們無法收集搜尋引擎未提供的搜尋字詞，亦不會為此分析建立裝置指紋。",
    seller: "賣家", company: "商戶資料", support: "客戶服務",
    labels: ["商戶名稱", "負責人", "營業地址", "聯絡電話", "商業登記號碼", "網上銷售登記號碼", "客服電郵", "客服電話", "客服時間", "星期六及公眾假期"],
    hours: "星期一至五 10:00–17:00", unavailable: "客服休息",
  },
  hi: {
    domesticTerms: "ऑर्डर पर बनाए जाने वाले उत्पादों को उत्पादन शुरू होने से पहले रद्द किया जा सकता है। कोरिया में, अलग हो रहे या घिसे हुए सोल की मरम्मत और मज़बूती का काम निःशुल्क है; सोल बदलने की कीमत 65,000 कोरियाई वॉन है।",
    leatherTerms: "जूते का चमड़े वाला ऊपरी हिस्सा भारी होता है और गीला होने पर रंग छोड़ सकता है या उसका रंग फीका पड़ सकता है। भुगतान और शिपिंग की शर्तें चेकआउट और शिपिंग जानकारी वाले पेज पर दी गई हैं।",
    privacyOrders: "हम ऑर्डर पूरे करने और सहायता देने के लिए ज़रूरी नाम, संपर्क, शिपिंग और भुगतान संबंधी जानकारी एकत्र करते हैं। आपके ऑर्डर, डिज़ाइन के विवरण और शिपिंग के बारे में बात करने के लिए हम आपके चुने हुए माध्यम, Instagram या ईमेल, का उपयोग करते हैं। हम यह जानकारी शिपिंग और ग्राहक सहायता के अलावा किसी अन्य उद्देश्य से साझा नहीं करते।",
    privacyAnalytics: "सदस्य खातों के प्रबंधन और वेबसाइट के उपयोग का विश्लेषण करने के लिए हम पंजीकरण का तरीका, पंजीकरण के समय उपकरण का प्रकार (कंप्यूटर, मोबाइल या टैबलेट), देखे गए पेज, आगमन का स्रोत और हमें दी गई प्रचार अभियान या खोज शब्दों की जानकारी दर्ज करते हैं। हमारी अपनी कुकी आगमन के स्रोत की जानकारी को पंजीकरण से जोड़ती है और अधिकतम 24 घंटे तक रहती है। खोज इंजन जो खोज शब्द उपलब्ध नहीं कराते, उन्हें हम एकत्र नहीं कर सकते। इस विश्लेषण के लिए हम उपकरण का डिजिटल फ़िंगरप्रिंट नहीं बनाते।",
    seller: "विक्रेता", company: "व्यवसाय की जानकारी", support: "ग्राहक सहायता",
    labels: ["व्यवसाय का नाम", "प्रतिनिधि", "व्यवसाय का पता", "फ़ोन", "व्यवसाय पंजीकरण संख्या", "ऑनलाइन बिक्री पंजीकरण संख्या", "सहायता ईमेल", "सहायता फ़ोन", "सहायता का समय", "शनिवार और सार्वजनिक छुट्टियाँ"],
    hours: "सोमवार–शुक्रवार, सुबह 10 बजे से शाम 5 बजे तक", unavailable: "सहायता उपलब्ध नहीं",
  },
  tl: {
    domesticTerms: "Maaaring kanselahin ang mga produktong ginagawa ayon sa order bago magsimula ang paggawa. Sa Korea, libre ang pagkukumpuni at pagpapatibay ng natatanggal o nauupod na suwelas; ₩65,000 ang pagpapalit ng suwelas.",
    leatherTerms: "Mabigat ang katad na pang-itaas ng sapatos at maaaring maglipat ng kulay o kumupas kapag nabasa. Makikita ang mga kondisyon ng pagbabayad at pagpapadala sa pahina ng pag-checkout at sa pahina ng pagpapadala.",
    privacyOrders: "Kinokolekta namin ang pangalan, mga detalye sa pakikipag-ugnayan, paghahatid at pagbabayad na kailangan upang matupad ang mga order at makapagbigay ng tulong. Ginagamit namin ang napili mong paraan ng pakikipag-ugnayan, Instagram o email, para pag-usapan ang order, mga detalye ng disenyo at pagpapadala. Hindi namin ibinabahagi ang mga detalyeng ito para sa ibang layunin bukod sa pagpapadala at serbisyo sa customer.",
    privacyAnalytics: "Para sa pamamahala ng mga miyembro at pagsusuri ng paggamit ng site, itinatala namin ang paraan ng pagpaparehistro, uri ng device sa pagpaparehistro (computer, mobile o tablet), mga pahinang binisita, pinanggalingan ng pagbisita, at impormasyong ibinigay sa amin tungkol sa mga kampanya o salitang ginamit sa paghahanap. Ang sariling cookie ng site ay nag-uugnay ng impormasyong ito sa pagpaparehistro at nananatili nang hanggang 24 oras. Hindi namin makokolekta ang mga salitang hindi ibinibigay ng mga search engine, at hindi kami gumagawa ng digital fingerprint ng device para sa pagsusuring ito.",
    seller: "Nagbebenta", company: "Impormasyon ng negosyo", support: "Serbisyo sa customer",
    labels: ["Pangalan ng negosyo", "Kinatawan", "Address ng negosyo", "Telepono", "Numero ng rehistrasyon ng negosyo", "Numero ng rehistrasyon para sa online na pagbebenta", "Email para sa tulong", "Telepono para sa tulong", "Oras ng serbisyo", "Sabado at mga pampublikong holiday"],
    hours: "Lunes–Biyernes, 10:00 n.u.–5:00 n.h.", unavailable: "Walang serbisyo sa customer",
  },
};

const SOURCE_LABELS = ["상호명", "대표자명", "사업장 주소", "대표전화", "사업자 등록번호", "통신판매업 신고번호", "상담 이메일", "상담전화", "CS운영시간", "토요일 및 공휴일"];

export function legalPageCopy(locale: Locale): LegalCopy {
  return locale === "ar" ? LEGAL_COPY.en : LEGAL_COPY[locale];
}

export function localizedCompanyRows(locale: Locale, rows: InfoRow[]): InfoRow[] {
  const copy = legalPageCopy(locale);
  return rows.map((row) => {
    const labelIndex = SOURCE_LABELS.indexOf(row.label);
    const value = row.label === "CS운영시간" && row.value === "오전 10시~오후 5시 (월~금)"
      ? copy.hours
      : row.label === "토요일 및 공휴일" && row.value === "상담불가"
        ? copy.unavailable
        : row.value;
    return { ...row, label: labelIndex < 0 ? row.label : copy.labels[labelIndex], value };
  });
}
