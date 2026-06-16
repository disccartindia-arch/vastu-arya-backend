'use client';
import { useEffect, useState } from 'react';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import ProductCard from '../../../components/store/ProductCard';
import AppointmentPopup from '../../../components/common/AppointmentPopup';
import CartDrawer from '../../../components/common/CartDrawer';
import WhatsAppButton from '../../../components/common/WhatsAppButton';
import VastuAIGuide from '../../../components/common/VastuAIGuide';
import { useUIStore } from '../../../store/uiStore';
import { productsAPI } from '../../../lib/api';
import { Product } from '../../../types';
import { STORE_CATEGORIES } from '../../../lib/utils';
import Link from 'next/link';

// Only show products with a valid image URL
function hasValidImage(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const t = url.trim();
  if (!t) return false;
  if (/placeholder|no-image|noimage|undefined/i.test(t)) return false;
  return t.startsWith('http://') || t.startsWith('https://') || t.startsWith('/');
}

function filterWithImages(products: Product[]): Product[] {
  return products.filter(p => hasValidImage((p.images || [])[0]));
}

export default function VastuStorePage() {
  const { lang }     = useUIStore();
  const [featured,   setFeatured]   = useState<Product[]>([]);
  const [newLaunch,  setNewLaunch]  = useState<Product[]>([]);

  useEffect(() => {
    productsAPI.getAll({ isFeatured: true, limit: 8 }).then(r => setFeatured(filterWithImages(r.data.data || [])));
    productsAPI.getAll({ isNewLaunch: true, limit: 8 }).then(r => setNewLaunch(filterWithImages(r.data.data || [])));
  }, []);

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-dark-gradient py-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 mandala-bg opacity-10" />
          <div className="relative">
            <div className="text-5xl mb-3">🙏</div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-3">
              {lang === 'en' ? 'Vastu Store' : 'वास्तु स्टोर'}
            </h1>
            <p className="text-gray-300 text-lg max-w-xl mx-auto">
              {lang === 'en' ? 'Authentic spiritual products for positive energy & prosperity' : 'सकारात्मक ऊर्जा के लिए प्रामाणिक उत्पाद'}
            </p>
          </div>
        </section>

        <section className="py-14 bg-cream">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="font-display text-2xl font-bold text-text-dark text-center mb-8">
              {lang === 'en' ? 'Shop by Category' : 'श्रेणी अनुसार खरीदें'}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              {STORE_CATEGORIES.map(cat => (
                <Link key={cat.slug} href={`/vastu-store/${cat.slug}`}
                  className="flex flex-col items-center p-4 bg-white rounded-2xl hover:shadow-orange hover:border-primary/20 border border-transparent transition-all group text-center">
                  <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{cat.emoji}</span>
                  <span className="text-xs font-semibold text-text-mid group-hover:text-primary transition-colors">{lang === 'hi' ? cat.labelHi : cat.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {featured.length > 0 && (
          <section className="py-14 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-2xl font-bold text-text-dark">
                  {lang === 'en' ? '🔥 Top Selling Remedies' : '🔥 टॉप सेलिंग उपाय'}
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {featured.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            </div>
          </section>
        )}

        {newLaunch.length > 0 && (
          <section className="py-14 bg-cream">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <h2 className="font-display text-2xl font-bold text-text-dark mb-8">
                {lang === 'en' ? '✨ Newly Launched' : '✨ नए लॉन्च'}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {newLaunch.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
      <AppointmentPopup />
      <CartDrawer />
      <WhatsAppButton />
      <VastuAIGuide />
    </>
  );
}
