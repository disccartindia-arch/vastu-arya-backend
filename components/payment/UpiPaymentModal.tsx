'use client';
/**
 * components/payment/UpiPaymentModal.tsx
 *
 * Manual UPI payment modal with screenshot upload.
 * NO Razorpay. NO automatic verification. NO dynamic QR generation.
 *
 * Flow:
 *  1. Show QR + UPI ID + amount
 *  2. User pays in their UPI app
 *  3. User uploads screenshot + fills details
 *  4. POST /api/upi-payment  → status: PENDING_VERIFICATION
 *  5. Show confirmation screen with reference ID
 */

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Copy, CheckCircle, X, Upload, Loader2, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';

// ── UPI Configuration ─────────────────────────────────────────────
const UPI_PRIMARY   = { id: 'vastuarya@ybl',      label: 'Primary UPI',   qr: '/images/qr/upi-secondary-vastuarya.jpeg' };
const UPI_SECONDARY = { id: 'aryavartguna@ybl',   label: 'Alternative UPI', qr: '/images/qr/upi-primary-aryavartguna.jpeg' };

export interface UpiPaymentModalProps {
  isOpen:      boolean;
  onClose:     () => void;
  amount:      number;          // in ₹ (rupees, not paise)
  itemName:    string;
  itemId:      string;
  itemType:    'service' | 'product' | 'consultation';
  requiresAddress?: boolean;   // true for products
  onSuccess?:  (referenceId: string) => void;
}

type Step = 'payment' | 'upload' | 'done';

export default function UpiPaymentModal({
  isOpen, onClose, amount, itemName, itemId, itemType, requiresAddress = false, onSuccess,
}: UpiPaymentModalProps) {
  const [step,           setStep]           = useState<Step>('payment');
  const [activeUpi,      setActiveUpi]      = useState<'primary' | 'secondary'>('primary');
  const [copied,         setCopied]         = useState(false);
  const [screenshot,     setScreenshot]     = useState<File | null>(null);
  const [screenshotPrev, setScreenshotPrev] = useState<string | null>(null);
  const [name,           setName]           = useState('');
  const [phone,          setPhone]          = useState('');
  const [email,          setEmail]          = useState('');
  const [address,        setAddress]        = useState('');
  const [txnId,          setTxnId]          = useState('');
  const [submitting,     setSubmitting]     = useState(false);
  const [referenceId,    setReferenceId]    = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const upi = activeUpi === 'primary' ? UPI_PRIMARY : UPI_SECONDARY;

  const resetAndClose = useCallback(() => {
    setStep('payment'); setActiveUpi('primary'); setCopied(false);
    setScreenshot(null); setScreenshotPrev(null);
    setName(''); setPhone(''); setEmail(''); setAddress(''); setTxnId('');
    setSubmitting(false); setReferenceId('');
    onClose();
  }, [onClose]);

  const copyUpiId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(upi.id);
      setCopied(true);
      toast.success('UPI ID copied!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Could not copy — please copy manually');
    }
  }, [upi.id]);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { toast.error('Only JPG, PNG or WEBP allowed'); return; }
    if (file.size > 10 * 1024 * 1024)  { toast.error('File must be under 10 MB'); return; }
    setScreenshot(file);
    const reader = new FileReader();
    reader.onload = ev => setScreenshotPrev(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!screenshot)      { toast.error('Please upload your payment screenshot'); return; }
    if (!name.trim())     { toast.error('Please enter your name'); return; }
    if (!/^[6-9]\d{9}$/.test(phone)) { toast.error('Enter valid 10-digit mobile number'); return; }
    if (requiresAddress && !address.trim()) { toast.error('Please enter delivery address'); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('screenshot',  screenshot);
      fd.append('amount',      String(amount));
      fd.append('itemId',      itemId);
      fd.append('itemType',    itemType);
      fd.append('itemName',    itemName);
      fd.append('upiId',       upi.id);
      fd.append('txnId',       txnId.trim());
      fd.append('name',        name.trim());
      fd.append('phone',       phone.trim());
      fd.append('email',       email.trim());
      if (requiresAddress) fd.append('address', address.trim());

      const res  = await fetch('/api/upi-payment', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setReferenceId(data.referenceId);
      setStep('done');
      onSuccess?.(data.referenceId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [screenshot, name, phone, email, address, txnId, amount, itemId, itemType, itemName, upi.id, requiresAddress, onSuccess]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) resetAndClose(); }}
      role="dialog" aria-modal="true"
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[96vh] overflow-y-auto">

        {/* ── Header ── */}
        <div className="sticky top-0 z-10 bg-white rounded-t-3xl border-b border-orange-100 flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="font-display font-bold text-gray-900 text-base">Pay via UPI</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[220px]">{itemName}</p>
          </div>
          <button onClick={resetAndClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors" aria-label="Close">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* ══ STEP 1: Payment details ══════════════════════════════════ */}
        {step === 'payment' && (
          <div className="px-5 py-4 space-y-4">
            {/* Amount */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-2xl px-6 py-3">
                <span className="text-xs text-orange-600 font-medium">Amount to Pay</span>
                <span className="font-display font-bold text-2xl text-orange-700">₹{amount.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Pay this exact amount</p>
            </div>

            {/* UPI toggle */}
            <div className="flex gap-2">
              {(['primary', 'secondary'] as const).map(key => {
                const u = key === 'primary' ? UPI_PRIMARY : UPI_SECONDARY;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveUpi(key)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      activeUpi === key
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {u.label}
                  </button>
                );
              })}
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="relative w-52 h-52 rounded-2xl overflow-hidden border-2 border-orange-200 shadow-sm bg-gray-50">
                <Image
                  src={upi.qr}
                  alt={`QR Code for ${upi.id}`}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* UPI ID copy */}
            <div className="bg-gray-50 rounded-2xl p-3.5 flex items-center justify-between gap-3 border border-gray-100">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">UPI ID</p>
                <p className="font-mono font-bold text-gray-800 text-sm">{upi.id}</p>
              </div>
              <button
                onClick={copyUpiId}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-semibold transition-all flex-shrink-0 ${
                  copied ? 'bg-green-100 text-green-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700'
                }`}
              >
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <p className="text-xs font-bold text-blue-800 mb-2.5">How to pay:</p>
              <ol className="space-y-1.5">
                {[
                  'Open PhonePe, Google Pay, Paytm or any UPI app.',
                  `Scan QR code or send to ${upi.id}`,
                  `Pay exact amount: ₹${amount.toLocaleString('en-IN')}`,
                  'Take a screenshot of the success screen.',
                  'Come back here and click the button below.',
                ].map((step, i) => (
                  <li key={i} className="flex gap-2 text-xs text-blue-700">
                    <span className="font-bold flex-shrink-0 w-4">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <p className="text-center text-xs text-gray-400">
              Supported: PhonePe · Google Pay · Paytm · BHIM · All UPI apps
            </p>

            <button
              onClick={() => setStep('upload')}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-2xl transition-colors text-sm"
            >
              I Have Paid — Upload Screenshot →
            </button>
          </div>
        )}

        {/* ══ STEP 2: Upload + details ══════════════════════════════════ */}
        {step === 'upload' && (
          <div className="px-5 py-4 space-y-4">
            <div className="text-center">
              <p className="font-semibold text-gray-800 text-sm">Upload Payment Screenshot</p>
              <p className="text-xs text-gray-500 mt-1">
                Paid <strong>₹{amount.toLocaleString('en-IN')}</strong> to <strong>{upi.id}</strong>
              </p>
            </div>

            {/* Screenshot upload */}
            <div
              className="border-2 border-dashed border-orange-300 rounded-2xl p-4 cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all text-center"
              onClick={() => fileRef.current?.click()}
            >
              {screenshotPrev ? (
                <div className="relative w-full h-44 rounded-xl overflow-hidden">
                  <Image src={screenshotPrev} alt="Payment screenshot" fill className="object-contain" />
                </div>
              ) : (
                <div className="py-6">
                  <Upload size={28} className="text-orange-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 font-medium">Tap to upload screenshot</p>
                  <p className="text-xs text-gray-400 mt-1">JPG · PNG · WEBP · Max 10 MB</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleFile} className="hidden" />
            </div>
            {screenshotPrev && (
              <button onClick={() => fileRef.current?.click()} className="text-xs text-orange-600 underline w-full text-center">
                Change screenshot
              </button>
            )}

            {/* Customer details */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mobile Number <span className="text-red-500">*</span></label>
                <input
                  type="tel" value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email (optional)</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              {requiresAddress && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Address <span className="text-red-500">*</span></label>
                  <textarea
                    value={address} onChange={e => setAddress(e.target.value)}
                    placeholder="House no, Street, City, PIN code"
                    rows={3}
                    className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Transaction ID (optional)</label>
                <input
                  type="text" value={txnId} onChange={e => setTxnId(e.target.value)}
                  placeholder="UPI transaction reference number"
                  className="w-full px-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('payment')}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !screenshot}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Submitting…</>
                ) : (
                  'Submit Order ✓'
                )}
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 3: Success ══════════════════════════════════════════ */}
        {step === 'done' && (
          <div className="px-5 py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h3 className="font-display font-bold text-gray-900 text-lg">Payment Submitted!</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your payment screenshot has been received. Our team will verify it within{' '}
              <strong>2–4 hours</strong> and activate your {itemType}.
            </p>
            {referenceId && (
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Reference ID</p>
                <p className="font-mono font-bold text-gray-800">{referenceId}</p>
                <p className="text-xs text-gray-400 mt-1">Save this for your records</p>
              </div>
            )}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-800">
              <strong>Status: Pending Verification</strong><br />
              You will be contacted once our team verifies your payment.
            </div>
            <button
              onClick={resetAndClose}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-2xl transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
