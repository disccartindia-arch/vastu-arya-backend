/// <reference types="node" />
import { Router } from 'express';
import { getAllServices, getServiceBySlug, createService, updateService, deleteService } from '../controllers/service.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.get('/', getAllServices);
router.get('/:slug', getServiceBySlug);
router.post('/', authMiddleware, adminMiddleware, createService);
router.put('/:id', authMiddleware, adminMiddleware, updateService);
router.delete('/:id', authMiddleware, adminMiddleware, deleteService);
export default router;
