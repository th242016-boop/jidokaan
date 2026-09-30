import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COUNTRIES } from "@/lib/i18n";
import { zoneLabel, quoteShipping, type ShipZone, type ShippingSettings } from "@/lib/shipping";
const ZONES: ShipZone[] = ["kr", "asia", "pacific", "europe", "world"];

export function ShippingForm({
  initial,
  busy,
  onSave,
}: {
  initial: ShippingSettings;
  busy: boolean;
  onSave: (s: ShippingSettings) => void;
}) {
  const [s, setS] = useState(initial);
  const [country, setCountry] = useState("US");
  const [qty, setQty] = useState(1);
  const quote = quoteShipping({
    country,
    qty,
    method: "standard",
    subtotalKrw: 288000 * qty,
    subtotalUsd: 230 * qty,
    settings: s,
  });
  function setRate(code: string, usd: number, note?: string) {
    setS((current) => ({
      ...current,
      countryRates: {
        ...current.countryRates,
        [code]: { usd, note: note ?? current.countryRates?.[code]?.note },
      },
    }));
  }
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(s);
      }}
    >
      <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-[#333]">
        <p className="font-semibold">현재 주문서와 같은 계산 기준입니다.</p>
        <p className="mt-2">
          국가별 요금이 있으면 우선 적용하고, 없으면 아래 권역 요금을 적용합니다. 운송사 실시간
          견적이 아닌 매장에서 정하는 정액 배송비입니다. 실제 계약 운임을 확인한 후 저장해 주세요.
        </p>
        <p className="mt-2">
          해외 무료배송은 적용하지 않습니다. 국내는 상품 합계 5만원부터 무료입니다. 일반 배송만
          주문서에 표시됩니다.
        </p>
      </div>
      <section className="rounded border bg-white p-4">
        <h2 className="font-semibold">권역별 기본 배송비</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead>
              <tr>
                <th>권역</th>
                <th>일반 배송 USD</th>
                <th>일반 배송 KRW</th>
              </tr>
            </thead>
            <tbody>
              {ZONES.map((zone) => (
                <tr key={zone} className="border-t">
                  <td className="p-2">{zoneLabel(zone, true)}</td>
                  {(["standardUsd", "standardKrw"] as const).map((key) => (
                    <td className="p-2" key={key}>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        required
                        aria-label={`${zoneLabel(zone, true)} ${key}`}
                        value={s.zones[zone][key]}
                        onChange={(e) =>
                          setS({
                            ...s,
                            zones: {
                              ...s.zones,
                              [zone]: { ...s.zones[zone], [key]: Number(e.target.value) },
                            },
                          })
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <label className="mt-4 block max-w-xs space-y-2">
          <span className="text-sm">추가 1켤레당 첫 배송비의 가산율 (%)</span>
          <Input
            type="number"
            min="0"
            max="1000"
            required
            value={s.extraPct}
            onChange={(e) => setS({ ...s, extraPct: Number(e.target.value) })}
          />
        </label>
        <p className="mt-2 text-xs text-[#666]">
          현재 수량 계산은 기존과 동일하게 최종 배송비를 1달러 단위로 반올림합니다.
        </p>
      </section>
      <section className="rounded border bg-white p-4">
        <h2 className="font-semibold">국가별 개별 요금 · 권역보다 우선</h2>
        <p className="mt-2 text-sm text-[#666]">
          견적을 확인한 국가만 추가하세요. 메모에는 운송사, 포장 중량, 요금 확인일을 기록할 수
          있습니다.
        </p>
        <div className="my-3 flex flex-wrap gap-2">
          <select
            aria-label="배송비 국가"
            className="rounded border p-2"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {COUNTRIES.filter((c) => c.code !== "KR").map((c) => (
              <option key={c.code} value={c.code}>
                {c.ko} ({c.code})
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setRate(
                country,
                s.countryRates?.[country]?.usd ??
                  quoteShipping({
                    country,
                    qty: 1,
                    method: "standard",
                    subtotalKrw: 288000,
                    subtotalUsd: 230,
                    settings: s,
                  }).usd,
              )
            }
          >
            국가 요금 추가
          </Button>
        </div>
        {Object.entries(s.countryRates ?? {}).map(([code, rate]) => (
          <div
            className="grid items-center gap-2 border-t py-3 sm:grid-cols-[140px_100px_1fr_auto]"
            key={code}
          >
            <span className="text-sm">
              {COUNTRIES.find((c) => c.code === code)?.ko || code} ({code})
            </span>
            <label>
              <span className="text-xs">USD</span>
              <Input
                aria-label={`${code} 배송비 USD`}
                type="number"
                min="0"
                step="1"
                required
                value={rate.usd}
                onChange={(e) => setRate(code, Number(e.target.value))}
              />
            </label>
            <Input
              aria-label={`${code} 운임 근거 메모`}
              placeholder="운송사 / 포장 중량 / 견적 확인일"
              value={rate.note ?? ""}
              onChange={(e) => setRate(code, rate.usd, e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const next = { ...s.countryRates };
                delete next[code];
                setS({ ...s, countryRates: next });
              }}
            >
              제외
            </Button>
          </div>
        ))}
      </section>
      <section className="rounded border bg-white p-4">
        <h2 className="font-semibold">주문서 계산 미리보기</h2>
        <label className="mt-3 block max-w-32">
          켤레 수
          <Input
            type="number"
            min="1"
            max="30"
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          />
        </label>
        <p className="mt-3">
          {country} · {qty}켤레 → 배송비 <b>${quote.usd.toFixed(2)}</b>
        </p>
        <p className="mt-2 text-sm text-[#666]">
          세금 처리: DAP — 관부가세는 결제 금액에 포함하지 않고, 발생 시 수취인이 부담합니다. 미국을
          포함해 선납 기능은 운송사 계약과 통관 견적 연동 후 적용해야 합니다.
        </p>
      </section>
      <Button type="submit" disabled={busy}>
        {busy ? "저장 중…" : "배송비 저장"}
      </Button>
    </form>
  );
}
