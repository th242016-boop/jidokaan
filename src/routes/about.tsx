import { createFileRoute } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { SiteShell } from "@/components/store/site-shell";
import { t } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  const locale = useStore((s) => s.locale);
  const dict = t(locale);

  return (
    <SiteShell>
      <div className="container-page py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <BrandLogo
            variant="full"
            tone="dark"
            className="mb-6"
            imgClassName="h-12 w-auto max-w-[220px]"
          />
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {dict.about.title}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            {dict.about.body}
          </p>
          <div className="mt-10 rounded-3xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-xl font-semibold">{dict.about.mission}</h2>
            <p className="mt-3 leading-relaxed text-muted">
              {dict.about.missionBody}
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-bg p-5">
              <p className="text-xs font-medium tracking-wide text-subtle uppercase">
                {dict.about.studio}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-fg">
                {dict.about.address}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-bg p-5">
              <p className="text-xs font-medium tracking-wide text-subtle uppercase">
                Instagram
              </p>
              <a
                href="https://www.instagram.com/jidokaan/"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm font-medium text-fg underline-offset-4 hover:underline"
              >
                @jidokaan
              </a>
            </div>
          </div>
          <div className="mt-14 flex justify-center opacity-40">
            <BrandLogo
              variant="mark"
              tone="dark"
              imgClassName="h-10 w-auto"
            />
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
