// app/robots.ts — Dynamic robots.txt replacing public/robots.txt
// IMPORTANT: You can optionally delete public/robots.txt after adding this file.
// If both exist, public/robots.txt wins (Next serves /public first).
import { MetadataRoute } from 'next';

const BASE = 'https://www.vastuarya.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/_next/',
          '/login',
          '/signup',
          '/cart',
          '/checkout',
          '/account',
          '/order-confirmation',
          '/payment-success',
          '/payment-failure',
          '/booking-confirm',
        ],
      },
      // Let Googlebot explicitly crawl images for Google Image Search
      {
        userAgent: 'Googlebot',
        allow: ['/', '/*.jpg$', '/*.png$', '/*.webp$', '/*.svg$'],
        disallow: ['/admin', '/admin/', '/api/'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
