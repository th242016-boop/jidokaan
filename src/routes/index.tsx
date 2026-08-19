import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { SiteShell } from "@/components/store/site-shell";
import { t } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useCatalog } from "@/lib/use-catalog";
import { SeoTags } from "@/components/seo-tags";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
  const locale = useStore((s) => s.locale);
  const dict = t(locale);
  const { catalog } = useCatalog();

  const looks = [
    { src: "/products/look-1.jpg", alt: "JIDOKAAN custom boxing shoe — white and navy" },
    { src: "/products/look-3.jpg", alt: "JIDOKAAN custom boxing shoe — red and black" },
    { src: "/products/look-5.jpg", alt: "JIDOKAAN custom boxing shoe — green, white and red" },
  ];

  return (
    <SiteShell overlayHeader>
      <SeoTags
        title={catalog.seo.title}
        description={catalog.seo.description}
        keywords={catalog.seo.keywords}
      />
      <section className="relative h-[calc(100dvh-var(--grok-banner-h,0px))] overflow-hidden bg-[#05070c]">
        <Link
          to="/customize"
          aria-label={dict.nav.custom}
          className="absolute inset-0 z-[1] block overflow-hidden focus-ring"
        >
          <img
            src="/products/hero-main.jpg?v=user-main2"
            alt={dict.nav.custom}
            className="absolute inset-0 h-full w-full object-contain object-center select-none motion-safe:animate-[float-shoe_5s_ease-in-out_infinite]"
            draggable={false}
            fetchPriority="high"
          />
        </Link>
      </section>

      <section
        id="story"
        className="relative border-t border-white/[0.05] py-16 sm:py-24"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(70,75,95,0.14),transparent_55%)]" />
        <div className="container-page relative">
          <h2 className="max-w-4xl whitespace-pre-line text-3xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            {dict.home.originTitle}
          </h2>
          <p className="mt-6 max-w-2xl whitespace-pre-line text-base leading-relaxed text-muted sm:text-lg">
            {dict.home.originBody}
          </p>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
            {looks.map((look) => (
              <Link
                key={look.src}
                to="/customize"
                className="group block overflow-hidden rounded-[1.75rem] focus-ring"
              >
                <div className="aspect-square overflow-hidden rounded-[1.75rem] bg-[#0c0c10]">
                  <img
                    src={look.src}
                    alt={look.alt}
                    className="h-full w-full object-cover object-center transition duration-700 ease-out group-hover:scale-[1.03]"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-white/[0.05]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(90,95,115,0.2)_0%,transparent_50%)]" />
        <div className="container-page relative flex min-h-[50dvh] flex-col items-center justify-center gap-6 py-20 text-center">
          <BrandLogo
            variant="full"
            tone="dark"
            className="opacity-95"
            imgClassName="h-12 w-auto sm:h-14 max-w-[240px]"
          />
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
            {dict.home.buildTitle}
          </h2>
          <Button size="lg" asChild>
            <Link to="/customize">
              {dict.nav.custom}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/shop">{dict.home.viewAll}</Link>
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}
