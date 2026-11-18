import { orderItemUnitAmount } from "@/lib/order-money";
import type { StoreOrder } from "@/lib/order-types";
import { customerOrderDetailCopy } from "@/lib/customer-order-detail-copy";
import { customerOptionLabel, customerOrderAmounts, customerOrderItemName, orderMoney } from "@/lib/customer-order-view";

export function CustomerOrderDetails({ order, locale }: { order: StoreOrder; locale: string }) {
  const copy = customerOrderDetailCopy(locale);
  const amounts = customerOrderAmounts(order);
  const money = (value: number) => orderMoney(order, value, locale);
  const duty = order.acknowledgedTerms?.duty?.trim();
  const destination = order.acknowledgedTerms?.destination?.trim();
  const cancellationPolicy = order.acknowledgedTerms?.cancellationPolicy?.trim();
  const sameNotice = duty?.replace(/\s+/g, " ") === destination?.replace(/\s+/g, " ");
  let country = order.country;
  try { country = new Intl.DisplayNames([locale], { type: "region" }).of(order.country.toUpperCase()) ?? order.country; }
  catch { /* Keep historical destinations that are not ISO country codes. */ }
  return <section className="space-y-6 border-t border-border pt-5 text-left">
    <h2 className="font-semibold">{copy.details}</h2>
    <div className="space-y-5">{order.items.map((item, index) => {
      // Older orders saved a Korean/English fit suffix inside the size itself.
      // Display that fit once in the selected language without changing the saved order.
      const savedSize = item.size?.trim() ?? "";
      const parsedSize = savedSize.match(/^(\d+(?:\.\d+)?)\s*(?:mm)?\s*(?:\((남성|여성|men|women)\))?$/i);
      const fit = item.sizeFit === "men" || item.sizeFit === "women" ? item.sizeFit
        : /^(남성|men)$/i.test(parsedSize?.[2] ?? "") ? "men"
          : /^(여성|women)$/i.test(parsedSize?.[2] ?? "") ? "women" : undefined;
      const size = parsedSize ? `${parsedSize[1]} mm` : savedSize;
      const option = customerOptionLabel(item.optionLabel, locale);
      return <article key={`${item.productId}-${index}`} className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-[140px_1fr]">
        <div className="overflow-hidden rounded-lg bg-surface-muted">
          {item.designPreview ? <img src={item.designPreview} alt={copy.details} className="aspect-square w-full object-contain" /> : <p className="p-3 text-xs text-muted">{copy.noPreview}</p>}
        </div>
        <div className="min-w-0 space-y-2 text-sm">
          <h3 className="break-words font-medium">{customerOrderItemName(item, locale)}</h3>
          {size ? <p>{copy.size}: {size}{fit ? ` · ${copy[fit]}` : ""}</p> : null}
          {option ? <p className="break-words text-muted">{option}</p> : null}
          <p>{copy.quantity}: {item.qty}</p>
          <p className="price-num font-semibold">{money(orderItemUnitAmount(order, item) * item.qty)}</p>
        </div>
      </article>;
    })}</div>
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-2 text-sm"><h3 className="font-semibold">{copy.address}</h3>
        <address className="break-words not-italic leading-relaxed">{order.name}<br />{order.address}<br />{[order.city, order.region, order.postal].filter(Boolean).join(", ")}<br />{country}</address>
        <p className="break-all text-muted">{order.phone}<br />{order.email}</p>
      </div>
      <dl className="space-y-2 text-sm">{(["subtotal", "discount", "shipping", "total"] as const).map(key => <div key={key} className={`flex justify-between gap-3 ${key === "total" ? "border-t border-border pt-3 font-semibold" : ""}`}><dt>{copy[key]}</dt><dd className="price-num">{key === "discount" && amounts[key] ? "−" : ""}{money(amounts[key])}</dd></div>)}</dl>
    </div>
    {duty || destination || cancellationPolicy ? <details className="rounded-xl border border-border p-4" open={!order.checkoutLocale || order.checkoutLocale === locale}>
      <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium">{copy.originalTerms}</summary>
      <div lang={order.checkoutLocale} className="mt-2 space-y-3">
        {duty ? <p className="rounded-xl border border-amber-500/40 p-3 text-sm leading-relaxed">{duty}</p> : null}
        {destination && !sameNotice ? <p className="text-sm leading-relaxed text-muted">{destination}</p> : null}
        {cancellationPolicy ? <p className="text-sm leading-relaxed text-muted">{cancellationPolicy}</p> : null}
      </div>
    </details> : null}
    {order.customerParcels?.length ? <div className="space-y-3">{order.customerParcels.map((parcel, index) => <article key={parcel.id} className="rounded-xl border border-border p-4 text-sm">
      <h3 className="font-semibold">{copy.parcel} {index + 1} / {order.customerParcels!.length} · {copy[parcel.state]}</h3>
      {parcel.tracking ? <p className="mt-2 break-all">{copy.tracking}: {parcel.tracking}</p> : null}
      {parcel.manuallyConfirmed ? <p className="mt-2 text-muted">{copy.manual}</p> : null}
      {parcel.trackingUnavailable ? <p className="mt-2 text-amber-700">{copy.unavailable}</p> : null}
    </article>)}</div> : order.tracking ? <p className="break-all text-sm">{order.courier} · {copy.tracking}: {order.tracking}</p> : null}
  </section>;
}
