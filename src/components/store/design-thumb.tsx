import { LayerSimulator } from "@/components/customizer/layer-simulator";
import { defaultPartColors, defaultPartNames } from "@/lib/simulator-config";
import type { CartItem } from "@/lib/store";
import { getProduct } from "@/lib/products";
import { cn } from "@/lib/utils";

export function DesignThumb({
  item,
  className,
}: {
  item: CartItem;
  className?: string;
}) {
  const product = getProduct(item.productId);
  if (item.partNames || item.partColors) {
    return (
      <LayerSimulator
        colors={item.partColors ?? defaultPartColors()}
        colorNames={item.partNames ?? defaultPartNames()}
        hideChrome
        className={cn("bg-[#111]", className)}
      />
    );
  }
  const src = product?.image ?? product?.images?.[0];
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn("h-full w-full object-contain", className)}
      />
    );
  }
  return <div className={cn("bg-surface-muted", className)} />;
}
