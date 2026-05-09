export type Lang = 'en' | 'hi';

export const t = (lang: Lang, en: string, hi: string): string => {
  return lang === 'hi' ? hi : en;
};
