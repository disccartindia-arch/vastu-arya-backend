"use client";
/**
 * components/payment/UpiPaymentModal.tsx
 * ─────────────────────────────────────────────────────────────────
 * Manual UPI fallback flow — no Razorpay, no automatic verification.
 *
 * Flow:
 *  1. Show QR + UPI ID + amount (fetched live from backend settings)
 *  2. User pays in their own UPI app
 *  3. User uploads screenshot + fills details
 *  4. POST {API_BASE_URL}/payment/upi/submit  → status: UPI_PENDING
 *  5. Show confirmation screen with reference ID
 *  6. Admin reviews and verifies/rejects from the admin panel — this
 *     modal never marks anything paid itself.
 *
 * CHANGED this round (fixing real bugs found in the previous version):
 *
 * 1. Submission endpoint was `fetch('/api/upi-payment', ...)` — a RELATIVE
 *    path, which hits this frontend's own Vercel domain instead of the
 *    Express backend. No such Next.js API route or backend handler ever
 *    existed, so every submission silently 404'd. Now points at the real,
 *    working backend endpoint: `${API_BASE_URL}/payment/upi/submit`.
 *
 * 2. Request field names didn't match what the backend controller reads:
 *    sent `name`/`phone`/`txnId`, backend's submitUpiPayment() expects
 *    `uploaderName`/`uploaderPhone`/`transactionId`. Fixed below. `address`
 *    wasn't read by the backend at all as a flat field — it's now packed
 *    into the optional `formData` JSON blob, which the backend stores on
 *    the created Booking (note: for product/order-type items the backend
 *    doesn't yet thread formData into Order.customerInfo.address — that's
 *    a backend follow-up, not something this file can fix).
 *
 * 3. Response shape didn't match: code expected a flat `{ referenceId }`,
 *    but the backend returns `{ success, message, data: { referenceId,
 *    status, bookingId, orderId } }`. Fixed the parsing below.
 *
 * 4. UPI_PRIMARY/UPI_SECONDARY were hardcoded locally in this file and
 *    had primary/secondary backwards relative to the backend's actual
 *    PaymentSettings (this file had 'vastuarya@ybl' as primary; the
 *    backend defines 'aryavartguna@ybl' as primary). Now fetched live
 *    from GET /payment/settings via config/payment.config.ts, with the
 *    corrected values used only as a fallback if that call fails.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Copy, CheckCircle, X, Upload, Loader2, QrCode } from 'lucide-react';
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

  // NEW — live UPI config, replacing the old hardcoded (and mislabeled)
  // UPI_PRIMARY/UPI_SECONDARY constants. Seeded with the corrected
  // fallback so the modal renders sensibly even before the fetch resolves.
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
      // FIXED: field names now match upiPayment.controller.ts's
      // submitUpiPayment() exactly — uploaderName/uploaderPhone/
      // transactionId instead of the old name/phone/txnId. `address`
      // (when present) now travels inside the formData JSON blob since
      // the backend has no flat `address` field on this endpoint.
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

      // FIXED: was a relative `/api/upi-payment` path (hit this frontend's
      // own Vercel domain, no handler ever existed there). Now hits the
      // real Express backend endpoint built in upiPayment.routes.ts.
      const res  = await fetch(PAYMENT_ROUTES.upiSubmit, { method: 'POST', body: fd });
      const json = await res.json();

      // FIXED: backend wraps the payload in { success, message, data: {...} }
      // rather than returning { referenceId } at the top level.
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={resetAndClose}
          className="absolute top-3 right-3 z-10 rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {step === 'payment' && (
          <div className="p-6 pt-10">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <QrCode size={20} className="text-primary" /> Pay via UPI
            </h3>
            <p className="mt-1 text-sm text-gray-500">{itemName} — {formatAmount(amount)}</p>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setActiveUpi('primary')}
                className={`flex-1 rounded-lg border py-1.5 text-xs font-medium ${activeUpi === 'primary' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-500'}`}
              >
                {upiPrimary.label}
              </button>
              <button
                onClick={() => setActiveUpi('secondary')}
                className={`flex-1 rounded-lg border py-1.5 text-xs font-medium ${activeUpi === 'secondary' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-500'}`}
              >
                {upiSecondary.label}
              </button>
            </div>

            <div className="mt-4 flex flex-col items-center rounded-xl bg-gray-50 p-4">
              <div className="relative h-48 w-48 overflow-hidden rounded-lg bg-white">
                <Image src={upi.qr} alt={`${upi.label} QR code`} fill className="object-contain" />
              </div>
              <button
                onClick={copyUpiId}
                className="mt-3 flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-mono text-gray-700 hover:bg-gray-100"
              >
                {upi.id} {copied ? <CheckCircle size={14} className="text-green-600" /> : <Copy size={14} />}
              </button>
            </div>

            <button
              onClick={() => setStep('upload')}
              className="mt-5 w-full rounded-xl bg-primary py-3 font-semibold text-white"
            >
              I've Paid — Upload Screenshot
            </button>
          </div>
        )}

        {step === 'upload' && (
          <div className="p-6 pt-10">
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
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white disabled:opacity-60"
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
