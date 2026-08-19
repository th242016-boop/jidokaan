import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/handoff")({
  component: HandoffPage,
});

function HandoffPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#0a0a0c] px-6 text-center text-white">
      <p className="text-sm tracking-[0.2em] text-white/50">JIDOKAAN</p>
      <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">작업 파일 받기</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-white/65">
        사이트 전체 소스입니다. 아래 버튼을 누르면 zip이 받아집니다.
      </p>
      <a
        href="/jidokaan-handoff.zip"
        download="jidokaan-handoff.zip"
        className="mt-10 inline-flex min-h-14 items-center justify-center rounded-full bg-white px-10 text-base font-semibold text-black"
      >
        jidokaan-handoff.zip 다운로드
      </a>
      <p className="mt-6 text-xs text-white/40">약 15MB</p>
    </div>
  );
}
