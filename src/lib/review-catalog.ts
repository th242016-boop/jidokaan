import captured from "./review-catalog-products.json";
import type { Product } from "./products";

/** Public storefront snapshot only; the review must never query the live API. */
const externalMedia = new Set(captured.externalMedia);
function reviewMedia(src: string): string {
  return externalMedia.has(src) ? `https://jidokaan.com${src}` : src;
}

export function reviewCatalogProducts(): Product[] {
  return captured.products.map((value) => {
    const product = structuredClone(value) as Product;
    return {
      ...product,
      image: product.image ? reviewMedia(product.image) : undefined,
      images: product.images?.map(reviewMedia),
      detailImages: product.detailImages?.map(reviewMedia),
      detailVideos: product.detailVideos?.map((video) => ({
        ...video,
        src: reviewMedia(video.src),
        poster: video.poster ? reviewMedia(video.poster) : undefined,
      })),
    };
  });
}
