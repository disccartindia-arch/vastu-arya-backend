/// <reference types="node" />
import { Router } from 'express';
import { getAllOrders, updateOrderStatus, getOrderById } from '../controllers/order.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.get('/', authMiddleware, adminMiddleware, getAllOrders);
router.get('/:id', authMiddleware, adminMiddleware, getOrderById);
router.put('/:id', authMiddleware, adminMiddleware, updateOrderStatus);
export default router;
