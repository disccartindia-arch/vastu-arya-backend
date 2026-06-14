"use client";
/**
 * hooks/useUpiPayment.ts
 * ─────────────────────────────────────────────────────────────────
 * Universal hook that manages UPI modal state for any page:
 * services, products, consultations, bookings.
 *
 * Usage:
 *   const { openUpiModal, upiModalProps } = useUpiPayment();
 *
 *   // Open for a service:
 *   <button onClick={() => openUpiModal({ amount: 500, itemName: "Vastu Check", itemId: service._id, itemType: "service" })}>
 *     Pay via UPI
 *   </button>
 *
 *   // Render modal (once, near root of page):
 *   <UpiPaymentModal {...upiModalProps} />
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useCallback } from "react";

interface OpenUpiModalOptions {
  amount: number;           // in ₹ (rupees)
  itemName: string;
  itemId: string;
  itemType: "service" | "product" | "consultation" | "booking";
  bookingId?: string;
  onPaymentSubmitted?: (referenceId: string) => void;
}

export function useUpiPayment() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<OpenUpiModalOptions | null>(null);

  const openUpiModal = useCallback((options: OpenUpiModalOptions) => {
    setModalConfig(options);
    setIsOpen(true);
  }, []);

  const closeUpiModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const upiModalProps = {
    isOpen,
    onClose: closeUpiModal,
    amount: modalConfig?.amount ?? 0,
    itemName: modalConfig?.itemName ?? "",
    itemId: modalConfig?.itemId ?? "",
    itemType: modalConfig?.itemType ?? "service",
    bookingId: modalConfig?.bookingId,
    onPaymentSubmitted: modalConfig?.onPaymentSubmitted,
  };

  return { openUpiModal, closeUpiModal, upiModalProps, isUpiModalOpen: isOpen };
}
