import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/store/site-shell";
import { DEFAULT_FAQS, DEFAULT_FAQS_EN } from "@/lib/store-extras";
import { useCatalog } from "@/lib/use-catalog";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/faq")({
  component: FaqPage,
});

function FaqPage() {
  const locale = useStore((s) => s.locale);
  const { catalog } = useCatalog();
  const saved = (catalog.faqs ?? []).filter((f) => f.enabled !== false);
  const faqs = saved.length
    ? saved
    : locale === "ko"
      ? DEFAULT_FAQS
      : DEFAULT_FAQS_EN;
  return (
    <SiteShell>
      <div className="container-page py-12">
        <h1 className="text-3xl font-semibold">{locale === "ko" ? "자주 묻는 질문" : "FAQ"}</h1>
        <div className="mt-8 space-y-4">
          {faqs.map((f) => (
            <article key={f.id} className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="font-semibold">{f.q}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{f.a}</p>
            </article>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}