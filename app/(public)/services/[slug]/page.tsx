'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import Navbar from '../../../../components/layout/Navbar';
import Footer from '../../../../components/layout/Footer';
import AppointmentPopup from '../../../../components/common/AppointmentPopup';
import CartDrawer from '../../../../components/common/CartDrawer';
import WhatsAppButton from '../../../../components/common/WhatsAppButton';
import PriceDisplay from '../../../../components/common/PriceDisplay';
import { useUIStore } from '../../../../store/uiStore';
import { servicesAPI } from '../../../../lib/api';
import { initiateRazorpayPayment } from '../../../../lib/razorpay';
import { Service } from '../../../../types';
import { CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const { lang, setShowAppointmentPopup } = useUIStore();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (slug) {
      servicesAPI.getBySlug(slug as string)
        .then(r => setService(r.data.data))
        .catch(() => setService(null))
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (loading) return (<><Navbar /><div className="min-h-screen bg-cream flex items-center justify-center"><div className="text-center"><div className="text-5xl animate-spin">🕉️</div></div></div><Footer /></>);
  if (!service) return notFound();

  const title = lang === 'hi' && service.title.hi ? service.title.hi : service.title.en;
  const description = lang === 'hi' && service.description.hi ? service.description.hi : service.description.en;

  const handleBook = async () => {
    if (service.slug === 'book-appointment') { setShowAppointmentPopup(true); return; }
    setPaying(true);
    await initiateRazorpayPayment({
      amount: service.offerPrice, name: 'Customer', phone: '7000343804',
      description: service.title.en, type: 'service',
      orderData: { name: 'Customer', phone: '7000343804', serviceName: service.title.en, amount: service.offerPrice },
      onSuccess: () => { setPaying(false); toast.success('Booking confirmed!'); },
      onFailure: () => setPaying(false),
    });
  };

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-dark-gradient py-20 relative overflow-hidden">
          <div className="absolute inset-0 mandala-bg opacity-10" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
            <div className="text-6xl mb-4">{service.icon}</div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">{title}</h1>
            <PriceDisplay original={service.originalPrice} offer={service.offerPrice} size="lg" />
            <button onClick={handleBook} disabled={paying} className="mt-6 bg-primary hover:bg-primary-dark text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all shadow-orange disabled:opacity-60">
              {paying ? '⏳ Processing...' : `Book Now @ ₹${service.offerPrice}`}
            </button>
          </div>
        </section>
        {description && (<section className="py-16 bg-cream"><div className="max-w-4xl mx-auto px-4 sm:px-6"><div className="bg-white rounded-2xl p-8 shadow-sm prose max-w-none" dangerouslySetInnerHTML={{ __html: description }} /></div></section>)}
        {service.features && service.features.length > 0 && (
          <section className="py-16 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              <h2 className="font-display text-3xl font-bold text-text-dark mb-8 text-center">What's Included</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {service.features.map((f, i) => (<div key={i} className="flex items-start gap-3 p-4 bg-cream rounded-xl"><CheckCircle size={18} className="text-primary flex-shrink-0 mt-0.5" /><span className="text-text-mid text-sm">{lang === 'hi' && f.hi ? f.hi : f.en}</span></div>))}
              </div>
            </div>
          </section>
        )}
        <section className="py-16 bg-saffron-gradient text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">{title}</h2>
          <PriceDisplay original={service.originalPrice} offer={service.offerPrice} size="lg" />
          <button onClick={handleBook} disabled={paying} className="mt-4 bg-white text-primary hover:bg-cream px-10 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg disabled:opacity-60">
            {paying ? '⏳ Processing...' : `Book Now @ ₹${service.offerPrice}`}
          </button>
        </section>
      </main>
      <Footer />
      <AppointmentPopup />
      <CartDrawer />
      <WhatsAppButton />
    </>
  );
}
