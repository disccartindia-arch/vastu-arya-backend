'use client';
/**
 * components/vastu-ai/ChatUI.tsx
 * Presentational pieces used by both the floating widget and the full
 * page — kept in a shared file so the two surfaces render assistant
 * messages identically.
 */
import { motion } from 'framer-motion';
import { CheckCircle, RotateCcw, Copy, Download, Share2, Sparkles, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ChatMessage, AiPayload } from './useVastuChat';

export function ThinkingIndicator({ testId = 'thinking-indicator' }: { testId?: string }) {
  return (
    <div data-testid={testId} className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-primary/70"
          animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
      <span className="ml-2 text-xs text-gray-500">Dr. PPS Tomar is analysing…</span>
    </div>
  );
}

function ConfidencePill({ value }: { value: AiPayload['confidence'] }) {
  if (value === undefined || value === null) return null;
  let label: string; let cls: string;
  if (typeof value === 'number') {
    label = `${Math.round(value * 100)}% confidence`;
    cls = value >= 0.75 ? 'bg-green-100 text-green-700' : value >= 0.5 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  } else {
    label = `${value.charAt(0).toUpperCase()}${value.slice(1)} confidence`;
    cls = value === 'high' ? 'bg-green-100 text-green-700' : value === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  }
  return <span data-testid="confidence-pill" className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}><Sparkles size={10} /> {label}</span>;
}

function buildPlainText(m: ChatMessage): string {
  const p = m.payload;
  const parts: string[] = [];
  if (p?.greeting)  parts.push(p.greeting);
  if (p?.analysis)  parts.push(p.analysis);
  if (p?.remedies?.length) {
    parts.push('\nRemedies:');
    p.remedies.forEach((r, i) => parts.push(`${i + 1}. ${r.title} — ${r.action} (${r.zone}) — ${r.benefit}`));
  }
  if (p?.summary)         parts.push(`\nSummary: ${p.summary}`);
  if (p?.recommendations?.length) parts.push(`\nRecommendations:\n- ${p.recommendations.join('\n- ')}`);
  if (p?.warnings?.length)        parts.push(`\nWarnings:\n- ${p.warnings.join('\n- ')}`);
  if (p?.nextSteps?.length)       parts.push(`\nNext Steps:\n- ${p.nextSteps.join('\n- ')}`);
  if (p?.note)            parts.push(`\nNote: ${p.note}`);
  if (p?.disclaimer)      parts.push(`\nDisclaimer: ${p.disclaimer}`);
  return parts.join('\n');
}

async function shareMessage(m: ChatMessage) {
  const text = buildPlainText(m);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  if (typeof navigator !== 'undefined' && navigator.share) {
    try { await navigator.share({ title: 'Vastu Arya — Analysis', text, url }); return; } catch { /* dismissed */ }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n\n${url}`)}`, '_blank');
}

function downloadMessage(m: ChatMessage) {
  const text = buildPlainText(m);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vastu-analysis-${(m.id || 'msg').slice(0, 8)}.txt`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

interface AssistantMessageProps {
  m: ChatMessage;
  onRetry: () => void;
  onFollowUp?: (q: string) => void;
  compact?: boolean;
}

export function AssistantMessage({ m, onRetry, onFollowUp, compact = false }: AssistantMessageProps) {
  const p = m.payload;

  if (m.status === 'thinking') {
    return (
      <div className="flex items-start gap-2" data-testid="assistant-thinking">
        <img src="/logo.jpg" alt="Dr. PPS Tomar" className="w-8 h-8 rounded-full border border-orange-200 flex-shrink-0" />
        <div className="bg-orange-50 border border-orange-100 rounded-2xl rounded-tl-sm px-3 py-2">
          <ThinkingIndicator />
        </div>
      </div>
    );
  }

  if (m.status === 'error') {
    return (
      <div className="flex items-start gap-2" data-testid="assistant-error">
        <img src="/logo.jpg" alt="Dr. PPS Tomar" className="w-8 h-8 rounded-full border border-orange-200 flex-shrink-0" />
        <div className="bg-red-50 border border-red-100 rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-red-700"><AlertCircle size={14} /> Something went wrong</p>
          <p className="text-xs text-red-600 mt-1">{m.errorMessage}</p>
          <button data-testid="retry-message-btn" onClick={onRetry} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold">
            <RotateCcw size={12} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const followUps: string[] = Array.isArray(p?.followUp) ? (p!.followUp as string[]) : typeof p?.followUp === 'string' ? [p!.followUp as string] : [];

  return (
    <div className="flex items-start gap-2" data-testid="assistant-message">
      <img src="/logo.jpg" alt="Dr. PPS Tomar" className="w-8 h-8 rounded-full border border-orange-200 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="bg-white border border-orange-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Dr. PPS Tomar</p>
            <ConfidencePill value={p?.confidence} />
          </div>
          <p data-testid="assistant-answer" className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {m.revealed}
            {m.status === 'typing' && <span className="inline-block w-1.5 h-4 bg-primary/60 ml-0.5 align-middle animate-pulse" />}
          </p>

          {m.status === 'done' && p?.remedies && p.remedies.length > 0 && (
            <div data-testid="remedies-list" className="mt-4 space-y-2">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Personalised Remedies</p>
              {p.remedies.map((r, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="flex gap-2 p-3 rounded-xl bg-orange-50 border border-orange-100">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)' }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800">{r.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">✅ {r.action}</p>
                    <p className="text-[11px] text-gray-400 mt-1">📍 {r.zone} · 💡 {r.benefit}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {m.status === 'done' && !compact && (p?.recommendations?.length || p?.warnings?.length || p?.nextSteps?.length || p?.summary) && (
            <div className="mt-4 grid grid-cols-1 gap-2">
              {p?.summary && (
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
                  <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-1">Summary</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{p.summary}</p>
                </div>
              )}
              {p?.recommendations && p.recommendations.length > 0 && (
                <div className="p-3 rounded-xl bg-green-50 border border-green-100">
                  <p className="text-[11px] font-semibold text-green-700 uppercase tracking-wider mb-1">Recommendations</p>
                  <ul className="text-sm text-gray-700 list-disc pl-5 space-y-0.5">{p.recommendations.map((x, i) => <li key={i}>{x}</li>)}</ul>
                </div>
              )}
              {p?.warnings && p.warnings.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider mb-1">Warnings</p>
                  <ul className="text-sm text-gray-700 list-disc pl-5 space-y-0.5">{p.warnings.map((x, i) => <li key={i}>{x}</li>)}</ul>
                </div>
              )}
              {p?.nextSteps && p.nextSteps.length > 0 && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider mb-1">Next Steps</p>
                  <ul className="text-sm text-gray-700 list-disc pl-5 space-y-0.5">{p.nextSteps.map((x, i) => <li key={i}>{x}</li>)}</ul>
                </div>
              )}
            </div>
          )}

          {m.status === 'done' && p?.note && (
            <p className="mt-3 text-xs italic text-gray-500 leading-relaxed">{p.note}</p>
          )}
          {m.status === 'done' && p?.disclaimer && (
            <p className="mt-1 text-[11px] text-gray-400 leading-relaxed">{p.disclaimer}</p>
          )}

          {m.status === 'done' && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-orange-50 pt-2">
              <button data-testid="msg-copy-btn"
                onClick={() => { navigator.clipboard?.writeText(buildPlainText(m)); toast.success('Copied'); }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-orange-50 hover:text-primary">
                <Copy size={12} /> Copy
              </button>
              <button data-testid="msg-share-btn" onClick={() => shareMessage(m)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-orange-50 hover:text-primary">
                <Share2 size={12} /> Share
              </button>
              <button data-testid="msg-download-btn" onClick={() => downloadMessage(m)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-orange-50 hover:text-primary">
                <Download size={12} /> Download
              </button>
              {p?.pdfUrl && (
                <a data-testid="msg-pdf-btn" href={p.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-orange-50 hover:text-primary">
                  <Download size={12} /> PDF
                </a>
              )}
              <button data-testid="msg-retry-btn" onClick={onRetry} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-orange-50 hover:text-primary">
                <RotateCcw size={12} /> Retry
              </button>
            </div>
          )}
        </div>

        {m.status === 'done' && followUps.length > 0 && onFollowUp && (
          <div className="mt-2 flex flex-wrap gap-1.5" data-testid="followup-chips">
            {followUps.map((f, i) => (
              <button key={i} onClick={() => onFollowUp(f)} className="px-2.5 py-1 rounded-full border border-orange-200 bg-orange-50 text-xs text-primary hover:bg-primary hover:text-white transition-colors">
                {f}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function UserMessage({ m }: { m: ChatMessage }) {
  return (
    <div className="flex items-start gap-2 justify-end" data-testid="user-message">
      <div className="max-w-[85%] bg-primary text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
        <p className="text-sm whitespace-pre-wrap">{m.content}</p>
        {m.images && m.images.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-1">
            {m.images.map((src, i) => (<img key={i} src={src} alt={`upload ${i + 1}`} className="rounded-lg object-cover w-full h-16 border border-white/20" />))}
          </div>
        )}
        {(m.roomType || m.direction) && (
          <p className="text-[10px] text-white/70 mt-1">{[m.roomType, m.direction].filter(Boolean).join(' · ')}</p>
        )}
      </div>
    </div>
  );
}

export function EmptyChat({ onQuick }: { onQuick: (q: string) => void }) {
  const suggestions = ['Financial problems in my business', 'Sleep disturbances in bedroom', 'Kitchen facing east — is it fine?', 'Home entrance facing south — remedies?'];
  return (
    <div className="text-center py-8" data-testid="empty-chat">
      <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center bg-orange-50 border border-orange-100">
        <Sparkles size={22} className="text-primary" />
      </div>
      <p className="font-display text-lg text-text-dark">Ask Dr. PPS Tomar's AI</p>
      <p className="text-xs text-gray-500 mt-1">Describe a concern and get personalised Vastu remedies.</p>
      <div className="mt-4 flex flex-wrap gap-1.5 justify-center px-4">
        {suggestions.map(s => (
          <button key={s} onClick={() => onQuick(s)} data-testid="quick-suggestion" className="px-3 py-1.5 rounded-full text-xs border border-orange-200 text-gray-600 hover:border-primary hover:text-primary transition-colors">
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
