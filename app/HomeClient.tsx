'use client';
import { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/home/HeroSection';
import FeaturedServices from '../components/home/FeaturedServices';
import TestimonialsSection from '../components/home/TestimonialsSection';
import AppointmentPopup from '../components/common/AppointmentPopup';
import CartDrawer from '../components/common/CartDrawer';
import WhatsAppButton from '../components/common/WhatsAppButton';
import VastuAIGuide from '../components/common/VastuAIGuide';
import ProductCard from '../components/store/ProductCard';
import { useUIStore } from '../store/uiStore';
import { servicesAPI, productsAPI, contentAPI, configAPI, homepageSettingsAPI } from '../lib/api';
import { Service, Product } from '../types';
import { HeroSettings } from '../components/home/HeroSection';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Award, CheckCircle, TrendingUp, Phone, Star } from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

const WHY_CARDS = [
  { icon: Award, title: 'IVAF Certified Expert', desc: 'International Vedic Astrology Federation certified — globally recognized from USA' },
  { icon: TrendingUp, title: 'Vastu Vadana Doctorate', desc: 'Dr. PPS Tomar holds a doctorate degree in Vastu Shastra from a prestigious institute' },
  { icon: CheckCircle, title: '73,000+ Happy Clients', desc: 'Transforming lives across India and worldwide with authentic Vastu solutions' },
  { icon: Phone, title: 'WhatsApp Connect', desc: 'Direct access to Dr. PPS Tomar for urgent consultations at just ₹11' },
  { icon: Star, title: 'Government Recognized', desc: 'New Delhi awarded, media featured, government recognized Vastu expert' },
  { icon: CheckCircle, title: 'Proven Results', desc: '15+ years of results with scientific Vastu methodology and astrology' },
];

export default function HomePage() {
  const { lang, setShowAppointmentPopup } = useUIStore();
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cms, setCms] = useState<Record<string, Record<string, string>>>({});
  const [heroSettings, setHeroSettings] = useState<HeroSettings | undefined>(undefined);
  const [heroBgTheme, setHeroBgTheme] = useState<'dark' | 'light'>('light');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedLang = localStorage.getItem('vastu_lang');
    if (savedLang) useUIStore.getState().setLang(savedLang as any);
    Promise.all([
      servicesAPI.getAll({ showOnHome: true, isActive: true }),
      productsAPI.getAll({ isFeatured: true, limit: 8 }),
      contentAPI.getPage('home').catch(() => ({ data: { data: {} } })),
      configAPI.get().catch(() => ({ data: { data: {} } })),
      homepageSettingsAPI.get().catch(() => ({ data: { data: null } })),
    ]).then(([sRes, pRes, cRes, cfgRes, hRes]) => {
      setServices(sRes.data.data || []);
      setProducts(pRes.data.data || []);
      setCms((cRes as any).data?.data || {});
      const cfg = (cfgRes as any)?.data?.data || {};
      setHeroBgTheme((cfg.hero_bg_theme as 'dark' | 'light') || 'light');
      const hs = (hRes as any)?.data?.data;
      if (hs) setHeroSettings({ heroHeading: hs.heroHeading, heroSubheading: hs.heroSubheading, cta1Text: hs.cta1Text, cta1Link: hs.cta1Link, cta2Text: hs.cta2Text, cta2Link: hs.cta2Link, trustBadges: hs.trustBadges, stats: hs.stats, servicesButtonText: hs.servicesButtonText });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const c = (section: string, key: string, fallback: string) => cms[section]?.[key] || fallback;
  const stats = heroSettings?.stats?.length ? [...heroSettings.stats].sort((a,b)=>a.order-b.order) : [{ value:'73,000+', label:lang==='en'?'Happy Clients':'खुश ग्राहक' },{ value:'15+', label:lang==='en'?'Years Experience':'साल का अनुभव' },{ value:'100+', label:lang==='en'?'Services':'सेवाएं' },{ value:'50+', label:lang==='en'?'Cities Served':'शहरों में सेवा' }];

  return (
    <>
      <Navbar />
      <main>
        <HeroSection onBookClick={() => setShowAppointmentPopup(true)} settings={heroSettings} heroBgTheme={heroBgTheme} />
        <FeaturedServices services={services} onBookAppointment={() => setShowAppointmentPopup(true)} servicesButtonText={heroSettings?.servicesButtonText} />
        <section className="py-16 bg-saffron-gradient">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center text-white">
              {stats.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <div className="font-display font-bold text-4xl sm:text-5xl mb-1">{s.value}</div>
                  <div className="text-white/80 text-sm">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        {products.length > 0 && (
          <section className="py-20 bg-cream">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <motion.div {...fadeUp} className="text-center mb-12">
                <span className="font-accent text-xs tracking-widest uppercase" style={{ color: '#D4A017' }}>Vastu Store</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-dark mt-2 mb-3">{lang === 'en' ? 'Top Selling Remedies' : 'टॉप सेलिंग उपाय'}</h2>
              </motion.div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {products.map((p, i) => (<motion.div key={p._id} {...fadeUp} transition={{ delay: i * 0.05 }}><ProductCard product={p} /></motion.div>))}
              </div>
              <div className="text-center mt-10">
                <Link href="/vastu-store" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all text-white shadow-orange" style={{ background: 'linear-gradient(135deg, #FF6B00, #FF8C33)' }}>{lang === 'en' ? 'Visit Vastu Store' : 'वास्तु स्टोर देखें'} <ArrowRight size={18} /></Link>
              </div>
            </div>
          </section>
        )}
        <TestimonialsSection />
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div {...fadeUp} className="text-center mb-12">
              <span className="font-accent text-xs tracking-widest uppercase" style={{ color: '#D4A017' }}>Why Vastu Arya</span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-dark mt-2">{lang === 'en' ? 'Why Choose Vastu Arya?' : 'वास्तु आर्या क्यों चुनें?'}</h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {WHY_CARDS.map((card, i) => {
                const Icon = card.icon;
                return (<motion.div key={i} {...fadeUp} transition={{ delay: i * 0.1 }} className="p-6 rounded-2xl border border-orange-100 hover:shadow-orange transition-all premium-card">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, rgba(212,160,23,0.12), rgba(255,107,0,0.08))' }}><Icon size={20} style={{ color: '#D4A017' }} /></div>
                  <h3 className="font-display font-bold text-text-dark mb-2">{card.title}</h3>
                  <p className="text-text-light text-sm leading-relaxed">{card.desc}</p>
                </motion.div>);
              })}
            </div>
          </div>
        </section>
        <section className="py-20 bg-dark-gradient relative overflow-hidden">
          <div className="absolute inset-0 mandala-bg opacity-20" />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 mx-auto mb-6" style={{ borderColor: 'rgba(212,160,23,0.4)' }}>
                <img src="/logo.jpg" alt="Vastu Arya" className="w-full h-full object-cover" />
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">{c('cta', 'title', lang==='en'?'Transform Your Life Today':'आज अपना जीवन बदलें')}</h2>
              <p className="text-gray-300 text-lg mb-8">{c('cta', 'subtitle', lang==='en'?'Connect with Dr. PPS Tomar on WhatsApp. Only ₹11.':'डॉ. PPS से WhatsApp पर जुड़ें। केवल ₹11।')}</p>
              <button onClick={() => setShowAppointmentPopup(true)} className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-lg transition-all text-white animate-pulse-orange" style={{ background: 'linear-gradient(135deg, #FF6B00, #FF8C33)', boxShadow: '0 8px 30px rgba(255,107,0,0.5)' }}>
                {c('cta', 'button', lang==='en'?'Book Appointment @ ₹11':'₹11 में अपॉइंटमेंट बुक करें')}<ArrowRight size={20} />
              </button>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
      <AppointmentPopup />
      <CartDrawer />
      <WhatsAppButton />
      <VastuAIGuide />
      <button onClick={() => setShowAppointmentPopup(true)} className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:hidden z-40 px-6 py-3 rounded-full font-bold text-sm text-white animate-pulse-orange" style={{ background: 'linear-gradient(135deg, #FF6B00, #FF8C33)', boxShadow: '0 4px 20px rgba(255,107,0,0.5)' }}>
        {lang === 'en' ? 'Book @ ₹11' : '₹11 में बुक करें'}
      </button>
    </>
  );
}
