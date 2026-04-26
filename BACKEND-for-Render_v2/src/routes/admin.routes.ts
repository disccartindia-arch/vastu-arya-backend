/// <reference types="node" />
import { Router } from 'express';
import { getDashboardStats, getAllUsers, updateUser, runProductSeed, runServiceSeed } from '../controllers/admin.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.get('/dashboard',    authMiddleware, adminMiddleware, getDashboardStats);
router.get('/users',        authMiddleware, adminMiddleware, getAllUsers);
router.put('/users/:id',    authMiddleware, adminMiddleware, updateUser);
router.post('/seed-products', authMiddleware, adminMiddleware, runProductSeed);
router.post('/seed-services', authMiddleware, adminMiddleware, runServiceSeed);
export default router;
