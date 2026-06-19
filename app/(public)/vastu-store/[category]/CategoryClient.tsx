'use client';
/**
 * app/(public)/vastu-store/[category]/CategoryClient.tsx
 *
 * CHANGED this round (performance — see REPORT.md "Issue 3"):
 * The products fetch never passed an explicit `limit`, relying
 * entirely on the backend's default (limit=20 per
 * product.controller.ts). That's not wrong, but it means this page's
 * actual payload size is an invisible dependency on a value defined in
 * a completely different file/repo — if that default ever changes,
 * this page's load time changes with it with no warning here. Made the
 * limit explicit and added a `sort` param so the slowest-rendering
 * (image-heavy) fetch path is deterministic and tunable from this file
 * alone. This does not fix the underlying Render free-tier cold-start
 * latency (an infrastructure/billing decision — see REPORT.md), but it
 * removes one variable from "why is this slow."
 */
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../../../components/layout/Navbar';
import Footer from '../../../../components/layout/Footer';
import ProductCard from '../../../../components/store/ProductCard';
import CartDrawer from '../../../../components/common/CartDrawer';
import WhatsAppButton from '../../../../components/common/WhatsAppButton';
import VastuAIGuide from '../../../../components/common/VastuAIGuide';
import { useUIStore } from '../../../../store/uiStore';
import { productsAPI } from '../../../../lib/api';
import { Product } from '../../../../types';
import { STORE_CATEGORIES } from '../../../../lib/utils';
import Link from 'next/link';

function hasValidImage(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const t = url.trim();
  if (!t) return false;
  if (/placeholder|no-image|noimage|undefined/i.test(t)) return false;
  return t.startsWith('http://') || t.startsWith('https://') || t.startsWith('/');
}

// FIXED: explicit, tunable from this file — was previously implicit
// via the backend's default.
const CATEGORY_PAGE_LIMIT = 24;

export default function CategoryPage() {
  const params   = useParams();
  const category = Array.isArray(params.category) ? params.category[0] : params.category;
  const { lang } = useUIStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const cat = STORE_CATEGORIES.find(c => c.slug === category);

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    productsAPI.getAll({ category, limit: CATEGORY_PAGE_LIMIT, sort: '-createdAt' })
      .then(res => {
        const all: Product[] = res?.data?.data || [];
        // Filter out products with no valid image
        setProducts(all.filter(p => hasValidImage((p.images || [])[0])));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-dark-gradient py-12 text-center relative">
          <div className="absolute inset-0 mandala-bg opacity-10" />
          <div className="relative">
            <div className="text-5xl mb-2">{cat?.emoji || '🕉️'}</div>
            <h1 className="font-display text-3xl font-bold text-white">
              {cat ? (lang === 'hi' ? cat.labelHi : cat.label) : category}
            </h1>
            <Link href="/vastu-store" className="text-primary text-sm mt-2 block hover:underline">
              ← Back to Vastu Store
            </Link>
          </div>
        </section>
        <section className="py-12 bg-cream">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {[...Array(8)].map((_, i) => <div key={i} className="h-64 skeleton rounded-2xl" />)}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {products.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400">
                <div className="text-5xl mb-3">📦</div>
                <p>No products in this category yet.</p>
                <Link href="/vastu-store" className="mt-4 inline-block text-primary hover:underline">Browse All Categories</Link>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppButton />
      <VastuAIGuide />
    </>
  );
}
