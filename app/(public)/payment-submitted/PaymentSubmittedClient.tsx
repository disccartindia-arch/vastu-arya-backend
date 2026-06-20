'use client';
/**
 * app/(public)/payment-submitted/PaymentSubmittedClient.tsx — NEW
 *
 * PRODUCTION HOTFIX ROUND 7 — Issue 2 (dedicated confirmation page).
 *
 * Replaces the previous in-modal "done" step. UpiPaymentModal.tsx now
 * redirects here via router.push() with the reference ID, service name,
 * and amount passed as query params. This is a standalone page (not a
 * modal), matching the brief's explicit requirement, and includes
 * exactly the fields and message text specified in Issue 2.
 */
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import { CheckCircle, Clock, MessageCircle, Home, Layers } from 'lucide-react';

function SubmittedContent() {
  const params  = useSearchParams();
  const ref     = params.get('ref')     || '';
  const service = params.get('service') || '';
  const amount  = params.get('amount')  || '';

  const waMsg = encodeURIComponent(
    `🙏 Namaste!\n\nI submitted a UPI payment.\nRef: ${ref}\nService: ${service}\nAmount: ₹${amount}\n\nPlease confirm.`
  );

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={36} className="text-green-600" />
          </div>
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-3">
            <Clock size={14} /> Pending Verification
          </div>
          <h1 className="font-display text-2xl font-bold text-text-dark mb-2">
            Payment Submitted Successfully
          </h1>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 space-y-3" style={{ border: '1px solid rgba(212,160,23,0.22)' }}>
          {service && (
            <div className="flex items-center justify-between py-2 border-b border-orange-50">
              <span className="text-xs text-gray-400">Service</span>
              <span className="text-sm font-semibold text-gray-800 text-right">{service}</span>
            </div>
          )}
          {amount && (
            <div className="flex items-center justify-between py-2 border-b border-orange-50">
              <span className="text-xs text-gray-400">Amount</span>
              <span className="text-sm font-bold text-primary">₹{amount}</span>
            </div>
          )}
          {ref && (
            <div className="flex items-center justify-between py-2 border-b border-orange-50">
              <span className="text-xs text-gray-400">Reference ID</span>
              <span className="font-mono text-sm font-semibold text-gray-800">{ref}</span>
            </div>
          )}
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-gray-400">Status</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
              <Clock size={11} /> Pending Verification
            </span>
          </div>
        </div>

        <div className="bg-orange-50 rounded-2xl p-4 mb-6 text-sm text-orange-800 leading-relaxed" style={{ border: '1px solid rgba(255,107,0,0.15)' }}>
          Your payment has been received successfully. Verification normally takes 1–2 hours. Your Booking ID and confirmation will be sent through WhatsApp after verification.
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-white text-sm"
            style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)' }}
          >
            <Home size={16} /> Return Home
          </Link>
          <Link
            href="/services"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-orange-200 text-primary font-semibold text-sm"
          >
            <Layers size={16} /> View Services
          </Link>
          <a
            href={`https://wa.me/917000343804?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#25D366] text-white font-semibold text-sm"
          >
            <MessageCircle size={16} /> Contact Support
          </a>
        </div>
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
