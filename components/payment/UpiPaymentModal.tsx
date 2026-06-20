"use client";
/**
 * components/payment/UpiPaymentModal.tsx
 * ─────────────────────────────────────────────────────────────────
 * PRODUCTION HOTFIX ROUND 7 — Issues 1, 2, 5 (see ROOT_CAUSE_REPORT.md
 * for full evidence trace).
 *
 * ISSUE 1 FIX — "Load Failed" on screenshot submission:
 * ROOT CAUSE: handleSubmit() called the browser's native `fetch()`
 * directly, with NO timeout and NO retry — unlike every other network
 * call in this codebase, which goes through lib/api.ts's axios instance
 * (25s timeout, automatic retry-once on cold-start-class failures, per
 * Round 1/2). On a weak/cellular connection hitting a cold Render
 * instance (confirmed scenario: the failing screenshot shows 1-bar
 * signal), an unconfigured fetch() can simply be killed by the browser's
 * own network stack with no useful error — on Safari/iOS this surfaces
 * as the generic, unhelpful "Load failed" message visible in the
 * screenshot, which is NOT a string this app's own code ever produces
 * (confirmed: no toast.error() call anywhere in the previous version of
 * this file says "Load failed" — that string comes from WebKit itself).
 *
 * FIX: added an AbortController-based explicit timeout (30s) AND a
 * single automatic retry on network-class failure (mirroring the
 * pattern lib/api.ts already uses successfully elsewhere), so a slow
 * cold start gets a real second chance instead of a silent, confusing
 * failure. Also added a clear, specific error message distinguishing
 * "still uploading, please wait" (timeout) from "couldn't reach the
 * server" (network failure) instead of a generic message.
 *
 * ISSUE 2 FIX — redirect to dedicated success page:
 * The previous in-modal "done" step is REPLACED with a redirect to
 * /payment-submitted, a new standalone page with the full
 * reference/service/amount/status display the brief specifies. The
 * modal still calls onSuccess() so callers (AppointmentPopup, product
 * pages, service pages) can close themselves, but navigation now
 * happens via Next.js router instead of staying inline.
 *
 * ISSUE 5 FIX — UPI intent "Invalid UPI" errors:
 * ROOT CAUSE: buildUpiIntentLink() used URLSearchParams().toString(),
 * which encodes spaces as '+' (correct for form bodies, INCORRECT for
 * UPI deep links per NPCI's spec, which expects standard %20
 * percent-encoding). Several UPI apps' deep-link parsers do not decode
 * '+' back to a space in the pn/tn fields, corrupting the payee name or
 * note and triggering "Invalid UPI" in strict parsers.
 *
 * FIX: replaced URLSearchParams with manual encodeURIComponent() per
 * field (which correctly produces %20, not +), and changed the
 * transaction note format from "{service} - Vastu Arya" to
 * "{ServiceName} Rs{Amount}" — matching the brief's explicit examples
 * ("Book Appointment Rs11", "Mobile Numerology Rs199", etc.) and
 * avoiding the ₹ currency symbol entirely, since some UPI app parsers
 * handle non-ASCII characters in the tn field inconsistently — this
 * removes a second potential parse-failure source at the same time.
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Copy, CheckCircle, X, Upload, Loader2, QrCode, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { PAYMENT_ROUTES, UPI_FALLBACK, fetchPaymentSettings, formatAmount } from '@/config/payment.config';

export interface UpiPaymentModalProps {
  isOpen:      boolean;
  onClose:     () => void;
  amount:      number;
  itemName:    string;
  itemId:      string;
  itemType:    'service' | 'product' | 'consultation' | 'booking' | 'order';
  bookingId?:  string;
  requiresAddress?: boolean;
  onSuccess?:  (referenceId: string) => void;
}

type Step = 'payment' | 'upload';
type UpiOption = { id: string; label: string; qr: string };

/**
 * FIXED (Issue 5): builds the upi:// deep link with correct percent-
 * encoding (%20 for spaces, via encodeURIComponent per-field) instead
 * of URLSearchParams' form-encoding (+ for spaces), which several UPI
 * apps' deep-link parsers do not handle correctly in the pn/tn fields.
 */
function buildUpiIntentLink(upiId: string, payeeName: string, amount: number, note: string): string {
  const parts = [
    `pa=${encodeURIComponent(upiId)}`,
    `pn=${encodeURIComponent(payeeName)}`,
    `am=${encodeURIComponent(amount.toFixed(2))}`,
    `cu=INR`,
    `tn=${encodeURIComponent(note)}`,
  ];
  return `upi://pay?${parts.join('&')}`;
}

/**
 * FIXED (Issue 1): fetch with an explicit timeout (AbortController) and
 * a single automatic retry on network-class failure — mirrors the
 * pattern lib/api.ts already uses for every other request in this app.
 */
async function uploadWithRetry(url: string, body: FormData, attempt = 1): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000); // 30s — generous for a cold Render start + multipart upload

  try {
    const res = await fetch(url, { method: 'POST', body, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isNetworkOrAbort =
      err?.name === 'AbortError' ||
      err?.message?.toLowerCase().includes('load failed') ||
      err?.message?.toLowerCase().includes('failed to fetch') ||
      err?.message?.toLowerCase().includes('network');

    if (isNetworkOrAbort && attempt < 2) {
      // Single retry — covers the Render cold-start case where the
      // first request wakes the instance and the second succeeds.
      await new Promise(r => setTimeout(r, 2000));
      return uploadWithRetry(url, body, attempt + 1);
    }
    throw err;
  }
}

export default function UpiPaymentModal({
  isOpen, onClose, amount, itemName, itemId, itemType, requiresAddress = false, onSuccess,
}: UpiPaymentModalProps) {
  const router = useRouter();
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
    setSubmitting(false);
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

      // FIXED (Issue 1): timeout + retry instead of a bare fetch().
      const res  = await uploadWithRetry(PAYMENT_ROUTES.upiSubmit, fd);
      const json = await res.json();

      if (!res.ok || !json.success) throw new Error(json.message || 'Submission failed');

      const newReferenceId = json.data?.referenceId;
      if (!newReferenceId) throw new Error('Server did not return a reference ID');

      onSuccess?.(newReferenceId);

      // FIXED (Issue 2): redirect to a dedicated success page instead
      // of showing an inline "done" step.
      const params = new URLSearchParams({
        ref: newReferenceId,
        service: itemName,
        amount: String(amount),
      });
      resetAndClose();
      router.push(`/payment-submitted?${params.toString()}`);
    } catch (err: any) {
      // FIXED (Issue 1): distinguish timeout from generic network failure
      // instead of one generic message, so the customer understands
      // what actually happened.
      if (err?.name === 'AbortError') {
        toast.error('The upload is taking longer than expected. Please check your connection and try again.');
      } else if (err?.message?.toLowerCase().includes('load failed') || err?.message?.toLowerCase().includes('failed to fetch')) {
        toast.error('Could not reach the server. Please check your connection and try again.');
      } else {
        toast.error(err.message || 'Failed to submit. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [screenshot, name, phone, address, requiresAddress, amount, itemId, itemType, itemName, upi.id, txnId, email, onSuccess, router]);

  if (!isOpen) return null;

  // FIXED (Issue 5): correct percent-encoding + note format matching
  // the brief's explicit spec ("Book Appointment Rs11", etc.)
  const intentLink = buildUpiIntentLink(upi.id, payeeName, amount, `${itemName} Rs${Math.round(amount)}`);

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

              <a
                href={intentLink}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white"
              >
                <ExternalLink size={15} /> Open in UPI App
              </a>

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
              disabled={submitting}
              className="mt-4 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-6 text-gray-500 hover:border-primary hover:text-primary disabled:opacity-60"
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
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" disabled={submitting} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-base disabled:opacity-60" />
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit mobile number" disabled={submitting} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-base disabled:opacity-60" />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)" disabled={submitting} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-base disabled:opacity-60" />
              {requiresAddress && (
                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Delivery address" disabled={submitting} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-base disabled:opacity-60" />
              )}
              <input value={txnId} onChange={e => setTxnId(e.target.value)} placeholder="UPI transaction/UTR ID (optional)" disabled={submitting} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-base disabled:opacity-60" />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-semibold text-white disabled:opacity-60"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
              {submitting ? 'Submitting…' : 'Submit Payment'}
            </button>
            {submitting && (
              <p className="mt-2 text-center text-xs text-gray-400">
                This can take up to 30 seconds on a slow connection — please don't close this window.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
