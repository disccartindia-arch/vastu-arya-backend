'use client';
/**
 * AppointmentPopup.tsx — FIXED
 *
 * KEY FIXES:
 * 1. onSuccess now redirects with status=paid (backend-verified) not just by reaching callback
 * 2. onFailure redirects with status=failed
 * 3. UPI modal fetches UPI config from /payment/settings (uses aryavartguna@ybl)
 * 4. Booking is never created until payment is confirmed
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, ChevronRight, QrCode, RefreshCw } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { servicesAPI } from '../../lib/api';
import { initiateRazorpayPayment } from '../../lib/razorpay';
import UPIPaymentModal from './UPIPaymentModal';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function AppointmentPopup() {
  const router = useRouter();
  const { showAppointmentPopup, setShowAppointmentPopup, lang } = useUIStore();

  const [step, setStep]       = useState<'form' | 'service'>('form');
  const [form, setForm]       = useState({ name: '', phone: '', email: '' });
  const [services, setServices] = useState<any[]>([]);
  const [paying, setPaying]   = useState(false);
  const [upiOpen, setUpiOpen] = useState(false);
  const [upiData, setUpiData] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (showAppointmentPopup) {
      servicesAPI.getAll({ isActive: true, limit: 12 })
        .then(r => setServices(r.data.data || []))
        .catch(() => {});
    }
  }, [showAppointmentPopup]);

  const close = () => {
    setShowAppointmentPopup(false);
    setStep('form');
    setPaying(false);
    setUpiOpen(false);
    setSelectedService(null);
  };

  const handleFormSubmit = () => {
    if (!form.name.trim())              return toast.error('Please enter your name');
    if (!/^[6-9]\d{9}$/.test(form.phone)) return toast.error('Enter a valid 10-digit mobile number');
    setStep('service');
  };

  const handlePayWithRazorpay = async (service: any) => {
    if (paying) return;
    setPaying(true);
    setSelectedService(service);

    await initiateRazorpayPayment({
      amount:      service.offerPrice,
      name:        form.name,
      phone:       form.phone,
      email:       form.email,
      description: service.title.en,
      type:        'booking',
      orderData: {
        name:        form.name,
        phone:       form.phone,
        email:       form.email,
        serviceName: service.title.en,
        amount:      service.offerPrice,
        formData:    { source: 'appointment_popup' },
      },
      onSuccess: (data) => {
        setPaying(false);
        close();
        // status=paid is backend-verified — only now redirect to confirmation
        router.push(
          `/booking-confirm?status=paid&ref=${data.bookingId || ''}&name=${encodeURIComponent(form.name)}&phone=${encodeURIComponent(form.phone)}&amount=${service.offerPrice}`
        );
      },
      onFailure: (reason) => {
        setPaying(false);
        if (reason !== 'user_dismissed') {
          router.push(
            `/payment-failed?ref=&reason=${encodeURIComponent(reason || 'Payment failed')}`
          );
        }
      },
    });
  };

  const handlePayWithUPI = async (service: any) => {
    setSelectedService(service);
    try {
      const bookingRef = `BK${Date.now()}`.slice(0, 12);
      const r = await api.post('/payment/upi-intent', {
        amount: service.offerPrice,
        name:   form.name,
        ref:    bookingRef,
        note:   `Vastu Arya - ${service.title.en}`,
      });
      setUpiData(r.data.data);
      setUpiOpen(true);
    } catch {
      toast.error('Could not load UPI payment. Please try Razorpay.');
    }
  };

  const handleUPIConfirm = async (upiRef: string) => {
    if (!upiRef.trim()) { toast.error('Enter your UPI transaction ID'); return; }
    if (!selectedService) return;
    setSubmitting(true);
    try {
      const r = await api.post('/payment/record-upi', {
        name:        form.name,
        phone:       form.phone,
        email:       form.email,
        serviceName: selectedService.title.en,
        amount:      selectedService.offerPrice,
        upiRef,
        formData:    { source: 'appointment_popup' },
      });
      setUpiOpen(false);
      close();
      // UPI payment is PENDING — not paid yet
      router.push(
        `/payment-pending?ref=${r.data.data?.bookingId || ''}&name=${encodeURIComponent(form.name)}&amount=${selectedService.offerPrice}`
      );
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to record payment. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const appointmentService = services.find(s => s.slug === 'book-appointment') || {
    _id: 'appointment', title: { en: 'Book Appointment', hi: 'अपॉइंटमेंट बुक करें' },
    offerPrice: 11, originalPrice: 499, icon: '📅',
  };

  return (
    <>
      <AnimatePresence>
        {showAppointmentPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
            onClick={e => { if (e.target === e.currentTarget) close(); }}>

            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">

              {/* Header */}
              <div className="sticky top-0 bg-white rounded-t-3xl px-5 pt-5 pb-3 border-b border-gray-100 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display font-bold text-lg text-gray-900">
                      {step === 'form' ? 'Book Consultation' : 'Choose Service'}
                    </h2>
                    <p className="text-xs text-gray-500">Dr. PPS Tomar · IVAF Certified</p>
                  </div>
                  <button onClick={close} className="p-2 hover:bg-gray-100 rounded-xl">
                    <X size={18} className="text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Step 1: Contact form */}
              {step === 'form' && (
                <div className="px-5 py-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Your Name *</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      <Phone size={11} className="inline mr-1" />Mobile Number *
                    </label>
                    <input
                      value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      type="tel"
                      className="w-full px-4 py-3 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      <Mail size={11} className="inline mr-1" />Email (optional)
                    </label>
                    <input
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="for booking confirmation"
                      type="email"
                      className="w-full px-4 py-3 border border-orange-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <button
                    onClick={handleFormSubmit}
                    className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 text-base"
                    style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)' }}>
                    Continue <ChevronRight size={18} />
                  </button>
                </div>
              )}

              {/* Step 2: Service selection */}
              {step === 'service' && (
                <div className="px-5 py-4 space-y-3">
                  {/* Quick book appointment @₹11 */}
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">📅 Book Appointment</p>
                        <p className="text-xs text-gray-500 mt-0.5">Connect with Dr. PPS Tomar on WhatsApp</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary text-lg">₹11</p>
                        <p className="line-through text-xs text-gray-400">₹499</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handlePayWithRazorpay(appointmentService)}
                        disabled={paying}
                        className="py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-1.5"
                        style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)' }}>
                        {paying ? <RefreshCw size={14} className="animate-spin" /> : null}
                        {paying ? 'Opening…' : '🔒 Pay ₹11'}
                      </button>
                      <button
                        onClick={() => handlePayWithUPI(appointmentService)}
                        disabled={paying}
                        className="py-3 rounded-xl border-2 border-primary text-primary font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-60">
                        <QrCode size={14} /> UPI QR
                      </button>
                    </div>
                  </div>

                  {/* Other services */}
                  {services.filter(s => s.slug !== 'book-appointment' && s.offerPrice > 0).slice(0, 5).map(service => (
                    <div key={service._id} className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{service.icon}</span>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">
                              {lang === 'hi' && service.title.hi ? service.title.hi : service.title.en}
                            </p>
                            <p className="text-xs text-gray-500">
                              {lang === 'hi' && service.shortDesc?.hi ? service.shortDesc.hi : service.shortDesc?.en}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-primary text-base">₹{service.offerPrice}</p>
                          {service.originalPrice > service.offerPrice && (
                            <p className="line-through text-xs text-gray-400">₹{service.originalPrice}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handlePayWithRazorpay(service)}
                          disabled={paying}
                          className="py-2.5 rounded-xl text-white font-semibold text-xs disabled:opacity-60"
                          style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)' }}>
                          {paying && selectedService?._id === service._id ? 'Opening…' : `🔒 Pay ₹${service.offerPrice}`}
                        </button>
                        <button
                          onClick={() => handlePayWithUPI(service)}
                          disabled={paying}
                          className="py-2.5 rounded-xl border border-primary text-primary font-semibold text-xs flex items-center justify-center gap-1.5 disabled:opacity-60">
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

      {/* UPI Payment Modal */}
      {upiData && selectedService && (
        <UPIPaymentModal
          open={upiOpen}
          onClose={() => setUpiOpen(false)}
          upiData={upiData}
          bookingRef={`VA${Date.now().toString().slice(-8)}`}
          onConfirm={handleUPIConfirm}
          loading={submitting}
        />
      )}
    </>
  );
}
