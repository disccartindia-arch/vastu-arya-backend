/// <reference types="node" />
import { Router } from 'express';
import { getDashboardStats, getAllUsers, updateUser } from '../controllers/admin.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.get('/dashboard', authMiddleware, adminMiddleware, getDashboardStats);
router.get('/users', authMiddleware, adminMiddleware, getAllUsers);
router.put('/users/:id', authMiddleware, adminMiddleware, updateUser);
export default router;
