"use client";
/**
 * components/payment/ServicePaymentButtons.tsx
 * ─────────────────────────────────────────────────────────────────
 * Payment button group for service pages.
 * Renders: [Pay via UPI] [Pay via Razorpay]
 *
 * - UPI button opens UpiPaymentModal
 * - Razorpay button opens Razorpay Checkout (unchanged)
 * - Old broken vastuarya@upi flow is completely removed
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

import React, { useState } from "react";
import UpiPaymentModal from "./UpiPaymentModal";
import { useUpiPayment } from "@/hooks/useUpiPayment";
import { formatAmount } from "@/config/payment.config";

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
      itemType: bookingId ? "booking" : "service",
      bookingId,
      onPaymentSubmitted: onUpiSubmitted,
    });
  };

  return (
    <>
      <div className={`flex flex-col sm:flex-row gap-2 ${className}`}>
        {/* UPI Payment Button */}
        <button
          onClick={handleUpiClick}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-orange-500 text-orange-700 bg-orange-50 hover:bg-orange-100 font-semibold text-sm transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="8" height="8" rx="1" fill="currentColor" opacity="0.8"/>
            <rect x="13" y="3" width="8" height="8" rx="1" fill="currentColor" opacity="0.8"/>
            <rect x="3" y="13" width="8" height="8" rx="1" fill="currentColor" opacity="0.8"/>
            <rect x="13" y="13" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.8"/>
            <rect x="19" y="13" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.8"/>
            <rect x="13" y="19" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.8"/>
            <rect x="17" y="17" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.8"/>
          </svg>
          Pay via UPI
          <span className="text-xs font-normal opacity-75">({formatAmount(amount)})</span>
        </button>

        {/* Razorpay Button - calls existing Razorpay flow unchanged */}
        {onRazorpayClick && (
          <button
            onClick={onRazorpayClick}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V10h16v8zm0-10H4V6h16v2z"/>
            </svg>
            Pay via Card / Net Banking
          </button>
        )}
      </div>

      {/* UPI Modal */}
      <UpiPaymentModal {...upiModalProps} />
    </>
  );
}
