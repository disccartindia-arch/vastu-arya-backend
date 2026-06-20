'use client';
/**
 * app/(public)/services/[slug]/page.tsx
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 5 — requirements #3/#4):
 * matches LeadGateModal's updated onSubmitted signature (now receives
 * the full lead object instead of just an id string — see
 * LeadGateModal.tsx and CHANGELOG.md). The lead's name/phone are now
 * threaded into runRazorpay()'s orderData, replacing the previous
 * hardcoded 'Customer' / '7000343804' placeholder values — the customer
 * is never asked for this information twice.
 *
 * No other behavior on this page changed. The "Pay via UPI QR" button
 * remains its own independent, ungated flow exactly as in Round 4.
 */
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import Navbar from '../../../../components/layout/Navbar';
import Footer from '../../../../components/layout/Footer';
import AppointmentPopup from '../../../../components/common/AppointmentPopup';
import CartDrawer from '../../../../components/common/CartDrawer';
import WhatsAppButton from '../../../../components/common/WhatsAppButton';
import PriceDisplay from '../../../../components/common/PriceDisplay';
import UpiPaymentModal from '../../../../components/payment/UpiPaymentModal';
import LeadGateModal, { LeadGateContext, LeadData } from '../../../../components/leads/LeadGateModal';
import { useUIStore } from '../../../../store/uiStore';
import { servicesAPI } from '../../../../lib/api';
import api from '../../../../lib/api';
import { initiateRazorpayPayment } from '../../../../lib/razorpay';
import { Service } from '../../../../types';
import { CheckCircle, QrCode, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const { lang, setShowAppointmentPopup } = useUIStore();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying,  setPaying]  = useState(false);
  const [upiOpen, setUpiOpen] = useState(false);

  const [leadGateOpen, setLeadGateOpen] = useState(false);
  // CHANGED: was `leadId: string | null`. Now the full lead object.
  const [leadData, setLeadData] = useState<LeadData | null>(null);

  useEffect(() => {
    if (slug) {
      servicesAPI.getBySlug(slug as string)
        .then(r => setService(r.data.data))
        .catch(() => setService(null))
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (loading) return (
    <><Navbar /><div className="min-h-screen bg-cream flex items-center justify-center"><div className="text-5xl animate-spin">🕉️</div></div><Footer /></>
  );
  if (!service) return notFound();

  const title       = lang === 'hi' && service.title.hi       ? service.title.hi       : service.title.en;
  const description = lang === 'hi' && service.description.hi ? service.description.hi : service.description.en;

  const markLeadStatus = (status: 'PAID' | 'FAILED', paymentMethod?: 'razorpay') => {
    if (!leadData) return;
    api.patch(`/leads/${leadData._id}/status`, { status, paymentMethod }).catch(() => {});
  };

  const runRazorpay = async () => {
    setPaying(true);
    await initiateRazorpayPayment({
      amount: service.offerPrice,
      // CHANGED: previously hardcoded 'Customer' / '7000343804'. Now
      // uses the already-captured lead details — never asked twice.
      name: leadData?.name || 'Customer',
      phone: leadData?.phone || '7000343804',
      description: service.title.en, type: 'service',
      orderData: {
        name: leadData?.name || 'Customer',
        phone: leadData?.phone || '7000343804',
        serviceName: service.title.en,
        amount: service.offerPrice,
      },
      onSuccess: () => { markLeadStatus('PAID', 'razorpay'); setPaying(false); toast.success('Booking confirmed!'); },
      onFailure: () => { markLeadStatus('FAILED', 'razorpay'); setPaying(false); },
    });
  };

  const handleRazorpay = () => {
    if (service.slug === 'book-appointment') { setShowAppointmentPopup(true); return; }
    setLeadGateOpen(true);
  };

  const leadContext: LeadGateContext = {
    serviceName: service.title.en,
    serviceId: service._id,
    price: service.offerPrice,
    sourcePage: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
  };

  // CHANGED: matches LeadGateModal's new onSubmitted(lead) signature.
  const handleLeadSubmitted = (lead: LeadData) => {
    setLeadData(lead);
    setLeadGateOpen(false);
    runRazorpay();
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

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <button
                onClick={handleRazorpay}
                disabled={paying}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-bold text-base transition-all shadow-orange disabled:opacity-60"
              >
                <CreditCard size={18} />
                {paying ? '⏳ Processing...' : `Pay via Card / UPI @ ₹${service.offerPrice}`}
              </button>
              <button
                onClick={() => setUpiOpen(true)}
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border-2 border-white/40 text-white px-8 py-4 rounded-2xl font-bold text-base transition-all"
              >
                <QrCode size={18} />
                Pay via UPI QR
              </button>
            </div>
          </div>
        </section>

        {description && (
          <section className="py-16 bg-cream">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              <div className="bg-white rounded-2xl p-8 shadow-sm prose max-w-none" dangerouslySetInnerHTML={{ __html: description }} />
            </div>
          </section>
        )}

        {service.features && service.features.length > 0 && (
          <section className="py-16 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              <h2 className="font-display text-3xl font-bold text-text-dark mb-8 text-center">What&apos;s Included</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {service.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-cream rounded-xl">
                    <CheckCircle size={18} className="text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-text-mid text-sm">{lang === 'hi' && f.hi ? f.hi : f.en}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-16 bg-saffron-gradient text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">{title}</h2>
          <PriceDisplay original={service.originalPrice} offer={service.offerPrice} size="lg" />
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
            <button
              onClick={handleRazorpay}
              disabled={paying}
              className="bg-white text-primary hover:bg-cream px-10 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg disabled:opacity-60"
            >
              {paying ? '⏳ Processing...' : `Book Now @ ₹${service.offerPrice}`}
            </button>
            <button
              onClick={() => setUpiOpen(true)}
              className="bg-white/20 border-2 border-white text-white px-8 py-4 rounded-2xl font-bold text-base hover:bg-white/30 transition-all flex items-center justify-center gap-2"
            >
              <QrCode size={18} /> Pay via UPI QR
            </button>
          </div>
        </section>
      </main>
      <Footer />
      <AppointmentPopup />
      <CartDrawer />
      <WhatsAppButton />

      <LeadGateModal
        isOpen={leadGateOpen}
        context={leadContext}
        onClose={() => setLeadGateOpen(false)}
        onSubmitted={handleLeadSubmitted}
      />

      <UpiPaymentModal
        isOpen={upiOpen}
        onClose={() => setUpiOpen(false)}
        amount={service.offerPrice}
        itemName={service.title.en}
        itemId={service._id}
        itemType="service"
        onSuccess={refId => {
          setUpiOpen(false);
          toast.success(`Payment submitted! Ref: ${refId}`);
        }}
      />
    </>
  );
}
