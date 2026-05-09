/// <reference types="node" />
import { Router, Request, Response } from 'express';
import Blog from '../models/Blog';
import Service from '../models/Service';
import Product from '../models/Product';
import Post from '../models/Post';
import SearchLog from '../models/SearchLog';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// ── Main search endpoint ──────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q = '', limit = 8 } = req.query;
    const query = String(q).trim();
    if (!query || query.length < 2) return res.json({ success: true, data: { blogs: [], services: [], products: [], posts: [] } });

    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const lim = Math.min(Number(limit), 20);

    const [blogs, services, products, posts] = await Promise.all([
      Blog.find({ isPublished: true, $or: [{ 'title.en': regex }, { 'excerpt.en': regex }, { category: regex }, { tags: regex }] }).select('title slug category coverImage publishedAt').limit(lim),
      Service.find({ isActive: true, $or: [{ 'title.en': regex }, { 'shortDesc.en': regex }, { category: regex }] }).select('title slug icon offerPrice category').limit(lim),
      Product.find({ isActive: true, $or: [{ 'name.en': regex }, { category: regex }] }).select('name slug offerPrice images category').limit(lim),
      Post.find({ isPublished: true, $or: [{ caption: regex }, { hashtags: regex }, { category: regex }] }).select('caption media type createdAt').limit(4),
    ]);

    // Log search asynchronously
    SearchLog.create({ query: query.toLowerCase(), results: blogs.length + services.length + products.length, sessionId: req.headers['x-session-id'] as string }).catch(() => {});

    res.json({ success: true, data: { blogs, services, products, posts } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Trending searches (top 10 last 7 days) ───────────────────────────────────
router.get('/trending', async (req: Request, res: Response) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const trending = await SearchLog.aggregate([
      { $match: { createdAt: { $gte: since }, results: { $gt: 0 } } },
      { $group: { _id: '$query', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { query: '$_id', count: 1, _id: 0 } },
    ]);
    res.json({ success: true, data: trending });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Log search click (for analytics) ─────────────────────────────────────────
router.post('/log-click', async (req: Request, res: Response) => {
  try {
    const { query, clickedSlug, clickedType } = req.body;
    await SearchLog.create({ query: (query || '').toLowerCase(), results: 1, clickedSlug, clickedType, sessionId: req.headers['x-session-id'] as string });
    res.json({ success: true });
  } catch {
    res.json({ success: true }); // silent fail
  }
});

// ── Admin: search analytics ───────────────────────────────────────────────────
router.get('/analytics', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [topSearches, failedSearches, totalSearches] = await Promise.all([
      SearchLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$query', count: { $sum: 1 }, avgResults: { $avg: '$results' } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      SearchLog.aggregate([
        { $match: { createdAt: { $gte: since }, results: 0 } },
        { $group: { _id: '$query', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      SearchLog.countDocuments({ createdAt: { $gte: since } }),
    ]);
    res.json({ success: true, data: { topSearches, failedSearches, totalSearches } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
