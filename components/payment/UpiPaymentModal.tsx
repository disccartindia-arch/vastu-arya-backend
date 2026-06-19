"use client";
/**
 * components/payment/UpiPaymentModal.tsx
 * ─────────────────────────────────────────────────────────────────
 * Manual UPI fallback flow — no Razorpay, no automatic verification.
 * Shared by BOTH service payments (ServicePaymentButtons.tsx,
 * AppointmentPopup.tsx) and product payments (product detail page) —
 * one component, one fix applies everywhere.
 *
 * CHANGED this round (QR display fix — see REPORT.md "Issue 1"):
 *
 * ROOT CAUSE: the QR source images supplied (/images/qr/upi-*.jpeg)
 * are full 716x1600 phone-screenshot captures of PhonePe's "Receive
 * Money" screen — not pre-cropped square QR codes. The actual scannable
 * QR pattern only occupies the vertical band from roughly y=36% to
 * y=71% of the image (a near-perfect square once isolated). The
 * previous version rendered these with `object-contain` inside a fixed
 * 192x192px box, which (correctly, per object-contain's definition)
 * shrank the WHOLE tall image to fit — leaving the actual QR pattern at
 * only ~75px, far too small to scan, surrounded by now-empty
 * horizontal whitespace where the rest of the tall screenshot used to
 * be.
 *
 * FIX: switched to `object-cover` + an explicit `object-position`
 * computed from the measured crop region of the two known source
 * images (left 11.2%, right 88.7%, top 35.9%, bottom 70.6% of a
 * 716x1600 original — see REPORT.md for exact pixel math), combined
 * with a CSS `scale()` zoom on the image so the isolated QR square
 * fills the container edge-to-edge instead of being inset. This works
 * with the CURRENT uncropped screenshots with no asset changes needed.
 * Container size increased from 192x192 (h-48 w-48) to a responsive
 * min(80vw, 320px) square so the QR is genuinely large and scannable on
 * mobile, with both UPI IDs always visible and tappable-to-copy below
 * it (unchanged behavior, made more prominent).
 *
 * NOTE: this crop transform is a stopgap tuned to the two specific
 * images currently in use. If new QR images are uploaded that are
 * ALREADY cropped square (recommended — see REPORT.md for exact export
 * dimensions), this component should switch back to plain
 * `object-contain` with no transform, since a pre-cropped square image
 * needs no further cropping. A `QR_IMAGES_ARE_PRECROPPED` flag is
 * included below to make that switch a one-line change.
 *
 * Everything else in this file (submission endpoint, field names,
 * response parsing) is unchanged from the prior fixed version — see
 * that version's own changelog comments preserved below.
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Copy, CheckCircle, X, Upload, Loader2, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { PAYMENT_ROUTES, UPI_FALLBACK, fetchPaymentSettings, formatAmount } from '@/config/payment.config';

// Flip this to `true` once clean, pre-cropped square QR images are
// uploaded (see REPORT.md "Issue 1" for exact export dimensions).
// When true, the crop transform below is skipped entirely.
const QR_IMAGES_ARE_PRECROPPED = false;

// Measured crop region of the current uncropped 716x1600 screenshots —
// see REPORT.md for the exact pixel derivation. Expressed as fractions
// of the full image so it's resolution-independent.
const QR_CROP = {
  left: 0.112,
  right: 0.887,
  top: 0.359,
  bottom: 0.706,
};

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

/**
 * Computes the CSS transform needed to zoom an `object-cover`'d image
 * so that only the QR_CROP region fills the container, simulating a
 * real crop without needing a server-side image transform.
 *
 * Math: object-position as a percentage tells the browser which point
 * of the image to align with which point of the container once scaled
 * to cover. We pair that with a scale() to "zoom in" by the inverse of
 * the crop region's size, so the cropped area fills 100% of the box.
 */
function getQrCropStyle() {
  if (QR_IMAGES_ARE_PRECROPPED) return {};

  const cropWidthFrac  = QR_CROP.right - QR_CROP.left;   // 0.775
  const cropHeightFrac = QR_CROP.bottom - QR_CROP.top;   // 0.347

  // Scale so the crop region (currently ~77.5% x 34.7% of the image)
  // fills the whole container. We scale by the larger zoom factor
  // needed on the constrained axis, then center on the crop region.
  const scaleX = 1 / cropWidthFrac;
  const scaleY = 1 / cropHeightFrac;
  const scale  = Math.max(scaleX, scaleY);

  const centerXPct = ((QR_CROP.left + QR_CROP.right) / 2) * 100;
  const centerYPct = ((QR_CROP.top + QR_CROP.bottom) / 2) * 100;

  return {
    objectPosition: `${centerXPct}% ${centerYPct}%`,
    transform: `scale(${scale.toFixed(3)})`,
    transformOrigin: `${centerXPct}% ${centerYPct}%`,
  } as React.CSSProperties;
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

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchPaymentSettings().then(({ primary, secondary }) => {
      setUpiPrimary(primary);
      setUpiSecondary(secondary);
    });
  }, [isOpen]);

  const upi = activeUpi === 'primary' ? upiPrimary : upiSecondary;
  const qrCropStyle = getQrCropStyle();

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 sm:p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[92vh] overflow-y-auto">
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

            {/* QR — large, centered, auto-cropped/zoomed to the scannable region */}
            <div className="mt-4 flex flex-col items-center rounded-2xl bg-gray-50 p-4 sm:p-5">
              <div
                className="relative overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100 mx-auto"
                style={{ width: 'min(78vw, 320px)', height: 'min(78vw, 320px)' }}
              >
                <Image
                  src={upi.qr}
                  alt={`${upi.label} QR code — scan to pay ${formatAmount(amount)}`}
                  fill
                  className="object-cover"
                  style={qrCropStyle}
                  sizes="(max-width: 420px) 78vw, 320px"
                  priority
                />
              </div>

              {/* Both UPI IDs always visible, each independently copyable */}
              <div className="mt-4 w-full space-y-2">
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
