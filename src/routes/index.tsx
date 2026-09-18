import { createFileRoute } from "@tanstack/react-router";
import { CinematicHome } from "@/components/home/cinematic-home";
import homeCss from "@/components/home/home.css?url";

export const Route = createFileRoute("/")({
  head: () => ({ links: [
    { rel: "stylesheet", href: homeCss },
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500&family=Noto+Sans+KR:wght@300;400;500;600&display=swap" },
    { rel: "preload", as: "image", href: "/homepage/assets/hero-landscape.webp", media: "(min-width:761px)" },
    { rel: "preload", as: "image", href: "/homepage/assets/hero-portrait.webp", media: "(max-width:760px)" },
  ] }),
  component: CinematicHome,
});
