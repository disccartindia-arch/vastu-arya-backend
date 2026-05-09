'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import { useAuthStore } from '../../../store/authStore';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isLoggedIn } = useAuthStore();
  const router = useRouter();
  useEffect(() => { if (!isLoggedIn()) router.push('/login'); }, []);
  if (!user) return null;
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="font-display text-3xl font-bold text-text-dark mb-2">Namaste, {user.name}! 🙏</h1>
          <p className="text-text-light mb-8">Welcome to your Vastu Arya account</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[{ emoji: '📅', title: 'My Bookings', desc: 'View your service bookings', href: '#' }, { emoji: '🛒', title: 'My Orders', desc: 'Track your store orders', href: '#' }, { emoji: '⚙️', title: 'Account Settings', desc: 'Update your profile', href: '#' }].map((c, i) => (
              <Link key={i} href={c.href} className="bg-white p-6 rounded-2xl border border-orange-100 hover:shadow-orange transition-all text-center">
                <div className="text-4xl mb-3">{c.emoji}</div>
                <h3 className="font-semibold text-text-dark mb-1">{c.title}</h3>
                <p className="text-text-light text-sm">{c.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
