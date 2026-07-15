/**
 * aiSettings.routes.ts — Admin CRUD for the AI Assistant's configuration
 * (system prompt, CTA copy, quick-suggestion chips, trusted-advice blocks
 * shown in demo/fallback mode). Public GET so the widget itself can read
 * display copy (quickSuggestions, ctaText) without auth.
 */
import { Router, Request, Response } from 'express';
import AISettings from '../models/AISettings';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// GET /api/ai-settings/public — NEW (Phase E)
// Public, unauthenticated slice used by the frontend AI composer to
// preload quick-suggestion chips and CTA copy without needing admin
// auth. Only exposes visitor-safe fields (no systemPrompt, no
// trustedAdviceBlocks).
router.get('/public', async (_req: Request, res: Response) => {
  try {
    let settings = await AISettings.findOne();
    if (!settings) settings = await AISettings.create({});
    res.json({
      success: true,
      data: {
        quickSuggestions: settings.quickSuggestions,
        ctaText: settings.ctaText,
        showConsultationCTA: settings.showConsultationCTA,
        showDisclaimer: settings.showDisclaimer,
        disclaimerText: settings.disclaimerText,
        showFollowUp: settings.showFollowUp,
        followUpText: settings.followUpText,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    let settings = await AISettings.findOne();
    if (!settings) settings = await AISettings.create({});
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const ALLOWED = [
      'systemPrompt', 'commonLines', 'ctaText', 'showConsultationCTA',
      'showDisclaimer', 'showFollowUp', 'disclaimerText', 'followUpText',
      'quickSuggestions', 'trustedAdviceBlocks',
    ];
    const update: Record<string, any> = {};
    for (const key of ALLOWED) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const settings = await AISettings.findOneAndUpdate({}, update, { new: true, upsert: true, runValidators: true });
    res.json({ success: true, message: 'AI settings updated', data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/reset', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    await AISettings.deleteMany({});
    const settings = await AISettings.create({});
    res.json({ success: true, message: 'AI settings reset to defaults', data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
