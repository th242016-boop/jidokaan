import { useState } from "react";
import {
  PHOTO_BASE,
  PHOTO_NATIVE,
  READY_PARTS,
  REAL_LAYERS,
  SIM_PARTS,
  type PartColorNames,
  type PartColors,
  type PartId,
} from "@/lib/simulator-config";
import { cn } from "@/lib/utils";

export function LayerSimulator({
  colors: _colors,
  colorNames,
  className,
  showGuide: controlledGuide,
  onGuideChange,
  hideChrome,
  onPreviewClick,
}: {
  colors: PartColors;
  colorNames?: PartColorNames;
  className?: string;
  showGuide?: boolean;
  onGuideChange?: (v: boolean) => void;
  hideChrome?: boolean;
  onPreviewClick?: () => void;
}) {
  const [internalGuide, setInternalGuide] = useState(false);
  const showGuide = controlledGuide ?? internalGuide;
  const setGuide = onGuideChange ?? setInternalGuide;

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden",
        className,
      )}
      style={{
        background:
          "radial-gradient(ellipse 70% 55% at 48% 42%, #2a2a30 0%, #121214 50%, #070708 100%)",
      }}
    >
      {hideChrome ? null : (
        <button
          type="button"
          onClick={() => setGuide(!showGuide)}
          className="absolute top-3 right-3 z-20 rounded-[30px] border border-white/30 bg-black/60 px-3 py-1.5 text-[10px] font-bold tracking-[0.5px] text-white shadow-[0_4px_10px_rgba(0,0,0,0.15)] backdrop-blur-[4px] transition active:scale-95 md:top-5 md:right-5 md:px-4 md:py-2 md:text-[11px]"
        >
          GUIDE ON/OFF
        </button>
      )}

      <button
        type="button"
        className="relative h-full w-full cursor-zoom-in border-0 bg-transparent p-0"
        onClick={onPreviewClick}
        aria-label="Enlarge preview"
      >
        <img
          src={`${PHOTO_BASE}`}
          alt="JIDOKAAN custom base"
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
        />

        {SIM_PARTS.filter((p) => READY_PARTS.includes(p.id)).map((part) => {
          const name =
            colorNames?.[part.id as PartId] ??
            PHOTO_NATIVE[part.id as PartId] ??
            "WHITE";
          const src = REAL_LAYERS[part.id]?.[name];
          if (!src) return null;
          return (
            <img
              key={`${part.id}-${name}`}
              src={src}
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full object-contain"
              draggable={false}
            />
          );
        })}

        {showGuide ? (
          <img
            src="/simulator/photo/guide.png?v=g2"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-contain"
            draggable={false}
          />
        ) : null}
      </button>
    </div>
  );
}
