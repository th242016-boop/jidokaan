import { SaxesParser } from "saxes";
import type { EmsPackage, EmsTrackingEvidence } from "./ems-types";

/** Official field reference: https://www.data.go.kr/data/15035122/openapi.do
 * The published URL is HTTP. We deliberately require a separately verified HTTPS
 * deployment before sending a key or postal number; there is no HTTP fallback.
 * This adapter does not register parcels and does not schedule background calls.
 */
const ENDPOINT =
  "https://openapi.epost.go.kr/trace/retrieveLongitudinalCombinedService/retrieveLongitudinalCombinedService/getLongitudinalCombinedList";
const MAX_BYTES = 512 * 1024;
const TIMEOUT_MS = 10_000;
type TrackingResult = NonNullable<EmsPackage["trackingCheck"]>;
type State = EmsTrackingEvidence["state"];
type XmlNode = { name: string; text: string; children: XmlNode[] };
type Settings = Partial<
  Record<
    "EPOST_TRACKING_ENABLED" | "EPOST_TRACKING_SERVICE_KEY" | "EPOST_TRACKING_HTTPS_VERIFIED",
    string
  >
>;

export function getEmsTrackingCapabilities(env: Settings = process.env) {
  if (!env.EPOST_TRACKING_SERVICE_KEY?.trim())
    return {
      enabled: false,
      reason: "배송조회 API 인증키가 설정되지 않았습니다. 활용신청·승인 후 설정이 필요합니다.",
    };
  if (env.EPOST_TRACKING_HTTPS_VERIFIED !== "1")
    return {
      enabled: false,
      reason:
        "우체국 배송조회 API의 HTTPS 연결 검증이 필요합니다. 인증키를 HTTP로 전송하지 않습니다.",
    };
  if (env.EPOST_TRACKING_ENABLED !== "1")
    return {
      enabled: false,
      reason: "배송조회 API가 비활성화되어 있습니다. 승인된 조회 시험 후 활성화할 수 있습니다.",
    };
  return {
    enabled: true,
    reason:
      "관리자가 요청한 우편물만 우체국 API로 조회합니다. 자동 주기 조회는 아직 사용하지 않습니다.",
  };
}

function unavailable(checkedAt: string, message: string): TrackingResult {
  return { checkedAt, outcome: "unavailable", message };
}

function parseXml(xml: string): XmlNode {
  if (Buffer.byteLength(xml, "utf8") > MAX_BYTES) throw new Error("XML_LIMIT");
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("XML_DTD_FORBIDDEN");
  const parser = new SaxesParser({ xmlns: true });
  const stack: XmlNode[] = [];
  let root: XmlNode | undefined;
  let nodes = 0;
  parser.on("doctype", () => {
    throw new Error("XML_DTD_FORBIDDEN");
  });
  parser.on("error", (error) => {
    throw error;
  });
  parser.on("opentag", (tag) => {
    if (++nodes > 5000 || stack.length > 32) throw new Error("XML_LIMIT");
    const node: XmlNode = { name: tag.local.toLowerCase(), text: "", children: [] };
    if (stack.length) stack[stack.length - 1].children.push(node);
    else root = node;
    stack.push(node);
  });
  const append = (text: string) => {
    if (stack.length) stack[stack.length - 1].text += text;
  };
  parser.on("text", append);
  parser.on("cdata", append);
  parser.on("closetag", () => {
    stack.pop();
  });
  parser.write(xml).close();
  if (!root || stack.length) throw new Error("XML_INVALID");
  return root;
}

function descendants(root: XmlNode): XmlNode[] {
  return [root, ...root.children.flatMap(descendants)];
}

function one(nodes: XmlNode[], name: string, required = false): string {
  const matches = nodes.filter((node) => node.name === name);
  if (matches.length > 1 || (required && matches.length !== 1)) throw new Error("XML_AMBIGUOUS");
  return matches[0]?.text.trim() ?? "";
}

function statusState(raw: string): State {
  const text = raw.trim().replace(/\s+/g, " ").toLowerCase();
  // Match explicit postal statuses. Substring matching "delivered" could turn
  // "not delivered" into a false delivery, so unknown values stay unknown.
  if (
    ["배달완료", "배달 완료", "delivered", "delivery complete", "delivery completed"].includes(text)
  )
    return "delivered";
  if (
    [
      "반송",
      "반송완료",
      "반송 완료",
      "발송인에게 반송",
      "returned to sender",
      "return to sender",
      "returned",
    ].includes(text)
  )
    return "returned";
  if (
    [
      "통관보류",
      "통관 보류",
      "통관지연",
      "통관 지연",
      "세관보류",
      "세관 보류",
      "customs hold",
      "held by customs",
      "customs delay",
    ].includes(text)
  )
    return "customs_delay";
  if (
    [
      "미배달",
      "배달실패",
      "배달 실패",
      "배달불능",
      "수취인부재",
      "수취인 부재",
      "주소불명",
      "배달시도",
      "배달 시도",
      "not delivered",
      "delivery failed",
      "delivery attempted",
      "unsuccessful delivery",
      "attempted delivery",
      "unclaimed",
    ].includes(text)
  )
    return "delivery_failed";
  if (
    [
      "접수",
      "발송",
      "도착",
      "운송중",
      "배송중",
      "배달준비",
      "배달 준비",
      "배달중",
      "통관",
      "통관완료",
      "통관 완료",
      "발송준비",
      "발송 준비",
      "교환국 도착",
      "교환국 발송",
      "국제우편물류센터 도착",
      "항공기 출발",
      "항공기 도착",
      "posting/collection",
      "accepted",
      "in transit",
      "out for delivery",
      "arrival at inward office of exchange",
      "departure from outward office of exchange",
      "customs clearance",
    ].includes(text)
  )
    return "in_transit";
  return "unknown";
}

function validDate(date: string): string | undefined {
  // Validate without inventing a destination time zone. Official dates remain
  // dates; event times are retained as local postal event times when present.
  const match = /^(\d{4})[-./](\d{2})[-./](\d{2})$/.exec(date.trim());
  if (!match) return;
  const normalized = `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = new Date(`${normalized}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== normalized)
    return;
  return normalized;
}

function eventTime(date: string, time: string): string {
  const day = validDate(date);
  if (!day) return "";
  if (!time) return day;
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time.trim());
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59 || Number(match[3] ?? 0) > 59)
    return "";
  return `${day}T${match[1]}:${match[2]}:${match[3] ?? "00"}`;
}

function plausibleDate(value: string, checkedAt: string) {
  if (!value) return false;
  const maxDay = new Date(new Date(checkedAt).getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  return value.slice(0, 10) <= maxDay;
}

export function parseEmsTrackingXml(
  xml: string,
  tracking: string,
  checkedAt = new Date().toISOString(),
): TrackingResult {
  if (!/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(tracking))
    return unavailable(checkedAt, "EMS 우편물번호 형식이 올바르지 않습니다.");
  try {
    const root = parseXml(xml);
    const nodes = descendants(root);
    if (one(nodes, "successyn", true).toUpperCase() !== "Y")
      return unavailable(
        checkedAt,
        "우체국에서 조회 결과를 확인하지 못했습니다. 기존 배송상태를 유지합니다.",
      );
    if (one(nodes, "regino", true).toUpperCase() !== tracking)
      return unavailable(
        checkedAt,
        "응답 우편물번호가 요청과 다릅니다. 기존 배송상태를 유지합니다.",
      );
    const requested = one(nodes, "requestregino");
    if (requested && requested.toUpperCase() !== tracking)
      return unavailable(
        checkedAt,
        "조회 요청번호가 일치하지 않습니다. 기존 배송상태를 유지합니다.",
      );
    const rawStatus = one(nodes, "trackstate");
    const receiveDate = validDate(one(nodes, "receivedate"));
    const events: EmsTrackingEvidence["events"] = [];
    for (const node of nodes) {
      if (!node.children.some((child) => ["statue", "status"].includes(child.name))) continue;
      const status = one(node.children, "statue") || one(node.children, "status");
      const occurredAt = eventTime(one(node.children, "date"), one(node.children, "time"));
      events.push({
        occurredAt,
        status: status.slice(0, 200),
        location: one(node.children, "location").slice(0, 300),
        detail: one(node.children, "remark").slice(0, 1000),
      });
    }
    events.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
    const datedEvents = events.filter((event) => plausibleDate(event.occurredAt, checkedAt));
    const latest = datedEvents.at(-1);
    const summaryState = statusState(rawStatus);
    const latestState = latest ? statusState(latest.status) : "unknown";
    let state = latestState === "unknown" ? summaryState : latestState;
    let deliveredAt: string | undefined;
    if (state === "delivered") {
      // A postal completion label must be accompanied by a valid postal date.
      // Conflicting newest history or an undated adverse event blocks completion.
      const adverseUndated = events.some(
        (event) =>
          !event.occurredAt &&
          ["returned", "delivery_failed", "customs_delay"].includes(statusState(event.status)),
      );
      if (
        adverseUndated ||
        (summaryState === "delivered" &&
          latest &&
          latestState !== "delivered" &&
          latestState !== "unknown")
      ) {
        state = "unknown";
      } else if (
        latestState === "delivered" &&
        latest &&
        plausibleDate(latest.occurredAt, checkedAt)
      ) {
        if (["returned", "delivery_failed", "customs_delay"].includes(summaryState))
          state = "unknown";
        else deliveredAt = latest.occurredAt;
      } else if (
        summaryState === "delivered" &&
        receiveDate &&
        plausibleDate(receiveDate, checkedAt)
      ) {
        // Unknown/newer dated history cannot be overruled by an older summary date.
        if (latest && latest.occurredAt.slice(0, 10) >= receiveDate && latestState !== "delivered")
          state = "unknown";
        else deliveredAt = receiveDate;
      } else state = "unknown";
    }
    // A newer failed/returned event wins over an older delivered summary.
    if (
      summaryState === "delivered" &&
      latest &&
      latestState !== "delivered" &&
      latestState !== "unknown" &&
      receiveDate &&
      latest.occurredAt.slice(0, 10) < receiveDate
    )
      state = "unknown";
    const evidence: EmsTrackingEvidence = {
      provider: "koreapost",
      tracking,
      checkedAt,
      verified: true,
      state,
      ...(state === "delivered" && deliveredAt ? { deliveredAt } : {}),
      events,
      rawStatus,
    };
    return {
      checkedAt,
      outcome: state === "unknown" ? "unknown" : "ok",
      ...(state === "unknown"
        ? { message: "조회 응답의 배달 상태를 확정할 수 없습니다. 기존 배송상태를 유지합니다." }
        : {}),
      evidence,
    };
  } catch {
    return unavailable(
      checkedAt,
      "우체국 응답 형식을 검증하지 못했습니다. 기존 배송상태를 유지합니다.",
    );
  }
}

export async function fetchEmsTracking(
  tracking: string,
  options: { env?: Settings; fetchImpl?: typeof fetch; timeoutMs?: number; now?: () => Date } = {},
): Promise<TrackingResult> {
  const checkedAt = (options.now?.() ?? new Date()).toISOString();
  const env = options.env ?? process.env;
  const capabilities = getEmsTrackingCapabilities(env);
  if (!capabilities.enabled) return unavailable(checkedAt, capabilities.reason);
  if (!/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(tracking))
    return unavailable(checkedAt, "EMS 우편물번호 형식이 올바르지 않습니다.");
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<TrackingResult>((resolve) => {
    timer = setTimeout(
      () => {
        controller.abort();
        resolve(
          unavailable(checkedAt, "우체국 조회 응답이 지연되었습니다. 기존 배송상태를 유지합니다."),
        );
      },
      Math.min(TIMEOUT_MS, Math.max(1, options.timeoutMs ?? TIMEOUT_MS)),
    );
  });
  const request = async (): Promise<TrackingResult> => {
    try {
      const url = new URL(ENDPOINT);
      // Data portal offers both decoded and URL-encoded keys. Decode at most once
      // then let URLSearchParams encode; never put request URLs into error logs.
      let key = env.EPOST_TRACKING_SERVICE_KEY!.trim();
      try {
        key = decodeURIComponent(key);
      } catch {
        /* Keep a literal decoded key. */
      }
      url.searchParams.set("ServiceKey", key);
      url.searchParams.set("rgist", tracking);
      const response = await (options.fetchImpl ?? fetch)(url, {
        signal: controller.signal,
        redirect: "error",
        headers: { Accept: "application/xml, text/xml" },
      });
      if (!response.ok)
        return unavailable(
          checkedAt,
          "우체국 배송조회 서비스에 연결하지 못했습니다. 기존 배송상태를 유지합니다.",
        );
      if (Number(response.headers.get("content-length")) > MAX_BYTES)
        return unavailable(checkedAt, "우체국 조회 응답이 허용 크기를 초과했습니다.");
      if (!response.body) return unavailable(checkedAt, "우체국에서 빈 응답을 반환했습니다.");
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > MAX_BYTES) {
            await reader.cancel();
            return unavailable(checkedAt, "우체국 조회 응답이 허용 크기를 초과했습니다.");
          }
          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }
      const bytes = Buffer.concat(chunks);
      const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      return parseEmsTrackingXml(text, tracking, checkedAt);
    } catch {
      return unavailable(
        checkedAt,
        "우체국 배송조회에 실패했습니다. 기존 배송상태를 유지하고 다시 확인해 주세요.",
      );
    }
  };
  try {
    return await Promise.race([request(), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
