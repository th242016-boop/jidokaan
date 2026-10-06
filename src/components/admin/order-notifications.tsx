import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ORDER_BOT_USERNAME } from "@/lib/order-notification";

type Status = {
  configured: boolean;
  connected: boolean;
  enabled: boolean;
  recipient: string | null;
  enabledSince: string | null;
  recent: {
    order_id: string;
    state: string;
    attempts: number;
    sent_at: string | null;
    last_error: string | null;
  }[];
};
const ERRORS: Record<string, string> = {
  AUTH: "관리자 로그인이 만료되었습니다. 다시 로그인해 주세요.",
  TOKEN_MISSING: "Railway에 TELEGRAM_BOT_TOKEN을 등록하고 배포해 주세요.",
  TOKEN_INVALID: "봇 토큰이 올바르지 않습니다. Railway 설정을 확인해 주세요.",
  WRONG_BOT: `@${ORDER_BOT_USERNAME}의 토큰이 아닙니다. 등록한 봇을 확인해 주세요.`,
  BOT_IN_USE: "이 봇은 다른 프로그램에서 사용 중입니다. 주문 알림 전용 봇인지 확인해 주세요.",
  PAIR_EXPIRED: "연결 링크가 만료되었습니다. 새 연결 링크를 만들어 주세요.",
  PAIR_NOT_FOUND:
    "아직 확인되지 않았습니다. 아래 연결 링크로 텔레그램을 열어 시작을 누른 뒤 다시 확인해 주세요.",
  BOT_BLOCKED: "텔레그램에서 봇 차단을 해제하고 시작을 눌러 주세요.",
  TEST_TOO_SOON: "테스트 알림은 15초 후 다시 보낼 수 있습니다.",
  NOT_CONNECTED: "먼저 알림을 받을 텔레그램 계정을 연결해 주세요.",
  TELEGRAM_UNREACHABLE: "텔레그램에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  TELEGRAM_REJECTED: "텔레그램이 전송을 거절했습니다. 봇 연결 상태를 확인해 주세요.",
  RATE_LIMIT: "텔레그램 요청이 많습니다. 잠시 후 다시 시도해 주세요.",
};

export function OrderNotifications({ token }: { token: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [pair, setPair] = useState<{ url: string; code: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const request = useCallback(
    async (action: string, extra: Record<string, unknown> = {}) => {
      const response = await fetch("/api/order-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          ERRORS[data.error] || "주문 알림 설정을 확인하지 못했습니다. 다시 시도해 주세요.",
        );
      return data;
    },
    [token],
  );

  useEffect(() => {
    let active = true;
    request("status")
      .then((data) => {
        if (active) setStatus(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [request]);

  async function run(action: string) {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      if (action === "begin") {
        setPair(await request("begin"));
      } else if (action === "finish") {
        setStatus(await request("finish", { code: pair?.code }));
        setPair(null);
        setMessage("연결되었습니다. 테스트 알림을 보내 휴대폰 수신을 확인해 주세요.");
      } else if (action === "test") {
        await request("test");
        setMessage("텔레그램으로 테스트 알림을 보냈습니다. 휴대폰에서 확인해 주세요.");
      } else if (action === "toggle") {
        setStatus(await request("toggle", { enabled: !status?.enabled }));
      } else setStatus(await request("status"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "요청을 처리하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-[#e3e6ea] bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">텔레그램 주문 알림</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">
            {status
              ? status.connected && status.configured
                ? status.enabled
                  ? "알림 사용 중"
                  : "알림 일시 중지"
                : "연결 필요"
              : "확인 중"}
          </span>
        </div>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          지도칸 사이트에 직접 접수된 새 주문을 알려드립니다. 결제 완료와 입금 대기를 구분하며,
          알림의 버튼을 누르면 관리자 로그인 후 확정 디자인과 주문 상세를 볼 수 있습니다.
        </p>
        <dl className="mt-5 grid grid-cols-[90px_1fr] gap-2 text-sm">
          <dt className="text-slate-500">알림 봇</dt>
          <dd>@{ORDER_BOT_USERNAME}</dd>
          <dt className="text-slate-500">받는 계정</dt>
          <dd>{status?.recipient || "연결 전"}</dd>
        </dl>
        {status && !status.configured && (
          <div className="mt-5 rounded border border-amber-200 bg-amber-50 p-4 text-sm leading-7">
            <p className="font-semibold">먼저 봇 토큰을 등록해 주세요.</p>
            <p>
              Railway → jidokaan 서비스 → Variables에서 <code>TELEGRAM_BOT_TOKEN</code>을 추가하고,
              BotFather가 발급한 토큰을 값으로 입력한 뒤 배포해 주세요. 등록 후 아래 상태 새로고침을
              누르세요.
            </p>
            <p>토큰은 채팅이나 이 페이지에 입력하지 않습니다.</p>
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button disabled={busy || !status?.configured} onClick={() => void run("begin")}>
            {status?.connected ? "받는 계정 다시 연결" : "내 텔레그램 연결"}
          </Button>
          <Button
            variant="outline"
            disabled={busy || !status?.connected || !status?.configured}
            onClick={() => void run("test")}
          >
            테스트 알림 보내기
          </Button>
          {status?.connected && (
            <Button variant="outline" disabled={busy} onClick={() => void run("toggle")}>
              {status.enabled ? "알림 일시 중지" : "알림 재개"}
            </Button>
          )}
          <Button variant="outline" disabled={busy} onClick={() => void run("status")}>
            상태 새로고침
          </Button>
        </div>
        {pair && (
          <div className="mt-5 rounded border border-sky-200 bg-sky-50 p-4 text-sm leading-7">
            <p className="font-semibold">1. 아래 링크로 텔레그램을 열고 ‘시작’을 누르세요.</p>
            <a
              href={pair.url}
              target="_blank"
              rel="noopener noreferrer"
              className="my-3 inline-flex rounded bg-sky-700 px-4 py-2 font-bold text-white"
            >
              텔레그램에서 연결하기 ↗
            </a>
            <p>링크가 열리지 않으면 봇 대화창에 다음 문장을 보내세요.</p>
            <code className="my-2 block break-all rounded bg-white p-3 select-all">
              /start {pair.code}
            </code>
            <p>
              2. 시작을 누른 뒤 이 화면으로 돌아와 연결 확인을 누르세요. 링크는 10분간 유효합니다.
            </p>
            <Button className="mt-3" disabled={busy} onClick={() => void run("finish")}>
              연결 확인
            </Button>
          </div>
        )}
        {message && (
          <p role="status" className="mt-4 text-sm text-green-800">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}
        <p className="mt-5 text-xs leading-6 text-slate-500">
          최초 연결 이후 주문부터 30초 간격으로 확인합니다. 전송 실패 시 자동 재시도하며, 일시 중지
          중 접수된 주문은 재개 후 발송합니다. 네이버스토어 주문은 포함되지 않습니다.
        </p>
      </section>
      <section className="rounded-lg border border-[#e3e6ea] bg-white p-5 sm:p-7">
        <h3 className="font-bold">최근 알림 내역</h3>
        {!status?.recent.length ? (
          <p className="mt-4 text-sm text-slate-500">아직 주문 알림 내역이 없습니다.</p>
        ) : (
          <div className="mt-4 divide-y">
            {status.recent.map((item) => (
              <div
                key={item.order_id}
                className="flex flex-wrap justify-between gap-2 py-3 text-sm"
              >
                <span className="break-all">{item.order_id}</span>
                <span>
                  {item.state === "sent"
                    ? "발송 완료"
                    : item.last_error
                      ? `재시도 대기 · ${ERRORS[item.last_error] || "일시적인 전송 오류"}`
                      : "발송 대기"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
