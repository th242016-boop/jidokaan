# 지도칸 최종 통합본 — 실행 인수인계
2026-11-17 한국시간. 기존 운영본+승인 V17 통합 및 고객검증 보완·변경 범위 검증 완료. 운영 미배포. 사용자는 실제 배포를 금지했으며, 이후 발견사항 전부 수정과 할인쿠폰 입력란 제거를 지시했다.

## 시작점·소스
이 문서와 RELEASE.json만 먼저 읽는다. 정확한 최종 commit·패키지·검증 상태는 RELEASE.json 및 아래 최신 핵심 문서가 기준이다. 완료한 통합을 다시 하거나 전체 이력을 재독하지 않는다.
https://drive.google.com/file/d/1dwPmzgxLw99WwIdHQTZjd_-OrFU9F5DY/view

- 운영 기반: https://github.com/th242016-boop/jidokaan / main / a280a93df3555ce2dfd719193ec6f6a9a1590ca5.
- 승인 V17 앱 소스: 08bd2cdbc051211c99f82fd151c8ddcfab9be9d8. Sites project appgprj_6af7dedaeae081919efb9ac7321f0317의 app-source/.
- 통합 작업 브랜치: review/final-integration-20261117. 패키지 source/와 source-delta.bundle은 동일 commit의 실제 소스다. runtime/은 운영 빌드, review/는 API·거래 차단 화면 검토본이다. review/를 운영에 복사하지 않는다.
- 과거 PayPal 복구는 저장 금액·통화가 기준이다. 저장 초안·주문이 모두 없으면 현재 가격으로 재생성하지 않는다. 예시 주문 객체는 검토 빌드에만 포함한다.

## 최종 화면·판매 정책
- 모든 국가 동일한 구매 우선 홈. PC는 큰 신발 배경 위 주문 영역, 모바일은 주문 영역 아래 전체폭 사진. 언어16개와 배송국가 선택은 별개다.
- 판매12국: KR US CA AU HK JP SG TH PH GB CH MX. CN 판매 제외, 홍콩·중국어 유지.
- KR 기본288,000/스페셜318,000원(복싱화 무료배송). JP 기본37,000/스페셜41,500엔+배송6,000엔/켤레. 기타 지원국 기본250/스페셜280달러, 멕시코 배송60달러. 나머지 기존 확정 국가별 요금·액세서리/혼합 주문 별도견적 유지.
- 제작 평균15~21일. 국제 운송·통관·관부가세 별도. 해외 교환·반품 불가, 주문 후12시간 이내 취소 요청·환불 시 총결제금액5% 공제. 아웃솔 교체65,000원.
- 국내 디자인 캡처→네이버 주문→담당자 톡톡 연락. 해외 스페셜은 Instagram @jidokaan DM 사전상담.
- 공개 스페셜 가격 등급과 비공개 특수소재 권한은 별개. 장/중목·A 블루레오파드·밝은 아이보리·끈/비즈 독립상태 유지. 상품 원문·사진·상세이미지 임의변경 금지.

## 이번 고객검증 보완
- 사용자 지시대로 새 주문의 할인쿠폰 입력·적용 UI를 제거했다. 과거 주문의 실제 할인 기록과 서버·관리자 쿠폰 기능은 보존한다.
- 국내 안내 글자 대비를 높이고, KR 주문에서는 불필요한 해외 연락처·주소 폼을 숨겨 네이버 이동과 상품 요약에 집중한다.
- 시뮬레이터에 기존 장바구니를 연결하고, 짧은 화면·장바구니 하단 영역의 스크롤을 보완했다. 크기/핏 등 선택상태, 확대창 초점·Escape·제목, 조작 레이블과 터치 영역을 보완했다.
- 미완성 주문 입력을 탭의 sessionStorage에 보존한다. 언어·국가 변경 시 입력 유지와 재동의 처리, 모바일 단계 복귀, 기존 US/CA 지역명 정규화를 보완했다. 결제카드·인증정보는 저장하지 않는다.
- 운영 문의와 검토 문의가 같은 번역을 사용하도록 통일하고, 로그인·가입·해외 로그인 안내·메뉴 조작·브랜드 본문을16개 선택언어로 보완했다. 원본 상세이미지 안의 글자·관리자가 별도 작성한 원문은 자동 번역 대상이 아니다.
- 주문 후 요청사유 입력칸의 글자 대비와 레이블을 보완했다. 기존 운영 주문·회원·결제·배송 데이터를 변경하지 않았다.

## 구조·보존
- Node22.14.0, React19/TypeScript/TanStack Start·Router/Vite/Nitro. 기존 Railway→jidokaan.com, PostgreSQL·키·계정·도메인 유지.
- 홈 src/components/home/; 상품 src/routes/products/$productId.tsx; 디자인 src/routes/customize.tsx와 src/components/customizer/layer-simulator.tsx; 주문 src/routes/checkout.tsx 및 src/lib/{checkout-quote,paypal-checkout,orders}.server.ts; 관리자 src/components/admin/.
- 기존 public/344개, src/lib/special-assets/ 보호소재52개, migration13개 보존. 인증·catalog DB·Telegram·EMS 서버 핵심 보존. 새0014는 이메일 outbox 테이블/인덱스 추가만 한다. 이메일 발송 기본 비활성, 임의 활성화·과거 소급발송 금지.
- 운영 catalog_products/site_settings/store_orders/paypal_checkout_drafts/media_files와 업로드 디스크는 코드 백업과 별개다. 운영 데이터를 fixture로 바꾸지 않는다. 키·복호화 소재를 공개하지 않는다.
- EMS 실제 접수·자동배송조회 연동 완료로 간주하지 않는다. 기존 수동접수·수동완료 유지. DATABASE_URL 없는 개발실행은 기존 운영 프록시로 연결될 수 있어 별도 DB·외부호출 차단이 필요하다.

## 검증 상태·다음 실행
- 이전 통합본: 타입검사+27스크립트·별도 보존7묶음·두 빌드 통과. 추가 고객QA의 발견사항을 이번에 보완했다. 이전 통과 결과를 수정 후 전체 검증으로 대체하지 않는다.
- 이번 변경: 타입검사+관련 회귀10묶음+운영/검토 빌드 통과. 별도 입력초안7검사·번역3묶음·상태8검사 통과. PC의 KR 입력칸/쿠폰 제거, 장바구니·확대창 Escape/초점,390px US 입력유지·검토단계·일본어/국가전환,360×640·667×375 하단 접근,320px 홈 가로넘침 없음 확인. 브라우저 뒤로가기는 라우터 히스토리 검사 통과; iframe 브라우저 제어와 실제 기기 검증은 별개다.
- 실결제는 사용자 지시에 따라 정상 가정·미실행. 실제 PayPal/JPY 수취·외부 인증·고객 알림·실제 휴대폰 검증과 구분한다. 정적 카탈로그는11월15일 공개 스냅샷이며 운영 DB의 대체물이 아니다.
- Railway project1304a610-3beb-40a2-b56b-438bdb7d9806 / service f2eb731c-73c6-402c-ac0d-7d1f231342dc / environment ff6dc219-cb7e-4f5a-8146-63c1f8a4e1a5.
- 마지막 확인 운영 deployment321cca04-a9a8-42a9-90a5-77183cb24d44 / SHA a280a93. GitHub main push·운영 배포 없음.
- 배포 지시 후: RELEASE.json/SHA256SUMS 검증→기존 GitHub checkout에 bundle 적용·최종commit 확인→업로드 인증 확보→현재 운영 SHA와 DB·미디어 복구 경로 확인→확정 소스 그대로 배포한다. 운영이 변경됐다면 그 차이만 검토한다. 인증 준비 완료로 가정하지 않는다.
- 빌드 npm ci 후 NITRO_PRESET=node-server npm run build. 시작 npm run db:migrate && npm start, 실행파일 .output/server/index.mjs. 기존 DB를 초기화하지 않는다. 배포 성공ID와 실제 PC/모바일·가격·관리/주문 조회를 확인한다.

## 기록 규칙
핵심 문서는6,000자 이내 최신 상태로 교체한다. 과정은 별도 이력에 보관하고 소스·로그·약5MB 국가JSON을 채팅에 출력하지 않는다. 같은 코드의 통과 검사를 이유 없이 반복하지 않는다. 단계별commit/접수/성공/다음 행동만 갱신한다. 문맥 부담을 줄이는 방식이며 ChatGPT 길이 제한 자체를 제거하는 것은 아니다.
