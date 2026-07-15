'use client';
/**
 * components/vastu-ai/useVastuChat.ts
 * Shared chat engine used by both the floating VastuAIGuide bubble
 * and the full /vastu-ai page. Same message-log data structure, same
 * typing / thinking states, same retry contract — the two surfaces
 * only differ in layout.
 *
 * Design notes
 * ------------
 * - The backend today returns a JSON blob (no SSE). We render the
 *   `analysis` text char-by-char via `requestAnimationFrame` to feel
 *   conversational without lying about streaming.
 * - `send()` accepts an optional `images: File[]` argument; the current
 *   backend route (POST /ai/vastu-analysis) doesn't consume images, but
 *   we surface upload UI today so users can attach room photos and we
 *   forward the array through the call for the day the backend does.
 * - History lives in memory (per tab). We deliberately do NOT persist
 *   to localStorage — Vastu concerns can be sensitive.
 */

import { useCallback, useRef, useState } from 'react';
import { aiAPI } from '@/lib/api';

export interface Remedy {
  title: string;
  action: string;
  zone: string;
  benefit: string;
}

export interface AiPayload {
  greeting?: string;
  analysis?: string;
  remedies?: Remedy[];
  note?: string;
  disclaimer?: string;
  followUp?: string[] | string;
  confidence?: number | 'low' | 'medium' | 'high';
  consultationCTA?: string;
  pdfUrl?: string;
  summary?: string;
  recommendations?: string[];
  warnings?: string[];
  nextSteps?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  status: 'sending' | 'thinking' | 'typing' | 'done' | 'error';
  content: string;           // full text (assistant final; user prompt)
  revealed?: string;         // progressively revealed portion of `content`
  payload?: AiPayload;       // structured assistant payload
  images?: string[];         // data URLs for user-uploaded images
  timestamp: string;
  roomType?: string;
  direction?: string;
  errorMessage?: string;
}

interface SendOptions {
  text: string;
  images?: File[];
  roomType?: string;
  direction?: string;
}

const nextId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

function toDataUrls(files: File[]): Promise<string[]> {
  return Promise.all(files.map(f => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('read_failed'));
    reader.readAsDataURL(f);
  })));
}

export function useVastuChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy,     setBusy]     = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastSendRef = useRef<SendOptions | null>(null);

  const stopReveal = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };

  const revealText = useCallback((id: string, full: string) => {
    stopReveal();
    // Roughly 40 chars/frame @ 60fps ≈ 2400 cps — feels alive without being obnoxious.
    // Slow it to ~120 cps for a "thoughtful" feel; users can skip via the Reveal instantly button.
    const CHARS_PER_TICK = 2;
    let idx = 0;
    const tick = () => {
      idx += CHARS_PER_TICK;
      const revealed = full.slice(0, idx);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, revealed, status: idx >= full.length ? 'done' : 'typing' } : m));
      if (idx < full.length) rafRef.current = requestAnimationFrame(tick);
      else rafRef.current = null;
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const revealNow = useCallback((id: string) => {
    stopReveal();
    setMessages(prev => prev.map(m => m.id === id ? { ...m, revealed: m.content, status: 'done' } : m));
  }, []);

  const send = useCallback(async (opts: SendOptions) => {
    const text = opts.text.trim();
    if (!text || text.length < 5) return;
    lastSendRef.current = opts;
    setBusy(true);

    const userImages = opts.images?.length ? await toDataUrls(opts.images) : undefined;

    const userMsg: ChatMessage = {
      id: nextId(), role: 'user', status: 'done', content: text, revealed: text,
      images: userImages, roomType: opts.roomType, direction: opts.direction,
      timestamp: new Date().toISOString(),
    };
    const thinking: ChatMessage = {
      id: nextId(), role: 'assistant', status: 'thinking', content: '', revealed: '',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg, thinking]);

    try {
      const r = await aiAPI.vastuAnalysis({ concern: text, roomType: opts.roomType, direction: opts.direction });
      const success = r?.data?.success !== false;
      const data: AiPayload = r?.data?.data || {};

      if (!success || !data) throw new Error(r?.data?.message || 'no_data');

      const analysisText = [data.greeting, data.analysis].filter(Boolean).join('\n\n');

      setMessages(prev => prev.map(m => m.id === thinking.id ? {
        ...m,
        status: 'typing',
        content: analysisText,
        revealed: '',
        payload: data,
      } : m));

      // Kick off the reveal animation
      revealText(thinking.id, analysisText);
    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === thinking.id ? {
        ...m, status: 'error',
        content: '', revealed: '',
        errorMessage: err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.',
      } : m));
    } finally {
      setBusy(false);
    }
  }, [revealText]);

  const retry = useCallback(async () => {
    if (!lastSendRef.current) return;
    // Trim the trailing error/thinking message
    setMessages(prev => {
      const trimmed = [...prev];
      while (trimmed.length && trimmed[trimmed.length - 1].role !== 'user') trimmed.pop();
      trimmed.pop(); // also drop the user msg — send() will re-add it
      return trimmed;
    });
    await send(lastSendRef.current);
  }, [send]);

  const clear = useCallback(() => {
    stopReveal();
    setMessages([]);
    lastSendRef.current = null;
  }, []);

  return { messages, busy, send, retry, clear, revealNow };
}
