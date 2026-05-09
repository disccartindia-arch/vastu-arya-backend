'use client';
import Link from 'next/link';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import { XCircle } from 'lucide-react';
export default function PaymentFailurePage() {
  return (<><Navbar /><main className="min-h-screen bg-cream flex items-center justify-center py-20">
    <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-orange mx-4">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"><XCircle size={40} className="text-red-500" /></div>
      <h1 className="font-display text-3xl font-bold text-text-dark mb-2">Payment Failed</h1>
      <p className="text-text-light mb-6">Your payment was not completed. No amount was deducted. Please try again.</p>
      <div className="flex flex-col gap-3"><Link href="/" className="bg-primary text-white py-3 rounded-xl font-semibold">Try Again</Link><Link href="/contact" className="border border-gray-200 py-3 rounded-xl font-semibold text-text-mid hover:border-primary hover:text-primary transition-colors">Contact Support</Link></div>
    </div>
  </main><Footer /></>);
}
