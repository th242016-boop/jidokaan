import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COUNTRIES } from "@/lib/i18n";
import { applyEmsPolicy, quoteShipping, type ShippingSettings } from "@/lib/shipping";
import { EMS_RATES_KRW, EMS_POLICY } from "@/lib/ems-rates";
import {
  DEFAULT_SHIPPING_PRICING,
  SHIPPING_REFERENCE_FX,
  shippingPrice,
} from "@/lib/shipping-pricing";
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
  let calculated: ShippingSettings | null = null;
  try {
    calculated = applyEmsPolicy(s);
  } catch {
    /* Input can be temporarily incomplete. */
  }
  const quote = calculated
    ? quoteShipping({
        country,
        qty,
        method: "standard",
        subtotalKrw: 288000 * qty,
        subtotalUsd: 230 * qty,
        settings: calculated,
      })
    : null;
  const rate = calculated?.countryRates?.[country];
  const breakdown =
    rate?.krw != null && calculated?.pricing
      ? shippingPrice(rate.krw, calculated.exchangeKrwPerUsd!, calculated.pricing)
      : null;
  const changeReserve = (
    key: "fxBufferPct" | "settlementReservePct" | "costBufferPct" | "roundUsd",
    value: number,
  ) => setS({ ...s, pricing: { ...s.pricing!, [key]: value } });
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (calculated) onSave({ ...calculated, policyVersion: EMS_POLICY, extraPct: 100 });
      }}
    >
      <div className="rounded border bg-amber-50 p-4 text-sm text-[#333]">
        <h2 className="font-bold">우체국 EMS · 410×310×150mm · 배송비 책정</h2>
        <p className="mt-2">
          실중량 1.5kg 이하 / 부피중량 3.1775kg → 3.5kg 구간. 우체국 기본 운임에 환율·정산 차감·운임
          변동 여유를 반영합니다. 한 켤레당 한 상자로 계산하며, 기존 주문과 이미 생성된 결제 견적은
          변경하지 않습니다.
        </p>
        <p className="mt-2">
          관세·세금·통관 비용은 포함되지 않습니다. 이 설정은 배송비 부족 가능성을 줄이기 위한 책정
          기준이며, 모든 환율 변동이나 실제 추가 비용을 보장하지 않습니다.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm">
          기준 환율 · 1 USD당 원화
          <Input
            type="number"
            required
            min="100"
            max="10000"
            step="0.01"
            value={s.exchangeKrwPerUsd}
            onChange={(e) => setS({ ...s, exchangeKrwPerUsd: Number(e.target.value) })}
          />
        </label>
        <label className="space-y-2 text-sm">
          환율 하락 대비 (%)
          <Input
            type="number"
            required
            min="0"
            max="40"
            step="0.1"
            value={s.pricing?.fxBufferPct}
            onChange={(e) => changeReserve("fxBufferPct", Number(e.target.value))}
          />
        </label>
        <label className="space-y-2 text-sm">
          결제·환전 차감 대비 (%)
          <Input
            type="number"
            required
            min="0"
            max="40"
            step="0.1"
            value={s.pricing?.settlementReservePct}
            onChange={(e) => changeReserve("settlementReservePct", Number(e.target.value))}
          />
        </label>
        <label className="space-y-2 text-sm">
          운임 변동 여유 (%)
          <Input
            type="number"
            required
            min="0"
            max="100"
            step="0.1"
            value={s.pricing?.costBufferPct}
            onChange={(e) => changeReserve("costBufferPct", Number(e.target.value))}
          />
        </label>
        <label className="space-y-2 text-sm">
          올림 단위 (USD)
          <select
            className="block rounded border p-3"
            value={s.pricing?.roundUsd}
            onChange={(e) => changeReserve("roundUsd", Number(e.target.value))}
          >
            <option value="0.01">0.01</option>
            <option value="1">1</option>
            <option value="5">5</option>
          </select>
        </label>
      </div>
      <p className="text-xs leading-relaxed text-[#666]">
        기준 환율은 관리자가 정하는 값이며 실시간 시세와 자동 연동되지 않습니다. 입력값을 바꾸면
        국가별 요금과 미리보기가 즉시 다시 계산되고, 저장하면 새 주문에 반영됩니다. 차감 대비율은
        실제 PayPal 수수료율이 아닌 준비금 비율입니다. 건당 고정 수수료와 상품 가격에 대한 결제
        수수료 전부를 배송비에 별도로 전가하는 계산은 아닙니다.
      </p>
      <p className="rounded bg-gray-100 p-3 text-sm">
        배송비 = [우체국 운임 × (1 + 운임 여유)] ÷ [기준 환율 × (1 − 환율 여유) × (1 − 정산 차감
        대비)] → 선택 단위로 올림
      </p>
      <Button
        type="button"
        variant="secondary"
        onClick={() =>
          setS({
            ...s,
            exchangeKrwPerUsd: SHIPPING_REFERENCE_FX,
            pricing: { ...DEFAULT_SHIPPING_PRICING },
          })
        }
      >
        기본 대비율로 되돌리기 (1,350원 · 5% · 8% · 3%)
      </Button>
      {!calculated ? (
        <p role="alert" className="text-red-700">
          환율과 대비율을 입력 범위에 맞게 확인해 주세요.
        </p>
      ) : null}
      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr>
              <th className="p-3">국가</th>
              <th>운송 원가 KRW / 상자</th>
              <th>추가 최소 청구액 USD</th>
              <th>최종 청구 USD</th>
              <th>기준 메모</th>
            </tr>
          </thead>
          <tbody>
            {COUNTRIES.filter((c) => c.code !== "KR").map((c) => (
              <tr className="border-t" key={c.code}>
                <td className="p-3">
                  {c.ko} ({c.code})
                </td>
                <td className="p-2">
                  <Input
                    aria-label={`${c.code} 운송 원가 KRW`}
                    type="number"
                    min="1"
                    max="10000000"
                    step="1"
                    placeholder={EMS_RATES_KRW[c.code] ? "운임 입력" : "별도 견적 필요"}
                    value={s.countryRates?.[c.code]?.krw ?? ""}
                    onChange={(e) => {
                      const rates = { ...s.countryRates };
                      if (e.target.value === "") delete rates[c.code];
                      else
                        rates[c.code] = {
                          ...rates[c.code],
                          usd: rates[c.code]?.usd ?? 0,
                          krw: Number(e.target.value),
                        };
                      setS({ ...s, countryRates: rates });
                    }}
                  />
                </td>
                <td className="p-2">
                  <Input
                    aria-label={`${c.code} 최소 청구 USD`}
                    type="number"
                    min="0"
                    max="10000"
                    step="0.01"
                    placeholder="자동 계산"
                    disabled={!s.countryRates?.[c.code]}
                    value={s.countryRates?.[c.code]?.minimumUsd ?? ""}
                    onChange={(e) => {
                      const rates = { ...s.countryRates };
                      if (rates[c.code])
                        rates[c.code] = {
                          ...rates[c.code],
                          minimumUsd: e.target.value === "" ? undefined : Number(e.target.value),
                        };
                      setS({ ...s, countryRates: rates });
                    }}
                  />
                </td>
                <td className="p-3 font-semibold">
                  {calculated?.countryRates?.[c.code]
                    ? `$${calculated.countryRates[c.code].usd.toFixed(2)}`
                    : "별도 견적 필요"}
                  {s.countryRates?.[c.code] && s.countryRates[c.code].krw == null ? (
                    <p className="mt-1 text-xs font-normal text-amber-700">
                      기존 수동 요금 · 원가 입력 전까지 대비율 미적용
                    </p>
                  ) : null}
                </td>
                <td className="p-2">
                  <Input
                    aria-label={`${c.code} 운임 근거`}
                    value={s.countryRates?.[c.code]?.note ?? ""}
                    placeholder="운송사·견적 근거"
                    onChange={(e) => {
                      const rates = { ...s.countryRates };
                      if (rates[c.code]) {
                        rates[c.code] = { ...rates[c.code], note: e.target.value };
                        setS({ ...s, countryRates: rates });
                      }
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[#666]">
        추가 최소 청구액을 입력하면 자동 계산액과 비교하여 더 높은 금액을 받습니다. 요금이 등록되지
        않은 국가의 결제는 차단합니다. 별도 운송사의 견적은 직접 확인 후 원가를 입력하세요.
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
            onChange={(e) => setQty(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
          />
        </label>
        <p>
          {country} · {qty}상자 → {quote?.available ? `$${quote.usd.toFixed(2)}` : "별도 견적 필요"}
        </p>
        {breakdown && quote && rate?.krw != null ? (
          <div className="space-y-2 text-sm text-[#555]">
            <div>운송 원가: {(rate.krw * qty).toLocaleString("ko-KR")}원</div>
            <div>보수적 환율: 1 USD = {breakdown.effectiveFx.toLocaleString("ko-KR")}원</div>
            <div>
              위 환율·차감 대비율을 적용한 계산상 잔액:{" "}
              {Math.floor(
                quote.usd * breakdown.effectiveFx * (1 - s.pricing!.settlementReservePct / 100),
              ).toLocaleString("ko-KR")}
              원
            </div>
            <div>실제 입금액 보장이나 관세 포함 금액이 아닙니다.</div>
          </div>
        ) : null}
      </section>
      <Button type="submit" disabled={busy || !calculated}>
        {busy ? "저장 중…" : "배송비 저장"}
      </Button>
    </form>
  );
}
