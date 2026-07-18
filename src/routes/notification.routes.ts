import { Router } from 'express';
import { registerDevice, unregisterDevice } from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);
router.post('/register-device', registerDevice);
router.post('/unregister-device', unregisterDevice);

export default router;
