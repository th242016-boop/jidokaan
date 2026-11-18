import homeFaqCopy from '../components/home/faq-copy.js';
import internationalFaqCopy from '../components/home/faq-international-copy.js';
import koreanFaqCopy from '../components/home/faq-korean-copy.js';
import { internationalHomeCopy } from '../components/home/international-copy.js';

const originalNoticeCopy = {
  ko: ['추가 안내 · 원문', '아래는 스토어에서 별도로 작성한 안내입니다. 작성된 언어 그대로 표시됩니다.'],
  en: ['Additional store notices · original text', 'These additional notices were written by the store and are shown in their original language.'],
  ja: ['追加のお知らせ・原文', '以下はストアが別途作成したお知らせです。記載された言語のまま表示しています。'],
  zh: ['店铺补充说明 · 原文', '以下是店铺另行发布的说明，以原文语言显示。'],
  'zh-Hant': ['店舖補充說明 · 原文', '以下是店舖另外發佈的說明，以原文語言顯示。'],
  es: ['Avisos adicionales de la tienda · texto original', 'La tienda ha redactado estos avisos adicionales. Se muestran en su idioma original.'],
  fr: ['Informations supplémentaires de la boutique · texte original', 'Ces informations supplémentaires ont été rédigées par la boutique et sont affichées dans leur langue d’origine.'],
  de: ['Zusätzliche Hinweise des Shops · Originaltext', 'Diese zusätzlichen Hinweise wurden vom Shop verfasst und werden in ihrer Originalsprache angezeigt.'],
  th: ['ประกาศเพิ่มเติมจากร้านค้า · ข้อความต้นฉบับ', 'ประกาศเพิ่มเติมด้านล่างจัดทำโดยร้านค้า และแสดงในภาษาต้นฉบับ'],
  ru: ['Дополнительная информация магазина · оригинал', 'Эти дополнительные сообщения написаны магазином и показаны на языке оригинала.'],
  it: ['Ulteriori avvisi del negozio · testo originale', 'Questi avvisi aggiuntivi sono stati scritti dal negozio e vengono mostrati nella lingua originale.'],
  pt: ['Avisos adicionais da loja · texto original', 'Estes avisos adicionais foram escritos pela loja e são exibidos no idioma original.'],
  tr: ['Mağazadan ek bilgiler · özgün metin', 'Bu ek bilgiler mağaza tarafından yazılmıştır ve yazıldıkları dilde gösterilir.'],
  uz: ['Do‘konning qo‘shimcha ma’lumotlari · asl matn', 'Quyidagi qo‘shimcha ma’lumotlar do‘kon tomonidan yozilgan va asl tilida ko‘rsatiladi.'],
  hi: ['दुकान की अतिरिक्त जानकारी · मूल पाठ', 'नीचे दी गई अतिरिक्त जानकारी दुकान ने लिखी है और इसे मूल भाषा में दिखाया गया है।'],
  tl: ['Mga karagdagang abiso ng tindahan · orihinal na teksto', 'Ang mga karagdagang abisong ito ay isinulat ng tindahan at ipinapakita sa orihinal na wika.'],
};

/** Keep the standalone FAQ in step with the translated homepage purchase policies. */
export function faqPageCopy(locale, shippingCountry = '') {
  const selected = Object.hasOwn(originalNoticeCopy, locale) ? locale : 'en';
  const base = selected === 'ko'
    ? koreanFaqCopy
    : homeFaqCopy[selected] ?? internationalFaqCopy[selected];
  const current = { ...base, ...internationalHomeCopy(selected, shippingCountry) };
  const [additionalTitle, additionalHelp] = originalNoticeCopy[selected];
  return {
    title: current.navFaq,
    intro: current.faqIntro,
    additionalTitle,
    additionalHelp,
    items: Array.from({ length: 10 }, (_, index) => {
      const number = index + 1;
      return { id: `faq-${number}`, question: current[`faqQ${number}`], answerHtml: current[`faqA${number}`] };
    }),
  };
}
