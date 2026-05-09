'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUIStore } from '../../store/uiStore';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from '../../lib/i18n';
import { ShoppingCart, Menu, X, ChevronDown, Search } from 'lucide-react';
import { homepageSettingsAPI } from '../../lib/api';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { lang, setLang, setShowAppointmentPopup, mobileMenuOpen, setMobileMenuOpen, setShowCartDrawer } = useUIStore();
  const totalItems = useCartStore(s => s.totalItems);
  const { user, logout, isAdmin } = useAuthStore();
  const { t } = useTranslation();
  const [brand, setBrand] = useState({ name: 'Vastu Arya', subtitle: 'IVAF Certified', phone: '+91-7000343804' });

  const NAV_LINKS = [
    { href: '/', label: t('nav.home') },
    { href: '/vastu-store', label: t('nav.vastuStore') },
    { href: '/services', label: t('nav.services') },
    { href: '/vastu-feed', label: t('nav.vastuFeed') },
    { href: '/vastu-ai', label: t('nav.vastuAI') },
    { href: '/blog', label: t('nav.blog') },
    { href: '/about', label: t('nav.about') },
    { href: '/contact', label: t('nav.contact') },
  ];

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    homepageSettingsAPI.get().then((r: any) => {
      const d = r?.data?.data;
      if (d) setBrand({ name: d.brandName || 'Vastu Arya', subtitle: d.brandSubtitle || 'IVAF Certified', phone: d.contactPhone || d.contactNumber || '+91-7000343804' });
    }).catch(() => {});
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSearchOpen(false); setMobileMenuOpen(false); } };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [setMobileMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) { window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`; setSearchOpen(false); setSearchQuery(''); }
  };

  return (
    <>
      <div className="text-white text-xs py-1.5 px-4 flex items-center justify-between" style={{ background: '#0D0500' }}>
        <div className="flex items-center gap-4">
          <a href={`tel:${brand.phone}`} className="hover:text-yellow-400 transition-colors" style={{ color: '#D4A017' }}>{brand.phone}</a>
          <span className="hidden sm:block text-xs font-accent" style={{ color: '#D4A017' }}>IVAF Certified • New Delhi Recognized</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs">{t('nav.lang')}:</span>
          {(['en', 'hi'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)} className="px-2 py-0.5 rounded text-xs font-medium transition-colors" style={lang === l ? { background: '#D4A017', color: '#1A0A00' } : { color: '#9CA3AF' }}>
              {l === 'en' ? 'EN' : 'हि'}
            </button>
          ))}
        </div>
      </div>

      <nav className="sticky top-0 z-50 transition-all duration-300" style={{ background: scrolled ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(212,160,23,0.1)', boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.08)' : 'none' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-3">
            <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
              <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 transition-transform group-hover:scale-105" style={{ border: '2px solid rgba(212,160,23,0.35)', boxShadow: '0 0 12px rgba(212,160,23,0.12)' }}>
                <img src="/logo.jpg" alt="Vastu Arya" className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:block">
                <div className="font-display font-bold leading-none" style={{ fontSize: `${brand.subtitle === 'IVAF Certified' ? 18 : 16}px`, color: '#1A0A00' }}>{brand.name}</div>
                <div className="text-xs font-accent" style={{ color: '#D4A017' }}>{brand.subtitle}</div>
              </div>
            </Link>

            <div className="hidden xl:flex items-center gap-0.5 flex-1 justify-center">
              {NAV_LINKS.map(link => (
                <Link key={link.href} href={link.href} className="px-2.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap hover:text-primary hover:bg-orange-50" style={{ color: '#5C3D1E' }}>
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => { setSearchOpen(!searchOpen); setMobileMenuOpen(false); }} className="p-2 rounded-lg hover:bg-orange-50 transition-colors" aria-label={t('nav.search')}><Search size={18} style={{ color: '#5C3D1E' }} /></button>
              <button onClick={() => setShowCartDrawer(true)} className="relative p-2 rounded-lg hover:bg-orange-50 transition-colors" aria-label={t('nav.cart')}>
                <ShoppingCart size={18} style={{ color: '#5C3D1E' }} />
                {totalItems() > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ background: '#FF6B00' }}>{totalItems()}</span>}
              </button>
              <button onClick={() => setShowAppointmentPopup(true)} className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: 'linear-gradient(135deg,#FF6B00,#FF8C33)', boxShadow: '0 2px 12px rgba(255,107,0,0.3)' }}>
                {t('nav.bookNow')}
              </button>
              {user ? (
                <div className="relative group">
                  <button className="flex items-center gap-1 p-1">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg,#D4A017,#FF6B00)' }}>{user.name?.[0]?.toUpperCase()}</span>
                    <ChevronDown size={12} style={{ color: '#5C3D1E' }} />
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl py-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50" style={{ border: '1px solid rgba(212,160,23,0.15)' }}>
                    {isAdmin() && <Link href="/admin" className="block px-4 py-2 text-sm font-semibold hover:bg-orange-50 transition-colors" style={{ color: '#FF6B00' }}>{t('nav.adminPanel')}</Link>}
                    <Link href="/dashboard" className="block px-4 py-2 text-sm hover:bg-orange-50 transition-colors" style={{ color: '#5C3D1E' }}>{t('nav.myAccount')}</Link>
                    <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">{t('nav.logout')}</button>
                  </div>
                </div>
              ) : (
                <Link href="/login" className="hidden sm:block text-sm font-medium hover:text-primary transition-colors" style={{ color: '#5C3D1E' }}>{t('nav.login')}</Link>
              )}
              <button onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setSearchOpen(false); }} className="xl:hidden p-2 rounded-lg hover:bg-orange-50 transition-colors" aria-label="Menu">
                {mobileMenuOpen ? <X size={20} style={{ color: '#5C3D1E' }} /> : <Menu size={20} style={{ color: '#5C3D1E' }} />}
              </button>
            </div>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-orange-100 px-4 py-3" style={{ background: 'rgba(255,255,255,0.98)' }}>
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2">
              <input autoFocus type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('nav.searchPlaceholder')} className="flex-1 px-4 py-2.5 text-sm border border-orange-200 rounded-xl focus:outline-none focus:border-primary" />
              <button type="submit" className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold">{t('nav.search')}</button>
            </form>
          </div>
        )}

        {mobileMenuOpen && (
          <div className="xl:hidden border-t bg-white px-4 py-4 space-y-1" style={{ borderColor: 'rgba(212,160,23,0.1)' }}>
            <form onSubmit={handleSearch} className="flex gap-2 mb-3">
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('nav.searchPlaceholder')} className="flex-1 px-3 py-2 text-sm border border-orange-200 rounded-xl focus:outline-none focus:border-primary" />
              <button type="submit" className="px-3 py-2 bg-primary text-white rounded-xl text-sm"><Search size={14} /></button>
            </form>
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium rounded-xl transition-colors hover:text-primary hover:bg-orange-50" style={{ color: '#5C3D1E' }}>
                {link.label}
              </Link>
            ))}
            <button onClick={() => { setShowAppointmentPopup(true); setMobileMenuOpen(false); }} className="w-full mt-2 py-3 rounded-xl font-semibold text-sm text-white" style={{ background: 'linear-gradient(135deg,#FF6B00,#FF8C33)' }}>
              {t('nav.bookNow')}
            </button>
          </div>
        )}
      </nav>
    </>
  );
}
