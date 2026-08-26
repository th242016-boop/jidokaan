import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Localized, Product } from "@/lib/products";
import { OptionEditor } from "@/components/admin/option-editor";
import { EMPTY_OPTIONS } from "@/lib/product-options";
import {
  fillProductSeo,
  majorsOf,
  type ShopCategory,
} from "@/lib/shop-taxonomy";

export function emptyProduct(): Product {
  return {
    id: `item-${Date.now().toString(36)}`,
    sku: "",
    name: { ko: "", en: "", ja: "" },
    tagline: { ko: "", en: "", ja: "" },
    description: { ko: "", en: "", ja: "" },
    category: "ready",
    priceUsd: 23000,
    priceKrw: 288000,
    rating: 5,
    reviews: 0,
    colors: ["#111111"],
    materials: { ko: "", en: "", ja: "" },
    weight: "",
    shipsFrom: { ko: "서울 성수, KR", en: "Seongsu, Seoul, KR", ja: "ソウル聖水, KR" },
    inStock: true,
    visible: true,
    featured: false,
    plate: "#161618",
    accent: "#dc2626",
    shape: "drone",
    images: [],
    detailImages: [],
    detailVideos: [],
    smartstoreUrl: "",
    sizes: [
      "225", "230", "235", "240", "245", "250", "255", "260",
      "265", "270", "275", "280", "285", "290", "295", "300",
    ],
    leadDays: 25,
    customizable: false,
    createdAt: new Date().toISOString(),
    majorId: "shoes",
    sortOrder: 0,
    options: { ...EMPTY_OPTIONS },
  };
}

export function ProductForm({
  initial,
  categories,
  busy,
  token,
  onCancel,
  onSave,
  onDelete,
}: {
  initial: Product;
  categories: ShopCategory[];
  busy: boolean;
  token?: string;
  onCancel: () => void;
  onSave: (p: Product) => void;
  onDelete: (id: string) => void;
}) {
  const [p, setP] = useState<Product>({
    ...initial,
    visible: initial.visible !== false,
    images: initial.images ?? [],
    detailImages: initial.detailImages ?? [],
    detailVideos: initial.detailVideos ?? [],
    majorId: initial.majorId || "shoes",
    options: initial.options ?? { ...EMPTY_OPTIONS },
  });
  const [uploading, setUploading] = useState(false);
  const isNew = useMemo(
    () => initial.id.startsWith("item-") && !initial.name.ko,
    [initial],
  );

  function loc(
    field: keyof Pick<Product, "name" | "tagline" | "description" | "materials">,
    lang: keyof Localized,
    value: string,
  ) {
    setP((cur) => ({
      ...cur,
      [field]: { ...cur[field], [lang]: value },
    }));
  }

  return (
    <form
      className="space-y-4 pb-24"
      onSubmit={(e) => {
        e.preventDefault();
        if (!p.name.ko.trim()) return;
        const sku = p.sku.trim() || p.id;
        const next = fillProductSeo({
          ...p,
          sku,
          name: { ...p.name, en: p.name.en || p.name.ko, ja: p.name.ja || p.name.en || p.name.ko },
          tagline: {
            ...p.tagline,
            en: p.tagline.en || p.tagline.ko,
            ja: p.tagline.ja || p.tagline.en || p.tagline.ko,
          },
          description: {
            ...p.description,
            en: p.description.en || p.description.ko,
            ja: p.description.ja || p.description.en || p.description.ko,
          },
        });
        onSave(next);
      }}
    >
      <Section n={1} title="표시 설정">
        <Row label="진열상태" required>
          <Radio
            value={p.visible !== false ? "on" : "off"}
            onChange={(v) => setP({ ...p, visible: v === "on" })}
            options={[
              { value: "on", label: "진열함" },
              { value: "off", label: "진열안함" },
            ]}
          />
        </Row>
        <Row label="판매상태" required>
          <Radio
            value={p.inStock ? "on" : "off"}
            onChange={(v) => setP({ ...p, inStock: v === "on" })}
            options={[
              { value: "on", label: "판매함" },
              { value: "off", label: "판매안함 (품절)" },
            ]}
          />
        </Row>
        <Row label="상품분류" required>
          <select
            className="h-10 rounded border border-border bg-white px-3 text-sm"
            value={p.majorId || "shoes"}
            onChange={(e) => setP({ ...p, majorId: e.target.value, minorId: undefined })}
          >
            {majorsOf(categories).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Row>
        <Row label="진열 순서">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              className="h-10 w-28"
              type="number"
              min={0}
              value={p.sortOrder ?? 0}
              onChange={(e) => setP({ ...p, sortOrder: Number(e.target.value) || 0 })}
            />
            <p className="text-xs text-[#555]">
              0이면 최근 등록이 앞에 옵니다. 1, 2, 3… 숫자를 넣으면 그 순서대로 진열됩니다.
            </p>
          </div>
        </Row>
        <Row label="메인 진열">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(p.featured)}
              onChange={(e) => setP({ ...p, featured: e.target.checked })}
            />
            메인화면에 대표 상품으로 표시
          </label>
        </Row>
      </Section>

      <Section n={2} title="기본 정보">
        <Row label="상품명" required>
          <Input
            value={p.name.ko}
            onChange={(e) => loc("name", "ko", e.target.value)}
            required
            placeholder="예: DRONE 커스텀 복싱화"
          />
        </Row>
        <Row label="영문 상품명">
          <Input
            value={p.name.en}
            onChange={(e) => loc("name", "en", e.target.value)}
            placeholder="해외 고객에게 보이는 이름"
          />
        </Row>
        <Row label="상품코드">
          <Input
            value={p.sku}
            onChange={(e) => setP({ ...p, sku: e.target.value })}
            placeholder="스마트스토어 상품번호면 후기 버튼이 자동 연결됩니다"
          />
        </Row>
        <Row label="네이버 상품주소">
          <Input
            value={p.smartstoreUrl ?? ""}
            onChange={(e) => setP({ ...p, smartstoreUrl: e.target.value })}
            placeholder="https://smartstore.naver.com/lidea/products/번호  (비우면 상품코드로 자동)"
          />
        </Row>
        <Row label="상품 요약설명">
          <Input
            value={p.tagline.ko}
            onChange={(e) => loc("tagline", "ko", e.target.value)}
            placeholder="목록·상세 상단에 짧게 보이는 한 줄"
          />
        </Row>
      </Section>

      <Section n={3} title="판매 정보">
        <Row label="소비자가">
          <PriceField
            value={p.compareAtKrw ?? ""}
            suffix="원"
            onChange={(n) =>
              setP({ ...p, compareAtKrw: n ? n : undefined })
            }
          />
          <p className="mt-1 text-xs text-[#333]">
            할인 전 가격. 비우면 표시하지 않습니다.
          </p>
        </Row>
        <Row label="판매가" required>
          <div className="flex flex-wrap gap-3">
            <PriceField
              value={p.priceKrw}
              suffix="원"
              onChange={(n) => setP({ ...p, priceKrw: n })}
            />
            <PriceField
              value={Math.round(p.priceUsd / 100)}
              suffix="USD"
              onChange={(n) => setP({ ...p, priceUsd: n * 100 })}
            />
          </div>
          <p className="mt-1 text-xs text-[#333]">
            한국은 원화, 그 외 국가는 달러로 자동 표시됩니다.
          </p>
        </Row>
        <Row label="제작기간">
          <div className="flex items-center gap-2">
            <Input
              className="w-24"
              type="number"
              min={0}
              value={p.leadDays ?? 25}
              onChange={(e) => setP({ ...p, leadDays: Number(e.target.value) || 0 })}
            />
            <span className="text-sm text-[#333]">일</span>
          </div>
        </Row>
      </Section>

      <Section n={4} title="옵션">
        <OptionEditor
          value={p.options ?? EMPTY_OPTIONS}
          onChange={(options) => setP({ ...p, options })}
        />
      </Section>

      <Section n={5} title="이미지">
        <Row label="대표 이미지" required>
          <p className="mb-2 text-xs text-[#333]">
            상품 목록과 상세 맨 앞에 나갑니다. 클릭하거나 사진을 끌어다 놓으세요.
            줄이거나 JPEG로 바꾸지 않고, 올리신 파일 그대로 데이터베이스에 저장됩니다.
            사이트를 다시 올려도 사진이 지워지지 않습니다.
          </p>
          <ImageDrop
            label="대표 사진 올리기"
            preview={p.image}
            busy={uploading}
            onFiles={async (files) => {
              setUploading(true);
              try {
                const data = await uploadOriginal(files[0], token);
                setP((cur) => ({ ...cur, image: data }));
              } catch (err) {
                window.alert(uploadFailMessage(err));
              } finally {
                setUploading(false);
              }
            }}
            onClear={() => setP({ ...p, image: undefined })}
            large
          />
        </Row>
        <Row label="추가 이미지">
          <p className="mb-2 text-xs text-[#333]">
            상세페이지에서 옆으로 넘겨 보는 사진입니다. 여러 장 한꺼번에 올릴 수 있습니다.
          </p>
          <ImageDrop
            label="추가 사진 올리기 (여러 장)"
            multiple
            busy={uploading}
            onFiles={async (files) => {
              setUploading(true);
              try {
                const added = await uploadMany(files.slice(0, 12), token);
                setP((cur) => ({
                  ...cur,
                  images: [...(cur.images ?? []), ...added].slice(0, 12),
                }));
              } catch (err) {
                window.alert(uploadFailMessage(err));
              } finally {
                setUploading(false);
              }
            }}
          />
          <ThumbGrid
            items={p.images ?? []}
            onRemove={(i) =>
              setP({
                ...p,
                images: (p.images ?? []).filter((_, idx) => idx !== i),
              })
            }
          />
        </Row>
      </Section>

      <Section n={5} title="상세 설명">
        <p className="-mt-2 mb-3 text-xs leading-relaxed text-[#333]">
          스마트스토어처럼 사진·영상을 위에서 아래로 직접 올리시면 됩니다.
          사진은 원본 그대로 저장됩니다. 후기는 네이버 초록 버튼으로 보냅니다.
        </p>
        <Row label="상세 설명">
          <textarea
            className="min-h-36 w-full rounded border border-border bg-white px-3 py-2 text-sm leading-relaxed"
            value={p.description.ko}
            onChange={(e) => loc("description", "ko", e.target.value)}
            placeholder="소재, 제작 방식, 사이즈 안내 등 고객이 보는 본문"
          />
        </Row>
        <Row label="상세 이미지">
          <p className="mb-2 text-xs text-[#333]">
            글 아래에 세로로 붙는 설명 사진입니다. 카페24 상세페이지에 넣는 컷과 같습니다.
          </p>
          <ImageDrop
            label="상세 사진 올리기 (여러 장)"
            multiple
            busy={uploading}
            onFiles={async (files) => {
              setUploading(true);
              try {
                const added = await uploadMany(files.slice(0, 20), token);
                setP((cur) => ({
                  ...cur,
                  detailImages: [...(cur.detailImages ?? []), ...added].slice(0, 20),
                }));
              } catch (err) {
                window.alert(uploadFailMessage(err));
              } finally {
                setUploading(false);
              }
            }}
          />
          <ThumbGrid
            items={p.detailImages ?? []}
            onRemove={(i) =>
              setP({
                ...p,
                detailImages: (p.detailImages ?? []).filter((_, idx) => idx !== i),
              })
            }
          />
        </Row>
        <Row label="상세 영상 (MP4)">
          <p className="mb-2 text-xs text-[#333]">
            스마트스토어처럼 상세 맨 위에서 자동재생됩니다. 음소거+반복. 해외에서도 재생됩니다.
            네이버 링크는 넣지 말고, MP4 파일을 올리세요.
          </p>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="block w-full text-sm"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file || !token) return;
              setUploading(true);
              try {
                const fd = new FormData();
                fd.set("token", token);
                fd.set("file", file);
                const res = await fetch("/api/media", { method: "POST", body: fd });
                const data = (await res.json()) as { url?: string; error?: string };
                if (!res.ok || !data.url) throw new Error(data.error || "fail");
                setP((cur) => ({
                  ...cur,
                  detailVideos: [...(cur.detailVideos ?? []), { src: data.url! }],
                }));
              } catch (err) {
                window.alert(uploadFailMessage(err, true));
              } finally {
                setUploading(false);
              }
            }}
          />
          <ul className="mt-2 space-y-1 text-xs">
            {(p.detailVideos ?? []).map((v, i) => (
              <li key={v.src} className="flex items-center justify-between gap-2">
                <span className="truncate">{v.src}</span>
                <button
                  type="button"
                  className="text-red-600"
                  onClick={() =>
                    setP({
                      ...p,
                      detailVideos: (p.detailVideos ?? []).filter((_, idx) => idx !== i),
                    })
                  }
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        </Row>
      </Section>

      <Section n={6} title="커스텀 시뮬레이터">
        <Row label="커스텀">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(p.customizable)}
              onChange={(e) => setP({ ...p, customizable: e.target.checked })}
            />
            이 상품은 커스텀 시뮬레이터로 연결 (옵션과 함께 쓸 수 있음)
          </label>
        </Row>
      </Section>

      <Section n={7} title="검색엔진 최적화 (SEO)">
        <Row label="검색 제목">
          <Input
            value={p.seoTitle ?? ""}
            onChange={(e) => setP({ ...p, seoTitle: e.target.value })}
            placeholder="비우면 상품명 | 지도칸 으로 자동 등록"
          />
        </Row>
        <Row label="검색 설명">
          <textarea
            className="min-h-20 w-full rounded border border-border bg-white px-3 py-2 text-sm"
            value={p.seoDescription ?? ""}
            onChange={(e) => setP({ ...p, seoDescription: e.target.value })}
            placeholder="비우면 한줄 소개가 검색 설명으로 들어갑니다"
          />
        </Row>
        <Row label="검색 키워드">
          <Input
            value={p.seoKeywords ?? ""}
            onChange={(e) => setP({ ...p, seoKeywords: e.target.value })}
            placeholder="쉼표로 구분. 비우면 상품명·지도칸·복싱화 자동"
          />
        </Row>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-2 border-t border-border bg-white/95 px-4 py-3 backdrop-blur">
        <Button type="submit" disabled={busy || uploading}>
          {busy ? "저장 중…" : isNew ? "상품등록" : "상품수정"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          목록
        </Button>
        {!isNew ? (
          <Button
            type="button"
            variant="ghost"
            className="text-danger"
            onClick={() => onDelete(p.id)}
          >
            삭제
          </Button>
        ) : null}
        {uploading ? (
          <span className="text-xs text-[#333]">사진 올리는 중…</span>
        ) : null}
      </div>
    </form>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded border border-border bg-white">
      <div className="flex items-center gap-2 border-b border-border bg-[#f7f7f8] px-4 py-2.5">
        <span className="grid size-6 place-items-center rounded-sm bg-fg text-[11px] font-bold text-white">
          {n}
        </span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="divide-y divide-border/70">{children}</div>
    </section>
  );
}

function Row({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 px-4 py-3 sm:grid-cols-[9.5rem_1fr] sm:items-start">
      <div className="flex items-center gap-1.5 pt-2 text-sm">
        {required ? (
          <span className="rounded-sm bg-red-600 px-1 py-px text-[10px] font-bold text-white">
            필수
          </span>
        ) : null}
        <Label className="text-sm font-medium">{label}</Label>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Radio({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-4 pt-2 text-sm">
      {options.map((opt) => (
        <label key={opt.value} className="inline-flex items-center gap-2">
          <input
            type="radio"
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function PriceField({
  value,
  suffix,
  onChange,
}: {
  value: number | "";
  suffix: string;
  onChange: (n: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <Input
        className="w-36"
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
            <span className="text-sm text-[#333]">{suffix}</span>
    </div>
  );
}

function ImageDrop({
  label,
  preview,
  multiple,
  large,
  busy,
  onFiles,
  onClear,
}: {
  label: string;
  preview?: string;
  multiple?: boolean;
  large?: boolean;
  busy?: boolean;
  onFiles: (files: File[]) => void | Promise<void>;
  onClear?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function take(list: FileList | File[] | null) {
    if (!list) return;
    const files = Array.from(list).filter((f) =>
      f.type.startsWith("image/") ||
      /\.(jpe?g|jfif|png|webp|gif|avif|svg|bmp|heic|heif)$/i.test(f.name),
    );
    if (!files.length) {
      window.alert("JPG, PNG, WEBP 사진만 올릴 수 있습니다. 아이폰은 ‘모든 사진’에서 JPG로 보내 주세요.");
      return;
    }
    void onFiles(files);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif"
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          take(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files);
        }}
        className={`flex w-full flex-col items-center justify-center gap-2 rounded border-2 border-dashed px-4 text-center transition ${
          large ? "min-h-48" : "min-h-28"
        } ${
          over
            ? "border-fg bg-surface-muted"
            : "border-border bg-[#fafafa] hover:border-fg/50 hover:bg-white"
        }`}
      >
        {preview ? (
          <img
            src={preview}
            alt=""
            className="max-h-52 w-auto rounded object-contain"
          />
        ) : (
          <>
            <span className="text-sm font-semibold text-fg">{label}</span>
            <span className="text-xs text-[#333]">
              JPG · PNG · WEBP · HEIC · 여기로 끌어다 놓거나 클릭
            </span>
          </>
        )}
      </button>
      {preview && onClear ? (
        <button
          type="button"
          className="mt-2 text-xs text-[#333] underline"
          onClick={onClear}
        >
          대표 사진 지우기
        </button>
      ) : null}
    </div>
  );
}

function ThumbGrid({
  items,
  onRemove,
}: {
  items: string[];
  onRemove: (index: number) => void;
}) {
  if (!items.length) return null;
  return (
    <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
      {items.map((src, i) => (
        <li key={`${i}-${src.slice(0, 24)}`} className="relative">
          <img src={src} alt="" className="aspect-square w-full rounded border border-border object-cover" />
          <button
            type="button"
            className="absolute top-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white"
            onClick={() => onRemove(i)}
          >
            삭제
          </button>
        </li>
      ))}
    </ul>
  );
}

function uploadFailMessage(err: unknown, video = false) {
  const raw = err instanceof Error ? err.message : "";
  if (raw === "AUTH") return "로그인이 만료되었습니다. 관리자에 다시 들어간 뒤 올려 주세요.";
  if (raw === "too_large") return "파일이 너무 큽니다. 80MB 이하로 올려 주세요.";
  if (raw === "bad_type") {
    return video
      ? "MP4 파일로 올려 주세요."
      : "이 사진 형식은 올릴 수 없습니다. JPG 또는 PNG로 올려 주세요.";
  }
  if (raw === "no_file") return "파일이 선택되지 않았습니다.";
  if (raw === "store_failed") {
    return video
      ? "영상 저장에 실패했습니다. 잠시 후 다시 올려 주세요."
      : "사진 저장에 실패했습니다. 잠시 후 다시 올려 주세요.";
  }
  return video
    ? "영상 업로드에 실패했습니다. MP4로 다시 시도해 주세요."
    : "사진 저장에 실패했습니다. 잠시 후 다시 올려 주세요.";
}

function uploadOriginal(file: File, token?: string): Promise<string> {
  if (!token) return Promise.reject(new Error("AUTH"));
  const fd = new FormData();
  fd.set("token", token);
  fd.set("file", file, file.name);
  return fetch("/api/media", { method: "POST", body: fd }).then(async (res) => {
    let data: { url?: string; error?: string } = {};
    try {
      data = (await res.json()) as { url?: string; error?: string };
    } catch {
      throw new Error(res.status === 413 ? "too_large" : "fail");
    }
    if (!res.ok || !data.url) throw new Error(data.error || (res.status === 413 ? "too_large" : "fail"));
    return data.url;
  });
}

async function uploadMany(files: File[], token?: string) {
  const urls: string[] = [];
  for (const file of files) {
    urls.push(await uploadOriginal(file, token));
  }
  return urls;
}

