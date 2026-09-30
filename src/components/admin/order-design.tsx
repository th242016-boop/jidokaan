import { LayerSimulator } from "@/components/customizer/layer-simulator";
import { completeDesign, designColors, validDesignPreview } from "@/lib/design-order";
import type { OrderItem } from "@/lib/order-types";
export function OrderDesign({
  item,
  orderId,
  index,
}: {
  item: OrderItem;
  orderId: string;
  index: number;
}) {
  const names = completeDesign(item.partNames);
  const snapshot = validDesignPreview(item.designPreview) ? item.designPreview : null;
  if (!snapshot && !names)
    return (
      <p className="my-3 rounded border border-amber-300 bg-amber-50 p-3 text-amber-900">
        완전한 디자인 이미지·색상 정보가 저장되지 않은 주문입니다. 아래에 실제 저장된 사양만
        표시합니다. 고객 확인 전 임의의 디자인으로 제작하지 마세요.
      </p>
    );
  return (
    <figure className="my-4 max-w-xl overflow-hidden rounded-lg border bg-[#121214]">
      <div className="aspect-square w-full">
        {snapshot ? (
          <img
            src={snapshot}
            alt={`주문 ${index + 1} 확정 디자인`}
            className="h-full w-full object-contain"
          />
        ) : (
          <LayerSimulator colors={designColors(names!)} colorNames={names!} hideChrome />
        )}
      </div>
      <figcaption className="space-y-2 bg-[#f5f6f8] p-3 text-sm text-[#333]">
        <p>
          {snapshot
            ? "고객이 결제 전 확인한 디자인 · 주문 당시 저장본"
            : "기존 주문에 저장된 부위별 색상으로 표시한 미리보기 · 주문 당시 이미지 저장본은 없음"}
        </p>
        {snapshot ? (
          <a
            href={snapshot}
            download={`${orderId}-design-${index + 1}.jpg`}
            className="inline-block font-semibold underline"
          >
            확정 디자인 이미지 다운로드
          </a>
        ) : null}
      </figcaption>
    </figure>
  );
}
