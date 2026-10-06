# 지도칸 주문 알림 인수인계 · 2026-10-06

## 연결
- BotFather에서 사용자가 만든 봇: `@jidokaan_bot`.
- Railway **jidokaan / production** 서비스 Variables에 `TELEGRAM_BOT_TOKEN`을 등록하고 배포한다. 토큰은 채팅, Git, DB, 클라이언트에 저장하지 않는다.
- `/admin?p=notifications`에서 기존 관리자 로그인 → 내 텔레그램 연결 → 생성된 Telegram 링크 열기 → 시작 → 관리자에서 연결 확인 → 테스트 알림 보내기.
- `TELEGRAM_CHAT_ID` 입력은 필요 없다. 관리자에게만 발급한 일회용 코드(10분)와 개인 대화의 `/start CODE`를 대조하여 수신자를 확정한다. 다른 사용자, 그룹, 봇 메시지를 자동 선택하지 않는다.
- API 토큰 발급·등록과 실제 휴대폰 수신 확인 전에는 연결 완료라고 보고하지 않는다.

## 발송 범위
- 지도칸 DB에 실제 저장된 신규 주문. PayPal 결제 검증 및 저장 흐름은 그대로 유지한다.
- 입금 대기는 미결제로 표시. 첫 연결 시각 이후 주문만 발송하며 기존 주문은 소급 발송하지 않는다.
- 30초 간격, 한 번에 1건 발송. 일시 중지/서버 중단 중 주문은 재개 후 순서대로 처리한다.
- 네이버스토어 주문, 결제 실패/이탈, 미저장 PayPal 결제는 대상이 아니다. 기존 관리자 결제 복구로 주문을 저장하면 신규 알림 대상이다.
- 이 기능은 기존 주문의 입금 확인/배송 상태 변경을 추가 통지하지 않는다.
- 알림: 주문번호, 상태, 국가, 주문액, 상품/모델/사이즈/수량, 관리자 상세 링크. 주소·전화·이메일·결제 식별번호·디자인 원본은 보내지 않는다.

## 구현
- `migrations/0010_telegram_order_notifications.sql`: 연결 설정과 영구 outbox. 기존 테이블/주문 구조 변경 없음.
- `src/lib/telegram-orders.server.ts`: 관리자 세션 검증, 봇 identity 검사, pairing, 테스트, DB 발견/전송/재시도.
- `src/lib/order-notification.ts`: 개인정보를 최소화한 일반 텍스트와 링크.
- `src/server-plugins/order-notifications.ts`: Nitro Node 런타임 시작/종료 훅. vite.config.ts에 명시적으로 등록.
- `src/routes/api/order-notifications.ts`: Bearer 관리자 세션만 허용, 서버 비밀 반환 없음, preview→production 프록시 없음.
- `src/components/admin/order-notifications.tsx`: 관리자 판매관리 → 주문 알림.
- `/admin?p=orders&order=JDK-...`: 관리자 로그인 후 상세 자동 열기. 최근 200건 밖의 주문도 세션 검증 후 개별 조회.

## 신뢰성과 한계
- 주문 저장 경로에서 Telegram을 호출하지 않는다. Telegram 장애가 결제/주문 접수를 실패시키지 않는다.
- DB를 주기적으로 조회하므로 재시작 직전 주문도 복구 가능. order_id PK와 행 잠금/90초 lease로 일반적인 중복 실행 방지.
- 재시도는 30초부터 지수 증가하여 최대 1시간, Telegram Retry-After가 더 길면 준수. 무제한 재시도, 최근 10건 상태 관리자에서 확인.
- Telegram 성공 직후 DB 기록 전에 프로세스가 죽거나 응답이 유실되는 극히 좁은 구간에는 동일 주문 알림이 중복될 수 있다. 외부 메시지 API에 exactly-once/idempotency key가 없으므로 100% 단발 보장이라고 안내하지 않는다. 주문번호가 기준이다.
- 계정 재연결로 수신자를 바꾸면 새로운 수신자의 연결 시각부터 적용. 예전 수신자에게 남은 대기 메시지를 새 수신자에게 넘기지 않는다.
- 봇에 기존 webhook이 있으면 자동 제거하지 않고 BOT_IN_USE로 중단.
- 상시 Node 프로세스인 Railway에서 실행한다. 서버리스/절전 모드로 옮길 때는 외부 스케줄러/worker 필요. 알림을 위해 별도 Railway 서비스나 유료 자동화 서비스를 만들지 않는다.

## 검증
`node scripts/telegram-orders-smoke.mjs`: 임시 DB + 가짜 Telegram 응답. 인증, 개인 수신자 검증, webhook 보존, 중복/실패/대기주문/재시도/재시작/일시중지/이전주문 제외.

`node scripts/order-smoke.mjs`, `npm run typecheck`, `NITRO_PRESET=node-server npm run build`.

로컬 테스트 시 실제 환경변수/주문/PayPal/Telegram 호출 금지. 프로덕션 운영 검증은 명시적 테스트 알림 버튼을 사용하고, 실제 결제는 하지 않는다.
