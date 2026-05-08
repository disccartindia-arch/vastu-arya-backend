// app/(public)/search/page.tsx — Fix #2: The /search route was 404ing. Navbar posts to this.
'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import WhatsAppButton from '../../../components/common/WhatsAppButton';
import { searchAPI } from '../../../lib/api';

interface SearchResultItem {
  _id: string;
  slug: string;
  title?: { en: string; hi?: string };
  name?: { en: string; hi?: string };
  icon?: string;
  offerPrice?: number;
}

interface SearchResults {
  services: SearchResultItem[];
  products: SearchResultItem[];
  blogs: SearchResultItem[];
}

function SearchResultsView() {
  const params = useSearchParams();
  const q = params.get('q') || '';
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!q.trim()) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    searchAPI
      .search(q, 12)
      .then((r: any) => setResults(r.data.data))
      .catch((err: Error) => {
        console.error('[search] failed:', err);
        setError('Search is temporarily unavailable. Please try again shortly.');
        setResults(null);
      })
      .finally(() => setLoading(false));
  }, [q]);

  const empty =
    results &&
    (!results.services || results.services.length === 0) &&
    (!results.products || results.products.length === 0) &&
    (!results.blogs || results.blogs.length === 0);

  return (
    <main className="min-h-screen bg-cream py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-text-dark mb-2">
          Search results for &ldquo;{q}&rdquo;
        </h1>
        <p className="text-text-light mb-8">
          {loading ? 'Searching…' : results ? 'Showing matching services, products and articles.' : ''}
        </p>

        {loading && (
          <div className="grid gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 skeleton rounded-2xl" />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-6">
            {error}
          </div>
        )}

        {!loading && empty && (
          <p className="text-text-light mt-8">
            No results found for &ldquo;{q}&rdquo;. Try a different keyword, or{' '}
            <Link href="/services" className="text-primary underline">browse services</Link> or{' '}
            <Link href="/vastu-store" className="text-primary underline">visit the store</Link>.
          </p>
        )}

        {results && !empty && (
          <div className="space-y-8">
            {results.services && results.services.length > 0 && (
              <section aria-labelledby="search-services-heading">
                <h2 id="search-services-heading" className="font-semibold text-lg mb-3 text-text-dark">
                  Services
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {results.services.map((s) => (
                    <Link
                      key={s._id}
                      href={`/services/${s.slug}`}
                      className="p-4 bg-white rounded-2xl border border-orange-100 hover:shadow-orange transition-all"
                    >
                      {s.icon && <span className="text-2xl" aria-hidden="true">{s.icon}</span>}
                      <p className="font-semibold text-text-dark mt-2">
                        {s.title?.en || 'Service'}
                      </p>
                      {s.offerPrice !== undefined && (
                        <p className="text-primary font-bold">₹{s.offerPrice}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {results.products && results.products.length > 0 && (
              <section aria-labelledby="search-products-heading">
                <h2 id="search-products-heading" className="font-semibold text-lg mb-3 text-text-dark">
                  Products
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {results.products.map((p) => (
                    <Link
                      key={p._id}
                      href={`/vastu-store/product/${p.slug}`}
                      className="p-4 bg-white rounded-2xl border border-orange-100 hover:shadow-orange transition-all"
                    >
                      <p className="font-semibold text-text-dark">
                        {p.name?.en || 'Product'}
                      </p>
                      {p.offerPrice !== undefined && (
                        <p className="text-primary font-bold">₹{p.offerPrice}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {results.blogs && results.blogs.length > 0 && (
              <section aria-labelledby="search-blogs-heading">
                <h2 id="search-blogs-heading" className="font-semibold text-lg mb-3 text-text-dark">
                  Blog posts
                </h2>
                <div className="space-y-3">
                  {results.blogs.map((b) => (
                    <Link
                      key={b._id}
                      href={`/blog/${b.slug}`}
                      className="block p-4 bg-white rounded-2xl border border-orange-100 hover:shadow-orange transition-all"
                    >
                      <p className="font-semibold text-text-dark">
                        {b.title?.en || 'Blog post'}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className="min-h-screen bg-cream flex items-center justify-center text-text-light">
            Searching…
          </div>
        }
      >
        <SearchResultsView />
      </Suspense>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
