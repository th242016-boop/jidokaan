import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ProductVisual } from "@/components/store/product-visual";
import { formatProductPrice, pickLocalized, type Locale, type Currency } from "@/lib/i18n";
import { productDisplayName, type Product } from "@/lib/products";
import copy from "./craft-copy.js";

export function HomeShop({ products, ready, locale, currency }: {
  products: Product[]; ready: boolean; locale: Locale; currency: Currency;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const text = copy[locale] ?? copy.en;
  // Use the same live catalogue and visibility policy as /shop, not a sample list.
  const visible = products.filter((product) => product.visible !== false);
  function scroll(direction: number) {
    const node = rail.current;
    if (!node) return;
    node.scrollBy({ left: direction * node.clientWidth * 0.9,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  if (!ready) return <p className="home-shop-state" role="status">{text.shopLoading}</p>;
  if (!visible.length) return <p className="home-shop-state">{text.shopEmpty}</p>;
  return <>
    <div className="home-product-rail" ref={rail}>
      {visible.map((product) => <article className="home-product" key={product.id}>
        <Link to="/products/$productId" params={{ productId: product.id }}>
          <ProductVisual product={product} className="home-product-visual" />
          <div className="home-product-caption">
            <h3>{productDisplayName(product, locale)}</h3>
            <span>{formatProductPrice(product, currency)}</span>
          </div>
          <p>{pickLocalized(product.tagline, locale)}</p>
        </Link>
      </article>)}
    </div>
    <div className="home-shop-controls">
      <span>{text.shopBrowse}</span>
      <div><button type="button" onClick={() => scroll(-1)} aria-label={text.shopPrevious}>←</button>
        <button type="button" onClick={() => scroll(1)} aria-label={text.shopNext}>→</button></div>
    </div>
  </>;
}
