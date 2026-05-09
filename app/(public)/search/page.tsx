'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import WhatsAppButton from '../../../components/common/WhatsAppButton';
import ProductCard from '../../../components/store/ProductCard';
import { useTranslation } from '../../../lib/i18n';
import { searchAPI } from '../../../lib/api';
import Link from 'next/link';
import { Search } from 'lucide-react';

function SearchContent() {
  const params = useSearchParams();
  const q = params.get('q') || '';
  const { t } = useTranslation();
  const [results, setResults] = useState<any>({ blogs:[], services:[], products:[], posts:[] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    searchAPI.search(q, 20).then(r => setResults(r.data.data || {})).finally(() => setLoading(false));
  }, [q]);

  const total = results.blogs.length + results.services.length + results.products.length;

  return (
    <main className="min-h-screen bg-cream py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-text-dark mb-2">{t('search.title')}</h1>
          {q && <p className="text-text-light">{total} results for "<strong>{q}</strong>"</p>}
        </div>

        {loading ? <div className="text-center py-20"><div className="text-4xl animate-spin mb-3">🕉️</div></div> : (
          <div className="space-y-10">
            {!q && (<div className="text-center py-20 text-gray-400"><Search size={48} className="mx-auto mb-4 opacity-30"/><p className="text-lg">{t('search.enterKeyword')}</p></div>)}
            {q && total === 0 && !loading && (<div className="text-center py-20 text-gray-400"><Search size={48} className="mx-auto mb-4 opacity-30"/><p className="text-lg">{t('search.noResults')} "{q}"</p><p className="text-sm mt-2">{t('search.tryDifferent')}</p></div>)}

            {results.services.length > 0 && (<div><h2 className="font-display text-xl font-bold text-text-dark mb-4">{t('search.services')}</h2><div className="grid gap-4">{results.services.map((s:any)=>(<Link key={s._id} href={`/services/${s.slug}`} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-orange-100 hover:shadow-orange transition-all"><div className="text-3xl">{s.icon}</div><div><h3 className="font-semibold text-text-dark">{s.title.en}</h3><p className="text-sm text-text-light">₹{s.offerPrice}</p></div></Link>))}</div></div>)}
            {results.products.length > 0 && (<div><h2 className="font-display text-xl font-bold text-text-dark mb-4">{t('search.products')}</h2><div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{results.products.map((p:any)=><ProductCard key={p._id} product={p}/>)}</div></div>)}
            {results.blogs.length > 0 && (<div><h2 className="font-display text-xl font-bold text-text-dark mb-4">{t('search.blogs')}</h2><div className="grid gap-4">{results.blogs.map((b:any)=>(<Link key={b._id} href={`/blog/${b.slug}`} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-orange-100 hover:shadow-orange transition-all">{b.coverImage&&<img src={b.coverImage} alt={b.title.en} className="w-14 h-14 rounded-xl object-cover flex-shrink-0"/>}<div><h3 className="font-semibold text-text-dark">{b.title.en}</h3><p className="text-xs text-gray-400">{b.category}</p></div></Link>))}</div></div>)}
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
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-spin">🕉️</div></div>}>
        <SearchContent />
      </Suspense>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
