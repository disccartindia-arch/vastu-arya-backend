import { Router } from 'express';
import {
  getHomepageSettings, updateHomepageSettings,
  getThemeSettings, updateThemeSettings,
  getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
} from '../controllers/homepage.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Settings
router.get('/settings', getHomepageSettings);
router.put('/settings', authMiddleware, adminMiddleware, updateHomepageSettings);

// Theme
router.get('/theme', getThemeSettings);
router.put('/theme', authMiddleware, adminMiddleware, updateThemeSettings);

// Testimonials
router.get('/testimonials', getTestimonials);
router.post('/testimonials', authMiddleware, adminMiddleware, createTestimonial);
router.put('/testimonials/:id', authMiddleware, adminMiddleware, updateTestimonial);
router.delete('/testimonials/:id', authMiddleware, adminMiddleware, deleteTestimonial);

export default router;
