import { useEffect, useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { readAdminToken } from "@/lib/admin-session";

/** Mounted only after server verification of the real administrator session. */
export function SimulatorShareControls() {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  const [manualCopy, setManualCopy] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setFailed(false); setUrl("");
    void fetch("/api/simulator-special", {
      method: "POST", cache: "no-store", signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: readAdminToken(), action: "share-link" }),
    }).then(async response => {
      if (!response.ok) throw new Error("SHARE_UNAVAILABLE");
      const data: { url?: unknown } = await response.json();
      if (typeof data.url !== "string" || !/^https:\/\/jidokaan\.com\/special#key=[a-f0-9]{64}$/.test(data.url)) throw new Error("SHARE_UNAVAILABLE");
      if (!controller.signal.aborted) setUrl(data.url);
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [attempt]);

  async function copyLink() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("공유 링크를 복사했습니다.");
    } catch {
      setManualCopy(true);
      toast.error("아래 링크를 선택해서 직접 복사해주세요.");
    }
  }

  const buttonClass = "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-neutral-300 px-2.5 text-[11px] font-bold text-neutral-700 hover:bg-neutral-100 disabled:opacity-50";
  return (
    <div className="mt-3" aria-label="관리자 공유 링크">
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className={buttonClass} disabled={!url} onClick={() => void copyLink()}>
          <Copy className="size-3.5" aria-hidden="true" />공유 링크 복사
        </button>
        {url ? (
          <a className={buttonClass} href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3.5" aria-hidden="true" />공유 화면 열기
          </a>
        ) : (
          <button type="button" className={buttonClass} disabled>
            <ExternalLink className="size-3.5" aria-hidden="true" />공유 화면 열기
          </button>
        )}
      </div>
      {failed && <p role="alert" className="mt-2 text-right text-xs text-red-700">공유 링크를 불러오지 못했습니다. <button type="button" className="underline" onClick={() => setAttempt(value => value + 1)}>다시 시도</button></p>}
      {manualCopy && url && <input aria-label="공유 링크 직접 복사" className="mt-2 w-full rounded border border-neutral-300 p-2 text-xs" value={url} readOnly onFocus={event => event.currentTarget.select()} />}
    </div>
  );
}
