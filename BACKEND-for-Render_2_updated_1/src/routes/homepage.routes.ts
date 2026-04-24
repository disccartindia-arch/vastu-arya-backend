/// <reference types="node" />
import { Router } from 'express';
import {
  getHomepageSettings,
  updateHomepageSettings,
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getThemeSettings,
  updateThemeSettings,
} from '../controllers/homepage.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Homepage Settings — public GET, admin PUT
router.get('/settings', getHomepageSettings);
router.put('/settings', authMiddleware, adminMiddleware, updateHomepageSettings);

// Testimonials — public GET, admin CRUD
router.get('/testimonials', getTestimonials);
router.post('/testimonials', authMiddleware, adminMiddleware, createTestimonial);
router.put('/testimonials/:id', authMiddleware, adminMiddleware, updateTestimonial);
router.delete('/testimonials/:id', authMiddleware, adminMiddleware, deleteTestimonial);

// Theme Settings — public GET, admin PUT
router.get('/theme', getThemeSettings);
router.put('/theme', authMiddleware, adminMiddleware, updateThemeSettings);

export default router;
