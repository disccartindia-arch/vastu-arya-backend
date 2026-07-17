/**
 * src/routes/account.routes.ts — NEW
 *
 * PRODUCTION HOTFIX ROUND 11 — Phase D.
 *
 * Every route here requires a real logged-in customer (authMiddleware
 * — the SAME middleware already used for admin routes, just without
 * adminMiddleware stacked on top, since any authenticated User, not
 * just admins, should reach these). Mounted at /api/account in
 * server.ts.
 */
import { Router } from 'express';
import {
  getDashboard, getMyBookings, getMyBookingDetail,
  getMyOrders, getMyOrderDetail, getMyPayments,
  getProfile, updateProfile, getActivity, uploadAvatar,
} from '../controllers/account.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { upload } from './upload.routes';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', getDashboard);
router.get('/bookings', getMyBookings);
router.get('/bookings/:id', getMyBookingDetail);
router.get('/orders', getMyOrders);
router.get('/orders/:id', getMyOrderDetail);
router.get('/payments', getMyPayments);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/profile/avatar', upload.single('avatar'), uploadAvatar); // NEW — Cloudinary avatar upload
router.get('/activity', getActivity);

export default router;
