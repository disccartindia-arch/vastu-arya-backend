/// <reference types="node" />
import { Router, Request, Response } from 'express';
import AISettings from '../models/AISettings';
import rateLimit from 'express-rate-limit';

const router = Router();
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many AI requests. Please wait a minute.' },
});

router.post('/vastu-analysis', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { concern, roomType, direction } = req.body;
    if (!concern || concern.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Please describe your concern in more detail.' });
    }

    // ── Load admin-controlled settings from DB ────────────────────────────
    let settings = await AISettings.findOne();
    if (!settings) settings = await AISettings.create({});

    const apiKey = (process as any).env.ANTHROPIC_API_KEY;

    // ── Demo fallback (no API key) ────────────────────────────────────────
    if (!apiKey) {
      return res.json({
        success: true,
        isDemo: true,
        data: {
          greeting: 'Namaste! Thank you for reaching out.',
          analysis: `I understand your concern about ${concern.slice(0, 50)}. Let me provide some Vastu guidance.`,
          remedies: [
            {
              title: 'Entrance Energising',
              action: 'Place a Ganesha idol or symbol at your main entrance',
              zone: 'North-East or East entrance',
              benefit: 'Attracts positive energy and removes obstacles',
            },
            {
              title: 'Space Clearing',
              action: 'Light a camphor lamp daily for 5 minutes',
              zone: 'Centre of your home (Brahmasthana)',
              benefit: 'Purifies energy and removes negativity',
            },
            {
              title: 'Wealth Zone Activation',
              action: 'Place a money plant or Kuber Yantra',
              zone: 'North corner of living room',
              benefit: 'Activates financial energy flow',
            },
          ],
          note: settings.commonLines.join(' '),
          consultationCTA: settings.showConsultationCTA
            ? settings.ctaText
            : '',
          disclaimer: settings.showDisclaimer ? settings.disclaimerText : '',
          followUp: settings.showFollowUp ? settings.followUpText : '',
        },
      });
    }

    // ── Live Claude API call ──────────────────────────────────────────────
    const userMessage = [
      `My Vastu concern: ${concern}`,
      roomType   ? `Room type: ${roomType}`           : '',
      direction  ? `Facing direction: ${direction}`   : '',
      settings.trustedAdviceBlocks.length
        ? `\nTrusted advice context:\n${settings.trustedAdviceBlocks.map((b: any) => `${b.title}: ${b.content}`).join('\n')}`
        : '',
    ].filter(Boolean).join('\n');

    // Append admin-controlled additions to system prompt
    const fullSystemPrompt = [
      settings.systemPrompt,
      settings.commonLines.length
        ? `\nAlways include these lines in every response:\n${settings.commonLines.join('\n')}`
        : '',
      settings.showConsultationCTA
        ? `\nAt the end, include a consultationCTA suggesting: "${settings.ctaText}"`
        : '\nDo NOT include a consultation CTA.',
      settings.showDisclaimer
        ? `\nDisclaimer to add: "${settings.disclaimerText}"`
        : '',
    ].filter(Boolean).join('\n');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: fullSystemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) throw new Error(`AI API error: ${response.status}`);
    const aiData: any = await response.json();
    const rawText = aiData.content?.[0]?.text || '';

    let parsed: any;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch { parsed = null; }

    if (!parsed) {
      parsed = {
        greeting: 'Namaste!',
        analysis: rawText.slice(0, 200),
        remedies: [],
        note: settings.commonLines.join(' '),
        consultationCTA: settings.showConsultationCTA ? settings.ctaText : '',
      };
    }

    // Inject admin-controlled fields
    parsed.disclaimer = settings.showDisclaimer ? settings.disclaimerText : '';
    parsed.followUp   = settings.showFollowUp   ? settings.followUpText   : '';
    if (settings.showConsultationCTA && !parsed.consultationCTA) {
      parsed.consultationCTA = settings.ctaText;
    }

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    (console as any).error('AI route error:', error);
    res.status(500).json({ success: false, message: 'AI analysis temporarily unavailable. Please try again.' });
  }
});

// Public: get quick suggestions (for frontend dropdowns)
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const settings = await AISettings.findOne().select('quickSuggestions');
    res.json({ success: true, data: settings?.quickSuggestions || [] });
  } catch {
    res.json({ success: true, data: [] });
  }
});

export default router;
