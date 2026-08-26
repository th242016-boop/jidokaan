export type PaySettings = {
  krBank: string;
  krAccount: string;
  krHolder: string;
  krMemo: string;
  intlBank: string;
  intlAccount: string;
  intlSwift: string;
  intlHolder: string;
  intlPaypal: string;
  tossClientKey: string;
  paypalClientId: string;
};

export const DEFAULT_PAY: PaySettings = {
  krBank: "",
  krAccount: "",
  krHolder: "",
  krMemo: "주문자명으로 입금해 주세요",
  intlBank: "",
  intlAccount: "",
  intlSwift: "",
  intlHolder: "",
  intlPaypal: "",
  tossClientKey: "",
  paypalClientId: "",
};
