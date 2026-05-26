import { Request, Response } from 'express';
import Booking from '../models/Booking';

export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    const bookings = await Booking.find(filter).sort('-createdAt').limit(Number(limit)).skip((Number(page) - 1) * Number(limit));
    const total = await Booking.countDocuments(filter);
    res.json({ success: true, data: bookings, total });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBookingStatus = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findOne({ bookingId }).select('status bookingId name serviceName amount');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createManualBooking = async (req: Request, res: Response) => {
  try {
    const { name, phone, email, serviceName, amount, formData } = req.body;

    // Check if a pending booking already exists for this phone and service in the last 10 mins
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const existing = await Booking.findOne({
      phone,
      serviceName,
      status: 'pending',
      createdAt: { $gte: tenMinsAgo }
    });

    if (existing) {
      return res.json({ success: true, message: 'Existing pending booking found', data: existing });
    }

    const bookingId = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const booking = await Booking.create({
      bookingId,
      name,
      phone,
      email,
      serviceName: serviceName || 'General Consultation',
      amount: amount || 11,
      formData: formData || {},
      status: 'pending',
    });

    res.status(201).json({ success: true, message: 'Manual booking created', data: booking });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status, notes }, { new: true });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, message: 'Booking updated', data: booking });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBookingById = async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
