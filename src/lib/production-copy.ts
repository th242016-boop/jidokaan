/** Current made-to-order shoe estimate; historical order acknowledgements remain unchanged. */
const PRODUCTION_COPY: Record<string, { average: string; notice: string }> = {
  ko: { average: "평균 15~21일", notice: "주문 후 제작하며, 제작 기간은 평균 15~21일입니다. 주문량과 소재 수급에 따라 달라질 수 있으며, 국제 배송과 통관에 걸리는 시간은 별도입니다." },
  en: { average: "Average 15–21 days", notice: "Made to order. Production takes an average of 15–21 days and can vary with order volume and material availability. International shipping and customs clearance take additional time." },
  ja: { average: "平均15～21日", notice: "受注製作です。製作期間は平均15～21日で、注文数や素材の調達状況によって変わる場合があります。国際配送と通関にかかる日数は別途必要です。" },
  es: { average: "De 15 a 21 días en promedio", notice: "Fabricado por encargo. La producción tarda de 15 a 21 días en promedio y puede variar según el volumen de pedidos y la disponibilidad de materiales. El envío internacional y la aduana requieren tiempo adicional." },
  th: { average: "เฉลี่ย 15–21 วัน", notice: "ผลิตตามคำสั่งซื้อ ระยะเวลาผลิตเฉลี่ย 15–21 วัน และอาจเปลี่ยนแปลงตามจำนวนคำสั่งซื้อและวัสดุที่มี ระยะเวลาขนส่งระหว่างประเทศและผ่านศุลกากรเป็นเวลาเพิ่มเติม" },
  fr: { average: "15 à 21 jours en moyenne", notice: "Fabrication sur commande. La fabrication prend 15 à 21 jours en moyenne et peut varier selon le volume de commandes et la disponibilité des matériaux. Le transport international et le dédouanement nécessitent un délai supplémentaire." },
  de: { average: "Durchschnittlich 15–21 Tage", notice: "Anfertigung auf Bestellung. Die Herstellung dauert durchschnittlich 15–21 Tage und kann je nach Auftragslage und Materialverfügbarkeit variieren. Internationaler Versand und Zollabfertigung benötigen zusätzliche Zeit." },
  ru: { average: "В среднем от 15 до 21 дня", notice: "Изготовление на заказ занимает в среднем от 15 до 21 дня. Срок может меняться в зависимости от количества заказов и наличия материалов. Международная доставка и таможенное оформление требуют дополнительного времени." },
  it: { average: "In media 15–21 giorni", notice: "Produzione su ordinazione. La lavorazione richiede in media 15–21 giorni e può variare in base al numero di ordini e alla disponibilità dei materiali. La spedizione internazionale e lo sdoganamento richiedono tempo aggiuntivo." },
  pt: { average: "Em média 15–21 dias", notice: "Feito sob encomenda. A produção leva em média 15–21 dias e pode variar conforme o volume de pedidos e a disponibilidade dos materiais. O transporte internacional e o desembaraço aduaneiro exigem tempo adicional." },
  tr: { average: "Ortalama 15–21 gün", notice: "Sipariş üzerine üretilir. Üretim ortalama 15–21 gün sürer; sipariş yoğunluğuna ve malzeme durumuna göre değişebilir. Uluslararası taşıma ve gümrük işlemleri ayrıca zaman alır." },
  uz: { average: "O‘rtacha 15–21 kun", notice: "Buyurtma asosida tayyorlanadi. Tayyorlash o‘rtacha 15–21 kun davom etadi va buyurtmalar soni hamda materiallar mavjudligiga qarab o‘zgarishi mumkin. Xalqaro yetkazib berish va bojxona ishlari uchun qo‘shimcha vaqt kerak." },
  zh: { average: "平均15～21天", notice: "本产品按订单制作，制作时间平均为15～21天，可能随订单量和材料供应情况变化。国际运输及清关时间另计。" },
  "zh-Hant": { average: "平均15～21天", notice: "本產品按訂單製作，製作時間平均為15～21天，可能隨訂單量和材料供應情況變化。國際運輸及清關時間另計。" },
  hi: { average: "औसतन 15–21 दिन", notice: "ऑर्डर मिलने पर बनाया जाता है। बनाने में औसतन 15–21 दिन लगते हैं और ऑर्डरों की संख्या तथा सामग्री की उपलब्धता के अनुसार समय बदल सकता है। अंतरराष्ट्रीय शिपिंग और कस्टम क्लियरेंस में अतिरिक्त समय लगता है।" },
  tl: { average: "Sa karaniwan, 15–21 araw", notice: "Ginagawa ayon sa order. Sa karaniwan, tumatagal ng 15–21 araw ang paggawa at maaaring magbago ayon sa dami ng order at pagkakaroon ng materyales. May dagdag na oras para sa international shipping at customs clearance." },
  ar: { average: "من 15 إلى 21 يوماً في المتوسط", notice: "يُصنع حسب الطلب. يستغرق التصنيع من 15 إلى 21 يوماً في المتوسط، وقد تختلف المدة بحسب عدد الطلبات وتوفر المواد. يستغرق الشحن الدولي والتخليص الجمركي وقتاً إضافياً." },
};
export function productionCopy(locale: string) {
  return PRODUCTION_COPY[locale] ?? PRODUCTION_COPY.en;
}
