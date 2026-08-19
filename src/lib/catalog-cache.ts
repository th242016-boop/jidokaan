import type { Product } from "./products";

let products: Product[] | null = null;

export function setCatalogCache(next: Product[]) {
  products = next;
}

export function getCatalogCache(): Product[] | null {
  return products;
}
