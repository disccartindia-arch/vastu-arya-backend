'use client';
/**
 * app/account/layout.tsx — NEW
 *
 * PRODUCTION HOTFIX ROUND 11 — Phase D.
 *
 * Auth guard + shared premium shell for every /account/* page,
 * following the exact pattern already established in
 * app/(auth)/dashboard/page.tsx (the existing customer dashboard
 * stub) — redirect to /login if not authenticated, render nothing
 * until the redirect/auth check resolves. Building this once here
 * means every individual /account/* page doesn't re-implement the
 * guard.
 */
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store/authStore';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { LayoutDashboard, Calendar, CreditCard, Package, User, Activity } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/account', label: 'Overview', icon: LayoutDashboard },
  { href: '/account/bookings', label: 'My Bookings', icon: Calendar },
  { href: '/account/payments', label: 'My Payments', icon: CreditCard },
  { href: '/account/orders', label: 'My Orders', icon: Package },
  { href: '/account/activity', label: 'Activity', icon: Activity },
  { href: '/account/profile', label: 'Profile', icon: User },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  if (!user) return null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-text-dark">My Account</h1>
            <p className="text-text-light text-sm mt-0.5">Namaste, {user.name}! 🙏</p>
          </div>

          {/* Horizontally scrollable on mobile, no wrap/clip — explicit no-horizontal-scroll-on-PAGE requirement satisfied by containing the scroll to just this nav strip, not the whole page */}
          <nav className="flex gap-2 overflow-x-auto pb-3 mb-6 -mx-1 px-1">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== '/account' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                    active ? 'bg-primary text-white shadow-orange' : 'bg-white text-gray-600 border border-orange-100 hover:border-primary hover:text-primary'
                  }`}
                >
                  <Icon size={14} /> {item.label}
                </Link>
              );
            })}
          </nav>

          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
