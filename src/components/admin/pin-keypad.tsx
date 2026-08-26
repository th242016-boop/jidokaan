import { useEffect, useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminGate({
  hasPin,
  busy,
  error,
  onSubmitPin,
  onRecover,
}: {
  hasPin: boolean;
  busy: boolean;
  error: string | null;
  onSubmitPin: (pin: string, nextPin?: string) => void;
  onRecover?: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;
    setPassword("");
    setConfirm("");
  }, [error]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setLocalError(null);
    const value = password.trim();
    if (value.length < 8) {
      setLocalError("비밀번호는 8자 이상으로 입력해 주세요.");
      return;
    }
    if (!hasPin) {
      if (value !== confirm.trim()) {
        setLocalError("두 번 입력한 비밀번호가 다릅니다.");
        return;
      }
      onSubmitPin(value, value);
      return;
    }
    onSubmitPin(value);
  }

  return (
    <form
      className="w-full max-w-sm space-y-4 rounded-3xl border border-border bg-white p-6"
      onSubmit={submit}
      autoComplete="off"
    >
      <p className="text-sm leading-relaxed text-[#333]">
        {!hasPin
          ? "관리자 비밀번호를 새로 만드세요. 영문·숫자 모두 가능하고, 8자 이상이어야 합니다."
          : "관리자 비밀번호를 입력하세요. 영문·숫자 모두 입력됩니다."}
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="admin-password">{hasPin ? "비밀번호" : "새 비밀번호"}</Label>
        <Input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={hasPin ? "current-password" : "new-password"}
          spellCheck={false}
          disabled={busy}
          className="h-12 bg-white text-base text-[#111]"
        />
      </div>
      {!hasPin ? (
        <div className="space-y-1.5">
          <Label htmlFor="admin-password2">비밀번호 확인</Label>
          <Input
            id="admin-password2"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            spellCheck={false}
            disabled={busy}
            className="h-12 bg-white text-base text-[#111]"
          />
        </div>
      ) : null}
      {localError || error ? (
        <p className="text-sm text-danger">{localError || error}</p>
      ) : null}
      <button
        type="submit"
        data-testid="pin-go"
        disabled={busy}
        className="flex h-12 w-full items-center justify-center rounded-full bg-black text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? "들어가는 중…" : hasPin ? "들어가기" : "비밀번호 만들고 들어가기"}
      </button>
      {hasPin && onRecover ? (
        <button
          type="button"
          className="block w-full text-center text-sm text-[#333] underline"
          onClick={onRecover}
        >
          비밀번호를 잊으셨나요?
        </button>
      ) : null}
    </form>
  );
}
