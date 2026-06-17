"use client";
/**
 * components/common/AppointmentPopup.tsx
 * ─────────────────────────────────────────────────────────────────
 * Site-wide service/appointment popup. Lists active services with a
 * Razorpay button and a UPI button per service.
 *
 * CHANGED this round — removed entirely:
 *   - handlePayWithUPI()    -> was calling api.post('/payment/upi-intent', …)
 *   - handleUPIConfirm()    -> was calling api.post('/payment/record-upi', …)
 *   - the `upiOpen`/`upiData`/`submitting` state that supported them
 *   - the import of components/common/UPIPaymentModal (a different,
 *     dynamic-QR-intent modal than components/payment/UpiPaymentModal)
 *   - the catch-block toast "Could not load UPI payment. Please try
 *     Razorpay." that fired on every single UPI click, since
 *     /payment/upi-intent never existed on the backend and 404'd 100% of
 *     the time
 *
 * Neither /payment/upi-intent nor /payment/record-upi were ever
 * implemented anywhere in the backend (confirmed by forensic trace in a
 * prior session) — this was dead, always-failing code, not a working
 * feature being removed.
 *
 * REPLACED WITH: the same useUpiPayment hook + UpiPaymentModal pattern
 * already used by ServicePaymentButtons.tsx, which now correctly calls
 * the real backend endpoint POST /api/payment/upi/submit. This keeps
 * exactly one UPI submission code path in the whole frontend instead of
 * two divergent ones.
 *
 * handlePayWithRazorpay() / initiateRazorpayPayment() are UNTOUCHED —
 * still calling the real, working POST /payment/create-order and
 * POST /payment/verify endpoints via lib/razorpay.ts.
 */

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, QrCode } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { initiateRazorpayPayment } from "@/lib/razorpay";
import UpiPaymentModal from "@/components/payment/UpiPaymentModal";
import { useUpiPayment } from "@/hooks/useUpiPayment";

interface Service {
  _id: string;
  title: { en: string; hi: string };
  shortDesc?: { en: string; hi: string };
  offerPrice: number;
  originalPrice: number;
}

interface AppointmentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: "en" | "hi";
}

export default function AppointmentPopup({ isOpen, onClose, lang = "en" }: AppointmentPopupProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [paying, setPaying] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const { openUpiModal, upiModalProps } = useUpiPayment();

  useEffect(() => {
    if (!isOpen || services.length) return;
    setLoadingServices(true);
    api
      .get("/services", { params: { showOnHome: true, limit: 12 } })
      .then(res => setServices(res.data?.data || []))
      .catch(() => toast.error("Could not load services. Please refresh and try again."))
      .finally(() => setLoadingServices(false));
  }, [isOpen, services.length]);

  const handlePayWithRazorpay = async (service: Service) => {
    setSelectedService(service);
    setPaying(true);
    try {
      await initiateRazorpayPayment({
        amount: service.offerPrice,
        type: "service",
        orderData: {
          name: "",
          phone: "",
          serviceName: lang === "hi" ? service.title.hi : service.title.en,
          amount: service.offerPrice,
        },
        onSuccess: () => {
          toast.success("Booking confirmed!");
          onClose();
        },
        onFailure: () => {
          toast.error("Payment failed. Please try again or use UPI.");
        },
      });
    } catch {
      toast.error("Could not start Razorpay checkout. Please try UPI instead.");
    } finally {
      setPaying(false);
    }
  };

  const handlePayWithUPI = (service: Service) => {
    setSelectedService(service);
    openUpiModal({
      amount: service.offerPrice,
      itemName: lang === "hi" ? service.title.hi : service.title.en,
      itemId: service._id,
      itemType: "service",
      onPaymentSubmitted: (referenceId: string) => {
        toast.success(`Payment submitted! Reference: ${referenceId}`);
        onClose();
      },
    });
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={onClose}
                className="absolute top-3 right-3 rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200"
                aria-label="Close"
              >
                <X size={18} />
              </button>

              <h2 className="text-lg font-bold text-gray-900">
                {lang === "hi" ? "अपॉइंटमेंट बुक करें" : "Book an Appointment"}
              </h2>

              {loadingServices && (
                <p className="mt-4 text-sm text-gray-500">{lang === "hi" ? "लोड हो रहा है…" : "Loading services…"}</p>
              )}

              {!loadingServices && (
                <div className="mt-4 space-y-3">
                  {services.map(service => (
                    <div key={service._id} className="rounded-xl border border-gray-100 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm text-gray-900">
                            {lang === "hi" ? service.title.hi : service.title.en}
                          </p>
                          <p className="text-xs text-gray-500">
                            {lang === "hi" && service.shortDesc?.hi ? service.shortDesc.hi : service.shortDesc?.en}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-primary text-base">₹{service.offerPrice}</p>
                          {service.originalPrice > service.offerPrice && (
                            <p className="line-through text-xs text-gray-400">₹{service.originalPrice}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handlePayWithRazorpay(service)}
                          disabled={paying}
                          className="py-2.5 rounded-xl text-white font-semibold text-xs disabled:opacity-60"
                          style={{ background: "linear-gradient(135deg,#FF6B00,#FF9933)" }}
                        >
                          {paying && selectedService?._id === service._id ? "Opening…" : `🔒 Pay ₹${service.offerPrice}`}
                        </button>
                        <button
                          onClick={() => handlePayWithUPI(service)}
                          disabled={paying}
                          className="py-2.5 rounded-xl border border-primary text-primary font-semibold text-xs flex items-center justify-center gap-1.5 disabled:opacity-60"
                        >
                          <QrCode size={12} /> UPI
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UPI Payment Modal — same component/endpoint used by ServicePaymentButtons */}
      <UpiPaymentModal {...upiModalProps} />
    </>
  );
}
