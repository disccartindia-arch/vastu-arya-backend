'use client';
import { useEffect, useState } from 'react';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import AppointmentPopup from '../../../components/common/AppointmentPopup';
import CartDrawer from '../../../components/common/CartDrawer';
import WhatsAppButton from '../../../components/common/WhatsAppButton';
import VastuAIGuide from '../../../components/common/VastuAIGuide';
import PriceDisplay from '../../../components/common/PriceDisplay';
import UpiPaymentModal from '../../../components/payment/UpiPaymentModal';
import { useUIStore } from '../../../store/uiStore';
import { servicesAPI } from '../../../lib/api';
import { Service } from '../../../types';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, QrCode } from 'lucide-react';

export default function ServicesPage() {
  const { lang, setShowAppointmentPopup } = useUIStore();
  const [services, setServices] = useState<Service[]>([]);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);

  // UPI modal state
  const [upiOpen,    setUpiOpen]    = useState(false);
  const [upiService, setUpiService] = useState<Service | null>(null);

  useEffect(() => {
    servicesAPI.getAll({ isActive: true }).then(r => setServices(r.data.data || [])).finally(() => setLoading(false));
  }, []);

  const filtered = services.filter(s => {
    const q = search.toLowerCase();
    return s.title.en.toLowerCase().includes(q) || (s.title.hi?.toLowerCase().includes(q) || false);
  });

  const openUpi = (service: Service) => {
    setUpiService(service);
    setUpiOpen(true);
  };

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-dark-gradient py-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 mandala-bg opacity-10" />
          <div className="relative">
            {/* CHANGED: 100+ → 25+ */}
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-3">
              {lang === 'en' ? 'Our Services' : 'हमारी सेवाएं'}
            </h1>
            <p className="text-gray-300 mb-6">
              {lang === 'en'
                ? '25+ services by IVAF Certified Expert Dr. PPS Tomar'
                : 'IVAF प्रमाणित विशेषज्ञ डॉ. PPS द्वारा 25+ सेवाएं'}
            </p>
            <div className="max-w-md mx-auto relative px-4">
              <Search size={18} className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={lang === 'en' ? 'Search services...' : 'सेवाएं खोजें...'}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </section>

        <section className="py-14 bg-cream">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <div key={i} className="h-64 skeleton rounded-2xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((s, i) => (
                  <motion.div
                    key={s._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl p-6 hover:shadow-orange transition-all border border-orange-50 group"
                  >
                    <div className="text-4xl mb-3">{s.icon}</div>
                    <h3 className="font-display font-bold text-text-dark text-lg mb-2 group-hover:text-primary transition-colors">
                      {lang === 'hi' && s.title.hi ? s.title.hi : s.title.en}
                    </h3>
                    <p className="text-text-light text-sm mb-4 line-clamp-2">
                      {lang === 'hi' && s.shortDesc.hi ? s.shortDesc.hi : s.shortDesc.en}
                    </p>
                    <PriceDisplay original={s.originalPrice} offer={s.offerPrice} size="sm" />
                    <div className="flex gap-2 mt-4">
                      {s.slug === 'book-appointment' ? (
                        <button
                          onClick={() => setShowAppointmentPopup(true)}
                          className="flex-1 bg-primary hover:bg-primary-dark text-white py-2.5 rounded-xl text-sm font-semibold transition-all"
                        >
                          {lang === 'en' ? '📅 Book @ ₹11' : '📅 ₹11 में बुक करें'}
                        </button>
                      ) : (
                        <>
                          <Link
                            href={`/services/${s.slug}`}
                            className="flex-1 bg-primary hover:bg-primary-dark text-white py-2.5 rounded-xl text-sm font-semibold text-center transition-all"
                          >
                            {lang === 'en' ? 'View Details' : 'विवरण देखें'}
                          </Link>
                          <button
                            onClick={() => openUpi(s)}
                            className="flex items-center gap-1.5 px-3 py-2.5 border-2 border-orange-400 text-orange-700 rounded-xl text-xs font-semibold hover:bg-orange-50 transition-all"
                            title="Pay via UPI"
                          >
                            <QrCode size={14} />
                            UPI
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
                {!loading && filtered.length === 0 && (
                  <div className="text-center py-20 text-text-light col-span-3">
                    <div className="text-5xl mb-3">🔍</div>
                    <p>No services found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <AppointmentPopup />
      <CartDrawer />
      <WhatsAppButton />
      <VastuAIGuide />

      {/* UPI Payment Modal */}
      {upiService && (
        <UpiPaymentModal
          isOpen={upiOpen}
          onClose={() => setUpiOpen(false)}
          amount={upiService.offerPrice}
          itemName={upiService.title.en}
          itemId={upiService._id}
          itemType="service"
          onSuccess={refId => {
            setUpiOpen(false);
            import('react-hot-toast').then(({ default: toast }) => {
              toast.success(`Payment submitted! Ref: ${refId}`);
            });
          }}
        />
      )}
    </>
  );
}
