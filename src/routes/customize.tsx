import { specialOrderProduct } from "@/lib/special-order";
import { specialOrderCopy } from "@/lib/special-order-copy";
import { SpecialOrderNotice } from "@/components/store/special-order-notice";
import { storefrontDetailCopy, simulatorColorLabel } from "@/lib/storefront-detail-copy";
import { storefrontProductPrice } from "@/lib/storefront-money";
import { SimulatorShareControls } from "@/components/customizer/simulator-share-controls";
import { checkoutEnhancementsCopy } from "@/lib/checkout-enhancements-copy";
import { StyleFinder } from "@/components/customizer/style-finder";
import { useSpecialSimulator } from "@/lib/use-special-simulator";
import { FLOWER_A } from "@/lib/simulator-special";
import { isPublicSpecialPattern } from "@/lib/simulator-catalog";
import { specialSolidColorsFor, isSpecialSolid, specialSolidPartsFor } from "@/lib/special-solids";
import { SPECIAL_PATTERNS, patternPartsFor, patternSwatchPlacement } from "@/lib/special-patterns";
import { loadSnakeSwatches, snakeMaterialFor, type SnakeSwatches } from "@/lib/snake-materials";
import { loadLizardSwatches, lizardMaterialFor, type LizardSwatches } from "@/lib/lizard-materials";
import { finishFor } from "@/lib/special-finishes";
import { BEAD_COLORS, beadColorHex, beadSwatchDataUrl, type BeadSelection } from "@/lib/bead-material";
import { MESH_COLORS, LACE_COLORS, LACE_TINTS, type MeshColor } from "@/lib/mesh-laces";
import { captureDesign } from "@/lib/design-order";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, Check, RotateCcw, ShoppingBag, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { LocaleSync } from "@/components/locale-sync";
import { LayerSimulator } from "@/components/customizer/layer-simulator";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "@/components/store/cart-drawer";
import { useCatalog } from "@/lib/use-catalog";
import { simulatorUiCopy } from "@/lib/simulator-ui-copy";
import { IS_REVIEW_PREVIEW } from "@/lib/review-preview";
import { startOverseasCheckout, t } from "@/lib/i18n";
import {
  MEN_BOOT_SIZES,
  WOMEN_BOOT_SIZES,
  closestBootSize,
  naverProductUrl,
} from "@/lib/products";
import {
  paletteFor,
  colorByName,
  modelOf,
  partsForModel,
  PHOTO_NATIVE,
  PICKABLE_PARTS,
  REAL_LAYERS,
} from "@/lib/simulator-config";
import { useStore } from "@/lib/store";
import { requestedLocale } from "@/lib/locale-preference";
import { cn } from "@/lib/utils";
import { ShippingCountrySelect } from "@/components/store/shipping-country-select";
import { isActiveSalesCountry } from "@/lib/active-sales-policy";
import { checkoutCopy } from "@/lib/checkout-copy";

export const Route = createFileRoute("/customize")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { lang?: ReturnType<typeof requestedLocale> } => ({
    lang: requestedLocale(search.lang),
  }),
  component: CustomizeRoutePage,
});

const MEN_SIZES = MEN_BOOT_SIZES;
const WOMEN_SIZES = WOMEN_BOOT_SIZES;

function closestSize(target: string, list: readonly string[]) {
  return closestBootSize(target, list);
}

function CustomizeRoutePage() {
  const { lang } = Route.useSearch();
  return <CustomizePage lang={lang} />;
}

export function CustomizePage({ lang, shareToken }: { lang?: ReturnType<typeof requestedLocale>; shareToken?: string }) {
  const locale = useStore((s) => s.locale);
  const currency = useStore((s) => s.currency);
  const shippingCountry = useStore((s) => s.shippingCountry);
  const setShippingCountry = useStore((s) => s.setShippingCountry);
  const draftParts = useStore((s) => s.draftParts);
  const draftPartNames = useStore((s) => s.draftPartNames);
  const size = useStore((s) => s.draftSize);
  const fit = useStore((s) => s.draftFit);
  const setPartColor = useStore((s) => s.setPartColor);
  const resetDraftColors = useStore((s) => s.resetDraftColors);
  const setDraftSize = useStore((s) => s.setDraftSize);
  const setDraftFit = useStore((s) => s.setDraftFit);
  const addCustomBoot = useStore((s) => s.addCustomBoot);
  const ensureCustomBoot = useStore((s) => s.ensureCustomBoot);
  const specialOrder = useStore((s) => s.draftSpecialOrder);
  const setSpecialOrder = useStore((s) => s.setDraftSpecialOrder);
  const specialCopy = specialOrderCopy(locale);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const dict = t(locale);
  const copy = storefrontDetailCopy(locale);
  const simulatorCopy = simulatorUiCopy(locale);
  const { catalog } = useCatalog();
  const previewPaneRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [showKrOrder, setShowKrOrder] = useState(false);
  const [recommendationRevision, setRecommendationRevision] = useState(0);
  const model = modelOf(draftPartNames);
  const product = catalog.products.find((entry) => entry.id === (model === "mid" ? "drone-mid" : "drone-custom"));
  const pricedProduct = product ? specialOrderProduct(product, specialOrder) : undefined;
  const special = useSpecialSimulator(model, draftPartNames, shareToken);
  const [snakeSwatches, setSnakeSwatches] = useState<{ assets: typeof special.patternAssets; images: SnakeSwatches } | null>(null);
  const [lizardSwatches, setLizardSwatches] = useState<{ assets: typeof special.patternAssets; images: LizardSwatches } | null>(null);
  const beadSwatches = useMemo(() => special.enabled && model === "high"
    ? Object.fromEntries(BEAD_COLORS.map(color => [color, beadSwatchDataUrl(color)])) : {}, [special.enabled, model]);
  const colorNames = special.names;
  const [savingSpecial, setSavingSpecial] = useState(false);
  const setDraftModel = useStore((s) => s.setDraftModel);
  const sizes = fit === "women" ? WOMEN_SIZES : MEN_SIZES;

  useEffect(() => {
    let cancelled = false;
    const assets = special.patternAssets;
    if (!special.enabled || !assets["NATURAL SNAKE"]) { setSnakeSwatches(null); return; }
    void loadSnakeSwatches(assets).then(images => {
      if (!cancelled) setSnakeSwatches({ assets, images });
    }).catch(() => { if (!cancelled) setSnakeSwatches(null); });
    return () => { cancelled = true; };
  }, [special.enabled, special.patternAssets]);

  useEffect(() => {
    let cancelled = false;
    const assets = special.patternAssets;
    if (!special.enabled || !assets["RED LIZARD"]) { setLizardSwatches(null); return; }
    void loadLizardSwatches(assets).then(images => {
      if (!cancelled) setLizardSwatches({ assets, images });
    }).catch(() => { if (!cancelled) setLizardSwatches(null); });
    return () => { cancelled = true; };
  }, [special.enabled, special.patternAssets]);

  useEffect(() => {
    if (!sizes.includes(size)) {
      setDraftSize(closestSize(size, sizes));
    }
  }, [size, sizes, setDraftSize]);

  async function saveSpecial() {
    if (savingSpecial || special.busy || !special.assetsReady || !special.previewReady) return;
    setSavingSpecial(true);
    try {
      if (!(await special.validate())) return;
      const preview = await captureDesign(colorNames, { layerOverrides: special.overrides });
      if (!(await special.validate())) return;
      const link = document.createElement("a");
      link.href = preview;
      link.download = `JIDOKAAN-${model}-special-${Date.now()}.jpg`;
      link.click();
    } catch { toast.error(copy.saveError); }
    finally { setSavingSpecial(false); }
  }

  async function handleConfirm() {
    if (confirming) return;
    setConfirming(true);
    try {
      ensureCustomBoot();
      setCartOpen(false);
      if (shippingCountry === "KR") setShowKrOrder(true);
      else await navigate({ to: "/checkout" });
    } finally {
      setConfirming(false);
    }
  }

  function handleReset() {
    setRecommendationRevision(value => value + 1);
    if (special.enabled) special.reset();
    else resetDraftColors();
    setShowKrOrder(false);
    toast.success(dict.custom.resetToast);
  }

  if (shareToken !== undefined && !special.available) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-white px-6 text-center text-black">
        <LocaleSync requestedLocale={lang} />
        <div className="max-w-sm">
          <h1 className="text-2xl font-black tracking-wide">JIDOKAAN</h1>
          <p role={special.accessChecked ? "alert" : "status"} className="mt-4 text-sm text-neutral-600">
            {special.accessChecked ? copy.invalidLink : copy.loading}
          </p>
        </div>
      </main>
    );
  }

  return (
    <div
      className="flex flex-col overflow-hidden bg-white font-[Helvetica_Neue,Helvetica,Arial,sans-serif] text-black lg:flex-row"
      style={{ height: `calc(100dvh - var(--grok-banner-h, 0px) - ${IS_REVIEW_PREVIEW ? "88px" : "0px"})` }}
    >
      <LocaleSync requestedLocale={lang} />

      <div ref={previewPaneRef} className="relative z-0 h-[42svh] min-h-[180px] w-full shrink-0 overflow-hidden bg-[#141416] lg:h-full lg:min-h-0 lg:w-[58%] lg:max-w-[58%] lg:flex-none">
        <Link
          to="/"
          className="absolute top-3 left-3 z-20 inline-flex min-h-11 items-center gap-1 rounded-[30px] border border-black/10 bg-white/80 px-3 py-2 text-xs font-bold text-black backdrop-blur-sm md:top-5 md:left-5"
        >
          <ArrowLeft className="size-3.5" />
          {dict.custom.back}
        </Link>
        <p className="pointer-events-none absolute top-16 left-1/2 z-20 w-[min(88%,28rem)] -translate-x-1/2 rounded-[30px] bg-black/55 px-2 py-1.5 text-center text-xs font-semibold leading-snug text-white backdrop-blur-[4px] md:top-20 md:px-3 md:py-2">
          {dict.custom.colorNote}
        </p>
        <LayerSimulator
          colors={draftParts}
          colorNames={colorNames}
          layerOverrides={special.overrides}
          showGuide={showGuide}
          onGuideChange={setShowGuide}
          onPreviewClick={() => setZoomed(true)}
          className="absolute inset-0"
        />
        <p className="pointer-events-none absolute bottom-2 left-1/2 z-20 max-w-[90%] -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-1 text-center text-xs font-semibold text-white/90 md:bottom-4">
          {dict.custom.expandPreview}
        </p>
      </div>

      <aside className="relative z-30 flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-y-auto overscroll-contain border-t border-[#ddd] bg-white pointer-events-auto lg:w-[42%] lg:flex-none lg:overflow-hidden lg:border-t-0 lg:border-l">
        <div className="shrink-0 border-b border-[#eee] bg-white px-3 py-3 md:px-5 md:py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="m-0 text-2xl font-black tracking-[1px] text-black uppercase">
                JIDOKAAN
              </h1>
              <p className="mt-0.5 mb-0 text-[11px] font-medium text-[#999]">{dict.home.studioLabel}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div
                className="flex items-center gap-1 rounded-lg border border-[#ddd] p-1"
                role="group"
                aria-label={copy.model}
              >
                {(["high", "mid"] as const).map((value) => (
                  <button
                    type="button"
                    key={value}
                    aria-pressed={model === value}
                    onClick={() => {
                      setDraftModel(value);
                      setShowGuide(false);
                      setShowKrOrder(false);
                    }}
                    className={cn(
                      "min-h-11 rounded-md px-3 text-sm font-bold",
                      model === value ? "bg-black text-white" : "text-black hover:bg-neutral-100",
                    )}
                  >
                    {value === "high" ? copy.modelHigh : copy.modelMid}
                  </button>
                ))}
                {special.available && (
                  <button
                    type="button"
                    aria-pressed={special.enabled}
                    onClick={() => { special.toggle(); setShowKrOrder(false); }}
                    className={cn("min-h-11 rounded-md px-3 text-sm font-bold", special.enabled ? "bg-black text-white" : "text-black hover:bg-neutral-100")}
                  >{copy.special}</button>
                )}
              </div>
              <button
                type="button"
                onClick={handleReset}
                disabled={savingSpecial}
                title={dict.custom.reset}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-neutral-300 px-3 text-sm font-bold text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                {dict.custom.reset}
              </button>
            </div>
          </div>
          {special.isAdmin && <SimulatorShareControls />}
          {special.enabled && special.solidsFailed && <p role="alert" className="mt-2 text-xs text-red-700">{copy.materialError}</p>}
          {special.enabled && special.patternsFailed && <p role="alert" className="mt-2 text-xs text-red-700">{copy.materialError}</p>}
          {special.enabled && <p role="status" className="mt-2 text-[11px] text-neutral-600">{special.busy ? copy.loading : copy.saveDesign}</p>}
          <p className="mt-1.5 mb-0 hidden md:flex items-center text-[11px] font-semibold tracking-[0.5px] text-[#d0021b]">
            <span className="mr-1.5 text-sm">ⓘ</span>
            {dict.custom.guide2d}
          </p>
        </div>

        {/* Mobile scrolls all controls together so a tall order footer cannot
            squeeze the palette out of a short portrait or landscape viewport. */}
        <div className="min-h-0 flex-none lg:flex-1 lg:overflow-y-auto">
          <div className="px-3 pt-3 pb-5 md:px-5 md:pt-5 md:pb-8">
            {/* Keep recommendations private until the owner approves public launch. */}
            {special.accessChecked && special.canUsePrivateCatalog && (
              <StyleFinder
                key={`${model}-${special.enabled}-${special.isAdmin}-${special.canUsePrivateCatalog}-${recommendationRevision}`}
                model={model}
                locale={locale}
                special={special}
                disabled={savingSpecial || confirming}
                onApplied={() => { setShowKrOrder(false); setShowGuide(false); }}
              />
            )}
            {PICKABLE_PARTS.length === 0 ? (
              <p className="text-sm leading-relaxed text-neutral-500">
                {copy.loading}
              </p>
            ) : null}
            {partsForModel(colorNames)
              .filter((p) => PICKABLE_PARTS.includes(p.id))
              .map((part) => {
                const supplied = REAL_LAYERS[part.id];
                const standardPalette = supplied
                  ? paletteFor(part).filter((o) => o.name === "WHITE" || Boolean(supplied[o.name]))
                  : paletteFor(part);
                const pal = special.enabled && part.id === "a" ? MESH_COLORS.map(name => colorByName(name)!)
                  : special.enabled && specialSolidPartsFor(model).includes(part.id) ? [...standardPalette, ...specialSolidColorsFor(special.canUsePrivateCatalog)]
                  : standardPalette;
                return (
                  <div key={part.id} data-part={part.id} className="mb-3.5 md:mb-8">
                    <div className="mb-1.5 flex items-center border-l-4 border-black pl-2 text-[13px] font-bold text-black md:mb-2.5 md:pl-2.5 md:text-sm">
                      {special.enabled && part.id === "a" ? `A · ${copy.mesh}` : part.label}
                    </div>
                    <div className={cn("grid", special.enabled ? "grid-cols-10 gap-1 md:grid-cols-8" : "grid-cols-5 gap-1.5 md:grid-cols-4 md:gap-2")}>
                      {pal.map((opt) => {
                        const active =
                          (special.enabled && part.id === "a" ? special.mesh : (special.solids[part.id] ?? colorNames?.[part.id] ?? PHOTO_NATIVE[part.id])) === opt.name && !special.flowers[part.id] && !special.patterns[part.id] && !(special.enabled && part.id === "a" && special.meshPattern);
                        return (
                          <button
                            key={`${part.id}-${opt.name}`}
                            type="button"
                            title={simulatorColorLabel(opt.name, locale)}
                            disabled={special.enabled && (!special.assetsReady || (part.id === "a" && !special.meshReady) || (part.id !== "a" && isSpecialSolid(opt.name) && !special.solidsReady))}
                            aria-pressed={active}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (special.enabled && part.id === "a") special.selectMesh(opt.name as MeshColor);
                              else if (special.enabled) special.select(part.id, opt.name);
                              else setPartColor(part.id, opt.color, opt.name);
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
                              className={cn("absolute inset-0 flex items-center justify-center text-center font-bold leading-[1.1] break-words", special.enabled ? "p-px text-[6.5px] md:text-[8px]" : "p-0.5 text-[8px] md:text-[10px]")}
                              style={{ color: opt.isBright ? "#000" : "#fff" }}
                            >
                              {simulatorColorLabel(opt.name, locale)}
                            </span>
                          </button>
                        );
                      })}
                      {special.enabled && special.canUsePrivateCatalog && part.id === "a" && special.patternAssets["BLUE LEOPARD"] && (
                        <button
                          type="button"
                          title={copy.blueLeopard}
                          aria-pressed={special.meshPattern === "BLUE LEOPARD"}
                          disabled={!special.meshReady}
                          onClick={() => special.selectMeshPattern("BLUE LEOPARD")}
                          className={cn("relative z-10 aspect-square w-full touch-manipulation overflow-hidden rounded-[6px] border transition", special.meshPattern === "BLUE LEOPARD" ? "scale-95 border-2 border-black shadow-[0_0_0_2px_#fff_inset]" : "border-[#ddd] hover:scale-105 hover:border-[#888]")}
                          style={{ backgroundImage: `url(${special.patternAssets["BLUE LEOPARD"].swatch})`, ...patternSwatchPlacement(special.patternAssets["BLUE LEOPARD"]), backgroundRepeat: "no-repeat" }}
                        >
                          <span className="absolute inset-0 flex items-center justify-center p-px text-center text-[6.5px] font-bold leading-[1.1] md:text-[8px]">
                            <span className="min-w-0 max-w-full break-words whitespace-normal rounded bg-white/85 px-0.5 py-0.5 text-black">{copy.blueLeopard}</span>
                          </span>
                        </button>
                      )}
                      {special.enabled && special.canUsePrivateCatalog && special.layers[part.id] && special.swatch && (
                        <button
                          type="button"
                          title={FLOWER_A}
                          aria-pressed={Boolean(special.flowers[part.id])}
                          onClick={() => special.select(part.id, FLOWER_A)}
                          className={cn("relative z-10 aspect-square w-full touch-manipulation overflow-hidden rounded-[6px] border transition", special.flowers[part.id] ? "scale-95 border-2 border-black shadow-[0_0_0_2px_#fff_inset]" : "border-[#ddd] hover:scale-105 hover:border-[#888]")}
                          style={{ backgroundImage: `url(${special.swatch})`, backgroundSize: "cover", backgroundPosition: "center" }}
                        >
                          <span className="absolute inset-0 flex items-center justify-center p-px text-center text-[6.5px] font-bold leading-[1.1] md:text-[8px]">
                            <span className="min-w-0 max-w-full whitespace-normal rounded bg-white/85 px-0.5 py-0.5 text-black">{FLOWER_A}</span>
                          </span>
                        </button>
                      )}
                      {special.enabled && patternPartsFor(model).includes(part.id) && SPECIAL_PATTERNS.map(pattern => {
                        const asset = special.patternAssets[pattern.name];
                        if ((!special.canUsePrivateCatalog && !isPublicSpecialPattern(pattern.name)) || !asset || !patternPartsFor(model, pattern.name).includes(part.id)) return null;
                        const active = special.patterns[part.id] === pattern.name;
                        const finish = finishFor(pattern.name);
                        const snake = snakeMaterialFor(pattern.name);
                        const lizard = lizardMaterialFor(pattern.name);
                        const swatch = lizard
                          ? lizardSwatches?.assets === special.patternAssets ? lizardSwatches.images[lizard.name] : undefined
                          : snake
                          ? snakeSwatches?.assets === special.patternAssets ? snakeSwatches.images[snake.name] : undefined
                          : asset.swatch;
                        return (
                          <button
                            key={pattern.name}
                            type="button"
                            title={pattern.label}
                            aria-pressed={active}
                            onClick={() => special.select(part.id, pattern.name)}
                            className={cn("relative z-10 aspect-square w-full touch-manipulation overflow-hidden rounded-[6px] border transition", active ? "scale-95 border-2 border-black shadow-[0_0_0_2px_#fff_inset]" : "border-[#ddd] hover:scale-105 hover:border-[#888]")}
                            style={{ backgroundColor: finish?.color ?? lizard?.color ?? snake?.color, backgroundImage: finish || !swatch ? undefined : `url(${swatch})`, ...patternSwatchPlacement(asset), backgroundRepeat: "no-repeat", isolation: "isolate" }}
                          >
                            {finish && <span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{
                              backgroundImage: `url(${asset.swatch})`, backgroundSize: "cover", backgroundPosition: "center",
                              mixBlendMode: "multiply", filter: "brightness(1.4)", opacity: finish.kind === "matte" ? 0.12 : 0.45,
                            }} />}
                            <span className="absolute inset-0 flex items-center justify-center p-px text-center text-[6.5px] font-bold leading-[1.1] md:text-[8px]">
                              <span className="min-w-0 max-w-full break-words whitespace-normal rounded bg-white/85 px-0.5 py-0.5 text-black">{pattern.label}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {special.enabled && part.id === "a" && special.meshPatternFailed && (
                      <p role="alert" className="mt-2 text-xs text-red-700">{copy.materialError}</p>
                    )}
                    {special.enabled && part.id === "a" && (
                      <div data-part="laces" role="group" aria-label={copy.laces} className="mt-4">
                        <div className="mb-1.5 border-l-4 border-black pl-2 text-[13px] font-bold text-black md:mb-2.5 md:text-sm">{copy.laces}</div>
                        <div className="grid grid-cols-10 gap-1 md:grid-cols-8">
                          {LACE_COLORS.map(name => {
                            const opt = name === "HOT PINK"
                              ? { color: `rgb(${LACE_TINTS[name].join(",")})`, isBright: false }
                              : colorByName(name)!;
                            return <button key={name} type="button" title={simulatorColorLabel(name, locale)} disabled={!special.meshReady}
                              aria-pressed={special.laces === name} onClick={() => special.selectLaces(name)}
                              className={cn("relative z-10 aspect-square w-full touch-manipulation overflow-hidden rounded-[6px] border transition", special.laces === name ? "scale-95 border-2 border-black shadow-[0_0_0_2px_#fff_inset]" : "border-[#ddd] hover:scale-105 hover:border-[#888]")}
                              style={{ backgroundColor: opt.color }}>
                              <span className="absolute inset-0 flex items-center justify-center p-px text-center text-[6.5px] font-bold leading-[1.1] md:text-[8px]" style={{ color: opt.isBright ? "#000" : "#fff" }}>{simulatorColorLabel(name, locale)}</span>
                            </button>;
                          })}
                        </div>
                        {special.meshFailed && <p role="alert" className="mt-2 text-xs text-red-700">{copy.materialError}</p>}
                      </div>
                    )}
                  </div>
                );
              })}

            {special.enabled && model === "high" && (
              <div data-part="beads" role="group" aria-label={`L · ${copy.beads}`} className="mb-3.5 md:mb-8">
                <div className="mb-1.5 border-l-4 border-black pl-2 text-[13px] font-bold text-black md:mb-2.5 md:pl-2.5 md:text-sm">{`L · ${copy.beads}`}</div>
                <div className="mb-2 text-[10px] text-neutral-500">E · F · G · H</div>
                <div className="grid grid-cols-10 gap-1 md:grid-cols-8">
                  {(["NONE", ...BEAD_COLORS] as BeadSelection[]).map(name => {
                    const opt = name === "NONE" ? undefined : colorByName(name);
                    const active = special.beads === name;
                    return <button key={name} type="button" title={simulatorColorLabel(name, locale)} disabled={!special.meshReady}
                      aria-pressed={active} onClick={() => special.selectBeads(name)}
                      className={cn("relative z-10 aspect-square w-full touch-manipulation overflow-hidden rounded-[6px] border transition", active ? "scale-95 border-2 border-black shadow-[0_0_0_2px_#fff_inset]" : "border-[#ddd] hover:scale-105 hover:border-[#888]")}
                      style={{ backgroundColor: name === "NONE" ? "#fff" : beadColorHex(name), backgroundImage: opt ? `url(${beadSwatches[name]})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
                      <span className="absolute inset-0 flex items-center justify-center p-px text-center text-[6.5px] font-bold leading-[1.1] md:text-[8px]">
                        <span className="max-w-full rounded bg-white/85 px-0.5 py-0.5 text-black">{simulatorColorLabel(name, locale)}</span>
                      </span>
                    </button>;
                  })}
                </div>
              </div>
            )}

            {!special.enabled ? <div className="space-y-3 border-t border-[#eee] pt-6">
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={!specialOrder ? "default" : "secondary"} className="min-h-11 whitespace-normal" aria-pressed={!specialOrder} onClick={() => setSpecialOrder(false)}>{specialCopy.standard}</Button>
                <Button type="button" variant={specialOrder ? "default" : "secondary"} className="min-h-11 whitespace-normal" aria-pressed={specialOrder} onClick={() => setSpecialOrder(true)}>{specialCopy.special} ({shippingCountry === "JP" ? "+¥4,500" : shippingCountry === "KR" ? "+₩30,000" : "+US$30"})</Button>
              </div>
              {specialOrder ? <SpecialOrderNotice locale={locale} /> : null}
            </div> : null}
            <div className="border-t border-[#eee] pt-6">
              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                <span className="border-l-4 border-black pl-2.5 text-sm font-bold">{dict.product.size}{/[（(]\s*mm\s*[)）]/i.test(dict.product.size) ? "" : " (mm)"}</span>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label={`${dict.custom.men} / ${dict.custom.women}`}>
                  {(["men", "women"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      aria-pressed={fit === g}
                      onClick={() => {
                        const next = g === "women" ? WOMEN_SIZES : MEN_SIZES;
                        setDraftFit(g);
                        if (!next.includes(size)) {
                          setDraftSize(closestSize(size, next));
                        }
                      }}
                      className={cn(
                        "min-h-11 rounded-[6px] px-3 text-sm font-bold",
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
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={dict.product.size}>
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={size === s}
                    onClick={() => setDraftSize(s)}
                    className={cn(
                      "min-h-11 min-w-11 rounded-[6px] border px-1 text-sm font-bold",
                      size === s
                        ? "border-black bg-black text-white"
                        : "border-[#ddd] text-neutral-800 hover:border-[#888]",
                    )}
                  >
                    {s} mm
                  </button>
                ))}
              </div>

              <div className="mt-6 mb-2 flex items-center border-l-4 border-black pl-2.5 text-sm font-bold">
                {dict.custom.sizeGuideTitle}
              </div>
              <p className="mb-3 text-sm leading-relaxed text-neutral-700">{checkoutEnhancementsCopy(locale).sizeHelp}</p>
              <p className="text-sm leading-relaxed text-neutral-600">
                {dict.custom.sizeGuideBody}
              </p>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#ddd] bg-white px-3 py-2 md:space-y-2 md:p-4">
          {!special.enabled ? <div className="mb-3"><ShippingCountrySelect /></div> : null}
          {special.enabled ? (
            <Button type="button" className="h-11 w-full rounded-[6px] bg-black text-white hover:bg-neutral-800" disabled={savingSpecial || special.busy || !special.assetsReady || !special.previewReady} onClick={() => void saveSpecial()}>
              {savingSpecial ? copy.saving : copy.saveDesign}
            </Button>
          ) : showKrOrder && shippingCountry === "KR" ? (
            <div className="space-y-3 py-1">
              <p className="text-[13px] leading-relaxed text-[#222] md:text-sm">
                {dict.custom.krOrderHint}
              </p>
              <Button
                size="lg"
                className="h-auto min-h-11 w-full whitespace-normal rounded-[6px] bg-[#03C75A] py-2 text-sm text-white hover:bg-[#02b351]"
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
                className="h-auto min-h-11 w-full whitespace-normal rounded-[6px] border border-[#ddd] bg-white py-2 text-sm text-black hover:bg-neutral-50"
                type="button"
                onClick={() => {
                  startOverseasCheckout();
                  if (shippingCountry === "KR") setShippingCountry("");
                  navigate({ to: "/checkout" });
                }}
              >
                {dict.custom.overseasPay}
              </Button>
            </div>
          ) : (
            <>
              <p className="mb-1.5 hidden text-center text-sm font-bold md:mb-0 md:block">
                {pricedProduct ? storefrontProductPrice(pricedProduct, currency, shippingCountry, locale) : "₩288,000"}
              </p>
              <div className="flex items-center gap-2 max-[400px]:flex-wrap md:flex-col md:items-stretch">
                <p className="min-w-[4.5rem] shrink-0 text-left text-xs font-bold max-[400px]:basis-full max-[400px]:text-center md:hidden">
                  {pricedProduct ? storefrontProductPrice(pricedProduct, currency, shippingCountry, locale) : "₩288,000"}
                </p>
                <Button
                  size="lg"
                  className="h-auto min-h-11 min-w-0 flex-1 whitespace-normal rounded-[6px] bg-black px-2 py-2 text-sm text-white hover:bg-neutral-800 md:w-full"
                  disabled={confirming}
                  onClick={handleConfirm}
                >
                  {confirming ? (
                    dict.checkout.placing
                  ) : (
                    <>
                      <Check className="size-3.5 md:size-4" />
                      <span>{shippingCountry && !isActiveSalesCountry(shippingCountry) ? checkoutCopy(locale).selectCountry : dict.custom.lockOrder}</span>
                    </>
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-auto min-h-11 min-w-0 flex-1 whitespace-normal rounded-[6px] border border-[#ddd] bg-white px-2 py-2 text-sm text-black hover:bg-neutral-50 md:w-full"
                  type="button"
                  onClick={() => {
                    addCustomBoot(1);
                    toast.success(dict.product.added);
                  }}
                >
                  <ShoppingBag className="size-3.5 md:size-4" />
                  <span>{dict.product.addToCart}</span>
                </Button>
              </div>
            </>
          )}
        </div>
      </aside>

      <Dialog.Root open={zoomed} onOpenChange={setZoomed}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black" />
          <Dialog.Content
            className="fixed inset-0 z-50 bg-black outline-none"
            aria-describedby={undefined}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              previewPaneRef.current?.querySelector<HTMLElement>('[role="button"]')?.focus();
            }}
          >
            <Dialog.Title className="sr-only">{simulatorCopy.previewAlt}</Dialog.Title>
            <LayerSimulator
              colors={draftParts}
              colorNames={colorNames}
              layerOverrides={special.overrides}
              showGuide={false}
              hideChrome
              className="absolute inset-0"
            />
            <Dialog.Close asChild>
              <button
                type="button"
                className="absolute top-4 right-4 z-20 inline-flex min-h-11 items-center gap-1 rounded-full bg-white px-3 py-2 text-sm font-bold text-black"
              >
                <X className="size-4" />
                {dict.custom.closePreview}
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <CartDrawer />
    </div>
  );
}
