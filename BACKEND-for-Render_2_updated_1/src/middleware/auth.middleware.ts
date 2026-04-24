/// <reference types="node" />
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = authHeader?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token provided.' });
    const decoded = jwt.verify(token, (process as any).env.JWT_SECRET as string) as any;
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Invalid token.' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only.' });
  next();
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    const token = authHeader?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, (process as any).env.JWT_SECRET as string) as any;
      const user = await User.findById(decoded.id).select('-password');
      if (user) req.user = user;
    }
  } catch (error) {}
  next();
};
