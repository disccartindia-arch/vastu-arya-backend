/// <reference types="node" />
/**
 * review.routes.ts — Product/service review submission and admin moderation.
 * Inline handlers (no separate controller file).
 */
import { Router, Request, Response } from 'express';
import Review from '../models/Review';
import Product from '../models/Product';
import { authMiddleware, adminMiddleware, optionalAuth, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { product, service, isApproved = 'true' } = req.query;
    const filter: any = {};
    if (product) filter.product = product;
    if (service) filter.service = service;
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';
    const reviews = await Review.find(filter).sort('-createdAt');
    res.json({ success: true, data: reviews });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { product, service, name, rating, comment } = req.body;
    if (!rating || !comment) return res.status(400).json({ success: false, message: 'Rating and comment are required.' });
    const review = await Review.create({
      product: product || undefined,
      service: service || undefined,
      user: req.user?._id,
      name: name || req.user?.name || 'Anonymous',
      rating,
      comment,
      isApproved: false,
    });
    res.status(201).json({ success: true, message: 'Review submitted, pending approval.', data: review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/approve', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.product) {
      const approved = await Review.find({ product: review.product, isApproved: true });
      const avg = approved.reduce((s, r) => s + r.rating, 0) / approved.length;
      await Product.findByIdAndUpdate(review.product, { rating: Math.round(avg * 10) / 10, reviewCount: approved.length });
    }
    res.json({ success: true, message: 'Review approved', data: review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Review deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
