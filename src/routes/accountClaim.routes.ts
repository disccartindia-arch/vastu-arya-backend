/**
 * src/routes/accountClaim.routes.ts — NEW
 *
 * PRODUCTION HOTFIX ROUND 11 — Phase D.
 *
 * Deliberately a SEPARATE route file from account.routes.ts, even
 * though both are mounted under the /api/account prefix, for one
 * reason: this endpoint needs `paymentLimiter` (20 req/10min) layered
 * ON TOP of `authMiddleware`, not the unthrottled pattern every other
 * /account route uses — per the claim flow's security design (see
 * accountClaim.controller.ts's header), this is a realistic guessing-
 * attack target and needs its own stricter rate limit.
 *
 * MOUNT-ORDER NOTE (verified explicitly, not assumed — this project
 * has a documented history of exactly this class of bug): this file
 * is mounted at /api/account/claim, and account.routes.ts is mounted
 * at /api/account — these prefixes DO overlap
 * ('/api/account/claim'.startsWith('/api/account') is true), which is
 * the same shape as the earlier bookingStatus.routes.ts mount-order
 * bug. UNLIKE that earlier case, this one is safe regardless of
 * registration order for a different, verified reason: this router
 * only defines a POST route, while every route in account.routes.ts
 * is GET — Express matches on METHOD as well as PATH, so a POST
 * request to /api/account/claim can never match any handler inside
 * account.routes.ts's all-GET router, regardless of which router is
 * mounted first. server.ts still registers this file before
 * account.routes.ts as defensive practice, but that ordering is not
 * what makes this safe — the method mismatch is.
 */
import { Router } from 'express';
import { claimBooking } from '../controllers/accountClaim.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { paymentLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/', authMiddleware, paymentLimiter, claimBooking);

export default router;
