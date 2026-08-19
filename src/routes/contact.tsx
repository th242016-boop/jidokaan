import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteShell } from "@/components/store/site-shell";
import { t } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

function ContactPage() {
  const locale = useStore((s) => s.locale);
  const ko = locale === "ko";
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    await fetch("/api/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        message: fd.get("message"),
        website: fd.get("website"),
      }),
    });
    setBusy(false);
    setSent(true);
  }

  return (
    <SiteShell>
      <div className="container-page py-12 sm:py-16">
        <div className="mx-auto max-w-lg">
          <h1 className="text-3xl font-semibold">{ko ? "문의하기" : "Contact"}</h1>
          <p className="mt-3 text-muted">
            {ko
              ? "주문·사이즈·제작 문의는 여기로 남겨 주세요. 평일 10–17시에 답합니다."
              : "Questions about orders, size or production — we reply weekdays 10–17 KST."}
          </p>
          {sent ? (
            <p className="mt-8 rounded-2xl border border-border bg-surface p-5">
              {ko ? "접수했습니다. 이메일로 답하겠습니다." : "Received. We’ll reply by email."}
            </p>
          ) : (
            <form className="mt-8 space-y-4" onSubmit={onSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="name">{ko ? "이름" : "Name"}</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">{t(locale).checkout.email}</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="hidden">
                <Input name="website" tabIndex={-1} autoComplete="off" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">{ko ? "내용" : "Message"}</Label>
                <textarea
                  id="message"
                  name="message"
                  required
                  minLength={4}
                  className="min-h-32 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
                />
              </div>
              <Button type="submit" disabled={busy}>
                {busy ? "…" : ko ? "보내기" : "Send"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </SiteShell>
  );
}
