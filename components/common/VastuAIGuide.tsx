'use client';
/**
 * components/common/VastuAIGuide.tsx
 * Floating "Ask AI" chat widget. Uses the shared useVastuChat engine
 * so the interaction model (thinking indicator → typewriter reveal →
 * remedies fade-in → follow-up chips) matches the full /vastu-ai page
 * exactly. Maintains the site's saffron branding & floating-button UX.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Sparkles, X, Send, Trash2, Plus } from 'lucide-react';
import { useVastuChat } from '../vastu-ai/useVastuChat';
import { AssistantMessage, UserMessage, EmptyChat } from '../vastu-ai/ChatUI';

const CHIPS = ['Financial problems', 'Relationship issues', 'Health problems', 'Career obstacles', 'Sleep disturbances'];

export default function VastuAIGuide() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const { messages, busy, send, retry, clear } = useVastuChat();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const submit = () => {
    if (text.trim().length < 5 || busy) return;
    send({ text });
    setText('');
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Ask Vastu AI"
        data-testid="ask-ai-fab"
        style={{
          position: 'fixed', bottom: '148px', right: '20px', zIndex: 998,
          background: 'linear-gradient(135deg,#FF6B00,#FF9933)',
          boxShadow: '0 4px 20px rgba(255,107,0,0.5)', border: 'none',
          borderRadius: '999px', height: '48px', padding: '0 16px 0 12px',
          display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
          color: '#fff', fontWeight: 700, fontSize: '14px',
        }}
      >
        <Sparkles size={17} /><span>Ask AI</span>
      </button>

      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-[1000] bg-black/50" />}

      <div
        className="fixed bottom-0 right-0 z-[1001] w-full sm:max-w-md max-h-[92vh] bg-white rounded-t-3xl sm:rounded-3xl sm:m-4 flex flex-col shadow-2xl"
        style={{ transform: open ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)' }}
        data-testid="ask-ai-sheet"
        role="dialog"
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 rounded-t-3xl sm:rounded-t-3xl" style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"><Sparkles size={16} className="text-white" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">Vastu AI Guide</p>
              <p className="text-white/80 text-xs">Real answers, in real time</p>
            </div>
            <button data-testid="ai-newchat-btn" title="New chat" onClick={clear} className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white">
              <Plus size={14} />
            </button>
            <button data-testid="ai-clear-btn" title="Clear conversation" onClick={clear} className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white">
              <Trash2 size={14} />
            </button>
            <button data-testid="ai-close-btn" onClick={() => setOpen(false)} className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Log */}
        <div ref={scrollRef} data-testid="ai-log" className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-white to-orange-50/40">
          {messages.length === 0 && <EmptyChat onQuick={q => { setText(q); }} />}
          {messages.map(m =>
            m.role === 'user'
              ? <UserMessage key={m.id} m={m} />
              : <AssistantMessage key={m.id} m={m} onRetry={retry} onFollowUp={q => { setText(q); }} compact />
          )}
        </div>

        {/* Chip row (when empty) */}
        {messages.length === 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5" data-testid="ai-chips">
            {CHIPS.map(c => (
              <button key={c} onClick={() => setText(prev => prev ? `${prev}, ${c}` : c)} className="px-2.5 py-1 rounded-full text-xs border border-orange-200 text-gray-600 hover:border-primary hover:text-primary">
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Composer */}
        <div className="flex-shrink-0 p-3 border-t border-orange-100 bg-white flex items-end gap-2">
          <textarea
            data-testid="ai-composer"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
            rows={1}
            placeholder="Describe your Vastu concern…"
            className="flex-1 resize-none max-h-32 px-3 py-2.5 border border-orange-200 rounded-2xl text-sm focus:outline-none focus:border-primary"
          />
          <button data-testid="ai-send-btn" onClick={submit} disabled={busy || text.trim().length < 5}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)' }}>
            <Send size={16} />
          </button>
        </div>

        <div className="px-4 pb-3 text-center text-[11px] text-gray-400">
          <Link href="/vastu-ai" onClick={() => setOpen(false)} className="underline hover:text-primary">Open full analysis page →</Link>
        </div>
      </div>
    </>
  );
}
