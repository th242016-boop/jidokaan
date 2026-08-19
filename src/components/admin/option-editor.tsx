import { useState } from "react";
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
  const [name, setName] = useState("");
  const [vals, setVals] = useState("");

  function applyGroup() {
    const values = vals.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
    if (!name.trim() || !values.length) return;
    const groups: OptionGroup[] = [
      ...value.groups.filter((g) => g.name !== name.trim()),
      { name: name.trim(), values },
    ];
    onChange({
      ...value,
      enabled: true,
      groups,
      skus: buildSkus(groups, value.skus),
    });
    setName("");
    setVals("");
  }

  return (
    <div className="space-y-4 bg-[#f7f8fa] px-4 py-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange({ ...value, enabled: true })}
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
        <p className="text-sm text-[#555]">옵션 없는 단품입니다. 신발 사이즈·색 등이 필요하면 설정함.</p>
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
                  checked={value.type === "combo"}
                  onChange={() => onChange({ ...value, type: "combo" })}
                />
                조합형
              </label>
            </span>
          </label>
          <p className="text-xs text-[#00a832]">
            옵션별 재고·추가금액이 필요하면 조합형을 쓰세요. (컬러+사이즈, 용량+향 등)
          </p>

          <div className="grid gap-2 sm:grid-cols-[8rem_1fr_auto]">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="옵션명 예: 컬러"
            />
            <Input
              value={vals}
              onChange={(e) => setVals(e.target.value)}
              placeholder="옵션값 예: 빨강,노랑,검정  (쉼표로 구분)"
            />
            <Button type="button" onClick={applyGroup}>
              +
            </Button>
          </div>
          <Button type="button" variant="secondary" onClick={applyGroup}>
            옵션목록으로 적용
          </Button>

          {value.groups.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {value.groups.map((g) => (
                <li key={g.name} className="flex justify-between rounded bg-white px-3 py-1.5">
                  <span>
                    <b>{g.name}</b> : {g.values.join(", ")}
                  </span>
                  <button
                    type="button"
                    className="text-[#c00]"
                    onClick={() => {
                      const groups = value.groups.filter((x) => x.name !== g.name);
                      onChange({ ...value, groups, skus: buildSkus(groups, value.skus) });
                    }}
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {value.skus.length > 0 ? (
            <div className="overflow-x-auto rounded border border-[#ddd] bg-white">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-[#f3f4f6] text-xs">
                  <tr>
                    <th className="px-3 py-2">옵션</th>
                    <th className="px-3 py-2">추가금액(원)</th>
                    <th className="px-3 py-2">재고</th>
                    <th className="px-3 py-2">사용</th>
                  </tr>
                </thead>
                <tbody>
                  {value.skus.map((sku, i) => (
                    <tr key={sku.key} className="border-t border-[#eee]">
                      <td className="px-3 py-2">{sku.key}</td>
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
                        <input
                          type="checkbox"
                          checked={sku.enabled}
                          onChange={(e) => {
                            const skus = value.skus.map((s, idx) =>
                              idx === i ? { ...s, enabled: e.target.checked } : s,
                            );
                            onChange({ ...value, skus });
                          }}
                        />
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
