import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { majorsOf, type ShopCategory } from "@/lib/shop-taxonomy";

export function CategoryManager({
  categories,
  busy,
  onSave,
}: {
  categories: ShopCategory[];
  busy: boolean;
  onSave: (cats: ShopCategory[]) => void;
}) {
  const [cats, setCats] = useState(majorsOf(categories));
  const [majorName, setMajorName] = useState("");

  function addMajor() {
    const name = majorName.trim();
    if (!name) return;
    const id = slug(name);
    if (cats.some((c) => c.id === id)) {
      alert("같은 이름의 분류가 있습니다.");
      return;
    }
    setCats([...cats, { id, name, parentId: null }]);
    setMajorName("");
  }

  function remove(id: string) {
    if (cats.length <= 1) {
      alert("분류는 하나 이상 남겨 주세요.");
      return;
    }
    setCats(cats.filter((c) => c.id !== id));
  }

  function rename(id: string, name: string) {
    setCats(cats.map((c) => (c.id === id ? { ...c, name } : c)));
  }

  function move(id: string, dir: -1 | 1) {
    const i = cats.findIndex((c) => c.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= cats.length) return;
    const next = [...cats];
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
    setCats(next);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#333]">
        큰 분류만 씁니다. 기본은 <b>의류 · 신발 · 기타</b>입니다. 소분류는 없습니다.
        상품을 올릴 때 이 셋 중 하나만 고르면 됩니다.
      </p>

      <section className="rounded border border-[#d5d7dc] bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">분류 추가</h2>
        <div className="flex flex-wrap gap-2">
          <Input
            className="h-10 max-w-xs"
            value={majorName}
            onChange={(e) => setMajorName(e.target.value)}
            placeholder="예: 의류"
          />
          <Button type="button" onClick={addMajor}>추가</Button>
        </div>
      </section>

      <section className="overflow-hidden rounded border border-[#d5d7dc] bg-white">
        {cats.map((major, i) => (
          <div key={major.id} className="flex items-center gap-2 border-b border-[#eee] px-4 py-2 last:border-b-0">
            <Input
              className="h-9 max-w-xs"
              value={major.name}
              onChange={(e) => rename(major.id, e.target.value)}
            />
            <span className="text-xs text-[#666]">{major.id}</span>
            <button type="button" className="ml-auto text-xs" disabled={i === 0} onClick={() => move(major.id, -1)}>
              위로
            </button>
            <button type="button" className="text-xs" disabled={i === cats.length - 1} onClick={() => move(major.id, 1)}>
              아래로
            </button>
            <button type="button" className="text-xs text-red-600" onClick={() => remove(major.id)}>
              삭제
            </button>
          </div>
        ))}
      </section>

      <Button type="button" disabled={busy} onClick={() => onSave(cats)}>
        {busy ? "저장 중…" : "분류 저장"}
      </Button>
    </div>
  );
}

function slug(name: string) {
  const map: Record<string, string> = { 의류: "apparel", 신발: "shoes", 기타: "etc" };
  if (map[name]) return map[name];
  const base = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "");
  return base || `cat-${Date.now().toString(36)}`;
}
