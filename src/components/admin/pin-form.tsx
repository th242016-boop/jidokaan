import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PinForm({
  busy,
  onSave,
  onIssueRecovery,
}: {
  busy: boolean;
  onSave: (current: string, next: string) => Promise<boolean>;
  onIssueRecovery: () => Promise<string>;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [recovery, setRecovery] = useState<string | null>(null);
  const [issuing, setIssuing] = useState(false);

  return (
    <div className="max-w-md space-y-6">
    <form
      className="space-y-4 rounded border border-[#d5d7dc] bg-white p-5"
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
      {ok ? <p className="text-sm text-green-700">비밀번호를 바꿨습니다. 다음 로그인부터 새 비밀번호를 쓰세요.</p> : null}
      <Button type="submit" disabled={busy}>
        {busy ? "저장 중…" : "비밀번호 변경"}
      </Button>
    </form>

    <div className="space-y-3 rounded border border-[#d5d7dc] bg-white p-5">
      <h2 className="text-sm font-semibold">비밀번호를 잊었을 때</h2>
      <p className="text-sm leading-relaxed text-[#333]">
        5번 틀리면 15분만 잠깁니다. 15분 뒤 다시 입력하면 됩니다.
        비밀번호 자체를 잊으면 아래 복구 코드로 새 비밀번호를 만듭니다.
        코드는 지금 한 번만 보여 드리니 메모장이나 사진으로 따로 보관하세요.
      </p>
      <Button
        type="button"
        variant="secondary"
        disabled={busy || issuing}
        onClick={async () => {
          setIssuing(true);
          try {
            const code = await onIssueRecovery();
            setRecovery(code);
          } catch {
            setRecovery(null);
            setErr("복구 코드를 만들지 못했습니다. 다시 로그인해 주세요.");
          } finally {
            setIssuing(false);
          }
        }}
      >
        {issuing ? "만드는 중…" : recovery ? "복구 코드 다시 만들기" : "복구 코드 만들기"}
      </Button>
      {recovery ? (
        <div className="rounded bg-[#111] px-3 py-3 text-center">
          <p className="font-mono text-lg tracking-widest text-white">{recovery}</p>
          <p className="mt-2 text-[11px] text-white/70">이 화면을 벗어나면 다시 볼 수 없습니다. 새 코드를 만들면 이전 코드는 무효입니다.</p>
        </div>
      ) : null}
    </div>
    </div>
  );
}