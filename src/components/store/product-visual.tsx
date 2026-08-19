import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/products";

export function ProductVisual({
  product,
  className,
  large,
  upperColor,
  stripeColor,
  soleColor,
}: {
  product: Product;
  className?: string;
  large?: boolean;
  upperColor?: string;
  stripeColor?: string;
  soleColor?: string;
}) {
  const upper = upperColor ?? product.colors[0] ?? product.accent;
  const stripe = stripeColor ?? product.colors[1] ?? product.accent;
  const sole = soleColor ?? product.colors[product.colors.length - 1] ?? "#222";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        large ? "aspect-[4/5]" : "aspect-square",
        className,
      )}
      style={{ background: product.plate }}
      aria-hidden
    >
      {product.image ? (
        <img
          src={product.image}
          alt=""
          className="absolute inset-0 h-full w-full object-contain"
        />
      ) : (
        <>
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background: `radial-gradient(circle at 28% 22%, color-mix(in oklab, white 12%, transparent), transparent 50%), radial-gradient(circle at 78% 85%, color-mix(in oklab, ${product.accent} 22%, transparent), transparent 48%)`,
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-8">
        <BoxingShoe
          shape={product.shape}
          upper={upper}
          stripe={stripe}
          sole={sole}
          large={large}
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
      <div className="pointer-events-none absolute top-3 right-3 flex items-center rounded-full border border-white/10 bg-black/35 px-2 py-1 backdrop-blur-sm">
        <BrandLogo
          variant="mark"
          tone="dark"
          imgClassName="h-3 w-auto opacity-90"
        />
      </div>
        </>
      )}
    </div>
  );
}

function BoxingShoe({
  shape,
  upper,
  stripe,
  sole,
  large,
}: {
  shape: Product["shape"];
  upper: string;
  stripe: string;
  sole: string;
  large?: boolean;
}) {
  const scale = large ? 1 : 0.92;
  const isHigh = shape === "drone" || shape === "classic";
  const isAcc = shape === "laces" || shape === "kit" || shape === "patch";

  return (
    <svg
      viewBox="0 0 240 200"
      className="h-full w-full max-h-[320px]"
      style={{ transform: `scale(${scale})` }}
    >
      <ellipse cx="120" cy="178" rx="78" ry="10" fill="rgba(0,0,0,0.28)" />
      {isAcc ? (
        <circle
          cx="120"
          cy="100"
          r="42"
          fill={upper}
          stroke={stripe}
          strokeWidth="8"
        />
      ) : (
        <>
          <path
            d="M48 140c8-28 28-52 58-62 22-8 48-6 68 8 14 10 28 28 34 48l-18 8c-8-18-20-32-34-40-16-10-36-12-54-6-22 8-38 26-44 48z"
            fill={upper}
          />
          <path
            d="M62 92c18-22 48-34 78-28 16 3 30 12 40 24l-14 12c-8-10-18-16-30-18-24-4-48 6-62 22z"
            fill={upper}
            opacity={0.9}
          />
          <path
            d="M70 78c12-18 36-28 58-24 10 2 20 8 28 16l-12 10c-6-6-14-10-22-12-16-3-34 4-44 16z"
            fill={stripe}
          />
          <path
            d="M40 148h150c4 0 8 4 8 8v6c0 4-4 8-8 8H48c-6 0-10-4-10-10v-4c0-4 4-8 10-8z"
            fill={sole}
          />
          <path
            d="M96 70c4 14 6 28 4 42M112 66c4 16 5 32 2 46M128 68c3 15 4 30 1 44"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {isHigh ? (
            <path
              d="M78 86c-6 18-4 36 2 52h28c-4-16-6-34-2-52z"
              fill={upper}
              opacity={0.95}
            />
          ) : null}
        </>
      )}
    </svg>
  );
}
