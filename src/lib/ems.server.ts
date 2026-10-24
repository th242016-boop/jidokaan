import { createHash } from "node:crypto";
import { assertSession } from "./admin-auth.server";
import { findOrderById, saveOrder } from "./orders.server";
import type { StoreOrder } from "./order-types";
import type { EmsAction, EmsCapabilities } from "./ems-types";
import {
  applyEmsAction,
  applyEmsTracking,
  emsIssues,
  exportEmsTxt,
  hasEmsClaim,
  prepareEms,
} from "./ems-workflow";
import { fetchEmsTracking, getEmsTrackingCapabilities } from "./ems-tracking.server";

export function getEmsCapabilities(): EmsCapabilities {
  return {
    registration: {
      enabled: false,
      mode: "manual",
      reason:
        "접수 API 미연결 · 공식 스마트접수 후 우편물번호와 접수 결과를 직접 기록합니다. 창구 직접 반입 방식의 API 지원 확인이 필요합니다.",
    },
    tracking: getEmsTrackingCapabilities(),
    smartRegistrationUrl: "https://ems.epost.go.kr/front.SmEmsApply1100s.postal",
    officialFormatUrl: "https://ems.epost.go.kr/front.PopRegFileEms.postal?filetype=",
  };
}
async function requiredOrder(id: string) {
  const order = await findOrderById(id);
  if (!order) throw new Error("NOT_FOUND");
  return order;
}
function stamp(action: unknown) {
  return createHash("sha256").update(JSON.stringify(action)).digest("hex");
}
function repeated(order: StoreOrder, operationId: string, fingerprint: string) {
  const previous = order.fulfillment?.audit.find((a) => a.operationId === operationId);
  if (!previous) return false;
  if (previous.fingerprint !== fingerprint) throw new Error("EMS_OPERATION_CONFLICT");
  return true;
}
function operationCheck(version: number, operationId: string) {
  if (!Number.isInteger(version) || version < 1 || !/^[a-zA-Z0-9_.:-]{8,120}$/.test(operationId))
    throw new Error("EMS_OPERATION_INVALID");
}
async function persist(
  previous: StoreOrder,
  next: StoreOrder,
  operationId: string,
  fingerprint: string,
) {
  const audit = next.fulfillment?.audit.find((a) => a.operationId === operationId);
  if (audit) audit.fingerprint = fingerprint;
  try {
    await saveOrder(previous, next);
    return next;
  } catch (error) {
    if ((error as Error).message === "ORDER_CHANGED") {
      const latest = await requiredOrder(previous.id);
      if (repeated(latest, operationId, fingerprint)) return latest;
    }
    throw error;
  }
}
export async function prepareEmsOrders(token: string, ids: string[]) {
  await assertSession(token);
  if (!Array.isArray(ids) || !ids.length || ids.length > 100) throw new Error("EMS_SELECTION");
  const orders: StoreOrder[] = [],
    errors: Array<{ id: string; error: string }> = [];
  for (const id of new Set(ids.map((id) => String(id).slice(0, 100)))) {
    try {
      const current = await requiredOrder(id);
      const next = prepareEms(current);
      if (!current.fulfillment) {
        try {
          await saveOrder(current, next);
        } catch (error) {
          if ((error as Error).message !== "ORDER_CHANGED") throw error;
          const latest = await requiredOrder(id);
          if (!latest.fulfillment) throw error;
          orders.push(latest);
          continue;
        }
      }
      orders.push(next);
    } catch (error) {
      errors.push({ id, error: (error as Error).message });
    }
  }
  return { orders, errors };
}
export async function mutateEms(
  token: string,
  id: string,
  version: number,
  operationId: string,
  action: EmsAction,
) {
  await assertSession(token);
  operationCheck(version, operationId);
  const previous = await requiredOrder(id),
    fingerprint = stamp(action);
  if (repeated(previous, operationId, fingerprint)) return previous;
  if (previous.fulfillment?.version !== version) throw new Error("ORDER_CHANGED");
  const next = applyEmsAction(previous, action, operationId);
  return persist(previous, next, operationId, fingerprint);
}
export async function refreshEmsTracking(
  token: string,
  id: string,
  version: number,
  operationId: string,
  packageId: string,
  confirmed: boolean,
) {
  await assertSession(token);
  operationCheck(version, operationId);
  if (!confirmed) throw new Error("EMS_CONFIRM_REQUIRED");
  const previous = await requiredOrder(id),
    fingerprint = stamp({ action: "track", packageId });
  if (repeated(previous, operationId, fingerprint)) return previous;
  if (previous.fulfillment?.version !== version) throw new Error("ORDER_CHANGED");
  if (!["shipped", "done", "confirmed"].includes(previous.status) || hasEmsClaim(previous))
    throw new Error("EMS_ORDER_INACTIVE");
  const parcel = previous.fulfillment?.packages.find((p) => p.id === packageId);
  if (!parcel?.tracking || !parcel.handedOverAt) throw new Error("EMS_NOT_HANDED_OVER");
  if (previous.status === "done" || previous.status === "confirmed") return previous;
  if (!getEmsTrackingCapabilities().enabled) throw new Error("EMS_TRACKING_DISABLED");
  const result = await fetchEmsTracking(parcel.tracking);
  const next = applyEmsTracking(previous, packageId, result, operationId);
  return persist(previous, next, operationId, fingerprint);
}
export async function exportEmsOrders(token: string, ids: string[]) {
  await assertSession(token);
  if (!Array.isArray(ids) || !ids.length || ids.length > 100) throw new Error("EMS_SELECTION");
  const orders: StoreOrder[] = [];
  for (const id of new Set(ids)) orders.push(await requiredOrder(id));
  return exportEmsTxt(orders);
}
export async function readEmsOrder(token: string, id: string) {
  await assertSession(token);
  const order = await requiredOrder(id);
  return { order, capabilities: getEmsCapabilities(), issues: emsIssues(order) };
}
