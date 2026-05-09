'use client';
export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
function PaymentContent() {
  const params = useSearchParams();
  const orderId = params.get('orderId');
  return (<motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-orange mx-4" style={{ border: '1px solid rgba(212,160,23,0.15)' }}>
    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={40} className="text-green-500" /></div>
    <h1 className="font-display text-3xl font-bold text-text-dark mb-2">Order Confirmed!</h1>
    <p className="text-text-light mb-2">Thank you for your order. We will process it shortly.</p>
    {orderId && <p className="text-xs text-gray-400 mb-6 font-mono bg-gray-50 px-3 py-2 rounded-lg">Order ID: {orderId}</p>}
    <div className="flex flex-col gap-3"><Link href="/vastu-store" className="bg-primary text-white py-3 rounded-xl font-semibold block text-center">Continue Shopping</Link><Link href="/" className="border border-gray-200 py-3 rounded-xl font-semibold text-text-mid hover:border-primary hover:text-primary transition-colors block text-center">Back to Home</Link></div>
  </motion.div>);
}
export default function PaymentSuccessPage() {
  return (<><Navbar /><main className="min-h-screen bg-cream flex items-center justify-center py-20"><Suspense fallback={<div className="text-center text-text-light">Loading...</div>}><PaymentContent /></Suspense></main><Footer /></>);
}
