/// <reference types="node" />
import { Router, Request, Response } from 'express';
import AISettings from '../models/AISettings';
import rateLimit from 'express-rate-limit';

const router = Router();
const con = (console as any);
const env = (process as any).env;

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many requests. Please wait a minute.' },
});

// ── Resolve env var with multiple possible names ──────────────────────────────
// Render users might name them differently — we check all common variants
function getGeminiKey(): string | null {
  return (
    env.GEMINI_API_KEY         ||   // standard
    env.GOOGLE_AI_API_KEY      ||   // google ai studio default
    env.GOOGLE_API_KEY         ||   // generic
    env.GOOGLE_GEMINI_API_KEY  ||   // explicit
    null
  );
}

function getAnthropicKey(): string | null {
  return (
    env.ANTHROPIC_API_KEY      ||   // standard
    env.CLAUDE_API_KEY         ||   // alternative
    null
  );
}

// ── Log available providers on first request (once) ──────────────────────────
let loggedOnce = false;
function logProviders() {
  if (loggedOnce) return;
  loggedOnce = true;
  const g = getGeminiKey();
  const a = getAnthropicKey();
  con.log('[AI] Provider status:');
  con.log(`  Gemini  : ${g ? '✓ key loaded (' + g.slice(0,8) + '...)' : '✗ not set'}`);
  con.log(`  Anthropic: ${a ? '✓ key loaded (' + a.slice(0,8) + '...)' : '✗ not set'}`);
  if (!g && !a) con.log('[AI] No keys found — will use demo mode');
}

// ── Call Google Gemini ────────────────────────────────────────────────────────
async function callGemini(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error('Gemini key not configured');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
    }),
  });

  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    throw new Error(`Gemini ${res.status}: ${err?.error?.message || res.statusText}`);
  }
  const data: any = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty response');
  return text;
}

// ── Call Anthropic Claude ─────────────────────────────────────────────────────
async function callAnthropic(systemPrompt: string, userMessage: string): Promise<string> {
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
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    throw new Error(`Anthropic ${res.status}: ${err?.error?.message || res.statusText}`);
  }
  const data: any = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Anthropic returned empty response');
  return text;
}

// ── Parse JSON from AI response ───────────────────────────────────────────────
function parseAIJson(raw: string): any | null {
  // Try direct parse first
  try { return JSON.parse(raw.trim()); } catch {}
  // Extract JSON block
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

// ── Load AI settings (with inline fallback, no crash) ────────────────────────
async function loadSettings(): Promise<any> {
  try {
    let s = await AISettings.findOne();
    if (!s) s = await AISettings.create({});
    return s;
  } catch (e) {
    con.warn('[AI] AISettings DB read failed, using hardcoded defaults:', e);
    return {
      systemPrompt: `You are Dr. Pranveer Pratap Singh Tomar (Dr. PPS Tomar), an IVAF Certified Vastu Shastra expert with 15+ years of experience who has helped 45,000+ clients. Provide 3-4 practical Vastu remedies. Respond ONLY in valid JSON: { "greeting": "", "analysis": "", "remedies": [{"title":"","action":"","zone":"","benefit":""}], "note": "", "consultationCTA": "" }`,
      commonLines: ['These remedies follow ancient Vastu Shastra principles.'],
      ctaText: 'Book a Consultation with Dr. PPS Tomar',
      showConsultationCTA: true,
      showDisclaimer: true,
      showFollowUp: true,
      disclaimerText: 'AI-generated guidance. For precise results, consult Dr. PPS Tomar personally.',
      followUpText: 'Book a personal session with Dr. PPS Tomar for deeper insights.',
      trustedAdviceBlocks: [],
    };
  }
}

// ── Build demo response ───────────────────────────────────────────────────────
function buildDemo(concern: string, s: any) {
  return {
    greeting: 'Namaste! 🙏',
    analysis: `I understand your concern about ${concern.slice(0, 60)}. Here are Vastu remedies to help.`,
    remedies: [
      { title: '🪔 Entrance Energising',    action: 'Place a Ganesha idol at main entrance',  zone: 'North-East / East',           benefit: 'Attracts positive energy' },
      { title: '🕯️ Space Clearing',         action: 'Light camphor lamp daily for 5 minutes', zone: 'Centre (Brahmasthana)',        benefit: 'Purifies and removes negativity' },
      { title: '💰 Wealth Zone Activation', action: 'Place a money plant or Kuber Yantra',    zone: 'North corner of living room', benefit: 'Activates financial energy flow' },
    ],
    note: (s.commonLines || []).join(' '),
    consultationCTA:  s.showConsultationCTA ? s.ctaText         : '',
    disclaimer:       s.showDisclaimer      ? s.disclaimerText  : '',
    followUp:         s.showFollowUp        ? s.followUpText    : '',
  };
}

// ── Main analysis route ───────────────────────────────────────────────────────
router.post('/vastu-analysis', aiLimiter, async (req: Request, res: Response) => {
  try {
    logProviders();

    const { concern, roomType, direction } = req.body;
    if (!concern || String(concern).trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Please describe your concern in more detail.' });
    }

    const s = await loadSettings();

    const hasGemini    = !!getGeminiKey();
    const hasAnthropic = !!getAnthropicKey();

    // No keys at all — return demo
    if (!hasGemini && !hasAnthropic) {
      con.log('[AI] Demo mode — no API keys configured');
      return res.json({ success: true, isDemo: true, data: buildDemo(String(concern), s) });
    }

    // Build prompts
    const userMessage = [
      `My Vastu concern: ${concern}`,
      roomType  ? `Room type: ${roomType}`         : '',
      direction ? `Facing direction: ${direction}` : '',
      (s.trustedAdviceBlocks || []).length
        ? `\nContext:\n${s.trustedAdviceBlocks.map((b: any) => `${b.title}: ${b.content}`).join('\n')}`
        : '',
    ].filter(Boolean).join('\n');

    const systemPrompt = [
      s.systemPrompt,
      (s.commonLines || []).length ? `\nInclude in response: ${s.commonLines.join(' ')}` : '',
      s.showConsultationCTA
        ? `\nEnd with consultationCTA field: "${s.ctaText}"`
        : `\nDo NOT include a consultationCTA.`,
    ].filter(Boolean).join('\n');

    // Try providers
    let rawText = '';
    let source  = '';

    if (hasGemini) {
      try {
        rawText = await callGemini(systemPrompt, userMessage);
        source  = 'gemini';
        con.log('[AI] Gemini response received');
      } catch (e: any) {
        con.error('[AI] Gemini failed:', e.message);
        // fallback to Anthropic if available
        if (hasAnthropic) {
          try {
            rawText = await callAnthropic(systemPrompt, userMessage);
            source  = 'anthropic-fallback';
            con.log('[AI] Anthropic fallback used');
          } catch (e2: any) {
            con.error('[AI] Anthropic fallback also failed:', e2.message);
            return res.json({ success: true, isDemo: true, data: buildDemo(String(concern), s) });
          }
        } else {
          return res.json({ success: true, isDemo: true, data: buildDemo(String(concern), s) });
        }
      }
    } else {
      // Anthropic only
      try {
        rawText = await callAnthropic(systemPrompt, userMessage);
        source  = 'anthropic';
        con.log('[AI] Anthropic response received');
      } catch (e: any) {
        con.error('[AI] Anthropic failed:', e.message);
        return res.json({ success: true, isDemo: true, data: buildDemo(String(concern), s) });
      }
    }

    // Parse
    let parsed = parseAIJson(rawText);
    if (!parsed) {
      con.warn('[AI] Could not parse JSON from response, using text as analysis');
      parsed = {
        greeting: 'Namaste! 🙏',
        analysis: rawText.slice(0, 400),
        remedies: [],
        note: '',
        consultationCTA: '',
      };
    }

    // Inject admin-controlled fields
    if (s.showConsultationCTA && !parsed.consultationCTA) parsed.consultationCTA = s.ctaText;
    parsed.disclaimer = s.showDisclaimer ? s.disclaimerText : '';
    parsed.followUp   = s.showFollowUp   ? s.followUpText   : '';

    return res.json({ success: true, data: parsed, source });

  } catch (err: any) {
    con.error('[AI] Fatal error in vastu-analysis:', err);
    return res.status(500).json({ success: false, message: 'AI analysis temporarily unavailable. Please try again.' });
  }
});

// ── Debug endpoint (admin can check key status) ───────────────────────────────
router.get('/status', async (req: Request, res: Response) => {
  const g = getGeminiKey();
  const a = getAnthropicKey();
  res.json({
    success: true,
    providers: {
      gemini:    { configured: !!g, keyPreview: g ? g.slice(0, 8) + '...' : null },
      anthropic: { configured: !!a, keyPreview: a ? a.slice(0, 8) + '...' : null },
    },
    mode: (g || a) ? 'live' : 'demo',
  });
});

// ── Public: quick suggestions ─────────────────────────────────────────────────
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const s = await AISettings.findOne().select('quickSuggestions');
    res.json({ success: true, data: s?.quickSuggestions || [] });
  } catch {
    res.json({ success: true, data: [] });
  }
});

export default router;
