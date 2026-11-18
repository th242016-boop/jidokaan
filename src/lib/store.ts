import { SPECIAL_ORDER_EXTRA_USD_CENTS, SPECIAL_ORDER_EXTRA_KRW, isSpecialOrderEligible } from "./special-order";
import { completeDesign, designColors, designKey } from "./design-order";
import { customerOrderDetailCopy } from "./customer-order-detail-copy";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Currency, Locale } from "@/lib/i18n";
import { FREE_SHIP_KRW, FREE_SHIP_USD_CENTS } from "@/lib/i18n";
import { getProduct } from "@/lib/products";
import { currencyForDestination, normalizeShippingCountry, writeShippingCountrySession } from "./shipping-destination";
import {
  defaultPartColors,
  defaultPartNames,
  linkedLColor,
  modelOf,
  type BootModel,
  type PartColorNames,
  type PartColors,
  type PartId,
} from "@/lib/simulator-config";

export type SizeFit = "men" | "women";

export type CartItem = {
  productId: string;
  qty: number;
  size?: string;
  sizeFit?: SizeFit;
  specialOrder?: boolean;
  optionKey?: string;
  optionLabel?: string;
  extraKrw?: number;
  extraUsd?: number;
  partColors?: PartColors;
  partNames?: PartColorNames;
  color?: string;
};

/** Resolve legacy mid-cut drafts for the Naver link without changing saved cart/order data. */
export function naverCartProductId(item: Pick<CartItem, "productId" | "partNames">) {
  return item.productId === "drone-custom" && modelOf(item.partNames) === "mid"
    ? "drone-mid"
    : item.productId;
}

export function formatCartSize(item: CartItem, locale: string) {
  if (!item.size) return "";
  const copy = customerOrderDetailCopy(locale);
  const parsed = item.size.trim().match(/^(\d+(?:\.\d+)?)\s*(?:mm)?\s*(?:\((남성|여성|men|women)\))?$/i);
  const fit = item.sizeFit ?? (/^(남성|men)$/i.test(parsed?.[2] ?? "") ? "men"
    : /^(여성|women)$/i.test(parsed?.[2] ?? "") ? "women" : undefined);
  const size = parsed ? `${parsed[1]} mm` : item.size;
  return fit ? `${size} (${copy[fit]})` : size;
}

type StoreState = {
  locale: Locale;
  currency: Currency;
  localePicked: boolean;
  shippingCountry: string;
  shippingCountryInitialized: boolean;
  shippingCountrySource: "manual" | "geo" | "legacy" | null;
  setShippingCountry: (country: string) => void;
  cart: CartItem[];
  cartOpen: boolean;
  draftParts: PartColors;
  modelDrafts: Partial<Record<BootModel, { parts: PartColors; names: PartColorNames }>>;
  setDraftModel: (model: BootModel) => void;
  draftPartNames: PartColorNames;
  draftSpecialOrder: boolean;
  setDraftSpecialOrder: (selected: boolean) => void;
  draftSize: string;
  draftFit: SizeFit;
  setLocale: (locale: Locale) => void;
  /** Compatibility only: actual currency always follows shippingCountry. */
  setCurrency: (currency: Currency) => void;
  /** Legacy callers can select language; currency is derived from destination. */
  applyMarket: (locale: Locale, currency: Currency, picked?: boolean) => void;
  setCartOpen: (open: boolean) => void;
  setPartColor: (part: PartId, color: string, name: string) => void;
  setDraftDesign: (names: PartColorNames) => boolean;
  setDraftSize: (size: string) => void;
  setDraftFit: (fit: SizeFit) => void;
  resetDraftColors: () => void;
  resetDraft: () => void;
  addToCart: (
    productId: string,
    qty?: number,
    opts?: {
      size?: string;
      sizeFit?: SizeFit;
      specialOrder?: boolean;
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
  /** Confirming a draft reuses its existing cart line without adding quantity. */
  ensureCustomBoot: () => void;
  setQty: (
    productId: string,
    qty: number,
    size?: string,
    optionKey?: string,
    sizeFit?: SizeFit,
    partNames?: PartColorNames,
    specialOrder?: boolean,
  ) => void;
  removeFromCart: (
    productId: string,
    size?: string,
    optionKey?: string,
    sizeFit?: SizeFit,
    partNames?: PartColorNames,
    specialOrder?: boolean,
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
  partNames?: PartColorNames,
  specialOrder = false,
) {
  return `${productId}::${size ?? ""}::${optionKey ?? ""}::${sizeFit ?? ""}::${designKey(partNames)}::${specialOrder ? "special" : "standard"}`;
}

function customBootItem({ draftParts, draftPartNames, draftSize, draftFit, draftSpecialOrder }: Pick<
  StoreState, "draftParts" | "draftPartNames" | "draftSize" | "draftFit" | "draftSpecialOrder"
>): Omit<CartItem, "qty"> {
  const linked = linkedLColor(
    draftPartNames.d,
    draftParts.d,
    draftPartNames.i,
    draftParts.i,
    draftPartNames.a,
    draftParts.a,
  );
  return {
    productId: modelOf(draftPartNames) === "mid" ? "drone-mid" : "drone-custom",
    size: draftSize,
    specialOrder: draftSpecialOrder,
    sizeFit: draftFit,
    partColors: { ...draftParts, l: linked.color },
    partNames: { ...draftPartNames, l: linked.name },
    color: draftParts.a,
  };
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      locale: "en",
      currency: "USD",
      localePicked: false,
      shippingCountry: "",
      shippingCountryInitialized: false,
      shippingCountrySource: null,
      setShippingCountry: (country) => {
        const shippingCountry = normalizeShippingCountry(country);
        writeShippingCountrySession(shippingCountry);
        set({ shippingCountry, shippingCountrySource: "manual", shippingCountryInitialized: true, currency: currencyForDestination(shippingCountry) });
      },
      cart: [],
      cartOpen: false,
      modelDrafts: {},
      draftParts: defaultPartColors(),
      draftPartNames: defaultPartNames(),
      draftSpecialOrder: false,
      setDraftSpecialOrder: (draftSpecialOrder) => set({ draftSpecialOrder }),
      draftSize: "265",
      draftFit: "men" as SizeFit,
      setLocale: (locale) => set({ locale, localePicked: true }),
      setCurrency: (_currency) => set({ currency: currencyForDestination(get().shippingCountry) }),
      applyMarket: (locale, _currency, picked = true) =>
        set({
          locale,
          currency: currencyForDestination(get().shippingCountry),
          localePicked: picked,
        }),
      setCartOpen: (cartOpen) => set({ cartOpen }),
      setDraftModel: (model) =>
        set((s) => {
          const current = modelOf(s.draftPartNames);
          if (current === model) return {};
          const modelDrafts = {
            ...s.modelDrafts,
            [current]: { parts: s.draftParts, names: s.draftPartNames },
          };
          const saved = modelDrafts[model];
          return {
            modelDrafts,
            draftParts: saved?.parts ?? defaultPartColors(),
            draftPartNames: {
              ...(saved?.names ?? defaultPartNames()),
              ...(model === "mid" ? { model: "mid" as const, g: "WHITE" } : {}),
            },
          };
        }),
      setPartColor: (part, color, name) =>
        set((s) => {
          const draftParts = {
            ...defaultPartColors(),
            ...s.draftParts,
            [part]: color,
          };
          const draftPartNames = {
            ...defaultPartNames(),
            ...s.draftPartNames,
            [part]: name,
          };
          if (part === "i" || part === "d" || part === "a") {
            const linked = linkedLColor(
              draftPartNames.d,
              draftParts.d,
              draftPartNames.i,
              draftParts.i,
              draftPartNames.a,
              draftParts.a,
            );
            draftParts.l = linked.color;
            draftPartNames.l = linked.name;
          }
          return { draftParts, draftPartNames };
        }),
      setDraftDesign: (input) => {
        const names = completeDesign(input);
        // A delayed recommendation must never switch models or write a design
        // that the existing checkout/capture pipeline cannot represent.
        if (!names || modelOf(names) !== modelOf(get().draftPartNames)) return false;
        const parts = designColors(names);
        const model = modelOf(names);
        set((state) => ({
          draftParts: parts,
          draftPartNames: names,
          modelDrafts: { ...state.modelDrafts, [model]: { parts, names } },
        }));
        return true;
      },
      setDraftSize: (draftSize) => set({ draftSize }),
      setDraftFit: (draftFit) => set({ draftFit }),
      resetDraftColors: () =>
        set((s) => {
          const model = modelOf(s.draftPartNames);
          const parts = defaultPartColors();
          const names: PartColorNames = {
            ...defaultPartNames(),
            ...(model === "mid" ? { model: "mid" as const } : {}),
          };
          return {
            draftParts: parts,
            draftPartNames: names,
            modelDrafts: { ...s.modelDrafts, [model]: { parts, names } },
          };
        }),
      resetDraft: () =>
        set({
          draftSpecialOrder: false,
          draftParts: defaultPartColors(),
          draftPartNames: defaultPartNames(),
          draftSize: "265",
          draftFit: "men",
        }),
      addToCart: (productId, qty = 1, opts) => {
        const openCart = opts?.openCart !== false;
        const { openCart: _omit, ...itemOpts } = opts ?? {};
        if (itemOpts.specialOrder) {
          if (!isSpecialOrderEligible(getProduct(productId))) throw new Error("SPECIAL_ORDER_UNAVAILABLE");
          itemOpts.extraUsd = SPECIAL_ORDER_EXTRA_USD_CENTS;
          itemOpts.extraKrw = SPECIAL_ORDER_EXTRA_KRW;
        }
        set((state) => {
          const key = itemKey(
            productId,
            itemOpts.size,
            itemOpts.optionKey,
            itemOpts.sizeFit,
            itemOpts.partNames,
            itemOpts.specialOrder,
          );
          const existing = state.cart.find(
            (i) => itemKey(i.productId, i.size, i.optionKey, i.sizeFit, i.partNames, i.specialOrder) === key,
          );
          if (existing) {
            return {
              cart: state.cart.map((i) =>
                itemKey(i.productId, i.size, i.optionKey, i.sizeFit, i.partNames, i.specialOrder) === key
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
        const { productId, ...opts } = customBootItem(get());
        get().addToCart(productId, qty, { ...opts, openCart });
      },
      ensureCustomBoot: () => {
        const state = get();
        const item = customBootItem(state);
        const key = itemKey(item.productId, item.size, item.optionKey, item.sizeFit, item.partNames, item.specialOrder);
        if (state.cart.some((line) => itemKey(line.productId, line.size, line.optionKey, line.sizeFit, line.partNames, line.specialOrder) === key)) {
          // Preserve the customer's chosen quantity and the saved design. A
          // different draft gets its own line; confirmation never replaces one.
          set({ cartOpen: false });
          return;
        }
        state.addCustomBoot(1, false);
      },
      setQty: (productId, qty, size, optionKey, sizeFit, partNames, specialOrder) => {
        if (qty <= 0) {
          get().removeFromCart(productId, size, optionKey, sizeFit, partNames, specialOrder);
          return;
        }
        set((state) => ({
          cart: state.cart.map((i) =>
            itemKey(i.productId, i.size, i.optionKey, i.sizeFit, i.partNames, i.specialOrder) ===
            itemKey(productId, size, optionKey, sizeFit, partNames, specialOrder)
              ? { ...i, qty }
              : i,
          ),
        }));
      },
      removeFromCart: (productId, size, optionKey, sizeFit, partNames, specialOrder) =>
        set((state) => ({
          cart: state.cart.filter(
            (i) =>
              itemKey(i.productId, i.size, i.optionKey, i.sizeFit, i.partNames, i.specialOrder) !==
              itemKey(productId, size, optionKey, sizeFit, partNames, specialOrder),
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
        shippingCountry: state.shippingCountry,
        shippingCountryInitialized: state.shippingCountryInitialized,
        shippingCountrySource: state.shippingCountrySource,
        cart: state.cart,
        modelDrafts: state.modelDrafts,
        draftParts: state.draftParts,
        draftPartNames: state.draftPartNames,
        draftSpecialOrder: state.draftSpecialOrder,
        draftSize: state.draftSize,
        draftFit: state.draftFit,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<StoreState>;
        const parts = p.draftParts && typeof p.draftParts === "object" ? p.draftParts : {};
        const names =
          p.draftPartNames && typeof p.draftPartNames === "object" ? p.draftPartNames : {};
        const shippingCountry = p.shippingCountrySource === "geo" ? "" : normalizeShippingCountry(p.shippingCountry);
        if (p.shippingCountrySource === "geo" || p.shippingCountryInitialized === true) writeShippingCountrySession(shippingCountry);
        return {
          ...current,
          ...p,
          locale: p.locale === "ar" ? "en" : (p.locale ?? current.locale),
          shippingCountry,
          shippingCountryInitialized: p.shippingCountrySource !== "geo" && p.shippingCountryInitialized === true,
          shippingCountrySource: p.shippingCountrySource === "geo" ? null : p.shippingCountrySource === "manual" ? "manual" : p.shippingCountryInitialized === true ? "legacy" : null,
          currency: currencyForDestination(shippingCountry),
          draftParts: { ...defaultPartColors(), ...parts },
          draftPartNames: { ...defaultPartNames(), ...names },
          draftFit: p.draftFit === "women" ? "women" : "men",
          draftSpecialOrder: p.draftSpecialOrder === true,
          draftSize: typeof p.draftSize === "string" ? p.draftSize : "265",
        };
      },
    },
  ),
);
