export type FaqPageCopy = {
  title: string;
  intro: string;
  additionalTitle: string;
  additionalHelp: string;
  items: { id: string; question: string; answerHtml: string }[];
};
export function faqPageCopy(locale: string, shippingCountry?: string): FaqPageCopy;
