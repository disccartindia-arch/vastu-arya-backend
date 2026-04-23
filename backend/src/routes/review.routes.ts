/// <reference types="node" />
import { Router, Request, Response } from 'express';
import Review from '../models/Review';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { productId, serviceId, isApproved } = req.query;
    const filter: any = {};
    if (productId) filter.product = productId;
    if (serviceId) filter.service = serviceId;
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';
    const reviews = await Review.find(filter).sort('-createdAt');
    res.json({ success: true, data: reviews });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const review = await Review.create(req.body);
    res.status(201).json({ success: true, data: review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: review });
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
