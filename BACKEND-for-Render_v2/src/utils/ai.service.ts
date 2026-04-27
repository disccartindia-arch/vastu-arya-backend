/// <reference types="node" />
/**
 * ai.service.ts  —  Centralised AI provider layer for Vastu Arya
 *
 * • Single source of truth for all AI calls
 * • Gemini → Anthropic fallback chain
 * • Retry-once on transient 5xx errors
 * • Input sanitisation against prompt injection
 * • Structured logging for every call
 */

const con = (console as any);
const env = (process as any).env;

// ── Key resolution — accepts multiple naming conventions ──────────────────────
export function getGeminiKey(): string | null {
  return env.GEMINI_API_KEY || env.GOOGLE_AI_API_KEY || env.GOOGLE_API_KEY || env.GOOGLE_GEMINI_API_KEY || null;
}
export function getAnthropicKey(): string | null {
  return env.ANTHROPIC_API_KEY || env.CLAUDE_API_KEY || null;
}
export function getProviderStatus() {
  const g = !!getGeminiKey();
  const a = !!getAnthropicKey();
  return { gemini: g, anthropic: a, mode: (g || a) ? 'live' as const : 'demo' as const };
}

// ── Prompt injection sanitisation ─────────────────────────────────────────────
export function sanitiseUserInput(input: string, maxLength = 1000): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .slice(0, maxLength)
    .replace(/\[SYSTEM\]/gi, '[SYS]')
    .replace(/ignore (previous|all|prior) (instructions?|prompts?)/gi, '')
    .replace(/you are now/gi, '')
    .replace(/disregard (your|the) (previous|system|original)/gi, '')
    .trim();
}

// ── Internal Gemini caller ────────────────────────────────────────────────────
async function _callGemini(systemPrompt: string, userMessage: string, attempt = 1): Promise<string> {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error('Gemini key not configured');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.7, maxOutputTokens: 1200 },
    }),
  });
  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    const msg = `Gemini ${res.status}: ${err?.error?.message || res.statusText}`;
    if (res.status >= 500 && attempt < 2) {
      con.warn(`[AI] Gemini transient error (attempt ${attempt}), retrying…`);
      await new Promise(r => setTimeout(r, 800));
      return _callGemini(systemPrompt, userMessage, attempt + 1);
    }
    throw new Error(msg);
  }
  const data: any = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty response');
  return text;
}

// ── Internal Anthropic caller ─────────────────────────────────────────────────
async function _callAnthropic(systemPrompt: string, userMessage: string, attempt = 1): Promise<string> {
  const apiKey = getAnthropicKey();
  if (!apiKey) throw new Error('Anthropic key not configured');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    const msg = `Anthropic ${res.status}: ${err?.error?.message || res.statusText}`;
    if (res.status >= 500 && attempt < 2) {
      con.warn(`[AI] Anthropic transient error (attempt ${attempt}), retrying…`);
      await new Promise(r => setTimeout(r, 800));
      return _callAnthropic(systemPrompt, userMessage, attempt + 1);
    }
    throw new Error(msg);
  }
  const data: any = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Anthropic returned empty response');
  return text;
}

// ── Public: callAI — Gemini with Anthropic fallback ───────────────────────────
export interface AICallResult {
  text:   string;
  source: 'gemini' | 'anthropic' | 'anthropic-fallback';
}

export async function callAI(systemPrompt: string, userMessage: string): Promise<AICallResult> {
  const hasGemini    = !!getGeminiKey();
  const hasAnthropic = !!getAnthropicKey();
  if (!hasGemini && !hasAnthropic) throw new Error('NO_PROVIDER');

  if (hasGemini) {
    try {
      const text = await _callGemini(systemPrompt, userMessage);
      con.log('[AI] Gemini OK');
      return { text, source: 'gemini' };
    } catch (e: any) {
      con.error('[AI] Gemini failed:', e.message);
      if (hasAnthropic) {
        try {
          const text = await _callAnthropic(systemPrompt, userMessage);
          con.log('[AI] Anthropic fallback used');
          return { text, source: 'anthropic-fallback' };
        } catch (e2: any) {
          con.error('[AI] Anthropic fallback failed:', e2.message);
          throw new Error('ALL_PROVIDERS_FAILED');
        }
      }
      throw new Error('ALL_PROVIDERS_FAILED');
    }
  }
  // Anthropic only
  try {
    const text = await _callAnthropic(systemPrompt, userMessage);
    con.log('[AI] Anthropic OK');
    return { text, source: 'anthropic' };
  } catch (e: any) {
    con.error('[AI] Anthropic failed:', e.message);
    throw new Error('ALL_PROVIDERS_FAILED');
  }
}

// ── JSON parsing helper ───────────────────────────────────────────────────────
export function parseAIJson(raw: string): any | null {
  try { return JSON.parse(raw.trim()); } catch {}
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

// ── Log provider status once ──────────────────────────────────────────────────
let _logged = false;
export function logProviderStatusOnce() {
  if (_logged) return;
  _logged = true;
  const g = getGeminiKey();
  const a = getAnthropicKey();
  con.log('[AI] Provider status:');
  con.log(`  Gemini   : ${g ? `✓ (${g.slice(0, 8)}...)` : '✗ not set'}`);
  con.log(`  Anthropic: ${a ? `✓ (${a.slice(0, 8)}...)` : '✗ not set'}`);
  if (!g && !a) con.log('[AI] No keys — demo mode active');
}
