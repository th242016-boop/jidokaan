import { LayerSimulator } from "@/components/customizer/layer-simulator";
import { getProduct } from "@/lib/products";
import {
  READY_PARTS,
  defaultPartColors,
  defaultPartNames,
} from "@/lib/simulator-config";
import type { CartItem } from "@/lib/store";
import { cn } from "@/lib/utils";

export function hasCustomSpec(item: CartItem) {
  return Boolean(item.partNames || item.partColors);
}

export function customSpecLine(item: CartItem) {
  if (!item.partNames) return "";
  return READY_PARTS.map((id) => {
    const name = item.partNames?.[id];
    return name ? `${id.toUpperCase()} ${name}` : null;
  })
    .filter(Boolean)
    .join(" · ");
}

/** Real custom photo stack when A–L spec is on the cart item; else catalog image. */
export function CartItemVisual({
  item,
  className,
}: {
  item: CartItem;
  className?: string;
}) {
  const product = getProduct(item.productId);
  if (hasCustomSpec(item)) {
    return (
      <LayerSimulator
        colors={item.partColors ?? defaultPartColors()}
        colorNames={item.partNames ?? defaultPartNames()}
        hideChrome
        className={cn("pointer-events-none bg-[#111]", className)}
      />
    );
  }
  const src = product?.image ?? product?.images?.[0];
  if (src) {
    return (
      <img src={src} alt="" className={cn("h-full w-full object-contain", className)} />
    );
  }
  return <div className={cn("bg-surface-muted", className)} />;
}
