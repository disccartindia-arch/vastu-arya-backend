/** @type {import('next').NextConfig} */

const nextConfig = {
  // ── Compression & production hardening ────────────────────────────────────
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,

  // ── Image optimisation ─────────────────────────────────────────────────────
  // Fix #1 — explicit remotePatterns + AVIF/WebP formats for next/image
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'www.vastuarya.com' },
      { protocol: 'https', hostname: 'vastuarya.com' },
      { protocol: 'https', hostname: 'vastu-arya-backend-1.onrender.com' },
      { protocol: 'https', hostname: '**' },      // keeps existing behaviour
      { protocol: 'http',  hostname: 'localhost' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // ── Environment variables ──────────────────────────────────────────────────
  env: {
    NEXT_PUBLIC_API_URL:            process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_RAZORPAY_KEY_ID:    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    NEXT_PUBLIC_WHATSAPP_NUMBER:    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  },

  // ── Redirects ──────────────────────────────────────────────────────────────
  // Fix #13 — Case-insensitive redirects so old external links never 404
  async redirects() {
    return [
      // Existing: bare-domain → www canonical (KEEP THIS)
      {
        source:      '/:path*',
        has:         [{ type: 'host', value: 'vastuarya.com' }],
        destination: 'https://www.vastuarya.com/:path*',
        permanent:   true,
      },

      // Fix #13a — Case-insensitive Vastu Store redirects
      { source: '/Vastu-Store',        destination: '/vastu-store',        permanent: true },
      { source: '/Vastu-Store/:path*', destination: '/vastu-store/:path*', permanent: true },
      { source: '/VASTU-STORE',        destination: '/vastu-store',        permanent: true },
      { source: '/VASTU-STORE/:path*', destination: '/vastu-store/:path*', permanent: true },

      // Fix #13b — All "Book Now" URL variants → /book-appointment
      { source: '/Book-Now',  destination: '/book-appointment', permanent: true },
      { source: '/book-now',  destination: '/book-appointment', permanent: true },
      { source: '/BOOK-NOW',  destination: '/book-appointment', permanent: true },
      { source: '/Book',      destination: '/book-appointment', permanent: true },

      // Fix #13c — Other common case-mismatch URLs from external backlinks
      { source: '/Services',         destination: '/services',         permanent: true },
      { source: '/Services/:path*',  destination: '/services/:path*',  permanent: true },
      { source: '/About',            destination: '/about',            permanent: true },
      { source: '/Contact',          destination: '/contact',          permanent: true },
      { source: '/Blog',             destination: '/blog',             permanent: true },
      { source: '/Blog/:path*',      destination: '/blog/:path*',      permanent: true },
    ];
  },

  // ── Security & caching headers ─────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'X-Frame-Options',         value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Long-cache for immutable hashed Next.js static assets
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Long-cache for images / fonts
        source: '/(.*)\\.(png|jpg|jpeg|webp|avif|svg|ico|woff2?)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Correct content-type for sitemap (served by app/sitemap.ts)
        source: '/sitemap.xml',
        headers: [
          { key: 'Content-Type',  value: 'application/xml; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=43200' },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          { key: 'Content-Type',  value: 'text/plain' },
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
