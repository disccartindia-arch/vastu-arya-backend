"use client";
/**
 * components/payment/UpiPaymentModal.tsx
 * ─────────────────────────────────────────────────────────────────
 * Full UPI payment modal for VastuArya.com
 * Handles: QR display, UPI ID copy, screenshot upload, "I Have Paid" flow
 * Used by: all services, products, consultations
 *
 * Props:
 *   isOpen        — controls modal visibility
 *   onClose       — called when user dismisses modal
 *   amount        — payment amount in ₹ (rupees, not paise)
 *   itemName      — service/product name shown in modal
 *   itemId        — DB ID of the item being paid for
 *   itemType      — "service" | "product" | "consultation" | "booking"
 *   bookingId     — optional booking/order ID (if already created)
 *   onPaymentSubmitted — called after "I Have Paid" is successfully processed
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { PAYMENT_CONFIG, getActiveUpi, formatAmount } from "@/config/payment.config";

interface UpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  itemName: string;
  itemId: string;
  itemType: "service" | "product" | "consultation" | "booking";
  bookingId?: string;
  onPaymentSubmitted?: (referenceId: string) => void;
}

type Step = "qr" | "upload" | "submitted";

export default function UpiPaymentModal({
  isOpen,
  onClose,
  amount,
  itemName,
  itemId,
  itemType,
  bookingId,
  onPaymentSubmitted,
}: UpiPaymentModalProps) {
  const activeUpi = getActiveUpi();
  const [step, setStep] = useState<Step>("qr");
  const [copied, setCopied] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploaderName, setUploaderName] = useState("");
  const [uploaderPhone, setUploaderPhone] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Copy UPI ID ──────────────────────────────────────────────
  const handleCopyUpiId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(activeUpi.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = activeUpi.id;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [activeUpi.id]);

  // ── File Selection ───────────────────────────────────────────
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setSubmitError("Please upload an image file (JPG, PNG, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError("File size must be under 5MB.");
      return;
    }
    setScreenshot(file);
    setSubmitError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  // ── Submit "I Have Paid" ─────────────────────────────────────
  const handleIHavePaid = useCallback(async () => {
    if (!screenshot) {
      setSubmitError("Please upload your payment screenshot.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append("screenshot", screenshot);
      formData.append("amount", String(amount));
      formData.append("itemId", itemId);
      formData.append("itemType", itemType);
      formData.append("upiId", activeUpi.id);
      formData.append("transactionId", transactionId.trim());
      formData.append("uploaderName", uploaderName.trim());
      formData.append("uploaderPhone", uploaderPhone.trim());
      if (bookingId) formData.append("bookingId", bookingId);

      const res = await fetch("/api/payment/upi-pending", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Submission failed. Please try again.");
      }

      setReferenceId(data.referenceId);
      setStep("submitted");
      onPaymentSubmitted?.(data.referenceId);
    } catch (err: any) {
      setSubmitError(err.message ?? "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [screenshot, amount, itemId, itemType, activeUpi.id, transactionId, uploaderName, uploaderPhone, bookingId, onPaymentSubmitted]);

  // ── Reset on close ───────────────────────────────────────────
  const handleClose = useCallback(() => {
    setStep("qr");
    setScreenshot(null);
    setScreenshotPreview(null);
    setUploaderName("");
    setUploaderPhone("");
    setTransactionId("");
    setSubmitError(null);
    setReferenceId(null);
    setCopied(false);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="UPI Payment"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Pay via UPI</h2>
            <p className="text-sm text-gray-500 truncate max-w-[220px]">{itemName}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── STEP 1: QR + Amount ──────────────────────────────── */}
        {step === "qr" && (
          <div className="px-5 py-4 space-y-4">
            {/* Amount Badge */}
            <div className="text-center">
              <span className="inline-block bg-orange-50 border border-orange-200 text-orange-800 text-2xl font-bold px-6 py-2 rounded-xl">
                {formatAmount(amount)}
              </span>
              <p className="text-xs text-gray-500 mt-1">Pay this exact amount</p>
            </div>

            {/* QR Image */}
            <div className="flex justify-center">
              <div className="relative w-56 h-56 rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
                <Image
                  src={activeUpi.qrImagePath}
                  alt={`UPI QR Code — ${activeUpi.id}`}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* UPI ID Copy */}
            <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-gray-500">UPI ID</p>
                <p className="text-sm font-mono font-semibold text-gray-800">{activeUpi.id}</p>
              </div>
              <button
                onClick={handleCopyUpiId}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium transition-all ${
                  copied
                    ? "bg-green-100 text-green-700"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-blue-800 mb-1.5">How to pay:</p>
              <ol className="space-y-1">
                {PAYMENT_CONFIG.upiInstructions.map((instruction, i) => (
                  <li key={i} className="flex gap-2 text-xs text-blue-700">
                    <span className="font-bold flex-shrink-0">{i + 1}.</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Supported apps */}
            <p className="text-center text-xs text-gray-400">
              Works with PhonePe · Google Pay · Paytm · BHIM · All UPI apps
            </p>

            {/* CTA */}
            <button
              onClick={() => setStep("upload")}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              I Have Paid — Upload Screenshot
            </button>
          </div>
        )}

        {/* ── STEP 2: Screenshot Upload ────────────────────────── */}
        {step === "upload" && (
          <div className="px-5 py-4 space-y-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                Upload your payment screenshot
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Amount paid: <strong>{formatAmount(amount)}</strong> to <strong>{activeUpi.id}</strong>
              </p>
            </div>

            {/* Screenshot Upload Zone */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-orange-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {screenshotPreview ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden">
                  <Image src={screenshotPreview} alt="Payment screenshot" fill className="object-contain" />
                </div>
              ) : (
                <div className="py-4">
                  <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-500">Tap to upload screenshot</p>
                  <p className="text-xs text-gray-400 mt-0.5">JPG, PNG · Max 5MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {screenshotPreview && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-orange-600 underline w-full text-center"
              >
                Change screenshot
              </button>
            )}

            {/* Optional transaction ID */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Transaction ID (optional but recommended)
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. 412345678901"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                placeholder="Full name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={uploaderPhone}
                onChange={(e) => setUploaderPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit mobile number"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                {submitError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("qr")}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                ← Back
              </button>
              <button
                onClick={handleIHavePaid}
                disabled={isSubmitting || !screenshot || !uploaderName.trim() || !uploaderPhone.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  "I Have Paid ✓"
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Submitted ────────────────────────────────── */}
        {step === "submitted" && (
          <div className="px-5 py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Payment Submitted!</h3>
            <p className="text-sm text-gray-600">
              Your payment screenshot has been received. Our team will verify it within{" "}
              <strong>2–4 hours</strong> and activate your {itemType}.
            </p>
            {referenceId && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Reference ID</p>
                <p className="font-mono text-sm font-semibold text-gray-800 mt-0.5">{referenceId}</p>
                <p className="text-xs text-gray-400 mt-1">Save this for your records</p>
              </div>
            )}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
              <strong>Status: Pending Verification</strong><br />
              You will receive a confirmation once admin verifies your payment.
            </div>
            <button
              onClick={handleClose}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
