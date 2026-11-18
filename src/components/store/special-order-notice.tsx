import { specialOrderCopy } from "@/lib/special-order-copy";
import { useStore } from "@/lib/store";

export function SpecialOrderNotice({ locale }: { locale: string }) {
  const country = useStore((state) => state.shippingCountry);
  return <p role="status" data-special-order-notice className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold leading-relaxed text-red-700">{specialOrderCopy(locale, country).notice}</p>;
}
