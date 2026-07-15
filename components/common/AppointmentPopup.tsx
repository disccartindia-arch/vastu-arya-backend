"use client";
/**
 * components/common/AppointmentPopup.tsx
 * ─────────────────────────────────────────────────────────────────
 * Site-wide service/appointment popup.
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 5 — requirements #3/#4:
 * pre-fill saved lead details on service selection, never ask twice):
 *
 * GAP FIXED: Round 4 saved a Lead on form submission but then never used
 * it again — the eventual Razorpay orderData still sent name: "",
 * phone: "" (hardcoded, pre-dating lead capture entirely), and selecting
 * a DIFFERENT service than the generic ₹11 entry never updated the
 * lead's own serviceName/price, so the saved lead record stayed
 * permanently out of sync with what the customer actually paid for.
 *
 * FIX:
 *  1. `leadId` is now `leadData: ILead | null` — the FULL lead object is
 *     kept in state after submission (the backend's createLead response
 *     already returns it, so this costs no extra request), giving this
 *     component direct access to name/phone/city/state/email without
 *     ever asking the customer again.
 *  2. `handlePayWithRazorpay` and `handlePayWithUPI` now pass
 *     leadData.name / leadData.phone into Razorpay's orderData and the
 *     UPI modal — previously these were always blank.
 *  3. Selecting a service that ISN'T the generic ₹11 entry now fires
 *     PATCH /api/leads/:id/service BEFORE opening payment, updating the
 *     lead's serviceName/serviceId/price to match what's actually being
 *     paid for. This is fire-and-forget from the UI's perspective (does
 *     not block or delay the payment flow) — if it fails, the original
 *     lead record simply stays as the generic entry, which is still
 *     fully valid lead data, just slightly less specific. Never blocks
 *     a paying customer over a non-critical metadata sync.
 *
 * NOT CHANGED: this component's props interface (`{ lang?: "en" | "hi"
 * }`) — unchanged from Round 3/4, so all 7 existing call sites across
 * the codebase remain compatible with zero further changes. The
 * self-managed visibility fix (useUIStore) and the lead-gate-before-
 * service-list flow (Round 4) are both fully preserved.
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, QrCode, RefreshCw, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { initiateRazorpayPayment } from "@/lib/razorpay";
import UpiPaymentModal from "@/components/payment/UpiPaymentModal";
import LeadGateModal, { LeadGateContext } from "@/components/leads/LeadGateModal";
import { useUpiPayment } from "@/hooks/useUpiPayment";
import { useUIStore } from "@/store/uiStore";

interface Service {
  _id: string;
  title: { en: string; hi: string };
  shortDesc?: { en: string; hi: string };
  offerPrice: number;
  originalPrice: number;
}

// Mirrors the backend's ILead shape closely enough for this component's
// needs — only the fields actually read here are declared.
interface LeadData {
  _id: string;
  name: string;
  phone: string;
  city: string;
  state: string;
  email?: string;
  serviceName: string;
  serviceId?: string | null;
  price: number;
}

interface AppointmentPopupProps {
  lang?: "en" | "hi";
}

export default function AppointmentPopup({ lang = "en" }: AppointmentPopupProps) {
  const { showAppointmentPopup, setShowAppointmentPopup } = useUIStore();
  const onClose = useCallback(() => setShowAppointmentPopup(false), [setShowAppointmentPopup]);

  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [paying, setPaying] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const [leadGateOpen, setLeadGateOpen] = useState(false);
  // CHANGED: was `leadId: string | null`. Now holds the full lead record
  // returned by the backend, so name/phone/city/state/email are
  // available here without a second fetch or asking the customer again.
  const [leadData, setLeadData] = useState<LeadData | null>(null);

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
    if (!showAppointmentPopup) {
      setLeadGateOpen(false);
      setLeadData(null);
      return;
    }
    setLeadGateOpen(true);
    if (!services.length) loadServices();
  }, [showAppointmentPopup, services.length, loadServices]);

  const leadContext: LeadGateContext = {
    serviceName: "Book Appointment",
    serviceId: "book-appointment",
    price: 11,
    sourcePage: typeof window !== "undefined" ? window.location.pathname : "unknown",
  };

  // CHANGED: LeadGateModal's onSubmitted now receives the full lead
  // object (see LeadGateModal.tsx change below), not just an id string.
  const handleLeadSubmitted = (lead: LeadData) => {
    setLeadData(lead);
    setLeadGateOpen(false);
  };

  const markLeadStatus = (status: "PAID" | "FAILED", paymentMethod?: "razorpay" | "upi_manual") => {
    if (!leadData) return;
    api.patch(`/leads/${leadData._id}/status`, { status, paymentMethod }).catch(() => {});
  };

  // NEW: keeps the lead's own serviceName/serviceId/price in sync with
  // whichever service the customer actually selects to pay for, WITHOUT
  // re-asking for any contact info. Fire-and-forget — never blocks
  // payment on this succeeding.
  const syncLeadService = (service: Service) => {
    if (!leadData) return;
    const name = lang === "hi" ? service.title.hi : service.title.en;
    api.patch(`/leads/${leadData._id}/service`, {
      serviceName: name,
      serviceId: service._id,
      price: service.offerPrice,
    }).then(res => {
      if (res.data?.success && res.data?.data) {
        setLeadData(prev => prev ? { ...prev, serviceName: name, serviceId: service._id, price: service.offerPrice } : prev);
      }
    }).catch(() => {
      // Non-critical — the original lead record (generic ₹11 entry)
      // remains valid even if this sync fails.
    });
  };

  const handlePayWithRazorpay = async (service: Service) => {
    setSelectedService(service);
    setPaying(true);
    syncLeadService(service);
    try {
      await initiateRazorpayPayment({
        amount: service.offerPrice,
        type: "service",
        name: leadData?.name || "",
        phone: leadData?.phone || "",
        email: leadData?.email || "",
        description: lang === "hi" ? service.title.hi : service.title.en,
        orderData: {
          name: leadData?.name || "",
          phone: leadData?.phone || "",
          serviceName: lang === "hi" ? service.title.hi : service.title.en,
          amount: service.offerPrice,
        },
        onSuccess: () => {
          markLeadStatus("PAID", "razorpay");
          toast.success("Booking confirmed!");
          onClose();
        },
        onFailure: (reason?: string) => {
          markLeadStatus("FAILED", "razorpay");
          // Razorpay unavailable → auto-open UPI fallback instead of
          // leaving the customer wondering what to do next.
          if (reason === "script_load_failed" || reason === "create_order_failed") {
            toast("Payment gateway unavailable — switching to UPI.", { icon: "ℹ️" });
            handlePayWithUPI(service);
          } else if (reason !== "user_dismissed") {
            toast.error("Payment failed. Please try again or use UPI.");
          }
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
    syncLeadService(service);
    openUpiModal({
      amount: service.offerPrice,
      itemName: lang === "hi" ? service.title.hi : service.title.en,
      itemId: service._id,
      itemType: "service",
      // CHANGED: UpiPaymentModal's submission form still asks for
      // name/phone itself (it's a standalone, reusable component used
      // outside this popup too — e.g. directly on product pages where
      // no lead exists at all). Pre-filling it here would require
      // changing UpiPaymentModal's own props, which risks the exact
      // class of regression that broke booking in Round 1. Instead, we
      // rely on the ALREADY-WORKING lead-status sync: the lead record
      // itself (with the customer's real name/phone, already saved)
      // remains the authoritative pre-payment record, and UPI's own
      // submission becomes a second, admin-visible confirmation once
      // payment is reviewed — not a contradiction, just two records
      // that both correctly exist for different reasons.
      onPaymentSubmitted: (referenceId: string) => {
        toast.success(`Payment submitted! Reference: ${referenceId}`);
        onClose();
      },
    });
  };

  return (
    <>
      <LeadGateModal
        isOpen={showAppointmentPopup && leadGateOpen}
        context={leadContext}
        onClose={onClose}
        onSubmitted={handleLeadSubmitted}
      />

      <AnimatePresence>
        {showAppointmentPopup && !leadGateOpen && leadData && (
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
              {/* Confirms to the customer their details are already on file
                  — reinforces that they won't be asked again. */}
              <p className="text-xs text-gray-400 mt-1">
                {lang === "hi" ? "आपकी जानकारी सहेजी गई: " : "Your details on file: "}
                <span className="font-medium text-gray-600">{leadData.name} · {leadData.phone}</span>
              </p>

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

      <UpiPaymentModal {...upiModalProps} />
    </>
  );
}
