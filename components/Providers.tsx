'use client';
import { useEffect } from 'react';
import { useUIStore } from '../store/uiStore';
import { Lang } from '../types';

/**
 * Providers — runs once on client after hydration.
 * Restores persisted lang from localStorage WITHOUT causing hydration mismatch,
 * because this only runs after the initial render is committed to the DOM.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vastu_lang') as Lang | null;
      if (saved && (saved === 'en' || saved === 'hi')) {
        useUIStore.getState().setLang(saved);
      }
    } catch {}
  }, []);

  return <>{children}</>;
}
