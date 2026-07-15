'use client';
/**
 * Legacy /payment-failure route — kept for backwards compatibility with
 * any external redirect that still points here. It re-renders the same
 * enhanced failure UI as /payment-failed by delegating to that client.
 * Any incoming query params (ref, reason, amount) are preserved so the
 * user experience is identical.
 */
export const dynamic = 'force-dynamic';
import PaymentFailureClient from '../payment-failed/PaymentFailureClient';

export default function LegacyPaymentFailurePage() {
  return <PaymentFailureClient />;
}
