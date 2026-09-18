export type HomeLocale = {t(key: string): string; applyLanguage(locale: string): void; readonly locale: string; destroy(): void};
export function createHomeLocale(root: HTMLElement, onLocaleChange: (locale: string) => void): HomeLocale;
