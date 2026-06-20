"use client";
/**
 * components/common/AppointmentPopup.tsx
 * ─────────────────────────────────────────────────────────────────
 * Site-wide service/appointment popup. Lists active services with a
 * Razorpay button and a UPI button per service.
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 3 — CRITICAL REGRESSION
 * FIX, see BUTTON_AUDIT.md):
 *
 * ROOT CAUSE OF "EVERY BOOK BUTTON ON THE SITE STOPPED WORKING":
 * In Round 1, this component was rewritten to accept `isOpen` and
 * `onClose` as REQUIRED PROPS, replacing its original behavior of
 * managing its own visibility internally via useUIStore's
 * `showAppointmentPopup` / `setShowAppointmentPopup`. That interface
 * change was never propagated to any of the ~7 call sites across the
 * codebase (HomeClient.tsx, AboutClient.tsx, ServicesClient.tsx,
 * VastuStoreClient.tsx, CategoryClient.tsx, ServiceDetailPage,
 * BookAppointmentClient.tsx) — every one of them renders
 * `<AppointmentPopup />` with ZERO props, exactly as the ORIGINAL
 * component required.
 *
 * With the Round 1 interface, `isOpen` was therefore always
 * `undefined` at every call site, so `{isOpen && (...)}` never
 * rendered — REGARDLESS of how many places in the app correctly called
 * `setShowAppointmentPopup(true)`. Every "Book Appointment @ ₹11",
 * "Book Now", "Book Consultation", and floating sticky button on the
 * entire site was clicking a handler that correctly flipped a Zustand
 * store value that this component had silently stopped listening to.
 * This is why the buttons appeared completely dead with no console
 * error: the click handlers all fired successfully, the state update
 * happened successfully, nothing was actually broken except this one
 * component no longer reading the state it used to read.
 *
 * FIX: reverted to self-managed visibility via useUIStore
 * (`showAppointmentPopup` / `setShowAppointmentPopup`), so EVERY
 * existing call site across the codebase — all of which render
 * `<AppointmentPopup />` with no props — works correctly again with
 * zero changes needed to any of those other files. The component now
 * takes NO required props at all (an optional `lang` prop is kept for
 * forward compatibility but is unused by any current call site).
 *
 * All of Round 1's actual improvements (the `loadError` retry UI for
 * failed service fetches) are preserved unchanged below — only the
 * visibility-control mechanism is reverted. The dead UPI code removal
 * from Round 1 (UPIPaymentModal.tsx import deletion, handlePayWithUPI/
 * handlePayWithUPIConfirm removal) is also preserved, since that part
 * was correct and unrelated to this bug.
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
import { useUIStore } from "@/store/uiStore";

interface Service {
  _id: string;
  title: { en: string; hi: string };
  shortDesc?: { en: string; hi: string };
  offerPrice: number;
  originalPrice: number;
}

// FIXED: no required props anymore. `lang` kept optional for forward
// compatibility; every current call site renders <AppointmentPopup />
// with no props at all, exactly like the rest of the codebase expects.
interface AppointmentPopupProps {
  lang?: "en" | "hi";
}

export default function AppointmentPopup({ lang = "en" }: AppointmentPopupProps) {
  // FIXED: visibility is self-managed via the shared UI store again,
  // matching every call site's expectation across the whole app.
  const { showAppointmentPopup, setShowAppointmentPopup } = useUIStore();
  const onClose = useCallback(() => setShowAppointmentPopup(false), [setShowAppointmentPopup]);

  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
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
      })
      .catch(() => {
        setLoadError(true);
        toast.error("Could not load services. Please try again.");
      })
      .finally(() => setLoadingServices(false));
  }, []);

  useEffect(() => {
    if (!showAppointmentPopup || services.length) return;
    loadServices();
  }, [showAppointmentPopup, services.length, loadServices]);

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
        {showAppointmentPopup && (
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
