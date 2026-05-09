import { create } from 'zustand';
import { Lang } from '../types';

interface UIStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
  showAppointmentPopup: boolean;
  setShowAppointmentPopup: (show: boolean) => void;
  showCartDrawer: boolean;
  setShowCartDrawer: (show: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Always start with 'en' on server — avoids hydration mismatch.
  // Lang is restored from localStorage in a useEffect in providers.
  lang: 'en',
  setLang: (lang) => {
    set({ lang });
    if (typeof window !== 'undefined') {
      localStorage.setItem('vastu_lang', lang);
    }
  },
  showAppointmentPopup: false,
  setShowAppointmentPopup: (show) => set({ showAppointmentPopup: show }),
  showCartDrawer: false,
  setShowCartDrawer: (show) => set({ showCartDrawer: show }),
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
}));
