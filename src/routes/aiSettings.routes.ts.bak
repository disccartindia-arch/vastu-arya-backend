/// <reference types="node" />
import { Router, Request, Response } from 'express';
import AISettings from '../models/AISettings';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// GET — returns settings (creates defaults if first time)
router.get('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    let settings = await AISettings.findOne();
    if (!settings) settings = await AISettings.create({});
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT — update settings
router.put('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const allowed = [
      'systemPrompt', 'commonLines', 'ctaText',
      'showConsultationCTA', 'showDisclaimer', 'showFollowUp',
      'disclaimerText', 'followUpText', 'quickSuggestions', 'trustedAdviceBlocks',
    ];
    const update: any = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const settings = await AISettings.findOneAndUpdate({}, update, { new: true, upsert: true });
    res.json({ success: true, data: settings, message: 'AI settings saved successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST — reset to defaults
router.post('/reset', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    await AISettings.deleteMany({});
    const settings = await AISettings.create({});
    res.json({ success: true, data: settings, message: 'Reset to defaults' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
