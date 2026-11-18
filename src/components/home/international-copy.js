import { specialOrderCopy } from "../../lib/special-order-copy";
import { internationalOrderPolicy, internationalOrderPolicyHtml } from "../../lib/international-order-policy";
import { internationalShoppingCopy } from '../../lib/international-shopping-copy';
import { checkoutEnhancementsCopy } from '../../lib/checkout-enhancements-copy';
import { isActiveSalesCountry } from '../../lib/active-sales-policy';
import { JAPAN_SPECIAL_PRICE_JPY } from '../../lib/order-money';

const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

// These prices depend on the delivery destination, never on the display language.
// Consultation uses Naver/customer service for Korea, and Instagram DM overseas.
const specialMessages = {
  ko: ['다른 가죽과 특수 패턴·무늬 소재를 활용한 제작 예시입니다.', '해외 스페셜오더 기본가 {price}. 배송비 및 해당 국가의 관부가세는 별도입니다.'],
  en: ['Examples made with alternative leathers and materials with special patterns or textures.', 'International special-order base price: {price}. Shipping and any applicable import duties and taxes are additional.'],
  ja: ['通常とは異なるレザーや、特殊な柄・模様の素材を使用した製作例です。', '海外向けスペシャルオーダーの基本価格は{price}です。送料および該当する輸入関税・税金は別途となります。'],
  zh: ['采用其他皮革及特殊图案、纹理材质的制作示例。', '海外特别定制基础价格为{price}。运费及适用的进口关税、税费另计。'],
  "zh-Hant": ['採用其他皮革及特殊圖案、紋理材質的製作示例。', '海外特別訂製基礎價格為{price}。運費及適用的進口關稅、稅費另計。'],
  es: ['Ejemplos realizados con otros cueros y materiales con estampados o texturas especiales.', 'Precio base del pedido especial internacional: {price}. El envío y los aranceles e impuestos de importación aplicables se cobran aparte.'],
  fr: ['Exemples réalisés avec d’autres cuirs et des matières aux motifs ou textures particuliers.', 'Prix de base d’une commande spéciale internationale : {price}. Les frais de livraison et les droits et taxes d’importation éventuels sont en supplément.'],
  de: ['Beispiele aus anderen Ledern und Materialien mit besonderen Mustern oder Strukturen.', 'Grundpreis einer internationalen Sonderanfertigung: {price}. Versand sowie gegebenenfalls Einfuhrzölle und Steuern kommen hinzu.'],
  it: ['Esempi realizzati con altre pelli e materiali con motivi o texture particolari.', 'Prezzo base dell’ordine speciale internazionale: {price}. Spedizione ed eventuali dazi e imposte di importazione sono esclusi.'],
  pt: ['Exemplos feitos com outros couros e materiais com padrões ou texturas especiais.', 'Preço base do pedido especial internacional: {price}. Frete e eventuais tarifas e impostos de importação são cobrados à parte.'],
  ru: ['Примеры из других видов кожи и материалов с особыми узорами или фактурами.', 'Базовая цена международного специального заказа: {price}. Доставка и применимые импортные пошлины и налоги оплачиваются отдельно.'],
  tr: ['Farklı deriler ve özel desenli veya dokulu malzemelerle üretilmiş örnekler.', 'Uluslararası özel sipariş başlangıç fiyatı: {price}. Kargo ve geçerli ithalat vergileri ayrıca ödenir.'],
  uz: ['Boshqa charm turlari hamda maxsus naqsh yoki teksturali materiallardan tayyorlangan namunalar.', 'Xalqaro maxsus buyurtmaning boshlang‘ich narxi: {price}. Yetkazib berish, tegishli import bojlari va soliqlar alohida to‘lanadi.'],
  th: ['ตัวอย่างที่ผลิตด้วยหนังชนิดอื่นและวัสดุที่มีลวดลายหรือพื้นผิวพิเศษ', 'ราคาเริ่มต้นสำหรับสเปเชียลออร์เดอร์ระหว่างประเทศ: {price} ไม่รวมค่าจัดส่ง อากรและภาษีนำเข้าที่เกี่ยวข้อง'],
  hi: ['अन्य चमड़े और विशेष पैटर्न या बनावट वाली सामग्री से बनाए गए उदाहरण।', 'अंतरराष्ट्रीय स्पेशल ऑर्डर की शुरुआती कीमत: {price}। शिपिंग और लागू आयात शुल्क व कर अतिरिक्त हैं।'],
  tl: ['Mga halimbawang gawa sa ibang uri ng katad at materyales na may espesyal na pattern o texture.', 'Batayang presyo ng international special order: {price}. Hiwalay ang shipping at anumang naaangkop na buwis at singil sa pag-import.'],
  ar: ['نماذج مصنوعة من أنواع جلد أخرى ومواد ذات نقوش أو ملمس مميز.', 'السعر الأساسي للطلب الخاص الدولي: {price}. تُضاف تكاليف الشحن وأي رسوم جمركية وضرائب استيراد سارية.'],
};

export function specialOrderHomeCopy(locale, shippingCountry = '') {
  const [description, priceTemplate] = specialMessages[locale] ?? specialMessages.en;
  const country = shippingCountry.trim().toUpperCase();
  const special = specialOrderCopy(locale, country);
  const consultation = special.notice;
  const price = country === 'KR' ? 'KRW 318,000' : country === 'JP'
    ? `JPY ${new Intl.NumberFormat('en-US').format(JAPAN_SPECIAL_PRICE_JPY)}`
    : 'USD 280';
  const priceNotice = (country === 'KR' ? special.domesticBasePrice : priceTemplate).replace('{price}', price);
  return {
    specialContact: `${special.special} · ${special.contactLabel} ↗`,
    specialGalleryDescription: `${description} ${consultation} ${priceNotice}`,
    specialExampleProduct: `${description} ${consultation} ${priceNotice}`,
    specialDescription: `${escape(description)}<br><br><strong style="color:#f87171">${escape(consultation)}</strong><br><br><strong>${escape(priceNotice)}</strong>`,
  };
}

/** Delivery country selects the ordering flow; display language never does. */
export function internationalHomeCopy(locale, shippingCountry = '') {
  const c = internationalShoppingCopy(locale);
  const country = shippingCountry.trim().toUpperCase();
  const domestic = country === 'KR';
  const unavailable = Boolean(country) && !isActiveSalesCountry(country);
  const unavailableNotice = checkoutEnhancementsCopy(locale).salesUnavailable;
  const steps = domestic ? [c.steps[0], 'Naver Smart Store', 'Naver TalkTalk'] : c.steps;
  const details = domestic ? [c.stepDetails[0], c.domestic, c.domesticFollowup] : c.stepDetails;
  return {
    ...specialOrderHomeCopy(locale, country),
    language: c.language,
    navOrder: c.startDesign,
    navOrderArrow: `${escape(c.startDesign)} <span aria-hidden="true">↗</span>`,
    mobileOrder: `${escape(c.startDesign)} <span aria-hidden="true">↗</span>`,
    orderButton: `${escape(c.startDesign)} <span aria-hidden="true">↗</span>`,
    orderNote: unavailable ? unavailableNotice : domestic ? c.domesticFollowup : c.contact,
    process1: steps[0], process1Description: details[0],
    process2: unavailable ? c.shipTo : steps[1], process2Description: unavailable ? unavailableNotice : details[1],
    process3: unavailable ? c.chooseCountry : steps[2], process3Description: unavailable ? c.unknownCountry : details[2],
    faqQ1: c.faqOrder,
    faqA1: unavailable
      ? `<p>${escape(unavailableNotice)}</p><p>${escape(c.unknownCountry)}</p>`
      : `${!country ? `<p>${escape(c.unknownCountry)}</p>` : ''}<ol>${details.map((step) => `<li>${escape(step)}</li>`).join('')}</ol>${!domestic ? `<p>${escape(c.guest)}</p><p>${escape(c.contact)}</p>` : ''}`,
    ...(country && !domestic ? { faqQ4: internationalOrderPolicy(locale).title, faqA4: internationalOrderPolicyHtml(locale) } : {}),
    faqQ2: c.faqTiming,
    faqA2: `<p><strong>${escape(c.productionLabel)}: ${escape(c.production)}</strong></p>${domestic ? '' : `<p>${escape(c.transit)}</p>`}`,
  };
}
