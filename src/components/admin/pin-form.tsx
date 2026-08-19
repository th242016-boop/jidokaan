import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PinForm({
  busy,
  onSave,
}: {
  busy: boolean;
  onSave: (current: string, next: string) => Promise<boolean>;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  return (
    <form
      className="max-w-md space-y-4 rounded border border-[#d5d7dc] bg-white p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setErr(null);
        setOk(false);
        if (next.length < 8) {
          setErr("새 비밀번호는 8자 이상으로 만들어 주세요.");
          return;
        }
        if (next !== again) {
          setErr("새 비밀번호가 서로 다릅니다.");
          return;
        }
        const saved = await onSave(current, next);
        if (saved) {
          setCurrent("");
          setNext("");
          setAgain("");
          setOk(true);
        } else {
          setErr("현재 비밀번호가 맞지 않거나 저장에 실패했습니다.");
        }
      }}
    >
      <h2 className="text-sm font-semibold">관리자 비밀번호 변경</h2>
      <p className="text-sm text-[#333]">
        로그인 후에만 바꿀 수 있습니다. 바꾼 비밀번호는 암호화되어 저장됩니다.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="cur-pin">현재 비밀번호</Label>
        <Input
          id="cur-pin"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-pin">새 비밀번호 (8자 이상)</Label>
        <Input
          id="new-pin"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
          minLength={8}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-pin2">새 비밀번호 확인</Label>
        <Input
          id="new-pin2"
          type="password"
          value={again}
          onChange={(e) => setAgain(e.target.value)}
          required
          minLength={8}
        />
      </div>
      {err ? <p className="text-sm text-danger">{err}</p> : null}
      {ok ? <p className="text-sm text-green-700">비밀번호를 바꿨습니다. 다음 로그인부터 새 번호를 쓰세요.</p> : null}
      <Button type="submit" disabled={busy}>
        {busy ? "저장 중…" : "비밀번호 변경"}
      </Button>
    </form>
  );
}
