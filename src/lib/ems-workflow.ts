import { EMS_STATE_LABEL } from "./ems-types";
import type { StoreOrder } from "./order-types";
import type {
  EmsAction,
  EmsFulfillment,
  EmsIssue,
  EmsItem,
  EmsPackage,
  EmsRecipient,
} from "./ems-types";

const copy = <T>(value: T): T => structuredClone(value);
const clean = (v: unknown, max = 300) =>
  String(v ?? "")
    .trim()
    .slice(0, max);
const positive = (v: unknown): number | null =>
  v === null || v === "" || v === undefined
    ? null
    : Number.isFinite(Number(v)) && Number(v) > 0
      ? Number(v)
      : null;
const money = (v: number) => Math.round(v * 100) / 100;
const lockedStates = new Set([
  "registration_unknown",
  "awaiting_dropoff",
  "in_transit",
  "delivered",
  "customs_delay",
  "delivery_failed",
  "returned",
]);
export function hasEmsClaim(order: StoreOrder) {
  return Boolean(
    order.claim &&
    (order.claimStatus === "requested" || order.claimStatus === "accepted" || !order.claimStatus),
  );
}
export function canPrepareEms(order: StoreOrder) {
  return (
    order.country?.trim().toUpperCase() !== "KR" &&
    ["paid", "ready"].includes(order.status) &&
    !hasEmsClaim(order) &&
    (!order.tracking || Boolean(order.fulfillment))
  );
}
function active(order: StoreOrder) {
  if (!["paid", "ready", "shipped"].includes(order.status) || hasEmsClaim(order))
    throw new Error("EMS_ORDER_INACTIVE");
}
export function itemPaidValues(order: StoreOrder): number[] {
  const usd = order.currency === "USD";
  if (!usd && order.currency !== "KRW") throw new Error("EMS_CURRENCY");
  const goods = money(
    usd ? order.totalUsd - order.shippingUsd : order.totalKrw - order.shippingKrw,
  );
  const values = order.items.map((i) => (usd ? i.priceUsd : i.priceKrw) * i.qty);
  const sum = values.reduce((a, b) => a + b, 0);
  if (!Number.isFinite(goods) || goods <= 0 || !Number.isFinite(sum) || sum <= 0)
    throw new Error("EMS_VALUE_MISSING");
  let used = 0;
  return values.map((v, i) => {
    const value = i === values.length - 1 ? money(goods - used) : money((goods * v) / sum);
    used = money(used + value);
    return value;
  });
}
export function prepareEms(order: StoreOrder, now = new Date().toISOString()): StoreOrder {
  if (!canPrepareEms(order)) throw new Error("EMS_ORDER_INACTIVE");
  if (order.fulfillment) return copy(order);
  const values = itemPaidValues(order);
  return {
    ...copy(order),
    status: "ready",
    fulfillment: {
      version: 1,
      method: "ems_counter_dropoff",
      createdAt: now,
      updatedAt: now,
      recipient: {
        englishConfirmed: false,
        name: order.name,
        address: order.address,
        city: order.city || "",
        region: order.region || "",
        postal: order.postal || "",
        country: order.country || "",
        email: order.email,
        phone: order.phone,
        countryCallingCode: "",
        areaCode: "",
        phone1: "",
        phone2: "",
        taxId: "",
        vatId: "",
      },
      packages: [
        {
          id: "parcel-1",
          state: "preparing",
          grossWeightGrams: null,
          lengthCm: 41,
          widthCm: 31,
          heightCm: 15,
          items: order.items.map((item, index) => ({
            sourceItemIndex: index,
            descriptionEn: "",
            hsCode: "",
            originCountry: "",
            quantity: item.qty,
            declaredValue: values[index],
            currency: order.currency,
            netWeightGrams: null,
          })),
        },
      ],
      audit: [
        {
          at: now,
          action: "prepare",
          message: "발송 준비 시작 · 창구 직접 반입",
          operationId: "initial-prepare",
        },
      ],
    },
  };
}
function recipientFrom(input: EmsRecipient): EmsRecipient {
  const keys = [
    "name",
    "address",
    "city",
    "region",
    "postal",
    "country",
    "email",
    "phone",
    "countryCallingCode",
    "areaCode",
    "phone1",
    "phone2",
    "taxId",
    "vatId",
  ] as const;
  const out = { englishConfirmed: input?.englishConfirmed === true } as EmsRecipient;
  for (const key of keys) out[key] = clean(input?.[key], key === "address" ? 300 : 120);
  out.country = out.country.toUpperCase();
  return out;
}
function itemFrom(item: EmsItem): EmsItem {
  return {
    sourceItemIndex: Number(item.sourceItemIndex),
    descriptionEn: clean(item.descriptionEn, 120),
    hsCode: clean(item.hsCode, 10),
    originCountry: clean(item.originCountry, 2).toUpperCase(),
    quantity: Number(item.quantity),
    declaredValue: Number(item.declaredValue),
    currency: clean(item.currency, 3).toUpperCase(),
    netWeightGrams: positive(item.netWeightGrams),
  };
}
function draftPackage(input: EmsPackage, previous?: EmsPackage): EmsPackage {
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(input.id)) throw new Error("EMS_PACKAGE_ID");
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 30)
    throw new Error("EMS_ITEMS");
  return {
    ...(previous || {}),
    id: input.id,
    state: previous?.state || "preparing",
    grossWeightGrams: positive(input.grossWeightGrams),
    lengthCm: positive(input.lengthCm),
    widthCm: positive(input.widthCm),
    heightCm: positive(input.heightCm),
    items: input.items.map(itemFrom),
  };
}
export function emsIssues(order: StoreOrder): EmsIssue[] {
  const f = order.fulfillment;
  if (!f) return [{ field: "fulfillment", message: "발송 준비를 먼저 시작해 주세요." }];
  const issues: EmsIssue[] = [];
  const add = (field: string, message: string, packageId?: string) =>
    issues.push({ field, message, packageId });
  const r = f.recipient;
  for (const key of ["name", "address", "city", "postal", "country", "phone"] as const)
    if (!r[key]?.trim())
      add(
        key,
        `${{ name: "수취인", address: "주소", city: "도시", postal: "우편번호", country: "국가", phone: "연락처" }[key]}를 확인해 주세요.`,
      );
  if (!r.englishConfirmed)
    add("englishConfirmed", "수취인 이름과 주소의 영문 표기를 확인해 주세요.");
  if ([r.name, r.address, r.city, r.region].some((v) => /[\uAC00-\uD7A3\u4E00-\u9FFF]/.test(v)))
    add("address", "수취인 이름과 주소는 영문으로 입력해 주세요.");
  if (!/^[A-Z]{2}$/.test(r.country) || r.country === "KR")
    add("country", "해외 수취 국가의 ISO 두 글자 코드를 확인해 주세요.");
  if (
    !/^\d{1,4}$/.test(r.countryCallingCode) ||
    !/^\d{2,15}$/.test(r.phone1 + r.phone2) ||
    (r.areaCode && !/^\d{1,6}$/.test(r.areaCode))
  )
    add("phoneParts", "전화 국가번호와 전화번호 구분 입력을 확인해 주세요.");
  const quantities = order.items.map(() => 0),
    amounts = order.items.map(() => 0);
  let expected: number[] = [];
  try {
    expected = itemPaidValues(order);
  } catch {
    add("declaredValue", "실제 결제된 상품 금액을 확인할 수 없습니다.");
  }
  if (!f.packages.length || f.packages.length > 30) add("packages", "소포 수는 1~30개여야 합니다.");
  for (const p of f.packages) {
    for (const key of ["grossWeightGrams", "lengthCm", "widthCm", "heightCm"] as const)
      if (!Number.isFinite(p[key]) || Number(p[key]) <= 0)
        add(
          key,
          key === "grossWeightGrams"
            ? "포장 후 실제 총중량(g)을 입력해 주세요."
            : "실측 포장 크기(cm)를 확인해 주세요.",
          p.id,
        );
    let net = 0;
    const seen = new Set<number>();
    for (const [i, item] of p.items.entries()) {
      const field = `items.${i}`;
      if (
        !Number.isInteger(item.sourceItemIndex) ||
        !order.items[item.sourceItemIndex] ||
        seen.has(item.sourceItemIndex)
      ) {
        add(field, "원래 주문 상품과 연결된 품목을 확인해 주세요.", p.id);
        continue;
      }
      seen.add(item.sourceItemIndex);
      if (!item.descriptionEn || /[^\x20-\x7E]/.test(item.descriptionEn))
        add(field, "영문 품명을 입력해 주세요.", p.id);
      if (!(r.country === "US" ? /^\d{10}$/ : /^\d{6}(\d{2})?(\d{2})?$/).test(item.hsCode))
        add(
          field,
          r.country === "US"
            ? "미국행 10자리 HTS 코드를 확인해 주세요."
            : "상품분류 HS 코드를 확인해 주세요.",
          p.id,
        );
      if (!/^[A-Z]{2}$/.test(item.originCountry))
        add(field, "확인한 원산지 국가 코드를 입력해 주세요.", p.id);
      if (!Number.isInteger(item.quantity) || item.quantity <= 0)
        add(field, "수량은 1 이상의 정수여야 합니다.", p.id);
      if (
        !Number.isFinite(item.declaredValue) ||
        item.declaredValue <= 0 ||
        money(item.declaredValue) !== item.declaredValue ||
        item.currency !== order.currency
      )
        add(field, "실제 상품 금액과 결제 통화를 확인해 주세요.", p.id);
      if (!Number.isFinite(item.netWeightGrams) || Number(item.netWeightGrams) <= 0)
        add(field, "해당 품목 전체의 순중량(g)을 입력해 주세요.", p.id);
      quantities[item.sourceItemIndex] += item.quantity;
      amounts[item.sourceItemIndex] = money(amounts[item.sourceItemIndex] + item.declaredValue);
      net += Number(item.netWeightGrams) || 0;
    }
    if (net > Number(p.grossWeightGrams) && p.grossWeightGrams)
      add("grossWeightGrams", "총중량은 품목 순중량 합계보다 작을 수 없습니다.", p.id);
  }
  order.items.forEach((item, i) => {
    if (quantities[i] !== item.qty)
      add("allocation", `${item.name}: 모든 소포의 합산 수량이 주문 수량과 다릅니다.`);
    if (expected[i] !== undefined && Math.abs(amounts[i] - expected[i]) > 0.001)
      add(
        "allocation",
        `${item.name}: 신고 금액 합계는 실제 상품 결제 금액 ${expected[i]} ${order.currency}와 같아야 합니다.`,
      );
  });
  return issues;
}
/** Existing posted parcels need consistent order allocation, not a new customs application. */
export function emsAllocationIssues(order: StoreOrder): EmsIssue[] {
  const f = order.fulfillment;
  if (!f) return [{ field: "fulfillment", message: "발송 준비를 먼저 시작해 주세요." }];
  const issues: EmsIssue[] = [];
  const add = (field: string, message: string, packageId?: string) =>
    issues.push({ field, message, packageId });
  if (!Array.isArray(f.packages) || f.packages.length < 1 || f.packages.length > 30) {
    return [{ field: "packages", message: "소포 수는 1~30개여야 합니다." }];
  }
  if (!Array.isArray(order.items) || !order.items.length)
    return [{ field: "allocation", message: "원래 주문 상품을 확인할 수 없습니다." }];
  let expected: number[];
  try {
    expected = itemPaidValues(order);
  } catch {
    return [{ field: "declaredValue", message: "실제 결제된 상품 금액을 확인할 수 없습니다." }];
  }
  const quantities = order.items.map(() => 0),
    amounts = order.items.map(() => 0),
    packageIds = new Set<string>();
  for (const p of f.packages) {
    if (!p.id || packageIds.has(p.id))
      add("packages", "소포 구분 정보가 중복되거나 누락되었습니다.", p.id);
    packageIds.add(p.id);
    if (!Array.isArray(p.items) || p.items.length < 1 || p.items.length > 30) {
      add("allocation", "소포에 포함된 주문 상품을 확인해 주세요.", p.id);
      continue;
    }
    const seen = new Set<number>();
    for (const item of p.items) {
      if (
        !Number.isInteger(item.sourceItemIndex) ||
        !order.items[item.sourceItemIndex] ||
        seen.has(item.sourceItemIndex)
      ) {
        add("allocation", "원래 주문 상품과 연결된 품목을 확인해 주세요.", p.id);
        continue;
      }
      seen.add(item.sourceItemIndex);
      if (!Number.isInteger(item.quantity) || item.quantity <= 0)
        add("allocation", "수량은 1 이상의 정수여야 합니다.", p.id);
      if (
        !Number.isFinite(item.declaredValue) ||
        item.declaredValue <= 0 ||
        money(item.declaredValue) !== item.declaredValue ||
        item.currency !== order.currency
      ) {
        add("allocation", "실제 상품 금액과 결제 통화를 확인해 주세요.", p.id);
      }
      quantities[item.sourceItemIndex] += item.quantity;
      amounts[item.sourceItemIndex] = money(amounts[item.sourceItemIndex] + item.declaredValue);
    }
  }
  order.items.forEach((item, index) => {
    if (!Number.isInteger(item.qty) || item.qty <= 0 || quantities[index] !== item.qty)
      add("allocation", `${item.name}: 모든 소포의 합산 수량이 주문 수량과 다릅니다.`);
    if (
      !Number.isFinite(expected[index]) ||
      expected[index] <= 0 ||
      !Number.isFinite(amounts[index]) ||
      Math.abs(amounts[index] - expected[index]) > 0.001
    ) {
      add(
        "allocation",
        `${item.name}: 소포별 상품 금액 합계는 실제 상품 결제 금액 ${expected[index]} ${order.currency}와 같아야 합니다.`,
      );
    }
  });
  return issues;
}
export function validEmsTracking(value: string) {
  return /^[A-Z]{2}\d{9}[A-Z]{2}$/.test(value);
}
export function applyEmsAction(
  order: StoreOrder,
  action: EmsAction,
  operationId: string,
  now = new Date().toISOString(),
): StoreOrder {
  active(order);
  if (!order.fulfillment) throw new Error("EMS_NOT_PREPARED");
  const next = copy(order),
    f = next.fulfillment!;
  let packageId: string | undefined;
  let message = "";
  if (action.action === "save") {
    if (!Array.isArray(action.packages) || !action.packages.length || action.packages.length > 30)
      throw new Error("EMS_PACKAGES");
    const recipient = recipientFrom(action.recipient);
    if (
      f.packages.some((p) => lockedStates.has(p.state)) &&
      JSON.stringify(recipient) !== JSON.stringify(f.recipient)
    )
      throw new Error("EMS_REGISTERED_LOCKED");
    const ids = new Set<string>();
    const packages = action.packages.map((p) => {
      if (ids.has(p.id)) throw new Error("EMS_PACKAGE_ID");
      ids.add(p.id);
      const prev = f.packages.find((x) => x.id === p.id);
      const candidate = draftPackage(p, prev);
      if (
        prev &&
        lockedStates.has(prev.state) &&
        JSON.stringify(candidate) !== JSON.stringify(prev)
      )
        throw new Error("EMS_REGISTERED_LOCKED");
      return candidate;
    });
    if (f.packages.some((p) => lockedStates.has(p.state) && !ids.has(p.id)))
      throw new Error("EMS_REGISTERED_LOCKED");
    f.recipient = recipient;
    f.packages = packages;
    message = "EMS 수취인·소포 정보 저장";
  } else if (action.action === "handover") {
    if (!action.confirmed) throw new Error("EMS_CONFIRM_REQUIRED");
    if (!Array.isArray(action.packageIds) || !action.packageIds.length)
      throw new Error("EMS_PACKAGES");
    for (const id of new Set(action.packageIds)) {
      const p = f.packages.find((x) => x.id === id);
      if (!p || p.state !== "awaiting_dropoff" || !p.tracking)
        throw new Error("EMS_NOT_REGISTERED");
      p.state = "in_transit";
      p.handedOverAt = now;
    }
    next.status = "shipped";
    next.courier = "우체국 EMS";
    next.tracking = f.packages.find((p) => p.handedOverAt)?.tracking;
    message = "우체국 창구에 인계 완료 · 발송 처리";
  } else {
    packageId = action.packageId;
    const p = f.packages.find((x) => x.id === packageId);
    if (!p) throw new Error("EMS_PACKAGE_NOT_FOUND");
    if (action.action === "record_posted") {
      // This records an already completed physical handover; it never requests postal registration.
      if (!["preparing", "registration_failed"].includes(p.state))
        throw new Error("EMS_REGISTRATION_LOCKED");
      if (!action.confirmed) throw new Error("EMS_CONFIRM_REQUIRED");
      const issues = emsAllocationIssues(next);
      if (issues.length)
        throw new Error("EMS_ALLOCATION_INCOMPLETE:" + issues.map((i) => i.message).join(" "));
      const tracking = String(action.tracking ?? "")
        .trim()
        .toUpperCase();
      if (!validEmsTracking(tracking)) throw new Error("EMS_TRACKING_INVALID");
      if (f.packages.some((x) => x.id !== p.id && x.tracking === tracking))
        throw new Error("EMS_DUPLICATE_TRACKING");
      const reference = clean(action.reference, 500);
      p.tracking = tracking;
      if (reference) p.registrationReference = reference;
      else delete p.registrationReference;
      p.postingRecordSource = "admin_confirmation";
      // Actual carrier timestamps are not known here: these are administrator confirmation times.
      p.registeredAt = now;
      p.handedOverAt = now;
      p.state = "in_transit";
      p.registrationNote =
        "관리자가 실제 우체국 창구 인계와 송장번호를 확인함. 저장 시각은 관리자 확인 기록 시각입니다.";
      next.status = "shipped";
      next.courier = "우체국 EMS";
      next.tracking = f.packages.find((x) => x.handedOverAt)?.tracking;
      message = "관리자가 실제 우체국 창구 인계와 송장번호를 확인함 · 이미 발송한 소포 기록";
    } else if (
      action.action === "register" ||
      (action.action === "reconcile" && action.outcome === "registered")
    ) {
      if (action.action === "register" && !["preparing", "registration_failed"].includes(p.state))
        throw new Error("EMS_REGISTRATION_LOCKED");
      if (action.action === "reconcile" && p.state !== "registration_unknown")
        throw new Error("EMS_RECONCILE_STATE");
      if (!action.confirmed) throw new Error("EMS_CONFIRM_REQUIRED");
      const issues = emsIssues(next);
      if (issues.length)
        throw new Error("EMS_INCOMPLETE:" + issues.map((i) => i.message).join(" "));
      const tracking = String(action.tracking ?? "")
        .trim()
        .toUpperCase();
      if (!validEmsTracking(tracking)) throw new Error("EMS_TRACKING_INVALID");
      const reference = clean(action.reference, 500);
      if (reference.length < 3) throw new Error("EMS_REGISTRATION_PROOF");
      if (f.packages.some((x) => x.id !== p.id && x.tracking === tracking))
        throw new Error("EMS_DUPLICATE_TRACKING");
      p.tracking = tracking;
      p.registrationReference = reference;
      p.registeredAt = now;
      p.state = "awaiting_dropoff";
      message = "공식 사전접수 완료 확인 · 우체국 제출 대기";
    } else if (action.action === "reconcile") {
      if (p.state !== "registration_unknown") throw new Error("EMS_RECONCILE_STATE");
      if (!action.confirmed || clean(action.reference).length < 3)
        throw new Error("EMS_REGISTRATION_PROOF");
      p.state = "preparing";
      p.registrationNote = clean(action.reference, 500);
      message = "공식 접수내역에서 미접수 확인 · 재시도 가능";
    } else {
      if (!["preparing", "registration_failed"].includes(p.state))
        throw new Error("EMS_REGISTRATION_LOCKED");
      if (clean(action.note).length < 3) throw new Error("EMS_REGISTRATION_PROOF");
      p.state = action.action === "uncertain" ? "registration_unknown" : "registration_failed";
      p.registrationNote = clean(action.note, 500);
      message =
        action.action === "uncertain"
          ? "접수 결과 불명 · 확인 전 재접수 금지"
          : "공식 접수 실패 기록";
    }
  }
  f.version++;
  f.updatedAt = now;
  f.audit.push({ at: now, action: action.action, packageId, message, operationId });
  return next;
}
/** Manual completion is an explicit merchant confirmation, never postal API evidence. */
export function manualDeliveryIssues(order: StoreOrder): EmsIssue[] {
  if (order.status !== "shipped")
    return [{ field: "status", message: "배송중인 주문만 배송완료 처리할 수 있습니다." }];
  if (hasEmsClaim(order))
    return [{ field: "claim", message: "진행 중인 취소·반품·교환 요청을 먼저 확인해 주세요." }];
  const f = order.fulfillment;
  if (!f)
    return order.tracking?.trim()
      ? []
      : [{ field: "tracking", message: "기존 발송 주문의 송장번호를 먼저 확인해 주세요." }];
  if (!Array.isArray(f.packages) || !f.packages.length)
    return [{ field: "packages", message: "발송된 소포 정보가 없습니다." }];
  const issues: EmsIssue[] = [];
  for (const p of f.packages) {
    if (!p.tracking?.trim() || !p.handedOverAt || !Number.isFinite(Date.parse(p.handedOverAt))) {
      issues.push({
        field: "handover",
        packageId: p.id,
        message: `${p.id}: 아직 우체국에 인계하지 않은 소포가 있습니다. 모든 소포를 발송한 후 배송완료 처리해 주세요.`,
      });
    } else if (
      !["in_transit", "delivered", "customs_delay", "delivery_failed", "returned"].includes(p.state)
    ) {
      issues.push({
        field: "state",
        packageId: p.id,
        message: `${p.id}: ${EMS_STATE_LABEL[p.state]} 상태입니다. 배송 예외 상태를 먼저 확인해 주세요.`,
      });
    }
  }
  return issues;
}
export function canCompleteManualDelivery(order: StoreOrder) {
  return manualDeliveryIssues(order).length === 0;
}
export function applyManualDeliveryCompletion(
  order: StoreOrder,
  operationId: string,
  confirmed: boolean,
  now = new Date().toISOString(),
): StoreOrder {
  if (!confirmed) throw new Error("EMS_CONFIRM_REQUIRED");
  const issues = manualDeliveryIssues(order);
  if (issues.length)
    throw new Error("EMS_MANUAL_DELIVERY_BLOCKED:" + issues.map((i) => i.message).join(" "));
  const next = copy(order);
  const confirmation = { source: "admin_confirmation" as const, recordedAt: now, operationId };
  next.status = "done";
  next.deliveryCompletion = confirmation;
  if (next.fulfillment) {
    for (const parcel of next.fulfillment.packages) {
      if (parcel.state !== "delivered") {
        parcel.state = "delivered";
        parcel.manualDelivery = { ...confirmation };
      }
      // Preserve actual carrier deliveredAt and tracking evidence exactly as received.
    }
    next.fulfillment.version++;
    next.fulfillment.updatedAt = now;
    next.fulfillment.audit.push({
      at: now,
      action: "complete_delivery",
      operationId,
      message: "관리자가 모든 소포의 배송완료를 확인함 · 수동 처리 (우체국 자동조회 아님)",
    });
  }
  return next;
}
export function applyEmsTracking(
  order: StoreOrder,
  packageId: string,
  result: NonNullable<EmsPackage["trackingCheck"]>,
  operationId: string,
  now = new Date().toISOString(),
): StoreOrder {
  if (order.status === "done" || order.status === "confirmed") return copy(order);
  active(order);
  if (!order.fulfillment) throw new Error("EMS_NOT_PREPARED");
  const next = copy(order),
    f = next.fulfillment!,
    p = f.packages.find((x) => x.id === packageId);
  if (!p?.handedOverAt || !p.tracking) throw new Error("EMS_NOT_HANDED_OVER");
  const ev = result.evidence;
  if (
    result.outcome === "ok" &&
    ev?.verified &&
    ev.provider === "koreapost" &&
    ev.tracking === p.tracking
  ) {
    if (p.state !== "delivered" && ev.state !== "unknown") {
      if (
        ev.state !== "delivered" ||
        (ev.deliveredAt && Number.isFinite(Date.parse(ev.deliveredAt)))
      ) {
        p.state = ev.state;
        if (ev.state === "delivered") p.deliveredAt = ev.deliveredAt;
      }
    }
    p.trackingCheck = copy(result);
  } else {
    p.trackingCheck = { ...copy(result), evidence: p.trackingCheck?.evidence };
  }
  if (f.packages.every((x) => x.state === "delivered" && x.deliveredAt && x.handedOverAt))
    next.status = "done";
  f.version++;
  f.updatedAt = now;
  f.audit.push({
    at: now,
    action: "track",
    packageId,
    message:
      result.outcome === "ok"
        ? "우체국 실제 배송기록 확인"
        : "배송조회 실패 또는 상태 확인 불가 · 기존 기록 유지",
    operationId,
  });
  return next;
}
export function exportEmsTxt(orders: StoreOrder[]) {
  const rows: string[] = [];
  const field = (value: unknown) => {
    const text = String(value ?? "");
    if (/[|\r\n\t]/.test(text) || /^[=+@]/.test(text)) throw new Error("EMS_EXPORT_CHARACTER");
    return text;
  };
  for (const o of orders) {
    active(o);
    const issues = emsIssues(o);
    if (issues.length) throw new Error("EMS_INCOMPLETE:" + issues.map((i) => i.message).join(" "));
    const f = o.fulfillment!,
      r = f.recipient;
    for (const p of f.packages) {
      if (!["preparing", "registration_failed"].includes(p.state))
        throw new Error("EMS_REGISTRATION_LOCKED");
      if (p.items.length !== 1)
        throw new Error(
          "EMS_EXPORT_MULTI_ITEM:한 소포에 여러 품목이 있으면 우체국 공식 엑셀 양식에 직접 입력해 주세요.",
        );
      const item = p.items[0];
      rows.push(
        [
          r.name,
          r.country,
          r.postal,
          r.address,
          r.city,
          r.region,
          r.countryCallingCode,
          r.areaCode,
          r.phone1,
          r.phone2,
          r.email,
          r.taxId,
          r.vatId,
          "",
          "",
          "",
          "",
          "O",
          item.descriptionEn,
          item.hsCode,
          item.quantity,
          item.declaredValue,
          item.currency,
          item.netWeightGrams,
          item.originCountry,
        ]
          .map(field)
          .join("|"),
      );
    }
  }
  if (rows.length > 300) throw new Error("EMS_EXPORT_LIMIT");
  return {
    filename: `jidokaan-ems-${new Date().toISOString().slice(0, 10)}.txt`,
    content: rows.join("\r\n"),
    mimeType: "text/plain;charset=utf-8",
  };
}
