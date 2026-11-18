type SimulatorUiCopy = {
  showGuide: string; hideGuide: string; enlarge: string; previewAlt: string;
  guide: string; confirm: string;
  sortFeatured: string; sortPriceAsc: string; sortPriceDesc: string; sortRating: string;
};
const COPY: Record<string, readonly string[]> = {
  ko: ["부위 표시", "부위 숨기기", "미리보기 확대", "지도칸 커스텀 복싱화 미리보기", "부위 표시 버튼을 눌러 각 부위를 확인하세요.", "디자인 확정 · 주문하기", "추천순", "낮은 가격순", "높은 가격순", "평점순"],
  en: ["Show parts", "Hide parts", "Enlarge preview", "JIDOKAAN custom boxing shoe preview", "Select Show parts to see the labels for each part.", "Confirm design · Continue", "Featured", "Price: low to high", "Price: high to low", "Top rated"],
  ja: ["パーツ名を表示", "パーツ名を非表示", "プレビューを拡大", "JIDOKAAN カスタムボクシングシューズのプレビュー", "「パーツ名を表示」を押すと、各パーツの位置を確認できます。", "デザインを確定して注文へ", "おすすめ順", "価格の安い順", "価格の高い順", "評価の高い順"],
  zh: ["显示部位", "隐藏部位", "放大预览", "JIDOKAAN 定制拳击鞋预览", "点击“显示部位”查看各部位标记。", "确认设计 · 继续下单", "推荐商品", "价格：从低到高", "价格：从高到低", "评分最高"],
  "zh-Hant": ["顯示部位", "隱藏部位", "放大預覽", "JIDOKAAN 訂製拳擊鞋預覽", "按「顯示部位」查看各部位標記。", "確認設計 · 繼續下單", "推薦商品", "價格由低至高", "價格由高至低", "評分最高"],
  es: ["Mostrar partes", "Ocultar partes", "Ampliar vista previa", "Vista previa de las botas de boxeo personalizadas JIDOKAAN", "Pulsa «Mostrar partes» para ver las etiquetas de cada parte.", "Confirmar diseño · Continuar", "Destacados", "Precio: menor a mayor", "Precio: mayor a menor", "Mejor valorados"],
  th: ["แสดงส่วนต่าง ๆ", "ซ่อนส่วนต่าง ๆ", "ขยายภาพตัวอย่าง", "ภาพตัวอย่างรองเท้ามวยสั่งทำ JIDOKAAN", "กด «แสดงส่วนต่าง ๆ» เพื่อดูป้ายกำกับแต่ละส่วน", "ยืนยันแบบ · สั่งซื้อต่อ", "สินค้าแนะนำ", "ราคาต่ำไปสูง", "ราคาสูงไปต่ำ", "คะแนนสูงสุด"],
  fr: ["Afficher les parties", "Masquer les parties", "Agrandir l’aperçu", "Aperçu des chaussures de boxe personnalisées JIDOKAAN", "Sélectionnez « Afficher les parties » pour repérer chaque partie.", "Confirmer le modèle · Continuer", "Sélection", "Prix croissant", "Prix décroissant", "Meilleures notes"],
  de: ["Bereiche anzeigen", "Bereiche ausblenden", "Vorschau vergrössern", "Vorschau der individuell gestalteten JIDOKAAN Boxschuhe", "Wählen Sie «Bereiche anzeigen», um die einzelnen Bereiche zu sehen.", "Design bestätigen · Weiter", "Empfohlen", "Preis aufsteigend", "Preis absteigend", "Beste Bewertungen"],
  ru: ["Показать детали", "Скрыть детали", "Увеличить изображение", "Предпросмотр боксёрской обуви JIDOKAAN по индивидуальному заказу", "Нажмите «Показать детали», чтобы увидеть обозначения частей обуви.", "Подтвердить дизайн · Далее", "Рекомендуемые", "Сначала дешевле", "Сначала дороже", "По рейтингу"],
  it: ["Mostra le parti", "Nascondi le parti", "Ingrandisci l’anteprima", "Anteprima delle scarpe da boxe personalizzate JIDOKAAN", "Seleziona «Mostra le parti» per vedere le etichette delle singole parti.", "Conferma il design · Continua", "In evidenza", "Prezzo crescente", "Prezzo decrescente", "Più votati"],
  pt: ["Mostrar partes", "Ocultar partes", "Ampliar prévia", "Prévia das botas de boxe personalizadas JIDOKAAN", "Selecione «Mostrar partes» para identificar cada parte.", "Confirmar design · Continuar", "Destaques", "Menor preço", "Maior preço", "Melhor avaliados"],
  tr: ["Bölümleri göster", "Bölümleri gizle", "Önizlemeyi büyüt", "JIDOKAAN kişiye özel boks ayakkabısı önizlemesi", "Her bölümün adını görmek için «Bölümleri göster» seçeneğine dokunun.", "Tasarımı onayla · Devam et", "Öne çıkanlar", "Fiyat: düşükten yükseğe", "Fiyat: yüksekten düşüğe", "En yüksek puanlı"],
  uz: ["Qismlarni ko‘rsatish", "Qismlarni yashirish", "Tasvirni kattalashtirish", "JIDOKAAN buyurtma asosida tayyorlanadigan boks oyoq kiyimining ko‘rinishi", "Har bir qismning belgisini ko‘rish uchun «Qismlarni ko‘rsatish» tugmasini bosing.", "Dizaynni tasdiqlash · Davom etish", "Tavsiya etilgan", "Narx: arzondan qimmatga", "Narx: qimmatdan arzonga", "Eng yuqori baholangan"],
  hi: ["हिस्से दिखाएँ", "हिस्से छिपाएँ", "प्रीव्यू बड़ा करें", "JIDOKAAN कस्टम बॉक्सिंग जूतों का प्रीव्यू", "हर हिस्से का नाम देखने के लिए «हिस्से दिखाएँ» दबाएँ।", "डिज़ाइन की पुष्टि करें · आगे बढ़ें", "चुनिंदा उत्पाद", "कीमत: कम से ज़्यादा", "कीमत: ज़्यादा से कम", "सबसे अच्छी रेटिंग"],
  tl: ["Ipakita ang mga bahagi", "Itago ang mga bahagi", "Palakihin ang larawan", "Preview ng pasadyang sapatos na pamboksing ng JIDOKAAN", "Piliin ang «Ipakita ang mga bahagi» upang makita ang mga label.", "Kumpirmahin ang disenyo · Magpatuloy", "Mga tampok", "Presyo: mababa hanggang mataas", "Presyo: mataas hanggang mababa", "Pinakamataas ang rating"],
  ar: ["إظهار الأجزاء", "إخفاء الأجزاء", "تكبير المعاينة", "معاينة حذاء الملاكمة المخصص من JIDOKAAN", "اختر «إظهار الأجزاء» لرؤية تسميات أجزاء الحذاء.", "تأكيد التصميم · متابعة", "منتجات مميزة", "السعر: من الأقل إلى الأعلى", "السعر: من الأعلى إلى الأقل", "الأعلى تقييماً"],
};
export function simulatorUiCopy(locale: string): SimulatorUiCopy {
  const [showGuide, hideGuide, enlarge, previewAlt, guide, confirm, sortFeatured, sortPriceAsc, sortPriceDesc, sortRating] = COPY[locale] ?? COPY.en;
  return { showGuide, hideGuide, enlarge, previewAlt, guide, confirm, sortFeatured, sortPriceAsc, sortPriceDesc, sortRating };
}


const ORDER_UI: Record<string, readonly [string, string, string]> = {
  ko: ["커스텀 스튜디오", "신용·체크카드", "계좌이체"],
  en: ["Custom Studio", "Credit or debit card", "Bank transfer"],
  ja: ["カスタムスタジオ", "クレジット・デビットカード", "銀行振込"],
  zh: ["定制工作室", "信用卡或借记卡", "银行转账"],
  "zh-Hant": ["訂製工作室", "信用卡或扣賬卡", "銀行轉賬"],
  es: ["Estudio de personalización", "Tarjeta de crédito o débito", "Transferencia bancaria"],
  th: ["สตูดิโอออกแบบ", "บัตรเครดิตหรือเดบิต", "โอนเงินผ่านธนาคาร"],
  fr: ["Atelier de personnalisation", "Carte de crédit ou de débit", "Virement bancaire"],
  de: ["Designstudio", "Kredit- oder Debitkarte", "Banküberweisung"],
  ru: ["Студия дизайна", "Банковская карта", "Банковский перевод"],
  it: ["Studio di personalizzazione", "Carta di credito o debito", "Bonifico bancario"],
  pt: ["Estúdio de personalização", "Cartão de crédito ou débito", "Transferência bancária"],
  tr: ["Tasarım stüdyosu", "Kredi veya banka kartı", "Banka havalesi"],
  uz: ["Dizayn studiyasi", "Bank kartasi", "Bank o‘tkazmasi"],
  hi: ["कस्टम डिज़ाइन स्टूडियो", "क्रेडिट या डेबिट कार्ड", "बैंक ट्रांसफ़र"],
  tl: ["Studio ng disenyo", "Credit o debit card", "Paglilipat sa bangko"],
  ar: ["استوديو التصميم", "بطاقة ائتمان أو خصم", "تحويل بنكي"],
};
export function orderUiCopy(locale: string) {
  const [studio, payCard, payTransfer] = ORDER_UI[locale] ?? ORDER_UI.en;
  return { studio, payCard, payTransfer };
}
