import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CustomizePage } from "./customize";
import { requestedLocale } from "@/lib/locale-preference";

export const Route = createFileRoute("/special")({
  validateSearch: (search: Record<string, unknown>): { lang?: ReturnType<typeof requestedLocale> } => ({ lang: requestedLocale(search.lang) }),
  head: () => ({ meta: [
    { title: "JIDOKAAN · Special Studio" },
    { name: "robots", content: "noindex, nofollow, noarchive" },
    { name: "referrer", content: "no-referrer" },
  ] }),
  component: SharedSpecialPage,
});

function SharedSpecialPage() {
  const { lang } = Route.useSearch();
  // The capability stays in the URL fragment. It is never sent with navigation,
  // rendered into server HTML, or saved as an administrator credential.
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const readLink = () => {
      const value = new URLSearchParams(window.location.hash.slice(1)).get("key") ?? "";
      setToken(/^[a-f0-9]{64}$/.test(value) ? value : "");
    };
    readLink();
    window.addEventListener("hashchange", readLink);
    return () => window.removeEventListener("hashchange", readLink);
  }, []);

  if (!token) return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-6 text-center text-black">
      <div className="max-w-sm">
        <h1 className="text-2xl font-black tracking-wide">JIDOKAAN</h1>
        <p role={token === null ? "status" : "alert"} className="mt-4 text-sm text-neutral-600">
          {token === null ? "스페셜 시뮬레이터를 여는 중…" : "공유 링크를 확인해주세요. 유효한 링크로 다시 접속해주세요."}
        </p>
      </div>
    </main>
  );
  return <CustomizePage key={token} lang={lang} shareToken={token} />;
}
