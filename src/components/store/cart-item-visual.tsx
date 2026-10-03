import { LayerSimulator } from "@/components/customizer/layer-simulator";
import { getProduct } from "@/lib/products";
import { designSpecLine, defaultPartColors, defaultPartNames } from "@/lib/simulator-config";
import type { CartItem } from "@/lib/store";
import { cn } from "@/lib/utils";

export function hasCustomSpec(item: CartItem) {
  return Boolean(item.partNames || item.partColors);
}

export function customSpecLine(item: CartItem) {
  return designSpecLine(item.partNames);
}

/** Real custom photo stack when A–L spec is on the cart item; else catalog image. */
export function CartItemVisual({ item, className }: { item: CartItem; className?: string }) {
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
    return <img src={src} alt="" className={cn("h-full w-full object-contain", className)} />;
  }
  return <div className={cn("bg-surface-muted", className)} />;
}
