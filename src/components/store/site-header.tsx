import { Link } from "@tanstack/react-router";
import { Globe, Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { OrderCountriesBar } from "@/components/hero/order-countries";
import { Button } from "@/components/ui/button";
import { LOCALES, t } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { UserButton } from "@/lib/auth/gates";
import { useCatalog } from "@/lib/use-catalog";
import { cn } from "@/lib/utils";

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const locale = useStore((s) => s.locale);
  const setLocale = useStore((s) => s.setLocale);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const cartCount = useStore((s) => s.cartCount());
  const dict = t(locale);
  const { catalog } = useCatalog();
  const notice = catalog.notice;
  const { user, isPending } = useCurrentUserState();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = [
    { to: "/customize" as const, label: dict.nav.custom },
    { to: "/shop" as const, label: dict.nav.shop },
    { to: "/about" as const, label: dict.nav.about },
    { to: "/shipping" as const, label: dict.nav.shipping },
    { to: "/orders" as const, label: dict.nav.orders },
  ];

  return (
    <header
      className={
        overlay
          ? "absolute top-[var(--grok-banner-h,0px)] right-0 left-0 z-40 border-0 bg-transparent"
          : "sticky top-[var(--grok-banner-h,0px)] z-40 border-b border-white/[0.06] bg-black/90 backdrop-blur-xl"
      }
    >
      <div
        className={cn(
          "flex items-center gap-2 sm:gap-3",
          overlay
            ? "flex-wrap px-3 py-2 sm:h-[clamp(3.6rem,8vw,5.25rem)] sm:flex-nowrap sm:py-0 sm:px-5 lg:px-8"
            : "container-page h-[5.25rem] sm:h-[6rem]",
        )}
      >
        <div className="flex shrink-0 items-center gap-3">
          {!overlay ? (
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          ) : null}
          <BrandLogo
            variant="full"
            tone="dark"
            asLink
            priority
            className={
              overlay
                ? "h-[clamp(2.1rem,4.8vw,3.75rem)]"
                : "h-[54px] sm:h-[66px]"
            }
            imgClassName={
              overlay
                ? "h-[clamp(2.1rem,4.8vw,3.75rem)] w-auto max-w-[min(42vw,240px)]"
                : "h-[54px] w-auto sm:h-[66px] max-w-[234px] sm:max-w-[300px]"
            }
          />
          {!overlay ? (
            <nav className="hidden items-center gap-1 lg:flex">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-full px-3.5 py-2.5 text-[15px] text-muted transition-colors hover:bg-white/[0.05] hover:text-fg focus-ring"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>

        {overlay ? null : <div className="flex-1" />}

        <div className={cn("flex shrink-0 items-center gap-1 sm:gap-1.5", overlay && "ml-auto sm:ml-0")}>
          <label className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] text-muted backdrop-blur-md sm:gap-1.5 sm:px-3 sm:py-2 sm:text-xs">
            <Globe className="size-3.5" />
            <select
              className="max-w-[4.6rem] bg-transparent text-fg outline-none sm:max-w-[5.5rem]"
              value={locale}
              onChange={(e) => setLocale(e.target.value as typeof locale)}
              aria-label={dict.common.language}
            >
              {LOCALES.map((l) => (
                <option key={l.id} value={l.id} className="bg-white text-black">
                  {l.native}
                </option>
              ))}
            </select>
          </label>

          <Button
            variant="ghost"
            size="icon"
            className="relative size-9 sm:size-11"
            onClick={() => setCartOpen(true)}
            aria-label={dict.nav.cart}
          >
            <ShoppingBag className="size-4 sm:size-5" />
            {cartCount > 0 ? (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-primary-fg sm:top-1.5 sm:right-1.5">
                {cartCount}
              </span>
            ) : null}
          </Button>

          <div className="hidden md:block">
            {isPending ? (
              <div className="size-10 animate-pulse rounded-full bg-white/10" />
            ) : user ? (
              <UserButton />
            ) : (
              <Button variant="secondary" size="sm" className="h-9 px-3 sm:h-10 sm:px-4" asChild>
                <Link to="/login">{dict.nav.signIn}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {overlay ? (
        <div className="px-3 pt-1 sm:px-5 lg:px-8">
          <div className="mx-auto w-full max-w-[min(92vw,28rem)] sm:max-w-[min(52vw,26rem)] sm:ml-auto sm:mr-5 lg:mr-8">
            <OrderCountriesBar />
          </div>
        </div>
      ) : null}

      {notice?.enabled && notice.text ? (
        <div
          className={cn(
            overlay
              ? "px-3 pt-2 pb-1 sm:px-5 lg:px-8"
              : "border-t border-white/[0.06] px-4 py-2.5",
          )}
        >
          <p
            className={cn(
              "text-center text-[12px] leading-snug sm:text-sm",
              overlay
                ? "rounded-md bg-red-700/90 px-3 py-2 text-white"
                : "text-fg/90",
            )}
          >
            {notice.text}
          </p>
        </div>
      ) : null}

      {!overlay && mobileOpen ? (
        <div className="border-t border-white/[0.06] bg-black/95 px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-white/[0.05]"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {!user ? (
              <Link
                to="/login"
                className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-white/[0.05]"
                onClick={() => setMobileOpen(false)}
              >
                {dict.nav.signIn}
              </Link>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
