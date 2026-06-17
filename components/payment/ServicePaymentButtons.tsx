"use client";
/**
 * components/payment/ServicePaymentButtons.tsx
 * ─────────────────────────────────────────────────────────────────
 * Payment button group for service pages.
 * Renders: [Pay via UPI] [Pay via Razorpay]
 *
 * - UPI button opens UpiPaymentModal via the useUpiPayment hook
 * - Razorpay button delegates to the caller's existing Razorpay flow
 *   (onRazorpayClick) — unchanged, still goes through
 *   POST /payment/create-order + POST /payment/verify
 * - Old broken vastuarya@upi flow is completely removed
 *
 * CHANGED this round: no longer relies on the hook's previously-broken
 * onPaymentSubmitted -> onSuccess hand-off (fixed in useUpiPayment.ts),
 * so onUpiSubmitted below now actually fires when a payment is
 * submitted. itemType resolution updated to use 'consultation' when a
 * bookingId is already present (paying for an existing booking) vs
 * 'service' for a fresh service purchase — both are valid values in the
 * backend's itemType enum.
 *
 * Usage:
 *   <ServicePaymentButtons
 *     amount={500}
 *     serviceName="Vastu Consultancy"
 *     serviceId={service._id}
 *     bookingId={booking?._id}
 *   />
 * ─────────────────────────────────────────────────────────────────
 */

import React from "react";
import UpiPaymentModal from "./UpiPaymentModal";
import { useUpiPayment } from "@/hooks/useUpiPayment";
import { formatAmount } from "@/config/payment.config";
import { QrCode, ShieldCheck } from "lucide-react";

interface ServicePaymentButtonsProps {
  amount: number;          // ₹ rupees
  serviceName: string;
  serviceId: string;
  bookingId?: string;
  onUpiSubmitted?: (referenceId: string) => void;
  onRazorpayClick?: () => void;
  className?: string;
}

export default function ServicePaymentButtons({
  amount,
  serviceName,
  serviceId,
  bookingId,
  onUpiSubmitted,
  onRazorpayClick,
  className = "",
}: ServicePaymentButtonsProps) {
  const { openUpiModal, upiModalProps } = useUpiPayment();

  const handleUpiClick = () => {
    openUpiModal({
      amount,
      itemName: serviceName,
      itemId: serviceId,
      itemType: bookingId ? "consultation" : "service",
      bookingId,
      onPaymentSubmitted: onUpiSubmitted,
    });
  };

  return (
    <>
      <div className={`grid grid-cols-2 gap-2 ${className}`}>
        <button
          onClick={onRazorpayClick}
          className="py-2.5 rounded-xl text-white font-semibold text-xs"
          style={{ background: "linear-gradient(135deg,#FF6B00,#FF9933)" }}
        >
          <span className="flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} /> Pay {formatAmount(amount)}
          </span>
        </button>
        <button
          onClick={handleUpiClick}
          className="py-2.5 rounded-xl border border-primary text-primary font-semibold text-xs flex items-center justify-center gap-1.5"
        >
          <QrCode size={14} /> Pay via UPI
        </button>
      </div>

      <UpiPaymentModal {...upiModalProps} />
    </>
  );
}
