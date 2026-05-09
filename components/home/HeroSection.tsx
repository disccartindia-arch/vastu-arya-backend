'use client';
import { motion } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';
import { ArrowRight, Star, Award } from 'lucide-react';
import Link from 'next/link';

export interface HeroSettings { heroHeading?: string; heroSubheading?: string; cta1Text?: string; cta1Link?: string; cta2Text?: string; cta2Link?: string; trustBadges?: { label: string; order: number }[]; stats?: { value: string; label: string; order: number }[]; heroBgTheme?: 'dark' | 'light'; servicesButtonText?: string; }

interface Props { onBookClick: () => void; settings?: HeroSettings; heroBgTheme?: 'dark' | 'light'; }

// Normalize links stored in admin DB — prevents RSC prefetch redirect loops
function normalizeAdminLink(link: string | undefined, fallback: string): string {
  if (!link) return fallback;
  return link
    .replace(/\/Vastu-Store/gi, '/vastu-store')
    .replace(/\/Book-Now/gi, '/book-appointment')
    .replace(/\/book-now/gi, '/book-appointment')
    .replace(/\/BOOK-NOW/gi, '/book-appointment')
    .replace(/^\/Services$/i, '/services')
    .replace(/^\/About$/i, '/about')
    .replace(/^\/Contact$/i, '/contact')
    .replace(/^\/Blog$/i, '/blog');
}

export default function HeroSection({ onBookClick, settings, heroBgTheme: propTheme }: Props) {
  const { lang } = useUIStore();
  const isLight = (settings?.heroBgTheme || propTheme || 'light') === 'light';
  const heroHeading = settings?.heroHeading || (lang === 'hi' ? 'अपना वास्तु बदलें, अपना जीवन बदलें' : 'Transform Your Space, Transform Your Life');
  const heroSubheading = settings?.heroSubheading || (lang === 'hi' ? 'डॉ. PPS द्वारा भारत का प्रमुख वास्तु शास्त्र और ज्योतिष प्लेटफॉर्म' : "India's Premier Vastu Shastra & Astrology Platform by Dr. PPS Tomar");
  const cta1Text = settings?.cta1Text || '📅 Book Appointment @ ₹11';
  // Normalize links to prevent RSC redirect loops from admin-stored capital-case URLs
  const cta1Link = normalizeAdminLink(settings?.cta1Link, '/book-appointment');
  const cta2Text = settings?.cta2Text || '🙏 Explore Vastu Store';
  const cta2Link = normalizeAdminLink(settings?.cta2Link, '/vastu-store');
  const trustBadges = settings?.trustBadges?.length
    ? settings.trustBadges.sort((a, b) => a.order - b.order).map(b => b.label)
    : ['IVAF Awarded', '73,000+ Consultations', 'New Delhi Recognized'];
  const stats = settings?.stats?.length
    ? settings.stats.sort((a, b) => a.order - b.order)
    : [{ value: '73,000+', label: 'Happy Clients' }, { value: '15+', label: 'Years Experience' }, { value: '100+', label: 'Services' }, { value: '50+', label: 'Cities Served' }];
  const parts = heroHeading.split(',');
  const title1 = parts[0]?.trim() + (parts.length > 1 ? ',' : '');
  const title2 = parts.slice(1).join(',').trim();
  const textTitle = isLight ? '#1A0A00' : 'white';
  const textSub = isLight ? '#5C3D1E' : '#D1D5DB';
  const sectionBg = isLight
    ? 'linear-gradient(135deg, #FFFDF7 0%, #FFF8EE 45%, #FEF3E2 100%)'
    : 'linear-gradient(135deg, #0D0500 0%, #1A0A00 50%, #2D1000 100%)';

  // Determine if CTA1 should open the popup (any book-appointment variant)
  const cta1IsBook = cta1Link === '/book-appointment' || cta1Link.includes('book');

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: sectionBg }}>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-[20rem] font-devanagari leading-none select-none" style={{ color: isLight ? 'rgba(255,107,0,0.04)' : 'rgba(255,255,255,0.02)' }}>ॐ</span>
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-32 w-full">
        <div className="max-w-3xl">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.25)', color: '#FF6B00' }}>
            <Star size={14} fill="currentColor" />
            <span>🏆 IVAF Certified • New Delhi Recognized • 15+ Years</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-2" style={{ color: textTitle }}>{title1}</motion.h1>
          {title2 && (
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-6 gradient-text">{title2}</motion.h1>
          )}
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="text-lg sm:text-xl mb-8 leading-relaxed" style={{ color: textSub }}>{heroSubheading}</motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-wrap gap-2 mb-8">
            {trustBadges.map((badge, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,107,0,0.08)', color: '#5C3D1E' }}>
                <Award size={11} style={{ color: '#D4A017' }} /> {badge}
              </span>
            ))}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-col sm:flex-row gap-4 mb-16">
            {cta1IsBook ? (
              <button onClick={onBookClick} className="group flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-orange-lg animate-pulse-orange">
                {cta1Text}<ArrowRight size={20} />
              </button>
            ) : (
              <Link href={cta1Link} className="group flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-orange-lg animate-pulse-orange">
                {cta1Text}<ArrowRight size={20} />
              </Link>
            )}
            <Link href={cta2Link} className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg transition-all" style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.25)', color: isLight ? '#1A0A00' : 'white' }}>
              {cta2Text}
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="text-center rounded-xl p-3" style={{ background: isLight ? 'white' : 'rgba(255,255,255,0.05)', border: `1px solid ${isLight ? 'rgba(255,107,0,0.2)' : 'rgba(255,255,255,0.1)'}` }}>
                <div className="font-display font-bold text-2xl text-primary">{stat.value}</div>
                <div className="text-xs mt-0.5" style={{ color: isLight ? '#5C3D1E' : '#9CA3AF' }}>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
