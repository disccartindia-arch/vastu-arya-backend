/**
 * src/routes/bookingStatus.routes.ts
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 9 — Phase C Part 1):
 * added GET /:bookingId/public, routed to the NEW
 * getPublicBookingStatus controller. Deliberately added as a SIBLING
 * route inside this SAME file/mount point, rather than registering a
 * new top-level app.use() in server.ts — this file is already mounted
 * at /api/bookings/status BEFORE /api/bookings (Phase B fixed this
 * exact class of mount-order bug once already; reusing the
 * already-correct mount point sidesteps re-verifying that ordering
 * question from scratch).
 *
 * Resulting routes:
 *   GET /api/bookings/status/:bookingId          (Phase B, UNCHANGED, 4 fields)
 *   GET /api/bookings/status/:bookingId/public   (NEW, richer public page data)
 *
 * Express resolves these correctly because '/:bookingId/public' is more
 * specific than '/:bookingId' alone, AND because Express tries routes
 * within a single Router in REGISTRATION order — '/:bookingId/public'
 * is registered below; confirmed this does NOT collide with
 * '/:bookingId' because Express's path-to-regexp only matches
 * '/:bookingId' against a single path SEGMENT — a request to
 * '/BK123/public' has TWO segments after the mount point and will not
 * match the single-segment '/:bookingId' pattern at all, regardless of
 * registration order. (This is a different situation from Phase B's
 * actual bug, which was a prefix collision between TWO ROUTERS mounted
 * at different paths — not a same-router param-matching question. Worth
 * being precise about the distinction rather than reflexively
 * reapplying the previous fix's exact reasoning to a different
 * situation.)
 *
 * No authentication on either route — both are intentionally public,
 * per Feature 2's explicit "no login required."
 */
import { Router } from 'express';
import { getBookingStatus } from '../controllers/bookingStatus.controller';
import { getPublicBookingStatus } from '../controllers/publicStatus.controller';

const router = Router();

router.get('/:bookingId/public', getPublicBookingStatus); // NEW — more specific path registered first, though see header note: not actually order-dependent here
router.get('/:bookingId', getBookingStatus);               // Phase B, unchanged

export default router;
