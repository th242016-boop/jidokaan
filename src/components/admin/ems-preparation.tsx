import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownToLine, ArrowUpRight, Check, ChevronDown, Package, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StoreOrder } from "@/lib/order-types";
import type {
  EmsCapabilities,
  EmsFulfillment,
  EmsItem,
  EmsPackage,
  EmsRecipient,
} from "@/lib/ems-types";
import { EMS_STATE_LABEL } from "@/lib/ems-types";
import { emsIssues, emsAllocationIssues, itemPaidValues, hasEmsClaim } from "@/lib/ems-workflow";

const editableStates = new Set(["preparing", "registration_failed"]);
const statusColor: Record<string, string> = {
  preparing: "bg-slate-100 text-slate-700",
  registration_failed: "bg-red-50 text-red-800",
  registration_unknown: "bg-amber-100 text-amber-900",
  awaiting_dropoff: "bg-blue-50 text-blue-800",
  in_transit: "bg-indigo-50 text-indigo-800",
  delivered: "bg-emerald-50 text-emerald-800",
  customs_delay: "bg-amber-50 text-amber-900",
  delivery_failed: "bg-red-50 text-red-800",
  returned: "bg-red-50 text-red-800",
};
const fallbackCapabilities: EmsCapabilities = {
  registration: {
    enabled: false,
    mode: "manual",
    reason: "자동접수 API는 연결되지 않았습니다. 공식 스마트접수에서 직접 접수해 주세요.",
  },
  tracking: {
    enabled: false,
    reason: "공식 배송조회 API 인증·접근 확인이 필요합니다. 현재 자동 배송조회는 꺼져 있습니다.",
  },
  smartRegistrationUrl: "https://ems.epost.go.kr/front.SmEmsApply1100s.postal",
  officialFormatUrl: "https://ems.epost.go.kr/front.PopRegFileEms.postal?filetype=",
};
const errors: Record<string, string> = {
  TRACKING_REQUIRED: "송장번호를 입력한 뒤 발송 처리해 주세요.",
  EMS_CANCELLATION_REVIEW:
    "공식 접수 또는 발송 기록이 있습니다. 접수 취소·반송 여부를 먼저 확인해 주세요.",
  ORDER_CHANGED: "다른 화면에서 주문이 변경됐습니다. 최신 정보를 불러와 주세요.",
  AUTH: "관리자 인증이 만료됐습니다. 다시 로그인해 주세요.",
  EMS_ORDER_INACTIVE:
    "미결제·취소·처리 요청 중이거나 기존 송장이 있는 주문은 발송 준비할 수 없습니다. 기존 기록을 확인해 주세요.",
  EMS_NOT_PREPARED: "발송 준비를 먼저 시작해 주세요.",
  EMS_REGISTERED_LOCKED:
    "이미 접수했거나 접수 여부가 불확실한 소포는 수정할 수 없습니다. 공식 접수 내역부터 확인해 주세요.",
  EMS_REGISTRATION_LOCKED: "접수된 소포이거나 접수 여부 확인이 필요합니다. 중복 접수하지 마세요.",
  EMS_CONFIRM_REQUIRED: "실제 접수 또는 창구 제출 여부를 확인해 주세요.",
  EMS_REGISTRATION_PROOF: "접수 확인 메모를 입력해 주세요. 예: 우체국 접수내역 확인",
  EMS_TRACKING_INVALID: "우편물번호 13자리를 확인해 주세요. 예: 영문 2자 + 숫자 9자 + 영문 2자.",
  EMS_DUPLICATE_TRACKING:
    "이미 다른 주문이나 소포에 등록된 우편물번호입니다. 접수 내역을 확인해 주세요.",
  DUPLICATE_TRACKING: "이미 다른 주문이나 소포에 등록된 우편물번호입니다.",
  EMS_VERSION_CONFLICT: "다른 화면에서 변경됐습니다. 최신 정보를 불러온 뒤 다시 확인해 주세요.",
  VERSION_CONFLICT: "다른 화면에서 변경됐습니다. 최신 정보를 불러온 뒤 다시 확인해 주세요.",
  ORDER_CONFLICT: "주문이 다른 화면에서 변경됐습니다. 새로고침 후 확인해 주세요.",
  EMS_OPERATION_CONFLICT:
    "같은 요청이 다른 내용으로 저장됐습니다. 최신 정보를 불러와 확인해 주세요.",
  EMS_NOT_REGISTERED: "사전접수 완료 정보와 우편물번호를 먼저 저장해 주세요.",
  EMS_NOT_HANDED_OVER: "실제 창구 제출 후 발송 처리한 소포만 배송조회할 수 있습니다.",
  EMS_TRACKING_DISABLED: "공식 배송조회 API 연결이 준비되지 않았습니다.",
  EMS_EXPORT_CHARACTER: "입력값에 양식에서 허용되지 않는 구분자 또는 줄바꿈이 있습니다.",
  EMS_EXPORT_LIMIT: "공식 업로드는 최대 300건까지 가능합니다.",
  EMS_CURRENCY: "지원되지 않거나 확인되지 않은 결제 통화입니다.",
  EMS_VALUE_MISSING: "실제 상품 결제 금액을 확인할 수 없습니다. 결제 내역부터 확인해 주세요.",
  EMS_PACKAGE_ID: "소포 식별 정보가 올바르지 않습니다. 최신 정보를 불러와 주세요.",
  EMS_PACKAGES: "소포는 1~30개까지 등록할 수 있습니다.",
  EMS_ITEMS: "각 소포에 주문 상품을 최소 1개씩 배정해 주세요.",
  USE_EMS_WORKFLOW: "발송 준비 화면에서 EMS 접수·창구 제출 순서대로 처리해 주세요.",
  EMS_CLAIM_REVIEW_REQUIRED:
    "접수된 소포가 있습니다. 공식 접수 취소 또는 반송 여부를 먼저 확인해 주세요.",
};
export function emsError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (raw.startsWith("EMS_ALLOCATION_INCOMPLETE:"))
    return raw.slice("EMS_ALLOCATION_INCOMPLETE:".length);
  if (raw.startsWith("EMS_MANUAL_DELIVERY_BLOCKED:"))
    return raw.slice("EMS_MANUAL_DELIVERY_BLOCKED:".length);
  if (raw.startsWith("EMS_INCOMPLETE:")) return raw.slice("EMS_INCOMPLETE:".length);
  if (raw.startsWith("EMS_EXPORT_MULTI_ITEM:")) return raw.slice("EMS_EXPORT_MULTI_ITEM:".length);
  return errors[raw] || "처리하지 못했습니다. 최신 주문 정보를 확인한 후 다시 시도해 주세요.";
}
export function shipmentSummary(order: StoreOrder) {
  const packages = order.fulfillment?.packages ?? [];
  const states = new Map<string, number>();
  packages.forEach((p) =>
    states.set(EMS_STATE_LABEL[p.state], (states.get(EMS_STATE_LABEL[p.state]) || 0) + 1),
  );
  return Array.from(states)
    .map(([label, count]) => `${label} ${count}개`)
    .join(" · ");
}
function formatTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
function Field({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  type = "text",
  hint,
}: {
  label: string;
  value: string | number | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  type?: "text" | "number";
  hint?: string;
}) {
  return (
    <label className="block min-w-0 space-y-1.5">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <Input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="h-10 rounded-md border-slate-300 bg-white text-sm disabled:bg-slate-100 disabled:opacity-80"
        {...(type === "number" ? { min: 0, step: "any" } : {})}
      />
      {hint && <span className="block text-[11px] leading-relaxed text-slate-500">{hint}</span>}
    </label>
  );
}
function numeric(value: string) {
  return value === "" ? null : Number(value);
}

export function EmsPreparation({
  token,
  order,
  remaining = 1,
  onChange,
  onClose,
}: {
  token: string;
  order: StoreOrder;
  remaining?: number;
  onChange: (order: StoreOrder) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<EmsFulfillment>(() => structuredClone(order.fulfillment!));
  const [capabilities, setCapabilities] = useState<EmsCapabilities>(fallbackCapabilities);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [postedMode, setPostedMode] = useState(false);
  const [openParcel, setOpenParcel] = useState(order.fulfillment?.packages[0]?.id ?? "");
  const inFlight = useRef(false);
  const pendingOperation = useRef<{ body: string; id: string } | null>(null);
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const dirty =
    JSON.stringify(draft.recipient) !== JSON.stringify(order.fulfillment?.recipient) ||
    JSON.stringify(draft.packages) !== JSON.stringify(order.fulfillment?.packages);
  const inactive = !["paid", "ready", "shipped"].includes(order.status) || hasEmsClaim(order);
  const recipientLocked = inactive || draft.packages.some((p) => !editableStates.has(p.state));
  const issues = useMemo(() => emsIssues({ ...order, fulfillment: draft }), [order, draft]);
  const allocationIssues = emsAllocationIssues({ ...order, fulfillment: draft }).map(
    (i) => i.message,
  );
  const distinctIssues = Array.from(
    new Set(
      issues.map(
        (i) =>
          `${i.packageId ? `소포 ${draft.packages.findIndex((p) => p.id === i.packageId) + 1} · ` : ""}${i.message}`,
      ),
    ),
  );
  useEffect(() => {
    setDraft(structuredClone(order.fulfillment!));
  }, [order]);
  useEffect(() => {
    let alive = true;
    void fetch(`/api/ems?id=${encodeURIComponent(order.id)}`, { headers })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (alive && data.capabilities) setCapabilities(data.capabilities);
      })
      .catch((err) => {
        if (alive) setError(emsError(err));
      });
    return () => {
      alive = false;
    };
  }, [order.id, token]);
  function receive(data: { order?: StoreOrder; capabilities?: EmsCapabilities }) {
    if (data.order) {
      onChange(data.order);
      setDraft(structuredClone(data.order.fulfillment!));
    }
    if (data.capabilities) setCapabilities(data.capabilities);
  }
  async function refresh() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/ems?id=${encodeURIComponent(order.id)}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      receive(data);
      pendingOperation.current = null;
      setMsg("최신 정보를 불러왔습니다.");
    } catch (err) {
      setError(emsError(err));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function action(
    actionName: string,
    details: Record<string, unknown> = {},
    success = "저장했습니다.",
  ) {
    if (inFlight.current) return false;
    inFlight.current = true;
    setBusy(true);
    setError("");
    setMsg("");
    const payload = {
      action: actionName,
      id: order.id,
      version: order.fulfillment!.version,
      ...details,
    };
    const key = JSON.stringify(payload);
    if (!pendingOperation.current || pendingOperation.current.body !== key)
      pendingOperation.current = { body: key, id: crypto.randomUUID() };
    try {
      const res = await fetch("/api/ems", {
        method: "POST",
        headers,
        body: JSON.stringify({ ...payload, token, operationId: pendingOperation.current.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        pendingOperation.current = null;
        throw new Error(data.error);
      }
      receive(data);
      pendingOperation.current = null;
      setMsg(success);
      return true;
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "응답을 확인하지 못했습니다. 최신 정보 불러오기로 저장 여부부터 확인해 주세요. 공식 접수를 다시 진행하지 마세요."
          : emsError(err),
      );
      return false;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function exportFile() {
    if (inFlight.current || dirty) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ems", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "export", ids: [order.id], token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const url = URL.createObjectURL(new Blob([data.content], { type: data.mimeType }));
      const link = document.createElement("a");
      link.href = url;
      link.download = data.filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMsg(
        "공식 25열 TXT 양식을 내려받았습니다. 우체국 스마트접수에서 직접 업로드하고 확인해 주세요. 아직 접수되지 않았습니다.",
      );
    } catch (err) {
      setError(emsError(err));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  function recipient<K extends keyof EmsRecipient>(key: K, value: EmsRecipient[K]) {
    setDraft((d) => ({ ...d, recipient: { ...d.recipient, [key]: value } }));
  }
  function parcel(id: string, change: Partial<EmsPackage>) {
    setDraft((d) => ({
      ...d,
      packages: d.packages.map((p) => (p.id === id ? { ...p, ...change } : p)),
    }));
  }
  function item(id: string, index: number, change: Partial<EmsItem>) {
    setDraft((d) => ({
      ...d,
      packages: d.packages.map((p) =>
        p.id === id
          ? { ...p, items: p.items.map((it, i) => (i === index ? { ...it, ...change } : it)) }
          : p,
      ),
    }));
  }
  function addParcel() {
    const id = `parcel-${crypto.randomUUID()}`;
    setDraft((d) => ({
      ...d,
      packages: [
        ...d.packages,
        {
          id,
          state: "preparing",
          grossWeightGrams: null,
          lengthCm: 41,
          widthCm: 31,
          heightCm: 15,
          items: [],
        },
      ],
    }));
    setOpenParcel(id);
  }
  function addItem(p: EmsPackage, sourceItemIndex: number) {
    const source = order.items[sourceItemIndex];
    let paid = 0;
    try {
      paid = itemPaidValues(order)[sourceItemIndex] / source.qty;
    } catch {}
    const existing = draft.packages
      .flatMap((x) => x.items)
      .find((i) => i.sourceItemIndex === sourceItemIndex);
    parcel(p.id, {
      items: [
        ...p.items,
        {
          sourceItemIndex,
          descriptionEn: existing?.descriptionEn || "",
          hsCode: existing?.hsCode || "",
          originCountry: existing?.originCountry || "",
          quantity: 1,
          declaredValue: Math.round(paid * 100) / 100,
          currency: order.currency,
          netWeightGrams: null,
        },
      ],
    });
  }
  function close() {
    if (dirty && !window.confirm("저장하지 않은 EMS 정보가 있습니다. 닫을까요?")) return;
    onClose();
  }
  const awaiting = draft.packages.filter((p) => p.state === "awaiting_dropoff");
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-slate-950/55 backdrop-blur-[2px]" />
        <Dialog.Content className="admin-ui fixed inset-x-0 bottom-0 z-[111] flex max-h-[96dvh] flex-col rounded-t-2xl bg-[#f5f7fa] text-sm text-slate-900 shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[94dvh] sm:w-[min(1120px,96vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:rounded-t-2xl sm:px-7">
            <div>
              <p className="mb-1 text-[10px] font-semibold tracking-[.16em] text-slate-500">
                EMS · COUNTER DROP-OFF
              </p>
              <Dialog.Title className="text-lg font-bold">
                발송 준비{" "}
                <span className="ml-2 text-sm font-normal text-slate-500">{order.id}</span>
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-slate-500">
                정보 확인 → 공식 스마트접수 → 창구 제출 후 발송
                {remaining > 1 ? ` · 남은 주문 ${remaining}건` : ""}
              </Dialog.Description>
            </div>
            <button
              type="button"
              aria-label="EMS 화면 닫기"
              disabled={busy}
              onClick={close}
              className="rounded-lg p-2 hover:bg-slate-100"
            >
              <X className="size-5" />
            </button>
          </header>
          <div className="overflow-y-auto px-4 py-5 sm:px-7">
            <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-bold">어떤 작업을 하시나요?</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant={postedMode ? "secondary" : "default"}
                  aria-pressed={!postedMode}
                  disabled={busy}
                  onClick={() => setPostedMode(false)}
                >
                  새 EMS 접수 준비
                </Button>
                <Button
                  type="button"
                  variant={postedMode ? "default" : "secondary"}
                  aria-pressed={postedMode}
                  disabled={busy}
                  onClick={() => setPostedMode(true)}
                >
                  이미 우체국에 맡긴 물건
                </Button>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                {postedMode
                  ? "송장번호를 입력하고 실제 창구 인계를 확인하면 배송중으로 저장됩니다. 접수 준비용 주소·HS코드·무게를 다시 입력할 필요가 없습니다."
                  : "아직 보내지 않은 소포의 접수 자료를 준비합니다. 이미 우체국에 맡겼다면 위의 ‘이미 우체국에 맡긴 물건’을 선택하세요."}
              </p>
            </section>
            <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-relaxed text-blue-950">
              <strong className="block text-sm">
                {postedMode
                  ? "이미 발송한 소포의 기록을 남깁니다."
                  : "현재는 수동 스마트접수 방식입니다."}
              </strong>
              <p className="mt-1">
                {postedMode
                  ? "이 작업은 지도칸 주문에 발송 사실을 기록합니다. 우체국에 새 접수 요청을 보내지 않습니다. 송장의 수취인과 아래 주문 고객이 같은지 먼저 대조하세요."
                  : `${capabilities.registration.reason} 사전접수 기록만으로 배송중이 되지 않습니다. 포장한 소포를 직접 창구에 제출한 뒤 발송을 기록하세요.`}
              </p>
            </div>
            {inactive && (
              <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                현재 주문은 조회 전용입니다. 결제·취소·고객 요청 상태를 확인해 주세요.
              </p>
            )}
            {error && (
              <p
                role="alert"
                className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-900"
              >
                {error}
              </p>
            )}
            {msg && (
              <p
                role="status"
                className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-900"
              >
                {msg}
              </p>
            )}
            {postedMode && (
              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-bold">송장과 대조할 주문</h3>
                <p className="mt-2">
                  {order.id} · {order.name} · {order.country}
                </p>
                <p className="mt-1 break-words text-xs text-slate-600">
                  {order.address} · {order.city} · {order.postal}
                </p>
              </section>
            )}
            {!postedMode && (
              <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-bold">
                    01 <span className="ml-2">수취인 · 영문 배송지</span>
                  </h3>
                  <span className="text-xs text-slate-500">주문 정보에서 불러옴</span>
                </div>
                <fieldset
                  disabled={busy || recipientLocked}
                  className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                >
                  <Field
                    label="수취인 영문 이름"
                    value={draft.recipient.name}
                    onChange={(v) => recipient("name", v)}
                  />
                  <Field
                    label="국가 코드 (ISO 2자리)"
                    value={draft.recipient.country}
                    onChange={(v) => recipient("country", v.toUpperCase())}
                    placeholder="예: US, SG, CN"
                  />
                  <Field
                    label="우편번호"
                    value={draft.recipient.postal}
                    onChange={(v) => recipient("postal", v)}
                  />
                  <div className="sm:col-span-2 lg:col-span-3">
                    <Field
                      label="영문 상세주소"
                      value={draft.recipient.address}
                      onChange={(v) => recipient("address", v)}
                    />
                  </div>
                  <Field
                    label="도시 (City)"
                    value={draft.recipient.city}
                    onChange={(v) => recipient("city", v)}
                  />
                  <Field
                    label="주 / 도 (State·Province)"
                    value={draft.recipient.region}
                    onChange={(v) => recipient("region", v)}
                  />
                  <Field
                    label="이메일"
                    value={draft.recipient.email}
                    onChange={(v) => recipient("email", v)}
                  />
                  <Field
                    label="주문에 저장된 연락처"
                    value={draft.recipient.phone}
                    onChange={(v) => recipient("phone", v)}
                  />
                  <Field
                    label="전화 국가번호"
                    value={draft.recipient.countryCallingCode}
                    onChange={(v) => recipient("countryCallingCode", v)}
                    placeholder="+ 없이 숫자만"
                  />
                  <Field
                    label="전화 지역번호 (해당 시)"
                    value={draft.recipient.areaCode}
                    onChange={(v) => recipient("areaCode", v)}
                  />
                  <Field
                    label="전화번호 앞자리"
                    value={draft.recipient.phone1}
                    onChange={(v) => recipient("phone1", v)}
                    hint="우체국 양식 구분에 맞춰 실제 번호를 입력하세요."
                  />
                  <Field
                    label="전화번호 뒷자리 (필요 시)"
                    value={draft.recipient.phone2}
                    onChange={(v) => recipient("phone2", v)}
                  />
                  <Field
                    label="브라질 세금번호 (해당 시)"
                    value={draft.recipient.taxId}
                    onChange={(v) => recipient("taxId", v)}
                  />
                  <Field
                    label="IOSS / EORI / TAX / NPWP (해당 시)"
                    value={draft.recipient.vatId}
                    onChange={(v) => recipient("vatId", v)}
                  />
                  <label className="mt-1 flex items-start gap-2 rounded-lg bg-slate-50 p-3 sm:col-span-2 lg:col-span-3">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 shrink-0"
                      checked={draft.recipient.englishConfirmed}
                      onChange={(e) => recipient("englishConfirmed", e.target.checked)}
                    />
                    <span className="text-xs leading-relaxed">
                      수취인 이름과 주소의 영문 표기를 확인했습니다. 결제 배송지와도 대조했습니다.
                    </span>
                  </label>
                </fieldset>
              </section>
            )}
            <section className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-bold">
                  02{" "}
                  <span className="ml-2">
                    {postedMode ? "소포 · 발송 기록" : "소포 · 세관 신고 정보"}
                  </span>{" "}
                  <span className="ml-1 font-normal text-slate-500">{draft.packages.length}개</span>
                </h3>
                {!postedMode && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={busy || inactive || draft.packages.length >= 30}
                    onClick={addParcel}
                  >
                    <Plus className="size-3.5" />
                    소포 추가
                  </Button>
                )}
              </div>
              <p className="mb-3 text-xs leading-relaxed text-slate-500">
                {postedMode
                  ? "여러 상자로 보냈다면 소포별로 각각 기록합니다. 소포 구성을 바꿔야 한다면 ‘새 EMS 접수 준비’에서 수정·저장하세요."
                  : "판매상품으로 신고합니다. 각 소포의 수량과 실제 상품 결제 금액을 배분하세요. 무게·원산지·HS 코드는 확인한 값만 입력합니다."}
              </p>
              <div className="space-y-3">
                {draft.packages.map((p, pi) => {
                  const locked = inactive || !editableStates.has(p.state);
                  return (
                    <section
                      key={p.id}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenParcel(openParcel === p.id ? "" : p.id)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                      >
                        <span className="flex flex-wrap items-center gap-3">
                          <Package className="size-4 text-slate-400" />
                          <strong>소포 {pi + 1}</strong>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs ${statusColor[p.state]}`}
                          >
                            {EMS_STATE_LABEL[p.state]}
                          </span>
                          {p.tracking && (
                            <span className="font-mono text-xs text-slate-500">{p.tracking}</span>
                          )}
                        </span>
                        <ChevronDown
                          className={`size-4 shrink-0 transition-transform ${openParcel === p.id ? "rotate-180" : ""}`}
                        />
                      </button>
                      {openParcel === p.id && (
                        <div className="border-t border-slate-100 px-4 pb-5 pt-4">
                          {postedMode && (
                            <ul className="mb-3 space-y-1 text-xs text-slate-600">
                              {p.items.map((it, i) => (
                                <li key={i}>
                                  {order.items[it.sourceItemIndex]?.name || "상품 확인 필요"} ·{" "}
                                  {it.quantity}개
                                </li>
                              ))}
                            </ul>
                          )}
                          {!postedMode && (
                            <fieldset disabled={busy || locked}>
                              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <Field
                                  label="포장 후 총중량 (g)"
                                  type="number"
                                  value={p.grossWeightGrams}
                                  onChange={(v) => parcel(p.id, { grossWeightGrams: numeric(v) })}
                                  placeholder="실측값 입력"
                                />
                                <Field
                                  label="가로 (cm)"
                                  type="number"
                                  value={p.lengthCm}
                                  onChange={(v) => parcel(p.id, { lengthCm: numeric(v) })}
                                />
                                <Field
                                  label="세로 (cm)"
                                  type="number"
                                  value={p.widthCm}
                                  onChange={(v) => parcel(p.id, { widthCm: numeric(v) })}
                                />
                                <Field
                                  label="높이 (cm)"
                                  type="number"
                                  value={p.heightCm}
                                  onChange={(v) => parcel(p.id, { heightCm: numeric(v) })}
                                />
                              </div>
                              <p className="mt-2 text-[11px] text-slate-500">
                                기존 상자 기준 41 × 31 × 15 cm입니다. 실제 포장 크기와 무게를 다시
                                확인하세요.
                              </p>
                              {p.items.map((it, ii) => (
                                <div
                                  key={`${it.sourceItemIndex}-${ii}`}
                                  className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-3"
                                >
                                  <div className="mb-3 flex items-center justify-between gap-2">
                                    <strong className="text-xs">
                                      {order.items[it.sourceItemIndex]?.name || "상품 확인 필요"}
                                      {order.items[it.sourceItemIndex]?.size
                                        ? ` · ${order.items[it.sourceItemIndex].size} mm`
                                        : ""}
                                    </strong>
                                    {!locked && (
                                      <button
                                        type="button"
                                        className="text-xs text-slate-500 underline"
                                        onClick={() =>
                                          parcel(p.id, {
                                            items: p.items.filter((_, idx) => idx !== ii),
                                          })
                                        }
                                      >
                                        이 소포에서 제외
                                      </button>
                                    )}
                                  </div>
                                  <div className="grid gap-3 sm:grid-cols-3">
                                    <Field
                                      label="영문 품명"
                                      value={it.descriptionEn}
                                      onChange={(v) => item(p.id, ii, { descriptionEn: v })}
                                      placeholder="정확한 실제 품명"
                                    />
                                    <Field
                                      label={
                                        draft.recipient.country === "US"
                                          ? "HTS 코드 (미국 10자리)"
                                          : "상품분류 HS 코드"
                                      }
                                      value={it.hsCode}
                                      onChange={(v) => item(p.id, ii, { hsCode: v })}
                                    />
                                    <Field
                                      label="원산지 국가 코드"
                                      value={it.originCountry}
                                      onChange={(v) =>
                                        item(p.id, ii, { originCountry: v.toUpperCase() })
                                      }
                                      placeholder="확인 후 입력"
                                    />
                                    <Field
                                      label="수량"
                                      type="number"
                                      value={it.quantity}
                                      onChange={(v) => item(p.id, ii, { quantity: Number(v) })}
                                    />
                                    <Field
                                      label={`이 품목 합계 금액 (${it.currency})`}
                                      type="number"
                                      value={it.declaredValue}
                                      onChange={(v) => item(p.id, ii, { declaredValue: Number(v) })}
                                      hint="단가가 아닌, 이 소포 안의 해당 품목 합계"
                                    />
                                    <Field
                                      label="이 품목 전체 순중량 (g)"
                                      type="number"
                                      value={it.netWeightGrams}
                                      onChange={(v) =>
                                        item(p.id, ii, { netWeightGrams: numeric(v) })
                                      }
                                    />
                                  </div>
                                </div>
                              ))}
                              {!locked && (
                                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                  <select
                                    aria-label={`소포 ${pi + 1}에 상품 추가`}
                                    className="h-9 max-w-full rounded-lg border border-slate-200 bg-white px-3 text-xs"
                                    value=""
                                    onChange={(e) => {
                                      if (e.target.value !== "") addItem(p, Number(e.target.value));
                                    }}
                                  >
                                    <option value="">+ 주문 상품 배정</option>
                                    {order.items.map((it, idx) => (
                                      <option
                                        key={idx}
                                        value={idx}
                                        disabled={p.items.some((x) => x.sourceItemIndex === idx)}
                                      >
                                        {it.name} · 주문 {it.qty}개
                                      </option>
                                    ))}
                                  </select>
                                  {draft.packages.length > 1 && (
                                    <button
                                      type="button"
                                      className="text-xs text-slate-500 underline"
                                      onClick={() => {
                                        if (
                                          window.confirm(
                                            "이 소포를 준비 목록에서 제외할까요? 상품을 다른 소포에 다시 배정해야 합니다.",
                                          )
                                        )
                                          setDraft((d) => ({
                                            ...d,
                                            packages: d.packages.filter((x) => x.id !== p.id),
                                          }));
                                      }}
                                    >
                                      빈 소포·미접수 소포 제외
                                    </button>
                                  )}
                                </div>
                              )}
                            </fieldset>
                          )}
                          <ParcelActions
                            parcel={p}
                            index={pi}
                            busy={busy || inactive}
                            dirty={dirty}
                            issues={distinctIssues}
                            allocationIssues={allocationIssues}
                            postedMode={postedMode}
                            capabilities={capabilities}
                            action={action}
                          />
                          {p.trackingCheck && (
                            <div className="mt-4 rounded-lg border border-slate-200 p-3">
                              <h4 className="text-xs font-semibold">우체국 배송조회 기록</h4>
                              <p className="mt-1 text-xs text-slate-500">
                                최근 조회 {formatTime(p.trackingCheck.checkedAt)} ·{" "}
                                {p.trackingCheck.outcome === "ok"
                                  ? "조회 완료"
                                  : p.trackingCheck.outcome === "unknown"
                                    ? "상태 확인 불가"
                                    : "조회 실패"}
                              </p>
                              {p.trackingCheck.message && (
                                <p className="mt-2 text-xs text-amber-800">
                                  {p.trackingCheck.message}
                                </p>
                              )}
                              {p.trackingCheck.evidence?.events.map((event, i) => (
                                <div
                                  key={i}
                                  className="mt-2 border-t border-slate-100 pt-2 text-xs"
                                >
                                  <span className="text-slate-500">
                                    {event.occurredAt} · {event.location}
                                  </span>
                                  <p className="mt-1 font-medium">{event.status}</p>
                                  {event.detail && <p>{event.detail}</p>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </section>
            {!postedMode && (
              <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold">
                    03 <span className="ml-2">확인 · 공식 스마트접수</span>
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${distinctIssues.length ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}
                  >
                    {distinctIssues.length
                      ? `확인 필요 ${distinctIssues.length}개`
                      : "필수 정보 입력 완료"}
                  </span>
                </div>
                {distinctIssues.length > 0 ? (
                  <details className="mt-3 rounded-lg bg-amber-50 p-3" open>
                    <summary className="cursor-pointer text-xs font-semibold text-amber-900">
                      접수 전에 확인할 항목
                    </summary>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-amber-900">
                      {distinctIssues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <p className="mt-3 flex items-center gap-2 text-xs text-emerald-800">
                    <Check className="size-4" />
                    입력 조건을 충족했습니다. 실제 주소·품명·분류의 정확성은 직접 확인해 주세요.
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={
                      busy ||
                      dirty ||
                      inactive ||
                      issues.length > 0 ||
                      draft.packages.some((p) => !editableStates.has(p.state))
                    }
                    onClick={() => void exportFile()}
                  >
                    <ArrowDownToLine className="size-3.5" />
                    공식 TXT 양식 내보내기
                  </Button>
                  <a
                    className="inline-flex h-9 items-center gap-2 rounded-full bg-slate-900 px-4 text-xs text-white"
                    href={capabilities.smartRegistrationUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    우체국 스마트접수 열기
                    <ArrowUpRight className="size-3.5" />
                  </a>
                  <a
                    className="inline-flex h-9 items-center px-2 text-xs text-slate-500 underline"
                    href={capabilities.officialFormatUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    공식 양식 안내
                  </a>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  내보내기 파일은 접수용 자료이며 접수 결과가 아닙니다. 한 소포에 여러 품목이 있으면
                  공식 엑셀 양식에 직접 입력해야 합니다. 스마트접수의 최종 내용·배송 가능
                  국가·요금·추가 서류를 확인한 뒤 접수하세요.
                </p>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs leading-relaxed text-slate-600">
                    {capabilities.tracking.reason} 자동 배송완료는 모든 소포의 공식 배달완료 기록을
                    확인한 경우에만 반영합니다. 지금은 주문 목록이나 상세의 ‘배송완료 처리’로
                    관리자가 직접 완료할 수 있으며, 수동 처리 이력이 별도로 남습니다.
                  </p>
                </div>
              </section>
            )}
            {postedMode && (
              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                {capabilities.tracking.reason} 발송 기록 저장과 자동 배송조회는 별개입니다.
              </p>
            )}
            <details className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer text-xs font-semibold text-slate-600">
                처리 이력 ({draft.audit.length})
              </summary>
              <div className="mt-3 space-y-2">
                {[...draft.audit].reverse().map((audit, i) => (
                  <p
                    key={i}
                    className="border-t border-slate-100 pt-2 text-xs leading-relaxed text-slate-600"
                  >
                    <time className="mr-2 text-slate-400">{formatTime(audit.at)}</time>
                    {audit.message}
                  </p>
                ))}
              </div>
            </details>
          </div>
          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:rounded-b-2xl sm:px-7">
            <div>
              <p className="text-xs text-slate-600">
                {dirty ? "변경한 정보가 아직 저장되지 않았습니다." : shipmentSummary(order)}
              </p>
              <button
                type="button"
                disabled={busy}
                className="mt-1 text-xs text-slate-500 underline"
                onClick={() => {
                  if (
                    !dirty ||
                    window.confirm("저장하지 않은 변경을 버리고 최신 정보를 불러올까요?")
                  )
                    void refresh();
                }}
              >
                최신 정보 불러오기
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={close}>
                {remaining > 1 ? "다음 주문 확인" : "닫기"}
              </Button>
              {(!postedMode || dirty) && (
                <Button
                  type="button"
                  size="sm"
                  disabled={busy || !dirty || inactive}
                  onClick={() =>
                    void action(
                      "save",
                      { recipient: draft.recipient, packages: draft.packages },
                      "EMS 준비 정보를 저장했습니다. 아직 우체국 접수는 하지 않았습니다.",
                    )
                  }
                >
                  {busy ? "처리 중…" : dirty ? "준비 정보 저장" : "저장할 변경 없음"}
                </Button>
              )}
              {awaiting.length > 1 && (
                <Button
                  type="button"
                  size="sm"
                  disabled={busy || dirty || inactive}
                  onClick={() => {
                    if (
                      window.confirm(
                        `우체국 창구에 소포 ${awaiting.length}개를 모두 맡겼나요? 실제 제출한 경우에만 배송중으로 바꿉니다.`,
                      )
                    )
                      void action(
                        "handover",
                        { packageIds: awaiting.map((p) => p.id), confirmed: true },
                        "실제 창구 제출을 기록했습니다. 배송중으로 변경했습니다.",
                      );
                  }}
                >
                  제출 대기 {awaiting.length}개 모두 발송
                </Button>
              )}
            </div>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ParcelActions({
  parcel: p,
  index,
  busy,
  dirty,
  issues,
  allocationIssues,
  postedMode,
  capabilities,
  action,
}: {
  parcel: EmsPackage;
  index: number;
  busy: boolean;
  dirty: boolean;
  issues: string[];
  allocationIssues: string[];
  postedMode: boolean;
  capabilities: EmsCapabilities;
  action: (name: string, details: Record<string, unknown>, success?: string) => Promise<boolean>;
}) {
  const [tracking, setTracking] = useState(p.tracking || "");
  const [reference, setReference] = useState(p.registrationReference || "");
  const [confirmed, setConfirmed] = useState(false);
  const [note, setNote] = useState("");
  const [outcome, setOutcome] = useState<"registered" | "not_registered">("registered");
  const locked = busy || dirty;
  const registerable = editableStates.has(p.state);
  const uncertain = p.state === "registration_unknown";
  const recordingPosted = postedMode && registerable;
  const needsTracking = !uncertain || outcome === "registered";
  const blocked = [
    ...(busy ? ["현재 처리 중이거나 이 주문은 조회 전용입니다."] : []),
    ...(dirty ? ["변경한 준비 정보를 아래 ‘준비 정보 저장’ 버튼으로 먼저 저장해 주세요."] : []),
    ...(needsTracking && !/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(tracking)
      ? ["영수증의 우편물번호 13자리를 입력하세요. 영문 2자 + 숫자 9자 + 영문 2자입니다."]
      : []),
    ...(!recordingPosted && reference.trim().length < 3
      ? ["접수 확인 메모를 입력하세요. 예: 우체국 접수내역 확인"]
      : []),
    ...(!confirmed
      ? [
          recordingPosted
            ? "‘실제로 우체국 창구에 맡겼습니다’ 확인란을 체크하세요."
            : "접수 사실 확인란을 체크하세요.",
        ]
      : []),
    ...(recordingPosted ? allocationIssues : needsTracking ? issues : []),
  ];
  useEffect(() => {
    setConfirmed(false);
  }, [postedMode]);
  return (
    <div className="mt-5 border-t border-slate-200 pt-4">
      {(registerable || uncertain) && (
        <>
          <h4 className="text-xs font-bold">
            {recordingPosted
              ? "이미 발송한 소포 기록"
              : uncertain
                ? "공식 접수내역 확인 후 처리"
                : "공식 스마트접수 완료 후 결과 기록"}
          </h4>
          <p
            className={`mt-2 text-xs leading-relaxed ${uncertain ? "text-amber-900" : "text-slate-500"}`}
          >
            {recordingPosted
              ? "우편물번호를 입력하고 실제 창구 인계를 체크한 뒤 ‘발송 기록 저장’을 누르세요. 메모는 선택입니다."
              : uncertain
                ? "응답이 늦거나 결과가 불확실할 때는 재접수하지 마세요. 우체국 접수내역에서 먼저 확인하고 아래에 근거를 기록하세요."
                : "우체국에서 발급한 실제 우편물번호와 접수 확인 정보를 입력하세요. 저장하면 ‘우체국 제출 대기’가 됩니다."}
          </p>
          {uncertain && (
            <select
              aria-label={`소포 ${index + 1} 접수 확인 결과`}
              value={outcome}
              onChange={(e) => {
                setOutcome(e.target.value as "registered" | "not_registered");
                setConfirmed(false);
              }}
              className="mt-3 h-10 rounded-lg border border-slate-300 bg-white px-3"
              disabled={locked}
            >
              <option value="registered">접수내역에 등록된 것을 확인함</option>
              <option value="not_registered">접수되지 않은 것을 확인함</option>
            </select>
          )}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(!uncertain || outcome === "registered") && (
              <Field
                label="우편물번호 (13자리)"
                value={tracking}
                onChange={(v) => setTracking(v.toUpperCase().replace(/\s/g, ""))}
                disabled={locked}
                placeholder="영문 2자 + 숫자 9자 + 영문 2자"
                hint="영수증·송장 바코드에 적힌 번호입니다. 이 주문의 수취인과 대조해 주세요."
              />
            )}
            <Field
              label={
                uncertain && outcome === "not_registered"
                  ? "미접수 확인 근거 · 확인 일시"
                  : recordingPosted
                    ? "발송 메모 (선택)"
                    : "접수 확인 메모 (필수)"
              }
              value={reference}
              onChange={setReference}
              disabled={locked}
              placeholder={recordingPosted ? "비워 두어도 됩니다" : "예: 우체국 접수내역 확인"}
              hint="별도의 접수번호를 찾을 필요는 없습니다."
            />
          </div>
          <label className="mt-3 flex items-start gap-2 text-xs leading-relaxed">
            <input
              type="checkbox"
              className="mt-0.5 size-4 shrink-0"
              checked={confirmed}
              disabled={locked}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span>
              {recordingPosted
                ? "실제로 우체국 창구에 맡겼습니다. 송장의 수취인과 이 주문 고객이 같고, 위 번호가 이 소포의 우편물번호임을 확인했습니다."
                : uncertain && outcome === "not_registered"
                  ? "우체국 접수내역에서 미접수임을 확인했습니다."
                  : "공식 접수가 완료됐으며, 위 번호가 이 소포의 우편물번호임을 확인했습니다."}
            </span>
          </label>
          <Button
            type="button"
            size="sm"
            className="mt-3"
            disabled={blocked.length > 0}
            aria-describedby={`parcel-${p.id}-requirements`}
            onClick={async () => {
              const ok = await action(
                recordingPosted ? "record_posted" : uncertain ? "reconcile" : "register",
                {
                  packageId: p.id,
                  tracking,
                  reference,
                  confirmed: true,
                  ...(uncertain ? { outcome } : {}),
                },
                recordingPosted
                  ? "발송 사실과 송장번호를 저장했습니다. 해당 소포는 배송중입니다."
                  : uncertain && outcome === "not_registered"
                    ? "미접수 확인을 기록했습니다. 다시 준비할 수 있습니다."
                    : "접수 결과를 저장했습니다. 우체국 제출 대기 상태입니다.",
              );
              if (ok) setConfirmed(false);
            }}
          >
            {recordingPosted
              ? "발송 기록 저장 · 배송중"
              : uncertain && outcome === "not_registered"
                ? "미접수 확인 · 준비로 돌아가기"
                : "접수 완료 기록 · 제출 대기"}
          </Button>
          <div
            id={`parcel-${p.id}-requirements`}
            aria-live="polite"
            className="mt-3 text-xs leading-relaxed"
          >
            {blocked.length > 0 ? (
              <div className="rounded-lg bg-amber-50 p-3 text-amber-900">
                <strong>버튼을 누르려면</strong>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  {blocked.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
                {!recordingPosted && registerable && (
                  <p className="mt-2 font-medium">
                    이미 보냈다면 화면 맨 위의 ‘이미 우체국에 맡긴 물건’을 선택하세요.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-emerald-800">입력이 완료됐습니다. 위 버튼으로 저장하세요.</p>
            )}
          </div>
          {registerable && !recordingPosted && (
            <details className="mt-4 rounded-lg bg-slate-50 p-3">
              <summary className="cursor-pointer text-xs text-slate-600">
                접수 실패 또는 응답 지연·결과 불명 처리
              </summary>
              <p className="mt-2 text-xs text-slate-500">
                우체국 화면에 명확한 실패가 나왔을 때만 실패로 기록하세요. 성공 여부를 모르면 ‘접수
                여부 확인 필요’로 기록하세요.
              </p>
              <textarea
                aria-label={`소포 ${index + 1} 접수 오류 내용`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={locked}
                className="mt-3 min-h-20 w-full rounded-md border border-slate-300 bg-white p-2 text-xs"
                placeholder="실패 내용 또는 확인되지 않은 상황"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={locked || note.trim().length < 3}
                  onClick={() =>
                    void action(
                      "uncertain",
                      { packageId: p.id, note },
                      "접수 여부 확인 필요로 저장했습니다. 확인 전 재접수하지 마세요.",
                    )
                  }
                >
                  결과 불명 · 재접수 잠금
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={locked || note.trim().length < 3}
                  onClick={() =>
                    void action(
                      "failed",
                      { packageId: p.id, note },
                      "공식 접수 실패를 기록했습니다.",
                    )
                  }
                >
                  명확한 접수 실패 기록
                </Button>
              </div>
            </details>
          )}
        </>
      )}
      {p.state === "awaiting_dropoff" && (
        <div className="rounded-lg bg-blue-50 p-3">
          <h4 className="text-sm font-semibold text-blue-950">우체국 제출 대기</h4>
          <p className="mt-1 text-xs leading-relaxed text-blue-900">
            사전접수만 완료된 상태입니다. 소포를 우체국 창구에 직접 맡긴 뒤 아래 버튼을 누르세요.
          </p>
          <p className="mt-2 text-xs text-blue-900">접수 확인: {p.registrationReference}</p>
          <Button
            type="button"
            size="sm"
            className="mt-3"
            disabled={locked}
            onClick={() => {
              if (
                window.confirm(`소포 ${index + 1} (${p.tracking})를 실제로 우체국 창구에 맡겼나요?`)
              )
                void action(
                  "handover",
                  { packageIds: [p.id], confirmed: true },
                  "창구 제출을 기록했습니다. 해당 소포는 배송중입니다.",
                );
            }}
          >
            창구 제출 완료 · 발송
          </Button>
        </div>
      )}
      {p.handedOverAt && (
        <div>
          <p className="text-xs text-slate-500">
            {p.postingRecordSource === "admin_confirmation"
              ? "관리자 발송 기록 시각"
              : "창구 제출 기록"}{" "}
            {formatTime(p.handedOverAt)}
            {p.deliveredAt ? ` · 실제 배달완료 ${formatTime(p.deliveredAt)}` : ""}
            {p.manualDelivery
              ? ` · 관리자 수동 완료 ${formatTime(p.manualDelivery.recordedAt)}`
              : ""}
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-3"
            variant="secondary"
            disabled={locked || !capabilities.tracking.enabled || p.state === "delivered"}
            onClick={() => {
              if (
                window.confirm(
                  `우편물번호 ${p.tracking}를 우체국 공식 배송조회 API로 전송해 조회할까요?`,
                )
              )
                void action(
                  "track",
                  { packageId: p.id, confirmed: true },
                  "우체국 배송조회 결과를 확인했습니다.",
                );
            }}
          >
            실제 배송기록 조회
          </Button>
          {!capabilities.tracking.enabled && (
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              {capabilities.tracking.reason}
            </p>
          )}
        </div>
      )}
      {dirty && (
        <p className="mt-3 text-xs text-amber-800">변경한 준비 정보를 먼저 저장해 주세요.</p>
      )}
    </div>
  );
}
