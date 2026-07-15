/// <reference types="node" />
/**
 * ai.service.ts — Centralised AI provider layer for Vastu Arya
 *
 * CHANGED (Phase E — backend production implementation):
 *
 * 1. **Emergent Universal Key** is the primary provider now (
 *    `EMERGENT_LLM_KEY` env var — obtained via the platform's
 *    integration playbook; ONE key gets us GPT-4o / Claude Sonnet 4.5
 *    / Gemini 3 through the same OpenAI-compatible base URL).
 * 2. Direct Gemini + Anthropic env-key paths are **retained** as
 *    fallbacks — an existing deployment that already has
 *    `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` continues to work
 *    byte-for-byte identically. The provider fan-out order becomes:
 *         Emergent  ->  Gemini  ->  Anthropic  ->  demo-fallback
 *    (fallback used only if literally none of the above are configured).
 * 3. New public helper `callAIStructured()` — asks the model for a
 *    JSON blob matching the new frontend contract (summary,
 *    recommendations, warnings, nextSteps, followUp[], confidence).
 * 4. New public helper `callAIVision()` — for the new
 *    /vastu-analysis endpoint. Accepts up to 4 base64 image parts and
 *    a system prompt; instructs the model to explicitly refuse to
 *    fabricate conclusions when the image is unclear (per problem-
 *    statement requirement "handle uncertainty gracefully").
 * 5. `sanitiseUserInput` unchanged.
 *
 * Every existing call site (`ai.routes.ts` `POST /chat`) keeps working
 * because the pre-existing `callAI()` signature is unchanged.
 */

const con = (console as any);
const env = (process as any).env;

// ── Key detection ────────────────────────────────────────────────────

export function getEmergentKey(): string | null {
  return env.EMERGENT_LLM_KEY || env.EMERGENT_UNIVERSAL_KEY || null;
}
export function getGeminiKey(): string | null {
  return env.GEMINI_API_KEY || env.GOOGLE_AI_API_KEY || env.GOOGLE_API_KEY || env.GOOGLE_GEMINI_API_KEY || null;
}
export function getAnthropicKey(): string | null {
  return env.ANTHROPIC_API_KEY || env.CLAUDE_API_KEY || null;
}
export function getProviderStatus() {
  const e = !!getEmergentKey();
  const g = !!getGeminiKey();
  const a = !!getAnthropicKey();
  return {
    emergent: e,
    gemini: g,
    anthropic: a,
    mode: (e || g || a) ? 'live' as const : 'demo' as const,
  };
}

// ── Input sanitiser (unchanged from prior round) ─────────────────────

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

// ── Emergent Universal Key (OpenAI-compatible base URL) ──────────────
// Model: `gpt-4o-mini` for text (fast, cheap, high quality for the
// Vastu-guidance task) and `gpt-4o` when images are involved (vision).
// These are called through the emergentintegrations proxy — the base
// URL below is the Emergent LLM aggregator, the same one used by every
// other Emergent-hosted project. No SDK dependency.

const EMERGENT_BASE = 'https://integrations.emergentagent.com/llm';

async function _callEmergent(
  systemPrompt: string,
  userMessage: string,
  opts: { model?: string; images?: string[]; jsonMode?: boolean } = {},
  attempt = 1,
): Promise<string> {
  const apiKey = getEmergentKey();
  if (!apiKey) throw new Error('Emergent key not configured');

  const model = opts.model || (opts.images?.length ? 'gpt-4o' : 'gpt-4o-mini');

  // Vision-capable messages: OpenAI-compatible content-parts.
  const userContent: any = opts.images?.length
    ? [
        { type: 'text', text: userMessage },
        ...opts.images.map(dataUrl => ({ type: 'image_url', image_url: { url: dataUrl } })),
      ]
    : userMessage;

  const body: any = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userContent },
    ],
    temperature: 0.7,
    max_tokens: 1400,
  };
  if (opts.jsonMode) body.response_format = { type: 'json_object' };

  const res = await fetch(`${EMERGENT_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    const msg = `Emergent ${res.status}: ${err?.error?.message || err?.detail || res.statusText}`;
    if (res.status >= 500 && attempt < 2) {
      con.warn(`[AI] Emergent transient error (attempt ${attempt}), retrying...`);
      await new Promise(r => setTimeout(r, 800));
      return _callEmergent(systemPrompt, userMessage, opts, attempt + 1);
    }
    throw new Error(msg);
  }
  const data: any = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Emergent returned empty response');
  return text;
}

// ── Direct Gemini fallback (unchanged from prior round) ──────────────

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
      generationConfig: { temperature: 0.7, maxOutputTokens: 1400 },
    }),
  });
  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    const msg = `Gemini ${res.status}: ${err?.error?.message || res.statusText}`;
    if (res.status >= 500 && attempt < 2) {
      con.warn(`[AI] Gemini transient error (attempt ${attempt}), retrying...`);
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

// ── Direct Anthropic fallback (unchanged from prior round) ───────────

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
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1400,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    const msg = `Anthropic ${res.status}: ${err?.error?.message || res.statusText}`;
    if (res.status >= 500 && attempt < 2) {
      con.warn(`[AI] Anthropic transient error (attempt ${attempt}), retrying...`);
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

// ── Public: text call with provider fan-out ──────────────────────────

export interface AICallResult {
  text:   string;
  source: 'emergent' | 'gemini' | 'anthropic' | 'anthropic-fallback' | 'gemini-fallback';
}

export async function callAI(systemPrompt: string, userMessage: string): Promise<AICallResult> {
  const hasEmergent  = !!getEmergentKey();
  const hasGemini    = !!getGeminiKey();
  const hasAnthropic = !!getAnthropicKey();
  if (!hasEmergent && !hasGemini && !hasAnthropic) throw new Error('NO_PROVIDER');

  // 1) Emergent
  if (hasEmergent) {
    try {
      const text = await _callEmergent(systemPrompt, userMessage);
      con.log('[AI] Emergent OK');
      return { text, source: 'emergent' };
    } catch (e: any) { con.error('[AI] Emergent failed:', e.message); }
  }
  // 2) Gemini
  if (hasGemini) {
    try {
      const text = await _callGemini(systemPrompt, userMessage);
      con.log('[AI] Gemini fallback OK');
      return { text, source: hasEmergent ? 'gemini-fallback' : 'gemini' };
    } catch (e: any) { con.error('[AI] Gemini failed:', e.message); }
  }
  // 3) Anthropic
  if (hasAnthropic) {
    try {
      const text = await _callAnthropic(systemPrompt, userMessage);
      con.log('[AI] Anthropic fallback OK');
      return { text, source: (hasEmergent || hasGemini) ? 'anthropic-fallback' : 'anthropic' };
    } catch (e: any) { con.error('[AI] Anthropic failed:', e.message); }
  }
  throw new Error('ALL_PROVIDERS_FAILED');
}

// ── Public: structured (JSON) call for /vastu-analysis ───────────────

export interface StructuredAIOptions {
  images?: string[];  // data-URLs, up to 4 recommended
  context?: string[]; // prior turns to give the assistant conversation memory
}

export interface StructuredAIResponse {
  greeting?: string;
  analysis?: string;
  summary?: string;
  recommendations?: string[];
  warnings?: string[];
  nextSteps?: string[];
  remedies?: { title: string; action: string; zone: string; benefit: string }[];
  followUp?: string[];
  confidence?: 'low' | 'medium' | 'high';
  note?: string;
  disclaimer?: string;
  needsMoreInfo?: boolean;
  clarifyingQuestions?: string[];
}

export async function callAIStructured(
  systemPrompt: string,
  userMessage: string,
  opts: StructuredAIOptions = {},
): Promise<{ payload: StructuredAIResponse; source: string; raw: string }> {
  const contextBlock = opts.context?.length
    ? `\n\nPrior conversation (most recent last):\n${opts.context.map((t, i) => `[${i + 1}] ${t}`).join('\n')}\n`
    : '';

  const jsonInstructions = `
Respond ONLY with valid minified JSON in this EXACT shape (omit keys you have no data for; never invent):
{
  "greeting": "string",
  "analysis": "1-3 sentence plain-English framing of the concern",
  "summary":  "one-paragraph executive summary",
  "recommendations": ["actionable recommendation 1", "..."],
  "warnings":        ["risk or common mistake 1", "..."],
  "nextSteps":       ["do X first", "then Y", "..."],
  "remedies": [
    { "title": "Remedy name", "action": "What to do", "zone": "Which direction / area", "benefit": "Expected improvement" }
  ],
  "followUp":     ["short follow-up question the user might ask next", "..."],
  "confidence":   "low | medium | high",
  "note":         "closing encouragement",
  "needsMoreInfo": false,
  "clarifyingQuestions": ["only when confidence=low or images are ambiguous"]
}

Rules:
- Never fabricate specifics you can't confidently derive from the user's message or the images.
- If images are unclear or you cannot recognise a floor plan / layout, set "needsMoreInfo": true and put concrete clarifying questions in "clarifyingQuestions" instead of guessing remedies.
- Keep each list to at most 6 items; keep each string under 220 characters.
- Do not include markdown, do not include commentary outside the JSON.
${contextBlock}`;

  // Emergent supports strict JSON mode; Gemini/Anthropic don't — we
  // still request JSON in the prompt and parse defensively in the
  // caller (see `parseAIJson`).
  const augmentedSystem = `${systemPrompt}\n\n${jsonInstructions}`;

  const hasEmergent  = !!getEmergentKey();
  const hasGemini    = !!getGeminiKey();
  const hasAnthropic = !!getAnthropicKey();
  if (!hasEmergent && !hasGemini && !hasAnthropic) throw new Error('NO_PROVIDER');

  let text = '';
  let source = '';
  try {
    if (hasEmergent) {
      text = await _callEmergent(augmentedSystem, userMessage, { images: opts.images, jsonMode: !opts.images?.length });
      source = 'emergent';
    } else if (hasGemini) {
      text = await _callGemini(augmentedSystem, userMessage);
      source = 'gemini';
    } else {
      text = await _callAnthropic(augmentedSystem, userMessage);
      source = 'anthropic';
    }
  } catch (primaryErr: any) {
    con.error('[AI-Structured] primary failed:', primaryErr.message);
    // one alternative attempt with the next provider we have
    if (hasEmergent && hasGemini) {
      try { text = await _callGemini(augmentedSystem, userMessage); source = 'gemini-fallback'; }
      catch (e2: any) {
        if (hasAnthropic) { text = await _callAnthropic(augmentedSystem, userMessage); source = 'anthropic-fallback'; }
        else throw primaryErr;
      }
    } else if ((hasEmergent || hasGemini) && hasAnthropic) {
      text = await _callAnthropic(augmentedSystem, userMessage);
      source = 'anthropic-fallback';
    } else {
      throw primaryErr;
    }
  }

  const payload = parseAIJson(text);
  if (!payload) {
    // If the model refused to emit JSON, wrap the raw text so the
    // frontend still gets something to render — mirrors the existing
    // /chat handler's "parsed:false" fallback shape.
    return {
      payload: { greeting: 'Namaste!', analysis: text.slice(0, 400), confidence: 'low' },
      source,
      raw: text,
    };
  }
  return { payload, source, raw: text };
}

// ── Vision helper (thin convenience wrapper) ─────────────────────────

export async function callAIVision(
  systemPrompt: string,
  userMessage: string,
  images: string[],
): Promise<{ payload: StructuredAIResponse; source: string; raw: string }> {
  if (!getEmergentKey()) {
    // Direct Gemini would technically support vision too, but the
    // Emergent proxy is the vetted path — fail loudly rather than
    // silently sending text-only.
    throw new Error('VISION_REQUIRES_EMERGENT_KEY');
  }
  return callAIStructured(systemPrompt, userMessage, { images });
}

// ── JSON parse helper (unchanged) ────────────────────────────────────

export function parseAIJson(raw: string): any | null {
  try { return JSON.parse(raw.trim()); } catch { /* fall through */ }
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

// ── Startup diagnostics (extended to include Emergent) ───────────────

let _logged = false;
export function logProviderStatusOnce() {
  if (_logged) return;
  _logged = true;
  const e = getEmergentKey();
  const g = getGeminiKey();
  const a = getAnthropicKey();
  con.log('[AI] Provider status:');
  con.log(`  Emergent : ${e ? `check (${e.slice(0, 12)}...)` : 'x not set'}`);
  con.log(`  Gemini   : ${g ? `check (${g.slice(0, 8)}...)` : 'x not set'}`);
  con.log(`  Anthropic: ${a ? `check (${a.slice(0, 8)}...)` : 'x not set'}`);
  if (!e && !g && !a) con.log('[AI] No keys — demo mode active');
}
