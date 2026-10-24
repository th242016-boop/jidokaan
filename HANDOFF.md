# 지도칸 JIDOKAAN — 작업 인수인계

브랜드 사이트 + 2D 실사 커스텀 시뮬레이터입니다.  
도메인: jidokaan.com  
기존 2D 참고: https://jidokaan-custom.netlify.app/

## 로컬에서 다시 열기

```bash
unzip jidokaan-handoff.zip
cd jidokaan-handoff
npm install
npm run dev
```

브라우저에서 개발 서버 주소를 엽니다. 커스텀은 `/customize`.

```bash
npm run build      # 배포용 빌드
npm run typecheck
```

스택: React 19, TypeScript, Vite, TanStack Start/Router, Tailwind v4, zustand.

## 다른 AI / 에디터에서 이어가기

이 zip 전체를 새 채팅에 올리거나 Cursor / VS Code / Claude / ChatGPT / Grok에 넣고 아래를 붙여 넣으면 됩니다.

> 이건 지도칸(JIDOKAAN) 커스텀 복싱화 사이트다.
> `/customize` 가 실사 2D 시뮬레이터다.
> 베이스는 `public/simulator/photo/base.jpg` (올화이트).
> 부위 마스크는 `public/simulator/photo/{a,b,c,i}.png`.
> 색상 PNG는 `public/simulator/photo/tints/{part}-{color}.png`.
> 시뮬레이터 코드: `src/components/customizer/layer-simulator.tsx`
> 팔레트/부위 정의: `src/lib/simulator-config.ts`
> 나머지 부위 d,e,f,g,h,j,k 마스크를 같은 방식으로 추가하면 된다.
> A·K는 흰색/검정만, 끈은 A와 같은 색.

## 시뮬레이터 현재 상태

| 항목 | 상태 |
|---|---|
| 베이스 사진 | 올화이트 (`public/simulator/photo/base.jpg`) |
| 적용된 부위 | A 메쉬, B 토, C 힐 쉐브론, I 방패 |
| 미적용 부위 | D E F G H J K — 같은 사진에서 위치 그대로 딴 PNG 필요 |
| 색상 | 빨주노초파남보 / 흰검 / 골드실버 / 민트핑크스카이그레이 |
| A | 흰색·검정만 |
| 끈 | A와 동일 색 (기존 규칙) |
| 3D | 포기. 2D 실사 레이어만 사용 |

새 부위 넣는 방법:

1. 베이스와 **같은 캔버스 크기**(1424×1392), 위치 이동 없이 PNG
2. `public/simulator/photo/{id}.png` 로 저장
3. `src/lib/simulator-config.ts` 의 `READY_PARTS` 에 id 추가
4. 흰 조각으로 색 PNG를 만들어 `public/simulator/photo/tints/` 에 넣기

## 사이트 구성

- `/` 메인 (히어로, 국가/언어, 브랜드)
- `/customize` 커스텀 스튜디오
- `/shop` `/products/:id` `/checkout` 주문 흐름 (카페24 PG 연동은 아직)

사업자 정보는 푸터에 있음.  
언어: 접속 국가에 맞게, 국기 클릭 시 해당 언어.  
결제 표시: 한국=원, 그 외=달러.

## 포함하지 않은 것

`node_modules` 는 용량 때문에 빠졌습니다. `npm install` 하면 다시 생깁니다.

---

## 2026-10-24 추가 이력 — 해외 주문·EMS 발송 관리

**위 본문은 초기 제작 당시 기록으로 보존한 것이다. 현재 시뮬레이터의 완료 범위나 결제 연동 상태를 위 내용만으로 판단하지 않는다.** 최신 작업은 Git 이력, `docs/ORDER_OPERATIONS_20260930.md`, `docs/INQUIRY_SUPPORT.md`, `docs/TELEGRAM_ORDER_ALERTS_20261006.md`와 소재별 후속 문서를 확인한다. EMS 주문 관리의 최신 기준은 [docs/ems-admin.md](docs/ems-admin.md)다. 기존 주문 운영 문서의 단순 송장 입력/상태 변경 순서는 EMS 새 흐름으로 대체하며 과거 설명은 이력으로 남긴다.

이번 작업 기준 소스는 `353d721b32bbb23ff65bac98c36e84696b2d0e59`이며 2026-10-23 전 색상 리자드 수정까지 포함한다. 메인 디자인·시뮬레이터·고객 결제 흐름·기존 데이터는 보존하고 주문/배송 관리만 확장한다.

- 기본 주문 탭: 전체 / 신규주문 / 발송준비 / 배송중 / 배송완료. 미결제·취소는 예외, 구매확정·반품·교환은 이력으로 유지.
- 발송 준비 → EMS 정보 확인 → 스마트접수에서 수동 신청 → 우편물번호·접수 결과 저장 → 우체국 제출 대기 → 실제 창구 인계 후 발송 → 배송중 → 실제 배달완료 근거 확인.
- 한 주문 여러 소포를 저장하며 전부 실제 배달돼야 주문 전체 완료. 통관 지연·배달 실패·반송·조회불가는 완료와 구분.
- 자동 접수는 아직 연결하지 않았다. 공식 TXT 내보내기와 스마트접수 링크를 실제 API 연동으로 설명하지 않는다.
- 배송조회 어댑터는 기본 비활성이다. 계약 접수 API와 무료 공공 배송조회 API의 승인/키는 별도이며, 계약 접수 API의 창구 직접 반입 지원은 미확인이다. 정기 조회 스케줄러도 별도 작업이다.
- 새 계약·결제·키 생성·상시 접근 설정 및 실제 고객정보 전송/접수 시험은 해당 대상을 제시하고 사용자 승인 후 수행한다.
- 과거 완료 주문, 원본 결제/디자인 정보와 클레임 이력을 지우거나 임의로 재작성하지 않는다. EMS 편집은 버전 비교 저장과 중복 송장 방지를 거친다.
- 2026-10-24 복구 소스에서 EMS 32개, 기존 주문 28개, 배송조회 XML 28개, Telegram 10개, 디자인 미리보기 8개 검증 그룹 및 생산 빌드가 통과했다. 모두 모의 시험이며 실제 고객 전송·우체국 접수·결제·알림 발송 시험은 아니다.
- 로컬 브라우저 URL이 정책에서 거부되어 실제 화면 QA/캡처는 아직 수행하지 못했다. 우회하지 않았으며, 운영 배포 후 읽기 전용 화면 검증을 별도 기록한다.
- 최종 시험 수치·화면 캡처·구현 커밋·Railway 배포 결과는 `docs/ems-admin.md`의 마지막 검증 이력을 확인한다. **현재 추가 문서 작성 단계에서는 운영 반영을 확정하지 않았다.**

Railway 연결이 여러 개면 프로젝트 목록 조회가 실제 성공하는 연결을 사용한다. 확인한 정상 연결에서 `illustrious-luck`의 `jidokaan`과 `Postgres`가 live였으며, 인증이 실패하는 다른 연결을 반복하거나 연결 전체를 삭제하지 않는다. 자격증명은 인수인계 문서에 기록하지 않는다.

- 운영 반영 확인: 2026-10-24 구현 `28e3986`, Railway `d99a5f51-c0db-47df-a86a-179ffeab5fb6` SUCCESS. 실제 관리자 5개 탭·기존 신규주문 2건·개별 준비 버튼 확인. 우체국 자동접수/실조회는 미연결이며 상세 제한은 `docs/ems-admin.md` 참조.


### 2026-10-24 발송 기록 입력 개선

이미 우체국에 맡긴 소포는 새 접수용 주소·HS 코드·무게를 다시 채우지 않고, 실제 송장번호와 창구 인계 확인만으로 `record_posted`를 통해 배송중으로 기록한다. 메모는 선택이다. 기존 신규 접수 경로와 미결제·중복·완료 보호는 유지한다. EMS 41개 및 주문 28개 모의 검증·타입 검사·생산 빌드 통과. 상세는 `docs/ems-admin.md` 마지막 추가 이력 참조. 운영 적용·실화면 검증 결과는 동일 Drive 인수인계 TXT 후속 기록에 별도 남긴다.
