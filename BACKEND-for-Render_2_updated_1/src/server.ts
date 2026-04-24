/// <reference types="node" />
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const env = (process as any).env;
const con = (console as any);

import authRoutes from './routes/auth.routes';
import serviceRoutes from './routes/service.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import bookingRoutes from './routes/booking.routes';
import blogRoutes from './routes/blog.routes';
import paymentRoutes from './routes/payment.routes';
import adminRoutes from './routes/admin.routes';
import settingsRoutes from './routes/settings.routes';
import uploadRoutes from './routes/upload.routes';
import reviewRoutes from './routes/review.routes';
import contentRoutes from './routes/content.routes';
import configRoutes from './routes/config.routes';
import homepageRoutes from './routes/homepage.routes';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
  origin: (origin: any, callback: any) => { callback(null, true); },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

if (env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.get('/health', (req: any, res: any) => {
  res.json({ status: 'ok', message: 'Vastu Arya API v2.0', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/config', configRoutes);
app.use('/api/homepage', homepageRoutes);

app.use('*', (req: any, res: any) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorMiddleware);

const PORT: number = parseInt(env.PORT || '5000', 10);

const connectAndStart = async () => {
  try {
    if (!env.MONGO_URI) throw new Error('MONGO_URI is not set in environment variables');
    await mongoose.connect(env.MONGO_URI as string);
    con.log('MongoDB connected');
    app.listen(PORT, () => {
      con.log(`Vastu Arya Server v2.0 running on port ${PORT}`);
      con.log(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    con.error('Startup failed:', error);
    (process as any).exit(1);
  }
};

connectAndStart();
export default app;
