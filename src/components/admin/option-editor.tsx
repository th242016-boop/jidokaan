import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildSkus,
  type OptionGroup,
  type ProductOptions,
} from "@/lib/product-options";

export function OptionEditor({
  value,
  onChange,
}: {
  value: ProductOptions;
  onChange: (next: ProductOptions) => void;
}) {
  const count = Math.max(1, value.groups.length || 2);

  function setGroupCount(n: number) {
    const groups: OptionGroup[] = [];
    for (let i = 0; i < n; i++) {
      groups.push(value.groups[i] ?? { name: i === 0 ? "옵션" : "사이즈", values: [] });
    }
    onChange({
      ...value,
      enabled: true,
      type: "combo",
      groups,
      skus: buildSkus(groups, value.skus),
    });
  }

  function patchGroup(i: number, patch: Partial<OptionGroup>) {
    const groups = value.groups.map((g, idx) => (idx === i ? { ...g, ...patch } : g));
    onChange({ ...value, groups });
  }

  function applyList() {
    const groups = value.groups
      .map((g) => ({
        name: g.name.trim(),
        values: g.values.map((v) => v.trim()).filter(Boolean),
      }))
      .filter((g) => g.name && g.values.length);
    onChange({
      ...value,
      enabled: true,
      groups,
      skus: buildSkus(groups, value.skus),
    });
  }

  return (
    <div className="space-y-4 bg-[#f7f8fa] px-4 py-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            onChange({
              ...value,
              enabled: true,
              groups: value.groups.length
                ? value.groups
                : [
                    { name: "옵션", values: [] },
                    { name: "사이즈", values: [] },
                  ],
            })
          }
          className={`h-9 px-4 text-sm font-semibold ${
            value.enabled ? "bg-[#00c73c] text-white" : "border border-[#ddd] bg-white"
          }`}
        >
          설정함
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...value, enabled: false })}
          className={`h-9 px-4 text-sm font-semibold ${
            !value.enabled ? "bg-[#00c73c] text-white" : "border border-[#ddd] bg-white"
          }`}
        >
          설정안함
        </button>
      </div>

      {!value.enabled ? (
        <p className="text-sm text-[#555]">
          옵션이 없는 단품입니다. 컬러·사이즈처럼 고를 게 있으면 설정함.
        </p>
      ) : (
        <>
          <label className="flex items-center gap-4 text-sm">
            구성타입
            <span className="inline-flex items-center gap-4">
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="radio"
                  checked={value.type === "single"}
                  onChange={() => onChange({ ...value, type: "single" })}
                />
                단독형
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="radio"
                  checked={value.type !== "single"}
                  onChange={() => onChange({ ...value, type: "combo" })}
                />
                조합형
              </label>
            </span>
          </label>
          <p className="text-xs text-[#00a832]">
            옵션명과 값을 넣고 「옵션목록으로 적용」을 누르면 아래 표가 만들어집니다. 고객 화면에도 그대로 나갑니다.
          </p>

          <label className="flex items-center gap-3 text-sm">
            옵션명 개수
            <select
              className="h-9 rounded border border-[#ccc] bg-white px-2"
              value={count}
              onChange={(e) => setGroupCount(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}개
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-2">
            {(value.groups.length ? value.groups : [{ name: "", values: [] }]).map((g, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[8rem_1fr]">
                <Input
                  value={g.name}
                  onChange={(e) => patchGroup(i, { name: e.target.value })}
                  placeholder={i === 0 ? "옵션명 예: 옵션" : "옵션명 예: 사이즈"}
                />
                <Input
                  value={g.values.join(",")}
                  onChange={(e) =>
                    patchGroup(i, {
                      values: e.target.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="옵션값 쉼표로 구분  예: 여성225,여성230,남성240"
                />
              </div>
            ))}
          </div>

          <Button type="button" className="bg-[#00c73c] text-white hover:bg-[#00b434]" onClick={applyList}>
            옵션목록으로 적용
          </Button>

          {value.skus.length > 0 ? (
            <div className="overflow-x-auto rounded border border-[#ddd] bg-white">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-[#f3f4f6] text-xs">
                  <tr>
                    {(value.groups.length ? value.groups : [{ name: "옵션" }]).map((g) => (
                      <th key={g.name} className="px-3 py-2">
                        {g.name || "옵션"}
                      </th>
                    ))}
                    <th className="px-3 py-2">추가금액(원)</th>
                    <th className="px-3 py-2">재고</th>
                    <th className="px-3 py-2">판매상태</th>
                  </tr>
                </thead>
                <tbody>
                  {value.skus.map((sku, i) => (
                    <tr key={sku.key} className="border-t border-[#eee]">
                      {sku.values.map((v, vi) => (
                        <td key={`${sku.key}-${vi}`} className="px-3 py-2">
                          {v}
                        </td>
                      ))}
                      <td className="px-3 py-1">
                        <Input
                          className="h-8 w-28"
                          type="number"
                          value={sku.extraKrw}
                          onChange={(e) => {
                            const extraKrw = Number(e.target.value) || 0;
                            const skus = value.skus.map((s, idx) =>
                              idx === i
                                ? { ...s, extraKrw, extraUsd: Math.round(extraKrw / 13) }
                                : s,
                            );
                            onChange({ ...value, skus });
                          }}
                        />
                      </td>
                      <td className="px-3 py-1">
                        <Input
                          className="h-8 w-20"
                          type="number"
                          value={sku.stock}
                          onChange={(e) => {
                            const stock = Number(e.target.value) || 0;
                            const skus = value.skus.map((s, idx) =>
                              idx === i ? { ...s, stock } : s,
                            );
                            onChange({ ...value, skus });
                          }}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className="h-8 rounded border border-[#ccc] bg-white px-1 text-xs"
                          value={sku.enabled ? "on" : "off"}
                          onChange={(e) => {
                            const enabled = e.target.value === "on";
                            const skus = value.skus.map((s, idx) =>
                              idx === i ? { ...s, enabled } : s,
                            );
                            onChange({ ...value, skus });
                          }}
                        >
                          <option value="on">판매중</option>
                          <option value="off">품절</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
