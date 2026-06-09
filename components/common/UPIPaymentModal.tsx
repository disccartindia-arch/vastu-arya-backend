'use client';
/**
 * UPIPaymentModal.tsx — FIXED
 *
 * KEY FIXES:
 * 1. QR codes generated from aryavartguna@ybl (SBI) — PRIMARY verified working
 * 2. Fallback: vastuarya@ybl (IDBI)
 * 3. REMOVED: vastuarya@upi (INVALID — caused "UPI ID is invalid" error in Google Pay)
 * 4. QR generated via api.qrserver.com from UPI intent URL — works on all UPI apps
 * 5. Amount is always dynamic — never hardcoded
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, CheckCircle, ExternalLink, RefreshCw, AlertCircle, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

interface UPIData {
  primaryUPI:     string;   // aryavartguna@ybl
  fallbackUPI:    string;   // vastuarya@ybl
  payeeName:      string;
  amount:         number;
  upiLink:        string;   // upi://pay?pa=aryavartguna@ybl&...
  fallbackLink:   string;
  qrUrl:          string;   // QR image URL
  fallbackQrUrl:  string;
}

interface Props {
  open:         boolean;
  onClose:      () => void;
  upiData:      UPIData;
  bookingRef:   string;
  onConfirm:    (upiRef: string) => Promise<void>;
  loading:      boolean;
}

export default function UPIPaymentModal({ open, onClose, upiData, bookingRef, onConfirm, loading }: Props) {
  const [upiRef, setUpiRef]           = useState('');
  const [copied, setCopied]           = useState<'primary' | 'fallback' | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [qrLoaded, setQrLoaded]       = useState(false);
  const [qrError, setQrError]         = useState(false);

  useEffect(() => { if (!open) { setUpiRef(''); setShowFallback(false); setQrLoaded(false); setQrError(false); } }, [open]);

  const copyUPI = (id: string, type: 'primary' | 'fallback') => {
    navigator.clipboard?.writeText(id).then(() => {
      setCopied(type);
      toast.success(`UPI ID copied: ${id}`);
      setTimeout(() => setCopied(null), 3000);
    }).catch(() => toast.error('Could not copy'));
  };

  const activeUPI  = showFallback ? upiData.fallbackUPI  : upiData.primaryUPI;
  const activeLink = showFallback ? upiData.fallbackLink : upiData.upiLink;
  const activeQR   = showFallback ? upiData.fallbackQrUrl : upiData.qrUrl;
  const activeBank = showFallback ? 'IDBI Bank' : 'State Bank of India';

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[95vh] overflow-y-auto">

          {/* Header */}
          <div className="sticky top-0 bg-white rounded-t-3xl px-5 pt-5 pb-3 border-b border-gray-100 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900 text-base">Pay via UPI</h2>
                <p className="text-xs text-gray-500 mt-0.5">Scan QR or use UPI ID</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* Amount */}
            <div className="bg-orange-50 rounded-2xl p-4 text-center border border-orange-100">
              <p className="text-xs text-gray-500 mb-1">Amount to Pay</p>
              <p className="font-bold text-3xl" style={{ color: '#FF6B00' }}>₹{upiData.amount}</p>
              <p className="text-xs text-gray-400 mt-1">Booking Ref: {bookingRef}</p>
            </div>

            {/* Primary / Fallback toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowFallback(false); setQrLoaded(false); setQrError(false); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${!showFallback ? 'bg-primary text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                SBI (Primary)
              </button>
              <button
                onClick={() => { setShowFallback(true); setQrLoaded(false); setQrError(false); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${showFallback ? 'bg-primary text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                IDBI (Fallback)
              </button>
            </div>

            {/* QR Code */}
            <div className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center border border-gray-100">
              <p className="text-xs text-gray-500 mb-3 font-medium">{activeBank} · {activeUPI}</p>

              <div className="w-52 h-52 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 overflow-hidden">
                {!qrError ? (
                  <>
                    {!qrLoaded && (
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <RefreshCw size={24} className="animate-spin" />
                        <span className="text-xs">Loading QR…</span>
                      </div>
                    )}
                    <img
                      src={activeQR}
                      alt={`Pay ${upiData.amount} to ${activeUPI}`}
                      className={`w-full h-full object-contain ${qrLoaded ? 'block' : 'hidden'}`}
                      onLoad={() => setQrLoaded(true)}
                      onError={() => setQrError(true)}
                    />
                  </>
                ) : (
                  <div className="text-center text-gray-400 p-4">
                    <AlertCircle size={28} className="mx-auto mb-2" />
                    <p className="text-xs">QR failed to load</p>
                    <p className="text-xs mt-1">Use UPI ID below</p>
                  </div>
                )}
              </div>

              {/* UPI ID with copy */}
              <div className="mt-3 flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 border border-gray-200 w-full justify-between">
                <span className="font-mono text-sm font-semibold text-gray-800">{activeUPI}</span>
                <button
                  onClick={() => copyUPI(activeUPI, showFallback ? 'fallback' : 'primary')}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  {copied === (showFallback ? 'fallback' : 'primary')
                    ? <CheckCircle size={16} className="text-green-500" />
                    : <Copy size={16} className="text-gray-400" />
                  }
                </button>
              </div>
            </div>

            {/* App deep links */}
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2 text-center">Or open in payment app</p>
              <a
                href={activeLink}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)' }}>
                <Smartphone size={16} />
                Open Payment App — ₹{upiData.amount}
                <ExternalLink size={13} />
              </a>
              <p className="text-center text-xs text-gray-400 mt-1.5">
                Opens GPay · PhonePe · Paytm · BHIM · Paytm
              </p>
            </div>

            {/* UPI Reference input */}
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
              <p className="text-xs font-semibold text-amber-800 mb-2">After paying, enter your UPI Transaction ID</p>
              <input
                value={upiRef}
                onChange={e => setUpiRef(e.target.value)}
                placeholder="e.g. 426891234567 or T2406241234"
                className="w-full px-4 py-3 border border-amber-200 bg-white rounded-xl text-sm font-mono focus:outline-none focus:border-amber-400"
              />
              <p className="text-xs text-amber-600 mt-1.5">
                Found in your UPI app under transaction history
              </p>
            </div>

            {/* Submit */}
            <button
              onClick={() => onConfirm(upiRef)}
              disabled={loading || !upiRef.trim()}
              className="w-full py-4 rounded-2xl font-bold text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)' }}>
              {loading
                ? <><RefreshCw size={18} className="animate-spin" /> Submitting…</>
                : <>I have paid — Submit Reference</>
              }
            </button>

            <p className="text-center text-xs text-gray-400">
              Our team verifies UPI payments within 30 minutes. Booking activates only after verification.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
