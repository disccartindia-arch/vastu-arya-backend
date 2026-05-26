import { Router } from 'express';
import { getAllBookings, updateBookingStatus, getBookingById, getBookingStatus, createManualBooking } from '../controllers/booking.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/status/:bookingId', getBookingStatus);
router.post('/manual', createManualBooking);

// Admin routes
router.get('/', authMiddleware, adminMiddleware, getAllBookings);
router.get('/:id', authMiddleware, adminMiddleware, getBookingById);
router.put('/:id', authMiddleware, adminMiddleware, updateBookingStatus);
export default router;
