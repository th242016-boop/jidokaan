import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminSecondFactor({
  token,
  onEnroll,
}: {
  token: string;
  onEnroll: (token: string, recoveryCode: string) => void;
}) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [key, setKey] = useState("");
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function request(action: string, fields: Record<string, string> = {}) {
    const response = await fetch("/api/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, ...fields }),
    });
    if (!response.ok) throw new Error("AUTH");
    return response.json();
  }

  useEffect(() => {
    let active = true;
    request("totpStatus")
      .then((result) => {
        if (active) setEnabled(result.enabled);
      })
      .catch(() => {
        if (active) setError("인증 상태를 확인할 수 없습니다. 다시 로그인해 주세요.");
      });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <section className="space-y-3 rounded border border-[#d5d7dc] bg-white p-5">
      <h2 className="text-sm font-semibold">관리자 2단계 인증</h2>
      {enabled && (
        <p>인증 앱이 연결되어 있습니다. 휴대전화를 잃어버린 경우 저장한 복구 코드를 사용하세요.</p>
      )}
      {enabled === false && !key && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
            setKey(
              Array.from(
                crypto.getRandomValues(new Uint8Array(32)),
                (byte) => alphabet[byte & 31],
              ).join(""),
            );
          }}
        >
          인증 앱 연결
        </Button>
      )}
      {key && (
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            setError("");
            try {
              const result = await request("enableTotp", { currentPin: pin, totpSecret: key, otp });
              setKey("");
              setPin("");
              setOtp("");
              setEnabled(true);
              onEnroll(result.token, result.recoveryCode);
            } catch {
              setError("현재 비밀번호와 인증 앱의 6자리 코드를 확인해 주세요.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <p>
            인증 앱에서 키 직접 입력을 선택하고 계정 이름을 지도칸 관리자, 키 유형을 시간 기준으로
            설정하세요.
          </p>
          <code className="block break-all select-all">{key}</code>
          <label className="block">
            현재 비밀번호
            <Input
              required
              type="password"
              autoComplete="current-password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </label>
          <label className="block">
            인증 앱 코드
            <Input
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </label>
          <Button disabled={busy} type="submit">
            인증하고 복구 코드 받기
          </Button>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
