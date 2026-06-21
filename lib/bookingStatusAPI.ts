/**
 * lib/bookingStatusAPI.ts — NEW
 *
 * PRODUCTION HOTFIX ROUND 9 — Phase C Part 1, Feature 8 (reusable
 * architecture for future My Bookings / customer dashboard, without a
 * database or API redesign later).
 *
 * Deliberately a small, isolated module — not inlined into
 * StatusClient.tsx — specifically so a future authenticated
 * /my-bookings page can import getPublicStatus() (or a future sibling
 * export like getAuthenticatedBookingDetail()) without duplicating
 * fetch logic or importing from a page component.
 */
import api from './api';

export interface BookingTimelineEntry {
  field: 'paymentStatus' | 'bookingStatus';
  newValue: string;
  timestamp: string;
}

export interface PublicBookingStatus {
  bookingId: string;
  customerName: string;
  serviceName: string;
  amount: number;
  paymentStatus: 'pending' | 'submitted' | 'verified' | 'rejected' | 'refunded';
  bookingStatus: 'pending_payment' | 'payment_submitted' | 'confirmed' | 'consultation_scheduled' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  timeline: BookingTimelineEntry[];
}

export const bookingStatusAPI = {
  getPublicStatus: (bookingId: string) =>
    api.get<{ success: boolean; data: PublicBookingStatus; message?: string }>(`/bookings/status/${bookingId}/public`),

  // Future, not built this round (Feature 1 deferred per your
  // instruction): a sibling export like
  //   lookupByPhone: (phone: string, otp: string) =>
  //     api.post('/bookings/status/lookup', { method: 'phone', phone, otp }),
  // would resolve to the SAME PublicBookingStatus shape above, so
  // StatusClient.tsx's rendering logic would need zero changes to
  // support it later — only a new entry-point component calling this
  // file's (then-extended) API surface.
};
