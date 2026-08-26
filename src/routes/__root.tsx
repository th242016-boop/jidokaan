import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth/provider";
import { CreatedWithGrokBanner } from "@/components/created-with-grok-banner";
import appCss from "../styles.css?url";

const NAV_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "지도칸 JIDOKAAN",
      url: "https://jidokaan.com/",
    },
    {
      "@type": "ItemList",
      itemListElement: [
        { "@type": "SiteNavigationElement", position: 1, name: "커스텀주문", url: "https://jidokaan.com/customize" },
        { "@type": "SiteNavigationElement", position: 2, name: "샵", url: "https://jidokaan.com/shop" },
        { "@type": "SiteNavigationElement", position: 3, name: "브랜드", url: "https://jidokaan.com/about" },
        { "@type": "SiteNavigationElement", position: 4, name: "배송·글로벌", url: "https://jidokaan.com/shipping" },
        { "@type": "SiteNavigationElement", position: 5, name: "주문조회", url: "https://jidokaan.com/orders" },
      ],
    },
  ],
};
const APP_NAME = "지도칸 JIDOKAAN — Custom Boxing Shoes";
const host = import.meta.env.VITE_PUBLIC_HOSTNAME;
const ogImage = host
  ? `https://og.grok.me/v1/card.png?host=${encodeURIComponent(host)}&title=${encodeURIComponent(APP_NAME)}`
  : undefined;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        name: "description",
        content:
          "지도칸 JIDOKAAN — Korea's first custom handmade boxing shoes. Global shipping from Seoul. jidokaan.com",
      },
      {
        name: "naver-site-verification",
        content: "3a0f4b678fd89f329dd163a4c4edee0853e21567",
      },
      { title: APP_NAME },
      ...(ogImage
        ? [
            { property: "og:image", content: ogImage },
            { property: "og:image:width", content: "1200" },
            { property: "og:image:height", content: "630" },
          ]
        : []),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(NAV_JSON_LD) }}
        />
      </head>
      <body className="min-h-dvh bg-bg text-fg antialiased">
        <AuthProvider>
          <CreatedWithGrokBanner />
          <Outlet />
          <Toaster theme="dark" position="top-center" richColors closeButton />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
