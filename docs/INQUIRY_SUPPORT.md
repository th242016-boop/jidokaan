# 문의 · 답변 운영 안내 (2026-10-20)

## 관리자가 사용하는 방법

1. 관리자 → **문의관리**에서 문의를 선택한다. 텔레그램의 ‘관리자에서 확인’도 해당 문의로 연결된다. 로그인이 필요하다.
2. 원문과 추가 문의, 기존 답변을 읽고 **답변 작성**에 내용을 입력한다.
3. **사이트에 답변 게시**를 선택하면 고객의 비공개 전용 링크에서 답변을 볼 수 있다. 이메일 발송 서비스가 연결된 경우 **이메일로도 보내기**를 함께 선택할 수 있다. 이메일만 선택하는 것도 가능하다.
4. ‘사이트 답변 등록’ 또는 ‘답변 등록 및 이메일 발송’을 누른다. 답변은 입력한 언어 그대로 저장·발송된다. 자동 번역하지 않는다.
5. 이메일은 ‘발송 대기 / 발송 접수·수신 미확인 / 발송 실패·확인 필요’를 구분한다. 새로고침으로 최신 상태를 확인한다. 발송 접수는 고객 메일함 도착을 보장하는 표시가 아니다.
6. 자동 이메일이 연결되지 않았으면 사이트에 먼저 답변하고, **메일 앱에서 보내기** 또는 **이메일 내용 복사**로 직접 메일을 보낼 수 있다. 메일 앱에서는 실제로 ‘보내기’를 눌러야 하며 이 수동 전송은 사이트에서 발송 완료로 기록하지 않는다.
7. 기존 문의 고객은 아직 전용 링크를 모른다. **고객 전용 링크 복사**로 가져와 해당 고객의 이메일로 안내한다. 공개 게시판 등에 올리지 않는다.

- 새 고객 문의와 고객의 추가 질문은 기존 `@jidokaan_bot` 수신 계정으로 알림이 간다. 정상 상태에서는 약 30초 주기로 발송한다.
- 기존 미처리 문의는 유지하지만 배포 직후 과거 문의 알림을 일괄 재전송하지 않는다.
- 주문·문의 알림은 기존 연결 및 일시 중지 설정을 공유한다. 문의관리 아래 ‘최근 문의 알림 상태’에서 전송 상태를 볼 수 있다.
- 고객 추가 질문은 문의를 다시 **답변 대기**로 바꾼다. 답변 없이 처리완료로 표시하는 버튼은 고객에게 아무 메시지도 보내지 않는다.

## 고객 화면

`/contact`에서 문의를 접수하면 개인 전용 링크가 나온다. 이 링크로 답변을 보고 추가 질문을 남긴다. 링크는 현재 브라우저에 최근 10개까지 저장되며 삭제할 수 있다. 공용 기기에서는 저장된 링크를 지우도록 안내한다. 링크는 비밀번호처럼 취급해야 한다.

- 이름·이메일·문의 내용을 검증하고 접수 실패를 성공으로 표시하지 않는다.
- 문의번호나 이메일 주소만으로는 내용을 조회할 수 없다. 256비트 무작위 키가 필요하다.
- 키는 URL fragment(`#`)에 있어 HTTP URL/일반 접근 로그/리퍼러에 포함되지 않는다. 실제 조회는 POST 본문으로 전달한다. API 응답은 `Cache-Control: no-store`이다.
- 한국어, 영어, 일본어, 중국어, 스페인어 UI를 제공한다. 기타 사이트 언어는 영어로 안내한다. 고객의 언어 선택은 새 문의에 저장한다.
- 이메일로 고객이 회신한 내용은 사이트 대화로 자동 수집하지 않는다. 이메일 회신은 `INQUIRY_EMAIL_REPLY_TO` 주소로 받고, 사이트 대화는 전용 페이지의 추가 문의를 사용한다.

## 이메일 자동 발송 연결 — 아직 운영 환경에 미설정

기존 운영 서버에는 이메일 발송 자격 증명이 없었다. 기능은 Resend HTTPS API를 사용하도록 준비했으며, 연결 전에는 자동 발송을 선택할 수 없다. 이 상태에서 사이트 답변과 직접 이메일 보내기는 사용 가능하다.

1. 소유자가 사용하는 Resend 계정에서 발신 도메인(예: `jidokaan.com`의 발신용 하위 도메인)을 등록하고, 서비스가 제시하는 DNS 인증 레코드를 DNS 관리 화면에 추가한다. 임의로 기존 MX를 바꾸지 않는다.
2. 도메인 인증 뒤 해당 도메인 발신용 API 키를 생성한다. 키는 채팅·소스·문서에 적지 않고 Railway 서비스 Variables에 직접 입력한다.
3. Railway `illustrious-luck` 프로젝트 / `production` 환경 / `jidokaan` 서비스에 설정:
   - `RESEND_API_KEY`: 발송용 비밀 키
   - `INQUIRY_EMAIL_FROM`: 인증한 발신 주소. 예: `JIDOKAAN <support@인증한-도메인>`
   - `INQUIRY_EMAIL_REPLY_TO`: 고객이 메일에서 답장할 수신 주소. 미설정 시 기존 고객센터 `th242016@naver.com` 사용.
4. 재배포 후 관리자 문의관리에서 이메일 설정 상태를 확인한다. 소유자 본인의 테스트 문의에 답변하여 실제 수신함/스팸함 도착까지 확인한다. 설정 존재 표시만으로 발송 인증 성공을 단정하지 않는다.
5. 연결 전 작성했던 사이트 답변을 자동으로 일괄 발송하지 않는다. 필요한 문의에 새 답변을 작성하고 이메일 옵션을 선택한다.

공식 참고:
- https://resend.com/docs/api-reference/emails/send-email
- https://resend.com/docs/dashboard/emails/idempotency-keys

## 구현과 데이터

- `migrations/0011_inquiry_replies.sql`: 기존 `store_inbox` 보존. `inbox_access`, `inbox_messages`, `inbox_rate_limits`, `telegram_inbox_outbox` 추가. 기존 주문 테이블 및 텔레그램 설정 값은 변경하지 않는다.
- `src/lib/inbox.server.ts`: 문의 접수, 인증된 관리자 조회/답변, 고객 전용 조회/추가 질문, DB 속도 제한. 신규 접수·키·알림 이벤트는 한 SQL 문으로 원자적으로 기록한다. 관리자 토큰을 확인한 뒤에만 답변을 저장한다.
- `src/routes/api/inbox.ts`: Bearer 관리자 인증, 입력 스키마, 24KB 본문 제한, 일반화된 오류 응답. production proxy로 전달하지 않는다.
- `src/lib/inbox-notifications.server.ts`: 영속적인 발송 큐, 90초 DB lease, 재시도. 기존 주문 worker와 독립적으로 실행한다. 텔레그램 비밀·고객 본문/이메일은 알림 및 로그에 넣지 않는다.
- `src/lib/telegram-orders.server.ts`: 기존 봇 검증·수신자 확인을 재사용하는 `sendConnectedTelegram` 함수만 추가. 주문 발송 처리/페어링 로직은 유지한다.
- `src/server-plugins/order-notifications.ts`: 문의 worker 시작/종료 등록.
- `src/components/admin/inbox-board.tsx`: 목록 50건 단위 페이지, 전체 대화, 채널 선택, 수동 메일 안내, 알림 상태.
- `src/routes/admin.tsx`: `?p=inbox&inquiry=...` 인증된 문의 직접 열기.
- `src/routes/contact.tsx`: 고객 문의/비공개 대화 화면.
- `src/lib/inbox-copy.ts`: 5개 언어 UI 및 이메일 안내 문구. 답변 내용 자동 번역 아님.
- `src/lib/orders.server.ts`: 이전 inbox 함수 이름은 새 모듈에서 재수출해 호환한다. 주문/결제 구현은 바꾸지 않는다.

이메일 요청은 저장한 동일 본문과 `inquiry-reply-{messageId}` idempotency key로 재시도한다. provider 키 보관 기간(24시간) 전에 23시간 경과 시 자동 재전송을 중단한다. 최대 8회 시도 또는 영구적 4xx 오류 후 실패로 표시한다. 실패/수신 불명확 상태에서 직접 재전송하기 전 provider 내역을 확인해 중복을 피한다. 텔레그램은 네트워크 수락 후 DB 기록 이전에 프로세스가 중단되면 드물게 중복될 수 있다.

## 검증과 복구

실제 고객·실제 주문·실제 Telegram/이메일 수신자에게 테스트 메시지를 보내지 않는다.

- `npm run typecheck`
- `node scripts/inbox-smoke.mjs`: 임시 PGlite + 가짜 provider로 인증/비밀 링크/기존 문의/멱등성/전송 실패/추가 문의/속도 제한 검증.
- `node scripts/telegram-orders-smoke.mjs`: 기존 주문 알림 회귀 검증.
- `node scripts/order-smoke.mjs`: 주문·결제 회귀 검증.
- `NITRO_PRESET=node-server npm run build`
- `scripts/inbox-browser-smoke.mjs`: 같은 프로세스의 임시 로컬 서버/DB에서 고객·관리자 화면을 확인한다. 외부 브라우저 요청은 차단한다. `INBOX_TEST_CHROMIUM`으로 로컬 Chromium 경로를 지정할 수 있다. 로컬 빌드 PGlite만 사용하려면 배포 산출물 `_libs`에 `node_modules/@electric-sql/pglite/dist/{pglite.data,pglite.wasm,initdb.wasm}` 파일이 필요하다. 실제 Railway는 기존 PostgreSQL을 사용하므로 이 테스트용 파일 복사가 필요 없다.

배포는 GitHub main의 정확한 커밋을 확인하고 Railway SUCCESS를 확인한다. 이상이 있으면 직전 앱 배포로 되돌리되 새로운 문의/답변 테이블을 삭제하지 않는다. 이미 저장된 답변과 문의 링크 보존이 우선이다. 주문, 결제, 시뮬레이터, 주문 알림 설정은 별도로 변경하지 않는다.
