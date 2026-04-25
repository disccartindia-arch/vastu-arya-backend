/// <reference types="node" />
import { Request, Response } from 'express';
import User from '../models/User';
import Order from '../models/Order';
import Booking from '../models/Booking';
import Service from '../models/Service';
import Product from '../models/Product';
import Blog from '../models/Blog';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [totalUsers, totalOrders, totalBookings, totalServices, totalProducts, totalBlogs] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Order.countDocuments(),
      Booking.countDocuments(),
      Service.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true }),
      Blog.countDocuments({ isPublished: true }),
    ]);

    const revenueAgg = await Order.aggregate([
      { $match: { status: { $in: ['paid', 'delivered', 'shipped'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const bookingRevenueAgg = await Booking.aggregate([
      { $match: { status: { $in: ['paid', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalRevenue = (revenueAgg[0]?.total || 0) + (bookingRevenueAgg[0]?.total || 0);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueChart = await Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $in: ['paid', 'delivered'] } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const recentOrders = await Order.find().sort('-createdAt').limit(10);
    const recentBookings = await Booking.find().sort('-createdAt').limit(10);
    const recentUsers = await User.find({ role: 'user' }).sort('-createdAt').limit(5).select('-password');

    res.json({
      success: true,
      data: { stats: { totalUsers, totalOrders, totalBookings, totalServices, totalProducts, totalBlogs, totalRevenue }, revenueChart, recentOrders, recentBookings, recentUsers }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter: any = {};
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const users = await User.find(filter).sort('-createdAt').limit(Number(limit)).skip((Number(page) - 1) * Number(limit)).select('-password');
    const total = await User.countDocuments(filter);
    res.json({ success: true, data: users, total });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role, isActive }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User updated', data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const runProductSeed = async (req: Request, res: Response) => {
  try {
    const { seedProducts } = await import('../utils/seedProducts');
    const result = await seedProducts();
    res.json({
      success: true,
      message: `Products seeded: ${result.inserted} inserted, ${result.skipped} already existed.`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
