/// <reference types="node" />
import { Router } from 'express';
import { getAllProducts, getProductBySlug, createProduct, updateProduct, deleteProduct, getAdminProducts } from '../controllers/product.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.get('/', getAllProducts);
router.get('/admin/all', authMiddleware, adminMiddleware, getAdminProducts);
router.get('/:slug', getProductBySlug);
router.post('/', authMiddleware, adminMiddleware, createProduct);
router.put('/:id', authMiddleware, adminMiddleware, updateProduct);
router.delete('/:id', authMiddleware, adminMiddleware, deleteProduct);
export default router;
