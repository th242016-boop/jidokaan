import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LocaleSync } from "@/components/locale-sync";
import { LayerSimulator } from "@/components/customizer/layer-simulator";
import { Button } from "@/components/ui/button";
import {
  currencyForCountry,
  formatProductPrice,
  t,
} from "@/lib/i18n";
import { getProduct, MEN_BOOT_SIZES, WOMEN_BOOT_SIZES, closestBootSize, naverProductUrl } from "@/lib/products";
import {
  paletteFor,
  PHOTO_NATIVE,
  PICKABLE_PARTS,
  REAL_LAYERS,
  SIM_PARTS,
  defaultPartNames,
  linkedLColor,
  type PartColorNames,
} from "@/lib/simulator-config";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/customize")({
  component: CustomizePage,
});

const MEN_SIZES = MEN_BOOT_SIZES;
const WOMEN_SIZES = WOMEN_BOOT_SIZES;

function closestSize(target: string, list: readonly string[]) {
  return closestBootSize(target, list);
}

function CustomizePage() {
  const locale = useStore((s) => s.locale);
  const currency = useStore((s) => s.currency);
  const setCurrency = useStore((s) => s.setCurrency);
  const draftParts = useStore((s) => s.draftParts);
  const draftPartNames = useStore((s) => s.draftPartNames);
  const size = useStore((s) => s.draftSize);
  const fit = useStore((s) => s.draftFit);
  const setPartColor = useStore((s) => s.setPartColor);
  const setDraftSize = useStore((s) => s.setDraftSize);
  const setDraftFit = useStore((s) => s.setDraftFit);
  const addCustomBoot = useStore((s) => s.addCustomBoot);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const dict = t(locale);
  const navigate = useNavigate();
  const product = getProduct("drone-custom");
  const [confirming, setConfirming] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [showKrOrder, setShowKrOrder] = useState(false);
  const [localNames, setLocalNames] = useState<PartColorNames | null>(null);
  const colorNames = localNames ?? draftPartNames;
  const sizes = fit === "women" ? WOMEN_SIZES : MEN_SIZES;

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("jidokaan-ship-country");
      if (saved) {
        setCurrency(currencyForCountry(saved));
        return;
      }
    } catch {
      /* ignore */
    }
    setCurrency(currencyForCountry("KR"));
  }, [setCurrency]);

  useEffect(() => {
    if (!sizes.includes(size)) {
      setDraftSize(closestSize(size, sizes));
    }
  }, [size, sizes, setDraftSize]);

  function handleConfirm() {
    setConfirming(true);
    addCustomBoot(1, false);
    setCartOpen(false);
    setShowKrOrder(true);
    setConfirming(false);
  }

  return (
    <div className="flex h-[calc(100dvh-var(--grok-banner-h,0px))] flex-col overflow-hidden bg-white font-[Helvetica_Neue,Helvetica,Arial,sans-serif] text-black md:flex-row">
      <LocaleSync />

      <div className="relative z-0 h-[42svh] min-h-[220px] w-full shrink-0 overflow-hidden bg-[#141416] md:h-full md:min-h-0 md:w-[58%] md:max-w-[58%] md:flex-none">
        <Link
          to="/"
          className="absolute top-3 left-3 z-20 inline-flex items-center gap-1 rounded-[30px] border border-black/10 bg-white/80 px-2.5 py-1.5 text-[10px] font-bold tracking-wide text-black backdrop-blur-sm md:top-5 md:left-5 md:px-3 md:py-2 md:text-[11px]"
        >
          <ArrowLeft className="size-3.5" />
          {dict.custom.back}
        </Link>
        <p className="pointer-events-none absolute top-3 left-1/2 z-20 w-[min(58%,18rem)] -translate-x-1/2 rounded-[30px] bg-black/55 px-2 py-1.5 text-center text-[9px] font-semibold leading-snug text-white backdrop-blur-[4px] md:top-5 md:w-[min(52%,22rem)] md:px-3 md:py-2 md:text-[11px]">
          {dict.custom.colorNote}
        </p>
        <LayerSimulator
          colors={draftParts}
          colorNames={colorNames}
          showGuide={showGuide}
          onGuideChange={setShowGuide}
          onPreviewClick={() => setZoomed(true)}
          className="absolute inset-0"
        />
        <p className="pointer-events-none absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-1 text-[9px] font-semibold text-white/90 md:bottom-4 md:text-[11px]">
          {dict.custom.expandPreview}
        </p>
      </div>

      <aside className="relative z-30 flex min-h-0 min-w-0 w-full flex-1 flex-col border-t border-[#ddd] bg-white pointer-events-auto md:w-[42%] md:flex-none md:border-t-0 md:border-l">
        <div className="hidden shrink-0 border-b border-[#eee] bg-white px-5 py-6 md:block">
          <h1 className="m-0 text-2xl font-black tracking-[1px] text-black uppercase">
            JIDOKAAN
          </h1>
          <p className="mt-0.5 mb-0 text-[11px] font-medium text-[#999]">
            Custom Studio
          </p>
          <p className="mt-1.5 mb-0 flex items-center text-[11px] font-semibold tracking-[0.5px] text-[#d0021b]">
            <span className="mr-1.5 text-sm">ⓘ</span>
            Click GUIDE ON/OFF to check the parts.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-3 pt-3 pb-5 md:px-5 md:pt-5 md:pb-8">
            {PICKABLE_PARTS.length === 0 ? (
              <p className="text-sm leading-relaxed text-neutral-500">
                베이스 사진만 표시 중입니다. G 색 사진이 오면 여기서 바꿉니다.
              </p>
            ) : null}
            {SIM_PARTS.filter((p) => PICKABLE_PARTS.includes(p.id)).map((part) => {
              const supplied = REAL_LAYERS[part.id];
              const pal = supplied
                ? paletteFor(part).filter(
                    (o) => o.name === "WHITE" || Boolean(supplied[o.name]),
                  )
                : paletteFor(part);
              return (
                <div key={part.id} className="mb-3.5 md:mb-8">
                  <div className="mb-1.5 flex items-center border-l-4 border-black pl-2 text-[13px] font-bold text-black md:mb-2.5 md:pl-2.5 md:text-sm">
                    {part.label}
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 md:grid-cols-4 md:gap-2">
                    {pal.map((opt) => {
                      const active =
                        (colorNames?.[part.id] ?? PHOTO_NATIVE[part.id]) ===
                        opt.name;
                      return (
                        <button
                          key={`${part.id}-${opt.name}`}
                          type="button"
                          title={opt.name}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPartColor(part.id, opt.color, opt.name);
                            setLocalNames((prev) => {
                              const next: PartColorNames = {
                                ...defaultPartNames(),
                                ...(prev ?? draftPartNames),
                                [part.id]: opt.name,
                              };
                              if (part.id === "i" || part.id === "d" || part.id === "a") {
                                const linked = linkedLColor(
                                  next.d,
                                  "",
                                  next.i,
                                  "",
                                  next.a,
                                  "",
                                );
                                next.l = linked.name;
                              }
                              return next;
                            });
                          }}
                          className={cn(
                            "relative z-10 aspect-square w-full touch-manipulation overflow-hidden rounded-[6px] border transition",
                            active
                              ? "scale-95 border-2 border-black shadow-[0_0_0_2px_#fff_inset]"
                              : "border-[#ddd] hover:scale-105 hover:border-[#888]",
                          )}
                          style={{
                            backgroundColor: opt.color,
                            backgroundImage:
                              opt.finish === "gold"
                                ? "linear-gradient(145deg, #f4e4b0 0%, #d7b24a 32%, #f0d36a 50%, #b8891c 78%, #ead07a 100%)"
                                : opt.finish === "silver"
                                  ? "url(/simulator/tex-silver.jpg)"
                                  : undefined,
                            backgroundSize: "cover",
                          }}
                        >
                          <span
                            className="absolute inset-0 flex items-center justify-center p-0.5 text-center text-[8px] font-bold leading-[1.1] break-words md:text-[10px]"
                            style={{ color: opt.isBright ? "#000" : "#fff" }}
                          >
                            {opt.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="border-t border-[#eee] pt-6">
              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                <span className="border-l-4 border-black pl-2.5 text-sm font-bold">
                  SIZE
                </span>
                <div className="flex gap-1.5">
                  {(["men", "women"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        const next = g === "women" ? WOMEN_SIZES : MEN_SIZES;
                        setDraftFit(g);
                        if (!next.includes(size)) {
                          setDraftSize(closestSize(size, next));
                        }
                      }}
                      className={cn(
                        "h-8 rounded-[6px] px-3 text-xs font-bold",
                        fit === g
                          ? "bg-black text-white"
                          : "border border-[#ddd] text-neutral-800 hover:border-[#888]",
                      )}
                    >
                      {g === "men" ? dict.custom.men : dict.custom.women}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDraftSize(s)}
                    className={cn(
                      "min-h-9 min-w-11 rounded-[6px] border text-xs font-bold",
                      size === s
                        ? "border-black bg-black text-white"
                        : "border-[#ddd] text-neutral-800 hover:border-[#888]",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="mt-6 mb-2 flex items-center border-l-4 border-black pl-2.5 text-sm font-bold">
                {dict.custom.sizeGuideTitle}
              </div>
              <p className="text-[12px] leading-relaxed text-neutral-600 md:text-[13px]">
                {dict.custom.sizeGuideBody}
              </p>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#ddd] bg-white px-3 py-2 md:space-y-2 md:p-4">
          {showKrOrder ? (
            <div className="space-y-3 py-1">
              <p className="text-[13px] leading-relaxed text-[#222] md:text-sm">
                {dict.custom.krOrderHint}
              </p>
              <Button
                size="lg"
                className="h-11 w-full rounded-[6px] bg-[#03C75A] text-sm text-white hover:bg-[#02b351]"
                asChild
              >
                <a
                  href={product ? naverProductUrl(product) : "https://smartstore.naver.com/lidea"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {dict.custom.naverOrder}
                </a>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="h-11 w-full rounded-[6px] border border-[#ddd] bg-white text-sm text-black hover:bg-neutral-50"
                type="button"
                onClick={() => navigate({ to: "/checkout" })}
              >
                {dict.custom.overseasPay}
              </Button>
            </div>
          ) : (
            <>
          <p className="mb-1.5 hidden text-center text-sm font-bold md:mb-0 md:block">
            {product ? formatProductPrice(product, currency) : "₩288,000"}
          </p>
          <div className="flex items-center gap-2 md:flex-col md:items-stretch">
            <p className="min-w-[4.5rem] shrink-0 text-left text-xs font-bold md:hidden">
              {product ? formatProductPrice(product, currency) : "₩288,000"}
            </p>
            <Button
              size="lg"
              className="h-11 min-h-11 flex-1 rounded-[6px] bg-black px-2 text-[12px] text-white hover:bg-neutral-800 md:h-11 md:w-full md:text-sm"
              disabled={confirming}
              onClick={handleConfirm}
            >
              {confirming ? (
                dict.checkout.placing
              ) : (
                <>
                  <Check className="size-3.5 md:size-4" />
                  <span className="truncate">{dict.custom.lockOrder}</span>
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-11 min-h-11 flex-1 rounded-[6px] border border-[#ddd] bg-white px-2 text-[12px] text-black hover:bg-neutral-50 md:w-full md:text-sm"
              type="button"
              onClick={() => {
                addCustomBoot(1);
                toast.success(dict.product.added);
              }}
            >
              <ShoppingBag className="size-3.5 md:size-4" />
              <span className="truncate">{dict.product.addToCart}</span>
            </Button>
          </div>
            </>
          )}
        </div>
      </aside>

      {zoomed ? (
        <div
          className="fixed inset-0 z-50 bg-black"
          role="dialog"
          aria-modal="true"
        >
          <LayerSimulator
            colors={draftParts}
            colorNames={colorNames}
            showGuide={false}
            hideChrome
            onPreviewClick={() => setZoomed(false)}
            className="absolute inset-0"
          />
          <button
            type="button"
            onClick={() => setZoomed(false)}
            className="absolute top-4 right-4 z-20 inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-[12px] font-bold text-black"
          >
            <X className="size-4" />
            {dict.custom.closePreview}
          </button>
        </div>
      ) : null}
    </div>
  );
}
