import type { Metadata } from 'next';
import PaymentSubmittedPage from './PaymentSubmittedClient';

export const metadata: Metadata = {
  title: 'Payment Submitted | Vastu Arya',
  description: 'Your UPI payment has been submitted and is pending verification.',
  robots: { index: false, follow: false },
};

export default PaymentSubmittedPage;
