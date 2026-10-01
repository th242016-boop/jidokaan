import type { ReactNode } from "react";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { LocaleSync } from "@/components/locale-sync";
import { CartDrawer } from "@/components/store/cart-drawer";
import { SiteFooter } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

export function SiteShell({
  children,
  overlayHeader = false,
  requestedLocale,
}: {
  children: ReactNode;
  overlayHeader?: boolean;
  requestedLocale?: Locale;
}) {
  return (
    <div className="relative flex min-h-[calc(100dvh-var(--grok-banner-h,0px))] flex-col">
      <AnalyticsTracker />
      <LocaleSync requestedLocale={requestedLocale} />
      <SiteHeader overlay={overlayHeader} />
      <main className={cn("flex-1", overlayHeader && "relative z-[1]")}>
        {children}
      </main>
      <SiteFooter />
      <CartDrawer />
    </div>
  );
}
