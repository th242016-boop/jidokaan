import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type Variant = "full" | "mark" | "word";
type Tone = "auto" | "light" | "dark";

/** Official JIDOKAAN logos (reprocessed from brand files). v=3 busts old cache. */
const SRC: Record<Variant, Record<"light" | "dark", string>> = {
  full: {
    light: "/brand/logo-full.png?v=3",
    dark: "/brand/logo-full-white.png?v=3",
  },
  mark: {
    light: "/brand/logo-mark-black.png?v=3",
    dark: "/brand/logo-mark-white.png?v=3",
  },
  word: {
    light: "/brand/logo-word.png?v=3",
    dark: "/brand/logo-word-white.png?v=3",
  },
};

export function BrandLogo({
  variant = "full",
  tone = "auto",
  className,
  imgClassName,
  asLink = false,
  priority = false,
}: {
  variant?: Variant;
  tone?: Tone;
  className?: string;
  imgClassName?: string;
  asLink?: boolean;
  priority?: boolean;
}) {
  const t = tone === "auto" ? "dark" : tone;
  const src = SRC[variant][t];

  const img = (
    <img
      src={src}
      alt="JIDOKAAN"
      className={cn("select-none object-contain", imgClassName)}
      draggable={false}
      decoding="async"
      loading={priority ? "eager" : "lazy"}
    />
  );

  const wrapClass = cn("inline-flex items-center", className);

  if (asLink) {
    return (
      <Link
        to="/"
        className={cn(wrapClass, "focus-ring rounded-sm")}
        aria-label="JIDOKAAN home"
      >
        {img}
      </Link>
    );
  }
  return <span className={wrapClass}>{img}</span>;
}
