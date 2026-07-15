'use client';
/**
 * app/(public)/vastu-ai/VastuAIClient.tsx
 * Full AI Vastu Analysis experience. Uses the shared useVastuChat
 * engine so every interaction (thinking → typewriter → remedies →
 * follow-ups) matches the floating VastuAIGuide.
 *
 * Two-pane on desktop, stacked on mobile:
 *   Left  — composer (chips, textarea, image upload, room/direction).
 *   Right — conversation log with per-message actions (copy / share /
 *           download / retry).
 * Header actions: New chat, Clear conversation.
 * Backend contract unchanged. Images are UI-only until the backend
 * consumes them (see AI_UI_AUDIT.md).
 */
import { useEffect, useRef, useState } from 'react';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import WhatsAppButton from '../../../components/common/WhatsAppButton';
import AppointmentPopup from '../../../components/common/AppointmentPopup';
import { useUIStore } from '../../../store/uiStore';
import { aiSettingsAPI } from '../../../lib/api';
import { useVastuChat } from '../../../components/vastu-ai/useVastuChat';
import { AssistantMessage, UserMessage, EmptyChat } from '../../../components/vastu-ai/ChatUI';
import { motion } from 'framer-motion';
import { Sparkles, Send, Shield, Image as ImageIcon, X, Trash2, Plus, Calendar, MessageCircle, Loader2, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_CONCERNS = ['Financial problems','Relationship issues','Health problems','Career obstacles','Sleep disturbances','Family conflicts','Business losses','Child education'];
const ROOM_TYPES = ['Living Room','Bedroom','Kitchen','Home Office','Entire Home','Shop/Office'];
const DIRECTIONS = ['North','South','East','West','North-East','North-West','South-East','South-West'];
const WA = '917000343804';
const MAX_IMAGES = 4;

export default function VastuAIPage() {
  const { setShowAppointmentPopup } = useUIStore();
  const [concerns, setConcerns] = useState<string[]>(DEFAULT_CONCERNS);
  const [text, setText] = useState('');
  const [roomType, setRoomType] = useState('');
  const [direction, setDirection] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { messages, busy, send, retry, clear } = useVastuChat();

  useEffect(() => {
    aiSettingsAPI.getPublic().then((r: any) => {
      const d = r?.data?.data;
      if (d?.quickSuggestions?.length) setConcerns(d.quickSuggestions);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const addImages = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    const next = [...images, ...arr].slice(0, MAX_IMAGES);
    setImages(next);
    Promise.all(next.map(f => new Promise<string>((resolve) => {
      const r = new FileReader(); r.onload = e => resolve(e.target?.result as string); r.readAsDataURL(f);
    }))).then(setPreviews);
    if (arr.length + images.length > MAX_IMAGES) toast(`Maximum ${MAX_IMAGES} images. Extra files were ignored.`, { icon: 'ℹ️' });
  };

  const removeImage = (i: number) => {
    const next = images.filter((_, idx) => idx !== i);
    setImages(next);
    setPreviews(previews.filter((_, idx) => idx !== i));
  };

  const submit = () => {
    if (text.trim().length < 10) { toast.error('Describe your concern in at least 10 characters'); return; }
    send({ text, images, roomType, direction });
    setText(''); setImages([]); setPreviews([]);
  };

  const addConcern = (c: string) => setText(prev => prev ? (prev.includes(c) ? prev : `${prev}, ${c}`) : c);

  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant' && m.status === 'done');
  const waMsg = encodeURIComponent(`Namaste Dr. PPS Tomar ji, I received AI Vastu guidance and would like a personal consultation.`);

  return (
    <>
      <Navbar />
      <main style={{ background: 'linear-gradient(135deg,#FFFDF7 0%,#FFF8EE 100%)', minHeight: '100vh' }}>
        {/* Hero */}
        <section className="py-12 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0D0500,#1A0A00)' }}>
          <div className="absolute inset-0 mandala-bg opacity-10 pointer-events-none" />
          <div className="relative max-w-3xl mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-4 border" style={{ background: 'rgba(255,107,0,0.15)', borderColor: 'rgba(255,107,0,0.3)', color: '#FF9933' }}>
              <Sparkles size={14} /> AI-Powered Vastu Analysis
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-display text-3xl sm:text-5xl font-bold text-white mb-3">
              Instant Vastu Guidance
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-gray-300 text-base sm:text-lg">
              Describe your concern, upload photos if you have them, get personalised remedies in seconds.
            </motion.p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-5 gap-6">
          {/* Composer */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white rounded-3xl p-5 shadow-sm border border-orange-100 h-fit lg:sticky lg:top-24">
            <div className="flex items-center gap-3 mb-4 p-3 bg-orange-50 rounded-2xl border border-orange-100">
              <img src="/logo.jpg" alt="Dr. PPS Tomar" className="w-10 h-10 rounded-full border border-orange-200 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm truncate">Dr. Pranveer Pratap Singh Tomar</p>
                <p className="text-xs text-gray-500">IVAF Certified · 15+ Years</p>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Online
              </span>
            </div>

            <p className="text-xs text-gray-400 font-medium mb-2">Common concerns — tap to add:</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {concerns.map(c => (
                <button key={c} onClick={() => addConcern(c)} data-testid="concern-chip"
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${text.includes(c) ? 'bg-primary text-white border-primary' : 'border-orange-200 text-gray-600 hover:border-primary hover:text-primary'}`}>
                  {c}
                </button>
              ))}
            </div>

            <textarea
              data-testid="ai-textarea"
              value={text} onChange={e => setText(e.target.value)} rows={4}
              placeholder="e.g. We have been facing financial losses for 2 years. Money comes but never stays…"
              className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:border-primary text-sm resize-none mb-3" />

            {/* Image upload */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-500">Attach photos (optional)</span>
                <span className="text-[10px] text-gray-400">{images.length}/{MAX_IMAGES}</span>
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addImages(e.target.files)} data-testid="ai-image-input" />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={images.length >= MAX_IMAGES}
                data-testid="ai-image-picker-btn"
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-orange-200 rounded-xl text-sm text-gray-500 hover:border-primary hover:text-primary disabled:opacity-40">
                <ImageIcon size={15} /> Add room photos (up to {MAX_IMAGES})
              </button>
              {previews.length > 0 && (
                <div className="mt-2 grid grid-cols-4 gap-1.5" data-testid="ai-image-previews">
                  {previews.map((src, i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden border border-orange-100">
                      <img src={src} alt={`upload ${i + 1}`} className="w-full h-14 object-cover" />
                      <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center">
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-2 mb-3">
              <select data-testid="ai-room-select" value={roomType} onChange={e => setRoomType(e.target.value)} className="px-3 py-2 border border-orange-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary">
                <option value="">Room type (optional)</option>
                {ROOM_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select data-testid="ai-direction-select" value={direction} onChange={e => setDirection(e.target.value)} className="px-3 py-2 border border-orange-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary">
                <option value="">Facing direction (optional)</option>
                {DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <button data-testid="ai-submit-btn" onClick={submit} disabled={busy || text.trim().length < 10}
              className="w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
              style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)', boxShadow: text.trim().length >= 10 && !busy ? '0 8px 24px rgba(255,107,0,0.35)' : 'none' }}>
              {busy ? <><Loader2 size={16} className="animate-spin" /> Analysing…</> : <><Send size={16} /> Get Vastu Analysis</>}
            </button>
            <p className="text-center text-[11px] text-gray-400 mt-2 flex items-center justify-center gap-1">
              <Shield size={10} /> Private &amp; secure · Based on authentic Vastu Shastra
            </p>
          </motion.div>

          {/* Conversation */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-sm border border-orange-100 flex flex-col min-h-[520px]">
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-orange-50">
                <p className="text-sm font-semibold text-gray-700">Conversation</p>
                <div className="flex items-center gap-1">
                  <button data-testid="conv-newchat-btn" onClick={clear} title="New chat" className="p-2 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-primary">
                    <Plus size={14} />
                  </button>
                  <button data-testid="conv-clear-btn" onClick={clear} title="Clear conversation" className="p-2 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-primary">
                    <Trash2 size={14} />
                  </button>
                  <button data-testid="conv-print-btn" onClick={() => window.print()} title="Print / Save as PDF" className="p-2 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-primary">
                    <Printer size={14} />
                  </button>
                </div>
              </div>

              <div ref={scrollRef} data-testid="conv-log" className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[65vh]">
                {messages.length === 0 && <EmptyChat onQuick={q => setText(q)} />}
                {messages.map(m =>
                  m.role === 'user'
                    ? <UserMessage key={m.id} m={m} />
                    : <AssistantMessage key={m.id} m={m} onRetry={retry} onFollowUp={q => setText(q)} />
                )}
              </div>

              {/* Persistent booking CTA when we have an answer */}
              {lastAssistant && (
                <div className="flex-shrink-0 p-4 border-t border-orange-50 grid grid-cols-2 gap-2">
                  <button data-testid="book-cta-btn" onClick={() => setShowAppointmentPopup(true)} className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)' }}>
                    <Calendar size={14} /> Book Dr. PPS Tomar @ ₹11
                  </button>
                  <a href={`https://wa.me/${WA}?text=${waMsg}`} target="_blank" rel="noopener noreferrer" data-testid="whatsapp-cta-btn" className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm text-white bg-[#25D366]">
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer /><AppointmentPopup /><WhatsAppButton />
    </>
  );
}
