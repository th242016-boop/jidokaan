import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteShell } from "@/components/store/site-shell";
import { useStore } from "@/lib/store";
import { inboxCopy } from "@/lib/inbox-copy";
import type { InboxThread } from "@/lib/inbox-types";
import { COUNTRIES, LOCALES, type Locale } from "@/lib/i18n";
import { IS_REVIEW_PREVIEW } from "@/lib/review-preview";
import { contactPreviewCopy } from "@/lib/contact-preview-copy";

export const Route = createFileRoute("/contact")({
  validateSearch: (search: Record<string, unknown>): { lang?: Locale; country?: string } => {
    const lang = typeof search.lang === "string" && LOCALES.some(item => item.id === search.lang)
      ? search.lang as Locale : undefined;
    const candidate = typeof search.country === "string" ? search.country.toUpperCase() : "";
    const country = COUNTRIES.some(item => item.code === candidate) ? candidate : undefined;
    return { lang, country };
  },
  component: ContactPage,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
});
const STORAGE = "jidokaan-private-inquiries-v1";
type Saved = { id: string; hash: string };
const field =
  "min-h-36 w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-base leading-7";
async function request(
  body: Record<string, unknown>,
): Promise<InboxThread & { accessUrl?: string }> {
  if (IS_REVIEW_PREVIEW) throw new Error("REVIEW_PREVIEW_NO_TRANSMISSION");
  const response = await fetch("/api/inbox", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "FAIL");
  return data;
}
function ContactPage() {
  const search = Route.useSearch();
  const storedLocale = useStore((s) => s.locale);
  const storedCountry = useStore((s) => s.shippingCountry);
  const locale = storedLocale;
  const country = search.country || storedCountry;
  const preview = contactPreviewCopy(locale);
  const copy = inboxCopy(locale);
  const [previewSubmitted, setPreviewSubmitted] = useState(false);
  useEffect(() => {
    if (IS_REVIEW_PREVIEW && search.lang) useStore.getState().setLocale(search.lang);
  }, [search.lang]);
  const destinationName = IS_REVIEW_PREVIEW && /^[A-Z]{2}$/.test(country)
    ? new Intl.DisplayNames([locale === "tl" ? "fil" : locale], { type: "region" }).of(country) || country
    : "—";
  const [credentials, setCredentials] = useState<{ id: string; key: string } | null>(null);
  const [thread, setThread] = useState<InboxThread | null>(null);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(false);
  const [error, setError] = useState(""),
    [copied, setCopied] = useState(false);
  const [receipt, setReceipt] = useState(false);
  const submissionId = useRef(""),
    followupId = useRef("");
  const generation = useRef(0);
  const remember = useCallback((url: string) => {
    if (IS_REVIEW_PREVIEW) return;
    const parsed = new URL(url),
      params = new URLSearchParams(parsed.hash.slice(1));
    const id = params.get("thread");
    if (!id || !/^[a-f0-9]{64}$/.test(params.get("key") || "")) return;
    setSaved((old) => {
      const next = [{ id, hash: parsed.hash }, ...old.filter((x) => x.id !== id)].slice(0, 10);
      try {
        localStorage.setItem(STORAGE, JSON.stringify(next));
      } catch {
        /* Link can still be copied. */
      }
      return next;
    });
  }, []);
  useEffect(() => {
    if (IS_REVIEW_PREVIEW) return;
    try {
      const entries: Saved[] = JSON.parse(localStorage.getItem(STORAGE) || "[]");
      if (Array.isArray(entries))
        setSaved(
          entries
            .filter(
              (x) =>
                typeof x.id === "string" &&
                typeof x.hash === "string" &&
                x.hash.startsWith("#thread="),
            )
            .slice(0, 10),
        );
    } catch {
      /* Private browsing or invalid saved data. */
    }
    const read = () => {
      generation.current += 1;
      const params = new URLSearchParams(window.location.hash.slice(1));
      const id = params.get("thread"),
        key = params.get("key");
      setThread(null);
      setError("");
      setCopied(false);
      setCredentials(id || key ? { id: id || "", key: key || "" } : null);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const errorText = (code: string) =>
    code === "NOT_FOUND" ? copy.missing : code === "RATE_LIMIT" ? copy.rate : copy.error;
  const load = useCallback(async () => {
    if (IS_REVIEW_PREVIEW || !credentials) return;
    const current = generation.current;
    setLoading(true);
    setError("");
    try {
      const data = await request({ action: "lookup", ...credentials });
      if (current === generation.current) {
        setThread(data);
        remember(data.accessUrl);
      }
    } catch (err) {
      if (current === generation.current) setError(err instanceof Error ? err.message : "FAIL");
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [credentials, remember]);
  useEffect(() => {
    void load();
  }, [load]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (IS_REVIEW_PREVIEW) {
      setError("");
      setPreviewSubmitted(true);
      return;
    }
    const form = event.currentTarget,
      values = new FormData(form);
    submissionId.current ||= crypto.randomUUID();
    setBusy(true);
    setError("");
    try {
      const result = await request({
        action: "create",
        name: values.get("name"),
        email: values.get("email"),
        message: values.get("message"),
        website: values.get("website"),
        locale,
        requestId: submissionId.current,
      });
      if (!result.accessUrl) throw new Error("FAIL");
      remember(result.accessUrl);
      setReceipt(true);
      submissionId.current = "";
      window.location.hash = new URL(result.accessUrl).hash;
    } catch (err) {
      setError(err instanceof Error ? err.message : "FAIL");
    } finally {
      setBusy(false);
    }
  }
  async function followup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (IS_REVIEW_PREVIEW || busy || !credentials) return;
    const form = event.currentTarget,
      values = new FormData(form);
    followupId.current ||= crypto.randomUUID();
    setBusy(true);
    setError("");
    try {
      const data = await request({
        action: "followup",
        ...credentials,
        message: values.get("message"),
        requestId: followupId.current,
      });
      setThread(data);
      followupId.current = "";
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "FAIL");
    } finally {
      setBusy(false);
    }
  }
  return (
    <SiteShell>
      <div className="container-page py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold">{copy.title}</h1>
            {credentials && (
              <a href="/contact" className="text-sm underline underline-offset-4">
                {copy.newInquiry}
              </a>
            )}
          </div>
          <p className="mt-4 text-sm leading-7 text-muted">{copy.intro}</p>
          {IS_REVIEW_PREVIEW && (
            <>
            <p role="note" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">{preview.notice}</p>
            <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
              <div><dt className="font-medium">{preview.country}</dt><dd>{destinationName}</dd></div>
              <div><dt className="font-medium">{preview.language}</dt><dd>{LOCALES.find(item => item.id === locale)?.native || locale}</dd></div>
            </dl>
            </>
          )}
          {error && (
            <p
              role="alert"
              className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900"
            >
              {errorText(error)}
            </p>
          )}
          {IS_REVIEW_PREVIEW && previewSubmitted ? (
            <section role="status" aria-live="polite" className="mt-8 rounded-2xl border border-emerald-300 bg-emerald-50 p-6 text-emerald-950">
              <h2 className="text-xl font-semibold">{preview.received}</h2>
              <p className="mt-3 text-sm leading-relaxed">{preview.receivedHelp}</p>
              <Button className="mt-5" type="button" variant="outline" onClick={() => setPreviewSubmitted(false)}>{preview.restart}</Button>
            </section>
          ) : credentials ? (
            <>
              <div className="mt-7 flex items-center justify-between gap-3">
                <span className="break-all text-xs text-muted">{credentials.id}</span>
                <Button variant="outline" disabled={loading || busy} onClick={() => void load()}>
                  {loading ? copy.loading : copy.refresh}
                </Button>
              </div>
              {thread && (
                <>
                  <section className="mt-5 rounded-2xl border border-border bg-surface p-5 sm:p-7">
                    {receipt && <h2 className="mb-3 font-semibold">{copy.received}</h2>}
                    <p className="text-sm leading-6 text-muted">{copy.save}</p>
                    <div className="mt-4 flex gap-2">
                      <Input
                        aria-label={copy.open}
                        readOnly
                        value={thread.accessUrl}
                        onFocus={(e) => e.target.select()}
                        className="min-w-0 text-xs"
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          void navigator.clipboard
                            .writeText(thread.accessUrl)
                            .then(() => setCopied(true))
                            .catch(() => setError("FAIL"));
                        }}
                      >
                        {copied ? copy.copied : copy.copy}
                      </Button>
                    </div>
                  </section>
                  <div className="my-6 text-sm text-muted">
                    {thread.item.status === "new" ? copy.pending : copy.closed}
                  </div>
                  <div className="space-y-4">
                    {[
                      {
                        id: "original",
                        author: "customer",
                        body: thread.item.message,
                        createdAt: thread.item.createdAt,
                      },
                      ...thread.messages,
                    ].map((message) => (
                      <article
                        key={message.id}
                        className={`rounded-2xl border border-border p-5 sm:p-7 ${message.author === "admin" ? "bg-surface" : ""}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                          <span className="font-semibold">
                            {message.author === "admin" ? copy.reply : copy.you}
                          </span>
                          <time>
                            {new Date(message.createdAt).toLocaleString(
                              locale === "ko" ? "ko-KR" : locale,
                            )}
                          </time>
                        </div>
                        <p className="mt-4 whitespace-pre-wrap break-words text-base leading-8">
                          {message.body}
                        </p>
                      </article>
                    ))}
                  </div>
                  {thread.item.status === "new" && (
                    <p className="mt-5 text-sm text-muted">{copy.waiting}</p>
                  )}
                  <form className="mt-8 space-y-3" onSubmit={followup}>
                    <Label htmlFor="followup">{copy.followup}</Label>
                    <textarea
                      id="followup"
                      name="message"
                      required
                      maxLength={5000}
                      disabled={busy}
                      className={field}
                      onChange={() => {
                        followupId.current = "";
                      }}
                    />
                    <p className="text-xs leading-6 text-muted">{copy.noEmail}</p>
                    <Button type="submit" disabled={busy}>
                      {busy ? "…" : copy.submitFollowup}
                    </Button>
                  </form>
                </>
              )}
            </>
          ) : (
            <>
              <form
                className="mt-8 space-y-5"
                onSubmit={submit}
                onChange={() => {
                  submissionId.current = "";
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="name">{copy.name}</Label>
                  <Input
                    id="name"
                    name="name"
                    autoComplete="name"
                    required
                    maxLength={80}
                    disabled={busy}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{copy.email}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={200}
                    disabled={busy}
                  />
                </div>
                <div className="hidden" aria-hidden="true">
                  <Input name="website" tabIndex={-1} autoComplete="off" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{copy.message}</Label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    minLength={4}
                    maxLength={5000}
                    disabled={busy}
                    className={field}
                  />
                </div>
                {!IS_REVIEW_PREVIEW && <p className="text-sm leading-7 text-muted">{copy.notice}</p>}
                <Button type="submit" disabled={busy}>
                  {busy ? "…" : copy.send}
                </Button>
              </form>
              {saved.length > 0 && (
                <section className="mt-12 border-t border-border pt-6">
                  <h2 className="font-semibold">{copy.recent}</h2>
                  <ul className="mt-3 space-y-3">
                    {saved.map((item) => (
                      <li key={item.id}>
                        <a
                          className="break-all text-sm underline underline-offset-4"
                          href={`/contact${item.hash}`}
                        >
                          {item.id}
                        </a>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="mt-4 text-xs text-muted underline"
                    onClick={() => {
                      localStorage.removeItem(STORAGE);
                      setSaved([]);
                    }}
                  >
                    {locale === "ko"
                      ? "이 기기의 문의 링크 삭제"
                      : "Remove saved links from this device"}
                  </button>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </SiteShell>
  );
}
