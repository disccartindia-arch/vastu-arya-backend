// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { vastuAryaJsonLd } from '@/lib/seo';
import Providers from '../components/Providers';

const LuxuryBackground = dynamic(
  () => import('../components/ui/LuxuryBackground'),
  { ssr: false }
);

// CHANGED this round (PRODUCTION HOTFIX ROUND 4 — Task 4, Mobile UX /
// unwanted zoom): added maximumScale: 1. Without this, iOS Safari
// auto-zooms the entire page to fit any focused <input>/<textarea> whose
// computed font-size is below 16px — and this codebase has several
// (globals.css's .input-style is 14px; many components use Tailwind's
// text-sm, also 14px, directly on inputs). Rewriting every input's font
// size across the whole codebase would be a much larger, riskier change
// for the same result — maximumScale: 1 is the standard, minimal,
// root-cause fix recommended for exactly this Safari behavior.
// userScalable is left at its default (enabled) so people who
// deliberately want to pinch-zoom for accessibility still can — this
// only stops the unwanted AUTOMATIC zoom on input focus, not manual
// zoom, which nobody asked to remove.
export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1, themeColor: '#FF6B00',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.vastuarya.com'),
  title: {
    default:  'Vastu Arya - IVAF Certified Vastu and Astrology Consultancy | Dr. PPS Tomar',
    template: '%s | Vastu Arya',
  },
  description: "India's premier Vastu Shastra, Astrology and Numerology platform by Dr. PPS Tomar - IVAF Certified Expert. 73,000+ happy clients. Book from just Rs.11.",
  keywords: ['vastu shastra','vastu expert India','vastu arya','Dr PPS Tomar','IVAF certified vastu consultant','astrology consultation','numerology expert','online vastu consultation','home vastu','business vastu','vastu remedies','gemstone guidance','rudraksha consultation','vastu new delhi'],
  alternates: { canonical: 'https://www.vastuarya.com/' },
  openGraph: {
    title:       'Vastu Arya - Transform Your Space, Transform Your Life',
    description: "India's premier Vastu and Astrology platform by IVAF Certified Expert Dr. PPS Tomar. 73,000+ Happy Clients.",
    url:         'https://www.vastuarya.com',
    siteName:    'Vastu Arya',
    locale:      'en_IN',
    type:        'website',
    images:      [{ url: '/logo.jpg', width: 1200, height: 630, alt: 'Vastu Arya - Dr. PPS Tomar' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Vastu Arya - IVAF Certified Vastu and Astrology | Dr. PPS Tomar',
    description: "India's premier Vastu Shastra and Astrology consultancy. Book with Dr. PPS Tomar from just Rs.11.",
    images:      ['/logo.jpg'],
    creator:     '@VastuArya',
    site:        '@VastuArya',
  },
  robots:       { index: true, follow: true, googleBot: { index: true, follow: true } },
  icons:        { icon: '/logo.jpg', apple: '/logo.jpg' },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(vastuAryaJsonLd) }}
        />
      </head>
      <body className="font-body bg-cream" suppressHydrationWarning>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-H2BMEXCRQT"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-H2BMEXCRQT');
          `}
        </Script>

        <LuxuryBackground />
        <Providers>
          <div className="relative z-10">{children}</div>
        </Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { background: '#1A0A00', color: '#FFF8F0', fontFamily: 'DM Sans, sans-serif', border: '1px solid rgba(212,160,23,0.2)' },
            success: { iconTheme: { primary: '#D4A017', secondary: '#FFF8F0' } },
          }}
        />
      </body>
    </html>
  );
}
