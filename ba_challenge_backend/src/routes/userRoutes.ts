import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';
import { upload } from '../config/upload';

const router = Router();

router.use(authMiddleware);

router.get('/stats', userController.getStats);
router.put('/profile', userController.updateProfile);

router.post('/avatar', upload.single('avatar'), userController.uploadAvatar);

router.get('/:id', userController.getUserById);

export default router;
