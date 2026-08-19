import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/store/site-shell";
import { t } from "@/lib/i18n";
import {
  DEFAULT_SHIPPING,
  KR_LOCAL_FREE,
  shipCopy,
  zoneLabel,
  type ShipZone,
} from "@/lib/shipping";
import { useStore } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";

export const Route = createFileRoute("/shipping")({
  component: ShippingPage,
});

const ZONES: ShipZone[] = ["kr", "asia", "pacific", "europe", "world"];

function ShippingPage() {
  const locale = useStore((s) => s.locale);
  const dict = t(locale);
  const { catalog } = useCatalog();
  const copy = shipCopy(locale);
  const settings = catalog.shipping ?? DEFAULT_SHIPPING;
  const ko = locale === "ko";

  return (
    <SiteShell>
      <div className="container-page py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {dict.shippingPage.title}
          </h1>
          <p className="mt-4 text-lg text-muted">{copy.production}</p>
          <p className="mt-2 text-muted">{copy.freeKr}. {copy.freeIntl}.</p>

          <h2 className="mt-12 text-xl font-semibold">
            {ko ? "배송 요금" : "Shipping rates"}
          </h2>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-surface-muted text-xs uppercase tracking-wide text-subtle">
                <tr>
                  <th className="px-4 py-3">{ko ? "권역" : "Zone"}</th>
                  <th className="px-4 py-3">{copy.standard}</th>
                  <th className="px-4 py-3">{copy.express}</th>
                </tr>
              </thead>
              <tbody>
                {ZONES.map((z) => {
                  const r = settings.zones[z];
                  return (
                    <tr key={z} className="border-t border-border">
                      <td className="px-4 py-3">
                        <p className="font-medium">{zoneLabel(z, ko)}</p>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {z === "kr"
                          ? `₩${r.standardKrw.toLocaleString()} · ${r.daysStandard}${ko ? "일" : " days"}`
                          : `$${r.standardUsd} · ${r.daysStandard}${ko ? "일" : " days"}`}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {z === "kr"
                          ? `₩${r.expressKrw.toLocaleString()} · ${r.daysExpress}`
                          : `$${r.expressUsd} · ${r.daysExpress}${ko ? "일" : " days"}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-muted">{copy.extra}</p>
          <p className="mt-1 text-sm text-muted">
            {ko
              ? `국내 무료 기준 ₩${KR_LOCAL_FREE.toLocaleString()} · 해외 일반 무료 기준 $${settings.freeUsd} / ₩${settings.freeKrw.toLocaleString()}`
              : `Korea free over ₩${KR_LOCAL_FREE.toLocaleString()} · Worldwide standard free from $${settings.freeUsd}`}
          </p>

          <div className="mt-10 rounded-3xl border border-border bg-surface-muted/50 p-6 sm:p-8">
            <h2 className="text-xl font-semibold">{copy.dutyTitle}</h2>
            <p className="mt-3 leading-relaxed text-muted">{copy.dutyBody}</p>
          </div>

          <div className="mt-6 rounded-3xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-xl font-semibold">{dict.shippingPage.returns}</h2>
            <p className="mt-3 leading-relaxed text-muted">
              {dict.shippingPage.returnsBody}
            </p>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
