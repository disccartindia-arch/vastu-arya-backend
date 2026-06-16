'use client';
export const dynamic = 'force-dynamic';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import WhatsAppButton from '../../../components/common/WhatsAppButton';
import UpiPaymentModal from '../../../components/payment/UpiPaymentModal';
import { motion } from 'framer-motion';
import { MessageCircle, Smartphone, Shield, CheckCircle, Copy, QrCode } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

function BookingContent() {
  const params     = useSearchParams();
  const name       = params.get('name') || 'Valued Customer';
  const phone      = params.get('phone') || '';
  const refParam   = params.get('ref') || '';
  const amountStr  = params.get('amount') || '11';
  const [bookingRef] = useState(() => refParam || `VA${Date.now().toString().slice(-8).toUpperCase()}`);
  const [copied, setCopied]   = useState(false);
  const [upiOpen, setUpiOpen] = useState(false);
  const isConfirmed = !!refParam;

  const waMsg = `🙏 Namaste Dr. PPS Tomar!\n\nI want to confirm my Vastu consultation booking.\n\nName: ${name}\nPhone: ${phone}\nRef: ${bookingRef}`;
  const waUrl = `https://wa.me/917000343804?text=${encodeURIComponent(waMsg)}`;

  const copyRef = () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(bookingRef).then(() => {
      setCopied(true);
      toast.success('Reference copied!');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const amount = parseInt(amountStr, 10) || 11;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #FFFDF7 0%, #FFF8EE 50%, #FFFAF2 100%)' }}>
      <div className="max-w-xl mx-auto px-4 py-10 sm:py-16">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 mx-auto mb-5" style={{ borderColor: 'rgba(212,160,23,0.45)' }}>
            <img src="/logo.jpg" alt="Vastu Arya" className="w-full h-full object-cover" />
          </div>
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <CheckCircle size={15} />
            {isConfirmed ? 'Payment Confirmed! Booking Active' : 'Booking Request Received'}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#1A0A00' }}>
            Namaste, {name}! 🙏
          </h1>
          <p className="text-gray-600 text-base leading-relaxed">
            {isConfirmed ? 'Your appointment with Dr. PPS Tomar is confirmed.' : 'Complete the booking below.'}
          </p>
        </motion.div>

        {/* Booking reference */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-sm mb-5 text-center" style={{ border: '1px solid rgba(212,160,23,0.25)' }}>
          <p className="text-xs text-gray-400 mb-1 tracking-wider uppercase">Booking Reference</p>
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono font-bold text-2xl" style={{ color: '#FF6B00' }}>{bookingRef}</span>
            <button onClick={copyRef} className="p-2 hover:bg-orange-50 rounded-lg transition-colors">
              <Copy size={15} className={copied ? 'text-green-500' : 'text-gray-400'} />
            </button>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm mb-5" style={{ border: '1px solid rgba(212,160,23,0.22)' }}>
          <h2 className="font-display font-bold text-lg mb-4" style={{ color: '#1A0A00' }}>
            {isConfirmed ? 'Connect with Dr. PPS Tomar' : `Complete Your Booking — Only ₹${amount}`}
          </h2>

          {/* WhatsApp */}
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 w-full p-4 rounded-xl mb-3 transition-all"
            style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white' }}>
            <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"><MessageCircle size={22} /></div>
            <div className="flex-1 text-left">
              <p className="font-bold text-base">Book via WhatsApp</p>
              <p className="text-sm opacity-90">Connect with Dr. PPS Tomar instantly</p>
            </div>
            <span className="text-xs bg-white/25 px-2.5 py-1 rounded-full font-bold flex-shrink-0">RECOMMENDED</span>
          </a>

          {/* UPI QR payment */}
          <div className="flex items-start gap-4 p-4 rounded-xl mb-3" style={{ background: '#FFF8EE', border: '1px solid rgba(255,107,0,0.2)' }}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,107,0,0.1)' }}>
              <Smartphone size={20} style={{ color: '#FF6B00' }} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm mb-0.5" style={{ color: '#1A0A00' }}>Pay ₹{amount} via UPI</p>
              <p className="text-xs text-gray-500 mb-2">Scan QR or send to UPI ID below.</p>
              <code className="text-xs bg-white px-3 py-1.5 rounded-lg border font-mono font-semibold" style={{ color: '#FF6B00', borderColor: 'rgba(255,107,0,0.25)' }}>
                vastuarya@ybl
              </code>
              <button
                onClick={() => setUpiOpen(true)}
                className="mt-2 flex items-center gap-1.5 text-xs text-orange-600 font-semibold hover:underline"
              >
                <QrCode size={12} /> Open UPI QR Payment →
              </button>
            </div>
          </div>
        </motion.div>

        <div className="text-center mt-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline" style={{ color: '#FF6B00' }}>
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* UPI Modal */}
      <UpiPaymentModal
        isOpen={upiOpen}
        onClose={() => setUpiOpen(false)}
        amount={amount}
        itemName="Vastu Consultation"
        itemId={bookingRef}
        itemType="consultation"
        onSuccess={refId => {
          setUpiOpen(false);
          toast.success(`Payment submitted! Ref: ${refId}`);
        }}
      />
    </div>
  );
}

export default function BookingConfirmPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-5xl animate-spin">🕉️</div></div>}>
        <BookingContent />
      </Suspense>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
