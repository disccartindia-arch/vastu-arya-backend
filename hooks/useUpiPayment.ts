/**
 * hooks/useUpiPayment.ts
 * ─────────────────────────────────────────────────────────────────
 * Shared UI-state hook for opening/closing the UPI payment modal from
 * any page or component. Makes no API calls itself — that all lives in
 * UpiPaymentModal.tsx.
 *
 * FIXED this round: `upiModalProps` was spreading a prop named
 * `onPaymentSubmitted` onto <UpiPaymentModal />, but UpiPaymentModal's
 * actual prop for that callback is named `onSuccess`. Because this is a
 * plain object spread (not a literal), TypeScript's excess-property
 * checking doesn't catch a mismatch like this — it just silently no-ops:
 * the modal would call `onSuccess?.(...)`, find it undefined, and the
 * caller's onUpiSubmitted/toast-on-success logic would simply never run.
 * Confirmed by checking the modal's real prop interface (onSuccess) and
 * the prior wiring here (onPaymentSubmitted, no matching prop). Renamed
 * the *output* key below to onSuccess; the public hook API
 * (`openUpiModal({ onPaymentSubmitted })`) is unchanged so no caller
 * needs to update.
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
    // FIXED: was `onPaymentSubmitted: modalConfig?.onPaymentSubmitted` —
    // UpiPaymentModal's real prop is `onSuccess`. See note above.
    onSuccess: modalConfig?.onPaymentSubmitted,
  };

  return { openUpiModal, closeUpiModal, upiModalProps, isUpiModalOpen: isOpen };
}
