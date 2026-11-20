const messages = {
  adminLogin: "5분 이내 관리자 인증 실패 또는 제한 응답이 5회 이상 발생했습니다.",
  ordersOpened: "5분 이내 새 주문 또는 PayPal 결제 시작이 합계 25회 이상 발생했습니다.",
  orderTraffic: "5분 이내 주문·결제 요청 빈도 제한이 5회 이상 발생했습니다.",
  serverError: "5분 이내 서버 오류 응답이 5회 이상 발생했습니다.",
} as const;
type Event = keyof typeof messages;
const counters = new Map<Event, { start: number; count: number; lastSent: number }>();

// Only the coarse event category is recorded. No request details or credentials
// enter logs or messages. Cooldown is per event type and application instance.
export function reportSecurityEvent(event: Event) {
  const now = Date.now();
  const state = counters.get(event) ?? { start: now, count: 0, lastSent: 0 };
  if (now - state.start > 5 * 60_000) {
    state.start = now;
    state.count = 0;
  }
  state.count++;
  counters.set(event, state);
  const threshold = event === "ordersOpened" ? 25 : 5;
  if (state.count < threshold || now - state.lastSent < 30 * 60_000) return;
  state.lastSent = now;
  console.warn("[jidokaan-security]", event);
  if (process.env.RAILWAY_ENVIRONMENT_NAME !== "production" || process.env.JIDOKAAN_LOCAL_ONLY === "1") return;
  void import("./telegram-orders.server").then(({ notifySecurityAlert }) =>
    notifySecurityAlert(messages[event]),
  ).catch(() => console.warn("[jidokaan-security] notification unavailable"));
}
