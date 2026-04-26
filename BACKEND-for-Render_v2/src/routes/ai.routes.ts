/// <reference types="node" />
import { Router, Request, Response } from 'express';
import AISettings from '../models/AISettings';
import rateLimit from 'express-rate-limit';

const router = Router();
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many AI requests. Please wait a minute.' },
});

// ── Helper: call Google Gemini (FREE) ─────────────────────────────────────────
async function callGemini(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = (process as any).env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      { role: 'user', parts: [{ text: userMessage }] },
    ],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    throw new Error(`Gemini error ${res.status}: ${err?.error?.message || res.statusText}`);
  }

  const data: any = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ── Helper: call Anthropic Claude ─────────────────────────────────────────────
async function callAnthropic(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = (process as any).env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

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
    throw new Error(`Anthropic error ${res.status}: ${err?.error?.message || res.statusText}`);
  }

  const data: any = await res.json();
  return data?.content?.[0]?.text || '';
}

// ── Parse JSON from AI response ───────────────────────────────────────────────
function parseAIResponse(raw: string): any | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch { return null; }
}

// ── Build demo response ───────────────────────────────────────────────────────
function demoResponse(concern: string, settings: any) {
  return {
    greeting: 'Namaste! 🙏 Thank you for reaching out to Vastu Arya.',
    analysis: `I understand your concern about ${concern.slice(0, 60)}. Based on Vastu Shastra principles, here are some immediate remedies for you.`,
    remedies: [
      { title: '🪔 Entrance Energising', action: 'Place a Ganesha idol or symbol at your main entrance', zone: 'North-East or East entrance', benefit: 'Attracts positive energy and removes obstacles' },
      { title: '🕯️ Space Clearing', action: 'Light a camphor lamp daily for 5 minutes', zone: 'Centre of your home (Brahmasthana)', benefit: 'Purifies energy and removes negativity' },
      { title: '💰 Wealth Zone Activation', action: 'Place a money plant or Kuber Yantra', zone: 'North corner of living room', benefit: 'Activates financial energy flow' },
    ],
    note: settings.commonLines?.join(' ') || 'These remedies are based on ancient Vastu Shastra principles.',
    consultationCTA: settings.showConsultationCTA ? settings.ctaText : '',
    disclaimer: settings.showDisclaimer ? settings.disclaimerText : '',
    followUp: settings.showFollowUp ? settings.followUpText : '',
  };
}

// ── Main route ────────────────────────────────────────────────────────────────
router.post('/vastu-analysis', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { concern, roomType, direction } = req.body;
    if (!concern || concern.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Please describe your concern in more detail (at least 10 characters).' });
    }

    // Load admin settings (with fallback to defaults)
    let settings: any;
    try {
      settings = await AISettings.findOne();
      if (!settings) settings = await AISettings.create({});
    } catch (dbErr) {
      (console as any).warn('AISettings DB error, using defaults:', dbErr);
      settings = {
        systemPrompt: `You are Dr. Pranveer Pratap Singh Tomar (Dr. PPS Tomar), an IVAF Certified Vastu Shastra expert with 15+ years of experience. Provide actionable Vastu remedies in JSON format: { "greeting": "", "analysis": "", "remedies": [{"title":"","action":"","zone":"","benefit":""}], "note": "", "consultationCTA": "" }`,
        commonLines: ['These remedies follow ancient Vastu Shastra principles.'],
        ctaText: 'Book a Consultation with Dr. PPS Tomar',
        showConsultationCTA: true,
        showDisclaimer: true,
        showFollowUp: true,
        disclaimerText: 'This is AI-generated guidance. A personal consultation with Dr. PPS Tomar is recommended for precise results.',
        followUpText: 'Would you like to book a personal session with Dr. PPS Tomar for deeper insights?',
        trustedAdviceBlocks: [],
      };
    }

    // Build prompts
    const userMessage = [
      `My Vastu concern: ${concern}`,
      roomType  ? `Room type: ${roomType}`         : '',
      direction ? `Facing direction: ${direction}` : '',
    ].filter(Boolean).join('\n');

    const systemPrompt = [
      settings.systemPrompt,
      settings.commonLines?.length ? `\nAlways include these lines: ${settings.commonLines.join(' | ')}` : '',
      settings.showConsultationCTA ? `\nEnd with consultationCTA: "${settings.ctaText}"` : '\nDo not include a consultation CTA.',
      settings.trustedAdviceBlocks?.length
        ? `\nContext:\n${settings.trustedAdviceBlocks.map((b: any) => `${b.title}: ${b.content}`).join('\n')}`
        : '',
    ].filter(Boolean).join('\n');

    const env = (process as any).env;
    const hasGemini    = !!env.GEMINI_API_KEY;
    const hasAnthropic = !!env.ANTHROPIC_API_KEY;

    // No AI keys — return demo
    if (!hasGemini && !hasAnthropic) {
      return res.json({ success: true, isDemo: true, data: demoResponse(concern, settings) });
    }

    // Try Gemini first (free), fallback to Anthropic, fallback to demo
    let rawText = '';
    let aiSource = '';
    try {
      if (hasGemini) { rawText = await callGemini(systemPrompt, userMessage); aiSource = 'gemini'; }
      else           { rawText = await callAnthropic(systemPrompt, userMessage); aiSource = 'anthropic'; }
    } catch (primaryErr) {
      (console as any).error(`Primary AI (${hasGemini ? 'Gemini' : 'Anthropic'}) failed:`, primaryErr);
      // Try fallback
      try {
        if (hasGemini && hasAnthropic) { rawText = await callAnthropic(systemPrompt, userMessage); aiSource = 'anthropic-fallback'; }
      } catch (fallbackErr) {
        (console as any).error('Fallback AI also failed:', fallbackErr);
        return res.json({ success: true, isDemo: true, data: demoResponse(concern, settings) });
      }
    }

    // Parse response
    let parsed = parseAIResponse(rawText);
    if (!parsed) {
      parsed = {
        greeting: 'Namaste! 🙏',
        analysis: rawText.slice(0, 300),
        remedies: [],
        note: settings.commonLines?.join(' ') || '',
        consultationCTA: settings.showConsultationCTA ? settings.ctaText : '',
      };
    }

    // Inject admin-controlled fields
    parsed.disclaimer = settings.showDisclaimer ? settings.disclaimerText : '';
    parsed.followUp   = settings.showFollowUp   ? settings.followUpText   : '';
    if (settings.showConsultationCTA && !parsed.consultationCTA) {
      parsed.consultationCTA = settings.ctaText;
    }

    res.json({ success: true, data: parsed, source: aiSource });
  } catch (error: any) {
    (console as any).error('AI route fatal error:', error);
    res.status(500).json({ success: false, message: 'AI analysis temporarily unavailable. Please try again in a moment.' });
  }
});

// Public: get quick suggestions
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const s = await AISettings.findOne().select('quickSuggestions');
    res.json({ success: true, data: s?.quickSuggestions || [] });
  } catch {
    res.json({ success: true, data: [] });
  }
});

export default router;
