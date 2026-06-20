"use client";
/**
 * components/leads/LeadGateModal.tsx
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 5 — requirements #3/#4:
 * pre-fill saved lead details, never ask twice):
 *
 * `onSubmitted`'s signature changed from `(leadId: string) => void` to
 * `(lead: LeadData) => void` — the backend's createLead response already
 * includes the full saved lead object (`data.lead`, added this round
 * alongside the pre-existing `data.leadId` for backwards compatibility),
 * so callers can now access the customer's name/phone/city/state/email
 * immediately after submission without a second request and, critically,
 * without ever asking the customer to type it again.
 *
 * BOTH consumers of this component were updated in this same round to
 * match (AppointmentPopup.tsx, app/(public)/services/[slug]/page.tsx) —
 * see CHANGELOG.md for explicit confirmation both were checked, given
 * Round 1's history of exactly this class of mistake (changing a shared
 * component's interface without updating every call site).
 *
 * Everything else in this file — the form fields, validation, the
 * mobile-zoom-safe 16px input sizing, the POST /api/leads call itself —
 * is unchanged from Round 4.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, MapPin, Mail, MessageSquare, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export interface LeadGateContext {
  serviceName: string;
  serviceId?: string;
  price: number;
  sourcePage: string;
}

// Exported so consumers can type their own onSubmitted handler against
// the same shape this component actually receives from the backend.
export interface LeadData {
  _id: string;
  name: string;
  phone: string;
  city: string;
  state: string;
  email?: string;
  message?: string;
  serviceName: string;
  serviceId?: string | null;
  price: number;
  status: 'PENDING_PAYMENT' | 'PAID' | 'FAILED' | 'CANCELLED';
}

interface LeadGateModalProps {
  isOpen: boolean;
  context: LeadGateContext | null;
  onClose: () => void;
  onSubmitted: (lead: LeadData) => void;
}

interface FormState {
  name: string;
  phone: string;
  city: string;
  state: string;
  email: string;
  message: string;
}

const EMPTY: FormState = { name: '', phone: '', city: '', state: '', email: '', message: '' };

function validate(form: FormState): string | null {
  if (!form.name.trim()) return 'Please enter your full name';
  if (!/^[6-9]\d{9}$/.test(form.phone.trim())) return 'Enter a valid 10-digit mobile number';
  if (!form.city.trim()) return 'Please enter your city';
  if (!form.state.trim()) return 'Please enter your state';
  return null;
}

export default function LeadGateModal({ isOpen, context, onClose, onSubmitted }: LeadGateModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const resetAndClose = () => {
    setForm(EMPTY);
    setSubmitting(false);
    onClose();
  };

  const handleSubmit = async () => {
    const err = validate(form);
    if (err) { toast.error(err); return; }
    if (!context) { toast.error('Something went wrong — please try again.'); return; }

    setSubmitting(true);
    try {
      const res = await api.post('/leads', {
        name: form.name.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        email: form.email.trim() || undefined,
        message: form.message.trim() || undefined,
        serviceName: context.serviceName,
        serviceId: context.serviceId,
        price: context.price,
        sourcePage: context.sourcePage,
      });

      // CHANGED: read the full lead object instead of just leadId.
      const lead: LeadData | undefined = res.data?.data?.lead;
      if (!res.data?.success || !lead) throw new Error(res.data?.message || 'Could not save your details');

      setForm(EMPTY);
      setSubmitting(false);
      onSubmitted(lead);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e.message || 'Could not save your details. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-4"
          onClick={resetAndClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={resetAndClose}
              className="absolute top-3 right-3 rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <h2 className="text-lg font-bold text-gray-900 pr-8">
              Almost there — your details
            </h2>
            {context && (
              <p className="text-sm text-gray-500 mt-1">
                {context.serviceName} — ₹{context.price.toLocaleString('en-IN')}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              We'll save your spot, then show you payment options. You won't need to enter this again.
            </p>

            <div className="mt-4 space-y-3">
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Full Name *"
                  disabled={submitting}
                  className="w-full pl-9 pr-3 py-3 text-base border border-gray-200 rounded-xl focus:outline-none focus:border-primary disabled:opacity-60"
                />
              </div>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="Mobile Number *"
                  type="tel"
                  maxLength={10}
                  disabled={submitting}
                  className="w-full pl-9 pr-3 py-3 text-base border border-gray-200 rounded-xl focus:outline-none focus:border-primary disabled:opacity-60"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={form.city}
                    onChange={set('city')}
                    placeholder="City *"
                    disabled={submitting}
                    className="w-full pl-9 pr-3 py-3 text-base border border-gray-200 rounded-xl focus:outline-none focus:border-primary disabled:opacity-60"
                  />
                </div>
                <input
                  value={form.state}
                  onChange={set('state')}
                  placeholder="State *"
                  disabled={submitting}
                  className="w-full px-3 py-3 text-base border border-gray-200 rounded-xl focus:outline-none focus:border-primary disabled:opacity-60"
                />
              </div>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={form.email}
                  onChange={set('email')}
                  placeholder="Email (optional)"
                  type="email"
                  disabled={submitting}
                  className="w-full pl-9 pr-3 py-3 text-base border border-gray-200 rounded-xl focus:outline-none focus:border-primary disabled:opacity-60"
                />
              </div>
              <div className="relative">
                <MessageSquare size={15} className="absolute left-3 top-3 text-gray-400" />
                <textarea
                  value={form.message}
                  onChange={set('message')}
                  placeholder="Briefly describe your concern (optional)"
                  rows={2}
                  disabled={submitting}
                  className="w-full pl-9 pr-3 py-3 text-base border border-gray-200 rounded-xl focus:outline-none focus:border-primary resize-none disabled:opacity-60"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-semibold text-white disabled:opacity-60"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
              {submitting ? 'Saving…' : 'Continue to Payment'}
            </button>
            <p className="text-center text-[11px] text-gray-400 mt-2">
              Your details are saved securely and used only to confirm your booking.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
