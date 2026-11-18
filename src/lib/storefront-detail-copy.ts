// Display text only. Stored SKU values, model IDs and material identifiers stay unchanged.
const keys = ["notFound","backShop","chooseOption","optionUnavailable","stock","soldOut","chooseAll","modelHigh","modelMid","model","special","saveDesign","saving","saveError","invalidLink","loading","materialError","laces","beads","none","mesh","blueLeopard","apparel","shoes","accessories","type","cooling","towel","decrease","increase","galleryImage"] as const;
const rows: Record<string, string[]> = {
  ko: ["상품을 찾을 수 없습니다.","샵으로","옵션 선택","선택할 수 없는 옵션입니다.","재고 {n}개","품절","옵션을 모두 선택해 주세요.","장목","중목","모델 선택","스페셜","스페셜 시안 저장","저장 중…","시안을 저장하지 못했습니다. 다시 시도해 주세요.","유효한 공유 링크로 다시 접속해 주세요.","스페셜 소재를 불러오는 중…","소재 이미지를 불러오지 못했습니다. 스페셜을 껐다가 다시 켜 주세요.","신발끈","비즈","없음","메쉬","블루레오파드","의류","신발","액세서리","종류","쿨링타입(나일론)","타올타입(면)","수량 줄이기","수량 늘리기","제품 사진 {n}"],
  en: ["Product not found.","Back to shop","Select an option","This option is unavailable.","{n} in stock","Sold out","Please select all options.","High-cut","Mid-cut","Choose a model","Special","Save special design","Saving…","Could not save the design. Please try again.","Please open a valid shared link.","Loading special materials…","Could not load the material images. Turn Special off and on to try again.","Shoelaces","Beads","None","Mesh","Blue leopard","Apparel","Shoes","Accessories","Type","Cooling (nylon)","Towel (cotton)","Decrease quantity","Increase quantity","Product image {n}"],
  ja: ["商品が見つかりません。","ショップへ戻る","オプションを選択","このオプションは選択できません。","在庫{n}点","在庫切れ","すべてのオプションを選択してください。","ハイカット","ミッドカット","モデルを選択","スペシャル","スペシャルデザインを保存","保存中…","デザインを保存できませんでした。もう一度お試しください。","有効な共有リンクからアクセスしてください。","スペシャル素材を読み込み中…","素材画像を読み込めませんでした。スペシャルを一度オフにして再度オンにしてください。","靴ひも","ビーズ","なし","メッシュ","ブルーレオパード","ウェア","シューズ","アクセサリー","種類","クーリング（ナイロン）","タオル（綿）","数量を減らす","数量を増やす","商品画像{n}"],
  zh: ["未找到商品。","返回商店","请选择选项","此选项不可用。","库存{n}件","售罄","请选择所有选项。","高帮","中帮","选择款式","特别定制","保存特别定制设计","保存中…","无法保存设计，请重试。","请通过有效的分享链接访问。","正在加载特别定制材质…","无法加载材质图片，请关闭特别定制后重新开启。","鞋带","珠饰","无","网布","蓝色豹纹","服装","鞋类","配件","类型","凉感款（尼龙）","毛巾款（棉）","减少数量","增加数量","商品图片{n}"],
  "zh-Hant": ["未找到商品。","返回商店","請選擇選項","此選項不可用。","庫存{n}件","售罄","請選擇所有選項。","高幫","中幫","選擇款式","特別訂製","保存特別訂製設計","保存中…","無法保存設計，請重試。","請使用有效的分享連結開啟。","正在載入特別訂製材質…","無法載入材質圖片，請關閉特別訂製後重新開啟。","鞋帶","珠飾","無","網布","藍色豹紋","服裝","鞋類","配件","類型","涼感款（尼龍）","毛巾款（棉）","減少數量","增加數量","商品圖片{n}"],
  es: ["Producto no encontrado.","Volver a la tienda","Selecciona una opción","Esta opción no está disponible.","{n} disponibles","Agotado","Selecciona todas las opciones.","Caña alta","Caña media","Elige un modelo","Especial","Guardar diseño especial","Guardando…","No se pudo guardar el diseño. Inténtalo de nuevo.","Abre un enlace compartido válido.","Cargando materiales especiales…","No se pudieron cargar las imágenes. Desactiva y vuelve a activar Especial.","Cordones","Cuentas","Ninguno","Malla","Leopardo azul","Ropa","Calzado","Accesorios","Tipo","Refrescante (nailon)","Toalla (algodón)","Reducir cantidad","Aumentar cantidad","Imagen del producto {n}"],
  fr: ["Produit introuvable.","Retour à la boutique","Choisir une option","Cette option est indisponible.","{n} en stock","Épuisé","Veuillez sélectionner toutes les options.","Tige haute","Tige mi-haute","Choisir un modèle","Spécial","Enregistrer le modèle spécial","Enregistrement…","Impossible d’enregistrer le modèle. Réessayez.","Veuillez ouvrir un lien de partage valide.","Chargement des matières spéciales…","Impossible de charger les images. Désactivez puis réactivez Spécial.","Lacets","Perles","Aucun","Maille","Léopard bleu","Vêtements","Chaussures","Accessoires","Type","Rafraîchissant (nylon)","Éponge (coton)","Réduire la quantité","Augmenter la quantité","Photo du produit {n}"],
  de: ["Produkt nicht gefunden.","Zurück zum Shop","Option auswählen","Diese Option ist nicht verfügbar.","{n} auf Lager","Ausverkauft","Bitte alle Optionen auswählen.","Hoher Schaft","Mittelhoher Schaft","Modell auswählen","Spezial","Spezialdesign speichern","Wird gespeichert…","Design konnte nicht gespeichert werden. Bitte erneut versuchen.","Bitte einen gültigen Freigabelink öffnen.","Spezialmaterialien werden geladen…","Materialbilder konnten nicht geladen werden. Spezial aus- und wieder einschalten.","Schnürsenkel","Perlen","Keine","Mesh","Blauer Leopard","Bekleidung","Schuhe","Zubehör","Typ","Kühlend (Nylon)","Frottee (Baumwolle)","Menge verringern","Menge erhöhen","Produktbild {n}"],
  it: ["Prodotto non trovato.","Torna al negozio","Seleziona un’opzione","Questa opzione non è disponibile.","{n} disponibili","Esaurito","Seleziona tutte le opzioni.","Taglio alto","Taglio medio","Scegli un modello","Speciale","Salva il design speciale","Salvataggio…","Impossibile salvare il design. Riprova.","Apri un link di condivisione valido.","Caricamento dei materiali speciali…","Impossibile caricare le immagini. Disattiva e riattiva Speciale.","Lacci","Perline","Nessuno","Rete","Leopardo blu","Abbigliamento","Scarpe","Accessori","Tipo","Rinfrescante (nylon)","Spugna (cotone)","Riduci quantità","Aumenta quantità","Immagine del prodotto {n}"],
  pt: ["Produto não encontrado.","Voltar à loja","Selecione uma opção","Esta opção não está disponível.","{n} em estoque","Esgotado","Selecione todas as opções.","Cano alto","Cano médio","Escolha um modelo","Especial","Salvar design especial","Salvando…","Não foi possível salvar o design. Tente novamente.","Abra um link de compartilhamento válido.","Carregando materiais especiais…","Não foi possível carregar as imagens. Desative e reative Especial.","Cadarços","Contas","Nenhum","Tela","Leopardo azul","Roupas","Calçados","Acessórios","Tipo","Refrescante (nylon)","Atoalhado (algodão)","Diminuir quantidade","Aumentar quantidade","Imagem do produto {n}"],
  ru: ["Товар не найден.","Вернуться в магазин","Выберите вариант","Этот вариант недоступен.","В наличии: {n}","Нет в наличии","Выберите все параметры.","Высокие","Средней высоты","Выбрать модель","Специальные","Сохранить специальный дизайн","Сохранение…","Не удалось сохранить дизайн. Повторите попытку.","Откройте действительную ссылку общего доступа.","Загрузка специальных материалов…","Не удалось загрузить изображения. Выключите и снова включите специальный режим.","Шнурки","Бусины","Нет","Сетка","Синий леопард","Одежда","Обувь","Аксессуары","Тип","Охлаждающий (нейлон)","Махровый (хлопок)","Уменьшить количество","Увеличить количество","Фото товара {n}"],
  tr: ["Ürün bulunamadı.","Mağazaya dön","Bir seçenek seçin","Bu seçenek kullanılamıyor.","Stokta {n} adet","Tükendi","Lütfen tüm seçenekleri seçin.","Yüksek bilekli","Orta bilekli","Model seçin","Özel","Özel tasarımı kaydet","Kaydediliyor…","Tasarım kaydedilemedi. Lütfen tekrar deneyin.","Lütfen geçerli bir paylaşım bağlantısı açın.","Özel malzemeler yükleniyor…","Malzeme görselleri yüklenemedi. Özel modunu kapatıp yeniden açın.","Bağcıklar","Boncuklar","Yok","File","Mavi leopar","Giyim","Ayakkabı","Aksesuarlar","Tür","Serinletici (naylon)","Havlu (pamuk)","Adedi azalt","Adedi artır","Ürün görseli {n}"],
  uz: ["Mahsulot topilmadi.","Do‘konga qaytish","Variantni tanlang","Bu variant mavjud emas.","Omborda {n} dona","Tugagan","Barcha variantlarni tanlang.","Baland qo‘njli","O‘rta qo‘njli","Modelni tanlang","Maxsus","Maxsus dizaynni saqlash","Saqlanmoqda…","Dizayn saqlanmadi. Qayta urinib ko‘ring.","Yaroqli ulashilgan havolani oching.","Maxsus materiallar yuklanmoqda…","Material rasmlari yuklanmadi. Maxsus rejimni o‘chirib, qayta yoqing.","Oyoq kiyim bog‘ichlari","Munchoqlar","Yo‘q","To‘r","Ko‘k leopard","Kiyim","Oyoq kiyim","Aksessuarlar","Tur","Salqinlashtiruvchi (neylon)","Sochiq mato (paxta)","Miqdorni kamaytirish","Miqdorni oshirish","Mahsulot rasmi {n}"],
  th: ["ไม่พบสินค้า","กลับไปที่ร้าน","เลือกตัวเลือก","ตัวเลือกนี้ไม่พร้อมจำหน่าย","มีสินค้า {n} ชิ้น","สินค้าหมด","โปรดเลือกให้ครบทุกตัวเลือก","ข้อสูง","ข้อกลาง","เลือกรุ่น","พิเศษ","บันทึกดีไซน์พิเศษ","กำลังบันทึก…","บันทึกดีไซน์ไม่สำเร็จ โปรดลองอีกครั้ง","โปรดเปิดลิงก์แชร์ที่ถูกต้อง","กำลังโหลดวัสดุพิเศษ…","โหลดภาพวัสดุไม่สำเร็จ โปรดปิดแล้วเปิดโหมดพิเศษอีกครั้ง","เชือกรองเท้า","ลูกปัด","ไม่มี","ผ้าตาข่าย","ลายเสือดาวสีน้ำเงิน","เสื้อผ้า","รองเท้า","อุปกรณ์เสริม","ประเภท","แบบเย็น (ไนลอน)","แบบผ้าขนหนู (ฝ้าย)","ลดจำนวน","เพิ่มจำนวน","ภาพสินค้า {n}"],
  hi: ["उत्पाद नहीं मिला।","दुकान पर वापस जाएँ","विकल्प चुनें","यह विकल्प उपलब्ध नहीं है।","{n} उपलब्ध","स्टॉक खत्म","कृपया सभी विकल्प चुनें।","ऊँचे कट वाला","मध्यम कट वाला","मॉडल चुनें","स्पेशल","स्पेशल डिज़ाइन सहेजें","सहेजा जा रहा है…","डिज़ाइन सहेजा नहीं जा सका। दोबारा कोशिश करें।","कृपया मान्य साझा लिंक खोलें।","स्पेशल सामग्री लोड हो रही है…","सामग्री के चित्र लोड नहीं हुए। स्पेशल मोड बंद करके फिर चालू करें।","जूते के फीते","मोती","कोई नहीं","जाली","नीला तेंदुआ पैटर्न","कपड़े","जूते","एक्सेसरीज़","प्रकार","ठंडक देने वाला (नायलॉन)","तौलिया (सूती)","मात्रा घटाएँ","मात्रा बढ़ाएँ","उत्पाद का चित्र {n}"],
  tl: ["Hindi nakita ang produkto.","Bumalik sa tindahan","Pumili ng opsyon","Hindi available ang opsyong ito.","{n} ang available","Ubos na","Piliin ang lahat ng opsyon.","Mataas ang hiwa","Katamtaman ang hiwa","Pumili ng modelo","Espesyal","I-save ang espesyal na disenyo","Sine-save…","Hindi na-save ang disenyo. Subukan ulit.","Magbukas ng wastong shared link.","Nilo-load ang espesyal na materyales…","Hindi na-load ang mga larawan. I-off at i-on muli ang Espesyal.","Sintás","Mga bead","Wala","Mesh","Asul na leopardo","Damit","Sapatos","Mga aksesorya","Uri","Cooling (nylon)","Tuwalya (cotton)","Bawasan ang dami","Dagdagan ang dami","Larawan ng produkto {n}"],
};
export function storefrontDetailCopy(locale: string) {
  const row = rows[locale] ?? rows.en;
  return Object.fromEntries(keys.map((key,i)=>[key,row[i]])) as Record<typeof keys[number],string>;
}

const colors: Record<string, string[]> = {
  ko: ["블랙","화이트","레드","블루","네이비","골드","실버","브라운","와인"],
  en: ["Black","White","Red","Blue","Navy","Gold","Silver","Brown","Wine"],
  ja: ["ブラック","ホワイト","レッド","ブルー","ネイビー","ゴールド","シルバー","ブラウン","ワイン"],
  zh: ["黑色","白色","红色","蓝色","藏青色","金色","银色","棕色","酒红色"],
  "zh-Hant": ["黑色","白色","紅色","藍色","藏青色","金色","銀色","棕色","酒紅色"],
  es: ["Negro","Blanco","Rojo","Azul","Azul marino","Dorado","Plateado","Marrón","Burdeos"],
  fr: ["Noir","Blanc","Rouge","Bleu","Bleu marine","Or","Argent","Marron","Bordeaux"],
  de: ["Schwarz","Weiß","Rot","Blau","Marineblau","Gold","Silber","Braun","Weinrot"],
  it: ["Nero","Bianco","Rosso","Blu","Blu navy","Oro","Argento","Marrone","Bordeaux"],
  pt: ["Preto","Branco","Vermelho","Azul","Azul-marinho","Dourado","Prateado","Marrom","Vinho"],
  ru: ["Чёрный","Белый","Красный","Синий","Тёмно-синий","Золотой","Серебряный","Коричневый","Винный"],
  tr: ["Siyah","Beyaz","Kırmızı","Mavi","Lacivert","Altın","Gümüş","Kahverengi","Bordo"],
  uz: ["Qora","Oq","Qizil","Ko‘k","To‘q ko‘k","Oltin","Kumush","Jigarrang","Bordo"],
  th: ["ดำ","ขาว","แดง","น้ำเงิน","กรมท่า","ทอง","เงิน","น้ำตาล","แดงไวน์"],
  hi: ["काला","सफेद","लाल","नीला","गहरा नीला","सुनहरा","चाँदी","भूरा","वाइन"],
  tl: ["Itim","Puti","Pula","Asul","Navy","Ginto","Pilak","Kayumanggi","Wine"],
};
/** Translate known display labels while preserving original option keys for checkout. */
export function productOptionLabel(value: string, locale: string, colorLabel?: string) {
  const index = colors.ko.indexOf(value);
  if (index >= 0) return (colors[locale] ?? colors.en)[index];
  const c = storefrontDetailCopy(locale);
  if (value === "컬러" || value === "색상") return colorLabel ?? value;
  if (value === "종류") return c.type;
  if (value === "바이퍼두건 쿨링타입(나일론)") return c.cooling;
  if (value === "바이퍼두건 타올타입(면)") return c.towel;
  return value;
}
export function productCategoryLabel(id: string, name: string, locale: string) {
  const c = storefrontDetailCopy(locale);
  const defaults: Record<string,string> = { apparel:"의류",shoes:"신발",etc:"기타" };
  if (name !== defaults[id]) return name;
  return ({apparel:c.apparel,shoes:c.shoes,etc:c.accessories} as Record<string,string>)[id] ?? name;
}

const extraColors: Record<string,string[]> = {
  en: ["Orange","Yellow","Green","Purple","Mint","Aqua","Pink","Sky blue","Gray","Hot pink"],
  ko: ["오렌지","옐로우","그린","퍼플","민트","아쿠아","핑크","스카이블루","그레이","핫핑크"],
  ja: ["オレンジ","イエロー","グリーン","パープル","ミント","アクア","ピンク","スカイブルー","グレー","ホットピンク"],
  zh: ["橙色","黄色","绿色","紫色","薄荷绿","水蓝色","粉色","天蓝色","灰色","亮粉色"],
  "zh-Hant": ["橙色","黃色","綠色","紫色","薄荷綠","水藍色","粉色","天藍色","灰色","亮粉色"],
  es: ["Naranja","Amarillo","Verde","Morado","Menta","Aguamarina","Rosa","Azul cielo","Gris","Rosa intenso"],
  fr: ["Orange","Jaune","Vert","Violet","Menthe","Aqua","Rose","Bleu ciel","Gris","Rose vif"],
  de: ["Orange","Gelb","Grün","Violett","Mint","Aqua","Rosa","Himmelblau","Grau","Pink"],
  it: ["Arancione","Giallo","Verde","Viola","Menta","Acqua","Rosa","Azzurro cielo","Grigio","Rosa acceso"],
  pt: ["Laranja","Amarelo","Verde","Roxo","Menta","Água","Rosa","Azul-celeste","Cinza","Rosa-choque"],
  ru: ["Оранжевый","Жёлтый","Зелёный","Фиолетовый","Мятный","Аквамарин","Розовый","Небесно-голубой","Серый","Ярко-розовый"],
  tr: ["Turuncu","Sarı","Yeşil","Mor","Nane","Turkuaz","Pembe","Gök mavisi","Gri","Canlı pembe"],
  uz: ["To‘q sariq","Sariq","Yashil","Binafsha","Yalpiz","Moviy","Pushti","Osmonrang","Kulrang","Yorqin pushti"],
  th: ["ส้ม","เหลือง","เขียว","ม่วง","มิ้นต์","ฟ้าอมเขียว","ชมพู","ฟ้า","เทา","ชมพูสด"],
  hi: ["नारंगी","पीला","हरा","बैंगनी","मिंट","एक्वा","गुलाबी","आसमानी","धूसर","चटक गुलाबी"],
  tl: ["Kahel","Dilaw","Berde","Lila","Mint","Aqua","Rosas","Asul na langit","Abo","Matingkad na rosas"],
};
export function simulatorColorLabel(name: string, locale: string) {
  if (name === "NONE") return storefrontDetailCopy(locale).none;
  const basic = colors.en.findIndex(value => value.toUpperCase() === name);
  if (basic >= 0) return (colors[locale] ?? colors.en)[basic];
  const extra = extraColors.en.findIndex(value => value.toUpperCase() === name);
  if (extra >= 0) return (extraColors[locale] ?? extraColors.en)[extra];
  return name; // Unique pattern/catalog identifiers are preserved, never rewritten in saved designs.
}

const shippingRows: Record<string,[string,string]> = {
  ko:["지원 국가로 EMS 배송","배송 국가를 선택하면 결제 전에 배송비를 확인할 수 있습니다."],
  en:["EMS delivery to supported destinations","Select a delivery country to see shipping costs before payment."],
  ja:["対応国へEMSで配送","配送先の国を選ぶと、お支払い前に送料を確認できます。"],
  zh:["通过EMS寄往支持的目的地","选择收货国家后，即可在付款前查看运费。"],
  "zh-Hant": ["透過EMS寄往支持的目的地","選擇收貨國家後，即可在付款前查看運費。"],
  es:["Envío EMS a destinos admitidos","Selecciona el país de entrega para ver el coste de envío antes de pagar."],
  fr:["Livraison EMS vers les destinations desservies","Sélectionnez le pays de livraison pour connaître les frais avant de payer."],
  de:["EMS-Versand in unterstützte Länder","Wähle das Lieferland, um die Versandkosten vor der Zahlung zu sehen."],
  it:["Spedizione EMS verso le destinazioni servite","Seleziona il paese di consegna per vedere le spese di spedizione prima di pagare."],
  pt:["Entrega EMS para destinos atendidos","Selecione o país de entrega para ver o frete antes de pagar."],
  ru:["Доставка EMS в поддерживаемые страны","Выберите страну доставки, чтобы увидеть стоимость до оплаты."],
  tr:["Desteklenen ülkelere EMS teslimatı","Ödeme öncesinde kargo ücretini görmek için teslimat ülkesini seçin."],
  uz:["Qo‘llab-quvvatlanadigan mamlakatlarga EMS orqali yetkazish","To‘lovdan oldin yetkazish narxini ko‘rish uchun mamlakatni tanlang."],
  th:["จัดส่ง EMS ไปยังประเทศที่รองรับ","เลือกประเทศปลายทางเพื่อดูค่าจัดส่งก่อนชำระเงิน"],
  hi:["समर्थित देशों में EMS डिलीवरी","भुगतान से पहले शिपिंग खर्च देखने के लिए डिलीवरी देश चुनें।"],
  tl:["EMS delivery sa mga suportadong destinasyon","Piliin ang bansang padadalhan para makita ang shipping fee bago magbayad."],
};
export function productShippingCopy(locale: string) {
  const [title,body] = shippingRows[locale] ?? shippingRows.en;
  return {title,body};
}
