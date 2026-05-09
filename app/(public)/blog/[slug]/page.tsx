'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../../../components/layout/Navbar';
import Footer from '../../../../components/layout/Footer';
import WhatsAppButton from '../../../../components/common/WhatsAppButton';
import { useUIStore } from '../../../../store/uiStore';
import { blogsAPI } from '../../../../lib/api';
import Link from 'next/link';
import { Calendar, Eye, Tag, ArrowLeft } from 'lucide-react';

export default function BlogDetailPage() {
  const { slug } = useParams();
  const { lang } = useUIStore();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) blogsAPI.getBySlug(slug as string).then(r => setBlog(r.data.data)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (<><Navbar /><div className="min-h-screen bg-cream flex items-center justify-center"><div className="text-5xl animate-spin">🕉️</div></div><Footer /></>);
  if (!blog) return (<><Navbar /><div className="min-h-screen bg-cream flex items-center justify-center text-center"><div><div className="text-5xl mb-3">📝</div><p className="text-text-light mb-4">Blog post not found</p><Link href="/blog" className="text-primary hover:underline">← Back to Blog</Link></div></div><Footer /></>);

  const title = lang === 'hi' && blog.title.hi ? blog.title.hi : blog.title.en;
  const content = lang === 'hi' && blog.content.hi ? blog.content.hi : blog.content.en;

  return (
    <>
      <Navbar />
      <main>
        {blog.coverImage && <div className="w-full h-64 sm:h-96 overflow-hidden"><img src={blog.coverImage} alt={title} className="w-full h-full object-cover" /></div>}
        <section className="py-12 bg-cream">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <Link href="/blog" className="flex items-center gap-2 text-primary text-sm mb-6 hover:underline"><ArrowLeft size={16} /> Back to Blog</Link>
            <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
              <span className="flex items-center gap-1"><Tag size={11} />{blog.category}</span>
              <span className="flex items-center gap-1"><Calendar size={11} />{blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString('en-IN') : ''}</span>
              <span className="flex items-center gap-1"><Eye size={11} />{blog.views} views</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-dark mb-4">{title}</h1>
            <div className="flex items-center gap-3 mb-8 pb-8 border-b border-orange-100">
              <div className="w-10 h-10 bg-saffron-gradient rounded-full flex items-center justify-center text-white font-bold">{blog.author?.[0]}</div>
              <div><p className="font-semibold text-text-dark text-sm">{blog.author}</p><p className="text-xs text-text-light">IVAF Certified Vastu Expert</p></div>
            </div>
            <div className="prose prose-orange max-w-none text-text-mid leading-relaxed" dangerouslySetInnerHTML={{ __html: content }} />
            {blog.tags?.length > 0 && (
              <div className="mt-8 pt-8 border-t border-orange-100 flex flex-wrap gap-2">
                {blog.tags.map((tag: string) => <span key={tag} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">#{tag}</span>)}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
