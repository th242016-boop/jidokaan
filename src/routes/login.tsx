import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteShell } from "@/components/store/site-shell";
import { authClient, authEnabled, signIn, signInSocial } from "@/lib/auth/client";
import { t } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  next: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  component: LoginPage,
});

function safeNext(next?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

function inPreviewHost() {
  return (
    typeof window !== "undefined" &&
    window.location.hostname.endsWith(".grok-sandbox.com")
  );
}

function explainError(raw: string, failed: string) {
  const msg = raw.trim();
  const lower = msg.toLowerCase();
  if (!msg) return failed;
  if (lower.includes("provider not found") || lower.includes("provider_not_found")) {
    return failed;
  }
  if (lower.includes("invalid origin")) return failed;
  if (lower.includes("invalid email") || lower.includes("invalid password")) return failed;
  if (lower.includes("user already exists") || lower.includes("already exists")) {
    return failed;
  }
  return msg.length > 180 ? failed : msg;
}

function LoginPage() {
  const locale = useStore((s) => s.locale);
  const dict = t(locale);
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const dest = safeNext(next);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState<"google" | "kakao" | "naver" | "email" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function onGoogle() {
    setError(null);
    setBusy("google");
    try {
      if (inPreviewHost()) {
        await signIn("grok-google", {
          callbackURL: dest,
          errorCallbackURL: "/login",
        });
        return;
      }
      await signInSocial("google", {
        callbackURL: dest,
        errorCallbackURL: "/login",
      });
    } catch (err) {
      setError(explainError(err instanceof Error ? err.message : "", dict.login.failed));
    } finally {
      setBusy(null);
    }
  }

  async function onKakao() {
    setError(null);
    setBusy("kakao");
    try {
      await signInSocial("kakao", {
        callbackURL: dest,
        errorCallbackURL: "/login",
      });
    } catch (err) {
      setError(explainError(err instanceof Error ? err.message : "", dict.login.failed));
    } finally {
      setBusy(null);
    }
  }

  async function onNaver() {
    setError(null);
    setBusy("naver");
    try {
      await signInSocial("naver", {
        callbackURL: dest,
        errorCallbackURL: "/login",
      });
    } catch (err) {
      setError(explainError(err instanceof Error ? err.message : "", dict.login.failed));
    } finally {
      setBusy(null);
    }
  }

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!authEnabled) return;
    setBusy("email");
    setError(null);
    try {
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.split("@")[0] || "Member",
        });
        if (err) throw new Error(err.message);
        const saved = await fetch("/api/profile", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        });
        if (!saved.ok) throw new Error(dict.login.phoneInvalid);
      } else {
        const { error: err } = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        if (err) throw new Error(err.message);
      }
      await navigate({ to: dest });
    } catch (err) {
      setError(explainError(err instanceof Error ? err.message : "", dict.login.failed));
    } finally {
      setBusy(null);
    }
  }

  return (
    <SiteShell>
      <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
        <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-soft sm:p-8">
          <BrandLogo
            variant="full"
            tone="dark"
            className="h-10"
            imgClassName="h-10 w-auto"
          />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            {dict.login.title}
          </h1>
          <p className="mt-2 text-sm text-muted">{dict.login.body}</p>

          <div className="mt-6 space-y-3">
            {authEnabled ? (
              <>
                <button
                  type="button"
                  onClick={onGoogle}
                  disabled={busy !== null}
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-white text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100 disabled:opacity-60"
                >
                  <GoogleMark />
                  {busy === "google" ? dict.common.loading : dict.login.google}
                </button>
                <button
                  type="button"
                  onClick={onKakao}
                  disabled={busy !== null}
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#FEE500] text-sm font-semibold text-[#191919] transition hover:brightness-95 disabled:opacity-60"
                >
                  <KakaoMark />
                  {busy === "kakao" ? dict.common.loading : dict.login.kakao}
                </button>
                <button
                  type="button"
                  onClick={onNaver}
                  disabled={busy !== null}
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#03C75A] text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
                >
                  <NaverMark />
                  {busy === "naver" ? dict.common.loading : dict.login.naver}
                </button>
              </>
            ) : (
              <p className="text-sm text-muted">{dict.login.disabled}</p>
            )}
          </div>

          {authEnabled ? (
            <>
              <div className="my-6 flex items-center gap-3 text-[11px] tracking-wide text-subtle uppercase">
                <span className="h-px flex-1 bg-border" />
                {dict.login.orEmail}
                <span className="h-px flex-1 bg-border" />
              </div>

              <form className="space-y-3" onSubmit={onEmail}>
                {mode === "up" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">{dict.login.name}</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                ) : null}
                {mode === "up" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">{dict.login.phone}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      inputMode="tel"
                      placeholder="010-0000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                    />
                    <p className="text-xs text-muted">{dict.login.phoneNeed}</p>
                  </div>
                ) : null}
                <div className="space-y-1.5">
                  <Label htmlFor="email">{dict.login.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">{dict.login.password}</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={
                      mode === "up" ? "new-password" : "current-password"
                    }
                  />
                </div>
                {error ? (
                  <p className="text-sm text-danger">{error}</p>
                ) : null}
                <Button
                  type="submit"
                  className="h-12 w-full"
                  disabled={busy !== null}
                >
                  {busy === "email"
                    ? dict.common.loading
                    : mode === "up"
                      ? dict.login.signUp
                      : dict.login.signIn}
                </Button>
              </form>

              <button
                type="button"
                className="mt-3 w-full text-center text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
                onClick={() => {
                  setMode((m) => (m === "up" ? "in" : "up"));
                  setError(null);
                }}
              >
                {mode === "up" ? dict.login.haveAccount : dict.login.noAccount}
              </button>
            </>
          ) : null}

          <Button
            variant="ghost"
            className={cn("mt-4 w-full", dest === "/checkout" && "order-first")}
            asChild
          >
            <Link to={dest === "/checkout" ? "/checkout" : "/"}>
              {dest === "/checkout" ? dict.login.guestCheckout : dict.login.back}
            </Link>
          </Button>
        </div>
      </div>
    </SiteShell>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.4c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.7z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.3 7.4 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.4 14.4c-.2-.7-.4-1.4-.4-2.4s.1-1.7.4-2.4V6.5H1.4C.5 8.3 0 10.1 0 12s.5 3.7 1.4 5.5l4-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.5l4 3.1C6.3 6.8 8.9 4.8 12 4.8z"
      />
    </svg>
  );
}

function KakaoMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#191919"
        d="M12 4C6.5 4 2 7.6 2 12c0 2.8 1.9 5.3 4.7 6.7l-.9 3.3c-.1.3.3.6.6.4l3.9-2.6c.6.1 1.1.1 1.7.1 5.5 0 10-3.6 10-8S17.5 4 12 4z"
      />
    </svg>
  );
}

function NaverMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="currentColor"
        d="M15.6 12.6 8.5 2.4H4v19.2h4.5V11.4l7.1 10.2H20V2.4h-4.4v10.2z"
      />
    </svg>
  );
}
