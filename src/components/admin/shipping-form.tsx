import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_SHIPPING,
  zoneLabel,
  type ShipZone,
  type ShippingSettings,
} from "@/lib/shipping";

const ZONES: ShipZone[] = ["kr", "asia", "pacific", "europe", "world"];

export function ShippingForm({
  initial,
  busy,
  onSave,
}: {
  initial: ShippingSettings;
  busy: boolean;
  onSave: (s: ShippingSettings) => void;
}) {
  const [s, setS] = useState(initial);

  function patchZone(zone: ShipZone, key: keyof ShippingSettings["zones"]["kr"], value: string) {
    const n = key.startsWith("days") ? value : Number(value) || 0;
    setS({
      ...s,
      zones: {
        ...s.zones,
        [zone]: { ...s.zones[zone], [key]: n },
      },
    });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(s);
      }}
    >
      <p className="text-sm text-[#333]">
        해외 브랜드는 국가 묶음(존)마다 정액 배송비를 받고, 한 켤레($230)부터는 일반 배송을 무료로 하는 경우가 많습니다.
        관세는 도착국에서 손님이 내는 DAP로 두는 게 한국 소규모 브랜드에 가장 편합니다.
      </p>

      <section className="rounded border border-[#d5d7dc] bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">무료 배송 기준 (일반 배송만)</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label>국내 무료 (원)</Label>
            <Input
              type="number"
              value={KR_HINT}
              disabled
              className="mt-1"
            />
            <p className="mt-1 text-xs text-[#555]">국내는 5만원 고정</p>
          </div>
          <div>
            <Label>해외 무료 (원)</Label>
            <Input
              type="number"
              className="mt-1"
              value={s.freeKrw}
              onChange={(e) => setS({ ...s, freeKrw: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>해외 무료 (달러)</Label>
            <Input
              type="number"
              className="mt-1"
              value={s.freeUsd}
              onChange={(e) => setS({ ...s, freeUsd: Number(e.target.value) || 0 })}
            />
          </div>
        </div>
      </section>

      <section className="overflow-x-auto rounded border border-[#d5d7dc] bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-[#f6f7f8] text-xs">
            <tr>
              <th className="px-3 py-2">권역</th>
              <th className="px-3 py-2">일반 원</th>
              <th className="px-3 py-2">일반 $</th>
              <th className="px-3 py-2">특급 원</th>
              <th className="px-3 py-2">특급 $</th>
              <th className="px-3 py-2">일반 일수</th>
              <th className="px-3 py-2">특급 일수</th>
            </tr>
          </thead>
          <tbody>
            {ZONES.map((z) => (
              <tr key={z} className="border-t border-[#eee]">
                <td className="px-3 py-2 text-xs">{zoneLabel(z, true)}</td>
                {(
                  [
                    "standardKrw",
                    "standardUsd",
                    "expressKrw",
                    "expressUsd",
                    "daysStandard",
                    "daysExpress",
                  ] as const
                ).map((key) => (
                  <td key={key} className="px-2 py-2">
                    <Input
                      className="h-9"
                      value={s.zones[z][key]}
                      onChange={(e) => patchZone(z, key, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? "저장 중…" : "배송비 저장"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setS(DEFAULT_SHIPPING)}>
          기본값으로
        </Button>
      </div>
    </form>
  );
}

const KR_HINT = 50000;
