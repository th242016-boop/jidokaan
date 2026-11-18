import { activeSalesCountries, isActiveSalesCountry } from "@/lib/active-sales-policy";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FLAG_MARKETS } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const FLAG_SRC = (code: string) =>
  `https://cdn.jsdelivr.net/gh/HatScripts/circle-flags@2.7.0/flags/${code}.svg`;

function Flag({
  code,
  name,
  active,
  onSelect,
}: {
  code: string;
  name: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      title={name}
      aria-label={name}
      aria-pressed={active}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full transition",
        active
          ? "scale-110 ring-2 ring-white/90 ring-offset-1 ring-offset-black/60"
          : "hover:scale-105",
      )}
    >
      <img
        src={FLAG_SRC(code)}
        alt={name}
        className="size-[18px] rounded-full sm:size-[20px]"
        width={20}
        height={20}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </button>
  );
}

export function OrderCountriesBar() {
  const activeCode = useStore((s) => s.shippingCountry).toLowerCase();
  const setShippingCountry = useStore((s) => s.setShippingCountry);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  function updateArrows() {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < max - 4);
  }

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, []);

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir * Math.min(el.clientWidth * 0.7, 280),
      behavior: "smooth",
    });
  }

  function apply(market: (typeof FLAG_MARKETS)[number]) {
    if (isActiveSalesCountry(market.code)) setShippingCountry(market.code);
  }

  return (
    <div className="w-full">
      <div className="flex w-full items-center gap-0.5 rounded-full border border-white/10 bg-black/35 px-1 py-1 backdrop-blur-md">
        <button
          type="button"
          aria-label="Previous countries"
          disabled={!canLeft}
          onClick={() => scrollByDir(-1)}
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full text-white/80 transition sm:size-7",
            canLeft ? "hover:bg-white/10 hover:text-white" : "opacity-25",
          )}
        >
          <ChevronLeft className="size-4 sm:size-5" strokeWidth={1.75} />
        </button>

        <div
          ref={scrollerRef}
          className="flag-scroller flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto overflow-y-hidden scroll-smooth py-0.5 sm:gap-1.5"
        >
          {activeSalesCountries(FLAG_MARKETS).map((f) => (
            <Flag
              key={f.code}
              code={f.code}
              name={f.name}
              active={activeCode === f.code}
              onSelect={() => apply(f)}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Next countries"
          disabled={!canRight}
          onClick={() => scrollByDir(1)}
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full text-white/80 transition sm:size-7",
            canRight ? "hover:bg-white/10 hover:text-white" : "opacity-25",
          )}
        >
          <ChevronRight className="size-4 sm:size-5" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
