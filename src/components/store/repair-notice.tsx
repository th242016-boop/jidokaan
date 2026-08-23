export function RepairNotice({ className = "" }: { className?: string }) {
  return (
    <aside
      className={`rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-muted ${className}`}
    >
      <p className="font-medium text-fg">수선 · 소재 안내</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>국내: 창 벌어짐·마모는 무료 수선·보강입니다.</li>
        <li>창 교체는 5만원입니다.</li>
        <li>가죽 갑피는 무겁고, 이염·물빠짐이 있을 수 있습니다.</li>
      </ul>
    </aside>
  );
}
