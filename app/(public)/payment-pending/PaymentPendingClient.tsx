'use client';
export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import { Clock, RefreshCw, MessageCircle, QrCode } from 'lucide-react';
import Link from 'next/link';

function PendingContent() {
  const params = useSearchParams();
  const ref    = params.get('ref')    || '';
  const name   = params.get('name')   || '';
  const amount = params.get('amount') || '11';
  const waMsg  = encodeURIComponent(
    `🙏 Namaste!\n\nI made a payment but it is showing pending.\nRef: ${ref}\nName: ${name}\nAmount: ₹${amount}\n\nPlease verify.`
  );

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full">
        {/* Icon */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={36} className="text-amber-500" />
          </div>
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-3">
            <Clock size={14} /> Payment Pending
          </div>
          <h1 className="font-display text-2xl font-bold text-text-dark mb-2">
            Payment Under Verification
          </h1>
          <p className="text-text-light text-sm leading-relaxed">
            Your payment is being verified. Your booking will be confirmed once the payment is received.
          </p>
        </div>

        {/* Ref card */}
        {ref && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 text-center"
               style={{ border:'1px solid rgba(212,160,23,0.22)' }}>
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Booking Reference</p>
            <p className="font-mono font-bold text-xl text-primary">{ref}</p>
            <p className="text-xs text-gray-400 mt-2">Save this for future reference</p>
          </div>
        )}

        {/* Info steps */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 space-y-3"
             style={{ border:'1px solid rgba(212,160,23,0.22)' }}>
          <h3 className="font-semibold text-gray-800 text-sm">What happens next?</h3>
          {[
            { step: '1', text: 'Our team verifies your payment within a few minutes.' },
            { step: '2', text: 'Your booking status updates to Confirmed automatically.' },
            { step: '3', text: 'Dr. PPS Tomar will contact you on your registered number.' },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                   style={{ background:'linear-gradient(135deg,#FF6B00,#FF9933)' }}>
                {s.step}
              </div>
              <p className="text-sm text-gray-600">{s.text}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {ref && (
            <Link href={`/order-status?ref=${ref}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-white text-sm"
              style={{ background:'linear-gradient(135deg,#FF6B00,#FF9933)' }}>
              <RefreshCw size={16} /> Check Status
            </Link>
          )}
          <Link href="/book-appointment"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-orange-200 text-primary font-semibold text-sm">
            <QrCode size={16} /> Pay via UPI Instead
          </Link>
          <a href={`https://wa.me/917000343804?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#25D366] text-white font-semibold text-sm">
            <MessageCircle size={16} /> WhatsApp for Help
          </a>
          <Link href="/" className="block text-center text-sm text-gray-400 hover:text-primary transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function PaymentPendingPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-spin">🕉️</div></div>}>
        <PendingContent />
      </Suspense>
      <Footer />
    </>
  );
}
