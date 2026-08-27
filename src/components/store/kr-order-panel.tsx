import { Button } from "@/components/ui/button";

export function KrOrderPanel({
  naverUrl,
  onOverseas,
}: {
  naverUrl: string;
  onOverseas?: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-[#222]">
        국내 고객은 네이버 스토어에서 주문해 주세요.
        해외 고객은 이 사이트에서 결제할 수 있습니다.
      </p>
      <Button
        size="lg"
        className="h-12 w-full bg-[#03C75A] text-white hover:bg-[#02b351]"
        asChild
      >
        <a href={naverUrl} target="_blank" rel="noopener noreferrer">
          네이버 스토어에서 주문
        </a>
      </Button>
      {onOverseas ? (
        <Button
          size="lg"
          variant="secondary"
          className="h-12 w-full"
          type="button"
          onClick={onOverseas}
        >
          해외 고객은 이 사이트에서 결제
        </Button>
      ) : null}
    </div>
  );
}
