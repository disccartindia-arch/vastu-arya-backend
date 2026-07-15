'use client';
/**
 * app/(public)/payment-submitted/PaymentSubmittedClient.tsx
 * Enhanced submitted screen: keeps original meta panel, adds payment
 * timeline + light polling of GET /api/payment/upi/status/:ref every
 * 10s (max 3 min). Auto-forwards to /payment-success or /payment-failed
 * as soon as the backend flips the status.
 */
export const dynamic = 'force-dynamic';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import PaymentTimeline, { PaymentTimelineStep } from '../../../components/payment/PaymentTimeline';
import { PAYMENT_ROUTES } from '../../../config/payment.config';
import { CheckCircle, Clock, MessageCircle, Home, Layers, RefreshCw, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

function SubmittedContent() {
  const router = useRouter();
  const params  = useSearchParams();
  const ref     = params.get('ref')     || '';
  const service = params.get('service') || '';
  const amount  = params.get('amount')  || '';
  const [checks, setChecks] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const waMsg = encodeURIComponent(
    `🙏 Namaste!\n\nI submitted a UPI payment.\nRef: ${ref}\nService: ${service}\nAmount: ₹${amount}\n\nPlease confirm.`
  );

  useEffect(() => {
    if (!ref) return;
    let alive = true;
    const check = async () => {
      try {
        const res = await fetch(PAYMENT_ROUTES.upiStatus(ref), { cache: 'no-store' });
        const json = await res.json().catch(() => null);
        if (!alive) return;
        setChecks(c => c + 1);
        const status = (json?.data?.status || json?.data?.paymentStatus || '').toString().toLowerCase();
        if (status === 'verified' || status === 'paid') {
          router.push(`/payment-success?ref=${ref}&amount=${amount}&service=${encodeURIComponent(service)}`);
        } else if (status === 'rejected' || status === 'failed') {
          router.push(`/payment-failed?ref=${ref}&reason=verification_failed&amount=${amount}&service=${encodeURIComponent(service)}`);
        }
      } catch { /* keep polling */ }
    };
    const first = setTimeout(check, 5000);
    timerRef.current = setInterval(check, 10_000);
    const stop = setTimeout(() => { if (timerRef.current) clearInterval(timerRef.current); }, 3 * 60_000);
    return () => { alive = false; clearTimeout(first); clearTimeout(stop); if (timerRef.current) clearInterval(timerRef.current); };
  }, [ref, amount, service, router]);

  const copyRef = () => { if (ref) navigator.clipboard?.writeText(ref).then(() => toast.success('Reference copied')); };

  const timeline: PaymentTimelineStep[] = [
    { key: 'paid',       label: 'You paid via UPI',      status: 'done' },
    { key: 'submitted',  label: 'Screenshot submitted',  status: 'done' },
    { key: 'verifying',  label: 'Verification in progress', description: 'Usually completes in 1–2 hours.', status: 'active' },
    { key: 'confirmed',  label: 'Booking ID sent on WhatsApp', status: 'pending' },
  ];

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center py-16 px-4">
      <div className="max-w-lg w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg p-6 sm:p-8" style={{ border: '1px solid rgba(212,160,23,0.15)' }}>
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle size={36} className="text-green-600" />
            </div>
          </div>
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-xs font-semibold mb-3">
              <Clock size={12} /> Pending Verification
            </div>
            <h1 data-testid="payment-submitted-heading" className="font-display text-2xl font-bold text-text-dark mb-2">Payment Submitted</h1>
            <p className="text-text-light text-sm">We received your payment reference. Verification is in progress.</p>
          </div>

          <div className="bg-white rounded-2xl p-4 mb-4 space-y-2 text-sm" style={{ border: '1px solid rgba(212,160,23,0.22)' }}>
            {service && <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-semibold text-gray-800 text-right">{service}</span></div>}
            {amount && <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-primary">₹{amount}</span></div>}
            {ref && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Reference</span>
                <button data-testid="copy-ref-btn" onClick={copyRef} className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-gray-800 hover:text-primary transition-colors">
                  {ref} <Copy size={12} />
                </button>
              </div>
            )}
          </div>

          {ref && (
            <div className="bg-orange-50 rounded-2xl p-3 mb-4 text-xs text-gray-600 flex items-center justify-between border border-orange-100">
              <span className="inline-flex items-center gap-1.5"><RefreshCw size={12} className="animate-spin" /> Watching status…</span>
              <span data-testid="poll-checks">{checks} check{checks === 1 ? '' : 's'}</span>
            </div>
          )}

          <div className="mb-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment Timeline</h2>
            <PaymentTimeline steps={timeline} />
          </div>

          <div className="space-y-3">
            <Link href="/account/payments" data-testid="my-payments-btn"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-white text-sm"
              style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)' }}>
              View My Payments
            </Link>
            <Link href="/services" data-testid="services-btn"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-orange-200 text-primary font-semibold text-sm">
              <Layers size={16} /> Browse Services
            </Link>
            <a href={`https://wa.me/917000343804?text=${waMsg}`} target="_blank" rel="noopener noreferrer" data-testid="whatsapp-btn"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#25D366] text-white font-semibold text-sm">
              <MessageCircle size={16} /> Contact Support
            </a>
            <Link href="/" data-testid="home-btn" className="flex items-center justify-center gap-2 w-full py-2.5 text-gray-500 font-medium text-sm hover:text-primary transition-colors">
              <Home size={14} /> Return Home
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export default function PaymentSubmittedPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-spin">🕉️</div></div>}>
        <SubmittedContent />
      </Suspense>
      <Footer />
    </>
  );
}
