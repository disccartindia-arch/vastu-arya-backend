/// <reference types="node" />
import { Router } from 'express';
import { getAllBookings, updateBookingStatus, getBookingById } from '../controllers/booking.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.get('/', authMiddleware, adminMiddleware, getAllBookings);
router.get('/:id', authMiddleware, adminMiddleware, getBookingById);
router.put('/:id', authMiddleware, adminMiddleware, updateBookingStatus);
export default router;
