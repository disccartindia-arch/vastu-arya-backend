/// <reference types="node" />
import { Router, Request, Response } from 'express';
import PageContent from '../models/PageContent';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Get all content for a page
router.get('/:page', async (req: Request, res: Response) => {
  try {
    const content = await PageContent.find({ page: req.params.page });
    const result: Record<string, Record<string, string>> = {};
    content.forEach(item => {
      if (!result[item.section]) result[item.section] = {};
      result[item.section][item.key] = item.value;
    });
    res.json({ success: true, data: result, raw: content });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all content (admin)
router.get('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const content = await PageContent.find().sort('page section key');
    res.json({ success: true, data: content });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update content (upsert)
router.put('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { page, section, key, value, type, label } = req.body;
    const item = await PageContent.findOneAndUpdate(
      { page, section, key },
      { value, type: type || 'text', label: label || key },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk update
router.post('/bulk', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    const ops = items.map((item: any) => ({
      updateOne: {
        filter: { page: item.page, section: item.section, key: item.key },
        update: { $set: { value: item.value, type: item.type || 'text', label: item.label || item.key } },
        upsert: true
      }
    }));
    await PageContent.bulkWrite(ops);
    res.json({ success: true, message: 'Content updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
