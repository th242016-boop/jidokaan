import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export function KrOrderPanel({
  naverUrl,
  onOverseas,
}: {
  naverUrl: string;
  onOverseas?: () => void;
}) {
  const locale = useStore((s) => s.locale);
  const copy = t(locale).custom;
  return (
    <div className="space-y-3">
      <p className="text-base leading-relaxed text-fg">
        {copy.krOrderHint}
      </p>
      <Button
        size="lg"
        className="h-12 w-full bg-[#03C75A] text-white hover:bg-[#02b351]"
        asChild
      >
        <a href={naverUrl} target="_blank" rel="noopener noreferrer">
          {copy.naverOrder}
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
          {copy.overseasPay}
        </Button>
      ) : null}
    </div>
  );
}
