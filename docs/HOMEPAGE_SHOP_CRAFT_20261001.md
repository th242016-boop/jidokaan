# 홈페이지 샵·제작 사진 인수인계 (2026-10-01)

## 요청과 표시 위치

- PC 주요 메뉴의 첫 번째에 `샵`, 모바일 펼침 메뉴의 첫 번째에 `샵 · 전체 상품`을 표시한다. 기존 `/shop` 전체 상품 페이지로 연결한다.
- 메인의 제작 안내(`/#atelier`) 안에 기존 MADE IN KOREA 로고와 문구를 유지하고, 실제 제작 사진 4장과 소개를 추가했다.
- 소개: **숙련된 손으로, 한 켤레씩 정성껏.** 오랜 경험을 쌓아온 숙련 제작자들이 대한민국에서 한 켤레씩 수제로 제작한다는 내용이다. 사진에 없는 경력 연수나 인증은 추가하지 않았다.
- 제작 안내 다음, 질문과 답변 앞의 `/#shop-preview`에 실제 상품 목록과 `전체 상품 보기` 링크를 배치한다.

## 상품 관리

기존 관리자에서 상품 등록·이미지·가격·노출 여부를 관리한다. 홈페이지의 `HomeShop`과 `/shop`은 모두 `useCatalog()`의 `/api/catalog` 응답을 사용하고, `visible === false`인 상품은 표시하지 않는다. 새로운 별도 상품 DB나 복제 목록은 없다. 새 페이지 진입 또는 탭으로 돌아왔을 때 카탈로그를 다시 가져오는 기존 동작을 사용한다.

홈페이지에는 모든 공개 상품을 좌우로 넘기는 목록으로 표시한다. 상품을 누르면 기존 `/products/$productId` 상세페이지로 이동한다. 전체 상품 페이지의 분류·정렬·상품 상세·구매 경로는 기존 기능이다.

`useCatalog`의 기존 API 실패 시 기본 카탈로그 fallback은 변경하지 않았다. API 장애 때 샘플 상품이 나타나는 문제를 향후 수정하려면 홈페이지뿐 아니라 기존 상점 전체의 fallback 정책을 함께 검토해야 한다.

## 제작 사진 원본 대응

사용자가 직접 제공한 사진을 편집 없이 복사했다. 갤러리 카드에서는 CSS `object-fit: cover`로 통일된 프레임 안에 표시하고, 확대 창에서는 전체 이미지를 확인한다.

| 표시 순서 | 첨부 파일 | 저장 파일 | 설명 |
|---|---|---|---|
| 01 | 20261001_162033.jpg | public/homepage/assets/craft-pattern.jpg | 패턴을 옮기고 |
| 02 | 20261001_161957.jpg | public/homepage/assets/craft-panels.jpg | 부위를 맞추고 |
| 03 | 20261001_162530.jpg | public/homepage/assets/craft-upper.jpg | 형태를 다듬고 |
| 04 | 20261001_162927.jpg | public/homepage/assets/craft-sole.jpg | 밑창을 마무리합니다 |

사진은 PC 4열, 태블릿 2열, 휴대폰 좌우 넘김으로 구성한다. 사진 버튼을 누르면 기존 공용 확대 창에 제작 사진을 표시한다. 이전·다음, 방향키, Escape 닫기를 그대로 사용한다. 제작 사진 확대에는 주문 버튼을 표시하지 않는다. 커스텀/스페셜 예시의 확대와 주문·상담 동작은 유지한다.

## 수정 위치

- `src/components/home/page.html`: 메뉴·제작 사진·샵 제목과 마운트 위치.
- `src/components/home/home-shop.tsx`: 실제 상품 목록 React 컴포넌트. `cinematic-home.tsx`가 빈 `[data-home-shop]` 요소에 portal로 렌더링한다. 이 자리에 별도 정적 상품 카드를 추가하지 않는다.
- `src/components/home/craft-copy.js`: 새 문구·사진 설명의 한국어/영어/일본어/중국어/스페인어. `craft-copy.d.ts`는 TS 선언이다. 홈페이지 기존 5개 언어 정책을 유지한다.
- `src/components/home/locale.js`: 공용 번역 적용, 샵/시뮬레이터 진입 링크의 `?lang=` 전달.
- `src/components/home/motion.js`: 제작 사진 넘김·공용 확대 창 연동. 사진 수를 바꾸면 HTML과 언어별 `craftPhotoN` 키를 함께 수정한다.
- `src/components/home/home.css`: 파일 아래쪽 Workshop 주석 이하가 신규 반응형 배치다. 로고 비율과 기존 세로형 스크롤 연출은 유지한다.
- `src/routes/shop.tsx`, `src/components/store/site-shell.tsx`: 샵의 검증된 URL 언어를 기존 `LocaleSync`에 전달한다. 언어 전달은 배송 국가나 통화를 바꾸지 않는다.

## 검증과 범위

`npm run typecheck`, `node scripts/locale-smoke.mjs`, `NITRO_PRESET=node-server npm run build`를 실행한다. 언어 회귀 검증에는 기존 시뮬레이터와 새 샵 링크의 언어·기존 검색 조건·해시 보존을 포함한다.

이번 수정에서 시뮬레이터 디자인 계산, 주문 저장, 관리자 주문 처리, 결제, 배송비, DB 스키마는 수정하지 않았다. 운영 주문이나 테스트 결제를 생성하지 않는다.

확인용 클라우드 브라우저는 로컬 미리보기 주소를 `ERR_BLOCKED_BY_CLIENT`로 차단했다. 코드·빌드·HTTP 응답 검증을 실제 휴대폰의 시각·터치 검증으로 표현하지 않는다.
