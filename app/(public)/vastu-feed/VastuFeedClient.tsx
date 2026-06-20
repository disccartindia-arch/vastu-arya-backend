'use client';
/**
 * app/(public)/vastu-feed/VastuFeedClient.tsx
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 4 — Task 5, Navigation
 * Cleanup): this page's own hardcoded badge text dropped the 🌿 leaf
 * emoji and now reads "Vastu Community" instead of "Live Vastu Feed",
 * matching the nav rename in lib/i18n/en.ts / hi.ts. The page heading
 * itself ("Vastu Remedies & Transformations") is left unchanged — Task 5
 * specifically named the NAV LABEL ("Vastu Feed" → "Vastu Community") and
 * the leaf icon for removal; the page's content heading is a different
 * piece of copy describing what the page contains, not the navigation
 * name itself, so it's left as-is to avoid an unrequested content
 * rewrite. The route itself (/vastu-feed) is also left unchanged, since
 * Task 5 did not ask for a URL change and changing it would break any
 * existing external links/bookmarks/SEO for no stated benefit.
 *
 * No other logic in this file changed.
 */
import { useEffect, useState } from 'react';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import WhatsAppButton from '../../../components/common/WhatsAppButton';
import { postsAPI } from '../../../lib/api';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [{ value:'All',label:'📋 All'},{ value:'vastu-tip',label:'💡 Vastu Tips'},{ value:'transformation',label:'✨ Transformations'},{ value:'remedy',label:'🌿 Remedies'}];

export default function VastuFeedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');

  const fetchPosts = (cat: string) => {
    setLoading(true);
    const params: any = { page: 1, limit: 9 };
    if (cat !== 'All') params.category = cat;
    postsAPI.getAll(params).then((r:any) => setPosts(r?.data?.data||[])).catch(()=>toast.error('Failed to load feed')).finally(()=>setLoading(false));
  };

  useEffect(() => { fetchPosts(category); }, [category]);

  const handleLike = async (post: any) => {
    try {
      const sessionId = sessionStorage.getItem('va_feed_session') || Math.random().toString(36).slice(2);
      sessionStorage.setItem('va_feed_session', sessionId);
      const r = await postsAPI.like(post._id, sessionId);
      setPosts(prev => prev.map(p => p._id===post._id ? {...p, likes:r.data.likes} : p));
    } catch {}
  };

  return (<><Navbar /><main style={{ background: 'linear-gradient(135deg,#FFFDF7,#FFF8EE)', minHeight:'100vh' }}>
    <section className="py-14 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0D0500,#1A0A00)' }}>
      <div className="absolute inset-0 mandala-bg opacity-10 pointer-events-none"/>
      <div className="relative max-w-xl mx-auto px-4">
        <motion.div initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-5 border" style={{background:'rgba(212,160,23,0.15)',borderColor:'rgba(212,160,23,0.3)',color:'#D4A017'}}>Vastu Community</motion.div>
        <motion.h1 initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">Vastu Remedies & Transformations</motion.h1>
        <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.2}} className="text-gray-400 text-sm">Daily Vastu tips and sacred wisdom by Dr. PPS Tomar</motion.p>
      </div>
    </section>
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex gap-2 flex-wrap mb-7">{CATEGORIES.map(c=>(<button key={c.value} onClick={()=>setCategory(c.value)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${category===c.value?'bg-primary text-white':'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'}`}>{c.label}</button>))}</div>
      {loading&&<div className="space-y-5">{[...Array(3)].map((_,i)=><div key={i} className="bg-white rounded-3xl overflow-hidden"><div className="p-4 flex gap-3"><div className="w-10 h-10 skeleton rounded-full"/><div className="flex-1 space-y-2"><div className="h-3 skeleton rounded w-1/3"/></div></div><div className="h-56 skeleton"/></div>)}</div>}
      {!loading&&posts.length===0&&<div className="text-center py-20"><div className="text-5xl mb-4">🌿</div><p className="text-gray-500">No posts in this category yet.</p></div>}
      {!loading&&posts.length>0&&<div className="space-y-6">{posts.map(post=>(
        <motion.article key={post._id} initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:'-40px'}} className="bg-white rounded-3xl shadow-sm border border-orange-50 overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-200"><img src="/logo.jpg" alt="Dr. PPS Tomar" className="w-full h-full object-cover"/></div>
            <div><p className="font-bold text-gray-800 text-sm">{post.author||'Dr. PPS Tomar'}</p><p className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString('en-IN')}</p></div>
          </div>
          {post.media?.[0]?.url&&<div className="aspect-square sm:aspect-video overflow-hidden"><img src={post.media[0].url} alt={post.caption} loading="lazy" className="w-full h-full object-cover"/></div>}
          <div className="px-4 pt-3 pb-1"><p className="text-gray-800 text-sm leading-relaxed">{post.caption}</p></div>
          <div className="flex items-center gap-4 px-4 py-3 border-t border-gray-50">
            <button onClick={()=>handleLike(post)} className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-red-400 transition-all"><Heart size={18}/><span>{post.likes||0}</span></button>
            <span className="flex items-center gap-1.5 text-sm font-medium text-gray-400"><MessageCircle size={18}/><span>{post.commentCount||0}</span></span>
            <button onClick={()=>{ navigator.clipboard?.writeText(window.location.origin+'/vastu-feed#'+post._id).then(()=>toast.success('Link copied!')).catch(()=>{}); }} className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-primary transition-all"><Share2 size={18}/></button>
          </div>
        </motion.article>
      ))}</div>}
    </div>
  </main><Footer /><WhatsAppButton /></>);
}
