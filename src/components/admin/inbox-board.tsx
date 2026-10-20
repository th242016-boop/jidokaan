import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { inboxCopy } from "@/lib/inbox-copy";
import type { InboxChannels, InboxSummary, InboxThread } from "@/lib/inbox-types";

const errorText = (code: string) =>
  ({
    AUTH: "관리자 로그인이 만료되었습니다. 다시 로그인해 주세요.",
    EMAIL_NOT_CONFIGURED:
      "이메일 발송 서비스 연결이 필요합니다. 사이트 답변으로 먼저 등록할 수 있습니다.",
    NOT_FOUND: "문의를 찾을 수 없습니다.",
    BAD_EMAIL: "이 문의의 이메일 주소가 올바르지 않습니다.",
    CONFLICT: "내용이 변경되었습니다. 새로고침 후 다시 확인해 주세요.",
  })[code] || "요청을 처리하지 못했습니다. 입력한 내용은 유지됩니다. 잠시 후 다시 시도해 주세요.";
const date = (value: string) => new Date(value).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
const emailLabel = {
  none: "이메일 미발송",
  pending: "이메일 발송 대기",
  accepted: "이메일 발송 접수 · 수신 미확인",
  failed: "이메일 발송 실패 / 확인 필요",
};

export function InboxBoard({ token, initialInquiry }: { token: string; initialInquiry?: string }) {
  const [items, setItems] = useState<InboxSummary[]>([]),
    [channels, setChannels] = useState<InboxChannels | null>(null);
  const [offset, setOffset] = useState(0),
    [selected, setSelected] = useState(initialInquiry || "");
  const [thread, setThread] = useState<InboxThread | null>(null);
  const [loading, setLoading] = useState(true),
    [detailLoading, setDetailLoading] = useState(false),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [site, setSite] = useState(true),
    [email, setEmail] = useState(false);
  const replyRequest = useRef({ id: "", fingerprint: "" });
  const call = useCallback(
    async (query = "", body?: Record<string, unknown>) => {
      const response = await fetch(`/api/inbox${query}`, {
        method: body ? "POST" : "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "FAIL");
      return data;
    },
    [token],
  );
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await call(`?offset=${offset}`);
      setItems(data.items);
      setChannels(data.channels);
    } catch (err) {
      setError(err instanceof Error ? err.message : "FAIL");
    } finally {
      setLoading(false);
    }
  }, [call, offset]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (initialInquiry) setSelected(initialInquiry);
  }, [initialInquiry]);
  useEffect(() => {
    setThread(null);
    setNotice("");
    setError("");
    if (!selected) return;
    let current = true;
    setDetailLoading(true);
    call(`?id=${encodeURIComponent(selected)}`)
      .then((data) => {
        if (current) setThread(data);
      })
      .catch((err) => {
        if (current) setError(err.message);
      })
      .finally(() => {
        if (current) setDetailLoading(false);
      });
    return () => {
      current = false;
    };
  }, [selected, call]);
  async function refresh() {
    setError("");
    await load();
    if (selected)
      try {
        setThread(await call(`?id=${encodeURIComponent(selected)}`));
      } catch (err) {
        setError(err instanceof Error ? err.message : "FAIL");
      }
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !thread) return;
    const body = drafts[selected] || "";
    const fingerprint = JSON.stringify([selected, body, site, email]);
    if (replyRequest.current.fingerprint !== fingerprint)
      replyRequest.current = { id: crypto.randomUUID(), fingerprint };
    setBusy(true);
    setError("");
    setNotice("");
    try {
      setThread(
        await call("", {
          action: "reply",
          id: selected,
          message: body,
          site,
          emailReply: email,
          requestId: replyRequest.current.id,
        }),
      );
      setDrafts((old) => ({ ...old, [selected]: "" }));
      replyRequest.current = { id: "", fingerprint: "" };
      setNotice(
        email
          ? "답변을 저장하고 이메일 발송 대기열에 등록했습니다. 새로고침으로 발송 결과를 확인해 주세요."
          : "사이트 답변을 등록했습니다. 이메일은 발송하지 않았습니다.",
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "FAIL");
    } finally {
      setBusy(false);
    }
  }
  async function mark() {
    if (!thread || busy) return;
    setBusy(true);
    setError("");
    try {
      await call("", {
        action: "update",
        id: selected,
        status: thread.item.status === "new" ? "done" : "new",
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "FAIL");
    } finally {
      setBusy(false);
    }
  }
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice("복사했습니다.");
    } catch {
      setError("FAIL");
    }
  }
  const lastReply = thread?.messages.filter((m) => m.author === "admin").at(-1);
  const customerCopy = inboxCopy(thread?.item.locale);
  const emailBody = thread
    ? `${lastReply?.body || ""}\n\n— JIDOKAAN\n\n${customerCopy.emailFooter}\n${thread.accessUrl}`
    : "";
  const mailto = thread
    ? `mailto:${encodeURIComponent(thread.item.email)}?subject=${encodeURIComponent(`${customerCopy.emailSubject} [${thread.item.id}]`)}&body=${encodeURIComponent(emailBody)}`
    : "";
  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">문의 · 답변 관리</h2>
          <Button variant="outline" disabled={busy || loading} onClick={() => void refresh()}>
            새로고침
          </Button>
        </div>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          문의를 선택해 대화를 확인하고 답변하세요. 고객이 추가 질문을 남기면 다시 ‘답변 대기’로
          표시됩니다. 시간은 한국 시간입니다.
        </p>
        {channels && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded bg-slate-100 px-3 py-2">
              텔레그램:{" "}
              {channels.telegram.configured && channels.telegram.connected
                ? channels.telegram.enabled
                  ? "새 문의·추가 문의 알림 사용 중"
                  : "일시 중지"
                : "연결 필요"}
            </span>
            <span className="rounded bg-slate-100 px-3 py-2">
              이메일:{" "}
              {channels.emailConfigured ? "발송 설정됨 · 결과 확인 필요" : "자동 발송 연결 필요"}
            </span>
          </div>
        )}
        {channels && !channels.emailConfigured && (
          <p className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
            사이트 답변은 바로 사용할 수 있습니다. 자동 이메일 발송은 아직 연결 전입니다. 답변을
            등록한 뒤 아래 ‘메일 앱에서 보내기’ 또는 ‘이메일 내용 복사’로 직접 보내실 수 있습니다.
            메일 앱을 여는 것만으로 발송되지는 않습니다.
          </p>
        )}
      </section>
      {error && (
        <p
          role="alert"
          className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-900"
        >
          {errorText(error)}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          {notice}
        </p>
      )}
      <div className="grid items-start gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <section className="min-w-0 rounded-lg border border-slate-200 bg-white">
          <h3 className="border-b p-4 text-sm font-bold">문의 목록</h3>
          {loading && <p className="p-4 text-sm text-slate-500">불러오는 중…</p>}
          {!loading && !items.length && (
            <p className="p-6 text-sm text-slate-500">문의가 없습니다.</p>
          )}
          <ul className="max-h-[750px] divide-y overflow-y-auto">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  disabled={busy}
                  className={`w-full px-4 py-4 text-left transition hover:bg-slate-50 ${item.id === selected ? "border-l-4 border-slate-800 bg-slate-50" : ""}`}
                  onClick={() => setSelected(item.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">{item.name || "(이름 없음)"}</span>
                    <span
                      className={`shrink-0 rounded px-2 py-1 text-[11px] ${item.status === "new" ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-600"}`}
                    >
                      {item.emailFailed
                        ? "이메일 확인 필요"
                        : item.emailPending
                          ? "이메일 대기"
                          : item.status === "new"
                            ? "답변 대기"
                            : "처리 완료"}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-slate-600">
                    {item.message}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-500">
                    {date(item.updatedAt)} · 답변 {item.replyCount}개
                  </p>
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t p-3 text-sm">
            <Button
              variant="outline"
              size="sm"
              disabled={busy || loading || offset === 0}
              onClick={() => setOffset(Math.max(0, offset - 50))}
            >
              이전
            </Button>
            <span>{Math.floor(offset / 50) + 1} 페이지</span>
            <Button
              variant="outline"
              size="sm"
              disabled={busy || loading || items.length < 50}
              onClick={() => setOffset(offset + 50)}
            >
              다음
            </Button>
          </div>
        </section>
        <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 sm:p-7">
          {detailLoading ? (
            <p>문의 내용을 불러오는 중…</p>
          ) : !thread ? (
            <p className="py-14 text-center text-sm text-slate-500">
              문의 목록에서 답변할 글을 선택해 주세요.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">{thread.item.name}</h3>
                  <p className="mt-1 break-all text-sm">{thread.item.email}</p>
                  <p className="mt-2 break-all text-xs text-slate-500">{thread.item.id}</p>
                </div>
                <Button variant="outline" size="sm" disabled={busy} onClick={() => void mark()}>
                  {thread.item.status === "new" ? "답변 없이 처리완료" : "답변 대기로"}
                </Button>
              </div>
              <div className="mt-6 space-y-4">
                <article className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">
                    고객 문의 · {date(thread.item.createdAt)}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">
                    {thread.item.message}
                  </p>
                </article>
                {thread.messages.map((message) => (
                  <article
                    key={message.id}
                    className={`rounded-lg border p-4 ${message.author === "admin" ? "border-sky-200 bg-sky-50" : "border-slate-200"}`}
                  >
                    <p className="text-xs text-slate-500">
                      {message.author === "admin" ? "지도칸 답변" : "고객 추가 문의"} ·{" "}
                      {date(message.createdAt)}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">
                      {message.body}
                    </p>
                    {message.author === "admin" && (
                      <p
                        className={`mt-3 text-xs ${message.emailState === "failed" ? "text-red-700" : "text-slate-600"}`}
                      >
                        {message.siteVisible ? "사이트 게시" : "사이트 비공개"} ·{" "}
                        {emailLabel[message.emailState]}
                        {message.emailState === "failed"
                          ? " — 중복 발송을 피하려면 발송 서비스 내역을 확인한 뒤 직접 보내 주세요."
                          : ""}
                      </p>
                    )}
                  </article>
                ))}
              </div>
              <form onSubmit={save} className="mt-7 space-y-4 border-t pt-6">
                <label className="block text-sm font-bold" htmlFor="admin-reply">
                  답변 작성
                </label>
                <textarea
                  id="admin-reply"
                  value={drafts[selected] || ""}
                  onChange={(event) =>
                    setDrafts((old) => ({ ...old, [selected]: event.target.value }))
                  }
                  disabled={busy}
                  required
                  maxLength={5000}
                  className="min-h-44 w-full rounded-lg border border-slate-300 bg-white p-4 text-base leading-7"
                  placeholder="고객에게 전달할 답변을 입력하세요."
                />
                <div className="flex flex-wrap gap-5 text-sm">
                  <label className="flex min-h-11 cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-5 w-5"
                      checked={site}
                      disabled={busy}
                      onChange={(event) => setSite(event.target.checked)}
                    />
                    사이트에 답변 게시
                  </label>
                  <label className="flex min-h-11 cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-5 w-5"
                      checked={email}
                      disabled={busy || !channels?.emailConfigured}
                      onChange={(event) => setEmail(event.target.checked)}
                    />
                    이메일로도 보내기{!channels?.emailConfigured ? " (연결 필요)" : ""}
                  </label>
                </div>
                <p className="text-xs leading-6 text-slate-500">
                  사이트 답변은 전용 링크를 가진 고객만 볼 수 있습니다. 이메일 본문은 작성하신 언어
                  그대로 발송됩니다.
                </p>
                <Button
                  type="submit"
                  disabled={busy || !(drafts[selected] || "").trim() || (!site && !email)}
                >
                  {busy ? "저장 중…" : email ? "답변 등록 및 이메일 발송" : "사이트 답변 등록"}
                </Button>
              </form>
              <div className="mt-7 space-y-3 border-t pt-5">
                <p className="text-sm font-semibold">고객에게 직접 안내하기</p>
                <p className="text-xs leading-6 text-slate-500">
                  기존 문의 고객에게는 이 전용 링크를 이메일로 전달해 주세요. 링크를 공개 게시판에
                  올리지 마세요. 아래 기능은 자동 발송으로 기록되지 않습니다.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => void copy(thread.accessUrl)}>
                    고객 전용 링크 복사
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => void copy(thread.item.email)}>
                    고객 이메일 복사
                  </Button>
                  {lastReply && (
                    <>
                      <a
                        href={mailto}
                        className="inline-flex min-h-9 items-center rounded-md border border-slate-300 px-3 text-sm"
                      >
                        메일 앱에서 보내기 ↗
                      </a>
                      <Button variant="outline" size="sm" onClick={() => void copy(emailBody)}>
                        이메일 내용 복사
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
      {channels && channels.recentAlerts.length > 0 && (
        <details className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <summary className="cursor-pointer font-semibold">최근 문의 알림 상태</summary>
          <ul className="mt-3 divide-y">
            {channels.recentAlerts.map((alert, index) => (
              <li key={index} className="flex flex-wrap justify-between gap-2 py-2">
                <span className="break-all">{alert.inbox_id}</span>
                <span>
                  {alert.state === "sent"
                    ? "텔레그램 발송 완료"
                    : alert.last_error
                      ? "전송 오류 · 자동 재시도 대기"
                      : "발송 대기"}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
