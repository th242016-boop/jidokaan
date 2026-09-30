import type { Locale } from "./i18n";
export const ko = {
  title: "주문 전 확인 사항",
  contact: "제작·배송 안내를 받을 연락 방법",
  instagram: "인스타그램 아이디 · 필수",
  emailOption: "인스타그램이 없습니다 · 이메일로 연락받기",
  email: "연락 가능한 이메일 주소 · 필수",
  contactHelp:
    "인스타그램은 메시지 요청을 받을 수 있는 계정을 입력해 주세요. 계정이 없으면 이메일 연락을 선택하고, 실제 확인하는 이메일 주소를 입력해 주세요.",
  designTitle: "확정 디자인과 제작 사양",
  design:
    "아래 디자인·부위별 색상·사이즈·수량을 확인해 주세요. 확인한 디자인 이미지와 제작 사양이 주문에 저장되어 제작 담당자에게 전달됩니다.",
  shipping:
    "국제 배송은 우체국 EMS를 이용합니다. 국가별 배송비가 이번 결제에 포함됩니다. 한 켤레당 410×310×150mm 상자 기준이며, 여러 켤레는 각각 별도 상자로 계산합니다.",
  duty: "관세·세금·통관 수수료는 이번 결제에 포함되지 않습니다. 도착국 규정에 따라 별도로 발생하며, 수취인 납부 또는 발송 전 선납 여부를 안내합니다.",
  usDuty:
    "미국행 관세·통관 수수료는 이번 결제에 포함되지 않습니다. 발송인이 선납해야 하는 비용은 제작 시작 전 예상액을 안내하고, 출고 전 확정 금액을 별도로 결제받습니다. 해당 비용 납부 확인 후 발송합니다.",
  production:
    "주문 후 제작합니다. 제작 기간은 영업일 기준 약 30일을 예상해 주세요. 국제 배송과 통관에 걸리는 시간은 별도입니다.",
  agree:
    "확정 디자인·사이즈·수량과 위 안내를 확인했습니다. 배송비는 이번 결제에 포함되며, 관세·세금·통관 비용은 별도로 발생할 수 있음을 이해합니다.",
  missing: "확정 디자인 정보가 없습니다. 시뮬레이터에서 디자인을 확정한 후 다시 주문해 주세요.",
  simulator: "시뮬레이터에서 디자인 확정하기",
  loading: "주문에 저장할 디자인 이미지를 준비하고 있습니다.",
  imageError: "디자인 이미지를 불러오지 못했습니다. 다시 시도한 후 디자인을 확인해 주세요.",
  retry: "다시 시도",
  unavailable: "이 국가의 일반 EMS 배송비가 확정되지 않았습니다. 결제 전 배송 상담이 필요합니다.",
  notIncluded: "관세·세금·통관 수수료 별도",
  confirmError: "연락처와 확정 디자인을 확인하고 주문 전 안내에 동의해 주세요.",
  price: "제품 가격과 배송비는 USD로 결제됩니다.",
  paymentError:
    "결제 또는 주문 저장을 확인하지 못했습니다. 중복 결제하지 말고 PayPal 내역을 확인한 후 주문 저장을 재시도해 주세요.",
  saveError: "주문을 저장하지 못했습니다. 입력 정보와 연결 상태를 확인하고 다시 시도해 주세요.",
  paymentLoading: "PayPal을 불러오는 중입니다.",
  paymentUnavailable: "현재 PayPal을 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.",
  refresh:
    "주문 정보 또는 배송비가 변경되었습니다. 페이지를 새로고침하고 확인해 주세요. 결제는 실행되지 않았습니다.",
  contactLink: "배송·제작 문의",
};
type Copy = Record<keyof typeof ko, string>;
export const CHECKOUT_COPY: Record<Locale, Copy> = {
  ko,
  en: {
    title: "Before you order",
    contact: "Contact method for production and delivery updates",
    instagram: "Instagram username · required",
    emailOption: "I do not use Instagram · contact me by email",
    email: "Reachable email address · required",
    contactHelp:
      "Enter an Instagram account that accepts message requests. If you do not have one, select email and enter an address you actively check.",
    designTitle: "Final design and production specifications",
    design:
      "Check the design, colors for each part, size and quantity below. The confirmed design image and specifications will be saved with your order for our maker.",
    shipping:
      "International orders ship by Korea Post EMS. The destination-based shipping charge is included in this payment. Each pair is rated as one 410×310×150 mm box; multiple pairs are calculated as separate boxes.",
    duty: "Duties, taxes and customs clearance fees are not included in this payment. Additional charges may apply under destination rules. We will explain whether you pay on arrival or before dispatch.",
    usDuty:
      "US import duties and clearance fees are not included in this payment. For charges the sender must prepay, we will provide an estimate before production starts and collect the confirmed amount separately before dispatch. We ship after these charges are paid.",
    production:
      "Made to order. Allow approximately 30 business days for production. International transit and customs clearance take additional time.",
    agree:
      "I have checked the final design, size, quantity and information above. I understand that shipping is included in this payment, while duties, taxes and clearance fees may be charged separately.",
    missing: "The final design is missing. Confirm your design in the simulator before ordering.",
    simulator: "Confirm design in simulator",
    loading: "Preparing the design image to save with your order.",
    imageError: "The design image could not be loaded. Please retry and check the design.",
    retry: "Retry",
    unavailable:
      "Standard EMS shipping has not been confirmed for this country. Please contact us about shipping before payment.",
    notIncluded: "Duties, taxes and clearance fees excluded",
    confirmError:
      "Check your contact details and final design, then acknowledge the information before ordering.",
    price: "Product prices and shipping are charged in USD.",
    paymentError:
      "Payment or order saving could not be confirmed. Do not pay again. Check your PayPal activity, then retry saving the order.",
    saveError: "The order could not be saved. Check your details and connection, then try again.",
    paymentLoading: "Loading PayPal.",
    paymentUnavailable: "PayPal is currently unavailable. Please try again later.",
    refresh:
      "Order details or shipping have changed. Refresh the page and review them. No payment has been taken.",
    contactLink: "Shipping and production enquiries",
  },
  ja: {
    title: "ご注文前の確認事項",
    contact: "製作・配送のご連絡方法",
    instagram: "Instagramユーザー名・必須",
    emailOption: "Instagramを利用していません・メールで連絡を希望",
    email: "連絡可能なメールアドレス・必須",
    contactHelp:
      "メッセージリクエストを受信できるInstagramアカウントをご入力ください。アカウントがない場合はメールを選び、日常的に確認しているアドレスをご入力ください。",
    designTitle: "確定デザインと製作仕様",
    design:
      "以下のデザイン、各部位の色、サイズ、数量をご確認ください。確認したデザイン画像と仕様は注文に保存され、製作担当者に共有されます。",
    shipping:
      "海外配送には韓国郵便のEMSを利用します。配送先の国に応じた送料は今回のお支払いに含まれます。1足につき410×310×150mmの箱1個で計算し、複数足はそれぞれ別の箱として計算します。",
    duty: "関税・税金・通関手数料は今回のお支払いに含まれません。配送先の規定により別途発生する場合があります。受取時のお支払いか発送前の前払いかをご案内します。",
    usDuty:
      "米国向けの関税・通関手数料は今回のお支払いに含まれません。差出人による前払いが必要な費用は、製作開始前に概算をご案内し、発送前に確定額を別途お支払いいただきます。入金確認後に発送します。",
    production:
      "受注製作です。製作期間は約30営業日を見込んでください。海外配送と通関にかかる日数は別途必要です。",
    agree:
      "確定デザイン、サイズ、数量および上記案内を確認しました。今回の支払いには送料が含まれ、関税・税金・通関費用は別途発生する場合があることを理解しました。",
    missing:
      "確定デザインの情報がありません。シミュレーターでデザインを確定してからご注文ください。",
    simulator: "シミュレーターでデザインを確定",
    loading: "注文に保存するデザイン画像を準備しています。",
    imageError: "デザイン画像を読み込めませんでした。再試行してデザインをご確認ください。",
    retry: "再試行",
    unavailable:
      "この国への通常EMS送料は未確定です。お支払い前に配送についてお問い合わせください。",
    notIncluded: "関税・税金・通関手数料は別途",
    confirmError: "連絡先と確定デザインを確認し、ご注文前の案内に同意してください。",
    price: "商品代金と送料は米ドルで決済されます。",
    paymentError:
      "決済または注文保存を確認できませんでした。再決済せず、PayPal履歴を確認して注文保存を再試行してください。",
    saveError: "注文を保存できませんでした。入力内容と接続を確認し、再試行してください。",
    paymentLoading: "PayPalを読み込んでいます。",
    paymentUnavailable: "現在PayPalを利用できません。しばらくしてから再試行してください。",
    refresh:
      "注文情報または送料が変更されました。ページを更新してご確認ください。決済は実行されていません。",
    contactLink: "配送・製作のお問い合わせ",
  },
  zh: {
    title: "下单前须知",
    contact: "制作及配送联系渠道",
    instagram: "Instagram用户名 · 必填",
    emailOption: "我没有Instagram · 请通过电子邮件联系",
    email: "可联系的电子邮箱 · 必填",
    contactHelp:
      "请填写可接收私信请求的Instagram账号。如没有账号，请选择电子邮件，并填写您经常查收的邮箱。",
    designTitle: "最终设计与制作规格",
    design:
      "请核对下方设计、各部位颜色、尺码和数量。确认后的设计图片及规格将随订单保存，并提供给制作人员。",
    shipping:
      "国际订单通过韩国邮政EMS寄送。本次付款包含按目的国家计算的运费。每双按一个410×310×150毫米纸箱计费，多双按分别装箱计算。",
    duty: "本次付款不包含关税、税款及清关手续费。目的地规定可能产生额外费用。我们会告知您应在收货时支付还是发货前预付。",
    usDuty:
      "寄往美国的关税及清关手续费不包含在本次付款中。如费用须由寄件人预付，我们会在开始制作前告知预估金额，并在发货前另行收取确定金额。确认费用支付后才会发货。",
    production: "本产品为接单制作，制作时间请预留约30个工作日。国际运输及清关时间另计。",
    agree:
      "我已核对最终设计、尺码、数量及上述说明。我理解本次付款包含运费，但关税、税款及清关费用可能另行收取。",
    missing: "缺少最终设计信息。请先在模拟器中确认设计，再下单。",
    simulator: "在模拟器中确认设计",
    loading: "正在准备随订单保存的设计图片。",
    imageError: "无法加载设计图片。请重试并核对设计。",
    retry: "重试",
    unavailable: "尚未确定寄往该国的普通EMS运费。请在付款前咨询配送事宜。",
    notIncluded: "关税、税款及清关手续费另计",
    confirmError: "请核对联系信息及最终设计，并确认下单前须知。",
    price: "商品及运费以美元结算。",
    paymentError:
      "无法确认付款或订单保存结果。请勿重复付款。请先查看PayPal交易记录，再重试保存订单。",
    saveError: "订单保存失败。请检查输入信息及网络连接后重试。",
    paymentLoading: "正在加载PayPal。",
    paymentUnavailable: "PayPal暂时不可用。请稍后重试。",
    refresh: "订单信息或运费已变更。请刷新页面并核对。尚未扣款。",
    contactLink: "配送及制作咨询",
  },
  es: {
    title: "Antes de realizar el pedido",
    contact: "Medio de contacto para producción y entrega",
    instagram: "Usuario de Instagram · obligatorio",
    emailOption: "No uso Instagram · contactar por correo",
    email: "Correo electrónico de contacto · obligatorio",
    contactHelp:
      "Introduce una cuenta de Instagram que acepte solicitudes de mensajes. Si no tienes una, selecciona correo e introduce una dirección que revises habitualmente.",
    designTitle: "Diseño definitivo y especificaciones",
    design:
      "Revisa el diseño, los colores de cada parte, la talla y la cantidad. La imagen confirmada y las especificaciones se guardarán con el pedido para el fabricante.",
    shipping:
      "Los pedidos internacionales se envían por EMS de Korea Post. Este pago incluye el envío calculado según el país de destino. Cada par se calcula como una caja de 410×310×150 mm; varios pares se calculan en cajas separadas.",
    duty: "Este pago no incluye aranceles, impuestos ni gastos de despacho aduanero. Pueden aplicarse cargos adicionales según el destino. Te indicaremos si se pagan al recibir o antes del envío.",
    usDuty:
      "Este pago no incluye aranceles ni gastos de despacho de EE. UU. Si el remitente debe pagarlos por adelantado, te daremos una estimación antes de fabricar y cobraremos el importe confirmado por separado antes del envío. Enviaremos después de recibir ese pago.",
    production:
      "Fabricado por encargo. Prevé unos 30 días laborables de producción. El transporte internacional y la aduana requieren tiempo adicional.",
    agree:
      "He revisado el diseño definitivo, la talla, la cantidad y la información anterior. Entiendo que este pago incluye el envío, pero que los aranceles, impuestos y gastos aduaneros pueden cobrarse por separado.",
    missing: "Falta el diseño definitivo. Confírmalo en el simulador antes de hacer el pedido.",
    simulator: "Confirmar diseño en el simulador",
    loading: "Preparando la imagen que se guardará con el pedido.",
    imageError: "No se pudo cargar la imagen del diseño. Reintenta y comprueba el diseño.",
    retry: "Reintentar",
    unavailable:
      "El envío EMS estándar a este país no está confirmado. Consulta el envío antes de pagar.",
    notIncluded: "Aranceles, impuestos y despacho no incluidos",
    confirmError:
      "Comprueba el contacto y el diseño definitivo y acepta la información antes de pedir.",
    price: "Los productos y el envío se cobran en USD.",
    paymentError:
      "No se pudo confirmar el pago o el guardado del pedido. No pagues otra vez. Revisa PayPal y reintenta guardar el pedido.",
    saveError: "No se pudo guardar el pedido. Revisa los datos y la conexión y reintenta.",
    paymentLoading: "Cargando PayPal.",
    paymentUnavailable: "PayPal no está disponible. Reintenta más tarde.",
    refresh:
      "Han cambiado los datos o el envío. Actualiza la página y revísalos. No se ha cobrado ningún pago.",
    contactLink: "Consulta de envío y fabricación",
  },
  fr: {
    title: "À vérifier avant de commander",
    contact: "Moyen de contact pour la fabrication et la livraison",
    instagram: "Identifiant Instagram · obligatoire",
    emailOption: "Je n’utilise pas Instagram · contactez-moi par e-mail",
    email: "Adresse e-mail joignable · obligatoire",
    contactHelp:
      "Indiquez un compte Instagram acceptant les invitations par message. Sans compte, choisissez l’e-mail et indiquez une adresse que vous consultez régulièrement.",
    designTitle: "Design définitif et caractéristiques de fabrication",
    design:
      "Vérifiez le design, les couleurs de chaque partie, la pointure et la quantité. L’image confirmée et les caractéristiques seront enregistrées avec la commande pour le fabricant.",
    shipping:
      "Les commandes internationales sont expédiées par EMS de Korea Post. Ce paiement comprend les frais de port selon le pays de destination. Chaque paire est facturée comme un colis de 410×310×150 mm ; plusieurs paires sont calculées en colis séparés.",
    duty: "Les droits de douane, taxes et frais de dédouanement ne sont pas compris dans ce paiement. Des frais supplémentaires peuvent s’appliquer selon le pays. Nous préciserons s’ils sont à régler à réception ou avant expédition.",
    usDuty:
      "Les droits et frais de dédouanement américains ne sont pas compris. Si l’expéditeur doit les prépayer, une estimation sera fournie avant fabrication et le montant définitif sera facturé séparément avant expédition. L’envoi aura lieu après leur paiement.",
    production:
      "Fabrication sur commande. Prévoyez environ 30 jours ouvrés de fabrication. Le transport international et le dédouanement prennent un délai supplémentaire.",
    agree:
      "J’ai vérifié le design définitif, la pointure, la quantité et les informations ci-dessus. Je comprends que le port est compris dans ce paiement, mais que des droits, taxes et frais de dédouanement peuvent être facturés séparément.",
    missing:
      "Le design définitif est manquant. Confirmez-le dans le simulateur avant de commander.",
    simulator: "Confirmer le design dans le simulateur",
    loading: "Préparation de l’image à enregistrer avec la commande.",
    imageError: "L’image du design n’a pas pu être chargée. Réessayez puis vérifiez-la.",
    retry: "Réessayer",
    unavailable:
      "Les frais EMS standard ne sont pas confirmés pour ce pays. Contactez-nous avant le paiement.",
    notIncluded: "Droits, taxes et dédouanement non compris",
    confirmError:
      "Vérifiez vos coordonnées et le design, puis acceptez les informations avant commande.",
    price: "Les produits et le port sont facturés en USD.",
    paymentError:
      "Le paiement ou l’enregistrement n’a pas pu être confirmé. Ne payez pas à nouveau. Vérifiez PayPal puis réessayez d’enregistrer la commande.",
    saveError:
      "La commande n’a pas pu être enregistrée. Vérifiez vos informations et votre connexion, puis réessayez.",
    paymentLoading: "Chargement de PayPal.",
    paymentUnavailable: "PayPal est indisponible. Réessayez plus tard.",
    refresh:
      "La commande ou les frais de port ont changé. Actualisez la page et vérifiez-les. Aucun paiement n’a été prélevé.",
    contactLink: "Questions sur la livraison et la fabrication",
  },
  de: {
    title: "Vor der Bestellung prüfen",
    contact: "Kontaktweg für Fertigung und Versand",
    instagram: "Instagram-Benutzername · erforderlich",
    emailOption: "Ich nutze kein Instagram · Kontakt per E-Mail",
    email: "Erreichbare E-Mail-Adresse · erforderlich",
    contactHelp:
      "Geben Sie ein Instagram-Konto an, das Nachrichtenanfragen empfangen kann. Ohne Konto wählen Sie E-Mail und geben eine regelmäßig gelesene Adresse an.",
    designTitle: "Endgültiges Design und Fertigungsangaben",
    design:
      "Prüfen Sie Design, Farben aller Teile, Größe und Menge. Das bestätigte Bild und die Angaben werden mit der Bestellung für die Fertigung gespeichert.",
    shipping:
      "Internationaler Versand erfolgt per Korea Post EMS. Die landesspezifischen Versandkosten sind in dieser Zahlung enthalten. Pro Paar wird ein Karton von 410×310×150 mm berechnet; mehrere Paare werden als getrennte Pakete berechnet.",
    duty: "Zoll, Steuern und Abfertigungsgebühren sind nicht in dieser Zahlung enthalten. Je nach Zielland können zusätzliche Kosten entstehen. Wir informieren Sie, ob diese bei Empfang oder vor Versand zu zahlen sind.",
    usDuty:
      "US-Zoll und Abfertigungsgebühren sind nicht enthalten. Muss der Absender diese vorauszahlen, nennen wir vor Fertigungsbeginn eine Schätzung und berechnen den bestätigten Betrag vor Versand separat. Der Versand erfolgt nach Zahlung dieser Kosten.",
    production:
      "Fertigung auf Bestellung. Planen Sie etwa 30 Werktage für die Herstellung ein. Internationaler Transport und Zollabfertigung benötigen zusätzliche Zeit.",
    agree:
      "Ich habe das endgültige Design, Größe, Menge und die obigen Hinweise geprüft. Ich verstehe, dass der Versand in dieser Zahlung enthalten ist, Zoll, Steuern und Abfertigungsgebühren jedoch separat anfallen können.",
    missing: "Das endgültige Design fehlt. Bestätigen Sie es vor der Bestellung im Simulator.",
    simulator: "Design im Simulator bestätigen",
    loading: "Das Designbild für die Bestellung wird vorbereitet.",
    imageError:
      "Das Designbild konnte nicht geladen werden. Versuchen Sie es erneut und prüfen Sie es.",
    retry: "Erneut versuchen",
    unavailable:
      "Für dieses Land ist der Standard-EMS-Preis nicht bestätigt. Bitte klären Sie den Versand vor der Zahlung mit uns.",
    notIncluded: "Zoll, Steuern und Abfertigung nicht enthalten",
    confirmError: "Prüfen Sie Kontaktdaten und Design und bestätigen Sie die Bestellhinweise.",
    price: "Waren und Versand werden in USD berechnet.",
    paymentError:
      "Zahlung oder Speicherung konnte nicht bestätigt werden. Zahlen Sie nicht erneut. Prüfen Sie PayPal und versuchen Sie, die Bestellung erneut zu speichern.",
    saveError:
      "Die Bestellung konnte nicht gespeichert werden. Prüfen Sie Angaben und Verbindung und versuchen Sie es erneut.",
    paymentLoading: "PayPal wird geladen.",
    paymentUnavailable: "PayPal ist derzeit nicht verfügbar. Versuchen Sie es später erneut.",
    refresh:
      "Bestellangaben oder Versandkosten haben sich geändert. Laden Sie die Seite neu und prüfen Sie diese. Es wurde keine Zahlung eingezogen.",
    contactLink: "Fragen zu Versand und Fertigung",
  },
  it: {
    title: "Prima di ordinare",
    contact: "Contatto per produzione e consegna",
    instagram: "Nome utente Instagram · obbligatorio",
    emailOption: "Non uso Instagram · contattatemi via e-mail",
    email: "Indirizzo e-mail raggiungibile · obbligatorio",
    contactHelp:
      "Inserisci un account Instagram che accetti richieste di messaggi. Se non ne hai uno, scegli e-mail e indica un indirizzo che controlli regolarmente.",
    designTitle: "Design definitivo e specifiche di produzione",
    design:
      "Controlla design, colori di ogni parte, taglia e quantità. L’immagine confermata e le specifiche saranno salvate con l’ordine per chi realizzerà il prodotto.",
    shipping:
      "Gli ordini internazionali viaggiano con Korea Post EMS. Questo pagamento include la spedizione calcolata per paese. Ogni paio è calcolato come una scatola da 410×310×150 mm; più paia sono calcolate in scatole separate.",
    duty: "Dazi, imposte e spese di sdoganamento non sono inclusi in questo pagamento. Possono essere dovuti secondo le regole del paese di destinazione. Indicheremo se pagarli alla ricezione o prima della spedizione.",
    usDuty:
      "Dazi e spese di sdoganamento statunitensi non sono inclusi. Se il mittente deve anticiparli, forniremo una stima prima della produzione e richiederemo separatamente l’importo definitivo prima della spedizione. Spediremo dopo il pagamento di tali spese.",
    production:
      "Produzione su ordinazione: prevedi circa 30 giorni lavorativi. Trasporto internazionale e sdoganamento richiedono tempo aggiuntivo.",
    agree:
      "Ho verificato design definitivo, taglia, quantità e informazioni sopra riportate. Comprendo che questo pagamento include la spedizione, mentre dazi, imposte e sdoganamento possono essere addebitati separatamente.",
    missing: "Manca il design definitivo. Confermalo nel simulatore prima di ordinare.",
    simulator: "Conferma il design nel simulatore",
    loading: "Preparazione dell’immagine da salvare con l’ordine.",
    imageError: "Impossibile caricare il design. Riprova e controlla l’immagine.",
    retry: "Riprova",
    unavailable:
      "La tariffa EMS standard per questo paese non è confermata. Contattaci prima del pagamento.",
    notIncluded: "Dazi, imposte e sdoganamento esclusi",
    confirmError:
      "Controlla i contatti e il design definitivo e accetta le informazioni prima dell’ordine.",
    price: "Prodotti e spedizione si pagano in USD.",
    paymentError:
      "Pagamento o salvataggio non confermato. Non pagare di nuovo. Controlla PayPal e riprova a salvare l’ordine.",
    saveError: "Impossibile salvare l’ordine. Verifica dati e connessione e riprova.",
    paymentLoading: "Caricamento di PayPal.",
    paymentUnavailable: "PayPal non è disponibile. Riprova più tardi.",
    refresh:
      "Dati dell’ordine o spedizione modificati. Aggiorna la pagina e controllali. Nessun pagamento è stato addebitato.",
    contactLink: "Informazioni su spedizione e produzione",
  },
  pt: {
    title: "Antes de fazer o pedido",
    contact: "Contato para produção e entrega",
    instagram: "Nome de usuário do Instagram · obrigatório",
    emailOption: "Não uso Instagram · contato por e-mail",
    email: "E-mail para contato · obrigatório",
    contactHelp:
      "Informe uma conta do Instagram que aceite solicitações de mensagens. Se não tiver uma, selecione e-mail e informe um endereço que você consulte regularmente.",
    designTitle: "Design final e especificações de produção",
    design:
      "Confira o design, as cores de cada parte, o tamanho e a quantidade. A imagem confirmada e as especificações serão salvas no pedido para a equipe de produção.",
    shipping:
      "Os pedidos internacionais são enviados pelo EMS dos Correios da Coreia. Este pagamento inclui o frete conforme o país de destino. Cada par é calculado como uma caixa de 410×310×150 mm; vários pares são calculados em caixas separadas.",
    duty: "Impostos de importação, tributos e taxas de desembaraço não estão incluídos neste pagamento. Poderão ser cobrados conforme as regras do destino. Informaremos se o pagamento será no recebimento ou antes do envio.",
    usDuty:
      "Impostos e taxas de desembaraço dos EUA não estão incluídos. Quando o remetente precisar antecipá-los, informaremos uma estimativa antes da produção e cobraremos separadamente o valor confirmado antes do envio. Enviaremos após o pagamento dessas despesas.",
    production:
      "Feito sob encomenda. Considere aproximadamente 30 dias úteis de produção. O transporte internacional e o desembaraço exigem tempo adicional.",
    agree:
      "Conferi o design final, o tamanho, a quantidade e as informações acima. Entendo que o frete está incluído neste pagamento, mas impostos, tributos e taxas de desembaraço poderão ser cobrados separadamente.",
    missing: "O design final está ausente. Confirme-o no simulador antes de fazer o pedido.",
    simulator: "Confirmar design no simulador",
    loading: "Preparando a imagem para salvar com o pedido.",
    imageError: "Não foi possível carregar o design. Tente novamente e confira a imagem.",
    retry: "Tentar novamente",
    unavailable:
      "O frete EMS padrão para este país não está confirmado. Consulte-nos antes de pagar.",
    notIncluded: "Impostos, tributos e desembaraço não incluídos",
    confirmError: "Confira o contato e o design final e aceite as informações antes de pedir.",
    price: "Produtos e frete são cobrados em USD.",
    paymentError:
      "Não foi possível confirmar o pagamento ou salvar o pedido. Não pague novamente. Confira o PayPal e tente salvar o pedido outra vez.",
    saveError: "Não foi possível salvar o pedido. Confira os dados e a conexão e tente novamente.",
    paymentLoading: "Carregando PayPal.",
    paymentUnavailable: "PayPal indisponível no momento. Tente mais tarde.",
    refresh:
      "Os dados ou o frete mudaram. Atualize a página e confira. Nenhum pagamento foi cobrado.",
    contactLink: "Dúvidas sobre envio e produção",
  },
  ru: {
    title: "Перед оформлением заказа",
    contact: "Способ связи по изготовлению и доставке",
    instagram: "Имя пользователя Instagram · обязательно",
    emailOption: "У меня нет Instagram · связь по электронной почте",
    email: "Доступный адрес электронной почты · обязательно",
    contactHelp:
      "Укажите аккаунт Instagram, принимающий запросы на переписку. Если аккаунта нет, выберите электронную почту и укажите адрес, который регулярно проверяете.",
    designTitle: "Окончательный дизайн и параметры изготовления",
    design:
      "Проверьте дизайн, цвета всех деталей, размер и количество. Подтверждённое изображение и параметры сохранятся в заказе для мастера.",
    shipping:
      "Международные заказы отправляются EMS Почты Кореи. Доставка по тарифу страны назначения включена в этот платёж. Каждая пара рассчитывается как отдельная коробка 410×310×150 мм; несколько пар — как отдельные коробки.",
    duty: "Пошлины, налоги и сборы за таможенное оформление не включены в этот платёж. По правилам страны назначения возможны дополнительные расходы. Мы сообщим, оплачиваются ли они при получении или до отправки.",
    usDuty:
      "Пошлины и сборы за оформление в США не включены. Если отправитель обязан внести их заранее, до начала изготовления мы сообщим ориентировочную сумму, а до отправки отдельно получим оплату окончательной суммы. Отправка — после её оплаты.",
    production:
      "Изготовление на заказ занимает ориентировочно 30 рабочих дней. Международная перевозка и таможенное оформление требуют дополнительного времени.",
    agree:
      "Я проверил окончательный дизайн, размер, количество и информацию выше. Я понимаю, что доставка включена в этот платёж, а пошлины, налоги и таможенные сборы могут оплачиваться отдельно.",
    missing: "Окончательный дизайн отсутствует. Подтвердите его в симуляторе перед заказом.",
    simulator: "Подтвердить дизайн в симуляторе",
    loading: "Подготавливаем изображение для сохранения в заказе.",
    imageError: "Не удалось загрузить дизайн. Повторите попытку и проверьте изображение.",
    retry: "Повторить",
    unavailable:
      "Тариф обычной EMS для этой страны не подтверждён. Согласуйте доставку с нами до оплаты.",
    notIncluded: "Пошлины, налоги и таможенные сборы не включены",
    confirmError:
      "Проверьте контакты и окончательный дизайн, затем подтвердите ознакомление с условиями заказа.",
    price: "Товары и доставка оплачиваются в долларах США.",
    paymentError:
      "Не удалось подтвердить оплату или сохранение заказа. Не платите повторно. Проверьте операции PayPal и повторите сохранение заказа.",
    saveError: "Заказ не сохранён. Проверьте данные и подключение и повторите попытку.",
    paymentLoading: "Загрузка PayPal.",
    paymentUnavailable: "PayPal временно недоступен. Повторите позже.",
    refresh:
      "Данные заказа или доставка изменились. Обновите страницу и проверьте их. Оплата не списана.",
    contactLink: "Вопросы по доставке и изготовлению",
  },
  tr: {
    title: "Sipariş öncesi kontrol",
    contact: "Üretim ve teslimat için iletişim yöntemi",
    instagram: "Instagram kullanıcı adı · zorunlu",
    emailOption: "Instagram kullanmıyorum · e-posta ile iletişim",
    email: "Ulaşılabilir e-posta adresi · zorunlu",
    contactHelp:
      "Mesaj isteklerini alabilen bir Instagram hesabı girin. Hesabınız yoksa e-postayı seçin ve düzenli kontrol ettiğiniz bir adres girin.",
    designTitle: "Kesin tasarım ve üretim özellikleri",
    design:
      "Aşağıdaki tasarımı, her parçanın rengini, numarayı ve adedi kontrol edin. Onaylanan görsel ve özellikler üretici için siparişle birlikte kaydedilir.",
    shipping:
      "Uluslararası siparişler Korea Post EMS ile gönderilir. Ülkeye göre hesaplanan kargo bu ödemeye dahildir. Her çift 410×310×150 mm boyutunda bir kutu olarak; birden fazla çift ayrı kutular olarak hesaplanır.",
    duty: "Gümrük vergileri, diğer vergiler ve gümrükleme ücretleri bu ödemeye dahil değildir. Varış ülkesinin kurallarına göre ek ücretler doğabilir. Ödemenin teslimatta mı yoksa gönderimden önce mi yapılacağını bildiririz.",
    usDuty:
      "ABD gümrük vergileri ve gümrükleme ücretleri dahil değildir. Göndericinin önceden ödemesi gereken tutarlar için üretimden önce tahmin verir, kesin tutarı gönderimden önce ayrıca tahsil ederiz. Bu ücretler ödendikten sonra göndeririz.",
    production:
      "Sipariş üzerine üretilir. Üretim için yaklaşık 30 iş günü öngörün. Uluslararası taşıma ve gümrük işlemleri ayrıca zaman alır.",
    agree:
      "Kesin tasarımı, numarayı, adedi ve yukarıdaki bilgileri kontrol ettim. Kargonun bu ödemeye dahil olduğunu, vergi ve gümrükleme ücretlerinin ayrıca alınabileceğini anlıyorum.",
    missing: "Kesin tasarım eksik. Siparişten önce simülatörde tasarımınızı onaylayın.",
    simulator: "Tasarımı simülatörde onayla",
    loading: "Siparişe kaydedilecek tasarım görseli hazırlanıyor.",
    imageError: "Tasarım görseli yüklenemedi. Tekrar deneyip tasarımı kontrol edin.",
    retry: "Tekrar dene",
    unavailable:
      "Bu ülkenin standart EMS ücreti doğrulanmadı. Ödeme öncesi kargo için bize ulaşın.",
    notIncluded: "Vergiler ve gümrükleme hariç",
    confirmError:
      "İletişim bilgilerinizi ve tasarımı kontrol edip sipariş öncesi bilgileri onaylayın.",
    price: "Ürünler ve kargo USD olarak ödenir.",
    paymentError:
      "Ödeme veya sipariş kaydı doğrulanamadı. Tekrar ödeme yapmayın. PayPal işlemlerinizi kontrol edip siparişi kaydetmeyi tekrar deneyin.",
    saveError: "Sipariş kaydedilemedi. Bilgilerinizi ve bağlantınızı kontrol edip tekrar deneyin.",
    paymentLoading: "PayPal yükleniyor.",
    paymentUnavailable: "PayPal şu anda kullanılamıyor. Daha sonra deneyin.",
    refresh:
      "Sipariş bilgileri veya kargo değişti. Sayfayı yenileyip kontrol edin. Ödeme alınmadı.",
    contactLink: "Kargo ve üretim hakkında iletişim",
  },
  uz: {
    title: "Buyurtmadan oldin tekshiring",
    contact: "Ishlab chiqarish va yetkazish bo‘yicha aloqa usuli",
    instagram: "Instagram foydalanuvchi nomi · majburiy",
    emailOption: "Instagram ishlatmayman · elektron pochta orqali bog‘lanish",
    email: "Bog‘lanish mumkin bo‘lgan elektron pochta · majburiy",
    contactHelp:
      "Xabar so‘rovlarini qabul qiladigan Instagram hisobini kiriting. Hisobingiz bo‘lmasa, elektron pochtani tanlang va muntazam tekshiradigan manzilingizni kiriting.",
    designTitle: "Yakuniy dizayn va ishlab chiqarish tafsilotlari",
    design:
      "Quyidagi dizayn, har bir qism rangi, o‘lcham va miqdorni tekshiring. Tasdiqlangan rasm va tafsilotlar buyurtma bilan saqlanib, ustaga yetkaziladi.",
    shipping:
      "Xalqaro buyurtmalar Korea Post EMS orqali yuboriladi. Ushbu to‘lovga boradigan mamlakat bo‘yicha yetkazish haqi kiritilgan. Har bir juft 410×310×150 mm o‘lchamli bitta quti sifatida, bir nechta juft esa alohida qutilar sifatida hisoblanadi.",
    duty: "Boj, soliqlar va bojxona rasmiylashtiruvi haqi ushbu to‘lovga kiritilmagan. Manzil mamlakati qoidalariga ko‘ra qo‘shimcha xarajatlar bo‘lishi mumkin. Ular qabul qilishda yoki jo‘natishdan oldin to‘lanishini ma’lum qilamiz.",
    usDuty:
      "AQSh boji va bojxona rasmiylashtiruvi haqi kiritilmagan. Jo‘natuvchi oldindan to‘lashi kerak bo‘lgan xarajatlarning taxminiy miqdorini ishlab chiqarishdan oldin bildiramiz va aniq summani jo‘natishdan oldin alohida undiramiz. Ushbu to‘lovdan keyin jo‘natamiz.",
    production:
      "Buyurtma asosida tayyorlanadi. Ishlab chiqarish uchun taxminan 30 ish kuni hisoblang. Xalqaro tashish va bojxona ishlari uchun qo‘shimcha vaqt kerak.",
    agree:
      "Yakuniy dizayn, o‘lcham, miqdor va yuqoridagi ma’lumotlarni tekshirdim. Yetkazish ushbu to‘lovga kiritilganini, boj, soliqlar va bojxona haqi esa alohida undirilishi mumkinligini tushunaman.",
    missing: "Yakuniy dizayn yo‘q. Buyurtmadan oldin uni simulyatorda tasdiqlang.",
    simulator: "Dizaynni simulyatorda tasdiqlash",
    loading: "Buyurtmaga saqlanadigan dizayn rasmi tayyorlanmoqda.",
    imageError: "Dizayn rasmi yuklanmadi. Qayta urinib, dizaynni tekshiring.",
    retry: "Qayta urinish",
    unavailable:
      "Ushbu mamlakat uchun oddiy EMS haqi tasdiqlanmagan. To‘lovdan oldin yetkazishni biz bilan kelishing.",
    notIncluded: "Boj, soliqlar va bojxona haqi kiritilmagan",
    confirmError:
      "Aloqa ma’lumotlari va yakuniy dizaynni tekshirib, buyurtma oldi ma’lumotlarini tasdiqlang.",
    price: "Mahsulot va yetkazish haqi USDda to‘lanadi.",
    paymentError:
      "To‘lov yoki buyurtma saqlanishi tasdiqlanmadi. Qayta to‘lamang. PayPal tarixini tekshirib, buyurtmani qayta saqlang.",
    saveError: "Buyurtma saqlanmadi. Ma’lumotlar va ulanishni tekshirib, qayta urinib ko‘ring.",
    paymentLoading: "PayPal yuklanmoqda.",
    paymentUnavailable: "PayPal hozir ishlamayapti. Keyinroq qayta urinib ko‘ring.",
    refresh:
      "Buyurtma yoki yetkazish haqi o‘zgardi. Sahifani yangilang va tekshiring. To‘lov olinmadi.",
    contactLink: "Yetkazish va ishlab chiqarish bo‘yicha murojaat",
  },
  th: {
    title: "ตรวจสอบก่อนสั่งซื้อ",
    contact: "ช่องทางติดต่อเรื่องการผลิตและการจัดส่ง",
    instagram: "ชื่อผู้ใช้ Instagram · จำเป็น",
    emailOption: "ฉันไม่มี Instagram · ติดต่อทางอีเมล",
    email: "อีเมลที่ติดต่อได้ · จำเป็น",
    contactHelp:
      "กรอกบัญชี Instagram ที่รับคำขอข้อความได้ หากไม่มีบัญชี ให้เลือกอีเมลและกรอกที่อยู่ที่คุณตรวจสอบเป็นประจำ",
    designTitle: "แบบที่ยืนยันแล้วและรายละเอียดการผลิต",
    design:
      "ตรวจสอบแบบ สีของแต่ละส่วน ขนาด และจำนวนด้านล่าง ภาพและรายละเอียดที่ยืนยันจะถูกบันทึกพร้อมคำสั่งซื้อและส่งให้ผู้ผลิต",
    shipping:
      "คำสั่งซื้อระหว่างประเทศจัดส่งด้วย Korea Post EMS ค่าจัดส่งตามประเทศปลายทางรวมอยู่ในการชำระเงินครั้งนี้แล้ว คำนวณหนึ่งคู่ต่อกล่องขนาด 410×310×150 มม. หากมีหลายคู่ จะคำนวณเป็นกล่องแยกกัน",
    duty: "การชำระเงินครั้งนี้ไม่รวมอากร ภาษี และค่าดำเนินพิธีการศุลกากร อาจมีค่าใช้จ่ายเพิ่มเติมตามกฎของประเทศปลายทาง เราจะแจ้งว่าต้องชำระเมื่อรับสินค้าหรือก่อนจัดส่ง",
    usDuty:
      "การชำระเงินครั้งนี้ไม่รวมอากรและค่าดำเนินพิธีการศุลกากรของสหรัฐฯ หากผู้ส่งต้องชำระล่วงหน้า เราจะแจ้งประมาณการก่อนเริ่มผลิตและเรียกเก็บยอดที่ยืนยันแยกต่างหากก่อนจัดส่ง โดยจะจัดส่งหลังได้รับชำระค่าใช้จ่ายดังกล่าว",
    production:
      "ผลิตตามคำสั่งซื้อ โปรดเผื่อเวลาผลิตประมาณ 30 วันทำการ ระยะเวลาขนส่งระหว่างประเทศและผ่านศุลกากรเป็นเวลาเพิ่มเติม",
    agree:
      "ฉันได้ตรวจสอบแบบที่ยืนยัน ขนาด จำนวน และข้อมูลข้างต้นแล้ว ฉันเข้าใจว่าการชำระเงินครั้งนี้รวมค่าจัดส่ง แต่ยังอาจมีอากร ภาษี และค่าดำเนินพิธีการศุลกากรแยกต่างหาก",
    missing: "ไม่มีข้อมูลแบบที่ยืนยัน โปรดยืนยันแบบในโปรแกรมจำลองก่อนสั่งซื้อ",
    simulator: "ยืนยันแบบในโปรแกรมจำลอง",
    loading: "กำลังเตรียมภาพแบบเพื่อบันทึกในคำสั่งซื้อ",
    imageError: "โหลดภาพแบบไม่สำเร็จ โปรดลองใหม่และตรวจสอบแบบ",
    retry: "ลองใหม่",
    unavailable:
      "ยังไม่ยืนยันค่าจัดส่ง EMS ปกติสำหรับประเทศนี้ โปรดติดต่อเรื่องการจัดส่งก่อนชำระเงิน",
    notIncluded: "ไม่รวมอากร ภาษี และค่าดำเนินพิธีการศุลกากร",
    confirmError: "โปรดตรวจสอบข้อมูลติดต่อและแบบสุดท้าย แล้วยืนยันว่าได้อ่านข้อมูลก่อนสั่งซื้อ",
    price: "ราคาสินค้าและค่าจัดส่งชำระเป็น USD",
    paymentError:
      "ไม่สามารถยืนยันการชำระเงินหรือการบันทึกคำสั่งซื้อได้ อย่าชำระซ้ำ โปรดตรวจสอบ PayPal แล้วลองบันทึกคำสั่งซื้ออีกครั้ง",
    saveError: "บันทึกคำสั่งซื้อไม่สำเร็จ โปรดตรวจสอบข้อมูลและการเชื่อมต่อแล้วลองใหม่",
    paymentLoading: "กำลังโหลด PayPal",
    paymentUnavailable: "ขณะนี้ PayPal ใช้งานไม่ได้ โปรดลองใหม่ภายหลัง",
    refresh:
      "ข้อมูลคำสั่งซื้อหรือค่าจัดส่งเปลี่ยนแปลง โปรดรีเฟรชหน้าและตรวจสอบ ยังไม่มีการเรียกเก็บเงิน",
    contactLink: "สอบถามการจัดส่งและการผลิต",
  },
  hi: {
    title: "ऑर्डर देने से पहले जाँचें",
    contact: "निर्माण और डिलीवरी की जानकारी के लिए संपर्क माध्यम",
    instagram: "Instagram उपयोगकर्ता नाम · आवश्यक",
    emailOption: "मैं Instagram इस्तेमाल नहीं करता/करती · ईमेल से संपर्क करें",
    email: "संपर्क योग्य ईमेल पता · आवश्यक",
    contactHelp:
      "ऐसा Instagram खाता दें जिस पर संदेश अनुरोध मिल सकें। खाता नहीं है तो ईमेल चुनें और वह पता दें जिसे आप नियमित रूप से देखते हैं।",
    designTitle: "अंतिम डिज़ाइन और निर्माण विवरण",
    design:
      "नीचे डिज़ाइन, हर हिस्से का रंग, आकार और संख्या जाँचें। पुष्टि की गई तस्वीर और विवरण ऑर्डर के साथ सहेजे जाएँगे और निर्माता को दिए जाएँगे।",
    shipping:
      "अंतरराष्ट्रीय ऑर्डर Korea Post EMS से भेजे जाते हैं। देश के अनुसार शिपिंग शुल्क इस भुगतान में शामिल है। हर जोड़ी के लिए 410×310×150 मिमी का एक बॉक्स गिना जाता है; कई जोड़ियों को अलग-अलग बॉक्स के रूप में गिना जाता है।",
    duty: "सीमा शुल्क, कर और कस्टम क्लियरेंस शुल्क इस भुगतान में शामिल नहीं हैं। गंतव्य देश के नियमों के अनुसार अतिरिक्त राशि लग सकती है। हम बताएँगे कि भुगतान प्राप्ति पर करना है या भेजने से पहले।",
    usDuty:
      "अमेरिका के आयात शुल्क और कस्टम क्लियरेंस शुल्क इस भुगतान में शामिल नहीं हैं। प्रेषक को पहले चुकाने वाले शुल्क का अनुमान निर्माण शुरू होने से पहले देंगे और अंतिम राशि भेजने से पहले अलग से लेंगे। इन शुल्कों का भुगतान मिलने के बाद ही भेजेंगे।",
    production:
      "ऑर्डर पर बनाया जाता है। निर्माण के लिए लगभग 30 कार्यदिवस रखें। अंतरराष्ट्रीय परिवहन और कस्टम क्लियरेंस में अतिरिक्त समय लगता है।",
    agree:
      "मैंने अंतिम डिज़ाइन, आकार, संख्या और ऊपर दी गई जानकारी जाँच ली है। मैं समझता/समझती हूँ कि शिपिंग इस भुगतान में शामिल है, लेकिन सीमा शुल्क, कर और कस्टम क्लियरेंस शुल्क अलग से लग सकते हैं।",
    missing:
      "अंतिम डिज़ाइन की जानकारी नहीं है। ऑर्डर से पहले सिम्युलेटर में डिज़ाइन की पुष्टि करें।",
    simulator: "सिम्युलेटर में डिज़ाइन की पुष्टि करें",
    loading: "ऑर्डर के साथ सहेजने के लिए डिज़ाइन की तस्वीर तैयार हो रही है।",
    imageError: "डिज़ाइन की तस्वीर लोड नहीं हुई। फिर कोशिश करें और डिज़ाइन जाँचें।",
    retry: "फिर कोशिश करें",
    unavailable:
      "इस देश के लिए सामान्य EMS शुल्क तय नहीं है। भुगतान से पहले शिपिंग के बारे में हमसे संपर्क करें।",
    notIncluded: "सीमा शुल्क, कर और क्लियरेंस शुल्क अलग हैं",
    confirmError: "संपर्क जानकारी और अंतिम डिज़ाइन जाँचकर ऑर्डर से पहले की जानकारी स्वीकार करें।",
    price: "उत्पाद और शिपिंग का भुगतान USD में होगा।",
    paymentError:
      "भुगतान या ऑर्डर सहेजे जाने की पुष्टि नहीं हुई। दोबारा भुगतान न करें। PayPal विवरण जाँचकर ऑर्डर फिर सहेजने की कोशिश करें।",
    saveError: "ऑर्डर सहेजा नहीं गया। जानकारी और कनेक्शन जाँचकर फिर कोशिश करें।",
    paymentLoading: "PayPal लोड हो रहा है।",
    paymentUnavailable: "अभी PayPal उपलब्ध नहीं है। बाद में फिर कोशिश करें।",
    refresh:
      "ऑर्डर की जानकारी या शिपिंग बदल गई है। पेज रीफ़्रेश करके जाँचें। कोई भुगतान नहीं लिया गया है।",
    contactLink: "शिपिंग और निर्माण संबंधी संपर्क",
  },
  tl: {
    title: "Suriin bago umorder",
    contact: "Paraan ng pakikipag-ugnayan para sa paggawa at paghahatid",
    instagram: "Instagram username · kailangan",
    emailOption: "Wala akong Instagram · makipag-ugnayan sa email",
    email: "Email address na maaari kang makontak · kailangan",
    contactHelp:
      "Ilagay ang Instagram account na tumatanggap ng message requests. Kung wala, piliin ang email at ilagay ang address na regular mong tinitingnan.",
    designTitle: "Pinal na disenyo at detalye ng paggawa",
    design:
      "Suriin ang disenyo, kulay ng bawat bahagi, sukat at dami sa ibaba. Ang kinumpirmang larawan at mga detalye ay ise-save sa order para sa gumagawa.",
    shipping:
      "Ang mga international order ay ipinapadala sa Korea Post EMS. Kasama sa bayad na ito ang shipping ayon sa destinasyong bansa. Bawat pares ay kinakalkula bilang isang kahong 410×310×150 mm; magkakahiwalay na kahon ang kalkulasyon para sa maraming pares.",
    duty: "Hindi kasama sa bayad na ito ang customs duties, buwis at customs clearance fees. Maaaring may dagdag na bayarin ayon sa tuntunin ng destinasyon. Ipapaliwanag namin kung babayaran sa pagtanggap o bago ipadala.",
    usDuty:
      "Hindi kasama ang US import duties at clearance fees. Kung kailangang paunang bayaran ng nagpapadala, magbibigay kami ng tantiya bago simulan ang paggawa at sisingilin nang hiwalay ang pinal na halaga bago ipadala. Ipapadala lamang matapos mabayaran ang mga ito.",
    production:
      "Ginagawa ayon sa order. Maglaan ng humigit-kumulang 30 araw ng trabaho para sa paggawa. May dagdag na oras para sa international transit at customs clearance.",
    agree:
      "Nasuri ko ang pinal na disenyo, sukat, dami at impormasyon sa itaas. Nauunawaan kong kasama ang shipping sa bayad na ito, ngunit maaaring hiwalay na singilin ang customs duties, buwis at clearance fees.",
    missing: "Walang pinal na disenyo. Kumpirmahin ito sa simulator bago umorder.",
    simulator: "Kumpirmahin ang disenyo sa simulator",
    loading: "Inihahanda ang larawan na ise-save sa order.",
    imageError: "Hindi ma-load ang larawan ng disenyo. Subukan muli at suriin ito.",
    retry: "Subukan muli",
    unavailable:
      "Hindi pa kumpirmado ang standard EMS shipping para sa bansang ito. Makipag-ugnayan muna bago magbayad.",
    notIncluded: "Hindi kasama ang duties, buwis at clearance fees",
    confirmError:
      "Suriin ang contact at pinal na disenyo, at kumpirmahing nabasa ang impormasyon bago umorder.",
    price: "USD ang bayad para sa produkto at shipping.",
    paymentError:
      "Hindi makumpirma ang bayad o pag-save ng order. Huwag magbayad muli. Tingnan ang PayPal at subukang i-save muli ang order.",
    saveError: "Hindi na-save ang order. Suriin ang detalye at koneksyon at subukan muli.",
    paymentLoading: "Nilo-load ang PayPal.",
    paymentUnavailable: "Hindi available ang PayPal ngayon. Subukan sa ibang pagkakataon.",
    refresh:
      "Nagbago ang order o shipping. I-refresh ang pahina at suriin. Walang nakolektang bayad.",
    contactLink: "Magtanong tungkol sa shipping at paggawa",
  },
  ar: {
    title: "تحقق قبل الطلب",
    contact: "وسيلة التواصل بشأن التصنيع والتوصيل",
    instagram: "اسم مستخدم Instagram · مطلوب",
    emailOption: "لا أستخدم Instagram · تواصلوا معي بالبريد الإلكتروني",
    email: "بريد إلكتروني يمكن التواصل معك عبره · مطلوب",
    contactHelp:
      "أدخل حساب Instagram يقبل طلبات الرسائل. إذا لم يكن لديك حساب، اختر البريد الإلكتروني وأدخل عنواناً تتابعه بانتظام.",
    designTitle: "التصميم النهائي ومواصفات التصنيع",
    design:
      "راجع التصميم وألوان كل جزء والمقاس والكمية أدناه. تُحفظ الصورة والمواصفات المؤكدة مع الطلب لتصل إلى فريق التصنيع.",
    shipping:
      "تُشحن الطلبات الدولية عبر EMS للبريد الكوري. تشمل هذه الدفعة تكلفة الشحن حسب بلد الوجهة. يُحسب كل زوج كصندوق واحد بأبعاد 410×310×150 مم؛ وتُحسب الأزواج المتعددة كصناديق منفصلة.",
    duty: "لا تشمل هذه الدفعة الرسوم الجمركية والضرائب ورسوم التخليص. قد تُفرض تكاليف إضافية وفق أنظمة الوجهة. سنوضح إن كان السداد عند الاستلام أو قبل الشحن.",
    usDuty:
      "لا تشمل هذه الدفعة الرسوم الجمركية الأمريكية ورسوم التخليص. إذا كان على المرسل دفعها مقدماً، نقدم تقديراً قبل بدء التصنيع ونحصّل المبلغ النهائي بشكل منفصل قبل الشحن. يتم الشحن بعد سداد هذه التكاليف.",
    production:
      "يُصنع حسب الطلب. يُرجى توقع نحو 30 يوم عمل للتصنيع. يستغرق النقل الدولي والتخليص الجمركي وقتاً إضافياً.",
    agree:
      "راجعت التصميم النهائي والمقاس والكمية والمعلومات أعلاه. أفهم أن الشحن مشمول في هذه الدفعة، وأن الرسوم الجمركية والضرائب ورسوم التخليص قد تُحصّل بشكل منفصل.",
    missing: "التصميم النهائي غير موجود. أكده في المحاكي قبل الطلب.",
    simulator: "تأكيد التصميم في المحاكي",
    loading: "جارٍ تجهيز صورة التصميم لحفظها مع الطلب.",
    imageError: "تعذر تحميل صورة التصميم. أعد المحاولة ثم راجع التصميم.",
    retry: "إعادة المحاولة",
    unavailable: "لم تُؤكد تكلفة EMS العادي لهذه الدولة. تواصل معنا بشأن الشحن قبل الدفع.",
    notIncluded: "الجمارك والضرائب ورسوم التخليص غير مشمولة",
    confirmError: "راجع بيانات الاتصال والتصميم النهائي ثم أقر بمعلومات ما قبل الطلب.",
    price: "تُدفع أسعار المنتجات والشحن بالدولار الأمريكي.",
    paymentError:
      "تعذر تأكيد الدفع أو حفظ الطلب. لا تدفع مرة أخرى. تحقق من سجل PayPal ثم أعد محاولة حفظ الطلب.",
    saveError: "تعذر حفظ الطلب. راجع البيانات والاتصال وأعد المحاولة.",
    paymentLoading: "جارٍ تحميل PayPal.",
    paymentUnavailable: "PayPal غير متاح حالياً. حاول لاحقاً.",
    refresh: "تغيرت بيانات الطلب أو تكلفة الشحن. حدّث الصفحة وراجعها. لم يتم تحصيل أي دفعة.",
    contactLink: "استفسارات الشحن والتصنيع",
  },
};
export function checkoutCopy(locale: string): Copy {
  return CHECKOUT_COPY[locale as Locale] ?? CHECKOUT_COPY.en;
}
