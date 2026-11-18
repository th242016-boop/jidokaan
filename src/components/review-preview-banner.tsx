import { ReviewAdminOrderPreview } from "./admin/review-order-preview";
import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { IS_REVIEW_PREVIEW, REVIEW_EMAIL, REVIEW_ORDER_ID } from "@/lib/review-preview";
import { useStore } from "@/lib/store";

const allowed = /^\/(?:$|shop\/?$|products\/[^/]+\/?$|customize\/?$|cart\/?$|checkout\/?$|orders\/?$|order-success\/?$|shipping\/?$|brand\/?$|terms\/?$|privacy\/?$|contact\/?$|faq\/?$)/;

export function ReviewPreviewBoundary({children}: {children: ReactNode}) {
  const path = useRouterState({select: (state) => state.location.pathname});
  if (!IS_REVIEW_PREVIEW) return <>{children}</>;
  return <>
    {path.replace(/\/$/, "") === "/review-admin-order" ? <ReviewAdminOrderPreview /> : allowed.test(path) ? children : <main style={{padding:"160px 24px",color:"#eee",background:"#101010",minHeight:"100vh"}}><h1>이 기능은 테스트 범위에 포함되지 않습니다.</h1><p>로그인·관리자·고객정보·실제 결제는 연결하지 않았습니다.</p><a href="/">첫 화면으로 돌아가기 →</a></main>}
    <style>{`body { padding-bottom: 88px !important; } .review-controls { display:flex; gap:12px; align-items:center; flex-wrap:wrap; padding-top:12px; } .review-controls a { padding:8px 0; }`}</style>
    <aside aria-label="비공개 테스트 안내" style={{position:"fixed",bottom:12,left:12,right:12,zIndex:2147483647,background:"#f3ead8",color:"#29251e",border:"1px solid #aa9270",borderRadius:10,padding:"8px 12px",fontFamily:"sans-serif",fontSize:12,boxShadow:"0 4px 22px #0005"}}>
      <details><summary style={{cursor:"pointer",minHeight:34,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,listStyle:"none"}}>
        <span><strong>검토용 · 공식 사이트 미반영</strong><br/><small>실제 주문·결제 없음 / Preview only</small></span><span>테스트 메뉴 ⌃</span>
      </summary><div className="review-controls">
      <p style={{width:"100%",margin:0}}>DM·메일 발송 없음 · 소스 기본 상품 데이터</p>
      <button type="button" style={{border:"1px solid #8b785c",borderRadius:5,padding:"8px 10px",background:"#fff9ef",cursor:"pointer"}} onClick={() => {
        const state = useStore.getState();
        state.clearCart();
        state.addCustomBoot(1, false);
        location.assign("/checkout/");
      }}>현재 디자인으로 주문 화면 보기</button>
      <a href={`/order-success/?order=${REVIEW_ORDER_ID}`} style={{textDecoration:"underline"}}>완료 화면 예시</a>
      <a href={`/orders/?id=${REVIEW_ORDER_ID}`} style={{textDecoration:"underline"}}>조회 예시</a>
      <small>기본 예시 이메일: {REVIEW_EMAIL} · 직접 테스트 주문을 완료했다면 입력한 이메일로 조회</small>
      <a href="/review-admin-order/" style={{textDecoration:"underline"}}>관리자 국가별 안내 예시</a>
      <a href="/review-mobile.html" style={{textDecoration:"underline"}}>모바일 390px 화면</a>
      </div></details>
    </aside>
  </>;
}
