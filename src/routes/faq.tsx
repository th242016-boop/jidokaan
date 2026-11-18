import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/store/site-shell";
import { DEFAULT_FAQS, DEFAULT_FAQS_EN, LEGACY_FAQ_TIMING } from "@/lib/store-extras";
import { useCatalog } from "@/lib/use-catalog";
import { useStore } from "@/lib/store";
import { faqPageCopy } from "@/lib/faq-page-copy";

export const Route = createFileRoute("/faq")({
  component: FaqPage,
});

function FaqPage() {
  const locale = useStore((s) => s.locale);
  const shippingCountry = useStore((s) => s.shippingCountry);
  const { catalog } = useCatalog();
  const copy = faqPageCopy(locale, shippingCountry);
  // Hide only unchanged legacy defaults that are superseded by the shared policy.
  // Merchant-authored entries stay intact and are rendered as plain original text.
  const legacyDefaults = [...DEFAULT_FAQS, ...DEFAULT_FAQS_EN, ...LEGACY_FAQ_TIMING];
  const saved = (catalog.faqs ?? []).filter(
    (f) => f.enabled !== false && !legacyDefaults.some((entry) => entry.q === f.q && entry.a === f.a),
  );
  return (
    <SiteShell>
      <div className="container-page py-12">
        <h1 className="text-3xl font-semibold">{copy.title}</h1>
        <p className="mt-3 text-muted">{copy.intro}</p>
        <div className="mt-8 space-y-4">
          {copy.items.map((f) => (
            <article key={f.id} className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="font-semibold">{f.question}</h2>
              <div
                className="mt-2 space-y-2 text-sm leading-relaxed text-muted [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-2 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: f.answerHtml }}
              />
            </article>
          ))}
        </div>
        {saved.length > 0 && (
          <section className="mt-12 border-t border-border pt-8" aria-labelledby="store-notices-title">
            <h2 id="store-notices-title" className="text-xl font-semibold">{copy.additionalTitle}</h2>
            <p className="mt-2 text-sm text-muted">{copy.additionalHelp}</p>
            <div className="mt-5 space-y-4">
              {saved.map((f) => (
                <article key={f.id} className="rounded-2xl border border-border bg-surface p-5">
                  <h3 className="font-semibold">{f.q}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">{f.a}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </SiteShell>
  );
}
