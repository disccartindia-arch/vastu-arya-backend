/**
 * src/routes/bookingStatus.routes.ts — NEW
 *
 * PRODUCTION HOTFIX ROUND 8 — Phase B, Feature 4.
 *
 * Mounted at /api/bookings/status in server.ts, giving:
 *   GET /api/bookings/status/:bookingId
 *
 * Rate-limited with the existing generalLimiter (200 req/15min/IP,
 * already applied to /api globally in server.ts) — no NEW rate limit
 * tier was introduced, since bookingId values are guessable
 * (timestamp-based) and this is an unauthenticated endpoint, so it's
 * worth flagging that the existing general limiter is the only thing
 * standing between this and naive enumeration. The controller mitigates
 * the actual data-exposure risk by returning only 4 non-sensitive
 * fields (see bookingStatus.controller.ts header) rather than by adding
 * a stricter limiter here, since a stricter limiter alone wouldn't have
 * fixed the actual problem (over-exposure of customer PII) — both
 * matter, but field minimization is the one that actually closes the
 * privacy gap; the rate limit is a secondary defense against scraping.
 */
import { Router } from 'express';
import { getBookingStatus } from '../controllers/bookingStatus.controller';

const router = Router();

router.get('/:bookingId', getBookingStatus);

export default router;
