// app/sitemap.ts — Fix #9: Dynamic sitemap. Replaces public/sitemap.xml.
// DELETE public/sitemap.xml after adding this file so Next.js serves this one.
import { MetadataRoute } from 'next';

const BASE = 'https://www.vastuarya.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,                                   priority: 1.0,  changeFrequency: 'weekly',  lastModified: now },
    { url: `${BASE}/services`,                           priority: 0.9,  changeFrequency: 'weekly',  lastModified: now },
    { url: `${BASE}/services/book-appointment`,          priority: 0.95, changeFrequency: 'weekly',  lastModified: now },
    { url: `${BASE}/book-appointment`,                   priority: 0.95, changeFrequency: 'weekly',  lastModified: now },
    { url: `${BASE}/services/vastu-consultancy`,         priority: 0.9,  changeFrequency: 'weekly',  lastModified: now },
    { url: `${BASE}/services/home-energy-analysis`,      priority: 0.9,  changeFrequency: 'weekly',  lastModified: now },
    { url: `${BASE}/services/business-vastu`,            priority: 0.9,  changeFrequency: 'weekly',  lastModified: now },
    { url: `${BASE}/services/vastu-check`,               priority: 0.9,  changeFrequency: 'weekly',  lastModified: now },
    { url: `${BASE}/services/mobile-numerology`,         priority: 0.9,  changeFrequency: 'weekly',  lastModified: now },
    { url: `${BASE}/services/numerology-analysis`,       priority: 0.9,  changeFrequency: 'weekly',  lastModified: now },
    { url: `${BASE}/services/gemstone-guidance`,         priority: 0.9,  changeFrequency: 'weekly',  lastModified: now },
    { url: `${BASE}/services/rudraksha-recommendation`,  priority: 0.8,  changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE}/services/smart-layout`,              priority: 0.8,  changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE}/services/new-property-vastu`,        priority: 0.8,  changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE}/vastu-store`,                        priority: 0.85, changeFrequency: 'weekly',  lastModified: now },
    { url: `${BASE}/vastu-store/bracelets`,              priority: 0.7,  changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE}/vastu-store/rudraksha`,              priority: 0.8,  changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE}/vastu-store/gemstones`,              priority: 0.8,  changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE}/vastu-store/yantras`,                priority: 0.7,  changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE}/vastu-store/sacred-mala`,            priority: 0.7,  changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE}/vastu-store/divine-frames`,          priority: 0.7,  changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE}/vastu-store/spiritual`,              priority: 0.6,  changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE}/vastu-store/pyramids`,               priority: 0.6,  changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE}/vastu-store/charging-plates`,        priority: 0.6,  changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE}/vastu-feed`,                         priority: 0.7,  changeFrequency: 'daily',   lastModified: now },
    { url: `${BASE}/vastu-ai`,                           priority: 0.7,  changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE}/blog`,                               priority: 0.7,  changeFrequency: 'weekly',  lastModified: now },
    { url: `${BASE}/about`,                              priority: 0.8,  changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE}/contact`,                            priority: 0.8,  changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE}/privacy`,                            priority: 0.3,  changeFrequency: 'yearly',  lastModified: now },
    { url: `${BASE}/terms`,                              priority: 0.3,  changeFrequency: 'yearly',  lastModified: now },
  ];

  // OPTIONAL — uncomment to pull dynamic blog + product entries from MongoDB.
  // Requires /api/blogs and /api/products to support limit=1000.
  //
  // try {
  //   const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://vastu-arya-backend-1.onrender.com/api';
  //   const [blogsRes, productsRes] = await Promise.all([
  //     fetch(`${apiBase}/blogs?limit=1000`, { next: { revalidate: 60 } }).then(r => r.ok ? r.json() : { data: [] }),
  //     fetch(`${apiBase}/products?limit=1000`, { next: { revalidate: 60 } }).then(r => r.ok ? r.json() : { data: [] }),
  //   ]);
  //   const blogs = (blogsRes.data || []).map((b: { slug: string; updatedAt?: string }) => ({
  //     url: `${BASE}/blog/${b.slug}`,
  //     priority: 0.6,
  //     changeFrequency: 'monthly' as const,
  //     lastModified: b.updatedAt ? new Date(b.updatedAt) : now,
  //   }));
  //   const products = (productsRes.data || []).map((p: { slug: string; updatedAt?: string }) => ({
  //     url: `${BASE}/vastu-store/product/${p.slug}`,
  //     priority: 0.65,
  //     changeFrequency: 'monthly' as const,
  //     lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
  //   }));
  //   return [...staticRoutes, ...blogs, ...products];
  // } catch (err) {
  //   console.warn('[sitemap] dynamic fetch failed, returning static only:', err);
  //   return staticRoutes;
  // }

  return staticRoutes;
}
