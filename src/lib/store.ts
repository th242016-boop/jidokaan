import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Currency, Locale } from "@/lib/i18n";
import { FREE_SHIP_KRW, FREE_SHIP_USD_CENTS } from "@/lib/i18n";
import { getProduct } from "@/lib/products";
import {
  defaultPartColors,
  defaultPartNames,
  lineFromParts,
  type PartColorNames,
  type PartColors,
  type PartId,
} from "@/lib/simulator-config";

export type CartItem = {
  productId: string;
  qty: number;
  size?: string;
  sizeFit?: "men" | "women";
  optionKey?: string;
  optionLabel?: string;
  extraKrw?: number;
  extraUsd?: number;
  partColors?: PartColors;
  partNames?: PartColorNames;
  color?: string;
};

type StoreState = {
  locale: Locale;
  currency: Currency;
  localePicked: boolean;
  cart: CartItem[];
  cartOpen: boolean;
  draftParts: PartColors;
  draftPartNames: PartColorNames;
  draftSize: string;
  draftFit: "men" | "women";
  setLocale: (locale: Locale) => void;
  setCurrency: (currency: Currency) => void;
  applyMarket: (locale: Locale, currency: Currency, picked?: boolean) => void;
  setCartOpen: (open: boolean) => void;
  setPartColor: (part: PartId, color: string, name: string) => void;
  setDraftSize: (size: string) => void;
  setDraftFit: (fit: "men" | "women") => void;
  resetDraft: () => void;
  addToCart: (
    productId: string,
    qty?: number,
    opts?: {
      size?: string;
      sizeFit?: "men" | "women";
      optionKey?: string;
      optionLabel?: string;
      extraKrw?: number;
      extraUsd?: number;
      partColors?: PartColors;
      partNames?: PartColorNames;
      color?: string;
      openCart?: boolean;
    },
  ) => void;
  addCustomBoot: (qty?: number, openCart?: boolean) => void;
  setQty: (
    productId: string,
    qty: number,
    size?: string,
    optionKey?: string,
    sizeFit?: "men" | "women",
  ) => void;
  removeFromCart: (
    productId: string,
    size?: string,
    optionKey?: string,
    sizeFit?: "men" | "women",
  ) => void;
  clearCart: () => void;
  cartCount: () => number;
  cartSubtotalUsdCents: () => number;
  cartSubtotalKrw: () => number;
  qualifiesFreeShip: () => boolean;
};

function itemKey(
  productId: string,
  size?: string,
  optionKey?: string,
  sizeFit?: string,
) {
  return `${productId}::${size ?? ""}::${optionKey ?? ""}::${sizeFit ?? ""}`;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      locale: "ko",
      currency: "KRW",
      localePicked: false,
      cart: [],
      cartOpen: false,
      draftParts: defaultPartColors(),
      draftPartNames: defaultPartNames(),
      draftSize: "265",
      draftFit: "men",
      setLocale: (locale) => set({ locale, localePicked: true }),
      setCurrency: (currency) =>
        set({ currency: currency === "KRW" ? "KRW" : "USD" }),
      applyMarket: (locale, currency, picked = true) =>
        set({
          locale,
          currency: currency === "KRW" ? "KRW" : "USD",
          localePicked: picked,
        }),
      setCartOpen: (cartOpen) => set({ cartOpen }),
      setPartColor: (part, color, name) =>
        set((s) => {
          const draftParts = { ...defaultPartColors(), ...s.draftParts, [part]: color };
          const draftPartNames = {
            ...defaultPartNames(),
            ...s.draftPartNames,
            [part]: name,
          };
          if (part === "i" || part === "d" || part === "a") {
            const line = lineFromParts(
              draftPartNames.d,
              draftParts.d,
              draftPartNames.i,
              draftParts.i,
              draftPartNames.a,
              draftParts.a,
            );
            draftParts.l = line.color;
            draftPartNames.l = line.name;
          }
          return { draftParts, draftPartNames };
        }),
      setDraftSize: (draftSize) => set({ draftSize }),
      setDraftFit: (draftFit) => set({ draftFit }),
      resetDraft: () =>
        set({
          draftParts: defaultPartColors(),
          draftPartNames: defaultPartNames(),
          draftSize: "265",
          draftFit: "men",
        }),
      addToCart: (productId, qty = 1, opts) => {
        const openCart = opts?.openCart !== false;
        const { openCart: _omit, ...itemOpts } = opts ?? {};
        set((state) => {
          const key = itemKey(
            productId,
            itemOpts.size,
            itemOpts.optionKey,
            itemOpts.sizeFit,
          );
          const existing = state.cart.find(
            (i) => itemKey(i.productId, i.size, i.optionKey, i.sizeFit) === key,
          );
          if (existing) {
            return {
              cart: state.cart.map((i) =>
                itemKey(i.productId, i.size, i.optionKey, i.sizeFit) === key
                  ? {
                      ...i,
                      qty: i.qty + qty,
                      ...itemOpts,
                    }
                  : i,
              ),
              cartOpen: openCart,
            };
          }
          return {
            cart: [
              ...state.cart,
              {
                productId,
                qty,
                ...itemOpts,
              },
            ],
            cartOpen: openCart,
          };
        });
      },
      addCustomBoot: (qty = 1, openCart = true) => {
        const { draftParts, draftPartNames, draftSize, draftFit, addToCart } =
          get();
        const line = lineFromParts(
          draftPartNames.d,
          draftParts.d,
          draftPartNames.i,
          draftParts.i,
          draftPartNames.a,
          draftParts.a,
        );
        addToCart("drone-custom", qty, {
          size: draftSize,
          sizeFit: draftFit,
          partColors: { ...draftParts, l: line.color },
          partNames: { ...draftPartNames, l: line.name },
          color: draftParts.a,
          openCart,
        });
      },
      setQty: (productId, qty, size, optionKey, sizeFit) => {
        if (qty <= 0) {
          get().removeFromCart(productId, size, optionKey, sizeFit);
          return;
        }
        set((state) => ({
          cart: state.cart.map((i) =>
            itemKey(i.productId, i.size, i.optionKey, i.sizeFit) ===
            itemKey(productId, size, optionKey, sizeFit)
              ? { ...i, qty }
              : i,
          ),
        }));
      },
      removeFromCart: (productId, size, optionKey, sizeFit) =>
        set((state) => ({
          cart: state.cart.filter(
            (i) =>
              itemKey(i.productId, i.size, i.optionKey, i.sizeFit) !==
              itemKey(productId, size, optionKey, sizeFit),
          ),
        })),
      clearCart: () => set({ cart: [] }),
      cartCount: () => get().cart.reduce((sum, i) => sum + i.qty, 0),
      cartSubtotalUsdCents: () =>
        get().cart.reduce((sum, i) => {
          const p = getProduct(i.productId);
          return sum + (p ? (p.priceUsd + (i.extraUsd ?? 0)) * i.qty : 0);
        }, 0),
      cartSubtotalKrw: () =>
        get().cart.reduce((sum, i) => {
          const p = getProduct(i.productId);
          return sum + (p ? (p.priceKrw + (i.extraKrw ?? 0)) * i.qty : 0);
        }, 0),
      qualifiesFreeShip: () => {
        const state = get();
        if (state.currency === "KRW") {
          return state.cartSubtotalKrw() >= FREE_SHIP_KRW;
        }
        return state.cartSubtotalUsdCents() >= FREE_SHIP_USD_CENTS;
      },
    }),
    {
      name: "jidokaan-store-v32",
      partialize: (state) => ({
        locale: state.locale,
        currency: state.currency === "KRW" ? "KRW" : "USD",
        localePicked: state.localePicked,
        cart: state.cart,
        draftParts: state.draftParts,
        draftPartNames: state.draftPartNames,
        draftSize: state.draftSize,
        draftFit: state.draftFit,
      }),
      merge: (persisted, current) => {
        const n = (persisted ?? {}) as Partial<StoreState>;
        const draftParts =
          n.draftParts && typeof n.draftParts === "object" ? n.draftParts : {};
        const draftPartNames =
          n.draftPartNames && typeof n.draftPartNames === "object"
            ? n.draftPartNames
            : {};
        return {
          ...current,
          ...n,
          draftParts: { ...defaultPartColors(), ...draftParts },
          draftPartNames: { ...defaultPartNames(), ...draftPartNames },
          draftFit: n.draftFit === "women" ? "women" : "men",
          draftSize: typeof n.draftSize === "string" ? n.draftSize : "265",
        };
      },
    },
  ),
);
