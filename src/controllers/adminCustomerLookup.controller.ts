/**
 * src/controllers/adminCustomerLookup.controller.ts — NEW
 *
 * PRODUCTION HOTFIX ROUND 11 — Phase D, admin requirement.
 *
 * Read-only. Searches Booking + Order + Lead by name/email/phone/
 * bookingId/orderId — this is the ONE place in the entire system
 * where searching BY contact info is appropriate, because it's an
 * authenticated ADMIN action (behind authMiddleware + adminMiddleware,
 * same as every other admin route), not a customer-facing automatic-
 * matching mechanism. The distinction matters: the linkage strategy's
 * security finding was specifically about NOT auto-linking a
 * customer's OWN account based on unverified contact info — an admin
 * manually searching across all records, with full audit visibility
 * via existing admin auth, is a completely different trust boundary
 * and was never the thing the strategy ruled out.
 *
 * No write operations anywhere in this file, per the brief's explicit
 * "read-only, no customer data editing from this screen."
 */
import { Request, Response } from 'express';
import Booking from '../models/Booking';
import Order from '../models/Order';
import Lead from '../models/Lead';

export const searchCustomers = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const query = String(q || '').trim();
    if (!query) return res.json({ success: true, data: { bookings: [], orders: [], leads: [] } });

    const re = { $regex: query, $options: 'i' };

    const [bookings, orders, leads] = await Promise.all([
      Booking.find({ $or: [{ name: re }, { phone: re }, { email: re }, { bookingId: re }] })
        .sort('-createdAt').limit(25)
        .select('bookingId name phone email serviceName amount paymentStatus bookingStatus userId createdAt'),
      Order.find({ $or: [{ 'customerInfo.name': re }, { 'customerInfo.phone': re }, { 'customerInfo.email': re }, { orderId: re }] })
        .sort('-createdAt').limit(25)
        .select('orderId customerInfo totalAmount status user createdAt'),
      (Lead as any).find({ $or: [{ name: re }, { phone: re }, { email: re }] }) // cast: Lead.find() has the same TS2349 union-type overload issue as other models in this project
        .sort('-createdAt').limit(25)
        .select('name phone email serviceName status createdAt'),
    ]);

    res.json({ success: true, data: { bookings, orders, leads } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/customers/booking/:bookingId — full detail, admin view
// (includes adminUser/adminNotes on the timeline, unlike the customer-
// facing and public equivalents — this is the admin's own audit trail,
// not customer-exposed data).
export const getCustomerBookingDetail = async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const StatusAuditLog = (await import('../models/StatusAuditLog')).default;
    const history = await (StatusAuditLog as any).find({ bookingId: booking._id.toString() }).sort('createdAt');

    res.json({ success: true, data: { booking, history } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
