# 해외 가격·홍콩 배송 — 2026-11-12

## 확정 범위

기준 main: 6f305f2d30e39203bb4ab08b0a502df3bff20e62. 기존 운영 서비스 jidokaan.com, th242016-boop/jidokaan/main, Railway illustrious-luck/jidokaan/production.

| 구분 | 적용 |
|---|---|
| 일반 장목·중목 | USD250 (이전 USD230) |
| 스페셜오더 | 해외 기본가 USD280, 상담 후 제작 |
| 홍콩 한 켤레 EMS 배송 | USD31 |
| 홍콩 일반 한 켤레 결제 합계 | USD281, 할인/옵션 제외 |
| 국내 복싱화 | 기존 ₩288,000 유지 |
| 기존 주문/진행 중 PayPal 결제 초안 | 저장 금액/디자인/주소 보존 |

스페셜은 별도 공개 판매상품이나 직접 결제 경로가 현재 없다. homepage special-copy.js 및 한국어 page.html의 컬렉션/제작 안내에 기본가를 표시한다. 비공개 special simulator는 관리자·유효 공유링크 권한 및 시안 저장 방식 그대로다. 향후 직접 결제 개발 시 USD280 가격과 스페셜 디자인 snapshot 검증을 별도로 연결해야 하며 이번 작업을 그 기능의 완성으로 설명하지 않는다.

## 홍콩 근거

- 박스410×310×150mm = 41×31×15cm. 실제≤1.5kg, 부피중량41×31×15/6000=3.1775kg로 3.5kg 구간 적용.
- 공식 비서류 표 HK3.5kg ₩35,000. 표 금액에 추가운송수수료가 이미 포함되어 이중 가산 금지.
- https://ems.epost.go.kr/front.EmsDeliveryDelivery02.postal?paper=N
- https://www.koreapost.go.kr/kpost/subIndex/239.do
- https://ems.epost.go.kr/front.EmsApplyGetDeliveryNation.postal
- https://ems.epost.go.kr/front.EmsDeliveryDelivery01.postal
- 홍콩 우편번호 미사용: UPU Addressing and Postcode Manual. 가짜 중국 우편번호를 만들지 않는다.
- 2026-11-12 확인. 방문수거 미사용, 직접 창구 반입. 스마트접수 할인은 고객 요금 산정에 미반영.
- 기존 환산 기준(실시간 환율 아님)1350원/USD, FX buffer5%, 정산차감 대비8%, 운임 여유3%, 1달러 올림:
  ceil(35000×1.03/(1350×0.95×0.92)) = USD31.
- 여러 켤레는 기존 한 켤레/상자 방식. 실측·추가서비스는 실제 발송 시 확인.
- 다른 국가 운임과 미국 관세 고지/후속 정산 방식은 변경하지 않음.

## 구현

1. products.ts의 두 seed 제품 해외 가격과 USD230 설명만 변경.
2. migrations/0013_overseas_shoe_prices.sql은 catalog_products 두 ID의 현재 가격23000인 행만25000으로 변경. description locale 문자열의 정확한 USD230 토큰만 치환. 다른 필드·국내가·상품·주문 미수정.
3. 변경 전 두 행을 site_settings key overseas_shoe_prices_backup_20261112_v1에 최초1회 보존. 마이그레이션 자체는 _migrations로1회 적용. 재실행 및 이후 관리자 가격 변경을 덮어쓰지 않음.
4. ems-rates.ts HK35000; i18n.ts HK+9개언어 국가명; phone.ts +852; shipping.ts HK Asia 및 기존 설정 HK 누락 시만 추가. EMS_POLICY 버전을 전역 변경하지 않음.
5. address-requirements.ts 공통 규칙: AE/HK만 우편번호 선택. checkout UI, 서버 quoteCheckout, EMS 준비 검증에서 동일 사용.
6. 기존 특별 시뮬레이터·회원·결제 인증·상품 디자인 변경 없음.

## 검증

- node --experimental-vm-modules scripts/hong-kong-shipping-test.mjs → 7그룹 PASS.
  HK/+852, 35000→31,3켤레93, 기존요금·최소액·FX보존,1250원기준33, 기존HK수동요금보존, 서버USD281/562, HK빈우편번호허용, AE유지, SG필수/TW미지원, EMS필수정보기타검증유지.
- node scripts/overseas-price-migration-test.mjs → PGlite 격리 PostgreSQL 엔진5그룹 PASS.
  두상품만인상,필드보존,원본백업,과거주문·진행중결제초안·배송설정보존,재실행no-op,미래관리자가격보존.
  개발 환경에 PGlite가 없으면 JIDOKAAN_PGLITE_TEST_MODULE로 별도 설치 경로를 지정할 수 있음. 패키지 파일을 변경하지 않음.
- 실제 고객 결제/PayPal 승인/알림/우체국 접수는 실행하지 않음.
- 배포 후 관리자 두 상품 USD250 및국내가, 고객 홍콩 선택/배송31/합계281, special280안내를 실화면 검증할 것. 실행 완료 기록은 기존 Drive 인수인계 파일에 이어서 남김.

## 복구

코드 되돌림만으로 이미 적용한 상품DB값이 자동 복구되지는 않는다. 두 상품을 관리자에서USD230으로 되돌리거나 백업의 priceUsd/description 필드만 검토·복원한다. 이후 관리자 편집까지 전체 data로 덮어쓰지 않는다. 과거 주문은 복구대상이 아니며 절대 재가격 계산하지 않는다. _migrations 기록 삭제 또는 전체DB초기화 금지.

