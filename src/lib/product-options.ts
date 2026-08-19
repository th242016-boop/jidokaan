export type OptionGroup = {
  name: string;
  values: string[];
};

export type OptionSku = {
  key: string;
  values: string[];
  extraKrw: number;
  extraUsd: number;
  stock: number;
  enabled: boolean;
};

export type ProductOptions = {
  enabled: boolean;
  type: "single" | "combo";
  groups: OptionGroup[];
  skus: OptionSku[];
};

export const EMPTY_OPTIONS: ProductOptions = {
  enabled: false,
  type: "combo",
  groups: [],
  skus: [],
};

export function skuKey(values: string[]) {
  return values.join(" / ");
}

export function buildSkus(groups: OptionGroup[], prev: OptionSku[] = []): OptionSku[] {
  const lists = groups
    .map((g) => ({ name: g.name.trim(), values: g.values.map((v) => v.trim()).filter(Boolean) }))
    .filter((g) => g.name && g.values.length);
  if (!lists.length) return [];
  let rows: string[][] = [[]];
  for (const g of lists) {
    rows = rows.flatMap((row) => g.values.map((v) => [...row, v]));
  }
  const old = new Map(prev.map((s) => [s.key, s]));
  return rows.map((values) => {
    const key = skuKey(values);
    const hit = old.get(key);
    return {
      key,
      values,
      extraKrw: hit?.extraKrw ?? 0,
      extraUsd: hit?.extraUsd ?? 0,
      stock: hit?.stock ?? 99,
      enabled: hit?.enabled ?? true,
    };
  });
}

export function findSku(opts: ProductOptions | undefined, values: string[]) {
  if (!opts?.enabled) return null;
  const key = skuKey(values);
  return opts.skus.find((s) => s.key === key && s.enabled) ?? null;
}
