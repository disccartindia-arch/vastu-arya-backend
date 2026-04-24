/// <reference types="node" />
import { Router } from 'express';
import { getSettings, updateSettings, getPopups, createPopup, updatePopup, deletePopup, getSliders, getAllSliders, createSlider, updateSlider, deleteSlider } from '../controllers/settings.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.get('/', getSettings);
router.put('/', authMiddleware, adminMiddleware, updateSettings);
router.get('/popups', getPopups);
router.post('/popups', authMiddleware, adminMiddleware, createPopup);
router.put('/popups/:id', authMiddleware, adminMiddleware, updatePopup);
router.delete('/popups/:id', authMiddleware, adminMiddleware, deletePopup);
router.get('/sliders', getSliders);
router.get('/sliders/all', authMiddleware, adminMiddleware, getAllSliders);
router.post('/sliders', authMiddleware, adminMiddleware, createSlider);
router.put('/sliders/:id', authMiddleware, adminMiddleware, updateSlider);
router.delete('/sliders/:id', authMiddleware, adminMiddleware, deleteSlider);
export default router;
