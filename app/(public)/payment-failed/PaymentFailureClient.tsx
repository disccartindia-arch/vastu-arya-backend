'use client';
export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import { XCircle, RefreshCw, MessageCircle, QrCode, Home } from 'lucide-react';
import Link from 'next/link';

function FailedContent() {
  const params = useSearchParams();
  const ref    = params.get('ref')    || '';
  const reason = params.get('reason') || 'Payment was not completed.';
  const waMsg  = encodeURIComponent(
    `🙏 Namaste!\n\nMy payment failed.\nRef: ${ref}\nReason: ${reason}\n\nPlease help me complete my booking.`
  );

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full">
        {/* Icon */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={36} className="text-red-500" />
          </div>
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-3">
            <XCircle size={14} /> Payment Failed
          </div>
          <h1 className="font-display text-2xl font-bold text-text-dark mb-2">
            Payment Not Completed
          </h1>
          <p className="text-text-light text-sm">
            No amount has been deducted from your account. Please try again.
          </p>
        </div>

        {/* Reason */}
        {reason && reason !== 'Payment was not completed.' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
            <p className="text-xs text-red-600 font-semibold mb-1">Reason</p>
            <p className="text-sm text-red-700">{reason}</p>
          </div>
        )}

        {/* Ref card */}
        {ref && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 text-center"
               style={{ border:'1px solid rgba(212,160,23,0.22)' }}>
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Reference</p>
            <p className="font-mono font-bold text-lg text-primary">{ref}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/book-appointment"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-white"
            style={{ background:'linear-gradient(135deg,#FF6B00,#FF9933)' }}>
            <RefreshCw size={18} /> Try Again
          </Link>
          <Link href="/book-appointment"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-primary text-primary font-bold text-sm">
            <QrCode size={16} /> Pay via UPI QR Code
          </Link>
          <a href={`https://wa.me/917000343804?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#25D366] text-white font-semibold text-sm">
            <MessageCircle size={16} /> Get Help on WhatsApp
          </a>
          <Link href="/"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50">
            <Home size={16} /> Back to Home
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          If you were charged but booking is not confirmed, please contact us on WhatsApp immediately.
        </p>
      </div>
    </main>
  );
}

export default function PaymentFailurePage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-spin">🕉️</div></div>}>
        <FailedContent />
      </Suspense>
      <Footer />
    </>
  );
}
