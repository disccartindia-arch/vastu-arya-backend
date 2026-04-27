/// <reference types="node" />
import { Router, Request, Response } from 'express';
import AISettings from '../models/AISettings';
import rateLimit from 'express-rate-limit';
import {
  callAI, parseAIJson, getGeminiKey, getAnthropicKey,
  sanitiseUserInput, logProviderStatusOnce,
} from '../utils/ai.service';

const router = Router();
const con = (console as any);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many requests. Please wait a minute.' },
});

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
    logProviderStatusOnce();

    const rawConcern   = req.body?.concern;
    const rawRoomType  = req.body?.roomType;
    const rawDirection = req.body?.direction;

    // Sanitise user inputs against prompt injection
    const concern   = sanitiseUserInput(String(rawConcern   || ''), 800);
    const roomType  = sanitiseUserInput(String(rawRoomType  || ''), 80);
    const direction = sanitiseUserInput(String(rawDirection || ''), 40);

    if (!concern || concern.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Please describe your concern in more detail.' });
    }

    const s = await loadSettings();

    const hasGemini    = !!getGeminiKey();
    const hasAnthropic = !!getAnthropicKey();

    // No keys at all — return demo
    if (!hasGemini && !hasAnthropic) {
      con.log('[AI] Demo mode — no API keys configured');
      return res.json({ success: true, isDemo: true, data: buildDemo(concern, s) });
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

    // Call AI via centralised service
    let rawText = '';
    let source  = '';

    try {
      const result = await callAI(systemPrompt, userMessage);
      rawText = result.text;
      source  = result.source;
    } catch (e: any) {
      if (e.message === 'NO_PROVIDER' || e.message === 'ALL_PROVIDERS_FAILED') {
        con.warn('[AI] All providers failed, falling back to demo');
        return res.json({ success: true, isDemo: true, data: buildDemo(concern, s) });
      }
      throw e;
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
