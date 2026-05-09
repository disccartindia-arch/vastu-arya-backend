'use client';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
export default function PrivacyPage() {
  return (<><Navbar /><main className="max-w-3xl mx-auto px-4 py-16" style={{ minHeight: '70vh' }}>
    <h1 className="font-display text-3xl font-bold text-gray-800 mb-6">Privacy Policy</h1>
    <div className="prose prose-sm text-gray-600 space-y-4">
      <p>Your privacy is important to us. This policy explains how Vastu Arya collects and uses your information.</p>
      <h2 className="text-lg font-bold text-gray-800 mt-6">Information We Collect</h2>
      <p>We collect name, phone, email, and address only when you book a consultation or place an order.</p>
      <h2 className="text-lg font-bold text-gray-800 mt-6">How We Use It</h2>
      <p>Your information is used solely to fulfil your consultation or order. We do not sell or share your data with third parties.</p>
      <h2 className="text-lg font-bold text-gray-800 mt-6">Contact</h2>
      <p>For privacy concerns, please contact us via the <a href="/contact" className="text-primary hover:underline">Contact page</a>.</p>
    </div>
  </main><Footer /></>);
}
