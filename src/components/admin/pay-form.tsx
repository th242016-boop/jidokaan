import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PaySettings } from "@/lib/pay-settings";

export function PayForm({
  initial,
  busy,
  onSave,
}: {
  initial: PaySettings;
  busy: boolean;
  onSave: (p: PaySettings) => void;
}) {
  const [p, setP] = useState(initial);
  function field(key: keyof PaySettings, label: string, hint?: string) {
    return (
      <div className="space-y-1">
        <Label>{label}</Label>
        <Input value={p[key]} onChange={(e) => setP({ ...p, [key]: e.target.value })} />
        {hint ? <p className="text-xs text-[#555]">{hint}</p> : null}
      </div>
    );
  }
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(p);
      }}
    >
      <section className="space-y-3 rounded border border-[#d5d7dc] bg-white p-5">
        <h2 className="text-sm font-semibold">국내 무통장입금 (원화)</h2>
        <p className="text-sm text-[#333]">
          손님이 현금입금을 고르면 이 계좌가 결제 화면에 그대로 나갑니다. 채팅에 계좌를 보내지 마시고 여기에만 넣으세요.
        </p>
        {field("krBank", "은행")}
        {field("krAccount", "계좌번호")}
        {field("krHolder", "예금주")}
        {field("krMemo", "안내 문구", "예: 주문자명으로 입금해 주세요. 입금 확인 후 제작합니다.")}
      </section>
      <section className="space-y-3 rounded border border-[#d5d7dc] bg-white p-5">
        <h2 className="text-sm font-semibold">해외 송금 (달러)</h2>
        {field("intlBank", "은행명")}
        {field("intlAccount", "계좌번호 / IBAN")}
        {field("intlSwift", "SWIFT / BIC")}
        {field("intlHolder", "예금주 (영문)")}
        {field("intlPaypal", "PayPal.me 또는 받을 이메일", "송금 대신 페이팔 친구송금도 가능")}
      </section>
      <section className="space-y-3 rounded border border-[#d5d7dc] bg-white p-5">
        <h2 className="text-sm font-semibold">카드 결제 API (나중에 붙여도 됨)</h2>
        <p className="text-sm text-[#333]">
          토스·페이팔 키는 여기 넣어 두세요. 키만 있다고 지금 당장 카드가 빠져나가지는 않습니다.
          심사 통과 후 키를 받으면 이 칸에 넣고 저장하면 됩니다.
        </p>
        {field("tossClientKey", "토스 클라이언트 키")}
        {field("paypalClientId", "PayPal Client ID")}
      </section>

      <section className="space-y-3 rounded border border-[#d5d7dc] bg-white p-5 text-sm leading-relaxed text-[#222]">
        <h2 className="text-sm font-semibold">결제사 직접 등록하는 순서</h2>
        <p className="text-[#333]">
          사업자등록증·통신판매업 신고는 이미 있습니다. 그걸로 아래만 신청하면 됩니다.
        </p>
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            <b>국내 카드·카카오·네이버페이 — 토스페이먼츠</b>
            <br />
            <a
              className="text-[#0a5] underline"
              href="https://onboarding.tosspayments.com/registration/business-registration-number?from=inbound"
              target="_blank"
              rel="noreferrer"
            >
              토스페이먼츠 이용 신청
            </a>
            {" · "}
            <a className="text-[#0a5] underline" href="https://docs.tosspayments.com/guides/v2/get-started" target="_blank" rel="noreferrer">
              공식 연동 안내
            </a>
            <br />
            사업자번호 넣고 → 대표자 휴대폰 인증 → 통장 사본·통신판매업 서류 업로드 → 심사(보통 수일) →
            상점관리자에서 클라이언트 키 복사 → 위 칸에 붙여넣기.
          </li>
          <li>
            <b>해외 카드 — PayPal 비즈니스</b>
            <br />
            <a
              className="text-[#0a5] underline"
              href="https://www.paypal.com/kr/business/open-business-account"
              target="_blank"
              rel="noreferrer"
            >
              PayPal 비즈니스 계정 개설
            </a>
            <br />
            회원가입에서 「PayPal로 결제받기」 선택 → 사업자 정보·영문 상호 입력 → 은행 연결 →
            개발자(Developer) 메뉴에서 Client ID 복사 → 위 칸에 붙여넣기.
          </li>
          <li>
            <b>현금</b>은 결제사 없이 됩니다. 위쪽 국내 계좌·해외 송금 칸만 채우면
            손님이 무통장/해외송금을 골랐을 때 그 번호가 바로 나갑니다. 입금 확인은 주문조회에서 「입금확인」.
          </li>
        </ol>
        <p className="text-[#555]">
          영상으로 보고 싶으면 유튜브에서 「토스페이먼츠 가맹점 신청」, 「페이팔 비즈니스 계정 만들기」를 검색하면
          화면이 공식 사이트와 같습니다. 키를 받은 뒤에는 채팅으로 보내지 말고 이 페이지에만 넣으세요.
        </p>
      </section>
      <Button type="submit" disabled={busy}>
        {busy ? "저장 중…" : "결제 정보 저장"}
      </Button>
    </form>
  );
}
