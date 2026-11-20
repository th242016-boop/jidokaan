import { DEFAULT_PAY } from "./pay-settings";
import type { CatalogPayload } from "./use-catalog";

// This projection is also used when an admin edit refreshes the storefront cache.
export function publicCatalog(data: CatalogPayload) {
  const { products, company, support, categories, seo, shipping, notice, faqs, hasPin } = data;
  const pay = data.pay ?? DEFAULT_PAY;
  return {
    products, company, support, categories, seo, shipping, notice, faqs, hasPin,
    pay: {
      krBank: pay.krBank,
      krAccount: pay.krAccount,
      krHolder: pay.krHolder,
      krMemo: pay.krMemo,
      intlBank: pay.intlBank,
      intlAccount: pay.intlAccount,
      intlSwift: pay.intlSwift,
      intlHolder: pay.intlHolder,
      intlPaypal: pay.intlPaypal,
      tossClientKey: pay.tossClientKey,
      paypalClientId: pay.paypalClientId,
    },
  };
}
