// Re-export new i18n system for backwards compatibility
export { useTranslation, getTranslation } from './i18n/index';
export type { Translations } from './i18n/en';
export type Lang = 'en' | 'hi';

// Legacy simple t() helper for backwards compat
export const t = (lang: Lang, en: string, hi: string): string => {
  return lang === 'hi' ? hi : en;
};
