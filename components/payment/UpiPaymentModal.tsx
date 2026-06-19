"use client";
/**
 * components/payment/UpiPaymentModal.tsx
 * ─────────────────────────────────────────────────────────────────
 * Manual UPI fallback flow — no Razorpay, no automatic verification.
 * Shared by Service payments, the ₹11 Book Appointment flow, and
 * Product payments — one component, fixes apply everywhere it's used.
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 2 — Issue #1, QR
 * over-cropped):
 *
 * ROOT CAUSE OF THE REGRESSION: the previous round's fix used
 * `object-cover` + a computed `object-position` + a CSS `scale()`
 * transform to zoom into the measured QR region of the (uncropped,
 * tall) source screenshots. That fix was visually correct in testing,
 * but real-device scanning (Paytm, PhonePe, Google Pay) failed because
 * QR codes require an intact "quiet zone" (a margin of plain white
 * space around the pattern) for reliable decode — most scanner
 * libraries refuse to lock onto a code if that margin is cropped too
 * tight, even if the QR's data modules themselves are all visible.
 * The scale()-zoom approach has no way to guarantee the quiet zone
 * survives, since it was derived from an approximate visual crop
 * region, not the QR's actual finder-pattern boundaries.
 *
 * FIX PER YOUR INSTRUCTION: removed ALL automatic cropping/zooming.
 * The image is now rendered with `object-contain` inside a much larger
 * container (320–400px desktop, 260–320px mobile, both responsive),
 * so the complete image — full quiet zone included — is always
 * visible and undistorted. This trades some visual "wasted space"
 * above/below the QR pattern (since the source images are tall
 * screenshots, not square crops) for guaranteed scannability, which is
 * the correct trade-off for a payment flow.
 *
 * Also added in this round:
 *  - "Open in UPI App" deep-link button (upi://pay intent) for mobile
 *    users who can't scan their own screen — opens GPay/PhonePe/Paytm/
 *    BHIM directly with the UPI ID and amount prefilled.
 *  - Used on BOTH primary and secondary UPI options.
 *  - Container sizing now explicitly responsive per your target
 *    (mobile 260–320px, desktop 320–400px) via CSS clamp().
 *
 * Submission logic (handleSubmit, field names, endpoint, response
 * parsing) is unchanged from the prior round.
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Copy, CheckCircle, X, Upload, Loader2, QrCode, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { PAYMENT_ROUTES, UPI_FALLBACK, fetchPaymentSettings, formatAmount } from '@/config/payment.config';

export interface UpiPaymentModalProps {
  isOpen:      boolean;
  onClose:     () => void;
  amount:      number;          // in ₹ (rupees, not paise)
  itemName:    string;
  itemId:      string;
  itemType:    'service' | 'product' | 'consultation' | 'booking' | 'order';
  bookingId?:  string;
  requiresAddress?: boolean;   // true for products
  onSuccess?:  (referenceId: string) => void;
}

type Step = 'payment' | 'upload' | 'done';
type UpiOption = { id: string; label: string; qr: string };

/** Builds a standard upi:// deep link so mobile users can tap to open their UPI app directly. */
function buildUpiIntentLink(upiId: string, payeeName: string, amount: number, note: string): string {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

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

  const [upiPrimary,   setUpiPrimary]   = useState<UpiOption>(UPI_FALLBACK.primary);
  const [upiSecondary, setUpiSecondary] = useState<UpiOption>(UPI_FALLBACK.secondary);
  const [payeeName,    setPayeeName]    = useState<string>(UPI_FALLBACK.payeeName);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchPaymentSettings().then(({ primary, secondary, payeeName: pn }) => {
      setUpiPrimary(primary);
      setUpiSecondary(secondary);
      if (pn) setPayeeName(pn);
    });
  }, [isOpen]);

  const upi = activeUpi === 'primary' ? upiPrimary : upiSecondary;

  const resetAndClose = useCallback(() => {
    setStep('payment'); setActiveUpi('primary'); setCopied(false);
    setScreenshot(null); setScreenshotPrev(null);
    setName(''); setPhone(''); setEmail(''); setAddress(''); setTxnId('');
    setSubmitting(false); setReferenceId('');
    onClose();
  }, [onClose]);

  const copyUpiId = useCallback(async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      toast.success('UPI ID copied!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Could not copy — please copy manually');
    }
  }, []);

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
      fd.append('screenshot',     screenshot);
      fd.append('amount',         String(amount));
      if (itemId) fd.append('itemId', itemId);
      fd.append('itemType',       itemType);
      fd.append('itemName',       itemName);
      fd.append('upiId',          upi.id);
      if (txnId.trim()) fd.append('transactionId', txnId.trim());
      fd.append('uploaderName',   name.trim());
      fd.append('uploaderPhone',  phone.trim());
      if (email.trim()) fd.append('email', email.trim());
      if (requiresAddress && address.trim()) {
        fd.append('formData', JSON.stringify({ address: address.trim() }));
      }

      const res  = await fetch(PAYMENT_ROUTES.upiSubmit, { method: 'POST', body: fd });
      const json = await res.json();

      if (!res.ok || !json.success) throw new Error(json.message || 'Submission failed');

      const newReferenceId = json.data?.referenceId;
      if (!newReferenceId) throw new Error('Server did not return a reference ID');

      setReferenceId(newReferenceId);
      setStep('done');
      onSuccess?.(newReferenceId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [screenshot, name, phone, address, requiresAddress, amount, itemId, itemType, itemName, upi.id, txnId, email, onSuccess]);

  if (!isOpen) return null;

  const intentLink = buildUpiIntentLink(upi.id, payeeName, amount, `${itemName} - Vastu Arya`);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 sm:p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[94vh] overflow-y-auto">
        <button
          onClick={resetAndClose}
          className="absolute top-3 right-3 z-10 rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {step === 'payment' && (
          <div className="p-5 pt-10 sm:p-6 sm:pt-10">
            <h3 className="flex items-center justify-center gap-2 text-lg font-bold text-gray-900 text-center">
              <QrCode size={20} className="text-primary" /> Pay via UPI
            </h3>
            <p className="mt-1 text-sm text-gray-500 text-center">{itemName} — {formatAmount(amount)}</p>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setActiveUpi('primary')}
                className={`flex-1 rounded-lg border py-2 text-xs font-semibold ${activeUpi === 'primary' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-500'}`}
              >
                {upiPrimary.label}
              </button>
              <button
                onClick={() => setActiveUpi('secondary')}
                className={`flex-1 rounded-lg border py-2 text-xs font-semibold ${activeUpi === 'secondary' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-500'}`}
              >
                {upiSecondary.label}
              </button>
            </div>

            {/* QR — FULL image, no crop, no zoom. Quiet zone fully intact. */}
            <div className="mt-4 flex flex-col items-center rounded-2xl bg-gray-50 p-4 sm:p-5">
              <div
                className="relative overflow-visible rounded-xl bg-white shadow-sm border border-gray-100 mx-auto"
                style={{
                  width:  'clamp(260px, 78vw, 400px)',
                  height: 'clamp(260px, 78vw, 400px)',
                }}
              >
                <Image
                  src={upi.qr}
                  alt={`${upi.label} QR code — scan to pay ${formatAmount(amount)}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 420px) 78vw, 400px"
                  priority
                />
              </div>
              <p className="mt-2 text-[11px] text-gray-400 text-center">
                Full QR shown — scan with any UPI app
              </p>

              {/* Open in UPI App — mobile deep link */}
              <a
                href={intentLink}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white"
              >
                <ExternalLink size={15} /> Open in UPI App
              </a>

              {/* Both UPI IDs always visible, each independently copyable */}
              <div className="mt-3 w-full space-y-2">
                {[upiPrimary, upiSecondary].map(option => (
                  <button
                    key={option.id}
                    onClick={() => copyUpiId(option.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                      option.id === upi.id ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-left">
                      <span className="block text-[11px] text-gray-400">{option.label}</span>
                      <span className="font-mono font-semibold text-gray-800">{option.id}</span>
                    </span>
                    {copied && option.id === upi.id
                      ? <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                      : <Copy size={16} className="text-gray-400 flex-shrink-0" />
                    }
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep('upload')}
              className="mt-5 w-full rounded-xl bg-primary py-3.5 font-semibold text-white"
            >
              I've Paid — Upload Screenshot
            </button>
          </div>
        )}

        {step === 'upload' && (
          <div className="p-5 pt-10 sm:p-6 sm:pt-10">
            <h3 className="text-lg font-bold text-gray-900">Confirm Your Payment</h3>
            <p className="mt-1 text-sm text-gray-500">We'll verify and confirm within a few hours.</p>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFile}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-4 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-6 text-gray-500 hover:border-primary hover:text-primary"
            >
              {screenshotPrev ? (
                <img src={screenshotPrev} alt="Screenshot preview" className="h-32 rounded-lg object-contain" />
              ) : (
                <>
                  <Upload size={24} />
                  <span className="mt-2 text-sm">Tap to upload payment screenshot</span>
                </>
              )}
            </button>

            <div className="mt-4 space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit mobile number" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              {requiresAddress && (
                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Delivery address" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              )}
              <input value={txnId} onChange={e => setTxnId(e.target.value)} placeholder="UPI transaction/UTR ID (optional)" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-semibold text-white disabled:opacity-60"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
              {submitting ? 'Submitting…' : 'Submit Payment'}
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center p-8 text-center">
            <CheckCircle size={48} className="text-green-600" />
            <h3 className="mt-3 text-lg font-bold text-gray-900">Payment Submitted!</h3>
            <p className="mt-1 text-sm text-gray-500">
              Reference ID: <span className="font-mono font-semibold text-gray-800">{referenceId}</span>
            </p>
            <p className="mt-2 text-sm text-gray-500">
              We'll verify your payment and confirm your {itemType === 'product' || itemType === 'order' ? 'order' : 'booking'} shortly.
            </p>
            <button onClick={resetAndClose} className="mt-5 w-full rounded-xl bg-primary py-3 font-semibold text-white">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
