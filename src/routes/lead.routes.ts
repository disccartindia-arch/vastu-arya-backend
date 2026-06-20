/**
 * src/routes/lead.routes.ts
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 5): added
 *   PATCH /api/leads/:id/service
 * Everything else unchanged from Round 4.
 */
import { Router } from 'express';
import { createLead, updateLeadStatus, updateLeadService } from '../controllers/lead.controller';
import { paymentLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/', paymentLimiter, createLead);
router.patch('/:id/service', updateLeadService);
router.patch('/:id/status', updateLeadStatus);

export default router;
