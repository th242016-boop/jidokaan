import { OrderDesign } from "./order-design";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COURIERS, ORDER_STATUS_LABEL, type StoreOrder } from "@/lib/order-types";
import { SIM_PARTS } from "@/lib/simulator-config";

export function countryLabel(code: string) {
  try {
    return `${new Intl.DisplayNames(["ko"], { type: "region" }).of(code.toUpperCase())} (${code.toUpperCase()})`;
  } catch {
    return code || "미입력";
  }
}
export function orderTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        dateStyle: "short",
        timeStyle: "short",
        hour12: false,
      }).format(date);
}

export function OrderDetail({
  order: o,
  onClose,
  onSave,
}: {
  order: StoreOrder;
  onClose: () => void;
  onSave: (id: string, body: Record<string, unknown>) => Promise<boolean>;
}) {
  const [courier, setCourier] = useState(o.courier ?? "");
  const [tracking, setTracking] = useState(o.tracking ?? "");
  const [note, setNote] = useState(o.note ?? "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const krw = o.currency === "KRW";
  const money = (n: number) =>
    new Intl.NumberFormat(krw ? "ko-KR" : "en-US", {
      style: "currency",
      currency: krw ? "KRW" : "USD",
    }).format(n);
  const subtotal = o.items.reduce(
    (sum, item) => sum + item.qty * (krw ? item.priceKrw : item.priceUsd),
    0,
  );
  const shipping = krw ? o.shippingKrw : o.shippingUsd;
  const discount = (krw ? o.discountKrw : o.discountUsd) ?? 0;
  const total = krw ? o.totalKrw : o.totalUsd;
  const mismatch = Math.abs(subtotal + shipping - discount - total) > 0.011;
  const missing = [
    ["수취인", o.name],
    ["전화번호", o.phone],
    ["주소", o.address],
    ["도시", o.city],
    ["국가", o.country],
    ["우편번호", o.postal],
  ]
    .filter(([, value]) => !value?.trim())
    .map(([label]) => label);
  const pp = o.paypalShipping;
  function field(label: string, value?: string) {
    return (
      <div className="grid grid-cols-[100px_1fr] gap-3 border-b border-[#eee] py-2">
        <dt className="text-[#666]">{label}</dt>
        <dd className="break-words whitespace-pre-wrap">{value || "미입력"}</dd>
      </div>
    );
  }
  async function save() {
    setSaving(true);
    try {
      const ok = await onSave(o.id, { courier, tracking: tracking.trim(), note });
      setMessage(
        ok ? "배송 정보와 메모를 저장했습니다." : "저장하지 못했습니다. 다시 시도해 주세요.",
      );
    } catch {
      setMessage("연결 오류로 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/50" />
        <Dialog.Content className="admin-ui fixed left-1/2 top-1/2 z-[101] max-h-[92dvh] w-[min(960px,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-5 text-sm text-[#222] shadow-xl sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-bold">주문 상세 · {o.id}</Dialog.Title>
              <Dialog.Description className="mt-2 text-[#666]">
                {orderTime(o.createdAt)} (한국시간) · {ORDER_STATUS_LABEL[o.status] ?? o.status}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="secondary" type="button">
                닫기
              </Button>
            </Dialog.Close>
          </div>
          <p className="my-4 rounded bg-[#f5f6f8] p-3">
            결제·사이즈·색상 확인 → 배송준비 → 제작 완료 → 송장 저장 → 발송 처리
          </p>
          <div className="grid gap-7 md:grid-cols-2">
            <section>
              <h3 className="mb-2 font-bold">수취인 / 전체 배송지</h3>
              <dl>
                {field("수취인", o.name)}
                {field("이메일", o.email)}
                {field("전화번호", o.phone)}
                {field(
                  "주 연락 방법",
                  o.contactMethod === "email"
                    ? "이메일"
                    : o.contactMethod === "instagram"
                      ? "인스타그램"
                      : "기존 주문 · 미수집",
                )}
                {field(
                  "인스타그램",
                  o.instagram ? `@${o.instagram}` : "미입력 / 기존 주문은 수집하지 않았습니다",
                )}
                {field("국가", countryLabel(o.country))}
                {field("주소", o.address)}
                {field("도시", o.city)}
                {field("주 / 도", o.region)}
                {field("우편번호", o.postal)}
              </dl>
              {o.instagram && /^[A-Za-z0-9._]{1,30}$/.test(o.instagram) ? (
                <a
                  className="mt-2 inline-block underline"
                  href={`https://www.instagram.com/${encodeURIComponent(o.instagram)}/`}
                  target="_blank"
                  rel="noreferrer"
                >
                  인스타그램 프로필 열기 ↗
                </a>
              ) : null}
              {missing.length ? (
                <p className="mt-3 text-red-700">
                  확인 필요: {missing.join(", ")}. 고객에게 확인 후 발송해 주세요.
                </p>
              ) : null}
              <p className="mt-3 text-xs leading-relaxed text-[#666]">
                고객이 입력한 주소입니다. 실제 배송 가능 여부는 검증되지 않았습니다. PayPal 결제
                건은 거래 상세의 배송지와 대조 후 발송해 주세요.
              </p>
            </section>
            <section>
              <h3 className="mb-2 font-bold">결제 내역</h3>
              <dl>
                {field("결제수단", o.pay)}
                {field("배송비 기준", o.shippingBasis || "주문 당시 기준 미저장")}
                {field(
                  "관부가세",
                  o.dutyTerms === "DAP"
                    ? "결제에 미포함 · 발생 시 수취인 부담"
                    : o.dutyTerms === "PREPAID_BEFORE_DISPATCH"
                      ? "미국 · 관세/통관 비용 미포함 · 제작 전 예상액 안내, 출고 전 별도 수납"
                      : o.dutyTerms === "DESTINATION_RULES"
                        ? "미포함 · 도착국 규정에 따라 별도 납부"
                        : "주문 당시 조건 확인 필요",
                )}
                {field("상품 합계", money(subtotal))}
                {field("배송비", money(shipping))}
                {field("할인", `${money(discount)}${o.couponCode ? ` (${o.couponCode})` : ""}`)}
                {field("주문 총액", money(total))}
              </dl>
              {mismatch ? (
                <p className="mt-2 text-red-700">
                  합산 금액과 저장된 총액이 다릅니다. 결제 내역을 확인해 주세요.
                </p>
              ) : null}
              {o.pay === "paypal" ? (
                <div className="mt-4">
                  <h4 className="font-semibold">PayPal 확인 정보</h4>
                  <dl>
                    {field("주문 ID", o.paypalOrderId || "기존 주문에 저장되지 않음")}
                    {field("거래 ID", o.paypalCaptureId || "기존 주문에 저장되지 않음")}
                    {field(
                      "결제액 (USD)",
                      o.paypalGrossUsd == null ? "미저장" : `$${o.paypalGrossUsd.toFixed(2)}`,
                    )}
                    {field(
                      "수수료 (USD)",
                      o.paypalFeeUsd == null
                        ? "미저장 · PayPal에서 확인"
                        : `$${o.paypalFeeUsd.toFixed(2)}`,
                    )}
                    {field(
                      "실수령 (USD)",
                      o.paypalNetUsd == null
                        ? "미저장 · PayPal에서 확인"
                        : `$${o.paypalNetUsd.toFixed(2)}`,
                    )}
                  </dl>
                  <p className="mt-2 text-xs text-[#666]">
                    실수령액은 PayPal 응답에 있는 값만 표시합니다. 과거 주문 수수료를 추정해
                    기록하지 않습니다.
                  </p>
                  {pp ? (
                    <div className="mt-4 rounded border p-3">
                      <h4 className="font-semibold">PayPal에 기록된 배송지 · 대조용</h4>
                      <p className="mt-2 whitespace-pre-line">
                        {[
                          pp.name,
                          pp.addressLine1,
                          pp.addressLine2,
                          [pp.city, pp.region, pp.postal].filter(Boolean).join(", "),
                          pp.country ? countryLabel(pp.country) : "",
                        ]
                          .filter(Boolean)
                          .join("\n")}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          </div>
          <section className="mt-7">
            <h3 className="mb-3 font-bold">주문 상품 / 제작 사양</h3>
            {o.items.map((item, index) => (
              <div key={index} className="mb-4 rounded border border-[#ddd] p-4">
                <p className="font-semibold">
                  {item.name} × {item.qty}
                </p>
                <p className="my-2">
                  사이즈: {item.size || "미입력"}
                  {item.optionLabel ? ` · ${item.optionLabel}` : ""} · 단가{" "}
                  {money(krw ? item.priceKrw : item.priceUsd)}
                </p>
                <OrderDesign item={item} orderId={o.id} index={index} />
                {item.color ? <p>색상: {item.color}</p> : null}
                {item.partNames && Object.keys(item.partNames).length ? (
                  <dl className="grid gap-x-6 sm:grid-cols-2">
                    {Object.entries(item.partNames).map(([part, name]) => (
                      <div
                        key={part}
                        className="flex justify-between gap-3 border-t border-[#eee] py-2"
                      >
                        <dt>
                          {part.toUpperCase()} ·{" "}
                          {SIM_PARTS.find((p) => p.id === part)?.hint.ko || "부위"}
                        </dt>
                        <dd className="font-medium">{name || "미저장"}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-amber-800">
                    부위별 색상이 저장돼 있지 않습니다. 기본 색상으로 추정해 제작하지 말고 고객에게
                    확인해 주세요.
                  </p>
                )}
              </div>
            ))}
          </section>
          {o.acknowledgedTerms ? (
            <details className="my-5 rounded border p-4">
              <summary className="cursor-pointer font-semibold">
                고객이 확인한 주문 안내 · {o.checkoutLocale} ·{" "}
                {o.termsAcceptedAt ? orderTime(o.termsAcceptedAt) : ""}
              </summary>
              <div className="mt-3 space-y-3 text-sm" lang={o.checkoutLocale}>
                {Object.values(o.acknowledgedTerms).map((text, i) => (
                  <p key={i}>{text}</p>
                ))}
              </div>
              <p className="mt-3 text-xs text-[#666]">안내 버전: {o.termsVersion}</p>
            </details>
          ) : null}
          <section className="mt-5 border-t pt-5">
            <h3 className="mb-3 font-bold">배송 정보 / 내부 메모</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2">
                <span>택배사</span>
                <select
                  className="block h-11 w-full rounded border bg-white px-3"
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                >
                  <option value="">선택해 주세요</option>
                  {COURIERS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span>송장번호</span>
                <Input value={tracking} onChange={(e) => setTracking(e.target.value)} />
              </label>
            </div>
            <label className="mt-3 block space-y-2">
              <span>내부 메모</span>
              <textarea
                className="min-h-20 w-full rounded border p-3"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <Button className="mt-3" type="button" disabled={saving} onClick={() => void save()}>
              {saving ? "저장 중…" : "배송 정보·메모 저장"}
            </Button>
            <p role="status" className="mt-2">
              {message}
            </p>
            <p className="mt-3 text-xs text-[#666]">
              저장만으로 발송 상태가 바뀌거나 고객에게 알림이 전송되지 않습니다. 실제 발송 후
              목록에서 발송 처리해 주세요. 취소 상태 변경은 PayPal 환불과 별개입니다.
            </p>
          </section>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
