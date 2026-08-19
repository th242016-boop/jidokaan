import type { ReactNode } from "react";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { LocaleSync } from "@/components/locale-sync";
import { CartDrawer } from "@/components/store/cart-drawer";
import { SiteFooter } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";
import { useCatalog } from "@/lib/use-catalog";
import { cn } from "@/lib/utils";

export function SiteShell({
  children,
  overlayHeader = false,
}: {
  children: ReactNode;
  overlayHeader?: boolean;
}) {
  const { catalog } = useCatalog();
  const notice = catalog.notice;
  return (
    <div className="relative flex min-h-[calc(100dvh-var(--grok-banner-h,0px))] flex-col">
      <AnalyticsTracker />
      <LocaleSync />
      {notice?.enabled && notice.text ? (
        <div className="bg-accent px-4 py-2 text-center text-sm text-white">
          {notice.text}
        </div>
      ) : null}
      <SiteHeader overlay={overlayHeader} />
      <main className={cn("flex-1", overlayHeader && "relative z-[1]")}>
        {children}
      </main>
      <SiteFooter />
      <CartDrawer />
    </div>
  );
}
