import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COUNTRIES } from "@/lib/i18n";
import { applyEmsPolicy, quoteShipping, type ShippingSettings } from "@/lib/shipping";
import { EMS_RATES_KRW, EMS_POLICY, emsUsd } from "@/lib/ems-rates";
export function ShippingForm({
  initial,
  busy,
  onSave,
}: {
  initial: ShippingSettings;
  busy: boolean;
  onSave: (s: ShippingSettings) => void;
}) {
  const [s, setS] = useState(() => applyEmsPolicy(initial));
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
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...s, policyVersion: EMS_POLICY, extraPct: 100 });
      }}
    >
      <div className="rounded border bg-amber-50 p-4 text-sm text-[#333]">
        <h2 className="font-bold">우체국 EMS · 410×310×150mm 상자 기준</h2>
        <p className="mt-2">
          실중량 1.5kg 이하 / 부피중량 3.1775kg → 3.5kg 구간. 2026년 7월 1일 시행 요금표 기준입니다.
          한 켤레당 한 상자로 계산합니다. 기존 주문의 결제액은 변경되지 않습니다.
        </p>
        <p className="mt-2">
          미국 관세·통관 수수료는 배송비에 미포함이며 출고 전 별도 안내·결제 대상입니다. 기타 국가도
          세금 포함으로 표시하지 않습니다. 실시간 접수 가능 여부를 확인하는 기능은 아닙니다.
        </p>
      </div>
      <label className="block max-w-sm space-y-2 text-sm">
        배송비 달러 환산 기준 (1 USD당 원화)
        <Input
          type="number"
          min="100"
          max="10000"
          step="0.01"
          required
          value={s.exchangeKrwPerUsd}
          onChange={(e) => setS({ ...s, exchangeKrwPerUsd: Number(e.target.value) })}
        />
      </label>
      <p className="text-xs text-[#666]">
        매장 설정값이며 실시간 환율이 아닙니다. 환산 기준을 바꾼 뒤 아래 버튼으로 국가별 USD 요금을
        다시 계산하고 저장하세요.
      </p>
      <Button
        type="button"
        variant="secondary"
        disabled={!s.exchangeKrwPerUsd || s.exchangeKrwPerUsd < 100}
        onClick={() =>
          setS({
            ...s,
            countryRates: {
              ...s.countryRates,
              ...Object.fromEntries(
                Object.entries(EMS_RATES_KRW).map(([c, krw]) => [
                  c,
                  {
                    usd: emsUsd(krw, s.exchangeKrwPerUsd),
                    krw,
                    note: `EMS · 3.5kg · ${krw}원 · 2026-07-01 시행`,
                  },
                ]),
              ),
            },
          })
        }
      >
        공식 EMS 운임으로 USD 다시 계산
      </Button>
      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr>
              <th className="p-3">국가</th>
              <th>EMS 원화 운임</th>
              <th>청구 USD / 1상자</th>
              <th>기준 메모</th>
            </tr>
          </thead>
          <tbody>
            {COUNTRIES.filter((c) => c.code !== "KR").map((c) => (
              <tr className="border-t" key={c.code}>
                <td className="p-3">
                  {c.ko} ({c.code})
                </td>
                <td>{EMS_RATES_KRW[c.code]?.toLocaleString("ko-KR") ?? "일반 EMS 없음"}</td>
                <td className="p-2">
                  <Input
                    aria-label={`${c.code} 배송비 USD`}
                    type="number"
                    min="0.01"
                    max="10000"
                    step="0.01"
                    placeholder="별도 견적 필요"
                    value={s.countryRates?.[c.code]?.usd ?? ""}
                    onChange={(e) => {
                      const rates = { ...s.countryRates };
                      if (e.target.value === "") delete rates[c.code];
                      else rates[c.code] = { ...rates[c.code], usd: Number(e.target.value) };
                      setS({ ...s, countryRates: rates });
                    }}
                  />
                </td>
                <td className="p-2">
                  <Input
                    aria-label={`${c.code} 운임 근거`}
                    value={s.countryRates?.[c.code]?.note ?? ""}
                    placeholder="운송사·견적 근거"
                    onChange={(e) => {
                      if (s.countryRates?.[c.code])
                        setS({
                          ...s,
                          countryRates: {
                            ...s.countryRates,
                            [c.code]: { ...s.countryRates[c.code], note: e.target.value },
                          },
                        });
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[#666]">
        요금이 비어 있는 국가는 결제를 막고 배송 상담을 안내합니다. 별도 운송 견적이 확정되면 해당
        국가 요금을 입력하세요. 해외 배송비는 소수점 둘째 자리까지 계산합니다.
      </p>
      <section className="space-y-3 rounded border bg-white p-4">
        <h2 className="font-semibold">주문서와 동일한 배송비 계산</h2>
        <select
          aria-label="배송비 확인 국가"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded border p-2"
        >
          {COUNTRIES.filter((c) => c.code !== "KR").map((c) => (
            <option key={c.code} value={c.code}>
              {c.ko}
            </option>
          ))}
        </select>
        <label className="block max-w-32">
          켤레 수
          <Input
            type="number"
            min="1"
            max="30"
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          />
        </label>
        <p>
          {country} · {qty}상자 → {quote.available ? `$${quote.usd.toFixed(2)}` : "별도 견적 필요"}
        </p>
      </section>
      <Button type="submit" disabled={busy}>
        {busy ? "저장 중…" : "배송비 저장"}
      </Button>
    </form>
  );
}
