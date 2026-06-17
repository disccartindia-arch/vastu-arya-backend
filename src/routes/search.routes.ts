/// <reference types="node" />
/**
 * search.routes.ts — Unified search across Services, Products and Blogs,
 * plus lightweight search analytics (SearchLog) used to surface trending
 * queries in the admin dashboard.
 */
import { Router, Request, Response } from 'express';
import Service from '../models/Service';
import Product from '../models/Product';
import Blog from '../models/Blog';
import SearchLog from '../models/SearchLog';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { q, sessionId } = req.query;
    const query = String(q || '').trim();
    if (!query) return res.json({ success: true, data: { services: [], products: [], blogs: [] } });

    const regex = { $regex: query, $options: 'i' };
    const [services, products, blogs] = await Promise.all([
      Service.find({ isActive: true, $or: [{ 'title.en': regex }, { 'title.hi': regex }, { category: regex }] }).limit(8),
      Product.find({ isActive: true, $or: [{ 'name.en': regex }, { 'name.hi': regex }, { category: regex }] }).limit(8),
      Blog.find({ isPublished: true, $or: [{ 'title.en': regex }, { 'title.hi': regex }, { tags: regex }] }).limit(8),
    ]);

    const totalResults = services.length + products.length + blogs.length;
    SearchLog.create({ query, results: totalResults, sessionId: sessionId || undefined }).catch(() => {});

    res.json({ success: true, data: { services, products, blogs } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/click', async (req: Request, res: Response) => {
  try {
    const { query, slug, type } = req.body;
    if (!query) return res.status(400).json({ success: false, message: 'query is required' });
    await SearchLog.findOneAndUpdate(
      { query: String(query).toLowerCase().trim() },
      { clickedSlug: slug, clickedType: type },
      { sort: { createdAt: -1 } }
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/trending', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const trending = await SearchLog.aggregate([
      { $group: { _id: '$query', count: { $sum: 1 }, avgResults: { $avg: '$results' } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);
    res.json({ success: true, data: trending });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/zero-results', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const zeroResults = await SearchLog.aggregate([
      { $match: { results: 0 } },
      { $group: { _id: '$query', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 30 },
    ]);
    res.json({ success: true, data: zeroResults });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
