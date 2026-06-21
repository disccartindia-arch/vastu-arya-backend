import type { Metadata } from 'next';
import StatusClient from './StatusClient';

export const metadata: Metadata = {
  title: 'Booking Status | Vastu Arya',
  description: 'Track your Vastu Arya booking status.',
  robots: { index: false, follow: false }, // personal lookup page, not for search engines — matches the existing convention used by payment-submitted and checkout
};

export default function Page({ params }: { params: { bookingId: string } }) {
  return <StatusClient bookingId={params.bookingId} />;
}
