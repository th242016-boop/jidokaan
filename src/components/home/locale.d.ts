export type HomeLocale = {t(key: string): string; applyLanguage(locale: string, shippingCountry?: string): void; readonly locale: string; readonly specialContactHref: string; destroy(): void};
export function createHomeLocale(root: HTMLElement, onLocaleChange: (locale: string) => void): HomeLocale;
