'use client';
import { useEffect, useState } from 'react';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import WhatsAppButton from '../../../components/common/WhatsAppButton';
import { useUIStore } from '../../../store/uiStore';
import { blogsAPI } from '../../../lib/api';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Eye, Tag } from 'lucide-react';
export default function BlogPage() {
  const { lang } = useUIStore();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { blogsAPI.getAll({ isPublished: true }).then(r => setBlogs(r.data.data||[])).finally(() => setLoading(false)); }, []);
  return (<><Navbar /><main>
    <section className="bg-dark-gradient py-16 text-center relative"><div className="absolute inset-0 mandala-bg opacity-10"/><div className="relative"><h1 className="font-display text-4xl font-bold text-white mb-2">{lang==='en'?'Vastu & Astrology Blog':'वास्तु और ज्योतिष ब्लॉग'}</h1><p className="text-gray-300">Expert insights by Dr. PPS Tomar</p></div></section>
    <section className="py-16 bg-cream"><div className="max-w-5xl mx-auto px-4 sm:px-6">
      {loading?(<div className="grid gap-6">{[...Array(4)].map((_,i)=><div key={i} className="h-48 skeleton rounded-2xl"/>)}</div>):(
        <div className="grid gap-6">{blogs.map((b,i)=>(<motion.div key={b._id} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.1}} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-orange transition-all flex flex-col sm:flex-row">
          {b.coverImage&&<div className="sm:w-48 h-40 sm:h-auto flex-shrink-0 overflow-hidden"><img src={b.coverImage} alt={b.title.en} loading="lazy" className="w-full h-full object-cover"/></div>}
          <div className="p-5 flex-1"><div className="flex items-center gap-3 text-xs text-gray-400 mb-2"><span className="flex items-center gap-1"><Tag size={11}/>{b.category}</span><span className="flex items-center gap-1"><Calendar size={11}/>{b.publishedAt?new Date(b.publishedAt).toLocaleDateString('en-IN'):''}</span><span className="flex items-center gap-1"><Eye size={11}/>{b.views} views</span></div>
          <h2 className="font-display font-bold text-text-dark text-xl mb-2"><Link href={`/blog/${b.slug}`}>{lang==='hi'&&b.title.hi?b.title.hi:b.title.en}</Link></h2>
          <p className="text-text-light text-sm line-clamp-2 mb-3">{lang==='hi'&&b.excerpt.hi?b.excerpt.hi:b.excerpt.en}</p>
          <div className="flex items-center justify-between"><span className="text-xs text-gray-400">By {b.author}</span><Link href={`/blog/${b.slug}`} className="text-primary text-sm font-semibold hover:underline">{lang==='en'?'Read More →':'और पढ़ें →'}</Link></div></div>
        </motion.div>))}
        {!loading&&blogs.length===0&&<div className="text-center py-20 text-gray-400"><div className="text-5xl mb-3">📝</div><p>No blog posts yet</p></div>}
      </div>)}
    </div></section></main><Footer /><WhatsAppButton /></>);
}
