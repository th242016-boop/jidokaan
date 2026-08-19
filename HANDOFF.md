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
