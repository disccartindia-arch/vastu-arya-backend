/**
 * src/routes/adminLeads.routes.ts — NEW
 * Mounted at /api/admin/leads in server.ts. Admin-only, matching the
 * pattern used by adminUpiPayments.routes.ts.
 */
import { Router } from 'express';
import { listLeads } from '../controllers/lead.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware, adminMiddleware);
router.get('/', listLeads);

export default router;
