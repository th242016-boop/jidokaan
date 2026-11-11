import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Check, ChevronLeft, LoaderCircle, Sparkles, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { photoBaseFor, photoLayerFor, partsForModel, type BootModel, type PartColorNames } from "@/lib/simulator-config";
import { recommendStyle, RECOMMENDATION_COLORS, STYLE_PRESETS, RecommendationConstraintError, type StylePreferences, type StyleRecommendation } from "@/lib/style-recommendations";
import type { useSpecialSimulator } from "@/lib/use-special-simulator";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const copy = {
  ko: {
    teaser: "선택이 어렵다면?", title: "나와 어울리는 커스텀 찾기", intro: "취향을 고르면 지금 보고 있는 복싱화에 추천 조합을 입혀드려요.",
    steps: ["분위기", "좋아하는 색", "포인트", "MBTI"], style: "어떤 조합이 가장 끌리나요?", styleHint: "실제 시뮬레이터로 만든 5가지 예시 중 하나를 골라주세요.",
    like: "좋아하는 색을 골라주세요", likeHint: "1~2개 선택 · 추천에 가장 먼저 반영해요.", avoid: "피하고 싶은 색", avoidHint: "선택 사항 · 고르지 않아도 돼요.",
    intensity: "얼마나 눈에 띄고 싶나요?", levels: ["차분하게", "포인트만 살짝", "확실하게 눈에 띄게"], levelHints: ["색의 수를 줄인 정돈된 조합", "기본색에 포인트를 더한 균형", "좋아하는 색을 여러 부위에 시원하게"],
    mbti: "MBTI도 알려주실래요?", mbtiHint: "선택 사항이에요. 사진과 색상 취향을 우선하고, MBTI는 비슷한 조합 사이의 가벼운 참고로만 사용해요.", skip: "모르겠어요 / 건너뛰기", back: "이전", next: "다음", apply: "나와 어울리는 커스텀 해보기", loading: "색상 조합과 이미지를 준비하고 있어요…", close: "닫기", result: "취향에 맞춘 추천 조합", continue: "이 조합으로 계속하기", tweak: "색상 조금 바꾸기", another: "다른 조합 추천받기", restore: "추천 전 디자인으로 돌아가기", review: "선택 다시 하기", saved: "추천 전 디자인은 돌아가기 버튼으로 복원할 수 있어요.",
    error: "이미지를 준비하지 못했어요. 기존 디자인은 그대로입니다. 다시 시도해주세요.", baseError: "메쉬·끈·밑창에 필요한 화이트 또는 블랙 중 하나는 남겨주세요.", colorError: "사용할 수 있는 색을 하나 이상 남겨주세요.", stock: "현재 모델에서 선택 가능한 기본 색상으로 추천해요.",
    explanation: (base: string, accent: string, _mood: string) => `원하는 분위기에 맞춰 ${base} 중심으로 구성${accent ? `하고, ${accent} 포인트를 더했어요` : "했어요"}.`,
    likes: (colors: string) => `좋아하는 ${colors} 색상을 반영했어요.`,
  },
  en: {
    teaser: "Hard to choose?", title: "Find your custom style", intro: "Choose your favorites and try a matching color combination on your boots.",
    steps: ["Style", "Colors", "Impact", "MBTI"], style: "Which look feels like you?", styleHint: "Pick one of five examples made with this simulator.",
    like: "Choose your favorite colors", likeHint: "Pick 1–2. These come first in your recommendation.", avoid: "Colors to avoid", avoidHint: "Optional. Leave empty if you like.",
    intensity: "How much should it stand out?", levels: ["Understated", "A subtle accent", "Make a statement"], levelHints: ["A restrained palette", "A balanced base with a color accent", "Your favorite colors across more panels"],
    mbti: "Want to add your MBTI?", mbtiHint: "Optional. Your photo and color choices come first. MBTI only helps choose between similar layouts.", skip: "Not sure / skip", back: "Back", next: "Next", apply: "Try my custom combination", loading: "Preparing your colors and images…", close: "Close", result: "Your suggested combination", continue: "Continue with this design", tweak: "Adjust the colors", another: "Try another combination", restore: "Restore my earlier design", review: "Change my preferences", saved: "You can restore your earlier design at any time here.",
    error: "We couldn't prepare the images. Your design is unchanged. Please try again.", baseError: "Keep white or black available for the mesh, laces and sole.", colorError: "Please leave at least one color available.", stock: "Suggestions use standard colors available for this model.",
    explanation: (base: string, accent: string, mood: string) => `${mood}: a ${base} base${accent ? ` with ${accent} accents` : ""}.`, likes: (colors: string) => `Includes your favorites: ${colors}.`,
  },
  ja: {
    teaser: "色選びに迷ったら", title: "自分に似合うカスタムを探す", intro: "好みを選ぶと、今のブーツにおすすめの配色を反映します。",
    steps: ["雰囲気", "好きな色", "アクセント", "MBTI"], style: "どの配色に惹かれますか？", styleHint: "実際のシミュレーターで作った5つの例から選んでください。",
    like: "好きな色を選んでください", likeHint: "1〜2色選択。おすすめに優先して反映します。", avoid: "避けたい色", avoidHint: "任意。選ばなくても大丈夫です。",
    intensity: "どのくらい目立ちたいですか？", levels: ["落ち着いた感じ", "さりげないアクセント", "しっかり目立つ"], levelHints: ["色数を抑えた配色", "ベースとアクセントのバランス", "好きな色を多くのパーツに"],
    mbti: "MBTIも教えていただけますか？", mbtiHint: "任意です。写真と色の好みを優先し、MBTIは似た配色の中での参考にのみ使います。", skip: "わからない / スキップ", back: "戻る", next: "次へ", apply: "おすすめのカスタムを試す", loading: "配色と画像を準備しています…", close: "閉じる", result: "あなたへのおすすめ配色", continue: "この配色で続ける", tweak: "色を調整する", another: "別の配色を試す", restore: "おすすめ前のデザインに戻す", review: "好みを選び直す", saved: "以前のデザインに戻すこともできます。",
    error: "画像を準備できませんでした。以前のデザインはそのままです。もう一度お試しください。", baseError: "メッシュ・靴ひも・ソール用に白か黒を残してください。", colorError: "使用できる色を1色以上残してください。", stock: "このモデルで選択できる基本色を使います。",
    explanation: (base: string, accent: string, mood: string) => `${mood}雰囲気に合わせて${base}をベースに${accent ? `、${accent}のアクセントを加えました` : "しました"}。`, likes: (colors: string) => `好きな${colors}を反映しました。`,
  },
};
const colorLabels: Record<string, [string, string]> = {
  WHITE: ["화이트", "ホワイト"], BLACK: ["블랙", "ブラック"], RED: ["레드", "レッド"], ORANGE: ["오렌지", "オレンジ"], YELLOW: ["옐로", "イエロー"], GREEN: ["그린", "グリーン"], BLUE: ["블루", "ブルー"], NAVY: ["네이비", "ネイビー"], PURPLE: ["퍼플", "パープル"], GOLD: ["골드", "ゴールド"], SILVER: ["실버", "シルバー"], MINT: ["민트", "ミント"], AQUA: ["아쿠아", "アクア"], PINK: ["핑크", "ピンク"], "SKY BLUE": ["스카이블루", "スカイブルー"],
};
const mbtis = ["ISTJ", "ISFJ", "INFJ", "INTJ", "ISTP", "ISFP", "INFP", "INTP", "ESTP", "ESFP", "ENFP", "ENTP", "ESTJ", "ESFJ", "ENFJ", "ENTJ"];
const levels = ["quiet", "accent", "bold"] as const;
const button = "min-h-11 rounded-xl px-4 py-2.5 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-40";
type Special = ReturnType<typeof useSpecialSimulator>;
type Original = { names: PartColorNames } | { special: NonNullable<ReturnType<Special["snapshotDraft"]>> };

/** Only preload existing public photo layers. Private material rendering stays in its authenticated hook. */
async function prepareImages(names: PartColorNames, signal: AbortSignal) {
  const sources = [photoBaseFor(names), ...partsForModel(names).map(part => photoLayerFor(part.id, names[part.id], names)).filter((src): src is string => Boolean(src))];
  const deadline = Date.now() + 25000;
  for (const src of [...new Set(sources)]) {
    if (signal.aborted) throw new Error("ABORTED");
    await new Promise<void>((resolve, reject) => {
      const image = new Image();
      let settled = false;
      const finish = (error?: string) => {
        if (settled) return;
        settled = true; clearTimeout(timer); signal.removeEventListener("abort", abort);
        image.onload = image.onerror = null;
        if (error) { image.src = ""; reject(new Error(error)); } else resolve();
      };
      const abort = () => finish("ABORTED");
      const timer = window.setTimeout(() => finish("TIMEOUT"), Math.max(1, deadline - Date.now()));
      signal.addEventListener("abort", abort, { once: true });
      image.onload = () => finish(image.naturalWidth ? undefined : "IMAGE");
      image.onerror = () => finish("IMAGE"); image.src = src;
    });
  }
}

export function StyleFinder({ model, locale, special, disabled, onApplied }: { model: BootModel; locale: Locale; special: Special; disabled?: boolean; onApplied: () => void }) {
  const language = locale === "ko" || locale === "ja" ? locale : "en";
  const text = copy[language];
  const colorLabel = (name: string) => language === "en" ? name : colorLabels[name]?.[language === "ko" ? 0 : 1] ?? name;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [preferences, setPreferences] = useState<StylePreferences>({ styleId: "clean", likedColors: [], avoidedColors: [], intensity: "accent" });
  const [styleChosen, setStyleChosen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<StyleRecommendation | null>(null);
  const normalNames = useStore(state => state.draftPartNames);
  const [adjusting, setAdjusting] = useState(false);
  const original = useRef<Original | null>(null);
  const section = useRef<HTMLElement | null>(null);
  const dialogBody = useRef<HTMLDivElement | null>(null);
  const pending = useRef<AbortController | null>(null);
  const current = useRef({ special, onApplied });
  current.current = { special, onApplied };
  useEffect(() => () => { pending.current?.abort(); }, []);
  useEffect(() => { if (dialogBody.current) dialogBody.current.scrollTop = 0; }, [step, busy, open]);
  const unavailable = disabled || (special.enabled && (!special.assetsReady || !special.meshReady || special.busy));
  const visibleNames = special.enabled ? special.names : normalNames;
  const resultCurrent = Boolean(result && partsForModel(result.names).every(part => result.names[part.id] === visibleNames[part.id])
    && (!special.enabled || (special.mesh === result.meshColor && special.laces === result.laceColor && special.beads === "NONE"
      && !Object.keys(special.patterns).length && !Object.keys(special.flowers).length && !Object.keys(special.solids).length)));

  function close() { pending.current?.abort(); pending.current = null; setBusy(false); setOpen(false); setError(""); }
  function start() {
    setStep(0); setError(""); setOpen(true);
    if (!result) original.current = null;
  }
  function toggleColor(name: string, avoid: boolean) {
    setError("");
    setPreferences(previous => {
      const own = avoid ? previous.avoidedColors : previous.likedColors;
      const next = own.includes(name) ? own.filter(value => value !== name) : [...own, name];
      if (!avoid && next.length > 2) return previous;
      return avoid
        ? { ...previous, avoidedColors: next, likedColors: previous.likedColors.filter(value => value !== name) }
        : { ...previous, likedColors: next, avoidedColors: previous.avoidedColors.filter(value => value !== name) };
    });
  }
  async function apply(variant: number) {
    if (pending.current || unavailable) return;
    const controller = new AbortController(); pending.current = controller;
    setBusy(true); setError("");
    try {
      const recommendation = recommendStyle(preferences, { model, special: special.enabled }, variant);
      const specialAtStart = current.current.special;
      const snapshot: Original | null = specialAtStart.enabled
        ? (() => { const snapshot = specialAtStart.snapshotDraft(); return snapshot ? { special: snapshot } : null; })()
        : { names: { ...useStore.getState().draftPartNames } };
      if (!snapshot) throw new Error("NOT_READY");
      await prepareImages(recommendation.names, controller.signal);
      if (controller.signal.aborted) return;
      const applied = specialAtStart.enabled
        ? specialAtStart.applyRecommendation(recommendation.names, recommendation.meshColor, recommendation.laceColor)
        : useStore.getState().setDraftDesign(recommendation.names);
      if (!applied) throw new Error("CONTEXT_CHANGED");
      original.current ??= snapshot;
      setResult(recommendation); setAdjusting(false); setOpen(false); current.current.onApplied();
    } catch (error) {
      if (controller.signal.aborted) return;
      setError(error instanceof RecommendationConstraintError
        ? error.code === "NO_ALLOWED_BASE_COLOR" ? text.baseError : text.colorError
        : text.error);
    } finally {
      if (pending.current === controller) { pending.current = null; setBusy(false); }
    }
  }
  async function restore() {
    const snapshot = original.current;
    if (!snapshot || unavailable || pending.current) return;
    // Restoration is atomic. Pattern undo is decoded by the existing Special hook.
    const restored = "special" in snapshot
      ? current.current.special.restoreDraft(snapshot.special)
      : useStore.getState().setDraftDesign(snapshot.names);
    if (restored) { setResult(null); original.current = null; setError(""); current.current.onApplied(); }
    else setError(text.error);
  }
  function keep() { setResult(null); original.current = null; setError(""); }

  return (
    <section ref={section} aria-label={text.title} className="mb-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 md:p-4">
      {result ? <>
        <div className="flex items-center gap-2 text-sm font-bold"><Sparkles className="size-4" />{resultCurrent ? text.result : language === "ko" ? "추천 조합을 수정하고 있어요" : language === "ja" ? "おすすめの配色を調整中" : "Adjusting your suggested design"}</div>
        {!adjusting && resultCurrent && <div role="status" className="mt-2 text-xs leading-relaxed text-neutral-600">
          <p>{text.explanation(colorLabel(result.explanation.baseColor), result.explanation.accentColors.map(colorLabel).join(" · "), text.levels[levels.indexOf(result.intensity)])}</p>
          {result.explanation.appliedLikes.length > 0 && <p className="mt-1">{text.likes(result.explanation.appliedLikes.map(colorLabel).join(" · "))}</p>}
        </div>}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className={cn(button, "col-span-2 bg-black text-white hover:bg-neutral-800")} onClick={keep}>{text.continue}</button>
          <button className={cn(button, "border border-neutral-300 bg-white text-xs")} onClick={() => { setAdjusting(true); document.querySelector<HTMLElement>('[data-part="b"] button')?.focus(); }}>{text.tweak}</button>
          <button className={cn(button, "border border-neutral-300 bg-white text-xs")} disabled={unavailable} onClick={() => { setStep(3); setOpen(true); void apply(result.variant + 1); }}>{text.another}</button>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <button className="min-h-10 text-xs underline underline-offset-4 disabled:opacity-40" disabled={unavailable} onClick={() => void restore()}>{text.restore}</button>
          <button className="min-h-10 text-xs text-neutral-600 underline underline-offset-4" onClick={start}>{text.review}</button>
        </div>
      </> : <button type="button" className="flex min-h-12 w-full items-center gap-3 text-left disabled:opacity-40" disabled={unavailable} onClick={start}>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black text-white"><Sparkles className="size-5" /></span>
        <span className="flex-1"><span className="block text-[11px] text-neutral-500">{text.teaser}</span><span className="block text-sm font-bold">{text.title}</span></span><ArrowRight className="size-4" />
      </button>}
      {error && !open && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
      <Dialog.Root open={open} onOpenChange={value => { if (!value) close(); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-[81] flex max-h-[92dvh] w-[calc(100%_-_24px)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white text-neutral-950 shadow-2xl outline-none" onCloseAutoFocus={event => { event.preventDefault(); section.current?.querySelector('button')?.focus(); }}>
            <div className="shrink-0 border-b border-neutral-100 px-5 pt-5 pb-4 md:px-7 md:pt-6">
              <p className="mb-1 text-[10px] font-bold tracking-[.2em] text-neutral-400">JIDOKAAN · FIND YOUR STYLE</p>
              <Dialog.Title className="pr-8 text-xl font-bold md:text-2xl">{text.title}</Dialog.Title>
              <Dialog.Description className="mt-2 text-xs leading-relaxed text-neutral-500">{text.intro}</Dialog.Description>
              <Dialog.Close aria-label={text.close} className="absolute top-4 right-4 rounded-full p-3 hover:bg-neutral-100"><X className="size-5" /></Dialog.Close>
              <ol className="mt-4 flex gap-2" aria-label={text.title}>
                {text.steps.map((label, index) => <li key={label} aria-current={step === index ? "step" : undefined} className={cn("flex-1 border-t-2 pt-2 text-[11px]", index <= step ? "border-black font-bold text-black" : "border-neutral-200 text-neutral-400")}>{index + 1}. {label}</li>)}
              </ol>
            </div>
            <div ref={dialogBody} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 md:px-7" aria-busy={busy}>
              {busy ? <div role="status" className="flex min-h-52 flex-col items-center justify-center gap-5 text-center"><LoaderCircle className="size-8 animate-spin" /><p className="text-sm font-semibold">{text.loading}</p><p className="max-w-sm text-xs text-neutral-500">{text.saved}</p></div> : <>
                <h3 className="text-base font-bold">{[text.style, text.like, text.intensity, text.mbti][step]}</h3>
                <p className="mt-1.5 mb-5 text-xs leading-relaxed text-neutral-500">{[text.styleHint, text.likeHint, text.stock, text.mbtiHint][step]}</p>
                {step === 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {STYLE_PRESETS.map(preset => <button type="button" key={preset.id} aria-pressed={styleChosen && preferences.styleId === preset.id} onClick={() => { setStyleChosen(true); setPreferences(p => ({ ...p, styleId: preset.id })); }} className={cn("relative flex flex-col overflow-hidden rounded-2xl border-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2", styleChosen && preferences.styleId === preset.id ? "border-black" : "border-neutral-200 hover:border-neutral-400")}>
                    <img src={`/simulator/recommendations/${model}-${preset.id}.jpg`} width="480" height="470" alt={preset.title[language]} className="aspect-[48/47] w-full object-contain" />
                    <div className="p-3 break-keep"><strong className="block text-xs">{preset.title[language]}</strong><span className="mt-1 block text-[11px] leading-relaxed text-neutral-500">{preset.description[language]}</span></div>
                    {styleChosen && preferences.styleId === preset.id && <span className="absolute top-2 right-2 rounded-full bg-black p-1 text-white"><Check className="size-3" /></span>}
                  </button>)}
                </div>}
                {step === 1 && <>{[false, true].map(avoid => <fieldset key={String(avoid)} className={avoid ? "mt-6" : ""}>
                  <legend className="text-sm font-bold">{avoid ? text.avoid : `${text.like} (${preferences.likedColors.length}/2)`}</legend>
                  {avoid && <p className="mt-1 text-xs text-neutral-500">{text.avoidHint}</p>}
                  <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {RECOMMENDATION_COLORS.map(color => {
                      const selected = (avoid ? preferences.avoidedColors : preferences.likedColors).includes(color.name);
                      return <button key={color.name} type="button" aria-pressed={selected} aria-label={`${avoid ? text.avoid : text.like}: ${colorLabel(color.name)}`} disabled={!avoid && !selected && preferences.likedColors.length >= 2} onClick={() => toggleColor(color.name, avoid)} className={cn("flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-2 text-[10px] disabled:opacity-35", selected ? "border-black bg-neutral-100" : "border-neutral-100 hover:border-neutral-300")}>
                        <span className="flex size-6 items-center justify-center rounded-full border border-black/10" style={{ backgroundColor: color.color }}>{selected && <Check className="size-4" style={{ color: color.isBright ? "#111" : "#fff" }} />}</span>{colorLabel(color.name)}
                      </button>;
                    })}
                  </div>
                </fieldset>)}</>}
                {step === 2 && <div className="grid gap-3 sm:grid-cols-3">{levels.map((level, index) => <button key={level} type="button" aria-pressed={preferences.intensity === level} onClick={() => setPreferences(p => ({ ...p, intensity: level }))} className={cn("rounded-2xl border-2 p-5 text-left", preferences.intensity === level ? "border-black bg-neutral-50" : "border-neutral-200")}>
                  <span aria-hidden="true" className="mb-4 flex h-7 items-end gap-1">{[0, 1, 2].map(n => <span key={n} className={cn("w-3 rounded-sm", n <= index ? "bg-black" : "bg-neutral-200")} style={{ height: `${12 + n * 8}px` }} />)}</span>
                  <strong className="text-sm">{text.levels[index]}</strong><span className="mt-2 block text-xs leading-relaxed text-neutral-500">{text.levelHints[index]}</span>
                </button>)}</div>}
                {step === 3 && <fieldset><legend className="sr-only">MBTI</legend><button type="button" aria-pressed={!preferences.mbti} onClick={() => setPreferences(p => ({ ...p, mbti: undefined }))} className={cn(button, "mb-3 w-full border-2", !preferences.mbti ? "border-black bg-neutral-50" : "border-neutral-200")}>{text.skip}</button>
                  <div className="grid grid-cols-4 gap-2">{mbtis.map(mbti => <button type="button" key={mbti} aria-pressed={preferences.mbti === mbti} onClick={() => setPreferences(p => ({ ...p, mbti }))} className={cn(button, "border-2 px-2", preferences.mbti === mbti ? "border-black bg-black text-white" : "border-neutral-200")}>{mbti}</button>)}</div>
                </fieldset>}
              </>}
              {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-3 border-t border-neutral-100 bg-neutral-50 px-5 py-4 md:px-7">
              {step > 0 && <button className={cn(button, "inline-flex items-center gap-1 border border-neutral-300 bg-white")} disabled={busy} onClick={() => { setStep(value => value - 1); setError(""); }}><ChevronLeft className="size-4" />{text.back}</button>}
              <button className={cn(button, "ml-auto bg-black text-white hover:bg-neutral-800")} disabled={busy || (step === 0 && !styleChosen) || (step === 1 && !preferences.likedColors.length) || unavailable} onClick={() => step < 3 ? setStep(value => value + 1) : void apply(0)}>{step === 3 ? text.apply : text.next}</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
