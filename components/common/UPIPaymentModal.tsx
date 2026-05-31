'use client';
import { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, Clock, RefreshCw, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface UPIData {
  primaryUPI: string;
  fallbackUPI: string;
  payeeName: string;
  amount: number;
  upiLink: string;
  fallbackLink: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  upiData: UPIData | null;
  bookingRef: string;
  onConfirm: (upiRef: string) => void;
  loading?: boolean;
}

export default function UPIPaymentModal({ open, onClose, upiData, bookingRef, onConfirm, loading }: Props) {
  const [copied, setCopied] = useState(false);
  const [upiRef, setUpiRef] = useState('');
  const [useFallback, setUseFallback] = useState(false);
  const [step, setStep] = useState<'scan' | 'confirm'>('scan');

  const activeUPI  = useFallback ? upiData?.fallbackUPI : upiData?.primaryUPI;
  const activeLink = useFallback ? upiData?.fallbackLink : upiData?.upiLink;

  // QR image via qrserver.com — no npm package needed
  const qrUrl = activeLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(activeLink)}`
    : null;

  const copyUPI = () => {
    if (!activeUPI) return;
    navigator.clipboard?.writeText(activeUPI).then(() => {
      setCopied(true);
      toast.success('UPI ID copied!');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const openApp = (app: 'gpay' | 'phonepe' | 'paytm') => {
    if (!activeLink) return;
    const schemes: Record<string, string> = {
      gpay:    activeLink.replace('upi://', 'tez://'),
      phonepe: activeLink.replace('upi://', 'phonepe://'),
      paytm:   activeLink.replace('upi://', 'paytmmp://'),
    };
    window.location.href = schemes[app] || activeLink;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
         onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto"
           style={{ border: '1px solid rgba(212,160,23,0.2)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-orange-100">
          <div>
            <h2 className="font-display font-bold text-gray-800 text-lg">Pay via UPI</h2>
            <p className="text-xs text-gray-400 mt-0.5">Ref: {bookingRef}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {step === 'scan' ? (
          <div className="p-5 space-y-4">
            {/* Amount */}
            <div className="text-center py-3 bg-orange-50 rounded-2xl border border-orange-100">
              <p className="text-xs text-gray-400 mb-1">Amount to Pay</p>
              <p className="font-display text-3xl font-bold text-primary">₹{upiData?.amount}</p>
              <p className="text-xs text-gray-500 mt-1">{upiData?.payeeName}</p>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-3">
              {qrUrl ? (
                <div className="p-3 bg-white border-2 border-orange-200 rounded-2xl shadow-sm">
                  <img src={qrUrl} alt="UPI QR Code" width={220} height={220}
                       className="rounded-xl" loading="eager" />
                </div>
              ) : (
                <div className="w-[220px] h-[220px] bg-gray-100 rounded-2xl flex items-center justify-center">
                  <RefreshCw size={32} className="text-gray-300 animate-spin" />
                </div>
              )}
              <p className="text-xs text-gray-400 text-center">Scan with any UPI app</p>
            </div>

            {/* UPI ID */}
            <div className="flex items-center gap-3 bg-gray-50 border border-orange-200 rounded-2xl px-4 py-3">
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-0.5">UPI ID</p>
                <p className="font-bold text-gray-800 text-sm font-mono">{activeUPI}</p>
              </div>
              <button onClick={copyUPI}
                className="p-2 rounded-xl transition-all hover:bg-orange-100">
                {copied
                  ? <CheckCircle size={18} className="text-green-500" />
                  : <Copy size={18} className="text-primary" />}
              </button>
            </div>

            {/* App deep-links */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'gpay',    label: 'GPay',    color: 'bg-blue-50 text-blue-700 border-blue-200' },
                { id: 'phonepe', label: 'PhonePe', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                { id: 'paytm',   label: 'Paytm',   color: 'bg-sky-50 text-sky-700 border-sky-200' },
              ].map(app => (
                <button key={app.id}
                  onClick={() => openApp(app.id as any)}
                  className={`py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all hover:scale-105 ${app.color}`}>
                  <ExternalLink size={11} /> {app.label}
                </button>
              ))}
            </div>

            {/* Fallback toggle */}
            {upiData?.fallbackUPI && (
              <button onClick={() => setUseFallback(v => !v)}
                className="w-full text-xs text-gray-400 hover:text-primary transition-colors py-1">
                {useFallback
                  ? `↩ Switch back to primary (${upiData.primaryUPI})`
                  : `Having trouble? Try alternate UPI (${upiData.fallbackUPI})`}
              </button>
            )}

            {/* After payment */}
            <button onClick={() => setStep('confirm')}
              className="w-full py-4 rounded-2xl font-bold text-white text-sm"
              style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)' }}>
              ✅ I've Paid — Enter Transaction ID
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200">
              <Clock size={18} className="text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Enter your UPI transaction ID or reference number. Our team will verify and confirm your booking.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                UPI Transaction ID / Reference *
              </label>
              <input
                value={upiRef}
                onChange={e => setUpiRef(e.target.value)}
                placeholder="e.g. 426781234567 or T2312345678"
                className="w-full px-4 py-3 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('scan')}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
                ← Back
              </button>
              <button
                onClick={() => onConfirm(upiRef)}
                disabled={!upiRef.trim() || loading}
                className="flex-1 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)' }}>
                {loading ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
