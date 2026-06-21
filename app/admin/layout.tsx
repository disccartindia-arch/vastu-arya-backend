'use client';
/**
 * app/admin/layout.tsx
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 11 — Phase D): one new
 * navItems entry, 'Customer Lookup', linking to /admin/customers.
 * Everything else in this array and this file is byte-for-byte
 * unchanged from the Phase C version.
 */
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, Package, ShoppingBag, Calendar, BookOpen, Users,
  Settings, ImageIcon, MessageSquare, LogOut, Menu, X, Layers,
  ChevronRight, Globe, Sparkles, Rss, Wand2, QrCode, UserPlus, UserSearch,
} from 'lucide-react';

const navItems = [
  { href: '/admin',                    label: 'Dashboard',         icon: LayoutDashboard },
  { href: '/admin/website-editor',     label: 'Website Editor',    icon: Globe,         badge: 'NEW' },
  { href: '/admin/about',              label: 'About Page',        icon: Users,         badge: 'NEW' },
  { href: '/admin/ai-settings',        label: 'AI Vastu Settings', icon: Sparkles,      badge: 'NEW' },
  { href: '/admin/leads',              label: 'Booking Leads',     icon: UserPlus,      badge: 'NEW' },
  { href: '/admin/upi-verifications',  label: 'UPI Payments',      icon: QrCode,        badge: 'NEW' },
  { href: '/admin/customers',          label: 'Customer Lookup',   icon: UserSearch,    badge: 'NEW' },
  { href: '/admin/services',           label: 'Services',          icon: Layers },
  { href: '/admin/products',           label: 'Products',          icon: Package },
  { href: '/admin/product-generator',  label: 'AI Product Gen',    icon: Wand2 },
  { href: '/admin/orders',             label: 'Orders',            icon: ShoppingBag },
  { href: '/admin/bookings',           label: 'Bookings',          icon: Calendar },
  { href: '/admin/blogs',              label: 'Blogs',             icon: BookOpen },
  { href: '/admin/users',              label: 'Users',             icon: Users },
  { href: '/admin/social-posts',       label: 'Vastu Feed',        icon: Rss,           badge: 'NEW' },
  { href: '/admin/slider',             label: 'Slider',            icon: ImageIcon },
  { href: '/admin/popups',             label: 'Popups',            icon: MessageSquare },
  { href: '/admin/settings',           label: 'Settings',          icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router    = useRouter();
  const pathname  = usePathname();
  const { user, isAdmin } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = (require('react') as any).useState(false);

  useEffect(() => {
    if (pathname === '/admin/login') return;
    if (!user) { router.push('/admin/login'); return; }
    if (!isAdmin()) { router.push('/'); }
  }, [user, isAdmin, router, pathname]);

  if (pathname === '/admin/login') return <>{children}</>;
  if (!user || !isAdmin()) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 transition-transform duration-300 xl:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'linear-gradient(180deg,#0D0500 0%,#1A0800 100%)' }}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'rgba(212,160,23,0.15)' }}>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2" style={{ borderColor: 'rgba(212,160,23,0.4)' }}>
            <img src="/logo.jpg" alt="Vastu Arya" className="w-full h-full object-cover" />
          </div>
          <div><p className="font-display font-bold text-white text-sm">Vastu Arya</p><p className="text-xs" style={{ color: '#D4A017' }}>ADMIN V2.0</p></div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto xl:hidden text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map(item => {
            const Icon   = item.icon;
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                style={active ? { background: 'rgba(255,107,0,0.18)', color: '#FF8C33' } : {}}>
                <Icon size={16} className="flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge && <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(212,160,23,0.25)', color: '#D4A017', fontSize: '9px' }}>{item.badge}</span>}
                {active && <ChevronRight size={14} className="flex-shrink-0" style={{ color: '#FF8C33' }} />}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(212,160,23,0.1)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg,#D4A017,#FF6B00)' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Administrator</p>
            </div>
          </div>
          <button
            onClick={() => { useAuthStore.getState().logout(); router.push('/admin/login'); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 xl:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 xl:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 h-14 border-b bg-white" style={{ borderColor: 'rgba(212,160,23,0.1)' }}>
          <button onClick={() => setSidebarOpen(true)} className="xl:hidden p-2 rounded-lg hover:bg-orange-50"><Menu size={20} style={{ color: '#5C3D1E' }} /></button>
          <span className="font-semibold text-gray-700 text-sm">Admin Panel</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs font-medium hidden sm:block" style={{ color: '#D4A017' }}>✦ Vastu Arya v2.0</span>
            <Link href="/" target="_blank" className="text-xs text-primary hover:underline font-medium">View Site →</Link>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
