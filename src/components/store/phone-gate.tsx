import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { t } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export function PhoneGate() {
  const { user, isPending } = useCurrentUserState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const locale = useStore((s) => s.locale);
  const dict = t(locale);
  const [needed, setNeeded] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isPending || !user || pathname.startsWith("/admin")) {
      setNeeded(false);
      return;
    }
    let live = true;
    void fetch("/api/profile", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { phone: "" }))
      .then((d: { phone?: string }) => {
        if (live) setNeeded(!String(d.phone ?? "").trim());
      })
      .catch(() => {
        if (live) setNeeded(false);
      });
    return () => {
      live = false;
    };
  }, [user, isPending, pathname]);

  if (!needed) return null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) {
        setError(dict.login.phoneInvalid);
        return;
      }
      setNeeded(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4">
      <form
        onSubmit={(e) => void save(e)}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 text-[#111] shadow-xl"
      >
        <h2 className="text-lg font-semibold">{dict.login.phone}</h2>
        <p className="text-sm leading-relaxed text-[#444]">{dict.login.phoneNeed}</p>
        <div className="space-y-1.5">
          <Label htmlFor="member-phone">{dict.login.phone}</Label>
          <Input
            id="member-phone"
            type="tel"
            required
            inputMode="tel"
            placeholder="010-0000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" className="h-11 w-full" disabled={busy}>
          {busy ? dict.common.loading : dict.login.phoneSave}
        </Button>
      </form>
    </div>
  );
}
