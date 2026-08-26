export type InfoRow = { label: string; value: string; href?: string };
export type StoreNotice = { enabled: boolean; text: string };

export const DEFAULT_NOTICE: StoreNotice = {
  enabled: true,
  text: "임시사이트로 현재 주문 불가합니다. 시뮬레이터는 이용 가능합니다",
};

export const DEFAULT_COMPANY: InfoRow[] = [
  { label: "상호명", value: "지도칸" },
  { label: "대표자명", value: "최태훈" },
  { label: "사업장 주소", value: "04782 서울특별시 성동구 성수이로18길 36 주동2층" },
  { label: "대표전화", value: "010 3481 5598", href: "tel:01034815598" },
  { label: "사업자 등록번호", value: "207 18 73695" },
  { label: "통신판매업 신고번호", value: "2018서울성동0927호" },
];

export const DEFAULT_SUPPORT: InfoRow[] = [
  { label: "상담 이메일", value: "th242016@naver.com", href: "mailto:th242016@naver.com" },
  { label: "상담전화", value: "010 3481 5598", href: "tel:01034815598" },
  { label: "CS운영시간", value: "오전 10시~오후 5시 (월~금)" },
  { label: "토요일 및 공휴일", value: "상담불가" },
];
