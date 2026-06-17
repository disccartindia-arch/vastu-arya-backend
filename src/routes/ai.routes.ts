/// <reference types="node" />
/**
 * ai.routes.ts — Public Vastu AI Assistant chat endpoint (the widget shown
 * on the site asking "What's your Vastu concern?"). Uses AISettings for the
 * system prompt and on-page copy, and ai.service.ts for the actual model
 * call with Gemini -> Anthropic fallback.
 *
 * FIX (carried over from README): includes a lightweight GET /status
 * endpoint so the frontend can show "AI Assistant: Online/Demo mode"
 * without making a full chat call first.
 */
import { Router, Request, Response } from 'express';
import AISettings from '../models/AISettings';
import { callAI, parseAIJson, sanitiseUserInput, getProviderStatus, logProviderStatusOnce } from '../utils/ai.service';

const router = Router();
const con = (console as any);

logProviderStatusOnce();

router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = getProviderStatus();
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.json({ success: true, data: { gemini: false, anthropic: false, mode: 'demo' } });
  }
});

router.get('/quick-suggestions', async (req: Request, res: Response) => {
  try {
    let settings = await AISettings.findOne();
    if (!settings) settings = await AISettings.create({});
    res.json({ success: true, data: settings.quickSuggestions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'message is required.' });
    }
    const cleanMessage = sanitiseUserInput(message, 800);
    if (!cleanMessage) {
      return res.status(400).json({ success: false, message: 'Please describe your Vastu concern.' });
    }

    let settings = await AISettings.findOne();
    if (!settings) settings = await AISettings.create({});

    try {
      const { text, source } = await callAI(settings.systemPrompt, cleanMessage);
      const parsed = parseAIJson(text);

      if (!parsed) {
        return res.json({
          success: true,
          data: {
            greeting: 'Namaste!',
            analysis: text.slice(0, 400),
            remedies: [],
            note: settings.commonLines[0] || '',
            consultationCTA: settings.showConsultationCTA ? settings.ctaText : undefined,
          },
          meta: { source, parsed: false },
        });
      }

      res.json({
        success: true,
        data: {
          ...parsed,
          disclaimer: settings.showDisclaimer ? settings.disclaimerText : undefined,
          followUp: settings.showFollowUp ? settings.followUpText : undefined,
        },
        meta: { source, parsed: true },
      });
    } catch (aiError: any) {
      con.error('[AI Chat] provider error:', aiError.message);
      // Demo-mode / provider-failure fallback — never leave the widget broken.
      const block = settings.trustedAdviceBlocks[Math.floor(Math.random() * (settings.trustedAdviceBlocks.length || 1))];
      res.json({
        success: true,
        data: {
          greeting: 'Namaste! 🙏',
          analysis: "I'm having trouble reaching our AI engine right now, but here's some general Vastu guidance.",
          remedies: block ? [{ title: block.title, action: block.content, zone: '', benefit: '' }] : [],
          note: settings.commonLines[0] || '',
          consultationCTA: settings.showConsultationCTA ? settings.ctaText : undefined,
          disclaimer: settings.showDisclaimer ? settings.disclaimerText : undefined,
        },
        meta: { source: 'demo-fallback', parsed: true },
      });
    }
  } catch (error: any) {
    con.error('[AI Chat] error:', error.message);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

export default router;
