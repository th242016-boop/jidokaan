import { pickLocalized, type Locale } from "@/lib/i18n";
import { naverProductUrl, type Product } from "@/lib/products";

function AutoVideo({ src, poster }: { src: string; poster?: string }) {
  return (
    <video
      className="w-full bg-black"
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      controls
      preload="metadata"
    />
  );
}

export function ProductDetailStory({
  product,
  locale,
}: {
  product: Product;
  locale: Locale;
}) {
  const videos = product.detailVideos ?? [];
  const images = product.detailImages ?? [];
  const body = pickLocalized(product.description, locale);
  const naver = naverProductUrl(product);

  return (
    <section className="mt-12 bg-white text-[#111]">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {locale === "ko" ? (
          <a
            href={naver}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-28 w-full flex-col items-center justify-center rounded-2xl bg-[#03C75A] px-6 py-8 text-center text-white shadow-[0_8px_24px_rgba(3,199,90,0.28)] transition hover:bg-[#02b351]"
          >
            <span className="text-[11px] font-semibold tracking-[0.22em] text-white/85">
              NAVER SMARTSTORE
            </span>
            <span className="mt-2 text-lg font-bold leading-snug sm:text-xl">
              상세한 제품 후기는 네이버 스토어에서 확인
            </span>
            <span className="mt-3 max-w-md text-sm leading-relaxed text-white/90">
              클릭하면 네이버 상품 페이지로 이동합니다.
            </span>
            <span className="mt-4 max-w-md text-sm leading-relaxed text-white/90">
              원하시면 그곳에서 주문하셔도 됩니다
            </span>
          </a>
        ) : null}

        {videos.map((v) => (
          <div key={v.src} className="mt-10 overflow-hidden">
            <AutoVideo src={v.src} poster={v.poster} />
          </div>
        ))}

        {body ? (
          <div className="mt-12 whitespace-pre-line text-center text-[15px] leading-8 text-[#333]">
            {body}
          </div>
        ) : null}

        {images.map((src) => (
          <img key={src} src={src} alt="" className="mt-8 w-full" />
        ))}
      </div>
    </section>
  );
}
