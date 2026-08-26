export function GuideManual() {
  return (
    <article className="prose-admin max-w-3xl space-y-6 rounded border border-[#d5d7dc] bg-white p-5 text-sm leading-relaxed text-[#222] sm:p-8">
      <header>
        <p className="text-xs font-semibold tracking-wide text-[#666]">JIDOKAAN</p>
        <h2 className="mt-1 text-2xl font-semibold">스토어 사용설명서</h2>
        <p className="mt-2 text-[#444]">
          상품·주문·쿠폰·회사정보는 이 관리자에서만 하시면 됩니다. 일상 운영에 저를 부르지 않아도 됩니다.
        </p>
      </header>

      <section>
        <h3 className="text-base font-semibold">1. 로그인 · 비밀번호</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>쇼핑몰 맨 아래 <b>관리자</b>를 누릅니다.</li>
          <li>비밀번호 변경은 <b>스토어관리 → 비밀번호</b>에서 합니다. 현재 번호 + 새 번호(8자 이상).</li>
          <li>5번 틀리면 15분 잠깁니다. 로그인 후 12시간이 지나면 다시 넣습니다.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-base font-semibold">2. 상품 올리기</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>상품관리 → 상품등록</li>
          <li>분류는 <b>의류 / 신발 / 기타</b>만 고릅니다. 소분류는 없습니다.</li>
          <li>상품명, 판매가(원·달러) 필수. 사진은 큰 박스를 누르거나 끌어다 놓기.</li>
          <li>커스텀 시뮬레이터로 팔 신발은 「커스텀 연결」에 체크.</li>
        </ol>
      </section>

      <section>
        <h3 className="text-base font-semibold">3. 진열 순서</h3>
        <p className="mt-2">
          상품목록에서 <b>위·아래</b> 버튼을 누르면 순서가 바로 저장됩니다. 상품을 잡고 끌어 놓아도 바로 저장됩니다. 코드 수정으로 사이트가 다시 올라가도 상품 내용·순서는 덮어쓰지 않습니다.
          순서를 한 번도 안 정하면 <b>최근 등록한 상품이 앞</b>에 옵니다.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold">4. 할인 쿠폰</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>혜택/마케팅 → 혜택등록</li>
          <li>이름, 코드(예: OPEN10), 정액 또는 %, 최소주문, 기간, 첫구매/전체</li>
          <li>혜택 추가 → 혜택 저장</li>
          <li>손님은 결제 화면에서 그 코드를 넣고 「적용」을 누릅니다. 금액이 바로 깎입니다.</li>
        </ol>
      </section>

      <section>
        <h3 className="text-base font-semibold">5. 주문이 들어오면</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>판매관리 → 주문조회</li>
          <li>무통장/해외송금은 <b>입금대기</b>로 들어옵니다. 통장 확인 후 「입금확인」.</li>
          <li>카드(PG 연결 후)는 결제완료 → 상품준비 → 송장 입력 → 발송.</li>
        </ol>
        <p className="mt-2">
          한국은 원화, 그 외 국가는 달러입니다. 배송비는 스토어관리 → 배송비에서 바꿉니다.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold">6. 회사정보·계좌</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>회사정보: 푸터에 나오는 상호·전화</li>
          <li>계좌·결제: 국내 통장, 해외 송금, 토스/페이팔 키</li>
          <li>공지사항: 쇼핑몰 맨 위 띠</li>
        </ul>
      </section>

      <section>
        <h3 className="text-base font-semibold">7. jidokaan.com 에 실제로 올리기</h3>
        <p className="mt-2">
          지금 보고 있는 화면은 작업용 미리보기입니다. 손님에게 jidokaan.com 으로 열려면
          아래를 한 번만 하면 됩니다. 카페24 쇼핑몰 스킨이 아니라, <b>이 사이트 그대로</b>를 올리는 방식입니다.
        </p>
        <ol className="mt-2 list-decimal space-y-2 pl-5">
          <li>
            <b>도메인 현황</b> — jidokaan.com 은 가비아에서 샀고, 네임서버는 카페24입니다.
            카페24 쇼핑몰을 쓰지 않을 거면 네임서버만 바꿀 겁니다.
          </li>
          <li>
            <b>데이터베이스</b> — neon.tech 에서 무료 Postgres 를 하나 만듭니다.
            연결 주소(DATABASE_URL)를 복사해 둡니다. 안 만들면 상품·주문이 서버 재시작 때 사라집니다.
          </li>
          <li>
            <b>호스팅</b> — Render.com 또는 Railway.app 에 이 프로젝트를 올립니다.
            환경변수에 DATABASE_URL 을 넣고, 웹 주소가 나오면 복사합니다.
          </li>
          <li>
            <b>도메인 연결</b> — 가비아 또는 카페24 DNS 에서
            <br />A 레코드(또는 CNAME)를 호스팅이 알려 준 주소로 바꿉니다.
            www.jidokaan.com 도 같이 연결합니다.
          </li>
          <li>
            <b>자물쇠(HTTPS)</b> — Render/Railway/넷플리파이 모두 무료로 자동입니다.
            주소창에 자물쇠가 보이면 된 겁니다. 카페24에서 “SSL 켜기”를 따로 할 필요 없습니다.
          </li>
          <li>
            올린 뒤 jidokaan.com/admin 으로 들어가 비밀번호를 다시 만들고,
            회사정보·계좌·배송비·상품을 한 번 확인합니다.
          </li>
        </ol>
        <p className="mt-2 text-[#555]">
          이 단계(호스팅 가입·DNS)는 사장님 계정으로만 할 수 있습니다. 제가 가비아/카페24에 대신 들어갈 수는 없습니다.
          막히는 화면이 있으면 그 화면을 찍어 주시면 다음 클릭만 짚어 드립니다.
        </p>
      </section>

      <section>
        <h3 className="text-base font-semibold">8. 교환 · 반품</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>손님은 쇼핑몰 <b>주문조회</b>에서 주문번호+이메일로 찾습니다.</li>
          <li>배송중·배송완료면 교환 또는 반품을 접수합니다. 제작 전(입금대기·신규·배송준비)은 취소만 됩니다.</li>
          <li>접수는 <b>판매관리 → 배송현황관리</b>에 바로 뜹니다.</li>
          <li>그 화면에서 <b>승인 / 거부 / 접수취소</b>를 누릅니다. 승인하면 주문 상태가 교환 또는 반품으로 바뀝니다.</li>
        </ol>
      </section>

      <section>
        <h3 className="text-base font-semibold">9. 결제사 등록</h3>
        <p className="mt-2">
          스토어관리 → 계좌·결제 페이지 아래에 신청 링크와 순서가 있습니다.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>국내 카드: 토스페이먼츠 이용 신청 (사업자번호·통장·통신판매업)</li>
          <li>해외 카드: PayPal 비즈니스 「PayPal로 결제받기」</li>
          <li>현금: 같은 페이지에 통장만 넣으면 즉시 사용</li>
        </ul>
        <p className="mt-2">
          심사에 며칠 걸립니다. 그 전에는 무통장/해외송금으로 주문을 받을 수 있습니다.
        </p>
      </section>
    </article>
  );
}
