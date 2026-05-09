'use client';
import { useUIStore } from '@/store/uiStore';
import en from './en';
import hi from './hi';
import type { Translations } from './en';

const translations: Record<string, Translations> = { en, hi };

export function useTranslation() {
  const lang = useUIStore(s => s.lang);
  const dict = translations[lang] || translations.en;
  const fallback = translations.en;

  function t(key: string, fallbackStr?: string): string {
    const parts = key.split('.');
    let val: any = dict;
    let fb: any = fallback;
    for (const p of parts) {
      val = val?.[p];
      fb = fb?.[p];
    }
    if (typeof val === 'string') return val;
    if (typeof fb === 'string') return fb;
    return fallbackStr || key;
  }

  function tArr(key: string): any[] {
    const parts = key.split('.');
    let val: any = dict;
    for (const p of parts) val = val?.[p];
    if (Array.isArray(val)) return val;
    let fb: any = fallback;
    for (const p of parts) fb = fb?.[p];
    return Array.isArray(fb) ? fb : [];
  }

  return { t, tArr, lang };
}

export function getTranslation(lang: string, key: string): string {
  const dict: any = translations[lang] || translations.en;
  const parts = key.split('.');
  let val = dict;
  for (const p of parts) val = val?.[p];
  if (typeof val === 'string') return val;
  const fb: any = translations.en;
  let fbVal = fb;
  for (const p of parts) fbVal = fbVal?.[p];
  return typeof fbVal === 'string' ? fbVal : key;
}

export { en, hi };
export type { Translations };
