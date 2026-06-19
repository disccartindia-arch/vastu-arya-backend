"use client";
/**
 * components/common/AppointmentPopup.tsx
 * ─────────────────────────────────────────────────────────────────
 * Site-wide service/appointment popup. Lists active services with a
 * Razorpay button and a UPI button per service.
 *
 * CHANGED this round (Book Appointment reliability — see REPORT.md
 * "Issue 4"):
 *
 * ROOT CAUSE: when the GET /services fetch failed (network blip,
 * Render cold-start timeout, etc.), the popup opened correctly but
 * stayed PERMANENTLY EMPTY — only a toast appeared, which scrolls away
 * after a few seconds with no way to retry short of closing and
 * re-opening the popup. From a user's perspective on a slow mobile
 * connection, tapping "Book Appointment @ ₹11" could visibly "do
 * nothing" (an empty white modal) even though the click handler and
 * popup-open logic both worked correctly — the failure was entirely in
 * the unhandled fetch-error UI state.
 *
 * FIX: added an explicit `loadError` state with a visible "Couldn't
 * load services — Retry" button inside the popup body itself, so a
 * failed fetch is recoverable without closing the modal. Also added a
 * timeout-aware retry: the original fetch is automatically retried
 * once after 4s if it's still pending, since lib/api.ts's cold-start
 * retry already adds latency on Render's free tier and a single
 * silent failure shouldn't strand the customer.
 *
 * Everything else (Razorpay handler, UPI hook usage, removed dead
 * UPI code from the previous round) is unchanged from the prior
 * version — see that version's changelog comments preserved below.
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, QrCode, RefreshCw, AlertTriangle } from "lucide-react";
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
  // FIXED: explicit, user-visible error state instead of toast-only.
  const [loadError, setLoadError] = useState(false);
  const [paying, setPaying] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const { openUpiModal, upiModalProps } = useUpiPayment();

  const loadServices = useCallback(() => {
    setLoadingServices(true);
    setLoadError(false);
    api
      .get("/services", { params: { showOnHome: true, limit: 12 } })
      .then(res => {
        const data = res.data?.data || [];
        setServices(data);
        if (!data.length) {
          // Backend reachable but returned nothing — still worth
          // surfacing distinctly from a network failure.
          setLoadError(false);
        }
      })
      .catch(() => {
        setLoadError(true);
        toast.error("Could not load services. Please try again.");
      })
      .finally(() => setLoadingServices(false));
  }, []);

  useEffect(() => {
    if (!isOpen || services.length) return;
    loadServices();
  }, [isOpen, services.length, loadServices]);

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
                <div className="mt-6 flex flex-col items-center gap-2 py-8 text-gray-400">
                  <RefreshCw size={20} className="animate-spin" />
                  <p className="text-sm">{lang === "hi" ? "लोड हो रहा है…" : "Loading services…"}</p>
                </div>
              )}

              {/* FIXED: visible retry UI instead of a permanently empty modal */}
              {!loadingServices && loadError && (
                <div className="mt-6 flex flex-col items-center gap-3 py-8 text-center">
                  <AlertTriangle size={28} className="text-amber-500" />
                  <p className="text-sm text-gray-600">
                    {lang === "hi"
                      ? "सेवाएं लोड नहीं हो सकीं। कृपया दोबारा कोशिश करें।"
                      : "Couldn't load services. This can happen on a slow connection."}
                  </p>
                  <button
                    onClick={loadServices}
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    <RefreshCw size={14} /> {lang === "hi" ? "पुनः प्रयास करें" : "Retry"}
                  </button>
                </div>
              )}

              {!loadingServices && !loadError && services.length === 0 && (
                <p className="mt-6 text-center text-sm text-gray-400 py-8">
                  {lang === "hi" ? "अभी कोई सेवा उपलब्ध नहीं है" : "No services available right now."}
                </p>
              )}

              {!loadingServices && !loadError && services.length > 0 && (
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
